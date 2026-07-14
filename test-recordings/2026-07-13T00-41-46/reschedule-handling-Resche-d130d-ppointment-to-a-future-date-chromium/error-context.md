# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reschedule-handling.spec.ts >> Reschedule & Handling >> UCD >> Reschedule on the day of the initial appointment to a future date
- Location: tests\service-hub\specs\reschedule-handling.spec.ts:18:9

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('[data-date="2026-07-15"], td[data-date="2026-07-15"]')

```

# Page snapshot

```yaml
- generic [ref=e1]:
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
          - generic [ref=e17]: Software Installation
          - generic [ref=e18]: Pay first, then pick your installation appointment
        - generic [ref=e19]: RM 54.00 / request
      - generic [ref=e20]:
        - generic [ref=e21]:
          - generic [ref=e22]: "Number of installations:"
          - generic [ref=e24]:
            - button "−" [ref=e25] [cursor=pointer]
            - textbox [ref=e26]: "1"
            - button "+" [ref=e27] [cursor=pointer]
        - generic [ref=e29]:
          - generic [ref=e30]: Payment Summary
          - table [ref=e31]:
            - rowgroup [ref=e32]:
              - row "Description RM" [ref=e33]:
                - columnheader "Description" [ref=e34]
                - columnheader "RM" [ref=e35]
            - rowgroup [ref=e36]:
              - 'row "Software Installation Fee: 50.00" [ref=e37]':
                - cell "Software Installation Fee:" [ref=e38]
                - cell "50.00" [ref=e39]
              - 'row "Service Tax 8%: 4.00" [ref=e40]':
                - cell "Service Tax 8%:" [ref=e41]
                - cell "4.00" [ref=e42]
              - 'row "Total Amount Payable (inclusive of Service Tax 8%) : 54.00" [ref=e43]':
                - cell "Total Amount Payable (inclusive of Service Tax 8%) :" [ref=e44]
                - cell "54.00" [ref=e45]
      - button "Make Payment" [ref=e47]
  - generic [ref=e48]:
    - generic [ref=e49]:
      - button "HOME" [ref=e50] [cursor=pointer]
      - button "INSURANCE" [ref=e51] [cursor=pointer]
      - button "REPORTS" [ref=e52] [cursor=pointer]
      - button "SETTINGS" [ref=e53] [cursor=pointer]
      - button "USER GUIDE" [ref=e54] [cursor=pointer]
      - button "DOWNLOAD" [ref=e55] [cursor=pointer]
      - button "CONTACT US" [ref=e56] [cursor=pointer]
    - table [ref=e57]:
      - rowgroup [ref=e58]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e59]:
          - cell "Online Services - Service Hub" [ref=e60]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e61]:
            - list [ref=e62]:
              - listitem [ref=e63]:
                - img [ref=e64]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e65]: "|"
              - listitem [ref=e66]:
                - link "Logout" [ref=e67] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e69]
  - generic [ref=e70]:
    - generic [ref=e72]:
      - generic [ref=e73]:
        - link "Contact Us" [ref=e74] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e75]: "|"
        - link "Terms & Conditions" [ref=e76] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e77]: "|"
        - link "Privacy" [ref=e78] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e79]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e80]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e82]
  - dialog "Payment" [active] [ref=e84]:
    - generic [ref=e85]:
      - generic [ref=e86]: Payment
      - button "close" [ref=e87] [cursor=pointer]:
        - generic [ref=e88]: close
    - generic [ref=e89]: Sure to submit this payment?
    - generic [ref=e90]:
      - button "No" [ref=e91] [cursor=pointer]
      - button "Yes" [ref=e92] [cursor=pointer]
