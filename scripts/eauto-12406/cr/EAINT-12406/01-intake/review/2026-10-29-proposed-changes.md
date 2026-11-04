# EAINT-12406 — proposed TS changes, 29.10.2026 (NOT applied; for Azfar's review)

Why: the 29.10 pipeline wrote the specs and raised questions; post-deploy probes on staging /ia/ + CIBO showed how
the change actually looks. Rule used: SRD v1.1 §2.2.3 lists exactly 7 affected pages; anything not on that list
must stay as it was before the deploy (unchanged = PASS, changed = defect). Where the SRD says "same as Tokio
Marine", today's Tokio Marine is the yardstick.

## A. Wording changes to expected points

| # | TS · point | Now | Proposed | Why |
|---|---|---|---|---|
| A1 | RC_TS2 E2 (CIBO receipt) | Insurer, next line: "200601015674 (735426-V)" | Insurer shows "Allianz General Insurance Company (Malaysia) Berhad 200601015674 (735426-V)" in the same layout as the Tokio Marine receipt (name, then number; wrapping as Tokio Marine wraps). Line break recorded in Remarks | REQ-010 Ex.1 "same layout as Tokio Marine"; seen 29.10: number follows "Berhad" and wraps, as Tokio Marine does |
| A2 | RC_TS8 E3 (old Allianz BR55004010 receipt, after) | ... next line "200601015674 (735426-V)" | Same wording as A1, for the old transaction | Same; seen 29.10 on BR55004010 |
| A3 | RC_TS3 E1 (Transaction Details) | number "below it" (SRD wording; same line → record for Q42) | Allianz name with "200601015674 (735426-V)", laid out as Tokio Marine's Transaction Details (wraps under the name). Line break recorded | REQ-011 "below the insurer name, same as Tokio Marine"; today Tokio Marine wraps the same way (walk 28.10, BR69005852) |
| A4 | RC_TS10 E5 | Clear all empties every filter and the search box | Clear all sets every filter back to its default (Date Range Type stays "Transaction Creation Date") and empties the search box, same as before the deploy | Not an affected page (§2.2.3); seen 29.10 |
| A5 | CP_TS8 E2 | BEFORE: All Quotations captured | BEFORE: not captured before the deploy (made-up IC got "no instant quotation" on 28.10; old build gone) — point recorded as not available | Azfar 29.10 "okay" |
| A6 | CP_TS6 E1 | same font, size and colour as the rest of About Us and as the mockup | same font, size and colour as the rest of About Us; font, colour and centring as the mockup (mockup px size recorded, not judged: mockup 18–20 px, site 17 px for every paragraph) | The mockup draws all paragraphs bigger than the site; the new sentence must match its own page |

## B. "Same as before the deploy" points — mark PASS when unchanged (not "observed only")

RC_TS4 E1, E3, E5 · RC_TS10 E2, E3 · RC_TS5 E2, E3 · RC_TS6 E2. Expected result reworded to start "Same as before
the deploy:" and keep the observed value. Unchanged → PASS; changed → defect (not on the §2.2.3 list).

## C. How to run (no wording change)

