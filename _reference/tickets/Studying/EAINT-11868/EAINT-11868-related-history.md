# EAINT-11868 — related history (2026-10-27)

## Ticket brief

Same content as `data/pipeline/work/EAINT-11868/brief.json` (2026-10-27).

1. **High-level scope:**
   1. **5 reminder emails** to the potential UCD: 3 days after approval, 2 months and 1 month before expiry, payment (1 day after Softcopy "Checked"), hardcopy (3 days after payment).
   2. **Send rules:** each email sent once on its date; cycle restarts after extend or reactivation; Email 2/3 skipped by "Hardcopy & Acc Created" state.
   3. **Expired email** now carries a **Reactivate Application** button.
   4. **Reactivation:** 1st click pays RM108, 2nd click opens the form; new PA record; status back to Approved; expiry = payment date + 90 days.
   5. **Failed reactivation payment:** no PA in the PA listing; link stays on the latest expired PA.
   6. **SSM data refresh** before Step 4 after reactivation (directors, IC files, e-Invoice PIC).
   7. **Regression:** EAINT-11982 Extend (incl. extend → expire → reactivate loop), daily expiry job, Pre-Application payment channels.
2. **Estimated testing time:** **7 man-days** (range **6.5–7.5**), confidence **medium** [unconfirmed]. Official: Jira "[QA] Est Man-day (cf 10081): 6"; Miro "Est. Testing Mandays:  6 days (1 QA)". Automation build +2 optional, not in the figure.
3. **Modules / pages to cover:**
   1. **UCD Application Form (Potential UCD):** Application Link Expired page, Reactivation Confirmation Page, Pre-Application payment page (Business Info Review), Application Steps 1–4 — changed: reactivation flow, payment, SSM refresh.
   2. **Email notifications (Mailtrap):** 5 reminder emails, Application Link Expired email — changed: new emails and Reactivate button.
   3. **Onboarding listings (BO):** UCD Pre-Application Listing, UCD Application Listing — changed: new PA per reactivation, status, Application Expiry Date.
   4. **UCD Application Details (BO):** Registration Documents tab (Extend button), right sidebar, Payment Details — regression for 11982 Extend and the new PA payment.
   5. **Daily expiry cron job (back end):** status flip to Expired — regression; reminder timing uses the same cron.

## Header

1. **Module / portal:** "Portal | Potential UCD"; "Module | UCD Application Form" (SRD v1.4 §2.2.1, via `EAINT-11868-study.md` "What changes" item 1). BackOffice touched for Extend (regression), PA / Application listing and SSM refresh.
2. **Past tickets kept:** **7** (EAINT-11982, EAINT-11829, EAINT-11536, EAINT-12153, EAINT-12257, EAINT-12341, EAINT-11763).
3. **Own official TS:** **none.** No EAINT-11868 workbook in the QA Team folder (task brief); Jira QA = Senior QA, still "To continue draft test scenarios" (study "QA scope" item 3).
4. **No SharePoint workbook for EAINT-11982** — `fetch.mjs ts 11982` and `ts Extension` both returned "No workbook matches". Its only scenario record is another QA's repo ledger (read-only clone `_reference/codebases/eauto-qa-charmain/`).
5. **Dropped (name-only match):**
   1. **EAINT-11978** — showroom address edit; does not touch expiry, email or reactivation.
   2. **EAINT-11979** — Verify button in account creation; BO step after the flow 11868 changes.
   3. **EAINT-12219** — RHB Offer Letter sample in the approval email. Its TS study (2026-10-27) notes the email may be gone since 12341: "If that is the same email this TS checks, the EAINT-12219 Offer Letter sample may no longer reach the UCD after 2026-10-07" (`_reference/tickets/EAINT-12219/EAINT-12219-qa-team-ts-study.md` §4 item 6). Not a reminder.
   4. **EAINT-9306** — eDereg Pre-Check; matched on the word "flow" only.
6. **Linked, no TS found:** EAINT-12346 (patch Registered expired) — no workbook in the mirror. EAINT-12226 / 12235 / 12245 are QA-Issues under 11982 (see Past QA-Issues).
7. **Deploy:** "not deployed yet" [answered by Faizuddin on 2026-10-27].

## Related past tickets

