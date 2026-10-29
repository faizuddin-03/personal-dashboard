# Flow — UCD dealer onboarding (Pre-application → Application → Registered)

Distilled from the reference pack `_reference/automation code/Pre-Application &
Application/eAuto-PreApplication-to-Registered-E2E-Flow-Pack/`, compiled
03-09-2026 by Charmain (QA) out of the EAINT-11982 project. Every screen in that
pack was **observed on a live run or read off the 23-08-2026 walkthrough
recording**, not taken from an SRD. Read the pack itself for screen-by-screen
detail; this file is the distilled version.

`[verified: reference pack observed-run notes + locators-learned.json matched
live 2026-08-31]`

## The eleven phases

`/obs` screens sit **outside** the instance path — the base is
`https://staging.eauto.my`, *not* `.../uat4`. Only login/home take the instance.

| # | Phase | Actor | Surface | Produces | Human? |
|---|---|---|---|---|---|
| 1 | gate | Dealer | `/obs/preOnb/recaptcha` | passed-gate session | **yes — one tick** |
| 2 | preapp | Dealer | `/obs/preOnb/form` → review → FPX | ref `P260823/00759`, status NEW, **RM 108.00 paid** | no |
| 3 | approve-preapp | BO approver | `/obs/admin/preOnb/summary/<uuid>` | status APPROVED + the dealer Application Link | no |
| 4 | appform | Dealer | `/obs/form/<sec>?id=<brn>&s=<token>` — 3 steps | **Application No** + expiry = creation + 90 days | no |
| 5 | assign | BO approver | `/obs/admin/form/edit/<uuid>` | Assignee set | no |
| 6 | submit-approval | BO assignee | same page | status **Pending** | no |
| 7 | approve-app | BO approver | same page | status **Approved**, Registration Documents tab appears | no |
| 8 | regdocs | Dealer | application link, step 4 | 6 document sections submitted | no |
| 9 | verify-regdocs | BO assignee | `/obs/admin/form/edit-registration-doc/<uuid>` | **Verified** | no |
| 10 | regfee | Dealer | step 5 Payment | **RM 990.00 paid**, Payment Status PAID | no |
| 11 | record | BO | `/obs/admin/enquiry` | the finished record | no |

Roles used by the reference rig: approver `ops_jasons`, assignee
`hubadmin_bochar`. Those are **credential-store keys**, not login ids — the
approver login is `jasons` (display name Jason Seah), the assignee was
`BOChar` (display name "CHARMAIN EA CHIANG chg"). The EAINT-12153 test sheet and
the 12257 dashboard use `jasons` as approver and **`mfared`** as assignee
(mfared sets the UCD Group, presses Submit For Approval and Verified; jasons
presses Approve). `[verified: 01-flow/03-actors-urls-accounts.md;
scripts/eauto-payment-channels/data/users.ts:8-12;
app/eauto/duitnow-qr/TestScriptTab.tsx:60-64]`

## The five things that cost time if you don't know them

1. **There is exactly one route to an application, and it starts at the public
   reCAPTCHA gate.** BackOffice's "UCD New Application" panel looks like a
   shortcut but stalls at approval — the assignee's edit page carries no *Submit
   for Approval* button. Forcing it with the Application Status dropdown yields a
   **stub with no expiry date** (that record is `NA68001100`). **The dropdown
   sets the FIELD; the button runs the WORKFLOW.**
2. **Only 2 of the 5 business types are automatable.** The three SSM types
   (Sdn Bhd/Bhd, Sole Prop/Partnership, LLP) post the BRN to
   `/obs/preOnb/checkSSM.do`, a **live lookup against real SSM data**. No
   generated BRN passes; staging answers `{"registered":false}` and the form
   **silently switches you to Business Trading (Sabah)**. Use **Business Trading
   (Sarawak)** or **(Sabah)** unless the SSM path itself is the subject, which
   needs real company data from dev/BA.
   **2026-10-21, staging/obs:** two real-looking company BRN sets supplied by
   Faizuddin (`202203040130` / `003369080-P` and `201203099294` / `KT0307773-P`)
   also came back `{"registered":false,"refNo":null,"newRefNo":null,...}` from a
   direct GET to `checkSSM.do`, with both Old and New BRN. So on that day **no**
   BRN passed on staging — check with dev whether the staging SSM lookup is
   connected before blaming the data. The same day `201001029083` / `913003-M`
   (and `1271827-P`) also returned `registered:false`, although that Sdn Bhd set
   reached Business Info Review and payment on staging on 2026-08-20 in Azila's
   EAINT-11868 suite (team repo eauto-qa-gpt, branch consolidate-azila,
   `azila-source/by-ticket/eaint-11868-pre-application/registration-data.json:36-40`,
   form map dated 2026-08-20). Unconfirmed alternative: the lookup may also
   reject companies already onboarded on staging. Both rejections showed the red reminder
   `div.confirm-business-reminder.business-trading` (set to `display: block`)
   at the top of the form: "Please confirm your business information before
   proceeding. / Please check that the business registration number is correct
   and confirm your business type". It sits above the fold, so a scrolled
   screenshot misses it. No popup. `[verified: live staging, 2026-10-21; captures
   _reference/html/eauto/obs-preonb-form-after-next-switched-to-trading-sabah.html,
   obs-preonb-form-ssm-rejected-banner.html]`
   **Root cause (Faizuddin, 2026-10-21): on staging the SSM answer comes from
   eSIM, so every SSM-type company must be set up in eSIM first.** Recipe from
   Azila's EAINT-12341 runs (`EAINT-12341_Test_Cases_v1.3.xlsx`, sheet Test Cases
   row 4 "CH1-01 eSim set up", QATeam › eAuto - Test Evidence › 1. Enhancement CR
   › EAINT-12341 …): log in to eSIM; screen **Ssm Enquiry Resp**: Response Code
   **004**, the ROC **without its letter**, the **12-digit number**, Delay **0**,
   Save; then the **submission record** holding the directors/owners (ROC for
   Sdn Bhd, ROB for Sole Prop/Partnership; LLP "not in the eSimulator guide —
   confirm the eSim screen first"). Business Trading types need no eSIM. Values
   per run came from `EAINT-12341_eSim_Setup.xlsx` (tabs "1 Companies", "CH1"…),
   which is **not** on the QATeam site (search 2026-10-21) — likely Azila's own
   OneDrive. Rules from the same workbook: one real company per run, never reuse
   (`IP0581553-U`, `003270488-X`, `1267419-A` already used); companies come from
   the Company Details Checker "PASS" list. Proven runs 2026-10-03/05: CH1 Sdn Bhd
   `1381282-X` / `202001024962` → P261002/00877 → NA60001180 (SSM Status OK).
   **Her robot was pushed 2026-10-21 14:35** to team repo `modefair/eauto-qa-gpt`,
   branch `consolidate-azila`, folder
   `azila-source/by-ticket/eaint-12341-onboarding-document-preparation/`
   (`automation/` + `cr/EAINT-12341/`, incl. `02-plan/EAINT-12341_eSim_Setup.xlsx`,
   `company-ledger.json`, `04-runs/`). Run `npm run ch1`…`ch8` (`CHAIN_SCENARIO`),
   env copied from `env/env-default`. Drives: optional eSIM seed → reCAPTCHA (human)
   → Pre-Application → pay (card or Online Banking (Personal) only; Fiuu auto only
   with `PAYMENT=auto`) → BO pre-app approval (assignee) → Application steps 1–3 →
   submit → assignee Submit for Approval → approver Approve. **Not driven:** step 4
   Registration Documents, step-5 registration fee, FPX B2B, DuitNow QR. eSIM
   seeding (`src/data/ssm-seed.ts`, `ESIM_SETUP=robot`, default manual) uses the
   eSIM REST API (`/api/authenticate`, `ssm-enquiry-resps` responseCode 004 +
   `ssm-roc|rob|llp-submission-resps` responseCode 005 with XML cloned from a donor
   row, tags REF_NO/NEW_REF_NO/ROC_STATUS=EXISTING forced; ROC stored split, e.g.
   `639691` + checkDigit `H`; upsert by roc/newRoc) — marked "NOT YET VERIFIED" in
   its own header. All 12 companies in its ledger are used (CH1–CH8, RT1, three
   v1.1 failures). `[from consolidate-azila @ e520f82, read 2026-10-21]` `[from SharePoint EAINT-12341
   Test Cases v1.3 + CH1 summary, read 2026-10-21]`
   Fallback rule from the page script: falls back when `registered !== true`
   **or** an entered Old/New BRN differs from SSM's `refNo`/`newRefNo` (compared
   on the part before the first "-"). `[verified: obs-preonb-form-blank.html, script near checkSSM.do]`
3. **Two independent status fields** control the BackOffice page and confusing
   them has cost more time than anything else: **Application Status**
   (New → Pending → Approved → Expired) and **Hardcopy & Acc Created**
   (`-` → Pending UCD / Incomplete Docs / Pending Assignee → **Registered**).
   `Registered` is reached **only** by the Create Account button, never by the
   dropdown.
4. **The expiry skew is not a bug.** Application Expiry = application
   **creation** + 90 days to the minute, and creation is when the approved
   pre-app generated the application — not the submit click. A 1–2 minute skew
   between the Submission Date and Expiry Date columns is CORRECT. Assert
   against creation.
5. **Label trap:** the pre-app button is **"Submit and Pay"**, the
   registration-fee button is **"Submit & Pay"**. This has already broken a
   locator.

The Remarks column carries *"TIN verification failed…"* on every generated
fixture. Cosmetic.

## Human gates

