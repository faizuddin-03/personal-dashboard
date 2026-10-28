# EAINT-9559 — QA Team test script study (2026-10-28)

## Sources read

1. **Workbook text copy:** `_reference/sharepoint/qa-team-ts/EAINT-9559 [eAuto-Insurance] To Display Campaign Popups on Homepage & Insurance Module Dashboard and Display Banner on Insurance Listing for CNY 2026.md` (generated 28/10/2026, 9:14:32 am). Cell text only; formatting and images are not kept, so popup/banner artwork could not be checked.
2. **Ticket folders:** `_reference/tickets/EAINT-9559/` and `_reference/tickets/Studying/EAINT-9559/` — **neither existed** before this study. No SRD, notes or captures for this ticket.
3. **lib/ticketStudies.ts:** no entry for EAINT-9559.
4. **knowledge/** grep "9559": `cr-test-scenario-catalogue.md` rows 122 and 452, `business-rules-from-test-scenarios.md` §7 item 4.3, `flow-ucd-shell.md` line 68.
5. **Context files:** `knowledge/flow-ucd-shell.md` (popup chain), `knowledge/business-rules-from-test-scenarios.md` §7, `knowledge/flow-insurance-purchase.md` lines 55 and 780.
6. **Not read:** Jira ticket and SRD (unattended run, no Jira access used). Anything about the SRD below is [unconfirmed].

## 1. Header

1. **Ticket:** EAINT-9559 — "[eAuto-Insurance] To Display Campaign Popups on Homepage & Insurance Module Dashboard and Display Banner on Insurance Listing for CNY 2026".
2. **Portal / module:** UCD portal — **Homepage**, **Insurance Module Page** (dashboard), **Insurance Transaction Listing**.
3. **Workbook:** "EAINT-9559 [eAuto-Insurance] To Display Campaign Popups on Homepage & Insurance Module Dashboard and Display Banner on Insurance Listing for CNY 2026.xlsx", SharePoint library "eAuto - CR Test Scenarios", modified 09/02/2026, 11:48:12 am.
4. **Sheets:** one — "EAINT-9559". Banner row R2: "CNY 2026 POPUP & BANNER".
5. **Columns (R3):** "TS No | Browser | Main UCD / Sub UCD | Screen | HQ | Sub UCD Branch | Pre-Condition | Test Scenarios | Expected Result | Test Result | Remarks".
6. **Scenarios:** **40** (EAINT9559_TS1 to EAINT9559_TS40, rows R4–R43).
7. **Results:** **40 Pass, 0 Fail.** Progress block R9: Pass "40", TOTAL "40", Completion % "1" (100%). Pending / In Progress / Fail cells are COUNTIF formulas with no cached value in the text copy; every Test Result cell R4–R43 reads "Pass".
8. **Remarks column:** empty on every row. R4 carries "P1 | P2" in the columns past Remarks — meaning not stated [unconfirmed: likely leftover legend or phase marker].
9. **Tester and dates:** **not written in the sheet.** The catalogue records the author as a QA colleague and the date 2026-02-09 (`knowledge/cr-test-scenario-catalogue.md` row 100), taken from SharePoint metadata, not the sheet.

## 2. What the ticket changed, as the TS shows it

1. **New CNY 2026 popup** on the UCD **Homepage** after login (R4 "To verify CNY 2026 popup is displayed correctly in eAuto Homepage upon successful login").
2. **Same CNY 2026 popup** on the **Insurance Module Page** (R5 "To verify CNY 2026 popup is displayed correctly in eAuto Insurance module page").
3. **New CNY 2026 banner** on the **Insurance Transaction Listing** (R6 "To verify CNY 2026 banner is displayed correctly in eAuto Insurance Transaction Listing page").
4. **Bilingual rotation:** English first, then Chinese, 7-second interval (R4 Expected 2–3).
5. **Slot in the popup chain:** after Web Socket (Firefox) and East Coast popups, before Company Profile Update (R9, R18).
6. **Once per login:** not shown again on return to Homepage or Insurance Module page (R10, R11).

## 3. Scenarios

Shorthand used below: **Ins** = "Company Level Insurance Permission", **Prof** = "Company Profile Update" (✅ = set/done, ❌ = not). **EC** = East Coast Malaysia, **non-EC** = Non-East Coast Malaysia. Every popup row also expects "CNY 2026 popup in English is shown first by default" and "Interval between English and Chinese is 7 seconds" unless stated.

### A. Main UCD — Chrome (TS1–TS9)

1. **TS1** (R4) — Homepage, HQ non-EC, Ins ✅ Prof ✅ → "CNY 2026 is displayed correctly as first popup in Homepage screen".
2. **TS2** (R5) — Insurance Module Page, HQ non-EC → "CNY 2026 popup is displayed correctly as first popup in Insurance module page".
3. **TS3** (R6) — Insurance Transaction Listing, HQ non-EC → "CNY 2026 banner is displayed correctly in Insurance Transaction Listing".
4. **TS4** (R7) — Homepage & Insurance Module Page, HQ EC → both pages "East Coast popup (1st) ➡️CNY 2026 popup (2nd)".
5. **TS5** (R8) — Homepage, HQ non-EC, Prof ❌ → "CNY 2026 popup (1st) ➡️ Company Profile Update popup (2nd)".
6. **TS6** (R9) — Homepage, HQ EC, Prof ❌ → "East Coast popup (1st) ➡️CNY 2026 popup (2nd) ➡️ Company Profile Update popup (3rd)".
7. **TS7** (R10) — Homepage, once only → "CNY 2026 popup is not displayed whenever redirected back to Homepage".
8. **TS8** (R11) — Insurance Module Page, once only → same expected text as TS7 (says "Homepage"; see §6).
9. **TS9** (R12) — Homepage, Ins ❌ → "CNY 2026 is displayed correctly as first popup in Homepage screen" and "To ensure UCD is unable to access Insurance Module page". No language/interval lines.

### B. Main UCD — Firefox (TS10–TS17)

1. **TS10** (R13) — Homepage, HQ non-EC → "Web Socket popup (1st) ➡️ CNY 2026 popup (2nd)".
2. **TS11** (R14) — Insurance Module Page, HQ non-EC → "CNY 2026 popup is displayed correctly as first popup in Insurance module page".
3. **TS12** (R15) — Insurance Transaction Listing → banner displayed.
4. **TS13** (R16) — Homepage & Insurance Module Page, HQ EC → Homepage "Web Socket popup (1st) ➡️East Coast popup (2nd) ➡️ CNY 2026 popup (3rd)"; Insurance Module Page "East Coast popup (1st) ➡️ CNY 2026 popup (2nd)".
5. **TS14** (R17) — Homepage, HQ non-EC, Prof ❌ → "Web Socket popup (1st) ➡️CNY 2026 popup (2nd) ➡️ Company Profile Update popup (3rd)".
6. **TS15** (R18) — Homepage, HQ EC, Prof ❌ → "Web Socket popup (1st) ➡️ East Coast popup (2st) ➡️CNY 2026 popup (3rd) ➡️ Company Profile Update popup (4th)".
7. **TS16** (R19) — Homepage, once only → "CNY 2026 popup is not displayed whenever redirected back to Homepage".
8. **TS17** (R20) — Insurance Module Page, once only → same text as TS16.

### C. Sub UCD — Chrome (TS18–TS28)

1. **TS18** (R21) — Homepage, HQ non-EC / branch non-EC → CNY first popup.
2. **TS19** (R22) — Insurance Module Page, non-EC / non-EC → "CNY 2026 popup is displayed correctly as popup in Insurance module page" (no position given).
3. **TS20** (R23) — Insurance Transaction Listing, non-EC / non-EC → banner displayed.
4. **TS21** (R24) — Homepage, **HQ EC / branch non-EC** → "CNY 2026 popup is displayed correctly as first popup in Homepage screen" (no East Coast popup).
5. **TS22** (R25) — Homepage & Insurance Module Page, **HQ non-EC / branch EC** → both pages "East Coast popup (1st) ➡️CNY 2026 popup (2nd)".
6. **TS23** (R26) — Homepage, EC / EC → "East Coast popup (1st) ➡️CNY 2026 popup (2nd)".
7. **TS24** (R27) — Homepage, non-EC / non-EC, Prof ❌ → "CNY 2026 popup (1st) ➡️ Company Profile Update popup (2nd)".
8. **TS25** (R28) — Homepage, non-EC / EC, Prof ❌ → "East Coast popup (1st) ➡️ CNY 2026 popup (2nd) ➡️ Company Profile Update popup (3rd)".
9. **TS26** (R29) — Homepage, EC / EC, Prof ❌ → same order as TS25.
10. **TS27** (R30) — Homepage, once only → not displayed on return to Homepage.
11. **TS28** (R31) — Insurance Module Page, once only → same text as TS27.

### D. Sub UCD — Firefox (TS29–TS40)

1. **TS29** (R32) — Homepage, non-EC / non-EC → "Web Socket popup (1st) ➡️ CNY 2026 popup (2nd)".
2. **TS30** (R33) — Insurance Module Page, non-EC / non-EC → CNY first popup.
3. **TS31** (R34) — Insurance Transaction Listing → "CNY 2026 banner is displayed correctly in Insurance Transaction Listing" only (no language/interval lines).
4. **TS32** (R35) — Homepage, **HQ EC / branch non-EC** → "Web Socket popup (1st) ➡️ CNY 2026 popup (2nd)" (no East Coast popup).
5. **TS33** (R36) — Homepage & Insurance Module Page, non-EC / EC → Homepage "Web Socket popup (1st) ➡️East Coast popup (2nd) ➡️ CNY 2026 popup (3rd)"; Insurance Module Page "East Coast popup (1st) ➡️ CNY 2026 popup (2nd)".
6. **TS34** (R37) — Homepage, EC / EC → "Web Socket popup (1st) ➡️East Coast popup (2nd) ➡️ CNY 2026 popup (3rd)".
7. **TS35** (R38) — Homepage, non-EC / non-EC, Prof ❌ → "Web Socket popup (1st) ➡️ CNY 2026 popup (2nd) ➡️ Company Profile Update popup (3rd)".
8. **TS36** (R39) — Homepage, non-EC / EC, Prof ❌ → "Web Socket popup (1st) ➡️East Coast popup (2nd) ➡️ CNY 2026 popup (3rd) ➡️ Company Profile Update popup (4th)".
9. **TS37** (R40) — Homepage, EC / EC, Prof ❌ → same 4-popup order as TS36.
10. **TS38** (R41) — Homepage, once only (non-EC / EC) → not displayed on return to Homepage.
11. **TS39** (R42) — Insurance Module Page, once only → same text as TS38.
12. **TS40** (R43) — Homepage, non-EC / EC, **Ins ❌ Prof ❌** → 4-popup order as TS36, plus "To ensure UCD is unable to access Insurance Module page".

## 4. Business rules and system behaviour the TS reveals

1. **Bilingual rotation.** "CNY 2026 popup in English is shown first by default" and "Interval between English and Chinese is 7 seconds" — sheet EAINT-9559, R4 Expected 2–3 (repeated R5–R43). Same rule as Merdeka/Raya campaigns already in knowledge.
2. **Banner uses the same rotation.** Banner rows R6, R15, R23 repeat "CNY 2026 popup in English is shown first by default" / "Interval between English and Chinese is 7 seconds". R34 (TS31) does not.
3. **Chain order on Homepage, CNY 2026 campaign (full form).** "Web Socket popup (1st) ➡️ East Coast popup (2st) ➡️CNY 2026 popup (3rd) ➡️ Company Profile Update popup (4th)" — sheet EAINT-9559, R18 (TS15).
4. **CNY sits before Company Profile Update.** "CNY 2026 popup (1st) ➡️ Company Profile Update popup (2nd)" — R8 (TS5).
5. **Web Socket popup appears on Firefox only.** Chrome rows never list it (R4, R7–R9); Firefox Homepage rows always do: "Web Socket popup (1st) ➡️ CNY 2026 popup (2nd)" — R13 (TS10).
6. **Web Socket popup is Homepage only.** Firefox Insurance Module Page: "CNY 2026 popup is displayed correctly as first popup in Insurance module page" — R14 (TS11); and "CNY 2026 popup is displayed correctly as second popup in Insurance Module page: ⏎ East Coast popup (1st) ➡️ CNY 2026 popup (2nd)" — R16 (TS13).
7. **East Coast popup also shows on the Insurance Module Page.** "CNY 2026 popup  is displayed correctly as second popup in Insurance Module page: ⏎ East Coast popup (1st) ➡️CNY 2026 popup (2nd)" — R7 (TS4).
8. **For a Sub UCD, the branch location decides the East Coast popup, not HQ.**
   1. HQ EC + branch non-EC → "CNY 2026 popup is displayed correctly as first popup in Homepage screen" — R24 (TS21).
   2. HQ non-EC + branch EC → "East Coast popup (1st) ➡️CNY 2026 popup (2nd)" — R25 (TS22).
   3. Same on Firefox: HQ EC + branch non-EC → "Web Socket popup (1st) ➡️ CNY 2026 popup (2nd)" — R35 (TS32).
9. **Once per login.** "To verify CNY 2026 popup only displayed once and not displayed when UCD redirects to Homepage" / "CNY 2026 popup is not displayed whenever redirected back to Homepage" — R10 (TS7). Insurance Module Page variant: R11 (TS8).
10. **Popup shows without Insurance permission; module stays blocked.** "CNY 2026 is displayed correctly as first popup in Homepage screen ⏎ 2. To ensure UCD is unable to access Insurance Module page" — R12 (TS9); Sub UCD variant R43 (TS40).
11. **Company Profile Update popup only tested on Homepage.** No Insurance Module Page row has Prof ❌ [unconfirmed whether it shows there].

## 5. Test data, environments, accounts, setup

1. **Environment:** **not stated** in the sheet.
2. **Browsers:** **Chrome** (TS1–TS9, TS18–TS28) and **Firefox** (TS10–TS17, TS29–TS40). No Edge.
3. **Accounts:** a **Main UCD** and a **Sub UCD** user; HQ and Sub UCD Branch each set to East Coast or Non-East Coast Malaysia. No login IDs named.
4. **Pre-conditions:** company-level Insurance Permission on/off; Company Profile Update done/not done.
5. **Credentials:** **none present** in the sheet.

## 6. Gaps or risks a regression should still cover

1. **Copy-paste expected results.** TS8, TS17, TS28, TS39 test the Insurance Module Page but expect "CNY 2026 popup is not displayed whenever redirected back to Homepage" (R11, R20, R31, R42). Whether the Insurance page return was really checked is [unconfirmed].
2. **Banner wording mismatch.** Banner rows R6, R15, R23 say "popup" in the language/interval lines; TS31 (R34) drops them entirely. The banner's own rotation is not clearly asserted.
3. **TS19 (R22) has no position** ("displayed correctly as popup").
4. **Typos / numbering:** "2st" (R18); TS13 (R16) numbers "2." twice; TS38 (R41) sets branch EC but checks only the redirect, not the East Coast popup.
5. **Not covered by the TS:**
   1. **Close behaviour** of the popup and banner, and that closing one opens the next in the chain.
   2. **Logout and log in again** — popup returns on the next login.
   3. **Campaign end date** — popup and banner gone after CNY 2026 ends [unconfirmed: end date not in sheet].
   4. **Chinese → English loop** after the first switch.
   5. **e-Invoice reminder** and other chain dialogs (`#dialog-einvoice`, announcement, STMS cancellation reminder) mixed with CNY.
   6. **Company Profile Update on the Insurance Module Page.**
   7. **Banner on other Insurance pages** (steps, details) — not shown or shown.
   8. **Direct URL** to Insurance without permission (only "unable to access" checked).
   9. **Image content** — not checkable from the text copy.
6. **Regression risk for later campaigns:** a later CNY / Raya / Merdeka ticket rewrites the same chain array (`flow-ucd-shell.md` §"suppress the popups"). Re-check that the CNY 2026 popup and banner no longer appear once retired [unconfirmed: retirement ticket not known].
7. **Automation risk:** during a campaign the chain script may force campaign flags to true on every load (`flow-ucd-shell.md` lines 117–130), so localStorage suppression of `homecnycampaign` may not hold; use `:visible`-filtered close clicks.

## 7. Contradictions and changes against knowledge/

1. **Matches** `flow-ucd-shell.md` line 67–68 and `business-rules-from-test-scenarios.md` §7.4.3 (both quote R9). No change.
2. **Contrast with prod code order.** `flow-insurance-purchase.md:780` lists "profile update, e-Invoice reminder, CNY, Raya" — profile update **before** CNY. This TS puts CNY **before** Company Profile Update (R8, R9). Already explained in `flow-ucd-shell.md` lines 75–77 as per-campaign arrays; not a conflict.
3. **Web Socket browser scope.** `business-rules-from-test-scenarios.md` §7.9 says "Chrome websocket popup is the first popup after login" (EAINT-9894). This TS (Feb 2026) lists the Web Socket popup **only on Firefox** rows (R13–R20, R32–R43). Different tickets and dates; current behaviour [unconfirmed]. Also fits the `dialog-websocket` = "Chrome-migration announcement" note in `flow-ucd-shell.md` line 104.
4. **New, not in knowledge:** Sub UCD East Coast popup follows the **branch**, not HQ (§4.8). `business-rules-from-test-scenarios.md` §7.6 says "only for East Coast HQ or branch", which is looser.
5. **New, not in knowledge:** East Coast popup also shows on the **Insurance Module Page**; Web Socket popup does not (§4.6, §4.7).

## Knowledge candidates

1. **Sub UCD East Coast popup follows the branch, not HQ.** HQ EC + branch non-EC → no East Coast popup: "CNY 2026 popup is displayed correctly as first popup in Homepage screen" `[from SharePoint TS #100 EAINT-9559, sheet EAINT-9559, row 24]`; HQ non-EC + branch EC → "East Coast popup (1st) ➡️CNY 2026 popup (2nd)" `[… row 25]`. Target: `knowledge/business-rules-from-test-scenarios.md` §7.6 and `knowledge/flow-ucd-shell.md` § Campaign popup behaviour item 3.
2. **Insurance Module Page runs part of the chain.** East Coast popup shows there: "East Coast popup (1st) ➡️CNY 2026 popup (2nd)" `[… row 7]`; Web Socket popup does not, even on Firefox `[… rows 14, 16]`. Target: `knowledge/flow-ucd-shell.md`.
3. **Web Socket popup was Firefox-only in the CNY 2026 TS** — Chrome rows never list it `[… rows 4-12 vs 13-20]`. Target: `knowledge/flow-ucd-shell.md` next to the `dialog-websocket` row; tag as dated (Feb 2026) and [unconfirmed] for current builds.
4. **Full CNY 2026 Homepage order:** "Web Socket popup (1st) ➡️ East Coast popup (2st) ➡️CNY 2026 popup (3rd) ➡️ Company Profile Update popup (4th)" `[… row 18]`. Target: add as example in `flow-ucd-shell.md` per-campaign orders list (current entry quotes row 9 only).
5. **Campaign banner on Insurance Transaction Listing — CNY 2026 too:** "CNY 2026 banner is displayed correctly in Insurance Transaction Listing" `[… row 6]`. Target: `business-rules-from-test-scenarios.md` §7.5 (currently cites EAINT-11925 only).
6. **Ticket study entry:** EAINT-9559 has no entry in `lib/ticketStudies.ts` and no `_reference/tickets/EAINT-9559/` material other than this study.
