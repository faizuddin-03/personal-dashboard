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
`hubadmin_bochar`.

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
