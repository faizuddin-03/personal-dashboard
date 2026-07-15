# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reschedule-handling.spec.ts >> Reschedule & Handling >> UCD >> Slot taken mid selection — concurrency
- Location: tests\service-hub\specs\reschedule-handling.spec.ts:202:9

# Error details

```
TimeoutError: locator.waitFor: Timeout 5000ms exceeded.
Call log:
  - waiting for locator('#si-ovl') to be visible
    14 × locator resolved to hidden <div id="si-ovl" class="si-ovl">…</div>

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
          - generic [ref=e17]: Reschedule Software Installation
          - generic [ref=e18]: Your current appointment(s) are marked Booked. Remove installation(s) from a booked date, then re-allocate all 1 to another date/time slot (up to 3 per slot).
      - generic [ref=e19]:
        - generic [ref=e20]: Please select a date to reschedule the software installation
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
          - row "13 14 15 16 17 Slot 6/6 18 19" [ref=e51]:
            - cell "13" [ref=e52]
            - cell "14" [ref=e53]
            - cell "15" [ref=e54]:
              - generic [ref=e55]: "15"
            - cell "16" [ref=e56]
            - cell "17 Slot 6/6" [ref=e57]:
              - text: "17"
              - generic [ref=e59]: Slot 6/6
            - cell "18" [ref=e60]
            - cell "19" [ref=e61]
          - row "20 Slot 6/6 21 Booked (1) Slot 6/6 22 Slot 2/6 23 Slot 1/6 24 Slot 1/6 25 26" [ref=e62]:
            - cell "20 Slot 6/6" [ref=e63]:
              - text: "20"
              - generic [ref=e65]: Slot 6/6
            - cell "21 Booked (1) Slot 6/6" [ref=e66] [cursor=pointer]:
              - text: "21"
              - generic [ref=e67]:
                - generic [ref=e68]: Booked (1)
                - generic [ref=e69]: Slot 6/6
            - cell "22 Slot 2/6" [ref=e70] [cursor=pointer]:
              - text: "22"
              - generic [ref=e72]: Slot 2/6
            - cell "23 Slot 1/6" [ref=e73] [cursor=pointer]:
              - text: "23"
              - generic [ref=e75]: Slot 1/6
            - cell "24 Slot 1/6" [ref=e76] [cursor=pointer]:
              - text: "24"
              - generic [ref=e78]: Slot 1/6
            - cell "25" [ref=e79]
            - cell "26" [ref=e80]
          - row "27 Slot 1/6 28 Slot 1/6 29 Slot 1/6 30 Slot 1/6 31 Slot 6/6 1 2" [ref=e81]:
            - cell "27 Slot 1/6" [ref=e82] [cursor=pointer]:
              - text: "27"
              - generic [ref=e84]: Slot 1/6
            - cell "28 Slot 1/6" [ref=e85] [cursor=pointer]:
              - text: "28"
              - generic [ref=e87]: Slot 1/6
            - cell "29 Slot 1/6" [ref=e88] [cursor=pointer]:
              - text: "29"
              - generic [ref=e90]: Slot 1/6
            - cell "30 Slot 1/6" [ref=e91] [cursor=pointer]:
              - text: "30"
              - generic [ref=e93]: Slot 1/6
            - cell "31 Slot 6/6" [ref=e94]:
              - text: "31"
              - generic [ref=e96]: Slot 6/6
            - cell "1" [ref=e97]
            - cell "2" [ref=e98]
      - generic [ref=e99]:
        - generic [ref=e100]: Click a booked (orange) date to remove, or a new date to add.
        - generic [ref=e101]:
          - generic [ref=e102]: Booked 1 of 1 appointments.
          - button "Confirm Appointment" [ref=e104] [cursor=pointer]
  - generic [ref=e106]:
    - generic [ref=e107]: Slot Unavailable
    - generic [ref=e108]: You have allocated all 1 purchased installation(s). Remove your selected appointment to book a different slot.
    - button "OK" [ref=e110] [cursor=pointer]
  - generic [ref=e111]:
    - generic [ref=e112]:
      - button "HOME" [ref=e113] [cursor=pointer]
      - button "INSURANCE" [ref=e114] [cursor=pointer]
      - button "REPORTS" [ref=e115] [cursor=pointer]
      - button "SETTINGS" [ref=e116] [cursor=pointer]
      - button "USER GUIDE" [ref=e117] [cursor=pointer]
      - button "DOWNLOAD" [ref=e118] [cursor=pointer]
      - button "CONTACT US" [ref=e119] [cursor=pointer]
    - table [ref=e120]:
      - rowgroup [ref=e121]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e122]:
          - cell "Online Services - Service Hub" [ref=e123]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e124]:
            - list [ref=e125]:
              - listitem [ref=e126]:
                - img [ref=e127]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e128]: "|"
              - listitem [ref=e129]:
                - link "Logout" [ref=e130] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e132]
  - generic [ref=e133]:
    - generic [ref=e135]:
      - generic [ref=e136]:
        - link "Contact Us" [ref=e137] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e138]: "|"
        - link "Terms & Conditions" [ref=e139] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e140]: "|"
        - link "Privacy" [ref=e141] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e142]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e143]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e145]
```

