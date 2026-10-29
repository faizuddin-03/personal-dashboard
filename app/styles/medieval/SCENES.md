# Medieval scenes — art direction (v1, 2026-10-27)

Pixel-art backgrounds behind the Cozy Cottage UI (`COTTAGE.md`). Seven scenes,
one per page group. Each is a dusk / evening / night take on the four
reference images the user shared on 2026-10-27:

| # | Reference file | What it is |
|---|---|---|
| R1 | `_reference/inbox/medieval-refs/ref-autumn-village.png` | Dense autumn hillside village, gold/crimson trees, timber houses, blue roofs, church tower, lake |
| R2 | `_reference/inbox/medieval-refs/ref-cozy-cafe.png` | Pastel café interior, lamp, cat asleep on a bench, coffee sign, plant, glass partition (light; needs a night version) |
| R3 | `_reference/inbox/medieval-refs/ref-dusk-cottage.png` | Lone cottage at dusk, purple-pink sky, chimney smoke, glowing windows, orange trees, stone path |
| R4 | `_reference/inbox/medieval-refs/ref-sunset-town.png` | Huge sunset over forest and town, rays, pink/orange/purple layers, church silhouette, dark trees in front |

## 1. User rules these scenes must obey

1. "make the backgrounds will always have dark shades of colours" — every scene is dusk, evening or night.
2. "make the backgrounds a bit darker ... so that i can differentiate between the background and the buttons" — panels and buttons must separate clearly from the scene.
3. A busy earlier design was "too clustered" — the scene is atmosphere behind the content; the UI on top stays clean.
4. Bright pixels only for light sources: windows, lamps, lanterns, sun glow bands, leaf highlights, fireflies, stars.

### 1.1 Darkness budget (checked per scene before hand-off)

1. At least 75% of pixels have luminance (0.2126R + 0.7152G + 0.0722B, 0–255) at or below 70.
2. At most 5% of pixels have luminance above 150.
3. The top 40% (rows 0–89) has an average luminance at or below 45.
4. No pixel in the top 40% is brighter than `#8a6a9a`, except stars and the R4 sun glow (scene c).

## 2. Sampled reference palettes

Measured with sharp (96x96 nearest resample, 4-bit buckets, most frequent first).

| Ref | Band means top / mid / bottom | Dominant colours |
|---|---|---|
| R1 | `#735c61` `#504d5c` `#603237` | `#193456` `#273758` `#363757` `#283a66` `#473757` `#294366` `#0a1127` `#e4dda6` `#471a25` `#181325` |
| R2 | `#d4c9bf` `#ccb8a6` `#cebdaf` | `#fcfdfc` `#fbf3ea` `#f3dece` `#dbf8fd` `#e9cb96` `#673b27` `#684735` `#c39466` `#fbcab9` `#91839a` |
| R3 | `#805069` `#6c3434` `#392933` | `#654b70` `#1d1925` `#362729` `#261925` `#452b2d` `#765172` `#161119` `#c56567` `#e97365` `#e66235` `#882d36` |
| R4 | `#fabc7c` `#a45d6b` `#362748` | `#03172d` `#fc9974` `#f77a77` `#573865` `#673a67` `#fca76a` `#fcf997` `#fbb86c` `#fac769` `#381b45` |

Shift rule applied: keep each reference's hue families, drop sky/ground values
by 40–65%, keep light-source colours at near full brightness but shrink their
area. R2 is inverted from day pastel to night: walls go deep plum-brown, the
lamp becomes the only strong light, the glass shows night blue.

## 3. The seven scenes

Palettes are the full allowed set for each scene (all under 32). Order inside
each group: darkest to brightest.

### a. `dusk-cottage` (R3) — home

Lone cottage at late dusk. Sky top almost night, a thin pink-ember band near the
horizon. Cottage centre-low, two warm windows plus an attic window, smoke curling
from the chimney. Two orange autumn trees framing left and right, the left one
larger. Stone path winding from the door to the bottom edge. Dark grass with a
few fallen-leaf pixels. Up to 30 dim stars in the top third.

