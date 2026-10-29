# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: bo-calendar-limits.spec.ts >> BO Calendar & Limits >> BO add for current day and the next day
- Location: tests\service-hub\specs\bo-calendar-limits.spec.ts:163:7

# Error details

```
Error: Add Appointment should complete using listing seed SR67000127

expect(received).not.toBeNull()

Received: null
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
        - row "17-07-2026 Morning - 0 Afternoon - 1 Reschedule 1. TRAZE" [ref=e106]:
          - cell "17-07-2026 Morning - 0 Afternoon - 1" [ref=e107]:
            - text: 17-07-2026
            - generic [ref=e108]: Morning - 0
            - generic [ref=e109]: Afternoon - 1
          - cell [ref=e110]
          - cell "Reschedule 1. TRAZE" [ref=e111]:
            - list [ref=e112]:
              - listitem [ref=e113]:
                - generic [ref=e114] [cursor=pointer]: Reschedule
                - text: 1. TRAZE
        - row "18-07-2026 - -" [ref=e115]:
          - cell "18-07-2026" [ref=e116]
          - cell "-" [ref=e117]
          - cell "-" [ref=e118]
        - row "19-07-2026 - -" [ref=e119]:
          - cell "19-07-2026" [ref=e120]
          - cell "-" [ref=e121]
          - cell "-" [ref=e122]
        - row "20-07-2026 Morning - 6 (Full) Afternoon - 3 (Full) Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. 193 AUTO TRADING Reschedule 6. FAIZUDDIN AUTO TEST Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e123]:
          - cell "20-07-2026 Morning - 6 (Full) Afternoon - 3 (Full)" [ref=e124]:
            - text: 20-07-2026
            - generic [ref=e125]: Morning - 6 (Full)
            - generic [ref=e126]: Afternoon - 3 (Full)
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. 193 AUTO TRADING Reschedule 6. FAIZUDDIN AUTO TEST" [ref=e127]:
            - list [ref=e128]:
              - listitem [ref=e129]:
                - generic [ref=e130] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e131]:
                - generic [ref=e132] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e133]:
                - generic [ref=e134] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e135]:
                - generic [ref=e136] [cursor=pointer]: Reschedule
                - text: 4. FAIZUDDIN AUTO TEST
              - listitem [ref=e137]:
                - generic [ref=e138] [cursor=pointer]: Reschedule
                - text: 5. 193 AUTO TRADING
              - listitem [ref=e139]:
                - generic [ref=e140] [cursor=pointer]: Reschedule
                - text: 6. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e141]:
            - list [ref=e142]:
              - listitem [ref=e143]:
                - generic [ref=e144] [cursor=pointer]: Reschedule
                - text: 1. MUSICHOB SDN BHD
              - listitem [ref=e145]:
                - generic [ref=e146] [cursor=pointer]: Reschedule
                - text: 2. MUSICHOB SDN BHD
              - listitem [ref=e147]:
                - generic [ref=e148] [cursor=pointer]: Reschedule
                - text: 3. MUSICHOB SDN BHD
        - row "21-07-2026 Morning - 6 (Full) Afternoon - 3 (Full) 1. MUSICHOB SDN BHD Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. MUSICHOB SDN BHD Reschedule 5. FAIZUDDIN AUTO TEST Reschedule 6. MUSICHOB SDN BHD Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e149]:
          - cell "21-07-2026 Morning - 6 (Full) Afternoon - 3 (Full)" [ref=e150]:
            - text: 21-07-2026
            - generic [ref=e151]: Morning - 6 (Full)
            - generic [ref=e152]: Afternoon - 3 (Full)
          - cell "1. MUSICHOB SDN BHD Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. MUSICHOB SDN BHD Reschedule 5. FAIZUDDIN AUTO TEST Reschedule 6. MUSICHOB SDN BHD" [ref=e153]:
            - list [ref=e154]:
              - listitem [ref=e155]: 1. MUSICHOB SDN BHD
              - listitem [ref=e156]:
                - generic [ref=e157] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e158]:
                - generic [ref=e159] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e160]:
                - generic [ref=e161] [cursor=pointer]: Reschedule
                - text: 4. MUSICHOB SDN BHD
              - listitem [ref=e162]:
                - generic [ref=e163] [cursor=pointer]: Reschedule
                - text: 5. FAIZUDDIN AUTO TEST
              - listitem [ref=e164]:
                - generic [ref=e165] [cursor=pointer]: Reschedule
                - text: 6. MUSICHOB SDN BHD
          - cell "Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e166]:
            - list [ref=e167]:
              - listitem [ref=e168]:
                - generic [ref=e169] [cursor=pointer]: Reschedule
                - text: 1. MUSICHOB SDN BHD
              - listitem [ref=e170]:
                - generic [ref=e171] [cursor=pointer]: Reschedule
                - text: 2. MUSICHOB SDN BHD
              - listitem [ref=e172]:
                - generic [ref=e173] [cursor=pointer]: Reschedule
                - text: 3. MUSICHOB SDN BHD
        - row "22-07-2026 Morning - 2 Afternoon - 3 (Full) Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 3. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 4. FAIZUDDIN AUTO TEST" [ref=e174]:
          - cell "22-07-2026 Morning - 2 Afternoon - 3 (Full)" [ref=e175]:
            - text: 22-07-2026
            - generic [ref=e176]: Morning - 2
            - generic [ref=e177]: Afternoon - 3 (Full)
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST" [ref=e178]:
            - list [ref=e179]:
              - listitem [ref=e180]:
                - generic [ref=e181] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e182]:
                - generic [ref=e183] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e184]:
                - generic [ref=e185] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 3. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 4. FAIZUDDIN AUTO TEST" [ref=e186]:
            - list [ref=e187]:
              - listitem [ref=e188]:
                - generic [ref=e189] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e190]:
                - generic [ref=e191] [cursor=pointer]: Reschedule
                - text: 2. CHARRRRRR CHICKCOLI SDN BHD123321
              - listitem [ref=e192]:
                - generic [ref=e193] [cursor=pointer]: Reschedule
                - text: 3. CHARRRRRR CHICKCOLI SDN BHD123321
              - listitem [ref=e194]:
                - generic [ref=e195] [cursor=pointer]: Reschedule
                - text: 4. FAIZUDDIN AUTO TEST
        - row "23-07-2026 Morning - 3 (Full) Afternoon - 3 (Full) Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. JIMI HUUH Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST" [ref=e196]:
          - cell "23-07-2026 Morning - 3 (Full) Afternoon - 3 (Full)" [ref=e197]:
            - text: 23-07-2026
            - generic [ref=e198]: Morning - 3 (Full)
            - generic [ref=e199]: Afternoon - 3 (Full)
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. JIMI HUUH Reschedule 3. FAIZUDDIN AUTO TEST" [ref=e200]:
            - list [ref=e201]:
              - listitem [ref=e202]:
                - generic [ref=e203] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e204]:
                - generic [ref=e205] [cursor=pointer]: Reschedule
                - text: 2. JIMI HUUH
              - listitem [ref=e206]:
                - generic [ref=e207] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST" [ref=e208]:
            - list [ref=e209]:
              - listitem [ref=e210]:
                - generic [ref=e211] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e212]:
                - generic [ref=e213] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e214]:
                - generic [ref=e215] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
        - row "24-07-2026 Morning - 0 Afternoon - 0" [ref=e216]:
          - cell "24-07-2026 Morning - 0 Afternoon - 0" [ref=e217]:
            - text: 24-07-2026
            - generic [ref=e218]: Morning - 0
            - generic [ref=e219]: Afternoon - 0
          - cell [ref=e220]
          - cell [ref=e221]
        - row "25-07-2026 - -" [ref=e222]:
          - cell "25-07-2026" [ref=e223]
          - cell "-" [ref=e224]
          - cell "-" [ref=e225]
        - row "26-07-2026 - -" [ref=e226]:
          - cell "26-07-2026" [ref=e227]
          - cell "-" [ref=e228]
          - cell "-" [ref=e229]
        - row "27-07-2026 Morning - 0 Afternoon - 0" [ref=e230]:
          - cell "27-07-2026 Morning - 0 Afternoon - 0" [ref=e231]:
            - text: 27-07-2026
            - generic [ref=e232]: Morning - 0
            - generic [ref=e233]: Afternoon - 0
          - cell [ref=e234]
          - cell [ref=e235]
        - row "28-07-2026 Morning - 0 Afternoon - 0" [ref=e236]:
          - cell "28-07-2026 Morning - 0 Afternoon - 0" [ref=e237]:
            - text: 28-07-2026
            - generic [ref=e238]: Morning - 0
            - generic [ref=e239]: Afternoon - 0
          - cell [ref=e240]
          - cell [ref=e241]
        - row "29-07-2026 Morning - 0 Afternoon - 0" [ref=e242]:
          - cell "29-07-2026 Morning - 0 Afternoon - 0" [ref=e243]:
            - text: 29-07-2026
            - generic [ref=e244]: Morning - 0
            - generic [ref=e245]: Afternoon - 0
          - cell [ref=e246]
          - cell [ref=e247]
        - row "30-07-2026 Morning - 1 Afternoon - 1 Reschedule 1. JIMI HUUH Reschedule 1. JIMI HUUH" [ref=e248]:
          - cell "30-07-2026 Morning - 1 Afternoon - 1" [ref=e249]:
            - text: 30-07-2026
            - generic [ref=e250]: Morning - 1
            - generic [ref=e251]: Afternoon - 1
          - cell "Reschedule 1. JIMI HUUH" [ref=e252]:
            - list [ref=e253]:
              - listitem [ref=e254]:
                - generic [ref=e255] [cursor=pointer]: Reschedule
                - text: 1. JIMI HUUH
          - cell "Reschedule 1. JIMI HUUH" [ref=e256]:
            - list [ref=e257]:
              - listitem [ref=e258]:
                - generic [ref=e259] [cursor=pointer]: Reschedule
                - text: 1. JIMI HUUH
        - row "31-07-2026 Morning - 6 (Full) Afternoon - 3 (Full) Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. MUSICHOB SDN BHD Reschedule 6. FAIZUDDIN AUTO TEST Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. MUSICHOB SDN BHD" [ref=e260]:
          - cell "31-07-2026 Morning - 6 (Full) Afternoon - 3 (Full)" [ref=e261]:
            - text: 31-07-2026
            - generic [ref=e262]: Morning - 6 (Full)
            - generic [ref=e263]: Afternoon - 3 (Full)
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. MUSICHOB SDN BHD Reschedule 6. FAIZUDDIN AUTO TEST" [ref=e264]:
            - list [ref=e265]:
              - listitem [ref=e266]:
                - generic [ref=e267] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e268]:
                - generic [ref=e269] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e270]:
                - generic [ref=e271] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e272]:
                - generic [ref=e273] [cursor=pointer]: Reschedule
                - text: 4. FAIZUDDIN AUTO TEST
              - listitem [ref=e274]:
                - generic [ref=e275] [cursor=pointer]: Reschedule
                - text: 5. MUSICHOB SDN BHD
              - listitem [ref=e276]:
                - generic [ref=e277] [cursor=pointer]: Reschedule
                - text: 6. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. MUSICHOB SDN BHD" [ref=e278]:
            - list [ref=e279]:
              - listitem [ref=e280]:
                - generic [ref=e281] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e282]:
                - generic [ref=e283] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e284]:
                - generic [ref=e285] [cursor=pointer]: Reschedule
                - text: 3. MUSICHOB SDN BHD
  - table [ref=e287]:
    - rowgroup [ref=e288]:
      - row "Home | Menu 2 Pending Transaction Found! Jason Seah, My Account | Logout" [ref=e289]:
        - cell "Home | Menu 2 Pending Transaction Found!" [ref=e290]:
          - generic [ref=e291]:
            - list [ref=e292]:
              - listitem [ref=e293]:
                - link "Home |" [ref=e294] [cursor=pointer]:
                  - /url: /uat1/home/
              - listitem [ref=e295]:
                - link "Menu" [ref=e296] [cursor=pointer]:
                  - /url: "#"
                  - text: Menu
                  - img [ref=e297]
            - generic [ref=e298] [cursor=pointer]: 2 Pending Transaction Found!
        - cell "Jason Seah, My Account | Logout" [ref=e299]:
          - list [ref=e301]:
            - listitem [ref=e302]: Jason Seah,
            - listitem [ref=e303]:
              - link "My Account |" [ref=e304] [cursor=pointer]:
                - /url: /uat1/view/ucd/my-account/view.do?type=Office
            - listitem [ref=e305]:
              - link "Logout" [ref=e306] [cursor=pointer]:
                - /url: "#"
  - img [ref=e308]
  - table [ref=e310]:
    - rowgroup [ref=e311]:
      - row "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e312]:
        - cell [ref=e313]
        - cell "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e314]:
          - text: Best Compatible With Mozilla Firefox V36.0.4
          - text: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
          - link "Contact Us" [ref=e315] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Terms & Conditions" [ref=e316] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Privacy" [ref=e317] [cursor=pointer]:
            - /url: "#"
        - cell [ref=e318]:
          - img [ref=e319]
  - generic [ref=e320]:
    - generic [ref=e321]:
      - generic "Prev" [ref=e322]:
        - generic [ref=e323]: Prev
      - generic "Next" [ref=e324]:
        - generic [ref=e325]: Next
      - generic:
        - combobox [ref=e326]:
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
        - combobox [ref=e327]:
          - option "2025"
          - option "2026" [selected]
          - option "2027"
          - option "2028"
          - option "2029"
    - table [ref=e328]:
      - rowgroup [ref=e329]:
        - row "Su Mo Tu We Th Fr Sa" [ref=e330]:
          - columnheader "Su" [ref=e331]
          - columnheader "Mo" [ref=e332]
          - columnheader "Tu" [ref=e333]
          - columnheader "We" [ref=e334]
          - columnheader "Th" [ref=e335]
          - columnheader "Fr" [ref=e336]
          - columnheader "Sa" [ref=e337]
      - rowgroup [ref=e338]:
        - row "1 2 3 4" [ref=e339]:
          - cell [ref=e340]
          - cell [ref=e341]
          - cell [ref=e342]
          - cell "1" [ref=e343]:
            - link "1" [ref=e344] [cursor=pointer]:
              - /url: "#"
          - cell "2" [ref=e345]:
            - link "2" [ref=e346] [cursor=pointer]:
              - /url: "#"
          - cell "3" [ref=e347]:
            - link "3" [ref=e348] [cursor=pointer]:
              - /url: "#"
          - cell "4" [ref=e349]:
            - link "4" [ref=e350] [cursor=pointer]:
              - /url: "#"
        - row "5 6 7 8 9 10 11" [ref=e351]:
          - cell "5" [ref=e352]:
            - link "5" [ref=e353] [cursor=pointer]:
              - /url: "#"
          - cell "6" [ref=e354]:
            - link "6" [ref=e355] [cursor=pointer]:
              - /url: "#"
          - cell "7" [ref=e356]:
            - link "7" [ref=e357] [cursor=pointer]:
              - /url: "#"
          - cell "8" [ref=e358]:
            - link "8" [ref=e359] [cursor=pointer]:
              - /url: "#"
          - cell "9" [ref=e360]:
            - link "9" [ref=e361] [cursor=pointer]:
              - /url: "#"
          - cell "10" [ref=e362]:
            - link "10" [ref=e363] [cursor=pointer]:
              - /url: "#"
          - cell "11" [ref=e364]:
            - link "11" [ref=e365] [cursor=pointer]:
              - /url: "#"
        - row "12 13 14 15 16 17 18" [ref=e366]:
          - cell "12" [ref=e367]:
            - link "12" [ref=e368] [cursor=pointer]:
              - /url: "#"
          - cell "13" [ref=e369]:
            - link "13" [ref=e370] [cursor=pointer]:
              - /url: "#"
          - cell "14" [ref=e371]:
            - link "14" [ref=e372] [cursor=pointer]:
              - /url: "#"
          - cell "15" [ref=e373]:
            - link "15" [ref=e374] [cursor=pointer]:
              - /url: "#"
          - cell "16" [ref=e375]:
            - link "16" [ref=e376] [cursor=pointer]:
              - /url: "#"
          - cell "17" [ref=e377]:
            - link "17" [ref=e378] [cursor=pointer]:
              - /url: "#"
          - cell "18" [ref=e379]:
            - link "18" [ref=e380] [cursor=pointer]:
              - /url: "#"
        - row "19 20 21 22 23 24 25" [ref=e381]:
          - cell "19" [ref=e382]:
            - link "19" [ref=e383] [cursor=pointer]:
              - /url: "#"
          - cell "20" [ref=e384]:
            - link "20" [ref=e385] [cursor=pointer]:
              - /url: "#"
          - cell "21" [ref=e386]:
            - link "21" [ref=e387] [cursor=pointer]:
              - /url: "#"
          - cell "22" [ref=e388]:
            - link "22" [ref=e389] [cursor=pointer]:
              - /url: "#"
          - cell "23" [ref=e390]:
            - link "23" [ref=e391] [cursor=pointer]:
              - /url: "#"
          - cell "24" [ref=e392]:
            - link "24" [ref=e393] [cursor=pointer]:
              - /url: "#"
          - cell "25" [ref=e394]:
            - link "25" [ref=e395] [cursor=pointer]:
              - /url: "#"
        - row "26 27 28 29 30 31" [ref=e396]:
          - cell "26" [ref=e397]:
            - link "26" [ref=e398] [cursor=pointer]:
              - /url: "#"
          - cell "27" [ref=e399]:
            - link "27" [ref=e400] [cursor=pointer]:
              - /url: "#"
          - cell "28" [ref=e401]:
            - link "28" [ref=e402] [cursor=pointer]:
              - /url: "#"
          - cell "29" [ref=e403]:
            - link "29" [ref=e404] [cursor=pointer]:
              - /url: "#"
          - cell "30" [ref=e405]:
            - link "30" [ref=e406] [cursor=pointer]:
              - /url: "#"
          - cell "31" [ref=e407]:
            - link "31" [ref=e408] [cursor=pointer]:
              - /url: "#"
          - cell [ref=e409]
    - generic [ref=e410]:
      - button "Today" [ref=e411] [cursor=pointer]
      - button "Done" [ref=e412] [cursor=pointer]
```

