# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: bo-calendar-limits.spec.ts >> BO Calendar & Limits >> BO reschedule future date more than 2 months
- Location: tests\service-hub\specs\bo-calendar-limits.spec.ts:210:7

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
        - row "21-07-2026 Morning - 4 (Full) Afternoon - 3 (Full) 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. MUSICHOB SDN BHD Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e144]:
          - cell "21-07-2026 Morning - 4 (Full) Afternoon - 3 (Full)" [ref=e145]:
            - text: 21-07-2026
            - generic [ref=e146]: Morning - 4 (Full)
            - generic [ref=e147]: Afternoon - 3 (Full)
          - cell "1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. MUSICHOB SDN BHD" [ref=e148]:
            - list [ref=e149]:
              - listitem [ref=e150]: 1. MUSICHOB SDN BHD
              - listitem [ref=e151]:
                - generic [ref=e152] [cursor=pointer]: Reschedule
                - text: 2. MUSICHOB SDN BHD
              - listitem [ref=e153]:
                - generic [ref=e154] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e155]:
                - generic [ref=e156] [cursor=pointer]: Reschedule
                - text: 4. MUSICHOB SDN BHD
          - cell "Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e157]:
            - list [ref=e158]:
              - listitem [ref=e159]:
                - generic [ref=e160] [cursor=pointer]: Reschedule
                - text: 1. MUSICHOB SDN BHD
              - listitem [ref=e161]:
                - generic [ref=e162] [cursor=pointer]: Reschedule
                - text: 2. MUSICHOB SDN BHD
              - listitem [ref=e163]:
                - generic [ref=e164] [cursor=pointer]: Reschedule
                - text: 3. MUSICHOB SDN BHD
        - row "22-07-2026 Morning - 3 (Full) Afternoon - 3 (Full) Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. JIMI HUUH Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 2. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 3. FAIZUDDIN AUTO TEST" [ref=e165]:
          - cell "22-07-2026 Morning - 3 (Full) Afternoon - 3 (Full)" [ref=e166]:
            - text: 22-07-2026
            - generic [ref=e167]: Morning - 3 (Full)
            - generic [ref=e168]: Afternoon - 3 (Full)
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. JIMI HUUH Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST" [ref=e169]:
            - list [ref=e170]:
              - listitem [ref=e171]:
                - generic [ref=e172] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e173]:
                - generic [ref=e174] [cursor=pointer]: Reschedule
                - text: 2. JIMI HUUH
              - listitem [ref=e175]:
                - generic [ref=e176] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e177]:
                - generic [ref=e178] [cursor=pointer]: Reschedule
                - text: 4. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 2. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 3. FAIZUDDIN AUTO TEST" [ref=e179]:
            - list [ref=e180]:
              - listitem [ref=e181]:
                - generic [ref=e182] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
              - listitem [ref=e183]:
                - generic [ref=e184] [cursor=pointer]: Reschedule
                - text: 2. CHARRRRRR CHICKCOLI SDN BHD123321
              - listitem [ref=e185]:
                - generic [ref=e186] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
        - row "23-07-2026 Morning - 2 Afternoon - 1 Reschedule 1. JIMI HUUH Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 1. FAIZUDDIN AUTO TEST" [ref=e187]:
          - cell "23-07-2026 Morning - 2 Afternoon - 1" [ref=e188]:
            - text: 23-07-2026
            - generic [ref=e189]: Morning - 2
            - generic [ref=e190]: Afternoon - 1
          - cell "Reschedule 1. JIMI HUUH Reschedule 2. FAIZUDDIN AUTO TEST" [ref=e191]:
            - list [ref=e192]:
              - listitem [ref=e193]:
                - generic [ref=e194] [cursor=pointer]: Reschedule
                - text: 1. JIMI HUUH
              - listitem [ref=e195]:
                - generic [ref=e196] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST" [ref=e197]:
            - list [ref=e198]:
              - listitem [ref=e199]:
                - generic [ref=e200] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
        - row "24-07-2026 Morning - 0 Afternoon - 0" [ref=e201]:
          - cell "24-07-2026 Morning - 0 Afternoon - 0" [ref=e202]:
            - text: 24-07-2026
            - generic [ref=e203]: Morning - 0
            - generic [ref=e204]: Afternoon - 0
          - cell [ref=e205]
          - cell [ref=e206]
        - row "25-07-2026 - -" [ref=e207]:
          - cell "25-07-2026" [ref=e208]
          - cell "-" [ref=e209]
          - cell "-" [ref=e210]
        - row "26-07-2026 - -" [ref=e211]:
          - cell "26-07-2026" [ref=e212]
          - cell "-" [ref=e213]
          - cell "-" [ref=e214]
        - row "27-07-2026 Morning - 0 Afternoon - 0" [ref=e215]:
          - cell "27-07-2026 Morning - 0 Afternoon - 0" [ref=e216]:
            - text: 27-07-2026
            - generic [ref=e217]: Morning - 0
            - generic [ref=e218]: Afternoon - 0
          - cell [ref=e219]
          - cell [ref=e220]
        - row "28-07-2026 Morning - 0 Afternoon - 0" [ref=e221]:
          - cell "28-07-2026 Morning - 0 Afternoon - 0" [ref=e222]:
            - text: 28-07-2026
            - generic [ref=e223]: Morning - 0
            - generic [ref=e224]: Afternoon - 0
          - cell [ref=e225]
          - cell [ref=e226]
        - row "29-07-2026 Morning - 0 Afternoon - 0" [ref=e227]:
          - cell "29-07-2026 Morning - 0 Afternoon - 0" [ref=e228]:
            - text: 29-07-2026
            - generic [ref=e229]: Morning - 0
            - generic [ref=e230]: Afternoon - 0
          - cell [ref=e231]
          - cell [ref=e232]
        - row "30-07-2026 Morning - 0 Afternoon - 0" [ref=e233]:
          - cell "30-07-2026 Morning - 0 Afternoon - 0" [ref=e234]:
            - text: 30-07-2026
            - generic [ref=e235]: Morning - 0
            - generic [ref=e236]: Afternoon - 0
          - cell [ref=e237]
          - cell [ref=e238]
        - row "31-07-2026 Morning - 6 (Full) Afternoon - 3 (Full) Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. MUSICHOB SDN BHD Reschedule 6. FAIZUDDIN AUTO TEST Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. MUSICHOB SDN BHD" [ref=e239]:
          - cell "31-07-2026 Morning - 6 (Full) Afternoon - 3 (Full)" [ref=e240]:
            - text: 31-07-2026
            - generic [ref=e241]: Morning - 6 (Full)
            - generic [ref=e242]: Afternoon - 3 (Full)
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. MUSICHOB SDN BHD Reschedule 6. FAIZUDDIN AUTO TEST" [ref=e243]:
            - list [ref=e244]:
              - listitem [ref=e245]:
                - generic [ref=e246] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e247]:
                - generic [ref=e248] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e249]:
                - generic [ref=e250] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e251]:
                - generic [ref=e252] [cursor=pointer]: Reschedule
                - text: 4. FAIZUDDIN AUTO TEST
              - listitem [ref=e253]:
                - generic [ref=e254] [cursor=pointer]: Reschedule
                - text: 5. MUSICHOB SDN BHD
              - listitem [ref=e255]:
                - generic [ref=e256] [cursor=pointer]: Reschedule
                - text: 6. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. MUSICHOB SDN BHD" [ref=e257]:
            - list [ref=e258]:
              - listitem [ref=e259]:
                - generic [ref=e260] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e261]:
                - generic [ref=e262] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e263]:
                - generic [ref=e264] [cursor=pointer]: Reschedule
                - text: 3. MUSICHOB SDN BHD
  - table [ref=e266]:
    - rowgroup [ref=e267]:
      - row "Home | Menu 2 Pending Transaction Found! Jason Seah, My Account | Logout" [ref=e268]:
        - cell "Home | Menu 2 Pending Transaction Found!" [ref=e269]:
          - generic [ref=e270]:
            - list [ref=e271]:
              - listitem [ref=e272]:
                - link "Home |" [ref=e273] [cursor=pointer]:
                  - /url: /uat1/home/
              - listitem [ref=e274]:
                - link "Menu" [ref=e275] [cursor=pointer]:
                  - /url: "#"
                  - text: Menu
                  - img [ref=e276]
            - generic [ref=e277] [cursor=pointer]: 2 Pending Transaction Found!
        - cell "Jason Seah, My Account | Logout" [ref=e278]:
          - list [ref=e280]:
            - listitem [ref=e281]: Jason Seah,
            - listitem [ref=e282]:
              - link "My Account |" [ref=e283] [cursor=pointer]:
                - /url: /uat1/view/ucd/my-account/view.do?type=Office
            - listitem [ref=e284]:
              - link "Logout" [ref=e285] [cursor=pointer]:
                - /url: "#"
  - img [ref=e287]
  - table [ref=e289]:
    - rowgroup [ref=e290]:
      - row "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e291]:
        - cell [ref=e292]
        - cell "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e293]:
          - text: Best Compatible With Mozilla Firefox V36.0.4
          - text: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
          - link "Contact Us" [ref=e294] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Terms & Conditions" [ref=e295] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Privacy" [ref=e296] [cursor=pointer]:
            - /url: "#"
        - cell [ref=e297]:
          - img [ref=e298]
  - generic [ref=e299]:
    - generic [ref=e300]:
      - generic "Prev" [ref=e301]:
        - generic [ref=e302]: Prev
      - generic "Next" [ref=e303]:
        - generic [ref=e304]: Next
      - generic:
        - combobox [ref=e305]:
          - option "Jul"
          - option "Aug"
          - option "Sep"
          - option "Oct" [selected]
          - option "Nov"
          - option "Dec"
        - combobox [ref=e306]:
          - option "2026" [selected]
          - option "2027"
          - option "2028"
          - option "2029"
          - option "2030"
          - option "2031"
          - option "2032"
          - option "2033"
          - option "2034"
          - option "2035"
          - option "2036"
    - table [ref=e307]:
      - rowgroup [ref=e308]:
        - row "Su Mo Tu We Th Fr Sa" [ref=e309]:
          - columnheader "Su" [ref=e310]
          - columnheader "Mo" [ref=e311]
          - columnheader "Tu" [ref=e312]
          - columnheader "We" [ref=e313]
          - columnheader "Th" [ref=e314]
          - columnheader "Fr" [ref=e315]
          - columnheader "Sa" [ref=e316]
      - rowgroup [ref=e317]:
        - row "1 2 3" [ref=e318]:
          - cell [ref=e319]
          - cell [ref=e320]
          - cell [ref=e321]
          - cell [ref=e322]
          - cell "1" [ref=e323]:
            - link "1" [ref=e324] [cursor=pointer]:
              - /url: "#"
          - cell "2" [ref=e325]:
            - link "2" [ref=e326] [cursor=pointer]:
              - /url: "#"
          - cell "3" [ref=e327]:
            - generic [ref=e328]: "3"
        - row "4 5 6 7 8 9 10" [ref=e329]:
          - cell "4" [ref=e330]:
            - generic [ref=e331]: "4"
          - cell "5" [ref=e332]:
            - link "5" [ref=e333] [cursor=pointer]:
              - /url: "#"
          - cell "6" [ref=e334]:
            - link "6" [ref=e335] [cursor=pointer]:
              - /url: "#"
          - cell "7" [ref=e336]:
            - link "7" [ref=e337] [cursor=pointer]:
              - /url: "#"
          - cell "8" [ref=e338]:
            - link "8" [ref=e339] [cursor=pointer]:
              - /url: "#"
          - cell "9" [ref=e340]:
            - link "9" [ref=e341] [cursor=pointer]:
              - /url: "#"
          - cell "10" [ref=e342]:
            - generic [ref=e343]: "10"
        - row "11 12 13 14 15 16 17" [ref=e344]:
          - cell "11" [ref=e345]:
            - generic [ref=e346]: "11"
          - cell "12" [ref=e347]:
            - link "12" [ref=e348] [cursor=pointer]:
              - /url: "#"
          - cell "13" [ref=e349]:
            - link "13" [ref=e350] [cursor=pointer]:
              - /url: "#"
          - cell "14" [ref=e351]:
            - link "14" [ref=e352] [cursor=pointer]:
              - /url: "#"
          - cell "15" [ref=e353]:
            - link "15" [ref=e354] [cursor=pointer]:
              - /url: "#"
          - cell "16" [ref=e355]:
            - link "16" [ref=e356] [cursor=pointer]:
              - /url: "#"
          - cell "17" [ref=e357]:
            - generic [ref=e358]: "17"
        - row "18 19 20 21 22 23 24" [ref=e359]:
          - cell "18" [ref=e360]:
            - generic [ref=e361]: "18"
          - cell "19" [ref=e362]:
            - link "19" [ref=e363] [cursor=pointer]:
              - /url: "#"
          - cell "20" [ref=e364]:
            - link "20" [ref=e365] [cursor=pointer]:
              - /url: "#"
          - cell "21" [ref=e366]:
            - link "21" [ref=e367] [cursor=pointer]:
              - /url: "#"
          - cell "22" [ref=e368]:
            - link "22" [ref=e369] [cursor=pointer]:
              - /url: "#"
          - cell "23" [ref=e370]:
            - link "23" [ref=e371] [cursor=pointer]:
              - /url: "#"
          - cell "24" [ref=e372]:
            - generic [ref=e373]: "24"
        - row "25 26 27 28 29 30 31" [ref=e374]:
          - cell "25" [ref=e375]:
            - generic [ref=e376]: "25"
          - cell "26" [ref=e377]:
            - link "26" [ref=e378] [cursor=pointer]:
              - /url: "#"
          - cell "27" [ref=e379]:
            - link "27" [ref=e380] [cursor=pointer]:
              - /url: "#"
          - cell "28" [ref=e381]:
            - link "28" [ref=e382] [cursor=pointer]:
              - /url: "#"
          - cell "29" [ref=e383]:
            - link "29" [ref=e384] [cursor=pointer]:
              - /url: "#"
          - cell "30" [ref=e385]:
            - link "30" [ref=e386] [cursor=pointer]:
              - /url: "#"
          - cell "31" [ref=e387]:
            - generic [ref=e388]: "31"
  - dialog "Reschedule Appointment" [active] [ref=e390]:
    - generic [ref=e392]: Reschedule Appointment
    - generic [ref=e393]:
      - generic [ref=e394]:
        - generic [ref=e395]: "Company Name:"
        - text: FAIZUDDIN AUTO TEST
      - generic [ref=e396]:
        - generic [ref=e397]: "Installation Status:"
        - text: Pending
      - generic [ref=e398]:
        - generic [ref=e399]: "Installation Service Reference No.:"
        - text: SR67000095
      - generic [ref=e400]:
        - generic [ref=e401]: "Current Appointment Date:"
        - text: 20-07-2026 10:00am - 12:00pm
      - generic [ref=e402]:
        - generic [ref=e403]: "New Appointment Date*:"
        - textbox [ref=e404]
      - generic [ref=e405]:
        - generic [ref=e406]: "Time Slot*:"
        - generic [ref=e407]:
          - generic [ref=e408]:
            - radio "10:00am - 12:00pm" [ref=e409]
            - text: 10:00am - 12:00pm
          - generic [ref=e410]:
            - radio "2:00pm - 4:00pm" [ref=e411]
            - text: 2:00pm - 4:00pm
    - generic [ref=e412]:
      - button "Confirm" [ref=e413] [cursor=pointer]
      - button "Cancel" [ref=e414] [cursor=pointer]
