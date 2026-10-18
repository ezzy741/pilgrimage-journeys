import assert from "node:assert/strict";
import { test } from "node:test";
import { localPlaces, placeAtPoint, searchLocalPlaces } from "../src/lib/place-search.ts";
import { calcFare, fareConfigs, stops } from "../src/lib/mock-data.ts";

test("every bookable landmark has a static source-backed search point in its own city", () => {
  for (const zone of ["makkah", "madinah"] as const) {
    for (const stop of stops[zone]) {
      const found = localPlaces.find((place) => place.zone === zone && place.id === stop.id);
      assert.ok(found, stop.id);
      assert.match(found.source, /^https:\/\//);
      assert.ok(found.point.lat >= 16 && found.point.lat <= 33);
      assert.ok(found.point.lng >= 34 && found.point.lng <= 56);
      assert.equal(placeAtPoint(found.point, zone)?.id, stop.id);
    }
  }
});

test("name search supports English, Arabic and Urdu without mixing cities", () => {
  assert.equal(searchLocalPlaces("al haram", "makkah")[0]?.id, "makkah-origin");
  assert.equal(searchLocalPlaces("الحرام", "makkah")[0]?.id, "makkah-origin");
  assert.equal(searchLocalPlaces("مسجد قبا", "madinah")[0]?.id, "quba");
  assert.equal(searchLocalPlaces("quba", "makkah").length, 0);
  assert.equal(searchLocalPlaces("not-a-real-hotel-12345", "makkah").length, 0);
});

test("display estimates use the existing fixed-origin fare formula", () => {
  const quote = (zone: "makkah" | "madinah", stopId: string) =>
    calcFare({
      config: fareConfigs.find((config) => config.zone === zone)!,
      km: stops[zone].find((stop) => stop.id === stopId)!.km,
      vehicleMultiplier: 1,
      surgeOn: false,
      discountPct: 0,
    }).total;
  assert.equal(quote("madinah", "quba"), 135);
  assert.equal(quote("makkah", "nour"), 178);
  assert.equal(quote("makkah", "arafat"), 220);
});
