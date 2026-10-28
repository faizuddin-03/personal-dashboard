# EAINT-11835 — QA Team test script study (2026-10-27)

## 1. Header

1. **Ticket:** EAINT-11835 "[eAuto-UCD] Upload New User Guideline in UCD Portal".
2. **Portal / module:** UCD portal. The **USER GUIDE** page (top nav `#user-guide-link` → `/<env>/view/ucd/user-guide`, per `knowledge/flow-ucd-shell.md` line 196) and the **User Guide panel on the right side** of each module landing page.
3. **Workbook:** "EAINT-11835 - [eAuto-UCD] Upload New User Guideline in UCD Portal.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 06/07/2026, 9:28:09 am.
4. **Sheets (9):** Progress, STMS, UCD to UCD, eSTM, BMK, Insurance, JomCheck, Others, Regression.
5. **Scenarios:** **49** — "R13 | TOTAL | 49 | 49" (Progress, row 13).
6. **Results:** **49 / 49 Pass**. Every row's "Test Result (P/F)" reads "Pass". Progress Pass Rate cell is "1" for every area (Progress, rows 5-13). Failed and Pending columns are formulas only ("COUNTIF(STMS!G:G,\"FAILED\")"); their computed values are not in the text copy.
7. **Tester:** "Aliah" (QA column, every row). Full name per `knowledge/cr-test-scenario-catalogue.md` line 131: Aliah Maisarah Binti Mohamadiah.
8. **Dates:** none written in the sheet. Workbook modified 06/07/2026. Live in **S31.2-20260708** (`knowledge/flow-platform.md` line 185; `knowledge/releases.md` line 27).

### Sources read

1. `_reference/sharepoint/qa-team-ts/EAINT-11835 - [eAuto-UCD] Upload New User Guideline in UCD Portal.md` — full text copy (cell text only; formatting and images not kept).
2. `_reference/codebases/eauto-qa-azfar/cr/EAINT-11835/LEDGER.md` — another QA's prior-art note (read only).
3. `knowledge/` grep for EAINT-11835: `business-rules-from-test-scenarios.md`, `cr-test-scenario-catalogue.md`, `releases.md`, `production-regression-scope.md`, `flow-ucd-to-ucd.md`, `flow-stms.md`, `flow-platform.md`, `flow-ucd-shell.md`.
4. **Not found:** `_reference/tickets/EAINT-11835/` (no prior files), `_reference/tickets/Studying/EAINT-11835/` (does not exist), `lib/ticketStudies.ts` (no entry for 11835).
5. **Not read:** the SRD and the Jira ticket (no copy in the repo). Requirements below come from the TS only.

## 2. What the ticket changed, as the TS shows it

1. **New PDF user guides** uploaded for STMS, UCD to UCD, eSTM (eSerahan), BMK, Motor Insurance, JomCheck and Permission Settings.
2. Each guide is listed in **two places**: the UCD **User Guide page** and the **right-side User Guide panel** on the module landing page.
3. Each link opens **"a new page displaying the user guideline"** on a URL that **"starts with cdn"**.
4. **Unchanged guides** (eSerahan Add User Procedure, BMK Sample, FAQs (MyJPJ App), Dermalog guides) are checked "as existing".

## 3. Scenarios

Steps across rows continue (TS02 starts at step "4.", TS05 at step "3.") — each sheet is one flow split into rows.

### A. STMS (6) — all Main User

1. **STMS_11835_TS01** — User Guide page lists STMS guides. Expected: "1. STMS for MyKad/MyPR ⏎ 2. STMS for Company".
2. **STMS_11835_TS02** — Open STMS for MyKad/MyPR. Expected: "User Guide Sistem Tukar Milik Sementara(STMS) Individual (MyKad / MyPR)", **23 pages**.
3. **STMS_11835_TS03** — Open STMS for Company. Expected: "User Guide Sistem Tukar Milik Sementara (STMS) Company", **27 pages**.
4. **STMS_11835_TS04** — STMS landing page right panel lists the same 2 links.
5. **STMS_11835_TS05** — Landing page → MyKad/MyPR guide. Same as TS02.
6. **STMS_11835_TS06** — Landing page → Company guide. Same as TS03.

