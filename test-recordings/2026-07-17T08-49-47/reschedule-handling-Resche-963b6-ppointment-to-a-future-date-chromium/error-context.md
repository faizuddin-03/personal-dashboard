# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reschedule-handling.spec.ts >> Reschedule & Handling >> UCD >> Reschedule before the day of the appointment to a future date
- Location: tests\service-hub\specs\reschedule-handling.spec.ts:74:9

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
          - row "20 21 Full 22 Full 23 Booked (1) Full 24 6 Available 25 26" [ref=e66]:
            - cell "20" [ref=e67]
            - cell "21 Full" [ref=e68]:
              - text: "21"
              - generic [ref=e70]: Full
            - cell "22 Full" [ref=e71]:
              - text: "22"
              - generic [ref=e73]: Full
            - cell "23 Booked (1) Full" [ref=e74] [cursor=pointer]:
              - text: "23"
              - generic [ref=e75]:
                - generic [ref=e76]: Booked (1)
                - generic [ref=e77]: Full
            - cell "24 6 Available" [ref=e78] [cursor=pointer]:
              - text: "24"
              - generic [ref=e80]: 6 Available
            - cell "25" [ref=e81]
            - cell "26" [ref=e82]
          - row "27 6 Available 28 6 Available 29 6 Available 30 6 Available 31 Full 1 2" [ref=e83]:
            - cell "27 6 Available" [ref=e84] [cursor=pointer]:
              - text: "27"
              - generic [ref=e86]: 6 Available
            - cell "28 6 Available" [ref=e87] [cursor=pointer]:
              - text: "28"
              - generic [ref=e89]: 6 Available
            - cell "29 6 Available" [ref=e90] [cursor=pointer]:
              - text: "29"
              - generic [ref=e92]: 6 Available
            - cell "30 6 Available" [ref=e93] [cursor=pointer]:
              - text: "30"
              - generic [ref=e95]: 6 Available
            - cell "31 Full" [ref=e96]:
              - text: "31"
              - generic [ref=e98]: Full
            - cell "1" [ref=e99]
            - cell "2" [ref=e100]
      - generic [ref=e102]:
        - generic [ref=e103]: Booked 1 of 1 appointment(s).
        - button "Confirm Appointment" [ref=e105] [cursor=pointer]
  - generic [ref=e107]:
    - generic [ref=e108]:
      - generic [ref=e109]: Slot Unavailable
      - generic [ref=e110] [cursor=pointer]: ×
    - generic [ref=e111]: You have allocated all 1 purchased installation(s). Remove your selected appointment to book a different slot.
    - button "OK" [ref=e113] [cursor=pointer]
  - generic [ref=e114]:
    - generic [ref=e115]:
      - button "HOME" [ref=e116] [cursor=pointer]
      - button "INSURANCE" [ref=e117] [cursor=pointer]
      - button "REPORTS" [ref=e118] [cursor=pointer]
      - button "SETTINGS" [ref=e119] [cursor=pointer]
      - button "USER GUIDE" [ref=e120] [cursor=pointer]
      - button "DOWNLOAD" [ref=e121] [cursor=pointer]
      - button "CONTACT US" [ref=e122] [cursor=pointer]
    - table [ref=e123]:
      - rowgroup [ref=e124]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e125]:
          - cell "Online Services - Service Hub" [ref=e126]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e127]:
            - list [ref=e128]:
              - listitem [ref=e129]:
                - img [ref=e130]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e131]: "|"
              - listitem [ref=e132]:
                - link "Logout" [ref=e133] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e135]
  - generic [ref=e136]:
    - generic [ref=e138]:
      - generic [ref=e139]:
        - link "Contact Us" [ref=e140] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e141]: "|"
        - link "Terms & Conditions" [ref=e142] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e143]: "|"
        - link "Privacy" [ref=e144] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e145]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e146]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e148]
