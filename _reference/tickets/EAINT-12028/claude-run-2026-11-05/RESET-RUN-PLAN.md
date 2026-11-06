# EAINT-12028: run order after the developer's reset (statuses + signatures)

Written 2026-11-05. Faizuddin: "dev will reset the status and signature. so arrange the order of the TS
to be tested, so that we can maximaze the no. of TS in one reset".

**Assumes after the reset:** Jan–Oct closed, all three statuses Pending, payment dates empty, Audit Logs
empty, and no user has a saved signature. Check this first (step 0) before any click that changes data.

## Rules the order follows

1. **One first signature per person.** The TS that tests a person's pad must be that person's first
   Approve: TS20 `mfared`, TS29 `eautonurul`, TS36 `kmcheah`, TS43 `mfizni`, TS42 a third Approver.
   No setup approve by those people before their TS.
2. **Read-only checks on Pending months come first**, before anything moves.
3. **One month per chain**, so runs never land on a month another chain needs.
4. **Setup steps** (approve or reject only to reach a state) are recorded and labelled "SETUP".

## Order

| # | Month | Steps (user) | TS covered |
|---|---|---|---|
| 0 | all | Survey: every month Pending, Audit Logs empty | (check only) |
| 1 | Jan, still Pending | Read only: Audit Log empty (`mfared`); Reviewer and Approver notes on Pending; pending PDF note; forced Reviewer and Approver approval refused; download address blocked | **TS47, TS28, TS35, TS49, TS67, TS68, TS54** |
| 2 | Jan | `mfared` first Approve (pad) → Drafter buttons hidden → Approver note on DA → `eautonurul` first Approve (pad) → Reviewer buttons hidden → `kmcheah` first Approve (pad + tomorrow's date) | **TS20, TS25 (DA), TS35 (DA), TS29, TS33 (RA), TS36** |
| 3 | Jan, fully approved | Buttons hidden for all roles; PDFs for Approver, Drafter, Reviewer; second download same file; FMC + MMSDA PDF fields with the new signatures; no-role PDF address blocked; forced action refused | **TS39, TS25 (Full), TS33 (Full), TS50, TS51, TS52, TS55, TS56, TS57, TS53, TS69** (TS13 too, if the developer re-runs month-close) |
| 4 | Jul | `mfizni` alone: first Approve as Drafter (pad), Reviewer, Approver | **TS43** (Reviewer pad "per final rule (Open)": logged as seen) |
| 5 | Feb | `eautozara` approves Pending, `mfared` then blocked → `eautonurul` Reject (remarks) → `mfared` Approve on Review Again (no pad) → `eautonurul` second Approve (no pad) → `kmcheah` Reject → `eautonurul` re-approves → `kmcheah` payment-date popup checks (cancel, blank, today, past, typed, pasted) → `kmcheah` approves (no pad, still asks date) → Audit Log after the reject loop | **TS26, TS30, TS22, TS34, TS38, TS31, TS37, TS41, TS40, TS48** |
| 6 | Mar | `mfared` Approve from two tabs (no pad) → `eautonurul` two tabs → `kmcheah` two tabs | **TS64, TS27, TS65, TS66** |
| 7 | Apr | `mfared` KIV on Pending → what the KIV month allows (BA rule open) → Undo KIV → `mfizni` KIV → Undo KIV | **TS21, TS24 (observe), TS44** |
| 8 | May | SETUP `mfared` Approve, SETUP `eautonurul` Reject → `mfared` KIV on Review Again → Undo KIV | **TS23** |
| 9 | Jun | SETUP Drafter + Reviewer Approve, SETUP `kmcheah` Reject → `eautonurul` Reject on Reviewer Review Again | **TS32** |
| 10 | Sep | SETUP `mfared` Approve → `mfizni` Reviewer Reject → `mfizni` approves as Drafter | **TS45** |
| 11 | Oct | SETUP Drafter + Reviewer Approve → third Approver first Approve: sign, Cancel the date popup, Approve again (no pad) → `mfizni` Approver Reject | **TS42, TS46** |
| — | Aug | spare (re-run anything that fails on a setup error) | — |

**Covered in one reset: 43 TS** (42 without a third Approver for TS42).

## Not covered by a reset

| TS | Why |
|---|---|
| TS09, TS11 | Deprioritised (N/A), Faizuddin 2026-11-05 |
| TS12, TS13 | Need the developer to re-run month-close on a closed / fully approved month |
| TS15 | Super Admin login |
| TS16–19 | Test transactions and expected counts |
| TS62 | Module header (EAINT-12752 item 2) |
| TS01–08, 10, 14, 58–61, 63 | Not state-dependent; already run |

## Open before starting

1. A third Approver login that has never signed (TS42); otherwise TS42 is dropped.
2. Who runs TS36 and TS42 (Claude or Faizuddin).
3. Logout always through `R.logout()` (accepts "Sure to logout?").
