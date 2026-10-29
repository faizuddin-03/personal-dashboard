import type { Module, Source } from "../types";

const mine = (ref: string, date?: string): Source => ({ kind: "mine", ref, date });
const azfar = (ref: string): Source => ({ kind: "azfar", ref });
const jira = (ref: string, date?: string): Source => ({ kind: "jira", ref, date });

const ESIM = mine("knowledge/esim.md");
const EMU = mine("knowledge/mykad-emulator.md");
const MAIL = mine("knowledge/mailtrap.md");
const PORTALS = mine("knowledge/eauto-portals.md");
const ENVH = mine("knowledge/environments-history.md");
const PROD = mine("knowledge/production-regression-scope.md");
const AZ_ENV = azfar("knowledge/_core/environments.md");
const AZ_HOW = azfar("knowledge/portals/ucd/how-we-test.md#Staging instances and data that expires");

export const qaTools: Module = {
  id: "qa-tools",
  name: "QA tools and environments",
  short: "QA tools",
  portals: ["eSIM (simulator)", "MyKad Reader Emulator", "Mailtrap", "Staging environments", "Production (limited checks)"],
  summary:
    "This module is for new joiners. It explains the tools a tester uses around eAuto and where to run tests. eSIM fakes JPJ, RHB, SSM, insurance and JomCheck answers. The MyKad emulator fakes the fingerprint reader. Mailtrap catches staging emails. Staging is shared by the whole team. Production gets only a short, safe check after each deployment.",
  related: ["platform", "estm", "dereg", "jomcheck", "insurance"],
  glossary: [
    { term: "eSIM", meaning: "The eAuto Simulator. A test tool, not a product module. It decides what external systems (JPJ, RHB, SSM, insurers, JomCheck) answer on staging. One shared copy for the whole team. Needs VPN.", sources: [ESIM] },
    { term: "Prefix", meaning: "The first characters of a vehicle number (eSIM field Vn Start With, always 2 characters). eSIM finds its rule by prefix, so the vehicle number you type steers the answer.", sources: [ESIM] },
    { term: "Response Code", meaning: "The code eSIM returns for a prefix. Examples: GLB000000I = success, VEL000069E = no valid insurance, VEL000045E and VEL000100E = failures.", sources: [ESIM] },
    { term: "MyKad Reader Emulator", meaning: "A small local program on the tester's own PC (http://localhost:7878). It acts as the Dermalog MyKad and fingerprint reader. It is a different system from eSIM: local, no VPN.", sources: [EMU] },
    { term: "Mailtrap", meaning: "The staging email sink. One shared inbox for every tester and every environment.", sources: [MAIL] },
    { term: "Instance / env", meaning: "The path segment after staging.eauto.my, for example /eauto/, /uat1/, /sit3/. The login page and all pages sit under it.", sources: [PORTALS] },
    { term: "Ask eAuto", meaning: "An internal tool (http://10.20.50.22:3900) where an AI reads the eAuto source code and answers questions. Its answers come from code. They never decide pass or fail.", sources: [AZ_ENV] },
    { term: "Deployment Checklist", meaning: "The Excel file eAuto Deployment Checklist (Y2023 - 2026). One sheet per production deployment. It lists the production regression rows.", sources: [PROD] },
  ],
  flows: [
    {
      id: "esim-steering",
      name: "eSIM: steer a response by vehicle prefix",
      summary:
        "Before a test, set the response code for the vehicle prefix you will use. Run the flow. Then put the old values back. Always set the codes before EVERY run, even a happy path, because eSIM is shared and another tester may have left a failure code.",
      portals: ["eSIM (VPN only)"],
      triggers: [
        {
          id: "esim-ui",
          name: "Edit a rule in the eSIM web page",
          entry: "eSIM login › sidebar group (STMS/eSTM, Deregistration, RHB, LKM, LKM Refund, BMK, Insurance, Jomcheck, SSM, Payments BoldPay, OTH) › entity list › search prefix › Edit",
          summary: "Address https://172.30.202.114:9089/esim/login. One shared instance. Login is a shared account known to the team.",
          sources: [ESIM],
          steps: [
            {
              title: "Connect the VPN",
              where: "Your PC",
              detail: "eSIM cannot be reached without VPN. A timeout often looks like a bad selector in automation. The page uses HTTPS on a bare IP, so scripts need ignoreHTTPSErrors.",
              sources: [ESIM],
            },
            {
              title: "Find the entity and the prefix",
              where: "eSIM › sidebar group › entity list › #searchInput",
              detail: "The search box filters on the page only (all rows are already loaded). Open the row whose Vn Start With equals the first 2 characters of your vehicle number.",
              sources: [ESIM, mine("Faizuddin 2026-10-01")],
            },
            {
              title: "Read the Remark before you edit",
              where: "Entity row › Remark",
              detail: "The prefix space is shared. Remarks like pls dont change - for automation use, CHUBB UAT ON 30.3.2026 (DO NOT DELETE OR MODIFY THIS PREFIX UNTIL FURTHER NOTICE) and AZILA - DO NOT CHANGE mean: use another prefix. Never overwrite another tester's SSM rows. Reuse only rows whose remark starts UDIN QA.",
              sources: [ESIM, mine("Faizuddin 2026-10-22")],
            },
            {
              title: "Change the Response Code and Save",
              where: "Edit page › Response Code › Save Changes",
              detail: "Response Code is plain text. After saving you land on the record view page (/<entity>/<id>/view) with the message <Entity> saved successfully.",
              sources: [ESIM],
            },
            {
              title: "Run the flow, then restore",
              where: "UCD or AATF portal",
              detail: "Use the same prefix in the vehicle number. After the run, put the old values back (the dashboard scripts do this in a finally block).",
              affects: ["Any flow that calls an external service"],
              sources: [ESIM],
            },
          ],
        },
        {
          id: "esim-dashboard",
          name: "Dashboard runner /eauto/esim",
          entry: "Personal dashboard › eAuto › eSIM (scripts/eauto-esim)",
          summary: "Does the same edits for you. The eSIM page runs inside the test's own browser, so the evidence video shows it. The dashboard asks you to confirm VPN is connected.",
          sources: [ESIM, mine("Faizuddin 2026-10-01")],
          steps: [
            {
              title: "Confirm VPN and run",
              where: "Dashboard › Run",
              detail: "A Confirmed VPN Connected modal appears when eSIM is touched.",
              sources: [ESIM],
            },
          ],
        },
      ],
      affects: [
        { text: "Every flow that calls an outside service: eSTM (JPJ enquiry and submission), eLKM, eDereg Pre-Checking and Deregistration, RHB payment results, JomCheck reports, insurance quotes, SSM (company check in UCD onboarding) and BoldPay.", sources: [ESIM] },
        { text: "Whether an instance uses eSIM or the real API (SSM, Insurance, Insurance Cancellation/Runnerku, JomCheck) is switched per instance by Dev only. Check which side the instance is on before you trust a result.", sources: [AZ_ENV] },
      ],
      cronjobs: [
        { name: "Hak Milik purchase cronjob", schedule: "Not recorded", does: "STMS Enquiry code 4K in eSIM triggers the Hak Milik cronjob purchase.", sources: [ESIM, mine("SharePoint TS #080 EAINT-8699")] },
      ],
      roles: [
        { text: "Any QA with VPN. The namespace is shared. Read the Remark before editing someone else's prefix.", sources: [ESIM] },
      ],
      afterCompletion: [
        { text: "Nothing is created. The setting is read by the next flow that runs.", sources: [ESIM] },
      ],
      rules: [
        { text: "Set every code the flow needs before EVERY run, happy path included.", sources: [ESIM, mine("Faizuddin 2026-08-21")] },
        { text: "eSTM Enquiry (/esim/estm-enquiry-resp): success GLB000000I. VEL000069E = no valid insurance (sends the user to the insurance redirect). jpjtimeout. Delay Milliseconds simulates slow JPJ. Remark may hold Drools rules. eSTM Submission: /esim/estm-submission-resp.", sources: [ESIM] },
        { text: "Dereg Enquiry (/esim/dereg-enquiry-resp) is for Deregistration step 4 JPJ Check. It does NOT steer the pre-check. Dereg Submission (/esim/dereg-submission-resp) is for step 6 Deregister. Dereg Precheck (/esim/dereg-precheck-enquiry-resp) has 11 Y/N/NA fields plus a Response Code (GLB000000I, VEL000045E, VEL000100E). eDereg Pre-Checking needs BOTH dereg-precheck-enquiry and rhb-transfer set.", sources: [ESIM, mine("knowledge/flow-edereg.md §5.2-5.3")] },
        { text: "RHB Transfer (/esim/rhb-transfer-resp) codes: OK, IF (insufficient funds), RE (6-minute timer), ER (API down, about 12-minute cooldown), NF, NR, RP, ER-T, DL, DR, NA.", sources: [ESIM, mine("EAINT-9306 TS11 and TS12 retest note")] },
        { text: "JomCheck Enquiry: Result Yes/No means vehicle found. Vn and Cn prefixes are separate keys. JomCheck Report: Simulator Details Only (No Default) Yes/No. Result Success/Failed (Failed makes the purchase fail: payment OK, Tx Failed). Claim records can repeat. A blank field falls back to default data when the switch is No.", sources: [ESIM] },
        { text: "SSM seeding for UCD onboarding: /obs/preOnb/checkSSM.do reads eSIM. Needs an SSM Enquiry row (Response Code 004; ROC, New ROC 12-digit BRN, Company Name, Item Type C/B/L, Check Digit) and an SSM ROC submission row (Response Code 005; XML pages 1 to 6).", sources: [ESIM] },
        { text: "Insurance prefixes (EAINT-8536): VB = cover note submission failed, VF = JPJ signal rejected. eDereg codes for e-Invoice tests: GLB000000I success, VEL000100E failed, ENF000013E cancelled, VEL000102E final submission failed.", sources: [ESIM, mine("SharePoint TS #065, #075")] },
        { text: "eSIM is shared: never leave a prefix on a failure code after your run.", sources: [ESIM] },
      ],
      scopeToCheck: [
        { text: "Which entity and prefix the scenario needs.", sources: [ESIM] },
        { text: "VPN is connected.", sources: [ESIM] },
        { text: "The prefix is not owned by another tester (read the Remark).", sources: [ESIM] },
        { text: "Old values are restored after the run.", sources: [ESIM] },
        { text: "For eDereg Pre-Checking, both eSIM entities are set.", sources: [ESIM] },
        { text: "The instance uses eSIM and not the real API for that service.", sources: [AZ_ENV] },
      ],
      tickets: [
        { key: "EAINT-9306", date: "2026-08", what: "Dereg entities in eSIM.", state: "latest" },
        { key: "EAINT-11864", date: "2026-08", what: "eSTM Enquiry code.", state: "latest" },
        { key: "EAINT-12339", date: "2026-10", what: "JomCheck entities in eSIM.", state: "latest" },
        { key: "EAINT-12403", date: "2026-10", what: "APT, RHB IF prefix (SharePoint TS #042).", state: "latest" },
        { key: "EAINT-8536", what: "Insurance prefixes VB and VF.", state: "latest" },
        { key: "EAINT-8699", what: "SharePoint TS using the Hak Milik code 4K.", state: "latest" },
      ],
      openQuestions: [
        "Dereg Submission edit form was never captured. Insurance API and Insurance Quotation entities were never mapped.",
        "JomCheck record #19 (HX/HX) only partly controls the live Report Listing. Blank eSIM fields fall back to default or real data.",
        "ROB and LLP SSM field names are assumed. The ssm-roc-submission capture was cut short.",
        "Azfar: some staging pages show fixed TESTING SDN BHD / 999999-A, which means eSIM is not used on that instance.",
      ],
    },
    {
      id: "mykad-emulator",
      name: "MyKad Reader Emulator (fake fingerprint reader)",
      summary:
        "Some pages wait for a real Dermalog MyKad and thumbprint reader. The emulator runs on your own PC and plays the reader, so the page lets you continue.",
      portals: ["Local emulator http://localhost:7878", "AATF portal", "UCD portal (eSTM)"],
      triggers: [
        {
          id: "emu-manual",
          name: "Tester inserts a card by hand",
          entry: "Any screen with the MyKad widget (mykad-websocket-v2.js): AATF Dereg Step 1 and Step 3, Upload COD Step 1, Manage Users add or update, Create New AATF Company Account, UCD eSTM Step 1 (Buyer) and Step 3 (Seller)",
          sources: [EMU, mine("knowledge/flow-edereg.md §6"), mine("knowledge/flow-estm.md")],
          steps: [
            {
              title: "Let the page open the reader connection",
              where: "The host page",
              detail: "The page opens ws://localhost:7878/IDCard. The Continue button turns on only after photoReady, dataReady and verified.",
              sources: [EMU],
            },
            {
              title: "Open the emulator control panel",
              where: "http://localhost:7878",
              detail: "A real client must open this page or the widget stays on Scanning IC... Please insert IC into the Dermalog Biometric Device if you haven't. Click Connect.",
              sources: [EMU],
            },
            {
              title: "Pick a profile and insert the card",
              where: "Emulator › Quick Profile (johan, gstesttest, testucd, or your saved profiles) › Insert Card",
              detail: "The emulator sends INSERTCARD:{json} and answers INSERTCARD OK. The page then shows Verification Passed / Verification Completed and continues.",
              affects: ["eDereg Deregistration", "eSTM"],
              sources: [EMU],
            },
          ],
        },
        {
          id: "emu-automation",
          name: "Script inserts the card (MykadEmulatorClient)",
          entry: "Playwright suites such as eDereg and eSTM TS12",
          summary: "The card auto-ejects, so the script inserts it before EACH auth screen.",
          sources: [EMU],
          steps: [
            {
              title: "Call insertCard with NRIC and name",
              where: "MykadEmulatorClient.insertCard()",
              detail: "Opens the emulator page, connects, sends INSERTCARD with the NRIC and name typed on the dashboard, waits for the ack, then closes the emulator page. Profiles saved in a person's own browser are not visible to automation, so pass the NRIC and name instead.",
              sources: [EMU],
            },
            {
              title: "eSTM Step 1 order",
              where: "UCD › eSTM Step 1",
              detail: "Enter the vehicle number and the eVOC email. Tick #buyer-consent with a click (not check()). Wait for #mykad-control-container. Then insert the card.",
              sources: [mine("knowledge/flow-estm.md §MyKad-emulator route", "2026-10-19")],
            },
          ],
        },
      ],
      affects: [
        { text: "It unlocks the next step in the host flow (eDereg Deregistration, eSTM).", sources: [EMU] },
      ],
      cronjobs: [],
      roles: [
        { text: "A tester on their own machine. It is not on VPN and is a different system from eSIM.", sources: [EMU, mine("Faizuddin 2026-08-21")] },
      ],
      afterCompletion: [
        { text: "Nothing is stored. It is only an authentication step.", sources: [EMU] },
      ],
      rules: [
        { text: "Chrome blocks a public page from reaching ws://localhost. Console shows net::ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS and the page says Update Required - Please update Dermalog Biometric Device... Launch Chrome with --disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessChecks to fix it (confirmed 2026-08-22).", sources: [EMU] },
        { text: "Close the emulator page after every insertCard. A blank helper tab breaks the rule that the last page is the active page (confirmed 2026-08-22).", sources: [EMU] },
        { text: "Fresh Playwright contexts need camera, microphone and midi pre-granted. This may really be the Local Network Access prompt.", sources: [EMU], unconfirmed: true },
        { text: "The page script can force-close on multiple sessions (hTotalActiveSession). The emulator flow works in practice.", sources: [EMU] },
      ],
      scopeToCheck: [
        { text: "A new thumbprint screen uses the same widget.", sources: [EMU] },
        { text: "The screen blocks Next until the card is read.", sources: [EMU] },
        { text: "Emulator is open and connected before the page is reached.", sources: [EMU] },
      ],
      tickets: [
        { key: "EAINT-9306", date: "2026-08", what: "Emulator client built for eDereg.", state: "latest" },
        { key: "EAINT-12412", date: "2026-10", what: "Reused for eSTM TS12. Not yet run live per the file.", state: "latest" },
        { key: "eSTM zzz/<slot> URL bypass", what: "Older bypass for eSTM before the emulator.", state: "legacy", supersededBy: "EAINT-12412" },
      ],
      openQuestions: [
        "Exact name of the permission behind the first browser prompt is not confirmed.",
      ],
    },
    {
      id: "mailtrap",
      name: "Mailtrap: check staging emails",
      summary:
        "All staging emails go to one shared Mailtrap inbox. The team checks them in a browser that is already signed in. The automation does not use the Mailtrap API. If Mailtrap is signed out the check says blocked and never passes.",
      portals: ["Mailtrap sandbox inbox"],
      triggers: [
        {
          id: "mailtrap-inbox",
          name: "Open the shared inbox",
          entry: "https://mailtrap.io/sandboxes/2581833/messages (one inbox for every tester and environment)",
          sources: [MAIL],
          steps: [
            {
              title: "Find your email",
              where: "Mailtrap › inbox list",
              detail: "Match by vehicle number in subject, to or from. Scope by recipient, subject and time window. Expect exactly one email, or none.",
              sources: [MAIL],
            },
            {
              title: "Check the content",
              where: "Mailtrap › message",
              detail: "Check sender, recipient, subject, body fields, link, count (exactly one) and timing.",
              sources: [MAIL],
            },
          ],
        },
        {
          id: "mailtrap-automation",
          name: "Automated check",
          entry: "Playwright helper that reads Mailtrap",
          summary: "Copies the modefair.com Chrome profile session files, starts headed Chrome and reads the first 40 rows. It cannot run on GitHub Actions.",
          sources: [MAIL, mine("QA team 2026-08-17")],
          steps: [
            {
              title: "Read the first 40 rows with the signed-in session",
              where: "Headed Chrome with the copied profile",
              detail: "If Mailtrap is signed out the result is blocked.",
              sources: [MAIL],
            },
          ],
        },
      ],
      affects: [
        { text: "Emails that reach Mailtrap: BMK email, eVOC email, JomCheck OTP and WhatsApp.", sources: [MAIL] },
        { text: "Emails that do NOT reach Mailtrap: Deregistration (JPJ sends email and COD at final submission success) and eAuto Insurance policy emails (Takaful, TPFT, Chubb, Tokio Marine). They go to the address entered.", sources: [MAIL], unconfirmed: true },
        { text: "While a branch is connected to JPJ staging, the JPJ receipt email goes to systemtest@eauto.my and not to Mailtrap.", sources: [mine("Teams Main 2026-09-17")] },
        { text: "Service Hub appointment emails: sender support@eauto.my. Subject eAuto: Your Software Installation Appointment is Confirmed - [UCD Company Name] (once, on confirm). The reschedule subject has the new date and time. Known defect: the dash shows as ?.", sources: [MAIL, azfar("automation/src/data/email-contracts.ts")] },
      ],
      cronjobs: [],
      roles: [
        { text: "Anyone signed in to Mailtrap in the modefair.com Chrome profile.", sources: [MAIL] },
      ],
      afterCompletion: [],
      rules: [
        { text: "Test emails use the @testingz.com domain. Do not use @modefair.com for fake test emails. Do not use @yopmail.com or other throwaway domains.", sources: [mine("memory: fake test emails @testingz.com")] },
        {
          text: "Team Notion page Email for Testing says where @modefair.com is allowed: fine on the e-simulator except Deregistration. Do not use it when staging is connected to JPJ Staging or RHB Staging. Secarang and CIBO use @modefair.com.",
          sources: [MAIL],
        },
        { text: "Reminder emails run on a schedule (insurance reminder hourly 07:00 to 23:00). See the owning module.", sources: [mine("knowledge/flow-quotation-reminder.md")], unconfirmed: true },
        { text: "Approving an application sends 3 emails (EAINT-12341 and 12461).", sources: [mine("Teams EAINT-12341 and 12461")] },
      ],
      scopeToCheck: [
        { text: "Sender, recipient, subject, body fields and link.", sources: [MAIL] },
        { text: "Exactly one email, not two.", sources: [MAIL] },
        { text: "Timing against the action.", sources: [MAIL] },
        { text: "Whether the email goes to Mailtrap at all (see list of exceptions).", sources: [MAIL] },
      ],
      tickets: [
        { key: "EAINT-11864", date: "2026-08", what: "Quotation reminder email checks.", state: "latest" },
        { key: "EAINT-12341 / 12461", date: "2026-10", what: "Approved-application emails.", state: "latest" },
        { key: "EAINT-12105", date: "2026-07", what: "CC support@eauto.my on the Service Hub confirmation email.", state: "latest" },
      ],
      openQuestions: [
        "Mailtrap DOM selectors are not confirmed.",
        "Which insurance emails bypass Mailtrap is not confirmed.",
        "The browser reader cannot run on GitHub Actions. The off-laptop nightly run is open.",
      ],
    },
    {
      id: "environments",
      name: "Staging environments and shared data",
      summary:
        "Staging lives on one host: https://staging.eauto.my/<instance>/. The path segment is the instance. From 2026-10-21 the main staging instance is /eauto/. Staging is shared and persistent, so other testers can change your data. Pick the instance per ticket and never tie an instance to a general rule.",
      portals: ["UCD", "Back Office", "Service Portal", "CIBO", "Secarang", "Insurance Dashboard", "/obs onboarding"],
      triggers: [
        {
          id: "env-start",
          name: "Start a test",
          entry: "https://staging.eauto.my/<env>/public/login/",
          summary: "UCD and BO share one login page. The account role decides the portal.",
          sources: [PORTALS, AZ_ENV],
          steps: [
            {
              title: "Pick the instance from the ticket",
              where: "Ticket and QA group message",
              detail: "Instances seen: uat1, uat3, uat4, sit1 (from 2026-09-30), sit2, sit3, sit4, preprod1 and eauto. uat2, preprod2 and preprod3 were removed on 2026-07-06. Environment is per ticket, never per rule.",
              sources: [PORTALS, ENVH],
            },
            {
              title: "Log in and wait for the redirect",
              where: "<base>/public/login/",
              detail: "Wait until the URL leaves /public/login, then wait for network idle. BO lands on <base>/home/ with #home-menu. Motor insurance portal login is <base>/motorInsurance/login/. Service Portal login is <base>/bank/login/. Onboarding /obs has no instance: https://staging.eauto.my/obs/...",
              sources: [PORTALS, azfar("knowledge/_core/environments.md")],
            },
            {
              title: "Check real API or eSIM for your service",
              where: "Ask Dev",
              detail: "SSM, Insurance, Insurance Cancellation and JomCheck can run on eSIM or the real API depending on the instance. Dev switches it.",
              sources: [AZ_ENV],
            },
          ],
        },
        {
          id: "env-claim",
          name: "Claim an environment for a deployment",
          entry: "QA group chat and the QA Portal (http://10.30.10.214)",
          summary: "QA Portal tasks are at /tasks/<uuid>. Studying a task is read-only: never change states.",
          sources: [ENVH, mine("memory: QA Portal URL and read-only rule")],
          steps: [
            {
              title: "Claim, tell dev, record",
              where: "QA group › dev › QA Portal",
              detail: "One environment per deployment window. Dev waits for the QA green light before deploying to any staging.",
              sources: [ENVH],
            },
            {
              title: "After a production deployment",
              where: "QA Portal",
              detail: "QA watches prod until lunch or 2pm, then asks dev to merge the latest prod code into the other staging branches. QA clicks Release and Merge down all in the QA Portal.",
              sources: [ENVH],
            },
          ],
        },
      ],
      affects: [
        { text: "All testing. A fee change on one branch affects every staging branch.", sources: [ENVH, mine("knowledge/quirks.md")] },
        { text: "Instances /eauto/, /uat1/ and /sit2/ share one database. /preprod1/ has its own.", sources: [AZ_HOW] },
        { text: "Other services behind staging: eauto-cron, eauto-notification, einvoice API, onboarding API, serbasentral API, secarang-backend (staging/ins), eSIM, ssm-api, obs, JomCheck API. Secarang staging: https://staging.secarang.com/<site> (/ia, /preprod), cibo-frontend at staging/cibo.", sources: [ENVH] },
      ],
      cronjobs: [
        { name: "Insurance JPJ enquiry, resubmit cover note, resubmit refer-case", schedule: "OFF on staging branches", does: "Dev turns them on per branch on request.", sources: [mine("Teams Main 2026-08-01")] },
        { name: "APT payment cron", schedule: "Every staging branch runs it at the same time. A test branch was set to every 30 minutes, 8am to 11pm. The 8pm daily change was reverted 2026-08-02.", does: "Can mark a paid transaction Failed.", sources: [ENVH, mine("Teams Main 2026-08-02")] },
        { name: "Unpaid draft cleanup", schedule: "Not recorded", does: "Dereg drafts expire (about 50 minutes on 2026-10-21). BMK drafts were auto-cancelled at 20:20. Interstate UCD to UCD expires at 48 hours. STMS/eSTM Pending, APT, Insurance Pending Payment and JomCheck Pending survive the night.", sources: [AZ_HOW] },
      ],
      roles: [
        { text: "QA team and developers. Each QA needs their own accounts for UCD, BO and AATF.", sources: [ENVH, PROD] },
        { text: "Test companies seen in shared use: UCD TEST, UCD TEST 2, CREDIT COMPANY TEST, AATF Test Sdn Bhd. Change data back after use.", sources: [PROD] },
      ],
      afterCompletion: [],
      rules: [
        {
          text: "Main staging instance is /eauto/ from 2026-10-21 (https://staging.eauto.my/eauto/...).",
          sources: [mine("memory: staging = /eauto instance", "2026-10-21")],
          alt: [{ text: "/eauto/ is the default instance, but an old build before EAINT-12253. It shares its database with /uat1/ and /sit2/. /uat1/ got EAINT-12339 and EAINT-12253 on 2026-10-21.", sources: [AZ_ENV], note: "Azfar describes /eauto/ as an older build. Check the build on the page before you rely on new features." }],
        },
        { text: "Reconciliation, JPJ and RHB testing freezes the branch: no changes or transactions. Transactions on one branch are not visible on another.", sources: [ENVH] },
        { text: "Branch uses: preprod1 had JPJ Staging during LKM Refund SIT. uat3 has JPJ Staging from 2026-10-15 for EAINT-8622. sit2 was kept for wholesale in Aug and Sep. By 2026-10-14 uat1 went to Wei Ting for wholesale.", sources: [ENVH] },
        { text: "Browsers: UCD and AATF on Firefox, BO and JPJ on Chrome then Firefox. From 2027-01-01 Chrome only (EAINT-12180 and 12253).", sources: [PORTALS] },
        { text: "Third-party test endpoints: ezAuto UAT (live gateway, 10 transactions a day), eSIM (VPN), SSM e-Info (Rafftech) staging plus eSIM, Runnerku real API (SIT 12 to 14 Oct 2026), Mailtrap, Fiuu sandbox, Ask eAuto.", sources: [AZ_ENV] },
        { text: "Fiuu sandbox: QA said it cannot take more than RM1,000, but two RM1,500 FPX payments were PAID on 2026-09-23. Open.", sources: [azfar("knowledge/cross-portal/onboarding payment rules")], unconfirmed: true },
        { text: "The ticket EAINT-12166 said ready in staging/uat2 (dev) but QA signed off on uat1. uat2 was removed on 2026-07-06, so uat2 was probably a typo.", sources: [ENVH], unconfirmed: true },
      ],
      scopeToCheck: [
        { text: "Which instance and which build.", sources: [PORTALS, AZ_ENV] },
        { text: "Is the service on eSIM or the real API on this instance.", sources: [AZ_ENV] },
        { text: "Is anyone else using the same company, prefix or slot (shared data).", sources: [ENVH, ESIM] },
        { text: "Will a cron or a fee change on another branch hit your data.", sources: [ENVH] },
        { text: "Which instance holds the transaction you need (branches do not share data, except /eauto/, /uat1/, /sit2/).", sources: [AZ_HOW] },
      ],
      tickets: [
        { key: "EAINT-12253 / 12180", what: "Firefox access ends 2027-01-01.", state: "latest" },
        { key: "EAINT-12155", date: "2026-08", what: "Portal facts: insurance company user admin hidden from BO menu at /view/insurance/company-account/user/. eAuto mobile app shares the web database.", state: "latest" },
        { key: "EAINT-8622", date: "2026-10", what: "JPJ Staging on uat3 from 2026-10-15.", state: "latest" },
      ],
      openQuestions: [
        "Default instance in scripts is not the same everywhere: the Service Hub suite uses uat4, playwright.config uses uat1, eauto-e2e uses sit3.",
        "/eauto/ is called the main instance by the team and an older build by Azfar. Confirm per ticket.",
        "Fiuu sandbox cap. See rules.",
      ],
    },
    {
      id: "production-regression",
      name: "Production regression (what QA may and may not do in production)",
      summary:
        "After each production deployment QA runs a short check on the live system. The rule is simple: look and search only. Do not create, edit, delete, submit or pay anything. Real stop points are fixed for each module.",
      portals: ["Production UCD", "Back Office", "AATF", "Secarang", "CIBO", "Service Portal"],
      triggers: [
        {
          id: "prod-deploy",
          name: "Production deployment",
          entry: "Deployment slot (night 10:50 PM or 11 PM, or an AM slot) and the next-day morning check. Work list: eAuto Deployment Checklist (Y2023 - 2026).xlsx, one sheet per deployment.",
          summary: "149 sheets from 2023-01-04 to 2026-10-20. Sheet header dates are often wrong, so cite the tab name.",
          sources: [PROD],
          steps: [
            {
              title: "Before the deployment",
              where: "Your accounts",
              detail:
                "Each QA needs their own prod UCD, BO and AATF accounts. Ask the account owner (BA) for superadmin access beforehand if the new page needs it (e-Invoice and Consolidated e-Invoice listing, JomCheck Report Listing, Biometric Device Purchase & Software Installation listing, Hire Purchase record listing, bypass SSM audit log, eAuto Service Portal). A new test UCD company needs eAuto approval (name TEST<yyyymmdd>, reg no <yyyymmdd>-T, inactivate after). Deactivate test BO accounts afterwards.",
              sources: [PROD],
            },
            {
              title: "Run the standard regression block",
              where: "Deployment Checklist sheet (rows R6 to R44, same from 2026-08-10 to 2026-10-20 AM)",
              detail: "STMS (Malaysian and Company), eSTM (Malaysian and Company), UCD to UCD, BMK, JomCheck purchase, Motor Insurance quote, resubmit failed transaction, Deregistration, AATF reports, Confirmation of Registration, BO logins (Hub Admin, Admin, Probation), BO Firefox and Chrome (generate DO), JPJ Hasil, Services, Ops Dashboard, Bintang Prospek, search and filter basics, eAuto Service Portal (access and search), Secarang (quote to payment page), CIBO (listing populates, export works).",
              sources: [PROD],
            },
            {
              title: "Stop at the allowed point",
              where: "Each module",
              detail:
                "STMS, eSTM, BMK, UCD to UCD Standard: Step 4 first JPJ enquiry only (use a random plate, JPJ fails by design). UCD to UCD Interstate: Step 2 only. JomCheck: vehicle enquiry only, no pay. Motor Insurance: Step 2, quote not saved. Deregistration: Step 3, then [HOME]. eDereg Pre-Checking: Step 2 pending, no pay. Pre-Application: Step 2 payment popup, then close. Application: dummy data, then Reject. Secarang: quote, payment page, then quit. Software Installation: Step 1. Biometric Device Purchase: Step 1 and 2 (cap 40; BO listing and [DO]). Wholesale chatbot: up to the payment page, never Confirm Refire. BO modules: open, search, filter and export only.",
              sources: [PROD],
            },
            {
              title: "Next-day morning monitoring",
              where: "Production listings",
              detail: "Look at real new transactions (for example STMS + IC with Tx Status Approved and Service Charge 38; JomCheck fee RM20; LHDN = OK per module). A cron that runs at 11 PM cannot be seen that night. Check an existing record due to change the next day. Dev verifies in prod and triggers the cron by hand if needed.",
              sources: [PROD],
            },
          ],
        },
      ],
      affects: [
        { text: "Production data. Never create, edit or delete. No payment. No gateway payment of any kind in prod.", sources: [PROD] },
      ],
      cronjobs: [
        { name: "Cron changes in a release", schedule: "Not checked on deploy night", does: "Check next day on an existing record due to change (example: EAINT-11829, record expiring 2026-07-01 00:00). Dev triggers the cron by hand.", sources: [PROD] },
      ],
      roles: [
        { text: "QA with their own prod accounts. The superadmin account owner gives extra access. Finance-owned reports cannot be checked by QA.", sources: [PROD] },
      ],
      afterCompletion: [],
      rules: [
        { text: "DON'T TOUCH sensitive functions: Create, Edit, Update, Delete, Remove, Submit Transaction and anything payment-related.", sources: [PROD] },
        { text: "Use a random car plate that will not exist in prod, for example TEST123.", sources: [PROD] },
        { text: "BO JPJ Enquiry (New): do NOT trigger any search.", sources: [PROD] },
        { text: "Reset payment is not advised on prod.", sources: [PROD] },
        { text: "Shared prod test companies: UCD TEST, UCD TEST 2, CREDIT COMPANY TEST, AATF Test Sdn Bhd. If data was changed, change it back.", sources: [PROD] },
        { text: "If CIBO keeps loading forever, ask dev to restart the SerbaSentral API.", sources: [PROD] },
        { text: "Never open production eAuto for research or automation runs. Staging only.", sources: [mine("eauto-flows run rules 2026-10-23 (CHECKPOINT.md)")] },
        { text: "Verification pattern per CR type: listing column, price or fee, invoice or LHDN, document, payment gateway (stop before payment), cron or backend, report, permission, button visibility, email, wholesale, validation, text or label, data patch, thumbprint or infra, backend swap.", sources: [PROD] },
        { text: "Precedents (what a past CR got in prod): EAINT-12403 Yes, 12151 Yes, 12166 and 12167 Yes, 12058 Yes, 12339 Part, 12175 Part, 11864 No, 11759 No.", sources: [PROD] },
      ],
      scopeToCheck: [
        { text: "Your own prod accounts exist before the deployment.", sources: [PROD] },
        { text: "New page needs superadmin: request it first.", sources: [PROD] },
        { text: "Each module stops at its allowed point.", sources: [PROD] },
        { text: "Next-day check of real transactions and any cron change.", sources: [PROD] },
        { text: "Test data you changed is set back.", sources: [PROD] },
      ],
      tickets: [
        { key: "EAINT-12403", date: "2026-10", what: "Precedent: checked in prod.", state: "latest" },
        { key: "EAINT-12166 / 12167", date: "2026-09", what: "Precedent: checked in prod (Service Hub DO and serial).", state: "latest" },
        { key: "EAINT-12155", date: "2026-09", what: "Password policy, deployed 2026-09-10 and checked in prod.", state: "latest" },
        { key: "EAINT-11829", what: "Cron check on an existing transaction.", state: "latest" },
      ],
      openQuestions: [
        "BoldPay and DuitNow were never verified in prod: no precedent.",
        "IE8 and IE11 were dropped on 2024-02-29. Chrome web socket was added on 2025-12-17.",
      ],
    },
  ],
};
