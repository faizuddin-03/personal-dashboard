# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: calendar-rules.spec.ts >> Calendar Rules (UCD) >> Book future dates more than 2 months
- Location: tests\service-hub\specs\calendar-rules.spec.ts:62:7

# Error details

```
Error: locator.check: Clicking the checkbox did not change its state
Call log:
  - waiting for locator('.sc-modal').locator('#sc-resched-all')
    - locator resolved to <input type="checkbox" id="sc-resched-all" onclick="scReschedToggleAll(this)"/>
  - attempting click action
    - waiting for element to be visible, enabled and stable
    - element is visible, enabled and stable
    - scrolling into view if needed
    - done scrolling
    - performing click action
    - click action done
    - waiting for scheduled navigations to finish
    - navigations have finished

```

# Page snapshot

```yaml
- generic [ref=e1]:
  - generic [ref=e3]:
    - generic [ref=e4]:
      - link "Home" [ref=e5] [cursor=pointer]:
        - /url: /uat1/view/ucd/
      - generic [ref=e6]: /
      - link "Service Hub" [ref=e7] [cursor=pointer]:
        - /url: /uat1/view/ucd/service-hub/view.do
      - generic [ref=e8]: /
      - generic [ref=e9]: Service Request Listing
    - generic [ref=e11]:
      - heading "Search & Filter" [level=6] [ref=e13]
      - generic [ref=e14]:
        - generic [ref=e15]:
          - generic [ref=e16]:
            - generic [ref=e17]:
              - generic [ref=e19]: "Reference No :"
              - textbox [ref=e20]
            - generic [ref=e21]:
              - generic [ref=e23]: "Service Type :"
              - combobox [ref=e25] [cursor=pointer]:
                - option "All" [selected]
                - option "Biometric Device Purchase"
                - option "Software Installation"
            - generic [ref=e26]:
              - generic [ref=e28]: "Date Requested :"
              - generic [ref=e29]:
                - generic [ref=e30]:
                  - textbox "Date (From)" [ref=e31]
                  - img
                - generic [ref=e32]:
                  - textbox "Date (To)" [ref=e33]
                  - img
          - generic [ref=e35]:
            - generic [ref=e36]:
              - generic [ref=e38]: "Status :"
              - combobox [ref=e40] [cursor=pointer]:
                - option "All" [selected]
                - option "-"
                - option "Pending"
                - option "Completed"
                - option "Failed"
                - option "Cancelled"
                - option "Expired"
            - generic [ref=e41]:
              - generic [ref=e43]: "Payment Date :"
              - generic [ref=e44]:
                - generic [ref=e45]:
                  - textbox "Date (From)" [ref=e46]
                  - img
                - generic [ref=e47]:
                  - textbox "Date (To)" [ref=e48]
                  - img
        - generic [ref=e49]:
          - button "Search Now" [ref=e50]
          - button "Reset" [ref=e51]
    - heading "Service Request Listing" [level=1] [ref=e53]
    - table [ref=e55]:
      - rowgroup [ref=e66]:
        - row "# Reference No Service Type Date Requested Payment Tx Status e-Invoice Status Remarks Action" [ref=e67]:
          - columnheader "#" [ref=e68]
          - columnheader "Reference No" [ref=e69]
          - columnheader "Service Type" [ref=e70]
          - columnheader "Date Requested" [ref=e71]
          - columnheader "Payment" [ref=e72]
          - columnheader "Tx Status" [ref=e73]
          - columnheader "e-Invoice Status" [ref=e74]
          - columnheader "Remarks" [ref=e75]
          - columnheader "Action" [ref=e76]
        - row "1 SR67000138 Biometric Device Purchase 17-07-2026 17:46 OK Pending - View | Reschedule" [ref=e77]:
          - cell "1" [ref=e78]
          - cell "SR67000138" [ref=e79]
          - cell "Biometric Device Purchase" [ref=e80]
          - cell "17-07-2026 17:46" [ref=e81]
          - cell "OK" [ref=e82]
          - cell "Pending" [ref=e83]
          - cell "-" [ref=e84]
          - cell [ref=e85]
          - cell "View | Reschedule" [ref=e86]:
            - link "View" [ref=e87] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?id=c72122cf-0b12-4bc0-bbf1-e03c10d3fe3f
            - text: "|"
            - link "Reschedule" [active] [ref=e88] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/reschedule.do?id=c72122cf-0b12-4bc0-bbf1-e03c10d3fe3f
        - row "2 SR67000137 Biometric Device Purchase 17-07-2026 17:45 OK Pending - View | Reschedule" [ref=e89]:
          - cell "2" [ref=e90]
          - cell "SR67000137" [ref=e91]
          - cell "Biometric Device Purchase" [ref=e92]
          - cell "17-07-2026 17:45" [ref=e93]
          - cell "OK" [ref=e94]
          - cell "Pending" [ref=e95]
          - cell "-" [ref=e96]
          - cell [ref=e97]
          - cell "View | Reschedule" [ref=e98]:
            - link "View" [ref=e99] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?id=5962c285-5f24-43ed-a655-4bb3d78dde00
            - text: "|"
            - link "Reschedule" [ref=e100] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/reschedule.do?id=5962c285-5f24-43ed-a655-4bb3d78dde00
        - row "3 SR67000136 Biometric Device Purchase 17-07-2026 17:45 OK Pending - View | Reschedule" [ref=e101]:
          - cell "3" [ref=e102]
          - cell "SR67000136" [ref=e103]
          - cell "Biometric Device Purchase" [ref=e104]
          - cell "17-07-2026 17:45" [ref=e105]
          - cell "OK" [ref=e106]
          - cell "Pending" [ref=e107]
          - cell "-" [ref=e108]
          - cell [ref=e109]
          - cell "View | Reschedule" [ref=e110]:
            - link "View" [ref=e111] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?id=be0bd446-d1cc-41ce-8ea0-8cf567b73367
            - text: "|"
            - link "Reschedule" [ref=e112] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/reschedule.do?id=be0bd446-d1cc-41ce-8ea0-8cf567b73367
        - row "4 SR67000135 Biometric Device Purchase 17-07-2026 17:44 OK Pending - View | Reschedule" [ref=e113]:
          - cell "4" [ref=e114]
          - cell "SR67000135" [ref=e115]
          - cell "Biometric Device Purchase" [ref=e116]
          - cell "17-07-2026 17:44" [ref=e117]
          - cell "OK" [ref=e118]
          - cell "Pending" [ref=e119]
          - cell "-" [ref=e120]
          - cell [ref=e121]
          - cell "View | Reschedule" [ref=e122]:
            - link "View" [ref=e123] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?id=6fd6feeb-44fe-4d89-9dcd-ede6b9bb1605
            - text: "|"
            - link "Reschedule" [ref=e124] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/reschedule.do?id=6fd6feeb-44fe-4d89-9dcd-ede6b9bb1605
        - row "5 SR67000134 Biometric Device Purchase 17-07-2026 17:44 OK - - View | Resubmit" [ref=e125]:
          - cell "5" [ref=e126]
          - cell "SR67000134" [ref=e127]
          - cell "Biometric Device Purchase" [ref=e128]
          - cell "17-07-2026 17:44" [ref=e129]
          - cell "OK" [ref=e130]
          - cell "-" [ref=e131]
          - cell "-" [ref=e132]
          - cell [ref=e133]
          - cell "View | Resubmit" [ref=e134]:
            - link "View" [ref=e135] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?id=be0c32f4-6642-4773-b2ed-a5a08ef0207e
            - text: "|"
            - link "Resubmit" [ref=e136] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/slot.do?id=be0c32f4-6642-4773-b2ed-a5a08ef0207e
        - row "6 SR67000133 Biometric Device Purchase 17-07-2026 17:43 OK - - View | Resubmit" [ref=e137]:
          - cell "6" [ref=e138]
          - cell "SR67000133" [ref=e139]
          - cell "Biometric Device Purchase" [ref=e140]
          - cell "17-07-2026 17:43" [ref=e141]
          - cell "OK" [ref=e142]
          - cell "-" [ref=e143]
          - cell "-" [ref=e144]
          - cell [ref=e145]
          - cell "View | Resubmit" [ref=e146]:
            - link "View" [ref=e147] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?id=f89eb409-e730-4014-8a1a-4570530bc1b9
            - text: "|"
            - link "Resubmit" [ref=e148] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/slot.do?id=f89eb409-e730-4014-8a1a-4570530bc1b9
        - row "7 SR67000132 Biometric Device Purchase 17-07-2026 17:42 OK Pending - View | Reschedule" [ref=e149]:
          - cell "7" [ref=e150]
          - cell "SR67000132" [ref=e151]
          - cell "Biometric Device Purchase" [ref=e152]
          - cell "17-07-2026 17:42" [ref=e153]
          - cell "OK" [ref=e154]
          - cell "Pending" [ref=e155]
          - cell "-" [ref=e156]
          - cell [ref=e157]
          - cell "View | Reschedule" [ref=e158]:
            - link "View" [ref=e159] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?id=09096c7d-6685-442a-b094-8c48aadc0c7b
            - text: "|"
            - link "Reschedule" [ref=e160] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/reschedule.do?id=09096c7d-6685-442a-b094-8c48aadc0c7b
        - row "8 SR67000131 Biometric Device Purchase 17-07-2026 17:41 OK Pending - View | Reschedule" [ref=e161]:
          - cell "8" [ref=e162]
          - cell "SR67000131" [ref=e163]
          - cell "Biometric Device Purchase" [ref=e164]
          - cell "17-07-2026 17:41" [ref=e165]
          - cell "OK" [ref=e166]
          - cell "Pending" [ref=e167]
          - cell "-" [ref=e168]
          - cell [ref=e169]
          - cell "View | Reschedule" [ref=e170]:
            - link "View" [ref=e171] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?id=89e99ded-661f-43a9-8229-2f06580a2bea
            - text: "|"
            - link "Reschedule" [ref=e172] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/reschedule.do?id=89e99ded-661f-43a9-8229-2f06580a2bea
        - row "9 SR67000130 Biometric Device Purchase 17-07-2026 17:41 OK Pending Failed Submission failed due to unexpected error View | Reschedule" [ref=e173]:
          - cell "9" [ref=e174]
          - cell "SR67000130" [ref=e175]
          - cell "Biometric Device Purchase" [ref=e176]
          - cell "17-07-2026 17:41" [ref=e177]
          - cell "OK" [ref=e178]
          - cell "Pending" [ref=e179]
          - cell "Failed" [ref=e180]
          - cell "Submission failed due to unexpected error" [ref=e181]
          - cell "View | Reschedule" [ref=e182]:
            - link "View" [ref=e183] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?id=b9e4cc0a-3da2-4816-b01f-e33398f3b1df
            - text: "|"
            - link "Reschedule" [ref=e184] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/reschedule.do?id=b9e4cc0a-3da2-4816-b01f-e33398f3b1df
        - row "10 SR67000119 Biometric Device Purchase 17-07-2026 16:55 OK Pending OK View | Resubmit" [ref=e185]:
          - cell "10" [ref=e186]
          - cell "SR67000119" [ref=e187]
          - cell "Biometric Device Purchase" [ref=e188]
          - cell "17-07-2026 16:55" [ref=e189]
          - cell "OK" [ref=e190]
          - cell "Pending" [ref=e191]
          - cell "OK" [ref=e192]
          - cell [ref=e193]
          - cell "View | Resubmit" [ref=e194]:
            - link "View" [ref=e195] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?id=65bec780-a238-4f3f-bd8c-36c0f63ad156
            - text: "|"
            - link "Resubmit" [ref=e196] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/reschedule.do?id=65bec780-a238-4f3f-bd8c-36c0f63ad156
        - row "11 SR67000118 Biometric Device Purchase 17-07-2026 16:55 OK Pending OK View | Reschedule" [ref=e197]:
          - cell "11" [ref=e198]
          - cell "SR67000118" [ref=e199]
          - cell "Biometric Device Purchase" [ref=e200]
          - cell "17-07-2026 16:55" [ref=e201]
          - cell "OK" [ref=e202]
          - cell "Pending" [ref=e203]
          - cell "OK" [ref=e204]
          - cell [ref=e205]
          - cell "View | Reschedule" [ref=e206]:
            - link "View" [ref=e207] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?id=532911a8-06a9-4e46-8be7-892b8fb28b25
            - text: "|"
            - link "Reschedule" [ref=e208] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/reschedule.do?id=532911a8-06a9-4e46-8be7-892b8fb28b25
        - row "12 SR67000117 Software Installation 17-07-2026 16:54 OK - OK View | Resubmit" [ref=e209]:
          - cell "12" [ref=e210]
          - cell "SR67000117" [ref=e211]
          - cell "Software Installation" [ref=e212]
          - cell "17-07-2026 16:54" [ref=e213]
          - cell "OK" [ref=e214]
          - cell "-" [ref=e215]
          - cell "OK" [ref=e216]
          - cell [ref=e217]
          - cell "View | Resubmit" [ref=e218]:
            - link "View" [ref=e219] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?id=d10c9711-9d86-444e-ae4c-0cd92139e455
            - text: "|"
            - link "Resubmit" [ref=e220] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/slot.do?id=d10c9711-9d86-444e-ae4c-0cd92139e455
        - row "13 SR67000116 Software Installation 17-07-2026 16:51 OK Pending OK View | Reschedule" [ref=e221]:
          - cell "13" [ref=e222]
          - cell "SR67000116" [ref=e223]
          - cell "Software Installation" [ref=e224]
          - cell "17-07-2026 16:51" [ref=e225]
          - cell "OK" [ref=e226]
          - cell "Pending" [ref=e227]
          - cell "OK" [ref=e228]
          - cell [ref=e229]
          - cell "View | Reschedule" [ref=e230]:
            - link "View" [ref=e231] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?id=e67d26db-1627-4b16-9fb2-878b2e95e132
            - text: "|"
            - link "Reschedule" [ref=e232] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/reschedule.do?id=e67d26db-1627-4b16-9fb2-878b2e95e132
        - row "14 SR67000115 Software Installation 17-07-2026 16:51 OK Pending OK View | Reschedule" [ref=e233]:
          - cell "14" [ref=e234]
          - cell "SR67000115" [ref=e235]
          - cell "Software Installation" [ref=e236]
          - cell "17-07-2026 16:51" [ref=e237]
          - cell "OK" [ref=e238]
          - cell "Pending" [ref=e239]
          - cell "OK" [ref=e240]
          - cell [ref=e241]
          - cell "View | Reschedule" [ref=e242]:
            - link "View" [ref=e243] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?id=a82f6aa5-26db-4f6b-bad5-67780678df20
            - text: "|"
            - link "Reschedule" [ref=e244] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/reschedule.do?id=a82f6aa5-26db-4f6b-bad5-67780678df20
        - row "15 SR67000114 Biometric Device Purchase 17-07-2026 16:45 OK Pending OK View | Reschedule" [ref=e245]:
          - cell "15" [ref=e246]
          - cell "SR67000114" [ref=e247]
          - cell "Biometric Device Purchase" [ref=e248]
          - cell "17-07-2026 16:45" [ref=e249]
          - cell "OK" [ref=e250]
          - cell "Pending" [ref=e251]
          - cell "OK" [ref=e252]
          - cell [ref=e253]
          - cell "View | Reschedule" [ref=e254]:
            - link "View" [ref=e255] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?id=196606a4-05f3-447e-98b5-93965dbbf3aa
            - text: "|"
            - link "Reschedule" [ref=e256] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/reschedule.do?id=196606a4-05f3-447e-98b5-93965dbbf3aa
        - row "16 SR67000113 Biometric Device Purchase 17-07-2026 16:44 OK Pending OK View | Reschedule" [ref=e257]:
          - cell "16" [ref=e258]
          - cell "SR67000113" [ref=e259]
          - cell "Biometric Device Purchase" [ref=e260]
          - cell "17-07-2026 16:44" [ref=e261]
          - cell "OK" [ref=e262]
          - cell "Pending" [ref=e263]
          - cell "OK" [ref=e264]
          - cell [ref=e265]
          - cell "View | Reschedule" [ref=e266]:
            - link "View" [ref=e267] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?id=97d3a04e-f673-43e7-8ece-bf7b9831982c
            - text: "|"
            - link "Reschedule" [ref=e268] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/reschedule.do?id=97d3a04e-f673-43e7-8ece-bf7b9831982c
        - row "17 SR67000112 Biometric Device Purchase 17-07-2026 16:41 OK Pending - View | Resubmit" [ref=e269]:
          - cell "17" [ref=e270]
          - cell "SR67000112" [ref=e271]
          - cell "Biometric Device Purchase" [ref=e272]
          - cell "17-07-2026 16:41" [ref=e273]
          - cell "OK" [ref=e274]
          - cell "Pending" [ref=e275]
          - cell "-" [ref=e276]
          - cell [ref=e277]
          - cell "View | Resubmit" [ref=e278]:
            - link "View" [ref=e279] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?id=9ed33a62-3e34-4522-a0f9-5766436aefe4
            - text: "|"
            - link "Resubmit" [ref=e280] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/reschedule.do?id=9ed33a62-3e34-4522-a0f9-5766436aefe4
        - row "18 SR67000111 Biometric Device Purchase 17-07-2026 16:40 OK - - View | Resubmit" [ref=e281]:
          - cell "18" [ref=e282]
          - cell "SR67000111" [ref=e283]
          - cell "Biometric Device Purchase" [ref=e284]
          - cell "17-07-2026 16:40" [ref=e285]
          - cell "OK" [ref=e286]
          - cell "-" [ref=e287]
          - cell "-" [ref=e288]
          - cell [ref=e289]
          - cell "View | Resubmit" [ref=e290]:
            - link "View" [ref=e291] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?id=01bb41e7-5f48-40e7-aee8-ca5d72d1344e
            - text: "|"
            - link "Resubmit" [ref=e292] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/slot.do?id=01bb41e7-5f48-40e7-aee8-ca5d72d1344e
        - row "19 SR67000110 Software Installation 17-07-2026 16:40 OK - - View | Resubmit" [ref=e293]:
          - cell "19" [ref=e294]
          - cell "SR67000110" [ref=e295]
          - cell "Software Installation" [ref=e296]
          - cell "17-07-2026 16:40" [ref=e297]
          - cell "OK" [ref=e298]
          - cell "-" [ref=e299]
          - cell "-" [ref=e300]
          - cell [ref=e301]
          - cell "View | Resubmit" [ref=e302]:
            - link "View" [ref=e303] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?id=7a848f60-5810-4495-8963-c391208e05df
            - text: "|"
            - link "Resubmit" [ref=e304] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/slot.do?id=7a848f60-5810-4495-8963-c391208e05df
        - row "20 SR67000107 Software Installation 17-07-2026 16:37 OK Pending - View | Reschedule" [ref=e305]:
          - cell "20" [ref=e306]
          - cell "SR67000107" [ref=e307]
          - cell "Software Installation" [ref=e308]
          - cell "17-07-2026 16:37" [ref=e309]
          - cell "OK" [ref=e310]
          - cell "Pending" [ref=e311]
          - cell "-" [ref=e312]
          - cell [ref=e313]
          - cell "View | Reschedule" [ref=e314]:
            - link "View" [ref=e315] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/receipt.do?id=3257318d-bd7a-408f-b3f3-2500e02793e8
            - text: "|"
            - link "Reschedule" [ref=e316] [cursor=pointer]:
              - /url: /uat1/view/ucd/service-hub/installation/reschedule.do?id=3257318d-bd7a-408f-b3f3-2500e02793e8
    - generic [ref=e317]:
      - generic:
        - generic [ref=e318]: « Prev
        - generic [ref=e319]: "1"
        - link "2" [ref=e320] [cursor=pointer]:
          - /url: "#"
        - link "3" [ref=e321] [cursor=pointer]:
          - /url: "#"
        - link "Next »" [ref=e322] [cursor=pointer]:
          - /url: "#"
  - dialog "Reschedule" [ref=e324]:
    - generic [ref=e325]:
      - generic [ref=e326]: Reschedule
      - button "Close" [ref=e327] [cursor=pointer]: ×
    - generic [ref=e328]:
      - paragraph [ref=e329]: Please select the appointment(s) you wish to reschedule.
      - table [ref=e330]:
        - rowgroup [ref=e331]:
          - row "Appointment Date Time Slot" [ref=e332]:
            - columnheader [ref=e333]:
              - checkbox [ref=e334] [cursor=pointer]
            - columnheader "Appointment Date" [ref=e335]
            - columnheader "Time Slot" [ref=e336]
        - rowgroup [ref=e337]:
          - row "31-07-2026 10:00am - 12:00pm" [ref=e338]:
            - cell [ref=e339]:
              - checkbox [ref=e340] [cursor=pointer]
            - cell "31-07-2026" [ref=e341]
            - cell "10:00am - 12:00pm" [ref=e342]
    - generic [ref=e343]:
      - button "Cancel" [ref=e344] [cursor=pointer]
      - button "Confirm" [ref=e345] [cursor=pointer]
  - generic [ref=e346]:
    - generic [ref=e347]:
      - button "HOME" [ref=e348] [cursor=pointer]
      - button "INSURANCE" [ref=e349] [cursor=pointer]
      - button "REPORTS" [ref=e350] [cursor=pointer]
      - button "SETTINGS" [ref=e351] [cursor=pointer]
      - button "USER GUIDE" [ref=e352] [cursor=pointer]
      - button "DOWNLOAD" [ref=e353] [cursor=pointer]
      - button "CONTACT US" [ref=e354] [cursor=pointer]
    - table [ref=e355]:
      - rowgroup [ref=e356]:
        - row "Online Services - Service Hub MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e357]:
          - cell "Online Services - Service Hub" [ref=e358]
          - cell "MUHAMMAD FAIZUDDIN BIN BIDI | Logout" [ref=e359]:
            - list [ref=e360]:
              - listitem [ref=e361]:
                - img [ref=e362]
                - text: MUHAMMAD FAIZUDDIN BIN BIDI
              - listitem [ref=e363]: "|"
              - listitem [ref=e364]:
                - link "Logout" [ref=e365] [cursor=pointer]:
                  - /url: "#"
  - img [ref=e367]
  - generic [ref=e368]:
    - generic [ref=e370]:
      - generic [ref=e371]:
        - link "Contact Us" [ref=e372] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e373]: "|"
        - link "Terms & Conditions" [ref=e374] [cursor=pointer]:
          - /url: "#"
        - generic [ref=e375]: "|"
        - link "Privacy" [ref=e376] [cursor=pointer]:
          - /url: "#"
      - generic [ref=e377]: Best Compatible With Mozilla Firefox V36.0.4
      - generic [ref=e378]: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
    - img [ref=e380]
```

