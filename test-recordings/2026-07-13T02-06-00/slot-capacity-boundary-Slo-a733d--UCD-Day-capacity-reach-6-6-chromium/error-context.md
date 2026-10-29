# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Day capacity reach 6/6
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:65:9

# Error details

```
TimeoutError: locator.textContent: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('td[data-date="2026-07-21"]').locator('.si-badge').first()

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
            - row "1 21-07-2026 2:00pm - 4:00pm 1" [ref=e28]:
              - cell "1" [ref=e29]
              - cell "21-07-2026" [ref=e30]
              - cell "2:00pm - 4:00pm" [ref=e31]
              - cell "1" [ref=e32]
      - link "Done" [ref=e33] [cursor=pointer]:
        - /url: /uat1/view/ucd/service-hub/view.do
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
  1   | import { type Page, type Locator, expect } from "@playwright/test";
  2   | import { BasePage } from "./BasePage";
  3   | import { ENV } from "../utils/config";
  4   | 
  5   | /**
  6   |  * Shared calendar + slot modal component (si-calendar grid).
  7   |  * Selectors derived from the actual eAuto slot.do / reschedule.do HTML+JS.
  8   |  */
  9   | export class SlotPickerComponent extends BasePage {
  10  |   // Calendar grid
  11  |   readonly calendar = this.page.locator("#si-grid");
  12  |   readonly monthHeader = this.page.locator("#si-mo");
  13  |   readonly nextMonthArrow = this.page.locator("#si-next");
  14  |   readonly prevMonthArrow = this.page.locator("#si-prev");
  15  | 
  16  |   // Modal overlay
  17  |   readonly modalOverlay = this.page.locator("#si-ovl");
  18  | 
  19  |   // Slot steppers inside modal — si-cnt0 = morning, si-cnt1 = afternoon
  20  |   readonly morningCount = this.page.locator("#si-cnt0");
  21  |   readonly afternoonCount = this.page.locator("#si-cnt1");
  22  |   readonly morningCapacity = this.page.locator("#si-cap0");
  23  |   readonly afternoonCapacity = this.page.locator("#si-cap1");
  24  |   readonly morningRemoveBtn = this.page.locator("#si-rowx0");
  25  |   readonly afternoonRemoveBtn = this.page.locator("#si-rowx1");
  26  | 
  27  |   // Footer
  28  |   readonly allocCount = this.page.locator("#si-alloc-count");
  29  |   readonly remainingCount = this.page.locator("#si-remain-n");
  30  | 
  31  |   // Confirm button — used after all slots are allocated
  32  |   readonly confirmBookingBtn = this.page.locator("button:has-text('Confirm'), .si-abtn:has-text('Confirm')").first();
  33  | 
  34  |   // Unavailable popup
  35  |   readonly unavailOverlay = this.page.locator("#si-uovl");
  36  | 
  37  |   constructor(page: Page) {
  38  |     super(page);
  39  |   }
  40  | 
  41  |   getDayCell(dateStr: string): Locator {
  42  |     return this.page.locator(`td[data-date="${dateStr}"]`);
  43  |   }
  44  | 
  45  |   async isDayBookable(dateStr: string): Promise<boolean> {
  46  |     const cell = this.getDayCell(dateStr);
  47  |     const classes = await cell.getAttribute("class") ?? "";
  48  |     return classes.includes("si-book") && !classes.includes("si-muted");
  49  |   }
  50  | 
  51  |   async isDayFullyBooked(dateStr: string): Promise<boolean> {
  52  |     const cell = this.getDayCell(dateStr);
  53  |     const classes = await cell.getAttribute("class") ?? "";
  54  |     return classes.includes("si-fullday");
  55  |   }
  56  | 
  57  |   async getSlotBadge(dateStr: string): Promise<string> {
  58  |     const cell = this.getDayCell(dateStr);
  59  |     const badge = cell.locator(".si-badge").first();
> 60  |     return (await badge.textContent()) ?? "";
      |                         ^ TimeoutError: locator.textContent: Timeout 10000ms exceeded.
  61  |   }
  62  | 
  63  |   async getSlotCount(dateStr: string): Promise<{ used: number; total: number }> {
  64  |     const badge = await this.getSlotBadge(dateStr);
  65  |     const match = badge.match(/Slot\s+(\d+)\s*\/\s*(\d+)/);
  66  |     if (!match) return { used: 0, total: ENV.slotCapacity.perDay };
  67  |     return { used: Number(match[1]), total: Number(match[2]) };
  68  |   }
  69  | 
  70  |   async isDateBooked(dateStr: string): Promise<boolean> {
  71  |     const cell = this.getDayCell(dateStr);
  72  |     return await cell.locator(".si-bookbadge").count() > 0;
  73  |   }
  74  | 
  75  |   async isDateSelected(dateStr: string): Promise<boolean> {
  76  |     const cell = this.getDayCell(dateStr);
  77  |     return await cell.locator(".si-selbadge").count() > 0;
  78  |   }
  79  | 
  80  |   /** Click a date cell to open the slot dialog */
  81  |   async openSlotModal(dateStr: string) {
  82  |     const cell = this.getDayCell(dateStr);
  83  |     await cell.click();
  84  |     await this.modalOverlay.waitFor({ state: "visible", timeout: 5000 });
  85  |   }
  86  | 
  87  |   /** Get booked count for a slot from the modal capacity text (e.g. "2 of 3 booked") */
  88  |   async getModalSlotBooked(slotIndex: number): Promise<{ booked: number; max: number }> {
  89  |     const capEl = slotIndex === 0 ? this.morningCapacity : this.afternoonCapacity;
  90  |     const text = (await capEl.textContent()) ?? "";
  91  |     if (text.toLowerCase().includes("fully booked")) return { booked: ENV.slotCapacity.perSlot, max: ENV.slotCapacity.perSlot };
  92  |     const match = text.match(/(\d+)\s*of\s*(\d+)/);
  93  |     if (!match) return { booked: 0, max: ENV.slotCapacity.perSlot };
  94  |     return { booked: Number(match[1]), max: Number(match[2]) };
  95  |   }
  96  | 
  97  |   async isSlotFullyBooked(slotIndex: number): Promise<boolean> {
  98  |     const capEl = slotIndex === 0 ? this.morningCapacity : this.afternoonCapacity;
  99  |     const text = (await capEl.textContent()) ?? "";
  100 |     return text.toLowerCase().includes("fully booked");
  101 |   }
  102 | 
  103 |   /** Increment a slot's stepper via the JS function siStep(slot, +1) */
  104 |   async incrementSlot(slotIndex: number, times: number = 1) {
  105 |     for (let i = 0; i < times; i++) {
  106 |       await this.page.evaluate((s) => (window as any).siStep(s, 1), slotIndex);
  107 |     }
  108 |   }
  109 | 
  110 |   /** Decrement a slot's stepper via the JS function siStep(slot, -1) */
  111 |   async decrementSlot(slotIndex: number, times: number = 1) {
  112 |     for (let i = 0; i < times; i++) {
  113 |       await this.page.evaluate((s) => (window as any).siStep(s, -1), slotIndex);
  114 |     }
  115 |   }
  116 | 
  117 |   /** Remove all units from a slot via the JS function siRowRemove(slot) */
  118 |   async removeSlot(slotIndex: number) {
  119 |     await this.page.evaluate((s) => (window as any).siRowRemove(s), slotIndex);
  120 |   }
  121 | 
  122 |   /** Save changes in the slot dialog via siSaveDate() */
  123 |   async saveSlotChanges() {
  124 |     await this.page.evaluate(() => (window as any).siSaveDate());
  125 |     await this.modalOverlay.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  126 |   }
  127 | 
  128 |   /** Close the slot dialog without saving */
  129 |   async closeSlotModal() {
  130 |     await this.page.evaluate(() => (window as any).siCloseModal());
  131 |   }
  132 | 
  133 |   async getRemainingToAllocate(): Promise<number> {
  134 |     const text = (await this.remainingCount.textContent()) ?? "0";
  135 |     return Number(text) || 0;
  136 |   }
  137 | 
  138 |   async getAllocatedCount(): Promise<number> {
  139 |     const text = (await this.allocCount.textContent()) ?? "0";
  140 |     return Number(text) || 0;
  141 |   }
  142 | 
  143 |   /** Click "Confirm Appointment" / "Confirm booking" via siConfirmBooking() */
  144 |   async confirmAppointment() {
  145 |     await this.page.evaluate(() => (window as any).siConfirmBooking());
  146 |     await this.waitForNav();
  147 |   }
  148 | 
  149 |   /** Navigate calendar to next/prev month */
  150 |   async goNextMonth() {
  151 |     await this.nextMonthArrow.click();
  152 |     await this.page.waitForTimeout(300);
  153 |   }
  154 | 
  155 |   async goPrevMonth() {
  156 |     await this.prevMonthArrow.click();
  157 |     await this.page.waitForTimeout(300);
  158 |   }
  159 | 
  160 |   /** Get current month/year from the calendar header */
```