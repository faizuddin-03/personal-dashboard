# EAINT-12431 — study (2026-10-26)

## 1. Header
1. **Title (Jira, verbatim):** 🔴[eAuto-UCD] To Send Email and WhatsApp Notifications to Car Owner for LKM Refund when UCD proceeding to Step 3 (Part 1)
2. **Type:** Task · **Component:** eAuto · **Labels:** 261005-261009, October2026, ProductBacklog
3. **Jira status:** **Ready for Prod Deployment** (updated 2026-10-23 21:09)
4. **Priority:** Medium
5. **QA (cf[10041]):** Charmain Ea Chiang · Miro card: "QA: Charmain"
6. **BA:** Lim Yi Link (reporter and current assignee) · Miro card: "BA: Yi Link"
7. **Dev:** Lim Xiwei `[from Teams EAINT-12431 group, 2026-10-06 15:29, dev lead: "Lim Xiwei please help on EAINT-(12431)"]`
8. **Fix version:** **S34.15-20261026 🌞** (release date 2026-10-26; version note "Main item(s): 1. LKM Refund - Morvin's Feedback")
9. **Deployment (Miro column):** **26TH OCT DEPLOYMENT** — matches fix version.
10. **Test env (Miro):** "Test Env: staging/uat4" · QA-Issue EAINT-12600 also tested on **staging/uat4**.
11. **Est. mandays (Miro):** "1 day (1 QA)" (0.5 base + 0.5 buffer).

## 2. Sources read
1. Jira EAINT-12431 (MCP, read 2026-10-26): description, SRD history table, attachments list, links, sub-task. **0 comments.**
2. Jira sub-task **EAINT-12600** (QA-Issue, Done) + its 1 comment.
3. Jira linked **EAINT-12329** (Part 2, To Do) description.
4. Miro card: `EAINT-12431-miro-card.md` (from `_miro-board-capture-2026-10-26.md` lines 34-59).
5. Teams: `_reference/teams/EAINT-12431-12329-12430-LKM-Refund-Notifications.md` (export ends **2026-10-16**).
6. Knowledge: `knowledge/teams-decisions-by-ticket.md` §EAINT-12430/12431/12329; `knowledge/flow-stms-addons.md` lines 48-51, 111, 122; `knowledge/cr-ledger.md` lines 899-900; `knowledge/releases.md` line 53.
7. Remote links: none.
8. **SRD: NOT retrieved.** MCP cannot download attachments; no local copy found (repo, OneDrive `eAuto Documents`, Downloads, Desktop searched). Drop-in needed:
   1. **`SRD_EAINT-12431_v1.0_20261023.pdf`** (attachment 160877, 262,618 bytes, 2026-10-23 12:47) — **latest**
   2. `SRD_EAINT-12431_v1.0_20261023.docx` (160878, same date)
   3. `LKM_Refund_STMS_Step2 Notication Template.docx` (160470, 2026-10-20) — template wording
   4. Older: v0.2_20261023.docx, v0.1_20261020.docx

