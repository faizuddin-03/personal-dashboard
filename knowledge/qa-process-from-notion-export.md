# QA process facts from the QA Team Notion export

Durable process facts from the QA Team's Notion space, taken from the export placed
in the QA Team SharePoint library. Read it when you need to know how the team
creates accounts, picks test emails, runs regression or handles SIT.

## How to read this

1. **Source and tag.** The export lives in SharePoint
   `Shared Documents/General/Notion - QA Team/`. Facts carry
   `[from Notion export, <page>]`, where `<page>` is the page-snapshot PDF under
   `Notion - Original Page Snapshots/` (or the Excel conversion under `Excel Conversion/`).
   Everything was read on 2026-10-16.
2. **What the export is.** "Notion export generated | 12 Oct 2026, 11:24–11:32
   (UTC+8)"; converted to Excel the same day. The page header says the Notion URL
   "stops working when Notion is retired". `[from Notion export, Excel Conversion/QA Home - Team Members & Onboarding QA.xlsx, sheet About]`
   It was uploaded by May Chin on 2026-10-12 (not 2026-10-15). `[from SharePoint library listing 2026-10-16]`
3. **What was read.** The Markdown pages sit inside `Notion - QA Team.zip`
   (3.0 GB, mostly training videos), which was too large to download through the
   browser. The same pages exist as PDF snapshots plus a `Snapshot index.csv`
   mapping each PDF to its `.md` path in the zip. 46 files were read: every QA Home
   page about eAuto/Secarang/CIBO, all Master Checklist pages, QA's Backlog, the
   e-Auto and eAuto Wholesale automation project pages, Getting Started, and 7 Excel
   conversions. Not read: MyInspector, TMIM FWI and UAT Test Script pages (other
   projects); the e-Auto automation sub-pages (Huddle 115, Tasks 143, Script Updates
   65, outdated regression lists 246 — meeting and task logs, not rules).
4. **Credentials.** Several pages list shared test passwords. They are deliberately not
   copied here; ask the QA lead or use the team's credential sheet.
5. Treat these as `[from QA team]`-grade: process as written in Notion, possibly older
   than current practice. Page edit dates are in `Snapshot index.csv`.

---

## 1. Team, rituals, onboarding

1. eAuto project QA team (as exported): May Chin (QA Lead), Charmain and Azila
   (Senior QA Engineer), Hui Xin, Amirul Azfar, Faizuddin (QA Engineer). The live page
   was edited after the export and has 9 people with updated roles.
   `[from Notion export, QA Home.pdf]` `[from Notion export, Excel Conversion/QA Home - Team Members & Onboarding QA.xlsx, sheet About]`
2. eAuto Secarang Huddle: "Every Monday & Wednesday Time: 10:15AM - 10:45AM Host: QA
   Participants: All members in eAuto Secarang Project". `[from Notion export, QA Home/eAuto Secarang Huddle.pdf]`
3. QA weekly sync for eAuto Secarang on Fridays, 3–4 PM (the table marks the weekly plan
   "[WIP, TBC]"); the Thursday sync is for MyInspector. The written agenda (sprint
   tickets, test plan and scenarios, story points, ETA, testing progress, regression and
   production deployment checklists updated for the sprint) is listed under the
   MyInspector row; the eAuto row adds no agenda of its own. `[from Notion export, QA Home.pdf]`
4. Onboarding checklist items that matter for eAuto: invite to the QA Team SharePoint
   folder for Test Scenarios and Test Evidence; add to the project Teams chats; grant
   eAuto & Secarang Notion access; senior QA briefs the QA process (eAuto Secarang: May
   Chin); share the test environment URL page; invite to the project's JIRA; invite to
   the Mailtrap inbox; huddle calendar invite; onboarding exercise sheet worked through
   while watching the walkthrough videos. `[from Notion export, QA Home.pdf]`
