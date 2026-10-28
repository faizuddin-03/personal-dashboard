# EAINT-12528 — related history (2026-10-27)

## Ticket brief

1. **High-level scope:**
   1. **Cron job posts** a Secarang caption + video on **Facebook, Instagram and TikTok**.
   2. **Right video and caption** on each platform; video plays, caption not cut off.
   3. **Interval:** next post only on the next run ("every 2 - 3 days" in production; staging set to every 30 mins).
   4. **No repeat:** a second run does not post the same video again; one post per platform per run.
   5. **All three platforms** post in the same run; one platform failing does not stop the other two [unconfirmed].
   6. **Nothing posted before go-live.**
2. **Estimated testing time:** **2.0 man-days** (range 1.5-2.5), confidence **low** [unconfirmed]. Official figures: Jira "[QA] Est Man-day (cf 10081):** —" (blank); no Miro board.
3. **Modules / pages to cover:**
   1. **Secarang Social Media (Social Media):** Secarang Facebook page, Secarang Instagram account, Secarang TikTok account — changed by the ticket (Jira Description rows 1-2).
   2. **Posting cron job (back-end, no UI):** run schedule / interval set by the developer — changed by the ticket (Description row 5).

## Header

1. **Module / portal:** **Secarang Social Media** — "Affected Portal | Social Media", "Affected Module | - Facebook - Instagram - TikTok" (`EAINT-12528-jira.md`, Description rows 1-2). Change = **a cron job that auto-posts caption + video** "every 2 - 3 days" (Description row 5).
2. **No past ticket touches Secarang social media.** Grep for "tiktok|facebook|instagram|social media" over `_reference/sharepoint/` and `knowledge/`: **0 hits**.
3. **Past tickets kept:** **3**, all by **pattern** (scheduled cron that sends content), not by page:
   1. **EAINT-11864 — quotation reminder email cron** (hourly).
   2. **EAINT-11867 — WhatsApp insurance video cron** (sends a video).
   3. **EAINT-8668 — APT resubmit cron** (staging vs production schedule).
4. **Own official TS:** **none** in the QA Team folder.
5. **SRD:** **none.** "no SRD in chat" [answered by Faizuddin on 2026-10-27, Teams chat question].
6. **Sibling tickets, not related history** (Scout reply 2026-10-27, Jira re-captured):
   1. **EAINT-12429 — lead capture from social media posts**, on hold. Row 6: "On hold - to discuss further with Shamini. Shamini will propose to Morvin first before proceeding with this CR." (`_reference/tickets/Studying/EAINT-12429/EAINT-12429-jira.md`). No TS.
   2. **EAINT-12526 — WhatsApp / Macrokiosk visuals.** Row 3: "Create visual (image and video) for Secarang Macrokiosk flow" (`_reference/tickets/Studying/EAINT-12526/EAINT-12526-jira.md`). No TS.
7. **Dropped from Node's ranking (name-only matches):**
   1. **EAINT-9024 (Lonpac Q4 control sequence), EAINT-9062 (Lonpac 14-day grace), EAINT-8786 (Takaful PDS), EAINT-8331/8334/7199 (remove discount line), EAINT-12107 (ShopeePay / GrabPay)** — Secarang insurance website / payment changes; no cron, no posting.
   2. **EAINT-8536 — WhatsApp alert on failed cover note** — event-driven, not scheduled.

## Related past tickets

1. **EAINT-11864** — "⚪[eAuto-Insurance] Send Email Reminder to UCD for Generated Quotations Without Purchase".
   1. Workbook: `_reference/sharepoint/qa-team-ts/EAINT-11864 - [eAuto-Insurance] Send Email Reminder to UCD for Generated Quotations Without Purchase.md`.
   2. Study: `_reference/tickets/EAINT-11864/EAINT-11864-qa-team-ts-study.md`.
   3. **Why related:** scheduled cron that sends content; TS cover **run timing, run window, no repeat on second run, go-live cutoff**. Tested by Faizuddin, "17 Pass, 0 Fail" (study §1.6).
