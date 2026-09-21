# Flow — eSTM (eSerahan) creation, UCD portal

eSTM is the **core transaction** in eAuto. Insurance, eVOC, LKM refund and the
quotation-reminder work all hang off an eSTM existing and reaching a given
status, so most automation in other modules starts by needing one. Read this
before automating anything that requires an eSTM as a precondition.

Everything below is `[verified: _reference/automation code/eSTM (Nick's)/test1 ·
tests/estm-bypass-test.spec.ts, tests/estm-test.spec.ts,
scripts/run-estm-bypass-interactive.cjs]` unless tagged otherwise. The scripts are
Nicholas Lim's, shared 2026-08-13 as an R&D / test-data generator.

## Entry points

| Entry | Status |
|---|---|
| UCD home tile **eSERAHAN** (`#ESTM`) → eSTM home → `#create-tx` | **Verified** — note the eClassified T&C gate on first use, see [flow-ucd-shell.md](flow-ucd-shell.md) |
| Direct URL `/<env>/view/ucd/estm/view.do` | **Verified** |
| **Bypassed** URL `/<env>/zzz/<slot>/<env>/view/ucd/estm/transaction` | **Verified** — the only route that skips the biometric gate; see below |
| Resume a draft from the listing (`#isDraft` filter) | `[unconfirmed]` — the filter exists; still never automated. Not needed for EAINT-11864 TS03: that case's eSTM is fully `Approved` by the time it's back on the listing, so no draft is ever resumed there — see § The buy-insurance handoff below. |

## The bypass — how test eSTMs get created at all

A real eSTM requires **physical thumbprint / biometric verification** at step 1.
The non-bypass script has to sit and wait for it:

```ts
await page.waitForSelector('text=/thumbprint|biometric.*(success|verified)/i', { timeout: 30000 })
await expect(nextButton).toBeEnabled({ timeout: 30000 })
```

That can't be automated, so staging exposes a **URL path bypass**. Inject
`zzz/<slot>/<env>` after the env segment:

```
normal    https://staging.eauto.my/sit2/view/ucd/estm/transaction
bypassed  https://staging.eauto.my/sit2/zzz/22/sit2/view/ucd/estm/transaction
                                    └─ slot ─┘
```

- `<slot>` selects a pre-registered bypassed identity, currently **1–30**.
- **Before using a slot, open it manually and note its IC**, then patch your UCD
  user to that IC. The slot and the user must agree.
- Patch a **new sub UCD**, never your existing one — that account becomes a
  bypass account. You can later promote that sub UCD to main UCD without
  disturbing your original main UCD. `[from QA team, 2026-08-13]`

### The slot and the login user are one setting, not two

**A slot is bound to a specific IC, and the UCD you log in as must be patched to
that same IC.** Get them out of step and the portal blocks step 3 with
**"Please use login user's mykad"** — the second bypass asserts the identity
there, so that's where the mismatch surfaces, not at login.

So "use Nick's slot" necessarily also means "log in as Nick's UCD":

| Slot | Must log in as |
|---|---|
| `zzz/22` (team default) | `nsub2abc` / `abcd1234` |
| your own slot | your sub UCD, patched to that slot's IC |

The dashboard's login default changed to `faizuddinsub2` / `password` on
2026-08-17. The slot default stayed `zzz/22`, and **that pairing runs green** —
so `faizuddinsub2` is patched to a compatible IC. `[from QA team, 2026-08-17]`

⚠️ **Getting there needed a manual setup step on the tester's side**, done
outside the automation. It is not recorded here yet, and it is the first thing
to check when eSTM fails for a new person or on a new environment — the patch is
per-environment, so `sit2` working says nothing about `sit3`.
`[incomplete — ask Faizuddin what the manual step was and write it down here]`

To take your own slot: pick a free number (1–30), open
`/<env>/zzz/<n>/<env>/view/ucd/estm/transaction` manually, **note the IC shown**,
patch a *new* sub UCD to that IC, then set `ESTM_BYPASS_SLOT=zzz/<n>` and log in
as that user. The patch is **per environment** — patched on `sit2` says nothing
about `sit3`.

In the dashboard, leaving username/password blank falls back to
`faizuddinsub2` / `password` (it was `nsub2abc` / `abcd1234` until 2026-08-17).
The slot default stayed `zzz/22`, so the blank-field case is no longer
guaranteed to be a matched pair — see the warning above.
`[from QA team, 2026-08-13; defaults changed 2026-08-17]`

On **sit2**, slot `zzz/22` resolves to IC **990909010122**, and a completed run
shows that IC as *both* "Representative MyKad No" and "Buyer's MyKad No" —
the bypass makes the patched UCD its own buyer, which is exactly why the two
identities have to agree. `[verified live: sit2 payment step, 2026-08-13]`

The slot is configurable via `CONFIG.bypassSlot` / `ESTM_BYPASS_SLOT` (default
`zzz/22`); it is no longer hardcoded.

### Covering Main UCD and Sub UCD from one slot

The bypass account is a **sub** UCD, but scenarios often need an eSTM created by
a **main** UCD (EAINT-11864 splits its cases across both). One slot still covers
it: **promote the bypass sub UCD to main UCD, run, then demote.** Nick's note is
explicit that this can be done at any time and does not touch your original main
UCD. No second slot needed — the IC binding is what the bypass cares about, and
that doesn't change with the role.

Where the scenario checks **which** user received a notification, Main and Sub
UCD must have **different email addresses** — otherwise a routing bug passes.
`[from ticket EAINT-11864 test script]`

### What the flow cannot do

**MyKad and MyPR only.** The identity picker also offers `SYARIKAT (公司)`
(company), but neither the reference script nor `scripts/eauto-estm` supports it,
so **company eSTMs cannot be automated** — those stay manual. None of the
EAINT-11864 cases need one.

