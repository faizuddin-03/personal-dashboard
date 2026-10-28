# EAINT-12652 — study (2026-10-27)

## Header

1. **Title (verbatim, Jira):** "[eAuto - STMS] Step 2 - LKM Refund email not sent to the owner when the contact number is a landline (03)"
2. **Type / status:** **Bug**, **To Do**. Created 2026-10-27 08:46, updated 2026-10-27 11:22.
3. **Priority:** Medium.
4. **Fix version:** none. **Labels:** none. **Exp. Deploy Date (cf 10087):** none. **ETA for Testing (cf 10057):** none.
5. **QA (Jira cf[10041]):** Charmain Ea Chiang (same QA as the parent CR EAINT-12431).
6. **Reporter:** Xiwei Lim — the **dev** of EAINT-12431 `[from EAINT-12431 study §1 item 7]`. **Assignee:** none.
7. **Environment (Jira description, General Information row 3, verbatim):** "Production".
8. **Related ticket (row 5, verbatim):** "EAINT-12431 - LKM Refund: email + WhatsApp the car owner at STMS Step 2". Jira "Links" field is **empty** — the relation is only in the description.
9. **QA need (description, "Reference for QA", verbatim):** "QA testing is not required for this ticket (agreed with SA)."
10. **Deployment date / test env:** not stated anywhere.

## Sources read

1. `_reference/tickets/Studying/EAINT-12652/EAINT-12652-jira.md` — Jira capture 2026-10-27 11:45 (fields, description). **0 comments, 0 attachments, 0 sub-tasks, no parent, no links.**
2. No SRD, image, Excel or .docx exists for this ticket. Nothing in the folder besides the Jira capture. **Nothing left unread.**
3. `_reference/tickets/EAINT-12652/` — **does not exist.**
4. `_reference/teams/` — **no file name or content contains EAINT-12652.** Parent context read instead:
   1. `_reference/teams/EAINT-12431-12329-12430-LKM-Refund-Notifications.md` (blocklist message only, line 78).
   2. `_reference/tickets/Studying/EAINT-12431/EAINT-12431-teams-since-2026-10-16.md` (range 2026-10-16 to 2026-10-26 10:50).
5. `knowledge/` — **no match for EAINT-12652.** Read for context: `knowledge/README.md`; `knowledge/flow-stms.md` (Step 2); `knowledge/flow-stms-addons.md` (owner email/WhatsApp entry, lines 48-51, 111); `knowledge/teams-decisions-by-ticket.md` §EAINT-12430 / 12431 / 12329; `knowledge/cr-ledger.md` status snapshot 2026-10-26; `knowledge/business-rules-from-test-scenarios.md` §6.5.
6. `lib/ticketStudies.ts` — **no entry for EAINT-12652.**
7. `_reference/tickets/Studying/EAINT-12431/EAINT-12431-study.md` (parent CR study, 2026-10-26).
8. Repo-wide grep for "12652" — only false hits inside `scripts/eauto-company-checker/*.json` (a New ROC value "202126525906"). Not related.

## What changes

1. **Portal (row 1, verbatim):** "eAuto UCD > STMS (Ownership Transfer)".
2. **Module (row 2, verbatim):** "Step 2: owner contact number - LKM Refund owner notification (email + WhatsApp)".
3. **What is happening (verbatim):** "When that number is a landline starting with 03, the LKM Refund notification email is not sent to the owner, even though the owner's email address is valid."
4. **Cause (verbatim, "Why it happens"):** "A landline cannot receive WhatsApp, and that failure also stops the email from going out."
5. **Expected (verbatim):** "The email is sent as long as the email address is valid, whatever contact number was entered. A landline does not get a WhatsApp message, and that does not stop the email. There is no visible change for the UCD on the Step 2 screen."
6. **Impact (verbatim):** "Owners who gave a landline do not receive the LKM Refund notification by email. No money is involved, so there is no refund exposure."
7. **Key point for QA (verbatim):** "the behaviour under test is the email still going out when the contact number is a landline. A mobile number starting with 01 works either way."

## Requirements (from the Jira description; no SRD)

1. **R1 — email independent of WhatsApp:** valid email → email sent, regardless of the contact number.
2. **R2 — landline gets no WhatsApp:** a 03 number receives no WhatsApp; that failure must not block the email.
3. **R3 — no UI change:** "There is no visible change for the UCD on the Step 2 screen."
4. **R4 — mobile unchanged:** "A mobile number starting with 01 works either way."
5. **Steps to reproduce (verbatim):** "Log in as a UCD and start an STMS transaction for an owner who qualifies for LKM Refund." / "At Step 2, enter a valid email address and a landline number starting with 03 (for example 0312345678)." / "Save Step 2." / "Check the owner's mailbox."

## New vs existing behaviour

1. **Existing (as reported):** WhatsApp send failure on a landline stops the email too. `[from Jira description]`
2. **New:** email and WhatsApp handled separately; WhatsApp failure is swallowed for the email path. `[from Jira description]`
3. **Parent design:** email + WhatsApp sent **together** at Step 2 → Step 3. `[from Teams EAINT-12431, 2026-10-16 15:06, dev]` "we will send the email + WhatsApp together when user finish Step 2 and moves to Step 3, eta 21/10"
4. **WhatsApp target:** `[from Teams EAINT-12431, 2026-10-23 14:25, dev]` "It will send to the phone number that you keyed in at Step 2 ya"
5. **Precedent rule elsewhere:** EAINT-10082 commission notice — "Office number: no WhatsApp, email still sent" `[from knowledge/business-rules-from-test-scenarios.md §6.5 item 1.3, SharePoint TS #006 rows 12-13]`. Same pattern this bug asks for.

