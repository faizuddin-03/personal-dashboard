<!-- Source: Teams group chat "EAINT-12289". Captured 2026-10-16 (read-only sweep). Times MYT.
     Loaded from 2026-09-07 16:34 (earliest the pane returned) to 2026-09-17, 47 messages; acknowledgements dropped. Account username list omitted. -->
# EAINT-12289 APT price change and failed-payment reset

[2026-09-07 16:34] Mei Jia Chee: SRD v0.3 is available ya. now pending the deployment date saja
[2026-09-07 18:00] Amirul Azfar: estimated effort for this ticket ya 2.5 day + 1 day (buffer) = 3.5 days
[2026-09-08 10:49] Mei Jia Chee: this ticket tentatively we aim to have 17.09 (Thurs) night deployment yaaa.
[2026-09-08 12:15] Jin Siang Boo: btw once the price updated, it will impact all the staging branch ya
[2026-09-08 12:34] Amirul Azfar: Can use /uat4 ya for this ticket
[2026-09-08 12:37] Amirul Azfar: Okey need to prepare some data first before you deploy / Maybe need to hold first before deploy to staging
[2026-09-08 12:39] Jin Siang Boo: I can deploy without changing price and reset payment haha, the deployment only the ucd homepage UI changes
[2026-09-08 12:42] Jin Siang Boo: fyi, we have 918 failed payment APT in staging, want reset all or the data you provided only?
[2026-09-10 08:14] Mei Jia Chee: requestor given green light for srd v1.0 ya
[2026-09-10 12:35] Amirul Azfar: can proceed to change price and reset payment ya. I think can reset all failed.
[2026-09-10 14:11] Amirul Azfar: APT transaction where Payment = OK but Tx Status = Failed (JPJ submission failed, not the payment). ... will they be reset too?
[2026-09-10 14:14] Jin Siang Boo: we only covers Failed Payment ya, failed submission not involve / Transaction Status and Payment both Failed
[2026-09-10 14:21] Jin Siang Boo: Btw, reset payment actually we are calling the API manually with a logged in user credentials, currently only these user can use for reset payment ya. Therefore, during prod deployment we need Izni account ya. [username list omitted] / For now, I will directly use Izni account
[2026-09-10 14:25] Jin Siang Boo: (schedule or during deployment?) during deployment ya
[2026-09-10 15:35] Jin Siang Boo: should be took around 15mins for reset (914 records)
[2026-09-11 16:14] Amirul Azfar: why the cron run so many times ya, is it because its running on all branches? And also the payment details show OK there but the payment and Tx status there is Failed
[2026-09-11 16:33] Jin Siang Boo: ya all staging branch running this cron
[2026-09-11 16:37] Amirul Azfar: scenario: 1. UCD > Create STMS Transaction until Transaction Status = Approved 2. BO > Manual trigger APT for JPJ Notice 5.5, then JPJ Notice 6.0 3. In eSIM, set Payment = Failed 4. UCD > APT Transaction Listing > Resubmit > proceed with Payment (Payment = Failed, Transaction Status = Failed) 5. Record the transaction number and fee. After Dev applies the payment reset: Tx Status = Pending 6. Cron run
[2026-09-11 17:45] Jin Siang Boo: as discussed, this is due to simulator behavior for simulate RE after a success payment and due to multiple cron job running at one times. I will change the cron job to run every 30 mins ya
[2026-09-11 17:51] Jin Siang Boo: Deploying below changes to staging/uat4: AptPaymentJob every 30 mins from 8am to 11pm; 6.0 APT Cron Job every 30 mins
[2026-09-17 11:17] Amirul Azfar: QA has completed testing for EAINT-12289 with no outstanding issues. It's ready for night deployment on 17 Sep (Thursday).
