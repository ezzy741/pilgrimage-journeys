# Visit Hijaz glass-and-clay customer release

The customer homepage keeps the exact heading **Visit Hijaz** and the existing customer URLs. Its frosted, tactile surfaces are responsive and support English, Arabic and Urdu. All 15 existing ziyarat stops have individual sedan estimate cards, city/name search, a maximum-estimate filter and lowest-estimate sorting. Cards open the existing city booking form with the selected stop.

## Search and map

Departure and destination each support provider-free local landmark search and direct MapLibre/OpenFreeMap pin selection. The index covers all listed ziyarat stops and both city origins; it is not an all-address or hotel geocoder. Source URLs are attached to each static reference point in `src/lib/place-search.ts`. Points are approximate landmarks, not verified vehicle entrances. No customer search is sent to a geocoder. Maps still need WebGL2 and provider availability; unsupported browsers have a truthful fallback to preset stops and written pickup details. The map host has explicit dimensions to prevent the MapLibre stylesheet from overriding its positioning.

## Prices and bookings

`src/lib/mock-data.ts` and the existing fare formulas are unchanged. Homepage card estimates use the existing sedan multiplier, each city's fixed origin and listed stop distance, with no surge or discount. Estimates are transport-only, not admission prices. Individual card fares must not be added because the booking summary charges the base fare once. Custom map points remain manual-quote requests; no route, ETA or final fare is invented. Booking persistence, consent, server-owned fare recalculation, idempotency and private portal host boundaries remain in place.

## Staff-entered ride updates

Protected administration can enter driver display name, vehicle model/plate and advance the trip through confirmation, assignment, en route, arrival, in progress and completion, or cancellation. These are staff updates, not GPS. Assignment requires a name and plate. Driver applications still remain pending review and are not automatically approved. Route edits invalidate the estimate and are disallowed after confirmation.

A newly saved receipt can poll `/api/bookings/track` with a private booking-scoped token in its POST body. Tokens never appear in URLs, browser storage or admin listings; only hashes are stored in a separate table, with a private database HMAC key for safe idempotent receipt replays. Customer tracking omits contact details, precise locations and notes. Polling is single-flight, times out, stops at terminal statuses and aborts on unmount. Tracking access stays in receipt-page memory: reload/closing the page loses this view. Existing older receipts do not receive a recovery code automatically.

There is no real driver GPS feed, background driver app or live ETA. Actual GPS tracking requires a separate authenticated, approved-driver capability with explicit driver consent, active-trip-only booking authorization, location expiry/retention rules and a suitable transport/update channel. Do not substitute simulated locations.

## Security and validation

Patched the pre-existing critical TanStack reflected-XSS advisory [GHSA-qx66-fv34-fjm8](https://github.com/advisories/GHSA-qx66-fv34-fjm8) with aligned non-major framework/router versions. Dependency audit reports no known vulnerabilities. Production build, typecheck, ESLint (existing fast-refresh warnings only), 26 unit tests and booking/portal HTTP integration pass. Responsive browser checks cover 390, 768 and 1440 pixel widths with no horizontal overflow or page exceptions. A WebGL-enabled Chromium check renders the free map and clicks a departure pin; browsers without WebGL2 show the fallback.

## Rollout boundary

Deploy a separate release directory, verify with the host's Node runtime and isolated test storage, back up the existing SQLite databases with their private permissions, then atomically switch the `current` symlink and restart only `pilgrimage-journeys.service`. Retain the prior release for rollback. Do not change Nginx, certificates, SSH, network rules, VPN, Telegram, chat, n8n or other services. The earlier deployment approval gate referred to the already-activated portal release; this owner request authorizes the tested customer update using only the existing website restart rule. No service permissions are changed.
