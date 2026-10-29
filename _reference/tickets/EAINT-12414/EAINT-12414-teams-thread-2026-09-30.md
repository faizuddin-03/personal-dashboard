# EAINT-12414 — Teams CR-group chat capture

Captured 2026-09-30 via Claude in Chrome, read directly from the Teams chat
titled "EAINT-12414 [eAuto - Onboarding] Pre-Application Form - Resets to
Step 1 on reload & no error shown for failed Credit/Debit Card payment"
(found under the "In Progress" folder). Full thread — nothing trimmed, this
is the entire chat from creation to the last message at time of capture.

---

**Mei Jia Chee** added Nur Izni Binti Zurni and 10 others to the chat, then
renamed the group to the ticket title.

**Mei Jia Chee** — 29/09 14:34
> hii everyone, we will use this CR group for
> https://mfservices.atlassian.net/browse/EAINT-12414

**Jin Siang Boo** — 29/09 15:06 (edited)
> Hi Everyone, this is existing issue of Pre-onboarding form on reloading the
> page for existing application will redirect user to Step 1 with partially
> filled form. Better to roll out this fix as soon as possible ya

**Mei Jia Chee** — 29/09 15:54
> Jin Siang Boo, can share the scope so that QA can estimate on the testing
> effort for this ticket ya

**Jin Siang Boo** — 29/09 15:57
> Mong Guo Hao please advise

**Mong Guo Hao** — 29/09 16:06 — **the scope, direct from dev**
> These are the scope
> - Type of Business selection when preapplication page is reloaded
> - Failed card payment: lands on step 2 with T&C ticked, payment methods
>   shown and the banner.
> - Successful card payment and successful FPX payment

**Mei Jia Chee** — 29/09 16:09
> May Chin Mei Theng Charmain Ea Chiang, need advise on this yaaa.

**May Chin Mei Theng** — 29/09 19:44
> Muhammad Faizuddin Bin Bidi can help to advise on this (1 like reaction)

*(Thread ends here at time of capture — this is the assignment to Faizuddin;
no scope/estimate has been given back into the chat yet, which is what this
study is for.)*

## What this adds beyond the Jira description

Dev's own scope list is more precise than the Jira description alone about
what needs checking, and should be treated as the authoritative regression
scope over a generic reading of "resets to Step 1":

1. **"Type of Business selection"** specifically, on reload — not just "which
   step" the form lands on. This implies the step-restore logic must also
   correctly re-populate the Type of Business field's value, which is a
   plausible second failure mode distinct from the step number itself.
2. Failed card payment must land on **Step 2** specifically (not just "some
   step"), with **T&C ticked**, **payment methods shown**, and **the banner**
   (the "Unsuccessful Payment" message) all three conditions true together.
3. Regression is explicitly scoped to **successful card payment** and
   **successful FPX payment** — dev did not mention FPX B2B specifically, only
   "FPX payment" generically. Worth confirming whether that means FPX
   (Personal) only or both FPX channels — flagged as an open question in the
   study.

No further Teams discussion exists yet on testing environment, deployment
date, or whether the Application module (which shares this payment step per
EAINT-12153) is also affected — all raised as open items in the study.

## Scope decisions, confirmed by Faizuddin 2026-09-30 (after the initial study)

1. Defect-specific testing (reload + failed-payment) is **Pre-Application
   Form only** — Application module excluded unless a source explicitly says
   otherwise.
2. FPX regression check is **Personal only** — B2B excluded, not deployed yet.
3. Environment: **`staging/obs`** — the onboarding module's one staging.
4. **"Regression - Full Pre-Application & Application Happy flow"** — ONE
   happy-path walkthrough of the entire Pre-application → Application flow,
   through to completion (all 11 phases per
   `flow-ucd-onboarding.md`: gate → preapp → approve-preapp → appform → assign
   → submit-approval → approve-app → regdocs → verify-regdocs → regfee →
   record) — default values, one payment success per stage, no negative
   branches or actor/role permutations. Purpose is narrow: confirm the fix
   (which touches early-stage loading logic) hasn't broken the main path
   downstream. Not a full combinatorial regression — corrected 2026-09-30
   after an initial (over-scoped) reading suggested a fuller regression pass.