There is **one** in the reference flow, and it is the **reCAPTCHA** — not
solvable from this side, typically two or three image challenges (~55s).
`npm run check:gate` measured the saved session as **not reliably reusable**, so
budget one tick per build; a build started while a previous session is still
alive sometimes skips it. The rig waits 300s then stops cleanly with the
checkpoint intact — resume by name rather than starting a fresh build.

**Both FPX payments drive themselves** through the Fiuu bank simulator
(credentials host-locked to `bank-simulator.fiuu.com`). The payment wait is 30
minutes; timing out there **costs the whole pre-application**, because the form
must be refilled from scratch.

The one ask worth making of dev/infra: **Google's published reCAPTCHA test keys
on staging**. One environment change makes the whole pipeline unattended.

## Unique data — what eAuto de-duplicates on

The rig generates every identity value from a **minute run-stamp + a monotonic
on-disk counter** (`fixtures/.seq`). Nothing is random, so any value traces back
to the run that made it. Unique per run: company name, BRN / trading licence no,
TIN, SST, admin/director/PIC emails and MyKad numbers, and the Create-Account
**Main User Login ID** (must be unique across the environment).

Deliberately **not** unique and safe to repeat: showroom address, postcode,
state, and the admin/director/PIC display names.

Field rules measured on the live form 24-08-2026: BRN / licence **min 4 chars**;
TIN **9–15 chars**, no checksum; **SST on the Application Form exactly 15
chars**; postcode exactly 5; mobile max 11; the page **upper-cases** the company
name.

## What limits supply

Not scripting — **record creation**. Every scenario that consumes a record's
state competes for the same pool, and a record consumed by an irreversible act
(Create Account → Registered) is gone. Practical rules the pack settled:

- **Bank the identity as soon as you learn it** — write the checkpoint *before*
  the risky act, not after.
- **Dry-run any irreversible driver on a record you have already spent.**
- **Prefer moving ONE record across a boundary** over building a ladder of
  different records; a ladder holds nothing fixed. That exact mistake
  manufactured a phantom 30-day defect.

Cost per fixture: ~4 minutes of machine time (~12 minutes by hand) and
RM 1,098.00 of simulated payment (RM 108.00 + RM 990.00).

## Where EAINT-12257 (DuitNow QR) attaches

At the **payment step of phase 2** (pre-application, RM 108.00) and of **phase 10**
(registration fee, RM 990.00) — a fourth tile beside Card, Online Banking
(Business) and Online Banking (Personal). See
[eauto-payments.md](eauto-payments.md) § DuitNow QR channel for the channel's own
shape and scope boundary.

Our port lives in `scripts/eauto-duitnow-qr/` and runs from the dashboard at
`/eauto/duitnow-qr` (sidebar → Tickets → 12257). Two scenarios, one per payment
point:

| Case | Pays by QR | Phases driven |
|---|---|---|
| `12257_TS01` | pre-application fee, RM 108 | 1–2 |
| `12257_TS02` | registration fee, RM 990 | 1–10, then reads the record back |

**TS02 pays the pre-application fee by FPX on purpose**, so the operator is asked
to scan only once — at the payment point actually under test. That means TS02
needs both BackOffice logins (approver and assignee) and, ideally, the Fiuu
simulator credentials; without the latter the FPX leg pauses for a human too.

**The SSM types are reachable, via the Company Details Checker.** The three
values that checker clears — Company ROC, New Company ROC, TIN — map exactly onto
Old BRN, New BRN and TIN on the pre-application form, and a row it marks "Able to
use" is by definition a real company staging has not onboarded yet. The 12257
page therefore carries the checker as its own tab (12153's component reused, not
copied) with a **Use** button on every passing row that hands the values to the
runner. **The scenario is selected first and drives the checker**: a selection
that needs real company data gets the Use button, one that generates its own
identity gets none, so there is never a Use that would silently go nowhere. The
rule lives in one place — `app/eauto/duitnow-qr/scenarios.ts` — because two tabs
disagreeing about what a scenario requires is exactly how you press Use and
nothing happens. The run then refuses to start if an SSM type has no company attached, and
**aborts if `checkSSM.do` rejects the BRN** — the form silently reselects Business
Trading (Sabah) rather than erroring, so without that check a run would quietly
test a type nobody asked for. **A real BRN is good for exactly one onboarding, ever**, so spent rows are
tracked in a **shared ledger** — `lib/companyUsageLedger.ts`, localStorage key
`eauto_ucd_company_usage`, keyed on the `roc|newRoc|tin` triple. It is
deliberately **not ticket-scoped**: the constraint lives in eAuto, not in Jira, so
a company spent by EAINT-12153 is dead for EAINT-12257 too and both checkers show
it as *Already used* with the ticket and date. A run that mints a
pre-application reference marks its company **confirmed** automatically; anything
else can be marked (or released) by hand, and a confirmed entry is never
downgraded by a later hand-mark. `[built 2026-09-03]`

Both add a **second** human gate to the reCAPTCHA: the phone scan. The suite
therefore runs **headed only** — the route rejects a headless request outright.
`[built 2026-09-03; every selector except the DuitNow QR tile and popup is ported
from the reference pack's measured locators. The QR ones are UNVERIFIED — that
channel is not built yet and no HTML has ever been captured for it.]`

The payment step itself (tiles, bank grid, Fiuu popup, success and failure
pages, B2B Pending Approval, DuitNow QR) is documented in
[flow-payment-channels.md](flow-payment-channels.md).

## URL map (complete)

Added 2026-10-15 from the reference pack `01-flow/03-actors-urls-accounts.md` and
`scripts/eauto-duitnow-qr/src/env.ts`. Base host only: `/obs` has no instance
segment. Only the BO login and the `/obs` handoff take one.

| Surface | URL | Source |
|---|---|---|
| reCAPTCHA gate | `/obs/preOnb/recaptcha` | `src/env.ts:17` |
| Pre-Application Form | `/obs/preOnb/form`, then `/obs/preOnb/form/<uuid>` once the draft exists | `src/env.ts:18`; `preapp.js:100-106` |
| SSM lookup | `/obs/preOnb/checkSSM.do` (live registry; staging answers `{"registered":false,...}` for a generated BRN) | `05-known-traps.md §1` |
| FPX hand-off | `/obs/preOnb/landing/<uuid>/<bank>` → popup `sandbox-payment.fiuu.com` → `bank-simulator.fiuu.com/<CHANNEL>/login` | `03-actors-urls-accounts.md` |
| Pre-Application Review (paid) | `/obs/preOnb/summary/<uuid>` | `src/dealer.ts:77` |
| Dealer Application Form (steps 1-5) | `/obs/form/<sec>?id=<brn>&s=<token>&v=1`. `s=` is a server-minted signature, read off the BO summary after approval, never reconstructable | `src/onboarding.ts:76-81` |
| BO: UCD Pre-Application Listing | `/obs/admin/preOnb/enquiry` (also `/inquiry`) | `src/env.ts:13` |
| BO: Pre-Application detail | `/obs/admin/preOnb/summary/<uuid>` | `src/env.ts:16` |
| BO: UCD Application Listing | `/obs/admin/enquiry`; AJAX search `admin/form/enquiry/search` (GET, serialised from `#search-form`) | `src/env.ts:12`; `src/listing.ts:57` |
| BO: Application Form edit | `/obs/admin/form/edit/<uuid>` | `src/env.ts:14` |
| BO: Registration Documents | `/obs/admin/form/edit-registration-doc/<uuid>`. Returns **"404 - NOT FOUND"** when the dealer never submitted documents. That is scope, not a session failure | `src/env.ts:15`; `src/obs.ts:41-43, 80-82` |
| BO: Create New Company Account | `/<instance>/view/account/company-obs/new.do?id=<uuid>` | `06-hardcopy-and-registered.md` |
| BO login | `/<instance>/public/login/`. Go there **directly**: a redirect lands on the central login at `www.eauto.my`, whose session does not count for the instance | `src/login.ts:4-9` |
| `/obs` session handoff | `/<instance>/api/admin/onboarding/auth-redirect.do?type=OBS_APPLICATION_LISTING` or `type=PRE_OBS_APPLICATION_LISTING`. A cold GET of any `/obs/admin/*` page returns ~39 bytes of empty HTML, no redirect, no 403, until this has been hit once | `src/obs.ts:20-28, 65-95` |

**`/obs` pages never finish loading.** ~48 static assets never answer, so
`readyState` never leaves `loading` and neither `load` nor `domcontentloaded`
fires. The document itself is complete in ~1.2 s. Navigate with
`waitUntil: "commit"` and poll `document.documentElement.outerHTML.length > 20_000`
(`REAL_DOCUMENT_BYTES`). A smaller document is the empty-session shell.
`[verified: src/obs.ts:11-16, 30-63]`

## Verbatim DOM handles — dealer side (phases 2, 4, 8)

Matched live 2026-08-31 unless marked. `[verified:
03-automation/reference-data/locators-learned.json; scripts/eauto-duitnow-qr/src/dealer.ts]`

### Pre-Application Form (`/obs/preOnb/form`)

