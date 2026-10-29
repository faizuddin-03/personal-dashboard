# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: bo-calendar-limits.spec.ts >> BO Calendar & Limits >> BO book future date more than 2 months
- Location: tests\service-hub\specs\bo-calendar-limits.spec.ts:128:7

# Error details

```
Error: expect(received).toBe(expected) // Object.is equality

Expected: true
Received: false
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4] [cursor=pointer]: Back
      - generic [ref=e5]: "Appointment Month:"
      - textbox [ref=e6] [cursor=pointer]: July 2026
      - button "Search" [ref=e7]
      - generic [ref=e8]: "|"
      - button "Add Appointment" [ref=e9]
    - generic [ref=e10]: Appointment Calendar
    - table [ref=e11]:
      - rowgroup [ref=e12]:
        - row "Date 10:00am - 12:00pm 2:00pm - 4:00pm" [ref=e13]:
          - columnheader "Date" [ref=e14]
          - columnheader "10:00am - 12:00pm" [ref=e15]
          - columnheader "2:00pm - 4:00pm" [ref=e16]
      - rowgroup [ref=e17]:
        - row "01-07-2026 Morning - 0 Afternoon - 0" [ref=e18]:
          - cell "01-07-2026 Morning - 0 Afternoon - 0" [ref=e19]:
            - text: 01-07-2026
            - generic [ref=e20]: Morning - 0
            - generic [ref=e21]: Afternoon - 0
          - cell [ref=e22]
          - cell [ref=e23]
        - row "02-07-2026 Morning - 0 Afternoon - 0" [ref=e24]:
          - cell "02-07-2026 Morning - 0 Afternoon - 0" [ref=e25]:
            - text: 02-07-2026
            - generic [ref=e26]: Morning - 0
            - generic [ref=e27]: Afternoon - 0
          - cell [ref=e28]
          - cell [ref=e29]
        - row "03-07-2026 Morning - 0 Afternoon - 0" [ref=e30]:
          - cell "03-07-2026 Morning - 0 Afternoon - 0" [ref=e31]:
            - text: 03-07-2026
            - generic [ref=e32]: Morning - 0
            - generic [ref=e33]: Afternoon - 0
          - cell [ref=e34]
          - cell [ref=e35]
        - row "04-07-2026 - -" [ref=e36]:
          - cell "04-07-2026" [ref=e37]
          - cell "-" [ref=e38]
          - cell "-" [ref=e39]
        - row "05-07-2026 - -" [ref=e40]:
          - cell "05-07-2026" [ref=e41]
          - cell "-" [ref=e42]
          - cell "-" [ref=e43]
        - row "06-07-2026 Morning - 0 Afternoon - 0" [ref=e44]:
          - cell "06-07-2026 Morning - 0 Afternoon - 0" [ref=e45]:
            - text: 06-07-2026
            - generic [ref=e46]: Morning - 0
            - generic [ref=e47]: Afternoon - 0
          - cell [ref=e48]
          - cell [ref=e49]
        - row "07-07-2026 Morning - 0 Afternoon - 0" [ref=e50]:
          - cell "07-07-2026 Morning - 0 Afternoon - 0" [ref=e51]:
            - text: 07-07-2026
            - generic [ref=e52]: Morning - 0
            - generic [ref=e53]: Afternoon - 0
          - cell [ref=e54]
          - cell [ref=e55]
        - row "08-07-2026 Morning - 0 Afternoon - 0" [ref=e56]:
          - cell "08-07-2026 Morning - 0 Afternoon - 0" [ref=e57]:
            - text: 08-07-2026
            - generic [ref=e58]: Morning - 0
            - generic [ref=e59]: Afternoon - 0
          - cell [ref=e60]
          - cell [ref=e61]
        - row "09-07-2026 Morning - 0 Afternoon - 0" [ref=e62]:
          - cell "09-07-2026 Morning - 0 Afternoon - 0" [ref=e63]:
            - text: 09-07-2026
            - generic [ref=e64]: Morning - 0
            - generic [ref=e65]: Afternoon - 0
          - cell [ref=e66]
          - cell [ref=e67]
        - row "10-07-2026 Morning - 0 Afternoon - 0" [ref=e68]:
          - cell "10-07-2026 Morning - 0 Afternoon - 0" [ref=e69]:
            - text: 10-07-2026
            - generic [ref=e70]: Morning - 0
            - generic [ref=e71]: Afternoon - 0
          - cell [ref=e72]
          - cell [ref=e73]
        - row "11-07-2026 - -" [ref=e74]:
          - cell "11-07-2026" [ref=e75]
          - cell "-" [ref=e76]
          - cell "-" [ref=e77]
        - row "12-07-2026 - -" [ref=e78]:
          - cell "12-07-2026" [ref=e79]
          - cell "-" [ref=e80]
          - cell "-" [ref=e81]
        - row "13-07-2026 Morning - 0 Afternoon - 0" [ref=e82]:
          - cell "13-07-2026 Morning - 0 Afternoon - 0" [ref=e83]:
            - text: 13-07-2026
            - generic [ref=e84]: Morning - 0
            - generic [ref=e85]: Afternoon - 0
          - cell [ref=e86]
          - cell [ref=e87]
        - row "14-07-2026 Morning - 0 Afternoon - 0" [ref=e88]:
          - cell "14-07-2026 Morning - 0 Afternoon - 0" [ref=e89]:
            - text: 14-07-2026
            - generic [ref=e90]: Morning - 0
            - generic [ref=e91]: Afternoon - 0
          - cell [ref=e92]
          - cell [ref=e93]
        - row "15-07-2026 Morning - 0 Afternoon - 0" [ref=e94]:
          - cell "15-07-2026 Morning - 0 Afternoon - 0" [ref=e95]:
            - text: 15-07-2026
            - generic [ref=e96]: Morning - 0
            - generic [ref=e97]: Afternoon - 0
          - cell [ref=e98]
          - cell [ref=e99]
        - row "16-07-2026 Morning - 0 Afternoon - 0" [ref=e100]:
          - cell "16-07-2026 Morning - 0 Afternoon - 0" [ref=e101]:
            - text: 16-07-2026
            - generic [ref=e102]: Morning - 0
            - generic [ref=e103]: Afternoon - 0
          - cell [ref=e104]
          - cell [ref=e105]
        - row "17-07-2026 Morning - 0 Afternoon - 0" [ref=e106]:
          - cell "17-07-2026 Morning - 0 Afternoon - 0" [ref=e107]:
            - text: 17-07-2026
            - generic [ref=e108]: Morning - 0
            - generic [ref=e109]: Afternoon - 0
          - cell [ref=e110]
          - cell [ref=e111]
        - row "18-07-2026 - -" [ref=e112]:
          - cell "18-07-2026" [ref=e113]
          - cell "-" [ref=e114]
          - cell "-" [ref=e115]
        - row "19-07-2026 - -" [ref=e116]:
          - cell "19-07-2026" [ref=e117]
          - cell "-" [ref=e118]
          - cell "-" [ref=e119]
        - row "20-07-2026 Morning - 1 Afternoon - 3 (Full) Reschedule 1. 193 AUTO TRADING Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e120]:
          - cell "20-07-2026 Morning - 1 Afternoon - 3 (Full)" [ref=e121]:
            - text: 20-07-2026
            - generic [ref=e122]: Morning - 1
            - generic [ref=e123]: Afternoon - 3 (Full)
          - cell "Reschedule 1. 193 AUTO TRADING" [ref=e124]:
            - list [ref=e125]:
              - listitem [ref=e126]:
                - generic [ref=e127] [cursor=pointer]: Reschedule
                - text: 1. 193 AUTO TRADING
          - cell "Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e128]:
            - list [ref=e129]:
              - listitem [ref=e130]:
                - generic [ref=e131] [cursor=pointer]: Reschedule
                - text: 1. MUSICHOB SDN BHD
              - listitem [ref=e132]:
                - generic [ref=e133] [cursor=pointer]: Reschedule
                - text: 2. MUSICHOB SDN BHD
              - listitem [ref=e134]:
                - generic [ref=e135] [cursor=pointer]: Reschedule
                - text: 3. MUSICHOB SDN BHD
        - row "21-07-2026 Morning - 3 (Full) Afternoon - 3 (Full) 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e136]:
          - cell "21-07-2026 Morning - 3 (Full) Afternoon - 3 (Full)" [ref=e137]:
            - text: 21-07-2026
            - generic [ref=e138]: Morning - 3 (Full)
            - generic [ref=e139]: Afternoon - 3 (Full)
          - cell "1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e140]:
            - list [ref=e141]:
              - listitem [ref=e142]: 1. MUSICHOB SDN BHD
              - listitem [ref=e143]:
                - generic [ref=e144] [cursor=pointer]: Reschedule
                - text: 2. MUSICHOB SDN BHD
              - listitem [ref=e145]:
                - generic [ref=e146] [cursor=pointer]: Reschedule
                - text: 3. MUSICHOB SDN BHD
          - cell "Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e147]:
            - list [ref=e148]:
              - listitem [ref=e149]:
                - generic [ref=e150] [cursor=pointer]: Reschedule
                - text: 1. MUSICHOB SDN BHD
              - listitem [ref=e151]:
                - generic [ref=e152] [cursor=pointer]: Reschedule
                - text: 2. MUSICHOB SDN BHD
              - listitem [ref=e153]:
                - generic [ref=e154] [cursor=pointer]: Reschedule
                - text: 3. MUSICHOB SDN BHD
        - row "22-07-2026 Morning - 0 Afternoon - 1 Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 1. FAIZUDDIN AUTO TEST" [ref=e155]:
          - cell "22-07-2026 Morning - 0 Afternoon - 1" [ref=e156]:
            - text: 22-07-2026
            - generic [ref=e157]: Morning - 0
            - generic [ref=e158]: Afternoon - 1
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST" [ref=e159]:
            - list [ref=e160]:
              - listitem [ref=e161]:
                - generic [ref=e162] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST" [ref=e163]:
            - list [ref=e164]:
              - listitem [ref=e165]:
                - generic [ref=e166] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
        - row "23-07-2026 Morning - 2 Afternoon - 0 Reschedule 1. JIMI HUUH Reschedule 2. FAIZUDDIN AUTO TEST" [ref=e167]:
          - cell "23-07-2026 Morning - 2 Afternoon - 0" [ref=e168]:
            - text: 23-07-2026
            - generic [ref=e169]: Morning - 2
            - generic [ref=e170]: Afternoon - 0
          - cell "Reschedule 1. JIMI HUUH Reschedule 2. FAIZUDDIN AUTO TEST" [ref=e171]:
            - list [ref=e172]:
              - listitem [ref=e173]:
                - generic [ref=e174] [cursor=pointer]: Reschedule
                - text: 1. JIMI HUUH
              - listitem [ref=e175]:
                - generic [ref=e176] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
          - cell [ref=e177]
        - row "24-07-2026 Morning - 0 Afternoon - 0" [ref=e178]:
          - cell "24-07-2026 Morning - 0 Afternoon - 0" [ref=e179]:
            - text: 24-07-2026
            - generic [ref=e180]: Morning - 0
            - generic [ref=e181]: Afternoon - 0
          - cell [ref=e182]
          - cell [ref=e183]
        - row "25-07-2026 - -" [ref=e184]:
          - cell "25-07-2026" [ref=e185]
          - cell "-" [ref=e186]
          - cell "-" [ref=e187]
        - row "26-07-2026 - -" [ref=e188]:
          - cell "26-07-2026" [ref=e189]
          - cell "-" [ref=e190]
          - cell "-" [ref=e191]
        - row "27-07-2026 Morning - 0 Afternoon - 0" [ref=e192]:
          - cell "27-07-2026 Morning - 0 Afternoon - 0" [ref=e193]:
            - text: 27-07-2026
            - generic [ref=e194]: Morning - 0
            - generic [ref=e195]: Afternoon - 0
          - cell [ref=e196]
          - cell [ref=e197]
        - row "28-07-2026 Morning - 0 Afternoon - 0" [ref=e198]:
          - cell "28-07-2026 Morning - 0 Afternoon - 0" [ref=e199]:
            - text: 28-07-2026
            - generic [ref=e200]: Morning - 0
            - generic [ref=e201]: Afternoon - 0
          - cell [ref=e202]
          - cell [ref=e203]
        - row "29-07-2026 Morning - 0 Afternoon - 0" [ref=e204]:
          - cell "29-07-2026 Morning - 0 Afternoon - 0" [ref=e205]:
            - text: 29-07-2026
            - generic [ref=e206]: Morning - 0
            - generic [ref=e207]: Afternoon - 0
          - cell [ref=e208]
          - cell [ref=e209]
        - row "30-07-2026 Morning - 0 Afternoon - 0" [ref=e210]:
          - cell "30-07-2026 Morning - 0 Afternoon - 0" [ref=e211]:
            - text: 30-07-2026
            - generic [ref=e212]: Morning - 0
            - generic [ref=e213]: Afternoon - 0
          - cell [ref=e214]
          - cell [ref=e215]
        - row "31-07-2026 Morning - 1 Afternoon - 2 Reschedule 1. MUSICHOB SDN BHD Reschedule 1. JIMI HUUH Reschedule 2. MUSICHOB SDN BHD" [ref=e216]:
          - cell "31-07-2026 Morning - 1 Afternoon - 2" [ref=e217]:
            - text: 31-07-2026
            - generic [ref=e218]: Morning - 1
            - generic [ref=e219]: Afternoon - 2
          - cell "Reschedule 1. MUSICHOB SDN BHD" [ref=e220]:
            - list [ref=e221]:
              - listitem [ref=e222]:
                - generic [ref=e223] [cursor=pointer]: Reschedule
                - text: 1. MUSICHOB SDN BHD
          - cell "Reschedule 1. JIMI HUUH Reschedule 2. MUSICHOB SDN BHD" [ref=e224]:
            - list [ref=e225]:
              - listitem [ref=e226]:
                - generic [ref=e227] [cursor=pointer]: Reschedule
                - text: 1. JIMI HUUH
              - listitem [ref=e228]:
                - generic [ref=e229] [cursor=pointer]: Reschedule
                - text: 2. MUSICHOB SDN BHD
  - table [ref=e231]:
    - rowgroup [ref=e232]:
      - row "Home | Menu 2 Pending Transaction Found! Jason Seah, My Account | Logout" [ref=e233]:
        - cell "Home | Menu 2 Pending Transaction Found!" [ref=e234]:
          - generic [ref=e235]:
            - list [ref=e236]:
              - listitem [ref=e237]:
                - link "Home |" [ref=e238] [cursor=pointer]:
                  - /url: /uat1/home/
              - listitem [ref=e239]:
                - link "Menu" [ref=e240] [cursor=pointer]:
                  - /url: "#"
                  - text: Menu
                  - img [ref=e241]
            - generic [ref=e242] [cursor=pointer]: 2 Pending Transaction Found!
        - cell "Jason Seah, My Account | Logout" [ref=e243]:
          - list [ref=e245]:
            - listitem [ref=e246]: Jason Seah,
            - listitem [ref=e247]:
              - link "My Account |" [ref=e248] [cursor=pointer]:
                - /url: /uat1/view/ucd/my-account/view.do?type=Office
            - listitem [ref=e249]:
              - link "Logout" [ref=e250] [cursor=pointer]:
                - /url: "#"
  - img [ref=e252]
  - table [ref=e254]:
    - rowgroup [ref=e255]:
      - row "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e256]:
        - cell [ref=e257]
        - cell "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e258]:
          - text: Best Compatible With Mozilla Firefox V36.0.4
          - text: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
          - link "Contact Us" [ref=e259] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Terms & Conditions" [ref=e260] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Privacy" [ref=e261] [cursor=pointer]:
            - /url: "#"
        - cell [ref=e262]:
          - img [ref=e263]
  - dialog "Add Appointment" [active] [ref=e265]:
    - generic [ref=e267]: Add Appointment
    - generic [ref=e268]:
      - generic [ref=e269]: Please enter the company name to add installation appointment.
      - generic [ref=e270]:
        - generic [ref=e271]: "Company Name*:"
        - generic [ref=e272]:
          - textbox [ref=e273]
          - button "Search" [ref=e274]
      - generic [ref=e275]:
        - generic [ref=e276]: "Reference No.*:"
        - generic [ref=e277]:
          - textbox [ref=e278]
          - button "Search" [ref=e279]
      - generic [ref=e280]:
        - generic [ref=e281]: "Appointment Date*:"
        - textbox [ref=e282]
      - generic [ref=e283]:
        - generic [ref=e284]: "Time Slot*:"
        - generic [ref=e285]:
          - generic [ref=e286]:
            - radio "10:00am - 12:00pm" [ref=e287]
            - text: 10:00am - 12:00pm
          - generic [ref=e288]:
            - radio "2:00pm - 4:00pm" [ref=e289]
            - text: 2:00pm - 4:00pm
    - generic [ref=e290]:
      - button "Confirm" [ref=e291] [cursor=pointer]
      - button "Cancel" [ref=e292] [cursor=pointer]
```

