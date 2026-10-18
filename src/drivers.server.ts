import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { chmodSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { isIP } from "node:net";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import type {
  DriverRegistrationInput,
  DriverRegistrationReceipt,
  DriverServiceZone,
  DriverVehicleType,
  StoredDriverRegistration,
} from "./lib/driver-types.ts";

const MAX_BODY_BYTES = 8 * 1024;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 20;
const MAX_RATE_KEYS = 1;
const ADMIN_TOKEN_MIN_LENGTH = 32;
const EXPLICIT_ORIGINS = new Set([
  "https://visit-hijaz.com",
  "https://www.visit-hijaz.com",
  "https://drivers.visit-hijaz.com",
]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_FIELDS = [
  "idempotencyKey",
  "fullName",
  "phone",
  "serviceZones",
  "vehicleType",
  "vehicleModel",
  "consent",
] as const;
const rateBuckets = new Map<string, { startedAt: number; count: number }>();

class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let database: DatabaseSync | undefined;
let databaseDataDir: string | undefined;

function response(status: number, value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "x-content-type-options": "nosniff",
    },
  });
}

function fail(status: number, message: string): never {
  throw new ApiError(status, message);
}

function secureDataDir(): string {
  const dataDir = resolve(
    process.env["BOOKING_DATA_DIR"] || "/opt/pilgrimage-journeys/shared/bookings",
  );
  mkdirSync(dataDir, { recursive: true, mode: 0o700 });
  chmodSync(dataDir, 0o700);
  return dataDir;
}

function getAdminToken(dataDir: string): string | null {
  const envToken = process.env["BOOKING_ADMIN_TOKEN"];
  if (envToken !== undefined) {
    return envToken.length >= ADMIN_TOKEN_MIN_LENGTH && !/\s/.test(envToken) ? envToken : null;
  }
  const tokenPath = process.env["BOOKING_ADMIN_TOKEN_FILE"]
    ? resolve(process.env["BOOKING_ADMIN_TOKEN_FILE"])
    : join(dataDir, "admin-token");
  try {
    const metadata = statSync(tokenPath);
    if (!metadata.isFile() || (metadata.mode & 0o077) !== 0) return null;
    const token = readFileSync(tokenPath, "utf8").replace(/[\r\n]+$/, "");
    return token.length >= ADMIN_TOKEN_MIN_LENGTH && !/\s/.test(token) ? token : null;
  } catch {
    return null;
  }
}

function restrictDatabaseFiles(dataDir: string): void {
  for (const path of [
    join(dataDir, "drivers.sqlite"),
    join(dataDir, "drivers.sqlite-wal"),
    join(dataDir, "drivers.sqlite-shm"),
  ]) {
    try {
      chmodSync(path, 0o600);
    } catch {
      // SQLite creates WAL/SHM files lazily; absent sidecars need no adjustment.
    }
  }
}