# Test source

```ts
  80  |     }
  81  |     await boCalendarPage.navigate();
  82  |     const booked = await boCalendarPage.addAppointment({ companyName: COMPANY, existingRecordRefNo: ref, slot: MORNING });
  83  |     if (!booked) {
  84  |       test.skip(true, `Could not add an appointment for reference ${ref}.`);
  85  |       return;
  86  |     }
  87  |     await boCalendarPage.navigate();
  88  |     // Expected: CSE can proceed — the morning slot count reflects the add.
  89  |     expect(await boCalendarPage.getSlotCount(booked, MORNING)).toBeGreaterThan(0);
  90  |   });
  91  | 
  92  |   test("BO add beyond afternoon slot limit", async ({ boCalendarPage, browser }, testInfo) => {
  93  |     const ref = await arrangeBdpReferenceViaUCD(browser, testInfo);
  94  |     if (!ref) {
  95  |       test.skip(true, "Could not arrange a fresh Biometric Device Purchase reference via UCD.");
  96  |       return;
  97  |     }
  98  |     await boCalendarPage.navigate();
  99  |     const booked = await boCalendarPage.addAppointment({ companyName: COMPANY, existingRecordRefNo: ref, slot: AFTERNOON });
  100 |     if (!booked) {
  101 |       test.skip(true, `Could not add an appointment for reference ${ref}.`);
  102 |       return;
  103 |     }
  104 |     await boCalendarPage.navigate();
  105 |     expect(await boCalendarPage.getSlotCount(booked, AFTERNOON)).toBeGreaterThan(0);
  106 |   });
  107 | 
  108 |   test("BO add beyond 6 days limit", async ({ boCalendarPage, browser }, testInfo) => {
  109 |     // Add the appointment as CSE, then OBSERVE it in every location the SRD
  110 |     // lists. Email is checked via its on-screen proxy (the UCD Service Request
  111 |     // Listing), per the agreed approach.
  112 |     const ref = await arrangeBdpReferenceViaUCD(browser, testInfo);
  113 |     if (!ref) {
  114 |       test.skip(true, "Could not arrange a fresh Biometric Device Purchase reference via UCD.");
  115 |       return;
  116 |     }
  117 | 
  118 |     let booked: string | null = null;
  119 |     await test.step("CSE adds the appointment (beyond the 6/day cap)", async () => {
  120 |       await boCalendarPage.navigate();
  121 |       booked = await boCalendarPage.addAppointment({ companyName: COMPANY, existingRecordRefNo: ref, slot: MORNING });
  122 |     });
  123 |     if (!booked) {
  124 |       test.skip(true, `Could not add an appointment for reference ${ref}.`);
  125 |       return;
  126 |     }
  127 | 
  128 |     await test.step("Observe on BO Appointment Calendar — numbering continues", async () => {
  129 |       await boCalendarPage.navigate();
  130 |       // A positive count on the booked date/slot shows the numbered list
  131 |       // continued past the UCD cap (CSE is uncapped).
  132 |       expect(await boCalendarPage.getSlotCount(booked!, MORNING)).toBeGreaterThan(0);
  133 |     });
  134 | 
  135 |     await test.step("Observe on BO Biometric/SI Listing — reference present", async () => {
  136 |       const boListing = new (await import("../pages/bo/SoftwareInstallationListingPage")).SoftwareInstallationListingPage(boCalendarPage.page);
  137 |       await boListing.navigate();
  138 |       await boListing.searchWithFilters({ referenceNo: ref });
  139 |       const rows = await boListing.getResultRows();
  140 |       expect(rows.length, "the added appointment should appear in the BO listing").toBeGreaterThan(0);
  141 |     });
  142 | 
  143 |     await test.step("Observe on UCD Service Request Listing (on-screen proxy for the email)", async () => {
  144 |       const ucdCtx = await openTrackedContext(browser, testInfo);
  145 |       const ucdPage = await ucdCtx.newPage();
  146 |       try {
  147 |         const ucdLogin = new (await import("../pages/LoginPage")).LoginPage(ucdPage);
  148 |         const ucdListing = new (await import("../pages/ServiceRequestListingPage")).ServiceRequestListingPage(ucdPage);
  149 |         await ucdLogin.loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
  150 |         await ucdListing.navigate();
  151 |         await ucdListing.searchByReferenceNo(ref);
  152 |         const row = await ucdListing.findRowByRefNo(ref);
  153 |         // Best-effort: only assert when this UCD account owns the reference.
  154 |         if (row) {
  155 |           expect((await ucdListing.getRowServiceType(row)).length).toBeGreaterThan(0);
  156 |         }
  157 |       } finally {
  158 |         await closeTrackedContext(ucdCtx, testInfo, "UCD verifies listing");
  159 |       }
  160 |     });
  161 |   });
  162 | 
  163 |   test("BO add for current day and the next day", async ({ boCalendarPage }) => {
  164 |     const boListingPage = new SoftwareInstallationListingPage(boCalendarPage.page);
  165 |     const seed = await findListingSeedForAdd(boListingPage);
  166 |     if (!seed) {
  167 |       test.skip(true, "No BO listing row found with Payment Status=OK and Installation Request='-'.");
  168 |       return;
  169 |     }
  170 | 
  171 |     await boCalendarPage.navigate();
  172 |     const targetDate = boCalendarPage.today();
  173 |     const booked = await boCalendarPage.addAppointment({
  174 |       companyName: seed.companyName,
  175 |       existingRecordRefNo: seed.referenceNo,
  176 |       appointmentDate: targetDate,
  177 |       slot: MORNING,
  178 |     });
  179 | 
> 180 |     expect(booked, `Add Appointment should complete using listing seed ${seed.referenceNo}`).not.toBeNull();
      |                                                                                                  ^ Error: Add Appointment should complete using listing seed SR67000127
  181 |     await boCalendarPage.navigate();
  182 |     expect(await boCalendarPage.getSlotCount(booked!, MORNING)).toBeGreaterThan(0);
  183 |   });
  184 | 
  185 |   test("BO add for previous dates", async ({ boCalendarPage }) => {
  186 |     await boCalendarPage.navigate();
  187 |     const dialog = await boCalendarPage.openAddDialog();
  188 |     await test.step("Expected: a previous date is not selectable", async () => {
  189 |       expect(await boCalendarPage.isAddDateSelectable(boCalendarPage.yesterday())).toBe(false);
  190 |     });
  191 |     await boCalendarPage.closeAddDialog(dialog);
  192 |   });
  193 | 
  194 |   test("BO book future date more than 2 months", async ({ boCalendarPage }) => {
  195 |     await boCalendarPage.navigate();
  196 |     const dialog = await boCalendarPage.openAddDialog();
  197 |     const far = boCalendarPage.dateMonthsAhead(3);
  198 |     await test.step(`Expected: ${far} (>2 months out) CAN be booked by BO`, async () => {
  199 |       expect(await boCalendarPage.isAddDateSelectable(far)).toBe(true);
  200 |     });
  201 |     await boCalendarPage.closeAddDialog(dialog);
  202 |   });
  203 | 
  204 |   test("BO book weekend dates", async ({ boCalendarPage }) => {
  205 |     await boCalendarPage.navigate();
  206 |     const dialog = await boCalendarPage.openAddDialog();
  207 |     const weekend = boCalendarPage.nextWeekend();
  208 |     await test.step(`Expected: weekend ${weekend} is greyed out / unclickable`, async () => {
  209 |       expect(await boCalendarPage.isAddDateSelectable(weekend)).toBe(false);
  210 |     });
  211 |     await boCalendarPage.closeAddDialog(dialog);
  212 |   });
  213 | 
  214 |   test("BO book Public Holiday", async ({ boCalendarPage }) => {
  215 |     const ph = ENV.publicHoliday;
  216 |     if (!ph) {
  217 |       test.skip(true, "No Public Holiday date provided — key one into the runner's Test data panel.");
  218 |       return;
  219 |     }
  220 |     await boCalendarPage.navigate();
  221 |     const dialog = await boCalendarPage.openAddDialog();
  222 |     await test.step(`Expected: public holiday ${ph} is greyed out / unclickable`, async () => {
  223 |       expect(await boCalendarPage.isAddDateSelectable(ph)).toBe(false);
  224 |     });
  225 |     await boCalendarPage.closeAddDialog(dialog);
  226 |   });
  227 | 
  228 |   // ── Reschedule-entry parity ──
  229 |   // The QA doc pairs every Add scenario above with a Reschedule one too —
  230 |   // these exercise the Reschedule dialog's OWN #ac-rs-date datepicker
  231 |   // (isRescheduleDateSelectable), rather than assuming it behaves the same
  232 |   // as Add's #ac-add-date.
  233 | 
  234 |   test("BO reschedule for current day and the next day", async ({ boCalendarPage }) => {
  235 |     await boCalendarPage.navigate();
  236 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  237 |     if (!dialog) {
  238 |       test.skip(true, "No listed appointment to reschedule in this month");
  239 |       return;
  240 |     }
  241 |     await test.step("Expected: able to reschedule into today and tomorrow", async () => {
  242 |       expect(await boCalendarPage.isRescheduleDateSelectable(boCalendarPage.today())).toBe(true);
  243 |       expect(await boCalendarPage.isRescheduleDateSelectable(boCalendarPage.daysFromToday(1))).toBe(true);
  244 |     });
  245 |     await boCalendarPage.closeRescheduleDialog(dialog);
  246 |   });
  247 | 
  248 |   test("BO reschedule for previous dates", async ({ boCalendarPage }) => {
  249 |     await boCalendarPage.navigate();
  250 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  251 |     if (!dialog) {
  252 |       test.skip(true, "No listed appointment to reschedule in this month");
  253 |       return;
  254 |     }
  255 |     await test.step("Expected: a previous date is not selectable", async () => {
  256 |       expect(await boCalendarPage.isRescheduleDateSelectable(boCalendarPage.yesterday())).toBe(false);
  257 |     });
  258 |     await boCalendarPage.closeRescheduleDialog(dialog);
  259 |   });
  260 | 
  261 |   test("BO reschedule future date more than 2 months", async ({ boCalendarPage }) => {
  262 |     await boCalendarPage.navigate();
  263 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  264 |     if (!dialog) {
  265 |       test.skip(true, "No listed appointment to reschedule in this month");
  266 |       return;
  267 |     }
  268 |     const far = boCalendarPage.dateMonthsAhead(3);
  269 |     await test.step(`Expected: ${far} (>2 months out) CAN be rescheduled into by BO`, async () => {
  270 |       expect(await boCalendarPage.isRescheduleDateSelectable(far)).toBe(true);
  271 |     });
  272 |     await boCalendarPage.closeRescheduleDialog(dialog);
  273 |   });
  274 | 
  275 |   test("BO reschedule weekend dates", async ({ boCalendarPage }) => {
  276 |     await boCalendarPage.navigate();
  277 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  278 |     if (!dialog) {
  279 |       test.skip(true, "No listed appointment to reschedule in this month");
  280 |       return;
```