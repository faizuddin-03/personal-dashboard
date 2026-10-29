// Scene d: night-cafe (R2 mood, night version). Spec: app/styles/medieval/SCENES.md section 3d.
// Run from repo root: node scripts/medieval-scenes/night-cafe.mjs
import * as P from './lib.mjs';

const W = 400, H = 225;
const C = {
  w0: '#120c10', w1: '#1a1216', w2: '#24181c', w3: '#2e1f22', w4: '#3a2826',
  d0: '#1c120c', d1: '#2e1e14', d2: '#4a301e', d3: '#66442a',
  l0: '#5a3a22', l1: '#9a6230', l2: '#e8a848', l3: '#ffd98a',
  g0: '#0a1020', g1: '#13203a', g2: '#22345a', rain: '#3e5478',
  c0: '#16100e', c1: '#d8823a', c2: '#efe2cc', c3: '#8a7a70',
  p0: '#12201a', p1: '#24402c', p2: '#4a7040',
  m0: '#1a1a1c', m1: '#b8ac98',
  cup: '#d8c8b0', cof: '#6e4a2e', steam: '#4a3a40',
};
const r = P.rng(4242);
const c = P.create(W, H, C.w2);
const { setPx, fillRect, line, ellipse, polygon, dither, bayer } = P;

const FLOOR = 172;
// ── ceiling + wall ─────────────────────────────────────────────
fillRect(c, 0, 0, W, 16, C.w1);
for (let x = 0; x < W; x++) { setPx(c, x, 7, C.w0); }
for (let x = 37; x < W; x += 74) fillRect(c, x, 0, 1, 7, C.w0);
for (let x = 74; x < W; x += 74) fillRect(c, x, 8, 1, 8, C.w0);
fillRect(c, 0, 16, W, 4, C.d1);
fillRect(c, 0, 19, W, 1, C.d0);
fillRect(c, 0, 16, W, 1, C.d2);
// wall: darker near the ceiling, flat below
for (let y = 20; y < FLOOR; y++)
  for (let x = 0; x < W; x++) {
    let col = C.w2;
    if (y < 34) col = dither(x, y, C.w1, C.w2, (y - 20) / 14);
    setPx(c, x, y, col);
  }
// faint vertical wallpaper stripes, very subtle
for (let x = 24; x < W; x += 48) fillRect(c, x, 34, 1, 98, C.w1);

// wainscot
fillRect(c, 0, 134, W, FLOOR - 134, C.d1);
fillRect(c, 0, 132, W, 2, C.d2);
fillRect(c, 0, 132, W, 1, C.d3);
for (let x = 4; x < W; x += 9) fillRect(c, x, 135, 1, FLOOR - 135, C.d0);

// ── floor ──────────────────────────────────────────────────────
fillRect(c, 0, FLOOR, W, H - FLOOR, C.d0);
fillRect(c, 0, FLOOR, W, 2, C.w0); // skirting shadow
{
  let y = FLOOR + 4, gap = 4;
  while (y < H) {
    fillRect(c, 0, y, W, 1, C.w0);
    // staggered board ends
    for (let x = r.int(0, 40); x < W; x += r.int(50, 90)) fillRect(c, x, y - gap + 1, 1, gap - 1, C.w0);
    gap += 2; y += gap;
  }
  // grain: a few lighter dashes
  for (let i = 0; i < 70; i++) fillRect(c, r.int(0, W), r.int(FLOOR + 3, H), r.int(3, 9), 1, C.d1);
}

