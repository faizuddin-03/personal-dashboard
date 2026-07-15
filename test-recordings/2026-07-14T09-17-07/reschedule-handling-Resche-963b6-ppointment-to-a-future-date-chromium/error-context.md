# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reschedule-handling.spec.ts >> Reschedule & Handling >> UCD >> Reschedule before the day of the appointment to a future date
- Location: tests\service-hub\specs\reschedule-handling.spec.ts:71:9

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: false
Received: true
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - link "Home" [ref=e4] [cursor=pointer]:
        - /url: /uat1/view/ucd/
      - generic [ref=e5]: /
      - link "Service Hub" [ref=e6] [cursor=pointer]:
        - /url: /uat1/view/ucd/service-hub/view.do
      - generic [ref=e7]: /
      - generic [ref=e8]: Software Installation
    - generic [ref=e9]:
      - link "« Back" [ref=e10] [cursor=pointer]:
        - /url: /uat1/view/ucd/service-hub/view.do
      - generic: Software Installation
    - generic [ref=e13]:
      - generic [ref=e14]:
        - img "Software Installation" [ref=e15]
        - generic [ref=e16]:
          - generic [ref=e17]: Schedule an Appointment
          - generic [ref=e18]: Please choose your preferred software installation date and time slot. (up to 3 per slot)
      - generic [ref=e19]:
        - generic [ref=e20]: Please select a date to reschedule the software installation
        - generic [ref=e21]:
          - generic [ref=e22]: July 2026
          - generic [ref=e23] [cursor=pointer]: ›
      - table [ref=e24]:
        - rowgroup [ref=e25]:
          - row "MON TUE WED THUR FRI SAT SUN" [ref=e26]:
            - columnheader "MON" [ref=e27]
            - columnheader "TUE" [ref=e28]
            - columnheader "WED" [ref=e29]
            - columnheader "THUR" [ref=e30]
            - columnheader "FRI" [ref=e31]
            - columnheader "SAT" [ref=e32]
            - columnheader "SUN" [ref=e33]
        - rowgroup [ref=e34]:
          - row "29 30 1 2 3 4 5" [ref=e35]:
            - cell "29" [ref=e36]
            - cell "30" [ref=e37]
            - cell "1" [ref=e38]
            - cell "2" [ref=e39]
            - cell "3" [ref=e40]
            - cell "4" [ref=e41]
            - cell "5" [ref=e42]
          - row "6 7 8 9 10 11 12" [ref=e43]:
            - cell "6" [ref=e44]
            - cell "7" [ref=e45]
            - cell "8" [ref=e46]
            - cell "9" [ref=e47]
            - cell "10" [ref=e48]
            - cell "11" [ref=e49]
            - cell "12" [ref=e50]
          - row "13 14 15 Slot 2/6 16 Slot 3/6 17 Slot 1/6 18 19" [ref=e51]:
            - cell "13" [ref=e52]
            - cell "14" [ref=e53]:
              - generic [ref=e54]: "14"
            - cell "15 Slot 2/6" [ref=e55] [cursor=pointer]:
              - text: "15"
              - generic [ref=e57]: Slot 2/6
            - cell "16 Slot 3/6" [ref=e58] [cursor=pointer]:
              - text: "16"
              - generic [ref=e60]: Slot 3/6
            - cell "17 Slot 1/6" [ref=e61] [cursor=pointer]:
              - text: "17"
              - generic [ref=e63]: Slot 1/6
            - cell "18" [ref=e64]
            - cell "19" [ref=e65]
          - row "20 Slot 1/6 21 Slot 1/6 22 Slot 1/6 23 Slot 1/6 24 Slot 1/6 25 26" [ref=e66]:
            - cell "20 Slot 1/6" [ref=e67] [cursor=pointer]:
              - text: "20"
              - generic [ref=e69]: Slot 1/6
            - cell "21 Slot 1/6" [ref=e70] [cursor=pointer]:
              - text: "21"
              - generic [ref=e72]: Slot 1/6
            - cell "22 Slot 1/6" [ref=e73] [cursor=pointer]:
              - text: "22"
              - generic [ref=e75]: Slot 1/6
            - cell "23 Slot 1/6" [ref=e76] [cursor=pointer]:
              - text: "23"
              - generic [ref=e78]: Slot 1/6
            - cell "24 Slot 1/6" [ref=e79] [cursor=pointer]:
              - text: "24"
              - generic [ref=e81]: Slot 1/6
            - cell "25" [ref=e82]
            - cell "26" [ref=e83]
          - row "27 Slot 1/6 28 Slot 1/6 29 Slot 0/6 30 Slot 0/6 31 Slot 0/6 1 2" [ref=e84]:
            - cell "27 Slot 1/6" [ref=e85] [cursor=pointer]:
              - text: "27"
              - generic [ref=e87]: Slot 1/6
            - cell "28 Slot 1/6" [ref=e88] [cursor=pointer]:
              - text: "28"
              - generic [ref=e90]: Slot 1/6
            - cell "29 Slot 0/6" [ref=e91] [cursor=pointer]:
              - text: "29"
              - generic [ref=e93]: Slot 0/6
            - cell "30 Slot 0/6" [ref=e94] [cursor=pointer]:
              - text: "30"
              - generic [ref=e96]: Slot 0/6
            - cell "31 Slot 0/6" [ref=e97] [cursor=pointer]:
              - text: "31"
              - generic [ref=e99]: Slot 0/6
            - cell "1" [ref=e100]
            - cell "2" [ref=e101]
      - generic [ref=e103]:
        - generic [ref=e104]: Booked 0 of 1 appointments.
        - button "Confirm Appointment" [ref=e106] [cursor=pointer]
  - generic [ref=e107]:
    - generic [ref=e108]:
      - button "HOME" [ref=e109] [cursor=pointer]
      - button "INSURANCE" [ref=e110] [cursor=pointer]
      - button "REPORTS" [ref=e111] [cursor=pointer]
      - button "SETTINGS" [ref=e112] [cursor=pointer]
      - button "USER GUIDE" [ref=e113] [cursor=pointer]
      - button "DOWNLOAD" [ref=e114] [cursor=pointer]
      - button "CONTACT US" [ref=e115] [cursor=pointer]
    - table [ref=e116]:
      - rowgroup [ref=e117]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e118]:
          - cell "Online Services - Service Hub" [ref=e119]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e120]:
            - list [ref=e121]:
              - listitem [ref=e122]:
                - img [ref=e123]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e124]: "|"
              - listitem [ref=e125]:
                - link "Logout" [ref=e126] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e128]
  - generic [ref=e129]:
    - generic [ref=e131]:
      - generic [ref=e132]:
        - link "Contact Us" [ref=e133] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e134]: "|"
        - link "Terms & Conditions" [ref=e135] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e136]: "|"
        - link "Privacy" [ref=e137] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e138]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e139]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e141]
