// Medieval scene painter — shared helpers (2026-10-27).
// Plain Node ESM. Paints into a raw RGBA buffer, saves with sharp.
// No anti-aliasing anywhere: every pixel is one exact palette colour.
// Spec and palettes: app/styles/medieval/SCENES.md.
//
// Usage:
//   import * as P from './lib.mjs';
//   const c = P.create(400, 225, '#120c14');
//   ...
//   await P.save(c, 'public/medieval/scenes/home.png');
//   await P.preview('public/medieval/scenes/home.png', '<scratch>/home@2x.png', 2);

import sharp from 'sharp';
import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';

// ── colour ──────────────────────────────────────────────────────
const cache = new Map();
/** '#rrggbb' -> [r,g,b,255]. Arrays pass through. */
export function rgb(c) {
  if (Array.isArray(c)) return c.length === 4 ? c : [...c, 255];
  let v = cache.get(c);
  if (!v) {
    const h = c.replace('#', '');
    v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16), 255];
    cache.set(c, v);
  }
  return v;
}

// ── canvas ──────────────────────────────────────────────────────
export function create(w, h, bg = '#000000') {
  const c = { w, h, data: new Uint8Array(w * h * 4) };
  fillRect(c, 0, 0, w, h, bg);
  return c;
}

export function setPx(c, x, y, col) {
  x |= 0; y |= 0;
  if (x < 0 || y < 0 || x >= c.w || y >= c.h || col == null) return;
  const [r, g, b] = rgb(col);
  const i = (y * c.w + x) * 4;
  c.data[i] = r; c.data[i + 1] = g; c.data[i + 2] = b; c.data[i + 3] = 255;
}

export function getPx(c, x, y) {
  x |= 0; y |= 0;
  if (x < 0 || y < 0 || x >= c.w || y >= c.h) return null;
  const i = (y * c.w + x) * 4;
  return '#' + [0, 1, 2].map((k) => c.data[i + k].toString(16).padStart(2, '0')).join('');
}

export function fillRect(c, x, y, w, h, col) {
  for (let yy = Math.max(0, y | 0); yy < Math.min(c.h, (y + h) | 0); yy++)
    for (let xx = Math.max(0, x | 0); xx < Math.min(c.w, (x + w) | 0); xx++) setPx(c, xx, yy, col);
}

/** Bresenham line, 1px. */
export function line(c, x0, y0, x1, y1, col) {
  x0 |= 0; y0 |= 0; x1 |= 0; y1 |= 0;
  const dx = Math.abs(x1 - x0), sx = x0 < x1 ? 1 : -1;
  const dy = -Math.abs(y1 - y0), sy = y0 < y1 ? 1 : -1;
  let err = dx + dy;
  for (;;) {
    setPx(c, x0, y0, col);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 >= dy) { err += dy; x0 += sx; }
    if (e2 <= dx) { err += dx; y0 += sy; }
  }
}

/** Filled ellipse (hard edge). fn(x,y) may return a colour per pixel. */
export function ellipse(c, cx, cy, rx, ry, col) {
  for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
    for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
      const dx = (x - cx) / (rx + 0.5), dy = (y - cy) / (ry + 0.5);
      if (dx * dx + dy * dy <= 1) setPx(c, x, y, typeof col === 'function' ? col(x, y) : col);
    }
}
export const circle = (c, cx, cy, r, col) => ellipse(c, cx, cy, r, r, col);

/** Scanline polygon fill. pts = [[x,y],...]. */
export function polygon(c, pts, col) {
  const ys = pts.map((p) => p[1]);
  const y0 = Math.max(0, Math.floor(Math.min(...ys))), y1 = Math.min(c.h - 1, Math.ceil(Math.max(...ys)));
  for (let y = y0; y <= y1; y++) {
    const sy = y + 0.5, xs = [];
    for (let i = 0; i < pts.length; i++) {
      const [ax, ay] = pts[i], [bx, by] = pts[(i + 1) % pts.length];
      if ((ay <= sy && by > sy) || (by <= sy && ay > sy)) xs.push(ax + ((sy - ay) / (by - ay)) * (bx - ax));
    }
    xs.sort((a, b) => a - b);
    for (let k = 0; k + 1 < xs.length; k += 2)
      for (let x = Math.round(xs[k]); x < Math.round(xs[k + 1]); x++)
        setPx(c, x, y, typeof col === 'function' ? col(x, y) : col);
  }
}

