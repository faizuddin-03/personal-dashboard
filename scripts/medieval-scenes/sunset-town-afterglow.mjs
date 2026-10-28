// Scene c: sunset-town-afterglow (R4 ref-sunset-town.png) — Jira pages and tickets.
// Spec: app/styles/medieval/SCENES.md §3c. Run from repo root:
//   node scripts/medieval-scenes/sunset-town-afterglow.mjs [previewDir]
import * as P from './lib.mjs';

const W = 400, H = 225;
const OUT = 'public/medieval/scenes/sunset-town-afterglow.png';
const PREV = (process.argv[2] ?? 'data/agents/tmp/scenes') + '/sunset-town-afterglow@3x.png';

// ── palette (SCENES.md §3c only) ──
const SKY = ['#0c0a1c', '#16102a', '#221636', '#331c40', '#4a2246', '#6a2c4a', '#93394c'];
const GLOW = ['#ffe08a', '#f8b060', '#e8804e', '#c2564c']; // core -> outer
const RIDGE = ['#5a2a4a', '#43203f', '#2f1834']; // far -> near
const TOWN = ['#1e1230', '#2a1838', '#3a2244']; // roof/dark, shade, lit wall
const RIM = '#e8804e', WIN = '#f8b060';
const FG = ['#03081a', '#081026', '#120e24'];
const LEAF = ['#7a2a24', '#b8462a'];

const SUN = { x: 214, y: 149 };
const r = P.rng(4242);
const c = P.create(W, H, SKY[0]);

// ── 1. sky: banded; deep top bands taller so the top 40% stays dark ──
const stops = [0, 34, 62, 86, 104, 118, 130, 152];
for (let i = 0; i < SKY.length; i++) {
  const y0 = stops[i], y1 = stops[i + 1], soft = 4;
  for (let y = y0; y < y1; y++)
    for (let x = 0; x < W; x++) {
      let col = SKY[i];
      if (i + 1 < SKY.length && y >= y1 - soft) col = P.dither(x, y, SKY[i], SKY[i + 1], (y - (y1 - soft) + 1) / (soft + 1));
      P.setPx(c, x, y, col);
    }
}
// warm the lower sky in a wide arc around the sun (rows ~110-152 only)
for (let y = 104; y < 153; y++)
  for (let x = 0; x < W; x++) {
    const d = Math.hypot((x - SUN.x) / 160, (y - SUN.y) / 36);
    if (d >= 1) continue;
    const t = 1 - d, idx = Math.min(6, Math.floor(4 + t * 3.2));
    const cur = SKY.indexOf(P.getPx(c, x, y));
    if (cur >= 0 && idx > cur) P.setPx(c, x, y, P.dither(x, y, SKY[cur], SKY[idx], Math.min(1, t * 2.2)));
  }

// stair-stepped pixel clouds (R4 slabs), dark bodies, lit lower lip
function cloud(cx, cy, w, h, body, lip) {
  const n = P.noise2(cx * 7 + cy);
  for (let x = cx - w; x < cx + w; x++) {
    const k = 1 - Math.abs(x - cx) / w;
    const top = Math.round(cy - h * k * (0.6 + n(x * 0.12, 1) * 0.6));
    const bot = Math.round(cy + 1 + n(x * 0.2, 3) * 2 * k);
    const t2 = top - (top & 1), b2 = bot - (bot & 1);
    for (let y = t2; y <= b2; y++) P.setPx(c, x, y, body);
    if (lip && k > 0.15) P.setPx(c, x, b2 + 1, lip);
  }
}
cloud(70, 44, 46, 5, SKY[2], SKY[3]);
cloud(330, 30, 52, 4, SKY[2], SKY[3]);
cloud(250, 72, 40, 4, SKY[3], SKY[4]);
cloud(110, 96, 54, 4, SKY[4], SKY[5]);
cloud(330, 104, 44, 5, SKY[4], SKY[5]);
cloud(40, 120, 34, 3, SKY[5], SKY[6]);

// a few dim stars, top only
for (let i = 0; i < 18; i++) {
  const x = r.int(0, W - 1), y = r.int(2, 46), cur = P.getPx(c, x, y);
  if (cur === SKY[0] || cur === SKY[1]) P.setPx(c, x, y, i % 6 === 0 ? SKY[5] : SKY[4]);
}

