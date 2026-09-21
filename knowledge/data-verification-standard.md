# Data verification — the house standard

**Every check that compares observed data against expected data follows this
pattern**, whatever the source: an email, a portal page, a PDF, an Excel export, a
listing row. It is the verification half of a scenario — it assumes something else
already performed the action.

The reference implementation is the Mailtrap Email Checker,
`_reference/automation code/Mailtrap-Email-Checker/`, written by a senior and
proven against eAuto staging. Read it before writing any verification code.

**It is not an eAuto standard** — it never touches the eAuto website (no
Playwright, no browser, no login; one outbound host, `mailtrap.io`). That
decoupling is exactly why it generalises: the architecture transfers, the eAuto
knowledge lives in [automation-playbook.md](automation-playbook.md) and
[automation-testing.md](automation-testing.md).

`[from QA team, 2026-08-14; structure verified by reading all 646 lines]`

## The four layers

Email was the first instance, not the shape of the thing. Generalised:

| Layer | Email instance | Responsibility |
|---|---|---|
| **Contract** | `email-contracts.js` | Declarative expected data per artifact type. No logic. |
| **Source adapter** | `mailtrap.js` · `listMessages`, `fetchBodies` | Reach one source, pull raw data, normalise to a comparable shape |
| **Comparison** | `assertEmail`, `assertNoEmail` | Loop the contract, record a verdict per field. Source-agnostic. |
| **Report** | `check-email.js` · harness + `finish` | Tally, human-readable output, exit code |

A new source — a BO listing page, an e-cover-note PDF, a CIBO transaction row —
means **a new adapter, not a new checker**. The contract and comparison layers stay
put.

## The nine rules

### 1. Expected data lives in a contract module, not in the assertions

Declarative entries hold what the system *should* produce — sender, `subjectRe`,
`bodyMustContain`, `bodyShouldContain`, `dynamicFields`, `baselineRef`, `trigger`.
The checking code reads the contract and loops. When a ticket changes the data, you
edit **one contract entry** and never touch assertion logic.
`[verified: lib/email-contracts.js · CONTRACTS]`

### 2. Assertions record, they never throw

| Method | Use |
|---|---|
| `h.step(name, status, detail)` | record — `pass` / `fail` / `info` / `blocked` / `review` |
| `h.assert(name, condition, detailPass, detailFail)` | the common case |
| `h.knownIssue(ticket, verdict, detail)` | known defect — `still-present` / `fixed` |

One failed field never hides the twenty checks after it. Essential when comparing
many fields across many sources. `[verified: check-email.js · makeHarness]`

### 3. Hard vs soft assertions are different things

`bodyMustContain` → **hard**, missing is `fail`. `bodyShouldContain` → **soft**,
missing is `info` / `DEVIATION`. Reserve `fail` for what the ticket guarantees;
wording drift is a finding to look at, not a red build.

### 4. Unreadable source is `blocked` — never a pass, never a crash

With no token the tool records `blocked` and prints the **exact manual steps**. A
run is never falsely green for want of credentials, and never dies.
`[verified: lib/mailtrap.js · manualHint]`

### ⚠️ The working check does NOT use the Mailtrap API

**The reference CLI is not what the team actually runs.** Asked directly, the
senior who built the working email check said: *"nope i dont think im using
mailtrap api to test with automation script ya, it actually using chrome mcp to
access the mailtrap and test manually"*. The inbox is opened **in a browser that
is already signed in**, and the mail is read there.

So treat `check-email.js` as a **reference for the contract shape** — what to
assert, the `blocked` verdict, the absence check — and **not** as the transport.
Anything new reads Mailtrap through the web UI at
`https://mailtrap.io/sandboxes/2581833/messages`, reusing an existing session
rather than holding a token. `[from QA team, 2026-08-17]`

#### Testing ALWAYS runs in the `modefair.com` Chrome profile

Fixed by policy, **not** a per-run setting, and the dashboard deliberately offers
no control to change it. `[from QA team, 2026-08-17]`

**Resolve the profile by Google account, never by folder name.** On Faizuddin's
machine the work profile is `Default` today, but the folder→account mapping shifts
whenever profiles are added or recreated, and a run that silently used the wrong
account would read the wrong inbox and report a confident, wrong verdict. Read
`<LOCALAPPDATA>\Google\Chrome\User Data\Local State` → `profile.info_cache` and
pick the entry whose `hosted_domain` is `modefair.com` (or whose `user_name` ends
`@modefair.com`); fail loudly on zero or multiple matches. Implemented in
`app/api/eauto-quotation-reminder/run/route.ts` · `resolveWorkProfile()`.

Two operational facts that follow:

- **Chrome locks an open profile.** Copy the profile before launching; never use
  it in place. Copy only what the session needs — `Local State`, the profile's
  `Preferences` and `Network\Cookies` — rather than the whole tree, which runs to
  hundreds of MB and makes every run pay a slow disk copy.