2. **EAINT-11867** — "⚪[eAuto-Insurance] To send WhatsApp Insurance video based on referred risk from June 2026".
   1. Workbooks: `_reference/sharepoint/qa-team-ts/EAINT-11867 ⚪[eAuto-Insurance] To send WhatsApp Insurance video based on referred risk from June 2026.md` and `_reference/sharepoint/qa-team-ts/EAINT-11867_WhatsApp_Video_Test_Cases_Full (version 1).md`.
   2. Study: `_reference/tickets/EAINT-11867/EAINT-11867-qa-team-ts-study.md`.
   3. **Why related:** cron sends a **video** (Car.mp4 / Motor.mp4); **one message only**; no repeat on next run.
3. **EAINT-8668** — "🔴 [eAuto - BackOffice] To have a new cronjob to resubmit Failed APT transactions".
   1. Workbook: `_reference/sharepoint/qa-team-ts/EAINT-8668 - [eAuto - BackOffice] To have a new cronjob to resubmit Failed APT transactions.md`.
   2. Study: `_reference/tickets/EAINT-8668/EAINT-8668-qa-team-ts-study.md`.
   3. **Why related:** records a **different cron schedule on staging vs production** and how to test a **multi-day interval** — matches the "every 2 - 3 days" rule.

## What was tested before

1. **EAINT-11864** (sheet "11864"):
   1. **11864_TS01 — next-hour pickup** (R2): "Wait for cronjob run ⏎ Transaction Time = 1 Minute before the hour"; expected "Ensure the email is sent on the next hour".
   2. **11864_TS03 — two cron runs, one email** (R4): "Wait for cronjob run 2 times"; expected "After second cronjob runs, no email should be sent again".
   3. **11864_TS07 — outside cron hours** (R8): "Trigger email over midnight"; expected "Email will not be sent outside of the cronjob running hours (7:00AM - 11:00PM)".
   4. **11864_TS13 — pre-go-live data ignored** (R14): "Quotation created before go live"; expected "No email is sent for the quotations that are generated before the go live time".
   5. **11864_RG_TS01-04 — insurance purchase regression** (sheet "Regression", R2-R5): "Regression on Insurance Purchase Flow".
2. **EAINT-11867** (sheet "Test Scenario v1"):
   1. **11867_TS01 — Car video sent** (R3): expected "Whatsapp message contains Car Insurance Video".
   2. **11867_TS01 second run** (R4): "Ask dev to Trigger 2nd CRONJOB (For ensuring whatsapp message is not sent again after cronjob runs the 2nd time and onwards)".
   3. **11867_TS04 — Motor video sent** (R7): expected "Whatsapp message contains Motor Insurance Video".
   4. **11867_TS13 — one message only** (R12): "Verify only ONE WA Message is sent when ⏎ Hit Refer Risk while MORE THAN ONE insurer ... returns a quotation".
   5. **Sheet1 11867_TS08 / TS09 — video file per type** (R9-R10): "The UCD receives the Car Insurance Video ⏎ (Car.mp4) via WhatsApp." / "(Motor.mp4)".
3. **EAINT-8668** (sheet "Scenario Test"):
   1. **Schedule block** (R4-R5): "Prod: 8.00 PM everyday (only once per day)" / "Staging: Every 10 minutes".
   2. **8668_APT_TS2 — two-day case** (R13): "Note: This TS require at least 2 days for natural case ⏎ On staging, subsequent cronjob can be considered as next day's running".
   3. **8668_APT_TS3-TS18 — not-picked-up cases** (R15-R31): "Ensure once hit scheduled time, cronjob DO NOT resubmit".
   4. **8668_APT_TS19 — regression happy flow** (R32): "Regression Happy Flow".

## Reusable scenarios

