# Firefox to Chrome browser reminder — last-step popup and homepage announcement (flow)

**Draft — not yet walked on a live environment (2026-10-26).** We have not seen
this popup ourselves. SRD lines are tagged `[unconfirmed — from SRD v1.1 ...]`.
Build behaviour comes from colleague Azfar's QA run on staging/uat1
(2026-10-21/22), copied read-only at `_reference/codebases/eauto-qa-azfar/`;
those lines are tagged `[unconfirmed — from Azfar repo <path>, observed by
colleague on staging/uat1, not seen live by us]`.

Tickets: **EAINT-12253** "🔴[eAuto-UCD] To Display Browser Reminder in Last Step of
Transaction for Mozilla Firefox to Google Chrome Migration Effective 1 January 2027"
(Testing In 1st Env; Fix Version S34.17-20261028, deploy 28 Oct 2026 morning) and
**EAINT-12180** (homepage announcement popup, Done, patched to prod 2026-09-08).
Sub-task **EAINT-12574** (QA-Issue, Closed). Portals: UCD and AATF.

Summary mirror: [flow-platform.md](flow-platform.md) § "Flow: Firefox to Chrome
messages"; per-module notes in [flow-apt.md](flow-apt.md),
[flow-bmk.md](flow-bmk.md), [flow-stms.md](flow-stms.md),
[flow-company-profile-einvoice.md](flow-company-profile-einvoice.md). This file is
the cross-module detail.

SRD = `_reference/tickets/Studying/EAINT-12253/EAINT-12253_SRD__eAuto-UCD__Transaction_Last_Step_..._v1_1_20260903.pdf`
(v1.1, 03.09.2026); page numbers from its text extract
`_reference/codebases/eauto-qa-azfar/cr/EAINT-12253/01-intake/raw/srd.md`.

## 1. Why this flow matters

1. SRD §2.1.1 (p.5): "Display a browser reminder at the last step of a transaction,
   informing Mozilla Firefox users that support ends on 31 December 2026 and that
   Google Chrome is required from 1 January 2027."
2. SRD §2.1.3 (p.5): "Mozilla Firefox usage is currently at 42 percent and WebSocket
   usage is at 50 percent."
3. The popup overlays the final page of nine transaction types. Any automation that
   finishes a transaction in Firefox 36 must close it first (see §6 Traps).

## 2. Entry points

### 2a. Last-step reminder (EAINT-12253)

SRD REQ-001 list (p.11), verbatim: "1. STMS (including UCD to UCD & wholesale)
2. eSTM 3. BMK 4. APT 5. Insurance 6. Service hub 7. JomCheck 8. Deregistration
9. e-Dereg Pre-Checking". Exclusion: "Note: The browser reminder shall not be
displayed for Company/Business Profile Update." `[unconfirmed — from SRD v1.1 REQ-001, p.11, not seen live]`

Last step per module, verbatim from the Miro card
`[unconfirmed — from _reference/tickets/Studying/EAINT-12253/EAINT-12253-miro-card.md, captured 2026-10-26, not seen live]`:

| Module | Miro line |
|---|---|
| STMS | "STMS - step 6 show popup" |
| STMS Wholesale | "STMS Wholesale - step 6 show popup" |
| UCD to UCD Standard | "UCD to UCD - Standard - step 6 show popup" |
| UCD to UCD Interstate | "UCD to UCD - Interstate - step 6 show popup" |
| eSTM (approval flow) | "After eSTM Approval Flow - eSTM Step 6 should NOT show popup > redirect to Insurance Step 1 > Insurance Step 4 show popup" |
| eSTM (69E flow) | "69E Flow - Insurance Step 4 show popup > eSTM Step 6 show popup" |
| BMK | "BMK - step 6 show popup" |
| APT | "APT - step 6 show popup" |
| Insurance | "Insurance - step 4 show popup" |
| Service Hub | "Service Hub - step 4 show popup" |
| JomCheck | "Jomcheck - show after Payment success" |
| Dereg | "Dereg - step 6 show popup" |
| e-Dereg Pre-checking | "e-Dereg Pre-checking - step 3 show popup" |

