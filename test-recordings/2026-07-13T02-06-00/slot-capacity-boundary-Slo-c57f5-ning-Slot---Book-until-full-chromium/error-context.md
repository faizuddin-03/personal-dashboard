# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Morning Slot - Book until full
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:17:9

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
          - generic [ref=e17]: Software Installation — Select Appointment(s)
          - generic [ref=e18]: Payment received. Allocate your 1 installation to a date and time slot (up to 3 per slot).
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
          - row "20 Slot 1/6 21 Slot 3/6 22 Slot 2/6 23 Slot 6/6 24 Slot 3/6 25 26" [ref=e68]:
            - cell "20 Slot 1/6" [ref=e69] [cursor=pointer]:
              - text: "20"
              - generic [ref=e71]: Slot 1/6
            - cell "21 Slot 3/6" [ref=e72] [cursor=pointer]:
              - text: "21"
              - generic [ref=e74]: Slot 3/6
            - cell "22 Slot 2/6" [ref=e75] [cursor=pointer]:
              - text: "22"
              - generic [ref=e77]: Slot 2/6
            - cell "23 Slot 6/6" [ref=e78]:
              - text: "23"
              - generic [ref=e80]: Slot 6/6
            - cell "24 Slot 3/6" [ref=e81] [cursor=pointer]:
              - text: "24"
              - generic [ref=e83]: Slot 3/6
            - cell "25" [ref=e84]
            - cell "26" [ref=e85]
          - row "27 Slot 0/6 28 Slot 4/6 29 Slot 2/6 30 Slot 1/6 31 Slot 0/6 1 2" [ref=e86]:
            - cell "27 Slot 0/6" [ref=e87] [cursor=pointer]:
              - text: "27"
              - generic [ref=e89]: Slot 0/6
            - cell "28 Slot 4/6" [ref=e90] [cursor=pointer]:
              - text: "28"
              - generic [ref=e92]: Slot 4/6
            - cell "29 Slot 2/6" [ref=e93] [cursor=pointer]:
              - text: "29"
              - generic [ref=e95]: Slot 2/6
            - cell "30 Slot 1/6" [ref=e96] [cursor=pointer]:
              - text: "30"
              - generic [ref=e98]: Slot 1/6
            - cell "31 Slot 0/6" [ref=e99] [cursor=pointer]:
              - text: "31"
              - generic [ref=e101]: Slot 0/6
            - cell "1" [ref=e102]
            - cell "2" [ref=e103]
      - generic [ref=e104]:
        - generic [ref=e105]: Booked 0 of 1
        - generic [ref=e106]: Click a bookable date above to allocate an installation.
        - button "Confirm Appointment" [ref=e108] [cursor=pointer]
  - generic [ref=e109]:
    - generic [ref=e110]:
      - button "HOME" [ref=e111] [cursor=pointer]
      - button "INSURANCE" [ref=e112] [cursor=pointer]
      - button "REPORTS" [ref=e113] [cursor=pointer]
      - button "SETTINGS" [ref=e114] [cursor=pointer]
      - button "USER GUIDE" [ref=e115] [cursor=pointer]
      - button "DOWNLOAD" [ref=e116] [cursor=pointer]
      - button "CONTACT US" [ref=e117] [cursor=pointer]
    - table [ref=e118]:
      - rowgroup [ref=e119]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e120]:
          - cell "Online Services - Service Hub" [ref=e121]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e122]:
            - list [ref=e123]:
              - listitem [ref=e124]:
                - img [ref=e125]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e126]: "|"
              - listitem [ref=e127]:
                - link "Logout" [ref=e128] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e130]
  - generic [ref=e131]:
    - generic [ref=e133]:
      - generic [ref=e134]:
        - link "Contact Us" [ref=e135] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e136]: "|"
        - link "Terms & Conditions" [ref=e137] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e138]: "|"
        - link "Privacy" [ref=e139] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e140]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e141]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e143]
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
  60  |     return (await badge.textContent()) ?? "";
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
> 84  |     await this.modalOverlay.waitFor({ state: "visible", timeout: 5000 });
      |                             ^ TimeoutError: locator.waitFor: Timeout 5000ms exceeded.
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
  161 |   async getCurrentMonth(): Promise<string> {
  162 |     return (await this.monthHeader.textContent()) ?? "";
  163 |   }
  164 | 
  165 |   /** Close the "Slot Unavailable" popup */
  166 |   async closeUnavailPopup() {
  167 |     await this.page.evaluate(() => (window as any).siCloseUnavail());
  168 |   }
  169 | }
  170 | 
```