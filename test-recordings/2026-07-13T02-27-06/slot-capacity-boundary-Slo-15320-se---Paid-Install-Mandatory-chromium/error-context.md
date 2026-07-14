# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Biometric Purchase - Paid Install Mandatory
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:214:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: locator('#si-clienterr')
Expected: visible
Timeout: 5000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 5000ms
  - waiting for locator('#si-clienterr')
    - waiting for navigation to finish...
    - navigated to "https://staging.eauto.my/uat1/view/ucd/service-hub/installation/submitted.do?txnId=90"

```

```yaml
- link "Home":
  - /url: /uat1/view/ucd/
- text: /
- link "Service Hub":
  - /url: /uat1/view/ucd/service-hub/view.do
- text: / Biometric Device Purchase
- img "Success"
- text: "Request Submitted We have received your request and you will receive an email for confirmation. Biometric Device Purchase Details Purchased Devices: 2 Unit Recipient Name: Test Receiver Contact No: 0123456789 Shipping Address: 24, JALAN SULAM EMPAT, 19/14D Software Installation Appointment Details"
- table:
  - rowgroup:
    - row "# Appointment Date Time Slot Unit(s)":
      - columnheader "#"
      - columnheader "Appointment Date"
      - columnheader "Time Slot"
      - columnheader "Unit(s)"
  - rowgroup:
    - row "1 19-08-2026 10:00am - 12:00pm 2":
      - cell "1"
      - cell "19-08-2026"
      - cell "10:00am - 12:00pm"
      - cell "2"
- link "Done":
  - /url: /uat1/view/ucd/service-hub/view.do
- button "HOME"
- button "INSURANCE"
- button "REPORTS"
- button "SETTINGS"
- button "USER GUIDE"
- button "DOWNLOAD"
- button "CONTACT US"
- table:
  - rowgroup:
    - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout":
      - cell "Online Services - Service Hub"
      - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout":
        - list:
          - listitem:
            - img
            - text: MUHAMMAD FAIZUDDIN BIN BIDI
          - listitem: "|"
          - listitem:
            - link "Logout":
              - /url: "#"
- img
- link "Contact Us":
  - /url: "#"
- text: "|"
- link "Terms & Conditions":
  - /url: "#"
- text: "|"
- link "Privacy":
  - /url: "#"
