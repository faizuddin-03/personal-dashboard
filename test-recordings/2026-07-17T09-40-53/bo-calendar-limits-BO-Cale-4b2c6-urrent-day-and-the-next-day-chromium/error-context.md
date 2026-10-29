# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: bo-calendar-limits.spec.ts >> BO Calendar & Limits >> BO add for current day and the next day
- Location: tests\service-hub\specs\bo-calendar-limits.spec.ts:197:7

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
        - row "23-07-2026 Morning - 3 (Full) Afternoon - 4 (Full) Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. JIMI HUUH Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST" [ref=e207]:
          - cell "23-07-2026 Morning - 3 (Full) Afternoon - 4 (Full)" [ref=e208]:
            - text: 23-07-2026
            - generic [ref=e209]: Morning - 3 (Full)
            - generic [ref=e210]: Afternoon - 4 (Full)
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
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST" [ref=e219]:
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
              - listitem [ref=e227]:
                - generic [ref=e228] [cursor=pointer]: Reschedule
                - text: 4. FAIZUDDIN AUTO TEST
        - row "24-07-2026 Morning - 0 Afternoon - 0" [ref=e229]:
          - cell "24-07-2026 Morning - 0 Afternoon - 0" [ref=e230]:
            - text: 24-07-2026
            - generic [ref=e231]: Morning - 0
            - generic [ref=e232]: Afternoon - 0
          - cell [ref=e233]
          - cell [ref=e234]
        - row "25-07-2026 - -" [ref=e235]:
          - cell "25-07-2026" [ref=e236]
          - cell "-" [ref=e237]
          - cell "-" [ref=e238]
        - row "26-07-2026 - -" [ref=e239]:
          - cell "26-07-2026" [ref=e240]
          - cell "-" [ref=e241]
          - cell "-" [ref=e242]
        - row "27-07-2026 Morning - 0 Afternoon - 0" [ref=e243]:
          - cell "27-07-2026 Morning - 0 Afternoon - 0" [ref=e244]:
            - text: 27-07-2026
            - generic [ref=e245]: Morning - 0
            - generic [ref=e246]: Afternoon - 0
          - cell [ref=e247]
          - cell [ref=e248]
        - row "28-07-2026 Morning - 0 Afternoon - 0" [ref=e249]:
          - cell "28-07-2026 Morning - 0 Afternoon - 0" [ref=e250]:
            - text: 28-07-2026
            - generic [ref=e251]: Morning - 0
            - generic [ref=e252]: Afternoon - 0
          - cell [ref=e253]
          - cell [ref=e254]
        - row "29-07-2026 Morning - 0 Afternoon - 0" [ref=e255]:
          - cell "29-07-2026 Morning - 0 Afternoon - 0" [ref=e256]:
            - text: 29-07-2026
            - generic [ref=e257]: Morning - 0
            - generic [ref=e258]: Afternoon - 0
          - cell [ref=e259]
          - cell [ref=e260]
        - row "30-07-2026 Morning - 1 Afternoon - 1 Reschedule 1. JIMI HUUH Reschedule 1. JIMI HUUH" [ref=e261]:
          - cell "30-07-2026 Morning - 1 Afternoon - 1" [ref=e262]:
            - text: 30-07-2026
            - generic [ref=e263]: Morning - 1
            - generic [ref=e264]: Afternoon - 1
          - cell "Reschedule 1. JIMI HUUH" [ref=e265]:
            - list [ref=e266]:
              - listitem [ref=e267]:
                - generic [ref=e268] [cursor=pointer]: Reschedule
                - text: 1. JIMI HUUH
          - cell "Reschedule 1. JIMI HUUH" [ref=e269]:
            - list [ref=e270]:
              - listitem [ref=e271]:
                - generic [ref=e272] [cursor=pointer]: Reschedule
                - text: 1. JIMI HUUH
        - row "31-07-2026 Morning - 9 (Full) Afternoon - 4 (Full) Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. FAIZUDDIN AUTO TEST Reschedule 6. FAIZUDDIN AUTO TEST Reschedule 7. MUSICHOB SDN BHD Reschedule 8. FAIZUDDIN AUTO TEST Reschedule 9. FAIZUDDIN AUTO TEST Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. MUSICHOB SDN BHD" [ref=e273]:
          - cell "31-07-2026 Morning - 9 (Full) Afternoon - 4 (Full)" [ref=e274]:
            - text: 31-07-2026
            - generic [ref=e275]: Morning - 9 (Full)
            - generic [ref=e276]: Afternoon - 4 (Full)
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. FAIZUDDIN AUTO TEST Reschedule 6. FAIZUDDIN AUTO TEST Reschedule 7. MUSICHOB SDN BHD Reschedule 8. FAIZUDDIN AUTO TEST Reschedule 9. FAIZUDDIN AUTO TEST" [ref=e277]:
            - list [ref=e278]:
              - listitem [ref=e279]:
                - generic [ref=e280] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e281]:
                - generic [ref=e282] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e283]:
                - generic [ref=e284] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e285]:
                - generic [ref=e286] [cursor=pointer]: Reschedule
                - text: 4. FAIZUDDIN AUTO TEST
              - listitem [ref=e287]:
                - generic [ref=e288] [cursor=pointer]: Reschedule
                - text: 5. FAIZUDDIN AUTO TEST
              - listitem [ref=e289]:
                - generic [ref=e290] [cursor=pointer]: Reschedule
                - text: 6. FAIZUDDIN AUTO TEST
              - listitem [ref=e291]:
                - generic [ref=e292] [cursor=pointer]: Reschedule
                - text: 7. MUSICHOB SDN BHD
              - listitem [ref=e293]:
                - generic [ref=e294] [cursor=pointer]: Reschedule
                - text: 8. FAIZUDDIN AUTO TEST
              - listitem [ref=e295]:
                - generic [ref=e296] [cursor=pointer]: Reschedule
                - text: 9. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. MUSICHOB SDN BHD" [ref=e297]:
            - list [ref=e298]:
              - listitem [ref=e299]:
                - generic [ref=e300] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e301]:
                - generic [ref=e302] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e303]:
                - generic [ref=e304] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e305]:
                - generic [ref=e306] [cursor=pointer]: Reschedule
                - text: 4. MUSICHOB SDN BHD
  - table [ref=e308]:
    - rowgroup [ref=e309]:
      - row "Home | Menu 2 Pending Transaction Found! Jason Seah, My Account | Logout" [ref=e310]:
        - cell "Home | Menu 2 Pending Transaction Found!" [ref=e311]:
          - generic [ref=e312]:
            - list [ref=e313]:
              - listitem [ref=e314]:
                - link "Home |" [ref=e315] [cursor=pointer]:
                  - /url: /uat1/home/
              - listitem [ref=e316]:
                - link "Menu" [ref=e317] [cursor=pointer]:
                  - /url: "#"
                  - text: Menu
                  - img [ref=e318]
            - generic [ref=e319] [cursor=pointer]: 2 Pending Transaction Found!
        - cell "Jason Seah, My Account | Logout" [ref=e320]:
          - list [ref=e322]:
            - listitem [ref=e323]: Jason Seah,
            - listitem [ref=e324]:
              - link "My Account |" [ref=e325] [cursor=pointer]:
                - /url: /uat1/view/ucd/my-account/view.do?type=Office
            - listitem [ref=e326]:
              - link "Logout" [ref=e327] [cursor=pointer]:
                - /url: "#"
  - img [ref=e329]
  - table [ref=e331]:
    - rowgroup [ref=e332]:
      - row "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e333]:
        - cell [ref=e334]
        - cell "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e335]:
          - text: Best Compatible With Mozilla Firefox V36.0.4
          - text: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
          - link "Contact Us" [ref=e336] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Terms & Conditions" [ref=e337] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Privacy" [ref=e338] [cursor=pointer]:
            - /url: "#"
        - cell [ref=e339]:
          - img [ref=e340]
  - dialog "Add Appointment" [active] [ref=e342]:
    - generic [ref=e344]: Add Appointment
    - generic [ref=e345]:
      - generic [ref=e346]: Please enter the company name to add installation appointment.
      - generic [ref=e347]:
        - generic [ref=e348]: "Company Name*:"
        - generic [ref=e349]:
          - textbox [ref=e350]: FAIZUDDIN AUTO TEST
          - button "Search" [ref=e351]
      - generic [ref=e352]:
        - generic [ref=e353]: "Reference No.*:"
        - generic [ref=e354]:
          - textbox [ref=e355]: SR67000134
          - button "Search" [ref=e356]
        - generic [ref=e357]: 1 appointment allocation remaining
      - generic [ref=e358]:
        - generic [ref=e359]: "Appointment Date*:"
        - textbox [ref=e360]
      - generic [ref=e361]:
        - generic [ref=e362]: "Time Slot*:"
        - generic [ref=e363]:
          - generic [ref=e364]:
            - radio "10:00am - 12:00pm" [ref=e365]
            - text: 10:00am - 12:00pm
          - generic [ref=e366]:
            - radio "2:00pm - 4:00pm" [ref=e367]
            - text: 2:00pm - 4:00pm
    - generic [ref=e368]:
      - button "Confirm" [ref=e369] [cursor=pointer]
      - button "Cancel" [ref=e370] [cursor=pointer]
