// Scene f: market-lane-night — eAuto tool pages and /eauto.
// One-point view down a narrow timber-framed market lane at night.
// Palette and brief: app/styles/medieval/SCENES.md section 3f.
// Run from repo root: node scripts/medieval-scenes/market-lane-night.mjs

import * as P from './lib.mjs';

const W = 400, H = 225;
const OUT = 'public/medieval/scenes/market-lane-night.png';
const PREV = 'data/agents/tmp/scenes/market-lane-night@3x.png';

// ── palette (SCENES.md 3f) ──────────────────────────────────────
const SKY = ['#090812', '#100e1c', '#181428', '#221a32'];
const WALL = ['#1a1214', '#2a1e1c', '#3c2a24', '#4e3a2e'];
const TIM = ['#0e0a0a', '#22140e'];
const ROOF = ['#141420', '#222234', '#30304a'];
const LIT = ['#5a3418', '#a8642a', '#eca446', '#ffdc8a'];
const COB = ['#0e0c0e', '#1c1a1e', '#2c282e', '#4a4048'];
const CART = ['#2a1a10', '#4a2e1a', '#6a4426'];

const r = P.rng(6061);
const c = P.create(W, H, SKY[0]);

// ── projection ──────────────────────────────────────────────────
const VX = 200, VY = 138, EYE = 1.6, F = 106;
const pr = (x, y, z) => [VX + (x * F) / z, VY - ((y - EYE) * F) / z];
const lum = (hex) => { const [a, b, d] = P.rgb(hex); return 0.2126 * a + 0.7152 * b + 0.0722 * d; };

function quad(x, y0, y1, z0, z1, col) {
  P.polygon(c, [pr(x, y0, z0), pr(x, y0, z1), pr(x, y1, z1), pr(x, y1, z0)], col);
}
function wline(a, b, col) { P.line(c, a[0], a[1], b[0], b[1], col); }

// ── sky strip ───────────────────────────────────────────────────
P.skyBands(c, 0, 132, SKY, 5);
P.stars(c, r, { count: 34, yMax: 112, colors: [ROOF[2], COB[3], LIT[3]] });

// distant silhouettes at the lane's end: church tower + roofs (haze)
{
  const [tx, ty] = pr(0.9, 22, 70);
  const [, gy] = pr(0, 0, 70);
  P.fillRect(c, Math.round(tx) - 2, Math.round(ty), 5, Math.round(gy - ty), ROOF[0]);
  P.polygon(c, [[tx - 3, ty + 1], [tx + 0.5, ty - 9], [tx + 4, ty + 1]], ROOF[0]);
  P.setPx(c, tx, ty + 4, LIT[0]); // belfry ember
  P.fillRect(c, Math.round(tx), Math.round(ty) - 12, 1, 3, ROOF[0]);
  // far roofline across the lane end
  for (let x = 170; x < 232; x++) {
    const n = Math.sin(x * 0.45) * 2 + Math.sin(x * 0.13) * 2;
    for (let y = Math.round(127 - n - (Math.abs(x - 200) < 6 ? 0 : 1)); y < 140; y++) P.setPx(c, x, y, ROOF[0]);
  }
}

// ── light sources (world) used for ground + wall lighting ───────
const lights = []; // {x,y,z,i}

// ── house plan ──────────────────────────────────────────────────
function plan(side, zs) {
  const out = [];
  for (let i = 0; i + 1 < zs.length; i++) {
    out.push({
      side, z0: zs[i], z1: zs[i + 1],
      top: r.range(5.6, 7.6), gable: r.chance(0.72) ? r.range(1.8, 2.8) : 0,
      upper: r.chance(0.5) ? 2 : 1, door: r.range(0.25, 0.7), open: false, shop: r.chance(0.7),
    });
  }
  return out;
}
const left = plan(-1, [1.0, 3.1, 5.6, 8.3, 11.6, 15.6, 20.5, 26.5, 34]);
const right = plan(1, [1.0, 2.5, 4.7, 7.3, 10.4, 14.4, 19.2, 25, 34]);
left[1].open = true; left[2].open = true; left[4].open = true; right[1].open = true; right[3].open = true; right[6].open = true;
left[1].top = 7.8; right[1].top = 7.4;
for (const h of [...left, ...right]) if (h.open) {
  const zc = h.z0 + (h.z1 - h.z0) * h.door;
  lights.push({ x: h.side * 3, y: 1, z: zc, i: 1.4 });
}

