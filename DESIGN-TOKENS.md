# GeoBas V3 "Aurora Atlas" — Design Tokens (implementation contract)

Status: machine-usable token spec for the shell refactor of `geobas-portal.html`.
Author: forgepilot-worker (task t_3709e7a7). Date: 2026-08-18.
Source tags used in every row:
- `PNG:` pixel-extracted from DESIGN-REFERENCE.png (quantitative only — see DESIGN-THESIS.md Appendix A)
- `REF:` geobas_aurora_atlas_gpt_reference.html (the textual cross-check of the PNG; values verbatim)
- `RES:` V3-ASSET-RESEARCH.md (§1 globe/route, §4 typography, §9.4 cross-check)
- `BASELINE:` current geobas-portal.html values (reference only — the target replaces the light theme)
- `DECISION:` a gap the sources leave open; the value proposed here is flagged as such, never sourced.

Rule: a token without a source tag must not be used. Where REF renders below the app's
accessibility floor (micro labels at 6–9px), the token table lists the REF value AND the
contract value (raised to ≥10px) — the contract wins in implementation.

---

## 1. Palette

### 1.1 Core — dark (primary) theme

| Token | Value | Role | Source |
|---|---|---|---|
| `--ink` | `#020812` | Base page background (deepest ink) | REF `--ink`; PNG near-black family (blue-leaning, mean `#060f18`) |
| `--ink2` | `#06111e` | Secondary ink (gradient end, panels' base) | REF `--ink2` |
| `--shell-grad-end` | `#03101b` | Vertical shell gradient end (`#020812 → #03101b`) | REF `.shell` |
| `--stage-top` | `#04101c` | Hero stage gradient top | REF `.stage` background |
| `--stage-bottom` | `#020914` | Hero stage gradient bottom | REF `.stage` background |
| `--panel` | `rgba(6,17,31,.78)` | Translucent panel fill | REF `--panel` |
| `--panel2` | `rgba(8,22,39,.92)` | Opaque-ish panel fill | REF `--panel2` |
| `--gold` | `#e9bd73` | Primary gold (accents, icons, active, news rule, focus) | REF `--gold`; PNG core-gold mean `#e6b172`, top colors ≈ `#e2b97a` |
| `--gold2` | `#ffcf81` | Bright gold (highlights, brand, active lang) | REF `--gold2`; PNG cream/gold family |
| `--gold3` | `#9c6729` | Deep gold (primary-button text-bearer / muted gold) | REF `--gold3` |
| `--cream` | `#f2eadf` | Primary text (body, titles on ink) | REF `--cream`; PNG light-pixel mean `#e8e0d6` |
| `--muted` | `#aeb9c7` | Secondary text (descriptions, small) | REF `--muted` |
| `--cyan` | `#62cfff` | Accent (region marker color family, arc endpoint) | REF `--cyan`; REF region labels r1/r7 `#65c5ff` |
| `--violet` | `#cc6aff` | Accent (arc endpoint) | REF `--violet`; REF r4/r9 `#c976ff`/`#d866ff` |
| `--orange` | `#ff9b54` | Accent (arc endpoint, marker) | REF `--orange`; REF r3/r8 `#ff9b51`/`#ff9852` |
| `--green` | `#68e5b0` | Accent (marker) | REF `--green`; REF r2 `#74e9a7`, r5 `#64dff1`(cyan-green) |
| `--line` | `rgba(239,201,135,.14)` | Gold-tinted hairline (borders on gold-adjacent UI) | REF `--line` |
| `--whiteLine` | `rgba(255,255,255,.07)` | Neutral hairline (frames, panels) | REF `--whiteLine` |
| `--health` | `#a7e878` | System-health green dot + glow `0 0 12px` | REF `.health` |

### 1.2 Semantic fills (dark theme)

| Token | Value | Role | Source |
|---|---|---|---|
| `--topbar-bg` | `rgba(2,8,18,.82)` + blur(16px) | Top bar | REF `.topbar` |
| `--sidebar-bg` | `linear-gradient(180deg, rgba(3,12,22,.74), rgba(2,9,16,.9))` | Left nav frame | REF `.sidebar` |
| `--rail-bg` | same as sidebar (right rail) | REF `.rail` |
| `--railcard-bg` | `rgba(4,14,25,.66)` | Rail cards | REF `.railcard` |
| `--securitybar-bg` | `rgba(5,16,28,.82)` + blur(10px) | Status bar | REF `.securityBar` |
| `--regions-bg` | `linear-gradient(180deg,#071321,#04101b)` | Lower regions panel | REF `.regions` |
| `--country-bg` | same gradient | Lower country panel | REF `.country` |
| `--dcard-bg` | `rgba(6,18,32,.72)` | Dossier cards | REF `.dcard` |
| `--footcard-bg` | `rgba(3,11,20,.55)` | Regions footer cards | REF `.footCard` |
| `--mappanel-bg` | radial `rgba(236,185,104,.10)` at 59% 26% over `#06111d` | World map panel | REF `.mapPanel` |
| `--btn-bg` | `rgba(3,10,18,.5)` | Secondary button fill | REF `.btn` |
| `--btn-primary-grad` | `linear-gradient(180deg,#f2cf91,#d59d52)` | Primary CTA | REF `.btn.primary` |
| `--btn-primary-ink` | `#251707` | Primary CTA text | REF `.btn.primary` |
| `--nav-active-grad` | `linear-gradient(90deg, rgba(229,174,93,.18), transparent)` | Active nav pill | REF `.nav a.active` |
| `--nav-active-border` | `rgba(236,192,124,.11)` | Active nav pill border | REF `.nav a.active` |
| `--hero-vignette` | bottom fade `linear-gradient(transparent, rgba(2,8,16,.95))`, 130px | Hero bottom fade | REF `.stage:after` |
| `--globe-glow` | radial `rgba(255,245,203,.72)` 0 → `rgba(255,197,101,.45)` 17% → `rgba(255,159,59,.13)` 38% → transparent 68%, blur(3px), 260px | Globe backlight | REF `.globeGlow`; PNG glow centroid ≈ (62.5%,46.6%) |
| `--globe-halo` | border `rgba(255,213,146,.09)` + rings `rgba(89,129,191,.02)`@70px / `.012`@140px | Globe meridian halo | REF `.globeHalo` |
| `--stage-glow` | radial `rgba(255,187,83,.12)` at 79% 9% + `rgba(38,95,150,.11)` at 42% 22% | Stage illumination | REF `.stage` |
| `--star-grid` | 56px grid, `rgba(255,255,255,.012)` lines, screen blend | Fixed overlay | REF `body:before` |
| `--country-hero-grad` | `linear-gradient(180deg, rgba(6,13,23,.12), rgba(6,13,23,.86))` + radial `rgba(244,183,110,.35)` at 80% 10% + `linear-gradient(120deg,#101929,#6e5b62 70%,#232b39)` | Country banner | REF `.countryHero`; PNG lower-right zone bright (43.9) |
| `--worldmap-fill` | `rgba(38,65,83,.25)` / stroke `rgba(137,170,194,.30)` w.55 | 2D map countries | REF script (worldMap) |

### 1.3 Text / status colors (dark theme)

| Token | Value | Role | Source |
|---|---|---|---|
| `--topcopy` | `#d5c8b7` | Top-bar tagline | REF `.topcopy` |
| `--hero-lede` | `#c7c2bc` | Hero paragraph | REF `.copy p` |
| `--status-label` | `#b5c0cd` | Status bar small text | REF `.status small` |
| `--rail-metric-small` | `#aeb8c3` | Rail metric small | REF `.metric small` |
| `--news-small` | `#9daabc` | News dates | REF `.news small` |
| `--section-sub` | `#9fabb8` | Section subtitle | REF `.sectionHead p` |
| `--crumb` | `#b4bfcb` | Breadcrumb | REF `.crumb` |
| `--eyebrow` | `#d8b778` | Eyebrows (gold-tinted) | REF `.eyebrow` |
| `--label-base` | `#ded3c4` | Nav link text | REF `.nav a` |
| `--label-gold` | `#d9cec0`/`#d7cab8` | Rail/dossier h3 labels | REF `.railcard h2`, `.dcard h3` |
| `--stats-gold` | `#f1d39b` | Stats numerals | REF `.stats b` |
| `--tab-active` | `#f1ddbd` | Active dossier tab | REF `.tabs .active` |
| `--fact-gold` | `var(--gold)` | Fact keys (dt) | REF `.fact dt` |
| `--region-label` | `#e7dfd4` | Region mono micro-label | REF `.rlabel small` |
| `--tool-icon` | `#e8dcc9` | Tool icons | REF `.toolIcon` |
| `--button-text` | `#ede5d8` | Secondary button text | REF `.btn` |
| `--map-stockholm` | `#fff0b8` (+ glow `#ffca72`) | Origin point on 2D map | REF script |

### 1.4 Region marker colors (9 numbered labels, 2D map + globe points)

| # | Region (reference taxonomy) | Color | Source |
|---|---|---|---|
| 01 Europa | `#65c5ff` | REF `.r1` |
| 02 Mellanöstern | `#74e9a7` | REF `.r2` |
| 03 Östafrika | `#ff9b51` | REF `.r3` |
| 04 Västafrika | `#c976ff` | REF `.r4` |
| 05 Centralafrika | `#64dff1` | REF `.r5` |
| 06 Södra Afrika | `#ffd267` | REF `.r6` |
| 07 Östasien | `#65c5ff` | REF `.r7` |
| 08 Sydasien | `#ff9852` | REF `.r8` |
| 09 Centralasien | `#d866ff` | REF `.r9` |

Note: the app's own seed regions (BASELINE: Syd Amerika, Central Amerika, Europa, Centralasien,
Sydasien, Asien, Afrika, Nord Afrika, Mellanöstern) keep their data; the 01–09 visual numbering
is presentation only (see DESIGN-THESIS §2).

