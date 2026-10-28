<!-- Source: Teams group chat "EAINT-12055 [eAuto-BackOffice] Exclude Resubmission Records from Reconciliation Listing".
     Captured 2026-10-16 (read-only sweep). Times MYT. Loaded from 2026-07-31 16:00 (earliest message the pane returned; the group was announced 2026-07-23).
     Acknowledgements dropped. "Unknown User" = Nur Izfarwiza Binti Mohd Talib (dev). -->
# EAINT-12055 Recon listing — exclude resubmission records

[2026-07-31 16:00] Nur Izfarwiza Binti Mohd Talib: Next Wednesday, including senior review
[2026-08-04 12:22] Nur Izfarwiza Binti Mohd Talib: It is under review, is there a staging branch available?
[2026-08-04 15:24] Yi Link Lim: can deploy to staging/uat3 ya
[2026-08-04 15:37] Jin Siang Boo: uat3 for next Monday deployment wor / will deploy tgt?
[2026-08-05 10:22] Yi Link Lim: sorry Brandon, wont deploy tgt ya. we will arrange deployment date for this ticket
[2026-08-05 10:23] Yi Link Lim: Monday deployment is mainly on JomCheck related tickets ya. for further info, can refer to released version in JIRA
[2026-08-05 10:53] Yi Link Lim: Jin Siang Boo As spoken, deployment of this ticket wont affect eAuto. QA is able to test in any staging in anytime. Even next Monday will have deployment, this ticket wont be deployed to prod. cc: Siti Nur Azila Binti Mohamed
[2026-08-13 14:25] Yi Link Lim: Hihi Everyone Just to update that we received feedback from Ops to add nota in JPJ Summary when paid trx is detected approved: here is the Nota template that ops will put on JPJ Hasil summary: [EFT-No kereta] [Payment Date and Time] UCD membuat bayaran dengan [EFT number] tetapi sistem JPJ tidak memberi respons. UCD membuat satu lagi penghantaran dengan [EFT number] pada [New Date Time of Approved JPJ Status]. Transaksi berjaya di mySikap. Tiada Bayaran balik bagi [EFT number] akan di tuntut. ...
[2026-08-13 14:32] Yi Link Lim: Siti Nur Azila Binti Mohamed As discussed just now, here are the expected behaviour in Recon Listing & JPJ Summary if resubmitted trx = Approved happen: Item #1 - Recon Listing a. sync total trx not found in eAuto in Recon Listing b. ensure no mismatch record found in date when Payment = OK. Item #2 - JPJ summary a. on Payment Date (when Payment = OK) i. remove the nota of the trx ii. sync bil transaksi b. on JPJ Approved Date (when JPJ Status = Approved) i. Add Nota as per above msg [img]
[2026-08-14 15:01] Siti Nur Azila Binti Mohamed: hihi Everyone to recap again on devs, BA & QA discussion earlier mainly on new request for paid trxn approved handling: ... Notes: Summary report will sync the latest version only (e.g. if recon summary has v1/v2/v3, only v3 gets synced when paid trxn is detected approved). Additional dev fix: / Multiple recon case — once a mismatch is hidden, it stays hidden permanently (won't show as mismatch again). ...
[2026-08-14 17:37] Yi Link Lim: Hii Nur Izfarwiza Binti Mohd Talib just to inform that we no need to develop on the new requests (confirmed with Nurul from Ops): Item A) ii) Remove Nota of the trxn; Item B) ii) Add new Nota of approved trxn ... cc: Siti Nur Azila Binti Mohamed Jin Siang Boo Wong Zhan Choon
[2026-08-14 17:58] Siti Nur Azila Binti Mohamed: So meaning QA will proceed to test using current eautocron version ya
[2026-08-14 18:00] Wong Zhan Choon: (additional fix) I believe no fixes as of now
[2026-08-17 16:15] Siti Nur Azila Binti Mohamed: Hi Everyone, here to inform that QA has finished testing this ticket and is ready for deployment ya. Thank you for your support
[2026-08-19 12:57] Yi Link Lim: Wong Zhan Choon As discussed ytd and today, there are fixes required in backend on resubmission of existing trx. Dev side is able to roll out the fixes today after lunch after reviewing. Note: QA is not required for testing for this fixes. cc: Siti Nur Azila Binti Mohamed
[2026-08-19 18:28] Yi Link Lim: Hihi QAs, sorry for the late, here is the ticket which will be included in tmr's morning deployment: https://mfservices.atlassian.net/browse/EAINT-12215 Kindly take note that here are the changes made: To ensure total number & total amount circled in red box tally with records displaying in recon listing; Backend changes for cronjob [img]
[2026-08-20 16:24] Yi Link Lim: Hihi Everyone Just to inform that I have confirmed with Ops team that this fix (EAINT-12215) working fine for both existing records and upcoming new records ya. Thankss
