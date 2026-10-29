# Platform: login, passwords, MyKad / browser, JPJ submission, notifications, mobile app (flow)

Built 2026-10-23 for /eauto/flows; data mirror: lib/eautoFlows/modules/platform.ts

Provenance tags: [azfar: ...] = colleague Azfar's QA repo copy at _reference/codebases/eauto-qa-azfar; [mine: ...] = our own knowledge files; [jira: ...]; [ts: ...]; [miro: ...]; [askeauto: ...] = Ask eAuto chatbot answers from prod code. [unconfirmed] = lead, not fact. "Conflict:" = two versions kept.

## Purpose
- Things that every module shares. Login and password rules apply to all portals. Thumbprint pages use the same MyKad reader widget in UCD and AATF. The browser messages move Firefox users to Chrome before 1 January 2027. JPJ enquiry and submission rules, staging emails and the mobile app also sit here.
- Portals: UCD, AATF, Back Office, Service Portal, Insurance portal, Android / iOS app
- Related modules: ucd-portal, backoffice, qa-tools, estm, dereg, stms, bmk
- Detailed draft flow for the Firefox→Chrome reminder (EAINT-12253 / 12180 / 12574): knowledge/flow-browser-reminder.md (added 2026-10-26)

## Glossary
- Dermalog: Maker of the biometric (MyKad + thumbprint) reader. The portal talks to the reader service over a local WebSocket. [azfar: knowledge/_core/mykad-emulator.md] [mine: knowledge/mykad-emulator.md]
- Java applet: Old way to read the card. Still used by Firefox 36.0.4. Replaced by WebSocket in Chrome by EAINT-7229. [azfar: knowledge/_core/mykad-emulator.md] [azfar: cr/EAINT-7229/LEDGER.md]
- MyKad Reader Emulator: QA tool at http://localhost:7878 that acts as the card reader and thumbprint. Different from eSIM. [mine: knowledge/mykad-emulator.md] [azfar: knowledge/_core/mykad-emulator.md]
- Perakuan: Declaration ticked before a thumbprint. The thumbprint stays hidden until it is ticked. [azfar: knowledge/_core/glossary.md]
- BRN: Business registration no. sent to JPJ in enquiry and final submission (old or new format). Only STMS, APT, eSTM, eDereg Pre-Check and BMK send it. [jira: EAINT-8622]
- Mailtrap: Shared staging email inbox for all testers and environments. [mine: knowledge/mailtrap.md]

## Flow: Login, password policy and Forgot Password
- One password policy for all portals: 12 to 30 characters with upper case, lower case, a number and a special character. Users can also reset a password from the login page.
- Portals: UCD, AATF, Back Office, Service Portal, Insurance portal, Bank / Credit

### Entry points and steps
- Entry point "New user created or password set (EAINT-12155)": Any portal › create user / company account pages (also AATF Add New User Account) [mine: knowledge/teams-decisions-by-ticket.md] [jira: EAINT-12155]
  1. Admin creates the user or sets a password | where: BO › Create New User / Company Account; UCD Main user › Manage Users; AATF › Add New User Account | Password must follow the new policy. System-made passwords were weaker than the policy before this change (temporary password was 6 random letters; the AATF sub-user default was fixed in code). [mine: knowledge/teams-decisions-by-ticket.md] [jira: EAINT-12155]
  2. User logs in for the first time | where: /<env>/public/login | A Sub UCD first login needs "Current Password" and "Confirm Password" because the temporary password is not pre-filled. [mine: knowledge/teams-decisions-by-ticket.md]
