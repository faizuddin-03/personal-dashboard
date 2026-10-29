# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reschedule-handling.spec.ts >> Reschedule & Handling >> UCD >> Reschedule before the day of the appointment to a future date
- Location: tests\service-hub\specs\reschedule-handling.spec.ts:71:9

# Error details

```
Error: locator.click: Error: strict mode violation: locator('table').first().locator('tbody tr').nth(1).getByText('Reschedule') resolved to 2 elements:
    1) <td>Rescheduled into 1 appointment(s), 1 unit(s)</td> aka getByRole('cell', { name: 'Rescheduled into 1' }).first()
    2) <a class="sc-resubmit" title="Reschedule this installation" href="/uat1/view/ucd/service-hub/installation/reschedule.do?txnId=42">Reschedule</a> aka getByRole('link', { name: 'Reschedule' }).first()

Call log:
  - waiting for locator('table').first().locator('tbody tr').nth(1).getByText('Reschedule')

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
                - option "Change Main User"
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
                - option "New"
                - option "Pending"
                - option "Approved"
                - option "Completed"
                - option "Failed"
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
          - button "Search Now" [ref=e50] [cursor=pointer]
          - button "Reset" [ref=e51]
    - heading "Service Request Listing" [level=1] [ref=e53]
    - table [ref=e55]:
      - rowgroup [ref=e66]:
        - row "# Reference No Service Type Date Requested Payment Tx Status e-Invoice Status Remarks Action" [ref=e67]:
          - columnheader "#" [ref=e68]
          - columnheader "Reference No" [ref=e69]
          - columnheader "Service Type" [ref=e70]
          - columnheader "Date Requested" [ref=e71]
          - columnheader "Payment" [ref=e72]
          - columnheader "Tx Status" [ref=e73]
          - columnheader "e-Invoice Status" [ref=e74]
          - columnheader "Remarks" [ref=e75]
          - columnheader "Action" [ref=e76]
        - row "1 SR67000042 Software Installation 13-07-2026 08:50 OK Pending - Rescheduled into 1 appointment(s), 1 unit(s) View | Reschedule" [ref=e77]:
          - cell "1" [ref=e78]
          - cell "SR67000042" [ref=e79]
          - cell "Software Installation" [ref=e80]
          - cell "13-07-2026 08:50" [ref=e81]
          - cell "OK" [ref=e82]
          - cell "Pending" [ref=e83]
          - cell "-" [ref=e84]
          - cell "Rescheduled into 1 appointment(s), 1 unit(s)" [ref=e85]
          - cell "View | Reschedule" [ref=e86]:
            - link "View" [ref=e87] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?txnId=42
            - text: "|"
            - link "Reschedule" [ref=e88] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/reschedule.do?txnId=42
        - row "2 SR67000041 Software Installation 13-07-2026 08:48 OK New - View | Resubmit" [ref=e89]:
          - cell "2" [ref=e90]
          - cell "SR67000041" [ref=e91]
          - cell "Software Installation" [ref=e92]
          - cell "13-07-2026 08:48" [ref=e93]
          - cell "OK" [ref=e94]
          - cell "New" [ref=e95]
          - cell "-" [ref=e96]
          - cell [ref=e97]
          - cell "View | Resubmit" [ref=e98]:
            - link "View" [ref=e99] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?txnId=41
            - text: "|"
            - link "Resubmit" [ref=e100] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/slot.do?txnId=41
        - row "3 SR67000013 Biometric Device Purchase 10-07-2026 17:38 OK Pending - View | Reschedule" [ref=e101]:
          - cell "3" [ref=e102]
          - cell "SR67000013" [ref=e103]
          - cell "Biometric Device Purchase" [ref=e104]
          - cell "10-07-2026 17:38" [ref=e105]
          - cell "OK" [ref=e106]
          - cell "Pending" [ref=e107]
          - cell "-" [ref=e108]
          - cell [ref=e109]
          - cell "View | Reschedule" [ref=e110]:
            - link "View" [ref=e111] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?txnId=13
            - text: "|"
            - link "Reschedule" [ref=e112] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/reschedule.do?txnId=13
        - row "4 SR67000011 Software Installation 10-07-2026 17:35 OK Pending - Rescheduled into 1 appointment(s), 1 unit(s) View | Reschedule" [ref=e113]:
          - cell "4" [ref=e114]
          - cell "SR67000011" [ref=e115]
          - cell "Software Installation" [ref=e116]
          - cell "10-07-2026 17:35" [ref=e117]
          - cell "OK" [ref=e118]
          - cell "Pending" [ref=e119]
          - cell "-" [ref=e120]
          - cell "Rescheduled into 1 appointment(s), 1 unit(s)" [ref=e121]
          - cell "View | Reschedule" [ref=e122]:
            - link "View" [ref=e123] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?txnId=11
            - text: "|"
            - link "Reschedule" [ref=e124] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/reschedule.do?txnId=11
        - row "5 SR67000002 Software Installation 10-07-2026 16:09 OK Pending - Rescheduled into 3 appointment(s), 3 unit(s) View | Reschedule" [ref=e125]:
          - cell "5" [ref=e126]
          - cell "SR67000002" [ref=e127]
          - cell "Software Installation" [ref=e128]
          - cell "10-07-2026 16:09" [ref=e129]
          - cell "OK" [ref=e130]
          - cell "Pending" [ref=e131]
          - cell "-" [ref=e132]
          - cell "Rescheduled into 3 appointment(s), 3 unit(s)" [ref=e133]
          - cell "View | Reschedule" [ref=e134]:
            - link "View" [ref=e135] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?txnId=2
            - text: "|"
            - link "Reschedule" [ref=e136] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/reschedule.do?txnId=2
  - generic [ref=e137]:
    - generic [ref=e138]:
      - button "HOME" [ref=e139] [cursor=pointer]
      - button "INSURANCE" [ref=e140] [cursor=pointer]
      - button "REPORTS" [ref=e141] [cursor=pointer]
      - button "SETTINGS" [ref=e142] [cursor=pointer]
      - button "USER GUIDE" [ref=e143] [cursor=pointer]
      - button "DOWNLOAD" [ref=e144] [cursor=pointer]
      - button "CONTACT US" [ref=e145] [cursor=pointer]
    - table [ref=e146]:
      - rowgroup [ref=e147]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e148]:
          - cell "Online Services - Service Hub" [ref=e149]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e150]:
            - list [ref=e151]:
              - listitem [ref=e152]:
                - img [ref=e153]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e154]: "|"
              - listitem [ref=e155]:
                - link "Logout" [ref=e156] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e158]
  - generic [ref=e159]:
    - generic [ref=e161]:
      - generic [ref=e162]:
        - link "Contact Us" [ref=e163] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e164]: "|"
        - link "Terms & Conditions" [ref=e165] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e166]: "|"
        - link "Privacy" [ref=e167] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e168]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e169]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e171]
```

