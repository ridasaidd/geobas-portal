// Render-walkthrough smoke: drives every view through the REAL inline script
// of geobas-portal.html with realistic data stubs, and prints the rendered
// HTML of each view so the new IA can be reviewed without a browser.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const parse5 = require('/opt/hermes/node_modules/parse5');
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const HTML_PATH = path.join(__dirname, '..', 'geobas-portal.html');
const html = fs.readFileSync(HTML_PATH, 'utf8');
const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/)[1];

function makeElement(id) {
  return {
    id, innerHTML: '', textContent: '', value: '', _attrs: {},
    classList: { add() {}, remove() {}, toggle() {}, contains() { return false; } },
    style: {}, addEventListener() {}, focus() {},
    querySelectorAll() { return []; },
    setAttribute(n, v) { this._attrs[n] = String(v); },
    getAttribute(n) { return n in this._attrs ? this._attrs[n] : null; },
    removeAttribute(n) { delete this._attrs[n]; },
  };
}
function makeEscapeDiv() {
  let t = '';
  return {
    tagName: 'DIV',
    set textContent(v) { t = v == null ? '' : String(v); },
    get innerHTML() { return String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); },
  };
}
const documentStub = {
  _els: {},
  getElementById(id) { if (!this._els[id]) this._els[id] = makeElement(id); return this._els[id]; },
  createElement(tag) { return tag === 'div' ? makeEscapeDiv() : makeElement(tag); },
  addEventListener() {},
  querySelector() { return makeElement('query-result'); },
  querySelectorAll() { return []; },
  title: '',
  documentElement: { lang: '', dir: '' },
};
const localStorageStub = (() => { const m = new Map(); return {
  getItem(k) { return m.has(k) ? m.get(k) : null; }, setItem(k, v) { m.set(k, String(v)); },
  removeItem(k) { m.delete(k); }, clear() { m.clear(); },
}; })();
const windowStub = {
  localStorage: localStorageStub, storage: undefined,
  addEventListener() {}, scrollTo() {}, location: { href: 'http://localhost/' },
};

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
    this._p5 = p5node; this.parentNode = parent || null;
    this.childNodes = (p5node.childNodes || []).map((c) => new ShimNode(c, this));
  }
  get nodeType() { const n = this._p5.nodeName; if (n === '#text') return 3; if (n === '#comment') return 8; if (n === '#document') return 9; return 1; }
  get tagName() { return (this._p5.tagName || this._p5.nodeName || '').toUpperCase(); }
  get firstChild() { return this.childNodes[0] || null; }
  get attributes() { return this._p5.attrs || []; }
  getAttribute(n) { const a = (this._p5.attrs || []).find((x) => x.name.toLowerCase() === String(n).toLowerCase()); return a ? a.value : null; }
  hasAttribute(n) { return this.getAttribute(n) != null; }
  setAttribute(n, v) { const arr = this._p5.attrs || (this._p5.attrs = []); const i = arr.findIndex((x) => x.name === n); if (i >= 0) arr[i].value = String(v); else arr.push({ name: n, value: String(v) }); }
  removeAttribute(n) { if (this._p5.attrs) { const i = this._p5.attrs.findIndex((x) => x.name === n); if (i >= 0) this._p5.attrs.splice(i, 1); } }
  get textContent() { return collectText(this); }
  get innerHTML() { return serializeChildren(this); }
  get outerHTML() { return serializeNode(this); }
  remove() { if (this.parentNode) { const arr = this.parentNode.childNodes; const i = arr.indexOf(this); if (i >= 0) arr.splice(i, 1); this.parentNode = null; } }
  insertBefore(newNode, ref) {
    if (newNode.parentNode) { const oi = newNode.parentNode.childNodes.indexOf(newNode); if (oi >= 0) newNode.parentNode.childNodes.splice(oi, 1); }
    newNode.parentNode = this; const arr = this.childNodes; const i = ref ? arr.indexOf(ref) : -1;
    if (i >= 0) arr.splice(i, 0, newNode); else arr.push(newNode);
  }
  querySelectorAll(sel) {
    const want = sel.split(',').map((s) => s.trim().toLowerCase()); const out = [];
    const walk = (n) => { for (const c of n.childNodes) { if (c.nodeType === 1) { if (want.includes('*') || want.includes(c.tagName.toLowerCase())) out.push(c); walk(c); } } };
    walk(this);
    return out;
  }
  getElementById(id) {
    let found = null;
    const walk = (n) => { for (const c of n.childNodes) { if (c.nodeType === 1) { if (c.getAttribute('id') === id) { found = c; return; } walk(c); if (found) return; } } };
    walk(this);
    return found;
  }
  createTreeWalker(root, whatToShow) {
    const comments = []; const walk = (n) => { for (const c of n.childNodes) { if (c.nodeType === 8) comments.push(c); walk(c); } };
    walk(root); let i = -1;
    return { currentNode: null, nextNode() { i++; if (i < comments.length) { this.currentNode = comments[i]; return true; } return false; } };
  }
  get body() { return this.querySelectorAll('body')[0] || null; }
}
class DOMParserShim { parseFromString(str) { return new ShimNode(parse5.parse(String(str)), null); } }

