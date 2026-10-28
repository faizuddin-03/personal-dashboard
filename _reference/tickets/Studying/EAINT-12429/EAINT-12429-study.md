# EAINT-12429 — study (2026-10-27)

## Header

1. **Title (verbatim, Jira):** "⚪[Secarang-Social Media] Capture Leads from Social Media Posting to Increase Renewal Cover Note"
2. **Jira status:** **To Do** (Task). Created 2026-10-05 15:53; updated 2026-10-16 16:36.
3. **Priority:** Medium.
4. **Fix version:** none ("**Fix versions:** —"). Labels: 261005-261009, October2026, ProductBacklog.
5. **QA (Jira cf[10041]):** blank. **Assignee:** blank. **Reporter:** Chee Mei Jia (BA).
6. **Dev:** not named anywhere.
7. **Deployment date / ETA for Testing / QA man-days:** all blank ("**Exp. Deploy Date (cf 10087):** — · **ETA for Testing (cf 10057):** — · **[QA] Est Man-day (cf 10081):** —").
8. **Test env:** **not stated.**
9. **State of the CR:** **on hold.** Description row 6 "Additional Note": "On hold - to discuss further with Shamini. Shamini will propose to Morvin first before proceeding with this CR."
10. **No SRD, no attachments, no comments, no links, no sub-tasks.**
11. **Last Jira capture:** "27/10/2026, 8:30:26 pm" (`EAINT-12429-jira.md` line 1). Jira "**Updated:** 2026-10-16T16:36:21.494+0800" — unchanged.

## Changes since last study (2026-10-27)

1. **Compared:** first capture (2026-10-27 17:31) vs re-capture ("27/10/2026, 8:30:26 pm").
2. **Status:** no change — "**Status:** To Do".
3. **Fix version:** no change — "**Fix versions:** —".
4. **Description:** no change. Rows 1-6 match word for word, incl. row 6 "On hold - to discuss further with Shamini. Shamini will propose to Morvin first before proceeding with this CR."
5. **New comments:** none — "## Comments (0)".
6. **New attachments:** none — "## Attachments" section empty.
7. **Other fields:** no change to assignee ("—"), QA ("—"), labels, links, sub-tasks, deploy date, ETA for Testing or QA man-days.
8. **Jira "Updated" stamp** is still "2026-10-16T16:36:21.494+0800", so **nothing in Jira changed** after the first study. The re-study trigger is likely a capture-time difference only [unconfirmed].
9. **New repo material since the first study:** `EAINT-12429-related-history.md` (same folder, dated 2026-10-27). Added to Sources read below. It does not contradict this study.
10. **Teams / knowledge:** still no Teams export for this ticket; `knowledge/` grep "EAINT-12429", "social media", "Morvin": **0 hits**.
11. **Parts of the study made wrong by the change:** none.

## Sources read

