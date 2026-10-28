# People and roles (eAuto / Secarang / CIBO)

Who does what, as seen in Microsoft Teams up to 2026-10-15. Raw chats are in
`_reference/teams/`. Roles change often; check the date on each tag. §5 adds the
per-ticket QA/BA/dev names from Jira, Miro and Teams as of 2026-10-26.

Tag key:
1. `[from Teams <chat>, <YYYY-MM-DD HH:MM>, <person>]`: the fact is stated in that message.
2. `[inferred from Teams <chat>, <date range>]`: the role is read from repeated behaviour (who posts SRDs, who assigns devs), not from a statement. Treat these as leads to verify, the same as `[unconfirmed]`.

## 1. QA team

1. **May Chin Mei Theng**: QA Lead for the eAuto project. She asks QAs to pick up tickets, signs off leave and posts deployment plans.
   `[inferred from Teams eAuto QAs, 2026-08-03 to 2026-10-15]` The DM header calls her QA Lead. `[from Teams DM May Chin Mei Theng, 2026-06-15 onward]`
2. **Kasturi A/P Pannirselvam (Kas)**: QA Lead for the wider QA team (eAuto and MYI). She posts team-wide rules on MC, leave, AI sessions and the Playwright framework.
   `[from Teams ModeFair QA Automation Engineer Team, 2025-10-17 18:14, Kasturi]` "...affect productivity and overall team progress in eAuto & MYI"
3. **Charmain Ea Chiang**: Senior QA on eAuto. She sets the testing process, assigns staging branches and signs off most CRs.
   `[inferred from Teams eAuto QAs and CR groups, 2026-07 to 2026-10]`
4. **Siti Nur Azila Binti Mohamed (Azila)**: Senior QA on eAuto (insurance, recon, onboarding). `[inferred from Teams CR groups 12055, 12219, 12175, 2026-08 to 2026-10]`
5. **Muhammad Faizuddin Bin Bidi (Faiz)**: joined as Manual QA on the eAuto Project.
   `[from Teams ModeFair QA Automation Engineer Team, 2026-04-01 12:28, Kasturi]` "please welcome our new joiner Manual QA Muhammad Faizuddin Bin Bidi & Aliah Maisarah Binti Mohamadiah! Both of them will be joining eAuto Project"
6. **Amirul Azfar (Azfar)**: QA on eAuto. He was moved fully to eAuto Core with no Wholesale work. `[from Teams eAuto QAs, 2026-09-25, Charmain Ea Chiang]` He tested EAINT-12289 on uat4. `[from Teams EAINT-12289, 2026-09-17 11:17, Amirul Azfar]`
7. **Hui Xin**: QA. She handed EAINT-12119 to Lee An Qi on 2026-09-21. `[from Teams EAINT-12119, 2026-09-21]` She wrote the consolidate-branch flow for the automation repo. `[from Teams eAuto QAs, 2026-09-30]`
8. **Ahmad Na'im Hakimi** and **Lee An Qi**: QA Automation, joined 2026-09-02.
   `[from Teams ModeFair QA Automation Engineer Team, 2026-09-02 15:28, Kasturi]` "please welcome our new joiner - QA Automation Ahmad Na'im Hakimi & Lee An Qi"
9. **Maisarah Nuraliyaa Binti Masrom (Mai)**: Manual QA on eAuto from 2026-01-05. She left in August 2026.
   `[from Teams ModeFair QA Automation Engineer Team, 2026-01-05 11:48, May Chin]` `[from Teams eAuto QAs, 2026-08-07 18:46, May Chin]` (farewell to Mai and Aliah)
10. **Aliah Maisarah Binti Mohamadiah (Aliah)**: Manual QA, joined 2026-04-01 and left in August 2026. `[from Teams eAuto QAs, 2026-08-07 18:46, May Chin]`
11. **Chin Teck Yung**: QA. He left in August 2026. `[from Teams eAuto QAs, 2026-08-03 18:21, May Chin]` (farewell message)
12. **Nicholas Lim**: QA, seen on Wholesale and on EAINT-11864 before a QA was assigned. `[from Teams EAINT-11864, 2026-07-27]`

## 2. BA / SA

1. **Chee Mei Jia (MJ, Mei Jia Chee)**: BA/SA. She owns many eAuto Core, JomCheck, eDereg and logistics CRs, and posts the monthly deployment plans.
   `[inferred from Teams CR groups 12339, 12412, 12348, 12019, 12342, 2026-07 to 2026-10]`
   Ops escalations go to Izni or Mei Jia when no PL/BA joins a deployment. `[from Teams eAuto & Secarang Main Group, deployment session card]`
