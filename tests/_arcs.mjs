// Full-resolution arc/limb detector: counts warm-orange pixels per cell
// (not just cell centers) so thin 1-2px arcs are visible.
import { decodePngFile } from './_pnglib.mjs';
const [, , fn, cols = 90, rows = 40] = process.argv;
const { width, height, data } = decodePngFile(fn);
const warmAt = (x, y) => {
  const i = (y * width + x) * 3;
  const r = data[i], g = data[i + 1], b = data[i + 2];
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  return (r - b > 55) && r > 150 && g > 100 && g < 240 && (mx - mn) > 55;
};
const litAt = (x, y) => {
  const i = (y * width + x) * 3;
  return 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2] > 30;
};
// warm density map
const CW = Math.floor(width / cols), CH = Math.floor(height / rows);
console.log(`=== ${fn} warm-density (thin-arc detectable) ===`);
for (let r = 0; r < rows; r++) {
  let line = '';
  for (let c = 0; c < cols; c++) {
    let warm = 0, lit = 0, n = 0;
    for (let y = r * CH; y < (r + 1) * CH && y < height; y++) {
      for (let x = c * CW; x < (c + 1) * CW && x < width; x++) { n++; if (warmAt(x, y)) warm++; if (litAt(x, y)) lit++; }
    }
    const fr = warm / n;
    if (fr > 0.28) line += '*';
    else if (fr > 0.12) line += 'x';
    else if (fr > 0.03) line += '+';
    else if (lit / n > 0.1) line += '±';
    else line += ' ';
  }
  console.log(line);
}