// ── left: curtained doorway ────────────────────────────────────
{
  const x0 = 58, x1 = 118, y0 = 46;
  fillRect(c, x0 - 3, y0 - 3, x1 - x0 + 6, FLOOR - y0 + 3, C.d1);
  fillRect(c, x0 - 3, y0 - 3, x1 - x0 + 6, 1, C.d2);
  fillRect(c, x0, y0, x1 - x0, FLOOR - y0, C.w0);
  // noren-style curtain, two panels with folds, stops above the floor
  const cy1 = 150;
  for (let x = x0; x < x1; x++) {
    const fold = (x - x0) % 10;
    const col = fold < 2 ? C.w2 : fold < 7 ? C.w3 : fold === 9 ? C.w1 : C.w4;
    const hang = x0 + (x1 - x0) / 2;
    const bottom = cy1 - Math.round(Math.abs(x - hang) < 2 ? 6 : 0);
    fillRect(c, x, y0 + 2, 1, bottom - y0 - 2, col);
  }
  fillRect(c, Math.round((x0 + x1) / 2), y0 + 2, 1, cy1 - y0, C.w0); // split
  fillRect(c, x0 - 4, y0, x1 - x0 + 8, 2, C.d3); // rod
  // dim floor of the back room
  fillRect(c, x0, cy1, x1 - x0, FLOOR - cy1, C.w0);
  // doormat
  fillRect(c, x0 + 8, FLOOR + 1, x1 - x0 - 16, 3, C.d1);
  fillRect(c, x0 + 8, FLOOR + 1, x1 - x0 - 16, 1, C.d2);
}

// ── wall sconce left of door (below row 90) ────────────────────
function sconce(x, y) {
  P.glow(c, { cx: x, cy: y + 2, r: 5, rings: [C.w4, C.w3], step: 4, outer: 0.5 });
  fillRect(c, x - 2, y - 2, 5, 6, C.l0);
  fillRect(c, x - 1, y - 1, 3, 4, C.l2);
  setPx(c, x, y, C.l3); setPx(c, x, y + 1, C.l3);
  fillRect(c, x - 2, y - 3, 5, 1, C.d2);
  fillRect(c, x - 1, y + 4, 3, 2, C.d2);
}
sconce(28, 100);
sconce(140, 100);

// ── right: tall glass partition with night outside ─────────────
const GX0 = 282, GX1 = 384, GY0 = 38, GY1 = 168;
{
  fillRect(c, GX0 - 4, GY0 - 4, GX1 - GX0 + 8, GY1 - GY0 + 8, C.d2);
  fillRect(c, GX0 - 4, GY0 - 4, GX1 - GX0 + 8, 1, C.d3);
  P.skyBands(c, GY0, GY1, [C.g0, C.g1], 10, GX0, GX1);
  // outside: dark roofline across the street
  polygon(c, [[GX0, 128], [GX0 + 18, 112], [GX0 + 36, 128], [GX0 + 50, 128], [GX0 + 50, 118], [GX0 + 70, 118], [GX0 + 82, 106], [GX0 + 94, 118], [GX1, 118], [GX1, GY1], [GX0, GY1]], C.g0);
  // rim of the far roofs
  line(c, GX0, 128, GX0 + 18, 112, C.g1); line(c, GX0 + 18, 112, GX0 + 36, 128, C.g1);
  line(c, GX0 + 70, 118, GX0 + 82, 106, C.g1); line(c, GX0 + 82, 106, GX0 + 94, 118, C.g1);
  fillRect(c, GX0 + 86, 102, 3, 8, C.g0);
  // one distant lit window + a faint second
  fillRect(c, GX0 + 76, 122, 4, 5, C.l2); fillRect(c, GX0 + 78, 122, 1, 5, C.l0);
  P.ditherRect(c, GX0 + 74, 120, 8, 9, C.l0, 0.2);
  fillRect(c, GX0 + 76, 122, 4, 5, C.l2); fillRect(c, GX0 + 78, 122, 1, 5, C.l0);
  fillRect(c, GX0 + 16, 136, 3, 3, C.l0);
  // glass sheen: two diagonal pale bands (like the reference partition)
  for (const [ox, wd] of [[GX0 + 10, 6], [GX0 + 22, 2], [GX0 + 60, 5], [GX0 + 70, 2]])
    for (let y = GY0; y < GY1; y++) for (let k = 0; k < wd; k++) {
      const x = ox + k + Math.round((GY1 - y) * 0.45) - 30;
      if (x > GX0 && x < GX1 && 0.45 > bayer(x, y)) setPx(c, x, y, C.g2);
    }
  // rain streaks
  for (let i = 0; i < 70; i++) {
    const x = r.int(GX0 + 1, GX1 - 2), y = r.int(GY0 + 1, GY1 - 6), L = r.int(2, 5);
    for (let k = 0; k < L; k++) setPx(c, x - (k >> 1), y + k, k === L - 1 ? C.g2 : C.rain);
  }
  // mullions
  const mx = Math.round((GX0 + GX1) / 2);
  fillRect(c, mx - 1, GY0, 3, GY1 - GY0, C.d2); fillRect(c, mx - 1, GY0, 1, GY1 - GY0, C.d3);
  fillRect(c, GX0, 96, GX1 - GX0, 2, C.d2); fillRect(c, GX0, 96, GX1 - GX0, 1, C.d3);
  // sill
  fillRect(c, GX0 - 6, GY1 + 3, GX1 - GX0 + 12, 3, C.d3);
  fillRect(c, GX0 - 6, GY1 + 5, GX1 - GX0 + 12, 1, C.d1);
}

