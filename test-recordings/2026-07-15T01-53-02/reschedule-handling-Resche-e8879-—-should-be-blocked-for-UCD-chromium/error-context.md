# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reschedule-handling.spec.ts >> Reschedule & Handling >> UCD >> Reschedule failed appointment — should be blocked for UCD
- Location: tests\service-hub\specs\reschedule-handling.spec.ts:305:9

# Error details

```
TimeoutError: locator.click: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('.btn-fail').first()

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
  1   | import { type Page, type Locator, expect, test } from "@playwright/test";
  2   | import { BasePage } from "../BasePage";
  3   | import { PATHS } from "../../utils/config";
  4   | 
  5   | export type FailedReason = "Reappointment" | "Laptop/PC Issues" | "Other";
  6   | 
  7   | /**
  8   |  * eAuto Back Office Portal > Software Installation Details Page
  9   |  * (SRD 2.3.2.6).
  10  |  *
  11  |  * NOTE: BO selectors are inferred from the SRD structure and must be
  12  |  * verified against the actual BO portal HTML, then tightened.
  13  |  */
  14  | export class SoftwareInstallationDetailsPage extends BasePage {
  15  |   // 1. Page header — verified against the real BO Details HTML:
  16  |   //   "Installation Failed »"    → button.btn-fail    (onclick opFailOpen())
  17  |   //   "Installation Completed »" → button.btn-success (onclick opSuccess())
  18  |   readonly backBtn = this.page.getByText("Back", { exact: false }).first();
  19  |   readonly serviceRequestNo = this.page.locator("text=/Service Request #/i").first();
  20  |   readonly installationFailedBtn = this.page.locator(".btn-fail").first();
  21  |   readonly installationCompletedBtn = this.page.locator(".btn-success").first();
  22  | 
  23  |   // 2. Request Details
  24  |   readonly invoiceBtn = this.page.getByRole("button", { name: /^Invoice$/i }).first();
  25  |   readonly eInvoiceBtn = this.page.getByRole("button", { name: /e-?Invoice/i }).first();
  26  | 
  27  |   // 3. Appointment Details
  28  |   readonly appointmentStatus = this.page.locator("[class*='appt-status'], .appointment-status").first();
  29  | 
  30  |   // 5. Special Remark
  31  |   readonly specialRemarkInput = this.page.locator('textarea[name="specialRemark"], textarea[placeholder*="Remark"]').first();
  32  |   readonly updateSpecialRemarkBtn = this.page.getByText("Update Special Remark", { exact: false }).first();
  33  | 
  34  |   constructor(page: Page) {
  35  |     super(page);
  36  |   }
  37  | 
  38  |   async navigate(txnId: string, apptId: string) {
  39  |     await this.goto(PATHS.boSoftwareInstallationDetails(txnId, apptId));
  40  |   }
  41  | 
  42  |   async goBack() {
  43  |     await this.backBtn.click();
  44  |     await this.waitForNav();
  45  |   }
  46  | 
  47  |   async getAppointmentStatus(): Promise<string> {
  48  |     return (await this.appointmentStatus.textContent())?.trim() ?? "";
  49  |   }
  50  | 
  51  |   /** SRD 2.3.2.6 #5 — enter and save a special remark. */
  52  |   async updateSpecialRemark(remark: string) {
  53  |     await this.specialRemarkInput.fill(remark);
  54  |     await this.updateSpecialRemarkBtn.click();
  55  |     await this.waitForNav();
  56  |   }
  57  | 
  58  |   /**
  59  |    * SRD 2.3.2.6 #6 — Mark Completed:
  60  |    *   "Installation Completed »" → popup
  61  |    *   "Are you sure want to mark the installation appointment as completed?"
  62  |    *   [No] [Yes]  → Appointment Status = "Completed".
  63  |    */
  64  |   async markCompleted(confirm: boolean = true) {
  65  |     await test.step("Mark installation Completed", async () => {
  66  |       await this.installationCompletedBtn.click();
  67  |       await this.clickDialogButton("Installation Completed", confirm ? "Yes" : "No");
  68  |       await this.waitForNav();
  69  |     });
  70  |   }
  71  | 
  72  |   /**
  73  |    * Click a Yes/No button in a jQuery UI dialog identified by its title.
  74  |    * The Details-page popups render their buttons as plain
  75  |    * .ui-dialog-buttonpane <button> ("Yes"/"No") — they do NOT get the
  76  |    * .confirm-dialog-btn / .cancel-dialog-btn classes that the UCD dialogs
  77  |    * use, so acceptConfirmDialog()/dismissConfirmDialog() don't apply here.
  78  |    */
  79  |   private async clickDialogButton(titleText: string, label: "Yes" | "No") {
  80  |     const dialog = this.page.locator(".ui-dialog", {
  81  |       has: this.page.locator(".ui-dialog-title", { hasText: titleText }),
  82  |     });
  83  |     await dialog.waitFor({ state: "visible", timeout: 8000 });
  84  |     await dialog.locator(".ui-dialog-buttonpane button", { hasText: new RegExp(`^${label}$`) }).first().click();
  85  |   }
  86  | 
  87  |   /**
  88  |    * SRD 2.3.2.6 #7 — Mark Failed:
  89  |    *   "Installation Failed »" → popup
  90  |    *   "Please select the reason causing the installation failed:"
  91  |    *   radio: Reappointment / Laptop/PC Issues / Other
  92  |    *   (Other → free-text box) → [No] [Yes] → Appointment Status = "Failed".
  93  |    */
  94  |   async markFailed(reason: FailedReason, otherText?: string, confirm: boolean = true) {
  95  |     await test.step(`Mark installation Failed — reason: ${reason}`, () =>
  96  |       this.markFailedImpl(reason, otherText, confirm));
  97  |   }
  98  | 
  99  |   private async markFailedImpl(reason: FailedReason, otherText?: string, confirm: boolean = true) {
> 100 |     await this.installationFailedBtn.click();
      |                                      ^ TimeoutError: locator.click: Timeout 10000ms exceeded.
  101 |     const dialog = this.page.locator(".ui-dialog", {
  102 |       has: this.page.locator(".ui-dialog-title", { hasText: "Installation Failed" }),
  103 |     });
  104 |     await dialog.waitFor({ state: "visible", timeout: 8000 });
  105 | 
  106 |     // Reason radio: input[name="op-fail-reason"] with values Reappointment /
  107 |     // LaptopIssue / Other (note the value differs from the visible label).
  108 |     const reasonValue = reason === "Laptop/PC Issues" ? "LaptopIssue" : reason;
  109 |     await dialog.locator(`input[name="op-fail-reason"][value="${reasonValue}"]`).check();
  110 |     if (reason === "Other" && otherText) {
  111 |       await dialog.locator('textarea, input[type="text"]').first().fill(otherText);
  112 |     }
  113 | 
  114 |     await dialog.locator(".ui-dialog-buttonpane button", { hasText: new RegExp(`^${confirm ? "Yes" : "No"}$`) }).first().click();
  115 |     await this.waitForNav();
  116 |   }
  117 | 
  118 |   async isCompleted(): Promise<boolean> {
  119 |     return (await this.getAppointmentStatus()).toLowerCase().includes("complete");
  120 |   }
  121 | 
  122 |   async isFailed(): Promise<boolean> {
  123 |     return (await this.getAppointmentStatus()).toLowerCase().includes("fail");
  124 |   }
  125 | }
  126 | 
```