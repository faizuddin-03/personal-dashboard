# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: bo-calendar-limits.spec.ts >> BO Calendar & Limits >> BO reschedule for current day and the next day
- Location: tests\service-hub\specs\bo-calendar-limits.spec.ts:168:7

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
        - row "20-07-2026 Morning - 3 (Full) Afternoon - 3 (Full) Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. 193 AUTO TRADING Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e120]:
          - cell "20-07-2026 Morning - 3 (Full) Afternoon - 3 (Full)" [ref=e121]:
            - text: 20-07-2026
            - generic [ref=e122]: Morning - 3 (Full)
            - generic [ref=e123]: Afternoon - 3 (Full)
          - cell "Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. 193 AUTO TRADING" [ref=e124]:
            - list [ref=e125]:
              - listitem [ref=e126]:
                - generic [ref=e127] [cursor=pointer]: Reschedule
                - text: 1. MUSICHOB SDN BHD
              - listitem [ref=e128]:
                - generic [ref=e129] [cursor=pointer]: Reschedule
                - text: 2. MUSICHOB SDN BHD
              - listitem [ref=e130]:
                - generic [ref=e131] [cursor=pointer]: Reschedule
                - text: 3. 193 AUTO TRADING
          - cell "Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e132]:
            - list [ref=e133]:
              - listitem [ref=e134]:
                - generic [ref=e135] [cursor=pointer]: Reschedule
                - text: 1. MUSICHOB SDN BHD
              - listitem [ref=e136]:
                - generic [ref=e137] [cursor=pointer]: Reschedule
                - text: 2. MUSICHOB SDN BHD
              - listitem [ref=e138]:
                - generic [ref=e139] [cursor=pointer]: Reschedule
                - text: 3. MUSICHOB SDN BHD
        - row "21-07-2026 Morning - 3 (Full) Afternoon - 3 (Full) 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e140]:
          - cell "21-07-2026 Morning - 3 (Full) Afternoon - 3 (Full)" [ref=e141]:
            - text: 21-07-2026
            - generic [ref=e142]: Morning - 3 (Full)
            - generic [ref=e143]: Afternoon - 3 (Full)
          - cell "1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e144]:
            - list [ref=e145]:
              - listitem [ref=e146]: 1. MUSICHOB SDN BHD
              - listitem [ref=e147]:
                - generic [ref=e148] [cursor=pointer]: Reschedule
                - text: 2. MUSICHOB SDN BHD
              - listitem [ref=e149]:
                - generic [ref=e150] [cursor=pointer]: Reschedule
                - text: 3. MUSICHOB SDN BHD
          - cell "Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e151]:
            - list [ref=e152]:
              - listitem [ref=e153]:
                - generic [ref=e154] [cursor=pointer]: Reschedule
                - text: 1. MUSICHOB SDN BHD
              - listitem [ref=e155]:
                - generic [ref=e156] [cursor=pointer]: Reschedule
                - text: 2. MUSICHOB SDN BHD
              - listitem [ref=e157]:
                - generic [ref=e158] [cursor=pointer]: Reschedule
                - text: 3. MUSICHOB SDN BHD
        - row "22-07-2026 Morning - 0 Afternoon - 1 Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 1. FAIZUDDIN AUTO TEST" [ref=e159]:
          - cell "22-07-2026 Morning - 0 Afternoon - 1" [ref=e160]:
            - text: 22-07-2026
            - generic [ref=e161]: Morning - 0
            - generic [ref=e162]: Afternoon - 1
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST" [ref=e163]:
            - list [ref=e164]:
              - listitem [ref=e165]:
                - generic [ref=e166] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST" [ref=e167]:
            - list [ref=e168]:
              - listitem [ref=e169]:
                - generic [ref=e170] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
        - row "23-07-2026 Morning - 1 Afternoon - 0 Reschedule 1. JIMI HUUH" [ref=e171]:
          - cell "23-07-2026 Morning - 1 Afternoon - 0" [ref=e172]:
            - text: 23-07-2026
            - generic [ref=e173]: Morning - 1
            - generic [ref=e174]: Afternoon - 0
          - cell "Reschedule 1. JIMI HUUH" [ref=e175]:
            - list [ref=e176]:
              - listitem [ref=e177]:
                - generic [ref=e178] [cursor=pointer]: Reschedule
                - text: 1. JIMI HUUH
          - cell [ref=e179]
        - row "24-07-2026 Morning - 0 Afternoon - 0" [ref=e180]:
          - cell "24-07-2026 Morning - 0 Afternoon - 0" [ref=e181]:
            - text: 24-07-2026
            - generic [ref=e182]: Morning - 0
            - generic [ref=e183]: Afternoon - 0
          - cell [ref=e184]
          - cell [ref=e185]
        - row "25-07-2026 - -" [ref=e186]:
          - cell "25-07-2026" [ref=e187]
          - cell "-" [ref=e188]
          - cell "-" [ref=e189]
        - row "26-07-2026 - -" [ref=e190]:
          - cell "26-07-2026" [ref=e191]
          - cell "-" [ref=e192]
          - cell "-" [ref=e193]
        - row "27-07-2026 Morning - 0 Afternoon - 0" [ref=e194]:
          - cell "27-07-2026 Morning - 0 Afternoon - 0" [ref=e195]:
            - text: 27-07-2026
            - generic [ref=e196]: Morning - 0
            - generic [ref=e197]: Afternoon - 0
          - cell [ref=e198]
          - cell [ref=e199]
        - row "28-07-2026 Morning - 0 Afternoon - 0" [ref=e200]:
          - cell "28-07-2026 Morning - 0 Afternoon - 0" [ref=e201]:
            - text: 28-07-2026
            - generic [ref=e202]: Morning - 0
            - generic [ref=e203]: Afternoon - 0
          - cell [ref=e204]
          - cell [ref=e205]
        - row "29-07-2026 Morning - 0 Afternoon - 0" [ref=e206]:
          - cell "29-07-2026 Morning - 0 Afternoon - 0" [ref=e207]:
            - text: 29-07-2026
            - generic [ref=e208]: Morning - 0
            - generic [ref=e209]: Afternoon - 0
          - cell [ref=e210]
          - cell [ref=e211]
        - row "30-07-2026 Morning - 0 Afternoon - 0" [ref=e212]:
          - cell "30-07-2026 Morning - 0 Afternoon - 0" [ref=e213]:
            - text: 30-07-2026
            - generic [ref=e214]: Morning - 0
            - generic [ref=e215]: Afternoon - 0
          - cell [ref=e216]
          - cell [ref=e217]
        - row "31-07-2026 Morning - 0 Afternoon - 0" [ref=e218]:
          - cell "31-07-2026 Morning - 0 Afternoon - 0" [ref=e219]:
            - text: 31-07-2026
            - generic [ref=e220]: Morning - 0
            - generic [ref=e221]: Afternoon - 0
          - cell [ref=e222]
          - cell [ref=e223]
  - table [ref=e225]:
    - rowgroup [ref=e226]:
      - row "Home | Menu 2 Pending Transaction Found! Jason Seah, My Account | Logout" [ref=e227]:
        - cell "Home | Menu 2 Pending Transaction Found!" [ref=e228]:
          - generic [ref=e229]:
            - list [ref=e230]:
              - listitem [ref=e231]:
                - link "Home |" [ref=e232] [cursor=pointer]:
                  - /url: /uat1/home/
              - listitem [ref=e233]:
                - link "Menu" [ref=e234] [cursor=pointer]:
                  - /url: "#"
                  - text: Menu
                  - img [ref=e235]
            - generic [ref=e236] [cursor=pointer]: 2 Pending Transaction Found!
        - cell "Jason Seah, My Account | Logout" [ref=e237]:
          - list [ref=e239]:
            - listitem [ref=e240]: Jason Seah,
            - listitem [ref=e241]:
              - link "My Account |" [ref=e242] [cursor=pointer]:
                - /url: /uat1/view/ucd/my-account/view.do?type=Office
            - listitem [ref=e243]:
              - link "Logout" [ref=e244] [cursor=pointer]:
                - /url: "#"
  - img [ref=e246]
  - table [ref=e248]:
    - rowgroup [ref=e249]:
      - row "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e250]:
        - cell [ref=e251]
        - cell "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e252]:
          - text: Best Compatible With Mozilla Firefox V36.0.4
          - text: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
          - link "Contact Us" [ref=e253] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Terms & Conditions" [ref=e254] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Privacy" [ref=e255] [cursor=pointer]:
            - /url: "#"
        - cell [ref=e256]:
          - img [ref=e257]
  - dialog "Reschedule Appointment" [active] [ref=e259]:
    - generic [ref=e261]: Reschedule Appointment
    - generic [ref=e262]:
      - generic [ref=e263]:
        - generic [ref=e264]: "Company Name:"
        - text: MUSICHOB SDN BHD
      - generic [ref=e265]:
        - generic [ref=e266]: "Installation Status:"
        - text: Pending
      - generic [ref=e267]:
        - generic [ref=e268]: "Installation Service Reference No.:"
        - text: SR67000010
      - generic [ref=e269]:
        - generic [ref=e270]: "Current Appointment Date:"
        - text: 20-07-2026 10:00am - 12:00pm
      - generic [ref=e271]:
        - generic [ref=e272]: "New Appointment Date*:"
        - textbox [ref=e273]
      - generic [ref=e274]:
        - generic [ref=e275]: "Time Slot*:"
        - generic [ref=e276]:
          - generic [ref=e277]:
            - radio "10:00am - 12:00pm" [ref=e278]
            - text: 10:00am - 12:00pm
          - generic [ref=e279]:
            - radio "2:00pm - 4:00pm" [ref=e280]
            - text: 2:00pm - 4:00pm
    - generic [ref=e281]:
      - button "Confirm" [ref=e282] [cursor=pointer]
      - button "Cancel" [ref=e283] [cursor=pointer]
