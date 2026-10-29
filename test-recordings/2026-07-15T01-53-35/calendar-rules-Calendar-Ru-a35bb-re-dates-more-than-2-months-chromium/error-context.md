# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: calendar-rules.spec.ts >> Calendar Rules (UCD) >> Book future dates more than 2 months
- Location: tests\service-hub\specs\calendar-rules.spec.ts:62:7

# Error details

```
TimeoutError: locator.getAttribute: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('#si-next')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - link "Home" [ref=e5] [cursor=pointer]:
        - /url: /uat1/view/ucd/
      - generic [ref=e6]: /
      - link "Service Hub" [ref=e7] [cursor=pointer]:
        - /url: /uat1/view/ucd/service-hub/view.do
      - generic [ref=e8]: /
      - generic [ref=e9]: Software Installation
    - generic [ref=e11]:
      - generic [ref=e12]:
        - img "Success" [ref=e14]
        - generic [ref=e15]: Request Submitted
      - generic [ref=e16]: We have received your request and you will receive an email for confirmation.
      - generic [ref=e18]:
        - generic [ref=e19]: Software Installation Appointment Details
        - table [ref=e20]:
          - rowgroup [ref=e21]:
            - row "# Appointment Date Time Slot Unit(s)" [ref=e22]:
              - columnheader "#" [ref=e23]
              - columnheader "Appointment Date" [ref=e24]
              - columnheader "Time Slot" [ref=e25]
              - columnheader "Unit(s)" [ref=e26]
          - rowgroup [ref=e27]:
            - row "1 20-07-2026 2:00pm - 4:00pm 1" [ref=e28]:
              - cell "1" [ref=e29]
              - cell "20-07-2026" [ref=e30]
              - cell "2:00pm - 4:00pm" [ref=e31]
              - cell "1" [ref=e32]
      - link "Done" [ref=e33] [cursor=pointer]:
        - /url: /uat1/view/ucd/service-hub/receipt.do?transactionId=870dde64-f06a-44d4-a54f-938470d3b294
  - generic [ref=e34]:
    - generic [ref=e35]:
      - button "HOME" [ref=e36] [cursor=pointer]
      - button "INSURANCE" [ref=e37] [cursor=pointer]
      - button "REPORTS" [ref=e38] [cursor=pointer]
      - button "SETTINGS" [ref=e39] [cursor=pointer]
      - button "USER GUIDE" [ref=e40] [cursor=pointer]
      - button "DOWNLOAD" [ref=e41] [cursor=pointer]
      - button "CONTACT US" [ref=e42] [cursor=pointer]
    - table [ref=e43]:
      - rowgroup [ref=e44]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e45]:
          - cell "Online Services - Service Hub" [ref=e46]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e47]:
            - list [ref=e48]:
              - listitem [ref=e49]:
                - img [ref=e50]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e51]: "|"
              - listitem [ref=e52]:
                - link "Logout" [ref=e53] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e55]
  - generic [ref=e56]:
    - generic [ref=e58]:
      - generic [ref=e59]:
        - link "Contact Us" [ref=e60] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e61]: "|"
        - link "Terms & Conditions" [ref=e62] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e63]: "|"
        - link "Privacy" [ref=e64] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e65]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e66]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e68]
```

# Test source

```ts
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
  490 |     await this.waitForNav();
  491 |     await this.demoPause();
  492 |   }
  493 | 
  494 |   /**
  495 |    * Navigate calendar to next month. The arrow is kept in the DOM but set
  496 |    * to `visibility: hidden` (not removed/disabled) once the booking
  497 |    * window's forward limit is reached — clicking it then would hang
  498 |    * waiting for "visible". Returns false instead of clicking in that case
  499 |    * so callers know to stop paging forward.
  500 |    */
  501 |   async goNextMonth(): Promise<boolean> {
  502 |     // A stray open modal's overlay covers the whole page and would
  503 |     // silently swallow this click too.
  504 |     if (await this.modalOverlay.isVisible().catch(() => false)) {
  505 |       await this.closeSlotModal();
  506 |       await this.modalOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  507 |     }
> 508 |     const style = (await this.nextMonthArrow.getAttribute("style")) ?? "";
      |                                              ^ TimeoutError: locator.getAttribute: Timeout 10000ms exceeded.
  509 |     if (style.includes("hidden")) return false;
  510 |     await this.nextMonthArrow.click();
  511 |     await this.page.waitForTimeout(300);
  512 |     return true;
  513 |   }
  514 | 
  515 |   async goPrevMonth() {
  516 |     await this.prevMonthArrow.click();
  517 |     await this.page.waitForTimeout(300);
  518 |   }
  519 | 
  520 |   /** Get current month/year from the calendar header */
  521 |   async getCurrentMonth(): Promise<string> {
  522 |     return (await this.monthHeader.textContent()) ?? "";
  523 |   }
  524 | 
  525 |   /** Close the "Slot Unavailable" popup */
  526 |   async closeUnavailPopup() {
  527 |     await this.page.evaluate(() => (window as any).siCloseUnavail());
  528 |   }
  529 | }
  530 | 
```