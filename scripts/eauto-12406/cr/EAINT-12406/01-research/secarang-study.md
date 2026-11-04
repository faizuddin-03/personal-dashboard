# Secarang and CIBO: how the team has tested them (shared study)

Written 2026-10-27 by cr-research, for **EAINT-12406** (Allianz back on Secarang), **EAINT-12078**
(STM Takaful NDDP), **EAINT-12528** (Secarang social auto-post) and **EAINT-12336** (Fiuu onboarding
reconciliation in eAuto BO). Purpose: replace the guessed Secarang rate in the 27.10 estimates with what
the team actually did. Status: **awaiting Azfar's review (gate 0)**. Nothing here is in `knowledge/` yet.

Tags: `[REQ]` SRD, `[Jira]` ticket text/comments/fixVersion, `[WB]` team workbook, `[EV]` evidence
folder (file names, or frames I took from a video, with the recording date shown on screen), `[INF]`
my inference, not stated anywhere. "Live" = Jira Done with a released fixVersion date (or a "deployed on"
comment) in the past.

Personal data: several recordings show the QA's own name, IC, phone and address typed in as the car
owner, and one shows a VPN login dialog. None of it is copied here. Account *names* (e.g. `testadmin`) and
staging paths are.

---

## 1. What Secarang and CIBO are