**This flow already exists in the repo** as `scripts/eauto-estm` (page objects,
run route `/api/eauto-estm/run`, UI at `/eauto/estm`) — a refactor of the
reference script. Extend that rather than starting again. **Two emails, two
rules:** the eVOC address is fixed at `faizuddin@modefair.com`, and the buyer
email must be a different address — see § The two email fields below. Both
come from the dashboard form at `/eauto/estm` (buyer email prefilled
`faizbidi03@gmail.com`); the suite's own fallbacks only apply to a hand-run
with nothing supplied, because **per-run defaults live in the dashboard, not
in the script config.**

### Step 5 "Payment" — two controls both labelled "Next"

`[verified: live HTML from sit2, 2026-08-17 —
_reference/html/eauto/estm-step5-payment.html]`

This step hung the automation, and the reason is worth knowing before touching
any eAuto popup.

**Submitting takes THREE clicks, through two dialogs.** Miss any one and the
payment silently doesn't happen.

```
click #to-payment            <div class="next-btn">Next</div>   (a DIV)
  ├─ dialog 1  "Payment" — "Sure to proceed with payment?"
  │    .cancel-dialog-btn  "Back"   |  .confirm-dialog-btn  "Next"
  ├─ dialog 2  "Sure to make this payment now?"
  │    .continue-dialog-btn "Save & Continue Later"  |  .confirm-dialog-btn "OK"
  └─ payment submits
```

Note the confirm labels differ per dialog — **Next** then **OK** — so matching
these by label does not generalise. Match on `.confirm-dialog-btn`.

⚠️ **`.continue-dialog-btn` is a third button class and it is NOT a cancel.**
"Save & Continue Later" abandons the payment and parks the transaction as a
draft. It looks like progress and produces no payment. Never click it, and
never write "click the last button in the buttonpane" — that is this button.

