# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reschedule-handling.spec.ts >> Reschedule & Handling >> UCD >> Reschedule cancelled appointment — should be blocked
- Location: tests\service-hub\specs\reschedule-handling.spec.ts:252:9

# Error details

```
TimeoutError: locator.selectOption: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('select[name="status"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - generic [ref=e6]: FAIZUDDIN AUTO TEST
      - generic [ref=e7]:
        - generic [ref=e8]:
          - img [ref=e9]
          - paragraph [ref=e10]: From RM30*
          - button "STMS" [ref=e11]
          - paragraph [ref=e12]: Sistem Tukar Milik Sementara
          - paragraph [ref=e13]: (View or Create Transaction)
        - generic [ref=e14]:
          - img [ref=e15]
          - paragraph [ref=e16]: RM30 only*
          - button "UCD TO UCD" [ref=e17]
          - paragraph [ref=e18]: Dealer to Dealer
        - generic [ref=e19]:
          - img [ref=e20]
          - paragraph [ref=e21]: RM115 only*
          - button "APT" [ref=e22]
          - paragraph [ref=e23]: Automatic Permanent Transfer
          - paragraph [ref=e24]: (View / Make Payment for vehicles in STMS which are 6 months or more)
        - generic [ref=e25]:
          - generic [ref=e26]:
            - img [ref=e27]
            - img [ref=e28]
          - paragraph [ref=e29]: From RM135*
          - button "eSERAHAN" [ref=e30]
          - paragraph [ref=e31]: Online Transfer
          - paragraph [ref=e32]: (Dealer to Customer)
        - generic [ref=e33]:
          - img [ref=e34]
          - paragraph [ref=e35]: RM30 only*
          - button "BMK" [ref=e37]
          - paragraph [ref=e38]: Butiran Maklumat Kenderaan
        - generic [ref=e39]:
          - img [ref=e40]
          - paragraph [ref=e41]: Instant Commission
          - button "INSURANCE" [ref=e42]
          - paragraph [ref=e43]: Motor Insurance
        - generic [ref=e44]:
          - img [ref=e45]
          - paragraph [ref=e46]: RM18 only*
          - button "JOMCHECK REPORT" [ref=e47]
          - paragraph [ref=e48]: Vehicle Check Report
        - generic [ref=e49]:
          - img [ref=e50]
          - paragraph [ref=e51]
          - button "SERVICE HUB" [ref=e52]
          - paragraph [ref=e53]: Request and manage your services or appointments.
        - generic [ref=e54]:
          - generic [ref=e55]: NEW!
          - img [ref=e56]
          - paragraph [ref=e57]
          - button "eVOC" [ref=e58]
          - paragraph [ref=e59]: eVehicle Ownership Certificate
        - generic [ref=e60]:
          - img [ref=e61]
          - paragraph [ref=e62]
          - generic [ref=e63]:
            - button "LKM REFUND" [ref=e64]
            - img [ref=e66]
          - paragraph [ref=e67]: Lesen Kenderaan Motor Refund
        - generic [ref=e70]:
          - text: "* The price is exclusive of government service tax."
          - text: The product price consists of JPJ and eAuto Service Fee.
      - generic [ref=e71]:
        - generic [ref=e72]:
          - img [ref=e73]
          - button "COMPANY/ BUSINESS PROFILE" [ref=e74]:
            - text: COMPANY/
            - text: BUSINESS PROFILE
          - paragraph [ref=e75]:
            - text: Main user, update your
            - text: company/business profile
            - text: before 31 August 2025
        - generic [ref=e76]:
          - img [ref=e77]
          - button "SETTINGS" [ref=e78]
          - paragraph [ref=e79]:
            - text: Manage the branches,
            - text: registration or users
        - generic [ref=e80]:
          - img [ref=e81]
          - button "REPORTS" [ref=e82]
    - generic [ref=e84]:
      - heading "What's New" [level=6] [ref=e86]
      - generic [ref=e89]:
        - heading "Need Help?" [level=6] [ref=e90]
        - generic [ref=e91]:
          - img [ref=e93]
          - table [ref=e95]:
            - rowgroup [ref=e96]:
              - 'row "Support Hotline : 03-27798899" [ref=e97]':
                - cell "Support Hotline" [ref=e98]
                - 'cell ": 03-27798899" [ref=e99]'
              - 'row "Mon to Fri : 9am to 6pm" [ref=e100]':
                - cell "Mon to Fri" [ref=e101]
                - 'cell ": 9am to 6pm" [ref=e102]'
              - 'row "Sat, Sun & P.Holiday : 10am to 4pm" [ref=e103]':
                - cell "Sat, Sun & P.Holiday" [ref=e104]
                - 'cell ": 10am to 4pm" [ref=e105]'
        - generic [ref=e106]:
          - img [ref=e108]
          - table [ref=e110]:
            - rowgroup [ref=e111]:
              - 'row "Email : support@eauto.my" [ref=e112]':
                - cell "Email" [ref=e113]
                - 'cell ": support@eauto.my" [ref=e114]'
        - generic [ref=e115]:
          - img [ref=e117]
          - table [ref=e119]:
            - rowgroup [ref=e120]:
              - 'row "WhatsApp : 012-200 1324" [ref=e121]':
                - cell "WhatsApp" [ref=e122]
                - 'cell ": 012-200 1324" [ref=e123]'
      - generic [ref=e124]:
        - heading "Useful Link" [level=6] [ref=e125]
        - generic [ref=e126]:
          - button "JPJ Info" [ref=e127]
          - button "TeamViewer" [ref=e128]
  - generic [ref=e129]:
    - generic [ref=e130]:
      - button "HOME" [ref=e131] [cursor=pointer]
      - button "INSURANCE" [ref=e132] [cursor=pointer]
      - button "REPORTS" [ref=e133] [cursor=pointer]
      - button "SETTINGS" [ref=e134] [cursor=pointer]
      - button "USER GUIDE" [ref=e135] [cursor=pointer]
      - button "DOWNLOAD" [ref=e136] [cursor=pointer]
      - button "CONTACT US" [ref=e137] [cursor=pointer]
    - table [ref=e138]:
      - rowgroup [ref=e139]:
        - row "Welcome to eAuto MUHAMMAD FAIZUDDIN BIN BIDI (RHB:235498893030-Active) | Logout" [ref=e140]:
          - cell "Welcome to eAuto" [ref=e141]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI (RHB:235498893030-Active) | Logout" [ref=e142]:
            - list [ref=e143]:
              - listitem [ref=e144]:
                - img [ref=e145]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI (RHB:235498893030-Active)
              - listitem [ref=e146]: "|"
              - listitem [ref=e147]:
                - link "Logout" [ref=e148] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e150]
  - generic [ref=e151]:
    - generic [ref=e153]:
      - generic [ref=e154]:
        - link "Contact Us" [ref=e155] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e156]: "|"
        - link "Terms & Conditions" [ref=e157] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e158]: "|"
        - link "Privacy" [ref=e159] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e160]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e161]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e163]
```

