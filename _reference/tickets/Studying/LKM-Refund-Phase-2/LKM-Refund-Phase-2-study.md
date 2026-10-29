# LKM Refund (Phase 2) — study (2026-10-26)

## 1. Header
1. **Title (Miro, verbatim):** EAINT-xxxxx - LKM Refund (Phase 2)
2. **Jira key:** **not found** (searches in `LKM-Refund-Phase-2-jira-comments.md`).
3. **Jira status / priority:** n/a.
4. **QA (Miro):** "QA: Charmain / Azila"
5. **BA (Miro):** "BA: MJ, Yi Link"
6. **Dev:** not stated.
7. **Deployment (Miro column):** **TBC (update by 8/10/2026)**. Card line "To deploy on: 5th Mar" — capture note says it "look[s] copied from the Phase 1 card … Treat as template carry-over, not a plan."
8. **Test env (Miro):** "staging/preprod1 & /preprod2" · "Test Env Point to: JPJ Staging" — same carry-over caveat.
9. **Column date "8/10/2026"** has passed (today 2026-10-26) with no visible update.

## 2. Sources read
1. Miro card: `LKM-Refund-Phase-2-miro-card.md`.
2. Jira JQL searches (2026-10-26) — no Phase 2 ticket.
3. Jira **EAINT-12417** description + QA comment (Phase 1 gates, Phase 2 company exclusion).
4. Knowledge: `knowledge/flow-stms-addons.md`; Azfar `_reference/codebases/eauto-qa-azfar/cr/EAINT-12022/00-input/miro-lkm-board.md` line 4 ("Phase 1 staging/preprod1 - > esimulator staging/preprod2 -> JPJ staging").
5. Teams: `_reference/teams/eAuto-QAs.md`, `DM-Charmain-Ea-Chiang.md` — Phase 1 dates only; **no Phase 2 content**. The 24-09-2026 CR-group message quoted in EAINT-12417 is not in local exports.
6. **SRD: none** — no ticket, no attachment.

## 3. What changes
1. **Not defined in any source.** Only Phase 1 gates are recorded (EAINT-12417, verbatim):
   1. "Phase 1 item 4 (Yi Link Lim, CR group, 24-09-2026): \"PTJ Branch - Only display KL & Selangor in LKM Refund popup\""
   2. "Phase 1 item 2 (Yi Link Lim, CR group, 24-09-2026): \"Allow Individual category only\""
2. Phase 2 likely widens PTJ states beyond KL & Selangor `[inference]`. Supporting hint: EAINT-12518 "STMS - LKM Refund - Message Blast for East Coast, Kedah and Perlis" (Done) `[inference]`.

## 4. New vs existing behaviour
1. **Existing (Phase 1, prod since 1 Oct 2026 night deploy per Teams eAuto-QAs 2026-09-28 08:43):** Individual only; PTJ KL & Selangor.
2. **Phase 2:** unknown.

## 5. QA scope (Miro card, verbatim)
1. "SIT Testing: Connect to 3rd party staging for QA to test the integration"
2. "UAT Testing: Walkthrough with client / insurance party come over to eAuto for UAT testing"
3. "Testing Scope: - Regression Scope (before UAT) - E2E Happy Flow - Individual - Company - LKM Refund Payment = Failed - LKM Refund Submission = Failed - Pending item - IC automation test result"

## 6. Affected regression areas `[inference — from Phase 1 scope]`
1. STMS Step 1-6 with LKM Refund (Individual; Company if in scope).
2. LKM Refund Status listing (UCD + BO), Attachment listing, Recon, Payment reports, e-Invoice.
3. JPJ integration (SIT on JPJ staging).

## 7. Test data / env needs
1. Miro: preprod1 → eSim preprod2 → JPJ staging (carry-over; confirm).
2. eSim STMS enquiry LKM amount; LKM Refund Amount setup in BO (Manage LKM Refund Amount, state ticks).

## 8. Dependencies / related
1. Phase 1: **EAINT-104, EAINT-10093, EAINT-10119** (per Teams eAuto-QAs 2026-09-28 08:43).
2. **EAINT-12431 / 12329** notifications; **EAINT-12630** (BO Refund Attachment Listing enhancement, To Do, created 2026-10-26); **EAINT-12615** (user guide/FAQ, To Do); **EAINT-12585** (document reuse, To Do); **EAINT-12567 / 12591** (Android app LKM module). Whether any of these belong to "Phase 2" is **not stated** `[inference]`.

## 9. Teams decisions
1. Only indirect (via EAINT-12417 QA comment, 2026-09-29, quoting CR group 24-09-2026): "Company category remains excluded", "deprioritized until further notice".

## 10. Open questions / conflicts
1. **No Jira key** — is Phase 2 a new ticket yet to be raised, or the set of LKM tickets above?
2. **Company:** Miro scope lists "Company"; EAINT-12417 says Company "stays excluded in Phase 2".
3. **Deploy date / env** — Miro values are Phase 1 carry-over; "update by 8/10/2026" passed.
4. **"IC automation test result"** in scope — IC = Insurance Cancellation or Copy of IC? Not stated.
5. **SIT / UAT parties** — "insurance party" wording on an LKM (JPJ) card looks carried over `[inference]`.

## 11. Existing repo knowledge / automation to reuse
1. `knowledge/flow-stms-addons.md` (LKM Refund flows, lines 22-233).
2. Azfar repo `_reference/codebases/eauto-qa-azfar/cr/EAINT-104/LEDGER.md`; Phase 1 TS list in `cr/EAINT-12022/00-input/miro-lkm-board.md` lines 249-423.
3. `scripts/eauto-estm/`, `app/eauto/estm/`.
