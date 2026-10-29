# EAINT-12528 — study (2026-10-27)

## Header

1. **Title (verbatim, Jira Summary):** "⚪[Secarang-Social Media] Post Secarang Video on Facebook, Instagram and TikTok to Promote Branding"
2. **Jira status:** **To Do** (Task). Created 2026-10-13 10:43, updated 2026-10-13 10:47 ("**Updated:** 2026-10-13T10:47:27.465+0800").
3. **Priority:** Medium.
4. **Fix version:** none ("**Fix versions:** —").
5. **Labels:** "261012-261016, October2026, ProductBacklog".
6. **QA (Jira cf[10041]):** blank ("—").
7. **Assignee:** blank ("—"). **Reporter:** Chee Mei Jia.
8. **BA / Dev:** not named anywhere in the material.
9. **Exp. Deploy Date (cf 10087), ETA for Testing (cf 10057), [QA] Est Man-day (cf 10081):** all blank ("—").
10. **Test env:** **not stated.**
11. **Links / sub-tasks / parent:** none.
12. **Comments:** 0. **Attachments:** none listed — **no SRD**.
13. **Title marker "⚪":** meaning not recorded in knowledge/ [unconfirmed].
14. **Latest Jira capture:** "27/10/2026, 8:35:42 pm" (`EAINT-12528-jira.md` line 1).
15. **Cron on staging:** cannot be triggered on demand; interval is changed for testing, usually every 30 mins (Faizuddin, 2026-10-27 — see Changes below).

## Changes since last study (2026-10-27)

1. **Status:** no change — still "**Status:** To Do".
2. **Fix version:** no change — still "**Fix versions:** —".
3. **Description:** no change — rows 1-6 identical to the earlier capture.
4. **New comments:** none — "## Comments (0)".
5. **New attachments:** none — the "## Attachments" list is empty.
6. **Jira "Updated" timestamp:** unchanged, "2026-10-13T10:47:27.465+0800". The Jira-side change that triggered this re-study is **not visible** in the captured fields [unconfirmed].
7. **New in the folder:** `EAINT-12528-related-history.md` (2026-10-27). It records answers from Faizuddin that change this study:
   1. **Cron trigger answered:** "cronjob unable to trigger on demand, but can change the interval. for testing, we usually do every 30 mins" (related-history, Known traps 1.1, Faizuddin, dashboard chat, 2026-10-27). Open question 5 is now closed.
   2. **Configured interval parked:** "cron internal unknown. ignore first, will get to this later" (related-history, Known traps 2.1, Faizuddin, 2026-10-27).
   3. **Test accounts parked:** "ignore first. i will come back to this later" (related-history, Known traps 2.2, Faizuddin, 2026-10-27).
8. **Sections fixed:** Open questions 4 and 5, Suggested test focus 1 and 3, Test data / env needs 1 and 3.

## Sources read

1. `_reference/tickets/Studying/EAINT-12528/EAINT-12528-jira.md` — Jira capture by the Jira Scout, "27/10/2026, 8:35:42 pm".
2. `_reference/tickets/Studying/EAINT-12528/EAINT-12528-related-history.md` — related past tickets (EAINT-11864, 11867, 8668) and Faizuddin's 2026-10-27 answers.
3. **No SRD, image, HTML mock-up or Excel/Word file exists** for this ticket. The Jira attachment list is empty.
4. `_reference/tickets/EAINT-12528/` — **does not exist**.
5. `_reference/teams/` — **no chat export** for this ticket (glob "*12528*": no files). The ticket only appears as a chat name in `_reference/teams/_chat-list.md` line 39: "26. EAINT-12528 [Secarang-Social Media] Post Secarang Video on Facebook, Instagram and TikTok to Promote Branding". Chat content not captured.
6. `knowledge/` — grep "EAINT-12528": **no hits**. Earlier grep for "Social Media", "TikTok", "Facebook", "Instagram": **no hits**.
7. `lib/ticketStudies.ts` — grep "12528": **no hit**.
8. `_reference/inbox/eauto-flows-run/08-jira-3months.md` line 83 — Jira 3-month list row, area tagged "Secarang / MacroKiosk / WhatsApp".
9. `knowledge/README.md` and `knowledge/flow-secarang-insurance.md` (header + §1) for module context.

