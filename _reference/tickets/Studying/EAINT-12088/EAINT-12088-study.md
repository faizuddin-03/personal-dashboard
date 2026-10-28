# EAINT-12088 — Study (2026-10-26)

## 1. Header

1. **Title (verbatim):** "🟣[eAuto-UCD] Automate Public Holiday List via Google Calendar Integration"
2. **Jira status:** **Code Review** (since 2026-09-03 09:46). Priority **Medium**. Type Task. CR Type "Enhancement". Request raised by "🟣IT team".
3. **QA (cf[10041]):** **Charmain Ea Chiang** (set 2026-10-19). Miro card "QA:" is **blank**.
4. **BA:** Batrisyia Hasanah (Jira BA field; Miro "BA: Batrisyia"). Reporter = same.
5. **Dev / assignee:** zhan.choon (Wong Zhan Choon).
6. **Deployment date:** **3 Nov 2026** per Miro column "3RD NOV DEPLOYMENT". Jira Fix Version = "[QA]Ready for Testing Tickets" (release date 2026-11-02). Jira "Exp. Deploy Date" **cleared** 2026-10-19.
7. **Test env:** **not stated** — Miro "Test Env:" blank, "Test Env Point to: -"; Jira has no environment.
8. **Effort:** Miro "Est. Testing Mandays: 1 day for 1 QA" (Base 0.5 + Buffer 0.5). Jira "[QA] Est Man-day to complete" = 1 (2026-10-26).
9. **Commitment Month:** Oct2026. Labels: 260727-260731, July2026, ProductBacklog, eAuto.

## 2. Sources read

1. Jira EAINT-12088 (MCP, read 2026-10-26): description, all fields, changelog, links. **0 comments, 0 attachments, 0 remote links, 0 sub-tasks.**
2. Miro card: `EAINT-12088-miro-card.md` (from capture 2026-10-26).
3. Teams export `_reference/teams/EAINT-12099-11881-11882-Shopping-Cart.md` (ends 2026-10-16) — one hit.
4. `knowledge/flow-service-hub.md`, `knowledge/eauto-service-hub.md`, `_reference/inbox/eauto-flows-run/08-jira-3months.md`, `03-jira-mine.md`.
5. **SRD: none exists.** Jira has no attachments; requirements live only in the Jira description tables. No OneDrive folder `EAINT-12088`.

## 3. What changes

1. **Portal / module:** Jira "Affected Portal | eAuto"; "Affected Module | UCD - Service Hub 1. Software Installation - Appointment Calender". `[Jira description, General Information #1-2]`
2. **What:** "Automate the public holiday (PH) list in the system calendar by integrating with Google Calendar, so PH dates are picked up automatically without needing anyone to manually provide or double-check the list." `[#3]`
3. **PH source:** "Use Kuala Lumpur + National (Malaysia) public holidays from Google Calendar." `[Additional Requirements #1]`
4. **Why:** "Requested by Ops." `[#6]`
5. **Scenario A (Sunday PH):** "PH falls on Sunday → replacement PH observed on Monday. Monday slot is greyed out (not selectable). UCD can select Tuesday slot. Earliest reschedule date is Wednesday (standard +2 day buffer applies from Monday)." `[Additional Requirements #2]`
6. **Scenario B (Sun + Mon PH):** "both Monday and Tuesday slots are greyed out (not selectable). UCD can select Wednesday slot. Earliest reschedule date is Thursday (standard +2 day buffer applies from Tuesday, the last greyed-out day)." `[#3]`
7. **General rule:** "The +2 day reschedule buffer is the standard system rule ... PH handling only greys out the affected date(s) from being selectable; the standard +2 day advance rule then applies as normal from that point." `[#4]`
8. **Scenario C (tentative PH moved):** "System syncs and moves the greyed-out PH date from Monday to Tuesday accordingly. If the newly-blocked date (Tuesday) already has UCD appointment(s) booked ... the system will not auto-cancel/move them ... IT to notify support@eauto.my (cc ops@eauto.my)". `[#5]`
9. **Scenario C email:** From imonitor@eauto.my, To support@eauto.my, Cc ops@eauto.my, **Subject "Public Holiday Calendar Update - Booked Appointments Affected"**; body lists "Date being blocked", "previously tentative on", "Total booked appointments: [X] bookings on the newly-blocked date". `[#6]`

## 4. New vs existing behaviour

1. **Existing:** "Public holidays are currently maintained manually - Dev has to input the PH list and manually assign which dates are marked as PH." `[#4]`
2. **Existing (repo):** weekends and PH greyed, "holidays purple, Google Calendar list"; automation keys the PH date per run via `EAUTO_PUBLIC_HOLIDAY` and skips when empty. `[knowledge/flow-service-hub.md §8, §9 item 11]`
3. **New:** PH list read from Google Calendar (KL + National); tentative-to-confirmed date moves re-sync; affected-bookings email to support/ops.

## 5. QA scope

1. **Miro "Testing Scope: (Automation Testing)" — Affected Areas (m&m):** "UCD > SI Flow", "UCD > BDP + SI Flow", "BackOffice > Appointment Calendar", "Reschedule flow". `[Miro card]`
2. **Miro Google Calendar items:** "Observed and tentative date", "To compare gcal with system", "Moved and blocked > Reminder Email". `[Miro card]`
3. **From Jira:** Scenarios A, B, C + notification template (§3 items 5-9).
4. **Candidate checks** `[inference]`: every KL + National PH in the current + next month greyed on UCD slot picker (SI, BDP+SI), on UCD reschedule calendar, and on BO Appointment Calendar; replacement-holiday Monday greyed; +2 rule counted from last greyed day; email fields match template.

