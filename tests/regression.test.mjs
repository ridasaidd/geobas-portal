// Focused regression checks for the Globe Focus portal (geobas-portal.html).
//
// Runs the REAL inline script from the HTML inside a pure-Node sandbox with a
// small browser-DOM compatibility layer backed by parse5 (the HTML5 parser that
// jsdom itself uses). Covers: persistence (localStorage fallback + window.storage
// bridge compat), imported-SQLite trust boundary (tables + columns + types),
// language-code attribute injection, javascript:/unsafe URL rejection,
// rich-text sanitization + CKEditor modal preload round-trip (formatted,
// not over-escaped, hostile markup still stripped), and a Globe/i18n
// interaction smoke test.
//
// Requires parse5 from /opt/hermes/node_modules (jsdom is not installable here:
// no outbound DNS). Run: node tests/regression.test.mjs
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const parse5 = require('/opt/hermes/node_modules/parse5');

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML_PATH = path.join(__dirname, '..', 'geobas-portal.html');
const html = fs.readFileSync(HTML_PATH, 'utf8');

const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
if (!scriptMatch) { console.error('FAIL: inline <script> block not found in HTML'); process.exit(1); }
const inlineScript = scriptMatch[1];

// ---------------------------------------------------------------- shims ----
function makeElement(id) {
  return {
    id,
    innerHTML: '',
    textContent: '',
    value: '',
    _attrs: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    style: {},
    addEventListener() {},
    focus() {},
    querySelectorAll() { return []; },
    setAttribute(n, v) { this._attrs[n] = String(v); },
    getAttribute(n) { return n in this._attrs ? this._attrs[n] : null; },
    removeAttribute(n) { delete this._attrs[n]; },
  };
}
// Mirrors browser div serialization: textContent -> innerHTML escapes & < >
// and does NOT escape quotes — exactly the browser behavior that made
// attribute-context injection possible before the escapeHtml fix.
function makeEscapeDiv() {
  let t = '';
  return {
    tagName: 'DIV',
    set textContent(v) { t = v == null ? '' : String(v); },
    get innerHTML() {
      return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    },
  };
}
const documentStub = {
  _els: {},
  getElementById(id) {
    if (!this._els[id]) this._els[id] = makeElement(id);
    return this._els[id];
  },
  createElement(tag) { return tag === 'div' ? makeEscapeDiv() : makeElement(tag); },
  addEventListener() {},
  querySelector() { return makeElement('query-result'); },
  querySelectorAll() { return []; },
  title: '',
  documentElement: { lang: '', dir: '' },
};

const localStorageStub = (() => {
  const m = new Map();
  return {
    getItem(k) { return m.has(k) ? m.get(k) : null; },
    setItem(k, v) { m.set(k, String(v)); },
    removeItem(k) { m.delete(k); },
    clear() { m.clear(); },
  };
})();
const windowStub = {
  localStorage: localStorageStub,
  storage: undefined,
  addEventListener() {},
  scrollTo() {},
  location: { href: 'http://localhost/' },
};

// --- browser-DOM compatibility layer over parse5 ----------------------------
const NodeConst = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
const NodeFilterConst = { SHOW_COMMENT: 128 };