// ── pendant lamp + cone (hangs over the counter) ───────────────
const LX = 216, LY = 96; // shade top
{
  // soft halo on the wall
  P.glow(c, { cx: LX, cy: LY + 10, r: 14, rings: [C.w4, C.w3], step: 10, outer: 0.5 });
  // light cone: dithered warm wedge down to the counter
  polygon(c, [[LX - 7, LY + 8], [LX + 7, LY + 8], [LX + 34, 138], [LX - 34, 138]], (x, y) => {
    const t = 0.55 - (y - LY) / 140;
    return t > bayer(x, y) ? C.l0 : P.getPx(c, x, y);
  });
  polygon(c, [[LX - 4, LY + 8], [LX + 4, LY + 8], [LX + 16, 138], [LX - 16, 138]], (x, y) => {
    const t = 0.35 - (y - LY) / 180;
    return t > bayer(x, y) ? C.l1 : P.getPx(c, x, y);
  });
  // cord
  fillRect(c, LX, 20, 1, LY - 20, C.d0);
  fillRect(c, LX - 1, 20, 3, 2, C.d2);
  // brass shade (bell)
  polygon(c, [[LX - 3, LY], [LX + 4, LY], [LX + 10, LY + 8], [LX - 9, LY + 8]], C.l1);
  fillRect(c, LX - 2, LY - 2, 5, 2, C.l0);
  line(c, LX + 4, LY + 1, LX + 8, LY + 6, C.l2); // rim light
  fillRect(c, LX - 9, LY + 8, 20, 1, C.l0);
  fillRect(c, LX - 3, LY + 9, 7, 2, C.l3); // bulb
  fillRect(c, LX - 5, LY + 9, 2, 1, C.l2); fillRect(c, LX + 4, LY + 9, 2, 1, C.l2);
}

// ── wall shelf with jars (left of lamp, below row 90) ──────────
{
  const sy = 116;
  fillRect(c, 150, sy, 44, 2, C.d3); fillRect(c, 150, sy + 2, 44, 1, C.d0);
  fillRect(c, 154, sy + 3, 2, 4, C.d1); fillRect(c, 188, sy + 3, 2, 4, C.d1);
  // jars
  fillRect(c, 154, sy - 7, 5, 7, C.d2); fillRect(c, 154, sy - 8, 5, 1, C.d3); fillRect(c, 158, sy - 6, 1, 5, C.d1);
  fillRect(c, 161, sy - 5, 4, 5, C.cof); fillRect(c, 161, sy - 6, 4, 1, C.d3);
  fillRect(c, 168, sy - 9, 3, 9, C.w4); fillRect(c, 168, sy - 10, 3, 1, C.d3);
  // tiny pot plant on shelf
  fillRect(c, 178, sy - 4, 5, 4, C.d2);
  for (const [dx, dy, col] of [[0, -5, C.p1], [1, -6, C.p2], [3, -7, C.p2], [4, -5, C.p1], [2, -8, C.p1], [-1, -6, C.p1], [5, -6, C.p2]]) setPx(c, 178 + dx, sy + dy, col);
}

