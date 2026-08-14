// Syntax-check the inline <script> block of geobas-portal.html.
import fs from 'node:fs';
const h = fs.readFileSync('geobas-portal.html', 'utf8');
const m = h.match(/<script>([\s\S]*?)<\/script>/);
if (!m) { console.error('inline script not found'); process.exit(1); }
fs.writeFileSync('/tmp/inline-check.js', m[1]);
console.log('inline script extracted:', m[1].length, 'bytes -> /tmp/inline-check.js');
