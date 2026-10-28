<!-- Source: Teams group chat "EAINT-12171 [eAuto&Secarang-Insurance] To Standardize All Insurance Cron Job Interval".
     Captured 2026-10-16 (read-only sweep). Times MYT. Full history (chat starts 2026-08-17, 12 messages). -->
# EAINT-12171 Standardise insurance cron job interval

[2026-08-17 14:36] Batrisyia Hasanah Binti Nursyamsi: Hi Everyone, we will use this CR group for https://mfservices.atlassian.net/browse/EAINT-12171 / To update, I've uploaded SRD V0.1 in Jira. Let me know if have any feedbacks
[2026-08-18 14:27] Batrisyia Hasanah Binti Nursyamsi: Hi Everyone, I've uploaded SRD V1.0 in Jira and PO has given greenlight to proceed ya
[2026-08-20 09:55] Mong Guo Hao: the development is done for this ticket yea   (10:07, code review) will get it done today
[2026-09-01 14:24] Charmain Ea Chiang: Hi Mong Guo Hao, as discussed just now, for the testing scope of this CR, we will need you to provide the BE screenshots so QA can verify the Cronjob running intervals ya. Daily, from 8am to 11pm: eAuto JPJ Status - 1 minute; eAuto Cover Note - 5 minutes (remain); Secarang JPJ Status - 1 minute; Secarang Cover Note - 1 minute
[2026-09-01 17:03] Charmain Ea Chiang: Hi Mong Guo Hao, you can deploy the changes to staging/uat1 ya. Please share the BE screenshot here once done, thanks
[2026-09-02 13:11] Charmain Ea Chiang: Hi Everyone, just a quick update, Dev has shared the DB screenshots for staging/uat1 (eAuto), and everything has been tested and is working as expected. The ticket is ready for the morning deployment on 10 Sep (Thursday) ya, thank you. Secarang: JPJ Status Enquiry and Cover Note (Interval - 1min). eAuto: Cover Note (Interval - 5min); JPJ Status Enquiry (Interval - 1min). cc: Mong Guo Hao