2. **Lim Yi Link (Yi Link)**: BA/SA on UCD, BackOffice, onboarding, password policy, Firefox migration and LKM refund tickets. `[inferred from Teams CR groups 12155, 12180, 12121, 12431, 8622, 2026-08 to 2026-10]`
3. **Batrisyia Hasanah Binti Nursyamsi**: BA on insurance, Secarang and Service Hub tickets. Her tickets went to Yi Link and Mei Jia around late September 2026.
   `[from Teams EAINT-12124, 2026-09-22 11:36, Kasheng Liew]` "may i ask who is taking over this ticket from Bastrisyia ya?"

## 3. Developers

1. **Tan Yi Fung**: dev lead. He assigns developers to CRs.
   `[from Teams EAINT-12299, 2026-09-09 12:53, Tan Yi Fung]` "Jin Siang Boo as discussed, you take this ticket" `[from Teams EAINT-12180, 2026-08-28 10:11, Tan Yi Fung]`
2. **Goh Kai Jiaeh (KJ)**: senior dev. He does prod patches and deploys, and handles gateway (Fiuu, RHB, MessageBird) questions. He is the JomCheck PIC from 2026-10-02.
   `[from Teams EAINT-12339, 2026-10-02 18:12, Goh Kai Jiaeh]` "Ya i'm the pic now."
3. **Jin Siang Boo (Brandon)**: senior dev. He works on staging data resets, APT, the JomCheck/RHB staging connections and eDereg. `[from Teams EAINT-12289, 2026-09-10 14:21, Jin Siang Boo]`
4. **Lim Xiwei (Tracey)**: dev. Her tickets include EAINT-12166, 12153/12259, 8622 and 12431. `[from Teams EAINT-8622, 2026-08-06, Tan Yi Fung]`
5. **Mong Guo Hao (Mong)**: dev. His tickets include EAINT-12171, 11759, 12257 and 12414. `[from Teams EAINT-11759, 2026-08-12 16:12, Goh Kai Jiaeh]`
6. **Leong Jin Chuen (JC)**: dev. His tickets include EAINT-12155, 11864 and 11934. `[from Teams EAINT-12155, 2026-08-11 12:07, Goh Kai Jiaeh]` "fyi JC will help on this ticket."
7. **Wong Zhan Choon**: dev. His tickets include EAINT-12167, 12121, 12123 and 12055. `[from Teams EAINT-12123, 2026-09-07 11:37, Tan Yi Fung]`
8. **Kasheng Liew (Shane)**: dev. His tickets include EAINT-12107, 12175, 12327, 12124, 12344, and 12028 from 2026-09-24. `[from Teams EAINT-12344, 2026-09-15 10:18, Tan Yi Fung]`
9. **Wei Ting Lim**: dev. He works on Wholesale, logistics (EAINT-12119) and eMOVE (EAINT-12019), and created the Deployment Notification group.
   `[from Teams EAINT-12019, 2026-10-11 21:47, Jin Siang Boo]` `[from Teams eAuto Deployment Notification, 2026-07-09 17:03]`
10. **Sia Zhong Tai**: dev on EAINT-12348. He has no prod or staging DB access.
    `[from Teams EAINT-12348, 2026-10-15 14:40, Sia Zhong Tai]` "this one need Jin Siang Boo help oh, i no access to both prod & staging db"
11. **Kuik Rui Luan**: dev. EAINT-12339 (JomCheck v2.0); briefly 12125. `[from Teams EAINT-12155, 2026-09-28 08:58, Kuik Rui Luan]`
12. **Wong Kar Kin**: dev. EAINT-12180/12253; he does merge-downs to staging. `[from Teams EAINT-12180, 2026-08-28 10:11, Tan Yi Fung]`
13. **Nur Izfarwiza Binti Mohd Talib (Izfa)**: dev on EAINT-12028, 12055 and 12019. Teams shows her as "Unknown User" in later threads. `[from Teams EAINT-12019, 2026-08-26 12:28, Tan Yi Fung]`
14. **Zhi Kiat**: dev. `[inferred from Teams eAuto & Secarang Main Group]`
15. **Way Hou Wong**: mobile app (eAuto App) owner. The app shares the web DB.
    `[from Teams EAINT-12155, 2026-09-02 11:53, Charmain Ea Chiang]` "the eAuto App will be sharing the same DB as the web version"

## 4. Management, Ops and others

1. **Nur Izni Binti Zurni (Izni)**: project lead (PL). She holds the `mfizni` super-admin account used for prod checks and payment resets.
   `[from Teams EAINT-12289, 2026-09-10 14:21, Jin Siang Boo]` "during prod deployment we need Izni account ya"
