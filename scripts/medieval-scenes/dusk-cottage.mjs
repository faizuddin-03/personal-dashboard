// Scene a — dusk-cottage (home). Reference: _reference/inbox/medieval-refs/ref-dusk-cottage.png
// Spec: app/styles/medieval/SCENES.md §3a. Run from repo root:
//   node scripts/medieval-scenes/dusk-cottage.mjs
import * as P from './lib.mjs';

const W = 400, H = 225, OUT = 'public/medieval/scenes/dusk-cottage.png';
const PREV = 'data/agents/tmp/scenes/dusk-cottage@3x.png';

const SKY = ['#120c18', '#1a1224', '#241830', '#2f1d3a', '#3e2444', '#5a2f4a', '#8a4552'];
const SMOKE = ['#4e3c58', '#3e2444']; // dense, thin (spec haze '#3a2c44' dropped for the 32-colour cap)
const STAR = ['#5a4a6e', '#a898b8', '#efe2cc'];
const GROUND = ['#0d0a0e', '#151016', '#1f1719', '#2a1f20'];
const CW = { dark: '#1c1012', wall: '#2e1c1a', mid: '#45291f', lite: '#5c3826', roof: '#2a1a26', roofHi: '#3b2433' };
const LIGHT = ['#7a4220', '#e8a040', '#ffd77a'];
const TREE = ['#3a1416', '#6e2620', '#a8432a', '#d8702e', '#f0a24a'];
// path one step darker than the spec list; '#76687a' only where the doorway light falls
const PATH = { gap: '#0d0a0e', stoneDark: '#1f1719', stone: '#3a3240', stoneHi: '#564a5a' };
const PATH_LIT = '#76687a';

const r = P.rng(20261027);
const c = P.create(W, H, SKY[0]);
const HZ = 158; // horizon / ground line at the cottage

// ── sky: banded, darkest at top, ember band low ──────────────────
P.skyBands(c, 0, 40, [SKY[0]], 1);
P.skyBands(c, 40, HZ, SKY, 5);
P.stars(c, r, { count: 28, yMax: 70, colors: STAR });

// horizontal cloud streaks (flat bottoms), lighter than the band they sit in
function streak(x, y, w, h, col, under) {
  for (let yy = 0; yy < h; yy++) {
    const inset = Math.round((h - 1 - yy) * 2.5);
    for (let xx = x + inset; xx < x + w - inset * 0.6; xx++) P.setPx(c, xx, y + yy, col);
  }
  if (under) for (let xx = x + 2; xx < x + w - 2; xx++) if (P.bayer(xx, y + h) < 0.5) P.setPx(c, xx, y + h, under);
}
streak(20, 52, 70, 2, SKY[3]);
streak(250, 60, 90, 2, SKY[3]);
streak(-10, 80, 120, 3, SKY[4], SKY[3]);
streak(280, 86, 140, 3, SKY[4]);
streak(150, 98, 110, 3, SKY[5]);
streak(-20, 112, 130, 3, SKY[5], SKY[4]);
streak(300, 116, 120, 4, SKY[6], SKY[5]);
streak(120, 126, 90, 3, SKY[6]);
streak(30, 136, 80, 2, SKY[6]);

// ── far tree line (purple silhouettes against the ember band) ────
const N = P.noise2(7);
for (let x = 0; x < W; x++) {
  const top = Math.round(HZ - 10 - N(x * 0.09, 1) * 12 - N(x * 0.3, 3) * 4);
  for (let y = top; y < HZ + 2; y++) P.setPx(c, x, y, y < top + 1 ? SKY[4] : SKY[3]);
}
for (let x = 0; x < W; x++) {
  const top = Math.round(HZ - 3 - N(x * 0.12, 9) * 8);
  for (let y = top; y < HZ + 2; y++) P.setPx(c, x, y, SKY[2]);
}

// ── ground: flat bands, lit strip at the horizon, dark corners ──
const G = P.noise2(3);
for (let x = 0; x < W; x++) {
  const top = Math.round(HZ - 1 + Math.sin(x * 0.02) * 2 + G(x * 0.05, 0) * 3);
  for (let y = top; y < H; y++) {
    const d = (y - top) / (H - HZ);
    const edge = Math.abs(x - 205) / 205;
    const t = d * 1.1 + edge * edge * 0.9 + (G(x * 0.04, y * 0.06) - 0.5) * 0.18;
    let col;
    if (t < 0.12) col = P.dither(x, y, GROUND[3], GROUND[2], t / 0.12);
    else if (t < 0.45) col = t < 0.38 ? GROUND[2] : P.dither(x, y, GROUND[2], GROUND[1], (t - 0.38) / 0.07);
    else if (t < 0.95) col = t < 0.88 ? GROUND[1] : P.dither(x, y, GROUND[1], GROUND[0], (t - 0.88) / 0.07);
    else col = GROUND[0];
    if (y === top) col = GROUND[3];
    P.setPx(c, x, y, col);
  }
}
// grass tufts: tiny 3px blades, one tone up from the ground under them
const UP = { [GROUND[0]]: GROUND[1], [GROUND[1]]: GROUND[2], [GROUND[2]]: GROUND[3], [GROUND[3]]: GROUND[3] };
for (let i = 0; i < 260; i++) {
  const x = r.int(0, W - 1), y = r.int(HZ + 3, H - 1);
  const col = UP[P.getPx(c, x, y)] ?? GROUND[2];
  P.setPx(c, x, y - 1, col); P.setPx(c, x - 1, y, col); P.setPx(c, x + 1, y, col);
}

