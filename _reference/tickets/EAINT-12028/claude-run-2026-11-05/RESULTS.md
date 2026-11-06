# EAINT-12028: Claude-driven run, 2026-11-05 (staging uat1, main laptop)

Continues `../claude-run-2026-11-04/` (plan, logins, recorder, wording rule). Recorder:
`scripts/claude-run/recorder.js` through the Playwright plugin, amber/green/red style, one video per TS.
Faizuddin: "yes" to the run of TS06, TS56, TS57 and the EAINT-12738 / 12739 retests (2026-11-05).
No data changed: no approve, KIV or reject clicks. Jira not touched.

| TS | Result | User / month | What was seen | Evidence |
|---|---|---|---|---|
| 12028_TS06 | **pass** (corrected 10:55; first two runs were a test error, see "F17 withdrawn") | `mfared` then `onghongkee`, same browser; February | TS steps 1–7 in one browser: after the Drafter's BO Logout and the no-role login, the copied **Summary address shows the full listing** and the **February Details page opens** (no action buttons; month fully approved). The module keeps its own `/backoffice` JSESSIONID, which the BO Logout does not end, so the next user rides on the Drafter's module session. **Fresh browser** (no earlier session): both addresses show **"No access to this module"** = correct. New finding **F17**, not raised. | `12028_TS06/`, `12028_TS06-fresh-browser/` |
| 12028_TS56 | **fail** (2 of 21) | `mfizni` (Approver); February (fully approved) | File name "Payment Requisition_FMC_February 2026.pdf" ✔. ✘ Header "eAuto Sdn **.Bhd.**" (expected "eAuto Sdn. Bhd."). ✘ Account Holder Name shows "FED OF MOTOR & CREDIT COMPANIES ASSO MSI" with "(PPM-001-14-11041979)" on a separate **Address** row. Both = **EAINT-12768**. ✔ the other 19: To, Attn, Adds, Date 04-11-2026 (Approver date, not pay date 05-11-2026), Requestor Muhammad Fared, "eAUTO PAYMENT TO FMCCAM" / "FEB 2026", bank details, MYR 404.00 = TOTAL Cars, "FOUR HUNDRED FOUR ONLY", Prepared / Checked / Approved with signature, name and 04-11-2026. | `12028_TS56/` (PDF + page PNG; `-pdf-view.webm` shows the page) |
| 12028_TS57 | **fail** (1 of 21) | `mfizni`; February | File name "Payment Requisition_MMSDA_February 2026.pdf" ✔. ✘ Header "eAuto Sdn **.Bhd.**" (EAINT-12768). Extra **blank Address row** (EAINT-12768 row 2, KIV). ✔ the other 20, incl. "eAUTO PAYMENT TO MMSDA" / "FEB 2026" (English month), MMSDA bank details, MYR 76.00 = TOTAL Motorcycles, "SEVENTY SIX ONLY", three signatures. | `12028_TS57/` |
| EAINT-12738 retest | **pass** | `mfared`; February Audit Log | Role "Drafter" / "Reviewer" / "Approver"; Action "Approved (signed)" (were DRAFTER / APPROVE). | `Bug - EAINT-12738/` |
| EAINT-12739 retest | **pass** | `mfared`; February Audit Log | When "04-11-2026 11:28" = DD-MM-YYYY HH:mm (was "02 Nov 2026 15:36"). | `Bug - EAINT-12739/` |

Note: the PDF link forces a download (Chrome cannot show it in a tab), so each PDF was rendered
to PNG (PyMuPDF) and shown in a recorded tab with the checks as captions.

## F17 (new, not raised): module session survives the BO Logout

- **Steps:** log in as `mfared` → open the listing → BO Home → Logout → log in as `onghongkee`
  (no Association role) in the same browser → open `/backoffice/admin/association` and
  `/backoffice/admin/association/2026/2`.
- **Actual:** both pages open with the full data.
- **Expected (TS06):** "Access blocked; Summary listing not shown"; Details "Access blocked".
- **Same cause family:** no module Logout (TS58, EAINT-12752 item 2) and the bare "Unauthorized"
  page after the core logout (F1, TS60, accepted as pass).

## TS06 rerun with the address bar visible (one-off, 2026-11-05 10:35)

Faizuddin: "include the url in the recording also, so that humans can see and verify that the user
enters through URL change ... only for this TS for this one particular time. after that, make sure to
change back the recording style".

- **Method (this run only):** whole-screen recording (ffmpeg gdigrab) of a visible Chrome window. Addresses
  were copied and pasted through the real address bar with Windows keystrokes (Ctrl+L, Ctrl+C / Ctrl+V,
  Enter). Script: `scripts/claude-run/one-off/ts06-url-visible.mjs`. Normal runs keep `recorder.js`.
- **Result: same as the morning run, fail (F17).** In the same browser, after the BO Logout and the
  `onghongkee` login, pasting `https://staging.eauto.my/backoffice/admin/association` and
  `…/association/2026/2` shows the Summary and the February Details page. In a new window with no earlier
  session, both show "No access to this module".
- **Evidence:** `12028_TS06-url-visible/12028_TS06-url-visible.mp4` (2 min 12 s, taskbar clock visible) and
  `run-log.txt`. Exported with the morning files as `eAuto Test Evidences\12028\12028_TS06_2026-11-05.zip`.

## F17 withdrawn: TS06 is a PASS (10:55)

Faizuddin tried it by hand in one browser and was blocked; his video:
`_reference/tickets/EAINT-12028/12028_TS06_Manual Test.mp4`. Frame-by-frame, his Logout shows the browser
confirm **"Sure to logout?"** and he clicks **OK**.

- **My error:** in the morning run and the address-bar rerun, nothing answered that confirm. Playwright
  dismisses an unanswered confirm, which is **Cancel**, so `mfared` was **never logged out** (the page stayed on
  `/uat1/home/`). Logging in as `onghongkee` on top of that kept the Drafter's module session. Not the TS steps.
- **Rerun with OK** (`12028_TS06-check-C-logout-confirmed-OK/`): Logout → `/uat1/public/login/` → `onghongkee`
  → Summary address → `/backoffice/public/auth/token?...` → **"No access to this module"** ✔. Same as his video.
- **Result: TS06 pass.** The `12028_TS06`, `-url-visible` and `-check-B` folders show the cancelled-logout
  case and are kept only as the record of the mistake.
- **Side observation (not TS06, not raised):** logging in as another user **without** logging out first keeps
  the previous user's module session. Faizuddin to decide whether that matters.
- **Fix:** `recorder.js` now has `R.logout()`, which accepts the confirm like a person clicking OK. Trap
  written in `knowledge/claude-driven-testing.md`.
- **Full TS06 rerun (11:00, normal recorder style, Logout confirm accepted):** steps 1–7 all pass. Summary and
  Details addresses both show "No access to this module"; no action buttons. Folder `12028_TS06-full-rerun/`.
  Exported as `eAuto Test Evidences\12028\12028_TS06_2026-11-05.zip` (replaces the earlier zip of the wrong run).

## Deprioritised (2026-11-05)

- **TS09, TS11: deprioritised (N/A).** Faizuddin: "deprio TS09, TS11, as there will always be transaction".
  TS09 needs a closed month with zero transactions; TS11 needs a past month not yet closed. TS Tracker shows N/A.
