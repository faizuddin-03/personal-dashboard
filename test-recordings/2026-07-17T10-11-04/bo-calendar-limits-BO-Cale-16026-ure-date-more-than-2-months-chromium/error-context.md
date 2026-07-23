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
        - row "20-07-2026 Morning - 9 (Full) Afternoon - 3 (Full) Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. FAIZUDDIN AUTO TEST Reschedule 6. FAIZUDDIN AUTO TEST Reschedule 7. FAIZUDDIN AUTO TEST Reschedule 8. 193 AUTO TRADING Reschedule 9. FAIZUDDIN AUTO TEST Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e123]:
          - cell "20-07-2026 Morning - 9 (Full) Afternoon - 3 (Full)" [ref=e124]:
            - text: 20-07-2026
            - generic [ref=e125]: Morning - 9 (Full)
            - generic [ref=e126]: Afternoon - 3 (Full)
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. FAIZUDDIN AUTO TEST Reschedule 6. FAIZUDDIN AUTO TEST Reschedule 7. FAIZUDDIN AUTO TEST Reschedule 8. 193 AUTO TRADING Reschedule 9. FAIZUDDIN AUTO TEST" [ref=e127]:
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
                - text: 5. FAIZUDDIN AUTO TEST
              - listitem [ref=e139]:
                - generic [ref=e140] [cursor=pointer]: Reschedule
                - text: 6. FAIZUDDIN AUTO TEST
              - listitem [ref=e141]:
                - generic [ref=e142] [cursor=pointer]: Reschedule
                - text: 7. FAIZUDDIN AUTO TEST
              - listitem [ref=e143]:
                - generic [ref=e144] [cursor=pointer]: Reschedule
                - text: 8. 193 AUTO TRADING
              - listitem [ref=e145]:
                - generic [ref=e146] [cursor=pointer]: Reschedule
                - text: 9. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. MUSICHOB SDN BHD" [ref=e147]:
            - list [ref=e148]:
              - listitem [ref=e149]:
                - generic [ref=e150] [cursor=pointer]: Reschedule
                - text: 1. MUSICHOB SDN BHD
              - listitem [ref=e151]:
                - generic [ref=e152] [cursor=pointer]: Reschedule
                - text: 2. MUSICHOB SDN BHD
              - listitem [ref=e153]:
                - generic [ref=e154] [cursor=pointer]: Reschedule
                - text: 3. MUSICHOB SDN BHD
        - row "21-07-2026 Morning - 8 (Full) Afternoon - 4 (Full) Reschedule 1. FAIZUDDIN AUTO TEST 2. MUSICHOB SDN BHD Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. MUSICHOB SDN BHD Reschedule 6. FAIZUDDIN AUTO TEST Reschedule 7. FAIZUDDIN AUTO TEST Reschedule 8. MUSICHOB SDN BHD Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. MUSICHOB SDN BHD" [ref=e155]:
          - cell "21-07-2026 Morning - 8 (Full) Afternoon - 4 (Full)" [ref=e156]:
            - text: 21-07-2026
            - generic [ref=e157]: Morning - 8 (Full)
            - generic [ref=e158]: Afternoon - 4 (Full)
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST 2. MUSICHOB SDN BHD Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. MUSICHOB SDN BHD Reschedule 6. FAIZUDDIN AUTO TEST Reschedule 7. FAIZUDDIN AUTO TEST Reschedule 8. MUSICHOB SDN BHD" [ref=e159]:
            - list [ref=e160]:
              - listitem [ref=e161]:
                - generic [ref=e162] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e163]: 2. MUSICHOB SDN BHD
              - listitem [ref=e164]:
                - generic [ref=e165] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e166]:
                - generic [ref=e167] [cursor=pointer]: Reschedule
                - text: 4. FAIZUDDIN AUTO TEST
              - listitem [ref=e168]:
                - generic [ref=e169] [cursor=pointer]: Reschedule
                - text: 5. MUSICHOB SDN BHD
              - listitem [ref=e170]:
                - generic [ref=e171] [cursor=pointer]: Reschedule
                - text: 6. FAIZUDDIN AUTO TEST
              - listitem [ref=e172]:
                - generic [ref=e173] [cursor=pointer]: Reschedule
                - text: 7. FAIZUDDIN AUTO TEST
              - listitem [ref=e174]:
                - generic [ref=e175] [cursor=pointer]: Reschedule
                - text: 8. MUSICHOB SDN BHD
          - cell "Reschedule 1. MUSICHOB SDN BHD Reschedule 2. MUSICHOB SDN BHD Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. MUSICHOB SDN BHD" [ref=e176]:
            - list [ref=e177]:
              - listitem [ref=e178]:
                - generic [ref=e179] [cursor=pointer]: Reschedule
                - text: 1. MUSICHOB SDN BHD
              - listitem [ref=e180]:
                - generic [ref=e181] [cursor=pointer]: Reschedule
                - text: 2. MUSICHOB SDN BHD
              - listitem [ref=e182]:
                - generic [ref=e183] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e184]:
                - generic [ref=e185] [cursor=pointer]: Reschedule
                - text: 4. MUSICHOB SDN BHD
        - row "22-07-2026 Morning - 3 (Full) Afternoon - 3 (Full) Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. JIMI HUUH Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 3. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 4. FAIZUDDIN AUTO TEST" [ref=e186]:
          - cell "22-07-2026 Morning - 3 (Full) Afternoon - 3 (Full)" [ref=e187]:
            - text: 22-07-2026
            - generic [ref=e188]: Morning - 3 (Full)
            - generic [ref=e189]: Afternoon - 3 (Full)
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. JIMI HUUH" [ref=e190]:
            - list [ref=e191]:
              - listitem [ref=e192]:
                - generic [ref=e193] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e194]:
                - generic [ref=e195] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e196]:
                - generic [ref=e197] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e198]:
                - generic [ref=e199] [cursor=pointer]: Reschedule
                - text: 4. JIMI HUUH
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 3. CHARRRRRR CHICKCOLI SDN BHD123321 Reschedule 4. FAIZUDDIN AUTO TEST" [ref=e200]:
            - list [ref=e201]:
              - listitem [ref=e202]:
                - generic [ref=e203] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e204]:
                - generic [ref=e205] [cursor=pointer]: Reschedule
                - text: 2. CHARRRRRR CHICKCOLI SDN BHD123321
              - listitem [ref=e206]:
                - generic [ref=e207] [cursor=pointer]: Reschedule
                - text: 3. CHARRRRRR CHICKCOLI SDN BHD123321
              - listitem [ref=e208]:
                - generic [ref=e209] [cursor=pointer]: Reschedule
                - text: 4. FAIZUDDIN AUTO TEST
        - row "23-07-2026 Morning - 3 (Full) Afternoon - 4 (Full) Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. JIMI HUUH Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST" [ref=e210]:
          - cell "23-07-2026 Morning - 3 (Full) Afternoon - 4 (Full)" [ref=e211]:
            - text: 23-07-2026
            - generic [ref=e212]: Morning - 3 (Full)
            - generic [ref=e213]: Afternoon - 4 (Full)
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. JIMI HUUH Reschedule 3. FAIZUDDIN AUTO TEST" [ref=e214]:
            - list [ref=e215]:
              - listitem [ref=e216]:
                - generic [ref=e217] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e218]:
                - generic [ref=e219] [cursor=pointer]: Reschedule
                - text: 2. JIMI HUUH
              - listitem [ref=e220]:
                - generic [ref=e221] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST" [ref=e222]:
            - list [ref=e223]:
              - listitem [ref=e224]:
                - generic [ref=e225] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e226]:
                - generic [ref=e227] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e228]:
                - generic [ref=e229] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e230]:
                - generic [ref=e231] [cursor=pointer]: Reschedule
                - text: 4. FAIZUDDIN AUTO TEST
        - row "24-07-2026 Morning - 3 (Full) Afternoon - 0 Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST" [ref=e232]:
          - cell "24-07-2026 Morning - 3 (Full) Afternoon - 0" [ref=e233]:
            - text: 24-07-2026
            - generic [ref=e234]: Morning - 3 (Full)
            - generic [ref=e235]: Afternoon - 0
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST" [ref=e236]:
            - list [ref=e237]:
              - listitem [ref=e238]:
                - generic [ref=e239] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e240]:
                - generic [ref=e241] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e242]:
                - generic [ref=e243] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
          - cell [ref=e244]
        - row "25-07-2026 - -" [ref=e245]:
          - cell "25-07-2026" [ref=e246]
          - cell "-" [ref=e247]
          - cell "-" [ref=e248]
        - row "26-07-2026 - -" [ref=e249]:
          - cell "26-07-2026" [ref=e250]
          - cell "-" [ref=e251]
          - cell "-" [ref=e252]
        - row "27-07-2026 Morning - 2 Afternoon - 1 Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 1. FAIZUDDIN AUTO TEST" [ref=e253]:
          - cell "27-07-2026 Morning - 2 Afternoon - 1" [ref=e254]:
            - text: 27-07-2026
            - generic [ref=e255]: Morning - 2
            - generic [ref=e256]: Afternoon - 1
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST" [ref=e257]:
            - list [ref=e258]:
              - listitem [ref=e259]:
                - generic [ref=e260] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e261]:
                - generic [ref=e262] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST" [ref=e263]:
            - list [ref=e264]:
              - listitem [ref=e265]:
                - generic [ref=e266] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
        - row "28-07-2026 Morning - 0 Afternoon - 0" [ref=e267]:
          - cell "28-07-2026 Morning - 0 Afternoon - 0" [ref=e268]:
            - text: 28-07-2026
            - generic [ref=e269]: Morning - 0
            - generic [ref=e270]: Afternoon - 0
          - cell [ref=e271]
          - cell [ref=e272]
        - row "29-07-2026 Morning - 0 Afternoon - 0" [ref=e273]:
          - cell "29-07-2026 Morning - 0 Afternoon - 0" [ref=e274]:
            - text: 29-07-2026
            - generic [ref=e275]: Morning - 0
            - generic [ref=e276]: Afternoon - 0
          - cell [ref=e277]
          - cell [ref=e278]
        - row "30-07-2026 Morning - 1 Afternoon - 1 Reschedule 1. JIMI HUUH Reschedule 1. JIMI HUUH" [ref=e279]:
          - cell "30-07-2026 Morning - 1 Afternoon - 1" [ref=e280]:
            - text: 30-07-2026
            - generic [ref=e281]: Morning - 1
            - generic [ref=e282]: Afternoon - 1
          - cell "Reschedule 1. JIMI HUUH" [ref=e283]:
            - list [ref=e284]:
              - listitem [ref=e285]:
                - generic [ref=e286] [cursor=pointer]: Reschedule
                - text: 1. JIMI HUUH
          - cell "Reschedule 1. JIMI HUUH" [ref=e287]:
            - list [ref=e288]:
              - listitem [ref=e289]:
                - generic [ref=e290] [cursor=pointer]: Reschedule
                - text: 1. JIMI HUUH
        - row "31-07-2026 Morning - 10 (Full) Afternoon - 5 (Full) Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. EAST HUAT AUTO SDN BHD Reschedule 5. FAIZUDDIN AUTO TEST Reschedule 6. FAIZUDDIN AUTO TEST Reschedule 7. FAIZUDDIN AUTO TEST Reschedule 8. MUSICHOB SDN BHD Reschedule 9. FAIZUDDIN AUTO TEST Reschedule 10. FAIZUDDIN AUTO TEST Reschedule 1. JIMI HUUH Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. MUSICHOB SDN BHD" [ref=e291]:
          - cell "31-07-2026 Morning - 10 (Full) Afternoon - 5 (Full)" [ref=e292]:
            - text: 31-07-2026
            - generic [ref=e293]: Morning - 10 (Full)
            - generic [ref=e294]: Afternoon - 5 (Full)
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. EAST HUAT AUTO SDN BHD Reschedule 5. FAIZUDDIN AUTO TEST Reschedule 6. FAIZUDDIN AUTO TEST Reschedule 7. FAIZUDDIN AUTO TEST Reschedule 8. MUSICHOB SDN BHD Reschedule 9. FAIZUDDIN AUTO TEST Reschedule 10. FAIZUDDIN AUTO TEST" [ref=e295]:
            - list [ref=e296]:
              - listitem [ref=e297]:
                - generic [ref=e298] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e299]:
                - generic [ref=e300] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e301]:
                - generic [ref=e302] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e303]:
                - generic [ref=e304] [cursor=pointer]: Reschedule
                - text: 4. EAST HUAT AUTO SDN BHD
              - listitem [ref=e305]:
                - generic [ref=e306] [cursor=pointer]: Reschedule
                - text: 5. FAIZUDDIN AUTO TEST
              - listitem [ref=e307]:
                - generic [ref=e308] [cursor=pointer]: Reschedule
                - text: 6. FAIZUDDIN AUTO TEST
              - listitem [ref=e309]:
                - generic [ref=e310] [cursor=pointer]: Reschedule
                - text: 7. FAIZUDDIN AUTO TEST
              - listitem [ref=e311]:
                - generic [ref=e312] [cursor=pointer]: Reschedule
                - text: 8. MUSICHOB SDN BHD
              - listitem [ref=e313]:
                - generic [ref=e314] [cursor=pointer]: Reschedule
                - text: 9. FAIZUDDIN AUTO TEST
              - listitem [ref=e315]:
                - generic [ref=e316] [cursor=pointer]: Reschedule
                - text: 10. FAIZUDDIN AUTO TEST
          - cell "Reschedule 1. JIMI HUUH Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST Reschedule 4. FAIZUDDIN AUTO TEST Reschedule 5. MUSICHOB SDN BHD" [ref=e317]:
            - list [ref=e318]:
              - listitem [ref=e319]:
                - generic [ref=e320] [cursor=pointer]: Reschedule
                - text: 1. JIMI HUUH
              - listitem [ref=e321]:
                - generic [ref=e322] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e323]:
                - generic [ref=e324] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
              - listitem [ref=e325]:
                - generic [ref=e326] [cursor=pointer]: Reschedule
                - text: 4. FAIZUDDIN AUTO TEST
              - listitem [ref=e327]:
                - generic [ref=e328] [cursor=pointer]: Reschedule
                - text: 5. MUSICHOB SDN BHD
  - table [ref=e330]:
    - rowgroup [ref=e331]:
      - row "Home | Menu 2 Pending Transaction Found! Jason Seah, My Account | Logout" [ref=e332]:
        - cell "Home | Menu 2 Pending Transaction Found!" [ref=e333]:
          - generic [ref=e334]:
            - list [ref=e335]:
              - listitem [ref=e336]:
                - link "Home |" [ref=e337] [cursor=pointer]:
                  - /url: /uat1/home/
              - listitem [ref=e338]:
                - link "Menu" [ref=e339] [cursor=pointer]:
                  - /url: "#"
                  - text: Menu
                  - img [ref=e340]
            - generic [ref=e341] [cursor=pointer]: 2 Pending Transaction Found!
        - cell "Jason Seah, My Account | Logout" [ref=e342]:
          - list [ref=e344]:
            - listitem [ref=e345]: Jason Seah,
            - listitem [ref=e346]:
              - link "My Account |" [ref=e347] [cursor=pointer]:
                - /url: /uat1/view/ucd/my-account/view.do?type=Office
            - listitem [ref=e348]:
              - link "Logout" [ref=e349] [cursor=pointer]:
                - /url: "#"
  - img [ref=e351]
  - table [ref=e353]:
    - rowgroup [ref=e354]:
      - row "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e355]:
        - cell [ref=e356]
        - cell "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e357]:
          - text: Best Compatible With Mozilla Firefox V36.0.4
          - text: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
          - link "Contact Us" [ref=e358] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Terms & Conditions" [ref=e359] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Privacy" [ref=e360] [cursor=pointer]:
            - /url: "#"
        - cell [ref=e361]:
          - img [ref=e362]
  - generic [ref=e363]:
    - generic [ref=e364]:
      - generic "Prev" [ref=e365]:
        - generic [ref=e366]: Prev
      - generic "Next" [ref=e367]:
        - generic [ref=e368]: Next
      - generic:
        - combobox [ref=e369]:
          - option "Jul"
          - option "Aug"
          - option "Sep"
          - option "Oct" [selected]
          - option "Nov"
          - option "Dec"
        - combobox [ref=e370]:
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
    - table [ref=e371]:
      - rowgroup [ref=e372]:
        - row "Su Mo Tu We Th Fr Sa" [ref=e373]:
          - columnheader "Su" [ref=e374]
          - columnheader "Mo" [ref=e375]
          - columnheader "Tu" [ref=e376]
          - columnheader "We" [ref=e377]
          - columnheader "Th" [ref=e378]
          - columnheader "Fr" [ref=e379]
          - columnheader "Sa" [ref=e380]
      - rowgroup [ref=e381]:
        - row "1 2 3" [ref=e382]:
          - cell [ref=e383]
          - cell [ref=e384]
          - cell [ref=e385]
          - cell [ref=e386]
          - cell "1" [ref=e387]:
            - link "1" [ref=e388] [cursor=pointer]:
              - /url: "#"
          - cell "2" [ref=e389]:
            - link "2" [ref=e390] [cursor=pointer]:
              - /url: "#"
          - cell "3" [ref=e391]:
            - generic [ref=e392]: "3"
        - row "4 5 6 7 8 9 10" [ref=e393]:
          - cell "4" [ref=e394]:
            - generic [ref=e395]: "4"
          - cell "5" [ref=e396]:
            - link "5" [ref=e397] [cursor=pointer]:
              - /url: "#"
          - cell "6" [ref=e398]:
            - link "6" [ref=e399] [cursor=pointer]:
              - /url: "#"
          - cell "7" [ref=e400]:
            - link "7" [ref=e401] [cursor=pointer]:
              - /url: "#"
          - cell "8" [ref=e402]:
            - link "8" [ref=e403] [cursor=pointer]:
              - /url: "#"
          - cell "9" [ref=e404]:
            - link "9" [ref=e405] [cursor=pointer]:
              - /url: "#"
          - cell "10" [ref=e406]:
            - generic [ref=e407]: "10"
        - row "11 12 13 14 15 16 17" [ref=e408]:
          - cell "11" [ref=e409]:
            - generic [ref=e410]: "11"
          - cell "12" [ref=e411]:
            - link "12" [ref=e412] [cursor=pointer]:
              - /url: "#"
          - cell "13" [ref=e413]:
            - link "13" [ref=e414] [cursor=pointer]:
              - /url: "#"
          - cell "14" [ref=e415]:
            - link "14" [ref=e416] [cursor=pointer]:
              - /url: "#"
          - cell "15" [ref=e417]:
            - link "15" [ref=e418] [cursor=pointer]:
              - /url: "#"
          - cell "16" [ref=e419]:
            - link "16" [ref=e420] [cursor=pointer]:
              - /url: "#"
          - cell "17" [ref=e421]:
            - generic [ref=e422]: "17"
        - row "18 19 20 21 22 23 24" [ref=e423]:
          - cell "18" [ref=e424]:
            - generic [ref=e425]: "18"
          - cell "19" [ref=e426]:
            - link "19" [ref=e427] [cursor=pointer]:
              - /url: "#"
          - cell "20" [ref=e428]:
            - link "20" [ref=e429] [cursor=pointer]:
              - /url: "#"
          - cell "21" [ref=e430]:
            - link "21" [ref=e431] [cursor=pointer]:
              - /url: "#"
          - cell "22" [ref=e432]:
            - link "22" [ref=e433] [cursor=pointer]:
              - /url: "#"
          - cell "23" [ref=e434]:
            - link "23" [ref=e435] [cursor=pointer]:
              - /url: "#"
          - cell "24" [ref=e436]:
            - generic [ref=e437]: "24"
        - row "25 26 27 28 29 30 31" [ref=e438]:
          - cell "25" [ref=e439]:
            - generic [ref=e440]: "25"
          - cell "26" [ref=e441]:
            - link "26" [ref=e442] [cursor=pointer]:
              - /url: "#"
          - cell "27" [ref=e443]:
            - link "27" [ref=e444] [cursor=pointer]:
              - /url: "#"
          - cell "28" [ref=e445]:
            - link "28" [ref=e446] [cursor=pointer]:
              - /url: "#"
          - cell "29" [ref=e447]:
            - link "29" [ref=e448] [cursor=pointer]:
              - /url: "#"
          - cell "30" [ref=e449]:
            - link "30" [ref=e450] [cursor=pointer]:
              - /url: "#"
          - cell "31" [ref=e451]:
            - generic [ref=e452]: "31"
  - dialog "Reschedule Appointment" [active] [ref=e454]:
    - generic [ref=e456]: Reschedule Appointment
    - generic [ref=e457]:
      - generic [ref=e458]:
        - generic [ref=e459]: "Company Name:"
        - text: TRAZE
      - generic [ref=e460]:
        - generic [ref=e461]: "Installation Status:"
        - text: Pending
      - generic [ref=e462]:
        - generic [ref=e463]: "Installation Service Reference No.:"
        - text: SR67000121
      - generic [ref=e464]:
        - generic [ref=e465]: "Current Appointment Date:"
        - text: 17-07-2026 2:00pm - 4:00pm
      - generic [ref=e466]:
        - generic [ref=e467]: "New Appointment Date*:"
        - textbox [ref=e468]
      - generic [ref=e469]:
        - generic [ref=e470]: "Time Slot*:"
        - generic [ref=e471]:
          - generic [ref=e472]:
            - radio "10:00am - 12:00pm" [ref=e473]
            - text: 10:00am - 12:00pm
          - generic [ref=e474]:
            - radio "2:00pm - 4:00pm" [ref=e475]
            - text: 2:00pm - 4:00pm
    - generic [ref=e476]:
      - button "Confirm" [ref=e477] [cursor=pointer]
      - button "Cancel" [ref=e478] [cursor=pointer]
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