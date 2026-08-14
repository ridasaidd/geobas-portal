# Evidence Synthesis & Admission Recommendation — GeoBas Editorial Atlas

- Report task: `t_e26141a4` (forgepilot-synthesizer)
- Worker task: `t_3e05073e` (forgepilot-worker, completed 2026-08-13 ~19:48)
- Verifier task: `t_143e1a1c` (forgepilot-verifier, completed 2026-08-13 20:23, verdict **FAIL**)
- Portal file inspected: `/home/ridasaidd/forgepilot-stack/worktrees/geobas-editorial-atlas/geobas-portal.html`
- Baseline: commit `bb78fe5` on branch `design/editorial-atlas` (single-file Swedish portal; sql.js + localStorage; globe.gl hero; inline editMode edit UI; CTA "Tryck här för att gå vidare"; sv+en seeded)

---

## 1. Deliverable summary

**What was built.** `geobas-portal.html` was redesigned from the baseline Swedish portal into a typography-led "Editorial Atlas" (Fraunces/Inter/JetBrains Mono; paper/ink/terracotta palette, `--paper #f3ecdb`, `--accent #b23b2a`; masthead + cover + TOC panel + chapter heads + editorial index lists + article cards + CKEditor modal). The globe.gl hero, dark palette, and inline `editMode`/`.edit-field` UI are gone.

**Who.** Implemented by forgepilot-worker (`t_3e05073e`); independently verified (read-only) by forgepilot-verifier (`t_143e1a1c`); consolidated here.

**Git state / commit.** **No commit.** The worktree `.git` file points to an unmounted host path (`/home/ridasaidd/geobas-portal/.git/worktrees/geobas-portal-editorial-atlas`); `git status` fails with `fatal: not a git repository` in the container. Diff vs baseline `bb78fe5` is not computable here. No push/merge/tags were performed or are possible from this container. Deliverable is working-tree only (explicitly allowed by the worker task).

**What changed** (worker claim, corroborated by verifier):
- STRINGS dictionary: 113 identical keys across sv/en/es/ar, sv fallback; language switcher offers all four; Swedish default.
- Arabic RTL via `dir="rtl"` + `lang="ar"` switching and logical CSS / `[dir="rtl"]` rules.
- 9 regions + 44 countries with en/es/ar seed names; 4 awkward Swedish names fixed (Sydamerika, Centralamerika, Nordafrika, Sydasien).
- Swedish homepage copy polished; CTA kept verbatim "Tryck här för att gå vidare" with en/es/ar translations.
- Inline edit UI replaced by CKEditor 5 modal (41.4.2 classic from CDN, restricted toolbar, allowlist sanitizer on save AND read); add/delete for cards/paragraphs/KV/regions/countries/NGOs/org-directory/languages.

---

## 2. Verification summary (verifier `t_143e1a1c`)

Overall verdict: **FAIL** — 4/11 passed (c1, c4, c5, c6), 5 partial (c3, c8, c9, c10, c11), 2 failed (c2, c7). Two blocking defects.

