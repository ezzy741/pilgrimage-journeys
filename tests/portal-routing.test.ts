import test from "node:test";
import assert from "node:assert/strict";
import { routePortalRequest, withPortalHeaders } from "../src/portal-routing.server.ts";
const request = (host: string, path: string, method = "GET", hostHeader = host) =>
  new Request(`http://${host}${path}`, { method, headers: { host: hostHeader } });

test("portal roots and public/unknown private page paths redirect to fixed HTTPS destinations", () => {
  assert.equal(
    routePortalRequest(request("drivers.visit-hijaz.com", "/"))?.headers.get("location"),
    "https://drivers.visit-hijaz.com/drivers/register",
  );
  assert.equal(
    routePortalRequest(request("admin.visit-hijaz.com", "/"))?.headers.get("location"),
    "https://admin.visit-hijaz.com/admin",
  );
  assert.equal(routePortalRequest(request("admin.visit-hijaz.com", "/", "POST"))?.status, 405);

  for (const [path, destination] of [
    ["/admin", "https://admin.visit-hijaz.com/admin"],
    ["/admin/", "https://admin.visit-hijaz.com/admin"],
    ["/driver", "https://drivers.visit-hijaz.com/drivers/register"],
    ["/driver/", "https://drivers.visit-hijaz.com/drivers/register"],
    ["/drivers/register", "https://drivers.visit-hijaz.com/drivers/register"],
    ["/drivers/register/", "https://drivers.visit-hijaz.com/drivers/register"],
  ]) {
    for (const host of ["visit-hijaz.com", "unknown.example"]) {
      const response = routePortalRequest(request(host, `${path}?token=must-not-forward`));
      assert.equal(response?.status, 302, `${host}${path} redirects`);
      assert.equal(response?.headers.get("location"), destination, "query is not forwarded");
      assert.equal(response?.headers.get("cache-control"), "no-store");
    }
  }
  assert.equal(routePortalRequest(request("visit-hijaz.com", "/admin?x=1", "HEAD"))?.status, 302);
  assert.equal(
    routePortalRequest(request("visit-hijaz.com", "/drivers/register/", "POST"))?.status,
    405,
  );
  assert.equal(routePortalRequest(request("unknown.example", "/driver", "DELETE"))?.status, 405);
});

test("admin and driver routes/APIs are denied everywhere except their exact portal", () => {
  for (const host of ["visit-hijaz.com", "unknown.example", "drivers.visit-hijaz.com"]) {
    assert.equal(routePortalRequest(request(host, "/api/admin"))?.status, 404);
    assert.equal(routePortalRequest(request(host, "/api/admin/bookings"))?.status, 404);
    assert.equal(routePortalRequest(request(host, "/api/admin/bookings/123"))?.status, 404);
    assert.equal(routePortalRequest(request(host, "/api/admin/drivers"))?.status, 404);
    assert.equal(routePortalRequest(request(host, "/api/admin/other"))?.status, 404);
  }
  for (const host of ["visit-hijaz.com", "unknown.example", "admin.visit-hijaz.com"]) {
    assert.equal(
      routePortalRequest(request(host, "/api/driver-registrations", "POST"))?.status,
      404,
    );
  }
  assert.equal(routePortalRequest(request("drivers.visit-hijaz.com", "/admin"))?.status, 404);
  assert.equal(routePortalRequest(request("drivers.visit-hijaz.com", "/driver"))?.status, 404);
  assert.equal(
    routePortalRequest(request("drivers.visit-hijaz.com", "/api/admin/bookings"))?.status,
    404,
  );
  assert.equal(
    routePortalRequest(request("admin.visit-hijaz.com", "/drivers/register"))?.status,
    404,
  );
  assert.equal(
    routePortalRequest(request("admin.visit-hijaz.com", "/api/driver-registrations", "POST"))
      ?.status,
    404,
  );

  assert.equal(routePortalRequest(request("drivers.visit-hijaz.com", "/drivers/register")), null);
  assert.equal(routePortalRequest(request("drivers.visit-hijaz.com", "/drivers/register/")), null);
  assert.equal(routePortalRequest(request("admin.visit-hijaz.com", "/admin")), null);
  assert.equal(routePortalRequest(request("admin.visit-hijaz.com", "/admin/")), null);
  assert.equal(routePortalRequest(request("admin.visit-hijaz.com", "/api/admin/drivers")), null);
  assert.equal(routePortalRequest(request("admin.visit-hijaz.com", "/api/admin/bookings")), null);
  assert.equal(
    routePortalRequest(request("drivers.visit-hijaz.com", "/api/driver-registrations")),
    null,
  );
  assert.equal(routePortalRequest(request("admin.visit-hijaz.com", "/api/bookings"))?.status, 404);
  assert.equal(
    routePortalRequest(request("drivers.visit-hijaz.com", "/ziyarat/makkah"))?.status,
    404,
  );
});

test("canonical host parsing does not accept lookalike or userinfo-spoofed authorities", () => {
  assert.equal(
    routePortalRequest(
      request("admin.visit-hijaz.com", "/admin", "GET", "admin.visit-hijaz.com.evil"),
    )?.status,
    302,
  );
  assert.equal(
    routePortalRequest(
      request("admin.visit-hijaz.com", "/admin", "GET", "admin.visit-hijaz.com@evil.example"),
    )?.status,
    302,
  );
  assert.equal(
    routePortalRequest(
      request("admin.visit-hijaz.com", "/admin", "GET", "evil.example@admin.visit-hijaz.com"),
    )?.status,
    302,
  );
  assert.equal(routePortalRequest(request("admin.visit-hijaz.com:8443", "/admin")), null);
  assert.equal(
    routePortalRequest(request("eviladmin.visit-hijaz.com", "/api/admin/bookings"))?.status,
    404,
  );
});

test("public customer booking and ziyarat routes remain available to the public host", () => {
  for (const path of ["/api/bookings", "/ziyarat/makkah", "/ziyarat/madinah"]) {
    assert.equal(routePortalRequest(request("visit-hijaz.com", path)), null);
  }
});

test("private portal responses are noncacheable, nonindexable, and not frameable", () => {
  const response = withPortalHeaders(
    new Response("private shell"),
    request("admin.visit-hijaz.com", "/admin"),
  );
  assert.equal(response.headers.get("cache-control"), "no-store");
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
  const redirect = withPortalHeaders(
    routePortalRequest(request("visit-hijaz.com", "/admin?token=secret"))!,
    request("visit-hijaz.com", "/admin?token=secret"),
  );
  assert.equal(redirect.headers.get("cache-control"), "no-store");
  assert.equal(redirect.headers.get("x-frame-options"), "DENY");
  assert.equal(redirect.headers.get("x-robots-tag"), "noindex, nofollow");
  assert.equal(routePortalRequest(request("drivers.visit-hijaz.com", "/robots.txt"))?.status, 200);
});
