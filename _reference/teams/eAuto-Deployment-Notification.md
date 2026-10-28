<!-- Source: Teams group chat "eAuto Deployment Notification" (eAuto - Internal section). Captured 2026-10-16 (read-only sweep). Times MYT.
     Full history: chat starts 2026-07-09 17:03 ("Wei Ting Lim added Unknown User and 29 others to the chat"); 951 messages to 2026-10-16.
     Content is almost entirely automated Workflows cards posted by the GitLab CI pipeline ("Wei Ting Lim used a Workflow template";
     the prod-sync cards by "Goh Kai Jiaeh used a Workflow template"). Card format: "Staging deploy started|succeeded|failed —
     staging/<branch> Project eAuto Branch staging/<branch> Commit <sha> Pipeline #<n> Deploying staging/<branch>.war to staging Tomcat".
     TRIMMED to a per-day table: "started" cards dropped (each is followed by a succeeded/failed card); each entry is
     "<HH:MM> <branch>" for a succeeded deploy and "<branch> FAILED" for a failed one; branch prefix "staging/" removed; every card is Project eAuto.
     The four non-routine cards (prod sync summaries) are kept verbatim below. -->
# eAuto Deployment Notification

## Prod-sync summary cards (verbatim)

[2026-10-06 17:25] Workflows (Goh Kai Jiaeh template): 🔀 Prod sync to staging completed. Project eAuto. Source prod/master 8bc6f404 (EAINT-12339). Merged staging/eauto !4797, preprod1 !4792, sit3 !4793, uat1 !4794, uat3 !4795, uat4 !4796. Up to date staging/sit2, staging/sit4. Deploys: All 6 CI/CD pipelines succeeded (#16861-#16866). All merges were clean. Please pull the latest before pushing to these branches.

[2026-10-07 18:26] Workflows (Goh Kai Jiaeh template): 🔀 Prod sync to staging completed - 1 deploy pipeline failed. Project eAuto. Source prod/master f0ebe44091 (EAINT-12438 LKM Refund poster v3). Merged staging/eauto !4808, staging/preprod1 !4809, staging/sit2 !4810, staging/sit3 !4811, staging/sit4 !4812, staging/uat1 !4813, staging/uat3 !4814, staging/uat4 !4815. Deploys 7 of 8 succeeded (#16882, #16883, #16884 after retry, #16886–#16889). FAILED: staging/sit3 #16885: build OK, but the Tomcat undeploy of sit3 timed out (3 attempts). All merges were clean. sit2 deployed after a retry. sit3's deploy keeps timing out while Tomcat undeploys the old sit3 app, so SIT3 is still on the previous build; the staging server is being checked. Please pull the latest before pushing to these branches.

[2026-10-07 18:57] Workflows (Goh Kai Jiaeh template): ✅ SIT3 deployed - prod sync to staging now complete. Project eAuto. Branch staging/sit3. Pipeline #16890 succeeded (deploy job 30057, health check /sit3/public/login/ 200 OK). Includes prod/master f0ebe44091 (EAINT-12438 LKM Refund poster v3) + EAINT-8606 (!4816). Following up on the earlier card: SIT3 is now on the latest build. The failed deploys were caused by a stale sit3 app folder left on the staging Tomcat after a restart; it has been cleared. All 8 staging environments are now up to date.

[2026-10-08 15:54] Workflows (Goh Kai Jiaeh template): 🔀 Prod sync to staging completed. Project eAuto. Source prod/master 224f519832 (LKM Refund Amount column on LKM Refund Status listing). Merged staging/eauto !4824, staging/preprod1 !4825, staging/sit2 !4826, staging/sit3 !4827, staging/sit4 !4828, staging/uat3 !4829, staging/uat4 !4830. Deploys: All 7 CI/CD pipelines succeeded (#16935-#16941). All merges were clean. Please pull the latest before pushing to these branches.

## Per-day deploy log (succeeded unless marked FAILED)

2026-07-09: 17:04 sit4, 18:16 sit4, 18:18 sit2
2026-07-10: 15:03 sit2, 15:18 uat1, 16:36 sit4, 16:38 sit2, 16:59 uat1, 23:37 uat1
2026-07-11: 17:30 sit2, 17:50 sit2, 17:52 sit2
2026-07-13: 09:22 sit3 FAILED, 10:13 sit2, 10:21 sit4, 10:53 sit4, 11:54 uat1, 11:57 sit4
2026-07-14: 10:58 sit2, 11:03 sit4, 15:48 uat1, 15:58 uat1
2026-07-15: 10:32 uat1
2026-07-16: 10:04 sit2, 11:01 uat1, 11:18 sit2, 17:01 eauto, 17:03 sit3, 17:06 uat3, 17:08 sit4, 18:00 uat1
2026-07-17: 09:30 uat1, 09:46 sit4, 09:52 sit2, 10:33 uat1, 10:37 sit2, 11:24 uat1, 11:30 sit2, 11:37 uat4 FAILED, 12:23 uat4, 14:21 preprod1, 15:14 uat4, 17:02 uat1, 17:05 sit2, 17:12 uat4, 17:22 uat4, 18:19 sit2, 18:21 sit4
2026-07-20: 10:31 uat1, 10:34 sit2, 11:50 uat1, 16:02 uat4, 21:19 uat1, 21:22 sit2
2026-07-21: 09:35 uat1, 09:40 sit2, 09:42 sit4, 10:08 uat1, 11:13 sit2, 11:43 sit2, 14:53 uat1, 15:04 eauto, 15:06 preprod1, 15:08 sit3, 15:10 sit4, 15:13 uat3, 15:15 uat4, 15:17 sit2, 15:38 sit2
2026-07-22: 14:19 eauto, 14:21 preprod1, 14:24 sit3, 14:26 uat1, 14:57 uat3, 14:59 sit4, 15:01 uat4, 15:20 uat1, 15:31 sit2, 15:33 sit4
2026-07-23: 09:19 uat1, 16:52 uat1, 17:14 uat1
2026-07-24: 10:35 uat1, 16:17 uat1, 23:23 uat1
2026-07-25: 11:53 sit2, 11:59 uat1
2026-07-26: 22:35 sit2
2026-07-27: 11:07 sit2, 14:26 sit2, 14:51 sit2, 15:51 sit2, 16:43 eauto, 17:07 eauto, 17:39 sit2, 18:40 sit2, 21:36 sit2
2026-07-28: 14:43 sit3, 14:45 eauto, 14:47 uat1, 14:49 uat3, 14:51 sit4, 15:14 uat4, 15:16 uat1, 15:19 preprod1, 15:52 uat1
2026-07-29: 07:10 uat4, 12:07 uat1, 14:26 eauto, 14:28 preprod1, 14:30 sit2, 14:32 sit3, 14:34 uat1, 14:36 uat3, 14:38 sit4, 15:43 uat1, 15:45 uat4, 15:55 uat4, 16:04 uat4, 16:32 uat1, 17:09 uat4, 17:18 uat4, 21:55 uat4, 22:26 uat4
2026-07-30: 12:39 eauto, 12:40 preprod1, 12:42 sit2, 12:44 uat1, 12:46 uat3, 12:48 sit4, 12:50 uat4, 12:56 uat1, 12:58 uat4, 13:05 uat1, 13:19 sit3, 13:33 uat4, 16:09 uat4, 16:46 uat4, 16:59 uat1
2026-07-31: 16:41 eauto, 16:43 sit2, 16:45 sit3, 16:47 uat1, 16:49 sit4, 16:51 uat4, 17:24 uat1
2026-08-01: 08:21 uat1, 08:44 uat1, 08:45 uat1
2026-08-02: 10:23 uat1, 11:09 uat1 FAILED, 11:11 uat1, 12:07 uat1
2026-08-03: 09:19 uat4, 12:00 uat4, 12:37 uat4
2026-08-04: 11:53 uat3, 14:27 uat3, 14:29 preprod1, 14:39 eauto, 14:41 sit2, 14:43 uat1, 14:45 sit4, 14:46 uat4, 14:51 sit3, 15:21 uat4, 17:55 uat4, 18:13 uat4, 22:52 uat3
2026-08-05: 09:15 uat4, 11:28 uat4, 14:07 uat4, 17:29 eauto, 17:43 uat3
2026-08-06: 10:25 uat1, 15:39 uat4, 16:03 uat4, 18:12 eauto
2026-08-07: 16:50 eauto, 16:52 preprod1, 16:54 sit2, 16:56 sit3, 16:58 sit4, 17:00 uat1, 17:02 uat4, 17:04 uat3
2026-08-10: 11:17 uat1
2026-08-11: 11:22 uat1, 12:21 sit4, 12:24 eauto
2026-08-12: 09:20 uat4, 12:54 uat4, 12:58 uat4
2026-08-13: 14:38 eauto, 14:40 preprod1, 14:42 sit3, 14:43 sit2, 14:45 sit4, 14:47 uat3, 14:49 uat4, 15:14 uat4, 15:29 uat4
2026-08-14: 09:27 uat1, 12:04 uat3, 12:07 uat3, 12:31 uat3, 12:33 uat1, 14:18 uat4
2026-08-15: 10:05 uat1
2026-08-17: 12:20 uat1, 12:39 uat1, 18:01 uat4
2026-08-18: 10:04 uat1, 14:25 eauto, 14:27 preprod1, 14:29 sit4, 15:08 sit2, 15:10 uat1, 15:11 sit3, 15:13 uat3
2026-08-19: 16:32 preprod1
2026-08-20: 14:14 eauto, 14:16 sit2, 14:18 preprod1, 14:20 sit3, 14:22 uat4, 14:24 sit4, 14:52 uat3, 14:54 uat3
2026-08-21: 12:07 uat1
2026-08-30: 22:18 chubb, 22:55 chubb, 23:18 chubb, 23:21 chubb, 23:22 tokiomarine, 23:24 lonpac, 23:26 chubb, 23:28 lonpac, 23:30 tokiomarine  (cards read "staging/chubb", "staging/lonpac", "staging/tokiomarine", Project eAuto)
2026-08-31: 21:46 uat1
2026-09-02: 10:27 uat4, 10:52 uat1, 11:04 preprod1, 11:26 uat1, 11:34 uat1, 12:19 uat1, 13:02 sit4
2026-09-03: 16:25 uat1, 16:48 uat4, 22:39 eauto, 23:08 eauto
2026-09-04: 15:58 uat1, 18:25 uat1
2026-09-07: 09:28 sit2, 11:59 uat3, 12:44 uat1, 13:24 uat1, 17:35 uat1, 22:07 uat1
2026-09-08: 12:23 eauto, 12:25 preprod1, 12:27 sit2, 12:29 sit3, 12:31 sit4, 12:33 uat1, 12:35 uat3, 12:43 uat4
2026-09-09: 16:04 uat1, 17:00 uat1, 17:01 uat1
2026-09-10: 11:59 uat1, 14:22 eauto, 14:23 preprod1, 14:25 sit2, 14:27 sit3, 14:29 sit4, 14:31 uat4, 14:33 uat3, 15:24 uat1, 15:45 uat1, 16:24 uat1, 22:41 eauto
2026-09-11: 09:09 uat3, 11:08 eauto, 17:52 uat4, 22:17 uat1
2026-09-13: 21:23 uat3, 21:30 uat3
2026-09-14: 13:54 sit4, 14:46 sit4, 18:02 uat1
2026-09-15: 07:51 uat1, 14:26 uat4, 14:48 uat4, 14:52 eauto, 14:54 sit2, 14:56 sit3, 14:58 uat3, 15:00 sit4, 15:02 preprod1, 16:12 uat1
2026-09-17: 10:29 sit2, 14:40 uat1, 16:25 sit4, 18:05 uat1
2026-09-18: 10:16 sit4, 14:07 sit4, 16:23 eauto, 16:25 sit3, 16:27 sit2, 16:30 sit4, 16:31 uat1, 16:34 uat3, 16:36 preprod1, 17:38 preprod1, 21:42 sit4
2026-09-20: 22:08 sit4, 22:49 sit4
2026-09-21: 14:30 sit4, 14:42 eauto, 14:44 sit2, 14:46 preprod1, 14:58 sit3, 15:00 sit4, 15:02 uat1, 15:04 uat3, 16:27 uat3, 16:29 uat3, 16:31 sit4, 21:43 uat3
2026-09-22: 09:31 sit4, 12:50 eauto, 12:58 eauto, 13:01 uat1, 22:56 sit4
2026-09-23: 09:13 uat1 FAILED (job maven-package-qa-staging), 09:25 uat1, 09:41 preprod1, 13:02 uat1, 13:57 sit4, 17:16 preprod1
2026-09-24: 09:03 sit4, 14:43 preprod1, 14:49 sit4, 16:31 preprod1, 22:35 preprod1
2026-09-25: 09:38 preprod1, 14:23 uat1, 15:27 uat1, 23:19 uat1
2026-09-27: 15:15 preprod1, 21:17 preprod1
2026-09-28: 11:46 preprod1, 14:38 preprod1, 14:40 sit2, 14:42 sit3, 14:44 uat1, 14:46 sit4, 14:48 uat3, 14:51 uat4, 15:39 eauto, 17:08 uat4
2026-09-29: 11:04 uat1
2026-09-30: 10:46 sit1, 11:15 uat3, 11:17 uat3, 11:28 preprod1, 14:32 sit1, 15:34 uat3
2026-10-01: 08:17 preprod1, 10:02 sit4, 12:55 uat3, 12:58 preprod1, 13:08 uat3, 17:16 preprod1, 22:45 preprod1
2026-10-02: 02:04 uat4, 12:18 preprod1, 12:21 preprod1, 16:16 eauto, 16:18 preprod1, 16:20 sit2, 16:22 sit3, 16:25 uat1, 16:27 uat3, 16:30 sit4
2026-10-05: 11:38 preprod1, 15:04 uat1, 15:06 preprod1, 18:18 uat1 FAILED, 19:49 uat1
2026-10-06: 11:15 sit4, 11:17 sit2, 12:07 preprod1, 17:03 eauto, 17:05 preprod1, 17:07 sit3, 17:09 uat1, 17:11 uat3, 17:14 uat4
2026-10-07: 10:52 eauto FAILED, 10:54 uat1, 10:56 eauto, 11:00 sit1, 14:17 preprod1, 14:19 eauto, 15:05 sit1, 15:29 sit1, 16:02 eauto, 17:23 eauto, 17:26 preprod1, 17:33 sit2 FAILED, 17:39 sit3 FAILED, 17:41 sit4, 17:43 uat1, 17:45 uat3, 17:46 uat4, 17:52 sit2, 17:58 sit3 FAILED, 18:19 sit3 FAILED, 18:47 sit3 FAILED, 18:53 sit3, 23:11 sit4, 23:13 sit2
2026-10-08: 14:55 preprod1, 14:58 sit4, 15:02 sit2, 15:37 eauto, 15:39 preprod1, 15:41 sit2, 15:43 sit3, 15:45 sit4, 15:47 uat3, 15:49 uat4, 16:35 uat1, 21:07 preprod1, 21:12 preprod1, 21:14 uat1
2026-10-11: 14:30 preprod1
2026-10-12: 12:05 uat1, 12:07 uat1, 12:54 sit2, 12:57 sit4, 16:13 preprod1, 16:16 uat1
2026-10-13: 11:32 uat1, 11:43 preprod1, 11:58 sit1, 16:08 uat1, 16:14 preprod1, 16:31 sit1, 17:35 uat3, 22:37 sit4, 22:53 preprod1
2026-10-14: 10:50 uat3, 11:15 preprod1, 11:26 preprod1, 15:19 preprod1, 16:02 preprod1, 17:00 uat3, 17:10 sit4, 17:30 preprod1, 17:58 preprod1, 18:59 preprod1
2026-10-15: 02:32 preprod1, 09:27 sit4, 09:41 uat3, 10:11 sit4, 11:37 preprod1, 16:11 uat3, 16:50 sit1, 17:05 sit1
2026-10-16: 08:06 sit1, 08:50 sit4

## Update 2026-10-16 → 2026-10-26 (captured 2026-10-26)

<!-- Read-only capture via Teams web DOM, 2026-10-26. Times MYT. Messages from 2026-10-16 00:00 to capture time, oldest first.
     Line breaks inside a message shown as " / ". Quoted replies appear inline at the start of a message ("<name> / <date> / <quoted text> / reply"). Images shown as [image]; reactions dropped. -->

**Workflows** — 2026-10-16 08:05: 🚀 Staging deploy started — staging/sit1 / Project / eAuto / Branch / staging/sit1 / Commit / aae679ae / Pipeline / #17042 / Deploying staging/sit1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-16 08:06: ✅ Staging deploy succeeded — staging/sit1 / Project / eAuto / Branch / staging/sit1 / Commit / aae679ae / Pipeline / #17042 / staging/sit1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-16 08:49: 🚀 Staging deploy started — staging/sit4 / Project / eAuto / Branch / staging/sit4 / Commit / 5299558c / Pipeline / #17043 / Deploying staging/sit4.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-16 08:50: ✅ Staging deploy succeeded — staging/sit4 / Project / eAuto / Branch / staging/sit4 / Commit / 5299558c / Pipeline / #17043 / staging/sit4.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-16 15:14: 🚀 Staging deploy started — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 706dc71d / Pipeline / #17045 / Deploying staging/uat3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-16 15:15: ✅ Staging deploy succeeded — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 706dc71d / Pipeline / #17045 / staging/uat3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-16 17:32: 🚀 Staging deploy started — staging/uat1 / Project / eAuto / Branch / staging/uat1 / Commit / ec78ce48 / Pipeline / #17052 / Deploying staging/uat1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-16 17:33: ✅ Staging deploy succeeded — staging/uat1 / Project / eAuto / Branch / staging/uat1 / Commit / ec78ce48 / Pipeline / #17052 / staging/uat1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 10:10: 🚀 Staging deploy started — staging/eauto / Project / eAuto / Branch / staging/eauto / Commit / 9a22aedd / Pipeline / #17061 / Deploying staging/eauto.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 10:11: ✅ Staging deploy succeeded — staging/eauto / Project / eAuto / Branch / staging/eauto / Commit / 9a22aedd / Pipeline / #17061 / staging/eauto.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 10:13: 🚀 Staging deploy started — staging/sit2 / Project / eAuto / Branch / staging/sit2 / Commit / 1107df0e / Pipeline / #17062 / Deploying staging/sit2.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 10:14: ✅ Staging deploy succeeded — staging/sit2 / Project / eAuto / Branch / staging/sit2 / Commit / 1107df0e / Pipeline / #17062 / staging/sit2.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 10:15: 🚀 Staging deploy started — staging/sit4 / Project / eAuto / Branch / staging/sit4 / Commit / 9bb730e6 / Pipeline / #17063 / Deploying staging/sit4.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 10:16: ✅ Staging deploy succeeded — staging/sit4 / Project / eAuto / Branch / staging/sit4 / Commit / 9bb730e6 / Pipeline / #17063 / staging/sit4.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 10:17: 🚀 Staging deploy started — staging/sit3 / Project / eAuto / Branch / staging/sit3 / Commit / 79d137d0 / Pipeline / #17064 / Deploying staging/sit3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 10:18: ✅ Staging deploy succeeded — staging/sit3 / Project / eAuto / Branch / staging/sit3 / Commit / 79d137d0 / Pipeline / #17064 / staging/sit3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 10:20: 🚀 Staging deploy started — staging/uat1 / Project / eAuto / Branch / staging/uat1 / Commit / 075ddc56 / Pipeline / #17065 / Deploying staging/uat1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 10:21: ✅ Staging deploy succeeded — staging/uat1 / Project / eAuto / Branch / staging/uat1 / Commit / 075ddc56 / Pipeline / #17065 / staging/uat1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 10:22: 🚀 Staging deploy started — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / fa365a62 / Pipeline / #17066 / Deploying staging/uat3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 10:24: ✅ Staging deploy succeeded — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / fa365a62 / Pipeline / #17066 / staging/uat3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 10:25: 🚀 Staging deploy started — staging/uat4 / Project / eAuto / Branch / staging/uat4 / Commit / d62ab459 / Pipeline / #17067 / Deploying staging/uat4.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 10:26: ✅ Staging deploy succeeded — staging/uat4 / Project / eAuto / Branch / staging/uat4 / Commit / d62ab459 / Pipeline / #17067 / staging/uat4.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 10:27: 🚀 Staging deploy started — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / 4e884429 / Pipeline / #17068 / Deploying staging/preprod1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 10:28: ✅ Staging deploy succeeded — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / 4e884429 / Pipeline / #17068 / staging/preprod1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 10:43: 🚀 Staging deploy started — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / 5bcc40f0 / Pipeline / #17069 / Deploying staging/preprod1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 10:44: ✅ Staging deploy succeeded — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / 5bcc40f0 / Pipeline / #17069 / staging/preprod1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 14:01: 🚀 Staging deploy started — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / ef67e96f / Pipeline / #17071 / Deploying staging/uat3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 14:02: ✅ Staging deploy succeeded — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / ef67e96f / Pipeline / #17071 / staging/uat3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 14:10: 🚀 Staging deploy started — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / a16963b3 / Pipeline / #17072 / Deploying staging/uat3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Wei Ting Lim** — 2026-10-19 14:25: hi all, i will restart tomcat

**Workflows** — 2026-10-19 14:30: ✅ Staging deploy succeeded — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / a16963b3 / Pipeline / #17072 / staging/uat3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 14:57: 🚀 Staging deploy started — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / fd0f228c / Pipeline / #17073 / Deploying staging/uat3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Wei Ting Lim** — 2026-10-19 14:58: Wei Ting Lim / 19/10/2026 14:25 / hi all, i will restart tomcat / done restart ya, forgot to update

**Workflows** — 2026-10-19 14:58: ✅ Staging deploy succeeded — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / fd0f228c / Pipeline / #17073 / staging/uat3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 16:19: 🚀 Staging deploy started — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / 3ab710ff / Pipeline / #17074 / Deploying staging/preprod1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 16:20: ✅ Staging deploy succeeded — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / 3ab710ff / Pipeline / #17074 / staging/preprod1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 16:43: 🚀 Staging deploy started — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 2c2dd601 / Pipeline / #17075 / Deploying staging/uat3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 16:44: ✅ Staging deploy succeeded — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 2c2dd601 / Pipeline / #17075 / staging/uat3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 17:07: 🚀 Staging deploy started — staging/eauto / Project / eAuto / Branch / staging/eauto / Commit / f609dea8 / Pipeline / #17076 / Deploying staging/eauto.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 17:07: ✅ Staging deploy succeeded — staging/eauto / Project / eAuto / Branch / staging/eauto / Commit / f609dea8 / Pipeline / #17076 / staging/eauto.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 19:42: 🚀 Staging deploy started — staging/uat4 / Project / eAuto / Branch / staging/uat4 / Commit / 77bf6c4b / Pipeline / #17077 / Deploying staging/uat4.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 19:43: ✅ Staging deploy succeeded — staging/uat4 / Project / eAuto / Branch / staging/uat4 / Commit / 77bf6c4b / Pipeline / #17077 / staging/uat4.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 19:45: 🚀 Staging deploy started — staging/uat4 / Project / eAuto / Branch / staging/uat4 / Commit / 3e3366a4 / Pipeline / #17078 / Deploying staging/uat4.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 19:46: ✅ Staging deploy succeeded — staging/uat4 / Project / eAuto / Branch / staging/uat4 / Commit / 3e3366a4 / Pipeline / #17078 / staging/uat4.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 23:03: 🚀 Staging deploy started — staging/sit4 / Project / eAuto / Branch / staging/sit4 / Commit / 3215951a / Pipeline / #17084 / Deploying staging/sit4.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 23:04: ✅ Staging deploy succeeded — staging/sit4 / Project / eAuto / Branch / staging/sit4 / Commit / 3215951a / Pipeline / #17084 / staging/sit4.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 23:45: 🚀 Staging deploy started — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 747e91ee / Pipeline / #17085 / Deploying staging/uat3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-19 23:46: ✅ Staging deploy succeeded — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 747e91ee / Pipeline / #17085 / staging/uat3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 08:42: 🚀 Staging deploy started — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / c863a561 / Pipeline / #17088 / Deploying staging/uat3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 08:43: ✅ Staging deploy succeeded — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / c863a561 / Pipeline / #17088 / staging/uat3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 10:06: 🚀 Staging deploy started — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 75be0f5a / Pipeline / #17089 / Deploying staging/uat3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 10:07: ✅ Staging deploy succeeded — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 75be0f5a / Pipeline / #17089 / staging/uat3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 10:59: 🚀 Staging deploy started — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 5561073a / Pipeline / #17092 / Deploying staging/uat3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 11:00: ✅ Staging deploy succeeded — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 5561073a / Pipeline / #17092 / staging/uat3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 11:16: 🚀 Staging deploy started — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / 20f707fa / Pipeline / #17093 / Deploying staging/preprod1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 11:17: ✅ Staging deploy succeeded — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / 20f707fa / Pipeline / #17093 / staging/preprod1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 12:37: 🚀 Staging deploy started — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / e59a6bf9 / Pipeline / #17095 / Deploying staging/preprod1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 12:38: ✅ Staging deploy succeeded — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / e59a6bf9 / Pipeline / #17095 / staging/preprod1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 14:17: 🚀 Staging deploy started — staging/sit4 / Project / eAuto / Branch / staging/sit4 / Commit / 5808d0f0 / Pipeline / #17097 / Deploying staging/sit4.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 14:18: ✅ Staging deploy succeeded — staging/sit4 / Project / eAuto / Branch / staging/sit4 / Commit / 5808d0f0 / Pipeline / #17097 / staging/sit4.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 14:43: 🚀 Staging deploy started — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 5c756c72 / Pipeline / #17098 / Deploying staging/uat3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 14:44: ✅ Staging deploy succeeded — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 5c756c72 / Pipeline / #17098 / staging/uat3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 14:46: 🚀 Staging deploy started — staging/sit3 / Project / eAuto / Branch / staging/sit3 / Commit / e149a2f1 / Pipeline / #17099 / Deploying staging/sit3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 14:47: ✅ Staging deploy succeeded — staging/sit3 / Project / eAuto / Branch / staging/sit3 / Commit / e149a2f1 / Pipeline / #17099 / staging/sit3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 15:02: 🚀 Staging deploy started — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 318f1860 / Pipeline / #17100 / Deploying staging/uat3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 15:03: ✅ Staging deploy succeeded — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 318f1860 / Pipeline / #17100 / staging/uat3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 15:34: 🚀 Staging deploy started — staging/eauto / Project / eAuto / Branch / staging/eauto / Commit / 14b23aed / Pipeline / #17103 / Deploying staging/eauto.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 15:35: ✅ Staging deploy succeeded — staging/eauto / Project / eAuto / Branch / staging/eauto / Commit / 14b23aed / Pipeline / #17103 / staging/eauto.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 15:37: 🚀 Staging deploy started — staging/sit2 / Project / eAuto / Branch / staging/sit2 / Commit / be180bba / Pipeline / #17104 / Deploying staging/sit2.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 15:38: ✅ Staging deploy succeeded — staging/sit2 / Project / eAuto / Branch / staging/sit2 / Commit / be180bba / Pipeline / #17104 / staging/sit2.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 15:39: 🚀 Staging deploy started — staging/sit4 / Project / eAuto / Branch / staging/sit4 / Commit / b2977f29 / Pipeline / #17105 / Deploying staging/sit4.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 15:40: ✅ Staging deploy succeeded — staging/sit4 / Project / eAuto / Branch / staging/sit4 / Commit / b2977f29 / Pipeline / #17105 / staging/sit4.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 15:42: 🚀 Staging deploy started — staging/uat1 / Project / eAuto / Branch / staging/uat1 / Commit / 5c168a20 / Pipeline / #17106 / Deploying staging/uat1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 15:43: ✅ Staging deploy succeeded — staging/uat1 / Project / eAuto / Branch / staging/uat1 / Commit / 5c168a20 / Pipeline / #17106 / staging/uat1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 15:45: 🚀 Staging deploy started — staging/uat4 / Project / eAuto / Branch / staging/uat4 / Commit / 5cbeb2a7 / Pipeline / #17107 / Deploying staging/uat4.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 15:46: ✅ Staging deploy succeeded — staging/uat4 / Project / eAuto / Branch / staging/uat4 / Commit / 5cbeb2a7 / Pipeline / #17107 / staging/uat4.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-20 15:48: 💪 Prod sync to staging completed / Project / eAuto / Source / prod/master 67ceac27 (EAINT-12555 UCD homepage popup shows the Insurance Cancellation poster instead of the LKM Refund poster) / Merged / staging/eauto !4928, staging/sit2 !4929, staging/sit4 !4930, staging/uat1 !4931, staging/uat4 !4932 / Up to date / staging/sit3 (already on the latest prod via the 14:48 EAINT-8606 merge e149a2f1) / Deploys / All 5 CI/CD pipelines succeeded (#17103-#17107); all 5 environments respond with the login page / All merges were clean. QA's six environments (eauto, sit2, sit3, sit4, uat1, uat4) are all on the latest prod. Please pull the latest before pushing to these branches. / Goh Kai Jiaeh used a Workflow template to send this card. Get template / View MRs

**Workflows** — 2026-10-20 20:44: 🚀 Staging deploy started — staging/sit1 / Project / eAuto / Branch / staging/sit1 / Commit / 4dc27ec2 / Pipeline / #17111 / Deploying staging/sit1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 10:06: 🚀 Staging deploy started — staging/sit1 / Project / eAuto / Branch / staging/sit1 / Commit / 8880c464 / Pipeline / #17118 / Deploying staging/sit1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 10:06: ✅ Staging deploy succeeded — staging/sit1 / Project / eAuto / Branch / staging/sit1 / Commit / 8880c464 / Pipeline / #17118 / staging/sit1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 10:24: 🚀 Staging deploy started — staging/uat1 / Project / eAuto / Branch / staging/uat1 / Commit / 140b36b9 / Pipeline / #17119 / Deploying staging/uat1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 10:24: ✅ Staging deploy succeeded — staging/uat1 / Project / eAuto / Branch / staging/uat1 / Commit / 140b36b9 / Pipeline / #17119 / staging/uat1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 10:27: 🚀 Staging deploy started — staging/uat1 / Project / eAuto / Branch / staging/uat1 / Commit / e9dc05e5 / Pipeline / #17120 / Deploying staging/uat1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 10:28: ✅ Staging deploy succeeded — staging/uat1 / Project / eAuto / Branch / staging/uat1 / Commit / e9dc05e5 / Pipeline / #17120 / staging/uat1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 11:40: 🚀 Staging deploy started — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 85fd6915 / Pipeline / #17121 / Deploying staging/uat3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 11:40: ✅ Staging deploy succeeded — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 85fd6915 / Pipeline / #17121 / staging/uat3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 13:35: 🚀 Staging deploy started — staging/uat1 / Project / eAuto / Branch / staging/uat1 / Commit / 32b585a6 / Pipeline / #17122 / Deploying staging/uat1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 13:36: ✅ Staging deploy succeeded — staging/uat1 / Project / eAuto / Branch / staging/uat1 / Commit / 32b585a6 / Pipeline / #17122 / staging/uat1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 13:43: 🚀 Staging deploy started — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 4e0718f0 / Pipeline / #17123 / Deploying staging/uat3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 13:44: ✅ Staging deploy succeeded — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 4e0718f0 / Pipeline / #17123 / staging/uat3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 14:46: 🚀 Staging deploy started — staging/sit1 / Project / eAuto / Branch / staging/sit1 / Commit / fe3b805a / Pipeline / #17125 / Deploying staging/sit1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 14:47: ✅ Staging deploy succeeded — staging/sit1 / Project / eAuto / Branch / staging/sit1 / Commit / fe3b805a / Pipeline / #17125 / staging/sit1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 15:48: 🚀 Staging deploy started — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / c6e160f3 / Pipeline / #17127 / Deploying staging/preprod1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 15:49: ✅ Staging deploy succeeded — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / c6e160f3 / Pipeline / #17127 / staging/preprod1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 16:10: 🚀 Staging deploy started — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 92b23636 / Pipeline / #17129 / Deploying staging/uat3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 16:12: ✅ Staging deploy succeeded — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 92b23636 / Pipeline / #17129 / staging/uat3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 16:36: 🚀 Staging deploy started — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / 6449b588 / Pipeline / #17131 / Deploying staging/preprod1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 16:37: ✅ Staging deploy succeeded — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / 6449b588 / Pipeline / #17131 / staging/preprod1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 17:28: 🚀 Staging deploy started — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 69a132cc / Pipeline / #17133 / Deploying staging/uat3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 17:29: ✅ Staging deploy succeeded — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 69a132cc / Pipeline / #17133 / staging/uat3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 18:33: 🚀 Staging deploy started — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 0ecdf875 / Pipeline / #17134 / Deploying staging/uat3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-21 18:34: ✅ Staging deploy succeeded — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 0ecdf875 / Pipeline / #17134 / staging/uat3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 06:57: 🚀 Staging deploy started — staging/eauto / Project / eAuto / Branch / staging/eauto / Commit / 7c0f8f6c / Pipeline / #17135 / Deploying staging/eauto.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 06:58: ✅ Staging deploy succeeded — staging/eauto / Project / eAuto / Branch / staging/eauto / Commit / 7c0f8f6c / Pipeline / #17135 / staging/eauto.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 06:59: 🚀 Staging deploy started — staging/sit3 / Project / eAuto / Branch / staging/sit3 / Commit / 50737251 / Pipeline / #17136 / Deploying staging/sit3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 07:00: ✅ Staging deploy succeeded — staging/sit3 / Project / eAuto / Branch / staging/sit3 / Commit / 50737251 / Pipeline / #17136 / staging/sit3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 07:02: 🚀 Staging deploy started — staging/sit2 / Project / eAuto / Branch / staging/sit2 / Commit / 4d526cfb / Pipeline / #17137 / Deploying staging/sit2.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 07:02: ✅ Staging deploy succeeded — staging/sit2 / Project / eAuto / Branch / staging/sit2 / Commit / 4d526cfb / Pipeline / #17137 / staging/sit2.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 07:04: 🚀 Staging deploy started — staging/sit4 / Project / eAuto / Branch / staging/sit4 / Commit / 409c1a88 / Pipeline / #17138 / Deploying staging/sit4.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 07:05: ✅ Staging deploy succeeded — staging/sit4 / Project / eAuto / Branch / staging/sit4 / Commit / 409c1a88 / Pipeline / #17138 / staging/sit4.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 07:07: 🚀 Staging deploy started — staging/uat4 / Project / eAuto / Branch / staging/uat4 / Commit / fb3eb250 / Pipeline / #17139 / Deploying staging/uat4.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 07:07: ✅ Staging deploy succeeded — staging/uat4 / Project / eAuto / Branch / staging/uat4 / Commit / fb3eb250 / Pipeline / #17139 / staging/uat4.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 07:14: 💪 Prod sync to staging completed (uat1 skipped) / Project / eAuto / Source / prod/master 37c4c6577d (EAINT-12525) / Merged / staging/eauto !4950, sit2 !4951, sit3 !4952, sit4 !4953, uat4 !4954 / Up to date / staging/uat3 / Skipped / staging/uat1 (merge conflicts in the JPJ new-BRN handlers, needs a developer) / Deploys / All 5 CI/CD pipelines succeeded (#17135-#17139) / 5 merges were clean. uat1 has conflicts and was not synced. Please pull the latest before pushing to the synced branches. / Goh Kai Jiaeh used a Workflow template to send this card. Get template / View MRs

**Workflows** — 2026-10-22 07:44: 🚀 Staging deploy started — staging/uat1 / Project / eAuto / Branch / staging/uat1 / Commit / d214c202 / Pipeline / #17142 / Deploying staging/uat1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 07:44: ✅ Staging deploy succeeded — staging/uat1 / Project / eAuto / Branch / staging/uat1 / Commit / d214c202 / Pipeline / #17142 / staging/uat1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 07:47: Prod sync follow-up: uat1 and Secarang preprod done / Project / eAuto / Secarang / eAuto staging/uat1 / Synced with prod/master 37c4c6577d via !4955 (conflicts in the JPJ new-BRN handlers resolved to prod's version; EAINT-12253 kept). Pipeline #17142 succeeded. / Secarang /preprod / Backend !258 (pipeline #17140 succeeded) and frontend !676 via dev/feat/EAINT-8608 (pipeline #17141 succeeded). Latest prod deployed; preprod keeps its own EAINT-8608 / EAINT-8669 work. / All requested staging environments now have the latest prod: eAuto /eauto, /sit2, /sit3, /sit4, /uat1, /uat3, /uat4 and Secarang /preprod. Please pull the latest before pushing to these branches. / Goh Kai Jiaeh used a Workflow template to send this card. Get template / View uat1 MR

**Workflows** — 2026-10-22 09:42: 🚀 Staging deploy started — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 37c4c657 / Pipeline / #17143 / Deploying staging/uat3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 09:42: ✅ Staging deploy succeeded — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 37c4c657 / Pipeline / #17143 / staging/uat3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 11:16: 🚀 Staging deploy started — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 492f6c97 / Pipeline / #17146 / Deploying staging/uat3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 11:17: ✅ Staging deploy succeeded — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / 492f6c97 / Pipeline / #17146 / staging/uat3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 11:41: 🚀 Staging deploy started — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / fa4e7bd8 / Pipeline / #17148 / Deploying staging/preprod1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 11:42: ✅ Staging deploy succeeded — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / fa4e7bd8 / Pipeline / #17148 / staging/preprod1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 14:15: 🚀 Staging deploy started — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / a17f471f / Pipeline / #17151 / Deploying staging/preprod1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 14:16: ✅ Staging deploy succeeded — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / a17f471f / Pipeline / #17151 / staging/preprod1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 14:18: 🚀 Staging deploy started — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / c11aca40 / Pipeline / #17153 / Deploying staging/preprod1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 14:19: ✅ Staging deploy succeeded — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / c11aca40 / Pipeline / #17153 / staging/preprod1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 15:01: 🚀 Staging deploy started — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / 8a018d69 / Pipeline / #17155 / Deploying staging/preprod1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 15:02: ✅ Staging deploy succeeded — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / 8a018d69 / Pipeline / #17155 / staging/preprod1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 15:45: 🚀 Staging deploy started — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / 20918172 / Pipeline / #17156 / Deploying staging/preprod1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 15:46: ✅ Staging deploy succeeded — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / 20918172 / Pipeline / #17156 / staging/preprod1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 16:18: 🚀 Staging deploy started — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / 7fd4aa5a / Pipeline / #17158 / Deploying staging/preprod1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-22 16:19: ✅ Staging deploy succeeded — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / 7fd4aa5a / Pipeline / #17158 / staging/preprod1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-23 13:03: 🚀 Staging deploy started — staging/uat4 / Project / eAuto / Branch / staging/uat4 / Commit / 4a013885 / Pipeline / #17181 / Deploying staging/uat4.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-23 13:04: ✅ Staging deploy succeeded — staging/uat4 / Project / eAuto / Branch / staging/uat4 / Commit / 4a013885 / Pipeline / #17181 / staging/uat4.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-23 16:34: 🚀 Staging deploy started — staging/uat4 / Project / eAuto / Branch / staging/uat4 / Commit / 84e41a62 / Pipeline / #17182 / Deploying staging/uat4.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-23 16:35: ✅ Staging deploy succeeded — staging/uat4 / Project / eAuto / Branch / staging/uat4 / Commit / 84e41a62 / Pipeline / #17182 / staging/uat4.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-23 16:46: 🚀 Staging deploy started — staging/uat4 / Project / eAuto / Branch / staging/uat4 / Commit / b04d8deb / Pipeline / #17183 / Deploying staging/uat4.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-23 16:47: ✅ Staging deploy succeeded — staging/uat4 / Project / eAuto / Branch / staging/uat4 / Commit / b04d8deb / Pipeline / #17183 / staging/uat4.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-23 18:08: 🚀 Staging deploy started — staging/sit1 / Project / eAuto / Branch / staging/sit1 / Commit / 0407d325 / Pipeline / #17184 / Deploying staging/sit1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-23 18:09: ✅ Staging deploy succeeded — staging/sit1 / Project / eAuto / Branch / staging/sit1 / Commit / 0407d325 / Pipeline / #17184 / staging/sit1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-23 20:48: 🚀 Staging deploy started — staging/uat4 / Project / eAuto / Branch / staging/uat4 / Commit / b1f38f51 / Pipeline / #17186 / Deploying staging/uat4.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-23 20:49: ✅ Staging deploy succeeded — staging/uat4 / Project / eAuto / Branch / staging/uat4 / Commit / b1f38f51 / Pipeline / #17186 / staging/uat4.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-23 23:58: 🚀 Staging deploy started — staging/uat4 / Project / eAuto / Branch / staging/uat4 / Commit / d8bc738a / Pipeline / #17187 / Deploying staging/uat4.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-23 23:59: ✅ Staging deploy succeeded — staging/uat4 / Project / eAuto / Branch / staging/uat4 / Commit / d8bc738a / Pipeline / #17187 / staging/uat4.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-26 11:05: 🚀 Staging deploy started — staging/eauto / Project / eAuto / Branch / staging/eauto / Commit / 18a1603a / Pipeline / #17196 / Deploying staging/eauto.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-26 11:06: ✅ Staging deploy succeeded — staging/eauto / Project / eAuto / Branch / staging/eauto / Commit / 18a1603a / Pipeline / #17196 / staging/eauto.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-26 11:08: 🚀 Staging deploy started — staging/sit2 / Project / eAuto / Branch / staging/sit2 / Commit / d7720d8c / Pipeline / #17197 / Deploying staging/sit2.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-26 11:09: ✅ Staging deploy succeeded — staging/sit2 / Project / eAuto / Branch / staging/sit2 / Commit / d7720d8c / Pipeline / #17197 / staging/sit2.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-26 11:11: 🚀 Staging deploy started — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / 5a559a7d / Pipeline / #17198 / Deploying staging/preprod1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-26 11:30: ✅ Staging deploy succeeded — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / 5a559a7d / Pipeline / #17198 / staging/preprod1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-26 11:32: 🚀 Staging deploy started — staging/sit3 / Project / eAuto / Branch / staging/sit3 / Commit / 3c8c8765 / Pipeline / #17199 / Deploying staging/sit3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-26 11:33: ✅ Staging deploy succeeded — staging/sit3 / Project / eAuto / Branch / staging/sit3 / Commit / 3c8c8765 / Pipeline / #17199 / staging/sit3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-26 11:35: 🚀 Staging deploy started — staging/sit4 / Project / eAuto / Branch / staging/sit4 / Commit / 549e7561 / Pipeline / #17200 / Deploying staging/sit4.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-26 11:36: ✅ Staging deploy succeeded — staging/sit4 / Project / eAuto / Branch / staging/sit4 / Commit / 549e7561 / Pipeline / #17200 / staging/sit4.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-26 11:38: 🚀 Staging deploy started — staging/uat1 / Project / eAuto / Branch / staging/uat1 / Commit / 77df1739 / Pipeline / #17201 / Deploying staging/uat1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-26 11:38: ✅ Staging deploy succeeded — staging/uat1 / Project / eAuto / Branch / staging/uat1 / Commit / 77df1739 / Pipeline / #17201 / staging/uat1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-26 11:40: 🚀 Staging deploy started — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / ca1b9925 / Pipeline / #17202 / Deploying staging/uat3.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-26 11:41: ✅ Staging deploy succeeded — staging/uat3 / Project / eAuto / Branch / staging/uat3 / Commit / ca1b9925 / Pipeline / #17202 / staging/uat3.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-26 11:42: 🚀 Staging deploy started — staging/uat4 / Project / eAuto / Branch / staging/uat4 / Commit / f4bc7978 / Pipeline / #17203 / Deploying staging/uat4.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-26 11:43: ✅ Staging deploy succeeded — staging/uat4 / Project / eAuto / Branch / staging/uat4 / Commit / f4bc7978 / Pipeline / #17203 / staging/uat4.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-26 11:45: 💪 Prod sync to staging completed / Project / eAuto / Source / prod/master 17e330d411 (EAINT-12431 - LKM Refund: email + WhatsApp the car owner at STMS Step 2) / Merged / staging/eauto !4972, staging/preprod1 !4973, staging/sit2 !4974, staging/sit3 !4975, staging/sit4 !4976, staging/uat1 !4977, staging/uat3 !4978, staging/uat4 !4979 / Deploys / All 8 CI/CD pipelines succeeded (#17196-#17203) / All merges were clean. Please pull the latest before pushing to these branches. / Goh Kai Jiaeh used a Workflow template to send this card. Get template / View MRs

**Workflows** — 2026-10-26 11:48: 🚀 Staging deploy started — staging/uat1 / Project / eAuto / Branch / staging/uat1 / Commit / 05dcbdda / Pipeline / #17205 / Deploying staging/uat1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-26 11:49: ✅ Staging deploy succeeded — staging/uat1 / Project / eAuto / Branch / staging/uat1 / Commit / 05dcbdda / Pipeline / #17205 / staging/uat1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-26 14:57: 🚀 Staging deploy started — staging/uat1 / Project / eAuto / Branch / staging/uat1 / Commit / b4d5c239 / Pipeline / #17212 / Deploying staging/uat1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-26 14:57: ✅ Staging deploy succeeded — staging/uat1 / Project / eAuto / Branch / staging/uat1 / Commit / b4d5c239 / Pipeline / #17212 / staging/uat1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-26 16:55: 🚀 Staging deploy started — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / 2630e9f9 / Pipeline / #17215 / Deploying staging/preprod1.war to staging Tomcat… / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline

**Workflows** — 2026-10-26 16:56: ✅ Staging deploy succeeded — staging/preprod1 / Project / eAuto / Branch / staging/preprod1 / Commit / 2630e9f9 / Pipeline / #17215 / staging/preprod1.war deployed to staging Tomcat. / Wei Ting Lim used a Workflow template to send this card. Get template / View Pipeline
