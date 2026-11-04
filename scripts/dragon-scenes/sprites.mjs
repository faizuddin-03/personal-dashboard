// Dragons style sprites (2026-10-29): Toothless (black Night Fury, green eyes,
// red tail fin) and Light Fury (white, blue eyes, no back spines), flying side
// view facing right. Original pixel art drawn from shapes here, no film assets.
// Each sheet is 2 frames of 64x32 (wings up, wings down) side by side.
// Run from repo root: node scripts/dragon-scenes/sprites.mjs
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

const FW = 64, FH = 32;

const PALETTES = {
  toothless: { body: '#16181f', shade: '#0b0c10', hi: '#2e3444', wing: '#1c1f28', wingFar: '#0e1015', eye: '#7cff6a', pupil: '#0b0c10', fin: '#c0392b', spine: '#0b0c10' },
  lightfury: { body: '#e9eef6', shade: '#b9c6d8', hi: '#ffffff', wing: '#d6e0ee', wingFar: '#a9b8cc', eye: '#4aa8ff', pupil: '#16305a', fin: '#d6e0ee', spine: null },
};

const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];

function frame(pal, wingsUp) {
  const g = Array.from({ length: FH }, () => Array(FW).fill(null));
  const put = (x, y, col) => { if (col && x >= 0 && y >= 0 && x < FW && y < FH) g[y][x] = col; };
  const ellipse = (cx, cy, rx, ry, col, fn) => {
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      const dx = (x + 0.5 - cx) / rx, dy = (y + 0.5 - cy) / ry;
      if (dx * dx + dy * dy <= 1) put(x, y, fn ? fn(x, y) : col);
    }
  };
  const inPoly = (px, py, pts) => {
    let inside = false;
    for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
      const [xi, yi] = pts[i], [xj, yj] = pts[j];
      if ((yi > py) !== (yj > py) && px < (xj - xi) * (py - yi) / (yj - yi) + xi) inside = !inside;
    }
    return inside;
  };
  const poly = (pts, col) => { for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) if (inPoly(x + 0.5, y + 0.5, pts)) put(x, y, col); };
  const line = (x0, y0, x1, y1, col, w = 1) => {
    const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0));
    for (let i = 0; i <= n; i++) {
      const x = Math.round(x0 + (x1 - x0) * i / n), y = Math.round(y0 + (y1 - y0) * i / n);
      for (let k = 0; k < w; k++) put(x, y + k, col);
    }
  };

  // far wing (behind the body): big, like a Night Fury's
  if (wingsUp) poly([[30, 13], [37, 0], [47, 1], [41, 13]], pal.wingFar);
  else poly([[31, 18], [38, 30], [47, 27], [41, 18]], pal.wingFar);

  // tail, thinning toward the fins
  line(5, 16, 22, 16, pal.body, 2);
  // tail fins: upper one red on Toothless (his prosthetic), lower one body colour
  poly([[0, 9], [8, 14], [8, 17], [2, 17]], pal.fin);
  poly([[2, 17], [8, 17], [8, 19], [0, 25]], pal.body);
  // the small second pair of fins halfway down the tail
  poly([[12, 12], [17, 16], [12, 16]], pal.shade);
  poly([[12, 18], [17, 18], [12, 21]], pal.shade);

  // body: highlight on top, shaded belly
  ellipse(31, 16.5, 10.5, 5, null, (x, y) => (y <= 13 ? pal.hi : y >= 19 ? pal.shade : pal.body));
  // legs tucked under while flying
  for (const lx of [25, 36]) { put(lx, 21, pal.shade); put(lx + 1, 21, pal.shade); put(lx + 1, 22, pal.shade); put(lx + 2, 22, pal.shade); }

  // neck + head + snout (Night Fury: broad, rounded head)
  ellipse(42, 15, 4.5, 3.8, pal.body);
  ellipse(47, 13.5, 5.5, 4.3, null, (x, y) => (y <= 10 ? pal.hi : pal.body));
  ellipse(52.5, 14.5, 4, 3, pal.body);
  put(55, 16, pal.shade); put(54, 16, pal.shade); put(53, 16, pal.shade); // mouth line
  // ear flaps swept back (two broad flaps, not antennae)
  poly([[43, 12], [37, 6], [40, 6], [46, 10]], pal.body);
  poly([[46, 10], [43, 4], [46, 5], [49, 10]], pal.shade);
  // big round eye
  put(50, 12, pal.eye); put(51, 12, pal.eye); put(50, 13, pal.eye); put(51, 13, pal.pupil);

  // back spines (Toothless only)
  if (pal.spine) for (let sx = 23; sx <= 39; sx += 4) { put(sx, 11, pal.spine); put(sx + 1, 11, pal.spine); }

  // near wing (in front): wide bat-like membrane, scalloped edge, finger bones
  if (wingsUp) {
    poly([[24, 14], [15, 4], [17, 1], [23, 2], [28, 0], [34, 2], [39, 0], [44, 4], [41, 14]], pal.wing);
    line(26, 13, 17, 2, pal.shade); line(30, 13, 28, 1, pal.shade); line(34, 13, 39, 1, pal.shade);
  } else {
    poly([[24, 18], [16, 28], [21, 31], [27, 29], [33, 31], [39, 29], [44, 27], [41, 18]], pal.wing);
    line(26, 19, 17, 28, pal.shade); line(30, 19, 28, 30, pal.shade); line(34, 19, 41, 28, pal.shade);
  }
  return g;
}

async function sheet(name) {
  const pal = PALETTES[name];
  const frames = [frame(pal, true), frame(pal, false)];
  const W = FW * frames.length, buf = Buffer.alloc(W * FH * 4);
  frames.forEach((g, f) => {
    for (let y = 0; y < FH; y++) for (let x = 0; x < FW; x++) {
      const col = g[y][x];
      if (!col) continue;
      const i = (y * W + f * FW + x) * 4, [r, gg, b] = hex(col);
      buf[i] = r; buf[i + 1] = gg; buf[i + 2] = b; buf[i + 3] = 255;
    }
  });
  mkdirSync('public/dragons', { recursive: true });
  const out = `public/dragons/${name}.png`;
  await sharp(buf, { raw: { width: W, height: FH, channels: 4 } }).png().toFile(out);
  mkdirSync('data/agents/tmp/scenes', { recursive: true });
  await sharp(buf, { raw: { width: W, height: FH, channels: 4 } })
    .resize(W * 6, FH * 6, { kernel: 'nearest' })
    .flatten({ background: '#13203c' })
    .png().toFile(`data/agents/tmp/scenes/${name}@6x.png`);
  console.log(out);
}

await sheet('toothless');
await sheet('lightfury');
