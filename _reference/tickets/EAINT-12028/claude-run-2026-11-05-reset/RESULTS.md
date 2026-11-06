# EAINT-12028: run after the developer's reset (2026-11-05 afternoon, staging uat1)

Plan: `../claude-run-2026-11-05/RESET-RUN-PLAN.md`. One folder per TS (video + screenshots).
Evidence zips: `C:\Users\Faizuddin\Documents\Modefair\eAuto Test Evidences\12028`; failed TS are named
`[FAILED] - 12028_TSnn.zip` (Faizuddin, 2026-11-05).

## Step 0: survey (`_survey/`, as `mfared`)

1. **Feb–Oct:** all three statuses Pending, payment date "-", Audit Log empty. Reset OK.
2. **January was not reset:** fully approved, payment date 06-11-2026. Audit Log has 9 rows, all
   by Nur Izni Binti Zurni (`mfizni`) on 05-11-2026 13:09–13:10: Drafter and Reviewer Approved
   (signed), Approver Rejected, Reviewer Rejected, Drafter KIV, Undo KIV, then Drafter, Reviewer and
   Approver Approved (signed). So `mfizni` has signed again after the reset, and TS43 (first signature)
   is no longer possible with `mfizni`.
3. **Plan change:** the main chain (TS20 → TS29 → TS36) runs on **February** instead of January.
   The reject loop moves from February to **August** (the spare month).

## Results

| TS | Result | Month (state) | What was seen | Folder |
|---|---|---|---|---|
| 12028_TS47 | **fail (wording)** | Feb (Pending, no actions) | Audit Log reads "No workflow actions recorded yet."; TS and mock-up: "No activity yet." | `12028_TS47/` |
| 12028_TS28 part 1 | **fail (wording)** | Feb (Pending) | `eautonurul`: no buttons ✔; note "Waiting for the Drafter. You can act once the Drafter has approved." (TS: "Waiting for the Drafter to approve first.") | `12028_TS28-part1-Pending/` |
| 12028_TS35 part 1 | **fail (wording)** | Feb (Pending) | `kmcheah`: no buttons ✔; note "Waiting for the Drafter." (TS: "Waiting for the Reviewer to approve first.") | `12028_TS35-part1-Pending/` |
| 12028_TS49 part 1 | **fail (wording)** | Feb (Pending) | No PDF buttons ✔; note "…documents **become** available…" (TS: "will be available") | `12028_TS49-part1-Pending/` |
| 12028_TS54 | **pass** (Faizuddin, 2026-11-05) | Jan address → Feb | `/2026/2/1387d32e…/pdf?type=FMC` downloaded "Payment Requisition_FMC_January 2026.pdf". Expected: the download goes by the transaction id (`1387d32e-38ff-4753-b2dc-de0840caab24`), every transaction has its own id, and the month in the address is ignored. Faizuddin: "it is expected like this. because the system downloads based on the transaction ID". F11 (4 Nov) is the same behaviour, also not a defect. | `12028_TS54/` |
| 12028_TS20 | **pass** | Feb | `mfared`: [KIV] [Approve], no [Reject]; pad shown; empty after [Clear]; empty save → alert "Please provide your signature."; Cancel → still Pending, no row; signed → Approved; log "05-11-2026 15:29 Muhammad Fared Drafter Approved (signed)"; Summary Approved | `12028_TS20/` |
| 12028_TS25 part 1 | **fail (wording)** | Feb (DA) | `mfared`: no buttons ✔; note "Waiting for the Reviewer." (TS: "Drafter has already approved this month. Waiting for the Reviewer.") | `12028_TS25-part1-DA/` |
| 12028_TS35 part 2 | **fail (wording)** | Feb (DA) | `kmcheah`: no buttons ✔; note "Waiting for the Reviewer. You can act once the Reviewer has approved." | `12028_TS35-part2-DA/` |
| 12028_TS49 part 2 | **fail (wording)** | Feb (DA) | as part 1 | `12028_TS49-part2-DA/` |
| 12028_TS29 | **pass** | Feb | `eautonurul`: [Reject] [Approve], no [KIV]; pad shown; signed → Approved; log "05-11-2026 15:30 EAUTO NURUL Reviewer Approved (signed)"; Summary Approved | `12028_TS29/` |
| 12028_TS33 part 1 | **fail (wording)** | Feb (RA) | `eautonurul`: no buttons ✔; note "Waiting for the Approver." (TS: "Reviewer has already approved. Waiting for the Approver.") | `12028_TS33-part1-RA/` |
| 12028_TS49 part 3 | **fail (wording)** | Feb (RA) | as part 1 | `12028_TS49-part3-RA/` |
| 12028_TS36 | **blocked** | Feb (RA) | `kmcheah` [Approve] → **no signature pad**: the "Approve — Finance Payment Date" popup opened straight away, so a signature is already saved for `kmcheah`. Clicked [Cancel]; February still Approver Pending, no new row. | `12028_TS36/` |

