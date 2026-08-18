# LOGO-PROVENANCE — GeoBas V3 north-star (Polaris) logo system

Task: `t_7923df40` — "V3 north-star logo: original Polaris SVG system (primary, mono, favicon, badge) + provenance".
Status: bounded, dedicated stream (research `V3-ASSET-RESEARCH.md` §5). Deliverables land in `assets/logo/` and this file only.

## 1. Original-work statement

The artwork in this directory is **original work created for this task**. It was authored from scratch (hand-authored SVG geometry written directly for this deliverable); it is **not** a copy, trace, or derivation of any third-party logo, icon, icon-font glyph, or raster mark. No third-party asset was downloaded, embedded, or referenced. There is **no third-party license burden** on the artwork itself. Fonts named in the badge wordmark are referenced by family name with the site's existing font stack as fallback — no font files are bundled or licensed here (see §4.4).

The logo is a **celestial-navigation motif** built from three related elements, as recommended in `V3-ASSET-RESEARCH.md` §5:

1. **Compass rose** — an 8-point rose (4 cardinal + 4 intercardinal points) forming the instrument-like core of the mark.
2. **Polaris (the north star)** — a radiant 4-point star crowning the rose's elongated north point, with a soft glow; it is the visual hero and the "north-seeking" signal of the mark.
3. **Ursa Minor asterism (the Little Dipper)** — six companion stars plus hairlines, placed by a true polar (azimuthal equidistant) projection of the constellation about the north celestial pole, arcing out of the compass ring's upper-right sector. The asterism's handle end (α UMi, Polaris) is the radiant star itself.

## 2. Astronomical data (public domain) and projection

The star field reflects real, **public-domain** astronomical data:

- **Source: Hipparcos Catalogue** (ESA, 1997), epoch **J2000**, released as public-domain data with no usage restrictions. Coordinates (right ascension / declination) and visual magnitudes are reproduced below from this catalogue (readily reproducible from any public copy, e.g. the VizieR I/239 Hipparcos service or the public-domain Yale Bright Star Catalogue-derived listings). Access/check date for this task: 2026-08-18 (values are stable published J2000 constants).
- The asterism geometry is not a literal star-chart tracing; it is a **stylization** produced by an **azimuthal equidistant (polar) projection** centered on the north celestial pole (radius ∝ angular distance from the pole), scaled (`6.5 px/°`) and rotated (RA offset −260°) for composition, then drawn as a dedicated off-centre field so it nests beside the compass rose. Dot radius is scaled by each star's **visual magnitude** (brighter star → larger dot). The bowl quadriliteral (ζ UMi – η UMi – Kochab – Pherkad) and the handle (Polaris – Yildun – ε UMi – ζ UMi) preserve the sky's true relative arrangement.

| Star (Hipparcos name) | RA (J2000)   | Dec (J2000)  | Vmag | Screen pos (px, vs 512) |
|---|---|---|---|---|
| α UMi — **Polaris**   | 02ʰ31ᵐ49.09ˢ | +89°15′51″ | 1.98 | radiant star at (256,118) |
| δ UMi — Yildun        | 17ʰ32ᵐ12.9ˢ  | +86°35′11″ | 4.35 | (352.2, 188.8) |
| ε UMi                | 16ʰ45ᵐ58.2ˢ  | +82°02′14″ | 4.21 | (381.4, 197.7) |
| ζ UMi                | 15ʰ44ᵐ03.5ˢ  | +77°47′40″ | 4.29 | (402.8, 222.4) |
| η UMi                | 16ʰ17ᵐ30.3ˢ  | +75°45′19″ | 4.95 | (419.5, 215.0) |
| β UMi — **Kochab**    | 14ʰ50ᵐ42.4ˢ  | +74°09′20″ | 2.08 | (412.2, 252.6) |
| γ UMi — **Pherkad**   | 15ʰ20ᵐ43.7ˢ  | +71°50′02″ | 3.05 | (432.8, 248.9) |

Heights: the visual star order by magnitude is genuinely Polaris (1.98) > Kochab (2.08) > Pherkad (3.05) > ε/ζ (4.2) > Yildun/δ (4.3) > η (4.95); the mark reproduces this hierarchy (radiant Polaris largest, Kochab/Pherkad the biggest dots, η the smallest).

## 3. Design rationale

**Motif.** A government "civic atlas" identity that should feel navigational, trustworthy, and quietly premium. The north star / Pole Star is the universal "you are oriented / we will guide you" symbol — apt for country-information guidance. The compass rose gives it the cartographic, instrument-like character of an atlas; the Little Dipper tells the trained eye "this points at Polaris", reinforcing the orienting idea without text.

**Geometry.** Drawn on a 512×512 grid. Centred hub (single focal point) keeps the mark calm and heraldic: rose hub `r=13.5`, rose half-lengths 128 (N) / 118 (S·E·W) / 74 (diagonals), compass ring `r=150` with 5°/15°/90° degree ticks (the constellation sector −5°…+40°, and the N cardinal, are left open for the star field and the radiant star), faint chart hairlines at `r=96/124`, tile `420×420` with `rx=100`. The N point is elongated so the upward "north beam" dominates the silhouette.

**Palette.** Uses the Aurora Atlas V3 palette exactly (`V3-ASSET-RESEARCH.md` §9.4 and the task brief): gold `#e9bd73` / highlight `#ffcf81` on ink `#020812` / `#06111e`, with cream `#f2eadf` for the asterism dots and wordmark. `#fff3d6` (a lighter cream-gold) is used only as the star's highlight. Dark ink surfaces are the brand atmosphere (see §4.3).