5. Leave: inform the PL first, then the QA lead, then apply in ESS and update the "QA
   Planned Leave" Google Calendar; 3 days or more must be raised at least 2 weeks in
   advance. `[from Notion export, QA Home.pdf]`
   **Open conflict on the notice period:** Teams says 1 month, not 2 weeks:
   "at least 1 month in advance" `[from Teams ModeFair QA Automation Engineer
   Team, 2026-04-15 12:46, Kasturi]`. The Teams message is newer, but neither
   source says it replaces the other. `[unconfirmed]` — confirm with the QA lead
   before relying on either.

## 2. Test environments and accounts

1. Everyone uses their own login per environment; passwords are not shared on the page.
   `[from Notion export, QA Home/eAuto Secarang Test Environment URL & Account Creation.pdf]`
2. Environment families on that page: Beta (`beta.eauto.my/<branch>`), Staging
   (`staging.eauto.my/<branch>`, with `staging/eauto` documented as the latest code base
   as per Prod, "as reference for current Prod"), Production (`www.eauto.my`). Bintang
   Prospek insurance URLs sit beside each eAuto URL. Secarang staging has one site per
   insurer (RHB, Lonpac, Chubb, Allianz, Tokio Marine) plus a main all-insurer site and a
   preprod site; Takaful redirects to the main site. CIBO staging is linked to eAuto
   insurance and to all Secarang staging sites. `[same page]`
3. E-Simulator: "remember to connect to VPN first". `[same page]`
4. **Creating a test UCD** (BO super admin): Account Management > Manage Company Accounts >
   [Create New]; "Director Name & MyKad No. must be tally with real IC"; tick "RHB Account
   Number" and enter any number; enter RHB Dealer ID; Group = C4; tick "Pay on behalf";
   [Save] then [Activate]; log in as the director. `[same page]`
5. **Creating a BO user:** Manage Backoffice User Accounts > [Create New], Role =
   HubAdmin, tick Activate, [Save]. `[same page]`
6. **Creating an AATF company:** Manage AATF/PBT Account > [Create New]; same real-IC
   and RHB rules as UCD; [Save] and [Activate]. `[same page]`
7. JPJ Deregistration and JPJ Hasil test logins are shared accounts. `[same page]`
8. **Production accounts** (for QAs who support night deployments): MJ must get approval
   first and then joins a call; on Firefox the QA logs in with MJ's UCD account, Settings >
   Manage Users > [Add New User Account], Company = UCD TEST, User Type = Administrator,
   modefair email, tick Active, thumbprint; the QA then logs in and thumbprints on first
   login. AATF: the QA who is Main AATF user in Prod creates a Sub AATF user and tells MJ.
   BO: MJ creates and shares the login. `[from Notion export, QA Home/Production Account Creation.pdf]`
9. **Password resets:** Dev patches eAuto and CIBO directly in every environment; Secarang
   needs a deployment in beta/staging. After a reset patch the QA checks that the
   affected UCD/AATF companies are INACTIVE and cannot log in, and updates the shared
   credential sheet. `[from Notion export, QA Home/Password Reset.pdf]`

## 3. Test data rules

1. **Emails for testing — eAuto** `[from Notion export, QA Home/Email for Testing.pdf]`:
   1. "DO NOT use @yopmail.com or any other disposable email".
   2. When staging is connected to the e-simulator, @modefair.com is fine "EXCEPT for
      Deregistration because email will be sent from JPJ upon payment successful, so Dereg
      CANNOT use modefair email".
   3. When staging is connected to JPJ Staging (e.g. SIT) or RHB Staging, "DO NOT use
      @modefair.com".
   4. Received in Mailtrap: BMK email, eVOC email, JomCheck OTP / WhatsApp.
   5. Received at the address entered: Dereg (final submission success → JPJ sends the
      email and COD), eAuto Insurance (Takaful, TPFT, Chubb, Tokio Marine).
   6. Secarang and CIBO: use @modefair.com.
