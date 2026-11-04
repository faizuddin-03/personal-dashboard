# EAINT-12406: Claude-driven test run (Secarang staging /ia/ + CIBO)

Started 2026-11-04 on the second laptop. Faizuddin guides; Claude drives the browser
(Playwright plugin) and records. Same method as `../../EAINT-12028/claude-run-2026-11-04/RUN-PLAN.md`.

## Sources (already in the repo, so the board does not need re-opening)

- Azfar's state: `../EAINT-12406-azfar-STATUS-20261103.md` (identical to
  `scripts/eauto-12406/cr/EAINT-12406/STATUS.md`, Azfar commit 6c04297).
- TS and expected points: `scripts/eauto-12406/cr/EAINT-12406/01-intake/scenarios.yaml`,
  specs `03-spec/*.cr.spec.ts`, flows `automation/src/flows/secarang.flow.ts`, `cibo.flow.ts`.
- Workbook: `../EAINT-12406 - [Secarang-Allianz] To Allow and Display Allianz in Secarang Including Logo and Wording.xlsx`.
- Board snapshot: `../EAINT-12406-azfar-ts-board-artifact-20261103.html`.

## Recording: Azfar's style (Faizuddin, 2026-11-04: "follow Azfar's style of recording")

**Not** the 12028 amber/green recorder. Use `scripts/claude-run/recorder-azfar.js`, which copies
Azfar's `ts` fixture (`scripts/eauto-12406/automation/src/fixtures/ts-run.ts`, `highlight.ts`,
`window-video.ts`).

**On screen**
- Navy title card at the start of a TS (TS id, situation, `staging /ia · time MYT`).
- A "Now: Secarang" / "Now: CIBO" card at every switch between sites, and an "End of <TS>" card at the end.
- A live "● REC hh:mm:ss" clock at the top of every page.
- Clicks and typing get a short red-outline, yellow-wash mark with a label.

**Proofs**
- Each expected point is proved with `R.prove('E1', {shows, match, hl})`.
- The screenshot shows a red box round the element and a navy banner at the bottom:
  `time MYT · staging/ia · side · path · TS · E1: what it shows`.

**Video**
- One video per TS, `video_<TS>.webm`.
- The Fiuu window gets its own video, which `finish-ts.mjs` lays into the TS video with ffmpeg
  (bottom right, orange frame, from the second it opened). Azfar 29.10: one video per TS, the
  payment window included.

**Files in each TS folder**
- `NN-<name>.png` screenshots.
- `checks.txt`, one line per point: `when | point | expected | page shows | matches | screenshot`.
- `proofs.json` and `gate.json`. The verdict is VALID, DEFECT or EVIDENCE.
- Downloads (the receipt PDF and the rest) in `downloadable/`.
- `_raw/`: the window videos.
- Videos are git-ignored and stay on this laptop.

**Steps for each TS**
1. Set `page.__ROOT` to this folder.
2. Load the recorder.
3. `R.start(TS, situation, points)`. The points come from `scripts/eauto-12406/cr/EAINT-12406/01-intake/ts.json`.
4. Run the steps.
5. `R.finish()`. Save its return as `<TS>/_raw/finish.json`.
6. Run `node scripts/claude-run/finish-ts.mjs <TS folder> <TS>/_raw/finish.json`.

## Where Azfar left it (30.10, simulator)

| Result | TS |
|---|---|
| PASS 19 | CP_TS1–6, CP_TS8 · QT_TS1 · E2E_TS4, 5, 9, 10 · RC_TS3, 5, 6, 9, 10 · RG_TS1, RG_TS3 |
| FAIL 3 | RC_TS1 (D1 + D2), RC_TS2 (D1), RC_TS8 (D1). Drafted, not posted |
| KIV 7 | E2E_TS1–3 (Q44 cover note) · QT_TS7 (BA) · RC_TS11 · CP_TS7, E2E_TS8 (production) |
| BLOCKED 1 | E2E_TS12 (Q46, > RM2,000 on the Fiuu sandbox) |
| RE-RUN 2 | RC_TS4 E5, RG_TS2 (need QT_TS4) |
| Not run | QT_TS2/4/5/6 (unavailable plates) · 8 orange ON HOLD · RC_TS7 |

Ticket was moved to **In Development** by Dev on 02.11. What Dev is changing is not known.

## New for this run: real-API (SIT) pass

Azfar (04.11): "kena tambah sikit yang guna real api". The simulator accepts any data. With
Allianz's real UAT API, the IC must be **real** (Allianz checks it), and the simulator-only
points can only be judged there. Example: E2E_TS9 gender re-pricing, because the simulator
ignores gender.

## Rules (from Azfar's cr-runner)

- Never re-run a TS to get it green.
- Report a fail as the expected result and what actually happened.
- No Jira action without Faizuddin's OK.
- Keep going when one TS blocks.
