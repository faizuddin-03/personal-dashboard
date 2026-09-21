# Payments and payment gateways

## The important capability: gateway payment is already automated

Not in the Service Hub suite — in `scripts/secarang-insurance`. Any new payment
automation should reuse this chain rather than rebuild it.

The full flow, page object by page object:

1. **`PaymentTypePage`** — clicks the FPX label, enumerates the bank list
   (bank names read from `img alt`, restricted to the `.d-md-block` desktop
   grid to avoid responsive duplicates), then clicks a bank and captures the
   popup. The popup listener is registered **before** the click so the event is
   never missed. `[verified: scripts/secarang-insurance/pages/PaymentTypePage.ts]`
2. **`BankLoginPage`** — passes the staging site-password gate if present, fills
   username/password, clicks whichever of Login / Log In / Sign In / Submit /
   Enter exists. `[verified: scripts/secarang-insurance/pages/BankLoginPage.ts]`
3. **`BankTACPage`** — the decisive one. Selects the desired outcome from
   `select#status_code` **before** requesting the TAC, then reads the OTP out of
   the DOM (`div.otp` / `[class*="otp"]`, extracting the 6-digit number) and
   submits it. `[verified: scripts/secarang-insurance/pages/BankTACPage.ts]`
4. **`PaymentSuccessPage`** — scrapes receipt no, purchase date and payment
   method off the success page. `[verified: scripts/secarang-insurance/pages/PaymentSuccessPage.ts]`

Two consequences worth internalising:

- **The sandbox OTP is readable in the page.** No SMS, no out-of-band step.
- **The payment outcome is selectable.** Failure cases don't need to be
  provoked; they're chosen. This turns most "negative payment" scenarios from
  manual into deterministic automated ones.

Sandbox bank credentials used by the regression run are in
`scripts/secarang-insurance/data/regression.ts` (`REGRESSION.bankUsername` /
`bankPassword` / `paymentStatus`, defaulting to status `00` = Approved), all
overridable by `REGRESSION_*` env vars.
`[verified: scripts/secarang-insurance/data/regression.ts]`

## FPX status codes

The complete list the dashboard exposes for the insurance runner is the
canonical reference — read it from there rather than re-typing codes.
`[verified: app/eauto/insurance/page.tsx · FPX_STATUS_CODES]`

The ones that matter most for test design:

| Code | Meaning | Use it for |
|---|---|---|
| `00` | Approved | happy path |
| `51` | Insufficient Funds | declined payment |
| `80` | Buyer Cancel Transaction | user abandons at the bank |
| `BC` | Transaction Cancelled By Customer | same, alternate path |
| `22` | Pending Response From Bank | pending/unsettled state |
| `99` | **Pending for Authorization (B2B)** | corporate maker-checker |
| `OE` | Not In FPX Operating Hours | cut-off / out-of-hours |
| `OF` | Transaction Timeout | gateway timeout |
| `OA` | Session Timeout at FPX Entry | session expiry at the gateway |
| `48` / `61` / `65` | Limit / frequency exceeded | transaction-limit handling |
| `85` / `96` / `FE` | Bank or internal system error | infrastructure failure |

Code `99` existing as a distinct B2B state is the clearest signal in the repo
that the gateway models B2B authorisation separately from B2C.

## FPX bank list (insurance runner)

Maybank2u (`fpx_mb2u`), CIMB (`fpx_cimbclicks`), Ambank (`fpx_amb`), Public Bank
(`fpx_pbb`), RHB (`fpx_rhb`), HLB (`fpx_hlb`), HSBC (`fpx_hsbc`), Affin Bank
(`fpx_abb`), Bank Rakyat (`fpx_bkrm`), BSN (`fpx_bsn`). Default `fpx_mb2u`.
`[verified: app/eauto/insurance/page.tsx · FPX bank options; scripts/secarang-insurance/data/regression.ts · targetBank]`

These are the **FPX** banks. Distinct from the **hire-purchase loan** bank
dropdown on the eAuto insurance payment step, which is a different field with
its own list (Maybank Berhad, CIMB Bank Berhad, Public Bank Berhad, RHB Bank
Berhad, Hong Leong Bank Berhad, AmBank Berhad).
`[verified: scripts/eauto-e2e/data/config.ts · CANDIDATE_BANKS]`

