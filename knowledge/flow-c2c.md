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

1. Thumbprint: seller at Step 1, buyer at buyer step; UCD none [notes].
2. Save & Continue after seller step complete; 7 days from created date, pending management [notes]. **Hidden for the 17.11 JPJ demo** [notes].
3. No back navigation to the seller step after resume; none after JPJ enquiry [rec 50:56–51:58] `[unconfirmed]`.
4. 69E (no valid insurance) → redirect to insurance; proceed = re-enquire, eLKM kept; skip = eLKM dropped [notes] [rec 1:10:48–1:12:50].
5. Statuses: Pending, Cancelled, Expired, Failed, Approved [notes].
6. Permission: all users, all states; company level TBC [notes].
7. Approved transaction: post-completion handling within 30 days (insurance purchase) [notes] [rec 1:19:33].

## Open (2026-11-05)

1. eAuto fee, Perakuan text (legal), company-level permission, 7-day rule [notes].
2. Drop vs disable unavailable add-on rows in summary [rec 1:13:10].
3. Buyer details sent to seller — PDPA check [rec 1:26:11].
4. Make & model dropdown source [rec 1:23:50].