**The trap:** jQuery UI appends its dialog to the end of `<body>`, so
`getByText('Next').first()` resolves to `#to-payment` — the page control, which
comes first in DOM order — and never to the dialog. The run then sits with the
popup open forever. `getByRole('button', { name: 'Next' })` misses `#to-payment`
entirely (it's a `<div>`), so a naive fallback chain can click the page control
twice and the dialog zero times.

**Always confirm popups via `EstmSession.confirmDialog()`**, which scopes to
`.ui-dialog:visible` and clicks by the portal's own class hooks. Those classes
are applied in each dialog's `open:` handler and are consistent across the app —
the logout dialog tags "Yes" the same way. One variant uses
`.confirm-wfw-dialog-btn`; match both.

Two more things this page proves:

- **There is no "Make Payment" text on it.** Any code matching that is waiting
  on nothing; keep it only as a short-timeout fallback for other variants.
- **`disabled="true"` on `#to-payment` is added BY the click**, as a
  double-submit guard — it is absent in the before capture and present in the
  after one. So it is not a state to wait out; it is a signal the click landed.
  Playwright ignores `disabled` on a `<div>` anyway (actionability only honours
  it on real form controls and `aria-disabled`). Click, wait for the dialog, and
  click again if it didn't open — a click arriving mid add-on enquiry can still
  be dropped by the page's own handler.

### Step 5 add-ons — eLKM and eVOC

`[verified: both live captures, sit2, 2026-08-17]`

The portal ticks **both** on load, in `$(document).ready`:

```js
checkLkmAddon()                                  // #lkm-addson-checkbox
$("#evoc-addson-checkbox").attr("checked", true)
shouldSubmitLkm = true;  shouldSubmitEvoc = true;
```

| | Checkbox | Cost |
|---|---|---|
| eLKM (road tax) | `#lkm-addson-checkbox` | RM200 + RM2.75 processing |
| eVOC | `#evoc-addson-checkbox` | RM10 + tax |

Both default **on** in the dashboard and the suite, to match. `ESTM_ELKM=0` /
`ESTM_EVOC=0` untick them; an *unset* var means on, so a hand-run with a partial
`.env` gets the portal's own behaviour rather than a silent opt-out.

**Three traps when toggling them:**

1. **`shouldSubmitLkm` / `shouldSubmitEvoc` are the real submit flags**, not the
   checkboxes. They're plain JS globals, updated only inside the `change`
   handler `doEstmAddonEnq()`. Set `.checked` without dispatching `change` and
   the box *looks* unticked while the transaction still submits the add-on and
   still charges for it.
2. **Don't wait on the grand total to change.** Unticking eVOC when eLKM has
   already errored can leave the total identical, and a total-based wait then
   blows its timeout on a perfectly good run. Wait on the
   `/api/ucd/estm/transaction/addon-fee.get` response instead.
3. **Toggle one at a time.** Each dispatch fires its own enquiry; firing both at
   once races two responses onto the same summary.

The page can also force a box off on its own — `hasRetryWithoutLkm` unticks eLKM
and disables the whole block when the LKM enquiry fails, and any `errorMsg`
unticks *both*. Re-read the checkbox after toggling and log the mismatch rather
than assuming it took; the errors surface in `#lkm-error-msg` / `#evoc-error-msg`.

### Leaving step 5

Submitting is not the same as progressing. `#dialog` ("Payment is in process.
Please do not refresh or close the browser.") has **no buttons** — it clears
itself when the bank call returns, so wait for it to hide rather than trying to
confirm it. Then confirm the success signal properly: the step header stops
marking 5 as active (`.header-element-active .txn-header-div` no longer reads
`5`). Without that check a run can report done while still sitting on the
payment page under an error banner.

### Two eSTM suites — which is which

Same flow, two generations of the same code. Know which one you are running.
[verified: repo + a failing run, 2026-08-17]

| | Refactor (ours) | Original |
|---|---|---|
| Sidebar | **Create eSTM** (indigo, transfer arrows) | hidden — direct URL only |
| Page | `/eauto/estm` | `/eauto/estm-legacy` |
| Script | `scripts/eauto-estm` | `scripts/eauto-estm-legacy` |
| Route | `/api/eauto-estm/run` | `/api/eauto-estm-legacy/run` |
| Shape | page objects, fixture, session helper | one self-contained 459-line spec |
| Source | commit `c8a2f57` + working-tree changes | `_reference/automation code/eSTM Bypass/`, verbatim |
| Extra inputs | bypass slot, eLKM, eVOC email | none — eVOC is hardcoded, slot falls back to `zzz/22` |

**Not rival implementations** — ours is a page-object refactor of the original.
The script in `_reference/automation code/eSTM (Nick's)/` is a third, separate
thing that neither page runs.

**Keep the original runnable as a known-good baseline.** When ours fails, run
it: if it passes and ours doesn't, the fault is ours; if both fail, staging
changed. Editing it destroys that, so fix bugs in `scripts/eauto-estm`.

Both end on `page.pause()` unless `ESTM_SKIP_PAUSE=1`, which the run routes
always set — without it the run hangs waiting for a click in the Playwright
inspector.

### ⚠️ The 2026-08-17 eSTM failure was NOT a code bug

**The automation was correct the whole time.** The run failed because of a manual
setup step on the tester's side, which was then corrected; with that done, the
suite runs green. `[from QA team, 2026-08-17]`

Recording this because the investigation went the wrong way and the wrong
conclusion nearly became "fact" here. The reasoning was:

1. The failed run's `error-context.md` showed
   `TypeError: Cannot read properties of undefined (reading 'waitForLoadState')`.
2. Crosschecking against the original script found `EstmSession.active()` was
   missing the original's `?? page` fallback — a genuine divergence.
3. That divergence *can* produce exactly that TypeError, so it was written up as
   the root cause.

Step 3 is where it went wrong. A mechanism that **can** produce the observed
error is not the same as the one that **did** — and the crash was a downstream
symptom, not the origin. **A stack trace tells you where a run died, not why it
was going to.** Before blaming code for a failure that reproduces on one machine
and not another, rule out per-tester environment state — UCD patching, bypass
slot, credentials, VPN — because that class of difference is exactly what
"works on his device" points at.

The two divergences below are real and worth keeping, but they are **hardening,
not a fix for anything that was observed failing.**

### Two guards the refactor dropped (restored)

[verified: crosscheck against `_reference/automation code/eSTM Bypass/`, 2026-08-17]

**`getActivePage()` lost its `?? page` fallback.** The original ends
`return pages[pages.length - 1] ?? page`; `EstmSession.active()` returned just
`pages[pages.length - 1]`. eSERAHAN closes and reopens pages on nearly every
field, so if a window ever exists where **every** page in the context is closed,
the filter yields `[]`, `active()` returns `undefined`, and
`this.active().waitForLoadState(...)` throws *synchronously* — the trailing
`.catch(() => {})` never sees it. Restored by passing the fixture's page into
`EstmSession` as a fallback.

**`ensureChecked()` lost its closing assertion.** The original ends with
`await expect(...).toBeChecked({ timeout: 5000 })`. The refactor fell out of the
retry loop and returned quietly, so `#to-same-address`, `#ucd-consent` and
`#to-agree` could stay unchecked and the flow would carry on to fail several
steps later at an unrelated-looking Next button. Restored.

**The lesson for any future refactor of a working script:** a `?? fallback` and
a trailing assertion look like noise when you're extracting page objects. They
are usually the parts that were bought with debugging time. Diff the refactor
against the original and treat every dropped guard as deliberate until proven
otherwise.

The bypass is **staging-only test tooling**. It is not a production behaviour and
nothing about it should be asserted as product behaviour.

### How the script applies it

It reads the live segment out of the current URL rather than assuming one, with
`zzz/22` only as a fallback:

```ts
const dynamicSegment = ap.url().match(new RegExp(`/${env}/(.+?)/${env}/`))?.[1] ?? 'zzz/22';
```

`withSegment(url)` then re-injects it into later `/view/...` URLs. The bypass has
to be re-applied **twice** — after step 1's consent, and again before the step 4
agreement — because normal navigation drops back to unbypassed URLs.

⚠️ **The two bypasses are not interchangeable — do not "tidy" the second one.**

| | Bypass 1 (after step 1 consent) | Bypass 2 (before step 4 agreement) |
|---|---|---|
| Call | `withSegment(url)` | plain literal `.replace()`, slot hardcoded |
| Idempotent? | **Yes** — returns the URL untouched if a segment is already present | **No** — re-asserts the segment unconditionally |

Bypass 2 **must** re-inject even when a segment is already in the URL. Routing it
through `withSegment()` looks like an obvious de-duplication and silently breaks
the flow: the guard returns the URL unchanged, no bypass is applied, the portal
falls back to the real login identity, and step 4 dies on the popup
**"Please use login user's mykad"**.

The hardcoded `zzz/22` in bypass 2 therefore reads like a bug and isn't one worth
"fixing" — the team shares slot 22 permanently, so the constant is never wrong in
practice. `[verified live: broke it this exact way and reverted, 2026-08-13]`

## The steps

Entry: `https://staging.eauto.my/<env>/public/login/` → login lands on
`/<env>/view/ucd/home(.do)?` → **eSERAHAN** → **CREATE eSERAHAN TRANSACTION** →
dismiss the modal (**Close**) → pick identity type:

| Identity | Locator |
|---|---|
| MyKad | link `MALAYSIAN ( 马来西亚公民)` |
| MyPR | link `MyPR - PEMASTAUTIN TETAP` |
| Company | link `SYARIKAT (公司)` — present but not supported by the script |

then confirm on `button.confirm-dialog-btn` "Yes".

| Step | What it captures | DOM handles |
|---|---|---|
| 1 | Vehicle + buyer consent. **Biometric gate lives here** — this is what the bypass skips. | `#vehicleRegNo`, the eVOC email box, `#buyer-consent` |
| 2 | Contact details and vehicle identity | textbox `Reconfirm eVOC Email`, `Email Address`, `Mobile No`, `#to-same-address`, `Engine No`, `Chassis No` → **Next** → **Yes** |
| 3 | UCD consent | `#ucd-consent` → **Next** |
| 4 | Agreement | `#to-agree` → **Next** (text, not button) → **Yes** |
| 5 | Payment | **Make Payment** → **Yes** → payment dialog **Next** → **Next** → **OK** |
| 6 | Completion | **Done** → transaction details page |

### The two email fields on the buyer/vehicle step

`[verified: live HTML from uat1, 2026-08-18 —
_reference/html/eauto/estm-step2-buyer-vehicle.html]`

**There are two emails on this page and they are not interchangeable.**

| Field | Selector | Section | Rule |
|---|---|---|---|
| eVOC Email | `#email` (`name=email`), **readonly**, `.grey-text` | eVOC Details | **Always `faizuddin@modefair.com`.** Set on the previous step; the eVOC is sent here |
| Reconfirm eVOC Email | `#reconfirmEmail` | eVOC Details | Must **match** `#email` |
| Email Address (the **buyer** email) | **`#buyerEmail`**, `.is-required.mandatory` | Buyer Details | Must be **anything other than** the eVOC email |

`[from Faizuddin, 2026-08-18]`

Reuse the eVOC address as the buyer email and the form is rejected with
**"Please enter Buyer's Email Address."** — `span.is-invalid-buyer-email-buyer`,
which is the one error span rendered **visible** (`style=""`) in the capture
while every sibling is `display:none`. The page was captured mid-rejection, so
that span doubles as the worked example.

Both fields carry a usage ceiling: **`.is-invalid-buyer-email-buyer-threshold`
— "Email address has reached its max number (3) of usages within the last 30
days"**, and `#contactNo` has the identical rule for mobile numbers. So a fixed
buyer email survives only three eSTMs a month before the flow starts failing on
a rule that has nothing to do with the code.

⚠️ **Beware the accessible names here.** `#email` is titled "eVOC Email",
`#buyerEmail` is titled **"Email Address"**, and `#reconfirmEmail` is
"Reconfirm eVOC Email" — so a role lookup for `/Email/` matches all three.
`scripts/eauto-estm` uses `getByRole('textbox', { name: 'Email' })` for the eVOC
box and `{ name: 'Email Address' }` for the buyer box, and those only stay
apart because of when in the flow they run.

**Do NOT "fix" that by switching to the ids.** Swapping the eVOC box to
`#buyerEmail` on 2026-08-18 broke the run — the **biometric gate appeared,
meaning the bypass never applied**. An id matches the moment the element
exists, including on a page mid-redirect, so the fill lands on a page about to
be replaced and the bypass then reads its dynamic segment from the wrong URL.
The role lookup is slower and resolves after the page settles, and this stretch
depends on that — the same lesson as the suite's `slowMo: 600`. **In the eSTM
buyer stretch, timing is behaviour.** `[verified by breaking it, 2026-08-18]`

### The rest of the buyer/vehicle form

Same capture. Buyer Details: `#buyerEmail`, `#contactNo` (`maxlength=11`,
`.valid-contact`), `#mailingAddress1-3` (`maxlength=30` each), `#postCode`
(`maxlength=5`), `select#state`, `select#district`, and `#to-same-address`
("Same as MyKad"). Vehicle Details (as per VOC): `#vehicleRegNo` **readonly**,
`#vehicleEngineNo` (`maxlength=22`), `#vehicleChassisNo` (`maxlength=30`).
Buyer Authentication is readonly and comes from the bypass identity:
`input[name=name]` and **`#refId`** (the MyKad the quote must use — this is the
field `scripts/eauto-estm` prints as `BUYER_IC:`).

Actions are `#to-cancel` and **`#to-continue`** (`input[type=submit]`,
`value="Next"`). The form posts to
`/ajax/ucd/estm/transaction/save-form.do?category=1&companyCategory=` carrying
hidden `transactionId`, `buyerCategory`, **`bypass`** (`false` in the capture)
and `cancelLkm`.

Two page-level traps worth knowing: **paste is blocked on every input** except
engine and chassis number (a 500 ms interval rebinds it), and the same interval
strips `~` and trims whitespace from every field that is not focused. Dialogs:
`#duplicate-transaction-msg` (same vehicle + owner already recorded — OK sends
you back to the transaction list), `#missing-postcode-city-state`, `#blockCase`,
`#sure-to-continue`, `#sure-to-cancel`, `#clear-mailing-address`.
The portal's own step labels (from the step header) are **1 Buyer (Customer) ·
2 Vehicle · 3 Seller (Dealer) · 4 JPJ Check · 5 Payment · 6 Transfer**. Use those
when reading a test script — "step 5" means Payment.

**"Next" on the Payment step is a `<div>`, not a `<button>`:**
`<div id="to-payment" class="next-btn">Next</div>`, alongside
`<div id="to-continue" class="save-btn">Save & Continue Later</div>`. This is why
a Next click needs the button-or-text helper — `getByRole('button')` misses it
entirely. The payment confirmation dialog that follows *does* use real buttons:
`button.confirm-dialog-btn` ("Next") and `button.cancel-dialog-btn` ("Back").

### Step 4 — JPJ Check: two renders, two clicks, on the SAME page

`[verified: live HTML, 2026-08-18 —
_reference/html/eauto/estm-step4-jpj-check-submit-dialog.html,
estm-step4-jpj-passed-payment-summary.html]`

Step 4 ("Submission (JPJ Checking)") is **one URL that renders twice**, before
and after the JPJ enquiry resolves — no navigation happens between the two,
which is what makes this step easy to get wrong. This took three attempts to
automate correctly; each one is worth knowing since the failure mode looked
identical ("stuck on step 4") for two different reasons.

**Render 1 — landing on step 4.** A jQuery UI dialog shows immediately,
before anything else on the page is actionable:

```html
<div id="to-retry-dialog" title="Submit">Submit to JPJ for checking?</div>
<!-- buttons: "No" (.cancel-dialog-btn), "Yes" (.confirm-dialog-btn) -->
```

Dismissed via `EstmSession.confirmDialog()` (matches `.confirm-dialog-btn` /
`.confirm-wfw-dialog-btn`, the same hook every other eAuto dialog uses). A
single confirm isn't always enough — `#to-retry-dialog`'s own name suggests
the enquiry can need more than one — so poll rather than assume one click
suffices.

**Render 2 — after the JPJ enquiry resolves, SAME URL.** JPJ results appear
(`Response Code: SUCCESS`, `JPJ Enquiry Status: OK`), immediately followed on
the SAME page by a **read-only** Payment Summary (JPJ Fee, eHakMilik Fee
(FIS), eSerahan Fee, Service Tax, Total Amount Payable) and:

```html
<div class="button-bar">
  <div id="to-continue" class="save-btn">Save &amp; Continue Later</div>
  <div id="to-payment" class="next-btn">Make Payment</div>
</div>
```

**There is no `#lkm-addson-checkbox` anywhere on render 2.** That only exists
on the REAL Payment step (step 5), reached by clicking **`#to-payment`**
("Make Payment") — a click nothing does automatically. Confusingly,
`#to-payment` is also the id used on the ACTUAL Payment step for a different
purpose (see the "Next" div in the payment-step-5 section below) — same id,
different page, different job; don't assume "found `#to-payment`" alone means
you've reached step 5.

**Three fix attempts, in order, to record what each one actually solved:**

1. Nothing dismissed the "Submit to JPJ for checking?" dialog at all — every
   check for step 5's `#lkm-addson-checkbox` sat on render 1 forever, no
   matter the timeout (tried 20s, then 90s).
2. Dismissed the dialog once, still checked for `#lkm-addson-checkbox` — sat
   on render 2 (the JPJ-passed page) for the full timeout (180s), since that
   element genuinely doesn't exist there. The eSIM 69E call, sequenced right
   after this in the code, never ran — the whole step never succeeded.
3. **Fixed:** wait for render 2 by checking for `#to-payment` (not the
   checkbox), THEN — for TS06 — set the e-simulator's Response Code, THEN
   click `#to-payment`, THEN check for `#lkm-addson-checkbox` on the page that
   click leads to. `[from Faizuddin, 2026-08-18]` See
   `EstmHandoffPage.waitForJpjResult()` / `advanceToPaymentStep()`.

**One more dialog sits between clicking `#to-payment` and actually reaching
the real Payment step** — a "Sure to continue?" confirmation:

```html
<div id="sure-to-continue-payment" title="Confirmation">Sure to continue?</div>
<!-- buttons: "No" (.cancel-dialog-btn), "Yes" (.confirm-dialog-btn) -->
```

`[from Faizuddin, 2026-08-18]` Same class hooks as the JPJ dialog, dismissed
the same way (`confirmDialog()`), and `advanceToPaymentStep()` polls for it
the same way too — confirm whatever's showing, check for
`#lkm-addson-checkbox`, repeat — rather than assuming a single click clears
it, having already been burned by that assumption once on the JPJ dialog.

**For TS06 specifically: the e-simulator call goes between render 2 and
clicking `#to-payment`** — immediately after the JPJ result lands, before
Make Payment — not "right before eLKM is unticked" as an earlier reading of
this section assumed. `[from Faizuddin, 2026-08-18]`

The rest of step 4's page: read-only Dealer/Buyer/Vehicle fields (same shape
as steps 1–3's tables), `#i-agree` with its own Terms & Conditions link and
`#to-enquiry` ("Next") — present on render 1, before JPJ resolves — and the
insurance-handoff dialogs `#insError` / `#insDoneBuy` / `#blockCase`.
`#to-buy-insurance`'s click handler is bound on THIS page via inline
`<script>` on both renders — not the Payment step as an earlier read of the
handoff table below implied — though the button's own markup still hasn't
appeared in either capture, so whether/when it actually renders here is still
`[unconfirmed]`.

### eSTM → insurance handoff (the EAINT-11864 entry points)

Three routes out of the Payment step into the insurance flow, all keyed on the
eSTM `transactionId` (a UUID):

| Trigger | What happens |
|---|---|
| `#to-buy-insurance` button | `→ /<env>/view/ucd/insurance/quote/processQuoteFromEstm.do?transactionId=<uuid>` |
| `getInsuranceQuote()` | `POST /<env>/api/ucd/insurance/quote/process-quote.do?transactionId=<uuid>` then `→ /<env>/view/ucd/insurance/plan/view.do?transactionId=<insuranceTxnId>&isFirstTime=true` |
| **eSTM response `VEL000069E`** | `doEstmAddonEnq()` calls `getInsuranceQuote()` **automatically** |

That third row confirms the 69E behaviour the EAINT-11864 script describes
("User will automatically directed to insurance page after eSTM step 4") — it is
a client-side branch on `json.estmResponseCode`, fired from the add-on fee
response. Note the insurance flow uses its **own** transaction id, returned by
`process-quote.do`, not the eSTM one.

`/<env>/view/ucd/insurance/plan/view.do?...&isFirstTime=true` is therefore the
start of the insurance purchase flow. `[verified: live DOM from a sit2 run, 2026-08-13]`

#### TS06: where the e-simulator call goes, and when the redirect fires

`[from Faizuddin, 2026-08-18]` **The e-simulator's Response Code is set
immediately after the JPJ result lands on step 4 (render 2 above), before
clicking `#to-payment`** — not "right before eLKM is unticked" as an earlier
version of this section claimed. See § Step 4 — JPJ Check above for the full
render-1/render-2 breakdown and the id trap (`#to-payment` exists on both
render 2 and the real Payment step, meaning two different things).

After that, **nothing about the Create eSTM flow differs for the 69E case at
all** — Make Payment, untick eLKM, submit, Done, exactly like every other run.
`completePayment()` runs completely untouched, in full; the redirect into
insurance follows once that finishes, not on the eLKM toggle itself. Do not
read the handoff table's "automatically" as "instead of completing payment" —
an early attempt tried to catch the redirect mid-toggle, skipping payment
submission entirely, which is wrong for the 69E case.

**That "TS02 redirects right on the untick" reading was wrong, and cost real
manual clicking before it was caught — twice.** The untick only recalculates
the fee (the `addon-fee.get` call); nothing about it submits the payment.

The first fix (2026-08-19, now itself superseded) called
`EstmPaymentPage.submitPayment()` right after the untick — the same "Yes →
Make Payment → Yes → Next → Next → OK → Done" sequence TS06 uses. That still
stalled: toggling an add-on changes the payable amount, and THAT pops a
dialog `submitPayment()` was never built to handle —
**"Sure to make this payment now?"** (`#fis-amount-different-dialog`, confirm
button labelled **"OK"**, not "Yes"). `submitPayment()`'s hardcoded lookups
(a "Yes" button, then "Make Payment" text, then another "Yes", then "Next")
all quietly no-op against it — each is wrapped in `.catch()` — and its last
resort, `getByText('Next', {exact:true})`, tries to click the underlying
page's `#to-payment` while a modal overlay sits on top of it: blocked,
silent timeout, same stall as before. TS06 never surfaces this dialog at all,
since it never touches an add-on and the amount never changes — so
`submitPayment()` working for TS06 proved nothing about whether it would
work here. `[verified: live HTML from uat1, 2026-08-19 —
_reference/html/eauto/estm-step5-payment-fis-amount-different-dialog.html]`

**Second fix, 2026-08-19:** stopped reusing `submitPayment()` for this path
entirely. `untickElkmAndAwaitRedirect()` now clicks `#to-payment` itself,
then repeatedly calls `EstmSession.confirmDialog()` — which matches
`.confirm-dialog-btn` regardless of the button's label, so it closes "Sure to
make this payment now?" (and anything else that shows the same way) without
needing to know its exact wording — polling until either the insurance
redirect lands or a `Done` button appears. Same resilient-polling shape as
`waitForJpjResult()`/`advanceToPaymentStep()` above, applied to the one place
that still had a rigid button-name chase instead.

Neither fix touched `setAddons()`/`CONFIG.elkm`: env vars set from inside this
same process, after `eauto-estm/data/config.ts` is already imported, never
reach `CONFIG` — that only works for TS04's spawned child process, which gets
its env before it even starts. Calling `EstmPaymentPage.completePayment()`
here (which runs `setAddons()` before its own `submitPayment()`) would have
silently re-ticked eLKM back to that frozen default.

#### CONFIRMED WORKING END TO END, 2026-08-18

The full chain — login → create eSTM → JPJ Check confirm → JPJ-passed render
→ e-simulator Response Code set to `VEL000069E` → Make Payment → "Sure to
continue?" confirm → Payment step (`#lkm-addson-checkbox` present) →
`completePayment()` (untick eLKM, submit, Done) → auto-redirect — lands on
insurance step 1 (`body#insurancePlan`), confirmed via a live capture:
`_reference/html/eauto/insurance-step1-after-69e-redirect.html`. This is
`EstmHandoffPage.completeEstmWithForcedInsurance()` in
`scripts/eauto-quotation-reminder`, and it is one of (at least) three ways
into the insurance flow that all start from an eSTM — see § eSTM → insurance
handoff above and [flow-insurance-purchase.md](flow-insurance-purchase.md)
§ Entry points for the other two (the details-page banner, and the plain
eSTM-entry untick used by TS02/TS03).

**Two findings from that capture worth carrying forward:**

- **69E is not actually "forced, no way out."** The insurance step 1 page
  carries an explicit escape:
  ```html
  <div class="action-row">
    The vehicle is eligible for road tax renewal, but no valid motor
    insurance found. The system has redirected you to purchase insurance.
    You may skip and return back to eSerahan.
    <button id="estmBackBtn">Skip, Return to eSerahan</button>
  </div>
  ```
  So "forced" means "redirected here automatically," not "cannot leave
  without buying." TS06 does not need to complete a purchase to prove its
  point — reaching step 1 (or wherever the case's stop point is) and
  observing the reminder behaviour is enough. `[from Faizuddin, 2026-08-18]`
- **Only the insurers the e-simulator decides to quote appear** — this
  particular vehicle got exactly two cards (Chubb, Takaful). Confirms
  "select whichever insurer card is first" (no hardcoded name) is the right
  design for every case that reaches this page, not just a convenience.

### Step 5 add-ons — eLKM and eVOC are ticked automatically

The Payment step renders an **Add-on Services** block and ticks **both** boxes on
load, in `$(document).ready`:

| Add-on | Checkbox | Default | Cost |
|---|---|---|---|
| eLKM (Road Tax) | `#lkm-addson-checkbox` | **ticked**, 12-month (`#renewalPeriod_12`) | ~RM200 + RM2.75 fee |
| eVOC | `#evoc-addson-checkbox` | **ticked** | RM10 fee |

**Unticking eLKM requires dispatching the native `change` event.** The page
recalculates fees in a jQuery `change` handler (`doEstmAddonEnq()`), and that
handler is what updates the `shouldSubmitLkm` flag and the payment total. Set
`.checked = false` without firing `change` and the box *looks* unticked while the
transaction still submits LKM and still charges for it. After dispatching, wait
for the `addon-fee.get` AJAX to land — `#grandTotalAmount` changing is the signal.

`scripts/eauto-estm` defaults eLKM **off** (`CONFIG.elkm` / `ESTM_ELKM=1` to keep
it): EAINT-11864 TS02/TS03 need it unticked, LKM requires an active insurance
the test data doesn't have, and it inflates every throwaway transaction.
`[verified: live DOM from a sit2 run, 2026-08-13]`

### After completion

From the details page: **Invoice** and **Slip Pengesahan** buttons each open a
popup *and* fire a download — register both listeners before clicking.
**eSTM Transaction Listing** → **Search Now** lists transactions; each row links
by title `to view <txn id>`, and the details page exposes **e-Invoice** (also
popup + download).

Transaction IDs look like **`E631940085`** — `E` followed by 9 digits.

## The eSTM module pages — verified DOM

`[verified: live HTML from uat4, captured 2026-08-14]`. Read
[flow-ucd-shell.md](flow-ucd-shell.md) for the shared header, popup chain and
listing pattern.

### eSTM home — `/view/ucd/estm/view.do`

| Tile | Selector | Destination |
|---|---|---|
| eSERAHAN TRANSACTION LISTING | inline `onclick` | `/view/ucd/estm/enquiry/main.do` |
| **CREATE eSERAHAN TRANSACTION** | `#create-tx` | starts the flow above |
| eSERAHAN PERMISSION | `#one-layer-permission` | `/view/ucd/estm/estm-permission/one-layer/list-user.do` |
| eLKM PERMISSION | `#lkmPermission` | `/view/ucd/estm/lkm/user-permission/list-user.do` |

Two blocking dialogs live here for accounts without an RHB Islamic current
account: `#check-rhb-activation-dialog` (can't create) and
`#check-rhb-interstate-accept-dialog` (can't accept an interstate transfer).

### eSTM listing — `/view/ucd/estm/enquiry/main.do`

Standard `#search-form`; **rows render only after `#to-search`**. Beyond the shared
filters it adds `input#isDraft` ("Show Draft Trx Only") and two extra filter rows:

| Filter | Selector | Options |
|---|---|---|
| Transaction Status | `select[name=status]` | `New`, `Pending`, `CommitedJPJApproved` (= Committed), `Approved`, `Failed`, `Cancelled` |
| eLKM Payment | `select[name=lkmPaymentStatus]` | `Paid`(OK), `Pending`, `Failed`, `New`(-) |
| eLKM JPJ | `select[name=lkmJpjSubStatus]` | `Approved`(OK), `Failed`, `Pending`, `New`(-) |
| eVOC Payment | `select[name=evocPaymentStatus]` | same shape |
| eVOC JPJ | `select[name=evocJpjSubStatus]` | same shape |

Date pickers: `#lkmPaymentFromDate`/`#lkmPaymentToDate`,
`#evocPaymentFromDate`/`#evocPaymentToDate`. Note the status selects all reuse
`id="to-filter*"` variants — **filter by `name`**.

**21 columns**, in order: `#`, Vehicle, Transaction No, Buyer Name, Created At,
Method, JPJ Check, Payment, JPJ Transfer, Tx Status, e-Invoice Status, eLKM JPJ
Check, eLKM Payment, eLKM JPJ, eLKM e-Invoice Status, eVOC JPJ Check, eVOC
Payment, eVOC JPJ, eVOC e-Invoice Status, Remarks, Action. Values are `OK` /
`Failed` / `Approved` / `-`, colour-coded green `#008E00` / orange `#FF4000` /
black.

- **Buyer Name is truncated to 15 characters** (`MUHAMMAD FAIZUD`,
  `TEST FAIZ SDN B`). Compare a prefix, or read the full name from the details
  page.
- Action column: `a[href*="enquiry/view.do?id=<uuid>"]`, plus **`a.to-retry`** when
  payment failed — `onclick="reSubmitPayment('<uuid>','<chassis>','<engine>')"`.
- `Method` shows the payment rail, e.g. `RHB`.
- Two canned messages sit in the page: `#duplicate-transaction-msg` (same vehicle +
  owner already recorded) and `#insDoneBuy` ("Insurance must be purchased through
  our platform for this vehicle").
- Observed real remarks worth recognising: `TIN verification failed…`,
  `Submission failed due to unexpected error`, and
  `RE - Sila TUNGGU 6 minit kemudian klik 'Resubmit'. Sistem RHB sedang diproses.`
  — that last one means **wait 6 minutes before retrying**, not a defect.

### eSTM details — `/view/ucd/estm/enquiry/view.do?id=<uuid>`

**The details URL takes `?id=`, not `?transactionId=`** — the opposite of the
insurance details page. Easy to get wrong when reusing helpers across modules.

Header: `.title-id` (vehicle no), `.ref-no` ("(Ref No: E681941369)"),
`.trx-details-status.approved`, and hidden `input#transactionId` holding the UUID.
Print actions: `#to-print-invoice`, `#to-print-jpj-receipt` ("JPJ Official
Receipt"), `#to-print` ("Slip Pengesahan").

Data is laid out as `.box-container > .box`, each with an `h3.subtitle` and rows of
`div.flex.flex-row > h6.label + h6.data`. Sections present:

- Category / Engine No / Chassis No; Date Created; **Request eVOC** (Yes/No)
- **e-Invoice (eSTM)**, **(eLKM)**, **(eVOC)** — each with e-Invoice Submission
  Date, LHDN Response Status, e-Invoice Validation Date. Only available for
  customers with a valid TIN, and only for transactions in the **current calendar
  month** — the page states both.
- Buyer: Name, MyKad No, Mobile No, Buyer's Email, **eVOC Email**, Latest Address,
  MyKad/Thumbprint verified on
- Dealer (Seller); Dealer's Authorised Representative
- **JPJ Enquiry** — a numbered list of attempts, each `timestamp - OK (GLB000000I)`
- JPJ Enquiry Status: Valid As At, Blacklisted, Condition Code
- JPJ Transfer (Final Submission) / eVOC (Final Submission) / eLKM (Final
  Submission) — each a timestamp plus `h6.successful`
- **eLKM Details**: Amount, Effective Date, Expiry Date, eLKM Tx No
  (`LKM68070950`), Declaration Area (`Semenanjung`)
- Payment Details (eSTM) / (eLKM) / (eVOC) — numbered rows
  `timestamp - RHB (<paymentRef>) - OK`, with `.text-green` on the status. Payment
  refs follow per-service prefixes: eSTM `2608140017000001`, eLKM
  `LK260814000001`, eVOC `EV260814000001`, each also appearing suffixed with the
  vehicle no.

Timestamps here are **`14-08-2026 10:33am`** — 12-hour with meridiem, unlike the
listing's 24-hour `14-08-2026 10:33`. Normalise before comparing across surfaces.

### The buy-insurance handoff, confirmed in markup

The details page carries `#buy-insurance-dialog` with `#doNotProceed` ("NO") and
`#toProceed` ("YES" → `redirectInsuranceQuote()`). That is the eSTM → insurance
entry point described above, now confirmed in live HTML rather than inferred.

**This is what EAINT-11864 calls the "Banner" entry (TS03)** — reached by searching
the eSTM listing by vehicle number and opening the matching transaction. It lands
on **insurance step 1**, skipping the Get Free Quote form. The full route is written
up in [flow-insurance-purchase.md](flow-insurance-purchase.md) § Banner entry;
don't duplicate it here. `[from QA team, 2026-08-17]`

**TS03's own eSTM is already `Approved` (fully paid) by the time it's reopened —
there is no draft to resume.** The earlier assumption that TS03 needed to "abandon
insurance, go back and finish paying the same eSTM" before the banner would appear
was never confirmed and turned out to be unnecessary: unticking eLKM on the
Payment step and letting the auto-redirect fire is apparently enough to leave the
transaction Approved (Tx Status / Payment / eLKM all `OK`) — confirmed by the
listing row and details page for the same transaction (HX056 / E681941406). The
real second entry is just: listing → search by vehicle no → **View** → details
page's `GET FREE QUOTE FOR <plate>` button (`#to-buy-insurance`) → confirm dialog
(`#buy-insurance-dialog` → `#toProceed` → `redirectInsuranceQuote()`).
`[verified: live HTML from uat1, 2026-08-19 —
_reference/html/eauto/estm-listing-with-approved-row.html,
estm-details-with-buy-insurance-banner.html]`

Beware: the UCD **home** page registers a handler on the same id
`#to-buy-insurance` pointing at `/view/ucd/insurance/quote/view.do?transactionId=`
with an empty id, and no matching element is present there. Different button, same
name — see [flow-ucd-shell.md](flow-ucd-shell.md).

## Traps — all of these cost the reference script real code

1. **Pages close and reopen mid-flow.** Redirects here destroy the page object.
   Every interaction goes through a `getActivePage()` helper returning the newest
   non-closed page in the context; a stale handle throws. This is the single
   biggest structural difference from a normal Playwright flow — **never hold a
   `page` reference across a navigation in this module.**
2. **Campaign banners intercept clicks, and they rotate.**

   **On the home page, don't close them — suppress them.** Set the `home*`
   localStorage flags before load and no dialog ever opens; the live-HTML selectors
   and the flag list are in [flow-ucd-shell.md](flow-ucd-shell.md). That is the
   preferred approach now. `[from QA team, 2026-08-14]`

   The escalation below remains the fallback, and is still the only known answer for
   banners on **transaction pages**, which the `home*` flags do not cover. The
   campaign changes with the marketing calendar and **the selector shape changes
   with it** — so match on a class *prefix*, never a fixed id:

   | Campaign | Element |
   |---|---|
   | Raya | `#dialog-raya-campaign` (id) |
   | Merdeka (current, 2026-08) | `<img class="dialog-campaign-1 dialog-campaign-frame">` (class, no id) |

   `[class*="dialog-campaign"]` catches both, and the numbered suffix means
   **more than one banner can stack** — Merdeka shows two. Close them one per
   round until none remain, re-resolving the page each round.

   When no close control matches, hiding the banner element alone is not enough:
   an `<img>` banner sits inside a fixed overlay that keeps eating clicks. Walk
   up to the outermost overlay ancestor, hide that, remove `.modal-backdrop`,
   and clear `modal-open` from `<body>`.
   `[verified live: sit staging, 2026-08-13]`
3. **The consent checkboxes are custom controls** and resist `.check()`. All four
   — `#buyer-consent`, `#to-same-address`, `#ucd-consent`, `#to-agree` — need the
   same escalation: `check({force:true})` → click `label[for=...]` → JS that sets
   `disabled=false`, `checked=true` and dispatches **both** `input` and `change`.
   Without the dispatched events the app never registers the change.
4. **Blurring `Email Address` triggers a redirect**, invalidating the page handle
   before `Mobile No` is filled.
5. **"Next" is a `<button>` on some steps and clickable text on others**, so it
   needs a two-strategy helper. Step 4's Next is text-only.
6. **eSERAHAN needs click retries** (4 attempts) because the popup can reappear.

## Running the reference script

`npm run estm_bypass` from `test1/` launches an interactive prompt collecting:
env segment (e.g. `sit2`), username/password (defaults to Nick's bypass sub UCD
`nsub2abc` / `abcd1234`), ID type (1 = MyKad, 2 = MyPR), vehicle reg no, and
email/mobile (either randomised or typed). These are passed to the spec as
`ESTM_*` env vars — the spec throws if any required one is missing.

Test data it uses: Engine No `*/ -1231Aa`, Chassis No `913821AA/* --` (deliberate
special characters), random mobile `01` + 7–9 digits, random email
`<10 chars>@test.com`.

**Before reusing this code:**

- `fixedEmail` is **hardcoded to `nicholas.lim@modefair.com`** for eVOC. Change it.
- It ends with `page.pause()`, which blocks forever — remove for unattended runs.
- It does **no assertions** — Nick's note is explicit that it's a data generator
  and a reference, not a test.
- Config sets `slowMo: 600` and the launcher forces
  `--project=chromium --headed --workers=1`.

## What is NOT covered

- **Company (`SYARIKAT`) eSTMs.** The identity picker offers it; neither script
  supports it, so those stay manual.
- **The non-bypass path.** Real biometric/thumbprint verification cannot be
  automated at all — everything here depends on the staging slot bypass.
- **Resuming a draft** transaction from the listing.
- **The `Cancelled` and `Pending` status paths.** Only the happy path through to
  `Approved` is exercised; the listing filters for the others exist but nothing
  drives a transaction into them deliberately.
- **eLKM / eVOC as first-class subjects.** They are ticked or unticked as add-ons
  here; their own flows, refunds and JPJ resubmissions are not documented.
- **Interstate / UCD-to-UCD transfers**, which have their own accept path and RHB
  account gate.
- **BO-side views** of an eSTM.
- **The insurance leg.** Picks up in
  [flow-insurance-purchase.md](flow-insurance-purchase.md).
