# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Morning Slot - Book until full
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:26:9

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
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
          - row "13 14 Slot 6/6 15 Slot 6/6 16 Slot 6/6 17 Slot 3/6 18 19" [ref=e51]:
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
            - cell "17 Slot 3/6" [ref=e63] [cursor=pointer]:
              - text: "17"
              - generic [ref=e65]: Slot 3/6
            - cell "18" [ref=e66]
            - cell "19" [ref=e67]
          - row "20 Slot 1/6 21 Slot 6/6 22 Slot 2/6 23 Slot 6/6 24 Slot 5/6 25 26" [ref=e68]:
            - cell "20 Slot 1/6" [ref=e69] [cursor=pointer]:
              - text: "20"
              - generic [ref=e71]: Slot 1/6
            - cell "21 Slot 6/6" [ref=e72]:
              - text: "21"
              - generic [ref=e74]: Slot 6/6
            - cell "22 Slot 2/6" [ref=e75] [cursor=pointer]:
              - text: "22"
              - generic [ref=e77]: Slot 2/6
            - cell "23 Slot 6/6" [ref=e78]:
              - text: "23"
              - generic [ref=e80]: Slot 6/6
            - cell "24 Slot 5/6" [ref=e81] [cursor=pointer]:
              - text: "24"
              - generic [ref=e83]: Slot 5/6
            - cell "25" [ref=e84]
            - cell "26" [ref=e85]
          - row "27 Slot 3/6 28 Slot 5/6 29 Slot 4/6 30 Slot 2/6 31 Slot 3/6 1 2" [ref=e86]:
            - cell "27 Slot 3/6" [ref=e87] [cursor=pointer]:
              - text: "27"
              - generic [ref=e89]: Slot 3/6
            - cell "28 Slot 5/6" [ref=e90] [cursor=pointer]:
              - text: "28"
              - generic [ref=e92]: Slot 5/6
            - cell "29 Slot 4/6" [ref=e93] [cursor=pointer]:
              - text: "29"
              - generic [ref=e95]: Slot 4/6
            - cell "30 Slot 2/6" [ref=e96] [cursor=pointer]:
              - text: "30"
              - generic [ref=e98]: Slot 2/6
            - cell "31 Slot 3/6" [ref=e99] [cursor=pointer]:
              - text: "31"
              - generic [ref=e101]: Slot 3/6
            - cell "1" [ref=e102]
            - cell "2" [ref=e103]
      - generic [ref=e104]:
        - generic [ref=e105]: Booked 0 of 4
        - generic [ref=e106]: Click a bookable date above to allocate an installation.
        - button "Confirm Appointment" [ref=e108] [cursor=pointer]
  - generic [ref=e110]:
    - generic [ref=e111]:
      - generic [ref=e112]: Installation Appointment
      - generic [ref=e113] [cursor=pointer]: ×
    - generic [ref=e114]:
      - generic [ref=e115]:
        - generic [ref=e116]: "Appointment Date:"
        - textbox [ref=e117]: 17-07-2026
      - generic [ref=e118]: Allocate up to 4 installations across the time slots below.
      - generic [ref=e119]:
        - generic [ref=e120]: 10:00am - 12:00pm
        - generic [ref=e121]:
          - button "−" [ref=e122] [cursor=pointer]
          - textbox [ref=e123]: "0"
          - button "+" [ref=e124] [cursor=pointer]
        - generic [ref=e125]: Fully booked
      - generic [ref=e126]:
        - generic [ref=e127]: 2:00pm - 4:00pm
        - generic [ref=e128]:
          - button "−" [ref=e129] [cursor=pointer]
          - textbox [ref=e130]: "0"
          - button "+" [ref=e131] [cursor=pointer]
        - generic [ref=e132]: 0 of 3 booked
      - generic [ref=e133]: "Remaining to allocate: 4"
    - generic [ref=e135]:
      - button "Cancel" [ref=e136] [cursor=pointer]
      - button "Save changes" [ref=e137] [cursor=pointer]
  - generic [ref=e138]:
    - generic [ref=e139]:
      - button "HOME" [ref=e140] [cursor=pointer]
      - button "INSURANCE" [ref=e141] [cursor=pointer]
      - button "REPORTS" [ref=e142] [cursor=pointer]
      - button "SETTINGS" [ref=e143] [cursor=pointer]
      - button "USER GUIDE" [ref=e144] [cursor=pointer]
      - button "DOWNLOAD" [ref=e145] [cursor=pointer]
      - button "CONTACT US" [ref=e146] [cursor=pointer]
    - table [ref=e147]:
      - rowgroup [ref=e148]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e149]:
          - cell "Online Services - Service Hub" [ref=e150]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e151]:
            - list [ref=e152]:
              - listitem [ref=e153]:
                - img [ref=e154]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e155]: "|"
              - listitem [ref=e156]:
                - link "Logout" [ref=e157] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e159]
  - generic [ref=e160]:
    - generic [ref=e162]:
      - generic [ref=e163]:
        - link "Contact Us" [ref=e164] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e165]: "|"
        - link "Terms & Conditions" [ref=e166] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e167]: "|"
        - link "Privacy" [ref=e168] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e169]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e170]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e172]
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
  10  |   //
  11  |   // Dates are discovered dynamically instead of hardcoded day-offsets,
  12  |   // since offsets can land on weekends, holidays, or already-partially-
  13  |   // booked dates. Tests also don't assume a completely empty (0-booked)
  14  |   // date exists — staging.eauto.my is a shared, persistent environment
  15  |   // with no reset between runs, so every clean date within the bookable
  16  |   // window eventually gets consumed. Instead, each test inspects whatever
  17  |   // room actually remains (via getModalSlotBooked / getSlotCount) and
  18  |   // books exactly that much.
  19  |   // ────────────────────────────────────────────────────────────
  20  |   test.describe("UCD", () => {
  21  |     test.beforeEach(async ({ loginPage, serviceHubPage }) => {
  22  |       await loginPage.loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
  23  |       await serviceHubPage.navigate();
  24  |     });
  25  | 
  26  |     test("Morning Slot - Book until full", async ({
  27  |       softwareInstallationPage,
  28  |       slotPicker,
  29  |     }) => {
  30  |       // Single purchase of 4 installations — enough to fill however much
  31  |       // room is left in the morning slot (max 3) plus at least 1 spare
  32  |       // to prove overbooking is rejected, regardless of prior bookings.
  33  |       await softwareInstallationPage.purchaseInstallation(ENV.slotCapacity.perSlot + 1);
  34  |       const targetDate = await slotPicker.findAnyBookableDate();
  35  |       expect(targetDate).not.toBeNull();
  36  | 
  37  |       await slotPicker.openSlotModal(targetDate!);
  38  |       const initial = await slotPicker.getModalSlotBooked(MORNING);
  39  |       const roomLeft = initial.max - initial.booked;
> 40  |       expect(roomLeft).toBeGreaterThan(0);
      |                        ^ Error: expect(received).toBeGreaterThan(expected)
  41  | 
  42  |       // The modal's capacity indicator (#si-cap0/#si-cap1) reflects
  43  |       // committed (saved) bookings, not in-progress stepper clicks — so
  44  |       // book and save one unit at a time rather than incrementing
  45  |       // roomLeft times and checking before any save.
  46  |       for (let i = 0; i < roomLeft; i++) {
  47  |         await slotPicker.openSlotModal(targetDate!);
  48  |         await slotPicker.incrementSlot(MORNING, 1);
  49  |         await slotPicker.saveSlotChanges();
  50  |       }
  51  | 
  52  |       await slotPicker.openSlotModal(targetDate!);
  53  |       const isMorningFull = await slotPicker.isSlotFullyBooked(MORNING);
  54  |       expect(isMorningFull).toBe(true);
  55  | 
  56  |       // Try to add one more unit to the now-full morning slot — must be rejected
  57  |       const before = await slotPicker.getModalSlotBooked(MORNING);
  58  |       await slotPicker.incrementSlot(MORNING, 1);
  59  |       const after = await slotPicker.getModalSlotBooked(MORNING);
  60  |       expect(after.booked).toBe(before.booked);
  61  | 
  62  |       // Allocate the remaining purchased units elsewhere to complete the
  63  |       // mandatory booking (afternoon of this date, or another date if
  64  |       // this one doesn't have enough room)
  65  |       let leftover = ENV.slotCapacity.perSlot + 1 - roomLeft;
  66  |       leftover -= await slotPicker.allocateUnitsAcrossSlots(targetDate!, leftover);
  67  |       while (leftover > 0) {
  68  |         const overflowDate = await slotPicker.findDateWithRoom(1);
  69  |         expect(overflowDate).not.toBeNull();
  70  |         leftover -= await slotPicker.allocateUnitsAcrossSlots(overflowDate!, leftover);
  71  |       }
  72  |       await slotPicker.confirmAppointment();
  73  |     });
  74  | 
  75  |     test("Afternoon Slot - Book until full", async ({
  76  |       softwareInstallationPage,
  77  |       slotPicker,
  78  |     }) => {
  79  |       // Single purchase of 4 installations — enough to fill however much
  80  |       // room is left in the afternoon slot (max 3) plus at least 1 spare
  81  |       // to prove overbooking is rejected, regardless of prior bookings.
  82  |       await softwareInstallationPage.purchaseInstallation(ENV.slotCapacity.perSlot + 1);
  83  |       const targetDate = await slotPicker.findAnyBookableDate();
  84  |       expect(targetDate).not.toBeNull();
  85  | 
  86  |       await slotPicker.openSlotModal(targetDate!);
  87  |       const initial = await slotPicker.getModalSlotBooked(AFTERNOON);
  88  |       const roomLeft = initial.max - initial.booked;
  89  |       expect(roomLeft).toBeGreaterThan(0);
  90  | 
  91  |       // Book and save one unit at a time — the modal's capacity indicator
  92  |       // reflects committed bookings, not in-progress stepper clicks.
  93  |       for (let i = 0; i < roomLeft; i++) {
  94  |         await slotPicker.openSlotModal(targetDate!);
  95  |         await slotPicker.incrementSlot(AFTERNOON, 1);
  96  |         await slotPicker.saveSlotChanges();
  97  |       }
  98  | 
  99  |       await slotPicker.openSlotModal(targetDate!);
  100 |       const isAfternoonFull = await slotPicker.isSlotFullyBooked(AFTERNOON);
  101 |       expect(isAfternoonFull).toBe(true);
  102 | 
  103 |       // Try to add one more unit to the now-full afternoon slot — must be rejected
  104 |       const before = await slotPicker.getModalSlotBooked(AFTERNOON);
  105 |       await slotPicker.incrementSlot(AFTERNOON, 1);
  106 |       const after = await slotPicker.getModalSlotBooked(AFTERNOON);
  107 |       expect(after.booked).toBe(before.booked);
  108 | 
  109 |       // Allocate the remaining purchased units elsewhere to complete the
  110 |       // mandatory booking (morning of this date, or another date if this
  111 |       // one doesn't have enough room)
  112 |       let leftover = ENV.slotCapacity.perSlot + 1 - roomLeft;
  113 |       leftover -= await slotPicker.allocateUnitsAcrossSlots(targetDate!, leftover);
  114 |       while (leftover > 0) {
  115 |         const overflowDate = await slotPicker.findDateWithRoom(1);
  116 |         expect(overflowDate).not.toBeNull();
  117 |         leftover -= await slotPicker.allocateUnitsAcrossSlots(overflowDate!, leftover);
  118 |       }
  119 |       await slotPicker.confirmAppointment();
  120 |     });
  121 | 
  122 |     test("Day capacity reach 6/6", async ({
  123 |       softwareInstallationPage,
  124 |       slotPicker,
  125 |     }) => {
  126 |       // Find any bookable date and figure out how much combined room
  127 |       // (morning + afternoon) it has left, then buy+book exactly that
  128 |       // much, one unit at a time, to prove the day caps out at 6/6.
  129 |       await softwareInstallationPage.purchaseInstallation(1);
  130 |       const targetDate = await slotPicker.findAnyBookableDate();
  131 |       expect(targetDate).not.toBeNull();
  132 | 
  133 |       await slotPicker.openSlotModal(targetDate!);
  134 |       const morningInit = await slotPicker.getModalSlotBooked(MORNING);
  135 |       const afternoonInit = await slotPicker.getModalSlotBooked(AFTERNOON);
  136 |       let remainingMorning = morningInit.max - morningInit.booked;
  137 |       let remainingAfternoon = afternoonInit.max - afternoonInit.booked;
  138 |       expect(remainingMorning + remainingAfternoon).toBeGreaterThan(0);
  139 | 
  140 |       const bookOneUnit = async () => {
```