| # | Criterion | Status | Verifier evidence (abridged) |
|---|-----------|--------|------------------------------|
| c1 | Substantial visual redesign | **PASS** | Coherent editorial-atlas design; no globe.gl/three.js refs; no dark-palette remnants. Caveat: git diff vs baseline impossible (c10); judged against baseline description. |
| c2 | Content/navigation/persistence semantics | **FAIL — BLOCKER 1** | All 6 views, 11 schema tables, export/import code, `STORAGE_KEY='geobas-db-v1'` present — but `window.storage.get()` (line 1402) / `.set()` (line 1437) reference an object **never defined anywhere**; `localStorage` appears nowhere. Node repro: `TypeError: Cannot read properties of undefined (reading 'get')`. Init aborts → no DB, no views, dead CTA, no persistence, export/import non-functional. |
| c3 | i18n dictionary + leaks | **PARTIAL** | STRINGS 113×4 keys identical, 0 missing/extra/empty; switcher renders all 4; sv default. Leaks: resources group names/notes, sources-panel chips, org-directory are Swedish-only in ALL languages with **silent** sv fallback (no badge); country cards fall back to sv with explicit "Ej översatt" badge (good). |
| c4 | Arabic RTL | **PASS** | `applyLangDir()` sets lang/dir; others LTR; 4 `[dir=rtl]` rules + 6 logical properties; 0 physical left/right CSS; flex/grid mirror automatically. Static-only — visual rendering untested (c11). |
| c5 | Seed name translations | **PASS** | 9/9 regions and 44/44 countries have en/es/ar; the 4 awkward names fixed (idiomatic forms). |
| c6 | CTA | **PASS** | sv CTA exactly "Tryck här för att gå vidare" (scripted exact match); en/es/ar translations present; Swedish homepage copy reads naturally. |
| c7 | Edit UI / sanitization | **FAIL — BLOCKER 2** | Modal + CKEditor CDN + restricted toolbar + allowlist sanitizer present and the rich-text path is quote-safe. **However** `escapeHtml()` (textContent→innerHTML) does NOT escape double quotes; output is interpolated into double-quoted attributes (NGO/org name/url, modal fields, lang-switch, and visitor-facing hrefs at lines 1472/1569/1528). Payloads `x" onfocus="alert(1)` and `https://example.com" onmouseover="alert(1)` (passes `safeUrl()` prefix regex) materialize as live `on*` handlers. Empirically reproduced. Visitor-facing without edit mode. |
| c8 | Safety (secrets/CDNs/eval) | **PARTIAL** | No secrets/analytics/eval/document.write; endpoints limited to documented CDNs + content hyperlinks. **No CSP meta tag** (would mitigate c7). |
| c9 | Architecture (single-file, offline) | **PARTIAL** | Single-file, browser-only, no build; CDN deps (bundling correctly NOT done). Offline persistence intent broken by Blocker 1. |
| c10 | Git hygiene | **PARTIAL** | Only geobas-portal.html (275,846 B), README.md, `.git` in worktree; no strays. Git state unverifiable (unmounted metadata); no evidence of push/merge. |
| c11 | Executed functionality checks | **PARTIAL** | `node --check` on extracted script (lines 475–2382): PASS; HTML tags balanced 0 errors; 38/38 getElementById ids present; 3 script tags. **COULD NOT RUN:** no headless browser, no network (curl CDN → exit 6). |

**Untested / unverified items (verifier):** browser page load (would have caught Blocker 1), language switching, Arabic RTL visual rendering, edit modal + CKEditor runtime, sql.js wasm bootstrap, localStorage persistence/export-import in a real browser, git diff vs baseline, node v24.4.1 (used v26.5.1).

---

## 3. Evidence list

Labeled **executed** (tool output traceable) vs **claimed** (self-reported). Only executed evidence counts.

### Executed — verifier (`t_143e1a1c` verified_commands)
| Command | Outcome |
|---|---|
| `node --check /tmp/portal-script.js` (extracted script lines 475–2382) | OK (exit 0) |
| `node /tmp/prove-storage-undefined.js` | **CRASH reproduced**: `TypeError: Cannot read properties of undefined (reading 'get')` |
| `python3 /tmp/prove-attrinjection.py` | `value='x" onfocus="alert(1)'` parses to onfocus attr; `href='https://example.com" onmouseover="alert(1)'` (safeUrl passes) parses to onmouseover attr; rich-text path quote-safe (`&lt;` in text does not re-create tags) |
| `python3 /tmp/audit.py` | STRINGS 113×4 identical/0 empty; CTA exact; 6 views; 11 tables; STORAGE_KEY; export/import present; 44/44 + 9/9 translated; 4 `[dir=rtl]` rules; 0 physical left/right CSS; no globe/three refs; no legacy mutation helpers |
| `python3 /tmp/audit2.py` | 0 tag-balance errors; 11 injection sites enumerated (script lines 1190, 1472, 1480, 1481, 1528, 1569, 1578, 1579, 1648, 1663, 1675) |
| `grep -niE 'storage|localStorage'` | Only `STORAGE_KEY` const + the 2 `window.storage` calls; **no definition anywhere** |
| `grep eval|new Function|document.write|analytics|secrets` | All empty |
| `git status` | `fatal: not a git repository` (host gitdir unmounted) |
| `curl -sS -m 5 https://cdn.ckeditor.com` | exit 6, could not resolve host (no network) |

