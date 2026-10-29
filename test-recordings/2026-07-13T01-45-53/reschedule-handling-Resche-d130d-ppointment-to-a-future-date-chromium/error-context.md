# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reschedule-handling.spec.ts >> Reschedule & Handling >> UCD >> Reschedule on the day of the initial appointment to a future date
- Location: tests\service-hub\specs\reschedule-handling.spec.ts:20:9

# Error details

```
TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
Call log:
  - waiting for getByText('Done') to be visible

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
      - generic [ref=e19]: Incomplete appointment allocation. Please select a date and time slot to each software installation.
      - generic [ref=e20]:
        - generic [ref=e21]: Please select a date to book for software installation
        - generic [ref=e22]:
          - generic [ref=e23]: July 2026
          - generic [ref=e24] [cursor=pointer]: ›
      - table [ref=e25]:
        - rowgroup [ref=e26]:
          - row "MON TUE WED THUR FRI SAT SUN" [ref=e27]:
            - columnheader "MON" [ref=e28]
            - columnheader "TUE" [ref=e29]
            - columnheader "WED" [ref=e30]
            - columnheader "THUR" [ref=e31]
            - columnheader "FRI" [ref=e32]
            - columnheader "SAT" [ref=e33]
            - columnheader "SUN" [ref=e34]
        - rowgroup [ref=e35]:
          - row "29 30 1 2 3 4 5" [ref=e36]:
            - cell "29" [ref=e37]
            - cell "30" [ref=e38]
            - cell "1" [ref=e39]
            - cell "2" [ref=e40]
            - cell "3" [ref=e41]
            - cell "4" [ref=e42]
            - cell "5" [ref=e43]
          - row "6 7 8 9 10 11 12" [ref=e44]:
            - cell "6" [ref=e45]
            - cell "7" [ref=e46]
            - cell "8" [ref=e47]
            - cell "9" [ref=e48]
            - cell "10" [ref=e49]
            - cell "11" [ref=e50]
            - cell "12" [ref=e51]
          - row "13 14 15 Slot 6/6 16 Slot 6/6 17 Slot 3/6 18 19" [ref=e52]:
            - cell "13" [ref=e53]:
              - generic [ref=e54]: "13"
            - cell "14" [ref=e55]
            - cell "15 Slot 6/6" [ref=e56]:
              - text: "15"
              - generic [ref=e58]: Slot 6/6
            - cell "16 Slot 6/6" [ref=e59]:
              - text: "16"
              - generic [ref=e61]: Slot 6/6
            - cell "17 Slot 3/6" [ref=e62] [cursor=pointer]:
              - text: "17"
              - generic [ref=e64]: Slot 3/6
            - cell "18" [ref=e65]
            - cell "19" [ref=e66]
          - row "20 Slot 0/6 21 Slot 1/6 22 Slot 1/6 23 Slot 6/6 24 Slot 1/6 25 26" [ref=e67]:
            - cell "20 Slot 0/6" [ref=e68] [cursor=pointer]:
              - text: "20"
              - generic [ref=e70]: Slot 0/6
            - cell "21 Slot 1/6" [ref=e71] [cursor=pointer]:
              - text: "21"
              - generic [ref=e73]: Slot 1/6
            - cell "22 Slot 1/6" [ref=e74] [cursor=pointer]:
              - text: "22"
              - generic [ref=e76]: Slot 1/6
            - cell "23 Slot 6/6" [ref=e77]:
              - text: "23"
              - generic [ref=e79]: Slot 6/6
            - cell "24 Slot 1/6" [ref=e80] [cursor=pointer]:
              - text: "24"
              - generic [ref=e82]: Slot 1/6
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
        - generic [ref=e104]: Booked 0 of 1
        - generic [ref=e105]: Click a booked (orange) date to remove installations, then a new date to re-allocate.
        - button "Confirm Appointment" [ref=e107]
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
  7  |   readonly confirmBookingBtn = this.page.locator("#si-confirm-booking");
  8  | 
  9  |   constructor(page: Page) {
  10 |     super(page);
  11 |   }
  12 | 
  13 |   async navigate(txnId: string) {
  14 |     await this.goto(PATHS.reschedule(txnId));
  15 |   }
  16 | 
  17 |   /** Find the currently booked date (has si-bookbadge = orange tag) */
  18 |   async findBookedDate(): Promise<string | null> {
  19 |     const cells = await this.page.locator("td[data-date] .si-bookbadge").all();
  20 |     if (cells.length === 0) return null;
  21 |     const parent = cells[0].locator("xpath=ancestor::td");
  22 |     return await parent.getAttribute("data-date");
  23 |   }
  24 | 
  25 |   /** Find the first bookable date on the calendar (has si-book class) */
  26 |   async findFirstBookableDate(): Promise<string | null> {
  27 |     const cells = await this.page.locator("td.si-book[data-date]").all();
  28 |     if (cells.length === 0) return null;
  29 |     return await cells[0].getAttribute("data-date");
  30 |   }
  31 | 
  32 |   /**
  33 |    * Full reschedule flow (already on the reschedule calendar page):
  34 |    * 1. Click booked (orange) date → minus to remove → Save changes
  35 |    * 2. Click new bookable date → plus to add slot → Save changes
  36 |    * 3. Confirm Appointment → Done
  37 |    *
  38 |    * @param slot - 0 = morning (10:00am-12:00pm), 1 = afternoon (2:00pm-4:00pm)
  39 |    */
  40 |   async rescheduleToNewDate(opts: {
  41 |     oldDate: string;
  42 |     newDate: string;
  43 |     slot: number;
  44 |     units?: number;
  45 |   }) {
  46 |     const { oldDate, newDate, slot, units = 1 } = opts;
  47 | 
  48 |     // Step 1: Click the booked (orange) date and remove
  49 |     await this.openSlotModal(oldDate);
  50 |     for (let s = 0; s < 2; s++) {
  51 |       const countEl = s === 0 ? this.morningCount : this.afternoonCount;
  52 |       const val = Number(await countEl.inputValue()) || 0;
  53 |       if (val > 0) await this.removeSlot(s);
  54 |     }
  55 |     await this.saveSlotChanges();
  56 | 
  57 |     // Step 2: Click the new date and allocate slot
  58 |     await this.openSlotModal(newDate);
  59 |     await this.incrementSlot(slot, units);
  60 |     await this.saveSlotChanges();
  61 | 
  62 |     // Step 3: Confirm appointment
  63 |     await this.confirmBookingBtn.click();
  64 |     await this.waitForNav();
  65 | 
  66 |     // Step 4: Confirmation page — click Done
> 67 |     await this.doneBtn.waitFor({ state: "visible", timeout: 10000 });
     |                        ^ TimeoutError: locator.waitFor: Timeout 10000ms exceeded.
  68 |     await this.doneBtn.click();
  69 |     await this.waitForNav();
  70 |   }
  71 | 
  72 |   /** Verify today and tomorrow are muted (blackout rule) */
  73 |   async verifyBlackoutDates() {
  74 |     const today = this.today();
  75 |     const tomorrow = this.daysFromToday(1);
  76 |     expect(await this.isDayBookable(today)).toBe(false);
  77 |     expect(await this.isDayBookable(tomorrow)).toBe(false);
  78 |   }
  79 | 
  80 |   /** Verify there is at least one bookable date on the calendar */
  81 |   async verifyHasBookableDates() {
  82 |     const firstBookable = await this.findFirstBookableDate();
  83 |     expect(firstBookable).not.toBeNull();
  84 |   }
  85 | }
  86 | 
```