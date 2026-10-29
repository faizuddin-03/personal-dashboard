# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reschedule-handling.spec.ts >> Reschedule & Handling >> UCD >> Reschedule before the day of the appointment to a future date
- Location: tests\service-hub\specs\reschedule-handling.spec.ts:71:9

# Error details

```
Error: Date 2026-07-15 is not bookable (class=" si-muted si-fullday") — pick a date from findBookableDates()/findEmptyBookableDate() instead of a hardcoded offset.
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
      - generic [ref=e8]: Biometric Device Purchase
    - generic [ref=e9]:
      - link "« Back" [ref=e10] [cursor=pointer]:
        - /url: /uat1/view/ucd/service-hub/view.do
      - generic: Biometric Device Purchase
    - generic [ref=e13]:
      - generic [ref=e14]:
        - img "Software Installation" [ref=e15]
        - generic [ref=e16]:
          - generic [ref=e17]: Reschedule Software Installation
          - generic [ref=e18]: Your current appointment(s) are marked Booked. Remove installation(s) from a booked date, then re-allocate to another date/time slot (up to 3 per slot).
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
          - row "13 14 15 Booked (1) Slot 4/6 16 Slot 0/6 17 Slot 0/6 18 19" [ref=e51]:
            - cell "13" [ref=e52]
            - cell "14" [ref=e53]:
              - generic [ref=e54]: "14"
            - cell "15 Booked (1) Slot 4/6" [ref=e55] [cursor=pointer]:
              - text: "15"
              - generic [ref=e56]:
                - generic [ref=e57]: Booked (1)
                - generic [ref=e58]: Slot 4/6
            - cell "16 Slot 0/6" [ref=e59] [cursor=pointer]:
              - text: "16"
              - generic [ref=e61]: Slot 0/6
            - cell "17 Slot 0/6" [ref=e62] [cursor=pointer]:
              - text: "17"
              - generic [ref=e64]: Slot 0/6
            - cell "18" [ref=e65]
            - cell "19" [ref=e66]
          - row "20 Slot 0/6 21 Slot 0/6 22 Slot 2/6 23 Slot 0/6 24 Slot 0/6 25 26" [ref=e67]:
            - cell "20 Slot 0/6" [ref=e68] [cursor=pointer]:
              - text: "20"
              - generic [ref=e70]: Slot 0/6
            - cell "21 Slot 0/6" [ref=e71] [cursor=pointer]:
              - text: "21"
              - generic [ref=e73]: Slot 0/6
            - cell "22 Slot 2/6" [ref=e74] [cursor=pointer]:
              - text: "22"
              - generic [ref=e76]: Slot 2/6
            - cell "23 Slot 0/6" [ref=e77] [cursor=pointer]:
              - text: "23"
              - generic [ref=e79]: Slot 0/6
            - cell "24 Slot 0/6" [ref=e80] [cursor=pointer]:
              - text: "24"
              - generic [ref=e82]: Slot 0/6
            - cell "25" [ref=e83]
            - cell "26" [ref=e84]
          - row "27 Slot 0/6 28 Slot 0/6 29 Slot 0/6 30 Slot 0/6 31 Slot 0/6 1 2" [ref=e85]:
            - cell "27 Slot 0/6" [ref=e86] [cursor=pointer]:
              - text: "27"
              - generic [ref=e88]: Slot 0/6
            - cell "28 Slot 0/6" [ref=e89] [cursor=pointer]:
              - text: "28"
              - generic [ref=e91]: Slot 0/6
            - cell "29 Slot 0/6" [ref=e92] [cursor=pointer]:
              - text: "29"
              - generic [ref=e94]: Slot 0/6
            - cell "30 Slot 0/6" [ref=e95] [cursor=pointer]:
              - text: "30"
              - generic [ref=e97]: Slot 0/6
            - cell "31 Slot 0/6" [ref=e98] [cursor=pointer]:
              - text: "31"
              - generic [ref=e100]: Slot 0/6
            - cell "1" [ref=e101]
            - cell "2" [ref=e102]
      - generic [ref=e103]:
        - generic [ref=e104]: Booking is optional — you may book some, all, or none now. Any unbooked installation can be booked or rescheduled any time before 14-08-2026.
        - generic [ref=e105]: Click a booked (orange) date to remove, or a new date to add.
        - generic [ref=e106]:
          - generic [ref=e107]: Booked 1 of 2 appointments.
          - button "Confirm Appointment" [ref=e109] [cursor=pointer]
  - generic [ref=e110]:
    - generic [ref=e111]:
      - button "HOME" [ref=e112] [cursor=pointer]
      - button "INSURANCE" [ref=e113] [cursor=pointer]
      - button "REPORTS" [ref=e114] [cursor=pointer]
      - button "SETTINGS" [ref=e115] [cursor=pointer]
      - button "USER GUIDE" [ref=e116] [cursor=pointer]
      - button "DOWNLOAD" [ref=e117] [cursor=pointer]
      - button "CONTACT US" [ref=e118] [cursor=pointer]
    - table [ref=e119]:
      - rowgroup [ref=e120]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e121]:
          - cell "Online Services - Service Hub" [ref=e122]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e123]:
            - list [ref=e124]:
              - listitem [ref=e125]:
                - img [ref=e126]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e127]: "|"
              - listitem [ref=e128]:
                - link "Logout" [ref=e129] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e131]
  - generic [ref=e132]:
    - generic [ref=e134]:
      - generic [ref=e135]:
        - link "Contact Us" [ref=e136] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e137]: "|"
        - link "Terms & Conditions" [ref=e138] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e139]: "|"
        - link "Privacy" [ref=e140] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e141]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e142]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e144]
```

