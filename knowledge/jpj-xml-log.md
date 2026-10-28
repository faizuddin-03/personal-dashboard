# JPJ XML Log — the BO log pages and the `~`-delimited format

eAuto logs every request/response it exchanges with JPJ. QA reads these logs
in the Back-Office to prove which code JPJ (or eSIM, standing in for JPJ)
returned and what eAuto sent. The rows are flat strings split by `~`. The team
decodes them with a shared Excel workbook, the "JPJ XML Log – Code Splitter".

This file covers the log pages as a family and the workbook. The eDereg
pages, with full DOM handles and decode tables, are in
[flow-edereg.md](flow-edereg.md) §46. Field-level decode for other modules is
here only at header level.

## 1. Where the logs are

All under BO (Hub Admin) home → "Settings (Hub Admin)", a separate login from
UCD/AATF accounts `[verified: _reference/codebases/AATF/EAINT-9306-bo-home-menu.html]`:

| Menu text | Path (after `/<segment>`) | Captured? |
|---|---|---|
| JPJ XML Log (APT) | `/view/apt/jpj/log` | no |
| JPJ XML Log (STMS) | `/view/stms/jpj/log` | no |
| JPJ XML Log (ESTM) | `/view/estm/jpj/log` | no |
| JPJ XML Log (Deregistration) | `/view/dereg/jpj/log` | yes, 2026-08-24 |
| JPJ XML Log (eDereg Pre-Checking) | `/view/dereg/precheck/jpj/log/main.do` | yes, 2026-08-24 |
| JPJ XML Log (BMK) | `/view/bmk/jpj/log` | no |
| SSM XML Log | `/view/ssm/xml-log` | no (SSM, not JPJ) |

## 2. Page shape (from the two captured pages)

Both captured pages share one form and one table shape
`[verified: EAINT-9306-bo-jpj-xml-log-dereg.html, EAINT-9306-bo-jpj-xml-log-precheck.html]`:

```
form#search-form
  input#type[type=radio][value=vehicleNo] (checked)  + input#vehicleNo
  input#type[type=radio][value=refNo]                 + input#refNo
  input#to-search[type=submit] "SEARCH Now"
td#result  -> "&nbsp;" before a search; then table, header tr.header, rows tr.odd / tr.even
```

Columns: `#`, Vehicle, Transaction No. (bold link to `<base>/view.do?id=<uuid>`),
[Search By — Pre-Checking log only], Type, Submitted At (`dd-MM-yyyy HH:mm`),
Request Data, Responded At, Response Data. Newest row first.

Rules that apply to the family:
1. **Two radios share `id="type"`.** Select by value:
   `#type[value="vehicleNo"]`, `#type[value="refNo"]`
   `[verified: scripts/eauto-edereg-precheck/pages/JpjXmlLogPage.ts:43-55]`.
2. **Ref search takes the human reference** (`PC68001153`, `D680000566`), not
   the transaction uuid.
3. **Let the page settle before typing.** Typing too early on the
   Pre-Checking log once flipped the page heading to the Dereg one
   `[from Faizuddin, 2026-09-02]`; the page object waits 2 s after load.
4. **Assume nothing about AJAX vs reload until seen.** The neighbouring BO
   precheck listing turned out to be AJAX (flow-edereg.md §45.2); the log
   pages' behaviour is not established `[unconfirmed]`.
5. The Type column names the call: seen values `Enquiry`, `SecondEnquiry`,
   `Submission` (Deregistration) and `PrecheckEnquiry` (eDereg Pre-Checking).
6. Detail pages behind the Transaction No. link have never been captured.
7. Whether the other five logs share this exact form is `[unconfirmed]` —
   capture before automating them.

## 3. The Code Splitter workbook

