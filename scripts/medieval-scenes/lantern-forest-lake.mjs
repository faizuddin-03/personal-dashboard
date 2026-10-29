// Scene e: lantern-forest-lake (eAuto runner pages). Spec: app/styles/medieval/SCENES.md §3e.
// Night forest path beside a lake: crescent moon, far pine shore with tiny lit
// cottages, lake with long lantern reflections, dirt path with 3 lantern posts,
// a jetty with an end lantern and a cat, autumn canopies framing the bottom edges.
// Run from repo root: node scripts/medieval-scenes/lantern-forest-lake.mjs
import * as P from './lib.mjs';

const W = 400, H = 225;
const OUT = 'public/medieval/scenes/lantern-forest-lake.png';
const PREV = 'data/agents/tmp/scenes/lantern-forest-lake@3x.png';

// ── palette (SCENES.md §3e only) ──
const SKY = ['#070a14', '#0c1220', '#131a2e', '#1c2238', '#2a2a44'];
const MOON = ['#4a4e6a', '#b8b4c8', '#f0e8d0'];
const PINE = ['#060a12', '#0c141c', '#142028'];
const LAKE = ['#05080f', '#0b1424', '#14223a', '#24345a'];
const GND = ['#0a0a0c', '#18120e', '#2a2018', '#3e3024'];
const LAN = ['#2a1a10', '#7a4a22', '#e89a40', '#ffd27a'];
const CAN = ['#200c10', '#4a1a16', '#7e3420', '#b8582a', '#e0903a'];

const r = P.rng(5150);
const c = P.create(W, H, SKY[0]);

// ── sky: calm, banded, darkest at top ──
P.skyBands(c, 0, 128, SKY, 5);
const skyCopy = new Uint8Array(c.data);
P.stars(c, r, { count: 55, yMax: 100, colors: MOON });
// a few extra faint stars lower down near the horizon glow
P.scatter(c, r, { x0: 0, y0: 70, x1: W, y1: 112, count: 14, colors: [MOON[0]], big: 0 });

// crescent moon top right: halo, disc, then bite restored from the clean sky
const MX = 338, MY = 30;
P.glow(c, { cx: MX, cy: MY, r: 11, rings: [SKY[2], SKY[3]], step: 4, outer: 0.25 });
P.circle(c, MX, MY, 9, (x, y) => (x - MX + (y - MY) > 6 ? MOON[1] : MOON[2]));
// bite: back to the halo colour so only a thin crescent remains
P.circle(c, MX - 5, MY - 3, 8, (x, y) => (Math.hypot(x - MX, y - MY) > 9.5 ? P.getPx(c, x, y) : SKY[2]));
// rim shading of the crescent (dim inner edge)
for (let y = MY - 10; y <= MY + 10; y++) for (let x = MX - 10; x <= MX + 10; x++) {
  const inMoon = Math.hypot(x - MX, y - MY) <= 9.5, inBite = Math.hypot(x - MX + 5, y - MY + 3) <= 8.5;
  if (inMoon && !inBite && Math.hypot(x - MX + 5, y - MY + 3) <= 10) P.setPx(c, x, y, MOON[0]);
}

// ── far shore: hazy back ridge, then dense pine line ──
P.ridge(c, { y: 122, amp: 12, freq: 0.025, seed: 51, col: PINE[2], bottom: 134 });
P.fog(c, { y0: 108, y1: 128, col: SKY[4], max: 0.35 });
// tiny cottages on the far shore (before front pines so trees overlap them)
const farWins = [];
for (const [hx, hw] of [[96, 9], [118, 7], [232, 8]]) {
  const by = 129;
  P.fillRect(c, hx, by - 5, hw, 5, PINE[1]);
  P.polygon(c, [[hx - 1, by - 4], [hx + hw / 2, by - 9], [hx + hw + 1, by - 4]], PINE[0]);
  const wx = hx + 2;
  P.setPx(c, wx, by - 3, LAN[3]); P.setPx(c, wx + 1, by - 3, LAN[2]);
  P.setPx(c, wx - 1, by - 3, LAN[1]); P.setPx(c, wx + 2, by - 3, LAN[1]);
  if (hw > 7) { P.setPx(c, hx + hw - 3, by - 2, LAN[2]); farWins.push(hx + hw - 3); }
  farWins.push(wx);
}
// thin smoke from the first cottage
for (let i = 0; i < 16; i++) P.setPx(c, 99 + Math.round(Math.sin(i * 0.5) * 1.5 + i * 0.3), 118 - i, (i & 1) ? SKY[4] : PINE[2]);
for (let x = -4; x < W; x += r.int(4, 8)) {
  if (farWins.some((w) => Math.abs(w - x) < 3)) continue;
  P.pine(c, r, { x, baseY: 132, h: r.int(8, 15), w: r.int(5, 8), col: PINE[1] });
}
P.ridge(c, { y: 132, amp: 2, freq: 0.1, seed: 52, col: PINE[0], bottom: 134 });