1. Sky: `#120c18` `#1a1224` `#241830` `#2f1d3a` `#3e2444` `#5a2f4a` `#8a4552`
2. Smoke / far haze: `#3a2c44` `#4e3c58`
3. Stars: `#5a4a6e` `#a898b8` `#efe2cc`
4. Ground: `#0d0a0e` `#151016` `#1f1719` `#2a1f20`
5. Cottage: `#1c1012` `#2e1c1a` `#45291f` `#5c3826` (wall, plank lines, roof `#2a1a26` `#3b2433`)
6. Window light: `#7a4220` `#e8a040` `#ffd77a`
7. Tree: `#3a1416` `#6e2620` `#a8432a` `#d8702e` `#f0a24a`
8. Path: `#141012` `#3a3240` `#564a5a` `#76687a`

### b. `autumn-village-evening` (R1) — calendar

Hillside village after sunset, seen across a still lake. Navy-blue slopes stacked
in 3 depths, crimson and gold tree clumps packed between houses, timber-framed
houses with slate-blue roofs, a white-washed church tower on the right edge.
Many small lit windows (this is the "busy" scene; keep it below row 110). Lake
strip at the bottom with broken window reflections. Falling-leaf pixels sparse,
only in the lower half.

1. Sky: `#0a0f1e` `#111830` `#18203c` `#232a4a` `#3a3050` `#5a3a52`
2. Hill depths: `#0b1022` `#142040` `#1d2c52`
3. Roofs / walls: `#1a2440` `#283a66` `#2e2a3c` `#4a4250` `#6e6470` (church wall `#8a8090`)
4. Timber: `#1a1218`
5. Trees: `#2a0f1a` `#5a1a25` `#8e2a24` `#c24a1e` `#e08a24` `#f3c040`
6. Window light: `#a0582a` `#f0b048` `#ffe08a`
7. Lake: `#070b18` `#0f1830` `#1a2848`

### c. `sunset-town-afterglow` (R4) — Jira pages and tickets

R4 a few minutes after the sun has gone: the sun is a half disc sinking behind
the far forest, 3 stepped glow rings, 4–6 faint dithered rays. Above the glow
the sky falls fast to deep violet (top 40% must still meet the darkness budget —
the glow sits at rows 120–150, never higher). Layered conifer ridges in mauve,
then a silhouetted town: church spire with cross left of centre, gabled houses
with rim-lit roof edges (1px ember line on the sunward side). Very dark trees
filling both bottom corners, the right side darker.

1. Sky: `#0c0a1c` `#16102a` `#221636` `#331c40` `#4a2246` `#6a2c4a` `#93394c`
2. Glow rings: `#c2564c` `#e8804e` `#f8b060` `#ffe08a`
3. Far forest ridges: `#5a2a4a` `#43203f` `#2f1834`
4. Town: `#1e1230` `#2a1838` `#3a2244` (rim light `#e8804e`, windows `#f8b060`)
5. Foreground trees: `#03081a` `#081026` `#120e24` (leaf rim `#7a2a24` `#b8462a`)

### d. `night-cafe` (R2 mood) — notes, todo, daily-update, kanban

Interior of a small café-cottage at night. Dark plum-brown walls and plank
ceiling (calm top 40%, no detail beyond 1–2 plank seams). One brass pendant
lamp hanging top-centre-right with a stepped warm cone and pool of light on the
counter. Bottom band: a wooden bench with a calico cat asleep (orange/cream/
dark patches), a small round side table with a steaming cup, a potted plant on
the far right, a chalk menu board on the far left (no text: 3–4 pale lines).
Right third: a tall window / glass partition showing night blue outside with
diagonal rain streaks and one distant lit window.

1. Walls / ceiling: `#120c10` `#1a1216` `#24181c` `#2e1f22` `#3a2826`
2. Wood (floor, bench, counter): `#1c120c` `#2e1e14` `#4a301e` `#66442a`
3. Lamp light: `#5a3a22` `#9a6230` `#e8a848` `#ffd98a`
4. Night glass: `#0a1020` `#13203a` `#22345a` (rain `#3e5478`)
5. Cat: `#16100e` `#d8823a` `#efe2cc` `#8a7a70`
6. Plant: `#12201a` `#24402c` `#4a7040`
7. Menu board: `#1a1a1c` `#b8ac98`
8. Cup: `#d8c8b0` `#6e4a2e` (steam `#4a3a40`)

### e. `lantern-forest-lake` — eAuto runner pages