## What changes

1. **Portal (Jira Description row 1, "Affected Portal"):** "Social Media".
2. **Modules (row 2, "Affected Module"):** "- Facebook - Instagram - TikTok".
3. **Request (row 3):** "To post Secarang video on Secarang social media (Facebook, Instagram and TikTok) to promote the branding."
4. **Existing behaviour (row 4):** "Nil".
5. **New behaviour (row 5, verbatim):**
   1. "A cron job auto posts Secarang caption and video on Secarang Facebook, Instagram and TikTok."
   2. "Posting runs every 2 - 3 days."
   3. "Purpose is to create brand awareness."
6. **Additional Note (row 6):** blank.

## Requirements

1. **R1 — cron job auto-posts** caption + video to three platforms. `[Jira Description row 5]`
2. **R2 — frequency** "every 2 - 3 days". `[Jira Description row 5]`
3. **No further requirement is written.** No SRD, no acceptance criteria.

## New vs existing behaviour

1. **Existing:** "Nil" — no auto-posting today. `[Jira Description row 4]`
2. **New:** scheduled job posts Secarang video content to Facebook, Instagram, TikTok. `[Jira Description row 5]`
3. **Not an eAuto or Secarang website change** on the face of it. No UCD, BO, CIBO or Secarang page is named [unconfirmed].
4. **Contrast with knowledge:** `knowledge/flow-secarang-insurance.md` §1 covers only the Secarang B2C insurance purchase site — "Secarang is the public (B2C) insurance front." Social media posting is **new ground**; no flow file covers it.

## Open questions / risks for testing

1. **No SRD.** Scope, content source and acceptance rules are unknown. Wait for the SRD before drafting TS.
    1. **Update 2026-10-27:** none in Jira (0 attachments) and none in the Teams chat: "no SRD in chat" [Faizuddin, dashboard chat, 2026-10-27].
    2. **Update 2026-10-27 (8:35 pm capture):** still 0 attachments.
2. **"every 2 - 3 days" is a range,** not a fixed schedule. Which one — 2 or 3 days, fixed time of day, or random? Not testable as written [unconfirmed].
3. **Where do the caption and video come from?** Fixed library, rotating list, generated, or uploaded by a person? Not stated.
4. **Which accounts?** "Secarang Facebook, Instagram and TikTok" — no test / sandbox accounts named. Posting to **real public accounts** from staging is a risk: test posts would be public [unconfirmed].
    1. **Parked by Faizuddin, 2026-10-27:** "ignore first. i will come back to this later" (related-history, Known traps 2.2). Do not raise again.
5. **Cron trigger — answered.** "cronjob unable to trigger on demand, but can change the interval. for testing, we usually do every 30 mins" (related-history, Known traps 1.1, Faizuddin, 2026-10-27).
    1. **Plan:** the developer sets the staging interval to **every 30 mins**; QA waits for each run. Each 30-min run counts as the next "2 - 3 day" post, same as EAINT-8668 R13: "subsequent cronjob can be considered as next day's running" (related-history, Reusable scenarios 5.1).
    2. **Configured interval parked:** "cron internal unknown. ignore first, will get to this later" (Faizuddin, 2026-10-27). Not a blocker.
6. **Failure handling:** what happens if one platform rejects the post (token expired, video format, size limit)? Retry, log, alert? Not stated.
7. **Duplicate prevention:** same video posted twice? Not stated.
8. **Where is the run visible?** Any BO / CIBO log or report of posts? Not stated. Past cron tickets took proof from "(Request log from dev)" (related-history, Known traps 5, EAINT-11867 v1 R3).
9. **Who tests:** QA field, assignee, BA, dev — all blank.
10. **Relation to EAINT-12429** ("[Secarang-Social Media] Capture Leads from Social Media Posting to Increase Renewal Cover Note", To Do, `08-jira-3months.md` line 65). Same "Secarang-Social Media" prefix; possibly the same posting feature feeds lead capture [unconfirmed]. No Jira link between them.
    1. **Update 2026-10-27 (capture `_reference/tickets/Studying/EAINT-12429/EAINT-12429-jira.md`):** 12429 is a **different feature** — lead capture by keyword + "AI image recognition" on public posts, not video posting. Description row 6: "On hold - to discuss further with Shamini. Shamini will propose to Morvin first before proceeding with this CR." 0 comments, 0 attachments, 0 links. **No SRD, cron interval, trigger or test account.**
