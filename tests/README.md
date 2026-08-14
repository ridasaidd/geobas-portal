# Editorial Atlas — remediation regression checks (task t_114355bc)

Focused, self-contained checks for the four verifier blockers fixed in
`geobas-portal.html`.  No network, no npm dependencies.

## Run everything

    node tests/regression.js          # dynamic checks (86 assertions)
    python3 tests/audit-attributes.py # static: attribute-context injection audit
    python3 tests/audit-structure.py  # static: tag balance / ids / no eval
    python3 tests/extract-script.py && node --check /tmp/portal-script.js

## What each check covers

- `regression.js`
  - Section 1 / 1b-1d — **startup/persistence**: the browser-native
    `window.storage` fallback (localStorage-backed, `get(key)->{value}` /
    `set(key, value, sync)` contract) is installed when `window.storage` is
    undefined; the full `DOMContentLoaded` init flow completes for a fresh DB
    and for a restored stored DB; `persistDB` writes exports to storage.
  - Section 2 — **imported SQLite trust**: a valid imported DB buffer is
    accepted and persisted; a corrupt buffer fails gracefully (importFail
    alert) leaving the previous DB intact; hostile rows an imported DB could
    carry render sanitized (see sections 3 and 7).
  - Section 3 — **quote breakout / event-handler injection**: `escapeHtml`
    escapes `"` and `'`; the old Blocker-2 payloads
    (`x" onfocus="alert(1)`, `https://example.com" onmouseover="alert(1)`)
    render with entities and produce zero `on*` attributes in the NGO list,
    org directory, and language switch (visitor-facing, no edit mode).
  - Section 4 — **javascript: URLs**: `safeUrl` blocks `javascript:`
    (mixed case / leading whitespace), `data:`, `vbscript:`, `file:`, and
    quote/whitespace breakouts, while keeping http(s)/mailto; the rich-text
    `<a>` sanitizer remains protocol-allowlisted.
  - Section 5 — **compatibility**: a pre-existing `window.storage`
    implementation is preserved untouched and receives the app's
    get/set(key, value, syncFlag) calls.
  - Section 6 — **sanitizeRich R1 residual**: `sanitizeRich` strips ALL
    event-handler attributes (`onclick`/`onload`/`onerror`/`onfocus`/...)
    from every allowed element including `<a>`, while preserving the safe
    allowlist and safe links.  Covers `<a on*>` payloads, uppercase / unquoted
    / entity-encoded variants, nested/descendant `<a>` inside `<p>`/`<li>`,
    handlers on unwrapped wrappers (`<div>`/`<svg>`), and `javascript:` /
    entity-encoded-scheme hrefs.  The mini DOMParser shim (in `regression.js`)
    lets the page's real `sanitizeRich` run against hostile fragments in the
    harness instead of being only statically inspected.
  - Section 7 — **hostile imported rich HTML (render path)**: hostile
    intro / card-body / kv rich HTML preloaded into DB rows renders through
    `goCountry()` with zero `on*` attributes, safe links intact, and no
    `javascript:` scheme in the output.
  - Section 8 — **plain-textarea fallback path**: with CKEditor unavailable
    `ckAvailable()` is false, textareas stay plain, `readRichValue` returns
    the raw `textarea.value` (while still preferring `getData()` when a
    CKEditor instance exists), and `saveCountryEditor` sanitizes hostile
    textarea content **before** persisting (verified on the recorded
    `run()` calls for `country_i18n` and `card_body`).
- `audit-attributes.py` — every `${...}` interpolation inside an HTML
  attribute is wrapped in `escapeHtml`/`safeUrl` or is a numeric DB id /
  loop index (no bare untrusted interpolation).
- `audit-structure.py` — script tag count, HTML tag balance (script/style
  bodies excluded), all `getElementById` ids exist in markup, no
  `eval`/`document.write`.
- `extract-script.py` — dumps the app script for `node --check`.

## Note on fidelity

The dynamic suite runs the page's real script in a `vm` context with minimal
DOM / localStorage / sql.js fakes.  `escapeHtml`'s shim reproduces WHATWG
text serialization (escapes `& < > NBSP`, not quotes), so the quote-escaping
assertions exercise the actual fix.  The sql.js fake is schema-agnostic; it
exercises the app's storage contract and control flow, not SQL semantics.
The `sanitizeRich` checks run against a small faithful HTML fragment parser
(`makeMiniDOMParser` in `regression.js`): tag-name/attribute-name
case folding, entity decoding in attribute values, void elements, comments,
and DOM move/remove semantics all match browser behavior for the fragment
shapes these tests feed it; it is not a full HTML5 tree-construction
conformance engine.