// ── counter ────────────────────────────────────────────────────
{
  const x0 = 158, x1 = 272, top = 138;
  fillRect(c, x0, top + 3, x1 - x0, FLOOR - top - 3, C.d2);
  for (let x = x0 + 10; x < x1; x += 19) { fillRect(c, x, top + 6, 1, FLOOR - top - 9, C.d1); fillRect(c, x + 1, top + 6, 1, FLOOR - top - 9, C.d3); }
  fillRect(c, x0, top + 3, x1 - x0, 2, C.d0); // under-lip shadow
  fillRect(c, x0 + 3, FLOOR - 3, x1 - x0 - 6, 3, C.d0); // kick
  fillRect(c, x0 - 3, top, x1 - x0 + 6, 3, C.d3);
  fillRect(c, x0 - 3, top + 2, x1 - x0 + 6, 1, C.d1);
  // light pool on the counter top
  for (let x = LX - 30; x <= LX + 30; x++) {
    const d = Math.abs(x - LX);
    setPx(c, x, top, d < 12 ? C.l2 : d < 22 ? C.l1 : dither(x, top, C.d3, C.l1, 0.5));
    setPx(c, x, top + 1, d < 18 ? C.l1 : C.d3);
  }
  // coffee machine (right end)
  fillRect(c, 248, 120, 16, 18, C.d1);
  fillRect(c, 248, 120, 16, 2, C.d2);
  fillRect(c, 248, 120, 1, 18, C.l0);
  fillRect(c, 252, 126, 8, 6, C.w0);
  fillRect(c, 255, 126, 2, 3, C.d2);
  setPx(c, 261, 123, C.l2);
  fillRect(c, 254, 133, 4, 3, C.cup);
  // two cups + a jar near the lamp
  fillRect(c, 200, 133, 5, 5, C.cup); fillRect(c, 200, 133, 5, 1, C.cof); setPx(c, 205, 135, C.cup); fillRect(c, 203, 134, 2, 4, C.c3);
  fillRect(c, 228, 132, 6, 6, C.d2); fillRect(c, 228, 131, 6, 1, C.d3); fillRect(c, 229, 133, 1, 4, C.l1);
  fillRect(c, 172, 134, 4, 4, C.cup); fillRect(c, 175, 135, 1, 3, C.c3);
}

// warm spill on the floor in front of the counter
// polished-board reflection: short stepped streaks under the lamp
for (const [y, hw, col] of [[FLOOR + 3, 26, C.d1], [FLOOR + 3, 14, C.l0], [FLOOR + 6, 20, C.d1], [FLOOR + 6, 8, C.l0], [FLOOR + 10, 12, C.d1]])
  fillRect(c, LX - hw, y, hw * 2 + 1, 1, col);

// ── menu board easel (far left) ────────────────────────────────
{
  const x0 = 12, y0 = 142, wdt = 30, ht = 40;
  line(c, x0 + 3, y0 + ht, x0 - 2, H - 12, C.d1);
  line(c, x0 + wdt - 3, y0 + ht, x0 + wdt + 2, H - 12, C.d1);
  fillRect(c, x0 - 2, y0 - 2, wdt + 4, ht + 4, C.d2);
  fillRect(c, x0 - 2, y0 - 2, wdt + 4, 1, C.d3);
  fillRect(c, x0, y0, wdt, ht, C.m0);
  // chalk scribbles (no text): title bar + 3 short lines + a cup doodle
  fillRect(c, x0 + 6, y0 + 5, 18, 1, C.m1);
  for (const [yy, ln] of [[13, 14], [19, 18], [25, 11]]) {
    fillRect(c, x0 + 4, y0 + yy, ln, 1, C.c3);
    setPx(c, x0 + 4 + ln + 3, y0 + yy, C.m1);
  }
  fillRect(c, x0 + 18, y0 + 30, 5, 4, C.c3); setPx(c, x0 + 23, y0 + 31, C.c3);
}

