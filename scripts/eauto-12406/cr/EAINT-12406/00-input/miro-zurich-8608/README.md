# Past team test board: eAuto & Secarang - Zurich (EAINT-8606 / EAINT-8608)

- **Board:** https://miro.com/app/board/uXjVGih1g4s=/ (given by Azfar 28.10.2026 to check the EAINT-12406 draft).
- **Title:** "eAuto & Secarang - Zurich". Board created 14.04.2026, last edited 03.08.2026 (Miro board info).
- **Copied:** 28.10.2026, read-only, in the Playwright browser (signed in as Azfar) with the Miro Web SDK. Nothing on
  the board was edited, moved, deleted, commented on or reacted to. Only the viewport was moved (to look at 3 images).
- **Why it is here:** the team's past board for the Zurich Takaful onboarding, tested on eAuto AND Secarang. It is the
  nearest past board for EAINT-12406 (Allianz re-activation on Secarang). The comparison is
  `cr/EAINT-12406/01-intake/review/2026-10-28-zurich-board.md`.
- A past board decides **what** to test, never **what to expect** (expected results come from SRD v1.1 only).
  PASS / FAIL, ✅ / ❌ and QA names are the team's own results from April–June 2026, not checked again.

## Which CR it belongs to

Overview frame: "Ticket: EAINT-8606 (eAuto), EAINT-8608 (Secarang)"; "Target Deployment Date: 14th May 2026";
"UAT session: 29 & 30 April". QA colour table: Azfar (Chrome, Main UCD), Faiz (Firefox 36.0.4, Sub UCD),
Teck Yung (Chrome, Main UCD). Other ticket named: EAINT-11047 (motorbike plan details, raised and retested, t08).

## Files

| File | What |
|---|---|
| board.json | Board info, 235 items (no table cells: type, id, parentId, x/y raw SDK, w/h, title, content with HTML stripped, connector ends), the 30 tables as TSV text, and the two mind maps as indented text |
| board.md | Items grouped by frame. Frames are untitled on this board; each section title is the text in the thin "strip" frame above it (body frames show it in [brackets] where it could be matched). Mind maps at the end |
| INDEX.md | Table list: file, section, absolute position, rows x cols, characters, first line |
| tNN_<id>.tsv | One file per table (30), board order top-to-bottom then left-to-right |
| split.py | Rebuilds board.md / INDEX.md / the TSVs from board.json (and masks IC-shaped numbers) |

Board counts: 40 frames (most are thin header strips), 113 texts, 28 sticky notes (mostly TS counters), 30 tables,
13 connectors, 3 images, 3 shapes, 2 mind maps, 2 groups, 1 card; 1923 table cells (no text through the SDK).

## Sections (the strip titles, in board order)

- Overview (left): tickets, target date, "To add" sticky (cronjob, refer-risk, API down, JPJ API down deprio,
  regression, Secarang high level, free quote without eSTM, MPA coverage, NCD / over-insured), t02 eAuto directory
  (133 TS, 83 passed = 51.13% at the last update), Affected Page list (UCD / BO / Service Portal).
- **eAUTO Zurich - High Level**: t01 Insurance Transaction Listing states, Affected Page text, eAuto mind map, premium
  breakdown text, MPA Coverage plan text.
- **Secarang Zurich - High Level** (sticky "71"): insurer card texts (RHB, Takaful, Allianz, Lonpac, Tokio Marine,
  Zurich) and add-on card lists per insurer, colour legend Secarang #002ba7 / CIBO #F9A643, Secarang mind map,
  RHB e-Certificate note. NB: this block still lists RHB and Allianz, which were off Secarang since May / Sept 2025;
  it looks copied from an older Secarang board.
- t03 Secarang directory (75 TS, 49 passed), unframed, right of the eAuto overview.
- **SECARANG > Comprehensive / TPFT**: SC_E2E_TS1–TS28 texts (✅ 9, ❌ 1 = TS9 "All Add-Ons", 18 unmarked), the
  "REMEMBER TO CHECK" list (CIBO CRM, Transaction Management, Payment Report, Commission Report; refer-risk log;
  commission under PIAM ID; receipt, email, WhatsApp; PIAM ID MTA-J55282; gender re-price; All Drivers popup).
