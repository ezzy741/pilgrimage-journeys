import assert from "node:assert/strict";
import { chmodSync, existsSync, mkdtempSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { pathToFileURL } from "node:url";
import { handleBookingApi } from "../src/bookings.server.ts";

const originalEnv = {
  dataDir: process.env.BOOKING_DATA_DIR,
  token: process.env.BOOKING_ADMIN_TOKEN,
  tokenFile: process.env.BOOKING_ADMIN_TOKEN_FILE,
  trustProxy: process.env.BOOKING_TRUST_PROXY,
};
const token = "test-only-booking-admin-secret-token-123456";
let currentDir = "";
let ipCounter = 0;

function freshDirectory(): string {
  const directory = mkdtempSync(join(tmpdir(), "vh-bookings-test-"));
  chmodSync(directory, 0o700);
  currentDir = directory;
  process.env.BOOKING_DATA_DIR = directory;
  process.env.BOOKING_ADMIN_TOKEN = token;
  delete process.env.BOOKING_ADMIN_TOKEN_FILE;
  process.env.BOOKING_TRUST_PROXY = "1";
  return directory;
}

function originHeaders(extra: Record<string, string> = {}): Record<string, string> {
  ipCounter += 1;
  return {
    origin: "https://visit-hijaz.com",
    "x-forwarded-for": `192.0.2.${(ipCounter % 250) + 1}`,
    ...extra,
  };
}

function validPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    idempotencyKey: "c5b5af99-29f6-4a40-9a01-51b59ec7c6e0",
    customerName: "Test Passenger",
    phone: "+966 55 123 4567",
    zone: "makkah",
    vehicle: "sedan",
    stopIds: ["nour"],
    pickupText: "",
    departure: null,
    destination: null,
    pickupAt: new Date(Date.now() + 86_400_000).toISOString(),
    notes: "",
    promoCode: "",
    consent: true,
    ...overrides,
  };
}

async function post(
  payload: unknown,
  extraHeaders: Record<string, string> = {},
): Promise<Response | null> {
  return handleBookingApi(
    new Request("http://localhost/api/bookings", {
      method: "POST",
      headers: { ...originHeaders({ "content-type": "application/json" }), ...extraHeaders },
      body: typeof payload === "string" ? payload : JSON.stringify(payload),
    }),
  );
}

async function adminGet(headers: Record<string, string> = {}): Promise<Response | null> {
  return handleBookingApi(
    new Request("http://localhost/api/admin/bookings", {
      method: "GET",
      headers: { authorization: `Bearer ${token}`, ...headers },
    }),
  );
}

function restoreEnvironment(): void {
  if (originalEnv.dataDir === undefined) delete process.env.BOOKING_DATA_DIR;
  else process.env.BOOKING_DATA_DIR = originalEnv.dataDir;
  if (originalEnv.token === undefined) delete process.env.BOOKING_ADMIN_TOKEN;
  else process.env.BOOKING_ADMIN_TOKEN = originalEnv.token;
  if (originalEnv.tokenFile === undefined) delete process.env.BOOKING_ADMIN_TOKEN_FILE;
  else process.env.BOOKING_ADMIN_TOKEN_FILE = originalEnv.tokenFile;
  if (originalEnv.trustProxy === undefined) delete process.env.BOOKING_TRUST_PROXY;
  else process.env.BOOKING_TRUST_PROXY = originalEnv.trustProxy;
}

test("persists durable flat booking records across module/server restart; enforces file modes", async () => {
  const directory = freshDirectory();
  const created = await post(validPayload());
  assert.equal(created?.status, 201);
  const receipt = (await created!.json()) as {
    id: string;
    reference: string;
    status: string;
    estimatedFare: number;
    currency: string;
  };
  assert.equal(receipt.status, "pending_review");
  assert.equal(receipt.currency, "SAR");
  assert.ok(receipt.estimatedFare > 0);
  const dbStat = statSync(join(directory, "bookings.sqlite"));
  assert.equal(dbStat.mode & 0o777, 0o600);

  const restartUrl = pathToFileURL(join(process.cwd(), "src/bookings.server.ts"));
  restartUrl.searchParams.set("restart", String(Date.now()));
  const restarted = (await import(restartUrl.href)) as typeof import("../src/bookings.server.ts");
  const listing = await restarted.handleBookingApi(
    new Request("http://localhost/api/admin/bookings", {
      headers: { authorization: `Bearer ${token}` },
    }),
  );
  assert.equal(listing?.status, 200);
  const data = (await listing!.json()) as { bookings: Array<Record<string, unknown>> };
  assert.equal(data.bookings.length, 1);
  const booking = data.bookings[0]!;
  assert.equal(booking.id, receipt.id);
  assert.equal(booking.customerName, "Test Passenger");
  assert.deepEqual(booking.stopIds, ["nour"]);
  assert.equal(booking.currency, "SAR");
  assert.equal(booking.consent, true);
  assert.equal(booking.consentAt, booking.createdAt);
  assert.equal("idempotencyKey" in booking, false);
  assert.equal("fareSnapshot" in booking, false);
});

