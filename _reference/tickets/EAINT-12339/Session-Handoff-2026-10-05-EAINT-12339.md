# Session handoff — 2026-10-05 (EAINT-12339)

Scratch note for Faizuddin to check on the morning of 2026-10-06. Not part of the
knowledge base. Durable facts written today are in `knowledge/flow-jomcheck.md`
§7s–§7z, `knowledge/automation-playbook.md` → "Searching for existing data", and
`knowledge/quirks.md` → Dates (one-month rule).

Supersedes `Session-Handoff-2026-10-04-EAINT-12339.md` (deleted with this write).
Items from that note that are still open are carried into "Carried over" below.
All TS numbers are the NEW 46-row numbering (see item 1 under "What was done").
Where this note cites §7q/§7r, those sections still use the old TS47/TS48 numbers
(read as TS44/TS45).

Sources: main session `96ca027b-49bc-4d8a-ad91-25f8d4135e91.jsonl`, 08:29–17:13
local (UTC+8); side session `57c97f31-f0f1-4114-adf8-b4c935cfa4e2.jsonl`,
11:41–15:46 local (dashboard run-configuration split, production regression
checklist, timesheet). Corroborated with `git status` and the knowledge diffs.

## End-of-day result, as stated by Faizuddin (not verified by a pasted log)

Faizuddin, 17:12: *"ts34 deprio, all the other passed"*. Read as: every TS in
the 46-row sheet except TS34 is passed, including the final re-runs whose logs
were not pasted into the session (TS27 with Find data, TS31 eSim version, TS31
existing-transaction variant, TS45 after the second locator fix). The last
pasted logs in the session are listed under "Coverage at end of day" so the
difference between seen and reported is clear.

## Open items for tomorrow morning (check these first)

1. **TS02 and TS36 crosscheck fix is parked, not applied.** Both failed in API
   mode on "Type of Claim": the listing shows "Own Damage (OD)" but the real
   ezAuto PDF prints the raw ICAP code under "Filing Category" (`1`). Automation
   assumption, not an eAuto defect. Faizuddin, 15:24: *"okay, keep that in check
   first"*. Fix when wanted: map the listing description back to the ICAP code
   (or log instead of assert) in `scripts/eauto-jomcheck/utils/pdfCrosscheck.ts`.
   Faizuddin's end-of-day statement counts them as passed; decide whether that
   stands on the API-mode run or needs a re-run after the fix.