// ── bench + sleeping calico cat ────────────────────────────────
{
  const bx0 = 54, bx1 = 182, by = 188;
  // shadow on floor
  fillRect(c, bx0 + 2, by + 24, bx1 - bx0 + 2, 2, C.w0);
  for (const lx of [bx0 + 6, bx1 - 9, (bx0 + bx1) >> 1]) {
    fillRect(c, lx, by + 4, 3, 21, C.d1); fillRect(c, lx, by + 4, 1, 21, C.d2);
  }
  fillRect(c, bx0 + 6, by + 14, bx1 - bx0 - 12, 2, C.d1); // stretcher
  fillRect(c, bx0, by, bx1 - bx0, 4, C.d2);
  fillRect(c, bx0, by, bx1 - bx0, 1, C.d3);
  fillRect(c, bx0, by + 3, bx1 - bx0, 1, C.d0);
  // cushion
  fillRect(c, 76, by - 3, 72, 3, C.w4); fillRect(c, 76, by - 3, 72, 1, C.d3); setPx(c, 76, by - 3, C.w3); setPx(c, 147, by - 3, C.w3);

  // cat: curled loaf, head on the left resting, tail around the front
  const cx = 114, cy = by - 10;
  ellipse(c, cx, cy, 22, 9, C.c2);
  ellipse(c, cx, cy, 22, 9, (x, y) => (y > cy + 4 ? C.c3 : P.getPx(c, x, y)));
  // calico patches: big orange saddle, dark spots
  ellipse(c, cx + 6, cy - 4, 10, 5, C.c1);
  ellipse(c, cx + 15, cy, 6, 5, C.c1);
  ellipse(c, cx - 4, cy - 6, 5, 3, C.c0);
  ellipse(c, cx + 18, cy + 3, 3, 3, C.c0);
  // lamp-side rim light on the orange saddle
  for (let x = cx; x < cx + 16; x++) for (let y = cy - 10; y < cy; y++) if (P.getPx(c, x, y) === C.c1) { setPx(c, x, y, C.l2); break; }
  // head
  const hx = cx - 22, hy = cy + 1;
  ellipse(c, hx, hy, 8, 6, C.c2);
  ellipse(c, hx + 3, hy - 3, 5, 3, C.c1);
  ellipse(c, hx, hy, 8, 6, (x, y) => (y > hy + 4 ? C.c3 : P.getPx(c, x, y)));
  polygon(c, [[hx - 7, hy - 3], [hx - 6, hy - 10], [hx - 2, hy - 5]], C.c2);
  polygon(c, [[hx + 1, hy - 5], [hx + 5, hy - 10], [hx + 7, hy - 3]], C.c1);
  setPx(c, hx - 6, hy - 7, C.c3); setPx(c, hx - 5, hy - 6, C.c3); setPx(c, hx + 5, hy - 7, C.c0);
  // closed eyes + nose
  for (const ex of [hx - 4, hx + 2]) { setPx(c, ex, hy, C.c0); setPx(c, ex + 1, hy + 1, C.c0); setPx(c, ex + 2, hy, C.c0); }
  setPx(c, hx, hy + 3, C.c1);
  // paws tucked under the chin
  fillRect(c, hx + 4, cy + 6, 6, 2, C.c2); setPx(c, hx + 6, cy + 7, C.c3);
  // tail along the front, orange with a dark tip
  for (let x = cx - 4; x < cx + 20; x++) {
    const y = cy + 6 + (x < cx + 2 ? 1 : 0);
    const col = x < cx - 1 ? C.c0 : C.c1;
    setPx(c, x, y, col); setPx(c, x, y + 1, col);
  }
  // 1px dark outline around the whole cat so it reads against bench and wall
  {
    const cat = new Set([C.c0, C.c1, C.c2, C.c3, C.l2]);
    const pts = [];
    for (let y = cy - 20; y < cy + 12; y++) for (let x = hx - 10; x < cx + 26; x++) {
      if (cat.has(P.getPx(c, x, y))) continue;
      if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => cat.has(P.getPx(c, x + dx, y + dy)))) pts.push([x, y]);
    }
    for (const [x, y] of pts) setPx(c, x, y, C.w0);
  }
  // "zz" above the head
  fillRect(c, hx + 3, hy - 15, 2, 2, C.c3); fillRect(c, hx + 7, hy - 19, 2, 1, C.c3);
}