const SMOKE = `
const __out = [];
function __snap(label, ids) {
  const html = ids.map((elId) => '<' + elId + '>' + document.getElementById(elId).innerHTML + '</' + elId + '>').join('');
  __out.push({ label: label, html: html });
}
// realistic data stubs
getRegions = () => [
  { id: 1, slug: 'europa', lat: 50, lng: 15, name: 'Europa', translated: true, countryCount: 6 },
  { id: 2, slug: 'afrika', lat: 2, lng: 20, name: 'Afrika', translated: false, countryCount: 7 },
];
getCountriesForRegion = () => [
  { id: 11, name: 'Georgien', translated: true, hasContent: true },
  { id: 12, name: 'Kosovo', translated: false, hasContent: false },
];
getCountryDetail = (cid, lang) => ({
  name: 'Georgien', intro: 'Öppet affärsklimat och låga skatter.',
  translated: true,
  cards: [
    { id: 21, title: 'IT och Digitala tjänster (Virtual Zone)', body: ['<p>Unik skattestatus för IT-export.</p>'], kv: [{ k: 'Affärsidé', v: 'Mjukvaruutveckling.' }] },
    { id: 22, title: null, body: ['<p>Introparagraf utan rubrik.</p>'], kv: [] },
  ],
});
getNgos = () => [{ id: 31, name: 'IOM', url: 'https://iom.int/', note: 'Betalar ut återetableringsstöd.' }];
getOrgDirectory = () => [{ id: 41, name: 'Migrationsverket', url: 'https://migrationsverket.se/', contact: '', description: 'Ansvarig myndighet.' }];
getRegionById = (id) => ({ id: 1, slug: 'europa', name: 'Europa', translated: true, countryCount: 6 });
findRegionForCountry = () => ({ id: 1, slug: 'europa', name: 'Europa', translated: true, countryCount: 6 });
currentLang = 'sv';
editMode = false;
await initDatabase();
goHome();
__snap('home', ['stepper', 'home-continue', 'home-region-table']);
goRegions();
__snap('regions', ['region-grid']);
goRegion(1);
__snap('countries', ['country-grid', 'region-context']);
goCountry(11);
__snap('country', ['topics-grid', 'ngo-list']);
goAbout();
__snap('about', ['org-directory-list']);
goResources();
__snap('resources', ['resources-list']);
// edit-mode pass on the country dossier
editMode = true;
goCountry(11);
__snap('country-edit', ['topics-grid', 'ngo-list']);
// continue-card state
state.regionId = 1; state.countryId = 11;
goHome();
__snap('home-continue', ['home-continue']);
return __out;
`;

const sandbox = new Function(
  'document', 'window', 'DOMParser', 'NodeFilter', 'Node', 'Globe', 'initSqlJs',
  'return (async () => {\n' + inlineScript + '\n' + SMOKE + '\n})();'
);
const initSqlJsStub = async () => ({
  Database: class {
    constructor(bytes) { this.bytes = bytes || null; }
    run() {}
    exec(sql) { if (/last_insert_rowid/i.test(sql)) return [{ columns: ['id'], values: [[1]] }]; return []; }
    export() { return new Uint8Array([1, 2, 3, 4]); }
    prepare() { return { bind() {}, step() { return false; }, getAsObject() { return {}; }, free() {} }; }
  },
});

try {
  const out = await sandbox(documentStub, windowStub, DOMParserShim, NodeFilterConst, NodeConst, undefined, initSqlJsStub);
  for (const snap of out) {
    console.log('\n================ ' + snap.label + ' ================');
    console.log(snap.html.slice(0, 1500));
    console.log('...(len ' + snap.html.length + ')');
  }
  const ids = new Set(out.map((s) => s.label));
  const ok = ['home', 'regions', 'countries', 'country', 'about', 'resources', 'country-edit', 'home-continue']
    .every((l) => ids.has(l));
  console.log('\nSMOKE VIEWS RENDERED:', ok ? 'ALL OK' : 'MISSING VIEWS');
  process.exit(ok ? 0 : 1);
} catch (e) {
  console.error('SMOKE CRASH:', e && e.stack ? e.stack : e);
  process.exit(1);
}
