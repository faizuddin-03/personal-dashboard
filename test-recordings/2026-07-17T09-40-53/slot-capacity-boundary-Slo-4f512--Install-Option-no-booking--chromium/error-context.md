# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Biometric Purchase - Free Install Option (no booking)
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:182:9

# Error details

```
Error: expect(received).toMatch(expected)

Expected pattern: /submitted\.do/
Received string:  "https://staging.eauto.my/uat1/view/ucd/service-hub/installation/slot.do?id=6355b41f-a29f-4913-8193-01940096dc54"
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e4]: "Biometric Device Purchase:"
    - generic [ref=e5]:
      - generic [ref=e6]:
        - generic [ref=e7]: "1"
        - generic [ref=e8]: Selection
      - generic [ref=e9]: →
      - generic [ref=e10]:
        - generic [ref=e11]: "2"
        - generic [ref=e12]: Payment
      - generic [ref=e13]: →
      - generic [ref=e14]:
        - generic [ref=e15]: "3"
        - generic [ref=e16]: Appointment
      - generic [ref=e17]: →
      - generic [ref=e18]:
        - generic [ref=e19]: "4"
        - generic [ref=e20]: Submission
    - generic [ref=e23]:
      - generic [ref=e24]:
        - img "Biometric Device Purchase" [ref=e25]
        - generic [ref=e26]:
          - generic [ref=e27]: Schedule an Appointment
          - generic [ref=e28]: Please choose your preferred software installation date and time slot. (up to 3 per slot)
      - generic [ref=e29]: Incomplete appointment allocation. Please select a date and time slot to each software installation.
      - generic [ref=e30]:
        - generic [ref=e31]: Please select a date to schedule the software installation
        - generic [ref=e32]:
          - generic [ref=e33]: July 2026
          - generic [ref=e34] [cursor=pointer]: ›
      - table [ref=e35]:
        - rowgroup [ref=e36]:
          - row "MON TUE WED THUR FRI SAT SUN" [ref=e37]:
            - columnheader "MON" [ref=e38]
            - columnheader "TUE" [ref=e39]
            - columnheader "WED" [ref=e40]
            - columnheader "THUR" [ref=e41]
            - columnheader "FRI" [ref=e42]
            - columnheader "SAT" [ref=e43]
            - columnheader "SUN" [ref=e44]
        - rowgroup [ref=e45]:
          - row "29 30 1 2 3 4 5" [ref=e46]:
            - cell "29" [ref=e47]
            - cell "30" [ref=e48]
            - cell "1" [ref=e49]
            - cell "2" [ref=e50]
            - cell "3" [ref=e51]
            - cell "4" [ref=e52]
            - cell "5" [ref=e53]
          - row "6 7 8 9 10 11 12" [ref=e54]:
            - cell "6" [ref=e55]
            - cell "7" [ref=e56]
            - cell "8" [ref=e57]
            - cell "9" [ref=e58]
            - cell "10" [ref=e59]
            - cell "11" [ref=e60]
            - cell "12" [ref=e61]
          - row "13 14 15 16 17 18 19" [ref=e62]:
            - cell "13" [ref=e63]
            - cell "14" [ref=e64]
            - cell "15" [ref=e65]
            - cell "16" [ref=e66]
            - cell "17" [ref=e67]:
              - generic [ref=e68]: "17"
            - cell "18" [ref=e69]
            - cell "19" [ref=e70]
          - row "20 Full 21 Full 22 Full 23 Full 24 3 Available 25 26" [ref=e71]:
            - cell "20 Full" [ref=e72]:
              - text: "20"
              - generic [ref=e74]: Full
            - cell "21 Full" [ref=e75]:
              - text: "21"
              - generic [ref=e77]: Full
            - cell "22 Full" [ref=e78]:
              - text: "22"
              - generic [ref=e80]: Full
            - cell "23 Full" [ref=e81]:
              - text: "23"
              - generic [ref=e83]: Full
            - cell "24 3 Available" [ref=e84] [cursor=pointer]:
              - text: "24"
              - generic [ref=e86]: 3 Available
            - cell "25" [ref=e87]
            - cell "26" [ref=e88]
          - row "27 5 Available 28 6 Available 29 6 Available 30 4 Available 31 Full 1 2" [ref=e89]:
            - cell "27 5 Available" [ref=e90] [cursor=pointer]:
              - text: "27"
              - generic [ref=e92]: 5 Available
            - cell "28 6 Available" [ref=e93] [cursor=pointer]:
              - text: "28"
              - generic [ref=e95]: 6 Available
            - cell "29 6 Available" [ref=e96] [cursor=pointer]:
              - text: "29"
              - generic [ref=e98]: 6 Available
            - cell "30 4 Available" [ref=e99] [cursor=pointer]:
              - text: "30"
              - generic [ref=e101]: 4 Available
            - cell "31 Full" [ref=e102]:
              - text: "31"
              - generic [ref=e104]: Full
            - cell "1" [ref=e105]
            - cell "2" [ref=e106]
      - generic [ref=e108]:
        - generic [ref=e109]: Booked 0 of 2 appointment(s).
        - button "Confirm Appointment" [ref=e111] [cursor=pointer]
  - generic [ref=e112]:
    - generic [ref=e113]:
      - button "HOME" [ref=e114] [cursor=pointer]
      - button "INSURANCE" [ref=e115] [cursor=pointer]
      - button "REPORTS" [ref=e116] [cursor=pointer]
      - button "SETTINGS" [ref=e117] [cursor=pointer]
      - button "USER GUIDE" [ref=e118] [cursor=pointer]
      - button "DOWNLOAD" [ref=e119] [cursor=pointer]
      - button "CONTACT US" [ref=e120] [cursor=pointer]
    - table [ref=e121]:
      - rowgroup [ref=e122]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e123]:
          - cell "Online Services - Service Hub" [ref=e124]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e125]:
            - list [ref=e126]:
              - listitem [ref=e127]:
                - img [ref=e128]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e129]: "|"
              - listitem [ref=e130]:
                - link "Logout" [ref=e131] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e133]
  - generic [ref=e134]:
    - generic [ref=e136]:
      - generic [ref=e137]:
        - link "Contact Us" [ref=e138] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e139]: "|"
        - link "Terms & Conditions" [ref=e140] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e141]: "|"
        - link "Privacy" [ref=e142] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e143]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e144]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e146]
```

