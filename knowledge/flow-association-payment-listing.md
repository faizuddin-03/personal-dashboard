# Flow: Association Payment Listing (BackOffice)

`[from ticket EAINT-12028 — mockup HTML only, association-payment-listing-mockup_20260731.html, _reference/tickets/EAINT-12028/. NOT a live system yet — ticket is still Ready For Development. Every DOM handle below is the MOCKUP's own id/class, offered as the closest available reference; real build ids may differ once shipped and must be re-confirmed with a live capture at that point.]`

**Status 2026-10-15: ON HOLD.** "MJ ytd updated us that 12028 need to on hold
first as we got other higher priority tickets" (May Chin DM 2026-10-15 09:56);
"not going to deploy on end of this month anymore" (Mei Jia, 2026-10-14
12:03); dev Kasheng Liew. Supersedes the October deployment estimates in
"Priority / scope discussion" and "UPDATE 2026-09-18" below.
`[from Teams via memory digest]`

## Live captures (staging uat1, 2026-11-02)

The first real-build pages, pasted by Faizuddin. Raw HTML only so far; the sections below are still mockup-based until the comparison is approved.

1. Summary: `_reference/html/eauto/bo-association-payment-listing-summary.html` `[verified: live HTML from uat1, 2026-11-02]`
2. Details, September 2026, all Pending, Approver login (not its turn): `_reference/html/eauto/bo-association-payment-listing-details-sep-2026-approver-not-turn.html` `[verified: live HTML from uat1, 2026-11-02]`

## No-role user and the menu link (2026-11-02)

1. A BO user with no Drafter / Reviewer / Approver role **must not see** the "Association Payment Listing" link under Reports. `[Faizuddin: confirmed with BA in chat, 2026-11-02]` The SRD does not state this; REQ-003 only says such a user "cannot perform Drafter / Reviewer / Approver actions".
2. Live uat1 (2026-11-02): the link **is shown** to such a user (Jason Seah). Raised as **EAINT-12716** (Medium, Developer/assignee Shane). Evidence: `_reference/tickets/EAINT-12028/Bug - EAINT-12716/EAINT-12716-actual-no-role-user-sees-link-uat1.png`.
3. Affects 12028_TS05 (expected = link hidden).

## Flow + roles artifact (browser reference)

Published diagram combining the flow (steps 1–8, entry through PDF) with the login-ID → role
mapping, for quick reference while working this ticket:
**https://claude.ai/code/artifact/7f84d14c-d908-4cb0-b045-a4ec86d8ab93**

Source: `_reference/tickets/EAINT-12028/EAINT-12028-flow-and-roles-artifact.html`. **To update**:
edit that source file, then republish with the Artifact tool passing the same `file_path` (or the
URL above via `url` from a fresh session) — this keeps the same link rather than creating a new
one. Update it whenever the flow/role facts below change (environment confirmed, MR !1 merged,
KIV/reject behaviour re-confirmed against a real build, etc.) so the published page doesn't drift
from this document.

## Why this flow matters

Brand-new BackOffice module, no prior version to compare against. This is the
first written record of its structure — the SRD (`lib/ticketStudies.ts`, key
`EAINT-12028`) states the business rules; this file records the concrete
pages, DOM, and branching the mockup demonstrates so the eventual automation
doesn't start from a blank page.

## Entry points

- **Verified (mockup)**: BackOffice Home → Reports menu → "Association
  Payment Listing" (new item, bold, green "NEW" badge) → Summary page.
- No other entry point is shown or implied anywhere (no direct deep-link from
  a transaction listing, no email/notification trigger).

## Page map

Three pages, one `id="page"` div each, shown/hidden via a `.page.active`
class toggle (`show(id)` in the mockup — a single-page app, not real page
navigations. **Unconfirmed whether the real build is also SPA-style or does
full page loads** — flag this before writing a Playwright waiter around it.)

| Page | `id` | Reached via |
|---|---|---|
| BackOffice Home | `#home` | default |
| Summary | `#summary` | `showSummary()` |
| Details (one month) | `#details` | `showDetails(m)` from a Summary row's View link |

Breadcrumb on both Summary and Details: `Home › Reports › Association Payment
Listing` (Details appends `› <Month> <Year>`).

## Summary page — DOM and behaviour

- Filters bar: `#sel-year` (year `<select>`, mockup only has 2026 hardcoded —
  SRD REQ-002 says years from 2026 onward), `#sel-role` (**mockup-only** role
  switcher explicitly labelled "mockup display only — real system determines
  role by login ID" — do not expect this dropdown in the real build), Search
  button (`applySearch()`).
- Summary table `#tbl-summary`, columns in order: `#`, Month, Car
  Transactions, Cars (RM), Motorcycle Transactions, Motorcycles (RM), Drafter
  Status, Reviewer Status, Approver Status, Payment Date, Action (View link,
  `<a class='view' onclick='showDetails(m)'>View »</a>`).
- Footer row label switches between **"YEAR TO DATE (Jan–Jun)"** (partial
  year) and **"FULL YEAR TOTAL"** (all 12 months have data) — not mentioned in
  the SRD at all. Worth a test case: confirm the label is correct for
  whichever year/month-count is live.
- A month with no data yet shows "No data" **only in the Drafter Status
  cell**; every other cell in that row (transaction counts, amounts, other
  status columns, payment date, action) shows a plain `-`. SRD REQ-004 just
  says "months with no data show 'No data'" without specifying which cell —
  the mockup's placement is a concrete UI detail to check against once built.
- Status pills: `pill2 pending|approved|kiv|review` — grey/green/amber/red.
  Class map: `Pending→pending, Approved→approved, KIV→kiv, Review Again→review`.

## Details page — DOM and behaviour

Two `.wf-bar` divs stacked: `#wf-bar` (role tag, 3 status pills, Finance
Payment Date tag if set, action buttons, contextual note) and `#inv-bar`
(payment-request download buttons or a pending note).

- **Vehicle Breakdown by State** table `#tbl-veh` — header literally reads
  "PEN & E. MALAYSIA" for the state column (not "State"). Columns: `#`,
  state, Car Transactions, Cars (RM), Motorcycle Transactions, Motorcycles
  (RM). 16 rows + a TOTAL footer row.
  - **State display order in the mockup is NOT the SRD's numeric 01–16
    order** — it's roughly alphabetical (Johor, Kedah, Kelantan, Melaka,
    Negeri Sembilan, Pahang, Perak, Perlis, Pulau Pinang, Sabah, Sarawak,
    Selangor, Terengganu, KL, Labuan, Putrajaya), even though each state's
    own parenthetical code (01–16) matches the SRD. **Unconfirmed which
    order the real build uses** — don't assume alphabetical when writing a
    row-order assertion; check the live page first.
  - Amount formula confirmed matching SRD: Cars (RM) = car transaction count
    × RM1 (FMC rate); Motorcycles (RM) = motorcycle count × RM2 (MMSDA rate).
  - Footnote in the mockup: "Motorcycle figures are sample/placeholder data
    for layout illustration only" — the mockup's own bike numbers are not
    meaningful test-expectation data, just layout filler.
- **Audit Log** table `#tbl-log` — columns `#`, Date/Time, Role, Action/
  Status, Remarks. Empty state: "No activity yet." Matches SRD REQ-015.

