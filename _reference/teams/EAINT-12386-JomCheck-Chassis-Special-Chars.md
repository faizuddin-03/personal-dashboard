<!-- Source: Teams group chat "EAINT-12386 [eAuto-UCD] JomCheck - Remove Special Character from Chassis No & Auto-Resubmit on Empty Report".
     Captured 2026-10-16 (read-only sweep). Times MYT. Full history (chat starts 2026-10-12). -->
# EAINT-12386 JomCheck chassis special characters

[2026-10-12 15:34] Mei Jia Chee: hii everyone, we will use this CR group for https://mfservices.atlassian.net/browse/EAINT-12386
[2026-10-12 15:36] Mei Jia Chee: just to share that SRD v0.1 available ya. [attachment/image]
[2026-10-12 15:37] Mei Jia Chee: need advise from Tan Yi Fung Goh Kai Jiaeh Jin Siang Boo, who can handle this ticket
[2026-10-13 09:35] Goh Kai Jiaeh: Hi Mei Jia, i will take a look this.
[system] Mei Jia Chee added Nur Izni Binti Zurni and 9 others to the chat.

## Update 2026-10-16 → 2026-10-26 (captured 2026-10-26)

<!-- Read-only capture via Teams web DOM, 2026-10-26. Times MYT. Messages from 2026-10-16 00:00 to capture time, oldest first.
     Line breaks inside a message shown as " / ". Quoted replies appear inline at the start of a message ("<name> / <date> / <quoted text> / reply"). Images shown as [image]; reactions dropped. -->

**Mei Jia Chee** — 2026-10-23 08:37: hiii Everyone, SRD v0.2 & SRD v0.3 available now ya [image]

**Mei Jia Chee** — 2026-10-23 08:39: Goh Kai Jiaeh, just to check that this ticket now still under u ya? as i wan to understand abit more for the hotfix u done last time when deploying EAINT-12339 / Enquiry API: / Get Report API: / Hotfix Result: [image]

**Goh Kai Jiaeh** — 2026-10-23 10:45: Previously if system received Invalid Chassis No. response from Jomcheck enquiry API, system still allow UCD to make payment and purchase report. However, jomcheck get report API will also returned Invalid Chassis No. response.

**Goh Kai Jiaeh** — 2026-10-23 10:46: After hotfix, if system detects Invalid Chassis No. response from Jomcheck enquiry API, system will block UCD directly.

**Mei Jia Chee** — 2026-10-26 12:43: Goh Kai Jiaeh / 23/10/2026 10:46 / After hotfix, if system detects Invalid Chassis No. response from Jomcheck enquiry API, system will block UCD directly. / Goh Kai Jiaeh, which mean that now JomCheck enquiry API no matter is Vehicle number or chassis number they able to check ad ya?

**Goh Kai Jiaeh** — 2026-10-26 14:12: not exactly. For chassis number their API still doesn't have precheck but somehow they will check this Invalid format.

**Mei Jia Chee** — 2026-10-26 14:55: okkies, which mean is we anyhow also will try to send to their JomCheck enquiry API to do checking, right? / bcz by right the precheck just for vehicle number, our syste, regardless of vehicle number or chassis number will still send out precheck API, thats why we able to get the message "Invalid Chassis Number", right?

**Mei Jia Chee** — 2026-10-26 15:22: Goh Kai Jiaeh, SRD v0.4 is ready ya. can take a look and let me know if there is anything wrong ya [image]

**Mei Jia Chee** — 2026-10-26 15:22: regarding the cronjob part, need advise yaa. [image]
