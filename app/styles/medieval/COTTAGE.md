# Cozy Cottage — Medieval style guide (v3, 2026-10-27)

Minimalist cottage-kitchen medieval. Calm, warm, uncluttered. Replaces the
"town" version (too cluttered). `base.css` carries the whole look; page sheets
stay tiny and only add page-specific fixes.

## 1. Hard rules

1. Dark surfaces only. Light colours are for text and small accents, never fills.
2. Text contrast >= 4.5:1 on every surface it sits on.
3. Pass green, fail red, warning amber stay Tailwind's own colours. Never remap them.
4. Primary buttons are ember (orange-brown), not red, so they never read as "fail".
5. No textures on panels. No scattered props, banners, chains, rivets, battlements.
6. One pixel icon per page, before the page title. Empty states may show one at 4x.
7. 2px edges, small hard shadows (2–3px, no blur), square corners.
8. Edges are drawn as existing 1px border + 1px inset ring (box-shadow): no layout shift.
9. Never hide or cover controls. Decorative pseudo-elements: `pointer-events: none`.
10. No `clip-path` on containers. No horizontal scroll. Phone widths must work.
11. Logs, code, ticket keys: Geist Mono, never a pixel font.
12. Every selector starts with `[data-style="medieval"]`; page rules add
    `[data-page="..."]` on the same element.

## 2. Palette (tokens in base.css)

| Token | Hex | Use |
|---|---|---|
| `--m-night` | `#16110d` | page, `<main>`, body |
| `--m-oak-deep` | `#221913` | panels, cards |
| `--m-oak` | `#31241a` | secondary buttons, table head |
| `--m-oak-hi` | `#3f2e22` | hover |
| `--m-well` | `#120d0a` | inputs, code wells |
| `--m-plum` | `#1c1519` | sidebar |
| `--m-crust` | `#4a3526` | subtle border, dividers |
| `--m-crust-hi` | `#6e4a2e` | main border, input border, modal edge |
| `--m-cream-hi` | `#fff6e2` | brightest text, text on primary |
| `--m-cream` | `#f3e6cc` | body text |
| `--m-oat` | `#dccaa6` | secondary text |
| `--m-wheat` | `#c4ad85` | labels, table heads |
| `--m-muted` | `#b59e79` | muted text |
| `--m-faint` | `#ac9774` | placeholders, faint hints |
| `--m-honey` | `#e8b04a` | page titles, links, focus ring, active nav |
| `--m-hearth` | `#e78a45` | checkbox/radio/range accent |
| `--m-jam` | `#e0685f` | small accent (icons only) |
| `--m-herb` | `#8fbf6a` | small accent (icons only) |
| `--m-ember` | `#9c4a1c` | primary button fill (cream-hi = 5.7:1) |
| `--m-ember-dark` | `#853e16` | primary hover |
| `--m-ember-edge` | `#5e2a0e` | primary 2px ring |

Contrast checked: cream 14:1 on panel, muted 5.0:1 on hover, faint 4.6:1 on
hover (6.1:1 on panel), honey 6.6:1 on hover.

## 3. Background (behind content)

`<main>`: `--m-night` + faint 2px dark plank seams every 192px + a stepped
(3 flat bands) hearth glow from the lower-left corner. Nothing else. No bricks,
no moss. Panels sit on it as flat dark oak.

## 4. Type

| Role | Font | Size / colour |
|---|---|---|
| Page title (`main header h1`, `h1.tracking-tight`) | Jersey 10 | 1.6rem (1.3rem phone), honey, 2px hard text shadow |
| h1 elsewhere, h2–h4 | DotGothic16 | Tailwind size, own colour |
| Buttons, sidebar nav | DotGothic16 | Tailwind size |
| Labels (`.uppercase`), `th` | DotGothic16 | letter-spacing .02em |
| Body text, inputs, table cells | Geist Sans | readability decision: pixel fonts are hard to read at text-xs |
| Logs, code, keys (`.font-mono`, code, pre, kbd) | Geist Mono | unchanged |