## eAuto payment is a simple click — the default assumption

**Unless a ticket says otherwise, payment in eAuto is a button plus its
confirmation popups**, the same as the eSTM flow's payment step. No gateway
page, no bank login, no TAC, **and no QR — QR payment is not implemented in
eAuto**; when it is, it will be scoped to one module. `[from Faizuddin, 2026-08-18]`

Everything below about FPX and Fiuu applies to the modules that genuinely
redirect to a gateway — **Secarang** and **UCD onboarding**. Do not carry it
into an eAuto insurance or eSTM payment step.

## eAuto insurance PAY NOW (not a redirect)

On the eAuto insurance purchase flow, PAY NOW hits a **real insurer API** and can
take up to ~40s, with confirmation popups to click through and a possible
NCD/underwriting **referral loop** for some vehicle numbers — which is a known
behaviour, not a bug, and the script throws a specific error telling you to try
another VN. Completion is detected by reaching `complete.do`.
`[verified: scripts/eauto-e2e/pages/PaymentPage.ts · payNow]`

That script also has a safety switch, `E2E_STOP_BEFORE_PAYMENT=1`, which stops
before PAY NOW so no transaction is created and the vehicle number is not
consumed. Prefer it for any dry run.
`[verified: scripts/eauto-e2e/data/config.ts · stopBeforePayment]`

## UCD onboarding payment (Pre-application / Application)

**The gateway is Fiuu sandbox — the same one Secarang uses**, presenting Fiuu's
own hosted form. The FPX automation chain above therefore **ports** to this
module rather than needing a rebuild. `[from QA team, 2026-08-13]`

The payment step offers **three** options, not four:

| Tile | Rail | New? |
|---|---|---|
| Credit or Debit Card | card | **new** |
| Online Banking (Business) | FPX **B2B** | **new** |
| Online Banking (Personal) | FPX **B2C** | existing, relabelled |

**FPX (B2C) and FPX (Personal) are the same rail under two names** — confirmed
with the requestor, and the Figma shows only three tiles. Don't treat them as
separate channels; an earlier reading of the SRD did and inflated the scope.
The bank grid is the **same ten FPX banks** listed above for the insurance
runner. `[from QA team + Figma payment-method screen, 2026-08-13]`

**The Fiuu sandbox has a response picker.** Choose the outcome it returns —
approved, or any specific failure reason — and Fiuu signs the callback
genuinely. So negative-response testing needs **no callback endpoint and no
merchant signing secret**, and it automates the same way the FPX
`select#status_code` chain does: pick the outcome, assert eAuto handles it.

The agreed scope boundary: **we verify our side reacts correctly to each
response**, not that Fiuu produces the right one. What the picker can't produce
— the same callback arriving twice, or arriving long after the session ended —
is out of scope for now. Those are the double-charge cases, and covering them
later would need a dev-provided endpoint. `[from QA team, 2026-08-13]`

Still open before writing code against it: whether the step is genuinely
gateway-framed (believed yes, unverified), and **whether the Fiuu sandbox
3DS/card OTP is readable in the DOM** the way the FPX TAC page is — that single
answer decides whether the card channel automates or stays manual.

Per-case automation verdicts live in the ticket study for **EAINT-12153**
(`lib/ticketStudies.ts`, viewable at `/jira/studies`). Note its TS ids refer to
a **withdrawn v1.0 script** and need re-mapping. `[from ticket EAINT-12153]`

## Automation skeleton — TS3-TS8 (2026-09-02)

`scripts/eauto-payment-channels/` is a **skeleton only** — folder structure,
Playwright projects (one per TS3-8), page objects, and a shared
Initial-Steps→Payment→Continuation→Payment test builder
(`utils/defineScenarioTest.ts`), but every page-object method throws
`PendingHtmlCapture` (`utils/pendingHtml.ts`) until real step-by-step HTML is
captured and dropped in. TS1/TS2 (FPX B2B) are excluded on purpose — being
reworked separately for the B2B pending-approval flow (REQ-004-007). TS7/TS8
(QR Code) have projects for completeness but their specs are `test.skip` —
the sheet has no steps for them at all.