// ── trees ───────────────────────────────────────────────────────
const TRUNK = [CW.dark, CW.wall];
const T_TOP = TREE, T_MID = [TREE[0], TREE[1], TREE[1], TREE[2], TREE[3]], T_LOW = [TREE[0], TREE[0], TREE[1], TREE[1], TREE[2]];
function tree(x, baseY, lobes, light, th) {
  P.trunk(c, r, { x, baseY, h: th, w: 7, col: TRUNK });
  for (let y = baseY - th; y < baseY; y++) { P.setPx(c, x - 4, y, CW.dark); P.setPx(c, x + 1, y, CW.mid); }
  P.fillRect(c, x - 5, baseY - 2, 11, 2, CW.dark);
  for (let yy = baseY; yy < baseY + 3; yy++) for (let xx = x - 18; xx < x + 22; xx++)
    if (Math.hypot((xx - x - 2) / 18, (yy - baseY - 1) / 2.5) < 1 && P.bayer(xx, yy) < 0.6) P.setPx(c, xx, yy, GROUND[1]);
  // lobes back to front; k: 0 low/shaded, 1 middle, 2 sunlit crown
  for (const [dx, dy, rx, ry, k] of lobes)
    P.canopy(c, r, { cx: x + dx, cy: baseY - th + dy, rx, ry, tones: k === 2 ? T_TOP : k === 1 ? T_MID : T_LOW, light, clump: [3, 6] });
  // limbs showing through the underside of the crown
  const fy = baseY - th + 22;
  for (const [ex, ey] of [[-16, -6], [14, -8], [-4, -12], [24, 2]]) {
    P.line(c, x, fy + 8, x + ex, fy + ey, CW.dark); P.line(c, x + 1, fy + 8, x + ex + 1, fy + ey, CW.dark);
  }
  P.fillRect(c, x - 3, fy + 4, 7, baseY - fy - 4, CW.wall); P.fillRect(c, x - 4, fy + 4, 1, baseY - fy - 4, CW.dark); P.fillRect(c, x + 3, fy + 4, 1, baseY - fy - 4, CW.dark);
  for (let y = fy + 6; y < baseY - 2; y += 4) P.setPx(c, x + 1, y, CW.mid);
}

// background dark trees behind the cottage
const BG_TREE = ['#1c1012', '#1c1012', '#3a1416', '#3a1416', '#6e2620'];
P.canopy(c, r, { cx: 150, cy: 138, rx: 18, ry: 16, tones: BG_TREE, light: [0.7, -0.5] });
P.canopy(c, r, { cx: 258, cy: 140, rx: 16, ry: 14, tones: BG_TREE, light: [-0.7, -0.5] });

