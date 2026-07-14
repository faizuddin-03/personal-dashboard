# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Afternoon Slot - Book until full
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:75:9

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('td[data-date="2026-07-17"]')
    - locator resolved to <td class=" si-book" data-date="2026-07-17" onclick="siOpenSlot('2026-07-17')">…</td>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div id="si-ovl" class="si-ovl">…</div> intercepts pointer events
    - retrying click action
    - waiting 20ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <div class="si-slotrow">…</div> from <div id="si-ovl" class="si-ovl">…</div> subtree intercepts pointer events
  2 × retrying click action
      - waiting 100ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="si-mhd">…</div> from <div id="si-ovl" class="si-ovl">…</div> subtree intercepts pointer events
  4 × retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div id="si-ovl" class="si-ovl">…</div> intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="si-slotrow">…</div> from <div id="si-ovl" class="si-ovl">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="si-mhd">…</div> from <div id="si-ovl" class="si-ovl">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 500ms
      - waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <div class="si-mhd">…</div> from <div id="si-ovl" class="si-ovl">…</div> subtree intercepts pointer events
  - retrying click action
    - waiting 500ms
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - <div id="si-ovl" class="si-ovl">…</div> intercepts pointer events
  - retrying click action
    - waiting 500ms

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
          - row "13 14 Slot 6/6 15 Slot 6/6 16 Slot 6/6 17 Slot 3/6 18 19" [ref=e51]:
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
            - cell "17 Slot 3/6" [ref=e63] [cursor=pointer]:
              - text: "17"
              - generic [ref=e65]: Slot 3/6
            - cell "18" [ref=e66]
            - cell "19" [ref=e67]
          - row "20 Slot 1/6 21 Slot 6/6 22 Slot 2/6 23 Slot 6/6 24 Slot 5/6 25 26" [ref=e68]:
            - cell "20 Slot 1/6" [ref=e69] [cursor=pointer]:
              - text: "20"
              - generic [ref=e71]: Slot 1/6
            - cell "21 Slot 6/6" [ref=e72]:
              - text: "21"
              - generic [ref=e74]: Slot 6/6
            - cell "22 Slot 2/6" [ref=e75] [cursor=pointer]:
              - text: "22"
              - generic [ref=e77]: Slot 2/6
            - cell "23 Slot 6/6" [ref=e78]:
              - text: "23"
              - generic [ref=e80]: Slot 6/6
            - cell "24 Slot 5/6" [ref=e81] [cursor=pointer]:
              - text: "24"
              - generic [ref=e83]: Slot 5/6
            - cell "25" [ref=e84]
            - cell "26" [ref=e85]
          - row "27 Slot 3/6 28 Slot 5/6 29 Slot 4/6 30 Slot 2/6 31 Slot 3/6 1 2" [ref=e86]:
            - cell "27 Slot 3/6" [ref=e87] [cursor=pointer]:
              - text: "27"
              - generic [ref=e89]: Slot 3/6
            - cell "28 Slot 5/6" [ref=e90] [cursor=pointer]:
              - text: "28"
              - generic [ref=e92]: Slot 5/6
            - cell "29 Slot 4/6" [ref=e93] [cursor=pointer]:
              - text: "29"
              - generic [ref=e95]: Slot 4/6
            - cell "30 Slot 2/6" [ref=e96] [cursor=pointer]:
              - text: "30"
              - generic [ref=e98]: Slot 2/6
            - cell "31 Slot 3/6" [ref=e99] [cursor=pointer]:
              - text: "31"
              - generic [ref=e101]: Slot 3/6
            - cell "1" [ref=e102]
            - cell "2" [ref=e103]
      - generic [ref=e104]:
        - generic [ref=e105]: Booked 0 of 4
        - generic [ref=e106]: Click a bookable date above to allocate an installation.
        - button "Confirm Appointment" [ref=e108] [cursor=pointer]
  - generic [ref=e110]:
    - generic [ref=e111]:
      - generic [ref=e112]: Installation Appointment
      - generic [ref=e113] [cursor=pointer]: ×
    - generic [ref=e114]:
      - generic [ref=e115]:
        - generic [ref=e116]: "Appointment Date:"
        - textbox [ref=e117]: 17-07-2026
      - generic [ref=e118]: Allocate up to 4 installations across the time slots below.
      - generic [ref=e119]:
        - generic [ref=e120]: 10:00am - 12:00pm
        - generic [ref=e121]:
          - button "−" [ref=e122] [cursor=pointer]
          - textbox [ref=e123]: "0"
          - button "+" [ref=e124] [cursor=pointer]
        - generic [ref=e125]: Fully booked
      - generic [ref=e126]:
        - generic [ref=e127]: 2:00pm - 4:00pm
        - generic [ref=e128]:
          - button "−" [ref=e129] [cursor=pointer]
          - textbox [ref=e130]: "0"
          - button "+" [ref=e131] [cursor=pointer]
        - generic [ref=e132]: 0 of 3 booked
      - generic [ref=e133]: "Remaining to allocate: 4"
    - generic [ref=e135]:
      - button "Cancel" [ref=e136] [cursor=pointer]
      - button "Save changes" [ref=e137] [cursor=pointer]
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
  93  |     return await cell.locator(".si-bookbadge").count() > 0;
  94  |   }
  95  | 
  96  |   async isDateSelected(dateStr: string): Promise<boolean> {
  97  |     await this.ensureMonthVisible(dateStr);
  98  |     const cell = this.getDayCell(dateStr);
  99  |     return await cell.locator(".si-selbadge").count() > 0;
  100 |   }
  101 | 
  102 |   /** All bookable dates on the currently-visible calendar month (td.si-book) */
  103 |   async findBookableDates(): Promise<string[]> {
  104 |     const cells = await this.page.locator("td.si-book[data-date]").all();
  105 |     const dates: string[] = [];
  106 |     for (const cell of cells) {
  107 |       const date = await cell.getAttribute("data-date");
  108 |       if (date) dates.push(date);
  109 |     }
  110 |     return dates;
  111 |   }
  112 | 
  113 |   /**
  114 |    * First bookable date with zero units booked (clean slate for capacity
  115 |    * tests). Repeated test runs consume the pool of empty dates in the
  116 |    * current month, so this pages forward through future months until it
  117 |    * finds one, up to maxMonthsAhead.
  118 |    */
  119 |   async findEmptyBookableDate(maxMonthsAhead: number = 6): Promise<string | null> {
  120 |     for (let m = 0; m <= maxMonthsAhead; m++) {
  121 |       for (const date of await this.findBookableDates()) {
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
  161 |    * Allocates `count` units into a date's morning slot first, overflowing
  162 |    * into afternoon if morning doesn't have enough room, and saves.
  163 |    * Returns the number actually allocated (may be less than requested if
  164 |    * the date doesn't have enough combined room across both slots).
  165 |    */
  166 |   async allocateUnitsAcrossSlots(dateStr: string, count: number): Promise<number> {
  167 |     await this.openSlotModal(dateStr);
  168 |     let remaining = count;
  169 |     for (const slot of [0, 1]) {
  170 |       if (remaining <= 0) break;
  171 |       const { booked, max } = await this.getModalSlotBooked(slot);
  172 |       const room = max - booked;
  173 |       const take = Math.min(room, remaining);
  174 |       if (take > 0) {
  175 |         await this.incrementSlot(slot, take);
  176 |         remaining -= take;
  177 |       }
  178 |     }
  179 |     await this.saveSlotChanges();
  180 |     return count - remaining;
  181 |   }
  182 | 
  183 |   /** Click a date cell to open the slot dialog */
  184 |   async openSlotModal(dateStr: string) {
  185 |     await this.ensureMonthVisible(dateStr);
  186 |     const cell = this.getDayCell(dateStr);
  187 |     const classes = (await cell.getAttribute("class")) ?? "";
  188 |     if (!classes.includes("si-book") || classes.includes("si-muted")) {
  189 |       throw new Error(
  190 |         `Date ${dateStr} is not bookable (class="${classes}") — pick a date from findBookableDates()/findEmptyBookableDate() instead of a hardcoded offset.`
  191 |       );
  192 |     }
> 193 |     await cell.click();
      |                ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  194 |     await this.modalOverlay.waitFor({ state: "visible", timeout: 5000 });
  195 |   }
  196 | 
  197 |   /** Get booked count for a slot from the modal capacity text (e.g. "2 of 3 booked") */
  198 |   async getModalSlotBooked(slotIndex: number): Promise<{ booked: number; max: number }> {
  199 |     const capEl = slotIndex === 0 ? this.morningCapacity : this.afternoonCapacity;
  200 |     const text = (await capEl.textContent()) ?? "";
  201 |     if (text.toLowerCase().includes("fully booked")) return { booked: ENV.slotCapacity.perSlot, max: ENV.slotCapacity.perSlot };
  202 |     const match = text.match(/(\d+)\s*of\s*(\d+)/);
  203 |     if (!match) return { booked: 0, max: ENV.slotCapacity.perSlot };
  204 |     return { booked: Number(match[1]), max: Number(match[2]) };
  205 |   }
  206 | 
  207 |   async isSlotFullyBooked(slotIndex: number): Promise<boolean> {
  208 |     const capEl = slotIndex === 0 ? this.morningCapacity : this.afternoonCapacity;
  209 |     const text = (await capEl.textContent()) ?? "";
  210 |     return text.toLowerCase().includes("fully booked");
  211 |   }
  212 | 
  213 |   /** Increment a slot's stepper via the JS function siStep(slot, +1) */
  214 |   async incrementSlot(slotIndex: number, times: number = 1) {
  215 |     for (let i = 0; i < times; i++) {
  216 |       await this.page.evaluate((s) => (window as any).siStep(s, 1), slotIndex);
  217 |     }
  218 |   }
  219 | 
  220 |   /** Decrement a slot's stepper via the JS function siStep(slot, -1) */
  221 |   async decrementSlot(slotIndex: number, times: number = 1) {
  222 |     for (let i = 0; i < times; i++) {
  223 |       await this.page.evaluate((s) => (window as any).siStep(s, -1), slotIndex);
  224 |     }
  225 |   }
  226 | 
  227 |   /** Remove all units from a slot via the JS function siRowRemove(slot) */
  228 |   async removeSlot(slotIndex: number) {
  229 |     await this.page.evaluate((s) => (window as any).siRowRemove(s), slotIndex);
  230 |   }
  231 | 
  232 |   /** Save changes in the slot dialog via siSaveDate() */
  233 |   async saveSlotChanges() {
  234 |     await this.page.evaluate(() => (window as any).siSaveDate());
  235 |     await this.modalOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  236 |   }
  237 | 
  238 |   /** Close the slot dialog without saving */
  239 |   async closeSlotModal() {
  240 |     await this.page.evaluate(() => (window as any).siCloseModal());
  241 |   }
  242 | 
  243 |   /** Total units to allocate for this transaction (#si-alloc-total) */
  244 |   async getAllocationTotal(): Promise<number> {
  245 |     const text = (await this.allocTotal.textContent()) ?? "0";
  246 |     return Number(text) || 0;
  247 |   }
  248 | 
  249 |   /** Units allocated so far across all picked dates (#si-alloc-count) */
  250 |   async getAllocatedCount(): Promise<number> {
  251 |     const text = (await this.allocCount.textContent()) ?? "0";
  252 |     return Number(text) || 0;
  253 |   }
  254 | 
  255 |   async getRemainingToAllocate(): Promise<number> {
  256 |     const total = await this.getAllocationTotal();
  257 |     const allocated = await this.getAllocatedCount();
  258 |     return Math.max(0, total - allocated);
  259 |   }
  260 | 
  261 |   /**
  262 |    * Click "Confirm Appointment" / "Confirm booking" via siConfirmBooking().
  263 |    * siConfirmBooking() fires an async request before redirecting to
  264 |    * submitted.do — waiting on networkidle alone can return before that
  265 |    * request even starts, letting the next action interrupt it mid-flight.
  266 |    * Wait for the redirect explicitly first; if confirmation is blocked
  267 |    * (e.g. mandatory booking not satisfied) there's no redirect, so fall
  268 |    * through to the networkidle wait instead.
  269 |    */
  270 |   async confirmAppointment() {
  271 |     await this.page.evaluate(() => (window as any).siConfirmBooking());
  272 |     await this.page.waitForURL(/submitted\.do\?txnId=/, { timeout: 15000 }).catch(() => {});
  273 |     await this.waitForNav();
  274 |   }
  275 | 
  276 |   /**
  277 |    * Navigate calendar to next month. The arrow is kept in the DOM but set
  278 |    * to `visibility: hidden` (not removed/disabled) once the booking
  279 |    * window's forward limit is reached — clicking it then would hang
  280 |    * waiting for "visible". Returns false instead of clicking in that case
  281 |    * so callers know to stop paging forward.
  282 |    */
  283 |   async goNextMonth(): Promise<boolean> {
  284 |     const style = (await this.nextMonthArrow.getAttribute("style")) ?? "";
  285 |     if (style.includes("hidden")) return false;
  286 |     await this.nextMonthArrow.click();
  287 |     await this.page.waitForTimeout(300);
  288 |     return true;
  289 |   }
  290 | 
  291 |   async goPrevMonth() {
  292 |     await this.prevMonthArrow.click();
  293 |     await this.page.waitForTimeout(300);
```