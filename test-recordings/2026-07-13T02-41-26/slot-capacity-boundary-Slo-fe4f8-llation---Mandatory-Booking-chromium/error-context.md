# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Software Installation - Mandatory Booking
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:128:9

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('#si-next')
    - locator resolved to <a id="si-next" onclick="siCalMonth(1)">›</a>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not visible
    - retrying click action
      - waiting 100ms
    19 × waiting for element to be visible, enabled and stable
       - element is not visible
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
          - generic [ref=e18]: Payment received. Allocate your 2 installations to a date and time slot (up to 3 per slot).
      - generic [ref=e19]:
        - generic [ref=e20]: Please select a date to book for software installation
        - generic [ref=e21]:
          - generic [ref=e22] [cursor=pointer]: ‹
          - generic [ref=e23]: August 2026
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
          - row "27 28 29 30 31 1 2" [ref=e35]:
            - cell "27" [ref=e36]
            - cell "28" [ref=e37]
            - cell "29" [ref=e38]
            - cell "30" [ref=e39]
            - cell "31" [ref=e40]
            - cell "1" [ref=e41]
            - cell "2" [ref=e42]
          - row "3 Slot 3/6 4 Slot 2/6 5 Slot 2/6 6 Slot 1/6 7 Slot 3/6 8 9" [ref=e43]:
            - cell "3 Slot 3/6" [ref=e44] [cursor=pointer]:
              - text: "3"
              - generic [ref=e46]: Slot 3/6
            - cell "4 Slot 2/6" [ref=e47] [cursor=pointer]:
              - text: "4"
              - generic [ref=e49]: Slot 2/6
            - cell "5 Slot 2/6" [ref=e50] [cursor=pointer]:
              - text: "5"
              - generic [ref=e52]: Slot 2/6
            - cell "6 Slot 1/6" [ref=e53] [cursor=pointer]:
              - text: "6"
              - generic [ref=e55]: Slot 1/6
            - cell "7 Slot 3/6" [ref=e56] [cursor=pointer]:
              - text: "7"
              - generic [ref=e58]: Slot 3/6
            - cell "8" [ref=e59]
            - cell "9" [ref=e60]
          - row "10 Slot 6/6 11 Slot 3/6 12 Slot 2/6 13 Slot 1/6 14 Slot 1/6 15 16" [ref=e61]:
            - cell "10 Slot 6/6" [ref=e62]:
              - text: "10"
              - generic [ref=e64]: Slot 6/6
            - cell "11 Slot 3/6" [ref=e65] [cursor=pointer]:
              - text: "11"
              - generic [ref=e67]: Slot 3/6
            - cell "12 Slot 2/6" [ref=e68] [cursor=pointer]:
              - text: "12"
              - generic [ref=e70]: Slot 2/6
            - cell "13 Slot 1/6" [ref=e71] [cursor=pointer]:
              - text: "13"
              - generic [ref=e73]: Slot 1/6
            - cell "14 Slot 1/6" [ref=e74] [cursor=pointer]:
              - text: "14"
              - generic [ref=e76]: Slot 1/6
            - cell "15" [ref=e77]
            - cell "16" [ref=e78]
          - row "17 Slot 1/6 18 Slot 1/6 19 Slot 2/6 20 Slot 1/6 21 Slot 1/6 22 23" [ref=e79]:
            - cell "17 Slot 1/6" [ref=e80] [cursor=pointer]:
              - text: "17"
              - generic [ref=e82]: Slot 1/6
            - cell "18 Slot 1/6" [ref=e83] [cursor=pointer]:
              - text: "18"
              - generic [ref=e85]: Slot 1/6
            - cell "19 Slot 2/6" [ref=e86] [cursor=pointer]:
              - text: "19"
              - generic [ref=e88]: Slot 2/6
            - cell "20 Slot 1/6" [ref=e89] [cursor=pointer]:
              - text: "20"
              - generic [ref=e91]: Slot 1/6
            - cell "21 Slot 1/6" [ref=e92] [cursor=pointer]:
              - text: "21"
              - generic [ref=e94]: Slot 1/6
            - cell "22" [ref=e95]
            - cell "23" [ref=e96]
          - row "24 Slot 1/6 25 Slot 1/6 26 Slot 2/6 27 Slot 6/6 28 Slot 4/6 29 30" [ref=e97]:
            - cell "24 Slot 1/6" [ref=e98] [cursor=pointer]:
              - text: "24"
              - generic [ref=e100]: Slot 1/6
            - cell "25 Slot 1/6" [ref=e101] [cursor=pointer]:
              - text: "25"
              - generic [ref=e103]: Slot 1/6
            - cell "26 Slot 2/6" [ref=e104] [cursor=pointer]:
              - text: "26"
              - generic [ref=e106]: Slot 2/6
            - cell "27 Slot 6/6" [ref=e107]:
              - text: "27"
              - generic [ref=e109]: Slot 6/6
            - cell "28 Slot 4/6" [ref=e110] [cursor=pointer]:
              - text: "28"
              - generic [ref=e112]: Slot 4/6
            - cell "29" [ref=e113]
            - cell "30" [ref=e114]
          - row "31 Public Holiday 1 2 3 4 5 6" [ref=e115]:
            - cell "31 Public Holiday" [ref=e116]:
              - text: "31"
              - generic [ref=e118]: Public Holiday
            - cell "1" [ref=e119]
            - cell "2" [ref=e120]
            - cell "3" [ref=e121]
            - cell "4" [ref=e122]
            - cell "5" [ref=e123]
            - cell "6" [ref=e124]
      - generic [ref=e125]:
        - generic [ref=e126]: Booked 0 of 2
        - generic [ref=e127]: Click a bookable date above to allocate an installation.
        - button "Confirm Appointment" [ref=e129] [cursor=pointer]
  - generic [ref=e130]:
    - generic [ref=e131]:
      - button "HOME" [ref=e132] [cursor=pointer]
      - button "INSURANCE" [ref=e133] [cursor=pointer]
      - button "REPORTS" [ref=e134] [cursor=pointer]
      - button "SETTINGS" [ref=e135] [cursor=pointer]
      - button "USER GUIDE" [ref=e136] [cursor=pointer]
      - button "DOWNLOAD" [ref=e137] [cursor=pointer]
      - button "CONTACT US" [ref=e138] [cursor=pointer]
    - table [ref=e139]:
      - rowgroup [ref=e140]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e141]:
          - cell "Online Services - Service Hub" [ref=e142]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e143]:
            - list [ref=e144]:
              - listitem [ref=e145]:
                - img [ref=e146]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e147]: "|"
              - listitem [ref=e148]:
                - link "Logout" [ref=e149] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e151]
  - generic [ref=e152]:
    - generic [ref=e154]:
      - generic [ref=e155]:
        - link "Contact Us" [ref=e156] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e157]: "|"
        - link "Terms & Conditions" [ref=e158] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e159]: "|"
        - link "Privacy" [ref=e160] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e161]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e162]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e164]