// lantern string: zig-zag between facades, row ~105-130 on screen
const anchors = [[-2.6, 4.2, 5.4], [2.6, 4.2, 7.6], [-2.5, 4.2, 10.8], [2.5, 4.2, 15], [-2.4, 4.2, 21]];
const lanterns = [];
for (let i = 0; i + 1 < anchors.length; i++) {
  const [ax, ay, az] = anchors[i], [bx, by, bz] = anchors[i + 1];
  const ts = i === 0 ? [0.22, 0.55, 0.85] : i === 3 ? [0.5] : [0.3, 0.72];
  for (const t of ts) {
    const sag = 0.55 * Math.sin(Math.PI * t);
    lanterns.push([ax + (bx - ax) * t, ay + (by - ay) * t - sag - 0.35, az + (bz - az) * t]);
  }
}
for (const [x, y, z] of lanterns) lights.push({ x, y, z, i: 0.9 });

function lightAt(x, y, z) {
  let L = 0;
  for (const s of lights) {
    const d2 = (x - s.x) ** 2 + ((y - s.y) * 0.35) ** 2 + ((z - s.z) * 0.8) ** 2;
    L += s.i / (1 + d2 * 1.1);
  }
  return L;
}

// ── cobbles (inverse-projected ground) ──────────────────────────
for (let Y = VY + 1; Y < H; Y++) {
  const z = (F * EYE) / (Y + 0.5 - VY);
  for (let X = 0; X < W; X++) {
    const x = ((X + 0.5 - VX) * z) / F;
    if (Math.abs(x) > 3.05) continue;
    const L = lightAt(x, 0, z) + 0.05;
    const cw = 0.26, ch = 0.2;
    const row = Math.floor(z / ch);
    const u = (x + 50) / cw + (row & 1 ? 0.5 : 0) + (row % 3) * 0.17;
    const fu = u - Math.floor(u), fv = z / ch - row;
    const pxW = (cw * F) / z, pxH = ((F * EYE) / z - (F * EYE) / (z + ch));
    const gu = 1.1 / pxW, gv = 1 / Math.max(1, pxH);
    let col;
    if (Math.abs(x) > 2.72) col = (X + Y) & 1 ? COB[0] : COB[1]; // gutter
    else if (pxW < 4.4) col = P.dither(X, Y, COB[1], COB[2], Math.min(1, L * 0.8)); // far: texture only
    else if (fu < gu || fv > 1 - gv) col = COB[0]; // mortar gap (near edge of row = toward viewer)
    else {
      const top = fv < gv * 1.6; // far edge of stone faces the light
      const lt = L * (0.85 + 0.3 * ((Math.floor(u) * 7 + row * 13) % 5) / 4);
      if (lt > 1.5 && top && (Math.floor(u) * 3 + row) % 4 === 0) col = LIT[1];
      else if (lt > 1.0 && top && (Math.floor(u) + row) % 2 === 0) col = LIT[0];
      else if (lt > 0.42) col = top ? COB[3] : COB[2];
      else if (lt > 0.2) col = top ? COB[2] : COB[1];
      else col = fu > 1 - gu * 1.5 ? COB[0] : COB[1];
    }
    P.setPx(c, X, Y, col);
  }
}

// ── a rain puddle mirroring the night sky and the lanterns ──────
{
  const pz = 3.6, px = 0.6;
  const [cx, cy] = pr(px, 0, pz);
  const ry = 3, rx = 22;
  P.ellipse(c, cx, cy, rx, ry, (X, Y) => (Math.abs(Y - cy) > ry - 1 && P.bayer(X, Y) < 0.5 ? COB[0] : SKY[2]));
  P.ellipse(c, cx + 6, cy, rx * 0.55, ry - 1, SKY[3]);
  for (const [dx, col] of [[-8, LIT[1]], [3, LIT[2]], [10, LIT[0]]]) {
    P.fillRect(c, Math.round(cx + dx), Math.round(cy) - 1, 2, 1, col);
    P.fillRect(c, Math.round(cx + dx) - 1, Math.round(cy) + 1, 3, 1, col === LIT[2] ? LIT[1] : LIT[0]);
  }
  P.line(c, cx - rx + 3, cy - ry + 1, cx - 4, cy - ry + 1, ROOF[1]); // far rim glint
}

// ── houses ──────────────────────────────────────────────────────
function tier(z) { return z > 17 ? 0 : z > 8 ? 1 : 2; }

