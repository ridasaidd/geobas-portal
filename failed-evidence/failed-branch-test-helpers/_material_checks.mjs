import fs from 'node:fs';
const html = fs.readFileSync('/workspace/geobas-portal.html', 'utf8');
const lines = html.split('\n');
const checks = [];
function c(name, cond, detail) { checks.push([name, !!cond, detail || '']); }

// 1. banner image references in the inline script (country hero wiring)
const s = html.match(/<script>([\s\S]*?)<\/script>/)[1];
c('somalia banner asset referenced locally', /country-somalia\.jpg/.test(s));
c('ecuador banner asset referenced locally', /country-ecuador\.jpg/.test(s));
c('no http banner src in script', !/country-(somalia|ecuador)\.(jpg|png).*https?/.test(s));
c('hero credit element present', /country-hero-credit|hero-credit/.test(s));
c('dossier hero flag uses local assets/flags', /assets\/flags\//.test(s));

// 2. reduce-motion CSS media query
const mq = html.match(/@media\s*\(prefers-reduced-motion:\s*reduce\)[\s\S]*?}/);
c('prefers-reduced-motion media query present (css)', !!mq);

// 3. light theme present
c('data-theme light theme defined', html.includes('data-theme="light"') || /\[data-theme="light"\]/.test(html));

// 4. assert local files exist
for (const f of [
  'assets/img/countries/country-somalia.jpg',
  'assets/img/countries/country-ecuador.jpg',
  'assets/img/earth-night.jpg',
  'assets/img/earth-day.jpg',
  'assets/img/earth-topology.png',
  'assets/data/countries-110m.json',
  'assets/js/globe.gl.min.js',
  'assets/js/topojson-client.min.js',
  'assets/js/sql-wasm.js',
  'assets/js/sql-wasm.wasm',
  'assets/flags/SO.svg',
  'assets/flags/EC.svg',
]) {
  c('file exists: ' + f, fs.existsSync('/workspace/' + f));
}

// 5. report the CDN refs found
const cdnRefs = [];
for (let i = 0; i < lines.length; i++) {
  const ln = lines[i];
  if (/https?:\/\/(cdn\.|fonts\.googleapis|fonts\.gstatic|unpkg|jsdelivr|cdn\.ckeditor)/.test(ln)) {
    cdnRefs.push((i + 1) + ': ' + ln.trim().slice(0, 110));
  }
}
console.log('=== REQUIRED CHECKS ===');
for (const [n, ok, d] of checks) console.log((ok ? 'PASS' : 'FAIL') + '  ' + n + (d ? '  [' + d + ']' : ''));
console.log('\n=== CDN / hotlinked refs in HTML ===');
cdnRefs.forEach(r => console.log(r));