```

# Test source

```ts
  1   | import { type Page, type Locator, expect } from "@playwright/test";
  2   | import { BasePage } from "./BasePage";
  3   | import { ENV } from "../utils/config";
  4   | 
  5   | /**
  6   |  * Shared calendar + slot modal component.
  7   |  * Used by: Software Installation slot picker, Biometric Purchase scheduling,
  8   |  * Reschedule page, and BO Appointment Calendar.
  9   |  *
  10  |  * NOTE: Calendar/modal selectors below are best-guesses based on the site's
  11  |  * naming conventions (si- prefix pattern). Verify with actual page HTML and
  12  |  * update as needed — run in headed mode and inspect if tests fail here.
  13  |  */
  14  | export class SlotPickerComponent extends BasePage {
  15  |   // Calendar elements — try multiple selector strategies
  16  |   readonly calendar = this.page.locator(".si-calendar, .calendar, [class*='calendar']").first();
  17  |   readonly nextMonthArrow = this.page.locator(".si-cal-next, .cal-next, [class*='next']").first();
  18  |   readonly prevMonthArrow = this.page.locator(".si-cal-prev, .cal-prev, [class*='prev']").first();
  19  |   readonly confirmAppointmentBtn = this.page.locator("button:has-text('Confirm'), .si-abtn:has-text('Confirm')");
  20  | 
  21  |   // Modal elements
  22  |   readonly appointmentModal = this.page.locator(".modal, .si-modal, [class*='modal']").filter({ hasText: /appointment|slot|installation/i });
  23  |   readonly morningSlot = this.page.locator("text=10:00").or(this.page.getByText("10:00am - 12:00pm", { exact: false })).first();
  24  |   readonly afternoonSlot = this.page.locator("text=2:00").or(this.page.getByText("2:00pm - 4:00pm", { exact: false })).first();
  25  |   readonly saveChangesBtn = this.page.locator("button:has-text('Save'), .si-abtn:has-text('Save')").first();
  26  | 
  27  |   constructor(page: Page) {
  28  |     super(page);
  29  |   }
  30  | 
  31  |   getDayCell(dateStr: string): Locator {
  32  |     return this.page.locator(`[data-date="${dateStr}"], td[data-date="${dateStr}"]`);
  33  |   }
  34  | 
  35  |   async isDayBookable(dateStr: string): Promise<boolean> {
  36  |     const cell = this.getDayCell(dateStr);
  37  |     const classes = await cell.getAttribute("class") ?? "";
  38  |     return !classes.includes("muted") && !classes.includes("disabled") && !classes.includes("past");
  39  |   }
  40  | 
  41  |   async getSlotBadge(dateStr: string): Promise<string> {
  42  |     const cell = this.getDayCell(dateStr);
  43  |     const badge = cell.locator("[class*='badge'], [class*='slot'], small, span").first();
  44  |     return (await badge.textContent()) ?? "";
  45  |   }
  46  | 
  47  |   async getSlotCount(dateStr: string): Promise<{ used: number; total: number }> {
  48  |     const badge = await this.getSlotBadge(dateStr);
  49  |     const match = badge.match(/(\d+)\s*\/\s*(\d+)/);
  50  |     if (!match) return { used: 0, total: ENV.slotCapacity.perDay };
  51  |     return { used: Number(match[1]), total: Number(match[2]) };
  52  |   }
  53  | 
  54  |   async isDateBooked(dateStr: string): Promise<boolean> {
  55  |     const cell = this.getDayCell(dateStr);
  56  |     const text = (await cell.textContent()) ?? "";
  57  |     const classes = await cell.getAttribute("class") ?? "";
  58  |     return text.toLowerCase().includes("booked") || classes.includes("booked");
  59  |   }
  60  | 
  61  |   async isDateSelected(dateStr: string): Promise<boolean> {
  62  |     const cell = this.getDayCell(dateStr);
  63  |     const text = (await cell.textContent()) ?? "";
  64  |     const classes = await cell.getAttribute("class") ?? "";
  65  |     return text.toLowerCase().includes("selected") || classes.includes("selected");
  66  |   }
  67  | 
  68  |   async openSlotModal(dateStr: string) {
  69  |     const cell = this.getDayCell(dateStr);
> 70  |     await cell.click();
      |                ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  71  |     // Wait for any modal to appear
  72  |     await this.page.locator(".modal, .si-modal, [class*='modal']").first().waitFor({ state: "visible", timeout: 5000 });
  73  |   }
  74  | 
  75  |   async getModalSlotBooked(slotLocator: Locator): Promise<{ booked: number; max: number }> {
  76  |     const parent = slotLocator.locator("xpath=ancestor::*[position()<=3]");
  77  |     const text = (await parent.textContent()) ?? "";
  78  |     const match = text.match(/(\d+)\s*(?:of|\/)\s*(\d+)/i);
  79  |     if (!match) return { booked: 0, max: ENV.slotCapacity.perSlot };
  80  |     return { booked: Number(match[1]), max: Number(match[2]) };
  81  |   }
  82  | 
  83  |   async isSlotFullyBooked(slotLocator: Locator): Promise<boolean> {
  84  |     const parent = slotLocator.locator("xpath=ancestor::*[position()<=3]");
  85  |     const text = (await parent.textContent()) ?? "";
  86  |     return text.toLowerCase().includes("full");
  87  |   }
  88  | 
  89  |   async incrementSlot(slotLocator: Locator, times: number = 1) {
  90  |     const container = slotLocator.locator("xpath=ancestor::div[1]");
  91  |     const plusBtn = container.locator("button:has-text('+')").first();
  92  |     for (let i = 0; i < times; i++) {
  93  |       await plusBtn.click();
  94  |     }
  95  |   }
  96  | 
  97  |   async decrementSlot(slotLocator: Locator, times: number = 1) {
  98  |     const container = slotLocator.locator("xpath=ancestor::div[1]");
  99  |     const minusBtn = container.locator("button:has-text('−'), button:has-text('-')").first();
  100 |     for (let i = 0; i < times; i++) {
  101 |       await minusBtn.click();
  102 |     }
  103 |   }
  104 | 
  105 |   async removeBooking() {
  106 |     const removeBtn = this.page.locator("button:has-text('Remove'), .si-abtn:has-text('Remove'), a:has-text('Remove')").first();
  107 |     await removeBtn.click();
  108 |   }
  109 | 
  110 |   async saveSlotChanges() {
  111 |     await this.saveChangesBtn.click();
  112 |     await this.page.locator(".modal, .si-modal, [class*='modal']").first().waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  113 |   }
  114 | 
  115 |   async getRemainingToAllocate(): Promise<number> {
  116 |     const footer = this.page.getByText(/remaining/i).first();
  117 |     const text = (await footer.textContent()) ?? "";
  118 |     const match = text.match(/(\d+)/);
  119 |     return match ? Number(match[1]) : 0;
  120 |   }
  121 | 
  122 |   async getBookedCount(): Promise<{ booked: number; total: number }> {
  123 |     const footer = this.page.getByText(/booked/i).first();
  124 |     const text = (await footer.textContent()) ?? "";
  125 |     const match = text.match(/(\d+)\s*(?:of|\/)\s*(\d+)/i);
  126 |     if (!match) return { booked: 0, total: 0 };
  127 |     return { booked: Number(match[1]), total: Number(match[2]) };
  128 |   }
  129 | 
  130 |   async confirmAppointment() {
  131 |     await this.confirmAppointmentBtn.scrollIntoViewIfNeeded();
  132 |     await this.confirmAppointmentBtn.click();
  133 |     await this.waitForNav();
  134 |   }
  135 | 
  136 |   async navigateToMonth(targetYear: number, targetMonth: number) {
  137 |     const maxAttempts = 12;
  138 |     for (let i = 0; i < maxAttempts; i++) {
  139 |       const header = await this.calendar.locator("th, [class*='month'], [class*='header']").first().textContent() ?? "";
  140 |       const currentDate = new Date(header.trim());
  141 |       if (!isNaN(currentDate.getTime())) {
  142 |         if (currentDate.getFullYear() === targetYear && currentDate.getMonth() + 1 === targetMonth) break;
  143 |         if (currentDate < new Date(targetYear, targetMonth - 1)) {
  144 |           await this.nextMonthArrow.click();
  145 |         } else {
  146 |           await this.prevMonthArrow.click();
  147 |         }
  148 |       } else {
  149 |         await this.nextMonthArrow.click();
  150 |       }
  151 |       await this.page.waitForTimeout(500);
  152 |     }
  153 |   }
  154 | }
  155 | 
```