# EAINT-12580 — related history (2026-10-27)

## Header
1. **Module / portal:** UCD Portal › STMS › Step 5 › **Insurance Cancellation pop-up** › **Copy of IC** upload, AI check and **front / back IC split** sent to Runnerku. Source: Scout study §3 #1-2, §3 #8 ("the changes is only on step-5 ai checking for ic").
2. **Past tickets kept:** **2** (EAINT-12022, EAINT-104).
3. **Own official TS:** **none** in the QA Team folder (per task brief). No 12580 TS anywhere in the repo.
4. **Ranked candidates:** all **10 dropped**. None mention Insurance Cancellation, Copy of IC, IC split, LKM Refund or STMS Step 5. They are name-only matches on "insurance" / "module" (campaign popups, quotation, Free Quote, BO quote listing, Service Portal UI).
5. **Where past testing lives:** not in the SharePoint QA Team mirror. It is in the other QA's repo copy `_reference/codebases/eauto-qa-azfar/cr/EAINT-12022/` (scenarios + run results) [read-only copy].

## Related past tickets
1. **EAINT-12022** — "🔴[eAuto-UCD] STMS - Insurance Cancellation (MyKad & MyPR)" (Jira capture link, `EAINT-12580-jira.md` row 8).
   1. **Workbook / TS source:** `_reference/codebases/eauto-qa-azfar/cr/EAINT-12022/01-intake/scenarios.yaml`, sheet **"4 AI Check & IC Split"** (prefix `IC_AI_TS`). The SharePoint .xlsx itself is not in the repo.
   2. **Results:** `_reference/codebases/eauto-qa-azfar/cr/EAINT-12022/azila/azila-results.json`, `azila/STATUS-azila.md`.
   3. **Why related:** **parent feature**. Built the Copy of IC upload, AI check and the front / back split that 12580 fixes. Linked "Relates" in Jira.