## Open questions / risks for testing

1. **Email may not be live in production at all.** Parent went live **WhatsApp only**: `[from Teams EAINT-12431, 2026-10-23 12:26, BA]` "new email "bizsupport@eauto.my" is not ready just yet. Need a few working days to get this ready. b. Confirmed with Ops that: we can proceed deployment with whatsapp message first Enable email feature once new email is ready". No email go-live date seen by 2026-10-26. So a "Production" report of "no email" cannot be told apart from "email not yet enabled" [unconfirmed which applies].
2. **How was it found?** Reporter is the dev; environment "Production"; no evidence attached. Whether it came from code review or a real prod case is not stated [unconfirmed].
3. **Trigger step mismatch with knowledge:** this ticket and the dev message say **Step 2 → Step 3**; `knowledge/flow-stms-addons.md` line 50 still says "Step 1" and "In Development" (stale — parent is deployed 2026-10-26).
4. **Step 2 field is called "mobile"** in `knowledge/flow-stms.md` line 37 ("seller mobile, email"). This ticket implies a 03 landline is **accepted** in that field. Field validation rules for 03 numbers not recorded [unconfirmed].
5. **Phone blocklist at Step 2:** QA hit a blocklist error on the parent `[from Teams EAINT-12431, 2026-10-23 14:39, QA]` "i encountered this error at step 2 any dev available to help patch and remove this phone number from the blocklist?" Rule "3 uses in 30 days" for mobile/email at Step 2 `[knowledge/flow-stms.md line 123]`. Reusing one landline across runs may hit it [unconfirmed].
6. **Other number formats** not covered: 082/088 (East Malaysia landlines), 1-300/1-800, +60 prefix, numbers with dashes. Description names only "03" and "01".
7. **"QA testing is not required (agreed with SA)"** — no QA sign-off planned. Who verifies the fix and in which env is not stated.
8. **No fix version, no assignee, no link** to EAINT-12431 in the Links field.
9. **Company category** should still send nothing (EAINT-12600 rule) — a fix that splits the channels must not re-open that path [unconfirmed risk].

## Suggested test focus (if a check is done despite "not required")

1. **Individual STMS, LKM-eligible owner, valid email + 03 landline** → owner email received; no WhatsApp; Step 2 → Step 3 looks unchanged.
2. **Same with 01 mobile** → email + WhatsApp both received (regression of EAINT-12431).
3. **Landline + email** with email feature confirmed **enabled** in the target env first (see open question 1).
4. **Company category + landline** → nothing sent (EAINT-12600 regression).
5. **Not LKM-eligible owner + landline** → nothing sent [unconfirmed eligibility rule; parent SRD not read].
6. Env: staging/uat4 was the parent's branch `[from Teams EAINT-12431, 2026-10-20 17:14, QA]`; WhatsApp there routes to MessageBird / eSim `[2026-10-23 18:14, dev]`. Fake emails use **@testingz.com** only if the mailbox does not need to be read.

## Dependencies / related tickets

1. **EAINT-12431** — parent CR, Part 1 owner notifications; deployed prod 2026-10-26 (S34.15-20261026), WhatsApp only. `[knowledge/cr-ledger.md snapshot row 1]`
2. **EAINT-12600** — QA-Issue, Company transaction sent LKM messages; Done.
3. **EAINT-12329** — Part 2 (Step 4 owner + UCD reminders), To Do. Likely shares the same send code [unconfirmed].
4. **EAINT-12615** — LKM Refund user guide / FAQ CR group opened 2026-10-26 `[knowledge/teams-decisions-by-ticket.md line 428]`.

## Existing repo knowledge / automation to reuse

1. `knowledge/flow-stms.md` (Step 2 fields), `knowledge/flow-stms-addons.md` (LKM Refund, owner notification entry).
2. `knowledge/teams-decisions-by-ticket.md` §EAINT-12430 / 12431 / 12329 items 4, 10, 12.
3. Parent study `_reference/tickets/Studying/EAINT-12431/EAINT-12431-study.md` (SRD not retrieved there either).
4. Parent QA ran "2 (Automation Script) E2E Happy Flow: TS1 - TS2" `[from Teams eAuto QAs, 2026-10-26 08:09, QA]` — location of that script not in this repo [unconfirmed].

## Knowledge candidates

1. **flow-stms-addons.md line 50 is stale:** owner notification trigger is Step 2 → Step 3, not Step 1; status deployed 2026-10-26, WhatsApp only. Source: `[Teams EAINT-12431, 2026-10-16 15:06, dev]`, `[Teams EAINT-12431, 2026-10-23 12:26, BA]`, Jira EAINT-12652 row 5 "LKM Refund: email + WhatsApp the car owner at STMS Step 2".
2. **Known bug:** LKM Refund owner email blocked when the Step 2 contact number is a 03 landline (WhatsApp failure stops the email). EAINT-12652, To Do, 2026-10-27. Source: Jira EAINT-12652 description.
3. **Step 2 contact field accepts a 03 landline** [unconfirmed — implied by EAINT-12652 steps to reproduce, not verified on screen].
