# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: add-appointment-bo.spec.ts >> Add Appointment (BO) >> Morning Slot Full Booking - Add Appointment
- Location: tests\service-hub\specs\add-appointment-bo.spec.ts:200:7

# Error details

```
TimeoutError: locator.selectOption: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('#ui-datepicker-div').locator('select.ui-datepicker-year')
    - locator resolved to <select class="ui-datepicker-year" onclick="DP_jQuery.datepicker._clickMonthYear('#ac-add-date');" onchange="DP_jQuery.datepicker._selectMonthYear('#ac-add-date', this, 'Y');">…</select>
  - attempting select option action
    2 × waiting for element to be visible and enabled
      - did not find some options
    - retrying select option action
    - waiting 20ms
    2 × waiting for element to be visible and enabled
      - did not find some options
    - retrying select option action
      - waiting 100ms
    19 × waiting for element to be visible and enabled
       - did not find some options
     - retrying select option action
       - waiting 500ms

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
        - row "17-07-2026 Morning - 2 Afternoon - 1 Reschedule 1. EAST HUAT AUTO SDN BHD Reschedule 2. JIMI HUUH Reschedule 1. TRAZE" [ref=e106]:
          - cell "17-07-2026 Morning - 2 Afternoon - 1" [ref=e107]:
            - text: 17-07-2026
            - generic [ref=e108]: Morning - 2
            - generic [ref=e109]: Afternoon - 1
          - cell "Reschedule 1. EAST HUAT AUTO SDN BHD Reschedule 2. JIMI HUUH" [ref=e110]:
            - list [ref=e111]:
              - listitem [ref=e112]:
                - generic [ref=e113] [cursor=pointer]: Reschedule
                - text: 1. EAST HUAT AUTO SDN BHD
              - listitem [ref=e114]:
                - generic [ref=e115] [cursor=pointer]: Reschedule
                - text: 2. JIMI HUUH
          - cell "Reschedule 1. TRAZE" [ref=e116]:
            - list [ref=e117]:
              - listitem [ref=e118]:
                - generic [ref=e119] [cursor=pointer]: Reschedule
                - text: 1. TRAZE
        - row "18-07-2026 - -" [ref=e120]:
          - cell "18-07-2026" [ref=e121]
          - cell "-" [ref=e122]
          - cell "-" [ref=e123]
        - row "19-07-2026 - -" [ref=e124]:
          - cell "19-07-2026" [ref=e125]
          - cell "-" [ref=e126]
          - cell "-" [ref=e127]
        - row "20-07-2026 Morning - 7 (Full) Afternoon - 3 (Full) Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. FAIZUDDIN AUTO TEST Reschedule 6. 193 AUTO TRADING Reschedule 7. FAIZUDDIN AUTO TEST Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e128]:
          - cell "20-07-2026 Morning - 7 (Full) Afternoon - 3 (Full)" [ref=e129]:
            - text: 20-07-2026
            - generic [ref=e130]: Morning - 7 (Full)
            - generic [ref=e131]: Afternoon - 3 (Full)
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. FAIZUDDIN AUTO TEST Reschedule 6. 193 AUTO TRADING Reschedule 7. FAIZUDDIN AUTO TEST" [ref=e132]:
            - list [ref=e133]:
              - listitem [ref=e134]:
                - generic [ref=e135] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e136]:
                - generic [ref=e137] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e138]:
                - generic [ref=e139] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e140]:
                - generic [ref=e141] [cursor=pointer]: Reschedule
                - text: 4. FAIZUDDIN AUTO TEST
              - listitem [ref=e142]:
                - generic [ref=e143] [cursor=pointer]: Reschedule
                - text: 5. FAIZUDDIN AUTO TEST
              - listitem [ref=e144]:
                - generic [ref=e145] [cursor=pointer]: Reschedule
                - text: 6. 193 AUTO TRADING
              - listitem [ref=e146]:
                - generic [ref=e147] [cursor=pointer]: Reschedule
                - text: 7. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e148]:
            - list [ref=e149]:
              - listitem [ref=e150]:
                - generic [ref=e151] [cursor=pointer]: Reschedule
                - text: 1. MUSICHOB SDN BHD
              - listitem [ref=e152]:
                - generic [ref=e153] [cursor=pointer]: Reschedule
                - text: 2. MUSICHOB SDN BHD
              - listitem [ref=e154]:
                - generic [ref=e155] [cursor=pointer]: Reschedule
                - text: 3. MUSICHOB SDN BHD
        - row "21-07-2026 Morning - 7 (Full) Afternoon - 3 (Full) Reschedule 1. FAIZUDDIN AUTO TEST 2. MUSICHOB SDN BHD Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. MUSICHOB SDN BHD Reschedule 6. FAIZUDDIN AUTO TEST Reschedule 7. MUSICHOB SDN BHD Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e156]:
          - cell "21-07-2026 Morning - 7 (Full) Afternoon - 3 (Full)" [ref=e157]:
            - text: 21-07-2026
            - generic [ref=e158]: Morning - 7 (Full)
            - generic [ref=e159]: Afternoon - 3 (Full)
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST 2. MUSICHOB SDN BHD Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. MUSICHOB SDN BHD Reschedule 6. FAIZUDDIN AUTO TEST Reschedule 7. MUSICHOB SDN BHD" [ref=e160]:
            - list [ref=e161]:
              - listitem [ref=e162]:
                - generic [ref=e163] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e164]: 2. MUSICHOB SDN BHD
              - listitem [ref=e165]:
                - generic [ref=e166] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e167]:
                - generic [ref=e168] [cursor=pointer]: Reschedule
                - text: 4. FAIZUDDIN AUTO TEST
              - listitem [ref=e169]:
                - generic [ref=e170] [cursor=pointer]: Reschedule
                - text: 5. MUSICHOB SDN BHD
              - listitem [ref=e171]:
                - generic [ref=e172] [cursor=pointer]: Reschedule
                - text: 6. FAIZUDDIN AUTO TEST
              - listitem [ref=e173]:
                - generic [ref=e174] [cursor=pointer]: Reschedule
                - text: 7. MUSICHOB SDN BHD
          - cell "Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e175]:
            - list [ref=e176]:
              - listitem [ref=e177]:
                - generic [ref=e178] [cursor=pointer]: Reschedule
                - text: 1. MUSICHOB SDN BHD
              - listitem [ref=e179]:
                - generic [ref=e180] [cursor=pointer]: Reschedule
                - text: 2. MUSICHOB SDN BHD
              - listitem [ref=e181]:
                - generic [ref=e182] [cursor=pointer]: Reschedule
                - text: 3. MUSICHOB SDN BHD
        - row "22-07-2026 Morning - 3 (Full) Afternoon - 3 (Full) Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. JIMI HUUH Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 3. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 4. FAIZUDDIN AUTO TEST" [ref=e183]:
          - cell "22-07-2026 Morning - 3 (Full) Afternoon - 3 (Full)" [ref=e184]:
            - text: 22-07-2026
            - generic [ref=e185]: Morning - 3 (Full)
            - generic [ref=e186]: Afternoon - 3 (Full)
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. JIMI HUUH" [ref=e187]:
            - list [ref=e188]:
              - listitem [ref=e189]:
                - generic [ref=e190] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e191]:
                - generic [ref=e192] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e193]:
                - generic [ref=e194] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e195]:
                - generic [ref=e196] [cursor=pointer]: Reschedule
                - text: 4. JIMI HUUH
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 3. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 4. FAIZUDDIN AUTO TEST" [ref=e197]:
            - list [ref=e198]:
              - listitem [ref=e199]:
                - generic [ref=e200] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e201]:
                - generic [ref=e202] [cursor=pointer]: Reschedule
                - text: 2. CHARRRRRR CHICKCOLI SDN BHD123321
              - listitem [ref=e203]:
                - generic [ref=e204] [cursor=pointer]: Reschedule
                - text: 3. CHARRRRRR CHICKCOLI SDN BHD123321
              - listitem [ref=e205]:
                - generic [ref=e206] [cursor=pointer]: Reschedule
                - text: 4. FAIZUDDIN AUTO TEST
        - row "23-07-2026 Morning - 3 (Full) Afternoon - 3 (Full) Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. JIMI HUUH Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST" [ref=e207]:
          - cell "23-07-2026 Morning - 3 (Full) Afternoon - 3 (Full)" [ref=e208]:
            - text: 23-07-2026
            - generic [ref=e209]: Morning - 3 (Full)
            - generic [ref=e210]: Afternoon - 3 (Full)
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. JIMI HUUH Reschedule 3. FAIZUDDIN AUTO TEST" [ref=e211]:
            - list [ref=e212]:
              - listitem [ref=e213]:
                - generic [ref=e214] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e215]:
                - generic [ref=e216] [cursor=pointer]: Reschedule
                - text: 2. JIMI HUUH
              - listitem [ref=e217]:
                - generic [ref=e218] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST" [ref=e219]:
            - list [ref=e220]:
              - listitem [ref=e221]:
                - generic [ref=e222] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e223]:
                - generic [ref=e224] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e225]:
                - generic [ref=e226] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
        - row "24-07-2026 Morning - 0 Afternoon - 0" [ref=e227]:
          - cell "24-07-2026 Morning - 0 Afternoon - 0" [ref=e228]:
            - text: 24-07-2026
            - generic [ref=e229]: Morning - 0
            - generic [ref=e230]: Afternoon - 0
          - cell [ref=e231]
          - cell [ref=e232]
        - row "25-07-2026 - -" [ref=e233]:
          - cell "25-07-2026" [ref=e234]
          - cell "-" [ref=e235]
          - cell "-" [ref=e236]
        - row "26-07-2026 - -" [ref=e237]:
          - cell "26-07-2026" [ref=e238]
          - cell "-" [ref=e239]
          - cell "-" [ref=e240]
        - row "27-07-2026 Morning - 0 Afternoon - 0" [ref=e241]:
          - cell "27-07-2026 Morning - 0 Afternoon - 0" [ref=e242]:
            - text: 27-07-2026
            - generic [ref=e243]: Morning - 0
            - generic [ref=e244]: Afternoon - 0
          - cell [ref=e245]
          - cell [ref=e246]
        - row "28-07-2026 Morning - 0 Afternoon - 0" [ref=e247]:
          - cell "28-07-2026 Morning - 0 Afternoon - 0" [ref=e248]:
            - text: 28-07-2026
            - generic [ref=e249]: Morning - 0
            - generic [ref=e250]: Afternoon - 0
          - cell [ref=e251]
          - cell [ref=e252]
        - row "29-07-2026 Morning - 0 Afternoon - 0" [ref=e253]:
          - cell "29-07-2026 Morning - 0 Afternoon - 0" [ref=e254]:
            - text: 29-07-2026
            - generic [ref=e255]: Morning - 0
            - generic [ref=e256]: Afternoon - 0
          - cell [ref=e257]
          - cell [ref=e258]
        - row "30-07-2026 Morning - 1 Afternoon - 1 Reschedule 1. JIMI HUUH Reschedule 1. JIMI HUUH" [ref=e259]:
          - cell "30-07-2026 Morning - 1 Afternoon - 1" [ref=e260]:
            - text: 30-07-2026
            - generic [ref=e261]: Morning - 1
            - generic [ref=e262]: Afternoon - 1
          - cell "Reschedule 1. JIMI HUUH" [ref=e263]:
            - list [ref=e264]:
              - listitem [ref=e265]:
                - generic [ref=e266] [cursor=pointer]: Reschedule
                - text: 1. JIMI HUUH
          - cell "Reschedule 1. JIMI HUUH" [ref=e267]:
            - list [ref=e268]:
              - listitem [ref=e269]:
                - generic [ref=e270] [cursor=pointer]: Reschedule
                - text: 1. JIMI HUUH
        - row "31-07-2026 Morning - 7 (Full) Afternoon - 3 (Full) Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. FAIZUDDIN AUTO TEST Reschedule 6. MUSICHOB SDN BHD Reschedule 7. FAIZUDDIN AUTO TEST Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. MUSICHOB SDN BHD" [ref=e271]:
          - cell "31-07-2026 Morning - 7 (Full) Afternoon - 3 (Full)" [ref=e272]:
            - text: 31-07-2026
            - generic [ref=e273]: Morning - 7 (Full)
            - generic [ref=e274]: Afternoon - 3 (Full)
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. FAIZUDDIN AUTO TEST Reschedule 6. MUSICHOB SDN BHD Reschedule 7. FAIZUDDIN AUTO TEST" [ref=e275]:
            - list [ref=e276]:
              - listitem [ref=e277]:
                - generic [ref=e278] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e279]:
                - generic [ref=e280] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e281]:
                - generic [ref=e282] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e283]:
                - generic [ref=e284] [cursor=pointer]: Reschedule
                - text: 4. FAIZUDDIN AUTO TEST
              - listitem [ref=e285]:
                - generic [ref=e286] [cursor=pointer]: Reschedule
                - text: 5. FAIZUDDIN AUTO TEST
              - listitem [ref=e287]:
                - generic [ref=e288] [cursor=pointer]: Reschedule
                - text: 6. MUSICHOB SDN BHD
              - listitem [ref=e289]:
                - generic [ref=e290] [cursor=pointer]: Reschedule
                - text: 7. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. MUSICHOB SDN BHD" [ref=e291]:
            - list [ref=e292]:
              - listitem [ref=e293]:
                - generic [ref=e294] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e295]:
                - generic [ref=e296] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e297]:
                - generic [ref=e298] [cursor=pointer]: Reschedule
                - text: 3. MUSICHOB SDN BHD
  - table [ref=e300]:
    - rowgroup [ref=e301]:
      - row "Home | Menu 2 Pending Transaction Found! Jason Seah, My Account | Logout" [ref=e302]:
        - cell "Home | Menu 2 Pending Transaction Found!" [ref=e303]:
          - generic [ref=e304]:
            - list [ref=e305]:
              - listitem [ref=e306]:
                - link "Home |" [ref=e307] [cursor=pointer]:
                  - /url: /uat1/home/
              - listitem [ref=e308]:
                - link "Menu" [ref=e309] [cursor=pointer]:
                  - /url: "#"
                  - text: Menu
                  - img [ref=e310]
            - generic [ref=e311] [cursor=pointer]: 2 Pending Transaction Found!
        - cell "Jason Seah, My Account | Logout" [ref=e312]:
          - list [ref=e314]:
            - listitem [ref=e315]: Jason Seah,
            - listitem [ref=e316]:
              - link "My Account |" [ref=e317] [cursor=pointer]:
                - /url: /uat1/view/ucd/my-account/view.do?type=Office
            - listitem [ref=e318]:
              - link "Logout" [ref=e319] [cursor=pointer]:
                - /url: "#"
  - img [ref=e321]
  - table [ref=e323]:
    - rowgroup [ref=e324]:
      - row "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e325]:
        - cell [ref=e326]
        - cell "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e327]:
          - text: Best Compatible With Mozilla Firefox V36.0.4
          - text: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
          - link "Contact Us" [ref=e328] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Terms & Conditions" [ref=e329] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Privacy" [ref=e330] [cursor=pointer]:
            - /url: "#"
        - cell [ref=e331]:
          - img [ref=e332]
  - generic [ref=e333]:
    - generic [ref=e334]:
      - generic "Prev" [ref=e335]:
        - generic [ref=e336]: Prev
      - generic "Next" [ref=e337]:
        - generic [ref=e338]: Next
      - generic:
        - combobox [ref=e339]:
          - option "Jul" [selected]
          - option "Aug"
          - option "Sep"
          - option "Oct"
          - option "Nov"
          - option "Dec"
        - combobox [ref=e340]:
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
    - table [ref=e341]:
      - rowgroup [ref=e342]:
        - row "Su Mo Tu We Th Fr Sa" [ref=e343]:
          - columnheader "Su" [ref=e344]
          - columnheader "Mo" [ref=e345]
          - columnheader "Tu" [ref=e346]
          - columnheader "We" [ref=e347]
          - columnheader "Th" [ref=e348]
          - columnheader "Fr" [ref=e349]
          - columnheader "Sa" [ref=e350]
      - rowgroup [ref=e351]:
        - row "1 2 3 4" [ref=e352]:
          - cell [ref=e353]
          - cell [ref=e354]
          - cell [ref=e355]
          - cell "1" [ref=e356]:
            - generic [ref=e357]: "1"
          - cell "2" [ref=e358]:
            - generic [ref=e359]: "2"
          - cell "3" [ref=e360]:
            - generic [ref=e361]: "3"
          - cell "4" [ref=e362]:
            - generic [ref=e363]: "4"
        - row "5 6 7 8 9 10 11" [ref=e364]:
          - cell "5" [ref=e365]:
            - generic [ref=e366]: "5"
          - cell "6" [ref=e367]:
            - generic [ref=e368]: "6"
          - cell "7" [ref=e369]:
            - generic [ref=e370]: "7"
          - cell "8" [ref=e371]:
            - generic [ref=e372]: "8"
          - cell "9" [ref=e373]:
            - generic [ref=e374]: "9"
          - cell "10" [ref=e375]:
            - generic [ref=e376]: "10"
          - cell "11" [ref=e377]:
            - generic [ref=e378]: "11"
        - row "12 13 14 15 16 17 18" [ref=e379]:
          - cell "12" [ref=e380]:
            - generic [ref=e381]: "12"
          - cell "13" [ref=e382]:
            - generic [ref=e383]: "13"
          - cell "14" [ref=e384]:
            - generic [ref=e385]: "14"
          - cell "15" [ref=e386]:
            - generic [ref=e387]: "15"
          - cell "16" [ref=e388]:
            - generic [ref=e389]: "16"
          - cell "17" [ref=e390]:
            - link "17" [ref=e391] [cursor=pointer]:
              - /url: "#"
          - cell "18" [ref=e392]:
            - generic [ref=e393]: "18"
        - row "19 20 21 22 23 24 25" [ref=e394]:
          - cell "19" [ref=e395]:
            - generic [ref=e396]: "19"
          - cell "20" [ref=e397]:
            - link "20" [ref=e398] [cursor=pointer]:
              - /url: "#"
          - cell "21" [ref=e399]:
            - link "21" [ref=e400] [cursor=pointer]:
              - /url: "#"
          - cell "22" [ref=e401]:
            - link "22" [ref=e402] [cursor=pointer]:
              - /url: "#"
          - cell "23" [ref=e403]:
            - link "23" [ref=e404] [cursor=pointer]:
              - /url: "#"
          - cell "24" [ref=e405]:
            - link "24" [ref=e406] [cursor=pointer]:
              - /url: "#"
          - cell "25" [ref=e407]:
            - generic [ref=e408]: "25"
        - row "26 27 28 29 30 31" [ref=e409]:
          - cell "26" [ref=e410]:
            - generic [ref=e411]: "26"
          - cell "27" [ref=e412]:
            - link "27" [ref=e413] [cursor=pointer]:
              - /url: "#"
          - cell "28" [ref=e414]:
            - link "28" [ref=e415] [cursor=pointer]:
              - /url: "#"
          - cell "29" [ref=e416]:
            - link "29" [ref=e417] [cursor=pointer]:
              - /url: "#"
          - cell "30" [ref=e418]:
            - link "30" [ref=e419] [cursor=pointer]:
              - /url: "#"
          - cell "31" [ref=e420]:
            - link "31" [ref=e421] [cursor=pointer]:
              - /url: "#"
          - cell [ref=e422]
  - dialog "Add Appointment" [ref=e424]:
    - generic [ref=e426]: Add Appointment
    - generic [ref=e427]:
      - generic [ref=e428]: Please enter the company name to add installation appointment.
      - generic [ref=e429]:
        - generic [ref=e430]: "Company Name*:"
        - generic [ref=e431]:
          - textbox [ref=e432]: FAIZUDDIN AUTO TEST
          - button "Search" [ref=e433]
      - generic [ref=e434]:
        - generic [ref=e435]: "Reference No.*:"
        - generic [ref=e436]:
          - textbox [ref=e437]: SR67000134
          - button "Search" [ref=e438]
        - generic [ref=e439]: 1 appointment allocation remaining
      - generic [ref=e440]:
        - generic [ref=e441]: "Appointment Date*:"
        - textbox [active] [ref=e442]
      - generic [ref=e443]:
        - generic [ref=e444]: "Time Slot*:"
        - generic [ref=e445]:
          - generic [ref=e446]:
            - radio "10:00am - 12:00pm" [ref=e447]
            - text: 10:00am - 12:00pm
          - generic [ref=e448]:
            - radio "2:00pm - 4:00pm" [ref=e449]
            - text: 2:00pm - 4:00pm
    - generic [ref=e450]:
      - button "Confirm" [ref=e451] [cursor=pointer]
      - button "Cancel" [ref=e452] [cursor=pointer]
```