```

# Test source

```ts
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
  133 |       expect(await boCalendarPage.isAddDateSelectable(far)).toBe(true);
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
> 177 |       expect(await boCalendarPage.isRescheduleDateSelectable(boCalendarPage.daysFromToday(1))).toBe(true);
      |                                                                                                ^ Error: expect(received).toBe(expected) // Object.is equality
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
  234 |     }
  235 |     await test.step(`Expected: public holiday ${ph} is greyed out / unclickable`, async () => {
  236 |       expect(await boCalendarPage.isRescheduleDateSelectable(ph)).toBe(false);
  237 |     });
  238 |     await boCalendarPage.closeRescheduleDialog(dialog);
  239 |   });
  240 | 
  241 |   test("BO reschedule beyond morning slot limit", async ({ boCalendarPage }) => {
  242 |     await boCalendarPage.navigate();
  243 |     const fullLabel = await boCalendarPage.findDateWithSlotFull(MORNING);
  244 |     if (!fullLabel) {
  245 |       test.skip(true, "No date with a full morning session available.");
  246 |       return;
  247 |     }
  248 |     const [d, m, y] = fullLabel.split("-");
  249 |     const iso = `${y}-${m}-${d}`;
  250 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  251 |     if (!dialog) {
  252 |       test.skip(true, "No listed appointment to reschedule in this month");
  253 |       return;
  254 |     }
  255 |     await test.step(`Expected: CSE can still reschedule into ${fullLabel} despite the morning session being full`, async () => {
  256 |       expect(await boCalendarPage.isRescheduleDateSelectable(iso)).toBe(true);
  257 |     });
  258 |     await boCalendarPage.closeRescheduleDialog(dialog);
  259 |   });
  260 | 
  261 |   test("BO reschedule beyond afternoon slot limit", async ({ boCalendarPage }) => {
  262 |     await boCalendarPage.navigate();
  263 |     const fullLabel = await boCalendarPage.findDateWithSlotFull(AFTERNOON);
  264 |     if (!fullLabel) {
  265 |       test.skip(true, "No date with a full afternoon session available.");
  266 |       return;
  267 |     }
  268 |     const [d, m, y] = fullLabel.split("-");
  269 |     const iso = `${y}-${m}-${d}`;
  270 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  271 |     if (!dialog) {
  272 |       test.skip(true, "No listed appointment to reschedule in this month");
  273 |       return;
  274 |     }
  275 |     await test.step(`Expected: CSE can still reschedule into ${fullLabel} despite the afternoon session being full`, async () => {
  276 |       expect(await boCalendarPage.isRescheduleDateSelectable(iso)).toBe(true);
  277 |     });
```