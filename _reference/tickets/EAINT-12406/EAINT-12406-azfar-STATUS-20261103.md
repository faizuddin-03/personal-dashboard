# EAINT-12406 — status

One page. If this is out of date, nothing else in the folder can be trusted.

| | |
|---|---|
| Ticket | EAINT-12406 |
| Title | [Secarang-Allianz] To Allow and Display Allianz in Secarang Including Logo and Wording |
| Environment | **Secarang staging /ia/** (https://staging.secarang.com/ia/car-insurance; site password only, no user login; pages /ia/about-us, /ia/faq, /ia/support …) + **CIBO https://staging.secarang.com/cibo** (login /cibo/auth/login), the team's admin login. **/ia/cibo is NOT CIBO** (it falls back to the Secarang app); CIBO and /ia/ share the back end /ins-api (before-deploy walk 28.10). /ia/motorcycle-insurance does not exist. /ia/ is on the **simulator** now (any data quotes); a SIT pass on Allianz's real UAT API may be added (Azfar choosing the rows, no SIT label yet). **Not deployed yet** 28.10 (Azfar) |
| Stage | **v6 + v6b (29.10 evening) + v6c / v6d / v6e (30.10), approved at gate 0** (Azfar 29.10; full permission granted 29.10 evening, open calls decided 29.10 under Azfar's full permission, main session). 46 TS, 150 expected points, 7 yellow, **8 orange still ON HOLD** with their reasons (CP_TS9, QT_TS3, QT_TS8, QT_TS9, QT_TS10, E2E_TS6, E2E_TS7, E2E_TS11), E2E_TS12 and RC_TS11 approved, RG_TS4 deprioritised, production rows CP_TS7 / E2E_TS8 on hold until go-live. v6 = E2E_TS5 E2, E2E_TS9 without TIN, RC_TS1 E9 recorded + new E10, RC_TS10 print, RC_TS6 discount-code rule, Q44, Q45, N1. Board update without re-seeding: `01-intake/board-changes-2026-10-29-v6.json` (15 cases, 3 test-data docs, Q44, Q45). v6b: `01-intake/board-changes-2026-10-29-v6b.json` (E2E_TS5, E2E_TS9, E2E_TS12; no result / decision / run-state fields). v6c: `01-intake/board-changes-2026-10-30-v6c.json` (E2E_TS9, E2E_TS12; same fields left out). v6d: `01-intake/board-changes-2026-10-30-v6d.json` (E2E_TS12; same fields left out). v6e: `01-intake/board-changes-2026-10-30-v6e.json` (RC_TS10; same fields left out). **TS edited after approval: any of the 15 changed TS that already ran is RE-RUN** (or PASS on existing evidence only where just the expected changed and the evidence already shows it). Not on Jira, not committed |
| Staging | Secarang /ia/ + CIBO https://staging.secarang.com/cibo (Q1 answered) — every run is checked against it; production only quote-to-payment-page (CP_TS7, E2E_TS8) |
| Live scenario page | TS board (draft, gate 0): https://claude.ai/artifact/7xguCHVWNb2oXDKgpDyZWT · TS Hub row EAINT-12406 |
| Lanes | 1 (or 2 once automation/env/lanes.md says lane 2 is ready) |
| Phased | **yes**. Not deployed yet (Azfar 28.10, Q11). BEFORE halves **run 28.10 15:14–15:23** (one video per TS, `05-evidence/pre-push/<TS>/`, personal data git-ignored): CP_TS8 E1/E3/E4/E5 captured, **E2 blocked** (simulator gave 'no instant quotation' for a made-up IC; needs the IC the team uses on /ia/); QT_TS3 captured with a made-up SSM ('unable to retrieve your vehicle information'; a real company SSM still needed for Q40); RC_TS8, RG_TS1, RG_TS2, RG_TS3 captured. RG_TS4 deprioritised (Azfar 28.10: eAuto and Secarang are different systems). AFTER: `03-spec/before-run/ts-before.mjs <TS>` with PHASE=after |
| Effort | **4 + 1 = 5 QA-days** (Azfar 28.10; was 4 + 1.5 = 5.5 after research 27.10, ~36 TS designed, incl. 0.5 day to learn Secarang). Earliest deployment 05.11 if prep starts 29.10 · actual — |
| Updated | 2026-10-30 (cr-draft v6e) |

## Where it ended — morning 30.10.2026 (read this first, Azfar)

Dev pushed 12406 to /ia/ on 29.10; testing ran 29.10 afternoon → 30.10 morning, 3 at a time, flows Secarang +
CIBO VERIFIED (runs all2 / c4). Open calls were decided under your full permission (29.10 evening) and are cited as
such in scenarios.yaml (v6 → v6e). Board: https://claude.ai/artifact/7xguCHVWNb2oXDKgpDyZWT

| Result | TS |
|---|---|
| **PASS 19** | CP_TS1–6, CP_TS8 · QT_TS1 · E2E_TS4, TS5, TS9, TS10 · RC_TS3, TS5, TS6, TS9, TS10 · RG_TS1, RG_TS3 |
| **FAIL 3** (defects, drafted, NOT posted) | RC_TS1 (D1 + D2), RC_TS2 (D1), RC_TS8 (D1) — RC_TS1 / TS2 re-confirmed 30.10 retest F |
| **KIV 7** | E2E_TS1–3 (cover note Q44) · QT_TS7 (document dates, BA) · RC_TS11 (recorded; needs QT_TS4) · CP_TS7, E2E_TS8 (production, on hold by you) |
| **BLOCKED 1** | E2E_TS12: RM2,510.87 can't be paid on the Fiuu sandbox (FPX + card P15 > MYR 2,000, GrabPay blank) — Q46 |
| **RE-RUN 2** | RC_TS4 E5, RG_TS2 (need QT_TS4's Lonpac purchase) |

**Jira since 30.10 (read 03.11):** SRD still v1.1 (26.10, no new attachment); no comments. 02.11 10:06 Charmain set QA =
Azfar + **Muhammad Faizuddin Bin Bidi**; 02.11 15:20 Dev Mong Guo Hao moved the ticket Ready For Development → **In
Development** (reason not written; D1 / D2 still not posted). Ask Dev what is being changed before re-running anything.

**30.10 afternoon (main laptop), retests:** batch F `eaint-12406-retest-sretest-20261030-1640-F` (RC_TS1 FAIL D1+D2,
RC_TS2 FAIL D1, RC_TS6 PASS) and batch G `…-1700-G` (RC_TS10 PASS, RG_TS1 PASS), staging /ia/ + CIBO, lane 1, both
reviewed by cr-evidence (board + `05-evidence/review.json`; no Review box ticked). RC_TS10 E4 checked page 1 only
(20 rows) of the 'Insurance created' filter. TS Hub: 19 pass · 3 fail · 1 deprio / 46. Workbook not rebuilt yet.
| Not run | QT_TS2 / TS4 / TS5 / TS6 (need Dev's 'unavailable' plates — you asked to be told first) · 8 orange ON HOLD · RC_TS7 (orange) |
| Deprioritised | RG_TS4 (you, 28.10) |

**Defects ready to post** (`05-evidence/issues/D1/`, `D2/`; Jira posting was blocked by Claude Code's safety check
while you were away — say "post them"):
- **D1** (Low) — Allianz company number follows "Berhad" instead of its own line, on new Secarang receipts, CIBO
  receipts (new + old BR55004010) and the e-receipt email. SRD REQ-010.
- **D2** (Medium) — Allianz receipt "Premium after NCD" RM 882.16 instead of RM 862.16 (All Drivers RM20 counted
  twice); every Allianz purchase since the deploy (PDF, CIBO, email); the old May-2025 transaction adds up. Total right.

**To send (ready-made):**
- **Dev (Mong Guo Hao):**
  1. Q44 — does /ia/ return an Allianz cover note / policy no. / e-Certificate? Every paid Allianz purchase shows
     Cover Note "-", Policy "-", no e-Certificate (old May-2025 one too; EAINT-6345); Tokio Marine gets one in 15 s.
  2. Q46 — how to pay > RM2,000 on the Fiuu sandbox (P15); and when the gateway refuses, Secarang shows a blank
     window with no message.
  3. Simulator plates for QT_TS2 (Allianz unavailable), QT_TS5 (Lonpac unavailable), QT_TS6 (Tokio Marine
     unavailable), QT_TS4 (individual non-renewal: Allianz unavailable, Lonpac quotes) — what counts as non-renewal?
  4. FYI: the /ia/ simulator ignores gender for every insurer (E2E_TS9 gender point needs a real-API pass);
     a card payment once hung on Secarang's "Just a little moment..." page after a successful payment (BR60006337).
- **BA (Lim Yi Link):** QT_TS7 — SRD says Allianz documents "dated 2022" but PDS says "valid as at 03/06/2020",
  Privacy Notice "3 March 2020", Claim Guide is a BNM/PIAM leaflet; pass condition is "existing documents
  displayed" — OK? · Q45 RC_TS9 no payment badge vs mockup "Unpaid" · Q42/D1 line break vs wrap · N1 the Success
  page Print view has no Insurer block · Q43 CRM · Q16 Allianz commission (Commission Report lists only purchases
  with a discount code; RJC7 commission RM0.00).

**Test data created on /ia/ (own, made-up plates HXA0001A–HXA0020A):** about 35 paid Allianz purchases + 1 Tokio
Marine, a dozen unpaid records; receipts went to your Gmail **Spam** (sender noreplyiatest@bintangprospek.com).

**Changed in the repo (not committed):** new automation `automation/src/pages/secarang/`, `pages/cibo/`,
`flows/secarang.flow.ts`, `flows/cibo.flow.ts`, `fixtures/window-video.ts` (one video incl. the payment window),
verify specs; `.claude/workflows/cr-execute.js` (3 at a time default), `.claude/agents/cr-author.md` (own plate
per TS), `.claude/agents/cr-evidence.md` (work files inside the repo → no permission prompts);
`knowledge/portals/cibo/portal.md` (new), `knowledge/_core/environments.md`, `knowledge/playbooks/how-we-work.md`.

**Next steps (paused 30.10 ~11:00 to move to another PC):**
1. ~~Re-run the CIBO flow verify~~ **DONE 30.10 11:05** on the main laptop: run `EAINT-12406-verify-cibo-c5-20261030-1105`,
   11/11, cr-evidence clean → cibo.flow.ts **VERIFIED** (only the "kept" second-sign-in path was exercised).
2. Retest, 3 at a time: RC_TS1, RC_TS2, RC_TS6, RC_TS10, RG_TS1 (script fixes of 30.10 morning, typecheck clean,
   not run; see `02-plan/coverage.md` "Retest fixes, second pass, 30.10.2026"). RC_TS1/TS2 E1 is now stricter
   (expected to fail with D1). **BLOCKED on this PC (30.10 ~11:15):** these TS read the purchases handed on by
   E2E_TS1–4 / E2E_TS10 (`04-runs/*/handoff.json` + the Secarang receipt PDFs those point to), which exist only on
   the retired laptop. Azfar 30.10: copy them across (not re-buy). Needed: the old laptop's
   `cr/EAINT-12406/04-runs/` (all run folders) and the images in `05-evidence/` → same paths here. Note:
   `handoff.json` stores the receipt PDF's absolute path; if the old repo path differs, the paths need rewriting.
   30.10 ~16:20: Azfar downloaded the old laptop's folders as `Downloads/OneDrive_2026-10-30.zip` (2.2 GB; inner zip
   `EAINT-12406-runs-evidence-slim-30.10.2026.zip`, no traces / HTML reports). **Merged ~16:40**: 2,269 files written into
   `04-runs/` + `05-evidence/`, 245 already here skipped (nothing overwritten). The old laptop's repo was
   `C:\Users\Azfar\Documents\Github Pro\eauto-qa-azfar\`: the 8 `handoff.json` paths were rewritten to this PC (5 files,
   backup `handoff.json.old-laptop`), every path now exists. Retest batch F (RC_TS1, RC_TS2, RC_TS6) started ~16:40.
   **30.10 afternoon (Azfar): the Serba Sentral (Allianz) staging API seems down**; no new Secarang quote / purchase
   until Azfar says it is back. The 5 retests only read CIBO and saved receipts (no new purchase).
3. When Dev answers: Q44 → re-run E2E_TS1–3 cover-note points; Q46 → re-run E2E_TS12; plates →
   QT_TS2/4/5/6 (tell Azfar first), then RG_TS2, RC_TS4 E5, RC_TS11 E2.
4. Post D1 + D2 with Azfar ("post them").
5. Before any SharePoint upload: E2E_TS9's evidence is in `05-evidence/FAILED/12406_E2E_TS9/2026-10-29T12-05-44_DEFECT/`
   (PASS on it after v6c) — move it to the valid folder first.

**30.10.2026 (Azfar): all work continues on his main laptop; the other laptop is retired.** Its git work was pulled
here (commit 178e19d). Its screenshots and videos (`04-runs/`, the images in `05-evidence/`) are git-ignored and must
be copied across by hand before SharePoint hand-over; this PC has only the text files (checks, gate, proofs).

**Continue on another PC:** `git pull`, then in Claude Code type "continue EAINT-12406". Not in git (copy by hand
if needed): `automation/env/.staging.env-local` (CIBO login, Secarang site password, SECARANG_TEST_EMAIL/PHONE —
never commit it), the evidence and run folders (`05-evidence/`, `04-runs/` are git-ignored; they stay on Azfar's
main PC), Claude memory (`~/.claude/projects/<repo>/memory/`). Tools on the new PC: `npm install` +
`npx playwright install` in `automation/`, ffmpeg (for the one-video merge), pdftotext, Python + PyMuPDF.

## Where it is

- [x] `00-input/` — latest SRD + `ticket.md` (cr-fetch), team workbook if any
- [~] `01-research/study.md` — current behaviour + prior CRs (cr-research). 27.10.2026: shared Secarang / CIBO study written at `cr/EAINT-12406/01-research/secarang-study.md` (how the team tested Secarang, rates, what carries over to this ticket); awaiting Azfar's review. Ticket-specific study.md not written yet
- [x] `01-intake/review/<date>-coverage.md` — the draft checked by cr-coverage-review, gaps applied. 28.10.2026: `2026-10-28-coverage.md`; applied in draft v2 (§9 lists applied / not applied: M19 phone browser and M20 eAuto receipt not applied, both questions)
- [~] `01-intake/scenarios.yaml` + draft workbook / live page (cr-draft) — **approved by a human (gate 0, the only gate)**; for a team workbook, the column mapping confirmed instead. 28.10.2026: drafted v1 (34 TS); v2 the same day after the coverage review + SA brief (44 TS); v3 the same day after the team doc 'Secarang & CIBO QA Knowledge' (44 TS, 140 points, 36 questions); not approved
- [ ] knowledge promoted from the study (cr-research promote)
- [~] `02-plan/coverage.md` — TS → spec file, or why it has none (cr-author, per sheet). 29.10.2026: sheet CP done (CP_TS1-6, CP_TS8 post-push written; CP_TS7 ON HOLD (production, Azfar 29.10 "the production one put on hold first"); CP_TS9 on hold; re-checked against the 15:16 yaml). Sheet QT revised for v5 on 29.10: QT_TS1, TS2, TS4-TS7 written (QT_TS7 is new, `2-secarang-allianz-documents.e2e.cr.spec.ts`); TS3, TS8, TS9, TS10 on hold. QT_TS2 / TS4 / TS5 / TS6 wait for Dev's simulator set-up. The QT_TS7 Claim Guide PDF cannot be read by the script, so the QA judges it
- [~] `03-spec/` — specs written for approved TS only; flows used are VERIFIED (automation/src/flows/README.md). 29.10.2026: `1-secarang-pages.func.cr.spec.ts`, `1-secarang-before-after.e2e.cr.spec.ts` (sheet CP, not run); re-checked against v5 the same day (CP_TS8 E2 now proved as "recorded as not available"; BEFORE copies labelled "FROM THE BEFORE CAPTURE"); secarang flow VERIFIED 29.10. Sheet E2E (`3-secarang-allianz-purchase.e2e.cr.spec.ts`): TS1-TS5, TS10 written, not run; re-checked 29.10 evening: E2E_TS8 now ON HOLD (production), its test removed; TS9 cannot be implemented as written (no TIN field for an individual owner, question to Azfar)
- [ ] `04-runs/` — at least one run, with its environment recorded (phased ticket: pre-push AND post-push)
- [ ] `05-evidence/` — collected, and **reviewed by cr-evidence** (INDEX.md has no `pending`); results on the live page / results workbook
- [ ] `05-evidence/issues/DRAFTS.md` — every finding compiled, duplicates checked, tickets raised with the QA's OK (cr-defect)
- [~] `04-explore/` — UI / exploratory pass against the latest mockup (cr-explore) · 28.10: before-deploy walk (CIBO + Secarang /ia/ pages, `04-explore/2026-10-28-before-deploy/`), full CIBO map (`04-explore/2026-10-28-cibo-map/` → team page `knowledge/portals/cibo/portal.md`). Personal-data captures git-ignored. Not yet: quotation cards page, company search (QT_TS3), eAuto order (RG_TS4)
- [ ] results signed off by a human

## Cases

| Case | Priority | Spec | Last run | Result |
|---|---|---|---|---|
| 12406_CP_TS8 BEFORE / AFTER Secarang pages (yellow) | P2 | – | – | – |
| 12406_CP_TS1–TS4 (Home logos, About Us, FAQs, Support order); CP_TS7 production look + quote (no payment) | P1 | – | – | – |
| 12406_CP_TS5–TS6 (Support expand / collapse, look vs mockup) | P2 | – | – | – |
| 12406_CP_TS9 Terms of Use (orange Q22) | P3 | – | – | – |
| 12406_QT_TS1, TS2, TS4 (all three quote; Allianz none; non-renewal + Lonpac purchase) | P1 | – | – | – |
| 12406_QT_TS3 company owner (yellow + orange Q40: SRD unavailable card vs 'no insurer supports company' today) | P2 | – | – | – |
| 12406_QT_TS5–TS7 (Lonpac none; Tokio Marine none; Allianz documents) | P2 | – | – | – |
| 12406_QT_TS9 Allianz error / no answer (orange Q35) | P2 | – | – | – |
| 12406_QT_TS8 motorcycle (orange Q19), QT_TS10 refer-risk (orange Q36) | P3 | – | – | – |
| 12406_E2E_TS1 Allianz FPX Online banking (+ cover note, Policy No, e-Certificate, Ref ID) | P1 | – | – | – |
| 12406_E2E_TS2 Credit or Debit Card (+ discount), TS3 PayLater by Grab, TS5 failed / cancelled payment, TS9 add-ons + TIN, TS10 Allianz > Tokio Marine (the Tokio Marine purchase), TS8 production to payment page | P2 | – | – | – |
| 12406_E2E_TS11 road tax (orange Q25), E2E_TS7 MacroKiosk (orange Q7), E2E_TS12 add-on options + all-add-ons purchase (orange Q32, v4 Zurich gap) | P2 | – | – | – |
| 12406_E2E_TS4 SPayLater; E2E_TS6 cover note failed (orange Q18) | P3 | – | – | – |
| 12406_RC_TS1–TS3 receipt Secarang / CIBO, Transaction Details | P1 | – | – | – |
| 12406_RC_TS4–TS7, TS9, TS10 CIBO listing, reports, customer messages, unpaid tx, search / filters; RC_TS8 old Allianz tx (yellow) | P2/P3 | – | – | – |
| 12406_RC_TS11 CIBO CRM record of the Allianz buyer (orange Q43, v4 Zurich gap) | P2 | – | – | – |
| 12406_RG_TS1 Tokio Marine, RG_TS2 Lonpac (yellow) | P2 | – | – | – |
| 12406_RG_TS4 eAuto UCD order (yellow) — **DEPRIORITISED by Azfar 28.10** (eAuto and Secarang are different systems) | P2 | – | – | DEPRIORITISED |
| 12406_RG_TS3 RHB (yellow) | P3 | – | – | – |

## Decisions from Azfar, 28.10.2026

- 12406 runs on Secarang staging /ia/ (on the simulator; a real-Allianz-API SIT pass may follow); CIBO at /cibo.
- eAuto and Secarang are different systems: 12406_RG_TS4 (eAuto insurer order) deprioritised.
- No EV for Allianz (out of scope).
- On the simulator any IC will do; with Allianz's real API the data must be real (Allianz checks the IC for a quotation).
- Pre-deploy TS may be run now (done 28.10, `05-evidence/pre-push/`).
- A real company number for QT_TS3 will come from Azfar.
- Faizuddin's Secarang automation: github.com/faizuddin-03/personal-dashboard (branch staging-local) `scripts/secarang-insurance/`; reference copy in `00-input/ref-faizuddin-secarang-insurance/`.

- 29.10: Dev pushed 12406 to /ia/; Dev fixed an eSim config error the same day.
- 29.10: BEFORE evidence from the 28.10 capture is accepted (copied into each TS folder, labelled 'FROM THE BEFORE CAPTURE'); CP_TS8 E2 recorded as 'not captured before the deploy'.
- 29.10: one video per TS, including the Fiuu payment window (merged into the main video), not a second video.
- 29.10: Azfar will check anything manual on request (e.g. the receipt email for RC_TS7).
- 29.10: QT_TS2 / QT_TS4 / QT_TS5 / QT_TS6 need Dev's simulator set-up (one insurer unavailable / non-renewal). Run them LAST: tell Azfar just before, he asks Dev to set it (Azfar: "only when you want to run it let me know").
- 29.10 (Azfar, on the proposed changes): A1, A2, A3, A6 withdrawn: expected results stay per the SRD / mockup; a mismatch goes to triage / BA, not into the TS.
- 29.10 (Azfar) **rule B**: a point on a page or behaviour 12406 does not change passes when it is the same after the deploy as before, with a source that says it stays unchanged (SRD §2.2.3 Affected Pages, REQ-010 Ex.2 / REQ-011, SA brief 'no code change'); a change is a defect. Applied to RC_TS4 E1/E3/E5, RC_TS10 E2/E3/E5, RC_TS5 E2/E3, RC_TS6 E2.
- 29.10 (Azfar) "for secarang memang cannot do anything as pending or resubmit": a pending payment cannot be continued and nothing is resubmitted. E2E_TS5 checks the Failed status in CIBO after the final payment (no reopening); **Q18 answered** (no cover-note resubmission); E2E_TS6 stays ON HOLD.
- 29.10 flow runs (`automation/src/flows/README.md`), recorded for cr-author, no specs written by cr-draft: after Dev's eSim fix **all three insurers quote any made-up car**, in the order Lonpac RM819.07, Allianz RM862.16, Tokio Marine RM1,355.08; the 'one insurer missing' cases still need Dev's simulator levers (Q12). Confirmation shows Plan Details (4 Allianz PDFs), the Excess pop-up, the agent line "Exclusively by agent Serba Sentral Sdn Bhd PIAM ID: 195379-01" and a PIAM 'i' popover naming Serba Sentral; Add-ons lists 13 (Road Rangers FREE); the Success page offers Receipt / Print / Back to home. **This unblocks E2E_TS9, E2E_TS10, QT_TS7 and RC_TS1 E9 for cr-author.**
- 29.10 evening: Azfar granted full permission ("you have all my permission to do anything no need to req anything from me all granted"). Open calls decided 29.10 under Azfar's full permission, main session:
  - E2E_TS5 E2: CIBO keeps ONE Transaction Management row for failed + cancelled + paid (BR60006353, Insurance created); the failed FPX attempt is checked in Payment Management (Payment Status 'Failed').
  - E2E_TS9: e-Invoice / TIN dropped (no TIN field for a private owner; company cars get no quotation today), in `excluded`.
  - RC_TS1 E9: the Success page [Print] view is not a receipt under SRD §2.2.3 #6 / REQ-010: recorded only (N1 to the BA). New E10: 'Premium After NCD' on the receipt = Basic Premium − NCD + add-ons, = Confirmation's (seen 29.10: RM 882.16 against 862.16 on every Allianz receipt).
  - RC_TS10 E5: Print the filtered listing (Allianz, today's dates). **Observation for Dev (not 12406):** printing the whole unfiltered listing after Clear all got HTTP 404 after 124 s.
  - RC_TS6: the Commission Report lists only transactions with a discount code (28.10: 186 old Allianz rows in Payment Report, 56 in Commission Report): the E2E_TS2 purchase (RJC7) is listed, the others are not; commission % recorded (Q16).
  - E2E_TS12 and RC_TS11 approved (no longer orange); the other 8 orange rows stay ON HOLD with their reasons.
  - New questions: **Q44 (Dev)** Allianz cover note / policy / e-Certificate on /ia/ (none on any paid Allianz purchase of 29.10, e.g. BR60006349; Tokio Marine got one in 15 s, BR60006354; known EAINT-6345); **Q45 (BA)** no payment badge on an unpaid Allianz transaction vs the mockup's 'Unpaid'; **N1 (BA)** the [Print] view.
- 29.10 evening, v6b (decided by the main session under Azfar's full permission): E2E_TS5 E2 recorded (Payment Management and Transaction Management keep one row per transaction with its final status; a 'Failed' row only when the last payment failed, BR60006327); E2E_TS9 E2 recorded (one sum insured value, RM20,200, for the made-up cars); E2E_TS12 step 2 types the windscreen Sum Insured below / above / inside RM500–RM1,820 and applies the inside value; `approved_by` notes E2E_TS12 and RC_TS11 approved, the other 8 orange rows ON HOLD.
- 30.10, v6c (decided by the main session under Azfar's full permission): E2E_TS9 E4 (gender re-prices) is recorded on the simulator: /ia/ does not price by gender for any insurer (probe 30.10, run EAINT-12406-probe-gender-20261030-0914: Lonpac RM884.48, Tokio Marine RM1,171.22 unchanged; Allianz RM941.13 / RM944.37 unchanged on 29.10); judged only on a real-API (SIT) pass, so **E2E_TS9 is a candidate SIT row (Q3)**. E2E_TS12 pays by Credit or Debit Card: the Fiuu sandbox refuses FPX above MYR 2,000 (P15) and the all-add-ons total is RM2,510.87. **Observation for Dev (not a 12406 point):** on that FPX refusal Secarang showed a blank window with no message.
- 30.10, v6d (main session, Azfar's full permission): E2E_TS12 pays by **PayLater by Grab** (GrabPay simulator): the Fiuu sandbox refuses both FPX and card above MYR 2,000 (P15; runs 1950-B-c2 FPX, 0920-D-c1 card) and the all-add-ons total is RM2,510.87; e-wallet rails have no amount limit (team doc §5; SRD EAINT-12107 REQ-004). **Observations for Dev (not 12406 points):** the FPX refusal (blank Secarang window, no message) and the card refusal, both P15 above MYR 2,000.
- 30.10, v6e (main session, Azfar's full permission): RC_TS10 step 4 uses the Discount Code filter 'Included' (CIBO offers only Included / Exempted, not the code itself: run 0040-C); step 5 prints over the date range of the E2E_TS1–TS4 purchases, and E5 now says the same (was "today's dates"; RC_TS10 is re-run anyway).
## Open questions blocking automation

| # | Question | Who can answer | Blocks |
|---|---|---|---|
| S1 | ~~Which Secarang staging path and CIBO instance; logins~~ **ANSWERED 28.10 (Azfar): /ia/, CIBO testadmin** | – | – |
| S2 | (29.10: all three insurers quote any made-up car on the simulator after Dev's eSim fix.) /ia/motorcycle-insurance does not exist. /ia/ is on the **simulator** now (any data) (Azfar 28.10); testing may need **both** simulator and Allianz's real UAT API (real vehicle/owner data, SIT label on the board, none set yet). Ask Dev: is the Allianz UAT API still connected after May 2025, and when can /ia/ be switched for the SIT pass and back? Azfar: which rows get the SIT pass (Q3) | Dev (Mong Guo Hao), Azfar | Allianz SIT rows, real test data (Q12) |
| S3 | Is Allianz also in the MacroKiosk renewal flow? SRD v1.1 silent (Q7) | BA Lim Yi Link | +4–6 TS |
| S4 | ~~Paid production purchase?~~ **Partly answered by the team doc §2** (Deployment Checklist 20261020 AM R43): QA cannot pay on production; production is quote-to-payment-page (CP_TS7, E2E_TS8, no longer orange). Still open for the BA whether SRD 2.1.3a 'full E2E' means more (Q6) | BA Lim Yi Link, Shamini | scope only |
| S5 | ~~Is 12406 already deployed to the Secarang / CIBO staging?~~ **ANSWERED 28.10.2026 (Azfar): not deployed yet.** The 6 yellow BEFORE captures can be done; do them before Dev deploys (draft Q11) | – | – |
| S6 | Test data on /ia/ per quotation case (Q12). Known (team doc §13): HXA0001A–HXA0020A / ZZZ1A + the team's IC + postcode 55000 quote Lonpac; QAT9100A gets 'no instant quotation'; Tokio Marine showed 'Quotation unavailable' for a private car on 20.10; Allianz on these plates unconfirmed. Needed: a plate all three quote, one per 'insurer missing' case, a real company SSM, a non-renewal | Dev, BA | QT_TS1–TS6, E2E_TS10 |
| S7 | Which insurers are switched on for quoting on /ia/ (SA brief: only 3 quotations shown, others drop silently) (draft Q31) | Dev Mong Guo Hao | QT_TS1–TS6 |
| S8 | **Conflict** SRD REQ-003 Ex.1 (company vehicle → Allianz unavailable card) vs team doc §3 ('there are no insurance in secarang that supports company', QA team 20.10) (draft Q40) | BA Lim Yi Link | QT_TS3 |
| S9 | ~~CIBO Insurance Company filter: insurer or agency?~~ **ANSWERED by the walk 28.10**: insurers grouped under agency headers (Serba Sentral: Allianz, eTiqa); no agency filter; Payment Management has no insurer filter (Q41) | – | – |
| S10 | REQ-011 says Allianz's number goes 'below the insurer name, same as Tokio Marine', but Tokio Marine shows it on the same line today (walk 28.10, BR69005852): which layout for Allianz? (draft Q42; Q29 answered) | BA Lim Yi Link | RC_TS3, E2E_TS8 |
| S11 | **Secarang site password** for /ia/ (every /ia/ page is behind it, walk 28.10). Needed before the deploy for CP_TS8 / QT_TS3 BEFORE, then for every Secarang row | QA team (Charmain / Faizuddin) | CP_TS8, QT_TS3, all Secarang rows |
| – | Draft Q13, Q15–Q30, Q32–Q39: card position, documents, commission / Payment Report amount, failed payment, cover note failed, motorcycle, old / stuck / eAuto Allianz tx, customer messages, Terms of Use, shared order (12150), ShopeePay (Azfar), options (discount / road tax), mockup marks, list style, Support load state, Tokio Marine today, Ref ID code, add-ons, phone browser (Azfar), eAuto receipt, Allianz error, refer-risk, Confirmation agent line, old logo, quotation expiry. Full list: `01-intake/scenarios.yaml` meta.open_questions / Open Questions sheet | BA Lim Yi Link / Dev / Azfar | see the Open Questions sheet |

Answered 28.10 (see the Open Questions sheet): by the team doc Q17 failed / cancelled payment (12107 REQ-007/008), Q24 ShopeePay / PayLater by Grab work on /ia/, partly Q6, Q21; by the before-deploy walk Q29 (Tokio Marine number inline today), Q41 (filter groups), partly Q20 (no Allianz on platform eAuto).

Unread inputs (not blockers): Teams briefing with Dev 22.10.2026 (recap + transcript in the chat); ESI-361 not visible to us; CCB-992 has no description; EAINT-8799 has only a version table.

## Defects raised from this CR

| Ticket | Case | What |
|---|---|---|
