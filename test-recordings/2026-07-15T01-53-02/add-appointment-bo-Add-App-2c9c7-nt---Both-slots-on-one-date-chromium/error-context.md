# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: add-appointment-bo.spec.ts >> Add Appointment (BO) >> Add Appointment - Both slots on one date
- Location: tests\service-hub\specs\add-appointment-bo.spec.ts:49:7

# Error details

```
Error: expect(received).toBeGreaterThan(expected)

Expected: > 0
Received:   0
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
        - row "15-07-2026 Morning - 3 (Full) Afternoon - 3 (Full) Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST" [ref=e94]:
          - cell "15-07-2026 Morning - 3 (Full) Afternoon - 3 (Full)" [ref=e95]:
            - text: 15-07-2026
            - generic [ref=e96]: Morning - 3 (Full)
            - generic [ref=e97]: Afternoon - 3 (Full)
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST" [ref=e98]:
            - list [ref=e99]:
              - listitem [ref=e100]:
                - generic [ref=e101] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e102]:
                - generic [ref=e103] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e104]:
                - generic [ref=e105] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST" [ref=e106]:
            - list [ref=e107]:
              - listitem [ref=e108]:
                - generic [ref=e109] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e110]:
                - generic [ref=e111] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e112]:
                - generic [ref=e113] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
        - row "16-07-2026 Morning - 4 (Full) Afternoon - 1 Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. FAIZUDDIN AUTO TEST Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e114]:
          - cell "16-07-2026 Morning - 4 (Full) Afternoon - 1" [ref=e115]:
            - text: 16-07-2026
            - generic [ref=e116]: Morning - 4 (Full)
            - generic [ref=e117]: Afternoon - 1
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. FAIZUDDIN AUTO TEST" [ref=e118]:
            - list [ref=e119]:
              - listitem [ref=e120]:
                - generic [ref=e121] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e122]:
                - generic [ref=e123] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e124]:
                - generic [ref=e125] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e126]:
                - generic [ref=e127] [cursor=pointer]: Reschedule
                - text: 4. FAIZUDDIN AUTO TEST
              - listitem [ref=e128]:
                - generic [ref=e129] [cursor=pointer]: Reschedule
                - text: 5. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e130]:
            - list [ref=e131]:
              - listitem [ref=e132]:
                - generic [ref=e133] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
        - row "17-07-2026 Morning - 3 (Full) Afternoon - 3 (Full) Reschedule 1. TRAZE 2. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 3. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 4. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 2. STAR NOVA SDN BHD Reschedule 3. STAR NOVA SDN BHD" [ref=e134]:
          - cell "17-07-2026 Morning - 3 (Full) Afternoon - 3 (Full)" [ref=e135]:
            - text: 17-07-2026
            - generic [ref=e136]: Morning - 3 (Full)
            - generic [ref=e137]: Afternoon - 3 (Full)
          - cell "Reschedule 1. TRAZE 2. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 3. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 4. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e138]:
            - list [ref=e139]:
              - listitem [ref=e140]:
                - generic [ref=e141] [cursor=pointer]: Reschedule
                - text: 1. TRAZE
              - listitem [ref=e142]: 2. CHARRRRRR CHICKCOLI SDN BHD123321
              - listitem [ref=e143]:
                - generic [ref=e144] [cursor=pointer]: Reschedule
                - text: 3. CHARRRRRR CHICKCOLI SDN BHD123321
              - listitem [ref=e145]:
                - generic [ref=e146] [cursor=pointer]: Reschedule
                - text: 4. CHARRRRRR CHICKCOLI SDN BHD123321
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 2. STAR NOVA SDN BHD Reschedule 3. STAR NOVA SDN BHD" [ref=e147]:
            - list [ref=e148]:
              - listitem [ref=e149]:
                - generic [ref=e150] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
              - listitem [ref=e151]:
                - generic [ref=e152] [cursor=pointer]: Reschedule
                - text: 2. STAR NOVA SDN BHD
              - listitem [ref=e153]:
                - generic [ref=e154] [cursor=pointer]: Reschedule
                - text: 3. STAR NOVA SDN BHD
        - row "18-07-2026 - -" [ref=e155]:
          - cell "18-07-2026" [ref=e156]
          - cell "-" [ref=e157]
          - cell "-" [ref=e158]
        - row "19-07-2026 - -" [ref=e159]:
          - cell "19-07-2026" [ref=e160]
          - cell "-" [ref=e161]
          - cell "-" [ref=e162]
        - row "20-07-2026 Morning - 3 (Full) Afternoon - 0 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 2. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 3. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e163]:
          - cell "20-07-2026 Morning - 3 (Full) Afternoon - 0" [ref=e164]:
            - text: 20-07-2026
            - generic [ref=e165]: Morning - 3 (Full)
            - generic [ref=e166]: Afternoon - 0
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 2. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 3. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e167]:
            - list [ref=e168]:
              - listitem [ref=e169]:
                - generic [ref=e170] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
              - listitem [ref=e171]:
                - generic [ref=e172] [cursor=pointer]: Reschedule
                - text: 2. CHARRRRRR CHICKCOLI SDN BHD123321
              - listitem [ref=e173]:
                - generic [ref=e174] [cursor=pointer]: Reschedule
                - text: 3. CHARRRRRR CHICKCOLI SDN BHD123321
          - cell [ref=e175]
        - row "21-07-2026 Morning - 2 Afternoon - 0 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 2. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e176]:
          - cell "21-07-2026 Morning - 2 Afternoon - 0" [ref=e177]:
            - text: 21-07-2026
            - generic [ref=e178]: Morning - 2
            - generic [ref=e179]: Afternoon - 0
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 2. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e180]:
            - list [ref=e181]:
              - listitem [ref=e182]:
                - generic [ref=e183] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
              - listitem [ref=e184]:
                - generic [ref=e185] [cursor=pointer]: Reschedule
                - text: 2. CHARRRRRR CHICKCOLI SDN BHD123321
          - cell [ref=e186]
        - row "22-07-2026 Morning - 1 Afternoon - 0 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e187]:
          - cell "22-07-2026 Morning - 1 Afternoon - 0" [ref=e188]:
            - text: 22-07-2026
            - generic [ref=e189]: Morning - 1
            - generic [ref=e190]: Afternoon - 0
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e191]:
            - list [ref=e192]:
              - listitem [ref=e193]:
                - generic [ref=e194] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
          - cell [ref=e195]
        - row "23-07-2026 Morning - 1 Afternoon - 0 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e196]:
          - cell "23-07-2026 Morning - 1 Afternoon - 0" [ref=e197]:
            - text: 23-07-2026
            - generic [ref=e198]: Morning - 1
            - generic [ref=e199]: Afternoon - 0
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e200]:
            - list [ref=e201]:
              - listitem [ref=e202]:
                - generic [ref=e203] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
          - cell [ref=e204]
        - row "24-07-2026 Morning - 1 Afternoon - 0 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e205]:
          - cell "24-07-2026 Morning - 1 Afternoon - 0" [ref=e206]:
            - text: 24-07-2026
            - generic [ref=e207]: Morning - 1
            - generic [ref=e208]: Afternoon - 0
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e209]:
            - list [ref=e210]:
              - listitem [ref=e211]:
                - generic [ref=e212] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
          - cell [ref=e213]
        - row "25-07-2026 - -" [ref=e214]:
          - cell "25-07-2026" [ref=e215]
          - cell "-" [ref=e216]
          - cell "-" [ref=e217]
        - row "26-07-2026 - -" [ref=e218]:
          - cell "26-07-2026" [ref=e219]
          - cell "-" [ref=e220]
          - cell "-" [ref=e221]
        - row "27-07-2026 Morning - 1 Afternoon - 0 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e222]:
          - cell "27-07-2026 Morning - 1 Afternoon - 0" [ref=e223]:
            - text: 27-07-2026
            - generic [ref=e224]: Morning - 1
            - generic [ref=e225]: Afternoon - 0
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e226]:
            - list [ref=e227]:
              - listitem [ref=e228]:
                - generic [ref=e229] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
          - cell [ref=e230]
        - row "28-07-2026 Morning - 1 Afternoon - 0 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e231]:
          - cell "28-07-2026 Morning - 1 Afternoon - 0" [ref=e232]:
            - text: 28-07-2026
            - generic [ref=e233]: Morning - 1
            - generic [ref=e234]: Afternoon - 0
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e235]:
            - list [ref=e236]:
              - listitem [ref=e237]:
                - generic [ref=e238] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
          - cell [ref=e239]
        - row "29-07-2026 Morning - 1 Afternoon - 0 Reschedule 1. STAR NOVA SDN BHD" [ref=e240]:
          - cell "29-07-2026 Morning - 1 Afternoon - 0" [ref=e241]:
            - text: 29-07-2026
            - generic [ref=e242]: Morning - 1
            - generic [ref=e243]: Afternoon - 0
          - cell "Reschedule 1. STAR NOVA SDN BHD" [ref=e244]:
            - list [ref=e245]:
              - listitem [ref=e246]:
                - generic [ref=e247] [cursor=pointer]: Reschedule
                - text: 1. STAR NOVA SDN BHD
          - cell [ref=e248]
        - row "30-07-2026 Morning - 0 Afternoon - 1 Reschedule 1. STAR NOVA SDN BHD" [ref=e249]:
          - cell "30-07-2026 Morning - 0 Afternoon - 1" [ref=e250]:
            - text: 30-07-2026
            - generic [ref=e251]: Morning - 0
            - generic [ref=e252]: Afternoon - 1
          - cell [ref=e253]
          - cell "Reschedule 1. STAR NOVA SDN BHD" [ref=e254]:
            - list [ref=e255]:
              - listitem [ref=e256]:
                - generic [ref=e257] [cursor=pointer]: Reschedule
                - text: 1. STAR NOVA SDN BHD
        - row "31-07-2026 Morning - 4 (Full) Afternoon - 2 Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST" [ref=e258]:
          - cell "31-07-2026 Morning - 4 (Full) Afternoon - 2" [ref=e259]:
            - text: 31-07-2026
            - generic [ref=e260]: Morning - 4 (Full)
            - generic [ref=e261]: Afternoon - 2
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST" [ref=e262]:
            - list [ref=e263]:
              - listitem [ref=e264]:
                - generic [ref=e265] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e266]:
                - generic [ref=e267] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e268]:
                - generic [ref=e269] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e270]:
                - generic [ref=e271] [cursor=pointer]: Reschedule
                - text: 4. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST" [ref=e272]:
            - list [ref=e273]:
              - listitem [ref=e274]:
                - generic [ref=e275] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e276]:
                - generic [ref=e277] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
  - table [ref=e279]:
    - rowgroup [ref=e280]:
      - row "Home | Menu 2 Pending Transaction Found! Jason Seah, My Account | Logout" [ref=e281]:
        - cell "Home | Menu 2 Pending Transaction Found!" [ref=e282]:
          - generic [ref=e283]:
            - list [ref=e284]:
              - listitem [ref=e285]:
                - link "Home |" [ref=e286] [cursor=pointer]:
                  - /url: /uat1/home/
              - listitem [ref=e287]:
                - link "Menu" [ref=e288] [cursor=pointer]:
                  - /url: "#"
                  - text: Menu
                  - img [ref=e289]
            - generic [ref=e290] [cursor=pointer]: 2 Pending Transaction Found!
        - cell "Jason Seah, My Account | Logout" [ref=e291]:
          - list [ref=e293]:
            - listitem [ref=e294]: Jason Seah,
            - listitem [ref=e295]:
              - link "My Account |" [ref=e296] [cursor=pointer]:
                - /url: /uat1/view/ucd/my-account/view.do?type=Office
            - listitem [ref=e297]:
              - link "Logout" [ref=e298] [cursor=pointer]:
                - /url: "#"
  - img [ref=e300]
  - table [ref=e302]:
    - rowgroup [ref=e303]:
      - row "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e304]:
        - cell [ref=e305]
        - cell "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e306]:
          - text: Best Compatible With Mozilla Firefox V36.0.4
          - text: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
          - link "Contact Us" [ref=e307] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Terms & Conditions" [ref=e308] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Privacy" [ref=e309] [cursor=pointer]:
            - /url: "#"
        - cell [ref=e310]:
          - img [ref=e311]
  - generic [ref=e312]:
    - generic [ref=e313]:
      - generic "Prev" [ref=e314]:
        - generic [ref=e315]: Prev
      - generic "Next" [ref=e316]:
        - generic [ref=e317]: Next
      - generic:
        - combobox [ref=e318]:
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
        - combobox [ref=e319]:
          - option "2025"
          - option "2026" [selected]
          - option "2027"
          - option "2028"
          - option "2029"
    - table [ref=e320]:
      - rowgroup [ref=e321]:
        - row "Su Mo Tu We Th Fr Sa" [ref=e322]:
          - columnheader "Su" [ref=e323]
          - columnheader "Mo" [ref=e324]
          - columnheader "Tu" [ref=e325]
          - columnheader "We" [ref=e326]
          - columnheader "Th" [ref=e327]
          - columnheader "Fr" [ref=e328]
          - columnheader "Sa" [ref=e329]
      - rowgroup [ref=e330]:
        - row "1 2 3 4" [ref=e331]:
          - cell [ref=e332]
          - cell [ref=e333]
          - cell [ref=e334]
          - cell "1" [ref=e335]:
            - link "1" [ref=e336] [cursor=pointer]:
              - /url: "#"
          - cell "2" [ref=e337]:
            - link "2" [ref=e338] [cursor=pointer]:
              - /url: "#"
          - cell "3" [ref=e339]:
            - link "3" [ref=e340] [cursor=pointer]:
              - /url: "#"
          - cell "4" [ref=e341]:
            - link "4" [ref=e342] [cursor=pointer]:
              - /url: "#"
        - row "5 6 7 8 9 10 11" [ref=e343]:
          - cell "5" [ref=e344]:
            - link "5" [ref=e345] [cursor=pointer]:
              - /url: "#"
          - cell "6" [ref=e346]:
            - link "6" [ref=e347] [cursor=pointer]:
              - /url: "#"
          - cell "7" [ref=e348]:
            - link "7" [ref=e349] [cursor=pointer]:
              - /url: "#"
          - cell "8" [ref=e350]:
            - link "8" [ref=e351] [cursor=pointer]:
              - /url: "#"
          - cell "9" [ref=e352]:
            - link "9" [ref=e353] [cursor=pointer]:
              - /url: "#"
          - cell "10" [ref=e354]:
            - link "10" [ref=e355] [cursor=pointer]:
              - /url: "#"
          - cell "11" [ref=e356]:
            - link "11" [ref=e357] [cursor=pointer]:
              - /url: "#"
        - row "12 13 14 15 16 17 18" [ref=e358]:
          - cell "12" [ref=e359]:
            - link "12" [ref=e360] [cursor=pointer]:
              - /url: "#"
          - cell "13" [ref=e361]:
            - link "13" [ref=e362] [cursor=pointer]:
              - /url: "#"
          - cell "14" [ref=e363]:
            - link "14" [ref=e364] [cursor=pointer]:
              - /url: "#"
          - cell "15" [ref=e365]:
            - link "15" [ref=e366] [cursor=pointer]:
              - /url: "#"
          - cell "16" [ref=e367]:
            - link "16" [ref=e368] [cursor=pointer]:
              - /url: "#"
          - cell "17" [ref=e369]:
            - link "17" [ref=e370] [cursor=pointer]:
              - /url: "#"
          - cell "18" [ref=e371]:
            - link "18" [ref=e372] [cursor=pointer]:
              - /url: "#"
        - row "19 20 21 22 23 24 25" [ref=e373]:
          - cell "19" [ref=e374]:
            - link "19" [ref=e375] [cursor=pointer]:
              - /url: "#"
          - cell "20" [ref=e376]:
            - link "20" [ref=e377] [cursor=pointer]:
              - /url: "#"
          - cell "21" [ref=e378]:
            - link "21" [ref=e379] [cursor=pointer]:
              - /url: "#"
          - cell "22" [ref=e380]:
            - link "22" [ref=e381] [cursor=pointer]:
              - /url: "#"
          - cell "23" [ref=e382]:
            - link "23" [ref=e383] [cursor=pointer]:
              - /url: "#"
          - cell "24" [ref=e384]:
            - link "24" [ref=e385] [cursor=pointer]:
              - /url: "#"
          - cell "25" [ref=e386]:
            - link "25" [ref=e387] [cursor=pointer]:
              - /url: "#"
        - row "26 27 28 29 30 31" [ref=e388]:
          - cell "26" [ref=e389]:
            - link "26" [ref=e390] [cursor=pointer]:
              - /url: "#"
          - cell "27" [ref=e391]:
            - link "27" [ref=e392] [cursor=pointer]:
              - /url: "#"
          - cell "28" [ref=e393]:
            - link "28" [ref=e394] [cursor=pointer]:
              - /url: "#"
          - cell "29" [ref=e395]:
            - link "29" [ref=e396] [cursor=pointer]:
              - /url: "#"
          - cell "30" [ref=e397]:
            - link "30" [ref=e398] [cursor=pointer]:
              - /url: "#"
          - cell "31" [ref=e399]:
            - link "31" [ref=e400] [cursor=pointer]:
              - /url: "#"
          - cell [ref=e401]
    - generic [ref=e402]:
      - button "Today" [ref=e403] [cursor=pointer]
      - button "Done" [ref=e404] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from "../fixtures/test-fixtures";
  2   | import { ENV } from "../utils/config";
  3   | import { openTrackedContext, closeTrackedContext } from "../utils/tracked-context";
  4   | 
  5   | const MORNING = 0;
  6   | const AFTERNOON = 1;
  7   | 
  8   | /**
  9   |  * BO Add Appointment (SRD 2.3.2.7 #4). The Add Appointment dialog resolves a
  10  |  * company (search → pick from #ac-add-dd), then an appointment date via the
  11  |  * datepicker + a mandatory time-slot radio. CSE bookings are not bound by the
  12  |  * 6/day UCD cap (the counter is informational for CSE).
  13  |  *
  14  |  * "New Record" only works for a company that already has an active SI request
  15  |  * with UNALLOCATED units. We use the "FAIZUDDIN" company (per the test
  16  |  * account); addAppointment returns null when it can't proceed (company not
  17  |  * found / no allocation), and these tests SKIP in that case rather than fail,
  18  |  * so the overall run always finishes (arrange-else-skip).
  19  |  */
  20  | // Search term = the exact company we want; addAppointment selects the result
  21  | // whose text matches this EXACTLY, so look-alikes ("FAIZUDDIN AUTO TEST 2"/"3")
  22  | // are never picked.
  23  | const COMPANY = "FAIZUDDIN AUTO TEST";
  24  | 
  25  | test.describe("Add Appointment (BO)", () => {
  26  |   test.beforeEach(async ({ loginPage }) => {
  27  |     await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
  28  |   });
  29  | 
  30  |   // Offline Purchase: the customer paid offline (not via the UCD portal), so
  31  |   // CSE creates the appointment from scratch via Add Appointment › New Record.
  32  |   test("Add Appointment - Offline Purchase (New Record)", async ({ boCalendarPage }) => {
  33  |     await boCalendarPage.navigate();
  34  | 
  35  |     const booked = await boCalendarPage.addAppointment({
  36  |       companyName: COMPANY,
  37  |       appointmentDate: boCalendarPage.daysFromToday(3),
  38  |       slot: MORNING,
  39  |     });
  40  |     if (!booked) {
  41  |       test.skip(true, `No "${COMPANY}" company with unallocated units available to add.`);
  42  |       return;
  43  |     }
  44  | 
  45  |     await boCalendarPage.navigate();
  46  |     expect(await boCalendarPage.getSlotCount(booked, MORNING)).toBeGreaterThan(0);
  47  |   });
  48  | 
  49  |   test("Add Appointment - Both slots on one date", async ({ boCalendarPage }) => {
  50  |     await boCalendarPage.navigate();
  51  |     const targetDate = boCalendarPage.daysFromToday(4);
  52  | 
  53  |     const bookedMorning = await boCalendarPage.addAppointment({
  54  |       companyName: COMPANY,
  55  |       appointmentDate: targetDate,
  56  |       slot: MORNING,
  57  |     });
  58  |     if (!bookedMorning) {
  59  |       test.skip(true, `No "${COMPANY}" company with unallocated units available to add.`);
  60  |       return;
  61  |     }
  62  |     const bookedAfternoon = await boCalendarPage.addAppointment({
  63  |       companyName: COMPANY,
  64  |       appointmentDate: bookedMorning,
  65  |       slot: AFTERNOON,
  66  |     });
  67  | 
  68  |     await boCalendarPage.navigate();
> 69  |     expect(await boCalendarPage.getSlotCount(bookedMorning, MORNING)).toBeGreaterThan(0);
      |                                                                       ^ Error: expect(received).toBeGreaterThan(expected)
  70  |     if (bookedAfternoon) {
  71  |       expect(await boCalendarPage.getSlotCount(bookedAfternoon, AFTERNOON)).toBeGreaterThan(0);
  72  |     }
  73  |   });
  74  | 
  75  |   // Partial Booking Call-in: a UCD booked only SOME of their units and phones
  76  |   // CSE to book the rest. A Software Installation must be fully booked before
  77  |   // it can be confirmed, so the only way to leave a request partially booked
  78  |   // is a BIOMETRIC purchase — its FREE installs are optional. So we ARRANGE
  79  |   // the partial state as UCD (buy 2 devices → 2 free installs, book 1, confirm
  80  |   // leaving 1 unallocated), capture the SR reference, then CALL IN as CSE and
  81  |   // book the leftover via Add Appointment › Existing Record.
  82  |   test("Add Appointment - Partial Booking Call-in", async ({ browser }, testInfo) => {
  83  |     const LoginPage = (await import("../pages/LoginPage")).LoginPage;
  84  | 
  85  |     // ── ARRANGE (UCD): buy 2 devices → 2 free installs, book only 1, confirm
  86  |     //    (free installs are optional), leaving 1 unallocated. ──
  87  |     const ucdCtx = await openTrackedContext(browser, testInfo);
  88  |     const ucdPage = await ucdCtx.newPage();
  89  |     const bio = new (await import("../pages/BiometricPurchasePage")).BiometricPurchasePage(ucdPage);
  90  |     const slot = new (await import("../pages/SlotPickerComponent")).SlotPickerComponent(ucdPage);
  91  | 
  92  |     let arranged = false;
  93  |     try {
  94  |       await new LoginPage(ucdPage).loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
  95  |       await bio.purchaseDevice({
  96  |         deviceQty: 2,
  97  |         recipientName: "Test Receiver",
  98  |         contactNo: "0123456789",
  99  |         shipToShowroom: true,
  100 |       });
  101 |       const target = await slot.findDateWithRoom(1);
  102 |       if (target) {
  103 |         await slot.allocateUnitsAnywhere(1, target); // book 1 of 2 free installs
  104 |         await slot.confirmAppointment();              // free installs optional → confirm allowed
  105 |         arranged = true;
  106 |       }
  107 |     } finally {
  108 |       await closeTrackedContext(ucdCtx, testInfo, "UCD arranges partial booking");
  109 |     }
  110 |     if (!arranged) {
  111 |       test.skip(true, "Could not arrange a partially-booked biometric request to call in about.");
  112 |       return;
  113 |     }
  114 | 
  115 |     // ── CALL-IN (CSE): look up the reference from the BO SI Listing (search
  116 |     //    the company → the freshly-created request is the newest row), then
  117 |     //    book the leftover free install via Add Appointment › Existing Record. ──
  118 |     const boCtx = await openTrackedContext(browser, testInfo);
  119 |     const boPage = await boCtx.newPage();
  120 |     const boListing = new (await import("../pages/bo/SoftwareInstallationListingPage")).SoftwareInstallationListingPage(boPage);
  121 |     const boCal = new (await import("../pages/bo/AppointmentCalendarPage")).AppointmentCalendarPage(boPage);
  122 | 
  123 |     let ref: string | null = null;
  124 |     let booked: string | null = null;
  125 |     try {
  126 |       await new LoginPage(boPage).loginAsBO(ENV.boUsername, ENV.boPassword);
  127 |       await boListing.navigate();
  128 |       ref = await boListing.getLatestReferenceForCompany(COMPANY);
  129 |       if (ref) {
  130 |         await boCal.navigate();
  131 |         booked = await boCal.addAppointment({
  132 |           companyName: COMPANY,
  133 |           existingRecordRefNo: ref,
  134 |           slot: MORNING,
  135 |         });
  136 |       }
  137 |     } finally {
  138 |       await closeTrackedContext(boCtx, testInfo, "CSE call-in booking");
  139 |     }
  140 |     if (!ref) {
  141 |       test.skip(true, `No reference found in the BO listing for "${COMPANY}".`);
  142 |       return;
  143 |     }
  144 |     expect(booked, `CSE should book the leftover unit for ${ref} via Existing Record`).not.toBeNull();
  145 |   });
  146 | 
  147 |   test("CSE not bound by 6/day cap — can add to a full slot", async ({ boCalendarPage }) => {
  148 |     await boCalendarPage.navigate();
  149 | 
  150 |     // Prefer a session the UCD-facing counter already marks (Full); CSE
  151 |     // should still be able to add to it. Falls back to any near date.
  152 |     const fullDate = await boCalendarPage.findDateWithSlotFull(MORNING);
  153 |     const booked = await boCalendarPage.addAppointment({
  154 |       companyName: COMPANY,
  155 |       appointmentDate: fullDate ?? boCalendarPage.daysFromToday(3),
  156 |       slot: MORNING,
  157 |     });
  158 |     if (!booked) {
  159 |       test.skip(true, `No "${COMPANY}" company with unallocated units available to add.`);
  160 |       return;
  161 |     }
  162 | 
  163 |     await boCalendarPage.navigate();
  164 |     // The counter is informational for CSE; the add should have succeeded.
  165 |     expect(await boCalendarPage.getSlotCount(booked, MORNING)).toBeGreaterThan(0);
  166 |   });
  167 | 
  168 |   test("Afternoon Slot Booking", async ({ boCalendarPage }) => {
  169 |     await boCalendarPage.navigate();
```