// ── dithering ───────────────────────────────────────────────────
const BAYER4 = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];
/** Bayer threshold in (0,1) for a pixel. */
export const bayer = (x, y) => (BAYER4[y & 3][x & 3] + 0.5) / 16;
/** Pick colour a or b: t=0 all a, t=1 all b, ordered pattern between. */
export const dither = (x, y, a, b, t) => (t > bayer(x, y) ? b : a);

/**
 * Vertical banded gradient over [y0,y1) through a colour list.
 * Each band is flat; only a short strip at each band boundary is dithered
 * (`soft` px tall), which reads as proper pixel-art sky banding.
 */
export function skyBands(c, y0, y1, colors, soft = 4, x0 = 0, x1 = c.w) {
  const n = colors.length, bandH = (y1 - y0) / n;
  for (let y = y0; y < y1; y++) {
    const f = (y - y0) / bandH, i = Math.min(n - 1, Math.floor(f));
    const into = (f - i) * bandH; // px into band
    for (let x = x0; x < x1; x++) {
      let col = colors[i];
      if (i + 1 < n && into > bandH - soft) col = dither(x, y, colors[i], colors[i + 1], (into - (bandH - soft)) / soft);
      setPx(c, x, y, col);
    }
  }
}

/** Dithered rect: mix toward `col` by t (0..1) over what is there via Bayer. */
export function ditherRect(c, x, y, w, h, col, t) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (t > bayer(xx, yy)) setPx(c, xx, yy, col);
}

// ── randomness ──────────────────────────────────────────────────
/** Seeded PRNG (mulberry32). r() -> [0,1). r.int(a,b), r.pick(arr), r.range(a,b). */
export function rng(seed = 1) {
  let s = seed >>> 0;
  const r = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  r.range = (a, b) => a + r() * (b - a);
  r.int = (a, b) => Math.floor(r.range(a, b + 1));
  r.pick = (arr) => arr[Math.floor(r() * arr.length)];
  r.chance = (p) => r() < p;
  return r;
}

/** Smooth 2D value noise in [0,1), seeded. Use scale ~0.05-0.2. */
export function noise2(seed = 1) {
  const h = (x, y) => {
    let n = (x * 374761393 + y * 668265263 + seed * 1442695041) | 0;
    n = Math.imul(n ^ (n >>> 13), 1274126177);
    return ((n ^ (n >>> 16)) >>> 0) / 4294967296;
  };
  const sm = (t) => t * t * (3 - 2 * t);
  return (x, y) => {
    const xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
    const a = h(xi, yi), b = h(xi + 1, yi), cc = h(xi, yi + 1), d = h(xi + 1, yi + 1);
    return a + (b - a) * xf + (cc - a) * yf + (a - b - cc + d) * xf * yf;
  };
}

// ── nature ──────────────────────────────────────────────────────
/**
 * Deciduous canopy: many small round leaf clumps packed into an ellipse,
 * each clump shaded by its position relative to the light.
 * tones = [shadow, dark, mid, light, highlight] (dark -> bright).
 * light = [lx, ly] unit-ish direction the light comes FROM (e.g. [-0.6,-0.8]).
 * Returns nothing; draw the trunk first.
 */