test("idempotency returns the original receipt and rejects payload tampering", async () => {
  freshDirectory();
  const payload = validPayload();
  const first = await post(payload);
  const firstReceipt = await first!.json();
  const replay = await post(payload);
  assert.equal(replay?.status, 200);
  assert.deepEqual(await replay!.json(), firstReceipt);
  const changed = await post({ ...payload, customerName: "Another Passenger" });
  assert.equal(changed?.status, 409);
  const listing = await adminGet();
  assert.equal(((await listing!.json()) as { bookings: unknown[] }).bookings.length, 1);
});

test("custom endpoints request a quote and combo promotions cannot discount one-city bookings", async () => {
  freshDirectory();
  const custom = await post(validPayload({ departure: { lat: 21.43, lng: 39.83 } }));
  assert.equal(custom?.status, 201);
  const quote = (await custom!.json()) as { status: string; estimatedFare: number | null };
  assert.equal(quote.status, "quote_requested");
  assert.equal(quote.estimatedFare, null);

  const comboPromo = await post(
    validPayload({
      idempotencyKey: "85c2d1b2-036d-49c5-8eb5-c1dd96290dc2",
      promoCode: "ZIYARAT20",
    }),
  );
  assert.equal(comboPromo?.status, 422);
});

test("admin authentication is required and patch invalidates estimates only", async () => {
  freshDirectory();
  const created = await post(validPayload());
  const receipt = (await created!.json()) as { id: string; estimatedFare: number };
  const denied = await handleBookingApi(
    new Request("http://localhost/api/admin/bookings", {
      headers: { authorization: "Bearer wrong-secret" },
    }),
  );
  assert.equal(denied?.status, 401);

  const patch = await handleBookingApi(
    new Request(`http://localhost/api/admin/bookings/${receipt.id}`, {
      method: "PATCH",
      headers: {
        authorization: `Bearer ${token}`,
        origin: "https://visit-hijaz.com",
        "content-type": "application/json",
      },
      body: JSON.stringify({ departure: { lat: 21.43, lng: 39.83 }, pickupText: "Hotel entrance" }),
    }),
  );
  assert.equal(patch?.status, 200);
  const updated = ((await patch!.json()) as { booking: Record<string, unknown> }).booking;
  assert.equal(updated.status, "quote_requested");
  assert.equal(updated.estimatedFare, null);
  assert.equal(updated.pickupText, "Hotel entrance");
  assert.deepEqual(updated.departure, { lat: 21.43, lng: 39.83 });
  assert.equal(updated.currency, "SAR");
  assert.equal("driver" in updated, false);
  assert.equal("payment" in updated, false);
});

test("origin, content-type, body size, coordinates, and extra fare fields are rejected", async () => {
  freshDirectory();
  const crossOrigin = await post(validPayload(), { origin: "https://attacker.example" });
  assert.equal(crossOrigin?.status, 403);
  const noOrigin = await handleBookingApi(
    new Request("http://localhost/api/bookings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(validPayload()),
    }),
  );
  assert.equal(noOrigin?.status, 403);
  const wrongContent = await post(validPayload(), { "content-type": "text/plain" });
  assert.equal(wrongContent?.status, 415);
  const oversized = await post({ ...validPayload(), notes: "x".repeat(17_000) });
  assert.equal(oversized?.status, 413);
  const invalidCoordinates = await post(validPayload({ destination: { lat: 50, lng: 39 } }));
  assert.equal(invalidCoordinates?.status, 422);
  const tamperedFare = await post(validPayload({ estimatedFare: 1 }));
  assert.equal(tamperedFare?.status, 400);
  const missingConsent = { ...validPayload() };
  delete missingConsent.consent;
  assert.equal((await post(missingConsent))?.status, 400);
  assert.equal((await post(validPayload({ consent: false })))?.status, 400);
});

test("public creation fails closed without admin credential configuration", async () => {
  const directory = freshDirectory();
  delete process.env.BOOKING_ADMIN_TOKEN;
  const missing = await post(validPayload());
  assert.equal(missing?.status, 503);
  assert.equal(statSync(directory).isDirectory(), true);
  assert.equal(statSync(directory).mode & 0o777, 0o700);
  assert.equal(existsSync(join(directory, "bookings.sqlite")), false);
});

test("token-file authentication accepts only a private sufficiently long token", async () => {
  const directory = freshDirectory();
  delete process.env.BOOKING_ADMIN_TOKEN;
  const tokenPath = join(directory, "private-token");
  writeFileSync(tokenPath, `${token}\n`, { mode: 0o600 });
  chmodSync(tokenPath, 0o600);
  process.env.BOOKING_ADMIN_TOKEN_FILE = tokenPath;
  const response = await adminGet();
  assert.equal(response?.status, 200);
  chmodSync(tokenPath, 0o644);
  const rejected = await adminGet();
  assert.equal(rejected?.status, 503);
});

test("routes outside the API are left untouched", async () => {
  freshDirectory();
  assert.equal(await handleBookingApi(new Request("http://localhost/other")), null);
});

test.after(() => restoreEnvironment());