// ── cottage ─────────────────────────────────────────────────────
const bx0 = 178, bx1 = 222, wallTop = 130, base = 161, peakY = 104;
// side wing (right)
const wx0 = 222, wx1 = 250, wTop = 138;
P.fillRect(c, wx0, wTop, wx1 - wx0, base - wTop, CW.wall);
for (let y = wTop + 2; y < base; y += 3) P.fillRect(c, wx0, y, wx1 - wx0, 1, CW.dark);
P.polygon(c, [[wx0, wTop + 1], [wx0, 124], [wx1 + 3, wTop + 1]], CW.roof);
for (let y = 127; y < wTop; y += 3) for (let x = wx0; x < wx1 + 3; x++) if (((x + y) & 3) !== 0 && P.getPx(c, x, y) === CW.roof) P.setPx(c, x, y, CW.roofHi);
P.line(c, wx0, 124, wx1 + 3, wTop, SKY[5]);
P.fillRect(c, wx0, wTop + 1, wx1 - wx0 + 3, 1, CW.dark);
P.fillRect(c, wx1 - 1, wTop, 1, base - wTop, CW.dark);
// main body walls with plank lines
P.fillRect(c, bx0, wallTop, bx1 - bx0, base - wallTop, CW.wall);
for (let y = wallTop + 2; y < base; y += 3) P.fillRect(c, bx0, y, bx1 - bx0, 1, CW.dark);
P.polygon(c, [[bx0, wallTop + 1], [200, peakY + 4], [bx1, wallTop + 1]], CW.wall);
for (let y = peakY + 6; y < wallTop; y += 3) for (let x = bx0; x < bx1; x++) if (P.getPx(c, x, y) === CW.wall) P.setPx(c, x, y, CW.dark);
P.fillRect(c, bx0, wallTop, 2, base - wallTop, CW.dark);
P.fillRect(c, bx1 - 2, wallTop, 2, base - wallTop, CW.dark);
// chimney (behind roof, right slope)
P.fillRect(c, 212, 100, 6, 20, CW.dark);
P.fillRect(c, 213, 100, 3, 20, CW.mid);
P.fillRect(c, 211, 98, 8, 2, CW.dark);
P.fillRect(c, 212, 98, 6, 1, SKY[5]);
// roof slopes (rim light on the sunward edge)
for (let k = 0; k < 7; k++) {
  P.line(c, 200, peakY + k, 172 + k * 0.6, wallTop + 3, k === 0 ? SKY[5] : k % 2 ? CW.roofHi : CW.roof);
  P.line(c, 200, peakY + k, 228 - k * 0.6, wallTop + 3, k === 0 ? SKY[4] : k % 2 ? CW.roof : CW.roofHi);
}
P.line(c, 200, peakY + 7, 178, wallTop + 2, CW.dark);
P.line(c, 200, peakY + 7, 222, wallTop + 2, CW.dark);
P.fillRect(c, 172, wallTop + 3, 57, 1, CW.dark);

function spill(x, y, w, h) {
  for (let yy = y - 4; yy < y + h + 5; yy++) for (let xx = x - 5; xx < x + w + 5; xx++) {
    const d = Math.max(Math.max(x - xx, xx - (x + w - 1), 0), Math.max(y - yy, yy - (y + h - 1), 0));
    const cur = P.getPx(c, xx, yy);
    if (cur !== CW.wall && cur !== CW.dark) continue;
    const t = 1 - d / 5;
    if (cur === CW.wall && t > P.bayer(xx, yy)) P.setPx(c, xx, yy, d < 2 ? CW.lite : CW.mid);
    else if (cur === CW.dark && t > 0.6 + P.bayer(xx, yy) * 0.4) P.setPx(c, xx, yy, CW.wall);
  }
}
function windowAt(x, y, w, h) {
  P.fillRect(c, x - 1, y - 1, w + 2, h + 2, CW.dark);
  P.fillRect(c, x, y, w, h, LIGHT[2]);
  for (let yy = y + h - 2; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) if (P.bayer(xx, yy) < 0.5) P.setPx(c, xx, yy, LIGHT[1]);
  P.fillRect(c, x + (w >> 1), y, 1, h, CW.lite);
  P.fillRect(c, x, y + (h >> 1), w, 1, CW.lite);
  P.fillRect(c, x - 2, y + h + 1, w + 4, 1, CW.lite);
}
const WINS = [[196, 113, 8, 8], [182, 141, 9, 8], [209, 141, 9, 8], [232, 143, 10, 7]];
for (const wv of WINS) spill(...wv);
for (const wv of WINS) windowAt(...wv);
// door + porch
const dx = 196, dw = 8;
P.fillRect(c, dx, 147, dw, base - 147, CW.lite);
P.fillRect(c, dx + 1, 148, dw - 2, base - 149, CW.mid);
P.fillRect(c, dx + 2, 149, dw - 4, 3, LIGHT[1]);
P.setPx(c, dx + dw - 2, 155, LIGHT[2]);
P.polygon(c, [[190, 145], [193, 140], [207, 140], [210, 145]], CW.roof);
P.fillRect(c, 190, 145, 21, 1, CW.dark);
P.line(c, 193, 140, 207, 140, SKY[5]);
P.fillRect(c, 191, 146, 1, base - 146, CW.lite);
P.fillRect(c, 209, 146, 1, base - 146, CW.lite);
P.fillRect(c, 193, base - 1, 15, 2, PATH.stone);
P.fillRect(c, 195, base - 1, 11, 1, PATH_LIT);
for (const [bx, bw] of [[172, 14], [212, 12], [240, 14]])
  P.canopy(c, r, { cx: bx + bw / 2, cy: base - 1, rx: bw / 2, ry: 3, tones: [GROUND[0], '#3a1416', '#3a1416', '#6e2620', '#6e2620'], clump: [1, 2], clumps: 10, speckle: 0.2 });

P.smoke(c, r, { x: 215, y: 95, h: 42, drift: 0.35, col: SMOKE });

