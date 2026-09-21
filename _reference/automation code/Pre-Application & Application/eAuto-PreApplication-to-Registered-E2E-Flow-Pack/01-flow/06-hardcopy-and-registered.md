# The last mile — Hardcopy & Acc Created, Create Account, and Registered

Our fixture builder deliberately **stops before this**, because Registered is
irreversible and it destroyed the fixture we had just spent 12 minutes building. But
we did drive it, unattended, and this is what it takes.

Measured 30-08 and 31-08-2026 on records `NA68001121`, `NA68001153`, `NA68001139`.

---

## Step 0 — the field, and who may move it

`Hardcopy & Acc Created` (the listing calls it that; the sidebar dropdown is labelled
`Hardcopy Doc`) offers **exactly three** values, read off the markup:

    PENDING_UCD  ·  PENDING_UCD_INCOMPLETE_DOCS  ·  PENDING_ASSIGNEE

**`Registered` is NOT one of them.** It is reached only by the **Create Account**
button. Setting the field directly makes a **stub**, not a registered record — that
is what produced `NA68001100`: Approved on the listing, every workflow column showing
a dash, **no expiry date at all**, and the dealer's step 4 still server-side
read-only. The dropdown sets the FIELD; the button runs the WORKFLOW.

**Only the ASSIGNEE may move this field**, and:

> **The saving control is `#update-hardcopy-status`, and it does not exist until the
> dropdown changes.**

The page's only other Save is `#to-edit-final`, which posts the *documents* form and
has never carried `hardcopyStatus`. If you click that one, nothing happens and no
error says so.

---

## Step 1 — Create Account renders ONLY at Pending Assignee

Swept across every value of the field, each with its own positive control:

| Hardcopy & Acc Created | Create Account button |
| --- | --- |
| `-` (fresh record) | no |
| Pending UCD | **no** |
| Pending UCD - Incomplete Docs | **no** |
| **Pending Assignee** | **visible and ENABLED** |
| Registered | already done |

The button is in the **PAGE HEADER**, top-right — **not in the sidebar**. This cost
one scenario three points: its record sat at *Pending UCD* and the rig walked up to a
button that only renders at *Pending Assignee*. Another scenario had worked only by
luck, because `build-fixture.js` happens to leave records at Pending Assignee while
records created at the reCAPTCHA gate do not.

**Before blaming a missing button, read this field.** "The button is not there" and
"the record is not at the state that renders it" are different findings, and only one
of them is about the build.

---

## Step 2 — it is TWO steps, not one

This is the part everyone gets wrong, including us, twice.

1. **Create Account opens a CONFIRMATION dialog** — *"Are you sure you want to
   proceed for company account creation?"* — **No / Yes, and zero inputs.**
2. **Yes NAVIGATES** to
   `/uat4/view/account/company-obs/new.do?id=<uuid>` — a whole separate page,
   ***Create New Company Account***, **149 controls**.
3. **Save is at the TOP** of that page: `#to-create-company`, an
   `input[type=button]` carrying a **`value`**, not text — so a text-content filter
   never finds it.
4. Save then produces `confirm: Sure to create ?` and, on accept, the record becomes
   **Registered**.

### What the company-account form actually contains

Company details (name, reg no, type UCD, vehicle type CAR/BIKE, UCD group, TIN,
addresses), BoD Reso/LoA + SSM profile attachments, **Main User Details**
(name / MyKad / contact / email / **Login ID + Password**), directors, decision maker,
admin, transaction payment details, permission module, and device serial rows.

### Required and empty — measured, not assumed

Most of the form inherits from the application. These do **not**:

| Control | Note |
| --- | --- |
| `#address` | |
| `#postCode` | **capital C** |
| `#phone` | |
| `#state` then `#city` then `#district` | **cascading, three deep** |
| `#PrimaryUserFile` | "Attach IC / Passport" — the one upload not inherited |
| `#primaryUserLoginName` | **Login IDs are GLOBAL.** A duplicate pops *"Main User Login ID already exists"* on Save. Generate per run. |
| `#primaryUserLoginPassword` | the only password control on the form, labelled "Password *:" — **minimum 6 characters** |

**The other ~22 empty fields are all optional.** Measured.

The alert that finally revealed the password rule was:

    alert: Director / Owner Password must at least 6 char.

...and "Director / Owner Password" **is** `#primaryUserLoginPassword`. The alert's
wording does not match the label.

---

## Step 3 — the alert() trap, in full

**The form has no `required` attributes in the markup and validates entirely through
`alert()`.** Playwright dismisses dialogs automatically when nothing is listening, so
Save produced **no error text, no POST and no reason** — the page was naming every
problem to nobody. Once a listener was attached, four blockers surfaced in four runs.

And a second layer: our driver checked a DOM-node error selector
(`.error` / `.has-error` / `.alert-danger`) — **markup this form does not use.** It
was empty on every run, successful or not, so the one branch that could report a
validation refusal **could never fire**. The alert had been captured correctly all
along; nothing read it.

Read the **alerts**, not just the DOM.

| Dialog text | Means |
| --- | --- |
| `alert: <anything>` | **refusal** — validation failed, quote it |
| `confirm: Sure to create ?` | **happy path** — validation PASSED, the page is asking to proceed |

---

## Step 4 — after Save

The page becomes **Update Company Account #1109715** with
`Update / Activate / Print DO / Confirmation Of Registration`, and the application
listing flips to:

- **Application Status: Registered**
- **Hardcopy Doc: Registered**

---

## Registered is TERMINAL

For the EAINT-11982 feature specifically, Registered removed the Extend control **for
ever** — five records went that way in one evening. More generally: the expiry
lifecycle ends at Registered and nothing about it changes afterwards.

**So dry-run any driver for this on a record you can afford to lose, first.** A live
recorded take is the most expensive possible test harness. The pattern that worked:

| Script | Does |
| --- | --- |
| `probe-create-account-states.js` | sweeps every Hardcopy value, reports where the button renders — reads only |
| `probe-create-account-dry.js` | fills the form, stops **before** the irreversible submit |
| `probe-company-form-fields.js <NA...> --try-save` | fills, presses Save, and **dismisses** whatever dialog appears. Dismissing a confirm is "No", so **a satisfied form answers `confirm: Sure to create ?` and nothing is created**; an unsatisfied one names its problem. Then re-reads the record and says loudly if it registered anyway. |
| `probe-create-account-commit.js <NA...> --yes-i-mean-it` | does the whole thing, on a named sacrifice |

Note the asymmetry that makes the probe safe: **the PROBE dismisses, the DRIVER
accepts.** Check which one you are running before you trust either.

That third script turned an expensive iterate-by-take loop into a two-minute check.
It is the single most useful idea in this document.

---

## Declared, NOT measured — confirm before relying on these

Two states are named by our own checks and neither has been read directly:

- **Revert to UCD** is said to need a record still at **Pending**.
- **Verified** is said to leave Create Account behaving as before.

Both come from trigger-point labels and refusal reasons in our code, not from an
observation. Treat as unverified.
