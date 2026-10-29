# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reschedule-handling.spec.ts >> Reschedule & Handling >> UCD >> Reschedule on the day of the initial appointment to a future date
- Location: tests\service-hub\specs\reschedule-handling.spec.ts:20:9

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
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
          - generic [ref=e17]: Reschedule Software Installation
          - generic [ref=e18]: Your current appointment(s) are marked Booked. Remove installation(s) from a booked date, then re-allocate all 1 to another date/time slot (up to 3 per slot).
      - generic [ref=e19]:
        - generic [ref=e20]: Please select a date to book for software installation
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
          - row "13 14 15 Slot 6/6 16 Slot 6/6 17 Slot 3/6 18 19" [ref=e51]:
            - cell "13" [ref=e52]:
              - generic [ref=e53]: "13"
            - cell "14" [ref=e54]
            - cell "15 Slot 6/6" [ref=e55]:
              - text: "15"
              - generic [ref=e57]: Slot 6/6
            - cell "16 Slot 6/6" [ref=e58]:
              - text: "16"
              - generic [ref=e60]: Slot 6/6
            - cell "17 Slot 3/6" [ref=e61] [cursor=pointer]:
              - text: "17"
              - generic [ref=e63]: Slot 3/6
            - cell "18" [ref=e64]
            - cell "19" [ref=e65]
          - row "20 Slot 0/6 21 Slot 1/6 22 Slot 1/6 23 Slot 6/6 24 Booked (1) Slot 2/6 25 26" [ref=e66]:
            - cell "20 Slot 0/6" [ref=e67] [cursor=pointer]:
              - text: "20"
              - generic [ref=e69]: Slot 0/6
            - cell "21 Slot 1/6" [ref=e70] [cursor=pointer]:
              - text: "21"
              - generic [ref=e72]: Slot 1/6
            - cell "22 Slot 1/6" [ref=e73] [cursor=pointer]:
              - text: "22"
              - generic [ref=e75]: Slot 1/6
            - cell "23 Slot 6/6" [ref=e76]:
              - text: "23"
              - generic [ref=e78]: Slot 6/6
            - cell "24 Booked (1) Slot 2/6" [ref=e79] [cursor=pointer]:
              - text: "24"
              - generic [ref=e80]:
                - generic [ref=e81]: Booked (1)
                - generic [ref=e82]: Slot 2/6
            - cell "25" [ref=e83]
            - cell "26" [ref=e84]
          - row "27 Slot 0/6 28 Slot 4/6 29 Slot 2/6 30 Slot 1/6 31 Slot 0/6 1 2" [ref=e85]:
            - cell "27 Slot 0/6" [ref=e86] [cursor=pointer]:
              - text: "27"
              - generic [ref=e88]: Slot 0/6
            - cell "28 Slot 4/6" [ref=e89] [cursor=pointer]:
              - text: "28"
              - generic [ref=e91]: Slot 4/6
            - cell "29 Slot 2/6" [ref=e92] [cursor=pointer]:
              - text: "29"
              - generic [ref=e94]: Slot 2/6
            - cell "30 Slot 1/6" [ref=e95] [cursor=pointer]:
              - text: "30"
              - generic [ref=e97]: Slot 1/6
            - cell "31 Slot 0/6" [ref=e98] [cursor=pointer]:
              - text: "31"
              - generic [ref=e100]: Slot 0/6
            - cell "1" [ref=e101]
            - cell "2" [ref=e102]
      - generic [ref=e103]:
        - generic [ref=e104]: Booked 1 of 1
        - generic [ref=e105]: Click a booked (orange) date to remove, or a new date to add.
        - button "Confirm Appointment" [ref=e107] [cursor=pointer]
  - generic [ref=e108]:
    - generic [ref=e109]:
      - button "HOME" [ref=e110] [cursor=pointer]
      - button "INSURANCE" [ref=e111] [cursor=pointer]
      - button "REPORTS" [ref=e112] [cursor=pointer]
      - button "SETTINGS" [ref=e113] [cursor=pointer]
      - button "USER GUIDE" [ref=e114] [cursor=pointer]
      - button "DOWNLOAD" [ref=e115] [cursor=pointer]
      - button "CONTACT US" [ref=e116] [cursor=pointer]
    - table [ref=e117]:
      - rowgroup [ref=e118]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e119]:
          - cell "Online Services - Service Hub" [ref=e120]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e121]:
            - list [ref=e122]:
              - listitem [ref=e123]:
                - img [ref=e124]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e125]: "|"
              - listitem [ref=e126]:
                - link "Logout" [ref=e127] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e129]
  - generic [ref=e130]:
    - generic [ref=e132]:
      - generic [ref=e133]:
        - link "Contact Us" [ref=e134] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e135]: "|"
        - link "Terms & Conditions" [ref=e136] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e137]: "|"
        - link "Privacy" [ref=e138] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e139]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e140]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e142]
