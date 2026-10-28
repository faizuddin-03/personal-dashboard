import type { Module, Source } from "../types";

const TD: Source = { kind: "mine", ref: "knowledge/teams-decisions-by-ticket.md" };
const MYK: Source = { kind: "mine", ref: "knowledge/mykad-emulator.md" };
const MYK_LIVE: Source = { kind: "mine", ref: "knowledge/mykad-emulator.md (verified live)", date: "2026-08-24" };
const MAIL: Source = { kind: "mine", ref: "knowledge/mailtrap.md" };
const BR: Source = { kind: "mine", ref: "knowledge/business-rules-from-test-scenarios.md" };
const AZ_MYK: Source = { kind: "azfar", ref: "knowledge/_core/mykad-emulator.md" };
const AZ_PORTAL: Source = { kind: "azfar", ref: "knowledge/portals/ucd/portal.md#Firefox: announcement and browser reminder" };
const AZ_TEST: Source = { kind: "azfar", ref: "knowledge/portals/ucd/how-we-test.md#Traps" };
const AZ_7229: Source = { kind: "azfar", ref: "cr/EAINT-7229/LEDGER.md" };
const ASK_ACC: Source = { kind: "askeauto", ref: "prod code prod/master (2026-10-22) — Platform account rules answer", date: "2026-10-23" };
const ASK_MB: Source = { kind: "askeauto", ref: "prod code 0e21bef3db (2026-10-22) — eAuto mobile app answer", date: "2026-10-23" };