1. Type of Business is a **radio group** `input[name="businessType"]`, values `SDN_BHD`, `SOLE_PROPRIETORSHIP_PARTNERSHIP`, `LLP`, `TRADING_SABAH`, `TRADING_SARAWAK`. The BRN / licence fields do not exist until a type is chosen (class flip, ~400 ms). `preapp.js:9-14, 181-183`
2. `#businessName` (label /business registered name/i); the page upper-cases it.
3. SSM path: `#newBrn` (placeholder `New Business Registration No (BRN)`), `#oldBrn` (placeholder `Old Business Registration No (BRN)`). Each is optional alone, at least one is wanted; `checkSSM.do` gets whichever was entered. `preapp.js:185-190`
4. Non-SSM path: `#businessLicenseNo` (placeholder `Business Trading License No`) + `button /browse file/i` → filechooser. `input.file-input[type=file]` is `display:none` and **three** exist (one per hidden section), so use the page's own button. Wait for the filename text to appear; without it Next rejects for a missing document with no on-screen reason. `preapp.js:194-210`
5. `#tin` (placeholder `Tax Identification No (TIN)`, optional here), `#showroomAddress` (one textarea), `#showroomPostcode`, `#showroomState`, `#showroomCity`. City stays disabled and single-optioned until `loadCity()` answers: wait on `options.length > 1`, not on `enabled`; an `<option>` is never "visible" to Playwright. Then `#adminName`, `#mobileNo`, `#adminEmail`. `preapp.js:145-162, 248-274`
6. `#nextSubmitBtn` is Next, and relabels itself "Submit and Pay" on the review step. Step one posts behind a "Working…" modal (real ellipsis). "Modal cleared, still on step 1" = refusal; "modal still up at 90 s" = slow staging. Never re-click while posting. The TIN warning (`#tin-error:visible, .invalid-marker`) is non-blocking: press Next once more. `preapp.js:289-428`
7. Review step: `#agreeTerms`, tiles, bank grid — see [flow-payment-channels.md](flow-payment-channels.md) §4a.

### Application Form (`/obs/form/...`, steps 1-3)

1. Step detection: `#to-next-step` carries `data-step` = the **next** step, so current = `data-step − 1`. On step 3 the button is replaced by `button /^submit$/i` and `data-step` is absent. Never count clicks. `src/dealer.ts:85-98`
2. Step 1 ids: `#business-type-<CODE>` (arrives checked + **disabled**), `#companyName`, `#tinNo` (**required** here), `#sstNo` (**exactly 15 chars** when filled; the 11-char TIN stalls step 1 with a message naming neither field), `#showroom-type-OWN`, `#address1/2/3`, `#postcode`, `#stateSelect` (options carry a code, "JOHOR (01)"), `#citySelect`, `#hasAdvertisingPlatform1` (No), `#hasAuctionHouse2` (No), `#isNoAssociation1` (No — the indices differ between groups), `#numOfDirector`, `#directorNameInput`, `#directorMyKad`, `#directorMobile`, `#directorEmail`, `#picName`, `#picMyKad`, `#picMobile`, `#picEmail`. Pre-filled fields arrive disabled; a click on a disabled control burns the full action timeout, so check `disabled || readOnly` first. `src/dealer.ts:136-171; preapp.js:829-861`
3. Advancing is a **cycle**: Next → dialog "You have unsaved changes…" → `button /^save\s*&\s*continue$/i` → re-read the step, up to three times. The anchors stop it matching "Save & Continue Later", which **parks** the record. The TIN check is acknowledge-once: `validateTinAgainstBrn()` stores `tinMismatchAckKey` on the first confirm and passes on the second. `#tinNo-mismatch-error:visible` is the tell. `src/dealer.ts:276-302`
4. Step 2 uploads: every upload is `button:visible` /browse files?\.\.\.|browse file/i over a hidden input. Pick the file type from the surrounding text (`/video/i` → mp4, `/photo|picture|image|stamp|card/i` → jpg, else pdf); the showroom video row rejects a PDF on its `accept`. The MyKad/passport row has a required `Name` textbox (letters and spaces only). `src/dealer.ts:174-225`
5. Step 3: `getByLabel(/same as director/i)` raises "Proceed Confirmation…" → `button /^yes$/i`. Unanswered, its overlay intercepts Submit; a re-click when already ticked toggles it **off**. Fields are matched by placeholder (`/mykad/i`, `/mobile/i`, `/email/i`, `/name/i`). **This form rejects plus-addressed emails** that the pre-app accepted: strip the `+tag`. The declaration is plain text, not a checkbox. `src/dealer.ts:227-272`
6. Submit `button /^submit$/i`. The only proof is text `/successfully submitted/i` ("Success Notification — Your application has been successfully submitted…") → `button /^ok$/i`. A submit once "worked" while two invalid-email messages held the record at Draft. `src/dealer.ts:348-371`

### Registration Documents (step 4)

The step bar is **display-only spans**. The page restores its last step from
localStorage, so a fresh context opens on step 1, and a wait for
/registration documents/ is satisfied by the step-4 *label*. Call the page's own
`window.showStep(4)` (guard on `window.step4Visible`), then assert `#step4` is
visible. Six Browse buttons; Submit = `button /^(submit|submit documents)$/i`;
proof = `/successfully submitted/i` within ~30 s. `src/dealer.ts:376-424`

## Verbatim DOM handles — BackOffice side (phases 3, 5-7, 9)

`[verified: scripts/eauto-duitnow-qr/src/onboarding.ts; src/listing.ts]`

1. **Pre-application listing**: `[name="companyName"]` + `button /^search$/i`; row `tr` filtered by company name. The View link **opens a new tab**; run everything downstream on the popup. `src/onboarding.ts:26-47`
2. **Approve pre-app**: `button /^approve$/i` → `confirm()` (native dialog or `button /^(yes|ok|confirm|proceed)$/i`) → poll up to 20 × 1.5 s for the dealer link while `/^\s*working\.\.\.\s*$/i` is visible, reloading once halfway. Read the link from `textarea, input` values first, then from page HTML via `/https?:\/\/[^"'\s<>]+\/obs\/form\/[^"'\s<>]*/gi`. It must match `/\/obs\/form\//` **and not** `/\/obs\/admin\//`; an anchor-first version once grabbed the admin URL. `src/onboarding.ts:59-112`
3. **Assign (approver)**: `select:not([id$="Hidden"])[name*="assignee" i], select:not([id$="Hidden"])[id*="assignee" i]`. The `:not` guard matters because `#assigneeUserIdHidden` carries the value. **The visible dropdown does not exist on a freshly submitted application** (only UCD Group + Application Status render); defer and assign again after Approved. Options are display names. `button /^save$/i` → text `/updated successfully/i`. `src/onboarding.ts:126-159`
4. **Submit for Approval (assignee)**: `select[name*="ucdGroup" i], select[id*="ucdGroup" i]` → `button /submit for approval/i` → confirm → **reload and assert the button is gone**. `#status` holds Application Status. `src/onboarding.ts:172-203`
5. **Approve application (approver)**: `button /^approve$/i` → confirm → `#status` reads Approved. Never set `#status` directly. `src/onboarding.ts:207-235`
6. **Verify documents (assignee)**: page text `/Application No:/` → `button /^verified$/i` → confirm → text `/verification date/i`. `src/onboarding.ts:239-253`
7. **Application listing search**: `#to-search` (or `button /^search$/i`). Wait for the `admin/form/enquiry/search` response, then `#overlay` hidden, then two identical table signatures 300 ms apart; the "record(s) in total" line is already on the page from the previous search. The empty state is a **row** (`No records found`). Header keys read punctuation-loose: `application no`, `company name`/`company business name`, `application status`/`status`, `hardcopy acc created`/`hardcopy doc`, `application created date`/`created date`, `application expiry date`/`expiry date`. Match Application No **exactly against its column**: `NA6800110` is a substring of `NA68001100`…`NA68001109`. Row Edit link: row `nth(index)` → link `/^edit$/i`, opens a new tab. Dates parse as `YYYY-MM-DD[ HH:mm]`. `src/listing.ts; src/onboarding.ts:267-270`

## Unique-identity scheme (12257 port)

`buildIdentity()` in `scripts/eauto-duitnow-qr/src/identity.ts`: stamp
`yymmdd-hhmm` + 3-digit on-disk counter `.seq` (git-ignored). Generated: company
`"<OWNER> QA12257 <stamp>-<seq> ENTERPRISE"`, licence `KCH/<7 digits>` (Sarawak)
or `KK/<7 digits>` (Sabah), TIN `C<10 digits>`, SST `W<digits>00` cut to 15,
admin email `<prefix>+<stamp>-<seq>@<domain>` (director/PIC with `+dir`/`+pic`),
mobiles `01…`/`012…`/`013…` cut to 10, MyKads `90…`/`91…` cut to 12. Not
unique: address "Lot 12, Jalan QA, Taman Automation", postcode
`93100`/`88000`/`50450`, state/city `SARAWAK/KUCHING`, `SABAH/KOTA KINABALU`,
`WILAYAH PERSEKUTUAN KUALA LUMPUR/KUALA LUMPUR` (SSM types are not state-bound).
Run label `qr-<stamp>-<seq>`; the identity is printed as `[identity] {json}` and
the run route parses it back. `[verified: src/identity.ts:99-167;
app/api/eauto-duitnow-qr/run/route.ts:184]`

## What each 12257 scenario drives and asserts

| Scenario | Dealer context | BO contexts | Asserts |
|---|---|---|---|
| `12257_TS01` | one long-lived page: gate → pre-app paid by QR | none | text `/payment\s*success\|successfully\s*paid/i`; a `P\d{6}/\d{4,6}` reference; body contains `108.00` |
| `12257_TS02` | gate → pre-app paid by **FPX** → application form → registration docs → fee paid by QR | fresh context per BO phase, closed after | `/application payment success\|payment status:?\s*paid/i`; body contains `990.00`; listing Application Status `/approved/i` |

`[verified: scripts/eauto-duitnow-qr/tests/happy-flow.spec.ts]` BO phases never
touch the dealer page, which carries the passed reCAPTCHA session. Neither
scenario has run live.

## Known defects on this flow

### EAINT-12414 — Pre-Application Form resets to Step 1 on reload; no error for a failed card payment

