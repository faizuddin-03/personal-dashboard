# EAINT-12180 — QA Team test script study (2026-10-27)

## Sources read

1. **Text copy** `_reference/sharepoint/qa-team-ts/EAINT-12180 - 🔴[eAuto-UCD] Homepage - To Display Announcement Popup for Mozilla Firefox to Google Chrome Migration Effective 1 January 2027.md` — header: "text copy (27/10/2026, 7:56:10 pm)", "Cell text only, row by row; formatting and images are not kept." Read in full.
2. **The .xlsx itself** — not opened. Cell colours, images and cached formula results beyond the text copy are not known.
3. `_reference/tickets/EAINT-12180/` — **did not exist** before this study. `_reference/tickets/Studying/EAINT-12180/` — **does not exist**. No SRD, Miro card or Jira export for 12180 in the repo.
4. `lib/ticketStudies.ts` — **no 12180 study**. 12180 appears only as a related ticket and in a footer decision inside the EAINT-12253 entry (lines 265, 272).
5. knowledge/ files checked: `flow-browser-reminder.md`, `flow-platform.md` (§ Firefox to Chrome messages), `flow-ucd-shell.md`, `business-rules-from-test-scenarios.md` §7 item 8, `teams-decisions-by-ticket.md` § EAINT-12180 / EAINT-12253, `README.md`.

## 1. Header

1. **Ticket:** EAINT-12180 — "🔴[eAuto-UCD] Homepage - To Display Announcement Popup for Mozilla Firefox to Google Chrome Migration Effective 1 January 2027".
2. **Portals:** UCD (Main and Sub) and AATF. Page: **Homepage after login**.
3. **Workbook:** "EAINT-12180 - 🔴[eAuto-UCD] Homepage - To Display Announcement Popup for Mozilla Firefox to Google Chrome Migration Effective 1 January 2027.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 12/10/2026 10:08:44 pm. Catalogue entry #036 (`knowledge/cr-test-scenario-catalogue.md` line 373).
4. **Sheets (4):** Overall Progress, Configuration, Scenario Testing, Functional Testing.
5. **Scenarios: 8** — 6 in Scenario Testing (`12180_TS1`–`12180_TS6`, 33 step rows), 2 in Functional Testing (`12180_FT1`–`12180_FT2`, 7 step rows).
6. **Results:** every step row is "Pass". Overall Progress (sheet Overall Progress, rows 5–7): Scenario Testing Total "6", Pass "6"; Functional Testing Total "7", Pass "7"; TOTAL "13", Pass "13", Pass % "1" (100%). Manual "10", Automation "3".
7. **Count quirk:** row 9 says "One test step = one item", but Scenario Testing shows Total "6" against 33 step rows. Functional Testing "7" does match its 7 step rows. The two sheets are counted differently. [unconfirmed — cached values in the text copy; formulas may recalc differently in Excel]
8. **Tester:** QA column "May" on every row. **Test dates:** not written in the sheet.
9. **Ticket status (from knowledge, not the sheet):** hot-patched to prod 2026-09-08 `[from teams-decisions-by-ticket.md item 5; releases.md line 36]`.

## 2. What the ticket changed, as the TS shows it

1. A **new announcement popup** on the Homepage after login, for Firefox v36 users of UCD and AATF.
2. It **replaces the old Firefox-to-Chrome popup**: "The old Firefox-to-Chrome popup is no longer displayed." (sheet Scenario Testing, rows 3, 10, 25).
3. **Chrome users never see it** (sheet Configuration, row 19: "Google Chrome | No | Automation | Company / Business Profile update banner still displays").
4. New **wording and dates**: Firefox support ends 31 December 2026; Chrome required from 1 January 2027 (sheet Functional Testing, rows 6–9).
5. Three **supporting links**: View PDF Guide, Watch Tutorial Video, user guide (sheet Functional Testing, rows 3–5).

## 3. Scenarios

### A. Scenario Testing — "Announcement Popup Display & Session Behaviour" (sheet Scenario Testing, row 1)

1. **12180_TS1** (P1, Firefox v36, Main UCD **with** pending Company / Business Profile update, Manual, rows 3–9) — popup after login; stays on refresh and after user guide + back; after close: "The Company / Business Profile update banner is displayed correctly." (row 6); refresh and navigate after close: "The new announcement popup is not displayed." (rows 7–8); re-login: "The new announcement popup is displayed again after login." (row 9). Pass.
2. **12180_TS2** (P1, Firefox v36, Sub UCD **without** pending update, Manual, rows 10–16) — same 7 steps; after close: "The UCD homepage is displayed." (row 13). Pass.
3. **12180_TS3** (P1, Chrome, Main UCD without pending update, Automation, rows 17–20) — login, refresh, navigate, re-login: "The new announcement popup is NOT displayed." Pass.
4. **12180_TS4** (P1, Chrome, Sub UCD **with** pending update, Automation, rows 21–24) — every step: "Only the Company / Business Profile update banner is displayed." Pass.
5. **12180_TS5** (P1, Firefox v36, AATF, Manual, rows 25–31) — same 7 steps as TS1; after close: "The ANNOUNCEMENT/PENGUMUMAN banner is displayed correctly." (row 28). Pass.
6. **12180_TS6** (P1, Chrome, AATF, Automation, rows 32–35) — not shown; "The ANNOUNCEMENT/PENGUMUMAN banner is displayed correctly." (row 32). Pass.

