# EAINT-10168 — QA Team test script study (2026-10-27)

## Sources read

1. **Workbook text copy** `_reference/sharepoint/qa-team-ts/EAINT-10168 - [eAuto-BackOffice] ... Insurance.md` (captured 27/10/2026, 8:27:34 pm). The Read tool could not open this path (brackets in the name). Its content was read via Grep, so the **row numbers (R#) below come from this copy**.
2. **Second text copy** `_reference/inbox/eauto-flows-run/ts-text/EAINT-10168_-_eAuto-BackOffice_To_Create_eAuto_Reconciliation_Summary_Report_for_eAuto_Cor.txt`. Same cell text, no row numbers. Used for the long rows that Grep cut off.
3. **Jira capture** `_reference/tickets/Studying/EAINT-10168/EAINT-10168-jira.md` (27/10/2026, 5:45:58 pm).
4. **Knowledge**: `knowledge/README.md` index, `flow-bo-shell.md` (§3 page table, lines 486-488, 507-520), `business-rules-from-test-scenarios.md` §11, `flow-stms-addons.md` line 360-365, `production-regression-scope.md` lines 934/942.
5. **lib/ticketStudies.ts**: no EAINT-10168 entry.
6. **Not read**: the SRD (v0.1 to v1.1 .docx/.pdf are Jira attachments only, not in the repo). The `.xlsx` itself (formatting, colours, images) was not opened. Azfar's `cr/EAINT-10168/` intake files were not read.

## 1. Header

1. **Ticket**: EAINT-10168 — "🔴[eAuto-BackOffice] To Create eAuto Reconciliation Summary Report for eAuto Core Modules, JomCheck and Insurance". Status **Done**, fix version "S30.9-20260630 🌚 (2026-06-30)". [Jira capture, fields 2 and 4]
2. **Portal / module**: BackOffice > JPJ Reports > **eAuto Reconciliation Summary Listing** (`/<env>/view/jpj/report/consolidated-reconcile/eauto-report.jsp`, per `flow-bo-shell.md` line 274). JPJ Hasil portal touched in regression.
3. **Workbook**: "EAINT-10168 - [eAuto-BackOffice] To Create eAuto Reconciliation Summary Report for eAuto Core Modules, JomCheck and Insurance.xlsx", library "eAuto - CR Test Scenarios", modified 22/07/2026 11:28:35 am.
4. **Sheets (11)**: Progress Tracking, Amount (RM), eAuto < RHB, eAuto = RHB, eAuto > RHB, Special Scenarios, EAINT-11883, EAINT-11887, S&F – Access & Filter, S&F – Listing & Columns, Regression.
5. **Scenario count**: **108 rows** in total.
   1. Tracked by Progress Tracking: **88 CR TS** + **11 regression TS** = 99.
   2. Not in the tracker: **EAINT-11883 sheet (4)** and **EAINT-11887 sheet (5)**.
6. **Results**: every row recorded **PASS / Pass**. Progress Tracking: "TOTAL | 88 | 88" and pass rate "1" (R11). Regression: "TOTAL | 11 | 11" (R17). No Fail, no Pending.
7. **Testers named in the sheet**: Azila, Nabila (reconciliation sheets, 11883, 11887, regression), Aliah (filters, columns, role permission R5).
8. **Dates written in the sheet**: "19/6 - To upload before 10am" (eAuto > RHB, R3 extra cell); "PH - 17/6/2026" (Special Scenarios R10). No other execution dates.

## 2. What the ticket changed, as the TS shows it

1. **New BO page** "eAuto Reconciliation Summary Listing" with two tabs: **Reconciliation Listing** (filters, totals, row listing, Export) and **Summary** (existing summary report behaviour, Download PDF, Upload to JPJ Hasil).
2. **Auto-reconciliation** of eAuto approved transactions against the **RHB bank file** Finance uploads to **Synology**, run at **10am and 12pm**.
3. Covers **13 transaction types**: STMS, APT, eSTM, SSM, Dereg, eDereg Pre-Checking, BMK, TH, eLKM, eVOC, JomCheck, Insurance, plus Wholesale-STMS (shown as STMS).
4. **Mismatch handling**: mismatched rows are listed with **Refund Required**, a Malay **Nota** on the Summary, **no auto-upload** to JPJ Hasil, and a **"Refund Review Required"** email to Finance for RHB-only rows.
5. **Matched dates** (eAuto = RHB) are **auto-uploaded** to JPJ Hasil for JPJ-fee modules and are not listed.
6. **Sub-ticket EAINT-11883**: one RHB file holding several payment dates is reconciled per payment date, and split by month.
7. **Sub-ticket EAINT-11887**: role permissions, including a new **Insurance user** that sees only Insurance rows and no Summary.
8. **Audit trail** entries for Export and Download PDF on this page and the two older Summary Report pages.

## 3. Scenarios

### 3a. eAuto < RHB (RHB has a payment eAuto does not have) — sheet "eAuto < RHB"

Setup on every row: JPJ Final Submission ❌ ❌, RHB Payment ✅ ✅. Listing columns: Approved Amount in eAuto "-", Payment Amount in RHB "XX.XX", **Refund Required "Yes"**.

1. **RECONLS_TS1** STMS (R5) — Kod Hasil "H0272423"; on Summary ✅ with Nota; auto-upload "No"; Finance email sent. PASS.
2. **RECONLS_TS2** APT (R6) — same as TS1, Kod Hasil "H0272423". PASS.
3. **RECONLS_TS3** eSTM (R7) — same as TS1, Kod Hasil "H0272423". PASS.
4. **RECONLS_TS4** SSM (R8) — Kod Hasil "-"; Summary ❌; no Nota, no email. PASS.
5. **RECONLS_TS5** Dereg (R9) — Kod Hasil "-"; Summary ❌. PASS.
6. **RECONLS_TS6** eDereg Pre-Checking (R10) — Kod Hasil "H0272404"; Summary ❌. PASS.
7. **RECONLS_TS7** BMK (R11) — Kod Hasil "H0272404"; Summary ✅, Nota, upload "No", email. PASS.
8. **RECONLS_TS8** TH (R12) — Kod Hasil "H0272404"; as TS7. PASS.
9. **RECONLS_TS9** eLKM (R13) — Kod Hasil "H0171105"; RHB amount "X,XXX.XX"; as TS7. PASS.
10. **RECONLS_TS10** eVOC (R14) — Kod Hasil "-"; Summary ❌. PASS.
11. **RECONLS_TS11** JomCheck (R15) — Kod Hasil "-"; Summary ❌. PASS.
12. **RECONLS_TS12** Insurance (R16) — Kod Hasil "-"; RHB amount "X,XXX.XX"; Summary ❌. PASS.
13. **RECONLS_TS12_WS** Wholesale-STMS (R17) — Transaction Type "STMS", Kod Hasil "H0272423"; Summary ✅ with Nota; email cell blank. Remarks "To get Nick's advise" and "Will display transaction as STMS". PASS.

### 3b. Double payment (refund due to double payment) — sheet "eAuto < RHB"

Setup: JPJ Final Submission 1 ❌ "(REV000001E)", RHB Payment 1 ✅, "Step 6: Click [Reset Payment]", Submission 2 ✅, RHB Payment 2 ✅.

14. **RECONLS_TS13** eSTM (R24) — listed, Refund Required "Yes", Summary ✅ with double-payment Nota, upload "No", Finance email. Kod Hasil cell blank. PASS.
15. **RECONLS_TS14** eVOC (R25) — listed, Kod Hasil "-", Refund Required **"No"**, Summary ❌. PASS.

### 3c. eAuto = RHB (all matched) — sheet "eAuto = RHB"

Setup: JPJ Final Submission ✅, RHB Payment ✅. Expected: Listing "❌", Summary "❌" (Displayed?), Nota blank.

16. **RECONLS_TS15** STMS (R4) — auto-upload "Yes". PASS.
17. **RECONLS_TS16** APT (R5) — auto-upload "Yes". PASS.
18. **RECONLS_TS17** eSTM (R6) — auto-upload "Yes"; defect link EAINT-11823. PASS.
19. **RECONLS_TS18** SSM (R7) — upload blank. PASS.
20. **RECONLS_TS19** Dereg (R8) — upload blank. PASS.
21. **RECONLS_TS20** eDereg Pre-Checking (R9) — upload blank; defect link EAINT-11800. PASS.
22. **RECONLS_TS21** BMK (R10) — auto-upload "Yes". PASS.
23. **RECONLS_TS22** TH (R11) — auto-upload "Yes". PASS.
24. **RECONLS_TS23** eLKM (R12) — auto-upload "Yes". PASS.
25. **RECONLS_TS24** eVOC (R13) — upload blank. PASS.
26. **RECONLS_TS25** JomCheck (R14) — upload blank. PASS.
27. **RECONLS_TS26** Insurance (R15) — upload blank; defect link EAINT-11801. PASS.
28. **RECONLS_TS27** Wholesale-STMS (R16) — auto-upload "Yes". PASS.

### 3d. eAuto > RHB (eAuto approved, no RHB payment) — sheet "eAuto > RHB"

Setup: JPJ Final Submission ✅, RHB Payment ❌. Listing ✅, eAuto amount "XX.XX", RHB amount "-", **Refund Required "No"**. No Nota, no email.

29. **RECONLS_TS27** STMS (R4) — Kod Hasil "H0272423"; Summary ✅; upload "No". PASS. (ID repeats 3c item 28.)
30. **RECONLS_TS28** APT (R5) — Kod Hasil "H0272423"; Summary ✅; upload "No". PASS.
31. **RECONLS_TS29** eSTM (R6) — Kod Hasil "H0272423"; Summary ✅; upload "No". PASS.
32. **RECONLS_TS30** SSM (R7) — Kod Hasil "-"; Summary ❌. PASS.
33. **RECONLS_TS31** Dereg (R8) — Kod Hasil "-"; Summary ❌. PASS.
34. **RECONLS_TS32** eDereg Pre-Checking (R9) — Kod Hasil "H0272404"; Summary ❌. PASS.
35. **RECONLS_TS33** BMK (R10) — Kod Hasil "H0272404"; Summary ✅; upload "No". PASS.
36. **RECONLS_TS34** TH (R11) — Kod Hasil "H0272404"; Summary ✅; upload "No". PASS.
37. **RECONLS_TS35** eLKM (R12) — Kod Hasil "H0171105"; eAuto amount "X,XXX.XX"; Summary ✅; upload "No". PASS.
38. **RECONLS_TS36** eVOC (R13) — Kod Hasil "-"; Summary ❌. PASS.
39. **RECONLS_TS37** JomCheck (R14) — Kod Hasil "-"; Summary ❌. PASS.
40. **RECONLS_TS38** Insurance (R15) — Kod Hasil "-"; eAuto amount "X,XXX.XX"; Summary ❌. PASS.
41. **RECONLS_TS39** Wholesale-STMS (R16) — Type "STMS", Kod Hasil "H0272423"; Summary ✅; upload "No". PASS.

### 3e. Special Scenarios — sheet "Special Scenarios"

42. **RECON_ROLEPERM_TS1** (R5) — Ops, Finance, Insurance users "Able to view and access the module"; Other BO user "Unable to view and access the module". Pass ×4.
43. **RECONSL_SS_TS1** (R10) — weekend / public-holiday payment "will be reconciliated according to its payment date". PASS, "PH - 17/6/2026".
44. **RECONSL_SS_TS2** (R11) — RHB file uploaded after 10am but before 12pm is picked up at 12pm. PASS.

### 3f. EAINT-11883 — multi-date RHB file — sheet "EAINT-11883"

45. **11883_TS1** (R3) — weekend/holiday dates combined in one RHB file are reconciled per payment date. PASS.
46. **11883_TS2** (R4) — a mismatch on Date B does not hold back Dates A and C. PASS.
47. **11883_TS3** (R5) — a date missing from the file shows "No records found" and is not auto-submitted. PASS.
48. **11883_TS4** (R6) — a file crossing month-end is split into monthly folders and reconciled separately, no double count. PASS.

### 3g. EAINT-11887 — role permission — sheet "EAINT-11887"

49. **RECON_ROLEPERM_TS1** (R24) — access including direct URL; blocked for Other BO user. Pass ×3.
50. **RECON_ROLEPERM_TS2** (R25) — Insurance user: "Only "Insurance" transaction type is available/selectable; no other types shown". Pass ×3.
51. **RECON_ROLEPERM_TS3** (R26) — Insurance user: "Summary section is hidden / not displayed". Pass ×3.
52. **RECON_ROLEPERM_TS4** (R27) — Insurance user searches Insurance rows only; others see all types. Pass ×3.
53. **RECON_ROLEPERM_TS5** (R28) — Insurance user sees only this page under JPJ Reports; others see all 8 JPJ Reports items. Pass ×3.

### 3h. S&F – Access & Filter (A&FERSL-TS06 to TS30)

54. **A&FERSL-TS06** (R4) — Summary tab keeps the old Summary Report behaviour (date search, Download PDF, Upload to JPJ Hasil). Pass.
55. **A&FERSL-TS07** (R6) — both dates empty → "Please select both Payment Date (From) and Payment Date (To)." Pass.
56. **A&FERSL-TS08** (R7) — From only → same message. Pass.
57. **A&FERSL-TS09** (R8) — To only → same message. Pass.
58. **A&FERSL-TS10** (R9) — From 07 April 2026 → To "auto-populates to 30 April 2026". Pass.
59. **A&FERSL-TS11** (R10) — From 01 May 2026 → To 31 May 2026. Pass.
60. **A&FERSL-TS12** (R11) — "Future dates are greyed out/disabled and cannot be selected." Pass.
61. **A&FERSL-TS13** (R12) — To earlier than From; current month fills To with today. Pass.
62. **A&FERSL-TS14** (R13) — single-day range. Pass.
63. **A&FERSL-TS15** (R14) — one-week range. Pass.
64. **A&FERSL-TS16** (R15) — one-month range. Pass.
65. **A&FERSL-TS17** (R16) — past month. Pass.
66. **A&FERSL-TS18** (R17) — past year, 01 Jan to 31 Dec 2025. Pass.
67. **A&FERSL-TS19** (R19) — Transaction Type dropdown has exactly 13 options (All + 12 types). Pass.
68. **A&FERSL-TS20** (R20) — "'All' is ticked by default". Pass.
69. **A&FERSL-TS21** (R21) — STMS only. Pass.
70. **A&FERSL-TS22** (R22) — APT + JomCheck. Pass.
71. **A&FERSL-TS23** (R23) — All returns all types. Pass.
72. **A&FERSL-TS24** (R24) — Insurance "(separate data source from RHB)" returns rows. Pass.
73. **A&FERSL-TS25** (R26) — Reset clears dates and sets Type back to All. Pass.
74. **A&FERSL-TS26** (R28) — Export file has the totals table and the listing columns incl. Vehicle No. Pass.
75. **A&FERSL-TS27** (R29) — audit trail log on Export. Pass.
76. **A&FERSL-TS28** (R31) — audit trail log on Download PDF, eAuto Reconciliation Summary Report. Pass.
77. **A&FERSL-TS29** (R32) — same, Summary Report (eAuto Plus). Pass.
78. **A&FERSL-TS30** (R33) — same, Summary Listing. Pass.

### 3i. S&F – Listing & Columns (L&CERSL-TS01 to TS19)

79. **L&CERSL-TS01** (R4) — totals section, read-only fields shown. Pass.
80. **L&CERSL-TS02** (R5) — Total Approved Transaction in eAuto = Approved rows. Pass.
81. **L&CERSL-TS03** (R6) — Total in RHB = RHB file row count. Pass.
82. **L&CERSL-TS04** (R7) — Total Not Found in RHB. Pass.
83. **L&CERSL-TS05** (R8) — Total Not Found in eAuto. Pass.
84. **L&CERSL-TS06** (R9) — amounts "Example: 1,334.89 not 1334.9 or 1334.890." Pass.
85. **L&CERSL-TS07** (R10) — totals recalculate when type filter changes. Pass.
86. **L&CERSL-TS08** (R12) — column order and Kod Hasil per type. Pass.
87. **L&CERSL-TS09** (R13) — Payment Date "Format: DD-MMM-YYYY Example: 01-Apr-2026". Pass.
88. **L&CERSL-TS10** (R14) — APT Kod Hasil H0272423 "(TBC — confirm with BA before executing)". Pass.
89. **L&CERSL-TS11** (R15) — BMK, TH, eDereg Pre-Checking → H0272404. Pass.
90. **L&CERSL-TS12** (R16) — "eLKM Kod Hasil will return H0171105". Pass.
91. **L&CERSL-TS13** (R17) — non-JPJ types: "Kod Hasil column will display " - "". Pass.
92. **L&CERSL-TS14** (R18) — mixed multi-select search shows correct Kod Hasil per row. Pass.
93. **L&CERSL-TS15** (R19) — Transaction Type label per row. Pass.
94. **L&CERSL-TS16** (R20) — amount per type to 2 d.p. (list in §4 item 3). Pass.
95. **L&CERSL-TS17** (R21) — RHB-only row: "Approved Amount in eAuto (RM) displays " - "". Pass.
96. **L&CERSL-TS18** (R22) — Refund Required = Yes when Tx Status ≠ Approved AND JPJ Final Sub = Failed. Pass.
97. **L&CERSL-TS19** (R23) — "Refund Required = No" for approved matched rows. Pass.

### 3j. Regression — sheet "Regression"

98. **JPJRBOREG_TS1** (R3) — Summary Listing: Summary tab vs Listing tab, PDF, View, Delete, Upload to JPJ Hasil. PASS.
99. **JPJRBOREG_TS2** (R4) — Summary Report Reconciliation tab: template download, upload, [Reconcile Now], Perbezaan. PASS.
100. **JPJRBOREG_TS3** (R5) — Summary Report Summary tab: PDF, View, Delete, Upload to JPJ Hasil. PASS.
101. **JPJRBOREG_TS4** (R6) — STMS, APT and eSTM Transaction Listing: filters, Generate Now, Reset, Export Excel. PASS.
102. **JPJRBOREG_TS5** (R7) — Summary Report (eAuto Plus) Reconciliation tab. PASS.
103. **JPJRBOREG_TS6** (R8) — Summary Report (eAuto Plus) Summary tab. PASS.
104. **JPJRBOREG_TS7** (R9) — BMK, HTM and eLKM Transaction Listing. PASS.
105. **JPJHSLREG_TS1** (R13) — JPJ Hasil "Laporan Ringkasan Penyamaan Penyata eAuto". PASS.
106. **JPJHSLREG_TS2** (R14) — JPJ Hasil "Senarai Transaksi STMS, APT dan eSTM eAuto". PASS.
107. **JPJHSLREG_TS3** (R15) — JPJ Hasil "Laporan Ringkasan Penyamaan Penyata BMK, HTM dan eLKM eAuto". PASS.
108. **JPJHSLREG_TS4** (R16) — JPJ Hasil "Senarai Transaksi BMK, HTM dan eLKM eAuto". PASS.

## 4. Business rules and system behaviour the TS reveals

1. **Three fee figures per module.** Header: "Reconciliation ⏎ (eAuto Fee only) | Reconciliation Listing ⏎ (eAuto Fee + Tax 8%) | Reconciliation Summary ⏎ (JPJ Fee)" (Amount (RM), R2). Insurance: "Quotation | Quotation + Tax 8%" (R14). eLKM JPJ fee: "Price in e-Sim" (R11). JomCheck "20 | 21.6" (R13). Wholesale -STMS "20 | 21.6 | 10" (R15).
2. **Listing amounts include 8% tax.** Expected (S&F – Listing & Columns, R20): "STMS - 21.60 APT - 16.20 eSTM - 37.80 SSM - 19.44 Dereg - 37.80 eDereg - 5.40 BMK - 10.80 Transfer History - 10.80 eLKM - 2.97 eVOC - 10.80 JomCheck - 21.60".
3. **Kod Hasil map.** "STMS→ H0272423 • eSTM → H0272423 • APT → H0272423 • BMK, TH (HTM), eDereg Pre-Checking → H0272404 • eLKM → H0171105 • SSM, JomCheck, Insurance, Dereg, eVOC → '–' (non-JPJ, no Kod Hasil)" (S&F – Listing & Columns, R12).
4. **Wholesale-STMS shows as STMS.** "Will display transaction as STMS" (eAuto < RHB, R17).
5. **Refund Required rule.** "Refund Required = Yes when eAuto Core: Tx Status ≠ Approved AND JPJ Final Sub = Failed" (S&F – Listing & Columns, R22). eAuto < RHB rows: "Yes" (R5-R17). eAuto > RHB rows: "No" (R4-R16).
6. **Only JPJ-fee modules reach the Summary and JPJ Hasil.** In the mismatch sheets, Summary "Displayed?" is ✅ only for STMS, APT, eSTM, BMK, TH, eLKM, Wholesale-STMS. It is ❌ for SSM, Dereg, eDereg Pre-Checking, eVOC, JomCheck, Insurance (eAuto < RHB R5-R17; eAuto > RHB R4-R16).
7. **eDereg Pre-Checking has a Kod Hasil but is not on the Summary.** "H0272404" with Summary "❌" (eAuto < RHB R10; eAuto > RHB R9). Matches sub-task EAINT-11800 "JPJ Fee for eDereg Pre-Checking should not be displayed in the listing" [Jira capture, field 9].
8. **Mismatch blocks auto-upload.** Auto-upload "No" on every mismatch row with a Summary entry. On eAuto = RHB rows the JPJ-fee modules show "Yes" (R4-R6, R10-R12, R16).
9. **Matched dates are not listed.** eAuto = RHB rows expect "❌ | ❌" for Listing and Summary "Displayed?" (R4-R16). [unconfirmed] The Summary ❌ here likely means "no mismatch row on the Summary", since regression says "eAuto = RHB (Listing = No, Summary = Yes)" (Regression, R3).
10. **Nota for RHB-only payment** (eAuto < RHB, R5): "[EFT Number – Vehicle No] [Payment Date and time] UCD membuat bayaran dengan [EFT Number] wang telah di tolak tetapi sistem JPJ tidak memberi respons. kenderaan bukan lagi milik UCD.Bayaran balik bagi [EFT Number] akan di tuntut."
11. **Nota for double payment** (eAuto < RHB, R24): "[EFT-No kereta] [Payment Date and Time] UCD membuat bayaran dengan [EFT number] tetapi sistem JPJ tidak memberi respons.UCD membuat satu lagi penghantaran dengan [New EFT Number] pada [New Date Time].Transaksi berjaya.Bayaran balik bagi [old EFT] akan di tuntut."
12. **Finance email** (eAuto < RHB, R5): "- Sender: imonitor@eauto.my - Recipient: finance@eauto.my - Email Subject: Refund Review Required - [Payment Date (DD - Month - YYYY)] - Email Content: Dear Finance Team, Please be informed that the system has detected transaction(s) that exist in RHB but have no matching record in eAuto for [Payment Date]. These transaction(s) may require refund review. Kindly refer to the reconciliation summary for further details. Thank you."
13. **Email only on RHB-only rows for JPJ-fee modules.** Sent for TS1-TS3, TS7-TS9, TS13. Blank for eAuto > RHB rows. [unconfirmed] Wholesale-STMS email cell is blank (R17), so its email behaviour is not recorded.
14. **Double payment, eVOC.** eVOC double payment gives Refund Required **"No"** and no Summary entry (eAuto < RHB, R25), while eSTM gives "Yes" (R24).
15. **Run times.** "At 12pm, system will pick up the RHB transactions uploaded after 10am as there's no reconciliation yet happened at 10am" (Special Scenarios, R11). Steps: "Upload RHB transaction to Synology after 10am but before 12pm" (same row).
16. **Weekend / public holiday.** "Payment made on weekends and/or public holiday will be reconciliated according to its payment date" (Special Scenarios, R10; EAINT-11883, R3).
17. **Per-date isolation.** "Date A and Date C are NOT held back or delayed due to Date B's mismatch" and "Date B is NOT auto-submitted to JPJ Hasil" (EAINT-11883, R4).
18. **Missing date.** "Date C is not reconciliated and displays "No records found" in the Reconciliation Listing" (EAINT-11883, R5).
19. **Month split on Synology.** "Rows for 29.06.2026 - 30.06.2026 → copied into a file placed in recon_rhb_ops/2026/06.26 Rows for 01.07.2026 → copied into a file placed in recon_rhb_ops/2026/07.26" (EAINT-11883, R6).
20. **Date filter.** "Please select both Payment Date (From) and Payment Date (To)." (S&F – Access & Filter, R6-R8). To fills to month end (R9-R10). "For the current/incomplete month, it auto-populates to today's date (e.g. 15 June 2026)." (R12).
21. **Type filter default.** "'All' is ticked by default and individual type checkboxes are unticked." (S&F – Access & Filter, R20).
22. **Insurance data source.** "Insurance type returns results (separate data source from RHB)" (S&F – Access & Filter, R24). Remark: "Insurance uses different logic from eAuto Core" (S&F – Listing & Columns, R19).
23. **Totals block.** Export totals: "Total Approved Transaction in eAuto - Total Number of Transaction in RHB - Total Number of Transactions Not Found in RHB - Total Number of Transactions Not Found in eAuto - Total Approved Amount in eAuto (RM) - Total Approved Amount in RHB (RM)" (S&F – Access & Filter, R28).
24. **Export columns include Vehicle No; grid does not.** Export: "# - Payment Date - Kod Hasil - Transaction Type - Payment Ref No - Vehicle No - Approved Amount in eAuto (RM) - Payment Amount in RHB (RM) - Refund Required" (S&F – Access & Filter, R28). Grid: "# | Payment Date | Kod Hasil | Transaction Type | Payment Ref No | Approved Amount in eAuto (RM) | Payment Amount in RHB (RM) | Refund Required" (S&F – Listing & Columns, R12).
25. **Payment Date meaning.** "Payment Date shows the reconciliation run date (not individual transaction dates)." Remark "Confirmed: column shows reconciled date" (S&F – Listing & Columns, R13).
26. **Insurance user.** Only "Insurance" type, Summary hidden (EAINT-11887, R25-R26). Under JPJ Reports "only eAuto Reconciliation Summary Listing is displayed" (R28).
27. **Full JPJ Reports menu** for permitted users (EAINT-11887, R28): "eAuto Reconciliation Summary Report eAuto STMS, APT and eSTM Transaction Listing eAuto Reconciliation Summary Report (eAuto Plus) eAuto BMK, HTM dan eLKM Transaction Listing eAuto eDereg Pre-Checking Transaction Listing eAuto Reconciliation Summary Listing JPJ Reconciliation Report (HASIL) JPJ eSTM Report (HASIL)".
28. **No permission = no page, even by URL.** "Unable to view and access the module / direct URL access is blocked" (EAINT-11887, R24).
29. **eAuto Plus template date.** "all default date showing 1 June 2024" (Regression, R7).
30. **JPJ Hasil browsers.** "Note: Check every function in the module on Chrome, IE 11 & FireFox" (Regression, R13, R15).

## 5. Test data, environments, accounts, setup

1. **Environment**: "Known dataset in preprod2." (S&F – Listing & Columns, R5) and "Known mismatch data in preprod2." (R7, R8). No staging run recorded in the sheet.
2. **RHB file**: "RHB bank file uploaded to Synology for the test date." and remark "Requires coordination with Finance/Dev for bank file access" (S&F – Listing & Columns, R6).
3. **Failed submission code** used to force a double payment: "❌ ⏎ (REV000001E)" then "Step 6: Click [Reset Payment]" (eAuto < RHB, R24-R25).
4. **Accounts (usernames only, no passwords in the sheet)**:
   1. Ops users: "jasons", "mfared", "nikmuhamad", "mfizni"; plus "eautokelvin (existing)" on EAINT-11887 (Special Scenarios R4; EAINT-11887 R23).
   2. Finance: "eautoaccount". Insurance: "eautoshamini".
   3. New Insurance user: "insurance (hubadmin)" (EAINT-11887, R23).
   4. No-permission roles: "BO Superadmin role (not in the list)", "BO Hub Admin role", "BO Admin role", "BO Probation role" (EAINT-11887, R23).
5. **Dates used**: public holiday 17/6/2026 (Special Scenarios R10); month-end set 29.06.2026, 30.06.2026, 01.07.2026 (EAINT-11883 R6).
6. **Related test data in knowledge**: RHB bank statement sample 25.06.2026 (`knowledge/cr-test-scenario-catalogue.md` line 244).

## 6. Gaps or risks a regression should still cover

1. **Every row passed in preprod2 only.** No staging or production run is recorded in this workbook.
2. **Wholesale-STMS email** cell is blank and the row carries "To get Nick's advise" (eAuto < RHB, R17). The Finance email for Wholesale RHB-only rows is unverified.
3. **eAuto > RHB for non-JPJ modules** gets no email and no Summary entry. [unconfirmed] An unpaid approved SSM/JomCheck/Insurance row is only visible on the Listing.
4. **eVOC double payment = Refund Required "No"** (eAuto < RHB, R25). This looks like a money-loss path; no remark explains it.
5. **Audit trail on Export.** A&FERSL-TS27 (R29) passed. A colleague's repo notes "export should write an audit entry (it does not; EAINT-12419 closed)" (`flow-bo-shell.md` line 518). Recheck before relying on it.
6. **Later CRs change this page.** EAINT-12055 removes matched resubmission pairs from the listing, and EAINT-12407 adds LKM Refund (`flow-bo-shell.md` lines 507-519; `flow-stms-addons.md` line 360). Several 10168 expected results may no longer hold.
7. **Fees are dated.** APT and STMS fees have changed since (`business-rules-from-test-scenarios.md` §11 item 1). Amount (RM) values should not be reused without checking.
8. **Not covered**: pagination numbering (sub-task EAINT-11805), Nota GMT+8 timestamp (EAINT-11814), "System" as Created By (EAINT-11798), Delete / Upload Summary regressions (EAINT-11827, EAINT-11828). These are only in the sub-task titles, not as TS rows.
9. **Sheet inconsistencies** that weaken the evidence:
   1. **Duplicate ID** "RECONLS_TS27" (eAuto = RHB R16 and eAuto > RHB R4).
   2. **Count mismatch**: L&CERSL-TS01 objective "All 7 total fields", expected "Section shows all 6 read-only fields" (R4). L&CERSL-TS08 "All 7 columns" but 8 are listed with # (R12).
   3. **Date format conflict**: listing rows expect "DD-MM-YYYY hh:mm(am/pm)" (reconciliation sheets) and L&CERSL-TS09 expects "DD-MMM-YYYY Example: 01-Apr-2026" (R13).
   4. **Objective vs expected**: L&CERSL-TS10 checks Kod Hasil but expects "Each row shows the correct type" (R14). L&CERSL-TS17 objective "eAuto amount = 0.00", expected " - " (R21). A&FERSL-TS13 objective "Date (To) cannot be earlier than Date (From)" but expected text describes auto-fill only (R12).
   5. **eSTM double payment Kod Hasil** cell is blank (eAuto < RHB, R24); every other eSTM row shows "H0272423".
   6. **RECON_ROLEPERM_TS5** says items are "hidden from the Finance user" in the Insurance-user column (EAINT-11887, R28).
10. **Tracker gaps**: EAINT-11883 and EAINT-11887 sheets (9 rows) are not counted in Progress Tracking.

## Knowledge candidates

1. **Summary/JPJ Hasil scope**: only STMS, APT, eSTM, BMK, TH, eLKM (and Wholesale-STMS) get a Summary entry and JPJ Hasil auto-upload. eDereg Pre-Checking has Kod Hasil H0272404 but no Summary entry. Source: eAuto < RHB R5-R17, eAuto > RHB R4-R16, eAuto = RHB R4-R16. Target: `flow-bo-shell.md` reconciliation notes.
2. **Wholesale-STMS displays as STMS** in reconciliation. Source: "Will display transaction as STMS" (eAuto < RHB, R17).
3. **Finance email text** (sender imonitor@eauto.my, recipient finance@eauto.my, subject "Refund Review Required - [Payment Date (DD - Month - YYYY)]"). Source: eAuto < RHB R5. Target: `business-rules-from-test-scenarios.md` §11.
4. **Two Malay Nota templates** (RHB-only and double payment). Source: eAuto < RHB R5, R24.
5. **Refund Required**: Yes for RHB-only rows, No for eAuto-only rows; rule "Tx Status ≠ Approved AND JPJ Final Sub = Failed". Source: S&F – Listing & Columns R22; eAuto < RHB / eAuto > RHB sheets.
6. **Export has Vehicle No; grid does not.** Source: S&F – Access & Filter R28 vs S&F – Listing & Columns R12. Agrees with the colleague note in `flow-bo-shell.md` line 518.
7. **Synology monthly folder pattern** `recon_rhb_ops/<YYYY>/<MM>.<YY>`. Source: EAINT-11883 R6.
8. **Current-month To date = today.** Source: S&F – Access & Filter R12. Refines `business-rules-from-test-scenarios.md` §11 item 6, which states only the month-end rule.
9. **Citation fix**: `flow-bo-shell.md` line 487 cites "[ts: RECON_ROLEPERM_TS1]" for "Insurance type only; Summary section hidden". In the workbook those are **RECON_ROLEPERM_TS2 and TS3** (EAINT-11887, R25-R26). TS1 covers access only.
10. **Contradiction to flag**: Export audit trail passed in this TS (A&FERSL-TS27, R29), but a colleague's repo says it does not write one (EAINT-12419 closed), per `flow-bo-shell.md` line 518. Needs a live check.
11. **eVOC double payment → Refund Required "No"**. Source: eAuto < RHB R25. [unconfirmed] whether this is intended.
12. **Accounts**: Finance BO user "eautoaccount", Insurance BO user "eautoshamini", new "insurance (hubadmin)" user for the Insurance-only view. Source: Special Scenarios R4; EAINT-11887 R23. Target: a roles/accounts section (usernames only).
13. **No flow doc exists** for the Reconciliation Summary Listing (`flow-bo-shell.md` line 274: "no flow doc yet"). This study could seed `knowledge/flow-bo-reconciliation.md`.