function windowQ(xp, wz0, wz1, wy0, wy1, on, z) {
  const t = tier(z), near = t === 2;
  const pts = [pr(xp, wy0, wz0), pr(xp, wy0, wz1), pr(xp, wy1, wz1), pr(xp, wy1, wz0)];
  const high = Math.min(...pts.map((p) => p[1])) < 92; // in the calm top band
  const zm = (wz0 + wz1) / 2, ym = (wy0 + wy1) / 2;
  if (on && high) {
    // curtained glow: dim ember pane, warm lower half, mullions
    P.polygon(c, pts, LIT[0]);
    P.polygon(c, [pr(xp, wy0, wz0), pr(xp, wy0, wz1), pr(xp, ym, wz1), pr(xp, ym, wz0)], LIT[1]);
    wline(pr(xp, wy0, zm), pr(xp, wy1, zm), TIM[0]);
    wline(pr(xp, ym, wz0), pr(xp, ym, wz1), TIM[0]);
  } else if (on) {
    // bloom: one ring of ember around the pane
    P.polygon(c, [pr(xp, wy0 - 0.25, wz0 - 0.15), pr(xp, wy0 - 0.25, wz1 + 0.15), pr(xp, wy1 + 0.25, wz1 + 0.15), pr(xp, wy1 + 0.25, wz0 - 0.15)], LIT[0]);
    P.polygon(c, pts, near ? LIT[2] : LIT[1 + (t > 0)]);
    if (near) {
      P.polygon(c, [pr(xp, wy0 + 0.12, wz0 + 0.05), pr(xp, wy0 + 0.12, zm), pr(xp, ym, zm), pr(xp, ym, wz0 + 0.05)], LIT[3]);
      wline(pr(xp, wy0, zm), pr(xp, wy1, zm), TIM[0]);
      wline(pr(xp, ym, wz0), pr(xp, ym, wz1), TIM[0]);
    }
  } else {
    P.polygon(c, pts, TIM[0]);
    if (t > 0) { // closed shutters: two leaves with a seam
      P.polygon(c, pts, TIM[1]);
      wline(pr(xp, wy0, zm), pr(xp, wy1, zm), TIM[0]);
      if (near) wline(pr(xp, ym, wz0), pr(xp, ym, wz1), TIM[0]);
    }
  }
  // sill
  wline(pr(xp, wy0 - 0.08, wz0 - 0.08), pr(xp, wy0 - 0.08, wz1 + 0.08), TIM[0]);
  if (near) wline(pr(xp, wy0 - 0.14, wz0 - 0.08), pr(xp, wy0 - 0.14, wz1 + 0.08), TIM[1]);
}

// plaster texture: sparse darker flecks + a few exposed bricks on near walls
function plaster(xp, y0, y1, zA, zB, base) {
  const dk = base === WALL[2] ? WALL[1] : base === WALL[1] ? WALL[0] : null;
  if (!dk) return;
  const n = P.noise2(Math.round(zA * 97) + (xp > 0 ? 5 : 0));
  P.polygon(c, [pr(xp, y0, zA), pr(xp, y0, zB), pr(xp, y1, zB), pr(xp, y1, zA)], (X, Y) => {
    const cur = P.getPx(c, X, Y);
    if (cur !== base) return cur;
    const v = n(X * 0.09, Y * 0.13);
    if (v > 0.8 && P.bayer(X, Y) < (v - 0.8) * 2.2 && ((X * 3 + Y) % 5 === 0)) return dk;
    return cur;
  });
}

function frameGrid(xp, y0, y1, zA, zB, len, near) {
  const fr = TIM[0], zm = (zA + zB) / 2;
  const thick = (a, b) => { wline(a, b, fr); if (near) wline([a[0] + 1, a[1]], [b[0] + 1, b[1]], fr); };
  for (const zz of [zA + 0.06, zB - 0.06, zm]) thick(pr(xp, y0, zz), pr(xp, y1, zz));
  thick(pr(xp, y1, zA), pr(xp, y1, zB));
  thick(pr(xp, y0 + 0.08, zA), pr(xp, y0 + 0.08, zB));
  // braces: K-pattern toward the corner posts
  const yb = y0 + (y1 - y0) * 0.55;
  wline(pr(xp, y0 + 0.1, zA + 0.06), pr(xp, yb, zA + len * 0.2), fr);
  wline(pr(xp, y0 + 0.1, zB - 0.06), pr(xp, yb, zB - len * 0.2), fr);
  if (near) {
    wline(pr(xp, y1 - 0.05, zm), pr(xp, y0 + (y1 - y0) * 0.45, zm - len * 0.16), fr);
    wline(pr(xp, y1 - 0.05, zm), pr(xp, y0 + (y1 - y0) * 0.45, zm + len * 0.16), fr);
  }
}

