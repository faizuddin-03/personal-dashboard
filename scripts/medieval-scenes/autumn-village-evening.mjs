// Scene b: autumn-village-evening (R1, calendar page).
// Hillside village after sunset, seen across a still lake.
// Spec: app/styles/medieval/SCENES.md section 3b.
// Run from repo root: node scripts/medieval-scenes/autumn-village-evening.mjs

import * as P from './lib.mjs';

const W = 400, H = 225;
const OUT = 'public/medieval/scenes/autumn-village-evening.png';
const PREV = 'data/agents/tmp/scenes/autumn-village-evening@2x.png';

// ── palette (SCENES.md 3b, nothing else) ───────────────────────
const SKY = ['#0a0f1e', '#111830', '#18203c', '#232a4a', '#3a3050', '#5a3a52'];
const HILL = { near: '#0b1022', mid: '#142040', far: '#1d2c52' };
const RW = { roofDk: '#1a2440', roof: '#283a66', wallDk: '#2e2a3c', wall: '#4a4250', wallHi: '#6e6470', church: '#8a8090' };
const TIMBER = '#1a1218';
const TREE = ['#2a0f1a', '#5a1a25', '#8e2a24', '#c24a1e', '#e08a24', '#f3c040'];
const LIGHT = { glow: '#a0582a', win: '#f0b048', core: '#ffe08a' };
const LAKE = ['#070b18', '#0f1830', '#1a2848'];

const r = P.rng(20261027);
const c = P.create(W, H, SKY[0]);

// ── sky: calm, banded, darkest at the top ──────────────────────
P.skyBands(c, 0, 112, SKY, 5);
// a few faint stars, high and sparse (dim palette greys only)
P.stars(c, r, { count: 14, yMax: 46, colors: [RW.wallDk, RW.wall, RW.wallHi] });

// ── hill depths ────────────────────────────────────────────────
// far ridge: hazy blue, gentle
P.ridge(c, { y: 108, amp: 14, freq: 0.018, seed: 11, col: HILL.far });
// mid hillside: rises to the right, where the church stands
const n1 = P.noise2(23);
const midTop = (x) => Math.round(150 - (x / W) * 34 - n1(x * 0.03, 1) * 8);
for (let x = 0; x < W; x++) for (let y = midTop(x); y < H; y++) P.setPx(c, x, y, HILL.mid);

// distant tree line on the far ridge (tiny dark-red and cool clumps, hazy)
const ridgeTop = (x) => { let y = 60; while (y < H && P.getPx(c, x, y) !== HILL.far) y++; return y; };
for (let i = 0; i < 40; i++) {
  const x = r.int(0, W - 1), y = ridgeTop(x);
  const cool = r.chance(0.35);
  P.canopy(c, r, { cx: x, cy: y + 3, rx: r.int(4, 9), ry: r.int(3, 5), tones: cool ? [HILL.near, HILL.mid, HILL.mid, HILL.far, HILL.far] : [HILL.mid, TREE[0], TREE[0], TREE[1], TREE[1]], clump: [2, 3], speckle: 0.15 });
}
// dense hillside wood between the ridge and the village (R1's packed trees)
for (let i = 0; i < 70; i++) {
  const x = r.int(-6, W + 6), yTop = Math.max(100, midTop(x) - 30);
  const y = r.int(yTop, midTop(x) - 4);
  const k = r();
  const tones = k < 0.3 ? [HILL.near, HILL.mid, HILL.far, RW.roofDk, RW.roof]
    : k < 0.75 ? [TREE[0], TREE[0], TREE[1], TREE[1], TREE[2]]
    : [TREE[0], TREE[1], TREE[1], TREE[2], TREE[3]];
  P.canopy(c, r, { cx: x, cy: y, rx: r.int(6, 12), ry: r.int(5, 8), tones, clump: [2, 4], speckle: 0.25 });
}

// ── helpers ────────────────────────────────────────────────────
const palBack = { wall: RW.wallDk, wallDark: RW.roofDk, frame: TIMBER, roof: RW.roofDk, roofDark: HILL.near, roofHi: RW.roof, win: LIGHT.win, winGlow: LIGHT.glow, winFrame: TIMBER, door: TIMBER, chimney: RW.wallDk };
const palMid = { wall: RW.wall, wallDark: RW.wallDk, frame: TIMBER, roof: RW.roof, roofDark: RW.roofDk, roofHi: RW.wallHi, win: LIGHT.win, winGlow: LIGHT.glow, winFrame: TIMBER, door: TIMBER, chimney: RW.wallDk };
const palFront = { wall: RW.wallHi, wallDark: RW.wall, frame: TIMBER, roof: RW.roof, roofDark: RW.roofDk, roofHi: '#3a3050', win: LIGHT.core, winGlow: LIGHT.glow, winFrame: TIMBER, door: TIMBER, chimney: RW.wallDk };
const palRed = { ...palMid, roof: TREE[1], roofDark: TREE[0], roofHi: TREE[2] }; // a couple of terracotta roofs like R1