- **An expired Mailtrap sign-in surfaces as `blocked`, not as a failure.** That is
  correct behaviour, and the fix is to sign in again in Chrome — nothing in the
  automation changes. Word the message so it reads as a sign-in prompt rather than
  a broken selector.

The API details below still describe the reference tool accurately, and matter if
anyone ever does wire it up — but do not reach for them by default.

⚠️ **Wiring it takes TWO values, not one — `MAILTRAP_TOKEN` *and* `MAILTRAP_URL`.**
The gate is `enabled() = !!(c.token && c.url && typeof fetch === 'function')`, and
unlike `webUrl` the messages endpoint has **no default**:
`process.env.MAILTRAP_URL || f.mailtrapUrl || ''`. Supply the token alone and the
checker is silently disabled — every email assertion degrades to `blocked`, which
looks like a credentials problem rather than a wiring mistake. Precedence is env →
`config.json` → empty, env always winning.

| Value | env | `config.json` | Shape |
|---|---|---|---|
| Token | `MAILTRAP_TOKEN` | `mailtrapToken` | sent as the `Api-Token` request header |
| Inbox | `MAILTRAP_URL` | `mailtrapUrl` | `https://mailtrap.io/api/accounts/{accountId}/inboxes/2581833/messages` |

Inbox `2581833` is the modefair sandbox; `{accountId}` is the part that varies.
`fetchBodies` derives the per-message URLs from this one by rewriting the
`/messages…` tail, so a malformed inbox URL breaks body assertions too, not just
the listing. Any dashboard page or CI job that runs the checker must pass both.
`[verified by reading lib/mailtrap.js · cfg/enabled/api/fetchBodies, 2026-08-17]`

### 5. Known defects are flagged, not baked in as expected

The subject mojibake is raised via `h.knownIssue` with its RFC 2047 cause — not
written into the contract as expected copy. A regex loosened to accept a bug stops
detecting the bug. `[verified: lib/email-contracts.js · SUBJECT_ENCODING_DEFECT]`

### 6. The negative check is first-class

`assertNoEmail` is a peer of `assertEmail`. Generalised: *record absent*, *field
absent*, *field empty* are assertions in their own right, with an enumerated
vocabulary (`LEGEND`), not an afterthought.

### 7. Config precedence: env var → config file → default. Env always wins.

`config.json` git-ignored, `config.example.json` committed as the template, read
lazily and wrapped so a malformed file never throws at import.

### 8. Standalone, dependency-free, CI-gateable

Node 18+ `fetch`, no `npm install`, runs without the rest of the project. Exit
**0** when all passed or blocked, **1** on any failure.

### 9. Exploratory subcommands sit beside the assertion subcommands

`list` and `show <id>` let you eyeball real data before writing a contract for it.
For a new source, build the equivalent **first** — the way accurate contracts get
captured instead of guessed.

## Comparing across multiple sources

The reference only ever checks one source against a contract. Comparing several
sources against **each other** is the harder problem and needs five additions.
CIBO is already a third verification surface after UCD and BO
(see [cibo.md](cibo.md)) — this is that case, generalised.

### Normalise before comparing, in one place

The same value is formatted differently per source: `2026-08-14` /
`14.08.2026` / `14 Aug 2026`; `RM1,234.50` / `1234.5`; ICs with and without
dashes; collapsed whitespace and case in HTML vs PDF. The reference already hints
at this — `assertEmail` tries three date spellings inline
(`lib/mailtrap.js:154`). **That inline hack must become a real normaliser** with
one function per field *type*, shared by every adapter. Otherwise every new source
grows its own ad-hoc variants and mismatches become unexplainable.

### Map source labels onto logical field names

A logical field has a different label in every source — "Discount Amount" in the
email, a "Discount" column in BO, something else again in CIBO or a PDF. The
contract names the **logical** field; each adapter maps its own label/locator/
column onto it. Comparison then talks only in logical names.

### Keep provenance per value, not per run

Record `{ logicalField, source, rawText, normalised, readAt }` for every value.
When three sources disagree you need to know which one is wrong and what it
*literally* said — a boolean "mismatch" is not actionable, and re-reading a PDF by
hand to find out defeats the automation.

### Report an n-way diff, don't short-circuit

Don't assert pairwise in a loop that stops at the first mismatch. Collect every
source's value per field, then report one table — field × source — with the
disagreeing cells marked. One run should tell you the whole story.

### `blocked` is per source, not per run

If the PDF won't parse but both portals read fine, verify the portals and mark the
PDF leg `blocked`. **Partial verification beats none**, and a whole run marked
blocked because one of four sources was unreachable wastes the other three.

## PDFs: use deterministic extraction, never the LLM path