// ── lake ──
const LY0 = 134;
P.fillRect(c, 0, LY0, W, H - LY0, LAKE[1]);
// mirrored dark shore band just under the far shore
for (let x = 0; x < W; x++) {
  const d = 3 + Math.round(P.noise2(53)(x * 0.08, 1) * 6);
  for (let y = LY0; y < LY0 + d; y++) P.setPx(c, x, y, LAKE[0]);
  if (d > 6) P.setPx(c, x, LY0 + d, (x & 1) ? LAKE[0] : LAKE[1]);
}
// upside-down pine tips reflected under the dark shore band
for (let x = 2; x < W; x += r.int(5, 9)) {
  let y = LY0; while (y < LY0 + 12 && P.getPx(c, x, y) === LAKE[0]) y++;
  const h = r.int(2, 5);
  for (let k = 0; k < h; k++) if (k % 2 === 0 || r.chance(0.5)) P.fillRect(c, x - ((h - k) >> 1), y + k, Math.max(1, h - k), 1, LAKE[0]);
}
// ripple lines, sparser and shorter near the far shore
for (let y = LY0 + 4; y < H; y += 2) {
  const p = 0.03 + (y - LY0) / (H - LY0) * 0.06;
  for (let x = 0; x < W; x++) if (r.chance(p)) P.fillRect(c, x, y, r.int(2, 3 + ((y - LY0) >> 4)), 1, LAKE[2]);
}
// moon reflection: broken column of short dashes
for (let y = LY0 + 6; y < 200; y += 2) {
  const spread = 2 + Math.round((y - LY0) / 12);
  if (r.chance(0.75)) P.fillRect(c, MX - r.int(0, spread), y, r.int(2, spread + 2), 1, y < LY0 + 20 ? MOON[0] : LAKE[3]);
  if (r.chance(0.25)) P.fillRect(c, MX - r.int(0, 2), y, 2, 1, MOON[1]);
}
// far cottage window reflections: thin broken streaks
for (const wx of farWins) for (let y = LY0 + 2; y < LY0 + 22; y += 2) if (r.chance(0.6)) P.fillRect(c, wx - r.int(0, 1), y, r.int(1, 2), 1, y < LY0 + 10 ? LAN[2] : LAN[1]);

// ── jetty on the right with an end lantern ──
const JY = 186, JX0 = 236, JX1 = 318;
// lantern reflection first (long, in open water below and around the jetty end)
function lanternReflection(x, y0, y1, wmax) {
  for (let y = y0; y < y1; y += 2) {
    const t = (y - y0) / (y1 - y0), w = 1 + Math.round(t * wmax);
    if (!r.chance(0.8 - t * 0.3)) continue;
    const col = t < 0.25 ? LAN[3] : t < 0.6 ? LAN[2] : LAN[1];
    P.fillRect(c, x - r.int(0, w), y, r.int(1, w + 1), 1, col);
    if (r.chance(0.4)) P.fillRect(c, x + r.int(2, w + 3), y, r.int(1, 2), 1, LAN[1]);
  }
}
// lantern glow sitting on the water around the jetty end
P.glow(c, { cx: JX1 - 2, cy: JY + 4, r: 10, rings: [LAKE[3], LAKE[2]], step: 6, outer: 0.5, squash: 0.35 });
lanternReflection(JX1 - 2, JY + 4, H, 4);
// planks (top surface), front edge, posts into water
P.fillRect(c, JX0, JY - 2, JX1 - JX0, 2, GND[3]);
for (let x = JX0; x < JX1; x += 4) P.setPx(c, x, JY - 2, GND[2]);
P.fillRect(c, JX0, JY, JX1 - JX0, 2, LAN[0]);
for (const px of [JX0 + 14, JX0 + 40, JX0 + 66, JX1 - 2]) {
  P.fillRect(c, px, JY + 2, 2, 6, LAN[0]);
  P.fillRect(c, px - 1, JY + 8, 4, 1, LAKE[2]); // ripple ring at the post
}
// cat sitting on the jetty, facing the water, tail curled
function cat(x, y) {
  const k = GND[0];
  P.fillRect(c, x, y - 4, 4, 4, k); // body
  P.fillRect(c, x + 1, y - 7, 3, 3, k); // head
  P.setPx(c, x + 1, y - 8, k); P.setPx(c, x + 3, y - 8, k); // ears
  P.setPx(c, x + 3, y - 6, LAN[3]); // one eye catching the light
  P.setPx(c, x - 1, y - 1, k); P.setPx(c, x - 2, y - 2, k); P.setPx(c, x - 2, y - 3, k); // tail
  P.setPx(c, x + 4, y - 3, LAN[1]); // rim light on chest
}
cat(JX1 - 24, JY - 2);

