# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Afternoon Slot - Book until full
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:77:9

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
          - row "20 Selected (3) Slot 4/6 21 Slot 6/6 22 Slot 2/6 23 Slot 6/6 24 Slot 5/6 25 26" [ref=e68]:
            - cell "20 Selected (3) Slot 4/6" [ref=e69] [cursor=pointer]:
              - text: "20"
              - generic [ref=e70]:
                - generic [ref=e71]: Selected (3)
                - generic [ref=e72]: Slot 4/6
            - cell "21 Slot 6/6" [ref=e73]:
              - text: "21"
              - generic [ref=e75]: Slot 6/6
            - cell "22 Slot 2/6" [ref=e76] [cursor=pointer]:
              - text: "22"
              - generic [ref=e78]: Slot 2/6
            - cell "23 Slot 6/6" [ref=e79]:
              - text: "23"
              - generic [ref=e81]: Slot 6/6
            - cell "24 Slot 5/6" [ref=e82] [cursor=pointer]:
              - text: "24"
              - generic [ref=e84]: Slot 5/6
            - cell "25" [ref=e85]
            - cell "26" [ref=e86]
          - row "27 Slot 3/6 28 Slot 5/6 29 Slot 4/6 30 Slot 2/6 31 Slot 3/6 1 2" [ref=e87]:
            - cell "27 Slot 3/6" [ref=e88] [cursor=pointer]:
              - text: "27"
              - generic [ref=e90]: Slot 3/6
            - cell "28 Slot 5/6" [ref=e91] [cursor=pointer]:
              - text: "28"
              - generic [ref=e93]: Slot 5/6
            - cell "29 Slot 4/6" [ref=e94] [cursor=pointer]:
              - text: "29"
              - generic [ref=e96]: Slot 4/6
            - cell "30 Slot 2/6" [ref=e97] [cursor=pointer]:
              - text: "30"
              - generic [ref=e99]: Slot 2/6
            - cell "31 Slot 3/6" [ref=e100] [cursor=pointer]:
              - text: "31"
              - generic [ref=e102]: Slot 3/6
            - cell "1" [ref=e103]
            - cell "2" [ref=e104]
      - generic [ref=e105]:
        - generic [ref=e106]: Booked 3 of 4
        - generic [ref=e107]: Click a date to add or change its time slots.
        - button "Confirm Appointment" [ref=e109] [cursor=pointer]
  - generic [ref=e111]:
    - generic [ref=e112]:
      - generic [ref=e113]: Installation Appointment
      - generic [ref=e114] [cursor=pointer]: ×
    - generic [ref=e115]:
      - generic [ref=e116]:
        - generic [ref=e117]: "Appointment Date:"
        - textbox [ref=e118]: 20-07-2026
      - generic [ref=e119]: Allocate up to 4 installations across the time slots below.
      - generic [ref=e120]:
        - generic [ref=e121]: 10:00am - 12:00pm
        - generic [ref=e122]:
          - button "−" [ref=e123] [cursor=pointer]
          - textbox [ref=e124]: "0"
          - button "+" [ref=e125] [cursor=pointer]
        - generic [ref=e126]: 1 of 3 booked
      - generic [ref=e127]:
        - generic [ref=e128]: 2:00pm - 4:00pm
        - generic [ref=e129]:
          - button "−" [ref=e130] [cursor=pointer]
          - textbox [ref=e131]: "3"
          - button "+" [ref=e132] [cursor=pointer]
        - generic [ref=e133]: 3 of 3 booked
        - link "✕ Remove" [ref=e134] [cursor=pointer]:
          - /url: javascript:void(0)
      - generic [ref=e135]: "Remaining to allocate: 1"
    - generic [ref=e137]:
      - button "Cancel" [ref=e138] [cursor=pointer]
      - button "Save changes" [ref=e139] [cursor=pointer]
  - generic [ref=e140]:
    - generic [ref=e141]:
      - button "HOME" [ref=e142] [cursor=pointer]
      - button "INSURANCE" [ref=e143] [cursor=pointer]
      - button "REPORTS" [ref=e144] [cursor=pointer]
      - button "SETTINGS" [ref=e145] [cursor=pointer]
      - button "USER GUIDE" [ref=e146] [cursor=pointer]
      - button "DOWNLOAD" [ref=e147] [cursor=pointer]
      - button "CONTACT US" [ref=e148] [cursor=pointer]
    - table [ref=e149]:
      - rowgroup [ref=e150]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e151]:
          - cell "Online Services - Service Hub" [ref=e152]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e153]:
            - list [ref=e154]:
              - listitem [ref=e155]:
                - img [ref=e156]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e157]: "|"
              - listitem [ref=e158]:
                - link "Logout" [ref=e159] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e161]
  - generic [ref=e162]:
    - generic [ref=e164]:
      - generic [ref=e165]:
        - link "Contact Us" [ref=e166] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e167]: "|"
        - link "Terms & Conditions" [ref=e168] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e169]: "|"
        - link "Privacy" [ref=e170] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e171]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e172]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e174]
