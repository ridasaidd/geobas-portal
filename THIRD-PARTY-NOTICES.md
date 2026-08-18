# GeoBas Aurora Atlas V3 — THIRD-PARTY NOTICES

This file documents every third-party component vendored (or deliberately retained as an
external reference) for the V3 Aurora Atlas site, with accurate version, provenance,
license, and the location of the full license text. Vendoring follows the decisions in
`V3-ASSET-RESEARCH.md`. All files were obtained from their published package/registry
origins on 2026-08-18; exact byte sizes are recorded per file.

Vendored tree root: `assets/`. Full license texts: `assets/licenses/`.
This notice file is the canonical index; keep it in sync with the vendored tree.

--------------------------------------------------------------------------------

## 1. Vendored JavaScript browser builds

| Component (file) | Version | Source | License | Size |
|---|---|---|---|---|
| Three.js core (`assets/js/three.core.min.js`) | 0.185.0 | npm `three` (github.com/mrdoob/three.js) | MIT | 385,390 B |
| Three.js entry/API (`assets/js/three.module.min.js`) | 0.185.0 | npm `three` | MIT | 365,552 B |
| Globe.GL UMD (`assets/js/globe.gl.min.js`) | 2.46.0 | npm `globe.gl` (github.com/vasturiano/globe.gl) | MIT | 1,796,342 B |
| TopoJSON client (`assets/js/topojson-client.min.js`) | 3.1.0 | npm `topojson-client` (github.com/topojson/topojson-client) | ISC | 7,169 B |
| sql.js loader (`assets/js/sql-wasm.js`) | 1.10.3 | npm `sql.js` (github.com/sql-js/sql.js) | MIT | 49,857 B |
| sql.js WASM (`assets/js/sql-wasm.wasm`) | 1.10.3 | npm `sql.js` | MIT | 655,300 B |

Notes:
- The Three.js 0.185.0 browser build is the ESM bundle split in two: `three.core.min.js`
  is the self-contained core, imported by `three.module.min.js` (the entry/API surface).
  The classic single-file `three.min.js` UMD was removed upstream after r16x. Both files
  must be served together from the same directory. They carry the upstream `@license MIT`
  header. (OrbitControls is an `examples/jsm` addon and is NOT vendored; Globe.GL provides
  its own pointer/orbit control.)
- `globe.gl.min.js` is the self-contained UMD browser build: it exposes the global `Globe`
  and bundles its runtime dependencies (Three.js, d3 modules, kapsule, accessor-fn, etc.)
  under their respective MIT/ISC licenses, per upstream. See the Globe.GL LICENSE for the
  project license; bundled-transitive licenses are governed by upstream publication.
- `topojson-client.min.js` is the UMD browser build of TopoJSON client 3.1.0.

## 2. Vendored data (Natural Earth / world-atlas)

| Component (file) | Version | Source | License | Size |
|---|---|---|---|---|
| World countries, 110m (`assets/data/countries-110m.json`) | 2.0.2 | npm `world-atlas` (github.com/mbostock/world-atlas) | ISC (code) | 107,761 B |
| World countries, 50m (`assets/data/countries-50m.json`) | 2.0.2 | npm `world-atlas` | ISC (code) | 756,420 B |

Notes:
- The underlying geometry is Natural Earth public-domain data. The wrapper package
  (`world-atlas`) is ISC licensed (code); the contained Natural Earth data is public domain.
- 50m is vendored because it is required by the Regions page geometry per `V3-ASSET-RESEARCH.md`.

## 3. Vendored Earth textures (imagery)

| File | Source | License | Size |
|---|---|---|---|
| `assets/img/earth-night.jpg` | three-globe example images | NASA Visible Earth imagery (public domain); repo MIT | 715,000 B |
| `assets/img/earth-topology.png` | three-globe example images | NASA Visible Earth imagery (public domain); repo MIT | 378,243 B |
| `assets/img/earth-day.jpg` | three-globe example images | NASA Visible Earth imagery (public domain); repo MIT | 244,680 B |

Source package: `three-globe` 2.45.2 (github.com/vasturiano/three-globe, MIT), files under
`example/img/`. Imagery derives from NASA Visible Earth (Blue Marble / Earth at Night),
public domain.