## Workflow decision points (mockup logic — matches SRD REQ-009–012, adds detail SRD doesn't)

Role for the session comes from `curRole` (in the real system, from login
ID per SRD REQ-003 — the mockup's role dropdown is a stand-in for that).

- **Drafter** can act (Approve or KIV) whenever `drafter` status is
  `Pending`, `Review Again`, **or `KIV`** — i.e. clicking KIV does NOT lock
  the Drafter out. The Drafter can KIV repeatedly or flip to Approve at will;
  KIV never blocks re-attempting. This answers the open question from the
  initial ticket study ("what happens after Drafter clicks KIV") — **mockup
  behaviour only, not SRD-stated, re-confirm once live.**
- **Reviewer** can act only when `drafter === 'Approved'` AND reviewer status
  is `Pending` or `Review Again`. Reject requires mandatory remarks
  (`askReject()` blocks submit with an empty textarea) and sets
  `reviewer='Pending'`, `drafter='Review Again'` — sends it back one full
  step, matching SRD REQ-011.
- **Approver** can act only when `reviewer === 'Approved'` AND approver
  status is `Pending` or `Review Again`. Reject sets `approver='Pending'`,
  `reviewer='Review Again'` — matches SRD REQ-012. Approve triggers the
  Finance Payment Date modal before finalising.
- Disabled buttons carry a contextual note explaining why (e.g. "Waiting for
  the Drafter to approve first.", "Drafter has already approved this month.
  Waiting for the Reviewer.") — good candidate text for a "waiting note"
  assertion once built, though exact wording may change.

## Modals

| Modal | `id` | Trigger | Key behaviour |
|---|---|---|---|
| Reject remarks | `#rmk-modal` | Reviewer/Approver Reject | `#rmk-text` textarea; submit blocked with `alert('Remarks are required to reject.')` if empty |
| Finance payment date | `#date-modal` | Approver Approve (after signature) | `#pay-date` (`type=date`), `onkeydown="return false"` + `onpaste="return false"` block manual entry; `min` set to tomorrow; submit re-validates `date <= today → alert('Payment date must be a future date.')` — matches SRD REQ-013 exactly, including the date-picker-only restriction |
| Signature | `#sig-modal` | First-ever approval by a role | `#sig-pad` `<canvas>`, mouse+touch drawing; `signatures[role]` stored client-side and silently reused on every later approval by that role — modal never reappears once signed once, matches SRD REQ-014 |

Approve sequence for Drafter/Reviewer/Approver is always
`ensureSignature(role, callback)` first (signs once, then runs callback) —
Reviewer/Drafter don't get the payment-date step; only Approver's callback
also calls `askDate()` before finalising.

## Payment Request generation

- Only rendered once `isFullyApproved(m)` (`drafter && reviewer && approver`
  all `'Approved'`) — before that, `#inv-bar` shows only the pending note
  from SRD REQ-016 verbatim.
- **Download is not role-restricted.** REQ-016 gates the buttons on the
  month's approval state only, never on who's logged in. The mockup's own
  source comment confirms the intent: `// Invoice bar - shown for ALL roles
  on details; downloadable once fully approved` (line ~508). So Drafter,
  Reviewer and Approver can all see and download both PDFs once the month
  is fully approved — nothing limits it to just the Approver. [confirmed:
  mockup source comment + SRD REQ-016 silence, 2026-09-14 — re-check once
  the real build is reachable, this is inferred from a mockup, not a
  standalone SRD line.]
- Two buttons: "FMC Payment Request" (`downloadInvoice(m,'Cars')`), "MMSDA
  Payment Request" (`downloadInvoice(m,'Motorcycles')`).
- Filename: `Payment Requisition_<FMC|MMSDA>_<Month> <Year>.pdf` — matches
  SRD REQ-016's example exactly. **Note: the mockup actually generates an
  HTML file with a `.pdf` extension (a `Blob` of type `text/html`), not a
  real PDF** — purely a mockup shortcut; the real system must generate an
  actual PDF.
- Generated document layout matches SRD REQ-017/018/019's field mapping
  closely, EXCEPT: **the mockup's own "Pay to" table renders every value cell
  empty** (Account Holder Name, Address, Bank Name, Bank Account No., Person
  in charge, Contact Number, Email Address are all blank `<td></td>`) — the
  SRD's fixed values for these fields (e.g. FMC's Alliance Bank a/c
  1404-6001-0016-661) are NOT reproduced in the mockup's generated document.
  Treat the SRD field-mapping tables as authoritative for these fixed values,
  not the mockup's generated file.
- **Role → real name mapping, confirmed via the mockup's hardcoded
  "Prepared/Checked/Approved by" names** (useful alongside SRD REQ-003's
  username mapping):
  - Drafter → "Muhammad Fared" (username `mfared` per SRD)
  - Reviewer → "Nurul Saadiah" (username `eautonurul` per SRD)
  - Approver → "Chia Ket Ming" (username `kmcheah` per SRD)
  - `eautozara` and `mfizni` (the other mapped usernames) have no real name
    shown anywhere in the mockup — still unconfirmed.
- "Requestor" and "Date" fields in the mockup are populated from the
  Approver's own approval date / a hardcoded name, not dynamically from
  whichever Drafter actually approved — **mockup shortcut only**; SRD
  REQ-018/019 clearly state Requestor = "full name of the Drafter who
  approved" (a real per-month value), so don't take the mockup's hardcoding
  as the intended real behaviour.

## Preconditions and test data

- Nothing exists yet — no environment assigned (see
  `_reference/tickets/EAINT-12028/Session-Handoff-2026-09-02-12028.md`).
- Seed/sample data in the mockup (2026 Jan–Jun, various workflow states; 2025
  full year, all fully approved) is illustrative only — not real transaction
  counts, and Motorcycle figures are explicitly flagged placeholder.

## Traps (mockup-derived, re-confirm once live)

- The "Role" selector on Summary is **mockup-only** — don't expect it in the
  real page; role there comes from the logged-in account. Building automation
  against multiple roles means logging in as different mapped users, not
  switching a dropdown.
- State breakdown row order may not match the SRD's numeric 01–16 sequence —
  verify the real order before hardcoding row-position assertions.
- The generated "PDF" is an HTML blob in the mockup; don't assume the real
  file will render/parse the same way a true PDF would.
- Footer total-row label changes wording depending on whether all 12 months
  have data — a naive assertion on one fixed label text will break depending
  on which month range is being viewed.

### Traps added 2026-10-28 (pipeline study + related history)

1. **No-role user: menu visible or hidden is not settled.** The dev guide expects the menu link visible and the module to 403 (see **QA Test Guide**, test accounts, above). Past BO report tickets expected the opposite: ""JomCheck Report Listing" will be hidden for not authorized user" `[EAINT-8638 sheet "Authorized Users" R14, via _reference/tickets/Studying/EAINT-12028/EAINT-12028-related-history.md]`; "Bypass Purchase SSM (STMS & eSTM) Audit Log will be hidden for not authorized user" `[EAINT-9842 sheet "Permission" R6, same file]`. Do not copy the past **hidden** expectation into 12028 TS until the BA answers `[unconfirmed]`. `[source: pipeline EAINT-12028, Scribe related history, 2026-10-28]`
2. **Cross-check report is Super Admin only.** REQ-004 — monthly figures checked against **Transaction Summary Report (State)**. Access table row: "Transaction Summary Report (State) | ✔ | ✘ | ✘" `[EAINT-10038 sheet "access ref" R23, via EAINT-12028-related-history.md]`. The cross-check likely needs a Super Admin login, not one of the five role logins `[unconfirmed]`. `[source: pipeline EAINT-12028, Scribe related history, 2026-10-28]`
3. **Sample requisition xlsx is not the expected result; SRD v1.1 is.** Sample differs from SRD:
   1. **Attn:** sample FMC "Attn: | Justin Ng" (R8) vs SRD v1.1 §2.2.10 row 4 "Attn | Fixed | Marie Ann"; revision log "Attn confirmed as "Marie Ann"" (Appendix rows 22-23).
   2. **FMC account holder:** sample "FED OF MOTOR & CREDIT COMPANIES ASSO MSIA" (R20) vs SRD row 10 "FED OF MOTOR & CREDIT COMPANIES ASSO MSI (PPM-001-14-11041979)". Which text the PDF must show is open with the BA `[unconfirmed]`.
   3. **Month language:** sample MMSDA "eAUTO PAYMENT TO MMSDA ⏎ MEI 2026" (R14, Malay) vs SRD §2.2.11 row 9 "The record month, English short form. Format: MON YYYY (e.g. MAY 2026)".
   `[from ticket EAINT-12028: Sample ASSOCIATIONS PAYMENT REQUISITION_20260728-text.md; SRD v1.1 §2.2.10, §2.2.11, Appendix]` `[source: pipeline EAINT-12028, Scout study, 2026-10-28]`
4. **Finance role existed only in SRD v0.1.** v0.1: "The Finance role (user ID: eautoaccount) can view the summary and details but has no workflow actions." `[SRD v0.1 §2.2.9 REQ-016 — Finance view-only]`. Removed in v0.2: "Removed Finance-related handling; refined details and renumbered Requirement IDs." `[SRD v1.1 §1.3 row 0.2]`. REQ-016 in v1.1 is a different requirement (download gating) — do not mix the two numbers. Whether the build still grants `eautoaccount` any access is unchecked; worth one negative check `[unconfirmed]`. `[source: pipeline EAINT-12028, Scout study, 2026-10-28]`
5. **Closed month with zero transactions: "No data" or "0.00" is not settled.** SRD v1.1 §2.2.5 REQ-004 — monthly rows & amounts: "Months with no data show "No data"." `[from ticket EAINT-12028, SRD v1.1 text copy line 135]`. The dev guide (see **QA Test Guide** above) splits it: **"–" not yet closed** vs **"0.00" closed, no data**. The mockup shows "No data" in the Drafter Status cell only (see **Summary page — DOM and behaviour**). Hold the expected text until the BA answers `[unconfirmed]`. `[source: pipeline EAINT-12028, Elf scenarios, 2026-10-28]`
6. **Signature once per role or once per person is not settled.** SRD v1.1 Assumption 3: "Each role signs once; the signature is stored and reused for all future approvals." REQ-014 — on-screen e-signature: "Capture an on-screen signature on a role's first approval; store and reuse it for future approvals." `[from ticket EAINT-12028, SRD v1.1 text copy lines 87, 153]`. The dev guide (see **QA Test Guide**, test accounts, above) says per person, and `mfizni` (all three roles) shows one signature in all three blocks. The case that tells them apart is `mfizni`: per role = pad 3 times, per person = pad once `[unconfirmed]` until the BA answers. `[source: pipeline EAINT-12028, Elf scenarios, 2026-10-28]`
7. **Audit Log action wording: SRD and mockup differ (added 2026-10-29).** SRD v1.1 REQ-015 — audit log, Example 4: "Log "Reviewer — Rejected (returned to Drafter)"". Mockup 31.07 page script line 522: "Rejected — returned to Drafter" (line 524 "Rejected — returned to Reviewer", lines 519/521/523 "Approved (signed)"). The TS follow the SRD wording; open with the BA `[unconfirmed]`. `[source: pipeline EAINT-12028, Scribe related history + Elf scenarios, 2026-10-29]`
8. **Hidden Finance view in the mockup (added 2026-10-29).** Mockup 31.07 page script line 490: "View only. No approval action is required for Finance." The Role dropdown has no Finance option and SRD v1.1 REQ-003 — role by user ID maps no Finance user, so this is a leftover of the v0.1 Finance role (trap #4 above) `[unconfirmed]`. Write no TS from it. `[source: pipeline EAINT-12028, Scribe related history, 2026-10-29]`
9. **Payment date popup may not be automatable as a person would (added 2026-10-29).** In the mockup `#pay-date` is a native `type=date` field with typing and pasting blocked (see **Modals** table above). A native browser calendar cannot be clicked by Playwright, and `.fill()` skips the keyboard block, which the playbook forbids for date fields ("Never `.fill()` a readonly date field" — `knowledge/automation-playbook.md`, data-search rule 2). If the live field is the same, every Approver approve TS needs either a fill() exception from Faizuddin or stays manual; Dwarf asked him on 2026-10-29 and it is open `[unconfirmed]` until the live page is captured. `[source: pipeline EAINT-12028, Dwarf chat, 2026-10-29]`
10. **No-role user clicking the menu link: expected 403 text (added 2026-11-02).** Dev guide: "Use a core account that has no Association Payment role mapped. Expect: <b>403</b> "No access to this module" — the SSO hand-off itself succeeds (real login), only the module authorization fails." `[_reference/tickets/EAINT-12028/EAINT-12028-artifact-qa-test-guide-from-dev.html line 419]`. Applies only if the link is shown at all (trap #1, open with the BA). No source names which BO login to use as the no-role user, and no source gives passwords for the 5 role logins `[source: pipeline EAINT-12028, Scribe chat, 2026-11-02]`.
11. **Role logins share one password (added 2026-11-02).** The 5 role logins (`mfared`, `eautozara`, `eautonurul`, `kmcheah`, `mfizni`) all use the same password; Faizuddin gave it and asked for it to be prefilled on the runner `[Faizuddin, dashboard chat to Dwarf, 2026-11-02]`. The password is **not** written here; it lives only in the runner defaults (`app/eauto/12028/Runner.tsx`). Which environment it is valid on is not stated `[unconfirmed]`. Still no named login for the **no-role BO user** or **Super Admin**.
12. **No-role BO user = `onghongkee` (added 2026-11-02).** "use onghongkee" `[Faizuddin, dashboard chat to Scribe, 2026-11-02]`, a Hub Admin BO login, not one of the 5 role logins in SRD v1.1 REQ-003 — role by user ID. Source of the login: "Login as Back Office | onghongkee | Ensure that the account have the same access as Hub Admin" `[EAINT-10038 Super Admin role, sheet "Test Scenario" R2, via Scribe chat 2026-11-02]`. Same password as the role logins: "it uses the same password as the others also" `[Faizuddin, dashboard chat to Scribe, 2026-11-02]`. EAINT-10038 also tested deactivating this account, so check it is active on the test env first `[unconfirmed]`. TS text keeps the role name **BO user with no Association role**; the login lives on the runner. **Super Admin** login still not named.

## Mockup click-through (2026-10-29)

`[verified: Playwright click-through of _reference/tickets/EAINT-12028/association-payment-listing-mockup_20260731.html, page reloaded between runs to reset the seed states, 2026-10-29]` Mockup behaviour only; re-confirm on the real build.

1. **Buttons per role:** each role sees only its own two buttons, always shown, greyed out (`disabled`) when locked. Drafter = Approve + KIV. Reviewer = Approve + Reject. Approver = Approve + Reject. No role ever sees another role's button (Approver/Reviewer never see KIV; Drafter never sees Reject).
2. **Notes under the buttons, verbatim:**
   1. Drafter locked: "Drafter has already approved this month. Waiting for the Reviewer." — shown even on a fully approved month.
   2. Drafter on Review Again: "Returned for the Drafter to review the amount again."
   3. Reviewer before Drafter approves: "Waiting for the Drafter to approve first."
   4. Reviewer after approving: "Reviewer has already approved. Waiting for the Approver." — shown even on a fully approved month.
   5. Reviewer on Review Again: "Returned by the Approver for the Reviewer to review the amount again."
   6. Approver before Reviewer approves: "Waiting for the Reviewer to approve first."
   7. Approver on fully approved: "Fully approved."
3. **Messages, verbatim:** empty signature pad (also after Clear): "Please provide your signature."; blank or spaces-only remarks: "Remarks are required to reject."; no payment date: "Please select a payment date."; today or past date: "Payment date must be a future date."
4. **Signature:** title per role ("Sign to Approve — Drafter/Reviewer/Approver"). Cancel closes it, status unchanged. Second approval by the same role: no popup. Approver: signature is saved before the date popup, so Cancel on the date popup still keeps the signature; the next Approve goes straight to the date popup. **TS must include this case; it stays off the Miro board** ("wont include in miro, but make sure its in test script" `[Faizuddin, Claude session, 2026-10-29]`). Suggested TS: Approver signs, cancels the Finance Payment Date popup → status stays Approved / Approved / Pending, no audit row; Approver clicks Approve again → date popup opens directly, no signature popup.
5. **Payment date popup text:** "Select the date when Finance needs to make the payment. Only a future date is allowed. Select from the date picker only — typing or pasting is disabled." Typing gives an empty field. `min` = tomorrow. Cancel: status unchanged.
6. **Reject chain:** Approver reject → Approved / Review Again / Pending; Reviewer can act again, Drafter and Approver locked. Reviewer rejecting that Review Again month → Review Again / Pending / Pending (back to Drafter).
7. **KIV:** Drafter can KIV again from KIV (status stays KIV, new audit row) and from Review Again. Audit action texts: "KIV", "Approved (signed)", "Rejected — returned to Drafter", "Rejected — returned to Reviewer"; Approver row remark "Finance payment date: dd-mm-yyyy".
8. **Listing:** year dropdown has 2026 only (2025 data is seeded but cannot be reached). Months with no data: "-" in every cell, "No data" in Drafter Status, no View link. Footer "YEAR TO DATE (Jan–Jun)". Payment Date column fills after Approver approve.
   Summary footnote, verbatim: "Cars and Motorcycles are counted separately (transaction values are not combined across vehicle types). Months with no data yet are marked "No data"." `[association-payment-listing-mockup_20260731-text.md line 124, via pipeline EAINT-12028 Scribe related history, 2026-10-29]`
9. **Downloads:** shown to all three roles once fully approved; files `Payment Requisition_FMC_February 2026.pdf`, `Payment Requisition_MMSDA_February 2026.pdf`. Before that: "Payment Request documents will be available for download once the Drafter, Reviewer and Approver have all approved."

## Live build captures (staging uat1, 2026-11-02)

`[verified: _reference/html/eauto/bo-association-payment-listing-summary.html + _reference/html/eauto/bo-association-payment-listing-details-sep-2026-approver-not-turn.html, captured by Faizuddin 2026-11-02]` First real-build pages. Where they differ from the mockup sections above, these win for the build. Details capture = September 2026, all Pending, logged in as the Approver ("Chia Ket Ming"), not its turn.

1. **Separate app under /backoffice.** Header name `span.who-name`; Logout is a POST form `#logout-form` to `/backoffice/logout`, comment "invalidates THIS session only" (details capture lines 23–25). Switching roles must also end the /backoffice session, not only core `[Faizuddin, dashboard chat to Dwarf, 2026-11-02]`.
2. **Back to Summary** is a link: `<a class="btn secondary" href="/backoffice/admin/association?year=2026">← Back to Summary</a>` (line 91).
3. **Status pills:** `#pill-drafter`, `#pill-reviewer`, `#pill-approver`; text reads "Drafter: Pending" style, not "Drafter Status:" (line 102 and Faizuddin's note to Dwarf).
4. **Not your turn = buttons not rendered at all** (not greyed). Page comment: "render ONLY the block for the role that is CURRENTLY actionable for this login" (line 111). Shows `#wf-not-your-turn` "You hold APPROVER for this module, but it is not your turn yet." (line 126) and "Awaiting the next role in the approval sequence." (line 132). Mockup click-through #1 (always shown, greyed) does not hold on the build.
5. **Download area** is `#pdf-bar` (line 138), not the mockup's `#inv-bar`. Pending note: "Payment Request documents become available for download once the Drafter, Reviewer and Approver have all approved." (line 141); SRD wording "will be available" differs — Faizuddin is checking with the SA, do not change TS or code yet `[Faizuddin, dashboard chat to Dwarf/Elf, 2026-11-02]`.
6. **State names** upper case with code: "JOHOR (01)" (line 156), e.g. "WILAYAH PERSEKUTUAN KUALA LUMPUR (14)".
7. **Audit log:** columns When, Actor, Role, Action, Payment Date, Remarks (line 302); empty text "No workflow actions recorded yet." (line 306).
8. **Reject popup:** `#rmk-submit` "Submit Reject" starts `disabled` (line 328) and enables only when `this.value.trim().length` is above 0 (line 387), so blank and spaces-only remarks cannot submit. No "Remarks are required to reject." message on the build (mockup click-through #3 does not hold).
9. **Payment date popup:** `<input type="date" id="pay-date" onkeydown="return false" onpaste="return false">` (line 335) — a native date field, typing and pasting blocked; `min` = local tomorrow (line 398); Confirm with no date: alert "Please pick a future payment date." (line 403), not the mockup's "Please select a payment date.".
10. **Summary columns:** #, Month, Car Transactions, Cars (RM), Motorcycle Transactions, Motorcycles (RM), Drafter Status, Reviewer Status, Approver Status, Payment Date, Action (summary capture lines 95–99). "No data" vs "-" for empty months is being checked with the SA `[Faizuddin, 2026-11-02]`.
11. **Summary page behaviour (added 2026-11-02).** `#sel-year` has `onchange="this.form.submit()"`: choosing a year reloads the page, and the red [Search] button is only there once the reload ends `[Faizuddin, dashboard chat to Dwarf, 2026-11-02, citing bo-association-payment-listing-summary.html]`. After a Drafter approve and a Drafter KIV the page shows, per Dwarf's reading of the capture: figures with comma separators ("1,009"), total row label "YEAR TO DATE TOTAL", `#count-container` "12 record(s) in total" (all 12 months counted, even unclosed ones), and "-" in every column, Action included, for months not closed `[source: pipeline EAINT-12028, Dwarf chat, 2026-11-02, _reference/html/eauto/bo-association-payment-listing-summary-after-ts20-ts21-2026-11-02.html]`.
12. **Live Audit Log on Details (added 2026-11-02).** Title "(3)" with 3 rows; columns When, Actor, Role, Action, Payment Date, Remarks; **newest row first**. Cells read "02 Nov 2026 15:36", "Muhammad Fared", "DRAFTER", "APPROVE" (also "KIV", "UNDO KIV"; the Actor can be an upper-case name such as "EAUTO ZARA"). Details total row reads "TOTAL" `[source: pipeline EAINT-12028, Dwarf chat, 2026-11-02, _reference/html/eauto/bo-association-payment-listing-details-sep-2026-approver-audit-log-3-rows.html]`.
13. **Undo KIV exists on the live build (added 2026-11-02).** On a Drafter KIV month the Drafter sees one button only: `<button class="abtn kiv" id="btn-drafter-undo-kiv" … onclick="submitAction('DRAFTER','UNDO_KIV')">Undo KIV</button>`, no Approve and no KIV, no `#wf-not-your-turn`. Note under the bar: "Kept in view by the Drafter — halted. The Drafter can Undo KIV to resume." `[_reference/html/eauto/bo-association-payment-listing-details-oct-2026-drafter-kiv-undo-kiv.html]`. The Approver sees the same note on that month instead of "Awaiting the next role in the approval sequence." `[_reference/html/eauto/bo-association-payment-listing-details-oct-2026-approver-drafter-kiv.html]`. Page comment: "EAINT-12028: a KIV month is resumed only by its Drafter, via Undo KIV." What the page shows after the click is not captured, and the BA has not confirmed Undo KIV `[unconfirmed]`. `[source: pipeline EAINT-12028, Dwarf chat + Elf help, 2026-11-02]`
14. **Expected results follow the SA mock-up for UI wording, with two exceptions (2026-11-02).** "i want you to follow the current expected results, because the current one is the one based on mockup by SA" `[Faizuddin, dashboard chat to Dwarf, 2026-11-02]` — so Role is "Drafter", Action is "Approved (signed)", When is "DD-MM-YYYY HH:mm" and empty cells show "-"; live differs on all of these. Exceptions: "for the Actor column in the audit log and for the status (pending/approved) these ones doesnt need to follow exactly like the mockup, since the mockup is incorrect for these part only. any other parts, i will tell you in the future" `[Faizuddin, dashboard chat to Dwarf, 2026-11-02]`. Two QA-Issues raised under the ticket, both Low, developer Shane: EAINT-12738 (Role and Action wording in capitals) and EAINT-12739 (When date format) `[source: pipeline EAINT-12028, Scout chat, 2026-11-02]`. Whether "Approved (signed)" also applies to the Reviewer and Approver rows is open with the BA `[unconfirmed]`.
15. **Workflow TS use up months on a shared test env (added 2026-11-02).** On staging uat1 the 12028_TS20 run left September at Drafter Approved and the 12028_TS21 run left October at Drafter KIV, so 12028_TS23 (needs a Drafter Review Again month) stopped at its precondition `[source: pipeline EAINT-12028, Elf findings, 2026-11-02]`. Pick or prepare a fresh month per TS (the 12028_PREP setup moves a month).
16. **Empty Audit Log cells on the live build (added 2026-11-03).** A "Drafter — KIV" row (dated 03-11-2026) has empty **Remarks** and **Payment Date** cells; the script expected "-" for both `[source: pipeline EAINT-12028, Elf findings, 2026-11-03, job 20261103-173701-EAINT-12028-elf-findings-60f1]`. The mock-up Audit Log has 5 columns (No., When, Role, Action, Remarks) and renders an empty Remarks as "-": `(e.remarks||'-')` `[_reference/tickets/Studying/EAINT-12028/association-payment-listing-mockup_20260731.html line 548]`. The live build adds a Payment Date column the mock-up does not have, so "-" for Payment Date has no source `[unconfirmed]`. Faizuddin's earlier rule is that empty fields should show "-" (item 14). Whether this is a defect is open with the BA; EAINT-12738 and EAINT-12739 do not cover these two cells.

## Notes per role and state after the 2026-11-04 deploy

`[verified: Claude-driven run on uat1, 2026-11-04, evidence _reference/tickets/EAINT-12028/claude-run-2026-11-04/12028_TS25, TS28, TS35, TS49]`

1. **`#wf-not-your-turn` is gone.** Neither "You hold <ROLE> for this module, but it is not your
   turn yet." nor "Awaiting the next role in the approval sequence." appears any more. When it
   is not the user's turn, `#action-panel` has no buttons and `#ap-note .ap-note-text` reads:

   | Month state | Reviewer sees | Approver sees | Drafter sees |
   |---|---|---|---|
   | Pending / Drafter Review Again | "Waiting for the Drafter. You can act once the Drafter has approved." | "Waiting for the Drafter." | (Drafter's turn) |
   | KIV | "On hold. The Drafter put this month in KIV on <dd-mm-yyyy>. Nothing to do until the Drafter resumes it." | same | — |
   | Drafter Approved | (Reviewer's turn) | "Waiting for the Reviewer. You can act once the Reviewer has approved." | "Waiting for the Reviewer." |
   | Reviewer Approved | — | (Approver's turn) | "Waiting for the Approver." (survey, `mfared` on Jan) |

2. **Approver's turn (Reviewer Approved):** [Reject] [Approve], note "Your turn as Approver.
   Approve and pick the Finance payment date, or Reject with remarks to return it to the
   Reviewer."
3. **`#pdf-bar` pending note** still reads "Payment Request documents become available for
   download once the Drafter, Reviewer and Approver have all approved." The SRD says "will be
   available"; this is still open with the SA.
4. **Effect on the tests:** the TS expected results for TS25, TS28, TS33 (Reviewer),
   TS35 and TS49 use the pre-2026-11-03 wording. Whether to update the TS or raise the build is
   Faizuddin's call `[open]`.
5. **Undo KIV restores the state the month had before the KIV.** Pending → KIV → Undo returns
   Pending (October, February, April); Drafter Review Again → KIV → Undo returns Review Again
   (January; the KIV note already says "Undo KIV to bring it back to Review Again"). Any Drafter
   can undo another Drafter's KIV. So the only source of a fresh Pending month is a
   newly closed month or a developer reset.
   `[verified: Claude run uat1 2026-11-04, TS23 + SETUP-01..04]`
6. **BO → module hand-off (SSO):**
   - `GET /uat1/api/admin/backoffice/auth-redirect.do?module=association&target=LISTING` →
     302 → `/backoffice/public/auth/token?r=%2Fadmin%2Fassociation&t=<JWT>` → 302 →
     `/backoffice/admin/association`.
   - The JWT (HS256) carries `sub` (`99000/<login>`), `mod`=ASSOCIATION, `name`, `ourl`
     (the BO base), `jti`, and `iat` / `exp` about 45 s apart.
   - A used token does not open the module again.
   - `r=` pointing at an outside site gets the page "Invalid redirect target".
   - `target=` set to an outside URL is ignored when logged in.
   - **When the BO session is gone, `auth-redirect.do` shows a bare "Unauthorized" (401) page
     instead of the BO login** (TS59, TS60, TS63).

   `[verified: Claude run uat1 2026-11-04, 12028_TS59 / TS60 / TS63]`
8. **Session idle timeout (Details page).**
   - The server config is in `#session-cfg`: on uat1 `data-idle="900"`, `data-warn="120"` and
     `data-ping="30"`, i.e. a 15-minute idle timeout, a warning popup `#idle-modal` from 13
     minutes, and a keep-alive every 30 s.
   - The keep-alive is `GET /backoffice/admin/association/keepalive`, sent only after real
     activity (click / keydown / scroll; "AC7").
   - The popup's "Stay signed in" (`staySignedIn()`, "AC8") pings at once.
   - The script has no redirect of its own when the timeout passes; what the user sees comes
     from the next request.
   - The Summary page has no `#session-cfg`.

   `[verified: page script on uat1, 2026-11-04]`
7. **Action form:** every Details page, even one with no buttons for the user, has `#wf-form`
   POST `/backoffice/admin/association/<year>/<month>/<uuid>/action`. Its fields are
   `_csrf`, `role`, `action` (APPROVE / REJECT / KIV / UNDO_KIV), `version` (optimistic
   lock), `remarks`, `paymentDate` (YYYY-MM-DD) and `signatureDataUrl` (PNG data URL, sent
   only the first time).
   - The server enforces the order: a forced Reviewer approval before the Drafter's gives
     "… cannot act until the Drafter has approved."
   - A forced Approver approval before the Reviewer's gives "… cannot act until the Reviewer
     has approved."
   - A stale second submit gives "Someone else already actioned this month. Please refresh and
     try again."

   `[verified: Claude run uat1 2026-11-04, TS64 / TS65 / TS67 / TS68]`

## QA Test Guide (dev-authored, from MR !1's engineering review)

`[source: dev/engineering-authored QA test guide, artifact shared 2026-09-04, saved verbatim at
_reference/tickets/EAINT-12028/EAINT-12028-artifact-qa-test-guide-from-dev.html — built from SRD
v1.1 plus a 2026-09-04 engineering review of eauto-backoffice MR !1 (dev/feat/EAINT-12028 -> main).
This is the first concrete evidence the module has actually been built past mockup stage — it
describes a real running app across 3 services, not the Reports-menu mockup above.]`

**As of 2026-09-04, this is NOT ready for staging.** MR !1 (129 files, +10,920, 40 commits) carries
a ⛔ BLOCK code-review verdict: 1 blocker, 2 high, 7 medium findings (13 more lower-severity items
deferred). A fix pass for all 10 blocking findings was actively in progress at capture time
(8 of 10 coded). Two of the ten are directly test-relevant and get their own security cases below:
**H1** (a role from one BackOffice module could authorize a different module's pages) and **H2**
(an open redirect on session-expiry/logout). Re-test both once the fix CR lands — don't trust a
pre-fix build's behaviour on them. Full deploy checklist (settings keys on all 3 core editions,
shared `X-API-KEY`, browser-resolvable base URLs, one-time DB migration, `eauto-cron`'s own
`dev/feat/EAINT-12028` branch merged) also needs to be confirmed done before this can go to staging.

**System shape** (new information — supersedes the mockup's "unconfirmed SPA vs full-page" question
for the real build): three services, not one page. `eauto` core (entry point, hosts the Reports
menu) hands off via SSO to `eauto-backoffice` (renders Summary/Details — never log in there
directly, only ever arrive via the core menu link), and `eauto-cron` runs the month-close job.
Local dev ports: core `http://localhost:8080/eauto`, backoffice `http://localhost:8095/backoffice`
— **dev-box addresses, not a SIT/UAT/PREPROD URL**, so the open item "which environment is this
tested on" is still open; this only tells us the topology once an environment exists. Shared
dependencies: `eauto-mysql` (this module has no DB of its own) and `minio` (S3-compatible object
storage for signatures + PDFs).

**Test accounts, same mapping as the SRD, plus what to specifically exercise with each:**
- `eautozara`, `mfared` — Drafter: first-approval signature capture, KIV, Reject-back-to-Drafter
  re-entry.
- `eautonurul` — Reviewer: Approve / Reject-with-remarks.
- `kmcheah` — Approver: final approve + mandatory future payment date, PDF generation trigger.
- `mfizni` — all three roles: confirms **one signature is reused across all three signature blocks**
  on the generated PDF; also the fastest way to solo-walk a month through the whole workflow.
- Any user with **no** role row at all — negative case: the Reports menu link is still visible in
  core, but the module itself must 403. "Visibility ≠ authorization" is the guide's own framing.
- Signature is captured **per person, not per role** — plan test order so the pad appears exactly
  once per test user, across every month/role they touch.

**Test data is not live-computed — it comes from a month-close job.** Nothing shows on the listing
until a month is "closed": a scheduled job (or a manual trigger) freezes that month's approved
count × rate into a snapshot.
- Manual trigger for QA: `GET {eauto-cron}/eautocron/sys/manual/association-payment-month-close/{year}/{month}`
  — force-close any past month on demand instead of waiting for the real schedule.
- Machine path (what core/cron actually call): `POST /ext/association/{year}/{month}/close`
  (needs `X-API-KEY`).
- Real schedule: `eauto-cron`, 00:05 on the 1st of the month — don't wait for this in testing.
- Three states you'll see per month: **"–" not yet closed** (no snapshot, no figures, no actions);
  **"0.00" closed, no data** (closed but zero qualifying transactions — confirm workflow buttons
  still work here, don't assume zero means broken); **real figures, closed** (the main path).
- What counts toward a month's figures: approved **+ paid** STMS/eSTM/APT transactions, by
  **JPJ Approved Date** (matches the SRD decision already recorded above), grouped by the
  **dealer's registered state** (not the vehicle's plate state — new detail, not in the SRD
  excerpt studied earlier), split `CAR`+`COMM_CAR` (RM1.00 each) and `BIKE`+`COMM_BIKE` (RM2.00
  each).

**Test cases are organized 1:1 against REQ-001 through REQ-019**, each tagged P1 (core happy-path/
gate, must pass before sign-off), P2 (important edge case), or P3 (nice-to-confirm). P1s: REQ-003
(role from login ID, including a no-role user hitting the Details URL directly → 403), REQ-004
(monthly figures cross-checked against core's own Transaction Summary Report by State — a concrete
independent source to verify against, not just eyeballing), REQ-008 (16 states + TOTAL, exact
`#,##0.00` formatting), REQ-009 (sequential approval enforced **server-side**, not just
UI-disabled — try forcing the underlying request directly), REQ-013 (future-only, picker-only date;
explicitly test typed/pasted input has no effect), REQ-014 (signature shown once, silently reused
after), REQ-016 (download gated on full approval, including a direct-URL-bypass attempt → 403),
REQ-017/018/019 combined (file naming, every fixed/flexible field on both FMC and MMSDA documents,
and that a second download returns the identical archived file rather than a fresh re-render).
Full step-by-step for every REQ-ID is in the saved HTML.

**Security & session checks — not in the SRD (it's a functional spec) but flagged as
account-takeover-class, so first-class test cases:** replay a used SSO hand-off URL (expect 401
"Token already used" on reuse, never a second login); cross-app logout propagation both directions
(core logout must invalidate a live BackOffice tab; BackOffice logout must land back on core and
require a fresh hand-off); idle-timeout bounce (clean re-auth, no dead-end error page); a no-role
user's hand-off succeeding but the module 403ing; **H1** cross-module role confusion (re-test once
the fix lands — not independently reproducible with only one module live today); **H2** open
redirect on session-expiry/logout (must always land on a trusted core origin); concurrent
double-submit from two tabs as the same approving user (expect 409 on the second submit, only one
audit-log row created).

**Cross-cutting checks beyond the SRD's happy path:** month-close idempotency (close once → 200
CLOSED; close again → 200 SKIPPED_ALREADY_CLOSED with the DB row unchanged; close a not-yet-fully-
approved month → 409 SKIPPED_NOT_APPROVED, never a silent no-op or 500); storage sanity to confirm
with a dev (signature stored once per user, referenced by object key, never re-drawn; downloaded
PDFs byte-identical on repeat download — served from the archive, not re-rendered); out-of-role/
out-of-sequence actions always 403 or rejected, never a silent success, including on an
already-fully-approved (terminal) month; numbers cross-checked against core's own report as the
independent source of truth.

**Known limitations — already accepted, don't file fresh reports on these:** JomCheck (Phase 1
scope, already known); no real money movement (Finance handles disbursement outside this module,
already known); vendor bank details not editable here (already known); **a KIV'd month has no
"un-KIV" button** — same open question raised from the mockup study, now confirmed as a real known
gap (deferred item L2) needing a business decision, not a code fix; the app must run as a single
instance (in-memory session replay-guard/registry — an ops/deployment concern, not something QA
can exercise from the UI); an S3 region mismatch in the guide author's own personal test
environment (not relevant once a real environment exists); `eauto-cron`'s own
`dev/feat/EAINT-12028` branch not yet merged — if the manual month-close endpoint 404s, this is
almost certainly why.

**Bug reports should reference:** the exact REQ-ID/case or security-case name, the test user/role
logged in as, the month under test, expected vs. actual, and any console/network output — several
flows return meaningful HTTP status codes (401/403/409) worth attaching directly.

## Priority / scope discussion (source: Teams, May Chin Mei Theng ↔ Faizuddin DM, 2026-09-15/16)

- **This ticket has been deprioritized behind EAINT-12107 and a batch of four
  small "shopping cart" tickets.** May Chin's stated priority order (based on
  deployment date): 1) four shopping cart tickets deploying 21 Sept (EAINT-
  11996, 12095, 12103, 12104), 2) EAINT-12107 — TBC deployment in September,
  3) **EAINT-12028 — TBC deployment in October** `(source: Teams, May Chin Mei
  Theng, DM, 2026-09-15 09:33)`. This corrects the impression from the
  2026-09-14 session handoff that 12028 was moving toward active testing
  soon — it is now the lowest priority of the three, October at the earliest.
- **May Chin flagged a scope concern**, prompted by Faizuddin's own timesheet
  entry mentioning "20+ TS" for this ticket: *"im abit worried 12028 coz i
  doubt the scope is that small"* `(source: Teams, May Chin Mei Theng, DM,
  2026-09-15 09:30)`. Faizuddin's response, worth recording as his own
  working assessment rather than a confirmed fact: the flow itself "is not
  that long and complicated," the size comes from "multiple statuses for
  different items, so the combination is a lot" — i.e. the 20+ test-scenario
  count reflects the workflow-state combinatorics (Drafter/Reviewer/Approver
  × KIV/Reject/Approve, etc.), not scope creep beyond the SRD.
- As of 2026-09-15, **test scenarios for this ticket were still not done**;
  Faizuddin was "mapping out all the possible flows/branches" before drafting
  them, and had a Miro board already set up (from May Chin) to work from
  `(source: Teams, Faizuddin, DM to May Chin Mei Theng, 2026-09-15 09:35-
  09:37)`.
- No further discussion in the dedicated "EAINT-12028 [eAuto-BackOffice]..."
  group chat since 04/09 (reconfirmed live 2026-09-18) — this priority/scope
  exchange happened only in the May Chin DM, not the ticket's own group chat.

## ⚠️ UPDATE 2026-09-18 — deployment now being asked about same-day, not October

`(source: Teams, dedicated "EAINT-12028 [eAuto-BackOffice] New Module..."
group chat, 2026-09-18)` — the dedicated group chat, quiet since 04/09, had
one new exchange this morning that appears to move the timeline up from the
"TBC deployment in October" priority note above:

- **Mei Jia Chee, 18/09/2026 11:07**: *"hiii Nur Izfarwiza Binti Mohd Talib
  Jin Siang Boo, can help to advise this ticket can proceed morning
  deployment?"*
- **Jin Siang Boo, 18/09/2026 11:31**: *"I think should be ok"*

This is a tentative go-ahead, not a firm confirmation, and it's unclear from
the message alone whether "morning deployment" means this module is going to
a shared SIT/staging environment today or something narrower (e.g. a dev-box
push). It directly contradicts the 2026-09-15 "TBC deployment in October"
estimate from May Chin recorded above — **treat the October estimate as
possibly stale, not the current plan**, and chase a firm environment/date
confirmation before assuming this ticket is still low-priority/October-only.
The generic "eAuto Deployment Notification" Teams channel showed a
`staging/sit4` deploy succeeding around the same time window but didn't name
EAINT-12028 specifically, so this is not yet independently corroborated as
*this* ticket's deploy — flag as the next thing to verify, not an established
fact.

## What is NOT covered

- No BackOffice login/session DOM captured (the mockup starts already
  logged in as "Adrian Tan" — a demo name, not a real mapped role user; the
  QA test guide above describes the real SSO hand-off flow but no live HTML
  of it has been captured yet either).
- Still no SIT/UAT/PREPROD environment/URL — the QA test guide's URLs are a
  dev box (localhost), not a shared testing environment. This open item is
  unchanged.
- JomCheck payment listing/request — out of scope for Phase 1 entirely, not
  shown in the mockup or the QA test guide.
- Nothing about how Finance actually receives/uses the downloaded PDF
  (explicitly out-of-scope per the SRD).
- MR !1's actual code/diff was not reviewed in this session — only the
  QA test guide's own summary of the engineering review. If deeper detail
  on the 10 blocking findings is needed, ask for the review itself.

## Miro high-level flow board (added 2026-10-28)

1. **Board:** `https://miro.com/app/board/uXjVHrYDgq8=/` — "this is miro link for the high level flow graph" `[Faizuddin, dashboard chat to Scribe, 2026-10-28]`. Also logged at `_reference/miro-links.txt` lines 6 and 34.
2. **Capture:** `_reference/miro/uXjVHrYDgq8=-2026-10-28.md`. Header: "Items on board: 4 text, 2 frame, 2 mindmap, 1 table". Only the 4 text items were read; the **2 mindmaps and 1 table are not in the capture**, so the flow graph itself is still unread `[unconfirmed]` that the mindmaps hold the flow.
3. **Board notes (open items written on the board), verbatim from capture line 4:** "Notes: / - To confirm the document format for the FMC Payment Request and MMSDA Payment Request / - To confirm how to crosscheck the total number of transactions for each month for each vehicle category (currently in system no direct way to check this value) / - To confirm how to simulate cronjob". Compare with **Traps added 2026-10-28** #2 (Transaction Summary Report (State) as the cross-check source) and the dev guide's manual month-close trigger above `[unconfirmed]` whether either settles these notes.
4. **Sample frame text:** "🚗🏍 Vehicle Breakdown by State June 2026 / X record(s) in total" (capture line 3) — a heading wording seen on the board; not checked against the build `[unconfirmed]`.

`[source: pipeline EAINT-12028, Faizuddin chat to Scribe + Miro capture, 2026-10-28]`

8. **Mindmaps read 2026-10-29:** full 155-node capture at `_reference/miro/uXjVHrYDgq8=-2026-10-29-mindmaps.md`. Structure: Login > Report > Association Payment Listing → Cronjob (1 leaf) and Click View >> → Role: Approver / Review / Drafter → per status combination → button outcomes. The table under "Vehicle Breakdown by State June 2026" is an empty 6 × 18 grid. `[verified: Miro board data + screenshot, 2026-10-29]`
9. **Gaps found against this file (2026-10-29 review):**
   1. Board errors: Approver's reject popup titled "Reviewer — Reject Remarks" (fixed on the board 2026-10-29 11:55 am, now "Approver — Reject Remarks"); Approver and Reviewer locked states list "[KIV] button disabled" but not "[Reject] button disabled" — KIV line is valid, Reject line is missing; role label "Review" not "Reviewer"; Approver in "Approved / Pending / Pending" lists no disabled buttons, unlike the other states.
   2. Missing status combination: "Drafter Approved / Reviewer Review Again / Approver Pending" exists under Reviewer only, not under Approver or Drafter.
   3. Missing on the board entirely: Finance Payment Date modal on Approver Approve (REQ-013), signature Clear/Cancel/reuse branches (REQ-014), blank reject remarks, year filter + Search (REQ-002), No Data / "–" / "0.00" months, Payment Date column, pending note before full approval (REQ-016), Vehicle Breakdown values + TOTAL (REQ-008), Audit Log (REQ-015), PDF content (REQ-017–019), no-role user / `mfizni` / `eautoaccount`, security and session checks, cron manual trigger and re-close.
   `[source: comparison of the 2026-10-29 capture with this file, Claude session 2026-10-29]`

5. **What the mind maps show:** "it basically shows the possible changes in the status. and also which user can change which status" `[Faizuddin, dashboard chat to Scribe, 2026-10-28]`. The same role × status rules are in SRD v1.1 REQ-003 (role by user ID), REQ-005 (workflow status columns) and REQ-009 to REQ-012 (sequence and per-role actions) `[source: pipeline EAINT-12028, Scribe related history, 2026-10-28]`. That the board matches the SRD exactly is not checked `[unconfirmed]`.
6. **The board is not the full scope:** "btw, the miro is not complete, so we need more coverage. my lead estimates +-180 TS" `[Faizuddin, dashboard chat to Scribe, 2026-10-28]`. TS must cover all of SRD v1.1 REQ-001 to REQ-019 plus the **QA Test Guide** security, session and month-close checks above, not only the board `[source: pipeline EAINT-12028, Scribe related history, 2026-10-28]`.
7. **TS depth for this module — one TS per role per check, negatives and edge cases included:** "Basically, we need to test all possible scenarios. even negative scenarios and edge cases. for example, "TS01-Approver cannot change ....." this is not considered a TS. it should be something like "TS01-Approver unable to change... ; TS02-Drafter unable to change..." same goes for the MSCA thing or other thing. every single thing, we need the TS to be detailed" `[Faizuddin, dashboard chat to Elf, 2026-10-28]`. So a role × status check is split into one TS per role, not one TS listing several roles. **MSCA thing** is his wording; likely the association/PDF items (FMC / MMSDA) `[unconfirmed]`. This overrides the general **Sizing** advice in `knowledge/test-scripts.md` for this ticket only.

## Tab logo and header differ from core BO (2026-11-03)

1. Association Payment Listing (`/backoffice/admin/association`) shows a globe tab icon, not the eAuto logo shown on the BO home (`/uat1/home/`).
2. Its header shows only "Back to Backoffice". Other BO pages (e.g. `/uat1/view/stms/enquiry/`) show Home, Menu, user's name, My Account, Logout.
3. Expected: same logo and header as other BO pages `[Faizuddin, session chat, 2026-11-03]`. Raised as EAINT-12752 (Low, dev Shane). Evidence: `_reference/tickets/EAINT-12028/Bug - EAINT-12752/`.
4. **Developer reply, 2026-11-03** `[Jira EAINT-12752 comment, Shane]`:
   - **Favicon:** fixed and deployed to uat1. Retested 2026-11-04: **pass**. Both pages
     serve the same 34,494-byte icon `[verified: Claude run uat1, EAINT-12752-retest-favicon/]`.
   - **Header:** "expected, not a bug … the name / my account / logout are removed on purpose.
     user go back to eauto using back to backoffice, and logout from eauto also end the
     backoffice session". **No reason or source was given.**
   - Faizuddin still holds that the header itself is incorrect `[Faizuddin, session chat,
     2026-11-04]`. This blocks 12028_TS62 and the module-logout steps of TS58 `[open]`.

## Summary page rebuilt (staging uat1, 2026-11-03)

Capture: `_reference/html/eauto/bo-association-payment-listing-summary-2026-11-03.html` `[verified: live HTML from uat1, 2026-11-03]`.
1. Title is `.page-title .app-title` (a span); the `<h1 class="report-title">` is gone.
2. Header has no `span.who-name` and no `#logout-form` / `#btn-logout` (see EAINT-12752).
3. Year change and Search no longer reload: the script fetches `/backoffice/admin/association/api/summary` and redraws the table, `.header-text span` caption and `#listing-count`. `[Search]` (`#btn-search`) is disabled while loading; failure shows `#search-error` "Could not load <year>. Please try again."
4. Footer `#custom-footer` added (Contact Us, Terms & Conditions, Privacy).
5. Details page rebuilt too — capture `_reference/html/eauto/bo-association-payment-listing-details-jan-2026-drafter-turn-2026-11-03.html`: title `.page-title .app-title`; back link `a#ap-summary` "Summary"; `#wf-bar` replaced by `#action-panel`; statuses in `#chip-drafter/-reviewer/-approver .ap-chip-status`, the current role adds " · your turn"; buttons `#btn-drafter-kiv`, `#btn-drafter-approve`; note `#ap-note .ap-note-text` "Your turn as Drafter. Approve to send to the Reviewer, or KIV to put this month on hold."; `#pdf-bar`, `#tbl-veh`, `#tbl-log` and the popups unchanged. Not-your-turn wording in the new build `[unconfirmed]`.