`_reference/JPJ XML Log - Code Splitter/✂️[QA] JPJ XML LOG - TEXT SPLITTER.xlsx`
(shared by Faizuddin 2026-08-24). It is a reference sheet, not a tool that
runs: each sheet has a title row, a header row of field names in order, a
rule row of `{placeholder}` meanings and allowed values, then pasted sample
rows split into columns, tagged by who added them ("Here onwards - Sze
Choong", "Here onwards - Charmain"). Header notes mark IDD changes ("Added on
latest IDD", "Removed on latest IDD", "Remain on latest IDD", "Not on latest
IDD", "swapped sequence with EFT Reference Number"). Bold field names are
mandatory, unbold optional (cell note "bold = mandatory unbold = optional")
`[verified: workbook read with the repo's xlsx package, 2026-10-15]`.

How it is used: copy a row's Request Data or Response Data from the BO log,
split on `~`, and read each position against the matching sheet's header row.
In code, `scripts/eauto-edereg-precheck/utils/jpjXmlLogDecode.ts` does this for
the eDereg Pre-Checking sheets only.

Sheets (17), with the field order of the ones read in full:

| Sheet | Fields in order (header row 2) |
|---|---|
| 🟦eSTM - JPJ ENQ REQUEST DATA | UCD Code, Representative ID, Representative Category, New Owner ID, New Owner Category, Vehicle Number, Chassis Number, Engine Number, Transaction Flag, Region Code (10 Semenanjung, 11 Langkawi, 20 Sabah, 21 Labuan, 30 Sarawak), LKM Indicator (Y/N), LKM Duration (0/6/12), eVOC Indicator (Y/N) |
| 🟦eSTM - JPJ ENQ RESPONSE DATA | Vehicle Owner ID, Owner Category, Owner Name, Registration Number, Loan Providing Company Name, Ownership Claim Reference No., JSJ, AGENCY, JPJ (0 no blacklist / 1 blacklisted), Condition Code_1..3, Response Code, Usage Code, Body Type, JPJ Revenue Code, Payment Amount, FIS Revenue Code, FIS Amount, LKM Revenue Code, LKM Amount, LKM Effective Date, LKM Expiry Date, Declaration Area, New Owner Name |
| 🟦eSTM - JPJ SUBMISSION REQUEST | Transaction Code (`VEL04514`), Vehicle Owner ID, Owner Category, Registration Number, New Owner ID, New Owner Name, New Owner Category, UCD Code, Address 1–3, Postcode, District, State, Payment Date, EFT No, AG Code, Revenue Code THM, Amount THM, Revenue Code FIS, Amount FIS, LKM Indicator, LKM EFT No., LKM AG Code, LKM Revenue Code, LKM Amount, LKM Effective Date, LKM Expiry Date, eVOC Indicator, LKM Receipt No, Owner Email, Representative ID No (Company), Representative ID No. (UCD), Company No, Email1, Email2 |
| 🟦eSTM - JPJ SUBMISSION RESPONS | Registration Number, Response Code, UCD Code, Transaction Code (VEL04514), Refund Amount, LKM Security No. (marked "Not on latest IDD") |
| 🟥Yet to Deploy BMK | three blocks in one sheet: Enquiry Request (Registration Number, Owner ID, Owner ID Category); Enquiry Response (Response Code, Owner ID No, Owner ID Category 0 PR / 1 Malaysian / 4 Company, Vehicle Registration Number, JPJ Revenue Code `2910001`, Transaction Amount `20.00`, Email — only for category 0/1); Submission Request (Vehicle Registration Number, Owner ID, Owner ID Category, Owner Email, EFT Date Time, EFT Reference Number, Receipt No, AG Code `72404`, JPJ Revenue Code `2910001`, Payment Mode `E`, EFT Amount `20.00`, Representative ID No (Company), Representative ID No. (UCD), Company No, Email1, Email2 `receipt@eauto.my`); Submission Response (Response Code, Owner ID No, Owner Category, Vehicle Registration Number, JPJ Receipt Number) |
| 🟩STMS  TH - JPJ ENQ REQUEST DA | Vehicle Owner ID, Owner Category, Registration Number, Chassis Number, Engine Number, UCD Code, Company Registration Number, Transaction Flag (0 used existing LKM / 1 cancellation of LKM) |
| 🟩STMS  TH - JPJ ENQ RESPONSE D | Vehicle Owner ID, Owner Category, Registration Number, Loan Providing Company Name, Ownership Claim Reference No., JSJ, AGENCY, JPJ, Condition Code, Response Code, Usage Code (e.g. AA/AB), Body Type (MKR car, MSL bike), Refund Amount |
| LKM REFUND ENQUIRY - JPJ REQUES | Regn No, Txn Date (`YYYY-MM-DD`, refund application date), ID No |
| LKM REFUND - JPJ RESPONSE DATA | Resp Code, Registration Number, Txn Date, ID No, Seq No, Receipt No, Refund Amount, PTJ Branch, Refund Status Desc (NW Batal LKM, AC Dalam Proses, CU Selesai, RB Tolak, WC Dalam Proses), Remark |
| 🟩TH - JPJ SUBMISSION REQUEST D | Registration Number, Owner ID, Owner ID Category, Engine No, Chasis No., EFT Date Time (merged date/time "on latest IDD"), Receipt No ("Added on latest IDD and swap sequence with EFT Reference Number"), EFT Reference Number (`{rhb_payment_id}`), AG Code `72404`, JPJ Revenue Code `2910030`, Payment Mode `E`, EFT Amount `10.00`, Company No, Email1 (UCD main director), Email2 `receipt@eauto.my` |
| 🟩TH - JPJ SUBMISSION RESPONSE | Response Code, Owner ID No, Owner ID Category, Registration Number, No of Transaction (within 3 months), Last Transaction Date, Receipt No (JPJ Receipt No) |
| 🟩STMS - JPJ SUBMISSION REQUEST | Transaction Code (`VEL04007` / `VEL04510`), Vehicle Owner ID, Owner Category, Registration Number, UCD Business Registration No., UCD Name, UCD Code, Address 1–3, Postcode, District, State, EFT Date Time, EFT Reference Number, AG Code, JPJ Revenue Code, EFT Amount, Email1, Email2, *Refund Ind, PTJ Branch, Refund Email, Refund Email 2 (`*` = conditional) |
| 🟩STMS - JPJ SUBMISSION RESPONS | not read in this pass |
|  🟧eDEREG PRE-CHECKING - JPJ EN (request) | Registration Number, EFT Date Time, Receipt No, EFT Reference Number, AG Code `72404`, JPJ Revenue Code `2910002`, Payment Mode `E`, EFT Amount (JPJ fee, `5.00`), SSM No / Company No, Company email, Email cc — full decode in flow-edereg.md §46.3 |
| 🟧eDEREG PRE-CHECKING - JPJ ENQ (response) | "11 FIELDS": Response Code, Vehicle Record, Vehicle Status, Verified Status, Usage Code, Blacklist (JPJ), Blacklist (JSJ), Blacklist (Agency), Claim Ownership, Vehicle in Investigation, Vehicle Condition (each Y / N / NA); plus a separate "3 FIELDS" group: Response Code, Registration Number, JPJ System Code |
| APT - EXPIRY NOTIFICATION REQUE / RESPO | not read in this pass |

Constants that repeat across sheets: AG Code `72404`; Payment Mode `E`
(EFT); JPJ Revenue Code `2910001` (eSTM, BMK), `2910002` (eDereg
Pre-Checking), `2910030` (TH); the `receipt@eauto.my` copy address. The
"swapped sequence" note on Receipt No vs EFT Reference Number appears on both
the TH submission and eDereg Pre-Checking request sheets.

## 4. Traps

1. **The sheet's placeholder notes and the live order can disagree.** On the
   eDereg Pre-Checking request, the `DPC…` value sits where the sheet's
   Receipt No column is, though the sheet describes Receipt No as
   `{yymmdd}{0807}{seq}`. Positions match the decoder; the field NAMES may be
   swapped. See flow-edereg.md §46.3 `[unconfirmed]`.
2. **Live rows can carry extra trailing fields.** Every eDereg Pre-Checking
   response has a 12th value (`yyyyMMdd` + 8 digits) not in the sheet's
   11-field group `[verified: EAINT-9306-bo-jpj-xml-log-precheck.html]`.
3. **Live sample values can differ from the sheet's examples** — e.g. Email cc
   is `systemtest@eauto.my` on test data, not `receipt@eauto.my`.
4. **No sheet exists for the Deregistration log** — its fields are
   unconfirmed (flow-edereg.md §46.2).
5. Sample rows include real-looking IDs and emails; treat the workbook as
   internal QA material.
