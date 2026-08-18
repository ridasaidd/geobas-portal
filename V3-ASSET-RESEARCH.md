# V3-ASSET-RESEARCH.md — GeoBas Aurora Atlas V3 asset research

Status: research output (bounded, read-only phase). Provenance baseline: 628d193cc40f78cca5b8eda6eb4b1ebc1185814d (branch Aurora-Atlas-V3, tip = provenance, now merged into main via PR #5; main tip 21764872f95a92b9279932a10a25f1fb071d6ded).
Rule: prefer local bundling (vendored sidecar assets, zero build) for government/shared-folder/offline use. All sizes below are npm "unpacked" (source of truth from registry.npmjs.org on 2026-08-18) unless noted; exact vendored byte sizes must be recorded by the implementation worker when actually downloaded.

## 1. Globe / map core — RECOMMENDED

| Asset | Purpose | Source | License | Bundling | Size (unpacked) | Offline / CSP / fallback |
|---|---|---|---|---|---|---|
| globe.gl 2.46.x | Globe component (WebGL, atmosphere, arcs, points, rings, polygons, hover) | github.com/vasturiano/globe.gl, npm | MIT | Vendor minified UMD locally (assets/js/) | 38.7 MB npm pkg (deps incl.); UMD min ~hundreds of KB — record exact at vendoring | Fully offline once vendored; no CSP externals; if WebGL unavailable or texture load fails, fall back to colored-sphere + existing 2D SVG map; wire onTextureLoad/onTextureError |
| three 0.185.x | Renderer (peer of globe.gl) | npm | MIT | Vendor three.min.js locally (globe.gl UMD bundles or peers with three; verify bundling mode at vendoring) | 23.2 MB npm pkg; three.min.js ~610 KB (gz ~170 KB) — record exact | Same as above |
| world-atlas 2.0.2 (Natural Earth) | Country polygons: countries-110m.json for globe polygons; countries-50m.json for Regions page geometry | github.com/mbostock/world-atlas (Natural Earth data, public domain) | ISC (code); Natural Earth data public domain | Vendor JSON locally (assets/data/) | 8.2 MB pkg; 110m ~0.1 MB, 50m ~0.7-0.8 MB — record exact | Offline OK; fallback 110m if 50m too heavy on low-end; Antarctica display decision per art direction |
| topojson-client 3.1.0 | topojson->geojson conversion | npm | ISC | Vendor locally | 0.1 MB | — |
| d3-geo (if needed for 2D Regions projection) | Projection for the static/2D regions map | npm | ISC (d3-geo is ISC) | Vendor locally | small | Baseline already used a linear projection inline; d3-geo optional upgrade |
| Earth textures: earth-night.jpg, earth-topology.png (bump), optional earth-day.jpg | Night/day globe surface | three-globe example images (jsdelivr: /npm/three-globe/example/img/), NASA Visible Earth imagery (public domain) | NASA imagery public domain; repo MIT | Vendor locally (assets/img/) | night ~0.2-0.3 MB, bump ~0.06 MB — record exact | Offline OK; on load failure fall back to plain sphere; day texture used in light theme |

Notes: baseline already uses globe.gl + earth-night.jpg + earth-topology.png from jsdelivr — move to local copies. Route redesign (req 15): thin arcStroke (~0.3-0.5), slow long dash-animate times, few arcs (5-8), celestial-navigation metaphor; respect prefers-reduced-motion (dash animation off, autoRotate off). Hover/click (req 16): polygonsData with hover for country highlight; cap polygon LOD at 110m on globe; tooltip only on hover, click navigates to country view.

## 2. Icons — RECOMMENDED: Lucide (inline SVG subset)

| Asset | Purpose | Source | License | Bundling | Size | Offline / CSP / fallback |
|---|---|---|---|---|---|---|
| lucide-static 1.31.0 | Nav, CTAs, status, dossier, search icons | npm lucide-static (SVG files) | ISC | Inline ONLY the ~35-45 needed icons as an inline SVG sprite or per-icon inline SVG (no icon font, no runtime JS) | 48.1 MB pkg, but selected icons are a few KB total | Offline OK; no CSP issue; no failure mode (inline); keep aria-hidden + labels |

Alternative considered: hand-drawn SVGs (used in baseline as unicode glyphs) — replaced for consistency; unicode glyphs in baseline (⌂ ✣ ◎ ⌘ ☼ ☰) are inconsistent across platforms and fail on some mobile fonts.

## 3. Flags — RECOMMENDED: flag-icons (vendored subset)

| Asset | Purpose | Source | License | Bundling | Size | Offline / CSP / fallback |
|---|---|---|---|---|---|---|
| flag-icons 7.5.0 | Country flags (4x3 SVG) in country lists, dossiers, search | github.com/lipis/flag-icons, npm | MIT | Vendor only the flags for countries present in the DB (76 countries per baseline; ~76-100 SVGs, ~150-250 KB) in assets/flags/ | 4.1 MB pkg (all flags); subset as above | Offline OK; fallback: ISO-3166 code chip or emoji flag where SVG missing |
| Country ISO mapping | data attribute per country (alpha-2) | Inline data | — | inline | — | Emoji flags (currently used, e.g. Somalia 🇸🇴) do not render on Windows — replace with flag-icons SVG |

## 4. Typography — RECOMMENDED: OFL self-hosted fontsource subsets

| Asset | Purpose | Source | License | Bundling | Size | Offline / CSP / fallback |
|---|---|---|---|---|---|---|
| Inter (fontsource 5.3.0) | UI/body (sv/en/es; latin) | npm @fontsource/inter | OFL-1.1 | Vendor woff2 subsets for used weights only | 4.3 MB pkg; selected weights ~5 x ~15-25 KB | Offline OK; fallback system-ui sans; font-display: swap |
| Source Serif 4 (fontsource 5.3.0) | Display serif headings (sv/en/es) | npm @fontsource/source-serif-4 | OFL-1.1 | Vendor woff2 subsets (400-700) | 2.8 MB pkg; selected ~60-120 KB | Fallback Georgia serif |
| Noto Naskh Arabic (fontsource 5.3.0) | Arabic body (already the baseline Arabic face via Google Fonts) | npm @fontsource/noto-naskh-arabic | OFL-1.1 | Vendor woff2 | 0.9 MB pkg; ~60-100 KB selected | Fallback Tahoma/Segoe UI for Arabic; keep Arabic fallback in every font stack |
| Amiri (fontsource 5.3.0) | Arabic display serif for RTL headings (dossier titles, hero) | npm @fontsource/amiri | OFL-1.1 | Vendor woff2 | 1.3 MB pkg; ~40-80 KB | Fallback Noto Naskh Arabic |
| JetBrains Mono (already baseline via Google Fonts) | Eyebrows / micro-labels (documentary-geodetic voice) | Google Fonts / OFL | OFL-1.1 | Vendor woff2 | small | Fallback ui-monospace |

Typographic decisions: larger readable base (req 14): body >= 16px (Arabic needs ~ +1-2px due to script height), line-height 1.6-1.75; display sizes kept for hero. RTL (req 4/11): logical properties (margin-inline-start etc.), dir=rtl flips layout; Arabic uses Amiri display + Noto Naskh body; do not machine-translate legal/source material — untranslated strings degrade to Swedish with explicit badge (baseline pattern, keep).

## 5. Northern-star / Polaris logo — DEDICATED TASK (req 5)

Recommended: original SVG (own work) — north star / Polaris + celestial-navigation motif (compass rose + Ursa Minor asterism), not a licensed raster. Produce: primary SVG, mono variant (single-color for print/mono contexts), favicon (SVG + .ico/PNG), small badge variant for the brand lockup. Licensing: original work (no third-party license burden); if referencing star positions, use public-domain astronomical data; document provenance in repo. Fallback: existing CSS brand-symbol (baseline) until logo task lands.

## 6. Lifos / Migrationsverket country information (req 6) — guidance

- Reachability check on this host FAILED (HTTP 000, lifos.migrationsverket.se not reachable from the research host). Baseline already links lifos.migrationsverket.se/fokuslander.html, reintegrationfacility.eu, iom.int as source links. Implementation worker MUST verify these URLs live with web-capable tooling before committing them, and record access date.
- Attribution: every country dossier Sources panel = named source (agency, document title, publication/current date, URL). No "facts" without a cited, dated source; never invent (population, security, entry requirements must trace to a source).
- Summarize-vs-link boundary: link to primary Lifos/authority pages for narrative/legal content; summarize only short static facts (capital, language, timezone, currency, dial code — from stable public references) with date-stamped citation. Do not paraphrase legal/source material at length; do not machine-translate Lifos legal texts — link to the original (Lifos publishes in Swedish; link, don't translate).
- Content-currency: display "information current as of YYYY-MM-DD" per dossier; Sources view explains refresh path.

## 7. Persistence / editor / security (req 18) — preserve, do not redesign

- sql.js 1.10.3 (MIT) — baseline loads from jsdelivr; vendor sql-wasm.js + sql-wasm.wasm locally (assets/js/); keep storage adapter (host window.storage bridge -> localStorage fallback), import/export with validateImportedDb schema trust boundary, escapeHtml/safeUrl/sanitizeRichHtml/sanitizeRichText, rel=noopener on external links.
- CKEditor 5 classic 40.0.0 — baseline loads from cdn.ckeditor.com. Licensing note: CKEditor 5 is GPL-2.0-or-later. Vendoring the official unmodified build locally with the license notice is acceptable for internal/gov use; a modified/custom build would carry GPL obligations — do not custom-build. Alternative if licensing is unwanted: keep official CDN (requires network; conflicts with offline goal). Decision flag for G0/planner.
- Do NOT add a CSP header that breaks the inline-app architecture unless deployment explicitly requires it; if CSP is required, use 'unsafe-inline' scoped to the single app file or move app JS to a vendored external file (architectural change — separate decision). Keep sanitizers as the security boundary; CSP is additive, not a replacement.

## 8. Bundling stance (summary)

- Primary: sidecar assets/ folder next to geobas-portal.html (zero build, auditable by diff, gov shared-folder friendly, fully offline). Sidecar dirs: assets/js/ (three, globe.gl, sql.js, topojson-client), assets/fonts/, assets/flags/, assets/img/ (textures), assets/data/ (topojson), assets/icons/ (lucide svg), assets/logo/.
- Optional: single-file inline build (base64 fonts/textures) for maximal portability — expect >1.5 MB HTML; keep as an optional build step, not the default.
- All third-party licenses (MIT/ISC/OFL/PD) permit local bundling and redistribution with license notices; include a THIRD-PARTY-NOTICES.md / LICENSE folder in the vendored tree. GPL exception: CKEditor (see §7).
- Estimate of vendored footprint (to confirm): JS ~1.2-1.5 MB raw (~0.4 MB gz), fonts ~0.3 MB, flags ~0.2 MB, textures ~0.3 MB, topojson ~0.9 MB (110m+50m) — total well under 4 MB, acceptable for shared folders.

## 9. Known gaps to close during implementation (record exact numbers in this table)
1. Exact minified sizes: three.min.js, globe.gl UMD, sql-wasm.wasm at vendoring time.
2. Exact texture file sizes (earth-night.jpg, earth-topology.png, optional earth-day.jpg) at vendoring.
3. Live reachability + current-date stamps for each Lifos/authority source URL.
4. DESIGN-REFERENCE.png (1402x1122 px, 1.9 MB) visual extraction by a vision-capable worker; palette/typography cross-check against GPT reference HTML (gold #e9bd73/#ffcf81 on ink #020812/#06111e, cream #f2eadf, Cormorant Garamond/Inter/JetBrains Mono) and prior DESIGN-THESIS (Fraunces/Inter/JetBrains Mono, burnt-orange #c1652f accent, sand #ecdfc4 on #221610).
