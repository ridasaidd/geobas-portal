import fs from 'node:fs';
const html = fs.readFileSync('/workspace/geobas-portal.html', 'utf8');
const s = html.match(/<script>([\s\S]*?)<\/script>/)[1];
console.log('script bytes:', s.length);
const kws = ['innerHTML','outerHTML','insertAdjacentHTML','document.write','eval(','new Function','src="http','src="https','href="http','href="https','url(','@import','import('];
for (const kw of kws) {
  const re = new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
  console.log(kw, '=>', (s.match(re) || []).length);
}
// list http(s) references anywhere in the html
const refs = (html.match(/https?:\/\/[^\s"'<>]+/g) || []);
console.log('\nHttp(s) refs in whole html:', refs.length);
for (const r of refs) console.log('  ', r.slice(0,120));