// ── near shore (left and bottom) ──
const shore = [[0, 146], [40, 150], [90, 160], [140, 170], [190, 182], [232, 190], [250, 200], [282, 212], [330, 220], [400, 222], [400, 225], [0, 225]];
P.polygon(c, shore, GND[0]);
// grass lip along the waterline
for (let i = 0; i + 1 < shore.length - 3; i++) {
  const [ax, ay] = shore[i], [bx, by] = shore[i + 1];
  for (let x = ax; x < bx; x++) {
    const y = Math.round(ay + ((by - ay) * (x - ax)) / (bx - ax));
    P.setPx(c, x, y, GND[1]);
    if (r.chance(0.3)) P.setPx(c, x, y - 1, GND[1]);
    if (r.chance(0.5)) P.setPx(c, x, y + 1, LAKE[0]);
  }
}
// grass tufts texture on the ground
const gn = P.noise2(54);
for (let y = 150; y < H; y++) for (let x = 0; x < W; x++) {
  if (P.getPx(c, x, y) !== GND[0]) continue;
  if (gn(x * 0.15, y * 0.3) > 0.62 && ((x + y * 3) % 5 === 0)) P.setPx(c, x, y, GND[1]);
}

// reeds at the waterline
for (const [rx0, n] of [[108, 7], [214, 6], [262, 5], [300, 4]]) {
  for (let k = 0; k < n; k++) {
    const x = rx0 + k * 2 + r.int(0, 1);
    let y = 0; while (y < H && P.getPx(c, x, y) !== GND[0] && P.getPx(c, x, y) !== GND[1]) y++;
    const h = r.int(3, 7);
    P.line(c, x, y, x + (k & 1), y - h, k % 3 ? PINE[1] : GND[1]);
    if (r.chance(0.3)) P.fillRect(c, x + (k & 1), y - h, 1, 2, CAN[1]); // cattail head
  }
}
// low shrubs along the shore, dark with a warm rim on the lantern side
const SHRUB = [PINE[0], CAN[0], CAN[1], CAN[2], CAN[3]];
P.canopy(c, P.rng(5160), { cx: 124, cy: 170, rx: 9, ry: 5, tones: SHRUB, light: [-0.8, 0.3], clump: [2, 3] });
P.canopy(c, P.rng(5161), { cx: 226, cy: 196, rx: 10, ry: 6, tones: SHRUB, light: [0.8, 0.3], clump: [2, 3] });
P.canopy(c, P.rng(5162), { cx: 110, cy: 196, rx: 12, ry: 6, tones: SHRUB, light: [-0.8, -0.2], clump: [2, 3] });
// fallen leaves on the ground
for (let i = 0; i < 70; i++) {
  const x = r.int(40, 300), y = r.int(168, 224);
  if (P.getPx(c, x, y) === GND[0] || P.getPx(c, x, y) === GND[1]) P.setPx(c, x, y, r.pick([CAN[0], CAN[1], CAN[1], CAN[2]]));
}

// mid-ground pine silhouettes the path curves into (left)
for (const [x, h, w] of [[6, 46, 20], [24, 38, 16], [52, 30, 13], [70, 22, 10]]) P.pine(c, r, { x, baseY: 156 + (x >> 3), h, w, col: PINE[0], edge: PINE[1] });