# Test source

```ts
  69  |     if (opts.serviceType) await this.serviceTypeSelect.selectOption(opts.serviceType);
  70  |     if (opts.status) await this.statusSelect.selectOption(opts.status);
  71  |     if (opts.dateRequestedFrom) await this.dateRequestedFromInput.fill(opts.dateRequestedFrom);
  72  |     if (opts.dateRequestedTo) await this.dateRequestedToInput.fill(opts.dateRequestedTo);
  73  |     if (opts.paymentDateFrom) await this.paymentDateFromInput.fill(opts.paymentDateFrom);
  74  |     if (opts.paymentDateTo) await this.paymentDateToInput.fill(opts.paymentDateTo);
  75  |     await this.searchBtn.click();
  76  |     await this.waitForNav();
  77  |   }
  78  | 
  79  |   async resetFilters() {
  80  |     await this.resetBtn.click();
  81  |     await this.waitForNav();
  82  |   }
  83  | 
  84  |   /**
  85  |    * Data rows only. The results table renders its header inside <tbody> as a
  86  |    * <th> row (no <td>), so `tbody tr:has(td)` skips it — otherwise per-cell
  87  |    * getters would wait out their timeout on a non-existent <td>.
  88  |    */
  89  |   async getResultRows(): Promise<Locator[]> {
  90  |     return await this.resultsTable.locator("tbody tr:has(td)").all();
  91  |   }
  92  | 
  93  |   private async cellText(row: Locator, colIndex: number): Promise<string> {
  94  |     const cell = row.locator("td").nth(colIndex);
  95  |     if ((await cell.count()) === 0) return ""; // row has no such cell — don't hang
  96  |     return (await cell.textContent())?.trim() ?? "";
  97  |   }
  98  | 
  99  |   async getRowReferenceNo(row: Locator): Promise<string> {
  100 |     return this.cellText(row, ServiceRequestListingPage.COL.referenceNo);
  101 |   }
  102 | 
  103 |   async getRowServiceType(row: Locator): Promise<string> {
  104 |     return this.cellText(row, ServiceRequestListingPage.COL.serviceType);
  105 |   }
  106 | 
  107 |   async getRowDateRequested(row: Locator): Promise<string> {
  108 |     return this.cellText(row, ServiceRequestListingPage.COL.dateRequested);
  109 |   }
  110 | 
  111 |   async getRowPayment(row: Locator): Promise<string> {
  112 |     return this.cellText(row, ServiceRequestListingPage.COL.payment);
  113 |   }
  114 | 
  115 |   /** Tx Status — "Pending" (blue) / "Completed" (green) etc. */
  116 |   async getRowStatus(row: Locator): Promise<string> {
  117 |     return this.cellText(row, ServiceRequestListingPage.COL.txStatus);
  118 |   }
  119 | 
  120 |   async getRowEInvoiceStatus(row: Locator): Promise<string> {
  121 |     return this.cellText(row, ServiceRequestListingPage.COL.eInvoiceStatus);
  122 |   }
  123 | 
  124 |   async getRowRemarks(row: Locator): Promise<string> {
  125 |     return this.cellText(row, ServiceRequestListingPage.COL.remarks);
  126 |   }
  127 | 
  128 |   /** Click "View" action on a row → Service Request Details Page */
  129 |   async clickView(row: Locator) {
  130 |     await row.getByText("View", { exact: false }).click();
  131 |     await this.waitForNav();
  132 |   }
  133 | 
  134 |   /**
  135 |    * The row's "Reschedule" action link — NOT just any `a.sc-resubmit`.
  136 |    * Verified live: the SAME class is reused for the failed-payment "Resubmit"
  137 |    * retry link (→ slot.do/payment.do), which appears on plenty of rows too —
  138 |    * only the link TEXT tells them apart. Matching on class alone silently
  139 |    * picks up Resubmit rows as if they were reschedulable.
  140 |    */
  141 |   private rescheduleLink(row: Locator): Locator {
  142 |     return row.locator("a.sc-resubmit", { hasText: "Reschedule" });
  143 |   }
  144 | 
  145 |   /**
  146 |    * Click "Reschedule" on a row.
  147 |    *
  148 |    * The reschedule flow changed (verified live, SIT2): clicking the link no
  149 |    * longer navigates straight to the calendar. It now opens an in-page modal
  150 |    * (.sc-modal, over #sc-resched-ovl) — "Please select the appointment(s)
  151 |    * you wish to reschedule" — listing the SR's appointment(s) with a
  152 |    * checkbox each (.sc-resched-cb) plus a "select all" header checkbox
  153 |    * (#sc-resched-all). Only after checking (at least) one and clicking
  154 |    * Confirm (.sc-btn-confirm) does it navigate to
  155 |    * installation/reschedule.do?id=<txnId>&apptIds=<uuid[,uuid...]> — and
  156 |    * critically, the chosen appointment(s) are ALREADY REMOVED by then: the
  157 |    * calendar opens straight to picking a new date, no manual
  158 |    * open-modal/remove-slot/save dance needed first.
  159 |    *
  160 |    * Selects ALL listed appointments (via the header checkbox) rather than
  161 |    * one at a time — every current test reschedules a single-appointment SR
  162 |    * anyway, and this matches "select all" being the obvious default action.
  163 |    */
  164 |   async clickReschedule(row: Locator) {
  165 |     await this.rescheduleLink(row).click();
  166 |     const modal = this.page.locator(".sc-modal");
  167 |     await modal.waitFor({ state: "visible", timeout: 10000 });
  168 |     const selectAll = modal.locator("#sc-resched-all");
> 169 |     if (await selectAll.count()) await selectAll.check();
      |                                                  ^ Error: locator.check: Clicking the checkbox did not change its state
  170 |     await modal.locator(".sc-btn-confirm").click();
  171 |     await this.waitForNav();
  172 |   }
  173 | 
  174 |   /**
  175 |    * SRD 2.3.2.2 #3: "Reschedule" is shown only for Software Installation
  176 |    * requests whose Tx Status = "PENDING". A row qualifies when the action
  177 |    * link is present.
  178 |    */
  179 |   async hasRescheduleAction(row: Locator): Promise<boolean> {
  180 |     return (await this.rescheduleLink(row).count()) > 0;
  181 |   }
  182 | 
  183 |   /**
  184 |    * The row's Reschedule link txnId, as a full "key=value" pair (e.g.
  185 |    * "id=4d7196b0-..." — the current scheme — or the older "txnId=195" /
  186 |    * "transactionId=<uuid>"; see BasePage.getTxnIdFromUrl), or null if the
  187 |    * row has no Reschedule action. Lets callers open a candidate's reschedule
  188 |    * page directly (via ReschedulePage.navigate(txnId)) without re-searching
  189 |    * the listing.
  190 |    */
  191 |   async getRescheduleTxnId(row: Locator): Promise<string | null> {
  192 |     const href = await this.rescheduleLink(row).getAttribute("href").catch(() => null);
  193 |     const match = href?.match(/(id|txnId|transactionId)=([^&]+)/);
  194 |     return match ? `${match[1]}=${match[2]}` : null;
  195 |   }
  196 | 
  197 |   /**
  198 |    * Verify the SRD rule that Reschedule is only offered when Tx Status is
  199 |    * Pending — a row with a non-pending status must not expose the action.
  200 |    */
  201 |   async assertRescheduleOnlyWhenPending(row: Locator) {
  202 |     const status = (await this.getRowStatus(row)).toLowerCase();
  203 |     const hasReschedule = await this.hasRescheduleAction(row);
  204 |     if (!status.includes("pending")) {
  205 |       expect(hasReschedule).toBe(false);
  206 |     }
  207 |   }
  208 | 
  209 |   /** Navigate to reschedule page for a specific txnId */
  210 |   async goToReschedule(txnId: string) {
  211 |     await this.goto(PATHS.reschedule(txnId));
  212 |   }
  213 | 
  214 |   /** Find first row matching a reference number */
  215 |   async findRowByRefNo(refNo: string): Promise<Locator | null> {
  216 |     const rows = await this.getResultRows();
  217 |     for (const row of rows) {
  218 |       const text = (await row.textContent()) ?? "";
  219 |       if (text.includes(refNo)) return row;
  220 |     }
  221 |     return null;
  222 |   }
  223 | }
  224 | 
```