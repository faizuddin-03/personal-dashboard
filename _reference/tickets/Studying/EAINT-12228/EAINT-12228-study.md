<!-- Study written 2026-10-26 by Claude. Read-only sources: Jira (Atlassian MCP), Miro capture 2026-10-26, Teams exports (end 2026-10-16), repo knowledge/. No browser used. -->

# EAINT-12228 study

## 1. Header
1. **Title (Jira, verbatim):** "🔴[eAuto-Login Page] Add Forgot Password Link at Login Page for Self-Service Password Reset"
2. **Jira status:** **In Development** (updated 2026-10-05 08:37 +0800).
3. **Priority:** Medium. **Labels:** 260824-260828, August2026, ProductBacklog. Created 2026-08-26.
4. **Assignee:** BA (Lim Yi Link). **Reporter:** SA (Chee Mei Jia).
5. **QA field (cf[10041]):** **empty** (null).
6. **BA:** Yi Link (Teams group owner, SRD uploader). **SA:** "SA: MJ" (Miro card).
7. **Dev:** last named dev Lim Xiwei. Teams 2026-10-01 16:04, Kuik Rui Luan: "this ticket will be handover to Lim Xiwei, so far the progress left only code review".
8. **Fix version:** "[QA]Ready for Testing Tickets" (release date field 2026-11-02). Due date: none.
9. **Deployment date:** **none set**. Miro column "READY FOR TESTING TICKETS → PACKAGE - ENFORCE 12-CHAR PASSWORD"; "- To deploy on:" blank.
10. **Test env:** **not stated.** Miro "- Test Env:" blank. `[inference]` staging /eauto instance; confirm.
11. **Miro estimate:** blank — "Est. Testing Mandays: days for 1 QA". Testing Scope "(Automation)" with no items.

## 2. Sources read
1. **Jira EAINT-12228** — all fields, 0 comments, 0 sub-tasks, 0 issue links, 0 remote links. Read 2026-10-26.
2. **Jira attachments (list only):**
   1. `SRD_EAINT-12228_v1.1_20260924.pdf` and `.docx` (attached 2026-09-24 18:01) — **latest SRD**.
   2. `SRD_EAINT-12228_v1.0_20260915.pdf` / `.docx`; `SRD_EAINT-12228_v0.2_20260915.docx`; `SRD_EAINT-12228_v0.1_20260914.docx`.
   3. `ProcessFlow_EAINT-12228_ForgotPassword.png` (2026-09-15); `Prototype_EAINT-12228_ForgotPassword.html` (2026-09-15).
3. **SRD not retrieved — `SRD_EAINT-12228_v1.1_20260924.pdf`, v1.1, 2026-09-24.** MCP gives metadata only; no local copy in repo, inbox, Downloads or OneDrive. User to drop it here, with the process-flow PNG and prototype HTML.
4. **Miro card** — `EAINT-12228-miro-card.md`.
5. **Teams** — `_reference/teams/EAINT-12228-12333-Forgot-Password-and-Proforma-Invoice.md` part 1 (full history 2026-09-11 to 2026-10-01).
6. **Knowledge** — `knowledge/flow-platform.md`; `knowledge/teams-decisions-by-ticket.md` §EAINT-12228; `_reference/inbox/eauto-flows-run/11-conflicts.md` lines 444–447.

## 3. What changes (Jira description, verbatim)
1. **Affected Portal / Module:** "eAuto Login Page".
2. **Request:** "Add a Forgot Password link at eAuto login page to allow user to reset password on their own, without calling careline or emailing Support."
3. **Existing:** "User can reset password in Settings, but user need to login first. If user forgot username or password, user need to call in to careline or email to Support email for manual reset."
4. **Original expected:** "Display Forgot Password link below the login box at eAuto login page. Link redirects user to Change Password page. ... For Main User ... an OTP is sent to the Main User's registered phone number. ... For Sub User, normal reset behaviour applies."
5. **Superseding note (Additional Note, verbatim):** "Confirmed requirements as at 11.09.2026. Refer to SRD v0.1. The following supersede item 3, item 4 and item 5 under Expected New Handling/Behaviour:"
   1. "The verification code is sent to the Main User's registered email address. SMS and MessageBird are not used."
   2. "The verification code is valid for 5 minutes, allows a maximum of 5 incorrect attempts, and is limited to a maximum of 3 requests within a rolling 24-hour period."
   3. "The Sub User resets the password directly after entering a valid Login ID. No verification code is required for the Sub User."
   4. "The password policy of minimum 12 characters, at least 1 uppercase letter, 1 lowercase letter, 1 number and 1 special character applies to both the Main User and the Sub User."
   5. "The link redirects the user to a new Forgot Password page, not the existing Change Password page."
   6. "A password change confirmation email is sent to the user's registered email address and copied to support@eauto.my for both the Main User and the Sub User."
   7. "After a successful reset, all other existing sessions and devices are logged out and the user lands on the logged-in Home page."
   8. "The verification code email template and the password change confirmation email template are pending confirmation from Ops."
6. **SRD history (Jira):** "V0.2 | Added the AATF and the Sub AATF as applicable user types. Removed the copy of the password change confirmation email to support@eauto.my."; "V1.1 | Added the verification code email template  Added the password change confirmation email template confirmed by Ops."