# Test source

```ts
  1  | import { type Page, type Locator, expect } from "@playwright/test";
  2  | import { BasePage } from "./BasePage";
  3  | import { PATHS } from "../utils/config";
  4  | 
  5  | export type ServiceType = "ALL" | "BIOMETRIC_PURCHASE" | "SOFTWARE_INSTALLATION" | "CHANGE_MAIN_USER";
  6  | export type TxStatus = "ALL" | "NEW" | "PENDING" | "APPROVED" | "COMPLETED" | "FAILED" | "CANCELLED";
  7  | 
  8  | export class ServiceRequestListingPage extends BasePage {
  9  |   // Filter panel
  10 |   readonly referenceNoInput = this.page.locator('input[name="referenceNo"], input[placeholder*="Reference"]').first();
  11 |   readonly serviceTypeSelect = this.page.locator('select[name="serviceType"]').first();
  12 |   readonly statusSelect = this.page.locator('select[name="status"]').first();
  13 |   readonly dateFromInput = this.page.locator('input[name="dateRequestedFrom"]').first();
  14 |   readonly dateToInput = this.page.locator('input[name="dateRequestedTo"]').first();
  15 |   readonly searchBtn = this.page.getByText("Search Now", { exact: false });
  16 |   readonly resetBtn = this.page.getByText("Reset", { exact: false });
  17 | 
  18 |   // Results table
  19 |   readonly resultsTable = this.page.locator("table").first();
  20 | 
  21 |   constructor(page: Page) {
  22 |     super(page);
  23 |   }
  24 | 
  25 |   async navigate() {
  26 |     await this.goto(PATHS.listing);
  27 |   }
  28 | 
  29 |   async searchByReferenceNo(refNo: string) {
  30 |     await this.referenceNoInput.fill(refNo);
  31 |     await this.searchBtn.click();
  32 |     await this.waitForNav();
  33 |   }
  34 | 
  35 |   async searchWithFilters(opts: {
  36 |     referenceNo?: string;
  37 |     serviceType?: ServiceType;
  38 |     status?: TxStatus;
  39 |     dateFrom?: string;
  40 |     dateTo?: string;
  41 |   }) {
  42 |     if (opts.referenceNo) await this.referenceNoInput.fill(opts.referenceNo);
  43 |     if (opts.serviceType) await this.serviceTypeSelect.selectOption(opts.serviceType);
  44 |     if (opts.status) await this.statusSelect.selectOption(opts.status);
  45 |     if (opts.dateFrom) await this.dateFromInput.fill(opts.dateFrom);
  46 |     if (opts.dateTo) await this.dateToInput.fill(opts.dateTo);
  47 |     await this.searchBtn.click();
  48 |     await this.waitForNav();
  49 |   }
  50 | 
  51 |   /** Get all result rows */
  52 |   async getResultRows(): Promise<Locator[]> {
  53 |     return await this.resultsTable.locator("tbody tr").all();
  54 |   }
  55 | 
  56 |   /** Get the status text from a specific row */
  57 |   async getRowStatus(row: Locator): Promise<string> {
  58 |     return (await row.locator("td").nth(5).textContent())?.trim() ?? "";
  59 |   }
  60 | 
  61 |   /** Get the remarks text from a specific row */
  62 |   async getRowRemarks(row: Locator): Promise<string> {
  63 |     return (await row.locator("td").nth(7).textContent())?.trim() ?? "";
  64 |   }
  65 | 
  66 |   /** Click "View" action on a row */
  67 |   async clickView(row: Locator) {
  68 |     await row.getByText("View", { exact: false }).click();
  69 |     await this.waitForNav();
  70 |   }
  71 | 
  72 |   /** Click "Reschedule" action on a row */
  73 |   async clickReschedule(row: Locator) {
> 74 |     await row.getByText("Reschedule", { exact: false }).click();
     |                                                         ^ Error: locator.click: Error: strict mode violation: locator('table').first().locator('tbody tr').nth(1).getByText('Reschedule') resolved to 2 elements:
  75 |     await this.waitForNav();
  76 |   }
  77 | 
  78 |   /** Check if "Reschedule" link exists on a row */
  79 |   async hasRescheduleAction(row: Locator): Promise<boolean> {
  80 |     return await row.getByText("Reschedule", { exact: false }).count() > 0;
  81 |   }
  82 | 
  83 |   /** Navigate to reschedule page for a specific txnId */
  84 |   async goToReschedule(txnId: string) {
  85 |     await this.goto(PATHS.reschedule(txnId));
  86 |   }
  87 | 
  88 |   /** Find first row matching a reference number */
  89 |   async findRowByRefNo(refNo: string): Promise<Locator | null> {
  90 |     const rows = await this.getResultRows();
  91 |     for (const row of rows) {
  92 |       const text = (await row.textContent()) ?? "";
  93 |       if (text.includes(refNo)) return row;
  94 |     }
  95 |     return null;
  96 |   }
  97 | }
  98 | 
```