```

# Test source

```ts
  310 |   /**
  311 |    * First bookable date where the given session (0 = morning, 1 = afternoon)
  312 |    * is at capacity (0 room) while the date overall is still bookable — i.e.
  313 |    * the OTHER session still has room, so the cell is td.si-book, not
  314 |    * si-fullday. Thin, readable wrapper over findDateMatching().
  315 |    */
  316 |   async findDateWithSlotFull(
  317 |     slotIndex: number,
  318 |     maxMonthsAhead: number = ENV.calendar.monthsVisible - 1,
  319 |   ): Promise<string | null> {
  320 |     return this.findDateMatching(
  321 |       (i) => (slotIndex === 0 ? i.morning : i.afternoon).room === 0,
  322 |       maxMonthsAhead,
  323 |     );
  324 |   }
  325 | 
  326 |   /**
  327 |    * Allocates `count` units into a date's morning slot first, overflowing
  328 |    * into afternoon if morning doesn't have enough room, and saves.
  329 |    * Returns the number actually allocated (may be less than requested if
  330 |    * the date doesn't have enough combined room across both slots).
  331 |    */
  332 |   async allocateUnitsAcrossSlots(dateStr: string, count: number): Promise<number> {
  333 |     await this.openSlotModal(dateStr);
  334 |     let remaining = count;
  335 |     for (const slot of [0, 1]) {
  336 |       if (remaining <= 0) break;
  337 |       const { booked, max } = await this.getModalSlotBooked(slot);
  338 |       const room = max - booked;
  339 |       const take = Math.min(room, remaining);
  340 |       if (take > 0) {
  341 |         await this.incrementSlot(slot, take);
  342 |         remaining -= take;
  343 |       }
  344 |     }
  345 |     await this.saveSlotChanges();
  346 |     return count - remaining;
  347 |   }
  348 | 
  349 |   /**
  350 |    * Allocates `count` units to whatever room is available anywhere,
  351 |    * optionally trying `preferredDate` first. This is a shared, persistent
  352 |    * staging environment — a date's capacity can shift between when we
  353 |    * scan for room and when we actually act on it (another test run,
  354 |    * another user, a cancellation). If the chosen date turns out to have
  355 |    * become unbookable in the meantime, drop it and re-scan for a fresh
  356 |    * one instead of failing outright.
  357 |    */
  358 |   async allocateUnitsAnywhere(count: number, preferredDate?: string, maxAttempts: number = 10): Promise<void> {
  359 |     let remaining = count;
  360 |     let candidate: string | null = preferredDate ?? null;
  361 |     let attempts = 0;
  362 | 
  363 |     while (remaining > 0) {
  364 |       attempts++;
  365 |       if (attempts > maxAttempts) {
  366 |         throw new Error(
  367 |           `Could not allocate the remaining ${remaining} unit(s) after ${maxAttempts} attempts — ran out of bookable dates with room (or they kept becoming unbookable before we could use them).`
  368 |         );
  369 |       }
  370 | 
  371 |       if (!candidate) {
  372 |         candidate = await this.findDateWithRoom(1);
  373 |         if (!candidate) {
  374 |           throw new Error(`No bookable date found with room to allocate the remaining ${remaining} unit(s).`);
  375 |         }
  376 |       }
  377 | 
  378 |       try {
  379 |         remaining -= await this.allocateUnitsAcrossSlots(candidate, remaining);
  380 |       } catch {
  381 |         // Date became unbookable between scan and click — try a fresh one.
  382 |       }
  383 |       candidate = null;
  384 |     }
  385 |   }
  386 | 
  387 |   /**
  388 |    * Click a date cell to open the slot dialog. Defensively closes any
  389 |    * modal left open by a previous action first — its full-page overlay
  390 |    * physically blocks clicks on the calendar underneath, which otherwise
  391 |    * surfaces as a confusing "element intercepts pointer events" timeout
  392 |    * (and can just as easily swallow a goNextMonth() click, making month
  393 |    * navigation silently fail).
  394 |    */
  395 |   async openSlotModal(dateStr: string) {
  396 |     if (await this.modalOverlay.isVisible().catch(() => false)) {
  397 |       await this.closeSlotModal();
  398 |       await this.modalOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  399 |     }
  400 |     await this.ensureMonthVisible(dateStr);
  401 |     const cell = this.getDayCell(dateStr);
  402 |     const classes = (await cell.getAttribute("class")) ?? "";
  403 |     if (!classes.includes("si-book") || classes.includes("si-muted")) {
  404 |       throw new Error(
  405 |         `Date ${dateStr} is not bookable (class="${classes}") — pick a date from findBookableDates()/findEmptyBookableDate() instead of a hardcoded offset.`
  406 |       );
  407 |     }
  408 |     await this.demoHighlight(cell); // show which date is being opened
  409 |     await cell.click();
> 410 |     await this.modalOverlay.waitFor({ state: "visible", timeout: 5000 });
      |                             ^ TimeoutError: locator.waitFor: Timeout 5000ms exceeded.
  411 |     await this.demoPause(); // let the reviewer read the opened dialog
  412 |   }
  413 | 
  414 |   /** Get booked count for a slot from the modal capacity text (e.g. "2 of 3 booked") */
  415 |   async getModalSlotBooked(slotIndex: number): Promise<{ booked: number; max: number }> {
  416 |     const capEl = slotIndex === 0 ? this.morningCapacity : this.afternoonCapacity;
  417 |     const text = (await capEl.textContent()) ?? "";
  418 |     if (text.toLowerCase().includes("fully booked")) return { booked: ENV.slotCapacity.perSlot, max: ENV.slotCapacity.perSlot };
  419 |     const match = text.match(/(\d+)\s*of\s*(\d+)/);
  420 |     if (!match) return { booked: 0, max: ENV.slotCapacity.perSlot };
  421 |     return { booked: Number(match[1]), max: Number(match[2]) };
  422 |   }
  423 | 
  424 |   async isSlotFullyBooked(slotIndex: number): Promise<boolean> {
  425 |     const capEl = slotIndex === 0 ? this.morningCapacity : this.afternoonCapacity;
  426 |     const text = (await capEl.textContent()) ?? "";
  427 |     return text.toLowerCase().includes("fully booked");
  428 |   }
  429 | 
  430 |   /**
  431 |    * Raw value of the slot's stepper input (#si-cnt0/#si-cnt1) — how many
  432 |    * units are locally staged for this slot in the current modal session.
  433 |    * Unlike the capacity text (which only reflects committed/saved
  434 |    * bookings), this updates instantly on every +/- click, so it can
  435 |    * verify the stepper refuses to exceed capacity WITHOUT ever saving —
  436 |    * meaning no real booking is made and the shared calendar's day totals
  437 |    * are never touched.
  438 |    */
  439 |   async getStepperValue(slotIndex: number): Promise<number> {
  440 |     const el = slotIndex === 0 ? this.morningCount : this.afternoonCount;
  441 |     return Number(await el.inputValue()) || 0;
  442 |   }
  443 | 
  444 |   /** Increment a slot's stepper via the JS function siStep(slot, +1) */
  445 |   async incrementSlot(slotIndex: number, times: number = 1) {
  446 |     await this.demoHighlight(slotIndex === 0 ? this.morningCount : this.afternoonCount);
  447 |     for (let i = 0; i < times; i++) {
  448 |       await this.page.evaluate((s) => (window as any).siStep(s, 1), slotIndex);
  449 |     }
  450 |     await this.demoPause();
  451 |   }
  452 | 
  453 |   /** Decrement a slot's stepper via the JS function siStep(slot, -1) */
  454 |   async decrementSlot(slotIndex: number, times: number = 1) {
  455 |     for (let i = 0; i < times; i++) {
  456 |       await this.page.evaluate((s) => (window as any).siStep(s, -1), slotIndex);
  457 |     }
  458 |   }
  459 | 
  460 |   /** Remove all units from a slot via the JS function siRowRemove(slot) */
  461 |   async removeSlot(slotIndex: number) {
  462 |     await this.demoHighlight(slotIndex === 0 ? this.morningRemoveBtn : this.afternoonRemoveBtn, { color: "red" });
  463 |     await this.page.evaluate((s) => (window as any).siRowRemove(s), slotIndex);
  464 |     await this.demoPause();
  465 |   }
  466 | 
  467 |   /** Save changes in the slot dialog via siSaveDate() */
  468 |   async saveSlotChanges() {
  469 |     await this.page.evaluate(() => (window as any).siSaveDate());
  470 |     await this.modalOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  471 |   }
  472 | 
  473 |   /** Close the slot dialog without saving */
  474 |   async closeSlotModal() {
  475 |     await this.page.evaluate(() => (window as any).siCloseModal());
  476 |   }
  477 | 
  478 |   /** Total units to allocate for this transaction (#si-alloc-total) */
  479 |   async getAllocationTotal(): Promise<number> {
  480 |     const text = (await this.allocTotal.textContent()) ?? "0";
  481 |     return Number(text) || 0;
  482 |   }
  483 | 
  484 |   /** Units allocated so far across all picked dates (#si-alloc-count) */
  485 |   async getAllocatedCount(): Promise<number> {
  486 |     const text = (await this.allocCount.textContent()) ?? "0";
  487 |     return Number(text) || 0;
  488 |   }
  489 | 
  490 |   async getRemainingToAllocate(): Promise<number> {
  491 |     const total = await this.getAllocationTotal();
  492 |     const allocated = await this.getAllocatedCount();
  493 |     return Math.max(0, total - allocated);
  494 |   }
  495 | 
  496 |   /**
  497 |    * Click "Confirm Appointment" / "Confirm booking" via siConfirmBooking().
  498 |    * siConfirmBooking() fires an async request before redirecting to
  499 |    * submitted.do — waiting on networkidle alone can return before that
  500 |    * request even starts, letting the next action interrupt it mid-flight.
  501 |    * Wait for the redirect explicitly first; if confirmation is blocked
  502 |    * (e.g. mandatory booking not satisfied) there's no redirect, so fall
  503 |    * through to the networkidle wait instead.
  504 |    */
  505 |   async confirmAppointment() {
  506 |     await this.demoHighlight("#si-confirm-booking", { color: "green" });
  507 |     await this.page.evaluate(() => (window as any).siConfirmBooking());
  508 |     // Matches whichever id scheme this deployment currently uses — `id=<uuid>`
  509 |     // (current, confirmed live), or the older `txnId=<number>` /
  510 |     // `transactionId=<uuid>` (see SoftwareInstallationPage.makePayment).
```