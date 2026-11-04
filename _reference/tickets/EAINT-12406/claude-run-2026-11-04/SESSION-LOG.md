# EAINT-12406: Claude-driven run, session log (read this first to pick up)

Faizuddin's rule (2026-11-04): save every important detail of the session here, so the next
session can pick up from this file alone. Newest entry at the bottom. Each entry gives what was
decided, what ran, what is open, and what comes next.

Files in this folder:
- `RUN-PLAN.md`: method, sources and Azfar's state.
- `RESULTS.md`: one line per TS.
- `<TS>/`: the screenshots and video for each TS.

## 2026-11-04 (second laptop)

**Set-up done**
- Read Azfar's 12406 material from the repo; his artifact board was not re-opened:
  - `../EAINT-12406-azfar-STATUS-20261103.md`
  - `scripts/eauto-12406/cr/EAINT-12406/` (commit 6c04297)
  - the board snapshot `../EAINT-12406-azfar-ts-board-artifact-20261103.html`
- Azfar's message (04.11):
  - "Tapi kena tambah sikit yang guna real api, lepastu sekarang ada blocker tu".
  - He pasted his defects and questions list: D1, D2, Q44, Q46, Plates, Q42, Q45, N1, QT_TS7, Q16,
    Q40, Q43, observations C1–C5, N2, S1.
  - All of these are already in his STATUS file. The same list is in `lib/ticketStudies.ts` under EAINT-12406.
- Recorder: `scripts/claude-run/recorder.js`. The 12028 session moved it there and rewrote it.
  - Set `page.__ROOT` to this folder before loading it.
  - `page.__PASS` is only needed for BO logins, so not for Secarang or CIBO.
- Credentials:
  - Secarang site password, IC, FPX and card details: `app/eauto/12107/page.tsx` DEFAULT_CREDS.
  - CIBO login: `scripts/eauto-12406/automation/env/env-default`.
- Nothing has run yet.

**Open questions put to Faizuddin (answers go below)**
1. Is /ia/ on Allianz's real UAT API now, or still the simulator? Which TS does Azfar want on the real API?
2. What real IC, plate and postcode should be used for real-API quotes?
3. Which blocker does Azfar mean: Q44, Q46, Serba Sentral API down, or something new?
4. Which TS should be run first?

**Answers (Faizuddin, 2026-11-04)**
1. /ia/ is on Allianz's **real UAT API now**. First TS: a real-API Allianz purchase
   (quote → pay → receipt), plus E2E_TS9 gender re-pricing.
2. Faizuddin will give a real IC, plate and postcode. The real API checks the IC, so made-up
   plates (HXA…) will not quote.
3. Blocker: Faizuddin is not sure. "It should be in the details of the message he gave."
   - Azfar's section B lists the blocking questions: Q44 (no cover note, E2E_TS1–3),
     Q46 (over RM2,000, E2E_TS12), and Plates (QT_TS2/4/5/6).
   - Observation C5 says the Serba Sentral (Allianz) staging API looked down on 30.10.
   - For a real-API run, C5 and Q44 matter most. They are checked on the first quote and
     purchase, not assumed.

**Recording style (Faizuddin, 2026-11-04):** "for the recording on this one, i want you to follow Azfar's style of recording".
- Built `scripts/claude-run/recorder-azfar.js` and `scripts/claude-run/finish-ts.mjs`. They copy Azfar's
  title cards, REC clock, red-box proofs with the bottom banner, `checks.txt`, `proofs.json`, the gate verdict,
  and the Fiuu window as a picture-in-picture.
- Method: `RUN-PLAN.md` § Recording.
- ffmpeg is at the WinGet Gyan.FFmpeg path; `finish-ts.mjs` finds it on its own.
- Not yet tried on a live page. The first TS is also the recorder's first run.

**Real-API test data (Faizuddin, 2026-11-04):** use `../secarang-insurance-checker_2026-11-02 (1).xlsx`.
- Sheet "Secarang Insurance Checker": 1,032 real plate/IC pairs, all "Private".
- Results: 394 PROCEED (quotation page shown), 84 ERROR at Vehicle details, 554 ERROR at Home form.
- The sheet does not say which insurers quoted. Pick PROCEED rows in order and check that Allianz
  is on the quotation page before buying. Record the row number and plate used here.
- The ICs stay in the xlsx only; this log does not copy them.
- Postcode: not in the sheet. Use 55000, the 12107 dashboard default, unless told otherwise.

**Blocker: shared browser (2026-11-04)**
- The first real-API quote check could not start. The Playwright MCP said "Browser is already in use for
  ...\ms-playwright-mcp\mcp-chrome-071c212, use --isolated to run multiple instances".
- Cause: the EAINT-12028 session on this laptop drives the same plugin browser profile.
- The plugin config (`~/.claude/plugins/.../playwright/.mcp.json`) is `npx @playwright/mcp@latest`, with no
  `--isolated` and one shared profile.
- Two ways out:
  - (a) wait for, or close, the 12028 browser;
  - (b) add a second MCP server with `--isolated` for this project, then restart this session.
- Quote check planned: checker xlsx PROCEED rows 5, 6, 11, 13 …, postcode 55000, and see whether Allianz quotes.
- Faizuddin chose to **wait until the 12028 run finishes**, then free the browser. "in the meantime, you set up
  anything that you can from your side".
- Done while waiting: `BRIEF-E2E_TS1-TS9.md`. It covers the data sources, Azfar's verified selectors, and the steps
  with E-points for both TS. Owner, FPX and CIBO values come from `app/eauto/12107/page.tsx` DEFAULT_CREDS.

**Next:** when Faizuddin says the browser is free, load `recorder-azfar.js`, then run E2E_TS1 from row 5
(see BRIEF). Then run E2E_TS9.