Night forest path beside a lake. Calm star sky with a thin crescent moon top
right (2 tones). Far shore: low pine ridge with 2–3 tiny lit cottage windows.
Lake across the middle-low band holding long lantern reflections. Near shore:
a dirt path from bottom-left curving into the trees, 3 wooden posts with hanging
lanterns (warm 3-ring glow each). Autumn canopies framing both edges at the
bottom, lit only on the lantern side.

1. Sky: `#070a14` `#0c1220` `#131a2e` `#1c2238` `#2a2a44`
2. Moon / stars: `#4a4e6a` `#b8b4c8` `#f0e8d0`
3. Pine ridge: `#060a12` `#0c141c` `#142028`
4. Lake: `#05080f` `#0b1424` `#14223a` `#24345a`
5. Ground / path: `#0a0a0c` `#18120e` `#2a2018` `#3e3024`
6. Lantern: `#2a1a10` `#7a4a22` `#e89a40` `#ffd27a`
7. Canopy: `#200c10` `#4a1a16` `#7e3420` `#b8582a` `#e0903a`

### f. `market-lane-night` — eAuto tool pages and /eauto

A narrow village market lane at night, one-point view down the street. Timber
houses on both sides lean in toward the middle (gable fronts), lower floors are
workshops with shutters, a few with warm open doorways. A string of 5–7 small
lanterns zig-zags across the lane at row ~110 (never above row 95). Cobbles in
the bottom third catching lantern light in small highlights. A cart with barrels
at bottom-left, a hanging shop sign bracket (no text) on the right. Narrow sky
strip between the rooftops, dark with a few stars.

1. Sky: `#090812` `#100e1c` `#181428` `#221a32`
2. House walls: `#1a1214` `#2a1e1c` `#3c2a24` `#4e3a2e`
3. Timber / shutters: `#0e0a0a` `#22140e`
4. Roofs: `#141420` `#222234` `#30304a`
5. Light: `#5a3418` `#a8642a` `#eca446` `#ffdc8a`
6. Cobbles: `#0e0c0e` `#1c1a1e` `#2c282e` `#4a4048`
7. Cart / barrels: `#2a1a10` `#4a2e1a` `#6a4426`

### g. `firefly-hillside` — settings, agents, knowledge, music, qa-flow, tests, eauto-flows, default

Quiet twilight hillside, the calmest scene. Deep blue-violet sky with a soft
plum band at the horizon and 40 stars. Two rolling hills in the lower third,
far one bluish, near one dark green-brown. Three tiny distant cottages on the far
hill with 1–2 lit windows each, one with thin smoke. A single small autumn tree
on the near hill, right of centre. 30–50 fireflies (1px warm yellow, some with a
1px dim halo) drifting over the near hill only.

1. Sky: `#090a18` `#0f1022` `#16162e` `#1f1c3a` `#2c2244` `#40284a`
2. Stars: `#4a4a6a` `#a0a0c0` `#f0ead8`
3. Far hill: `#141a30` `#1c2440`
4. Near hill: `#0a0e0c` `#121a14` `#1c2618` `#2a3420`
5. Cottages: `#1a1218` `#2e2028` (windows `#e8a848` `#ffd98a`)
6. Tree: `#3a1416` `#7a2a20` `#c0602a` `#eaa040`
7. Fireflies: `#6a6a2a` `#e8e070` `#fff6b0`

## 4. Page mapping

`data-page` comes from AppShell (`components/AppShell.tsx`, line 99:
`parts.slice(0, 2).join("-") || "home"`). Ticket detail pages therefore produce
`jira-<KEY>` values, not only `jira-key`. Use prefix selectors
(`[data-page^="jira"]`) so every Jira variant is covered.