1. **Second run, no repeat** — adapt **11864_TS03 (two cron runs, one email)** and **11867_TS01 second run**: run the cron twice; the second run must not re-post the same video [unconfirmed until a rotation rule is written].
2. **Run timing** — adapt **11864_TS01 / TS02 (next-hour pickup)**: post appears at the scheduled run, not before.
3. **Run window** — adapt **11864_TS07 (outside cron hours)**, only if posting hours are defined [unconfirmed].
4. **Go-live cutoff** — adapt **11864_TS13 (pre-go-live data ignored)**: nothing posted before go-live.
5. **Interval on staging** — copy the **8668 schedule block** (R3-R5): write the production schedule and the staging schedule at the top of the TS. Reuse **8668_APT_TS2 (two-day case)**: treat the **next 30-min run** as the next "2 - 3 day" post, as in 8668 R13 "subsequent cronjob can be considered as next day's running".
6. **Video content per platform** — adapt **11867 Sheet1 TS08 / TS09 (video file per type)**: right video + caption on Facebook, Instagram, TikTok.
7. **Exactly one post per run** — adapt **11867_TS13 (one message only)**: one post per platform per run.
8. **All targets in one run** — from 8668 sub-task bug "EAINT-8732 … Cronjob resubmit only 1 transaction when vehicle set to fail again due to RHB error" (8668 study §4.14): check **all three platforms** post in the same run, not only the first [unconfirmed].

## Known traps

1. **Cron cannot be triggered on demand.** "like i said before, cronjob cannot run on demand, but can set the interval. for testing, we usually set to every 30 mins with it starting on the hour" [answered by Faizuddin on 2026-10-27, global]. For 12528: "cronjob unable to trigger on demand, but can change the interval. for testing, we usually do every 30 mins" [answered by Faizuddin on 2026-10-27]. Past TS 11867 used "Ask dev to Trigger 1st CRONJOB." (v1 R3-R25); do not copy that step.
2. **Staging schedule differs from production.** "Prod: 8.00 PM everyday (only once per day)" / "Staging: Every 10 minutes" (8668 Scenario Test R4-R5). 12528 configured interval: "cron internal unknown. ignore first, will get to this later" [answered by Faizuddin on 2026-10-27] — **parked**.
3. **Multi-day interval cannot be waited out.** "This TS require at least 2 days for natural case ⏎ On staging, subsequent cronjob can be considered as next day's running" (8668 R13).
4. **Test accounts unknown.** "ignore first. i will come back to this later" [answered by Faizuddin on 2026-10-27] — **parked**. Posting to real public pages from staging stays a risk [unconfirmed].
5. **Proof may come from dev logs only.** 11867 expected results cite "(Request log from dev)" (v1 R3, R5, R12).
6. **Old data picked up by a new cron.** "May transactions (before 1 June) still send WhatsApp videos (should not) if dev side runs the June cronjob which picks up transactions in May." (11867 v1 R17 Remarks).
7. **Links from staging point to production.** "Link redirects to prod environment - Existing behaviour" (11864 R10, R13 Remarks). Check any link in the caption [unconfirmed].
8. **Messaging provider limit.** "Estimated messagebird no > 2" (11867 v2 R22-R24); meaning unclear (11867 study §4.12).
9. **Deployment step.** "Dev will need to add new column during deployment" (11864 R27 Notes). Check whether 12528 needs a config / DB step [unconfirmed].

## Past QA-Issues mentioned

1. **EAINT-12199** — "[eAuto - Insurance] Mailtrap not receiving email after cronjob runs" (`EAINT-11864-jira.md` line 13, Sub-tasks).
2. **EAINT-12213** — "[eAuto - Insurance] Email is generated for insurance that does not have eSTM" (`EAINT-11864-jira.md` line 13, Sub-tasks).
3. **EAINT-8704** — "Old transactions unable to generate e-Invoice" (8668 study §4.14, Jira Sub-tasks).
4. **EAINT-8708** — "e-Invoice submission hit "Submission failed due to unexpected error"" (8668 study §4.14).
5. **EAINT-8732** — "Cronjob resubmit only 1 transaction when vehicle set to fail again due to RHB error" (8668 study §4.14). Most relevant: a cron handled only one item per run.
6. **EAINT-11867:** no QA-Issue keys in the sheets.

## Estimated testing effort (Faizuddin, 2026-10-27)

1. **Comparable tickets:**

