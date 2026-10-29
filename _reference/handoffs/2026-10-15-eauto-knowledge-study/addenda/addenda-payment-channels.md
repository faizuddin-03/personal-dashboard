# Addenda — facts that belong in files not owned by this task (2026-10-15)

Each entry: target file → section → proposed text. Nothing below has been
applied.

## knowledge/eauto-payments.md → § "eAuto payment is a simple click — the default assumption"

Old text: "No gateway page, no bank login, no TAC, **and no QR — QR payment is
not implemented in eAuto**; when it is, it will be scoped to one module.
`[from Faizuddin, 2026-08-18]`"

Add after it: "Scoped since 2026-09-02: the one module is **UCD onboarding**
(EAINT-12257, Pre-application and Application payment steps). See
[flow-payment-channels.md](flow-payment-channels.md). The sentence above
still holds for every other eAuto module."

## knowledge/eauto-payments.md → § "UCD onboarding payment (Pre-application / Application)"

1. Replace "Still open before writing code against it: whether the step is
   genuinely gateway-framed (believed yes, unverified)" with: "**Answered**:
   the tiles and the bank grid are eAuto-hosted on `/obs/preOnb/form/<uuid>`
   (pre-app) and `/obs/form/...` (step 5). Only `Submit and Pay` opens Fiuu —
   a **popup** to `sandbox-payment.fiuu.com`, then `bank-simulator.fiuu.com`.
   `[verified: reference pack 02-screens/34-registration-fee.aria.yaml;
   05-known-traps.md §5]`"
2. Add: "The two stages are **separate charges**: RM 108.00 (Payment ID
   `P…`) and RM 990.00 (Payment ID `A…`), each with its own Payment Details
   block. `[verified: reference pack 02-screens/14-*.txt and 35-*.txt]`"
3. Contradiction to resolve with the team: this file records (EAINT-12414
   scope, 2026-09-30) "FPX B2B is NOT covered here because it is not deployed
   yet", but the 23-08-2026 walkthrough recording already showed three tiles
   including "FPX Online Banking (Business)" and the 31-08-2026 aria capture
   shows "Online Banking (Business)". Either the tile exists without a working
   rail, or "not deployed" refers to the v1.1 pending-approval flow
   (REQ-004-007). `[unconfirmed]`
4. § "Automation skeleton — TS3-TS8": add "The only project that actually
   drives this step is `scripts/eauto-duitnow-qr` (FPX Personal leg confirmed
   from the reference rig; QR leg unverified). The skeleton's
   `FpxBankLoginPage`/`FpxBankTacPage` should port from
   `scripts/eauto-duitnow-qr/src/payment.ts` (`simulatorLogin`,
   `driveSimulator`, `payByFpx`), which was matched live on this module, rather
   than from `scripts/secarang-insurance`, whose `select#status_code` /
   `div.otp` selectors are unconfirmed here."

## knowledge/quirks.md → § "Modals" (or a new § "/obs onboarding app")

1. "**`page.once('dialog')` stays armed when the dialog never fires.** The
   next action that raises a dialog then has two handlers and throws 'Cannot
   accept dialog which is already handled' *after* its own action succeeded —
   a run once reported failure on a change that had gone through. Scope the
   handler with `on`/`off` around the one action.
   `[verified: scripts/eauto-duitnow-qr/src/obs.ts:100-117]`"
2. "**`/obs` pages never fire `load` or `domcontentloaded`** (~48 assets never
   answer). Navigate with `waitUntil: 'commit'` and poll document size.
   `[verified: scripts/eauto-duitnow-qr/src/obs.ts:11-16]`"
3. "**A cold GET of `/obs/admin/*` returns ~39 bytes of empty HTML**, no
   redirect, no 403, until the `/<instance>/api/admin/onboarding/auth-redirect.do?type=…`
   handoff has been hit in the session. `[verified: src/obs.ts:5-9, 27-28]`"
4. "**A direct `/obs` 403 is not a permission finding** — a HubAdmin control
   run got the same 403 without the menu handoff. `[verified: reference pack
   01-flow/03-actors-urls-accounts.md § role model]`"

## knowledge/eauto-portals.md → environments / URL structure

