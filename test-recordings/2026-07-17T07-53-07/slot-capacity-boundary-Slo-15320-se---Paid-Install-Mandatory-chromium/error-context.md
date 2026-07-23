# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Biometric Purchase - Paid Install Mandatory
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:204:9

# Error details

```
Error: expect(received).not.toMatch(expected)

Expected pattern: not /submitted\.do/
Received string:      "https://staging.eauto.my/uat1/view/ucd/service-hub/installation/submitted.do?id=dbad5c62-c206-4bf7-832c-1f0692492a9f"
```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e5]: Biometric Device Purchase
    - generic [ref=e6]:
      - generic [ref=e7]:
        - generic [ref=e8]: "1"
        - generic [ref=e9]: Selection
      - generic [ref=e10]: →
      - generic [ref=e11]:
        - generic [ref=e12]: "2"
        - generic [ref=e13]: Payment
      - generic [ref=e14]: →
      - generic [ref=e15]:
        - generic [ref=e16]: "3"
        - generic [ref=e17]: Appointment
      - generic [ref=e18]: →
      - generic [ref=e19]:
        - generic [ref=e20]: "4"
        - generic [ref=e21]: Submission
    - generic [ref=e23]:
      - generic [ref=e24]:
        - img "Success" [ref=e26]
        - generic [ref=e27]: Request Submitted
      - generic [ref=e28]: We have received your request and you will receive an email for confirmation.
      - generic [ref=e29]:
        - generic [ref=e30]:
          - generic [ref=e31]: Biometric Device Purchase Details
          - generic [ref=e32]:
            - generic [ref=e33]:
              - generic [ref=e34]: "Purchased Devices:"
              - generic [ref=e35]: 2 Units
            - generic [ref=e36]:
              - generic [ref=e37]: "Recipient Name:"
              - generic [ref=e38]: Test Receiver
            - generic [ref=e39]:
              - generic [ref=e40]: "Contact No:"
              - generic [ref=e41]: "0123456789"
            - generic [ref=e42]:
              - generic [ref=e43]: "Shipping Address:"
              - generic [ref=e44]: 24, JALAN SULAM EMPAT, 19/14D
        - generic [ref=e45]:
          - generic [ref=e46]: Software Installation Appointment Details
          - generic [ref=e47]: No installation appointment scheduled.
        - generic [ref=e48]:
          - generic [ref=e49]: Payment Details
          - generic [ref=e50]:
            - generic [ref=e51]:
              - generic [ref=e52]: "Biometric Device(s):"
              - generic [ref=e53]: RM 1700.00
            - generic [ref=e54]:
              - generic [ref=e55]: "Software Installation:"
              - generic [ref=e56]: RM 54.00
            - generic [ref=e57]:
              - generic [ref=e58]: "Total Paid:"
              - generic [ref=e59]: RM 1754.00
      - link "Done" [ref=e60] [cursor=pointer]:
        - /url: /uat1/view/ucd/service-hub/receipt.do?id=dbad5c62-c206-4bf7-832c-1f0692492a9f
  - generic [ref=e61]:
    - generic [ref=e62]:
      - button "HOME" [ref=e63] [cursor=pointer]
      - button "INSURANCE" [ref=e64] [cursor=pointer]
      - button "REPORTS" [ref=e65] [cursor=pointer]
      - button "SETTINGS" [ref=e66] [cursor=pointer]
      - button "USER GUIDE" [ref=e67] [cursor=pointer]
      - button "DOWNLOAD" [ref=e68] [cursor=pointer]
      - button "CONTACT US" [ref=e69] [cursor=pointer]
    - table [ref=e70]:
      - rowgroup [ref=e71]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e72]:
          - cell "Online Services - Service Hub" [ref=e73]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e74]:
            - list [ref=e75]:
              - listitem [ref=e76]:
                - img [ref=e77]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e78]: "|"
              - listitem [ref=e79]:
                - link "Logout" [ref=e80] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e82]
  - generic [ref=e83]:
    - generic [ref=e85]:
      - generic [ref=e86]:
        - link "Contact Us" [ref=e87] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e88]: "|"
        - link "Terms & Conditions" [ref=e89] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e90]: "|"
        - link "Privacy" [ref=e91] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e92]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e93]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e95]
```

# Test source

```ts
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
> 231 |       expect(slotPicker.page.url()).not.toMatch(/submitted\.do/);
      |                                         ^ Error: expect(received).not.toMatch(expected)
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
  302 |       }
  303 |       return false;
  304 |     }
  305 | 
  306 |     test("Morning Slot - Max Capacity (via Reschedule)", async ({ listingPage, reschedulePage }) => {
  307 |       if (!(await openRescheduleCalendar(listingPage, reschedulePage))) {
  308 |         test.skip(true, "No reschedulable appointment to open a calendar from.");
  309 |         return;
  310 |       }
  311 |       const date = await reschedulePage.findDateMatching((i) => i.morning.booked === 0);
  312 |       if (!date) {
  313 |         test.skip(true, "No date with an empty morning session available.");
  314 |         return;
  315 |       }
  316 |       await test.step(`Expected: morning session accepts at most ${ENV.slotCapacity.perSlot}`, async () => {
  317 |         await reschedulePage.openSlotModal(date);
  318 |         await reschedulePage.incrementSlot(MORNING, ENV.slotCapacity.perSlot + 1);
  319 |         expect(await reschedulePage.getStepperValue(MORNING)).toBe(ENV.slotCapacity.perSlot);
  320 |       });
  321 |     });
  322 | 
  323 |     test("Afternoon Slot - Max Capacity (via Reschedule)", async ({ listingPage, reschedulePage }) => {
  324 |       if (!(await openRescheduleCalendar(listingPage, reschedulePage))) {
  325 |         test.skip(true, "No reschedulable appointment to open a calendar from.");
  326 |         return;
  327 |       }
  328 |       const date = await reschedulePage.findDateMatching((i) => i.afternoon.booked === 0);
  329 |       if (!date) {
  330 |         test.skip(true, "No date with an empty afternoon session available.");
  331 |         return;
```