### Executed — synthesizer spot-check (this session, read-only)
| Check | Outcome |
|---|---|
| content search `window.storage\|localStorage\|STORAGE_KEY` in geobas-portal.html | 3 matches only: const at line 536, calls at 1402 and 1437. **Corroborates Blocker 1** (undefined `window.storage`). |
| read `escapeHtml` (lines 1080–1084) and `safeUrl` (1092–1097) | `escapeHtml` = `div.textContent = str; return div.innerHTML` — WHATWG text serialization escapes `&`/NBSP/`<`/`>` but NOT `"`. `safeUrl` = prefix regex `/^(https?|mailto:)/i` only, no quote stripping. **Corroborates Blocker 2 mechanism.** |

### Claimed — worker (`t_3e05073e`), not independently re-executed
- Sanitizer unit tests 12/12 via custom DOM shim (verifier statically inspected sanitizer and found the allowlist logic sound, but did not re-run the shim).
- innerHTML audit: 22 assignments all `escapeHtml`/`sanitizeRich` (verifier's own audit2 supersedes this with the injection-site findings).
- Block-comment balance 27/27 (verifier checked comments 1/1 — a different metric, not a re-run).

### Claimed by worker but independently re-confirmed by verifier
`node --check` pass; STRINGS semantics; HTML tag balance; 38 getElementById ids present; no globe/three remnants.

---

## 4. Residual risks & untested areas

- **No headless browser** in the container → page load, language switching, Arabic RTL visual rendering, edit modal + CKEditor runtime, sql.js wasm bootstrap, and localStorage persistence/export-import in a real browser were all UNTESTED. Blocker 1 would have been caught by any real page load.
- **No network/DNS** → CKEditor CDN (41.4.2 classic) reachability unverified; runtime fallback to sanitized plain textareas exists if `ClassicEditor` is undefined.
- **Git metadata unmounted** → diff vs baseline `bb78fe5`, and commit/push/merge/tag state, unverifiable from this container.
- **Node version mismatch** → specified v24.4.1 path absent; all checks ran on v26.5.1.
- **Blocker 1 invalidates c9** (offline-friendly persistence does not function) and leaves the page a static dead shell in a browser.
- **Content gaps (non-blocking, c3):** resources/sources/org-directory Swedish-only in all languages with silent sv fallback (no badge).
- **Provenance nits (non-blocking):** worker-reported artifact size 268,362 B vs 275,846 B on disk (line count 2,385 matches); worker artifact path `/workspace/geobas-portal.html` vs actual worktree path; verifier's c7 cites `escapeHtml` at lines 606–610 while the definition is at line 1080 — the defect mechanism is confirmed at 1080, but the cited line range does not match the file.
- **No CSP meta tag** present; would mitigate Blocker 2.

---

## 5. Admission recommendation

**DO-NOT-ADMIT**

The verifier's independent verdict is FAIL with two empirically reproduced, non-cosmetic defects: an app-wide init crash (`window.storage` undefined — the page never initializes in any browser, so all views, the CTA, and persistence are dead) and a double-quote breakout in `escapeHtml()` that lets DB content reach the DOM as live `on*` event-handler attributes, reachable on visitor-facing NGO/org URLs without edit mode. Because the failures are functional and security-critical, ADMIT-WITH-CONDITIONS is not permitted under the task rules (that option requires every failure to be cosmetic and documented). Remediation — define `window.storage` backed by localStorage (or replace the calls), make `escapeHtml` escape quotes or move attribute contexts to element-construction APIs, and strip quotes in `safeUrl` — plus a full re-verification (ideally with a browser) are prerequisites before admission can be reconsidered. Verification ≠ admission: this recommendation supports the separate ForgePilot governance decision; it does not make it.