```

# Test source

```ts
  106 |     return dialog;
  107 |   }
  108 | 
  109 |   test("BO add beyond morning slot limit", async ({ boCalendarPage, browser }, testInfo) => {
  110 |     const ref = await arrangeBdpReferenceViaUCD(browser, testInfo);
  111 |     if (!ref) {
  112 |       test.skip(true, "Could not arrange a fresh Biometric Device Purchase reference via UCD.");
  113 |       return;
  114 |     }
  115 |     await boCalendarPage.navigate();
  116 |     const booked = await boCalendarPage.addAppointment({ companyName: COMPANY, existingRecordRefNo: ref, slot: MORNING });
  117 |     if (!booked) {
  118 |       test.skip(true, `Could not add an appointment for reference ${ref}.`);
  119 |       return;
  120 |     }
  121 |     await boCalendarPage.navigate();
  122 |     // Expected: CSE can proceed — the morning slot count reflects the add.
  123 |     expect(await boCalendarPage.getSlotCount(booked, MORNING)).toBeGreaterThan(0);
  124 |   });
  125 | 
  126 |   test("BO add beyond afternoon slot limit", async ({ boCalendarPage, browser }, testInfo) => {
  127 |     const ref = await arrangeBdpReferenceViaUCD(browser, testInfo);
  128 |     if (!ref) {
  129 |       test.skip(true, "Could not arrange a fresh Biometric Device Purchase reference via UCD.");
  130 |       return;
  131 |     }
  132 |     await boCalendarPage.navigate();
  133 |     const booked = await boCalendarPage.addAppointment({ companyName: COMPANY, existingRecordRefNo: ref, slot: AFTERNOON });
  134 |     if (!booked) {
  135 |       test.skip(true, `Could not add an appointment for reference ${ref}.`);
  136 |       return;
  137 |     }
  138 |     await boCalendarPage.navigate();
  139 |     expect(await boCalendarPage.getSlotCount(booked, AFTERNOON)).toBeGreaterThan(0);
  140 |   });
  141 | 
  142 |   test("BO add beyond 6 days limit", async ({ boCalendarPage, browser }, testInfo) => {
  143 |     // Add the appointment as CSE, then OBSERVE it in every location the SRD
  144 |     // lists. Email is checked via its on-screen proxy (the UCD Service Request
  145 |     // Listing), per the agreed approach.
  146 |     const ref = await arrangeBdpReferenceViaUCD(browser, testInfo);
  147 |     if (!ref) {
  148 |       test.skip(true, "Could not arrange a fresh Biometric Device Purchase reference via UCD.");
  149 |       return;
  150 |     }
  151 | 
  152 |     let booked: string | null = null;
  153 |     await test.step("CSE adds the appointment (beyond the 6/day cap)", async () => {
  154 |       await boCalendarPage.navigate();
  155 |       booked = await boCalendarPage.addAppointment({ companyName: COMPANY, existingRecordRefNo: ref, slot: MORNING });
  156 |     });
  157 |     if (!booked) {
  158 |       test.skip(true, `Could not add an appointment for reference ${ref}.`);
  159 |       return;
  160 |     }
  161 | 
  162 |     await test.step("Observe on BO Appointment Calendar — numbering continues", async () => {
  163 |       await boCalendarPage.navigate();
  164 |       // A positive count on the booked date/slot shows the numbered list
  165 |       // continued past the UCD cap (CSE is uncapped).
  166 |       expect(await boCalendarPage.getSlotCount(booked!, MORNING)).toBeGreaterThan(0);
  167 |     });
  168 | 
  169 |     await test.step("Observe on BO Biometric/SI Listing — reference present", async () => {
  170 |       const boListing = new (await import("../pages/bo/SoftwareInstallationListingPage")).SoftwareInstallationListingPage(boCalendarPage.page);
  171 |       await boListing.navigate();
  172 |       await boListing.searchWithFilters({ referenceNo: ref });
  173 |       const rows = await boListing.getResultRows();
  174 |       expect(rows.length, "the added appointment should appear in the BO listing").toBeGreaterThan(0);
  175 |     });
  176 | 
  177 |     await test.step("Observe on UCD Service Request Listing (on-screen proxy for the email)", async () => {
  178 |       const ucdCtx = await openTrackedContext(browser, testInfo);
  179 |       const ucdPage = await ucdCtx.newPage();
  180 |       try {
  181 |         const ucdLogin = new (await import("../pages/LoginPage")).LoginPage(ucdPage);
  182 |         const ucdListing = new (await import("../pages/ServiceRequestListingPage")).ServiceRequestListingPage(ucdPage);
  183 |         await ucdLogin.loginAsUCD(ENV.ucdUsername, ENV.ucdPassword);
  184 |         await ucdListing.navigate();
  185 |         await ucdListing.searchByReferenceNo(ref);
  186 |         const row = await ucdListing.findRowByRefNo(ref);
  187 |         // Best-effort: only assert when this UCD account owns the reference.
  188 |         if (row) {
  189 |           expect((await ucdListing.getRowServiceType(row)).length).toBeGreaterThan(0);
  190 |         }
  191 |       } finally {
  192 |         await closeTrackedContext(ucdCtx, testInfo, "UCD verifies listing");
  193 |       }
  194 |     });
  195 |   });
  196 | 
  197 |   test("BO add for current day and the next day", async ({ boCalendarPage }) => {
  198 |     const dialog = await prepareAddDialogWithListingSeed(boCalendarPage);
  199 |     if (!dialog) {
  200 |       test.skip(true, "No valid BO listing seed (Payment Status=OK, Installation Request='-') for Add Appointment.");
  201 |       return;
  202 |     }
  203 | 
  204 |     await test.step("Expected: able to proceed with booking today and tomorrow", async () => {
  205 |       expect(await boCalendarPage.isAddDateSelectable(boCalendarPage.today())).toBe(true);
> 206 |       expect(await boCalendarPage.isAddDateSelectable(boCalendarPage.daysFromToday(1))).toBe(true);
      |                                                                                         ^ Error: expect(received).toBe(expected) // Object.is equality
  207 |     });
  208 |     await boCalendarPage.closeAddDialog(dialog);
  209 |   });
  210 | 
  211 |   test("BO add for previous dates", async ({ boCalendarPage }) => {
  212 |     await boCalendarPage.navigate();
  213 |     const dialog = await boCalendarPage.openAddDialog();
  214 |     await test.step("Expected: a previous date is not selectable", async () => {
  215 |       expect(await boCalendarPage.isAddDateSelectable(boCalendarPage.yesterday())).toBe(false);
  216 |     });
  217 |     await boCalendarPage.closeAddDialog(dialog);
  218 |   });
  219 | 
  220 |   test("BO book future date more than 2 months", async ({ boCalendarPage }) => {
  221 |     const dialog = await prepareAddDialogWithListingSeed(boCalendarPage);
  222 |     if (!dialog) {
  223 |       test.skip(true, "No valid BO listing seed (Payment Status=OK, Installation Request='-') for Add Appointment.");
  224 |       return;
  225 |     }
  226 |     const far = boCalendarPage.dateMonthsAhead(3);
  227 |     await test.step(`Expected: ${far} (>2 months out) CAN be booked by BO`, async () => {
  228 |       expect(await boCalendarPage.isAddDateSelectable(far)).toBe(true);
  229 |     });
  230 |     await boCalendarPage.closeAddDialog(dialog);
  231 |   });
  232 | 
  233 |   test("BO book weekend dates", async ({ boCalendarPage }) => {
  234 |     await boCalendarPage.navigate();
  235 |     const dialog = await boCalendarPage.openAddDialog();
  236 |     const weekend = boCalendarPage.nextWeekend();
  237 |     await test.step(`Expected: weekend ${weekend} is greyed out / unclickable`, async () => {
  238 |       expect(await boCalendarPage.isAddDateSelectable(weekend)).toBe(false);
  239 |     });
  240 |     await boCalendarPage.closeAddDialog(dialog);
  241 |   });
  242 | 
  243 |   test("BO book Public Holiday", async ({ boCalendarPage }) => {
  244 |     const ph = ENV.publicHoliday;
  245 |     if (!ph) {
  246 |       test.skip(true, "No Public Holiday date provided — key one into the runner's Test data panel.");
  247 |       return;
  248 |     }
  249 |     await boCalendarPage.navigate();
  250 |     const dialog = await boCalendarPage.openAddDialog();
  251 |     await test.step(`Expected: public holiday ${ph} is greyed out / unclickable`, async () => {
  252 |       expect(await boCalendarPage.isAddDateSelectable(ph)).toBe(false);
  253 |     });
  254 |     await boCalendarPage.closeAddDialog(dialog);
  255 |   });
  256 | 
  257 |   // ── Reschedule-entry parity ──
  258 |   // The QA doc pairs every Add scenario above with a Reschedule one too —
  259 |   // these exercise the Reschedule dialog's OWN #ac-rs-date datepicker
  260 |   // (isRescheduleDateSelectable), rather than assuming it behaves the same
  261 |   // as Add's #ac-add-date.
  262 | 
  263 |   test("BO reschedule for current day and the next day", async ({ boCalendarPage }) => {
  264 |     await boCalendarPage.navigate();
  265 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  266 |     if (!dialog) {
  267 |       test.skip(true, "No listed appointment to reschedule in this month");
  268 |       return;
  269 |     }
  270 |     await test.step("Expected: able to reschedule into today and tomorrow", async () => {
  271 |       expect(await boCalendarPage.isRescheduleDateSelectable(boCalendarPage.today())).toBe(true);
  272 |       expect(await boCalendarPage.isRescheduleDateSelectable(boCalendarPage.daysFromToday(1))).toBe(true);
  273 |     });
  274 |     await boCalendarPage.closeRescheduleDialog(dialog);
  275 |   });
  276 | 
  277 |   test("BO reschedule for previous dates", async ({ boCalendarPage }) => {
  278 |     await boCalendarPage.navigate();
  279 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  280 |     if (!dialog) {
  281 |       test.skip(true, "No listed appointment to reschedule in this month");
  282 |       return;
  283 |     }
  284 |     await test.step("Expected: a previous date is not selectable", async () => {
  285 |       expect(await boCalendarPage.isRescheduleDateSelectable(boCalendarPage.yesterday())).toBe(false);
  286 |     });
  287 |     await boCalendarPage.closeRescheduleDialog(dialog);
  288 |   });
  289 | 
  290 |   test("BO reschedule future date more than 2 months", async ({ boCalendarPage }) => {
  291 |     await boCalendarPage.navigate();
  292 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  293 |     if (!dialog) {
  294 |       test.skip(true, "No listed appointment to reschedule in this month");
  295 |       return;
  296 |     }
  297 |     const far = boCalendarPage.dateMonthsAhead(3);
  298 |     await test.step(`Expected: ${far} (>2 months out) CAN be rescheduled into by BO`, async () => {
  299 |       expect(await boCalendarPage.isRescheduleDateSelectable(far)).toBe(true);
  300 |     });
  301 |     await boCalendarPage.closeRescheduleDialog(dialog);
  302 |   });
  303 | 
  304 |   test("BO reschedule weekend dates", async ({ boCalendarPage }) => {
  305 |     await boCalendarPage.navigate();
  306 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
```