# GeoBas — Editorial Atlas ("The Atlas of Return") · Round-Two Design Sprint

Worktree: geobas-editorial-story-v2 (branch design/editorial-story-v2, based on current main)
Changes are **uncommitted** for review. Nothing was merged or pushed.

---

## 1. Design thesis

GeoBas is reimagined as **a printed-style civic handbook / atlas**, not an app.
The product metaphor shifts from *portal with a map* to *a bound publication you
read*: "Återvändandets atlas — en handbok" (The Atlas of Return — a handbook).

Everything follows from one decision: **information is organized like a book's
front matter, parts, chapters, sections, plates, and footnotes**, and the
reader's journey is a reading journey (contents → part → chapter), not a
dashboard flow (hero → cards → stacks).

Visual language: warm paper background, ink typography (Fraunces display +
Newsreader text + JetBrains Mono for folio/labels), hairline rules and double
rules, roman numerals, section signs (§), drop caps, a title-page ornament, a
sticky marginal "map plate", and generous whitespace. Dark mode and rounded
"app" chrome are gone.

## 2. Major structural decisions

### Homepage = title page + contents (hero/globe/card-stack removed)
- `#view-start` is now front matter: issue eyebrow, oversized serif headline
  (the old `hero_h1_a/b` two-liner is kept, re-typed), a rule with ornament,
  a **Contents list** (Part I Regions · Part II About · Part III Self-study)
  with fake folio page numbers, and an **Editor's note** (new i18n strings in
  all four languages).
- The CTA ("Öppna atlasen" / Open the atlas) and a secondary About link sit in
  an open-row beneath. There is **no hero, no globe, no card grid** on the
  homepage.

### Regions = Part I · a chapter list, with a marginal map plate
- Regions render as a **table-of-contents chapter list** (roman numerals I…IX,
  serif names, country counts as folio, hover arrow) instead of a 3-column
  card grid. The spinning per-card mini-globes are removed.
- The interactive globe.gl globe is demoted to a small **map plate** — a framed,
  sticky figure with caption ("Karta över kapitlen — interaktiv") and the
  existing drag/hover/click hint, beside the chapter list. It is secondary.
  Because the plate lives in a view hidden at init, `goRegions()` now calls
  `setTimeout(onGlobeResize, 80)` after showing the view so the canvas gets a
  real size (guarded; no-op when sizes are 0).

### Countries = Part II · a printed index
- Countries render as a **two-column index/directory** (01, 02, … + name +
  arrow, "coming soon" stubs muted) instead of card tiles.

### Country = a publication chapter
- Chapter head: region tag, large serif H1, and the intro as a lead paragraph
  with a **drop cap**.
- Topic cards become **numbered sections** (§1, §2, … via CSS counters),
  full-width with hairline rules. On wide screens the layout is asymmetric:
  body text in the main column, and the **kv rows become a fact panel / pullout
  in the margin column** (copper top rule, paper panel), like a pull quote.
- Sources become a **"Sources & international organisations" footnotes block**
  with underline-chips; NGOs become a directory with hairline rows; the
  disclaimer is a footnote bar.

### About = Part II · About the handbook; Resources = Appendix
- About: photo plates + "What we offer" essay block + organisation directory.
- Resources: reading-list panels (styling only).

### System-level decisions
- Light paper theme with ink text; all old `--*` CSS variables re-valued so the
  JS inline styles (`var(--accent)`, `var(--danger)`, …) keep working.
- RTL (Arabic) mirrored: masthead, TOC, editor note border, drop cap, arrows;
  the section grid mirrors automatically (grid column order follows direction).
- Fonts: added Newsreader (text serif), kept Fraunces + JetBrains Mono +
  Noto Naskh Arabic, dropped Inter.
- CKEditor modal re-themed to light paper; modal structure/ids unchanged.
- Edit mode restyled as "annotation mode" (dashed rules, pencil red ×) but all
  edit affordances, inputs, and add/delete flows are unchanged.

## 3. Preserved functionality (unchanged code paths)

- Persistence: sql.js DB, `storage()` bridge (window.storage preferred,
  localStorage fallback), `STORAGE_KEY`/`persistDB` wiring — untouched.
- Security protections — untouched, all still exercised by the regression test:
  `escapeHtml`, `safeUrl` + `renderExternalLink`, imported-DB trust boundary
  (`validateImportedDb` / PRAGMA table_info / REQUIRED_SCHEMA), rich-text
  sanitizers (`sanitizeRichHtml/Text/Fragment`), attribute-context escaping in
  `renderLangSwitch` (`data-lang="${escapeHtml(l.code)}"`), modal preload
  round-trip (`<p>${sanitizeRichHtml(p)}</p>`).
- i18n: STRINGS sv/en/es/ar with 15 new keys per language (issue_tag, folio,
  toc_*, editor_note*, part_*, globe_caption, toc_open); T/Tf/applyStaticI18n,
  RTL dir switching — untouched.
- Navigation/routing: view ids (`view-start/regions/countries/country/about/
  resources`), `data-nav` delegation, crumbs, `region:` tokens — untouched.
- CRUD: regions/countries/cards/paragraphs/kv, NGOs, org directory, languages,
  export/import .sqlite, CKEditor modal — untouched.
- Globe: `initGlobe`/`refreshGlobePoints`/`world` kept; only the container's
  placement and one resize call changed.

## 4. Verification (basic smoke checks, as scoped)

- `node tests/regression.test.mjs` → **70/70 PASS** (54 runtime + 16 source
  wiring checks), including i18n, persistence, sanitizer, URL guard,
  lang-switch breakout, region render, CKEditor preload, globe interaction.
- Inline `<script>` extracted and `node --check` → syntax OK.
- Sink-count baselines unchanged: `innerHTML` 25, `outerHTML` 1,
  `insertAdjacentHTML` 1, `document.write` 0.
- Structural checks: every JS-referenced id exists (static or dynamic),
  all new `data-i18n` keys exist in sv/en/es/ar, CSS braces balanced,
  no leftover old-theme classes (`.grat-wash`, `.topbar`, `.hero-globe`,
  `.globe-stage`, `.badge-globe`, `.mini-globe`, `.country-hero`).

## 5. Known / obvious breakage (design-exploration limits)

- **Globe sizing on first paint**: the plate is hidden at init, so the globe
  initializes at 0×0 and is resized 80 ms after the Regions view becomes
  visible. If the user never visits Regions, the globe never renders (it's
  secondary by design). No runtime error expected (three.js tolerates 0-size
  canvases), but this is browser-only behavior — not covered by the Node sandbox.
- **CDN fonts**: editorial look depends on Google Fonts (Fraunces/Newsreader);
  offline fallbacks are Georgia/Menlo/system serifs — layout degrades but works.
- **Fake folio page numbers** in the Contents list (5/41/67) are decorative and
  not wired to real pagination.
- The old `hero_eyebrow`, `hero_cta`, `regions_eyebrow`, `countries_eyebrow`,
  `about_eyebrow`, `resources_eyebrow` strings are now unused (kept in STRINGS);
  `hero_h1` remains a composite key (hero_h1_a/b) as in the baseline.
- Edit-mode visual review (inputs, del buttons, ngo/org rows, add buttons) was
  not exercised in a real browser — only the render functions were unit-smoked.
- No browser was available in this environment: no screenshot/visual regression.

## 6. Files changed

- `geobas-portal.html` (only file; tests untouched)
