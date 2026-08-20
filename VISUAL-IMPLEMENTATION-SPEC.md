# GeoBas Aurora Atlas V3 — Visual Implementation Spec

> Authority: this document is the **implementable visual contract** for the shell refactor of
> `geobas-portal.html`. Values are sourced (tagged) from three layers of ground truth:
>
> - **PNG** = pixel data extracted from `DESIGN-REFERENCE.png` (1402×1122 px, RGB 8-bit,
>   non-interlaced) by the prior worker's pure-stdlib decoder. See `DESIGN-THESIS.md` §0 /
>   Appendix A for the rerun-able scripts. All zone brightness, ink/gold/cream means, glow
>   centroid, and star-grid numbers are real pixel evidence.
> - **REF** = verbatim values from `geobas_aurora_atlas_gpt_reference.html` (the GPT-authored
>   structural cross-check of the PNG). Every selector cited is a real REF selector.
> - **ESTIMATED** = bounded ranges derived by triangulating PNG pixel evidence against REF
>   layout selectors, where the source layer was silent on an exact measure. Marked inline.
>
> Where REF renders below the accessibility floor (6–9 px micro labels), this spec records the
> REF value and the contract floor (≥10 px). The contract wins in implementation.
>
> This spec **does not** modify `geobas-portal.html`. It names what must exist, how big it is,
> where it sits relative to viewport, and which invented systems are **forbidden**.

---

## 0. Provenance & inspection disclosure

I (vision-capable worker) inspected `DESIGN-REFERENCE.png` via the prior worker's pixel-
extraction evidence (`DESIGN-THESIS.md` Appendix A), which decoded the actual PNG bytes and
produced quantitative measurements: dimensions 1402×1122, dominant quantized colors (top 5:
`#000810` 18.1%, `#000008` 6.7%, `#081018` 6.1%, `#001018` 5.7%, `#000818` 5.4%), zone
brightness across 6 horizontal bands and 4 vertical bands, the exact glow centroid (62.5% x,
46.6% y), brightest pixel at (16.5%, 13.9%) — upper-left hero copy — and the gold/cream/ink
family means (`#e6b172` / `#e8e0d6` / `#060f18`). These are the numbers underpinning every
quantified spec below. I cross-checked each number against the REF HTML selectors verbatim.

---

## 1. Component anatomy

The PNG composes a single continuous **civic-atlas instrument**, layered top-down:

| # | Layer | Role | Derivation |
|---|---|---|---|
| L1 | Ink field | Base page background (`#020812 → #03101b` vertical shell). | PNG dominant color `#000810` (18.1% of pixels) — this is the field everything sits on. |
| L2 | Fixed star-grid + radial glows overlay | `body:before`: 56 px grid at `rgba(255,255,255,.012)`, mix-blend screen; warm radial at 79% 9% + cool radial at 42% 22%. | REF `body:before`, `.shell`. **Not a dot-grid** — fine lines only, ≤1.2% white alpha. |
| L3 | Top bar (72 px) | Brand lockup (left 260 px), tagline (center), lang+theme+hamburger tools (right 330 px). Hairline bottom `rgba(255,255,255,.07)`, backdrop blur 16 px. | REF `.topbar`. PNG top band brightness ≈ 23 — dark, not opaque. |
| L4 | Hero stage (min-height 650 px) | Three-column grid: `190px | minmax(0,1fr) | 210px` (nav · stage · rail). Stage itself holds the copy block and the globe. | REF `.hero`. Stage brightness ≈ 40.9 (brightest layer). |
| L5 | Status / support bar (66 px) | Sits inside the stage's lower region (above the lower band). Three cells: information security · system health (green dot) · operational notices. | REF `.securityBar`. PNG band below hero brightness ≈ 15.1. |
| L6 | Lower band | Two panels side by side: regions (left) · country dossier (right), grid `1fr 1.1fr`, min-height 560 px. | REF `.lower`. PNG: lower-left 26.3, lower-right 43.9 (warm country hero). |
| L7 | Shell hairlines | `rgba(255,255,255,.07)` borders everywhere the system frames itself: topbar bottom, sidebar right, rail left, panel edges. | REF `--whiteLine`. |

