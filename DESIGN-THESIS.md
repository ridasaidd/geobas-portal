# GeoBas V3 "Aurora Atlas" — Design Thesis

Status: art-direction foundation for the V3 Aurora Atlas shell refactor.
Author: forgepilot-worker (task t_3709e7a7)
Date: 2026-08-18
Primary art authority: `DESIGN-REFERENCE.png` (1402×1122 px, RGB 8-bit, non-interlaced)
Cross-check sources: `geobas_aurora_atlas_gpt_reference.html` (full read), `V3-ASSET-RESEARCH.md` (§1, §4, §9.4), baseline `geobas-portal.html` (structure only, read-only).

---

## 0. Vision-inspection disclosure (required by task)

I could **not visually inspect DESIGN-REFERENCE.png**: this worker session has no image-viewing
(vision) tool, and no OCR/vision library is available in the container (no PIL/numpy/tesseract/
ImageMagick, no pip, no network, no sudo). I therefore followed the task's sanctioned fallback and
extracted palette/typography/composition from the textual sources — `geobas_aurora_atlas_gpt_reference.html`
(the GPT reference, read in full) and `V3-ASSET-RESEARCH.md` §9.4/§4/§1.

However, I did NOT stop there. I wrote a pure-stdlib PNG decoder (zlib + struct, no dependencies)
and extracted **real pixel data directly from DESIGN-REFERENCE.png** to corroborate the textual
sources. Findings (provenance: pixel decoding of the actual PNG):

- Dimensions confirmed: **1402×1122**, color type 2 (truecolor RGB, 8-bit), non-interlaced —
  matches the `1402x1122 px, 1.9 MB` note in V3-ASSET-RESEARCH.md §9.4.
- **Ink is overwhelmingly blue-leaning near-black**: of near-black pixels (max channel < 45),
  116,007 are blue-leaning (B > R) vs 2,755 brown-leaning (R > B). Mean near-black pixel ≈
  `#060f18`. This confirms the **#020812 / #06111e ink family** of the GPT reference and rules out
  the earlier thesis's brown `#221610`.
- **Gold accent family confirmed**: mean of bright saturated gold pixels ≈ `#e6b172`; most common
  exact colors ≈ `#e2b97a` (226,185,122). This matches the GPT reference's **#e9bd73** and rules
  out the earlier burnt-orange `#c1652f`.
- **Cream/light text family**: mean of light pixels ≈ `#e8e0d6`, consistent with `#f2eadf`.
- **Composition corroborated by zone brightness** (real pixel luminance, see appendix A):
  - left column (x 0–20%) very dark (avg brightness ≈ 14) → dark **left navigation frame**;
  - hero center-right (x 50–80%, y 8–55%) is the bright zone, peaking at x 70–80% (brightness
    ≈ 64.5); glow centroid at ≈ (62.5% x, 46.6% y) → **globe/centerpiece sits right-of-center**;
  - right column (x 90–100%) dark again (brightness ≈ 18) → **right rail**;
  - top bar dark (≈ 23); band under the hero very dark (≈ 15) → the **status/security bar**;
  - lower-right zone (x 50–100%, y 50–100%) noticeably brighter (≈ 44) than lower-left (≈ 26) →
    the **country dossier hero** carries the warm light on the right side of the lower band.

Net: the pixel evidence independently reproduces the GPT reference's palette and the reference's
overall composition (dark frame on both sides, glowing globe right-of-center, status band, warm
lower-right dossier). Text content, exact typographic rendering, and sub-pixel layout details of
the PNG could not be read without vision; where the reference HTML and PNG can disagree in detail,
the HTML is the structural cross-check and its values are the implementable contract.

**Token sourcing rule used throughout both files:** every value carries a source tag —
`PNG:` (pixel-extracted, quantitative only), `REF:` (GPT reference HTML), `RES:` (V3-ASSET-RESEARCH.md),
`BASELINE:` (existing app, reference only). Nothing is invented; where the sources are silent
(e.g. light-theme hexes, named easing curves), the gap is flagged explicitly as an open decision
for the shell worker, never silently filled.

---

## 1. Design language

**Aurora Atlas** is a cinematic, dark, civic-atlas instrument for GeoBas: a dignified night-voyage
metaphor for people finding their way home. The interface reads as a precision navigation console —
dark ink, warm gold illumination, quiet documentary micro-typography — rather than a brochure or a
dashboard. It must feel like *"the authoritative map of the way home"*, alive even at rest.

Core language (each item mapped to reference evidence):

