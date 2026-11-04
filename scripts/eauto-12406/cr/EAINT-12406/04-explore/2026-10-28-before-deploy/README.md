# EAINT-12406 — BEFORE-deploy captures, 28.10.2026

Not a TS run. A look at today's Secarang staging /ia/ and CIBO staging **before** Dev deploys EAINT-12406
(not deployed yet: Azfar, 28.10.2026). Read only: no quotation, no payment, no export, nothing changed or
cancelled, no personal data typed, Get quotation never clicked. Taken 28.10.2026 about 12:25–12:55 (Malaysia time) by
Claude (cr-explore) for Azfar: CIBO first; Secarang once Azfar gave the site password.

| | |
|---|---|
| Secarang | staging /ia/ (`https://staging.secarang.com/ia/…`), behind the site password page; password from `SECARANG_SITE_PASSWORD` in `automation/env/.staging.env-local` (Azfar, 28.10.2026). Home is `/ia/car-insurance` |
| CIBO | **`https://staging.secarang.com/cibo`** (login page `https://staging.secarang.com/cibo/auth/login`), login testadmin. `/ia/cibo` is **not** CIBO (see "Which CIBO URL") |
| Compared with | SRD v1.1 (26.10.2026), mockups Secarang 20261015 and CIBO 20261006 in `00-input/`; team doc `00-input/secarang-cibo-qa-knowledge-doc.txt` |
| Jira attachments | not re-listed in this pass (no Jira access from this session). The SRD / mockups used are the ones cr-fetch listed on 27.10.2026 |
| Scripts | `cr/EAINT-12406/03-spec/before-walk/walk.mjs` (areas `secarang`, `listing`, `transactions`, `reports`), `insurer-groups.mjs`, `secarang-links-check.mjs`. AFTER run: `WALK_OUT=<new folder> node walk.mjs <area>` for each area, then compare the two `secarang-page-texts.json` (CP_TS8 E6) and the CIBO captures |

## Personal data: do not commit, do not put on a board as they are

These files show customers' (and colleagues') names, IC numbers, phone numbers, emails, addresses and plates.
They stay on this PC. They must **not** be committed and must **not** go on a TS board or Jira as they are
(crop to the insurer box / receipt Insurer block, or blur, first). A `.gitignore` in this folder keeps them out of git.

- `cibo-05-transaction-listing-unfiltered-PERSONAL-DATA.png`
- `cibo-06-transaction-listing-allianz-all-platforms-PERSONAL-DATA.png`
- every `cibo-1?a-…-listing-row-PERSONAL-DATA.png` (6 files)
- every `cibo-1?b-…-transaction-details-PERSONAL-DATA.png` (6 files)
- every `cibo-1?d-…-receipt-PERSONAL-DATA.pdf` and `.png` (4 + 4 files)
- `video-listing.webm` (unfiltered and Allianz listings) and `video-transactions.webm` (every details page)

No name / IC, safe to share in my view (Azfar decides): the `cibo-1?c-…-insurer-box.png` crops (they do show plan,
premium, cover note no. and policy no.), the filter / page screenshots, the `secarang-…` screenshots,
`video-secarang.webm`, `video-reports.webm`, `video-insurer-filter-groups.webm`, the `.json` files and `capture-log.txt`.
The login video shows the Login ID only; the password field is masked. The Secarang captures (`secarang-…`,
`video-secarang*.webm`, `secarang-*.json`, `mockup-…`) hold no personal data: nothing was typed except the site
password, into a masked password field.

## Which CIBO URL is the real one

- `https://staging.secarang.com/ia/cibo` and `/ia/cibo/login` are **not** CIBO: the server answers every path that
  starts with `/ia` with the Secarang /ia/ app (page title "Secarang: Reliable Car Insurance Provider", base `/ia/`),
  which then redirects to the Secarang site password page. The "200" seen earlier is that fallback.