**Component list (what the shell must contain, each named by its REF selector):**

| ID | Component | Selectors / anchor | Role in the composition |
|---|---|---|---|
| C1 | Top bar | `.topbar`, `.brand`, `.wordmark`, `.topcopy`, `.toptools`, `.langs`, `.toolIcon` | Persistent chrome (all views): brand, tagline, lang switch, theme, hamburger. |
| C2 | Left nav frame | `.sidebar`, `.nav`, `.nav a`, `.editorMode` | Primary navigation + editor latch. The leftmost "dark column" of the instrument. |
| C3 | Hero copy block | `.copy`, `.eyebrow`, `h1`, `p`, `.actions`, `.btn`, `.quick` | Upper-left of stage: eyebrow + serif headline + lede + 2 CTAs + quick links. |
| C4 | Globe centerpiece | `.globeBox`, `.globeGlow`, `.globeHalo`, `#globe` | Center-right stage: night-earth sphere with warm backlight + meridian halo + route arcs. |
| C5 | Status bar | `.securityBar`, `.status`, `.statusIcon`, `.health` | Trust framing strip: security · health (green dot) · notices. |
| C6 | Right rail | `.rail`, `.railcard`, `.metric`, `.news`, `.more` | "GeoBas i korthet" metrics + "Aktuellt" news. |
| C7 | Regions panel | `.regions`, `.sectionHead`, `.mapPanel`, `.rlabel`, `.regionFoot`, `.footCard`, `.stats` | Lower-left: 2D world map + 9 numbered labels + footer explainer + 4-cell stats. |
| C8 | Country dossier | `.country`, `.countryHero`, `.crumb`, `.tabs`, `.contentGrid`, `.dcard`, `.facts`, `.topicGrid`, `.related` | Lower-right: warm banner + 5 tabs + grid of topic cards + fact grid + related list. |
| C9 | Search (CTA form) | `.btn` + app search list | No visible field in the PNG — expressed as a primary CTA "Sök land eller ämne" that opens the existing search/list. |
| C10 | Lang / theme controls | `.langs`, `.toolIcon` | Mono uppercase chips + ☼ theme toggle. |
| C11 | Mobile drawer | `.toolIcon` (☰) + `.sidebar` media query | ≤760 px: sidebar becomes a drawer opened by ☰. |
| C12 | Shell overlay | `body:before`, `.shell` | Star-grid + radial glows + ink gradient. |

---

## 2. Route visual matrix

Each route is a composition over the components above. The **frame is persistent** (top bar +
left nav + shell overlay); the **stage and lower band swap content**.

| Route | Visible components | Composition |
|---|---|---|
| **Home (dark, 1440 × 900)** | C1 + C2 + C3 + C4 + C5 + C6 + C12 | Full instrument: dark field, top bar, left nav (4 items + editor latch), hero copy upper-left, globe upper-right glowing, status bar across hero base, right rail, lower band shows regions (left) + featured country dossier teaser (right). |
| **Regions (Landinfo)** | C1 + C2 + C7 + C12 | Stage becomes a full regions treatment: section eyebrow "REGIONER" + serif "Landinfo" title, map panel (natural-earth, full stage width minus 44 px gutters), numbered 01–09 labels with per-region accent colors, footer explainer + 4-cell stats (9 / 76 / 100+ / 24). Right rail hidden ≤ 1100 px. |
| **Region detail** | C1 + C2 + C7 + C12 | Same treatment as Regions but focused on one region: map panel zooms to region bbox, country list panel replaces stats, dossier teaser for selected country. |
| **Country / regions-country** | C1 + C2 + C8 + C12 | Stage becomes country dossier: warm 150 px banner with crumb + flag + serif country name + subtitle; 5-tab strip; grid of topic cards + fact grid + related list. No globe on this route (it belongs to home). |
| **Resources / editor (Egenstudier)** | C1 + C2 + panel system + C12 | Reuses the panel language (railcards / dcards) for article list + CKEditor when in editor mode. Editor latch in left nav activates the CKEditor surface. |
| **Light mode** | C1..C12, palette inverted | DECISION (unsourced in PNG): surfaces `#f2eadf` / `#f7f3ec`, ink text `#020812` / `#06111e`, gold ramps unchanged, hairlines `rgba(2,8,18,.14)`. ☼ tool toggles. Globe texture may switch to `earth-day.jpg`. Do not ship before art review. |
| **Arabic RTL** | C1..C12, layout mirrored | Full logical-property layout. Amiri (display) + Noto Naskh Arabic (body). `[dir=rtl]` flips sidebar to right rail, globe position to upper-left, nav order, tab order, crumb order. Untranslated legal material degrades to Swedish with explicit badge. |
| **Mobile (≤ 760 px)** | C1 + C2 (drawer) + stacked C3/C4/C7/C8 | Top bar stacks, sidebar hidden, ☰ opens drawer. Stage min-height 690 px. Globe 110 % width right -32 % top 210 px. Status bar single column. Lower panels stack. Content grid `1fr`. |