```

# Test source

```ts
  1  | import { type Page, expect } from "@playwright/test";
  2  | import { SlotPickerComponent } from "./SlotPickerComponent";
  3  | import { PATHS } from "../utils/config";
  4  | 
  5  | export class ReschedulePage extends SlotPickerComponent {
  6  |   readonly doneBtn = this.page.getByText("Done", { exact: false });
  7  | 
  8  |   constructor(page: Page) {
  9  |     super(page);
  10 |   }
  11 | 
  12 |   async navigate(txnId: string) {
  13 |     await this.goto(PATHS.reschedule(txnId));
  14 |   }
  15 | 
  16 |   /**
  17 |    * Full reschedule flow (already on the reschedule calendar page):
  18 |    * 1. Click booked (orange) date → remove old booking
  19 |    * 2. Click new date → add slot allocation
  20 |    * 3. Save changes → Confirm Appointment → Done
  21 |    *
  22 |    * @param slot - 0 = morning (10:00am-12:00pm), 1 = afternoon (2:00pm-4:00pm)
  23 |    */
  24 |   async rescheduleToNewDate(opts: {
  25 |     oldDate: string;
  26 |     newDate: string;
  27 |     slot: number;
  28 |     units?: number;
  29 |   }) {
  30 |     const { oldDate, newDate, slot, units = 1 } = opts;
  31 | 
  32 |     // Step 1: Click the booked (orange) date and remove
  33 |     await this.openSlotModal(oldDate);
  34 |     for (let s = 0; s < 2; s++) {
  35 |       const countEl = s === 0 ? this.morningCount : this.afternoonCount;
  36 |       const val = Number(await countEl.inputValue()) || 0;
  37 |       if (val > 0) await this.removeSlot(s);
  38 |     }
  39 |     await this.saveSlotChanges();
  40 | 
  41 |     // Step 2: Click the new date and allocate slot
  42 |     await this.openSlotModal(newDate);
  43 |     await this.incrementSlot(slot, units);
  44 |     await this.saveSlotChanges();
  45 | 
  46 |     // Step 3: Confirm appointment
  47 |     await this.confirmAppointment();
  48 | 
  49 |     // Step 4: Confirmation page — click Done
  50 |     await this.doneBtn.waitFor({ state: "visible", timeout: 10000 });
  51 |     await this.doneBtn.click();
  52 |     await this.waitForNav();
  53 |   }
  54 | 
  55 |   async verifyBlackoutDates() {
  56 |     const today = this.today();
  57 |     const tomorrow = this.daysFromToday(1);
  58 |     expect(await this.isDayBookable(today)).toBe(false);
  59 |     expect(await this.isDayBookable(tomorrow)).toBe(false);
  60 |   }
  61 | 
  62 |   async verifyEarliestDate() {
  63 |     const earliest = this.earliestRescheduleDate();
> 64 |     expect(await this.isDayBookable(earliest)).toBe(true);
     |                                                ^ Error: expect(received).toBe(expected) // Object.is equality
  65 |   }
  66 | }
  67 | 
```