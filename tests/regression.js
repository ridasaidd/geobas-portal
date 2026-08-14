#!/usr/bin/env node
/* =====================================================================
   Focused regression checks for the Editorial Atlas portal remediation
   (task t_114355bc).  Covers, per the task:

   1. startup/persistence        - window.storage fallback contract + full
                                   init flow (fresh DB + restored DB) with a
                                   fake sql.js; localStorage round-trip.
   2. imported SQLite trust      - import handler accepts a DB buffer and all
                                   hostile rows it may carry render sanitized
                                   (no attribute breakout, no live handlers);
                                   corrupt buffers fail gracefully.
   3. quote breakout / event-    - escapeHtml escapes quotes; rendering NGO/org
      handler injection            directory/language-switch with payloads
                                   produces no on* attributes; old Blocker-2
                                   payloads neutralized.
   4. javascript: URLs           - safeUrl hard-blocks scheme tricks and
                                   breakout chars for all visitor-facing links;
                                   rich-text <a> hrefs still protocol-allowlisted.
   5. window.storage compat      - pre-existing host implementation preserved.
   6. sanitizeRich R1 residual   - <a on*>/onload/onclick/onerror/onfocus stripped
                                   from ALL allowed elements incl. <a>, plus
                                   nested/descendant and entity-encoded variants;
                                   allowlist and safe links preserved.
   7. hostile imported rich      - hostile intro/card/kv rich HTML in DB rows
      HTML (render path)           renders fully sanitized through goCountry.
   8. plain-textarea fallback    - no CKEditor: textareas stay plain, readRichValue
      save path                    returns raw .value, saveCountryEditor sanitizes
                                   before persisting (verified via recorded run()).

   Self-contained: no network, no npm deps.  Run:  node tests/regression.js
   ===================================================================== */
'use strict';
const fs = require('fs');
const vm = require('vm');

const HTML = fs.readFileSync('geobas-portal.html', 'utf8');

/* ---------------- helpers ---------------- */
let passed = 0, failed = 0;
function ok(cond, label){
  if(cond){ passed++; console.log('  [PASS] ' + label); }
  else { failed++; console.log('  [FAIL] ' + label); }
}
function section(name){ console.log('\n== ' + name + ' =='); }

/* extract the last <script> block (the application code) */
function extractScript(html){
  const blocks = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(m => m[1]);
  return blocks[blocks.length - 1];
}

/* Faithful WHATWG text-serialization shim: escapes & < > NBSP, NOT quotes.
   Reproduces the exact pre-fix div.textContent -> innerHTML behavior. */