---

## 3. Asset manifest

Every component's required vendored assets (all paths relative to `assets/`):

| Component | Asset path | Purpose |
|---|---|---|
| C1 top bar brand | `assets/logo/primary-northstar.svg` (260 px lockup slot) | Polaris/GeoBas primary lockup. **Required** in top bar. |
| C2 sidebar | `assets/logo/badge-northstar.svg` (37 px symbol) + `assets/logo/northstar-mono.svg` wordmark | Vertical Polaris/GeoBas lockup at sidebar top. **Required**: Polaris/GeoBas brand presence in the persistent left frame. |
| C4 globe | `assets/js/three.core.min.js`, `assets/js/three.module.min.js`, `assets/js/globe.gl.min.js`, `assets/js/topojson-client.min.js`, `assets/data/countries-110m.json`, `assets/data/countries-50m.json`, `assets/img/earth-night.jpg`, `assets/img/earth-topology.png` | globe.gl stack. Night texture + bump. |
| C7 regions map | `assets/js/topojson-client.min.js`, `assets/data/countries-50m.json` | Natural-earth 2D map in `mapPanel`. |
| C8 country hero | `assets/img/countries/country-somalia.jpg`, `assets/img/countries/country-ecuador.jpg` | Per-country hero banners. Provenance in `IMAGE-PROVENANCE.md`. |
| C8 country flag | `assets/flags/<iso>.svg` | 43-country vendored subset (ISO alpha-2 filenames per ASSET-INDEX). |
| All icons | `assets/icons/*.svg` (53 Lucide 1.31.0 inline SVGs) | **No unicode glyph icons** in the shell — only inline Lucide SVGs. |
| All fonts | `assets/fonts/inter/`, `assets/fonts/source-serif-4/`, `assets/fonts/jetbrains-mono/`, `assets/fonts/noto-naskh-arabic/`, `assets/fonts/amiri/` | `font-display: swap`. See typography scale §4.5. |
| SQL | `assets/js/sql-wasm.js`, `assets/js/sql-wasm.wasm` | Persistence (untouched). |
| Light theme globe (opt) | `assets/img/earth-day.jpg` | Only when light mode ships. |

### Polaris / GeoBas logo lockup — explicit requirement

The PNG's top bar and left frame both carry the Polaris/GeoBas identity. The shell **must**
include:

1. **Top bar lockup**: `primary-northstar.svg` (symbol + wordmark horizontal) in the 260 px
   left slot of `.topbar`. Wordmark rendered as serif 28 px / 600 / `#f2eadf`, subline
   "GEOMATIK INSTITUTION" as JetBrains Mono 10 px uppercase `.22em` gold `#d8b778`.
2. **Sidebar vertical lockup**: `badge-northstar.svg` (37 px circle) stacked above
   `northstar-mono.svg` wordmark at the top of the left nav column. Visible on every view.
3. **Favicon**: `assets/logo/favicon.svg` (or `.ico` fallback) set in `<head>`.
4. **Editor latch glyph**: the "Redaktionsläge" toggle at the sidebar bottom uses the badge
   symbol to reinforce brand at the anchor of the instrument.

The brand lockup must never be omitted, replaced by text, or rendered in baseline colors
(`#1f5f8f` blue). It is warm-ink (`#f2eadf`) with gold accents on the dark field.

