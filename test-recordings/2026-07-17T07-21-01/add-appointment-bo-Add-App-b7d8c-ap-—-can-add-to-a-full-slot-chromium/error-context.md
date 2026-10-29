# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: add-appointment-bo.spec.ts >> Add Appointment (BO) >> CSE not bound by 6/day cap — can add to a full slot
- Location: tests\service-hub\specs\add-appointment-bo.spec.ts:147:7

# Error details

```
TimeoutError: locator.check: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('input[name="ac-add-type"][value="NEW"]')

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
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
        - row "31-07-2026 Morning - 1 Afternoon - 1 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e218]:
          - cell "31-07-2026 Morning - 1 Afternoon - 1" [ref=e219]:
            - text: 31-07-2026
            - generic [ref=e220]: Morning - 1
            - generic [ref=e221]: Afternoon - 1
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e222]:
            - list [ref=e223]:
              - listitem [ref=e224]:
                - generic [ref=e225] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e226]:
            - list [ref=e227]:
              - listitem [ref=e228]:
                - generic [ref=e229] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
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
  - generic [ref=e264]:
    - generic [ref=e265]:
      - generic "Prev" [ref=e266]:
        - generic [ref=e267]: Prev
      - generic "Next" [ref=e268]:
        - generic [ref=e269]: Next
      - generic:
        - combobox [ref=e270]:
          - option "Jan"
          - option "Feb"
          - option "Mar"
          - option "Apr"
          - option "May"
          - option "Jun"
          - option "Jul" [selected]
          - option "Aug"
          - option "Sep"
          - option "Oct"
          - option "Nov"
          - option "Dec"
        - combobox [ref=e271]:
          - option "2025"
          - option "2026" [selected]
          - option "2027"
          - option "2028"
          - option "2029"
    - table [ref=e272]:
      - rowgroup [ref=e273]:
        - row "Su Mo Tu We Th Fr Sa" [ref=e274]:
          - columnheader "Su" [ref=e275]
          - columnheader "Mo" [ref=e276]
          - columnheader "Tu" [ref=e277]
          - columnheader "We" [ref=e278]
          - columnheader "Th" [ref=e279]
          - columnheader "Fr" [ref=e280]
          - columnheader "Sa" [ref=e281]
      - rowgroup [ref=e282]:
        - row "1 2 3 4" [ref=e283]:
          - cell [ref=e284]
          - cell [ref=e285]
          - cell [ref=e286]
          - cell "1" [ref=e287]:
            - link "1" [ref=e288] [cursor=pointer]:
              - /url: "#"
          - cell "2" [ref=e289]:
            - link "2" [ref=e290] [cursor=pointer]:
              - /url: "#"
          - cell "3" [ref=e291]:
            - link "3" [ref=e292] [cursor=pointer]:
              - /url: "#"
          - cell "4" [ref=e293]:
            - link "4" [ref=e294] [cursor=pointer]:
              - /url: "#"
        - row "5 6 7 8 9 10 11" [ref=e295]:
          - cell "5" [ref=e296]:
            - link "5" [ref=e297] [cursor=pointer]:
              - /url: "#"
          - cell "6" [ref=e298]:
            - link "6" [ref=e299] [cursor=pointer]:
              - /url: "#"
          - cell "7" [ref=e300]:
            - link "7" [ref=e301] [cursor=pointer]:
              - /url: "#"
          - cell "8" [ref=e302]:
            - link "8" [ref=e303] [cursor=pointer]:
              - /url: "#"
          - cell "9" [ref=e304]:
            - link "9" [ref=e305] [cursor=pointer]:
              - /url: "#"
          - cell "10" [ref=e306]:
            - link "10" [ref=e307] [cursor=pointer]:
              - /url: "#"
          - cell "11" [ref=e308]:
            - link "11" [ref=e309] [cursor=pointer]:
              - /url: "#"
        - row "12 13 14 15 16 17 18" [ref=e310]:
          - cell "12" [ref=e311]:
            - link "12" [ref=e312] [cursor=pointer]:
              - /url: "#"
          - cell "13" [ref=e313]:
            - link "13" [ref=e314] [cursor=pointer]:
              - /url: "#"
          - cell "14" [ref=e315]:
            - link "14" [ref=e316] [cursor=pointer]:
              - /url: "#"
          - cell "15" [ref=e317]:
            - link "15" [ref=e318] [cursor=pointer]:
              - /url: "#"
          - cell "16" [ref=e319]:
            - link "16" [ref=e320] [cursor=pointer]:
              - /url: "#"
          - cell "17" [ref=e321]:
            - link "17" [ref=e322] [cursor=pointer]:
              - /url: "#"
          - cell "18" [ref=e323]:
            - link "18" [ref=e324] [cursor=pointer]:
              - /url: "#"
        - row "19 20 21 22 23 24 25" [ref=e325]:
          - cell "19" [ref=e326]:
            - link "19" [ref=e327] [cursor=pointer]:
              - /url: "#"
          - cell "20" [ref=e328]:
            - link "20" [ref=e329] [cursor=pointer]:
              - /url: "#"
          - cell "21" [ref=e330]:
            - link "21" [ref=e331] [cursor=pointer]:
              - /url: "#"
          - cell "22" [ref=e332]:
            - link "22" [ref=e333] [cursor=pointer]:
              - /url: "#"
          - cell "23" [ref=e334]:
            - link "23" [ref=e335] [cursor=pointer]:
              - /url: "#"
          - cell "24" [ref=e336]:
            - link "24" [ref=e337] [cursor=pointer]:
              - /url: "#"
          - cell "25" [ref=e338]:
            - link "25" [ref=e339] [cursor=pointer]:
              - /url: "#"
        - row "26 27 28 29 30 31" [ref=e340]:
          - cell "26" [ref=e341]:
            - link "26" [ref=e342] [cursor=pointer]:
              - /url: "#"
          - cell "27" [ref=e343]:
            - link "27" [ref=e344] [cursor=pointer]:
              - /url: "#"
          - cell "28" [ref=e345]:
            - link "28" [ref=e346] [cursor=pointer]:
              - /url: "#"
          - cell "29" [ref=e347]:
            - link "29" [ref=e348] [cursor=pointer]:
              - /url: "#"
          - cell "30" [ref=e349]:
            - link "30" [ref=e350] [cursor=pointer]:
              - /url: "#"
          - cell "31" [ref=e351]:
            - link "31" [ref=e352] [cursor=pointer]:
              - /url: "#"
          - cell [ref=e353]
    - generic [ref=e354]:
      - button "Today" [ref=e355] [cursor=pointer]
      - button "Done" [ref=e356] [cursor=pointer]
  - dialog "Add Appointment" [ref=e358]:
    - generic [ref=e360]: Add Appointment
    - generic [ref=e361]:
      - generic [ref=e362]: Please enter the company name to add installation appointment.
      - generic [ref=e363]:
        - generic [ref=e364]: "Company Name*:"
        - generic [ref=e365]:
          - textbox [ref=e366]
          - button "Search" [ref=e367]
      - generic [ref=e368]:
        - generic [ref=e369]: "Reference No.*:"
        - generic [ref=e370]:
          - textbox [ref=e371]
          - button "Search" [ref=e372]
      - generic [ref=e373]:
        - generic [ref=e374]: "Appointment Date*:"
        - textbox [ref=e375]
      - generic [ref=e376]:
        - generic [ref=e377]: "Time Slot*:"
        - generic [ref=e378]:
          - generic [ref=e379]:
            - radio "10:00am - 12:00pm" [ref=e380]
            - text: 10:00am - 12:00pm
          - generic [ref=e381]:
            - radio "2:00pm - 4:00pm" [ref=e382]
            - text: 2:00pm - 4:00pm
    - generic [ref=e383]:
      - button "Confirm" [ref=e384] [cursor=pointer]
      - button "Cancel" [ref=e385] [cursor=pointer]
```