## 3. What changes
1. **Portals (Jira #1, verbatim):** "a. eAuto – Used Car Dealer Portal (Web app) b. eAuto – Back Office User Portal"
2. **Module (Jira #2):** "LKM Refund – STMS Notification"
3. **Request (Jira #3, verbatim):** "**Part 1 of 2** Send email and WhatsApp notifications to the car owner on the availability of the LKM refund at Step 1."
4. **Expected (Jira #5, verbatim):** "The existing STMS process shall remain unchanged. The system shall send the following notification: **a. Availability of LKM refund** i. Recipient: Car owner ii. Trigger: Step 1 – UCD enters the owner's email iii. Method: Email, followed by WhatsApp with the same content **Languages:** a. Email – English, Bahasa Melayu and Chinese b. WhatsApp – English and Bahasa Melayu"
5. **Why:** owner gets no notice today. Jira #4: "The car owner does not receive any email or WhatsApp notification on the availability of the LKM refund."
6. **SRD version notes (Jira table, verbatim):** V0.2 23.10.2026 "a. Updated WhatsApp languages in Section 2.2.2 and 2.2.4. b. Added sender email in Section 2.2.4. c. Removed invalid scenario in Section 2.2.4. d. Added Ops confirmation on deployment in Section 2.2.1." · V1.0 23.10.2026 "Send out for external review".
7. **Channel:** WhatsApp via **MessageBird** `[Teams, 2026-10-07 16:41, PM: "for EAINT-12431, we will use messagebird as a decision at the moment"]`.

## 4. New vs existing behaviour
1. **Existing:** no owner email or WhatsApp about LKM refund availability.
2. **New:** one owner notification — **email first, then WhatsApp**, same content.
3. **Company category:** must **not** send (EAINT-12600 expected result: "LKM Refund is not offered for Company category transactions"). Fixed and PASS on staging/uat4, 2026-10-26.
4. **Unchanged:** STMS steps themselves ("The existing STMS process shall remain unchanged").

## 5. QA scope
1. **Miro card (verbatim):** "Testing Scope: (Manual + Automation Testing) - E2E Flow - STMS Individual - STMS Company (Phase 2??) - Email and WhatsApp - Notification - Reminder"
2. From Jira/SRD table:
   1. **Individual (MyKad / MyPR)** STMS → owner email received (EN / BM / CN) then WhatsApp (EN / BM).
   2. **Company** STMS → **no** email, **no** WhatsApp (EAINT-12600).
   3. **Sender email** (SRD v0.2 §2.2.4 "Added sender email") — value not known until SRD read.
   4. **Language selection rule** — not stated in Jira; needs SRD.
3. "Reminder" on Miro belongs to Part 2 (EAINT-12329: UCD document reminder) `[inference]`.

## 6. Affected regression areas
1. **STMS Step 1 → Step 4** for Individual and Company (trigger point).
2. **STMS Step 1 Perakuan / LKM refund email field** (`#sellerEmail` on preprod1, per `flow-stms-addons.md` line 29).
3. **Existing LKM Refund emails** (lkmrefund@eauto.my sender; EAINT-12420 previously caught systemtest@eauto.my).
4. **Other MessageBird WhatsApp** notifications (shared channel) `[inference]`.

## 7. Test data / env needs
1. **staging/uat4**; eSim STMS enquiry with LKM Refund Amount (≥ RM5 per existing rule, `flow-stms-addons.md` line 28).
2. Real inbox for owner email + real WhatsApp number on MessageBird staging `[inference — not confirmed in any source]`.
3. Fake emails use **@testingz.com** (house rule).
4. Individual + Company UCD logins.

## 8. Dependencies / related
1. **EAINT-12329** — Part 2 (Step 4 email + WhatsApp, UCD reminder), **To Do**, no QA, no fix version.
2. **EAINT-12600** — QA-Issue, Company sends LKM messages, **Done**.
3. **EAINT-12430** — LKM Refund Amount column, same CR group, prod 2026-10-08.
4. **EAINT-12572** — Insurance Cancellation owner awareness emails (similar pattern) `[from flow-stms-addons.md line 266]`.

## 9. Teams decisions (verbatim; file `_reference/teams/EAINT-12431-12329-12430-LKM-Refund-Notifications.md`)
1. **[2026-10-07 16:41] PM:** "for EAINT-12431, we will use messagebird as a decision at the moment"
2. **[2026-10-12 15:22] BA:** "as spoken for 12431, Ops side will come out with the flow and share to us by tomorrow ya."
3. **[2026-10-14 10:31] BA lead (Mei Jia Chee):** "for EAINT-12431 we will break it into 2 parts to proceed ya. Part 1 - Step 1 Email & Whatsapp; Part 2 - Step 4 Email & Whatsapp & the remaining item required. … Ops team would like to have the Part 1 ASAP."
4. **[2026-10-14 16:25] BA:** "we will use EAINT-12329 for Part 2: Step 4 Email & Whatsapp & the remaining item required ya."
5. **[2026-10-14 10:31] open:** "Jin Siang Boo, later need ur help to advise that whether email & whatsapp send out together or what is the handling ya." — no answer in export.
6. Export ends **2026-10-16**; newer chat not covered here.

## 10. Open questions / conflicts
1. **Trigger step conflict:**
   1. Jira title: "when UCD proceeding to **Step 3**".
   2. Jira #3 / #5: "at **Step 1**" / "Trigger: **Step 1** – UCD enters the owner's email".
   3. EAINT-12600 module: "Trigger **Step 3 to 4**"; steps "Proceed to Step 3 and click [Next] … reaches Step 4".
   4. Template file name: "LKM_Refund_STMS_**Step2** Notication Template.docx".
   5. Teams split: "Part 1 - **Step 1** Email & Whatsapp".
   6. **Needs SRD v1.0 §2.2 to settle.** As-built behaviour on uat4 = sent on Step 3 → 4 (per EAINT-12600) `[inference]`.
2. **Company:** Miro "STMS Company (Phase 2??)" vs EAINT-12600 "should NOT send". Jira wins for this deploy.
3. **Email/WhatsApp timing** (together or delayed) — open in Teams 2026-10-14, answer not seen.
4. **Eligibility condition** for sending: only when LKM amount ≥ RM5? permission on? KL/Selangor PTJ only? — not in Jira; needs SRD.
5. **SRD v1.0 "Send out for external review"** — whether external sign-off landed before 26 Oct deployment is not recorded.
6. `knowledge/flow-stms-addons.md` line 50 says "In Development" — stale; Jira now **Ready for Prod Deployment**.

## 11. Existing repo knowledge / automation to reuse
1. `knowledge/flow-stms-addons.md` — LKM Refund flow (Step 1 Perakuan, Step 5 pop-up, eSim amount).
2. `knowledge/esim.md` — eSim STMS enquiry LKM amount.
3. `scripts/eauto-estm/` + `app/eauto/estm/` — STMS run path to reach Step 4.
4. Azfar repo: `_reference/codebases/eauto-qa-azfar/cr/EAINT-104/LEDGER.md` (LKM Refund Phase 1 ledger).
5. Teams export path above.