## 5. Components

1. Panel / card (`.rounded-xl.border`, `.rounded-2xl.border`, slate-900 cards):
   crust border + 1px inset crust ring, `3px 3px 0` shadow. Status-coloured
   borders (red/green/amber/blue...) keep their colour, 2px shadow only.
2. Primary button (`bg-blue-*`, `bg-indigo-*`): ember fill, cream-hi text,
   2px ember-edge ring, 2px hard shadow; hover darker; press = 1px nudge.
3. Secondary button (`bg-slate-800/700` on button/a): oak, 2px crust ring.
4. Danger button: Tailwind red unchanged, 2px hard shadow added.
5. Input / select / textarea: well fill (only when it already had a slate
   bg), crust-hi border, honey border + 1px outline on focus. Bare inline
   editors stay transparent.
6. Checkbox / radio / range: hearth accent.
7. Table: oak `thead`, Silkscreen wheat `th` with 2px crust underline, faint
   honey row hover (not on rows that carry their own bg colour).
8. Badge / pill (`.rounded-full` with `px-`): 2px corners, colours unchanged.
   Dots, toggles, avatars stay round.
9. Modal: overlay `rgba(12,8,6,.78)`; dialog crust-hi edge, `6px 6px 0` shadow.
10. Sidebar: plum, 1px crust right edge; active item honey text, 12% honey
    tint, 3px honey left bar.
11. Divider (`hr`): 2px crust line. Selection: honey bg, dark text. Focus: 2px honey.

## 6. Pixel icon set

16x16 art, `shape-rendering='crispEdges'`, tokens `--m-ico-<name>`.
Sizes: 32px (2x) page title, 16px (1x) on phones, 64px (4x) empty state.

`bread`, `soup` (with steam), `pie`, `mug` (with steam), `candle`, `cheese`,
`apple`, `jam` (jar, gingham lid), `honey` (pot), `herbs` (tied bundle),
`window` (lit cottage window), `spoon` (wooden), `teapot`.

Where they may appear:
1. Page title: `main header h1::before` (and `h1.tracking-tight`), from
   `--m-page-ico`. The lucide icon directly before that h1 is hidden.
2. Empty states, 64px only: page sheets swap an existing lucide empty-state
   tile or bare icon for the page icon (CSS only). New code may use the opt-in
   class `.m-empty` (pick with `--m-ico: var(--m-ico-pie)`; default is the
   page icon).
3. Nowhere else: no small icons beside hints, rows or buttons.

## 7. Page-to-icon map (`data-page` → icon), set in base.css

| data-page | Icon |
|---|---|
| home | window |
| calendar | candle |
| todo | bread |
| kanban | pie |
| notes | jam |
| knowledge | honey |
| jira, jira-key, jira-filter, jira-mentions, jira-studies | cheese |
| tickets | cheese |
| tests | apple |
| qa-flow | herbs |
| daily-update | mug |
| settings | spoon |
| agents | teapot |
| music | candle |
| eauto (hub) and every eauto-* runner (12107, 12153, 12166, 12257, 12412, quotation-reminder, shopping-cart, jomcheck, duitnow-qr) | soup |
| eauto tools: estm, estm-legacy, esim, bdp-creator, preapp, checker, company-details-checker(-prod-v-staging), secarang-plate-checker, insurance, edereg-precheck | mug |
| eauto-flows | herbs |
| anything unmapped | window |

## 8. Page sheets

`shell.css`, `home.css`, `calendar.css`, `workspace.css`, `notes.css`,
`jira.css`, `eauto-runners.css`, `eauto-tools.css` hold only page fixes the
base cannot reach. `ambient.css` stays empty (the mossy brick wall is gone).
To change a page icon: `[data-style="medieval"][data-page="x"] { --m-page-ico: var(--m-ico-y); }`.
