// Shared pure-Node PNG decoder (8-bit RGB/RGBA, non-interlaced).
import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

export function decodePngFile(fn) {
  return decodePng(readFileSync(fn));
}

export function decodePng(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error('not png: ' + buf.length);
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
      if (data[10] !== 0 || data[12] !== 0) throw new Error('only deflate + non-interlace');
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