export function canopy(c, r, { cx, cy, rx, ry, tones, light = [-0.6, -0.8], clumps, clump = [3, 5], speckle = 0.3 }) {
  const n = clumps ?? Math.round((rx * ry) / 9);
  const [lx, ly] = light, ll = Math.hypot(lx, ly) || 1;
  const list = [];
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r());
    list.push([cx + Math.cos(a) * d * rx, cy + Math.sin(a) * d * ry, r.int(clump[0], clump[1])]);
  }
  list.sort((p, q) => p[1] - q[1]); // back (top) to front (bottom)
  ellipse(c, cx, cy, rx * 0.8, ry * 0.8, tones[0]); // solid core so no sky holes
  const T = tones.length;
  // Each clump gets ONE base tone from its place in the canopy (lit side
  // brighter); inside the clump only a lit cap (+1) and a shadow rim (-1).
  // That gives the clustered, readable leaf masses of the references.
  const baseIdx = (x, y) => {
    const gx = (x - cx) / rx, gy = (y - cy) / ry;
    const s = -(gx * lx + gy * ly) / ll * 0.5 + 0.5 + (r() - 0.5) * 0.25;
    return Math.max(0, Math.min(T - 2, Math.floor(s * (T - 1))));
  };
  for (const [x0, y0, rad] of list) {
    const b = baseIdx(x0, y0);
    ellipse(c, x0, y0, rad, rad * 0.85, (x, y) => {
      const ux = (x - x0) / rad, uy = (y - y0) / rad;
      const facing = -(ux * lx + uy * ly) / ll; // >0 toward the light
      if (facing > 0.45 && Math.hypot(ux, uy) > 0.25) return tones[Math.min(T - 1, b + 1)];
      if (facing < -0.55) return tones[Math.max(0, b - 1)];
      return tones[b];
    });
  }
  // loose leaves on the rim so the edge is ragged, not a blob
  const rim = Math.round((rx + ry) * 2 * speckle);
  for (let i = 0; i < rim; i++) {
    const a = r() * Math.PI * 2;
    const x = cx + Math.cos(a) * (rx + r.int(1, 2)), y = cy + Math.sin(a) * (ry + r.int(1, 2));
    const col = tones[baseIdx(x, y)];
    setPx(c, x, y, col);
    if (r.chance(0.4)) setPx(c, x + 1, y, col);
  }
}

/** Trunk with a couple of branches. col = [dark, light]. */
export function trunk(c, r, { x, baseY, h, w = 3, col }) {
  fillRect(c, x - (w >> 1), baseY - h, w, h, col[0]);
  for (let y = baseY - h; y < baseY; y++) if (r.chance(0.5)) setPx(c, x - (w >> 1), y, col[1]);
  const b = r.int(1, 3);
  for (let i = 0; i < b; i++) {
    const y = baseY - r.int(Math.floor(h * 0.5), h), dir = r.chance(0.5) ? 1 : -1, len = r.int(3, 7);
    line(c, x, y, x + dir * len, y - len + 1, col[0]);
  }
  setPx(c, x - (w >> 1) - 1, baseY - 1, col[0]); setPx(c, x + (w >> 1) + 1, baseY - 1, col[0]); // roots
}

/** Conifer silhouette: stacked jagged triangles. */
export function pine(c, r, { x, baseY, h, w, col, edge }) {
  const tiers = Math.max(3, Math.round(h / 5));
  for (let t = 0; t < tiers; t++) {
    const top = baseY - h + (t * h) / tiers * 0.85, bot = top + h / tiers * 1.6;
    const half = (w / 2) * ((t + 1) / tiers);
    polygon(c, [[x, top], [x + half + r.int(0, 1), bot], [x - half - r.int(0, 1), bot]], col);
    if (edge) for (let y = Math.floor(top); y < bot; y += 2) setPx(c, x + Math.round(((y - top) / (bot - top)) * half), y, edge);
  }
  fillRect(c, x, baseY - 2, 1, 2, col);
}

/** Rolling hill / ridge silhouette from y-baseline with value-noise top edge. */
export function ridge(c, { y, amp, freq = 0.03, seed = 1, col, x0 = 0, x1 = c.w, bottom = c.h, edge }) {
  const n = noise2(seed);
  for (let x = x0; x < x1; x++) {
    const top = Math.round(y - n(x * freq, 0.5) * amp);
    for (let yy = top; yy < bottom; yy++) setPx(c, x, yy, col);
    if (edge) setPx(c, x, top, edge);
  }
}

/** Star field in [0,yMax). colors: [dim, mid, bright]. Bright ones get a 1px cross. */
export function stars(c, r, { count = 40, yMax = 90, colors }) {
  for (let i = 0; i < count; i++) {
    const x = r.int(0, c.w - 1), y = r.int(0, yMax - 1), k = r();
    if (k > 0.93) { setPx(c, x, y, colors[2]); for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) setPx(c, x + dx, y + dy, colors[1]); }
    else setPx(c, x, y, k > 0.6 ? colors[1] : colors[0]);
  }
}

