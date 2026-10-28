# Flow — Secarang Social Media (auto-posting cron)

**Draft. Not walked live. No SRD in the repo.** Built from the Jira description only.
Rewrite with SRD rules and real evidence when they land.

## 1. What the module is

1. **Affected portal:** "Social Media"; **affected module:** "- Facebook - Instagram - TikTok".
   (EAINT-12528 Jira Description, General Information rows 1-2)
   `[from ticket EAINT-12528, Jira Description]`
2. **Request:** "To post Secarang video on Secarang social media (Facebook, Instagram and TikTok) to promote the branding."
   (EAINT-12528 Jira Description row 3) `[from ticket EAINT-12528, Jira Description]`
3. **Ticket family:** EAINT-12429 (social-media leads) and EAINT-12528 (video auto-posting) both carry the "[Secarang-Social Media]" title prefix.
   `[source: pipeline EAINT-12528, Scout study "Knowledge candidates" 2, 2026-10-27]`

## 2. Flow — auto-posting (EAINT-12528)

1. **Trigger:** a cron job, no user action. "A cron job auto posts Secarang caption and video on Secarang Facebook, Instagram and TikTok."
   (EAINT-12528 Jira Description row 5) `[from ticket EAINT-12528, Jira Description]`
2. **Frequency (production):** "Posting runs every 2 - 3 days." (EAINT-12528 Jira Description row 5)
   `[from ticket EAINT-12528, Jira Description]`
3. **Purpose:** "Purpose is to create brand awareness." (EAINT-12528 Jira Description row 5)
   `[from ticket EAINT-12528, Jira Description]`
4. **Output per run:** one caption + one video on each of the 3 platforms. `[unconfirmed]`
5. **Staging interval, caption/video source and test accounts:** not known; parked by Faizuddin on 2026-10-27 ("cron internal unknown. ignore first, will get to this later").
   `[source: pipeline EAINT-12528, Scribe related history "Known traps" 2, 2026-10-27]`

## 3. How to test it

1. **Cron cannot be triggered on demand** — wait for the staging interval. Rule kept in
   [qa-team-process.md](qa-team-process.md) item 7. Do not copy the past step "Ask dev to Trigger 1st CRONJOB." (EAINT-11867 — WhatsApp video cron, TS v1).
   `[source: pipeline EAINT-12528, Scribe related history, 2026-10-27]`
2. **Check all three platforms in the same run**, not only the first. Reason: past cron bug EAINT-8732 — "Cronjob resubmit only 1 transaction when vehicle set to fail again due to RHB error" (8668 study §4.14), a cron that handled only one item per run.
   `[source: pipeline EAINT-12528, Scribe related history "Known traps" 8, 2026-10-27]` `[unconfirmed]`
3. **One platform failing should not stop the other two.** `[unconfirmed]`
   `[source: pipeline EAINT-12528, Scribe related history "Ticket brief" 5, 2026-10-27]`

## 4. Open

1. No SRD ("no SRD in chat", Faizuddin, 2026-10-27). `[source: pipeline EAINT-12528, Scribe related history, 2026-10-27]`
2. No DOM: the platforms are external sites, not eAuto/Secarang pages. `[unconfirmed]`

## 5. Update 2026-10-27 (night seed)

1. **Linked tickets are not the same feature.**
   1. **EAINT-12429 — social-media lead capture, on hold.** Jira Description row 5: "Detect posts that indicate vehicle purchase by keywords"; row 6: "On hold - to discuss further with Shamini. Shamini will propose to Morvin first before proceeding with this CR."
      `[from ticket EAINT-12429, Jira Description]` `[source: pipeline EAINT-12528, Scout chat, 2026-10-27]`
   2. **EAINT-12526 — WhatsApp / Macrokiosk visuals, not social media.** Jira Description row 3: "Create visual (image and video) for Secarang Macrokiosk flow".
      `[from ticket EAINT-12526, Jira Description]` `[source: pipeline EAINT-12528, Scout chat, 2026-10-27]`
2. **Multi-day interval on staging:** treat each next staging run as the next "2 - 3 day" post. Past precedent, 8668_APT_TS2 — APT resubmit two-day case (R13): "On staging, subsequent cronjob can be considered as next day's running".
   `[source: pipeline EAINT-12528, Scribe related history "Known traps" 3, 2026-10-27]` `[unconfirmed]` for this ticket
3. **Proof may come from developer logs only.** Past WhatsApp video cron (EAINT-11867 v1 R3, R5, R12) expected results cite "(Request log from dev)".
   `[source: pipeline EAINT-12528, Scribe related history "Known traps" 5, 2026-10-27]`
4. **Posting to real public pages from staging** is a risk while test accounts are unknown. `[unconfirmed]`
   `[source: pipeline EAINT-12528, Scribe related history "Known traps" 4, 2026-10-27]`
5. **Estimate:** about **2.0 man-days** (range 1.5–2.5), **8–12 TS**, low confidence. Only comparable figure: EAINT-11864 — quotation reminder cron, "[QA] Est Man-day (cf 10081):** 2.5".
   `[source: pipeline EAINT-12528, Scribe related history "Estimated testing effort", 2026-10-27]` `[unconfirmed]`
6. **No automation planned** — posts land on outside platforms. `[source: pipeline EAINT-12528, Scribe chat, 2026-10-27]` `[unconfirmed]`

## 6. Lead capture (EAINT-12429, on hold, no SRD)

1. **Request:** "To capture leads from public social media posts that show a vehicle purchase, so Secarang can collect more leads and increase renewal cover notes."
   (EAINT-12429 Jira Description row 3) `[from ticket EAINT-12429, Jira Description]`
2. **Expected behaviour (row 5, verbatim):** "Use official APIs from platforms such as Facebook, Instagram, TikTok, or X, where permitted."; "Detect posts that indicate vehicle purchase by keywords, e.g. "just bought my car", "new vehicle", "my new ride"."; "Detect posts with images containing vehicles using AI image recognition."; "Capture public posts only."
   `[from ticket EAINT-12429, Jira Description]`
3. **Module label:** Jira row 2 "Insurance"; portal row 1 "Social Media". `[from ticket EAINT-12429, Jira Description]`
4. **Not stated:** where leads land, lead fields, run trigger, keyword list, image threshold, platforms in scope.
   `[source: pipeline EAINT-12429, Scout study "What changes" 6, 2026-10-27]`
5. **Link to the renewal reminder:** the Macrokiosk reminder takes only 3 fixed sources (see
   [flow-secarang-insurance.md](flow-secarang-insurance.md) "Update 2026-10-27 from EAINT-12429"). A lead
   reaches it only if saved as a Secarang customer record with a policy expiry date. `[unconfirmed]`
   `[source: pipeline EAINT-12429, Scribe related history "Header" 3.1.4, 2026-10-27]`
6. **Estimate:** about **5 man-days** (range 4–6), **12–20 TS**, low confidence; no official figure ("[QA] Est Man-day (cf 10081):** —").
   `[source: pipeline EAINT-12429, Scribe related history "Estimated testing effort", 2026-10-27]` `[unconfirmed]`
