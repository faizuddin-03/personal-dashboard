# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: reschedule-handling.spec.ts >> Reschedule & Handling >> BO >> BO reschedule normal flow
- Location: tests\service-hub\specs\reschedule-handling.spec.ts:391:9

# Error details

```
TimeoutError: locator.check: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('input[name="ac-rs-slot"][value="0"]')
    - locator resolved to <input value="0" type="radio" name="ac-rs-slot"/>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <span title="Sunday">Su</span> from <div id="ui-datepicker-div" class="ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all ui-helper-hidden-accessible">…</div> subtree intercepts pointer events
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is visible, enabled and stable
      - scrolling into view if needed
      - done scrolling
      - <span title="Sunday">Su</span> from <div id="ui-datepicker-div" class="ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all ui-helper-hidden-accessible">…</div> subtree intercepts pointer events
    - retrying click action
      - waiting 100ms
    18 × waiting for element to be visible, enabled and stable
       - element is visible, enabled and stable
       - scrolling into view if needed
       - done scrolling
       - <span title="Sunday">Su</span> from <div id="ui-datepicker-div" class="ui-datepicker ui-widget ui-widget-content ui-helper-clearfix ui-corner-all ui-helper-hidden-accessible">…</div> subtree intercepts pointer events
     - retrying click action
       - waiting 500ms

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
        - row "15-07-2026 Morning - 0 Afternoon - 2 Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST" [ref=e94]:
          - cell "15-07-2026 Morning - 0 Afternoon - 2" [ref=e95]:
            - text: 15-07-2026
            - generic [ref=e96]: Morning - 0
            - generic [ref=e97]: Afternoon - 2
          - cell [ref=e98]
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST" [ref=e99]:
            - list [ref=e100]:
              - listitem [ref=e101]:
                - generic [ref=e102] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e103]:
                - generic [ref=e104] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
        - row "16-07-2026 Morning - 3 (Full) Afternoon - 0 Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST" [ref=e105]:
          - cell "16-07-2026 Morning - 3 (Full) Afternoon - 0" [ref=e106]:
            - text: 16-07-2026
            - generic [ref=e107]: Morning - 3 (Full)
            - generic [ref=e108]: Afternoon - 0
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST Reschedule 2. FAIZUDDIN AUTO TEST Reschedule 3. FAIZUDDIN AUTO TEST" [ref=e109]:
            - list [ref=e110]:
              - listitem [ref=e111]:
                - generic [ref=e112] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
              - listitem [ref=e113]:
                - generic [ref=e114] [cursor=pointer]: Reschedule
                - text: 2. FAIZUDDIN AUTO TEST
              - listitem [ref=e115]:
                - generic [ref=e116] [cursor=pointer]: Reschedule
                - text: 3. FAIZUDDIN AUTO TEST
          - cell [ref=e117]
        - row "17-07-2026 Morning - 0 Afternoon - 1 Reschedule 1. TRAZE Reschedule 1. FAIZUDDIN AUTO TEST" [ref=e118]:
          - cell "17-07-2026 Morning - 0 Afternoon - 1" [ref=e119]:
            - text: 17-07-2026
            - generic [ref=e120]: Morning - 0
            - generic [ref=e121]: Afternoon - 1
          - cell "Reschedule 1. TRAZE" [ref=e122]:
            - list [ref=e123]:
              - listitem [ref=e124]:
                - generic [ref=e125] [cursor=pointer]: Reschedule
                - text: 1. TRAZE
          - cell "Reschedule 1. FAIZUDDIN AUTO TEST" [ref=e126]:
            - list [ref=e127]:
              - listitem [ref=e128]:
                - generic [ref=e129] [cursor=pointer]: Reschedule
                - text: 1. FAIZUDDIN AUTO TEST
        - row "18-07-2026 - -" [ref=e130]:
          - cell "18-07-2026" [ref=e131]
          - cell "-" [ref=e132]
          - cell "-" [ref=e133]
        - row "19-07-2026 - -" [ref=e134]:
          - cell "19-07-2026" [ref=e135]
          - cell "-" [ref=e136]
          - cell "-" [ref=e137]
        - row "20-07-2026 Morning - 1 Afternoon - 0 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e138]:
          - cell "20-07-2026 Morning - 1 Afternoon - 0" [ref=e139]:
            - text: 20-07-2026
            - generic [ref=e140]: Morning - 1
            - generic [ref=e141]: Afternoon - 0
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e142]:
            - list [ref=e143]:
              - listitem [ref=e144]:
                - generic [ref=e145] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
          - cell [ref=e146]
        - row "21-07-2026 Morning - 1 Afternoon - 0 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e147]:
          - cell "21-07-2026 Morning - 1 Afternoon - 0" [ref=e148]:
            - text: 21-07-2026
            - generic [ref=e149]: Morning - 1
            - generic [ref=e150]: Afternoon - 0
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e151]:
            - list [ref=e152]:
              - listitem [ref=e153]:
                - generic [ref=e154] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
          - cell [ref=e155]
        - row "22-07-2026 Morning - 1 Afternoon - 0 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e156]:
          - cell "22-07-2026 Morning - 1 Afternoon - 0" [ref=e157]:
            - text: 22-07-2026
            - generic [ref=e158]: Morning - 1
            - generic [ref=e159]: Afternoon - 0
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e160]:
            - list [ref=e161]:
              - listitem [ref=e162]:
                - generic [ref=e163] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
          - cell [ref=e164]
        - row "23-07-2026 Morning - 1 Afternoon - 0 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e165]:
          - cell "23-07-2026 Morning - 1 Afternoon - 0" [ref=e166]:
            - text: 23-07-2026
            - generic [ref=e167]: Morning - 1
            - generic [ref=e168]: Afternoon - 0
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e169]:
            - list [ref=e170]:
              - listitem [ref=e171]:
                - generic [ref=e172] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
          - cell [ref=e173]
        - row "24-07-2026 Morning - 1 Afternoon - 0 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e174]:
          - cell "24-07-2026 Morning - 1 Afternoon - 0" [ref=e175]:
            - text: 24-07-2026
            - generic [ref=e176]: Morning - 1
            - generic [ref=e177]: Afternoon - 0
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e178]:
            - list [ref=e179]:
              - listitem [ref=e180]:
                - generic [ref=e181] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
          - cell [ref=e182]
        - row "25-07-2026 - -" [ref=e183]:
          - cell "25-07-2026" [ref=e184]
          - cell "-" [ref=e185]
          - cell "-" [ref=e186]
        - row "26-07-2026 - -" [ref=e187]:
          - cell "26-07-2026" [ref=e188]
          - cell "-" [ref=e189]
          - cell "-" [ref=e190]
        - row "27-07-2026 Morning - 1 Afternoon - 0 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e191]:
          - cell "27-07-2026 Morning - 1 Afternoon - 0" [ref=e192]:
            - text: 27-07-2026
            - generic [ref=e193]: Morning - 1
            - generic [ref=e194]: Afternoon - 0
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e195]:
            - list [ref=e196]:
              - listitem [ref=e197]:
                - generic [ref=e198] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
          - cell [ref=e199]
        - row "28-07-2026 Morning - 1 Afternoon - 0 Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e200]:
          - cell "28-07-2026 Morning - 1 Afternoon - 0" [ref=e201]:
            - text: 28-07-2026
            - generic [ref=e202]: Morning - 1
            - generic [ref=e203]: Afternoon - 0
          - cell "Reschedule 1. CHARRRRRR CHICKCOLI SDN BHD123321" [ref=e204]:
            - list [ref=e205]:
              - listitem [ref=e206]:
                - generic [ref=e207] [cursor=pointer]: Reschedule
                - text: 1. CHARRRRRR CHICKCOLI SDN BHD123321
          - cell [ref=e208]
        - row "29-07-2026 Morning - 0 Afternoon - 0" [ref=e209]:
          - cell "29-07-2026 Morning - 0 Afternoon - 0" [ref=e210]:
            - text: 29-07-2026
            - generic [ref=e211]: Morning - 0
            - generic [ref=e212]: Afternoon - 0
          - cell [ref=e213]
          - cell [ref=e214]
        - row "30-07-2026 Morning - 0 Afternoon - 0" [ref=e215]:
          - cell "30-07-2026 Morning - 0 Afternoon - 0" [ref=e216]:
            - text: 30-07-2026
            - generic [ref=e217]: Morning - 0
            - generic [ref=e218]: Afternoon - 0
          - cell [ref=e219]
          - cell [ref=e220]
        - row "31-07-2026 Morning - 0 Afternoon - 0" [ref=e221]:
          - cell "31-07-2026 Morning - 0 Afternoon - 0" [ref=e222]:
            - text: 31-07-2026
            - generic [ref=e223]: Morning - 0
            - generic [ref=e224]: Afternoon - 0
          - cell [ref=e225]
          - cell [ref=e226]
  - table [ref=e228]:
    - rowgroup [ref=e229]:
      - row "Home | Menu 2 Pending Transaction Found! Jason Seah, My Account | Logout" [ref=e230]:
        - cell "Home | Menu 2 Pending Transaction Found!" [ref=e231]:
          - generic [ref=e232]:
            - list [ref=e233]:
              - listitem [ref=e234]:
                - link "Home |" [ref=e235] [cursor=pointer]:
                  - /url: /uat1/home/
              - listitem [ref=e236]:
                - link "Menu" [ref=e237] [cursor=pointer]:
                  - /url: "#"
                  - text: Menu
                  - img [ref=e238]
            - generic [ref=e239] [cursor=pointer]: 2 Pending Transaction Found!
        - cell "Jason Seah, My Account | Logout" [ref=e240]:
          - list [ref=e242]:
            - listitem [ref=e243]: Jason Seah,
            - listitem [ref=e244]:
              - link "My Account |" [ref=e245] [cursor=pointer]:
                - /url: /uat1/view/ucd/my-account/view.do?type=Office
            - listitem [ref=e246]:
              - link "Logout" [ref=e247] [cursor=pointer]:
                - /url: "#"
  - img [ref=e249]
  - table [ref=e251]:
    - rowgroup [ref=e252]:
      - row "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e253]:
        - cell [ref=e254]
        - cell "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e255]:
          - text: Best Compatible With Mozilla Firefox V36.0.4
          - text: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
          - link "Contact Us" [ref=e256] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Terms & Conditions" [ref=e257] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Privacy" [ref=e258] [cursor=pointer]:
            - /url: "#"
        - cell [ref=e259]:
          - img [ref=e260]
  - generic [ref=e261]:
    - generic [ref=e262]:
      - generic "Prev" [ref=e263]:
        - generic [ref=e264]: Prev
      - generic "Next" [ref=e265]:
        - generic [ref=e266]: Next
      - generic:
        - combobox [ref=e267]:
          - option "Jul" [selected]
          - option "Aug"
          - option "Sep"
          - option "Oct"
          - option "Nov"
          - option "Dec"
        - combobox [ref=e268]:
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
    - table [ref=e269]:
      - rowgroup [ref=e270]:
        - row "Su Mo Tu We Th Fr Sa" [ref=e271]:
          - columnheader "Su" [ref=e272]
          - columnheader "Mo" [ref=e273]
          - columnheader "Tu" [ref=e274]
          - columnheader "We" [ref=e275]
          - columnheader "Th" [ref=e276]
          - columnheader "Fr" [ref=e277]
          - columnheader "Sa" [ref=e278]
      - rowgroup [ref=e279]:
        - row "1 2 3 4" [ref=e280]:
          - cell [ref=e281]
          - cell [ref=e282]
          - cell [ref=e283]
          - cell "1" [ref=e284]:
            - generic [ref=e285]: "1"
          - cell "2" [ref=e286]:
            - generic [ref=e287]: "2"
          - cell "3" [ref=e288]:
            - generic [ref=e289]: "3"
          - cell "4" [ref=e290]:
            - generic [ref=e291]: "4"
        - row "5 6 7 8 9 10 11" [ref=e292]:
          - cell "5" [ref=e293]:
            - generic [ref=e294]: "5"
          - cell "6" [ref=e295]:
            - generic [ref=e296]: "6"
          - cell "7" [ref=e297]:
            - generic [ref=e298]: "7"
          - cell "8" [ref=e299]:
            - generic [ref=e300]: "8"
          - cell "9" [ref=e301]:
            - generic [ref=e302]: "9"
          - cell "10" [ref=e303]:
            - generic [ref=e304]: "10"
          - cell "11" [ref=e305]:
            - generic [ref=e306]: "11"
        - row "12 13 14 15 16 17 18" [ref=e307]:
          - cell "12" [ref=e308]:
            - generic [ref=e309]: "12"
          - cell "13" [ref=e310]:
            - generic [ref=e311]: "13"
          - cell "14" [ref=e312]:
            - link "14" [ref=e313] [cursor=pointer]:
              - /url: "#"
          - cell "15" [ref=e314]:
            - link "15" [ref=e315] [cursor=pointer]:
              - /url: "#"
          - cell "16" [ref=e316]:
            - link "16" [ref=e317] [cursor=pointer]:
              - /url: "#"
          - cell "17" [ref=e318]:
            - link "17" [ref=e319] [cursor=pointer]:
              - /url: "#"
          - cell "18" [ref=e320]:
            - generic [ref=e321]: "18"
        - row "19 20 21 22 23 24 25" [ref=e322]:
          - cell "19" [ref=e323]:
            - generic [ref=e324]: "19"
          - cell "20" [ref=e325]:
            - link "20" [ref=e326] [cursor=pointer]:
              - /url: "#"
          - cell "21" [ref=e327]:
            - link "21" [ref=e328] [cursor=pointer]:
              - /url: "#"
          - cell "22" [ref=e329]:
            - link "22" [ref=e330] [cursor=pointer]:
              - /url: "#"
          - cell "23" [ref=e331]:
            - link "23" [ref=e332] [cursor=pointer]:
              - /url: "#"
          - cell "24" [ref=e333]:
            - link "24" [ref=e334] [cursor=pointer]:
              - /url: "#"
          - cell "25" [ref=e335]:
            - generic [ref=e336]: "25"
        - row "26 27 28 29 30 31" [ref=e337]:
          - cell "26" [ref=e338]:
            - generic [ref=e339]: "26"
          - cell "27" [ref=e340]:
            - link "27" [ref=e341] [cursor=pointer]:
              - /url: "#"
          - cell "28" [ref=e342]:
            - link "28" [ref=e343] [cursor=pointer]:
              - /url: "#"
          - cell "29" [ref=e344]:
            - link "29" [ref=e345] [cursor=pointer]:
              - /url: "#"
          - cell "30" [ref=e346]:
            - link "30" [ref=e347] [cursor=pointer]:
              - /url: "#"
          - cell "31" [ref=e348]:
            - link "31" [ref=e349] [cursor=pointer]:
              - /url: "#"
          - cell [ref=e350]
  - dialog "Reschedule Appointment" [ref=e352]:
    - generic [ref=e354]: Reschedule Appointment
    - generic [ref=e355]:
      - generic [ref=e356]:
        - generic [ref=e357]: "Company Name:"
        - text: FAIZUDDIN AUTO TEST
      - generic [ref=e358]:
        - generic [ref=e359]: "Installation Status:"
        - text: Pending
      - generic [ref=e360]:
        - generic [ref=e361]: "Installation Service Reference No.:"
        - text: SRI67000001
      - generic [ref=e362]:
        - generic [ref=e363]: "Current Appointment Date:"
        - text: 15-07-2026 2:00pm - 4:00pm
      - generic [ref=e364]:
        - generic [ref=e365]: "New Appointment Date*:"
        - textbox [ref=e366]: 31-07-2026
      - generic [ref=e367]:
        - generic [ref=e368]: "Time Slot*:"
        - generic [ref=e369]:
          - generic [ref=e370]:
            - radio "10:00am - 12:00pm" [ref=e371]
            - text: 10:00am - 12:00pm
          - generic [ref=e372]:
            - radio "2:00pm - 4:00pm" [ref=e373]
            - text: 2:00pm - 4:00pm
    - generic [ref=e374]:
      - button "Confirm" [ref=e375] [cursor=pointer]
      - button "Cancel" [ref=e376] [cursor=pointer]
```