The FPX bank-popup chain (`pages/ucd/FpxBankLoginPage.ts`,
`FpxBankTacPage.ts`) is structured to port from `scripts/secarang-insurance`'s
own chain (same Fiuu sandbox) once this module's popup HTML confirms the
selectors match. `[from Faizuddin, 2026-09-02]`

## DuitNow QR channel (EAINT-12257) — dev-discussed shape, pre-SRD

EAINT-12257 asks to add DuitNow QR as a fourth UCD onboarding payment tile
(Pre-application and Application), on top of the three above. No SRD exists
yet (ticket is still "REQ GATHERING & ANALYSIS IN QUEUE"); the shape below
came from an IRL discussion with the dev in charge, not a written spec —
treat every line as **[unconfirmed until SRD/live check]**.

- Selecting DuitNow QR opens a **popup showing the QR code**.
- The popup has a **Cancel Transaction** button — closing/cancelling the
  popup is an explicit test path, not just a timeout path.
- There's a **timer** on the popup; letting it run out (not scanning) is a
  separate test path from cancelling.
- The "scan" side (the paying app) only offers **Approve** or **Reject** —
  no other outcome exists at that step, so the negative case is a reject,
  not an arbitrary failure code (unlike the Fiuu picker's multi-reason
  failures above).
- QA is expected to check the **invoice/e-invoice amount** matches what was
  charged.
- **Testing needs a physical phone** to scan the QR and act on it — this
  can't be driven by Playwright the way the FPX/Fiuu chain above can. Open
  question from the dev discussion: whether both iPhone **and** Android need
  covering, or one is representative.
- Pre-application may also involve a **captcha** step — unconfirmed, flagged
  by the dev as a "maybe."

**QA/automation consequence:** this channel breaks the "port the FPX chain"
assumption above — TS7/TS8 (QR Code) in
`scripts/eauto-payment-channels/` were already skipped for exactly this
reason (no steps existed for them). A real phone-in-the-loop step means this
channel is very likely **manual-only** unless the sandbox/dev provides some
non-phone way to trigger Approve/Reject (the same kind of picker Fiuu gives
for the other rails). Don't assume a headless equivalent exists until asked.
`[from dev discussion, ticket EAINT-12257, 2026-09-02]`

### Agreed approach — assisted, not manual-only (2026-09-03)

The senior QA **already has working automation for Pre-application and
Application**. EAINT-12257 therefore does **not** need a new script: the only
work is to **modify that existing script's payment step** so it drives
everything up to the QR popup, then **pauses for a human to scan the QR with a
physical phone** and approve/reject, then resumes and asserts the outcome.

So the channel is **semi-automated (human-in-the-loop)**, not manual-only — the
earlier "manual-only" reading is superseded. The phone is the only manual beat;
navigation, popup handling, and post-payment assertions stay automated.
`[from Faizuddin, 2026-09-03]`

**The phone is used for the payment act only — nothing else.** In particular the
invoice/e-invoice amount check is **not** a phone step: the invoice is
**downloaded from the system itself**, so that assertion automates like any
other. Cancel-button and timer-expiry paths need no phone either. Scope the
manual beat to the scan-and-approve/reject moment and no wider.
`[from Faizuddin, 2026-09-03]`

**Whatever appears on the phone is out of our jurisdiction — it belongs to the
Fiuu system.** The phone is a *means of triggering an outcome*, not a test
surface: don't write assertions on the paying app's screens (amounts, merchant
name, QR contents, error copy) and don't raise defects against them. This is the
same scope boundary already agreed for the other Fiuu rails above — **we verify
our side reacts correctly to each outcome, not that Fiuu produces it correctly.**
So for the Approve and Reject scenarios, the only things under test are what
eAuto does afterwards. `[from Faizuddin, 2026-09-03]`

## ShopeePay / GrabPay channel (EAINT-12107) — agreed test scope

SRD: `[Secarang-Fiuu] Enhance Payment Gateway to Enable ShopeePay and GrabPay`,
v1.1, 2026-09-11 (`_reference/tickets/EAINT-12107/`). Adds ShopeePay and
GrabPay as new Fiuu-gateway payment rails, surfaced in CIBO's payment-type
filter and listing/export display.