2. **Wen Ching Chua (WC)**: management. He runs the Friday AI session and grants Claude/Copilot accounts.
   `[from Teams ModeFair QA Automation Engineer Team, 2026-05-18 09:22, Kasturi]` "WC has started picking random names from the QA team for presentations"
3. **Nurul**: Ops requestor (eAuto Core, Service Hub, SSM). `[from Teams EAINT-12121, 2026-08-11 18:01, Yi Link Lim]` "confirmed with Nurul to have 10 min cooling down period"
4. **Shamini**: Ops requestor for Secarang, insurance and CIBO. She receives the Secarang failure WhatsApp alerts.
   `[from Teams EAINT-11759, 2026-09-14 10:05, Batrisyia]` "Cover note failed - Confirmed: Only send to Shamini"
5. **Ket Ming**: prod access holder. Only he could deploy EAINT-9615, and he granted the Google routing key permission for EAINT-12119.
   `[from Teams eAuto & Secarang Main Group, 2026-07-29]` `[from Teams EAINT-12119, 2026-10-13]`
6. **Kin Hang Aw**: designer (Figma) for Service Hub screens. `[from Teams EAINT-12167, 2026-08-21]`
7. **Fakrul**: IT support. `[inferred from Teams sidebar DM list]` He reported on the readiness of the new bizsupport@eauto.my mailbox for EAINT-12431.
   `[from Teams EAINT-12431, 2026-10-23 12:26, Yi Link Lim]` "According to Fakrul, new email "bizsupport@eauto.my" is not ready just yet."

## 5. Ticket assignments by source, 2026-10-26 (future-deployment tickets)

Who each source names as QA, BA or dev for the 25 tickets studied on 2026-10-26.
Sources: Jira fields read 2026-10-26 (QA = cf[10041]) `[from study <KEY>-study.md §1,
in _reference/tickets/Studying/<KEY>/]`; Miro card lines "QA:" / "BA:" on the "eAuto -
QA Resource Planning" board `[from _miro-board-capture-2026-10-26.md]`; Teams status
posts 16–26 Oct `[from <KEY>-teams-since-2026-10-16.md]`. Listed as each source states
them. Tickets where all sources name the same person are in item 4.

1. **QA: sources name different people**
   1. EAINT-12580: Jira QA "Muhammad Amirul Azfar"; Miro "QA: Azila"; Teams status post by Amirul Azfar `[from Teams eAuto QAs, 2026-10-26 09:24]`.
   2. EAINT-12253: Jira QA "Muhammad Amirul Azfar"; Miro "QA: May"; Teams: Amirul Azfar estimated and tested it (36/36) `[from Teams eAuto QAs, 2026-10-20 16:32 and 2026-10-23 19:30]`.
   3. EAINT-12099: Jira QA empty (Azfar set, then cleared, 2026-09-25); Miro "QA:" blank; Teams: Charmain drafting scope and estimate `[from Teams eAuto QAs, 2026-10-26 08:19]`.
   4. EAINT-12124 and EAINT-12333: Jira QA empty; Miro "QA:" blank; Teams: Charmain drafted scope and estimate `[from Teams eAuto QAs, 2026-10-22 20:10]`.
   5. EAINT-12125 and EAINT-12228: Jira QA empty; Miro "QA:" blank; Teams: in Siti Nur Azila's status posts (On Hold) from 16 to 21 Oct, then no longer listed `[from Teams eAuto QAs, 2026-10-16 08:27 to 2026-10-21 20:30]`.
   6. EAINT-12589: Jira QA empty; Miro "QA:" blank; Teams: Charmain said "no QA needed for 12589 ya" `[from Teams DM Charmain Ea Chiang, 2026-10-26 09:37]`.
   7. EAINT-12088: Jira QA "Charmain Ea Chiang" (set 2026-10-19); Miro "QA:" blank; the study file records the 2026-10-26 study as assigned to Faizuddin `[from study EAINT-12088-study.md §10 item 1]`.
2. **QA: Jira names a person, Miro card blank or unsure**
   1. EAINT-10108: Jira "Charmain Ea Chiang"; Miro "QA: Charmain?".
   2. EAINT-11179: Jira "Charmain Ea Chiang"; Miro blank; Teams status posts by Charmain.
   3. EAINT-12087: Jira "Charmain Ea Chiang"; Miro blank.
   4. EAINT-11868: Jira "Siti Nur Azila"; Miro blank; Teams status posts by Azila.
   5. EAINT-12121 and EAINT-12230: Jira "Muhammad Amirul Azfar Bin Kamarulazam"; Miro blank; Teams: Azfar estimated both `[from Teams eAuto QAs, 2026-10-20 14:14]`.
   6. EAINT-8767, EAINT-12123, EAINT-12299, EAINT-12348, EAINT-12019: Jira QA empty; Miro blank; no Teams QA post.