// dirt path: from the bottom edge curving left into the trees
const pathPts = [[66, 160], [96, 166], [140, 175], [170, 186], [176, 198], [160, 212], [140, 226]];
(function path() {
  const S = [];
  for (let i = 0; i + 1 < pathPts.length; i++) {
    const [ax, ay] = pathPts[i], [bx, by] = pathPts[i + 1], L = Math.hypot(bx - ax, by - ay);
    for (let s = 0; s < L; s += 0.5) S.push([ax + ((bx - ax) * s) / L, ay + ((by - ay) * s) / L]);
  }
  S.forEach(([x, y], i) => {
    const t = i / S.length, wd = 3 + t * 34;
    const x0 = Math.round(x - wd / 2), x1 = Math.round(x + wd / 2);
    for (let xx = x0; xx <= x1; xx++) {
      const edge = xx - x0 < 1 + t * 2 || x1 - xx < 1 + t * 2;
      P.setPx(c, xx, Math.round(y), edge ? GND[1] : GND[2]);
    }
  });
  // wheel ruts in the near half
  S.forEach(([x, y], i) => {
    const t = i / S.length; if (t < 0.45 || (i & 3)) return;
    const wd = 3 + t * 34;
    P.setPx(c, Math.round(x - wd * 0.22), Math.round(y), GND[1]);
    P.setPx(c, Math.round(x + wd * 0.22), Math.round(y), GND[1]);
  });
  // pebbles
  for (let i = 0; i < 90; i++) {
    const [x, y] = S[r.int(Math.floor(S.length * 0.15), S.length - 1)];
    const t = (y - 160) / 66, px = Math.round(x + r.range(-12, 12) * t), py = Math.round(y);
    if (P.getPx(c, px, py) !== GND[2]) continue;
    P.setPx(c, px, py, GND[3]); if (t > 0.5) { P.setPx(c, px + 1, py, GND[3]); P.setPx(c, px, py + 1, GND[1]); }
  }
  // edge stones and grass overhang
  S.forEach(([x, y], i) => {
    const t = i / S.length; if (i % Math.max(3, Math.round(10 - t * 6))) return;
    const wd = 3 + t * 34;
    for (const sd of [-1, 1]) {
      const ex = Math.round(x + sd * (wd / 2)), ey = Math.round(y);
      if (r.chance(0.5)) P.fillRect(c, ex - (sd < 0 ? 0 : 1), ey, t > 0.5 ? 2 : 1, 1, GND[3]);
      else P.setPx(c, ex + sd, ey - 1, PINE[1]);
    }
  });
})();
// grass tufts on the open ground
for (let i = 0; i < 140; i++) {
  const x = r.int(30, 330), y = r.int(166, 224);
  if (P.getPx(c, x, y) !== GND[0]) continue;
  const col = r.chance(0.7) ? GND[1] : PINE[1];
  P.setPx(c, x, y, col); P.setPx(c, x - 1, y - 1, col); P.setPx(c, x + 1, y - 1, col);
  if (r.chance(0.4)) P.setPx(c, x, y - 2, col);
}

// lanterns: post, arm, hanging lamp with warm 3-ring glow and lit ground pool
function lantern(x, baseY, h, s = 1) {
  const top = baseY - h;
  // light pool on the ground first: stepped, brighter at the centre
  const pcx = x + 4 * s, prx = 16 * s, pry = 5 * s;
  P.ellipse(c, pcx, baseY + 1, prx, pry, (xx, yy) => {
    const cur = P.getPx(c, xx, yy);
    const d = Math.hypot((xx - pcx) / prx, (yy - baseY - 1) / pry);
    if (![GND[0], GND[1], GND[2], CAN[0], CAN[1]].includes(cur)) return cur;
    if (cur === GND[2] || (cur === GND[1] && d < 0.5)) return d < 0.6 ? GND[3] : P.dither(xx, yy, cur, GND[3], 0.5);
    if (d < 0.55) return P.dither(xx, yy, GND[1], GND[2], 0.6);
    return P.dither(xx, yy, cur, GND[1], 0.6);
  });
  P.fillRect(c, x, top, s > 0.8 ? 2 : 1, h, LAN[0]); // post
  P.fillRect(c, x, top, Math.round(5 * s), 1, LAN[0]); // arm
  const lx = x + Math.round(4 * s), ly = top + 2 + Math.round(2 * s);
  P.glow(c, { cx: lx, cy: ly + 1, r: Math.round(3 * s), rings: [LAN[1], LAN[0], LAN[0]], step: Math.max(2, Math.round(3.5 * s)), outer: 0.3 });
  P.setPx(c, x + (s > 0.8 ? 2 : 1), top + 1, LAN[1]); // rim light on the post top
  P.fillRect(c, lx, top + 1, 1, 2, LAN[0]); // chain
  P.fillRect(c, lx - 1, ly - 1, 3, 1, LAN[0]); // cap
  P.fillRect(c, lx - 1, ly, 3, Math.max(2, Math.round(3 * s)), LAN[2]);
  P.setPx(c, lx, ly + 1, LAN[3]);
  P.fillRect(c, lx - 1, ly + Math.max(2, Math.round(3 * s)), 3, 1, LAN[0]);
}
lantern(92, 164, 14, 0.6);
lantern(150, 178, 20, 0.8);
lantern(196, 205, 30, 1.2);
// jetty-end lantern
lantern(JX1 - 3, JY - 2, 20, 0.9);