```

# Test source

```ts
  125 |       if (m < maxMonthsAhead) await this.goNextMonth();
  126 |     }
  127 |     return null;
  128 |   }
  129 | 
  130 |   /** Click a date cell to open the slot dialog */
  131 |   async openSlotModal(dateStr: string) {
  132 |     await this.ensureMonthVisible(dateStr);
  133 |     const cell = this.getDayCell(dateStr);
  134 |     const classes = (await cell.getAttribute("class")) ?? "";
  135 |     if (!classes.includes("si-book") || classes.includes("si-muted")) {
  136 |       throw new Error(
  137 |         `Date ${dateStr} is not bookable (class="${classes}") — pick a date from findBookableDates()/findEmptyBookableDate() instead of a hardcoded offset.`
  138 |       );
  139 |     }
  140 |     await cell.click();
  141 |     await this.modalOverlay.waitFor({ state: "visible", timeout: 5000 });
  142 |   }
  143 | 
  144 |   /** Get booked count for a slot from the modal capacity text (e.g. "2 of 3 booked") */
  145 |   async getModalSlotBooked(slotIndex: number): Promise<{ booked: number; max: number }> {
  146 |     const capEl = slotIndex === 0 ? this.morningCapacity : this.afternoonCapacity;
  147 |     const text = (await capEl.textContent()) ?? "";
  148 |     if (text.toLowerCase().includes("fully booked")) return { booked: ENV.slotCapacity.perSlot, max: ENV.slotCapacity.perSlot };
  149 |     const match = text.match(/(\d+)\s*of\s*(\d+)/);
  150 |     if (!match) return { booked: 0, max: ENV.slotCapacity.perSlot };
  151 |     return { booked: Number(match[1]), max: Number(match[2]) };
  152 |   }
  153 | 
  154 |   async isSlotFullyBooked(slotIndex: number): Promise<boolean> {
  155 |     const capEl = slotIndex === 0 ? this.morningCapacity : this.afternoonCapacity;
  156 |     const text = (await capEl.textContent()) ?? "";
  157 |     return text.toLowerCase().includes("fully booked");
  158 |   }
  159 | 
  160 |   /** Increment a slot's stepper via the JS function siStep(slot, +1) */
  161 |   async incrementSlot(slotIndex: number, times: number = 1) {
  162 |     for (let i = 0; i < times; i++) {
  163 |       await this.page.evaluate((s) => (window as any).siStep(s, 1), slotIndex);
  164 |     }
  165 |   }
  166 | 
  167 |   /** Decrement a slot's stepper via the JS function siStep(slot, -1) */
  168 |   async decrementSlot(slotIndex: number, times: number = 1) {
  169 |     for (let i = 0; i < times; i++) {
  170 |       await this.page.evaluate((s) => (window as any).siStep(s, -1), slotIndex);
  171 |     }
  172 |   }
  173 | 
  174 |   /** Remove all units from a slot via the JS function siRowRemove(slot) */
  175 |   async removeSlot(slotIndex: number) {
  176 |     await this.page.evaluate((s) => (window as any).siRowRemove(s), slotIndex);
  177 |   }
  178 | 
  179 |   /** Save changes in the slot dialog via siSaveDate() */
  180 |   async saveSlotChanges() {
  181 |     await this.page.evaluate(() => (window as any).siSaveDate());
  182 |     await this.modalOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  183 |   }
  184 | 
  185 |   /** Close the slot dialog without saving */
  186 |   async closeSlotModal() {
  187 |     await this.page.evaluate(() => (window as any).siCloseModal());
  188 |   }
  189 | 
  190 |   /** Total units to allocate for this transaction (#si-alloc-total) */
  191 |   async getAllocationTotal(): Promise<number> {
  192 |     const text = (await this.allocTotal.textContent()) ?? "0";
  193 |     return Number(text) || 0;
  194 |   }
  195 | 
  196 |   /** Units allocated so far across all picked dates (#si-alloc-count) */
  197 |   async getAllocatedCount(): Promise<number> {
  198 |     const text = (await this.allocCount.textContent()) ?? "0";
  199 |     return Number(text) || 0;
  200 |   }
  201 | 
  202 |   async getRemainingToAllocate(): Promise<number> {
  203 |     const total = await this.getAllocationTotal();
  204 |     const allocated = await this.getAllocatedCount();
  205 |     return Math.max(0, total - allocated);
  206 |   }
  207 | 
  208 |   /**
  209 |    * Click "Confirm Appointment" / "Confirm booking" via siConfirmBooking().
  210 |    * siConfirmBooking() fires an async request before redirecting to
  211 |    * submitted.do — waiting on networkidle alone can return before that
  212 |    * request even starts, letting the next action interrupt it mid-flight.
  213 |    * Wait for the redirect explicitly first; if confirmation is blocked
  214 |    * (e.g. mandatory booking not satisfied) there's no redirect, so fall
  215 |    * through to the networkidle wait instead.
  216 |    */
  217 |   async confirmAppointment() {
  218 |     await this.page.evaluate(() => (window as any).siConfirmBooking());
  219 |     await this.page.waitForURL(/submitted\.do\?txnId=/, { timeout: 15000 }).catch(() => {});
  220 |     await this.waitForNav();
  221 |   }
  222 | 
  223 |   /** Navigate calendar to next/prev month */
  224 |   async goNextMonth() {
> 225 |     await this.nextMonthArrow.click();
      |                               ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  226 |     await this.page.waitForTimeout(300);
  227 |   }
  228 | 
  229 |   async goPrevMonth() {
  230 |     await this.prevMonthArrow.click();
  231 |     await this.page.waitForTimeout(300);
  232 |   }
  233 | 
  234 |   /** Get current month/year from the calendar header */
  235 |   async getCurrentMonth(): Promise<string> {
  236 |     return (await this.monthHeader.textContent()) ?? "";
  237 |   }
  238 | 
  239 |   /** Close the "Slot Unavailable" popup */
  240 |   async closeUnavailPopup() {
  241 |     await this.page.evaluate(() => (window as any).siCloseUnavail());
  242 |   }
  243 | }
  244 | 
```