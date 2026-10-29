# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: bo-calendar-limits.spec.ts >> BO Calendar & Limits >> BO reschedule future date more than 2 months
- Location: tests\service-hub\specs\bo-calendar-limits.spec.ts:290:7

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
  - generic [ref=e341]:
    - generic [ref=e342]:
      - generic "Prev" [ref=e343]:
        - generic [ref=e344]: Prev
      - generic "Next" [ref=e345]:
        - generic [ref=e346]: Next
      - generic:
        - combobox [ref=e347]:
          - option "Jul"
          - option "Aug"
          - option "Sep"
          - option "Oct" [selected]
          - option "Nov"
          - option "Dec"
        - combobox [ref=e348]:
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
    - table [ref=e349]:
      - rowgroup [ref=e350]:
        - row "Su Mo Tu We Th Fr Sa" [ref=e351]:
          - columnheader "Su" [ref=e352]
          - columnheader "Mo" [ref=e353]
          - columnheader "Tu" [ref=e354]
          - columnheader "We" [ref=e355]
          - columnheader "Th" [ref=e356]
          - columnheader "Fr" [ref=e357]
          - columnheader "Sa" [ref=e358]
      - rowgroup [ref=e359]:
        - row "1 2 3" [ref=e360]:
          - cell [ref=e361]
          - cell [ref=e362]
          - cell [ref=e363]
          - cell [ref=e364]
          - cell "1" [ref=e365]:
            - link "1" [ref=e366] [cursor=pointer]:
              - /url: "#"
          - cell "2" [ref=e367]:
            - link "2" [ref=e368] [cursor=pointer]:
              - /url: "#"
          - cell "3" [ref=e369]:
            - generic [ref=e370]: "3"
        - row "4 5 6 7 8 9 10" [ref=e371]:
          - cell "4" [ref=e372]:
            - generic [ref=e373]: "4"
          - cell "5" [ref=e374]:
            - link "5" [ref=e375] [cursor=pointer]:
              - /url: "#"
          - cell "6" [ref=e376]:
            - link "6" [ref=e377] [cursor=pointer]:
              - /url: "#"
          - cell "7" [ref=e378]:
            - link "7" [ref=e379] [cursor=pointer]:
              - /url: "#"
          - cell "8" [ref=e380]:
            - link "8" [ref=e381] [cursor=pointer]:
              - /url: "#"
          - cell "9" [ref=e382]:
            - link "9" [ref=e383] [cursor=pointer]:
              - /url: "#"
          - cell "10" [ref=e384]:
            - generic [ref=e385]: "10"
        - row "11 12 13 14 15 16 17" [ref=e386]:
          - cell "11" [ref=e387]:
            - generic [ref=e388]: "11"
          - cell "12" [ref=e389]:
            - link "12" [ref=e390] [cursor=pointer]:
              - /url: "#"
          - cell "13" [ref=e391]:
            - link "13" [ref=e392] [cursor=pointer]:
              - /url: "#"
          - cell "14" [ref=e393]:
            - link "14" [ref=e394] [cursor=pointer]:
              - /url: "#"
          - cell "15" [ref=e395]:
            - link "15" [ref=e396] [cursor=pointer]:
              - /url: "#"
          - cell "16" [ref=e397]:
            - link "16" [ref=e398] [cursor=pointer]:
              - /url: "#"
          - cell "17" [ref=e399]:
            - generic [ref=e400]: "17"
        - row "18 19 20 21 22 23 24" [ref=e401]:
          - cell "18" [ref=e402]:
            - generic [ref=e403]: "18"
          - cell "19" [ref=e404]:
            - link "19" [ref=e405] [cursor=pointer]:
              - /url: "#"
          - cell "20" [ref=e406]:
            - link "20" [ref=e407] [cursor=pointer]:
              - /url: "#"
          - cell "21" [ref=e408]:
            - link "21" [ref=e409] [cursor=pointer]:
              - /url: "#"
          - cell "22" [ref=e410]:
            - link "22" [ref=e411] [cursor=pointer]:
              - /url: "#"
          - cell "23" [ref=e412]:
            - link "23" [ref=e413] [cursor=pointer]:
              - /url: "#"
          - cell "24" [ref=e414]:
            - generic [ref=e415]: "24"
        - row "25 26 27 28 29 30 31" [ref=e416]:
          - cell "25" [ref=e417]:
            - generic [ref=e418]: "25"
          - cell "26" [ref=e419]:
            - link "26" [ref=e420] [cursor=pointer]:
              - /url: "#"
          - cell "27" [ref=e421]:
            - link "27" [ref=e422] [cursor=pointer]:
              - /url: "#"
          - cell "28" [ref=e423]:
            - link "28" [ref=e424] [cursor=pointer]:
              - /url: "#"
          - cell "29" [ref=e425]:
            - link "29" [ref=e426] [cursor=pointer]:
              - /url: "#"
          - cell "30" [ref=e427]:
            - link "30" [ref=e428] [cursor=pointer]:
              - /url: "#"
          - cell "31" [ref=e429]:
            - generic [ref=e430]: "31"
  - dialog "Reschedule Appointment" [active] [ref=e432]:
    - generic [ref=e434]: Reschedule Appointment
    - generic [ref=e435]:
      - generic [ref=e436]:
        - generic [ref=e437]: "Company Name:"
        - text: EAST HUAT AUTO SDN BHD
      - generic [ref=e438]:
        - generic [ref=e439]: "Installation Status:"
        - text: Pending
      - generic [ref=e440]:
        - generic [ref=e441]: "Installation Service Reference No.:"
        - text: SR67000127
      - generic [ref=e442]:
        - generic [ref=e443]: "Current Appointment Date:"
        - text: 17-07-2026 10:00am - 12:00pm
      - generic [ref=e444]:
        - generic [ref=e445]: "New Appointment Date*:"
        - textbox [ref=e446]
      - generic [ref=e447]:
        - generic [ref=e448]: "Time Slot*:"
        - generic [ref=e449]:
          - generic [ref=e450]:
            - radio "10:00am - 12:00pm" [ref=e451]
            - text: 10:00am - 12:00pm
          - generic [ref=e452]:
            - radio "2:00pm - 4:00pm" [ref=e453]
            - text: 2:00pm - 4:00pm
    - generic [ref=e454]:
      - button "Confirm" [ref=e455] [cursor=pointer]
      - button "Cancel" [ref=e456] [cursor=pointer]