1. **Cinematic dark civic-atlas atmosphere** — near-black blue ink field (`#020812 → #06111e`
   family; PNG pixel mean ≈ `#060f18`; REF body background, `REF:--ink/--ink2`), with a faint
   fixed star-field/grid overlay (`REF: body:before` radial glows + 56px grid lines at ~1.2% white,
   mix-blend screen), a vertical `#03101b` gradient shell, and a soft horizon glow on the hero
   (`REF:.stage` radial at 79% 9%). Nothing neon, nothing glassy-crypto; light comes from a few
   warm sources (globe, gold accents), everything else recedes.
2. **Amber/gold illumination** — a two-stop gold ramp `#e9bd73 → #ffcf81` (PNG gold family
   ≈ `#e6b172`) on ink; a third deep-gold `#9c6729` for pressed/primary-fill states; cream
   `#f2eadf` as the primary text and the warm foil for gold; gold owns: active nav, icons, key
   numbers, focus, the globe glow, route lights, section accents. Gold is *illumination*, used in
   small doses (≈0.75% of PNG pixels are gold-family — the reference uses it sparingly and so must
   the implementation).
3. **Serif + sans pairing** — Cormorant Garamond (500/600/700) for display: hero headline,
   section titles, country names, stats numerals (`REF:--serif`). Inter (400–700) for UI and
   prose. JetBrains Mono (500/600) for eyebrows, micro-labels, status text, coordinates, buttons —
   the documentary/geodetic voice (`REF:--mono`). Arabic: Noto Naskh Arabic body + Amiri display
   with fallbacks (RES §4).
4. **Spatial centerpiece** — the globe is the hero: right-of-center (PNG glow centroid ≈
   62.5%,46.6%; `REF:.globeBox` right:-3%, width:72%), wrapped in a warm glow halo and a faint
   meridian ring, with slow thin route-lights arcing from Stockholm to destination countries.
   The globe is a *place to navigate from*, not decoration: arcs correspond to real GeoBas
   destination countries.
5. **Left navigation / system frame** — a persistent left column (≈190px; PNG zone brightness
   ≈14, the darkest zone) holds the primary nav as uppercase mono items with gold icons, an active
   gold-tinted gradient pill, and a bottom "editor mode" latch (`REF:.sidebar/.nav/.editorMode`).
   The system is framed, not floating: left nav, top bar, and right rail share hairline borders
   (`rgba(255,255,255,.07)`).
6. **Information panels** — status/security bar under the hero (`REF:.securityBar`, three cells:
   information security, system health, operational notices), right rail with "at a glance"
   metrics + current news (`REF:.rail/.railcard/.metric/.news`), and in the lower band the
   regions panel and the country dossier, both panelized with hairline borders and translucent
   ink fills (`rgba(6,18,32,.72)` etc.).
7. **Information architecture with hierarchy** — micro mono eyebrows above serif titles
   (`REF:.eyebrow`, `REF:.railcard h2`, `REF:.dcard h3`), numbered region markers 01–09,
   tabbed dossier sections, fact grids with gold keys (`REF:.fact dt`).

---

## 2. Element → app view mapping

The reference renders one continuous instrument: hero (with side frame + rail + status bar) on
top, and a two-column lower band (regions | country). The real app (baseline structure, read-only:
`view-home`, `view-regions`, `view-countries`, `view-country`, `view-about`, `view-resources`;
nav Start / Landinfo / Organisationer / Egenstudier; SV/EN/ES/AR with `[dir=rtl]` support) maps
onto it as follows:

| DESIGN-REFERENCE.png region / element | App view / component | Notes for the shell worker |
|---|---|---|
| Top bar: brand mark + wordmark | Persistent app header (all views) | Replace baseline light header with dark 72px bar: wordmark serif + mono subline; hairline bottom border; backdrop blur. |
| Top bar: language switch `SV EN ES العربية` | Existing `#lang-switch` / i18n | Keep 4 languages + RTL flip; style as mono uppercase chips, active = gold2 (REF `.langs`). |
| Top bar: ☼ tool icon | Theme control | Style per `.toolIcon`; see §6 light-theme note. |
| Top bar: ☰ tool icon | Mobile hamburger | At ≤760px the left nav frame hides; ☰ opens it as a drawer (REF media query + `.toolIcon`). |
| Left column frame: nav items + active pill + "Redaktionsläge" latch | Main navigation (Start / Landinfo / Organisationer / Egenstudier) + editor toggle (existing `#btn-edit-toggle` / CKEditor) | Map ref's nav (Hem/Regioner/Länder/Stöd/Organisationer/Källor/Om) onto the app's real 4 destinations; keep "editor mode" as the CKEditor latch at the column bottom. |
| Hero copy block: eyebrow, serif headline, lede, 2 CTAs, quick links | `view-home` hero | Directly implements the home "woah" requirement; CTA 2 is the search entry ("Sök land eller ämne"). |
| Globe centerpiece + glow + halo | `view-home` hero stage | globe.gl on `#globe` (vendored assets per RES §1); right-of-center placement per PNG; arcs from Stockholm to GeoBas destination countries; see §4 motion + DESIGN-TOKENS. |
| Status/security bar (3 cells) | `view-home` support strip | "Informationssäkerhet / Systemstatus (health dot) / Driftsinformation" — civic trust framing. |
| Right rail: "GeoBas i korthet" metrics + "Aktuellt" news | `view-home` side rail | Metrics = live counts (9 regions / 76 countries / 100+ sources / languages); news list from app data; hidden ≤1100px (REF). |
| Lower-left: regions panel (map + numbered labels 01–09 + footer cards + stats) | `view-regions` / `view-countries` | Reference's 9-region taxonomy (Europa, Mellanöstern, Östafrika, Västafrika, Centralafrika, Södra Afrika, Östasien, Sydasien, Centralasien) differs from the app's 9 seed regions (Europa, Mellanöstern, Nord Afrika, Afrika, Centralasien, Sydasien, Asien, Syd Amerika, Central Amerika) — **keep the app's data**, present it in the reference's visual language (serif number badges 01–09 with colored map markers, mono micro-labels, footer explainer + stats). Do not rename app data. |
| Lower-right: country dossier (hero banner w/ crumb + flag + title, tab strip, 6-card grid: Om landet / Snabbfakta / Stöd / Viktig information (4 topics) / Relaterade länder) | `view-country` dossier | This is the dossier contract: warm banner gradient, crumb, tabs, fact grid with gold keys, topic tiles, related list. See §4 and DESIGN-TOKENS component inventory. |
| Hero CTA "Sök land eller ämne ⌕" | Country search (exists in baseline country list) | The reference represents search as a CTA, not a visible field; keep the app's search/list behavior, dress it in the reference's field/button language (mono labels, gold border/`#e9bd73` focus, dark input fill). |
| — (not in reference) | `view-about` (Organisationer), `view-resources` (Egenstudier) | Reuse the panel system (railcards/dcards + dossier tab strip) so these views belong to the same world. |

---

## 3. Typography voice

- **Display serif** (Cormorant Garamond; Arabic: Amiri): speaks "authority + warmth" — used for
  the hero, country names, region numbers, and stats. Uppercase with wide serif presence at hero
  scale (REF hero h1 `uppercase`, `.98` line-height).
- **Sans** (Inter): the workhorse for prose, lists, facts; quiet, legible.
- **Mono** (JetBrains Mono): the instrument voice — eyebrows, breadcrumbs, labels, status, button
  labels, coordinates, dates. Uppercase + letter-spacing.
- **Micro-label floor**: the reference renders many labels at 6–9px (e.g. `.status b` 7px,
  `.eyebrow` 9px). Per RES §4 (body ≥ 16px, line-height 1.6–1.75) and the government-usability
  rubric, the implementation contract raises *meaningful* labels to ≥10px (11–12px for anything
  carrying information the user must read), keeping the same uppercase-mono look. This is the one
  deliberate fidelity-vs-usability deviation, flagged here so the shell worker does not "fix" it
  back.

## 4. Motion philosophy

Motion is **navigation-light activity, not spectacle**: the instrument is at rest but the world it
maps is alive. Three layers:

1. **Ambient** (hero, at rest): globe slowly auto-rotates (`autoRotateSpeed .35`, ≈17°/min),
   route-lights (5–8 arcs) drift along their thin dash paths (dash animation ≈2800ms), rings
   pulse on destination points (period ≈1600ms), the glow breathes gently. Slow, celestial,
   un-catchable. (RES §1: thin `arcStroke 0.3–0.5`, few arcs, celestial metaphor.)
2. **Transitional** (between views): views rise/fade (baseline `rise .35s ease`); no bounces,
   no slides across the whole screen — the frame stays fixed, content changes inside it.
3. **Interaction feedback** (small, immediate): nav pills light gold, buttons brighten, hover
   highlights, gold focus rings; ~150–200ms, reversible, never blocking.

**prefers-reduced-motion policy (complete):** everything ambient and auto-rotating is **off** —
autoRotate off, arc dash animation off, ring propagation off, glow breathing off; view
transitions become instant; scrolling is instant. This matches REF (`*{animation:none!important;
transition:none!important}` + JS `reduced` flags) and RES §1. All motion must be CSS/JS that can
be disabled by the media query — no hard-coded perpetual animation in a way that ignores it.

## 5. Tone / safety

