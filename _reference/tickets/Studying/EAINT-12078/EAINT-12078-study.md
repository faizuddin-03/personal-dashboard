# EAINT-12078 — study (2026-10-27)

## Header

1. **Title (verbatim, Jira):** "⚪[Secarang-Insurance] NDDPs Requirement for STM"
2. **"STM" here = Syarikat Takaful Malaysia**, not the eAuto STMS / eSTM module. All 4 product files are prefixed "STMAB" and name "Syarikat Takaful Malaysia Am Berhad" (PDS EN p.1). `[from attachments]`
3. **Jira status:** **REQ REFINEMENT IN PROGRESS -EAUTO** (Task). Jira "Updated: 2026-10-13T14:29:58.993+0800". Last checked: Jira capture 27/10/2026 7:51:34 pm. Created "2026-07-24T18:20:59.049+0800".
4. **Priority:** Medium.
5. **Fix version:** none. Labels: 260720-260724, July2026, ProductBacklog.
6. **QA (Jira cf[10041]):** blank. **[QA] Est Man-day:** blank. **ETA for Testing:** blank. **Exp. Deploy Date:** blank.
7. **BA:** Batrisyia Hasanah Binti Nursyamsi (Jira assignee; opened the Teams CR group).
8. **Dev:** **not assigned.** `[from Teams EAINT-12078, 2026-10-26 15:06, Reporter]` "need advise that this ticket who will be the dev pick up ya?"
9. **Reporter:** Chee Mei Jia.
10. **Test env:** **not stated** anywhere (Jira, Teams).
11. **SRD:** **none attached.** Teams `[2026-08-17 14:32, BA]` "once done will show to PO before sending to Takaful to review. Then only I will start on the SRD draft ya".
12. **Comments:** 0. **Links / sub-tasks / parent:** none.
13. **Attachments:** 5 PDFs, all uploaded by the reporter on "2026-10-13T14:29:59" to "2026-10-13T14:30:00". No SRD, no Figma.

## Changes since last study (2026-10-27)

Compared: Jira capture 27/10/2026 7:51:34 pm vs the capture this study was built on (2026-10-27 17:28, re-checked 17:41).

1. **Status:** **no change** — still "REQ REFINEMENT IN PROGRESS -EAUTO".
2. **Fix version:** **no change** — still "—".
3. **Description:** **no change** — rows 1-6 and Supporting Documents row 1 ("13.10.2026 (Tues)") match the quotes in this study word for word.
4. **Other fields:** **no change** — Priority Medium; Labels "260720-260724, July2026, ProductBacklog"; Assignee BA; Reporter; QA, Exp. Deploy Date, ETA for Testing, [QA] Est Man-day all "—"; Links, Sub-tasks, Parent "—".
5. **New comments:** **none** — "## Comments (0)".
6. **New attachments:** **none** — same 5 file names; upload times all 2026-10-13, before the first study.
7. **Jira "Updated" field unchanged** at "2026-10-13T14:29:58.993+0800". The re-study trigger likely came from a field the capture does not show (e.g. watchers, rank) [unconfirmed].
8. **Teams / knowledge / lib:** **no change** — Teams file still ends at the 2026-10-26 15:06 message; `knowledge/` still has only `cr-ledger.md` line 1003 and `teams-decisions-by-ticket.md` lines 96-97; `lib/ticketStudies.ts` still has no entry; `_reference/tickets/EAINT-12078/` still does not exist.
9. **Study content:** nothing in this study is made wrong. Only the Header and "Sources read" #1 were refreshed.

## Sources read

