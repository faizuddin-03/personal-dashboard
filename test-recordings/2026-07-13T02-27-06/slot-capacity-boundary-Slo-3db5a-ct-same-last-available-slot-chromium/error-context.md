# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Two UCD - Select same last available slot
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:259:9

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: 2
Received: 1
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
          - row "3 Slot 3/6 4 Slot 2/6 5 Slot 2/6 6 Slot 1/6 7 Slot 3/6 8 9" [ref=e43]:
            - cell "3 Slot 3/6" [ref=e44] [cursor=pointer]:
              - text: "3"
              - generic [ref=e46]: Slot 3/6
            - cell "4 Slot 2/6" [ref=e47] [cursor=pointer]:
              - text: "4"
              - generic [ref=e49]: Slot 2/6
            - cell "5 Slot 2/6" [ref=e50] [cursor=pointer]:
              - text: "5"
              - generic [ref=e52]: Slot 2/6
            - cell "6 Slot 1/6" [ref=e53] [cursor=pointer]:
              - text: "6"
              - generic [ref=e55]: Slot 1/6
            - cell "7 Slot 3/6" [ref=e56] [cursor=pointer]:
              - text: "7"
              - generic [ref=e58]: Slot 3/6
            - cell "8" [ref=e59]
            - cell "9" [ref=e60]
          - row "10 Slot 6/6 11 Slot 1/6 12 Slot 2/6 13 Slot 1/6 14 Slot 1/6 15 16" [ref=e61]:
            - cell "10 Slot 6/6" [ref=e62]:
              - text: "10"
              - generic [ref=e64]: Slot 6/6
            - cell "11 Slot 1/6" [ref=e65] [cursor=pointer]:
              - text: "11"
              - generic [ref=e67]: Slot 1/6
            - cell "12 Slot 2/6" [ref=e68] [cursor=pointer]:
              - text: "12"
              - generic [ref=e70]: Slot 2/6
            - cell "13 Slot 1/6" [ref=e71] [cursor=pointer]:
              - text: "13"
              - generic [ref=e73]: Slot 1/6
            - cell "14 Slot 1/6" [ref=e74] [cursor=pointer]:
              - text: "14"
              - generic [ref=e76]: Slot 1/6
            - cell "15" [ref=e77]
            - cell "16" [ref=e78]
          - row "17 Slot 1/6 18 Slot 1/6 19 Slot 2/6 20 Slot 1/6 21 Slot 1/6 22 23" [ref=e79]:
            - cell "17 Slot 1/6" [ref=e80] [cursor=pointer]:
              - text: "17"
              - generic [ref=e82]: Slot 1/6
            - cell "18 Slot 1/6" [ref=e83] [cursor=pointer]:
              - text: "18"
              - generic [ref=e85]: Slot 1/6
            - cell "19 Slot 2/6" [ref=e86] [cursor=pointer]:
              - text: "19"
              - generic [ref=e88]: Slot 2/6
            - cell "20 Slot 1/6" [ref=e89] [cursor=pointer]:
              - text: "20"
              - generic [ref=e91]: Slot 1/6
            - cell "21 Slot 1/6" [ref=e92] [cursor=pointer]:
              - text: "21"
              - generic [ref=e94]: Slot 1/6
            - cell "22" [ref=e95]
            - cell "23" [ref=e96]
          - row "24 Slot 1/6 25 Slot 1/6 26 Slot 2/6 27 Slot 0/6 28 Slot 4/6 29 30" [ref=e97]:
            - cell "24 Slot 1/6" [ref=e98] [cursor=pointer]:
              - text: "24"
              - generic [ref=e100]: Slot 1/6
            - cell "25 Slot 1/6" [ref=e101] [cursor=pointer]:
              - text: "25"
              - generic [ref=e103]: Slot 1/6
            - cell "26 Slot 2/6" [ref=e104] [cursor=pointer]:
              - text: "26"
              - generic [ref=e106]: Slot 2/6
            - cell "27 Slot 0/6" [ref=e107] [cursor=pointer]:
              - text: "27"
              - generic [ref=e109]: Slot 0/6
            - cell "28 Slot 4/6" [ref=e110] [cursor=pointer]:
              - text: "28"
              - generic [ref=e112]: Slot 4/6
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
        - generic [ref=e126]: Booked 0 of 1
        - generic [ref=e127]: Click a bookable date above to allocate an installation.
        - button "Confirm Appointment" [ref=e129] [cursor=pointer]
  - generic [ref=e131]:
    - generic [ref=e132]:
      - generic [ref=e133]: Installation Appointment
      - generic [ref=e134] [cursor=pointer]: ×
    - generic [ref=e135]:
      - generic [ref=e136]:
        - generic [ref=e137]: "Appointment Date:"
        - textbox [ref=e138]: 21-08-2026
      - generic [ref=e139]: Allocate up to 1 installations across the time slots below.
      - generic [ref=e140]:
        - generic [ref=e141]: 10:00am - 12:00pm
        - generic [ref=e142]:
          - button "−" [ref=e143] [cursor=pointer]
          - textbox [ref=e144]: "0"
          - button "+" [ref=e145] [cursor=pointer]
        - generic [ref=e146]: 1 of 3 booked
      - generic [ref=e147]:
        - generic [ref=e148]: 2:00pm - 4:00pm
        - generic [ref=e149]:
          - button "−" [ref=e150] [cursor=pointer]
          - textbox [ref=e151]: "0"
          - button "+" [ref=e152] [cursor=pointer]
        - generic [ref=e153]: 0 of 3 booked
      - generic [ref=e154]: "Remaining to allocate: 1"
    - generic [ref=e156]:
      - button "Cancel" [ref=e157] [cursor=pointer]
      - button "Save changes" [ref=e158] [cursor=pointer]
  - generic [ref=e159]:
    - generic [ref=e160]:
      - button "HOME" [ref=e161] [cursor=pointer]
      - button "INSURANCE" [ref=e162] [cursor=pointer]
      - button "REPORTS" [ref=e163] [cursor=pointer]
      - button "SETTINGS" [ref=e164] [cursor=pointer]
      - button "USER GUIDE" [ref=e165] [cursor=pointer]
      - button "DOWNLOAD" [ref=e166] [cursor=pointer]
      - button "CONTACT US" [ref=e167] [cursor=pointer]
    - table [ref=e168]:
      - rowgroup [ref=e169]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e170]:
          - cell "Online Services - Service Hub" [ref=e171]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e172]:
            - list [ref=e173]:
              - listitem [ref=e174]:
                - img [ref=e175]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e176]: "|"
              - listitem [ref=e177]:
                - link "Logout" [ref=e178] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e180]
  - generic [ref=e181]:
    - generic [ref=e183]:
      - generic [ref=e184]:
        - link "Contact Us" [ref=e185] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e186]: "|"
        - link "Terms & Conditions" [ref=e187] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e188]: "|"
        - link "Privacy" [ref=e189] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e190]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e191]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e193]
```

# Test source

```ts
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
  245 |       await expect(clientErr).toBeVisible();
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
> 283 |       expect(beforeBooked.booked).toBe(2);
      |                                   ^ Error: expect(received).toBe(expected) // Object.is equality
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
  346 | });
  347 | 
```