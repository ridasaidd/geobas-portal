// FOA visual-gate grammar analyzer. Usage:
//   node _analyze_grammar.mjs <png> [kind]
// kind: 'globe' (limb + warm/arc map) | 'frame' (dark/gold/cream grammar)
import { decodePngFile } from './_pnglib.mjs';

const [, , fn, kind = 'frame'] = process.argv;
const { width, height, data } = decodePngFile(fn);
const N = width * height;
const px = (x, y) => (data[(y * width + x) * 3], data[(y * width + x) * 3 + 1], data[(y * width + x) * 3 + 2]);
const lum = (x, y) => { const i = (y * width + x) * 3; return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2]; };

if (kind === 'globe') {
  // --- disc mask + centroid ---
  let sx = 0, sy = 0, cnt = 0;
  const mask = new Uint8Array(N);
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    if (lum(x, y) > 30) { mask[y * width + x] = 1; sx += x; sy += y; cnt++; }
  }
  const cx = sx / cnt, cy = sy / cnt;
  // max radius = 95th percentile distance of masked px
  const ds = [];
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (mask[y * width + x]) ds.push(Math.hypot(x - cx, y - cy));
  ds.sort((a, b) => a - b);
  const R = ds[Math.floor(ds.length * 0.97)];
  // mean brightness: ring-in (edge), interior, outside
  const avg = (pred) => { let s = 0, n = 0; for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) { if (pred(x, y)) { s += lum(x, y); n++; } } return n ? s / n : -1; };
  const ringIn = avg((x, y) => { const r = Math.hypot(x - cx, y - cy); return r >= R - 4 && r <= R; });
  const interior = avg((x, y) => { const r = Math.hypot(x - cx, y - cy); return r >= R * 0.3 && r <= R - 6; });
  const outside = avg((x, y) => { const r = Math.hypot(x - cx, y - cy); return r >= R + 2 && r <= R + 6; });
  console.log(`=== ${fn} limb test ===`);
  console.log(`disc center=(${cx.toFixed(0)},${cy.toFixed(0)}) R=${R.toFixed(0)}  edge-ring lum=${ringIn.toFixed(1)} interior lum=${interior.toFixed(1)} outside lum=${outside.toFixed(1)}`);
  console.log(`limb present (edge >= interior+3 AND edge > outside): ${(ringIn >= interior + 3 && ringIn > outside) ? 'YES' : (ringIn > interior ? 'WEAK/partial' : 'NO (flat edge)')}`);

  // --- strong-warm map (sun + arcs) ---
  const cols = 68, rows = 34;
  const map = [];
  let warmCount = 0;
  for (let r = 0; r < rows; r++) {
    let line = '';
    for (let c = 0; c < cols; c++) {
      // sample center of cell
      const x = Math.floor((c + 0.5) * width / cols), y = Math.floor((r + 0.5) * height / rows);
      const i = (y * width + x) * 3;
      const Rr = data[i], G = data[i + 1], B = data[i + 2];
      const mx = Math.max(Rr, G, B), mn = Math.min(Rr, G, B);
      const warm = (Rr - B > 70) && Rr > 150 && G > 90 && G < 240 && (mx - mn) > 70;
      if (warm) { warmCount++; line += mx > 200 ? '*' : 'x'; } else line += mask[y * width + x] && lum(x, y) < 60 ? '.' : (mask[y * width + x] ? '±' : ' ');
    }
    map.push(line);
  }
  console.log(`\nstrong-warm map (warm px=${warmCount}, ~${(warmCount / N * 100).toFixed(1)}% of frame):  [*=bright warm, x=dim warm, .=dark disc, ±=lit disc]`);
  console.log(map.join('\n'));
} else {
  // --- frame grammar: dark / gold / cream / accent zones ---
  let dark = 0, gold = 0, cream = 0, bright = 0;
  let gx = 0, gy = 0, gn = 0, cminx = 1e9, cminy = 1e9, cmaxx = 0, cmaxy = 0;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 3;
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const L = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (L < 30) dark++;
    // gold: warm gold ~ (244,183,110) with tolerance, moderate-high value
    if (r > 180 && g > 110 && g < 230 && b > 50 && b < 170 && r - b > 60 && L > 120) { gold++; gx += x; gy += y; gn++; }
    // cream: bright, warm-leaning, low-mid saturation high value
    if (L > 200 && r >= g && g >= b && (r - b) < 60 && (r - b) > 6) { cream++; cminx = Math.min(cminx, x); cminy = Math.min(cminy, y); cmaxx = Math.max(cmaxx, x); cmaxy = Math.max(cmaxy, y); }
    if (L > 210) bright++;
  }
  const pct = (n) => (n / N * 100).toFixed(2) + '%';
  console.log(`=== ${fn} grammar ===`);
  console.log(`dark(<30) ${pct(dark)}  gold ${pct(gold)} (px=${gold})  cream ${pct(cream)} (px=${cream})  bright(>210) ${pct(bright)}`);
  if (gn > 0) { console.log(`gold centroid=(${(gx / gn / width * 100).toFixed(0)}%W, ${(gy / gn / height * 100).toFixed(0)}%H)`); }
  if (cream > 0) { console.log(`cream bbox: x ${(cminx / width * 100).toFixed(0)}-${(cmaxx / width * 100).toFixed(0)}%W, y ${(cminy / height * 100).toFixed(0)}-${(cmaxy / height * 100).toFixed(0)}%H`); }
  // top-hero band brightness (row 0-30%): is there an image hero?
  let hs = 0, hn = 0;
  for (let y = 0; y < height * 0.18; y++) for (let x = 0; x < width; x++) { hs += lum(x, y); hn++; }
  console.log(`top-18% hero band mean lum=${(hs / hn).toFixed(1)}`);
}
