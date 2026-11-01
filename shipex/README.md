# ShipEx — Shipper Dashboard

A logistics/transportation shipper dashboard: a real map, real address
search, real turn-by-turn routing, a functional order flow, ride booking
with vehicle tracking animated along the actual road geometry, a storage
exchange, and a driver↔shipper chat.

## Run it

```bash
npm install
npm run dev
```

Open the printed local URL. The landing page is the entry point; click
**"Open the shipper dashboard"** to get to the app shell with the sidebar.

## How the mapping stack fits together

Two different providers do two different jobs, and neither is faked:

- **Geoapify** — map tiles (rendered through **Leaflet**, an open-source
  map library, since Geoapify itself ships tiles + REST endpoints, not a JS
  map SDK), address **autocomplete** search, and **reverse geocoding** when
  you drop a pin on the map.
- **GraphHopper** — real turn-by-turn **routing**: actual road geometry,
  distance, and per-instruction driving time. This is unchanged from the
  previous version.

### What's really real (and what isn't yet)

- **Map tiles, address autocomplete, reverse geocoding** — real Geoapify API
  calls. If Geoapify can't resolve a query or a point, you'll see an empty
  result or the raw coordinates — never a fabricated address.
- **Route calculation** — a real GraphHopper `/route` call returns the
  actual road geometry and per-instruction distance/time, which is decoded
  and drawn as a polyline on the Leaflet map.
- **No live-traffic layer in this version.** Geoapify doesn't offer a
  comparable live congestion tile layer on its free plan, so it was removed
  rather than faked. `RouteMap` still accepts a `showTraffic` prop for API
  compatibility, but it's a documented no-op.
- **Vehicle movement during ride tracking** — there's no backend yet, so
  there's no live GPS device to stream from. The marker moves along the
  *actual* road geometry GraphHopper returned, paced by the *actual*
  per-instruction travel times (slower through turns, faster on long
  stretches). A visible "playback speed" slider compresses the timeline for
  demo purposes — it's labeled so nobody mistakes it for a live feed.
- **Orders, storage listings, chat messages, notifications** — fully
  functional in local React state for a single session. Wiring this to a
  real multi-user backend (Spring Boot, a database, WebSocket chat, real
  driver GPS ingestion) is the natural next step once you're ready to build
  it — this app's shape (one order/ride/listing/thread model each) is meant
  to map directly onto REST endpoints later.

## The API keys

`src/config.js` holds both:

- **Geoapify** — used for map tiles, autocomplete, and reverse geocoding.
  Free-tier requests are rate-limited per day; swap in your own key via
  `VITE_GEOAPIFY_KEY` when you're ready.
- **GraphHopper** — used only for `POST /route` (distance, real road
  geometry, turn timing). Free-tier requests are also rate-limited; swap it
  via `VITE_GRAPHHOPPER_KEY` if you hit quota.

```bash
# .env.local
VITE_GEOAPIFY_KEY=your_own_geoapify_key_here
VITE_GRAPHHOPPER_KEY=your_own_graphhopper_key_here
```

## Stack

React 18 + JSX (no TypeScript) · Tailwind CSS · Framer Motion · Vite ·
Leaflet (map rendering) · Geoapify (tiles/autocomplete/geocoding) ·
GraphHopper (routing).

## Structure

```
src/
  components/   RouteMap (Leaflet + Geoapify tiles + GraphHopper route),
                PlaceAutocompleteInput (Geoapify autocomplete),
                Sidebar, MobileNav
  services/     geoapify.js (autocomplete/reverse-geocode),
                graphhopper.js (route fetch, polyline decode, timed-path build)
  pages/        Landing, Dashboard, OrderCreate, RideBooking, Storage, Chat
  config.js     API keys + map/style constants
```
