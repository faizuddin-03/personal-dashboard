# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reschedule-handling.spec.ts >> Reschedule & Handling >> UCD >> Reschedule before the day of the appointment to a future date
- Location: tests\service-hub\specs\reschedule-handling.spec.ts:71:9

# Error details

```
Error: expect(received).not.toBeNull()

Received: null
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
          - row "13 14 Slot 6/6 15 Slot 6/6 16 Slot 6/6 17 Slot 6/6 18 19" [ref=e51]:
            - cell "13" [ref=e52]:
              - generic [ref=e53]: "13"
            - cell "14 Slot 6/6" [ref=e54]:
              - text: "14"
              - generic [ref=e56]: Slot 6/6
            - cell "15 Slot 6/6" [ref=e57]:
              - text: "15"
              - generic [ref=e59]: Slot 6/6
            - cell "16 Slot 6/6" [ref=e60]:
              - text: "16"
              - generic [ref=e62]: Slot 6/6
            - cell "17 Slot 6/6" [ref=e63]:
              - text: "17"
              - generic [ref=e65]: Slot 6/6
            - cell "18" [ref=e66]
            - cell "19" [ref=e67]
          - row "20 Slot 6/6 21 Slot 6/6 22 Slot 6/6 23 Slot 6/6 24 Slot 6/6 25 26" [ref=e68]:
            - cell "20 Slot 6/6" [ref=e69]:
              - text: "20"
              - generic [ref=e71]: Slot 6/6
            - cell "21 Slot 6/6" [ref=e72]:
              - text: "21"
              - generic [ref=e74]: Slot 6/6
            - cell "22 Slot 6/6" [ref=e75]:
              - text: "22"
              - generic [ref=e77]: Slot 6/6
            - cell "23 Slot 6/6" [ref=e78]:
              - text: "23"
              - generic [ref=e80]: Slot 6/6
            - cell "24 Slot 6/6" [ref=e81]:
              - text: "24"
              - generic [ref=e83]: Slot 6/6
            - cell "25" [ref=e84]
            - cell "26" [ref=e85]
          - row "27 Slot 3/6 28 Slot 6/6 29 Slot 5/6 30 Slot 6/6 31 Slot 3/6 1 2" [ref=e86]:
            - cell "27 Slot 3/6" [ref=e87] [cursor=pointer]:
              - text: "27"
              - generic [ref=e89]: Slot 3/6
            - cell "28 Slot 6/6" [ref=e90]:
              - text: "28"
              - generic [ref=e92]: Slot 6/6
            - cell "29 Slot 5/6" [ref=e93] [cursor=pointer]:
              - text: "29"
              - generic [ref=e95]: Slot 5/6
            - cell "30 Slot 6/6" [ref=e96]:
              - text: "30"
              - generic [ref=e98]: Slot 6/6
            - cell "31 Slot 3/6" [ref=e99] [cursor=pointer]:
              - text: "31"
              - generic [ref=e101]: Slot 3/6
            - cell "1" [ref=e102]
            - cell "2" [ref=e103]
      - generic [ref=e105]:
        - generic [ref=e106]: Booked 0 of 4 appointments.
        - button "Confirm Appointment" [ref=e108] [cursor=pointer]
  - generic [ref=e109]:
    - generic [ref=e110]:
      - button "HOME" [ref=e111] [cursor=pointer]
      - button "INSURANCE" [ref=e112] [cursor=pointer]
      - button "REPORTS" [ref=e113] [cursor=pointer]
      - button "SETTINGS" [ref=e114] [cursor=pointer]
      - button "USER GUIDE" [ref=e115] [cursor=pointer]
      - button "DOWNLOAD" [ref=e116] [cursor=pointer]
      - button "CONTACT US" [ref=e117] [cursor=pointer]
    - table [ref=e118]:
      - rowgroup [ref=e119]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e120]:
          - cell "Online Services - Service Hub" [ref=e121]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e122]:
            - list [ref=e123]:
              - listitem [ref=e124]:
                - img [ref=e125]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e126]: "|"
              - listitem [ref=e127]:
                - link "Logout" [ref=e128] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e130]
  - generic [ref=e131]:
    - generic [ref=e133]:
      - generic [ref=e134]:
        - link "Contact Us" [ref=e135] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e136]: "|"
        - link "Terms & Conditions" [ref=e137] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e138]: "|"
        - link "Privacy" [ref=e139] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e140]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e141]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e143]
```