**Typography (badge).** Serif + sans pairing per the identity: `GEOBAS` set in a geometric sans (Inter, with Helvetica/Arial fallback) in letterspaced caps for an institutional, engineering feel; `CIVIC ATLAS` set in a display serif (Source Serif 4 / Cormorant Garamond, Georgia fallback), letterspaced, gold — the "atlas" voice. Wordmark choice: institutional caps `GEOBAS` (matches the product name spelled "GeoBas" in prose) with the section line `CIVIC ATLAS`.

## 4. Usage notes

**4.1 Files.**

| File | Role | Notes |
|---|---|---|
| `primary-northstar.svg` | Primary full-colour emblem (512×512) | Self-contained ink tile; use on dark surfaces. |
| `northstar-mono.svg`   | Mono / single-colour emblem (512×512) | Transparent; **one colour channel only** — every stroke/fill is `currentColor`, defaulting to gold `#e9bd73`. Retint for any surface by setting CSS `color` (e.g. `color:#f2eadf` on light). |
| `favicon.svg`          | Favicon source of truth (64×64) | Simplified: ink tile + ring + 4-point star. |
| `favicon.ico`          | Favicon for legacy browsers | 16/32/48 (32bpp BMP-in-ICO) + 256 (PNG-in-ICO); rasterized from the same geometry. `favicon.svg` is the canonical vector; the `.ico` is an anti-aliased hand-rasterization for compatibility. |
| `badge-northstar.svg`  | Small lockup badge (400×112) | Emblem tile + `GEOBAS / CIVIC ATLAS` wordmark. |

**4.2 Sizing.** The primary and mono emblems are safe from **48px (minimum legible, favour 96px+)** upward to any large size; the badge is legible from **~128px** and designed for header/hero/footer lockups; the favicon is tuned for 16–64px. All are clean vectors and scale losslessly.

**4.3 Dark / light compatibility.** The brand operates on the **dark ink atmosphere** (`#020812`/`#06111e`); `primary-northstar.svg` ships as a self-contained ink-tile emblem and reads on any background. `northstar-mono.svg` and the badge are designed for ink surfaces — `northstar-mono.svg` is genuinely adaptive (single `currentColor`) so it can be re-tinted for light or ink contexts. For a light-surface primary, use the mono file tinted `color:#c8954d` or rebuild the tile; the palette's cream `#f2eadf` is the light-surface alternative to gold.

**4.4 Safe area & placement.** Keep a clear space ≥ the radius of the centre boss (for emblems) or ≥ 8px (for the badge) around the artwork on all sides. In the full-width lockup, place the emblem tile to the left of the wordmark with ≥ 12px separation. On the site (a **later integration task**, not performed here — `geobas-portal.html` was intentionally **not** edited): badge in the header/hero, mono in print/emboss/monochrome contexts, favicon via `<link rel="icon" type="image/svg+xml" href="assets/logo/favicon.svg">` plus `favicon.ico` as a legacy fallback.

## 5. Validation performed (this run)

Environment notes: no browser rasterizer, no ImageMagick/inkscape, and no network were available in this container, so validation used a **stdlib-only** pipeline (Python `xml.etree` + a software vector rasterizer written for the task), which operates directly on the committed file content:

- All four SVGs parse as **well-formed XML** (`xml.etree`), are inside their `viewBox` (every shape/line/point within `[0,W]×[0,H]`), and rasterize to expected geometry in an ASCII preview (verified rose, ring+ticks, radiant star, and Ursa Minor arc present).
- **Mono single-colour:** every `fill`/`stroke` in `northstar-mono.svg` is `currentColor` or `none`; no other fill/stroke colour literal exists. The only literal hex values are the root `color="#e9bd73"` default and documentation comments.
- **favicon.ico decodes:** the file was re-read and every entry verified — 16/32/48 BMP and 256 PNG headers/dimensions correct, center pixel gold, rounded-tile corners transparent, tile edge ink (values below).
- The radial/linear gradients are simple brand inks/golds with no out-of-range coordinates.

favicon.ico decode summary (from verifier): `BMP 16x16 ok`, `BMP 32x32 ok`, `BMP 48x48 ok`, `PNG 256x256 ok`; center ≈ `#d8a55c` (gold, AA-mixed), corners `alpha=0`, tile edge `alpha=255` ink. 21,396 bytes, 4 entries.

> Honest limitation: actual pixel rendering in a browser/OS was **not** executed (no rasterizer/network here). The above is structural geometry + decode verification, not a substitute for a human eyeball in a browser. A human review of the visual is recommended at the brand lockup stage.

## 6. Boundary compliance

Written **only** to `assets/logo/` (five files) and this provenance file. `geobas-portal.html`, `tests/`, the packet/provenance research files (`ACCEPTANCE.md`, `AURORA-ATLAS-V3-PACKET.md`, `FOA-RUN.md`, `VERIFY-AND-GATE.md`, `V3-ASSET-RESEARCH.md`, `README.md`), and all other `assets/` subdirectories (`js/ data/ img/ fonts/ flags/ icons/`) were **not** modified (byte-hashes unchanged). No push/merge/deploy/mutate of `main`; no commit was made (local git plumbing is unavailable in this container — commit was optional).
