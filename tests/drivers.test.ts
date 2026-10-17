import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdtempSync, statSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test, after } from "node:test";
import { pathToFileURL } from "node:url";
import { handleDriverApi } from "../src/drivers.server.ts";

const originalEnv = {
  dataDir: process.env["BOOKING_DATA_DIR"],
  token: process.env["BOOKING_ADMIN_TOKEN"],
  tokenFile: process.env["BOOKING_ADMIN_TOKEN_FILE"],
};
const token = "test-only-driver-admin-secret-token-123456";
let currentDir = "";
let apiHandler: typeof handleDriverApi = handleDriverApi;

async function freshDirectory(): Promise<string> {
  const directory = mkdtempSync(join(tmpdir(), "vh-drivers-test-"));
  chmodSync(directory, 0o700);
  currentDir = directory;
  process.env["BOOKING_DATA_DIR"] = directory;
  process.env["BOOKING_ADMIN_TOKEN"] = token;
  delete process.env["BOOKING_ADMIN_TOKEN_FILE"];
  const restartUrl = pathToFileURL(join(process.cwd(), "src/drivers.server.ts"));
  restartUrl.searchParams.set("test-instance", `${Date.now()}-${Math.random()}`);
  apiHandler = (await import(restartUrl.href)).handleDriverApi;
  return directory;
}

function validPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    idempotencyKey: "e1cb7c62-f174-4f89-806f-0a03d780221e",
    fullName: "Test Driver",
    phone: "+966 55 123 4567",
    serviceZones: ["makkah", "madinah"],
    vehicleType: "suv",
    vehicleModel: "Toyota Highlander",
    consent: true,
    ...overrides,
  };
}

async function post(
  payload: unknown,
  headers: Record<string, string> = {},
  url = "http://localhost/api/driver-registrations",
): Promise<Response | null> {
  return apiHandler(
    new Request(url, {
      method: "POST",
      headers: { origin: new URL(url).origin, "content-type": "application/json", ...headers },
      body: typeof payload === "string" ? payload : JSON.stringify(payload),
    }),
  );
}

async function adminGet(headers: Record<string, string> = {}): Promise<Response | null> {
  return apiHandler(
    new Request("http://localhost/api/admin/drivers", {
      headers: { authorization: `Bearer ${token}`, ...headers },
    }),
  );
}

function restoreEnvironment(): void {
  if (originalEnv.dataDir === undefined) delete process.env["BOOKING_DATA_DIR"];
  else process.env["BOOKING_DATA_DIR"] = originalEnv.dataDir;
  if (originalEnv.token === undefined) delete process.env["BOOKING_ADMIN_TOKEN"];
  else process.env["BOOKING_ADMIN_TOKEN"] = originalEnv.token;
  if (originalEnv.tokenFile === undefined) delete process.env["BOOKING_ADMIN_TOKEN_FILE"];
  else process.env["BOOKING_ADMIN_TOKEN_FILE"] = originalEnv.tokenFile;
}

test("persists minimal pending-review registration across module restart with private SQLite files", async () => {
  const directory = await freshDirectory();
  const created = await post(validPayload());
  assert.equal(created?.status, 201);
  assert.equal(created?.headers.get("cache-control"), "no-store");
  assert.equal(created?.headers.get("x-content-type-options"), "nosniff");
  const receipt = (await created!.json()) as Record<string, unknown>;
  assert.deepEqual(Object.keys(receipt).sort(), ["id", "reference", "status"]);
  assert.equal(receipt.status, "pending_review");
  assert.equal(statSync(join(directory, "drivers.sqlite")).mode & 0o777, 0o600);
  for (const suffix of ["-wal", "-shm"]) {
    const path = join(directory, `drivers.sqlite${suffix}`);
    if (existsSync(path)) assert.equal(statSync(path).mode & 0o777, 0o600);
  }

  const restartUrl = pathToFileURL(join(process.cwd(), "src/drivers.server.ts"));
  restartUrl.searchParams.set("restart", String(Date.now()));
  const restarted = (await import(restartUrl.href)) as typeof import("../src/drivers.server.ts");
  const listing = await restarted.handleDriverApi(
    new Request("http://localhost/api/admin/drivers", {
      headers: { authorization: `Bearer ${token}` },
    }),
  );
  assert.equal(listing?.status, 200);
  const data = (await listing!.json()) as { drivers: Array<Record<string, unknown>> };
  assert.equal(data.drivers.length, 1);
  const registration = data.drivers[0]!;
  assert.equal(registration["id"], receipt["id"]);
  assert.equal(registration["fullName"], "Test Driver");
  assert.deepEqual(registration["serviceZones"], ["makkah", "madinah"]);
  assert.equal(registration["status"], "pending_review");
  assert.equal(registration["consent"], undefined);
  assert.equal(registration["consentAt"], registration["createdAt"]);
  for (const forbidden of [
    "idempotencyKey",
    "license",
    "licenseNumber",
    "plate",
    "card",
    "bankAccount",
    "document",
  ]) {
    assert.equal(forbidden in registration, false);
  }
});

