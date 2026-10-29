# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Software Installation - Mandatory Booking
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:140:9

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
          - generic [ref=e17]: Software Installation — Select Appointment(s)
          - generic [ref=e18]: Payment received. Allocate your 2 installations to a date and time slot (up to 3 per slot).
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
          - row "24 Slot 1/6 25 Slot 1/6 26 Slot 2/6 27 Slot 6/6 28 Slot 6/6 29 30" [ref=e97]:
            - cell "24 Slot 1/6" [ref=e98] [cursor=pointer]:
              - text: "24"
              - generic [ref=e100]: Slot 1/6
            - cell "25 Slot 1/6" [ref=e101] [cursor=pointer]:
              - text: "25"
              - generic [ref=e103]: Slot 1/6
            - cell "26 Slot 2/6" [ref=e104] [cursor=pointer]:
              - text: "26"
              - generic [ref=e106]: Slot 2/6
            - cell "27 Slot 6/6" [ref=e107]:
              - text: "27"
              - generic [ref=e109]: Slot 6/6
            - cell "28 Slot 6/6" [ref=e110]:
              - text: "28"
              - generic [ref=e112]: Slot 6/6
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
        - generic [ref=e126]: Booked 0 of 2
        - generic [ref=e127]: Click a bookable date above to allocate an installation.
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
  51  |       expect(after.booked).toBe(before.booked);
  52  | 
  53  |       // Allocate the remaining unit to the afternoon slot to complete the booking
  54  |       await slotPicker.incrementSlot(AFTERNOON, 1);
  55  |       await slotPicker.saveSlotChanges();
  56  |       await slotPicker.confirmAppointment();
  57  |     });
  58  | 
  59  |     test("Afternoon Slot - Book until full", async ({
  60  |       softwareInstallationPage,
  61  |       slotPicker,
  62  |     }) => {
  63  |       // Single purchase of 4 installations — try to allocate all 4 into
  64  |       // the afternoon slot of one date, whose capacity is 3.
  65  |       await softwareInstallationPage.purchaseInstallation(ENV.slotCapacity.perSlot + 1);
  66  |       const targetDate = await slotPicker.findEmptyBookableDate();
  67  |       expect(targetDate).not.toBeNull();
  68  | 
  69  |       // Book and save one unit at a time — the modal's capacity indicator
  70  |       // reflects committed bookings, not in-progress stepper clicks.
  71  |       for (let i = 0; i < ENV.slotCapacity.perSlot; i++) {
  72  |         await slotPicker.openSlotModal(targetDate!);
  73  |         await slotPicker.incrementSlot(AFTERNOON, 1);
  74  |         await slotPicker.saveSlotChanges();
  75  |       }
  76  | 
  77  |       await slotPicker.openSlotModal(targetDate!);
  78  |       const isAfternoonFull = await slotPicker.isSlotFullyBooked(AFTERNOON);
  79  |       expect(isAfternoonFull).toBe(true);
  80  | 
  81  |       const isMorningFull = await slotPicker.isSlotFullyBooked(MORNING);
  82  |       expect(isMorningFull).toBe(false);
  83  | 
  84  |       // Try to add the 4th unit to the now-full afternoon slot — must be rejected
  85  |       const before = await slotPicker.getModalSlotBooked(AFTERNOON);
  86  |       await slotPicker.incrementSlot(AFTERNOON, 1);
  87  |       const after = await slotPicker.getModalSlotBooked(AFTERNOON);
  88  |       expect(after.booked).toBe(before.booked);
  89  | 
  90  |       // Allocate the remaining unit to the morning slot to complete the booking
  91  |       await slotPicker.incrementSlot(MORNING, 1);
  92  |       await slotPicker.saveSlotChanges();
  93  |       await slotPicker.confirmAppointment();
  94  |     });
  95  | 
  96  |     test("Day capacity reach 6/6", async ({
  97  |       softwareInstallationPage,
  98  |       slotPicker,
  99  |     }) => {
  100 |       // Buy 6 installations into a single empty date: 3 morning + 3 afternoon
  101 |       await softwareInstallationPage.purchaseInstallation(1);
  102 |       const targetDate = await slotPicker.findEmptyBookableDate();
  103 |       expect(targetDate).not.toBeNull();
  104 | 
  105 |       await slotPicker.openSlotModal(targetDate!);
  106 |       await slotPicker.incrementSlot(MORNING, 1);
  107 |       await slotPicker.saveSlotChanges();
  108 |       await slotPicker.confirmAppointment();
  109 | 
  110 |       for (let i = 1; i < ENV.slotCapacity.perSlot; i++) {
  111 |         await softwareInstallationPage.purchaseInstallation(1);
  112 |         await slotPicker.openSlotModal(targetDate!);
  113 |         await slotPicker.incrementSlot(MORNING, 1);
  114 |         await slotPicker.saveSlotChanges();
  115 |         await slotPicker.confirmAppointment();
  116 |       }
  117 |       for (let i = 0; i < ENV.slotCapacity.perSlot; i++) {
  118 |         await softwareInstallationPage.purchaseInstallation(1);
  119 |         await slotPicker.openSlotModal(targetDate!);
  120 |         await slotPicker.incrementSlot(AFTERNOON, 1);
  121 |         await slotPicker.saveSlotChanges();
  122 |         await slotPicker.confirmAppointment();
  123 |       }
  124 | 
  125 |       // 7th installation — the date should now read 6/6 and no longer be
  126 |       // clickable/bookable at all (fully booked for the day)
  127 |       await softwareInstallationPage.purchaseInstallation(1);
  128 | 
  129 |       const slotCount = await slotPicker.getSlotCount(targetDate!);
  130 |       expect(slotCount.used).toBe(ENV.slotCapacity.perDay);
  131 |       expect(slotCount.total).toBe(ENV.slotCapacity.perDay);
  132 | 
  133 |       const isFullyBookedDay = await slotPicker.isDayFullyBooked(targetDate!);
  134 |       expect(isFullyBookedDay).toBe(true);
  135 | 
  136 |       const isBookable = await slotPicker.isDayBookable(targetDate!);
  137 |       expect(isBookable).toBe(false);
  138 |     });
  139 | 
  140 |     test("Software Installation - Mandatory Booking", async ({
  141 |       softwareInstallationPage,
  142 |       slotPicker,
  143 |     }) => {
  144 |       // Buy 2 installations — both units must be booked before confirming
  145 |       await softwareInstallationPage.purchaseInstallation(2);
  146 | 
  147 |       const total = await slotPicker.getAllocationTotal();
  148 |       expect(total).toBe(2);
  149 | 
  150 |       const targetDate = await slotPicker.findEmptyBookableDate();
> 151 |       expect(targetDate).not.toBeNull();
      |                              ^ Error: expect(received).not.toBeNull()
  152 | 
  153 |       // Book only 1 of the 2 units
  154 |       await slotPicker.openSlotModal(targetDate!);
  155 |       await slotPicker.incrementSlot(MORNING, 1);
  156 |       await slotPicker.saveSlotChanges();
  157 | 
  158 |       const remainingAfter = await slotPicker.getRemainingToAllocate();
  159 |       expect(remainingAfter).toBe(1);
  160 | 
  161 |       // Try to confirm with 1 still unbooked — should be blocked
  162 |       await slotPicker.confirmAppointment();
  163 |       const clientErr = slotPicker.page.locator("#si-clienterr");
  164 |       await expect(clientErr).toBeVisible();
  165 | 
  166 |       // Book the remaining unit — should now be allowed to proceed
  167 |       await slotPicker.openSlotModal(targetDate!);
  168 |       await slotPicker.incrementSlot(MORNING, 1);
  169 |       await slotPicker.saveSlotChanges();
  170 | 
  171 |       const allocated = await slotPicker.getAllocatedCount();
  172 |       expect(allocated).toBe(2);
  173 | 
  174 |       await slotPicker.confirmAppointment();
  175 |       await expect(clientErr).toBeHidden();
  176 |     });
  177 | 
  178 |     test("Biometric Purchase - Free Install Option", async ({
  179 |       biometricPurchasePage,
  180 |       slotPicker,
  181 |     }) => {
  182 |       // 2 devices → 2 free software installations. Do not opt for extra
  183 |       // (paid) installs.
  184 |       await biometricPurchasePage.purchaseDevice({
  185 |         deviceQty: 2,
  186 |         recipientName: "Test Receiver",
  187 |         contactNo: "0123456789",
  188 |         shipToShowroom: true,
  189 |       });
  190 | 
  191 |       const total = await slotPicker.getAllocationTotal();
  192 |       expect(total).toBe(2);
  193 | 
  194 |       const targetDate = await slotPicker.findEmptyBookableDate();
  195 |       expect(targetDate).not.toBeNull();
  196 | 
  197 |       // Book only 1 of the 2 free installations
  198 |       await slotPicker.openSlotModal(targetDate!);
  199 |       await slotPicker.incrementSlot(MORNING, 1);
  200 |       await slotPicker.saveSlotChanges();
  201 | 
  202 |       const remaining = await slotPicker.getRemainingToAllocate();
  203 |       expect(remaining).toBe(1);
  204 | 
  205 |       // Free installs are optional — confirming with 1 of 2 booked must succeed
  206 |       await slotPicker.confirmAppointment();
  207 |       const clientErr = slotPicker.page.locator("#si-clienterr");
  208 |       await expect(clientErr).toBeHidden();
  209 |     });
  210 | 
  211 |     test("Biometric Purchase - Paid Install Mandatory", async ({
  212 |       biometricPurchasePage,
  213 |       slotPicker,
  214 |     }) => {
  215 |       // 2 devices → 2 free installs, plus opt in for 1 extra (paid) install.
  216 |       // Total to allocate = 3; the paid unit is mandatory.
  217 |       await biometricPurchasePage.purchaseDevice({
  218 |         deviceQty: 2,
  219 |         recipientName: "Test Receiver",
  220 |         contactNo: "0123456789",
  221 |         shipToShowroom: true,
  222 |         additionalInstalls: 1,
  223 |       });
  224 | 
  225 |       // Paid/extra installations are allocated FIRST and are mandatory;
  226 |       // the free ones just have a booking deadline — they don't block
  227 |       // confirmation. So with 1 paid unit, booking 0 must be blocked,
  228 |       // and booking 1 (the paid unit) must be enough to proceed even
  229 |       // though the 2 free units remain unbooked.
  230 |       const total = await slotPicker.getAllocationTotal();
  231 |       expect(total).toBe(3);
  232 | 
  233 |       const targetDate = await slotPicker.findEmptyBookableDate();
  234 |       expect(targetDate).not.toBeNull();
  235 | 
  236 |       // Confirm with nothing booked — the mandatory paid unit is missing
  237 |       await slotPicker.confirmAppointment();
  238 |       expect(slotPicker.page.url()).not.toMatch(/submitted\.do/);
  239 | 
  240 |       // Book exactly 1 unit (the mandatory paid one) — the 2 free ones stay unbooked
  241 |       await slotPicker.openSlotModal(targetDate!);
  242 |       await slotPicker.incrementSlot(MORNING, 1);
  243 |       await slotPicker.saveSlotChanges();
  244 | 
  245 |       const allocated = await slotPicker.getAllocatedCount();
  246 |       expect(allocated).toBe(1);
  247 | 
  248 |       await slotPicker.confirmAppointment();
  249 |       expect(slotPicker.page.url()).toMatch(/submitted\.do/);
  250 |     });
  251 | 
```