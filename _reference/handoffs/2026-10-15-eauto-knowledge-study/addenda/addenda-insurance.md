# Addenda for files outside this task's ownership (insurance / quotation-reminder study, 2026-10-15)

Each entry: target file → section → text to add (provenance included).

## knowledge/README.md → Index table (flow files)

| [flow-quotation-reminder.md](flow-quotation-reminder.md) | **Quotation reminder email (EAINT-11864)** — the hourly 07:00–23:00 cron rule, the five entry points (Get Free Quote, eSTM untick, details-page banner, 69E, email link), how `scripts/eauto-quotation-reminder` drives eSTM → quote → abandon → inbox, verbatim DOM, config knobs, safety switches, traps, and why the suite is paused |
| [mailtrap.md](mailtrap.md) | **Mailtrap sandbox 2581833** — web-UI reader via the signed-in `modefair.com` Chrome profile (the working method; cannot run on GitHub Actions) vs the reference REST CLI, how emails are matched, the SI/BDP contracts verbatim, the quotation-reminder contract draft, constraints |

Also update the `eauto-insurance.md` row: add "EAINT-11864 business rules, step-3 persistence, PENDING-not-DRAFT, cron window".

## knowledge/flows.md → Index of flow documents

| [flow-quotation-reminder.md](flow-quotation-reminder.md) | Quotation reminder email (EAINT-11864) — trigger/cron rules, five entry points, automation chain across eSTM/insurance/Mailtrap, DOM handles, config, traps, paused status | `scripts/eauto-quotation-reminder` + live HTML (2026-08-18/19) + team test script |

flows.md § 2 "EAINT-11864 alone has five" — now written up; no change needed to the wording.

## knowledge/quirks.md → "Waiting on the right thing" (or a new "Selectors" heading)

**A CSS id selector cannot start with a digit.** The insurance stepper divs are `id="1"`/`"2"`/`"3"`; `div#1.md-step.active` is a parse error that fails the *whole* comma-separated selector list (including a valid `body#insurancePlan` beside it) with `SyntaxError: '…' is not a valid selector`, after burning the full timeout. Use `div[id="1"]`. `[verified: scripts/eauto-quotation-reminder/pages/InsuranceStepsPage.ts:16-21]`

**`#to-payment` means two different things on the eSTM flow.** It is the "Make Payment" button on the JPJ-result render of step 4 AND the submit button on the real Payment step; matching the id alone does not prove which page you are on — pair it with `#lkm-addson-checkbox` (Payment step only). `[verified: scripts/eauto-quotation-reminder/pages/EstmHandoffPage.ts:122-129]`

**`.catch()` on `.fill()` of a non-matching locator costs the full actionTimeout.** Resolve the field with `count()` first; a bad locator polled 30 s on every eSTM run before this was caught. `[verified: scripts/eauto-quotation-reminder/pages/estmPort/EstmBuyerDetailsPage.ts:108-117]`

**Env vars set after a module imported its config never reach it.** `scripts/eauto-estm/data/config.ts` freezes `ESTM_ELKM`/`ESTM_EVOC` at import; in-process callers cannot change them, only a spawned child can. `[verified: scripts/eauto-quotation-reminder/pages/estmPort/EstmPaymentPage.ts:62-72]`

## knowledge/automation-testing.md → "Which click is decisive" paragraph (lines ~70-74)

Replace the `[unconfirmed] whether the quotation is persisted by Show My Result or by selecting an insurer` with: **Answered 2026-08-17 — neither.** Nothing persists until insurance step 3 (the payment form); the reminder backend detects step-1/2 drop-offs without any row. The decisive click for timing is still `#to-show-result` (the stamp the cron keys on, `[from QA team, 2026-08-13]`), held via `holdForSchedule()` immediately before it. `[verified: scripts/eauto-quotation-reminder/tests/quotation-reminder.spec.ts:86-91; from QA team, 2026-08-17]`

