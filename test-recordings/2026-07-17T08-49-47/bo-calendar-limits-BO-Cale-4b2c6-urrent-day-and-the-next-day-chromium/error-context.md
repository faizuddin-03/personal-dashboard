# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: bo-calendar-limits.spec.ts >> BO Calendar & Limits >> BO add for current day and the next day
- Location: tests\service-hub\specs\bo-calendar-limits.spec.ts:124:7

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
        - row "20-07-2026 Morning - 5 (Full) Afternoon - 3 (Full) Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. 193 AUTO TRADING Reschedule 5. FAIZUDDIN AUTO TEST Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e120]:
          - cell "20-07-2026 Morning - 5 (Full) Afternoon - 3 (Full)" [ref=e121]:
            - text: 20-07-2026
            - generic [ref=e122]: Morning - 5 (Full)
            - generic [ref=e123]: Afternoon - 3 (Full)
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. 193 AUTO TRADING Reschedule 5. FAIZUDDIN AUTO TEST" [ref=e124]:
            - list [ref=e125]:
              - listitem [ref=e126]:
                - generic [ref=e127] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e128]:
                - generic [ref=e129] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e130]:
                - generic [ref=e131] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e132]:
                - generic [ref=e133] [cursor=pointer]: Reschedule
                - text: 4. 193 AUTO TRADING
              - listitem [ref=e134]:
                - generic [ref=e135] [cursor=pointer]: Reschedule
                - text: 5. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e136]:
            - list [ref=e137]:
              - listitem [ref=e138]:
                - generic [ref=e139] [cursor=pointer]: Reschedule
                - text: 1. MUSICHOB SDN BHD
              - listitem [ref=e140]:
                - generic [ref=e141] [cursor=pointer]: Reschedule
                - text: 2. MUSICHOB SDN BHD
              - listitem [ref=e142]:
                - generic [ref=e143] [cursor=pointer]: Reschedule
                - text: 3. MUSICHOB SDN BHD
        - row "21-07-2026 Morning - 6 (Full) Afternoon - 3 (Full) 1. MUSICHOB SDN BHD Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. MUSICHOB SDN BHD Reschedule 5. FAIZUDDIN AUTO TEST Reschedule 6. MUSICHOB SDN BHD Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e144]:
          - cell "21-07-2026 Morning - 6 (Full) Afternoon - 3 (Full)" [ref=e145]:
            - text: 21-07-2026
            - generic [ref=e146]: Morning - 6 (Full)
            - generic [ref=e147]: Afternoon - 3 (Full)
          - cell "1. MUSICHOB SDN BHD Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. MUSICHOB SDN BHD Reschedule 5. FAIZUDDIN AUTO TEST Reschedule 6. MUSICHOB SDN BHD" [ref=e148]:
            - list [ref=e149]:
              - listitem [ref=e150]: 1. MUSICHOB SDN BHD
              - listitem [ref=e151]:
                - generic [ref=e152] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e153]:
                - generic [ref=e154] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e155]:
                - generic [ref=e156] [cursor=pointer]: Reschedule
                - text: 4. MUSICHOB SDN BHD
              - listitem [ref=e157]:
                - generic [ref=e158] [cursor=pointer]: Reschedule
                - text: 5. FAIZUDDIN AUTO TEST
              - listitem [ref=e159]:
                - generic [ref=e160] [cursor=pointer]: Reschedule
                - text: 6. MUSICHOB SDN BHD
          - cell "Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e161]:
            - list [ref=e162]:
              - listitem [ref=e163]:
                - generic [ref=e164] [cursor=pointer]: Reschedule
                - text: 1. MUSICHOB SDN BHD
              - listitem [ref=e165]:
                - generic [ref=e166] [cursor=pointer]: Reschedule
                - text: 2. MUSICHOB SDN BHD
              - listitem [ref=e167]:
                - generic [ref=e168] [cursor=pointer]: Reschedule
                - text: 3. MUSICHOB SDN BHD
        - row "22-07-2026 Morning - 3 (Full) Afternoon - 2 Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. JIMI HUUH Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 2. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 3. FAIZUDDIN AUTO TEST" [ref=e169]:
          - cell "22-07-2026 Morning - 3 (Full) Afternoon - 2" [ref=e170]:
            - text: 22-07-2026
            - generic [ref=e171]: Morning - 3 (Full)
            - generic [ref=e172]: Afternoon - 2
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. JIMI HUUH Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST" [ref=e173]:
            - list [ref=e174]:
              - listitem [ref=e175]:
                - generic [ref=e176] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e177]:
                - generic [ref=e178] [cursor=pointer]: Reschedule
                - text: 2. JIMI HUUH
              - listitem [ref=e179]:
                - generic [ref=e180] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e181]:
                - generic [ref=e182] [cursor=pointer]: Reschedule
                - text: 4. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 2. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 3. FAIZUDDIN AUTO TEST" [ref=e183]:
            - list [ref=e184]:
              - listitem [ref=e185]:
                - generic [ref=e186] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
              - listitem [ref=e187]:
                - generic [ref=e188] [cursor=pointer]: Reschedule
                - text: 2. CHARRRRRR CHICKCOLI SDN BHD123321
              - listitem [ref=e189]:
                - generic [ref=e190] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
        - row "23-07-2026 Morning - 2 Afternoon - 3 (Full) Reschedule 1. JIMI HUUH Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST" [ref=e191]:
          - cell "23-07-2026 Morning - 2 Afternoon - 3 (Full)" [ref=e192]:
            - text: 23-07-2026
            - generic [ref=e193]: Morning - 2
            - generic [ref=e194]: Afternoon - 3 (Full)
          - cell "Reschedule 1. JIMI HUUH Reschedule 2. FAIZUDDIN AUTO TEST" [ref=e195]:
            - list [ref=e196]:
              - listitem [ref=e197]:
                - generic [ref=e198] [cursor=pointer]: Reschedule
                - text: 1. JIMI HUUH
              - listitem [ref=e199]:
                - generic [ref=e200] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST" [ref=e201]:
            - list [ref=e202]:
              - listitem [ref=e203]:
                - generic [ref=e204] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e205]:
                - generic [ref=e206] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e207]:
                - generic [ref=e208] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
        - row "24-07-2026 Morning - 0 Afternoon - 0" [ref=e209]:
          - cell "24-07-2026 Morning - 0 Afternoon - 0" [ref=e210]:
            - text: 24-07-2026
            - generic [ref=e211]: Morning - 0
            - generic [ref=e212]: Afternoon - 0
          - cell [ref=e213]
          - cell [ref=e214]
        - row "25-07-2026 - -" [ref=e215]:
          - cell "25-07-2026" [ref=e216]
          - cell "-" [ref=e217]
          - cell "-" [ref=e218]
        - row "26-07-2026 - -" [ref=e219]:
          - cell "26-07-2026" [ref=e220]
          - cell "-" [ref=e221]
          - cell "-" [ref=e222]
        - row "27-07-2026 Morning - 0 Afternoon - 0" [ref=e223]:
          - cell "27-07-2026 Morning - 0 Afternoon - 0" [ref=e224]:
            - text: 27-07-2026
            - generic [ref=e225]: Morning - 0
            - generic [ref=e226]: Afternoon - 0
          - cell [ref=e227]
          - cell [ref=e228]
        - row "28-07-2026 Morning - 0 Afternoon - 0" [ref=e229]:
          - cell "28-07-2026 Morning - 0 Afternoon - 0" [ref=e230]:
            - text: 28-07-2026
            - generic [ref=e231]: Morning - 0
            - generic [ref=e232]: Afternoon - 0
          - cell [ref=e233]
          - cell [ref=e234]
        - row "29-07-2026 Morning - 0 Afternoon - 0" [ref=e235]:
          - cell "29-07-2026 Morning - 0 Afternoon - 0" [ref=e236]:
            - text: 29-07-2026
            - generic [ref=e237]: Morning - 0
            - generic [ref=e238]: Afternoon - 0
          - cell [ref=e239]
          - cell [ref=e240]
        - row "30-07-2026 Morning - 0 Afternoon - 0" [ref=e241]:
          - cell "30-07-2026 Morning - 0 Afternoon - 0" [ref=e242]:
            - text: 30-07-2026
            - generic [ref=e243]: Morning - 0
            - generic [ref=e244]: Afternoon - 0
          - cell [ref=e245]
          - cell [ref=e246]
        - row "31-07-2026 Morning - 6 (Full) Afternoon - 3 (Full) Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. MUSICHOB SDN BHD Reschedule 6. FAIZUDDIN AUTO TEST Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. MUSICHOB SDN BHD" [ref=e247]:
          - cell "31-07-2026 Morning - 6 (Full) Afternoon - 3 (Full)" [ref=e248]:
            - text: 31-07-2026
            - generic [ref=e249]: Morning - 6 (Full)
            - generic [ref=e250]: Afternoon - 3 (Full)
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. MUSICHOB SDN BHD Reschedule 6. FAIZUDDIN AUTO TEST" [ref=e251]:
            - list [ref=e252]:
              - listitem [ref=e253]:
                - generic [ref=e254] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e255]:
                - generic [ref=e256] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e257]:
                - generic [ref=e258] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e259]:
                - generic [ref=e260] [cursor=pointer]: Reschedule
                - text: 4. FAIZUDDIN AUTO TEST
              - listitem [ref=e261]:
                - generic [ref=e262] [cursor=pointer]: Reschedule
                - text: 5. MUSICHOB SDN BHD
              - listitem [ref=e263]:
                - generic [ref=e264] [cursor=pointer]: Reschedule
                - text: 6. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. MUSICHOB SDN BHD" [ref=e265]:
            - list [ref=e266]:
              - listitem [ref=e267]:
                - generic [ref=e268] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e269]:
                - generic [ref=e270] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e271]:
                - generic [ref=e272] [cursor=pointer]: Reschedule
                - text: 3. MUSICHOB SDN BHD
  - table [ref=e274]:
    - rowgroup [ref=e275]:
      - row "Home | Menu 2 Pending Transaction Found! Jason Seah, My Account | Logout" [ref=e276]:
        - cell "Home | Menu 2 Pending Transaction Found!" [ref=e277]:
          - generic [ref=e278]:
            - list [ref=e279]:
              - listitem [ref=e280]:
                - link "Home |" [ref=e281] [cursor=pointer]:
                  - /url: /uat1/home/
              - listitem [ref=e282]:
                - link "Menu" [ref=e283] [cursor=pointer]:
                  - /url: "#"
                  - text: Menu
                  - img [ref=e284]
            - generic [ref=e285] [cursor=pointer]: 2 Pending Transaction Found!
        - cell "Jason Seah, My Account | Logout" [ref=e286]:
          - list [ref=e288]:
            - listitem [ref=e289]: Jason Seah,
            - listitem [ref=e290]:
              - link "My Account |" [ref=e291] [cursor=pointer]:
                - /url: /uat1/view/ucd/my-account/view.do?type=Office
            - listitem [ref=e292]:
              - link "Logout" [ref=e293] [cursor=pointer]:
                - /url: "#"
  - img [ref=e295]
  - table [ref=e297]:
    - rowgroup [ref=e298]:
      - row "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e299]:
        - cell [ref=e300]
        - cell "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e301]:
          - text: Best Compatible With Mozilla Firefox V36.0.4
          - text: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
          - link "Contact Us" [ref=e302] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Terms & Conditions" [ref=e303] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Privacy" [ref=e304] [cursor=pointer]:
            - /url: "#"
        - cell [ref=e305]:
          - img [ref=e306]
  - dialog "Add Appointment" [active] [ref=e308]:
    - generic [ref=e310]: Add Appointment
    - generic [ref=e311]:
      - generic [ref=e312]: Please enter the company name to add installation appointment.
      - generic [ref=e313]:
        - generic [ref=e314]: "Company Name*:"
        - generic [ref=e315]:
          - textbox [ref=e316]
          - button "Search" [ref=e317]
      - generic [ref=e318]:
        - generic [ref=e319]: "Reference No.*:"
        - generic [ref=e320]:
          - textbox [ref=e321]
          - button "Search" [ref=e322]
      - generic [ref=e323]:
        - generic [ref=e324]: "Appointment Date*:"
        - textbox [ref=e325]
      - generic [ref=e326]:
        - generic [ref=e327]: "Time Slot*:"
        - generic [ref=e328]:
          - generic [ref=e329]:
            - radio "10:00am - 12:00pm" [ref=e330]
            - text: 10:00am - 12:00pm
          - generic [ref=e331]:
            - radio "2:00pm - 4:00pm" [ref=e332]
            - text: 2:00pm - 4:00pm
    - generic [ref=e333]:
      - button "Confirm" [ref=e334] [cursor=pointer]
      - button "Cancel" [ref=e335] [cursor=pointer]