```

# Test source

```ts
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
  34  |       // A date can be generally "bookable" while morning specifically is
  35  |       // already full, so find one where morning itself has room.
  36  |       const targetDate = await slotPicker.findDateWithSlotRoom(MORNING, 1);
  37  |       expect(targetDate).not.toBeNull();
  38  | 
  39  |       await slotPicker.openSlotModal(targetDate!);
  40  |       const initial = await slotPicker.getModalSlotBooked(MORNING);
  41  |       const roomLeft = initial.max - initial.booked;
  42  |       expect(roomLeft).toBeGreaterThan(0);
  43  | 
  44  |       // The modal's capacity indicator (#si-cap0/#si-cap1) reflects
  45  |       // committed (saved) bookings, not in-progress stepper clicks — so
  46  |       // book and save one unit at a time rather than incrementing
  47  |       // roomLeft times and checking before any save.
  48  |       for (let i = 0; i < roomLeft; i++) {
  49  |         await slotPicker.openSlotModal(targetDate!);
  50  |         await slotPicker.incrementSlot(MORNING, 1);
  51  |         await slotPicker.saveSlotChanges();
  52  |       }
  53  | 
  54  |       await slotPicker.openSlotModal(targetDate!);
  55  |       const isMorningFull = await slotPicker.isSlotFullyBooked(MORNING);
  56  |       expect(isMorningFull).toBe(true);
  57  | 
  58  |       // Try to add one more unit to the now-full morning slot — must be rejected
  59  |       const before = await slotPicker.getModalSlotBooked(MORNING);
  60  |       await slotPicker.incrementSlot(MORNING, 1);
  61  |       const after = await slotPicker.getModalSlotBooked(MORNING);
  62  |       expect(after.booked).toBe(before.booked);
  63  | 
  64  |       // Allocate the remaining purchased units elsewhere to complete the
  65  |       // mandatory booking (afternoon of this date, or another date if
  66  |       // this one doesn't have enough room)
  67  |       let leftover = ENV.slotCapacity.perSlot + 1 - roomLeft;
  68  |       leftover -= await slotPicker.allocateUnitsAcrossSlots(targetDate!, leftover);
  69  |       while (leftover > 0) {
  70  |         const overflowDate = await slotPicker.findDateWithRoom(1);
  71  |         expect(overflowDate).not.toBeNull();
  72  |         leftover -= await slotPicker.allocateUnitsAcrossSlots(overflowDate!, leftover);
  73  |       }
  74  |       await slotPicker.confirmAppointment();
  75  |     });
  76  | 
  77  |     test("Afternoon Slot - Book until full", async ({
  78  |       softwareInstallationPage,
  79  |       slotPicker,
  80  |     }) => {
  81  |       // Single purchase of 4 installations — enough to fill however much
  82  |       // room is left in the afternoon slot (max 3) plus at least 1 spare
  83  |       // to prove overbooking is rejected, regardless of prior bookings.
  84  |       await softwareInstallationPage.purchaseInstallation(ENV.slotCapacity.perSlot + 1);
  85  |       // A date can be generally "bookable" while afternoon specifically is
  86  |       // already full, so find one where afternoon itself has room.
  87  |       const targetDate = await slotPicker.findDateWithSlotRoom(AFTERNOON, 1);
  88  |       expect(targetDate).not.toBeNull();
  89  | 
  90  |       await slotPicker.openSlotModal(targetDate!);
  91  |       const initial = await slotPicker.getModalSlotBooked(AFTERNOON);
  92  |       const roomLeft = initial.max - initial.booked;
  93  |       expect(roomLeft).toBeGreaterThan(0);
  94  | 
  95  |       // Book and save one unit at a time — the modal's capacity indicator
  96  |       // reflects committed bookings, not in-progress stepper clicks.
  97  |       for (let i = 0; i < roomLeft; i++) {
  98  |         await slotPicker.openSlotModal(targetDate!);
  99  |         await slotPicker.incrementSlot(AFTERNOON, 1);
  100 |         await slotPicker.saveSlotChanges();
  101 |       }
  102 | 
  103 |       await slotPicker.openSlotModal(targetDate!);
  104 |       const isAfternoonFull = await slotPicker.isSlotFullyBooked(AFTERNOON);
> 105 |       expect(isAfternoonFull).toBe(true);
      |                               ^ Error: expect(received).toBe(expected) // Object.is equality
  106 | 
  107 |       // Try to add one more unit to the now-full afternoon slot — must be rejected
  108 |       const before = await slotPicker.getModalSlotBooked(AFTERNOON);
  109 |       await slotPicker.incrementSlot(AFTERNOON, 1);
  110 |       const after = await slotPicker.getModalSlotBooked(AFTERNOON);
  111 |       expect(after.booked).toBe(before.booked);
  112 | 
  113 |       // Allocate the remaining purchased units elsewhere to complete the
  114 |       // mandatory booking (morning of this date, or another date if this
  115 |       // one doesn't have enough room)
  116 |       let leftover = ENV.slotCapacity.perSlot + 1 - roomLeft;
  117 |       leftover -= await slotPicker.allocateUnitsAcrossSlots(targetDate!, leftover);
  118 |       while (leftover > 0) {
  119 |         const overflowDate = await slotPicker.findDateWithRoom(1);
  120 |         expect(overflowDate).not.toBeNull();
  121 |         leftover -= await slotPicker.allocateUnitsAcrossSlots(overflowDate!, leftover);
  122 |       }
  123 |       await slotPicker.confirmAppointment();
  124 |     });
  125 | 
  126 |     test("Day capacity reach 6/6", async ({
  127 |       softwareInstallationPage,
  128 |       slotPicker,
  129 |     }) => {
  130 |       // Find any bookable date and figure out how much combined room
  131 |       // (morning + afternoon) it has left, then buy+book exactly that
  132 |       // much, one unit at a time, to prove the day caps out at 6/6.
  133 |       await softwareInstallationPage.purchaseInstallation(1);
  134 |       const targetDate = await slotPicker.findAnyBookableDate();
  135 |       expect(targetDate).not.toBeNull();
  136 | 
  137 |       await slotPicker.openSlotModal(targetDate!);
  138 |       const morningInit = await slotPicker.getModalSlotBooked(MORNING);
  139 |       const afternoonInit = await slotPicker.getModalSlotBooked(AFTERNOON);
  140 |       let remainingMorning = morningInit.max - morningInit.booked;
  141 |       let remainingAfternoon = afternoonInit.max - afternoonInit.booked;
  142 |       expect(remainingMorning + remainingAfternoon).toBeGreaterThan(0);
  143 | 
  144 |       const bookOneUnit = async () => {
  145 |         await slotPicker.openSlotModal(targetDate!);
  146 |         if (remainingMorning > 0) {
  147 |           await slotPicker.incrementSlot(MORNING, 1);
  148 |           remainingMorning--;
  149 |         } else {
  150 |           await slotPicker.incrementSlot(AFTERNOON, 1);
  151 |           remainingAfternoon--;
  152 |         }
  153 |         await slotPicker.saveSlotChanges();
  154 |         await slotPicker.confirmAppointment();
  155 |       };
  156 | 
  157 |       // 1st unit already purchased above
  158 |       await bookOneUnit();
  159 | 
  160 |       // Buy + book the rest of the day's remaining room
  161 |       while (remainingMorning > 0 || remainingAfternoon > 0) {
  162 |         await softwareInstallationPage.purchaseInstallation(1);
  163 |         await bookOneUnit();
  164 |       }
  165 | 
  166 |       // One more purchase — the day should now read 6/6 and no longer be
  167 |       // clickable/bookable at all (fully booked for the day)
  168 |       await softwareInstallationPage.purchaseInstallation(1);
  169 | 
  170 |       const slotCount = await slotPicker.getSlotCount(targetDate!);
  171 |       expect(slotCount.used).toBe(ENV.slotCapacity.perDay);
  172 |       expect(slotCount.total).toBe(ENV.slotCapacity.perDay);
  173 | 
  174 |       const isFullyBookedDay = await slotPicker.isDayFullyBooked(targetDate!);
  175 |       expect(isFullyBookedDay).toBe(true);
  176 | 
  177 |       const isBookable = await slotPicker.isDayBookable(targetDate!);
  178 |       expect(isBookable).toBe(false);
  179 |     });
  180 | 
  181 |     test("Software Installation - Mandatory Booking", async ({
  182 |       softwareInstallationPage,
  183 |       slotPicker,
  184 |     }) => {
  185 |       // Buy 2 installations — both units must be booked before confirming
  186 |       await softwareInstallationPage.purchaseInstallation(2);
  187 | 
  188 |       const total = await slotPicker.getAllocationTotal();
  189 |       expect(total).toBe(2);
  190 | 
  191 |       const targetDate = await slotPicker.findDateWithRoom(total);
  192 |       expect(targetDate).not.toBeNull();
  193 | 
  194 |       // Book only 1 of the 2 units
  195 |       await slotPicker.allocateUnitsAcrossSlots(targetDate!, 1);
  196 | 
  197 |       const remainingAfter = await slotPicker.getRemainingToAllocate();
  198 |       expect(remainingAfter).toBe(1);
  199 | 
  200 |       // Try to confirm with 1 still unbooked — should be blocked
  201 |       await slotPicker.confirmAppointment();
  202 |       const clientErr = slotPicker.page.locator("#si-clienterr");
  203 |       await expect(clientErr).toBeVisible();
  204 | 
  205 |       // Book the remaining unit — should now be allowed to proceed
```