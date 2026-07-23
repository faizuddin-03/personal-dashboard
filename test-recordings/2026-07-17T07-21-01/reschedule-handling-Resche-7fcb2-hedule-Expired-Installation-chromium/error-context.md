# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reschedule-handling.spec.ts >> Reschedule & Handling >> UCD >> Reschedule Expired Installation
- Location: tests\service-hub\specs\reschedule-handling.spec.ts:278:9

# Error details

```
TimeoutError: locator.selectOption: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('select[name="status"]').first()
    - locator resolved to <select id="status" name="status" class="select">…</select>
  - attempting select option action
    2 × waiting for element to be visible and enabled
      - did not find some options
    - retrying select option action
    - waiting 20ms
    2 × waiting for element to be visible and enabled
      - did not find some options
    - retrying select option action
      - waiting 100ms
    19 × waiting for element to be visible and enabled
       - did not find some options
     - retrying select option action
       - waiting 500ms

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
      - generic [ref=e9]: Service Request Listing
    - generic [ref=e11]:
      - heading "Search & Filter" [level=6] [ref=e13]
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]:
            - generic [ref=e17]:
              - generic [ref=e19]: "Reference No :"
              - textbox [ref=e20]
            - generic [ref=e21]:
              - generic [ref=e23]: "Service Type :"
              - combobox [ref=e25] [cursor=pointer]:
                - option "All" [selected]
                - option "Biometric Device Purchase"
                - option "Software Installation"
            - generic [ref=e26]:
              - generic [ref=e28]: "Date Requested :"
              - generic [ref=e29]:
                - generic [ref=e30]:
                  - textbox "Date (From)" [ref=e31]
                  - img
                - generic [ref=e32]:
                  - textbox "Date (To)" [ref=e33]
                  - img
          - generic [ref=e35]:
            - generic [ref=e36]:
              - generic [ref=e38]: "Status :"
              - combobox [ref=e40] [cursor=pointer]:
                - option "All" [selected]
                - option "-"
                - option "Pending"
                - option "Completed"
                - option "Failed"
                - option "Cancelled"
                - option "Expired"
            - generic [ref=e41]:
              - generic [ref=e43]: "Payment Date :"
              - generic [ref=e44]:
                - generic [ref=e45]:
                  - textbox "Date (From)" [ref=e46]
                  - img
                - generic [ref=e47]:
                  - textbox "Date (To)" [ref=e48]
                  - img
        - generic [ref=e49]:
          - button "Search Now" [ref=e50]
          - button "Reset" [ref=e51]
    - heading "Service Request Listing" [level=1] [ref=e53]
    - generic [ref=e54]:
      - img [ref=e56]
      - heading "Please apply search to show the record." [level=6] [ref=e57]
  - generic [ref=e58]:
    - generic [ref=e59]:
      - button "HOME" [ref=e60] [cursor=pointer]
      - button "INSURANCE" [ref=e61] [cursor=pointer]
      - button "REPORTS" [ref=e62] [cursor=pointer]
      - button "SETTINGS" [ref=e63] [cursor=pointer]
      - button "USER GUIDE" [ref=e64] [cursor=pointer]
      - button "DOWNLOAD" [ref=e65] [cursor=pointer]
      - button "CONTACT US" [ref=e66] [cursor=pointer]
    - table [ref=e67]:
      - rowgroup [ref=e68]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e69]:
          - cell "Online Services - Service Hub" [ref=e70]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e71]:
            - list [ref=e72]:
              - listitem [ref=e73]:
                - img [ref=e74]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e75]: "|"
              - listitem [ref=e76]:
                - link "Logout" [ref=e77] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e79]
  - generic [ref=e80]:
    - generic [ref=e82]:
      - generic [ref=e83]:
        - link "Contact Us" [ref=e84] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e85]: "|"
        - link "Terms & Conditions" [ref=e86] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e87]: "|"
        - link "Privacy" [ref=e88] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e89]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e90]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e92]
```

# Test source