```

# Test source

```ts
  29  |  *     BO/CSE has no +2-day blackout and no 2-month window limit.
  30  |  */
  31  | test.describe("BO Calendar & Limits", () => {
  32  |   test.beforeEach(async ({ loginPage }) => {
  33  |     await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
  34  |   });
  35  | 
  36  |   test("BO add beyond morning slot limit", async ({ boCalendarPage, browser }, testInfo) => {
  37  |     const ref = await arrangeBdpReferenceViaUCD(browser, testInfo);
  38  |     if (!ref) {
  39  |       test.skip(true, "Could not arrange a fresh Biometric Device Purchase reference via UCD.");
  40  |       return;
  41  |     }
  42  |     await boCalendarPage.navigate();
  43  |     const booked = await boCalendarPage.addAppointment({ companyName: COMPANY, existingRecordRefNo: ref, slot: MORNING });
  44  |     if (!booked) {
  45  |       test.skip(true, `Could not add an appointment for reference ${ref}.`);
  46  |       return;
  47  |     }
  48  |     await boCalendarPage.navigate();
  49  |     // Expected: CSE can proceed — the morning slot count reflects the add.
  50  |     expect(await boCalendarPage.getSlotCount(booked, MORNING)).toBeGreaterThan(0);
  51  |   });
  52  | 
  53  |   test("BO add beyond afternoon slot limit", async ({ boCalendarPage, browser }, testInfo) => {
  54  |     const ref = await arrangeBdpReferenceViaUCD(browser, testInfo);
  55  |     if (!ref) {
  56  |       test.skip(true, "Could not arrange a fresh Biometric Device Purchase reference via UCD.");
  57  |       return;
  58  |     }
  59  |     await boCalendarPage.navigate();
  60  |     const booked = await boCalendarPage.addAppointment({ companyName: COMPANY, existingRecordRefNo: ref, slot: AFTERNOON });
  61  |     if (!booked) {
  62  |       test.skip(true, `Could not add an appointment for reference ${ref}.`);
  63  |       return;
  64  |     }
  65  |     await boCalendarPage.navigate();
  66  |     expect(await boCalendarPage.getSlotCount(booked, AFTERNOON)).toBeGreaterThan(0);
  67  |   });
  68  | 
  69  |   test("BO add beyond 6 days limit", async ({ boCalendarPage, browser }, testInfo) => {
  70  |     // Add the appointment as CSE, then OBSERVE it in every location the SRD
  71  |     // lists. Email is checked via its on-screen proxy (the UCD Service Request
  72  |     // Listing), per the agreed approach.
  73  |     const ref = await arrangeBdpReferenceViaUCD(browser, testInfo);
  74  |     if (!ref) {
  75  |       test.skip(true, "Could not arrange a fresh Biometric Device Purchase reference via UCD.");
  76  |       return;
  77  |     }
  78  | 
  79  |     let booked: string | null = null;
  80  |     await test.step("CSE adds the appointment (beyond the 6/day cap)", async () => {
  81  |       await boCalendarPage.navigate();
  82  |       booked = await boCalendarPage.addAppointment({ companyName: COMPANY, existingRecordRefNo: ref, slot: MORNING });
  83  |     });
  84  |     if (!booked) {
  85  |       test.skip(true, `Could not add an appointment for reference ${ref}.`);
  86  |       return;
  87  |     }
  88  | 
  89  |     await test.step("Observe on BO Appointment Calendar — numbering continues", async () => {
  90  |       await boCalendarPage.navigate();
  91  |       // A positive count on the booked date/slot shows the numbered list
  92  |       // continued past the UCD cap (CSE is uncapped).
  93  |       expect(await boCalendarPage.getSlotCount(booked!, MORNING)).toBeGreaterThan(0);
  94  |     });
  95  | 
  96  |     await test.step("Observe on BO Biometric/SI Listing — reference present", async () => {
  97  |       const boListing = new (await import("../pages/bo/SoftwareInstallationListingPage")).SoftwareInstallationListingPage(boCalendarPage.page);
  98  |       await boListing.navigate();
  99  |       await boListing.searchWithFilters({ referenceNo: ref });
  100 |       const rows = await boListing.getResultRows();
  101 |       expect(rows.length, "the added appointment should appear in the BO listing").toBeGreaterThan(0);
  102 |     });
  103 | 
  104 |     await test.step("Observe on UCD Service Request Listing (on-screen proxy for the email)", async () => {
  105 |       const ucdCtx = await openTrackedContext(browser, testInfo);
  106 |       const ucdPage = await ucdCtx.newPage();
  107 |       try {
  108 |         const ucdLogin = new (await import("../pages/LoginPage")).LoginPage(ucdPage);
  109 |         const ucdListing = new (await import("../pages/ServiceRequestListingPage")).ServiceRequestListingPage(ucdPage);
  110 |         await ucdLogin.loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
  111 |         await ucdListing.navigate();
  112 |         await ucdListing.searchByReferenceNo(ref);
  113 |         const row = await ucdListing.findRowByRefNo(ref);
  114 |         // Best-effort: only assert when this UCD account owns the reference.
  115 |         if (row) {
  116 |           expect((await ucdListing.getRowServiceType(row)).length).toBeGreaterThan(0);
  117 |         }
  118 |       } finally {
  119 |         await closeTrackedContext(ucdCtx, testInfo, "UCD verifies listing");
  120 |       }
  121 |     });
  122 |   });
  123 | 
  124 |   test("BO add for current day and the next day", async ({ boCalendarPage }) => {
  125 |     await boCalendarPage.navigate();
  126 |     const dialog = await boCalendarPage.openAddDialog();
  127 |     await test.step("Expected: able to proceed with booking today and tomorrow", async () => {
  128 |       expect(await boCalendarPage.isAddDateSelectable(boCalendarPage.today())).toBe(true);
> 129 |       expect(await boCalendarPage.isAddDateSelectable(boCalendarPage.daysFromToday(1))).toBe(true);
      |                                                                                         ^ Error: expect(received).toBe(expected) // Object.is equality
  130 |     });
  131 |     await boCalendarPage.closeAddDialog(dialog);
  132 |   });
  133 | 
  134 |   test("BO add for previous dates", async ({ boCalendarPage }) => {
  135 |     await boCalendarPage.navigate();
  136 |     const dialog = await boCalendarPage.openAddDialog();
  137 |     await test.step("Expected: a previous date is not selectable", async () => {
  138 |       expect(await boCalendarPage.isAddDateSelectable(boCalendarPage.yesterday())).toBe(false);
  139 |     });
  140 |     await boCalendarPage.closeAddDialog(dialog);
  141 |   });
  142 | 
  143 |   test("BO book future date more than 2 months", async ({ boCalendarPage }) => {
  144 |     await boCalendarPage.navigate();
  145 |     const dialog = await boCalendarPage.openAddDialog();
  146 |     const far = boCalendarPage.dateMonthsAhead(3);
  147 |     await test.step(`Expected: ${far} (>2 months out) CAN be booked by BO`, async () => {
  148 |       expect(await boCalendarPage.isAddDateSelectable(far)).toBe(true);
  149 |     });
  150 |     await boCalendarPage.closeAddDialog(dialog);
  151 |   });
  152 | 
  153 |   test("BO book weekend dates", async ({ boCalendarPage }) => {
  154 |     await boCalendarPage.navigate();
  155 |     const dialog = await boCalendarPage.openAddDialog();
  156 |     const weekend = boCalendarPage.nextWeekend();
  157 |     await test.step(`Expected: weekend ${weekend} is greyed out / unclickable`, async () => {
  158 |       expect(await boCalendarPage.isAddDateSelectable(weekend)).toBe(false);
  159 |     });
  160 |     await boCalendarPage.closeAddDialog(dialog);
  161 |   });
  162 | 
  163 |   test("BO book Public Holiday", async ({ boCalendarPage }) => {
  164 |     const ph = ENV.publicHoliday;
  165 |     if (!ph) {
  166 |       test.skip(true, "No Public Holiday date provided — key one into the runner's Test data panel.");
  167 |       return;
  168 |     }
  169 |     await boCalendarPage.navigate();
  170 |     const dialog = await boCalendarPage.openAddDialog();
  171 |     await test.step(`Expected: public holiday ${ph} is greyed out / unclickable`, async () => {
  172 |       expect(await boCalendarPage.isAddDateSelectable(ph)).toBe(false);
  173 |     });
  174 |     await boCalendarPage.closeAddDialog(dialog);
  175 |   });
  176 | 
  177 |   // ── Reschedule-entry parity ──
  178 |   // The QA doc pairs every Add scenario above with a Reschedule one too —
  179 |   // these exercise the Reschedule dialog's OWN #ac-rs-date datepicker
  180 |   // (isRescheduleDateSelectable), rather than assuming it behaves the same
  181 |   // as Add's #ac-add-date.
  182 | 
  183 |   test("BO reschedule for current day and the next day", async ({ boCalendarPage }) => {
  184 |     await boCalendarPage.navigate();
  185 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  186 |     if (!dialog) {
  187 |       test.skip(true, "No listed appointment to reschedule in this month");
  188 |       return;
  189 |     }
  190 |     await test.step("Expected: able to reschedule into today and tomorrow", async () => {
  191 |       expect(await boCalendarPage.isRescheduleDateSelectable(boCalendarPage.today())).toBe(true);
  192 |       expect(await boCalendarPage.isRescheduleDateSelectable(boCalendarPage.daysFromToday(1))).toBe(true);
  193 |     });
  194 |     await boCalendarPage.closeRescheduleDialog(dialog);
  195 |   });
  196 | 
  197 |   test("BO reschedule for previous dates", async ({ boCalendarPage }) => {
  198 |     await boCalendarPage.navigate();
  199 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  200 |     if (!dialog) {
  201 |       test.skip(true, "No listed appointment to reschedule in this month");
  202 |       return;
  203 |     }
  204 |     await test.step("Expected: a previous date is not selectable", async () => {
  205 |       expect(await boCalendarPage.isRescheduleDateSelectable(boCalendarPage.yesterday())).toBe(false);
  206 |     });
  207 |     await boCalendarPage.closeRescheduleDialog(dialog);
  208 |   });
  209 | 
  210 |   test("BO reschedule future date more than 2 months", async ({ boCalendarPage }) => {
  211 |     await boCalendarPage.navigate();
  212 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  213 |     if (!dialog) {
  214 |       test.skip(true, "No listed appointment to reschedule in this month");
  215 |       return;
  216 |     }
  217 |     const far = boCalendarPage.dateMonthsAhead(3);
  218 |     await test.step(`Expected: ${far} (>2 months out) CAN be rescheduled into by BO`, async () => {
  219 |       expect(await boCalendarPage.isRescheduleDateSelectable(far)).toBe(true);
  220 |     });
  221 |     await boCalendarPage.closeRescheduleDialog(dialog);
  222 |   });
  223 | 
  224 |   test("BO reschedule weekend dates", async ({ boCalendarPage }) => {
  225 |     await boCalendarPage.navigate();
  226 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  227 |     if (!dialog) {
  228 |       test.skip(true, "No listed appointment to reschedule in this month");
  229 |       return;
```