function drawHouse(h) {
  const s = h.side, zA = h.z0, zB = h.z1, zm = (zA + zB) / 2, len = zB - zA, t = tier(zm);
  const xg = s * 3; // ground floor plane
  const lightSide = s < 0; // left walls face the lane's main light a bit more
  const wallG = t === 0 ? WALL[0] : t === 1 ? WALL[1] : lightSide ? WALL[2] : WALL[1];
  const wallU = t === 0 ? WALL[0] : t === 1 ? (lightSide ? WALL[1] : WALL[0]) : WALL[1];
  const near = t === 2;
  // upper floors step out over the lane (jetties): each floor leans in more
  const floors = [];
  const fh = (h.top - 3) / h.upper;
  for (let f = 0; f < h.upper; f++) floors.push({ x: s * (2.62 - f * 0.32), y0: 3 + f * fh, y1: 3 + (f + 1) * fh });
  const xt = floors[floors.length - 1].x;

  // walls back to front: top floor + gable first, then lower floors over them
  for (let f = floors.length - 1; f >= 0; f--) {
    const fl = floors[f];
    quad(fl.x, fl.y0, fl.y1, zA, zB, wallU);
    if (f === floors.length - 1 && h.gable) P.polygon(c, [pr(xt, h.top - 0.02, zA), pr(xt, h.top + h.gable, zm), pr(xt, h.top - 0.02, zB)], wallU);
  }
  // ground floor (plane xg)
  quad(xg, 0, 3, zA, zB, wallG);
  // lit band on lower wall from lanterns / doors (dithered warm wash)
  {
    const pts = [pr(xg, 0, zA), pr(xg, 0, zB), pr(xg, 3, zB), pr(xg, 3, zA)];
    P.polygon(c, pts, (X, Y) => {
      const z = s * 3 * F / (X - VX + 1e-6);
      const y = EYE - ((Y - VY) * z) / F;
      const L = lightAt(xg, y, z);
      if (L > 0.55) return P.dither(X, Y, WALL[2], WALL[3], Math.min(1, (L - 0.55) * 2));
      if (L > 0.25) return P.dither(X, Y, wallG, WALL[2], Math.min(1, (L - 0.25) * 2.5));
      return wallG;
    });
  }
  if (near) plaster(xg, 0.1, 2.9, zA, zB, wallG);

  // per upper floor: plaster, framing, windows, jetty underside below it
  const nWin = len > 3.5 ? 3 : 2;
  let below = xg;
  for (const fl of floors) {
    if (near) plaster(fl.x, fl.y0, fl.y1, zA, zB, wallU);
    if (t > 0) frameGrid(fl.x, fl.y0, fl.y1, zA, zB, len, near);
    for (let k = 0; k < nWin; k++) {
      const wz = zA + len * ((k + 0.5) / nWin);
      if (t > 0 && Math.abs(wz - zm) < 0.05 && nWin === 3) continue; // post in the middle
      const ww = Math.min(0.55, len * 0.12);
      windowQ(fl.x, wz - ww / 2, wz + ww / 2, fl.y0 + (fl.y1 - fl.y0) * 0.25, fl.y0 + (fl.y1 - fl.y0) * 0.72, r.chance(near ? 0.55 : 0.5), zm);
    }
    // jetty: underside band between the floor below's plane and this one
    P.polygon(c, [pr(below, fl.y0, zA), pr(below, fl.y0, zB), pr(fl.x, fl.y0, zB), pr(fl.x, fl.y0, zA)], TIM[0]);
    // joist ends along the jetty (near houses only)
    if (near) for (let q = 0.25; q < len; q += 0.45) { const p = pr(fl.x, fl.y0 + 0.05, zA + q).map(Math.round); P.setPx(c, p[0], p[1], TIM[1]); }
    below = fl.x;
  }

  // gable barge boards / roof edge
  const edge = t === 0 ? ROOF[1] : ROOF[2];
  if (h.gable) {
    if (t > 0) wline(pr(xt, h.top, zm), pr(xt, h.top + h.gable * 0.8, zm), TIM[0]);
    const a = pr(xt, h.top - 0.1, zA - 0.12), p = pr(xt, h.top + h.gable + 0.12, zm), b = pr(xt, h.top - 0.1, zB + 0.12);
    h.peak = p; h.xt = xt;
    for (let k = 0; k < (near ? 3 : t === 1 ? 2 : 1); k++) {
      wline([a[0], a[1] - k], [p[0], p[1] - k], k ? ROOF[1] : edge);
      wline([p[0], p[1] - k], [b[0], b[1] - k], k ? ROOF[0] : ROOF[1]);
    }
    windowQ(xt, zm - len * 0.08, zm + len * 0.08, h.top + h.gable * 0.22, h.top + h.gable * 0.52, r.chance(0.35), zm);
  } else {
    for (let k = 0; k < (near ? 4 : 2); k++) wline(pr(xt, h.top + k * 0.18, zA - 0.1), pr(xt, h.top + k * 0.18, zB + 0.1), k === 0 ? ROOF[0] : k === 1 ? edge : ROOF[1]);
  }

  // ground floor: door + shop shutters / open doorway
  const dz = zA + len * h.door, dw = Math.min(0.75, len * 0.22);
  if (h.open) {
    P.polygon(c, [pr(xg, 0, dz - dw / 2), pr(xg, 0, dz + dw / 2), pr(xg, 2.25, dz + dw / 2), pr(xg, 2.25, dz - dw / 2)], LIT[1]);
    P.polygon(c, [pr(xg, 0, dz - dw / 2 + dw * 0.35), pr(xg, 0, dz + dw / 2), pr(xg, 2.0, dz + dw / 2), pr(xg, 2.0, dz - dw / 2 + dw * 0.35)], t === 2 ? LIT[3] : LIT[2]);
    // interior silhouette: counter edge
    wline(pr(xg, 0.9, dz - dw / 2), pr(xg, 0.9, dz + dw / 2), LIT[0]);
    // door leaf swung open
    P.polygon(c, [pr(xg, 0, dz + dw / 2), pr(xg, 2.25, dz + dw / 2), pr(xg - s * 0.4, 2.25, dz + dw / 2 + 0.12), pr(xg - s * 0.4, 0, dz + dw / 2 + 0.12)], TIM[1]);
  } else {
    P.polygon(c, [pr(xg, 0, dz - dw / 2), pr(xg, 0, dz + dw / 2), pr(xg, 2.2, dz + dw / 2), pr(xg, 2.2, dz - dw / 2)], TIM[1]);
    wline(pr(xg, 0, dz), pr(xg, 2.2, dz), TIM[0]);
  }
  // door frame lintel
  wline(pr(xg, 2.3, dz - dw / 2 - 0.05), pr(xg, 2.3, dz + dw / 2 + 0.05), TIM[0]);
  if (h.shop) {
    for (const sz of [zA + len * 0.18, zB - len * 0.18]) {
      if (Math.abs(sz - dz) < dw) continue;
      const sw = Math.min(0.9, len * 0.22);
      // closed workshop shutter with plank lines + drop-down counter board
      P.polygon(c, [pr(xg, 0.9, sz - sw / 2), pr(xg, 0.9, sz + sw / 2), pr(xg, 2.1, sz + sw / 2), pr(xg, 2.1, sz - sw / 2)], TIM[1]);
      if (t === 2) for (let q = 1; q < 4; q++) wline(pr(xg, 0.9 + q * 0.3, sz - sw / 2), pr(xg, 0.9 + q * 0.3, sz + sw / 2), TIM[0]);
      P.polygon(c, [pr(xg, 0.82, sz - sw / 2 - 0.05), pr(xg, 0.82, sz + sw / 2 + 0.05), pr(xg - s * 0.35, 0.9, sz + sw / 2 + 0.05), pr(xg - s * 0.35, 0.9, sz - sw / 2 - 0.05)], CART[0]);
      // a thin crack of light at the shutter seam on some
      if (r.chance(0.4)) wline(pr(xg, 0.95, sz), pr(xg, 2.05, sz), LIT[0]);
    }
  } else {
    windowQ(xg, zA + len * 0.12, zA + len * 0.12 + Math.min(0.6, len * 0.15), 1.0, 2.0, r.chance(0.6), zm);
  }
  // corner posts (ground)
  wline(pr(xg, 0, zA + 0.04), pr(xg, 3, zA + 0.04), TIM[0]);
  // stone plinth at the base
  wline(pr(xg, 0.05, zA), pr(xg, 0.05, zB), COB[0]);
}