// ── 2. sun: soft shafts, stepped halo, inner ember shafts, crisp disc ──
// shafts = wedges that lift the sky one band step (flat, fading at the tip)
function shaft(a, spread, len) {
  for (let y = 92; y < SUN.y; y++)
    for (let x = 0; x < W; x++) {
      const dx = x - SUN.x, dy = y - SUN.y, d = Math.hypot(dx, dy);
      if (d > len || d < 14) continue;
      let da = Math.atan2(dy, dx) - a;
      if (Math.abs(da) > spread * (0.4 + (0.6 * d) / len)) continue;
      const k = SKY.indexOf(P.getPx(c, x, y));
      if (k < 0 || k >= 6) continue;
      const t = 1 - d / len; // fade toward the tip
      if (t > 0.45 || t * 2.2 > P.bayer(x, y)) P.setPx(c, x, y, SKY[k + 1]);
    }
}
for (const [a, s, l] of [[-2.55, 0.05, 150], [-2.12, 0.04, 110], [-1.72, 0.035, 72], [-1.36, 0.035, 76], [-0.98, 0.04, 115], [-0.6, 0.05, 160]]) shaft(a, s, l);
P.glow(c, { cx: SUN.x, cy: SUN.y, r: 12, rings: [GLOW[0], GLOW[1], GLOW[2], GLOW[3], SKY[6]], step: 5, outer: 0.5, squash: 0.6 });
P.rays(c, { cx: SUN.x, cy: SUN.y, len: 34, col: GLOW[3], density: 0.4, width: 2, angles: [-2.25, -1.88, -1.57, -1.26, -0.9] });
P.ellipse(c, SUN.x, SUN.y, 12, 12, (x, y) => (Math.hypot(x - SUN.x, y - SUN.y) < 9.5 ? GLOW[0] : GLOW[1]));

// ── 3. conifer ridges: no dashed edges; a top-rim pass catches the afterglow ──
function forestRidge({ y, amp, seed, col, pines, ph, rim, gap = 0 }) {
  const n = P.noise2(seed);
  const dip = (x) => (gap ? Math.max(0, 1 - Math.abs(x - SUN.x) / gap) * 6 : 0);
  for (let x = 0; x < W; x++) {
    const top = Math.round(y - n(x * 0.025, 0.5) * amp + dip(x));
    for (let yy = top; yy < H; yy++) P.setPx(c, x, yy, col);
  }
  const rr = P.rng(seed * 13);
  for (let i = 0; i < pines; i++) {
    const x = rr.int(-4, W + 4);
    if (gap && Math.abs(x - SUN.x) < gap * 0.7 && rr.chance(0.7)) continue;
    const base = Math.round(y - n(x * 0.025, 0.5) * amp + dip(x)) + 3;
    const h = rr.int(ph[0], ph[1]);
    P.pine(c, rr, { x, baseY: base, h, w: Math.round(h * 0.55), col });
  }
  if (rim)
    for (let x = 0; x < W; x++)
      for (let yy = 90; yy < H; yy++) {
        if (P.getPx(c, x, yy) !== col) continue;
        if (P.getPx(c, x, yy - 1) === col) break;
        const d = Math.abs(x - SUN.x);
        if (d < rim[0][0]) P.setPx(c, x, yy, rim[0][1]);
        else if (d < rim[1][0]) P.setPx(c, x, yy, rim[1][1]);
        break;
      }
}
forestRidge({ y: 154, amp: 7, seed: 11, col: RIDGE[0], pines: 130, ph: [5, 11], gap: 26, rim: [[70, GLOW[3]], [160, SKY[6]]] });
P.fog(c, { y0: 151, y1: 165, col: SKY[5], max: 0.3 });
forestRidge({ y: 164, amp: 9, seed: 23, col: RIDGE[1], pines: 95, ph: [7, 14], rim: [[80, SKY[6]], [180, SKY[5]]] });
P.fog(c, { y0: 163, y1: 175, col: RIDGE[0], max: 0.22 });
forestRidge({ y: 176, amp: 8, seed: 37, col: RIDGE[2], pines: 70, ph: [8, 15], rim: [[110, RIDGE[0]], [0, null]] });

