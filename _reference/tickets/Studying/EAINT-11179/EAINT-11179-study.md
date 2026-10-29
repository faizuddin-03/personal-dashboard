# EAINT-11179 — study (2026-10-26)

## 1. Header
1. **Title (Jira, verbatim):** 🔴[eAuto-UCD] STMS - Add entry point for LKM Refund & Insurance Cancellation Add-on from Step 5 to Step 4
2. **Title (Miro, verbatim):** EAINT-11179 - 🔴[eAuto-UCD] STMS - Move LKM Refund & Insurance Cancellation Add-on from Step 5 to Step 4 — **differs** ("Move" vs "Add entry point").
3. **Type:** Task · **Labels:** 261012-261016, October2026, ProductBacklog
4. **Jira status:** **To Do** (created 2026-05-09, updated 2026-10-22)
5. **Priority:** Medium
6. **QA (cf[10041]):** **Charmain Ea Chiang** · Miro card: "QA:" blank.
7. **BA:** reporter Chee Mei Jia (BA lead) · Miro "BA:" blank.
8. **Dev / assignee:** unassigned.
9. **Fix version:** none.
10. **Deployment (Miro column):** **TBC (pending requirement)**.
11. **Test env (Miro):** blank.
12. **Est. mandays (Miro):** blank ("days (1 QA)").

## 2. Sources read
1. Jira EAINT-11179 (MCP, read 2026-10-26): description; **0 comments**; **no attachments**; no links; remote links none.
2. Miro card: `EAINT-11179-miro-card.md`.
3. Knowledge: `knowledge/flow-stms-addons.md` lines 52-54, 114.
4. Teams: no hit for 11179 in `_reference/teams/` (export ends 2026-10-16).
5. **SRD: not attached** — no SRD exists on Jira yet (consistent with "pending requirement").

## 3. What changes
1. **Portal (verbatim):** "eAuto UCD"
2. **Module (verbatim):** "STMS - LKM Refund & Insurance Cancellation"
3. **Request (verbatim):** "To move LKM Refund & Insurance Cancellation optional add-on from Step 5 to Step 4 in STMS transaction flow."
4. **Why (verbatim):** "LKM Refund & Insurance Cancellation are offered as optional add-on at Step 5. Per Carsome feedback, their client leaves once Step 4 is done. UCD is unable to arrange another session to meet client for signature at Step 5, so add-on cannot be completed."
5. **Expected (verbatim):** "Move LKM Refund & Insurance Cancellation optional add-on to Step 4. UCD can capture client's add-on selection and signature within same session at Step 4, before client leaves."

## 4. New vs existing behaviour
1. **Existing:** add-on checkboxes, pop-ups, e-signature at **Step 5** (Payment).
2. **New:** selection + signature at **Step 4** (Submission / JPJ Checking).
3. Whether Step 5 keeps the add-ons ("Add entry point" in Jira title) or loses them ("Move" in description and Miro) — **unclear**.

## 5. QA scope
1. **Miro card (verbatim):** "Testing Scope: (Automation + Manual Testing)" — no further lines.
2. Expected areas `[inference — no SRD]`:
   1. Step 4 add-on display: LKM Refund (amount ≥ RM5, Individual, permission) and IC (Runnerku eligible).
   2. Pop-ups, AI document check, e-signature at Step 4.
   3. Step 5 payment summary still charges the add-on fees.
   4. Save & Continue Later / Resubmit keeps add-on data.
   5. Both add-ons together.

## 6. Affected regression areas
1. Entire **STMS Step 4 → 6** flow, Individual and Company.
2. LKM Refund + IC pop-ups, document preview, e-signature.
3. Payment summary, RHB non-split add-on payments, JPJ 2nd enquiry.
4. Existing transactions saved at Step 4/5 before deploy `[inference]`.
5. **EAINT-12431 / 12329** notification triggers tied to Step 4 `[inference]`.

## 7. Test data / env needs
1. Env not set.
2. eSim STMS enquiry with LKM Refund Amount; eSim Runnerku eligibility by vehicle prefix.
3. UCD with LKM Refund permission; KL/Selangor PTJ (Phase 1 gate per EAINT-12417).

## 8. Dependencies / related
1. LKM Refund base **EAINT-104**; Insurance Cancellation base **EAINT-12022**.
2. **EAINT-12585** — reuse/prepopulate uploaded documents between LKM Refund and IC (To Do).
3. **LKM Refund (Phase 2)** — no Jira key.

## 9. Teams decisions
1. **None found** in local exports for 11179.

## 10. Open questions / conflicts
1. **Requirement pending** — Miro column "TBC (pending requirement)"; no SRD.
2. **Move vs add:** Jira title "Add entry point … from Step 5 to Step 4" vs description/Miro "Move". Does Step 5 keep the add-ons?
3. **Step 4 JPJ enquiry timing:** LKM amount comes from the 1st JPJ enquiry at Step 4 (`flow-stms-addons.md` line 28) — is the add-on shown before or after the enquiry? `[inference]`
4. **QA owner:** Jira QA = Charmain; Miro QA blank.
5. **Company:** LKM Refund Company excluded in Phase 1/2 (EAINT-12417 comment); IC is Individual only — scope for Company not stated.

## 11. Existing repo knowledge / automation to reuse
1. `knowledge/flow-stms-addons.md` (both add-on flows).
2. `scripts/eauto-estm/`, `app/eauto/estm/` — STMS driving to Step 4/5.
3. Azfar repo: `_reference/codebases/eauto-qa-azfar/cr/EAINT-104/LEDGER.md`, `cr/EAINT-12022/`.