1. **EAINT-11982** — "🔴[eAuto-Application] To Allow BackOffice user to Extend Expiration of Application" (Done, S33.1-20260902).
   1. **Workbook:** none in SharePoint mirror. Scenario ledgers: `_reference/codebases/eauto-qa-charmain/test-scenarios/bo-application-extend/bo-application-extend.md` and `.../bo-application-extend-button/bo-application-extend-button.md`.
   2. **Why:** the **Extend** part was cut out of the 11868 SRD (§2.2.5) and shipped first. 11868 must regress it and test the **extend → expire → reactivate** loop (Miro TS05).
2. **EAINT-11829** — "[eAuto-Application] Cronjob Updated Application Status from Approved to Expired when UCD Creation Completed when Hardcopy & Acc Created = Registered" (Bug, Done, S30.9-20260630).
   1. **Workbook:** scenarios live in sheet **EAINT-11829** of `_reference/sharepoint/qa-team-ts/EAINT-11536-🔴[eAuto-Pre-Application and Application] To Add Two Columns for Pre-Application Listing and Application Listing.md`. Own file `EAINT-11829 - ... Registered.md` is header only (catalogue row 018: "Header only; scenarios live in 014 sheet EAINT-11829").
   2. **Why:** the **daily expiry job** and the **expired email** — the exact trigger 11868 extends (expired email gets a Reactivate button; Email 2/3 suppressed for Registered).
3. **EAINT-11536** — "🔴[eAuto-Pre-Application and Application] To Add Two Columns for Pre-Application Listing and Application Listing" (Done, S30.9-20260630).
   1. **Workbook:** same file as item 2, sheet **EAINT-11536**.
   2. **Why:** **PA listing** and **Application listing** columns incl. "Application Expiry Date" — 11868 creates a new PA per reactivation and updates the expiry date on the listing.
4. **EAINT-12153** — "🔴[eAuto-Application] Add B2B Payment Channel for Pre-application and Application" (Testing In 1st Env, S34.1X-20261029).
   1. **Workbook:** `_reference/sharepoint/qa-team-ts/EAINT-12153 - 🔴[eAuto-Application] Add Payment Channels for Pre-application and Application.md`. TS study: `_reference/tickets/EAINT-12153/EAINT-12153-qa-team-ts-study.md`.
   2. **Why:** reactivation pays the **RM108 Pre-Application fee** through this payment step (study "Dependencies" item 3).
5. **EAINT-12257** — "🔴[eAuto-Application] Add DuitNow QR Payment Channel for Pre-application and Application" (Testing In 1st Env, S34.1X-20261029).
   1. **Workbook:** `_reference/sharepoint/qa-team-ts/EAINT-12257 -🔴[eAuto-Application] Add DuitNow QR Payment Channel for Pre-application and Application.md`. TS study: `_reference/tickets/EAINT-12257/EAINT-12257-qa-team-ts-study.md`.
   2. **Why:** same **Pre-Application payment** step; failed / cancelled payment behaviour feeds Miro "TS06: Payment = Failed".
6. **EAINT-12341** — "🔴[eAuto-BackEnd & UCD] Replace Approved Application Email with New Emails to UCD and RHB Support" (Done, S34.5-20261007).
   1. **Workbook:** `_reference/sharepoint/qa-team-ts/EAINT-12341 - [eAuto-BackEnd & UCD] Replace Approved Application Email with New Emails to UCD and RHB Support.md`.
   2. **Why:** last **Application email** CR to the potential UCD — same recipient, same CC "apply@eauto.my", same subject pattern "[Application No] - [Company Name]". Model for checking the 5 reminder emails.
7. **EAINT-11763** — "⚫🔴[eAuto-Application] Enhancement on Application and Registration Document" (Done, S31.2-20260708).
   1. **Workbook:** `_reference/sharepoint/qa-team-ts/EAINT-5972, EAINT-10164 & EAINT-11763 - Pre-Application & Application Enhancements.md`, sheet **EAINT-11763**.
   2. **Why:** **directors filled from the SSM document** on Application Step 2 — 11868 refreshes SSM data before Step 4 after reactivation (SRD §2.2.6 item 8).

## What was tested before