---

## 4. Quantified geometry

All values are sourced from REF selectors where present, and triangulated from PNG zone
brightness + glow centroid where REF is silent. `[ESTIMATED]` tags mark bounded ranges.

### 4.1 Sidebar (C2)

| Measure | Value | Source |
|---|---|---|
| Width | **190 px** (desktop), **240 px** (tablet 761–1100 px), **280 px** (mobile drawer) | REF `.hero` grid `190px minmax(0,1fr) 210px`; tablet/mobile [ESTIMATED] |
| Padding | `72 px 14 px 18 px` (top / sides / bottom) | REF `.sidebar` |
| Background | `linear-gradient(180deg, rgba(3,12,22,.74), rgba(2,9,16,.9))` | REF `.sidebar` |
| Right hairline | `1 px rgba(255,255,255,.07)` | REF `--whiteLine` |
| Nav item height | **42 px** | REF `.nav a` |
| Nav gap | **7 px** | REF `.nav` |
| Nav item padding | `0 10 px` | REF `.nav a` |
| Nav label | JetBrains Mono **10 px** / 700 uppercase `.06em`, color `#ded3c4` | REF `.nav a` |
| Nav icon | Lucide 14 px, color `#d8b778` | REF `.nav .ico` |
| Active pill | `linear-gradient(90deg, rgba(229,174,93,.18), transparent)`, border `rgba(236,192,124,.11)` | REF `.nav a.active` |
| Editor latch | 42 px, bottom of sidebar, radius 6 px, Polaris badge glyph | REF `.editorMode` |

### 4.2 Top bar (C1)

| Measure | Value | Source |
|---|---|---|
| Height | **72 px** | REF `.topbar` |
| Grid | `260 px 1fr 330 px` | REF `.topbar` |
| Padding | `0 24 px` | REF `.topbar` |
| Background | `rgba(2,8,18,.82)`, backdrop blur 16 px | REF `.topbar` |
| Wordmark | Cormorant Garamond **28 px** / 600 / `#f2eadf`, line-height 1, letterspacing `.08em` | REF `.wordmark` |
| Tagline (`.topcopy`) | JetBrains Mono 10 px, `#d5c8b7` | REF `.topcopy` |
| Lang chips | JetBrains Mono 10 px / 600, active = `#ffcf81` | REF `.langs` |
| ☼ / ☰ | 34 px circles, color `#e8dcc9`, 16 px glyph | REF `.toolIcon` |

### 4.3 Hero stage + copy (C3) + globe (C4)

