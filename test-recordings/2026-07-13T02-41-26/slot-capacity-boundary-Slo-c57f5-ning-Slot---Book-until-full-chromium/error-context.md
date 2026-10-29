# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Morning Slot - Book until full
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:20:9

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
          - generic [ref=e17]: Software Installation — Select Appointment(s)
          - generic [ref=e18]: Payment received. Allocate your 4 installations to a date and time slot (up to 3 per slot).
      - generic [ref=e19]:
        - generic [ref=e20]: Please select a date to book for software installation
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
          - row "3 Slot 3/6 4 Slot 2/6 5 Slot 2/6 6 Slot 1/6 7 Slot 3/6 8 9" [ref=e43]:
            - cell "3 Slot 3/6" [ref=e44] [cursor=pointer]:
              - text: "3"
              - generic [ref=e46]: Slot 3/6
            - cell "4 Slot 2/6" [ref=e47] [cursor=pointer]:
              - text: "4"
              - generic [ref=e49]: Slot 2/6
            - cell "5 Slot 2/6" [ref=e50] [cursor=pointer]:
              - text: "5"
              - generic [ref=e52]: Slot 2/6
            - cell "6 Slot 1/6" [ref=e53] [cursor=pointer]:
              - text: "6"
              - generic [ref=e55]: Slot 1/6
            - cell "7 Slot 3/6" [ref=e56] [cursor=pointer]:
              - text: "7"
              - generic [ref=e58]: Slot 3/6
            - cell "8" [ref=e59]
            - cell "9" [ref=e60]
          - row "10 Slot 6/6 11 Slot 3/6 12 Slot 2/6 13 Slot 1/6 14 Slot 1/6 15 16" [ref=e61]:
            - cell "10 Slot 6/6" [ref=e62]:
              - text: "10"
              - generic [ref=e64]: Slot 6/6
            - cell "11 Slot 3/6" [ref=e65] [cursor=pointer]:
              - text: "11"
              - generic [ref=e67]: Slot 3/6
            - cell "12 Slot 2/6" [ref=e68] [cursor=pointer]:
              - text: "12"
              - generic [ref=e70]: Slot 2/6
            - cell "13 Slot 1/6" [ref=e71] [cursor=pointer]:
              - text: "13"
              - generic [ref=e73]: Slot 1/6
            - cell "14 Slot 1/6" [ref=e74] [cursor=pointer]:
              - text: "14"
              - generic [ref=e76]: Slot 1/6
            - cell "15" [ref=e77]
            - cell "16" [ref=e78]
          - row "17 Slot 1/6 18 Slot 1/6 19 Slot 2/6 20 Slot 1/6 21 Slot 1/6 22 23" [ref=e79]:
            - cell "17 Slot 1/6" [ref=e80] [cursor=pointer]:
              - text: "17"
              - generic [ref=e82]: Slot 1/6
            - cell "18 Slot 1/6" [ref=e83] [cursor=pointer]:
              - text: "18"
              - generic [ref=e85]: Slot 1/6
            - cell "19 Slot 2/6" [ref=e86] [cursor=pointer]:
              - text: "19"
              - generic [ref=e88]: Slot 2/6
            - cell "20 Slot 1/6" [ref=e89] [cursor=pointer]:
              - text: "20"
              - generic [ref=e91]: Slot 1/6
            - cell "21 Slot 1/6" [ref=e92] [cursor=pointer]:
              - text: "21"
              - generic [ref=e94]: Slot 1/6
            - cell "22" [ref=e95]
            - cell "23" [ref=e96]
          - row "24 Slot 1/6 25 Slot 1/6 26 Slot 2/6 27 Slot 0/6 28 Slot 4/6 29 30" [ref=e97]:
            - cell "24 Slot 1/6" [ref=e98] [cursor=pointer]:
              - text: "24"
              - generic [ref=e100]: Slot 1/6
            - cell "25 Slot 1/6" [ref=e101] [cursor=pointer]:
              - text: "25"
              - generic [ref=e103]: Slot 1/6
            - cell "26 Slot 2/6" [ref=e104] [cursor=pointer]:
              - text: "26"
              - generic [ref=e106]: Slot 2/6
            - cell "27 Slot 0/6" [ref=e107] [cursor=pointer]:
              - text: "27"
              - generic [ref=e109]: Slot 0/6
            - cell "28 Slot 4/6" [ref=e110] [cursor=pointer]:
              - text: "28"
              - generic [ref=e112]: Slot 4/6
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
      - generic [ref=e125]:
        - generic [ref=e126]: Booked 0 of 4
        - generic [ref=e127]: Click a bookable date above to allocate an installation.
        - button "Confirm Appointment" [ref=e129] [cursor=pointer]
  - generic [ref=e131]:
    - generic [ref=e132]:
      - generic [ref=e133]: Installation Appointment
      - generic [ref=e134] [cursor=pointer]: ×
    - generic [ref=e135]:
      - generic [ref=e136]:
        - generic [ref=e137]: "Appointment Date:"
        - textbox [ref=e138]: 27-08-2026
      - generic [ref=e139]: Allocate up to 4 installations across the time slots below.
      - generic [ref=e140]:
        - generic [ref=e141]: 10:00am - 12:00pm
        - generic [ref=e142]:
          - button "−" [ref=e143] [cursor=pointer]
          - textbox [ref=e144]: "3"
          - button "+" [ref=e145] [cursor=pointer]
        - generic [ref=e146]: 3 of 3 booked
        - link "✕ Remove" [ref=e147] [cursor=pointer]:
          - /url: javascript:void(0)
      - generic [ref=e148]:
        - generic [ref=e149]: 2:00pm - 4:00pm
        - generic [ref=e150]:
          - button "−" [ref=e151] [cursor=pointer]
          - textbox [ref=e152]: "0"
          - button "+" [ref=e153]
        - generic [ref=e154]: 0 of 3 booked
      - generic [ref=e155]: "Remaining to allocate: 1"
    - generic [ref=e157]:
      - button "Cancel" [ref=e158] [cursor=pointer]
      - button "Save changes" [ref=e159] [cursor=pointer]
  - generic [ref=e160]:
    - generic [ref=e161]:
      - button "HOME" [ref=e162] [cursor=pointer]
      - button "INSURANCE" [ref=e163] [cursor=pointer]
      - button "REPORTS" [ref=e164] [cursor=pointer]
      - button "SETTINGS" [ref=e165] [cursor=pointer]
      - button "USER GUIDE" [ref=e166] [cursor=pointer]
      - button "DOWNLOAD" [ref=e167] [cursor=pointer]
      - button "CONTACT US" [ref=e168] [cursor=pointer]
    - table [ref=e169]:
      - rowgroup [ref=e170]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e171]:
          - cell "Online Services - Service Hub" [ref=e172]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e173]:
            - list [ref=e174]:
              - listitem [ref=e175]:
                - img [ref=e176]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e177]: "|"
              - listitem [ref=e178]:
                - link "Logout" [ref=e179] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e181]
  - generic [ref=e182]:
    - generic [ref=e184]:
      - generic [ref=e185]:
        - link "Contact Us" [ref=e186] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e187]: "|"
        - link "Terms & Conditions" [ref=e188] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e189]: "|"
        - link "Privacy" [ref=e190] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e191]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e192]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e194]
