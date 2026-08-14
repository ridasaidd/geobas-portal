#!/usr/bin/env node
/* =============================================================================
   GeoBas civic-modern — focused regression checks (hardening pass)

   Runs the REAL functions from geobas-portal.html inside a Node vm sandbox
   with a minimal DOM shim, and asserts:

     1. persistence            — store round-trip + survival across a simulated
                                 reload (window.storage and localStorage paths),
                                 base64<->bytes fidelity, real sqlite bytes
                                 survive the full pipeline
     2. imported SQLite trust  — validateImportedDb accepts a full schema and
                                 rejects a missing table; the import handler
                                 restores the previous DB and alerts on failure
     3. language-code injection— escapeHtmlAttr escapes quotes; renderLangSwitch
                                 output cannot break out of the data-lang attribute
     4. unsafe URLs            — safeUrl blocks javascript:/data:/vbscript:/file:,
                                 renderNgoList/renderOrgDirectory never emit
                                 javascript: hrefs, https/mailto links render with
                                 rel=noopener + target=_blank
     5. Arabic RTL             — applyLangDir sets dir=rtl for 'ar', ltr otherwise
     6. navigation/edit        — document click delegation drives handleNav;
                                 edit mode toggles lang-switch + edit rows
     7. CKEditor conservative  — static checks: allowedContent whitelist,
                                 forcePasteAsPlainText, sourcearea disabled;
                                 sanitizeRich strips script/onclick/javascript:

   Run:  node tests/regression.mjs
   Exit: 0 = all checks passed, 1 = failures (with a report)
   ============================================================================= */
import { readFileSync } from 'node:fs';
import { createContext, runInContext } from 'node:vm';
import { DatabaseSync } from 'node:sqlite';
import assert from 'node:assert/strict';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGE_PATH = process.env.GEOBAS_PAGE || path.join(__dirname, '..', 'geobas-portal.html');
const PAGE = readFileSync(PAGE_PATH, 'utf8');

let passed = 0;
const failures = [];
const pendingChecks = [];
function check(name, fn){
  try {
    const r = fn();
    if(r && typeof r.then === 'function'){
      pendingChecks.push(Promise.resolve(r).then(() => { passed++; console.log('  ok  ' + name); }).catch(e => { failures.push({name, error: e}); console.log('  FAIL ' + name + '\n       ' + (e && e.message ? e.message.split('\n')[0] : e)); }));
    } else {
      passed++; console.log('  ok  ' + name);
    }
  } catch(e){
    failures.push({name, error: e}); console.log('  FAIL ' + name + '\n       ' + (e && e.message ? e.message.split('\n')[0] : e));
  }
}
async function finish(){
  await Promise.all(pendingChecks);
  console.log('\n----------------------------------------');
  console.log('passed: ' + passed + ', failed: ' + failures.length);
  if(failures.length){
    console.log('\nFailures:');
    for(const f of failures) console.log('  - ' + f.name + '\n      ' + (f.error && f.error.stack ? f.error.stack.split('\n').slice(0, 3).join('\n      ') : f.error));
    process.exit(1);
  }
  console.log('ALL CHECKS PASSED');
}
const section = s => console.log('\n== ' + s + ' ==');

/* ------------------------------------------------------------------ */
/* minimal DOM shim                                                    */
/* ------------------------------------------------------------------ */
function makeElement(id){
  const listeners = {};
  const el = {
    id,
    _attrs: {},
    _classes: new Set(),
    style: {},
    value: '',
    textContent: '',
    _innerHTML: '',
    _children: [],
    dataset: {},
    classList: {
      add: (...c) => c.forEach(x => el._classes.add(x)),
      remove: (...c) => c.forEach(x => el._classes.delete(x)),
      toggle: (c, force) => { const on = force !== undefined ? force : !el._classes.has(c); on ? el._classes.add(c) : el._classes.delete(c); return on; },
      contains: c => el._classes.has(c),
    },
    setAttribute: (n, v) => { el._attrs[n] = String(v); },
    getAttribute: n => (n in el._attrs ? el._attrs[n] : null),
    removeAttribute: n => { delete el._attrs[n]; },
    addEventListener: (type, fn) => { (listeners[type] = listeners[type] || []).push(fn); },
    dispatchEvent: ev => { (listeners[ev.type] || []).forEach(fn => fn.call(el, ev)); },
    querySelector: () => null,
    querySelectorAll: () => [],
    focus: () => {},
    appendChild: c => { el._children.push(c); return c; },
    removeChild: c => { el._children = el._children.filter(x => x !== c); return c; },
    remove: () => {},
    click: () => {},
    closest: () => null,
    _listeners: listeners,
  };
  // plain (configurable) innerHTML property; the div override below re-defines it
  Object.defineProperty(el, 'innerHTML', {
    configurable: true,
    get(){ return el._innerHTML; },
    set(v){ el._innerHTML = String(v); },
  });
  return el;
}

