# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Biometric Purchase - Free Install Option (partial booking)
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:150:9

# Error details

```
Error: expect(locator).toBeHidden() failed

Locator:  locator('#si-clienterr')
Expected: hidden
Received: visible
Timeout:  5000ms

Call log:
  - Expect "toBeHidden" with timeout 5000ms
  - waiting for locator('#si-clienterr')
    14 × locator resolved to <div class="si-err" id="si-clienterr">Incomplete appointment allocation. Please select …</div>
       - unexpected value "visible"

```

```yaml
- text: Incomplete appointment allocation. Please select a date and time slot to each software installation.
```

# Test source

```ts
  79  |         await slotPicker.openSlotModal(fullDate!);
  80  |         popupOpened = true;
  81  |       } catch {
  82  |         // Expected — a fully-booked date must refuse to open.
  83  |       }
  84  |       // If it somehow DID open, that's a real bug and this test must fail.
  85  |       expect(popupOpened).toBe(false);
  86  | 
  87  |       // Part 2: on a date with some room, neither slot can be pushed past
  88  |       // its own 3-unit cap. Stepper only — never saved/confirmed, so no
  89  |       // real booking is made and the shared calendar stays untouched.
  90  |       const targetDate = await slotPicker.findDateWithRoom(1);
  91  |       expect(targetDate).not.toBeNull();
  92  | 
  93  |       await slotPicker.openSlotModal(targetDate!);
  94  | 
  95  |       const morningInitial = await slotPicker.getModalSlotBooked(MORNING);
  96  |       const afternoonInitial = await slotPicker.getModalSlotBooked(AFTERNOON);
  97  |       const morningRoom = morningInitial.max - morningInitial.booked;
  98  |       const afternoonRoom = afternoonInitial.max - afternoonInitial.booked;
  99  |       expect(morningRoom + afternoonRoom).toBeGreaterThan(0);
  100 | 
  101 |       if (morningRoom > 0) {
  102 |         await slotPicker.incrementSlot(MORNING, morningRoom);
  103 |         expect(await slotPicker.getStepperValue(MORNING)).toBe(morningRoom);
  104 |         await slotPicker.incrementSlot(MORNING, 1);
  105 |         expect(await slotPicker.getStepperValue(MORNING)).toBe(morningRoom);
  106 |       }
  107 | 
  108 |       if (afternoonRoom > 0) {
  109 |         await slotPicker.incrementSlot(AFTERNOON, afternoonRoom);
  110 |         expect(await slotPicker.getStepperValue(AFTERNOON)).toBe(afternoonRoom);
  111 |         await slotPicker.incrementSlot(AFTERNOON, 1);
  112 |         expect(await slotPicker.getStepperValue(AFTERNOON)).toBe(afternoonRoom);
  113 |       }
  114 |     });
  115 | 
  116 |     test("Software Installation - Mandatory Booking", async ({
  117 |       softwareInstallationPage,
  118 |       slotPicker,
  119 |     }) => {
  120 |       // Buy 2 installations — both units must be booked before confirming
  121 |       await softwareInstallationPage.purchaseInstallation(2);
  122 | 
  123 |       const total = await slotPicker.getAllocationTotal();
  124 |       expect(total).toBe(2);
  125 | 
  126 |       const targetDate = await slotPicker.findDateWithRoom(total);
  127 |       expect(targetDate).not.toBeNull();
  128 | 
  129 |       // Book only 1 of the 2 units
  130 |       await slotPicker.allocateUnitsAnywhere(1, targetDate!);
  131 | 
  132 |       const remainingAfter = await slotPicker.getRemainingToAllocate();
  133 |       expect(remainingAfter).toBe(1);
  134 | 
  135 |       // Try to confirm with 1 still unbooked — should be blocked
  136 |       await slotPicker.confirmAppointment();
  137 |       const clientErr = slotPicker.page.locator("#si-clienterr");
  138 |       await expect(clientErr).toBeVisible();
  139 | 
  140 |       // Book the remaining unit — should now be allowed to proceed
  141 |       await slotPicker.allocateUnitsAnywhere(1);
  142 | 
  143 |       const allocated = await slotPicker.getAllocatedCount();
  144 |       expect(allocated).toBe(2);
  145 | 
  146 |       await slotPicker.confirmAppointment();
  147 |       await expect(clientErr).toBeHidden();
  148 |     });
  149 | 
  150 |     test("Biometric Purchase - Free Install Option (partial booking)", async ({
  151 |       biometricPurchasePage,
  152 |       slotPicker,
  153 |     }) => {
  154 |       // 2 devices → 2 free software installations. Do not opt for extra
  155 |       // (paid) installs. Expected: UCD may PARTIALLY book — the remaining
  156 |       // free appointment stays valid for 1 month (tied to the SR reference).
  157 |       await biometricPurchasePage.purchaseDevice({
  158 |         deviceQty: 2,
  159 |         recipientName: "Test Receiver",
  160 |         contactNo: "0123456789",
  161 |         shipToShowroom: true,
  162 |       });
  163 | 
  164 |       const total = await slotPicker.getAllocationTotal();
  165 |       expect(total).toBe(2);
  166 | 
  167 |       const targetDate = await slotPicker.findDateWithRoom(1);
  168 |       expect(targetDate).not.toBeNull();
  169 | 
  170 |       // Book only 1 of the 2 free installations
  171 |       await slotPicker.allocateUnitsAnywhere(1, targetDate!);
  172 | 
  173 |       const remaining = await slotPicker.getRemainingToAllocate();
  174 |       expect(remaining).toBe(1);
  175 | 
  176 |       // Free installs are optional — confirming with 1 of 2 booked must succeed
  177 |       await slotPicker.confirmAppointment();
  178 |       const clientErr = slotPicker.page.locator("#si-clienterr");
> 179 |       await expect(clientErr).toBeHidden();
      |                               ^ Error: expect(locator).toBeHidden() failed
  180 |     });
  181 | 
  182 |     test("Biometric Purchase - Free Install Option (no booking)", async ({
  183 |       biometricPurchasePage,
  184 |       slotPicker,
  185 |     }) => {
  186 |       // 2 devices → 2 free installs, no extra (paid) installs. Expected: UCD
  187 |       // may proceed WITHOUT booking any appointment now — all free installs
  188 |       // remain valid for 1 month (tied to the SR reference).
  189 |       await biometricPurchasePage.purchaseDevice({
  190 |         deviceQty: 2,
  191 |         recipientName: "Test Receiver",
  192 |         contactNo: "0123456789",
  193 |         shipToShowroom: true,
  194 |       });
  195 | 
  196 |       expect(await slotPicker.getAllocationTotal()).toBe(2);
  197 | 
  198 |       // Confirm with nothing booked — free installs are optional, so this
  199 |       // must be allowed to proceed (no mandatory paid unit to block it).
  200 |       await slotPicker.confirmAppointment();
  201 |       expect(slotPicker.page.url()).toMatch(/submitted\.do/);
  202 |     });
  203 | 
  204 |     test("Biometric Purchase - Paid Install Mandatory", async ({
  205 |       biometricPurchasePage,
  206 |       slotPicker,
  207 |     }) => {
  208 |       // 2 devices → 2 free installs, plus opt in for 1 extra (paid) install.
  209 |       // Total to allocate = 3; the paid unit is mandatory.
  210 |       await biometricPurchasePage.purchaseDevice({
  211 |         deviceQty: 2,
  212 |         recipientName: "Test Receiver",
  213 |         contactNo: "0123456789",
  214 |         shipToShowroom: true,
  215 |         additionalInstalls: 1,
  216 |       });
  217 | 
  218 |       // Paid/extra installations are allocated FIRST and are mandatory;
  219 |       // the free ones just have a booking deadline — they don't block
  220 |       // confirmation. So with 1 paid unit, booking 0 must be blocked,
  221 |       // and booking 1 (the paid unit) must be enough to proceed even
  222 |       // though the 2 free units remain unbooked.
  223 |       const total = await slotPicker.getAllocationTotal();
  224 |       expect(total).toBe(3);
  225 | 
  226 |       const targetDate = await slotPicker.findDateWithRoom(1);
  227 |       expect(targetDate).not.toBeNull();
  228 | 
  229 |       // Confirm with nothing booked — the mandatory paid unit is missing
  230 |       await slotPicker.confirmAppointment();
  231 |       expect(slotPicker.page.url()).not.toMatch(/submitted\.do/);
  232 | 
  233 |       // Book exactly 1 unit (the mandatory paid one) — the 2 free ones stay unbooked
  234 |       await slotPicker.allocateUnitsAnywhere(1, targetDate!);
  235 | 
  236 |       const allocated = await slotPicker.getAllocatedCount();
  237 |       expect(allocated).toBe(1);
  238 | 
  239 |       await slotPicker.confirmAppointment();
  240 |       expect(slotPicker.page.url()).toMatch(/submitted\.do/);
  241 |     });
  242 | 
  243 |     test("Two UCD - Select same last available slot", async ({
  244 |       softwareInstallationPage,
  245 |       slotPicker,
  246 |       browser,
  247 |     }) => {
  248 |       // Scout: find a date where morning specifically has room
  249 |       await softwareInstallationPage.purchaseInstallation(1);
  250 |       const targetDate = await slotPicker.findDateWithSlotRoom(MORNING, 1);
  251 |       expect(targetDate).not.toBeNull();
  252 | 
  253 |       await slotPicker.openSlotModal(targetDate!);
  254 |       let current = await slotPicker.getModalSlotBooked(MORNING);
  255 |       expect(current.max - current.booked).toBeGreaterThan(0);
  256 | 
  257 |       // Keep buying + booking 1 unit at a time into morning until exactly
  258 |       // 1 slot remains — whatever the starting point was
  259 |       while (current.max - current.booked > 1) {
  260 |         await slotPicker.incrementSlot(MORNING, 1);
  261 |         await slotPicker.saveSlotChanges();
  262 |         await slotPicker.confirmAppointment();
  263 | 
  264 |         await softwareInstallationPage.purchaseInstallation(1);
  265 |         await slotPicker.openSlotModal(targetDate!);
  266 |         current = await slotPicker.getModalSlotBooked(MORNING);
  267 |       }
  268 | 
  269 |       // Exactly 1 slot remains, and we have an unconfirmed purchase with
  270 |       // its modal already open — this is the "last" purchase attempting
  271 |       // to grab it
  272 |       const beforeBooked = current;
  273 |       expect(beforeBooked.booked).toBe(beforeBooked.max - 1);
  274 | 
  275 |       // UCD2: would book the same last slot in a parallel context
  276 |       // NOTE: requires second UCD account (ENV.ucd2Username / ENV.ucd2Password)
  277 | 
  278 |       await slotPicker.incrementSlot(MORNING, 1);
  279 |       await slotPicker.saveSlotChanges();
```