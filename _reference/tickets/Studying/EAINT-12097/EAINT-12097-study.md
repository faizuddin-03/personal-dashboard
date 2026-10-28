# EAINT-12097 — study (2026-10-27)

## Header

1. **Title (verbatim, Jira):** "⚪[eAuto-UCD] Chubb: Mandatory UBO Capture Before Policy Inception with Front-End CTOS/B360 Display"
2. **Jira status:** **To Do** (Task). Created 2026-07-28 09:09, updated 2026-08-19 15:31.
3. **Priority:** Medium.
4. **Fix version:** **none**. Labels: 260727-260731, July2026, ProductBacklog.
5. **QA (Jira cf[10041]):** **blank**. Assignee: **blank**.
6. **BA:** not named in Jira. **Dev:** not named.
7. **Reporter:** Chee Mei Jia.
8. **Exp. Deploy Date / ETA for Testing / [QA] Est Man-day:** all **blank**.
9. **Test env:** **not stated** anywhere.
10. **Links / sub-tasks / parent / comments:** none (0 comments).
11. **SRD:** **none attached.** Only attachment is the insurer's partner briefing PDF.
12. **Teams group:** a dedicated CR Teams group was announced 2026-10-19; Faizuddin is in the member list (see Teams section).
13. **Last Jira capture:** 2026-10-27 7:57:17 pm (`EAINT-12097-jira.md` line 1). Jira "Updated" is still **2026-08-19T15:31:11**.

## Changes since last study (2026-10-27)

Compared the new capture (7:57 pm) with the first study (capture 17:20).

1. **Status:** no change. Still "To Do" `[EAINT-12097-jira.md line 6]`.
2. **Fix version:** no change. Still "—" `[line 8]`.
3. **Description:** no change. Same General Information table and the same "Chubb API Documentation" row with an empty Attachment cell `[lines 18-28]`.
4. **Comments:** no new comments. "## Comments (0)" `[line 30]`.
5. **Attachments:** no new attachments. Still only "API Partner Briefing UBO.pdf — 403501 bytes, 2026-07-28T09:10:20.208+0800" `[line 34]`. Re-read in full; content matches the first study.
6. **Other fields:** Assignee, QA, Exp. Deploy Date, ETA for Testing, Est Man-day, links, sub-tasks all still blank. Jira "Updated" timestamp is unchanged, so the Jira ticket itself has **not changed** [unconfirmed why the Scout flagged it — likely the re-capture only].
7. **Repo changes since the first study (not Jira):**
   1. **New folder** `_reference/tickets/EAINT-12097/` with two eSIM captures pasted by Faizuddin: `EAINT-12097-pasted-20261027-174716.html` (Insurance Quotation Controls) and `EAINT-12097-pasted-20261027-174951.html` (Insurance API Resps).
   2. **New file** `_reference/tickets/Studying/EAINT-12097/EAINT-12097-related-history.md` (6 past tickets, reusable scenarios, traps, effort estimate "5 – 6" man-days manual).
   3. **knowledge/esim.md now cites EAINT-12097** — new section "Insurance API and Insurance Quotation pages (captured 2026-10-27)" (lines 551-577). The first study said `grep EAINT-12097 knowledge/` = 0 hits; that is now wrong.
8. **Parts of this study corrected:** Sources read #1, #7 and new #9-#11; Suggested test focus #11.1 and #11.4; Existing repo knowledge #5-#6.

## Sources read

