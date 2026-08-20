// FOA visual-gate independent analyzer (pure Node, no deps).
// Decodes a PNG (8-bit RGB/RGBA, non-interlaced) and emits:
//  (a) coarse ASCII structural map, (b) quantitative color-class stats.
// Usage: node _analyze_visual.mjs <file.png> [cols] [rows]
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not png');
  let off = 8, width = 0, height = 0, bitDepth = 0, colorType = 0;
  const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off);
    const type = buf.toString('ascii', off + 4, off + 8);
    const data = buf.subarray(off + 8, off + 8 + len);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0);
      height = data.readUInt32BE(4);
      bitDepth = data[8];
      colorType = data[9];
    } else if (type === 'IDAT') {
      idat.push(data);
    }
    off += 12 + len;
  }
  if (bitDepth !== 8) throw new Error(`bitDepth ${bitDepth} unsupported`);
  const bpp = colorType === 6 ? 4 : colorType === 2 ? 3 : colorType === 0 ? 1 : colorType === 4 ? 2 : -1;
  if (bpp < 0) throw new Error(`colorType ${colorType} unsupported`);
  const raw = inflateSync(Buffer.concat(idat));
  const stride = width * bpp;
  const img = new Uint8Array(width * height * 3);
  const prev = new Uint8Array(stride);
  let p = 0;
  for (let y = 0; y < height; y++) {
    const f = raw[p++];
    const line = raw.subarray(p, p + stride);
    const cur = new Uint8Array(stride);
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0;
      const b = prev[x];
      const c = x >= bpp ? prev[x - bpp] : 0;
      let v;
      switch (f) {
        case 0: v = line[x]; break;
        case 1: v = (line[x] + a) & 255; break;
        case 2: v = (line[x] + b) & 255; break;
        case 3: v = (line[x] + ((a + b) >> 1)) & 255; break;
        case 4: {
          const pp = a + b - c;
          const pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c);
          const pr = (pa <= pb && pa <= pc) ? a : (pb <= pc ? b : c);
          v = (line[x] + pr) & 255; break;
        }
        default: throw new Error(`filter ${f}`);
      }
      cur[x] = v;
    }
    for (let x = 0; x < stride; x++) {
      img[y * stride + x] = cur[x];
      prev[x] = cur[x];
    }
    p += stride;
  }
  return { width, height, bpp, data: img };
}

function classify(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  const lum = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  const sat = mx - mn;
  // warm sun / gold: high red, red clearly above blue, moderate-high value
  if (r > 170 && r - b > 55 && g > 90 && lum > 140) return 'W'; // warm (sun/gold)
  if (lum > 205 && sat < 60) return 'L'; // bright neutral (limb/highlights)
  if (b > 70 && b >= r && b >= g && sat > 25 && lum < 210) return 'B'; // blue water
  if (sat > 30 && g > r * 0.72 && (g > b || r > b) && lum > 60 && lum < 215) return 'G'; // land/green/tan
  if (lum < 34) return ' '; // near-black
  if (lum < 90) return '.'; // dark/grey
  return 'o'; // mid neutral
}

function run(fn, cols, rows) {
  const { width, height, data } = decodePng(readFileSync(fn));
  const stats = { W: 0, L: 0, B: 0, G: 0, o: 0, '.': 0, ' ': 0 };
  const cellW = width / cols, cellH = height / rows;
  const grid = [];
  for (let cy = 0; cy < rows; cy++) {
    const row = [];
    for (let cx = 0; cx < cols; cx++) {
      const x0 = Math.floor(cx * cellW), x1 = Math.max(x0 + 1, Math.floor((cx + 1) * cellW));
      const y0 = Math.floor(cy * cellH), y1 = Math.max(y0 + 1, Math.floor((cy + 1) * cellH));
      let sr = 0, sg = 0, sb = 0, n = 0;
      for (let y = y0; y < y1 && y < height; y += 1) {
        for (let x = x0; x < x1 && x < width; x += 1) {
          const i = (y * width + x) * 3;
          sr += data[i]; sg += data[i + 1]; sb += data[i + 2]; n++;
        }
      }
      const r = sr / n, g = sg / n, b = sb / n;
      const c = classify(r, g, b);
      stats[c]++;
      row.push(c);
    }
    grid.push(row.join(''));
  }
  const total = cols * rows;
  console.log(`\n=== ${fn}  (${width}x${height}) ===`);
  console.log(grid.join('\n'));
  const pct = (k) => ((stats[k] / total) * 100).toFixed(1) + '%';
  console.log(`\n[stats] warm/sun W:${pct('W')}  bright L:${pct('L')}  water B:${pct('B')}  land G:${pct('G')}  mid o:${pct('o')}  dark .:${pct('.')}  black ' ':${pct(' ')}`);
}

run(process.argv[2], parseInt(process.argv[3] || '100', 10), parseInt(process.argv[4] || '45', 10));