**Test scope agreed in a 1:1 exchange between Faizuddin and May Chin, "eAuto
QAs" chat, Friday 2026-09-11, 16:31–18:21** — no written SRD test plan existed
yet at the time; this is the working scope until one does.

- **GrabPay is testable in sandbox; ShopeePay is not.** May Chin's opening
  ask (16:31) was to test GrabPay, regress the existing payment methods, and
  try it across all insurers.
- **Insurer scope narrowed**: Faizuddin checked with Charmain, who checked
  with KJ — all insurers share the same payment gateway, so testing against
  any one available insurer is sufficient; no need to repeat across insurers.
  `(source: Teams, Charmain/KJ via Faizuddin, 2026-09-11)`
- **Because ShopeePay can't be exercised live, dev patching stands in for it**:
  May Chin floated (16:31) asking dev to patch existing transactions to show
  `payment = shopeepay / spaylater / grabpay / grabpaylater` so the CIBO
  filter and listing/export display can be verified even without a working
  sandbox rail for those specific methods.
- **Estimate settled at 1+1 days** (down from an initial 2+1-day floated
  estimate, once the ShopeePay sandbox limitation was confirmed), broken down
  by May Chin (16:44–17:44) as: (1) one full GrabPay E2E transaction, (2)
  three dev-patched transactions then check the CIBO filter/display, (3)
  regress the existing payment methods.
- **Final agreed test scope (confirmed "yup, but add one more" 17:53 → "yup
  yup" 18:21)**:
  1. **E2E flow** — TS1: Create Transaction → GrabPay → Payment OK. TS2:
     Create Transaction → GrabPay → Payment Failed. TS3: Create Transaction
     → regress an existing payment method (Credit/Debit Card or FPX Online
     Banking) → Payment OK.
  2. **Dev-patched transactions** (since sandbox can't produce these
     directly) — TS1: Payment = ShopeePay. TS2: Payment = SPayLater. TS3
     (added after the first draft): Payment = PayLater by Grab.
  3. **Functional check**: verify the CIBO filter function and payment-type
     display are correct, including in the export file.

`(source: Teams, May Chin, 2026-09-11, "eAuto QAs" chat)`

**Open/unconfirmed as of the Teams sync (2026-09-15)**: whether this scope has
since been formalized in a written test-plan artifact, and whether dev has
actually patched the ShopeePay/SPayLater/GrabPay-later transactions yet — no
knowledge/flow file exists for CIBO or this payment-gateway ticket beyond this
section; a fuller flow write-up (CIBO filter mechanics, listing/export table
shape, live HTML) is still needed once the sandbox/patched data is available.

### Ownership reassigned to Amirul Azfar — Teams sync, 2026-09-17

**EAINT-12107's testing was handed from Faizuddin to Amirul Azfar on
2026-09-15, no execution has started as of 2026-09-17.** Found in the "eAuto
QAs" Teams chat, not the dedicated ticket chat:

- May Chin Mei Theng's deployment-alignment post, Tuesday 2026-09-15 16:25,
  lists upcoming deployment items with an owner each; item 7 reads
  **"EAINT-12107 - Azfar"**, deployment date **TBC**.
  `(source: Teams, May Chin Mei Theng, "eAuto QAs" chat, 2026-09-15)`
- Amirul Azfar's own EOD update the same day (2026-09-15 18:20) lists
  EAINT-12107 with **Status: "To study and draft test scenario", CR Testing
  Progress: TBC.**
- Amirul Azfar's next progress update, Thursday 2026-09-17 09:00, still lists
  EAINT-12107 with the **exact same status** — "To study and draft test
  scenario" / CR Testing Progress: TBC — i.e. no test execution has actually
  started in the two days since reassignment.
  `(source: Teams, Amirul Azfar, "eAuto QAs" chat, 2026-09-15 and 2026-09-17)`

Faizuddin's own most recent daily To-Do Plan post (2026-09-17 09:15, same
chat) does not list EAINT-9306 or EAINT-12107 at all, consistent with both
having moved off his own active plate for now (9306 is deployed/regressed per
`flow-edereg.md` §44; 12107 is with Azfar). The dedicated "EAINT-12107
[Secarang-Fiuu]..." ticket chat itself has no messages after Tuesday
2026-09-15 10:21 (Kasheng Liew confirming code review done, ready for QA —
already known) — the ownership handoff and status only show up in the
general "eAuto QAs" chat's daily status posts, not the ticket-specific one.