function buildSandbox({ windowStorage, localStorageBackend }){
  const storageMap = localStorageBackend || new Map();
  const localStorageMock = {
    getItem: k => (storageMap.has(k) ? storageMap.get(k) : null),
    setItem: (k, v) => { storageMap.set(k, String(v)); },
    removeItem: k => { storageMap.delete(k); },
    clear: () => storageMap.clear(),
    _backend: storageMap,
  };
  const alerts = [];
  const confirms = [];
  const prompts = [];
  const clicks = [];
  const elements = new Map();
  const docEl = { lang: 'sv', dir: 'ltr', _attrs: {}, setAttribute(n, v){ this._attrs[n] = String(v); }, getAttribute(n){ return this._attrs[n] || null; } };
  const document = {
    documentElement: docEl,
    body: makeElement('body'),
    getElementById: id => { if(!elements.has(id)) elements.set(id, makeElement(id)); return elements.get(id); },
    createElement: tag => makeElement(tag),
    querySelector: () => null,
    querySelectorAll: () => [],
    addEventListener: (type, fn) => { if(type === 'click') clicks.push(fn); },
    createTextNode: t => ({ textContent: t, nodeType: 3 }),
  };
  // escapeHtml() relies on div.textContent -> div.innerHTML escaping
  const realCreate = document.createElement;
  document.createElement = function(tag){
    const e = realCreate(tag);
    if(tag === 'div'){
      let text = '';
      Object.defineProperty(e, 'textContent', {
        configurable: true,
        get(){ return text; },
        set(v){ text = String(v == null ? '' : v); },
      });
      Object.defineProperty(e, 'innerHTML', {
        configurable: true,
        get(){ return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); },
        set(v){ text = String(v); },
      });
    }
    return e;
  };
  const window = {
    addEventListener: () => {},   // DOMContentLoaded: not fired in tests
    scrollTo: () => {},
    storage: windowStorage,       // may be undefined -> localStorage fallback
  };
  const sandbox = {
    window, document, localStorage: localStorageMock,
    alert: m => alerts.push(String(m)),
    confirm: m => { confirms.push(String(m)); return true; },
    prompt: () => '',
    console,
    setTimeout, clearTimeout,
    atob, btoa,
    Blob: class { constructor(parts, opts){ this._parts = parts; this._opts = opts || {}; } },
    URL: { createObjectURL: () => 'blob:mock', revokeObjectURL: () => {} },
    DOMParser: MiniDOMParser,
    initSqlJs: async () => { throw new Error('initSqlJs must not be called in tests'); },
    Math, JSON, RegExp, Set, Map, Date, Object, Array, String, Number, Boolean, parseInt, parseFloat, isNaN,
    globalThis: null,
  };
  sandbox.globalThis = sandbox;
  const ctx = createContext(sandbox);
  return { ctx, sandbox, elements, alerts, confirms, prompts, clicks, docEl, storageMap, localStorageMock };
}