### 1.5 Arc / point colors (globe route lights)

| Token | Value | Source |
|---|---|---|
| Arc start (Stockholm 59.33N, 18.07E) | point `#fff0c6` r .55 | REF script |
| Arc gradients (per destination) | `#ffd68e→#ff9f58`, `#ffe0a4→#d967ff`, `#ffe0a4→#65d5ff`, `#ffe0a4→#ff985c`, `#ffe0a4→#ff9b4b`, `#ffe0a4→#d66fff`, `#ffe0a4→#8ce9bd` | REF arcs[] |
| Destination points | `#ffb15f` r .25, `#d967ff` r .28, `#63d5ff` r .22, `#ff985c` r .22, `#ffcf68` r .22 | REF points[] |
| Atmosphere | `#79b8ff`, altitude .13 | REF globe config |

### 1.6 Light theme

**DECISION — open, not sourced:** none of the V3 sources (PNG, GPT reference HTML, research
notes) define a light theme. The reference is dark-primary. The baseline app is light
(`BASELINE: --bg:#eef2f5, --surface:#ffffff, --ink:#182430, --accent:#1f5f8f`) and a light mode
may be needed for government/sunlit contexts. Proposal for the shell worker (marked DECISION,
pending art review): invert ink↔cream — surfaces `#f2eadf`/`#f7f3ec`, ink text `#020812`/`#06111e`,
gold ramps unchanged, hairlines `rgba(2,8,18,.14)`. Do not ship a light theme before review;
if shipped, the `☼` control in the top bar toggles it. The 2D map/globe may switch to
`earth-day.jpg` (RES §1) in light mode.