const toneSets = {
  dim: [TREE[0], TREE[0], TREE[1], TREE[1], TREE[2]],
  red: [TREE[0], TREE[1], TREE[2], TREE[3], TREE[4]],
  gold: [TREE[1], TREE[2], TREE[3], TREE[4], TREE[5]],
};
function clump(cx, cy, rx, ry, set, light = [-0.7, -0.7], withTrunk = false) {
  if (withTrunk) P.trunk(c, r, { x: cx, baseY: cy + ry + 3, h: ry + 3, w: 2, col: [TIMBER, TREE[0]] });
  P.canopy(c, r, { cx, cy, rx, ry, tones: toneSets[set], light, clump: [2, 4], speckle: 0.35 });
}

const lit = []; // window list for the lake reflection

function home(o, pal) {
  const res = P.house(c, r, { ...o, pal });
  for (const w of res.windows) if (w[4]) lit.push(w);
  return res;
}

// ── back tier: small hazy houses on the far slope (rows ~100-125) ──
const backTier = [
  [18, 124, 18, 11, 7], [60, 121, 16, 10, 6], [104, 118, 20, 12, 7], [150, 116, 16, 10, 6], [196, 113, 18, 11, 7], [238, 110, 16, 10, 6],
];
for (const [x, baseY, w, h, roofH] of backTier) {
  home({ x, baseY, w, h, roofH, timber: false, lit: 0.5, floors: 1, gable: r.chance(0.5) ? 'front' : 'side', chimney: r.chance(0.4) ? 'right' : null, door: false, bloom: false }, palBack);
}
// dim tree clumps woven between back houses
for (const x of [40, 84, 128, 174, 218, 262, 290]) clump(x, 118 - (x / W) * 18 + r.int(-2, 2), r.int(7, 11), r.int(5, 7), 'dim');

// ── church on the right, standing on the hilltop ─────────────
// tower body stays below row 90 (bright wall), spire may rise above in dark roof blue
const chX = 344, chBase = 138;
P.fillRect(c, chX - 22, chBase - 18, 26, 18, RW.wall); // nave
P.polygon(c, [[chX - 24, chBase - 17], [chX - 18, chBase - 26], [chX + 2, chBase - 26], [chX + 4, chBase - 17]], RW.roof);
for (let y = chBase - 24; y < chBase - 17; y += 2) for (let x = chX - 22; x < chX + 3; x++) if (((x + y) & 3) === 0) P.setPx(c, x, y, RW.roofDk);
for (const wx of [chX - 18, chX - 11, chX - 4]) { P.fillRect(c, wx - 1, chBase - 14, 4, 7, LIGHT.glow); P.fillRect(c, wx, chBase - 13, 2, 5, LIGHT.win); P.setPx(c, wx, chBase - 13, LIGHT.glow); P.setPx(c, wx + 1, chBase - 13, LIGHT.glow); }
P.tower(c, { x: chX + 4, baseY: chBase, w: 14, h: 38, spireH: 16, pal: { wall: RW.church, wallDark: RW.wallHi, roof: RW.roof, roofDark: RW.roofDk, win: LIGHT.win }, cross: true });
// clock face + belfry slit + spire highlight edge
P.fillRect(c, chX + 9, chBase - 30, 4, 4, RW.wallDk); P.setPx(c, chX + 10, chBase - 29, RW.wallHi);
P.fillRect(c, chX + 9, chBase - 20, 4, 7, TIMBER); P.fillRect(c, chX + 10, chBase - 19, 2, 5, LIGHT.glow);
P.line(c, chX + 3, chBase - 37, chX + 11, chBase - 54, RW.wallDk);
// trees hugging the church
clump(chX - 34, chBase - 10, 12, 9, 'red');
clump(chX + 30, chBase - 6, 14, 12, 'gold', [-0.9, -0.4]);

