<!-- Source: Teams group chat "EAINT-12403 [eAuto-UCD] STMS & APT - Increase eAuto Service Charge for Car & Commercial Car (Effective 01.10.2026)".
     Captured 2026-10-16 (read-only sweep). Times MYT. Full history (2026-09-24 to 2026-10-01, 41 messages); acknowledgements dropped. Artifact share key redacted. -->
# EAINT-12403 STMS and APT service charge increase

[2026-09-24 11:51] Jin Siang Boo: this one will be same as APT increase charge like last time? EAINT-12289   Mei Jia Chee: yup
[2026-09-24 11:56] Jin Siang Boo: ok dev side need 1 day (both STMS and APT together)
[2026-09-24 12:09] Mei Jia Chee: on the effective date, as confirmed the ops team expected to update together with LKM Refund which is on 01.10 (Thurs) night ya
[2026-09-24 12:11] Jin Siang Boo: btw STMS include UCD to UCD (Standard & Interstate) and All Category in STMS right?   Mei Jia Chee (12:24): yes, betul
[2026-09-24 12:13] Jin Siang Boo: and saw ticket is System to reset, I think we still go for manual way to call backoffice to reset STMS and ESTM payment with Izni account, ok?
[2026-09-24 12:25] Mei Jia Chee: yea, manual way as what we doing previously and ok to use Izni account yaa.
[2026-09-24 12:24] Charmain Ea Chiang: QA side will be 2+1 ya, but we need time to prepare the automation script
[2026-09-24 12:33] Charmain Ea Chiang: we dont have enough manpower to pickup this ticket now
[2026-09-24 12:33] Jin Siang Boo: (claude.ai artifact, sk=[redacted]) refer this summary ya
[2026-09-25 09:21] Charmain Ea Chiang: yup2 can use staging/preprod1, tgt with lkm refund
[2026-09-25 09:35] Jin Siang Boo: okok I merge changes to staging first, reset payment wait ur signal
[2026-09-25 10:52] Mei Jia Chee: srd v1.1 ya, changes is on the STMS pricing in payment summary showing RM25, homepage show RM35
[2026-09-25 11:27] Mei Jia Chee: requestor given green light for srd v1.1 ya
[2026-09-28 11:49] Jin Siang Boo: ya will affect all branch, and yet to patch the price yet
[2026-09-28 17:07] Amirul Azfar: can help change the price and run the reset for all transactions for STMS and APT for today's transactions?
[2026-09-29 10:07] Jin Siang Boo: done ya, can check
[2026-10-01 15:09] Amirul Azfar: QA has completed testing for EAINT-12403 on staging/preprod1 (eAuto) with no outstanding issues. It's ready for night deployment on 1 Oct (Thursday).
