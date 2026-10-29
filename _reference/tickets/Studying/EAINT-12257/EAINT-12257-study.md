# EAINT-12257 study (2026-10-26)

## 1. Header
1. **Title (Jira, verbatim):** "🔴[eAuto-Application] Add DuitNow QR Payment Channel for Pre-application and Application"
2. **Jira status:** **Testing In 1st Env** (updated 2026-10-26 10:02).
3. **Priority:** Medium. **Type:** Task. **Labels:** 260803-260807, August2026, ProductBacklog.
4. **QA (Jira cf[10041]):** Muhammad Faizuddin Bin Bidi. **Miro:** "QA: Faiz".
5. **BA:** Lim Yi Link (Jira assignee + reporter; Miro "BA: Yi Link"). Note: `knowledge/cr-ledger.md` says assignee Chee Mei Jia — Jira now shows Lim Yi Link.
6. **Developer:** Mong Guo Hao (Teams 2026-09-02 split: "DuitNow QR / Mong").
7. **Deployment date:** **29 Oct 2026** — Miro column "29TH OCT DEPLOYMENT"; Jira fix version `S34.1X-20261029🌞` (release 2026-10-29).
8. **Test env:** Miro "Test Env:" blank. QA-Issues EAINT-12625 / 12627 say "**staging/eauto**".
9. **Estimate:** Miro "Est. Testing Mandays: 3 days (1 QA)" — base 2 + buffer 1. "Testing Scope: (Manual + Automation Testing)".

## 2. Sources read
1. **Jira EAINT-12257** via Atlassian MCP, 2026-10-26. 0 comments. 2 sub-tasks (EAINT-12625 Closed, EAINT-12627 To Do). 0 issue links. 0 remote links.
2. **Attachments (Jira):** `SRD_EAINT-12257_v0.1_20260910.docx`, `SRD_EAINT-12257_v1.0_20260910.docx`, **`SRD_EAINT-12257_v1.0_20260910.pdf`** (latest).
3. **SRD v1.0:** PDF **not retrieved** (MCP cannot fetch binaries; no local PDF). **Text copy retrieved** — `EAINT-12257-SRD-v1.0-20260910-text.md` (copied from `_reference/tickets/EAINT-12257/`, made 2026-10-21 from Jira viewer, requirement rows verbatim). Drop the PDF here if a binary copy is needed.
4. **Official TS:** OneDrive `eAuto Documents\EAINT-12257\EAINT-12257 - official TS v25 + no-error-message update 2026-10-26.xlsx` (read 2026-10-26, not copied). Repo snapshot v19 at `_reference/tickets/EAINT-12257/`.
5. **Teams export** `_reference/teams/EAINT-12153-12257-12259-Onboarding-Payment-Channels.md` (to 2026-10-16).
6. **Knowledge:** `knowledge/flow-payment-channels.md` (§4f, §4g, §4h, §9, "DuitNow QR Cancel returns PENDING", "Closing the payment gateway page" 2026-10-26), `knowledge/cr-ledger.md` § EAINT-12257.
7. **Run artifacts** `public/qa-artifacts/eauto-12257/` (2026-10-22 12:04 to 2026-10-23 18:47).

## 3. What changes
1. **Portal / module:** UCD onboarding — Pre-application payment and Application payment (SRD §2.2.3).
2. **What (SRD REQ-001, verbatim):** "The system shall display \"DuitNow QR\" as a payment method option in the Pre-application and Application onboarding payment."
3. **Popup (REQ-003):** Fiuu DuitNow QR, instruction "Kindly scan the QR code below to proceed with payment. Do Not Refresh!", timer "Scan QR in mm:ss" from **03:00**.
4. **Success (REQ-004):** Pre-application → Pre-Application Summary page; Application → Application Payment Success page.
5. **Failure (REQ-005, verbatim):** "a. The timer reaches 00:00 before payment completes b. The user clicks Cancel the transaction c. The bank declines the payment or funds are insufficient." → close popup, return to method selection, show existing "Unsuccessful Payment" message.
6. **Retry (REQ-006):** same Pre-application / Application continues; no restart.
7. **Why (SRD 2.1.2):** "Give new users greater payment flexibility during onboarding by supporting DuitNow QR alongside the existing payment methods."

## 4. New vs existing behaviour
1. **Existing (SRD 2.2.2):** "DuitNow QR is not currently available as a payment method during UCD onboarding."
2. **New:** DuitNow QR option; QR window opens at `/obs/preOnb/landing/<uuid>/RPP_DuitNowQR` then Fiuu sandbox QR page (flow-payment-channels §4h, verified 2026-10-22).
3. **As built — Cancel / timer / close:** Fiuu returns, eAuto callback shows "Payment is pending" with `paymentStatus = "PENDING"`, review page reloads with **no** "Unsuccessful Payment" box (verified 12257_TS03 and TS05 traces, 2026-10-23).
4. **Decision 2026-10-26:** no message on close / cancel = existing behaviour (EAINT-12625 Closed). Timer expiry (EAINT-12627) still To Do.

## 5. QA scope
1. **Miro:** "Testing Scope: (Manual + Automation Testing)" — no further detail on the card.
2. **Official TS v25 (OneDrive copy, 2026-10-26) — 13 TS:**
   1. TS1 Happy Flow; TS2 Reject & Retry; TS3 Cancel; TS4 Close QR window; TS5 Timer Expiry.
   2. REGRESSION: TS6 FPX (B2C) Success; TS7 FPX (B2C) Failed; TS8 Card VISA Success; TS9 Card Mastercard Failed > Success; TS10 FPX (B2B) Success.
   3. TS11 Reject & Retry – BO Payment Details; TS12 Cancel – close browser and reopen link; TS13 Timer Expiry – BO listing payment status.