Dignified, calm, factual. Non-sexual, non-violent, non-shocking, no dark patterns, no
inaccessible spectacle (ACCEPTANCE.md + AURORA-ATLAS-V3-PACKET.md). Concretely:

- Trust framing: the status bar says *information security*, *system status*, *operational
  notices* — the product explicitly states its own reliability.
- Gold is warm light, never alarm; red is not used (status health is green `#a7e878`).
- Every dossier fact is source-backed with a dated citation (RES §6) — no invented facts,
  population/security/entry content must trace to a named, dated source.
- RTL: Arabic gets full logical-property layout, Amiri/Noto Naskh stacks, and untranslated legal
  material degrades to Swedish with an explicit badge (baseline pattern, RES §4).

## 6. "Woah factor" plan (home view)

Ordered by expected impact:

1. **The globe, right-of-center, glowing** — a night-earth sphere with atmosphere, slowly turning,
   with thin gold route-lights arcing from Stockholm to real destination countries and pulsing
   rings on arrival points. This is the single image a colleague will remember.
2. **The stage lighting** — warm radial glow behind the globe + halo ring + faint star-grid
   overlay: the whole hero reads as "night at high latitude, aurora-lit instrument".
3. **The serif/mono contrast** — an uppercase Cormorant headline ("Vägen hem börjar med kunskap")
   against a tiny mono eyebrow and micro-labeled status bar: unfamiliar, authored, expensive.
4. **The live status bar** — three quiet civic readouts (security/health/notices) that make it
   feel like a working instrument, not a mockup.
5. **Numbered regions with colored markers** on a real 2D world map in the lower band, plus a
   dossier that keeps the same craft (warm banner, gold-keyed facts, topic tiles).
6. **Motion discipline** — slow ambient life at rest; everything quiet and classy; nothing neon.

## 7. Do-not-regress list (from AURORA-ATLAS-V3-PACKET.md, restated as design constraints)

- No return to the light baseline (light gray-blue civic theme, `--bg:#eef2f5`, blue accent
  `#1f5f8f`).
- No generic top-nav + hero + cards page.
- No glassmorphism/crypto clichés, no military/surveillance UI.
- No safe simplification of the reference; the composition (framed left nav, glowing centerpiece,
  panels, lower two-column world) must survive responsive collapse, not vanish.

## 8. What was captured vs not captured from the PNG

Captured (via textual sources + pixel evidence): palette (inks, golds, cream, muted, 5 accent
hues, hairlines, health green), typography families + the ref's size language, the full
composition (top bar, left nav frame, hero copy, globe + glow + halo placement, status bar, right
rail, lower regions panel, lower country dossier, dossier internals), motion parameters
(auto-rotate speed, arc dash timing, ring timing, transition duration, reduced-motion handling),
and the responsive breakpoints (1100px, 760px).

Not captured (requires vision, flagged for the shell worker): the PNG's exact rendered copy/text,
exact sub-pixel spacing and any PNG-only decorative details the HTML cross-check does not
contain, and PNG-specific typography rendering. If the PNG shows something not in this thesis,
the reference HTML + pixel analysis here is the sanctioned fallback per task instructions.

---

## Appendix A — pixel-extraction evidence (real data from DESIGN-REFERENCE.png)

Decoded with a pure-stdlib script (zlib + struct; /tmp/png_decode.py, /tmp/png_refine.py,
/tmp/png_gold.py — rerun-able in this container, no network required).

- Size 1402×1122, RGB 8-bit, non-interlaced.
- Dominant quantized colors (top 5): `#000810` 18.1%, `#000008` 6.7%, `#081018` 6.1%,
  `#001018` 5.7%, `#000818` 5.4% — all near-black blue-leaning.
- Zone brightness (0–255): full 33.5; top bar 23.5; left nav 13.7; center stage 40.9; right rail
  22.5; status band 15.1; lower-left 26.3; lower-right 43.9.
- Hero x-bands (y 8–55%): x0–10% 14.1, x20–30% 27.8, x50–60% 45.5, x70–80% **64.5**, x90–100% 18.1.
- Glow centroid ≈ (62.5% x, 46.6% y); brightest pixel (255,255,255) at ≈ (16.5%, 13.9%) — bright
  hero copy text upper-left.
- Gold family: 4384 sampled gold-ish pixels, mean `#c9967c` over antialiased edges; core
  saturated gold (159 px) mean `#e6b172`, most common ≈ `#e2b97a`.
- Cream family: mean `#e8e0d6`.
- Ink family: 267,977 sampled near-black pixels, mean `#060f18`; blue-leaning 116,007 vs
  brown-leaning 2,755 vs neutral 3,530.
- Accent coverage: goldish ≈0.75%, cream/light ≈0.66%, near-black ink ≈73.4%.