# Test source

```ts
  263 |         if (!(await this.goNextMonth())) break;
  264 |       }
  265 |       return null;
  266 |     });
  267 |   }
  268 | 
  269 |   /**
  270 |    * First bookable date where the given session (0 = morning, 1 = afternoon)
  271 |    * is at capacity (0 room) while the date overall is still bookable — i.e.
  272 |    * the OTHER session still has room, so the cell is td.si-book, not
  273 |    * si-fullday. Thin, readable wrapper over findDateMatching().
  274 |    */
  275 |   async findDateWithSlotFull(
  276 |     slotIndex: number,
  277 |     maxMonthsAhead: number = ENV.calendar.monthsVisible - 1,
  278 |   ): Promise<string | null> {
  279 |     return this.findDateMatching(
  280 |       (i) => (slotIndex === 0 ? i.morning : i.afternoon).room === 0,
  281 |       maxMonthsAhead,
  282 |     );
  283 |   }
  284 | 
  285 |   /**
  286 |    * Allocates `count` units into a date's morning slot first, overflowing
  287 |    * into afternoon if morning doesn't have enough room, and saves.
  288 |    * Returns the number actually allocated (may be less than requested if
  289 |    * the date doesn't have enough combined room across both slots).
  290 |    */
  291 |   async allocateUnitsAcrossSlots(dateStr: string, count: number): Promise<number> {
  292 |     await this.openSlotModal(dateStr);
  293 |     let remaining = count;
  294 |     for (const slot of [0, 1]) {
  295 |       if (remaining <= 0) break;
  296 |       const { booked, max } = await this.getModalSlotBooked(slot);
  297 |       const room = max - booked;
  298 |       const take = Math.min(room, remaining);
  299 |       if (take > 0) {
  300 |         await this.incrementSlot(slot, take);
  301 |         remaining -= take;
  302 |       }
  303 |     }
  304 |     await this.saveSlotChanges();
  305 |     return count - remaining;
  306 |   }
  307 | 
  308 |   /**
  309 |    * Allocates `count` units to whatever room is available anywhere,
  310 |    * optionally trying `preferredDate` first. This is a shared, persistent
  311 |    * staging environment — a date's capacity can shift between when we
  312 |    * scan for room and when we actually act on it (another test run,
  313 |    * another user, a cancellation). If the chosen date turns out to have
  314 |    * become unbookable in the meantime, drop it and re-scan for a fresh
  315 |    * one instead of failing outright.
  316 |    */
  317 |   async allocateUnitsAnywhere(count: number, preferredDate?: string, maxAttempts: number = 10): Promise<void> {
  318 |     let remaining = count;
  319 |     let candidate: string | null = preferredDate ?? null;
  320 |     let attempts = 0;
  321 | 
  322 |     while (remaining > 0) {
  323 |       attempts++;
  324 |       if (attempts > maxAttempts) {
  325 |         throw new Error(
  326 |           `Could not allocate the remaining ${remaining} unit(s) after ${maxAttempts} attempts — ran out of bookable dates with room (or they kept becoming unbookable before we could use them).`
  327 |         );
  328 |       }
  329 | 
  330 |       if (!candidate) {
  331 |         candidate = await this.findDateWithRoom(1);
  332 |         if (!candidate) {
  333 |           throw new Error(`No bookable date found with room to allocate the remaining ${remaining} unit(s).`);
  334 |         }
  335 |       }
  336 | 
  337 |       try {
  338 |         remaining -= await this.allocateUnitsAcrossSlots(candidate, remaining);
  339 |       } catch {
  340 |         // Date became unbookable between scan and click — try a fresh one.
  341 |       }
  342 |       candidate = null;
  343 |     }
  344 |   }
  345 | 
  346 |   /**
  347 |    * Click a date cell to open the slot dialog. Defensively closes any
  348 |    * modal left open by a previous action first — its full-page overlay
  349 |    * physically blocks clicks on the calendar underneath, which otherwise
  350 |    * surfaces as a confusing "element intercepts pointer events" timeout
  351 |    * (and can just as easily swallow a goNextMonth() click, making month
  352 |    * navigation silently fail).
  353 |    */
  354 |   async openSlotModal(dateStr: string) {
  355 |     if (await this.modalOverlay.isVisible().catch(() => false)) {
  356 |       await this.closeSlotModal();
  357 |       await this.modalOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  358 |     }
  359 |     await this.ensureMonthVisible(dateStr);
  360 |     const cell = this.getDayCell(dateStr);
  361 |     const classes = (await cell.getAttribute("class")) ?? "";
  362 |     if (!classes.includes("si-book") || classes.includes("si-muted")) {
> 363 |       throw new Error(
      |             ^ Error: Date 2026-07-15 is not bookable (class=" si-muted si-fullday") — pick a date from findBookableDates()/findEmptyBookableDate() instead of a hardcoded offset.
  364 |         `Date ${dateStr} is not bookable (class="${classes}") — pick a date from findBookableDates()/findEmptyBookableDate() instead of a hardcoded offset.`
  365 |       );
  366 |     }
  367 |     await this.demoHighlight(cell); // show which date is being opened
  368 |     await cell.click();
  369 |     await this.modalOverlay.waitFor({ state: "visible", timeout: 5000 });
  370 |     await this.demoPause(); // let the reviewer read the opened dialog
  371 |   }
  372 | 
  373 |   /** Get booked count for a slot from the modal capacity text (e.g. "2 of 3 booked") */
  374 |   async getModalSlotBooked(slotIndex: number): Promise<{ booked: number; max: number }> {
  375 |     const capEl = slotIndex === 0 ? this.morningCapacity : this.afternoonCapacity;
  376 |     const text = (await capEl.textContent()) ?? "";
  377 |     if (text.toLowerCase().includes("fully booked")) return { booked: ENV.slotCapacity.perSlot, max: ENV.slotCapacity.perSlot };
  378 |     const match = text.match(/(\d+)\s*of\s*(\d+)/);
  379 |     if (!match) return { booked: 0, max: ENV.slotCapacity.perSlot };
  380 |     return { booked: Number(match[1]), max: Number(match[2]) };
  381 |   }
  382 | 
  383 |   async isSlotFullyBooked(slotIndex: number): Promise<boolean> {
  384 |     const capEl = slotIndex === 0 ? this.morningCapacity : this.afternoonCapacity;
  385 |     const text = (await capEl.textContent()) ?? "";
  386 |     return text.toLowerCase().includes("fully booked");
  387 |   }
  388 | 
  389 |   /**
  390 |    * Raw value of the slot's stepper input (#si-cnt0/#si-cnt1) — how many
  391 |    * units are locally staged for this slot in the current modal session.
  392 |    * Unlike the capacity text (which only reflects committed/saved
  393 |    * bookings), this updates instantly on every +/- click, so it can
  394 |    * verify the stepper refuses to exceed capacity WITHOUT ever saving —
  395 |    * meaning no real booking is made and the shared calendar's day totals
  396 |    * are never touched.
  397 |    */
  398 |   async getStepperValue(slotIndex: number): Promise<number> {
  399 |     const el = slotIndex === 0 ? this.morningCount : this.afternoonCount;
  400 |     return Number(await el.inputValue()) || 0;
  401 |   }
  402 | 
  403 |   /** Increment a slot's stepper via the JS function siStep(slot, +1) */
  404 |   async incrementSlot(slotIndex: number, times: number = 1) {
  405 |     await this.demoHighlight(slotIndex === 0 ? this.morningCount : this.afternoonCount);
  406 |     for (let i = 0; i < times; i++) {
  407 |       await this.page.evaluate((s) => (window as any).siStep(s, 1), slotIndex);
  408 |     }
  409 |     await this.demoPause();
  410 |   }
  411 | 
  412 |   /** Decrement a slot's stepper via the JS function siStep(slot, -1) */
  413 |   async decrementSlot(slotIndex: number, times: number = 1) {
  414 |     for (let i = 0; i < times; i++) {
  415 |       await this.page.evaluate((s) => (window as any).siStep(s, -1), slotIndex);
  416 |     }
  417 |   }
  418 | 
  419 |   /** Remove all units from a slot via the JS function siRowRemove(slot) */
  420 |   async removeSlot(slotIndex: number) {
  421 |     await this.demoHighlight(slotIndex === 0 ? this.morningRemoveBtn : this.afternoonRemoveBtn, { color: "red" });
  422 |     await this.page.evaluate((s) => (window as any).siRowRemove(s), slotIndex);
  423 |     await this.demoPause();
  424 |   }
  425 | 
  426 |   /** Save changes in the slot dialog via siSaveDate() */
  427 |   async saveSlotChanges() {
  428 |     await this.page.evaluate(() => (window as any).siSaveDate());
  429 |     await this.modalOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  430 |   }
  431 | 
  432 |   /** Close the slot dialog without saving */
  433 |   async closeSlotModal() {
  434 |     await this.page.evaluate(() => (window as any).siCloseModal());
  435 |   }
  436 | 
  437 |   /** Total units to allocate for this transaction (#si-alloc-total) */
  438 |   async getAllocationTotal(): Promise<number> {
  439 |     const text = (await this.allocTotal.textContent()) ?? "0";
  440 |     return Number(text) || 0;
  441 |   }
  442 | 
  443 |   /** Units allocated so far across all picked dates (#si-alloc-count) */
  444 |   async getAllocatedCount(): Promise<number> {
  445 |     const text = (await this.allocCount.textContent()) ?? "0";
  446 |     return Number(text) || 0;
  447 |   }
  448 | 
  449 |   async getRemainingToAllocate(): Promise<number> {
  450 |     const total = await this.getAllocationTotal();
  451 |     const allocated = await this.getAllocatedCount();
  452 |     return Math.max(0, total - allocated);
  453 |   }
  454 | 
  455 |   /**
  456 |    * Click "Confirm Appointment" / "Confirm booking" via siConfirmBooking().
  457 |    * siConfirmBooking() fires an async request before redirecting to
  458 |    * submitted.do — waiting on networkidle alone can return before that
  459 |    * request even starts, letting the next action interrupt it mid-flight.
  460 |    * Wait for the redirect explicitly first; if confirmation is blocked
  461 |    * (e.g. mandatory booking not satisfied) there's no redirect, so fall
  462 |    * through to the networkidle wait instead.
  463 |    */
```