2. **TS32 still asserts claim ENTRY order** (`tests/esim-listing-export.spec.ts`
   lines 157–159). The 10-04 fix was never applied (Faizuddin, 11:02: *"32 - let
   me run one more time and check it"*). It passed today because eSim returned
   the claims in entry order this time. It can fail again on any run. Apply the
   any-order compare when there is a quiet moment.
3. **Nothing committed.** All 12339 work (`scripts/eauto-jomcheck/`,
   `app/eauto/jomcheck/`, `app/api/eauto-jomcheck/`, `knowledge/flow-jomcheck.md`,
   `_reference/html/eauto/*`, `_reference/html/esim/*`, this folder) is still
   untracked on `staging-local`. `knowledge/automation-playbook.md` and
   `knowledge/quirks.md` are modified, not committed.
4. **Production goes live tonight** per `knowledge/flow-jomcheck.md` §1
   (v2.0 switch 05.10.2026 night, ezAuto completing 11:30pm). The read-only
   production regression checklist was drafted in chat today (see "What was
   done", item 10) and is not saved in the repo. TS46 (production verification)
   is manual.
5. **VPN cannot be switched on by automation.** FortiClient 7.2.4, tunnel
   "eAuto-VPN". Nothing built. If a status indicator is wanted, say so (options
   in "What was done", item 9).
6. **Knowledge file staleness to clean:** §7u item 6 and §7w/§7y/§7z still say
   "Not run live yet" / "Not yet run live". Per Faizuddin all of these passed
   today. See "Durable-knowledge candidates".

## What was done today

1. **Official TS is now the pasted 46-row sheet.** Faizuddin pasted the current
   sheet at 09:05 and ruled, 09:28: *"1. yes / 2. follow the pasted version /
   3. no, no need for remarks and OQ references"*. Second renumber: old
   TS40–TS42 (Service Portal counter tests) are deleted, not N/A; TS43–TS49
   moved to TS40–TS46 (TS43 API, TS44 latest report, TS45 BO filters, TS46
   production). TS01–TS39 unchanged. No Remarks column and no OQ references in
   the sheet by choice; the open questions themselves stay open. Dashboard,
   env vars (`JOMCHECK_TS43/44_VEHICLE_NO`), evidence labels renamed to match.
   The `N-EAINT-12339 … (Azila review, renumbered).xlsx` in this folder is out
   of date (49 rows). The pasted version is not saved in the repo as a file.
   Written to `flow-jomcheck.md` §7s.
2. **eAuto one-month rule.** TS37 first run searched Shared Date 05/10/2016 to
   05/10/2026 and got "Shared Date range must not exceed one month." Faizuddin,
   09:55: *"why is it 10 years. it should be 1 month only between the to and
   from. THIS IS A DEFAULT RULE FOR ALL MODULES UNLESS STATED OTHERWISE"*.
   Written to `quirks.md` → Dates and `flow-jomcheck.md` §7t. Also found: the
   To picker only re-ranges after the From picker's own onSelect runs;
   `datepicker('setDate')` bypasses it, so To was clamped to today. Dates are
   now picked through the widget (year select, month select, real day click).
   Capture: `_reference/html/eauto/service-portal-jomcheck-listing-one-month-error.html`.
3. **TS37–TS39 rebuilt as buy-and-share.** Faizuddin, 10:45: *"new update for
   TS 37-39, user will need to do Jomcheck purchase, and at this step: … Automation
   will need to select 'X STAR TECHNOLOGY MALAYSIA SDN BHD'. only after that can
   it make payment"*. Flow: eSim sets 2 claims (CATASTROPHIC + MEDIUM) → UCD
   purchase → tick X STAR under "Share Report with Financial Institution" →
   Pay Now → Service Portal (superadmin) → search Shared Date today..today →
   read the row. Capture:
   `_reference/html/eauto/ucd-jomcheck-purchase-share-list-vehicle-found.html`.
   All three passed live in the 14:01 log. Written to §7u. Faizuddin also
   asked, 10:19, whether the Service Portal should be in scope at all (*"the
   service hub one is for the service company right?"*); the reply clarified it
   is the Service Portal (bank/credit-company portal), and the counter change
   is in the SRD. He then went ahead with item 3, so TS37–TS39 stay in scope.
4. **TS45 no-match message.** First run failed on the expected text
   "0 record(s) in total" (an unverified carry-over from Azfar's 09-29 draft).
   Faizuddin, 09:48: *"it should be 'No records found. Please ensure there are
   existing JomCheck report purchase records.'"*. Spec and TS wording changed.
   Second run still failed: the locator matched the outer layout cell (BO nests
   the listing table in a layout table). Faizuddin, 14:05: *"fix for 45"*. Now
   an exact `getByText` match. Both earlier runs had steps 1–3 (disabled
   filters) passing. Written to §7q item 6.
5. **TS31 rebuilt twice.**
   1. Version 1 (11:09): search BO Transaction Enquiry for a failed transaction
      inside the test. First live run picked NH4566 / J680008308, which belongs
      to another UCD company, so the UCD listing was empty. Company filter added,
      then the whole in-test search was pulled out (see item 6).
   2. Final version (14:54): Faizuddin, *"instead of searching a transaction,
      you can make it being changing the result to 'Failed' in the eSim. the
      field is literally called 'Result'"*; 15:04: *"its a dropdown, either
      Passed or Failed … after clicking pay, it will show an error message,
      something like 'unable to generate report'. but after that, if we go to
      the listing page from UCD side, it will show payment okay, but transaction
      failed"*. The field is `select#result` (Success / Failed) on the eSim
      JomCheck REPORT record, not the Enquiry record's Yes/No. Capture pasted
      15:09: `_reference/html/esim/jomcheck-report-edit-2026-10-05.html`. Flow:
      Result = Failed → UCD buys on a fresh HX vehicle → error → UCD listing
      shows Payment OK / Tx Failed, no Report button → Result = Success + 1
      claim → buy again → old row unchanged, new row in BO listing. TS31 is now
      an eSim test (VPN, fresh vehicle no.). Written to §7y.
   3. Variant "TS31 (existing failed transaction)" (dashboard id `ts31x`,
      env `JOMCHECK_TS31X_VEHICLE_NO`): Faizuddin, 15:24: *"for TS31, can you
      just make it check whatever we can check through my current UCD and BO
      side. because i dont have the creds for the original account that made
      the failed transaction"*; 15:43: *"okay do that"*. Checks the old failed
      row from BO Transaction Enquiry / Transaction Details (any company), our
      UCD buys a new report, BO confirms old row unchanged and new row listed.
      Written to §7z.
6. **"Find data" buttons (TS27, TS31 variant).** Faizuddin, 11:41: *"the TS27
   and 32 [TS31] is taking too long. can you make for these both TS to have a
   button in their row, where it will check for available data headless and
   fast in the background. after finishing, it will display the data to be
   used, so i can copy and paste in the main handling up top in the dashboard"*.
   Built: `tests/find-pre-push-data.spec.ts` + `utils/prePushFinder.ts` +
   `app/api/eauto-jomcheck/find-data/route.ts`; row shows vehicle no., Copy,
   "Use in the field above". Rules settled during the day: one-month windows
   starting August 2026; older month only when the month is EMPTY (*"when i
   said check for the previous month, i only mean to check IF there are no
   transactions"*); TS27 checks every approved vehicle across all result pages
   (*"make the automation go through the pages it needed"*); 20 parallel
   headless tabs for TS27 (*"increase to 20 tabs. its taking too long also"*);
   both finders consider ALL companies (*"does not check for my company only"*)
   and show the company. Copy button bug fixed (12:04). Rule written to
   `automation-playbook.md` → "Searching for existing data" and memory
   `automation-data-search-rule.md`; flow in §7w. First TS27 in-test search
   log (11:24) found 14 approved vehicles in August 2026 with the first two
   (WSR3175, TBR9110) having only 2+-claim rows.
7. **TS02 and TS36 failed in API mode** (15:22 log, TS02 J600008488). Cause and
   parked fix in "Open items" item 1. Same log: TS25 (J600008489) and TS43
   passed in API mode. Earlier the same day the eSim set ran and passed, so
   staging was reached in both modes today.
8. **Evidence fixes.** (a) 11:03: run-level video duplicated the single-TS
   video (`12339_TS37` duplicate key) — route no longer re-adds it; dashboard
   keys evidence rows by URL, not label. (b) 12:07: Playwright records one
   video PER TAB; the second tab's recording (PDF viewer, TS44 second purchase)
   overwrote the first as `<TS>.webm`. Now `<TS>.webm` for the main tab and
   `<TS>-tab2.webm`, `-tab3.webm` for later tabs; `publish()` refuses duplicate
   URLs. Written to §7x.
9. **VPN question** (11:33–11:40). Faizuddin: *"is there any way for the
   automation to check and turn the VPN on by itself"* / *"forticlient"* /
   *"it doesnt need password after the first time. so you can just click
   connect (if you are able to)"*. Findings, read-only: FortiClient 7.2.4 has
   no CLI connect; the window is a Chromium web view with no exposed buttons;
   a simulated right-click on the tray icon opened no menu (three tries). The
   tray icon name does carry state: "FortiClient - Connected to eAuto-VPN".
   Options offered, none built: (a) status check from the tray icon name shown
   next to Run and refusing eSim runs when off; (b) launch FortiClient.exe and
   wait for "Connected"; (c) FortiClient's own "Auto Connect" / "Always Up"
   settings on the eAuto-VPN tunnel (a machine setting, for Faizuddin to set).
10. **Production regression checklist drafted in chat** (side session 12:48 and
    14:30; main session 15:43–16:38). Read-only: no payment, no sharing, no
    edits. Final style per Faizuddin's CIBO example: three short flows, UCD /
    BO / Service Portal, plus the "Observe the following columns" block with
    Old trx / New trx values for Odometer Reading, Type of Claim, Total No. of
    Parts Approved for Change, Possible Total Loss, Possible BER, Incidents
    Severity Scale, and the Service Portal "Count(s) of Incidents Severity
    Scale" 4→6 counters with the 5 BO-only columns absent. Faizuddin asked
    *"the column odometer reading is changed to mileage right?"* — answer: no,
    label stays "Odometer Reading", only the source changes (*"okay my bad"*).
    Not saved anywhere in the repo.
11. **TS34 deprioritised.** Faizuddin, 11:07: *"okay, for ts34, we will deprio
    in the meantime"*, after asking where the audit-log TS came from (SRD v1.0
    §2.2.6 REQ-007 Example 2). Dashboard row greyed out with the reason;
    sheet Test Result N/A. Written to §7v.
12. **Dashboard run configuration split** (side session, 11:53). Shared fields
    stay in the top grid; a "TS-specific data" group appears only when a
    selected TS needs its own field, each field tagged with its TS (vehicle no.
    per TS05/TS27/TS31, existing vehicle no. TS17, chassis no. TS03). Faizuddin:
    *"for fields that is specific for a TS, make a label for it in the run
    configuration so that i know that TS requires a specific data"*.
13. **Nothing committed to git.**

## Coverage at end of day

1. Faizuddin's statement (17:12): all TS passed except TS34 (deprioritised).
2. Last pasted logs in the session, for the record:
   1. 09:46 log: TS44 PASSED (J600008448 1st, J600008449 2nd; 2nd row shows
      the new values, 1st keeps its own). TS45 FAILED (old "0 record(s)"
      wording).
   2. 14:01 log (the big run): PASSED TS01, TS03, TS04, TS05 (HXJ0001 /
      J690008380, saved pre-push PDF matched, "MILEAGE **" header), TS06–TS16,
      TS17, TS18, TS19–TS24, TS26, TS28, TS29, TS30, TS32, TS33, TS35, TS37,
      TS38, TS39, TS44. FAILED TS31 (NH4566, other company's transaction) and
      TS45 (outer-cell locator). This is the first live pass of the whole eSim
      set after the 10-01 fixes, and of TS37–TS39 with the share flow.
   3. 15:22 log (API mode): TS25 and TS43 PASSED; TS02 and TS36 FAILED on the
      Type of Claim crosscheck (automation assumption).
3. Not seen in a pasted log, reported passed by Faizuddin: TS27 (with Find
   data), TS31 (eSim Result = Failed version), TS31 existing-transaction
   variant, TS45 after the exact-text fix.
4. Not automated by design: TS40–TS42 (Wholesale chatbot), TS46 (production
   verification), TS34 (deprioritised, OQ-15).

## Carried over (still open)

1. Open questions still waiting on BA/Dev, none answered today: OQ-01 (TS08–
   TS11 circular), OQ-02 (which endpoint; TS25, TS43), OQ-03 ("new" vs pre-push
   rule and whether failed transactions appear in the listing; TS31 prints
   only), OQ-04 (blank ClaimsType "-"), OQ-06 (zero-claim "-"), OQ-07 (Service
   Portal counter order; TS37–TS39 do not assert order), OQ-08 (old shared
   report's two new counters), OQ-09 (export header suffixes — live today:
   plain labels, no "(UPDATED)"/"(NEW)"), OQ-12 (Transaction Details page not
   in SRD scope), OQ-13 (single claim "1. value"), OQ-15 (audit log page, TS34).
2. TS43 items 2–4 (claim-level flags, deprecated fields, endpoint) need the raw
   API response from dev.
3. HX eSim record state: today's runs each restored eSim (afterEach hook), and
   the 14:01 log shows a clean HX snapshot (`claims: []`) at the start of each
   eSim test. The 10-01 worry is likely resolved; memory reminder
   `eaint-12339-remind-2026-10-02.md` can be deleted once Faizuddin agrees.
4. Session B's 10-01 Round 2 workbook edits (Change Log #84–#89, OQ-14) — now
   moot: the official TS is the pasted sheet with no Remarks/OQ refs. §7n item 4
   in `flow-jomcheck.md` still claims rows 84–89 exist.
5. The 10-04 Claude-in-Excel prompt was overtaken by the pasted sheet; whether
   it was applied no longer matters.

## Next steps for whoever picks this up

1. Ask Faizuddin whether the TS02/TS36 crosscheck fix should be applied and
   those two re-run, or whether the API-mode pass stands as reported.
2. Apply the TS32 any-order compare (one small change) before the next eSim
   run.
3. Commit the 12339 work when Faizuddin asks. The untracked set is large; keep
   `_reference/html/*` captures in the same commit as the knowledge sections
   that cite them.
4. If the production checklist is to be kept, save it (Faizuddin's three-flow
   version from 15:48 and the "Observe the following columns" block from
   16:06) under this folder as a ticket artefact, named ticket-key-first.
5. If a VPN status indicator is wanted, build option (a) from item 9 only.
6. Update the stale "not run live" lines in `flow-jomcheck.md` (see below).

## Durable-knowledge candidates (flagged, not written)

1. `knowledge/flow-jomcheck.md` §7u item 6, §7w items 5/6/11/12 and §7y item 5,
   §7z item 5 all say "Not run live yet". Per Faizuddin's end-of-day statement
   TS27 (Find data), TS31 (both versions), TS37–TS39 and TS45 passed on
   2026-10-05. Needs a `[source: Faizuddin, 2026-10-05: "ts34 deprio, all the
   other passed"]` update, not a `[verified]` tag, since no log was pasted.
2. `knowledge/flow-jomcheck.md`: the TS02/TS36 finding — the real ezAuto PDF
   prints the claim type as the raw ICAP code under "Filing Category", while
   the listing shows the SRD 2.2.5 description. Belongs next to §7j (TS27 PDF
   crosscheck limits). Tag `[verified: live API-mode run 2026-10-05, TS02
   J600008488, saved PDF 12339_TS02-report-JPW2912.pdf]`.
3. `knowledge/flow-jomcheck.md` §7q item 7 ("none has had a live run") and the
   two "§7n" headings / false §7n item 4 are still stale (flagged 10-01 and
   10-04).
4. `knowledge/flow-jomcheck.md` §7p or §7i: TS32 passed today with claim entry
   order preserved, which contradicts "eSim does not keep claim order" as an
   always-true statement. Record it as "order is not guaranteed", not "always
   reversed".
5. `knowledge/eauto-*` or `quirks.md`: VPN facts — FortiClient 7.2.4, tunnel
   "eAuto-VPN", no CLI, tray icon name "FortiClient - Connected to eAuto-VPN"
   is the only machine-readable state. Useful for the nightly-run gap noted in
   memory `nightly-automation-must-run-off-laptop.md`.
6. `lib/ticketStudies.ts` still has no EAINT-12339 study (only a "related"
   mention on line 184). Settled decisions that would go there: 46-row sheet
   with no Remarks/OQ refs; TS40–TS42 deleted; TS34 deprioritised; TS37–TS39
   buy and share with X STAR; one-month date rule; TS31 uses eSim Result =
   Failed.