// ── 4. town ──
const sunSide = (x) => (x < SUN.x ? 1 : -1); // +1: the sun is to the right
function townHouse(x, baseY, w, h, roofH, { lit = 0.5, side = false } = {}) {
  const top = baseY - h, peakX = Math.round(x + w / 2), peakY = top - roofH, s = sunSide(peakX);
  P.fillRect(c, x, top, w, h + 30, TOWN[2]); // walls run down into the hill
  const sh = Math.max(2, w >> 2);
  P.fillRect(c, s > 0 ? x : x + w - sh, top, sh, h + 30, TOWN[1]); // shade side
  if (side) {
    // side-gabled (long ridge) roof: trapezoid, ridge line lit
    const inset = Math.max(3, Math.round(roofH * 0.8));
    P.polygon(c, [[x - 2, top + 1], [x - 2 + inset, peakY], [x + w + 2 - inset, peakY], [x + w + 2, top + 1]], TOWN[0]);
    for (let yy = peakY + 2; yy < top; yy += 2) for (let xx = x; xx < x + w; xx++) if (((xx + (yy >> 1)) & 3) === 0) P.setPx(c, xx, yy, TOWN[1]);
    P.line(c, x - 2 + inset, peakY, x + w + 1 - inset, peakY, RIM);
    if (s > 0) P.line(c, x + w + 2 - inset, peakY, x + w + 2, top, RIM);
    else P.line(c, x - 2 + inset, peakY, x - 2, top, RIM);
  } else {
    P.polygon(c, [[x - 2, top + 1], [peakX, peakY], [x + w + 2, top + 1]], TOWN[0]);
    for (let yy = peakY + 3; yy < top; yy += 3) {
      const k = (yy - peakY) / roofH, hw = (w / 2 + 2) * k;
      for (let xx = Math.round(peakX - hw) + 2; xx < peakX + hw - 2; xx++) if (((xx + yy) & 3) === 0) P.setPx(c, xx, yy, TOWN[1]);
    }
    P.line(c, peakX, peakY, s > 0 ? x + w + 2 : x - 2, top, RIM); // ember rim, sunward slope
    P.line(c, peakX - s, peakY + 1, s > 0 ? x - 2 : x + w + 2, top, RIDGE[0]); // dim rim, far slope
  }
  P.fillRect(c, x - 1, top + 1, w + 2, 1, TOWN[0]); // eave shadow
  // timber posts
  P.fillRect(c, x, top + 1, 1, h, TOWN[0]);
  P.fillRect(c, x + w - 1, top + 1, 1, h, TOWN[0]);
  if (h >= 12) P.fillRect(c, x, top + Math.round(h / 2), w, 1, TOWN[0]);
  // windows: 2x3 warm panes with an ember sill
  const cols = Math.max(1, Math.floor((w - 4) / 6));
  for (let k = 0; k < cols; k++) {
    const wx = Math.round(x + 3 + (cols === 1 ? (w - 8) / 2 : ((w - 8) * k) / (cols - 1))), wy = top + 3;
    if (r.chance(lit)) {
      P.fillRect(c, wx, wy, 2, 3, WIN);
      P.fillRect(c, wx, wy + 3, 2, 1, GLOW[3]);
    } else P.fillRect(c, wx, wy, 2, 3, TOWN[0]);
  }
  // chimney on the shade side
  if (w >= 14) {
    const cx = s > 0 ? x + 3 : x + w - 6;
    P.fillRect(c, cx, peakY + Math.round(roofH * 0.35) - 4, 3, 6, TOWN[0]);
    P.setPx(c, cx + (s > 0 ? 2 : 0), peakY + Math.round(roofH * 0.35) - 4, RIM);
  }
}

