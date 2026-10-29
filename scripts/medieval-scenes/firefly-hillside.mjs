// Scene g: firefly-hillside (SCENES.md 3.g). Quiet twilight hillside.
// Run from repo root: node scripts/medieval-scenes/firefly-hillside.mjs
import * as P from './lib.mjs';

const W = 400, H = 225;
const OUT = 'public/medieval/scenes/firefly-hillside.png';
const PREV = 'data/agents/tmp/scenes/firefly-hillside@3x.png';

// palette (SCENES.md 3.g)
const SKY = ['#090a18', '#0f1022', '#16162e', '#1f1c3a', '#2c2244', '#40284a'];
const STAR = ['#4a4a6a', '#a0a0c0', '#f0ead8'];
const FAR = ['#141a30', '#1c2440'];
const NEAR = ['#0a0e0c', '#121a14', '#1c2618', '#2a3420'];
const COT = ['#1a1218', '#2e2028'];
const WIN = ['#e8a848', '#ffd98a'];
const TREE = ['#3a1416', '#7a2a20', '#c0602a', '#eaa040'];
const FLY = ['#6a6a2a', '#e8e070', '#fff6b0'];

const c = P.create(W, H, SKY[0]);
const r = P.rng(7077);
const n1 = P.noise2(71), n2 = P.noise2(72), n3 = P.noise2(73);

// ── sky: long calm bands, plum only near the horizon ──────────────
// rows 0-60 deepest, then steps down to the plum band at ~125-150
const bandStops = [[0, 0], [52, 1], [84, 2], [108, 3], [126, 4], [141, 5]];
for (let y = 0; y < 160; y++) {
  let i = 0;
  for (let k = 0; k < bandStops.length; k++) if (y >= bandStops[k][0]) i = k;
  const next = bandStops[i + 1];
  for (let x = 0; x < W; x++) {
    let col = SKY[i];
    if (next) {
      const soft = 6, into = y - (next[0] - soft);
      if (into >= 0) col = P.dither(x, y, SKY[i], SKY[i + 1], (into + 0.5) / soft);
    }
    P.setPx(c, x, y, col);
  }
}

// thin layered cloud streaks (R4 stepped clouds, but dark): only rows 96-140
function cloud(cx, cy, len, col, t = 1) {
  for (let s = 0; s < 3; s++) {
    const w = Math.round(len * (1 - s * 0.28)), x0 = Math.round(cx - w / 2 + s * len * 0.06);
    for (let x = x0; x < x0 + w; x++) {
      const yy = cy + s;
      const edge = Math.min(x - x0, x0 + w - 1 - x);
      if (edge < 3 && P.bayer(x, yy) > (edge + 1) / 4) continue;
      if (t < 1 && P.bayer(x, yy) > t) continue;
      P.setPx(c, x, yy, col);
    }
  }
}
cloud(70, 100, 70, SKY[3], 0.75);
cloud(318, 106, 90, SKY[3], 0.75);
cloud(196, 117, 60, SKY[4], 0.85);
cloud(40, 124, 64, SKY[5]);
cloud(352, 129, 80, SKY[5]);
cloud(150, 133, 44, SKY[5]);
// underside lit rim on the low clouds (plum glow from below)
for (const [cx, cy, len] of [[40, 126, 64], [352, 131, 80]])
  for (let x = Math.round(cx - len * 0.3); x < cx + len * 0.3; x++) if ((x & 1) === 0) P.setPx(c, x, cy + 1, '#40284a');

// stars: top 0-95, ~40, denser at the top
for (let i = 0; i < 40; i++) {
  const x = r.int(2, W - 3), y = Math.floor(Math.pow(r(), 1.6) * 92), k = r();
  if (k > 0.9) {
    P.setPx(c, x, y, STAR[2]);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) P.setPx(c, x + dx, y + dy, STAR[0]);
  } else P.setPx(c, x, y, k > 0.55 ? STAR[1] : STAR[0]);
}

