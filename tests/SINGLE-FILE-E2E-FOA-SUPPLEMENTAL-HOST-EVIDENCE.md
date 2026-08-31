# GeoBas Aurora Atlas Single-File E2E — FOA HOST Supplemental Evidence (tier-1)

Date: 2026-08-31 (16:40 CEST)
Role: forgepilot-operational-orchestrator (FOA), designated host executor.
WORK CLASS context: this file is **HOST-class supplemental observation only**. It does
**NOT** substitute for the independent Docker-bound `forgepilot-verifier`. The verifier
(via task t_1dd9f45e, run 17) independently re-ran all executable gates and wrote its own
tier-2 evidence at `tests/SINGLE-FILE-E2E-VERIFIER-EVIDENCE.md`. FOA host observation below
is tier-1 host evidence for the git-baseline / host-scope / real-browser assertions that a
Docker-bound verifier cannot witness, per host-work-audit doctrine §1 points 2/4/7.

## 1. Verifier-lane root cause & recovery (host-observed)

- forgepilot-verifier profile (config.yaml) is configured `model.provider: copilot`,
  `default: gpt-5.6-terra`, `base_url: ''`; at runtime this resolves to the **openai-codex**
  provider at `https://chatgpt.com/backend-api/codex`.
- Task t_1dd9f45e dispatched verifier runs 10-15 repeatedly failed with
  `HTTP 401: Provided authentication token is expired` (`token_expired`) → non-retryable
  abort → dispatcher recorded `crashed (pid not alive)` (runs 10,15) and
  `protocol_violation` rc=0 without a terminal kanban call (runs 11-14). Same signature on
  older verifier tasks t_4571a28a and t_9c60c2fc (their logs show the identical 401), and
  t_53b0b119 (blocked/todo).
  → **Root cause: the verifier profile's Codex OAuth token had expired**; the abort occurred
  before the agent could issue its terminal `kanban_complete`/`kanban_block`, which is why
  the dispatcher saw protocol violations / dead pids rather than a normal completion.
- **Recovery (self-healed, no config/service mutation required):** verifier run 17 began
  16:35:30, ran 81 tool calls, and completed at 16:38:35 with `kanban_complete` (status done),
  producing `tests/SINGLE-FILE-E2E-VERIFIER-EVIDENCE.md`. Runs 16→17 were post-401, so the
  token freshness had recovered. This confirms the verifier lane is demonstrably healthy *now*:
  the Unicode-verdict was DEFERRED only for git/host-scope items the Docker mount cannot
  witness, which are supplied here.
- No Hermes config/profile/service/systemd/Docker/deployment was changed to achieve this
  recovery; the verifier profile config was read-only inspected. Rollback boundary: nothing
  on the host was mutated.

## 2. Git baseline integrity — tier-1 HOST assertion (from /home/ridasaidd/Projects/GeoBAS)

Primary repo: /home/ridasaidd/Projects/GeoBAS/geobas-portal (HEAD bb78fe53… [main]).
Worktree: /home/ridasaidd/Projects/GeoBAS/worktrees/geobas-aurora-atlas-v3-single-file

| Assertion | Observed (live, 16:43 CEST) |
|---|---|
| worktree HEAD | `8595249b156029654417fc6366545e41fcd85c75` = required `8595249…` ✓ |
| worktree branch | `design/aurora-atlas-v3-single-file` ✓ |
| baseline ref `design/aurora-atlas-v3-rebuild` | `8595249b156029654417fc6366545e41fcd85c75` (unchanged) ✓ |
| baseline branch HEAD | `8595249…` via `git rev-parse design/aurora-atlas-v3-rebuild` ✓ (unrelated state preserved) |
| worktree status | ` M geobas-portal.html`; untracked: `geobas-portal-single.html`, `tests/SINGLE-FILE-E2E-VERIFIER-EVIDENCE.md`, `tests/SINGLE-FILE-E2E-WORKER-EVIDENCE.md`, `tests/_*.cjs|mjs` helper files. No tracked file outside the intended single-file deliverable is modified. |
| git common dir | `/home/ridasaidd/Projects/GeoBAS/geobas-portal/.git` resolves; `git show-ref` shows `design/aurora-atlas-v3-single-file` == `8595249…` (same commit, uncommitted in-place deliverable). |

