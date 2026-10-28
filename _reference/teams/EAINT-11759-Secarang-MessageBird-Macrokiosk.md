<!-- Source: Teams group chat "EAINT-11759 [Secarang-Insurance] To Retain Secarang Support MessageBird (+60 18-288 2800) for Secarang Support Notifications and Use Macrokiosk (+60 18-2880075) for User Successful Insurance Transaction Notifications".
     Captured 2026-10-16 (read-only sweep). Times MYT. Full history (2026-07-28 to 2026-09-17, 37 messages); acknowledgements dropped. "Unknown User" = Batrisyia. -->
# EAINT-11759 Secarang MessageBird / Macrokiosk split

[2026-07-28 12:33] Batrisyia Hasanah Binti Nursyamsi: will use this group for this ticket ya, EAINT-11759
[2026-08-11 16:49] Batrisyia Hasanah Binti Nursyamsi: SRD V1.1 ... updated wording "UCD" in the document to "User". ... for "Successful Insurance Transaction" sent to her (4889), both Secarang and Secarang Macrokiosk one will be discontinued as she prefers not to receive it.
[2026-08-12 11:26] Batrisyia Hasanah Binti Nursyamsi: PO has given greenlight for V1.2
[2026-08-13 18:28] Mong Guo Hao: Should be able to complete on next Monday yea
[2026-08-14 10:32] Mong Guo Hao: since the macrokiosk uat account expires today. possible we request for an extension?
[2026-08-14 11:03] Batrisyia Hasanah Binti Nursyamsi: SRD V1.3 in Jira to remove the "send via BOLD. BY MACROKIOSK" wording throughout the document
[2026-08-14 11:07] Charmain Ea Chiang: i think we should confirm the expected deployment date first before requesting the MK staging access extension ya, since both development and testing require the access. Also, need to check and double confirm whether there are any additional fees incurred
[2026-08-17 09:16] Charmain Ea Chiang: Estimated Testing Effort: 2 days / Base Testing: 1 day / Buffer (Requirement Changes + Bug Fix + Retest): 1 day
[2026-09-11 17:20] Charmain Ea Chiang: i will start testing this ticket next Monday on staging/ia (Secarang) ya
[2026-09-14 10:05] Batrisyia Hasanah Binti Nursyamsi: based on my SRD V1.3 we will not have Ket Ming phone number to receive this 3 messages in Secarang / 1. Payment success - Confirmed: Only send to User / 2. Cover note failed - Confirmed: Only send to Shamini / 3. JPJ rejected - Confirmed: Only send to Shamini
[2026-09-14 10:24] Charmain Ea Chiang: does this apply to the eAuto Insurance WhatsApp messages as well? Because EAINT-11759 only covers the Secarang flow
[2026-09-14 11:34] Batrisyia Hasanah Binti Nursyamsi: I will create another ticket for this fix ya
[2026-09-14 11:36] Charmain Ea Chiang: (Payment Successful message by Macrokiosk) means to remove the email part right?   Batrisyia (11:51): yup
[2026-09-14 14:12] Mong Guo Hao: is ready to test yea, but eauto support side still need time
[2026-09-17 22:53] Charmain Ea Chiang: QA has completed testing for EAINT-11759 on staging/ia (Secarang & CIBO) with no outstanding issues. It's ready for morning deployment on 1 Oct (Thursday).
