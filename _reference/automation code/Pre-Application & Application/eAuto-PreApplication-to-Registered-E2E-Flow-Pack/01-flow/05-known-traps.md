# Traps this flow has already sprung

Every one of these cost us a run, and **three of them produced defect reports against
a build that was working correctly.** They are grouped by where you will hit them.

---

## A. The Pre-Application Form

### 1. No generated BRN can ever pass the SSM check — and the form does not tell you it gave up

Filling *Sdn Bhd* with a generated BRN and pressing **Next does not advance**. The
page re-renders with a red banner:

> *"Please confirm your business information before proceeding. Please check that the
> business registration number is correct and confirm your business type"*

...and the business type has **silently switched to Business Trading (Sabah)**, with
the trading-licence fields now required. It looks like a validation message; it is
actually a path change that already happened.

`/obs/preOnb/checkSSM.do` is a **live lookup**. Staging answered
`200 {"registered":false,...,"unexpectedResult":null}` for a well-formed generated
number — a healthy lookup that simply does not know the company. The page then calls
`fallbackToBusinessTrading()` and returns.

| Business type | Automatable? | Why |
| --- | --- | --- |
| Sdn Bhd / Bhd | **no** | needs a real BRN |
| Sole Proprietorship / Partnership | **no** | needs a real BRN |
| LLP | **no** | needs a real BRN |
| Business Trading (Sabah) | **yes** | drivable with generated data |
| Business Trading (Sarawak) | **yes** | drivable with generated data |

This is a **data question for dev/BA** — does the staging SSM connector have a test
dataset? — not something a harness can work around. Note also that on fallback the
page picks *Sabah* for a company with no connection to Sabah: it takes the first
non-SSM radio, which is arbitrary rather than incorrect.

### 2. The form validates far less than the SRD implies

Generated formats buy credibility, not passage:

- New BRN / Old BRN / Business Trading License No — minimum **4** characters
- TIN — minimum **9**, maximum **15**; **no prefix or checksum rule**
- Postcode — exactly **5**; Mobile No — maximum **11**
- The company name is **upper-cased by the page**

### 3. The City list does not exist until a State is chosen

Cascading select. Choose State, wait, then City. The same pattern appears again, three
deep, on the company-account form: `#state` then `#city` then `#district`.

### 4. Duplicate data fails at the END of the form

A duplicate BRN is rejected *after* the reCAPTCHA has already been paid for by hand.
So generate every identity field — company name, BRN, TIN, and the stamped email —
from the same run stamp, and make them unique **by construction**, not by hoping.

### 5. FPX opens a POPUP, not a same-tab redirect

`sandbox-payment.fiuu.com` in a new window: *"Connecting to FPX... Please don't
close, refresh or press back button on browser"*. Your driver must **grab the popup
handle**.

The two simulators differ: **Maybank (`MB2U0227`) shows the TAC on screen** with a
copy control; **AmBank (`AMB80209`) wants `Request TAC` clicked first.** Both end the
same way — status dropdown = **Approved**, then **Pay Now**.

### 6. The declaration checkbox is mandatory before Submit and Pay enables

Not a disabled-button bug. Tick the "By proceeding with this submission, I hereby:"
checkbox (clauses a-d plus the MSIC 45102 dealer-licence paragraph) first.

---

## B. The Application Form

### 7. The TIN check is ACKNOWLEDGE-ONCE, so step 1 needs Next then Save & Continue, TWICE

This one is subtle and **every generated fixture hits it**.

`validateTinAgainstBrn()` runs inside the "Unsaved Changes" dialog's confirm handler.
The **first** call stores `tinMismatchAckKey` (TIN|regNo), shows

> *"The TIN is invalid. This may affect e-invoice submission. Click Next to
> proceed."*

...and returns **false**. The **second** call with the same key returns true and the
draft saves.

So the sequence is `Next` then `Save & Continue`, **twice over**. Our first version
did next then saveContinue then next, and stopped one click short with a dialog still
open — which reads as a hung form. Treat advancing a step as a **cycle of up to three
attempts**, not a fixed run of clicks.

The warning is **non-blocking by design** — the page's own copy says
"Click Next to proceed" — and it fires even on a well-formed TIN, because the TIN is
validated against the *SSM record*, not against a format. The
*"TIN verification failed..."* text that then rides along in the listing's Remarks
column is cosmetic.

