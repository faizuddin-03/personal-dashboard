# Flow — C2C Motorcycle Ownership Transfer (EAINT-12745)

UCD Portal module, individual seller → individual buyer, motorcycles only. Not built yet;
everything below is **planned design**, not observed behaviour. Raw sources in
`_reference/tickets/EAINT-12745/`.

Tags: `[jira]` = EAINT-12745 description · `[notes]` = Teams meeting notes 2026-11-05 ·
`[rec mm:ss]` = meeting recording transcript 2026-11-05.

## Steps (4-step layout replaces the ticket's 6 steps) [notes]

1. **Step 1 — Seller Thumbprint & Vehicle & Contact Details.** Reuses STMS Step 1 [notes]. Category MyKad & MyPR only, no Company [notes]. Perakuan expanded until ticked, collapses after [notes]. Vehicle type shows "Motorcycle" only [notes]. Make & model typed in by UCD for now [notes].
2. **Step 2 — Buyer Thumbprint & Optional Services.** Reuses eSTM Step 3 [notes]. Buyer phone, email, address required [notes]; address from IC [rec 14:09]. Optional Insurance / eVOC / eLKM ticked before JPJ enquiry, no prices shown yet [notes].
3. **Step 3 — JPJ Check & Payment Summary.** Add-ons still tickable [notes]. Unavailable eLKM/eVOC dropped from summary [notes]. eAuto fee TBC [notes].
4. **Step 4 — Transfer.**

## Rules

1. Thumbprint: seller at Step 1, buyer at buyer step; UCD none [notes]. **No dealer thumbprint anywhere in C2C — both thumbprints are customers (seller and buyer)** [Faizuddin, 2026-11-06]. Any eSTM/STMS dealer-thumbprint or UCD-perakuan step is not part of C2C.
2. Save & Continue after seller step complete; 7 days from created date, pending management [notes]. **Hidden for the 17.11 JPJ demo** [notes].
3. No back navigation to the seller step after resume; none after JPJ enquiry [rec 50:56–51:58] `[unconfirmed]`.
4. 69E (no valid insurance) → redirect to insurance; proceed = re-enquire, eLKM kept; skip = eLKM dropped [notes] [rec 1:10:48–1:12:50].
5. Statuses: Pending, Cancelled, Expired, Failed, Approved [notes].
6. Permission: all users, all states; company level TBC [notes].
7. Approved transaction: post-completion handling within 30 days (insurance purchase) [notes] [rec 1:19:33].

## Decisions (Faizuddin, 2026-11-06)

1. **Seller add-ons LKM Refund + Insurance Cancellation are IN** (confirmed in the 05.11 meeting).
2. **What C2C reuses.** STMS = seller (customer) → dealer; eSTM = dealer → buyer (customer). "Buyer" / "seller" mean customer or dealer depending on the module. C2C = **customer side of STMS** (seller thumbprint) + **customer side of eSTM** (buyer thumbprint, payment, ownership transfer). The dealer is an intermediate only. Step numbers in the notes ("eSTM Step 3") may be wrong — the customer side always wins.
3. **Triggers move with 6 → 4 steps** (JPJ enquiry, insurance redirect, etc.). Expected values: **SRD / Teams / black-and-white source first, else the logical flow**; Faizuddin shares updates.
4. **IDD not confirmed** — expected values from what is confirmed now, refine later.

## How to read the mockup — RULE (Faizuddin, 2026-11-06)

1. **The mockup is a guideline for the flow only** (step order, what happens where).
2. **For the UI, every single thing must follow existing behaviour/results** — STMS, eSTM and add-on screens as they are today. Mockup labels, layouts, prices, statuses and button names are **not** expected results.
3. Writing TS: take the step sequence from the mockup + 05.11 notes; take every UI expected result from the existing module (`flow-stms.md`, `flow-stms-addons.md`, `flow-estm.md`).

## Conflicts — Jira mockup vs 05.11 notes (flow-level only; UI follows existing behaviour) `[mockup]` = `eauto_C2C_Module_Mockup.html` (Jira, 2026-11-05 17:53)

1. **Vehicle type:** mockup tile "(Car / Motorcycle)", Vehicle Type dropdown Car + Motorcycle, default "Car" [mockup] · Jira "Motorcycles only" [jira] · notes "just cover motorcycle", default "Motorcycle" [notes].
2. **Steps:** mockup 6 — Seller (Owner), Vehicle, Buyer (New Owner), JPJ Check, Payment, Transfer [mockup] · notes 4 [notes].
3. **Seller add-ons:** mockup LKM Refund (RM 350.00* entitlement, RM 30.00 charge) + Insurance Cancellation (86%*, RM 38.00) [mockup] · notes list only Insurance / eVOC / eLKM [notes].
4. **Buyer add-on prices before JPJ:** mockup shows Insurance RM 450.00, e-LKM RM 90.00 + RM 2.75, e-VOC RM 10.00 [mockup] · notes "no need to show the pricing for insurance and eLKM" [notes].
5. **Save & Continue:** mockup shows the button on every step, listing status Draft / Completed, action "Resubmit" [mockup] · notes: hidden for 17.11 demo; statuses Pending / Cancelled / Expired / Failed / Approved [notes].
6. **Agreed in both:** MyKad & MyPR only ("Individual only"); Perakuan checkbox before verify; buyer "Email (to receive eVOC)" + "Reconfirm eVOC Email"; C2C fee "To be confirmed"; refund shown separately, "not deducted from charges" [mockup] [notes].

## Code facts from Ask eAuto (prod/master 979e4141c7, 2026-11-06) [askeauto: _reference/tickets/EAINT-12745/EAINT-12745-ask-eauto-2026-11-06.md]

1. **No C2C code yet** in any of 24 repos; no EAINT-12745 commits (feature branches not visible).
2. StmsJpjSubmissionJob / EstmJpjSubmissionJob, APT creation, bulk enquiry / payment lists select rows **by status, not type**. **C2C uses its own tables** (Faizuddin, 2026-11-06), so this is a regression sanity check only; C2C needs its own submission job.
4. Open (2026-11-06): C2C **region code source** and **JPJ receipt email (Email1) recipient** — to confirm.
3. eSTM JPJ requests take seller company ID, category "4", BRN, region code (UCD company state/city), Email1 and eVOC fallback from the **UCD** — all must be customer-sourced for C2C.

## Open (2026-11-05)

1. eAuto fee, Perakuan text (legal), company-level permission, 7-day rule [notes].
2. Drop vs disable unavailable add-on rows in summary [rec 1:13:10].
3. Buyer details sent to seller — PDPA check [rec 1:26:11].
4. Make & model dropdown source [rec 1:23:50].
