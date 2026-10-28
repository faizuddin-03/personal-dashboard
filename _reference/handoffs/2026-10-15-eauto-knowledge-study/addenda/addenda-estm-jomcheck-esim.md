# Addenda from the eSTM / JomCheck / eSIM gap-check (2026-10-16)

Facts found while extending `knowledge/flow-estm.md`, `knowledge/flow-jomcheck.md`
and `knowledge/esim.md` that belong in OTHER files. Not written there (brief:
three target files only). Each item carries its provenance tag, ready to paste.

## knowledge/flow-ucd-onboarding.md

EAINT-12414 lives in `_reference/tickets/EAINT-12414/` but is an onboarding
ticket, not JomCheck (the folder name list in the brief grouped it with
JomCheck). Nothing in `flow-ucd-onboarding.md` mentions it.

1. EAINT-12414 "🔴[eAuto - Onboarding] Pre-Application Form - Resets to Step 1
   on reload & no error shown for failed Credit/Debit Card payment". Task,
   Medium, To Do at capture, reporter Boo Jin Siang, Developer field Mong Guo
   Hao, no attachments, no SRD. `[from ticket EAINT-12414 — _reference/tickets/EAINT-12414/EAINT-12414-jira-ticket.md]`
2. Defect 1: reloading/reopening a saved Pre-Application Form drops the
   applicant to Step 1 ("A list the page needs while loading is set up only
   after the loading has already started"). Expected: restore the step reached.
3. Defect 2: a failed Credit/Debit Card payment that returns to the **form
   tab** (not the popup) shows no message, unticks the declaration and hides
   the payment methods. Expected: land on Step 2 showing verbatim
   "Unsuccessful Payment - Something went wrong and your payment didn't go
   through. Please choose a payment method and retry.", declaration still
   ticked, payment methods shown. The popup path already showed the message.
4. Dev scope (Mong Guo Hao, Teams 29/09 16:06): "Type of Business selection
   when preapplication page is reloaded"; "Failed card payment: lands on step 2
   with T&C ticked, payment methods shown and the banner"; "Successful card
   payment and successful FPX payment". `[from Teams, EAINT-12414 CR chat, captured 2026-09-30]`
5. Scope decisions (Faizuddin, 2026-09-30): defect testing Pre-Application only;
   FPX regression Personal only (B2B not deployed); one happy-path regression
   through all 11 phases. Fix under review: eauto-onboarding MR !331.
   `[from ticket EAINT-12414 teams-thread file]`
   (The study also records the environment chosen for that ticket; keep it
   in the ticket study, not in the flow rule.)

## knowledge/eauto-portals.md

1. Service Portal (banks/credit companies) login is `<base>/bank/login/`, form
   fields `name="name"` / `name="pass"`, submit `input.to-login`; the guess
   `/banker/login` returns "URL not found". Home `<base>/credit/home/`.
   `[verified: scripts/eauto-jomcheck/data/config.ts:37-43; pages/ServicePortalLoginPage.ts:16-18]`
2. UCD/BO logout can be done by loading `<base>/user/logout.do` directly — it
   skips the native "Sure to logout?" `confirm()`.
   `[verified: scripts/eauto-jomcheck/data/config.ts:17; pages/LoginPage.ts:69-75]`
3. A BackOffice capture of 2026-10-15 uses context path `/eauto` in every link
   where earlier captures used `/uat1`; base URL not stated.
   `[verified: _reference/html/eauto/bo-jomcheck-transaction-enquiry-failed-resubmit.html header]`

## knowledge/quirks.md

1. eSIM claim-record labels are CSS-uppercased: `innerText` returns
   "CLAIMS TYPE (ICAP CODE)", `textContent` returns "Claims Type (ICAP code)".
   Any read-then-write of labels must use `textContent`.
   `scripts/eauto-esim/pages/EsimPages.ts:215` still uses `innerText`
   (unfixed); `scripts/eauto-jomcheck/pages/EsimJomCheckPage.ts:136-139` fixed.
   `[verified: both files, 2026-10-16]`
2. `scripts/eauto-estm/playwright.config.ts` still passes `video: 'on'` as a
   bare string (downscaled recording, the trap in flow-jomcheck §7g) and is
   always headed. `[verified: scripts/eauto-estm/playwright.config.ts:12-17,42-43]`

## knowledge/automation-playbook.md

1. Windows `--grep` quoting: the JomCheck route wraps the joined title regex in
   double quotes on win32 and replaces every `"` inside titles with `.`;
   without it cmd.exe reads `|` as a pipe and a 2+ scenario run dies silently.
   Check whether the playbook already states the `"`→`.` part.
   `[verified: app/api/eauto-jomcheck/run/route.ts:478-488]`
2. `public/qa-artifacts/eauto-estm/` keeps only the latest `run.webm` — the
   eSTM route deletes every earlier file before copying.
   `[verified: app/api/eauto-estm/run/route.ts:39-60]`

## knowledge/flows.md (index — not edited, per brief)

1. The "Index of flow documents" table has no rows for `flow-jomcheck.md`,
   `flow-device-purchase.md`, `flow-ucd-onboarding.md`,
   `flow-eauto-insurance-enquiry.md`; and the "Modules with no flow document
   yet" line still lists JomCheck although `flow-jomcheck.md` exists.
2. Suggested `flow-estm.md` source wording: "Nick's R&D scripts + live HTML +
   full code map of scripts/eauto-estm".

## knowledge/README.md (index — not edited, per brief)

Suggested wording changes:
1. `esim.md` row: add "full page/URL map of all 31 entity pages, every captured
   edit-form id, the JomCheck Report form incl. claim records, and the
   scripts/eauto-esim code map".
2. `flow-estm.md` row: add "code map of scripts/eauto-estm (env vars, handles
   with file:line, PROGRESS keys) and the step-5 add-on enquiry contract".
3. `flow-jomcheck.md` row: add "SRD REQ-001–011 map, 29-column BO listing,
   ICAP table, page-object/selector map, spec→TS map, BO Resubmit location".

## Read-only sources that are stale (cannot be edited — `_reference/` rule / baseline rule)

1. `scripts/eauto-estm-legacy/README.md` says the legacy page is in the sidebar
   (amber "Create eSTM (Original)"); `components/Sidebar.tsx:52-53` hides it.
   The legacy folder is a do-not-edit baseline, so leave it.
2. `_reference/html/esim/dereg-enquiry-edit.html` and `dereg-enquiry-list.html`
   headers say "Used by: knowledge/flow-esim.md" — that file does not exist
   (it is `knowledge/esim.md`).
3. `scripts/eauto-esim/.env.example` lists only `estm-enquiry | estm-submission`
   as entity values; eight are valid. (Not `_reference/`, so it may be fixed
   if wanted.)
