# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Afternoon Slot - Max Capacity (via Reschedule)
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:323:9

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
      - generic [ref=e29]:
        - generic [ref=e30]: Please select a date to schedule the software installation
        - generic [ref=e31]:
          - generic [ref=e32]: July 2026
          - generic [ref=e33] [cursor=pointer]: ›
      - table [ref=e34]:
        - rowgroup [ref=e35]:
          - row "MON TUE WED THUR FRI SAT SUN" [ref=e36]:
            - columnheader "MON" [ref=e37]
            - columnheader "TUE" [ref=e38]
            - columnheader "WED" [ref=e39]
            - columnheader "THUR" [ref=e40]
            - columnheader "FRI" [ref=e41]
            - columnheader "SAT" [ref=e42]
            - columnheader "SUN" [ref=e43]
        - rowgroup [ref=e44]:
          - row "29 30 1 2 3 4 5" [ref=e45]:
            - cell "29" [ref=e46]
            - cell "30" [ref=e47]
            - cell "1" [ref=e48]
            - cell "2" [ref=e49]
            - cell "3" [ref=e50]
            - cell "4" [ref=e51]
            - cell "5" [ref=e52]
          - row "6 7 8 9 10 11 12" [ref=e53]:
            - cell "6" [ref=e54]
            - cell "7" [ref=e55]
            - cell "8" [ref=e56]
            - cell "9" [ref=e57]
            - cell "10" [ref=e58]
            - cell "11" [ref=e59]
            - cell "12" [ref=e60]
          - row "13 14 15 16 17 18 19" [ref=e61]:
            - cell "13" [ref=e62]
            - cell "14" [ref=e63]
            - cell "15" [ref=e64]
            - cell "16" [ref=e65]
            - cell "17" [ref=e66]:
              - generic [ref=e67]: "17"
            - cell "18" [ref=e68]
            - cell "19" [ref=e69]
          - row "20 21 Full 22 Full 23 Full 24 3 Available 25 26" [ref=e70]:
            - cell "20" [ref=e71]
            - cell "21 Full" [ref=e72]:
              - text: "21"
              - generic [ref=e74]: Full
            - cell "22 Full" [ref=e75]:
              - text: "22"
              - generic [ref=e77]: Full
            - cell "23 Full" [ref=e78]:
              - text: "23"
              - generic [ref=e80]: Full
            - cell "24 3 Available" [ref=e81] [cursor=pointer]:
              - text: "24"
              - generic [ref=e83]: 3 Available
            - cell "25" [ref=e84]
            - cell "26" [ref=e85]
          - row "27 3 Available 28 6 Available 29 6 Available 30 4 Available 31 Full 1 2" [ref=e86]:
            - cell "27 3 Available" [ref=e87] [cursor=pointer]:
              - text: "27"
              - generic [ref=e89]: 3 Available
            - cell "28 6 Available" [ref=e90] [cursor=pointer]:
              - text: "28"
              - generic [ref=e92]: 6 Available
            - cell "29 6 Available" [ref=e93] [cursor=pointer]:
              - text: "29"
              - generic [ref=e95]: 6 Available
            - cell "30 4 Available" [ref=e96] [cursor=pointer]:
              - text: "30"
              - generic [ref=e98]: 4 Available
            - cell "31 Full" [ref=e99]:
              - text: "31"
              - generic [ref=e101]: Full
            - cell "1" [ref=e102]
            - cell "2" [ref=e103]
      - generic [ref=e105]:
        - generic [ref=e106]: Booked 0 of 1 appointment(s).
        - button "Confirm Appointment" [ref=e108] [cursor=pointer]
  - generic [ref=e110]:
    - generic [ref=e111]:
      - generic [ref=e112]: Installation Appointment
      - generic [ref=e113] [cursor=pointer]: ×
    - generic [ref=e114]: "Remaining software installation appointment to allocate : 0"
    - generic [ref=e115]:
      - generic [ref=e116]:
        - generic [ref=e117]: "Appointment Date:"
        - textbox [ref=e118]: 24-07-2026
      - generic [ref=e119]:
        - generic [ref=e120]:
          - generic [ref=e121]: "Morning Session:"
          - generic [ref=e122]: 10:00am - 12:00pm
        - generic [ref=e123]:
          - button "−" [disabled] [ref=e124]
          - textbox [ref=e125]: "0"
          - button "+" [disabled] [ref=e126]
        - generic [ref=e127]: Fully booked
      - generic [ref=e128]:
        - generic [ref=e129]:
          - generic [ref=e130]: "Afternoon Session:"
          - generic [ref=e131]: 2:00pm - 4:00pm
        - generic [ref=e132]:
          - button "−" [ref=e133] [cursor=pointer]
          - textbox [ref=e134]: "1"
          - button "+" [disabled] [ref=e135]
        - generic [ref=e136]: 1 of 3 booked
        - link "✕ Remove" [ref=e137] [cursor=pointer]:
          - /url: javascript:void(0)
    - generic [ref=e139]:
      - button "Cancel" [ref=e140] [cursor=pointer]
      - button "Confirm" [ref=e141] [cursor=pointer]
  - generic [ref=e142]:
    - generic [ref=e143]:
      - button "HOME" [ref=e144] [cursor=pointer]
      - button "INSURANCE" [ref=e145] [cursor=pointer]
      - button "REPORTS" [ref=e146] [cursor=pointer]
      - button "SETTINGS" [ref=e147] [cursor=pointer]
      - button "USER GUIDE" [ref=e148] [cursor=pointer]
      - button "DOWNLOAD" [ref=e149] [cursor=pointer]
      - button "CONTACT US" [ref=e150] [cursor=pointer]
    - table [ref=e151]:
      - rowgroup [ref=e152]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e153]:
          - cell "Online Services - Service Hub" [ref=e154]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e155]:
            - list [ref=e156]:
              - listitem [ref=e157]:
                - img [ref=e158]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e159]: "|"
              - listitem [ref=e160]:
                - link "Logout" [ref=e161] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e163]
  - generic [ref=e164]:
    - generic [ref=e166]:
      - generic [ref=e167]:
        - link "Contact Us" [ref=e168] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e169]: "|"
        - link "Terms & Conditions" [ref=e170] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e171]: "|"
        - link "Privacy" [ref=e172] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e173]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e174]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e176]