User types: "User Type: Main & Sub UCD" `[Miro card]`.

### 2b. Homepage announcement (EAINT-12180, live)

1. "Announcement 公告" popup on UCD / AATF home after login in Firefox; buttons View PDF
   Guide (new tab), Watch Tutorial Video (overlay), user guide (same tab).
   `[unconfirmed — from flow-platform.md, sourced to Azfar repo knowledge/portals/ucd/portal.md]`
2. AATF: "yes, AATF shud have same behaviour as well ya." `[from Teams EAINT-12180 & 12253, 2026-09-03 16:34, Yi Link Lim]`
3. Same Firefox < 37 limit as the reminder `[unconfirmed — from Azfar repo cr/EAINT-12253/04-explore/2026-10-21-first-look.md, observed by colleague]`.
4. Close control: `button[aria-label="Close announcement"]` (home only), then the LKM
   campaign behind it `[same file]`.

## 3. Steps (JomCheck walk, real Firefox 36)

`[unconfirmed — from Azfar repo cr/EAINT-12253/04-explore/2026-10-21-first-look.md, "Behaviour per step", observed by colleague on staging/uat1 2026-10-21, not seen live by us]`

1. Home after login → EAINT-12180 announcement, then LKM campaign. No reminder.
2. Fill and Submit the transaction → no reminder; markup not in the page.
3. Pay Now → Payment dialog → no reminder; markup not in the page.
4. Yes (pay) → result page → **reminder shown at once** (0.01–0.02 s). Overlay blocks the page.
5. View User Guide 查看操作指南 → new tab `.../uat1/view/ucd/user-guide/`; reminder stays open on the original tab.
6. Continue 继续 → reminder hidden; page usable.
7. F5 → **reminder shown again**.
8. ✕ → hides it, same as Continue.

SRD buttons (REQ-003, p.13): "Example 1: User clicks Continue 继续 a. Popup closes and
the user returns to the last step of the transaction. b. Transaction can be confirmed
or submitted as usual." / "Example 2: User clicks View User Guide 查看操作指南 a. UCD
User Guide page opens in a new tab. b. Transaction remains open behind the popup."
"The transaction is not blocked before 1 January 2027." `[unconfirmed — from SRD v1.1 REQ-003, p.13]`

User Guide targets: UCD `/view/ucd/user-guide`, AATF `/view/aatf/user-guide/`
`[unconfirmed — from Azfar repo cr/EAINT-12253/STATUS.md, Q1 closed 20.10]`.

## 4. Content (REQ-002, p.12)

`[unconfirmed — from SRD v1.1 REQ-002, p.12; Azfar first-look reports "exact" match on screen]`

1. Title: "Browser Reminder 浏览器提醒" (build adds a ⚠ triangle each side).
2. English, above the divider: "Mozilla Firefox support will end on 31 December 2026.
   Starting 1 January 2027, please use Google Chrome to access eAuto and complete your
   transactions. For a smoother and more secure experience, we recommend switching to
   Google Chrome early."
3. Chinese, below the divider: "Mozilla Firefox 的支持服务将于 2026年12月31日 结束。自
   2027年1月1日 起，请使用 Google Chrome 访问 eAuto 并完成您的交易。
   为获得更顺畅与安全的使用体验，建议您尽早转换至 Google Chrome。"

## 5. DOM handles

`[unconfirmed — from Azfar repo cr/EAINT-12253/04-explore/2026-10-21-first-look.md "Popup DOM and selectors", captured by colleague on staging/uat1 2026-10-21; no capture saved in this repo's _reference/html/]`

