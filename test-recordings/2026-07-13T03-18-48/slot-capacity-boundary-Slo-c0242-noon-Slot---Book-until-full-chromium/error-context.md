# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Afternoon Slot - Book until full
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:81:9

# Error details

```
Error: Date 2026-07-22 is not bookable (class=" si-muted si-fullday") — pick a date from findBookableDates()/findEmptyBookableDate() instead of a hardcoded offset.
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
          - row "20 Slot 6/6 21 Slot 6/6 22 Selected (1) Slot 6/6 23 Slot 6/6 24 Slot 5/6 25 26" [ref=e68]:
            - cell "20 Slot 6/6" [ref=e69]:
              - text: "20"
              - generic [ref=e71]: Slot 6/6
            - cell "21 Slot 6/6" [ref=e72]:
              - text: "21"
              - generic [ref=e74]: Slot 6/6
            - cell "22 Selected (1) Slot 6/6" [ref=e75] [cursor=pointer]:
              - text: "22"
              - generic [ref=e76]:
                - generic [ref=e77]: Selected (1)
                - generic [ref=e78]: Slot 6/6
            - cell "23 Slot 6/6" [ref=e79]:
              - text: "23"
              - generic [ref=e81]: Slot 6/6
            - cell "24 Slot 5/6" [ref=e82] [cursor=pointer]:
              - text: "24"
              - generic [ref=e84]: Slot 5/6
            - cell "25" [ref=e85]
            - cell "26" [ref=e86]
          - row "27 Slot 3/6 28 Slot 5/6 29 Slot 4/6 30 Slot 6/6 31 Slot 3/6 1 2" [ref=e87]:
            - cell "27 Slot 3/6" [ref=e88] [cursor=pointer]:
              - text: "27"
              - generic [ref=e90]: Slot 3/6
            - cell "28 Slot 5/6" [ref=e91] [cursor=pointer]:
              - text: "28"
              - generic [ref=e93]: Slot 5/6
            - cell "29 Slot 4/6" [ref=e94] [cursor=pointer]:
              - text: "29"
              - generic [ref=e96]: Slot 4/6
            - cell "30 Slot 6/6" [ref=e97]:
              - text: "30"
              - generic [ref=e99]: Slot 6/6
            - cell "31 Slot 3/6" [ref=e100] [cursor=pointer]:
              - text: "31"
              - generic [ref=e102]: Slot 3/6
            - cell "1" [ref=e103]
            - cell "2" [ref=e104]
      - generic [ref=e105]:
        - generic [ref=e106]: Booked 1 of 4
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
  122 |         const { used } = await this.getSlotCount(date);
  123 |         if (used === 0) return date;
  124 |       }
  125 |       if (m >= maxMonthsAhead) break;
  126 |       if (!(await this.goNextMonth())) break;
  127 |     }
  128 |     return null;
  129 |   }
  130 | 
  131 |   /**
  132 |    * First bookable date regardless of existing bookings. Use this (plus
  133 |    * per-slot/per-day room checks) instead of findEmptyBookableDate() once
  134 |    * the shared staging calendar no longer has any completely untouched
  135 |    * dates left in the navigable window.
  136 |    */
  137 |   async findAnyBookableDate(maxMonthsAhead: number = 6): Promise<string | null> {
  138 |     for (let m = 0; m <= maxMonthsAhead; m++) {
  139 |       const dates = await this.findBookableDates();
  140 |       if (dates.length > 0) return dates[0];
  141 |       if (m >= maxMonthsAhead) break;
  142 |       if (!(await this.goNextMonth())) break;
  143 |     }
  144 |     return null;
  145 |   }
  146 | 
  147 |   /** First bookable date whose combined day capacity (both slots) has at least minRoom free */
  148 |   async findDateWithRoom(minRoom: number, maxMonthsAhead: number = 6): Promise<string | null> {
  149 |     for (let m = 0; m <= maxMonthsAhead; m++) {
  150 |       for (const date of await this.findBookableDates()) {
  151 |         const { used, total } = await this.getSlotCount(date);
  152 |         if (total - used >= minRoom) return date;
  153 |       }
  154 |       if (m >= maxMonthsAhead) break;
  155 |       if (!(await this.goNextMonth())) break;
  156 |     }
  157 |     return null;
  158 |   }
  159 | 
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
  206 |    * Click a date cell to open the slot dialog. Defensively closes any
  207 |    * modal left open by a previous action first — its full-page overlay
  208 |    * physically blocks clicks on the calendar underneath, which otherwise
  209 |    * surfaces as a confusing "element intercepts pointer events" timeout
  210 |    * (and can just as easily swallow a goNextMonth() click, making month
  211 |    * navigation silently fail).
  212 |    */
  213 |   async openSlotModal(dateStr: string) {
  214 |     if (await this.modalOverlay.isVisible().catch(() => false)) {
  215 |       await this.closeSlotModal();
  216 |       await this.modalOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  217 |     }
  218 |     await this.ensureMonthVisible(dateStr);
  219 |     const cell = this.getDayCell(dateStr);
  220 |     const classes = (await cell.getAttribute("class")) ?? "";
  221 |     if (!classes.includes("si-book") || classes.includes("si-muted")) {
> 222 |       throw new Error(
      |             ^ Error: Date 2026-07-22 is not bookable (class=" si-muted si-fullday") — pick a date from findBookableDates()/findEmptyBookableDate() instead of a hardcoded offset.
  223 |         `Date ${dateStr} is not bookable (class="${classes}") — pick a date from findBookableDates()/findEmptyBookableDate() instead of a hardcoded offset.`
  224 |       );
  225 |     }
  226 |     await cell.click();
  227 |     await this.modalOverlay.waitFor({ state: "visible", timeout: 5000 });
  228 |   }
  229 | 
  230 |   /** Get booked count for a slot from the modal capacity text (e.g. "2 of 3 booked") */
  231 |   async getModalSlotBooked(slotIndex: number): Promise<{ booked: number; max: number }> {
  232 |     const capEl = slotIndex === 0 ? this.morningCapacity : this.afternoonCapacity;
  233 |     const text = (await capEl.textContent()) ?? "";
  234 |     if (text.toLowerCase().includes("fully booked")) return { booked: ENV.slotCapacity.perSlot, max: ENV.slotCapacity.perSlot };
  235 |     const match = text.match(/(\d+)\s*of\s*(\d+)/);
  236 |     if (!match) return { booked: 0, max: ENV.slotCapacity.perSlot };
  237 |     return { booked: Number(match[1]), max: Number(match[2]) };
  238 |   }
  239 | 
  240 |   async isSlotFullyBooked(slotIndex: number): Promise<boolean> {
  241 |     const capEl = slotIndex === 0 ? this.morningCapacity : this.afternoonCapacity;
  242 |     const text = (await capEl.textContent()) ?? "";
  243 |     return text.toLowerCase().includes("fully booked");
  244 |   }
  245 | 
  246 |   /** Increment a slot's stepper via the JS function siStep(slot, +1) */
  247 |   async incrementSlot(slotIndex: number, times: number = 1) {
  248 |     for (let i = 0; i < times; i++) {
  249 |       await this.page.evaluate((s) => (window as any).siStep(s, 1), slotIndex);
  250 |     }
  251 |   }
  252 | 
  253 |   /** Decrement a slot's stepper via the JS function siStep(slot, -1) */
  254 |   async decrementSlot(slotIndex: number, times: number = 1) {
  255 |     for (let i = 0; i < times; i++) {
  256 |       await this.page.evaluate((s) => (window as any).siStep(s, -1), slotIndex);
  257 |     }
  258 |   }
  259 | 
  260 |   /** Remove all units from a slot via the JS function siRowRemove(slot) */
  261 |   async removeSlot(slotIndex: number) {
  262 |     await this.page.evaluate((s) => (window as any).siRowRemove(s), slotIndex);
  263 |   }
  264 | 
  265 |   /** Save changes in the slot dialog via siSaveDate() */
  266 |   async saveSlotChanges() {
  267 |     await this.page.evaluate(() => (window as any).siSaveDate());
  268 |     await this.modalOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  269 |   }
  270 | 
  271 |   /** Close the slot dialog without saving */
  272 |   async closeSlotModal() {
  273 |     await this.page.evaluate(() => (window as any).siCloseModal());
  274 |   }
  275 | 
  276 |   /** Total units to allocate for this transaction (#si-alloc-total) */
  277 |   async getAllocationTotal(): Promise<number> {
  278 |     const text = (await this.allocTotal.textContent()) ?? "0";
  279 |     return Number(text) || 0;
  280 |   }
  281 | 
  282 |   /** Units allocated so far across all picked dates (#si-alloc-count) */
  283 |   async getAllocatedCount(): Promise<number> {
  284 |     const text = (await this.allocCount.textContent()) ?? "0";
  285 |     return Number(text) || 0;
  286 |   }
  287 | 
  288 |   async getRemainingToAllocate(): Promise<number> {
  289 |     const total = await this.getAllocationTotal();
  290 |     const allocated = await this.getAllocatedCount();
  291 |     return Math.max(0, total - allocated);
  292 |   }
  293 | 
  294 |   /**
  295 |    * Click "Confirm Appointment" / "Confirm booking" via siConfirmBooking().
  296 |    * siConfirmBooking() fires an async request before redirecting to
  297 |    * submitted.do — waiting on networkidle alone can return before that
  298 |    * request even starts, letting the next action interrupt it mid-flight.
  299 |    * Wait for the redirect explicitly first; if confirmation is blocked
  300 |    * (e.g. mandatory booking not satisfied) there's no redirect, so fall
  301 |    * through to the networkidle wait instead.
  302 |    */
  303 |   async confirmAppointment() {
  304 |     await this.page.evaluate(() => (window as any).siConfirmBooking());
  305 |     await this.page.waitForURL(/submitted\.do\?txnId=/, { timeout: 15000 }).catch(() => {});
  306 |     await this.waitForNav();
  307 |   }
  308 | 
  309 |   /**
  310 |    * Navigate calendar to next month. The arrow is kept in the DOM but set
  311 |    * to `visibility: hidden` (not removed/disabled) once the booking
  312 |    * window's forward limit is reached — clicking it then would hang
  313 |    * waiting for "visible". Returns false instead of clicking in that case
  314 |    * so callers know to stop paging forward.
  315 |    */
  316 |   async goNextMonth(): Promise<boolean> {
  317 |     // A stray open modal's overlay covers the whole page and would
  318 |     // silently swallow this click too.
  319 |     if (await this.modalOverlay.isVisible().catch(() => false)) {
  320 |       await this.closeSlotModal();
  321 |       await this.modalOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  322 |     }
```