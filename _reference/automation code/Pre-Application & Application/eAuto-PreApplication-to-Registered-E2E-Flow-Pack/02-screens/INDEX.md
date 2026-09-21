# Captured screens, phase by phase

These are **real captures from live runs on staging**, not mockups. Each screen has up
to four files:

| Extension | What it is | Use it for |
| --- | --- | --- |
| `.png` | full-page screenshot | seeing the screen |
| `.aria.yaml` | the **accessibility tree** | finding a role/name locator that will not rot |
| `.txt` | the page's visible text | grepping for a label or a message |
| `.json` | a probe's structured reading, where one was taken | the measured values |

The `.aria.yaml` files are the most useful thing here for anyone writing automation —
they tell you what the page exposes as roles and accessible names, which is what
`getByRole` matches on.

---

## Phase 1 — the gate

| Screen | Phase |
| --- | --- |
| `10-recaptcha-gate` | `gate` — `/obs/preOnb/recaptcha`, "Please verify you're human" |

## Phase 2 — Pre-Application Form (dealer)

| Screen | Phase |
| --- | --- |
| `11-preapplication-form-fresh` | `preapp` — the empty form, step 1 of 2 |
| `12-preapplication-form-filled` | `preapp` — filled, Business Trading path |
| `13-business-info-review` | `preapp` — step 2, Business Info Review, Payment Summary RM 108.00, payment-method tiles |
| `14-preapplication-submitted` | `preapp` — Pre-Application Review after payment, status NEW, Payment Details PAID |

## Phase 3 — BackOffice approves the pre-application

| Screen | Phase |
| --- | --- |
| `15-preapplication-listing` | `approve-preapp` — UCD Pre-Application Listing and its filters |
| `16-preapplication-summary` | `approve-preapp` — detail page with Reject / Approve |
| `17-preapplication-approved` | `approve-preapp` — **APPROVED, with the dealer Application Link and Copy Link** |

## Phase 4 — Application Form (dealer)

| Screen | Phase |
| --- | --- |
| `20-application-form-step1` | `appform` — step 1 Business Information, pre-filled |
| `20-application-form-step1-filled` | `appform` — filled, including the TIN warning |
| `21-application-form-step2` | `appform` — step 2 Upload Files, all seven sections |
| `20-application-form-step2-filled` | `appform` — uploads attached |
| `21-application-form-step3` | `appform` — step 3 Acknowledgement |
| `20-application-form-step3-filled` | `appform` — filled |
| `22-application-submitted` | `appform` — the Success Notification modal |

## Phases 5-7 — BackOffice workflow

| Screen | Phase |
| --- | --- |
| `23-application-backoffice` | `assign` — the BO Application Form edit page and its right sidebar |
| `24-application-submitted-for-approval` | `submit-approval` — after UCD Group + Submit for Approval |
| `25-application-approved` | `approve-app` — Approved, approval date stamped |

## Phases 8-10 — registration documents and the fee

| Screen | Phase |
| --- | --- |
| `30-registration-docs-dealer` | `regdocs` — dealer step 4, the six document sections |
| `31-registration-docs-submitted` | `regdocs` — the success notification |
| `32-registration-docs-backoffice` | `verify-regdocs` — the BO Registration Documents page **and its sidebar** |
| `33-registration-docs-verified` | `verify-regdocs` — after pressing Verified |
| `34-registration-fee` | `regfee` — dealer step 5 Payment, RM 990.00 breakdown |
| `35-registration-fee-paid` | `regfee` — Application Payment Success, Payment Status PAID |

## Phase 11 and the listing

| Screen | Phase |
| --- | --- |
| `40-ucd-application-listing` | `record` — the UCD Application Listing, all ~15 columns |
| `02-application-listing-result` | the listing with results, for column order |
| `03-application-tab` | the BO Application tab |
| `04-registration-documents-tab` | the BO Registration Documents tab |

## EAINT-11982-specific (ignore unless relevant)

| Screen | What |
| --- | --- |
| `05-extend-modal` | the Extend modal — expiry-extension feature only |

---

## Reading an `.aria.yaml` — a worked example

The gate is the simplest one. Open `10-recaptcha-gate.aria.yaml` first to see the
shape, then `32-registration-docs-backoffice.aria.yaml` for a real page with a
sidebar. The sidebar structure in that second file is the one that matters most for
BackOffice work: `Application No`, `Assignee` dropdown, `Application Status`,
`Registration Documents Submission Date`, and the full-width `Verified` button.

**A caution about `.html` files:** the pack deliberately ships the aria tree and the
text rather than the raw HTML dumps for most screens. The HTML is 85-180KB per page
and is mostly jQuery-era boilerplate; the aria tree is what you actually locate
against. If you need the raw markup for a specific screen, it is in the project at
`automation/discovery/<screen>.html`.
