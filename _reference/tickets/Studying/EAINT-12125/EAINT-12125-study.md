<!-- Study written 2026-10-26 by Claude. Read-only sources: Jira (Atlassian MCP), Miro capture 2026-10-26, Teams exports (end 2026-10-16), repo knowledge/. No browser used. -->

# EAINT-12125 study

## 1. Header
1. **Title (Jira, verbatim):** "🟣[eAuto] Existing User: Enforce 12-Character Password Complexity Across All Portals with uppercase, lowercase, number & special character"
2. **Title (Miro, verbatim):** "EAINT-12125 - 🟣[eAuto] Existing UCD: Enforce 12-Character Password Complexity Across All Portals with uppercase, lowercase, number & special character" — says **"Existing UCD"**, Jira says **"Existing User"**.
3. **Jira status:** **In Development** (updated 2026-10-05 08:37 +0800).
4. **Priority:** Medium. **Type:** Story-family parent (component eAuto). **Labels:** 260803-260807, August2026, ProductBacklog.
5. **Assignee / reporter:** BA (Lim Yi Link) on both.
6. **QA field (cf[10041]):** **empty** (null).
7. **BA:** Yi Link (Miro card "BA: Yi Link"; Jira reporter).
8. **Dev:** last named dev Lim Xiwei. Source: Teams 2026-10-01 16:01, Kuik Rui Luan: "this ticket will be handover back to Lim Xiwei, so far the progress left only code review".
9. **Fix version:** "[QA]Ready for Testing Tickets" (release date field 2026-11-02). Due date: none.
10. **Deployment date:** **none set**. Miro column "READY FOR TESTING TICKETS → PACKAGE - ENFORCE 12-CHAR PASSWORD"; card line "- To deploy on:" is blank.
11. **Test env:** **not stated.** Miro "- Test Env:" blank, "- Test Env Point to: -". `[inference]` staging /eauto instance (staging.eauto.my/eauto) per standing env note from 2026-10-21; confirm with QA lead.
12. **Miro estimate:** "Est. Testing Mandays: 3 days for 1 QA", "Base Testing Time: 2 days", "Buffer (Req Change + Bug Fix + Retest Bug): 1 day". Testing Scope "(Automation)".

## 2. Sources read
1. **Jira EAINT-12125** — all fields, 0 comments, 0 sub-tasks, 0 remote links, 1 issue link (relates to **EAINT-12155**, Done). Read 2026-10-26.
2. **Jira attachments (list only):**
   1. `EAINT-12125_SRD_Existing UCD - Enforce 12-Character Password Complexity Across All Portals with uppercase, lowercase, number & special character_v1.0_20260901.pdf` (attached 2026-09-01) — **latest SRD**.
   2. same name `_v1.0_20260901.docx` (2026-09-01); `_v0.1_20260826.docx` (2026-09-01).
   3. `EAINT-12125_CCB-899_Existing_User_Password_Policy_Prototype_v0.2.html` (2026-09-04) — latest design.
   4. `EAINT-12125_CCB-899_Password_Policy_Prototype.html` (2026-08-24).