```

# Test source

```ts
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
  129 |       expect(await boCalendarPage.isAddDateSelectable(boCalendarPage.daysFromToday(1))).toBe(true);
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
> 219 |       expect(await boCalendarPage.isRescheduleDateSelectable(far)).toBe(true);
      |                                                                    ^ Error: expect(received).toBe(expected) // Object.is equality
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
  230 |     }
  231 |     const weekend = boCalendarPage.nextWeekend();
  232 |     await test.step(`Expected: weekend ${weekend} is greyed out / unclickable`, async () => {
  233 |       expect(await boCalendarPage.isRescheduleDateSelectable(weekend)).toBe(false);
  234 |     });
  235 |     await boCalendarPage.closeRescheduleDialog(dialog);
  236 |   });
  237 | 
  238 |   test("BO reschedule Public Holiday", async ({ boCalendarPage }) => {
  239 |     const ph = ENV.publicHoliday;
  240 |     if (!ph) {
  241 |       test.skip(true, "No Public Holiday date provided — key one into the runner's Test data panel.");
  242 |       return;
  243 |     }
  244 |     await boCalendarPage.navigate();
  245 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  246 |     if (!dialog) {
  247 |       test.skip(true, "No listed appointment to reschedule in this month");
  248 |       return;
  249 |     }
  250 |     await test.step(`Expected: public holiday ${ph} is greyed out / unclickable`, async () => {
  251 |       expect(await boCalendarPage.isRescheduleDateSelectable(ph)).toBe(false);
  252 |     });
  253 |     await boCalendarPage.closeRescheduleDialog(dialog);
  254 |   });
  255 | 
  256 |   test("BO reschedule beyond morning slot limit", async ({ boCalendarPage }) => {
  257 |     await boCalendarPage.navigate();
  258 |     const fullLabel = await boCalendarPage.findDateWithSlotFull(MORNING);
  259 |     if (!fullLabel) {
  260 |       test.skip(true, "No date with a full morning session available.");
  261 |       return;
  262 |     }
  263 |     const [d, m, y] = fullLabel.split("-");
  264 |     const iso = `${y}-${m}-${d}`;
  265 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  266 |     if (!dialog) {
  267 |       test.skip(true, "No listed appointment to reschedule in this month");
  268 |       return;
  269 |     }
  270 |     await test.step(`Expected: CSE can still reschedule into ${fullLabel} despite the morning session being full`, async () => {
  271 |       expect(await boCalendarPage.isRescheduleDateSelectable(iso)).toBe(true);
  272 |     });
  273 |     await boCalendarPage.closeRescheduleDialog(dialog);
  274 |   });
  275 | 
  276 |   test("BO reschedule beyond afternoon slot limit", async ({ boCalendarPage }) => {
  277 |     await boCalendarPage.navigate();
  278 |     const fullLabel = await boCalendarPage.findDateWithSlotFull(AFTERNOON);
  279 |     if (!fullLabel) {
  280 |       test.skip(true, "No date with a full afternoon session available.");
  281 |       return;
  282 |     }
  283 |     const [d, m, y] = fullLabel.split("-");
  284 |     const iso = `${y}-${m}-${d}`;
  285 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  286 |     if (!dialog) {
  287 |       test.skip(true, "No listed appointment to reschedule in this month");
  288 |       return;
  289 |     }
  290 |     await test.step(`Expected: CSE can still reschedule into ${fullLabel} despite the afternoon session being full`, async () => {
  291 |       expect(await boCalendarPage.isRescheduleDateSelectable(iso)).toBe(true);
  292 |     });
  293 |     await boCalendarPage.closeRescheduleDialog(dialog);
  294 |   });
  295 | 
  296 |   test("BO reschedule beyond 6 days limit", async ({ boCalendarPage }) => {
  297 |     // "6 days" = the UCD-facing 6/day cap; CSE ignores it. Reuses whichever
  298 |     // full session (morning or afternoon) is found first as evidence the
  299 |     // day is at/near that cap.
  300 |     await boCalendarPage.navigate();
  301 |     const fullLabel = (await boCalendarPage.findDateWithSlotFull(MORNING)) ?? (await boCalendarPage.findDateWithSlotFull(AFTERNOON));
  302 |     if (!fullLabel) {
  303 |       test.skip(true, "No date at the daily booking limit available.");
  304 |       return;
  305 |     }
  306 |     const [d, m, y] = fullLabel.split("-");
  307 |     const iso = `${y}-${m}-${d}`;
  308 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  309 |     if (!dialog) {
  310 |       test.skip(true, "No listed appointment to reschedule in this month");
  311 |       return;
  312 |     }
  313 |     await test.step(`Expected: CSE can still reschedule into ${fullLabel} despite it being at the UCD 6/day cap`, async () => {
  314 |       expect(await boCalendarPage.isRescheduleDateSelectable(iso)).toBe(true);
  315 |     });
  316 |     await boCalendarPage.closeRescheduleDialog(dialog);
  317 |   });
  318 | 
  319 |   // ── Add Appointment — existing-reference edge case ──
```