// far end house facing the viewer (closes the lane)
{
  const zE = 34;
  const [x0, y0] = pr(-3.1, 0, zE), [x1, y1] = pr(3.1, 6, zE);
  P.fillRect(c, Math.round(x0), Math.round(y1), Math.round(x1 - x0), Math.round(y0 - y1), WALL[0]);
  P.polygon(c, [[x0 - 1, y1 + 1], [(x0 + x1) / 2, y1 - 6], [x1 + 1, y1 + 1]], ROOF[0]);
  P.fillRect(c, Math.round(VX) - 1, Math.round(y1) + 3, 2, 2, LIT[2]);
  P.fillRect(c, Math.round(VX) - 1, Math.round(y0) - 4, 2, 4, LIT[1]);
}

// draw far -> near, alternating sides by depth
const all = [...left, ...right].sort((a, b) => b.z0 - a.z0);
for (const h of all) drawHouse(h);

// ── chimney pots on mid-distance gables, thin smoke into the sky strip ──
{
  const sr = P.rng(4242);
  for (const h of [...left, ...right]) {
    const zm = (h.z0 + h.z1) / 2;
    if (!h.gable || zm < 9 || zm > 24) continue;
    const ch = pr(h.xt - h.side * 0.6, h.top + h.gable + 0.9, zm + (h.z1 - h.z0) * 0.18).map(Math.round);
    const base = pr(h.xt - h.side * 0.6, h.top + h.gable * 0.45, zm + (h.z1 - h.z0) * 0.18).map(Math.round);
    const wpx = Math.max(2, Math.round((0.5 * F) / zm));
    P.fillRect(c, ch[0] - (wpx >> 1), ch[1], wpx, Math.max(2, base[1] - ch[1]), ROOF[0]);
    P.fillRect(c, ch[0] - (wpx >> 1) - 1, ch[1], wpx + 2, 1, ROOF[1]);
    if (sr.chance(0.75)) P.smoke(c, sr, { x: ch[0], y: ch[1] - 2, h: 22, drift: h.side > 0 ? 0.3 : -0.3, col: [ROOF[1], SKY[3]] });
  }
}