3. **SRD not retrieved — `EAINT-12125_SRD_..._v1.0_20260901.pdf`/.docx, v1.0, 2026-09-01.** The MCP returns attachment metadata only. No local copy in repo, `_reference/inbox/`, Downloads or OneDrive `eAuto Documents\` (no EAINT-12125 folder). User to drop it into this folder.
4. **Miro card** — `EAINT-12125-miro-card.md` (capture 2026-10-26).
5. **Teams** — `_reference/teams/EAINT-12155-12125-Password-Complexity.md` (chat 2026-08-11 to 2026-10-01; export 2026-10-16).
6. **Knowledge** — `knowledge/teams-decisions-by-ticket.md` §"EAINT-12155 / EAINT-12125"; `knowledge/flow-platform.md` §"Flow: Login, password policy and Forgot Password".

## 3. What changes
1. **Where:** **all portals** — Miro lists "eAuto - Core (Web)" (Main UCD, Sub UCD, BO (different role)), "eAuto - Core (App)" (Main UCD, Sub UCD), "eAuto - AATF" (Main User, Sub User), "eAuto - Service Portal", "Secarang", "CIBO".
2. **What:** **existing users** move to the 12-character password policy when they change or reset a password.
3. **Policy (Teams, Yi Link, 2026-08-11 09:37, verbatim):** "Minimum 12 characters in length. At least one (1) uppercase letter (A–Z). At least one (1) lowercase letter (a–z). At least one (1) number (0–9). At least one (1) special character (e.g. ! @ # $ % ^ & * ( ) _ + - =). No space allowed."
4. **Max length (Teams, Yi Link, 2026-08-18 14:30):** "Max limit: 30 character ... Only listed characters are count as special char."
5. **Why:** security policy split from the new-user ticket. Teams, Yi Link, 2026-08-20 15:45: "I will separate this ticket into two tickets covering existing users and new users. Kindly prioritize the development for new UCD users first. EAINT-12155 New UCD ... EAINT-12125 Existing UCD".
6. **Jira description** holds only the SRD and design version tables; no requirement text.

## 4. New vs existing behaviour
1. **Existing (prod today):** existing users keep old-format passwords (min 6, 8 for AATF/Insurance, alphanumeric — `knowledge/flow-platform.md` Rules, from EAINT-12155). EAINT-12155 (Done, deployed 2026-09-10) enforces the policy only on **create-user** screens.
2. **New:** existing users get the new rules when they update their password. Teams, Yi Link, 2026-08-21 09:23: "Existing user - can update password with new password rules, but no forcing them to update before login."
3. **Same-page change, no popup.** Teams, Yi Link, 2026-08-21 09:52: "he suggested to remain users to change password at same page instead of popups ya."
4. **Two buttons on the existing-user screen.** Teams, Yi Link, 2026-09-04 10:47: "This screen is for existing user to change password ya: Continue to Login - allow UCD to login with existing password regardless of any value entered in password field. Update Password & Continue - ensure UCD update password with new pw policy and redirect them to home page". `[inference]` this message sits in the 12155 testing thread; confirm it applies to the 12125 screen.
5. **Real-time check.** Teams, Yi Link, 2026-08-11 11:35: "System should auto check when user finish entered both "new pw" & "Confirm pw"".

## 5. QA scope (Miro card, verbatim items)
1. "E2E testing (full user journey)": "New user registration > confirm password", "New user > change password", "Existing > change password", "BO Reset password", "BO change password", "Login > Logout > Relogin", "UCD Login Thumbprint Related", "AATF Login Thumbprint Related".
2. "Functional Testing (Boundary testing)" — lengths 11 / 12 / 30 / 31 `[inference]`; each missing class; space; unlisted special char.
3. "Role Testing", "Cross Browser Testing", "Regression testing".
4. "Cross portal?" — open on the card.
5. **SRD scope:** not read (SRD not retrieved).

## 6. Affected regression areas
1. Login on every portal listed in §3.1, plus **thumbprint login** (UCD, AATF).
2. EAINT-12155 pages (Teams, Charmain, 2026-09-08 11:18): "BackOffice, UCD and AATF > Change Password (first time login); BackOffice > Create New Company Account; BackOffice > Manage BackOffice User Account > Add User; BackOffice > Create New AATF/PBT Company Account; BackOffice > Create New Credit/Bank Company User; UCD > Settings > Add New User Account".
3. Admin reset flow (Teams, Charmain, 2026-09-07 11:14): "When an admin updates an existing user's password, the old password format is still allowed ... On their next login, they will see the "Please change your password." page, where the new 12-character password format will apply."
4. Sub UCD first login (Teams, Yi Link, 2026-09-09 09:34): "UCD should enter both "Current Password" & "Confirm Password" to proceed to login."
5. Package siblings on the same build: **EAINT-12228** (Forgot Password) shares the policy.

## 7. Test data / env needs
1. **Existing accounts with old-format passwords** per portal: Main UCD, Sub UCD, BO (several roles), AATF main + sub, Service Portal, Secarang, CIBO, Bank/Credit, Insurance.
2. Insurance users: Teams, Jin Siang Boo, 2026-08-13 15:55: "i think we have 6 only now / and wont have new user as this module be hidden from backoffice d, unless u go in by url (staging.eauto.my/eauto/view/insurance/company-account/user/)".
3. Portal URLs (Teams, JC, 2026-08-13 15:04): "Bank: staging.eauto.my/eauto/bank/login/ ; Insurance: staging.eauto.my/eauto/motorInsurance/login/".
4. MyKad Reader Emulator for thumbprint login (`knowledge/mykad-emulator.md`).
5. AATF temp password changed for 12155 (Teams, Charmain, 2026-09-09 15:20; value redacted in export).

## 8. Dependencies / related tickets
1. **EAINT-12155** (New User, Done, deployed 2026-09-10) — Jira "relates to".
2. **EAINT-12275** — existing prod issue (Password/Confirm not server-checked), parked under **EAINT-148**. Teams, Charmain, 2026-09-04 16:40. Do not re-raise.
3. 12155 QA-Issues as precedent: 12275, 12277, 12278, 12281, 12282, 12283, 12284, 12286, 12294–12298 (Teams 2026-09-04 09:29 and 2026-09-07 12:41).
4. Sub UCD first-login change: Teams, Yi Link, 2026-09-09 10:00: "For above changes on sub ucd, SA side will get Ops to create a CR". CR key unknown.
5. **EAINT-12228** (Forgot Password) — same package.

## 9. Teams decisions (verbatim, `_reference/teams/EAINT-12155-12125-Password-Complexity.md`)
1. 2026-08-14 18:33, Yi Link: "Only listed characters are count as special char ... I believe password could be reusable ya. ... Yes, confirmed with Ops all portals included ya"
2. 2026-08-18 14:30, Yi Link: "Max limit: 30 character ... Confirmed with KJ that above listed special char shud be sufficient."
3. 2026-08-21 09:23, Yi Link: "Existing user - can update password with new password rules, but no forcing them to update before login. New user - must create account with new password rules"
4. 2026-09-02 11:53, Charmain: "the eAuto App will be sharing the same DB as the web version, so the changes for this CR should reflect on the app as well. QA side doesn't need to specifically test this on the app ya" — Way Hou Wong 12:00: "yes. ... no need to test."
5. 2026-09-03 17:25, Yi Link: "If prod allows user to copy paste then we shud allow user to do so with visible & hidden ya ... Follow message in mockup ya"
6. 2026-09-10 12:20, Yi Link: "Mong will take over CR 12125 ya."
7. 2026-10-01 15:39, Yi Link: "As of now, there is no planned deployment date for this ticket just yet"
8. 2026-10-01 16:01, Kuik Rui Luan: "this ticket will be handover back to Lim Xiwei, so far the progress left only code review"
9. Exports end 2026-10-16; newer chat not covered here.

## 10. Open questions / conflicts
1. **Status conflict:** Miro "READY FOR TESTING"; Jira **In Development**; Teams 2026-10-01 "left only code review". Is it on staging?
2. **App scope conflict:** Miro lists "eAuto - Core (App)" Main/Sub UCD; Teams 2026-09-02 says QA does not test the app (said for this CR during 12155).
3. **"Existing UCD" vs "Existing User":** Miro + SRD filename say UCD; Jira title and Miro portal list cover BO, AATF, Service Portal, Secarang, CIBO. Confirm portal list against SRD v1.0.
4. **Miro E2E lists new-user items** ("New user registration > confirm password", "New user > change password") — these belong to 12155 `[inference]`; regression or new scope?
5. **Service Portal, Secarang, CIBO** were not in the 12155 six-portal list (Teams JC 2026-08-13 09:57: "BO · UCD · JPJ · AATF; Portal : Bank / Credit; Portal : Insurance"). JPJ, Bank/Credit and Insurance are missing from the Miro list.
6. **Jira SRD/design table dates say 2025** ("26.08.2025", "01.09.2025", "21.08.2025", "24.08.2025"); attachment files are 2026. Typo `[inference]`.
7. **Deployment date and test env** not set anywhere.
8. **QA assignee** empty in Jira and on the Miro card.
9. SRD v1.0 content unread — scope may differ from Miro.

## 11. Existing repo knowledge / automation to reuse
1. `knowledge/flow-platform.md` §"Flow: Login, password policy and Forgot Password".
2. `knowledge/teams-decisions-by-ticket.md` §"EAINT-12155 / EAINT-12125".
3. `knowledge/mykad-emulator.md` — thumbprint login.
4. `_reference/html/eauto/eauto-public-login-staging-eauto.html` — login page, staging /eauto, captured 2026-10-21.
5. `_reference/html/cibo/login.html` — CIBO login.
6. Login page objects: `scripts/eauto-estm/pages/LoginPage.ts`, `scripts/eauto-edereg-precheck/pages/LoginPage.ts` and `BoLoginPage.ts`, `scripts/eauto-jomcheck/pages/ServicePortalLoginPage.ts`, `scripts/eauto-12107/pages/BankLoginPage.ts`.
7. No automation exists yet for change-password pages.