### 8. Association choices in step 1 create upload rows in step 2

Ticking *MMSDA* / *PEKEMA* under **Motor Vehicle Association** adds one membership-
receipt row per association to step 2 section 6. Your upload code must be driven by
what step 1 selected, not by a fixed list.

### 9. There is a `Save & Continue Later` on every step

Useful for parking a record mid-form; also a thing your locators will collide with if
you match loosely on "Save".

---

## C. The BackOffice Application Listing — the worst offenders

### 10. The Search is AJAX, and the count line is ALREADY ON THE PAGE. This produced a false defect report.

**The single worst trap so far.** `#to-search` serialises `#search-form` and fires a
GET at `admin/form/enquiry/search`, then rebuilds the table in the success callback.

Waiting for the "record(s) in total" text is **satisfied by the count line the
PREVIOUS search left behind**. So every filtered search read the previous result set,
lagging by exactly one query. Our first status sweep duly reported Draft rows coming
back from the *Pending* filter, Re-evaluate rows from *Approved*, and a record count
belonging to the query before — **a listing filter that looked comprehensively broken
and was working perfectly.**

Correct wait: for the **response** to that request, then for the app's own `#overlay`
(jQuery ajaxStart/ajaxStop) to drop, then for **two identical reads of the rendered
table 300ms apart**.

> **The wider rule: waiting for something that is already true is not waiting.**

### 11. Page one is not the population

The listing renders **100 rows a page** and paginates the rest, and a naive row-reader
only ever sees what is rendered. A census that read page one of an *unfiltered* search
found 15 Expired applications and concluded three scenarios were blocked on fixtures
that "could not exist". Filtering by Expired and **walking the pages** said **289**.
The records were there all along.

Walk `pageNo` against the same AJAX endpoint before concluding staging holds none of
something.

### 12. The empty state is a ROW

A search with no matches renders one `<td colspan="100%">No records found matching
your search criteria</td>`. A row-reader counts it as a data row — so a zero-result
filter looks like a one-row result whose row has no Edit link, and the honest answer
("no such application exists") comes out as "could not open row 0 (unidentified)".
Drop it explicitly, and **always cross-check the row count against the total the
search reports**.

### 13. Take the Edit link from the ROW, not from the page

A page-level "first Edit link" match opens whatever sits at the top of the results.
One run quietly sent four different application statuses to the same Approved record
— and reported a control present for "Draft" and "Rejected". **A false defect that
looked entirely real.**

### 14. The status filter is STICKY server-side, and "All" does not clear it

The filter survives a full page load. A run that reads *Approved* and then looks up an
Expired record **by number** gets 0 rows. And passing a widen-to-All sentinel through
a search helper that skips empty values is a **no-op** — it does not clear anything.

**Checked by hand and it is NOT a product defect:** the dropdown honestly shows
`Approved` throughout, and a human who selects All and searches gets their record. UI
and server agree. Do not raise it without repeating that hand check.

Sweep the records matching a filter **while that filter is still the most recent
search**.

### 15. Never wait on a page lifecycle — these pages do not finish loading

A Rejected record read as a 30-second hang twice: once waiting on `load`, then again
on `domcontentloaded` after the first "fix". Probed with **no wait condition at all**,
it returns its whole 252KB document in **1.2 seconds**.

What never happens is `readyState` leaving "loading", because ~48 static assets
(`/web/jquery/*`, the toolbar images, `/obs/js/jquery-2.2.4.min.js`) **never answer**.
So waiting for a lifecycle event waits for an image. Commit the navigation and poll
for a document big enough to be real. **This is not Rejected-specific.**

### 16. Tab names must be exact

A tab match on "Application" also matches **"Pre-Application"**. Taking the first
match then picks the *active* tab, whose href is `#` and whose parent div swallows the
pointer — a 20-second timeout that reads like a broken tab bar.

The three tabs are: `Pre-Application` | `Application` | `Registration Documents`. The
third only appears once the application is Approved.

### 17. A 404 is not a blank page

`/obs/admin/form/edit-registration-doc/<uuid>` returns **"404 - NOT FOUND"** for an
application whose registration documents were never submitted. That surfaced as
"blank even after re-entering through the menu" — i.e. as a *session* failure. A row
without a registration-documents page is **out of scope**, not a broken page.

### 18. `Hardcopy & Acc Created` is NOT a proxy for "registration documents submitted"

