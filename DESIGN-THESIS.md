# GeoBas — Civic Wayfinding System (design sprint, round 2)

Design exploration only. Changes are left **uncommitted** in this worktree for review.
Single changed file: `geobas-portal.html`. Screenshots: `design-smoke/*.png`.

---

## 1. Design thesis

GeoBas is re-imagined as a **public wayfinding system** — the visual and
interaction language of transit maps, airport guidance and civic signage —
rather than an editorial "hero + globe + cards" portal.

The core metaphor: **returning home is a journey, and the portal is its route
map.**

- **World regions are transit lines.** Each of the 9 seed regions is a colored
  line with a station-code (01–09), its own line color, and a "line card" in
  the departures grid.
- **Countries are destinations / stations on the line.** The country picker
  renders as a vertical station list connected by a rail; rows carry the
  current line's color.
- **Steps are route segments.** A persistent 3-step route rail
  (1 Region → 2 Land → 3 Planera) appears on every step of the journey, with
  completed steps shown in the line color.
- **The homepage is a system map.** No globe, no hero card. Instead: a signage
  headline ("Din rutt / börjar här"), a schematic SVG world transit map with a
  "Här · Sverige" hub and 9 colored end-stations, a live status strip
  (FIDS-board style: regions / countries / languages / storage), a 3-step
  route guide, and a fact board.
- **Status/fact blocks everywhere.** The country destination board opens with
  fact chips (REGION / KÄLLA / STATUS), a destination emblem, and a line-color
  rule under the header.
- **Typography = wayfinding signage.** Condensed uppercase display face
  (Barlow Condensed) for headings, JetBrains Mono for codes/labels/stations,
  Inter for body. Yellow signage accent on deep ink-navy boards.
- **Edit mode = maintenance mode.** A warning banner ("Underhållsläge")
  appears while editing; edit chrome is styled as maintenance hardware.

The palette and type system are a complete departure from the prior editorial
identity (Fraunces serif, warm browns, pill buttons) — this is a different
product system, not a reskin of the old layout.

## 2. Major structural decisions

1. **Globe replaced entirely** (task permitted). The `globe.gl` script tag and
   the `#globe-canvas-wrap` element are gone from the homepage; an inline SVG
   "system map" replaces it (zero WebGL, instant paint, translated labels via
   `data-i18n`). `initGlobe()` is kept but guarded (`if(!wrap) return;`) so the
   import path and any build that still carries the element keep working.
2. **JavaScript is the preserved functional core.** The render pipeline
   (`goRegions`, `goRegion`, `goCountry`, `renderTopicCard`, modal, sanitizers,
   DB layer, import/export) is untouched apart from four small additive edits:
   - `initGlobe` guard (see above);
   - `html[data-region]` attribute set by `goRegion`/`goCountry` to theme the
     current line color via CSS;
   - `updateFacts()` — live counts for the status strip (guarded no-op when
     the DB is not ready; wrapped in try/catch);
   - edit-toggle also flips `body.edit-mode` to show the maintenance banner.
3. **All visual change is CSS + static HTML composition.** Class names used by
   JS-rendered content were kept and restyled (region cards, country rows,
   topic cards, KV rows, NGO/org rows, modal, pills, chips), so no render
   function needed a rewrite. New zones (status strip, route rail, route
   steps, fact board, chips, system map) are static HTML with new i18n keys.
4. **Security posture unchanged and verified.** `escapeHtml`, `safeUrl`,
   `sanitizeRichHtml`, import schema validation, and the innerHTML sink budget
   (25) are byte-identical in behavior; the regression suite re-checks all of
   them.
5. **i18n extended, not broken.** 4 languages × ~45 new `wf_*` keys; Arabic
   RTL rules were carried over and extended for the new components (route
   rail, steps, chips, station list, map arrows).

## 3. Preserved functionality

- Region / country / content navigation (same views, IDs, click paths).
- sv / en / es / ar incl. Arabic RTL (`dir` switch verified in-browser).
- CKEditor editing modal (same toolbar/sanitizer; CDN tag unchanged).
- sql.js persistence: localStorage fallback + `window.storage` bridge,
  600 ms debounced saves, save-status indicator.
- Export / import `.sqlite` with full schema trust-boundary validation.
- Edit mode CRUD (regions, countries, names, intros, cards, paragraphs, KV,
  NGOs, org directory), add-language flow.
- Sources panel, NGO panel, About, Resources views (content identical).
- Static seed data untouched (regions/countries/cards/orgs/resources).

## 4. Checks executed (all real)

- `node tests/regression.test.mjs` → **70/70 PASS** (54 runtime + 16 source
  wiring checks; includes the sink-budget and security-wiring regexes).
- `node --check` on the extracted inline script → syntax OK.
- **Real-browser smoke** (headless Chromium shell, real DOM/CSS/SVG, real
  inline script; only the CDN sql.js/CKEditor/fonts swapped for offline stubs
  because this container has no outbound DNS) → **36/36 PASS**, covering:
  boot, status-strip facts, SVG system map (9 labels), line cards + colors +
  codes, station list + line dots, country destination board (cards, chips,
  NGOs, sources), edit modal open/fallback, Resources, About, Arabic
  RTL switch, maintenance-mode banner, back-to-start.
  Screenshots of the three main views: `design-smoke/view-{start,regions,country}.png`.
- Screenshots verified non-blank (pixel-variance check); stderr scanned for
  uncaught JS errors — none.

## 5. Obvious breakage / limitations

- **Not visually reviewed by a human** — screenshots are provided; layout
  polish at intermediate widths (e.g. 980–1200 px) needs a look.
- **Globe gone from the start view** by design; `refreshGlobePoints()` and
  `onGlobeResize()` are now no-ops (world is never created). Custom builds
  that embed `#globe-canvas-wrap` still get a working globe.
- **Static facts**: the status strip numbers are live (JS), but the route-step
  subtitle "9 världsdelar" and map labels reflect the seed data; user-added
  regions/countries will not update those decorative strings.
- **Map labels are decorative**: they show the seed region names and are not
  clickable; real navigation is the region grid (as before).
- Offline container limitation (pre-existing): CDN resources (sql.js WASM,
  CKEditor, Google Fonts) cannot be fetched here, so the only end-to-end boot
  test uses local stubs; the real app was not exercised against the live CDN.
- CKEditor itself not exercised offline (modal falls back to the plain
  textarea path — verified).
- `git` metadata is not reachable in this container (`.git` file points to a
  host path), so nothing could be committed or diffed here; changes remain as
  plain file edits, as required ("leave changes uncommitted for review").

## 6. Reproduce the checks

```sh
node tests/regression.test.mjs          # regression suite
node --check <(python3 - <<'EOF' ... )  # or the harness below
```
Browser smoke harness (offline stubs): `/tmp/wf-harness/` — build with
`python3 build.py` (env `SMOKE_VIEW=start|regions|country`), serve over
`http://127.0.0.1:8123`, drive with the headless shell. Full walker results
were recorded in the kanban handoff.
