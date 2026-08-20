# GeoBas Aurora Atlas V3 — IMAGE PROVENANCE (country-dossier banner imagery)

Task: `t_fe466a84` — "FOA preflight: source country imagery + prepare workspace".

Status: **VERIFIED / COMPLETE (2026-08-20, host-capable operational profile).**

This file replaces the previous unverified notes written by a network-blocked Docker
worker (`t_8d58f5a7`). That worker made **zero** license/creator/attribution claims
(correctly, since it could not reach a live file page). Every claim below was verified
this run by fetching the live Wikimedia Commons API metadata (`action=query&prop=imageinfo
&iiprop=extmetadata`) for the exact file page, and by downloading the exact original.

---

## 1. Image 1 — Somalia / Mogadishu

| Field | Value |
|---|---|
| Local file | `assets/img/countries/country-somalia.jpg` |
| Size / bytes | 1,326,968 bytes (1.27 MB) |
| Dimensions | 3766 × 2511 px |
| Format | JPEG (Exif; Canon EOS-1D Mark III), original, **no compression/transformation applied** |
| SHA-256 | `e8e9dc339bdc259ea2cdf442bfc816ad42c77fa80a85514149e7c56a707ef348` |
| Commons file page | https://commons.wikimedia.org/wiki/File:Former_parliament_building_of_Mogadishu,_Somalia_on_5_August_2013.jpg |
| Original direct URL | https://upload.wikimedia.org/wikipedia/commons/1/19/Former_parliament_building_of_Mogadishu%2C_Somalia_on_5_August_2013.jpg |
| Source / credit | African Union–United Nations (AU/UN) Information Support Team; credit line "AMISOM Public Information" |
| Creator / author | AMISOM Public Information |
| Caption (embedded EXIF) | "SOMALIA, Mogadishu: In a photograph taken 05 August 2013 and released by the African Union-United Nations Information Support Team…" |
| License | **CC0 1.0 Universal — Public Domain Dedication** (http://creativecommons.org/publicdomain/zero/1.0/deed.en) |
| Attribution required? | **No** (CC0). Courtesy credit to AMISOM Public Information is optional. |
| Date captured | 2013-08-05 |
| Date accessed (this run) | 2026-08-20 |

Attribution text (optional courtesy, not required): "© African Union–United Nations
Information Support Team (AMISOM Public Information), CC0, via Wikimedia Commons."

Because CC0 waives all rights, no attribution string must appear in the app; the entry in
this file + ASSET-INDEX.md satisfies provenance. A short on-screen credit is nonetheless
harmless and recommended.

---

## 2. Image 2 — Ecuador / Quito

| Field | Value |
|---|---|
| Local file | `assets/img/countries/country-ecuador.jpg` |
| Size / bytes | 108,036 bytes (105 KB) |
| Dimensions | 1280 × 647 px |
| Format | JPEG (JFIF 1.01), original, **no compression/transformation applied** |
| SHA-256 | `c8bb9a61907e6d846d711bf31806b8e48201ae392de184e77a0d6ecbf7b30084` |
| Commons file page | https://commons.wikimedia.org/wiki/File:Gebr%C3%BCder_Underwood_-_Blick_auf_Quito_(Zeno_Fotografie).jpg |
| Original direct URL | https://upload.wikimedia.org/wikipedia/commons/9/9e/Gebr%C3%BCder_Underwood_-_Blick_auf_Quito_%28Zeno_Fotografie%29.jpg |
| Source / credit | Zeno.org (German historical-image collection), ID 2000187179X, via Wikimedia Commons |
| Creator / author | Gebrüder Underwood (photographer) |
| Title | "Blick auf Quito" (View of Quito) |
| Date | circa 1900 |
| License | **Public domain** (pre-1929 published photograph; copyright expired). `Copyrighted: false`. |
| Attribution required? | **No** (public domain). |
| Date accessed (this run) | 2026-08-20 |

No attribution text is required (public domain). Optional courtesy: "Historic view of
Quito, c. 1900 — Gebrüder Underwood, public domain, via Wikimedia Commons / Zeno.org."

---

## 3. Verification method (how each claim was established)

For each file name, this run queried the live Commons API:

    GET https://commons.wikimedia.org/w/api.php
      action=query&titles=<exact file>&prop=imageinfo&iiprop=url|size|mime|extmetadata

and read `extmetadata` fields `LicenseShortName`, `LicenseUrl`, `Artist`, `Credit`,
`UsageTerms`, `AttributionRequired`, `DateTimeOriginal`, `Copyrighted`, plus the
original-content URL. Downloads were made from the returned `upload.wikimedia.org`
original URL and the byte size was confirmed to match the API `size` field; the file was
opened with `file(1)` to confirm valid JPEG dimensions. No hotlinked or scraped images
were used; no credits were invented.

License decision rationale (per task): both images use the **simplest** verifiable
licensing (CC0 / Public Domain) with **no attribution obligation**, satisfying the
preference: "PD / CC0 / CC BY ... CC BY-SA only if terms can be satisfied cleanly;
otherwise choose simpler licensing." Simpler licensing was choosable here, so it was used.
(Modern high-res Quito skylines on Commons are predominantly CC BY-SA; a PD alternative
was intentionally selected.)

---

## 4. Boundary compliance

- Work confined to branch `design/aurora-atlas-v3-next`. **`main` was not modified,
  pushed, merged, or deployed.**
- `geobas-portal.html` was **not edited** in this task. (Note: the working tree already
  carried a pre-existing, unstaged modification to `geobas-portal.html` from an earlier
  worker; it is intentionally **not** part of this task's commit.)
- All other files preserved. Only the new provenance doc + two new image files are added.
- Commit/push scope: see the commit message and ASSET-INDEX.md update for the exact asset
  set. Non-force push on `design/aurora-atlas-v3-next`, no tags, no other refs.

## 5. Workspace preflight for downstream offline Kanban (verified 2026-08-20)

All items below were confirmed present and readable on the shared worktree:

| Asset group | Location | Files | Status |
|---|---|---|---|
| Vendored JS (globe.gl, three, topojson, sql.js) | `assets/js/` | 6 | present |
| Geo data (countries 50m/110m TopoJSON) | `assets/data/` | 2 | present |
| Flags | `assets/flags/` | 43 | present |
| Icons | `assets/icons/` | 53 | present |
| Fonts (amiri, inter, jetbrains-mono, noto-naskh-arabic, source-serif-4) | `assets/fonts/` | 15 | present |
| Licenses (THIRD-PARTY notices) | `assets/licenses/` | 13 | present |
| Planet textures | `assets/img/` | 3 | present |
| **Country banners (NEW)** | `assets/img/countries/` | 2 | present |

- **Outbound network — verified up on branch `design/aurora-atlas-v3-next`:** Commons
  `301`, Wikipedia API `200`, GitHub `200`; `git ls-remote origin` over SSH succeeded
  (so push is possible). Downstream Docker workers that lack egress can now work fully
  offline against the vendored tree.
- **Remaining external prerequisites (to note, not blockers for the vendored stack):** the
  app may still reference a JS CDN at runtime unless the implementation already rewires to
  the vendored `assets/js/*`. A downstream worker should confirm `geobas-portal.html`
  references only local vendored assets (no `cdn.`/`unpkg`/`jsdelivr`) once it becomes
  authorised to touch that file. No other blocking network requirement remains for the
  vendored globe/data/icons/flags/fonts stack.
