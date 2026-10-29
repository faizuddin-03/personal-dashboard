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
  - waiting for locator('td[data-date="2026-10-15"]')

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
          - row "3 Slot 0/6 4 Slot 0/6 5 Slot 0/6 6 Slot 0/6 7 Slot 1/6 8 9" [ref=e43]:
            - cell "3 Slot 0/6" [ref=e44] [cursor=pointer]:
              - text: "3"
              - generic [ref=e46]: Slot 0/6
            - cell "4 Slot 0/6" [ref=e47] [cursor=pointer]:
              - text: "4"
              - generic [ref=e49]: Slot 0/6
            - cell "5 Slot 0/6" [ref=e50] [cursor=pointer]:
              - text: "5"
              - generic [ref=e52]: Slot 0/6
            - cell "6 Slot 0/6" [ref=e53] [cursor=pointer]:
              - text: "6"
              - generic [ref=e55]: Slot 0/6
            - cell "7 Slot 1/6" [ref=e56] [cursor=pointer]:
              - text: "7"
              - generic [ref=e58]: Slot 1/6
            - cell "8" [ref=e59]
            - cell "9" [ref=e60]
          - row "10 Slot 0/6 11 Slot 0/6 12 Slot 0/6 13 Slot 0/6 14 Slot 0/6 15 16" [ref=e61]:
            - cell "10 Slot 0/6" [ref=e62] [cursor=pointer]:
              - text: "10"
              - generic [ref=e64]: Slot 0/6
            - cell "11 Slot 0/6" [ref=e65] [cursor=pointer]:
              - text: "11"
              - generic [ref=e67]: Slot 0/6
            - cell "12 Slot 0/6" [ref=e68] [cursor=pointer]:
              - text: "12"
              - generic [ref=e70]: Slot 0/6
            - cell "13 Slot 0/6" [ref=e71] [cursor=pointer]:
              - text: "13"
              - generic [ref=e73]: Slot 0/6
            - cell "14 Slot 0/6" [ref=e74] [cursor=pointer]:
              - text: "14"
              - generic [ref=e76]: Slot 0/6
            - cell "15" [ref=e77]
            - cell "16" [ref=e78]
          - row "17 Slot 0/6 18 Slot 0/6 19 Slot 0/6 20 Slot 0/6 21 Slot 1/6 22 23" [ref=e79]:
            - cell "17 Slot 0/6" [ref=e80] [cursor=pointer]:
              - text: "17"
              - generic [ref=e82]: Slot 0/6
            - cell "18 Slot 0/6" [ref=e83] [cursor=pointer]:
              - text: "18"
              - generic [ref=e85]: Slot 0/6
            - cell "19 Slot 0/6" [ref=e86] [cursor=pointer]:
              - text: "19"
              - generic [ref=e88]: Slot 0/6
            - cell "20 Slot 0/6" [ref=e89] [cursor=pointer]:
              - text: "20"
              - generic [ref=e91]: Slot 0/6
            - cell "21 Slot 1/6" [ref=e92] [cursor=pointer]:
              - text: "21"
              - generic [ref=e94]: Slot 1/6
            - cell "22" [ref=e95]
            - cell "23" [ref=e96]
          - row "24 Slot 1/6 25 Slot 3/6 26 Slot 1/6 27 Slot 0/6 28 Slot 0/6 29 30" [ref=e97]:
            - cell "24 Slot 1/6" [ref=e98] [cursor=pointer]:
              - text: "24"
              - generic [ref=e100]: Slot 1/6
            - cell "25 Slot 3/6" [ref=e101] [cursor=pointer]:
              - text: "25"
              - generic [ref=e103]: Slot 3/6
            - cell "26 Slot 1/6" [ref=e104] [cursor=pointer]:
              - text: "26"
              - generic [ref=e106]: Slot 1/6
            - cell "27 Slot 0/6" [ref=e107] [cursor=pointer]:
              - text: "27"
              - generic [ref=e109]: Slot 0/6
            - cell "28 Slot 0/6" [ref=e110] [cursor=pointer]:
              - text: "28"
              - generic [ref=e112]: Slot 0/6
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
        - generic [ref=e126]: Booking is optional — you may book some, all, or none now. Any unbooked installation can be booked or rescheduled any time before 15-08-2026.
        - generic [ref=e127]: Click a booked (orange) date to remove, or a new date to add.
        - generic [ref=e128]:
          - generic [ref=e129]: Booked 1 of 2 appointments.
          - button "Confirm Appointment" [ref=e131] [cursor=pointer]
  - generic [ref=e132]:
    - generic [ref=e133]:
      - button "HOME" [ref=e134] [cursor=pointer]
      - button "INSURANCE" [ref=e135] [cursor=pointer]
      - button "REPORTS" [ref=e136] [cursor=pointer]
      - button "SETTINGS" [ref=e137] [cursor=pointer]
      - button "USER GUIDE" [ref=e138] [cursor=pointer]
      - button "DOWNLOAD" [ref=e139] [cursor=pointer]
      - button "CONTACT US" [ref=e140] [cursor=pointer]
    - table [ref=e141]:
      - rowgroup [ref=e142]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e143]:
          - cell "Online Services - Service Hub" [ref=e144]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e145]:
            - list [ref=e146]:
              - listitem [ref=e147]:
                - img [ref=e148]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e149]: "|"
              - listitem [ref=e150]:
                - link "Logout" [ref=e151] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e153]
  - generic [ref=e154]:
    - generic [ref=e156]:
      - generic [ref=e157]:
        - link "Contact Us" [ref=e158] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e159]: "|"
        - link "Terms & Conditions" [ref=e160] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e161]: "|"
        - link "Privacy" [ref=e162] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e163]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e164]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e166]