- The real CIBO is **`https://staging.secarang.com/cibo`** (title "CIBO", base `/cibo/`). `/cibo/login` redirects to
  `/cibo/auth/login`. testadmin logged in there and landed on `/cibo/dashboard` ("Welcome, Test Admin.").
- Both the Secarang /ia/ app and CIBO call the same back end `https://staging.secarang.com/ins-api` (read from the
  two apps' public script files), so this CIBO is the one that records /ia/ purchases. Whether /preprod/ uses the
  same back end was not checked (we keep away from /preprod/).
- To fix in the repo (not done here): `cr/EAINT-12406/STATUS.md` Environment row and
  `knowledge/_core/environments.md` "Secarang + CIBO" both say CIBO is `/ia/cibo`.

## Per page: what it shows today, and what SRD v1.1 / the mockup expect after the deploy

### Secarang /ia/ (captured 28.10.2026 about 12:50 Malaysia time, after the site password was given; `video-secarang.webm`)

Insurers on every public page today: **Lonpac, then Tokio Marine**, nothing else. No RHB, Chubb, Zurich, Takaful
Malaysia or Etiqa anywhere, and **no Allianz leftover** on Home, About Us, FAQ, Support, Terms of Use, Privacy Policy
or Refund Policy (text search of every page: `secarang-page-texts.json` → `insurerMentions`). "Takaful" appears only
as the general words "takaful certificates" (Terms of Use §3) and "takaful operators" (Privacy Policy §5).

| Page / capture | Today (before) | After the deploy (source) | Matches the draft / SRD "Existing"? |
|---|---|---|---|
| Site password page `secarang-00` | "Login Page": one Password field (eye icon), Login button. Shown first on every /ia/ address | not in scope | – |
| Home = `/ia/car-insurance` `secarang-01` | On arrival a pop-up "Renew your insurance with Secarang … GrabPay BNPL / SPay BNPL … Renew Now" covers the page; closed with its X | not in scope | – |
| Home form `secarang-02`, `secarang-03` | "Buy your car insurance here"; tabs **Private Car** (Car Plate No., Owner IC No., Postal Code (Car Location)) and **Company Car** (Car Plate No., Company SSM No. with an (i) icon, Postal Code); green "Get quotation" (not clicked); "By continuing, you agree to our Privacy Policy and Terms of Use." **No Car / Motorcycle tab** | not in scope | Draft CP_TS8 step 2 says "Car tab"; there is none |
| Home insurer logos `secarang-04`, `secarang-05` | Section "Great teamwork makes the dream work". Logos left to right: **Lonpac** (`lonpac-logo.png`), **Tokio Marine** (`tokiomarine.png`, with a small "Insurance Partner" caption inside the image). Both images have alt text "Insurance logo" | Lonpac, **Allianz**, Tokio Marine, using the existing Allianz logo file (REQ-001 Example 1a; §2.2.3 #1) | Yes: CP_TS8 E1 and SRD §2.2.2 #1b(i) |
| `/ia/motorcycle-insurance` `secarang-06` | **Does not exist** on /ia/: the address falls back to the site password page | – | Team doc §2 lists it as an entry link; not on /ia/ |
| About Us > Our partnership `secarang-07`, `secarang-08` | "At SeCarang, Serba Sentral Sdn Bhd proudly presents offerings from various leading insurance providers. Additionally, to cater to diverse consumer needs, Serba Sentral Sdn Bhd collaborates with other partners for products from several key insurers, including Lonpac Insurance Bhd and Tokio Marine Insurans (Malaysia) Berhad." | "…Serba Sentral offers Allianz and collaborates with other insurance partners to offer products from Lonpac Insurance Bhd and Tokio Marine Insurans (Malaysia) Berhad."; rest of the page unchanged (REQ-007 Example 1a/1b). Mockup Secarang 20261015 About Us shows the same new sentence (`mockup-secarang-20261015-about-us.png`) | Yes: ends exactly as CP_TS8 E3 / REQ-007 "Existing" |
| FAQ `secarang-09`, `secarang-10` | 20 questions, all opened: Topic 1 General Info (10), Topic 2 Transaction, Payment & Refund (5), Topic 3 Claim & Support (5). "Which insurers can I get instant quotation from?" answers with a **bulleted** list: • Lonpac Insurance Bhd • Tokio Marine Insurans (Malaysia) Berhad | List of three: Lonpac Insurance Bhd, Allianz General Insurance Company (Malaysia) Berhad, Tokio Marine Insurans (Malaysia) Berhad; other FAQs unchanged (REQ-008 Example 1a/1b). Mockup (`mockup-secarang-20261015-faqs.png`) shows it **bulleted**; the SRD writes it numbered | Names and order yes (CP_TS8 E4). Style: today bulleted, like the mockup; SRD "Existing" shows "1. 2." (Q27 answered: bulleted today) |
| Support > Need to contact insurance company? `secarang-11` (closed), `secarang-12`, `secarang-13` (all open) | Two sections, both start closed (+), open with − : **Lonpac Insurance Bhd**: "Road Assistance Hotline (24 Hours) 1300 88 1138" · "Customer Service 03 2262 8666" · "General Line 03 2262 8688 / 03 2723 7888". **Tokio Marine Insurans (Malaysia) Berhad**: "Road Assist Hotline (24 Hours) 1800 88 1301 / 03 2053 5800" · "Customer Service Hotline 1800 88 0812". Two-column bullet layout | New section **Allianz General Insurance Company (Malaysia) Berhad** between Lonpac and Tokio Marine, same format, "24-Hours Helpline 1800 22 5542", then "You can request 24/7 towing and roadside assistance from Allianz by calling the toll-free Allianz Road Rangers Helpline at 1800-22-5542" (REQ-009 a–d, Examples 1–3; mockup `mockup-secarang-20261015-support.png` shows it open, the others closed) | Yes: CP_TS8 E5 / REQ-009 "Existing" (Lonpac and Tokio Marine only) |
| Terms of Use `secarang-14` | 13 sections; §13 Agents is generic ("the agents shall be the individual or entity representing the insurers as stated"). **No list of agents or insurers** | not changed by the SRD (CP_TS9 / Q22 asks) | About Us still says "refer to Terms of Use … to obtain full list of agents and principal insurers"; there is no such list |
| Privacy Policy `secarang-15` | No insurer named | not in scope | – |
| Refund Policy `secarang-16` | Short-period refund table; no insurer named | not in scope | – |
| Home-form links `secarang-17` | "Privacy Policy" and "Terms of Use" under Get quotation are `/ia/privacy-policy`, `/ia/terms-of-use`; they **open in a new tab**, which shows the site password page again (the password is kept per tab) | – | – |

**The /preprod/ link (checked).** The /ia/ site's code has exactly one place that opens `/preprod/`: the
**Privacy Policy link inside the two-month-rule pop-up** (`app-two-month-rule-modal`, the visitor form with name, email,
mobile). On `https://staging.secarang.com` it opens `https://staging.secarang.com/preprod/privacy-policy` in a new tab
instead of `/ia/privacy-policy`. That pop-up only opens after **Get quotation**, so I could not click it without asking
for a quotation; it is confirmed from the code only (`secarang-links-check.json`). The links that can be reached without a
quotation (home form, footer, header) all stay on /ia/. Trap for any run that reaches the pop-up: one click lands on
/preprod/, which we must not touch.

### CIBO

| Page / capture | Today (28.10.2026, before) | After (SRD v1.1 / mockup) |
|---|---|---|
| Login `cibo-01` | Bintang Prospek logo, "Welcome!", Login ID + Password, Login disabled until both are filled | no change in scope |
| Menu `cibo-02` | Dashboard · User Account Management · CRM · Transaction Management · Payment Management · Referred Risk Log · Payment Report · Commission Report · Visitor Management · Agent Management · Discount Code Management · Macrokiosk Template Management · Logout | no change in scope |
| Transaction Management filters `cibo-03`, `cibo-04`, `cibo-04b` | Platform (Secarang, Secarang only, Secarang-MK, eAuto) · Insurance Company, **grouped by agency**: Bintang Prospek (Chubb, RHB, Takaful Malaysia) · Pemaju Eksklusif (Lonpac, TokioMarine, Zurich Takaful) · Serba Sentral (Allianz, eTiqa) · Date Range Type (Transaction Creation Date, Insurance Creation Date) · From / Till · Transaction Status (Cancelled, Failed, Insurance created, Pending approval, Pending payment, Quotation, Quotation expired) · Submission to JPJ Status (Not available, Pending, Rejected, Accepted) · Road Tax · Discount Code · Search · Clear all | Mockup CIBO 20261006 shows the same filters with Insurance Company = Allianz selected: no filter change. Allianz is already a value today |
| Transaction Listing `cibo-05` | Columns: # · Transaction Ref. No. · Transaction Created Date · Insurance Created Date · UCD · UCD Name · Vehicle No · Vehicle Type · Insured · Payment · Payment Mode · Discount Code · Road Tax · Ins. Co. · Transaction Status · JPJ · Remark. 403 pages × 20 unfiltered; newest row 20-10-2026 | Same columns in the mockup; new Allianz rows show "Allianz" over a "Serba Sentral" badge (as old Allianz rows already do, `cibo-06`) |
| Allianz listing `cibo-06`, `cibo-07` | Insurance Company = Allianz: **13 pages**, all platform Secarang, newest BR55004010 (09-05-2025). Allianz + Platform eAuto: "Ops, no search result found". Non-final Allianz (Pending payment / Quotation / Failed / Cancelled / Quotation expired / Pending approval): 3 pages, all 2023–2024 | REQ-010 / REQ-011 say "Allianz transaction" without limiting it to new ones (Q20) |
| Tokio Marine details `cibo-11b`, `cibo-11c` (BR69005852, Secarang, Insurance created, 17-09-2026) | Insurer: "Tokio Marine Insurans (Malaysia) Berhad 198601000381 (149520-U)" — **on the same line as the name**, wrapping to "(149520-U)" on a second line at 1920 px. Buttons e-Certificate, Receipt | REQ-011 "Tokio Marine (current)" shows the number **below** the name; Example 2: other insurers no change. Mockup CIBO 20261006 has no Tokio Marine details view |
| Tokio Marine receipt `cibo-11d` | Insurer block on two lines: "Tokio Marine Insurans (Malaysia) Berhad" / "198601000381 (149520-U)". Agent line "Exclusively by agent Pemaju Eksklusif Sdn Bhd, PIAM ID: 196773-00" | REQ-010 Example 2a: no change |
| Lonpac details `cibo-12b`, `cibo-12c` (BR60006309, Secarang, 20-10-2026) | Insurer: "Lonpac Insurance Berhad" (no company number). Buttons Certificate of Insurance, Policy Schedule, Receipt | REQ-011 Example 2a: no change |
| Lonpac receipt `cibo-12d` | Insurer: "Lonpac Insurance Berhad (307414-T)" on one line | REQ-010 Example 2a: no change (name may change with EAINT-12422, not this CR) |
| RHB details `cibo-13b`, `cibo-13c` (BR55004008, Secarang, 04-05-2025) | Insurer: "RHB Insurance Berhad" (no number). Buttons e-Certificate, Receipt. 43 pages of RHB "Insurance created" exist | REQ-011 Example 2a: no change |
| RHB receipt `cibo-13d` | Insurer: "RHB Insurance Berhad (38000-U)"; agent Bintang Prospek Sdn Bhd, PIAM ID 192668-00 | not named by the SRD (REQ-010 Example 2 names Tokio Marine and Lonpac only) |
| Allianz details, old completed `cibo-14b`, `cibo-14c` (BR55004010, Secarang) | Insurer: "Allianz General Insurance Company (Malaysia) Berhad" (no number). Agency Serba Sentral, Agency No SC12562, PIAM ID 195379-01 | REQ-011 Example 1a: "200601015674 (735426-V)" below the name |
| Allianz receipt, old completed `cibo-14d` | Insurer: "Allianz General Insurance Company (Malaysia) Berhad (735426-V)" — **matches the SRD REQ-010 "Existing" text** | REQ-010 Example 1a: name, then next line "200601015674 (735426-V)" |
| Allianz details, Pending payment `cibo-15b`, `cibo-15c` (BR44003678, 22-04-2024) | Insurer: "Allianz General Insurance Company (Malaysia) Berhad". No buttons (no receipt). Full Allianz add-on list visible (Road Rangers, Motor Enhanced Road Warrior, CART, MPA Plan B …) | REQ-011 (Q20: does it apply to non-final rows) |
| Allianz details, Pending payment with cover note `cibo-16b`, `cibo-16c` (BR3D003430, 27-12-2023) | Insurer: same name, no number. Cover Note VQ732402, Policy No V6872750, JPJ Accepted, status still "Pending payment". No buttons | REQ-011 (Q20) |
| Payment Management `cibo-21`, `cibo-22` | Filters Platform (Secarang, Secarang only, Secarang-MK, eAuto), Payment Channel, Payment Status, From / Till. **No insurer or agency filter** | SRD §2.1.3b: Allianz sales under agency Serba Sentral in payment and commission reports (no screen change specified) |
| Payment Report `cibo-23`, `cibo-24`, `cibo-24b` | Filters Platform, Insurance Company (same three agency groups as above), Insurance Created From / Till, State, Road Tax, Discount Code, Coverage Type. No search run (slow; one-week window rule) | §2.1.3b as above |
| Commission Report `cibo-25`, `cibo-26`, `cibo-26b` | Filters Platform (**only eAuto and Secarang**), Insurance Company (same groups), Insurance Created From / Till, Road Tax. No search run | §2.1.3b as above |

## Odd things (no source yet — questions, not defects)

1. **Tokio Marine company number layout on CIBO Transaction Details**: today it is on the same line as the name and
   only wraps, while SRD REQ-011 shows it "below" the name and the receipt has it on its own line. If Allianz is built
   "same as Tokio Marine", it may come out inline too. This is Q29: answered "number shown, but not below".
2. **Tokio Marine receipt PIAM ID**: receipt says "Pemaju Eksklusif Sdn Bhd, PIAM ID: 196773-00"; the same
   transaction's More Info says Agency PIAM ID **WJ-00144720** (Agency No. 00144720). 196773-00 is the Lonpac
   transaction's Agency PIAM ID. Existing behaviour, outside 12406.
3. **Allianz BR55004010**: Transaction Created Date 09-05-2025 11:13 is after its Insurance Created Date 04-05-2025
   11:15 (receipt Purchase Date 04 MAY 2025 11:13); status "Insurance created" yet Cover Note No and Policy No are "-";
   receipt Payment Method is blank.
4. **Allianz BR3D003430** is "Pending payment" with a cover note, policy number and JPJ Accepted;
   **BR44003678** is "Pending payment" with a Cover Note Issuance Date filled.
5. **Commission Report Platform** lists only eAuto and Secarang; Transaction Management, Payment Management and
   Payment Report also list "Secarang only" and "Secarang-MK".
6. **Lonpac name**: CIBO details "Lonpac Insurance Berhad", receipt "Lonpac Insurance Berhad (307414-T)". The team doc
   says the site name was shortened to "Lonpac Insurance Bhd" (EAINT-12175); CIBO and receipt still say Berhad
   (EAINT-12422 To Do). 12406_RG_TS2 already accepts both.
7. **Lonpac details "Premium After NCD"** shows "-" (NCD 0%) where other insurers show an amount.
8. **CIBO mockup 20261006**: its Allianz Transaction Details show the name only, no company number. It is older than
   SRD v1.1 (26.10), which added REQ-011. The SRD wins.
9. **/ia/ links into /preprod/**: only the Privacy Policy link in the two-month-rule pop-up (after Get quotation) opens
   `https://staging.secarang.com/preprod/privacy-policy`. Not clicked (needs a quotation); from the code only. Every
   link reachable without a quotation stays on /ia/.
10. **Support labels differ per insurer**: Lonpac "Road Assistance Hotline (24 Hours)" / "Customer Service" /
    "General Line"; Tokio Marine "Road Assist Hotline (24 Hours)" / "Customer Service Hotline". Allianz will have a
    third shape ("24-Hours Helpline" + a sentence, REQ-009). The ticket description wanted "Road Assistance Hotline,
    Customer Service" for Allianz; the SRD (later) wins.
11. **About Us points to a list that does not exist**: "Our vision" says the Terms of Use give the "full list of agents
    and principal insurers"; Terms of Use has none (relevant to CP_TS9 / Q22).
12. **FAQ payment answer**: "What are the types of payment options available?" says only "Debit Card / Credit Card &
    Online banking.", while the home pop-up advertises GrabPay and ShopeePay BNPL (EAINT-12107). Outside 12406;
    do not judge it against the mockup (the draft already says so).
13. **Privacy Policy mentions eAuto** ("authorities to whom eAuto is subject", "eAuto reserves the right", "At eAuto, we
    welcome") and gives 1700-816-186; Support says +60 18-288 4889; Terms of Use §6 says +60 (3) 33100063. Outside 12406.
14. **/ia/motorcycle-insurance does not exist** on this staging (falls back to the site password page). Opening `/ia/`
    itself also shows the password page; the real home is `/ia/car-insurance`.
15. The Playwright MCP browser profile on this PC autofills a saved password on the CIBO login page. That is the
    browser, not CIBO (a fresh browser opens with both fields empty).

## Could not reach

- **Choose your insurance** (CP_TS8 step 2 / E2): needs Get quotation with a vehicle and owner, which this walk was told
  not to do. CP_TS8 E2 BEFORE is therefore **not captured**; it needs a quotation (QA's own test data) before the deploy,
  or it is dropped from the BEFORE half.
- **The /preprod/ link in the two-month-rule pop-up**: only opens after Get quotation; checked in the code only.
- **/ia/motorcycle-insurance**: no such page on this staging.
- Allianz on platform eAuto: none exists on staging, so there is nothing to capture.
- Payment Report / Commission Report rows: no search run (pages and filters only, as briefed).

## For a future automation flow

- **Secarang /ia/**: Angular app, base `/ia/`. Routes: `car-insurance`, `about-us`, **`faq`** (not `faqs`), `support`,
  `terms-of-use`, `privacy-policy`, `refund-policy`, `payment`, `account`, `under-maintenance`, `auth`. A route guard
  sends every page to `/ia/auth/login?returnUrl=%2F<page>` until the site password is entered (one password input,
  eye icon, Login disabled until filled). The team doc says the same gate can come back on the Fiuu popup and the
  success page. Back end `https://staging.secarang.com/ins-api`; Fiuu sandbox (`sandbox-payment.fiuu.com`).
  Password: `SECARANG_SITE_PASSWORD` in `automation/env/.staging.env-local`; helper `siteGate(page)` in
  `03-spec/before-walk/cibo-lib.mjs`. The password is kept **per tab**: links that open a new tab (home-form Privacy
  Policy / Terms of Use) show the password page again. `/ia/` alone also shows it; start at `/ia/car-insurance`.
- **Secarang pages**: a promo pop-up opens on Home; close it (X in `ngb-modal-window`) before anything else. Home form
  inputs `formcontrolname` = `plateNo`, `idNo` (Owner IC No.; on the Company Car tab the second field is `companyRoc`, Company SSM No.: probe `03-spec/probes-automation/home-form-controls.mjs`, 28.10.2026), `postalCode`; tabs "Private Car" /
  "Company Car". Insurer logos are `img[src*="insurance-logo"]` (`lonpac-logo.png`, `tokiomarine.png`). FAQ questions
  and Support insurer sections are `.collapsable-header` with `aria-expanded`; click to open. Some sections appear only
  after scrolling (scroll the page before a full-page screenshot).
- **CIBO login**: `https://staging.secarang.com/cibo/auth/login`. Two inputs with no id / name: first = Login ID,
  second = Password; then button "Login". Lands on `/cibo/dashboard`. Opening `/cibo/transaction-management`
  directly with a saved session bounced to the dashboard, so log in per run and **click** the sidebar link
  (`a[href="/cibo/<page>"]`).
- **Sidebar routes**: `/cibo/dashboard`, `user-account-management`, `crm`, `transaction-management`,
  `payment-management`, `referred-risk-log`, `payment-report`, `commission-report`, `visitor-management`,
  `agent-management`, `discount-management`, `macrokiosk-template-management`.
- **Transaction Management**: no table until [Search] is clicked. Filters are ng-select (click, not type):
  `formcontrolname` = `platform`, `insuranceComp`, `dateRange`, `status`, `jpjStatus`, `roadTax`, `discountCode`;
  inputs `fromDate`, `toDate` (date pickers) and `search` (finds a Ref. No.). Options are
  `ng-dropdown-panel .ng-option`; agency headers are `.ng-optgroup` (ticking one ticks all its insurers). The filter
  value is **"TokioMarine"** (one word). Clicking the Ref. No. opens
  `/cibo/transaction-management/transaction-details/<id>` in the same tab.
- **Transaction Details**: insurer text = the value after the "Insurer" label in the right-hand box. Buttons:
  "e-Certificate" + "Receipt" (Tokio Marine, RHB, Allianz), "Certificate of Insurance" + "Policy Schedule" + "Receipt"
  (Lonpac); none on non-final transactions. **Receipt downloads a PDF directly** (`R<receipt no><plate>.pdf`), no
  popup; read it with `pdftotext -layout`.
- **Payment Management** filters: `selectedPlatform`, `selectedBank` (Payment Channel), `selectedPaymentStatus`,
  `fromPaymentDate`, `toPaymentDate`, `search`. **Payment Report**: `platform`, `insuranceComp`, `fromDate`, `toDate`,
  `state`, `roadTax`, `discountCode`, `coverageType`, `search`. **Commission Report**: `platform`, `insuranceComp`,
  `fromDate`, `toDate`, `roadTax`, `search`.

## Files

`capture-log.txt` lists each screenshot with the page address it was taken on (only the **last** `secarang` block
counts; the two earlier ones were the password-page-only runs, superseded and moved out of this folder). Videos:
`video-secarang.webm` (whole Secarang walk), `video-secarang-links-check.webm`, `video-listing.webm`,
`video-transactions.webm`, `video-reports.webm`, `video-insurer-filter-groups.webm`.
`secarang-page-texts.json` holds every Secarang page's text, the logo order, the FAQ / Support open states and the
insurer-name counts per page: diff it with the AFTER run. `secarang-links-check.json`: where the home-form links land
and which link uses /preprod/. `mockup-secarang-20261015-*.png`: the mockup's About Us, FAQs and Support views for
side-by-side comparison.
`cibo-transactions-opened.json` holds the insurer line and buttons read from each opened transaction.
