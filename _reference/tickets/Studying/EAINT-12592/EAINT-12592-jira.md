# EAINT-12592 — Jira capture (30/10/2026, 3:03:31 pm)

Captured by the pipeline toolbox (scripts/pipeline/tools/fetch.mjs issue). Raw text of the Jira fields, description and comments.

1. **Summary:** (eAuto-App) [iOS] Biometric login (Face ID / Touch ID) with saved accounts
2. **Type:** Sub-task · **Status:** Done · **Priority:** Medium
3. **Assignee:** Shane · **Reporter:** Shane · **QA (cf 10041):** —
4. **Fix versions:** —
5. **Labels:** —
6. **Created:** 2026-10-23T13:06:31.148+0800 · **Updated:** 2026-10-28T16:51:32.314+0800
7. **Exp. Deploy Date (cf 10087):** — · **ETA for Testing (cf 10057):** — · **[QA] Est Man-day (cf 10081):** —
8. **Links:** —
9. **Sub-tasks:** —
10. **Parent:** EAINT-9805 ⚫eAuto Mobile App - Phase 6: STMS - To update STMS module same as Production Web Portal (as of 29.01.2026)

## Description

Dealers can save up to 5 eAuto accounts on their phone and log in to one with Face ID or Touch ID instead of typing the password. They can also turn Face ID login on or off for the logged-in account from the new Account tab. iOS builds first; Android ports later from the same specs.
Design and proposal
- Design canvas (all screens + 7 flows, Flow 7 = turn off / on from the Account tab, screens 15 to 21): https://claude.ai/artifact/AXyWf6sPDU7cZhoJBuSRt7
- Proposal doc: https://claude.ai/artifact/V8jjxYyD57WJMLctmTgA8f
- Specs in the iOS repo: specs/003-biometric-login.md (login rules) and specs/004-account-page.md (Account tab, Face ID switch, kept password, login offer rules)
Requirement
- No backend change. Face ID only unlocks the saved username + password, then today's login runs as if typed (settings.get then login.do). No new, moved or re-sent API call.
- Up to 5 saved accounts per phone. Each account agrees on its own; an account is never saved automatically.
- Password is stored only in the iOS Keychain, behind Face ID / Touch ID, on this device only. Never logged.
- Phones with no saved account see today's login screen, unchanged.
- Turning Face ID on from the Account tab never calls the server. On staging (28 Oct) every login.do while signed in ends the current session, even with a wrong password, so a password re-check would log the user out on a typo. Instead the app keeps the logged-in account's password (see Kept password below).
What was built
- Turn-on page after a typed login: "Log In Faster with Face ID", text "Next time, you can log in without typing your password. You can also turn this on later in Account.", Turn On Face ID / Maybe Later. Asked once per account on this phone: after Maybe Later that account is not asked again (not the next day either). A new account is asked. (Changed 28 Oct: was once per calendar day.)
- 5 accounts already on Face ID: another account's typed login goes straight to Home, no page. That account is not marked as asked, so it is offered once there is room. (Changed 28 Oct: the after-login "Saved Accounts Are Full" page is removed; users who only logged in were confused by "can't be saved".)
- Saved-accounts list on the login screen: company name + username + Face ID / Touch ID icon per row. Company name comes from the existing home.do reply.
- Edit mode: red Remove per row, "Remove account?" dialog, no Face ID needed to remove. "Account removed" toast (existing app toast, 2 s).
- Edit mode save-limit hint below the card (canvas screens 13 and 14): "You can save up to 5 accounts on this phone." when 1 to 4 are saved, "You've saved the maximum of 5 accounts. Remove one to save another." when 5 are saved. Grey 14 pt regular text, edit mode only.
- "Login with another account" opens a bottom sheet (title "Login") with today's fields. Closing clears both fields.
- Tap a saved row: one Face ID / Touch ID prompt, then Home. If Face ID fails, the prompt offers "Use Password", which opens the sheet with the username filled in.
- Dialogs: Face ID Is Off (Use Password / Go to Settings), Face ID Is Locked, Saved Login Not Working, Face ID Changed.
- Touch ID phones get the same screens with Touch ID wording and a fingerprint icon.
- Account tab, "Login with Face ID" switch (new, 28 Oct) for the logged-in account. States: on; off; Face ID off for eAuto (greyed, "Go to Settings"); not set up; locked; 5 accounts already on Face ID ("Face ID is already on for 5 accounts on this phone. Remove one on the login screen to use it here."); kept password missing ("To turn this on, log out and log in again."); no Face ID / passcode on the phone (section hidden).
- Turn Off: "Turn Off Face ID?" / "You'll need to enter your password to log in to this account." / Cancel, Turn Off. Turn Off removes this account's saved login (like Edit > Remove), marks it declined, toast "Face ID turned off". A declined account is never offered the turn-on page after a typed login; only the switch turns it back on.
- Turn On: one Face ID / Touch ID scan, no password, no server call, toast "Face ID turned on". Cancel or no match: stays off, no message.
Kept password (new, 28 Oct)
- After every successful login (typed or Face ID) the app keeps that account's password in the Keychain, readable only with the phone's current Face ID / Touch ID (no passcode fallback), this device only. Only the logged-in account; not a saved account (not on the list, not in the 5-count); never shown or logged.
- Turn On reads it with the scan and saves the login the same way the turn-on page does.
- Deleted on every way out of the session (one shared place, 12 paths tested): Logout on Home or Account, server logout (S00017, S00026, session invalid), maintenance, error handling, blocked eSTM user, 1 h in background, 8 h after login, launch without a session, reinstall.
- A Face ID change makes it unusable; the switch then says "To turn this on, log out and log in again."
Rules for removing a saved login
- Only the server's DENIED (wrong password) removes that one account, with "Saved Login Not Working".
- A real Face ID / Touch ID change on the phone removes all saved accounts, with "Face ID Changed".
- Edit > Remove, Turn Off in the Account tab and an app reinstall also remove them.
- A wrong face, cancel, lockout, "Use Password", a keychain or storage glitch, network / server error, maintenance or S00018 to S00026 never remove or hide anything.
- An iOS update (e.g. iOS 17 to 18) must not be treated as a Face ID change.
- After Edit > Remove, DENIED or a Face ID change, the next typed login of that account offers the turn-on page again. After Turn Off it does not (declined).
Test scope
QA can test most of it on the simulator. Setup per simulator: Simulator menu > Device > Face ID > Enrolled. At the Face ID prompt go to Face ID pick Authorized with Face ID (pass) or Unauthorized with Face ID (fail). Use an iPhone SE simulator for Touch ID.
Before testing: anyone who tapped Maybe Later on an older build will not see the turn-on page again for that account (the old daily record now counts as asked). Delete and reinstall the app to start clean, or turn Face ID on from the Account tab.
- First typed login: iOS Face ID permission alert, turn-on page with the new text, Turn On > Home.
- Maybe Later: Home. Log out and log in again by typing (same day or next day): no page.
- Already saved account logs in by typing: Home, no page (password refreshed quietly). Then tap the row: Face ID still works (repeat twice).
- Turn On cancelled / no match: stays on the turn-on page. Don't Allow: Home, nothing saved.
- 5 accounts already saved, a 6th account logs in by typing: straight to Home, no page. Remove one saved account, log the 6th in by typing again: turn-on page shows.
- Logout: list shows company + username; account without a company name shows username only.
- Tap row: one prompt > Home. Network log shows exactly one settings.get, then login.do, then home.do. Turn On sends no extra settings.get either.
- Tap row, cancel or Non-matching Face: stays on the list, no message, all rows kept. "Use Password" opens the sheet with the username. Edit and "Login with another account" do nothing while the prompt is up.
- Offline tap: today's offline message, no prompt.
- Face ID off for eAuto in iPhone Settings: "Face ID Is Off"; Use Password > sheet pre-filled; Go to Settings > turn on > back > next tap prompts.
- Password changed on the web portal: tap row > "Saved Login Not Working" > OK > sheet pre-filled, row removed; typed login > turn-on page again.
- Face ID changed (simulator: untick and tick Enrolled): open app > "Face ID Changed" over today's screen, list gone.
- Edit > Remove > Cancel keeps the row; Remove > "Account removed" toast; last row > today's screen. Typed login of a removed account > turn-on page again.
- Edit mode hint: 1 to 4 saved shows "You can save up to 5 accounts on this phone."; 5 saved shows the maximum text; removing one at 5 switches back at once; not shown outside edit mode.
- Bottom sheet: wrong password shows the error inside the sheet at once (no bounce); closing does not flash the error on the list; reopen has empty fields.
- No glide: Edit / Done, Remove and "Login with another account" change the screen at once.
- Account messages (S00018 to S00026, session expired, maintenance) still show as today; saved rows kept.
- Leave the app to the background and come back: one settings.get (maintenance check) only.
- Delete and reinstall the app: today's login screen, nothing saved. Install a new build over an old one: saved accounts stay, no "Face ID Changed".
- Touch ID phone (iPhone SE): Touch ID wording and fingerprint icon everywhere.
- Account tab, saved account: switch on. Tap > "Turn Off Face ID?" > Cancel: still on. Turn Off: off, toast; log out: the account is gone from the list.
- Account tab, off: tap > only the Face ID scan (no password, no dialog) > on, toast "Face ID turned on"; Home still loads (still logged in). Network log shows no call at Turn On.
- Turn On, cancel or fail the scan: stays off, no message; tap again: scan comes back.
- After Turn Off: log out, log in by typing: no turn-on page. Account switch turns it back on.
- Log in as a second account that is not saved > Account > Turn On works for that account.
- 5 accounts already saved, logged in as a 6th: switch greyed with the 5-accounts note, no prompt.
- Face ID changed while logged in (real iPhone: add an Alternate Appearance): Account switch greyed, "To turn this on, log out and log in again."; log out and in: enabled.
- Session from a build before the Account tab (install over without logging out): Account shows "To turn this on, log out and log in again."
Real iPhone only (already tested by Shane on iPhone): Face ID lockout after repeated wrong faces, a different person's face, keyboard over the sheet; 28 Oct: Account Turn Off / Turn On with only a face scan, cancel scan, ask once (Maybe Later), Remove > asked again, Turn Off > never asked. Not yet tested on a real phone: passcode turned off, a real Touch ID iPhone, Face ID changed while logged in.
Status (28 Oct)
- Login part landed in dev/PHASE-6 on 23 Oct (5291bed; QA staging build 2).
- Account tab Face ID switch, kept password and the login offer changes: built on feat/settings-page (HEAD 9eef126, together with the new Home · Help · Account tab bar), all unit tests pass except 4 old known failures, iPhone checks passed 28 Oct. Merge into dev/PHASE-6 being checked now; not pushed yet.
- QA build: after it lands, from the normal CI build.
- Android: not started; ports from the specs.
Status history
- 23 Oct: login part cleared for QA, landed in dev/PHASE-6 at 5291bed (feat/biometric-login, code-reviewed, 2652 unit tests), develop ae0564f = staging build 2.

## Comments (1)

### Shane — 2026-10-23T17:45:52.096+0800

QA build ready (23 Oct): eauto-ios-staging-v1.0.0-2 (develop ae0564f)
https://github.com/modefair/eAuto-iOS/actions/runs/39932567201 (download the artifact at the bottom, link expires in 14 days)
Landed in dev/PHASE-6 at 5291bed; develop moved to ae0564f (staging build 2).
Face ID on simulator (newer Xcode, "Device Hub")
The menu names differ from the test scope above. In newer Xcode the simulator runs in Device Hub:
- Menu bar: Device > Face ID > tick Enrolled (older Xcode: Simulator > Features > Face ID > Enrolled)
- Log in with password, tap Turn On Face ID, allow the iOS popup
- When the app waits for a face: Device > Face ID > Authorized with Face ID (= Matching Face) → Home
- Log out, tap the saved account row, Authorized with Face ID again → straight to Home, no password
- Wrong face: Unauthorized with Face ID (= Non-matching Face) → stays on the list, rows and Use Password kept
Steps 1 to 4 checked by Shane on the simulator (iPhone 18 Pro, Staging-Debug, version 1.0.0 (2)).

## Attachments
