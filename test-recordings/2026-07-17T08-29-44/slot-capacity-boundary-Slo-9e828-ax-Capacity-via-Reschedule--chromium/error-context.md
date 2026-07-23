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
          - row "20 21 Full 22 Full 23 2 Available 24 5 Available 25 26" [ref=e66]:
            - cell "20" [ref=e67]
            - cell "21 Full" [ref=e68]:
              - text: "21"
              - generic [ref=e70]: Full
            - cell "22 Full" [ref=e71]:
              - text: "22"
              - generic [ref=e73]: Full
            - cell "23 2 Available" [ref=e74] [cursor=pointer]:
              - text: "23"
              - generic [ref=e76]: 2 Available
            - cell "24 5 Available" [ref=e77] [cursor=pointer]:
              - text: "24"
              - generic [ref=e79]: 5 Available
            - cell "25" [ref=e80]
            - cell "26" [ref=e81]
          - row "27 6 Available 28 6 Available 29 6 Available 30 6 Available 31 Full 1 2" [ref=e82]:
            - cell "27 6 Available" [ref=e83] [cursor=pointer]:
              - text: "27"
              - generic [ref=e85]: 6 Available
            - cell "28 6 Available" [ref=e86] [cursor=pointer]:
              - text: "28"
              - generic [ref=e88]: 6 Available
            - cell "29 6 Available" [ref=e89] [cursor=pointer]:
              - text: "29"
              - generic [ref=e91]: 6 Available
            - cell "30 6 Available" [ref=e92] [cursor=pointer]:
              - text: "30"
              - generic [ref=e94]: 6 Available
            - cell "31 Full" [ref=e95]:
              - text: "31"
              - generic [ref=e97]: Full
            - cell "1" [ref=e98]
            - cell "2" [ref=e99]
      - generic [ref=e101]:
        - generic [ref=e102]: Booked 0 of 1 appointment(s).
        - button "Confirm Appointment" [ref=e104] [cursor=pointer]
  - generic [ref=e106]:
    - generic [ref=e107]:
      - generic [ref=e108]: Installation Appointment
      - generic [ref=e109] [cursor=pointer]: ×
    - generic [ref=e110]: "Remaining software installation appointment to allocate : 0"
    - generic [ref=e111]:
      - generic [ref=e112]:
        - generic [ref=e113]: "Appointment Date:"
        - textbox [ref=e114]: 24-07-2026
      - generic [ref=e115]:
        - generic [ref=e116]:
          - generic [ref=e117]: "Morning Session:"
          - generic [ref=e118]: 10:00am - 12:00pm
        - generic [ref=e119]:
          - button "−" [disabled] [ref=e120]
          - textbox [ref=e121]: "0"
          - button "+" [disabled] [ref=e122]
        - generic [ref=e123]: 1 of 3 booked
      - generic [ref=e124]:
        - generic [ref=e125]:
          - generic [ref=e126]: "Afternoon Session:"
          - generic [ref=e127]: 2:00pm - 4:00pm
        - generic [ref=e128]:
          - button "−" [ref=e129] [cursor=pointer]
          - textbox [ref=e130]: "1"
          - button "+" [disabled] [ref=e131]
        - generic [ref=e132]: 1 of 3 booked
        - link "✕ Remove" [ref=e133] [cursor=pointer]:
          - /url: javascript:void(0)
    - generic [ref=e135]:
      - button "Cancel" [ref=e136] [cursor=pointer]
      - button "Confirm" [ref=e137] [cursor=pointer]
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