### B. UCD to UCD (6) — all Main User

1. **UCD_11835_TS01** — User Guide page lists "1. UCD to UCD - Standard ⏎ 2. UCD to UCD - Interstate".
2. **UCD_11835_TS02** — Standard guide: "User Guide UCD to UCD Transfer Standard", **25 pages**.
3. **UCD_11835_TS03** — Interstate guide: "User Guide UCD to UCD Transfer Interstate", **35 pages**.
4. **UCD_11835_TS04** — UCD to UCD landing page right panel lists the same 2 links.
5. **UCD_11835_TS05** — Landing page → Standard. Same as TS02.
6. **UCD_11835_TS06** — Landing page → Interstate. Same as TS03.

### C. eSTM / eSerahan (13 ids, 14 rows)

1. **eSTM_11835_TS01** (Main User) — User Guide page lists "1. eSerahan for MyKad/MyPR ⏎ 2. eSerahan for Company ⏎ 3. eSerahan Add User Procedure".
2. **eSTM_11835_TS02** (Main User) — Individual guide: "User Guide eSerahan Tukar Milik (eSTM) Individual (MyKad / MyPR)", **28 pages**.
3. **eSTM_11835_TS03** (Main User) — Company guide: "User Guide eSerahan Tukar Milik (eSTM) Company", **32 pages**.
4. **eSTM_11835_TS04** (Main User) — Add User Procedure "as existing": "How to add user in e-Serahan", **11 pages**.
5. **eSTM_11835_TS05-TS08** (Main User) — eSerahan landing page right panel: same 3 links, same 3 guides.
6. **eSTM_11835_TS09-TS12** ("Sub UCD with NO eSTM Permission") — User Guide page: same 3 links listed, same 3 guides open.
7. **eSTM_11835_TS13** (Sub UCD, no eSTM permission), row 14 — Open eSerahan landing page. Expected: pop-up "Anda belum dibenarkan menggunakan eSerahan. Sila rujuk User Guide (sini) untuk mengetahui cara Main user/Director menambah pengguna e-Serahan."
8. **eSTM_11835_TS13** (same id repeated), row 15 — Click "(sini)". Expected: "eSerahan Add User Procedure guideline as existing", 11 pages.

### D. BMK (8) — all Main User

1. **BMK_11835_TS01** — User Guide page lists "1. BMK Purchase for MyKad/MyPR ⏎ 2. BMK Purchase for Dealer".
2. **BMK_11835_TS02** — "User Guide Butiran Maklumat Kenderaan(BMK) Individual(MyKad/MyPR)", **18 pages**.
3. **BMK_11835_TS03** — "User Guide Butiran Maklumat Kenderaan(BMK) Company", **18 pages**.
4. **BMK_11835_TS04** — BMK landing page lists **4** links: "1. BMK Purchase for MyKad/MyPR ⏎ 2. BMK Purchase for Dealer ⏎ 3. BMK Sample ⏎ 4. FAQs (MyJPJ App)".
5. **BMK_11835_TS05-TS06** — Landing page → the two BMK guides. Same as TS02/TS03.
6. **BMK_11835_TS07** — BMK Sample "as existing": receipt titled "Maklumat Terperinci Kenderaan Dan Insurans".
7. **BMK_11835_TS08** — FAQs (MyJPJ App) "as existing": "SOALAN LAZIM (FREQUENTLY ASKED QUESTIONS) – JPJeID dan/atau Aplikasi MyJPJ", **3 pages**.

### E. Insurance (4) — all Main User

1. **INS_11835_TS01 / TS03** — User Guide page and Insurance landing page list "1. Motor Insurance Purchase".
2. **INS_11835_TS02 / TS04** — "User Guide Motor Insurance", **56 pages**.