// ── far hill: bluish, broad, with a fine pine fringe ──────────────
const farTop = (x) => Math.round(156 - 14 * Math.sin((x / W) * Math.PI * 1.1 + 0.3) - 8 * n1(x * 0.02, 1));
// back ridge (bluer, catches the plum light) then the far hill body
const backTop = (x) => Math.round(146 - 10 * n2(x * 0.012, 4) - 6 * Math.sin(x * 0.02 + 1));
for (let x = 0; x < W; x++) for (let y = backTop(x); y < H; y++) P.setPx(c, x, y, FAR[1]);
for (let i = 0; i < 40; i++) { const x = r.int(0, W - 1); const h = r.int(3, 6); P.pine(c, r, { x, baseY: backTop(x) + 1, h, w: Math.round(h * 0.7), col: FAR[1] }); }
for (let x = 0; x < W; x++) { const t = farTop(x); for (let y = t; y < H; y++) P.setPx(c, x, y, FAR[0]); }
// lighter crest on the far hill (catches the plum sky)
for (let x = 0; x < W; x++) if (x % 3) P.setPx(c, x, farTop(x), FAR[1]);
// tiny distant pine clumps on the far crest
for (let i = 0; i < 26; i++) {
  const x = r.int(0, W - 1);
  if (x > 150 && x < 250) continue; // keep the cottage area clear
  const b = farTop(x) + 1, h = r.int(4, 8);
  P.pine(c, r, { x, baseY: b, h, w: Math.round(h * 0.7), col: FAR[0] });
}

// ── three distant cottages on the far hill ────────────────────────
function cottage(x, w, h, roofH, lit, smokeOn) {
  const base = farTop(x + (w >> 1)) + 4, top = base - h;
  // wall
  P.fillRect(c, x, top, w, h, COT[1]);
  P.fillRect(c, x + w - 2, top, 2, h, COT[0]);
  // pitched roof (side gable), dark, with 1px eave
  P.polygon(c, [[x - 2, top + 1], [x + 2, top - roofH], [x + w - 2, top - roofH], [x + w + 2, top + 1]], COT[0]);
  for (let xx = x - 1; xx < x + w + 1; xx += 2) P.setPx(c, xx, top - 1, COT[1]);
  // chimney
  const chx = x + w - 5;
  P.fillRect(c, chx, top - roofH - 3, 2, 4, COT[0]);
  // windows
  const wins = [];
  for (let k = 0; k < lit.length; k++) {
    const wx = x + 2 + Math.round(((w - 6) * (lit.length === 1 ? 0.3 : k / (lit.length - 1)))), wy = top + 2;
    if (lit[k]) {
      // spill: dithered glow on the wall/ground around the window
      P.ditherRect(c, wx - 1, wy - 1, 4, 4, '#e8a848', 0.35);
      P.fillRect(c, wx, wy, 2, 2, WIN[1]);
      P.setPx(c, wx + 1, wy + 1, WIN[0]);
    } else P.fillRect(c, wx, wy, 2, 2, COT[0]);
    wins.push([wx, wy]);
  }
  // door
  P.fillRect(c, x + w - 6, base - 3, 2, 3, COT[0]);
  if (smokeOn) P.smoke(c, r, { x: chx + 1, y: top - roofH - 4, h: 26, drift: 0.3, col: [SKY[5], SKY[4]] });
  return base;
}
cottage(160, 13, 6, 4, [1, 0], true);
cottage(196, 10, 5, 3, [1], false);
cottage(228, 14, 6, 4, [0, 1], false);
// a tiny lit window glint farther away
P.setPx(c, 112, farTop(112) + 3, WIN[0]);

// ── mid ground mist between hills ────────────────────────────────
P.fog(c, { y0: 164, y1: 174, col: FAR[1], max: 0.18 });

