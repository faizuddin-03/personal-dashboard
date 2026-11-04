# CIBO staging: map of every module, 28.10.2026

Not a TS run. A read-only walk of every sidebar module of CIBO staging, asked for by Azfar on 28.10.2026 ("cibo you
can explore also see whats up there"). Done by Claude (cr-explore) on 28.10.2026, about 13:00 to 13:30 Malaysia time,
with notes on anything that touches EAINT-12406 (Allianz back on Secarang).

| | |
|---|---|
| Staging | CIBO staging `https://staging.secarang.com/cibo` (login page `/cibo/auth/login`). It shares the back end `/ins-api` with Secarang staging /ia/ |
| Login | `testadmin` ("Test Admin"; password only in `automation/env/.staging.env-local`) |
| Already covered earlier the same day | `../2026-10-28-before-deploy/README.md`: Transaction Management (filters, listing, details for TM / Lonpac / RHB / Allianz, receipts), Payment Management filters, Payment Report and Commission Report filters. This walk does not repeat them; it adds the listings, the other modules and the counts |
| Scripts | `cr/EAINT-12406/03-spec/cibo-map/`: `walk-map.mjs <admin\|customers\|transactions\|reports>` (screenshots and videos), `probe-crm-edit.mjs`, `pass5-rrl.mjs` (Referred Risk Log month by month), and the discovery passes `discover.mjs`, `pass2/3/3b/4.mjs`. Login helper in `../before-walk/cibo-lib.mjs` |
| Read only, proven | Every request the walk sent to `/ins-api` was logged. Apart from the login, the only POSTs were the listings' own `…/page` and `…/summary` searches. `capture-log.txt` says "non-read requests: none" for every group |

Never clicked: Create account, Save update, Save (Macrokiosk), Edit-save, Duplicate, Send Quotation Link / Send
quotation link, Print, Export. The Create New user form was opened, and the "Insurance Company User" role was ticked
on that unsaved form to show the insurer field. The form was then left through the sidebar. On a CRM vehicle card,
Edit was opened and closed with Cancel.

## Personal data: do not commit, do not put on a board as they are

CIBO shows customers' names, IC numbers, phones, emails, addresses and plates, staff names, emails and phones, and agents' IC
numbers and **bank account numbers**. A `.gitignore` here keeps these out of git:

- every `*-PERSONAL-DATA.png` (17 files): `map-02f`, `02g`, `03f`, `04f` (pages 1 to 3), `06d`, `06g`, `06h`, `07c`, `08b`, `09d`,
  `10e`, `10f`, `10h`, `11h`, `12d`
- every video (`video-admin.webm`, `video-customers.webm`, `video-transactions.webm`, `video-reports.webm`,
  `video-crm-edit-and-tooltips.webm`)

Everything else is a crop with no name, IC, phone, email, address, plate or bank number, checked by eye (headers,
filters, dropdowns, Macrokiosk settings, discount code / discount / commission columns, report summary totals,
amount columns, Insurance Company + Remark columns). `capture-log.txt` gives the page for each file; CRM addresses are
written with `<ID No>` in place of the customer's IC.

## Menu (testadmin)

Dashboard · User Account Management · CRM · Transaction Management · Payment Management · Referred Risk Log · Payment
Report · Commission Report · Visitor Management · Agent Management · Discount Code Management · Macrokiosk Template
Management · Logout. Nothing else. The sidebar collapses to icons on wide listings (Transaction Management, Payment
Management, reports).

**Common pattern.** Each listing page has a filter block ("Hide Filters"), a free-text Search box, a [Search] button and
"Clear all". Most listings show **no table until [Search] is clicked**. After Search there is a listing card with **Print**
and **Export** and 20 rows per page (ngb pager "« 1 2 3 4 5 … N »"). Filters are ng-select multi-selects with "Select
All / Clear All". Dates are read-only ngb date pickers with month / year drop-downs. A search is a `POST …/main-page/page`
(read query, page number in the body), and the reports add `POST …/main-page/summary`.

## Per module

### Dashboard: `/cibo/dashboard`
Only "Welcome, Test Admin." No widgets, no counts, **no insurer breakdown** (`map-01`).

### User Account Management: `/cibo/user-account-management`
- **For:** CIBO staff logins.
- **Filters:** Role (Administrator, Ops Support, Finance, Technical Support, Insurance Company User); Account Status (Active, Inactive, Auto-suspended); Date Range Type (Creation Date, Last Update Date); From / Till; Search.
- **Buttons:** Search, Clear all, **Create New** (a link to `/create-new-user`), Print, Export (`map-02a` to `02e`).
- **Columns:** # · Login ID · Name · Contact Details (email over phone) · Role · Account Status · Creation (by + date) · Last Update.
- **Count:** 70 users, 4 pages, search about 3 s.
  - Roles in the rows: Administrator 36, Ops Support 10, Finance 10, Technical Support 7, Insurance Company User 3, **Backofficers 2, "Public users,Administrator" 2**. The last two are not values of the Role filter.
  - Statuses: Active 51, Inactive 18, **New 1**. "New" is not a filter value.
- **Login ID** opens `/user-account-management/user-details/<n>`, which is **straight away an edit form** ("Update user details below."). There is no read-only view.
  - Fields: Login ID (locked), Full name as per ID, Email, +60 Mobile Phone No., Role (radio), Account Status (radio; Auto-suspended greyed).
  - Also shown: Last update by, Created by, and a **Save update** button (`map-02g` personal data, `map-02h` crop). Not saved.
- **Create New** (`/user-account-management/create-new-user`):
  - Fields: Full name as per ID, Email, Mobile Phone No., Role, Login ID, Login Password, Confirm Password, Activate (checkbox). "Create account" stays greyed while the form is empty (`map-02i`).
  - Ticking **Insurance Company User** adds an **Insurance Company** list: **Chubb Insurance Malaysia Berhad, RHB Insurance Berhad, Syarikat Takaful Malaysia Keluarga Berhad**. **No Allianz**, no Lonpac, no Tokio Marine, no Zurich, no Etiqa (`map-02j`; the list was opened as a list box for the screenshot only).

### CRM: `/cibo/crm`
- **For:** "Customer Relationship Management (CRM)". One record per insured (ID No), with that person's vehicles.
- **Filters:** Ownership Type (Company, Private); Latest Coverage Expires From / Till; Search.
- **Buttons:** Print, Export.
- **Columns:** # · Insured (name link over ID) · Contact Details · Vehicle · Ownership Type · Latest Coverage Period (with an (i) icon) · Last Update (`map-06a` to `06c`).
- **Count:** **195 pages** (about 3,900 customers). The search takes about **9 s**, the slowest listing seen today (`map-06e`).
- **Customer Details** (`/cibo/crm/customer-details/i/<ID No>`; the customer's IC is in the address):
  - Top: Full Name as per ID, ID No, Gender, then "VEHICLE & INSURANCE POLICY DETAILS" with a Private / Company badge.
  - One card per vehicle:
    - left: Plate No, Make, Model, Year, Seat No, CC, Variant, Transmission, Latest Policy Purchase (i), Latest Policy Coverage Period (i), and two **Send quotation link** buttons (email, WhatsApp);
    - right: Email, Mobile Phone No, Correspondence Address, Last Updated By;
    - buttons **Edit** and **Duplicate ˅** (`map-06g`).
  - **What a customer record links to:** only its vehicles. **No insurer, no transaction reference, no link to Transaction Management or Payment Management, no policy number.**
  - "Last Updated By" can be an **eAuto UCD login** (`<UCD no>/<login>`), so CRM holds eAuto insurance customers as well as Secarang ones.
  - The first customer has dozens of vehicle cards (test data), and the page is about 30,000 px tall. The page scrolls inside its own container, so a full-page screenshot comes out blank below the header. Use viewport shots.
- **Edit** (opened, then Cancel; `map-06h`): Email, Mobile Phone No., Address Line 1, Address Line 2 (Optional), Address Line 3 (Optional) and Postal Code become editable; City and State are greyed. Buttons Cancel / Save update.
- **Duplicate** was not clicked. Its hidden panel holds per-vehicle "isDuplicate" ticks, Select All / Clear All, Cancel and Save Update (from the page markup).
- The (i) tooltips showed no text on hover.

### Transaction Management: `/cibo/transaction-management`
Covered in `../2026-10-28-before-deploy/README.md`:
- filters and agency groups;
- 17 columns;
- 403 pages × 20 unfiltered;
- details and receipts per insurer.

This walk re-took only the header with Print / Export (`map-08a`).

### Payment Management: `/cibo/payment-management`
- **For:** payments (gateway side).
- **Filters:**
  - Platform (Secarang > Secarang only, Secarang-MK; eAuto);
  - Payment Channel (checkbox tree, values in the before-walk README);
  - Payment Status (**Failed, New, OK, Pending**);
  - From / Till; Search.
- **Buttons:** Print, Export.
- **Listing title:** "Payment Listing" (`map-09a` to `09c`).
- **Columns:** # · Insured · Transaction Ref. No. · Vehicle No · Payment Channel · Payment · Payment Ref ID · RHB Ref ID · Response.
  - The markup also has a **hidden "Payee" column** header (display none).
- **Count:** **224 pages**, search about 8 s.
- No row opens a detail view.
- **No insurer or agency filter or column.**

### Referred Risk Log: `/cibo/referred-risk-log`
- **For:** quotation enquiries an insurer refused or referred (refer-risk), from Secarang and eAuto.
- **Filters:**
  - Platform (Secarang > Secarang only, Secarang-MK; eAuto);
  - From / Till, which **default to the 1st of this month and today** (01-10-2026 to 28-10-2026);
  - Plan Code (the same agency groups as Transaction Management: Bintang Prospek > Chubb, RHB, Takaful Malaysia; Pemaju Eksklusif > Lonpac, TokioMarine, Zurich Takaful; Serba Sentral > Allianz, eTiqa);
  - Search.
- **Buttons:** Print, Export (`map-10a` to `10d`).
- **Window limit:**
  - The window is **at most 30 days**. Picking a From date sets Till to From + 29 days, and the Till calendar greys out every later day (`map-10f2`).
  - "Clear all" does **not** clear the dates.
  - So the log cannot be searched over a long period in one go.
- **Columns:** # · Inquiry (date-time; on eAuto rows `<UCD no>/<login>` above it) · From (platform badge; eAuto rows also show the dealer company) · Reference No · Vehicle No (plate over the owner's IC) · Insurance Company · Remark · **an eighth header with no text and no cell under it**.
- **Rows:** October 2026 has 2 pages (Zurich Takaful, TokioMarine "ENQ077 - Data not found.", Chubb, eAuto TokioMarine "ENQ901 - Connection down / Connection timeout").
- No row opens a detail view.
- **Allianz rows: yes, many.** The scan went month by month, from 01-01-2022 to 01-10-2026, each window being the 1st to the 30th (`pass5-rrl.mjs`):
  - at least **1,873 Allianz rows**, from 30-08-2022 to **09-05-2025 10:56** (the last one), all **From Secarang**;
  - none after May 2025, none from eAuto;
  - months showing exactly 100 rows are lower bounds, because the pager shows only 5 page links and the scan read only those;
  - the 31st of each month was not covered.
- **Allianz remarks** (`map-10g`):
  - most common: "UBBE001R - Referred Lapse Policy" (1,329) and "CM010 - Upgrade To Comprehensive" (249);
  - many start with a literal **"null - "** (e.g. "null - No NCD granted. Claims affecting NCD", "null - Sum Insured amount is below minimum acceptable amount");
  - one "UBBE002 - Policy Date Checking …" remark ends with a broken character (�).
  - Reference No is "-" on all but 8 rows.

### Payment Report: `/cibo/payment-report`
- **Filters:** the filter list is in the before-walk README. New values read today:
  - **State**: Malaysian states in capitals, JOHOR, KEDAH, KELANTAN, MELAKA, NEGERI SEMBILAN, PAHANG …; the full list was not scrolled;
  - **Coverage Type**: Comprehensive, Third Party Fire & Theft (TPFT);
  - **Road Tax**: Included, Exempted;
  - **Discount Code**: Included, Exempted (`map-11a` to `11e`).
- **Run with Insurance Company = Allianz** and no dates. It answered in about **3 s** (the team doc warns of about 2 minutes for broad searches; this narrow one was fast).
  - It shows a **summary block**, "Summary Report for 29.08.2022 - 28.10.2026", with these totals:

    | Total Transaction | Gross Premium | Service Tax | Stamp Duty | Total Premium | Road Tax | Processing/Delivery Fee | Discount | Total Amount | Commission Amount |
    |---|---|---|---|---|---|---|---|---|---|
    | **186** | 309,334.31 | 20,077.37 | 1,860.00 | 331,271.82 | 22,623.10 | 210.00 | 9,569.33 | 344,535.59 | **4,370.20** |

  - It then lists 10 pages (`map-11f`).
- **Columns (24):** # · UCD company / PIC · UCD Name · Recipient Reference · State · Insurance Company · Reference No · System Ref No · Invoice / Receipt No. · Invoice / Receipt Date · Vehicle No · eCertificate No · Payment Ref ID · Payment Mode · Payment To · Gross Premium (RM) · Service Tax (RM) · Stamp Duty (RM) · Total Premium (RM) · Road Tax (RM) · Processing/Delivery Fee (RM) · Discount (RM) (amount over a discount-code badge) · Total Amount (RM) · Commission Amount (RM).
- **What Allianz rows look like:**
  - Insurance Company: "Allianz" over a **"Serba Sentral"** badge;
  - Payment Mode "Fiuu", Payment To "Secarang";
  - UCD company / PIC and State "NA", Recipient Reference "`<plate>`-ALLIANZ" (`map-11g`).

### Commission Report: `/cibo/commission-report`
- **Filters:** Platform (only eAuto and Secarang: no "Secarang only" or "Secarang-MK", per the before-walk); Insurance Company; Insurance Created From / Till; Road Tax (Included, Exempted); Search.
- **Buttons:** Print, Export.
- **Run with Insurance Company = Allianz.** About 3 s, **3 pages**. Summary "Summary Report for 20.02.2023 - 28.10.2026":

  | Total Transaction | Gross | Total Premium | Discount | Total Amount | Commission |
  |---|---|---|---|---|---|
  | **56** | 99,905.35 | 107,643.39 | 9,569.33 | 105,557.46 | **4,370.20** |

  The Commission total is the same as in the Payment Report (`map-12b`).
- **Columns (16):** # · Vehicle No. · Reference No. · Company Name / PIC · Insurance Company (Allianz + Serba Sentral badge) · Insurance Creation Date · e-Certificate No. · Gross (RM) · Service Tax (RM) · Stamp Duty (RM) · Total Premium (RM) · Road Tax (RM) · Processing/Delivery Fee (RM) · Discount (RM) (+ code badge) · Total Amount (RM) · Commission (RM) (`map-12c`).
- Each Allianz row's commission is **Gross × the Commission % of its discount code** in Discount Code Management (see the next section and Q16 below):

  | Code | Discount | Commission |
  |---|---|---|
  | COTEAM | 5% | 5% |
  | YEAY6 | 6% | 4% |
  | YEAY7 | 7% | 3% |
  | YEAY25 | 25% | 10% |
  | SUNRISE10, KYA10, TAJA10, MK10 | 10% | 0% |

- The 20 rows on page 1 all carry a code. The Payment Report rows with no code show commission 0.00, and the totals are 186 rows in the Payment Report against 56 here. Together these suggest the Commission Report lists **only transactions with a discount code** [unconfirmed: pages 2 and 3 were not read row by row].

### Visitor Management: `/cibo/visitor-management`
- **For:** people who left their details on Secarang (visitor leads).
- **Filters:** Acquired On From / Till; Search.
- **Buttons:** Print, Export (`map-07a`, `07b`).
- **Columns:** # · Visitor (name over IC) · Car Details · Postal Code · Contact Details · Acquired On · Current Policy Expiry Date · Last Trigger (Email) · Last Trigger (Whatsapp).
- **Count:** **49 visitors**, 3 pages, acquired 16-2-2023 to 29-4-2025.
- **In all 49 rows, both Last Trigger cells show a "Send Quotation Link" button**, which sends an email or a WhatsApp. Not clicked.
- **Dates** are written `29-4-2025 11:15AM` and `1-8-2025` (no leading zero, 12-hour clock), unlike the `DD-MM-YYYY HH:mm` used on every other page.

### Agent Management: `/cibo/agent-management`
- **For:** sales agents / discount-code owners, with their bank account for commission payout [unconfirmed what the bank is used for].
- **Filters:** Platform (eAuto, Secarang); Entity Type (Individual, Company); From / Till; Bank (AmBank Berhad, AmIslamic Bank, CIMB Bank Berhad, CIMB Islamic Bank Berhad, Hong Leong Bank, Hong Leong Islamic Bank Berhad, Maybank, Maybank Islamic Berhad, Public Bank, Public Islamic Bank Berhad, RHB Bank, RHB Islamic Bank); Search.
- **Buttons:** Print, Export (`map-03a` to `03e`).
- **On arrival** the page alone shows an empty listing, "Ops, no search result found", before Search. After Search there are **22 agents**, 2 pages, created 11-12-2022 to 29-04-2026.
- **Columns:** # · Agent (name, platform badge, I / C entity badge, IC or SSM under it) · Email Address · Bank · Bank Account No. · Created Date.
- **All 22 are platform Secarang** (20 Individual, 2 Company). There is no eAuto agent, although the filter offers eAuto.
- No row opens a detail view, and there is no Create / Edit.
- **No insurer, agency or commission-rate field**; no agent named Allianz or Serba Sentral.

### Discount Code Management: `/cibo/discount-management`
- **Filters:** Platform (eAuto, Secarang); Discount Code Status (Active, Inactive); From / Till; Search.
- **Buttons:** Print, Export.
- **Listing title:** in capitals, "DISCOUNT CODE MANAGEMENT" (other listings say "… Listing") (`map-04a` to `04d`).
- **Columns:** # · Discount Code (+ platform badge) · Discount · Commission · Agent (name over IC / SSM, or "- -") · Creation (SYSTEM or "-" over date) · Discount Code Status.
- **Count:** **50 codes**, 3 pages: 49 Secarang and 1 eAuto. All are ACTIVE except JIMAT68.
- No row opens a detail view, and there is no Create / Edit.
- **What a code holds:** the **only commission setting on any screen**. It is **per discount code**, in "x% off Gross Premium" or "RMx" (`map-04e` pages 1 to 3, crops with no names).
  - On most codes Discount + Commission = 10% (e.g. SCW5 5/5, SY03 3/7, MF0 0/10, all "…10" codes 10/0).
  - Exceptions: YEAY25 25/10, YEAY12 12/6, YEAY5 5/1, YEAY15 15/0, JIMAT68 / SEPTEMBER68 / AUG68 6.8/0, **RJC7 7/0**.
  - Fixed-amount codes WEL10 / WEL20 / WEL35: RM10 / RM20 / RM35 discount, RM0.00 commission.
  - **EAUTOOFF10** (eAuto): 10% discount, commission "-". It is tied to the same agent as the Secarang code SCW5.
- **No insurer or agency on any code**, so a code applies whatever the insurer.

### Macrokiosk Template Management: `/cibo/macrokiosk-template-management`
- **Not a template list.** It is one "Settings" card (`map-05`) with three cron jobs:
  - Cron Job 1, 9:00 AM: "Set A, 7 days before policy expiry";
  - Cron Job 2, 12:00 PM: "Set B, 14 days before policy expiry";
  - Cron Job 3, 9:00 PM: "Set C, 30 days before policy expiry".
- Each job has three sources (eSTM with insurance, eSTM without insurance, Secarang), each with an "Enable" switch: **9 switches, all on today**. A **Save** button follows. Nothing was touched.
- **No template names, no template text, no insurer named anywhere.**

## For EAINT-12406

1. **Commission rate for Allianz / Serba Sentral (Q16):**
   - No CIBO screen holds a commission rate per insurer or per agency: not Agent Management, not Discount Code Management, not User Account Management.
   - The only commission setting is **per discount code**. On the old Allianz rows, Commission (RM) = Gross × that code's Commission %; a transaction with no code earns **RM0.00**.
   - So a new Allianz sale on Secarang without a code would show 0.00 commission in both reports. Whether that is what Finance expects is still Q16 for BA / Finance; nothing on screen says so.
   - What Serba Sentral itself earns from Allianz (insurer-side commission) is not shown anywhere [unconfirmed whether it exists in the back end].
2. **Agency set-up:**
   - "Serba Sentral" is not a record you can open or edit anywhere. It is only a **group label** in the Insurance Company / Plan Code filters (Serba Sentral > Allianz, eTiqa) and a **badge** under "Allianz" in listings and reports.
   - This already works for the old Allianz rows, in Transaction Management, Payment Report and Commission Report.
3. **Allianz data already on staging:**
   - Payment Report: 186 Allianz transactions. Commission Report: 56. Both carry the Serba Sentral badge, Payment Mode Fiuu.
   - Referred Risk Log: at least 1,873 Allianz refer-risk rows up to 09-05-2025, all from Secarang.
   - Before deploying, filter by a date after 28.10.2026 so the old rows do not mix with new ones.
4. **Insurance Company User role:** its insurer list offers only Chubb, RHB and Takaful Malaysia (the Bintang Prospek group). An Allianz insurer-user cannot be created today. Not in the SRD; a question, not a defect.
5. **Dashboard:** no insurer breakdown (no content at all). **CRM:** no insurer on a customer or vehicle. **Macrokiosk:** no insurer named.

## Odd things (questions, not defects; no source says otherwise)

1. User Account Management rows show roles **"Backofficers"** and **"Public users,Administrator"** and status **"New"**. None of these is a Role or Account Status filter value.
2. The user details link opens an **edit form straight away**: one click on a Login ID puts you one button from changing a staff account.
3. Referred Risk Log:
   - the window is capped at **30 days**, and "Clear all" does not reset the dates;
   - an 8th, empty column header has no cells;
   - many remarks start with a literal **"null - "**;
   - one remark ends with a broken character (�).
4. Payment Management has a **hidden "Payee"** column header in the markup.
5. Agent Management:
   - it shows "Ops, no search result found" on arrival, before any search;
   - every agent is Secarang, although the filter offers eAuto.
6. Discount Code Management:
   - **SY03 and SY05 are listed twice**, with identical rows;
   - the Commission column reads "x% off Gross Premium" ("off" is discount wording);
   - the title is in capitals, unlike the other listings;
   - EAUTOOFF10 (eAuto) is tied to the same agent as the Secarang code SCW5.
7. **RJC7 is 7% discount / 0% commission** on screen. The team doc §9 (from SharePoint TS #140 EAINT-9979) says "Commission to sub-agent: RJC7 3%". Either the code changed or the TS row is out of date.
8. Visitor Management:
   - dates are in `d-M-yyyy h:mmAM` form;
   - all 49 rows show "Send Quotation Link" in both trigger columns, so nothing has been sent from here (or the column only ever shows the button) [unconfirmed which].
9. Macrokiosk Template Management:
   - The cron times read 9:00 AM / 12:00 PM / 9:00 PM. The team doc §11 says the staging cron runs every 30 minutes, so the labels may be fixed text [unconfirmed].
   - The page holds on/off switches only, not the template list the team doc §8 describes.
10. Commission Report "Insurance Creation Date" and Payment Report "Invoice / Receipt Date" differ by a few minutes for the same transaction. Example: 29-04-2025 12:06 against 12:13 for the SUNRISE10 row.
11. CRM:
    - one customer holds dozens of vehicles (test data), and the detail page scrolls inside its own box;
    - the (i) tooltips gave no text on hover.

## Could not open, and why

- **Duplicate (CRM), Send Quotation Link (CRM, Visitor Management), Save (Macrokiosk), Save update / Create account
  (users), Print, Export**: they send, save or download. Not clicked (brief).
- **Agent Management and Discount Code Management detail views**: none exist. No row link, and no Create / Edit on the page.
- **Payment Management row detail**: no row link.
- **Referred Risk Log over a long range**: the page allows 30 days at a time. Read month by month instead; the 31st of a
  month is not covered, and months with more than 5 pages were read up to page 5 only.
- **Commission Report pages 2 and 3, Payment Report pages 2 to 10** were not read row by row (summary totals only).
- **CRM tooltips**: no text appeared on hover.

## Files

`capture-log.txt` lists each screenshot with its page (and "non-read requests: none" per group). Screenshots:

| File | Shows | Personal data |
|---|---|---|
| `map-01-dashboard.png` | Dashboard and menu | no |
| `map-02a…02e` | User Account Management filters, Role / Account Status / Date Range Type values, listing header | no |
| `map-02f-…-PERSONAL-DATA.png` | User Account listing | **yes** |
| `map-02g-…-PERSONAL-DATA.png` | User details edit form | **yes** |
| `map-02h-user-details-role-status-and-save-update-button.png` | Lower half of the user form | no |
| `map-02i-create-new-user-form-empty.png`, `map-02j-…-insurer-list.png` | Create New User form; Insurance Company list | no |
| `map-03a…03e` | Agent Management filters, Platform / Entity Type / Bank values, header | no |
| `map-03f-…-PERSONAL-DATA.png` | Agent listing (IC, bank account no.) | **yes** |
| `map-04a…04d` | Discount Code Management filters, values, header | no |
| `map-04e-discount-codes-page1/2/3-…` | Code / Discount / Commission columns, all 50 codes | no |
| `map-04f-…-page1/2/3-PERSONAL-DATA.png` | Full discount listing (agent names, IC) | **yes** |
| `map-05-macrokiosk-template-management-settings.png` | Macrokiosk settings | no |
| `map-06a…06c`, `map-06e-crm-pager.png` | CRM filters, Ownership Type values, header, pager (195 pages) | no |
| `map-06d`, `map-06g`, `map-06h` `-PERSONAL-DATA.png` | CRM listing, Customer Details, vehicle card in Edit | **yes** |
| `map-07a`, `map-07b` | Visitor Management filters, header | no |
| `map-07c-…-PERSONAL-DATA.png` | Visitor listing | **yes** |
| `map-08a-…-header-print-export.png` | Transaction Management filters and header | no |
| `map-08b-…-PERSONAL-DATA.png` | Transaction listing | **yes** |
| `map-09a…09c` | Payment Management filters, Payment Status values, header | no |
| `map-09d-…-PERSONAL-DATA.png` | Payment listing | **yes** |
| `map-10a…10d`, `map-10f2-…-crop.png`, `map-10g-…-insurer-and-remark-columns.png` | Referred Risk Log filters, default dates, Platform / Plan Code values, header, 30-day calendar, Allianz May 2025 insurer + remark | no |
| `map-10e`, `map-10f`, `map-10h` `-PERSONAL-DATA.png` | Referred Risk Log October 2026 rows, calendar over rows, Allianz May 2025 rows | **yes** |
| `map-11a…11g` | Payment Report filters (Allianz), State / Coverage Type / Road Tax / Discount Code values, Allianz summary and header, amount columns | no |
| `map-11h-…-PERSONAL-DATA.png` | Payment Report Allianz rows | **yes** |
| `map-12a…12c` | Commission Report Road Tax values, Allianz summary and header, insurer-to-commission columns | no |
| `map-12d-…-PERSONAL-DATA.png` | Commission Report Allianz rows | **yes** |

Videos (all personal data, git-ignored): `video-admin.webm` (Dashboard, User Account Management, Create New, Agent,
Discount Code, Macrokiosk), `video-customers.webm` (CRM, Visitor), `video-transactions.webm` (Transaction Management,
Payment Management, Referred Risk Log), `video-reports.webm` (Payment Report, Commission Report),
`video-crm-edit-and-tooltips.webm` (CRM Edit then Cancel; Payment Management header).

Removed: `map-06f` (CRM details full page) came out blank below the header; moved to the scratchpad. `map-06g` replaces it.