function escText(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function escAttr(s) { return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;'); }
function serializeNode(shim) {
  const p = shim._p5;
  if (shim.nodeType === 3) return escText(p.value != null ? p.value : p.nodeValue);
  if (shim.nodeType === 8) return '<!--' + (p.data != null ? p.data : (p.value != null ? p.value : '')) + '-->';
  const tag = (p.tagName || '').toLowerCase();
  if (tag === 'br') return '<br>';
  let s = '<' + tag;
  for (const a of (p.attrs || [])) s += ' ' + a.name + '="' + escAttr(a.value) + '"';
  s += '>' + shim.childNodes.map(serializeNode).join('') + '</' + tag + '>';
  return s;
}
function serializeChildren(shim) { return shim.childNodes.map(serializeNode).join(''); }
function collectText(shim) {
  let s = '';
  const walk = (n) => { for (const c of n.childNodes) { if (c.nodeType === 3) s += c._p5.value != null ? c._p5.value : c._p5.nodeValue; else walk(c); } };
  walk(shim);
  return s;
}

class ShimNode {
  constructor(p5node, parent) {
    this._p5 = p5node;
    this.parentNode = parent || null;
    this.childNodes = (p5node.childNodes || []).map((c) => new ShimNode(c, this));
  }
  get nodeType() {
    const n = this._p5.nodeName;
    if (n === '#text') return 3;
    if (n === '#comment') return 8;
    if (n === '#document') return 9;
    return 1;
  }
  get tagName() { return (this._p5.tagName || this._p5.nodeName || '').toUpperCase(); }
  get firstChild() { return this.childNodes[0] || null; }
  get attributes() { return this._p5.attrs || []; }
  getAttribute(n) {
    const a = (this._p5.attrs || []).find((x) => x.name.toLowerCase() === String(n).toLowerCase());
    return a ? a.value : null;
  }
  hasAttribute(n) { return this.getAttribute(n) != null; }
  setAttribute(n, v) {
    const arr = this._p5.attrs || (this._p5.attrs = []);
    const i = arr.findIndex((x) => x.name === n);
    if (i >= 0) arr[i].value = String(v); else arr.push({ name: n, value: String(v) });
  }
  removeAttribute(n) {
    if (this._p5.attrs) {
      const i = this._p5.attrs.findIndex((x) => x.name === n);
      if (i >= 0) this._p5.attrs.splice(i, 1);
    }
  }
  get textContent() { return collectText(this); }
  get innerHTML() { return serializeChildren(this); }
  get outerHTML() { return serializeNode(this); }
  remove() {
    if (this.parentNode) {
      const arr = this.parentNode.childNodes;
      const i = arr.indexOf(this);
      if (i >= 0) arr.splice(i, 1);
      this.parentNode = null;
    }
  }
  insertBefore(newNode, ref) {
    if (newNode.parentNode) {
      const oi = newNode.parentNode.childNodes.indexOf(newNode);
      if (oi >= 0) newNode.parentNode.childNodes.splice(oi, 1);
    }
    newNode.parentNode = this;
    const arr = this.childNodes;
    const i = ref ? arr.indexOf(ref) : -1;
    if (i >= 0) arr.splice(i, 0, newNode); else arr.push(newNode);
  }
  querySelectorAll(sel) {
    const want = sel.split(',').map((s) => s.trim().toLowerCase());
    const out = [];
    const walk = (n) => {
      for (const c of n.childNodes) {
        if (c.nodeType === 1) {
          if (want.includes('*') || want.includes(c.tagName.toLowerCase())) out.push(c);
          walk(c);
        }
      }
    };
    walk(this); // static snapshot, like a browser NodeList
    return out;
  }
  getElementById(id) {
    let found = null;
    const walk = (n) => {
      for (const c of n.childNodes) {
        if (c.nodeType === 1) {
          if (c.getAttribute('id') === id) { found = c; return; }
          walk(c);
          if (found) return;
        }
      }
    };
    walk(this);
    return found;
  }
  createTreeWalker(root, whatToShow) {
    const comments = [];
    const walk = (n) => { for (const c of n.childNodes) { if (c.nodeType === 8) comments.push(c); walk(c); } };
    walk(root);
    let i = -1;
    return {
      currentNode: null,
      nextNode() { i++; if (i < comments.length) { this.currentNode = comments[i]; return true; } return false; },
    };
  }
  get body() { return this.querySelectorAll('body')[0] || null; }
}

class DOMParserShim {
  parseFromString(str) { return new ShimNode(parse5.parse(String(str)), null); }
}

// ------------------------------------------------------------ test code ----
// Appended to the REAL inline script inside the sandbox; runs in the same scope
// so it exercises the actual functions/constants. Sequential top-level awaits.
const TEST_CODE = `
const __results = [];
function __check(name, cond, detail) {
  __results.push({ name: name, pass: !!cond, detail: detail || '' });
}

// ============ 1. persistence: storage() adapter ============
window.storage = undefined;
window.localStorage.clear();
let ad = storage();
const got0 = await ad.get('k1');
await ad.set('k1', 'v1');
const got1 = await ad.get('k1');
await ad.set('k2', 'V2', false); // third arg tolerated
__check('storage fallback: missing key -> null', got0 === null);
__check('storage fallback: set/get round-trip', got1 && got1.value === 'v1');
__check('storage fallback: second key round-trip', (await ad.get('k2')).value === 'V2');
const origSet = window.localStorage.setItem;
window.localStorage.setItem = () => { throw new Error('QuotaExceededError'); };
let quotaThrew = false;
try { await storage().set('x', 'y'); } catch (e) { quotaThrew = true; }
window.localStorage.setItem = origSet;
__check('storage fallback: quota/disabled surface as error', quotaThrew);

// host-bridge compatibility: window.storage preferred, localStorage untouched
const bridgeCalls = [];
window.storage = { get: async (k) => ({ value: 'BRIDGE' }), set: async (k, v, p) => bridgeCalls.push([k, v, p]) };
const origLg = window.localStorage.getItem;
let lsUsed = false;
window.localStorage.getItem = function () { lsUsed = true; return origLg.apply(this, arguments); };
const ad2 = storage();
const bGot = await ad2.get('geobas-db-v1');
await ad2.set('geobas-db-v1', 'B64', false);
window.localStorage.getItem = origLg;
__check('storage bridge: get prefers window.storage', bGot && bGot.value === 'BRIDGE');
__check('storage bridge: set forwards (key, value, isPrivate)',
  bridgeCalls.length === 1 && bridgeCalls[0][0] === 'geobas-db-v1' && bridgeCalls[0][1] === 'B64' && bridgeCalls[0][2] === false);
__check('storage bridge: localStorage never consulted', !lsUsed);

// ============ 2. persistence: initDatabase/persistDB wiring ============
window.storage = undefined;
window.localStorage.clear();
const dbInstances = [];
initSqlJs = async () => ({
  Database: class {
    constructor(bytes) { this.bytes = bytes || null; dbInstances.push(this); }
    run() {}
    exec(sql) { if (/last_insert_rowid/i.test(sql)) return [{ columns: ['id'], values: [[1]] }]; return []; }
    export() { return new Uint8Array([1, 2, 3, 4]); }
    prepare() { return { bind() {}, step() { return false; }, getAsObject() { return {}; }, free() {} }; }
  },
});
await initDatabase(); // fresh db -> buildSchema + seed -> persistDB
__check('initDatabase fresh: persisted to localStorage',
  window.localStorage.getItem('geobas-db-v1') === 'AQIDBA==');
const before = db;
await initDatabase(); // reload: bytes come back from localStorage
__check('initDatabase reload: db rebuilt from stored bytes',
  db !== before && dbInstances.length >= 2 && dbInstances[1].bytes && dbInstances[1].bytes.length === 4);

// host-bridge wiring: persistDB writes through window.storage when present
const bridgeCalls2 = [];
window.storage = { get: async (k) => ({ value: null }), set: async (k, v, p) => bridgeCalls2.push([k, v, p]) };
db = { export() { return new Uint8Array([9, 9]); } };
await persistDB();
__check('persistDB: writes via window.storage when present',
  bridgeCalls2.length === 1 && bridgeCalls2[0][0] === 'geobas-db-v1' && bridgeCalls2[0][2] === false);

// ============ 3. language-code attribute-context injection ============
const e1 = escapeHtml('"><script>alert(1)</script>');
const e2 = escapeHtml('x" onclick="alert(1)');
const e3 = escapeHtml('<b>&</b>');
__check('escapeHtml: escapes double quotes', e1.indexOf('&quot;') >= 0 && e1.indexOf('"><script>') < 0);
__check('escapeHtml: attribute breakout neutralized', e2.indexOf('&quot;') >= 0 && e2.indexOf('" onclick="') < 0);
__check('escapeHtml: tags/ampersands still escaped', e3.indexOf('&lt;b&gt;') >= 0 && e3.indexOf('&amp;') >= 0);

getLanguages = () => [
  { code: 'sv', name: 'Svenska' },
  { code: 'x" onclick="alert(1)', name: 'Evil' },
  { code: 'ar', name: '\\u0627\\u0644\\u0639\\u0631\\u0628\\u064a\\u0629' },
];
currentLang = 'sv';
editMode = false;
renderLangSwitch();
const lsHtml = document.getElementById('lang-switch').innerHTML;
__check('lang-switch: no attribute breakout in markup',
  lsHtml.indexOf('" onclick="') < 0 && lsHtml.indexOf('"><') < 0);
__check('lang-switch: code escaped into data-lang',
  lsHtml.indexOf('data-lang="x&quot; onclick=&quot;alert(1)"') >= 0);
const checkDoc = new DOMParser().parseFromString(lsHtml, 'text/html');
const btns = checkDoc.querySelectorAll('button');
__check('lang-switch: 3 buttons, raw code round-trips as attribute value',
  btns.length === 3 && btns[1].getAttribute('data-lang') === 'x" onclick="alert(1)');

// ============ 4. unsafe URL schemes (NGO / org directory) ============
const urlCases = [
  ['javascript:alert(1)', ''],
  ['JaVaScRiPt:alert(1)', ''],
  ['  javascript:alert(1)', ''],
  ['\\u0000javascript:alert(1)', ''],
  ['java\\tscript:alert(1)', ''],
  ['\\n\\njavascript:alert(1)', ''],
  ['data:text/html,<script>x</script>', ''],
  ['vbscript:x', ''],
  ['file:///etc/passwd', ''],
  ['https://example.com', 'https://example.com'],
  ['http://x.se/a', 'http://x.se/a'],
  ['mailto:hej@ex.se', 'mailto:hej@ex.se'],
  ['/rel/path', '/rel/path'],
  ['#anchor', '#anchor'],
  ['www.example.com', 'www.example.com'],
  ['', ''],
];
let urlOk = true;
const urlFails = [];
for (const c of urlCases) {
  const got = safeUrl(c[0]);
  if (got !== c[1]) { urlOk = false; urlFails.push(JSON.stringify(c[0]) + ' -> ' + JSON.stringify(got)); }
}
__check('safeUrl: rejects unsafe schemes, allows http/https/mailto/relative', urlOk, urlFails.join(' | '));
__check('renderExternalLink: drops javascript:', renderExternalLink('javascript:alert(1)', 'Bes\\u00f6k') === '');
const okLink = renderExternalLink('https://ok.se', 'Bes\\u00f6k');
__check('renderExternalLink: safe link rendered',
  okLink.indexOf('href="https://ok.se"') >= 0 && okLink.indexOf('rel="noopener"') >= 0 && okLink.indexOf('target="_blank"') >= 0);

getNgos = () => [
  { id: 1, name: 'Evil', url: 'javascript:alert(1)', note: 'n' },
  { id: 2, name: 'Good', url: 'https://good.se', note: '' },
  { id: 3, name: 'Rel', url: '/rel', note: '' },
  { id: 4, name: 'Mail', url: 'mailto:x@y.se', note: '' },
];
editMode = false;
renderNgoList(7);
const ngoHtml = document.getElementById('ngo-list').innerHTML;
__check('ngo list: no javascript: link emitted', ngoHtml.indexOf('javascript:') < 0);
__check('ngo list: https link emitted', ngoHtml.indexOf('href="https://good.se"') >= 0);
__check('ngo list: relative link emitted', ngoHtml.indexOf('href="/rel"') >= 0);
__check('ngo list: mailto link emitted', ngoHtml.indexOf('href="mailto:x@y.se"') >= 0);

getOrgDirectory = () => [
  { id: 1, name: 'Org', url: 'javascript:alert(2)', contact: '', description: '' },
  { id: 2, name: 'Org2', url: 'https://ok.org', contact: '', description: '' },
];
renderOrgDirectory();
const orgHtml = document.getElementById('org-directory-list').innerHTML;
__check('org directory: no javascript: link emitted', orgHtml.indexOf('javascript:') < 0);
__check('org directory: safe link emitted', orgHtml.indexOf('href="https://ok.org"') >= 0);

// save-time rejection: unsafe URLs never enter the DB
const updates = [];
db = {
  run(sql, params) { updates.push({ sql: sql, params: params }); },
  prepare() { return { bind() {}, step() { return false; }, getAsObject() { return {}; }, free() {} }; },
};
scheduleSave = () => {};
updateNgo(1, 'N', 'javascript:alert(1)', 'note');
updateOrg(2, 'O', 'data:text/html,x', 'c', 'd');
updateOrg(3, 'O2', 'https://fine.se', 'c', 'd');
__check('updateNgo: unsafe url rejected at save time', updates[0].params[1] === '');
__check('updateOrg: unsafe url rejected at save time', updates[1].params[1] === '');
__check('updateOrg: safe url kept at save time', updates[2].params[1] === 'https://fine.se');

// ============ 5. imported SQLite trust boundary ============
// Schema-aware mock: emulates sqlite_master + PRAGMA table_info responses.
// colsByTable: lowercase table name -> [[colName, declaredType], ...]
function mockDbSchema(colsByTable){
  return {
    exec(sql){
      if(/sqlite_master/.test(sql)){
        return [{ columns: ['name'], values: Object.keys(colsByTable).map((t) => [t]) }];
      }
      const m = sql.match(/PRAGMA table_info\\(\\"([^\\"]+)\\"\\)/i);
      if(m){
        const cols = colsByTable[m[1].toLowerCase()] || [];
        return [{ columns: ['cid', 'name', 'type', 'notnull', 'dflt_value', 'pk'],
                  values: cols.map((c, i) => [i, c[0], c[1], 0, null, i === 0 ? 1 : 0]) }];
      }
      return [];
    },
  };
}
// A structurally complete DB: every required table with every required column
const goodSchema = {};
REQUIRED_TABLES.forEach((t) => { goodSchema[t] = Object.keys(REQUIRED_SCHEMA[t]).map((c) => [c, REQUIRED_SCHEMA[t][c]]); });
let vOk = true;
const vFails = [];
try { validateImportedDb(mockDbSchema(goodSchema)); }
catch (e) { vOk = false; vFails.push('valid db rejected: ' + e.message); }
try { validateImportedDb({ exec: () => [{ columns: ['name'], values: REQUIRED_TABLES.map((t) => [t]) }] }); vOk = false; vFails.push('tables-only db accepted'); }
catch (e) { /* expected: no column info -> rejected */ }
try { validateImportedDb({ exec: () => [{ columns: ['name'], values: [['languages'], ['cards']] }] }); vOk = false; vFails.push('incomplete db accepted'); }
catch (e) { /* expected */ }
try { validateImportedDb({ exec: () => [{ columns: ['name'], values: [] }] }); vOk = false; vFails.push('empty db accepted'); }
catch (e) { /* expected */ }
try { validateImportedDb({ exec: () => [] }); vOk = false; vFails.push('no-rows db accepted'); }
catch (e) { /* expected */ }
// malformed-but-table-complete DBs: expected table names, wrong/missing columns
const wrongCols = JSON.parse(JSON.stringify(goodSchema));
wrongCols.cards = [['id', 'INTEGER'], ['title', 'TEXT']]; // missing country_id/lang/sort_order
try { validateImportedDb(mockDbSchema(wrongCols)); vOk = false; vFails.push('missing-card-columns db accepted'); }
catch (e) { /* expected */ }
const badType = JSON.parse(JSON.stringify(goodSchema));
badType.languages = [['code', 'INTEGER'], ['name', 'TEXT'], ['sort_order', 'INTEGER']]; // code must be TEXT
try { validateImportedDb(mockDbSchema(badType)); vOk = false; vFails.push('wrong-column-type db accepted'); }
catch (e) { /* expected */ }
const badAffinity = JSON.parse(JSON.stringify(goodSchema));
badAffinity.regions = [['id', 'INTEGER'], ['slug', 'TEXT'], ['lat', 'TEXT'], ['lng', 'REAL'], ['sort_order', 'INTEGER']]; // lat must be REAL
try { validateImportedDb(mockDbSchema(badAffinity)); vOk = false; vFails.push('wrong-affinity db accepted'); }
catch (e) { /* expected */ }
__check('validateImportedDb: schema trust boundary enforced (tables + columns + types)', vOk, vFails.join(' | '));

// ============ 6. rich-text sanitizer (conservative) ============
const s1 = sanitizeRichHtml(
  '<p onclick="x" style="color:red" class="y">hi</p><script>alert(1)</script>' +
  '<img src=x onerror=alert(1)><a href="javascript:alert(1)">j</a><a href="https://ok.se">ok</a>');
__check('sanitizeRichHtml: strips script/img/on-handlers/attrs',
  s1.indexOf('<script') < 0 && s1.indexOf('<img') < 0 && s1.indexOf('onclick') < 0 &&
  s1.indexOf('onerror') < 0 && s1.indexOf('style=') < 0 && s1.indexOf('class=') < 0 &&
  s1.indexOf('javascript:') < 0);
__check('sanitizeRichHtml: keeps safe link + text',
  s1.indexOf('https://ok.se') >= 0 && s1.indexOf('>hi<') >= 0);

const s2 = sanitizeRichText('<p><strong>B</strong></p><p><a href="javascript:x">bad</a></p><ul><li>i</li></ul><div>tail</div>');
__check('sanitizeRichText: splits units, no dangerous href/attr',
  Array.isArray(s2) && s2.length >= 3 && s2.every((u) => u.indexOf('javascript:') < 0 && u.indexOf('href') < 0));

__check('sanitizeRichFragment: render-time re-check', sanitizeRichFragment('<p onclick="x">frag</p>') === '<p>frag</p>');
__check('sanitizeRichHtml: drops svg elements', sanitizeRichHtml('<svg><circle/></svg>hi').indexOf('<svg') < 0);
__check('sanitizeRichText: stray </div> cannot escape rich-root',
  sanitizeRichText('<p>a</p></div><p>b</p>').join('|') === 'a|b');
__check('sanitizeRichText: script inside text cannot survive',
  sanitizeRichText('<p>x</p><script>alert(1)</script>').join('|') === 'x');

// ============ 7. i18n + Globe interactions smoke ============
__check('i18n: 4 languages defined', JSON.stringify(Object.keys(STRINGS)) === JSON.stringify(['sv', 'en', 'es', 'ar']));
currentLang = 'en'; const enCta = T('hero_cta');
currentLang = 'ar'; const arCta = T('hero_cta');
currentLang = 'sv'; const svCta = T('hero_cta');
__check('i18n: T() returns per-language strings',
  enCta !== arCta && svCta !== arCta && enCta === STRINGS.en.hero_cta && arCta === STRINGS.ar.hero_cta);
currentLang = 'xx'; const fallbackCta = T('hero_cta');
currentLang = 'sv';
__check('i18n: T() falls back to sv for unknown language', fallbackCta === svCta);
__check('i18n: Tf() substitutes %s', Tf('countries_count', 3) === T('countries_count').replace('%s', '3'));

currentLang = 'ar';
applyStaticI18n();
__check('i18n: applyStaticI18n sets rtl for ar',
  document.documentElement.dir === 'rtl' && document.documentElement.lang === 'ar');
currentLang = 'sv';
applyStaticI18n();
__check('i18n: applyStaticI18n sets ltr for sv', document.documentElement.dir === 'ltr');

// Globe interactions: stub the globe.gl factory with a recording chain
const globeCalls = [];
window._globeControls = { autoRotate: true, autoRotateSpeed: 0, enableZoom: true, enablePan: true, addEventListener() {} };
window._globeChain = new Proxy(function () {}, {
  get(t, prop) {
    if (prop === 'controls') return () => window._globeControls;
    return (...a) => { globeCalls.push([String(prop), a]); return window._globeChain; };
  },
  apply() { return window._globeChain; },
});
Globe = () => window._globeChain;
getRegions = () => [{ id: 1, slug: 'eu', lat: 50, lng: 15, name: 'Europa', translated: true, countryCount: 6 }];
initGlobe();
__check('globe: initGlobe runs and wires points', globeCalls.some((c) => c[0] === 'pointsData') && !!world);
const n0 = globeCalls.length;
refreshGlobePoints();
__check('globe: refreshGlobePoints re-emits points',
  globeCalls.length > n0 && globeCalls[globeCalls.length - 1][0] === 'pointsData');
goRegions();
const gridHtml = document.getElementById('region-grid').innerHTML;
__check('regions view: renders region card with i18n name',
  gridHtml.indexOf('Europa') >= 0 && gridHtml.indexOf('data-region-id="1"') >= 0);
__check('regions view: region name attribute-safe (no raw quotes)', gridHtml.indexOf('" onclick="') < 0);

// ============ 8. rich-text render path (renderTopicCard) ============
const cardHtml = renderTopicCard(
  { id: 1, title: 'T', body: ['<p onclick="x">para</p>'], kv: [{ k: 'K', v: 'V' }] }, 1);
__check('renderTopicCard: body re-sanitized at render time',
  cardHtml.indexOf('onclick') < 0 && cardHtml.indexOf('para') >= 0 && cardHtml.indexOf('>K<') >= 0);

// ============ 9. CKEditor modal preload (rich-text round-trip) ============
document.body = { style: {} };
let __capturedEditorOpts = null;
var ClassicEditor = { create: async (host, opts) => { __capturedEditorOpts = opts; return { destroy() {} }; } };
window.ClassicEditor = ClassicEditor;
getCountryDetail = (cid, lang) => ({ cards: [
  { id: 7, title: 'T', body: ['<strong>Bold</strong> and <a href="https://ok.se">link</a>', '<li>one</li><li>two</li>'], kv: [] },
] });
openEditModal(7, 1);
const pre = __capturedEditorOpts.initialData;
__check('modal preload: stored bold stays formatted (not over-escaped)',
  pre.indexOf('<strong>Bold</strong>') >= 0 && pre.indexOf('&lt;strong&gt;') < 0);
__check('modal preload: stored link kept as href', pre.indexOf('href="https://ok.se"') >= 0);
__check('modal preload: stored list markup kept',
  pre.indexOf('<li>one</li>') >= 0 && pre.indexOf('<li>two</li>') >= 0);

// hostile stored body (legacy/dirty data): preload sanitizer still strips it
getCountryDetail = (cid, lang) => ({ cards: [
  { id: 8, title: 'H', body: ['<script>alert(1)</script><p onclick="x">hi</p><a href="javascript:alert(1)">j</a><img src=x onerror=alert(1)>'], kv: [] },
] });
openEditModal(8, 1);
const pre2 = __capturedEditorOpts.initialData;
__check('modal preload: hostile stored markup sanitized',
  pre2.indexOf('<script') < 0 && pre2.indexOf('onclick') < 0 && pre2.indexOf('onerror') < 0 &&
  pre2.indexOf('javascript:') < 0 && pre2.indexOf('<img') < 0);
__check('modal preload: hostile payload degrades to plain text', pre2.indexOf('>hi<') >= 0 && pre2.indexOf('>j<') >= 0);

// save-side round-trip: sanitize -> preload rebuild -> re-sanitize keeps formatting
const rtUnits = sanitizeRichText('<p><strong>B</strong></p><p><a href="https://ok.se">L</a></p><ul><li>i</li></ul>');
const rtHtml = rtUnits.map((u) => '<p>' + sanitizeRichHtml(u) + '</p>').join('');
__check('rich-text round-trip: bold/link/list survive preload rebuild',
  rtHtml.indexOf('<strong>B</strong>') >= 0 && rtHtml.indexOf('href="https://ok.se"') >= 0 && rtHtml.indexOf('<li>i</li>') >= 0);
const rt2 = sanitizeRichText(rtHtml);
__check('rich-text round-trip: stable across re-save',
  rt2.join('|').indexOf('<strong>B</strong>') >= 0 && rt2.join('|').indexOf('https://ok.se') >= 0 && rt2.join('|').indexOf('<li>i</li>') >= 0);

return __results;
`;

// ------------------------------------------------------------ execution ----
const sandbox = new Function(
  'document', 'window', 'DOMParser', 'NodeFilter', 'Node', 'Globe', 'initSqlJs',
  'return (async () => {\n' + inlineScript + '\n' + TEST_CODE + '\n})();'
);
let runtime;
try {
  runtime = await sandbox(documentStub, windowStub, DOMParserShim, NodeFilterConst, NodeConst, undefined, undefined);
} catch (e) {
  console.error('SANDBOX CRASH:', e && e.stack ? e.stack : e);
  process.exit(1);
}

// ---- module-level source wiring checks --------------------------------------
const sourceChecks = [
  ['persistence wiring: initDatabase reads via storage()', /storage\(\)\.get\(STORAGE_KEY\)/.test(inlineScript)],
  ['persistence wiring: persistDB writes via storage()', /storage\(\)\.set\(STORAGE_KEY, b64, false\)/.test(inlineScript)],
  ['persistence wiring: no direct window.storage.get/set calls remain', !/window\.storage\.(get|set)\(/.test(inlineScript)],
  ['import boundary wiring: validate before replacing db', /validateImportedDb\(candidate\)/.test(inlineScript) && /db = candidate;/.test(inlineScript)],
  ['import boundary wiring: column checks via PRAGMA table_info', /PRAGMA table_info/.test(inlineScript) && /REQUIRED_SCHEMA/.test(inlineScript)],
  ['modal preload wiring: stored rich html re-sanitized, not escaped', /<p>\$\{sanitizeRichHtml\(p\)\}<\/p>/.test(inlineScript) && !/<p>\$\{escapeHtml\(p\)\}<\/p>/.test(inlineScript)],
  ['url guard wiring: NGO link via renderExternalLink', /renderExternalLink\(n\.url, T\('visit_site'\)\)/.test(inlineScript)],
  ['url guard wiring: org link via renderExternalLink', /renderExternalLink\(o\.url, T\('visit_site'\)\)/.test(inlineScript)],
  ['url guard wiring: NGO save sanitizes url', /\[name, safeUrl\(url\), note, id\]/.test(inlineScript)],
  ['url guard wiring: org save sanitizes url', /\[name, safeUrl\(url\), contact, description, id\]/.test(inlineScript)],
  ['sanitizer wiring: href check uses safeUrl', /if\(!safeUrl\(el\.getAttribute\('href'\)\)\)/.test(inlineScript)],
  ['lang-switch wiring: code escaped into data-lang attr', /data-lang="\$\{escapeHtml\(l\.code\)\}"/.test(inlineScript)],
  ['no new innerHTML sinks (baseline 25)', (inlineScript.match(/innerHTML/g) || []).length === 25],
  ['no new outerHTML sinks (baseline 1)', (inlineScript.match(/outerHTML/g) || []).length === 1],
  ['no insertAdjacentHTML growth (baseline 1)', (inlineScript.match(/insertAdjacentHTML/g) || []).length === 1],
  ['no document.write usage', !/document\.write/.test(inlineScript)],
];

// ------------------------------------------------------------ reporting -----
let pass = 0, fail = 0;
const failures = [];
for (const r of runtime) {
  if (r.pass) pass++;
  else { fail++; failures.push(r); }
}
for (const c of sourceChecks) {
  if (c[1]) pass++;
  else { fail++; failures.push({ name: c[0], pass: false, detail: 'source wiring missing' }); }
}

console.log('=== Globe Focus regression checks ===');
console.log('inline script size:', inlineScript.length, 'bytes');
console.log('runtime checks:', runtime.length, '| source checks:', sourceChecks.length);
console.log('PASS:', pass, ' FAIL:', fail);
if (failures.length) {
  console.log('\nFAILURES:');
  for (const f of failures) console.log('  - ' + f.name + (f.detail ? '  [' + f.detail + ']' : ''));
}
console.log(fail === 0 ? '\nALL CHECKS PASSED' : '\nSOME CHECKS FAILED');
process.exit(fail === 0 ? 0 : 1);