| Scene | `data-page` values | Selector suggestion |
|---|---|---|
| a. dusk-cottage | `home` | `[data-page="home"]` |
| b. autumn-village-evening | `calendar` | `[data-page="calendar"]` |
| c. sunset-town-afterglow | `jira`, `jira-key`, `jira-filter`, `jira-mentions`, `jira-studies`, `tickets` (and any `jira-<KEY>`) | `[data-page^="jira"]`, `[data-page="tickets"]` |
| d. night-cafe | `notes`, `todo`, `daily-update`, `kanban` | list each |
| e. lantern-forest-lake | `eauto-12107`, `eauto-12153`, `eauto-12166`, `eauto-12257`, `eauto-12412`, `eauto-jomcheck` | list each |
| f. market-lane-night | `eauto`, `eauto-bdp-creator`, `eauto-checker`, `eauto-company-details-checker`, `eauto-company-details-checker-prod-v-staging`, `eauto-duitnow-qr`, `eauto-edereg-precheck`, `eauto-esim`, `eauto-estm`, `eauto-estm-legacy`, `eauto-insurance`, `eauto-preapp`, `eauto-quotation-reminder`, `eauto-secarang-plate-checker`, `eauto-shopping-cart` | `[data-page^="eauto"]` as the fallback, then e and g override |
| g. firefly-hillside | `settings`, `agents`, `knowledge`, `music`, `qa-flow`, `tests`, `eauto-flows`, and every unlisted page (default) | default rule on `[data-style="medieval"] main` |

Cascade order for the integrator: default (g) first, then `[data-page^="eauto"]`
(f), then the specific runner list (e) and `eauto-flows` (g) after it, so the
more specific rules win.

## 5. Technical spec for artists

1. Each scene is painted programmatically by a Node ESM script `scripts/medieval-scenes/<scene>.mjs` that writes `public/medieval/scenes/<scene>.png` using sharp from a raw RGBA buffer. Art resolution 400x225 (16:9) art pixels, PNG, no anti-aliasing, limited palette (<= 32 colours) with ordered dithering allowed for sky gradients; displayed scaled up with `image-rendering: pixelated`.
2. Composition: the UI sits on top, mostly in the middle/upper area; keep the scene's interest at the bottom and edges (horizon in the lower third, houses/trees framing), and keep the top 40% calm (sky with soft banded gradient, few stars). No text in images.
3. A shared helper module `scripts/medieval-scenes/lib.mjs` (written, tested 2026-10-27) with: canvas `create(w,h)`, `setPx`, `fillRect`, `line`, `circle`/`ellipse`, `polygon` fill, ordered (Bayer 4x4) `dither` between two colours, noise/seeded random, tree-canopy blob generator (clustered leaf pixels with highlight and shadow tones), house/cottage generator (walls, timber frame, roof with shingle rows, chimney, lit windows with glow), stone path generator, star field, fog band, sun/glow disc, `save(png)` via sharp, and `preview(png, outPath, scale)` that writes a 2x upscaled PNG for viewing.
4. Artists must view their own output (Read the preview PNG), compare side by side with the reference image, and iterate at least 3 times until it looks like proper pixel art in the reference style (clustered leaves, crisp silhouettes, warm glowing windows, readable shapes), not noise.
5. Use only the hex values in the scene's palette (section 3). `save()` prints the colour count and flags anything over 32.
6. Check the darkness budget (section 1.1) on the final PNG and print the three numbers.
7. Previews go to the session scratchpad, never into `public/` or the repo.
8. Run scripts from the repo root: `node scripts/medieval-scenes/<scene>.mjs`. Seed every `rng()` with a fixed number so the output is reproducible.
9. Safety: write only `scripts/medieval-scenes/<scene>.mjs` and `public/medieval/scenes/<scene>.png`. No edits to `.ts`/`.tsx`, `scripts/eauto-*`, tests, `app/api`, `lib`, `_reference`. No process stops or restarts.

### 5.1 lib.mjs API

