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
          - generic [ref=e22] [cursor=pointer]: ‹
          - generic [ref=e23]: August 2026
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
          - row "27 28 29 30 31 1 2" [ref=e35]:
            - cell "27" [ref=e36]
            - cell "28" [ref=e37]
            - cell "29" [ref=e38]
            - cell "30" [ref=e39]
            - cell "31" [ref=e40]
            - cell "1" [ref=e41]
            - cell "2" [ref=e42]
          - row "3 Slot 0/6 4 Slot 0/6 5 Slot 0/6 6 Slot 0/6 7 Slot 0/6 8 9" [ref=e43]:
            - cell "3 Slot 0/6" [ref=e44] [cursor=pointer]:
              - text: "3"
              - generic [ref=e46]: Slot 0/6
            - cell "4 Slot 0/6" [ref=e47] [cursor=pointer]:
              - text: "4"
              - generic [ref=e49]: Slot 0/6
            - cell "5 Slot 0/6" [ref=e50] [cursor=pointer]:
              - text: "5"
              - generic [ref=e52]: Slot 0/6
            - cell "6 Slot 0/6" [ref=e53] [cursor=pointer]:
              - text: "6"
              - generic [ref=e55]: Slot 0/6
            - cell "7 Slot 0/6" [ref=e56] [cursor=pointer]:
              - text: "7"
              - generic [ref=e58]: Slot 0/6
            - cell "8" [ref=e59]
            - cell "9" [ref=e60]
          - row "10 Slot 0/6 11 Slot 0/6 12 Slot 0/6 13 Slot 0/6 14 Slot 0/6 15 16" [ref=e61]:
            - cell "10 Slot 0/6" [ref=e62] [cursor=pointer]:
              - text: "10"
              - generic [ref=e64]: Slot 0/6
            - cell "11 Slot 0/6" [ref=e65] [cursor=pointer]:
              - text: "11"
              - generic [ref=e67]: Slot 0/6
            - cell "12 Slot 0/6" [ref=e68] [cursor=pointer]:
              - text: "12"
              - generic [ref=e70]: Slot 0/6
            - cell "13 Slot 0/6" [ref=e71] [cursor=pointer]:
              - text: "13"
              - generic [ref=e73]: Slot 0/6
            - cell "14 Slot 0/6" [ref=e74] [cursor=pointer]:
              - text: "14"
              - generic [ref=e76]: Slot 0/6
            - cell "15" [ref=e77]
            - cell "16" [ref=e78]
          - row "17 Slot 0/6 18 Slot 0/6 19 Slot 0/6 20 Slot 0/6 21 Slot 1/6 22 23" [ref=e79]:
            - cell "17 Slot 0/6" [ref=e80] [cursor=pointer]:
              - text: "17"
              - generic [ref=e82]: Slot 0/6
            - cell "18 Slot 0/6" [ref=e83] [cursor=pointer]:
              - text: "18"
              - generic [ref=e85]: Slot 0/6
            - cell "19 Slot 0/6" [ref=e86] [cursor=pointer]:
              - text: "19"
              - generic [ref=e88]: Slot 0/6
            - cell "20 Slot 0/6" [ref=e89] [cursor=pointer]:
              - text: "20"
              - generic [ref=e91]: Slot 0/6
            - cell "21 Slot 1/6" [ref=e92] [cursor=pointer]:
              - text: "21"
              - generic [ref=e94]: Slot 1/6
            - cell "22" [ref=e95]
            - cell "23" [ref=e96]
          - row "24 Slot 1/6 25 Slot 2/6 26 Slot 1/6 27 Slot 0/6 28 Slot 0/6 29 30" [ref=e97]:
            - cell "24 Slot 1/6" [ref=e98] [cursor=pointer]:
              - text: "24"
              - generic [ref=e100]: Slot 1/6
            - cell "25 Slot 2/6" [ref=e101] [cursor=pointer]:
              - text: "25"
              - generic [ref=e103]: Slot 2/6
            - cell "26 Slot 1/6" [ref=e104] [cursor=pointer]:
              - text: "26"
              - generic [ref=e106]: Slot 1/6
            - cell "27 Slot 0/6" [ref=e107] [cursor=pointer]:
              - text: "27"
              - generic [ref=e109]: Slot 0/6
            - cell "28 Slot 0/6" [ref=e110] [cursor=pointer]:
              - text: "28"
              - generic [ref=e112]: Slot 0/6
            - cell "29" [ref=e113]
            - cell "30" [ref=e114]
          - row "31 Public Holiday 1 2 3 4 5 6" [ref=e115]:
            - cell "31 Public Holiday" [ref=e116]:
              - text: "31"
              - generic [ref=e118]: Public Holiday
            - cell "1" [ref=e119]
            - cell "2" [ref=e120]
            - cell "3" [ref=e121]
            - cell "4" [ref=e122]
            - cell "5" [ref=e123]
            - cell "6" [ref=e124]
      - generic [ref=e126]:
        - generic [ref=e127]: Booked 0 of 1 appointments.
        - button "Confirm Appointment" [ref=e129] [cursor=pointer]
  - generic [ref=e130]:
    - generic [ref=e131]:
      - button "HOME" [ref=e132] [cursor=pointer]
      - button "INSURANCE" [ref=e133] [cursor=pointer]
      - button "REPORTS" [ref=e134] [cursor=pointer]
      - button "SETTINGS" [ref=e135] [cursor=pointer]
      - button "USER GUIDE" [ref=e136] [cursor=pointer]
      - button "DOWNLOAD" [ref=e137] [cursor=pointer]
      - button "CONTACT US" [ref=e138] [cursor=pointer]
    - table [ref=e139]:
      - rowgroup [ref=e140]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e141]:
          - cell "Online Services - Service Hub" [ref=e142]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e143]:
            - list [ref=e144]:
              - listitem [ref=e145]:
                - img [ref=e146]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e147]: "|"
              - listitem [ref=e148]:
                - link "Logout" [ref=e149] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e151]
  - generic [ref=e152]:
    - generic [ref=e154]:
      - generic [ref=e155]:
        - link "Contact Us" [ref=e156] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e157]: "|"
        - link "Terms & Conditions" [ref=e158] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e159]: "|"
        - link "Privacy" [ref=e160] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e161]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e162]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e164]