# Test source

```ts
  13  | /**
  14  |  * eAuto Back Office Portal > Biometric Device Purchase & Software
  15  |  * Installation Listing.
  16  |  *
  17  |  * Selectors confirmed against the real BO portal HTML:
  18  |  *  - Filter form #sc-filter-form (GET → /api/admin/service-hub/listing/list.get).
  19  |  *    Field names: referenceNo, companyName, requestedFrom, requestedTo, roc,
  20  |  *    deliveryDateFrom, deliveryDateTo, deliveryStatus, appointmentDateFrom,
  21  |  *    appointmentDateTo, status (Installation Status), timeSlot (two
  22  |  *    checkboxes: 1000_1200 / 1400_1600), paymentStatus, lhdnStatus. All date
  23  |  *    inputs are readonly datepickers.
  24  |  *  - Buttons: #sc-search, #sc-export (hidden until a search runs), #sc-reset,
  25  |  *    #sc-appt-cal.
  26  |  *  - Results table #sc-combined-tbl (18 columns). Action cell has
  27  |  *    <a href="detail.do?txnId=X&apptId=Y">View</a> and
  28  |  *    <a onclick="scCancel(apptId)">Cancel</a>; Cancel opens the
  29  |  *    #sc-cancel-dialog ("Sure to cancel?").
  30  |  */
  31  | export class SoftwareInstallationListingPage extends BasePage {
  32  |   static readonly COL = {
  33  |     num: 0,
  34  |     referenceNo: 1,
  35  |     dateRequested: 2,
  36  |     companyName: 3,
  37  |     companyRoc: 4,
  38  |     device: 5,
  39  |     deliveryDate: 6,
  40  |     installationRequest: 7,
  41  |     appointmentDate: 8,
  42  |     timeSlot: 9,
  43  |     paymentStatus: 10,
  44  |     lhdnResponseStatus: 11,
  45  |     deliveryStatus: 12,
  46  |     installationStatus: 13,
  47  |     dateCompleted: 14,
  48  |     remarks: 15,
  49  |     specialRemarks: 16,
  50  |     action: 17,
  51  |   } as const;
  52  | 
  53  |   // Filter panel
  54  |   readonly referenceNoInput = this.page.locator('input[name="referenceNo"]');
  55  |   readonly companyNameInput = this.page.locator('input[name="companyName"]');
  56  |   readonly requestedFromInput = this.page.locator('input[name="requestedFrom"]');
  57  |   readonly requestedToInput = this.page.locator('input[name="requestedTo"]');
  58  |   readonly rocInput = this.page.locator('input[name="roc"]');
  59  |   readonly appointmentDateFromInput = this.page.locator('input[name="appointmentDateFrom"]');
  60  |   readonly appointmentDateToInput = this.page.locator('input[name="appointmentDateTo"]');
  61  |   readonly installationStatusSelect = this.page.locator('select[name="status"]');
  62  |   readonly paymentStatusSelect = this.page.locator('select[name="paymentStatus"]');
  63  |   readonly lhdnStatusSelect = this.page.locator('select[name="lhdnStatus"]');
  64  |   readonly timeSlotMorningCheckbox = this.page.locator('input[name="timeSlot"][value="1000_1200"]');
  65  |   readonly timeSlotAfternoonCheckbox = this.page.locator('input[name="timeSlot"][value="1400_1600"]');
  66  | 
  67  |   readonly searchBtn = this.page.locator("#sc-search");
  68  |   readonly exportBtn = this.page.locator("#sc-export");
  69  |   readonly resetBtn = this.page.locator("#sc-reset");
  70  |   readonly appointmentCalendarBtn = this.page.locator("#sc-appt-cal");
  71  | 
  72  |   readonly resultsTable = this.page.locator("#sc-combined-tbl");
  73  | 
  74  |   constructor(page: Page) {
  75  |     super(page);
  76  |   }
  77  | 
  78  |   async navigate() {
  79  |     await this.goto(PATHS.boSoftwareInstallationListing);
  80  |   }
  81  | 
  82  |   /** Set a readonly datepicker input's value directly (bypasses the widget). */
  83  |   private async setDateInput(input: Locator, value: string) {
  84  |     await input.evaluate((el, v) => {
  85  |       (el as HTMLInputElement).value = v as string;
  86  |       el.dispatchEvent(new Event("change", { bubbles: true }));
  87  |     }, value);
  88  |   }
  89  | 
  90  |   /**
  91  |    * Search. Date values are in the datepicker's display format (DD-MM-YYYY).
  92  |    * Date Requested From/To are mandatory per the SRD.
  93  |    */
  94  |   async searchWithFilters(opts: {
  95  |     referenceNo?: string;
  96  |     companyName?: string;
  97  |     roc?: string;
  98  |     requestedFrom?: string;
  99  |     requestedTo?: string;
  100 |     appointmentDateFrom?: string;
  101 |     appointmentDateTo?: string;
  102 |     installationStatus?: InstallationStatus;
  103 |     paymentStatus?: string;
  104 |     lhdnStatus?: string;
  105 |   }) {
  106 |     if (opts.referenceNo) await this.referenceNoInput.fill(opts.referenceNo);
  107 |     if (opts.companyName) await this.companyNameInput.fill(opts.companyName);
  108 |     if (opts.roc) await this.rocInput.fill(opts.roc);
  109 |     if (opts.requestedFrom) await this.setDateInput(this.requestedFromInput, opts.requestedFrom);
  110 |     if (opts.requestedTo) await this.setDateInput(this.requestedToInput, opts.requestedTo);
  111 |     if (opts.appointmentDateFrom) await this.setDateInput(this.appointmentDateFromInput, opts.appointmentDateFrom);
  112 |     if (opts.appointmentDateTo) await this.setDateInput(this.appointmentDateToInput, opts.appointmentDateTo);
> 113 |     if (opts.installationStatus !== undefined) await this.installationStatusSelect.selectOption(opts.installationStatus);
      |                                                                                    ^ TimeoutError: locator.selectOption: Timeout 10000ms exceeded.
  114 |     if (opts.paymentStatus) await this.paymentStatusSelect.selectOption(opts.paymentStatus);
  115 |     if (opts.lhdnStatus) await this.lhdnStatusSelect.selectOption(opts.lhdnStatus);
  116 |     await this.searchBtn.click();
  117 |     await this.waitForNav();
  118 |     await this.resultsTable.waitFor({ state: "visible", timeout: 15000 }).catch(() => {});
  119 |   }
  120 | 
  121 |   async resetFilters() {
  122 |     await this.resetBtn.click();
  123 |     await this.waitForNav();
  124 |   }
  125 | 
  126 |   async goToAppointmentCalendar() {
  127 |     await this.appointmentCalendarBtn.click();
  128 |     await this.waitForNav();
  129 |   }
  130 | 
  131 |   async getResultRows(): Promise<Locator[]> {
  132 |     return await this.resultsTable.locator("tbody tr").all();
  133 |   }
  134 | 
  135 |   private async cellText(row: Locator, colIndex: number): Promise<string> {
  136 |     return (await row.locator("td").nth(colIndex).textContent())?.trim().replace(/\s+/g, " ") ?? "";
  137 |   }
  138 | 
  139 |   async getRowReferenceNo(row: Locator): Promise<string> {
  140 |     return this.cellText(row, SoftwareInstallationListingPage.COL.referenceNo);
  141 |   }
  142 | 
  143 |   async getRowCompanyName(row: Locator): Promise<string> {
  144 |     return this.cellText(row, SoftwareInstallationListingPage.COL.companyName);
  145 |   }
  146 | 
  147 |   async getRowInstallationStatus(row: Locator): Promise<string> {
  148 |     return this.cellText(row, SoftwareInstallationListingPage.COL.installationStatus);
  149 |   }
  150 | 
  151 |   async getRowPaymentStatus(row: Locator): Promise<string> {
  152 |     return this.cellText(row, SoftwareInstallationListingPage.COL.paymentStatus);
  153 |   }
  154 | 
  155 |   async getRowRemarks(row: Locator): Promise<string> {
  156 |     return this.cellText(row, SoftwareInstallationListingPage.COL.remarks);
  157 |   }
  158 | 
  159 |   /** The View link's detail URL for a row (detail.do?txnId=X&apptId=Y). */
  160 |   async getRowDetailHref(row: Locator): Promise<string | null> {
  161 |     return await row.locator('a[href*="detail.do"]').first().getAttribute("href");
  162 |   }
  163 | 
  164 |   /** Click "View" → BO Software Installation Details Page. */
  165 |   async clickView(row: Locator) {
  166 |     await row.locator('a[href*="detail.do"]').first().click();
  167 |     await this.waitForNav();
  168 |   }
  169 | 
  170 |   /**
  171 |    * Click "Cancel" (a[onclick*="scCancel"]) and confirm the "Sure to cancel?"
  172 |    * popup (#sc-cancel-dialog, opened as a jQuery UI dialog).
  173 |    */
  174 |   async cancelRequest(row: Locator, confirm: boolean = true) {
  175 |     await row.locator('a[onclick*="scCancel"]').first().click();
  176 |     const dialog = this.page.locator(".ui-dialog", { has: this.page.locator("#sc-cancel-dialog") });
  177 |     await dialog.waitFor({ state: "visible", timeout: 8000 });
  178 |     const label = confirm ? /yes|ok|confirm/i : /no|cancel/i;
  179 |     const btn = dialog.locator(".ui-dialog-buttonpane button").filter({ hasText: label }).first();
  180 |     if (await btn.count()) {
  181 |       await btn.click();
  182 |     } else {
  183 |       // Fallback: first button is typically the affirmative action.
  184 |       await dialog.locator(".ui-dialog-buttonpane button").first().click();
  185 |     }
  186 |     await this.waitForNav();
  187 |   }
  188 | 
  189 |   /**
  190 |    * SRD 2.3.2.5 #3 — expected export filename for a given date.
  191 |    * Format: Biometric_Device_Installation_List_YYYYMMDD.xlsx
  192 |    */
  193 |   static expectedExportFilename(date: Date): string {
  194 |     const y = date.getFullYear();
  195 |     const m = String(date.getMonth() + 1).padStart(2, "0");
  196 |     const d = String(date.getDate()).padStart(2, "0");
  197 |     return `Biometric_Device_Installation_List_${y}${m}${d}.xlsx`;
  198 |   }
  199 | 
  200 |   /** Click Export (visible only after a search) and return the filename. */
  201 |   async exportAndGetFilename(): Promise<string> {
  202 |     const [download] = await Promise.all([
  203 |       this.page.waitForEvent("download"),
  204 |       this.exportBtn.click(),
  205 |     ]);
  206 |     return download.suggestedFilename();
  207 |   }
  208 | }
  209 | 
```