| # | Item | Proposed |
|---|---|---|
| C1 | BEFORE evidence for RG_TS1–3, RC_TS8, CP_TS8 | From the 28.10 capture, copied into each TS folder and labelled "FROM THE BEFORE CAPTURE" (Azfar 29.10: okay) |
| C2 | Lonpac "Bhd" vs "Berhad" (RG_TS2) | Treated as identical (the TS already accepts both; EAINT-12422) |
| C3 | Payment window | One video per TS: the Fiuu window merged into the main video (Azfar 29.10) |
| C4 | RC_TS7 customer email / WhatsApp | Done by hand: Azfar checks the receipt email after the first Allianz purchase |
| C5 | RC_TS1 E8 (receipt labels vs Tokio Marine) | Until E2E_TS10's Tokio Marine purchase exists, compare with the CIBO receipt of BR69005852 (Tokio Marine, 17.09.2026) |
| C6 | RC_TS1 E9 (Print receipt view) | Checked only if the Success page offers it (being confirmed by today's purchase run) |
| C7 | QT_TS2 step 3 "go back" | Quote the same car again from Home instead of the back control (each Buy creates a CIBO record either way) |
| C8 | QT_TS2 E3 "looks the same" | Compare the Allianz unavailable card with the Lonpac / Tokio Marine unavailable card on text, contents, width, border and font |
| C9 | E2E_TS5 (failed then cancelled payment) | If /ia/ cannot reopen a pending payment by its address, check the Failed status in CIBO after the final payment instead |
| C10 | E2E_TS2 discount code | RJC7 (team doc §9); not re-checked in Discount Code Management (seen there 28.10: 7% discount) |
| C11 | E2E_TS1 step 8 JPJ status next day | Recorded by hand the next day; not an expected point |
| C12 | RC_TS10 E1 owner-ID search | Search in the format CIBO shows (999999-99-9999) and also plain digits |
| C13 | CP_TS7 / E2E_TS8 (production) | Wait for go-live (02.11+); need a real car + owner IC and Azfar's OK on the day |

## D. Not changed (still Azfar's)

The 10 orange rows stay ON HOLD. Quotation-matrix data (QT sheet) waits for today's post-eSim-fix retry.

---

## Azfar's decisions, 29.10.2026 — applied by cr-draft (v5)

Applied to `01-intake/scenarios.yaml` (v4 kept at `01-intake/_backup/scenarios-2026-10-29-v4-baseline.yaml`), the draft
workbook and ts.json (46 TS, 148 points). Board update without re-seeding: `01-intake/board-changes-2026-10-29.json`
(18 cases, 9 test-data docs, Q18; no `decision` on any other question).

### A. Wording

- **A1 RC_TS2 E2** — withdrawn 29.10, Azfar: expected stays per SRD; a mismatch goes to triage / BA.
- **A2 RC_TS8 E3** — withdrawn 29.10, Azfar: expected stays per SRD; a mismatch goes to triage / BA.
- **A3 RC_TS3 E1** — withdrawn 29.10, Azfar: expected stays per SRD; a mismatch goes to triage / BA.
- **A4 RC_TS10 E5** — applied under rule B (the SRD is silent on Clear all): "Same as before the deploy (SRD v1.1 §2.2.3 …):
  Clear all sets every filter back to its default (Date Range Type 'Transaction Creation Date', as on 28.10) and empties
  the search box; Print opens a print view of the listing".
- **A5 CP_TS8 E2** — applied (Azfar 29.10 OK): "BEFORE: not captured before the deploy (made-up IC got 'no instant
  quotation' on 28.10; old build gone): recorded as not available".
- **A6 CP_TS6 E1** — withdrawn 29.10, Azfar: expected stays per SRD; a mismatch goes to triage / BA.

### B. Rule (Azfar 29.10), applied

A point on a page or behaviour 12406 does not change passes when it was X before the deploy, is still X after, AND a
source says it should stay unchanged (SRD v1.1 §2.2.3 Affected Pages; REQ-010 Ex.2 / REQ-011 "other insurers remain
unchanged"; SA brief 29.09 "CIBO already shows Allianz … no code change"). Reworded to "Same as before the deploy
(<source>): <value>", "(observed)" tags dropped: **RC_TS4 E1, E3, E5 · RC_TS10 E2, E3, E5 · RC_TS5 E2, E3 · RC_TS6 E2**.
Each case's expected source now starts with the rule.

### C. How to run

C1 (BEFORE evidence from the 28.10 capture, labelled 'FROM THE BEFORE CAPTURE': RG_TS1–3, RC_TS8, CP_TS8), C2 (RG_TS2 Bhd =
Berhad), C3 (one video per TS, E2E sheet set-up), C4 (RC_TS7 by hand), C5 (RC_TS1 step 4: BR69005852 until E2E_TS10
exists), C6 (RC_TS1 step 5: Print offered per the 29.10 flow run), C7 + C8 (QT_TS2 steps 2–3), C10 (E2E_TS2: RJC7),
C11 (E2E_TS1 step 8 by hand, not a point), C12 (RC_TS10 step 1: ID as 999999-99-9999 and plain digits), C13 (CP_TS7 /
E2E_TS8: real car + IC and Azfar's OK on the day): applied in the steps / pre-conditions, no expected wording change.

**C9 not applied as proposed, replaced** (Azfar 29.10: "for secarang memang cannot do anything as pending or resubmit"):
E2E_TS5 no longer looks at CIBO between the failed and the final payment and never tries to reopen a pending payment.
After the final payment it checks the failed attempt's "Failed" status in CIBO (E2 reworded: "CIBO, checked after the
final payment: the failed attempt shows …").

### Q18

Answered (Azfar 29.10): Secarang has no cover-note resubmission; nothing is resubmitted. E2E_TS6 stays ON HOLD (orange);
its step 5 now only records the cover-note status.
