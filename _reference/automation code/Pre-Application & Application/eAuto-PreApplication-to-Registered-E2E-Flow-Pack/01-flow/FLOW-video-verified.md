# Drafted automation flow — from Pre-Application

**This is the only route.** Since 27-08-2026 every transaction the rig creates
starts here, at the Pre-Application Form; BackOffice's UCD New Application panel
is closed (vault R22). What follows is therefore not one option among two — it is
the flow.

Ground truth: Snagit recording `2026-08-23_21-11-11.mp4` (12m 45s, staging, 23-08-2026
~20:57–21:11). This is the first complete observation of the dealer journey — the
23-08 HAR never got past the reCAPTCHA, so until this video every screen past the
gate was known only from the SRD's prose. Every label, URL, amount and status below
was read off the video frames, not guessed.

Timestamps are into the video. Script mapping refers to `scripts/build-fixture.js`
and its phases: `gate → preapp → approve-preapp → appform →
submit-approval → approve-app → regdocs → verify-regdocs → regfee → record`.

Actors (from `src/accounts.js` roles):

| Actor | Surface | Login |
| --- | --- | --- |
| Dealer | public UCD, `staging.eauto.my/obs/...` | none (link + session) |
| BO approver | `staging.eauto.my/cs04` → Onboarding menus | `ops_jasons` (Jason Seah) |
| BO assignee | `staging.eauto.my/cs04` → Onboarding menus | `hubadmin_bochar` (CHARMAIN EA CHIANG chg) |

The Onboarding admin screens open off cs04 but live under `staging.eauto.my/obs/admin/...`
("Back to Backoffice" banner) — the listing the expiry column lives on is
`/obs/admin/enquiry`, not a cs04 page.

---

## Phase 1 — `gate` · reCAPTCHA (0:00–0:56) · HUMAN

- `staging.eauto.my/obs/preOnb/recaptcha` — "Please verify you're human".
- Video shows three image challenges back-to-back (motorcycles → bus with a
  "Please try again" → crosswalks) before VERIFY passes, ~55 s of human time.
  Budget for multiple challenges; the script only watches for the redirect.
- On pass the page lands on `/obs/preOnb/form` directly. `passGate` asks for the
  form first and prints "gate: skipped" when the saved state still works.
- ~~Session saved to `.auth/` is reusable across runs (measured 24-08)~~ —
  **RE-MEASURED 26-08 evening: it is NOT.** `npm run check:gate` restored the
  saved state, asked for the form, and was bounced straight back to the gate.
  Verbatim: *"NOT REUSABLE — the gate is enforced per build, so every fixture
  needs a human at the keyboard for the tick."* Budget one tick PER FIXTURE, not
  one ever. That is the number that belongs in an estimate, and it is the
  argument for asking staging to use Google's published reCAPTCHA test keys.

## Phase 2 — `preapp` · Pre-Application Form (0:56–2:52)

URL after the gate: `/obs/preOnb/form`, later `/obs/preOnb/form/<uuid>` (the draft
gets a uuid as soon as it exists — keep it, it identifies the draft).

Step indicator: **1 Pre-Application Form — 2 Business Info Review**.

**Business Information**
- `Business Registered Name *` (text; page upper-cases it)
- `Type of Business *` — SSM Registered: `Sdn Bhd / Bhd` · `Sole Proprietorship /
  Partnership` · `LLP`; Non-SSM Registered: `Business Trading (Sabah)` ·
  `Business Trading (Sarawak)`
- SSM path only: `Business Registration No (BRN) *` = `Old BRN` + `New BRN` inputs
- Non-SSM path only: `Business Trading License No *` + `Trading License *` file
  upload (`Browse File...`, pdf/png/jpg/jpeg max 5MB, `Add More File`)
- `Tax Identification No (TIN)` — optional here; helper "Please ensure you entered
  the correct TIN for e-invoice"
- `Showroom Address *`, `Showroom Postcode`, `Select State`, `Select City`
  (city list loads only after state)