---

## 2. Typography

### 2.1 Family stacks (per role)

| Token | Stack | Source |
|---|---|---|
| `--serif` | `'Cormorant Garamond', Georgia, serif` | REF `--serif`; RES §9.4 cross-check (Cormorant Garamond) |
| `--sans` | `Inter, system-ui, sans-serif` | REF `--sans`; RES §4 |
| `--mono` | `'JetBrains Mono', ui-monospace, monospace` | REF `--mono`; RES §4 |
| `--arabic-body` | `'Noto Naskh Arabic', Tahoma, 'Segoe UI', sans-serif` | RES §4 (Noto Naskh Arabic body; keep Arabic fallback in every stack) |
| `--arabic-display` | `'Amiri', 'Noto Naskh Arabic', serif` | RES §4 (Amiri display for RTL headings) |
| `--arabic-serif-fallback` | `Georgia, serif` (for Latin runs inside Arabic) | REF `--serif` fallback pattern |
| `--sans-fallback-note` | serif display fallback for Latin: `Georgia` | REF `--serif` |

Vendoring: OFL self-hosted fontsource subsets (Inter, Source Serif 4 alternative, Noto Naskh
Arabic, Amiri, JetBrains Mono) per RES §4; exact weights to vendor: Inter 400/500/600/700,
Cormorant Garamond 500/600/700, JetBrains Mono 500/600, Noto Naskh Arabic (400/700 as used),
Amiri (400/700 as used). `font-display: swap`. **DECISION:** REF loads Cormorant Garamond;
RES §4 lists Source Serif 4 as the research-recommended serif. The reference (and its §9.4
cross-check) names Cormorant Garamond, so Cormorant is the contract; Source Serif 4 is the
documented alternative if Cormorant is rejected at review.

