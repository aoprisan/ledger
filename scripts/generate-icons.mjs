// Generates the PWA icon set and favicon as committed binary/text assets.
// Run with: npm run gen:icons
import zlib from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(here, '..', 'public');
mkdirSync(publicDir, { recursive: true });

const BG = [0x0e, 0x0e, 0x14];
const RED = [0xb3, 0x12, 0x2b];
const LIGHT = [0xec, 0xed, 0xf2];

function createCanvas(size) {
  const buf = Buffer.alloc(size * size * 4);
  const set = (x, y, [r, g, b], a = 255) => {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= size || y >= size) return;
    const i = (y * size + x) * 4;
    buf[i] = r;
    buf[i + 1] = g;
    buf[i + 2] = b;
    buf[i + 3] = a;
  };
  const inRoundRect = (px, py, x, y, w, h, r) => {
    if (px < x || py < y || px >= x + w || py >= y + h) return false;
    const cx = Math.min(Math.max(px, x + r), x + w - r);
    const cy = Math.min(Math.max(py, y + r), y + h - r);
    return (px - cx) ** 2 + (py - cy) ** 2 <= r * r;
  };
  return {
    buf,
    fillAll: (color) => {
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) set(x, y, color);
    },
    fillRoundRect: (x, y, w, h, r, color) => {
      for (let py = Math.floor(y); py < y + h; py++) {
        for (let px = Math.floor(x); px < x + w; px++) {
          if (inRoundRect(px + 0.5, py + 0.5, x, y, w, h, r)) set(px, py, color);
        }
      }
    },
  };
}

function drawIcon(size, pad) {
  const c = createCanvas(size);
  c.fillAll(BG);

  const x0 = size * pad;
  const cw = size * (1 - pad * 2);
  const rh = cw * 0.2;
  const gap = cw * 0.12;
  const totalH = rh * 3 + gap * 2;
  const y0 = (size - totalH) / 2;
  const barX = x0 + rh + cw * 0.08;
  const barW = x0 + cw - barX;

  for (let i = 0; i < 3; i++) {
    const y = y0 + i * (rh + gap);
    c.fillRoundRect(x0, y, rh, rh, rh * 0.28, RED);
    const bh = rh * 0.62;
    const bw = i === 2 ? barW * 0.7 : barW;
    c.fillRoundRect(barX, y + (rh - bh) / 2, bw, bh, bh / 2, LIGHT);
  }
  return c.buf;
}

function encodePNG(size, rgba) {
  const channels = 4;
  const stride = size * channels;
  const raw = Buffer.alloc(size * (stride + 1));
  for (let y = 0; y < size; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idat = zlib.deflateSync(raw, { level: 9 });

  const chunk = (type, data) => {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crc = Buffer.alloc(4);
    crc.writeUInt32BE(zlib.crc32(Buffer.concat([typeBuf, data])) >>> 0, 0);
    return Buffer.concat([len, typeBuf, data, crc]);
  };

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function writePNG(name, size, pad) {
  writeFileSync(resolve(publicDir, name), encodePNG(size, drawIcon(size, pad)));
  console.log(`wrote public/${name} (${size}x${size})`);
}

writePNG('pwa-192x192.png', 192, 0.2);
writePNG('pwa-512x512.png', 512, 0.2);
writePNG('maskable-512x512.png', 512, 0.3);
writePNG('apple-touch-icon.png', 180, 0.16);

const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="Ledger">
  <rect width="64" height="64" rx="12" fill="#0e0e14"/>
  <g>
    <rect x="13" y="16" width="9" height="9" rx="2.5" fill="#b3122b"/>
    <rect x="27" y="18" width="24" height="5" rx="2.5" fill="#ecedf2"/>
    <rect x="13" y="29.5" width="9" height="9" rx="2.5" fill="#b3122b"/>
    <rect x="27" y="31.5" width="24" height="5" rx="2.5" fill="#ecedf2"/>
    <rect x="13" y="43" width="9" height="9" rx="2.5" fill="#b3122b"/>
    <rect x="27" y="45" width="17" height="5" rx="2.5" fill="#ecedf2"/>
  </g>
</svg>
`;
writeFileSync(resolve(publicDir, 'favicon.svg'), favicon);
console.log('wrote public/favicon.svg');