1. **Ticket:** "🔴[eAuto - Onboarding] Pre-Application Form - Resets to Step 1
   on reload & no error shown for failed Credit/Debit Card payment". Task,
   Medium, To Do at capture, reporter Boo Jin Siang, Developer field Mong Guo
   Hao, no attachments, no SRD. Raised 2026-09-29. Sources in
   `_reference/tickets/EAINT-12414/` (Jira capture, Teams thread, scope brief).
   It is an onboarding ticket, not JomCheck.
   `[from ticket EAINT-12414 — _reference/tickets/EAINT-12414/EAINT-12414-jira-ticket.md]`
2. **Defect 1 — reload drops to Step 1.** Reloading or reopening a saved
   Pre-Application Form drops the applicant to Step 1 ("A list the page needs
   while loading is set up only after the loading has already started").
   Expected: restore the step reached. `[from ticket EAINT-12414]`
3. **Defect 2 — failed card payment, same tab.** A failed Credit/Debit Card
   payment that returns to the **form tab** (not the popup) shows no message,
   unticks the declaration and hides the payment methods. Expected: land on
   Step 2 showing verbatim "Unsuccessful Payment - Something went wrong and
   your payment didn't go through. Please choose a payment method and retry.",
   declaration still ticked, payment methods shown. The popup path already
   showed the message. `[from ticket EAINT-12414]`
4. **Dev scope** (Mong Guo Hao, Teams 29/09 16:06): "Type of Business
   selection when preapplication page is reloaded"; "Failed card payment:
   lands on step 2 with T&C ticked, payment methods shown and the banner";
   "Successful card payment and successful FPX payment".
   `[from Teams, EAINT-12414 CR chat, captured 2026-09-30]`
5. **Scope decisions** (Faizuddin, 2026-09-30): defect testing on the
   Pre-Application only; FPX regression on Personal only, because FPX B2B was
   not deployed as of 2026-09-30; one happy-path regression through all 11
   phases. Fix under review at that date: eauto-onboarding MR !331. The
   environment chosen for this ticket is recorded in the ticket's own files,
   not here. `[from ticket EAINT-12414 teams-thread file]`
   `[from EAINT-12414-teams-thread-2026-09-30.md, Faizuddin scope decisions]`
6. **Release:** deployed 2026-10-09 with EAINT-12461, dev-tested only, no QA
   (supersedes "fix under review"). See [releases.md](releases.md).
   `[from Teams via memory digest, 2026-10-14]`

Payment-step detail (tiles, return paths, the refresh-must-not-re-show-banner
rule): [eauto-payments.md](eauto-payments.md) § UCD onboarding payment and
[flow-payment-channels.md](flow-payment-channels.md) §4 and §7.

### EAINT-12221 / EAINT-12299 — uploaded file names with Chinese characters break BO [Create Account] (added 2026-10-27)

1. **Production defect, patched by hand (EAINT-12221, Done).** The onboarding application status stayed "Pending Assignee" after Ops created the company account. Jira: "The onboarding application status remains \"Pending Assignee\" after OPS created the company account for the UCD." The patch: "a. Rename file name with Chinese char to valid file name b. Ensure BO can edit Account details after clicking [Create Account] button". "Completed on 20 August 2026." `[from ticket EAINT-12221, Jira description, read 2026-10-26]`
2. **Cause (EAINT-12299, Jira "Existing Issue/Behaviour"):** "1. BackOffice is unable to edit any field after clicking [Create Account]. 2. This issue happens occasionally. 3. Root cause: UCD potentially uploaded a file with Chinese characters to Jira. 4. As per checking, there are plenty of users who uploaded files with Chinese characters." `[from ticket EAINT-12299, Jira description, no SRD]`
3. **Planned fix (EAINT-12299, not live at 2026-10-26):** "Rename the file name on the spot after the user uploads the file, in both Pre-Application and Application." Chinese becomes Hanyu Pinyin ("扫描全能王.pdf" → "sao miao quan neng wang.pdf"), see [teams-decisions-by-ticket.md](teams-decisions-by-ticket.md) § EAINT-12299. The developer also added "some extra handling on other language as well"; those rules are not in the repo. `[from ticket EAINT-12299; from Teams EAINT-12299, 2026-09-17 11:13, dev]`
4. **Test data trap until the fix is live:** an onboarding test that uploads a Chinese-named file can leave the BO record un-editable after [Create Account]. `[unconfirmed — inferred from items 1-2, not seen on staging]`
5. **Upload points named for test scope (Miro card, verbatim):** "Flows" "Pre-Application", "Application", "Registration Document"; "Functional Test Scenarios" "Upload", "Download", "View"; "Issue trigger point: Create Account button in BO". Jira names only Pre-Application and Application. `[source: Studying EAINT-12299 miro-card, captured 2026-10-26]`

## Business rules from past CR test scripts

Tested expectations from the team's SharePoint CR scripts, not verified against
the running system. Check the live system or the newest SRD before one drives a
decision. Fuller list: [business-rules-from-test-scenarios.md](business-rules-from-test-scenarios.md) §12.

1. **Type of Business (EAINT-5972).** SSM Registered: "Sdn Bhd / Bhd - Sole
   Proprietorship / Partnership - LLP"; Non-SSM Registered: "Business Trading
   (Sabah) - Business Trading (Sarawak)" `[from SharePoint TS #048 EAINT-5972,
   10164 & 11763, sheet EAINT-5972, row 3]`. SSM types show Old BRN and New BRN
   (either one is enough) `[rows 4, 7-9]`; Non-SSM types show "Business Trading
   License No" and a Trading License upload `[row 5]`. Empty fields: "This field
   is required" `[rows 10-12]`.
2. **TIN mismatch warning.** A TIN that does not match the BRN shows "The TIN is
   invalid. This may affect e-Invoice submission. Click "Next" to proceed." and
   lets the user continue on the second Next `[from SharePoint TS #048
   EAINT-5972, 10164 & 11763, sheet EAINT-5972, row 23]`. This is the
   non-blocking `#tin-error` warning in the Pre-Application DOM handles above.
3. **UCD Group (EAINT-10164).** The assignee picks one of "Corporate,
   Association, Authorised Dealer, UCD, Motor, Recon" before Submit for
   Approval; required; hidden after submit; pre-filled and locked on Create New
   Company `[from SharePoint TS #048 EAINT-5972, 10164 & 11763, sheet
   EAINT-10164, rows 3-8]`. BO Company listing column "UCD Group" sits between
   "Company Type" and "Block STMS Transaction"; "-" when none `[rows 20, 28]`.
4. **ROC directors (EAINT-11763):** number and names "auto selected & auto
   populated respectively based on director(s) data from SSM Document"
   `[from SharePoint TS #048 EAINT-5972, 10164 & 11763, sheet EAINT-11763, row 3]`.
5. **Application expiry cronjob (EAINT-11829):** "Cronjob updates Application
   Status to "Expired" after 90 days - Application Status = Expired - Expired
   email notification received - OB link → Application Link Expired popup
   displayed → Redirect to Application Link Expired page" `[from SharePoint TS
   #014 EAINT-11536, sheet EAINT-11829, row 3]`; already Expired → no second
   email `[row 11]`; Rejected stays Rejected and Approved stays Approved, no
   expiry email, the link opens Application Payment Success `[rows 13-14]`.
6. **Approved Date / TAT columns (EAINT-11536):** format "DD MMM YYYY HH:MM
   AM/PM (e.g. 3 Dec 2025 1:02 PM)"; "TAT = Approval Date - Submission Date";
   "-" while not approved or rejected `[from SharePoint TS #014 EAINT-11536,
   sheet EAINT-11536, rows 4, 12-13, 17]` (sheet rows 4-20 cover the columns).
7. **Showroom edit (EAINT-11978):** the Application pre-fills Showroom Address,
   Postcode, State, City from the Pre-Application; UCD cannot pick "No
   Showroom", BO can; editable in Pending, KIV, Revise; "If status = Pending
   Approver, cannot do any changes"; the Pre-Application record is unchanged
   `[from SharePoint TS #027 EAINT-11978, sheet Test Script, rows 2-9]`.
8. **No [Verify] step (EAINT-11979):** "[Activate] is disabled/unavailable
   until [Save] is completed"; accounts are created with Save > Activate only
   `[from SharePoint TS #028 EAINT-11979, sheet Test Script, row 2]`.
9. **Approval emails (EAINT-12341)** `[from SharePoint TS #041 EAINT-12341,
   sheet Sheet1]`:
   1. "Trigger | Application approval only. Pre-Application approval is not a
      trigger" `[meta row 5]`.
   2. The UCD receives the RHB Account Registration Guideline email, CC
      apply@eauto.my, subject "RHB Online Account Opening - [Application No] -
      [Company Name]" or "RHB Branch Account Opening - …" `[rows 13-14]`.
   3. A foreign director (Sdn Bhd) or non-Malaysian partner (LLP) gets Email
      Template 2 `[rows 21, 26]`.
   4. RHB Support receives the Appointment Letter email, To
      BIS.Support@rhbgroup.com, CC the UCD email and apply@eauto.my, subject
      "Approved eAuto Registration - [Company Name] - [BRN Number]", letter
      attached `[rows 30-32]`.
   5. "The existing approved application email carrying the 3 RHB documents
      (Offer Letter, Direct Debit Application form, Board of Resolution) is no
      longer sent" `[row 36]`.
   6. Deployed 2026-10-07 AM; Ops confirmed the emails were received.
      `[from Teams via memory digest, 2026-10-14]`
10. **RHB Offer Letter sample in the onboarding email (EAINT-12219):** Sdn
    Bhd/ROC "S1.1 RHB Sdn Bhd OL with BOD Reso Reflex Cash Management
    Application.pdf"; ROB "S1.1 RHB Enterprise OL with Checklist.pdf";
    numbering S1.1, S1.2 … unchanged `[from SharePoint TS #037 EAINT-12219,
    sheet Test Scenarios, rows 2-3, 7]`.