| Function | Purpose |
|---|---|
| `rgb(hex)` | `'#rrggbb'` to `[r,g,b,255]` |
| `create(w, h, bg)` | New canvas `{ w, h, data }` |
| `setPx(c, x, y, col)` / `getPx(c, x, y)` | One pixel; out-of-bounds ignored |
| `fillRect(c, x, y, w, h, col)` | Solid rectangle |
| `line(c, x0, y0, x1, y1, col)` | 1px Bresenham line |
| `ellipse(c, cx, cy, rx, ry, col)` / `circle(c, cx, cy, r, col)` | Hard-edge fill; `col` may be `(x,y) => colour` |
| `polygon(c, pts, col)` | Scanline fill; `col` may be a function |
| `bayer(x, y)` / `dither(x, y, a, b, t)` | Bayer 4x4 threshold; choose `a` or `b` at mix `t` |
| `skyBands(c, y0, y1, colors, soft)` | Flat bands with short dithered seams |
| `ditherRect(c, x, y, w, h, col, t)` | Dither a colour over an area |
| `rng(seed)` | Seeded random; `.int(a,b)`, `.range(a,b)`, `.pick(arr)`, `.chance(p)` |
| `noise2(seed)` | Smooth 2D value noise `(x, y) => 0..1` |
| `canopy(c, r, { cx, cy, rx, ry, tones, light })` | Clustered leaf masses; `tones` dark to bright (5 recommended) |
| `trunk(c, r, { x, baseY, h, w, col })` | Trunk with branches; `col = [dark, light]` |
| `pine(c, r, { x, baseY, h, w, col, edge })` | Conifer silhouette |
| `ridge(c, { y, amp, freq, seed, col, edge })` | Hill / forest-line silhouette to the bottom |
| `stars(c, r, { count, yMax, colors })` | `colors = [dim, mid, bright]` |
| `fog(c, { y0, y1, col, max })` | Dithered horizontal mist band |
| `glow(c, { cx, cy, r, rings, step, outer, squash })` | Sun / lamp / lantern stepped halo |
| `rays(c, { cx, cy, angles, len, col, density })` | Dithered light shafts |
| `smoke(c, r, { x, y, h, drift, col })` | Chimney smoke, `col = [dense, thin]` |
| `scatter(c, r, { x0, y0, x1, y1, count, colors })` | Leaves, fireflies, sparks |
| `house(c, r, { x, baseY, w, h, roofH, pal, timber, lit, floors, gable, chimney, bloom, door })` | Cottage / town house; returns `{ chimneyTop, windows }` |
| `tower(c, { x, baseY, w, h, spireH, pal, cross })` | Church tower with spire |
| `stonePath(c, r, { pts, w0, w1, col })` | Winding slab path, far to near |
| `water(c, r, { y0, y1, base, ripple, reflect })` | Lake strip with light reflections |
| `countColors(c)` | Distinct colours |
| `save(c, path)` | PNG at art size; logs colour count |
| `preview(png, out, scale)` | Nearest-neighbour upscale for viewing |

`house()` `pal` keys: `wall`, `wallDark`, `frame`, `roof`, `roofDark`,
`roofHi`, `win`, `winGlow`, `winFrame`, `door`, `chimney`.

## 6. UI-over-scene spec (for the integrator)

1. The scene is the background of `<main>`: `background: var(--m-night) url(/medieval/scenes/<scene>.png) center bottom / cover no-repeat fixed; image-rendering: pixelated;`.
2. A dark overlay gradient at the top so headers read: `linear-gradient(to bottom, rgb(18 12 16 / .92) 0, rgb(18 12 16 / .55) 160px, transparent 45%)` layered above the image. Hard stops are allowed to keep it pixel-flat.
3. Panels and cards become dark oak at 88–92% opacity (`rgb(34 25 19 / .90)`, from `--m-oak-deep` `#221913`) with the existing 2px edges, so text contrast stays at or above 4.5:1. Muted and faint text must be re-checked on the worst case (panel over the brightest scene pixel behind it).
4. Header bars are solid dark (`--m-night` or `--m-oak-deep`, 100%).
5. The sidebar stays solid dark plum (`--m-plum` `#1c1519`), no scene behind it.
6. Inputs and code wells stay solid (`--m-well`), never translucent.
7. No `backdrop-filter` / blur anywhere (pixel style).
8. Optional 1px warm light edge on panels: `box-shadow: inset 0 1px 0 rgb(232 176 74 / .18)` added to the existing ring, not replacing it.
9. Page-title food icons (`--m-page-ico`) stay.
10. On phones the image still anchors bottom-centre; `cover` crops the sides. No horizontal scroll.
11. Respect `prefers-reduced-motion`: scenes are static; no parallax, no animated fireflies unless added later as a separate opt-in.
12. All selectors start with `[data-style="medieval"]`, per `COTTAGE.md` rule 12.

## 7. Files

1. `scripts/medieval-scenes/lib.mjs` — shared painter (this hand-off).
2. `scripts/medieval-scenes/<scene>.mjs` — one per scene (artists).
3. `public/medieval/scenes/<scene>.png` — 400x225 output (artists).
4. `app/styles/medieval/SCENES.md` — this file.