1. **EAINT-11982 (another QA's ledger, not a SharePoint workbook):**
   1. Source pack: "79 rows, 68 scenarios, TS1 to TS58 and E2E TS1 to TS10" (`bo-application-extend.md` line 26).
   2. Entry 1 — "extended before its expiry, an application's new expiry is the original expiry plus 30 days, and it stays Approved" (`bo-application-extend.md` line 61).
   3. Entry 2 — "extended after its expiry, an application's new expiry is the click date plus 30 days, and it goes from Expired back to Approved" (line 62).
   4. Entry 13 — "no email reaches the dealer or the BackOffice user when an application is extended, before or after its expiry" (line 84).
   5. Entry 9 — "the extended date is the one that counts: the application stays usable past its original expiry and expires on the new date" (line 76).
   6. Button entry 7 — "after an application has been extended once, the Extend button is no longer displayed, at any date and in any status" (`bo-application-extend-button.md` line 74).
   7. Button entry 8 — "an application revived by reactivation, extended before or not, shows no Extend button inside its new window and cannot be extended" (line 75) — **BLOCKED(Q2)**, never run.
2. **EAINT-11829 (sheet EAINT-11829):**
   1. Section A, R2 — "Section A — Application Status: Will Be Expired by Cronjob After 90 Days".
   2. 11829_TS01–TS08 (R3–R10) — statuses New, Draft, Pending, Re-evaluate, Approved (with Hardcopy "-", "Pending UCD", "Pending UCD - Incomplete Docs", "Pending Assignee") → "Application Status = Expired ⏎ - Expired email notification received ⏎ - OB link → Application Link Expired popup displayed → Redirect to Application Link Expired page".
   3. 11829_TS09 (R11) — already Expired → "Application Status remains Expired ⏎ - NO additional email notification sent".
   4. Section B, R12 — "Will NOT Be Expired by Cronjob (Exception Cases)": 11829_TS10 Rejected (R13), 11829_TS11 Approved + Registered (R14) → "Will NOT received OB form link expired email notification ⏎ - Application Link redirect to Application Payment Success page".
   5. Section C, R15 — "Existing Application": 11829_TS12–TS15 (R16–R19).
   6. R24 — "Natural Case - Need to wait until ((30/06/2026) 12 a.m.)": NAT11829_TS01–TS07 (R25–R31).
3. **EAINT-11536 (sheet EAINT-11536):**
   1. 115366_TS01–TS04 (R3–R18) — "UCD Pre-Application Listing" Approved Date / TAT columns, per status.
   2. 115366_TS05–TS08 (R19–R40) — "UCD Application Listing"; R20: "Column should be placed between Application Submission Date and Application Expiry Date".
   3. 115366_TS09–TS10 (R38–R49) — "Existing Transaction (created before deployment)".
4. **EAINT-12153 (Sheet1; 11 Pass, TS7 Not Started per its TS study §1 item 6):**
   1. 12153_TS1–TS8 (R4–R11) — FPX B2B / B2C / Card, Success / Failed / "Failed > Success" on **both** Pre-Application and Application payment.
   2. 12153_TS9 (R12) — "Check : BO Payment Details after redo payment".
   3. 12153_TS10 (R13) — "Check : Close the browser and reopen the link".
   4. 12153_TS11 (R14) — "Check : Pre-Application link opened in a second session".
   5. 12153_TS12 (R15) — "Check : BO listing payment status".
5. **EAINT-12257 (Sheet1; 10 Pass, 2 Fail, 1 Not Started per its TS study §1 item 7):**
   1. 12257_TS1 (R4) "Happy Flow - Approved Payment"; TS2 (R5) "Negative Flow - Reject Payment & Retry Payment"; TS3 (R6) "Cancel transaction"; TS4 (R7) "Close QR Code Window"; TS5 (R8) "Timer Expiry".
   2. R9 "REGRESSION": 12257_TS6–TS13 (R10–R17), incl. TS11 "Reject Payment & Retry Payment - BO Payment Details", TS13 "Timer Expiry - BO listing payment status".
6. **EAINT-12341 (Sheet1):**
   1. R5 Trigger — "Application approval only. Pre-Application approval is not a trigger and is unchanged by this CR."
   2. 12341_E2E1–E2E13 (R13–R28) — template selection per business type; expected (R13): "The RHB Account Registration Guideline email is received by the UCD email address captured in the Application. ⏎ • apply@eauto.my appears in the CC field. ⏎ • The subject line reads RHB Online Account Opening - [Application No] - [Company Name], with the actual values rendere[d]".
   3. 12341_E2E14–E2E18 (R30–R34) — "E — Appointment Letter Email".
   4. 12341_R1–R5 (R36–R40) — "F — Regression"; R36: "The existing approved application email carrying the 3 RHB documents ... is no longer sent."
7. **EAINT-11763 (sheet EAINT-11763):**
   1. 11763_DIRECTOR_ROC_TS1–TS10, 11763_DIRECTOR_ROB_TS1–TS10, 11763_DIRECTOR_LLP_TS1–TS10 — "Potential UCD submitted Pre-Application with ROC type and is approved ⏎ ⏎ 1) As potential UCD, fill in the Application and proceed until Step 2" → directors from "SSM Document".
   2. 11763_FS_UCD_TS1–TS8, 11763_FS_BO_TS1–… — file-size limits on Application uploads (not reused).

## Reusable scenarios

1. **11829_TS01–TS08** → **expired email + Reactivate button** per status. Keep "Ask dev to patch Submission Date to 90 days before today"; replace "Wait for / trigger cronjob run" with **wait for the next 30-min cron run** (trap 6); add the button check (SRD §2.2.6 item 7).
2. **11829_TS09** → **"Each reminder fires once"** (SRD §2.2.4.1 item 8): let the next cron run pass, assert no second email.
3. **11829_TS10, TS11, TS14** (Rejected / Registered not expired) → **Email 2/3 suppression** for "Hardcopy & Acc Created" states, and no Reactivate path for Registered.
4. **115366_TS05–TS08** → **Application listing "Application Expiry Date"** after reactivation = payment date + 90 days; **115366_TS01–TS04** → new PA record on the **PA listing**.
5. **12153_TS2 / TS6 / TS8** (Failed, Failed > Success) → Miro **"TS06: Payment = Failed"**: failed reactivation PA not on PA listing; link stays on latest expired PA (SRD §2.2.6 item 9).
6. **12153_TS12 / 12257_TS13** (BO listing before / after redo) → same check for the **reactivation PA**: not listed before payment, listed after.
7. **12153_TS10** ("Close the browser and reopen the link") and **12153_TS11** (second session) → reactivation link **1st click pays / 2nd click opens form** (SRD §2.2.6 item 1).
8. **12153_TS9**, **12257_TS11** → BO **Payment Details** on the **new PA record**.
9. **12341_E2E1** → template for each **reminder email** check: recipient, "apply@eauto.my" in CC, subject with real [Application No] / [Company Name]. Swap sender to "imonitor@eauto.my".
10. **12341_R1** (negative "no longer sent") → **reminder NOT sent** cases (Email 2/3 suppressed; no email on Extend).
11. **11982 ledger entries 2, 9, 13 and button entries 7, 8** → regression + **Miro TS05 loop** (extend once → expire → reactivate → expire → reactivate; Extend not offered after reactivation).
12. **11763_DIRECTOR_ROC/ROB/LLP_TS1–TS2** → **SSM refresh before Step 4** (director added / removed after reactivation).

## Known traps

1. **Time travel needs the developer.** "Ask dev to patch Submission Date to 90 days before today" (11829 sheet, R3–R19); "ask dev to patch the Submission Date" (11536 sheet, R15). Reminders at 3 days / 1 day / 1–2 months will need the same.
2. **Midnight job.** "Natural Case - Need to wait until ((30/06/2026) 12 a.m.)" (11829 sheet, R24). "Standing a record at a date needs the support tool "Reset Application Expiry Date"; the status only follows at the midnight job." (`knowledge/flow-application-reactivation.md` line 273, from the 11982 ledger).
3. **Records are spent.** "A qualifying application is built through the dealer's whole journey, with a hand-ticked reCAPTCHA and the bank simulator, and each extension spends it for good" (`bo-application-extend.md` line 423).
4. **Reactivation not on staging.** "Reactivation not deployed to the QA instance" (`bo-application-extend-button.md` line 342, no date). Teams CR group: the developer "development for EAINT-11868 has been completed, do let me know if can proceed to deploy to staging" (2026-08-12 15:15); the BA "this ticket will reschedule its deployment date ya." (2026-08-14 09:52); the developer "EAINT-11868 need deployment and morning deployment is fine" (2026-09-21 09:06) (`_reference/teams/EAINT-11868-11982-Application-Expiry-Extension-Reactivation.md` lines 18, 19, 39). **Confirmed:** "not deployed yet" [answered by Faizuddin on 2026-10-27].
5. **Expiry-date tool — Email 2/3 only (added 2026-10-27).** "`http://172.30.202.23:8888/eauto-support/obs/reset-expiry` takes an application trx no and an expiry date and sets it" (`_reference/automation code/Pre-Application & Application/eAuto-PreApplication-to-Registered-E2E-Flow-Pack/04-reference/automation-README-full.md` lines 1463–1464).
   1. Limits (same file, lines 1467–1469): "it needs the **VPN**, it is behind an **ADMIN-only portal sign-in** of its own, and it sets a **date** — the time of day comes from the record's existing expiry, which it preserves."
   2. Path found is **/obs** only; no /uat1 path in the repo (Scout reply 2026-10-27).
   3. [unconfirmed] Covers **Email 2 / Email 3**. **Email 1, 4, 5** count from approval, Softcopy "Checked" and payment dates — still need the **developer to patch dates** (trap 1).
6. **Cron cannot run on demand; interval is set.** "cronjob cannot run on demand, but can set the interval. for testing, we usually set to every 30 mins with it starting on the hour" [answered by Faizuddin on 2026-10-27]. Only cron on record: "The daily 12:00 AM cron job flips the status once that date has passed" (Teams CR group, 2026-08-26 15:58, the developer).
   1. Plan each time-based check around the **:00 / :30** runs; budget up to **30 min wait** per check after a date patch.
   2. [unconfirmed] The developer sets the interval on staging; request it before execution starts.
7. **Mailtrap catches mail.** "the environment sends into Mailtrap" (`automation-README-full.md` line 1474).
8. **Negative email checks.** "Negative assertion — passes silently if only the arriving emails are checked." (12341 Sheet1, R36 Remarks). Applies to Email 2/3 suppression and "no email on Extend".
9. **Registered never expires.** 11829_TS11 / TS14: "After 90 days Application Status will remain as Approved ⏎ ... Will NOT received OB form link expired email notification ⏎ - Application Link redirect to Application Payment Success page" (11829 sheet, R14, R18).
10. **Failed payment message.** "Unsuccessful Payment ⏎ Something went wrong and your payment didn’t go through. Please choose a payment method and retry." (12153 Sheet1, R5 12153_TS2).
11. **Cancel / close rule changed on 2026-10-27 (updated).** The 12257 sheet still says "No error message - follow existing behaviour (EAINT-12625, 26/10/2026)" (12257 Sheet1, R25–R26). Later the same day: "update rule for the qr close popup and cancel payment, both will show error message. so considered as pass" (`knowledge/flow-payment-channels.md` line 576, Faizuddin 2026-10-27). Use the **newer rule** for the RM108 reactivation payment.
12. **Unpaid PA not listed in BO.** "Before redo payment, the company is not displayed in Pre-Application listing" (12153 Sheet1, R15 E item 3, via `EAINT-12153-qa-team-ts-study.md` §4 item 6). Matches SRD §2.2.6 item 9 for a failed reactivation.
13. **Timer expiry leaves Registration Fee = Pending UCD.** "DuitNow QR timer expiry on the Application leg leaves BO Registration Fee = Pending UCD, not Failed (Faizuddin, confirmed with BA, 2026-10-27)" (`knowledge/flow-payment-channels.md` line 579). The 12257_TS13 sheet text (R17 H3, "Registration Fee = Failed") is out of date.
14. **e-Invoice cannot be downloaded on staging.** "the e-invoice memang kenot download. cus issue with TIN. so ignore that. consider it PASS" (`knowledge/flow-payment-channels.md` line 520, Faizuddin 2026-10-22). Affects Miro TS01 "verify e-Invoice / Invoice -> verify MyInvois" and TS07.
15. **Pre-Application link is session-locked.** "The Incognito window shows an error message that the Pre-Application is not allowed to be edited" (12153 Sheet1, R14 E item 1, via `EAINT-12153-qa-team-ts-study.md` §4 item 9). [unconfirmed] same lock may hit the reactivation link in a second session.
16. **Payment sandbox.** "Sandbox Creds: ⏎ username : Gaara ⏎ p/w : letmepaywithsand" (12153 Sheet1, R17); "Card Details (Cannot remember either Razorpay or Fiuu. Need to confirm first)" (R18). R18 negative card is out of date per `EAINT-12153-qa-team-ts-study.md` §6 item 2.
17. **SSM test data.** "SSM Document Director(s) data can be configured in eSIM SSM Submission" (5972/10164/11763 workbook, sheet EAINT-11763, 11763_DIRECTOR_ROC_TS1 Remarks).
18. **12:00 PM vs time of day.** "The parent SRD 11868 v1.4's reminder emails say the link "will expire on [Expiration Date] at 12:00 PM". Does that 12:00 PM cutoff apply to an extended expiry date" (`bo-application-extend.md` Q10, line 387) — still open.

## Past QA-Issues mentioned

1. **EAINT-11982 sub-tasks** (Jira capture 2026-10-27, item 9):
   1. **EAINT-12226** "[eAuto - BO] Extend button appears in the Registration Documents right sidebar instead of the page header as per Figma design".
   2. **EAINT-12231** "... Extend button shows too early it appears about 3 months before expiry instead of 30 days before".
   3. **EAINT-12235** "... Extend button disappears after extending instead of turning grey".
   4. **EAINT-12238** "[eAuto - BackOffice] UCD Application Listing - Last Updated Date does not change after an application is extended".
   5. **EAINT-12245** "... Grey Extend button disappears once the application is 3 months past expiry".
2. **EAINT-12153:** **EAINT-12588** "[eAuto - UCD Onboarding] FPX (B2B) Pending Approval page not shown until the page is refreshed".
3. **EAINT-12257:** **EAINT-12625** "[eAuto - UCD Onboarding] Cancelled DuitNow QR and FPX (B2C) payments do not show the Unsuccessful Payment message"; **EAINT-12627** "[eAuto - UCD] Business Info Review - DuitNow QR timer expiry does not show the Unsuccessful Payment message" (TS study §6 item 4: "EAINT-12627 looks fixed").
4. **EAINT-12341:** **EAINT-12426** "Application Approved - Both new approval emails are sent without the CC apply@eauto.my"; **EAINT-12428** "Appointment Letter PDF - Margins do not follow the template, so the text area is narrower".
5. **EAINT-11829, EAINT-11536, EAINT-11763:** none named in sheets or captures.

## Estimated testing effort

Faizuddin, 2026-10-27. **[unconfirmed]** — official figure lives in the QA Portal, not opened.

1. **Comparable tickets:**

| Ticket | Scope | TS count (source) | [QA] Est Man-day (cf 10081) |
|---|---|---|---|
| EAINT-11982 | Extend (one BO button + date rules) | 68 scenarios ("79 rows, 68 scenarios", ledger line 26) | **5** (Jira capture 2026-10-27) |
| EAINT-11829 | Expiry job + expired email | 22 (11829_TS01–TS15 + NAT11829_TS01–TS07) | "—" (Jira capture 2026-10-27) |
| EAINT-11536 | 2 listing columns | 10 (115366_TS01–TS10) | "—" (Jira capture 2026-10-27) |
| EAINT-12153 | PA / Application payment channels | 12 (12153_TS1–TS12) | **3.5** (Jira capture 2026-10-27) |
| EAINT-12257 | DuitNow QR channel | 13 (12257_TS1–TS13) | **3** (Jira capture 2026-10-27) |
| EAINT-12341 | 2 approval emails | 23 (E2E1–E2E18 + R1–R5) | **2** (Jira capture 2026-10-27) |
| EAINT-11763 | Application enhancements | 102 rows (catalogue row 048, sheet EAINT-11763) | "—" (Jira capture 2026-10-27) |

   1. **Already quoted for 11868:** Jira "[QA] Est Man-day (cf 10081): 6"; Miro "Est. Testing Mandays:  6 days (1 QA)" = "Base Testing Time: 4 days" + "Buffer (Req Change + Bug Fix + Retest Bug): 2 days" (study Header item 11).
2. **Expected TS count for EAINT-11868:** **30–40.**
   1. Why: 5 reminder emails + suppression + once-only + cycle reset (≈ 12341 size, ~12–15) + reactivation per status, failed payment, PA linkage, SSM refresh, loop (≈ 11829 size, ~15–18) + Extend / payment regression (~5). Smaller than 11982's 68 because Extend is regression only.
3. **Estimate in man-days:** **7** (range **6.5–7.5**) manual; **+2** if automated.
   1. **TS drafting:** 1.5 (no own TS yet; reuse 11829 / 12153 / 12341 rows).
   2. **Test execution:** 3.5 (full dealer journey per record; dev date patches + up to 30 min wait per cron run; 5 business types).
   3. **Retest / QA-Issue buffer:** 1.5–2.5 (11982 raised 5 QA-Issues, 12257 raised 2; 4 open SRD conflicts in the study).
   4. **Automation build:** 2, optional. Reactivation journey is automatable (reuse `scripts/eauto-preapp/`). Time-based reminders need a dev date patch and a cron wait per check. Not Wholesale.
4. **Confidence:** **medium.**
   1. Raises it: the deploy lands on staging; BA answers the open conflicts (5 vs 6 templates, Email 2/3 condition, 12:00 PM vs midnight).
   2. Lowers it: dev date patches needed per record per reminder (Email 1, 4, 5); another regression on Extend.
   3. **Update 2026-10-27:** "not deployed yet"; cron set to "every 30 mins with it starting on the hour" [answered by Faizuddin on 2026-10-27]. Waits are bounded (≤ 30 min per check); estimate unchanged.

## Knowledge candidates

1. **Cron for testing:** cannot run on demand; QA asks for the interval, usually every 30 mins from the hour [answered by Faizuddin on 2026-10-27]. Target: `knowledge/flow-application-reactivation.md` §10 Test data.
2. **EAINT-11868 not deployed to staging as of 2026-10-27** [answered by Faizuddin on 2026-10-27]. Target: `knowledge/flow-application-reactivation.md` header.
3. **No SharePoint TS for EAINT-11982** — `fetch.mjs ts 11982` returned "No workbook matches" (2026-10-27). Target: `knowledge/cr-test-scenario-catalogue.md` § Charmain ledgers.
4. **Reactivation regression set from past TS** (11829_TS01–TS11, 12153_TS2/TS10/TS12, 12341_E2E1/R1). Target: `knowledge/flow-application-reactivation.md` §"test focus".

## Sources read

1. `_reference/tickets/Studying/EAINT-11868/EAINT-11868-study.md` (2026-10-27).
2. `knowledge/cr-test-scenario-catalogue.md` § "Pre-Application & Application (onboarding)" rows 014, 018, 027, 028, 035, 037, 038, 041, 048; § "Charmain's test-scenario ledgers".
3. `knowledge/flow-application-reactivation.md` (grep: ticket keys, Mailtrap, Reset Application Expiry Date, midnight); `knowledge/flow-payment-channels.md` lines 520, 576, 579.
4. SharePoint text copies (`_reference/sharepoint/qa-team-ts/`):
   1. `EAINT-11536-🔴[...] To Add Two Columns for Pre-Application Listing and Application Listing.md` (sheets EAINT-11536, EAINT-11829) — full.
   2. `EAINT-11829 - [...] Registered.md` — header only.
   3. `EAINT-12153 - 🔴[...] Add Payment Channels ....md` — row titles + expected-result excerpts.
   4. `EAINT-12257 -🔴[...] Add DuitNow QR ....md` — row titles + notes rows.
   5. `EAINT-12341 - [...] Replace Approved Application Email ....md` — row ids + email-check excerpts.
   6. `EAINT-5972, EAINT-10164 & EAINT-11763 - Pre-Application & Application Enhancements.md` — sheet EAINT-11763 row ids + Remarks.
5. TS studies: `_reference/tickets/EAINT-12153/EAINT-12153-qa-team-ts-study.md`, `_reference/tickets/EAINT-12257/EAINT-12257-qa-team-ts-study.md`, `_reference/tickets/EAINT-12219/EAINT-12219-qa-team-ts-study.md` — full.
6. `_reference/codebases/eauto-qa-charmain/test-scenarios/bo-application-extend/bo-application-extend.md` and `.../bo-application-extend-button/bo-application-extend-button.md` — full.
7. Jira captures refreshed 2026-10-27 via `fetch.mjs issue`: EAINT-11982, 11829, 11536, 12153, 12257, 12341, 11763 (`_reference/tickets/Studying/<KEY>/<KEY>-jira.md`).
8. `fetch.mjs ts 11982` and `fetch.mjs ts Extension` — both "No workbook matches".
9. `data/pipeline/answers.json` — EAINT-11868 entries (deploy status, cron interval).
10. `_reference/automation code/Pre-Application & Application/eAuto-PreApplication-to-Registered-E2E-Flow-Pack/04-reference/automation-README-full.md` lines 1461–1476.