1. Jira capture `_reference/tickets/Studying/EAINT-12078/EAINT-12078-jira.md` (first 2026-10-27 17:28; re-read at capture 27/10/2026 7:51:34 pm): fields, description, 0 comments, 5 attachments.
1a. `_reference/tickets/Studying/EAINT-12078/EAINT-12078-related-history.md` (full, re-read 2026-10-27) — no conflict with this study. The 5 PDFs were not re-read: same files, same upload times as the first study.
2. **NDDP Monitoring Checklist (Bintang Prospek)** PDF — all 3 pages read, including the evidence screenshots.
3. **PDS Takaful myMotor – Private Car (English) V2 02-2026** PDF — both pages read.
4. **PDS Takaful myMotor – Kenderaan Persendirian (BM) V2 02-2026** PDF — both pages read.
5. **Certificate Wording Takaful myMotor – Private Car V2.0 (E) 05-2026** PDF — **pages 1-4 of 40 read only** (cover, explanatory notes, cover table). Pages 5-40 (policy clauses) not read.
6. **Sijil Takaful myMotor – Kereta Persendirian V2.0 (BM) 05-2026** PDF — **pages 1-2 of 41 read only**. Pages 3-41 not read.
7. Teams `_reference/teams/EAINT-12078-Secarang-NDDPs-for-STM.md` (3 messages, to 2026-10-26). The 2026-10-26 "[image]" is **not captured** — content unknown.
8. Teams `_reference/teams/eAuto-Secarang-Main-Group.md` line 207 (group opened 2026-08-17).
9. `knowledge/teams-decisions-by-ticket.md` §EAINT-12078; `knowledge/cr-ledger.md` line 1003; `knowledge/flow-secarang-insurance.md`; `knowledge/flow-zurich-takaful.md` §2, §4b; `knowledge/business-rules-from-test-scenarios.md` lines 464-472, 982-984; `knowledge/cr-test-scenario-catalogue.md` rows 085, 095, 135.
10. Not in repo: `_reference/tickets/EAINT-12078/` (no folder), `lib/ticketStudies.ts` (no entry), **source ticket ESI-328**, **the email dated 21.07.2026**, the Figma.

## What changes

1. **Portal:** Secarang. **Module:** Insurance. `[Jira description, rows 1-2]`
2. **Request (verbatim):** "Resume STM and comply with NDDPs requirement for STM, based on email dated 21.07.2026." `[Jira description, row 3]`
3. **Existing (verbatim):** "STM currently not resumed / not compliant with NDDPs requirement." `[row 4]`
4. **Expected (verbatim):** "STM resumed and fully compliant with NDDPs requirement per email 21.07.2026." `[row 5]`
5. **Two parts** [unconfirmed reading of rows 3-5]:
   1. **Resume** Syarikat Takaful Malaysia quotes / purchase on Secarang (currently off).
   2. **NDDP disclosures** on the Secarang purchase flow, per the 7-item checklist.
   3. **Document refresh** — new PDS V2 02-2026 and Certificate Wording / Sijil V2.0 05-2026 (EN + BM). `[Supporting Documents row 1, dated "13.10.2026 (Tues)"]`
6. **NDDP = non-direct distribution platform** [unconfirmed expansion]. The checklist title: "DISTRIBUTION OF TAKAFUL PRODUCTS BY CORPORATE AGENTS VIA NDDP".

## Requirements — NDDP Monitoring Checklist (verbatim)

Checklist intro: "The intermediaries distributing takaful products via NDDPs must clearly and prominently disclose the following information to financial consumers:" Every row is ticked "Comply" (☒). Signed 17/11/2025 (Business Manager, Head of Division) and 05/12/2025 (Chief Marketing Officer).