## 4. Vendored icons

| Component | Version | Source | License | Count/location |
|---|---|---|---|---|
| Lucide icons (inline SVG subset) | 1.31.0 (lucide-static) | npm `lucide-static` (github.com/lucide-icons/lucide) | ISC | 53 SVGs in `assets/icons/` |

Icons are vendored as standalone inline SVG files (no icon font, no runtime JS), matching
the research decision to inline only the needed set. Names follow the lucide-static icon
filenames at 1.31.0.

## 5. Vendored country flags

| Component | Version | Source | License | Location |
|---|---|---|---|---|
| flag-icons SVG subset (4x3) | 7.5.0 | npm `flag-icons` (github.com/lipis/flag-icons) | MIT | 43 SVGs in `assets/flags/` |

The subset covers the 43 countries present in the site DB (`SEED_CARDS`), keyed by
ISO 3166-1 alpha-2. "Kongo" is ambiguous (DR Congo / Republic of the Congo), so both
`CD.svg` and `CG.svg` are vendored. "Uigur" is a region/ethnicity, not an ISO country and has
no flag-icons SVG; the UI must fall back to an ISO chip/emoji per research.

## 6. Vendored fonts (woff2 subsets)

| Family | Version (fontsource) | License | Files (`assets/fonts/...`) |
|---|---|---|---|
| Inter | 5.3.0 | OFL-1.1 | inter/latin 400,500,600,700 |
| Source Serif 4 | 5.3.0 | OFL-1.1 | source-serif-4/latin 400,600,700 |
| JetBrains Mono | 5.3.0 | OFL-1.1 | jetbrains-mono/latin 400,500,600 |
| Noto Naskh Arabic | 5.3.0 | OFL-1.1 | noto-naskh-arabic/arabic 400,600,700 |
| Amiri | 5.3.0 | OFL-1.1 | amiri/arabic 400,700 |

Weights/subsets selected per `V3-ASSET-RESEARCH.md` §4 (latin UI/body + display serif,
arabic body + display, mono). Font files are OFL-1.1 licensed (see LICENSE files).

## 7. Retained external references (NOT vendored — deliberate decision)

- **CKEditor 5** — the app loads the official unmodified `ckeditor.js` 40.0.0 build from
  `cdn.ckeditor.com`. CKEditor 5 is GPL-2.0-or-later. Per `V3-ASSET-RESEARCH.md` §7 the
  decision is to **preserve** CKEditor behavior and not replace/custom-build it (a custom
  build would carry GPL obligations; vendoring the official unmodified build is only
  considered acceptable with its license notice). This reference is retained as-is and is
  outside the offline globe stack. Flag for G0/planner if the offline requirement must
  extend to CKEditor.
- **sql.js CDN constant** — the current app hard-codes a jsDelivr sql.js URL in
  `geobas-portal.html`; the local copies in `assets/js/` are provided for the downstream
  worker to wire in. This residual reference is persistence-related, not part of the
  globe stack, and rewiring is reserved for the implementation worker.

## 8. License texts

Full license texts for every vendored component are stored verbatim in `assets/licenses/`:

| File | Component license |
|---|---|
| LICENSE-three | MIT (Three.js) |
| LICENSE-globe.gl | MIT (Globe.GL) |
| LICENSE-three-globe | MIT (three-globe, texture source) |
| LICENSE-topojson-client | ISC (TopoJSON client) |
| LICENSE-world-atlas | ISC (world-atlas wrapper) |
| LICENSE-sql.js | MIT (sql.js) |
| LICENSE-lucide-static | ISC (Lucide) |
| LICENSE-flag-icons | MIT (flag-icons) |
| LICENSE-fontsource-inter | OFL-1.1 |
| LICENSE-fontsource-source-serif-4 | OFL-1.1 |
| LICENSE-fontsource-noto-naskh-arabic | OFL-1.1 |
| LICENSE-fontsource-amiri | OFL-1.1 |
| LICENSE-fontsource-jetbrains-mono | OFL-1.1 |

Natural Earth data is in the public domain; NASA Visible Earth imagery is public domain.

--------------------------------------------------------------------------------

Generated and fact-checked against published package metadata on 2026-08-18.
All items above are lawful to redistribute locally with their license notices.