// ── autumn canopies framing the bottom edges ──
// left: big tree, lit on its right (lantern) side
// night tones: the brightest leaf colour is kept for lantern-facing highlights only
const NIGHT = [PINE[0], CAN[0], CAN[1], CAN[2], CAN[3]];
P.trunk(c, r, { x: 22, baseY: 225, h: 70, w: 5, col: [CAN[0], CAN[1]] });
P.canopy(c, P.rng(5151), { cx: 6, cy: 156, rx: 44, ry: 30, tones: NIGHT, light: [-0.9, 0.25], clump: [3, 6] });
P.canopy(c, P.rng(5152), { cx: 26, cy: 198, rx: 30, ry: 18, tones: NIGHT, light: [-0.9, -0.1], clump: [3, 5] });
// lantern-side rim: brighten the right-most lit leaves with the top two tones
for (let y = 120; y < H; y++) {
  let edge = -1;
  for (let x = 70; x >= 0; x--) { const p = P.getPx(c, x, y); if (NIGHT.includes(p) && p !== PINE[0]) { edge = x; break; } }
  if (edge < 0) continue;
  for (let k = 0; k < 6; k++) {
    const x = edge - k, p = P.getPx(c, x, y);
    if (p === CAN[3] && (k < 2 || r.chance(0.5))) P.setPx(c, x, y, CAN[4]);
    else if (p === CAN[2] && k < 3 && r.chance(0.6)) P.setPx(c, x, y, CAN[3]);
  }
}
// right: darker tree, only its left edge catches the jetty lantern
P.trunk(c, r, { x: 382, baseY: 225, h: 70, w: 5, col: [CAN[0], CAN[1]] });
P.canopy(c, P.rng(5153), { cx: 396, cy: 168, rx: 40, ry: 34, tones: [PINE[0], CAN[0], CAN[1], CAN[2], CAN[3]], light: [0.9, 0.1], clump: [3, 6] });
P.canopy(c, P.rng(5154), { cx: 368, cy: 212, rx: 26, ry: 15, tones: [PINE[0], CAN[0], CAN[1], CAN[2], CAN[3]], light: [0.9, -0.2], clump: [3, 5] });

// falling leaves (lower half only) and a few lantern sparks
P.scatter(c, r, { x0: 40, y0: 150, x1: 360, y1: 222, count: 12, colors: [CAN[2], CAN[3]], big: 0.3 });
// a few drifting sparks only right around the lantern heads
for (const [sx, sy] of [[96, 152], [155, 162], [203, 180], [318, 170]])
  for (let k = 0; k < 3; k++) P.setPx(c, sx + r.int(-6, 6), sy - r.int(2, 10), r.pick([LAN[1], LAN[2]]));

// ── output + checks ──
await P.save(c, OUT);
await P.preview(OUT, PREV, 3);
let dark = 0, bright = 0, topSum = 0, topMax = 0, topOver = 0;
const lum = (i) => 0.2126 * c.data[i] + 0.7152 * c.data[i + 1] + 0.0722 * c.data[i + 2];
const capL = 0.2126 * 0x8a + 0.7152 * 0x6a + 0.0722 * 0x9a;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const L = lum((y * W + x) * 4);
  if (L <= 70) dark++; if (L > 150) bright++;
  if (y < 90) { topSum += L; topMax = Math.max(topMax, L); if (L > capL) topOver++; }
}
console.log(`dark<=70: ${(100 * dark / (W * H)).toFixed(1)}%  bright>150: ${(100 * bright / (W * H)).toFixed(2)}%  top40 avg: ${(topSum / (W * 90)).toFixed(1)}  top40 px over cap: ${topOver} (stars/moon)`);
