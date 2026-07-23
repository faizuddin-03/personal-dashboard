# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Biometric Purchase - Paid Install Mandatory
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:209:9

# Error details

```
Error: expect(received).toMatch(expected)

Expected pattern: /submitted\.do/
Received string:  "https://staging.eauto.my/uat1/view/ucd/service-hub/installation/slot.do?id=fb243d93-3469-4c3d-a051-59e98d0cc31b"
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
          - row "20 Full 21 Full 22 Full 23 Full 24 Selected (1) 1 Available 25 26" [ref=e71]:
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
            - cell "24 Selected (1) 1 Available" [ref=e84] [cursor=pointer]:
              - text: "24"
              - generic [ref=e85]:
                - generic [ref=e86]: Selected (1)
                - generic [ref=e87]: 1 Available
            - cell "25" [ref=e88]
            - cell "26" [ref=e89]
          - row "27 3 Available 28 6 Available 29 6 Available 30 4 Available 31 Full 1 2" [ref=e90]:
            - cell "27 3 Available" [ref=e91] [cursor=pointer]:
              - text: "27"
              - generic [ref=e93]: 3 Available
            - cell "28 6 Available" [ref=e94] [cursor=pointer]:
              - text: "28"
              - generic [ref=e96]: 6 Available
            - cell "29 6 Available" [ref=e97] [cursor=pointer]:
              - text: "29"
              - generic [ref=e99]: 6 Available
            - cell "30 4 Available" [ref=e100] [cursor=pointer]:
              - text: "30"
              - generic [ref=e102]: 4 Available
            - cell "31 Full" [ref=e103]:
              - text: "31"
              - generic [ref=e105]: Full
            - cell "1" [ref=e106]
            - cell "2" [ref=e107]
      - generic [ref=e109]:
        - generic [ref=e110]: Booked 1 of 3 appointment(s).
        - button "Confirm Appointment" [ref=e112] [cursor=pointer]
  - generic [ref=e113]:
    - generic [ref=e114]:
      - button "HOME" [ref=e115] [cursor=pointer]
      - button "INSURANCE" [ref=e116] [cursor=pointer]
      - button "REPORTS" [ref=e117] [cursor=pointer]
      - button "SETTINGS" [ref=e118] [cursor=pointer]
      - button "USER GUIDE" [ref=e119] [cursor=pointer]
      - button "DOWNLOAD" [ref=e120] [cursor=pointer]
      - button "CONTACT US" [ref=e121] [cursor=pointer]
    - table [ref=e122]:
      - rowgroup [ref=e123]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e124]:
          - cell "Online Services - Service Hub" [ref=e125]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e126]:
            - list [ref=e127]:
              - listitem [ref=e128]:
                - img [ref=e129]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e130]: "|"
              - listitem [ref=e131]:
                - link "Logout" [ref=e132] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e134]
  - generic [ref=e135]:
    - generic [ref=e137]:
      - generic [ref=e138]:
        - link "Contact Us" [ref=e139] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e140]: "|"
        - link "Terms & Conditions" [ref=e141] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e142]: "|"
        - link "Privacy" [ref=e143] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e144]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e145]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e147]
```

# Test source