/* ------------------------------------------------------------------ */
/* Mini HTML parser powering DOMParser (enough for sanitizer tests)    */
/* ------------------------------------------------------------------ */
const VOID = new Set(['br','img','hr','input','meta','link','source','track','area','base','col','embed','param','wbr']);
const RAW_TEXT = new Set(['script','style','textarea','title']);
const ENT = { amp:'&', lt:'<', gt:'>', quot:'"', apos:"'", nbsp:' ' };
function decodeEntities(s){
  return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (m, body) => {
    if(body[0] === '#'){ const n = body[1] === 'x' || body[1] === 'X' ? parseInt(body.slice(2), 16) : parseInt(body.slice(1), 10); return String.fromCodePoint(n); }
    return body in ENT ? ENT[body] : m;
  });
}
function escText(s){ return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escAttr(s){ return s.replace(/&/g, '&amp;').replace(/"/g, '&quot;'); }
class MiniNode {
  constructor(tag){ this.tagName = tag ? tag.toUpperCase() : undefined; this.nodeType = tag ? 1 : 3; this.childNodes = []; this.attrs = new Map(); this.parentNode = null; this._text = tag ? null : ''; }
  get attributes(){ return [...this.attrs.keys()].map(name => ({ name })); }
  getAttribute(n){ return this.attrs.has(n) ? this.attrs.get(n) : null; }
  setAttribute(n, v){ this.attrs.set(n, String(v)); }
  removeAttribute(n){ this.attrs.delete(n); }
  remove(){ if(this.parentNode){ const i = this.parentNode.childNodes.indexOf(this); if(i >= 0) this.parentNode.childNodes.splice(i, 1); this.parentNode = null; } }
  replaceWith(...nodes){ const p = this.parentNode; if(!p) return; const i = p.childNodes.indexOf(this); if(i < 0) return; p.childNodes.splice(i, 1, ...nodes); nodes.forEach(n => { n.parentNode = p; }); this.parentNode = null; }
  _serialize(){
    if(this.nodeType === 3) return escText(this._text === null ? this.textContent : this._text);
    const name = this.tagName.toLowerCase();
    const attrs = [...this.attrs.entries()].map(([k, v]) => ` ${k}="${escAttr(v)}"`).join('');
    if(VOID.has(name)) return `<${name}${attrs}>`;
    return `<${name}${attrs}>` + this.childNodes.map(c => c._serialize()).join('') + `</${name}>`;
  }
  get innerHTML(){ return this.childNodes.map(c => c._serialize()).join(''); }
  set innerHTML(v){ /* not needed by the page; kept for completeness */ }
}
function parseFragment(html){
  const root = new MiniNode('body');
  const stack = [root];
  const re = /<!--[\s\S]*?-->|<(\/?)([a-zA-Z][a-zA-Z0-9-]*)((?:"[^"]*"|'[^']*'|[^"'<>])*?)(\/?)>|([^<]+)/g;
  let m;
  while((m = re.exec(html))){
    const full = m[0];
    if(full.startsWith('<!--')){ continue; }
    if(m[5] !== undefined){ // text  (group 5 = ([^<]+))
      const t = new MiniNode(null); t._text = decodeEntities(m[5]); stack[stack.length - 1].childNodes.push(t); t.parentNode = stack[stack.length - 1];
      continue;
    }
    const closing = !!m[1], tag = (m[2] || '').toLowerCase(), attrStr = m[3] || '', selfClose = !!m[4];
    if(closing){
      for(let i = stack.length - 1; i > 0; i--){ if(stack[i].tagName.toLowerCase() === tag){ stack.length = i; break; } }
      continue;
    }
    const el = new MiniNode(tag);
    // parse attributes
    const are = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s"'<>`=]+))/g;
    let am;
    while((am = are.exec(attrStr))){ el.attrs.set(am[1].toLowerCase(), decodeEntities(am[3] !== undefined ? am[3] : (am[4] !== undefined ? am[4] : am[5]))); }
    const bare = attrStr.replace(are, '').match(/([a-zA-Z_:][-a-zA-Z0-9_:.]*)/g) || [];
    bare.forEach(b => { if(!el.attrs.has(b.toLowerCase())) el.attrs.set(b.toLowerCase(), ''); });
    const parent = stack[stack.length - 1];
    parent.childNodes.push(el); el.parentNode = parent;
    if(VOID.has(tag) || selfClose) continue;
    stack.push(el);
    if(RAW_TEXT.has(tag)){
      // consume until matching close tag
      const closeRe = new RegExp('</' + tag + '\\s*>', 'i');
      const rest = html.slice(re.lastIndex);
      const cm = closeRe.exec(rest);
      if(cm){ const t = new MiniNode(null); t._text = decodeEntities(rest.slice(0, cm.index)); el.childNodes.push(t); t.parentNode = el; re.lastIndex += cm.index + cm[0].length; }
      stack.pop();
    }
  }
  return root;
}
class MiniDOMParser {
  parseFromString(html, _type){
    const body = parseFragment(String(html));
    return { body, documentElement: body };
  }
}

/* ------------------------------------------------------------------ */
/* run the page script in the sandbox                                  */
/* ------------------------------------------------------------------ */
function loadPage(sandbox){
  const scripts = [...PAGE.matchAll(/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/g)];
  assert.ok(scripts.length >= 1, 'expected an inline script block');
  const inline = scripts.map(s => s[1]).join('\n');
  const hooks = `
;globalThis.__geobasTest = {
  setLang: v => { currentLang = v; },
  getLang: () => currentLang,
  setEditMode: v => { editMode = v; },
  getEditMode: () => editMode,
  getDb: () => db,
  setDb: d => { db = d; },
  setSQLLib: s => { SQLLib = s; },
  getSQLLib: () => SQLLib,
  getStore: () => store,
};
;globalThis.setLang = globalThis.__geobasTest.setLang;
;globalThis.getLang = globalThis.__geobasTest.getLang;
;globalThis.setEditMode = globalThis.__geobasTest.setEditMode;
;globalThis.getEditMode = globalThis.__geobasTest.getEditMode;
;globalThis.getDb = globalThis.__geobasTest.getDb;
;globalThis.setDb = globalThis.__geobasTest.setDb;
;globalThis.setSQLLib = globalThis.__geobasTest.setSQLLib;
;globalThis.getSQLLib = globalThis.__geobasTest.getSQLLib;
;globalThis.getStore = globalThis.__geobasTest.getStore;
;globalThis.RICH_ALLOWED = RICH_ALLOWED;
;globalThis.RICH_DROP = RICH_DROP;
`;
  runInContext(inline + hooks, sandbox.ctx, { filename: 'geobas-portal.html' });
  return sandbox.ctx;
}

/* fake prepared-statement DB used for validateImportedDb + import tests */
function fakeDb(tables){
  const names = [...tables];
  return {
    prepare(sql){
      if(/sqlite_master/.test(sql)){
        let i = 0;
        return {
          bind(){}, free(){},
          step(){ return i < names.length; },
          getAsObject(){ const n = names[i++]; return { name: n }; },
        };
      }
      let done = false;
      return { bind(){}, free(){}, step(){ if(done) return false; done = true; return false; }, getAsObject(){ return {}; } };
    },
    run(){},
    exec(){ return []; },
    export(){ return new Uint8Array([1, 2, 3, 4]); },
    close(){},
  };
}

/* ================================================================== */
console.log('GeoBas civic-modern regression checks');
console.log('page: ' + PAGE_PATH);

/* ---------------- 1. persistence ---------------- */
section('1. Persistence (storage fallback survives reload)');

{
  // --- localStorage path: round-trip + reload survival ---
  const backend = new Map();
  const s1 = buildSandbox({ localStorageBackend: backend });
  loadPage(s1);
  check('localStorage path: safeStore() set/get round-trip', async () => {
    const store = s1.ctx.safeStore();
    await store.set('k1', 'v1');
    assert.equal(await store.get('k1'), 'v1');
  });
  check('localStorage path: value survives a simulated reload (fresh store, same backend)', async () => {
    const store = s1.ctx.safeStore();
    await store.set('geobas-db-v1', 'PERSISTED');
    const s2 = buildSandbox({ localStorageBackend: backend });
    loadPage(s2);
    const store2 = s2.ctx.safeStore();
    assert.equal(await store2.get('geobas-db-v1'), 'PERSISTED');
  });

  // --- window.storage path: {value:...} envelope + reload survival ---
  const wBackend = new Map();
  const winStorage = {
    get: async k => ({ value: wBackend.has(k) ? wBackend.get(k) : null }),
    set: async (k, v) => { wBackend.set(k, v); },
  };
  const s3 = buildSandbox({ windowStorage: winStorage });
  loadPage(s3);
  check('window.storage path: set/get round-trip via {value} envelope', async () => {
    const store = s3.ctx.safeStore();
    await store.set('k2', 'v2');
    assert.equal(await store.get('k2'), 'v2');
  });
  check('window.storage path: survives a simulated reload', async () => {
    const store = s3.ctx.safeStore();
    await store.set('geobas-db-v1', 'WINPERSISTED');
    const s4 = buildSandbox({ windowStorage: winStorage });
    loadPage(s4);
    assert.equal(await s4.ctx.safeStore().get('geobas-db-v1'), 'WINPERSISTED');
  });

  // --- base64 / bytes fidelity + real sqlite bytes through the pipeline ---
  const s5 = buildSandbox({ localStorageBackend: new Map() });
  loadPage(s5);
  check('base64ToBytes/bytesToBase64 are inverse', () => {
    const bytes = new Uint8Array([0, 1, 2, 255, 128, 65, 66, 67]);
    const b64 = s5.ctx.bytesToBase64(bytes);
    const back = s5.ctx.base64ToBytes(b64);
    assert.deepEqual([...back], [...bytes]);
  });
  check('real sqlite bytes survive base64+store+reload pipeline (node:sqlite)', async () => {
    const dbsync = new DatabaseSync(':memory:');
    dbsync.exec('CREATE TABLE t (x TEXT); INSERT INTO t VALUES (\'hello\');');
    const raw = dbsync.serialize();
    dbsync.close();
    const bytes = new Uint8Array(raw);
    const backend2 = new Map();
    const a = buildSandbox({ localStorageBackend: backend2 });
    loadPage(a);
    await a.ctx.safeStore().set('geobas-db-v1', a.ctx.bytesToBase64(bytes));
    const b = buildSandbox({ localStorageBackend: backend2 });
    loadPage(b);
    const stored = await b.ctx.safeStore().get('geobas-db-v1');
    const decoded = b.ctx.base64ToBytes(stored);
    assert.equal(decoded.length, bytes.length, 'byte length preserved through pipeline');
    // verify the blob itself is a valid sqlite db containing our row
    const tmp = path.join('/tmp', 'geobas-pipeline-' + Date.now() + '.sqlite');
    const fs = await import('node:fs');
    fs.writeFileSync(tmp, decoded);
    const v = new DatabaseSync(tmp);
    const row = v.prepare('SELECT x FROM t').get();
    v.close();
    fs.unlinkSync(tmp);
    assert.equal(row.x, 'hello');
  });
}

/* ---------------- 2. imported SQLite trust ---------------- */
section('2. Imported SQLite trust');

{
  const s = buildSandbox({ localStorageBackend: new Map() });
  loadPage(s);
  const REQUIRED = ['languages','regions','region_i18n','countries','country_regions','country_i18n','cards','card_body','card_kv','country_ngos','org_directory'];

  check('validateImportedDb accepts a DB with all required tables', () => {
    s.ctx.setDb(fakeDb(REQUIRED));
    s.ctx.validateImportedDb();
  });
  check('validateImportedDb rejects a DB missing a table', () => {
    s.ctx.setDb(fakeDb(REQUIRED.filter(t => t !== 'org_directory')));
    assert.throws(() => s.ctx.validateImportedDb(), /missing table: org_directory/);
  });
  check('validateImportedDb rejects a DB missing several tables', () => {
    s.ctx.setDb(fakeDb(['languages', 'regions']));
    assert.throws(() => s.ctx.validateImportedDb(), /missing table/);
  });

  // import handler: failure restores previous DB and alerts importFail
  check('import handler: corrupt blob keeps previous DB (no partial state)', async () => {
    const s6 = buildSandbox({ localStorageBackend: new Map() });
    s6.sandbox.console = { error: () => {}, warn: () => {}, log: () => {} };   // handler logs the failure via console.error
    loadPage(s6);
    const prevDb = fakeDb(REQUIRED);
    s6.ctx.setDb(prevDb);
    s6.ctx.setSQLLib({ Database: class { constructor(){ throw new Error('not a sqlite db'); } } });
    const input = s6.elements.get('import-file');
    const changeEvts = input._listeners['change'];
    assert.ok(changeEvts && changeEvts.length, 'import change listener registered');
    const fakeFile = { arrayBuffer: async () => new Uint8Array([0xde, 0xad, 0xbe, 0xef]) };
    await changeEvts[0].call(input, { target: { files: [fakeFile], value: 'x' } });
    assert.equal(s6.ctx.getDb(), prevDb, 'db must be restored to the previous instance');
    assert.ok(s6.alerts.some(m => m.includes(s6.ctx.t('importFail'))), 'importFail alert shown');
    assert.equal(await s6.ctx.safeStore().get('geobas-db-v1'), null, 'nothing persisted');
  });

  // import handler: valid blob persists and swaps db
  check('import handler: valid DB is accepted and persisted', async () => {
    const s7 = buildSandbox({ localStorageBackend: new Map() });
    loadPage(s7);
    const prevDb = fakeDb(REQUIRED);
    s7.ctx.setDb(prevDb);
    s7.ctx.setSQLLib({ Database: class { constructor(buf){ this._buf = buf; } } });
    // The handler builds the candidate from the blob; emulate a candidate whose
    // schema is complete by answering sqlite_master with the full table set.
    const origValidate = s7.ctx.validateImportedDb;
    s7.ctx.validateImportedDb = function(){ s7.ctx.setDb(fakeDb(REQUIRED)); return origValidate.call(this); };
    const input = s7.elements.get('import-file');
    const changeEvts = input._listeners['change'];
    await changeEvts[0].call(input, { target: { files: [{ arrayBuffer: async () => new Uint8Array([1,2,3]) }], value: 'x' } });
    assert.ok(s7.alerts.some(m => m.includes(s7.ctx.t('importOk'))), 'importOk alert shown');
    const stored = await s7.ctx.safeStore().get('geobas-db-v1');
    assert.ok(stored && stored.length > 0, 'imported db persisted to store');
  });
}

/* ---------------- 3. language-code injection ---------------- */
section('3. Language-code injection');

{
  const s = buildSandbox({ localStorageBackend: new Map() });
  loadPage(s);

  check('escapeHtmlAttr escapes double quotes (no attribute breakout)', () => {
    assert.equal(s.ctx.escapeHtmlAttr('x" onmouseover="alert(1)'), 'x&quot; onmouseover=&quot;alert(1)');
    assert.equal(s.ctx.escapeHtmlAttr('<b>'), '&lt;b&gt;');
    assert.equal(s.ctx.escapeHtmlAttr("a'b"), 'a&#39;b');
  });
  check('escapeHtml does NOT escape quotes (must never be used in attributes)', () => {
    assert.equal(s.ctx.escapeHtml('x" onmouseover="alert(1)'), 'x" onmouseover="alert(1)');
  });
  check('renderLangSwitch: hostile language code cannot break out of data-lang', () => {
    const hostile = 'sv" onmouseover="alert(1)';
    s.ctx.getLanguages = () => [{ code: hostile, name: 'Evil' }];
    s.ctx.renderLangSwitch();
    const ls = s.elements.get('lang-switch');
    const html = ls._innerHTML;
    // The hostile string may legitimately appear as inert text content, so parse
    // the rendered HTML and verify no attribute materialized from the payload.
    const doc = new MiniDOMParser().parseFromString(html, 'text/html');
    const btn = doc.body.childNodes.find(n => n.nodeType === 1 && n.tagName === 'BUTTON');
    assert.ok(btn, 'a button was rendered');
    assert.equal(btn.getAttribute('onmouseover'), null, 'no onmouseover attribute injected');
    assert.equal(btn.getAttribute('data-lang'), hostile, 'data-lang holds the raw code, decoded safely');
    assert.ok(!/data-lang="[^"]*"[^>]*onmouseover\s*=/.test(html), 'no unescaped attribute breakout in source');
  });
  check('renderLangSwitch: normal codes render cleanly and active state works', () => {
    s.ctx.getLanguages = () => [{ code: 'sv', name: 'Svenska' }, { code: 'ar', name: 'العربية' }];
    s.ctx.setLang('ar');
    s.ctx.renderLangSwitch();
    const ls = s.elements.get('lang-switch');
    const html = ls._innerHTML;
    assert.ok(html.includes('data-lang="ar"'), 'ar pill present');
    assert.ok(html.includes('class="lang-pill active"'), 'active class applied');
    assert.ok(html.includes('العربية'), 'ar name rendered');
  });
}

/* ---------------- 4. unsafe URLs ---------------- */
section('4. Unsafe URLs');

{
  const s = buildSandbox({ localStorageBackend: new Map() });
  loadPage(s);

  check('safeUrl blocks javascript:/data:/vbscript:/file: and mixed case', () => {
    for(const bad of ['javascript:alert(1)', 'JaVaScRiPt:alert(1)', 'data:text/html,<script>1</script>', 'vbscript:msgbox(1)', 'file:///etc/passwd', 'java\nscript:alert(1)', ' javascript:alert(1) ']){
      assert.equal(s.ctx.safeUrl(bad), '', 'blocked: ' + bad);
    }
  });
  check('safeUrl accepts https/http/mailto and trims whitespace', () => {
    assert.equal(s.ctx.safeUrl('https://example.org/'), 'https://example.org/');
    assert.equal(s.ctx.safeUrl('  http://example.org/a?b=c#d  '), 'http://example.org/a?b=c#d');
    assert.equal(s.ctx.safeUrl('mailto:a@b.se'), 'mailto:a@b.se');
    assert.equal(s.ctx.safeUrl(null), '');
    assert.equal(s.ctx.safeUrl(''), '');
  });
  check('renderNgoList: javascript: URL produces no link, https URL gets noopener+blank', () => {
    s.ctx.getNgos = () => [
      { id: 1, name: 'Evil org', url: 'javascript:alert(1)', note: 'x' },
      { id: 2, name: 'Good org', url: 'https://good.example.org/', note: 'y' },
    ];
    s.ctx.renderNgoList(1);
    const el = s.elements.get('ngo-list');
    const html = el._innerHTML;
    assert.ok(!html.includes('javascript:'), 'no javascript: scheme in output');
    assert.ok(!html.includes('href="javascript'), 'no javascript: href');
    assert.ok(html.includes('href="https://good.example.org/"'), 'https link rendered');
    assert.ok(html.includes('rel="noopener"') && html.includes('target="_blank"'), 'noopener + blank present');
  });
  check('renderOrgDirectory: javascript: URL produces no link', () => {
    s.ctx.getOrgDirectory = () => [
      { id: 1, name: 'Evil', url: 'javascript:alert(1)', contact: '', description: '' },
      { id: 2, name: 'Mail', url: 'mailto:help@example.org', contact: '', description: '' },
    ];
    s.ctx.renderOrgDirectory();
    const el = s.elements.get('org-directory-list');
    const html = el._innerHTML;
    assert.ok(!html.includes('javascript:'), 'no javascript: scheme in org directory');
    assert.ok(html.includes('href="mailto:help@example.org"'), 'mailto link rendered');
  });
  check('goResources: resource links also scheme-guarded', () => {
    s.ctx.goResources();
    const el = s.elements.get('resources-list');
    const html = el._innerHTML;
    assert.ok(!html.includes('javascript:'), 'no javascript: in resource links');
  });
}

/* ---------------- 5. Arabic RTL ---------------- */
section('5. Arabic RTL');

{
  const s = buildSandbox({ localStorageBackend: new Map() });
  loadPage(s);
  check('applyLangDir sets dir=rtl + lang=ar for Arabic', () => {
    s.ctx.setLang('ar');
    s.ctx.applyLangDir();
    assert.equal(s.docEl.dir, 'rtl');
    assert.equal(s.docEl.lang, 'ar');
  });
  check('applyLangDir sets dir=ltr for non-Arabic languages', () => {
    for(const l of ['sv', 'en', 'es']){
      s.ctx.setLang(l);
      s.ctx.applyLangDir();
      assert.equal(s.docEl.dir, 'ltr', l + ' => ltr');
      assert.equal(s.docEl.lang, l);
    }
  });
  check('RTL CSS rules exist in the stylesheet', () => {
    assert.ok(PAGE.includes('[dir="rtl"] .region-card::before'), 'rtl region-card rule present');
  });
}

/* ---------------- 6. navigation / edit behavior ---------------- */
section('6. Navigation & edit behavior');

{
  const s = buildSandbox({ localStorageBackend: new Map() });
  loadPage(s);
  s.ctx.setDb(fakeDb([]));   // no regions/countries — navigation fallbacks exercise cleanly
  const docClicks = s.clicks;

  check('click delegation: [data-nav] routes to views', () => {
    const fire = token => {
      const fn = docClicks[0];
      fn({ target: { closest: sel => (sel === '[data-nav]' ? { getAttribute: () => token } : null) } });
    };
    fire('start');
    assert.ok(s.elements.get('view-start').classList.contains('active'), 'start view active');
    fire('regions');
    assert.ok(s.elements.get('view-regions').classList.contains('active'), 'regions view active');
  });
  check('handleNav("region:<id>") routes into region view (fallback to regions when unknown)', () => {
    s.ctx.handleNav('region:42');
    assert.ok(s.elements.get('view-regions').classList.contains('active'), 'fell back to regions view');
  });
  check('renderLangSwitch shows the + add-language pill only in edit mode', () => {
    s.ctx.getLanguages = () => [{ code: 'sv', name: 'Svenska' }];
    s.ctx.setEditMode(false);
    s.ctx.renderLangSwitch();
    assert.ok(!s.elements.get('lang-switch')._innerHTML.includes('btn-add-lang'), 'no add pill in view mode');
    s.ctx.setEditMode(true);
    s.ctx.renderLangSwitch();
    assert.ok(s.elements.get('lang-switch')._innerHTML.includes('btn-add-lang'), 'add pill in edit mode');
    s.ctx.setEditMode(false);
  });
  check('renderNgoList renders editable rows in edit mode', () => {
    s.ctx.getNgos = () => [{ id: 1, name: 'N', url: 'https://n.example', note: 'note' }];
    s.ctx.setEditMode(true);
    s.ctx.renderNgoList(1);
    const el = s.elements.get('ngo-list');
    assert.ok(el._innerHTML.includes('ngo-edit-row'), 'edit rows rendered');
    assert.ok(el._innerHTML.includes('value="N"'), 'name value escaped and present');
    s.ctx.setEditMode(false);
  });
  check('renderOrgDirectory renders editable rows in edit mode', () => {
    s.ctx.getOrgDirectory = () => [{ id: 1, name: 'O', url: 'https://o.example', contact: 'c', description: 'd' }];
    s.ctx.setEditMode(true);
    s.ctx.renderOrgDirectory();
    const el = s.elements.get('org-directory-list');
    assert.ok(el._innerHTML.includes('data-org-id="1"'), 'org edit row rendered');
    s.ctx.setEditMode(false);
  });
  check('renderTopicCard keeps card body and kv (sanitized rich text)', () => {
    const card = { id: 7, title: 'Titel', body: ['<p onclick="x">Hej</p>'], kv: [{ k: 'K', v: 'V' }] };
    const html = s.ctx.renderTopicCard(card);
    assert.ok(html.includes('data-card-id="7"'), 'card id present');
    assert.ok(html.includes('Hej'), 'body text present');
    assert.ok(!html.includes('onclick'), 'no event handler survives');
    assert.ok(html.includes('<span class="k">K</span>'), 'kv key rendered');
  });
}

/* ---------------- 7. CKEditor conservative ---------------- */
section('7. CKEditor sanitization stays conservative');

{
  const s = buildSandbox({ localStorageBackend: new Map() });
  loadPage(s);

  check('sanitizeRich strips <script> entirely', () => {
    assert.equal(s.ctx.sanitizeRich('<script>alert(1)</script>'), '');
  });
  check('sanitizeRich strips <script> nested inside a disallowed wrapper (bypass fixed)', () => {
    assert.equal(s.ctx.sanitizeRich('<div><script>alert(1)</script></div>'), '');
  });
  check('sanitizeRich strips event handlers and keeps safe tags', () => {
    assert.equal(s.ctx.sanitizeRich('<p onclick="x">Hej</p>'), '<p>Hej</p>');
  });
  check('sanitizeRich drops javascript: links but keeps https with noopener', () => {
    assert.equal(s.ctx.sanitizeRich('<a href="javascript:alert(1)">x</a>'), '<a>x</a>');
    assert.equal(s.ctx.sanitizeRich('<a href="https://ok.example">x</a>'), '<a href="https://ok.example" rel="noopener noreferrer" target="_blank">x</a>');
  });
  check('sanitizeRich strips unknown tags and keeps their safe children', () => {
    assert.equal(s.ctx.sanitizeRich('<div><b>Bold</b></div>'), '<b>Bold</b>');
  });
  check('sanitizeRich unwraps nested disallowed wrappers and sanitizes inside', () => {
    assert.equal(s.ctx.sanitizeRich('<div><p onclick="x">T</p></div>'), '<p>T</p>');
  });
  check('sanitizeRich drops iframe/object/embed/forms', () => {
    for(const t of ['iframe','object','embed','form','input','textarea','button','svg','math']){
      assert.ok(!s.ctx.sanitizeRich('<' + t + '>x</' + t + '>').includes('<' + t), t + ' removed: ' + s.ctx.sanitizeRich('<' + t + '>x</' + t + '>'));
    }
  });
  check('RICH_DROP contains script/style/iframe; RICH_ALLOWED is a small whitelist', () => {
    const allowed = s.ctx.RICH_ALLOWED;
    const drop = s.ctx.RICH_DROP;
    for(const t of ['SCRIPT','STYLE','IFRAME','OBJECT','EMBED','FORM','INPUT','TEXTAREA','SELECT','BUTTON','META','LINK','FRAME','AUDIO','VIDEO']) assert.ok(drop.has(t), 'RICH_DROP has ' + t);
    assert.ok(allowed.size <= 17, 'whitelist stays small');
    for(const t of ['P','BR','STRONG','EM','UL','OL','LI','A','H3','H4','BLOCKQUOTE']) assert.ok(allowed.has(t), 'RICH_ALLOWED has ' + t);
  });
  check('CKEditor config stays conservative (allowedContent whitelist, paste plain text)', () => {
    assert.ok(PAGE.includes("allowedContent: 'p br strong em u s sub sup ul ol li blockquote h3 h4 a[href,target,rel]'"), 'allowedContent whitelist');
    assert.ok(PAGE.includes('forcePasteAsPlainText: true'), 'forcePasteAsPlainText');
    assert.ok(PAGE.includes('removePlugins: \'image,table,specialchar,horizontalrule,stylescombo,sourcearea'), 'dangerous plugins removed');
  });
}

/* ---------------- static source guards ---------------- */
section('Static source guards');
{
  check('renderLangSwitch uses escapeHtmlAttr for data-lang (no raw interpolation)', () => {
    assert.ok(PAGE.includes('data-lang="${escapeHtmlAttr(l.code)}"'), 'data-lang escaped');
    assert.ok(!/data-lang="\$\{l\.code\}"/.test(PAGE), 'no raw ${l.code} in data-lang');
  });
  check('all visitor URL renders go through safeUrl + escapeHtmlAttr', () => {
    assert.ok(PAGE.includes('safeUrl(n.url)'), 'ngo url guarded');
    assert.ok(PAGE.includes('safeUrl(o.url)'), 'org url guarded');
    assert.ok(PAGE.includes('safeUrl(item.url)'), 'resource url guarded');
    assert.ok(!PAGE.includes('href="${escapeHtml(n.url)}"'), 'no unguarded ngo href');
    assert.ok(!PAGE.includes('href="${escapeHtml(o.url)}"'), 'no unguarded org href');
  });
  check('import handler validates and restores previous db on failure', () => {
    assert.ok(PAGE.includes('validateImportedDb()'), 'validateImportedDb called');
    assert.ok(PAGE.includes('db = prevDb'), 'previous db restored');
    assert.ok(PAGE.includes('candidate.close()'), 'candidate closed on failure');
  });
  check('no attribute-context interpolation uses bare escapeHtml for untrusted data', () => {
    const attrEscapes = [...PAGE.matchAll(/="[^"]*\$\{escapeHtml\(([a-z][a-z0-9_.]+)\)\}/gi)].map(m => m[1]);
    const bad = attrEscapes.filter(v => /\.(url|name|code|note|contact|description|k|v)$/.test(v) && !v.includes('t('));
    assert.deepEqual(bad, [], 'attributes with DB-derived data must use escapeHtmlAttr: ' + JSON.stringify(bad));
  });
  check('storage fallback picks window.storage only when it provides get+set functions', () => {
    assert.ok(PAGE.includes("typeof window.storage.get === 'function'"), 'window.storage.get probe');
    assert.ok(PAGE.includes("typeof window.storage.set === 'function'"), 'window.storage.set probe');
    assert.ok(PAGE.includes('localStorage.getItem'), 'localStorage fallback present');
  });
}

/* ================================================================== */
await finish();
