let out = {};
// network egress
try {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 8000);
  const r = await fetch('https://registry.npmjs.org/', { signal: ctl.signal });
  clearTimeout(t);
  out.egress = 'OK ' + r.status;
} catch (e) { out.egress = 'NO EGRESS: ' + e.message; }
// any browser libs
for (const m of ['playwright', 'puppeteer', 'jsdom', 'canvas']) {
  try { const x = await import(m); out['mod_' + m] = 'present'; }
  catch (e) { out['mod_' + m] = 'absent'; }
}
console.log(JSON.stringify(out, null, 2));