- text: Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
- img
```

# Test source

```ts
  145 |       slotPicker,
  146 |     }) => {
  147 |       // Buy 2 installations — both units must be booked before confirming
  148 |       await softwareInstallationPage.purchaseInstallation(2);
  149 | 
  150 |       const total = await slotPicker.getAllocationTotal();
  151 |       expect(total).toBe(2);
  152 | 
  153 |       const targetDate = await slotPicker.findEmptyBookableDate();
  154 |       expect(targetDate).not.toBeNull();
  155 | 
  156 |       // Book only 1 of the 2 units
  157 |       await slotPicker.openSlotModal(targetDate!);
  158 |       await slotPicker.incrementSlot(MORNING, 1);
  159 |       await slotPicker.saveSlotChanges();
  160 | 
  161 |       const remainingAfter = await slotPicker.getRemainingToAllocate();
  162 |       expect(remainingAfter).toBe(1);
  163 | 
  164 |       // Try to confirm with 1 still unbooked — should be blocked
  165 |       await slotPicker.confirmAppointment();
  166 |       const clientErr = slotPicker.page.locator("#si-clienterr");
  167 |       await expect(clientErr).toBeVisible();
  168 | 
  169 |       // Book the remaining unit — should now be allowed to proceed
  170 |       await slotPicker.openSlotModal(targetDate!);
  171 |       await slotPicker.incrementSlot(MORNING, 1);
  172 |       await slotPicker.saveSlotChanges();
  173 | 
  174 |       const allocated = await slotPicker.getAllocatedCount();
  175 |       expect(allocated).toBe(2);
  176 | 
  177 |       await slotPicker.confirmAppointment();
  178 |       await expect(clientErr).toBeHidden();
  179 |     });
  180 | 
  181 |     test("Biometric Purchase - Free Install Option", async ({
  182 |       biometricPurchasePage,
  183 |       slotPicker,
  184 |     }) => {
  185 |       // 2 devices → 2 free software installations. Do not opt for extra
  186 |       // (paid) installs.
  187 |       await biometricPurchasePage.purchaseDevice({
  188 |         deviceQty: 2,
  189 |         recipientName: "Test Receiver",
  190 |         contactNo: "0123456789",
  191 |         shipToShowroom: true,
  192 |       });
  193 | 
  194 |       const total = await slotPicker.getAllocationTotal();
  195 |       expect(total).toBe(2);
  196 | 
  197 |       const targetDate = await slotPicker.findEmptyBookableDate();
  198 |       expect(targetDate).not.toBeNull();
  199 | 
  200 |       // Book only 1 of the 2 free installations
  201 |       await slotPicker.openSlotModal(targetDate!);
  202 |       await slotPicker.incrementSlot(MORNING, 1);
  203 |       await slotPicker.saveSlotChanges();
  204 | 
  205 |       const remaining = await slotPicker.getRemainingToAllocate();
  206 |       expect(remaining).toBe(1);
  207 | 
  208 |       // Free installs are optional — confirming with 1 of 2 booked must succeed
  209 |       await slotPicker.confirmAppointment();
  210 |       const clientErr = slotPicker.page.locator("#si-clienterr");
  211 |       await expect(clientErr).toBeHidden();
  212 |     });
  213 | 
  214 |     test("Biometric Purchase - Paid Install Mandatory", async ({
  215 |       biometricPurchasePage,
  216 |       slotPicker,
  217 |     }) => {
  218 |       // 2 devices → 2 free installs, plus opt in for 1 extra (paid) install.
  219 |       // Total to allocate = 3; the paid unit is mandatory.
  220 |       await biometricPurchasePage.purchaseDevice({
  221 |         deviceQty: 2,
  222 |         recipientName: "Test Receiver",
  223 |         contactNo: "0123456789",
  224 |         shipToShowroom: true,
  225 |         additionalInstalls: 1,
  226 |       });
  227 | 
  228 |       const total = await slotPicker.getAllocationTotal();
  229 |       expect(total).toBe(3);
  230 | 
  231 |       const targetDate = await slotPicker.findEmptyBookableDate();
  232 |       expect(targetDate).not.toBeNull();
  233 | 
  234 |       // Book only the 2 free installations, leave the paid one unbooked
  235 |       await slotPicker.openSlotModal(targetDate!);
  236 |       await slotPicker.incrementSlot(MORNING, 2);
  237 |       await slotPicker.saveSlotChanges();
  238 | 
  239 |       const remainingAfter = await slotPicker.getRemainingToAllocate();
  240 |       expect(remainingAfter).toBe(1);
  241 | 
  242 |       // The paid installation is mandatory — confirming should be blocked
  243 |       await slotPicker.confirmAppointment();
  244 |       const clientErr = slotPicker.page.locator("#si-clienterr");
> 245 |       await expect(clientErr).toBeVisible();
      |                               ^ Error: expect(locator).toBeVisible() failed
  246 | 
  247 |       // Book the remaining (paid) unit — should now be allowed to proceed
  248 |       await slotPicker.openSlotModal(targetDate!);
  249 |       await slotPicker.incrementSlot(MORNING, 1);
  250 |       await slotPicker.saveSlotChanges();
  251 | 
  252 |       const allocated = await slotPicker.getAllocatedCount();
  253 |       expect(allocated).toBe(3);
  254 | 
  255 |       await slotPicker.confirmAppointment();
  256 |       await expect(clientErr).toBeHidden();
  257 |     });
  258 | 
  259 |     test("Two UCD - Select same last available slot", async ({
  260 |       softwareInstallationPage,
  261 |       slotPicker,
  262 |       browser,
  263 |     }) => {
  264 |       await softwareInstallationPage.purchaseInstallation(1);
  265 |       const targetDate = await slotPicker.findEmptyBookableDate();
  266 |       expect(targetDate).not.toBeNull();
  267 | 
  268 |       await slotPicker.openSlotModal(targetDate!);
  269 |       await slotPicker.incrementSlot(MORNING, 1);
  270 |       await slotPicker.saveSlotChanges();
  271 |       await slotPicker.confirmAppointment();
  272 | 
  273 |       await softwareInstallationPage.purchaseInstallation(1);
  274 |       await slotPicker.openSlotModal(targetDate!);
  275 |       await slotPicker.incrementSlot(MORNING, 1);
  276 |       await slotPicker.saveSlotChanges();
  277 |       await slotPicker.confirmAppointment();
  278 | 
  279 |       // 3rd purchase — open the last remaining morning slot (2/3 booked)
  280 |       await softwareInstallationPage.purchaseInstallation(1);
  281 |       await slotPicker.openSlotModal(targetDate!);
  282 |       const beforeBooked = await slotPicker.getModalSlotBooked(MORNING);
  283 |       expect(beforeBooked.booked).toBe(2);
  284 | 
  285 |       // UCD2: would book the same last slot in a parallel context
  286 |       // NOTE: requires second UCD account (ENV.ucd2Username / ENV.ucd2Password)
  287 | 
  288 |       await slotPicker.incrementSlot(MORNING, 1);
  289 |       await slotPicker.saveSlotChanges();
  290 |     });
  291 |   });
  292 | 
  293 |   // ────────────────────────────────────────────────────────────
  294 |   // BO — No capacity limit
  295 |   // ────────────────────────────────────────────────────────────
  296 |   test.describe("BO", () => {
  297 |     test.beforeEach(async ({ loginPage }) => {
  298 |       await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
  299 |     });
  300 | 
  301 |     test("BO add beyond 6 days limit", async ({
  302 |       boCalendarPage,
  303 |     }) => {
  304 |       const fullDate = boCalendarPage.daysFromToday(3);
  305 | 
  306 |       await boCalendarPage.addAppointment({
  307 |         date: fullDate,
  308 |         slot: MORNING,
  309 |         companyName: "Test Company Beyond6",
  310 |         units: 1,
  311 |       });
  312 | 
  313 |       await boCalendarPage.navigate();
  314 |     });
  315 | 
  316 |     test("Add beyond morning slot limit", async ({
  317 |       boCalendarPage,
  318 |     }) => {
  319 |       const fullDate = boCalendarPage.daysFromToday(4);
  320 | 
  321 |       await boCalendarPage.addAppointment({
  322 |         date: fullDate,
  323 |         slot: MORNING,
  324 |         companyName: "Test Company BeyondMorning",
  325 |         units: 1,
  326 |       });
  327 | 
  328 |       await boCalendarPage.navigate();
  329 |     });
  330 | 
  331 |     test("Add beyond afternoon slot limit", async ({
  332 |       boCalendarPage,
  333 |     }) => {
  334 |       const fullDate = boCalendarPage.daysFromToday(4);
  335 | 
  336 |       await boCalendarPage.addAppointment({
  337 |         date: fullDate,
  338 |         slot: AFTERNOON,
  339 |         companyName: "Test Company BeyondAfternoon",
  340 |         units: 1,
  341 |       });
  342 | 
  343 |       await boCalendarPage.navigate();
  344 |     });
  345 |   });
```