# Test source

```ts
  289 |   /**
  290 |    * First bookable date where the given session (0 = morning, 1 = afternoon)
  291 |    * is at capacity (0 room) while the date overall is still bookable — i.e.
  292 |    * the OTHER session still has room, so the cell is td.si-book, not
  293 |    * si-fullday. Thin, readable wrapper over findDateMatching().
  294 |    */
  295 |   async findDateWithSlotFull(
  296 |     slotIndex: number,
  297 |     maxMonthsAhead: number = ENV.calendar.monthsVisible - 1,
  298 |   ): Promise<string | null> {
  299 |     return this.findDateMatching(
  300 |       (i) => (slotIndex === 0 ? i.morning : i.afternoon).room === 0,
  301 |       maxMonthsAhead,
  302 |     );
  303 |   }
  304 | 
  305 |   /**
  306 |    * Allocates `count` units into a date's morning slot first, overflowing
  307 |    * into afternoon if morning doesn't have enough room, and saves.
  308 |    * Returns the number actually allocated (may be less than requested if
  309 |    * the date doesn't have enough combined room across both slots).
  310 |    */
  311 |   async allocateUnitsAcrossSlots(dateStr: string, count: number): Promise<number> {
  312 |     await this.openSlotModal(dateStr);
  313 |     let remaining = count;
  314 |     for (const slot of [0, 1]) {
  315 |       if (remaining <= 0) break;
  316 |       const { booked, max } = await this.getModalSlotBooked(slot);
  317 |       const room = max - booked;
  318 |       const take = Math.min(room, remaining);
  319 |       if (take > 0) {
  320 |         await this.incrementSlot(slot, take);
  321 |         remaining -= take;
  322 |       }
  323 |     }
  324 |     await this.saveSlotChanges();
  325 |     return count - remaining;
  326 |   }
  327 | 
  328 |   /**
  329 |    * Allocates `count` units to whatever room is available anywhere,
  330 |    * optionally trying `preferredDate` first. This is a shared, persistent
  331 |    * staging environment — a date's capacity can shift between when we
  332 |    * scan for room and when we actually act on it (another test run,
  333 |    * another user, a cancellation). If the chosen date turns out to have
  334 |    * become unbookable in the meantime, drop it and re-scan for a fresh
  335 |    * one instead of failing outright.
  336 |    */
  337 |   async allocateUnitsAnywhere(count: number, preferredDate?: string, maxAttempts: number = 10): Promise<void> {
  338 |     let remaining = count;
  339 |     let candidate: string | null = preferredDate ?? null;
  340 |     let attempts = 0;
  341 | 
  342 |     while (remaining > 0) {
  343 |       attempts++;
  344 |       if (attempts > maxAttempts) {
  345 |         throw new Error(
  346 |           `Could not allocate the remaining ${remaining} unit(s) after ${maxAttempts} attempts — ran out of bookable dates with room (or they kept becoming unbookable before we could use them).`
  347 |         );
  348 |       }
  349 | 
  350 |       if (!candidate) {
  351 |         candidate = await this.findDateWithRoom(1);
  352 |         if (!candidate) {
  353 |           throw new Error(`No bookable date found with room to allocate the remaining ${remaining} unit(s).`);
  354 |         }
  355 |       }
  356 | 
  357 |       try {
  358 |         remaining -= await this.allocateUnitsAcrossSlots(candidate, remaining);
  359 |       } catch {
  360 |         // Date became unbookable between scan and click — try a fresh one.
  361 |       }
  362 |       candidate = null;
  363 |     }
  364 |   }
  365 | 
  366 |   /**
  367 |    * Click a date cell to open the slot dialog. Defensively closes any
  368 |    * modal left open by a previous action first — its full-page overlay
  369 |    * physically blocks clicks on the calendar underneath, which otherwise
  370 |    * surfaces as a confusing "element intercepts pointer events" timeout
  371 |    * (and can just as easily swallow a goNextMonth() click, making month
  372 |    * navigation silently fail).
  373 |    */
  374 |   async openSlotModal(dateStr: string) {
  375 |     if (await this.modalOverlay.isVisible().catch(() => false)) {
  376 |       await this.closeSlotModal();
  377 |       await this.modalOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  378 |     }
  379 |     await this.ensureMonthVisible(dateStr);
  380 |     const cell = this.getDayCell(dateStr);
  381 |     const classes = (await cell.getAttribute("class")) ?? "";
  382 |     if (!classes.includes("si-book") || classes.includes("si-muted")) {
  383 |       throw new Error(
  384 |         `Date ${dateStr} is not bookable (class="${classes}") — pick a date from findBookableDates()/findEmptyBookableDate() instead of a hardcoded offset.`
  385 |       );
  386 |     }
  387 |     await this.demoHighlight(cell); // show which date is being opened
  388 |     await cell.click();
> 389 |     await this.modalOverlay.waitFor({ state: "visible", timeout: 5000 });
      |                             ^ TimeoutError: locator.waitFor: Timeout 5000ms exceeded.
  390 |     await this.demoPause(); // let the reviewer read the opened dialog
  391 |   }
  392 | 
  393 |   /** Get booked count for a slot from the modal capacity text (e.g. "2 of 3 booked") */
  394 |   async getModalSlotBooked(slotIndex: number): Promise<{ booked: number; max: number }> {
  395 |     const capEl = slotIndex === 0 ? this.morningCapacity : this.afternoonCapacity;
  396 |     const text = (await capEl.textContent()) ?? "";
  397 |     if (text.toLowerCase().includes("fully booked")) return { booked: ENV.slotCapacity.perSlot, max: ENV.slotCapacity.perSlot };
  398 |     const match = text.match(/(\d+)\s*of\s*(\d+)/);
  399 |     if (!match) return { booked: 0, max: ENV.slotCapacity.perSlot };
  400 |     return { booked: Number(match[1]), max: Number(match[2]) };
  401 |   }
  402 | 
  403 |   async isSlotFullyBooked(slotIndex: number): Promise<boolean> {
  404 |     const capEl = slotIndex === 0 ? this.morningCapacity : this.afternoonCapacity;
  405 |     const text = (await capEl.textContent()) ?? "";
  406 |     return text.toLowerCase().includes("fully booked");
  407 |   }
  408 | 
  409 |   /**
  410 |    * Raw value of the slot's stepper input (#si-cnt0/#si-cnt1) — how many
  411 |    * units are locally staged for this slot in the current modal session.
  412 |    * Unlike the capacity text (which only reflects committed/saved
  413 |    * bookings), this updates instantly on every +/- click, so it can
  414 |    * verify the stepper refuses to exceed capacity WITHOUT ever saving —
  415 |    * meaning no real booking is made and the shared calendar's day totals
  416 |    * are never touched.
  417 |    */
  418 |   async getStepperValue(slotIndex: number): Promise<number> {
  419 |     const el = slotIndex === 0 ? this.morningCount : this.afternoonCount;
  420 |     return Number(await el.inputValue()) || 0;
  421 |   }
  422 | 
  423 |   /** Increment a slot's stepper via the JS function siStep(slot, +1) */
  424 |   async incrementSlot(slotIndex: number, times: number = 1) {
  425 |     await this.demoHighlight(slotIndex === 0 ? this.morningCount : this.afternoonCount);
  426 |     for (let i = 0; i < times; i++) {
  427 |       await this.page.evaluate((s) => (window as any).siStep(s, 1), slotIndex);
  428 |     }
  429 |     await this.demoPause();
  430 |   }
  431 | 
  432 |   /** Decrement a slot's stepper via the JS function siStep(slot, -1) */
  433 |   async decrementSlot(slotIndex: number, times: number = 1) {
  434 |     for (let i = 0; i < times; i++) {
  435 |       await this.page.evaluate((s) => (window as any).siStep(s, -1), slotIndex);
  436 |     }
  437 |   }
  438 | 
  439 |   /** Remove all units from a slot via the JS function siRowRemove(slot) */
  440 |   async removeSlot(slotIndex: number) {
  441 |     await this.demoHighlight(slotIndex === 0 ? this.morningRemoveBtn : this.afternoonRemoveBtn, { color: "red" });
  442 |     await this.page.evaluate((s) => (window as any).siRowRemove(s), slotIndex);
  443 |     await this.demoPause();
  444 |   }
  445 | 
  446 |   /** Save changes in the slot dialog via siSaveDate() */
  447 |   async saveSlotChanges() {
  448 |     await this.page.evaluate(() => (window as any).siSaveDate());
  449 |     await this.modalOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  450 |   }
  451 | 
  452 |   /** Close the slot dialog without saving */
  453 |   async closeSlotModal() {
  454 |     await this.page.evaluate(() => (window as any).siCloseModal());
  455 |   }
  456 | 
  457 |   /** Total units to allocate for this transaction (#si-alloc-total) */
  458 |   async getAllocationTotal(): Promise<number> {
  459 |     const text = (await this.allocTotal.textContent()) ?? "0";
  460 |     return Number(text) || 0;
  461 |   }
  462 | 
  463 |   /** Units allocated so far across all picked dates (#si-alloc-count) */
  464 |   async getAllocatedCount(): Promise<number> {
  465 |     const text = (await this.allocCount.textContent()) ?? "0";
  466 |     return Number(text) || 0;
  467 |   }
  468 | 
  469 |   async getRemainingToAllocate(): Promise<number> {
  470 |     const total = await this.getAllocationTotal();
  471 |     const allocated = await this.getAllocatedCount();
  472 |     return Math.max(0, total - allocated);
  473 |   }
  474 | 
  475 |   /**
  476 |    * Click "Confirm Appointment" / "Confirm booking" via siConfirmBooking().
  477 |    * siConfirmBooking() fires an async request before redirecting to
  478 |    * submitted.do — waiting on networkidle alone can return before that
  479 |    * request even starts, letting the next action interrupt it mid-flight.
  480 |    * Wait for the redirect explicitly first; if confirmation is blocked
  481 |    * (e.g. mandatory booking not satisfied) there's no redirect, so fall
  482 |    * through to the networkidle wait instead.
  483 |    */
  484 |   async confirmAppointment() {
  485 |     await this.demoHighlight("#si-confirm-booking", { color: "green" });
  486 |     await this.page.evaluate(() => (window as any).siConfirmBooking());
  487 |     // Matches either the old `txnId=<number>` or the new `transactionId=<uuid>`
  488 |     // id scheme (see SoftwareInstallationPage.makePayment).
  489 |     await this.page.waitForURL(/submitted\.do\?(txnId|transactionId)=/, { timeout: 15000 }).catch(() => {});
```