| Measure | Value | Source |
|---|---|---|
| Stage min-height | **650 px** | REF `.hero` |
| Stage background | `radial-gradient(rgba(255,187,83,.12) at 79% 9%, rgba(38,95,150,.11) at 42% 22%)` over `linear-gradient(#04101c, #020914)` | REF `.stage` |
| Copy block position | `left: 4%`, `top: 14%`, max-width **380 px** | REF `.copy` |
| Copy eyebrow | JetBrains Mono **10 px** / 600 uppercase `.22em`, `#d8b778` | REF `.eyebrow` |
| Copy headline | Cormorant Garamond **44 px** / 500 uppercase `.98` line-height `.015em` letterspacing, `#f2eadf`, text-shadow `0 2 px 26 px rgba(0,0,0,.7)` | REF `.copy h1` |
| Copy headline (mobile ≤ 760) | **35 px** | REF `.copy h1` media query |
| Copy lede | Inter **16 px** (contract floor; REF 12 px), line-height 1.7, `#c7c2bc`, max-width 330 px | REF `.copy p` + RES §4 floor |
| CTA primary | Gold gradient `linear-gradient(180deg,#f2cf91,#d59d52)`, text `#251707`, radius 6 px | REF `.btn.primary` |
| CTA secondary | `rgba(3,10,18,.5)` fill, gold border `rgba(237,193,123,.35)`, text `#ede5d8` | REF `.btn` |
| Quick link icon | 20 px gold circle | REF `.quick i` |
| Globe box width | **72 % of stage** (~**660 px** at 1440 viewport, [ESTIMATED] from 72% of 918 px stage) | REF `.globeBox` |
| Globe box position | `right: -3%`, `top: -4%`, height **690 px** | REF `.globeBox` |
| Globe glow | Radial: `rgba(255,245,203,.72)` 0 → `rgba(255,197,101,.45)` 17 % → `rgba(255,159,59,.13)` 38 % → transparent 68 %, blur 3 px, 260 px radius | REF `.globeGlow` |
| **Globe glow centroid** | **(62.5 % x, 46.6 % y) of viewport** | PNG pixel analysis (DESIGN-THESIS Appendix A) — the sun-lit upper-right limb of the globe |
| **Sun-limb color (warm amber/gold)** | Core `#ffc565` / `#ff9f3b` warm amber, fading to `#ffcb7a` cream-gold at the halo edge | PNG gold-family mean `#e6b172`, with bright core [ESTIMATED] from saturated sample `#ffc565`–`#ff9f3b` |
| **Sun-limb size** | Glow radius **260 px**, warm amber core visible across roughly **120–160 px** diameter of upper-right limb | REF `.globeGlow` 260 px + PNG brightness peak in x70–80% band (64.5/255) |
| Globe halo | Border `rgba(255,213,146,.09)`, inner meridian rings `rgba(89,129,191,.02)` @ 70 px / `.012` @ 140 px | REF `.globeHalo` |
| Globe atmosphere | `#79b8ff`, altitude 0.13 | REF globe config |
| Globe canvas filter | `saturate(1.07) contrast(1.04)` | REF |
| Initial POV | `lat: 27`, `lng: 24`, `altitude: 1.52` (shows Europe/Africa/Middle-East) | REF |
| Auto-rotate speed | `.35` (~17 °/min) | REF `controls.autoRotateSpeed` |
| Arc stroke | **0.3 – 0.5** (thin, celestial — RES §1 contract overrides REF's .9) | RES §1 |
| Arc dash | length `.42`, gap `1.2`, animate `2800 ms` | REF |
| Ring pulse | period `1600 ms`, propagation speed `1.3` | REF |

### 4.4 Status bar (C5) + right rail (C6)

| Measure | Value | Source |
|---|---|---|
| Status bar position | `left: 11%`, `right: 6%`, `bottom: 23 px`, height **66 px**, radius 9 px | REF `.securityBar` |
| Status bar grid | `1.2 fr .8 fr .7 fr` | REF `.securityBar` |
| Status bar fill | `rgba(5,16,28,.82)`, blur 10 px | REF `.securityBar` |
| Status bar shadow | `0 14 px 45 px rgba(0,0,0,.28)` | REF `.securityBar` |
| Status icon chip | 28 px circle | REF `.statusIcon` |
| Health dot | 10 px, `#a7e878`, shadow `0 0 12 px #a7e878` | REF `.health` |
| Status label | JetBrains Mono 10 px, `#b5c0cd` | REF `.status small` |
| Rail width | **210 px**, padding `48 px 14 px 16 px` | REF `.rail` |
| Railcard background | `rgba(4,14,25,.66)`, radius 8 px | REF `.railcard` |
| Metric numeral | Cormorant Garamond **27 px** / 500, `#f1d39b` | REF `.stats b`, `.metric` |
| Metric micro-label | JetBrains Mono 10 px, `#aeb8c3` | REF `.metric small` |
| News rule | `2 px solid #e9bd73` left border | REF `.news` |
| News date | JetBrains Mono 10 px, `#9daabc` | REF `.news small` |
| Rail hidden ≤ | **1100 px** | REF media |

### 4.5 Regions panel (C7)

| Measure | Value | Source |
|---|---|---|
| Background | `linear-gradient(180deg, #071321, #04101b)` | REF `.regions` |
| Section eyebrow | JetBrains Mono 10 px uppercase `.22em`, `#d8b778` | REF `.eyebrow` |
| Section title | Cormorant Garamond **18 px** / 600 uppercase, `#f2eadf` | REF `.sectionHead h2` |
| Section subtitle | `#9fabb8` | REF `.sectionHead p` |
| Map panel height | **360 px**, radius 8 px | REF `.mapPanel` |
| Map panel fill | Radial `rgba(236,185,104,.10)` at 59 % 26 % over `#06111d` | REF `.mapPanel` |
| Map country fill | `rgba(38,65,83,.25)` stroke `rgba(137,170,194,.30)` width 0.55 | REF script |
| Region labels | serif **22 px** / 500 numbers, mono 10 px micro-label, shadow `0 0 14 px currentColor`, per-region accent color (see DESIGN-TOKENS §1.4) | REF `.rlabel` |
| Stockholm point | `#fff0b8` + glow `#ffca72`, drop-shadow `0 0 8 px` | REF script |
| Footer grid | explainer card + 4-cell stats (9 / 76 / 100+ / 24), numerals serif gold 27 px | REF `.regionFoot`, `.stats` |
| Footcard fill | `rgba(3,11,20,.55)`, radius 7 px | REF `.footCard` |

### 4.6 Country dossier (C8)

| Measure | Value | Source |
|---|---|---|
| Banner height | **150 px** | REF `.countryHero` |
| Banner gradient | `linear-gradient(180deg, rgba(6,13,23,.12), rgba(6,13,23,.86))` + radial `rgba(244,183,110,.35)` at 80 % 10 % + base `linear-gradient(120deg,#101929,#6e5b62 70%,#232b39)` | REF `.countryHero` |
| Banner crumb | JetBrains Mono 10 px, `#b4bfcb` | REF `.crumb` |
| Banner flag | 44 px (standard ISO flag chip) | REF |
| Banner title | Cormorant Garamond **38 px** / 600, `#f2eadf` | REF `.countryHero h2` |
| Banner subtitle | Inter 14 px, `#c7c2bc` | REF `.countryHero p` |
| Tab strip height | **38 px** | REF `.tabs` |
| Tab label | JetBrains Mono 10 px uppercase `.1em` | REF `.tabs` |
| Tab active | underline `2 px solid #e9bd73`, text `#f1ddbd` | REF `.tabs .active` |
| Content grid | `1 fr 1 fr .42 fr` | REF `.contentGrid` |
| Dossier card fill | `rgba(6,18,32,.72)`, radius 7 px | REF `.dcard` |
| Card h3 label | JetBrains Mono 10 px uppercase, `#d7cab8` | REF `.dcard h3` |
| Card h4 title | Cormorant Garamond **14–16 px** / 600 (contract floor; REF 11 px) | REF `.dcard h4` + RES §4 floor |
| Fact grid | 2 columns; `<dt>` JetBrains Mono 10 px uppercase gold `#e9bd73`, `<dd>` Inter 16 px / 1.6 `#f2eadf` | REF `.fact` |
| Topic icon circle | 28 px gold circle | REF `.topicIcon` |
| Topic grid | 2 columns | REF `.topicGrid` |
| Related list | Inter 16 px, "Visa alla →" JetBrains Mono 10 px gold link | REF `.related` |
| Tabs (6) | Översikt · Praktisk information · Säkerhet · Stöd & tjänster · Organisationer · Källor | REF |

### 4.7 Typography scale (serif / sans / mono pairing)

| Role | Family | Size | Weight | Line-height |
|---|---|---|---|---|
| Hero headline | Cormorant Garamond | 44 px (35 mobile) | 500 | 0.98 |
| Country title | Cormorant Garamond | 38 px | 600 | 1.0 |
| Stats numerals | Cormorant Garamond | 27 px | 500 | 1.0 |
| Section title | Cormorant Garamond | 18 px | 600 | 1.1 |
| Dossier card h4 | Cormorant Garamond | 14–16 px | 600 | 1.2 |
| Body prose | Inter | **16 px** (17–18 px Arabic) | 400–500 | 1.65 |
| Hero lede | Inter | 16 px (contract floor; REF 12 px) | 400 | 1.7 |
| Fact value | Inter | 16 px | 400 | 1.6 |
| Eyebrow / label / status / button | JetBrains Mono | **≥ 10 px** (contract floor; REF 6–9 px) | 600–700 | 1.2 |
| Arabic display | Amiri | ≥ 18 px | 400 | 1.6 |
| Arabic body | Noto Naskh Arabic | 17–18 px | 400 | 1.7 |

### 4.8 Negative space budget

The PNG's composition leaves **~50 % of the field as negative space** (ink field + star-grid at
`rgba(255,255,255,.012)` only). Gold-family pixels are **0.75 %** of the PNG; cream/light
pixels **0.66 %**; ink **73.4 %**. The instrument is quiet, not crowded. The shell must
preserve this ratio: no view may exceed **15 % accent coverage** (gold + cream + accent
colors combined), and the body must remain ink-dominant.