/** Horizontal fog band: dithered toward fogCol, densest in the middle. */
export function fog(c, { y0, y1, col, max = 0.5, x0 = 0, x1 = c.w }) {
  const mid = (y0 + y1) / 2, half = (y1 - y0) / 2;
  for (let y = y0; y < y1; y++) {
    const t = max * (1 - Math.abs(y - mid) / half);
    for (let x = x0; x < x1; x++) if (t > bayer(x, y)) setPx(c, x, y, col);
  }
}

/**
 * Glow disc (sun, lamp halo, window bloom): stepped concentric rings,
 * innermost first in `rings` = [core, ring1, ring2, ...], each ring `step` px
 * wider; the outermost ring is dithered at strength `outer`.
 */
export function glow(c, { cx, cy, r: r0, rings, step = 3, outer = 0.5, squash = 1 }) {
  for (let i = rings.length - 1; i >= 0; i--) {
    const rad = r0 + i * step;
    const last = i === rings.length - 1;
    ellipse(c, cx, cy, rad, rad * squash, (x, y) => {
      if (last && !(outer > bayer(x, y))) return getPx(c, x, y);
      return rings[i];
    });
  }
}

/** Rays from a point, dithered sparse lines (sunset shafts). */
export function rays(c, { cx, cy, angles, len, col, density = 0.35, width = 2 }) {
  for (const a of angles) {
    const dx = Math.cos(a), dy = Math.sin(a);
    for (let d = 0; d < len; d++)
      for (let w = -width; w <= width; w++) {
        const x = Math.round(cx + dx * d - dy * w), y = Math.round(cy + dy * d + dx * w);
        if (density * (1 - d / len) > bayer(x, y)) setPx(c, x, y, col);
      }
  }
}

/** Chimney smoke: drifting puffs, colours [dense, thin]. */
export function smoke(c, r, { x, y, h = 30, drift = 0.25, col }) {
  for (let i = 0; i < h; i += 3) {
    const px = x + Math.sin(i * 0.25) * 3 + i * drift, py = y - i, rad = 1 + i / 10;
    ellipse(c, px, py, rad, rad * 0.8, (xx, yy) => ((i / h) > bayer(xx, yy) ? getPx(c, xx, yy) : i < h / 2 ? col[0] : col[1]));
  }
}

/** Falling leaves / fireflies: single pixels (or 2px) scattered in a box. */
export function scatter(c, r, { x0 = 0, y0 = 0, x1 = c.w, y1 = c.h, count, colors, big = 0.2 }) {
  for (let i = 0; i < count; i++) {
    const x = r.int(x0, x1 - 1), y = r.int(y0, y1 - 1), col = r.pick(colors);
    setPx(c, x, y, col);
    if (r.chance(big)) setPx(c, x + 1, y, col);
  }
}

// ── buildings ───────────────────────────────────────────────────
/**
 * Cottage / town house. (x, baseY) = bottom-left. Draw back-to-front.
 * pal: { wall, wallDark, frame, roof, roofDark, roofHi, win, winGlow, winFrame, door, chimney }
 * opts: timber (bool), lit (0..1 chance per window), floors, gable ('front'|'side'),
 *       chimney ('left'|'right'|null), bloom (bool: 1px glow ring on lit windows).
 * Returns { chimneyTop: [x,y] | null, windows: [[x,y,w,h,lit],...] }.
 */
