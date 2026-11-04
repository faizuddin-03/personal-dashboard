// Dragons style scene: Berk at night (Faizuddin, 2026-10-29: "a theme of how to
// train your dragon ... for the dashboard page only"). Original pixel art made
// here, no film assets: a northern night sky with aurora and moon, the sea, sea
// stacks, and the Viking village on its cliff. Toothless and Light Fury are
// separate sprites (sprites.mjs) that fly over it.
// Run from repo root: node scripts/dragon-scenes/berk-night.mjs
import * as P from '../medieval-scenes/lib.mjs';

const W = 400, H = 225;
const OUT = 'public/dragons/berk-night.png';
const PREV = 'data/agents/tmp/scenes/berk-night@3x.png';

const SKY = ['#060a18', '#0a1022', '#0e162e', '#13203c', '#1a2b4a', '#22385a'];
const STAR = ['#3a4a6a', '#9fb2d4', '#eef4ff'];
const AUR = ['#0f3a3a', '#16584c', '#1f7a5e', '#3fbf8a'];
const MOON = ['#c9d6ec', '#eef3fb', '#9fb0cc'];
const SEA = ['#050a14', '#0a1424', '#122038', '#2a4064'];
const ROCK = ['#05070d', '#0b101b', '#141c2c', '#1f2a3e'];
const HUT = { wall: '#1a1410', roof: '#0e0b09', trim: '#2a2018' };
const WIN = ['#d98a36', '#ffcf7a'];

const c = P.create(W, H, SKY[0]);
const r = P.rng(4242);
const n1 = P.noise2(91), n2 = P.noise2(92);

// ── sky bands, lighter toward the horizon ─────────────────────────
const stops = [[0, 0], [40, 1], [80, 2], [112, 3], [134, 4], [150, 5]];
for (let y = 0; y < 170; y++) {
  let i = 0;
  for (let k = 0; k < stops.length; k++) if (y >= stops[k][0]) i = k;
  const next = stops[i + 1];
  for (let x = 0; x < W; x++) {
    let col = SKY[i];
    if (next) {
      const soft = 6, into = y - (next[0] - soft);
      if (into >= 0) col = P.dither(x, y, SKY[i], SKY[i + 1], (into + 0.5) / soft);
    }
    P.setPx(c, x, y, col);
  }
}

// ── stars ─────────────────────────────────────────────────────────
for (let i = 0; i < 70; i++) {
  const x = r.int(2, W - 3), y = Math.floor(Math.pow(r(), 1.5) * 120), k = r();
  if (k > 0.92) {
    P.setPx(c, x, y, STAR[2]);
    for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) P.setPx(c, x + dx, y + dy, STAR[0]);
  } else P.setPx(c, x, y, k > 0.6 ? STAR[1] : STAR[0]);
}

// ── aurora: two soft ribbons across the upper sky ─────────────────
function ribbon(y0, amp, freq, phase, thick, x0, x1) {
  for (let x = x0; x < x1; x++) {
    const fade = Math.min(1, (x - x0) / 40, (x1 - x) / 40);
    const cy = y0 + amp * Math.sin(x * freq + phase) + 6 * n1(x * 0.02, phase);
    for (let d = 0; d < thick; d++) {
      const y = Math.round(cy - d);
      const t = (1 - d / thick) * fade;
      const col = d < 2 ? AUR[3] : d < 5 ? AUR[2] : d < 10 ? AUR[1] : AUR[0];
      if (P.bayer(x, y) < t * (d < 2 ? 0.55 : 0.8)) P.setPx(c, x, y, col);
    }
  }
}
ribbon(62, 10, 0.018, 0.4, 22, 20, 300);
ribbon(84, 7, 0.026, 2.1, 14, 140, 390);

// ── moon, upper right, with a faint halo ──────────────────────────
P.glow(c, { cx: 330, cy: 38, r: 14, rings: [SKY[2], SKY[1]], step: 4 });
P.circle(c, 330, 38, 11, MOON[0]);
P.circle(c, 328, 36, 9, MOON[1]);
for (const [x, y, rr] of [[333, 41, 2], [326, 33, 1], [336, 34, 1]]) P.circle(c, x, y, rr, MOON[2]);

