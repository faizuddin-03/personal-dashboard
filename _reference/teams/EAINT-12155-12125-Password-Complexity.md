<!-- Source: Teams group chat "EAINT-12155 & 12125 [eAuto] Enforce 12-Character Password Complexity Across All Portals".
     Captured 2026-10-16 (read-only sweep). Times MYT. Full history (2026-08-11 to 2026-10-01, 137 messages), condensed: acknowledgements and follow-up pings dropped.
     "Unknown User" = Leong Jin Chuen (JC). Temporary passwords replaced with [redacted]. -->
# EAINT-12155 / EAINT-12125 12-character password complexity

[2026-08-11 09:37] Yi Link Lim: updated password complexity: Minimum 12 characters in length. At least one (1) uppercase letter (A–Z). At least one (1) lowercase letter (a–z). At least one (1) number (0–9). At least one (1) special character (e.g. ! @ # $ % ^ & * ( ) _ + - =). No space allowed.
[2026-08-11 11:35] Yi Link Lim: rmb to add text display on screen to inform user on password limitation when they reset & change ... Expected behaviour: System should auto check when user finish entered both "new pw" & "Confirm pw"
[2026-08-11 12:07] Goh Kai Jiaeh: fyi JC will help on this ticket.
[2026-08-11 15:14] Yi Link Lim: We plan to deploy this ticket by Sept 2026.
[2026-08-12 15:32] Leong Jin Chuen: clarifications: maximum length? other special characters valid? password reuse prevention?
[2026-08-13 09:57] Leong Jin Chuen: Does it mean a total of 6 portals: eAuto Main Portals : BO · UCD · JPJ · AATF; Portal : Bank / Credit; Portal : Insurance
[2026-08-13 15:04] Leong Jin Chuen: Bank: staging.eauto.my/eauto/bank/login/ ; Insurance: staging.eauto.my/eauto/motorInsurance/login/
[2026-08-13 15:55] Jin Siang Boo: if you means insurance user account, i think we have 6 only now / and wont have new user as this module be hidden from backoffice d, unless u go in by url (staging.eauto.my/eauto/view/insurance/company-account/user/)
[2026-08-14 18:33] Yi Link Lim: Only listed characters are count as special char ... I believe password could be reusable ya. ... Yes, confirmed with Ops all portals included ya
[2026-08-18 14:30] Yi Link Lim: Max limit: 30 character ... Only listed characters are count as special char. Confirmed with KJ that above listed special char shud be sufficient.
[2026-08-20 15:45] Yi Link Lim: I will separate this ticket into two tickets covering existing users and new users. Kindly prioritize the development for new UCD users first. EAINT-12155 New UCD ... EAINT-12125 Existing UCD ...
[2026-08-21 09:23] Yi Link Lim: Existing user - can update password with new password rules, but no forcing them to update before login. New user - must create account with new password rules
[2026-08-21 09:52] Yi Link Lim: Updated KJ on the existing user approach, he suggested to remain users to change password at same page instead of popups ya.
[2026-08-21 12:25] Yi Link Lim: design for Reset password for both existing & new user ... EAINT-12155_CCB-899_Password_Policy_Prototype 1.html
[2026-09-01 16:18] Charmain Ea Chiang: once ready please deploy to staging/uat1 for QA to test
[2026-09-02 11:53] Charmain Ea Chiang: Hi Way Hou Wong, as discussed earlier, the eAuto App will be sharing the same DB as the web version, so the changes for this CR should reflect on the app as well. QA side doesn't need to specifically test this on the app ya
[2026-09-02 12:00] Way Hou Wong: yes. ... no need to test.
[2026-09-03 13:09] Charmain Ea Chiang: is it expected to allow users to copy and paste the password in both states ...? The build's password rules differ from the prototype in 2 places
[2026-09-03 17:25] Yi Link Lim: If prod allows user to copy paste then we shud allow user to do so with visible & hidden ya ... Follow message in mockup ya
[2026-09-04 09:29] Charmain Ea Chiang: 8 QA-Issues under the parent: EAINT-12275 (server does not check Password/Confirm match), 12277 (no 30-char limit), 12281 (copy/paste), 12284 (spaces/symbols not removed), 12278 (rules stay grey, no show-password icon), 12282 (rule text vs mockup), 12283 (empty space left column), 12286 (button vs design)
[2026-09-04 10:47] Yi Link Lim: This screen is for existing user to change password ya: Continue to Login - allow UCD to login with existing password regardless of any value entered in password field. Update Password & Continue - ensure UCD update password with new pw policy and redirect them to home page
[2026-09-04 16:40] Charmain Ea Chiang: i will close this ticket: EAINT-12275 ... As this is existing production issue, and the same issue also occurs in staging/eAuto, i will move the ticket to park under EAINT-148 for us to fix later.
[2026-09-07 11:14] Charmain Ea Chiang: we will keep the behaviour below as it is existing PROD behaviour ya: When an admin updates an existing user's password, the old password format is still allowed. EAINT-12155 only changes the password format on the Create User screens. After the password is [redacted] the user will be treated as a new user. On their next login, they will see the "Please change your password." page, where the new 12-character password format will apply.
[2026-09-07 12:41] Leong Jin Chuen: fixes: EAINT-12278 rule added; 12298 removed the check - keeps the old rule with the hardcode password; 12297 removed validateInputFields() that strips ~* from all fields; 12294 popup "Confirm Password does not match the new password."; 12296 popup "Please fill in mandatory field."
[2026-09-07 14:21] Leong Jin Chuen: EAINT-12283 layout; EAINT-12295 removed duplicate "New password not matched" line on UCD Add New User page, color red (#FF4000)
[2026-09-08 11:18] Charmain Ea Chiang: QA has completed testing for EAINT-12155 on staging/uat1 (eAuto) with no outstanding issues. It's ready for morning deployment on 10 Sep (Thursday). Pages: BackOffice, UCD and AATF > Change Password (first time login); BackOffice > Create New Company Account; BackOffice > Manage BackOffice User Account > Add User; BackOffice > Create New AATF/PBT Company Account; BackOffice > Create New Credit/Bank Company User; UCD > Settings > Add New User Account
[2026-09-08 16:35] Leong Jin Chuen: (pre-populating sub-user temp password) it may be doable but it weakens the security design
[2026-09-09 09:34] Yi Link Lim: Latest expected behavior for Sub UCD 1st time login: UCD should enter both "Current Password" & "Confirm Password" to proceed to login.
[2026-09-09 10:00] Yi Link Lim: we will deploy 12155 on 10 Sept as planned. For above changes on sub ucd, SA side will get Ops to create a CR
[2026-09-09 15:20] Charmain Ea Chiang: the AATF temporary password will be updated to: [redacted]
[2026-09-09 17:04] Goh Kai Jiaeh: Latest prod + EAINT-12155 + EAINT-12171 (on staging/uat1)
[2026-09-10 08:40] Goh Kai Jiaeh: deployment is done.
[2026-09-10 11:16] Charmain Ea Chiang: verified and tested all good on prod ya, will continue monitoring production until 1pm
[2026-09-10 12:20] Yi Link Lim: Mong will take over CR 12125 ya.
[2026-09-24 14:18] Mong Guo Hao: this ticket actually handed over to Tracy yea
[2026-09-28 08:58] Kuik Rui Luan: I will try to make it by Thu eod ya
[2026-10-01 15:39] Yi Link Lim: QAs, kindly advice dev side on the staging env if this ticket has arranged deployment date ya. As of now, there is no planned deployment date for this ticket just yet
[2026-10-01 16:01] Kuik Rui Luan: this ticket will be handover back to Lim Xiwei, so far the progress left only code review