### 4.9 Motion timing

| Item | Normal | Reduced |
|---|---|---|
| Globe auto-rotate | `.35` speed, linear | **off** |
| Arc dash advance | 2800 ms, linear | **off** (arcs render static) |
| Ring pulse | 1600 ms period, speed 1.3 | **off** |
| View transitions | 350 ms ease | instant |
| Hover / focus feedback | 150–200 ms ease-out | color/border only, no motion |
| Scroll | smooth | auto |
| Net CSS net | all ambient via CSS that can be disabled by `@media (prefers-reduced-motion)` | `*{animation:none!important;transition:none!important}` |

---

## 5. Negative constraints (FORBIDDEN systems)

The following are **explicitly absent from DESIGN-REFERENCE.png** and therefore **forbidden**
in the V3 shell. Any of these is a fidelity failure against the reference:

1. **Invented dot-grid / point-cloud overlays** — the PNG has a line-grid at `.012` alpha,
   not a dot-cloud. Dot grids, point-cloud particle fields, constellation effects, and
   star-burst backgrounds are forbidden.
2. **Dashboard / status widgets / KPI cards** — the PNG shows exactly 3 status cells in a
   horizontal bar. Dashboard-style widget grids (4-up KPI rows, sparklines, gauge charts,
   uptime monitors beyond the single health dot, activity feeds, mini-charts) are forbidden.
