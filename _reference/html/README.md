# Captured page HTML

Raw HTML of pages we automate, saved verbatim so a selector can be re-checked
without a live login, a VPN, or a working staging environment.

## Why this exists

The `knowledge/flow-*.md` documents are full of `[verified: live HTML from uat4,
2026-08-14]` tags — but until 2026-08-17 the HTML behind those tags was read in a
session and **thrown away**. The claims were unverifiable and the selectors could
not be re-derived without recapturing. That is the gap this folder closes.

`knowledge/` stays the distilled, sourced fact. This is the raw source it was
distilled from — the same split as the rest of `_reference/`. Flow docs link
here; don't paste page HTML into `knowledge/`, which is meant to be read whole at
the start of a task.

## Layout

```
_reference/html/<system>/<page>.html
```

`<system>` is the app (`esim`, `eauto-ucd`, `eauto-bo`, `secarang`, `cibo`),
`<page>` a slug of the route.

## Rules

1. **Save the capture in the same change as the flow doc.** A `[verified: live
   HTML]` tag with no file behind it is the thing this folder exists to prevent.
2. **Head the file with a comment block** giving the URL, the environment, the
   capture date, and what was trimmed.
3. **Trimming long lists is expected and must be declared.** A 287-row table has
   no reference value beyond its `thead`, a few representative rows and the
   pager — keep the structure, drop the bulk, say so in the header.
4. **Never trim a form.** Forms are the whole point: every field, id, name, type
   and required marker is load-bearing. Save them complete.
5. **Redact nothing silently.** If a token or a real IC is removed, say where.

## Index

