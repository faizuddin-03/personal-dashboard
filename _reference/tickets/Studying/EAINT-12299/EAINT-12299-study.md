# EAINT-12299 study (2026-10-26)

## 1. Header
1. **Title (Jira, verbatim):** "🔴🟣[eAuto-UCD & BackOffice] Rename Uploaded File with Chinese Characters upon Upload in Pre-Application & Application"
2. **Jira status:** **Code Review** (updated 2026-09-17 15:45 — no change since).
3. **Priority:** Medium. **Type:** Task. **Labels:** 260907-260911, ProductBacklog, September2026.
4. **QA (Jira cf[10041]):** **empty**. **Miro:** "QA:" blank.
5. **BA:** Lim Yi Link (Jira assignee + reporter; Miro "BA: Yi Link").
6. **Developer:** Jin Siang Boo (senior dev). `[from Teams, 2026-09-09 12:53, dev lead]` "Jin Siang Boo as discussed, you take this ticket"
7. **Deployment date:** **none set.** Miro column "READY FOR TESTING TICKETS" → group "PACKAGE - ENFORCE 12-CHAR PASSWORD"; "To deploy on:" blank. Jira fix version `[QA]Ready for Testing Tickets` (release date 2026-11-02).
8. **Test env:** Miro "Test Env:" blank. Jira description "Environment | Production" (= where the issue occurs). No staging branch named anywhere.
9. **Estimate:** Miro "Est. Testing Mandays: 4 days for 1 QA" — base 2 + buffer 2.

## 2. Sources read
1. **Jira EAINT-12299** via Atlassian MCP, 2026-10-26. 0 comments, 0 sub-tasks, **0 attachments**, 0 remote links. 1 link: relates to EAINT-12221 (Done).
2. **SRD:** **none exists** — no SRD attachment on Jira, no SRD table in description, no SRD mention in Teams. Requirement = Jira description + Teams chat.
3. **Jira EAINT-12221** (linked production patch) — description read.
4. **Miro card:** `EAINT-12299-miro-card.md`.
5. **Teams export** `_reference/teams/EAINT-12299-Rename-Chinese-Filenames.md` (full history, 2026-09-09 to 2026-09-17).
6. **Knowledge:** `knowledge/teams-decisions-by-ticket.md` § EAINT-12299; `lib/eautoFlows/modules/onboarding.ts` line 155; `knowledge/flow-ucd-onboarding.md` (upload selectors).
7. No repo ticket folder; no OneDrive folder.

## 3. What changes
1. **Portal / module (Jira):** "Affected Portal | eAuto"; "Affected Module | Pre-Application & Application". Title adds UCD & BackOffice.
2. **Request (Jira, verbatim):** "Rename the uploaded file immediately after upload in both Pre-Application and Application."
3. **Rename rule (Teams, BA):** Chinese → **Hanyu Pinyin**, e.g. "扫描全能王.pdf" → "sao miao quan neng wang.pdf".
4. **Extra (Teams, dev, 2026-09-17 11:13, verbatim):** "I include some extra handling on other language as well" — details in a claude.ai artifact (link redacted in export).
5. **Why (Jira "Existing Issue/Behaviour", verbatim):** "1. BackOffice is unable to edit any field after clicking \\[Create Account\\]. 2. This issue happens occasionally. 3. Root cause: UCD potentially uploaded a file with Chinese characters to Jira. 4. As per checking, there are plenty of users who uploaded files with Chinese characters."

## 4. New vs existing behaviour
1. **Existing:** file keeps its Chinese name; BO [Create Account] can then leave the record un-editable / "Hardcopy & Acc Created" stuck at "Pending Assignee" (EAINT-12221 prod patch, 2026-08-20).
2. **New (Jira, verbatim):** "Rename the file name on the spot after the user uploads the file, in both Pre-Application and Application."
3. `[inference]` Files with no Chinese characters keep their names; other non-Latin scripts follow the dev's "extra handling" (undocumented).