# Test source

```ts
  33  |   });
  34  | 
  35  |   test("BO add beyond morning slot limit", async ({ boCalendarPage }) => {
  36  |     await boCalendarPage.navigate();
  37  |     const booked = await boCalendarPage.addAppointment({ companyName: COMPANY, slot: MORNING });
  38  |     if (!booked) {
  39  |       test.skip(true, `No "${COMPANY}" company with unallocated units available to add.`);
  40  |       return;
  41  |     }
  42  |     await boCalendarPage.navigate();
  43  |     // Expected: CSE can proceed — the morning slot count reflects the add.
  44  |     expect(await boCalendarPage.getSlotCount(booked, MORNING)).toBeGreaterThan(0);
  45  |   });
  46  | 
  47  |   test("BO add beyond afternoon slot limit", async ({ boCalendarPage }) => {
  48  |     await boCalendarPage.navigate();
  49  |     const booked = await boCalendarPage.addAppointment({ companyName: COMPANY, slot: AFTERNOON });
  50  |     if (!booked) {
  51  |       test.skip(true, `No "${COMPANY}" company with unallocated units available to add.`);
  52  |       return;
  53  |     }
  54  |     await boCalendarPage.navigate();
  55  |     expect(await boCalendarPage.getSlotCount(booked, AFTERNOON)).toBeGreaterThan(0);
  56  |   });
  57  | 
  58  |   test("BO add beyond 6 days limit", async ({ boCalendarPage, browser }, testInfo) => {
  59  |     // Add the appointment as CSE, then OBSERVE it in every location the SRD
  60  |     // lists. Email is checked via its on-screen proxy (the UCD Service Request
  61  |     // Listing), per the agreed approach.
  62  |     let booked: string | null = null;
  63  |     await test.step("CSE adds the appointment (beyond the 6/day cap)", async () => {
  64  |       await boCalendarPage.navigate();
  65  |       booked = await boCalendarPage.addAppointment({ companyName: COMPANY, slot: MORNING });
  66  |     });
  67  |     if (!booked) {
  68  |       test.skip(true, `No "${COMPANY}" company with unallocated units available to add.`);
  69  |       return;
  70  |     }
  71  | 
  72  |     let ref: string | null = null;
  73  | 
  74  |     await test.step("Observe on BO Appointment Calendar — numbering continues", async () => {
  75  |       await boCalendarPage.navigate();
  76  |       // A positive count on the booked date/slot shows the numbered list
  77  |       // continued past the UCD cap (CSE is uncapped).
  78  |       expect(await boCalendarPage.getSlotCount(booked!, MORNING)).toBeGreaterThan(0);
  79  |     });
  80  | 
  81  |     await test.step("Observe on BO Biometric/SI Listing — reference present", async () => {
  82  |       const boListing = new (await import("../pages/bo/SoftwareInstallationListingPage")).SoftwareInstallationListingPage(boCalendarPage.page);
  83  |       await boListing.navigate();
  84  |       ref = await boListing.getLatestReferenceForCompany(COMPANY);
  85  |       expect(ref, "the added appointment should appear in the BO listing").not.toBeNull();
  86  |     });
  87  | 
  88  |     await test.step("Observe on UCD Service Request Listing (on-screen proxy for the email)", async () => {
  89  |       if (!ref) return; // nothing to look up
  90  |       const ucdCtx = await openTrackedContext(browser, testInfo);
  91  |       const ucdPage = await ucdCtx.newPage();
  92  |       try {
  93  |         const ucdLogin = new (await import("../pages/LoginPage")).LoginPage(ucdPage);
  94  |         const ucdListing = new (await import("../pages/ServiceRequestListingPage")).ServiceRequestListingPage(ucdPage);
  95  |         await ucdLogin.loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
  96  |         await ucdListing.navigate();
  97  |         await ucdListing.searchByReferenceNo(ref);
  98  |         const row = await ucdListing.findRowByRefNo(ref);
  99  |         // Best-effort: only assert when this UCD account owns the reference.
  100 |         if (row) {
  101 |           expect((await ucdListing.getRowServiceType(row)).length).toBeGreaterThan(0);
  102 |         }
  103 |       } finally {
  104 |         await closeTrackedContext(ucdCtx, testInfo, "UCD verifies listing");
  105 |       }
  106 |     });
  107 |   });
  108 | 
  109 |   test("BO add for current day and the next day", async ({ boCalendarPage }) => {
  110 |     await boCalendarPage.navigate();
  111 |     const dialog = await boCalendarPage.openAddDialog();
  112 |     await test.step("Expected: able to proceed with booking today and tomorrow", async () => {
  113 |       expect(await boCalendarPage.isAddDateSelectable(boCalendarPage.today())).toBe(true);
  114 |       expect(await boCalendarPage.isAddDateSelectable(boCalendarPage.daysFromToday(1))).toBe(true);
  115 |     });
  116 |     await boCalendarPage.closeAddDialog(dialog);
  117 |   });
  118 | 
  119 |   test("BO add for previous dates", async ({ boCalendarPage }) => {
  120 |     await boCalendarPage.navigate();
  121 |     const dialog = await boCalendarPage.openAddDialog();
  122 |     await test.step("Expected: a previous date is not selectable", async () => {
  123 |       expect(await boCalendarPage.isAddDateSelectable(boCalendarPage.yesterday())).toBe(false);
  124 |     });
  125 |     await boCalendarPage.closeAddDialog(dialog);
  126 |   });
  127 | 
  128 |   test("BO book future date more than 2 months", async ({ boCalendarPage }) => {
  129 |     await boCalendarPage.navigate();
  130 |     const dialog = await boCalendarPage.openAddDialog();
  131 |     const far = boCalendarPage.dateMonthsAhead(3);
  132 |     await test.step(`Expected: ${far} (>2 months out) CAN be booked by BO`, async () => {
> 133 |       expect(await boCalendarPage.isAddDateSelectable(far)).toBe(true);
      |                                                             ^ Error: expect(received).toBe(expected) // Object.is equality
  134 |     });
  135 |     await boCalendarPage.closeAddDialog(dialog);
  136 |   });
  137 | 
  138 |   test("BO book weekend dates", async ({ boCalendarPage }) => {
  139 |     await boCalendarPage.navigate();
  140 |     const dialog = await boCalendarPage.openAddDialog();
  141 |     const weekend = boCalendarPage.nextWeekend();
  142 |     await test.step(`Expected: weekend ${weekend} is greyed out / unclickable`, async () => {
  143 |       expect(await boCalendarPage.isAddDateSelectable(weekend)).toBe(false);
  144 |     });
  145 |     await boCalendarPage.closeAddDialog(dialog);
  146 |   });
  147 | 
  148 |   test("BO book Public Holiday", async ({ boCalendarPage }) => {
  149 |     const ph = ENV.publicHoliday;
  150 |     if (!ph) {
  151 |       test.skip(true, "No Public Holiday date provided — key one into the runner's Test data panel.");
  152 |       return;
  153 |     }
  154 |     await boCalendarPage.navigate();
  155 |     const dialog = await boCalendarPage.openAddDialog();
  156 |     await test.step(`Expected: public holiday ${ph} is greyed out / unclickable`, async () => {
  157 |       expect(await boCalendarPage.isAddDateSelectable(ph)).toBe(false);
  158 |     });
  159 |     await boCalendarPage.closeAddDialog(dialog);
  160 |   });
  161 | 
  162 |   // ── Reschedule-entry parity ──
  163 |   // The QA doc pairs every Add scenario above with a Reschedule one too —
  164 |   // these exercise the Reschedule dialog's OWN #ac-rs-date datepicker
  165 |   // (isRescheduleDateSelectable), rather than assuming it behaves the same
  166 |   // as Add's #ac-add-date.
  167 | 
  168 |   test("BO reschedule for current day and the next day", async ({ boCalendarPage }) => {
  169 |     await boCalendarPage.navigate();
  170 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  171 |     if (!dialog) {
  172 |       test.skip(true, "No listed appointment to reschedule in this month");
  173 |       return;
  174 |     }
  175 |     await test.step("Expected: able to reschedule into today and tomorrow", async () => {
  176 |       expect(await boCalendarPage.isRescheduleDateSelectable(boCalendarPage.today())).toBe(true);
  177 |       expect(await boCalendarPage.isRescheduleDateSelectable(boCalendarPage.daysFromToday(1))).toBe(true);
  178 |     });
  179 |     await boCalendarPage.closeRescheduleDialog(dialog);
  180 |   });
  181 | 
  182 |   test("BO reschedule for previous dates", async ({ boCalendarPage }) => {
  183 |     await boCalendarPage.navigate();
  184 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  185 |     if (!dialog) {
  186 |       test.skip(true, "No listed appointment to reschedule in this month");
  187 |       return;
  188 |     }
  189 |     await test.step("Expected: a previous date is not selectable", async () => {
  190 |       expect(await boCalendarPage.isRescheduleDateSelectable(boCalendarPage.yesterday())).toBe(false);
  191 |     });
  192 |     await boCalendarPage.closeRescheduleDialog(dialog);
  193 |   });
  194 | 
  195 |   test("BO reschedule future date more than 2 months", async ({ boCalendarPage }) => {
  196 |     await boCalendarPage.navigate();
  197 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  198 |     if (!dialog) {
  199 |       test.skip(true, "No listed appointment to reschedule in this month");
  200 |       return;
  201 |     }
  202 |     const far = boCalendarPage.dateMonthsAhead(3);
  203 |     await test.step(`Expected: ${far} (>2 months out) CAN be rescheduled into by BO`, async () => {
  204 |       expect(await boCalendarPage.isRescheduleDateSelectable(far)).toBe(true);
  205 |     });
  206 |     await boCalendarPage.closeRescheduleDialog(dialog);
  207 |   });
  208 | 
  209 |   test("BO reschedule weekend dates", async ({ boCalendarPage }) => {
  210 |     await boCalendarPage.navigate();
  211 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  212 |     if (!dialog) {
  213 |       test.skip(true, "No listed appointment to reschedule in this month");
  214 |       return;
  215 |     }
  216 |     const weekend = boCalendarPage.nextWeekend();
  217 |     await test.step(`Expected: weekend ${weekend} is greyed out / unclickable`, async () => {
  218 |       expect(await boCalendarPage.isRescheduleDateSelectable(weekend)).toBe(false);
  219 |     });
  220 |     await boCalendarPage.closeRescheduleDialog(dialog);
  221 |   });
  222 | 
  223 |   test("BO reschedule Public Holiday", async ({ boCalendarPage }) => {
  224 |     const ph = ENV.publicHoliday;
  225 |     if (!ph) {
  226 |       test.skip(true, "No Public Holiday date provided — key one into the runner's Test data panel.");
  227 |       return;
  228 |     }
  229 |     await boCalendarPage.navigate();
  230 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  231 |     if (!dialog) {
  232 |       test.skip(true, "No listed appointment to reschedule in this month");
  233 |       return;
```