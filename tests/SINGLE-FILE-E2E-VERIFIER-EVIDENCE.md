# GeoBas Aurora Atlas — Single-File E2E Independent Verifier Evidence

## Primary classification: DEFERRED

This Docker-bound verifier independently observed that every executable/content gate listed below passes. It cannot issue a `PASS`, because the mounted worktree's `.git` file points to an absent host gitdir, so the required HEAD/branch/baseline-branch assertions, diff/status/untracked provenance, and any host-outside-worktree effects cannot be independently inspected from this verification boundary. This is an inability to verify those criteria, not an observed defect in the artifact.

Verification mount: `/workspace`, corresponding to the task's requested host worktree path. The requested `/home/ridasaidd/Projects/GeoBAS/worktrees/geobas-aurora-atlas-v3-single-file` path is not mounted in this Docker environment.

Artifact observed:
- `geobas-portal.html`: 5,786,885 bytes; SHA-256 `c6b32d70aa863f2d5c692c3dfca54fadaf178355f029d7310d31ca8386739dc7`
- `geobas-portal-single.html`: 5,786,885 bytes; same SHA-256; `cmp -s` exit 0.

## 1. Baseline integrity — DEFERRED (not verifiable)

Required assertions: HEAD `8595249b156029654417fc6366545e41fcd85c75`, branch `design/aurora-atlas-v3-single-file`, and unmodified `design/aurora-atlas-v3-rebuild`.

Observed `.git` content:
```
gitdir: /home/ridasaidd/Projects/GeoBAS/geobas-portal/.git/worktrees/geobas-aurora-atlas-v3-single-file
```

Re-run command:
```
git status --short --branch; git rev-parse HEAD; git branch --show-current; git rev-parse design/aurora-atlas-v3-rebuild
```

Exact output (all four invocations):
```
fatal: not a git repository: /home/ridasaidd/Projects/GeoBAS/geobas-portal/.git/worktrees/geobas-aurora-atlas-v3-single-file
```
Exit code: 128.

Consequences: I could not prove the prescribed HEAD or branch, inspect the baseline ref, determine tracked/untracked state, compare against the baseline file, or establish that `design/aurora-atlas-v3-rebuild` was not modified. The only other HTML reference visible in this mount is `geobas_aurora_atlas_gpt_reference.html` (23,478 bytes); it is not authenticated as the requested git baseline and was not used as a substitute.

## 2. Regression — PASS

Command:
```
node tests/regression.test.mjs
```
Output / exit 0:
```
=== GeoBas service-workspace regression checks ===
inline script size: 1117969 bytes
runtime checks: 55 | source checks: 16
PASS: 71  FAIL: 0

ALL CHECKS PASSED
```

## 3. Routes — PASS

Command:
```
node tests/routes.test.mjs
```
Output / exit 0:
```
=== GeoBas per-route functional verification (routes.test.mjs) ===
runtime assertions: 43 | source checks: 10
PASS: 53  FAIL: 0

ALL ROUTE CHECKS PASSED
```

## 4. JavaScript syntax — PASS

I created a transient verifier-only extractor under `tests/`, wrote each of the five output inline scripts to a transient directory under `tests/`, ran `node --check` on each, then removed both the extractor and its temporary directory. A post-check file search found no `.verifier-*` residue. No file outside the worktree was written.

Output inline scripts, command `node tests/.verify-inline-syntax.cjs`, exit 0:
```
node --check extracted inline block 1: OK (1126592 bytes)
node --check extracted inline block 2: OK (49857 bytes)
node --check extracted inline block 3: OK (1796342 bytes)
node --check extracted inline block 4: OK (7169 bytes)
node --check extracted inline block 5: OK (1917060 bytes)
```

Inlined JS payload source files, command:
```
node --check assets/js/sql-wasm.js
node --check assets/js/globe.gl.min.js
node --check assets/js/topojson-client.min.js
```
Output / exit 0:
```
node --check assets/js/sql-wasm.js: OK
node --check assets/js/globe.gl.min.js: OK
node --check assets/js/topojson-client.min.js: OK
```

The character-count form separately observed by `tests/_facts.cjs` was `[[1,1117969],[2,49857],[3,1796206],[4,7167],[5,1917053]]`; the byte counts above are UTF-8 byte sizes, explaining the non-ASCII size differences in blocks 1, 3, 4, and 5.