export function house(c, r, { x, baseY, w, h, roofH, pal, timber = false, lit = 0.6, floors = 1, gable = 'side', chimney = 'right', bloom = true, door = true }) {
  const top = baseY - h;
  // walls
  fillRect(c, x, top, w, h, pal.wall);
  fillRect(c, x + w - Math.max(2, w >> 3), top, Math.max(2, w >> 3), h, pal.wallDark); // shaded side
  fillRect(c, x, top, w, 1, pal.wallDark); // eave shadow
  if (timber) {
    for (const xx of [x, x + w - 1, x + (w >> 1)]) fillRect(c, xx, top, 1, h, pal.frame);
    for (let f = 1; f <= floors; f++) fillRect(c, x, top + Math.round((h * f) / (floors + 1)), w, 1, pal.frame);
    line(c, x, top + (h >> 1), x + (w >> 2), top, pal.frame);
    line(c, x + w - 1, top + (h >> 1), x + w - 1 - (w >> 2), top, pal.frame);
  }
  // roof
  let chimneyTop = null;
  const ov = 2;
  if (gable === 'front') {
    const peak = [x + w / 2, top - roofH];
    polygon(c, [[x - ov, top + 1], peak, [x + w + ov, top + 1]], pal.roof);
    for (let y = top - roofH + 3; y < top; y += 3) { // shingle rows
      const k = (y - (top - roofH)) / roofH, hw = (w / 2 + ov) * k;
      for (let xx = Math.round(peak[0] - hw); xx < peak[0] + hw; xx++) if (((xx + y) & 3) !== 0) setPx(c, xx, y, pal.roofDark);
    }
    line(c, x - ov, top, peak[0], peak[1], pal.roofHi);
    if (pal.win) { // attic window
      const ax = Math.round(x + w / 2 - 1), ay = top - Math.round(roofH / 2.4);
      fillRect(c, ax, ay, 3, 3, r.chance(lit) ? pal.win : pal.winFrame);
    }
  } else {
    polygon(c, [[x - ov, top + 1], [x + 3, top - roofH], [x + w - 3, top - roofH], [x + w + ov, top + 1]], pal.roof);
    for (let y = top - roofH + 2; y < top; y += 3) for (let xx = x - ov; xx < x + w + ov; xx++) if (((xx + (y >> 1)) & 3) === 0 || y === top - 1) setPx(c, xx, y, pal.roofDark);
    fillRect(c, x + 3, top - roofH, w - 6, 1, pal.roofHi);
  }
  if (chimney) {
    const cx = chimney === 'left' ? x + 4 : x + w - 8, ch = Math.max(5, roofH * 0.6) | 0;
    fillRect(c, cx, top - roofH - 2, 4, ch, pal.chimney ?? pal.wallDark);
    fillRect(c, cx - 1, top - roofH - 3, 6, 1, pal.roofDark);
    chimneyTop = [cx + 2, top - roofH - 4];
  }
  // windows
  const windows = [];
  const ww = w >= 30 ? 4 : 3, wh = 4;
  const cols = Math.max(1, Math.floor((w - 4) / (ww + 5)));
  for (let f = 0; f < floors; f++) {
    const wy = top + 3 + Math.round(((h - 4) * f) / floors);
    for (let k = 0; k < cols; k++) {
      const wx = Math.round(x + 3 + ((w - 6 - ww) * (cols === 1 ? 0.5 : k / (cols - 1))));
      if (door && f === floors - 1 && Math.abs(wx + ww / 2 - (x + w / 2)) < ww + 1 && cols > 1) continue;
      const on = r.chance(lit);
      if (on && bloom && pal.winGlow) fillRect(c, wx - 1, wy - 1, ww + 2, wh + 2, pal.winGlow);
      fillRect(c, wx, wy, ww, wh, on ? pal.win : pal.winFrame);
      if (on && ww >= 4) fillRect(c, wx + (ww >> 1), wy, 1, wh, pal.winFrame); // single mullion
      windows.push([wx, wy, ww, wh, on]);
    }
  }
  if (door) {
    const dx = Math.round(x + w / 2 - 2);
    fillRect(c, dx, baseY - 6, 4, 6, pal.door ?? pal.frame);
    setPx(c, dx + 3, baseY - 3, pal.win);
  }
  return { chimneyTop, windows };
}

/** Church / tower: tall body + steep spire (+ optional lit belfry). */
export function tower(c, { x, baseY, w, h, spireH, pal, cross = true }) {
  fillRect(c, x, baseY - h, w, h, pal.wall);
  fillRect(c, x + w - 2, baseY - h, 2, h, pal.wallDark);
  polygon(c, [[x - 1, baseY - h + 1], [x + w / 2, baseY - h - spireH], [x + w + 1, baseY - h + 1]], pal.roof);
  fillRect(c, Math.round(x + w / 2 - 1), baseY - h + 3, 2, 4, pal.win);
  if (cross) {
    const cx = Math.round(x + w / 2), cy = baseY - h - spireH;
    fillRect(c, cx, cy - 5, 1, 5, pal.roofDark); fillRect(c, cx - 1, cy - 4, 3, 1, pal.roofDark);
  }
}