## State at the end of this block

1. **February:** Drafter Approved (Fared, signed 15:29), Reviewer Approved (NURUL, signed 15:30),
   Approver Pending. Held for TS36.
2. Mar–Oct: untouched (all Pending).

## Night block (2026-11-05 evening, no `kmcheah` approval used)

Survey `_survey-night/`: same state as the end of the afternoon block (Jan Full, Feb Drafter + Reviewer Approved, Mar–Oct Pending).

| TS | Result | Month (state) | What was seen | Folder |
|---|---|---|---|---|
| 12028_TS67 | **pass** | Jul (all Pending) | `eautonurul`: no buttons. Dev tools: the page's own `#wf-form` set to role=REVIEWER, action=APPROVE and submitted → refused: "Reviewer cannot act until the Drafter has approved." Reviewer still Pending, Audit Log 0 rows. No deviation this time (all-Pending month used) | `12028_TS67/` |
| 12028_TS68 | **pass** | Jul (all Pending) | `kmcheah` (its signature is already saved, so nothing to protect): `#wf-form` role=APPROVER, action=APPROVE, paymentDate=tomorrow → refused: "Approver cannot act until the Reviewer has approved." Approver Pending, 0 rows, Summary July Payment Date "-" | `12028_TS68/` |
| 12028_TS21 | **pass** | Apr (Pending → KIV) | `mfared`: [KIV] [Approve] → [KIV] → Drafter "KIV"; row `05-11-2026 18:55 · Muhammad Fared · Drafter · KIV`; Summary April Drafter KIV | `12028_TS21/` |
| 12028_TS24 | **blocked (rule open)**, observed | Apr (KIV) | `mfared`: only [Undo KIV]; note "On hold. You put this month in KIV on 05-11-2026. Undo KIV to bring it back to Pending." The TS expects "state per final KIV rule (Open)" | `12028_TS24/` |
| 12028_TS28 part 2 | **fail (wording)** | Apr (KIV) | `eautonurul`: no buttons ✔; note "On hold. The Drafter put this month in KIV on 05-11-2026. Nothing to do until the Drafter resumes it." (TS: "Waiting for the Drafter to approve first.") | `12028_TS28-part2-KIV/` |
| 12028_TS35 part 3 | **fail (wording)** | Apr (KIV) | `kmcheah`: no buttons ✔; same KIV note (TS: "Waiting for the Reviewer to approve first.") | `12028_TS35-part3-KIV/` |
| 12028_TS49 part 4 | **fail (wording)** | Apr (KIV) | No PDF buttons ✔; "Payment Request documents become available for download once the Drafter, Reviewer and Approver have all approved." (TS: "will be available") | `12028_TS49-part4-KIV/` |
| SETUP-N1 | setup | Apr (KIV → Pending) | `mfared` [Undo KIV] → Pending, row "Undo KIV" 18:58 | `SETUP-N1-apr-undo-kiv/` |
| 12028_TS44 | **pass** | Apr (Pending → KIV → Pending) | `mfizni`: [KIV] [Approve] → [KIV] → Drafter "KIV"; row `05-11-2026 18:59 · Nur Izni Binti Zurni · Drafter · KIV`. Then SETUP [Undo KIV] → April Pending again | `12028_TS44/` |
| 12028_TS64 | **pass** | Mar (Pending → DA) | `mfared`, 2 tabs. Tab 1 [Approve] → no pad → Approved. Tab 2 (not refreshed) [Approve] → "Someone else already actioned this month. Please refresh and try again." Drafter-Approved rows = 1 (`05-11-2026 18:59`) | `12028_TS64/` (+ `-tab2.webm`) |
| 12028_TS65 | **pass** | Mar (DA → RA) | `eautonurul`, 2 tabs. Tab 1 approved; tab 2 refused with the same message; Reviewer-Approved rows = 1 (`05-11-2026 19:00`) | `12028_TS65/` (+ `-tab2.webm`) |
| 12028_TS27 | **pass** | Sep (Pending → DA) | `mfared` [Approve] → **no signature pad** → Drafter Approved; row `05-11-2026 19:01 · Muhammad Fared · Drafter · Approved (signed)` | `12028_TS27/` |
| 12028_TS45 | **pass** | Sep (DA → DRA → DA) | `mfizni` as Reviewer: [Reject] [Approve]; Reject "Claude 12028_TS45 reject 2026-11-05 night" → Drafter "Review Again · your turn"; row `19:02 · Reviewer · Rejected (returned to Drafter)` with the remarks. [Approve] as Drafter → no pad → Drafter Approved | `12028_TS45/` |
| 12028_TS26 | **fail (wording)**; actions pass | Aug (Pending → DA), Sep (view) | `eautozara`: [Approve] → **pad shown** (first signature after the reset), signed → Drafter Approved; row `19:03 · EAUTO ZARA · Drafter · Approved (signed)`. Sep (approved by another Drafter): no buttons ✔; note "Waiting for the Reviewer." (TS: "Drafter has already approved this month. Waiting for the Reviewer.") | `12028_TS26/` |
| 12028_TS30 | **fail (F15)**; actions pass | Aug (DA → DRA) | `eautonurul`. Blank and spaces only: [Submit Reject] disabled, but **no "Remarks are required to reject."** (popup text: "Reject — Remarks Please state the reason for rejection. This will be recorded in the audit log."). [Cancel] → unchanged, rows 1→1 ✔. Reject with remarks → Drafter "Review Again"; row `19:04 · EAUTO NURUL · Reviewer · Rejected (returned to Drafter) · Claude 12028_TS30 reject 2026-11-05 night` ✔; Summary Review Again ✔ | `12028_TS30/` |
| 12028_TS28 part 3 | **fail (wording)** | Aug (DRA) | `eautonurul`: no buttons ✔; note "Waiting for the Drafter. You can act once the Drafter has approved." (TS: "Waiting for the Drafter to approve first.") | `12028_TS28-part3-DRA/` |
| 12028_TS35 part 4 | **fail (wording)** | Aug (DRA) | `kmcheah`: no buttons ✔; note "Waiting for the Drafter." | `12028_TS35-part4-DRA/` |
| 12028_TS49 part 5 | **fail (wording)** | Aug (DRA) | No PDF buttons ✔; "…documents become available…" | `12028_TS49-part5-DRA/` |
| 12028_TS22 | **pass** | Aug (DRA → DA) | `mfared`: "Review Again · your turn", [KIV] [Approve], note "Returned by the Reviewer (EAUTO NURUL) on 05-11-2026: …". [Approve] → no pad → Drafter Approved; row `19:06 · Muhammad Fared · Drafter · Approved (signed)` | `12028_TS22/` |
| 12028_TS34 | **pass** | Aug (DA → RA) | `eautonurul` [Approve] → **no signature pad** → Reviewer Approved; row `19:06 · EAUTO NURUL · Reviewer · Approved (signed)` | `12028_TS34/` |
| 12028_TS37 | **fail (wording)**; all guards hold | Aug (RA, not approved) | `kmcheah` [Approve] → no pad (saved signature) → popup "Approve — Finance Payment Date … Only a future date is allowed. Select from the date picker only — typing or pasting is disabled.", `min=2026-11-06` (today and yesterday not selectable ✔). [Cancel] → Approver Pending, no row, Summary "-" ✔. Blank + [Confirm Approve] → alert **"Please pick a future payment date."** ✘ (TS: "Please select a payment date."). Typed `07112026` → empty ✔; Ctrl+V → empty ✔. Forced today/yesterday not re-sent (server refusal already shown 4 Nov) | `12028_TS37/` |
| 12028_TS38 | **fail (F15)**; actions pass | Aug (RA → RRA) | `kmcheah` Reject only. Blank / spaces: [Submit Reject] disabled, no "Remarks are required to reject." ✘. [Cancel] → unchanged ✔. Reject "Claude 12028_TS38 reject 2026-11-05 night" → Reviewer "Review Again"; row `19:08 · Chia Ket Ming · Approver · Rejected (returned to Reviewer)` with the remarks ✔; Summary Review Again, Payment Date "-" ✔ | `12028_TS38/` |
| 12028_TS25 part 2 | **pass** | Aug (RRA) | `mfared`: no [Approve] / [KIV] ✔. The TS asks only for the buttons in this state (no note); note seen "Waiting for the Reviewer." | `12028_TS25-part2-RRA/` |
| 12028_TS35 part 5 | **fail (wording)** | Aug (RRA) | `kmcheah`: no buttons ✔; note "Waiting for the Reviewer. You can act once the Reviewer has approved." | `12028_TS35-part5-RRA/` |
| 12028_TS49 part 6 | **fail (wording)** | Aug (RRA) | No PDF buttons ✔; "…documents become available…" | `12028_TS49-part6-RRA/` |
| 12028_TS31 | **pass** | Aug (RRA → RA) | `eautonurul`: [Reject] [Approve] shown; note "Returned by the Approver (Chia Ket Ming) on 05-11-2026: …". [Approve] → no pad → Reviewer Approved; row `19:11 · EAUTO NURUL · Reviewer · Approved (signed)` | `12028_TS31/` |
| SETUP-N2 | setup | May (Pending → DRA) | `mfared` [Approve] (no pad), `eautonurul` Reject "Claude SETUP for 12028_TS23 2026-11-05 night" | `SETUP-N2-may-to-drafter-review-again/` |
| 12028_TS23 | **pass** | May (DRA → KIV → DRA) | `mfared`: "Review Again · your turn", [KIV] [Approve] → [KIV] → Drafter "KIV"; row `19:12 · Muhammad Fared · Drafter · KIV`; note "On hold. You put this month in KIV on 05-11-2026. Undo KIV to bring it back to Review Again." Then SETUP [Undo KIV] → Review Again | `12028_TS23/` |
| SETUP-N3 | setup | Jun (Pending → RRA) | `mfared` + `eautonurul` [Approve] (19:13, no pads). The run was cut after these two by a state check of mine (it closed the same browser context); the `kmcheah` Reject was redone as SETUP-N3b (19:15) | `SETUP-N3-jun-to-reviewer-review-again/`, `SETUP-N3b-jun-approver-reject/`, `_check-june-state/` |
| 12028_TS32 | **fail (F16, mock-up rule as on 4 Nov)**; actions pass | Jun (RRA → DRA) | `eautonurul`: [Reject] [Approve]; note "Returned by the Approver (Chia Ket Ming) on 05-11-2026: …". Reject "Claude 12028_TS32 reject 2026-11-05 night" → Drafter "Review Again"; row `19:15 · EAUTO NURUL · Reviewer · Rejected (returned to Drafter)` with the remarks. Note: this matches the TS workbook text "Reviewer — Rejected (returned to Drafter)"; the fail follows the 4 Nov mock-up rule ("Rejected — returned to Drafter") | `12028_TS32/` |

## State at the end of the night block

1. Jan: Full (mfizni, before the reset). Feb: DA + RA, Approver Pending (held for TS36).
2. Mar: Drafter + Reviewer Approved, Approver Pending (for TS66, two tabs).
3. Apr: Pending (spare). May: Drafter Review Again. Jun: Drafter Review Again (after TS32).
4. Jul: Pending (spare). Aug: Drafter + Reviewer Approved, Approver Pending, after the full reject loop (for TS41 / TS48).
5. Sep: Drafter Approved (mfizni, after TS45), Reviewer Pending. Oct: Pending (for TS42 / TS46).

## Still open (needs a `kmcheah` approval or the developer)

1. TS36 (first Approver signature): blocked until the developer clears `kmcheah`'s saved signature.
2. After TS36 on Feb: TS39, TS25 part 3 (Full), TS33 part 2 (Full), TS50–53, TS55–57, TS69.
3. TS40 / TS41 / TS48 (Aug), TS66 (Mar), TS42 / TS46 (Oct, third Approver).
4. TS24: the BA's KIV rule.