# Test source

```ts
  84  |       has: this.page.locator("span.cal-daynum", { hasText: label }),
  85  |     });
  86  |   }
  87  | 
  88  |   /** Capacity text for a date/slot, e.g. "Morning - 3 (Full)". */
  89  |   async getSlotCapacityText(dateStr: string, slot: BoTimeSlot): Promise<string> {
  90  |     const cap = this.getDayRow(dateStr).locator("div.cal-cap").nth(slot);
  91  |     if ((await cap.count()) === 0) return "";
  92  |     return (await cap.textContent())?.trim().replace(/\s+/g, " ") ?? "";
  93  |   }
  94  | 
  95  |   /** Numeric booked count for a date/slot. */
  96  |   async getSlotCount(dateStr: string, slot: BoTimeSlot): Promise<number> {
  97  |     const text = await this.getSlotCapacityText(dateStr, slot);
  98  |     const match = text.match(/-\s*(\d+)/);
  99  |     return match ? Number(match[1]) : 0;
  100 |   }
  101 | 
  102 |   /** SRD: the count span gets class "full" (shown as "(Full)") at capacity. */
  103 |   async isSlotFull(dateStr: string, slot: BoTimeSlot): Promise<boolean> {
  104 |     const text = await this.getSlotCapacityText(dateStr, slot);
  105 |     return /\(Full\)/i.test(text);
  106 |   }
  107 | 
  108 |   /**
  109 |    * BO counterpart to the UCD SlotPickerComponent.findDateMatching(): returns
  110 |    * the first date in the CURRENTLY DISPLAYED month whose per-session snapshot
  111 |    * satisfies `predicate`. BO shows per-slot counts directly on the grid, so
  112 |    * no modal is opened. Scanning is limited to the visible month — select a
  113 |    * different month via #cal-month-picker + Search first if you need one.
  114 |    */
  115 |   async findDateMatching(predicate: (info: BoDateSlotInfo) => boolean): Promise<string | null> {
  116 |     const labels = await this.calTable.locator("tbody tr span.cal-daynum").allTextContents();
  117 |     for (const raw of labels) {
  118 |       const date = raw.trim();
  119 |       if (!date) continue;
  120 |       const info: BoDateSlotInfo = {
  121 |         date,
  122 |         morning: { booked: await this.getSlotCount(date, 0), full: await this.isSlotFull(date, 0) },
  123 |         afternoon: { booked: await this.getSlotCount(date, 1), full: await this.isSlotFull(date, 1) },
  124 |       };
  125 |       if (predicate(info)) return date;
  126 |     }
  127 |     return null;
  128 |   }
  129 | 
  130 |   /** First date in the visible month whose given session shows "(Full)". */
  131 |   async findDateWithSlotFull(slot: BoTimeSlot): Promise<string | null> {
  132 |     return this.findDateMatching((i) => (slot === 0 ? i.morning : i.afternoon).full);
  133 |   }
  134 | 
  135 |   /** Whether any appointment on the page still offers a Reschedule link. */
  136 |   async isRescheduleAvailable(): Promise<boolean> {
  137 |     return (await this.page.locator("a.cal-rs").count()) > 0;
  138 |   }
  139 | 
  140 |   /**
  141 |    * Whether the given company's appointment (in the currently-displayed
  142 |    * month) exposes the Reschedule link — used to verify status-based
  143 |    * blocking (Cancelled/Failed/Completed installations must not offer
  144 |    * Reschedule). Returns null if the company isn't listed in the visible
  145 |    * month at all, so callers can skip rather than fail on a stale/absent
  146 |    * candidate.
  147 |    */
  148 |   async hasRescheduleForCompany(companyName: string): Promise<boolean | null> {
  149 |     const li = this.calTable
  150 |       .locator("li", { has: this.page.locator("span.cal-co", { hasText: companyName }) })
  151 |       .first();
  152 |     if ((await li.count()) === 0) return null;
  153 |     return (await li.locator("a.cal-rs").count()) > 0;
  154 |   }
  155 | 
  156 |   /**
  157 |    * Pick a selectable day in the currently-open jQuery UI datepicker.
  158 |    * The date inputs are readonly + backed by a hidden ISO field, so we must
  159 |    * go through the datepicker (which sets both) rather than typing. Disabled
  160 |    * days render as <span> inside td.ui-state-disabled; selectable days are
  161 |    * <a> — we click the last selectable one (later in the month → future) when
  162 |    * no specific date is requested.
  163 |    *
  164 |    * BUG FIXED: this used to take only a bare day-of-month number and match it
  165 |    * against whatever month happened to already be showing (always the
  166 |    * current month — the datepicker opens on today's month by default). A
  167 |    * requested date in a DIFFERENT month (e.g. daysFromToday(N) crossing a
  168 |    * month boundary) would never match, and — silently, with no error — it
  169 |    * fell back to "last selectable day in the WRONG month" instead. That's
  170 |    * exactly what looked like "clicking a date in the calendar isn't
  171 |    * choosing it": some valid date got picked, just never the one asked for.
  172 |    * Now takes the full ISO date and navigates the month/year selects to the
  173 |    * right month FIRST, the same way isAddDateSelectable/
  174 |    * isRescheduleDateSelectable already do, before looking for the day.
  175 |    */
  176 |   private async pickDatepickerDay(dateIso?: string) {
  177 |     await this.datepicker.waitFor({ state: "visible", timeout: 5000 });
  178 | 
  179 |     let dayOfMonth: number | undefined;
  180 |     if (dateIso) {
  181 |       const [y, m, d] = dateIso.split("-").map(Number);
  182 |       dayOfMonth = d;
  183 |       await this.datepicker.locator("select.ui-datepicker-month").selectOption(String(m - 1));
> 184 |       await this.datepicker.locator("select.ui-datepicker-year").selectOption(String(y));
      |                                                                  ^ TimeoutError: locator.selectOption: Timeout 10000ms exceeded.
  185 |       // Changing the dropdowns re-renders the day grid — give it a beat.
  186 |       await this.page.waitForTimeout(200);
  187 |     }
  188 | 
  189 |     const selectable = this.datepicker.locator("td:not(.ui-state-disabled) a.ui-state-default");
  190 |     let target: Locator | null = null;
  191 |     if (dayOfMonth !== undefined) {
  192 |       const exact = selectable.filter({ hasText: new RegExp(`^${dayOfMonth}$`) }).first();
  193 |       if (await exact.count()) target = exact;
  194 |       // else: requested day isn't selectable even in its own month (past/
  195 |       // weekend/holiday) — fall through to any, same as before.
  196 |     }
  197 |     if (!target) {
  198 |       const n = await selectable.count();
  199 |       if (n === 0) throw new Error("No selectable day in the datepicker");
  200 |       target = selectable.nth(n - 1); // last selectable → later in month
  201 |     }
  202 |     await target.click();
  203 |     // The datepicker overlay sits directly over the time-slot radios below the
  204 |     // date field; if it stays open it intercepts the next click. Force it shut.
  205 |     await this.dismissDatepicker();
  206 |   }
  207 | 
  208 |   /**
  209 |    * Close the jQuery UI datepicker overlay so it can't intercept clicks.
  210 |    * Selecting a day can momentarily refocus the (readonly) date input, and
  211 |    * jQuery UI reopens the picker on focus — a synthetic blur() alone can lose
  212 |    * that race. Shifting focus to a real, inert click target (the open
  213 |    * dialog's title bar) is more reliable than blur() at keeping it shut.
  214 |    */
  215 |   private async dismissDatepicker() {
  216 |     await this.page.evaluate(() => {
  217 |       const w = window as unknown as { jQuery?: { datepicker?: { _hideDatepicker?: () => void } } };
  218 |       try {
  219 |         w.jQuery?.datepicker?._hideDatepicker?.();
  220 |       } catch {}
  221 |       const dp = document.getElementById("ui-datepicker-div");
  222 |       if (dp) dp.style.display = "none";
  223 |       (document.activeElement as HTMLElement | null)?.blur();
  224 |     });
  225 |     await this.page
  226 |       .locator(".ui-dialog:visible .ui-dialog-titlebar")
  227 |       .first()
  228 |       .click({ timeout: 2000 })
  229 |       .catch(() => {});
  230 |     await this.datepicker.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  231 |   }
  232 | 
  233 |   /**
  234 |    * Whether `dateIso` is selectable in the Add Appointment date field.
  235 |    *
  236 |    * Verified live against the real jQuery UI datepicker bound to #ac-add-date
  237 |    * (NOT the read-only #cal-table grid, which only ever displays existing
  238 |    * bookings and has no concept of "blocked" — the actual book/no-book gate
  239 |    * is this datepicker):
  240 |    *  - Past dates (before today): every cell carries
  241 |    *    "ui-datepicker-unselectable ui-state-disabled" and has no onclick.
  242 |    *  - Weekends: same disabled classes, plus "ui-datepicker-week-end".
  243 |    *  - Today and all future weekdays (including >2 months out — BO/CSE has
  244 |    *    no +2-day blackout and no 2-month window limit): enabled, no
  245 |    *    "ui-state-disabled" class.
  246 |    * Must be called with the Add Appointment dialog already open (does not
  247 |    * open/close the dialog itself, so callers can chain further actions).
  248 |    */
  249 |   async isAddDateSelectable(dateIso: string): Promise<boolean> {
  250 |     const [y, m, d] = dateIso.split("-").map(Number);
  251 |     await this.page.evaluate(() => {
  252 |       (window as unknown as { jQuery: any }).jQuery("#ac-add-date").datepicker("show");
  253 |     });
  254 |     await this.datepicker.waitFor({ state: "visible", timeout: 5000 });
  255 |     await this.datepicker.locator("select.ui-datepicker-month").selectOption(String(m - 1));
  256 |     await this.datepicker.locator("select.ui-datepicker-year").selectOption(String(y));
  257 |     // Changing the dropdowns re-renders the day grid — give it a beat.
  258 |     await this.page.waitForTimeout(200);
  259 |     const selectableDay = this.datepicker
  260 |       .locator("td:not(.ui-state-disabled):not(.ui-datepicker-other-month) a.ui-state-default")
  261 |       .filter({ hasText: new RegExp(`^${d}$`) })
  262 |       .first();
  263 |     const selectable = (await selectableDay.count()) > 0;
  264 |     await this.dismissDatepicker();
  265 |     return selectable;
  266 |   }
  267 | 
  268 |   /**
  269 |    * Reschedule whichever appointment is listed first. Opens the Reschedule
  270 |    * dialog, sets a new date via the datepicker + a time slot, accepts the
  271 |    * native confirm, and waits for the calendar to refresh.
  272 |    */
  273 |   async rescheduleFirstListed(opts: { slot: BoTimeSlot }) {
  274 |     const link = this.page.locator("a.cal-rs").first();
  275 |     await this.demoHighlight(link);
  276 |     await link.click();
  277 |     await this.completeRescheduleDialog(opts.slot);
  278 |   }
  279 | 
  280 |   /**
  281 |    * Open the Reschedule dialog for whichever appointment is listed first,
  282 |    * without completing it — for VIEW-only date-rule checks (mirrors
  283 |    * openAddDialog()/isAddDateSelectable()). Returns null if no appointment
  284 |    * currently offers a Reschedule link, so callers can skip.
```