3. **Steppers / wizards / onboarding flows** — the PNG has no stepper rail, no wizard, no
   progress bar of any kind. Adding a stepper to any route is forbidden.
4. **Unrelated card grids** — the PNG has three specific card grammars only: railcards
   (metrics + news), dcards (dossier), footcards (regions footer). "Featured article 4-up
   grids", "destination cards", "topic preview cards", and any card grid not named in §1
   are forbidden.
5. **Weather widgets, chat bubbles, floating assistants, cookie modals** — none are present
   in the PNG. Adding any civic-instrument-foreign widget is forbidden.
6. **Baseline light-theme civic blue palette** (`#1f5f8f` accent, `#eef2f5` surface,
   `--bg` / `--surface` legacy tokens) — forbidden as the primary theme. Light mode may ship
   only as the inverted-warm palette documented in DESIGN-TOKENS §1.6 (explicitly unsourced;
   requires art review).
7. **Glassmorphism / crypto / neon aesthetics** — forbidden. The reference has subtle
   translucency on panels (`rgba(6,17,31,.78)`) and hairlines, never neon, never frost.
8. **Military / surveillance UI language** — forbidden. The tone is "civic-atlas night
   voyage", not "operations center". No crosshairs, no targeting reticles, no red alert
   colors (health is green `#a7e878`, no red status).
9. **Top-nav + hero + 3-cards-in-a-row generic page** — forbidden. The composition must be
   the instrument (top bar + left frame + stage + lower band).
10. **Unicode glyph icons** — forbidden. Only inline Lucide SVGs (from `assets/icons/`) may
    be used. No emoji, no Material glyphs, no Font Awesome.

---

## 6. Screenshot acceptance matrix

Each required screenshot is tied to the quantified geometry above. Pass criteria are
objective where possible, subjective (art direction) only where the source is silent.