| Ticket | TS count (text copy) | [QA] Est Man-day (cf 10081) | Source |
|---|---|---|---|
| EAINT-11864 — quotation reminder cron | 13 TS + 4 regression = **17** | **2.5** | `_reference/tickets/Studying/EAINT-11864/EAINT-11864-jira.md` line 11, "[QA] Est Man-day (cf 10081):** 2.5" |
| EAINT-11867 — WhatsApp video cron | Sheet1 **12**; v1 / v2 **15** each | **—** (blank) | `_reference/tickets/Studying/EAINT-11867/EAINT-11867-jira.md` line 11 |
| EAINT-8668 — APT resubmit cron | **19** (TS1-TS19, 21 rows) | **—** (blank) | `_reference/tickets/Studying/EAINT-8668/EAINT-8668-jira.md` line 11 |

   1. EAINT-12528 own field: "[QA] Est Man-day (cf 10081):** —" (`EAINT-12528-jira.md` line 11).
   2. Scout study quotes **no** manday figure (no Miro, no SRD).
2. **Expected TS count for EAINT-12528:** **8-12** [unconfirmed]. Why: 3 platforms × (post with right video + caption) plus interval, second-run no-repeat, all-platforms-in-one-run, one platform failing, go-live. Smaller than 11867 / 8668: **no eligibility matrix** (no insurer, UCD type or status combinations).
3. **Estimate in man-days:** **2.0** (range 1.5-2.5) [unconfirmed].
   1. **TS drafting:** 0.5.
   2. **Test execution:** 1.0 — no on-demand trigger; each run = wait up to **30 mins** for the next cron, then check three external platforms.
   3. **Retest / QA-Issue buffer:** 0.5.
   4. **Automation build:** 0 — posts land on external Facebook / Instagram / TikTok accounts and the cron cannot be triggered [unconfirmed].
4. **Confidence:** **low**.
   1. Raises it: an SRD with rotation, schedule and failure rules; named test social accounts.
   2. Raises effort: real public accounts only (needs care and cleanup); a BO / CIBO post log to verify too.
   3. Official figure lives in the QA Portal; not opened.

## Sources read

1. `_reference/tickets/Studying/EAINT-12528/EAINT-12528-study.md` (Scout study).
2. `_reference/tickets/Studying/EAINT-12528/EAINT-12528-jira.md`.
3. `_reference/inbox/eauto-flows-run/08-jira-3months.md` lines 60-89 (sibling tickets).
4. `_reference/sharepoint/qa-team-ts/EAINT-11864 - [eAuto-Insurance] Send Email Reminder to UCD for Generated Quotations Without Purchase.md`.
5. `_reference/sharepoint/qa-team-ts/EAINT-11867 ⚪[eAuto-Insurance] To send WhatsApp Insurance video based on referred risk from June 2026.md`.
6. `_reference/sharepoint/qa-team-ts/EAINT-11867_WhatsApp_Video_Test_Cases_Full (version 1).md`.
7. `_reference/sharepoint/qa-team-ts/EAINT-8668 - [eAuto - BackOffice] To have a new cronjob to resubmit Failed APT transactions.md`.
8. TS studies: `_reference/tickets/EAINT-11864/EAINT-11864-qa-team-ts-study.md`, `_reference/tickets/EAINT-11867/EAINT-11867-qa-team-ts-study.md`, `_reference/tickets/EAINT-8668/EAINT-8668-qa-team-ts-study.md`.
9. Jira captures (2026-10-27): EAINT-11864, EAINT-11867, EAINT-8668, EAINT-12429, EAINT-12526.
10. `data/pipeline/answers.json` — Faizuddin's answers on cron trigger (global + 12528), interval, test accounts, Teams chat.
11. `knowledge/cr-test-scenario-catalogue.md` (grep secarang|macrokiosk|cron|video).
12. Greps over `_reference/sharepoint/` and `knowledge/` for tiktok|facebook|instagram|social media (0 hits).

## Knowledge candidates

1. **New area "Secarang Social Media":** cron auto-posts caption + video to Facebook, Instagram, TikTok; "Posting runs every 2 - 3 days." (EAINT-12528 Jira Description row 5). No SRD ("no SRD in chat", Faizuddin 2026-10-27).
2. **Cron testing pattern across eAuto:** past TS used dev-triggered runs (11867 v1 "Ask dev to Trigger 1st CRONJOB.") and a short staging interval (8668 R5 "Staging: Every 10 minutes"); current practice per Faizuddin is interval-only, every 30 mins from the hour.
