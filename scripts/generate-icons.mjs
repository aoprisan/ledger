// Generates the PWA icon set and favicon as committed binary/text assets.
// Run with: npm run gen:icons
import zlib from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const here = dirname(fileURLToPath(import.meta.url));
const publicDir = resolve(here, '..', 'public');
mkdirSync(publicDir, { recursive: true });

const BG = [0x06, 0x06, 0x08];
const BLOOD = [0x9a, 0x06, 0x12];
const BONE = [0xe9, 0xe6, 0xdd];

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
  // Stamp a filled disc — the brush used to paint thick strokes.
  const disc = (cx, cy, r, color) => {
    for (let dy = -Math.ceil(r); dy <= Math.ceil(r); dy++) {
      for (let dx = -Math.ceil(r); dx <= Math.ceil(r); dx++) {
        if (dx * dx + dy * dy <= r * r) set(cx + dx, cy + dy, color);
      }
    }
  };
  return {
    buf,
    fillAll: (color) => {
      for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) set(x, y, color);
    },
    strokeLine: (x0, y0, x1, y1, thick, color) => {
      const r = thick / 2;
      const steps = Math.ceil(Math.hypot(x1 - x0, y1 - y0));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        disc(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, r, color);
      }
    },
    strokeCircle: (cx, cy, radius, thick, color) => {
      const r = thick / 2;
      const steps = Math.ceil(2 * Math.PI * radius);
      for (let i = 0; i <= steps; i++) {
        const a = (i / steps) * 2 * Math.PI;
        disc(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius, r, color);
      }
    },
  };
}

// An inverted pentagram (single point down) ringed by a circle — the sigil.
function drawIcon(size, pad) {
  const c = createCanvas(size);
  c.fillAll(BG);

  const cx = size / 2;
  const cy = size / 2;
  const radius = size * (0.5 - pad);
  const verts = [];
  for (let k = 0; k < 5; k++) {
    const a = Math.PI / 2 + (k * 2 * Math.PI) / 5; // start at bottom, point down
    verts.push([cx + Math.cos(a) * radius, cy + Math.sin(a) * radius]);
  }

  c.strokeCircle(cx, cy, radius, size * 0.03, BLOOD);

  // Draw the star in one continuous pass: 0 → 2 → 4 → 1 → 3 → 0.
  const order = [0, 2, 4, 1, 3, 0];
  const t = size * 0.035;
  for (let i = 0; i < order.length - 1; i++) {
    const [x0, y0] = verts[order[i]];
    const [x1, y1] = verts[order[i + 1]];
    c.strokeLine(x0, y0, x1, y1, t, BONE);
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
  <rect width="64" height="64" rx="10" fill="#060608"/>
  <circle cx="32" cy="32" r="25" fill="none" stroke="#9a0612" stroke-width="2.4"/>
  <path d="M32 57 L17.31 11.77 L55.78 39.73 L8.22 39.73 L46.69 11.77 Z"
    fill="none" stroke="#e9e6dd" stroke-width="2.6" stroke-linejoin="round"/>
</svg>
`;
writeFileSync(resolve(publicDir, 'favicon.svg'), favicon);
console.log('wrote public/favicon.svg');
