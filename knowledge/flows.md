# Flow documents — what they are and how to write one

A **flow document** records how one module of a system actually behaves, in enough
detail that the next ticket in that module can be automated **without clicking
through staging to rediscover it**. The scripts are the by-product; these documents
are the asset that compounds.

Files are flat and named **`flow-<module>.md`**. Flat is required:
`app/api/knowledge/route.ts` lists bare `.md` filenames and ignores subdirectories,
so anything nested is invisible on the `/knowledge` page.

`[from QA team, 2026-08-13 / 2026-08-14]`

## The standing rule

**Any session that works out how a module's flow behaves must write it down — or
update what's written — before finishing.** Not at the end of the ticket: in the
same change. See [automation-testing.md](automation-testing.md).

A flow document may be written from working code, not only from live clicking. If
an automation already drives the module, the flow knowledge exists but is trapped
in page objects — extracting it into a flow document is the same job.

## Index of flow documents

| Flow | Covers | Source |
|---|---|---|
| [flow-ucd-shell.md](flow-ucd-shell.md) | The portal shell every UCD page shares — home tiles, nav, popup chain, listing pattern, duplicate-id traps | Live HTML, uat4 |
| [flow-estm.md](flow-estm.md) | eSTM (eSerahan) creation — the core transaction most other flows depend on, incl. the staging biometric bypass; plus home/listing/details DOM | Nick's R&D scripts + live HTML |
| [flow-insurance-purchase.md](flow-insurance-purchase.md) | UCD insurance quotation → purchase → post-purchase records, across 6 surfaces | `scripts/eauto-e2e` + live HTML |
| [flow-edereg.md](flow-edereg.md) | eDereg (AATF) Pre-Checking gate — the four-condition validation rule, JPJ/payment response codes, expiry vs cronjob distinction, multi-user race conditions, UI locations, AATF-side URL map + DOM handles, and the multi-system automation architecture (eSIM, a new fingerprint-bypass emulator, STMS creation, split test scripts). **Still missing**: Back-Office side URL map/DOM handles | Live HTML (AATF side) + `[from dev guide + QA test plan, 2026-08-21]`, EAINT-9306 |
| [flow-ucd-company-listing.md](flow-ucd-company-listing.md) | Manage Company Accounts search — ROC/New ROC/TIN fields, AND-only search semantics, empty-vs-populated `<tbody>` as the presence signal | Live HTML, uat1, 2026-08-21 |
| [flow-association-payment-listing.md](flow-association-payment-listing.md) | Association Payment Listing (BackOffice) — brand-new module, Summary/Details pages, Drafter→Reviewer→Approver workflow DOM, signature/payment-date modals, Payment Request generation. **Not live yet** — sourced entirely from the ticket's mockup HTML | Mockup HTML, EAINT-12028, 2026-07-31 |

Modules with **no** flow document yet — write one when a ticket touches them:
Service Hub (SI/BDP appointments, partly covered by `tests/service-hub`), eVOC,
LKM refund, CIBO, Secarang, BMK, JomCheck, Wholesale/Digits Marketplace.

## Capturing live HTML is the fastest way to build one

The insurance and eSTM docs were upgraded from inferred strategies to exact
selectors by pasting the real page source. It retired several workarounds that
existed only because the DOM was unknown — positional `nth=0/1` field locators, a
"walk up 7 parents" card finder, and two find-the-element-by-its-contents hacks.

So when a ticket opens a module with no flow doc: **capture the pages first**.
Use devtools *Copy → outerHTML* on `<body>` (post-AJAX DOM, not view-source — these
pages build themselves with jQuery), then distil into `flow-<module>.md`. Keep the
raw HTML; it is re-greppable next ticket.

**Where the capture goes depends on what it is:**

| Capture | Save to |
|---|---|
| A page of a **module** — belongs to the system, outlives any ticket | `_reference/html/<system>/<page>.html` |
| Something **specific to one ticket** — a one-off state, a defect screenshot's DOM | `_reference/tickets/<KEY>/<KEY>-<module>-<NN>-<url-segment>.html` |

`_reference/html/README.md` carries the conventions: a header block giving URL,
environment, date and what was trimmed; long lists may be trimmed to `thead` plus
a few representative rows **if the header says so**; forms are never trimmed.

### ⚠️ This rule went unfollowed for months — don't let it lapse again

Audited 2026-08-17: **not one captured page existed in the repo**, while
`flow-estm.md`, `flow-insurance-purchase.md` and `flow-ucd-shell.md` all carried
`[verified: live HTML from uat4, 2026-08-14]` tags. The HTML behind every one of
those tags was read in a session and thrown away, leaving claims that cannot be
re-checked and selectors that cannot be re-derived without recapturing.