```

# Test source

```ts
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
  50  |       // Blackout-window enforcement is a boundary/negative check, not part of
  51  |       // this happy-path reschedule — verified separately in Calendar Rules.
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
  97  |       // Blackout-window enforcement is a boundary/negative check, not part of
  98  |       // this happy-path reschedule — verified separately in Calendar Rules.
  99  |       await reschedulePage.verifyHasBookableDates();
  100 | 
  101 |       const bookedDate = await reschedulePage.findBookedDate();
> 102 |       expect(bookedDate).not.toBeNull();
      |                              ^ Error: expect(received).not.toBeNull()
  103 | 
  104 |       // Find a bookable date that is NOT the same as the booked date
  105 |       const allBookable = await reschedulePage.page.locator("td.si-book[data-date]").all();
  106 |       let newDate: string | null = null;
  107 |       for (const cell of allBookable) {
  108 |         const date = await cell.getAttribute("data-date");
  109 |         if (date && date !== bookedDate) {
  110 |           newDate = date;
  111 |           break;
  112 |         }
  113 |       }
  114 |       expect(newDate).not.toBeNull();
  115 | 
  116 |       await reschedulePage.rescheduleToNewDate({
  117 |         oldDate: bookedDate!,
  118 |         newDate: newDate!,
  119 |         slot: AFTERNOON,
  120 |       });
  121 |     });
  122 | 
  123 |     test("Reschedule after 1 appointment has successfully finished", async ({
  124 |       listingPage,
  125 |     }) => {
  126 |       // Scenario: UCD bought multiple software installations (e.g. 3).
  127 |       // 1 installation has been completed (marked by BO).
  128 |       // The remaining appointments should still be reschedulable.
  129 | 
  130 |       await listingPage.navigate();
  131 |       await listingPage.searchWithFilters({
  132 |         serviceType: "SOFTWARE_INSTALLATION",
  133 |       });
  134 | 
  135 |       const rows = await listingPage.getResultRows();
  136 |       if (rows.length === 0) {
  137 |         test.skip(true, "No software installation appointments found");
  138 |         return;
  139 |       }
  140 | 
  141 |       // Look for a row with Reschedule action (remaining from multi-unit)
  142 |       let reschedulableRow = null;
  143 |       for (const row of rows) {
  144 |         if (await listingPage.hasRescheduleAction(row)) {
  145 |           reschedulableRow = row;
  146 |           break;
  147 |         }
  148 |       }
  149 | 
  150 |       // Even though 1 appointment is completed, remaining ones should
  151 |       // still have the Reschedule option
  152 |       expect(reschedulableRow).not.toBeNull();
  153 | 
  154 |       // Verify the reschedule flow works
  155 |       await listingPage.clickReschedule(reschedulableRow!);
  156 |       // Calendar should open — verify there are bookable dates
  157 |       const firstBookable = await listingPage.page.locator("td.si-book[data-date]").first();
  158 |       await expect(firstBookable).toBeVisible();
  159 |     });
  160 | 
  161 |     test("Same-day reschedule via portal — record becomes Failed", async ({
  162 |       listingPage,
  163 |       reschedulePage,
  164 |       requestDetailsPage,
  165 |     }) => {
  166 |       // SRD 2.3.2.1 #5 (note iii): if a UCD reschedules to today's date via
  167 |       // the portal, the system allows it but the affected installation
  168 |       // record is set to Status = "Failed" with the remark
  169 |       // "UCD rescheduled on the same day."
  170 |       //
  171 |       // NOTE: the SRD is internally ambiguous — the +2 blackout greys out
  172 |       // today, yet this note says selecting today is allowed. This test
  173 |       // therefore only runs when today is actually selectable, and is
  174 |       // skipped (not failed) otherwise, pending clarification.
  175 | 
  176 |       await listingPage.navigate();
  177 |       await listingPage.searchBtn.click();
  178 |       await listingPage.waitForNav();
  179 | 
  180 |       const rows = await listingPage.getResultRows();
  181 |       let targetRow = null;
  182 |       for (const row of rows) {
  183 |         if (await listingPage.hasRescheduleAction(row)) {
  184 |           targetRow = row;
  185 |           break;
  186 |         }
  187 |       }
  188 |       if (!targetRow) {
  189 |         test.skip(true, "No appointment with Reschedule action available");
  190 |         return;
  191 |       }
  192 | 
  193 |       await listingPage.clickReschedule(targetRow);
  194 | 
  195 |       if (!(await reschedulePage.isDayBookable(reschedulePage.today()))) {
  196 |         test.skip(true, "Today is not selectable on the calendar (+2 blackout in effect); same-day reschedule not reachable via portal.");
  197 |         return;
  198 |       }
  199 | 
  200 |       const bookedDate = await reschedulePage.findBookedDate();
  201 |       expect(bookedDate).not.toBeNull();
  202 | 
```