// ── wall lantern beside the near-right open door ────────────────
{
  const h = right[1], len = h.z1 - h.z0, dz = h.z0 + len * h.door;
  const w = pr(2.98, 2.55, dz - 0.75).map(Math.round), o = pr(2.6, 2.55, dz - 0.75).map(Math.round);
  P.line(c, w[0], w[1], o[0], o[1], TIM[0]);
  P.glow(c, { cx: o[0], cy: o[1] + 5, r: 4, rings: [LIT[1], LIT[0]], step: 3, outer: 0.4 });
  P.fillRect(c, o[0] - 2, o[1] + 1, 5, 1, TIM[0]);
  P.fillRect(c, o[0] - 1, o[1] + 2, 3, 6, LIT[2]);
  P.fillRect(c, o[0], o[1] + 3, 1, 3, LIT[3]);
  P.fillRect(c, o[0] - 1, o[1] + 8, 3, 1, TIM[0]);
}

// ── light spill on ground at open doors (dithered wedge) ────────
for (const h of [...left, ...right]) if (h.open) {
  const len = h.z1 - h.z0, dz = h.z0 + len * h.door, dw = Math.min(0.75, len * 0.22);
  const s = h.side;
  P.polygon(c, [pr(s * 2.98, 0, dz - dw / 2), pr(s * 2.98, 0, dz + dw / 2), pr(s * 1.5, 0, dz + dw * 1.2), pr(s * 1.7, 0, dz - dw * 0.4)], (X, Y) => {
    const cur = P.getPx(c, X, Y);
    if (cur === COB[0]) return LIT[0];
    return P.bayer(X, Y) < 0.45 ? (cur === COB[3] || cur === LIT[0] ? LIT[1] : LIT[0]) : cur;
  });
}

// ── fallen leaves drifted along the gutters and between stones ──
{
  const lr = P.rng(77);
  for (let i = 0; i < 140; i++) {
    const z = 2.1 + Math.pow(lr(), 1.6) * 14;
    const side = lr.chance(0.5) ? -1 : 1;
    const x = lr.chance(0.7) ? side * lr.range(2.2, 2.95) : lr.range(-2.5, 2.5);
    const [X, Y] = pr(x, 0, z).map(Math.round);
    if (Y >= H || Y <= VY) continue;
    const L = lightAt(x, 0, z);
    const col = L > 0.6 ? lr.pick([LIT[1], CART[2], LIT[0]]) : lr.pick([LIT[0], CART[1], CART[0]]);
    P.setPx(c, X, Y, col);
    if (z < 5) { P.setPx(c, X + 1, Y, col); if (lr.chance(0.5)) P.setPx(c, X, Y - 1, col); }
  }
}

