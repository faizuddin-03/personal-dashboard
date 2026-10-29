# The 11 phases, on one page

The phase names below are **our automation's** words for the steps, in the order
`scripts/build-fixture.js` runs them. They are not the application's own vocabulary —
verify a resulting *Application Status* by reading the record, never by trusting a
phase name.

`assign` and `verify-regdocs` are the two easiest to miss: neither appears in the
SRD's narrative, and `dealer-link` looks like a phase but is really the second half
of `approve-preapp`.

| # | Phase | Actor | Surface / URL | Produces | Human? |
| --- | --- | --- | --- | --- | --- |
| 1 | `gate` | Dealer (public) | `/obs/preOnb/recaptcha` | a passed-gate session (saved to `.auth/preapp-state.json`) | **YES — one tick** |
| 2 | `preapp` | Dealer | `/obs/preOnb/form` → `/obs/preOnb/form/<uuid>` → review → FPX popup | pre-app reference `P260823/00759` + uuid, status **NEW**, **RM 108.00 paid** | no (Fiuu drives itself) |
| 3 | `approve-preapp` | BO **approver** (`ops_jasons`) | `/obs/admin/preOnb/enquiry` → `/obs/admin/preOnb/summary/<uuid>` | status **APPROVED** + the **dealer Application Link** | no |
| 4 | `appform` | Dealer | `/obs/form/<sec>?id=<brn>&s=<token>&v=1` — 3 steps | **the Application No** (`NA68001098`) and **Application Expiry Date = creation + 90 days, to the minute** | no |
| 5 | `assign` | BO **approver** | `/obs/admin/enquiry` → `/obs/admin/form/edit/<uuid>` | sidebar `Assignee` = the assignee; Assignee/UCD flag flips `Checked` | no |
| 6 | `submit-approval` | BO **assignee** (`hubadmin_bochar`) | same edit page | `UCD Group` set, **Submit for Approval** pressed → status **Pending** | no |
| 7 | `approve-app` | BO **approver** | same edit page | status **Approved**, `Application Approval Date` stamped, **Registration Documents tab appears** | no |
| 8 | `regdocs` | Dealer | same application link, step 4 | 6 document sections submitted | no |
| 9 | `verify-regdocs` | BO **assignee** | `/obs/admin/form/edit-registration-doc/<uuid>` | **`Verified`** pressed → `Registration Documents Verification Date` | no |
| 10 | `regfee` | Dealer | step 5 Payment | **RM 990.00 paid**, Payment Status **PAID** | no (Fiuu drives itself) |
| 11 | `record` | BO (either) | `/obs/admin/enquiry` | the finished record read back into the checkpoint | no |

**The build stops here, one step short of Registered, on purpose** — see
`06-hardcopy-and-registered.md`.

---

## The money

| Step | Amount | Breakdown |
| --- | --- | --- |
| Pre-application fee | **RM 108.00** | RM 100.00 + Service Tax 8% RM 8.00 |
| Registration fee | **RM 990.00** | Dermalog Biometric Device RM 772.00 (non-SST) + Registration fee RM 201.85 + Service Tax 8.0% RM 16.15 |

The registration-fee declaration restates the same total differently — "eAuto
Registration Fee RM 218.00 inclusive SST + one Dermalog device RM 772.00 non-SST".
Both readings come to RM 990.00. The fee includes one software installation, and the
page says no refund after payment.

Note the label difference, which has bitten a locator: the pre-app button is
**"Submit and Pay"**, the registration-fee button is **"Submit & Pay"**.

---

## The expiry date, and the skew that is not a bug

Submitting the Application Form mints the application **and** its
**Application Expiry Date = application creation + 90 days, to the minute**.

Observed on camera: expiry `2026-11-21 21:01` against a submission timestamp of
`2026-08-23 21:03`. The expiry anchors on the **earlier creation minute** (21:01 —
when the approved pre-app generated the application), not on the submit click. So a
1–2 minute skew between the *Application Submission Date* column and the
*Application Expiry Date* column is **CORRECT**. Assert against creation.

Confirmed again on a live build 31-08-2026: created `2026-08-31 17:45`, expiry
`2026-11-29 17:45`, `daysFromCreated: 90`. See
`03-automation/reference-data/example-fixture-checkpoint.json` for the whole record.

---

## Listing state as each side acts

| After | Application Status | Assignee/UCD flag | Approver/Assignee flag |
| --- | --- | --- | --- |
| `appform` | New | — | — |
| `assign` | New | Checked | — |
| `submit-approval` | **Pending** | Checked | Checked |
| `approve-app` | **Approved** | Checked | Checked |

The Remarks column carries *"TIN verification failed. Kindly provide correct TIN
information to eAuto customer service."* on every generated fixture. It is cosmetic —
see the TIN note in `05-known-traps.md`.

---

## Resuming a half-built record

Phases are checkpointed to `automation/fixtures/<label>.json` after each one, so a
build that dies at step seven resumes instead of starting another dealer and asking
for another reCAPTCHA tick:

```bash
npm run fixture -- --resume fx-260824-1130 --from regdocs
npm run fixture -- --resume fx-260824-1130 --only record
npm run fixture -- --until submit-approval    # stop mid-workflow deliberately
```

**Name the id.** A bare `--resume` takes the newest half-built checkpoint, which may
not be the one that stalled.

`--until <phase>` is how you get a record parked at an intermediate state — we needed
one at Pending and one at Verified for different scenarios.
