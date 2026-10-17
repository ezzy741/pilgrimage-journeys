# Visit Hijaz — Pilgrimage Journeys

Customer Ziyarat booking requests for Makkah and Madinah, with separate driver-registration and administration portals. This rebuild is prepared for review; it does **not** activate a production release.

## Three separate surfaces

| Host                      | Purpose                        | Routes                                                                                       |
| ------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------- |
| `visit-hijaz.com`         | Public customer website        | `/`, `/ziyarat/makkah`, `/ziyarat/madinah`, `/offers`, `/api/bookings`, `/api/customer-chat` |
| `drivers.visit-hijaz.com` | Driver registration            | `/` redirects to `/drivers/register`; submissions use `/api/driver-registrations`            |
| `admin.visit-hijaz.com`   | Protected staff administration | `/` redirects to `/admin`; authenticated APIs are under `/api/admin/`                        |

Existing customer booking URLs remain unchanged. Safe requests to the former public `/admin`, `/driver`, and `/drivers/register` pages redirect to fixed HTTPS portal URLs, without forwarding query strings. Staff APIs are not served on the public hostname. Neither portal serves customer booking pages or the other portal's APIs.

The administrator screen contains the real saved-booking and driver-registration panels, not simulated revenue, payouts, OTP dispatch, or payment settings. Driver registration records interest pending review; it does not approve a driver or assign rides.

## Real booking storage

Customers provide contact details, a pickup time, selected stops, optional pickup information/map points, and explicit storage consent. The server validates the request, calculates allowed estimates from its own fare data, and saves it in SQLite outside the release directory. Retry-safe request IDs prevent duplicate submissions.

The default private directory is `/opt/pilgrimage-journeys/shared/bookings`, with directory mode `0700` and database/token files restricted to their owner. It contains the booking and driver databases and the `admin-token` file. It must never be committed or exposed by the web server. Keep this shared directory when replacing a release.

A receipt means **saved for review**, not a confirmed booking, guaranteed fare, available driver, or successful payment. Custom pickup or destination coordinates require a manual quote. Staff map edits are persisted to the actual booking and invalidate the previous estimate when appropriate.

The free map uses MapLibre and [OpenFreeMap](https://openfreemap.org/) with attribution. It does not use Google Maps billing, Places, geocoding, or a paid routing service. WebGL2 is required for the interactive map; unsupported browsers retain preset-stop and pickup-description booking options. Map service availability is not guaranteed. No MCP server is exposed to the browser.

## Admin key and configuration

A valid admin key has **at least 32 characters and no whitespace**. Missing or invalid configuration fails closed, including customer/driver collection when there is no safe administration configuration.

By default the server reads the private `admin-token` file described above. `BOOKING_ADMIN_TOKEN_FILE` can select another protected token file, and `BOOKING_DATA_DIR` can select another private storage directory. A `BOOKING_ADMIN_TOKEN` environment variable overrides the file; do not set it to an empty or placeholder value. The key is used in a Bearer authorization header, not a URL, and is not retained in browser storage.

See `.env.example` for non-secret configuration names. The application does not add persistent customer-chat history. General chat answers use the existing local model configuration; business prices, availability, booking status, and unverified live weather retain their safeguards.

## Build and test

Requirements: Node.js **22.18+**, Bun for the committed lockfile, and Python 3 for the HTTP integration tests. The Oracle runtime is Node 22.23.3.

```sh
bun install --frozen-lockfile
npm run typecheck
npm run lint
npm run test:unit
npm run build:server
npm run test:integration
```

`build:server` explicitly selects Nitro's Node server preset. Its executable is `.output/server/index.mjs`. The integration tests start isolated loopback servers, use temporary synthetic records and random test credentials, verify persistence across process restarts, and remove their test data. Set `NODE_BINARY` only if the test runtime is not the `node` on `PATH`.

For public-site development, run `npm run dev`. Portal hostname boundaries intentionally remain in place; the integration tests exercise them with explicit Host headers. Do not loosen hostname or admin-key checks to preview a staff page.

## Production activation is a separate operation

Do not switch `/opt/pilgrimage-journeys/current`, restart `pilgrimage-journeys.service`, change sudo/systemd permissions, publish portal DNS, or install the staged Nginx template as part of a repository build.

Activation still requires the owner/operator to resolve the valid-admin-key and existing service-restart permission gates, provision certificates for both portal names, and validate the narrowly scoped portal proxy/DNS setup. The files in `deployment/` are **inactive plans**, not applied infrastructure. Preserve the existing public, chat, and workflow virtual hosts. Never disable TLS verification or enable a paid map service as a shortcut.

The repository is connected to [Lovable](https://lovable.dev/projects/3d7e8e2a-3712-4166-8aff-9716a757ee01). Changes to its connected branch can sync to the editor. Keep rebuild work on a review branch until activation is authorized, and do not rewrite published Git history.