- Entry point "Existing user changes password (EAINT-12125)": Any portal › Change Password [mine: knowledge/teams-decisions-by-ticket.md] [jira: EAINT-12125]
  1. User opens Change Password and saves a new password | where: Any portal › Change Password page | Existing users may update but are not forced before login. When an admin changes a user's password, the old format is still allowed and the user sees "Please change your password." on the next login. [mine: knowledge/teams-decisions-by-ticket.md]
     - Same page, no popup: "he suggested to remain users to change password at same page instead of popups ya." [from Teams EAINT-12155, 2026-08-21 09:52, Yi Link Lim]
     - Two buttons on the existing-user screen: "Continue to Login - allow UCD to login with existing password regardless of any value entered in password field. Update Password & Continue - ensure UCD update password with new pw policy and redirect them to home page" [from Teams EAINT-12155, 2026-09-04 10:47, Yi Link Lim] [unconfirmed] posted in the 12155 testing thread; confirm it is the 12125 screen.
     - Live check and on-screen hint: "rmb to add text display on screen to inform user on password limitation when they reset & change ... Expected behaviour: System should auto check when user finish entered both "new pw" & "Confirm pw"" [from Teams EAINT-12155, 2026-08-11 11:35, Yi Link Lim]
     - Conflict on scope: the Miro card lists "eAuto - Core (App)", "eAuto - Service Portal", "Secarang", "CIBO" and "Cross portal?", but not JPJ, Bank/Credit or Insurance from the six-portal list above; Teams says the app is not tested separately. SRD v1.0 (2026-09-01) is not in the repo. [from Miro card EAINT-12125, captured 2026-10-26] [source: Studying EAINT-12125 study §10 #2, #5, 2026-10-27]
- Entry point "Forgot Password link on the login page (EAINT-12228)": Login page › Forgot Password (below the login box); also AATF and sub AATF [mine: knowledge/teams-decisions-by-ticket.md] [jira: EAINT-12228]
  1. Click Forgot Password | where: Login page › Forgot Password | Goes to a new Forgot Password page, not the existing Change Password page. [source: Jira EAINT-12228 description, Additional Note "Confirmed requirements as at 11.09.2026", read 2026-10-26: "The link redirects the user to a new Forgot Password page, not the existing Change Password page."]
  2. Verify and set a new password | where: Forgot Password page | A Main User (UCD / AATF) enters a verification code sent to the registered email address. SMS and MessageBird are not used. Code valid 5 minutes, max 5 wrong attempts, max 3 requests per rolling 24 hours. A Sub User (UCD / AATF) resets directly after entering a valid Login ID; no code. After a successful reset, other sessions are logged out and the user lands on the logged-in Home page. The confirmation email is sent only after the new password is saved. [source: Jira EAINT-12228 Additional Note, read 2026-10-26: "The verification code is sent to the Main User's registered email address. SMS and MessageBird are not used."] [source: same note: "The verification code is valid for 5 minutes, allows a maximum of 5 incorrect attempts, and is limited to a maximum of 3 requests within a rolling 24-hour period."] [source: same note: "The Sub User resets the password directly after entering a valid Login ID. No verification code is required for the Sub User."] [source: same note: "After a successful reset, all other existing sessions and devices are logged out and the user lands on the logged-in Home page."] [mine: knowledge/teams-decisions-by-ticket.md]
     - If Main User -> verification code to registered email is required.
     - If Sub User -> valid Login ID, then direct reset.
     - Superseded 2026-10-26: this file earlier said the link "Goes to the Change Password page" and that "A Main User must enter an OTP sent to the Main User's registered phone". That came from the original Jira item 4, which the 11.09.2026 note replaces. [source: Jira EAINT-12228 Additional Note: "The following supersede item 3, item 4 and item 5 under Expected New Handling/Behaviour"] [source: _reference/tickets/Studying/EAINT-12228/EAINT-12228-study.md §10 #2]
     - Conflict: support@eauto.my copy of the confirmation email. Jira note says "copied to support@eauto.my for both the Main User and the Sub User"; Jira SRD history V0.2 says "Removed the copy of the password change confirmation email to support@eauto.my." [unconfirmed] SRD v1.1 (2026-09-24, not read) decides.
     - Before the change (prod code, 2026-10-22): "the login page shows no Forgot Password link. An old Forgot Password page exists (Login ID, email, captcha) but its link bounces the visitor to the logout / home page, so nobody can reach it. If it were reached it would email a temporary password and set "first time login"." [askeauto: prod code prod/master (2026-10-22), quoted in _reference/inbox/eauto-flows-run/11-conflicts.md line 445] Do not mistake that old page for the EAINT-12228 one.
     - Staging baseline before the build: the /eauto login page captured 2026-10-21 has no "Forgot" text at all. [verified: _reference/html/eauto/eauto-public-login-staging-eauto.html, grep "forgot" = 0]
     - SRD history (Jira table, verbatim): "V0.2 | Added the AATF and the Sub AATF as applicable user types. Removed the copy of the password change confirmation email to support@eauto.my."; "V1.1 | Added the verification code email template  Added the password change confirmation email template confirmed by Ops." [source: Studying EAINT-12228 study §3 #6, 2026-10-27]

### Cross-module effects (what it affects)
- All six portals: BO, UCD, JPJ, AATF, Bank / Credit and Insurance. BO Create New User and Company Account pages (13 QA sub-tasks under EAINT-12155). [mine: knowledge/teams-decisions-by-ticket.md] [jira: EAINT-12155]
- The mobile app shares the web database, so password rules reach it. It was not tested separately. [mine: knowledge/teams-decisions-by-ticket.md]

### Roles
- Main User (needs an email verification code for Forgot Password) and Sub User (Login ID only). [source: Jira EAINT-12228 Additional Note, 11.09.2026] Admins reset others' passwords. [jira: EAINT-12228] [mine: knowledge/teams-decisions-by-ticket.md]

### Where the transaction goes
- n/a. The user is logged in with the new password. [mine: knowledge/teams-decisions-by-ticket.md]

### Rules
- Policy: 12 to 30 characters; at least one upper case, one lower case, one number, one special from ! @ # $ % ^ & * ( ) _ + - =; no spaces; only those specials count. Reuse is allowed. Copy and paste follows prod behaviour. [mine: knowledge/teams-decisions-by-ticket.md] [jira: EAINT-12155]
- This replaces: minimum 6 characters (8 for AATF and Insurance), alphanumeric. [jira: EAINT-12155]
- EAINT-12155 = new users (Done 2026-09-11). EAINT-12125 = existing users. [mine: knowledge/teams-decisions-by-ticket.md] [jira: EAINT-12155]
- EAINT-12275 (server does not check Password = Confirm) is an existing prod issue parked under EAINT-148. Do not raise it again. [mine: knowledge/teams-decisions-by-ticket.md]

### QA scope to check
- New user versus existing user rules; admin reset message. [mine: knowledge/teams-decisions-by-ticket.md]
- Sub UCD first login fields. [mine: knowledge/teams-decisions-by-ticket.md]
- AATF and sub AATF pages. [mine: knowledge/teams-decisions-by-ticket.md]
- Each of the six portals: login and password change page. [mine: knowledge/teams-decisions-by-ticket.md]
- Forgot Password: Main User email verification code (5 min, 5 attempts, 3 per 24 h), Sub User Login ID reset, other sessions logged out, and the confirmation email. [source: Jira EAINT-12228 Additional Note, 11.09.2026]
- Special characters outside the allowed set are rejected; paste and hidden text. [mine: knowledge/teams-decisions-by-ticket.md]

### Ticket history
- EAINT-12155 (2026-08): Policy for new users in all portals. Done 2026-09-11. [latest]
- EAINT-12125 (2026-08): Policy for existing users. In Development 2026-10-05. [latest]
- EAINT-12228 (2026-08): Forgot Password link. SRD v1.1 2026-09-24. In Development 2026-10-05. [latest]
- EAINT-12275 (2026-09): Server does not check Password = Confirm. Existing prod issue under EAINT-148. [latest]
- EAINT-12234 (2026-08): Inactive UCD account management proposal (notify and restrict by months of no activity). On Hold 2026-09-02. [latest]

### Open questions
- Inactivity logout rules are not answered yet (Ask eAuto Q25 not received).
- EAINT-12228 says its confirmed requirements supersede some of its own original text; the cut text is not visible. Update 2026-10-26: the note supersedes items 3, 4 and 5 (phone OTP → email code; Change Password page → new Forgot Password page). [source: _reference/tickets/Studying/EAINT-12228/EAINT-12228-study.md §3 #5]

## Flow: MyKad and thumbprint reader (and the MyKad Reader Emulator)
- Pages that need identity use one widget (mykad-websocket-v2.js). It opens ws://localhost:7878/IDCard and waits for a MyKad and a thumbprint. QA uses an emulator instead of the real Dermalog device.
- Portals: UCD, AATF

### Entry points and steps
- Entry point "UCD pages that need a card read": UCD › STMS Step 1 and 3; UCD to UCD; eSTM Step 1 and 3; BMK Step 1 and 3; eSerahan Permission; Insurance Permission; Company Profile Update Step 3; Manage Users add; first login of a new Main UCD [azfar: cr/EAINT-7229/LEDGER.md] [mine: knowledge/business-rules-from-test-scenarios.md] [ts: EAINT-7229 7229_DD_TS1]
  1. Reach the thumbprint screen | where: The module's authentication step | Screen text "Please insert MyKad into the reader." with Cancel and Read MyKad. Next is blocked until the read passes. [ts: EAINT-7229 DD/MK/AS sheets] [mine: knowledge/business-rules-from-test-scenarios.md]
  2. Read the MyKad, then the thumbprint | where: Widget on the page | Page opens ws://localhost:7878/IDCard and sends INIT, then READCARD. After a good read: "Place Thumb on reader", then Matching Result "Identical" and Next unlocks. Auto Scan reads within 3 READCARD intervals, then a manual read. [mine: knowledge/business-rules-from-test-scenarios.md] [azfar: knowledge/_core/mykad-emulator.md] [mine: knowledge/mykad-emulator.md]
     - If No device -> "Please plug in Dermalog Biometric Device and click [Reconnect]".
     - If Device unplugged -> "Unable to read photo. Please try again."
     - If No card -> "No card is detected. Please insert IC and click [Scan IC] to try again."
     - If Connection to the local service fails -> Page shows "Update Required - Please update Dermalog Biometric Device...". This is a failed socket, not a version problem.
- Entry point "AATF pages that need a card read": AATF › Dereg Step 1 owner and Step 3 AATF rep; Upload COD Step 1; Manage Users; First Time Login; Create New AATF Company Account [azfar: cr/EAINT-7229/LEDGER.md] [mine: knowledge/flow-edereg.md §6]
  1. Read the owner or login user's card | where: AATF Dereg Step 1 ("Please use Owner's MyKad.") and Step 3 ("Please use login user's MyKad") | Same widget as UCD. [mine: knowledge/flow-edereg.md §6]
- Entry point "QA: MyKad Reader Emulator": http://localhost:7878 control panel [mine: knowledge/mykad-emulator.md (verified live) 2026-08-24] [azfar: knowledge/_core/mykad-emulator.md]
  - A real client page must stay open or the widget stays on "Scanning IC...".
  1. Open the panel and connect | where: http://localhost:7878 › Connect | Pick a Quick Profile (johan, gstesttest, testucd) or a saved profile. Profiles saved in a human browser are not visible to automation, so pass NRIC and name instead. [mine: knowledge/mykad-emulator.md]
  2. Insert Card when the page asks | where: Emulator › Insert Card | Sends INSERTCARD with the JSON; the page shows "INSERTCARD OK", then "Verification Passed / Verification Completed". Insert the card AFTER the page asks, because INIT wipes card state. The card ejects after each use, so insert again before each auth screen. Close the emulator tab after each insert. [mine: knowledge/mykad-emulator.md (verified live) 2026-08-24] [azfar: knowledge/_core/mykad-emulator.md]
- Entry point "QA: thumbprint URL bypass on some instances": /<instance>/<bypass>/<instance>/view/... [azfar: knowledge/_core/mykad-emulator.md]
  - Skips the reader. Likely on /uat3. Not confirmed.
  1. Open the bypass URL | where: Browser address bar (QA instance only) | Goes to the page with the reader skipped. For eSTM the older zzz/<slot> bypass is replaced by the emulator for EAINT-12412. [azfar: knowledge/_core/mykad-emulator.md] [mine: knowledge/flow-estm.md §The bypass]

### Cross-module effects (what it affects)
- Unlocks the next step of the host flow: STMS, UCD to UCD, eSTM, BMK, eDereg, Company Profile, user management. [azfar: knowledge/_core/mykad-emulator.md] [mine: knowledge/mykad-emulator.md]
- Weekly WebSocket and Java Applet usage statistics email (EAINT-11935, Done 2026-08-21). [azfar: cr/EAINT-7229/LEDGER.md] [jira: EAINT-11935]

### Cronjobs
- WebSocket / Java Applet usage statistics | Weekly (day not recorded) | Compiles and emails usage statistics of WebSocket and Java applet readers. [azfar: cr/EAINT-7229/LEDGER.md] [jira: EAINT-11935]

### Roles
- The card must match the right party. A UCD user's own IC is refused as company seller rep; the Main user's IC is needed at activation. [azfar: knowledge/_core/mykad-emulator.md]
- The emulator is a different system from eSIM. It is local on the tester's machine; eSIM needs VPN. [mine: knowledge/mykad-emulator.md]

### Where the transaction goes
- n/a. It is an authentication step. [mine: knowledge/mykad-emulator.md]

### Rules
- Chrome blocks a public page from reaching ws://localhost (net::ERR_BLOCKED_BY_LOCAL_NETWORK_ACCESS_CHECKS). Fix: launch Chrome with --disable-features=LocalNetworkAccessChecks,PrivateNetworkAccessChecks. Confirmed 2026-08-22. [mine: knowledge/mykad-emulator.md] [azfar: knowledge/_core/mykad-emulator.md]
- Browsers: Chrome 139 (WebSocket, P1), Edge 139 (WebSocket, P2), Firefox 36.0.4 (Java applet, P1). Firefox below 36 is blocked. [ts: EAINT-7229 Browsers] [azfar: knowledge/portals/ucd/portal.md#Firefox: announcement and browser reminder]
- [unconfirmed] Fresh Playwright contexts need camera, microphone and midi pre-granted. The exact permission name behind the first prompt is not confirmed. [mine: knowledge/mykad-emulator.md]
- The emulator flow works in practice even though the page script can close itself with multiple sessions (hTotalActiveSession). [mine: knowledge/mykad-emulator.md]
  - Conflict: other version: The portal hard-codes the default channel, so one run per machine unless the channel is relayed per lane. Port 7878 may also be held by DermalogMyBioIDService.exe (the real reader service). [azfar: knowledge/_core/mykad-emulator.md] (Azfar's trap list.)
- [unconfirmed] Responses are HMAC-signed. Whether eAuto checks the signature is not known. [azfar: knowledge/_core/mykad-emulator.md]
- Installer v2 (EAINT-9944) was on hold per BA on 2026-04-16 and never went live (Closed 2026-08-28). A WebSocket reconnect button (EAINT-12332) is To Do. [mine: knowledge/business-rules-from-test-scenarios.md] [azfar: knowledge/_core/mykad-emulator.md] [jira: EAINT-12332]

### QA scope to check
- Any new thumbprint screen must use the same widget and block Next until the read passes. [mine: knowledge/mykad-emulator.md]
- Messages for no device, no card, unplugged device. [mine: knowledge/business-rules-from-test-scenarios.md]
- Chrome WebSocket and Firefox applet each work with one happy flow per module. [mine: knowledge/business-rules-from-test-scenarios.md]
- Check the Download page and the Dermalog installer links on login and UCD / AATF download pages. [ts: EAINT-7229 Download Time sheet]

### Ticket history
- EAINT-7229 (2025-12): Chrome WebSocket replaces Firefox Java applet. Live S24.3-20251217. [latest]
- EAINT-9590 (2026-01): Applet re-signed. Live S25.2-20260105. [latest]
- EAINT-9944: Installer version check. On hold, never live. [legacy]
- EAINT-9894 (2026-02): V1 Standardise browser to Chrome. Closed 2026-09-14, never live. [legacy, superseded by EAINT-12253]
- EAINT-9895 (2026-02): V2 Standardise browser to Chrome. Closed 2026-09-14. [legacy, superseded by EAINT-12253]
- EAINT-12332 (2026-09): WebSocket reconnect flow with Windows-handler toggle. To Do. [latest]
- EAINT-11935 (2026-07): Weekly WebSocket and applet usage email. Done. [latest]
- EAINT-9306 (2026-08): Emulator built for eDereg. [latest]
- EAINT-12412 (2026-10): Emulator reused for eSTM TS12. [latest]

### Open questions
- Does eAuto verify the HMAC or wsPublicKey? (Azfar Q2)
- Is the emulator signed off as matching the real reader? (Azfar Q3)
- What are mykad-bypass.do and mykad-without.jsp? (Azfar Q5; without.do is dead code per Ask eAuto)

## Flow: Firefox to Chrome messages (Announcement popup and Browser Reminder)
- Firefox support ends 31 December 2026. From 1 January 2027 users must use Google Chrome. Two messages tell Firefox users: a popup on the home page (live) and a reminder at the last step of a transaction (not live yet).
- Portals: UCD, AATF

### Entry points and steps
- Entry point "Announcement popup on the home page (EAINT-12180)": UCD or AATF Homepage after login, in Firefox [azfar: knowledge/portals/ucd/portal.md#Firefox: announcement and browser reminder] [jira: EAINT-12180]
  - Live since S33.3-20260908. Once per login session. Never in Chrome.
  1. Log in with Firefox | where: UCD / AATF login | Popup "Announcement 公告" shows with buttons: View PDF Guide (new tab), Watch Tutorial Video (video overlay), user guide (same tab, USER GUIDE page). [azfar: knowledge/portals/ucd/portal.md#Firefox: announcement and browser reminder] [azfar: cr/EAINT-12180/LEDGER.md]
  2. Close the popup | where: Popup close | UCD then shows the Company / Business Profile update banner. AATF shows the ANNOUNCEMENT / PENGUMUMAN banner. [azfar: knowledge/portals/ucd/portal.md#Firefox: announcement and browser reminder]
- Entry point "Browser Reminder at the last step (EAINT-12253)": Final step after a successful payment or submission, in Firefox below 37 [azfar: knowledge/portals/ucd/portal.md#Firefox: announcement and browser reminder] [jira: EAINT-12253]
  - Not live. Deployed to /uat1/ on 2026-10-21; Jira status "Testing In 1st Env".
  1. Reach the final step | where: STMS Step 6; eSTM Step 6 or Insurance Step 4; BMK Step 6; APT Step 6; JomCheck result; Service Hub Submission (open); Dereg Step 6 / pre-check Step 3 result | "Browser Reminder 浏览器提醒" shows on every load of that page. Never before payment and never after a failed payment. Text: Firefox support ends 31 December 2026; from 1 January 2027 use Google Chrome (Firefox usage 42%, WebSocket 50%). [azfar: knowledge/portals/ucd/portal.md#Firefox: announcement and browser reminder] [jira: EAINT-12253]
  2. Dismiss it | where: Popup buttons | Continue 继续 or the X (#ebrCloseBtn) hides it. Esc does nothing. View User Guide opens in a new tab. Nothing is blocked before 1 January 2027. [azfar: knowledge/portals/ucd/portal.md#Firefox: announcement and browser reminder]
  - **Conflict note — 12253 SRD v1.1 vs build (added 2026-10-26).** The build is accepted; the SRD and Miro card were not updated. Test the build, not the SRD.
    1. Firefox version. SRD REQ-001 says "Mozilla Firefox", no version. Build shows it only to Firefox below 37. [source: _reference/codebases/eauto-qa-azfar/cr/EAINT-12253/STATUS.md CD1: "Reminder only shown to Firefox < 37 (`isLegacyFirefox()`); current Firefox never gets it." — "CLOSED 21.10: intended (Azfar / BA: only Firefox 36 / Java-applet users)"]
    2. Timing. SRD v1.1: "Browser reminder popup is displayed before the user confirms or submits the" (srd.md line 246). Build shows it after payment on the final step. [source: same STATUS.md CD3: "SRD v1.1 still says 'before the user confirms or submits'; build + BA (21.10) show it after payment" — "BA to update SRD"]
    3. Refresh. SRD REQ-001: "Displayed once per transaction." Miro: "Close the banner & refresh the page - should NOT show popup". Build shows it again on F5. Raised as EAINT-12574 and closed by BA: keep existing behaviour. [source: Jira EAINT-12574 comment, Lim Yi Link (BA), 2026-10-21 12:23: "This ticket can be closed as we can remain existing behaviour in staging."] [source: _reference/tickets/Studying/EAINT-12253/EAINT-12253-miro-card.md]
    4. Button label. Miro: "View PDF Guide 查看操作指南"; SRD: "View User Guide 查看操作指南". [source: _reference/tickets/Studying/EAINT-12253/EAINT-12253-study.md §10 #6]

### Cross-module effects (what it affects)
- STMS (including UCD to UCD and Wholesale), eSTM, BMK, APT, Insurance, Service Hub, JomCheck, Deregistration, eDereg Pre-Checking. [azfar: knowledge/portals/ucd/portal.md#Firefox: announcement and browser reminder] [jira: EAINT-12253]
- Not shown on Company / Business Profile Update. Chained eSTM to Insurance shows it at Insurance Step 4 only. STMS Bulk Payment never shows it in Firefox 36. [azfar: knowledge/portals/ucd/portal.md#Firefox: announcement and browser reminder]

### Roles
- All Firefox users of UCD and AATF, Main and Sub, with or without the profile-update banner. [azfar: cr/EAINT-12180/LEDGER.md]

### Where the transaction goes
- n/a. [azfar: knowledge/portals/ucd/portal.md#Firefox: announcement and browser reminder]

### Rules
- Popup helpers in tests that close any .ui-dialog hide these popups. Stop before the last step and do the final navigation in the spec. [azfar: knowledge/portals/ucd/how-we-test.md#Traps]
- "Once per transaction" was dropped by the BA on 2026-10-21. [azfar: knowledge/portals/ucd/portal.md#Firefox: announcement and browser reminder]
- Browser priority: UCD and AATF Firefox; BO and JPJ Chrome then Firefox, until 1 Jan 2027, then Chrome only. [mine: knowledge/business-rules-from-test-scenarios.md]

### QA scope to check
- Popup in Firefox, absent in Chrome; each button works. [azfar: cr/EAINT-12180/LEDGER.md]
- Reminder at every final step; not before payment; not on failed payment. [azfar: knowledge/portals/ucd/portal.md#Firefox: announcement and browser reminder]
- Check it does not hide behind other popups (campaign, What's New). [azfar: knowledge/portals/ucd/how-we-test.md#Traps]

### Ticket history
- EAINT-12180 (2026-08): Homepage announcement popup. Done 2026-09-08. [latest]
- EAINT-12253 (2026-09): Browser Reminder at last step. Testing in 1st env 2026-10-21. QA 36/36 PASS on staging/uat1 2026-10-23; fix version S34.17-20261028, deploy 28 Oct 2026 morning. [source: Teams eAuto QAs, Amirul Azfar EOD, 2026-10-23 19:30: "Completed testing on staging/uat1 To review all the test evidence Overall CR Testing Progress : (36/36) 100% PASS only"] [source: Teams CR group, Tan Yi Fung, 2026-10-20 17:18: "Can be morning"] [latest]
- EAINT-12574 (2026-10): QA-Issue under 12253: popup shows again after F5. Closed by BA as not a defect ("remain existing behaviour", 2026-10-21). [latest]
- EAINT-12229 (2026-09): Banner-style announcement revamp. To Do. [latest]
- EAINT-11835 (2026-07): User Guide page. Live S31.2-20260708. [latest]

### Open questions
- 12253 questions still open in Azfar's notes: on arrival vs final button (Q3), Bulk (Q5), chained transactions (Q6), Interstate UCD A submit (Q7), Wholesale (Q9), Service Hub (Q10), APT final step (Q23).
- Whether the announcement still shows after 31 December 2026 (SRD V1.2 unread).

## Flow: JPJ enquiry, final submission and Official Receipt (shared rules)
- Rules that every JPJ module shares: BRN in the request, field lengths, the JPJ Official Receipt email and the status crons.
- Portals: UCD, AATF, Back Office, Backend

### Entry points and steps
- Entry point "Any module sends an enquiry or final submission to JPJ": STMS, APT, eSTM (with eLKM and eVOC), eDereg Pre-Checking, BMK, Dereg [jira: EAINT-8622] [jira: EAINT-9204]
  1. Module sends the JPJ enquiry with BRN | where: Backend (module step: JPJ Check) | Only STMS, APT, eSTM, eDereg Pre-Check and BMK send BRN. Old to New BRN switch done by EAINT-8622 (Done 2026-10-21). 24/24 TS passed on staging/uat3 with eSIM; only 1 of 24 against JPJ staging. [jira: EAINT-8622]
     - If JPJ returns VEL000008E or REF000006E -> Backend switches BRN type (Old to New or New to Old) and resubmits (EAINT-12578, Testing 2026-10-22).
  2. JPJ Official Receipt arrives | where: JPJ mailbox (Microsoft 365) | JPJ emails the receipt. A mailbox poll reads it every few minutes and attaches it to the transaction details (EAINT-9204 covers STMS, TH, eSTM, APT, BMK, eDereg Pre-Checking). | affects: Transaction details pages; Report Engine PDFs [jira: EAINT-9204] [jira: EAINT-12222]

### Cross-module effects (what it affects)
- Transaction details pages of STMS, APT, eSTM, BMK and eDereg Pre-Checking (receipt button). Insurance JPJ status (EAINT-3170). [jira: EAINT-9204] [jira: EAINT-12171]
- Engine no and chassis no max length is 60 characters from 2026-10-01 (old eSTM 22 and 30). Report Engine PDF templates clip at 26-40 characters. [jira: EAINT-12216]
- JPJ Digital MySikap Revamp live 2026-10-01. [jira: EAINT-12216]

### Cronjobs
- JPJ Status (insurance) | Every 1 minute, 8am-11pm (prod 2026-09-10) | Polls JPJ status for insurance, eAuto and Secarang. [jira: EAINT-12171]
- Cover Note (insurance) | eAuto every 5 minutes, Secarang every 1 minute, 8am-11pm | Cover note submission and polling. [jira: EAINT-12171]
- JPJ Official Receipt mailbox poll | Every few minutes | Reads the M365 mailbox. On throttling it skips emails and still moves the last-checked marker, so receipts can be lost. Fix in Code Review: retry, never skip unread emails, daily Teams report at 08:00 MYT. [jira: EAINT-12222]
- [unconfirmed] JPJ monthly report | Monthly (proposed) | Auto-email completed transactions without a JPJ Official Receipt to JPJ Hasil (EAINT-12120 To Do) and a monthly report to a JPJ email (EAINT-11865 To Do). [jira: EAINT-12120] [jira: EAINT-11865]

### Roles
- Backend; Ops and IT own the mailbox and crons. [jira: EAINT-12222]

### Where the transaction goes
- Transaction goes to JPJ; the receipt comes back by email. [jira: EAINT-9204]

### Rules
- JPJ enquiry inside check.do ignores its usage code (note in EAINT-12562). [jira: EAINT-12562]
- JPJ receipt email goes to systemtest@eauto.my while a branch is connected to JPJ staging, so Mailtrap will not show it. [mine: knowledge/mailtrap.md 2026-09-17]

### QA scope to check
- Each JPJ module with an old and a new BRN. [jira: EAINT-8622]
- Engine and chassis max 60 in forms, JPJ request and PDFs. [jira: EAINT-12216]
- Receipt button on each module's details page. [jira: EAINT-9204]

### Ticket history
- EAINT-8622 (2025-07): Old BRN to New BRN. Done 2026-10-21. [latest]
- EAINT-12578 (2026-10): BRN type switch on VEL000008E / REF000006E. Testing. [latest]
- EAINT-12216 (2026-08): Field length 60 characters. Done. [latest]
- EAINT-9204 (2025-11): JPJ Official Receipt (53 sub-tasks). Done 2026-10-20. [latest]
- EAINT-12222 (2026-08): Receipt mailbox poll fix. Code Review. [latest]
- EAINT-12171 (2026-08): Standard insurance cron intervals. Done. [latest]
- EAINT-3170: Insurance JPJ status cron start at 8am. [legacy, superseded by EAINT-12171]

## Flow: Notifications: emails and WhatsApp (staging checks)
- How QA reads staging emails and the notification rules that cross modules.
- Portals: Mailtrap sandbox, WhatsApp (MessageBird / MacroKiosk), eSIM

### Entry points and steps
- Entry point "Any staging email (appointment, reminder, approval, JomCheck OTP)": Mailtrap inbox https://mailtrap.io/sandboxes/2581833/messages (one shared inbox for all testers and environments) [mine: knowledge/mailtrap.md]
  1. Check in a browser already signed in to Mailtrap | where: modefair.com Chrome profile | The team does not use the Mailtrap API. Automation copies the Chrome profile session, launches headed Chrome and reads the first 40 rows. Signed out means blocked, never pass. [mine: knowledge/mailtrap.md]
  2. Match the email | where: Mailtrap list | Match by vehicle no in subject, to or from. Assert exactly one (or none). Scope by recipient, subject and time window. [mine: knowledge/mailtrap.md]
- Entry point "Insurance WhatsApp messages": Insurance events: failed cover note, JPJ rejected, referred-risk video, monthly commission, renewal reminder [mine: knowledge/eauto-insurance.md §notifications] [mine: knowledge/business-rules-from-test-scenarios.md]
  1. Event happens in the insurance flow | where: Insurance / Secarang backend | Failed cover note and JPJ rejected go to the support number only. Secarang payment success goes to the user. EAINT-12342 keeps failure alerts only for eAuto insurance. [mine: knowledge/teams-decisions-by-ticket.md EAINT-11759, EAINT-12342 2026-09-14]

### Cross-module effects (what it affects)
- Which emails reach Mailtrap: BMK email, eVOC email, JomCheck OTP / WhatsApp. SI / BDP appointment emails (sender support@eauto.my). [mine: knowledge/mailtrap.md]
- Which do not: Dereg (JPJ sends email + COD to the entered address) and eAuto Insurance policy emails (Takaful, TPFT, Chubb, Tokio Marine). [mine: knowledge/mailtrap.md]
- Approving an onboarding application sends 3 emails (EAINT-12341 / 12461). [mine: knowledge/business-rules-from-test-scenarios.md]

### Cronjobs
- Insurance quotation reminder | Hourly, 07-23 | Emails UCD for quotations not purchased. [mine: knowledge/flow-quotation-reminder.md]
- Secarang renewal reminders (MacroKiosk) | 9:00 AM (7 days), 12:00 PM (14 days), 9:00 PM (30 days) | Sends WhatsApp renewal reminders in 9 templates (EAINT-12218). [jira: EAINT-12218]
- Monthly insurance commission | 2nd of the month | Notifies the UCD director of commission earned. [mine: knowledge/business-rules-from-test-scenarios.md]

### Roles
- Mailtrap sign-in in the modefair.com Chrome profile. The browser reader cannot run on GitHub Actions. [mine: knowledge/mailtrap.md]

### Where the transaction goes
- Mailtrap inbox or the recipient mailbox. [mine: knowledge/mailtrap.md]

### Rules
- Fake test emails use @testingz.com. Do not use @yopmail.com or disposables. @modefair.com is fine on eSIM except Deregistration, and not when staging is connected to JPJ staging or RHB staging. Secarang and CIBO use @modefair.com. [mine: knowledge/mailtrap.md] [mine: memory feedback_test-emails-testingz-domain]
- SI appointment email subject "eAuto: Your Software Installation Appointment is Confirmed - [UCD Company Name]" fires once on confirm. The em-dash shows as "?" (known encoding defect). Baseline CS number [hotline number omitted]. [mine: knowledge/mailtrap.md] [azfar: automation/src/data/email-contracts.ts]

### QA scope to check
- Sender, recipient, subject, body fields, link, count (exactly one) and timing. [mine: knowledge/mailtrap.md]
- WhatsApp recipient lists. [mine: knowledge/business-rules-from-test-scenarios.md]

### Ticket history
- EAINT-11864 (2026-08): Quotation reminder email. [latest]
- EAINT-11759 (2026-09): Secarang WhatsApp recipients. [latest]
- EAINT-12342 (2026-09): Insurance failure alerts only. Done. [latest]
- EAINT-12218 (2026-08): 9 MacroKiosk reminder templates. Done 2026-10-05. [latest]
- EAINT-8536: WhatsApp notification to the insurance support number. [latest]

### Open questions
- Mailtrap DOM selectors are not confirmed; reminder subject unknown.
- Which insurance emails bypass Mailtrap is not confirmed.

## Flow: eAuto mobile app (Android / iOS) parity with web
- The app shares the web database. Its screens are being aligned to the web portal. The web portal is the reference.
- Portals: Android / iOS app

### Entry points and steps
- Entry point "App release phases": eAuto-App phases 3-6 (EAINT-9805 Phase 6 = STMS parity with production web as of 2026-01-29) [jira: EAINT-9805]
  1. Web change ships first, then an app ticket aligns it | where: Jira sub-tasks under the app tickets | Examples in Code Review or Development on 2026-10-19 to 22: LKM Refund module (12567), usage code AH (12553), Transaction Restriction popup S00044 (12552), Perakuan per SRD v1.1 and JPJ Official Receipt in eSTM (12551), tile price RM25 to RM35 (12550). Android: rooted device handling (12570 Done), backend changelog alignment (12575 Done), eSTM city list per state (12568 Done). [jira: EAINT-12551] [jira: EAINT-12570]

### Cross-module effects (what it affects)
- App STMS and eSTM follow web rules. In production code the app's own eSTM entry points are commented out. [jira: EAINT-9805] [askeauto: Q6 eSTM / eSerahan (prod code) 2026-10-23]

### Roles
- Dealers (UCD users). [jira: EAINT-9805]

### Where the transaction goes
- Same database as web. [mine: knowledge/teams-decisions-by-ticket.md]

### Rules
- Web is the reference ("same as Production Web Portal"). Mobile twin tickets: EAINT-12559 (JPJ Official Receipt) and EAINT-12560 (usage code AH) are To Do. [jira: EAINT-9805] [jira: EAINT-12559]

### QA scope to check
- When a web wording, fee or receipt rule changes, check if an app twin ticket exists. [jira: EAINT-12551]

### Ticket history
- EAINT-9805 (2026-01): Phase 6 STMS parity with web. [latest]
- EAINT-12567 (2026-10): App LKM Refund module. In Development. [latest]
- EAINT-12551 (2026-10): App Perakuan and JPJ Official Receipt in eSTM. Code Review. [latest]
- EAINT-12570 (2026-10): Android rooted device handling. Done. [latest]
- EAINT-12558 (2026-10): Merge Staging into develop (phases 3-6). Done. [latest]

### Open questions
- Which modules the app exposes, and how they differ from web, is not answered yet (Ask eAuto Q24 not received).
- iOS status is not recorded.

## Additions from Charmain's QA repo — password policy EAINT-12155 (added 2026-10-27)

Source: read-only clone of a QA colleague's repo, `_reference/codebases/eauto-qa-charmain/` (branch consolidate-charmain, commit 0ab45d1, last commit 2026-10-13). **Status: a colleague's notes and draft test ledgers, not verified live by us.** Her ledger tags: (doc) = the SRD states it; (dim) / (obs) = her own coverage reasoning or what she saw on screen, never a requirement. QA "rulings" she quotes are QA decisions, not BA documentation. Tag below: `[charmain-repo: <path>:<line>]`.

### SRD and ticket mapping
- The SRD in her repo, `eauto-user-password-srd-v1.0`, is **EAINT-12155's** SRD (new accounts), v1.0, revision date 26.08.2026, CCB-899. It is not the EAINT-12125 or EAINT-12228 SRD. [charmain-repo: docs/source-material/eauto-user-password-srd-v1.0.txt:9-14,137-143] Copy: `_reference/tickets/EAINT-12155/EAINT-12155-SRD-v1.0-20260826.pdf` (+ `-text.txt`).
- Related: "EAINT-12220 — Password-reset endpoints have no server-side role check", "handled separately". [charmain-repo: docs/source-material/eauto-user-password-srd-v1.0.txt:163-170]
- Her module maps: SRD v0.1 (2026-08-24) not provided; EAINT-12125 SRD v1.0 (2026-09-01) "owns My Account, Update User Account, Change Main User Password and the BackOffice reset under the new policy, and adds a prompt for existing users on a non-compliant password, which conflicts with REQ-001". [charmain-repo: docs/modules/ucd/user-password/README.md:45-46]
- Her scenario pack (outside her repo): 157 numbered, 128 in scope, 29 out; split into four ledgers UCD-USER-PASSWORD, BO-USER-PASSWORD, BO-ACCOUNT-FORMS-PASSWORD, AATF-USER-PASSWORD. [charmain-repo: docs/modules/ucd/user-password/README.md:48]

### SRD rules, verbatim (EAINT-12155 SRD v1.0)
- Scope: "Every password set for a new account, whether entered by an administrator or system-generated, must be at least 12 characters and must contain an uppercase letter, a lowercase letter, a number, and a special character." [charmain-repo: docs/source-material/eauto-user-password-srd-v1.0.txt:186-189]
- Special Character = "A character from the approved set: ! @ # $ % ^ & * ( ) _ + - =". [charmain-repo: docs/source-material/eauto-user-password-srd-v1.0.txt:123-125]
- Portals: "UCD, BackOffice, JPJ, AATF, Bank and Insurance". [charmain-repo: docs/source-material/eauto-user-password-srd-v1.0.txt:346]
- Exemption (REQ-001): "An existing account with a legacy password logs in successfully after deployment, is not forced to change the password, and is not shown any policy message." [charmain-repo: docs/source-material/eauto-user-password-srd-v1.0.txt:479-500]
- Assumption 3: "The My Account password change and the Change Main User Password pages hash the password in the browser before submission, so the server never receives the plaintext." [charmain-repo: docs/source-material/eauto-user-password-srd-v1.0.txt:237-239]
- Assumption 5: "The client-side and server-side hashing implementations agree only on printable ASCII input, so non-ASCII characters must be blocked to avoid permanent lockout." [charmain-repo: docs/source-material/eauto-user-password-srd-v1.0.txt:247-248]
- Old problems (§2.2.2): "The minimum length is 6 characters, and 8 for AATF and Insurance."; "A password containing & = + % # corrupts the login request parameter." [charmain-repo: docs/source-material/eauto-user-password-srd-v1.0.txt:378,385]
- Out of scope: expiry/rotation; history check; EAINT-12220 role check; migration; 2FA; "Password change pages used by existing users, covering My Account, Update User Account, Change Main User Password and Change Director Password"; "Password reset of an existing BackOffice user by an administrator"; "Forgot password temporary password for an existing user". [charmain-repo: docs/source-material/eauto-user-password-srd-v1.0.txt:262-322]
- Affected pages (§2.2.3): UCD Login; UCD First-Time Login Password Change; UCD Settings > User Accounts Listing > Add User Account; BO Manage BackOffice User Account > Add User; BO Company Account Creation (initial director password); BO AATF Company Create; Service Portal Login; Service Portal First-Time Login. [charmain-repo: docs/source-material/eauto-user-password-srd-v1.0.txt:405-466]
- REQ-005: "A non-compliant initial director password is rejected and the company account is not created." REQ-006: "...the user record is not saved. An existing user account is not affected." REQ-007 (AATF company create): "A non-compliant password submitted from the AATF company create page is rejected." [charmain-repo: docs/source-material/eauto-user-password-srd-v1.0.txt:575-640]
- REQ-008: "A direct submission with a non-compliant password is rejected on every server-validated page. The My Account and Change Main User Password pages are excluded, as the server receives only the hashed value." [charmain-repo: docs/source-material/eauto-user-password-srd-v1.0.txt:643-660]
- REQ-009: "Upon logging in with a generated password, the sub-user shall be required to set a new compliant password." / "The sub-user cannot access any other page until a compliant password is set." [charmain-repo: docs/source-material/eauto-user-password-srd-v1.0.txt:671-686]
- REQ-010 / REQ-011: Bank and Insurance portal first-time change validated on the server. REQ-012: "An Insurance password of 8 to 11 characters set for a newly created account is rejected after deployment." [charmain-repo: docs/source-material/eauto-user-password-srd-v1.0.txt:699-750]
- Field spec §2.2.9: Min 12, Max 30, at least one upper/lower/number, space not allowed, one special from the set, "Only Allow English: Yes", "Mandatory when a password is set for a new account". [charmain-repo: docs/source-material/eauto-user-password-srd-v1.0.txt:762-803]
- Messages §2.2.9 (exact): "Password must be at least 12 characters long." · "Password must contain at least one uppercase letter (A–Z)." · "Password must contain at least one lowercase letter (a–z)." · "Password must contain at least one number (0–9)." · "Password must contain at least one special character ( ! @ # $ % ^ & * ( ) _ + - = )." · "Password must not contain spaces and must use English characters only." · "Confirm Password does not match the new password." · at 30: "No additional character allowed to enter" · all met: "Password is saved and a green tick is displayed beside the field". [charmain-repo: docs/source-material/eauto-user-password-srd-v1.0.txt:815-899]
- REQ-013: "display a message for each failed rule and shall not save the change". Its examples drop "(A–Z)" and the symbol list. [charmain-repo: docs/source-material/eauto-user-password-srd-v1.0.txt:914-940]

### Build behaviour and QA rulings she recorded (colleague notes)
- Page names: SRD "First-Time Login Password Change" = on-screen "Change Your Password"; SRD "Sub User" = on-screen "Sub UCD user". [charmain-repo: test-scenarios/ucd-user-password/ucd-user-password.md:24-27]
- Spaces and non-English characters are **removed as typed** (since the 2026-09-04 deploy, EAINT-12284); the rest is saved, no message. QA ruled this correct 2026-09-04 and 06. SRD REQ-015 expects a refusal message. [charmain-repo: test-scenarios/ucd-user-password/ucd-user-password.md:350]
- Printable symbols outside the 14 (`.` `?` `;`) are also stripped as typed. BA told QA 2026-09-03 the set is a whitelist; EAINT-12282 removed the panel line "No spaces or other symbols" on 2026-09-04. A password whose only symbol is a full stop is refused for want of a special. [charmain-repo: test-scenarios/bo-user-password/bo-user-password.md:269-282,358]
- Refusal copy: the build shows **one five-line rule list** ("At least 12 characters" and four more), not one sentence per rule. BA confirmed to QA 2026-09-03; not in the SRD. [charmain-repo: test-scenarios/ucd-user-password/ucd-user-password.md:351]
- Change Your Password: Save stays unusable until every rule passes and Confirm matches; rule lines turn red/green as typed (CCB-899 prototype). BA told QA 2026-09-03 the check is "on clicking Save". [charmain-repo: test-scenarios/ucd-user-password/ucd-user-password.md:256-262,352]
- BO create forms: Save stays usable; the reason comes as a **popup**. UCD Add User Account: reason **under the field, no popup** (BA ruling 2026-09-07). A failing password with a mismatched Confirm shows only the rule list in the popup (QA ruled 2026-09-06). [charmain-repo: test-scenarios/bo-user-password/bo-user-password.md:252-256] [charmain-repo: test-scenarios/ucd-user-password/ucd-user-password.md:265-267] [charmain-repo: test-scenarios/bo-account-forms-password/bo-account-forms-password.md:224]
- Empty password on BO forms: "Please fill in mandatory field." QA ruled 2026-09-06 it comes before the policy and mismatch messages. [charmain-repo: test-scenarios/bo-user-password/bo-user-password.md:366]
- Confirm field: company and AATF/PBT create forms show **no Confirm field** (per prototype); Add User and Bank/Credit Create New have one. [charmain-repo: test-scenarios/bo-user-password/bo-user-password.md:39-44]
- Bank/Credit Company User › Create New is in the prototype only, not in SRD §2.2.3; QA confirmed it in scope. [charmain-repo: test-scenarios/bo-account-forms-password/bo-account-forms-password.md:227]
- "Service Portal" in SRD §2.2.3 items 7-8 = the Bank login, by QA's reading of 2026-09-06. A new Bank user is never routed to the Bank first-time change page and signs straight into the Bank home; QA ruled that group out 2026-09-04. [charmain-repo: test-scenarios/bo-account-forms-password/bo-account-forms-password.md:196-200,226]
- After an officer sets an old-format password (Change Main User Password or Reset Password), the next sign-in is held on Change Your Password under the new policy (QA ruling 2026-09-07). Bank/Credit Update User does not do this. [charmain-repo: test-scenarios/bo-user-password/bo-user-password.md:315-319,362]
- A new BackOffice user is held on Change Your Password at first sign-in (observed), but on 2026-09-07 opened three BO pages by typed address; pre-change build the same; QA ruled it an existing prod issue. [charmain-repo: test-scenarios/bo-account-forms-password/bo-account-forms-password.md:191-195,225]
- Workshop or JPJ company Main User gets "Access Denied" right after setting a compliant first password; an Insurance Main User gets in. Open as a possible defect. [charmain-repo: test-scenarios/ucd-user-password/ucd-user-password.md:284-289,354]
- Insurance company Main User signs in on the same login as a dealer and lands on the same dashboard; no separate Insurance portal seen. [charmain-repo: test-scenarios/ucd-user-password/ucd-user-password.md:355]
- A Sub UCD user can reach Add User Account and create users (SRD names only the Main User). [charmain-repo: test-scenarios/ucd-user-password/ucd-user-password.md:357]
- AATF Settings › Add New User Account issues a **temporary password shown in plain text on the create form** before the Sub User is saved; it sits exactly on the 12-character minimum; same value for every Sub User is open. The old value was a fixed eight-digit default. [charmain-repo: test-scenarios/aatf-user-password/aatf-user-password.md:136-143,244-246]
- AATF Sub User first sign-in lands on an **Update User Account** form with the password change inside, needs Contact No. and Email Address filled before "Update »" acts, and has no "minimum 12 characters" line above the rule list (QA judged acceptable 2026-09-05). [charmain-repo: test-scenarios/aatf-user-password/aatf-user-password.md:197-200,247]
- Defects she lists against 12155: EAINT-12278 (rule lines missing on the two company forms, fixed 2026-09-07); EAINT-12297 (company forms deleted `*`, fixed 2026-09-07); EAINT-12298 (Reset Password refused every reset 2026-09-07, fixed same day); EAINT-12281 (paste/copy/cut/drop blocked, 2026-09-04); EAINT-12284 (space/non-English stripped); EAINT-12282 (panel line removed); EAINT-12295 (rule-list colour vs mandatory asterisk, back in development 2026-09-07). [charmain-repo: test-scenarios/bo-user-password/bo-user-password.md:186-187,230-232,294-295,327] [charmain-repo: test-scenarios/ucd-user-password/ucd-user-password.md:350,353]
- Accessibility measured once 2026-09-04: no `aria-describedby`, no `aria-invalid`, no live region on the password fields. [charmain-repo: test-scenarios/bo-user-password/bo-user-password.md:394-397]
- Forgot password could not run end to end: "staging sends no email" (her note, 12155 era). [charmain-repo: test-scenarios/ucd-user-password/ucd-user-password.md:373-375]

### Test data and traps (her blockers)
- Every accept spends a new account. A company or AATF/PBT Main User must pass **MyKad Account Activation** with a card whose IC and name match before reaching Change Your Password. [charmain-repo: test-scenarios/ucd-user-password/ucd-user-password.md:406]
- An officer-set password routes the account to Change Your Password, so "existing user, own old password" needs accounts whose password the user set before deployment. [charmain-repo: test-scenarios/ucd-user-password/ucd-user-password.md:409]
- AATF MyKad scan needs a real card and thumb; the reader emulator cannot pass it. The AATF Sub User card check compares against the Main User's IC, and the Sub User's IC must differ; each run spends an AATF company. [charmain-repo: test-scenarios/aatf-user-password/aatf-user-password.md:281-282]
- A Bank/Credit company allow-listed to the office IP refuses sign-in from elsewhere, which reads as a defect. Use a company with no allow-list. [charmain-repo: test-scenarios/bo-user-password/bo-user-password.md:417]
- Six of the 14 specials are regex metacharacters and five corrupted the old login, so a refused or failed sign-in points at the build. [charmain-repo: test-scenarios/bo-user-password/bo-user-password.md:180-184]
- BO has no "Change Director Password" page; the director link on a company is Change Main User, which reassigns the director and has no password field. [charmain-repo: test-scenarios/bo-user-password/bo-user-password.md:369]

### Conflicts with what this file already says
- Conflict: copy and paste. This file (§Rules): "Copy and paste follows prod behaviour." `[mine: knowledge/teams-decisions-by-ticket.md]` vs Charmain: "The build has refused paste, copy, cut and drop on these fields since 2026-09-04 (EAINT-12281, Q13)." [charmain-repo: test-scenarios/bo-user-password/bo-user-password.md:327]
- Conflict: UCD sub-user password. This file step 1 says the system-made "temporary password was 6 random letters" `[mine: knowledge/teams-decisions-by-ticket.md]` vs Charmain: "The Main User sets a new sub-user's password when adding them." [charmain-repo: docs/modules/ucd/user-password/README.md:30] and her open question "Does UCD generate any password?" [charmain-repo: test-scenarios/ucd-user-password/ucd-user-password.md:361]
- Conflict (SRD vs build): officer reset then forced change at next login. This file (EAINT-12125 step) says the user sees "Please change your password." on next login; Charmain notes SRD REQ-001 ("shall not be prompted to change it") and §2.1.2 item 7 put this out of scope for 12155; which ticket owns it is open. [charmain-repo: test-scenarios/bo-user-password/bo-user-password.md:362]
- Conflict (SRD vs build): REQ-015 refusal message vs strip-as-typed; SRD per-rule sentences vs five-line rule list; REQ-009/REQ-010 holds vs typed-address walk-past and no Bank first-time route (all above).

### Open questions she raised (open as of her last commit, 2026-10-13)
- Is a new BackOffice user meant to be held on Change Your Password (SRD states it only for UCD users and sub-users)? [charmain-repo: test-scenarios/bo-account-forms-password/bo-account-forms-password.md:233]
- An account created before deployment and never signed in: which policy at first sign-in (SRD assumption 6 leaves "new vs existing" to dev)? [charmain-repo: test-scenarios/ucd-user-password/ucd-user-password.md:362]
- Is REQ-007's "Deregistration" account anything other than AATF? [charmain-repo: test-scenarios/aatf-user-password/aatf-user-password.md:250]
- Server rule for over-length (31+) direct posts: none stated. [charmain-repo: test-scenarios/bo-user-password/bo-user-password.md:371]
- Once EAINT-12125 ships, her "existing screens keep the old rule" entries flip; REQ-001 "no policy message" conflicts with 12125's prompt. [charmain-repo: test-scenarios/ucd-user-password/ucd-user-password.md:356]