export const platform: Module = {
  id: "platform",
  name: "Platform: login, passwords, MyKad / browser, JPJ submission, notifications, mobile app",
  short: "Platform",
  portals: ["UCD", "AATF", "Back Office", "Service Portal", "Insurance portal", "Android / iOS app"],
  summary:
    "Things that every module shares. Login and password rules apply to all portals. Thumbprint pages use the same MyKad reader widget in UCD and AATF. The browser messages move Firefox users to Chrome before 1 January 2027. JPJ enquiry and submission rules, staging emails and the mobile app also sit here.",
  related: ["ucd-portal", "backoffice", "qa-tools", "estm", "dereg", "stms", "bmk"],
  glossary: [
    { term: "Dermalog", meaning: "Maker of the biometric (MyKad + thumbprint) reader. The portal talks to the reader service over a local WebSocket.", sources: [AZ_MYK, MYK] },
    { term: "Java applet", meaning: "Old way to read the card. Still used by Firefox 36.0.4. Replaced by WebSocket in Chrome by EAINT-7229.", sources: [AZ_MYK, AZ_7229] },
    { term: "MyKad Reader Emulator", meaning: "QA tool at http://localhost:7878 that acts as the card reader and thumbprint. Different from eSIM.", sources: [MYK, AZ_MYK] },
    { term: "Perakuan", meaning: "Declaration ticked before a thumbprint. The thumbprint stays hidden until it is ticked.", sources: [{ kind: "azfar", ref: "knowledge/_core/glossary.md" }] },
    { term: "BRN", meaning: "Business registration no. sent to JPJ in enquiry and final submission (old or new format). Only STMS, APT, eSTM, eDereg Pre-Check and BMK send it.", sources: [{ kind: "jira", ref: "EAINT-8622" }] },
    { term: "isBlock (mobile kill switch)", meaning: "Flag on the mobile app-settings record. When on, all mobile filters block every app user. It also carries versionName and versionCode for the app version check. It does not change any transaction status.", sources: [ASK_MB] },
    { term: "Mailtrap", meaning: "Shared staging email inbox for all testers and environments.", sources: [MAIL] },
  ],
  flows: [
    // ------------------------------------------------------------------
    {
      id: "login-password",
      name: "Login, password policy and Forgot Password",
      summary:
        "One password policy for all portals: 12 to 30 characters with upper case, lower case, a number and a special character. Users can also reset a password from the login page.",
      portals: ["UCD", "AATF", "Back Office", "Service Portal", "Insurance portal", "Bank / Credit"],
      triggers: [
        {
          id: "new-user",
          name: "New user created or password set (EAINT-12155)",
          entry: "Any portal › create user / company account pages (also AATF Add New User Account)",
          sources: [TD, { kind: "jira", ref: "EAINT-12155" }],
          steps: [
            {
              title: "Admin creates the user or sets a password",
              where: "BO › Create New User / Company Account; UCD Main user › Manage Users; AATF › Add New User Account",
              detail: "Password must follow the new policy. System-made passwords were weaker than the policy before this change (temporary password was 6 random letters; the AATF sub-user default was fixed in code).",
              sources: [TD, { kind: "jira", ref: "EAINT-12155" }],
            },
            {
              title: "User logs in for the first time",
              where: "/<env>/public/login",
              detail: "A Sub UCD first login needs \"Current Password\" and \"Confirm Password\" because the temporary password is not pre-filled.",
              sources: [TD],
            },
          ],
        },
        {
          id: "existing-user",
          name: "Existing user changes password (EAINT-12125)",
          entry: "Any portal › Change Password",
          sources: [TD, { kind: "jira", ref: "EAINT-12125" }],
          steps: [
            {
              title: "User opens Change Password and saves a new password",
              where: "Any portal › Change Password page",
              detail: "Existing users may update but are not forced before login. When an admin changes a user's password, the old format is still allowed and the user sees \"Please change your password.\" on the next login.",
              sources: [TD],
            },
          ],
        },
        {
          id: "forgot-password",
          name: "Forgot Password link on the login page (EAINT-12228)",
          entry: "Login page › Forgot Password (below the login box); also AATF and sub AATF",
          sources: [TD, { kind: "jira", ref: "EAINT-12228" }],
          steps: [
            {
              title: "Click Forgot Password",
              where: "Login page › Forgot Password",
              detail: "Goes to the Change Password page.",
              sources: [{ kind: "jira", ref: "EAINT-12228" }],
            },
            {
              title: "Verify and set a new password",
              where: "Change Password page",
              detail: "A Main User must enter an OTP sent to the Main User's registered phone. A Sub User resets in the normal way. The confirmation email is sent only after the new password is saved.",
              branches: [
                { when: "Main User", then: "OTP to registered phone is required." },
                { when: "Sub User", then: "Normal reset." },
              ],
              sources: [{ kind: "jira", ref: "EAINT-12228" }, TD],
            },
          ],
        },
        {
          id: "admin-reset",
          name: "Admin resets another user's password (prod code)",
          entry: "BO › user management › reset password action",
          summary: "Prod code: this is the only reset path that works today. No email link, API, JPJ notice or cronjob starts any part of the password flow.",
          sources: [ASK_ACC],
          steps: [
            { title: "Admin clicks reset on a user", where: "BackOffice user management screen", detail: "An audit entry \"Reset password\" is written for that user. The account is set to \"reset password\".", sources: [ASK_ACC] },
            { title: "User logs in and is forced to change the password", where: "Login › Change Password screen", detail: "The forced-change screen opens right after a good login while the account is flagged. Saving clears the flag.", sources: [ASK_ACC] },
          ],
        },
      ],
      affects: [
        { text: "All six portals: BO, UCD, JPJ, AATF, Bank / Credit and Insurance. BO Create New User and Company Account pages (13 QA sub-tasks under EAINT-12155).", sources: [TD, { kind: "jira", ref: "EAINT-12155" }] },
        { text: "The mobile app shares the web database, so password rules reach it. It was not tested separately.", sources: [TD] },
      ],
      cronjobs: [],
      roles: [
        { text: "Prod code: login and Change Password screens are open to every portal's users (main eAuto / UCD / JPJ / AATF, Insurance, Credit / Bank). The admin reset action sits only on the BackOffice user management screen. The Forgot Password page has no role check because it is a pre-login public page.", sources: [ASK_ACC] },
        { text: "Main User (needs OTP for Forgot Password) and Sub User. Admins reset others' passwords.", sources: [{ kind: "jira", ref: "EAINT-12228" }, TD] },
      ],
      afterCompletion: [
        { text: "n/a. The user is logged in with the new password.", sources: [TD] },
        { text: "Prod code: admin reset writes an audit entry and forces a password change at next login. Self-service reset (old page) emails a temporary password to the registered address and sets \"first time login\". No SMS, WhatsApp, BO listing, JPJ, insurer or e-Invoice is involved, and no other module changes.", sources: [ASK_ACC] },
      ],
      rules: [
        {
          text: "Policy: 12 to 30 characters; at least one upper case, one lower case, one number, one special from ! @ # $ % ^ & * ( ) _ + - =; no spaces; only those specials count. Reuse is allowed. Copy and paste follows prod behaviour.",
          sources: [TD, { kind: "jira", ref: "EAINT-12155" }],
        },
        { text: "This replaces: minimum 6 characters (8 for AATF and Insurance), alphanumeric.", sources: [{ kind: "jira", ref: "EAINT-12155" }] },
        { text: "EAINT-12155 = new users (Done 2026-09-11). EAINT-12125 = existing users.", sources: [TD, { kind: "jira", ref: "EAINT-12155" }] },
        { text: "Statuses (prod code): account login status = first time login (must set a password first), second time login, inactive (blocked: \"contact your supervisor or admin\"), reset password (admin forced a reset). A reset moves the account to first time login / reset password; the forced change clears it. Company status New / Inactivated / Rejected / Terminated separately blocks login with \"account not active\".", sources: [ASK_ACC] },
        {
          text: "Forgot Password is linked on the login page (EAINT-12228, SRD v1.1).",
          sources: [{ kind: "jira", ref: "EAINT-12228" }],
          alt: [{ text: "Prod code today: the login page shows no Forgot Password link. An old Forgot Password page exists (Login ID, email, captcha) but its link bounces the visitor to the logout / home page, so nobody can reach it. If it were reached it would email a temporary password and set \"first time login\". Matches 12228 still being in development.", sources: [ASK_ACC], note: "prod code says" }],
        },
        { text: "Prod code: the \"inactivity logout\" is a front-end countdown pop-up that resets on each page load. It warns after 24 hours on the same page, then gives 1 extra minute to click continue before auto logout. It does not measure mouse or keyboard activity. The server session expiry is a hidden setting and may cut the session sooner.", sources: [ASK_ACC] },
        { text: "Prod code: no scheduled job expires passwords, reminds users to change them or deactivates dormant accounts (not found in code).", sources: [ASK_ACC] },
        { text: "EAINT-12275 (server does not check Password = Confirm) is an existing prod issue parked under EAINT-148. Do not raise it again.", sources: [TD] },
      ],
      scopeToCheck: [
        { text: "New user versus existing user rules; admin reset message.", sources: [TD] },
        { text: "Sub UCD first login fields.", sources: [TD] },
        { text: "AATF and sub AATF pages.", sources: [TD] },
        { text: "Each of the six portals: login and password change page.", sources: [TD] },
        { text: "Forgot Password: Main User OTP, Sub User reset, and the confirmation email.", sources: [{ kind: "jira", ref: "EAINT-12228" }] },
        { text: "Special characters outside the allowed set are rejected; paste and hidden text.", sources: [TD] },
      ],
      tickets: [
        { key: "EAINT-12155", date: "2026-08", what: "Policy for new users in all portals. Done 2026-09-11.", state: "latest" },
        { key: "EAINT-12125", date: "2026-08", what: "Policy for existing users. In Development 2026-10-05.", state: "latest" },
        { key: "EAINT-12228", date: "2026-08", what: "Forgot Password link. SRD v1.1 2026-09-24. In Development 2026-10-05.", state: "latest" },
        { key: "EAINT-12275", date: "2026-09", what: "Server does not check Password = Confirm. Existing prod issue under EAINT-148.", state: "latest" },
        { key: "EAINT-12234", date: "2026-08", what: "Inactive UCD account management proposal (notify and restrict by months of no activity). On Hold 2026-09-02.", state: "latest" },
      ],
      openQuestions: [
        "Is the 24-hour pop-up the intended inactivity rule, and what is the real server session expiry? (prod code hides it; EAINT-12234 inactive-account proposal is On Hold)",
        "EAINT-12228 says its confirmed requirements supersede some of its own original text; the cut text is not visible.",
      ],
    },
    // ------------------------------------------------------------------
    {
      id: "mykad-thumbprint",
      name: "MyKad and thumbprint reader (and the MyKad Reader Emulator)",
      summary:
        "Pages that need identity use one widget (mykad-websocket-v2.js). It opens ws://localhost:7878/IDCard and waits for a MyKad and a thumbprint. QA uses an emulator instead of the real Dermalog device.",
      portals: ["UCD", "AATF"],
      triggers: [
        {
          id: "ucd-pages",
          name: "UCD pages that need a card read",
          entry: "UCD › STMS Step 1 and 3; UCD to UCD; eSTM Step 1 and 3; BMK Step 1 and 3; eSerahan Permission; Insurance Permission; Company Profile Update Step 3; Manage Users add; first login of a new Main UCD",
          sources: [AZ_7229, BR, { kind: "ts", ref: "EAINT-7229 7229_DD_TS1" }],
          steps: [
            {
              title: "Reach the thumbprint screen",
              where: "The module's authentication step",
              detail: "Screen text \"Please insert MyKad into the reader.\" with Cancel and Read MyKad. Next is blocked until the read passes.",
              sources: [{ kind: "ts", ref: "EAINT-7229 DD/MK/AS sheets" }, BR],
            },
            {
              title: "Read the MyKad, then the thumbprint",
              where: "Widget on the page",
              detail: "Page opens ws://localhost:7878/IDCard and sends INIT, then READCARD. After a good read: \"Place Thumb on reader\", then Matching Result \"Identical\" and Next unlocks. Auto Scan reads within 3 READCARD intervals, then a manual read.",
              branches: [
                { when: "No device", then: "\"Please plug in Dermalog Biometric Device and click [Reconnect]\"." },
                { when: "Device unplugged", then: "\"Unable to read photo. Please try again.\"" },
                { when: "No card", then: "\"No card is detected. Please insert IC and click [Scan IC] to try again.\"" },
                { when: "Connection to the local service fails", then: "Page shows \"Update Required - Please update Dermalog Biometric Device...\". This is a failed socket, not a version problem." },
              ],
              sources: [BR, AZ_MYK, MYK],
            },
          ],
        },
        {
          id: "aatf-pages",
          name: "AATF pages that need a card read",
          entry: "AATF › Dereg Step 1 owner and Step 3 AATF rep; Upload COD Step 1; Manage Users; First Time Login; Create New AATF Company Account",
          sources: [AZ_7229, { kind: "mine", ref: "knowledge/flow-edereg.md §6" }],
          steps: [
            {
              title: "Read the owner or login user's card",
              where: "AATF Dereg Step 1 (\"Please use Owner's MyKad.\") and Step 3 (\"Please use login user's MyKad\")",
              detail: "Same widget as UCD.",
              sources: [{ kind: "mine", ref: "knowledge/flow-edereg.md §6" }],
            },
          ],
        },
        {
          id: "emulator",
          name: "QA: MyKad Reader Emulator",
          entry: "http://localhost:7878 control panel",
          summary: "A real client page must stay open or the widget stays on \"Scanning IC...\".",
          sources: [MYK_LIVE, AZ_MYK],
          steps: [
            {
              title: "Open the panel and connect",
              where: "http://localhost:7878 › Connect",
              detail: "Pick a Quick Profile (johan, gstesttest, testucd) or a saved profile. Profiles saved in a human browser are not visible to automation, so pass NRIC and name instead.",
              sources: [MYK],
            },
            {
              title: "Insert Card when the page asks",
              where: "Emulator › Insert Card",
              detail: "Sends INSERTCARD with the JSON; the page shows \"INSERTCARD OK\", then \"Verification Passed / Verification Completed\". Insert the card AFTER the page asks, because INIT wipes card state. The card ejects after each use, so insert again before each auth screen. Close the emulator tab after each insert.",
              sources: [MYK_LIVE, AZ_MYK],
            },
          ],
        },
        {
          id: "bypass-url",
          name: "QA: thumbprint URL bypass on some instances",
          entry: "/<instance>/<bypass>/<instance>/view/...",
          summary: "Skips the reader. Likely on /uat3. Not confirmed.",
          sources: [AZ_MYK],
          steps: [
            {
              title: "Open the bypass URL",
              where: "Browser address bar (QA instance only)",
              detail: "Goes to the page with the reader skipped. For eSTM the older zzz/<slot> bypass is replaced by the emulator for EAINT-12412.",
              sources: [AZ_MYK, { kind: "mine", ref: "knowledge/flow-estm.md §The bypass" }],
            },
          ],
          affects: [],
        },
      ],
      affects: [
        { text: "Unlocks the next step of the host flow: STMS, UCD to UCD, eSTM, BMK, eDereg, Company Profile, user management.", sources: [AZ_MYK, MYK] },
        { text: "Weekly WebSocket and Java Applet usage statistics email (EAINT-11935, Done 2026-08-21).", sources: [AZ_7229, { kind: "jira", ref: "EAINT-11935" }] },
      ],
      cronjobs: [
        { name: "WebSocket / Java Applet usage statistics", schedule: "Weekly (day not recorded)", does: "Compiles and emails usage statistics of WebSocket and Java applet readers.", sources: [AZ_7229, { kind: "jira", ref: "EAINT-11935" }] },
      ],
      roles: [
        { text: "The card must match the right party. A UCD user's own IC is refused as company seller rep; the Main user's IC is needed at activation.", sources: [AZ_MYK] },
        { text: "The emulator is a different system from eSIM. It is local on the tester's machine; eSIM needs VPN.", sources: [MYK] },
      ],
      afterCompletion: [{ text: "n/a. It is an authentication step.", sources: [MYK] }],
      rules: [
        { text: "Chrome blocks a public page from reaching ws://localhost (net::ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS). Fix: launch Chrome with --disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessChecks. Confirmed 2026-08-22.", sources: [MYK, AZ_MYK] },
        { text: "Browsers: Chrome 139 (WebSocket, P1), Edge 139 (WebSocket, P2), Firefox 36.0.4 (Java applet, P1). Firefox below 36 is blocked.", sources: [{ kind: "ts", ref: "EAINT-7229 Browsers" }, AZ_PORTAL] },
        { text: "Fresh Playwright contexts need camera, microphone and midi pre-granted. The exact permission name behind the first prompt is not confirmed.", sources: [MYK], unconfirmed: true },
        {
          text: "The emulator flow works in practice even though the page script can close itself with multiple sessions (hTotalActiveSession).",
          sources: [MYK],
          alt: [{ text: "The portal hard-codes the default channel, so one run per machine unless the channel is relayed per lane. Port 7878 may also be held by DermalogMyBioIDService.exe (the real reader service).", sources: [AZ_MYK], note: "Azfar's trap list." }],
        },
        { text: "Responses are HMAC-signed. Whether eAuto checks the signature is not known.", sources: [AZ_MYK], unconfirmed: true },
        { text: "Installer v2 (EAINT-9944) was on hold per BA on 2026-04-16 and never went live (Closed 2026-08-28). A WebSocket reconnect button (EAINT-12332) is To Do.", sources: [BR, AZ_MYK, { kind: "jira", ref: "EAINT-12332" }] },
      ],
      scopeToCheck: [
        { text: "Any new thumbprint screen must use the same widget and block Next until the read passes.", sources: [MYK] },
        { text: "Messages for no device, no card, unplugged device.", sources: [BR] },
        { text: "Chrome WebSocket and Firefox applet each work with one happy flow per module.", sources: [BR] },
        { text: "Check the Download page and the Dermalog installer links on login and UCD / AATF download pages.", sources: [{ kind: "ts", ref: "EAINT-7229 Download Time sheet" }] },
      ],
      tickets: [
        { key: "EAINT-7229", date: "2025-12", what: "Chrome WebSocket replaces Firefox Java applet. Live S24.3-20251217.", state: "latest" },
        { key: "EAINT-9590", date: "2026-01", what: "Applet re-signed. Live S25.2-20260105.", state: "latest" },
        { key: "EAINT-9944", what: "Installer version check. On hold, never live.", state: "legacy" },
        { key: "EAINT-9894", date: "2026-02", what: "V1 Standardise browser to Chrome. Closed 2026-09-14, never live.", state: "legacy", supersededBy: "EAINT-12253" },
        { key: "EAINT-9895", date: "2026-02", what: "V2 Standardise browser to Chrome. Closed 2026-09-14.", state: "legacy", supersededBy: "EAINT-12253" },
        { key: "EAINT-12332", date: "2026-09", what: "WebSocket reconnect flow with Windows-handler toggle. To Do.", state: "latest" },
        { key: "EAINT-11935", date: "2026-07", what: "Weekly WebSocket and applet usage email. Done.", state: "latest" },
        { key: "EAINT-9306", date: "2026-08", what: "Emulator built for eDereg.", state: "latest" },
        { key: "EAINT-12412", date: "2026-10", what: "Emulator reused for eSTM TS12.", state: "latest" },
      ],
      openQuestions: [
        "Does eAuto verify the HMAC or wsPublicKey? (Azfar Q2)",
        "Is the emulator signed off as matching the real reader? (Azfar Q3)",
        "What are mykad-bypass.do and mykad-without.jsp? (Azfar Q5; without.do is dead code per Ask eAuto)",
      ],
    },
    // ------------------------------------------------------------------
    {
      id: "firefox-to-chrome",
      name: "Firefox to Chrome messages (Announcement popup and Browser Reminder)",
      summary:
        "Firefox support ends 31 December 2026. From 1 January 2027 users must use Google Chrome. Two messages tell Firefox users: a popup on the home page (live) and a reminder at the last step of a transaction (not live yet).",
      portals: ["UCD", "AATF"],
      triggers: [
        {
          id: "homepage-popup",
          name: "Announcement popup on the home page (EAINT-12180)",
          entry: "UCD or AATF Homepage after login, in Firefox",
          summary: "Live since S33.3-20260908. Once per login session. Never in Chrome.",
          sources: [AZ_PORTAL, { kind: "jira", ref: "EAINT-12180" }],
          steps: [
            {
              title: "Log in with Firefox",
              where: "UCD / AATF login",
              detail: "Popup \"Announcement 公告\" shows with buttons: View PDF Guide (new tab), Watch Tutorial Video (video overlay), user guide (same tab, USER GUIDE page).",
              sources: [AZ_PORTAL, { kind: "azfar", ref: "cr/EAINT-12180/LEDGER.md" }],
            },
            {
              title: "Close the popup",
              where: "Popup close",
              detail: "UCD then shows the Company / Business Profile update banner. AATF shows the ANNOUNCEMENT / PENGUMUMAN banner.",
              sources: [AZ_PORTAL],
            },
          ],
        },
        {
          id: "last-step-reminder",
          name: "Browser Reminder at the last step (EAINT-12253)",
          entry: "Final step after a successful payment or submission, in Firefox below 37",
          summary: "Not live. Deployed to /uat1/ on 2026-10-21; Jira status \"Testing In 1st Env\".",
          sources: [AZ_PORTAL, { kind: "jira", ref: "EAINT-12253" }],
          steps: [
            {
              title: "Reach the final step",
              where: "STMS Step 6; eSTM Step 6 or Insurance Step 4; BMK Step 6; APT Step 6; JomCheck result; Service Hub Submission (open); Dereg Step 6 / pre-check Step 3 result",
              detail: "\"Browser Reminder 浏览器提醒\" shows on every load of that page. Never before payment and never after a failed payment. Text: Firefox support ends 31 December 2026; from 1 January 2027 use Google Chrome (Firefox usage 42%, WebSocket 50%).",
              sources: [AZ_PORTAL, { kind: "jira", ref: "EAINT-12253" }],
            },
            {
              title: "Dismiss it",
              where: "Popup buttons",
              detail: "Continue 继续 or the X (#ebrCloseBtn) hides it. Esc does nothing. View User Guide opens in a new tab. Nothing is blocked before 1 January 2027.",
              sources: [AZ_PORTAL],
            },
          ],
        },
      ],
      affects: [
        { text: "STMS (including UCD to UCD and Wholesale), eSTM, BMK, APT, Insurance, Service Hub, JomCheck, Deregistration, eDereg Pre-Checking.", sources: [AZ_PORTAL, { kind: "jira", ref: "EAINT-12253" }] },
        { text: "Not shown on Company / Business Profile Update. Chained eSTM to Insurance shows it at Insurance Step 4 only. STMS Bulk Payment never shows it in Firefox 36.", sources: [AZ_PORTAL] },
      ],
      cronjobs: [],
      roles: [{ text: "All Firefox users of UCD and AATF, Main and Sub, with or without the profile-update banner.", sources: [{ kind: "azfar", ref: "cr/EAINT-12180/LEDGER.md" }] }],
      afterCompletion: [{ text: "n/a.", sources: [AZ_PORTAL] }],
      rules: [
        { text: "Popup helpers in tests that close any .ui-dialog hide these popups. Stop before the last step and do the final navigation in the spec.", sources: [AZ_TEST] },
        { text: "Prod code: an \"unsupported browser\" page still tells users to download old Firefox 36.0.4 for the legacy signing applet. This points the opposite way to the Chrome announcement above. The home page announcement shows only to browsers that report as Firefox 36.", sources: [ASK_ACC], unconfirmed: true },
        { text: "\"Once per transaction\" was dropped by the BA on 2026-10-21.", sources: [AZ_PORTAL] },
        { text: "Browser priority: UCD and AATF Firefox; BO and JPJ Chrome then Firefox, until 1 Jan 2027, then Chrome only.", sources: [BR] },
      ],
      scopeToCheck: [
        { text: "Popup in Firefox, absent in Chrome; each button works.", sources: [{ kind: "azfar", ref: "cr/EAINT-12180/LEDGER.md" }] },
        { text: "Reminder at every final step; not before payment; not on failed payment.", sources: [AZ_PORTAL] },
        { text: "Check it does not hide behind other popups (campaign, What's New).", sources: [AZ_TEST] },
      ],
      tickets: [
        { key: "EAINT-12180", date: "2026-08", what: "Homepage announcement popup. Done 2026-09-08.", state: "latest" },
        { key: "EAINT-12253", date: "2026-09", what: "Browser Reminder at last step. Testing in 1st env 2026-10-21.", state: "latest" },
        { key: "EAINT-12574", date: "2026-10", what: "Child of 12253 (AATF / UCD last-step pages). Closed.", state: "latest" },
        { key: "EAINT-12229", date: "2026-09", what: "Banner-style announcement revamp. To Do.", state: "latest" },
        { key: "EAINT-11835", date: "2026-07", what: "User Guide page. Live S31.2-20260708.", state: "latest" },
      ],
      openQuestions: [
        "12253 questions still open in Azfar's notes: on arrival vs final button (Q3), Bulk (Q5), chained transactions (Q6), Interstate UCD A submit (Q7), Wholesale (Q9), Service Hub (Q10), APT final step (Q23).",
        "Whether the announcement still shows after 31 December 2026 (SRD V1.2 unread).",
      ],
    },
    // ------------------------------------------------------------------
    {
      id: "jpj-submission",
      name: "JPJ enquiry, final submission and Official Receipt (shared rules)",
      summary: "Rules that every JPJ module shares: BRN in the request, field lengths, the JPJ Official Receipt email and the status crons.",
      portals: ["UCD", "AATF", "Back Office", "Backend"],
      triggers: [
        {
          id: "module-submit",
          name: "Any module sends an enquiry or final submission to JPJ",
          entry: "STMS, APT, eSTM (with eLKM and eVOC), eDereg Pre-Checking, BMK, Dereg",
          sources: [{ kind: "jira", ref: "EAINT-8622" }, { kind: "jira", ref: "EAINT-9204" }],
          steps: [
            {
              title: "Module sends the JPJ enquiry with BRN",
              where: "Backend (module step: JPJ Check)",
              detail: "Only STMS, APT, eSTM, eDereg Pre-Check and BMK send BRN. Old to New BRN switch done by EAINT-8622 (Done 2026-10-21). 24/24 TS passed on staging/uat3 with eSIM; only 1 of 24 against JPJ staging.",
              sources: [{ kind: "jira", ref: "EAINT-8622" }],
              branches: [
                { when: "JPJ returns VEL000008E or REF000006E", then: "Backend switches BRN type (Old to New or New to Old) and resubmits (EAINT-12578, Testing 2026-10-22)." },
              ],
            },
            {
              title: "JPJ Official Receipt arrives",
              where: "JPJ mailbox (Microsoft 365)",
              detail: "JPJ emails the receipt. A mailbox poll reads it every few minutes and attaches it to the transaction details (EAINT-9204 covers STMS, TH, eSTM, APT, BMK, eDereg Pre-Checking).",
              affects: ["Transaction details pages", "Report Engine PDFs"],
              sources: [{ kind: "jira", ref: "EAINT-9204" }, { kind: "jira", ref: "EAINT-12222" }],
            },
          ],
        },
      ],
      affects: [
        { text: "Transaction details pages of STMS, APT, eSTM, BMK and eDereg Pre-Checking (receipt button). Insurance JPJ status (EAINT-3170).", sources: [{ kind: "jira", ref: "EAINT-9204" }, { kind: "jira", ref: "EAINT-12171" }] },
        { text: "Engine no and chassis no max length is 60 characters from 2026-10-01 (old eSTM 22 and 30). Report Engine PDF templates clip at 26-40 characters.", sources: [{ kind: "jira", ref: "EAINT-12216" }] },
        { text: "JPJ Digital MySikap Revamp live 2026-10-01.", sources: [{ kind: "jira", ref: "EAINT-12216" }] },
      ],
      cronjobs: [
        { name: "JPJ Status (insurance)", schedule: "Every 1 minute, 8am-11pm (prod 2026-09-10)", does: "Polls JPJ status for insurance, eAuto and Secarang.", sources: [{ kind: "jira", ref: "EAINT-12171" }] },
        { name: "Cover Note (insurance)", schedule: "eAuto every 5 minutes, Secarang every 1 minute, 8am-11pm", does: "Cover note submission and polling.", sources: [{ kind: "jira", ref: "EAINT-12171" }] },
        { name: "JPJ Official Receipt mailbox poll", schedule: "Every few minutes", does: "Reads the M365 mailbox. On throttling it skips emails and still moves the last-checked marker, so receipts can be lost. Fix in Code Review: retry, never skip unread emails, daily Teams report at 08:00 MYT.", sources: [{ kind: "jira", ref: "EAINT-12222" }] },
        { name: "JPJ monthly report", schedule: "Monthly (proposed)", does: "Auto-email completed transactions without a JPJ Official Receipt to JPJ Hasil (EAINT-12120 To Do) and a monthly report to a JPJ email (EAINT-11865 To Do). Prod code: a JPJ monthly report job already exists in eauto-cron (on by default). Once a month it builds last month's JPJ reconciliation report and emails or uploads it. Run time is a hidden setting. See also Back Office JPJ Monthly Report (EAINT-639).", sources: [{ kind: "jira", ref: "EAINT-12120" }, { kind: "jira", ref: "EAINT-11865" }, { kind: "askeauto", ref: "prod code prod/master (2026-10-22) — scheduled job list (eauto-cron service)", date: "2026-10-23" }], unconfirmed: true },
        { name: "Other old in-app jobs: document batch job and FLI export job", schedule: "Times come from configuration (not readable)", does: "Document batching and an export feed. Prod code shows only the definitions; whether they run in production is not confirmed.", sources: [{ kind: "askeauto", ref: "prod code prod/master (2026-10-22) — scheduled job list, old in-app scheduler (non-production reference copy; prod file withheld)", date: "2026-10-23" }], unconfirmed: true },
      ],
      roles: [{ text: "Backend; Ops and IT own the mailbox and crons.", sources: [{ kind: "jira", ref: "EAINT-12222" }] }],
      afterCompletion: [{ text: "Transaction goes to JPJ; the receipt comes back by email.", sources: [{ kind: "jira", ref: "EAINT-9204" }] }],
      rules: [
        { text: "JPJ enquiry inside check.do ignores its usage code (note in EAINT-12562).", sources: [{ kind: "jira", ref: "EAINT-12562" }] },
        { text: "JPJ receipt email goes to systemtest@eauto.my while a branch is connected to JPJ staging, so Mailtrap will not show it.", sources: [{ kind: "mine", ref: "knowledge/mailtrap.md", date: "2026-09-17" }] },
      ],
      scopeToCheck: [
        { text: "Each JPJ module with an old and a new BRN.", sources: [{ kind: "jira", ref: "EAINT-8622" }] },
        { text: "Engine and chassis max 60 in forms, JPJ request and PDFs.", sources: [{ kind: "jira", ref: "EAINT-12216" }] },
        { text: "Receipt button on each module's details page.", sources: [{ kind: "jira", ref: "EAINT-9204" }] },
      ],
      tickets: [
        { key: "EAINT-8622", date: "2025-07", what: "Old BRN to New BRN. Done 2026-10-21.", state: "latest" },
        { key: "EAINT-12578", date: "2026-10", what: "BRN type switch on VEL000008E / REF000006E. Testing.", state: "latest" },
        { key: "EAINT-12216", date: "2026-08", what: "Field length 60 characters. Done.", state: "latest" },
        { key: "EAINT-9204", date: "2025-11", what: "JPJ Official Receipt (53 sub-tasks). Done 2026-10-20.", state: "latest" },
        { key: "EAINT-12222", date: "2026-08", what: "Receipt mailbox poll fix. Code Review.", state: "latest" },
        { key: "EAINT-12171", date: "2026-08", what: "Standard insurance cron intervals. Done.", state: "latest" },
        { key: "EAINT-3170", what: "Insurance JPJ status cron start at 8am.", state: "legacy", supersededBy: "EAINT-12171" },
      ],
      openQuestions: [],
    },
    // ------------------------------------------------------------------
    {
      id: "notifications-email",
      name: "Notifications: emails and WhatsApp (staging checks)",
      summary: "How QA reads staging emails and the notification rules that cross modules.",
      portals: ["Mailtrap sandbox", "WhatsApp (MessageBird / MacroKiosk)", "eSIM"],
      triggers: [
        {
          id: "staging-email",
          name: "Any staging email (appointment, reminder, approval, JomCheck OTP)",
          entry: "Mailtrap inbox https://mailtrap.io/sandboxes/2581833/messages (one shared inbox for all testers and environments)",
          sources: [MAIL],
          steps: [
            {
              title: "Check in a browser already signed in to Mailtrap",
              where: "modefair.com Chrome profile",
              detail: "The team does not use the Mailtrap API. Automation copies the Chrome profile session, launches headed Chrome and reads the first 40 rows. Signed out means blocked, never pass.",
              sources: [MAIL],
            },
            {
              title: "Match the email",
              where: "Mailtrap list",
              detail: "Match by vehicle no in subject, to or from. Assert exactly one (or none). Scope by recipient, subject and time window.",
              sources: [MAIL],
            },
          ],
        },
        {
          id: "insurance-whatsapp",
          name: "Insurance WhatsApp messages",
          entry: "Insurance events: failed cover note, JPJ rejected, referred-risk video, monthly commission, renewal reminder",
          sources: [{ kind: "mine", ref: "knowledge/eauto-insurance.md §notifications" }, BR],
          steps: [
            {
              title: "Event happens in the insurance flow",
              where: "Insurance / Secarang backend",
              detail: "Failed cover note and JPJ rejected go to the support number only. Secarang payment success goes to the user. EAINT-12342 keeps failure alerts only for eAuto insurance.",
              sources: [{ kind: "mine", ref: "knowledge/teams-decisions-by-ticket.md EAINT-11759, EAINT-12342", date: "2026-09-14" }],
            },
          ],
        },
      ],
      affects: [
        { text: "Which emails reach Mailtrap: BMK email, eVOC email, JomCheck OTP / WhatsApp. SI / BDP appointment emails (sender support@eauto.my).", sources: [MAIL] },
        { text: "Which do not: Dereg (JPJ sends email + COD to the entered address) and eAuto Insurance policy emails (Takaful, TPFT, Chubb, Tokio Marine).", sources: [MAIL] },
        { text: "Approving an onboarding application sends 3 emails (EAINT-12341 / 12461).", sources: [BR] },
      ],
      cronjobs: [
        { name: "Insurance quotation reminder", schedule: "Hourly, 07-23", does: "Emails UCD for quotations not purchased.", sources: [{ kind: "mine", ref: "knowledge/flow-quotation-reminder.md" }] },
        { name: "Secarang renewal reminders (MacroKiosk)", schedule: "9:00 AM (7 days), 12:00 PM (14 days), 9:00 PM (30 days)", does: "Sends WhatsApp renewal reminders in 9 templates (EAINT-12218).", sources: [{ kind: "jira", ref: "EAINT-12218" }] },
        { name: "Monthly insurance commission", schedule: "2nd of the month", does: "Notifies the UCD director of commission earned.", sources: [BR] },
      ],
      roles: [{ text: "Mailtrap sign-in in the modefair.com Chrome profile. The browser reader cannot run on GitHub Actions.", sources: [MAIL] }],
      afterCompletion: [{ text: "Mailtrap inbox or the recipient mailbox.", sources: [MAIL] }],
      rules: [
        { text: "Fake test emails use @testingz.com. Do not use @yopmail.com or disposables. @modefair.com is fine on eSIM except Deregistration, and not when staging is connected to JPJ staging or RHB staging. Secarang and CIBO use @modefair.com.", sources: [MAIL, { kind: "mine", ref: "memory feedback_test-emails-testingz-domain" }] },
        { text: "SI appointment email subject \"eAuto: Your Software Installation Appointment is Confirmed - [UCD Company Name]\" fires once on confirm. The em-dash shows as \"?\" (known encoding defect). Baseline CS number 03-27798899.", sources: [MAIL, { kind: "azfar", ref: "automation/src/data/email-contracts.ts" }] },
      ],
      scopeToCheck: [
        { text: "Sender, recipient, subject, body fields, link, count (exactly one) and timing.", sources: [MAIL] },
        { text: "WhatsApp recipient lists.", sources: [BR] },
      ],
      tickets: [
        { key: "EAINT-11864", date: "2026-08", what: "Quotation reminder email.", state: "latest" },
        { key: "EAINT-11759", date: "2026-09", what: "Secarang WhatsApp recipients.", state: "latest" },
        { key: "EAINT-12342", date: "2026-09", what: "Insurance failure alerts only. Done.", state: "latest" },
        { key: "EAINT-12218", date: "2026-08", what: "9 MacroKiosk reminder templates. Done 2026-10-05.", state: "latest" },
        { key: "EAINT-8536", what: "WhatsApp notification to the insurance support number.", state: "latest" },
      ],
      openQuestions: [
        "Mailtrap DOM selectors are not confirmed; reminder subject unknown.",
        "Which insurance emails bypass Mailtrap is not confirmed.",
      ],
    },
    // ------------------------------------------------------------------
    {
      id: "mobile-app",
      name: "eAuto mobile app (Android / iOS) parity with web",
      summary: "The app shares the web database. Its screens are being aligned to the web portal. The web portal is the reference.",
      portals: ["Android / iOS app"],
      triggers: [
        {
          id: "app-release",
          name: "App release phases",
          entry: "eAuto-App phases 3-6 (EAINT-9805 Phase 6 = STMS parity with production web as of 2026-01-29)",
          sources: [{ kind: "jira", ref: "EAINT-9805" }],
          steps: [
            {
              title: "Web change ships first, then an app ticket aligns it",
              where: "Jira sub-tasks under the app tickets",
              detail: "Examples in Code Review or Development on 2026-10-19 to 22: LKM Refund module (12567), usage code AH (12553), Transaction Restriction popup S00044 (12552), Perakuan per SRD v1.1 and JPJ Official Receipt in eSTM (12551), tile price RM25 to RM35 (12550). Android: rooted device handling (12570 Done), backend changelog alignment (12575 Done), eSTM city list per state (12568 Done).",
              sources: [{ kind: "jira", ref: "EAINT-12551" }, { kind: "jira", ref: "EAINT-12570" }],
            },
          ],
        },
        {
          id: "app-screens",
          name: "What the app can reach (prod code)",
          entry: "App login POST /public/mb/login.do, session check GET /public/mb/session.get, version and block check GET /public/mb/settings.get",
          summary: "The app is a thin companion to the UCD web portal. It has no entry point to create a new STMS or eSTM transaction. Nothing outside the app (email, banner, JPJ notice, cronjob) starts a mobile flow.",
          sources: [ASK_MB],
          steps: [
            { title: "Login and version check", where: "AccessController (same controller as web login); MobileAppSettingController", detail: "Login is session based and limited to UCD shared users. settings.get returns versionName, versionCode and the block flag.", sources: [ASK_MB] },
            { title: "STMS: payment and listing", where: "/mb/ucd/stms/transaction/payment.do, make-payment.do; StmsPaymentController; StmsEnquiryController", detail: "Open the payment screen, pay, retry a failed RHB payment, reset the payment timer, list and view transactions, generate the PDF and invoice PDF. The transaction itself must be created on the web.", sources: [ASK_MB] },
            { title: "eSTM: payment and add-on fees", where: "EstmPaymentController; addon-fee.get", detail: "Same pattern as STMS: view, pay, retry, reset timer. addon-fee.get looks up LKM and eVOC fees.", sources: [ASK_MB] },
            { title: "SSM company verification", where: "SsmTransactionController, EstmSsmTransactionController, SsmPaymentController, EstmSsmPaymentController, SsmEnquiryController", detail: "Search company, view and verify, upload company attachment, check permission, pay, retry, reset timer, generate invoices.", sources: [ASK_MB] },
          ],
        },
      ],
      affects: [
        { text: "Prod code: payments and verifications from the app land in the same tables and listings as web (STMS and eSTM listings, BO transaction views, payment reports). JPJ submission, e-Invoice and email, SMS or WhatsApp follow the normal web-side handlers.", sources: [ASK_MB] },
        { text: "Prod code: SSM, LKM and eVOC (add-on fee and status inside eSTM) are reachable from the app. BMK, OTH, JomCheck, Dereg, Insurance, Credit/Bank portals and BackOffice have no mobile endpoints.", sources: [ASK_MB] },
        { text: "App STMS and eSTM follow web rules. In production code the app's own eSTM entry points are commented out.", sources: [{ kind: "jira", ref: "EAINT-9805" }, { kind: "askeauto", ref: "Q6 eSTM / eSerahan (prod code)", date: "2026-10-23" }] },
      ],
      cronjobs: [],
      roles: [
        { text: "Dealers (UCD users).", sources: [{ kind: "jira", ref: "EAINT-9805" }] },
        { text: "Prod code: mobile login is limited to UCD shared users. No JPJ, Bank, Insurance, AATF or BackOffice access through the mobile API. Every /mb/ucd/* call goes through UcdMobileApiFilter. STMS calls also pass MobileSistemTukarMilikSementaraFilter and eSTM calls pass MobileEstmPermissionFilter. The isBlock flag is checked by all three filters and by MobilePermissionFilter. Companies that use 2-layer (creator and approver) eSTM approval are blocked from the mobile eSTM flow.", sources: [ASK_MB] },
      ],
      afterCompletion: [{ text: "Same database as web.", sources: [TD, ASK_MB] }],
      rules: [
        { text: "Statuses: the app adds none. It reads and writes the same STMS and eSTM statuses as web. The only mobile-specific value is the app-level isBlock on/off switch, which disables mobile access and does not touch transaction status.", sources: [ASK_MB] },
        { text: "Prod code: the internal knowledge base lists mobile endpoints such as auth-seller.do, mykad-buyer.do, jpj/enquiry.do and create-permission.get, but none exist in the current STMS, eSTM or JPJ controllers. Treat that document as stale.", sources: [ASK_MB] },
        {
          text: "Web is the reference (\"same as Production Web Portal\"). Mobile twin tickets: EAINT-12559 (JPJ Official Receipt) and EAINT-12560 (usage code AH) are To Do.",
          sources: [{ kind: "jira", ref: "EAINT-9805" }, { kind: "jira", ref: "EAINT-12559" }],
        },
      ],
      scopeToCheck: [
        { text: "When a web wording, fee or receipt rule changes, check if an app twin ticket exists.", sources: [{ kind: "jira", ref: "EAINT-12551" }] },
      ],
      tickets: [
        { key: "EAINT-9805", date: "2026-01", what: "Phase 6 STMS parity with web.", state: "latest" },
        { key: "EAINT-12567", date: "2026-10", what: "App LKM Refund module. In Development.", state: "latest" },
        { key: "EAINT-12551", date: "2026-10", what: "App Perakuan and JPJ Official Receipt in eSTM. Code Review.", state: "latest" },
        { key: "EAINT-12570", date: "2026-10", what: "Android rooted device handling. Done.", state: "latest" },
        { key: "EAINT-12558", date: "2026-10", what: "Merge Staging into develop (phases 3-6). Done.", state: "latest" },
      ],
      openQuestions: [
        "iOS status is not recorded. The prod-code answer covers the Android API only.",
        "Prod code shows no mobile seller/buyer MyKad, data-entry or JPJ steps for STMS and eSTM, but web twin tickets (for example 12551 Perakuan, 12559 JPJ Official Receipt) imply the app has these screens. Confirm which repo or branch holds them.",
      ],
    },
  ],
};