```ts
  1   | import { type Page, type Locator, expect } from "@playwright/test";
  2   | import { BasePage } from "./BasePage";
  3   | import { PATHS } from "../utils/config";
  4   | 
  5   | export type ServiceType = "ALL" | "BIOMETRIC_PURCHASE" | "SOFTWARE_INSTALLATION" | "CHANGE_MAIN_USER";
  6   | // Verified live against the real Status dropdown: All / "-" (NEW) / Pending /
  7   | // Completed / Failed / Cancelled / Expired. No "Approved" value exists.
  8   | export type TxStatus = "ALL" | "NEW" | "PENDING" | "COMPLETED" | "FAILED" | "CANCELLED" | "EXPIRED";
  9   | 
  10  | /**
  11  |  * eAuto UCD Portal > Service Hub > Service Request Listing (SRD 2.3.2.2).
  12  |  *
  13  |  * Listing columns (0-indexed):
  14  |  *   0 #  | 1 Reference No | 2 Service Type | 3 Date Requested |
  15  |  *   4 Payment | 5 Tx Status | 6 e-Invoice Status | 7 Remarks | 8 Action
  16  |  */
  17  | export class ServiceRequestListingPage extends BasePage {
  18  |   // Column index map — kept as a single source of truth for the getters.
  19  |   static readonly COL = {
  20  |     num: 0,
  21  |     referenceNo: 1,
  22  |     serviceType: 2,
  23  |     dateRequested: 3,
  24  |     payment: 4,
  25  |     txStatus: 5,
  26  |     eInvoiceStatus: 6,
  27  |     remarks: 7,
  28  |     action: 8,
  29  |   } as const;
  30  | 
  31  |   // Filter panel (SRD 2.3.2.2 #1)
  32  |   readonly referenceNoInput = this.page.locator('input[name="referenceNo"], input[placeholder*="Reference"]').first();
  33  |   readonly serviceTypeSelect = this.page.locator('select[name="serviceType"]').first();
  34  |   readonly statusSelect = this.page.locator('select[name="status"]').first();
  35  |   readonly dateRequestedFromInput = this.page.locator('input[name="dateRequestedFrom"]').first();
  36  |   readonly dateRequestedToInput = this.page.locator('input[name="dateRequestedTo"]').first();
  37  |   readonly paymentDateFromInput = this.page.locator('input[name="paymentDateFrom"]').first();
  38  |   readonly paymentDateToInput = this.page.locator('input[name="paymentDateTo"]').first();
  39  |   readonly searchBtn = this.page.getByText("Search Now", { exact: false });
  40  |   readonly resetBtn = this.page.getByText("Reset", { exact: false });
  41  | 
  42  |   // Results table
  43  |   readonly resultsTable = this.page.locator("table").first();
  44  | 
  45  |   constructor(page: Page) {
  46  |     super(page);
  47  |   }
  48  | 
  49  |   async navigate() {
  50  |     await this.goto(PATHS.listing);
  51  |   }
  52  | 
  53  |   async searchByReferenceNo(refNo: string) {
  54  |     await this.referenceNoInput.fill(refNo);
  55  |     await this.searchBtn.click();
  56  |     await this.waitForNav();
  57  |   }
  58  | 
  59  |   async searchWithFilters(opts: {
  60  |     referenceNo?: string;
  61  |     serviceType?: ServiceType;
  62  |     status?: TxStatus;
  63  |     dateRequestedFrom?: string;
  64  |     dateRequestedTo?: string;
  65  |     paymentDateFrom?: string;
  66  |     paymentDateTo?: string;
  67  |   }) {
> 68  |     if (opts.referenceNo) await this.referenceNoInput.fill(opts.referenceNo);
      |                                              ^ TimeoutError: locator.selectOption: Timeout 10000ms exceeded.
  69  |     if (opts.serviceType) await this.serviceTypeSelect.selectOption(opts.serviceType);
  70  |     if (opts.status) await this.statusSelect.selectOption(opts.status);
  71  |     if (opts.dateRequestedFrom) await this.dateRequestedFromInput.fill(opts.dateRequestedFrom);
  72  |     if (opts.dateRequestedTo) await this.dateRequestedToInput.fill(opts.dateRequestedTo);
  73  |     if (opts.paymentDateFrom) await this.paymentDateFromInput.fill(opts.paymentDateFrom);
  74  |     if (opts.paymentDateTo) await this.paymentDateToInput.fill(opts.paymentDateTo);
  75  |     await this.searchBtn.click();
  76  |     await this.waitForNav();
  77  |   }
  78  | 
  79  |   async resetFilters() {
  80  |     await this.resetBtn.click();
  81  |     await this.waitForNav();
  82  |   }
  83  | 
  84  |   /**
  85  |    * Data rows only. The results table renders its header inside <tbody> as a
  86  |    * <th> row (no <td>), so `tbody tr:has(td)` skips it — otherwise per-cell
  87  |    * getters would wait out their timeout on a non-existent <td>.
  88  |    */
  89  |   async getResultRows(): Promise<Locator[]> {
  90  |     return await this.resultsTable.locator("tbody tr:has(td)").all();
  91  |   }
  92  | 
  93  |   private async cellText(row: Locator, colIndex: number): Promise<string> {
  94  |     const cell = row.locator("td").nth(colIndex);
  95  |     if ((await cell.count()) === 0) return ""; // row has no such cell — don't hang
  96  |     return (await cell.textContent())?.trim() ?? "";
  97  |   }
  98  | 
  99  |   async getRowReferenceNo(row: Locator): Promise<string> {
  100 |     return this.cellText(row, ServiceRequestListingPage.COL.referenceNo);
  101 |   }
  102 | 
  103 |   async getRowServiceType(row: Locator): Promise<string> {
  104 |     return this.cellText(row, ServiceRequestListingPage.COL.serviceType);
  105 |   }
  106 | 
  107 |   async getRowDateRequested(row: Locator): Promise<string> {
  108 |     return this.cellText(row, ServiceRequestListingPage.COL.dateRequested);
  109 |   }
  110 | 
  111 |   async getRowPayment(row: Locator): Promise<string> {
  112 |     return this.cellText(row, ServiceRequestListingPage.COL.payment);
  113 |   }
  114 | 
  115 |   /** Tx Status — "Pending" (blue) / "Completed" (green) etc. */
  116 |   async getRowStatus(row: Locator): Promise<string> {
  117 |     return this.cellText(row, ServiceRequestListingPage.COL.txStatus);
  118 |   }
  119 | 
  120 |   async getRowEInvoiceStatus(row: Locator): Promise<string> {
  121 |     return this.cellText(row, ServiceRequestListingPage.COL.eInvoiceStatus);
  122 |   }
  123 | 
  124 |   async getRowRemarks(row: Locator): Promise<string> {
  125 |     return this.cellText(row, ServiceRequestListingPage.COL.remarks);
  126 |   }
  127 | 
  128 |   /** Click "View" action on a row → Service Request Details Page */
  129 |   async clickView(row: Locator) {
  130 |     await row.getByText("View", { exact: false }).click();
  131 |     await this.waitForNav();
  132 |   }
  133 | 
  134 |   /** Click "Reschedule" action link on a row (a.sc-resubmit) */
  135 |   async clickReschedule(row: Locator) {
  136 |     await row.locator("a.sc-resubmit").click();
  137 |     await this.waitForNav();
  138 |   }
  139 | 
  140 |   /**
  141 |    * SRD 2.3.2.2 #3: "Reschedule" is shown only for Software Installation
  142 |    * requests whose Tx Status = "PENDING". A row qualifies when the action
  143 |    * link is present.
  144 |    */
  145 |   async hasRescheduleAction(row: Locator): Promise<boolean> {
  146 |     return (await row.locator("a.sc-resubmit").count()) > 0;
  147 |   }
  148 | 
  149 |   /**
  150 |    * The row's Reschedule link txnId, as a full "key=value" pair (e.g.
  151 |    * "txnId=195" or "transactionId=<uuid>" — see BasePage.getTxnIdFromUrl),
  152 |    * or null if the row has no Reschedule action. Lets callers open a
  153 |    * candidate's reschedule page directly (via ReschedulePage.navigate(txnId))
  154 |    * without re-searching the listing.
  155 |    */
  156 |   async getRescheduleTxnId(row: Locator): Promise<string | null> {
  157 |     const href = await row.locator("a.sc-resubmit").getAttribute("href").catch(() => null);
  158 |     const match = href?.match(/(txnId|transactionId)=([^&]+)/);
  159 |     return match ? `${match[1]}=${match[2]}` : null;
  160 |   }
  161 | 
  162 |   /**
  163 |    * Verify the SRD rule that Reschedule is only offered when Tx Status is
  164 |    * Pending — a row with a non-pending status must not expose the action.
  165 |    */
  166 |   async assertRescheduleOnlyWhenPending(row: Locator) {
  167 |     const status = (await this.getRowStatus(row)).toLowerCase();
  168 |     const hasReschedule = await this.hasRescheduleAction(row);
```