2. "Please DO NOT upload any document from MyInspector Project into ANY OTHER PROJECTS
   like eAuto / Secarang for testing purpose, and vice versa." `[from Notion export, QA Home/Document upload for Testing Purpose.pdf]`
3. Register work tools with @modefair.com; "@modefair.onmicrosoft.com - DON'T use this for
   testing". `[from Notion export, QA Home/Software required for eAuto Secarang Project.pdf]`

## 4. Browsers and devices

1. "eAuto - Web Browser Testing Priority — UCD / AATF: 1. Firefox; BO / JPJ: 1. Chrome 2.
   Firefox". `[from Notion export, QA Home/eAuto - Web Browser Testing Priority.pdf]`
   Superseded from 2027: EAINT-12180 ends Firefox support on 31 December 2026 (see
   [business-rules-from-test-scenarios.md](business-rules-from-test-scenarios.md) §7.8).
2. Manual QA machines need Firefox v36, Websocket, MyBioID Verifier and FortiClient VPN,
   installed by IT. `[from Notion export, QA Home/Software required for eAuto Secarang Project.pdf]`
3. Each QA holds a Dermalog thumbprint device; "Runtime License purpose is required to do
   thumbprint in eAuto App". Devices are swapped and returned on a QA's last day.
   `[from Notion export, QA Home/Dermalog Thumbprint Device.pdf]`

## 5. Regression and checklists

1. **Before a production deployment (staging):** Staging Regression Checklist, Search &
   Filter Functional Regression Checklist, JPJ & RHB Error Code checklist, Load Testing
   (if required). **After deployment (production):** Production Regression Checklist,
   Search & Filter Functional Regression Checklist, Load Testing TS (if required).
   `[from Notion export, QA Home/Master Checklists & Test Case.pdf]`
2. "Master Checklist & Test Cases (Must always keep this updated)": Master Regression
   Checklist (Staging/Beta), eAuto Load Testing, Search & Filter Functional, JPJ & RHB Error
   Codes, eAuto Deployment Checklist (Y2023 & 2024), Master Test Case – STMS, Master Test
   Case – Backoffice, Secarang & CIBO Staging/Preprod. All are Google Sheets. `[same page]`
3. Notes on how each is run `[same page]`:
   1. Load testing: manual load test in staging and prod uses the same checklist; the
      automation team runs the JMeter script in staging and prod.
   2. Search & Filter: staging regressed manually "as of now, to be replaced by automation
      script"; prod "manually regress selectively".
   3. JPJ & RHB error codes: staging "Selectively pick the error code to test during
      regression E2E testing"; prod "Can only test with random carplate as we don't have a
      list of vehicle no. prefix that hit certain error code".
   4. Deployment checklist: "Use existing regression checklist for Production for now".
4. Regression runs are named by environment and date, e.g. "Regression Checklist |
   Staging/Plus | 20240909 (eVOC Deployment)", "Staging/Jupiter | 202409xx (Java 8 Server
   Upgrade)". `[same page]`
5. Other QA documents listed: eAuto Core System Validation, AATF System Validation, "JPJ
   Enquiry & RHB Payment Steps" (detailed expected results per step, listing and details
   page after JPJ enquiry / RHB payment / JPJ submission), Housekeeping Support Checklist
   (STMS & eSTM housekeeping in staging and production), SIT test scenarios for BMK, TH,
   eLKM, eVOC, and Secarang/CIBO staging and production regression checklists.
   `[from Notion export, QA Home/eAuto Secarang Documentations.pdf]`
6. Test plans and scenarios per module are drawn on Miro boards (Login & Homepage, STMS +
   TH, eSTM + eLKM + eVOC, APT, UCD to UCD, Dereg, JomCheck, BMK, Insurance, BackOffice, JPJ
   Hasil, Secarang/CIBO, LKM Refund, server/MySQL upgrade, digital onboarding, SSM for STMS
   and eSTM, mobile app), each with a QA PIC. `[from Notion export, QA Home/eAuto Secarang Test Plan & Scenarios.pdf]`