3. **BA / assignee / dev: sources differ**
   1. EAINT-12099: Jira BA "Batrisyia Hasanah + Chee Mei Jia", assignee Chee Mei Jia; Miro "BA: Mei Jia".
   2. EAINT-12123 and EAINT-12124: Jira reporter/BA Batrisyia Hasanah; Miro "BA:" blank. On 12124 the BA Lim Yi Link answered in Teams after 2026-09-22.
   3. EAINT-8767: Jira BA "Lim Yi Link"; Miro "BA:" blank.
   4. EAINT-12589: Miro "BA: Yi Link"; Jira BA field not set.
   5. EAINT-11179: Miro "BA:" blank; Jira reporter Chee Mei Jia; the CR group was opened by Yi Link Lim `[from Teams EAINT-11179, 2026-10-19 15:42]`.
   6. EAINT-12257: `cr-ledger.md` (from `lib/ticketStudies.ts`) gives assignee Chee Mei Jia; Jira on 2026-10-26 shows assignee Lim Yi Link.
   7. EAINT-12028: Jira Developer field "izfarwiza" (account removed); Jira assignee Shane (Kasheng Liew).
   8. EAINT-12153: dev named as Lim Xiwei in the 2026-09-02 split message; Mong Guo Hao deployed it to staging/obs `[from Teams EAINT-12153, 2026-10-22 14:41, Mong Guo Hao]`.
   9. LKM Refund Phase 2 (no Jira key found): Miro "QA: Charmain / Azila", "BA: MJ, Yi Link".
4. **Sources agree**
   1. EAINT-12431: Jira QA and Miro: Charmain; BA Yi Link.
   2. EAINT-12153, EAINT-12257: Jira QA and Miro: Faizuddin ("Faiz"); BA Yi Link.
   3. EAINT-12028: Jira QA and Miro: Faizuddin ("Faiz"); BA Chee Mei Jia ("MJ").
5. **Dev changes seen 16–26 Oct**
   1. EAINT-10108: dev lead Tan Yi Fung took it himself. `[from Teams EAINT-10108, 2026-10-20 09:56, Tan Yi Fung]` "i taking it up , will update if further assign"
   2. EAINT-12253: handed to Wong Zhan Choon (Jira Developer "zhan.choon"); Wong Kar Kin was dev until 2026-09-08. `[from Teams EAINT-12180, 2026-10-20 17:11, Tan Yi Fung]`
   3. EAINT-11868: Mong Guo Hao added to the CR group by Lim Xiwei (undated event). The study names Lim Xiwei as dev, from a Teams message of 2026-08-12 15:15: "development for EAINT-11868 has been completed".
   4. EAINT-12580 and EAINT-12589: Boo Jin Siang is reporter and assignee in Jira.

## Update 2026-10-27 from Charmain repo

Source: read-only clone `_reference/codebases/eauto-qa-charmain/` (commit
`0ab45d1`). Who owns which scripts: `script-inventory-team.md`.

1. **Charmain** — brief section "1. You": "Name | Charmain Chin", "Team / squad |
   eAuto QA", contact "charmainec@modefair.com, or the eAuto QAs Teams chat".
   `[charmain-repo: intake/briefs/charmain.md:17-19]`
   Conflict (name): this file and Teams use "Charmain Ea Chiang" (item 3). Likely
   the same person (same email prefix, same role); the full name form is not
   settled.
2. Charmain owns `github.com/modefair/eauto-qa-charmain` (private); "Hui Xin has
   read". `[charmain-repo: intake/briefs/charmain.md:25-28]` She runs the team
   consolidation repo branch `consolidate-charmain` (`modefair/eauto-qa-gpt`).
3. Her automation spans EAINT-11982, 12054, 12131, 12155, 104, 639, 10960 / 11880,
   12126, 12175, 8622, plus BO audit and test-data tools, written "between April
   and September 2026" (12175 and 8622 in October). `[charmain-repo: intake/briefs/charmain.md:30]`
   `[charmain-repo: intake/sources.yaml:219-240]`
4. **Azfar** — repo owner of `modefair/eauto-qa-azfar` ("amirul.azfar@modefair.com").
   `[charmain-repo: intake/sources.yaml:46]`
5. **May (QA Lead)** — decision row 4: "May said no internal tools, but the repo
   took `tools/insurance-quote-checker` and PRs #10 and #11". `[charmain-repo: intake/reports/charmain-decisions.md:25]`
   Whether tools belong in the team repo is still open at last sight (2026-10-13).
