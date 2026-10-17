const ADMIN_HOST = "admin.visit-hijaz.com";
const DRIVER_HOST = "drivers.visit-hijaz.com";

function requestHost(request: Request): string | null {
  const authority = request.headers.get("host") ?? new URL(request.url).host;
  try {
    // Parse the authority rather than splitting on colons: ports are valid, while
    // userinfo, paths, commas, and malformed authorities must not impersonate a portal.
    const parsed = new URL(`http://${authority}`);
    if (
      parsed.username ||
      parsed.password ||
      parsed.pathname !== "/" ||
      parsed.search ||
      parsed.hash
    )
      return null;
    return parsed.hostname.toLowerCase();
  } catch {
    return null;
  }
}

function portalHost(request: Request): "admin" | "drivers" | null {
  const host = requestHost(request);
  return host === ADMIN_HOST ? "admin" : host === DRIVER_HOST ? "drivers" : null;
}

function normalizedPagePath(path: string): string {
  return path.endsWith("/") ? path.slice(0, -1) : path;
}

function isAdminApi(path: string): boolean {
  return path === "/api/admin" || path.startsWith("/api/admin/");
}

function privatePortalPath(path: string): boolean {
  const page = normalizedPagePath(path);
  return (
    page === "/admin" ||
    page === "/driver" ||
    page === "/drivers/register" ||
    isAdminApi(path) ||
    path === "/api/driver-registrations"
  );
}

function notFound(): Response {
  return new Response("Not found", {
    status: 404,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

function redirect(location: string, method: string): Response {
  if (method !== "GET" && method !== "HEAD")
    return new Response("Method not allowed", { status: 405 });
  return new Response(null, { status: 302, headers: { location, "cache-control": "no-store" } });
}

/** Keep customer routes on the public host and private portal pages/APIs on their assigned hosts. */
export function routePortalRequest(request: Request): Response | null {
  const portal = portalHost(request);
  const path = new URL(request.url).pathname;
  const page = normalizedPagePath(path);

  // Route entry pages requested on the public site or an unrecognized host to
  // the fixed portal origin; never copy a query string to the private surface.
  if (!portal && page === "/admin") return redirect(`https://${ADMIN_HOST}/admin`, request.method);
  if (!portal && (page === "/driver" || page === "/drivers/register"))
    return redirect(`https://${DRIVER_HOST}/drivers/register`, request.method);

  // APIs are never redirected (including on an unknown/public host), and the
  // legacy driver console has no allowed host. This runs before API dispatch.
  if (isAdminApi(path) && portal !== "admin") return notFound();
  if (path === "/api/driver-registrations" && portal !== "drivers") return notFound();
  if (page === "/driver" && portal) return notFound();
  if (
    (page === "/admin" && portal !== "admin") ||
    (page === "/drivers/register" && portal !== "drivers")
  )
    return notFound();

  if (!portal) return null;
  if (path === "/") {
    return redirect(
      portal === "admin"
        ? `https://${ADMIN_HOST}/admin`
        : `https://${DRIVER_HOST}/drivers/register`,
      request.method,
    );
  }
  if (path === "/robots.txt")
    return new Response("User-agent: *\nDisallow: /\n", {
      headers: { "content-type": "text/plain; charset=utf-8" },
    });
  const asset = path.startsWith("/assets/") || path === "/favicon.ico";
  const allowed =
    portal === "admin"
      ? page === "/admin" ||
        path === "/api/admin/bookings" ||
        /^\/api\/admin\/bookings\/[0-9a-f-]+$/i.test(path) ||
        path === "/api/admin/drivers"
      : page === "/drivers/register" || path === "/api/driver-registrations";
  if (asset || allowed) return null;
  return notFound();
}

export function withPortalHeaders(response: Response, request: Request): Response {
  if (!portalHost(request) && !privatePortalPath(new URL(request.url).pathname)) return response;
  const headers = new Headers(response.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.set("x-frame-options", "DENY");
  headers.set("x-robots-tag", "noindex, nofollow");
  headers.set("cache-control", "no-store");
  headers.set("referrer-policy", "strict-origin-when-cross-origin");
  headers.set("permissions-policy", "camera=(), microphone=(), geolocation=()");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}