It is a **later** step. Filtering on it to find records that *have* a
registration-documents page silently drops records that do have one. One sweep
reported "6 with a page" out of 56 Approved; opening the records the filter had
excluded found several serving the page at HTTP 200. The true split was **9 / 29 / 18**.

The damage is double-sided: the population is understated, **and** "no candidate
available" from that sweep is not evidence that staging holds none.

---

## D. Reasoning traps — the expensive ones

### 19. An absence is the easiest result to get and the hardest to attribute

We built a ladder of records at 25, 27, 29 and 30 days before expiry. **Every one
showed no control**, while a record at 14 days showed one. That reads exactly like a
window rule over-correcting. We were one step from reporting it.

It was wrong. **Every record in the ladder had `Hardcopy Doc = Registered`**, which
suppresses the control regardless of dates. They had been picked by expiry date alone.

The tell was cheap and nearly missed: **two records at the SAME 14 days gave opposite
results** — so the date was never the variable.

**Any probe reporting a control's presence must also print every other suppressor**
(here: `hardcopyDoc`, `applicationStatus`, and whether the record was already
consumed). And **prefer one record moved across a boundary** over a ladder of
different records — it holds every other variable fixed by construction.

### 20. Separate "observed false" from "never observed"

A run printed *"0 of 22 have a registration-documents page"* when it had actually
**failed to open 22 of 22**. A count that cannot tell those apart is a bug wearing a
different hat.

**Throw on not-found**, and assign the observation **only after the read succeeds**. A
missing row must never fall through to a falsy default.

### 21. A negative check whose PASS branch is reachable by a request that never happened is a coin flip that always lands green

Two instances in one script:

- A POST to an endpoint with **no CSRF header** got `403` with an **empty body** and
  was reported as *"refused server-side — the endpoint enforces"*. **False pass.**
  Spring Security rejects a missing token with exactly that signature **before the
  handler runs**, so the record was never evaluated. Every `/obs` page sets a
  `csrfToken` constant in an inline script and installs it via jQuery's `ajaxSetup` —
  scrape it, and refuse to send without one.
- The same script read a field by the wrong name, got `undefined`, compared
  `undefined` to `undefined`, and declared the record unchanged **without ever
  reading the value under test.**

**Every negative check needs a positive control in the same run**, or an explicit note
saying it lacks one.

### 22. Look at a picture before writing down a design delta

Two "findings" were manufactured by reading the DOM as though it were the screen.
Both were plausible; both died to a screenshot in under a minute.

### 23. ...and the mirror image: some real text is invisible on purpose

Hover tooltips live in the DOM with `display:none` until `:hover`. An
innerText-style read returns nothing for them, so reading them "the visible way"
fails on a perfectly correct build. Read `textContent` — and remember that **a
screenshot does not show a tooltip unless the mouse is parked on the control.**

### 24. A field that is not there yet is not a locator miss

The sidebar's **Assignee dropdown does not exist on a freshly submitted
application**. The approver's edit page renders UCD Group and Application Status only,
with the value carried in a hidden `#assigneeUserIdHidden`; the visible
`#assigneeUserId` appears once the record is further along.

Our code routed that into an assisted hand-over and **stopped a build dead on a page
that was behaving correctly.** Ask *"is this field supposed to exist at this point?"*
before hunting a better selector.

(A loose attribute hint on "assignee" also matched the **hidden input** — hence a
`:not([id$="Hidden"])` guard.)

### 25. A form that validates with alert() names every problem to nobody

The Create New Company Account form has **no `required` attributes in the markup** and
reports every validation failure through `alert()`. **Playwright auto-dismisses
dialogs when nothing is listening**, so Save produced no error text, no POST and no
reason. Once a listener was attached, four blockers surfaced in four runs.

Two corollaries:
- A generic "fill the required fields" pass selects **zero** controls and reports
  success.
- `alert:` is a **refusal**; `confirm: Sure to create ?` is the **happy path** —
  validation passed and the page is asking to proceed. Dismissing a confirm is "No",
  which is a safe way to ask the form whether it is satisfied **without creating
  anything.**

### 26. A dump written to a FIXED filename is destroyed by its own next run

Twice in one hour, and the date-sensitive captures are exactly the ones that cannot be
re-taken. Archive the previous file under **the timestamp it describes**, not the
timestamp of the run that replaced it.