```

# Test source

```ts
  1   | import { test, expect } from "../fixtures/test-fixtures";
  2   | import { ENV } from "../utils/config";
  3   | 
  4   | const MORNING = 0;
  5   | const AFTERNOON = 1;
  6   | 
  7   | test.describe("Slot Capacity Boundary", () => {
  8   |   // ────────────────────────────────────────────────────────────
  9   |   // UCD — Capacity limits enforced
  10  |   // Dates are discovered dynamically (findEmptyBookableDate) instead
  11  |   // of hardcoded day-offsets, since offsets can land on weekends,
  12  |   // holidays, or already-partially-booked dates.
  13  |   // ────────────────────────────────────────────────────────────
  14  |   test.describe("UCD", () => {
  15  |     test.beforeEach(async ({ loginPage, serviceHubPage }) => {
  16  |       await loginPage.loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
  17  |       await serviceHubPage.navigate();
  18  |     });
  19  | 
  20  |     test("Morning Slot - Book until full", async ({
  21  |       softwareInstallationPage,
  22  |       slotPicker,
  23  |     }) => {
  24  |       // Single purchase of 4 installations — try to allocate all 4 into
  25  |       // the morning slot of one date, whose capacity is 3.
  26  |       await softwareInstallationPage.purchaseInstallation(ENV.slotCapacity.perSlot + 1);
  27  |       const targetDate = await slotPicker.findEmptyBookableDate();
  28  |       expect(targetDate).not.toBeNull();
  29  | 
  30  |       await slotPicker.openSlotModal(targetDate!);
  31  | 
  32  |       // Book 3 into morning — fills the slot to capacity
  33  |       await slotPicker.incrementSlot(MORNING, ENV.slotCapacity.perSlot);
  34  |       const isMorningFull = await slotPicker.isSlotFullyBooked(MORNING);
> 35  |       expect(isMorningFull).toBe(true);
      |                             ^ Error: expect(received).toBe(expected) // Object.is equality
  36  | 
  37  |       const isAfternoonFull = await slotPicker.isSlotFullyBooked(AFTERNOON);
  38  |       expect(isAfternoonFull).toBe(false);
  39  | 
  40  |       // Try to add the 4th unit to the now-full morning slot — must be rejected
  41  |       const before = await slotPicker.getModalSlotBooked(MORNING);
  42  |       await slotPicker.incrementSlot(MORNING, 1);
  43  |       const after = await slotPicker.getModalSlotBooked(MORNING);
  44  |       expect(after.booked).toBe(before.booked);
  45  | 
  46  |       // Allocate the remaining unit to the afternoon slot to complete the booking
  47  |       await slotPicker.incrementSlot(AFTERNOON, 1);
  48  |       await slotPicker.saveSlotChanges();
  49  |       await slotPicker.confirmAppointment();
  50  |     });
  51  | 
  52  |     test("Afternoon Slot - Book until full", async ({
  53  |       softwareInstallationPage,
  54  |       slotPicker,
  55  |     }) => {
  56  |       // Single purchase of 4 installations — try to allocate all 4 into
  57  |       // the afternoon slot of one date, whose capacity is 3.
  58  |       await softwareInstallationPage.purchaseInstallation(ENV.slotCapacity.perSlot + 1);
  59  |       const targetDate = await slotPicker.findEmptyBookableDate();
  60  |       expect(targetDate).not.toBeNull();
  61  | 
  62  |       await slotPicker.openSlotModal(targetDate!);
  63  | 
  64  |       // Book 3 into afternoon — fills the slot to capacity
  65  |       await slotPicker.incrementSlot(AFTERNOON, ENV.slotCapacity.perSlot);
  66  |       const isAfternoonFull = await slotPicker.isSlotFullyBooked(AFTERNOON);
  67  |       expect(isAfternoonFull).toBe(true);
  68  | 
  69  |       const isMorningFull = await slotPicker.isSlotFullyBooked(MORNING);
  70  |       expect(isMorningFull).toBe(false);
  71  | 
  72  |       // Try to add the 4th unit to the now-full afternoon slot — must be rejected
  73  |       const before = await slotPicker.getModalSlotBooked(AFTERNOON);
  74  |       await slotPicker.incrementSlot(AFTERNOON, 1);
  75  |       const after = await slotPicker.getModalSlotBooked(AFTERNOON);
  76  |       expect(after.booked).toBe(before.booked);
  77  | 
  78  |       // Allocate the remaining unit to the morning slot to complete the booking
  79  |       await slotPicker.incrementSlot(MORNING, 1);
  80  |       await slotPicker.saveSlotChanges();
  81  |       await slotPicker.confirmAppointment();
  82  |     });
  83  | 
  84  |     test("Day capacity reach 6/6", async ({
  85  |       softwareInstallationPage,
  86  |       slotPicker,
  87  |     }) => {
  88  |       // Buy 6 installations into a single empty date: 3 morning + 3 afternoon
  89  |       await softwareInstallationPage.purchaseInstallation(1);
  90  |       const targetDate = await slotPicker.findEmptyBookableDate();
  91  |       expect(targetDate).not.toBeNull();
  92  | 
  93  |       await slotPicker.openSlotModal(targetDate!);
  94  |       await slotPicker.incrementSlot(MORNING, 1);
  95  |       await slotPicker.saveSlotChanges();
  96  |       await slotPicker.confirmAppointment();
  97  | 
  98  |       for (let i = 1; i < ENV.slotCapacity.perSlot; i++) {
  99  |         await softwareInstallationPage.purchaseInstallation(1);
  100 |         await slotPicker.openSlotModal(targetDate!);
  101 |         await slotPicker.incrementSlot(MORNING, 1);
  102 |         await slotPicker.saveSlotChanges();
  103 |         await slotPicker.confirmAppointment();
  104 |       }
  105 |       for (let i = 0; i < ENV.slotCapacity.perSlot; i++) {
  106 |         await softwareInstallationPage.purchaseInstallation(1);
  107 |         await slotPicker.openSlotModal(targetDate!);
  108 |         await slotPicker.incrementSlot(AFTERNOON, 1);
  109 |         await slotPicker.saveSlotChanges();
  110 |         await slotPicker.confirmAppointment();
  111 |       }
  112 | 
  113 |       // 7th installation — the date should now read 6/6 and no longer be
  114 |       // clickable/bookable at all (fully booked for the day)
  115 |       await softwareInstallationPage.purchaseInstallation(1);
  116 | 
  117 |       const slotCount = await slotPicker.getSlotCount(targetDate!);
  118 |       expect(slotCount.used).toBe(ENV.slotCapacity.perDay);
  119 |       expect(slotCount.total).toBe(ENV.slotCapacity.perDay);
  120 | 
  121 |       const isFullyBookedDay = await slotPicker.isDayFullyBooked(targetDate!);
  122 |       expect(isFullyBookedDay).toBe(true);
  123 | 
  124 |       const isBookable = await slotPicker.isDayBookable(targetDate!);
  125 |       expect(isBookable).toBe(false);
  126 |     });
  127 | 
  128 |     test("Software Installation - Mandatory Booking", async ({
  129 |       softwareInstallationPage,
  130 |       slotPicker,
  131 |     }) => {
  132 |       // Buy 2 installations — both units must be booked before confirming
  133 |       await softwareInstallationPage.purchaseInstallation(2);
  134 | 
  135 |       const total = await slotPicker.getAllocationTotal();
```