## Live end-to-end walk-through, staging, 2026-10-21 (Sdn Bhd, by hand)

Driven by Claude in Chrome, payment and CAPTCHA by Faizuddin. Every page saved in
`_reference/html/eauto/obs-*.html` (+ `bo-home-mfared-uat4.html`), Fiuu in
`_reference/html/fiuu/`, eSIM in `_reference/html/esim/`. `[verified: live run]`

| # | Actor | Page / URL | What happened | Key handles |
|---|---|---|---|---|
| 0 | eSIM | `/esim/ssm-enquiry-resp/new`, `/esim/ssm-roc-submission-resp/new` | Rows #278 + #173 for `KT0307773-P` / `201203099294` | see esim.md § SSM seeding |
| 1 | UCD | login `Apply eAuto` → `/obs/preOnb/recaptcha` | human ticks reCAPTCHA | — |
| 2 | UCD | `/obs/preOnb/form` | Sdn Bhd, name `UDIN ONBOARD TESTING SDN0001`; 1st Next = TIN warning (non-blocking), 2nd Next → review | `#businessName #oldBrn #newBrn #tin #showroom* #adminName #mobileNo #adminEmail #nextSubmitBtn` |
| 3 | UCD | `/obs/preOnb/form/<uuid>` review | tick `#agreeTerms` → tiles `#payment-credit`, `#payment-fpx-personal`; FPX Maybank, Submit and Pay | `input[name=bankSelection]` |
| 4 | UCD+Fiuu | popup window | login, Request TAC, `select#status_code` Approved, Pay Now (human) | fiuu captures |
| 5 | UCD | `/obs/preOnb/summary/<uuid>` | **P261021/00889**, Payment ID `P261021000938`, Paid, SSM Document button | — |
| 6 | BO mfared | `/uat4/public/login/` → menu UCD Pre-Application Listing → `/obs/admin/preOnb/enquiry` | search `#preOnboardingNo` + `#to-search`; row SSM Status OK, LHDN Failed, Status New | `View` opens new tab |
| 7 | BO mfared | `/obs/admin/preOnb/summary/<uuid>` | Approve → jQuery dialog "Are you sure to approve the Pre-Application?" Yes → `Copy Link` appears | page warns "The company and director existed in eAuto system" (director IC reused) — non-blocking. Avoided from 2026-10-22: each run makes a new director MyKad, "20" + 10 random digits (no real MyKad starts with 20; Faizuddin) |
| 8 | UCD | Application Link `/obs/form/<uuid>?id=<oldBRN>&s=<sig>&v=1` | extract with `&amp;`→`&` decoded or you get **403** | — |
| 9 | UCD | step 1 Business Information | prefilled; tick `#isNoAssociation1`; `Next` → **"Unsaved Changes" dialog → Save & Continue** (every step) | — |
| 10 | UCD | step 2 Upload Files | SSM pdf auto-attached; director from eSIM; upload `#director-identity-browse-file1`, `#showroom-pic-input-1..4`, `#showroom-vid-input` (mp4), `#upload-business-card-input`, `#upload-business-stamp-input` | fixtures `scripts/eauto-onboarding/fixtures/uploads/` |
| 11 | UCD | step 3 Acknowledgement | `#directorMobile`, `#directorEmail`; `#eInvoicePersonInCharge` ("Same as Director") copies + locks e-Invoice PIC; Submit → Unsaved dialog → success "Your application has been successfully submitted" | — |
| 12 | BO | menu UCD Application Listing → `/obs/admin/enquiry` | **NA60001190**, Pending, auto-assignee CHARMAIN QA0735 (mfared can still act) | `Edit` → `/obs/admin/form/edit/<uuid>` (new tab) |
| 13 | BO mfared | edit page | `#ucdGroup` = Authorised Dealer → `#to-submit-for-approval` → dialog Yes | — |
| 14 | BO jasons | same edit page | `#to-approve-ucd` → dialog "Are you sure to approve the application?" Yes → **Registration Documents** tab appears | re-enter /obs via the menu after switching BO user |
| 15 | UCD | step 4 Registration Documents | 6 required uploads: `#upload-rhb-offer-letter-input`, `#upload-rhb-direct-debit-input`, `#upload-rhb-bod-reso-input`, `#upload-rhb-bank-statement-input`, `#upload-eauto-bod-reso-input`, **`#upload-lhdn-tax-cert-input` (not in TS)**; Submit → Unsaved → success. **Sole Prop / Partnership** replaces the two BOD Reso with `#upload-rhb-loa-input` ("RHB LoA e-TukarMilik") and `#upload-eauto-loa-input` ("eAuto LoA e-TukarMilik") [verified: trace of 12153_TS02 run, 2026-10-23 — Submit refused while both were empty] | — |
| 16 | BO mfared | `/obs/admin/form/edit-registration-doc/<uuid>` | `#to-submit-verified` → "Ready for UCD to post the registration documents?" Yes → Verification Date shown | Yes fires `POST /obs/admin/form/edit/verify-softcopy-documents`; **wait for its reply before closing the tab**. 12153_TS03 (2026-10-23, NA60001197) closed the tab 2.5 s after Yes, the request was cancelled (trace status -1), Softcopy Docs stayed "Pending Assignee", and the dealer link stayed on page 4 with no Payment step [verified: trace + live BO 2026-10-23] |
| 17 | UCD | step 5 Payment | **RM 1,500.00** (850 + 601.85 + 48.15); tiles card / FPX Personal; Submit & Pay → Fiuu (human) | — |
| 18 | UCD | same URL | "Application Payment Success", Payment ID `A261021000205`, FPX Hong Leong, PAID | — |
| 19 | BO | Application Listing | Approved, Softcopy Docs Checked, **Registration Fee OK**, Hardcopy & Acc Created **Pending UCD** | — |

Traps found on the way:
1. **BO logout uses native `confirm("Sure to logout?")`** — it freezes Chrome automation. Navigate to `/uat4/user/logout.do` directly.
2. BO user switch: after logging in as another user, open the onboarding listing from the BO menu once (re-issues the /obs session) before opening `/obs/admin/...` URLs.
3. `/obs/admin/form/enquiry` is not a page — the listing is `/obs/admin/enquiry`.
4. Business Info Review → `#nextSubmitBtn` text "Submit and Pay"; step 5 button "Submit & Pay".

**Other business types (decision, Faizuddin 2026-10-21):** not run end to end by hand.
They differ only in the eSIM SSM setup and the step-1 inputs, so the automation takes
both from Azila's 12341 code (eauto-qa-gpt `consolidate-azila`,
`azila-source/by-ticket/eaint-12341-onboarding-document-preparation/automation`):
`src/data/ssm-seed.ts` + `src/data/ssm.ts` (ROB `businessInfo`/`currentOwnerInfo`,
LLP `involvements`, item type B/L), `src/pages/obs/pre-application.page.ts`
(trading: `#businessLicenseNo` + trading-licence upload, state locked to region).
The rest of the chain is the Sdn Bhd walk-through above.

## Automation — `scripts/eauto-12153` (built 2026-10-21, not yet run)

Dashboard `/eauto/12153`, routes `app/api/eauto-12153/{run,download-all,history,companies}`.
One Playwright test per official TS (`12153_TS1`–`TS8`, SharePoint v38); each test is the
whole chain above. `[from code, unrun]`

| Chain step | Code |
|---|---|
| eSIM SSM rows (SSM types) | `pages/EsimSsmPage.ts` — eSIM forms, not an API (see esim.md) |
| Login → Apply eAuto → reCAPTCHA (person) | `pages/PreApplicationPage.ts` `openFromLogin` / `waitForCaptcha` |
| Pre-Application form, review, declaration | `PreApplicationPage.fillForm` / `next` / `tickDeclaration` |
| Method + bank tiles, Submit and Pay, result | `pages/PaymentPage.ts` (shared by review page and step 5) |
| Fiuu FPX simulator / card form | `pages/FiuuPage.ts` — host-locked to `bank-simulator.fiuu.com` |
| BO listings, approve, submit, verify | `pages/BoPage.ts` (assignee + approver in their own browser context) |
| Application steps 1–4 | `pages/ApplicationPage.ts` |
| Orchestration (TS columns C, D/E, F1–F8, G/H) | `utils/chain.ts`, `utils/paymentLeg.ts` |

Decisions baked in (Faizuddin, 2026-10-21):
1. TS1–TS4 (B2B): staging had no B2B tile on 2026-10-21 (`B2BNotAvailable`). **B2B deployed to
   staging 2026-10-22** (Faizuddin: "b2b deployed now"). TS1–TS2 now run the full chain; the
   Business bank is picked by B2C value, else by bank name on the tile (`chooseBusinessBank`), and
   the first run logs every Business tile and saves `b2b-payment-methods.html` to evidence.
   TS3–TS4 stop at the authoriser approval: that screen is not captured. `[from code, unrun]`
2. Company per TS typed on the dashboard row, or picked from the Company Details Checker
   results (`overall: PASS` = all three numbers absent from eAuto).
3. Card legs reuse the 12107 Fiuu card + 3DS code. `[unverified on /obs]`
4. "Failed" FPX = status `51` Insufficient Funds; B2B pending = `99`.
5. e-Invoice download is a soft check: no e-Invoice control was seen on either success
   page (the page says it is emailed).
6. Step 2 uploads click each input's own "Browse Files..." button (the button is the
   input's preceding sibling in every capture) and answer the file chooser.

**Revisit while B2B payment is pending (Faizuddin, 2026-10-21).** On staging the
tester never needs an email: the Application link is shown in BO (Copy Link) and the
pending page is reopened from the same URL. "Reopen the page from the email link" in
12153_TS3 is production behaviour (UCDs get the link by email). The wording came from
Claude's "Suggestion by Claude" workbook and was carried into the official TS v38
(row 6, column D step 6 / column G step 6). The suite reopens the same URL in a new tab.