### B. Functional Testing — "Announcement Popup Supporting Links" (sheet Functional Testing, row 1)

1. **12180_FT1** (P1, Firefox v36, UCD & AATF, Manual, rows 3–5) — "[View PDF Guide / 查看操作指南]" → "The Installation Guide PDF opens in a new tab."; "[Watch Tutorial Video / 查看教学视频]" → "The Installation Guide video overlay popup opens on the same tab."; "[user guide]" → "The current tab is redirected to the User Guide page." Pass.
2. **12180_FT2** (P1, Firefox v36, Manual, rows 6–9) — title "Announcement 公告"; English body; Chinese body; popup footer text (see §4). Pass.

## 4. Business rules and system behaviour

1. **Shown after every login (Firefox):** "The new announcement popup is displayed again after login." (sheet Scenario Testing, rows 9, 16, 31).
2. **Survives refresh while open:** "Refresh the page manually without closing the popup." → "The new announcement popup is still displayed correctly." (sheet Scenario Testing, rows 4, 11, 26).
3. **Survives leaving via user guide and coming back:** "Click the [user guide] hyperlink on the popup to go to another page, then navigate back." → "The new announcement popup is still displayed correctly." (sheet Scenario Testing, rows 5, 12, 27).
4. **Once closed, gone for the session:** "Refresh the page again after closing the popup." → "The new announcement popup is not displayed." and "Navigate to another page and back." → same (sheet Scenario Testing, rows 7–8, 14–15, 29–30).
5. **Order with other home popups:** UCD with pending update → profile update banner shows after the announcement is closed (row 6). AATF → "ANNOUNCEMENT/PENGUMUMAN banner" after close (row 28).
6. **Chrome:** "The new announcement popup is NOT displayed after login." (rows 17, 21, 32). With pending update: "Only the Company / Business Profile update banner is displayed." (rows 21–24).
7. **Title:** "The title is displayed as: Announcement 公告." (sheet Functional Testing, row 6).
8. **English body** (sheet Functional Testing, row 7), verbatim: "Support for Mozilla Firefox will officially end on 31 December 2026. ⏎ ⏎ Effective 1 January 2027, all users are required to use Google Chrome when accessing the eAuto system. This transition enhances system security, compatibility, performance, and browsing efficiency. ⏎ ⏎ Please switch to Google Chrome before the deadline to ensure uninterrupted access to eAuto services. ⏎ ⏎ To assist you with the transition process, please click the following button for detailed guidance: ⏎ View PDF Guide ⏎ Watch Tutorial Video ⏎ or learn more at user guide page".
9. **Chinese body** (sheet Functional Testing, row 8), verbatim: "Mozilla Firefox 的支持服务将于 2026年12月31日 正式结束。 ⏎ ⏎ 自 2027年1月1日 起，所有用户须使用 Google Chrome 访问 eAuto 系统。此转换旨在提升系统安全性、兼容性、性能与浏览效率。 ⏎ ⏎ 请于期限前转换至 Google Chrome，以确保 eAuto 服务不受影响。 ⏎ ⏎ 为协助您顺利完成转换，请点击以下按钮查看详细的操作指南： ⏎ 查看操作指南 ⏎ 查看教学视频 ⏎ 或在 user guide 页面了解更多".
10. **Popup footer** (sheet Functional Testing, row 9), verbatim: "Thank you for your cooperation and commitment to maintaining a secure digital environment. ⏎ ⏎ 感谢您在维护安全高效的数字化环境中给予的配合与支持。"
11. **Firefox version under test:** "Mozilla Firefox v36.0.4 | Yes | Manual | Playwright and modern Selenium do not support this version" (sheet Configuration, row 18).

## 5. Test data, environments, accounts, setup

1. **Environment:** "UAT4" (sheet Configuration, row 4); Base URL "https://staging.eauto.my/uat4/public/login/" (row 5).
2. **Comparison URL:** "https://staging.eauto.my/eauto/public/login/  (Production mirror, no CR changes)" (sheet Configuration, row 6).
3. **Accounts (sheet Configuration, rows 10–14):** Main UCD with update banner; Sub UCD with update banner; Main UCD without; Sub UCD without; AATF. All on the uat4 login URL. **Credentials present** (usernames and passwords in the sheet).
4. **Browsers:** Firefox v36.0.4 = Manual; Chrome = Automation (sheet Configuration, rows 18–19).
5. **Account mismatch:** TS2 objective says Sub UCD "has no pending" update (row 10), TS4 says Sub UCD "has a pending" update (row 21). Configuration has both Sub accounts, so this is two different accounts, not a contradiction. [unconfirmed — rows do not name the account used]