| File | Page | Captured |
|---|---|---|
| [esim/login.html](esim/login.html) | eSIM sign-in | 2026-08-17 |
| [esim/app-shell.html](esim/app-shell.html) | Sidebar + top bar, identical on every eSIM page | 2026-08-17 |
| [esim/estm-enquiry-list.html](esim/estm-enquiry-list.html) | `/esim/estm-enquiry-resp` list, search, pager | 2026-08-17 |
| [esim/estm-enquiry-edit.html](esim/estm-enquiry-edit.html) | `/esim/estm-enquiry-resp/<id>/edit` — **complete form** | 2026-08-17 |
| [esim/estm-submission-list.html](esim/estm-submission-list.html) | `/esim/estm-submission-resp` list | 2026-08-17 |
| [esim/dereg-enquiry-list.html](esim/dereg-enquiry-list.html) | `/esim/dereg-enquiry-resp` list, full 55 records (rows past #10 are the app's own client-side pagination, not a capture trim) | 2026-08-21 |
| [esim/dereg-enquiry-edit.html](esim/dereg-enquiry-edit.html) | `/esim/dereg-enquiry-resp/<id>/edit` — **complete form** | 2026-08-21 |
| [esim/rhb-transfer-list.html](esim/rhb-transfer-list.html) | `/esim/rhb-transfer-resp` list, 122 records (rows 11-122 trimmed to representative examples, full code inventory kept in the header comment) | 2026-08-21 |
| [esim/rhb-transfer-edit.html](esim/rhb-transfer-edit.html) | `/esim/rhb-transfer-resp/<id>/edit` — **complete form** | 2026-08-21 |
| [esim/rhb-transfer-view-after-save.html](esim/rhb-transfer-view-after-save.html) | Same record's view page right after Save — confirms the save-redirects-to-view behaviour for this entity too | 2026-08-21 |
| [esim/dereg-submission-list.html](esim/dereg-submission-list.html) | `/esim/dereg-submission-resp` list, full 52 records — governs the JPJ Deregistration Final Submission step (step 6), not Pre-Checking | 2026-08-21 |
| [esim/dereg-precheck-enquiry-list.html](esim/dereg-precheck-enquiry-list.html) | `/esim/dereg-precheck-enquiry-resp` list, full 19 records — **the entity that steers eDereg Pre-Checking's JPJ result**, confirmed by field-shape match + an explicit "eDereg PreChecking" remark | 2026-08-21 |
| [esim/dereg-precheck-enquiry-edit.html](esim/dereg-precheck-enquiry-edit.html) | `/esim/dereg-precheck-enquiry-resp/<id>/edit` — **complete form** | 2026-08-21 |
| [esim/dereg-precheck-enquiry-view-after-save.html](esim/dereg-precheck-enquiry-view-after-save.html) | Same record's view page right after Save | 2026-08-21 |

**Not yet captured** — the eAuto UCD pages that `knowledge/flow-*.md` cite as
verified (Get Free Quote, insurance steps 1–3, insurance listing/details, eSTM
listing/details, UCD home). Those tags currently have no file behind them. See
`knowledge/flows.md`.

## `_reference/codebases/AATF/` — eDereg Pre-Checking + Deregistration (AATF portal)

Page captures for the AATF portal, kept alongside other reference material
under `_reference/codebases/AATF/` rather than `_reference/tickets/` — this
folder is meant to grow into the AATF portal's general reference set, not stay
scoped to one ticket. First occupant is EAINT-9306's flow.
Repeated header/nav/footer chrome is trimmed from each (declared in-file,
verbatim boilerplate lives in `_reference/html/eauto/ucd-home-hub-admin.html`);
forms are kept complete.

| File | Covers | Env | Captured |
|---|---|---|---|
| `EAINT-9306-aatf-home-and-menu.html` | AATF home (compulsory-gate banner), announcement popup, eDereg menu (4 buttons) | uat1 | 2026-08-21 |
| `EAINT-9306-precheck-step1-vehicle-consent.html` | eDereg Pre-Checking Enquiry step 1 — blank / consent-ticked / confirm-dialog states | uat1 | 2026-08-21 |
| `EAINT-9306-precheck-payment-and-result.html` | Step 2 Payment (RM10.40 fee breakdown) through Step 3 Result (`GLB000000I`) | uat1 | 2026-08-21 |
| `EAINT-9306-precheck-details-and-listing.html` | Pre-checking transaction details view + transaction listing | uat1 | 2026-08-21 |
| `EAINT-9306-dereg-create-category-select.html` | Create Deregistration Transaction — MyKad/MyPR category picker | uat1 | 2026-08-21 |
| `EAINT-9306-dereg-step1-owner-mykad-auth.html` | Dereg step 1 Owner — PERINGATAN consent + MyKad/thumbprint hardware auth widget | uat1 | 2026-08-21 |
| `EAINT-9306-dereg-step2-vehicle-details.html` | Dereg step 2 Vehicle — **the compulsory-gate enforcement point**: `#precheck-result`, inline pay-to-unblock popups | uat1 | 2026-08-21 |
| `EAINT-9306-dereg-step3-owner-aatf-consent.html` | Dereg step 3 AATF — owner's-copy consent, AATF's-copy consent, AATF rep MyKad auth | uat1 | 2026-08-21 |
| `EAINT-9306-dereg-step4-jpj-check.html` | Dereg step 4 JPJ Check — declaration + JPJ enquiry result (native `confirm()` popup, no DOM) | uat1 | 2026-08-21 |
| `EAINT-9306-dereg-step5-payment-and-step6-deregister.html` | Dereg step 5 Payment through step 6 Deregister (`OK - TRANSACTION SUCCESSFUL`) | uat1 | 2026-08-21 |
| `EAINT-9306-dereg-details-and-listing.html` | Full deregistration transaction details view + transaction listing (incl. COD follow-up link) | uat1 | 2026-08-21 |
| `EAINT-9306-dereg-step2-precheck-jpj-failed.html` | Dereg step 2 inline pre-check — JPJ-Failed outcome (`VEL000045E`) after a successful payment | uat1 | 2026-08-21 |
| `EAINT-9306-dereg-step2-precheck-payment-failed-retry.html` | Dereg step 2 inline pre-check — payment-Failed outcome (RHB `IF` insufficient funds), 2-attempt payment history + reset-timer + Next/Cancel retry buttons | uat1 | 2026-08-21 |
| `EAINT-9306-bo-home-menu.html` | Back-Office (Hub Admin) home menu — source of the "JPJ XML Log (Deregistration/eDereg Pre-Checking)" and "eDereg Pre-Checking Transaction" listing links | uat1 | 2026-08-24 |
| `EAINT-9306-bo-jpj-xml-log-dereg.html` | BO "JPJ XML Log (Deregistration)" — blank search form + a 4-row result (Vehicle No. search). **This is the DEREGISTRATION log, not eDereg Pre-Checking's own** — see the file's own header note | uat1 | 2026-08-24 |
| `EAINT-9306-bo-jpj-xml-log-precheck.html` | BO "JPJ XML Log (eDereg Pre-Checking)" — blank search form + a 2-row result (Vehicle No. search). This IS the ticket's own log — one extra "Search By" column vs. the Deregistration one | uat1 | 2026-08-24 |
| `EAINT-9306-precheck-details-live-2026-08-24.html` | Pre-Checking transaction Details page — REPLACES the wrong assumption in `EAINT-9306-precheck-details-and-listing.html` (which elided the Result section with a comment instead of real markup). Proves `#responseVehicleNo`/`#jpjStatusLabel`/`#responseDesc` do NOT exist here; also documents a real duplicate-`id="verifiedStatus"` bug on the page itself | uat1 | 2026-08-24 |
| `EAINT-9306-precheck-resubmit-standalone.html` | The Pre-Checking listing's "Resubmit" link's landing page — the standalone Enquiry flow's OWN Step 2 Payment page (`#custom-header`, `#to-retry-rhb`), NOT the inline `#precheck-popup`. REPLACES the wrong MU_TS4 assumption that Resubmit reopens the inline popup — see `knowledge/flow-edereg.md` §22 | uat1 | 2026-08-26 |

**Key finding from this batch**: the compulsory eDereg Pre-Checking gate can be
satisfied from TWO different entry points that write to the same check —
(1) the standalone "eDEREG PRE-CHECKING ENQUIRY" menu flow, or (2) paying for
it inline from the Deregistration step-2 Vehicle-details screen when
`#precheck-result` shows the red "required" state. See
`knowledge/flow-edereg.md` §5.1 and §2.

## mykad-emulator/

The local MyKad Reader Emulator's own control-panel page — the fingerprint-
bypass tool, distinct from eSIM. See
[knowledge/mykad-emulator.md](../../knowledge/mykad-emulator.md).

| File | Covers | Env | Captured |
|---|---|---|---|
| `control-panel.html` | `localhost:7878` control panel — Connect/Disconnect, Device Commands, Insert/Remove Card, Quick Profiles (incl. `FaizuddinAATF`), Response Log | local | 2026-08-21 |

## eauto/

Captures from the eAuto UCD portal (staging).

| File | Page | Env | Captured |
|---|---|---|---|
| `estm-step5-payment-before-submit.html` | eSTM step 5 "Payment", before clicking submit | sit2 | 2026-08-17 |
| `estm-step5-payment.html` | the SAME page after clicking submit, dialog 1 open | sit2 | 2026-08-17 |
| `estm-step5-payment-dialog2.html` | dialog 2, "Sure to make this payment now?" | sit2 | 2026-08-17 |
| `estm-listing-with-approved-row.html` | eSTM Transaction Listing, full filter form + table; row 1 is an `Approved` transaction | uat1 | 2026-08-19 |
| `estm-details-with-buy-insurance-banner.html` | that same transaction's details page, incl. the `#to-buy-insurance` banner and `#buy-insurance-dialog` confirm | uat1 | 2026-08-19 |
| `estm-step5-payment-fis-amount-different-dialog.html` | eSTM Payment step right after unticking eLKM, with the open `#fis-amount-different-dialog` ("Sure to make this payment now?") | uat1 | 2026-08-19 |

`estm-step5-payment.html` is the worked example for eAuto **popups**: it holds
both a page control and a dialog button labelled "Next", which is exactly the
collision that hangs a naive `getByText('Next')`. Cited from
[knowledge/flow-estm.md](../../knowledge/flow-estm.md), "Step 5 Payment".

**Read the three step-5 files as a sequence** — they are one submit, captured at
each click. The diffs are the evidence: `disabled="true"` on `#to-payment` is
added by the click rather than present before it, and the confirm button is
labelled "Next" in dialog 1 but "OK" in dialog 2, which is why the automation
matches on `.confirm-dialog-btn` and never on a label.

| `ucd-home-hub-admin.html` | UCD home menu (Hub Admin role), source of the "Manage Company Accounts" link | uat1 | 2026-08-21 |
| `company-listing-blank.html` | Manage Company Accounts, full filter form, before any search (`#result` empty) | uat1 | 2026-08-21 |
| `company-listing-search-empty.html` | same page after Search with no match — `<tbody>` present but empty | uat1 | 2026-08-21 |
| `company-listing-search-with-results.html` | same page after Search with 8 matching rows | uat1 | 2026-08-21 |

**The three `company-listing-*.html` files are the worked example for the
Company Details Checker** (EAINT-12153 sub-function): the empty-vs-populated
`<tbody>` under `#result` is the entire present/absent signal, cited from
[knowledge/flow-ucd-company-listing.md](../../knowledge/flow-ucd-company-listing.md).