function church(x, baseY) {
  const w = 12, h = 30, spireH = 16;
  // nave first (behind the tower)
  P.fillRect(c, x - 26, baseY - 8, 26, 30, TOWN[2]);
  P.fillRect(c, x - 26, baseY - 8, 6, 30, TOWN[1]);
  P.polygon(c, [[x - 28, baseY - 7], [x - 20, baseY - 18], [x, baseY - 18], [x, baseY - 7]], TOWN[0]);
  P.line(c, x - 20, baseY - 18, x - 1, baseY - 18, RIM);
  P.line(c, x - 28, baseY - 7, x - 21, baseY - 17, RIDGE[0]);
  for (const wx of [x - 19, x - 13, x - 7]) { P.fillRect(c, wx, baseY - 5, 2, 4, WIN); P.setPx(c, wx, baseY - 6, GLOW[3]); P.setPx(c, wx + 1, baseY - 6, GLOW[3]); }
  // tower
  P.fillRect(c, x, baseY - h, w, h + 20, TOWN[2]);
  P.fillRect(c, x, baseY - h, 4, h + 20, TOWN[1]);
  P.fillRect(c, x + w - 1, baseY - h, 1, h, RIDGE[0]);
  P.fillRect(c, x - 1, baseY - h + 8, w + 2, 1, TOWN[0]);
  P.fillRect(c, x + 4, baseY - h + 2, 3, 5, TOWN[0]);
  P.fillRect(c, x + 5, baseY - h + 3, 1, 3, WIN);
  P.fillRect(c, x + 4, baseY - h + 14, 3, 4, TOWN[0]);
  P.fillRect(c, x + 5, baseY - h + 15, 1, 2, WIN);
  // spire + cross
  const px = Math.round(x + w / 2), py = baseY - h - spireH;
  P.polygon(c, [[x - 2, baseY - h + 1], [px, py], [x + w + 2, baseY - h + 1]], TOWN[0]);
  P.line(c, px, py, x + w + 2, baseY - h, RIM);
  P.line(c, px - 1, py + 1, x - 2, baseY - h, RIDGE[0]);
  P.fillRect(c, px, py - 7, 1, 7, TOWN[0]);
  P.fillRect(c, px - 2, py - 5, 5, 1, TOWN[0]);
  P.setPx(c, px + 2, py - 5, RIM); P.setPx(c, px, py - 7, RIM);
}

// autumn tree clumps between houses: dark body, ember caps on the sun side
function townTree(cx, cy, rx, ry) {
  const rr = P.rng(cx * 31 + cy);
  const light = [SUN.x - cx, -40];
  P.canopy(c, rr, { cx, cy, rx, ry, tones: [TOWN[0], RIDGE[2], LEAF[0], LEAF[1], GLOW[2]], light, clump: [2, 3], speckle: 0.35 });
}

const chimneys = [];
const _house = townHouse;
// back row (smaller, higher, irregular)
church(130, 180);
for (const [x, b, w, h, rh, side] of [[88, 183, 15, 8, 6, 0], [168, 178, 15, 8, 7, 0], [186, 181, 22, 8, 6, 1], [244, 179, 17, 9, 7, 0], [270, 182, 22, 8, 6, 1], [300, 184, 14, 8, 6, 0]])
  _house(x, b, w, h, rh, { lit: 0.6, side: !!side });
// mid row
for (const [x, b, w, h, rh, side] of [[108, 198, 20, 11, 9, 0], [146, 196, 26, 11, 7, 1], [184, 200, 20, 12, 10, 0], [236, 197, 18, 11, 9, 0], [262, 200, 28, 11, 7, 1], [306, 202, 18, 10, 8, 0]])
  _house(x, b, w, h, rh, { lit: 0.55, side: !!side });
// autumn trees in the gaps of the mid row
for (const [x, y, rx, ry] of [[137, 197, 9, 8], [220, 196, 13, 9], [298, 199, 8, 7], [340, 201, 14, 10], [98, 201, 11, 9]]) townTree(x, y, rx, ry);
// front row
for (const [x, b, w, h, rh, side] of [[120, 217, 24, 14, 11, 0], [156, 220, 30, 13, 8, 1], [198, 221, 24, 15, 12, 0], [250, 219, 32, 13, 8, 1], [290, 222, 22, 14, 11, 0]])
  _house(x, b, w, h, rh, { lit: 0.5, side: !!side });
for (const [x, y, rx, ry] of [[236, 214, 12, 9], [150, 216, 7, 7], [326, 217, 13, 9], [104, 218, 13, 9]]) townTree(x, y, rx, ry);