# Test source

```ts
  1   | import { test, expect } from "../fixtures/test-fixtures";
  2   | import { ENV } from "../utils/config";
  3   | 
  4   | const MORNING = 0;
  5   | const AFTERNOON = 1;
  6   | 
  7   | test.describe("Reschedule & Handling", () => {
  8   |   // ────────────────────────────────────────────────────────────
  9   |   // UCD — Self-service reschedule via Service Request Listing
  10  |   // Flow: Listing → Search Now → click Reschedule in action column
  11  |   //       → Calendar opens → click booked (orange) date → minus to
  12  |   //       remove → Save changes → click new date → plus to add slot
  13  |   //       → Save changes → Confirm Appointment → Done
  14  |   // ────────────────────────────────────────────────────────────
  15  |   test.describe("UCD", () => {
  16  |     test.beforeEach(async ({ loginPage }) => {
  17  |       await loginPage.loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
  18  |     });
  19  | 
  20  |     test("Reschedule on the day of the initial appointment to a future date", async ({
  21  |       listingPage,
  22  |       reschedulePage,
  23  |     }) => {
  24  |       // Scenario: appointment exists on some date. UCD opens listing,
  25  |       // clicks Reschedule, calendar opens. UCD removes the old booking
  26  |       // and picks a new available date. +2 day blackout applies.
  27  | 
  28  |       await listingPage.navigate();
  29  |       await listingPage.searchBtn.click();
  30  |       await listingPage.waitForNav();
  31  | 
  32  |       const rows = await listingPage.getResultRows();
  33  |       expect(rows.length).toBeGreaterThan(0);
  34  | 
  35  |       let targetRow = null;
  36  |       for (const row of rows) {
  37  |         if (await listingPage.hasRescheduleAction(row)) {
  38  |           targetRow = row;
  39  |           break;
  40  |         }
  41  |       }
  42  |       if (!targetRow) {
  43  |         test.skip(true, "No appointment with Reschedule action available");
  44  |         return;
  45  |       }
  46  | 
  47  |       // Click Reschedule → calendar page opens
  48  |       await listingPage.clickReschedule(targetRow);
  49  | 
  50  |       // Verify blackout: today and tomorrow are NOT bookable
  51  |       await reschedulePage.verifyBlackoutDates();
  52  | 
  53  |       // Verify there are bookable dates available
  54  |       await reschedulePage.verifyHasBookableDates();
  55  | 
  56  |       // Find the currently booked date (orange badge) and first available date
  57  |       const bookedDate = await reschedulePage.findBookedDate();
  58  |       expect(bookedDate).not.toBeNull();
  59  | 
  60  |       const newDate = await reschedulePage.findFirstBookableDate();
  61  |       expect(newDate).not.toBeNull();
  62  | 
  63  |       // Reschedule: remove from booked date → pick new date
  64  |       await reschedulePage.rescheduleToNewDate({
  65  |         oldDate: bookedDate!,
  66  |         newDate: newDate!,
  67  |         slot: MORNING,
  68  |       });
  69  |     });
  70  | 
  71  |     test("Reschedule before the day of the appointment to a future date", async ({
  72  |       listingPage,
  73  |       reschedulePage,
  74  |     }) => {
  75  |       // Scenario: UCD reschedules BEFORE the appointment day.
  76  |       // Same flow — the booked date is in the future.
  77  | 
  78  |       await listingPage.navigate();
  79  |       await listingPage.searchBtn.click();
  80  |       await listingPage.waitForNav();
  81  | 
  82  |       const rows = await listingPage.getResultRows();
  83  |       let targetRow = null;
  84  |       for (const row of rows) {
  85  |         if (await listingPage.hasRescheduleAction(row)) {
  86  |           targetRow = row;
  87  |           break;
  88  |         }
  89  |       }
  90  |       if (!targetRow) {
  91  |         test.skip(true, "No appointment with Reschedule action available");
  92  |         return;
  93  |       }
  94  | 
  95  |       await listingPage.clickReschedule(targetRow);
  96  | 
  97  |       await reschedulePage.verifyBlackoutDates();
  98  |       await reschedulePage.verifyHasBookableDates();
  99  | 
  100 |       const bookedDate = await reschedulePage.findBookedDate();
> 101 |       expect(bookedDate).not.toBeNull();
      |                              ^ Error: expect(received).not.toBeNull()
  102 | 
  103 |       // Find a bookable date that is NOT the same as the booked date
  104 |       const allBookable = await reschedulePage.page.locator("td.si-book[data-date]").all();
  105 |       let newDate: string | null = null;
  106 |       for (const cell of allBookable) {
  107 |         const date = await cell.getAttribute("data-date");
  108 |         if (date && date !== bookedDate) {
  109 |           newDate = date;
  110 |           break;
  111 |         }
  112 |       }
  113 |       expect(newDate).not.toBeNull();
  114 | 
  115 |       await reschedulePage.rescheduleToNewDate({
  116 |         oldDate: bookedDate!,
  117 |         newDate: newDate!,
  118 |         slot: AFTERNOON,
  119 |       });
  120 |     });
  121 | 
  122 |     test("Reschedule after 1 appointment has successfully finished", async ({
  123 |       listingPage,
  124 |     }) => {
  125 |       // Scenario: UCD bought multiple software installations (e.g. 3).
  126 |       // 1 installation has been completed (marked by BO).
  127 |       // The remaining appointments should still be reschedulable.
  128 | 
  129 |       await listingPage.navigate();
  130 |       await listingPage.searchWithFilters({
  131 |         serviceType: "SOFTWARE_INSTALLATION",
  132 |       });
  133 | 
  134 |       const rows = await listingPage.getResultRows();
  135 |       if (rows.length === 0) {
  136 |         test.skip(true, "No software installation appointments found");
  137 |         return;
  138 |       }
  139 | 
  140 |       // Look for a row with Reschedule action (remaining from multi-unit)
  141 |       let reschedulableRow = null;
  142 |       for (const row of rows) {
  143 |         if (await listingPage.hasRescheduleAction(row)) {
  144 |           reschedulableRow = row;
  145 |           break;
  146 |         }
  147 |       }
  148 | 
  149 |       // Even though 1 appointment is completed, remaining ones should
  150 |       // still have the Reschedule option
  151 |       expect(reschedulableRow).not.toBeNull();
  152 | 
  153 |       // Verify the reschedule flow works
  154 |       await listingPage.clickReschedule(reschedulableRow!);
  155 |       // Calendar should open — verify there are bookable dates
  156 |       const firstBookable = await listingPage.page.locator("td.si-book[data-date]").first();
  157 |       await expect(firstBookable).toBeVisible();
  158 |     });
  159 | 
  160 |     test("Slot taken mid selection — concurrency", async ({
  161 |       listingPage,
  162 |       reschedulePage,
  163 |       browser,
  164 |     }) => {
  165 |       await listingPage.navigate();
  166 |       await listingPage.searchBtn.click();
  167 |       await listingPage.waitForNav();
  168 | 
  169 |       const rows = await listingPage.getResultRows();
  170 |       let targetRow = null;
  171 |       for (const row of rows) {
  172 |         if (await listingPage.hasRescheduleAction(row)) {
  173 |           targetRow = row;
  174 |           break;
  175 |         }
  176 |       }
  177 |       if (!targetRow) {
  178 |         test.skip(true, "No appointment with Reschedule action available");
  179 |         return;
  180 |       }
  181 | 
  182 |       await listingPage.clickReschedule(targetRow);
  183 | 
  184 |       const firstBookable = await reschedulePage.findFirstBookableDate();
  185 |       if (!firstBookable) {
  186 |         test.skip(true, "No bookable dates available");
  187 |         return;
  188 |       }
  189 | 
  190 |       await reschedulePage.openSlotModal(firstBookable);
  191 |       const initialBooked = await reschedulePage.getModalSlotBooked(MORNING);
  192 | 
  193 |       // UCD2: would book the same last slot in a parallel context
  194 |       // NOTE: requires second UCD account (ENV.ucd2Username / ENV.ucd2Password)
  195 | 
  196 |       await reschedulePage.incrementSlot(MORNING, 1);
  197 |       await reschedulePage.saveSlotChanges();
  198 |     });
  199 | 
  200 |     test("Reschedule cancelled appointment — should be blocked", async ({
  201 |       browser,
```