**eAuto login page, `/eauto` instance (2026-10-21).** `#form-username` (name `name`),
`#form-password` (name `pass`), button "Login"; "Apply eAuto" is
`<button onclick="doPreOnboard()">` → `window.location = "/eauto/public/getPreApplicationUrl.do"`,
same tab, which then lands on `/obs/preOnb/recaptcha`. `[verified: live HTML,
_reference/html/eauto/eauto-public-login-staging-eauto.html]`

**EAINT-12257 — `scripts/eauto-12257`, page `/eauto/12257` (2026-10-21).** Split from the
12153 suite the same day (Faizuddin: "seperate 12257 and 12153"): a copy of
`scripts/eauto-12153` with its own spec, `E12257_*` inputs, routes and page; the onboarding
chain is the same, so a fix to one usually belongs in the other. Company-name counters
are shared between the two pages. `tests/12257.spec.ts` runs official TS v19
(12257_TS1–TS9, TS11) through `utils/chain.ts`. DuitNow legs: `utils/qrLeg.ts` +
`PaymentPage.chooseDuitNow` / `submitForQr`. A person scans on the phone
(`https://bank-simulator.fiuu.com/duitnow/viewqr`, Success / Rejected); the script
clicks Cancel Transaction (TS3), closes the QR window (TS4) or waits out the 03:00 timer
(TS5) itself, then checks "Unsuccessful Payment" and retries with Success. The TS step
"Check the transaction payment status in BO" is skipped: no BO listing has a payment
status and 12257 does not touch BO (Faizuddin, 2026-10-21). The DuitNow tile is
looked for as its own method tile and as a tile in the Personal bank list (TS1 D1 says
"Select Online Banking (Personal), then select DuitNow QR"). The QR screen's HTML is
saved to evidence on every run. `[from code, unrun — DuitNow not on staging]`

## Create Pre-Application tool — `scripts/eauto-preapp`, page `/eauto/preapp` (2026-10-21)

Faizuddin: "create a preapplication, where i can choose the payment pass or failed for
now. later i will tell you what else i can choose. as for the business type, make it
always use sdn bhd. basically this function is to create a quick transaction to check
the listing". An eAuto module page (`lib/eautoModules.ts`), not a ticket page.

1. **Suite:** a copy of `scripts/eauto-12153` (pages, utils, config with the env
   prefix renamed `E12153_` → `EPREAPP_`); only `tests/preapp.spec.ts` is new. Its
   steps are chain.ts's Setup + Initial Steps + Pre-Application payment, unchanged.
   `utils/paymentLeg.ts` exports `attempt()` so a single failed attempt can stop there.
2. **Choices:** business type fixed to Sdn Bhd / Bhd (`ROC`). Bank: any FPX (B2C) bank in
   `BANKS`, picked on the dashboard (`EPREAPP_BANK`), default Maybank (Faizuddin, 2026-10-21:
   "can choose bank, but make the default Maybank"). Payment Success
   (`PREAPP_PASS`) = FPX Personal, chosen bank, status Approved → "Pre-Application Submitted
   for Review", Pre-Application No read, SSM document saved. Failed (`PREAPP_FAIL`) =
   status 51, one attempt, "Unsuccessful Payment" checked, left unpaid, no retry.
3. **Stops after the payment:** no BO approval, no Application form.
4. **Inputs:** company old BRN / new BRN / TIN typed or picked from the Company Details
   Checker list; name off the SDN counter shared with 12153 / 12257
   (`eauto_12153_name_counters`). eSIM seeding on by default (VPN prompt).
5. **Not yet known:** whether a Pre-Application whose payment failed gets a number and
   shows on the BO Pre-Application listing. The FAIL run reads a number if the page
   shows one and does not assert it. `[from code — not run live]`
6. **Checked 2026-10-21:** route → spec → result works end to end. A run with no BRN stops
   at once with "Old BRN is blank — type it on the /eauto/preapp dashboard." No live
   Pre-Application has been made with it yet.

### Shared company Excel (2026-10-22)

Onboarding pages (`/eauto/12153`, `/eauto/12257`, `/eauto/preapp`) take their companies from one dropped Excel, not typed BRNs. Faizuddin, 2026-10-22: "read the details from an excel i drop instead of manually typing in the business type details".

1. **File:** the Company Details Checker export he keeps, e.g. `_reference/inbox/ROC_New ROC_TIN Checked 20_10_2026.xlsx`. Columns: Company ROC, ROC Status, New Company ROC, New ROC Status, TIN Number, TIN Status, Overall. It has no business type, name or director.
2. **Business type:** taken from the New ROC's SSM entity code (digits 5–6): 01 = Sdn Bhd / Bhd, 03 = Sole Prop / Partnership, 04 = LLP `[verified: eSIM LLP row #2 "AZ YC GROUP PLT", LLP0031001-LGN / 202204000729, 2026-10-23]` (06 unconfirmed). The 20_10_2026 file holds 70 company rows (26 PASS), 77 business rows (15 PASS) and 1 other. The same ROC can appear twice with a different New ROC (CA0254487-W), so a row's identity is roc|newRoc|tin.
3. **Code:**
   1. `app/api/onboarding-companies` stores the list in `data/onboarding/companies.json` (gitignored).
   2. `lib/onboardingCompanies.ts` holds the hook and `spend()`; `lib/onboardingCompanyTypes.ts` holds the parsing.
   3. `components/OnboardingCompanyDrop.tsx` is the drop zone.
   4. Spent rows go to the existing cross-ticket ledger `lib/companyUsageLedger.ts` (browser storage) when a run is queued.

### Application step 3 — director pre-filled and locked (2026-10-22)

1. **Locked director:** with one SSM director (eSIM-seeded), step 3 shows the director's name already filled in and disabled: `input#directorNameInput` disabled, value "PEACH DIRECTOR A". The automation only reads it. It types into `#directorNameInput` / `#directorMyKad` only when they are editable, and picks from `#directorNameDropdown` when there are several directors. `[verified: 12257_TS1 run log, 2026-10-22]`
2. **Run log as seen:** the same run passed the DuitNow QR Pre-Application payment, the BO approval, and Application steps 1–2. Each of step 1 and step 2 raised an "Unsaved Changes" dialog, which was confirmed.

### Saved eAuto browser (reCAPTCHA once) — 2026-10-22

1. The eAuto browser in 12153, 12257 and Create Pre-Application opens one saved Chrome profile, `data/browser-profile/eauto-onboarding/` (gitignored), via `utils/savedBrowser.ts` `openEautoContext()`. Colleagues reported this lets a person tick the reCAPTCHA once (Faizuddin, 2026-10-22). `[unverified on eAuto; cookies confirmed to persist between launches, smoke test 2026-10-22]`
2. `waitForCaptcha()` already returns at once when `#businessName` shows, so no other change was needed.
3. BO, eSIM, the "close the browser and reopen" and "second session" checks stay fresh contexts: those TS need no cookies.
4. If the profile is in use by another run, the run falls back to a fresh browser and logs it.
5. To start fresh, delete the folder.
6. **Superseded later the same day: installed Chrome, signed in to Google.** Faizuddin: "the run logs didnt used the save profile i think, because got no gmail user at the top right, and i need to do recaptcha every time". The profile WAS used (cookies written 16:35); the cause is that Playwright's bundled Chromium can never be signed in to Google, so reCAPTCHA treats it as a blank browser. Dev declined reCAPTCHA test keys on staging (Faizuddin, 2026-10-22: "i ask dev already and they said unable to provide the test key").
   1. `openEautoContext()` now launches the **installed Google Chrome** (`channel: 'chrome'`) on `data/browser-profile/eauto-onboarding-chrome/`. The old `eauto-onboarding/` folder is no longer used and can be deleted.
   2. Sign in once: the 12153 / 12257 / Create Pre-Application pages show "Open eAuto browser to sign in" under "reCAPTCHA wait" (`components/EautoBrowserSignIn.tsx` → `app/api/eauto/browser-profile`). It opens a NORMAL Chrome window on that profile at accounts.google.com, because Google refuses sign-in inside a browser that automation controls. Close the window before running; while it is open a run falls back to a fresh browser and logs it (Chrome holds `lockfile` while a profile is open — verified by smoke test).
   3. The run log's "eAuto browser:" DETAIL line names the signed-in Google account.
   4. `[unverified]` that a signed-in profile turns the reCAPTCHA into a single tick on eAuto staging, and that Google keeps the account signed in when Playwright opens the profile. Check the first run after signing in.

### Company usage tracked on the server — 2026-10-22