function makeTextDiv(){
  let txt = '';
  return {
    set textContent(v){ txt = (v == null ? '' : String(v)); },
    get innerHTML(){
      return txt
        .replace(/&/g, '&amp;')
        .replace(/\u00A0/g, '&nbsp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    }
  };
}

function makeEl(id){
  const el = {
    id, _html: '', _text: '', value: '',
    _handlers: {},
    classList: { add(){}, remove(){}, toggle(){} },
    style: {},
    addEventListener(type, fn){ (el._handlers[type] = el._handlers[type] || []).push(fn); },
    setAttribute(){}, getAttribute(){ return null; },
    querySelectorAll(){ return []; },
    querySelector(){ return makeEl(id + ':inner'); },
    appendChild(){}, removeChild(){}, remove(){}, click(){},
  };
  Object.defineProperty(el, 'innerHTML', {
    get(){ return el._html; },
    set(v){ el._html = String(v); }
  });
  Object.defineProperty(el, 'textContent', {
    get(){ return el._text; },
    set(v){ el._text = String(v == null ? '' : v); }
  });
  return el;
}

function makeLocalStorage(){
  const m = new Map();
  return {
    getItem(k){ return m.has(k) ? m.get(k) : null; },
    setItem(k, v){ m.set(k, String(v)); },
    removeItem(k){ m.delete(k); },
    clear(){ m.clear(); }
  };
}

/* =====================================================================
   Mini HTML parser / DOM shim so sanitizeRich can actually RUN in the
   harness (the old DOMParser stub returned an empty body, so the R1
   sanitizer was only ever statically inspected).  Faithful for the
   fragment shapes these tests feed it: tags with quoted/unquoted
   attributes, nested elements, void elements, comments, text, and the
   DOM surface sanitizeRich touches (nodeType/tagName/attributes/
   childNodes/parentNode/removeChild/insertBefore/firstChild/
   querySelectorAll/innerHTML serialization + Node type constants).
   ===================================================================== */
function makeMiniDOMParser(){
  const TEXT_NODE = 3, COMMENT_NODE = 8, ELEMENT_NODE = 1;
  const VOID_TAGS = new Set(['BR','IMG','HR','INPUT','META','LINK','SOURCE','WBR','AREA','BASE','COL','EMBED','PARAM','TRACK']);

  function decodeEntities(s){
    return String(s).replace(/&(#x[0-9a-fA-F]+|#[0-9]+|[a-zA-Z][a-zA-Z0-9]*);/g, (m, body) => {
      if(body[0] === '#'){
        const hex = body[1] === 'x' || body[1] === 'X';
        const code = parseInt(body.slice(hex ? 2 : 1), hex ? 16 : 10);
        if(!Number.isNaN(code)){ try{ return String.fromCodePoint(code); }catch(e){ return m; } }
        return m;
      }
      const named = { amp:'&', lt:'<', gt:'>', quot:'"', apos:"'", nbsp:'\u00A0' };
      return Object.prototype.hasOwnProperty.call(named, body) ? named[body] : m;
    });
  }

  class MiniText {
    constructor(data){ this.nodeType = TEXT_NODE; this.data = data; this.parentNode = null; }
    get textContent(){ return this.data; }
    remove(){ if(this.parentNode) this.parentNode.removeChild(this); }
  }
  class MiniComment {
    constructor(data){ this.nodeType = COMMENT_NODE; this.data = data; this.parentNode = null; }
    remove(){ if(this.parentNode) this.parentNode.removeChild(this); }
  }
  class MiniElement {
    constructor(tagName){
      this.nodeType = ELEMENT_NODE;
      this.tagName = tagName.toUpperCase();
      this.parentNode = null;
      this.childNodes = [];
      this.attributes = [];            // [{name, value}] lowercase names
    }
    getAttribute(name){
      const n = String(name).toLowerCase();
      const a = this.attributes.find(x => x.name === n);
      return a ? a.value : null;
    }
    setAttribute(name, value){
      const n = String(name).toLowerCase();
      const a = this.attributes.find(x => x.name === n);
      if(a) a.value = String(value);
      else this.attributes.push({ name: n, value: String(value) });
    }
    removeAttribute(name){
      const n = String(name).toLowerCase();
      this.attributes = this.attributes.filter(x => x.name !== n);
    }
    get firstChild(){ return this.childNodes[0] || null; }
    get children(){ return this.childNodes.filter(c => c.nodeType === ELEMENT_NODE); }
    get textContent(){ return this.childNodes.map(c => c.nodeType === ELEMENT_NODE ? c.textContent : c.data).join(''); }
    get innerHTML(){ return this.childNodes.map(serialize).join(''); }
    appendChild(ch){ ch.parentNode = this; this.childNodes.push(ch); return ch; }
    removeChild(ch){
      const i = this.childNodes.indexOf(ch);
      if(i !== -1){ this.childNodes.splice(i, 1); ch.parentNode = null; }
      return ch;
    }
    insertBefore(node, ref){
      if(node.parentNode) node.parentNode.removeChild(node);   // DOM semantics: move
      const i = ref ? this.childNodes.indexOf(ref) : this.childNodes.length;
      if(i === -1) this.appendChild(node);
      else { this.childNodes.splice(i, 0, node); node.parentNode = this; }
    }
    replaceChild(newNode, oldNode){
      const i = this.childNodes.indexOf(oldNode);
      if(i !== -1){ this.childNodes[i] = newNode; newNode.parentNode = this; }
      return oldNode;
    }
    remove(){ if(this.parentNode) this.parentNode.removeChild(this); }
    querySelectorAll(sel){
      const want = String(sel).toUpperCase();
      const out = [];
      (function walk(n){
        if(n.nodeType === ELEMENT_NODE){
          if(n.tagName === want) out.push(n);
          n.childNodes.forEach(walk);
        }
      })(this);
      return out;
    }
  }

  function escapeText(s){
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function escapeAttr(s){
    return String(s).replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }
  function serialize(node){
    if(node.nodeType === TEXT_NODE) return escapeText(node.data);
    if(node.nodeType === COMMENT_NODE) return '';
    const attrs = node.attributes.map(a => ` ${a.name}="${escapeAttr(a.value)}"`).join('');
    const tag = node.tagName;
    const name = tag.toLowerCase();        // browsers serialize lowercase tag names
    if(VOID_TAGS.has(tag)) return `<${name}${attrs}>`;
    return `<${name}${attrs}>${node.childNodes.map(serialize).join('')}</${name}>`;
  }

  function parseAttrs(str){
    const attrs = [];
    const re = /([^\s=\/>]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]*)))?/g;
    let m;
    while((m = re.exec(str))){
      let value = '';
      if(m[2] !== undefined) value = m[2];
      else if(m[3] !== undefined) value = m[3];
      else if(m[4] !== undefined) value = m[4];
      attrs.push({ name: m[1].toLowerCase(), value: decodeEntities(value) });
    }
    return attrs;
  }

  function pushText(stack, text){
    if(!text) return;
    const t = new MiniText(decodeEntities(text));
    stack[stack.length-1].appendChild(t);
  }

  function parseFragment(html){
    const body = new MiniElement('BODY');
    const stack = [body];
    let i = 0;
    const n = html.length;
    while(i < n){
      const lt = html.indexOf('<', i);
      if(lt === -1){ pushText(stack, html.slice(i)); break; }
      if(lt > i) pushText(stack, html.slice(i, lt));
      if(html.startsWith('<!--', lt)){
        const end = html.indexOf('-->', lt + 4);
        const endPos = end === -1 ? n : end + 3;
        stack[stack.length-1].appendChild(new MiniComment(html.slice(lt + 4, end === -1 ? n : end)));
        i = endPos; continue;
      }
      const close = /^<\/([a-zA-Z][a-zA-Z0-9]*)\s*>/.exec(html.slice(lt));
      if(close){
        const name = close[1].toUpperCase();
        for(let k = stack.length - 1; k > 0; k--){
          if(stack[k].tagName === name){ stack.length = k; break; }
        }
        i = lt + close[0].length; continue;
      }
      const open = /^<([a-zA-Z][a-zA-Z0-9]*)((?:[^>"']|"[^"]*"|'[^']*')*)>/.exec(html.slice(lt));
      if(open){
        const name = open[1].toUpperCase();
        let attrStr = open[2] || '';
        const selfClose = /\/\s*$/.test(attrStr);
        attrStr = attrStr.replace(/\/\s*$/, '');
        const el = new MiniElement(name);
        parseAttrs(attrStr).forEach(a => el.setAttribute(a.name, a.value));
        stack[stack.length-1].appendChild(el);
        if(!selfClose && !VOID_TAGS.has(name)) stack.push(el);
        i = lt + open[0].length; continue;
      }
      pushText(stack, html[lt]);   // stray '<' as literal text
      i = lt + 1;
    }
    return body;
  }

  return {
    Node: { TEXT_NODE, COMMENT_NODE, ELEMENT_NODE },
    createTextNode(t){ return new MiniText(String(t == null ? '' : t)); },
    DOMParser: class {
      parseFromString(html){
        const body = parseFragment(String(html == null ? '' : html));
        return { body, querySelectorAll(sel){ return body.querySelectorAll(sel); } };
      }
    }
  };
}
const MINIDOM = makeMiniDOMParser();

/* Fake sql.js: minimal surface the app touches (prepare/run/exec/export).
   rows: [[sqlSubstring, rowsToReturn], ...] consulted by prepare(). */
function makeFakeSqlJs(rows, opts){
  opts = opts || {};
  let nextId = 1;
  class FakeStmt {
    constructor(rows){ this.rows = rows; this.pos = 0; }
    bind(){ return this; }
    step(){ if(this.pos < this.rows.length){ this.pos++; return true; } return false; }
    getAsObject(){ return this.rows[this.pos - 1] || {}; }
    free(){}
  }
  class FakeDB {
    constructor(bytes){
      if(opts.throwOnBytes && bytes) throw new Error('malformed sqlite database');
      this.restored = !!bytes;
    }
    run(sql, params){ if(opts.recordRuns) opts.recordRuns.push({ sql, params: params || [] }); }
    exec(sql){ return [{ columns: ['id'], values: [[nextId++]] }]; }
    prepare(sql){
      if(/COUNT\(\*\) AS c/.test(sql)) return new FakeStmt([{ c: 0 }]);
      if(/COALESCE\(MAX\(sort_order\),-?[01]\) AS m/.test(sql)) return new FakeStmt([{ m: 0 }]);
      for(const [pat, r] of rows){ if(sql.includes(pat)) return new FakeStmt(r); }
      return new FakeStmt([]);
    }
    export(){ return new Uint8Array([1, 2, 3, 4, 5]); }
  }
  return { Database: FakeDB };
}

/* Evaluate the page script in a fresh vm context; returns the sandbox.
   opts.preexistingStorage: if set, pre-seed window.storage (compat test). */
function boot(rows, opts){
  opts = opts || {};
  const els = new Map();
  const winHandlers = {};
  const documentStub = {
    __elements: els,
    title: '',
    documentElement: { setAttribute(){} },
    body: { style: {}, appendChild(){}, removeChild(){} },
    createElement(){ return makeTextDiv(); },
    getElementById(id){
      if(!els.has(id)) els.set(id, makeEl(id));
      return els.get(id);
    },
    querySelector(){ return makeEl('query'); },
    querySelectorAll(){ return []; },
    addEventListener(){},
    createTextNode(t){ return MINIDOM.createTextNode(t); },
  };
  const sandbox = {
    window: {
      addEventListener(type, fn){ (winHandlers[type] = winHandlers[type] || []).push(fn); },
      scrollTo(){},
      location: { href: 'https://example.test/' },
    },
    __handlers: winHandlers,
    document: documentStub,
    localStorage: makeLocalStorage(),
    console,
    alert(msg){ sandbox.__alerts.push(String(msg)); },
    confirm(){ return true; },
    prompt(){ return null; },
    setTimeout(){ return 1; },   // do not schedule real timers
    clearTimeout(){},
    URL, atob, btoa,
    Node: MINIDOM.Node,
    DOMParser: MINIDOM.DOMParser,
    initSqlJs: async () => makeFakeSqlJs(rows, opts),
    __alerts: [],
  };
  if(opts.preexistingStorage) sandbox.window.storage = opts.preexistingStorage;
  vm.createContext(sandbox);
  const code = extractScript(HTML) + `
;globalThis.__exports = {
  escapeHtml, safeUrl, base64ToBytes, bytesToBase64,
  getDb: () => db, getSQLLib: () => SQLLib,
  persistDB, migrateDatabase, initDatabase,
  renderNgoList, renderOrgDirectory, renderLangSwitch,
  getNgos, getOrgDirectory, getLanguages, STORAGE_KEY,
  sanitizeRich, renderArticleCard, goCountry,
  openCountryEditor, saveCountryEditor, readRichValue, ckAvailable
};`;
  vm.runInContext(code, sandbox, { filename: 'geobas-portal.html<script>' });
  return sandbox;
}

function domReady(sandbox){
  const h = sandbox.__handlers.DOMContentLoaded;
  return h && h[0];
}

/* extract attribute name/value pairs from an HTML fragment (values may contain
   entities; escaped output never contains a raw quote inside a value) */
function extractAttrs(html){
  const out = [];
  const re = /([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*"([^"]*)"/g;
  let m;
  while((m = re.exec(html))) out.push({ name: m[1].toLowerCase(), value: m[2] });
  return out;
}

async function main(){
  /* =====================================================================
     0. Syntax check (node --check equivalent)
     ===================================================================== */
  section('0. syntax');
  try{
    new vm.Script(extractScript(HTML));
    ok(true, 'extracted script compiles clean');
  }catch(e){
    ok(false, 'extracted script compiles clean: ' + e.message);
  }

  /* =====================================================================
     1. Startup / persistence (Blocker 1: undefined window.storage)
     ===================================================================== */
  section('1. startup/persistence');
  const s = boot([]);
  ok(typeof s.window.storage === 'object' && typeof s.window.storage.get === 'function' && typeof s.window.storage.set === 'function',
     'window.storage fallback installed (get/set contract)');
  ok(await s.window.storage.get('missing-key') === null, 'storage.get(missing) -> null');
  await s.window.storage.set('k', 'aGk=', false);
  ok((await s.window.storage.get('k')).value === 'aGk=', 'storage.get/set round-trip via localStorage ({value} contract)');
  ok(s.localStorage.getItem('k') === 'aGk=', 'value landed in localStorage');

  const ex = s.__exports;
  const b64 = ex.bytesToBase64(new Uint8Array([0, 1, 2, 255]));
  const back = ex.base64ToBytes(b64);
  ok(back.length === 4 && back[0] === 0 && back[3] === 255, 'base64 <-> bytes round-trip');

  section('1b. full init handler (fresh boot)');
  const s2 = boot([]);
  const handler = domReady(s2);
  ok(typeof handler === 'function', 'DOMContentLoaded handler registered');
  try{
    await handler();
    ok(true, 'init handler completes without throwing (Blocker 1 fixed)');
  }catch(e){
    ok(false, 'init handler completes without throwing: ' + (e && e.stack || e));
  }
  const stored = s2.localStorage.getItem('geobas-db-v1');
  ok(!!stored, 'persistDB wrote seeded DB to localStorage during init');
  ok(s2.__exports.getDb() !== null, 'db initialized (non-null) after startup');
  ok(s2.document.getElementById('start-stats')._text !== '', 'start view rendered (start-stats populated)');
  ok(s2.__alerts.length === 0, 'no error alerts during startup');

  section('1c. restore path (stored DB bytes present)');
  const s3 = boot([]);
  s3.localStorage.setItem('geobas-db-v1', stored);
  try{
    await domReady(s3)();
    ok(true, 'init handler completes when a stored DB is restored');
  }catch(e){
    ok(false, 'init handler completes when a stored DB is restored: ' + (e && e.stack || e));
  }

  section('1d. persistence write path');
  const s4 = boot([]);
  await domReady(s4)();
  await s4.__exports.persistDB();
  ok(s4.localStorage.getItem('geobas-db-v1') === s4.__exports.bytesToBase64(new Uint8Array([1,2,3,4,5])),
     'persistDB exports db bytes to storage via window.storage.set');

  /* =====================================================================
     2. Imported SQLite trust
     ===================================================================== */
  section('2. imported SQLite trust');
  const s5 = boot([]);
  await domReady(s5)();
  const importHandler = s5.document.__elements.get('import-file')._handlers.change[0];
  ok(!!importHandler, 'import handler is registered');
  await importHandler({ target: { files: [{ arrayBuffer: async () => new Uint8Array([9, 8, 7]) }], value: 'x' } });
  ok(s5.__alerts.length === 1 && s5.__alerts[0].length > 0, 'valid import succeeds (importOk alert)');
  ok(!!s5.localStorage.getItem('geobas-db-v1'), 'imported DB persisted after import');

  const s6 = boot([], { throwOnBytes: true });
  await domReady(s6)();
  const origDB = s6.__exports.getDb();
  const importHandler6 = s6.document.__elements.get('import-file')._handlers.change[0];
  await importHandler6({ target: { files: [{ arrayBuffer: async () => new Uint8Array([1, 2, 3]) }], value: 'x' } });
  ok(s6.__alerts.length === 1 && s6.__alerts[0].length > 0, 'corrupt import handled gracefully (importFail alert)');
  ok(s6.__exports.getDb() === origDB, 'corrupt import leaves previous DB intact');

  /* =====================================================================
     3. Quote breakout / event-handler injection (Blocker 2)
     ===================================================================== */
  section('3. quote breakout / event-handler injection');
  const NAME_PAYLOAD = 'x" onfocus="alert(1)';
  const URL_PAYLOAD  = 'https://example.com" onmouseover="alert(1)';
  ok(ex.escapeHtml(NAME_PAYLOAD) === 'x&quot; onfocus=&quot;alert(1)', 'escapeHtml escapes double quotes (no raw ")');
  ok(ex.escapeHtml("a'b") === 'a&#39;b', 'escapeHtml escapes single quotes');
  ok(ex.escapeHtml('<img src=x onerror=alert(1)>') === '&lt;img src=x onerror=alert(1)&gt;', 'escapeHtml still escapes < >');
  ok(ex.escapeHtml('a & b') === 'a &amp; b', 'escapeHtml still escapes &');

  // render-level: hostile rows preloaded into the DB (as an imported DB could carry)
  const s7 = boot([
    ['FROM country_ngos', [{ id: 1, name: NAME_PAYLOAD, url: URL_PAYLOAD, note: 'n" onerror="alert(1)' }]],
    ['FROM org_directory', [{ id: 1, name: NAME_PAYLOAD, url: 'javascript:alert(1)', contact: 'c" onclick="alert(1)', description: 'd" onmouseover="alert(1)' }]],
    ['FROM languages', [{ code: 'sv" onmouseover="alert(1)', name: 'Svenska' }]],
  ]);
  await domReady(s7)();

  s7.__exports.renderNgoList(1);
  const ngoHtml = s7.document.__elements.get('ngo-list')._html;
  const ngoAttrs = extractAttrs(ngoHtml);
  ok(!ngoAttrs.some(a => /^on/i.test(a.name)), 'NGO render: no on* event-handler attributes (old Blocker-2 payload inert)');
  ok(ngoHtml.includes('&quot; onfocus=&quot;'), 'NGO render: payload name escaped with entities');
  ok(ngoAttrs.filter(a => a.name === 'href').every(a => a.value === '#'), 'NGO render: hostile URL neutralized to href="#"');

  s7.__exports.renderOrgDirectory();
  const orgHtml = s7.document.__elements.get('org-directory-list')._html;
  const orgAttrs = extractAttrs(orgHtml);
  ok(!orgAttrs.some(a => /^on/i.test(a.name)), 'Org-directory render: no on* event-handler attributes');
  ok(orgAttrs.filter(a => a.name === 'href').every(a => a.value === '#'), 'Org-directory render: javascript: URL neutralized to href="#"');
  ok(!/javascript:/i.test(orgHtml), 'Org-directory render: no javascript: scheme in output');

  s7.__exports.renderLangSwitch();
  const langHtml = s7.document.__elements.get('lang-switch')._html;
  const langAttrs = extractAttrs(langHtml);
  ok(!langAttrs.some(a => /^on/i.test(a.name)), 'Language switch: no on* attributes from hostile lang code');
  ok(langHtml.includes('&quot; onmouseover=&quot;'), 'Language switch: hostile lang code escaped in data-lang');

  /* =====================================================================
     4. javascript: URLs
     ===================================================================== */
  section('4. javascript: URLs (safeUrl + rich-text allowlist)');
  const su = ex.safeUrl;
  ok(su('javascript:alert(1)') === '#', 'javascript: blocked');
  ok(su('JaVaScRiPt:alert(1)') === '#', 'mixed-case javascript: blocked');
  ok(su(' javascript:alert(1)') === '#', 'leading-space javascript: blocked');
  ok(su('data:text/html,<script>alert(1)</script>') === '#', 'data: blocked');
  ok(su('vbscript:msgbox(1)') === '#', 'vbscript: blocked');
  ok(su('file:///etc/passwd') === '#', 'file: blocked');
  ok(su('https://example.com" onmouseover="alert(1)') === '#', 'quote breakout in https URL blocked');
  ok(su('http://ok.se') === 'http://ok.se/', 'plain http URL kept');
  ok(su('https://ok.se/a?b=1&c=2') === 'https://ok.se/a?b=1&c=2', 'https URL kept (normalized)');
  ok(su('mailto:info@example.org') === 'mailto:info@example.org', 'mailto kept');
  ok(su('mailto:') === '#', 'empty mailto rejected');
  ok(su('') === '', 'empty string -> empty href');
  ok(su(null) === '', 'null -> empty href');

  const scriptSrc = extractScript(HTML);
  ok(/u\.protocol === 'http:' \|\| u\.protocol === 'https:' \|\| u\.protocol === 'mailto:'/.test(scriptSrc),
     'sanitizeRich <a> hrefs protocol-allowlisted (http/https/mailto only)');
  ok(/new URL\(href, window\.location\.href\)/.test(scriptSrc), 'sanitizeRich parses hrefs with URL constructor');

  /* =====================================================================
     5. window.storage compatibility (host implementation preserved)
     ===================================================================== */
  section('5. window.storage compatibility (pre-existing implementation)');
  const customStorage = {
    calls: [],
    async get(k){ this.calls.push(['get', k]); return null; },
    async set(k, v, s){ this.calls.push(['set', k, v, s]); }
  };
  const s8 = boot([], { preexistingStorage: customStorage });
  ok(s8.window.storage === customStorage, 'pre-existing window.storage preserved (fallback not installed)');
  await s8.__exports.initDatabase();
  ok(customStorage.calls.some(c => c[0] === 'get' && c[1] === 'geobas-db-v1'),
     'init reads storage through the host implementation');
  ok(customStorage.calls.some(c => c[0] === 'set' && c[1] === 'geobas-db-v1' && c[3] === false),
     'persist writes through the host implementation with the set(key, value, syncFlag) contract');

  /* =====================================================================
     6. sanitizeRich — R1 residual: event-handler attributes on <a> and
        nested/encoded variants
     ===================================================================== */
  section('6. sanitizeRich: on* handler stripping on <a> (R1 residual)');
  const sr = s.__exports.sanitizeRich;
  const noOnAttrs = html => !extractAttrs(html).some(a => /^on/i.test(a.name));

  // <a on*> payloads on the allowed element itself
  ok(noOnAttrs(sr('<a href="https://ok.se" onclick="alert(1)">länk</a>')), 'onclick removed from <a>');
  ok(noOnAttrs(sr('<a href="https://ok.se" onload="x" onerror="y" onfocus="z">t</a>')), 'onload/onerror/onfocus removed from <a>');
  ok(sr('<a href="https://ok.se" onclick="alert(1)">länk</a>').includes('href="https://ok.se"'), 'safe href preserved on <a>');
  ok(sr('<a href="https://ok.se" onclick="alert(1)">länk</a>').includes('länk'), 'anchor text preserved');

  // case / unquoted / encoded variants
  ok(noOnAttrs(sr('<a href="https://ok.se" ONCLICK="x">t</a>')), 'uppercase ONCLICK removed (parser lowercases)');
  ok(noOnAttrs(sr('<a href="https://ok.se" onclick=alert(1)>t</a>')), 'unquoted onclick removed');
  ok(noOnAttrs(sr('<a href="https://ok.se" onclick="&#x61;lert(1)">t</a>')), 'entity-encoded onclick VALUE removed (name is still onclick)');
  ok(noOnAttrs(sr('<a href="https://ok.se" onclick="alert(&quot;1&quot;)">t</a>')), 'double-quote-encoded onclick value removed');

  // nested / descendant variants (allowed parents)
  ok(noOnAttrs(sr('<p><a href="https://ok.se" onclick="x">t</a></p>')), 'nested <a on*> inside <p> removed');
  ok(noOnAttrs(sr('<ul><li><a href="https://ok.se" onmouseover="x">t</a></li></ul>')), 'nested <a on*> inside <li> removed');
  ok(noOnAttrs(sr('<p>hej <a href="https://ok.se" onfocus="x">t</a> då</p>')), 'descendant <a on*> inside mixed text removed');

  // handlers on other allowed elements / hostile wrappers
  ok(noOnAttrs(sr('<p onclick="x">text</p>')), 'onclick removed from <p>');
  ok(noOnAttrs(sr('<strong onerror="x">fet</strong>')), 'onerror removed from <strong>');
  ok(noOnAttrs(sr('<div onclick="x"><a href="https://ok.se">t</a></div>')), 'handler on unwrapped <div> dropped with element');
  ok(noOnAttrs(sr('<svg onload="x"><a href="https://ok.se">t</a></svg>')), 'handler on unwrapped <svg> dropped, inner <a> kept');

  // javascript: / encoded scheme hrefs still blocked on <a>
  ok(!sr('<a href="javascript:alert(1)" onclick="x">t</a>').includes('href='), 'javascript: href dropped alongside onclick');
  ok(!sr('<a href="jav&#x61;script:alert(1)" onclick="x">t</a>').includes('href='), 'entity-encoded javascript: href dropped');

  // safe allowlist / safe links preserved
  ok(sr('<p>Hej <strong>världen</strong></p>') === '<p>Hej <strong>världen</strong></p>', 'plain allowlist content preserved');
  ok(sr('<a href="https://ok.se">länk</a>') === '<a href="https://ok.se">länk</a>', 'clean <a> preserved byte-for-byte');
  ok(sr('<a href="#sektion">gå</a>').includes('href="#sektion"'), 'fragment href preserved');
  ok(sr('<a href="/relativ">gå</a>').includes('href="/relativ"'), 'relative href preserved');
  ok(sr('<a href="mailto:info@example.org">mail</a>').includes('href="mailto:info@example.org"'), 'mailto href preserved');
  ok(sr('Hej <b>världen</b>') === 'Hej världen', 'unallowed <b> unwrapped, text kept');

  /* =====================================================================
     7. hostile imported rich HTML — render path (goCountry -> sanitizeRich
        on intro + card body + kv values)
     ===================================================================== */
  section('7. hostile imported rich HTML (render path)');
  const HOSTILE_INTRO = '<p>Välkommen <a href="https://ok.se" onclick="alert(1)">hit</a></p>';
  const HOSTILE_P1 = '<p><a href="https://ok.se" onfocus="x">punkt ett</a></p>';
  const HOSTILE_P2 = '<ul><li><a href="https://ok.se" onmouseover="y">punkt två</a></li></ul>';
  const HOSTILE_KV = '<a href="https://ok.se" onerror="z">värdet</a>';
  const s9 = boot([
    ['FROM country_i18n', [{ name: 'Testland', intro: HOSTILE_INTRO }]],
    ['FROM cards WHERE', [{ id: 7, title: 'Kort' }]],
    ['FROM card_body', [{ text: HOSTILE_P1 }, { text: HOSTILE_P2 }]],
    ['FROM card_kv', [{ k: 'Webb', v: HOSTILE_KV }]],
  ]);
  await domReady(s9)();
  s9.__exports.goCountry(7);
  const introHtml = s9.document.__elements.get('country-intro-static')._html;
  const gridHtml  = s9.document.__elements.get('topics-grid')._html;
  ok(noOnAttrs(introHtml), 'hostile imported intro renders with zero on* attributes');
  ok(introHtml.includes('href="https://ok.se"'), 'hostile imported intro keeps safe link');
  ok(noOnAttrs(gridHtml), 'hostile imported card body+kv renders with zero on* attributes');
  ok(gridHtml.includes('href="https://ok.se"'), 'hostile imported cards keep safe links');
  ok(!/javascript:/i.test(gridHtml) && !/javascript:/i.test(introHtml), 'no javascript: scheme in rendered rich HTML');

  /* =====================================================================
     8. plain-textarea fallback path — no CKEditor: textareas stay plain,
        readRichValue reads .value, saveCountryEditor sanitizes before persist
     ===================================================================== */
  section('8. plain-textarea fallback path (no CKEditor)');
  const runs8 = [];
  const s10 = boot([], { recordRuns: runs8 });
  await domReady(s10)();
  ok(s10.__exports.ckAvailable() === false, 'CKEditor unavailable -> fallback textareas active');

  // fallback: textarea has no _ck instance; readRichValue returns raw .value
  const HOSTILE_TA = '<a href="https://ok.se" onclick="alert(1)">text</a>';
  const taEl = { _ck: null, value: HOSTILE_TA, style: {} };
  s10.document.querySelector = () => taEl;   // plain textarea stub (fallback)
  ok(s10.__exports.readRichValue('em-intro') === HOSTILE_TA, 'fallback: readRichValue returns raw textarea .value (no _ck)');

  // editor path still honored when a CKEditor instance exists
  const ckTa = { _ck: { getData: () => '<p>editor-data</p>' }, value: HOSTILE_TA };
  s10.document.querySelector = () => ckTa;
  ok(s10.__exports.readRichValue('em-intro') === '<p>editor-data</p>', 'CKEditor path: readRichValue prefers getData()');

  // full fallback save: hostile textarea content is sanitized before persisting
  s10.document.querySelector = () => taEl;   // back to plain textarea
  s10.__exports.openCountryEditor(1);        // sets modalState; no CKEditor -> plain textareas
  runs8.length = 0;                          // drop schema/seed inserts from init
  await s10.__exports.saveCountryEditor();
  const introRun = runs8.find(r => r.sql.includes('INSERT INTO country_i18n'));
  const paraRuns = runs8.filter(r => r.sql.includes('INSERT INTO card_body'));
  ok(!!introRun, 'fallback save: country_i18n row written');
  ok(introRun && noOnAttrs(String(introRun.params[3] || '')), 'fallback save: hostile intro sanitized before persist');
  ok(introRun && String(introRun.params[3] || '').includes('href="https://ok.se"'), 'fallback save: safe link preserved in intro');
  ok(paraRuns.length === 1, 'fallback save: one card_body row written');
  ok(paraRuns.length === 1 && noOnAttrs(String(paraRuns[0].params[2] || '')), 'fallback save: hostile paragraph sanitized before persist');
  ok(paraRuns.length === 1 && String(paraRuns[0].params[2] || '').includes('href="https://ok.se"'), 'fallback save: safe link preserved in paragraph');

  /* ===================================================================== */
  console.log('\n========================================');
  console.log(`RESULT: ${passed} passed, ${failed} failed`);
  process.exit(failed ? 1 : 0);
}

main().catch(e => { console.error('harness error:', e); process.exit(2); });