11. **Same-day sibling tickets** (all created 2026-10-13, To Do, `08-jira-3months.md` lines 81-85): EAINT-12526, 12527, 12529, 12530 (Secarang Macrokiosk / Website). May share an SRD or release [unconfirmed].
    1. **Update 2026-10-27 (capture `_reference/tickets/Studying/EAINT-12526/EAINT-12526-jira.md`):** 12526 is a **content task** for WhatsApp (row 1 "WhatsApp Blast Message", row 2 "Macrokiosk"): "Create visual (image and video) for Secarang Macrokiosk flow". 0 comments, 0 attachments, 0 links. **No SRD, cron interval, trigger or test account.** Not a social-media posting ticket.
    2. **Jira re-capture of 12528 on 2026-10-27 (8:35 pm):** still 0 comments, 0 attachments, 0 links.
12. **Teams chat exists but is not captured** (`_chat-list.md` line 39). Decisions may sit there — capture it before study is finalised.
    1. **Update 2026-10-27:** still not reachable. No export under `_reference/teams/` for 12528 (glob "*12528*": no files).
    2. **Update 2026-10-27:** the Teams chat holds **no SRD**: "no SRD in chat" [Faizuddin, dashboard chat, 2026-10-27]. Trigger question is now answered (point 5); whether the chat names a test account is **still unknown** (parked).

## Suggested test focus (once an SRD exists)

1. **Trigger:** no on-demand run. Developer sets the staging cron to **every 30 mins**; check each post lands on the next run (related-history, Known traps 1.1).
2. **Per platform:** post appears on Facebook, Instagram, TikTok with the **correct caption and video**.
3. **Interval:** next post only on the next cron run (each 30-min staging run stands in for "every 2 - 3 days"); no double post in one run.
4. **Content rotation:** next run posts the next video, not a repeat [unconfirmed].
5. **Failure path:** one platform fails → other two still post; error logged.
6. **Media checks:** video plays, aspect ratio / length fits each platform, caption not cut off.
7. **Environment safety:** staging must post to test accounts only, never the live Secarang pages (accounts parked by Faizuddin, 2026-10-27).
8. **Regression:** none expected on Secarang insurance purchase (`knowledge/flow-secarang-insurance.md`) unless the SRD links them.
9. **Reusable past TS:** EAINT-11864 TS03 (second run, no repeat), EAINT-11867 TS13 (one message only), EAINT-8668 meta block R3-R5 (prod vs staging schedule) — see `EAINT-12528-related-history.md`, Reusable scenarios.

## Test data / env needs

1. Test (non-public) Facebook, Instagram, TikTok accounts with API access — **not recorded anywhere**. Parked by Faizuddin, 2026-10-27.
2. Sample videos + captions.
3. Developer to set the staging cron interval to **every 30 mins** for testing (no on-demand trigger).

## Knowledge candidates

1. **New area "Secarang Social Media"** — first ticket seen: auto-posting cron job. Source: Jira EAINT-12528 Description row 5, "A cron job auto posts Secarang caption and video on Secarang Facebook, Instagram and TikTok." / "Posting runs every 2 - 3 days." Candidate for a future `knowledge/flow-secarang-social-media.md` once an SRD lands.
2. **Ticket family:** EAINT-12429 and EAINT-12528 both carry the "[Secarang-Social Media]" prefix. Source: `_reference/inbox/eauto-flows-run/08-jira-3months.md` lines 65 and 83.
3. **Cron testing rule:** "cronjob unable to trigger on demand, but can change the interval. for testing, we usually do every 30 mins". Source: Faizuddin, dashboard chat, 2026-10-27, quoted in `EAINT-12528-related-history.md` Known traps 1.1. Check whether knowledge/ already holds this before adding.