### 2.2 Sizes / weights / line-heights

Contract floor: body ≥ 16px, line-height 1.6–1.75 (RES §4). Arabic body +1–2px. REF micro
labels (6–9px) are scaled up in the contract column; the REF column is kept for fidelity notes.

| Token | Role | REF value | Contract value | Source |
|---|---|---|---|---|
| `--fs-hero` | Hero h1 | serif 500, 44px, lh .98, uppercase, letterspacing .015em, text-shadow `0 2px 26px rgba(0,0,0,.7)` | 44px (≤760px: 35px) | REF `.copy h1` + media query |
| `--fs-country-title` | Country hero h2 | serif 600, 38px | 38px | REF `.countryHero h2` |
| `--fs-stats` | Stats numerals | serif 500, 27px | 27px | REF `.stats b` |
| `--fs-wordmark` | Brand | serif 600, 28px, lh 1, ls .08em | 28px | REF `.wordmark` |
| `--fs-region-number` | Map region numbers | serif 500, 22px | 22px | REF `.rlabel b` |
| `--fs-section-title` | Section h2 (Regioner/Länder) | serif 600, 18px, uppercase | 18px | REF `.sectionHead h2` |
| `--fs-body` | Prose / lists / facts | REF 7–12px (12px hero lede, 7–8px dense) | **16px, lh 1.65** (Arabic 17–18px) | RES §4; REF `.copy p` (12px/1.7) |
| `--fs-lede` | Hero lede | sans 12px, lh 1.7, `#c7c2bc`, max-width 330px | 16px/1.7 | REF `.copy p` |
| `--fs-micro` | Eyebrows / labels / status / buttons | mono 600, 6–9px, uppercase, ls .06–.22em | **≥10px** (meaningful labels 10–11px; buttons 10px mono 700; breadcrumb 10px; tabs 10px) | REF values; RES §4 + usability rubric (DECISION on floor) |
| `--fs-card-title` | Dossier card h4 (topic tiles) | serif 600, 11px | 14–16px | REF `.dcard h4` |
| `--fs-card-label` | Dossier card h3 labels | mono 600, 7px, uppercase | 10px | REF `.dcard h3` |
| `--fs-tool-icon` | Icon glyphs | 14px (nav), 16px+ (tool) | as REF | REF `.nav .ico` |