## 5. Portability / local assets — PASS

A direct search of `geobas-portal.html` for `assets/` returned zero matches. Independently re-run static verifier output:
```
assets/ refs excluding ckeditor (grep -v): 0
literal "assets/" occurrences: 0
```

No local `assets/` reference remained. The `cdn.ckeditor.com` exception is not an `assets/` reference and remains the only permitted external asset-script exception.

## 6. CKEditor exception — PASS

Direct content search located exactly this tag at artifact line 8:
```
<script src="https://cdn.ckeditor.com/ckeditor5/40.0.0/classic/ckeditor.js" defer></script>
```

The static verifier independently returned:
```
CKEditor line preserved verbatim: true
```
The tag is present unchanged and is not inlined.

## 7. Reduced motion — PASS

Direct artifact search located the ambient-motion kill rule at lines 517–522:
```
@media (prefers-reduced-motion: reduce){
  html{scroll-behavior:auto;}
  *{animation:none !important; transition:none !important;}
}
```

The same search located the JS guard and a disabled animation path:
```
var reduced = false;
try { reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* ignore */ }
.arcDashAnimateTime(reduced ? 0 : 2800)
```
Thus the requirement is met both at CSS level and for globe ambient animation.

## 8. Output size / inlining evidence — PARTIAL (baseline comparison deferred)

Command:
```
wc -c geobas-portal.html geobas-portal-single.html geobas_aurora_atlas_gpt_reference.html assets/js/globe.gl.min.js assets/js/sql-wasm.wasm
```
Output:
```
 5786885 geobas-portal.html
 5786885 geobas-portal-single.html
   23478 geobas_aurora_atlas_gpt_reference.html
 1796342 assets/js/globe.gl.min.js
  655300 assets/js/sql-wasm.wasm
14048890 total
```

Observed inlining evidence from `node tests/_facts.cjs` / `node tests/_verify.cjs` (both exit 0):
```
count data:font/woff2 = 15
count data:application/wasm = 1
count data:image/jpeg = 1
count data:image/png = 1
count data:application/json = 1
count data:image/svg+xml = 5
FLAG_DATA 43 keys: 43
flag.src dynamic uses FLAG_DATA: true
globeImageUrl data uri: true
bumpImageUrl data uri: true
countries fetch data uri: true
locateFile data uri: true
```

The 5,786,885-byte artifact includes a 1,796,342-byte local globe.gl UMD source payload (observed size above). Performance implication: the portable document pays substantial initial transfer/parse/decode cost because this UMD payload and base64 fonts/WASM/images are delivered in the HTML rather than cacheable separate assets. The required assertion that it is materially larger than the authenticated baseline is deferred with the missing git baseline; no available file was assumed to be that baseline.

## Scope / provenance observations

- The verifier did not commit, push, touch host services/configuration, or write outside `/workspace`. Its transient syntax-check files were created and removed under `/workspace/tests`; no `.verifier-*` residual exists.
- The mount contains worker/helper files including `_verify.cjs`, `_facts.cjs`, `_browser.cjs`, `_blocks.cjs`, `_inline-build.cjs`, `_dbg.cjs`, `_check-b64.cjs`, `_check-b64.mjs`, `_inline-build.mjs`, `_capture-screenshots.mjs`, and `_harness.mjs`. I inspected the relevant helpers used for static facts; `_blocks.cjs` would write to `/tmp`, so I deliberately did not execute it because the task prohibits outside-worktree writes. Git unavailability prevents establishing whether those files are tracked, newly untracked, or within approved scope.
- Browser check command `node tests/_browser.cjs` exited 0 and reported `puppeteer no`, `playwright no`, `jsdom no`, then `browser scan done`; this is not a claimed browser-render verification and is not needed for the listed acceptance gates.
- No unexpected host-facing mutation is observable from the Docker mount. Absence of the host path and gitdir means that broader host-side non-mutation cannot be attested, so it is included in the DEFERRED classification rather than silently accepted.

## Disposition

Concrete artifact/content/executable gates: PASS. Required repository-integrity, baseline-comparison, provenance, and host-side non-mutation assertions: unverifiable in this Docker mount. Primary disposition remains **DEFERRED**, pending a verifier boundary with readable git metadata and authorized host-scope observation. This evidence is independent verification only; it is not an admission, merge, or deployment approval.