1. `EAINT-12097-jira.md` — Jira capture by the Jira Scout, re-captured 2026-10-27 7:57 pm (first capture 17:20): fields, description, 0 comments, 1 attachment.
2. `API Partner Briefing UBO.pdf` — 6 pages, 403,501 bytes, uploaded 2026-07-28 09:10 by the reporter. Read in full (PDF, no text copy needed).
3. `_reference/teams/eAuto-Secarang-Main-Group.md` line 419 — the only Teams mention of EAINT-12097.
4. `_reference/inbox/eauto-flows-run/08-jira-3months.md` lines 320, 712, 721 — one-line summaries only; nothing new.
5. `lib/eautoFlows/modules/insurance.ts` line 529 — "Chubb UBO capture + CTOS/B360 (To Do)." Nothing new.
6. `knowledge/eauto-insurance.md` (§Quote order, §Quotation inputs), `knowledge/flow-insurance-purchase.md` (Get Free Quote form, Steps 1–6, Resuming an unpaid quotation, Quotations expire).
7. **Not found:** no `_reference/teams/` file named for 12097 (only the line in item 3); `lib/ticketStudies.ts` = 0 hits. ~~`_reference/tickets/EAINT-12097/` does not exist; `grep EAINT-12097 knowledge/` = 0 hits~~ (superseded 2026-10-27, see items 9-11).
8. **Not available:** the Chubb **API specification** — Jira description table "Chubb API Documentation" row 1 "27.07.2026 (Mon) | API Docs |" has an **empty Attachment cell**. The PDF says "A detailed API specification will follow separately." (page 1, Purpose box).
9. `_reference/tickets/EAINT-12097/EAINT-12097-pasted-20261027-174716.html` (Insurance Quotation Controls, 8 records) and `EAINT-12097-pasted-20261027-174951.html` (Insurance API Resps, 472 records). Both headers: "URL: not given. Environment: not given." Searched both for "UBO", "CTOS", "B360", "beneficial": the only hits are inside other words ("KRUBONG" city, a password hash), so **no UBO data**.
10. `EAINT-12097-related-history.md` (same folder) — read in full.
11. `knowledge/esim.md` lines 551-577 — the only `knowledge/` hit for EAINT-12097.

## What changes