## 6. Gaps or risks a regression should still cover

1. **Modern Firefox not tested.** Only v36.0.4 and Chrome. Whether Firefox ≥ 37 gets the popup is not in this TS. Knowledge says the 12253 reminder is gated to Firefox < 37 and the home announcement likely the same `[unconfirmed — flow-browser-reminder.md §2b item 3]`.
2. **Edge / other browsers** not tested.
3. **Main UCD without update on Firefox** and **Sub UCD with update on Firefox** — not covered; each Firefox case uses only one account variant.
4. **Interaction with campaign popups** (East Coast, seasonal campaigns) not covered. Only the profile update banner and AATF announcement banner are checked.
5. **Watch Tutorial Video / View PDF Guide then return** — only the user guide link is tested for "navigate back" persistence.
6. **No close-button step names the control** (✕ or button text). TS says only "Close the new announcement popup."
7. **Session ending without logout** (browser close, session timeout) — not tested.
8. **After 1 January 2027** behaviour — out of scope here.
9. **12253 interaction:** with the 12253 deploy on 28 Oct 2026, a Firefox v36 user sees this announcement on Home and the 12253 reminder at the last step. No TS here covers both together.

## 7. Where this TS agrees or differs from knowledge/

1. **Agrees** with `business-rules-from-test-scenarios.md` §7 item 8 and `flow-ucd-shell.md` line 91 (title, text, Firefox only, Chrome not shown).
2. **Agrees** with `flow-platform.md` line 148–149 (buttons, banners after close) and line 147 "Once per login session".
3. **Contrast with 12253 reminder:** the 12180 announcement does **not** return on refresh after close (rows 7, 14, 29). The 12253 reminder **does** return on F5 (`flow-browser-reminder.md` §6 row 3). Different rules; do not assume one from the other.
4. **Possible conflict:** `business-rules-from-test-scenarios.md` item 9 says "Chrome websocket popup is the first popup after login". This TS expects on Chrome "Only the Company / Business Profile update banner is displayed." (sheet Scenario Testing, row 21). Either no Chrome websocket popup on uat4 at test time or the TS ignores it. [unconfirmed]
5. **Naming:** this TS calls the profile update a "banner"; `flow-ucd-shell.md` treats it as `#profile-updates-dialog` in the dialog chain. [unconfirmed — same element likely]
6. **Popup footer vs page footer:** the popup footer text (§4 item 10) is new. The page footer "Best Compatible With Mozilla Firefox V36.0.4" stays unchanged per BA `[from teams-decisions-by-ticket.md item 4]`. The TS does not check the page footer.
7. **Environment:** TS ran on **UAT4**; 12253 ran on **uat1**. Knowledge has no uat4 note for 12180.

## Knowledge candidates

1. **12180 announcement closes for the rest of the session; re-shows only on next login; persists through refresh while left open.** Source: SharePoint TS #036 EAINT-12180, sheet Scenario Testing, rows 4, 7–9. Target: `flow-browser-reminder.md` §2b (currently says nothing on refresh) — and note the contrast with 12253 F5 re-show.
2. **Full English and Chinese body text and popup footer** of the 12180 announcement. Source: sheet Functional Testing, rows 7–9. Target: `flow-browser-reminder.md` §2b (has buttons only, no text). `business-rules-from-test-scenarios.md` item 8.3 quotes only the first two sentences.
3. **Button label pairs:** "View PDF Guide / 查看操作指南" and "Watch Tutorial Video / 查看教学视频"; PDF and video are the "Installation Guide". Source: sheet Functional Testing, rows 3–4. Target: `flow-browser-reminder.md` §2b. Relevant to `flow-browser-reminder.md` §10 item 5 (the "View PDF Guide 查看操作指南" label on the 12253 Miro card matches the **12180** button, which may explain that Miro wording). [unconfirmed]
4. **12180 test environment = UAT4**, comparison = /eauto (production mirror). Source: sheet Configuration, rows 4–6. Target: `teams-decisions-by-ticket.md` § EAINT-12180 / EAINT-12253.
5. **Firefox v36.0.4 is manual-only**: "Playwright and modern Selenium do not support this version". Source: sheet Configuration, row 18. Target: `automation-playbook.md` or `flow-browser-reminder.md` §8 (which already offers a Firefox 36 user-agent workaround — note the team's TS chose manual instead).
6. **Overall Progress counting differs per sheet** (Scenario counts TS, Functional counts steps). Source: sheet Overall Progress, rows 5–6, 9. Target: `quirks.md` (already lists 12180 Configuration sheets at line 291).
