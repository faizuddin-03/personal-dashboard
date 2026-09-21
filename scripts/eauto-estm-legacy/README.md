# eauto-estm-legacy — the original eSTM script, unmodified

`tests/estm-bypass-test.spec.ts` is a verbatim copy of

    _reference/automation code/eSTM Bypass/estm-bypass-test.spec.ts

the single-file script that was working before the eSTM flow was refactored into
page objects. It is self-contained: it imports nothing but `@playwright/test`.

Run it from the dashboard at **/eauto/estm-legacy** (amber, "Create eSTM
(Original)"), via `POST /api/eauto-estm-legacy/run`.

## Why it exists

`scripts/eauto-estm` is the refactor of this same flow and is the maintained
one. Keep this copy as a **known-good baseline**: when ours fails, run this. If
this passes and ours doesn't, the fault is in our code. If both fail, staging
changed.

Both suites work. Keep this one anyway: the point of a baseline is having it
*before* you need it.

## Do not edit anything in this directory

Its entire value is being unmodified. An edit here doesn't improve it — it
destroys the only thing it's for, silently, and you won't notice until the next
time you need a known-good baseline and haven't got one. Fix bugs in
`scripts/eauto-estm`. To confirm this copy is still pristine:

    diff "_reference/automation code/eSTM Bypass/estm-bypass-test.spec.ts" \
         scripts/eauto-estm-legacy/tests/estm-bypass-test.spec.ts

## What the refactor dropped

Found by crosschecking the two, 2026-08-17. Both are restored in
`scripts/eauto-estm`.

**Neither caused a failure we actually observed.** The run that triggered this
crosscheck turned out to be a manual setup problem on the tester's side, not a
code bug — see `knowledge/flow-estm.md`. These are hardening.

**1. The `?? page` fallback in `getActivePage()`.**

```js
// original (this script)
const getActivePage = () => {
  const pages = page.context().pages().filter((p) => !p.isClosed());
  return pages[pages.length - 1] ?? page;      // <- fallback
};
```

The refactor's `EstmSession.active()` returned `pages[pages.length - 1]` with no
fallback. eSERAHAN closes and reopens pages on nearly every field, so if a
window exists where **every** page in the context is closed, the filter yields
`[]` and `active()` returns `undefined`. Callers do
`this.active().waitForLoadState(...)`, which throws

    TypeError: Cannot read properties of undefined (reading 'waitForLoadState')

*synchronously*, so the trailing `.catch(() => {})` never sees it. Restored in
`scripts/eauto-estm` by passing the fixture's page in as a fallback.

**2. The assertion at the end of `ensureChecked` — a silent skip.**

This script ends the helper with
`await expect(getActivePage().locator(selector)).toBeChecked({ timeout: 5000 })`.
The refactor fell out of the retry loop and returned quietly, so
`#to-same-address`, `#ucd-consent` and `#to-agree` could stay unchecked and the
flow would carry on to fail several steps later at an unrelated-looking Next
button. Also restored in `scripts/eauto-estm`.

## Inputs

The script reads eight env vars and no more:

    ESTM_ENV_SEGMENT  ESTM_VEHICLE_REG_NO  ESTM_EMAIL_ADDRESS  ESTM_MOBILE_NO
    ESTM_USERNAME  ESTM_PASSWORD  ESTM_ID_TYPE  ESTM_SKIP_PAUSE

There is no `ESTM_EVOC_EMAIL` — the eVOC address is the hardcoded constant
`nicholas.lim@modefair.com`. No bypass slot and no eLKM either; the bypass slot
falls back to `zzz/22`. The dashboard page deliberately doesn't offer those
fields, since passing them would be ignored silently.

`ESTM_SKIP_PAUSE=1` is always set by the run route: without it the script ends
on `page.pause()` and hangs waiting for a click in the Playwright inspector.