// ── framing trees ───────────────────────────────────────────────
tree(92, 172, [[-24, 14, 26, 16, 0], [24, 12, 24, 16, 0], [0, -2, 40, 26, 1], [-16, -18, 24, 18, 1], [14, -16, 22, 18, 1], [2, -30, 26, 16, 2], [-2, 16, 28, 10, 0]], [0.5, -0.8], 62);
tree(320, 168, [[-18, 12, 18, 13, 0], [18, 12, 18, 13, 0], [0, -2, 28, 20, 1], [-2, -20, 20, 14, 2], [2, 14, 20, 8, 0]], [-0.5, -0.8], 50);

// ── ground light pool in front of the door ──────────────────────
for (let y = base; y < base + 10; y++) for (let x = 170; x < 236; x++) {
  const d = Math.hypot((x - 200) / 32, (y - base) / 9);
  if (!GROUND.includes(P.getPx(c, x, y))) continue;
  if (1 - d > P.bayer(x, y) * 1.2) P.setPx(c, x, y, d < 0.45 ? LIGHT[0] : GROUND[3]);
}

// ── stone path ──────────────────────────────────────────────────
P.stonePath(c, r, { pts: [[200, base + 1], [186, 168], [176, 176], [190, 186], [214, 196], [206, 206], [178, 216], [160, 230]], w0: 11, w1: 54, col: PATH });
// slabs near the door catch the doorway light
for (let y = base; y < base + 22; y++) for (let x = 165; x < 225; x++) {
  const cur = P.getPx(c, x, y), t = 1 - (y - base) / 22;
  if (cur === PATH.stoneHi && t > P.bayer(x, y)) P.setPx(c, x, y, PATH_LIT);
  else if (cur === PATH.stone && t * 0.8 > P.bayer(x, y)) P.setPx(c, x, y, PATH.stoneHi);
}

// ── a black cat sitting by the path, rim-lit by the doorway ───
const cat = [
  '.k...k..',
  '.kk.kk..',
  '.kkkkk..',
  '.kekek..',
  '..kkk...',
  '..kkkk..',
  '.kkkkkk.',
  '.kkkkkkk',
  '.kkkkkkk',
  'kkkkkkk.',
];
const catX = 222, catY = 165;
cat.forEach((row, j) => [...row].forEach((ch, i) => {
  if (ch === 'k') P.setPx(c, catX + i, catY + j, GROUND[0]);
  if (ch === 'e') P.setPx(c, catX + i, catY + j, LIGHT[1]);
}));
// rim light on the side facing the door (left), tail curling right
for (let j = 2; j < 10; j++) { const i = [...cat[j]].indexOf('k'); if (i >= 0 && j !== 3) P.setPx(c, catX + i, catY + j, LIGHT[0]); }
P.setPx(c, catX + 1, catY, LIGHT[0]);
for (const [i, j] of [[8, 8], [9, 7], [10, 6], [10, 5]]) P.setPx(c, catX + i, catY + j, GROUND[0]);

// ── leaves + fireflies ──────────────────────────────────────────
P.scatter(c, r, { x0: 0, y0: HZ + 6, x1: W, y1: H, count: 45, colors: [TREE[1], TREE[1], TREE[2], TREE[3]], big: 0.3 });
P.scatter(c, r, { x0: 20, y0: 170, x1: 380, y1: 222, count: 10, colors: [LIGHT[1]], big: 0 });
P.scatter(c, r, { x0: 60, y0: 150, x1: 140, y1: 180, count: 8, colors: [TREE[2], TREE[3]], big: 0 });

// ── top-40% clamp: nothing brighter than #8a6a9a except stars ───
const lum = (h) => { const [R, G2, B] = P.rgb(h); return 0.2126 * R + 0.7152 * G2 + 0.0722 * B; };
for (let y = 0; y < 90; y++) for (let x = 0; x < W; x++) {
  const h = P.getPx(c, x, y);
  if (STAR.includes(h)) continue;
  if (lum(h) > lum('#8a6a9a')) P.setPx(c, x, y, h === TREE[3] || h === TREE[4] ? TREE[2] : SKY[5]);
}

await P.save(c, OUT);
await P.preview(OUT, PREV, 3);

// ── darkness budget (SCENES.md §1.1) ────────────────────────────
let dark = 0, bright = 0, topSum = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const L = lum(P.getPx(c, x, y));
  if (L <= 70) dark++; if (L > 150) bright++; if (y < 90) topSum += L;
}
console.log(`dark<=70: ${(100 * dark / (W * H)).toFixed(1)}%  bright>150: ${(100 * bright / (W * H)).toFixed(2)}%  top40 avg: ${(topSum / (W * 90)).toFixed(1)}`);