```

# Test source

```ts
  199 |     if (!dialog) {
  200 |       test.skip(true, "No valid BO listing seed (Payment Status=OK, Installation Request='-') for Add Appointment.");
  201 |       return;
  202 |     }
  203 | 
  204 |     await test.step("Expected: able to proceed with booking today and tomorrow", async () => {
  205 |       expect(await boCalendarPage.isAddDateSelectable(boCalendarPage.today())).toBe(true);
  206 |       expect(await boCalendarPage.isAddDateSelectable(boCalendarPage.daysFromToday(1))).toBe(true);
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
> 299 |       expect(await boCalendarPage.isRescheduleDateSelectable(far)).toBe(true);
      |                                                                    ^ Error: expect(received).toBe(expected) // Object.is equality
  300 |     });
  301 |     await boCalendarPage.closeRescheduleDialog(dialog);
  302 |   });
  303 | 
  304 |   test("BO reschedule weekend dates", async ({ boCalendarPage }) => {
  305 |     await boCalendarPage.navigate();
  306 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  307 |     if (!dialog) {
  308 |       test.skip(true, "No listed appointment to reschedule in this month");
  309 |       return;
  310 |     }
  311 |     const weekend = boCalendarPage.nextWeekend();
  312 |     await test.step(`Expected: weekend ${weekend} is greyed out / unclickable`, async () => {
  313 |       expect(await boCalendarPage.isRescheduleDateSelectable(weekend)).toBe(false);
  314 |     });
  315 |     await boCalendarPage.closeRescheduleDialog(dialog);
  316 |   });
  317 | 
  318 |   test("BO reschedule Public Holiday", async ({ boCalendarPage }) => {
  319 |     const ph = ENV.publicHoliday;
  320 |     if (!ph) {
  321 |       test.skip(true, "No Public Holiday date provided — key one into the runner's Test data panel.");
  322 |       return;
  323 |     }
  324 |     await boCalendarPage.navigate();
  325 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  326 |     if (!dialog) {
  327 |       test.skip(true, "No listed appointment to reschedule in this month");
  328 |       return;
  329 |     }
  330 |     await test.step(`Expected: public holiday ${ph} is greyed out / unclickable`, async () => {
  331 |       expect(await boCalendarPage.isRescheduleDateSelectable(ph)).toBe(false);
  332 |     });
  333 |     await boCalendarPage.closeRescheduleDialog(dialog);
  334 |   });
  335 | 
  336 |   test("BO reschedule beyond morning slot limit", async ({ boCalendarPage }) => {
  337 |     await boCalendarPage.navigate();
  338 |     const fullLabel = await boCalendarPage.findDateWithSlotFull(MORNING);
  339 |     if (!fullLabel) {
  340 |       test.skip(true, "No date with a full morning session available.");
  341 |       return;
  342 |     }
  343 |     const [d, m, y] = fullLabel.split("-");
  344 |     const iso = `${y}-${m}-${d}`;
  345 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  346 |     if (!dialog) {
  347 |       test.skip(true, "No listed appointment to reschedule in this month");
  348 |       return;
  349 |     }
  350 |     await test.step(`Expected: CSE can still reschedule into ${fullLabel} despite the morning session being full`, async () => {
  351 |       expect(await boCalendarPage.isRescheduleDateSelectable(iso)).toBe(true);
  352 |     });
  353 |     await boCalendarPage.closeRescheduleDialog(dialog);
  354 |   });
  355 | 
  356 |   test("BO reschedule beyond afternoon slot limit", async ({ boCalendarPage }) => {
  357 |     await boCalendarPage.navigate();
  358 |     const fullLabel = await boCalendarPage.findDateWithSlotFull(AFTERNOON);
  359 |     if (!fullLabel) {
  360 |       test.skip(true, "No date with a full afternoon session available.");
  361 |       return;
  362 |     }
  363 |     const [d, m, y] = fullLabel.split("-");
  364 |     const iso = `${y}-${m}-${d}`;
  365 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  366 |     if (!dialog) {
  367 |       test.skip(true, "No listed appointment to reschedule in this month");
  368 |       return;
  369 |     }
  370 |     await test.step(`Expected: CSE can still reschedule into ${fullLabel} despite the afternoon session being full`, async () => {
  371 |       expect(await boCalendarPage.isRescheduleDateSelectable(iso)).toBe(true);
  372 |     });
  373 |     await boCalendarPage.closeRescheduleDialog(dialog);
  374 |   });
  375 | 
  376 |   test("BO reschedule beyond 6 days limit", async ({ boCalendarPage }) => {
  377 |     // "6 days" = the UCD-facing 6/day cap; CSE ignores it. Reuses whichever
  378 |     // full session (morning or afternoon) is found first as evidence the
  379 |     // day is at/near that cap.
  380 |     await boCalendarPage.navigate();
  381 |     const fullLabel = (await boCalendarPage.findDateWithSlotFull(MORNING)) ?? (await boCalendarPage.findDateWithSlotFull(AFTERNOON));
  382 |     if (!fullLabel) {
  383 |       test.skip(true, "No date at the daily booking limit available.");
  384 |       return;
  385 |     }
  386 |     const [d, m, y] = fullLabel.split("-");
  387 |     const iso = `${y}-${m}-${d}`;
  388 |     const dialog = await boCalendarPage.openRescheduleDialogOnly();
  389 |     if (!dialog) {
  390 |       test.skip(true, "No listed appointment to reschedule in this month");
  391 |       return;
  392 |     }
  393 |     await test.step(`Expected: CSE can still reschedule into ${fullLabel} despite it being at the UCD 6/day cap`, async () => {
  394 |       expect(await boCalendarPage.isRescheduleDateSelectable(iso)).toBe(true);
  395 |     });
  396 |     await boCalendarPage.closeRescheduleDialog(dialog);
  397 |   });
  398 | 
  399 |   // ── Add Appointment — existing-reference edge case ──
```