**Secarang** (`secarang.com`) is the public motor-insurance renewal site of **Serba Sentral Sdn Bhd**, a
licensed insurance agent ("Secarang.com website and its services are owned and operated by Serba Sentral
Sdn Bhd … a registered and licensed insurance agent") [EV] 7981 TS1.3 recording, 22.06.2025 footer.
A member of the public (not a dealer) enters a vehicle, gets quotations from several insurers, picks
add-ons, fills owner details, pays, and gets a cover note / policy and a receipt.

**CIBO** is "Secarang back office portal" [REQ] 12406 v1.1 §1.4. It is the back office for *all*
insurance sold through the Serba Sentral agency, not only Secarang: its Platform filter separates
**eAuto**, **Secarang** and **Secarang-MK** (MacroKiosk) transactions [Jira] 11523, 11564, 11630, 11634
(May 2026), and eAuto dealer insurance shows up in CIBO too [Jira] 9458, 12058 (UCD Full Name / Login ID
columns, live 17.08.2026).

### Two ways into a Secarang purchase (current)

| Flow | Entry | Payment gateway | Source |
|---|---|---|---|
| **Homepage flow** ("Secarang") | Customer opens secarang.com > Car / Motorcycle tab > vehicle + owner > quotations | **Fiuu** (was "RMS" / Razer; CIBO relabelled RMS to Fiuu, live 24.07.2026) | [Jira] 11541; [REQ] 12107 v1.2 §2.2.2; [EV] 11878 TS03/04 (06.08.2026) |
| **MacroKiosk flow** ("Secarang-MK") | WhatsApp renewal reminder from MacroKiosk with **Renew Now** / **Review Later** buttons > link opens a pre-filled Secarang quotation (`/car-insurance/confirm-payment/link/<id>` or `/choose-your-insurance/link/<id>`) | **BoldPay** | [Jira] 9064 (live 30.06.2026), 11974 (live 16.07.2026), 12079 (live 03.08.2026), 11559; [EV] 12079 TS1–TS3 (03.08.2026) |

"Pay Now / Pay Later" were renamed **Renew Now / Review Later** in the WhatsApp template (Meta content
policy) [Jira] 12079, live 03.08.2026. A further rename "PAY LATER to REVIEW LATER" on the quotation image
is To Do [Jira] 12529 (FUTURE).

### Pages / modules seen

Secarang (customer):
- Home (insurer logos, Car / Motorcycle tabs), **About Us** (Our partnership), **FAQs** (Topic 1 General
  Info, Topic 3 Claim & Support), **Support** ("Need to contact insurance company?" per insurer, expand /
  collapse) [REQ] 12406 §2.2.3; [Jira] 8762 (lists the same pages when Takaful was removed, 27.08.2025)
- Purchase steps (progress bar): vehicle details > **All Quotation / Choose your insurance** (quotation
  cards, "<insurer> – Quotation unavailable" card) > **Add-ons** > **Confirmation** (owner details, premium
  breakdown, discount code, "Exclusively by agent <agency> PIAM ID", commission %, Confirm and Pay) >
  **Payment methods** (Credit/Debit Card, FPX bank tiles, and since 21.10.2026 ShopeePay / GrabPay) >
  gateway > "Just a little moment…" > **Payment successful** page with Receipt [EV] 7981 TS1.3
  (22.06.2025), 11878 TS03/04 (06.08.2026); [REQ] 12107 §2.2.2, 12406 §2.2.5; [Jira] 11585, 11616, 11355
- Identity Verification popup (last 6 digits of IC) on the MK link [Jira] 11261, 11299, 11549
- Receipt PDF (insurer name + company number) [REQ] 12406 §2.2.9
- WhatsApp messages: successful payment / receipt, policy created, renewal reminders (9 templates since
  01.10.2026), internal alerts for cover-note failed and JPJ rejected [Jira] 12218, 12347, 8536, 11878

CIBO (back office), left menu as seen on staging [EV] 7981 (22.06.2025) and 12079 TS3 (03.08.2026):
Dashboard · User Account Management · CRM · **Transaction Management** (listing, Transaction Details,
Receipt, "Check JPJ Status") · **Payment Management** (Payment Channels filter) · **Payment Report**
(summary + export) · Referred Risk Log · Commission Report · Visitor Management · Agent Management ·
Discount Code Management. Also Macrokiosk Template Management [Jira] 12410; Opt Out listing is still in
refinement [Jira] 12443 (FUTURE).

CIBO Transaction Details layout (2025 recording, still the layout 12406's mockup builds on [INF]):
Car Owner Details · Car Details · More Info (Platform, Agency, Agency No., Agency PIAM ID, Last Update,
Cover Note Issuance Date, Submission status to JPJ) · insurer logo, Insurer name, Plan, Agreed Value
Coverage, Coverage Period, Cover Note No, Policy No · premium breakdown · Payment Details [EV] 7981 TS1.3.

### Insurers on Secarang: the timeline (current = latest live)

| When | Change | Source |
|---|---|---|
| 19.05.2025 | RHB and Allianz quotations hidden on Quotation page | [Jira] 7957 (S17.7) ; QA 8006 |
| 14.07.2025 | Lonpac hidden from control sequence | [Jira] 8540 (S19.1) |
| 27.08.2025 | **Syarikat Takaful Malaysia (STM) API disconnected and every Takaful display removed** (Quotation, Home, About Us, Support, FAQ topics 1 and 3), on Takaful's request | [Jira] 8762 comment "deployed on 27 August 2025" |
| 11.09.2025 | Lonpac unhidden | [Jira] 8788 (S21.2) |
| Sept 2025 | RHB and Allianz removed from Secarang screens | [Jira] 8799 (Done); [REQ] 12406 §2.2.2 ("removed … in Sept 2025") |
| 17.10.2025 | Lonpac Q4 campaign control sequence | [Jira] 9024 (S22.6) |
| **today** | **Only Lonpac Insurance Bhd and Tokio Marine Insurans (Malaysia) Berhad are displayed** (Home logos, About Us, FAQs, Support) | [REQ] 12406 v1.1 §2.2.2 (26.10.2026) |
| FUTURE | Allianz back (12406, fixVersion 02.11.2026); STM resumed (12078, no SRD); Zurich Takaful under Pemaju Eksklusif ([Jira] 8608, *Testing In 1st Env*, SRD v1.2 15.05.2026, not live); separate control sequence for eAuto vs Secarang ([Jira] 12150, To Do) | |

Agencies seen: Lonpac sold "exclusively by agent Pemaju Eksklusif Sdn Bhd" with its PIAM ID on the
Confirmation page and CIBO More Info [EV] 7981 (22.06.2025), 11878 (05.08.2026, eAuto side); Allianz sales
and commission go under agency **Serba Sentral** [REQ] 12406 §2.1.3b; STM was distributed by **Bintang
Prospek** ("This product is underwritten by Takaful Malaysia and Bintang Prospek is the authorized
distributor of Takaful Malaysia") [WB] 9215 UI – Insurance Purchase row 15 (eAuto, live 21.11.2025).

---

## 2. How the team tests it

### Staging

| What | Where | Source |
|---|---|---|
| Secarang staging | `https://staging.secarang.com/<path>/…` with several instances by path, like eAuto: `/preprod/` (2025), `/ia/` (03.08.2026), and the root `/car-insurance/…` (06.08.2026) | [EV] 7981 (22.06.2025); 12079 TS3 (03.08.2026); 11878 TS03/04 (06.08.2026); [Jira] 7916, 8006 "Testing Environment: staging/preprod" |
| CIBO staging | `https://staging.secarang.com/cibo/…` ("staging/cibo"), logged in as **testadmin** in both 2025 and 2026 recordings | [EV] 7981, 12079; [Jira] 12566 |
| Paired eAuto staging | eAuto-side TS of the same CR on `/preprod2/` (8536, 2025), `/uat4/` (11878 Aug 2026, 12175 Sep 2026) | [WB] 8536 row 4; [EV] 11878 TS01/02, 12175 LN-48 |
| Accounts | QA tickets "[QA][Staging] Reset Password for Secarang" / "for CIBO" exist: the team has its own staging logins for both (EAINT-7986/7987, May 2025). Credentials are not in this study | [Jira] 7986, 7987 |
| Which Secarang path a CR uses | **Not written down anywhere I found.** Each recording used a different path. | open question Q1 |

### How a test purchase is paid on staging

| Gateway / channel | On staging | Source |
|---|---|---|
| Fiuu **FPX** (homepage flow) | Works in the Fiuu sandbox; bank tiles (RHB, BSN …) open a Fiuu popup; a Secarang FPX (RHB) payment settled on staging 20.10.2026 (ref `LON20261020SFX0016`) | [Jira] 12566 (Faizuddin); [EV] 11878 TS03/04 |
| Fiuu **card** | Existing channel, "working fine" on staging 07.09.2026 | [Jira] 12107 comment (Shane, 07.09.2026) |
| Fiuu **GrabPay – Full Amount** | The **only** e-wallet option QA can test in the Fiuu sandbox | [REQ] 12107 v1.2 §2.2.8 |
| Fiuu ShopeePay (Full / SPayLater), PayLater by Grab | **Not testable in the Fiuu sandbox** ("its simulator in sandbox doesn't work") | [REQ] 12107 v1.2 §2.2.8; [Jira] 12107 comment 07.09.2026 |
| **BoldPay** (MacroKiosk flow) | On staging the BoldPay step is answered by **eSim** (`…:9089/esim/v1/boldpay…`) and needs **eAuto-VPN** connected (the recording shows the FortiClient connect before the page loads) | [EV] 12079 TS3 frames, 03.08.2026 |
| eAuto onboarding (12336's area) | Fiuu FPX (Maybank) in the sandbox settled RM 1500.00 twice on staging, 23.09.2026; a "RM 1000 sandbox cap" is OPEN | `knowledge/cross-portal/onboarding.md` (2026-09-23) |

Payment Reference ID shape: `<insurer><yyyymmdd>S<channel><nnnn>`, e.g. `LON20261020SFX0016` (FPX) and
`LON20260908SEW0002` (e-wallet, "EW" from 21.10.2026) [REQ] 12107 REQ-014; [Jira] 12566. The "S" meaning
Secarang is [INF].

CIBO **Payment Mode** display (live 21.10.2026): `BoldPay | eWallet – TouchNGo`, `BoldPay | Online Banking
– FPX-<Bank>`, `BoldPay | Credit/Debit Card – MBBMGATE_MS`, `Fiuu | eWallet – ShopeePay – Full Amount –
Single Payment`, `Fiuu | eWallet – GrabPay – Full Amount – Single Payment` (+ BNPL variants), and
`Fiuu | Online Banking – FPX-<Bank Name>` [Jira] 12327 description; 12566 (SA on Teams 20.10.2026, fixed
same day). CIBO > Payment Management has a **Fiuu - eWallet** filter with GrabPay, GrabPay - PayLater by
Grab, ShopeePay sub-options (SPayLater removed in v1.2) [REQ] 12107 REQ-011..013.

### Insurer answers, cover note, JPJ, WhatsApp

- **Vehicle-number prefixes drive the failure paths**: prefix `VB` → cover note submission FAILED,
  prefix `VF` → JPJ enquiry REJECTED ("Dev will hardcode specific vehno prefix") [WB] 8536 rows 9–13
  (staging/preprod2, Oct 2025). Whether this still holds in 2026 is unconfirmed (Q4).
- Insurer request / response pairs were saved as evidence (Tokio Marine GET_PREM, Lonpac GetQuotation,
  Takaful IssueCoverNote) plus a DB screenshot per TS [EV] 7981 TS1.1–1.5 (June 2025). Whether staging
  hits the insurers' UAT APIs or eSim for each insurer is **not stated** (Q3). An eSim tab is open in the
  11878 recordings (Aug 2026) [INF: eSim in play].
- **MessageBird must be enabled** for the WhatsApp TS [WB] 8536 pre-requisites. MacroKiosk test messages
  arrive on the QA's own WhatsApp (sender "MACROKIOSK8") [EV] 12079 TS3 (03.08.2026).
- **WhatsApp content cannot be checked on production**: "we can't verify in prod ya, since only ucd will
  receive the wa msg" (Teams, visible in [EV] 12079 TS3, 03.08.2026).
- Cronjobs (cover note, JPJ status enquiry, renewal reminders) were checked by screenshot of the job
  settings [EV] 12171 (live 10.09.2026). Renewal-reminder crons were driven by Dev for test data during
  MacroKiosk ([Jira] 11512 "Test Data Blocker – transactions shared to Dev hit Refer Risk").

### Test data

- Car owner: the QA's own identity was typed in (owner details flow to receipt, CIBO, WhatsApp). This is
  how the team did it; **for us it is personal data**: keep it out of git and boards (trap).
- Vehicles: real-looking plates that the insurer (or eSim) quotes; Allianz only quotes **individual owner,
  renewal** [REQ] 12406 REQ-002; company vehicle / non-renewal gives the unavailable card (REQ-003).
- Discount codes are created per staging by QA tickets (e.g. 11045 "Staging – Create Discount Code
  (SCW5)", Azila, 29.04.2026).

### Production

The team logged **production** checks for Secarang: "[Secarang & CIBO - QA] PRODUCTION – Regression Test
Result" tickets (8004 May 2025, 8484 June 2025, 8546 July 2025) and discount-code "Test Execution Prod"
(8091, 8093). 12406 asks for a full Allianz E2E "as it has not run in production since May 2025" [REQ]
§2.1.3a. Whether a real paid prod purchase is expected is not stated (Q6).

---

## 3. Per past CR: what was designed, run, by whom, when

| CR (live) | What | TS (designed / run) | Sheets / shape | QA (from rows or evidence) | Window seen | Defects | Source |
|---|---|---|---|---|---|---|---|
| **7876** Secarang control sequence (May 2025) | insurer order on quotation page | **5** (all pass) | private / company × with/without Takaful, TM | Charmain (QA ticket assignee) | 05.05.2025 | – | [Jira] 7916 |
| **7957** hide RHB + Allianz quotations (19.05.2025) | hide 2 insurers | **2** (private, company car) | one row per category | Charmain | 13.05.2025 | – | [Jira] 8006 |
| **7981** Secarang e-Invoice fields (30.06.2025) | new UI fields + API values | **34**: 22 functional (one video "TS1 – TS22"), 5 new purchases (TM indiv., Takaful indiv., Lonpac indiv., Takaful company with / without TIN), 7 existing approved (TM, Takaful, Lonpac, RHB, Allianz indiv.; Takaful, RHB company) | per insurer × owner type; evidence = video + API request/response + DB shot | recorded by Charmain [INF from recording]; Jira assignee Dura | 22.06.2025 recordings | not visible | [EV] `QA Team - 1. Enhancement CR/EAINT-7548 - e-Invoice CR/eAuto Insurance & Secarang/EAINT-7981 - Secarang` |
| **8536** WA alert for paid-but-cover-note-failed (29.10.2025) | eAuto + Secarang WhatsApp | **7** designed, 6 run PASS, 1 N/A (eAuto success WA disabled) | 1 sheet: 3 new (Secarang TM, eAuto Lonpac indiv., eAuto Chubb co.), 2 regression (JPJ rejected), 2 happy flow | Nick (all rows) | Oct 2025 | **1**: EAINT-9054 (Secarang not receiving failed-CN WA, retested OK) | [WB] 8536 (2025-10-27) |
| **9012** JPJ messages moved to Secarang Support number (13.10.2025) | WhatsApp sender | 4 videos, 1 Secarang (Rejected + Insurance Created) | eAuto indiv./co., Secarang | – | Oct 2025 | – | [EV] 9012 |
| **9117** eAuto insurance WA moved off Secarang Support (30.06.2026) | WhatsApp sender | Secarang: 5 videos (MacroKiosk: CN failed Lonpac, JPJ rejected TM; non-MK: created, CN failed Lonpac + TM, JPJ rejected); eAuto: 3 TS with retests | | Jira assignee Charmain | 2026 | – | [EV] 9117 |
| **MacroKiosk renewal flow** (9064 live 30.06.2026, 11974 live 16.07.2026) | new journey: WA reminder > link > Pay Now / Later > BoldPay > CIBO | **workbook not in either library** | – | Charmain, Faizuddin (bug reporters) | **14.05–30.06.2026** | **~90** MK defect tickets (Pay Now/Later, BoldPay, cronjob, WA receipt, CIBO tags) | [Jira] summary search, see note |
| **Zurich Takaful** on Secarang (8608, *not live*) | new insurer | workbook not found | – | Xiwei Lim, Goh Kai Jiaeh, Faizuddin on the bug tickets | 27.04–05.2026 | ~20 defects (quotation, plan details, add-ons, CIBO listing / filter) | [Jira] 10968, 10969, 11025, 11063–11070, 11173, 11204, 11209, 11210 … |
| **11878** JPJ-rejected WA when Lonpac returns CN + JPJ together (07.08.2026) | WA trigger | **4** (TS01–02 eAuto /uat4/, TS03–04 Secarang staging root) | | Faizuddin (logged in on /uat4/) | 05–06.08.2026 | – | [EV] 11878; [Jira] 11878 comment |
| **12079** WA button rename Renew Now / Review Later (03.08.2026) | WA template, MK flow | **3** (Pay Now expired TM, Pay Later Lonpac, Pay Now Lonpac), each to the end incl. BoldPay (eSim) + CIBO Payment Report export | | Charmain [INF: VPN user + recording profile] | 03.08.2026 (one session) | – | [EV] 12079 |
| **12168** WA renewal template content | WA template | 5 (1 E2E video + 4 template screenshots incl. Secarang) | | – | Aug/Sep 2026 | – | [EV] 12168 |
| **12171** standardise insurance cron intervals (10.09.2026) | cron config | 3 screenshots (eAuto CN, eAuto JPJ, Secarang JPJ + CN) | | – | Sep 2026 | – | [EV] 12171 |
| **12175** insurer name "Lonpac Insurance Bhd" (02.10.2026) | rename | ~32 TS folders, **eAuto UCD + BO only** on /uat4/ (automated harness, instance diff vs /eauto/) | E2E + LN-xx | – | 30.09–01.10.2026 | – | [EV] 12175. The Secarang PDF receipt part is a separate To Do ticket [Jira] 12422 [INF] |
| **12107** Secarang-Fiuu ShopeePay + GrabPay (21.10.2026) | new payment channels + CIBO filter + ref ID | **no workbook, evidence folder empty on this PC** | 15 REQs | Faizuddin raised 12566 on staging/cibo 20.10.2026 [INF: he tested it] | Dev on staging 07–09.09.2026; QA around 20.10.2026 | 1 visible: 12566 (Payment Mode for FPX, fixed same day) | [REQ] 12107 v1.2; [Jira] 12107, 12566 |
| **12327** CIBO Payment Mode column (21.10.2026) | listing + export column | no workbook, evidence folder empty | – | – | Oct 2026 | 12566 | [Jira] 12327 |
| CIBO export / permission CRs 9840, 9900, 9979, 10052 (live 20.05.2026) | export columns, permission | evidence folders empty on this PC | – | Jira assignees Aliah, Aishah | – | – | [Jira] |
| **9215** (eAuto, not Secarang) STM NDDP wording (21.11.2025) | NDDP / Takaful wording on UCD Insurance | **42 results** (12 Homepage TS + 13 purchase-step TS run for both TPFT and Comprehensive = 30), 41 PASS, 1 FAIL (TS12 "Policy Wording or Certificate Wording") | Insurance Homepage · UI – Insurance Purchase (Step 1–4) | Nadhirah, Nabila, Teck Yung | Nov 2025 | 1 fail row | [WB] 9215 (2025-12-04) |
| **8786** (eAuto + Secarang) STM PDS update (Sept 2025) | PDS links | 13 rows (sub / main user × individual / company × Steps 1–4) × TPFT / Comprehensive, **no results filled** | 1 sheet, UCD only (Takaful had just been removed from Secarang) | – | Sept 2025 | – | [WB] 8786 (2025-09-10) |
| **10187** (eAuto) STM PDS file (08.04.2026) | PDS | 10 videos (eSTM + Steps 1–3 + email ZIP, × Comprehensive / TPFT) | | Jira assignee Charmain | Apr 2026 | – | [EV] 10187 |

Note on the defect count: a Jira summary search (`summary ~ Secarang OR CIBO OR component = Secarang`)
returns about **140 defect-style tickets created 20.04–30.06.2026**, ~90 of them on the MacroKiosk flow.
That is the **defect density of a new Secarang journey**; small content / template CRs on Secarang show 0–1.

### Rate calibration (what this means for TS per QA-day)

- Small Secarang CRs ran **2–7 TS** each, in one or two sessions, one QA (7957: 2, 7876: 5, 12079: 3,
  11878: 4, 8536: 7).
- **Recording length per full Secarang purchase** (quote to payment success, often + CIBO check):
  3.5–9.4 min, median ~5 min (12079: 6.7 / 4.6 / 3.5; 8536: 3.4–9.1; 7981 new purchases: 3.5–9.4;
  11878: 3.3–6.9). Checks on an existing transaction: 1.2–3.2 min (7981 TS2.x). 7981's **22 functional
  TS sit in one 13-minute video** [EV]. So a Secarang TS is **not slower to execute** than a UCD
  insurance TS; the time goes into setup, data and defects.
- Medium: 7981 ran 34 Secarang TS (22 functional + 12 purchase / existing) with recordings dated
  22.06.2025 and files saved 01.07.2025.
- Big new journeys (MacroKiosk, Zurich) produced dozens of defects over ~6 weeks; TS counts unknown.
- **TS per requirement**: no Secarang workbook pairs with an SRD I could read. Nearest numbers: 12107 has
  15 REQs and no workbook; 9215 (eAuto NDDP) has 42 results, SRD not read. So TS/REQ for Secarang is
  **unknown**; the repo's own figure (12253: 39 TS) remains the only measured one.
- Conclusion for the playbook rate: keep **12 TS per QA-day all-in** (already the "new portal, no flows"
  rate); the evidence does not justify a slower rate per TS. Add a **one-off ~0.5 day ramp** the first
  time we touch Secarang (logins, which staging path, VPN + eSim for BoldPay, Fiuu sandbox, CIBO) and a
  **defect / retest buffer** for anything that re-enables a dormant insurer journey (MacroKiosk and Zurich
  show how many defects a Secarang journey can carry) [INF].

---

## 4. What carries over to each new ticket

### EAINT-12406 Allianz back on Secarang (SRD v1.1, 11 REQs) — estimate ~32 TS

Carries over:
- Exactly the reverse of 7957 / 8799. The team's pattern for insurer show/hide was per **owner category**
  (private, company) [Jira] 8006, 7916; 12406 adds the availability matrix of REQ-004 (all 3 / Lonpac
  missing / Allianz missing / TM missing) and REQ-003 (company vehicle, non-renewal).
- Full Allianz E2E is a real purchase like 7981 TS1.x: quote > add-ons > confirm > **Fiuu** pay > cover
  note > receipt > CIBO Transaction Details (REQ-011) and Payment Report. Use FPX or card (sandbox works);
  GrabPay Full Amount is the only e-wallet the sandbox supports.
- Receipt / CIBO regression: TM and Lonpac unchanged (REQ-010 ex. 2, REQ-011 ex. 2). Note the Secarang
  receipt may still read "Lonpac Insurance **Berhad**" because 12422 (Secarang PDF receipt rename) is To Do;
  don't fail 12406 on it.
- Allianz under agency **Serba Sentral** in CIBO payment and commission reports (Finance sign-off) [REQ]
  §2.1.3b → a CIBO Payment Report / Commission Report row.
- Watch-outs from the MK and Zurich defect lists: plan details / More Info links opening wrong documents
  (11064), add-on display (11067, 11654), receipt wording (11204, 11219), CIBO listing and filter missing a
  new insurer (10968, 10969). These are the defects a re-enabled insurer is likely to bring back [INF].
- **SRD gap**: is Allianz also offered in the **MacroKiosk renewal flow** (WA quotation image, Pay Now
  link, BoldPay)? SRD is silent (Q7). If yes, add ~4–6 TS.

Suggested: **~34–38 TS** (11 REQs: ~12 content rows, ~8 quotation-availability rows, ~6 full Allianz
purchases (indiv. renewal × FPX / card / GrabPay, + payment failed / cancelled), ~4 receipt + CIBO,
~4 regression on Lonpac / TM). At 12/day (~3 days) + 0.5 day ramp + ~0.5 day defect / retest buffer:
**~4 QA-days** vs the 3.5 estimated. Main risk: Allianz quotation API on staging dormant since
May 2025 (who provides it, real UAT or eSim — Q3).

### EAINT-12078 STM Takaful NDDP on Secarang (no SRD) — estimate ~20 TS

Carries over:
- "Resume STM" is **re-enabling an insurer that was fully removed on 27.08.2025** (API disconnected,
  Quotation / Home / About Us / Support / FAQ displays removed) [Jira] 8762. So it has all of 12406's
  re-enable shape (logo, sequence, About Us, FAQ, Support, unavailable card, E2E purchase, receipt, CIBO)
  **plus** the NDDP disclosures.
- The eAuto twin is **9215** (live 21.11.2025): 12 Insurance-homepage wording TS ("Insurance or Takaful",
  contact info, Takaful popup) + 13 purchase-step TS (Step 1 quote card wording "Sum Covered / Takaful
  Contribution / Contribution after NCD"; PDS + Certificate Wording links BM and EN at Step 1 and Step 2;
  Step 2 / 3 Takaful Plan section "Syarikat Takaful Malaysia Am Berhad (1246486-D)", contribution breakdown,
  disclaimer "underwritten by Takaful Malaysia and Bintang Prospek is the authorized distributor"; Step 4
  confirm wording and payment-failed page), each run for **TPFT and Comprehensive** = 42 results, 3 QAs.
  These are a good row list for 12078, but **expected text must come from 12078's own SRD**, not 9215.
- NDDP checklist (7 items) maps onto Secarang pages: company name, relationship, service level,
  commission-free alternative statement **before final confirmation**, breakdown incl. commission, refund
  policy **on the page right after payment (not a link)**, no mark-up [12078 00-input checklist]. Secarang
  already shows agency + commission % on Confirmation for conventional insurers [EV] 7981 (2025) [INF:
  partly reusable].
- New documents: PDS V02 (BM + EN) and Certificate / Sijil V2.0 (BM + EN) [12078 00-input].
- STM on Secarang was tested in 2025 with individual and company (with / without TIN) purchases [EV] 7981.

Suggested: **~34–40 TS** once an SRD exists (re-enable ~14 like 12406, NDDP 7 items × where they appear
~10, documents 4, E2E purchases TPFT + Comprehensive × indiv. / company ~6, CIBO + receipt ~4). That is
nearly double the 20 guessed: **~4 QA-days** (3 run + 0.5 defect buffer + 0.5 ramp if 12406 has not
already paid it). Blocked until the SRD: everything (Q8).

### EAINT-12528 Secarang video auto-post to FB / IG / TikTok (no SRD) — estimate ~10 TS

Carries over: **nothing directly**. No Secarang social-media CR has been tested in either library; 12429
(capture leads from social posts) is on hold. Cron CRs were evidenced by job-setting screenshots (12171).
WhatsApp-style outputs "cannot be verified in prod" by QA (Teams 03.08.2026); a social post on the
**real** Secarang pages is the opposite: it may only be verifiable on prod.

Suggested: keep **~8–10 TS** (post per platform × caption + video, interval 2–3 days, failure / retry,
no duplicate, token expiry) **only if** Dev provides test pages / sandbox accounts and a way to trigger the
cron on demand. If posting can only be seen on the live pages, most rows become a post-deploy observation;
size ~1 QA-day and say so. Q9.

### EAINT-12336 Fiuu onboarding reconciliation in eAuto BO (no SRD) — estimate ~20 TS

Not a Secarang ticket, but the Secarang-Fiuu work tells us:
- Fiuu on staging is a **sandbox**: FPX and card settle; e-wallets mostly do not [REQ] 12107 §2.2.8.
  Onboarding already pays Fiuu FPX on staging (`knowledge/cross-portal/onboarding.md`, 23.09.2026).
- 12336 needs the **Fiuu merchant-portal transaction export (Excel)**; on staging that means the
  **sandbox** merchant portal. Nobody in the evidence has downloaded one; who has the login is unknown
  (Q10). Without it, recon rows cannot be built.
- The BO recon pattern to copy is **10168** (already studied: `cr/EAINT-10168/LEDGER.md`): sheets per
  outcome (eAuto < bank, =, >), filters, totals, permissions, regression; 88 TS + 11 regression for 13
  modules. 12336 is one module (pre-application + application onboarding payments), matched / unmatched /
  missing in eAuto / missing in Fiuu / not Approved / Registration Fee not OK.
- CIBO's Fiuu Payment Mode / ref-ID formats are Secarang-only and **do not** carry over.

Suggested: **~20–24 TS** (no change), but add a blocker: Fiuu sandbox merchant-portal access.

---

## 5. Draft outline for `knowledge/portals/secarang/` (for approval; nothing written yet)

`portal.md`
- What Secarang is (Serba Sentral, public renewal site) and what CIBO is (Serba Sentral back office for
  eAuto, Secarang and Secarang-MK insurance).
- The two journeys (Homepage / Fiuu; MacroKiosk / BoldPay), the steps and pages listed in §1.
- Insurers today + the timeline table (with live dates), agencies (Pemaju Eksklusif, Serba Sentral,
  Bintang Prospek).
- CIBO menu, Transaction Details layout, Payment Mode formats, Payment Reference ID shape.
- WhatsApp messages and senders (MacroKiosk vs MessageBird "Secarang Support"), with the CRs that set them.

`how-we-test.md`
- Staging: staging.secarang.com/<path> + /cibo; how to find which path the ticket is on (pending Q1).
- Paying on staging: Fiuu sandbox matrix (FPX / card / GrabPay Full only), BoldPay via eSim + eAuto-VPN.
- Failure paths by vehicle prefix (VB / VF, pending Q4); MessageBird on; WA arrives on the QA's phone.
- Evidence per TS: video + receipt PDF + CIBO Transaction Details + (where relevant) Payment Report export.
- Traps: own personal data in owner fields; WA not verifiable on prod; Secarang receipt still "Berhad"
  until 12422; e-wallet BNPL untestable.
- Rate: 12 TS/day all-in (a full purchase records in ~5 min); first-time ramp 0.5 day; defect buffer
  when a dormant insurer or a new journey is switched on.

`open-questions.md`: Q1–Q10 below.

Also: a playbook line in `knowledge/playbooks/test-effort-estimation.md` replacing "12 for Secarang"
with the split content / purchase rate above.

---

## 6. Open questions

| # | Question | Who | Blocks |
|---|---|---|---|
| Q1 | Which Secarang staging path (/preprod, /ia, root …) and CIBO instance does each ticket deploy to? | Dev (Lim Yi Link / Shane) | every run |
| Q2 | Secarang + CIBO staging logins for us (team has them: 7986 / 7987) | Charmain or Faizuddin | every run |
| Q3 | On Secarang staging, does each insurer (Lonpac, TM, Allianz, STM) answer from its UAT API or from eSim? Is the Allianz API still connected on staging after May 2025? | Dev | 12406, 12078 E2E |
| Q4 | Do vehicle prefixes VB (cover note failed) / VF (JPJ rejected) still work on Secarang staging in 2026? | Dev / Faizuddin | failure-path rows |
| Q5 | Where are the TS for 12107, 12327, 9840, 9979, 10052 and the MacroKiosk project? (evidence folders empty on this PC, no workbook in the library) | Faizuddin, Charmain, Aliah | rate calibration |
| Q6 | Is a real paid purchase on **production** expected for 12406's "full Allianz E2E", and who pays / refunds? | BA Lim Yi Link, Shamini | 12406 sign-off |
| Q7 | Is Allianz also in the MacroKiosk renewal flow (WA quotation image, Pay Now link, BoldPay)? SRD v1.1 is silent | BA Lim Yi Link | 12406 scope (+4–6 TS) |
| Q8 | 12078: SRD, the 21.07.2026 email, ESI-328; which pages carry each NDDP item; BM as well as EN? | BA Chee Mei Jia / Batrisyia | all of 12078 |
| Q9 | 12528: are there test social accounts / pages, and can Dev trigger the post cron on demand on staging? | Dev, BA | all of 12528 |
| Q10 | 12336: who has the Fiuu **sandbox** merchant-portal login to download the transaction Excel? | Dev / Finance | 12336 recon rows |

## Conflicts

- **Zurich on Secarang**: ~20 Zurich defects on Secarang and CIBO were fixed (Apr–May 2026), but the
  onboarding CR 8608 is still *Testing In 1st Env* and 12406's SRD (26.10.2026) lists only Lonpac and TM as
  displayed. Treated as **not live**; Zurich may exist on staging (Q3).
- **8786** says "[eAuto][Secarang]" but its workbook covers UCD only; Takaful had been removed from
  Secarang 8 days earlier (8762). Not a rule conflict, only a scope note.

## Superseded — do NOT test against these

| Old rule | Where | Replaced by | Live since |
|---|---|---|---|
| Secarang offers STM Takaful, RHB, Allianz quotations | [EV] 7981 (June 2025) | 8762 (STM removed), 7957 / 8799 (RHB + Allianz removed) | 27.08.2025 / 19.05.2025, Sept 2025 |
| WA template CTA "Pay Now / Pay Later" | MK flow (9064) | "Renew Now / Review Later" [Jira] 12079 | 03.08.2026 |
| CIBO Payment Mode "RMS-Secarang" | CIBO Payment Report | "Fiuu …" formats [Jira] 11541, 12327, 12566 | 24.07.2026, 21.10.2026 |
| Secarang payment = Card or FPX only | [REQ] 12107 §2.2.2 "existing" | + ShopeePay, GrabPay [Jira] 12107 | 21.10.2026 |
| WA alert format of 8536 (Oct 2025) | [WB] 8536 | internal alert wording per SRD V1.3 [Jira] 12347 (Sep 2026) | Sept 2026 |

## FUTURE (not live)

12406 (Allianz, fixVersion 02.11.2026) · 12078 (STM NDDP, refinement) · 8608 (Zurich Takaful) · 12150
(separate control sequence eAuto / Secarang) · 12422 (Secarang receipt "Lonpac Insurance Bhd") · 12443
(CIBO Opt Out listing) · 12529 / 12530 (BNPL visuals, Review Later on image) · 12334 (Secarang rebrand) ·
12098 (foreigner category) · 10444 (MK renewal templates with visuals, fixVersion 02.11.2026).

---

## Sources read

Repo: `cr/README.md` (Past CRs), `knowledge/_index/sharepoint-studied.md`, `knowledge/playbooks/test-effort-estimation.md`,
`knowledge/cross-portal/onboarding.md` (Fiuu parts), `cr/EAINT-10168/LEDGER.md`, `cr/EAINT-7548/LEDGER.md`,
the four tickets' `ticket.md` / `STATUS.md`, `cr/EAINT-12406/01-intake/raw/srd.md` (v1.1),
`cr/EAINT-12078/01-intake/raw/nddp-checklist.md`. No `knowledge/` file covers Secarang or CIBO.

Workbooks (library *QA Team - eAuto - CR Test Scenarios*), copied to `cr/<T>/00-input/` and dumped:
- `EAINT-8536 - [eAuto & Secarang] [Insurance] To enable WhatsApp notifications … .xlsx` (2025-10-27) → `cr/EAINT-8536/`
- `EAINT-9214 & 9215 [eAuto] Takaful/EAINT-9215 - ⚪[eAuto] To reflect NDDP changes for Syarikat Takaful Malaysia Am Berhad.xlsx` (2025-12-04) → `cr/EAINT-9215/`
- `EAINT-8786- To update the latest PDS for Syarikat Takaful Malaysia.xlsx` (2025-09-10) → `cr/EAINT-8786/`
- `EAINT-7548 - eInvoice.xlsx`: already studied (index), has **no** Secarang sheet; not re-read.

Evidence folders (library *QA Team - 1. Enhancement CR*), file lists + frames sampled from 5 videos:
7548 / 7981 Secarang (TS1.3 frames 22.06.2025), 12079 (TS1, TS3 frames 03.08.2026), 11878 (TS01–04 frames
05–06.08.2026), 8536, 9012, 9117, 12168, 12171, 12175 (results JSON + instance diff), 9215, 10187, 8539
(eAuto only). **Empty on this PC** (folder exists, no files): 12107, 12327, 9840, 9900, 9979, 10052, 11878
long-name folder, 12391, 12199.

SRD: `SRD_EAINT-12107_v1.2_20261020.pdf` (latest; v0.1–v1.1 not used) → `cr/EAINT-12107/01-intake/raw/srd.md`.

Jira (read only, 27.10.2026): 12107, 12566, 12327, 12079, 11878, 8762, 8799, 8608, 7916, 8006, 8545; status /
fixVersion of 9215, 9214, 8786, 8536, 7981, 7980, 9064, 12422, 12150, 10187; summary search of every
EAINT ticket with Secarang / CIBO in the summary or component Secarang (~280 tickets, 2025-05 to 2026-10).

Not studied (decided): eAuto-only insurance workbooks (control sequence 8467 / 8595 / 9023 / 9564 / 11977,
campaign popups, Chubb / Lonpac X-STAR UW, 9214) — they test UCD Insurance, not Secarang; 11977 / 8467
could help 12406's sequence rows later if wanted.

---

## Proposed knowledge updates (for gate 0)

| Fact group | File and section |
|---|---|
| What Secarang / CIBO are, journeys, pages, CIBO menu and details layout | new `knowledge/portals/secarang/portal.md` (§1 of this study) |
| Insurer timeline + agencies | `knowledge/portals/secarang/portal.md` → *Insurers* |
| Staging paths, logins, Fiuu sandbox matrix, BoldPay via eSim + VPN, prefixes, MessageBird, prod limits, traps, evidence shape | new `knowledge/portals/secarang/how-we-test.md` |
| Q1–Q10 | new `knowledge/portals/secarang/open-questions.md` |
| Payment Mode formats, Payment Reference ID shape | `portal.md` → *CIBO*; one line in `knowledge/_core/fees-and-pricing.md` is NOT proposed (not eAuto pricing) |
| Fiuu sandbox: e-wallet limits | `knowledge/cross-portal/onboarding.md` → beside the "Fiuu sandbox cap" OPEN item (same gateway) |
| Secarang rate evidence (12/day holds; ~5 min per recorded purchase; 0.5 day first-time ramp; defect buffer for re-enabled journeys) | `knowledge/playbooks/test-effort-estimation.md` → *Execute per area* row |
| Past CR rows (8536, 9215, 8786, 12107 as prior art) | `cr/README.md` → Past CRs |
| CLAUDE.md map row "Secarang / CIBO" | repo `CLAUDE.md` table |