```

# Test source

```ts
  1   | import { type Page, type Locator, expect } from "@playwright/test";
  2   | import { BasePage } from "./BasePage";
  3   | import { ENV } from "../utils/config";
  4   | 
  5   | /**
  6   |  * A single bookable date's capacity snapshot, at both the day level
  7   |  * (combined 6/day badge) and the per-session level (morning/afternoon,
  8   |  * read from the slot modal). `room` is the free capacity (max - booked).
  9   |  * Consumed by findDateMatching() so scenarios can express date conditions
  10  |  * declaratively.
  11  |  */
  12  | export interface DateSlotInfo {
  13  |   date: string; // ISO yyyy-mm-dd (the cell's data-date)
  14  |   dayUsed: number;
  15  |   dayTotal: number;
  16  |   dayRoom: number;
  17  |   morning: { booked: number; max: number; room: number };
  18  |   afternoon: { booked: number; max: number; room: number };
  19  | }
  20  | 
  21  | /**
  22  |  * Shared calendar + slot modal component (si-calendar grid).
  23  |  * Selectors derived from the actual eAuto slot.do / reschedule.do HTML+JS.
  24  |  */
  25  | export class SlotPickerComponent extends BasePage {
  26  |   // Calendar grid
  27  |   readonly calendar = this.page.locator("#si-grid");
  28  |   readonly monthHeader = this.page.locator("#si-mo");
  29  |   readonly nextMonthArrow = this.page.locator("#si-next");
  30  |   readonly prevMonthArrow = this.page.locator("#si-prev");
  31  | 
  32  |   // Modal overlay
  33  |   readonly modalOverlay = this.page.locator("#si-ovl");
  34  | 
  35  |   // Slot steppers inside modal — si-cnt0 = morning, si-cnt1 = afternoon
  36  |   readonly morningCount = this.page.locator("#si-cnt0");
  37  |   readonly afternoonCount = this.page.locator("#si-cnt1");
  38  |   readonly morningCapacity = this.page.locator("#si-cap0");
  39  |   readonly afternoonCapacity = this.page.locator("#si-cap1");
  40  |   readonly morningRemoveBtn = this.page.locator("#si-rowx0");
  41  |   readonly afternoonRemoveBtn = this.page.locator("#si-rowx1");
  42  | 
  43  |   // Footer — confirmed from real HTML: <div class="si-tally">Booked
  44  |   // <span id="si-alloc-count">1</span> of <span id="si-alloc-total">1</span></div>
  45  |   readonly allocCount = this.page.locator("#si-alloc-count");
  46  |   readonly allocTotal = this.page.locator("#si-alloc-total");
  47  | 
  48  |   // Confirm button — used after all slots are allocated
  49  |   readonly confirmBookingBtn = this.page.locator("button:has-text('Confirm'), .si-abtn:has-text('Confirm')").first();
  50  | 
  51  |   // Unavailable popup
  52  |   readonly unavailOverlay = this.page.locator("#si-uovl");
  53  | 
  54  |   constructor(page: Page) {
  55  |     super(page);
  56  |   }
  57  | 
  58  |   getDayCell(dateStr: string): Locator {
  59  |     return this.page.locator(`td[data-date="${dateStr}"]`);
  60  |   }
  61  | 
  62  |   /**
  63  |    * The calendar only renders the currently-displayed month's cells.
  64  |    * A fresh page load always starts back on the current month, so a date
  65  |    * found in a later month (after paging forward) won't exist in the DOM
  66  |    * until we page forward to it again. Call this before touching any
  67  |    * specific date.
  68  |    */
  69  |   async ensureMonthVisible(dateStr: string, maxMonthsAhead: number = ENV.calendar.monthsVisible - 1): Promise<void> {
  70  |     for (let m = 0; m <= maxMonthsAhead; m++) {
  71  |       if ((await this.getDayCell(dateStr).count()) > 0) return;
  72  |       if (!(await this.goNextMonth())) return;
  73  |     }
  74  |   }
  75  | 
  76  |   async isDayBookable(dateStr: string): Promise<boolean> {
  77  |     await this.ensureMonthVisible(dateStr);
  78  |     const cell = this.getDayCell(dateStr);
> 79  |     const classes = await cell.getAttribute("class") ?? "";
      |                                ^ TimeoutError: locator.getAttribute: Timeout 10000ms exceeded.
  80  |     return classes.includes("si-book") && !classes.includes("si-muted");
  81  |   }
  82  | 
  83  |   async isDayFullyBooked(dateStr: string): Promise<boolean> {
  84  |     await this.ensureMonthVisible(dateStr);
  85  |     const cell = this.getDayCell(dateStr);
  86  |     const classes = await cell.getAttribute("class") ?? "";
  87  |     return classes.includes("si-fullday");
  88  |   }
  89  | 
  90  |   /**
  91  |    * A date is "blocked" for the UCD portal when it is NOT selectable — either
  92  |    * greyed out (si-muted) or not rendered on the calendar at all (e.g. beyond
  93  |    * the current+next-month window). The inverse of isDayBookable().
  94  |    */
  95  |   async isDayBlocked(dateStr: string): Promise<boolean> {
  96  |     return !(await this.isDayBookable(dateStr));
  97  |   }
  98  | 
  99  |   /** Whether the date cell is rendered at all in the (navigable) calendar. */
  100 |   async isDayRendered(dateStr: string): Promise<boolean> {
  101 |     await this.ensureMonthVisible(dateStr);
  102 |     return (await this.getDayCell(dateStr).count()) > 0;
  103 |   }
  104 | 
  105 |   /** Whether the date shows a slot-availability badge ("Slot n/6"). */
  106 |   async hasSlotBadge(dateStr: string): Promise<boolean> {
  107 |     return (await this.getSlotBadge(dateStr)).trim().length > 0;
  108 |   }
  109 | 
  110 |   /** Returns "" if the date has no badge at all (e.g. weekends/out-of-range days) */
  111 |   async getSlotBadge(dateStr: string): Promise<string> {
  112 |     await this.ensureMonthVisible(dateStr);
  113 |     const cell = this.getDayCell(dateStr);
  114 |     const badge = cell.locator(".si-badge").first();
  115 |     if ((await badge.count()) === 0) return "";
  116 |     return (await badge.textContent().catch(() => "")) ?? "";
  117 |   }
  118 | 
  119 |   async getSlotCount(dateStr: string): Promise<{ used: number; total: number }> {
  120 |     const badge = await this.getSlotBadge(dateStr);
  121 |     const match = badge.match(/Slot\s+(\d+)\s*\/\s*(\d+)/);
  122 |     if (!match) return { used: 0, total: ENV.slotCapacity.perDay };
  123 |     return { used: Number(match[1]), total: Number(match[2]) };
  124 |   }
  125 | 
  126 |   async isDateBooked(dateStr: string): Promise<boolean> {
  127 |     await this.ensureMonthVisible(dateStr);
  128 |     const cell = this.getDayCell(dateStr);
  129 |     return await cell.locator(".si-bookbadge").count() > 0;
  130 |   }
  131 | 
  132 |   async isDateSelected(dateStr: string): Promise<boolean> {
  133 |     await this.ensureMonthVisible(dateStr);
  134 |     const cell = this.getDayCell(dateStr);
  135 |     return await cell.locator(".si-selbadge").count() > 0;
  136 |   }
  137 | 
  138 |   /** All bookable dates on the currently-visible calendar month (td.si-book) */
  139 |   async findBookableDates(): Promise<string[]> {
  140 |     const cells = await this.page.locator("td.si-book[data-date]").all();
  141 |     const dates: string[] = [];
  142 |     for (const cell of cells) {
  143 |       const date = await cell.getAttribute("data-date");
  144 |       if (date) dates.push(date);
  145 |     }
  146 |     return dates;
  147 |   }
  148 | 
  149 |   /**
  150 |    * First bookable date with zero units booked (clean slate for capacity
  151 |    * tests). Repeated test runs consume the pool of empty dates in the
  152 |    * current month, so this pages forward through future months until it
  153 |    * finds one, up to maxMonthsAhead.
  154 |    */
  155 |   async findEmptyBookableDate(maxMonthsAhead: number = ENV.calendar.monthsVisible - 1): Promise<string | null> {
  156 |     for (let m = 0; m <= maxMonthsAhead; m++) {
  157 |       for (const date of await this.findBookableDates()) {
  158 |         const { used } = await this.getSlotCount(date);
  159 |         if (used === 0) return date;
  160 |       }
  161 |       if (m >= maxMonthsAhead) break;
  162 |       if (!(await this.goNextMonth())) break;
  163 |     }
  164 |     return null;
  165 |   }
  166 | 
  167 |   /**
  168 |    * First bookable date regardless of existing bookings. Use this (plus
  169 |    * per-slot/per-day room checks) instead of findEmptyBookableDate() once
  170 |    * the shared staging calendar no longer has any completely untouched
  171 |    * dates left in the navigable window.
  172 |    */
  173 |   async findAnyBookableDate(maxMonthsAhead: number = ENV.calendar.monthsVisible - 1): Promise<string | null> {
  174 |     for (let m = 0; m <= maxMonthsAhead; m++) {
  175 |       const dates = await this.findBookableDates();
  176 |       if (dates.length > 0) return dates[0];
  177 |       if (m >= maxMonthsAhead) break;
  178 |       if (!(await this.goNextMonth())) break;
  179 |     }
```