1. `_reference/tickets/Studying/EAINT-12429/EAINT-12429-jira.md` — Jira re-capture "27/10/2026, 8:30:26 pm" (fields, description, "## Comments (0)", attachment list empty). First capture 2026-10-27 17:31 had the same content.
2. **Other files in `_reference/tickets/Studying/EAINT-12429/`:** no SRD PDF, docx, image or mock-up exists to read. One other file: `EAINT-12429-related-history.md` (related past tickets 12218, 12217, 12443, 8147, 9062; estimate **5 man-days**, range 4-6, "**Confidence:** **low**" [unconfirmed estimate]). Read in full.
3. `_reference/tickets/EAINT-12429/` — **does not exist.**
4. `_reference/teams/` — **no export for this ticket.** The chat exists in the Teams sidebar: `_reference/teams/_chat-list.md` item 24 "EAINT-12429 [Secarang-Social Media] Capture Leads from Social Media Posting to Increase Renewal Cover Note" (captured 2026-10-16). Its messages were not captured, so **not read**.
5. `knowledge/` — grep "EAINT-12429": **0 hits.** `lib/ticketStudies.ts`: **0 hits.**
6. `_reference/inbox/eauto-flows-run/08-jira-3months.md` line 65: "| EAINT-12429 | Task | [Secarang-Social Media] Capture Leads from Social Media Posting to Increase Renewal Cover Note | To Do | unassigned | 2026-10-05 | 2026-10-16 | Secarang / MacroKiosk / WhatsApp | latest |".
7. Sibling study `_reference/tickets/Studying/EAINT-12528/EAINT-12528-study.md` (Open questions #10, Knowledge candidates #2) and `EAINT-12528-related-history.md` item 5.
8. Context: `knowledge/README.md`, `knowledge/flow-secarang-insurance.md` (gaps list and 2026-10-27 Charmain-repo update), `knowledge/people-and-roles.md` §4.

## What changes

1. **Portal (Jira row 1):** "Social Media". **Module (Jira row 2):** "Insurance".
2. **Request (Jira row 3, verbatim):** "To capture leads from public social media posts that show a vehicle purchase, so Secarang can collect more leads and increase renewal cover notes."
3. **Existing behaviour (Jira row 4, verbatim):** "No lead capture from social media posting is available today."
4. **Expected new behaviour (Jira row 5, verbatim):**
   1. "Use official APIs from platforms such as Facebook, Instagram, TikTok, or X, where permitted."
   2. "Detect posts that indicate vehicle purchase by keywords, e.g. "just bought my car", "new vehicle", "my new ride"."
   3. "Detect posts with images containing vehicles using AI image recognition."
   4. "Capture public posts only."
5. **Why:** more Secarang leads → more renewal cover notes (row 3).
6. **Not stated anywhere:**
   1. **Where captured leads go** (CIBO listing? Secarang DB? Macrokiosk WhatsApp list?) [unconfirmed].
   2. **What a "lead" contains** (post URL, handle, image, phone?) [unconfirmed].
   3. **How a lead becomes a renewal cover note** (follow-up by WhatsApp / Macrokiosk reminder?) [unconfirmed].
   4. **Run trigger** (cron, interval, manual).
   5. **Which platforms are actually in scope** — row 5 says "such as" and "where permitted".

## Requirements

1. **No SRD.** No REQ numbers exist. The four row-5 lines above are the only requirements.
2. **Keyword detection** — example phrases only ("e.g."); no full keyword list, no language (Malay / Chinese) list [unconfirmed].
3. **Image detection** — "AI image recognition"; no model, confidence threshold or vehicle-type rule stated.
4. **Public posts only** — the one hard rule that QA can check as stated.

## New vs existing behaviour

1. **Existing:** no social-media lead capture. `[from Jira row 4]`
2. **New:** platform-API scan of public posts by keyword + image, captured as leads. `[from Jira row 5]`
3. **Relation to existing Secarang flows:** none described. `knowledge/flow-secarang-insurance.md` covers the B2C quote → Fiuu payment purchase and lists "renewal" as a gap (#8: "TPFT on Secarang, renewal, refund, e-cover note / policy documents beyond the receipt PDF, any customer email"). This ticket does not change that flow as written [unconfirmed].

## Open questions / risks for testing

1. **CR is on hold** — "On hold - to discuss further with Shamini. Shamini will propose to Morvin first before proceeding with this CR." (Jira row 6). Scope may change or be dropped.
2. **Morvin** is not in `knowledge/people-and-roles.md`. Role unknown (approver above the Ops requestor?) [unconfirmed]. Shamini = "Ops requestor for Secarang, insurance and CIBO" (`knowledge/people-and-roles.md` §4 item 4).
3. **No SRD, no mock-up** — nothing to write TS from yet.
4. **Output of the feature unknown** — no screen, listing, report or message is named, so there is no visible result for QA to check.
5. **Test data on real social platforms:** testing needs public posts on Facebook / Instagram / TikTok / X. Needs **test accounts** or a dev sandbox; posting real "just bought my car" content publicly is a risk [unconfirmed].
6. **Platform API limits:** "where permitted" — some platforms may not allow keyword search of public posts. Feature may shrink to one or two platforms [unconfirmed].
7. **AI image recognition accuracy** — no pass/fail threshold; false positives / negatives cannot be judged without one.
8. **Privacy / PDPA** — capturing personal posts as sales leads; no consent or opt-out rule stated [unconfirmed]. Compare Macrokiosk opt-out work (EAINT-12217/12218, EAINT-12443).
9. **Teams chat not captured** — sidebar item 24 exists; decisions may be there. Capture before picking up.
10. **Module label conflict:** Jira row 2 says "Insurance"; the 3-month Jira list (`08-jira-3months.md` line 65) groups it under "Secarang / MacroKiosk / WhatsApp". Portal is "Social Media", not a Secarang page.
11. **Sibling EAINT-12528** ("[Secarang-Social Media] Post Secarang Video on Facebook, Instagram and TikTok to Promote Branding", To Do) shares the prefix but is a **different feature** (video auto-posting cron). No Jira link between them. `[from EAINT-12528-study.md Open questions #10.1]`

## Suggested test focus (once an SRD exists)

1. **Keyword match:** posts with each listed phrase → captured; posts without → not captured; case / spacing / Malay variants [unconfirmed].
2. **Image match:** post with vehicle photo, no keyword → captured; non-vehicle photo → not captured.
3. **Public only:** private / friends-only post with keyword → **not captured**.
4. **Per platform:** repeat for each platform confirmed in scope.
5. **Duplicates:** same post scanned twice → one lead [unconfirmed rule].
6. **Lead record:** fields shown wherever leads land (CIBO / Secarang) once named.
7. **Downstream:** if leads feed Macrokiosk WhatsApp, opted-out numbers must be skipped (existing rule, EAINT-12218) [unconfirmed link].
   1. **Update 2026-10-27 (EAINT-12218 SRD v1.1 read):** the renewal reminder takes customers from **3 fixed sources only**. REQ-003 (§2.2.4, p.16): "Customer records are drawn from 3 sources: eSTM with insurance, eSTM without insurance, and Secarang." No 4th "social media" source and no rule for adding one. §2.1.2 Out-of-Scope #5: "Changes to customer registration logic in eSTM and Secarang". A social-media lead feeds the reminder only if it becomes a Secarang customer record with a policy expiry date (Assumption #6) [unconfirmed]. Text copy: `_reference/tickets/Studying/EAINT-12218/EAINT-12218_SRD_v1.1_20260903-text.md`.
8. **Regression:** Secarang purchase / renewal flows untouched (`scripts/secarang-insurance`; Charmain's `secarang-renewal-e2e.js` per `knowledge/flow-secarang-insurance.md` 2026-10-27 update).

## Existing repo knowledge / automation to reuse

1. **No social-media flow file** in `knowledge/`. Nearest: `knowledge/flow-secarang-insurance.md`.
2. Sibling study: `_reference/tickets/Studying/EAINT-12528/EAINT-12528-study.md`.
3. No automation applies yet: the feature has no UI defined.
4. Related past tickets, reusable scenarios and known traps (Macrokiosk access, Meta template approval, opt-out): `_reference/tickets/Studying/EAINT-12429/EAINT-12429-related-history.md`.

## Knowledge candidates

1. **Ticket family "[Secarang-Social Media]"** = EAINT-12429 (lead capture by keyword + AI image on public posts; on hold) and EAINT-12528 (video auto-posting). Source: Jira EAINT-12429 Description rows 3, 5, 6 (capture 2026-10-27); `08-jira-3months.md` lines 65, 83. Candidate for a future `knowledge/flow-secarang-social-media.md` once an SRD lands.
2. **Morvin** — named as the person Shamini proposes this CR to. Source: Jira EAINT-12429 Description row 6, "Shamini will propose to Morvin first before proceeding with this CR." Role not known; add to `knowledge/people-and-roles.md` §4 once confirmed.