// ── near hill: dark green-brown, rolling, with a lit crest ────────
const nearTop = (x) => Math.round(184 - 16 * Math.sin((x / W) * Math.PI * 0.9 + 0.55) - 5 * n3(x * 0.03, 2) + (x < 60 ? (60 - x) * 0.12 : 0));
for (let x = 0; x < W; x++) {
  const t = nearTop(x);
  for (let y = t; y < H; y++) {
    const d = y - t;
    let col = NEAR[0];
    if (d < 2) col = NEAR[3];
    else if (d < 6) col = P.dither(x, y, NEAR[2], NEAR[3], 0.25);
    else if (d < 14) col = P.dither(x, y, NEAR[1], NEAR[2], 1 - (d - 6) / 8);
    else if (d < 26) col = P.dither(x, y, NEAR[0], NEAR[1], 1 - (d - 14) / 12);
    P.setPx(c, x, y, col);
  }
}
// grass tufts on the crest
for (let x = 0; x < W; x += 1) {
  if (!r.chance(0.35)) continue;
  const t = nearTop(x), h = r.int(1, 3);
  for (let k = 1; k <= h; k++) P.setPx(c, x, t - k, k === h ? NEAR[3] : NEAR[2]);
}
// grass clumps texture on the slope
for (let i = 0; i < 260; i++) {
  const x = r.int(0, W - 1), y = r.int(nearTop(x) + 6, H - 1);
  const d = y - nearTop(x);
  const col = d < 20 ? NEAR[2] : NEAR[1];
  P.setPx(c, x, y, col); P.setPx(c, x + 1, y - 1, col); P.setPx(c, x + 2, y, col);
}

// ── single autumn tree on the near hill, right of centre ──────────
const tx = 302, tBase = nearTop(tx) + 2;
// trunk + branches in cottage colours (dark bark)
P.fillRect(c, tx - 1, tBase - 22, 3, 22, COT[0]);
for (let y = tBase - 20; y < tBase; y += 2) P.setPx(c, tx - 1, y, COT[1]);
P.line(c, tx, tBase - 13, tx - 7, tBase - 21, COT[0]);
P.line(c, tx + 1, tBase - 15, tx + 8, tBase - 22, COT[0]);
P.line(c, tx - 4, tBase - 17, tx - 9, tBase - 19, COT[0]);
P.setPx(c, tx - 2, tBase - 1, COT[0]); P.setPx(c, tx + 2, tBase - 1, COT[0]);
P.setPx(c, tx - 3, tBase - 1, COT[0]); P.setPx(c, tx + 3, tBase - 1, COT[0]);
// canopy: light from upper-left (the plum horizon glow behind)
const TONES = [TREE[0], TREE[0], TREE[1], TREE[2], TREE[3]];
P.canopy(c, r, { cx: tx - 1, cy: tBase - 34, rx: 21, ry: 15, clumps: 60, tones: TONES, light: [0.7, 0.75], clump: [3, 5], speckle: 0.35 });
P.canopy(c, r, { cx: tx + 13, cy: tBase - 27, rx: 10, ry: 8, tones: TONES, light: [0.7, 0.75], clump: [2, 4], clumps: 10, speckle: 0.3 });
P.canopy(c, r, { cx: tx - 15, cy: tBase - 26, rx: 10, ry: 7, tones: TONES, light: [0.7, 0.75], clump: [2, 4], clumps: 9, speckle: 0.3 });
// branch peeks through the canopy bottom
P.line(c, tx, tBase - 20, tx, tBase - 24, COT[0]);
// fallen leaves under / downwind of the tree
for (let i = 0; i < 40; i++) {
  const x = Math.round(tx + r.range(-26, 34)), y = r.int(tBase - 1, tBase + 10);
  if (y < nearTop(x)) continue;
  P.setPx(c, x, y, r.chance(0.3) ? TREE[2] : TREE[1]);
}
// a couple of leaves in the air
for (const [dx, dy] of [[24, -14], [31, -8], [40, -3], [-22, -6]]) P.setPx(c, tx + dx, tBase + dy, TREE[2]);

