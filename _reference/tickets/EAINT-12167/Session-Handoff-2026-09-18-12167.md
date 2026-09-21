# Session handoff — 2026-09-18 (EAINT-12167)

Scratch note for resuming later. Not part of the knowledge base — safe to
delete once picked back up. **Supersedes `Session-Handoff-2026-09-15-12167.md`**
(deleted in this update — everything still relevant from it is folded in
below).

## What this ticket is (one-liner)
Adds Number of Device (auto-filled, disabled) and Device Serial No. (one
field per unit) to a Device Purchase Service Request. Ops keys in serials
while Delivery Status = New; saving with Delivery Status set to Arranged
locks the fields and triggers EAINT-12166's Delivery Order flow. This ticket
is the upstream data source EAINT-12166 depends on.

## Status as of 2026-09-18
Jira status still reads **Code Review** (unchanged since before 2026-09-10 —
the status-reliability gap flagged in the 09-15 handoff still stands). Fix
Version `S33.X-20260928`, fallback deploy 28 Sept confirmed independently via
Teams (May Chin Mei Theng, 15 Sept: "if follow original estimation 4+2, by
right should be ready for testing on 18th Sept morning" — did not hold; the
40-unit cap on the sibling ticket is dev-complete but "not pushed yet," per
Faizuddin's own 2026-09-17 Teams note). Faizuddin's own 2026-09-17 EOD post
put this ticket at "Organized the possible scenarios (Estimated ~15TS);
Started drafting TS" — this session continued that TS drafting live.
**Still no code/build reachable anywhere for this ticket** — work today was
study, TS drafting, and knowledge-file correction, not automation.

## Work done this session (2026-09-18)
1. **Teams recheck succeeded this time** (the 09-15 session's blocking gap —
   Teams tab stuck loading — did not recur). Rechecked the dedicated
   EAINT-12167 CR-group chat: quiet since 21 Aug (last message a Figma link,
   Yi Link Lim → Wong Zhan Choon), but that chat's 17 Aug thread resolved the
   **locked-SN-typo** open question the 09-15 handoff carried as unresolved:
   **Option A — once Delivery Status = Arranged, nobody (not even a senior
   Hub Admin) can correct a mistyped serial; fix only via an IT support
   ticket** (Yi Link Lim, Teams, 17/08 10:47). Folded into
   `knowledge/flow-device-purchase.md`.
2. Drafted a full **16-scenario Test Scenario list for EAINT-12167**
   (12167_TS01–TS16, house style) covering: Number of Device auto-fill/
   disabled (1 and multi-device), Serial No. field count following quantity
   (1 and 40, two-per-row/scrollable), the 8–12 char boundary (7/8/12/13),
   special-character stripping, mandatory-field and duplicate-SN rejection
   (same request and cross-request), New-vs-Arranged editability, the
   18-account blocklist, and the pre-change blank-serial case for old
   requests. **This draft exists only in this session's chat — the user
   redirected before it was written into the standard xlsx**
   (`EAINT-12167 - [eAuto-BackOffice] Service Hub - Allow Ops to Input Device
   SN...xlsx`), asking instead for a click-through flow in the artifact.
   **Gap: the 16-scenario draft is not saved anywhere in the repo** — whoever
   picks this up should re-derive or ask for it again before assuming it's
   captured.
3. Added a **click-through flow** section to the combined
   EAINT-12166/12167 artifact for EAINT-12167 specifically — 9 steps from
   BackOffice login through the Listing check, each with what to click and
   what happens after. Also fixed the artifact's locked-SN-typo card to show
   "Resolved" (it had contradicted what the knowledge file now states).
4. **Closed a gap both 09-15 handoffs flagged**: saved the combined
   artifact's source HTML into the repo at
   `_reference/tickets/EAINT-12167/EAINT-12167-EAINT-12166-combined-study.html`
   (previously only existed in a temp scratchpad and would not have survived
   past that session). Updated both tickets' `artifact lists.txt` to point at
   the combined artifact as primary.
5. **First live HTML captured for this ticket**: saved
   `_reference/tickets/EAINT-12167/EAINT-12167-backoffice-01-sr-details-uat1.html`
   — a pre-change baseline of a real BackOffice SR Details page (`SR69001385`,
   a 1-unit purchase), including the static Shipping Details table
   (`ins-kv ins-ship`) and the "Update Shipping Details" popup
   (`#op-ship-dialog`). No new fields are visible yet (this is baseline, not
   post-build).
6. **Corrected a real misreading, twice, mid-session** — worth reading in
   order since it shows the reasoning, not just the final answer:
   - First pass: read the fields as popup-only.
   - User pasted the live capture; re-read the SRD in full (had only read a
     summarized version before) and found **§2.2.3 "Affected Pages" and
     REQ-001 both place the two new fields on the static Service Request
     Details page's Shipping Details section**, not just the popup.
   - Found and corrected a filing mistake: the **40-unit cap** had been
     written into the 12167 section of `knowledge/flow-device-purchase.md`,
     but it's actually **EAINT-12166's REQ-007** (the UCD-side purchase-qty
     cap) — 12167 has no cap of its own, it only reads whatever quantity was
     purchased. Fixed in the knowledge file this session.
7. **New structural finding, unresolved — needs dev, not writable as a test
   case yet:** "Number of Device" means different things on different pages
   — the **transaction total** on the Details page (REQ-001 v1.2 clarifies
   this explicitly) vs. **always 1** per-record on the Listing page
   (REQ-011) — a genuine trap if the wrong page's expected value gets
   asserted. Separately, a Jira dev comment (zhan.choon, 12 Aug) says "one
   [shipping] update covers all the devices in [a multi-device] request,"
   but the live 1-unit baseline shows each device as its own independent SR
   with its own Delivery Status/Date/Consignment Number/Update-Shipping-
   Details button — which doesn't obviously reconcile with "one shared
   update." The single-device capture in hand can't disambiguate either
   reading. Written up in the knowledge file as an explicitly flagged,
   unresolved item.
8. Went through the user's own list of 7 outstanding unknowns line by line
   (see table in chat) — 5 of 7 are now answered from SRD/Teams/Jira-comment
   sources (existing-transactions blank-serial behaviour, locked-SN-typo,
   the 18-account list verbatim, the popup's 40-box scroll layout, the
   40-unit cap's real source). **2 remain genuinely open with no source
   anywhere**: duplicate-SN error timing (immediate vs. on-Update-click) and
   its exact error-message text — the duplicate-SN rule itself was never
   formally written into the SRD at all, only asserted informally in a Jira
   comment thread.
9. All of the above (except the unsaved TS draft) is now written into
   `knowledge/flow-device-purchase.md`, which also picked up Teams-sourced
   status/effort-estimate context dated through 2026-09-17/18 (combined
   6-day estimate approved by May Chin Mei Theng 2026-09-17; 12167 at
   "started drafting TS" as of 17 Sept EOD).

## What's in this folder now
- `EAINT-12167_SRD_..._v1.2_20260817.pdf` — latest SRD, still current.
- `EAINT-12167-study.html` — source for the superseded single-ticket study
  artifact (2026-09-10).
- `EAINT-12167-EAINT-12166-combined-study.html` — **new this session**,
  source for the primary combined artifact, now editable going forward.
- `EAINT-12167-backoffice-01-sr-details-uat1.html` — **new this session**,
  first live capture for this ticket (pre-change baseline, uat1,
  `SR69001385`).
- `EAINT-12167 artifact lists.txt` — updated this session to point at the
  combined artifact as primary.

## Open items
1. **Testing environment still not confirmed anywhere.** Per Teams
   (Faizuddin, eAuto QAs channel, 2026-09-17), 12167's code is understood to
   be in progress but 12166's related 40-unit change is "dev already made
   changes... but not pushed yet," tentatively tied to the 28 Sept fallback.
   Nothing suggests either ticket is reachable on a real environment today.
2. **Structural contradiction (new this session, unresolved)** — one shared
   shipping update vs. independent per-SR shipping — see finding #7 above.
   Needs either a live multi-device transaction capture or a direct answer
   from Lim Yi Link/dev before writing a multi-device test case.
3. **Duplicate-SN error timing and exact message — still open, no source
   anywhere** (immediate vs. on-Update-click; exact wording). Chase with
   dev directly.
4. **REQ-009 (18-account blocklist) "already a no-op" claim is still
   dev-asserted only**, not independently verified — confirm against real
   BO logins once a build exists.
5. **The 16-scenario TS draft from this session is not saved anywhere in the
   repo** (see finding #2) — needs to be re-derived or re-requested and
   written into the standard xlsx before it's lost, the same "temp
   scratchpad, not the repo" pattern the 09-15 handoff already flagged once
   for the combined artifact.
6. Jira status vs. dev-thread mismatch (still Code Review despite
   "dev+code review done, QA next" from the 12-Aug dev thread) — unchanged
   from 09-15, still unchased.

## Next steps for whoever picks this up
1. Write the 16-scenario TS draft into the standard xlsx before it's lost —
   the scenario table is reproducible from this handoff's finding #2 if the
   chat itself isn't available.
2. Chase the structural contradiction (shared vs. per-SR update) and the two
   duplicate-SN unknowns directly with Lim Yi Link/dev — these are the only
   remaining blockers to a fully confident TS list.
3. Confirm the testing environment before scheduling execution.
4. If a build becomes reachable, capture a multi-device transaction's SR
   Details pages live — this is the only thing that can settle the
   structural question, per the knowledge file's own note.
5. Automate the SN boundary values (7/8/12/13 chars, stray special char) and
   the field-count-follows-quantity cases (1 device, 40 devices) once TS is
   finalized and an environment exists.

## Durable-knowledge candidates (flagged, not written here)
- `knowledge/flow-device-purchase.md` already exists and was substantially
  extended/corrected this session (locked-SN-typo resolution, static-page-
  vs-popup correction, the transaction-total-vs-per-record trap, the
  structural contradiction, the 40-unit-cap mis-filing fix) — no further
  action needed there, it's current as of this session.
- No entry for `EAINT-12167` exists yet in `lib/ticketStudies.ts` — still
  nothing promoted there beyond what the published artifact already covers,
  same gap the 09-15 handoff flagged.