Also under "Unattended runs that straddle a closed cronjob window": the GitHub Actions workflow `.github/workflows/nightly-quotation.yml` exists (schedule commented out, `workflow_dispatch` only) and does NOT set `TZ=Asia/Kuala_Lumpur` — the spec logs both `toISOString()` and local `toString()` instead. The 07:00 half is not automated at all because the inbox read needs the signed-in Chrome profile (see mailtrap.md). `[verified: workflow + tests-nightly/nightly-quotation.spec.ts]`

## knowledge/data-verification-standard.md → "The working check does NOT use the Mailtrap API"

Add: implemented as `scripts/eauto-quotation-reminder/utils/mailtrap.ts` (`stageProfile()` copies `Local State`, `Preferences`, `Network\Cookies`, `Cookies`; `launchPersistentContext` headed, `channel: 'chrome'`; signed-out URL regex → `blocked`). Its row selectors are unverified — no Mailtrap capture exists. Full write-up: [mailtrap.md](mailtrap.md).

→ "Automations that could adopt this" table: add rows `eAuto quotation reminder | scripts/eauto-quotation-reminder/ | POST /api/eauto-quotation-reminder/run | ☐ (partial: blocked verdict + count assertion done; no contract module, no body match)`.

## knowledge/flow-estm.md → § Step 4 / § eSTM → insurance handoff

The dialogs' verbatim text, from the captures: `#insError` "We're unable to retrieve an insurance quotation for this transaction. Kindly reach out to +6018-2884889 or insurance@eauto.my for assistance."; `#insDoneBuy` "This transaction cannot be processed. Insurance must be purchased through our platform for this vehicle."; `#blockCase` "You are unable to proceed with the eSerahan transaction for this vehicle. Please contact  at  for further info." (blank placeholders in the live markup); `#duplicate-transaction-msg` "Transaksi yang sama untuk kenderaan dan pemilik ini telah direkod sebelum ini. Sila rujuk kepada eSTM transaction listing." `[verified: _reference/html/eauto/estm-step4-jpj-check-submit-dialog.html:332-346; estm-step2-buyer-vehicle.html:381-384, 399-402]`

## knowledge/esim.md → § quotation-reminder usage

`scripts/eauto-quotation-reminder/utils/esim.ts` writes exactly one field — `Response Code` on entity `estm-enquiry` for the 2-character prefix — via `ESIM_ENTITY/ESIM_PREFIX/ESIM_MODE=write/ESIM_CHANGES`, `npx playwright test --project=esim`, success = a `RESULT:{…}` line; VPN failure is recognised by `ERR_CONNECTION|ERR_ADDRESS_UNREACHABLE|ERR_TIMED_OUT|net::ERR|ECONNREFUSED|ETIMEDOUT`. Codes: `GLB000000I` OK (resting state), `VEL000069E` force-insurance redirect. `[verified: utils/esim.ts:22-27, 65-73, 101-115]`

## knowledge/cibo.md → "The relationship that matters for testing"

The EAINT-11864 cross-check (UCD / BO / CIBO) belongs to TS08–TS10 only — the email-link purchase cases — and none of them is automated. `[from ticket EAINT-11864 test script]`

## Code fixes to make when the suite is next touched (not knowledge — tracking)

1. `scripts/eauto-quotation-reminder/.env.example:3` default segment differs from `data/config.ts:13`; line 8 "The eSTM is created by hand today" is stale.
2. `pages/EstmBannerPage.ts:31` error text "the automation does not create it yet" is stale.
3. `utils/paths.ts:19-20`, `tests-nightly/nightly-quotation.spec.ts:33` say the step-3 row is `DRAFT`; the capture shows `PENDING`.
4. `app/eauto/quotation-reminder/page.tsx` insurer labels for TS03 ("Takaful") and TS04 ("Tokio Marine") do not match the team sheet (Chubb, Takaful); the spec's own choices differ from both.
5. `utils/mailtrap.ts:88-98` selectors unverified; `[class*="to"]` is a broad match.
6. `scripts/eauto-e2e/pages/InsuranceQuotePage.ts:24` waits for `quote/view.do` and swallows the failure (already noted in flow-insurance-purchase.md).