3. **TS v25 Faiz's Note (verbatim):** "Cancel the payment ; Failed ; No error message - follow existing behaviour (EAINT-12625, 26/10/2026)"; "Close the QR Code window ; Failed ; No error message - follow existing behaviour (EAINT-12625, 26/10/2026)"; "Wait for the timer to end ; Failed" (no note).

## 6. Current state and what remains before 29 Oct
1. **TS v25 status column (OneDrive, 2026-10-26 10:54):** **TS1 Pass, TS2 Pass; TS3–TS13 "Not Started".**
2. **Automation runs seen:** TS1, TS2 (10-22), TS03, TS04, TS05, TS06 (10-23). `[inference]` TS3–TS6 ran but results not yet written into the sheet.
3. **Open bug:** **EAINT-12627** timer expiry, To Do.
4. **Remaining checklist `[inference]`:**
   1. Decide EAINT-12627 (fix vs "existing behaviour" like 12625); update TS5 / TS13 expected result.
   2. Re-run / record TS3–TS5 against the 2026-10-26 "no error message" expectation.
   3. Run regression TS6–TS10 and BO / reopen cases TS11–TS13.
   4. Sync status into the SharePoint official TS; sign off in CR group.

## 7. Affected regression areas
1. FPX (Personal) B2C, Credit/Debit Card, FPX (Business) B2B — same payment step (TS6–TS10).
2. **Unsuccessful Payment** handling for all channels — EAINT-12625 found FPX B2C cancel also gives no message.
3. BO Pre-Application / Application listing — Registration Fee status (OK / Failed / Pending UCD).
4. Invoice / e-Invoice after payment (e-Invoice not downloadable on staging — TIN issue, accepted as PASS 2026-10-22).

## 8. Test data / env needs
1. Fiuu sandbox DuitNow "phone" — scanner tab `/duitnow/viewqr`, choose Approve / Reject (flow-payment-channels §4g, verified 2026-10-21). TS wording still says "Open the Fiuu QR app on phone".
2. 3-minute wait per timer case (TS5, TS13).
3. Fresh company per TS; business types per TS row (Sdn Bhd, LLP, Sabah, Sarawak, Sole Prop).
4. Registration fee **RM 1,500.00** (not RM 990) — `QR_FEE_REGISTRATION` in `scripts/eauto-duitnow-qr` out of date (flow-payment-channels §0b).
5. BackOffice login for TS11 / TS13 BO checks.

## 9. Dependencies / related tickets
1. **EAINT-12153** (B2B, same release), **EAINT-12259** (card, prod).
2. **EAINT-12625** (Closed), **EAINT-12627** (To Do).
3. SRD associated: CCB-937, EAUTO-1018.

## 10. Teams decisions (verbatim, export ends 2026-10-16)
1. `[_reference/teams/EAINT-12153-12257-12259-Onboarding-Payment-Channels.md, 2026-08-19 12:48, BA]` "we received feedback from Fiuu that B2B and DuitNow QR is not enabled in prod just yet"
2. `[same, 2026-09-03 14:57, dev Mong]` "cannot just patching, but morning deployment should be ok"
3. `[same, 2026-09-11 11:14, BA]` "for REQ-001, it means that DuitNow QR is the new payment method in PA & A payment step ya."
4. `[same, 2026-09-25 10:38, dev Mong]` "12257 - will need to test then code review"
5. `[same, 2026-09-29 10:58, dev Mong]` "both tickets are ready for testing, but not deployed yet"
6. **After export (Jira, 2026-10-26 10:39, QA):** "Follow existing behaviour where it will not show error message if close the payment gateway page"

## 11. Open questions / conflicts
1. **SRD REQ-005 vs 12625 decision:** SRD says Cancel and timer expiry show the "Unsuccessful Payment" message. 12625 closed as "existing behaviour" (comment speaks of closing the page; TS v25 extends it to Cancel). BA sign-off on this deviation not seen.
2. **EAINT-12627 timer expiry:** To Do. Fix before 29 Oct, or close like 12625? TS v25 note row for timer has no "no error message" remark.
3. **Prod DuitNow availability:** Teams 2026-08-19 "not enabled in prod just yet". No later confirmation in export. Confirm Fiuu prod enablement before 29 Oct.
4. **SRD §2.2.6 "Pending (Fiuu)":** amount display in popup; refresh/Back during popup and duplicate-payment safeguard — still undefined in v1.0.
5. **Payment status on cancel:** observed PENDING (not FAILED) in eAuto; TS note says "Failed". Confirm what BO shows.

## 12. Existing repo knowledge / automation to reuse
1. `knowledge/flow-payment-channels.md` — §4f, §4g, §4h, cancel/timer traces, 2026-10-26 decision.
2. `scripts/eauto-12257/` + `app/eauto/12257/` (`app/api/eauto-12257/run`); older `scripts/eauto-duitnow-qr/` + `app/eauto/duitnow-qr`.
3. `_reference/html/fiuu/duitnow-qr-window.html`, `duitnow-viewqr-payment-successful.html`.
4. `_reference/tickets/EAINT-12153/First_QR_TestRun/` (first 12257_TS1 run evidence).
5. `_reference/tickets/EAINT-12257/EAINT-12257-official-TS-sharepoint-v19-20261021.md` (older snapshot).