**Admin In Charge** ("the representative assisting with this application")
- `Name *`, `Mobile No *`, `Email Address *` ("We will email an invoice and/or
  e-invoice once payment is successful.")
- `Cancel` / `Next`. Footer: "For further assistance, please contact our Customer
  Service 03-27798899."

**The SSM fallback, exactly as the video shows it (1:04–2:00):** filling Sdn Bhd
with a generated BRN and pressing Next does NOT advance — the page re-renders with
a red banner *"Please confirm your business information before proceeding. Please
check that the business registration number is correct and confirm your business
type"* and the business type silently switched to **Business Trading (Sabah)**
with the trading-licence fields now required. In the video the tester retried
Sdn Bhd twice with different BRNs, got the same fallback, and finished on the
trading path. The script drives Non-SSM types only (probe finding stands).

**Review page (2:08):** summary rows (TIN shows `Not provided`), then

- Payment Summary: `Pre-Application Fee: RM 100.00` + `Service Tax 8%: RM 8.00` =
  `Total Amount (Inclusive of 8% Service Tax): RM 108.00`
- Mandatory checkbox "By proceeding with this submission, I hereby:" (clauses a–d,
  plus the MSIC 45102 dealer-licence paragraph)
- Payment Method tiles: `VISA Credit or Debit Card` · `FPX Online Banking
  (Business)` · `FPX Online Banking (Personal)`. Choosing FPX Personal reveals a
  bank grid (Maybank, CIMB, AmBank, Public, RHB, HLB, HSBC, Affin, Bank Rakyat,
  BSN); video picks **Maybank**.
- `Back` / `Submit and Pay` → popup window "Connecting to FPX... Please don't
  close, refresh or press back button on browser" (`sandbox-payment.fiuu.com`).

**FPX simulator (2:20–2:52) · HUMAN for the login only**
- `bank-simulator.fiuu.com/MB2U0227/login` — Fiuu Bank Simulator, Maybank skin,
  username + password. Human types the login (policy). 
- Simulator page after login is script-drivable: Channel `MB2U0227`, Pay To
  `FIUU`, Order ID, Description "Testing for Bank Simulator", `Amount (RM): MYR
  108.00`, a Transaction Authentication Code shown with a copy control, `Enter
  TAC` field, "Please set payment status below" dropdown = **Approved**, `Pay Now`.
- eAuto side shows "Payment successful. This window will close automatically",
  then the dealer lands on **Pre-Application Review** (`/obs/preOnb/summary/<uuid>`):
  header `Dealer Application - P260823/00759`, status **NEW**, Payment Details
  (Payment ID `P260823000794`, `FPX Online Banking (Maybank)`, date-time, status
  **Paid**, `Invoice` download).

Checkpoint after this phase: pre-app reference number + uuid.

## Phase 3 — `approve-preapp` · BO approves the pre-application (2:56–3:24)

- Login `ops_jasons` at cs04 → Onboarding → **UCD Pre-Application Listing**
  (`/obs/admin/preOnb/inquiry`). Filters include Pre-Application No, Company Name,
  Submission Date range, Pre-Application Status, business-type checkboxes, LHDN
  Response Status.
- The new row shows status **New**, LHDN Response Status **Failed**, remarks *"No
  TIN info has been provided"* (expected when TIN was skipped — non-blocking).
  Action `View`.
- Detail (`/obs/admin/preOnb/summary/<uuid>`): full summary + Payment Details,
  `Update Special Remarks`, `Cancel Pre-Application`, and **Reject / Approve**.
- `Approve` → status **APPROVED**, an **Application Link** appears
  (`https://staging.eauto.my/obs/form/...`, with `Copy Link`) and the dealer page
  flips to "Pre-Application Approved — Congratulations! ... complete the
  Application Form using the link sent to <admin email>".
- Script reads the link off this page rather than the mailbox.

## Phase 4 — `appform` · dealer Application Form (3:24–5:24)

Application-link URL pattern: `/obs/form/<sec>?id=<brn>&s=<token>&v=1`.
Header: "eAuto Application Form" + Support Team 03-2779 8899 / apply@eauto.my /
WA 012 200 1324. Step indicator at this stage: **1 Business Information — 2 Upload
Files — 3 Acknowledgement**. Footer "Application Form / Version 1.5".
There is a `Save & Continue Later` on every step.

**Step 1 — Business Information** (pre-filled from the pre-app)
- `Tax Identification No (TIN) *` is REQUIRED here. Any generated value trips the
  red inline warning *"The TIN is invalid. This may affect e-invoice submission.
  Click "Next" to proceed."* — non-blocking by design; press Next again.
- `Sales and Service Tax (SST) No` optional.
- `Showroom Ownership *`: Own Showroom / Shared Showroom / No Showroom.
- Address lines 2/3 optional.
- **Other Motor Vehicle Business Information**: advertise on online platform
  (e.g. Mudah.my) Yes/No · registered with any motor vehicle Auction House Yes/No ·
  member of Motor Vehicle Association: `No / FMC / MMSDA / PEKEMA` (video ticks
  MMSDA + PEKEMA — this choice creates upload rows in step 2 section 6).

**Step 2 — Upload Files** (all pdf/png/jpg/jpeg unless noted, 10MB cap)
1. `SSM Company / Business Profile *` — up to 4 files (docx also allowed)
2. `MyKad / MyPR / Passport Copies of All Directors / Business Owner(s) *` —
   `Number of Directors / Business Owner(s)` dropdown; one name + file row each
3. `Four (4) Showroom Pictures and 20 Seconds Showroom Video (with Signboard) *`
   — Picture 1–4 + Video (mp4, 20MB)
4. `Business Card` — 1 file
5. `Dealer Security Deposit Receipt from the Auction House *`
6. `Current Motor Vehicle Association Membership Receipt *` — one row per
   association ticked in step 1 (MMSDA, PEKEMA)
7. `Company / Business Official Stamp (1. Round Stamp 2. Stamp with Address) *`

**Step 3 — Acknowledgement**
- `Director / Business Owner in Charge` (becomes the eAuto **Main User**): Name,
  MyKad No, Mobile, Email
- `Admin in Charge`: Name, MyKad No, Mobile, Email
- `e-Invoice Person-in-Charge`: checkbox `Same as Director/Business Owner in
  Charge` else Name/Mobile/Email
- Declaration paragraphs → `Submit` → modal **"Success Notification — Your
  application has been successfully submitted. Our team will get back to you soon
  with the next steps!"** → OK.

**The moment that matters for 11982:** submission mints the application
(`NA68001098`) and its **Application Expiry Date = application creation + 90 days,
to the minute**. Video evidence: expiry `2026-11-21 21:01` vs submission timestamp
`2026-08-23 21:03` on the listing — the expiry anchors on the earlier creation
minute (21:01, when the approved pre-app generated the application), not on the
submit click. `record` phase should assert against creation, and a 1–2 minute
skew between submission column and expiry column is CORRECT, not a bug.

## Phase 5 — assign + `submit-approval` (5:24–7:12)

Roles here: **jasons = approver, bochar = assignee.** The video splits this into
two sub-steps under two different logins — jasons hands the record to bochar,
then bochar drives it:

1. **Assign (5:30, ops_jasons — the approver hands over):** UCD Application Listing (`/obs/admin/enquiry`) —
   search `Application No` (accepts `NA68001098 - 202588870167` autofill format or
   the bare number). Row action `Edit` → Application Form
   (`/obs/admin/form/edit/<id>?...`). Right sidebar: `Assignee` dropdown (BO user
   list) → pick `CHARMAIN EA CHIANG chg` → `Save` → green "Success Notification:
   This application form has been updated successfully."
2. **UCD Group + submit (6:36, hubadmin_bochar — the assignee acts):** same edit
   page, now opened by the assignee.
   Sidebar `UCD Group *` dropdown: `Corporate / Association / Authorised Dealer /
   UCD / Motor / Recon` (video picks Association). Header buttons `Revert to UCD` /
   `Save`; sidebar button **`Submit for Approval`**.

Listing states along the way: Application Status `New → Pending`, Assignee/UCD and
Approver/Assignee flags flip `Checked` as each side acts. Remarks column carries
*"TIN verification failed. Kindly provide correct TIN information to eAuto
customer service."* — cosmetic for our purposes.

`src/onboarding.js` note: `setUcdGroupAndSubmit` must cover sub-step 1 too (the
Assignee dropdown + Save) when the assignee differs from the record's default —
in the video the assignment was done explicitly before the assignee ever opened
the record.

## Phase 6 — `approve-app` · BO approver (7:12–7:36)

- As `ops_jasons`, open the application (`Edit`). The form now shows
  **`Re-evaluate`** + `Save` in the header and **`Reject` / `Approve`** in the
  sidebar.
- `Approve` → confirm modal *"Are you sure to approve the application?"* No/**Yes**
  → Application Status **Approved**, `Application Approval Date` stamped, and a
  third tab **Registration Documents** appears on the dealer application header
  (`Pre-Application | Application | Registration Documents`).

## Phase 7 — `regdocs` · dealer uploads registration documents (7:36–8:24)

Dealer side, same application link — step indicator now extends to
**4 Registration Documents** ("Please upload all relevant Registration Documents
to complete the application"). Six sections, each `Up to 2 files ... Max Size:
10MB` with a `View Sample` link:

1. `RHB Offer Letter *`
2. `RHB Direct Debit Application Form *`
3. `RHB LoA e-TukarMilik *`
4. `RHB Bank Statement Cover / RHB Welcome Letter *`
5. `eAuto LoA e-TukarMilik *`
6. `LHDN Company Tax Compliance Certificate *`

Five-clause confirm-and-agree block above `Submit` → green "Success Notification:
The registration documents have been successfully submitted. Our team will get
back to you soon with the next steps!"

## Phase 8 — `verify-regdocs` · BO assignee · **THE 11982 SCREEN** (9:00–9:12)

- As assignee, application `Edit` → **Registration Documents** tab
  (`/obs/admin/form/edit-registration-doc/<uuid>`).
- Body: the six documents with checkboxes and Browse/Delete controls. Header:
  `Revert to UCD` / `Save`.
- **Right sidebar — this is where Extend lives (C4/Q11 settled):**
  - `Application No: NA68001098`
  - `Assignee:` dropdown
  - `Application Status:` **Approved** with the **`Extend`** button beside it
  - `Registration Documents Submission Date: 2026-08-23 09:06PM`
  - **`Verified`** button (teal, full width)
- Click `Verified` → sidebar gains `Registration Documents Verification Date`,
  and after the registration fee is paid it also shows `Payment Document:
  Invoice` and a `Hardcopy Doc` dropdown (`Pending UCD / Pending UCD - Incomplete
  Docs / Pending Assignee`) + `Update`.
- The fixture build STOPS here on the BO side. `Extend` is never clicked by the
  builder — spending the one extension (R1) belongs to `test:extend`.

## Phase 9 — `regfee` · dealer pays RM 990.00 (9:12–10:12) · HUMAN at the login

- Dealer link → step **5 Payment**. Payment Summary:
  `Dermalog Biometric Device Purchase: RM 772.00` + `Registration fee (excluding
  Service Tax): RM 201.85` + `Service Tax 8.0%: RM 16.15` =
  `Total Amount (inclusive of 8.0% Service Tax): RM 990.00`.
  (Declaration restates it as eAuto Registration Fee RM 218.00 inclusive SST +
  one Dermalog device RM 772.00 non-SST; fee includes one software installation;
  no refund after payment.) Footer here says "Application Form / Version 1.0".
- `Submit & Pay` (note: ampersand here, "Submit and Pay" on the pre-app) → same
  method tiles + bank grid; video picks **AmBank** → Fiuu simulator channel
  `AMB80209`, `Amount (RM): MYR 990.00`, `Request TAC` button, TAC entry, status
  **Approved**, `Pay now`.
- Dealer lands on **"Application Payment Success — Thank you! Your payment is
  completed..."** with Payment ID `A260823000130`, Payment Status **PAID**,
  Invoice download.

## Phase 10 — `record` · read the fixture state

Read off `/obs/admin/enquiry` for the Application No:
`Application Submission Date`, `Approved Date`, `Application Expiry Date`
(90-day check — against creation, see phase 4), `Application Status`
(Approved), `Registration Fee` (OK after phase 9), `Hardcopy & Acc Created`
(must NOT be Registered). Print `EXTEND_APP_NO=` for `.env`.

---

## Past the fixture boundary — what the video did next (10:12–12:45), NEVER the builder

Kept here because it is the live proof of R9, with the exact controls if a
teardown/negative-case script ever needs them:

1. Sidebar `Hardcopy Doc` → `Pending Assignee` → `Update`.
2. A **`Create Account`** button appears top-right of the BO Registration
   Documents page → confirm *"Are you sure you want to proceed for company account
   creation?"* → **Create New Company Account**
   (`cs04/view/account/company-obs/new...`): company details (name, reg no, type
   UCD, vehicle type CAR/BIKE, UCD group, TIN, addresses), BoD Reso/LoA + SSM
   profile attachments, Main User Details (name/MyKad/contact/email/**Login ID +
   Password**), directors, decision maker, admin, transaction payment details,
   permission module, device serial rows. Duplicate Login ID pops *"Main User
   Login ID already exists"* on Save — login ids are global, generate per run.
3. Save → **Update Company Account #1109715** (`Update / Activate / Print DO /
   Confirmation Of Registration`) — and the listing flips to Application Status
   **Registered**, Hardcopy Doc **Registered**.
4. **R9 confirmed on camera:** after this, the Registration Documents sidebar no
   longer offers `Extend`. Creating the account destroys the fixture.

## Deltas worth folding back into the code

- `src/preapp.js` hint maps can now be locked to observed labels (everything
  quoted above) — the "unobserved screens" caveat is retired by this video.
- `reviewAndPay`: the declaration checkbox is mandatory before `Submit and Pay`
  enables; FPX opens a POPUP window (`sandbox-payment.fiuu.com`), not a same-tab
  redirect — the builder must grab the popup handle.
- Maybank simulator (`MB2U0227`) shows the TAC on screen with a copy control;
  AmBank (`AMB80209`) wants `Request TAC` clicked first. Both end with the
  status dropdown = Approved + Pay now.
- `submit-approval` needs the explicit Assignee-dropdown sub-step (see phase 5).
- Expiry assertion in `record`/`test:gating`: anchor on application CREATION
  minute; expect expiry ≠ submission + 90d when the two minutes differ.
- Application-number search accepts the `<AppNo> - <BRN>` combined string the
  page itself autofills; plain `NA...` also works.
