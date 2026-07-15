# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: bo-calendar-limits.spec.ts >> BO Calendar & Limits >> BO add beyond 6 days limit
- Location: tests\service-hub\specs\bo-calendar-limits.spec.ts:58:7

# Error details

```
Error: the added appointment should appear in the BO listing

expect(received).not.toBeNull()

Received: null
```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e2]:
    - generic [ref=e3]:
      - generic [ref=e4]:
        - generic [ref=e5]:
          - text: "Reference No.:"
          - textbox [ref=e6]
        - generic [ref=e7]:
          - text: "Company Name:"
          - textbox [ref=e8]: FAIZUDDIN AUTO TEST
        - generic [ref=e9]:
          - generic [ref=e10]: "Date Requested From :"
          - textbox [ref=e11]
        - generic [ref=e12]:
          - generic [ref=e13]: "Date Requested To :"
          - textbox [ref=e14]
      - generic [ref=e15]:
        - generic [ref=e16]:
          - text: "Company ROC:"
          - textbox [ref=e17]
        - generic [ref=e18]:
          - text: "Delivery Date From:"
          - textbox [ref=e19]
        - generic [ref=e20]:
          - text: "Delivery Date To:"
          - textbox [ref=e21]
        - generic [ref=e22]:
          - text: "Delivery Status:"
          - combobox [ref=e23]:
            - option "All" [selected]
            - option "New"
            - option "Arranged"
            - option "Delivered"
      - generic [ref=e24]:
        - generic [ref=e25]:
          - text: "Appointment Date From:"
          - textbox [ref=e26]
        - generic [ref=e27]:
          - text: "Appointment Date To:"
          - textbox [ref=e28]
        - generic [ref=e29]:
          - text: "Installation Status:"
          - combobox [ref=e30]:
            - option "All" [selected]
            - option "New"
            - option "Pending"
            - option "Completed"
            - option "Failed"
            - option "Cancelled"
        - generic [ref=e31]:
          - text: "Time Slot:"
          - generic [ref=e32]:
            - generic [ref=e33]:
              - checkbox "10am - 12pm" [checked] [ref=e34]
              - text: 10am - 12pm
            - generic [ref=e35]:
              - checkbox "2pm - 4pm" [checked] [ref=e36]
              - text: 2pm - 4pm
      - generic [ref=e37]:
        - generic [ref=e38]:
          - text: "Payment Status:"
          - combobox [ref=e39]:
            - option "All" [selected]
            - option "Paid"
            - option "Pending"
            - option "Failed"
            - option "New"
        - generic [ref=e40]:
          - text: "LHDN Response Status:"
          - combobox [ref=e41]:
            - option "All" [selected]
            - option "OK"
            - option "Failed"
            - option "-"
            - option "N/A"
        - generic [ref=e42]:
          - button "Search" [active] [ref=e43]
          - text: Export Reset |
          - button "Appointment Calendar" [ref=e44]
    - generic [ref=e45]: Biometric Device Purchase & Software Installation Listing
    - generic [ref=e46]:
      - generic [ref=e47]: 44 record(s) in total
      - table [ref=e49]:
        - rowgroup [ref=e69]:
          - row "# Reference No. Date Requested Company Name Company ROC Device Delivery Date Installation Request Appointment Date Time Slot Payment Status LHDN Response Status Delivery Status Installation Status Date Completed Remarks Special Remarks Action" [ref=e70]:
            - columnheader "#" [ref=e71]
            - columnheader "Reference No." [ref=e72]
            - columnheader "Date Requested" [ref=e73]
            - columnheader "Company Name" [ref=e74]
            - columnheader "Company ROC" [ref=e75]
            - columnheader "Device" [ref=e76]
            - columnheader "Delivery Date" [ref=e77]
            - columnheader "Installation Request" [ref=e78]
            - columnheader "Appointment Date" [ref=e79]
            - columnheader "Time Slot" [ref=e80]
            - columnheader "Payment Status" [ref=e81]
            - columnheader "LHDN Response Status" [ref=e82]
            - columnheader "Delivery Status" [ref=e83]
            - columnheader "Installation Status" [ref=e84]
            - columnheader "Date Completed" [ref=e85]
            - columnheader "Remarks" [ref=e86]
            - columnheader "Special Remarks" [ref=e87]
            - columnheader "Action" [ref=e88]
        - rowgroup [ref=e89]:
          - row "1 SRI67000109 15-07-2026 10:36 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 10am - 12pm - - - Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e90]:
            - cell "1" [ref=e91]
            - cell "SRI67000109" [ref=e92]
            - cell "15-07-2026 10:36" [ref=e93]:
              - text: 15-07-2026
              - text: 10:36
            - cell "FAIZUDDIN AUTO TEST" [ref=e94]
            - cell "-" [ref=e95]
            - cell "-" [ref=e96]
            - cell "-" [ref=e97]
            - cell "1" [ref=e98]
            - cell "31-07-2026" [ref=e99]
            - cell "10am - 12pm" [ref=e100]:
              - text: 10am -
              - text: 12pm
            - cell "-" [ref=e101]
            - cell "-" [ref=e102]
            - cell "-" [ref=e103]
            - cell "Pending" [ref=e104]
            - cell "-" [ref=e105]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e106]
            - cell "No" [ref=e107]
            - cell "View | Cancel" [ref=e108]:
              - link "View" [ref=e109] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=d8257140-4843-4e4d-9e7a-3a8455c88bc6&apptId=b0175483-0bd9-4131-bd13-58128606e586
              - text: "|"
              - link "Cancel" [ref=e110] [cursor=pointer]:
                - /url: "#"
          - row "2 SRI67000106 15-07-2026 10:05 FAIZUDDIN AUTO TEST 030311-A - - 1 24-07-2026 10am - 12pm OK OK - Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e111]:
            - cell "2" [ref=e112]
            - cell "SRI67000106" [ref=e113]
            - cell "15-07-2026 10:05" [ref=e114]:
              - text: 15-07-2026
              - text: 10:05
            - cell "FAIZUDDIN AUTO TEST" [ref=e115]
            - cell "030311-A" [ref=e116]
            - cell "-" [ref=e117]
            - cell "-" [ref=e118]
            - cell "1" [ref=e119]
            - cell "24-07-2026" [ref=e120]
            - cell "10am - 12pm" [ref=e121]:
              - text: 10am -
              - text: 12pm
            - cell "OK" [ref=e122]
            - cell "OK" [ref=e123]
            - cell "-" [ref=e124]
            - cell "Pending" [ref=e125]
            - cell "-" [ref=e126]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e127]
            - cell "No" [ref=e128]
            - cell "View | Cancel" [ref=e129]:
              - link "View" [ref=e130] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=477a005d-8efa-47b3-a060-d4c87a0e9985&apptId=df67ffa3-21a4-49dd-82dd-7c8410d87cf1
              - text: "|"
              - link "Cancel" [ref=e131] [cursor=pointer]:
                - /url: "#"
          - row "3 SRB67000105 15-07-2026 10:04 FAIZUDDIN AUTO TEST 030311-A 2 - 1 23-07-2026 2pm - 4pm OK OK New Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e132]:
            - cell "3" [ref=e133]
            - cell "SRB67000105" [ref=e134]
            - cell "15-07-2026 10:04" [ref=e135]:
              - text: 15-07-2026
              - text: 10:04
            - cell "FAIZUDDIN AUTO TEST" [ref=e136]
            - cell "030311-A" [ref=e137]
            - cell "2" [ref=e138]
            - cell "-" [ref=e139]
            - cell "1" [ref=e140]
            - cell "23-07-2026" [ref=e141]
            - cell "2pm - 4pm" [ref=e142]:
              - text: 2pm -
              - text: 4pm
            - cell "OK" [ref=e143]
            - cell "OK" [ref=e144]
            - cell "New" [ref=e145]
            - cell "Pending" [ref=e146]
            - cell "-" [ref=e147]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e148]
            - cell "No" [ref=e149]
            - cell "View | Cancel" [ref=e150]:
              - link "View" [ref=e151] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=a3275a41-ed49-4c39-a4f6-888298485f43&apptId=67340631-efac-4474-acbc-11b87bca377b
              - text: "|"
              - link "Cancel" [ref=e152] [cursor=pointer]:
                - /url: "#"
          - row "4 SRB67000103 15-07-2026 10:04 FAIZUDDIN AUTO TEST 030311-A 2 - 1 23-07-2026 10am - 12pm OK OK New Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e153]:
            - cell "4" [ref=e154]
            - cell "SRB67000103" [ref=e155]
            - cell "15-07-2026 10:04" [ref=e156]:
              - text: 15-07-2026
              - text: 10:04
            - cell "FAIZUDDIN AUTO TEST" [ref=e157]
            - cell "030311-A" [ref=e158]
            - cell "2" [ref=e159]
            - cell "-" [ref=e160]
            - cell "1" [ref=e161]
            - cell "23-07-2026" [ref=e162]
            - cell "10am - 12pm" [ref=e163]:
              - text: 10am -
              - text: 12pm
            - cell "OK" [ref=e164]
            - cell "OK" [ref=e165]
            - cell "New" [ref=e166]
            - cell "Pending" [ref=e167]
            - cell "-" [ref=e168]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e169]
            - cell "No" [ref=e170]
            - cell "View | Cancel" [ref=e171]:
              - link "View" [ref=e172] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=dbe6532b-4dd1-49b6-b06b-d58cf64e6034&apptId=ef5910a3-8700-46bd-8284-3b4e250294a0
              - text: "|"
              - link "Cancel" [ref=e173] [cursor=pointer]:
                - /url: "#"
          - row "5 SRI67000101 15-07-2026 10:03 FAIZUDDIN AUTO TEST 030311-A - - 1 23-07-2026 10am - 12pm OK OK - Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e174]:
            - cell "5" [ref=e175]
            - cell "SRI67000101" [ref=e176]
            - cell "15-07-2026 10:03" [ref=e177]:
              - text: 15-07-2026
              - text: 10:03
            - cell "FAIZUDDIN AUTO TEST" [ref=e178]
            - cell "030311-A" [ref=e179]
            - cell "-" [ref=e180]
            - cell "-" [ref=e181]
            - cell "1" [ref=e182]
            - cell "23-07-2026" [ref=e183]
            - cell "10am - 12pm" [ref=e184]:
              - text: 10am -
              - text: 12pm
            - cell "OK" [ref=e185]
            - cell "OK" [ref=e186]
            - cell "-" [ref=e187]
            - cell "Pending" [ref=e188]
            - cell "-" [ref=e189]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e190]
            - cell "No" [ref=e191]
            - cell "View | Cancel" [ref=e192]:
              - link "View" [ref=e193] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=0e104f87-1861-4ea9-9074-81c511f76505&apptId=35b87e8a-9446-46b1-908c-5a0262439636
              - text: "|"
              - link "Cancel" [ref=e194] [cursor=pointer]:
                - /url: "#"
          - row "6 SRB67000100 15-07-2026 10:03 FAIZUDDIN AUTO TEST 030311-A 2 - 1 22-07-2026 2pm - 4pm OK OK New Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e195]:
            - cell "6" [ref=e196]
            - cell "SRB67000100" [ref=e197]
            - cell "15-07-2026 10:03" [ref=e198]:
              - text: 15-07-2026
              - text: 10:03
            - cell "FAIZUDDIN AUTO TEST" [ref=e199]
            - cell "030311-A" [ref=e200]
            - cell "2" [ref=e201]
            - cell "-" [ref=e202]
            - cell "1" [ref=e203]
            - cell "22-07-2026" [ref=e204]
            - cell "2pm - 4pm" [ref=e205]:
              - text: 2pm -
              - text: 4pm
            - cell "OK" [ref=e206]
            - cell "OK" [ref=e207]
            - cell "New" [ref=e208]
            - cell "Pending" [ref=e209]
            - cell "-" [ref=e210]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e211]
            - cell "No" [ref=e212]
            - cell "View | Cancel" [ref=e213]:
              - link "View" [ref=e214] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=c190d6f9-0181-4ed4-ad04-3b0173f2c298&apptId=ad774d08-3422-4197-aebd-0b9a23aee6b1
              - text: "|"
              - link "Cancel" [ref=e215] [cursor=pointer]:
                - /url: "#"
          - row "7 SRB67000096 15-07-2026 10:02 FAIZUDDIN AUTO TEST 030311-A 2 - 1 22-07-2026 2pm - 4pm OK OK New Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e216]:
            - cell "7" [ref=e217]
            - cell "SRB67000096" [ref=e218]
            - cell "15-07-2026 10:02" [ref=e219]:
              - text: 15-07-2026
              - text: 10:02
            - cell "FAIZUDDIN AUTO TEST" [ref=e220]
            - cell "030311-A" [ref=e221]
            - cell "2" [ref=e222]
            - cell "-" [ref=e223]
            - cell "1" [ref=e224]
            - cell "22-07-2026" [ref=e225]
            - cell "2pm - 4pm" [ref=e226]:
              - text: 2pm -
              - text: 4pm
            - cell "OK" [ref=e227]
            - cell "OK" [ref=e228]
            - cell "New" [ref=e229]
            - cell "Pending" [ref=e230]
            - cell "-" [ref=e231]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e232]
            - cell "No" [ref=e233]
            - cell "View | Cancel" [ref=e234]:
              - link "View" [ref=e235] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=b8a3f01e-2e3f-4a09-84b7-81d93d339f9f&apptId=d7a363f7-ff26-47fd-9813-1bfcc7cdc1a1
              - text: "|"
              - link "Cancel" [ref=e236] [cursor=pointer]:
                - /url: "#"
          - row "8 SRI67000093 15-07-2026 10:01 FAIZUDDIN AUTO TEST 030311-A - - 1 22-07-2026 10am - 12pm OK OK - Pending - Split into 1 appointments, 2 unit(s) No View | Cancel" [ref=e237]:
            - cell "8" [ref=e238]
            - cell "SRI67000093" [ref=e239]
            - cell "15-07-2026 10:01" [ref=e240]:
              - text: 15-07-2026
              - text: 10:01
            - cell "FAIZUDDIN AUTO TEST" [ref=e241]
            - cell "030311-A" [ref=e242]
            - cell "-" [ref=e243]
            - cell "-" [ref=e244]
            - cell "1" [ref=e245]
            - cell "22-07-2026" [ref=e246]
            - cell "10am - 12pm" [ref=e247]:
              - text: 10am -
              - text: 12pm
            - cell "OK" [ref=e248]
            - cell "OK" [ref=e249]
            - cell "-" [ref=e250]
            - cell "Pending" [ref=e251]
            - cell "-" [ref=e252]
            - cell "Split into 1 appointments, 2 unit(s)" [ref=e253]
            - cell "No" [ref=e254]
            - cell "View | Cancel" [ref=e255]:
              - link "View" [ref=e256] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=34377134-6344-4266-912e-ba4b5f6021e5&apptId=48404ce1-51e7-452b-8b6b-745b121bcb78
              - text: "|"
              - link "Cancel" [ref=e257] [cursor=pointer]:
                - /url: "#"
          - row "9 SRI67000093 15-07-2026 10:01 FAIZUDDIN AUTO TEST 030311-A - - 1 22-07-2026 10am - 12pm OK OK - Pending - Split into 1 appointments, 2 unit(s) No View | Cancel" [ref=e258]:
            - cell "9" [ref=e259]
            - cell "SRI67000093" [ref=e260]
            - cell "15-07-2026 10:01" [ref=e261]:
              - text: 15-07-2026
              - text: 10:01
            - cell "FAIZUDDIN AUTO TEST" [ref=e262]
            - cell "030311-A" [ref=e263]
            - cell "-" [ref=e264]
            - cell "-" [ref=e265]
            - cell "1" [ref=e266]
            - cell "22-07-2026" [ref=e267]
            - cell "10am - 12pm" [ref=e268]:
              - text: 10am -
              - text: 12pm
            - cell "OK" [ref=e269]
            - cell "OK" [ref=e270]
            - cell "-" [ref=e271]
            - cell "Pending" [ref=e272]
            - cell "-" [ref=e273]
            - cell "Split into 1 appointments, 2 unit(s)" [ref=e274]
            - cell "No" [ref=e275]
            - cell "View | Cancel" [ref=e276]:
              - link "View" [ref=e277] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=34377134-6344-4266-912e-ba4b5f6021e5&apptId=50e9588c-0b25-4e4a-83f3-82184a81a988
              - text: "|"
              - link "Cancel" [ref=e278] [cursor=pointer]:
                - /url: "#"
          - row "10 SRI67000089 15-07-2026 09:59 FAIZUDDIN AUTO TEST 030311-A - - 1 21-07-2026 2pm - 4pm OK OK - Cancelled - CANCELLED BY jasons on 15-07-2026 09:59 No View" [ref=e279]:
            - cell "10" [ref=e280]
            - cell "SRI67000089" [ref=e281]
            - cell "15-07-2026 09:59" [ref=e282]:
              - text: 15-07-2026
              - text: 09:59
            - cell "FAIZUDDIN AUTO TEST" [ref=e283]
            - cell "030311-A" [ref=e284]
            - cell "-" [ref=e285]
            - cell "-" [ref=e286]
            - cell "1" [ref=e287]
            - cell "21-07-2026" [ref=e288]
            - cell "2pm - 4pm" [ref=e289]:
              - text: 2pm -
              - text: 4pm
            - cell "OK" [ref=e290]
            - cell "OK" [ref=e291]
            - cell "-" [ref=e292]
            - cell "Cancelled" [ref=e293]
            - cell "-" [ref=e294]
            - cell "CANCELLED BY jasons on 15-07-2026 09:59" [ref=e295]
            - cell "No" [ref=e296]
            - cell "View" [ref=e297]:
              - link "View" [ref=e298] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=38e4f70f-4fd9-4966-a1a6-c8142edbcaa1&apptId=45117d13-a4b7-4f99-8b16-ef7f2e0ce927
          - row "11 SRI67000088 15-07-2026 09:58 FAIZUDDIN AUTO TEST 030311-A - - 1 21-07-2026 10am - 12pm OK OK - Cancelled - CANCELLED BY jasons on 15-07-2026 10:00 No View" [ref=e299]:
            - cell "11" [ref=e300]
            - cell "SRI67000088" [ref=e301]
            - cell "15-07-2026 09:58" [ref=e302]:
              - text: 15-07-2026
              - text: 09:58
            - cell "FAIZUDDIN AUTO TEST" [ref=e303]
            - cell "030311-A" [ref=e304]
            - cell "-" [ref=e305]
            - cell "-" [ref=e306]
            - cell "1" [ref=e307]
            - cell "21-07-2026" [ref=e308]
            - cell "10am - 12pm" [ref=e309]:
              - text: 10am -
              - text: 12pm
            - cell "OK" [ref=e310]
            - cell "OK" [ref=e311]
            - cell "-" [ref=e312]
            - cell "Cancelled" [ref=e313]
            - cell "-" [ref=e314]
            - cell "CANCELLED BY jasons on 15-07-2026 10:00" [ref=e315]
            - cell "No" [ref=e316]
            - cell "View" [ref=e317]:
              - link "View" [ref=e318] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=1b9bc141-8ddb-4cce-a2cf-f2e4c0c15976&apptId=c861e8a0-4436-491c-9625-ceebbd0bccc2
          - row "12 SRI67000087 15-07-2026 09:58 FAIZUDDIN AUTO TEST 030311-A - - 1 22-07-2026 2pm - 4pm OK OK - Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e319]:
            - cell "12" [ref=e320]
            - cell "SRI67000087" [ref=e321]
            - cell "15-07-2026 09:58" [ref=e322]:
              - text: 15-07-2026
              - text: 09:58
            - cell "FAIZUDDIN AUTO TEST" [ref=e323]
            - cell "030311-A" [ref=e324]
            - cell "-" [ref=e325]
            - cell "-" [ref=e326]
            - cell "1" [ref=e327]
            - cell "22-07-2026" [ref=e328]
            - cell "2pm - 4pm" [ref=e329]:
              - text: 2pm -
              - text: 4pm
            - cell "OK" [ref=e330]
            - cell "OK" [ref=e331]
            - cell "-" [ref=e332]
            - cell "Pending" [ref=e333]
            - cell "-" [ref=e334]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e335]
            - cell "No" [ref=e336]
            - cell "View | Cancel" [ref=e337]:
              - link "View" [ref=e338] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=f39229ac-0e62-4bd8-a4ca-4735423b4651&apptId=e8448c70-79b1-488c-96c8-29af980ee5a4
              - text: "|"
              - link "Cancel" [ref=e339] [cursor=pointer]:
                - /url: "#"
          - row "13 SRI67000086 15-07-2026 09:58 FAIZUDDIN AUTO TEST 030311-A - - 1 20-07-2026 2pm - 4pm OK OK - Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e340]:
            - cell "13" [ref=e341]
            - cell "SRI67000086" [ref=e342]
            - cell "15-07-2026 09:58" [ref=e343]:
              - text: 15-07-2026
              - text: 09:58
            - cell "FAIZUDDIN AUTO TEST" [ref=e344]
            - cell "030311-A" [ref=e345]
            - cell "-" [ref=e346]
            - cell "-" [ref=e347]
            - cell "1" [ref=e348]
            - cell "20-07-2026" [ref=e349]
            - cell "2pm - 4pm" [ref=e350]:
              - text: 2pm -
              - text: 4pm
            - cell "OK" [ref=e351]
            - cell "OK" [ref=e352]
            - cell "-" [ref=e353]
            - cell "Pending" [ref=e354]
            - cell "-" [ref=e355]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e356]
            - cell "No" [ref=e357]
            - cell "View | Cancel" [ref=e358]:
              - link "View" [ref=e359] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=870dde64-f06a-44d4-a54f-938470d3b294&apptId=382526e9-c59c-4d1e-95f9-8bcb6b0c405d
              - text: "|"
              - link "Cancel" [ref=e360] [cursor=pointer]:
                - /url: "#"
          - row "14 SRI67000085 15-07-2026 09:56 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 10am - 12pm - - - Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e361]:
            - cell "14" [ref=e362]
            - cell "SRI67000085" [ref=e363]
            - cell "15-07-2026 09:56" [ref=e364]:
              - text: 15-07-2026
              - text: 09:56
            - cell "FAIZUDDIN AUTO TEST" [ref=e365]
            - cell "-" [ref=e366]
            - cell "-" [ref=e367]
            - cell "-" [ref=e368]
            - cell "1" [ref=e369]
            - cell "31-07-2026" [ref=e370]
            - cell "10am - 12pm" [ref=e371]:
              - text: 10am -
              - text: 12pm
            - cell "-" [ref=e372]
            - cell "-" [ref=e373]
            - cell "-" [ref=e374]
            - cell "Pending" [ref=e375]
            - cell "-" [ref=e376]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e377]
            - cell "No" [ref=e378]
            - cell "View | Cancel" [ref=e379]:
              - link "View" [ref=e380] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=215c0f16-bb68-4278-a7c9-9c9441690a7a&apptId=f806f521-d8a9-478d-9dc2-39b04441a8fb
              - text: "|"
              - link "Cancel" [ref=e381] [cursor=pointer]:
                - /url: "#"
          - row "15 SRI67000084 15-07-2026 09:56 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 2pm - 4pm - - - Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e382]:
            - cell "15" [ref=e383]
            - cell "SRI67000084" [ref=e384]
            - cell "15-07-2026 09:56" [ref=e385]:
              - text: 15-07-2026
              - text: 09:56
            - cell "FAIZUDDIN AUTO TEST" [ref=e386]
            - cell "-" [ref=e387]
            - cell "-" [ref=e388]
            - cell "-" [ref=e389]
            - cell "1" [ref=e390]
            - cell "31-07-2026" [ref=e391]
            - cell "2pm - 4pm" [ref=e392]:
              - text: 2pm -
              - text: 4pm
            - cell "-" [ref=e393]
            - cell "-" [ref=e394]
            - cell "-" [ref=e395]
            - cell "Pending" [ref=e396]
            - cell "-" [ref=e397]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e398]
            - cell "No" [ref=e399]
            - cell "View | Cancel" [ref=e400]:
              - link "View" [ref=e401] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=58e8001a-8d2a-4ad5-9d30-ff4680136497&apptId=9653d62f-901b-49dd-89be-6d1d4b1ece1a
              - text: "|"
              - link "Cancel" [ref=e402] [cursor=pointer]:
                - /url: "#"
          - row "16 SRI67000083 15-07-2026 09:56 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 10am - 12pm - - - Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e403]:
            - cell "16" [ref=e404]
            - cell "SRI67000083" [ref=e405]
            - cell "15-07-2026 09:56" [ref=e406]:
              - text: 15-07-2026
              - text: 09:56
            - cell "FAIZUDDIN AUTO TEST" [ref=e407]
            - cell "-" [ref=e408]
            - cell "-" [ref=e409]
            - cell "-" [ref=e410]
            - cell "1" [ref=e411]
            - cell "31-07-2026" [ref=e412]
            - cell "10am - 12pm" [ref=e413]:
              - text: 10am -
              - text: 12pm
            - cell "-" [ref=e414]
            - cell "-" [ref=e415]
            - cell "-" [ref=e416]
            - cell "Pending" [ref=e417]
            - cell "-" [ref=e418]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e419]
            - cell "No" [ref=e420]
            - cell "View | Cancel" [ref=e421]:
              - link "View" [ref=e422] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=c39f1658-84bb-43b5-854b-fb2ac2b9fe43&apptId=c13f4ccc-6bd5-412f-887a-b46113bafde5
              - text: "|"
              - link "Cancel" [ref=e423] [cursor=pointer]:
                - /url: "#"
          - row "17 SRI67000082 15-07-2026 09:56 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 10am - 12pm - - - Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e424]:
            - cell "17" [ref=e425]
            - cell "SRI67000082" [ref=e426]
            - cell "15-07-2026 09:56" [ref=e427]:
              - text: 15-07-2026
              - text: 09:56
            - cell "FAIZUDDIN AUTO TEST" [ref=e428]
            - cell "-" [ref=e429]
            - cell "-" [ref=e430]
            - cell "-" [ref=e431]
            - cell "1" [ref=e432]
            - cell "31-07-2026" [ref=e433]
            - cell "10am - 12pm" [ref=e434]:
              - text: 10am -
              - text: 12pm
            - cell "-" [ref=e435]
            - cell "-" [ref=e436]
            - cell "-" [ref=e437]
            - cell "Pending" [ref=e438]
            - cell "-" [ref=e439]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e440]
            - cell "No" [ref=e441]
            - cell "View | Cancel" [ref=e442]:
              - link "View" [ref=e443] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=8aac9a61-0fac-433f-9d51-971efdfa97f4&apptId=f719b168-3949-475c-8318-4b2248cbb7bf
              - text: "|"
              - link "Cancel" [ref=e444] [cursor=pointer]:
                - /url: "#"
          - row "18 SRI67000081 15-07-2026 09:56 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 2pm - 4pm - - - Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e445]:
            - cell "18" [ref=e446]
            - cell "SRI67000081" [ref=e447]
            - cell "15-07-2026 09:56" [ref=e448]:
              - text: 15-07-2026
              - text: 09:56
            - cell "FAIZUDDIN AUTO TEST" [ref=e449]
            - cell "-" [ref=e450]
            - cell "-" [ref=e451]
            - cell "-" [ref=e452]
            - cell "1" [ref=e453]
            - cell "31-07-2026" [ref=e454]
            - cell "2pm - 4pm" [ref=e455]:
              - text: 2pm -
              - text: 4pm
            - cell "-" [ref=e456]
            - cell "-" [ref=e457]
            - cell "-" [ref=e458]
            - cell "Pending" [ref=e459]
            - cell "-" [ref=e460]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e461]
            - cell "No" [ref=e462]
            - cell "View | Cancel" [ref=e463]:
              - link "View" [ref=e464] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=36154cbf-52f2-461f-bff7-441a41294510&apptId=b1a93a9b-3f73-403f-99fe-df5fc01388e9
              - text: "|"
              - link "Cancel" [ref=e465] [cursor=pointer]:
                - /url: "#"
          - row "19 SRI67000080 15-07-2026 09:55 FAIZUDDIN AUTO TEST - - - 1 21-07-2026 2pm - 4pm - - - Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e466]:
            - cell "19" [ref=e467]
            - cell "SRI67000080" [ref=e468]
            - cell "15-07-2026 09:55" [ref=e469]:
              - text: 15-07-2026
              - text: 09:55
            - cell "FAIZUDDIN AUTO TEST" [ref=e470]
            - cell "-" [ref=e471]
            - cell "-" [ref=e472]
            - cell "-" [ref=e473]
            - cell "1" [ref=e474]
            - cell "21-07-2026" [ref=e475]
            - cell "2pm - 4pm" [ref=e476]:
              - text: 2pm -
              - text: 4pm
            - cell "-" [ref=e477]
            - cell "-" [ref=e478]
            - cell "-" [ref=e479]
            - cell "Pending" [ref=e480]
            - cell "-" [ref=e481]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e482]
            - cell "No" [ref=e483]
            - cell "View | Cancel" [ref=e484]:
              - link "View" [ref=e485] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=8e903566-2b33-46ba-90a2-35d76139068d&apptId=77121ce6-2519-445e-95b5-8ffe4661fbac
              - text: "|"
              - link "Cancel" [ref=e486] [cursor=pointer]:
                - /url: "#"
          - row "20 SRI67000079 15-07-2026 09:55 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 10am - 12pm - - - Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e487]:
            - cell "20" [ref=e488]
            - cell "SRI67000079" [ref=e489]
            - cell "15-07-2026 09:55" [ref=e490]:
              - text: 15-07-2026
              - text: 09:55
            - cell "FAIZUDDIN AUTO TEST" [ref=e491]
            - cell "-" [ref=e492]
            - cell "-" [ref=e493]
            - cell "-" [ref=e494]
            - cell "1" [ref=e495]
            - cell "31-07-2026" [ref=e496]
            - cell "10am - 12pm" [ref=e497]:
              - text: 10am -
              - text: 12pm
            - cell "-" [ref=e498]
            - cell "-" [ref=e499]
            - cell "-" [ref=e500]
            - cell "Pending" [ref=e501]
            - cell "-" [ref=e502]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e503]
            - cell "No" [ref=e504]
            - cell "View | Cancel" [ref=e505]:
              - link "View" [ref=e506] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=a0726fb8-390b-4a6e-8a06-c2763f3bd365&apptId=0ea463ea-07eb-439b-823a-705ad9610717
              - text: "|"
              - link "Cancel" [ref=e507] [cursor=pointer]:
                - /url: "#"
          - row "21 SRI67000078 15-07-2026 09:55 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 10am - 12pm - - - Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e508]:
            - cell "21" [ref=e509]
            - cell "SRI67000078" [ref=e510]
            - cell "15-07-2026 09:55" [ref=e511]:
              - text: 15-07-2026
              - text: 09:55
            - cell "FAIZUDDIN AUTO TEST" [ref=e512]
            - cell "-" [ref=e513]
            - cell "-" [ref=e514]
            - cell "-" [ref=e515]
            - cell "1" [ref=e516]
            - cell "31-07-2026" [ref=e517]
            - cell "10am - 12pm" [ref=e518]:
              - text: 10am -
              - text: 12pm
            - cell "-" [ref=e519]
            - cell "-" [ref=e520]
            - cell "-" [ref=e521]
            - cell "Pending" [ref=e522]
            - cell "-" [ref=e523]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e524]
            - cell "No" [ref=e525]
            - cell "View | Cancel" [ref=e526]:
              - link "View" [ref=e527] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=7788d68f-2226-4070-addf-51289162e9f8&apptId=50987b5b-fbc1-4382-9b37-885d5465344d
              - text: "|"
              - link "Cancel" [ref=e528] [cursor=pointer]:
                - /url: "#"
          - row "22 SRI67000077 15-07-2026 09:55 FAIZUDDIN AUTO TEST - - - 1 21-07-2026 2pm - 4pm - - - Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e529]:
            - cell "22" [ref=e530]
            - cell "SRI67000077" [ref=e531]
            - cell "15-07-2026 09:55" [ref=e532]:
              - text: 15-07-2026
              - text: 09:55
            - cell "FAIZUDDIN AUTO TEST" [ref=e533]
            - cell "-" [ref=e534]
            - cell "-" [ref=e535]
            - cell "-" [ref=e536]
            - cell "1" [ref=e537]
            - cell "21-07-2026" [ref=e538]
            - cell "2pm - 4pm" [ref=e539]:
              - text: 2pm -
              - text: 4pm
            - cell "-" [ref=e540]
            - cell "-" [ref=e541]
            - cell "-" [ref=e542]
            - cell "Pending" [ref=e543]
            - cell "-" [ref=e544]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e545]
            - cell "No" [ref=e546]
            - cell "View | Cancel" [ref=e547]:
              - link "View" [ref=e548] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=f7d8acc9-67d4-465b-b251-55d107a3de0d&apptId=4498dd8e-56e9-4afb-8e75-3a01134ebb70
              - text: "|"
              - link "Cancel" [ref=e549] [cursor=pointer]:
                - /url: "#"
          - row "23 SRI67000076 15-07-2026 09:54 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 10am - 12pm - - - Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e550]:
            - cell "23" [ref=e551]
            - cell "SRI67000076" [ref=e552]
            - cell "15-07-2026 09:54" [ref=e553]:
              - text: 15-07-2026
              - text: 09:54
            - cell "FAIZUDDIN AUTO TEST" [ref=e554]
            - cell "-" [ref=e555]
            - cell "-" [ref=e556]
            - cell "-" [ref=e557]
            - cell "1" [ref=e558]
            - cell "31-07-2026" [ref=e559]
            - cell "10am - 12pm" [ref=e560]:
              - text: 10am -
              - text: 12pm
            - cell "-" [ref=e561]
            - cell "-" [ref=e562]
            - cell "-" [ref=e563]
            - cell "Pending" [ref=e564]
            - cell "-" [ref=e565]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e566]
            - cell "No" [ref=e567]
            - cell "View | Cancel" [ref=e568]:
              - link "View" [ref=e569] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=c571455a-a09c-4244-87f5-87715c8c6f68&apptId=9f749f8a-f36b-4580-809f-261c31769a61
              - text: "|"
              - link "Cancel" [ref=e570] [cursor=pointer]:
                - /url: "#"
          - row "24 SRB67000075 15-07-2026 09:54 FAIZUDDIN AUTO TEST 030311-A 2 - 1 20-07-2026 2pm - 4pm OK OK New Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e571]:
            - cell "24" [ref=e572]
            - cell "SRB67000075" [ref=e573]
            - cell "15-07-2026 09:54" [ref=e574]:
              - text: 15-07-2026
              - text: 09:54
            - cell "FAIZUDDIN AUTO TEST" [ref=e575]
            - cell "030311-A" [ref=e576]
            - cell "2" [ref=e577]
            - cell "-" [ref=e578]
            - cell "1" [ref=e579]
            - cell "20-07-2026" [ref=e580]
            - cell "2pm - 4pm" [ref=e581]:
              - text: 2pm -
              - text: 4pm
            - cell "OK" [ref=e582]
            - cell "OK" [ref=e583]
            - cell "New" [ref=e584]
            - cell "Pending" [ref=e585]
            - cell "-" [ref=e586]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e587]
            - cell "No" [ref=e588]
            - cell "View | Cancel" [ref=e589]:
              - link "View" [ref=e590] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=cc356263-dd12-4178-9b1c-ddfae54434a4&apptId=857d8ba9-ad3b-48bb-9085-e1e52dacf3d6
              - text: "|"
              - link "Cancel" [ref=e591] [cursor=pointer]:
                - /url: "#"
          - row "25 SRI67000074 15-07-2026 09:54 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 2pm - 4pm - - - Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e592]:
            - cell "25" [ref=e593]
            - cell "SRI67000074" [ref=e594]
            - cell "15-07-2026 09:54" [ref=e595]:
              - text: 15-07-2026
              - text: 09:54
            - cell "FAIZUDDIN AUTO TEST" [ref=e596]
            - cell "-" [ref=e597]
            - cell "-" [ref=e598]
            - cell "-" [ref=e599]
            - cell "1" [ref=e600]
            - cell "31-07-2026" [ref=e601]
            - cell "2pm - 4pm" [ref=e602]:
              - text: 2pm -
              - text: 4pm
            - cell "-" [ref=e603]
            - cell "-" [ref=e604]
            - cell "-" [ref=e605]
            - cell "Pending" [ref=e606]
            - cell "-" [ref=e607]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e608]
            - cell "No" [ref=e609]
            - cell "View | Cancel" [ref=e610]:
              - link "View" [ref=e611] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=e39de4c1-4734-457b-beb9-428594040090&apptId=1635cd73-8e94-48ab-80cb-3153eeae487a
              - text: "|"
              - link "Cancel" [ref=e612] [cursor=pointer]:
                - /url: "#"
          - row "26 SRB67000073 15-07-2026 09:54 FAIZUDDIN AUTO TEST 030311-A 2 - 1 20-07-2026 2pm - 4pm OK OK New Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e613]:
            - cell "26" [ref=e614]
            - cell "SRB67000073" [ref=e615]
            - cell "15-07-2026 09:54" [ref=e616]:
              - text: 15-07-2026
              - text: 09:54
            - cell "FAIZUDDIN AUTO TEST" [ref=e617]
            - cell "030311-A" [ref=e618]
            - cell "2" [ref=e619]
            - cell "-" [ref=e620]
            - cell "1" [ref=e621]
            - cell "20-07-2026" [ref=e622]
            - cell "2pm - 4pm" [ref=e623]:
              - text: 2pm -
              - text: 4pm
            - cell "OK" [ref=e624]
            - cell "OK" [ref=e625]
            - cell "New" [ref=e626]
            - cell "Pending" [ref=e627]
            - cell "-" [ref=e628]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e629]
            - cell "No" [ref=e630]
            - cell "View | Cancel" [ref=e631]:
              - link "View" [ref=e632] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=0c7a6d67-e8d5-4937-8f65-d7616646e656&apptId=70957801-bada-42f7-8ccb-278e2470faea
              - text: "|"
              - link "Cancel" [ref=e633] [cursor=pointer]:
                - /url: "#"
          - row "27 SRI67000072 15-07-2026 09:54 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 10am - 12pm - - - Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e634]:
            - cell "27" [ref=e635]
            - cell "SRI67000072" [ref=e636]
            - cell "15-07-2026 09:54" [ref=e637]:
              - text: 15-07-2026
              - text: 09:54
            - cell "FAIZUDDIN AUTO TEST" [ref=e638]
            - cell "-" [ref=e639]
            - cell "-" [ref=e640]
            - cell "-" [ref=e641]
            - cell "1" [ref=e642]
            - cell "31-07-2026" [ref=e643]
            - cell "10am - 12pm" [ref=e644]:
              - text: 10am -
              - text: 12pm
            - cell "-" [ref=e645]
            - cell "-" [ref=e646]
            - cell "-" [ref=e647]
            - cell "Pending" [ref=e648]
            - cell "-" [ref=e649]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e650]
            - cell "No" [ref=e651]
            - cell "View | Cancel" [ref=e652]:
              - link "View" [ref=e653] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=e09c55e3-3155-4ff3-abf2-1128e70e3e49&apptId=00bd0e88-9879-4ad5-9c89-c0b3be768c71
              - text: "|"
              - link "Cancel" [ref=e654] [cursor=pointer]:
                - /url: "#"
          - row "28 SRI67000071 15-07-2026 09:54 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 2pm - 4pm - - - Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e655]:
            - cell "28" [ref=e656]
            - cell "SRI67000071" [ref=e657]
            - cell "15-07-2026 09:54" [ref=e658]:
              - text: 15-07-2026
              - text: 09:54
            - cell "FAIZUDDIN AUTO TEST" [ref=e659]
            - cell "-" [ref=e660]
            - cell "-" [ref=e661]
            - cell "-" [ref=e662]
            - cell "1" [ref=e663]
            - cell "31-07-2026" [ref=e664]
            - cell "2pm - 4pm" [ref=e665]:
              - text: 2pm -
              - text: 4pm
            - cell "-" [ref=e666]
            - cell "-" [ref=e667]
            - cell "-" [ref=e668]
            - cell "Pending" [ref=e669]
            - cell "-" [ref=e670]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e671]
            - cell "No" [ref=e672]
            - cell "View | Cancel" [ref=e673]:
              - link "View" [ref=e674] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=6a8fa647-520d-4a1c-85ab-17925a4c3bcf&apptId=0b217969-a73b-4c8c-8564-f94b436797ec
              - text: "|"
              - link "Cancel" [ref=e675] [cursor=pointer]:
                - /url: "#"
          - row "29 SRI67000070 15-07-2026 09:53 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 10am - 12pm - - - Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e676]:
            - cell "29" [ref=e677]
            - cell "SRI67000070" [ref=e678]
            - cell "15-07-2026 09:53" [ref=e679]:
              - text: 15-07-2026
              - text: 09:53
            - cell "FAIZUDDIN AUTO TEST" [ref=e680]
            - cell "-" [ref=e681]
            - cell "-" [ref=e682]
            - cell "-" [ref=e683]
            - cell "1" [ref=e684]
            - cell "31-07-2026" [ref=e685]
            - cell "10am - 12pm" [ref=e686]:
              - text: 10am -
              - text: 12pm
            - cell "-" [ref=e687]
            - cell "-" [ref=e688]
            - cell "-" [ref=e689]
            - cell "Pending" [ref=e690]
            - cell "-" [ref=e691]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e692]
            - cell "No" [ref=e693]
            - cell "View | Cancel" [ref=e694]:
              - link "View" [ref=e695] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=d2c475be-c32f-4bf2-9653-3deca826a420&apptId=3570febf-6d7b-40c9-bb33-dc2008d6dc93
              - text: "|"
              - link "Cancel" [ref=e696] [cursor=pointer]:
                - /url: "#"
          - row "30 SRI67000069 15-07-2026 09:53 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 10am - 12pm - - - Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e697]:
            - cell "30" [ref=e698]
            - cell "SRI67000069" [ref=e699]
            - cell "15-07-2026 09:53" [ref=e700]:
              - text: 15-07-2026
              - text: 09:53
            - cell "FAIZUDDIN AUTO TEST" [ref=e701]
            - cell "-" [ref=e702]
            - cell "-" [ref=e703]
            - cell "-" [ref=e704]
            - cell "1" [ref=e705]
            - cell "31-07-2026" [ref=e706]
            - cell "10am - 12pm" [ref=e707]:
              - text: 10am -
              - text: 12pm
            - cell "-" [ref=e708]
            - cell "-" [ref=e709]
            - cell "-" [ref=e710]
            - cell "Pending" [ref=e711]
            - cell "-" [ref=e712]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e713]
            - cell "No" [ref=e714]
            - cell "View | Cancel" [ref=e715]:
              - link "View" [ref=e716] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=88036092-f05e-4ab9-a7ba-adafb99409e6&apptId=0834408f-dd03-430b-936c-96719c6a28f3
              - text: "|"
              - link "Cancel" [ref=e717] [cursor=pointer]:
                - /url: "#"
          - row "31 SRI67000068 15-07-2026 09:53 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 10am - 12pm - - - Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e718]:
            - cell "31" [ref=e719]
            - cell "SRI67000068" [ref=e720]
            - cell "15-07-2026 09:53" [ref=e721]:
              - text: 15-07-2026
              - text: 09:53
            - cell "FAIZUDDIN AUTO TEST" [ref=e722]
            - cell "-" [ref=e723]
            - cell "-" [ref=e724]
            - cell "-" [ref=e725]
            - cell "1" [ref=e726]
            - cell "31-07-2026" [ref=e727]
            - cell "10am - 12pm" [ref=e728]:
              - text: 10am -
              - text: 12pm
            - cell "-" [ref=e729]
            - cell "-" [ref=e730]
            - cell "-" [ref=e731]
            - cell "Pending" [ref=e732]
            - cell "-" [ref=e733]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e734]
            - cell "No" [ref=e735]
            - cell "View | Cancel" [ref=e736]:
              - link "View" [ref=e737] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=0d268fb9-088f-461b-a908-bff45bcab218&apptId=f225e6b3-ce36-4858-a12d-e2457f4aec77
              - text: "|"
              - link "Cancel" [ref=e738] [cursor=pointer]:
                - /url: "#"
          - row "32 SRB67000044 14-07-2026 23:55 FAIZUDDIN AUTO TEST 030311-A 2 - 1 15-07-2026 2pm - 4pm OK OK New Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e739]:
            - cell "32" [ref=e740]
            - cell "SRB67000044" [ref=e741]
            - cell "14-07-2026 23:55" [ref=e742]:
              - text: 14-07-2026
              - text: 23:55
            - cell "FAIZUDDIN AUTO TEST" [ref=e743]
            - cell "030311-A" [ref=e744]
            - cell "2" [ref=e745]
            - cell "-" [ref=e746]
            - cell "1" [ref=e747]
            - cell "15-07-2026" [ref=e748]
            - cell "2pm - 4pm" [ref=e749]:
              - text: 2pm -
              - text: 4pm
            - cell "OK" [ref=e750]
            - cell "OK" [ref=e751]
            - cell "New" [ref=e752]
            - cell "Pending" [ref=e753]
            - cell "-" [ref=e754]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e755]
            - cell "No" [ref=e756]
            - cell "View | Cancel" [ref=e757]:
              - link "View" [ref=e758] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=6bb18f21-c4d2-48de-bc9a-52a7617c1c71&apptId=c9edfce0-daab-4982-8afe-b9d2a213a10d
              - text: "|"
              - link "Cancel" [ref=e759] [cursor=pointer]:
                - /url: "#"
          - row "33 SRB67000041 14-07-2026 23:55 FAIZUDDIN AUTO TEST 030311-A 2 - 1 15-07-2026 2pm - 4pm OK OK New Pending - Split into 1 appointments, 1 unit(s) No View | Cancel" [ref=e760]:
            - cell "33" [ref=e761]
            - cell "SRB67000041" [ref=e762]
            - cell "14-07-2026 23:55" [ref=e763]:
              - text: 14-07-2026
              - text: 23:55
            - cell "FAIZUDDIN AUTO TEST" [ref=e764]
            - cell "030311-A" [ref=e765]
            - cell "2" [ref=e766]
            - cell "-" [ref=e767]
            - cell "1" [ref=e768]
            - cell "15-07-2026" [ref=e769]
            - cell "2pm - 4pm" [ref=e770]:
              - text: 2pm -
              - text: 4pm
            - cell "OK" [ref=e771]
            - cell "OK" [ref=e772]
            - cell "New" [ref=e773]
            - cell "Pending" [ref=e774]
            - cell "-" [ref=e775]
            - cell "Split into 1 appointments, 1 unit(s)" [ref=e776]
            - cell "No" [ref=e777]
            - cell "View | Cancel" [ref=e778]:
              - link "View" [ref=e779] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=9b0d12be-c232-48b6-a3fa-5831cf1c202e&apptId=f64b0d45-339c-496c-8b31-ef470bdfb813
              - text: "|"
              - link "Cancel" [ref=e780] [cursor=pointer]:
                - /url: "#"
          - row "34 SRI67000040 14-07-2026 23:50 FAIZUDDIN AUTO TEST 030311-A - - 1 31-07-2026 2pm - 4pm OK OK - Pending - Split into 1 appointments, 2 unit(s) No View | Cancel" [ref=e781]:
            - cell "34" [ref=e782]
            - cell "SRI67000040" [ref=e783]
            - cell "14-07-2026 23:50" [ref=e784]:
              - text: 14-07-2026
              - text: 23:50
            - cell "FAIZUDDIN AUTO TEST" [ref=e785]
            - cell "030311-A" [ref=e786]
            - cell "-" [ref=e787]
            - cell "-" [ref=e788]
            - cell "1" [ref=e789]
            - cell "31-07-2026" [ref=e790]
            - cell "2pm - 4pm" [ref=e791]:
              - text: 2pm -
              - text: 4pm
            - cell "OK" [ref=e792]
            - cell "OK" [ref=e793]
            - cell "-" [ref=e794]
            - cell "Pending" [ref=e795]
            - cell "-" [ref=e796]
            - cell "Split into 1 appointments, 2 unit(s)" [ref=e797]
            - cell "No" [ref=e798]
            - cell "View | Cancel" [ref=e799]:
              - link "View" [ref=e800] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=4f7ad03f-7dab-43b7-9689-cafee79dc4ee&apptId=6a9fcba2-06fc-4b7f-b63f-a26eaf87669a
              - text: "|"
              - link "Cancel" [ref=e801] [cursor=pointer]:
                - /url: "#"
          - row "35 SRI67000040 14-07-2026 23:50 FAIZUDDIN AUTO TEST 030311-A - - 1 31-07-2026 2pm - 4pm OK OK - Pending - Split into 1 appointments, 2 unit(s) No View | Cancel" [ref=e802]:
            - cell "35" [ref=e803]
            - cell "SRI67000040" [ref=e804]
            - cell "14-07-2026 23:50" [ref=e805]:
              - text: 14-07-2026
              - text: 23:50
            - cell "FAIZUDDIN AUTO TEST" [ref=e806]
            - cell "030311-A" [ref=e807]
            - cell "-" [ref=e808]
            - cell "-" [ref=e809]
            - cell "1" [ref=e810]
            - cell "31-07-2026" [ref=e811]
            - cell "2pm - 4pm" [ref=e812]:
              - text: 2pm -
              - text: 4pm
            - cell "OK" [ref=e813]
            - cell "OK" [ref=e814]
            - cell "-" [ref=e815]
            - cell "Pending" [ref=e816]
            - cell "-" [ref=e817]
            - cell "Split into 1 appointments, 2 unit(s)" [ref=e818]
            - cell "No" [ref=e819]
            - cell "View | Cancel" [ref=e820]:
              - link "View" [ref=e821] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=4f7ad03f-7dab-43b7-9689-cafee79dc4ee&apptId=b45016e3-6346-4053-af57-c5dc7dcb4dde
              - text: "|"
              - link "Cancel" [ref=e822] [cursor=pointer]:
                - /url: "#"
          - row "36 SRI67000039 14-07-2026 23:46 FAIZUDDIN AUTO TEST 030311-A - - 1 31-07-2026 10am - 12pm OK OK - Pending - Split into 1 appointments, 2 unit(s) No View | Cancel" [ref=e823]:
            - cell "36" [ref=e824]
            - cell "SRI67000039" [ref=e825]
            - cell "14-07-2026 23:46" [ref=e826]:
              - text: 14-07-2026
              - text: 23:46
            - cell "FAIZUDDIN AUTO TEST" [ref=e827]
            - cell "030311-A" [ref=e828]
            - cell "-" [ref=e829]
            - cell "-" [ref=e830]
            - cell "1" [ref=e831]
            - cell "31-07-2026" [ref=e832]
            - cell "10am - 12pm" [ref=e833]:
              - text: 10am -
              - text: 12pm
            - cell "OK" [ref=e834]
            - cell "OK" [ref=e835]
            - cell "-" [ref=e836]
            - cell "Pending" [ref=e837]
            - cell "-" [ref=e838]
            - cell "Split into 1 appointments, 2 unit(s)" [ref=e839]
            - cell "No" [ref=e840]
            - cell "View | Cancel" [ref=e841]:
              - link "View" [ref=e842] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=6d8c6657-fa7b-4d19-b7f5-3c74c0791999&apptId=0b915fd9-7ec2-477a-97ce-1533e7256a41
              - text: "|"
              - link "Cancel" [ref=e843] [cursor=pointer]:
                - /url: "#"
          - row "37 SRI67000039 14-07-2026 23:46 FAIZUDDIN AUTO TEST 030311-A - - 1 31-07-2026 10am - 12pm OK OK - Pending - Split into 1 appointments, 2 unit(s) No View | Cancel" [ref=e844]:
            - cell "37" [ref=e845]
            - cell "SRI67000039" [ref=e846]
            - cell "14-07-2026 23:46" [ref=e847]:
              - text: 14-07-2026
              - text: 23:46
            - cell "FAIZUDDIN AUTO TEST" [ref=e848]
            - cell "030311-A" [ref=e849]
            - cell "-" [ref=e850]
            - cell "-" [ref=e851]
            - cell "1" [ref=e852]
            - cell "31-07-2026" [ref=e853]
            - cell "10am - 12pm" [ref=e854]:
              - text: 10am -
              - text: 12pm
            - cell "OK" [ref=e855]
            - cell "OK" [ref=e856]
            - cell "-" [ref=e857]
            - cell "Pending" [ref=e858]
            - cell "-" [ref=e859]
            - cell "Split into 1 appointments, 2 unit(s)" [ref=e860]
            - cell "No" [ref=e861]
            - cell "View | Cancel" [ref=e862]:
              - link "View" [ref=e863] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=6d8c6657-fa7b-4d19-b7f5-3c74c0791999&apptId=a6e511ad-9abf-4ecb-9895-f9286bb43dd9
              - text: "|"
              - link "Cancel" [ref=e864] [cursor=pointer]:
                - /url: "#"
          - row "38 SRI67000019 14-07-2026 17:32 FAIZUDDIN AUTO TEST - - - 1 16-07-2026 10am - 12pm - - - Cancelled - CANCELLED BY jasons on 14-07-2026 18:02 No View" [ref=e865]:
            - cell "38" [ref=e866]
            - cell "SRI67000019" [ref=e867]
            - cell "14-07-2026 17:32" [ref=e868]:
              - text: 14-07-2026
              - text: 17:32
            - cell "FAIZUDDIN AUTO TEST" [ref=e869]
            - cell "-" [ref=e870]
            - cell "-" [ref=e871]
            - cell "-" [ref=e872]
            - cell "1" [ref=e873]
            - cell "16-07-2026" [ref=e874]
            - cell "10am - 12pm" [ref=e875]:
              - text: 10am -
              - text: 12pm
            - cell "-" [ref=e876]
            - cell "-" [ref=e877]
            - cell "-" [ref=e878]
            - cell "Cancelled" [ref=e879]
            - cell "-" [ref=e880]
            - cell "CANCELLED BY jasons on 14-07-2026 18:02" [ref=e881]
            - cell "No" [ref=e882]
            - cell "View" [ref=e883]:
              - link "View" [ref=e884] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=65816c8c-1bb3-45d5-af28-584df996b491&apptId=c5f0e8e2-89c0-47a1-859c-e199d07fb7ee
          - row "39 SRI67000002 14-07-2026 16:00 FAIZUDDIN AUTO TEST 030311-A - - 1 16-07-2026 10am - 12pm OK OK - Pending - Split into 2 appointments, 4 unit(s) No View | Cancel" [ref=e885]:
            - cell "39" [ref=e886]
            - cell "SRI67000002" [ref=e887]
            - cell "14-07-2026 16:00" [ref=e888]:
              - text: 14-07-2026
              - text: 16:00
            - cell "FAIZUDDIN AUTO TEST" [ref=e889]
            - cell "030311-A" [ref=e890]
            - cell "-" [ref=e891]
            - cell "-" [ref=e892]
            - cell "1" [ref=e893]
            - cell "16-07-2026" [ref=e894]
            - cell "10am - 12pm" [ref=e895]:
              - text: 10am -
              - text: 12pm
            - cell "OK" [ref=e896]
            - cell "OK" [ref=e897]
            - cell "-" [ref=e898]
            - cell "Pending" [ref=e899]
            - cell "-" [ref=e900]
            - cell "Split into 2 appointments, 4 unit(s)" [ref=e901]
            - cell "No" [ref=e902]
            - cell "View | Cancel" [ref=e903]:
              - link "View" [ref=e904] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=1e0382e0-4979-4155-a385-c7eca43e86e7&apptId=1b0999f2-cce2-43a0-a541-576eef8578d9
              - text: "|"
              - link "Cancel" [ref=e905] [cursor=pointer]:
                - /url: "#"
          - row "40 SRI67000002 14-07-2026 16:00 FAIZUDDIN AUTO TEST 030311-A - - 1 16-07-2026 10am - 12pm OK OK - Pending - Split into 2 appointments, 4 unit(s) No View | Cancel" [ref=e906]:
            - cell "40" [ref=e907]
            - cell "SRI67000002" [ref=e908]
            - cell "14-07-2026 16:00" [ref=e909]:
              - text: 14-07-2026
              - text: 16:00
            - cell "FAIZUDDIN AUTO TEST" [ref=e910]
            - cell "030311-A" [ref=e911]
            - cell "-" [ref=e912]
            - cell "-" [ref=e913]
            - cell "1" [ref=e914]
            - cell "16-07-2026" [ref=e915]
            - cell "10am - 12pm" [ref=e916]:
              - text: 10am -
              - text: 12pm
            - cell "OK" [ref=e917]
            - cell "OK" [ref=e918]
            - cell "-" [ref=e919]
            - cell "Pending" [ref=e920]
            - cell "-" [ref=e921]
            - cell "Split into 2 appointments, 4 unit(s)" [ref=e922]
            - cell "No" [ref=e923]
            - cell "View | Cancel" [ref=e924]:
              - link "View" [ref=e925] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=1e0382e0-4979-4155-a385-c7eca43e86e7&apptId=6284d334-5e9f-4b64-bc40-1ebd36a2bbd9
              - text: "|"
              - link "Cancel" [ref=e926] [cursor=pointer]:
                - /url: "#"
          - row "41 SRI67000002 14-07-2026 16:00 FAIZUDDIN AUTO TEST 030311-A - - 1 16-07-2026 10am - 12pm OK OK - Pending - Split into 2 appointments, 4 unit(s) No View | Cancel" [ref=e927]:
            - cell "41" [ref=e928]
            - cell "SRI67000002" [ref=e929]
            - cell "14-07-2026 16:00" [ref=e930]:
              - text: 14-07-2026
              - text: 16:00
            - cell "FAIZUDDIN AUTO TEST" [ref=e931]
            - cell "030311-A" [ref=e932]
            - cell "-" [ref=e933]
            - cell "-" [ref=e934]
            - cell "1" [ref=e935]
            - cell "16-07-2026" [ref=e936]
            - cell "10am - 12pm" [ref=e937]:
              - text: 10am -
              - text: 12pm
            - cell "OK" [ref=e938]
            - cell "OK" [ref=e939]
            - cell "-" [ref=e940]
            - cell "Pending" [ref=e941]
            - cell "-" [ref=e942]
            - cell "Split into 2 appointments, 4 unit(s)" [ref=e943]
            - cell "No" [ref=e944]
            - cell "View | Cancel" [ref=e945]:
              - link "View" [ref=e946] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=1e0382e0-4979-4155-a385-c7eca43e86e7&apptId=8224c4e1-6046-4f0d-982c-2c3f0c1100e8
              - text: "|"
              - link "Cancel" [ref=e947] [cursor=pointer]:
                - /url: "#"
          - row "42 SRI67000002 14-07-2026 16:00 FAIZUDDIN AUTO TEST 030311-A - - 1 31-07-2026 10am - 12pm OK OK - Pending - Split into 2 appointments, 4 unit(s) No View | Cancel" [ref=e948]:
            - cell "42" [ref=e949]
            - cell "SRI67000002" [ref=e950]
            - cell "14-07-2026 16:00" [ref=e951]:
              - text: 14-07-2026
              - text: 16:00
            - cell "FAIZUDDIN AUTO TEST" [ref=e952]
            - cell "030311-A" [ref=e953]
            - cell "-" [ref=e954]
            - cell "-" [ref=e955]
            - cell "1" [ref=e956]
            - cell "31-07-2026" [ref=e957]
            - cell "10am - 12pm" [ref=e958]:
              - text: 10am -
              - text: 12pm
            - cell "OK" [ref=e959]
            - cell "OK" [ref=e960]
            - cell "-" [ref=e961]
            - cell "Pending" [ref=e962]
            - cell "-" [ref=e963]
            - cell "Split into 2 appointments, 4 unit(s)" [ref=e964]
            - cell "No" [ref=e965]
            - cell "View | Cancel" [ref=e966]:
              - link "View" [ref=e967] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=1e0382e0-4979-4155-a385-c7eca43e86e7&apptId=eca30a06-e92b-4529-94f6-3565793f7bcc
              - text: "|"
              - link "Cancel" [ref=e968] [cursor=pointer]:
                - /url: "#"
          - row "43 SRI67000001 14-07-2026 16:00 FAIZUDDIN AUTO TEST 030311-A - - 1 16-07-2026 10am - 12pm OK OK - Pending - Split into 2 appointments, 2 unit(s) No View | Cancel" [ref=e969]:
            - cell "43" [ref=e970]
            - cell "SRI67000001" [ref=e971]
            - cell "14-07-2026 16:00" [ref=e972]:
              - text: 14-07-2026
              - text: 16:00
            - cell "FAIZUDDIN AUTO TEST" [ref=e973]
            - cell "030311-A" [ref=e974]
            - cell "-" [ref=e975]
            - cell "-" [ref=e976]
            - cell "1" [ref=e977]
            - cell "16-07-2026" [ref=e978]
            - cell "10am - 12pm" [ref=e979]:
              - text: 10am -
              - text: 12pm
            - cell "OK" [ref=e980]
            - cell "OK" [ref=e981]
            - cell "-" [ref=e982]
            - cell "Pending" [ref=e983]
            - cell "-" [ref=e984]
            - cell "Split into 2 appointments, 2 unit(s)" [ref=e985]
            - cell "No" [ref=e986]
            - cell "View | Cancel" [ref=e987]:
              - link "View" [ref=e988] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=32608312-3548-4908-bdc1-9faf86f49018&apptId=1b4f6254-b072-4ef2-8476-8a23a525f8af
              - text: "|"
              - link "Cancel" [ref=e989] [cursor=pointer]:
                - /url: "#"
          - row "44 SRI67000001 14-07-2026 16:00 FAIZUDDIN AUTO TEST 030311-A - - 1 31-07-2026 2pm - 4pm OK OK - Pending - Split into 2 appointments, 2 unit(s) No View | Cancel" [ref=e990]:
            - cell "44" [ref=e991]
            - cell "SRI67000001" [ref=e992]
            - cell "14-07-2026 16:00" [ref=e993]:
              - text: 14-07-2026
              - text: 16:00
            - cell "FAIZUDDIN AUTO TEST" [ref=e994]
            - cell "030311-A" [ref=e995]
            - cell "-" [ref=e996]
            - cell "-" [ref=e997]
            - cell "1" [ref=e998]
            - cell "31-07-2026" [ref=e999]
            - cell "2pm - 4pm" [ref=e1000]:
              - text: 2pm -
              - text: 4pm
            - cell "OK" [ref=e1001]
            - cell "OK" [ref=e1002]
            - cell "-" [ref=e1003]
            - cell "Pending" [ref=e1004]
            - cell "-" [ref=e1005]
            - cell "Split into 2 appointments, 2 unit(s)" [ref=e1006]
            - cell "No" [ref=e1007]
            - cell "View | Cancel" [ref=e1008]:
              - link "View" [ref=e1009] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=32608312-3548-4908-bdc1-9faf86f49018&apptId=b51d9eaf-a3df-4723-90f5-436cd5b65a66
              - text: "|"
              - link "Cancel" [ref=e1010] [cursor=pointer]:
                - /url: "#"
  - table [ref=e1012]:
    - rowgroup [ref=e1013]:
      - row "Home | Menu 2 Pending Transaction Found! Jason Seah, My Account | Logout" [ref=e1014]:
        - cell "Home | Menu 2 Pending Transaction Found!" [ref=e1015]:
          - generic [ref=e1016]:
            - list [ref=e1017]:
              - listitem [ref=e1018]:
                - link "Home |" [ref=e1019] [cursor=pointer]:
                  - /url: /uat1/home/
              - listitem [ref=e1020]:
                - link "Menu" [ref=e1021] [cursor=pointer]:
                  - /url: "#"
                  - text: Menu
                  - img [ref=e1022]
            - generic [ref=e1023] [cursor=pointer]: 2 Pending Transaction Found!
        - cell "Jason Seah, My Account | Logout" [ref=e1024]:
          - list [ref=e1026]:
            - listitem [ref=e1027]: Jason Seah,
            - listitem [ref=e1028]:
              - link "My Account |" [ref=e1029] [cursor=pointer]:
                - /url: /uat1/view/ucd/my-account/view.do?type=Office
            - listitem [ref=e1030]:
              - link "Logout" [ref=e1031] [cursor=pointer]:
                - /url: "#"
  - img [ref=e1033]
  - table [ref=e1035]:
    - rowgroup [ref=e1036]:
      - row "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e1037]:
        - cell [ref=e1038]
        - cell "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e1039]:
          - text: Best Compatible With Mozilla Firefox V36.0.4
          - text: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
          - link "Contact Us" [ref=e1040] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Terms & Conditions" [ref=e1041] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Privacy" [ref=e1042] [cursor=pointer]:
            - /url: "#"
        - cell [ref=e1043]:
          - img [ref=e1044]
  - generic [ref=e1045]:
    - generic [ref=e1046]:
      - generic "Prev" [ref=e1047]:
        - generic [ref=e1048]: Prev
      - generic "Next" [ref=e1049]:
        - generic [ref=e1050]: Next
      - generic:
        - combobox [ref=e1051]:
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
        - combobox [ref=e1052]:
          - option "2016"
          - option "2017"
          - option "2018"
          - option "2019"
          - option "2020"
          - option "2021"
          - option "2022"
          - option "2023"
          - option "2024"
          - option "2025"
          - option "2026" [selected]
    - table [ref=e1053]:
      - rowgroup [ref=e1054]:
        - row "Su Mo Tu We Th Fr Sa" [ref=e1055]:
          - columnheader "Su" [ref=e1056]
          - columnheader "Mo" [ref=e1057]
          - columnheader "Tu" [ref=e1058]
          - columnheader "We" [ref=e1059]
          - columnheader "Th" [ref=e1060]
          - columnheader "Fr" [ref=e1061]
          - columnheader "Sa" [ref=e1062]
      - rowgroup [ref=e1063]:
        - row "1 2 3 4" [ref=e1064]:
          - cell [ref=e1065]
          - cell [ref=e1066]
          - cell [ref=e1067]
          - cell "1" [ref=e1068]:
            - link "1" [ref=e1069] [cursor=pointer]:
              - /url: "#"
          - cell "2" [ref=e1070]:
            - link "2" [ref=e1071] [cursor=pointer]:
              - /url: "#"
          - cell "3" [ref=e1072]:
            - link "3" [ref=e1073] [cursor=pointer]:
              - /url: "#"
          - cell "4" [ref=e1074]:
            - link "4" [ref=e1075] [cursor=pointer]:
              - /url: "#"
        - row "5 6 7 8 9 10 11" [ref=e1076]:
          - cell "5" [ref=e1077]:
            - link "5" [ref=e1078] [cursor=pointer]:
              - /url: "#"
          - cell "6" [ref=e1079]:
            - link "6" [ref=e1080] [cursor=pointer]:
              - /url: "#"
          - cell "7" [ref=e1081]:
            - link "7" [ref=e1082] [cursor=pointer]:
              - /url: "#"
          - cell "8" [ref=e1083]:
            - link "8" [ref=e1084] [cursor=pointer]:
              - /url: "#"
          - cell "9" [ref=e1085]:
            - link "9" [ref=e1086] [cursor=pointer]:
              - /url: "#"
          - cell "10" [ref=e1087]:
            - link "10" [ref=e1088] [cursor=pointer]:
              - /url: "#"
          - cell "11" [ref=e1089]:
            - link "11" [ref=e1090] [cursor=pointer]:
              - /url: "#"
        - row "12 13 14 15 16 17 18" [ref=e1091]:
          - cell "12" [ref=e1092]:
            - link "12" [ref=e1093] [cursor=pointer]:
              - /url: "#"
          - cell "13" [ref=e1094]:
            - link "13" [ref=e1095] [cursor=pointer]:
              - /url: "#"
          - cell "14" [ref=e1096]:
            - link "14" [ref=e1097] [cursor=pointer]:
              - /url: "#"
          - cell "15" [ref=e1098]:
            - link "15" [ref=e1099] [cursor=pointer]:
              - /url: "#"
          - cell "16" [ref=e1100]:
            - link "16" [ref=e1101] [cursor=pointer]:
              - /url: "#"
          - cell "17" [ref=e1102]:
            - link "17" [ref=e1103] [cursor=pointer]:
              - /url: "#"
          - cell "18" [ref=e1104]:
            - link "18" [ref=e1105] [cursor=pointer]:
              - /url: "#"
        - row "19 20 21 22 23 24 25" [ref=e1106]:
          - cell "19" [ref=e1107]:
            - link "19" [ref=e1108] [cursor=pointer]:
              - /url: "#"
          - cell "20" [ref=e1109]:
            - link "20" [ref=e1110] [cursor=pointer]:
              - /url: "#"
          - cell "21" [ref=e1111]:
            - link "21" [ref=e1112] [cursor=pointer]:
              - /url: "#"
          - cell "22" [ref=e1113]:
            - link "22" [ref=e1114] [cursor=pointer]:
              - /url: "#"
          - cell "23" [ref=e1115]:
            - link "23" [ref=e1116] [cursor=pointer]:
              - /url: "#"
          - cell "24" [ref=e1117]:
            - link "24" [ref=e1118] [cursor=pointer]:
              - /url: "#"
          - cell "25" [ref=e1119]:
            - link "25" [ref=e1120] [cursor=pointer]:
              - /url: "#"
        - row "26 27 28 29 30 31" [ref=e1121]:
          - cell "26" [ref=e1122]:
            - link "26" [ref=e1123] [cursor=pointer]:
              - /url: "#"
          - cell "27" [ref=e1124]:
            - link "27" [ref=e1125] [cursor=pointer]:
              - /url: "#"
          - cell "28" [ref=e1126]:
            - link "28" [ref=e1127] [cursor=pointer]:
              - /url: "#"
          - cell "29" [ref=e1128]:
            - link "29" [ref=e1129] [cursor=pointer]:
              - /url: "#"
          - cell "30" [ref=e1130]:
            - link "30" [ref=e1131] [cursor=pointer]:
              - /url: "#"
          - cell "31" [ref=e1132]:
            - link "31" [ref=e1133] [cursor=pointer]:
              - /url: "#"
          - cell [ref=e1134]
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
  44  |     expect(await boCalendarPage.getSlotCount(booked, MORNING)).toBeGreaterThan(0);
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
> 85  |       expect(ref, "the added appointment should appear in the BO listing").not.toBeNull();
      |                                                                                ^ Error: the added appointment should appear in the BO listing
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
  145 |   });
  146 | 
  147 |   test("BO book Public Holiday", async ({ boCalendarPage }) => {
  148 |     const ph = ENV.publicHoliday;
  149 |     if (!ph) {
  150 |       test.skip(true, "No Public Holiday date provided — key one into the runner's Test data panel.");
  151 |       return;
  152 |     }
  153 |     await boCalendarPage.navigate();
  154 |     const dialog = await boCalendarPage.openAddDialog();
  155 |     await test.step(`Expected: public holiday ${ph} is greyed out / unclickable`, async () => {
  156 |       expect(await boCalendarPage.isAddDateSelectable(ph)).toBe(false);
  157 |     });
  158 |     await boCalendarPage.closeAddDialog(dialog);
  159 |   });
  160 | });
  161 | 
```