## 6. Affected regression areas

1. UCD Software Installation slot booking (`slot.do`). `[Miro; flow-service-hub.md §5.6]`
2. UCD BDP + SI booking. `[Miro]`
3. UCD self-service reschedule (`reschedule.do`) — +2 blackout. `[flow-service-hub.md §6.3; eauto-service-hub.md "Reschedule rules"]`
4. BO Appointment Calendar — reschedule (`a.cal-rs`), Add Appointment (`#cal-add-btn`). `[flow-service-hub.md E12, §6.5]`
5. Weekend greying, 2-month visibility, 3/session 6/day capacity. `[flow-service-hub.md §8]`

## 7. Test data / env needs

1. **Environment:** unknown — needs confirmation.
2. **PH dates in visible window:** calendar shows current + following month only. `[flow-service-hub.md §8 "monthsVisible = 2"]` Scenario A/B need a Sunday PH (and Sun+Mon) inside that window `[inference: may need a dev-patched / mocked Google Calendar feed]`.
3. **Scenario C** needs a tentative PH that later moves, plus a booking on the new date — cannot be arranged naturally `[inference]`.
4. **Mailbox** for support@eauto.my / ops@eauto.my email (Mailtrap or equivalent) — not stated.
5. UCD + BO accounts per existing `tests/service-hub` env vars (`EAUTO_UCD_USER`, `EAUTO_BO_USER`, …). `[flow-service-hub.md §7]`

## 8. Dependencies / related tickets

1. Jira "relates to" **EAINT-10960** (Software Installation Module, Done) and **EAINT-11880** (Biometric Device Purchase Module, Done).
2. **EAINT-12087** (slot auto-expire, Code Review) — paired with 12088 in Teams 2026-09-18 (below); not linked in Jira.
3. Existing rule source: SRD EAINT-10960 v1.2 §2.3.2.1 #4 rule 4 (holidays greyed). `[flow-service-hub.md §8]`

## 9. Teams decisions (exports end 2026-10-16)

1. `[_reference/teams/EAINT-12099-11881-11882-Shopping-Cart.md, 2026-09-18 09:22, BA lead (Mei Jia)]` "(re: EAINT-12087 / EAINT-12088 not covered this round) hii Wong Zhan Choon, just to check these 2 tickets can be done by patching ya? if required deployment, can be morning deployment?"
2. `[same file, 2026-09-18 10:05, dev (Wong Zhan Choon)]` "Will require deployment , morning should be fine"
3. No dedicated 12088 group chat in `_reference/teams/_chat-list.md`. No entry in `knowledge/teams-decisions-by-ticket.md`.

## 10. Open questions / conflicts

1. **QA owner conflict:** Jira QA = Charmain; Miro card QA blank; this study assigned to Faizuddin. Confirm who tests.
2. **Test env** not stated anywhere (Jira, Miro).
3. **Deploy date:** Miro 3 Nov; Jira Fix Version release date 2026-11-02; Exp. Deploy Date cleared. Confirm 3 Nov and morning vs night (Teams 09-18: "morning should be fine").
4. **+2 rule base conflict:** Jira says buffer "applies from Monday" / "from Tuesday, the last greyed-out day". Repo knowledge says +2 counts **from today** ("earliest = today+2", `ENV.reschedule.blackoutDays = 2`). `[flow-service-hub.md §8]` Clarify which "today" the scenario assumes.
5. **Scenario A wording:** "UCD can select Tuesday slot" vs "Earliest reschedule date is Wednesday" — booking vs reschedule rule differ? Clarify.
6. **Scenario C trigger:** who sends the email — Jira says "IT to notify" (manual?) yet gives an automated template from imonitor@eauto.my. Miro says "Moved and blocked > Reminder Email". Confirm it is system-sent and when the sync runs (schedule not stated).
7. **Sync frequency / failure handling** (Google API down) — not stated.
8. **How to create test PH dates** on staging (real Google Calendar vs mock) — not stated.
9. Does the existing hard-coded PH list remain as fallback — not stated.
10. **No SRD** — confirm the Jira description is the full requirement.

## 11. Existing repo knowledge / automation to reuse

1. `tests/service-hub/specs/calendar-rules.spec.ts` (SC_SCB_11–20 incl. PH greying, `EAUTO_PUBLIC_HOLIDAY`).
2. `tests/service-hub/specs/reschedule-handling.spec.ts` (TS10/TS22 dev-patched holiday cases, currently excluded).
3. `tests/service-hub/specs/bo-calendar-limits.spec.ts`, `add-appointment-bo.spec.ts`.
4. `tests/service-hub/pages/SlotPickerComponent.ts`, `pages/bo/AppointmentCalendarPage.ts`, `pages/BasePage.ts` (`earliestRescheduleDate()`).
5. Dashboard runner `app/eauto/shopping-cart/page.tsx` (has a Public Holiday input). `[flow-service-hub.md §9 item 15]`
6. Knowledge: `knowledge/flow-service-hub.md`, `knowledge/eauto-service-hub.md` ("Which dates are blocked", "Reschedule rules"), `knowledge/mailtrap.md` (email checks).