// ── lantern wire + lanterns ─────────────────────────────────────
function wireCol(X, Y) { const cur = P.getPx(c, X, Y); return cur && lum(cur) < 24 ? ROOF[2] : TIM[0]; }
for (let i = 0; i + 1 < anchors.length; i++) {
  const [ax, ay, az] = anchors[i], [bx, by, bz] = anchors[i + 1];
  let prev = null;
  for (let k = 0; k <= 40; k++) {
    const t = k / 40, sag = 0.55 * Math.sin(Math.PI * t);
    const p = pr(ax + (bx - ax) * t, ay + (by - ay) * t - sag, az + (bz - az) * t).map(Math.round);
    if (prev) {
      const dx = Math.abs(p[0] - prev[0]), dy = Math.abs(p[1] - prev[1]), n = Math.max(dx, dy, 1);
      for (let q = 0; q <= n; q++) { const X = Math.round(prev[0] + ((p[0] - prev[0]) * q) / n), Y = Math.round(prev[1] + ((p[1] - prev[1]) * q) / n); P.setPx(c, X, Y, wireCol(X, Y)); }
    }
    // bunting: small pennants hanging off the wire
    const zt = az + (bz - az) * t;
    if (k % 5 === 3 && k < 39) {
      const sz = Math.max(1, Math.round((0.28 * F) / zt));
      const col = (k + i) % 10 === 3 ? ROOF[2] : CART[1];
      P.polygon(c, [[p[0] - sz / 2, p[1] + 1], [p[0] + sz / 2 + 1, p[1] + 1], [p[0] + 0.5, p[1] + 1 + sz * 1.3]], col);
    }
    prev = p;
  }
  // wall bracket at the anchor
  const a = pr(ax, ay, az), a2 = pr(ax * 1.15, ay + 0.1, az);
  P.line(c, a[0], a[1], a2[0], a2[1], TIM[0]);
}
lanterns.sort((a, b) => b[2] - a[2]);
for (const [x, y, z] of lanterns) {
  const [X, Y] = pr(x, y, z).map(Math.round);
  const top = pr(x, y + 0.35, z).map(Math.round);
  const s = Math.max(1, Math.round((0.32 * F) / z)); // body width in px
  P.line(c, top[0], top[1], X, Y - s, TIM[0]);
  P.glow(c, { cx: X, cy: Y, r: s + 1, rings: [LIT[1], LIT[0]], step: Math.max(2, s), outer: 0.45 });
  const bh = s + 1;
  P.fillRect(c, X - (s >> 1), Y - (bh >> 1), s, bh, LIT[2]);
  if (s >= 2) P.fillRect(c, X - (s >> 1), Y - (bh >> 1) + 1, Math.max(1, s - 1), Math.max(1, bh - 2), LIT[3]);
  P.fillRect(c, X - (s >> 1) - (s > 2 ? 1 : 0), Y - (bh >> 1) - 1, s + (s > 2 ? 2 : 0), 1, TIM[0]); // cap
  P.fillRect(c, X - (s >> 1), Y + bh - (bh >> 1), s, 1, TIM[0]); // base
  if (s >= 3) P.setPx(c, X, Y - (bh >> 1) - 2, TIM[0]);
}

// ── hanging shop sign on the right (bracket + blank board) ──────
{
  const w0 = pr(3, 4.0, 3.4).map(Math.round);
  const ax = w0[0] - 30, ay = w0[1];
  P.fillRect(c, ax, ay, w0[0] - ax, 2, TIM[0]);
  P.line(c, w0[0] - 1, ay + 12, w0[0] - 14, ay + 1, TIM[0]); // diagonal strut
  P.line(c, ax + 2, ay + 2, ax + 2, ay + 6, ROOF[1]); P.line(c, ax + 20, ay + 2, ax + 20, ay + 6, ROOF[1]); // chains
  // board shaped like a boot-scraper / pretzel-less plain plaque
  P.fillRect(c, ax - 1, ay + 7, 25, 15, CART[0]);
  P.fillRect(c, ax, ay + 8, 23, 13, CART[1]);
  P.fillRect(c, ax, ay + 8, 23, 1, CART[2]);
  P.fillRect(c, ax + 3, ay + 11, 17, 7, CART[0]); // recessed blank panel
  P.fillRect(c, ax + 4, ay + 12, 15, 5, CART[1]);
  P.fillRect(c, ax + 22, ay + 8, 1, 13, CART[0]);
}