// thin chimney smoke drifting away from the sun
P.smoke(c, P.rng(5), { x: 112, y: 176, h: 22, drift: -0.35, col: [RIDGE[0], SKY[4]] });
P.smoke(c, P.rng(6), { x: 285, y: 174, h: 20, drift: 0.35, col: [RIDGE[0], SKY[4]] });
// a few birds heading home, dark against the glow
for (const [bx, by] of [[176, 112], [184, 108], [190, 114], [262, 118]]) {
  P.setPx(c, bx - 1, by - 1, TOWN[0]); P.setPx(c, bx, by, TOWN[0]); P.setPx(c, bx + 1, by - 1, TOWN[0]);
}
P.fillRect(c, 0, 222, W, 3, TOWN[0]);

// ── 5. foreground trees, both corners; right side darker ──
function fgTree({ cx, cy, rx, ry, light, rim, seed, rimCount }) {
  const rr = P.rng(seed);
  P.canopy(c, rr, { cx, cy, rx, ry, tones: [FG[0], FG[1], FG[2]], light, clump: [3, 6], speckle: 0.5 });
  // ember leaf clusters on the sun-facing rim: small 2-3px clumps, brighter tip
  const [lx, ly] = light, ll = Math.hypot(lx, ly);
  for (let i = 0; i < rimCount; i++) {
    const a = rr() * Math.PI * 2, ux = Math.cos(a), uy = Math.sin(a);
    const f = (ux * lx + uy * ly) / ll;
    if (f < 0.3) continue;
    const d = 0.78 + rr() * 0.25;
    const x = Math.round(cx + ux * rx * d), y = Math.round(cy + uy * ry * d);
    if (y >= H || x < 0 || x >= W) continue;
    for (const [dx, dy] of [[0, 0], [1, 0], [0, 1], [-1, 1]]) if (rr.chance(0.75)) P.setPx(c, x + dx, y + dy, rim[0]);
    if (f > 0.65 && rr.chance(0.55)) P.setPx(c, x, y, rim[1]);
  }
}
// left: tall dark mass framing the corner
fgTree({ cx: 8, cy: 150, rx: 22, ry: 26, light: [0.85, -0.45], rim: LEAF, seed: 9, rimCount: 90 });
fgTree({ cx: 30, cy: 196, rx: 46, ry: 34, light: [0.85, -0.5], rim: LEAF, seed: 7, rimCount: 300 });
fgTree({ cx: 78, cy: 218, rx: 32, ry: 14, light: [0.8, -0.6], rim: LEAF, seed: 8, rimCount: 150 });
// right: conifers + a low clump, rim only in the dim ember
const rp = P.rng(99);
P.pine(c, rp, { x: 360, baseY: 232, h: 72, w: 34, col: FG[1] });
P.pine(c, rp, { x: 384, baseY: 230, h: 100, w: 44, col: FG[0] });
P.pine(c, rp, { x: 399, baseY: 232, h: 124, w: 36, col: FG[0] });
fgTree({ cx: 352, cy: 216, rx: 38, ry: 16, light: [-0.85, -0.5], rim: [LEAF[0], LEAF[0]], seed: 12, rimCount: 110 });
// bottom-centre low bushes so the town sits in the forest
fgTree({ cx: 200, cy: 228, rx: 64, ry: 6, light: [0, -1], rim: [FG[2], LEAF[0]], seed: 21, rimCount: 60 });

// a few drifting embers / leaves, lower half only
P.scatter(c, r, { x0: 70, y0: 156, x1: 330, y1: 212, count: 12, colors: [LEAF[0], LEAF[1]], big: 0 });

// ── output + checks (SCENES.md §1.1) ──
await P.save(c, OUT);
await P.preview(OUT, PREV, 3);

const lum = (i) => 0.2126 * c.data[i] + 0.7152 * c.data[i + 1] + 0.0722 * c.data[i + 2];
const capL = 0.2126 * 0x8a + 0.7152 * 0x6a + 0.0722 * 0x9a;
let dark = 0, bright = 0, topSum = 0, topOver = 0;
for (let y = 0; y < H; y++)
  for (let x = 0; x < W; x++) {
    const L = lum((y * W + x) * 4);
    if (L <= 70) dark++;
    if (L > 150) bright++;
    if (y < 90) { topSum += L; if (L > capL) topOver++; }
  }
const N = W * H;
console.log(`dark<=70: ${((100 * dark) / N).toFixed(1)}%  bright>150: ${((100 * bright) / N).toFixed(2)}%  top40% avg: ${(topSum / (W * 90)).toFixed(1)}  top over-cap px: ${topOver}`);
console.log('preview:', PREV);
