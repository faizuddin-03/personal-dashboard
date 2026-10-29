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
| [flow-bo-shell.md](flow-bo-shell.md) | BackOffice shell — full menu map with hrefs and coverage, header, role filtering, listing/datepicker/export patterns, traps | BO home captures 2026-08-21/08-24/09-30 + BO listing captures + code |
| [flow-service-portal-shell.md](flow-service-portal-shell.md) | Service Portal shell — login, home menu, header, listing pattern, one-month error | Service Portal captures 2026-09-30 / 10-05 + eauto-jomcheck code |
| [flow-estm.md](flow-estm.md) | eSTM (eSerahan) creation — the core transaction most other flows depend on, incl. the staging biometric bypass; plus home/listing/details DOM | Nick's R&D scripts + live HTML + full code map of `scripts/eauto-estm` |
| [flow-insurance-purchase.md](flow-insurance-purchase.md) | UCD insurance quotation → purchase → post-purchase records, across 6 surfaces | `scripts/eauto-e2e` + live HTML |
| [flow-quotation-reminder.md](flow-quotation-reminder.md) | Quotation reminder email (EAINT-11864) — trigger/cron rules, five entry points, automation chain across eSTM/insurance/Mailtrap, DOM handles, config, traps, paused status | `scripts/eauto-quotation-reminder` + live HTML (2026-08-18/19) + team test script |
| [flow-eauto-insurance-enquiry.md](flow-eauto-insurance-enquiry.md) | Insurance enquiry/listing/report/dashboard navigation — BO Insurance Transaction Listing, UCD Transaction Listing & Report, the separate Insurance Dashboard portal (Pemaju Payment Report, Agency Performance chart). **Navigation only, not live-verified** | Code-reading chatbot, 2026-09-25 |
| [flow-secarang-insurance.md](flow-secarang-insurance.md) | Secarang car insurance purchase (B2C, no user login) — quote → add-ons → confirm → Fiuu payment → success/failed; FPX leg runs green, GrabPay/card selectors unconfirmed. **No live HTML captured** | `scripts/secarang-insurance` + `scripts/eauto-12107` + SRD EAINT-12107 v1.1 + SRD EAINT-12327 v1.0 + ticket notes |
| [flow-cibo.md](flow-cibo.md) | CIBO page by page — portal shell, Transaction Management, Payment Management, Payment Report. **No live page captured, no page object** | SRDs + test scripts of EAINT-12058/12151/12327/12107 + EAINT-12151 mockup HTML |
| [flow-edereg.md](flow-edereg.md) | eDereg (AATF) Pre-Checking gate — the four-condition validation rule, JPJ/payment response codes, expiry vs cronjob distinction, multi-user race conditions, UI locations, AATF-side URL map + DOM handles, and the multi-system automation architecture (eSIM, a new fingerprint-bypass emulator, STMS creation, split test scripts); plus the Back-Office side (§45 URL map, both BO listings' filters/columns/Cancel DOM, §46 both JPJ XML Log pages with decode tables), SRD V1.0→V1.2 delta (§47), automation config/env-var reference (§48). Still missing: BO details pages, Slip Pengesahan (§50) | Live HTML (AATF + BO side) + dev guide + QA test plan + SRD V1.0–V1.2, EAINT-9306 |
| [flow-jomcheck.md](flow-jomcheck.md) | JomCheck — CR lineage (10089/10937/11175, 12339 API v2.0, 12412 invoice split), the 3 Service Portal surfaces, permission-gate chain, SRD REQ-001–011 map, 29-column BO listing, ICAP table, page-object/selector map, spec→TS map, BO Resubmit location | Jira + SRD EAINT-12339 v0.3/v1.0 + SharePoint legacy TS workbooks + mockup + live DOM captures + `scripts/eauto-jomcheck` code |
| [flow-ucd-company-listing.md](flow-ucd-company-listing.md) | Manage Company Accounts search — ROC/New ROC/TIN fields, AND-only search semantics, empty-vs-populated `<tbody>` as the presence signal | Live HTML, uat1, 2026-08-21 + the built checker (`scripts/eauto-company-checker`, dashboard tabs, usage ledger) |
| [flow-ucd-onboarding.md](flow-ucd-onboarding.md) | Dealer onboarding Pre-application → Application → Registered — 11 phases, two independent status fields, SSM live-lookup trap, reCAPTCHA gate, unique-data scheme, fixture cost; where EAINT-12257's DuitNow QR attaches | Reference pack + `scripts/eauto-duitnow-qr` port (verbatim DOM handles added 2026-10-15) |
| [flow-payment-channels.md](flow-payment-channels.md) | UCD onboarding payment step — tiles, bank grid, Fiuu popup/simulator, success & failure pages, B2B Pending Approval (mockup), DuitNow QR (unverified), env vars, safety switches, traps | `scripts/eauto-duitnow-qr` (selectors matched live 2026-08-31) + reference pack aria/text captures + SRD v1.1 + mockup HTML; **no raw HTML captured yet** |
| [flow-service-hub.md](flow-service-hub.md) | Service Hub — Software Installation, Biometric Device Purchase, appointments, reschedule, BO calendar: entry points, URLs, DOM, branches, data arrangement, traps. Business rules stay in eauto-service-hub.md | `tests/service-hub/**` + SRDs EAINT-10960 v1.2 / EAINT-11880 v1.2 + live captures + dashboard runners |
| [flow-device-purchase.md](flow-device-purchase.md) | Biometric Device Purchase, BackOffice half — EAINT-12167 Device SN capture (40-device cap, locked-SN typo) and EAINT-12166 DO generation (snapshot rule) | SRD + Teams CR-group chat, 2026-09-18; not yet checked against a running app |
| [flow-association-payment-listing.md](flow-association-payment-listing.md) | Association Payment Listing (BackOffice) — brand-new module, Summary/Details pages, Drafter→Reviewer→Approver workflow DOM, signature/payment-date modals, Payment Request generation. **Not live yet** — sourced entirely from the ticket's mockup HTML | Mockup HTML, EAINT-12028, 2026-07-31 |
| [flow-inventory-control.md](flow-inventory-control.md) | Shopping Cart Inventory Control — Stock In / Stock Out / Report / Dashboard, low-stock email, UCD available stock (EAINT-12099, EAINT-12635). **Draft, not walked live** | Miro card + Teams CR group + Jira fields, 2026-10-26; SRD v1.1 not in repo |
| [flow-emove.md](flow-emove.md) | eMOVE standalone logistics — entry gate, request, fee, payment, driver QR, BO, Finance (EAINT-12019). **Draft, not walked live; not in prod code** | Jira description + SRD version table + Teams CR group, 2026-10-26; SRD v0.8 not in repo |
| [flow-application-reactivation.md](flow-application-reactivation.md) | Application reminder emails, Extend, link reactivation (EAINT-11868 / 11982). **Draft, not walked live** | SRD v1.4 text copy + Teams CR group + Miro card, 2026-10-26 |
| [flow-browser-reminder.md](flow-browser-reminder.md) | Firefox to Chrome last-step browser reminder + homepage announcement, all modules (EAINT-12253 / 12180 / 12574). **Draft, not walked live by us** | SRD v1.1 + Miro + Jira + Teams + Azfar repo first-look (staging/uat1, 2026-10-21) |
| [flow-secarang-social-media.md](flow-secarang-social-media.md) | Secarang Social Media auto-posting cron — Facebook, Instagram, TikTok (EAINT-12528). **Draft, not walked live; no SRD** | Jira description + Scribe related history, 2026-10-27 |

Modules with **no** flow document yet — write one when a ticket touches them:
eVOC, LKM refund, BMK, Wholesale/Digits Marketplace.

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

Still owed: Get Free Quote, insurance steps 2–3, and insurance details. Since
saved in `_reference/html/eauto/` (supersedes the older owed list): insurance step 1
(after the 69E redirect), insurance listing, eSTM listing, eSTM details, UCD home.
`[verified: _reference/html/eauto/ listing, 2026-10-16]`

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
