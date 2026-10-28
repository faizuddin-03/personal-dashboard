<!-- Source: Teams group chat "EAINT-11978 [eAuto-Application] Enable potential UCD to Edit Showroom Address, Postcode, State & City and BO to Edit Showroom Ownership".
     Captured 2026-10-16 (read-only sweep). Times MYT. Full history (2026-07-22 to 2026-08-12, 35 messages); acknowledgements dropped. Figma share tokens dropped. -->
# EAINT-11978 Showroom address and ownership edit

[2026-07-22 11:07] Yi Link Lim: CR group for EAINT-11978 [eAuto-Application] Enable potential UCD to Edit Showroom Address, Postcode, State & City
[2026-07-22 17:09] Yi Link Lim: uploaded SRD v0.1 and 1.0 in JIRA
[2026-07-22 17:47] Yi Link Lim: figma: UCD Onboarding-form node 4081-34961; BO node 4081-33143
[2026-07-24 13:06] Tan Yi Fung: Sia Zhong Tai, please help on this, i let you know what to do
[2026-07-30 14:54] Sia Zhong Tai: the development is done, but i got a question. now that the BO can change the ownership status to no showroom, the address info and showroom files will be wiped, and changing back to own/shared requires re-entry. this behavior is correct right?
[2026-07-31 10:48] Sia Zhong Tai: the fields are conditional, when "own/shared showroom" all fields visible and enabled but when "no showroom": Showroom Address (hidden), Postcode (disabled), State (disabled), City (disabled), Four (4) Showroom Pictures and 20 Seconds Showroom Video (with Signboard) (disabled)
[2026-07-31 11:51] Yi Link Lim: we can follow existing behaviour in Application v1.0 (UCD view) for Application v1.1 (BO view with Pre-Application flow) on these five fields. Existing behaviour of Application v1.0: When UCD change from "own/shared showroom" to "no showroom", System will hide: Showroom Address, Postcode, State, City. System disabled: Four (4) Showroom Pictures and 20 Seconds Showroom Video (with Signboard). If UCD change to "no showroom" & save > change to "own/shared showroom", above five fields should be displayed and allow UCD to edit.
[2026-08-03 12:08] Yi Link Lim: currently we do not have deployment plan for this ticket. Once it is ready, u can keep in ur local first. QA will advice which staging to deploy once there is planned deployment date ya
[2026-08-10 09:24] Muhammad Faizuddin Bin Bidi: For this ticket, we tentatively plan to use /uat1 ya.
[2026-08-11 15:12] Muhammad Faizuddin Bin Bidi: Yes, the happy flow is ready (for walkthrough)
[2026-08-12 16:55] Muhammad Faizuddin Bin Bidi: QA has finished testing EAINT-11978 and found no issues. It is ready for tomorrow's morning deployment ya.
