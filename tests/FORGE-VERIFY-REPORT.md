# ForgePilot independent verification — Aurora Atlas V3 focused hero + dossier
Task t_274a4965 — verifier: forgepilot-verifier — 2026-08-20

Workspace: /workspace (bind of host worktree design/aurora-atlas-v3-next)
Baseline: host-preflight commit 59083268dac4; uncommitted implementations
t_7c9963a1 (real Earth hero) + t_53a1429a (premium country dossier).
NOTE: git object store / worktree metadata resolve to a host path
(/home/ridasaidd/geobas-portal/.git/worktrees/...) that is NOT mounted in this
docker backend, so a true `git diff` against 5908326 was not obtainable here.
Material state was verified directly against the on-disk files.

=====================================================================
1. MECHANICAL EVIDENCE (all observed on-disk / via real tool runs)
=====================================================================
- node tests/regression.test.mjs  -> 71 PASS / 0 FAIL (ALL CHECKS PASSED, exit 0)
    covers persistence (localStorage fallback + window.storage bridge),
    initDatabase/persistDB wiring, lang-switch attr-injection, unsafe URL
    rejection (safeUrl/renderExternalLink/updateNgo/updateOrg), SQLite import
    trust boundary (validateImportedDb tables+columns+types+affinity),
    rich-text sanitizer (render+preload round-trip), i18n (4 langs, T/Tf, RTL
    via applyStaticI18n), home/regions render, renderTopicCard re-sanitize,
    CKEditor modal preload round-trip, and 16 module-level source-wiring checks.
- node tests/render-smoke.mjs       -> "SMOKE VIEWS RENDERED: ALL OK", exit 0
- node tests/verify-dossier.mjs     -> VERIFY COMPLETE, exit 0
    - dossier-hero backgroundImage =
      linear-gradient(..., radial-gradient(circle at 82% 12%,
        rgba(244,183,110,.32), transparent 32%),
        url('assets/img/countries/country-somalia.jpg'))   <- LOCAL asset
    - hero credit: "Bild: (c) AU/UN AMISOM Public Information - CC0, via Wikimedia Commons"
    - hero flag: assets/flags/SO.svg  (local)
    - overview / quick-facts / related rendered with i18n labels
    - topics-grid renders 4 topic cards; setDossierTab('security') filters to
      the security card and hides facts (style.display 'none')  <- tab logic works
    - setDossierTab('orgs') renders ngo-list with safe link
      <a href="https://iom.int/" target="_blank" rel="noopener">
- Node --check on extracted inline <script>            -> SYNTAX OK (274,305 bytes)

=====================================================================
2. SINK BUDGET — independent review (required: 29 -> 33, legitimacy/security)
=====================================================================
Independently counted on the inline script: innerHTML = 33, outerHTML = 1,
insertAdjacentHTML = 1, document.write = 0. Matches regression source check
(=== 33) exactly. The 4 new sinks are the premium country dossier:
  1) renderOverview   -> dossier-overview   (line 2447) escapeHtml() on all values
  2) renderQuickFacts -> dossier-facts      (line 2463) escapeHtml() on k/v
  3) renderRelated    -> dossier-related    (line 2485) escapeHtml() + local flag
  4) renderTopicArea  -> topics-grid + empty-state (lines 2497/2501/2507/2513)
     uses renderTopicCard -> sanitizeRichFragment(p) + escapeHtml(k/v)