- **CIBO**: t06 Transaction Management (CIB_TS1–7, all Pass, Azfar).
- **Existing Insurance Transaction Test Scenarios**: EXT_TS1–6 (before / after deploy, staging/eauto vs staging/sit3).
- **E2E Test Scenarios > ZURICH (COMPREHENSIVE) / (THIRD PARTY, FIRE AND THEFT)**: COM_TS1–12, TPFT_TS1–12 (eAuto).
- **Functional Testing > Insurance Purchase Flow / UCD / BO** (eAuto): t08 Get A Free Quote, t09 Insurance Homepage,
  t14 Plan Details & More Info, t18 Optional Coverage, t12 UCD Insurance Transaction Listing, t13 BO listing,
  t20 Insurance Payment Report, t21 BO Insurance Quote Enquiry, t26 Monthly Handling Fee Report.
- **Functional Testing** (Secarang, right): t17 Optional Coverage, t19 Additional Functions, t22 Home Page,
  t23 Plan Details & Excess Info.
- **UI Testing** (Secarang): t27 User Interface - Car, t28 Text Display - Motorbike.
- **Regression**: t16 (eAuto, other insurers). **Cron Job**: t15. **Insurance Sequence**: t24 Car, t25 Motorbike (eAuto).
- **eAuto Service Portal > Hire Purchase Record Status = B / T / Active**: t07, t10 (BER / Total Loss handling).
- **Insurance API Response Test Scenarios > Refer Risk Error / Insurance API Down**: t29, t30 (eAuto).
- **NEW REQUIREMENT**: empty frame.

## Images (not saved; text transcribed here)

The 3 images were looked at on screen; none is saved, because two are Teams screenshots with people's photos and the
third is an eAuto banner.
- Teams, Amirul Azfar 05/05/2026 9:41: "since Secarang will cater for Zurich motorbike, the portal currently is displaying
  the word 'car' on most..."; Mei Jia Chee 11:52: reached out to Shamini, Kin Hang to come out with the design; "basically
  the idea will be user has to select the Vehicle Type (car or motorbike) then select the Category (Individual or Company)".
- Teams, Goh Kai Jiaeh 12:46 (date not shown): "hi all, just fyi EV car won't be included in this phase. Can skip the
  testing for this part."
- eAuto banner "eAuto Insurance is available now! NEW / GET FREE QUOTE FOR VEA3699" (eAuto only).

## How it was copied

Same method as `cr/EAINT-12121/00-input/miro-past-board/README.md`: items dumped with `miro.board.get()`; each table
selected with `miro.board.select({id})` and copied with Ctrl+C while `DataTransfer.setData` was hooked; the
**text/html** flavour parsed into rows and cells (merged cells expanded, text in the first cell, line breaks kept).
30 of 30 tables copied on the first attempt, none empty. Mind maps: `miro.board.experimental.get({type:'mindmap_node'})`
for the roots, then `getChildren()` recursively (children ordered top-to-bottom).

## Masking

No IC number, personal phone or customer name was found in any table or text (checked 28.10). split.py masks any
12-digit IC-shaped number anyway. Two phone numbers are kept because they are company lines quoted inside expected
results: the PIAM "Get in touch?" number (t19 TS_SAF_8) and the X Star Technology helpline (t07). Plates (e.g. JVJ6453,
QRJ6589) are staging test vehicles and are kept. One RHB UAT login mailbox in the Secarang frame ("RHB e-Certificate
retrieval") is masked to `xxxx@<domain>`.

## Not copied / gaps

- Cell fill colours (the QA colour column of t04 / t05, row colours) are not in the copy: TSV text only.
- The "Total Test Scenario as of" text and the "Daily Target Overview" shape are empty templates on the board.
- The mind maps' child order is by position; branches that sit side by side may read in a slightly different order.
- The NEW REQUIREMENT frame is empty.