1. **No. 1** "Name of the company" — Evidence: "This product is underwritten by Takaful Malaysia and Bintang Prospek is the authorized distributor of Takaful Malaysia".
2. **No. 2** "The type of relationship between the company and the intermediary distributing the takaful products via the NDDP." — same evidence line as No. 1.
3. **No. 3** "The level of services to be expected from the company or intermediary distributing the takaful products via the NDDP." — Evidence: "Following are some of the services offered:" / "Instant quotes from our insurance partners or takaful operator" / "Insurance or Takaful plans and benefits comparison" / "Thorough product information via Product Disclosure Sheet or Policy Wordings or Certificate Wording" / "Secured online payment via multiple payment options"; plus a "Takaful Malaysia Contact Info" block with the "Other inquiries, claims, or complaints helpline" "Tel: 1-300-88-252-385" boxed.
4. **No. 4** "A statement explaining the availability of options to purchase similar products that provide a rebate on commission or is commission free if purchased from the company's direct distribution channels, prior to enabling financial consumers to proceed with final confirmation of purchase." — Evidence (above PAY NOW): "By continuing, you agree to our Privacy Policy and Terms of Use, you declare to have read, understood and accepted the selected insurer's or takaful operator's Product Disclosure Sheet and acknowledge your duty to exercise reasonable care in furnishing information, further declaring that you have provided the information fully and accurately. Furthermore, a standard commission associated with the product will be applied when you proceed with the purchase of this product on this platform. Alternatively, for commission-free purchase of similar product, you may visit our respective insurance partner's or takaful operator's website or any of their physical branches."
5. **No. 5** "A detailed breakdown of takaful contribution amount, commission or remuneration, as well as relevant fees and charges, to be received by the intermediary distributing takaful products via the NDDP." — Evidence: breakdown box "NCD (0.0%)", "All Drivers", "Contribution After NCD", "Optional Coverage", "Gross Contribution", "Service Tax", "Stamp Duty", "Rounding", "10% Gross Contribution Discount", "Total Nett Contribution After Discount".
6. **No. 6** "The takaful contribution refund policy, immediately after payment (i.e. not via a link to another document)." — Evidence (success page, under [Done]): "Refund and Cancellation" / "Customers who have participated in the takaful product through our website may request a refund or cancel their takaful coverage." / "Kindly refer to the intermediary or the Takaful Operator's Customer Service Unit (CSU) for further details."
7. **No. 7** "No marking up of takaful contribution or imposing any additional charges to financial consumers on the NDDP." — same breakdown box as No. 5.

## Requirements — product documents

1. **PDS EN:** footer "Product Disclosure Sheet V2 02-2026", "Date: 1 February 2026". **PDS BM:** "Helaian Penerangan Produk V2 02-2026", "Tarikh: 1 Februari 2026".
2. **Certificate Wording EN:** footer "STMAB/Takaful myMotor-Private Car/V2.0(E)/05-2026", "Page 2 of 40". **Sijil BM:** "STMAB/Takaful myMotor-Kereta Persendirian/V2.0(BM)/05-2026", "Halaman 2 daripada 41".
3. **PDS illustration (EN p.2):** "Total takaful contribution payable RM2,946.58"; "(+) 8% Service Tax RM217.52"; "(+) Stamp Duty RM10.00"; "Wakalah Fee ... 26% of total takaful contribution or RM706.96", of which "Commission 10% of total takaful contribution, or RM271.91". Illustration only — not an expected value for testing.
4. **Cancellation (PDS EN p.2):** "Upon cancellation, you are entitled to a pro-rated refund of the contribution provided you have not made any claim. There will be no cancellation fee."
5. **Cover types (Certificate Wording p.3):** "Comprehensive", "Third Party, Fire and Theft", "Third Party Only".

## New vs existing behaviour