All 4 new sinks escape or sanitize dynamic data before assignment; none
introduce an unescaped sink. renderTopicCard re-sanitizes body at render time
(confirmed by regression check #8) and pickIcon() returns only a whitelisted
ICONS key. LEGITIMATE. No new document.write / eval / new Function.

=====================================================================
3. ASSET WIRING — required checks
=====================================================================
- VERIFIED: no CDN/hotlinked src for the banner/hero imagery. Hero globe uses
  assets/img/earth-night.jpg, earth-topology.png, assets/data/countries-110m.json,
  assets/js/globe.gl.min.js, topojson-client.min.js (all local).
- VERIFIED: Somalia banner -> assets/img/countries/country-somalia.jpg (local)
- VERIFIED: Ecuador banner -> assets/img/countries/country-ecuador.jpg (local)
  (both files exist on disk; IMAGE-PROVENANCE.md documents SHA-256 + Commons
  provenance, CC0/Public Domain; verified flags assets/flags/SO.svg, EC.svg)
- VERIFIED local files exist: earth-night.jpg, earth-day.jpg, earth-topology.png,
  countries-110m.json, globe.gl.min.js, topojson-client.min.js, sql-wasm.js/.wasm,
  SO.svg, EC.svg, country-somalia.jpg, country-ecuador.jpg.

>>> "verify no CDN/hotlinked runtime assets" — NOT SATISFIED (see section 6) <<<

=====================================================================
4. ROUTER / i18n / THEME / RTL / PERSISTENCE / EDITOR / IMPORT-EXPORT / SECURITY
=====================================================================
- Router (goHome/goRegions/goCountry/goResources/handleNav): exercised by
  regression home/regions smoke; dossier tab switch verified via verify-dossier.
- i18n: STRINGS sv/en/es/ar (4 langs) confirmed; T() per-lang + fallback to sv;
  applyStaticI18n sets dir=rtl+lang=ar for ar and dir=ltr for sv. Confirmed.
- Theme: [data-theme="light"] defined; dark default; RTL specific rules present
  (e.g. [dir="rtl"] body/headings font switch), modest. Confirmed present.
- RTL: dir attribute switching verified; CSS RTL coverage present.
- Persistence: storage() adapter + initDatabase/persistDB bridge verified
  (71/71 regression incl. quota error + window.storage preference).
- Editor: CKEditor modal fallback + preload round-trip verified (regression #9).
  NOTE: CKEditor itself is loaded from CDN (see section 6).
- Import/export: validateImportedDb trust boundary verified (regression #5);
  export() path covered by initDatabase/persistDB export usage.
- Security: sanitizer, safeUrl already noted; no new unescaped sinks.
No material regression detected in any of these subsystems by the mechanical suite.

=====================================================================
5. REDUCED MOTION / SCOPE
=====================================================================
- prefers-reduced-motion media query present (CSS) + JS-side globe handling
  (arcDash/rings/autoRotate disabled under reduced motion). Confirmed.
- No unrelated third-party-system files appear modified by this task's scope;
  all verifier-only inspection scripts are prefixed _ and live in tests/.

=====================================================================
6. FINDINGS / BLOCKERS
=====================================================================
A) VISUAL / BROWSER / WebGL GATE — NOT AVAILABLE IN THIS BACKEND
   - No chromium/chrome/firefox binary; xvfb present only (no browser).
   - No playwright, puppeteer, jsdom, or canvas in /opt/hermes/node_modules or
     global; no node_modules with browser tooling.
   - NO NETWORK EGRESS (fetch to registry.npmjs.org failed) -> cannot install a
     headless browser or WebGL runtime.
   => Screenshot/WebGL visual comparison (home dark desktop, Somalia & Ecuador
      dossier dark desktop, light/RTL sanity) CANNOT be produced here. Material
      visual fidelity vs DESIGN-REFERENCE.png (recognizable real Earth, geography/
      texture, atmospheric limb, warm SUN behind limb, thin arcs, dossier
      hierarchy/grammar) is therefore UNVERIFIABLE by this worker. Per the task
      instruction, this is an explicit BLOCK, not a PASS claim: mechanical
      evidence is complete, but reference-fidelity/visual parity remains open.

B) "NO CDN / HOTLINKED RUNTIME ASSETS" — NOT MET
   Active runtime external loads remain in geobas-portal.html:
     line 9   <link href="https://fonts.googleapis.com/css2?...">  (Google Fonts)
     line 10  <script src="https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/sql-wasm.js">
     line 11  <script src="https://cdn.ckeditor.com/ckeditor5/40.0.0/classic/ckeditor.js">
     line 1019 SQLJS_CDN = 'https://cdn.jsdelivr.net/npm/sql.js@1.10.3/dist/'
               used at initDatabase: locateFile: f => SQLJS_CDN + f  (line 1837)
   Context: these are DOCUMENTED pre-existing residuals (THIRD-PARTY-NOTICES.md
   §7: CKEditor deliberately retained on CDN; sql.js CDN constant "reserved for
   implementation worker"; IMAGE-PROVENANCE.md §5: app "may still reference a JS
   CDN ... unless the implementation already rewires"). They were NOT introduced
   by the focused hero/dossier diff, and their documented disposition is a
   downstream wiring decision. The local vendored copies DO exist
   (assets/js/sql-wasm.js + .wasm, assets/fonts/*) but are not yet wired
   (fonts: local @font-face also present AND Google Fonts link both load).
   So: the literal required check "no CDN/hotlinked runtime assets" is not
   satisfied at face value; whether that rises to a FAIL for THIS focused task
   is for FOA, but it must be surfaced as an unmet required check, not hidden.

C) VERIFICATION BOUNDARY: `git diff` against commit 5908326 not obtainable
   (worktree metadata points at an un-mounted host path). Material state was
   verified directly instead; provenance of the two uncommitted implementations
   is asserted by on-disk content + passing tests rather than a diff.

=====================================================================
7. RECOMMENDED DISPOSITION
=====================================================================
BLOCK (needs_input / visual gate) — do NOT mark PASS:
 1. Run host-side visual verification against DESIGN-REFERENCE.png: open this
    exact geobas-portal.html in a WebGL-enabled browser and capture the three
    required dark-desktop frames (home, Somalia dossier, Ecuador dossier) + one
    light or RTL sanity frame; judge Earth recognizability, limb, warm SUN
    behind upper-right/right limb, thin arcs, and dossier hierarchy/grammar.
 2. Decide CDN disposition: rewire sql.js to the vendored assets/js/sql-wasm.js
    and decide whether the Google Fonts link and CKEditor CDN may remain
    (GPL/offline concerns per THIRD-PARTY-NOTICES §7), or confirm the residual
    is an accepted, documented exception to the "no CDN" required check.

=====================================================================
ADDENDUM (FOA host-side continuation, task t_bf5e48ee, 2026-08-20)
=====================================================================
The two blockers above were resolved by a host-side continuation that reused
the already-captured WebGL screenshots in `verifier-evidence/` (this verifier's
docker backend had no browser/network; the host run did capture them).

A) VISUAL GATE — PASSED. Real browser captures (1440x900) were re-judged
   independently with a pure-Node PNG analyzer + full-source inspection:
   - HOME dark desktop: 86.8% dark premium bg; real globe = night-earth texture
     with a large geographic landmass + ocean, warm sun-glow cluster at the
     UPPER-RIGHT limb, and the globe source config proves showAtmosphere(true)
     with warm amber atmosphereColor '#9c6729' (alt 0.18), bump relief
     (earth-topology.png), faint coastline polygons, and thin RESTRAINED dashed
     arcs (arcStroke 0.4, arcDashLength 0.6) + gold rings
     (rgba(233,189,115,.55)) — a single static frame under-detects animated
     dashed arcs, hence partial pixel confirmation, full config confirmation.
   - SOMALIA dossier dark: hero image band (local country-somalia.jpg) +
     warm gold radial (244,183,110) + body/facts/support text rows + gold
     accent; grammar dark 73%, gold ~1%, cream distributed.
   - ECUADOR dossier dark: same premium structure; grammar dark 75%, gold ~1%.
   - LIGHT sanity: genuine light theme (74% bright, 60% cream).
   - RTL ARABIC sanity: dark RTL frame renders (91% dark, gold at 59%W).
   Evidence: tests/_analyze_visual.mjs, _analyze_grammar.mjs, _arcs.mjs,
   _pnglib.mjs (all _-prefixed, verifier-only).

B) CDN DISPOSITION — RESOLVED (recorded in THIRD-PARTY-NOTICES §7):
   - sql.js: wired to vendored local assets/js/sql-wasm.js (SQLJS_CDN='assets/js/').
   - Web fonts: Google Fonts <link> + preconnects removed; all 5 families served
     locally via corrected @font-face (assets/fonts/, OFL-1.1); --serif remapped
     from non-vendored Cormorant Garamond to the vendored display serif
     Source Serif 4.
   - CKEditor 5: remains the SOLE retained CDN reference (documented deliberate
     exception).
   Regression 71/71, render-smoke ALL OK, verify-dossier COMPLETE, syntax OK.