# Test source

```ts
  152 |       if (await exact.count()) target = exact;
  153 |       // else: requested day isn't selectable this month — fall through to any.
  154 |     }
  155 |     if (!target) {
  156 |       const n = await selectable.count();
  157 |       if (n === 0) throw new Error("No selectable day in the datepicker");
  158 |       target = selectable.nth(n - 1); // last selectable → later in month
  159 |     }
  160 |     await target.click();
  161 |     // The datepicker overlay sits directly over the time-slot radios below the
  162 |     // date field; if it stays open it intercepts the next click. Force it shut.
  163 |     await this.dismissDatepicker();
  164 |   }
  165 | 
  166 |   /** Close the jQuery UI datepicker overlay so it can't intercept clicks. */
  167 |   private async dismissDatepicker() {
  168 |     await this.page.evaluate(() => {
  169 |       const w = window as unknown as { jQuery?: { datepicker?: { _hideDatepicker?: () => void } } };
  170 |       try {
  171 |         w.jQuery?.datepicker?._hideDatepicker?.();
  172 |       } catch {}
  173 |       const dp = document.getElementById("ui-datepicker-div");
  174 |       if (dp) dp.style.display = "none";
  175 |       (document.activeElement as HTMLElement | null)?.blur();
  176 |     });
  177 |     await this.datepicker.waitFor({ state: "hidden", timeout: 3000 }).catch(() => {});
  178 |   }
  179 | 
  180 |   private isoDayOfMonth(iso: string): number | undefined {
  181 |     const m = iso.match(/^\d{4}-\d{2}-(\d{2})$/);
  182 |     return m ? Number(m[1]) : undefined;
  183 |   }
  184 | 
  185 |   /**
  186 |    * Whether `dateIso` is selectable in the Add Appointment date field.
  187 |    *
  188 |    * Verified live against the real jQuery UI datepicker bound to #ac-add-date
  189 |    * (NOT the read-only #cal-table grid, which only ever displays existing
  190 |    * bookings and has no concept of "blocked" — the actual book/no-book gate
  191 |    * is this datepicker):
  192 |    *  - Past dates (before today): every cell carries
  193 |    *    "ui-datepicker-unselectable ui-state-disabled" and has no onclick.
  194 |    *  - Weekends: same disabled classes, plus "ui-datepicker-week-end".
  195 |    *  - Today and all future weekdays (including >2 months out — BO/CSE has
  196 |    *    no +2-day blackout and no 2-month window limit): enabled, no
  197 |    *    "ui-state-disabled" class.
  198 |    * Must be called with the Add Appointment dialog already open (does not
  199 |    * open/close the dialog itself, so callers can chain further actions).
  200 |    */
  201 |   async isAddDateSelectable(dateIso: string): Promise<boolean> {
  202 |     const [y, m, d] = dateIso.split("-").map(Number);
  203 |     await this.page.evaluate(() => {
  204 |       (window as unknown as { jQuery: any }).jQuery("#ac-add-date").datepicker("show");
  205 |     });
  206 |     await this.datepicker.waitFor({ state: "visible", timeout: 5000 });
  207 |     await this.datepicker.locator("select.ui-datepicker-month").selectOption(String(m - 1));
  208 |     await this.datepicker.locator("select.ui-datepicker-year").selectOption(String(y));
  209 |     // Changing the dropdowns re-renders the day grid — give it a beat.
  210 |     await this.page.waitForTimeout(200);
  211 |     const cell = this.datepicker.locator("td", { hasText: new RegExp(`^${d}$`) }).first();
  212 |     const disabled = await cell.evaluate((el) => el.classList.contains("ui-state-disabled"));
  213 |     await this.dismissDatepicker();
  214 |     return !disabled;
  215 |   }
  216 | 
  217 |   /**
  218 |    * Reschedule whichever appointment is listed first. Opens the Reschedule
  219 |    * dialog, sets a new date via the datepicker + a time slot, accepts the
  220 |    * native confirm, and waits for the calendar to refresh.
  221 |    */
  222 |   async rescheduleFirstListed(opts: { slot: BoTimeSlot }) {
  223 |     const link = this.page.locator("a.cal-rs").first();
  224 |     await this.demoHighlight(link);
  225 |     await link.click();
  226 |     await this.completeRescheduleDialog(opts.slot);
  227 |   }
  228 | 
  229 |   /** Reschedule the first appointment whose company name matches. */
  230 |   async rescheduleByCompany(opts: { companyName: string; slot: BoTimeSlot }) {
  231 |     const li = this.calTable
  232 |       .locator("li", { has: this.page.locator("span.cal-co", { hasText: opts.companyName }) })
  233 |       .filter({ has: this.page.locator("a.cal-rs") })
  234 |       .first();
  235 |     await li.locator("a.cal-rs").click();
  236 |     await this.completeRescheduleDialog(opts.slot);
  237 |   }
  238 | 
  239 |   private async completeRescheduleDialog(slot: BoTimeSlot) {
  240 |     const slotName = slot === 0 ? "morning" : "afternoon";
  241 |     const dialog = this.page.locator(".ui-dialog", { has: this.page.locator("#ac-rs-dialog") });
  242 |     await dialog.waitFor({ state: "visible", timeout: 10000 });
  243 |     // Show the current appointment being changed, so the reviewer sees the
  244 |     // "before" state before the new date is picked.
  245 |     await this.demoHighlight("#ac-rs-cur");
  246 | 
  247 |     await test.step(`Pick a new date and the ${slotName} slot`, async () => {
  248 |       // New Appointment Date via datepicker (readonly input → click to open).
  249 |       await this.page.locator("#ac-rs-date").click();
  250 |       await this.pickDatepickerDay();
  251 |       await this.demoHighlight(`input[name="ac-rs-slot"][value="${slot}"]`);
> 252 |       await this.page.locator(`input[name="ac-rs-slot"][value="${slot}"]`).check();
      |                                                                            ^ TimeoutError: locator.check: Timeout 10000ms exceeded.
  253 |     });
  254 | 
  255 |     await test.step("Confirm the reschedule", async () => {
  256 |       // Confirm raises a NATIVE browser confirm() — accept it.
  257 |       await this.demoHighlight(dialog.getByRole("button", { name: "Confirm" }), { color: "green" });
  258 |       this.page.once("dialog", (d) => d.accept());
  259 |       await dialog.getByRole("button", { name: "Confirm" }).click();
  260 |       await this.waitForNav();
  261 |       await this.demoPause();
  262 |     });
  263 |   }
  264 | 
  265 |   /**
  266 |    * Open the Add Appointment dialog and return its Locator, without filling
  267 |    * anything in. Used by the calendar date-rule checks (isAddDateSelectable
  268 |    * is scoped to this dialog's #ac-add-date field) — call closeAddDialog()
  269 |    * when done to leave the calendar clean.
  270 |    */
  271 |   async openAddDialog(): Promise<Locator> {
  272 |     await this.addAppointmentBtn.click();
  273 |     const dialog = this.page.locator(".ui-dialog", { has: this.page.locator("#ac-add-dialog") });
  274 |     await dialog.waitFor({ state: "visible", timeout: 10000 });
  275 |     return dialog;
  276 |   }
  277 | 
  278 |   /** Close the Add dialog via its Cancel button (best-effort, public wrapper). */
  279 |   async closeAddDialog(dialog: Locator) {
  280 |     await dialog.getByRole("button", { name: "Cancel" }).click().catch(() => {});
  281 |     await dialog.waitFor({ state: "hidden", timeout: 5000 }).catch(() => {});
  282 |   }
  283 | 
  284 |   /**
  285 |    * Add Appointment (jQuery UI dialog). Default type is "New Record"; pass
  286 |    * existingRecordRefNo to use the "Existing Record" path.
  287 |    */
  288 |   /**
  289 |    * Returns the date actually booked (DD-MM-YYYY, matching the calendar
  290 |    * label) on success, or `null` when the add couldn't proceed — the company
  291 |    * couldn't be resolved, it has no unallocated units ("No allocation
  292 |    * remaining"), or the confirm was rejected. Callers use null to SKIP
  293 |    * (arrange-else-skip) rather than fail. The chosen date may differ from
  294 |    * `appointmentDate` if that day isn't selectable, which is why we report
  295 |    * back the date the datepicker actually committed.
  296 |    */
  297 |   async addAppointment(opts: {
  298 |     companyName: string;
  299 |     slot: BoTimeSlot;
  300 |     appointmentDate?: string; // ISO (YYYY-MM-DD); picks that day if selectable this month
  301 |     existingRecordRefNo?: string;
  302 |     /**
  303 |      * Exact company to click from the search results. Defaults to
  304 |      * companyName. Needed because several look-alikes exist (e.g.
  305 |      * "FAIZUDDIN AUTO TEST" vs "FAIZUDDIN AUTO TEST 2"/"3") — we match the
  306 |      * result whose text is EXACTLY this, never a prefix.
  307 |      */
  308 |     companySelect?: string;
  309 |   }): Promise<string | null> {
  310 |     await this.demoHighlight(this.addAppointmentBtn);
  311 |     await this.addAppointmentBtn.click();
  312 |     const dialog = this.page.locator(".ui-dialog", { has: this.page.locator("#ac-add-dialog") });
  313 |     await dialog.waitFor({ state: "visible", timeout: 10000 });
  314 |     await this.demoPause();
  315 | 
  316 |     // Appointment type radio (New Record vs Existing Record).
  317 |     await this.page
  318 |       .locator(`input[name="ac-add-type"][value="${opts.existingRecordRefNo ? "EXISTING" : "NEW"}"]`)
  319 |       .check();
  320 | 
  321 |     // Company search → results render in .ac_results (<ul><li> list). Select
  322 |     // by EXACT text so "FAIZUDDIN AUTO TEST" never matches "… TEST 2"/"… 3".
  323 |     await this.page.locator("#ac-add-name").fill(opts.companyName);
  324 |     await this.demoHighlight("#ac-add-name");
  325 |     await this.page.locator("#ac-add-search").click();
  326 |     const results = this.page.locator(".ac_results");
  327 |     await results.waitFor({ state: "visible", timeout: 8000 }).catch(() => {});
  328 |     const pick = opts.companySelect ?? opts.companyName;
  329 |     const option = results.getByText(pick, { exact: true }).first();
  330 |     if (!(await option.count())) {
  331 |       await this.closeAddDialog(dialog); // company not in results — precondition unmet
  332 |       return null;
  333 |     }
  334 |     await this.demoHighlight(option);
  335 |     await option.click();
  336 | 
  337 |     // Existing Record: after the company is chosen, key in the reference
  338 |     // (captured from the BO SI Listing for this company) and search to bind it.
  339 |     if (opts.existingRecordRefNo) {
  340 |       const ref = opts.existingRecordRefNo;
  341 |       await test.step(`Enter Existing Record reference ${ref}`, async () => {
  342 |         await this.page.locator("#ac-add-refno").fill(ref);
  343 |         await this.demoHighlight("#ac-add-refno");
  344 |         await this.page.locator("#ac-add-ref-search").click();
  345 |         await this.page.waitForTimeout(500);
  346 |       });
  347 |     }
  348 | 
  349 |     // A company with no active installation request, or with no unallocated
  350 |     // units left, can't be added — the dialog surfaces one of these errors.
  351 |     if (
  352 |       (await this.page.locator("#ac-add-noreq").isVisible().catch(() => false)) ||
```