// ── mid tier: timber houses with blue roofs, packed with trees (rows ~118-155) ──
const midTier = [
  [8, 152, 30, 20, 11, palMid, 'front'], [52, 150, 34, 22, 12, palRed, 'side'], [112, 147, 28, 20, 12, palMid, 'front'],
  [170, 144, 36, 22, 12, palMid, 'side'], [230, 141, 28, 20, 12, palRed, 'front'], [276, 140, 26, 18, 10, palMid, 'front'],
];
// trees filling the slope behind the mid tier
for (let x = -4; x < 330; x += r.int(10, 16)) clump(x, midTop(x) + r.int(-4, 2), r.int(7, 11), r.int(6, 8), r.pick(['dim', 'dim', 'red']));
const chimneys = [];
for (const [x, baseY, w, h, roofH, pal, gable] of midTier) {
  const res = home({ x, baseY, w, h, roofH, timber: true, lit: 0.75, floors: 2, gable, chimney: r.chance(0.6) ? (r.chance(0.5) ? 'left' : 'right') : null, door: false }, pal);
  if (res.chimneyTop) chimneys.push(res.chimneyTop);
}
for (const [x, y, rx, ry, set] of [[44, 140, 9, 9, 'gold'], [97, 136, 11, 10, 'red'], [150, 133, 12, 10, 'gold'], [216, 130, 10, 10, 'red'], [262, 126, 9, 8, 'gold'], [310, 136, 11, 10, 'red']]) clump(x, y, rx, ry, set);

// thin smoke from two chimneys (hill blue, quiet)
for (const [x, y] of chimneys.slice(0, 2)) P.smoke(c, r, { x, y, h: 14, drift: 0.35, col: [RW.wallDk, RW.roofDk] });

// ── lakeside ground strip + front tier (rows ~150-182) ─────────
const shoreY = 182;
P.fillRect(c, 0, 168, W, shoreY - 168, HILL.near);
// dense band of trees between the mid and front tiers (no empty slope)
for (let x = -4; x < 410; x += r.int(8, 13)) clump(x, r.int(150, 158), r.int(7, 10), r.int(6, 8), r.pick(['dim', 'red', 'red', 'gold']));
// right shore below the church: trees then two houses stepping down
for (let x = 296; x < 410; x += r.int(9, 14)) clump(x, r.int(138, 146), r.int(8, 11), r.int(6, 8), r.pick(['dim', 'red', 'gold']));
const frontTier = [
  [20, 180, 40, 28, 14, palFront, 'front'], [86, 179, 36, 24, 13, palMid, 'side'], [140, 180, 30, 26, 14, palFront, 'front'],
  [196, 178, 40, 26, 13, { ...palMid, roof: RW.roofDk, roofDark: HILL.near, roofHi: RW.roof }, 'side'], [250, 180, 30, 24, 14, palFront, 'front'],
];
frontTier.push([300, 176, 28, 22, 12, palRed, 'front'], [346, 170, 26, 20, 11, palMid, 'side']);
for (const [x, baseY, w, h, roofH, pal, gable] of frontTier) {
  home({ x, baseY, w, h, roofH, timber: true, lit: 0.8, floors: 2, gable, chimney: r.chance(0.5) ? 'right' : null, door: true }, pal);
}
for (const [x, y, rx, ry, set] of [[70, 166, 10, 11, 'red'], [128, 166, 8, 10, 'gold'], [182, 165, 9, 11, 'red'], [240, 164, 8, 10, 'gold']]) clump(x, y, rx, ry, set);
// trees partly in front of the houses for depth
for (const [x, y, rx, ry, set] of [[4, 172, 9, 10, 'gold'], [120, 174, 7, 8, 'red'], [234, 175, 7, 7, 'red'], [288, 168, 12, 12, 'gold']]) clump(x, y, rx, ry, set, [-0.7, -0.7], true);
// quay edge
for (let x = 0; x < W; x++) { P.setPx(c, x, shoreY, RW.wallDk); if ((x & 7) === 0) P.setPx(c, x, shoreY - 1, RW.wallDk); }