# Test source

```ts
  101 |       if (morningRoom > 0) {
  102 |         await slotPicker.incrementSlot(MORNING, morningRoom);
  103 |         expect(await slotPicker.getStepperValue(MORNING)).toBe(morningRoom);
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
> 201 |       expect(slotPicker.page.url()).toMatch(/submitted\.do/);
      |                                     ^ Error: expect(received).toMatch(expected)
  202 |     });
  203 | 
  204 |     test("Biometric Purchase - Paid Install Mandatory", async ({
  205 |       biometricPurchasePage,
  206 |       slotPicker,
  207 |     }) => {
  208 |       // 2 devices → 2 free installs, plus opt in for 1 extra (paid) install.
  209 |       // Total to allocate = 3; the paid unit is mandatory.
  210 |       await biometricPurchasePage.purchaseDevice({
  211 |         deviceQty: 2,
  212 |         recipientName: "Test Receiver",
  213 |         contactNo: "0123456789",
  214 |         shipToShowroom: true,
  215 |         additionalInstalls: 1,
  216 |       });
  217 | 
  218 |       // Paid/extra installations are allocated FIRST and are mandatory;
  219 |       // the free ones just have a booking deadline — they don't block
  220 |       // confirmation. So with 1 paid unit, booking 0 must be blocked,
  221 |       // and booking 1 (the paid unit) must be enough to proceed even
  222 |       // though the 2 free units remain unbooked.
  223 |       const total = await slotPicker.getAllocationTotal();
  224 |       expect(total).toBe(3);
  225 | 
  226 |       const targetDate = await slotPicker.findDateWithRoom(1);
  227 |       expect(targetDate).not.toBeNull();
  228 | 
  229 |       // Confirm with nothing booked — the mandatory paid unit is missing
  230 |       await slotPicker.confirmAppointment();
  231 |       expect(slotPicker.page.url()).not.toMatch(/submitted\.do/);
  232 | 
  233 |       // Book exactly 1 unit (the mandatory paid one) — the 2 free ones stay unbooked
  234 |       await slotPicker.allocateUnitsAnywhere(1, targetDate!);
  235 | 
  236 |       const allocated = await slotPicker.getAllocatedCount();
  237 |       expect(allocated).toBe(1);
  238 | 
  239 |       await slotPicker.confirmAppointment();
  240 |       expect(slotPicker.page.url()).toMatch(/submitted\.do/);
  241 |     });
  242 | 
  243 |     test("Two UCD - Select same last available slot", async ({
  244 |       softwareInstallationPage,
  245 |       slotPicker,
  246 |       browser,
  247 |     }) => {
  248 |       // Scout: find a date where morning specifically has room
  249 |       await softwareInstallationPage.purchaseInstallation(1);
  250 |       const targetDate = await slotPicker.findDateWithSlotRoom(MORNING, 1);
  251 |       expect(targetDate).not.toBeNull();
  252 | 
  253 |       await slotPicker.openSlotModal(targetDate!);
  254 |       let current = await slotPicker.getModalSlotBooked(MORNING);
  255 |       expect(current.max - current.booked).toBeGreaterThan(0);
  256 | 
  257 |       // Keep buying + booking 1 unit at a time into morning until exactly
  258 |       // 1 slot remains — whatever the starting point was
  259 |       while (current.max - current.booked > 1) {
  260 |         await slotPicker.incrementSlot(MORNING, 1);
  261 |         await slotPicker.saveSlotChanges();
  262 |         await slotPicker.confirmAppointment();
  263 | 
  264 |         await softwareInstallationPage.purchaseInstallation(1);
  265 |         await slotPicker.openSlotModal(targetDate!);
  266 |         current = await slotPicker.getModalSlotBooked(MORNING);
  267 |       }
  268 | 
  269 |       // Exactly 1 slot remains, and we have an unconfirmed purchase with
  270 |       // its modal already open — this is the "last" purchase attempting
  271 |       // to grab it
  272 |       const beforeBooked = current;
  273 |       expect(beforeBooked.booked).toBe(beforeBooked.max - 1);
  274 | 
  275 |       // UCD2: would book the same last slot in a parallel context
  276 |       // NOTE: requires second UCD account (ENV.ucd2Username / ENV.ucd2Password)
  277 | 
  278 |       await slotPicker.incrementSlot(MORNING, 1);
  279 |       await slotPicker.saveSlotChanges();
  280 |     });
  281 | 
  282 |     // ── Reschedule-entry parity ──
  283 |     // The QA doc pairs every capacity scenario with both an "Add New" and a
  284 |     // "Reschedule" entry point. The slot modal/stepper is the same shared
  285 |     // component either way (SlotPickerComponent), but the doc explicitly
  286 |     // wants the cap verified when reached via Reschedule too, so these open
  287 |     // the calendar through an existing appointment's Reschedule action
  288 |     // instead of a fresh purchase.
  289 |     async function openRescheduleCalendar(
  290 |       listingPage: import("../pages/ServiceRequestListingPage").ServiceRequestListingPage,
  291 |       reschedulePage: import("../pages/ReschedulePage").ReschedulePage,
  292 |     ): Promise<boolean> {
  293 |       await listingPage.navigate();
  294 |       await listingPage.searchBtn.click();
  295 |       await listingPage.waitForNav();
  296 |       const rows = await listingPage.getResultRows();
  297 |       for (const row of rows) {
  298 |         if (await listingPage.hasRescheduleAction(row)) {
  299 |           await listingPage.clickReschedule(row);
  300 |           return true;
  301 |         }
```