```

# Test source

```ts
  17  |   /** Find the currently booked date (has si-bookbadge = orange tag) */
  18  |   async findBookedDate(): Promise<string | null> {
  19  |     const cells = await this.page.locator("td[data-date] .si-bookbadge").all();
  20  |     if (cells.length === 0) return null;
  21  |     const parent = cells[0].locator("xpath=ancestor::td");
  22  |     return await parent.getAttribute("data-date");
  23  |   }
  24  | 
  25  |   /** Find the first bookable date on the calendar (has si-book class) */
  26  |   async findFirstBookableDate(): Promise<string | null> {
  27  |     const cells = await this.page.locator("td.si-book[data-date]").all();
  28  |     if (cells.length === 0) return null;
  29  |     return await cells[0].getAttribute("data-date");
  30  |   }
  31  | 
  32  |   /**
  33  |    * Confirm the reschedule. Per SRD 2.3.2.1 #6 (Reschedule Flow), clicking
  34  |    * "Confirm Appointment" raises a confirmation popup:
  35  |    *   "Are you sure you want to reschedule? By proceeding you will lost
  36  |    *    your current appointment."  [Yes] [No]
  37  |    * Yes proceeds; No returns to the calendar to pick another date.
  38  |    */
  39  |   async confirmReschedule(accept: boolean = true) {
  40  |     await this.demoHighlight(this.confirmBookingBtn, { color: "green" });
  41  |     await this.confirmBookingBtn.click();
  42  |     await this.waitForDialog();
  43  |     // Let the reviewer read the "Are you sure you want to reschedule?" popup.
  44  |     await this.demoHighlight(accept ? ".confirm-dialog-btn" : ".cancel-dialog-btn", { color: accept ? "green" : "red" });
  45  |     if (accept) {
  46  |       await this.acceptConfirmDialog();
  47  |     } else {
  48  |       await this.dismissConfirmDialog();
  49  |     }
  50  |     await this.waitForNav();
  51  |     await this.demoPause();
  52  |   }
  53  | 
  54  |   /**
  55  |    * Full reschedule flow (already on the reschedule calendar page):
  56  |    * 1. Click booked (orange) date → minus to remove → Save changes
  57  |    * 2. Click new bookable date → plus to add slot → Save changes
  58  |    * 3. Confirm Appointment → accept the reschedule confirmation popup
  59  |    * 4. Done
  60  |    *
  61  |    * @param slot - 0 = morning (10:00am-12:00pm), 1 = afternoon (2:00pm-4:00pm)
  62  |    */
  63  |   async rescheduleToNewDate(opts: {
  64  |     oldDate: string;
  65  |     newDate: string;
  66  |     slot: number;
  67  |     units?: number;
  68  |   }) {
  69  |     const { oldDate, newDate, slot, units = 1 } = opts;
  70  |     const slotName = slot === 0 ? "morning" : "afternoon";
  71  | 
  72  |     // Step 1: If the currently-booked date is still openable, clear it first.
  73  |     // When the booked date sits inside the +2-day blackout (si-muted) — e.g.
  74  |     // the appointment is today/tomorrow — it can't be opened, and that's fine:
  75  |     // confirming the reschedule discards the current appointment anyway
  76  |     // ("you will lose your current appointment"), so we simply skip removal.
  77  |     await test.step(`Clear the existing booking on ${oldDate}`, async () => {
  78  |       if (await this.isDayBookable(oldDate)) {
  79  |         await this.openSlotModal(oldDate);
  80  |         for (let s = 0; s < 2; s++) {
  81  |           const countEl = s === 0 ? this.morningCount : this.afternoonCount;
  82  |           const val = Number(await countEl.inputValue()) || 0;
  83  |           if (val > 0) await this.removeSlot(s);
  84  |         }
  85  |         await this.saveSlotChanges();
  86  |       }
  87  |     });
  88  | 
  89  |     await test.step(`Pick new date ${newDate} and allocate the ${slotName} session`, async () => {
  90  |       await this.openSlotModal(newDate);
  91  |       await this.incrementSlot(slot, units);
  92  |       await this.saveSlotChanges();
  93  |     });
  94  | 
  95  |     await test.step('Confirm reschedule (accept "you will lose your current appointment")', async () => {
  96  |       await this.confirmReschedule(true);
  97  |     });
  98  | 
  99  |     await test.step("Land on the confirmation page and click Done", async () => {
  100 |       await this.doneBtn.waitFor({ state: "visible", timeout: 10000 });
  101 |       await this.doneBtn.click();
  102 |       await this.waitForNav();
  103 |     });
  104 |   }
  105 | 
  106 |   /**
  107 |    * Verify the +2-day blackout rule (SRD 2.3.2.1 #6 Rules, Via UCD Portal):
  108 |    *  1. Today and tomorrow must NOT be bookable.
  109 |    *  2. The earliest *bookable* date must be at least today+2 (it may be
  110 |    *     later than +2 if the +2 date is full — availability fallback).
  111 |    */
  112 |   async verifyBlackoutDates() {
  113 |     await test.step("Expected: +2-day blackout — today & tomorrow not bookable", async () => {
  114 |       const today = this.today();
  115 |       const tomorrow = this.daysFromToday(1);
  116 |       expect(await this.isDayBookable(today)).toBe(false);
> 117 |       expect(await this.isDayBookable(tomorrow)).toBe(false);
      |                                                  ^ Error: expect(received).toBe(expected) // Object.is equality
  118 | 
  119 |       const earliest = await this.findFirstBookableDate();
  120 |       expect(earliest).not.toBeNull();
  121 |       // Earliest bookable must be on or after today+2 (availability fallback
  122 |       // means it can be later, never earlier).
  123 |       expect(earliest! >= this.earliestRescheduleDate()).toBe(true);
  124 |     });
  125 |   }
  126 | 
  127 |   /** Verify there is at least one bookable date on the calendar */
  128 |   async verifyHasBookableDates() {
  129 |     const firstBookable = await this.findFirstBookableDate();
  130 |     expect(firstBookable).not.toBeNull();
  131 |   }
  132 | 
  133 |   /**
  134 |    * SRD 2.3.2.1 #5 (Reschedule Flow, note iii): same-day reschedule is
  135 |    * allowed to proceed via the portal, but the affected installation
  136 |    * record is then set to Status = "Failed" with the system remark
  137 |    * "UCD rescheduled on the same day."
  138 |    *
  139 |    * NOTE: the SRD is internally ambiguous here — rule 1 (+2 blackout)
  140 |    * greys out today, yet this note says selecting today is allowed. Only
  141 |    * call this if today is actually selectable on the calendar; the caller
  142 |    * is responsible for verifying the resulting Failed status + remark on
  143 |    * the Service Request Details / listing afterwards
  144 |    * (ENV.text.sameDayRescheduleRemark).
  145 |    */
  146 |   async rescheduleToToday(opts: { oldDate: string; slot: number; units?: number }) {
  147 |     const { oldDate, slot, units = 1 } = opts;
  148 |     const today = this.today();
  149 | 
  150 |     // Clear the old booking only if that date is still openable (see
  151 |     // rescheduleToNewDate) — otherwise the confirm discards it for us.
  152 |     if (await this.isDayBookable(oldDate)) {
  153 |       await this.openSlotModal(oldDate);
  154 |       for (let s = 0; s < 2; s++) {
  155 |         const countEl = s === 0 ? this.morningCount : this.afternoonCount;
  156 |         const val = Number(await countEl.inputValue()) || 0;
  157 |         if (val > 0) await this.removeSlot(s);
  158 |       }
  159 |       await this.saveSlotChanges();
  160 |     }
  161 | 
  162 |     await this.openSlotModal(today);
  163 |     await this.incrementSlot(slot, units);
  164 |     await this.saveSlotChanges();
  165 | 
  166 |     await this.confirmReschedule(true);
  167 |     await this.doneBtn.waitFor({ state: "visible", timeout: 10000 });
  168 |     await this.doneBtn.click();
  169 |     await this.waitForNav();
  170 |   }
  171 | 
  172 |   /** The exact system remark expected after a same-day portal reschedule. */
  173 |   get sameDayRescheduleRemark(): string {
  174 |     return ENV.text.sameDayRescheduleRemark;
  175 |   }
  176 | }
  177 | 
```