// ── far sea stacks on the horizon ────────────────────────────────
const SEA_Y = 168;
function stack(x, w, h, col, edge) {
  const top = SEA_Y - h;
  for (let xx = x; xx < x + w; xx++) {
    const t = (xx - x) / (w - 1);
    // tapered, jagged top: sea stacks, not rounded stones
    const drop = Math.round(Math.pow(Math.abs(t - 0.45) * 2, 1.4) * h * 0.45 + 4 * n2(xx * 0.45, x));
    const y0 = top + drop;
    for (let y = y0; y < SEA_Y; y++) P.setPx(c, xx, y, (xx - x) < 2 && y > y0 + 2 ? ROCK[0] : col);
    if (edge && xx % 2 === 0) P.setPx(c, xx, y0, edge);
    // a strata line or two
    if ((xx + x) % 5 === 0) P.setPx(c, xx, y0 + Math.round(h * 0.4), ROCK[0]);
  }
}
stack(176, 12, 26, ROCK[2], ROCK[3]);
stack(214, 7, 18, ROCK[2], ROCK[3]);
stack(262, 16, 34, ROCK[1], ROCK[3]);
stack(300, 9, 22, ROCK[2], ROCK[3]);
stack(372, 22, 46, ROCK[1], ROCK[2]);

// ── sea with a moon path ─────────────────────────────────────────
P.water(c, r, { y0: SEA_Y, y1: H, base: SEA[1], ripple: SEA[2], reflect: [[330, SEA[3], 5], [330, MOON[2], 2]] });
for (let x = 0; x < W; x++) if (x % 3) P.setPx(c, x, SEA_Y, SEA[2]);

// ── Berk: the cliff and village on the left ─────────────────────
const cliffTop = (x) => Math.round(122 + x * 0.12 + 5 * n1(x * 0.05, 3) + (x > 140 ? (x - 140) * 1.4 : 0));
for (let x = 0; x < 175; x++) {
  const t = cliffTop(x);
  for (let y = t; y < H; y++) {
    const d = y - t;
    const col = d < 2 ? ROCK[3] : d < 8 ? P.dither(x, y, ROCK[1], ROCK[2], 0.4) : ROCK[0];
    P.setPx(c, x, y, col);
  }
}
// a lit longhouse-style hut: wall, steep roof with crossed gable ends
function hut(x, w, h, lit) {
  const base = cliffTop(x + (w >> 1)) + 1, top = base - h;
  P.fillRect(c, x, top, w, h, HUT.wall);
  P.polygon(c, [[x - 2, top + 1], [x + (w >> 1), top - Math.round(w * 0.6)], [x + w + 1, top + 1]], HUT.roof);
  const peak = top - Math.round(w * 0.6);
  P.setPx(c, x + (w >> 1) - 1, peak - 1, HUT.trim); P.setPx(c, x + (w >> 1) + 1, peak - 1, HUT.trim);
  P.setPx(c, x + (w >> 1) - 2, peak - 2, HUT.trim); P.setPx(c, x + (w >> 1) + 2, peak - 2, HUT.trim);
  if (lit) {
    const wx = x + Math.max(1, (w >> 1) - 1), wy = top + 2;
    P.ditherRect(c, wx - 1, wy - 1, 4, 4, WIN[0], 0.3);
    P.fillRect(c, wx, wy, 2, 2, WIN[1]);
    P.setPx(c, wx + 1, wy + 1, WIN[0]);
  } else P.fillRect(c, x + 1, top + 2, 2, 2, HUT.roof);
  P.fillRect(c, x + w - 3, base - 3, 2, 3, HUT.roof);
}
for (const [x, w, h, lit] of [[10, 12, 6, 1], [28, 9, 5, 0], [42, 14, 7, 1], [62, 10, 5, 1], [80, 11, 6, 0], [97, 13, 6, 1], [116, 9, 5, 1]]) hut(x, w, h, lit);
// torches along the cliff edge
for (const tx of [24, 58, 92, 128]) {
  const b = cliffTop(tx);
  P.fillRect(c, tx, b - 5, 1, 5, HUT.trim);
  P.setPx(c, tx, b - 6, WIN[1]); P.setPx(c, tx, b - 7, WIN[0]);
}
// the great hall's carved dragon-head post on the far left
{
  const x = 4, b = cliffTop(x);
  P.fillRect(c, x, b - 16, 2, 16, HUT.roof);
  P.fillRect(c, x - 1, b - 18, 5, 3, HUT.roof);
  P.setPx(c, x + 4, b - 17, HUT.roof);
}

// ── near rock framing on the right, bottom corner ─────────────────
for (let x = 330; x < W; x++) {
  const top = Math.round(H - 6 - (x - 330) * 0.35 - 3 * n2(x * 0.1, 7));
  for (let y = top; y < H; y++) P.setPx(c, x, y, ROCK[0]);
}

await P.save(c, OUT);
await P.preview(OUT, PREV, 3);
console.log(`colours: ${P.countColors(c)}`);