function getDatabase(dataDir: string): DatabaseSync {
  if (database && databaseDataDir === dataDir) {
    restrictDatabaseFiles(dataDir);
    return database;
  }
  if (database) database.close();
  const dbPath = join(dataDir, "drivers.sqlite");
  const db = new DatabaseSync(dbPath);
  chmodSync(dbPath, 0o600);
  db.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS driver_registrations (
      id TEXT PRIMARY KEY,
      idempotency_key TEXT NOT NULL UNIQUE,
      payload_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      registration_json TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS driver_registrations_created_at_idx
      ON driver_registrations(created_at DESC);
  `);
  database = db;
  databaseDataDir = dataDir;
  restrictDatabaseFiles(dataDir);
  return db;
}

function isLoopback(hostname: string): boolean {
  const normalized = hostname.toLowerCase().replace(/^\[|\]$/g, "");
  return (
    normalized === "localhost" ||
    normalized === "::1" ||
    (isIP(normalized) === 4 && normalized.startsWith("127."))
  );
}

function validOrigin(request: Request): boolean {
  const suppliedOrigin = request.headers.get("origin");
  if (!suppliedOrigin) return false;
  try {
    const parsed = new URL(suppliedOrigin);
    if (parsed.origin !== suppliedOrigin) return false;
    if (EXPLICIT_ORIGINS.has(parsed.origin)) return true;
    const requestUrl = new URL(request.url);
    return (
      parsed.origin === requestUrl.origin &&
      (requestUrl.protocol === "http:" || requestUrl.protocol === "https:") &&
      isLoopback(requestUrl.hostname)
    );
  } catch {
    return false;
  }
}

function authorized(request: Request, token: string): boolean {
  const match = /^Bearer ([^\s]+)$/i.exec(request.headers.get("authorization") ?? "");
  if (!match) return false;
  const actualDigest = createHash("sha256").update(match[1]!).digest();
  const expectedDigest = createHash("sha256").update(token).digest();
  return timingSafeEqual(actualDigest, expectedDigest);
}

function enforceRateLimit(): void {
  const now = Date.now();
  for (const [key, value] of rateBuckets) {
    if (now - value.startedAt >= RATE_WINDOW_MS) rateBuckets.delete(key);
  }
  const key = "global";
  let bucket = rateBuckets.get(key);
  if (!bucket) {
    if (!rateBuckets.has(key) && rateBuckets.size >= MAX_RATE_KEYS) {
      const oldest = rateBuckets.keys().next().value as string | undefined;
      if (oldest !== undefined) rateBuckets.delete(oldest);
    }
    bucket = { startedAt: now, count: 0 };
    rateBuckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > RATE_LIMIT)
    fail(429, "Too many registration requests. Please try again shortly.");
}

async function readJson(request: Request): Promise<unknown> {
  const contentType = request.headers.get("content-type") ?? "";
  if (!/^application\/json(?:\s*;\s*charset\s*=\s*(?:utf-8|"utf-8"))?\s*$/i.test(contentType)) {
    fail(415, "Content-Type must be application/json.");
  }
  const declaredLength = request.headers.get("content-length");
  if (
    declaredLength &&
    (!/^\d+$/.test(declaredLength) || Number(declaredLength) > MAX_BODY_BYTES)
  ) {
    fail(413, "Request body is too large.");
  }
  if (!request.body) fail(400, "A JSON request body is required.");
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > MAX_BODY_BYTES) {
        await reader.cancel();
        fail(413, "Request body is too large.");
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    body.set(chunk, offset);
    offset += chunk.byteLength;
  }
  try {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(body);
    return JSON.parse(text) as unknown;
  } catch {
    fail(400, "Request body must contain valid UTF-8 JSON.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseRegistration(value: unknown): DriverRegistrationInput {
  if (!isRecord(value)) fail(400, "Request body must be a JSON object.");
  if (Object.keys(value).some((key) => !(ALLOWED_FIELDS as readonly string[]).includes(key))) {
    fail(400, "Request contains unsupported fields.");
  }
  if (ALLOWED_FIELDS.some((key) => !(key in value)))
    fail(400, "Required registration fields are missing.");
  if (value["consent"] !== true) fail(400, "Registration consent is required.");

  const idempotencyKey = value["idempotencyKey"];
  if (typeof idempotencyKey !== "string" || !UUID_PATTERN.test(idempotencyKey)) {
    fail(422, "Idempotency key must be a UUID.");
  }
  const fullName = typeof value["fullName"] === "string" ? value["fullName"].trim() : "";
  if (fullName.length < 2 || fullName.length > 100)
    fail(422, "Full name must be 2 to 100 characters.");
  const phone = typeof value["phone"] === "string" ? value["phone"].trim() : "";
  const digits = phone.replace(/\D/g, "");
  if (
    phone.length > 30 ||
    !/^\+?[0-9().\-\s]+$/.test(phone) ||
    digits.length < 7 ||
    digits.length > 20
  ) {
    fail(422, "Phone number must contain 7 to 20 digits and valid phone punctuation.");
  }
  if (
    !Array.isArray(value["serviceZones"]) ||
    value["serviceZones"].length < 1 ||
    value["serviceZones"].length > 2 ||
    value["serviceZones"].some((zone) => zone !== "makkah" && zone !== "madinah") ||
    new Set(value["serviceZones"]).size !== value["serviceZones"].length
  ) {
    fail(422, "Choose one or two unique supported service zones.");
  }
  if (
    value["vehicleType"] !== "sedan" &&
    value["vehicleType"] !== "suv" &&
    value["vehicleType"] !== "hiace"
  ) {
    fail(422, "Vehicle type is invalid.");
  }
  const vehicleModel =
    typeof value["vehicleModel"] === "string" ? value["vehicleModel"].trim() : "";
  if (vehicleModel.length < 2 || vehicleModel.length > 80) {
    fail(422, "Vehicle model must be 2 to 80 characters.");
  }
  return {
    idempotencyKey: idempotencyKey.toLowerCase(),
    fullName,
    phone,
    serviceZones: [...value["serviceZones"]] as DriverServiceZone[],
    vehicleType: value["vehicleType"] as DriverVehicleType,
    vehicleModel,
    consent: true,
  };
}

function canonicalHash(input: DriverRegistrationInput): string {
  const canonical = JSON.stringify({
    fullName: input.fullName,
    phone: input.phone,
    serviceZones: input.serviceZones,
    vehicleType: input.vehicleType,
    vehicleModel: input.vehicleModel,
    consent: input.consent,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

function receipt(registration: StoredDriverRegistration): DriverRegistrationReceipt {
  return { id: registration.id, reference: registration.reference, status: registration.status };
}

function createRegistration(
  db: DatabaseSync,
  input: DriverRegistrationInput,
): { registration: StoredDriverRegistration; duplicate: boolean } {
  const hash = canonicalHash(input);
  db.exec("BEGIN IMMEDIATE");
  try {
    const existing = db
      .prepare(
        "SELECT payload_hash, registration_json FROM driver_registrations WHERE idempotency_key = ?",
      )
      .get(input.idempotencyKey) as { payload_hash: string; registration_json: string } | undefined;
    if (existing) {
      if (existing.payload_hash !== hash)
        fail(409, "Idempotency key was already used with a different request.");
      db.exec("COMMIT");
      return {
        registration: JSON.parse(existing.registration_json) as StoredDriverRegistration,
        duplicate: true,
      };
    }
    const now = new Date().toISOString();
    const registration: StoredDriverRegistration = {
      id: randomUUID(),
      reference: `VH-D-${randomBytes(5).toString("hex").toUpperCase()}`,
      createdAt: now,
      consentAt: now,
      fullName: input.fullName,
      phone: input.phone,
      serviceZones: input.serviceZones,
      vehicleType: input.vehicleType,
      vehicleModel: input.vehicleModel,
      status: "pending_review",
    };
    db.prepare(
      `INSERT INTO driver_registrations (id, idempotency_key, payload_hash, created_at, registration_json)
       VALUES (?, ?, ?, ?, ?)`,
    ).run(
      registration.id,
      input.idempotencyKey,
      hash,
      registration.createdAt,
      JSON.stringify(registration),
    );
    db.exec("COMMIT");
    restrictDatabaseFiles(databaseDataDir ?? "");
    return { registration, duplicate: false };
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      // The transaction may already have rolled back.
    }
    throw error;
  }
}

async function route(request: Request, pathname: string): Promise<Response | null> {
  const isCreate = pathname === "/api/driver-registrations";
  const isAdminList = pathname === "/api/admin/drivers";
  if (!isCreate && !isAdminList) return null;
  if ((isCreate && request.method !== "POST") || (isAdminList && request.method !== "GET")) {
    return response(405, { error: "Method not allowed." });
  }

  const dataDir = secureDataDir();
  const token = getAdminToken(dataDir);
  if (!token) return response(503, { error: "Driver registration service is not configured." });

  if (isCreate) {
    if (!validOrigin(request)) return response(403, { error: "Request origin is not allowed." });
    enforceRateLimit();
    const input = parseRegistration(await readJson(request));
    const result = createRegistration(getDatabase(dataDir), input);
    return response(result.duplicate ? 200 : 201, receipt(result.registration));
  }

  if (!authorized(request, token)) {
    return response(401, { error: "Administrator authorization is required." });
  }
  const db = getDatabase(dataDir);
  const rows = db
    .prepare(
      "SELECT registration_json FROM driver_registrations ORDER BY created_at DESC, id DESC LIMIT 100",
    )
    .all() as Array<{ registration_json: string }>;
  return response(200, {
    drivers: rows.map((row) => JSON.parse(row.registration_json) as StoredDriverRegistration),
  });
}

/** Handles driver registration routes; unrelated paths are left to the caller. */
export async function handleDriverApi(request: Request): Promise<Response | null> {
  let pathname: string;
  try {
    pathname = new URL(request.url).pathname;
  } catch {
    return null;
  }
  try {
    return await route(request, pathname);
  } catch (error) {
    if (error instanceof ApiError) return response(error.status, { error: error.message });
    // Do not expose or log database errors, request bodies, personal data, or credentials.
    return response(503, { error: "Driver registration service is temporarily unavailable." });
  }
}