Notes: the worktree `.git` points to the real host gitdir, so the Docker verifier's
`fatal: not a git repository` was purely the Docker mount lacking the host gitdir — a
witness-boundary artifact, not a repo defect.

## 3. Output-size vs authenticated baseline — tier-1 HOST assertion

- Baseline `design/aurora-atlas-v3-rebuild:geobas-portal.html` size: **320,189 bytes**
  (`git show design/aurora-atlas-v3-rebuild:geobas-portal.html | wc -c`).
- Artifact `geobas-portal.html` size: **5,786,885 bytes** (and `geobas-portal-single.html`
  byte-identical, same SHA-256).
- Materially larger (≈18×) → inlining factually occurred. ✓

## 4. Real browser / file:// open — G0-requested portability evidence (HOST supplemental)

G0 explicitly required: after lane restore, reproduce a real browser/file:// open and verify
formerly-local assets no longer fail due to path/loading issues; check console/network/resource
failures and portability; preserve the CKEditor CDN exception. Performed read-only on the host
with Playwright 1.59.1 + real Chromium 1217 headless (executable
`~/.cache/ms-playwright/chromium-1217/chrome-linux/chrome`), opening `file://…/geobas-portal.html`.
Host observation is HOST-class supplemental and NOT the PROJECT verifier.

OFFLINE mode (chromium launched, no artificial network reliance — proves formerly-local assets
load from the file itself):
- console errors: **0**; page errors: **0**; failed requests: **0**
- local asset failures: **0**; external ckeditor failures: **0**
- document.title: "GeoBas — Landinfo för återvändare"; body children 11; globe container
  present; canvas: **1** rendered; 3 imgs complete+naturWidth>0; `document.fonts.status =
  "loaded"`.

ONLINE mode (network enabled; CKEditor CDN is the preserved external exception):
- console errors: **0**; page errors: **0**; failed requests: **0**
- local asset failures: **0**; external ckeditor failures: **0** (CDN loaded cleanly)
- canvas: **1**; fonts loaded; same title. → The formerly-broken asset loading reported on the
  Aurora Atlas branch does NOT reproduce on the single-file artifact: every formerly-local
  asset now resolves inline (data: URIs) with zero console/network/resource failures in a real
  headless Chromium file:// open, in both modes.

Static corroboration (from /tmp probe, read-only):
- literal `assets/` refs in artifact: **0**; CKEditor CDN tag count: **1** (preserved).
- data: URIs present: font/woff2=15, wasm=1, image/jpeg=1, image/png=1, application/json=1,
  image/svg+xml=5; inline `<script>` blocks = 5; reduced-motion CSS + JS guard present.

## 5. Static/executable gate corroboration (verifier already ran these; host re-attested SHA)

- Artifact SHA-256: `c6b32d70aa863f2d5c692c3dfca54fadaf178355f029d7310d31ca8386739dc7`
  (matches verifier run-17 recorded sha). Verify: `sha256sum geobas-portal.html`.

## 6. Reconciliation / board authority

- Existing GeoBAS board chain is authoritative and intact: t_bef6e84e (worker) DONE →
  t_1dd9f45e (verifier) DONE. Single chain; no duplicate project task graph was created.
- No commit/push; no service/systemd/config/MCP/Docker/deployment/OpenViking change;
  no deployed state touched. This work is evidence + reconciliation only.

## Disposition

PROJECT verification gate satisfied by the independent Docker-bound verifier (run 17, DEFERRED
only for unwitnessable-in-Docker items); FOA supplies the missing tier-1 host evidence above
(baseline integrity, output-size, real-browser portability) as supplemental HOST observation,
NOT as a substitute verifier. All applicable acceptance items therefore have evidence.