/**
 * Winding stone path: flat irregular slabs along a polyline.
 * pts = [[x,y],...] far -> near; width grows from w0 to w1 (perspective).
 * col = { stone, stoneHi, stoneDark, gap }.
 */
export function stonePath(c, r, { pts, w0 = 4, w1 = 26, col }) {
  // sample the polyline
  const samples = [];
  for (let i = 0; i + 1 < pts.length; i++) {
    const [ax, ay] = pts[i], [bx, by] = pts[i + 1], L = Math.hypot(bx - ax, by - ay);
    for (let s = 0; s < L; s += 1) samples.push([ax + ((bx - ax) * s) / L, ay + ((by - ay) * s) / L]);
  }
  const N = samples.length;
  // path bed (gap colour), then slabs on top
  for (let i = 0; i < N; i++) {
    const [x, y] = samples[i], wd = w0 + ((w1 - w0) * i) / N;
    fillRect(c, Math.round(x - wd / 2), Math.round(y), Math.round(wd), 1, col.gap);
  }
  for (let i = 0; i < N; ) {
    const t = i / N, wd = w0 + (w1 - w0) * t, slabH = Math.max(2, Math.round(1 + t * 5));
    const [x, y] = samples[i];
    const per = wd > 10 ? 2 : 1;
    for (let k = 0; k < per; k++) {
      const sw = wd / per - 1, sx = x - wd / 2 + k * (wd / per) + sw / 2 + r.range(-1, 1);
      ellipse(c, sx, y + slabH / 2, sw / 2, slabH / 2, (xx, yy) => (yy < y + 1 ? col.stoneHi : yy > y + slabH - 1 ? col.stoneDark : col.stone));
    }
    i += Math.max(2, Math.round(slabH * 1.6));
  }
}

/** Water strip with reflection streaks of the given light colours. */
export function water(c, r, { y0, y1, x0 = 0, x1 = c.w, base, ripple, reflect = [] }) {
  fillRect(c, x0, y0, x1 - x0, y1 - y0, base);
  for (let y = y0 + 1; y < y1; y += 2) for (let x = x0; x < x1; x++) if (r.chance(0.08)) fillRect(c, x, y, r.int(2, 5), 1, ripple);
  for (const [rx, col, wdt = 3] of reflect) for (let y = y0 + 1; y < y1; y += 2) if (r.chance(0.7)) fillRect(c, rx - r.int(0, wdt), y, r.int(1, wdt * 2), 1, col);
}

// ── output ──────────────────────────────────────────────────────
/** Number of distinct colours (spec: <= 32). */
export function countColors(c) {
  const s = new Set();
  for (let i = 0; i < c.data.length; i += 4) s.add((c.data[i] << 16) | (c.data[i + 1] << 8) | c.data[i + 2]);
  return s.size;
}

/** Write the canvas as PNG at art resolution. Logs the colour count. */
export async function save(c, outPath) {
  mkdirSync(dirname(outPath), { recursive: true });
  await sharp(Buffer.from(c.data), { raw: { width: c.w, height: c.h, channels: 4 } })
    .removeAlpha()
    .png({ compressionLevel: 9, palette: countColors(c) <= 256 })
    .toFile(outPath);
  const n = countColors(c);
  console.log(`${outPath}  ${c.w}x${c.h}  ${n} colours${n > 32 ? '  (OVER 32 - reduce palette)' : ''}`);
  return outPath;
}

/** Nearest-neighbour upscale of a saved PNG for viewing (Read tool). */
export async function preview(pngPath, outPath, scale = 2) {
  mkdirSync(dirname(outPath), { recursive: true });
  const m = await sharp(pngPath).metadata();
  await sharp(pngPath).resize(m.width * scale, m.height * scale, { kernel: 'nearest' }).png().toFile(outPath);
  return outPath;
}