# Test source

```ts
  293 |     await this.page.waitForTimeout(200);
  294 |     const cell = this.datepicker.locator("td", { hasText: new RegExp(`^${d}$`) }).first();
  295 |     const disabled = await cell.evaluate((el) => el.classList.contains("ui-state-disabled"));
  296 |     await this.dismissDatepicker();
  297 |     return !disabled;
  298 |   }
  299 | 
  300 |   /** Reschedule the first appointment whose company name matches. */
  301 |   async rescheduleByCompany(opts: { companyName: string; slot: BoTimeSlot }) {
  302 |     const li = this.calTable
  303 |       .locator("li", { has: this.page.locator("span.cal-co", { hasText: opts.companyName }) })
  304 |       .filter({ has: this.page.locator("a.cal-rs") })
  305 |       .first();
  306 |     await li.locator("a.cal-rs").click();
  307 |     await this.completeRescheduleDialog(opts.slot);
  308 |   }
  309 | 
  310 |   private async completeRescheduleDialog(slot: BoTimeSlot) {
  311 |     const slotName = slot === 0 ? "morning" : "afternoon";
  312 |     const dialog = this.page.locator(".ui-dialog", { has: this.page.locator("#ac-rs-dialog") });
  313 |     await dialog.waitFor({ state: "visible", timeout: 10000 });
  314 |     // Show the current appointment being changed, so the reviewer sees the
  315 |     // "before" state before the new date is picked.
  316 |     await this.demoHighlight("#ac-rs-cur");
  317 | 
  318 |     await test.step(`Pick a new date and the ${slotName} slot`, async () => {
  319 |       // New Appointment Date via datepicker (readonly input → click to open).
  320 |       await this.page.locator("#ac-rs-date").click();
  321 |       await this.pickDatepickerDay();
  322 |       // Defensive: a refocus race can reopen the picker after pickDatepickerDay
  323 |       // already dismissed it — clear it again before touching the slot radio.
  324 |       if (await this.datepicker.isVisible().catch(() => false)) await this.dismissDatepicker();
  325 |       await this.demoHighlight(`input[name="ac-rs-slot"][value="${slot}"]`);
  326 |       await this.page.locator(`input[name="ac-rs-slot"][value="${slot}"]`).check();
  327 |     });
  328 | 
  329 |     await test.step("Confirm the reschedule", async () => {
  330 |       // Confirm raises a NATIVE browser confirm() — accept it.
  331 |       await this.demoHighlight(dialog.getByRole("button", { name: "Confirm" }), { color: "green" });
  332 |       this.page.once("dialog", (d) => d.accept());
  333 |       await dialog.getByRole("button", { name: "Confirm" }).click();
  334 |       await this.waitForNav();
  335 |       await this.demoPause();
  336 |     });
  337 |   }
  338 | 
  339 |   /**
  340 |    * Open the Add Appointment dialog and return its Locator, without filling
  341 |    * anything in. Used by the calendar date-rule checks (isAddDateSelectable
  342 |    * is scoped to this dialog's #ac-add-date field) — call closeAddDialog()
  343 |    * when done to leave the calendar clean.
  344 |    */
  345 |   async openAddDialog(): Promise<Locator> {
  346 |     await this.addAppointmentBtn.click();
  347 |     const dialog = this.page.locator(".ui-dialog", { has: this.page.locator("#ac-add-dialog") });
  348 |     await dialog.waitFor({ state: "visible", timeout: 10000 });
  349 |     return dialog;
  350 |   }
  351 | 
  352 |   /** Close the Add dialog via its Cancel button (best-effort, public wrapper). */
  353 |   async closeAddDialog(dialog: Locator) {
  354 |     await dialog.getByRole("button", { name: "Cancel" }).click().catch(() => {});
  355 |     await dialog.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  356 |   }
  357 | 
  358 |   /**
  359 |    * Add Appointment (jQuery UI dialog). Default type is "New Record"; pass
  360 |    * existingRecordRefNo to use the "Existing Record" path.
  361 |    */
  362 |   /**
  363 |    * Returns the date actually booked (DD-MM-YYYY, matching the calendar
  364 |    * label) on success, or `null` when the add couldn't proceed — the company
  365 |    * couldn't be resolved, it has no unallocated units ("No allocation
  366 |    * remaining"), or the confirm was rejected. Callers use null to SKIP
  367 |    * (arrange-else-skip) rather than fail. The chosen date may differ from
  368 |    * `appointmentDate` if that day isn't selectable, which is why we report
  369 |    * back the date the datepicker actually committed.
  370 |    */
  371 |   async addAppointment(opts: {
  372 |     companyName: string;
  373 |     slot: BoTimeSlot;
  374 |     appointmentDate?: string; // ISO (YYYY-MM-DD); picks that day if selectable this month
  375 |     existingRecordRefNo?: string;
  376 |     /**
  377 |      * Exact company to click from the search results. Defaults to
  378 |      * companyName. Needed because several look-alikes exist (e.g.
  379 |      * "FAIZUDDIN AUTO TEST" vs "FAIZUDDIN AUTO TEST 2"/"3") — we match the
  380 |      * result whose text is EXACTLY this, never a prefix.
  381 |      */
  382 |     companySelect?: string;
  383 |   }): Promise<string | null> {
  384 |     await this.demoHighlight(this.addAppointmentBtn);
  385 |     await this.addAppointmentBtn.click();
  386 |     const dialog = this.page.locator(".ui-dialog", { has: this.page.locator("#ac-add-dialog") });
  387 |     await dialog.waitFor({ state: "visible", timeout: 10000 });
  388 |     await this.demoPause();
  389 | 
  390 |     // Appointment type radio (New Record vs Existing Record).
  391 |     await this.page
  392 |       .locator(`input[name="ac-add-type"][value="${opts.existingRecordRefNo ? "EXISTING" : "NEW"}"]`)
> 393 |       .check();
      |        ^ TimeoutError: locator.check: Timeout 10000ms exceeded.
  394 | 
  395 |     // Company search → results render in .ac_results (<ul><li> list). Select
  396 |     // by EXACT text so "FAIZUDDIN AUTO TEST" never matches "… TEST 2"/"… 3".
  397 |     await this.page.locator("#ac-add-name").fill(opts.companyName);
  398 |     await this.demoHighlight("#ac-add-name");
  399 |     await this.page.locator("#ac-add-search").click();
  400 |     const results = this.page.locator(".ac_results");
  401 |     await results.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
  402 |     const pick = opts.companySelect ?? opts.companyName;
  403 |     const option = results.getByText(pick, { exact: true }).first();
  404 |     if (!(await option.count())) {
  405 |       await this.closeAddDialog(dialog); // company not in results — precondition unmet
  406 |       return null;
  407 |     }
  408 |     await this.demoHighlight(option);
  409 |     await option.click();
  410 | 
  411 |     // Existing Record: after the company is chosen, key in the reference
  412 |     // (captured from the BO SI Listing for this company) and search to bind it.
  413 |     if (opts.existingRecordRefNo) {
  414 |       const ref = opts.existingRecordRefNo;
  415 |       await test.step(`Enter Existing Record reference ${ref}`, async () => {
  416 |         await this.page.locator("#ac-add-refno").fill(ref);
  417 |         await this.demoHighlight("#ac-add-refno");
  418 |         await this.page.locator("#ac-add-ref-search").click();
  419 |         await this.page.waitForTimeout(500);
  420 |       });
  421 |     }
  422 | 
  423 |     // A company with no active installation request, or with no unallocated
  424 |     // units left, can't be added — the dialog surfaces one of these errors.
  425 |     if (
  426 |       (await this.page.locator("#ac-add-noreq").isVisible().catch(() => false)) ||
  427 |       (await this.page.locator("#ac-add-alloc-no").isVisible().catch(() => false))
  428 |     ) {
  429 |       await this.closeAddDialog(dialog);
  430 |       return null;
  431 |     }
  432 | 
  433 |     // Appointment date via datepicker + time slot radio.
  434 |     let bookedDate = "";
  435 |     await test.step(`Pick appointment date and the ${opts.slot === 0 ? "morning" : "afternoon"} slot`, async () => {
  436 |       await this.page.locator("#ac-add-date").click();
  437 |       await this.pickDatepickerDay(opts.appointmentDate ? this.isoDayOfMonth(opts.appointmentDate) : undefined);
  438 |       // Capture the date actually chosen (display value = DD-MM-YYYY).
  439 |       bookedDate = (await this.page.locator("#ac-add-date").inputValue().catch(() => "")).trim();
  440 |       // Defensive: a refocus race can reopen the picker after pickDatepickerDay
  441 |       // already dismissed it — clear it again before touching the slot radio.
  442 |       if (await this.datepicker.isVisible().catch(() => false)) await this.dismissDatepicker();
  443 |       await this.demoHighlight(`#ac-add-slot-${opts.slot}`);
  444 |       await this.page.locator(`#ac-add-slot-${opts.slot}`).check();
  445 |     });
  446 | 
  447 |     await test.step("Confirm the appointment", async () => {
  448 |       // Confirm raises a NATIVE browser confirm() — accept it.
  449 |       await this.demoHighlight(dialog.getByRole("button", { name: "Confirm" }), { color: "green" });
  450 |       this.page.once("dialog", (d) => d.accept());
  451 |       await dialog.getByRole("button", { name: "Confirm" }).click();
  452 |       await this.waitForNav();
  453 |       await this.demoPause();
  454 |     });
  455 | 
  456 |     // Success only if the dialog closed; a validation failure leaves it open.
  457 |     if (await dialog.isVisible().catch(() => false)) {
  458 |       await this.closeAddDialog(dialog);
  459 |       return null;
  460 |     }
  461 |     return bookedDate || null;
  462 |   }
  463 | }
  464 | 
```