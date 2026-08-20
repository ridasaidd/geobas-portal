import fs from 'node:fs';
const html = fs.readFileSync('/workspace/geobas-portal.html', 'utf8');
const lines = html.split('\n');
const s = html.match(/<script>([\s\S]*?)<\/script>/)[1];
fs.writeFileSync('/tmp/inline.js', s);
// find line numbers of innerHTML occurrences
console.log('=== innerHTML SITES ===');
lines.forEach((ln, i) => {
  if (ln.includes('innerHTML')) {
    console.log((i + 1) + ': ' + ln.trim().slice(0, 130));
  }
});
console.log('\ntotal innerHTML lines:', lines.filter(l => l.includes('innerHTML')).length);