```
div#eauto-browser-reminder.ebr-overlay      direct child of <body>; inline display:none → block
  div.ebr-popup
    button#ebrCloseBtn.ebr-close [aria-label="Close reminder"]   ✕ top right
    div.ebr-head > h2.ebr-title             "⚠ Browser Reminder 浏览器提醒 ⚠"
    div.ebr-body
      p, p                                  English
      hr.ebr-rule                           divider
      p.ebr-zh, p.ebr-zh                    Chinese
      div.ebr-actions
        button#ebrGuideBtn.ebr-btn          "View User Guide 查看操作指南"
        button#ebrContinueBtn.ebr-btn.ebr-btn-primary   "Continue 继续"
```

Gate in the page script, verbatim:

```js
function isLegacyFirefox() {
  // Mirror common/mykad-websocket/check-browser-version.jsp exactly.
  if (typeof bowser === "undefined") { return false; }
  var b = bowser.getParser(window.navigator.userAgent);
  return b.getBrowserName().toLowerCase() == "firefox" && parseInt(b.getBrowserVersion()) < 37;
}
```

## 6. SRD vs build — differences

| # | SRD v1.1 says | Build / decision | Status |
|---|---|---|---|
| 1 | "Displayed only to users accessing eAuto using Mozilla Firefox, identified by the browser user agent string." (REQ-001, p.11) — no version | Shown only to **Firefox < 37** (`isLegacyFirefox()`). Firefox 155 and Chrome get nothing | "CLOSED 21.10: intended (Azfar / BA: only Firefox 36 / Java-applet users)" `[Azfar STATUS.md CD1]`. SRD not updated |
| 2 | "Browser reminder popup is displayed at the last step of a transaction, before the user confirms or submits." (REQ-001, p.11; §2.2.3 p.9) | Shown **after a successful payment**, on arrival at the final page. Never before payment, never after a failed payment (RHB refusal) | "BA to update SRD" `[Azfar STATUS.md CD3]`; rule from `knowledge/portals/ucd/portal.md` line 698 |
| 3 | "Displayed once per transaction." (REQ-001, p.11) | **Shows on every load** — F5 shows it again; no browser storage flag | EAINT-12574 raised 21.10, closed by BA: "This ticket can be closed as we can remain existing behaviour in staging." `[from Jira EAINT-12574 comment 57942, 2026-10-21 12:23, Lim Yi Link]` |
| 4 | Buttons Continue / View User Guide only (REQ-003) | Extra ✕ `#ebrCloseBtn` also closes it; Esc does nothing | Recorded, not raised `[Azfar portal.md line 698]` |
| 5 | §2.1.2 Out-of-Scope #2: "Browser reminder on portals other than UCD" | §2.2.1 "Portal \| UCD & AATF"; BA: AATF in | SRD internal conflict; AATF treated as in scope (C1 closed 20.10) |
| 6 | Paid transaction whose JPJ / report step then fails — not stated | Still shows on the final page (STMS paid + JPJ failed → Step 6; JomCheck paid + report Failed) | CD6 "closed, not a defect" `[Azfar STATUS.md]` |

**Refresh rule — what to test (EAINT-12574 outcome):** the popup re-appears on every
reload of the final page, whether it was closed or left open. The Miro line "Close the
banner & refresh the page - should NOT show popup" and SRD "Displayed once per
transaction." are **superseded** by the BA's "remain existing behaviour" (2026-10-21).
Miro card and SRD were not updated. `[unconfirmed — from Jira EAINT-12574 + Miro card, not seen live]`

## 7. Branches