1. **Existing:** STM not offered / not compliant on Secarang. `[Jira row 4]` Exact current state on staging not observed.
2. **New:** STM offered again, with the 7 checklist disclosures and the new PDS / certificate documents. `[Jira rows 3, 5 + attachments]`
3. **Checklist evidence looks like eAuto UCD screens, not Secarang** [unconfirmed]: the stepper reads "Quotes", "Optional Coverage", "Payment", "Confirm" and the breakdown has "10% Gross Contribution Discount" — both match the eAuto insurance flow in `knowledge/flow-zurich-takaful.md` §4b (Step 1-4 names; "Non-FI flow adds a **10% Gross Contribution Discount** line"). eAuto already did NDDP for STM in **EAINT-9215** (TS #095, 2025-12-04). So this ticket likely ports the same disclosures to Secarang [unconfirmed].
4. **Secarang wording today is "Premium"**: labels captured by automation are "Basic Premium, Premium After NCD, Gross Premium, Service Tax 8%, Stamp Duty, Total Premium". `[knowledge/flow-secarang-insurance.md §4.6]` Takaful cards will likely need "Contribution" wording [unconfirmed — no SRD].

## QA scope

1. **Est. mandays:** none (Jira blank; no Miro card found).
2. **Testing scope:** not defined. No SRD, no TS.
3. **Inferred check list** [unconfirmed until SRD]:
   1. STM card appears on Secarang quotation page (private car; other vehicle types unknown).
   2. NDDP items 1-7 visible on the Secarang STM flow, at the right step (No. 4 **before** final confirmation; No. 6 **on** the success page, not a link).
   3. PDS EN/BM and Certificate Wording EN/BM links open the new versions.
   4. Breakdown shows no mark-up vs insurer quote (No. 7).
   5. Purchase → CIBO record (every Secarang transaction lands in CIBO, `flow-secarang-insurance.md` §1 item 3).

## Affected regression areas

1. Secarang quotation page — **insurer sequence** (STM card re-added). `knowledge/flow-zurich-takaful.md` §2 item 4.
2. Secarang add-ons, Confirm and Pay, Fiuu payment, success page, receipt PDF. `knowledge/flow-secarang-insurance.md` §3.
3. e-Policy / confirmation email ZIP containing the PDS. `[business-rules-from-test-scenarios.md line 982-984, TS #135 EAINT-8786]`
4. CIBO Transaction Management / Payment Management / Payment Report for STM rows.
5. Other insurers' cards (Lonpac, Zurich, Tokio Marine) unchanged.
6. eAuto UCD insurance — only if the change is shared [unconfirmed].

## Test data / env needs

1. **Environment:** not named. Secarang hosts known: `staging.secarang.com/ia` and `/preprod`. `[flow-secarang-insurance.md §2]`
2. **Vehicle + real IC** that gets an STM quote. /ia quotes made-up plates HXA0001A-HXA0020A with IC 030217141005 (Lonpac tested). Whether STM quotes them is unknown. `[flow-secarang-insurance.md §7 items 15a, 16a]`
3. **STM eligibility rules** (car age, sum insured, postcode, Comprehensive vs TPFT) — unknown for Secarang.
4. Fiuu sandbox payment (FPX simulator / card 5200 0000 0000 1096 + OTP 123456). `[flow-secarang-insurance.md §7 item 19]`
5. CIBO login for record checks.

## Dependencies / related tickets

1. **ESI-328** — "Refer to source ticket ESI-328." `[Jira row 6]` Not read; not in repo.
2. **EAINT-9215** — "⚪[eAuto] To reflect NDDP changes for Syarikat Takaful Malaysia Am Berhad" (eAuto equivalent, TS #095). `[cr-test-scenario-catalogue.md line 432]`
3. **EAINT-9214** — "[eAuto] To change Insurance Control Sequence for Syarikat Takaful Malaysia Am Berhad" (TS #124).
4. **EAINT-8786** — "[Secarang] To update the latest PDS for Syarikat Takaful Malaysia" (TS #135) — prior Secarang PDS change; reuse its check points.
5. **EAINT-8608** — Secarang Zurich Takaful onboarding (Testing In 1st Env, QA = Faizuddin). `[flow-zurich-takaful.md §1]`
6. **EAINT-12175** — "[Secarang-Insurance] To Correct Insurer Name to Lonpac Insurance Bhd & Update SDPA Policy Wording Link" (opened same day). `[eAuto-Secarang-Main-Group.md line 207]`
7. **EAINT-9903** — " To update eAuto based on NDDPs Requirement for STM" (Done, created 2026-02-16). Empty description, no attachments. `[added 2026-10-27: Jira search text ~ "NDDP"; capture _reference/tickets/Studying/EAINT-9903/EAINT-9903-jira.md]`
8. **EAINT-9215 SRD V1.1 (20.11.2025) read 2026-10-27** — eAuto page map for the same NDDP items: Step 2 = distributor disclaimer; Step 3 = commission / PDS disclaimer "under the payment summary section"; Step 4 = "Refund and Cancellation"; Insurance Homepage logo popup = "Takaful Malaysia Contact Info"; Standard Plan Details = PDS + Certificate Wording (BM + EN). **eAuto precedent only — not a Secarang requirement.** Text copy: `_reference/tickets/Studying/EAINT-9215/SRD_EAINT-9215_eAuto_To_Reflect_NDDP_Changes_for_STMAB_V1.1_20112025-text.md`. Sub-task EAINT-9219 "Missing documents in TPFT for Takaful myMotor products" shows eAuto STM has a TPFT card.

## Teams decisions (verbatim)

Source: `_reference/teams/EAINT-12078-Secarang-NDDPs-for-STM.md`.

1. `[2026-08-17 14:31, BA]` "Hi Everyone, we will use this CR group for https://mfservices.atlassian.net/browse/EAINT-12078"
2. `[2026-08-17 14:32, BA]` "To update, I'm still in the midst of finalizing the Figma, once done will show to PO before sending to Takaful to review. Then only I will start on the SRD draft ya"
3. `[2026-10-26 15:06, Reporter]` "hiii Everyone, sorry forget to update that STM shared some information here ya / Goh Kai Jiaeh, need advise that this ticket who will be the dev pick up ya? / [image]"

## Open questions / risks for testing

1. **No SRD, no Figma in repo.** All requirements above come from the checklist and product documents only. Re-checked 2026-10-27 17:41 and again at the 7:51:34 pm capture: still 5 attachments, 0 comments, no SRD / Figma; no Miro link in `_reference/miro-links.txt`.
2. **"Resume" scope unknown** — why STM was paused, and on which vehicle types / cover types it resumes. Email 21.07.2026 and ESI-328 not available.
3. **Conflict with Zurich onboarding:** SRD 8608 says "**Zurich Takaful replaces Syarikat Takaful Malaysia**" yet its Secarang sequence still lists "STM Comp → STM TPFT". `[flow-zurich-takaful.md §2 items 1, 4]` This ticket resumes STM — confirm the final insurer sequence with STM and Zurich both live.
4. **Disclaimer distributor name:** checklist uses "Bintang Prospek is the authorized distributor of Takaful Malaysia". Zurich's line uses "Pemaju Eksklusif Sdn. Bhd." `[flow-zurich-takaful.md §2 item 2]` Confirm which name Secarang shows for STM.
5. **Service tax rate:** PDS says "(+) 8% Service Tax"; checklist screenshot RM136.37 on RM1,704.65 = 8%. The eAuto Zurich board formula says "Service Tax = Gross Contribution × 6%". `[flow-zurich-takaful.md §4b item 2.3]` Read the rate from the screen.
6. **"10% Gross Contribution Discount"** appears in the checklist evidence. Whether Secarang applies any discount for STM is unknown.
7. **BM PDS hotline mismatch inside the source document:** p.1 "1-300 88252 385", p.2 "Talian Unit Khidmat Pelanggan (CSU): 1-300 802525"; EN PDS both pages "1-300 88 252 385". Raise with BA if the page text copies the BM PDS.
8. **Unread image** in Teams 2026-10-26 ("STM shared some information") — may hold new requirements.
9. **Certificate Wording / Sijil** only partly read (4/40 and 2/41 pages). Only needed if the TS checks document content beyond version/footer.
10. **Ticket title naming trap:** "STM" will be confused with STMS / eSTM in this repo. Use "Takaful Malaysia" in TS and evidence names.

## Suggested test focus

1. **STM card on Secarang** — present, in the agreed sequence, correct insurer name and logo.
2. **NDDP items 1-7** — one TS per item; check exact text vs the BA's final wording; No. 4 shown before [Confirm and Pay]; No. 6 on the success page as text, not a link.
3. **Breakdown maths** — Contribution After NCD → Gross → Service Tax → Stamp Duty → Total; no extra charge (No. 7). Compare with the insurer's API quote [unconfirmed source of truth].
4. **Documents** — PDS EN "V2 02-2026", PDS BM "V2 02-2026", Certificate Wording "V2.0(E)/05-2026", Sijil "V2.0(BM)/05-2026" open from each link point used by EAINT-8786 (Step 2, Step 4 More Info, Confirm and Pay) and in the e-Policy email ZIP.
5. **End to end** — STM purchase with Fiuu (FPX + card), receipt PDF, CIBO record.
6. **Regression** — Lonpac / Zurich / Tokio Marine cards and purchase unchanged.
7. **Automation reuse** — `scripts/secarang-insurance` and `scripts/eauto-12107` already drive the full Secarang flow; an STM run needs only the insurer name plus new text assertions [unconfirmed — STM card `img alt` not captured].

## Existing repo knowledge / automation to reuse

1. `knowledge/flow-secarang-insurance.md` — full Secarang flow, selectors, Fiuu sandbox, traps.
2. `knowledge/flow-zurich-takaful.md` — Takaful wording, insurer sequence, eAuto step names.
3. `knowledge/business-rules-from-test-scenarios.md` lines 464-472 (EAINT-9215 wording, EAINT-8786 PDS) and 982-984 (Secarang PDS).
4. SharePoint TS #095 (EAINT-9215), #124 (EAINT-9214), #135 (EAINT-8786) — prior TS to model on. Paths in `knowledge/cr-test-scenario-catalogue.md` lines 432, 461, 472.
5. Automation: `scripts/secarang-insurance`, `scripts/eauto-12107`, dashboard `/eauto/12107`, `/eauto/secarang-plate-checker`.

## Knowledge candidates

1. **"STM" in Secarang-Insurance ticket titles = Syarikat Takaful Malaysia (STMAB)**, not STMS / eSTM. Source: EAINT-12078 attachments ("STMAB-PDS-Takaful-myMotor-...") and PDS EN p.1 "Syarikat Takaful Malaysia Am Berhad (Takaful Malaysia)". Target: `knowledge/eauto-insurance.md` or `knowledge/flow-secarang-insurance.md`.
2. **NDDP checklist — 7 disclosure items** (verbatim list above), signed 17/11/2025 and 05/12/2025. Source: "Distribution Of Takaful Products By Corporate Agents Via NDDP Monitoring Checklist (Bintang Prospek)", pp.1-3. Target: `knowledge/eauto-insurance.md`.
3. **Takaful Malaysia current document versions:** PDS "V2 02-2026" (EN/BM, dated 1 February 2026); Certificate Wording "V2.0(E)/05-2026" (40 pages); Sijil "V2.0(BM)/05-2026" (41 pages). Source: EAINT-12078 attachments, footers. Target: `knowledge/eauto-insurance.md`.
4. **Takaful Malaysia CSU hotline** "1-300 88 252 385"; Tele Bantuan "1800 888 788"; email "csu@takaful-malaysia.com.my". Source: PDS EN pp.1-2. Target: `knowledge/flow-secarang-insurance.md`.
5. **Takaful Malaysia Wakalah fee 26%, commission 10%** of total takaful contribution. Source: PDS EN p.2. Target: `knowledge/eauto-insurance.md`.
6. **EAINT-12078 status for `teams-decisions-by-ticket.md`:** 2026-10-26 reporter asked who the dev is; STM shared new info as an image. Source: Teams EAINT-12078, 2026-10-26 15:06.