## 6. SIT with JPJ

"If the enhancement involves changes from JPJ side (eg: BMK, TH, eLKM), then we will need
to have SIT Testing in staging env. 1. JPJ to provide web service & SIT Test Scenarios 2.
Dev will attempt to connect to their JPJ Staging first 3. Once able to connect
successfully, QA team can start to do SIT Testing (provided if JPJ provided SIT Test
Scenario & Test Data) 4. When SIT Testing passed, can proceed for UAT session"
`[from Notion export, QA Home/SIT Testing.pdf]`

## 7. Knowledge-transfer material

1. Walkthrough videos: STMS Flow, eSTM Flow, APT Flow, Iqmal's KT (UCD, AATF, BO), eAuto
   Insurance, Staging & Prod Env Regression, eAuto Load Testing, Secarang & CIBO. They sit
   in the zip (2.2 GB) and are not yet on SharePoint. `[from Notion export, Excel Conversion/Product Knowledge Walkthrough.xlsx, sheet About]`
2. Caveats written on the page: the STMS video is outdated since STMS gained Transfer
   History; the eSTM video predates eLKM; JPJ Hasil in the video predates the BMK and TH
   reconciliation reports. `[from Notion export, QA Home/Product Knowledge Walkthrough.pdf]`
3. JPJ XML Log Splitter is a Google Sheet tool linked from QA Home. `[from Notion export, QA Home/JPJ XML Log Splitter.pdf]`

## 8. Automation (Notion "Automation" space)

1. The e-Auto automation project tracked: task planning, script updates, test execution
   summaries, deployment planning per environment (sit2, sit3, preprod1, preprod2), git
   branch status per environment, issue tickets, Q&A and a Test Scripts Summary.
   `[from Notion export, QA Home/Automation/Project/e-Auto.pdf]`
2. Test Scripts Summary at export: Search & Filter P1 complete, P2 complete except
   Resubmit JPJ Final Submission (eAuto Plus) and JPJ DEREG Deregistration Transaction
   Listing, P3 not complete; E2E STMS P1 not complete (10, TH Permission); eSTM P1 3 open
   (eVOC, eLKM permission); P2 164, P3 405. `[same page]`
3. Q&A notes worth keeping: exporting CSV with a payment-date filter and no records took
   over 5 minutes on some BO listings; STMS/eSTM Transaction Listing "Company ROC not
   supposed to be empty even when draft". `[same page]`
4. Tooling guide: JetBrains Aqua for Playwright (Getting Started page); JMeter for load;
   k6 trialled. `[from Notion export, QA Home/Automation/Tools/Getting Started.pdf]`
   `[from Notion export, QA Home/Automation/Project/e-Auto.pdf]`
5. AI automation setup for manual QA: Playwright MCP + GitHub Copilot + VS Code, with
   `01- Playwright_Guide.docx` and `02- Appium_Guide.docx`. `[from Notion export, QA Home/Software required for eAuto Secarang Project.pdf]`
6. The eAuto Wholesale automation page is an architecture/implementation guide for the
   proactive WhatsApp chatbot (n8n, PostgreSQL, Redis, WhatsApp Business API), not test
   rules. `[from Notion export, QA Home/Automation/Project/eAuto Wholesale.pdf]`

## 9. QA backlog at export

Open items: update TS priority for STMS & eSTM in the master checklist; draft the manual
→ automation handover process (Miro); master BO test scenarios; confirm eAuto insurance
behaviour in staging ("Unable to simulate for Takaful & TPFT due to unstable web service
API"); add SSM TS to the master checklist (in progress); master regression checklist for
the eAuto App (after the app web deployment). `[from Notion export, QA Home/QA’s Backlog.pdf]`