1. Browser: Firefox < 37 → popup; Firefox ≥ 37, Chrome, Edge → none (Miro: "Chrome /
   any other Browser (eg: Edge): should NOT show the popup (Regression)").
2. Payment: success → popup on final page; failed → none.
3. eSTM chained to insurance: popup at Insurance Step 4, not at eSTM Step 6 (Miro).
4. 69E flow: popup at Insurance Step 4 and again at eSTM Step 6 (Miro).
5. APT: normal flow Step 5 "Payment request sent" [OK] goes to the APT listing; the
   reminder sits only on Step 6 (`apt/transaction/jpj-sub.do`). Treated as an existing
   APT issue; Dev assessing `[Azfar STATUS.md CD4, 22.10]`.
6. STMS Bulk Payment: never shows — bulk never opens Step 6. Not in SRD; FF_TS14
   deprioritised `[Azfar portal.md line 698]`.
7. Company / Business Profile Update: never (SRD Example 3; BA "confirmed with Ops that
   system DO NOT display browser reminder for Update Company Profile (as known as Pre
   e-Invoice)" `[from Teams EAINT-12180 & 12253, 2026-09-03 09:51, Yi Link Lim]`).

## 8. Traps for automation

`[unconfirmed — from Azfar repo first-look file, observed by colleague]`

1. Not a jQuery UI dialog, not bootstrap `.modal`, not `.modal-campaign`, no
   `role="dialog"`. Generic popup closers (`closePopups()`, `.modal-campaign` handlers)
   will **not** close it.
2. Overlay (z-index 2147483000) intercepts every click until Continue / ✕.
3. Playwright's Firefox build is v155 → no popup. Use real Firefox 36 (Selenium 2.53)
   or set the user agent `Mozilla/5.0 (Windows NT 10.0; WOW64; rv:36.0) Gecko/20100101 Firefox/36.0`.
4. With the Firefox 36 user agent the EAINT-12180 home announcement also appears — close it first.
5. Footer "Best Compatible With Mozilla Firefox V36.0.4" stays unchanged: "We should
   remain unchanged for this footer after deployment of 12180 ya."
   `[from Teams EAINT-12180 & 12253, 2026-09-03 16:19, Yi Link Lim]`

## 9. Test status known (colleague, not ours)

1. "Completed testing on staging/uat1 ... Overall CR Testing Progress : (36/36) 100% PASS
   only" `[from Teams eAuto QAs, 2026-10-23 19:30, Amirul Azfar]`.
2. "To follow up with SA on existing issue on APT" `[same, 2026-10-22 18:40]` — outcome not captured.
3. Not run at 22.10: FF_TS7, BEH_TS1 (APT), FF_TS4 (wholesale); FF_TS14 (bulk) deprio `[Azfar STATUS.md]`.

## 10. Open conflicts and questions

1. **Refresh rule:** SRD + Miro "once" vs BA "remain existing behaviour" — SRD/Miro not updated.
2. **Firefox version:** SRD any Firefox vs build Firefox < 37 — SRD not updated.
3. **Timing:** SRD "before the user confirms or submits" vs build "after payment".
4. **Scope lists differ:** Jira description 7 types; SRD v1.1 9 types; Miro 13 lines.
5. **Button label:** Miro "View PDF Guide 查看操作指南" vs SRD/build "View User Guide 查看操作指南".
6. **Wholesale STMS** (Q9) not tested; **Bulk** (Q5) not in SRD.
7. **APT normal flow** never reaches Step 6 without F5 (CD4 / Q23).
8. **QA owner:** Miro "QA: May" vs Jira QA = Azfar (Azfar ran the TS).
9. **Mockup** "EAINT-12180_popup_mockup_rect_v4.html" (SRD §1.5 item 5) attached nowhere; 26.08 mockup used instead.

## 11. Related tickets

1. EAINT-12180 — homepage announcement (Done, prod 2026-09-08).
2. EAINT-12574 — refresh re-show, Closed as not a defect.
3. EAINT-7229 — Chrome WebSocket reader replaces the Firefox Java applet (live S24.3-20251217).
4. EAINT-9894 / 9895 — older "standardise browser to Chrome", never live, superseded.
5. CCB-933, EAUTO-1028 ("MIGRATE JAVA USER TO WEBSOCKET BY JAN 2027") — SRD §1.5.

## 12. Not covered

1. Our own capture of the popup HTML (none saved under `_reference/html/`).
2. Behaviour after 1 January 2027 (blocking Firefox) — SRD §2.1.2 Out-of-Scope #1.
3. Service Hub last step choice (Payment vs Appointment, Q10).
