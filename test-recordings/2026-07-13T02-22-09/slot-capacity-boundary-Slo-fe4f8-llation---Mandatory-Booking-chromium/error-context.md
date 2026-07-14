# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Software Installation - Mandatory Booking
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:143:9

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
          - row "27 Slot 3/6 28 Slot 4/6 29 Slot 1/6 30 Slot 1/6 31 Slot 3/6 1 2" [ref=e86]:
            - cell "27 Slot 3/6" [ref=e87] [cursor=pointer]:
              - text: "27"
              - generic [ref=e89]: Slot 3/6
            - cell "28 Slot 4/6" [ref=e90] [cursor=pointer]:
              - text: "28"
              - generic [ref=e92]: Slot 4/6
            - cell "29 Slot 1/6" [ref=e93] [cursor=pointer]:
              - text: "29"
              - generic [ref=e95]: Slot 1/6
            - cell "30 Slot 1/6" [ref=e96] [cursor=pointer]:
              - text: "30"
              - generic [ref=e98]: Slot 1/6
            - cell "31 Slot 3/6" [ref=e99] [cursor=pointer]:
              - text: "31"
              - generic [ref=e101]: Slot 3/6
            - cell "1" [ref=e102]
            - cell "2" [ref=e103]
      - generic [ref=e104]:
        - generic [ref=e105]: Booked 0 of 2
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
  54  |       // Attempting to add another unit to the full morning slot must not
  55  |       // increase the booked count
  56  |       const before = await slotPicker.getModalSlotBooked(MORNING);
  57  |       await slotPicker.incrementSlot(MORNING, 1);
  58  |       const after = await slotPicker.getModalSlotBooked(MORNING);
  59  |       expect(after.booked).toBe(before.booked);
  60  |     });
  61  | 
  62  |     test("Afternoon Slot - Book until full", async ({
  63  |       softwareInstallationPage,
  64  |       slotPicker,
  65  |     }) => {
  66  |       await softwareInstallationPage.purchaseInstallation(1);
  67  |       const targetDate = await slotPicker.findEmptyBookableDate();
  68  |       expect(targetDate).not.toBeNull();
  69  | 
  70  |       await slotPicker.openSlotModal(targetDate!);
  71  |       await slotPicker.incrementSlot(AFTERNOON, 1);
  72  |       await slotPicker.saveSlotChanges();
  73  |       await slotPicker.confirmAppointment();
  74  | 
  75  |       for (let i = 1; i < ENV.slotCapacity.perSlot; i++) {
  76  |         await softwareInstallationPage.purchaseInstallation(1);
  77  |         await slotPicker.openSlotModal(targetDate!);
  78  |         await slotPicker.incrementSlot(AFTERNOON, 1);
  79  |         await slotPicker.saveSlotChanges();
  80  |         await slotPicker.confirmAppointment();
  81  |       }
  82  | 
  83  |       // 4th installation — try to book a 4th unit into the now-full afternoon slot
  84  |       await softwareInstallationPage.purchaseInstallation(1);
  85  |       await slotPicker.openSlotModal(targetDate!);
  86  | 
  87  |       const isAfternoonFull = await slotPicker.isSlotFullyBooked(AFTERNOON);
  88  |       expect(isAfternoonFull).toBe(true);
  89  | 
  90  |       const isMorningFull = await slotPicker.isSlotFullyBooked(MORNING);
  91  |       expect(isMorningFull).toBe(false);
  92  | 
  93  |       const before = await slotPicker.getModalSlotBooked(AFTERNOON);
  94  |       await slotPicker.incrementSlot(AFTERNOON, 1);
  95  |       const after = await slotPicker.getModalSlotBooked(AFTERNOON);
  96  |       expect(after.booked).toBe(before.booked);
  97  |     });
  98  | 
  99  |     test("Day capacity reach 6/6", async ({
  100 |       softwareInstallationPage,
  101 |       slotPicker,
  102 |     }) => {
  103 |       // Buy 6 installations into a single empty date: 3 morning + 3 afternoon
  104 |       await softwareInstallationPage.purchaseInstallation(1);
  105 |       const targetDate = await slotPicker.findEmptyBookableDate();
  106 |       expect(targetDate).not.toBeNull();
  107 | 
  108 |       await slotPicker.openSlotModal(targetDate!);
  109 |       await slotPicker.incrementSlot(MORNING, 1);
  110 |       await slotPicker.saveSlotChanges();
  111 |       await slotPicker.confirmAppointment();
  112 | 
  113 |       for (let i = 1; i < ENV.slotCapacity.perSlot; i++) {
  114 |         await softwareInstallationPage.purchaseInstallation(1);
  115 |         await slotPicker.openSlotModal(targetDate!);
  116 |         await slotPicker.incrementSlot(MORNING, 1);
  117 |         await slotPicker.saveSlotChanges();
  118 |         await slotPicker.confirmAppointment();
  119 |       }
  120 |       for (let i = 0; i < ENV.slotCapacity.perSlot; i++) {
  121 |         await softwareInstallationPage.purchaseInstallation(1);
  122 |         await slotPicker.openSlotModal(targetDate!);
  123 |         await slotPicker.incrementSlot(AFTERNOON, 1);
  124 |         await slotPicker.saveSlotChanges();
  125 |         await slotPicker.confirmAppointment();
  126 |       }
  127 | 
  128 |       // 7th installation — the date should now read 6/6 and no longer be
  129 |       // clickable/bookable at all (fully booked for the day)
  130 |       await softwareInstallationPage.purchaseInstallation(1);
  131 | 
  132 |       const slotCount = await slotPicker.getSlotCount(targetDate!);
  133 |       expect(slotCount.used).toBe(ENV.slotCapacity.perDay);
  134 |       expect(slotCount.total).toBe(ENV.slotCapacity.perDay);
  135 | 
  136 |       const isFullyBookedDay = await slotPicker.isDayFullyBooked(targetDate!);
  137 |       expect(isFullyBookedDay).toBe(true);
  138 | 
  139 |       const isBookable = await slotPicker.isDayBookable(targetDate!);
  140 |       expect(isBookable).toBe(false);
  141 |     });
  142 | 
  143 |     test("Software Installation - Mandatory Booking", async ({
  144 |       softwareInstallationPage,
  145 |       slotPicker,
  146 |     }) => {
  147 |       // Buy 2 installations — both units must be booked before confirming
  148 |       await softwareInstallationPage.purchaseInstallation(2);
  149 | 
  150 |       const total = await slotPicker.getAllocationTotal();
  151 |       expect(total).toBe(2);
  152 | 
  153 |       const targetDate = await slotPicker.findEmptyBookableDate();
> 154 |       expect(targetDate).not.toBeNull();
      |                              ^ Error: expect(received).not.toBeNull()
  155 | 
  156 |       // Book only 1 of the 2 units
  157 |       await slotPicker.openSlotModal(targetDate!);
  158 |       await slotPicker.incrementSlot(MORNING, 1);
  159 |       await slotPicker.saveSlotChanges();
  160 | 
  161 |       const remainingAfter = await slotPicker.getRemainingToAllocate();
  162 |       expect(remainingAfter).toBe(1);
  163 | 
  164 |       // Try to confirm with 1 still unbooked — should be blocked
  165 |       await slotPicker.confirmAppointment();
  166 |       const clientErr = slotPicker.page.locator("#si-clienterr");
  167 |       await expect(clientErr).toBeVisible();
  168 | 
  169 |       // Book the remaining unit — should now be allowed to proceed
  170 |       await slotPicker.openSlotModal(targetDate!);
  171 |       await slotPicker.incrementSlot(MORNING, 1);
  172 |       await slotPicker.saveSlotChanges();
  173 | 
  174 |       const allocated = await slotPicker.getAllocatedCount();
  175 |       expect(allocated).toBe(2);
  176 | 
  177 |       await slotPicker.confirmAppointment();
  178 |       await expect(clientErr).toBeHidden();
  179 |     });
  180 | 
  181 |     test("Biometric Purchase - Free Install Option", async ({
  182 |       biometricPurchasePage,
  183 |       slotPicker,
  184 |     }) => {
  185 |       // 2 devices → 2 free software installations. Do not opt for extra
  186 |       // (paid) installs.
  187 |       await biometricPurchasePage.purchaseDevice({
  188 |         deviceQty: 2,
  189 |         recipientName: "Test Receiver",
  190 |         contactNo: "0123456789",
  191 |         shipToShowroom: true,
  192 |       });
  193 | 
  194 |       const total = await slotPicker.getAllocationTotal();
  195 |       expect(total).toBe(2);
  196 | 
  197 |       const targetDate = await slotPicker.findEmptyBookableDate();
  198 |       expect(targetDate).not.toBeNull();
  199 | 
  200 |       // Book only 1 of the 2 free installations
  201 |       await slotPicker.openSlotModal(targetDate!);
  202 |       await slotPicker.incrementSlot(MORNING, 1);
  203 |       await slotPicker.saveSlotChanges();
  204 | 
  205 |       const remaining = await slotPicker.getRemainingToAllocate();
  206 |       expect(remaining).toBe(1);
  207 | 
  208 |       // Free installs are optional — confirming with 1 of 2 booked must succeed
  209 |       await slotPicker.confirmAppointment();
  210 |       const clientErr = slotPicker.page.locator("#si-clienterr");
  211 |       await expect(clientErr).toBeHidden();
  212 |     });
  213 | 
  214 |     test("Biometric Purchase - Paid Install Mandatory", async ({
  215 |       biometricPurchasePage,
  216 |       slotPicker,
  217 |     }) => {
  218 |       // 2 devices → 2 free installs, plus opt in for 1 extra (paid) install.
  219 |       // Total to allocate = 3; the paid unit is mandatory.
  220 |       await biometricPurchasePage.purchaseDevice({
  221 |         deviceQty: 2,
  222 |         recipientName: "Test Receiver",
  223 |         contactNo: "0123456789",
  224 |         shipToShowroom: true,
  225 |         additionalInstalls: 1,
  226 |       });
  227 | 
  228 |       const total = await slotPicker.getAllocationTotal();
  229 |       expect(total).toBe(3);
  230 | 
  231 |       const targetDate = await slotPicker.findEmptyBookableDate();
  232 |       expect(targetDate).not.toBeNull();
  233 | 
  234 |       // Book only the 2 free installations, leave the paid one unbooked
  235 |       await slotPicker.openSlotModal(targetDate!);
  236 |       await slotPicker.incrementSlot(MORNING, 2);
  237 |       await slotPicker.saveSlotChanges();
  238 | 
  239 |       const remainingAfter = await slotPicker.getRemainingToAllocate();
  240 |       expect(remainingAfter).toBe(1);
  241 | 
  242 |       // The paid installation is mandatory — confirming should be blocked
  243 |       await slotPicker.confirmAppointment();
  244 |       const clientErr = slotPicker.page.locator("#si-clienterr");
  245 |       await expect(clientErr).toBeVisible();
  246 | 
  247 |       // Book the remaining (paid) unit — should now be allowed to proceed
  248 |       await slotPicker.openSlotModal(targetDate!);
  249 |       await slotPicker.incrementSlot(MORNING, 1);
  250 |       await slotPicker.saveSlotChanges();
  251 | 
  252 |       const allocated = await slotPicker.getAllocatedCount();
  253 |       expect(allocated).toBe(3);
  254 | 
```