## 4. New vs existing behaviour
1. **Existing (prod code):** no Forgot Password link. `_reference/inbox/eauto-flows-run/11-conflicts.md` line 445 [askeauto, prod code 2026-10-22]: "the login page shows no Forgot Password link. An old Forgot Password page exists (Login ID, email, captcha) but its link bounces the visitor to the logout / home page, so nobody can reach it."
2. **Staging baseline:** `_reference/html/eauto/eauto-public-login-staging-eauto.html` (captured 2026-10-21) has no "Forgot" text — build not on staging /eauto then.
3. **New:** link below login box → new Forgot Password page → Main user (UCD / AATF) gets email verification code → sets 12-char password → confirmation email → other sessions logged out → lands on Home (logged in). Sub user (UCD / AATF) enters Login ID → resets directly.

## 5. QA scope
1. **Miro card:** no scope items written ("- Testing Scope: (Automation)" then "-").
2. **From Jira + Teams** `[inference — to confirm against SRD v1.1]`:
   1. Link visible below login box; opens new Forgot Password page.
   2. Main UCD and Main AATF: code to registered email; 5-minute expiry; 5 wrong attempts; 3 requests per rolling 24 h.
   3. Sub UCD and Sub AATF: valid / invalid Login ID; no code.
   4. Password policy boundary (shared with EAINT-12125).
   5. Confirmation email content and recipients (Mailtrap).
   6. Session logout on other devices/browsers; landing on Home.
   7. Email templates (SRD v1.1).

## 6. Affected regression areas
1. Login page on all user types (UCD main/sub, AATF main/sub); BO login if it shares the page `[inference]`.
2. Settings > Change Password (existing reset path).
3. First-time-login "Please change your password." page (EAINT-12155).
4. Session handling / concurrent logins.

## 7. Test data / env needs
1. Main UCD, Sub UCD, Main AATF, Sub AATF accounts with **known registered emails** that land in **Mailtrap** (`knowledge/mailtrap.md`).
2. Way to wait out or reset the **3 requests / 24 h** limit and the **5-minute** code expiry (ask dev for a DB reset) `[inference]`.
3. Two browsers / devices for the "all other sessions logged out" check.

## 8. Dependencies / related tickets
1. **EAINT-12125** / **EAINT-12155** — same password policy.
2. No Jira links on the ticket.

## 9. Teams decisions (verbatim, `_reference/teams/EAINT-12228-12333-Forgot-Password-and-Proforma-Invoice.md`)
1. 2026-09-14 12:55, Yi Link: "uploaded SRD v0.1 to JIRA"
2. 2026-09-15 15:35, Yi Link: "I had a walkthrough session with Nurul on the design, we should include AATF and sub AATF for this ticket. ... AATF - same flow as Main UCD; sub AATF - same flow as sub UCD"
3. 2026-09-15 15:51, Yi Link: "Also, to add on for this confirmation email, it is sent to users email address only after user changed to new password successfully."
4. 2026-09-15 16:43, Yi Link: "uploaded SRD v0.2 and v1.0 to JIRA. Also, attached design reference & process flow"
5. 2026-09-25 10:42, Kuik Rui Luan: "I will start dev today, ETA 4 days including code review"
6. 2026-10-01 15:54, Yi Link: "QAs, kindly advice on the staging env once this ticket has planned deployment date ya."
7. 2026-10-01 16:04, Kuik Rui Luan: "this ticket will be handover to Lim Xiwei, so far the progress left only code review"
8. Exports end 2026-10-16.

## 10. Open questions / conflicts
1. **support@eauto.my copy:** Jira note says "copied to support@eauto.my"; Jira SRD table v0.2 says "Removed the copy of the password change confirmation email to support@eauto.my." SRD v1.1 decides — unread.
2. **Verification channel:** Jira item 5 says OTP to "registered phone number"; superseding note says "registered email address. SMS and MessageBird are not used." `knowledge/flow-platform.md` still says phone and "Goes to the Change Password page" — **out of date** vs the note.
3. **Status conflict:** Miro "READY FOR TESTING"; Jira **In Development**; Teams 2026-10-01 "only code review".
4. **Miro card empty:** no estimate, no scope, no QA. Who owns it?
5. **BO / Service Portal / Secarang / CIBO** login pages — in scope or not? Ticket names only "eAuto Login Page" plus AATF.
6. **Main vs Sub detection** when the Login ID is unknown or inactive — behaviour unknown until SRD read.
7. Deployment date and test env not set.

## 11. Existing repo knowledge / automation to reuse
1. `knowledge/flow-platform.md` §"Flow: Login, password policy and Forgot Password" (update after SRD read; phone/OTP text stale).
2. `knowledge/mailtrap.md` — shared staging inbox.
3. `_reference/html/eauto/eauto-public-login-staging-eauto.html` — pre-change login page baseline.
4. Login page objects: `scripts/eauto-estm/pages/LoginPage.ts`, `scripts/eauto-edereg-precheck/pages/LoginPage.ts`.
5. Mailtrap checks in existing automation `[unconfirmed]` — see `knowledge/mailtrap.md`.