Line-height tokens: display 0.98–1.0; body 1.6–1.75; dense facts 1.6; rail news 1.4.

---

## 3. Spacing / radii / shadows / opacity

### 3.1 Spacing

| Token | Value | Role | Source |
|---|---|---|---|
| `--topbar-h` | 72px; grid `260px 1fr 330px`; pad `0 24px` | Top bar | REF `.topbar` |
| `--hero-cols` | `190px minmax(0,1fr) 210px`; min-height 650px | Hero: nav | stage | rail | REF `.hero` |
| `--sidebar-w` | 190px (pad `72px 14px 18px`) | Left nav frame | REF `.hero`/`.sidebar` |
| `--rail-w` | 210px (pad `48px 14px 16px`) | Right rail | REF `.hero`/`.rail` |
| `--nav-item-h` | 42px, gap 7px, pad `0 10px` | Nav items | REF `.nav a` |
| `--stage-copy-w` | 380px, left 4%, top 14% | Hero copy block | REF `.copy` |
| `--globe-w` | 72% of stage, right -3%, top -4%, h 690px | Globe box | REF `.globeBox` |
| `--statusbar` | left 11%, right 6%, bottom 23px, h 66px, grid `1.2fr .8fr .7fr` | Status bar | REF `.securityBar` |
| `--lower-cols` | `1fr 1.1fr`; min-height 560px; pad `18px 22px` | Regions | Country | REF `.lower`, `.regions/.country` |
| `--panel-gaps` | rail 14px; nav 7px; topbar tools 14px; langs 15px; quick links 18px; content grid 10px; region footer 12px; tabs 16px; topic grid 8px | Component gaps | REF `.rail`, `.nav`, `.toptools`, `.langs`, `.quickRow`, `.contentGrid`, `.regionFoot`, `.tabs`, `.topicGrid` |
| `--space-page` | 24px (topbar), 18–22px (panels) | Page padding scale | REF |

### 3.2 Radii

| Token | Value | Use | Source |
|---|---|---|---|
| `--r-6` | 6px | Editor-mode latch, smallBtns | REF `.editorMode` |
| `--r-7` | 7px | Dossier cards, footCards, map panel | REF `.dcard/.footCard/.mapPanel` |
| `--r-8` | 8px | Nav pills, rail cards, region map panel | REF `.nav a`, `.railcard` |
| `--r-9` | 9px | Status bar, status icons | REF `.securityBar` (9px), `.statusIcon` (9px) |
| `--r-full` | 50% | Icon circles (toolIcon 34px, metric 27px, topicIcon 28px, statusIcon 28px, quick i 20px, brand-symbol 37px) | REF `.toolIcon` etc. |
| `--r-app` | 14px | (BASELINE app radius, for legacy cards being replaced) | BASELINE `--radius` |

### 3.3 Shadows / glows

| Token | Value | Use | Source |
|---|---|---|---|
| `--shadow-statusbar` | `0 14px 45px rgba(0,0,0,.28)` | Status bar lift | REF `.securityBar` |
| `--shadow-hero-text` | `0 2px 26px rgba(0,0,0,.7)` | Hero headline | REF `.copy h1` |
| `--shadow-health` | `0 0 12px #a7e878` | Health dot glow | REF `.health` |
| `--shadow-marker` | drop-shadow `0 0 8px #ffca72` | Stockholm point on 2D map | REF script |
| `--shadow-map-label` | `0 0 14px currentColor` | Region labels glow | REF `.rlabel` |
| `--shadow-app` | `0 10px 30px rgba(24,36,48,.08)` | (BASELINE shadow, legacy) | BASELINE `--shadow` |

### 3.4 Opacity / alpha tokens

