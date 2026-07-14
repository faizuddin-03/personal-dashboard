# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Software Installation - Mandatory Booking
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:91:9

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 4
Received: 0
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
          - row "20 Slot 1/6 21 Slot 6/6 22 Slot 2/6 23 Slot 6/6 24 Slot 3/6 25 26" [ref=e68]:
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
            - cell "24 Slot 3/6" [ref=e81] [cursor=pointer]:
              - text: "24"
              - generic [ref=e83]: Slot 3/6
            - cell "25" [ref=e84]
            - cell "26" [ref=e85]
          - row "27 Slot 0/6 28 Slot 4/6 29 Slot 2/6 30 Slot 1/6 31 Slot 0/6 1 2" [ref=e86]:
            - cell "27 Slot 0/6" [ref=e87] [cursor=pointer]:
              - text: "27"
              - generic [ref=e89]: Slot 0/6
            - cell "28 Slot 4/6" [ref=e90] [cursor=pointer]:
              - text: "28"
              - generic [ref=e92]: Slot 4/6
            - cell "29 Slot 2/6" [ref=e93] [cursor=pointer]:
              - text: "29"
              - generic [ref=e95]: Slot 2/6
            - cell "30 Slot 1/6" [ref=e96] [cursor=pointer]:
              - text: "30"
              - generic [ref=e98]: Slot 1/6
            - cell "31 Slot 0/6" [ref=e99] [cursor=pointer]:
              - text: "31"
              - generic [ref=e101]: Slot 0/6
            - cell "1" [ref=e102]
            - cell "2" [ref=e103]
      - generic [ref=e104]:
        - generic [ref=e105]: Booked 0 of 4
        - generic [ref=e106]: Click a bookable date above to allocate an installation.
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
  7   | test.describe("Slot Capacity Boundary", () => {
  8   |   // ────────────────────────────────────────────────────────────
  9   |   // UCD — Capacity limits enforced
  10  |   // ────────────────────────────────────────────────────────────
  11  |   test.describe("UCD", () => {
  12  |     test.beforeEach(async ({ loginPage, serviceHubPage }) => {
  13  |       await loginPage.loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
  14  |       await serviceHubPage.navigate();
  15  |     });
  16  | 
  17  |     test("Morning Slot - Book until full", async ({
  18  |       softwareInstallationPage,
  19  |       slotPicker,
  20  |     }) => {
  21  |       const targetDate = slotPicker.daysFromToday(5);
  22  | 
  23  |       for (let i = 0; i < ENV.slotCapacity.perSlot; i++) {
  24  |         const txnId = await softwareInstallationPage.purchaseInstallation(1);
  25  |         await slotPicker.openSlotModal(targetDate);
  26  |         await slotPicker.incrementSlot(MORNING, 1);
  27  |         await slotPicker.saveSlotChanges();
  28  |         await slotPicker.confirmAppointment();
  29  |       }
  30  | 
  31  |       const txnId = await softwareInstallationPage.purchaseInstallation(1);
  32  |       await slotPicker.openSlotModal(targetDate);
  33  | 
  34  |       const isMorningFull = await slotPicker.isSlotFullyBooked(MORNING);
  35  |       expect(isMorningFull).toBe(true);
  36  | 
  37  |       const isAfternoonFull = await slotPicker.isSlotFullyBooked(AFTERNOON);
  38  |       expect(isAfternoonFull).toBe(false);
  39  |     });
  40  | 
  41  |     test("Afternoon Slot - Book until full", async ({
  42  |       softwareInstallationPage,
  43  |       slotPicker,
  44  |     }) => {
  45  |       const targetDate = slotPicker.daysFromToday(6);
  46  | 
  47  |       for (let i = 0; i < ENV.slotCapacity.perSlot; i++) {
  48  |         const txnId = await softwareInstallationPage.purchaseInstallation(1);
  49  |         await slotPicker.openSlotModal(targetDate);
  50  |         await slotPicker.incrementSlot(AFTERNOON, 1);
  51  |         await slotPicker.saveSlotChanges();
  52  |         await slotPicker.confirmAppointment();
  53  |       }
  54  | 
  55  |       const txnId = await softwareInstallationPage.purchaseInstallation(1);
  56  |       await slotPicker.openSlotModal(targetDate);
  57  | 
  58  |       const isAfternoonFull = await slotPicker.isSlotFullyBooked(AFTERNOON);
  59  |       expect(isAfternoonFull).toBe(true);
  60  | 
  61  |       const isMorningFull = await slotPicker.isSlotFullyBooked(MORNING);
  62  |       expect(isMorningFull).toBe(false);
  63  |     });
  64  | 
  65  |     test("Day capacity reach 6/6", async ({
  66  |       softwareInstallationPage,
  67  |       slotPicker,
  68  |     }) => {
  69  |       const targetDate = slotPicker.daysFromToday(8);
  70  | 
  71  |       for (let i = 0; i < ENV.slotCapacity.perSlot; i++) {
  72  |         const txnId = await softwareInstallationPage.purchaseInstallation(1);
  73  |         await slotPicker.openSlotModal(targetDate);
  74  |         await slotPicker.incrementSlot(MORNING, 1);
  75  |         await slotPicker.saveSlotChanges();
  76  |         await slotPicker.confirmAppointment();
  77  |       }
  78  |       for (let i = 0; i < ENV.slotCapacity.perSlot; i++) {
  79  |         const txnId = await softwareInstallationPage.purchaseInstallation(1);
  80  |         await slotPicker.openSlotModal(targetDate);
  81  |         await slotPicker.incrementSlot(AFTERNOON, 1);
  82  |         await slotPicker.saveSlotChanges();
  83  |         await slotPicker.confirmAppointment();
  84  |       }
  85  | 
  86  |       const slotCount = await slotPicker.getSlotCount(targetDate);
  87  |       expect(slotCount.used).toBe(ENV.slotCapacity.perDay);
  88  |       expect(slotCount.total).toBe(ENV.slotCapacity.perDay);
  89  |     });
  90  | 
  91  |     test("Software Installation - Mandatory Booking", async ({
  92  |       softwareInstallationPage,
  93  |       slotPicker,
  94  |     }) => {
  95  |       const txnId = await softwareInstallationPage.purchaseInstallation(4);
  96  | 
  97  |       const remaining = await slotPicker.getRemainingToAllocate();
> 98  |       expect(remaining).toBe(4);
      |                         ^ Error: expect(received).toBe(expected) // Object.is equality
  99  | 
  100 |       const date1 = slotPicker.daysFromToday(5);
  101 |       await slotPicker.openSlotModal(date1);
  102 |       await slotPicker.incrementSlot(MORNING, 2);
  103 |       await slotPicker.saveSlotChanges();
  104 | 
  105 |       const remainingAfter = await slotPicker.getRemainingToAllocate();
  106 |       expect(remainingAfter).toBe(2);
  107 | 
  108 |       // Try to confirm with 2 still unbooked — should show error
  109 |       // (Confirm button is always enabled but validates on click)
  110 |       await slotPicker.confirmAppointment();
  111 |       const clientErr = slotPicker.page.locator("#si-clienterr");
  112 |       const errVisible = await clientErr.isVisible();
  113 |       expect(errVisible).toBe(true);
  114 | 
  115 |       const date2 = slotPicker.daysFromToday(6);
  116 |       await slotPicker.openSlotModal(date2);
  117 |       await slotPicker.incrementSlot(MORNING, 2);
  118 |       await slotPicker.saveSlotChanges();
  119 | 
  120 |       const allocated = await slotPicker.getAllocatedCount();
  121 |       expect(allocated).toBe(4);
  122 |     });
  123 | 
  124 |     test("Biometric Purchase - Free Install Option", async ({
  125 |       biometricPurchasePage,
  126 |       slotPicker,
  127 |     }) => {
  128 |       const txnId = await biometricPurchasePage.purchaseDevice({
  129 |         deviceQty: 2,
  130 |         recipientName: "Test Receiver",
  131 |         contactNo: "0123456789",
  132 |         shipToShowroom: true,
  133 |       });
  134 | 
  135 |       const remaining = await slotPicker.getRemainingToAllocate();
  136 |       expect(remaining).toBe(2);
  137 | 
  138 |       // Free installs are optional — confirm should work with 0 booked
  139 |       // (MIN_REQUIRED is 0 for free installs)
  140 |     });
  141 | 
  142 |     test("Biometric Purchase - Paid Install Mandatory", async ({
  143 |       biometricPurchasePage,
  144 |       slotPicker,
  145 |     }) => {
  146 |       const txnId = await biometricPurchasePage.purchaseDevice({
  147 |         deviceQty: 1,
  148 |         recipientName: "Test Receiver",
  149 |         contactNo: "0123456789",
  150 |         shipToShowroom: true,
  151 |         additionalInstalls: 1,
  152 |       });
  153 | 
  154 |       const targetDate = slotPicker.daysFromToday(5);
  155 |       await slotPicker.openSlotModal(targetDate);
  156 |       await slotPicker.incrementSlot(MORNING, 1);
  157 |       await slotPicker.saveSlotChanges();
  158 | 
  159 |       const allocated = await slotPicker.getAllocatedCount();
  160 |       expect(allocated).toBe(1);
  161 |     });
  162 | 
  163 |     test("Two UCD - Select same last available slot", async ({
  164 |       softwareInstallationPage,
  165 |       slotPicker,
  166 |       browser,
  167 |     }) => {
  168 |       const targetDate = slotPicker.daysFromToday(10);
  169 | 
  170 |       for (let i = 0; i < 2; i++) {
  171 |         const txnId = await softwareInstallationPage.purchaseInstallation(1);
  172 |         await slotPicker.openSlotModal(targetDate);
  173 |         await slotPicker.incrementSlot(MORNING, 1);
  174 |         await slotPicker.saveSlotChanges();
  175 |         await slotPicker.confirmAppointment();
  176 |       }
  177 | 
  178 |       const txnId1 = await softwareInstallationPage.purchaseInstallation(1);
  179 |       await slotPicker.openSlotModal(targetDate);
  180 |       const beforeBooked = await slotPicker.getModalSlotBooked(MORNING);
  181 |       expect(beforeBooked.booked).toBe(2);
  182 | 
  183 |       // UCD2: requires second UCD account (ENV.ucd2Username / ENV.ucd2Password)
  184 |       // Skeleton — fill in when UCD2 credentials are available.
  185 | 
  186 |       await slotPicker.incrementSlot(MORNING, 1);
  187 |       await slotPicker.saveSlotChanges();
  188 |     });
  189 |   });
  190 | 
  191 |   // ────────────────────────────────────────────────────────────
  192 |   // BO — No capacity limit
  193 |   // ────────────────────────────────────────────────────────────
  194 |   test.describe("BO", () => {
  195 |     test.beforeEach(async ({ loginPage }) => {
  196 |       await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
  197 |     });
  198 | 
```