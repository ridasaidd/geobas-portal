// Build script: inline all locally owned assets into a single portable HTML.
// Reads geobas-portal.html, replaces every local 'assets/' reference with
// inline data: URIs / JS content, writes geobas-portal.html and
// geobas-portal-single.html (identical). Preserves the CKEditor CDN script.
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..'); // worktree root
const SRC = path.join(ROOT, 'geobas-portal.html');
let h = fs.readFileSync(SRC, 'utf8');

const b64file = (p) => fs.readFileSync(path.join(ROOT, p)).toString('base64');

// ---------------------------------------------------------------- 1. fonts --
{
  const fontFiles = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const full = path.join(d, e.name);
      if (e.isDirectory()) walk(full);
      else if (e.name.endsWith('.woff2')) fontFiles.push(full.slice(ROOT.length + 1));
    }
  };
  walk(path.join(ROOT, 'assets', 'fonts'));
  fontFiles.sort();
  if (fontFiles.length !== 15) throw new Error('expected 15 font files, got ' + fontFiles.length);
  for (const rel of fontFiles) {
    const uri = 'data:font/woff2;base64,' + b64file(rel);
    const escRel = rel.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
    const out = new RegExp("url\\('" + escRel + "'\\).*?format\\('woff2'\\)");
    if (!out.test(h)) throw new Error('font pattern not found for ' + rel);
    h = h.replace(out, "url('" + uri + "') format('woff2')");
  }
  console.log('fonts: inlined', fontFiles.length);
}

// ------------------------------------------------------- JS payloads --------
const wasmB64 = b64file('assets/js/sql-wasm.wasm');
const sqlWasmJs = fs.readFileSync(path.join(ROOT, 'assets/js/sql-wasm.js'), 'utf8');
const globeJs = fs.readFileSync(path.join(ROOT, 'assets/js/globe.gl.min.js'), 'utf8');
const topojsonJs = fs.readFileSync(path.join(ROOT, 'assets/js/topojson-client.min.js'), 'utf8');

// Remove external <script src="assets/js/sql-wasm.js"></script> from head.
{
  const re = /<script src="assets\/js\/sql-wasm\.js"><\/script>\r?\n/;
  if (!re.test(h)) throw new Error('external sql-wasm.js script tag not found');
  h = h.replace(re, '');
  console.log('removed external sql-wasm.js tag');
}

// Remove external globe/topojson tags (they precede the globe init block).
{
  const re = /<script src="assets\/js\/globe\.gl\.min\.js"><\/script>\r?\n<script src="assets\/js\/topojson-client\.min\.js"><\/script>\r?\n/;
  if (!re.test(h)) throw new Error('external globe/topojson script tags not found');
  h = h.replace(re, '');
  console.log('removed external globe/topojson tags');
}

// APP script edits.
{
  if (!/const SQLJS_CDN = 'assets\/js\/';/.test(h)) throw new Error('SQLJS_CDN not found');
  // Define an inline wasm data URI + change locateFile so initSqlJs resolves
  // the .wasm from a data: URI (no filesystem / network fetch).
  const wasmUriLine = "const SQLJS_WASM_DATA_URI = 'data:application/wasm;base64," + wasmB64 + "';";
  h = h.replace("const SQLJS_CDN = 'assets/js/';",
    "const SQLJS_CDN = 'assets/js/';\n" + wasmUriLine);
  const oldLocate = /SQLLib = await initSqlJs\(\{ locateFile: f => SQLJS_CDN \+ f \}\);/;
  if (!oldLocate.test(h)) throw new Error('locateFile line not found');
  h = h.replace(oldLocate,
    "SQLLib = await initSqlJs({ locateFile: () => SQLJS_WASM_DATA_URI });");
  console.log('app script: wasm data URI injected and locateFile patched');
}

// ------------------------------------------------------- 3. data JSON ------
{
  const json = fs.readFileSync(path.join(ROOT, 'assets/data/countries-110m.json'), 'utf8');
  const uri = 'data:application/json;base64,' + Buffer.from(json, 'utf8').toString('base64');
  const re = /fetch\('assets\/data\/countries-110m\.json'\)/;
  if (!re.test(h)) throw new Error('countries fetch not found');
  h = h.replace(re, "fetch('" + uri + "')");
  console.log('data json inlined');
}

