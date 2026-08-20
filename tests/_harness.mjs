// Shared pure-Node DOM-compatibility harness for the GeoBas tests.
// Loads the REAL inline <script> of geobas-portal.html into a sandbox backed
// by parse5 (the HTML5 parser jsdom uses), plus a lightweight DOM stub that
// records rendered innerHTML/textContent for assertion + visible-content
// checks. This is a superset of the stubs used by regression.test.mjs /
// render-smoke.mjs: it additionally tracks the ACTIVE route view and
// nav aria-current so per-route "which view is shown" can be asserted.
//
// Import and call loadSandbox() once per test run.
import { createRequire } from 'node:module';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

let parse5;
try { parse5 = require('/opt/hermes/node_modules/parse5'); }
catch (e) { parse5 = require(path.join(__dirname, 'node_modules', 'parse5')); }

export const NodeConst = { TEXT_NODE: 3, ELEMENT_NODE: 1 };
export const NodeFilterConst = { SHOW_COMMENT: 128 };

export const HTML_PATH = path.join(__dirname, '..', 'geobas-portal.html');

export function readInlineScript() {
  const html = fs.readFileSync(HTML_PATH, 'utf8');
  const m = html.match(/<script>([\s\S]*?)<\/script>/);
  if (!m) throw new Error('FAIL: inline <script> block not found in HTML');
  return m[1];
}

// A real classList based on a Set so .active / aria-current tracking works.
function makeClassList() {
  const set = new Set();
  return {
    add: (c) => set.add(c),
    remove: (c) => set.delete(c),
    toggle: (c) => (set.has(c) ? (set.delete(c), false) : (set.add(c), true)),
    contains: (c) => set.has(c),
    _set: set,
  };
}

function makeElement(id) {
  return {
    id,
    innerHTML: '',
    textContent: '',
    value: '',
    _attrs: {},
    classList: makeClassList(),
    style: {},
    addEventListener() {},
    focus() {},
    querySelectorAll() { return []; },
    setAttribute(n, v) { this._attrs[n] = String(v); },
    getAttribute(n) { return n in this._attrs ? this._attrs[n] : null; },
    removeAttribute(n) { delete this._attrs[n]; },
  };
}

// Mirrors browser div serialization for escapeHtml(): textContent -> innerHTML
// escapes & < > but NOT quotes (the exact behaviour the app relies on).
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

const VIEW_IDS = [
  'view-home', 'view-regions', 'view-countries', 'view-country',
  'view-about', 'view-resources',
];

function buildDocumentStub() {
  const viewEls = new Map(VIEW_IDS.map((id) => [id, makeElement(id)]));
  const navButtons = ['start', 'regions', 'about', 'resources'].map((n) => {
    const el = makeElement('nav-' + n);
    el.setAttribute('data-nav', n);
    return el;
  });
  const recorder = new Map();

  return {
    _els: {},
    getElementById(id) {
      if (viewEls.has(id)) return viewEls.get(id);
      if (!recorder.has(id)) recorder.set(id, makeElement(id));
      return recorder.get(id);
    },
    createElement(tag) { return tag === 'div' ? makeEscapeDiv() : makeElement(tag); },
    addEventListener() {},
    querySelector(sel) { return makeElement('query-result'); },
    querySelectorAll(sel) {
      if (sel === '.view') return VIEW_IDS.map((id) => viewEls.get(id));
      if (sel === '.svc-nav [data-nav]') return navButtons;
      return [];
    },
    // introspection helpers used by the test code
    _views: viewEls,
    _nav: navButtons,
    _recorder: recorder,
    title: '',
    documentElement: { lang: '', dir: '' },
  };
}

function makeLocalStorage() {
  const m = new Map();
  return {
    getItem(k) { return m.has(k) ? m.get(k) : null; },
    setItem(k, v) { m.set(k, String(v)); },
    removeItem(k) { m.delete(k); },
    clear() { m.clear(); },
  };
}

export function buildEnv() {
  const documentStub = buildDocumentStub();
  const windowStub = {
    localStorage: makeLocalStorage(),
    storage: undefined,
    addEventListener() {},
    scrollTo() {},
    location: { href: 'http://localhost/' },
  };
  return { documentStub, windowStub };
}

// --- browser-DOM compatibility layer over parse5 (for sanitizeRichHtml etc.) ---
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

// Runs the inline script + appended `testCode` inside the shared sandbox.
// Returns the value the test code returns (e.g. an array of {name,pass,detail}).
export async function runSandbox({ inlineScript, testCode, initSqlJsStub, env }) {
  const { documentStub, windowStub } = env;
  const sandbox = new Function(
    'document', 'window', 'DOMParser', 'NodeFilter', 'Node', 'Globe', 'initSqlJs',
    'return (async () => {\n' + inlineScript + '\n' + testCode + '\n})();'
  );
  if (typeof initSqlJsStub === 'undefined') {
    initSqlJsStub = async () => ({
      Database: class {
        constructor(bytes) { this.bytes = bytes || null; }
        run() {}
        exec(sql) { if (/last_insert_rowid/i.test(sql)) return [{ columns: ['id'], values: [[1]] }]; return []; }
        export() { return new Uint8Array([1, 2, 3, 4]); }
        prepare() { return { bind() {}, step() { return false; }, getAsObject() { return {}; }, free() {} }; }
      },
    });
  }
  try {
    return await sandbox(documentStub, windowStub, DOMParserShim, NodeFilterConst, NodeConst, undefined, initSqlJsStub);
  } catch (e) {
    console.error('SANDBOX CRASH:', e && e.stack ? e.stack : e);
    process.exit(1);
  }
}

export function summarize(results) {
  let pass = 0, fail = 0;
  const failures = [];
  for (const r of results) {
    if (r.pass) pass++; else { fail++; failures.push(r); }
  }
  return { pass, fail, failures };
}
