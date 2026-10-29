# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Day capacity reach 6/6
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:66:9

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 3
Received: 1
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e4]: "Software Installation:"
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]: "1"
        - generic [ref=e8]: Payment
      - generic [ref=e9]: →
      - generic [ref=e10]:
        - generic [ref=e11]: "2"
        - generic [ref=e12]: Appointment
      - generic [ref=e13]: →
      - generic [ref=e14]:
        - generic [ref=e15]: "3"
        - generic [ref=e16]: Submission
    - generic [ref=e19]:
      - generic [ref=e20]:
        - img "Software Installation" [ref=e21]
        - generic [ref=e22]:
          - generic [ref=e23]: Schedule an Appointment
          - generic [ref=e24]: Please choose your preferred software installation date and time slot. (up to 3 per slot)
      - generic [ref=e25]:
        - generic [ref=e26]: Please select a date to schedule the software installation
        - generic [ref=e27]:
          - generic [ref=e28]: July 2026
          - generic [ref=e29] [cursor=pointer]: ›
      - table [ref=e30]:
        - rowgroup [ref=e31]:
          - row "MON TUE WED THUR FRI SAT SUN" [ref=e32]:
            - columnheader "MON" [ref=e33]
            - columnheader "TUE" [ref=e34]
            - columnheader "WED" [ref=e35]
            - columnheader "THUR" [ref=e36]
            - columnheader "FRI" [ref=e37]
            - columnheader "SAT" [ref=e38]
            - columnheader "SUN" [ref=e39]
        - rowgroup [ref=e40]:
          - row "29 30 1 2 3 4 5" [ref=e41]:
            - cell "29" [ref=e42]
            - cell "30" [ref=e43]
            - cell "1" [ref=e44]
            - cell "2" [ref=e45]
            - cell "3" [ref=e46]
            - cell "4" [ref=e47]
            - cell "5" [ref=e48]
          - row "6 7 8 9 10 11 12" [ref=e49]:
            - cell "6" [ref=e50]
            - cell "7" [ref=e51]
            - cell "8" [ref=e52]
            - cell "9" [ref=e53]
            - cell "10" [ref=e54]
            - cell "11" [ref=e55]
            - cell "12" [ref=e56]
          - row "13 14 15 16 17 18 19" [ref=e57]:
            - cell "13" [ref=e58]
            - cell "14" [ref=e59]
            - cell "15" [ref=e60]
            - cell "16" [ref=e61]
            - cell "17" [ref=e62]:
              - generic [ref=e63]: "17"
            - cell "18" [ref=e64]
            - cell "19" [ref=e65]
          - row "20 Full 21 Full 22 Full 23 Full 24 6 Available 25 26" [ref=e66]:
            - cell "20 Full" [ref=e67]:
              - text: "20"
              - generic [ref=e69]: Full
            - cell "21 Full" [ref=e70]:
              - text: "21"
              - generic [ref=e72]: Full
            - cell "22 Full" [ref=e73]:
              - text: "22"
              - generic [ref=e75]: Full
            - cell "23 Full" [ref=e76]:
              - text: "23"
              - generic [ref=e78]: Full
            - cell "24 6 Available" [ref=e79] [cursor=pointer]:
              - text: "24"
              - generic [ref=e81]: 6 Available
            - cell "25" [ref=e82]
            - cell "26" [ref=e83]
          - row "27 6 Available 28 6 Available 29 6 Available 30 6 Available 31 Full 1 2" [ref=e84]:
            - cell "27 6 Available" [ref=e85] [cursor=pointer]:
              - text: "27"
              - generic [ref=e87]: 6 Available
            - cell "28 6 Available" [ref=e88] [cursor=pointer]:
              - text: "28"
              - generic [ref=e90]: 6 Available
            - cell "29 6 Available" [ref=e91] [cursor=pointer]:
              - text: "29"
              - generic [ref=e93]: 6 Available
            - cell "30 6 Available" [ref=e94] [cursor=pointer]:
              - text: "30"
              - generic [ref=e96]: 6 Available
            - cell "31 Full" [ref=e97]:
              - text: "31"
              - generic [ref=e99]: Full
            - cell "1" [ref=e100]
            - cell "2" [ref=e101]
      - generic [ref=e103]:
        - generic [ref=e104]: Booked 0 of 1 appointment(s).
        - button "Confirm Appointment" [ref=e106] [cursor=pointer]
  - generic [ref=e108]:
    - generic [ref=e109]:
      - generic [ref=e110]: Installation Appointment
      - generic [ref=e111] [cursor=pointer]: ×
    - generic [ref=e112]: "Remaining software installation appointment to allocate : 0"
    - generic [ref=e113]:
      - generic [ref=e114]:
        - generic [ref=e115]: "Appointment Date:"
        - textbox [ref=e116]: 24-07-2026
      - generic [ref=e117]:
        - generic [ref=e118]:
          - generic [ref=e119]: "Morning Session:"
          - generic [ref=e120]: 10:00am - 12:00pm
        - generic [ref=e121]:
          - button "−" [ref=e122] [cursor=pointer]
          - textbox [ref=e123]: "1"
          - button "+" [disabled] [ref=e124]
        - generic [ref=e125]: 1 of 3 booked
        - link "✕ Remove" [ref=e126] [cursor=pointer]:
          - /url: javascript:void(0)
      - generic [ref=e127]:
        - generic [ref=e128]:
          - generic [ref=e129]: "Afternoon Session:"
          - generic [ref=e130]: 2:00pm - 4:00pm
        - generic [ref=e131]:
          - button "−" [disabled] [ref=e132]
          - textbox [ref=e133]: "0"
          - button "+" [disabled] [ref=e134]
        - generic [ref=e135]: 0 of 3 booked
    - generic [ref=e137]:
      - button "Cancel" [ref=e138] [cursor=pointer]
      - button "Confirm" [ref=e139] [cursor=pointer]
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
  26  |     // Expected: on a session that has NOT been booked yet, only up to 3
  27  |     // appointments can be added. Buy more than a session can hold (perSlot+1)
  28  |     // so our own purchase total is never the limiting factor, start from an
  29  |     // EMPTY session so the limit we hit is the hard 3-per-slot cap, and prove
  30  |     // the "+" stepper refuses to exceed 3. Stepper only, never saved — the
  31  |     // shared calendar is left untouched.
  32  |     test("Morning Slot - Book until full", async ({
  33  |       softwareInstallationPage,
  34  |       slotPicker,
  35  |     }) => {
  36  |       await softwareInstallationPage.purchaseInstallation(ENV.slotCapacity.perSlot + 1);
  37  |       const date = await slotPicker.findDateMatching((i) => i.morning.booked === 0);
  38  |       if (!date) {
  39  |         test.skip(true, "No date with an empty morning session available.");
  40  |         return;
  41  |       }
  42  |       await test.step(`Expected: morning session accepts at most ${ENV.slotCapacity.perSlot}`, async () => {
  43  |         await slotPicker.openSlotModal(date);
  44  |         await slotPicker.incrementSlot(MORNING, ENV.slotCapacity.perSlot + 1);
  45  |         expect(await slotPicker.getStepperValue(MORNING)).toBe(ENV.slotCapacity.perSlot);
  46  |       });
  47  |     });
  48  | 
  49  |     test("Afternoon Slot - Book until full", async ({
  50  |       softwareInstallationPage,
  51  |       slotPicker,
  52  |     }) => {
  53  |       await softwareInstallationPage.purchaseInstallation(ENV.slotCapacity.perSlot + 1);
  54  |       const date = await slotPicker.findDateMatching((i) => i.afternoon.booked === 0);
  55  |       if (!date) {
  56  |         test.skip(true, "No date with an empty afternoon session available.");
  57  |         return;
  58  |       }
  59  |       await test.step(`Expected: afternoon session accepts at most ${ENV.slotCapacity.perSlot}`, async () => {
  60  |         await slotPicker.openSlotModal(date);
  61  |         await slotPicker.incrementSlot(AFTERNOON, ENV.slotCapacity.perSlot + 1);
  62  |         expect(await slotPicker.getStepperValue(AFTERNOON)).toBe(ENV.slotCapacity.perSlot);
  63  |       });
  64  |     });
  65  | 
  66  |     test("Day capacity reach 6/6", async ({
  67  |       softwareInstallationPage,
  68  |       slotPicker,
  69  |     }) => {
  70  |       await softwareInstallationPage.purchaseInstallation(1);
  71  | 
  72  |       // Part 1: a date that's already fully booked (6/6) must not open
  73  |       // at all when clicked — no popup, no way in.
  74  |       const fullDate = await slotPicker.findFullyBookedDate();
  75  |       expect(fullDate).not.toBeNull();
  76  | 
  77  |       let popupOpened = false;
  78  |       try {
  79  |         await slotPicker.openSlotModal(fullDate!);
  80  |         popupOpened = true;
  81  |       } catch {
  82  |         // Expected — a fully-booked date must refuse to open.
  83  |       }
  84  |       // If it somehow DID open, that's a real bug and this test must fail.
  85  |       expect(popupOpened).toBe(false);
  86  | 
  87  |       // Part 2: on a date with some room, neither slot can be pushed past
  88  |       // its own 3-unit cap. Stepper only — never saved/confirmed, so no
  89  |       // real booking is made and the shared calendar stays untouched.
  90  |       const targetDate = await slotPicker.findDateWithRoom(1);
  91  |       expect(targetDate).not.toBeNull();
  92  | 
  93  |       await slotPicker.openSlotModal(targetDate!);
  94  | 
  95  |       const morningInitial = await slotPicker.getModalSlotBooked(MORNING);
  96  |       const afternoonInitial = await slotPicker.getModalSlotBooked(AFTERNOON);
  97  |       const morningRoom = morningInitial.max - morningInitial.booked;
  98  |       const afternoonRoom = afternoonInitial.max - afternoonInitial.booked;
  99  |       expect(morningRoom + afternoonRoom).toBeGreaterThan(0);
  100 | 
  101 |       if (morningRoom > 0) {
  102 |         await slotPicker.incrementSlot(MORNING, morningRoom);
> 103 |         expect(await slotPicker.getStepperValue(MORNING)).toBe(morningRoom);
      |                                                           ^ Error: expect(received).toBe(expected) // Object.is equality
  104 |         await slotPicker.incrementSlot(MORNING, 1);
  105 |         expect(await slotPicker.getStepperValue(MORNING)).toBe(morningRoom);
  106 |       }
  107 | 
  108 |       if (afternoonRoom > 0) {
  109 |         await slotPicker.incrementSlot(AFTERNOON, afternoonRoom);
  110 |         expect(await slotPicker.getStepperValue(AFTERNOON)).toBe(afternoonRoom);
  111 |         await slotPicker.incrementSlot(AFTERNOON, 1);
  112 |         expect(await slotPicker.getStepperValue(AFTERNOON)).toBe(afternoonRoom);
  113 |       }
  114 |     });
  115 | 
  116 |     test("Software Installation - Mandatory Booking", async ({
  117 |       softwareInstallationPage,
  118 |       slotPicker,
  119 |     }) => {
  120 |       // Buy 2 installations — both units must be booked before confirming
  121 |       await softwareInstallationPage.purchaseInstallation(2);
  122 | 
  123 |       const total = await slotPicker.getAllocationTotal();
  124 |       expect(total).toBe(2);
  125 | 
  126 |       const targetDate = await slotPicker.findDateWithRoom(total);
  127 |       expect(targetDate).not.toBeNull();
  128 | 
  129 |       // Book only 1 of the 2 units
  130 |       await slotPicker.allocateUnitsAnywhere(1, targetDate!);
  131 | 
  132 |       const remainingAfter = await slotPicker.getRemainingToAllocate();
  133 |       expect(remainingAfter).toBe(1);
  134 | 
  135 |       // Try to confirm with 1 still unbooked — should be blocked
  136 |       await slotPicker.confirmAppointment();
  137 |       const clientErr = slotPicker.page.locator("#si-clienterr");
  138 |       await expect(clientErr).toBeVisible();
  139 | 
  140 |       // Book the remaining unit — should now be allowed to proceed
  141 |       await slotPicker.allocateUnitsAnywhere(1);
  142 | 
  143 |       const allocated = await slotPicker.getAllocatedCount();
  144 |       expect(allocated).toBe(2);
  145 | 
  146 |       await slotPicker.confirmAppointment();
  147 |       await expect(clientErr).toBeHidden();
  148 |     });
  149 | 
  150 |     test("Biometric Purchase - Free Install Option (partial booking)", async ({
  151 |       biometricPurchasePage,
  152 |       slotPicker,
  153 |     }) => {
  154 |       // 2 devices → 2 free software installations. Do not opt for extra
  155 |       // (paid) installs. Expected: UCD may PARTIALLY book — the remaining
  156 |       // free appointment stays valid for 1 month (tied to the SR reference).
  157 |       await biometricPurchasePage.purchaseDevice({
  158 |         deviceQty: 2,
  159 |         recipientName: "Test Receiver",
  160 |         contactNo: "0123456789",
  161 |         shipToShowroom: true,
  162 |       });
  163 | 
  164 |       const total = await slotPicker.getAllocationTotal();
  165 |       expect(total).toBe(2);
  166 | 
  167 |       const targetDate = await slotPicker.findDateWithRoom(1);
  168 |       expect(targetDate).not.toBeNull();
  169 | 
  170 |       // Book only 1 of the 2 free installations
  171 |       await slotPicker.allocateUnitsAnywhere(1, targetDate!);
  172 | 
  173 |       const remaining = await slotPicker.getRemainingToAllocate();
  174 |       expect(remaining).toBe(1);
  175 | 
  176 |       // Free installs are optional — confirming with 1 of 2 booked must succeed
  177 |       await slotPicker.confirmAppointment();
  178 |       const clientErr = slotPicker.page.locator("#si-clienterr");
  179 |       await expect(clientErr).toBeHidden();
  180 |     });
  181 | 
  182 |     test("Biometric Purchase - Free Install Option (no booking)", async ({
  183 |       biometricPurchasePage,
  184 |       slotPicker,
  185 |     }) => {
  186 |       // 2 devices → 2 free installs, no extra (paid) installs. Expected: UCD
  187 |       // may proceed WITHOUT booking any appointment now — all free installs
  188 |       // remain valid for 1 month (tied to the SR reference).
  189 |       await biometricPurchasePage.purchaseDevice({
  190 |         deviceQty: 2,
  191 |         recipientName: "Test Receiver",
  192 |         contactNo: "0123456789",
  193 |         shipToShowroom: true,
  194 |       });
  195 | 
  196 |       expect(await slotPicker.getAllocationTotal()).toBe(2);
  197 | 
  198 |       // Confirm with nothing booked — free installs are optional, so this
  199 |       // must be allowed to proceed (no mandatory paid unit to block it).
  200 |       await slotPicker.confirmAppointment();
  201 |       expect(slotPicker.page.url()).toMatch(/submitted\.do/);
  202 |     });
  203 | 
```