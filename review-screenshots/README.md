# Aurora Atlas V3 — review screenshots (integration evidence)

Captured from a REAL browser (headless Chromium 151 over CDP) against the served
worktree, not mocked. Replay with:

    python3 -m http.server 8666 --directory <worktree-root>      # in background
    node tests/_capture-screenshots.mjs                          # drives CDP, writes these PNGs

Capture environment: chromium_headless_shell-1234, flags
`--use-angle=swiftshader --enable-unsafe-swiftshader --enable-webgl --ignore-gpu-blocklist
--no-sandbox --disable-dev-shm-usage --run-all-compositor-stages-before-draw`,
desktop viewport 1440x900 (mobile 390x844), deviceScaleFactor 1.
Page served at `http://127.0.0.1:8666/geobas-portal.html` (SPA; navigation driven by the
page's own `goHome / goRegions / goRegion / goCountry` + `currentLang='ar'`).

## Files

| File | View | Size | Notes |
|---|---|---|---|
| 01-home-dark-desktop.png | Home, dark, 1440x900 | 749 KB | Full instrument: topbar + left rail + hero + globe (center bluish = SwiftShader-rendered globe.gl) + status bar + right rail |
| 02-regions.png | Regions (Landinfo), 1440x900 | 268 KB | `goRegions()` — data-driven region table (map panel deferred per parent decision) |
| 03-countries.png | Region detail (Afrika), 1440x900 | 283 KB | `goRegion(7)` — country list (Nigeria..Kongo incl. Somalia) |
| 04-somalia-dossier.png | Country dossier (Somalia), 1440x900 | 446 KB | `goCountry(30)` |
| 05-ecuador-dossier.png | Country dossier (Ecuador), 1440x900 | 463 KB | `goCountry(1)` |
| 06-mobile.png | Home, 390x844 | 255 KB | `Emulation.setDeviceMetricsOverride` width 390 |
| 07-home-rtl-arabic.png | Home, Arabic RTL, 1440x900 | 596 KB | `currentLang='ar'; applyStaticI18n(); goHome()` — `dir=rtl`, Amiri/Noto Naskh |

## 08-home-light.png — NOT captured (intentional)

Light mode is **unshipped** in this rebuild. There is no theme toggle and no light palette
in `geobas-portal.html` (no `data-theme`, no `prefers-color-scheme`, no `☼` control).

- VISUAL-IMPLEMENTATION-SPEC.md §1.6: "Do not ship a light theme before review."
- VISUAL-IMPLEMENTATION-SPEC.md §6 S8: "Flagged DECISION — do not ship before art review."
- VISUAL-IMPLEMENTATION-SPEC.md §7.6: "Light mode is explicitly unsourced in the PNG."
- Parent task t_296ea8d9 decision: "light mode NOT shipped (theme toggle omitted)."

Capturing a light screenshot would require implementing (redesigning) the light theme,
which is outside the integration worker's write boundary. The vision verifier should treat
S8 as **DECISION / not-applicable**, not as a pass or fail.

## Stale baseline files (superseded)

`01-home.png`, `02-region.png`, `03-country.png` are leftover screenshots from the
pre-V3 baseline. They are superseded by the 01-…/02-…/03-… files above and are not part of
the V3 evidence set.

## geobas-portal.html state

Unchanged by this integration worker — sha256 `b72c995a…de55`, identical to the parent
presentation task's final state. No merge glitches / broken selectors were present to fix.
