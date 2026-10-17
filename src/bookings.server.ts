import { createHash, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import { chmodSync, mkdirSync, readFileSync, statSync } from "node:fs";
import { isIP } from "node:net";
import { join, resolve } from "node:path";
import { DatabaseSync } from "node:sqlite";
import { calcFare, fareConfigs, promotions, stops, vehicles } from "./lib/mock-data.ts";
import type {
  BookingInput,
  BookingPoint,
  BookingReceipt,
  BookingZone,
  BookingVehicle,
  StoredBooking,
} from "./lib/booking-types.ts";
import { DEFAULT_ORIGIN_POINTS } from "./lib/map-locations.ts";

const MAX_BODY_BYTES = 16 * 1024;
const RATE_WINDOW_MS = 60_000;
const RATE_LIMIT = 30;
const MAX_RATE_KEYS = 2_048;
const ADMIN_TOKEN_MIN_LENGTH = 32;
const EXPLICIT_ORIGINS = new Set([
  "https://visit-hijaz.com",
  "https://www.visit-hijaz.com",
  "https://admin.visit-hijaz.com",
]);
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

let database: DatabaseSync | undefined;
let initializedDataDir: string | undefined;
let databaseDataDir: string | undefined;
const rateBuckets = new Map<string, { startedAt: number; count: number }>();

function response(status: number, value: unknown): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function fail(status: number, message: string): never {
  throw new ApiError(status, message);
}

function secureDataDir(): string {
  const dataDir = resolve(
    process.env["BOOKING_DATA_DIR"] || "/opt/pilgrimage-journeys/shared/bookings",
  );
  if (initializedDataDir !== dataDir) {
    mkdirSync(dataDir, { recursive: true, mode: 0o700 });
    chmodSync(dataDir, 0o700);
    initializedDataDir = dataDir;
  }
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

function getDatabase(dataDir: string): DatabaseSync {
  if (database && databaseDataDir === dataDir) return database;
  if (database) database.close();
  const dbPath = join(dataDir, "bookings.sqlite");
  const db = new DatabaseSync(dbPath);
  chmodSync(dbPath, 0o600);
  db.exec("PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; PRAGMA foreign_keys=ON;");
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id TEXT PRIMARY KEY,
      idempotency_key TEXT NOT NULL UNIQUE,
      payload_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      booking_json TEXT NOT NULL,
      fare_snapshot_json TEXT
    );
    CREATE INDEX IF NOT EXISTS bookings_created_at_idx ON bookings(created_at DESC);
  `);
  // SQLite creates WAL/SHM files beside the database. Restrict them after opening too.
  for (const sidecar of [`${dbPath}-wal`, `${dbPath}-shm`]) {
    try {
      chmodSync(sidecar, 0o600);
    } catch {
      /* Sidecar may not exist until the first write. */
    }
  }
  database = db;
  databaseDataDir = dataDir;
  return db;
}

function validOrigin(request: Request): boolean {
  const suppliedOrigin = request.headers.get("origin");
  if (!suppliedOrigin) return false;
  try {
    const parsed = new URL(suppliedOrigin);
    if (
      parsed.origin !== suppliedOrigin ||
      (parsed.protocol !== "https:" && parsed.protocol !== "http:")
    )
      return false;
    if (EXPLICIT_ORIGINS.has(parsed.origin)) return true;
    return parsed.origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function authorized(request: Request, token: string): boolean {
  const value = request.headers.get("authorization") ?? "";
  const match = /^Bearer ([^\s]+)$/i.exec(value);
  if (!match) return false;
  const actualDigest = createHash("sha256").update(match[1]!).digest();
  const expectedDigest = createHash("sha256").update(token).digest();
  return timingSafeEqual(actualDigest, expectedDigest);
}

function rateKey(request: Request): string {
  if (process.env["BOOKING_TRUST_PROXY"] === "1") {
    const firstForwarded = request.headers.get("x-forwarded-for")?.split(",", 1)[0]?.trim();
    if (firstForwarded && isIP(firstForwarded)) return `ip:${firstForwarded}`;
  }
  // Request exposes no peer address; never trust forwarded headers by default.
  return "global";
}

function enforceRateLimit(request: Request): void {
  const now = Date.now();
  for (const [key, value] of rateBuckets) {
    if (now - value["startedAt"] >= RATE_WINDOW_MS) rateBuckets.delete(key);
  }
  const key = rateKey(request);
  let bucket = rateBuckets.get(key);
  if (!bucket || now - bucket.startedAt >= RATE_WINDOW_MS) {
    if (!rateBuckets.has(key) && rateBuckets.size >= MAX_RATE_KEYS) {
      const oldest = rateBuckets.keys().next().value as string | undefined;
      if (oldest !== undefined) rateBuckets.delete(oldest);
    }
    bucket = { startedAt: now, count: 0 };
    rateBuckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > RATE_LIMIT) fail(429, "Too many booking requests. Please try again shortly.");
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
      size += value["byteLength"];
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
  let text: string;
  try {
    text = new TextDecoder("utf-8", { fatal: true }).decode(body);
    return JSON.parse(text) as unknown;
  } catch {
    fail(400, "Request body must contain valid UTF-8 JSON.");
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function rejectUnknownKeys(value: Record<string, unknown>, allowed: readonly string[]): void {
  if (Object.keys(value).some((key) => !allowed.includes(key)))
    fail(400, "Request contains unsupported fields.");
}

function validatePoint(value: unknown): BookingPoint | null {
  if (value === null) return null;
  if (
    !isRecord(value) ||
    Object.keys(value).length !== 2 ||
    !("lat" in value) ||
    !("lng" in value)
  ) {
    fail(422, "Coordinates must contain latitude and longitude.");
  }
  const lat = value["lat"];
  const lng = value["lng"];
  if (
    typeof lat !== "number" ||
    typeof lng !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lng) ||
    lat < 16 ||
    lat > 33 ||
    lng < 34 ||
    lng > 56
  ) {
    fail(422, "Coordinates are outside the supported service region.");
  }
  return { lat, lng };
}

function parsePickupAt(value: unknown): string {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)
  ) {
    fail(422, "Pickup time must be an ISO datetime with an explicit time zone.");
  }
  const [year, month, day] = value["slice"](0, 10).split("-").map(Number);
  const timePart = value["slice"](11).match(/^(\d{2}):(\d{2})(?::(\d{2}))?/);
  const leapYear = year! % 4 === 0 && (year! % 100 !== 0 || year! % 400 === 0);
  const daysInMonth = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month! - 1];
  if (
    !daysInMonth ||
    day! < 1 ||
    day! > daysInMonth ||
    !timePart ||
    Number(timePart[1]) > 23 ||
    Number(timePart[2]) > 59 ||
    Number(timePart[3] ?? 0) > 59
  ) {
    fail(422, "Pickup time must be a valid ISO datetime.");
  }
  const time = Date.parse(value);
  const now = Date.now();
  const oneYear = new Date(now);
  oneYear.setUTCFullYear(oneYear.getUTCFullYear() + 1);
  if (!Number.isFinite(time) || time <= now || time > oneYear.getTime()) {
    fail(422, "Pickup time must be in the future and within one year.");
  }
  return new Date(time).toISOString();
}

function parseBooking(value: unknown): BookingInput {
  if (!isRecord(value)) fail(400, "Request body must be a JSON object.");
  const required = [
    "idempotencyKey",
    "customerName",
    "phone",
    "zone",
    "vehicle",
    "stopIds",
    "pickupText",
    "departure",
    "destination",
    "pickupAt",
    "consent",
  ];
  const allowed = [...required, "notes", "promoCode"];
  rejectUnknownKeys(value, allowed);
  if (required.some((key) => !(key in value))) fail(400, "Required booking fields are missing.");
  if (value["consent"] !== true) fail(400, "Booking consent is required.");

  const idempotencyKey = value["idempotencyKey"];
  if (typeof idempotencyKey !== "string" || !UUID_PATTERN.test(idempotencyKey))
    fail(422, "Idempotency key must be a UUID.");
  const customerName =
    typeof value["customerName"] === "string" ? value["customerName"].trim() : "";
  if (customerName.length < 2 || customerName.length > 100)
    fail(422, "Customer name must be 2 to 100 characters.");
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
  if (value["zone"] !== "makkah" && value["zone"] !== "madinah") fail(422, "Zone is invalid.");
  const zone = value["zone"] as BookingZone;
  if (value["vehicle"] !== "sedan" && value["vehicle"] !== "suv" && value["vehicle"] !== "hiace")
    fail(422, "Vehicle is invalid.");
  const vehicle = value["vehicle"] as BookingVehicle;
  if (
    !Array.isArray(value["stopIds"]) ||
    value["stopIds"].length > 20 ||
    value["stopIds"].some(
      (id) => typeof id !== "string" || !stops[zone].some((stop) => stop.id === id),
    ) ||
    new Set(value["stopIds"]).size !== value["stopIds"].length
  ) {
    fail(422, "One or more selected stops are invalid.");
  }
  if (typeof value["pickupText"] !== "string") fail(422, "Pickup text must be a string.");
  const pickupText = typeof value["pickupText"] === "string" ? value["pickupText"].trim() : "";
  if (pickupText.length > 120) fail(422, "Pickup text must be at most 120 characters.");
  const departure = validatePoint(value["departure"]);
  const destination = validatePoint(value["destination"]);
  if (value["stopIds"].length === 0 && destination === null)
    fail(422, "Select at least one stop or provide a custom destination.");
  const pickupAt = parsePickupAt(value["pickupAt"]);
  const notes = value["notes"] === undefined ? "" : value["notes"];
  if (typeof notes !== "string" || notes.length > 1000)
    fail(422, "Notes must be at most 1000 characters.");
  const promoCode = value["promoCode"] === undefined ? "" : value["promoCode"];
  if (typeof promoCode !== "string" || promoCode.length > 30)
    fail(422, "Promotion code must be at most 30 characters.");
  return {
    idempotencyKey: idempotencyKey.toLowerCase(),
    customerName,
    phone,
    zone,
    vehicle,
    stopIds: [...value["stopIds"]] as string[],
    pickupText,
    departure,
    destination,
    pickupAt,
    notes: notes.trim(),
    promoCode: promoCode.trim().toUpperCase(),
    consent: true,
  };
}

function isCustom(
  input: Pick<BookingInput, "zone" | "pickupText" | "departure" | "destination">,
): boolean {
  const origin = DEFAULT_ORIGIN_POINTS[input.zone];
  return (
    input.pickupText.length > 0 ||
    (input.departure !== null &&
      (input.departure.lat !== origin.lat || input.departure.lng !== origin.lng)) ||
    input.destination !== null
  );
}

function fareFor(input: BookingInput): {
  estimatedFare: number | null;
  fareSnapshot: string | null;
  status: StoredBooking["status"];
} {
  let discountPct = 0;
  if (input.promoCode) {
    const promotion = promotions.find((item) => item.code.toUpperCase() === input.promoCode);
    if (!promotion || !promotion.active) fail(422, "Promotion code is invalid or inactive.");
    const expires = Date.parse(`${promotion.expiresAt}T23:59:59.999+03:00`);
    if (!Number.isFinite(expires) || expires < Date.now()) fail(422, "Promotion code has expired.");
    if (promotion.targetCard !== input.zone)
      fail(422, "Promotion code does not apply to this zone.");
    discountPct = promotion.discountPercentage;
  }
  if (isCustom(input))
    return { estimatedFare: null, fareSnapshot: null, status: "quote_requested" };
  const config = fareConfigs.find((item) => item.zone === input.zone);
  const vehicle = vehicles.find((item) => item.id === input.vehicle);
  if (!config || !vehicle) fail(422, "Fare configuration is unavailable.");
  const km = input.stopIds.reduce(
    (distance, id) => distance + (stops[input.zone].find((stop) => stop.id === id)?.km ?? 0),
    0,
  );
  const fare = calcFare({
    config,
    km,
    vehicleMultiplier: vehicle.multiplier,
    surgeOn: false,
    discountPct,
  });
  const snapshot = { ...fare, currency: "SAR" as const };
  return {
    estimatedFare: fare.total,
    fareSnapshot: JSON.stringify(snapshot),
    status: "pending_review",
  };
}

function canonicalHash(input: BookingInput): string {
  const canonical = JSON.stringify({
    customerName: input.customerName,
    phone: input.phone,
    zone: input.zone,
    vehicle: input.vehicle,
    stopIds: input.stopIds,
    pickupText: input.pickupText,
    departure: input.departure,
    destination: input.destination,
    pickupAt: input.pickupAt,
    notes: input.notes,
    promoCode: input.promoCode,
    consent: input.consent,
  });
  return createHash("sha256").update(canonical).digest("hex");
}

function receipt(booking: StoredBooking): BookingReceipt {
  return {
    id: booking.id,
    reference: booking.reference,
    status: booking.status,
    estimatedFare: booking.estimatedFare,
    currency: "SAR",
  };
}

function createBooking(
  db: DatabaseSync,
  input: BookingInput,
): { booking: StoredBooking; duplicate: boolean } {
  const hash = canonicalHash(input);
  db.exec("BEGIN IMMEDIATE");
  try {
    const existing = db
      .prepare("SELECT payload_hash, booking_json FROM bookings WHERE idempotency_key = ?")
      .get(input.idempotencyKey) as { payload_hash: string; booking_json: string } | undefined;
    if (existing) {
      if (existing.payload_hash !== hash)
        fail(409, "Idempotency key was already used with a different request.");
      db.exec("COMMIT");
      return { booking: JSON.parse(existing.booking_json) as StoredBooking, duplicate: true };
    }
    const fare = fareFor(input);
    const now = new Date().toISOString();
    const booking: StoredBooking = {
      id: randomUUID(),
      reference: `VH-${randomBytes(5).toString("hex").toUpperCase()}`,
      createdAt: now,
      updatedAt: now,
      consentAt: now,
      customerName: input.customerName,
      phone: input.phone,
      zone: input.zone,
      vehicle: input.vehicle,
      stopIds: input.stopIds,
      pickupText: input.pickupText,
      departure: input.departure,
      destination: input.destination,
      pickupAt: input.pickupAt,
      notes: input.notes,
      promoCode: input.promoCode,
      consent: input.consent,
      status: fare.status,
      estimatedFare: fare.estimatedFare,
      currency: "SAR",
    };
    db.prepare(
      `INSERT INTO bookings (id, idempotency_key, payload_hash, created_at, booking_json, fare_snapshot_json)
      VALUES (?, ?, ?, ?, ?, ?)`,
    ).run(
      booking.id,
      input.idempotencyKey,
      hash,
      booking.createdAt,
      JSON.stringify(booking),
      fare.fareSnapshot,
    );
    db.exec("COMMIT");
    return { booking, duplicate: false };
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* Transaction may already have rolled back. */
    }
    throw error;
  }
}

function patchBooking(db: DatabaseSync, id: string, patch: Record<string, unknown>): StoredBooking {
  const allowed = ["departure", "destination", "pickupText"] as const;
  rejectUnknownKeys(patch, allowed);
  if (Object.keys(patch).length === 0) fail(400, "At least one supported field is required.");
  const existingRow = db.prepare("SELECT booking_json FROM bookings WHERE id = ?").get(id) as
    { booking_json: string } | undefined;
  if (!existingRow) fail(404, "Booking not found.");
  const booking = JSON.parse(existingRow.booking_json) as StoredBooking;
  if ("departure" in patch) booking.departure = validatePoint(patch["departure"]);
  if ("destination" in patch) booking.destination = validatePoint(patch["destination"]);
  if ("pickupText" in patch) {
    if (typeof patch["pickupText"] !== "string" || patch["pickupText"].trim().length > 120)
      fail(422, "Pickup text must be at most 120 characters.");
    booking.pickupText = patch["pickupText"].trim();
  }
  booking.updatedAt = new Date().toISOString();
  booking.estimatedFare = null;
  booking.status = "quote_requested";
  booking.currency = "SAR";
  db.exec("BEGIN IMMEDIATE");
  try {
    db.prepare("UPDATE bookings SET booking_json = ?, fare_snapshot_json = NULL WHERE id = ?").run(
      JSON.stringify(booking),
      id,
    );
    db.exec("COMMIT");
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {
      /* Transaction may already have rolled back. */
    }
    throw error;
  }
  return booking;
}

async function route(request: Request, pathname: string): Promise<Response | null> {
  const isCreate = pathname === "/api/bookings";
  const isAdminList = pathname === "/api/admin/bookings";
  const patchMatch = /^\/api\/admin\/bookings\/([^/]+)$/.exec(pathname);
  if (!isCreate && !isAdminList && !patchMatch) return null;
  if (
    (isCreate && request.method !== "POST") ||
    (isAdminList && request.method !== "GET") ||
    (patchMatch && request.method !== "PATCH")
  ) {
    return response(405, { error: "Method not allowed." });
  }

  const dataDir = secureDataDir();
  const token = getAdminToken(dataDir);
  if (!token) return response(503, { error: "Booking service is not configured." });

  if (isCreate) {
    if (!validOrigin(request)) return response(403, { error: "Request origin is not allowed." });
    enforceRateLimit(request);
    const input = parseBooking(await readJson(request));
    const db = getDatabase(dataDir);
    const result = createBooking(db, input);
    return response(result.duplicate ? 200 : 201, receipt(result.booking));
  }

  if (!authorized(request, token))
    return response(401, { error: "Administrator authorization is required." });
  const db = getDatabase(dataDir);
  if (isAdminList) {
    const rows = db
      .prepare("SELECT booking_json FROM bookings ORDER BY created_at DESC, id DESC LIMIT 100")
      .all() as Array<{ booking_json: string }>;
    return response(200, {
      bookings: rows.map((row) => JSON.parse(row.booking_json) as StoredBooking),
    });
  }
  if (!validOrigin(request)) return response(403, { error: "Request origin is not allowed." });
  let id: string;
  try {
    id = decodeURIComponent(patchMatch![1]!);
  } catch {
    return response(404, { error: "Booking not found." });
  }
  if (!UUID_PATTERN.test(id)) return response(404, { error: "Booking not found." });
  const patch = await readJson(request);
  if (!isRecord(patch)) return response(400, { error: "Request body must be a JSON object." });
  const booking = patchBooking(db, id, patch);
  return response(200, { booking });
}

/** Handles the booking API routes, returning null for paths owned by other handlers. */
export async function handleBookingApi(request: Request): Promise<Response | null> {
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
    // Do not expose or log database errors, request bodies, or credentials.
    return response(503, { error: "Booking service is temporarily unavailable." });
  }
}