| Token | Value | Use | Source |
|---|---|---|---|
| `--a-panel` | .78 / .92 / .66 / .72 / .55 / .5 | Panel fills (see §1.2) | REF |
| `--a-line-gold` | .14 | Gold hairline | REF `--line` |
| `--a-line-white` | .07 / .11 | Neutral hairlines | REF `--whiteLine`, `.regions` border |
| `--a-overlay` | .82 (topbar/statusbar) | Blurred bars | REF |
| `--a-grid` | .012 | Star-grid lines | REF `body:before` |
| `--a-nav-active` | .18 (gradient), .11 (border) | Active nav pill | REF |

---

## 4. Motion

### 4.1 Durations

| Token | Value | Use | Source |
|---|---|---|---|
| `--t-arc-dash` | 2800ms | Route-light dash travel (one pass) | REF `arcDashAnimateTime` (2800); RES §1 "slow" |
| `--t-ring-period` | 1600ms | Destination ring pulse period | REF `ringRepeatPeriod` |
| `--t-ring-speed` | 1.3 | Ring propagation speed | REF `ringPropagationSpeed` |
| `--t-rotate` | autoRotateSpeed .35 | Globe auto-rotation (≈17°/min, barely perceptible) | REF `controls.autoRotateSpeed=.35` |
| `--t-view` | 350ms | View switch transition | BASELINE `rise .35s ease` |
| `--t-hover` | 150–200ms | Interaction feedback | DECISION (from REF's instant button behavior + baseline transition scale) |

### 4.2 Easing

| Token | Value | Use | Source |
|---|---|---|---|
| `--ease-ambient` | linear | Globe rotation, arc dash advance, ring propagation (constant celestial drift) | REF globe.gl defaults (arcDash/ring timers are linear) |
| `--ease-view` | ease | View rise/fade | BASELINE `rise` keyframe |
| `--ease-feedback` | ease-out (150–200ms) | Hover/focus feedback | DECISION — no named easing in sources; ease-out for soft, non-bouncy feedback |

### 4.3 Ambient-motion spec (hero, at rest)

- Globe: slow continuous auto-rotation (speed .35); initial `pointOfView({lat:27, lng:24, altitude:1.52})` — shows Europe/Africa/Middle-East routes (REF).
- Atmosphere `#79b8ff`, altitude .13; canvas filter `saturate(1.07) contrast(1.04)` (REF).
- Glow breathing: keep subtle (REF has no breathing; only static glow — **do not add** beyond the static `--globe-glow`; DECISION note).
- Route lights: 5–8 arcs from Stockholm (59.33N,18.07E) to GeoBas destinations; `arcStroke` — **RES §1 contract: thin 0.3–0.5** (REF HTML uses .9; RES overrides — "thin, slow, celestial"); `arcDashLength .42`, `arcDashGap 1.2`, randomized initial dash gap, dash animate 2800ms (REF); ring pulse on each destination (period 1600ms, maxRadius 3) (REF).
- 2D map: static (no ambient animation specified for it; hover/click only) (REF).
- Interaction: hover on globe polygons highlights country; click navigates to country dossier; tooltip on hover only (RES §1). No drag-rotate enabled for casual users is **not** specified — zoom disabled per REF (`enableZoom=false`); keep pan/rotate default (REF only disables zoom).

### 4.4 prefers-reduced-motion policy (COMPLETE)

Sources: REF media query `@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto} *{animation:none!important;transition:none!important}}` + JS `reduced` flags; RES §1 (dash animation off, autoRotate off).

| Item | Normal | Reduced |
|---|---|---|
| Globe auto-rotate | on, speed .35 | **off** |
| Arc dash animation | 2800ms | **off** (arcs may render static) |
| Ring propagation | 1600ms, speed 1.3 | **off** |
| Ambient glow/gradients | static or gentle | static (no animation) |
| View transitions | 350ms rise | instant |
| Scroll behavior | smooth | auto |
| Hover/focus feedback | 150–200ms | allowed but minimal (color/border only, no motion) |

Implementation notes: gate all JS ambient timers on `matchMedia('(prefers-reduced-motion: reduce)')`;
CSS `*{animation:none!important;transition:none!important}` as the fallback net. Nothing may be
auto-rotating or self-animating under reduced motion.

---

## 5. Component inventory (each with its DESIGN-REFERENCE.png region)

PNG regions cited from pixel zone analysis (see DESIGN-THESIS §0/Appendix A). The reference
composition: top bar | hero [left nav | stage+globe | right rail] with status bar under | lower
[regions | country].

| # | Component | Derives from PNG region | Spec anchor (REF selectors) | Key tokens |
|---|---|---|---|---|
| C1 | Top bar (brand, tagline, lang switch, theme, hamburger) | Top band (dark, brightness ≈23) | `.topbar/.brand/.wordmark/.topcopy/.toptools/.langs/.toolIcon` | 72px; `--topbar-bg`; grid `260px 1fr 330px`; serif wordmark 28px + mono subline 10px `.22em` gold; langs as mono 10px chips (active gold2); ☼/☰ 34px circle icons |
| C2 | Left navigation frame | Left column (darkest, ≈14) | `.sidebar/.nav/.nav a/.editorMode` | 190px; sidebar gradient; 7 items max, 42px rows, mono 10px 700 uppercase `.06em`; gold icons 14px; active = gold gradient pill + gold border; bottom "editor mode" latch 42px |
| C3 | Hero copy block | Upper-left of stage (brightest pixel ≈(16.5%,13.9%) = white copy text) | `.copy/.eyebrow/h1/p/.actions/.btn/.quick` | Eyebrow mono 10px gold `.22em`; serif 44px uppercase h1; lede 16px/1.7; 2 buttons (primary gold gradient, secondary outlined); quick links with 20px gold icon circles |
| C4 | Globe centerpiece | Center-right of stage (bright zone x50–80%, glow centroid ≈62.5%,46.6%) | `.globeBox/.globeGlow/.globeHalo/#globe` | 72% width, right -3% top -4%, h 690px; `--globe-glow`, `--globe-halo`; vendored globe.gl (RES §1); night texture, bump; atmosphere #79b8ff; route arcs + points + rings (RES §1 thin/slow/celestial); fallback plain sphere on texture failure (RES §1) |
| C5 | Status / support bar | Band under hero (very dark, ≈15) | `.securityBar/.status/.statusIcon/.health` | left 11% right 6% bottom 23px, h 66px, radius 9, blur 10, `--shadow-statusbar`; 3 cells: Informationssäkerhet / Systemstatus (green health dot) / Driftsinformation; mono 10px labels, 12–14px small text, 28px icon chips |
| C6 | Right rail (at-a-glance + news) | Right column (dark, ≈22) | `.rail/.railcard/.metric/.news/.more` | 210px; railcard radius 8 `--railcard-bg`; "GeoBas i korthet" metrics (27px serif gold numerals + mono micro-labels); "Aktuellt" news with 2px gold left rule; "Visa alla →" gold mono link; hidden ≤1100px (REF media) |
| C7 | Regions view treatment | Lower-left panel (≈26) | `.regions/.sectionHead/.mapPanel/.regionLabels/.rlabel/.regionFoot/.footCard/.stats` | gradient `--regions-bg`; serif 18px uppercase h2 + sub; smallBtn; 360px map panel radius 8 with real 2D world map (natural-earth, vendored RES §1) + numbered serif labels 01–09 with `--region-marker` colors; footer: explainer card + stats quad (9/76/100+/24 numerals serif gold 27px); keep app's own region data (DESIGN-THESIS §2) |
| C8 | Country dossier treatment | Lower-right panel (brightest lower zone ≈44 — warm banner) | `.country/.countryHero/.crumb/.tabs/.contentGrid/.dcard/.facts/.topicGrid/.related` | `--country-hero-grad` banner 150px: crumb, flag+serif 38px title, subtitle; tab strip 38px mono 10px (active: gold underline 2px + `#f1ddbd`); grid `1fr 1fr .42fr`: Om landet card / Snabbfakta (gold-keyed fact rows) / Stöd card (full-width button) / Viktig information (4 topic tiles w/ 28px gold icon circles) / Relaterade länder (list + "Visa alla" link); all cards radius 7 `--dcard-bg`; topics span 2 cols; tabs: Översikt / Praktisk information / Säkerhet / Stöd & tjänster / Organisationer / Källor (REF) |
| C9 | Search | Hero CTA (⌕) — no standalone field in reference | `.btn` + app search list | Primary/outlined button "Sök land eller ämne"; keeps app search/list behavior; field styling follows button language (dark fill `rgba(3,10,18,.5)`, gold border `rgba(237,193,123,.35)`, gold focus ring `--gold`) |
| C10 | Language / theme controls | Top bar right | `.langs/.toolIcon` | mono 10px 600 chips SV/EN/ES/العربية (active gold2); ☼ theme toggle (DECISION: light theme unsourced — see §1.6); RTL: logical properties, `[dir=rtl]` flips nav/order (BASELINE pattern retained) |
| C11 | Mobile hamburger | Top bar ☰ icon; sidebar hidden ≤760px (REF media) | `.toolIcon` + `.sidebar` media query | ≤760px: top bar stacks, sidebar hidden, ☰ opens nav drawer; stage min-height 690px; copy block full-width 35px h1; globe 110% width right -32% top 210px; status bar stacks to 1 col; lower panels stack; content grid 1fr (REF media 1100/760) |
| C12 | Shell chrome (shared) | Whole image framing | `body:before/.shell` | ink background `#020812`; fixed star-grid + radial glows overlay; `--whiteLine` hairlines everywhere; view switching keeps frame, swaps content (BASELINE view system) |

### Cross-cutting constraints for the shell worker

- Keep all baseline functional systems intact (BASELINE: i18n/RTL 4 languages, CKEditor via
  editor toggle, sql.js persistence + storage bridge, import/export with `validateImportedDb`,
  `escapeHtml/safeUrl/sanitizeRichHtml/sanitizeRichText`, `rel=noopener` on external links) —
  restyle, do not rebuild (AURORA-ATLAS-V3-PACKET.md; RES §7).
- Vendor assets locally per RES §8 (assets/js, fonts, flags, img, data, icons, logo); flags via
  flag-icons SVG subset (RES §3); icons via inline Lucide subset (RES §2) — no unicode glyph
  icons in the new shell.
- No CSP header added (RES §7); sanitizers remain the security boundary.
- "Redaktionsläge" latch in the left frame = the app's editor toggle (`#btn-edit-toggle`).
- Reference's 9-region numbering is presentation; app region data and slugs stay untouched.

---

## 6. Source index

- REF = `geobas_aurora_atlas_gpt_reference.html` (read in full; values verbatim).
- RES = `V3-ASSET-RESEARCH.md` — §1 globe/route-light/reduced-motion; §4 typography incl. Arabic
  faces + body ≥16px/1.6–1.75; §5 logo; §6 source attribution; §7 persistence/security; §8
  bundling; §9.4 palette/typography cross-check (gold `#e9bd73`/`#ffcf81` on ink `#020812`/`#06111e`,
  cream `#f2eadf`, Cormorant Garamond/Inter/JetBrains Mono).
- PNG = `DESIGN-REFERENCE.png` — pixel-extracted quantities only (size 1402×1122; ink ≈`#060f18`
  blue-leaning; gold ≈`#e6b172`; cream ≈`#e8e0d6`; zone brightness/composition; see DESIGN-THESIS.md
  Appendix A for the raw numbers and rerun scripts).
- BASELINE = current `geobas-portal.html` (light theme, view system, security helpers — cited for
  preservation, not copied as target styling).
- DECISION = flagged open gap (light theme hexes, named easing curves, micro-label floor) —
  resolve at art review; never silently invented.