```ts
  145 |       // Book the remaining unit — should now be allowed to proceed
  146 |       await slotPicker.allocateUnitsAnywhere(1);
  147 | 
  148 |       const allocated = await slotPicker.getAllocatedCount();
  149 |       expect(allocated).toBe(2);
  150 | 
  151 |       await slotPicker.confirmAppointment();
  152 |       await expect(clientErr).toBeHidden();
  153 |     });
  154 | 
  155 |     test("Biometric Purchase - Free Install Option (partial booking)", async ({
  156 |       biometricPurchasePage,
  157 |       slotPicker,
  158 |     }) => {
  159 |       // 2 devices → 2 free software installations. Do not opt for extra
  160 |       // (paid) installs. Expected: UCD may PARTIALLY book — the remaining
  161 |       // free appointment stays valid for 1 month (tied to the SR reference).
  162 |       await biometricPurchasePage.purchaseDevice({
  163 |         deviceQty: 2,
  164 |         recipientName: "Test Receiver",
  165 |         contactNo: "0123456789",
  166 |         shipToShowroom: true,
  167 |       });
  168 | 
  169 |       const total = await slotPicker.getAllocationTotal();
  170 |       expect(total).toBe(2);
  171 | 
  172 |       const targetDate = await slotPicker.findDateWithRoom(1);
  173 |       expect(targetDate).not.toBeNull();
  174 | 
  175 |       // Book only 1 of the 2 free installations
  176 |       await slotPicker.allocateUnitsAnywhere(1, targetDate!);
  177 | 
  178 |       const remaining = await slotPicker.getRemainingToAllocate();
  179 |       expect(remaining).toBe(1);
  180 | 
  181 |       // Free installs are optional — confirming with 1 of 2 booked must succeed
  182 |       await slotPicker.confirmAppointment();
  183 |       const clientErr = slotPicker.page.locator("#si-clienterr");
  184 |       await expect(clientErr).toBeHidden();
  185 |     });
  186 | 
  187 |     test("Biometric Purchase - Free Install Option (no booking)", async ({
  188 |       biometricPurchasePage,
  189 |       slotPicker,
  190 |     }) => {
  191 |       // 2 devices → 2 free installs, no extra (paid) installs. Expected: UCD
  192 |       // may proceed WITHOUT booking any appointment now — all free installs
  193 |       // remain valid for 1 month (tied to the SR reference).
  194 |       await biometricPurchasePage.purchaseDevice({
  195 |         deviceQty: 2,
  196 |         recipientName: "Test Receiver",
  197 |         contactNo: "0123456789",
  198 |         shipToShowroom: true,
  199 |       });
  200 | 
  201 |       expect(await slotPicker.getAllocationTotal()).toBe(2);
  202 | 
  203 |       // Confirm with nothing booked — free installs are optional, so this
  204 |       // must be allowed to proceed (no mandatory paid unit to block it).
  205 |       await slotPicker.confirmAppointment();
  206 |       expect(slotPicker.page.url()).toMatch(/submitted\.do/);
  207 |     });
  208 | 
  209 |     test("Biometric Purchase - Paid Install Mandatory", async ({
  210 |       biometricPurchasePage,
  211 |       slotPicker,
  212 |     }) => {
  213 |       // 2 devices → 2 free installs, plus opt in for 1 extra (paid) install.
  214 |       // Total to allocate = 3; the paid unit is mandatory.
  215 |       await biometricPurchasePage.purchaseDevice({
  216 |         deviceQty: 2,
  217 |         recipientName: "Test Receiver",
  218 |         contactNo: "0123456789",
  219 |         shipToShowroom: true,
  220 |         additionalInstalls: 1,
  221 |       });
  222 | 
  223 |       // Paid/extra installations are allocated FIRST and are mandatory;
  224 |       // the free ones just have a booking deadline — they don't block
  225 |       // confirmation. So with 1 paid unit, booking 0 must be blocked,
  226 |       // and booking 1 (the paid unit) must be enough to proceed even
  227 |       // though the 2 free units remain unbooked.
  228 |       const total = await slotPicker.getAllocationTotal();
  229 |       expect(total).toBe(3);
  230 | 
  231 |       const targetDate = await slotPicker.findDateWithRoom(1);
  232 |       expect(targetDate).not.toBeNull();
  233 | 
  234 |       // Confirm with nothing booked — the mandatory paid unit is missing
  235 |       await slotPicker.confirmAppointment();
  236 |       expect(slotPicker.page.url()).not.toMatch(/submitted\.do/);
  237 | 
  238 |       // Book exactly 1 unit (the mandatory paid one) — the 2 free ones stay unbooked
  239 |       await slotPicker.allocateUnitsAnywhere(1, targetDate!);
  240 | 
  241 |       const allocated = await slotPicker.getAllocatedCount();
  242 |       expect(allocated).toBe(1);
  243 | 
  244 |       await slotPicker.confirmAppointment();
> 245 |       expect(slotPicker.page.url()).toMatch(/submitted\.do/);
      |                                     ^ Error: expect(received).toMatch(expected)
  246 |     });
  247 | 
  248 |     test("Two UCD - Select same last available slot", async ({
  249 |       softwareInstallationPage,
  250 |       slotPicker,
  251 |       browser,
  252 |     }) => {
  253 |       // Scout: find a date where morning specifically has room
  254 |       await softwareInstallationPage.purchaseInstallation(1);
  255 |       const targetDate = await slotPicker.findDateWithSlotRoom(MORNING, 1);
  256 |       expect(targetDate).not.toBeNull();
  257 | 
  258 |       await slotPicker.openSlotModal(targetDate!);
  259 |       let current = await slotPicker.getModalSlotBooked(MORNING);
  260 |       expect(current.max - current.booked).toBeGreaterThan(0);
  261 | 
  262 |       // Keep buying + booking 1 unit at a time into morning until exactly
  263 |       // 1 slot remains — whatever the starting point was
  264 |       while (current.max - current.booked > 1) {
  265 |         await slotPicker.incrementSlot(MORNING, 1);
  266 |         await slotPicker.saveSlotChanges();
  267 |         await slotPicker.confirmAppointment();
  268 | 
  269 |         await softwareInstallationPage.purchaseInstallation(1);
  270 |         await slotPicker.openSlotModal(targetDate!);
  271 |         current = await slotPicker.getModalSlotBooked(MORNING);
  272 |       }
  273 | 
  274 |       // Exactly 1 slot remains, and we have an unconfirmed purchase with
  275 |       // its modal already open — this is the "last" purchase attempting
  276 |       // to grab it
  277 |       const beforeBooked = current;
  278 |       expect(beforeBooked.booked).toBe(beforeBooked.max - 1);
  279 | 
  280 |       // UCD2: would book the same last slot in a parallel context
  281 |       // NOTE: requires second UCD account (ENV.ucd2Username / ENV.ucd2Password)
  282 | 
  283 |       await slotPicker.incrementSlot(MORNING, 1);
  284 |       await slotPicker.saveSlotChanges();
  285 |     });
  286 | 
  287 |     // ── Reschedule-entry parity ──
  288 |     // The QA doc pairs every capacity scenario with both an "Add New" and a
  289 |     // "Reschedule" entry point. The slot modal/stepper is the same shared
  290 |     // component either way (SlotPickerComponent), but the doc explicitly
  291 |     // wants the cap verified when reached via Reschedule too, so these open
  292 |     // the calendar through an existing appointment's Reschedule action
  293 |     // instead of a fresh purchase.
  294 |     async function openRescheduleCalendar(
  295 |       listingPage: import("../pages/ServiceRequestListingPage").ServiceRequestListingPage,
  296 |       reschedulePage: import("../pages/ReschedulePage").ReschedulePage,
  297 |     ): Promise<boolean> {
  298 |       await listingPage.navigate();
  299 |       await listingPage.searchBtn.click();
  300 |       await listingPage.waitForNav();
  301 |       const rows = await listingPage.getResultRows();
  302 |       for (const row of rows) {
  303 |         if (await listingPage.hasRescheduleAction(row)) {
  304 |           await listingPage.clickReschedule(row);
  305 |           return true;
  306 |         }
  307 |       }
  308 |       return false;
  309 |     }
  310 | 
  311 |     test("Morning Slot - Max Capacity (via Reschedule)", async ({ listingPage, reschedulePage }) => {
  312 |       if (!(await openRescheduleCalendar(listingPage, reschedulePage))) {
  313 |         test.skip(true, "No reschedulable appointment to open a calendar from.");
  314 |         return;
  315 |       }
  316 |       const total = await reschedulePage.getAllocationTotal();
  317 |       if (total < ENV.slotCapacity.perSlot + 1) {
  318 |         test.skip(
  319 |           true,
  320 |           `Reschedule record has allocation total ${total}; need at least ${ENV.slotCapacity.perSlot + 1} to validate per-slot cap independently of allocation cap.`
  321 |         );
  322 |         return;
  323 |       }
  324 |       const date = await reschedulePage.findDateMatching((i) => i.morning.booked === 0);
  325 |       if (!date) {
  326 |         test.skip(true, "No date with an empty morning session available.");
  327 |         return;
  328 |       }
  329 |       await test.step(`Expected: morning session accepts at most ${ENV.slotCapacity.perSlot}`, async () => {
  330 |         await reschedulePage.openSlotModal(date);
  331 |         await reschedulePage.incrementSlot(MORNING, ENV.slotCapacity.perSlot + 1);
  332 |         expect(await reschedulePage.getStepperValue(MORNING)).toBe(ENV.slotCapacity.perSlot);
  333 |       });
  334 |     });
  335 | 
  336 |     test("Afternoon Slot - Max Capacity (via Reschedule)", async ({ listingPage, reschedulePage }) => {
  337 |       if (!(await openRescheduleCalendar(listingPage, reschedulePage))) {
  338 |         test.skip(true, "No reschedulable appointment to open a calendar from.");
  339 |         return;
  340 |       }
  341 |       const total = await reschedulePage.getAllocationTotal();
  342 |       if (total < ENV.slotCapacity.perSlot + 1) {
  343 |         test.skip(
  344 |           true,
  345 |           `Reschedule record has allocation total ${total}; need at least ${ENV.slotCapacity.perSlot + 1} to validate per-slot cap independently of allocation cap.`
```