Spent onboarding companies are stored in `data/onboarding/usage.json` (API `app/api/onboarding-companies/usage`), merged with the older browser ledger (`eauto_ucd_company_usage`); browser-only entries are sent up the first time a page loads. Each 12153 / 12257 TS row has a shuffle button (random free company of the row's type, never one on another TS row). "Used companies" under the Excel drop lists them, with "Free again". Faizuddin: "make it i able to shuffle the company details. and the system itself will keep track of what's used, and whats not".

### "Unable to generate the application link for this potential UCD." = company already onboarded (2026-10-23)

BO Approve on P261023/00903 (12153_TS02, Sole Prop MA0248268-X / 202003036253) returned HTTP 400
from `/obs/admin/preOnb/application/approve.do`: `{"message":"Unable to generate the application link
for this potential UCD.","success":false}`; the page shows it in an "Error" dialog and the status stays
NEW. Cause: the same company (same New ROC) was already approved on staging as **P260702/00678
"TEST SP NICK2", approved 2026-07-02**. Editing the eSIM ROB row (ownership SOLE PROPRIETORSHIP, valid
IC/DOB) did not change the result. `[verified: BO enquiry JSON + approve response, 2026-10-23]`

A "PASS" row in the Company Details Checker list can still be an onboarded company. Of the 184 PASS
rows (ROC_New ROC_TIN Checked 20_10_2026), two had another tester's earlier approved Pre-App:
MA0248268-X (P260702/00678) and 1205413-T (P260810/00741 "FAIZUDDIN TEST 11978 TS01", 2026-08-10).
Before using a company, search BO `/obs/admin/preOnb/form/enquiry/search` (JSON `records[]`,
`newCompanyRoc`, `status`) for its New ROC; any earlier row means do not use it.
`[verified: BO enquiry, 856 records, 2026-10-23]`


## Additions from the 2026-10-23 flows study

Source: lib/eautoFlows/modules/*.ts (data mirror for /eauto/flows). Only facts not already in this file.

- Approving an Application is limited to a hard-coded approver list in prod code (AuthorisedUserList.obsApprover); reassigning needs the EDIT_ASSIGNEE permission. [askeauto: Q1 prod code 2026-10-23]
- Login allowed only when CompanyStatus is Activated; New, Inactivated, Rejected, Terminated block login. [askeauto: Q2 prod code 2026-10-23]
- ObsLinkExpirationScheduler.checkExpiredLinks bulk-expires overdue Applications (unless Registered) and sends link-expired emails; PreObsEmailScheduler / ObsEmailScheduler resend unsent submission and payment-success emails. [askeauto: Q1 prod code 2026-10-23]
- BO BYPASS BIOID / REVERT BYPASS / REMOVE: column shows 'Verified at <date time>', 'Bypass at <date time>' or '-'; link shown only to named assignees; when every director is done an email 'Bio ID Completed' goes to apply@. [azfar: cr/_boards/miro-preapp-application/t28_3458764654597856600.tsv]
- Email 'RHB Islamic Account Linked with JPJ' goes to the Main User (CC apply@). [azfar: cr/_boards/miro-preapp-application/t16_3458764654474369943.tsv]
- MVD Agreement: Name = main user, Date = today, [Insert Company Name] = UCD company; ticking the box shows the Thumbprint Verification section. [azfar: cr/_boards/miro-preapp-application/t21_3458764654342573093.tsv]
- Test data may use the same IC for all directors; BA agreed to keep this. [azfar: cr/_boards/miro-preapp-application/board.md]
- Extend: visible to the Assignee; permission for other BO users unknown; [unconfirmed] audit trail unknown. [azfar: cr/_boards/miro-preapp-application/board.md]
- Many prod patches extend expired Applications one by one (EAINT-12243, 12360 to 12382); one-off data jobs, not a flow. [jira: EAINT-12243]
- SSM error popups: 'SSM e-Info is currently experiencing intermittent connectivity...', 'SSM (eAuto) server down, please try later.'. [azfar: cr/_boards/miro-preapp-application/t38_3458764650939412742.tsv]

## "LHDN e-Invoice validation service is temporarily unavailable" = company already used (2026-10-23)

1. **Where:** Pre-Application form, after Next. A jQuery dialog titled "Service Unavailable", text in `#custom-dialog-content`: "The LHDN e-Invoice validation service is temporarily unavailable. Please try again later." Its overlay then blocks `#nextSubmitBtn` [verified: trace of 12153_TS03, NS0267086-M / 202203064011, 2026-10-23].
2. **Meaning:** the company details are already used (Faizuddin, 2026-10-23: "means the details are already used"), not an LHDN outage.
3. **Automation:** `PreApplicationPage.failIfCompanySpoiled()` (12153, 12257, preapp) stops the run at once and prints `COMPANY_SPOILED:{roc,newRoc,tin,...}`. The run route passes the log to `lib/server/companySpoiled.ts`, which marks the company confirmed-used in `data/onboarding/usage.json`.

## Fake LLP when the Excel has no LLP (2026-10-23)

1. **Why:** the Company Details Checker Excel has no usable LLP row. Faizuddin, 2026-10-23: "if make fake one we can continue. just that we wont have e-invoice, which is not a problem for now".
2. **How:** `fakeLlp()` in `lib/onboardingCompanyTypes.ts`. Old BRN `LLP9` + 6 digits + `-LGN` (not split for a check digit, `splitBrn()` needs one letter), New BRN year + `04` + 6 digits, **no TIN**. The 12153 / 12257 pages fill it on any LLP TS row with no free LLP, and the shuffle button makes a new one; a used fake is replaced.
3. **Expected:** eSIM is seeded with the fake numbers, so SSM passes. No TIN, so no e-Invoice.
4. **Unproven:** eSIM must have an LLP submission row to copy (`/esim/ssm-llp-submission-resp`; donor = `E12153_ESIM_DONOR_LLP` or the first row whose remark mentions Azila). LLP has never gone past the Pre-Application in any automation (ours or Azila's), so step 4 documents, BO Verified and step 5 are unseen for LLP.
5. **Update 2026-10-23:** the LLP people tags are confirmed (`knowledge/esim.md` "LLP submission row `involvements`"). 12153_TS04 first stopped in eSIM seeding on the guessed tags; fixed in `utils/ssmXml.ts`.
6. **Rule — fake details: no TIN on the Pre-Application** (Faizuddin, 2026-10-23: "for any TS that uses fake details, do not input in the TIN number, since the TIN is optional"; "FOR PRE-APP AND APP ONLY, THIS RULE NOT APPLICABLE FOR OTHER MODULES"). The Pre-Application skips `#tin` (`*_TIN` blank, `*_FAKE_COMPANY=1`).
7. **The Application requires a TIN** [verified: 12153_TS04 screenshot 2026-10-23, P261023/00909 — `#tinNo` blank → "This field is required", Next refused 5 times]. Faizuddin, 2026-10-23: "choose TIN from the excel, but it must not have any unused ROC/New ROC. because the TIN with unused ROC and New ROC must be saved for other scenarios". `tinFromUsedRow()` (`lib/onboardingCompanyTypes.ts`) picks a TIN from a row that is Overall FAIL (already in eAuto) or spent in the ledger, any business type (Faizuddin, 2026-10-23: "the TIN for LLP doesnt have to tally, any TIN from any types of business can use. just make sure its not from the one with all free"); the dashboard shows it in the amber note and sends `*_APP_TIN`; the chain types it on Application step 1 only.

## Pre-run BO company check (2026-10-23)

1. **What:** before eSIM, every SSM-type run (12153, 12257, preapp) signs in to BO as the assignee, opens UCD Pre-Application Listing, and searches `#newBRN` then `#oldBRN` (the ROC without its check letter). Any row = the company was used before. `utils/boCompanyCheck.ts`.
2. **Used company:** the run logs the Pre-Application Nos found, saves a screenshot, prints `COMPANY-SKIP` (dashboard spends it) and `COMPANY_SPOILED` (run route marks it confirmed-used), and moves to the next alternate from the Excel. None free = the run stops before eSIM.
3. **Limits:** it only finds companies with a Pre-Application in the BO listing (unpaid Pre-Applications are not listed). It does not catch the LHDN "temporarily unavailable" case; that is caught on the form (`failIfCompanySpoiled()`). An alternate that eSIM later swaps in is not BO-checked.
4. **Same sweep:** BO Approve (Pre-App), Submit For Approval and Approve (Application) already wait for an on-screen result. Fixed: BO Verified (waits for `verify-softcopy-documents`), and the Fiuu B2B checker Approve (waits for its POST reply before closing the tab).

## Business Trading test data — made up, no Excel, no eSIM (2026-10-26)

1. **Rule:** Business Trading (Sabah / Sarawak) is the non-SSM route. The page never asks the SSM simulator anything, so no real data and no eSIM set-up are needed; all the data can be made up. `[from a colleague, relayed by Faizuddin 2026-10-26]`
2. **Licence format (agreed 2026-10-26):** `SBH/TL/9` + 6 digits (Sabah), `SWK/TL/9` + 6 digits (Sarawak); the 9 marks it as fake. `lib/onboardingCompanyTypes.ts` `fakeLicence()`. eAuto accepts letters, digits and "/", 4–35 characters.
3. **TIN:** optional on both pages. Updated 2026-10-26 (Faizuddin: "include in the pre-application also"): the switch now types the same TIN on the Pre-Application and the Application; the Pre-Application then shows the non-blocking "The TIN is invalid" warning (made-up licence) and the run presses Next again. Original note: none on the Pre-Application. The Application asks for a TIN but it is **not mandatory** for Business Trading `[from Faizuddin, 2026-10-26]`. The 12153 / 12257 dashboard rows have an "Include TIN on the Application" switch; when on, the TIN comes from an Excel row where at least one of ROC / New ROC / TIN is already used (`tinFromUsedRow`), so no fully free company is broken up. When off, the run leaves `#tinNo` empty.

**Correction (2026-10-26, 12257_TS08 run):** the Application TIN is **required** for Business Trading too — step 1 showed "This field is required" under "Tax Identification No (TIN): *" with the TIN left blank, and the run never reached step 2 (`public/qa-artifacts/eauto-12257/1792994713208/stuck-before-step2-ISSUE.png`). The dashboard now always sends the spent-row TIN to the Application; the "Include TIN" switch controls the Pre-Application only. [verified: run screenshot, 2026-10-26]

**Application step 1 — Motor Vehicle Association (2026-10-26):** "Please tick if your Business is a member of any Motor Vehicle Association. *" is required; left blank, Next shows "Select at least one" and step 2 never comes (Faizuddin's screenshots, 12257_TS08 and TS09). The run ticks `#isNoAssociation1` ("No") and re-checks it before every Next. [verified: screenshots 2026-10-26; markup `_reference/html/eauto/obs-application-step1-initial.html:6412`]

**Spare TINs for fake / Business Trading runs (2026-10-26):** Faizuddin: "the details are duplicated, even after i shuffle couple of times". The dashboard now sends spare TINs (`E{T}_TIN_POOL`); when eAuto refuses a TIN (the LHDN "Service Unavailable" dialog, or text like "already used / exists / duplicate"), the run types the next spare and logs `TIN_SPOILED`; a TIN that gets through logs `TIN_USED`. Both mark the TIN spent on the dashboard (ledger key `TIN|-|<tin>`). Candidates also skip rows whose checker "TIN Status" is PRESENT — read from the Excel since 2026-10-26, so an Excel dropped earlier must be dropped again. [unverified] the exact message eAuto shows for a duplicated Business Trading detail.

**TS08 message (2026-10-26):** Faizuddin: "it didnt say duplicated, but the error messge was the same one when we did the duplicated values" — i.e. the LHDN "Service Unavailable" dialog. TS08's first run (no TIN on the Pre-Application) passed the Pre-Application, so the made-up licence alone is accepted. [unverified] whether any real TIN passes alongside a made-up licence; the run stops after 3 refused TINs (`MAX_TIN_SWAPS`) instead of burning the pool.

**BO listing: search at once (2026-10-26):** after opening the UCD Pre-Application / Application Listing, the run used `settleObs` (wait until the page has 15,000 characters). The listing stays under that until a search fills the table, so every open waited the full 30 s (steps.json: 72 polls of 0.4 s; a manual Search click ended it at once). `BoPage.openListing` now waits only for `#to-search` to show, then searches. [verified: 12257 run steps.json, 2026-10-26]

### Reopening a Pre-Application link in a new browser: "Access Denied" lock (2026-10-26)

1. 12257_TS12 (LLP, DuitNow QR Cancel, then "close the browser and reopen the link"): the new browser opened `/obs/preOnb/form/975f15ef-…`, passed reCAPTCHA, and showed page 1 (empty Pre-Application Form) with the dialog "Access Denied — Another user has updated or is currently accessing this Pre-Application. You are not allowed to edit it." `[verified: public/qa-artifacts/eauto-12257/1793001265711/12257_TS12-preapp-reopened.png]`
2. The script opened the new browser and loaded the link before the old browser had closed, so the old session may still have held the lock. Whether the lock clears after a real close (and how long it takes) is `[unconfirmed]`.
3. **Automation change (Faizuddin, 2026-10-26):** `reopen` in `scripts/eauto-{12153,12257}/utils/chain.ts` now closes the old page first (`runBeforeUnload`), then opens the new browser. If "Access Denied" still shows, it saves a screenshot, waits 30 s and opens the link again, up to 5 tries. After that it stops with a clear error instead of going on to the payment tiles. Not run yet.
4. **Second run (2026-10-26, run 1793005584666):** no lock. The reopened link (after reCAPTCHA) showed **page 1 with every field kept** (name, Old/New BRN, address, admin), not Business Info Review. Matches EAINT-12414: the dev scope fixed only "Type of Business selection when preapplication page is reloaded". `[verified: public/qa-artifacts/eauto-12257/1793005584666/12257_TS12-preapp-reopened.png]` The `reopen` step now checks the Business Registered Name is kept, presses Next, ticks the declaration, then retries.

### Application step 1: typed TIN blanked by the late form load (2026-10-26)

1. 12153_TS07 (Business Trading Sarawak, run 1793006574073): the TIN was typed into `#tinNo` (no "carried over" line, no "none was given" error), but the step-1 screenshot taken right after already showed it empty, and Next gave "This field is required". 12153_TS12 passed with the same code in the same batch, so it is a timing race. `[verified: run log + public/qa-artifacts/eauto-12153/1793006574073/application-step1.png]`
2. **Automation (12153 + 12257 `ApplicationPage.ts`):** step 1 waits for network idle and `#tinNo` before typing, re-checks 1.5 s after typing, and `keepTin()` retypes an emptied TIN before every Next (alongside the association tick). The reopen step also calls `bringToFront()` before the reCAPTCHA (12153_TS10 timed out waiting for it). Not run yet.

### Reused made-up trading licence: BO Approve says "Unable to generate the application link" (2026-10-27)

1. 12153_TS07 retry (P261027/00933, UDIN ONBOARD TESTING SARAWAK0012) reused licence `SWK/TL/9385989` from the 10-26 run (P261026/00928, approved). BO Approve showed "Error — Unable to generate the application link for this potential UCD." Same dialog as a reused company (12153_TS02, 2026-10-23). The cause is inferred from the repeat; the dialog names none. `[from Faizuddin screenshot, 2026-10-27]`
2. Cause on the dashboard: the licence was made once when the row was ticked and saved; only the company name moved on.
3. **Fix (12153 + 12257):** the dashboard makes a new licence for every queued Business Trading row; the run first searches BO Pre-Application Listing by Business Trading License Number (`#businessTrading`, capture `_reference/html/eauto/obs-admin-preonb-enquiry-default.html`) and, if found, swaps the last 6 digits and checks again (up to 5). **Replaced 2026-10-28, see item 5.**
5. **Changed 2026-10-28 (12153 + 12257):** Faizuddin: "the automation for 12153 TS05 is not using the business trading license number form the dashboard. thats why it kept failing" — then "my bad, is ts07". The run of 10-28 (run 1793154255875) typed `SWK/TL/9412129`. Now the run types exactly the dashboard's licence: no digit swap (`checkLicenceFreeInBo` in `utils/boCompanyCheck.ts` only checks BO and stops the run at setup with "Press the shuffle button on the row for a new licence"), and the dashboard no longer replaces the field when Run is pressed. Not run yet.
4. **The developer said the same on 2026-10-22:** reusing existing business details is allowed, but the application link then fails to generate. `[from Teams DM Mong Guo Hao, 2026-10-22 17:37–17:38, Mong Guo Hao]` "actually want reuse can one, just the application link will fail to generate". Context: same DM, 14:27, Faizuddin: "i think my automation used the same business details with already existing one. now working". This backs the cause in item 1. `[source: Studying EAINT-12153 teams-since-2026-10-16 §C items 7, 11, 2026-10-27]`

## How an onboarding e-Invoice is issued (Ask eAuto, staging world, 2026-10-28)

Faizuddin, 2026-10-28: "for pre application and application, how do i make sure i can receive e-invoice?". Asked Ask eAuto (http://10.20.50.22:3900, world **Staging**, Dev mode). It reported no staging branch for eauto-onboarding / eauto-einvoice / eauto-cron, so it read origin/prod/master (10-09, 10-14, 10-27). Full answers: `_reference/inbox/ask-eauto-2026-10-28-onboarding-einvoice.md`.

1. **Sent on payment success only.** `EInvoiceHandler.sendEInvoice` runs from `PreObsPaymentResource:359` (Pre-Application fee) and `ObsPaymentPublicResource:405` (registration fee), only when Fiuu returns success and the payment row was not already PAID. It goes over RabbitMQ to eauto-einvoice. Errors are only logged; no retry. `[askeauto: 2026-10-28 Q1]`
2. **LHDN status does not stop the send.** Failed or "-" never blocks the request. "-" = New (sent, no result yet); N/A = no status. `[askeauto: 2026-10-28 Q1]`
3. **OK only when LHDN says Valid.** eauto-einvoice validates the buyer TIN with the real MyInvois API (`/api/v1.0/taxpayer/validate/{tin}?idType=BRN&idValue=…`, URL from `settings.myinvoice.url`; no mock). Then it submits; LHDN Valid → OK and the e-Invoice PDF is made. Anything else → Failed. Only OK with an e-Invoice UUID offers the PDF. `[askeauto: 2026-10-28 Q2]`
4. **TIN and BRN must be a matching pair at LHDN.** ID type is always BRN. Pre-Application sends the SSM registration number (or the **trading licence number** for Business Trading); Application sends the company ROC. A 404 on that pair = remark "TIN verification failed". `[askeauto: 2026-10-28 Q2]`
5. **So for testers:** made-up licences (Business Trading) and fake LLP numbers can never reach OK. Only a real company whose TIN and registration number match at the LHDN instance staging points to can. `[inferred from items 3–4]` Which MyInvois instance staging uses (preprod or production) is not known: the value of `settings.myinvoice.url` is not shown. `[unconfirmed]`
6. **BO check 2026-10-28:** all 52 of our Pre-Applications with an LHDN result and all 31 such Applications show Failed ("TIN verification failed" or "No TIN info has been provided"). None is OK. The 3 runs of 10-28 (SDN0042, SDN0043, SARAWAK0013) show "-". NA60001224 (SDN0043, TIN C25222692050) has only an "Invoice" Payment Document, no e-Invoice. `[verified: BO staging listings, 2026-10-28]`
7. **Recheck 2026-10-28 (Faizuddin: "i was using the real data from prod already"):** all 25 UDIN Sdn Bhd Pre-Applications still Failed, except SDN0042/SDN0043 at "-". Filtered by LHDN Response Status = OK, staging has 447 Pre-Applications in total (226 Sdn Bhd); the newest is **05-10-2026**: P261005/00884 (Sarawak licence SBU/BNR/364/2022), P261005/00883 (Sabah licence LD/2026/6807), P261005/00880 "AZ , HA & PARTNERSHIP CO. LTD." (Sole Prop, BRN 200503004882 (AS0268938-P), TIN IG24378796000, EAINT-12341 runs). P261005/00880 shows Payment Document "Invoice" **and "e-Invoice"**. No Pre-Application of any type has reached LHDN OK since 5 Oct, so the failures from 21 Oct on point to something on staging changing after 5 Oct, not to our data. `[verified: BO staging Pre-Application Listing, 2026-10-28; cause unconfirmed]`
