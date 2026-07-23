# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: slot-capacity-boundary.spec.ts >> Slot Capacity Boundary >> UCD >> Biometric Purchase - Free Install Option (partial booking)
- Location: tests\service-hub\specs\slot-capacity-boundary.spec.ts:155:9

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
  99  |       let remainingToAllocate = await slotPicker.getRemainingToAllocate();
  100 |       expect(morningRoom + afternoonRoom).toBeGreaterThan(0);
  101 |       expect(remainingToAllocate).toBeGreaterThan(0);
  102 | 
  103 |       if (morningRoom > 0 && remainingToAllocate > 0) {
  104 |         const morningAlloc = Math.min(morningRoom, remainingToAllocate);
  105 |         await slotPicker.incrementSlot(MORNING, morningAlloc);
  106 |         expect(await slotPicker.getStepperValue(MORNING)).toBe(morningAlloc);
  107 |         await slotPicker.incrementSlot(MORNING, 1);
  108 |         expect(await slotPicker.getStepperValue(MORNING)).toBe(morningAlloc);
  109 |         remainingToAllocate -= morningAlloc;
  110 |       }
  111 | 
  112 |       if (afternoonRoom > 0 && remainingToAllocate > 0) {
  113 |         const afternoonAlloc = Math.min(afternoonRoom, remainingToAllocate);
  114 |         await slotPicker.incrementSlot(AFTERNOON, afternoonAlloc);
  115 |         expect(await slotPicker.getStepperValue(AFTERNOON)).toBe(afternoonAlloc);
  116 |         await slotPicker.incrementSlot(AFTERNOON, 1);
  117 |         expect(await slotPicker.getStepperValue(AFTERNOON)).toBe(afternoonAlloc);
  118 |       }
  119 |     });
  120 | 
  121 |     test("Software Installation - Mandatory Booking", async ({
  122 |       softwareInstallationPage,
  123 |       slotPicker,
  124 |     }) => {
  125 |       // Buy 2 installations — both units must be booked before confirming
  126 |       await softwareInstallationPage.purchaseInstallation(2);
  127 | 
  128 |       const total = await slotPicker.getAllocationTotal();
  129 |       expect(total).toBe(2);
  130 | 
  131 |       const targetDate = await slotPicker.findDateWithRoom(total);
  132 |       expect(targetDate).not.toBeNull();
  133 | 
  134 |       // Book only 1 of the 2 units
  135 |       await slotPicker.allocateUnitsAnywhere(1, targetDate!);
  136 | 
  137 |       const remainingAfter = await slotPicker.getRemainingToAllocate();
  138 |       expect(remainingAfter).toBe(1);
  139 | 
  140 |       // Try to confirm with 1 still unbooked — should be blocked
  141 |       await slotPicker.confirmAppointment();
  142 |       const clientErr = slotPicker.page.locator("#si-clienterr");
  143 |       await expect(clientErr).toBeVisible();
  144 | 
  145 |       // Book the remaining unit — should now be allowed to proceed
  146 |       await slotPicker.allocateUnitsAnywhere(1);
  147 | 
  148 |       const allocated = await slotPicker.getAllocatedCount();
  149 |       expect(allocated).toBe(2);
  150 | 
  151 |       await slotPicker.confirmAppointment();
  152 |       await expect(clientErr).toBeHidden();
  153 |     });
  154 | 
  155 |     test("Biometric Purchase - Free Install Option (partial booking)", async ({
  156 |       biometricPurchasePage,
  157 |       slotPicker,
  158 |     }) => {
  159 |       // 2 devices → 2 free software installations. Do not opt for extra
  160 |       // (paid) installs. Expected: UCD may PARTIALLY book — the remaining
  161 |       // free appointment stays valid for 1 month (tied to the SR reference).
  162 |       await biometricPurchasePage.purchaseDevice({
  163 |         deviceQty: 2,
  164 |         recipientName: "Test Receiver",
  165 |         contactNo: "0123456789",
  166 |         shipToShowroom: true,
  167 |       });
  168 | 
  169 |       const total = await slotPicker.getAllocationTotal();
  170 |       expect(total).toBe(2);
  171 | 
  172 |       const targetDate = await slotPicker.findDateWithRoom(1);
  173 |       expect(targetDate).not.toBeNull();
  174 | 
  175 |       // Book only 1 of the 2 free installations
  176 |       await slotPicker.allocateUnitsAnywhere(1, targetDate!);
  177 | 
  178 |       const remaining = await slotPicker.getRemainingToAllocate();
  179 |       expect(remaining).toBe(1);
  180 | 
  181 |       // Free installs are optional — confirming with 1 of 2 booked must succeed
  182 |       await slotPicker.confirmAppointment();
  183 |       const clientErr = slotPicker.page.locator("#si-clienterr");
> 184 |       await expect(clientErr).toBeHidden();
      |                               ^ Error: expect(locator).toBeHidden() failed
  185 |     });
  186 | 
  187 |     test("Biometric Purchase - Free Install Option (no booking)", async ({
  188 |       biometricPurchasePage,
  189 |       slotPicker,
  190 |     }) => {
  191 |       // 2 devices → 2 free installs, no extra (paid) installs. Expected: UCD
  192 |       // may proceed WITHOUT booking any appointment now — all free installs
  193 |       // remain valid for 1 month (tied to the SR reference).
  194 |       await biometricPurchasePage.purchaseDevice({
  195 |         deviceQty: 2,
  196 |         recipientName: "Test Receiver",
  197 |         contactNo: "0123456789",
  198 |         shipToShowroom: true,
  199 |       });
  200 | 
  201 |       expect(await slotPicker.getAllocationTotal()).toBe(2);
  202 | 
  203 |       // Confirm with nothing booked — free installs are optional, so this
  204 |       // must be allowed to proceed (no mandatory paid unit to block it).
  205 |       await slotPicker.confirmAppointment();
  206 |       expect(slotPicker.page.url()).toMatch(/submitted\.do/);
  207 |     });
  208 | 
  209 |     test("Biometric Purchase - Paid Install Mandatory", async ({
  210 |       biometricPurchasePage,
  211 |       slotPicker,
  212 |     }) => {
  213 |       // 2 devices → 2 free installs, plus opt in for 1 extra (paid) install.
  214 |       // Total to allocate = 3; the paid unit is mandatory.
  215 |       await biometricPurchasePage.purchaseDevice({
  216 |         deviceQty: 2,
  217 |         recipientName: "Test Receiver",
  218 |         contactNo: "0123456789",
  219 |         shipToShowroom: true,
  220 |         additionalInstalls: 1,
  221 |       });
  222 | 
  223 |       // Paid/extra installations are allocated FIRST and are mandatory;
  224 |       // the free ones just have a booking deadline — they don't block
  225 |       // confirmation. So with 1 paid unit, booking 0 must be blocked,
  226 |       // and booking 1 (the paid unit) must be enough to proceed even
  227 |       // though the 2 free units remain unbooked.
  228 |       const total = await slotPicker.getAllocationTotal();
  229 |       expect(total).toBe(3);
  230 | 
  231 |       const targetDate = await slotPicker.findDateWithRoom(1);
  232 |       expect(targetDate).not.toBeNull();
  233 | 
  234 |       // Confirm with nothing booked — the mandatory paid unit is missing
  235 |       await slotPicker.confirmAppointment();
  236 |       expect(slotPicker.page.url()).not.toMatch(/submitted\.do/);
  237 | 
  238 |       // Book exactly 1 unit (the mandatory paid one) — the 2 free ones stay unbooked
  239 |       await slotPicker.allocateUnitsAnywhere(1, targetDate!);
  240 | 
  241 |       const allocated = await slotPicker.getAllocatedCount();
  242 |       expect(allocated).toBe(1);
  243 | 
  244 |       await slotPicker.confirmAppointment();
  245 |       expect(slotPicker.page.url()).toMatch(/submitted\.do/);
  246 |     });
  247 | 
  248 |     test("Two UCD - Select same last available slot", async ({
  249 |       softwareInstallationPage,
  250 |       slotPicker,
  251 |       browser,
  252 |     }) => {
  253 |       // Scout: find a date where morning specifically has room
  254 |       await softwareInstallationPage.purchaseInstallation(1);
  255 |       const targetDate = await slotPicker.findDateWithSlotRoom(MORNING, 1);
  256 |       expect(targetDate).not.toBeNull();
  257 | 
  258 |       await slotPicker.openSlotModal(targetDate!);
  259 |       let current = await slotPicker.getModalSlotBooked(MORNING);
  260 |       expect(current.max - current.booked).toBeGreaterThan(0);
  261 | 
  262 |       // Keep buying + booking 1 unit at a time into morning until exactly
  263 |       // 1 slot remains — whatever the starting point was
  264 |       while (current.max - current.booked > 1) {
  265 |         await slotPicker.incrementSlot(MORNING, 1);
  266 |         await slotPicker.saveSlotChanges();
  267 |         await slotPicker.confirmAppointment();
  268 | 
  269 |         await softwareInstallationPage.purchaseInstallation(1);
  270 |         await slotPicker.openSlotModal(targetDate!);
  271 |         current = await slotPicker.getModalSlotBooked(MORNING);
  272 |       }
  273 | 
  274 |       // Exactly 1 slot remains, and we have an unconfirmed purchase with
  275 |       // its modal already open — this is the "last" purchase attempting
  276 |       // to grab it
  277 |       const beforeBooked = current;
  278 |       expect(beforeBooked.booked).toBe(beforeBooked.max - 1);
  279 | 
  280 |       // UCD2: would book the same last slot in a parallel context
  281 |       // NOTE: requires second UCD account (ENV.ucd2Username / ENV.ucd2Password)
  282 | 
  283 |       await slotPicker.incrementSlot(MORNING, 1);
  284 |       await slotPicker.saveSlotChanges();
```