### F. JomCheck (4) — all Main User

1. **JomCheck_11835_TS01 / TS03** — User Guide page and JomCheck landing page list "1. JomCheck Report Purchase".
2. **JomCheck_11835_TS02 / TS04** — "User Guide JomCheck Report Vehicle Check Report", **17 pages**.

### G. Others (2) — Main User

1. **Others_11835_TS01** — User Guide page lists "1. Permissions & Settings".
2. **Others_11835_TS02** — "User Guide Permission Settings", **46 pages**.

### H. Regression (6) — Main User, User Guide page

1. **Regress_11835_TS01** — Dermalog section lists PDF, "Video in English", "Video in Chinese".
2. **Regress_11835_TS02** — Dermalog PDF "as existing": "Installation Guide for transitioning from Mozilla Firefox to  Google Chrome", **22 pages**.
3. **Regress_11835_TS03 / TS04** — English / Chinese video: "Video pop-up will be displayed. Ensure the video played is as existing".
4. **Regress_11835_TS05** — FAQ section lists "1. MYJPJ APP".
5. **Regress_11835_TS06** — MYJPJ APP: same FAQ PDF as BMK_TS08, **3 pages**.

## 4. Business rules and system behaviour

1. **Guides open in a new page** — "User will be redirected to a new page displaying the user guideline." (STMS, row 3; same wording on every guide row).
2. **Guides are hosted on CDN** — "The URL of the guideline starts with cdn" (STMS, row 3; every guide row except eSTM row 15).
3. **Landing-page panel position** — "Observe the User Guide displayed on the right side of the page" (STMS, row 5; UCD to UCD row 5; eSTM row 6; BMK row 5; Insurance row 4; JomCheck row 4).
4. **Sub UCD without eSTM permission still sees eSerahan guides** on the User Guide page (eSTM, rows 10-13, User "Sub UCD with NO eSTM Permission", all Pass).
5. **eSTM no-permission pop-up links to the Add User guide** — "Anda belum dibenarkan menggunakan eSerahan. Sila rujuk User Guide (sini) untuk mengetahui cara Main user/Director menambah pengguna e-Serahan." (eSTM, row 14). Clicking "(sini)" shows "eSerahan Add User Procedure guideline as existing" (eSTM, row 15).
6. **Only Main user or Director adds eSerahan users** [unconfirmed] — inferred from the pop-up wording "cara Main user/Director menambah pengguna e-Serahan" (eSTM, row 14).
7. **BMK landing panel has more links than the User Guide page BMK section** — landing: 4 links (BMK, row 5); User Guide page BMK section: 2 links (BMK, row 2). The FAQ PDF sits under "Frequently Asked Question (FAQ)" → "MYJPJ APP" on the User Guide page (Regression, row 6).
8. **Videos play in a pop-up, not a new page** — "Video pop-up will be displayed." (Regression, rows 4-5).
9. **Link label vs PDF title differ** — link "BMK Purchase for Dealer" opens "User Guide Butiran Maklumat Kenderaan(BMK) Company" (BMK, row 4). Link "Permissions & Settings" opens "User Guide Permission Settings" (Others, row 3).
10. **Page counts per guide** (useful as a quick "is it the right PDF" check): STMS Individual 23, STMS Company 27, UCD to UCD Standard 25, Interstate 35, eSTM Individual 28, eSTM Company 32, eSerahan Add User 11, BMK Individual 18, BMK Company 18, Motor Insurance 56, JomCheck 17, Permission Settings 46, MyJPJ FAQ 3, Dermalog PDF 22 (rows cited in §3).

## 5. Test data, environments, accounts, setup

1. **Environment:** not written in the sheet. Azfar's ledger also says "Environment | not recorded in the sheets read" (`LEDGER.md` line 11).
2. **Accounts:** two roles only — "Main User" and "Sub UCD with NO eSTM Permission" (eSTM, row 10). No logins named.
3. **Credentials:** none in the sheet.
4. **Setup:** a sub UCD with eSTM permission removed. How it is set up is not written [unconfirmed: via UCD Settings → permissions].
5. **Test data:** none. No transactions are created.