```

# Test source

```ts
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
  332 |       }
  333 |       await test.step(`Expected: afternoon session accepts at most ${ENV.slotCapacity.perSlot}`, async () => {
  334 |         await reschedulePage.openSlotModal(date);
  335 |         await reschedulePage.incrementSlot(AFTERNOON, ENV.slotCapacity.perSlot + 1);
> 336 |         expect(await reschedulePage.getStepperValue(AFTERNOON)).toBe(ENV.slotCapacity.perSlot);
      |                                                                 ^ Error: expect(received).toBe(expected) // Object.is equality
  337 |       });
  338 |     });
  339 | 
  340 |     test("Daily Max Capacity (via Reschedule)", async ({ listingPage, reschedulePage }) => {
  341 |       if (!(await openRescheduleCalendar(listingPage, reschedulePage))) {
  342 |         test.skip(true, "No reschedulable appointment to open a calendar from.");
  343 |         return;
  344 |       }
  345 | 
  346 |       // A fully-booked (6/6) date must not open at all when clicked.
  347 |       const fullDate = await reschedulePage.findFullyBookedDate();
  348 |       if (!fullDate) {
  349 |         test.skip(true, "No fully-booked date available to verify against.");
  350 |         return;
  351 |       }
  352 |       let popupOpened = false;
  353 |       try {
  354 |         await reschedulePage.openSlotModal(fullDate);
  355 |         popupOpened = true;
  356 |       } catch {
  357 |         // Expected — a fully-booked date must refuse to open.
  358 |       }
  359 |       expect(popupOpened).toBe(false);
  360 |     });
  361 |   });
  362 | 
  363 |   // NOTE: BO/CSE capacity is intentionally NOT tested here. Per SRD 2.3.2.7
  364 |   // #2 rule 3 the 3-per-slot (6/day) cap binds UCD Portal bookings only; for
  365 |   // CSE the counter is informational. The "can CSE add past a full slot"
  366 |   // behaviour lives in add-appointment-bo.spec.ts, not as a capacity limit.
  367 | });
  368 | 
```