"The onboarding module (`/obs`) sits **outside** the instance path:
`https://staging.eauto.my/obs/...`. BackOffice login and the `/obs` handoff
(`/<instance>/api/admin/onboarding/auth-redirect.do`) take the instance; the
dealer-facing `/obs/preOnb/*` and `/obs/form/*` pages and the `/obs/admin/*`
listings do not. `[verified: scripts/eauto-duitnow-qr/src/env.ts:8-21]`"

## lib/ticketStudies.ts → EAINT-12153 entry

1. `decisions` "Payment page hosting": change to answered — eAuto-hosted
   tiles, Fiuu popup after Submit and Pay (sources as above).
2. `openItems` "Does eAuto charge Pre-application and Application
   separately?": answered — yes, RM 108.00 + RM 990.00, two Payment IDs.
3. `scope.environment`: the onboarding module has one staging (`staging/obs`,
   per eauto-payments.md § EAINT-12414 scope); `app/eauto/company-details-checker/TestScriptTab.tsx`
   defaults `envSegment` to `uat1` and `scripts/eauto-payment-channels/data/config.ts`
   to `/sit3` — both are guesses that contradict the `/obs` rule.
4. Add to `automation.blockers`: the sheet's TS1/TS2/TS3/TS6 use SSM business
   types (Sdn Bhd, Sole Prop, LLP, Sdn Bhd) and so need Company-Details-Checker
   data; only TS4 (Sabah) and TS5 (Sarawak) run on generated identities.
5. Add: the sheet's payment-leg expected result "Ensure in Pre-Application
   listing, it is Status = Approved" is only true after the BO approver acts;
   the status straight after payment is **New**. `[verified: reference pack
   FLOW-video-verified.md Phase 2-3]` `[unconfirmed what the sheet intends]`

## lib/ticketStudies.ts → EAINT-12257 entry

1. `openItems` "Is a captcha step really present on Pre-application?":
   answered — yes, Google reCAPTCHA at `/obs/preOnb/recaptcha`, two or three
   image challenges, not solvable by the script; the ask is Google's test keys
   on staging. `[verified: reference pack 01-flow/04-costs-and-human-gates.md]`
2. `automation.intro` says "12257_TS02 … drives the full 11-phase chain"; the
   spec drives phases 1-10 and then **reads** the record (phase 11) — consistent,
   but note phase 11 is a read, not an action.

## knowledge/test-scripts.md (if a "sheet conventions" section exists)

The EAINT-12153 sheet carries the typo "Unsuccessfull Payment" in every
failure expected-result cell; EAINT-12414's Jira text spells it "Unsuccessful
Payment - Something went wrong and your payment didn't go through. Please
choose a payment method and retry." Assert on the page, not on the sheet.

## knowledge/README.md → Flow index row (not applied — owner edits)

| [flow-payment-channels.md](flow-payment-channels.md) | **UCD onboarding payment channels** — the RM 108 / RM 990 payment steps, the Card / FPX Business / FPX Personal tiles and the planned DuitNow QR tile, the Fiuu popup + bank simulator driver, success/failure pages, EAINT-12153's B2B Pending Approval pages (mockup DOM), EAINT-12414's two defects, env vars and safety switches of `scripts/eauto-duitnow-qr` and the `scripts/eauto-payment-channels` skeleton |

## knowledge/flows.md → Index of flow documents row (not applied)

| [flow-payment-channels.md](flow-payment-channels.md) | UCD onboarding payment step — tiles, bank grid, Fiuu popup/simulator, success & failure pages, B2B Pending Approval (mockup), DuitNow QR (unverified), env vars, safety switches, traps | `scripts/eauto-duitnow-qr` (selectors matched live 2026-08-31) + reference pack aria/text captures + SRD v1.1 + mockup HTML; **no raw HTML captured yet** |

Also update the flows.md row for flow-ucd-onboarding.md: source is now
"reference pack + `scripts/eauto-duitnow-qr` port (verbatim DOM handles added
2026-10-15)"; and the flow-ucd-company-listing.md row to add "+ the built
checker (`scripts/eauto-company-checker`, dashboard tabs, usage ledger)".
