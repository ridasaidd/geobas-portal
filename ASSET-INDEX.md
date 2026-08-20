# GeoBas Aurora Atlas V3 — Asset Index (vendored)

Exact vendored files, versions, and wiring notes. Provenance/licenses in
`THIRD-PARTY-NOTICES.md`; full license texts in `assets/licenses/`.
See `V3-ASSET-RESEARCH.md` for the sourcing decisions.

## JS browser builds — `assets/js/`

| File | Purpose | Load |
|---|---|---|
| `three.core.min.js` + `three.module.min.js` | Three.js 0.185.0 browser ESM build (core + entry) | Serve both from same dir; `import * as THREE from "./three.module.min.js"` (ESM). |
| `globe.gl.min.js` | Globe.GL 2.46.0 UMD (self-contained, bundles three) | `<script src>` → global `Globe`; `new Globe({...})`. |
| `topojson-client.min.js` | TopoJSON client 3.1.0 UMD | `<script src>` → global `topojson` (`feature`, `mesh`). |
| `sql-wasm.js` + `sql-wasm.wasm` | sql.js 1.10.3 | Locate `.wasm` next to loader; `locateFile` → `sql-wasm.wasm`. |

## Data — `assets/data/`
- `countries-110m.json` (107,761 B) — globe polygons (177 countries + land).
- `countries-50m.json` (756,420 B) — Regions page geometry (241 + land).

## Textures — `assets/img/`
- `earth-night.jpg`, `earth-day.jpg`, `earth-topology.png` (bump),
  from three-globe 2.45.2 example images (NASA Visible Earth imagery).

## Country banners — `assets/img/countries/` (NEW, 2026-08-20)
- `country-somalia.jpg` (3766×2511) — Mogadishu former parliament building, CC0,
  AMISOM Public Information. No attribution required.
- `country-ecuador.jpg` (1280×647) — historic view of Quito c. 1900, Public Domain,
  Gebrüder Underwood via Wikimedia Commons/Zeno.org. No attribution required.
- **Exact file pages, creators, licenses, SHA-256 and download dates: see
  `IMAGE-PROVENANCE.md`** (verified live from each Commons file page this date).

## Icons — `assets/icons/` (Lucide 1.31.0, 53 inline SVGs)
Filenames = lucide-static icon names: `home menu settings search globe globe-2 compass star
book chevron-left/right/up/down arrow-left/right sun moon plus minus edit save trash-2 copy
external-link download upload refresh-cw rotate-cw zoom-in archive file-text file-down
file-up folder folder-open database map-pin layers filter list grid-2x2 users user printer
check x info alert-circle triangle-alert shield lock heart scale`.

## Flags — `assets/flags/` (flag-icons 7.5.0, 43 SVGs, ISO alpha-2 filenames)
`AF AL AZ BD CD CG CI CL CN CO DZ EC EG GE GH GT IN IQ IR KE KZ LB LK LY MA MN NG PE PK PS
RO RU SN SO SV SY TN TR UA UZ VE VN XK`
- `CD` (DR Congo) and `CG` (Congo-Brazzaville) both vendored for the ambiguous "Kongo" DB entry.
- "Uigur" is a region/ethnicity, not an ISO country → no flag; use ISO chip/emoji fallback.

## Fonts — `assets/fonts/<family>/...woff2` (fontsource 5.3.0, OFL-1.1)
- `inter/` latin 400 500 600 700
- `source-serif-4/` latin 400 600 700
- `jetbrains-mono/` latin 400 500 600
- `noto-naskh-arabic/` arabic 400 600 700
- `amiri/` arabic 400 700
Font-family names (`Inter`, `Source Serif 4`, `JetBrains Mono`, `Noto Naskh Arabic`,
`Amiri`) match the fontsource names; use `@font-face` with `font-display: swap`.

## Logos — `assets/logo/` (existing, own work)
`primary-northstar.svg`, `northstar-mono.svg`, `badge-northstar.svg`, `favicon.svg`,
`favicon.ico`.

## Wiring notes
- No runtime CDN references remain to be added for the globe stack; use the local paths above.
- Keep `three.core.min.js` and `three.module.min.js` in the same directory (module resolution).
- `globe.gl.min.js` is a browser-UMD only (requires `window`/DOM); it is not loadable in a
  plain Node runtime.
- sql.js and CKEditor handling is per `THIRD-PARTY-NOTICES.md` §7 (CKEditor preserved on CDN;
  sql.js local copies provided for the implementation worker to wire).