1. **Portal:** UCD. **Module:** "Insurance – Chubb". `[Jira description, General Information rows 1-2]`
2. **What (Jira row 3, verbatim):** "1. Capture UBO before policy inception  2. Display CTOS / B360 UBO data on front-end".
3. **Existing behaviour (Jira row 4):** "Nil".
4. **Why (Jira row 6):** "Key reason — this is a mandatory requirement by BNM."
5. **Regulation (Jira row 5, verbatim):** "mandated under BNM AML/CFT/CPF and TFS for FIs Policy (Insurance Sector: Para 14B.11.1 & 14B.11.12). CDD must be conducted at the exact point of establishing a business relationship; capturing UBO is a strict prerequisite before the insurance policy is purchased/incepted."
6. **Front-end display (Jira row 5, verbatim):** "Require API partners to display CTOS/B360 data on front-end as a mandatory internal control: (a) Visual Verification — operator/agent visually acknowledges & confirms UBO at onboarding; (b) Auditability & Record-keeping — front-end display serves as operational proof of compliance to auditors/BNM examiners."
7. **Who is affected (PDF p1, At a Glance):** "Corporate / company client journeys only, for Motor. Individual client journeys are NOT affected."
8. **In eAuto terms** [unconfirmed]: the **company** Vehicle Category on Get Free Quote (`input[name=vehicleCategory][value=company]`, `knowledge/flow-insurance-purchase.md` §Get Free Quote form), and only when the **Chubb** card is chosen. Company quotes show "Chubb & Takaful" only (`knowledge/eauto-insurance.md` §Quote order #5).

## Requirements (PDF, the only spec available)

Source: `API Partner Briefing UBO.pdf`, §2 "What You Need to Build" (page 2), verbatim.

1. **R1 UBO section:** "Add a UBO section to the corporate client journey, capable of holding multiple UBO records — a minimum of 1 and a maximum of 4."
2. **R2 Auto-populate:** "Consume the UBO details returned in the Chubb API response and AUTO-POPULATE them into the UBO section for the user to review."
3. **R3 Manual entry:** "Where the API response contains NO UBO details, PROMPT the user to enter the UBO details manually."
4. **R4 Mandatory fields:** "Enforce the mandatory fields for every UBO record — Name, IC / Passport and Country. The user must not be able to proceed without them."
5. **R5 Send back:** "Pass the captured UBO details back to Chubb so that they can be included in sanction screening."
6. **R6 Refresh:** "Call the Chubb API again to REFRESH the UBO details before Confirm Purchase where the customer has returned after a break in the journey, and capture / overwrite with the refreshed details."
7. **R7 Retain:** "Where the refresh returns no details, RETAIN and proceed with the UBO details captured earlier at quotation stage."
8. **Key rule (p2, orange box):** "UBO details are mandatory. Whether they arrive from the API or are typed in by the user, the journey must not be allowed to continue without a minimum of 1 complete UBO record."

### UBO fields (PDF §3 table, page 2, verbatim)

| Field | Mandatory? | Notes |
|---|---|---|
| Name | Mandatory | "Full name of the individual beneficial owner." |
| IC / Passport | Not mandatory | "Identity card number for local individuals; passport number for foreign individuals." |
| Country | Not mandatory | "Refer to Section 7 — exact definition and format to be confirmed in the API specification." |
| Date of Birth (DOB) | Not mandatory | "Captured where available." |
| Address | Not mandatory | "Captured where available." |

### Two touchpoints (PDF §4, pages 3-4)

1. **Touchpoint 1 — "Before Quotation Issuance"** steps 1-5: "The user selects a corporate client and the journey calls the Chubb API." … "Chubb performs sanction screening. If clear, the quotation is issued."
2. **Touchpoint 2 — "Before Confirm Purchase (after a break in the journey)"**: "Where the customer leaves after the quotation and returns later to complete the purchase, the UBO details must be refreshed before Confirm Purchase — they may have changed in the interim." Step 4: "sanction screening is performed again before the purchase is confirmed."
3. **Returning customers (PDF §5, page 5):** "the user may see details that differ from those shown at quotation stage."

### Not changing (PDF §5 "What Is NOT Changing", page 5)

1. "Individual (non-corporate) client journeys — no change at all."
2. "The existing quotation and purchase flow structure — UBO capture is added into the current journey, not a redesign of it."
3. "Sanction screening itself — this remains performed by Chubb; partners are not required to perform any screening."
4. **UI design is eAuto's choice (p6 box):** "the placement and design of the UBO fields within your journey is yours to determine".

## New vs existing behaviour

1. **Existing:** company quote = Vehicle Category + Vehicle No + Company Reg No, then insurer cards. No UBO step. `[knowledge/flow-insurance-purchase.md §Get Free Quote form]`
2. **New:** Chubb company journey gets a **UBO section** (1–4 records), filled from the Chubb API or typed in, and blocks progress without one complete record. `[PDF §2]`
3. **New:** a **second Chubb call** before Confirm Purchase when the user comes back later. `[PDF §2 #6]`
4. **Unchanged:** individual journeys; non-Chubb insurers [unconfirmed — PDF is Chubb-only; Jira title says "Chubb"].

## Open questions / risks for testing

1. **No SRD.** Ticket is "To Do", ProductBacklog, no BA, no fix version. All requirements above come from the insurer's briefing, not an eAuto SRD. Expect the SRD to change field names, placement and messages.
2. **CTOS / B360 vs Chubb API — source of UBO data conflicts.** Jira title and row 5 say "Display CTOS / B360 UBO data". The PDF never mentions CTOS or B360; it says "returned in the Chubb API response". Is CTOS/B360 behind the Chubb API, or a separate eAuto call? [unconfirmed]
3. **Mandatory fields conflict inside the PDF.** §2 #4: "Name, IC / Passport and Country" mandatory. §3 table: only "Name" is "Mandatory"; IC / Passport and Country are "Not mandatory". Needs a BA ruling before any negative TS.
4. **"Section 7" does not exist.** §3 Country note says "Refer to Section 7"; the PDF has only 6 sections. Country format unknown until the API spec.
5. **API spec missing.** Jira "API Docs" row has no attachment; PDF says the spec "will follow separately". Field lengths, formats and error codes unknown.
6. **Where Touchpoint 1 sits in eAuto.** PDF: "before quotation issuance (if applicable)". eAuto shows all insurer cards at Step 1 before Chubb is chosen. Is UBO captured on Get Free Quote (before cards), after picking the Chubb card, or at Step 2/3? [unconfirmed]
7. **eSTM banner entry.** That path skips the Get Free Quote form and lands on Step 1 cards (`knowledge/flow-insurance-purchase.md` §What this entry skips). Where does UBO capture appear on it? [unconfirmed]
8. **What "a break in the journey" means in eAuto.** Likely = resuming a **PENDING** row via "Resubmit" (`a.to-payment`) on the Insurance listing (`knowledge/flow-insurance-purchase.md` §Resuming an unpaid quotation). Also: same session Back/forward? Page reload? [unconfirmed]
9. **Expiry overlap.** Quotations expire after ~24 hours (`knowledge/flow-insurance-purchase.md` §Quotations expire). Touchpoint 2 testing must resume inside that window.
10. **Screening not clear.** PDF only says "If clear, the quotation is issued." What does the UCD see when Chubb screening fails — at quote or at confirm? Not stated.
11. **Refresh returns different UBOs.** PDF R6 says "overwrite". Does the UCD see a notice? Can they edit refreshed records? Not stated.
12. **Edit / delete records.** Can a user remove an auto-populated UBO, or edit it? Add a 5th? Not stated.
13. **Back office / records.** Jira row 5(b) wants "Auditability & Record-keeping". Does UBO appear on the UCD details page, CIBO/BackOffice, or reports? Not stated; Affected Portal says "UCD" only.
14. **"Operator/agent visually acknowledges & confirms"** (Jira row 5(a)) — implies an acknowledge checkbox or confirm button. Not in the PDF. [unconfirmed]
15. **Takaful for company.** Company quotes also show Takaful; out of scope? [unconfirmed]
16. **Test environment, QA owner, estimate:** all blank. Not raised as a blocker (user decides when testing starts).

## Suggested test focus

1. **Company + Chubb, API returns UBOs (1, 2, 4 records):** section auto-populates; values match the API; user can proceed.
2. **Company + Chubb, API returns no UBO:** manual-entry prompt shows; cannot proceed with 0 records.
3. **Mandatory field checks:** blank Name blocks; IC/Passport and Country per the ruling on question 3.
4. **Record limits:** min 1, max 4 — 5th record cannot be added.
5. **Individual + Chubb:** no UBO section, journey unchanged (regression).
6. **Company + Takaful (and other insurers if any):** no UBO section [unconfirmed scope].
7. **Touchpoint 2 refresh:** quote, leave, resume via listing "Resubmit" → refresh call; changed UBOs overwrite; empty refresh keeps the quote-stage UBOs.
8. **Screening not clear:** expected block / message once the SRD defines it.
9. **Payload check:** UBO details sent to Chubb on quote and on confirm (needs dev logs or eSim/stub support) [unconfirmed tooling].
10. **Regression:** Get Free Quote form, Step 1 cards, Chubb TIN No field (EAINT-9641), eSTM banner entry, price re-check popup (EAINT-9611), Resubmit, policy issuance + e-Cert, listing / details page.
11. **Test data:** company records whose Chubb response has 0, 1 and 4 UBOs; needs a Chubb staging stub or eSim scenario. **Checked 2026-10-27:** `knowledge/esim.md` has **no UBO entry**; eSIM has only "Insurance API" (`/esim/insurance-api-resp`) and "Insurance Quotation" (`/esim/insurance-quotation-control`) pages (§ page map, lines 700-701), whose fields were **never captured** (no file in `_reference/html/esim/`). Precedent EAINT-9611 steered Chubb by hand: "Ask Dev to change Premium Amount on eSIM" (`_reference/sharepoint/qa-team-ts/EAINT-9611-…md`, sheet "Gross Premium change TS - eSIM", R4 step 6, R5 step 8). UBO support in eSIM [unconfirmed] until the API spec and the developer's eSIM change exist.
    1. **Update 2026-10-27 [Faizuddin, dashboard chat, 2026-10-27]:** pasted the eSIM **Insurance Quotation Controls list** (`/esim/insurance-quotation-control`), saved at `_reference/tickets/EAINT-12097/EAINT-12097-pasted-20261027-174716.html`. URL not given. No environment needed: "eSim have no environment. it is only a simulator to simulate the outcomes of certain scenarios in the eauto/secarang website" [Faizuddin, dashboard chat, 2026-10-27, quoted in `EAINT-12097-related-history.md` Sources read #11.1].
    2. **List columns (verbatim):** "ID", "Plan Code", "Quotation Display", "State Code", "Vehicle Type". **No UBO column.** 8 records.
    3. **Chubb row:** ID "2", Plan Code "Chubb", Quotation Display "No", State Code "—", Vehicle Type "—".
    4. This page only switches an insurer's quote on or off [unconfirmed]. It is **not** the response page. The page comment says the Insurance API entity is searched by "Vehicle Reg No" (HTML lines 256-258), so the Chubb response, and any UBO field, would sit on **Insurance API** (`/esim/insurance-api-resp`) [unconfirmed].
       1. **Update (second capture):** Insurance API is now captured: `EAINT-12097-pasted-20261027-174951.html`. Page title "Insurance API Resps" (line 246); columns "ID", "Vehicle Reg No", "Insurance Plan Code", "Insurance Request Type", "Response", "Is TPFT", "Delay Milliseconds" (lines 289-295). It does hold the raw insurer response per vehicle. **No UBO element** in any Chubb row.
    5. **Insurance API is the developer's page [Faizuddin, dashboard chat, 2026-10-27]:** "this is the insurance quotation. because the API page is dev territory, so i need to ask them to change anything."
    6. **Result:** QA does **not** change eSIM for UBO. The 0 / 1 / 4 UBO responses and the Touchpoint 2 refresh change must be **set by the developer** on Insurance API, as in EAINT-9611 ("Ask Dev to change Premium Amount on eSIM"). Automation cannot create this data itself; those TS need a **manual developer step** before or during the run.
    7. **Still open:** whether the developer's eSIM Insurance API can hold UBO records at all. That is a developer build item once the Chubb API spec exists [unconfirmed].
    8. **Chubb "Quotation Display" = "No"** on this list. Meaning not documented. `knowledge/eauto-insurance.md` §Insurance cron jobs #3 says: "To simulate an insurer API that is down, set the eSIM insurance quotation for Lonpac/TMIM to `false`." Check that Chubb quotes still show on Step 1 before testing [unconfirmed].

## Teams decisions (verbatim)

1. `[_reference/teams/eAuto-Secarang-Main-Group.md:419, 2026-10-19 16:07, ticket reporter]` "Update on New CR teams groups / Will create 2 new CR groups: / EAINT-12336 … / EAINT-12097 ⚪[eAuto-UCD] Chubb - Mandatory UBO Capture Before Policy Inception with Front-End CTOS/B360 Display / As of now, will include the following team members into each CR Teams group: … Muhammad Faizuddin Bin Bidi …"
2. **No decisions recorded.** The dedicated CR group's chat has not been exported to `_reference/teams/`.

## Dependencies / related tickets

1. **EAINT-9641** — Chubb TIN No field (precedent for a Chubb-only quote input). `[knowledge/eauto-insurance.md §Quotation inputs #1]`
2. **EAINT-12424** — Chubb Address Line 1 "NO." prefix (Gathering); also changes Chubb payload. `[08-jira-3months.md:710]`
3. **EAINT-12148** — Chubb duplicate-record errors (To Do). `[08-jira-3months.md:711]`
4. **EAINT-11864** — Resubmit from the Insurance listing (Touchpoint 2 entry). `[knowledge/flow-insurance-purchase.md]`

## Existing repo knowledge / automation to reuse

1. `knowledge/flow-insurance-purchase.md` — Get Free Quote selectors, Step 1–3, listing "Resubmit" control, 24-hour expiry. **Step 4 "confirm" is "Not captured yet"** — Touchpoint 2 lands there, so capture it when testing starts.
2. `knowledge/eauto-insurance.md` — company category insurers, Chubb rules.
3. `scripts/eauto-e2e` (InsuranceQuotePage, TransactionEnquiryPage) and `scripts/eauto-quotation-reminder` (InsuranceListingPage resume) — base for a company-Chubb journey.
4. **Contradictions with knowledge:** none yet. This ticket adds a new step not described in any flow file.
5. `knowledge/esim.md` §"Insurance API and Insurance Quotation pages (captured 2026-10-27)" (lines 551-577) — eSIM page map for insurance, written from this ticket's captures.
6. **Tension between two repo files** [unconfirmed]: `knowledge/esim.md` line 571-572 says "Insurance API rows are changed by the developer on QA's request, not by QA." `EAINT-12097-related-history.md` Known traps #2.6 says per-vehicle UBO rows could be seeded and "QA could do it". The first is Faizuddin's stated rule; treat developer steering as the default until the eSIM edit form is captured (deferred to Dwarf per related-history Known traps #2.8).

## Knowledge candidates

1. **Planned (To Do):** Chubb corporate Motor journeys will need 1–4 UBO records (Name mandatory) before quotation and a refresh before Confirm Purchase after a break. Source: `API Partner Briefing UBO.pdf` §2–§4, EAINT-12097 attachment, 2026-07-28. Target: `knowledge/eauto-insurance.md`, tagged [unconfirmed] until an SRD exists.
2. **Ticket has a dedicated CR Teams group** (announced 2026-10-19 16:07). Source: `_reference/teams/eAuto-Secarang-Main-Group.md:419`. Target: `knowledge/teams-decisions-by-ticket.md`.
3. **Briefing PDF internal conflict** (mandatory fields §2 #4 vs §3 table; missing "Section 7"). Source: PDF page 2. Target: open-questions list for this ticket once a knowledge entry exists.
4. **eSIM has no environment** — "eSim have no environment. it is only a simulator to simulate the outcomes of certain scenarios in the eauto/secarang website" [Faizuddin, dashboard chat, 2026-10-27]. Target: `knowledge/esim.md` line 555, which still says "Environment not recorded in either header [unconfirmed]".
5. **Settle who edits Insurance API rows** (developer vs QA) once the edit form is captured. Source: `knowledge/esim.md` §Insurance API #4 vs `EAINT-12097-related-history.md` Known traps #2.6. Target: `knowledge/esim.md`.
