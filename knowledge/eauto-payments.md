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

Full page-by-page flow, verbatim selectors with file:line, config knobs and the
unconfirmed GrabPay / card / failed-page handles:
[flow-secarang-insurance.md](flow-secarang-insurance.md).

**The chain is verified for FPX only** (supersedes the implied "any gateway
payment" scope of this section). The Fiuu e-wallet and card popups have never
been captured; `scripts/eauto-12107/pages/FiuuSandboxPage.ts:6-16` says so
verbatim: "ENTIRELY UNCONFIRMED — no capture of this popup exists yet".
`[verified: scripts/eauto-12107/pages/FiuuSandboxPage.ts:6-16]`

**There is no stop-before-payment switch** in either Secarang project (unlike
`E2E_STOP_BEFORE_PAYMENT` in eauto-e2e). `[verified: grep, 2026-10-15]`

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

**Scoped since 2026-09-02:** the one module is **UCD onboarding** (EAINT-12257,
Pre-application and Application payment steps), which adds DuitNow QR; see
[flow-payment-channels.md](flow-payment-channels.md) and § "DuitNow QR channel"
below. "No QR" still holds for every other eAuto module (supersedes the unscoped
"no QR in eAuto"). `[from ticket EAINT-12257; from payment-channels study, 2026-10-15]`

Everything below about FPX and Fiuu applies to the modules that genuinely
hand off to a gateway — **Secarang** and **UCD onboarding** (onboarding opens Fiuu
in a popup from an eAuto-hosted page, see below). Do not carry it
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

## RHB direct debit (eAuto's own rail)

### Service Hub (SI/BDP) payment

1. The SRDs describe the Service Hub payment as "RHB direct debit" with a
   confirmation popup "Sure to proceed with payment?" (Back/X, Next). Failure
   shows RHB's reason, logs a Failed attempt, blocks retry (Back only) and sets
   the transaction to Cancelled.
   `[from SRD EAINT-10960 v1.2 §2.3.2.1 #2; SRD EAINT-11880 v1.2 §2.3.2.1 #6]`
2. In the automated path there is no gateway page: `#si-pay-btn` →
   `.confirm-dialog-btn` → `slot.do`/`submitted.do`.
   `[verified: tests/service-hub/pages/SoftwareInstallationPage.ts:43-49; pages/BiometricPurchasePage.ts:147-160]`
3. RHB Payment Reference format: Ref 1 `SR{YYYYMMDD}{6-digit running}-{Company ID}`;
   Ref 2 `SOFTINSTALL/`, `BIODEV/`, `SOFTINSTALL_BIODEV/`. Live example on the
   UCD details page: `RHB (SR20260923000002-1109700) - OK`.
   `[from SRD EAINT-10960 v1.2 §2.3.2.4; verified: EAINT-12166 SR-details capture]`
4. Pricing: SI RM50 + 8% SST = RM54; device RM850, no SST.
   `[verified: tests/service-hub/utils/config.ts:64-69; from SRD EAINT-11880 v1.2 §2.3.2.3 #6]`

### References and error remarks

1. RHB statement references (STMS-family): Ref 1 "{TransactionNo}-{VehicleNo}",
   Ref 2 "{TransactionNo}/{STMS|JCK|OTH|DPC}", description "ETUKARMILIK CR".
   `[from SharePoint TS #123 RHB 25.06.2026 2, sheet Bank Statement, rows 7-14]`
2. An RHB Ref 2 longer than 30 characters returns "ED".
   `[from Teams EAINT-12099 group, 2026-07-17 10:23, Goh Kai Jiaeh]`
3. Failed-payment remark for insufficient funds: "IF - Wang di dalam akaun RHB
   anda TIDAK MENCUKUPI…". `[from SharePoint TS #042 EAINT-12403, sheet APT, row 20]`
4. Maintenance-window error: "NP - Sistem Pembayaran RHB dibawah penyelengaraan
   antara 10.30mlm - 8.30pg."
   `[from SharePoint TS #092 EAINT-9141, sheet UI Change (Insurance Quotation), row 20]`

### Payment reset and APT resubmit

1. The BO payment-reset rules on a fee change (reset scope differs per CR,
   AA reset but not repriced, documents keep the paid price) are in
   [business-rules-from-test-scenarios.md](business-rules-from-test-scenarios.md)
   §1.2. The APT resubmit cronjob (EAINT-8668: which transactions it picks up,
   its schedule) and the APT auto reset on RHB error RE are in §2, items 5–6.
   `[from SharePoint sweep, 2026-10-16]`
2. Failed-payment reset in staging and prod is done by calling the API as a
   logged-in user. Only certain admin users can do it; in prod it uses Izni's
   account. `[from Teams EAINT-12289, 2026-09-10 14:21, Jin Siang Boo]`
3. For APT patch requests, Ops use the BO "Reset" button.
   `[from Teams eAuto & Secarang Main Group, 2026-06-25 10:57, Mei Jia Chee]`

## UCD onboarding payment (Pre-application / Application)

**The gateway is Fiuu sandbox — the same one Secarang uses.** The payment page
itself is **eAuto-hosted**: the tiles and the bank grid sit on
`/obs/preOnb/form/<uuid>` (pre-application) and `/obs/form/...` (step 5). Only
`Submit and Pay` opens Fiuu — a **popup** to `sandbox-payment.fiuu.com`, then
`bank-simulator.fiuu.com` (supersedes the earlier "presenting Fiuu's own hosted
form" reading). The FPX automation chain above therefore **ports** to this module
rather than needing a rebuild. `[from QA team, 2026-08-13; verified: reference
pack 02-screens/34-registration-fee.aria.yaml; 05-known-traps.md §5]`

Secarang and eAuto use **different Fiuu merchant accounts**. The Fiuu bank
simulator list is at https://bank-simulator.fiuu.com/faq.
`[from Teams EAINT-12107; from Teams EAINT-12153 group]`

**The two stages are separate charges:** RM 108.00 (Payment ID `P…`) and
RM 990.00 (Payment ID `A…`), each with its own Payment Details block.
`[verified: reference pack 02-screens/14-*.txt and 35-*.txt]`

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

**The FPX B2B tile is already live.** The 23-08-2026 walkthrough recording showed
all three tiles, including "FPX Online Banking (Business)", and the 31-08-2026
aria capture shows "Online Banking (Business)". What is not yet delivered is the
v1.1 B2B pending-approval flow (REQ-004-007); whether the B2B rail behind the
tile works end to end is `[unconfirmed]`. `[from payment-channels study,
2026-10-15: walkthrough recording 2026-08-23; reference pack aria capture 2026-08-31]`

**Two live defects on this step, EAINT-12414 (found 2026-09-29):**

1. **Reloading/refreshing a saved Pre-Application Form resets it to Step 1**,
   dropping a partially-filled form back to the start. Root cause per the
   ticket: a list the page needs while loading is built only after loading
   has already started, so the page errors partway through. Dev's own stated
   regression scope (Mong Guo Hao, Teams, 2026-09-29 16:06) specifically calls
   out the **Type of Business selection** as the thing to check survives a
   reload — not just which step the form lands on.
2. **A failed Credit/Debit Card payment shows no "Unsuccessful Payment"
   message** when the card gateway returns to the **same tab** rather than the
   payment **popup**. The popup path already shows the message correctly and
   passes either way — **the same-tab return path is the one that actually
   needs testing**. Expected message: *"Unsuccessful Payment - Something went
   wrong and your payment didn't go through. Please choose a payment method
   and retry."* On the fixed behaviour, the applicant should land back on Step
   2 with the declaration still ticked and payment methods still visible (both
   were previously wiped along with the missing message).

The fix was eauto-onboarding MR !331 (internal GitLab, likely needs VPN/office
network). `[from Jira EAINT-12414 + Teams CR group, 2026-09-29/30, captured in
_reference/tickets/EAINT-12414/]` It was **deployed 2026-10-09, dev-tested only**
(supersedes "under review"). `[from EAINT-12414-jira-ticket.md; from Teams via
memory digest, 2026-10-14]`

**Scope decisions for EAINT-12414, confirmed by Faizuddin 2026-09-30:**
- **Pre-Application Form only** — the Application module is not covered even
  though it shares the same payment step (EAINT-12153 delivered both). Ticket
  and dev's scope only ever say "preapplication page"; don't extend scope to
  Application unless a source explicitly says so.
- **FPX (Personal) only for the "successful FPX payment" regression check.**
  FPX B2B is not covered here. The original reason, "it is not deployed yet",
  is superseded: the B2B tile is already live (see above); what is outstanding
  is the B2B pending-approval flow (REQ-004-007). Worth rechecking once that
  ships, since it shares the same payment step and could carry the same class
  of defect.
- **The onboarding module (`/obs`) has exactly one staging environment** —
  `staging/obs` (i.e. `https://staging.eauto.my/obs/...`, per the base URL
  already noted in `flow-ucd-onboarding.md`). There is no `/uat1`-style
  per-CR staging split for this module the way other eAuto modules have.

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

**Answered:** the step is not gateway-framed. The tiles and bank grid are
eAuto-hosted, and only `Submit and Pay` opens the Fiuu popup (see above;
supersedes "believed yes, unverified").
`[verified: reference pack 02-screens/34-registration-fee.aria.yaml; 05-known-traps.md §5]`

Still open before writing code against it: **whether the Fiuu sandbox 3DS/card
OTP is readable in the DOM** the way the FPX TAC page is — that single answer
decides whether the card channel automates or stays manual.

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

**The only project that actually drives this step is `scripts/eauto-duitnow-qr`**
(FPX Personal leg confirmed from the reference rig; QR leg unverified). The
skeleton's `FpxBankLoginPage`/`FpxBankTacPage` should port from
`scripts/eauto-duitnow-qr/src/payment.ts` (`simulatorLogin`, `driveSimulator`,
`payByFpx`), which was matched live on this module, rather than from
`scripts/secarang-insurance`, whose `select#status_code` / `div.otp` selectors
are unconfirmed here. `[from payment-channels study, 2026-10-15; verified:
scripts/eauto-duitnow-qr/src/payment.ts]`

## DuitNow QR channel (EAINT-12257) — dev-discussed shape, pre-SRD

**Superseded in part by SRD v1.0 (10.09.2026)** — see
[flow-payment-channels.md](flow-payment-channels.md) § 4f for the written spec.
The SRD confirms the popup, Cancel and timer, and fixes the timer at **03:00**
("Scan QR in mm:ss"). It defines failure as timer 00:00, Cancel, or bank
decline / insufficient funds, each closing the popup and returning to method
selection with the existing banner. It leaves two items "Pending (Fiuu)":
amount display in the popup, and refresh/Back + duplicate-payment safeguard.
The "no SRD / REQ GATHERING" lines below are history.
`[from SRD EAINT-12257 v1.0 §2.2.5–2.2.6; text in _reference/tickets/EAINT-12257/EAINT-12257-SRD-v1.0-20260910-text.md]`

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

Dashboard defaults for the duitnow-qr runner: Approver `jasons`, Assignee
`mfared`, Fiuu simulator `Gaara`. `[from handoff 2026-09-02 EAINT-12257,
2026-09-04 update]`

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
  `(source: Teams, Charmain/KJ via Faizuddin, 2026-09-11)` `[from Teams eAuto
  QAs, 2026-09-11, Goh Kai Jiaeh via QA post]`
- **BNPL is an option inside the GrabPay and ShopeePay apps**, and ShopeePay
  fails in the sandbox. `[from Teams EAINT-12107]`
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

### Back to Faizuddin, targeting the 20/21 Oct release — 2026-10-15

**May Chin Mei Theng, "eAuto QAs" chat, 2026-10-15 10:11 (verbatim):**
"Muhammad Faizuddin Bin Bidi as discussed, please study the following tickets
and let me know if the estimated testing mandays work for you and if we're able
to target these tickets to deploy on 20th or 21st Oct next week / EAINT-12107 -
1 + 1 = 2 days / EAINT-12327 - test together with 12107 / EAINT-12412 - 1 + 1 =
2 days / Note: you can refer the high level test scope in the QA Portal for
reference". `(source: Teams, May Chin Mei Theng, 2026-10-15)`

1. All three tickets sit in Jira fix version **"S34.X-20261020/21 🌞 TBC"**,
   release date 2026-10-20, description "Main item(s): 1. Secarang - ShopeePay &
   GrabPay 2. CIBO - Payment & Transaction Listing". `[verified: Jira, 2026-10-15]`
2. EAINT-12107 is still **Code Review** in Jira, QA field still **Amirul Azfar**.
   Staging has had the Secarang and CIBO changes since 2026-09-07 / 09-09 (Shane,
   Jira comments). Nothing new in the ticket chat after 2026-10-07.
3. **Deployment slot:** Mei Jia Chee asked Kasheng Liew (EAINT-12107 chat,
   2026-10-07 11:54) whether "this CR & EAINT-12327 can deploy in morning session
   or must proceed night deployment". Kasheng, 12:55: "can deploy in morning ya".
   `(source: Teams, Kasheng Liew, 2026-10-07)`
4. The 1 + 1 estimate matches the scope agreed on 2026-09-11 (above). The dev
   data patching for ShopeePay / SPayLater / PayLater by Grab has not been
   requested yet as far as Teams shows. `[unconfirmed]`

## CIBO Payment Mode column format (EAINT-12327) — studied 2026-10-15

SRD: `_reference/tickets/EAINT-12327/EAINT-12327-SRD-v1.0-20260917.pdf`
(v1.0, 2026-09-17, Lim Yi Link; only v0.1 and v1.0 exist). Ticket notes with
the Teams thread: `_reference/tickets/EAINT-12327/NOTES.md`. Study entry in
`lib/ticketStudies.ts`. "Relates to" EAINT-12107 and is tested together with it.

1. **One display format on 4 pages:** CIBO > Transaction Management >
   Transaction Listing, its export, CIBO > Payment Report, its export. Order is
   gateway, method, details. The 7 strings (Jira description row 3):
   `BoldPay | eWallet – TouchNGo`, `BoldPay | Online Banking – FPX-Bank Name`,
   `BoldPay | Credit/Debit Card – MBBMGATE_MS`,
   `Fiuu | eWallet – ShopeePay – Full Amount – Single Payment`,
   `Fiuu | eWallet – ShopeePay – BNPL – Installment`,
   `Fiuu | eWallet – GrabPay – Full Amount – Single Payment`,
   `Fiuu | eWallet – GrabPay – BNPL – Installment`. [source: SRD REQ-001; Jira]
2. **Transaction Listing + export:** new Payment Mode column "after the Payment
   column and before the Discount Code column"; existing columns unchanged; a
   dash when no payment mode is recorded. [source: SRD REQ-003, REQ-004, REQ-005]
3. **Payment Report + export:** column position unchanged; value changes from
   the gateway name only ("either BoldPay or Fiuu") to the full format. The
   Payment Report "has no blank value for this field". [source: SRD §2.2.2 item
   1, REQ-004, REQ-006, REQ-007]
4. **Same transaction, same string everywhere.** [source: SRD REQ-002]
5. **Why:** "to analyse which group of users the payment under Secarang comes
   from. Refer to source ticket ESI-355." Cross-department ticket CCB-949.
   [source: SRD §1.5, §2.1.2]
6. **Dev status:** Kasheng Liew, 2026-09-28 13:21: "cross checked 12327, not
   done yet. transaction listing and payment report both untouched on latest
   staging, need frontend and backend. 12107 got some parts can reuse". Wong
   Kar Kin was assigned 2026-09-28; Kasheng took it back 2026-10-01 10:35. Jira
   still Ready For Development on 2026-10-15, no comments.
   `(source: Teams, EAINT-12327 chat)`
7. **Not in the SRD:** whether historical rows are back-filled (REQ-001 says
   "Existing and new transactions" only); where "Bank Name" comes from for FPX;
   whether BoldPay has e-wallets other than TouchNGo. `[unconfirmed]`
   **BoldPay as a Secarang gateway:** the 12107 SRD §2.2.2 says the Secarang
   payment page offers only Credit/Debit Card and FPX (Fiuu); 12327 lists
   BoldPay TouchNGo / FPX / MBBMGATE_MS. Whether BoldPay is a second live
   Secarang gateway, a historical one, or another front is `[unconfirmed]` —
   ask Lim Yi Link together with the missing Fiuu card/FPX string.
   `[from SRD EAINT-12107 §2.2.2; SRD EAINT-12327 REQ-001]`
8. **Test data:** 7 payment modes means 7 transactions. Only GrabPay Full
   Amount is live-testable in the Fiuu sandbox (EAINT-12107 SRD §2.2.8); the
   others need the same dev data patching as EAINT-12107 group 2, so request
   all 7 together.
9. No CIBO page objects or captured HTML exist in this repo. Capture the
   Transaction Listing and Payment Report HTML on the first staging visit
   (`_reference/html/cibo/`).

### QA Portal tasks (read 2026-10-15, nothing changed)

Portal: `http://10.30.10.214/tasks/<task-id>`. Task ids: EAINT-12107
`b4fb97dc-8b70-4752-b497-bdaf7f93558d`, EAINT-12327
`8e1ffa32-b5fa-4e9c-adb8-743155d72954`. Both "Studying ticket", expected deploy
2026-10-20 from fix version, "20th October Morning Deployment Items".

1. **EAINT-12107 task** (last updated by Faiz 2026-09-17): QA PIC Amirul Azfar,
   so the portal shows "Azfar is QA PIC, so this ticket is read-only for you.
   Ask a Senior or Lead QA Automation Engineer to add you as cover." Dev PIC
   Shane Liew Kasheng, BA Lim Yi Link, Dev ETA 2026-09-15, Own staging, Est.
   2 days. High-Level Test Scope (verbatim): "Payment Method / ShopeePay
   (Installation + Full Payment) - unable to test with FIUU sandbox / GrabPay
   (Full Payment Only) / Transaction Type / Payment = OK / Payment = Failed /
   Functional Test Scenarios / CIBO filter function & payment type / Regression
   E2E Happy Flow / Credit or Debit Card / FPX Online Banking". SharePoint
   link to the TS xlsx. 4 required fields missing (Test mode, Code Merge
   Environment, UAT, phase target date).
2. **EAINT-12327 task** (created 2026-10-06 by Jira sync): no Dev PIC, no QA
   PIC, where-you-test unanswered, Est. 0 days. Scope (verbatim): "Test
   together with EAINT-12107". 8 required fields missing.

### Test script v0.2 — 2026-10-15

Faizuddin's 2026-09-15 draft (TS01–TS08, 9-column per-portal layout) is the
current script; it already covered the agreed scope and the QA Portal scope.
Edited 2026-10-15 after the study: Payment Method tiles per REQ-001/002,
GrabPay Full Amount in the steps, the EW Payment Reference ID checks
(REQ-014/015) on every CIBO surface, Payment Report "Payment mode" noted as
changing under EAINT-12327, and TS06 step 19 reworded to REQ-013 with the
parent-tick question left open. The generator's 12-row 7-column workbook was
retired. Detail: `_reference/tickets/EAINT-12107/NOTES.md` § "Test script —
v0.2". Gap found for EAINT-12327: its 7 Payment Mode strings have no Fiuu
Credit/Debit Card or Fiuu FPX entry, although Secarang pays card and FPX
through Fiuu (TS07/TS08). `[unconfirmed — ask Lim Yi Link]`

### Combined 12107 + 12327 test script — 2026-10-15

Because May Chin asked for 12327 to be "test together with 12107", the two
scripts are merged into one workbook in `_reference/tickets/EAINT-12107/`
(`EAINT-12107 + EAINT-12327 - Combined TS - ...xlsx`): 12107 v0.2 rows first,
then a purple banner and 12327_TS01..TS08 mapped onto the 12107 transactions.
The 12107 Payment Report lines now state the 12327 format as the expected
value for e-wallet rows; Credit/Debit Card and FPX rows stay "(Open)" until
Lim Yi Link supplies a format string (gap noted above). `[verified: file
built and re-read, 2026-10-15]`

### Automation for EAINT-12107 — scripts/eauto-12107 (2026-10-15)

Runner `/eauto/12107`, specs `scripts/eauto-12107/tests/{grabpay,regression}.spec.ts`.
Covers the Secarang leg of 12107_TS01/TS02 (GrabPay Full Amount, Success /
Failed) and TS07/TS08 (card / FPX). Everything on CIBO is manual. The chain
is the FPX one from `scripts/secarang-insurance` (see the top of this file);
only the payment leg is new, and its selectors (GrabPay tile, Full Amount,
Fiuu e-wallet and card popups) are `[unconfirmed]` until the pages are
captured — the first run logs them. Details and open points in
`_reference/tickets/EAINT-12107/NOTES.md` § Automation.

## Update 2026-10-27 from Charmain repo

Source: read-only clone `_reference/codebases/eauto-qa-charmain/`, folder
`intake/` (commit `0ab45d1`). Inventory: `script-inventory-team.md`.

1. **RHB payment failure matrices exist in Azfar's repo, not migrated:**
   `tests/staging/ucd/stms-payment/ucd-stms-payment.e2e.spec.ts` (P4) — "RHB
   failure codes at STMS payment" plus "the success code still completes a
   transfer"; probes `rhb-dp-branches.spec.ts` ("RHB DP — enquiry ...") and
   `rhb-failure-probe.spec.ts`. Uses his `src/fixtures/esim.ts` (JPJ / RHB simulator
   client). Status: deferred. `[charmain-repo: intake/reports/azfar.md:33-36]`
   `[charmain-repo: intake/reports/azfar-migration.md:42-51]`
2. **RHB response steering tool:** Charmain's 12054 `tests/tools/set-rhb-response.spec.ts`
   — "read / patch the RHB transfer response" and "restore the RHB transfer
   response to OK". Same idea as eSIM steering; always restore. `[charmain-repo: intake/reports/charmain-12054.json]`
3. **LKM refund payment retries (EAINT-9970 / 9971 / 9974):** Charmain's EAINT-104
   scripts `test-9970-retry-payment.mjs`, `test-9970-retry-redirect.mjs`,
   `test-9970-enquiry-failure.mjs`, `test-9971-nocharge.mjs`,
   `test-9974-first-payment.mjs`. `[charmain-repo: intake/reports/charmain-104.md:48-56]`
4. No file in these inventories is named for the eAuto onboarding Fiuu channels
   (Card, FPX B2B, DuitNow QR) or for ShopeePay / GrabPay. Automation for those is
   ours (`scripts/eauto-12107`, `eauto-12153`, `eauto-12257`, `eauto-duitnow-qr`,
   `eauto-payment-channels`). Charmain's `secarang-home-e2e.js` /
   `secarang-renewal-e2e.js` may pass through Fiuu on Secarang `[unconfirmed]`; see
   `flow-secarang-insurance.md`.