test("idempotency replays a minimal receipt and rejects a changed payload", async () => {
  await freshDirectory();
  const payload = validPayload();
  const first = await post(payload);
  const original = await first!.json();
  const replay = await post(payload);
  assert.equal(replay?.status, 200);
  assert.deepEqual(await replay!.json(), original);
  const changed = await post({ ...payload, vehicleModel: "Toyota Camry" });
  assert.equal(changed?.status, 409);
  assert.equal(((await (await adminGet())!.json()) as { drivers: unknown[] }).drivers.length, 1);
});

test("admin endpoint requires configured token and constant-format bearer authorization", async () => {
  const directory = await freshDirectory();
  delete process.env["BOOKING_ADMIN_TOKEN"];
  const unavailable = await post(validPayload());
  assert.equal(unavailable?.status, 503);
  assert.equal(existsSync(join(directory, "drivers.sqlite")), false);
  process.env["BOOKING_ADMIN_TOKEN"] = token;
  assert.equal((await apiHandler(new Request("http://localhost/api/admin/drivers")))?.status, 401);
  assert.equal((await adminGet({ authorization: `Bearer ${token}x` }))?.status, 401);
  assert.equal((await adminGet())?.status, 200);
});

test("origin, content type, streamed body limit and untrusted production hosts are enforced", async () => {
  await freshDirectory();
  assert.equal((await post(validPayload(), { origin: "https://attacker.example" }))?.status, 403);
  assert.equal(
    (await post(validPayload(), {}, "https://production-host.example/api/driver-registrations"))
      ?.status,
    403,
  );
  assert.equal((await post(validPayload(), { origin: "http://attacker.example" }))?.status, 403);
  assert.equal((await post(validPayload(), { "content-type": "text/plain" }))?.status, 415);
  assert.equal((await post("x".repeat(9_000)))?.status, 413);
  assert.equal((await post(validPayload(), { "content-length": "9000" }))?.status, 413);
});

test("public registration requests use a bounded global 20-per-minute throttle", async () => {
  await freshDirectory();
  for (let index = 0; index < 20; index += 1) {
    const suffix = index.toString(16).padStart(12, "0");
    const payload = validPayload({ idempotencyKey: `00000000-0000-4000-8000-${suffix}` });
    assert.equal((await post(payload, { "x-forwarded-for": `192.0.2.${index + 1}` }))?.status, 201);
  }
  const overLimit = validPayload({ idempotencyKey: "00000000-0000-4000-8000-000000000020" });
  assert.equal((await post(overLimit, { "x-forwarded-for": "198.51.100.77" }))?.status, 429);
});

test("validates required consent, fields, zones, phone, UUID and rejects sensitive extra fields", async () => {
  await freshDirectory();
  assert.equal((await post(validPayload({ consent: false })))?.status, 400);
  const missing = validPayload();
  delete missing["consent"];
  assert.equal((await post(missing))?.status, 400);
  assert.equal((await post(validPayload({ idempotencyKey: "not-a-uuid" })))?.status, 422);
  assert.equal((await post(validPayload({ fullName: "x" })))?.status, 422);
  assert.equal((await post(validPayload({ phone: "123456" })))?.status, 422);
  assert.equal((await post(validPayload({ serviceZones: [] })))?.status, 422);
  assert.equal((await post(validPayload({ serviceZones: ["makkah", "makkah"] })))?.status, 422);
  assert.equal((await post(validPayload({ serviceZones: ["taif"] })))?.status, 422);
  assert.equal((await post(validPayload({ vehicleType: "truck" })))?.status, 422);
  assert.equal((await post(validPayload({ vehicleModel: "x" })))?.status, 422);
  assert.equal((await post(validPayload({ idDocument: "upload" })))?.status, 400);
  assert.equal((await post(validPayload({ licenseNumber: "123" })))?.status, 400);
  assert.equal((await post(validPayload({ licensePlate: "ABC" })))?.status, 400);
  assert.equal((await post(validPayload({ cardNumber: "4111" })))?.status, 400);
  assert.equal((await post(validPayload({ bankAccount: "123" })))?.status, 400);
});

test("unmatched API paths are not claimed", async () => {
  await freshDirectory();
  assert.equal(await apiHandler(new Request("http://localhost/api/other")), null);
});

after(() => restoreEnvironment());