### The "written test-plan artifact" open question is answered — Teams sync, 2026-09-17 (later same-day check)

**Yes, the agreed scope above (§ "ShopeePay / GrabPay channel — agreed test scope")
was formalized into a written test-plan spreadsheet before the handoff**, closing
the open item this file previously flagged ("whether this scope has since been
formalized in a written test-plan artifact"):

- Faizuddin's EOD update in "eAuto QAs", Tuesday 2026-09-15 18:18, lists
  EAINT-12107 with **Status: "Drafted the TS for E2E and negative flow.
  Pending regression TS"** — i.e. the E2E/negative-flow test scenarios were
  written up, only the regression TS portion was still outstanding at
  handoff time.
- The same day, 16:47 (1:1 chat with Amirul Azfar) and again 18:18 (posted to
  "eAuto QAs"), Faizuddin shared a file named **`EAINT-12107 - [Secarang-Fiuu]
  Enhance Payment Gateway to Enable ShopeePay and GrabPay.xlsx`** — this is
  almost certainly the drafted TS referenced above, handed to Azfar alongside
  the ownership transfer.
  `(source: Teams, Muhammad Faizuddin Bin Bidi, "eAuto QAs" chat + 1:1 with Amirul Azfar, 2026-09-15)`
- No newer Teams activity for EAINT-12107 was found beyond what's already
  recorded above — Amirul's 2026-09-17 09:27 progress update repeats the same
  "To study and draft test scenario / CR Testing Progress: TBC" status,
  meaning the handed-off xlsx has not yet turned into logged test execution.

**Still unconfirmed**: whether that xlsx is the same shape as the "Final
agreed test scope" bullet list already recorded above, or a superset/subset
of it — the file itself was not opened in this session (only its filename and
the surrounding chat messages were read). Worth pulling into
`_reference/tickets/EAINT-12107/` and reading in full before the next
automation/test-planning session on this ticket.

### Ticket title formally changed, and Azfar's TS drafting now marked done — Teams sync, 2026-09-18

**The JIRA ticket itself has been renamed** — the dedicated Teams chat and
group-chat search results now show the title as **"[Secarang-Fiuu] Enhance
Payment Gateway to Enable SPAY Later and PayLater by Grab"**, dropping
"ShopeePay and GrabPay" from the name. All historical message text (from
August/early September) still reads the old "ShopeePay and GrabPay" title
because Teams preserves the title as typed at send time — only the live
chat/group name has updated. This is consistent with, and confirms, the
already-recorded scope: the direct ShopeePay/GrabPay rails were never
testable live (§ "ShopeePay / GrabPay channel"), and the shipped scope is the
"later" variants (SPayLater, PayLater by Grab) plus dev-patched data for the
rest. `(source: Teams, chat title observed live, "EAINT-12107 [...]" dedicated
chat and search results, 2026-09-18)`

**Amirul Azfar's EOD update, Thursday 2026-09-17 22:22** (in "eAuto QAs"),
item 4, updates his own 09:27-that-morning status: **"To draft test
scenario" is now marked Done; CR Testing Progress: still TBC.** No newer
Azfar or EAINT-12107 update exists in Teams beyond this — Faizuddin's own
To-Do Plan post the next morning (2026-09-18 09:10, same chat) does not
list EAINT-12107 at all, so it remains off his active plate.
`(source: Teams, Amirul Azfar, "eAuto QAs" chat, 2026-09-17 22:22)`

The dedicated "EAINT-12107 [...]" ticket chat itself has no messages after
2026-09-15 (still just Yi Link Lim's 2026-09-11 SRD-feedback post and the
2026-09-15 code-review confirmation, both already recorded above) — all
newer status is coming from the "eAuto QAs" channel's daily posts, not the
ticket-specific chat.