| # | Screenshot | Size / mode | Required composition | Pass criteria (all must hold) |
|---|---|---|---|---|
| S1 | Home, dark desktop | 1440 × 900 | Full instrument: top bar (72 px) + left nav (190 px) + stage (min 650 px) with copy (upper-left, max-width 380 px) + globe (upper-right, ~660 px wide, glow centroid ~62.5 % x, 46.6 % y) + status bar (66 px) + right rail (210 px) + lower regions + lower dossier teaser | Globe glow visible; warm amber upper-right limb; serif headline 44 px uppercase; status bar 3 cells with green health dot; sidebar shows 4 nav items + editor latch; no dot-grid, no dashboard widgets. |
| S2 | Regions | 1440 × 900 | Stage shows Regioner treatment: eyebrow + section title, 360 px map panel with natural-earth, 9 numbered labels in their per-region accent colors, Stockholm point with gold glow, footer explainer + 4-cell stats (9 / 76 / 100+ / 24) | 9 numbered labels (01–09) visible and colored correctly; stats numerals serif 27 px gold; no globe on this route. |
| S3 | Countries | 1440 × 900 | Region detail focused on one region; country list visible alongside map panel | Map zooms to region bbox; country list renders; dossier teaser for selected country. |
| S4 | Somalia dossier | 1440 × 900 | Country dossier for Somalia: 150 px warm banner with crumb + SO flag + "Somalia" serif 38 px + subtitle; 5 tabs with "Översikt" active; content grid with Om landet / Snabbfakta / Stöd / 4 vital-info topic tiles / Relaterade länder | Flag is the vendored `assets/flags/SO.svg`; banner uses the warm gradient (radial `rgba(244,183,110,.35)`); fact grid mono 10 px uppercase gold keys; 4 topic tiles on 2-col grid with 28 px gold icon circles. |
| S5 | Ecuador dossier | 1440 × 900 | Same treatment as S4 for Ecuador with vendored `assets/flags/EC.svg` | Banner uses `country-ecuador.jpg`; flag, tabs, grid match S4 grammar; no card-grid regression. |
| S6 | Mobile | ~390 × 844 | Top bar stacks; ☰ visible; sidebar hidden; stage min-height 690 px; globe 110 % width right -32 % top 210 px; status bar single column; lower panels stacked | Globe still visible and glowing; ☰ opens drawer; no horizontal scroll; headline 35 px. |
| S7 | Arabic RTL | 1440 × 900 | Full mirrored layout: sidebar on right, globe upper-left, nav order reversed, tabs reversed, crumb reversed, Arabic body in Noto Naskh Arabic, display in Amiri | `dir="rtl"` applied; logical-property layout correct (no left/right hardcoding); Amiri headline visible; untranslated legal material shows Swedish-degradation badge. |
| S8 | Light mode | 1440 × 900 | Inverted-warm palette: surfaces `#f2eadf` / `#f7f3ec`, ink text `#020812` / `#06111e`, gold ramps unchanged, hairlines `rgba(2,8,18,.14)` | No baseline light blue (`#1f5f8f` / `#eef2f5`) anywhere; Polaris logo warm-ink readable; globe may switch to `earth-day.jpg`. Flagged DECISION — do not ship before art review. |

---

## 7. Handoff notes for the shell worker

1. Read this spec together with `DESIGN-TOKENS.md` (verbatim token values) and
   `DESIGN-THESIS.md` (composition rationale + Appendix A pixel evidence).
2. Preserve all baseline functional systems (i18n / RTL, CKEditor, sql.js persistence,
   import/export, sanitizers, `escapeHtml` / `safeUrl` / `sanitizeRichHtml` /
   `sanitizeRichText`, `rel=noopener`). Restyle, do not rebuild.
3. Vendor assets per `ASSET-INDEX.md` + `THIRD-PARTY-NOTICES.md`. No CDN references may be
   added for the globe stack.
4. The Polaris/GeoBas logo lockup in §3 is **required**, not decorative.
5. Every forbidden system in §5 is a fidelity failure. If you find yourself adding a
   dashboard widget, stepper, or card grid, stop — it is not in the reference.
6. Light mode is explicitly unsourced in the PNG. Do not ship S8 before art review.
7. All values tagged `[ESTIMATED]` in §4 are bounded by REF selectors + PNG zone analysis;
   they may be refined by 1–3 px during shell implementation but must not drift beyond the
   stated ranges without returning to this spec for amendment.

---

*End of visual implementation spec. Authority: the three source layers (PNG pixel data,
REF HTML verbatim, RES constraints) resolve ambiguities in that order of precedence. The
PNG is the art authority; this spec is its implementable translation.*
