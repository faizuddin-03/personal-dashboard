# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reschedule-handling.spec.ts >> Reschedule & Handling >> BO >> BO reschedule on same day different time slot and the next day
- Location: tests\service-hub\specs\reschedule-handling.spec.ts:341:9

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for getByText('Reschedule')

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e4]:
    - button "Download" [ref=e5] [cursor=pointer]
    - button "Apply eAuto" [ref=e6] [cursor=pointer]
  - generic [ref=e10]:
    - generic [ref=e11]:
      - img "eAuto" [ref=e14]
      - generic [ref=e17]:
        - generic [ref=e20]:
          - generic [ref=e21]: Announcement
          - generic [ref=e22]:
            - paragraph [ref=e23]: Dear UCD,
            - paragraph [ref=e24]: Please be informed that the JPJ receipt will be displayed and can be downloaded anytime within 24 hours after the transaction.
        - generic [ref=e28]:
          - img [ref=e29]
          - generic [ref=e30]: "Hotline: 03-27798899"
    - generic [ref=e34]:
      - heading "Login to eAuto" [level=3] [ref=e36]
      - form [ref=e37]:
        - generic [ref=e38]:
          - generic [ref=e39]: Username
          - textbox "Username" [active] [ref=e41]
        - generic [ref=e42]:
          - generic [ref=e43]: Password
          - textbox "Password" [ref=e45]
        - generic [ref=e48] [cursor=pointer]:
          - checkbox "Remember Password" [ref=e49]
          - text: Remember Password
        - button "Login" [ref=e50] [cursor=pointer]
  - generic [ref=e51]:
    - generic [ref=e53]:
      - generic [ref=e54]:
        - link "Contact Us" [ref=e55] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e56]: "|"
        - link "Terms & Conditions" [ref=e57] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e58]: "|"
        - link "Privacy" [ref=e59] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e60]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e61]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e63]
```

# Test source

```ts
  1   | import { type Page, type Locator, expect } from "@playwright/test";
  2   | import { SlotPickerComponent } from "../SlotPickerComponent";
  3   | import { PATHS } from "../../utils/config";
  4   | 
  5   | /**
  6   |  * BO Appointment Calendar page.
  7   |  * NOTE: BO selectors are best-guesses from SRD patterns.
  8   |  * These MUST be verified against the actual BO portal and updated.
  9   |  */
  10  | export class AppointmentCalendarPage extends SlotPickerComponent {
  11  |   readonly addAppointmentBtn = this.page.getByText("Add Appointment", { exact: false });
  12  |   readonly companyNameSelect = this.page.locator('select[name="companyName"], [class*="company"] select').first();
  13  |   readonly companyNameInput = this.page.locator('input[name="companyName"], input[placeholder*="Company"]').first();
  14  | 
  15  |   readonly markCompletedBtn = this.page.getByText("Completed", { exact: false });
  16  |   readonly markFailedBtn = this.page.getByText("Failed", { exact: false });
  17  |   readonly markCancelledBtn = this.page.getByText("Cancel", { exact: false });
  18  |   readonly rescheduleLink = this.page.getByText("Reschedule", { exact: false });
  19  | 
  20  |   readonly failedReasonSelect = this.page.locator('select[name="failedReason"]').first();
  21  | 
  22  |   constructor(page: Page) {
  23  |     super(page);
  24  |   }
  25  | 
  26  |   async navigate() {
  27  |     await this.goto(PATHS.boAppointmentCalendar);
  28  |   }
  29  | 
  30  |   async addAppointment(opts: {
  31  |     date: string;
  32  |     slot: number;
  33  |     companyName: string;
  34  |     units?: number;
  35  |   }) {
  36  |     const { date, slot, companyName, units = 1 } = opts;
  37  | 
  38  |     await this.openSlotModal(date);
  39  | 
  40  |     try {
  41  |       await this.companyNameSelect.selectOption({ label: companyName });
  42  |     } catch {
  43  |       await this.companyNameInput.fill(companyName);
  44  |       await this.page.getByText(companyName, { exact: false }).first().click();
  45  |     }
  46  | 
  47  |     await this.incrementSlot(slot, units);
  48  |     await this.saveSlotChanges();
  49  |   }
  50  | 
  51  |   async rescheduleAppointment(opts: {
  52  |     oldDate: string;
  53  |     newDate: string;
  54  |     slot: number;
  55  |     units?: number;
  56  |   }) {
> 57  |     await this.rescheduleLink.click();
      |                               ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  58  |     await this.waitForNav();
  59  | 
  60  |     const { oldDate, newDate, slot, units = 1 } = opts;
  61  |     await this.openSlotModal(oldDate);
  62  |     // Remove from whichever slot has the booking
  63  |     for (let s = 0; s < 2; s++) {
  64  |       const countEl = s === 0 ? this.morningCount : this.afternoonCount;
  65  |       const val = Number(await countEl.inputValue()) || 0;
  66  |       if (val > 0) await this.removeSlot(s);
  67  |     }
  68  |     await this.saveSlotChanges();
  69  | 
  70  |     await this.openSlotModal(newDate);
  71  |     await this.incrementSlot(slot, units);
  72  |     await this.saveSlotChanges();
  73  | 
  74  |     await this.confirmAppointment();
  75  |   }
  76  | 
  77  |   async markAppointmentFailed(reason: string) {
  78  |     await this.markFailedBtn.click();
  79  |     await this.failedReasonSelect.selectOption(reason);
  80  |     await this.page.locator(".confirm-dialog-btn").click();
  81  |     await this.waitForNav();
  82  |   }
  83  | 
  84  |   async markAppointmentCancelled() {
  85  |     await this.markCancelledBtn.click();
  86  |     await this.page.locator(".confirm-dialog-btn").click();
  87  |     await this.waitForNav();
  88  |   }
  89  | 
  90  |   async markAppointmentCompleted() {
  91  |     await this.markCompletedBtn.click();
  92  |     await this.page.locator(".confirm-dialog-btn").click();
  93  |     await this.waitForNav();
  94  |   }
  95  | 
  96  |   async isRescheduleAvailable(): Promise<boolean> {
  97  |     return await this.rescheduleLink.count() > 0;
  98  |   }
  99  | 
  100 |   async getSlotCapacityIndicator(date: string, slot: number): Promise<string> {
  101 |     const cell = this.getDayCell(date);
  102 |     const label = slot === 0 ? "Morning" : "Afternoon";
  103 |     const indicator = cell.getByText(new RegExp(label, "i")).first();
  104 |     return (await indicator.textContent())?.trim() ?? "";
  105 |   }
  106 | }
  107 | 
```