2. **EAINT-104** — "⚫[eAuto-UCD] STMS - LKM Refund (MyKad & MyPR & Company)" (`cr/EAINT-104/LEDGER.md` row "Ticket").
   1. **Workbook / TS source:** team workbook not in the repo. Summary only: `_reference/codebases/eauto-qa-azfar/cr/EAINT-104/LEDGER.md`; Miro AI matrix t50 quoted in `cr/EAINT-12022/01-research/miro-lkm-style.md`.
   2. **Why related:** same Step 5 **Copy of IC upload + AI check** (LKM Refund pop-up). 12022 copied its AI document cases ("document kinds from the LKM Refund AI tests (Miro t50 AI_IC_TS1)", `scenarios.yaml` line 5965). Whether LKM Refund also uses the split API is **[unconfirmed]** (Scout study §6 #3).
3. **Linked tickets with no past TS in the repo:** EAINT-12647 (sub-task, MyTentera swap), EAINT-12585 (reuse documents LKM ↔ IC, To Do), EAINT-12626, EAINT-12589 (Balance % column; different area). No TS found for these.

## What was tested before
1. **EAINT-12022 — sheet "4 AI Check & IC Split", section "IC front / back split"** (`scenarios.yaml`):
   1. **IC_AI_TS12** — "One image with the front above the back: split into two" (line 6694). Result: **PASS** 10.10 — "judged 10.10 from her eSim download M190005_copy_of_ic.pdf: page 1 front only, page 2 back only, readable" (`STATUS-azila.md` line 133).
   2. **IC_AI_TS13** — "PDF with front on page 1 and back on page 2: split into two" (line 6749). Result: probe recorded verdict "CHECK" (`03-spec/probes-1210/_tmp-1210e-ai.spec.ts` line 56). Final verdict not found.
   3. **IC_AI_TS14** — "One image with front and back side by side: split into two" (line 6804). Result: PASS flagged in rerun audit — "evidence does not prove the PASS, no video" (`02-plan/RERUN-1610.md` line 108).
   4. **IC_AI_TS15** — "Phone photo, rotated and slightly tilted: split into two" (line 6859). Result: **NOT RUN** — "robot could not finish: the details form did not open" (`azila-results.json` line 4943).
   5. **IC_AI_TS16** — "MyPR card, front above back: split into two" (line 6914). Result not found.
   6. **IC_AI_TS17** — "Front only uploaded (no back)" (line 6970). Expected left blank (`expected: ''`, line 6988). Observed 10.10: "the pop-up stayed open with \"Copy of IC: both the front and back of the IC must be visible in one file. Please upload a clearer copy.\"" (`azila-results.json` line 4880).
   7. **IC_AI_TS18** — "IC split tested directly on the split API with several IC uploads" (line 7025). Expected: "Ensure for each file the IC comes back split into two images: one with only the front, one with only the back, both readable" (line 7035). Not run: "IC_AI_TS18 is NOT here: the IC split test page link and…" (`03-spec/rerecord-1510/_tmp-1510-rr-rpt.spec.ts` line 6).
2. **EAINT-12022 — same sheet, AI document cases that touch the Copy of IC:**
   1. **IC_AI_TS19** — "Copy of IC: clear scanned black-and-white PDF (front and back on one page)" (line 5952). **PASS** on rerun mv27cc12 (`STATUS-azila.md` line 133).
   2. **IC_AI_TS20** — "Copy of IC: phone photo, colour, slightly blurred" (line 5995). **PASS** — "the document preview opened with \"Verification Success\"" (`azila-results.json` line 4901).
   3. **IC_AI_TS21** — "Copy of IC: phone photo with flash glare on the IC number" (line 6038). **PASS** on MK1201K (`STATUS-azila.md` line 133).
   4. **IC_AI_TS22** — "Copy of IC: back side only" (line 6081). **FAIL** (wording) (`STATUS-azila.md` line 132).
   5. **IC_AI_TS23** — "Copy of IC: cropped, IC number cut off" (line 6124). **NOT RUN** — "my file lacked the back" (`STATUS-azila.md` line 132).
   6. **IC_AI_TS24** — "Copy of IC: unreadable (very dark / low resolution)" (line 6167). **FAIL** (wording) (`STATUS-azila.md` line 132).
   7. **IC_AI_TS8** — "A bank statement uploaded in the Copy of IC slot" (line 5805).
3. **EAINT-104 — LKM Refund AI matrix (Miro t50):**
   1. **AI_IC_TS3** — "Upload a copy of IC captured via phone with flash reflection (glare on NRIC)" → "1 page (Front / Back)" → "JPG" → "Name extracted correctly / NRIC extracted correctly" → "PASS" (`miro-lkm-style.md` line 285).
   2. Family count: "LKM_RIP_GL / AI_IC / AI_BS | AI document validation | 40 / 6 / 7" (`cr/EAINT-104/LEDGER.md` line 37). Other AI_IC rows not in the repo.

## Reusable scenarios
1. **IC_AI_TS12, TS13, TS14, TS15, TS16** (EAINT-12022) — reuse as the **positive split set**. Change the check from "reaches Runnerku" to 12580's "open the saved Front IC and Back IC and check they show the real card" (Jira, Reference for QA).
2. **IC_AI_TS17** (front only) and **IC_AI_TS22** (back only) — reuse as **reject cases**. Expected now known: "Copy of IC: both the front and back of the IC must be visible in one file. Please upload a clearer copy." (Jira 12580, Expected result).
3. **IC_AI_TS18** (split API direct) — reuse to run the **watermark, table photo, sideways photocopy and MyTentera** files on the API without a charged AI check per STMS [unconfirmed: API access still open, OQ61].
4. **IC_AI_TS19, TS20, TS21, TS24** — reuse as **regression** that normal scans / photos still pass the AI check after the fix.
5. **New, no past TS:** watermarked PDF ("For proton use only"), card photographed on a table, sideways photocopy (Jira 12580 description), MyTentera back-above-front (EAINT-12647 summary).
6. **Steps template** to copy (IC_AI_TS12, lines 6727-6730): "1. UCD > STMS > Create STMS > Individual. Complete Step 1 to Step 4 (seller thumbprint, JPJ enquiry OK)  2. At Step 5 tick Insurance Cancellation  3. Upload the Copy of IC in the shape described, fill the rest validly, tick the declaration, click [Next]  4. eSim > Runnerku: open the case created for this transaction at [Next] and view the front IC and back IC images it received".

## Known traps
1. **eSim may not show the split images.** "eSim keeps no IC images: its Runnerku Case pages list the documents by type (front_ic, back_ic, ...) with a review status, never the image. Only Runnerku / Dev can show the two images." (`03-spec/rerun-1610/rerun-1610-c2.spec.ts` lines 32-34). **Conflict:** IC_AI_TS12 was judged from "her eSim download M190005_copy_of_ic.pdf" (`STATUS-azila.md` line 133). Where to view Front IC / Back IC stays open (Scout study §10 #2).
2. **Every [Next] is a charged real AI call.** "AI: Dev connects /preprod1 to the real AI before running this TS … Each AI check is charged: do not repeat uploads in a loop" (`scenarios.yaml` line 6700). Also: "AI document check is real since 07.10.2026 and charged per use" (`knowledge/flow-stms-addons.md` line 294).
3. **One accepted check locks the draft.** "after an accepted check the draft reopens the saved preview on every tick (also after reload and Resubmit) - each needs a fresh draft" (`STATUS-azila.md` line 132). Raised as EAINT-12472.
4. **5MB limit drops the file silently.** "the greyscale scan was 12MB (>5MB limit), the pop-up dropped it (\"No file selected\"), so the AI never judged it" (`STATUS-azila.md` line 133).
5. **The 12580 reject message already existed on 10.10.** TS22 / TS24 showed "'Copy of IC: both the front and back of the IC must be visible in one file...' instead of 'Your copy of IC could not be validated...', for the BA" (`STATUS-azila.md` line 132). So seeing this message alone does not prove the 12580 fix [unconfirmed inference].
6. **Two IC messages exist.** AI mismatch message: "Your copy of IC could not be validated. Kindly review the file and reupload a valid version." (`03-spec/rerun-1610/rerun-1610-c5.spec.ts` line 77). Split reject message: as in #5. Check which one each case must show.
7. **Split is not in the SRD.** "OQ12: the IC front / back split is not in SRD v1.0: add it to the SRD, incl. what the UCD sees when only one side is uploaded or the split fails" (`scenarios.yaml` line 6997).
8. **Split API needs the test network.** "IC split service: internal `http://172.30.202.23:8000` … so it needs the VPN like eSim (Teams 08.09)" (`cr/EAINT-12022/01-research/study.md` line 376).
9. **Real ID documents.** Test files are real seller IC copies; "plus the real seller documents (never in the repo; the AI check is real)" (`rerun-1610-c2.spec.ts` line 38).

## Past QA-Issues mentioned
1. **EAINT-12480** — "[eAuto - UCD] STMS Step 5 Insurance Cancellation Pop-up - Copy of IC sent to Runnerku is split into front and back, but each card is stretched to the full A4 width (about twice the real card size)" — On Hold, Low (`cr/EAINT-12022/azila/README.md` line 35). Same split output as 12580.
2. **EAINT-12472** — "[eAuto - UCD] STMS Step 5 Insurance Cancellation Add-on - After the documents pass the AI check, ticking the add-on again opens the old Document Preview instead of the details pop-up, so the bank details and documents cannot be changed" — Code Review, High (`azila/README.md` line 27). Blocks re-running AI TS on one draft.
3. **IC_AI_TS6 candidate** — "FAIL TS6 (both documents wrong -> only the Copy of IC message: candidate QA-Issue)" (`STATUS-azila.md` line 132). Key not found.
4. **TS22 / TS24 wording** — sent "for the BA" (`STATUS-azila.md` line 132). No key found.
5. **EAINT-104:** "About 100 defects, Feb–Sep 2026. Main areas: document PDFs, AI false-passes, …" (`cr/EAINT-104/LEDGER.md` line 29). Keys not listed.

## Sources read
1. `_reference/tickets/Studying/EAINT-12580/EAINT-12580-study.md`
2. `_reference/tickets/Studying/EAINT-12580/EAINT-12580-jira.md`
3. `_reference/sharepoint/qa-team-ts/` — all 10 text copies searched for "Insurance Cancellation", "Copy of IC", "Front IC", "STMS", "LKM Refund", "watermark", linked keys. No relevant hit. `INDEX.md` does not exist.
4. `_reference/tickets/*/*-qa-team-ts-study.md` — none exist.
5. `knowledge/flow-stms-addons.md` lines 225-330; `knowledge/cr-test-scenario-catalogue.md` (only EAINT-104 test-data folder note, line 49).
6. `_reference/codebases/eauto-qa-azfar/cr/EAINT-12022/01-intake/scenarios.yaml` lines 190-220, 5417-7060.
7. `_reference/codebases/eauto-qa-azfar/cr/EAINT-12022/azila/azila-results.json` lines 4865-5025; `azila/STATUS-azila.md` lines 128-134; `azila/README.md` (grep).
8. `_reference/codebases/eauto-qa-azfar/cr/EAINT-12022/02-plan/RERUN-1610.md` lines 95-112; `01-research/study.md` (grep); `01-research/miro-lkm-style.md` lines 278-289; `03-spec/` probe headers (grep).
9. `_reference/codebases/eauto-qa-azfar/cr/EAINT-104/LEDGER.md` lines 1-60.
