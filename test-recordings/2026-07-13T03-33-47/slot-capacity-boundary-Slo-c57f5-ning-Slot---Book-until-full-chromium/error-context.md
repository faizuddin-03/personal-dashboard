# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Morning Slot - Book until full
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:26:9

# Error details

```
Error: Date 2026-07-31 is not bookable (class=" si-muted si-fullday") — pick a date from findBookableDates()/findEmptyBookableDate() instead of a hardcoded offset.
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
          - generic [ref=e18]: Payment received. Allocate your 4 installations to a date and time slot (up to 3 per slot).
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
          - row "13 14 Slot 6/6 15 Slot 6/6 16 Slot 6/6 17 Slot 6/6 18 19" [ref=e51]:
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
            - cell "17 Slot 6/6" [ref=e63]:
              - text: "17"
              - generic [ref=e65]: Slot 6/6
            - cell "18" [ref=e66]
            - cell "19" [ref=e67]
          - row "20 Slot 6/6 21 Slot 6/6 22 Slot 6/6 23 Slot 6/6 24 Slot 6/6 25 26" [ref=e68]:
            - cell "20 Slot 6/6" [ref=e69]:
              - text: "20"
              - generic [ref=e71]: Slot 6/6
            - cell "21 Slot 6/6" [ref=e72]:
              - text: "21"
              - generic [ref=e74]: Slot 6/6
            - cell "22 Slot 6/6" [ref=e75]:
              - text: "22"
              - generic [ref=e77]: Slot 6/6
            - cell "23 Slot 6/6" [ref=e78]:
              - text: "23"
              - generic [ref=e80]: Slot 6/6
            - cell "24 Slot 6/6" [ref=e81]:
              - text: "24"
              - generic [ref=e83]: Slot 6/6
            - cell "25" [ref=e84]
            - cell "26" [ref=e85]
          - row "27 Slot 3/6 28 Slot 6/6 29 Slot 4/6 30 Slot 6/6 31 Selected (3) Slot 6/6 1 2" [ref=e86]:
            - cell "27 Slot 3/6" [ref=e87] [cursor=pointer]:
              - text: "27"
              - generic [ref=e89]: Slot 3/6
            - cell "28 Slot 6/6" [ref=e90]:
              - text: "28"
              - generic [ref=e92]: Slot 6/6
            - cell "29 Slot 4/6" [ref=e93] [cursor=pointer]:
              - text: "29"
              - generic [ref=e95]: Slot 4/6
            - cell "30 Slot 6/6" [ref=e96]:
              - text: "30"
              - generic [ref=e98]: Slot 6/6
            - cell "31 Selected (3) Slot 6/6" [ref=e99] [cursor=pointer]:
              - text: "31"
              - generic [ref=e100]:
                - generic [ref=e101]: Selected (3)
                - generic [ref=e102]: Slot 6/6
            - cell "1" [ref=e103]
            - cell "2" [ref=e104]
      - generic [ref=e105]:
        - generic [ref=e106]: Booked 3 of 4
        - generic [ref=e107]: Click a date to add or change its time slots.
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
  160 |   /**
  161 |    * First bookable date where a SPECIFIC slot (morning or afternoon) has
  162 |    * at least minRoom free. A date can be generally "bookable" while one
  163 |    * particular slot is already at capacity, so this opens each candidate's
  164 |    * modal to check that slot directly rather than relying on the day
  165 |    * badge (which only reflects combined capacity across both slots).
  166 |    */
  167 |   async findDateWithSlotRoom(slotIndex: number, minRoom: number, maxMonthsAhead: number = 6): Promise<string | null> {
  168 |     for (let m = 0; m <= maxMonthsAhead; m++) {
  169 |       for (const date of await this.findBookableDates()) {
  170 |         await this.openSlotModal(date);
  171 |         const { booked, max } = await this.getModalSlotBooked(slotIndex);
  172 |         await this.closeSlotModal();
  173 |         await this.modalOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  174 |         if (max - booked >= minRoom) return date;
  175 |       }
  176 |       if (m >= maxMonthsAhead) break;
  177 |       if (!(await this.goNextMonth())) break;
  178 |     }
  179 |     return null;
  180 |   }
  181 | 
  182 |   /**
  183 |    * Allocates `count` units into a date's morning slot first, overflowing
  184 |    * into afternoon if morning doesn't have enough room, and saves.
  185 |    * Returns the number actually allocated (may be less than requested if
  186 |    * the date doesn't have enough combined room across both slots).
  187 |    */
  188 |   async allocateUnitsAcrossSlots(dateStr: string, count: number): Promise<number> {
  189 |     await this.openSlotModal(dateStr);
  190 |     let remaining = count;
  191 |     for (const slot of [0, 1]) {
  192 |       if (remaining <= 0) break;
  193 |       const { booked, max } = await this.getModalSlotBooked(slot);
  194 |       const room = max - booked;
  195 |       const take = Math.min(room, remaining);
  196 |       if (take > 0) {
  197 |         await this.incrementSlot(slot, take);
  198 |         remaining -= take;
  199 |       }
  200 |     }
  201 |     await this.saveSlotChanges();
  202 |     return count - remaining;
  203 |   }
  204 | 
  205 |   /**
  206 |    * Allocates `count` units to whatever room is available anywhere,
  207 |    * optionally trying `preferredDate` first. This is a shared, persistent
  208 |    * staging environment — a date's capacity can shift between when we
  209 |    * scan for room and when we actually act on it (another test run,
  210 |    * another user, a cancellation). If the chosen date turns out to have
  211 |    * become unbookable in the meantime, drop it and re-scan for a fresh
  212 |    * one instead of failing outright.
  213 |    */
  214 |   async allocateUnitsAnywhere(count: number, preferredDate?: string, maxAttempts: number = 10): Promise<void> {
  215 |     let remaining = count;
  216 |     let candidate: string | null = preferredDate ?? null;
  217 |     let attempts = 0;
  218 | 
  219 |     while (remaining > 0) {
  220 |       attempts++;
  221 |       if (attempts > maxAttempts) {
  222 |         throw new Error(
  223 |           `Could not allocate the remaining ${remaining} unit(s) after ${maxAttempts} attempts — ran out of bookable dates with room (or they kept becoming unbookable before we could use them).`
  224 |         );
  225 |       }
  226 | 
  227 |       if (!candidate) {
  228 |         candidate = await this.findDateWithRoom(1);
  229 |         if (!candidate) {
  230 |           throw new Error(`No bookable date found with room to allocate the remaining ${remaining} unit(s).`);
  231 |         }
  232 |       }
  233 | 
  234 |       try {
  235 |         remaining -= await this.allocateUnitsAcrossSlots(candidate, remaining);
  236 |       } catch {
  237 |         // Date became unbookable between scan and click — try a fresh one.
  238 |       }
  239 |       candidate = null;
  240 |     }
  241 |   }
  242 | 
  243 |   /**
  244 |    * Click a date cell to open the slot dialog. Defensively closes any
  245 |    * modal left open by a previous action first — its full-page overlay
  246 |    * physically blocks clicks on the calendar underneath, which otherwise
  247 |    * surfaces as a confusing "element intercepts pointer events" timeout
  248 |    * (and can just as easily swallow a goNextMonth() click, making month
  249 |    * navigation silently fail).
  250 |    */
  251 |   async openSlotModal(dateStr: string) {
  252 |     if (await this.modalOverlay.isVisible().catch(() => false)) {
  253 |       await this.closeSlotModal();
  254 |       await this.modalOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  255 |     }
  256 |     await this.ensureMonthVisible(dateStr);
  257 |     const cell = this.getDayCell(dateStr);
  258 |     const classes = (await cell.getAttribute("class")) ?? "";
  259 |     if (!classes.includes("si-book") || classes.includes("si-muted")) {
> 260 |       throw new Error(
      |             ^ Error: Date 2026-07-31 is not bookable (class=" si-muted si-fullday") — pick a date from findBookableDates()/findEmptyBookableDate() instead of a hardcoded offset.
  261 |         `Date ${dateStr} is not bookable (class="${classes}") — pick a date from findBookableDates()/findEmptyBookableDate() instead of a hardcoded offset.`
  262 |       );
  263 |     }
  264 |     await cell.click();
  265 |     await this.modalOverlay.waitFor({ state: "visible", timeout: 5000 });
  266 |   }
  267 | 
  268 |   /** Get booked count for a slot from the modal capacity text (e.g. "2 of 3 booked") */
  269 |   async getModalSlotBooked(slotIndex: number): Promise<{ booked: number; max: number }> {
  270 |     const capEl = slotIndex === 0 ? this.morningCapacity : this.afternoonCapacity;
  271 |     const text = (await capEl.textContent()) ?? "";
  272 |     if (text.toLowerCase().includes("fully booked")) return { booked: ENV.slotCapacity.perSlot, max: ENV.slotCapacity.perSlot };
  273 |     const match = text.match(/(\d+)\s*of\s*(\d+)/);
  274 |     if (!match) return { booked: 0, max: ENV.slotCapacity.perSlot };
  275 |     return { booked: Number(match[1]), max: Number(match[2]) };
  276 |   }
  277 | 
  278 |   async isSlotFullyBooked(slotIndex: number): Promise<boolean> {
  279 |     const capEl = slotIndex === 0 ? this.morningCapacity : this.afternoonCapacity;
  280 |     const text = (await capEl.textContent()) ?? "";
  281 |     return text.toLowerCase().includes("fully booked");
  282 |   }
  283 | 
  284 |   /** Increment a slot's stepper via the JS function siStep(slot, +1) */
  285 |   async incrementSlot(slotIndex: number, times: number = 1) {
  286 |     for (let i = 0; i < times; i++) {
  287 |       await this.page.evaluate((s) => (window as any).siStep(s, 1), slotIndex);
  288 |     }
  289 |   }
  290 | 
  291 |   /** Decrement a slot's stepper via the JS function siStep(slot, -1) */
  292 |   async decrementSlot(slotIndex: number, times: number = 1) {
  293 |     for (let i = 0; i < times; i++) {
  294 |       await this.page.evaluate((s) => (window as any).siStep(s, -1), slotIndex);
  295 |     }
  296 |   }
  297 | 
  298 |   /** Remove all units from a slot via the JS function siRowRemove(slot) */
  299 |   async removeSlot(slotIndex: number) {
  300 |     await this.page.evaluate((s) => (window as any).siRowRemove(s), slotIndex);
  301 |   }
  302 | 
  303 |   /** Save changes in the slot dialog via siSaveDate() */
  304 |   async saveSlotChanges() {
  305 |     await this.page.evaluate(() => (window as any).siSaveDate());
  306 |     await this.modalOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  307 |   }
  308 | 
  309 |   /** Close the slot dialog without saving */
  310 |   async closeSlotModal() {
  311 |     await this.page.evaluate(() => (window as any).siCloseModal());
  312 |   }
  313 | 
  314 |   /** Total units to allocate for this transaction (#si-alloc-total) */
  315 |   async getAllocationTotal(): Promise<number> {
  316 |     const text = (await this.allocTotal.textContent()) ?? "0";
  317 |     return Number(text) || 0;
  318 |   }
  319 | 
  320 |   /** Units allocated so far across all picked dates (#si-alloc-count) */
  321 |   async getAllocatedCount(): Promise<number> {
  322 |     const text = (await this.allocCount.textContent()) ?? "0";
  323 |     return Number(text) || 0;
  324 |   }
  325 | 
  326 |   async getRemainingToAllocate(): Promise<number> {
  327 |     const total = await this.getAllocationTotal();
  328 |     const allocated = await this.getAllocatedCount();
  329 |     return Math.max(0, total - allocated);
  330 |   }
  331 | 
  332 |   /**
  333 |    * Click "Confirm Appointment" / "Confirm booking" via siConfirmBooking().
  334 |    * siConfirmBooking() fires an async request before redirecting to
  335 |    * submitted.do — waiting on networkidle alone can return before that
  336 |    * request even starts, letting the next action interrupt it mid-flight.
  337 |    * Wait for the redirect explicitly first; if confirmation is blocked
  338 |    * (e.g. mandatory booking not satisfied) there's no redirect, so fall
  339 |    * through to the networkidle wait instead.
  340 |    */
  341 |   async confirmAppointment() {
  342 |     await this.page.evaluate(() => (window as any).siConfirmBooking());
  343 |     await this.page.waitForURL(/submitted\.do\?txnId=/, { timeout: 15000 }).catch(() => {});
  344 |     await this.waitForNav();
  345 |   }
  346 | 
  347 |   /**
  348 |    * Navigate calendar to next month. The arrow is kept in the DOM but set
  349 |    * to `visibility: hidden` (not removed/disabled) once the booking
  350 |    * window's forward limit is reached — clicking it then would hang
  351 |    * waiting for "visible". Returns false instead of clicking in that case
  352 |    * so callers know to stop paging forward.
  353 |    */
  354 |   async goNextMonth(): Promise<boolean> {
  355 |     // A stray open modal's overlay covers the whole page and would
  356 |     // silently swallow this click too.
  357 |     if (await this.modalOverlay.isVisible().catch(() => false)) {
  358 |       await this.closeSlotModal();
  359 |       await this.modalOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  360 |     }
```