// ── small life: a cat sitting on the crest watching the fireflies ─
{
  const cx = 84, b = nearTop(cx) - 1, K = NEAR[0];
  // body (sitting, facing right), tail curling left on the ground
  P.ellipse(c, cx, b - 3, 3, 3, K);
  P.fillRect(c, cx - 2, b - 2, 6, 3, K);
  P.ellipse(c, cx + 2, b - 8, 2, 2, K); // head
  P.setPx(c, cx + 1, b - 11, K); P.setPx(c, cx + 3, b - 11, K); // ears
  P.setPx(c, cx + 1, b - 10, K); P.setPx(c, cx + 3, b - 10, K);
  P.line(c, cx - 3, b, cx - 7, b, K); P.setPx(c, cx - 8, b - 1, K);
  P.setPx(c, cx + 3, b - 8, FLY[0]); // eye catching firefly light
}
// a short leaning fence on the near crest, left of the tree
for (let k = 0; k < 5; k++) {
  const fx = 190 + k * 7, fb = nearTop(fx) + 1;
  P.fillRect(c, fx, fb - 6 + (k === 3 ? 1 : 0), 1, 6, COT[0]);
}
for (const dy of [4, 2]) for (let fx = 190; fx < 219; fx++) P.setPx(c, fx, Math.round(nearTop(190) + (nearTop(218) - nearTop(190)) * (fx - 190) / 28) + 1 - dy, COT[0]);

// ── fireflies over the near hill only ─────────────────────────────
let flies = 0;
for (let i = 0; i < 200 && flies < 44; i++) {
  const x = r.int(4, W - 5), y = r.int(nearTop(x) - 18, H - 4);
  if (y < 160) continue;
  // cluster more around the tree and the lower-left meadow, fewer in the middle
  const near = Math.abs(x - tx) < 70 || x < 110;
  if (!near && r.chance(0.6)) continue;
  const k = r();
  if (k > 0.55) {
    // halo firefly
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) P.setPx(c, x + dx, y + dy, FLY[0]);
    P.setPx(c, x, y, FLY[2]);
  } else P.setPx(c, x, y, k > 0.3 ? FLY[1] : FLY[0]);
  flies++;
}

// ── foreground: darker grass lip at the bottom corners (framing) ──
for (let x = 0; x < W; x++) {
  const edge = Math.max(0, 1 - Math.min(x, W - 1 - x) / 70);
  const top = Math.round(H - 4 - edge * 14 - 3 * n2(x * 0.15, 9));
  for (let y = top; y < H; y++) P.setPx(c, x, y, NEAR[0]);
  if (r.chance(0.5)) P.setPx(c, x, top - 1, NEAR[0]);
  if (r.chance(0.12)) { P.setPx(c, x, top - 2, NEAR[0]); P.setPx(c, x, top - 3, NEAR[1]); }
}

await P.save(c, OUT);
await P.preview(OUT, PREV, 3);

// darkness budget (SCENES.md 1.1)
const lum = (i) => 0.2126 * c.data[i] + 0.7152 * c.data[i + 1] + 0.0722 * c.data[i + 2];
let dark = 0, bright = 0, topSum = 0, topOver = 0;
const capL = 0.2126 * 0x8a + 0.7152 * 0x6a + 0.0722 * 0x9a;
const allowTop = new Set(STAR);
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * 4, L = lum(i);
  if (L <= 70) dark++;
  if (L > 150) bright++;
  if (y < 90) { topSum += L; if (L > capL && !allowTop.has(P.getPx(c, x, y))) topOver++; }
}
console.log(`dark<=70: ${(100 * dark / (W * H)).toFixed(1)}%  bright>150: ${(100 * bright / (W * H)).toFixed(2)}%  top40% avg: ${(topSum / (W * 90)).toFixed(1)}  top over cap (non-star): ${topOver}  fireflies: ${flies}`);