// ------------------------------------------------------- 4. images ---------
{
  const night = 'data:image/jpeg;base64,' + b64file('assets/img/earth-night.jpg');
  const bump = 'data:image/png;base64,' + b64file('assets/img/earth-topology.png');
  const re1 = /\.globeImageUrl\('assets\/img\/earth-night\.jpg'\)/;
  if (!re1.test(h)) throw new Error('earth-night not found');
  h = h.replace(re1, ".globeImageUrl('" + night + "')");
  const re2 = /\.bumpImageUrl\('assets\/img\/earth-topology\.png'\)/;
  if (!re2.test(h)) throw new Error('earth-topology not found');
  h = h.replace(re2, ".bumpImageUrl('" + bump + "')");
  console.log('images inlined');
}

// ------------------------------------------------------- 5. flags ----------
{
  const flagDir = path.join(ROOT, 'assets', 'flags');
  const files = fs.readdirSync(flagDir).filter((f) => f.endsWith('.svg')).sort();
  if (files.length !== 43) throw new Error('expected 43 flag files, got ' + files.length);
  const map = {};
  for (const f of files) map[f.slice(0, -4)] = b64file('assets/flags/' + f);
  // Inline a FLAG_DATA object mapping ISO -> base64 svg bytes into the globe
  // init block, and change the dynamic flag.src assignment.
  const srcRe = /flag\.src = 'assets\/flags\/' \+ iso \+ '\.svg';/;
  if (!srcRe.test(h)) throw new Error('flag.src line not found');
  h = h.replace(srcRe, "flag.src = (FLAG_DATA[iso] ? 'data:image/svg+xml;base64,' + FLAG_DATA[iso] : '');");
  // Insert FLAG_DATA after FLAG_MAP block.
  const flagMapEndRe = /('Irak': 'IQ'\s*\}\s*;)/;
  if (!flagMapEndRe.test(h)) throw new Error('FLAG_MAP end not found');
  h = h.replace(flagMapEndRe, "$1\n  var FLAG_DATA = " + JSON.stringify(map) + ";");
  console.log('flags inlined', files.length);
}

// ------------------------------------------------------- 6. logos ----------
{
  const fav = 'data:image/svg+xml;base64,' + b64file('assets/logo/favicon.svg');
  const relFav = /<link rel="icon" type="image\/svg\+xml" href="assets\/logo\/favicon\.svg">/;
  if (!relFav.test(h)) throw new Error('favicon link not found');
  h = h.replace(relFav, '<link rel="icon" type="image/svg+xml" href="' + fav + '">');

  for (const rel of ['assets/logo/primary-northstar.svg', 'assets/logo/badge-northstar.svg', 'assets/logo/northstar-mono.svg']) {
    const uri = 'data:image/svg+xml;base64,' + b64file(rel);
    const re = new RegExp('src="' + rel.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&') + '"');
    if (!re.test(h)) throw new Error('logo img not found: ' + rel);
    h = h.replace(re, 'src="' + uri + '"');
    console.log('logo inlined', rel);
  }
  console.log('favicon inlined');
}

// ------------ library payloads as inline <script> AFTER the app script -------
{
  const esc = (s) => s.replace(/<\/script/gi, '<\\/script');
  const anchor = "</script>\n";
  // The app script block is the FIRST inline <script>; close it, then append
  // the library blocks right after, before the globe-presentation script.
  // We anchor on the DOMContentLoaded tail unique to the app script.
  const appTail = "  goHome();\n});\n</script>";
  const idx = h.indexOf(appTail);
  if (idx < 0) throw new Error('app script tail anchor not found');
  const libs =
    '<script>' + esc(sqlWasmJs) + '</script>\n' +
    '<script>' + esc(globeJs) + '</script>\n' +
    '<script>' + esc(topojsonJs) + '</script>\n';
  h = h.slice(0, idx + appTail.length) + "\n" + libs + h.slice(idx + appTail.length);
  console.log('library scripts inserted after app script block');
}

// ------------------------------------------------------------ validation ----
{
  const m = h.match(/<script>([\s\S]*?)<\/script>/);
  const firstInline = m ? m[1] : '';
  if (!/SEED_REGIONS/.test(firstInline) || /initSqlJs = function/.test(firstInline)) {
    throw new Error('sanity: first inline block is NOT the app script:\n' + firstInline.slice(0, 80));
  }
  console.log('first inline block = app script (OK): starts', JSON.stringify(firstInline.slice(0, 40)));
}

fs.writeFileSync(path.join(ROOT, 'geobas-portal.html'), h);
fs.writeFileSync(path.join(ROOT, 'geobas-portal-single.html'), h);
console.log('WROTE', path.join(ROOT, 'geobas-portal.html'), Buffer.byteLength(h, 'utf8'), 'bytes');
console.log('WROTE', path.join(ROOT, 'geobas-portal-single.html'));

{
  const m = h.match(/<script>([\s\S]*?)<\/script>/);
  console.log('app inline script length:', m ? m[1].length : 'NONE');
}