The repo's existing PDF handling is **not** suitable for verification. Study
routes base64 the file and hand it to an LLM as a document part
(`app/api/qa-flow/study/route.ts:255`, `lib/server/aiProviders.ts:42`). That is
right for summarising an SRD and wrong for assertions: it is non-deterministic, so
the same PDF can yield different field values run to run, and it cannot be a source
of truth in a comparison.

Data verification needs deterministic text extraction — `pdf-parse`,
`pdfjs-dist`, or `pdftotext -layout`. **No such dependency exists in the repo yet**
(`package.json` has `mammoth` for DOCX and `exceljs`/`xlsx` for spreadsheets, no
PDF library), so adding one is a prerequisite for the first PDF-comparing scenario.

Two traps worth knowing before the first attempt: table cell order in extracted
text often does not match visual order, so anchor on labels rather than position;
and a scanned or image-only PDF yields no text at all — that case must be
`blocked`, never a silent empty-string pass.
`[verified by reading the repo's PDF handling, 2026-08-14]`

## Where the reference falls short — don't copy these

- **Swallowed errors can produce a false green.** `listMessages` catches any API
  error and returns `[]`, so an unreachable source is indistinguishable from an
  empty one. `assertEmail` fails safe (no matches → `fail`); `assertNoEmail` fails
  **unsafe** (zero matches → `pass`). Always distinguish "queried, found nothing"
  from "could not query", and record the second as `blocked`. This matters more,
  not less, with several sources: any one of them being briefly unreachable must
  not read as agreement.
- **The contracts are structurally good but thin.** `bodyMustContain:
  [/Software Installation Appointment/i]` only echoes the subject, and a soft check
  of `/(date)/i` matches almost any HTML. Right shape, near-tautological content.
- **Body matching is crude.** `html`, `txt` and `raw` are concatenated and
  substring-searched, so a quoted-printable or base64 part can both miss a real
  match and match on headers instead of body. Extract fields, then compare — don't
  substring-search a blob.
- **`assertEmail` asserts presence, not uniqueness** — it takes `matches[0]`, so it
  cannot detect a duplicate. Add a count assertion where a ticket guarantees
  exactly one record (EAINT-11864 does).
- **`assertNoEmail` defaults to the SI appointment subject regex.** Any other
  module must pass its own, or the absence check looks for the wrong thing and
  always passes.
- **Plain JS, hand-rolled harness and arg parser.** Fine standalone. Inside a
  Playwright project these duplicate `test.step`, `expect.soft`, `expect.poll` /
  `toPass` and annotations — use the natives there rather than porting the shim.

`[verified by reading lib/mailtrap.js and lib/email-contracts.js, 2026-08-14]`

## Conventions worth copying verbatim

- **Provenance inside the code.** Contract entries carry `baselineRef` (SRD
  clause), an `OBSERVED (live …) <date> — message <id>` header, and dated
  `correction:` fields. The discipline of this knowledge base, applied in source.
- **Clock-skew slack on time windows.** `findMessages` allows 60s either side of
  `sinceMs` so a marginally out-of-sync clock doesn't drop a real record.

## Automations that could adopt this

Nothing below has been changed. Recorded so it can happen one at a time, on
request. `[status as of 2026-08-14]`

| Automation | Path | Driven by | Done |
|---|---|---|---|
| Service Hub suite (SI/BDP) | `tests/service-hub/` | `POST /api/eauto/shopping-cart/run` | ☐ |
| eAuto UCD insurance purchase E2E | `scripts/eauto-e2e/` | `POST /api/eauto-e2e/run` | ☐ |
| eSTM | `scripts/eauto-estm/` | `POST /api/eauto-estm/run` | ☐ |
| Insurance Checker | `scripts/eauto-insurance/` | `POST /api/insurance/check` | ☐ |
| Secarang Insurance Checker | `scripts/secarang-insurance/` | `POST /api/secarang/check` | ☐ |
| Secarang regression | `scripts/secarang-insurance/` | `POST /api/secarang/regression` | ☐ |
| WA Blaster | `scripts/WA-Blaster/` | `POST /api/wa-blaster/run` | ☐ |
| WA Blaster Beta | `scripts/WA-Blaster-Beta/` | `POST /api/wa-blaster-beta/run` | ☐ |

`scripts/_archive/WA-Blaster` is archived — excluded.

`scripts/eauto-estm-legacy` is **excluded on purpose** and must stay excluded.
Its whole value is being the original script, unchanged, so bringing it up to this
standard would destroy the thing it exists for. See
[flow-estm.md](flow-estm.md).

Everything in that table is **Playwright**; the reference is a **plain Node CLI**.
Only the architecture transfers. The Playwright suites already have a partial
parallel of the harness in their step reporter
(see [automation-playbook.md](automation-playbook.md)), so adopting this means
converging with it, not bolting a second harness alongside.