// ── small round side table with a steaming cup ─────────────────
{
  const tx = 214, ty = 182;
  fillRect(c, tx - 10, 210, 21, 2, C.w0);
  fillRect(c, tx - 1, ty + 2, 3, 26, C.d1); fillRect(c, tx - 1, ty + 2, 1, 26, C.d2);
  fillRect(c, tx - 7, ty + 26, 15, 2, C.d1);
  ellipse(c, tx, ty, 13, 2, C.d3);
  fillRect(c, tx - 13, ty + 2, 27, 1, C.d1);
  // cup
  fillRect(c, tx - 3, ty - 7, 6, 6, C.cup); fillRect(c, tx - 3, ty - 7, 6, 1, C.cof);
  fillRect(c, tx + 1, ty - 6, 2, 5, C.c3);
  setPx(c, tx + 3, ty - 6, C.cup); setPx(c, tx + 4, ty - 5, C.cup); setPx(c, tx + 3, ty - 3, C.cup);
  fillRect(c, tx - 5, ty - 1, 10, 1, C.cup); // saucer
  // steam wisps
  for (const [ox, ph] of [[-1, 0], [2, 2]]) for (let k = 0; k < 11; k++) {
    if (k % 4 === 3) continue;
    setPx(c, tx + ox + Math.round(Math.sin((k + ph) * 0.7) * 1.5), ty - 9 - k, C.steam);
  }
}

// ── potted plant (far right, in front of the partition) ────────
{
  const px = 380, py = 212;
  fillRect(c, px - 11, py, 22, 2, C.w0);
  polygon(c, [[px - 9, py - 16], [px + 9, py - 16], [px + 7, py], [px - 7, py]], C.d2);
  fillRect(c, px - 10, py - 18, 20, 3, C.d3);
  fillRect(c, px + 3, py - 15, 3, 14, C.d1);
  fillRect(c, px - 1, py - 26, 2, 9, C.d1);
  P.canopy(c, P.rng(77), { cx: px, cy: py - 40, rx: 15, ry: 24, tones: [C.p0, C.p0, C.p1, C.p2], light: [-0.9, -0.4], clump: [2, 4] });
  // a few orange berries like the reference
  for (const [dx, dy] of [[-8, -48], [6, -30], [-4, -26], [9, -50], [0, -58], [-10, -36]]) setPx(c, px + dx, py + dy, C.c1);
}

// ── save + checks ──────────────────────────────────────────────
const out = 'public/medieval/scenes/night-cafe.png';
await P.save(c, out);
await P.preview(out, 'data/agents/tmp/scenes/night-cafe@2x.png', 2);

const allowed = new Set(Object.values(C).map((h) => h.toLowerCase()));
const L = (i) => 0.2126 * c.data[i] + 0.7152 * c.data[i + 1] + 0.0722 * c.data[i + 2];
let dark = 0, bright = 0, topSum = 0, topN = 0, topOver = 0, off = new Set();
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const i = (y * W + x) * 4, l = L(i);
  if (l <= 70) dark++; if (l > 150) bright++;
  if (y < 90) { topSum += l; topN++; if (l > 116.3) topOver++; }
  const hex = P.getPx(c, x, y); if (!allowed.has(hex)) off.add(hex);
}
const N = W * H;
console.log(`dark<=70: ${(100 * dark / N).toFixed(1)}% (>=75)  bright>150: ${(100 * bright / N).toFixed(2)}% (<=5)  top40 avg: ${(topSum / topN).toFixed(1)} (<=45)  top40 over #8a6a9a: ${topOver}  off-palette: ${[...off].join(',') || 'none'}`);