// quay lamp posts with a small warm halo
for (const lx of [66, 132, 190, 246]) {
  P.fillRect(c, lx, shoreY - 8, 1, 8, TIMBER);
  P.glow(c, { cx: lx, cy: shoreY - 9, r: 1, rings: [LIGHT.core, LIGHT.glow], step: 1, outer: 0.6 });
}
// a cat sitting on the quay, tail curled
for (const [dx, dy] of [[0,0],[1,0],[2,0],[0,-1],[1,-1],[2,-1],[1,-2],[2,-2],[1,-3],[3,-3],[1,-4],[3,-4],[2,-3],[3,0],[4,0],[4,-1]]) P.setPx(c, 108 + dx, shoreY - 1 + dy, TIMBER);
// ── lake: mirrored, broken reflection of the shore ─────────────
const lakeY0 = shoreY + 1;
const mapRef = (col) => {
  if (col === LIGHT.core || col === LIGHT.win) return LIGHT.win;
  if (col === LIGHT.glow) return LIGHT.glow;
  if (col === TREE[5] || col === TREE[4] || col === TREE[3]) return TREE[2];
  if (col === TREE[2] || col === TREE[1]) return TREE[1];
  if (col === TREE[0]) return TREE[0];
  if (col === RW.church || col === RW.wallHi || col === RW.wall) return LAKE[2];
  return null;
};
for (let y = lakeY0; y < H; y++) {
  const d = y - lakeY0, srcY = shoreY - 1 - d;
  const wob = Math.round(Math.sin(y * 1.3) * (1 + d / 14));
  const gap = d > 2 && d % 3 === 2; // calm horizontal breaks
  for (let x = 0; x < W; x++) {
    let col = d < 6 ? P.dither(x, y, LAKE[1], LAKE[2], 0.25) : d < 18 ? LAKE[1] : P.dither(x, y, LAKE[0], LAKE[1], Math.max(0, 0.5 - (d - 18) / 40));
    const src = !gap && srcY >= 0 ? P.getPx(c, x + wob, srcY) : null;
    let m = src && mapRef(src);
    if (m === LIGHT.win && d > 16) m = LIGHT.glow;
    // solid streaks: whole runs stay or go together, fading with depth
    if (m && ((x >> 2) * 7 + y * 3) % 11 / 11 < 1 - d / 34) col = m;
    P.setPx(c, x, y, col);
  }
}
// horizontal ripple glints
for (let y = lakeY0 + 2; y < H; y += 3) for (let x = 0; x < W; x++) if (r.chance(0.012)) P.fillRect(c, x, y, r.int(3, 8), 1, LAKE[2]);

// ── foreground framing ─────────────────────────────────────────
// bottom-left: dark navy bush (R1's cool shadow foliage)
P.canopy(c, r, { cx: 14, cy: 224, rx: 56, ry: 32, tones: [HILL.near, HILL.mid, HILL.far, RW.roof, '#3a3050'], light: [0.7, -0.7], clump: [3, 6], speckle: 0.4 });
// bottom-right: big crimson-gold maple lit warmly from the village
P.canopy(c, r, { cx: 372, cy: 214, rx: 62, ry: 34, tones: toneSets.red, light: [-0.8, -0.6], clump: [3, 6], speckle: 0.5 });
P.canopy(c, r, { cx: 334, cy: 200, rx: 22, ry: 12, tones: toneSets.red, light: [-0.8, -0.6], clump: [2, 4], speckle: 0.5 });
// lamp-lit leaf highlights on the maple's village side
for (let i = 0; i < 22; i++) { const a = r.range(Math.PI * 1.08, Math.PI * 1.45), d = r.range(0.7, 0.98); const x = Math.round(372 + Math.cos(a) * 62 * d), y = Math.round(214 + Math.sin(a) * 34 * d); P.fillRect(c, x, y, 2, 2, TREE[4]); P.setPx(c, x, y, TREE[5]); P.setPx(c, x + 1, y + 2, TREE[3]); }
// a few branch tips poking out
for (const [x, y] of [[300, 196], [290, 205], [318, 186]]) P.line(c, x, y, x + 8, y + 4, TIMBER);

// falling leaves, lower half only
P.scatter(c, r, { x0: 0, y0: 118, x1: W, y1: H, count: 40, colors: [TREE[2], TREE[3], TREE[4]], big: 0.3 });

// ── save + checks ─────────────────────────────────────────────
await P.save(c, OUT);
await P.preview(OUT, PREV, 2);

const lum = (x, y) => { const i = (y * W + x) * 4, d = c.data; return 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2]; };
let dark = 0, bright = 0, topSum = 0, topMax = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const L = lum(x, y);
  if (L <= 70) dark++; if (L > 150) bright++;
  if (y < 90) { topSum += L; topMax = Math.max(topMax, L); }
}
const N = W * H, capL = 0.2126 * 0x8a + 0.7152 * 0x6a + 0.0722 * 0x9a;
console.log(`dark<=70: ${(100 * dark / N).toFixed(1)}% (>=75)  bright>150: ${(100 * bright / N).toFixed(1)}% (<=5)  top40% mean: ${(topSum / (90 * W)).toFixed(1)} (<=45)  top max lum: ${topMax.toFixed(0)} (cap ${capL.toFixed(0)})`);