## 5. QA scope
1. **Miro (verbatim, key lines):**
   1. "Testing Scope: (Manual + Automation Testing)"
   2. "UCD Upload E2E Test Scenarios"; "Existing transaction"; "New transaction"
   3. Business types: "Sdn Bhd / Bhd", "Sole Prop / Partnership", "LLP", "Business Trading (Sabah)", "Business Trading (Sarawak)"
   4. "35 files per business type, total around 175 files"
   5. "Flows": "Pre-Application", "Application", "Registration Document"
   6. "Functional Test Scenarios": "Upload", "Download", "View"
   7. "Issue trigger point: Create Account button in BO"
2. **Jira:** Pre-Application + Application upload points only. Miro adds **Registration Document** (Application step 4).

## 6. Affected regression areas
1. **Every onboarding upload control** — Pre-App trading licence; Application step 2 (director IC, showroom photos/video, business card, stamp); step 4 Registration Documents (RHB offer letter, direct debit, BOD reso, bank statement, eAuto BOD reso, LHDN tax cert; Sole Prop LoA variants). Selectors in `knowledge/flow-ucd-onboarding.md` lines 275, 285, 466, 471.
2. **BackOffice** view / download of uploaded files; **[Create Account]** then edit account details.
3. Jira ticket creation from onboarding uploads (root cause names Jira). `[inference]` check attachment names on the generated ticket.
4. Existing records (uploaded before deploy) — Miro "Existing transaction".

## 7. Test data / env needs
1. Files with Chinese names in each type accepted (pdf, jpg, mp4). Miro: ~35 per business type, ~175 total.
2. Mixed names (Chinese + Latin + digits), other scripts (Tamil, Japanese, emoji) for the dev's "other language" handling. `[inference]`
3. Existing staging applications with Chinese-named files uploaded before the build (for "Existing transaction").
4. BO account able to [Create Account].
5. Staging branch — not named.

## 8. Dependencies / related tickets
1. **EAINT-12221** (prod patch, Done 2026-08-20) — origin case BAJET CAR AUTO NA68001091; source EAUTO-1037.
2. Miro packages it with **EAINT-12125, 12228, 12333** ("PACKAGE - ENFORCE 12-CHAR PASSWORD"). `[inference]` shared deploy, not shared function.

## 9. Teams decisions (verbatim, full history to 2026-09-17)
1. `[_reference/teams/EAINT-12299-Rename-Chinese-Filenames.md, 2026-09-09 12:58, dev]` "if lets say user uploaded \"扫描全能王.pdf\", what the expectation of the filename after rename ya?"
2. `[same, 2026-09-11 10:57, BA]` "we will translate Chinese to hanyupinyin which is \"sao miao quan neng wang.pdf\""
3. `[same, 2026-09-11 11:23, BA]` "requirement ya. confirmed with KJ that this requirement is doable."
4. `[same, 2026-09-17 10:42, dev]` "this ticket development is done ya, could let me know when to deploy to staging ya"
5. `[same, 2026-09-17 15:42, dev]` "ya, can deploy to staging anytime (code review done)"

## 10. Open questions / conflicts
1. **Rename format:** Jira "Rename file name format is still to be discussed." vs Teams 2026-09-11 Hanyu Pinyin. Jira never updated. Confirm Pinyin is final (spaces? tone marks? case?).
2. **No SRD, no QA assigned, no staging branch, no deploy date** — status still Code Review although dev said "code review done" on 2026-09-17.
3. **"Other language" handling:** rules only in a dev artifact (link redacted). Need the rules to write expected results.
4. **Scope gap:** Jira = Pre-Application & Application; Miro adds Registration Document and BO Download/View. Confirm BO side is in scope.
5. **Existing transactions:** are files uploaded before deploy renamed (migration) or left as-is? Miro lists "Existing transaction" without expected result.
6. **Duplicate names after rename** (two files mapping to the same Pinyin) — handling not stated. `[inference]`

## 11. Existing repo knowledge / automation to reuse
1. `knowledge/flow-ucd-onboarding.md` — upload selectors (Pre-App non-SSM trading licence; step 2; step 4 Registration Documents table row 15).
2. `scripts/eauto-preapp/`, `scripts/eauto-12153/` (full onboarding chain to step 4 + BO) — base for an upload E2E.
3. `scripts/eauto-onboarding/fixtures/uploads/` — upload fixtures (add Chinese-named copies).
4. `lib/eautoFlows/modules/onboarding.ts` — ticket list entry for EAINT-12299.
