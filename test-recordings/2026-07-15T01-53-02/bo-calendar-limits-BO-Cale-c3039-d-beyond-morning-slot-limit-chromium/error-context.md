# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: bo-calendar-limits.spec.ts >> BO Calendar & Limits >> BO add beyond morning slot limit
- Location: tests\service-hub\specs\bo-calendar-limits.spec.ts:35:7

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
        - row "20-07-2026 Morning - 3 (Full) Afternoon - 2 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 2. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 3. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST" [ref=e163]:
          - cell "20-07-2026 Morning - 3 (Full) Afternoon - 2" [ref=e164]:
            - text: 20-07-2026
            - generic [ref=e165]: Morning - 3 (Full)
            - generic [ref=e166]: Afternoon - 2
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
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST" [ref=e175]:
            - list [ref=e176]:
              - listitem [ref=e177]:
                - generic [ref=e178] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e179]:
                - generic [ref=e180] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
        - row "21-07-2026 Morning - 2 Afternoon - 1 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 2. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 1. FAIZUDDIN AUTO TEST" [ref=e181]:
          - cell "21-07-2026 Morning - 2 Afternoon - 1" [ref=e182]:
            - text: 21-07-2026
            - generic [ref=e183]: Morning - 2
            - generic [ref=e184]: Afternoon - 1
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 2. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e185]:
            - list [ref=e186]:
              - listitem [ref=e187]:
                - generic [ref=e188] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
              - listitem [ref=e189]:
                - generic [ref=e190] [cursor=pointer]: Reschedule
                - text: 2. CHARRRRRR CHICKCOLI SDN BHD123321
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST" [ref=e191]:
            - list [ref=e192]:
              - listitem [ref=e193]:
                - generic [ref=e194] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
        - row "22-07-2026 Morning - 1 Afternoon - 0 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e195]:
          - cell "22-07-2026 Morning - 1 Afternoon - 0" [ref=e196]:
            - text: 22-07-2026
            - generic [ref=e197]: Morning - 1
            - generic [ref=e198]: Afternoon - 0
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e199]:
            - list [ref=e200]:
              - listitem [ref=e201]:
                - generic [ref=e202] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
          - cell [ref=e203]
        - row "23-07-2026 Morning - 1 Afternoon - 0 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e204]:
          - cell "23-07-2026 Morning - 1 Afternoon - 0" [ref=e205]:
            - text: 23-07-2026
            - generic [ref=e206]: Morning - 1
            - generic [ref=e207]: Afternoon - 0
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e208]:
            - list [ref=e209]:
              - listitem [ref=e210]:
                - generic [ref=e211] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
          - cell [ref=e212]
        - row "24-07-2026 Morning - 1 Afternoon - 0 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e213]:
          - cell "24-07-2026 Morning - 1 Afternoon - 0" [ref=e214]:
            - text: 24-07-2026
            - generic [ref=e215]: Morning - 1
            - generic [ref=e216]: Afternoon - 0
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e217]:
            - list [ref=e218]:
              - listitem [ref=e219]:
                - generic [ref=e220] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
          - cell [ref=e221]
        - row "25-07-2026 - -" [ref=e222]:
          - cell "25-07-2026" [ref=e223]
          - cell "-" [ref=e224]
          - cell "-" [ref=e225]
        - row "26-07-2026 - -" [ref=e226]:
          - cell "26-07-2026" [ref=e227]
          - cell "-" [ref=e228]
          - cell "-" [ref=e229]
        - row "27-07-2026 Morning - 1 Afternoon - 0 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e230]:
          - cell "27-07-2026 Morning - 1 Afternoon - 0" [ref=e231]:
            - text: 27-07-2026
            - generic [ref=e232]: Morning - 1
            - generic [ref=e233]: Afternoon - 0
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e234]:
            - list [ref=e235]:
              - listitem [ref=e236]:
                - generic [ref=e237] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
          - cell [ref=e238]
        - row "28-07-2026 Morning - 1 Afternoon - 0 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e239]:
          - cell "28-07-2026 Morning - 1 Afternoon - 0" [ref=e240]:
            - text: 28-07-2026
            - generic [ref=e241]: Morning - 1
            - generic [ref=e242]: Afternoon - 0
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e243]:
            - list [ref=e244]:
              - listitem [ref=e245]:
                - generic [ref=e246] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
          - cell [ref=e247]
        - row "29-07-2026 Morning - 1 Afternoon - 0 Reschedule 1. STAR NOVA SDN BHD" [ref=e248]:
          - cell "29-07-2026 Morning - 1 Afternoon - 0" [ref=e249]:
            - text: 29-07-2026
            - generic [ref=e250]: Morning - 1
            - generic [ref=e251]: Afternoon - 0
          - cell "Reschedule 1. STAR NOVA SDN BHD" [ref=e252]:
            - list [ref=e253]:
              - listitem [ref=e254]:
                - generic [ref=e255] [cursor=pointer]: Reschedule
                - text: 1. STAR NOVA SDN BHD
          - cell [ref=e256]
        - row "30-07-2026 Morning - 0 Afternoon - 1 Reschedule 1. STAR NOVA SDN BHD" [ref=e257]:
          - cell "30-07-2026 Morning - 0 Afternoon - 1" [ref=e258]:
            - text: 30-07-2026
            - generic [ref=e259]: Morning - 0
            - generic [ref=e260]: Afternoon - 1
          - cell [ref=e261]
          - cell "Reschedule 1. STAR NOVA SDN BHD" [ref=e262]:
            - list [ref=e263]:
              - listitem [ref=e264]:
                - generic [ref=e265] [cursor=pointer]: Reschedule
                - text: 1. STAR NOVA SDN BHD
        - row "31-07-2026 Morning - 8 (Full) Afternoon - 3 (Full) Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. FAIZUDDIN AUTO TEST Reschedule 6. FAIZUDDIN AUTO TEST Reschedule 7. FAIZUDDIN AUTO TEST Reschedule 8. FAIZUDDIN AUTO TEST Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST" [ref=e266]:
          - cell "31-07-2026 Morning - 8 (Full) Afternoon - 3 (Full)" [ref=e267]:
            - text: 31-07-2026
            - generic [ref=e268]: Morning - 8 (Full)
            - generic [ref=e269]: Afternoon - 3 (Full)
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. FAIZUDDIN AUTO TEST Reschedule 6. FAIZUDDIN AUTO TEST Reschedule 7. FAIZUDDIN AUTO TEST Reschedule 8. FAIZUDDIN AUTO TEST" [ref=e270]:
            - list [ref=e271]:
              - listitem [ref=e272]:
                - generic [ref=e273] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e274]:
                - generic [ref=e275] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e276]:
                - generic [ref=e277] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e278]:
                - generic [ref=e279] [cursor=pointer]: Reschedule
                - text: 4. FAIZUDDIN AUTO TEST
              - listitem [ref=e280]:
                - generic [ref=e281] [cursor=pointer]: Reschedule
                - text: 5. FAIZUDDIN AUTO TEST
              - listitem [ref=e282]:
                - generic [ref=e283] [cursor=pointer]: Reschedule
                - text: 6. FAIZUDDIN AUTO TEST
              - listitem [ref=e284]:
                - generic [ref=e285] [cursor=pointer]: Reschedule
                - text: 7. FAIZUDDIN AUTO TEST
              - listitem [ref=e286]:
                - generic [ref=e287] [cursor=pointer]: Reschedule
                - text: 8. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST" [ref=e288]:
            - list [ref=e289]:
              - listitem [ref=e290]:
                - generic [ref=e291] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e292]:
                - generic [ref=e293] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e294]:
                - generic [ref=e295] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
  - table [ref=e297]:
    - rowgroup [ref=e298]:
      - row "Home | Menu 2 Pending Transaction Found! Jason Seah, My Account | Logout" [ref=e299]:
        - cell "Home | Menu 2 Pending Transaction Found!" [ref=e300]:
          - generic [ref=e301]:
            - list [ref=e302]:
              - listitem [ref=e303]:
                - link "Home |" [ref=e304] [cursor=pointer]:
                  - /url: /uat1/home/
              - listitem [ref=e305]:
                - link "Menu" [ref=e306] [cursor=pointer]:
                  - /url: "#"
                  - text: Menu
                  - img [ref=e307]
            - generic [ref=e308] [cursor=pointer]: 2 Pending Transaction Found!
        - cell "Jason Seah, My Account | Logout" [ref=e309]:
          - list [ref=e311]:
            - listitem [ref=e312]: Jason Seah,
            - listitem [ref=e313]:
              - link "My Account |" [ref=e314] [cursor=pointer]:
                - /url: /uat1/view/ucd/my-account/view.do?type=Office
            - listitem [ref=e315]:
              - link "Logout" [ref=e316] [cursor=pointer]:
                - /url: "#"
  - img [ref=e318]
  - table [ref=e320]:
    - rowgroup [ref=e321]:
      - row "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e322]:
        - cell [ref=e323]
        - cell "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e324]:
          - text: Best Compatible With Mozilla Firefox V36.0.4
          - text: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
          - link "Contact Us" [ref=e325] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Terms & Conditions" [ref=e326] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Privacy" [ref=e327] [cursor=pointer]:
            - /url: "#"
        - cell [ref=e328]:
          - img [ref=e329]
  - generic [ref=e330]:
    - generic [ref=e331]:
      - generic "Prev" [ref=e332]:
        - generic [ref=e333]: Prev
      - generic "Next" [ref=e334]:
        - generic [ref=e335]: Next
      - generic:
        - combobox [ref=e336]:
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
        - combobox [ref=e337]:
          - option "2025"
          - option "2026" [selected]
          - option "2027"
          - option "2028"
          - option "2029"
    - table [ref=e338]:
      - rowgroup [ref=e339]:
        - row "Su Mo Tu We Th Fr Sa" [ref=e340]:
          - columnheader "Su" [ref=e341]
          - columnheader "Mo" [ref=e342]
          - columnheader "Tu" [ref=e343]
          - columnheader "We" [ref=e344]
          - columnheader "Th" [ref=e345]
          - columnheader "Fr" [ref=e346]
          - columnheader "Sa" [ref=e347]
      - rowgroup [ref=e348]:
        - row "1 2 3 4" [ref=e349]:
          - cell [ref=e350]
          - cell [ref=e351]
          - cell [ref=e352]
          - cell "1" [ref=e353]:
            - link "1" [ref=e354] [cursor=pointer]:
              - /url: "#"
          - cell "2" [ref=e355]:
            - link "2" [ref=e356] [cursor=pointer]:
              - /url: "#"
          - cell "3" [ref=e357]:
            - link "3" [ref=e358] [cursor=pointer]:
              - /url: "#"
          - cell "4" [ref=e359]:
            - link "4" [ref=e360] [cursor=pointer]:
              - /url: "#"
        - row "5 6 7 8 9 10 11" [ref=e361]:
          - cell "5" [ref=e362]:
            - link "5" [ref=e363] [cursor=pointer]:
              - /url: "#"
          - cell "6" [ref=e364]:
            - link "6" [ref=e365] [cursor=pointer]:
              - /url: "#"
          - cell "7" [ref=e366]:
            - link "7" [ref=e367] [cursor=pointer]:
              - /url: "#"
          - cell "8" [ref=e368]:
            - link "8" [ref=e369] [cursor=pointer]:
              - /url: "#"
          - cell "9" [ref=e370]:
            - link "9" [ref=e371] [cursor=pointer]:
              - /url: "#"
          - cell "10" [ref=e372]:
            - link "10" [ref=e373] [cursor=pointer]:
              - /url: "#"
          - cell "11" [ref=e374]:
            - link "11" [ref=e375] [cursor=pointer]:
              - /url: "#"
        - row "12 13 14 15 16 17 18" [ref=e376]:
          - cell "12" [ref=e377]:
            - link "12" [ref=e378] [cursor=pointer]:
              - /url: "#"
          - cell "13" [ref=e379]:
            - link "13" [ref=e380] [cursor=pointer]:
              - /url: "#"
          - cell "14" [ref=e381]:
            - link "14" [ref=e382] [cursor=pointer]:
              - /url: "#"
          - cell "15" [ref=e383]:
            - link "15" [ref=e384] [cursor=pointer]:
              - /url: "#"
          - cell "16" [ref=e385]:
            - link "16" [ref=e386] [cursor=pointer]:
              - /url: "#"
          - cell "17" [ref=e387]:
            - link "17" [ref=e388] [cursor=pointer]:
              - /url: "#"
          - cell "18" [ref=e389]:
            - link "18" [ref=e390] [cursor=pointer]:
              - /url: "#"
        - row "19 20 21 22 23 24 25" [ref=e391]:
          - cell "19" [ref=e392]:
            - link "19" [ref=e393] [cursor=pointer]:
              - /url: "#"
          - cell "20" [ref=e394]:
            - link "20" [ref=e395] [cursor=pointer]:
              - /url: "#"
          - cell "21" [ref=e396]:
            - link "21" [ref=e397] [cursor=pointer]:
              - /url: "#"
          - cell "22" [ref=e398]:
            - link "22" [ref=e399] [cursor=pointer]:
              - /url: "#"
          - cell "23" [ref=e400]:
            - link "23" [ref=e401] [cursor=pointer]:
              - /url: "#"
          - cell "24" [ref=e402]:
            - link "24" [ref=e403] [cursor=pointer]:
              - /url: "#"
          - cell "25" [ref=e404]:
            - link "25" [ref=e405] [cursor=pointer]:
              - /url: "#"
        - row "26 27 28 29 30 31" [ref=e406]:
          - cell "26" [ref=e407]:
            - link "26" [ref=e408] [cursor=pointer]:
              - /url: "#"
          - cell "27" [ref=e409]:
            - link "27" [ref=e410] [cursor=pointer]:
              - /url: "#"
          - cell "28" [ref=e411]:
            - link "28" [ref=e412] [cursor=pointer]:
              - /url: "#"
          - cell "29" [ref=e413]:
            - link "29" [ref=e414] [cursor=pointer]:
              - /url: "#"
          - cell "30" [ref=e415]:
            - link "30" [ref=e416] [cursor=pointer]:
              - /url: "#"
          - cell "31" [ref=e417]:
            - link "31" [ref=e418] [cursor=pointer]:
              - /url: "#"
          - cell [ref=e419]
    - generic [ref=e420]:
      - button "Today" [ref=e421] [cursor=pointer]
      - button "Done" [ref=e422] [cursor=pointer]
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
  8   | // The BO test company (several "FAIZUDDIN …" look-alikes exist; addAppointment
  9   | // selects this one by EXACT match). CSE bookings are not bound by the 3/slot
  10  | // (6/day) cap, so an add should simply proceed.
  11  | const COMPANY = "FAIZUDDIN AUTO TEST";
  12  | 
  13  | /**
  14  |  * BO / CSE calendar limits (SRD 2.3.2.7). CSE is not bound by the UCD 6/day
  15  |  * cap, so adding an appointment should proceed regardless of how full the
  16  |  * slot already is. Tests skip (rather than fail) when the company has no
  17  |  * unallocated units to add against.
  18  |  *
  19  |  * The date-rule tests (current/next day, previous dates, >2 months, weekends,
  20  |  * public holiday) are VIEW-only — they open the Add Appointment dialog and
  21  |  * inspect its #ac-add-date datepicker (via isAddDateSelectable), then cancel
  22  |  * without booking anything. Verified live: the read-only #cal-table grid only
  23  |  * ever displays existing bookings and has no "blocked" concept — the real
  24  |  * book/no-book gate is this datepicker, where:
  25  |  *   - past dates: disabled ("ui-datepicker-unselectable ui-state-disabled")
  26  |  *   - weekends: disabled, plus "ui-datepicker-week-end"
  27  |  *   - today and all future weekdays (including >2 months out): enabled —
  28  |  *     BO/CSE has no +2-day blackout and no 2-month window limit.
  29  |  */
  30  | test.describe("BO Calendar & Limits", () => {
  31  |   test.beforeEach(async ({ loginPage }) => {
  32  |     await loginPage.loginAsBO(ENV.boUsername, ENV.boPassword);
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
> 44  |     expect(await boCalendarPage.getSlotCount(booked, MORNING)).toBeGreaterThan(0);
      |                                                                ^ Error: expect(received).toBeGreaterThan(expected)
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
  96  |         await ucdListing.searchByReferenceNo(ref);
  97  |         const row = await ucdListing.findRowByRefNo(ref);
  98  |         // Best-effort: only assert when this UCD account owns the reference.
  99  |         if (row) {
  100 |           expect((await ucdListing.getRowServiceType(row)).length).toBeGreaterThan(0);
  101 |         }
  102 |       } finally {
  103 |         await closeTrackedContext(ucdCtx, testInfo, "UCD verifies listing");
  104 |       }
  105 |     });
  106 |   });
  107 | 
  108 |   test("BO add for current day and the next day", async ({ boCalendarPage }) => {
  109 |     await boCalendarPage.navigate();
  110 |     const dialog = await boCalendarPage.openAddDialog();
  111 |     await test.step("Expected: able to proceed with booking today and tomorrow", async () => {
  112 |       expect(await boCalendarPage.isAddDateSelectable(boCalendarPage.today())).toBe(true);
  113 |       expect(await boCalendarPage.isAddDateSelectable(boCalendarPage.daysFromToday(1))).toBe(true);
  114 |     });
  115 |     await boCalendarPage.closeAddDialog(dialog);
  116 |   });
  117 | 
  118 |   test("BO add for previous dates", async ({ boCalendarPage }) => {
  119 |     await boCalendarPage.navigate();
  120 |     const dialog = await boCalendarPage.openAddDialog();
  121 |     await test.step("Expected: a previous date is not selectable", async () => {
  122 |       expect(await boCalendarPage.isAddDateSelectable(boCalendarPage.yesterday())).toBe(false);
  123 |     });
  124 |     await boCalendarPage.closeAddDialog(dialog);
  125 |   });
  126 | 
  127 |   test("BO book future date more than 2 months", async ({ boCalendarPage }) => {
  128 |     await boCalendarPage.navigate();
  129 |     const dialog = await boCalendarPage.openAddDialog();
  130 |     const far = boCalendarPage.dateMonthsAhead(3);
  131 |     await test.step(`Expected: ${far} (>2 months out) CAN be booked by BO`, async () => {
  132 |       expect(await boCalendarPage.isAddDateSelectable(far)).toBe(true);
  133 |     });
  134 |     await boCalendarPage.closeAddDialog(dialog);
  135 |   });
  136 | 
  137 |   test("BO book weekend dates", async ({ boCalendarPage }) => {
  138 |     await boCalendarPage.navigate();
  139 |     const dialog = await boCalendarPage.openAddDialog();
  140 |     const weekend = boCalendarPage.nextWeekend();
  141 |     await test.step(`Expected: weekend ${weekend} is greyed out / unclickable`, async () => {
  142 |       expect(await boCalendarPage.isAddDateSelectable(weekend)).toBe(false);
  143 |     });
  144 |     await boCalendarPage.closeAddDialog(dialog);
```