**A `[verified: live HTML]` tag with no file behind it is not verified.** Save the
capture in the same change as the doc. The eSIM captures under
`_reference/html/esim/` are the worked example.

Still owed: the eAuto UCD pages those three docs cite — Get Free Quote, insurance
steps 1–3, insurance listing and details, eSTM listing and details, UCD home.

## What every flow document must contain

### 1. Why this flow matters, and what depends on it

One short paragraph. If other modules can't be automated without this one (as with
eSTM), say so first — it tells the reader whether they're in the right file.

### 2. Entry points

A flow is rarely entered one way. List each entry, and mark which are **verified**
versus known-but-undocumented. EAINT-11864 alone has five (Get Free Quote, eSTM,
banner, 69E, email link), and a scenario is only reproducible if you know which one
it assumed.

### 3. A URL map, step by step

The single most reusable fact in these systems. One table: step → URL pattern →
what identifies you've arrived.

```
step 1 quotes     /view/ucd/insurance/quote/view.do   →  plan/view.do
step 2 coverage   /view/ucd/insurance/plan/select.do
```

Note which segments are dynamic (`transactionId=`, env segment, the eSTM
`zzz/<slot>` bypass) and how they're captured.

### 4. The real DOM handles — verbatim

This is the part that saves the most time, and the part most often skipped.
**Copy the actual selector, not a description of it.** "The insurer select button"
is worthless; `button:has-text("SELECT")` filtered by
`/select\s+(zurich|takaful|chubb|lonpac|tokio|rhb)/i` is reusable.

Record for each handle: what it targets, the selector or DOM strategy, and the
`file:line` it came from. Where a page needs a **strategy** rather than a selector
— walking up N parents to find a card container, stamping `data-e2e-idx` on
buttons before clicking, matching a field by its value containing `@` — write the
strategy down, because that is the hard-won part.

Prefer real HTML/ids/classes over role-and-name locators when recording, since
role names drift with copy changes while these legacy portals' ids rarely move.

### 5. Decision points and what they branch on

Every place the flow forks, and the condition. Insurer preference, cover type,
optional-coverage on/off, a popup that appears only sometimes. State what happens
in each branch, including the fallback when a preference isn't available.

### 6. Preconditions and test data

What must already exist (an approved eSTM, an unconsumed vehicle number, a bypass
slot), what's required input, and what's safe to reuse. Include the safety switches
— anything that avoids creating real financial records.

### 7. Traps

The behaviours that cost debugging time: blocking overlays, progressive status
resolution needing refreshes, popups whose ids change per campaign, referral loops.
Each with the symptom, so a future run's failure is recognisable.

Genuinely cross-module traps also belong in [quirks.md](quirks.md); keep the
flow-specific ones here.

### 8. What is NOT covered

Explicit gaps. A flow document that silently omits half the module is worse than
none, because it reads as complete. Name the unverified branches.

## Rules for the content

- **Provenance on every fact**, as everywhere in this knowledge base:
  `[verified: <file · symbol>]`, `[from QA team, <date>]`, `[unconfirmed]`. A flow
  derived from code cites the page object and line.
- **Never name an environment as part of a rule.** Environments are picked per
  ticket from whatever is free. If a fact came from a run on `uat4`, say "captured
  from one run" — not "the env is uat4". See
  [eauto-portals.md](eauto-portals.md) § Never tie an environment to a general rule.
- **Never put a ticket's timing constraint in a flow doc.** "Click at 10:59"
  belongs to the ticket that needs it. Flows have no clock.
- **When something is superseded, replace it — don't stack.** Two versions of a
  rule in one file is the worst outcome: a later reader can't tell which is live.
  Delete or rewrite the old wording, and if it's worth recording that it changed,
  say so in one clause (`supersedes …`) rather than leaving both statements
  standing. This applies to wording as much as facts — a paragraph that repeats an
  earlier paragraph reads as a distinction that doesn't exist.
  `[from QA team, 2026-08-14]`
- **Verified vs assumed must be distinguishable.** Code that runs green is
  verified. A branch the code never takes is not, even if it's in the code.
- **Business rules that the flow reveals** (pricing formulas, cut-off windows) go
  in the module's own knowledge file, or here with a cross-reference — not silently
  in both.
- **Update rather than append** when the flow changes. A flow document with two
  contradictory versions of a step is a trap of its own.
- Add every new flow document to the index above **and** to
  [README.md](README.md).