// ── cart with barrels, bottom-left ──────────────────────────────
function barrel(cx, by, w, h) {
  const top = by - h;
  for (let y = top; y < by; y++) {
    const k = (y - top) / h, bulge = Math.sin(Math.PI * k) * 2;
    const half = w / 2 + bulge;
    for (let x = Math.round(cx - half); x <= Math.round(cx + half); x++) {
      const u = (x - (cx - half)) / (2 * half);
      let col = u > 0.68 ? CART[2] : u < 0.22 ? CART[0] : CART[1];
      if ((x - Math.round(cx)) % 3 === 0 && u > 0.1 && u < 0.9) col = u > 0.68 ? CART[1] : CART[0]; // staves
      P.setPx(c, x, y, col);
    }
  }
  for (const k of [0.2, 0.78]) { const y = Math.round(top + h * k), half = w / 2 + Math.sin(Math.PI * k) * 2; P.line(c, cx - half, y, cx + half, y, TIM[0]); }
  P.ellipse(c, cx, top, w / 2, 2, CART[1]); P.ellipse(c, cx, top, w / 2 - 2, 1, CART[0]);
}
{
  // shadow on cobbles
  for (let x = 4; x < 128; x++) for (let y = 214; y < 225; y++) if (P.bayer(x, y) < 0.6) P.setPx(c, x, y, COB[0]);
  // bed
  P.polygon(c, [[2, 192], [112, 189], [116, 202], [4, 206]], CART[1]);
  P.line(c, 2, 192, 112, 189, CART[2]);
  for (const yy of [197, 201]) P.line(c, 4, yy + 1, 114, yy - 2, CART[0]);
  P.line(c, 4, 206, 116, 202, TIM[0]);
  // side rail posts
  for (const xx of [8, 40, 74, 106]) P.fillRect(c, xx, 182, 2, 10, CART[0]);
  P.line(c, 6, 182, 108, 180, CART[1]);
  // shaft to the right
  P.line(c, 112, 197, 150, 207, CART[0]); P.line(c, 112, 198, 150, 208, CART[1]);
  // barrels on the bed
  barrel(26, 189, 18, 26);
  barrel(54, 188, 18, 30);
  barrel(84, 188, 14, 20);
  // wheel
  const wx = 92, wy = 207, wr = 15;
  for (let y = wy - wr - 1; y <= wy + wr + 1; y++) for (let x = wx - wr - 1; x <= wx + wr + 1; x++) {
    const d = Math.hypot(x - wx, y - wy);
    if (d <= wr + 0.5 && d > wr - 2.5) P.setPx(c, x, y, CART[0]);
  }
  for (let a = 0; a < 8; a++) { const ang = (a * Math.PI) / 4; P.line(c, wx, wy, wx + Math.cos(ang) * (wr - 2), wy + Math.sin(ang) * (wr - 2), CART[0]); }
  P.circle(c, wx, wy, 2, CART[1]);
  for (let a = -1.2; a < 0.2; a += 0.04) P.setPx(c, wx + Math.cos(a) * wr, wy + Math.sin(a) * wr, CART[2]); // rim light (lane side)
  // the cat on the tall barrel: sitting silhouette with ember eyes
  const kx = 54, ky = 158;
  P.ellipse(c, kx, ky + 3, 4, 4, TIM[0]);       // body
  P.ellipse(c, kx + 1, ky - 3, 3, 3, TIM[0]);   // head
  P.setPx(c, kx - 1, ky - 7, TIM[0]); P.setPx(c, kx + 3, ky - 7, TIM[0]); P.setPx(c, kx - 1, ky - 6, TIM[0]); P.setPx(c, kx + 3, ky - 6, TIM[0]); // ears
  P.setPx(c, kx, ky - 3, LIT[2]); P.setPx(c, kx + 2, ky - 3, LIT[2]); // eyes
  P.line(c, kx - 4, ky + 6, kx - 7, ky + 9, TIM[0]); P.line(c, kx - 7, ky + 9, kx - 7, ky + 13, TIM[0]); // tail over the barrel edge
  P.setPx(c, kx + 4, ky + 1, CART[2]); // rim light on shoulder
}

// a small crate + sack by the right wall near the viewer
{
  P.fillRect(c, 330, 196, 26, 20, CART[0]);
  P.fillRect(c, 331, 197, 24, 18, CART[1]);
  P.line(c, 331, 197, 354, 214, CART[0]); P.line(c, 331, 214, 354, 197, CART[0]);
  P.fillRect(c, 331, 197, 1, 18, CART[2]);
  P.ellipse(c, 368, 210, 8, 7, WALL[2]); P.ellipse(c, 366, 208, 5, 4, WALL[3]); P.fillRect(c, 366, 201, 4, 2, TIM[0]);
  for (let x = 322; x < 382; x++) for (let y = 216; y < 222; y++) if (P.bayer(x, y) < 0.5) P.setPx(c, x, y, COB[0]);
}

// ── top-40% clamp: no hot pixels above row 90 except stars ──────
for (let y = 0; y < 90; y++) for (let x = 0; x < W; x++) {
  const p = P.getPx(c, x, y);
  if (p === LIT[3] || p === LIT[2]) {
    // keep single-pixel stars (surrounded by sky)
    const nb = [P.getPx(c, x - 1, y), P.getPx(c, x + 1, y), P.getPx(c, x, y - 1), P.getPx(c, x, y + 1)];
    if (p === LIT[3] && nb.every((q) => SKY.includes(q) || q === COB[3])) continue;
    P.setPx(c, x, y, LIT[1]);
  }
}

// ── save + darkness budget ──────────────────────────────────────
await P.save(c, OUT);
await P.preview(OUT, PREV, 3);
let dark = 0, bright = 0, topSum = 0;
for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const L = lum(P.getPx(c, x, y));
  if (L <= 70) dark++;
  if (L > 150) bright++;
  if (y < 90) topSum += L;
}
console.log(`dark<=70: ${((dark / (W * H)) * 100).toFixed(1)}%  bright>150: ${((bright / (W * H)) * 100).toFixed(2)}%  top40 mean: ${(topSum / (W * 90)).toFixed(1)}`);