## 6. Gaps and risks a regression should still cover

1. **Sub-user coverage is eSTM only.** No sub-user check for STMS, UCD to UCD, BMK, Insurance, JomCheck permissions.
2. **New tab vs same tab** not asserted. TS says "new page" only. `knowledge/business-rules-from-test-scenarios.md` line 563 records another ticket where "User Guide link redirects the current tab" [unconfirmed which applies here].
3. **Duplicate id** eSTM_11835_TS13 on rows 14 and 15 — evidence files may overwrite each other.
4. **eSTM row 15 ("sini") has no cdn URL check**, unlike every other guide row.
5. **Copy-paste step numbers:** eSTM_TS04 and eSTM_TS12 both start at step "5." like TS03/TS11; BMK_TS07/TS08 reuse steps "3."/"4." of TS05/TS06. Cosmetic, but confusing when re-run.
6. **AATF and Service Hub user guides** not in scope (also noted in `LEDGER.md` line 25).
7. **Browser:** no browser stated. The Dermalog guide is a Firefox → Chrome guide; after 1 Jan 2027 Chrome-only use should be re-checked (`knowledge/flow-platform.md` line 173).
8. **Guides updated by later tickets** (e.g. UCD to UCD price change to RM35 since 02.10.2026, `knowledge/flow-ucd-to-ucd.md` line 25) may make the 07.2026 PDFs stale; the TS checks only title page and page count.
9. **No broken-link check on production** — CDN links can expire independently of code deploys [unconfirmed].
10. **Pass Rate "1" with Failed/Pending as formulas** — counts were not hand-checked against the rows; text copy shows all 49 rows as "Pass", so they agree.

## 7. Knowledge candidates

1. **Fix citation in `knowledge/flow-stms.md` line 132.** It says the STMS **landing page** links are covered by "STMS_11835_TS01-TS04". Per the TS, the landing page is **TS04-TS06**; TS01-TS03 are the User Guide page (STMS, rows 2-7). Source: workbook sheet STMS, rows 5-7.
2. **Fix citation in `knowledge/flow-ucd-to-ucd.md` line 77.** It cites "UCD_11835_TS01" for the **landing page**. TS01 is the User Guide page; the landing page is **UCD_11835_TS04** ("Navigate to Home > UCD to UCD landing page", UCD to UCD, row 5).
3. **Add to `knowledge/flow-ucd-shell.md` (USER GUIDE page):** section names and links per module, and that each module landing page repeats them on "the right side of the page". Source: all sheets, rows 2 and the landing-page rows in §3.
4. **Add to `knowledge/flow-estm.md`:** Sub UCD with no eSTM permission → eSerahan landing pop-up "Anda belum dibenarkan menggunakan eSerahan. Sila rujuk User Guide (sini) untuk mengetahui cara Main user/Director menambah pengguna e-Serahan."; "(sini)" opens "How to add user in e-Serahan" (11 pages). Source: eSTM, rows 14-15. (Already in `business-rules-from-test-scenarios.md` line 917, not yet in the flow file.)
5. **Add guide title + page-count table** (§4 item 10) to `knowledge/flow-ucd-shell.md` or a new `knowledge/flow-user-guide.md`, as a quick right-PDF check for regression. Source: rows cited in §3, as of workbook 06/07/2026.
6. **Add to `knowledge/flow-bmk*.md` (if present):** BMK landing panel holds 4 links incl. "BMK Sample" (receipt "Maklumat Terperinci Kenderaan Dan Insurans") and "FAQs (MyJPJ App)". Source: BMK, rows 5, 8, 9.
7. **Videos on the User Guide page open as a pop-up** (Dermalog English/Chinese). Source: Regression, rows 4-5.
