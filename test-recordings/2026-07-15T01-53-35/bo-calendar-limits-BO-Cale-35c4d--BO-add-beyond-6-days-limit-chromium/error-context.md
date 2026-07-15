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
      - generic [ref=e47]: 31 record(s) in total
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
          - row "1 SRI67000085 15-07-2026 09:56 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 10am - 12pm - - - Pending - No View | Cancel" [ref=e90]:
            - cell "1" [ref=e91]
            - cell "SRI67000085" [ref=e92]
            - cell "15-07-2026 09:56" [ref=e93]:
              - text: 15-07-2026
              - text: 09:56
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
            - cell [ref=e106]
            - cell "No" [ref=e107]
            - cell "View | Cancel" [ref=e108]:
              - link "View" [ref=e109] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=215c0f16-bb68-4278-a7c9-9c9441690a7a&apptId=f806f521-d8a9-478d-9dc2-39b04441a8fb
              - text: "|"
              - link "Cancel" [ref=e110] [cursor=pointer]:
                - /url: "#"
          - row "2 SRI67000084 15-07-2026 09:56 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 2pm - 4pm - - - Pending - No View | Cancel" [ref=e111]:
            - cell "2" [ref=e112]
            - cell "SRI67000084" [ref=e113]
            - cell "15-07-2026 09:56" [ref=e114]:
              - text: 15-07-2026
              - text: 09:56
            - cell "FAIZUDDIN AUTO TEST" [ref=e115]
            - cell "-" [ref=e116]
            - cell "-" [ref=e117]
            - cell "-" [ref=e118]
            - cell "1" [ref=e119]
            - cell "31-07-2026" [ref=e120]
            - cell "2pm - 4pm" [ref=e121]:
              - text: 2pm -
              - text: 4pm
            - cell "-" [ref=e122]
            - cell "-" [ref=e123]
            - cell "-" [ref=e124]
            - cell "Pending" [ref=e125]
            - cell "-" [ref=e126]
            - cell [ref=e127]
            - cell "No" [ref=e128]
            - cell "View | Cancel" [ref=e129]:
              - link "View" [ref=e130] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=58e8001a-8d2a-4ad5-9d30-ff4680136497&apptId=9653d62f-901b-49dd-89be-6d1d4b1ece1a
              - text: "|"
              - link "Cancel" [ref=e131] [cursor=pointer]:
                - /url: "#"
          - row "3 SRI67000083 15-07-2026 09:56 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 10am - 12pm - - - Pending - No View | Cancel" [ref=e132]:
            - cell "3" [ref=e133]
            - cell "SRI67000083" [ref=e134]
            - cell "15-07-2026 09:56" [ref=e135]:
              - text: 15-07-2026
              - text: 09:56
            - cell "FAIZUDDIN AUTO TEST" [ref=e136]
            - cell "-" [ref=e137]
            - cell "-" [ref=e138]
            - cell "-" [ref=e139]
            - cell "1" [ref=e140]
            - cell "31-07-2026" [ref=e141]
            - cell "10am - 12pm" [ref=e142]:
              - text: 10am -
              - text: 12pm
            - cell "-" [ref=e143]
            - cell "-" [ref=e144]
            - cell "-" [ref=e145]
            - cell "Pending" [ref=e146]
            - cell "-" [ref=e147]
            - cell [ref=e148]
            - cell "No" [ref=e149]
            - cell "View | Cancel" [ref=e150]:
              - link "View" [ref=e151] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=c39f1658-84bb-43b5-854b-fb2ac2b9fe43&apptId=c13f4ccc-6bd5-412f-887a-b46113bafde5
              - text: "|"
              - link "Cancel" [ref=e152] [cursor=pointer]:
                - /url: "#"
          - row "4 SRI67000082 15-07-2026 09:56 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 10am - 12pm - - - Pending - No View | Cancel" [ref=e153]:
            - cell "4" [ref=e154]
            - cell "SRI67000082" [ref=e155]
            - cell "15-07-2026 09:56" [ref=e156]:
              - text: 15-07-2026
              - text: 09:56
            - cell "FAIZUDDIN AUTO TEST" [ref=e157]
            - cell "-" [ref=e158]
            - cell "-" [ref=e159]
            - cell "-" [ref=e160]
            - cell "1" [ref=e161]
            - cell "31-07-2026" [ref=e162]
            - cell "10am - 12pm" [ref=e163]:
              - text: 10am -
              - text: 12pm
            - cell "-" [ref=e164]
            - cell "-" [ref=e165]
            - cell "-" [ref=e166]
            - cell "Pending" [ref=e167]
            - cell "-" [ref=e168]
            - cell [ref=e169]
            - cell "No" [ref=e170]
            - cell "View | Cancel" [ref=e171]:
              - link "View" [ref=e172] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=8aac9a61-0fac-433f-9d51-971efdfa97f4&apptId=f719b168-3949-475c-8318-4b2248cbb7bf
              - text: "|"
              - link "Cancel" [ref=e173] [cursor=pointer]:
                - /url: "#"
          - row "5 SRI67000081 15-07-2026 09:56 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 2pm - 4pm - - - Pending - No View | Cancel" [ref=e174]:
            - cell "5" [ref=e175]
            - cell "SRI67000081" [ref=e176]
            - cell "15-07-2026 09:56" [ref=e177]:
              - text: 15-07-2026
              - text: 09:56
            - cell "FAIZUDDIN AUTO TEST" [ref=e178]
            - cell "-" [ref=e179]
            - cell "-" [ref=e180]
            - cell "-" [ref=e181]
            - cell "1" [ref=e182]
            - cell "31-07-2026" [ref=e183]
            - cell "2pm - 4pm" [ref=e184]:
              - text: 2pm -
              - text: 4pm
            - cell "-" [ref=e185]
            - cell "-" [ref=e186]
            - cell "-" [ref=e187]
            - cell "Pending" [ref=e188]
            - cell "-" [ref=e189]
            - cell [ref=e190]
            - cell "No" [ref=e191]
            - cell "View | Cancel" [ref=e192]:
              - link "View" [ref=e193] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=36154cbf-52f2-461f-bff7-441a41294510&apptId=b1a93a9b-3f73-403f-99fe-df5fc01388e9
              - text: "|"
              - link "Cancel" [ref=e194] [cursor=pointer]:
                - /url: "#"
          - row "6 SRI67000080 15-07-2026 09:55 FAIZUDDIN AUTO TEST - - - 1 21-07-2026 2pm - 4pm - - - Pending - No View | Cancel" [ref=e195]:
            - cell "6" [ref=e196]
            - cell "SRI67000080" [ref=e197]
            - cell "15-07-2026 09:55" [ref=e198]:
              - text: 15-07-2026
              - text: 09:55
            - cell "FAIZUDDIN AUTO TEST" [ref=e199]
            - cell "-" [ref=e200]
            - cell "-" [ref=e201]
            - cell "-" [ref=e202]
            - cell "1" [ref=e203]
            - cell "21-07-2026" [ref=e204]
            - cell "2pm - 4pm" [ref=e205]:
              - text: 2pm -
              - text: 4pm
            - cell "-" [ref=e206]
            - cell "-" [ref=e207]
            - cell "-" [ref=e208]
            - cell "Pending" [ref=e209]
            - cell "-" [ref=e210]
            - cell [ref=e211]
            - cell "No" [ref=e212]
            - cell "View | Cancel" [ref=e213]:
              - link "View" [ref=e214] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=8e903566-2b33-46ba-90a2-35d76139068d&apptId=77121ce6-2519-445e-95b5-8ffe4661fbac
              - text: "|"
              - link "Cancel" [ref=e215] [cursor=pointer]:
                - /url: "#"
          - row "7 SRI67000079 15-07-2026 09:55 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 10am - 12pm - - - Pending - No View | Cancel" [ref=e216]:
            - cell "7" [ref=e217]
            - cell "SRI67000079" [ref=e218]
            - cell "15-07-2026 09:55" [ref=e219]:
              - text: 15-07-2026
              - text: 09:55
            - cell "FAIZUDDIN AUTO TEST" [ref=e220]
            - cell "-" [ref=e221]
            - cell "-" [ref=e222]
            - cell "-" [ref=e223]
            - cell "1" [ref=e224]
            - cell "31-07-2026" [ref=e225]
            - cell "10am - 12pm" [ref=e226]:
              - text: 10am -
              - text: 12pm
            - cell "-" [ref=e227]
            - cell "-" [ref=e228]
            - cell "-" [ref=e229]
            - cell "Pending" [ref=e230]
            - cell "-" [ref=e231]
            - cell [ref=e232]
            - cell "No" [ref=e233]
            - cell "View | Cancel" [ref=e234]:
              - link "View" [ref=e235] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=a0726fb8-390b-4a6e-8a06-c2763f3bd365&apptId=0ea463ea-07eb-439b-823a-705ad9610717
              - text: "|"
              - link "Cancel" [ref=e236] [cursor=pointer]:
                - /url: "#"
          - row "8 SRI67000078 15-07-2026 09:55 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 10am - 12pm - - - Pending - No View | Cancel" [ref=e237]:
            - cell "8" [ref=e238]
            - cell "SRI67000078" [ref=e239]
            - cell "15-07-2026 09:55" [ref=e240]:
              - text: 15-07-2026
              - text: 09:55
            - cell "FAIZUDDIN AUTO TEST" [ref=e241]
            - cell "-" [ref=e242]
            - cell "-" [ref=e243]
            - cell "-" [ref=e244]
            - cell "1" [ref=e245]
            - cell "31-07-2026" [ref=e246]
            - cell "10am - 12pm" [ref=e247]:
              - text: 10am -
              - text: 12pm
            - cell "-" [ref=e248]
            - cell "-" [ref=e249]
            - cell "-" [ref=e250]
            - cell "Pending" [ref=e251]
            - cell "-" [ref=e252]
            - cell [ref=e253]
            - cell "No" [ref=e254]
            - cell "View | Cancel" [ref=e255]:
              - link "View" [ref=e256] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=7788d68f-2226-4070-addf-51289162e9f8&apptId=50987b5b-fbc1-4382-9b37-885d5465344d
              - text: "|"
              - link "Cancel" [ref=e257] [cursor=pointer]:
                - /url: "#"
          - row "9 SRI67000077 15-07-2026 09:55 FAIZUDDIN AUTO TEST - - - 1 21-07-2026 2pm - 4pm - - - Pending - No View | Cancel" [ref=e258]:
            - cell "9" [ref=e259]
            - cell "SRI67000077" [ref=e260]
            - cell "15-07-2026 09:55" [ref=e261]:
              - text: 15-07-2026
              - text: 09:55
            - cell "FAIZUDDIN AUTO TEST" [ref=e262]
            - cell "-" [ref=e263]
            - cell "-" [ref=e264]
            - cell "-" [ref=e265]
            - cell "1" [ref=e266]
            - cell "21-07-2026" [ref=e267]
            - cell "2pm - 4pm" [ref=e268]:
              - text: 2pm -
              - text: 4pm
            - cell "-" [ref=e269]
            - cell "-" [ref=e270]
            - cell "-" [ref=e271]
            - cell "Pending" [ref=e272]
            - cell "-" [ref=e273]
            - cell [ref=e274]
            - cell "No" [ref=e275]
            - cell "View | Cancel" [ref=e276]:
              - link "View" [ref=e277] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=f7d8acc9-67d4-465b-b251-55d107a3de0d&apptId=4498dd8e-56e9-4afb-8e75-3a01134ebb70
              - text: "|"
              - link "Cancel" [ref=e278] [cursor=pointer]:
                - /url: "#"
          - row "10 SRI67000076 15-07-2026 09:54 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 10am - 12pm - - - Pending - No View | Cancel" [ref=e279]:
            - cell "10" [ref=e280]
            - cell "SRI67000076" [ref=e281]
            - cell "15-07-2026 09:54" [ref=e282]:
              - text: 15-07-2026
              - text: 09:54
            - cell "FAIZUDDIN AUTO TEST" [ref=e283]
            - cell "-" [ref=e284]
            - cell "-" [ref=e285]
            - cell "-" [ref=e286]
            - cell "1" [ref=e287]
            - cell "31-07-2026" [ref=e288]
            - cell "10am - 12pm" [ref=e289]:
              - text: 10am -
              - text: 12pm
            - cell "-" [ref=e290]
            - cell "-" [ref=e291]
            - cell "-" [ref=e292]
            - cell "Pending" [ref=e293]
            - cell "-" [ref=e294]
            - cell [ref=e295]
            - cell "No" [ref=e296]
            - cell "View | Cancel" [ref=e297]:
              - link "View" [ref=e298] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=c571455a-a09c-4244-87f5-87715c8c6f68&apptId=9f749f8a-f36b-4580-809f-261c31769a61
              - text: "|"
              - link "Cancel" [ref=e299] [cursor=pointer]:
                - /url: "#"
          - row "11 SRB67000075 15-07-2026 09:54 FAIZUDDIN AUTO TEST 030311-A 2 - 1 20-07-2026 2pm - 4pm OK OK New Pending - No View | Cancel" [ref=e300]:
            - cell "11" [ref=e301]
            - cell "SRB67000075" [ref=e302]
            - cell "15-07-2026 09:54" [ref=e303]:
              - text: 15-07-2026
              - text: 09:54
            - cell "FAIZUDDIN AUTO TEST" [ref=e304]
            - cell "030311-A" [ref=e305]
            - cell "2" [ref=e306]
            - cell "-" [ref=e307]
            - cell "1" [ref=e308]
            - cell "20-07-2026" [ref=e309]
            - cell "2pm - 4pm" [ref=e310]:
              - text: 2pm -
              - text: 4pm
            - cell "OK" [ref=e311]
            - cell "OK" [ref=e312]
            - cell "New" [ref=e313]
            - cell "Pending" [ref=e314]
            - cell "-" [ref=e315]
            - cell [ref=e316]
            - cell "No" [ref=e317]
            - cell "View | Cancel" [ref=e318]:
              - link "View" [ref=e319] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=cc356263-dd12-4178-9b1c-ddfae54434a4&apptId=857d8ba9-ad3b-48bb-9085-e1e52dacf3d6
              - text: "|"
              - link "Cancel" [ref=e320] [cursor=pointer]:
                - /url: "#"
          - row "12 SRI67000074 15-07-2026 09:54 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 2pm - 4pm - - - Pending - No View | Cancel" [ref=e321]:
            - cell "12" [ref=e322]
            - cell "SRI67000074" [ref=e323]
            - cell "15-07-2026 09:54" [ref=e324]:
              - text: 15-07-2026
              - text: 09:54
            - cell "FAIZUDDIN AUTO TEST" [ref=e325]
            - cell "-" [ref=e326]
            - cell "-" [ref=e327]
            - cell "-" [ref=e328]
            - cell "1" [ref=e329]
            - cell "31-07-2026" [ref=e330]
            - cell "2pm - 4pm" [ref=e331]:
              - text: 2pm -
              - text: 4pm
            - cell "-" [ref=e332]
            - cell "-" [ref=e333]
            - cell "-" [ref=e334]
            - cell "Pending" [ref=e335]
            - cell "-" [ref=e336]
            - cell [ref=e337]
            - cell "No" [ref=e338]
            - cell "View | Cancel" [ref=e339]:
              - link "View" [ref=e340] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=e39de4c1-4734-457b-beb9-428594040090&apptId=1635cd73-8e94-48ab-80cb-3153eeae487a
              - text: "|"
              - link "Cancel" [ref=e341] [cursor=pointer]:
                - /url: "#"
          - row "13 SRB67000073 15-07-2026 09:54 FAIZUDDIN AUTO TEST 030311-A 2 - 1 20-07-2026 2pm - 4pm OK OK New Pending - No View | Cancel" [ref=e342]:
            - cell "13" [ref=e343]
            - cell "SRB67000073" [ref=e344]
            - cell "15-07-2026 09:54" [ref=e345]:
              - text: 15-07-2026
              - text: 09:54
            - cell "FAIZUDDIN AUTO TEST" [ref=e346]
            - cell "030311-A" [ref=e347]
            - cell "2" [ref=e348]
            - cell "-" [ref=e349]
            - cell "1" [ref=e350]
            - cell "20-07-2026" [ref=e351]
            - cell "2pm - 4pm" [ref=e352]:
              - text: 2pm -
              - text: 4pm
            - cell "OK" [ref=e353]
            - cell "OK" [ref=e354]
            - cell "New" [ref=e355]
            - cell "Pending" [ref=e356]
            - cell "-" [ref=e357]
            - cell [ref=e358]
            - cell "No" [ref=e359]
            - cell "View | Cancel" [ref=e360]:
              - link "View" [ref=e361] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=0c7a6d67-e8d5-4937-8f65-d7616646e656&apptId=70957801-bada-42f7-8ccb-278e2470faea
              - text: "|"
              - link "Cancel" [ref=e362] [cursor=pointer]:
                - /url: "#"
          - row "14 SRI67000072 15-07-2026 09:54 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 10am - 12pm - - - Pending - No View | Cancel" [ref=e363]:
            - cell "14" [ref=e364]
            - cell "SRI67000072" [ref=e365]
            - cell "15-07-2026 09:54" [ref=e366]:
              - text: 15-07-2026
              - text: 09:54
            - cell "FAIZUDDIN AUTO TEST" [ref=e367]
            - cell "-" [ref=e368]
            - cell "-" [ref=e369]
            - cell "-" [ref=e370]
            - cell "1" [ref=e371]
            - cell "31-07-2026" [ref=e372]
            - cell "10am - 12pm" [ref=e373]:
              - text: 10am -
              - text: 12pm
            - cell "-" [ref=e374]
            - cell "-" [ref=e375]
            - cell "-" [ref=e376]
            - cell "Pending" [ref=e377]
            - cell "-" [ref=e378]
            - cell [ref=e379]
            - cell "No" [ref=e380]
            - cell "View | Cancel" [ref=e381]:
              - link "View" [ref=e382] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=e09c55e3-3155-4ff3-abf2-1128e70e3e49&apptId=00bd0e88-9879-4ad5-9c89-c0b3be768c71
              - text: "|"
              - link "Cancel" [ref=e383] [cursor=pointer]:
                - /url: "#"
          - row "15 SRI67000071 15-07-2026 09:54 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 2pm - 4pm - - - Pending - No View | Cancel" [ref=e384]:
            - cell "15" [ref=e385]
            - cell "SRI67000071" [ref=e386]
            - cell "15-07-2026 09:54" [ref=e387]:
              - text: 15-07-2026
              - text: 09:54
            - cell "FAIZUDDIN AUTO TEST" [ref=e388]
            - cell "-" [ref=e389]
            - cell "-" [ref=e390]
            - cell "-" [ref=e391]
            - cell "1" [ref=e392]
            - cell "31-07-2026" [ref=e393]
            - cell "2pm - 4pm" [ref=e394]:
              - text: 2pm -
              - text: 4pm
            - cell "-" [ref=e395]
            - cell "-" [ref=e396]
            - cell "-" [ref=e397]
            - cell "Pending" [ref=e398]
            - cell "-" [ref=e399]
            - cell [ref=e400]
            - cell "No" [ref=e401]
            - cell "View | Cancel" [ref=e402]:
              - link "View" [ref=e403] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=6a8fa647-520d-4a1c-85ab-17925a4c3bcf&apptId=0b217969-a73b-4c8c-8564-f94b436797ec
              - text: "|"
              - link "Cancel" [ref=e404] [cursor=pointer]:
                - /url: "#"
          - row "16 SRI67000070 15-07-2026 09:53 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 10am - 12pm - - - Pending - No View | Cancel" [ref=e405]:
            - cell "16" [ref=e406]
            - cell "SRI67000070" [ref=e407]
            - cell "15-07-2026 09:53" [ref=e408]:
              - text: 15-07-2026
              - text: 09:53
            - cell "FAIZUDDIN AUTO TEST" [ref=e409]
            - cell "-" [ref=e410]
            - cell "-" [ref=e411]
            - cell "-" [ref=e412]
            - cell "1" [ref=e413]
            - cell "31-07-2026" [ref=e414]
            - cell "10am - 12pm" [ref=e415]:
              - text: 10am -
              - text: 12pm
            - cell "-" [ref=e416]
            - cell "-" [ref=e417]
            - cell "-" [ref=e418]
            - cell "Pending" [ref=e419]
            - cell "-" [ref=e420]
            - cell [ref=e421]
            - cell "No" [ref=e422]
            - cell "View | Cancel" [ref=e423]:
              - link "View" [ref=e424] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=d2c475be-c32f-4bf2-9653-3deca826a420&apptId=3570febf-6d7b-40c9-bb33-dc2008d6dc93
              - text: "|"
              - link "Cancel" [ref=e425] [cursor=pointer]:
                - /url: "#"
          - row "17 SRI67000069 15-07-2026 09:53 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 10am - 12pm - - - Pending - No View | Cancel" [ref=e426]:
            - cell "17" [ref=e427]
            - cell "SRI67000069" [ref=e428]
            - cell "15-07-2026 09:53" [ref=e429]:
              - text: 15-07-2026
              - text: 09:53
            - cell "FAIZUDDIN AUTO TEST" [ref=e430]
            - cell "-" [ref=e431]
            - cell "-" [ref=e432]
            - cell "-" [ref=e433]
            - cell "1" [ref=e434]
            - cell "31-07-2026" [ref=e435]
            - cell "10am - 12pm" [ref=e436]:
              - text: 10am -
              - text: 12pm
            - cell "-" [ref=e437]
            - cell "-" [ref=e438]
            - cell "-" [ref=e439]
            - cell "Pending" [ref=e440]
            - cell "-" [ref=e441]
            - cell [ref=e442]
            - cell "No" [ref=e443]
            - cell "View | Cancel" [ref=e444]:
              - link "View" [ref=e445] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=88036092-f05e-4ab9-a7ba-adafb99409e6&apptId=0834408f-dd03-430b-936c-96719c6a28f3
              - text: "|"
              - link "Cancel" [ref=e446] [cursor=pointer]:
                - /url: "#"
          - row "18 SRI67000068 15-07-2026 09:53 FAIZUDDIN AUTO TEST - - - 1 31-07-2026 10am - 12pm - - - Pending - No View | Cancel" [ref=e447]:
            - cell "18" [ref=e448]
            - cell "SRI67000068" [ref=e449]
            - cell "15-07-2026 09:53" [ref=e450]:
              - text: 15-07-2026
              - text: 09:53
            - cell "FAIZUDDIN AUTO TEST" [ref=e451]
            - cell "-" [ref=e452]
            - cell "-" [ref=e453]
            - cell "-" [ref=e454]
            - cell "1" [ref=e455]
            - cell "31-07-2026" [ref=e456]
            - cell "10am - 12pm" [ref=e457]:
              - text: 10am -
              - text: 12pm
            - cell "-" [ref=e458]
            - cell "-" [ref=e459]
            - cell "-" [ref=e460]
            - cell "Pending" [ref=e461]
            - cell "-" [ref=e462]
            - cell [ref=e463]
            - cell "No" [ref=e464]
            - cell "View | Cancel" [ref=e465]:
              - link "View" [ref=e466] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=0d268fb9-088f-461b-a908-bff45bcab218&apptId=f225e6b3-ce36-4858-a12d-e2457f4aec77
              - text: "|"
              - link "Cancel" [ref=e467] [cursor=pointer]:
                - /url: "#"
          - row "19 SRB67000044 14-07-2026 23:55 FAIZUDDIN AUTO TEST 030311-A 2 - 1 15-07-2026 2pm - 4pm OK OK New Pending - No View | Cancel" [ref=e468]:
            - cell "19" [ref=e469]
            - cell "SRB67000044" [ref=e470]
            - cell "14-07-2026 23:55" [ref=e471]:
              - text: 14-07-2026
              - text: 23:55
            - cell "FAIZUDDIN AUTO TEST" [ref=e472]
            - cell "030311-A" [ref=e473]
            - cell "2" [ref=e474]
            - cell "-" [ref=e475]
            - cell "1" [ref=e476]
            - cell "15-07-2026" [ref=e477]
            - cell "2pm - 4pm" [ref=e478]:
              - text: 2pm -
              - text: 4pm
            - cell "OK" [ref=e479]
            - cell "OK" [ref=e480]
            - cell "New" [ref=e481]
            - cell "Pending" [ref=e482]
            - cell "-" [ref=e483]
            - cell [ref=e484]
            - cell "No" [ref=e485]
            - cell "View | Cancel" [ref=e486]:
              - link "View" [ref=e487] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=6bb18f21-c4d2-48de-bc9a-52a7617c1c71&apptId=c9edfce0-daab-4982-8afe-b9d2a213a10d
              - text: "|"
              - link "Cancel" [ref=e488] [cursor=pointer]:
                - /url: "#"
          - row "20 SRB67000041 14-07-2026 23:55 FAIZUDDIN AUTO TEST 030311-A 2 - 1 15-07-2026 2pm - 4pm OK OK New Pending - No View | Cancel" [ref=e489]:
            - cell "20" [ref=e490]
            - cell "SRB67000041" [ref=e491]
            - cell "14-07-2026 23:55" [ref=e492]:
              - text: 14-07-2026
              - text: 23:55
            - cell "FAIZUDDIN AUTO TEST" [ref=e493]
            - cell "030311-A" [ref=e494]
            - cell "2" [ref=e495]
            - cell "-" [ref=e496]
            - cell "1" [ref=e497]
            - cell "15-07-2026" [ref=e498]
            - cell "2pm - 4pm" [ref=e499]:
              - text: 2pm -
              - text: 4pm
            - cell "OK" [ref=e500]
            - cell "OK" [ref=e501]
            - cell "New" [ref=e502]
            - cell "Pending" [ref=e503]
            - cell "-" [ref=e504]
            - cell [ref=e505]
            - cell "No" [ref=e506]
            - cell "View | Cancel" [ref=e507]:
              - link "View" [ref=e508] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=9b0d12be-c232-48b6-a3fa-5831cf1c202e&apptId=f64b0d45-339c-496c-8b31-ef470bdfb813
              - text: "|"
              - link "Cancel" [ref=e509] [cursor=pointer]:
                - /url: "#"
          - row "21 SRI67000040 14-07-2026 23:50 FAIZUDDIN AUTO TEST 030311-A - - 1 15-07-2026 10am - 12pm OK OK - Pending - No View | Cancel" [ref=e510]:
            - cell "21" [ref=e511]
            - cell "SRI67000040" [ref=e512]
            - cell "14-07-2026 23:50" [ref=e513]:
              - text: 14-07-2026
              - text: 23:50
            - cell "FAIZUDDIN AUTO TEST" [ref=e514]
            - cell "030311-A" [ref=e515]
            - cell "-" [ref=e516]
            - cell "-" [ref=e517]
            - cell "1" [ref=e518]
            - cell "15-07-2026" [ref=e519]
            - cell "10am - 12pm" [ref=e520]:
              - text: 10am -
              - text: 12pm
            - cell "OK" [ref=e521]
            - cell "OK" [ref=e522]
            - cell "-" [ref=e523]
            - cell "Pending" [ref=e524]
            - cell "-" [ref=e525]
            - cell [ref=e526]
            - cell "No" [ref=e527]
            - cell "View | Cancel" [ref=e528]:
              - link "View" [ref=e529] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=4f7ad03f-7dab-43b7-9689-cafee79dc4ee&apptId=6a9fcba2-06fc-4b7f-b63f-a26eaf87669a
              - text: "|"
              - link "Cancel" [ref=e530] [cursor=pointer]:
                - /url: "#"
          - row "22 SRI67000040 14-07-2026 23:50 FAIZUDDIN AUTO TEST 030311-A - - 1 15-07-2026 2pm - 4pm OK OK - Pending - No View | Cancel" [ref=e531]:
            - cell "22" [ref=e532]
            - cell "SRI67000040" [ref=e533]
            - cell "14-07-2026 23:50" [ref=e534]:
              - text: 14-07-2026
              - text: 23:50
            - cell "FAIZUDDIN AUTO TEST" [ref=e535]
            - cell "030311-A" [ref=e536]
            - cell "-" [ref=e537]
            - cell "-" [ref=e538]
            - cell "1" [ref=e539]
            - cell "15-07-2026" [ref=e540]
            - cell "2pm - 4pm" [ref=e541]:
              - text: 2pm -
              - text: 4pm
            - cell "OK" [ref=e542]
            - cell "OK" [ref=e543]
            - cell "-" [ref=e544]
            - cell "Pending" [ref=e545]
            - cell "-" [ref=e546]
            - cell [ref=e547]
            - cell "No" [ref=e548]
            - cell "View | Cancel" [ref=e549]:
              - link "View" [ref=e550] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=4f7ad03f-7dab-43b7-9689-cafee79dc4ee&apptId=b45016e3-6346-4053-af57-c5dc7dcb4dde
              - text: "|"
              - link "Cancel" [ref=e551] [cursor=pointer]:
                - /url: "#"
          - row "23 SRI67000039 14-07-2026 23:46 FAIZUDDIN AUTO TEST 030311-A - - 1 15-07-2026 10am - 12pm OK OK - Pending - No View | Cancel" [ref=e552]:
            - cell "23" [ref=e553]
            - cell "SRI67000039" [ref=e554]
            - cell "14-07-2026 23:46" [ref=e555]:
              - text: 14-07-2026
              - text: 23:46
            - cell "FAIZUDDIN AUTO TEST" [ref=e556]
            - cell "030311-A" [ref=e557]
            - cell "-" [ref=e558]
            - cell "-" [ref=e559]
            - cell "1" [ref=e560]
            - cell "15-07-2026" [ref=e561]
            - cell "10am - 12pm" [ref=e562]:
              - text: 10am -
              - text: 12pm
            - cell "OK" [ref=e563]
            - cell "OK" [ref=e564]
            - cell "-" [ref=e565]
            - cell "Pending" [ref=e566]
            - cell "-" [ref=e567]
            - cell [ref=e568]
            - cell "No" [ref=e569]
            - cell "View | Cancel" [ref=e570]:
              - link "View" [ref=e571] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=6d8c6657-fa7b-4d19-b7f5-3c74c0791999&apptId=0b915fd9-7ec2-477a-97ce-1533e7256a41
              - text: "|"
              - link "Cancel" [ref=e572] [cursor=pointer]:
                - /url: "#"
          - row "24 SRI67000039 14-07-2026 23:46 FAIZUDDIN AUTO TEST 030311-A - - 1 15-07-2026 10am - 12pm OK OK - Pending - No View | Cancel" [ref=e573]:
            - cell "24" [ref=e574]
            - cell "SRI67000039" [ref=e575]
            - cell "14-07-2026 23:46" [ref=e576]:
              - text: 14-07-2026
              - text: 23:46
            - cell "FAIZUDDIN AUTO TEST" [ref=e577]
            - cell "030311-A" [ref=e578]
            - cell "-" [ref=e579]
            - cell "-" [ref=e580]
            - cell "1" [ref=e581]
            - cell "15-07-2026" [ref=e582]
            - cell "10am - 12pm" [ref=e583]:
              - text: 10am -
              - text: 12pm
            - cell "OK" [ref=e584]
            - cell "OK" [ref=e585]
            - cell "-" [ref=e586]
            - cell "Pending" [ref=e587]
            - cell "-" [ref=e588]
            - cell [ref=e589]
            - cell "No" [ref=e590]
            - cell "View | Cancel" [ref=e591]:
              - link "View" [ref=e592] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=6d8c6657-fa7b-4d19-b7f5-3c74c0791999&apptId=a6e511ad-9abf-4ecb-9895-f9286bb43dd9
              - text: "|"
              - link "Cancel" [ref=e593] [cursor=pointer]:
                - /url: "#"
          - row "25 SRI67000019 14-07-2026 17:32 FAIZUDDIN AUTO TEST - - - 1 16-07-2026 10am - 12pm - - - Cancelled - CANCELLED BY jasons on 14-07-2026 18:02 No View" [ref=e594]:
            - cell "25" [ref=e595]
            - cell "SRI67000019" [ref=e596]
            - cell "14-07-2026 17:32" [ref=e597]:
              - text: 14-07-2026
              - text: 17:32
            - cell "FAIZUDDIN AUTO TEST" [ref=e598]
            - cell "-" [ref=e599]
            - cell "-" [ref=e600]
            - cell "-" [ref=e601]
            - cell "1" [ref=e602]
            - cell "16-07-2026" [ref=e603]
            - cell "10am - 12pm" [ref=e604]:
              - text: 10am -
              - text: 12pm
            - cell "-" [ref=e605]
            - cell "-" [ref=e606]
            - cell "-" [ref=e607]
            - cell "Cancelled" [ref=e608]
            - cell "-" [ref=e609]
            - cell "CANCELLED BY jasons on 14-07-2026 18:02" [ref=e610]
            - cell "No" [ref=e611]
            - cell "View" [ref=e612]:
              - link "View" [ref=e613] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=65816c8c-1bb3-45d5-af28-584df996b491&apptId=c5f0e8e2-89c0-47a1-859c-e199d07fb7ee
          - row "26 SRI67000002 14-07-2026 16:00 FAIZUDDIN AUTO TEST 030311-A - - 1 16-07-2026 10am - 12pm OK OK - Pending - No View | Cancel" [ref=e614]:
            - cell "26" [ref=e615]
            - cell "SRI67000002" [ref=e616]
            - cell "14-07-2026 16:00" [ref=e617]:
              - text: 14-07-2026
              - text: 16:00
            - cell "FAIZUDDIN AUTO TEST" [ref=e618]
            - cell "030311-A" [ref=e619]
            - cell "-" [ref=e620]
            - cell "-" [ref=e621]
            - cell "1" [ref=e622]
            - cell "16-07-2026" [ref=e623]
            - cell "10am - 12pm" [ref=e624]:
              - text: 10am -
              - text: 12pm
            - cell "OK" [ref=e625]
            - cell "OK" [ref=e626]
            - cell "-" [ref=e627]
            - cell "Pending" [ref=e628]
            - cell "-" [ref=e629]
            - cell [ref=e630]
            - cell "No" [ref=e631]
            - cell "View | Cancel" [ref=e632]:
              - link "View" [ref=e633] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=1e0382e0-4979-4155-a385-c7eca43e86e7&apptId=1b0999f2-cce2-43a0-a541-576eef8578d9
              - text: "|"
              - link "Cancel" [ref=e634] [cursor=pointer]:
                - /url: "#"
          - row "27 SRI67000002 14-07-2026 16:00 FAIZUDDIN AUTO TEST 030311-A - - 1 16-07-2026 10am - 12pm OK OK - Pending - No View | Cancel" [ref=e635]:
            - cell "27" [ref=e636]
            - cell "SRI67000002" [ref=e637]
            - cell "14-07-2026 16:00" [ref=e638]:
              - text: 14-07-2026
              - text: 16:00
            - cell "FAIZUDDIN AUTO TEST" [ref=e639]
            - cell "030311-A" [ref=e640]
            - cell "-" [ref=e641]
            - cell "-" [ref=e642]
            - cell "1" [ref=e643]
            - cell "16-07-2026" [ref=e644]
            - cell "10am - 12pm" [ref=e645]:
              - text: 10am -
              - text: 12pm
            - cell "OK" [ref=e646]
            - cell "OK" [ref=e647]
            - cell "-" [ref=e648]
            - cell "Pending" [ref=e649]
            - cell "-" [ref=e650]
            - cell [ref=e651]
            - cell "No" [ref=e652]
            - cell "View | Cancel" [ref=e653]:
              - link "View" [ref=e654] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=1e0382e0-4979-4155-a385-c7eca43e86e7&apptId=6284d334-5e9f-4b64-bc40-1ebd36a2bbd9
              - text: "|"
              - link "Cancel" [ref=e655] [cursor=pointer]:
                - /url: "#"
          - row "28 SRI67000002 14-07-2026 16:00 FAIZUDDIN AUTO TEST 030311-A - - 1 16-07-2026 10am - 12pm OK OK - Pending - No View | Cancel" [ref=e656]:
            - cell "28" [ref=e657]
            - cell "SRI67000002" [ref=e658]
            - cell "14-07-2026 16:00" [ref=e659]:
              - text: 14-07-2026
              - text: 16:00
            - cell "FAIZUDDIN AUTO TEST" [ref=e660]
            - cell "030311-A" [ref=e661]
            - cell "-" [ref=e662]
            - cell "-" [ref=e663]
            - cell "1" [ref=e664]
            - cell "16-07-2026" [ref=e665]
            - cell "10am - 12pm" [ref=e666]:
              - text: 10am -
              - text: 12pm
            - cell "OK" [ref=e667]
            - cell "OK" [ref=e668]
            - cell "-" [ref=e669]
            - cell "Pending" [ref=e670]
            - cell "-" [ref=e671]
            - cell [ref=e672]
            - cell "No" [ref=e673]
            - cell "View | Cancel" [ref=e674]:
              - link "View" [ref=e675] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=1e0382e0-4979-4155-a385-c7eca43e86e7&apptId=8224c4e1-6046-4f0d-982c-2c3f0c1100e8
              - text: "|"
              - link "Cancel" [ref=e676] [cursor=pointer]:
                - /url: "#"
          - row "29 SRI67000002 14-07-2026 16:00 FAIZUDDIN AUTO TEST 030311-A - - 1 31-07-2026 10am - 12pm OK OK - Pending - No View | Cancel" [ref=e677]:
            - cell "29" [ref=e678]
            - cell "SRI67000002" [ref=e679]
            - cell "14-07-2026 16:00" [ref=e680]:
              - text: 14-07-2026
              - text: 16:00
            - cell "FAIZUDDIN AUTO TEST" [ref=e681]
            - cell "030311-A" [ref=e682]
            - cell "-" [ref=e683]
            - cell "-" [ref=e684]
            - cell "1" [ref=e685]
            - cell "31-07-2026" [ref=e686]
            - cell "10am - 12pm" [ref=e687]:
              - text: 10am -
              - text: 12pm
            - cell "OK" [ref=e688]
            - cell "OK" [ref=e689]
            - cell "-" [ref=e690]
            - cell "Pending" [ref=e691]
            - cell "-" [ref=e692]
            - cell [ref=e693]
            - cell "No" [ref=e694]
            - cell "View | Cancel" [ref=e695]:
              - link "View" [ref=e696] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=1e0382e0-4979-4155-a385-c7eca43e86e7&apptId=eca30a06-e92b-4529-94f6-3565793f7bcc
              - text: "|"
              - link "Cancel" [ref=e697] [cursor=pointer]:
                - /url: "#"
          - row "30 SRI67000001 14-07-2026 16:00 FAIZUDDIN AUTO TEST 030311-A - - 1 16-07-2026 10am - 12pm OK OK - Pending - No View | Cancel" [ref=e698]:
            - cell "30" [ref=e699]
            - cell "SRI67000001" [ref=e700]
            - cell "14-07-2026 16:00" [ref=e701]:
              - text: 14-07-2026
              - text: 16:00
            - cell "FAIZUDDIN AUTO TEST" [ref=e702]
            - cell "030311-A" [ref=e703]
            - cell "-" [ref=e704]
            - cell "-" [ref=e705]
            - cell "1" [ref=e706]
            - cell "16-07-2026" [ref=e707]
            - cell "10am - 12pm" [ref=e708]:
              - text: 10am -
              - text: 12pm
            - cell "OK" [ref=e709]
            - cell "OK" [ref=e710]
            - cell "-" [ref=e711]
            - cell "Pending" [ref=e712]
            - cell "-" [ref=e713]
            - cell [ref=e714]
            - cell "No" [ref=e715]
            - cell "View | Cancel" [ref=e716]:
              - link "View" [ref=e717] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=32608312-3548-4908-bdc1-9faf86f49018&apptId=1b4f6254-b072-4ef2-8476-8a23a525f8af
              - text: "|"
              - link "Cancel" [ref=e718] [cursor=pointer]:
                - /url: "#"
          - row "31 SRI67000001 14-07-2026 16:00 FAIZUDDIN AUTO TEST 030311-A - - 1 31-07-2026 2pm - 4pm OK OK - Pending - No View | Cancel" [ref=e719]:
            - cell "31" [ref=e720]
            - cell "SRI67000001" [ref=e721]
            - cell "14-07-2026 16:00" [ref=e722]:
              - text: 14-07-2026
              - text: 16:00
            - cell "FAIZUDDIN AUTO TEST" [ref=e723]
            - cell "030311-A" [ref=e724]
            - cell "-" [ref=e725]
            - cell "-" [ref=e726]
            - cell "1" [ref=e727]
            - cell "31-07-2026" [ref=e728]
            - cell "2pm - 4pm" [ref=e729]:
              - text: 2pm -
              - text: 4pm
            - cell "OK" [ref=e730]
            - cell "OK" [ref=e731]
            - cell "-" [ref=e732]
            - cell "Pending" [ref=e733]
            - cell "-" [ref=e734]
            - cell [ref=e735]
            - cell "No" [ref=e736]
            - cell "View | Cancel" [ref=e737]:
              - link "View" [ref=e738] [cursor=pointer]:
                - /url: /uat1/view/bo/service-hub/detail.do?transactionId=32608312-3548-4908-bdc1-9faf86f49018&apptId=b51d9eaf-a3df-4723-90f5-436cd5b65a66
              - text: "|"
              - link "Cancel" [ref=e739] [cursor=pointer]:
                - /url: "#"
  - table [ref=e741]:
    - rowgroup [ref=e742]:
      - row "Home | Menu 2 Pending Transaction Found! Jason Seah, My Account | Logout" [ref=e743]:
        - cell "Home | Menu 2 Pending Transaction Found!" [ref=e744]:
          - generic [ref=e745]:
            - list [ref=e746]:
              - listitem [ref=e747]:
                - link "Home |" [ref=e748] [cursor=pointer]:
                  - /url: /uat1/home/
              - listitem [ref=e749]:
                - link "Menu" [ref=e750] [cursor=pointer]:
                  - /url: "#"
                  - text: Menu
                  - img [ref=e751]
            - generic [ref=e752] [cursor=pointer]: 2 Pending Transaction Found!
        - cell "Jason Seah, My Account | Logout" [ref=e753]:
          - list [ref=e755]:
            - listitem [ref=e756]: Jason Seah,
            - listitem [ref=e757]:
              - link "My Account |" [ref=e758] [cursor=pointer]:
                - /url: /uat1/view/ucd/my-account/view.do?type=Office
            - listitem [ref=e759]:
              - link "Logout" [ref=e760] [cursor=pointer]:
                - /url: "#"
  - img [ref=e762]
  - table [ref=e764]:
    - rowgroup [ref=e765]:
      - row "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e766]:
        - cell [ref=e767]
        - cell "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e768]:
          - text: Best Compatible With Mozilla Firefox V36.0.4
          - text: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
          - link "Contact Us" [ref=e769] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Terms & Conditions" [ref=e770] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Privacy" [ref=e771] [cursor=pointer]:
            - /url: "#"
        - cell [ref=e772]:
          - img [ref=e773]
  - generic [ref=e774]:
    - generic [ref=e775]:
      - generic "Prev" [ref=e776]:
        - generic [ref=e777]: Prev
      - generic "Next" [ref=e778]:
        - generic [ref=e779]: Next
      - generic:
        - combobox [ref=e780]:
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
        - combobox [ref=e781]:
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
    - table [ref=e782]:
      - rowgroup [ref=e783]:
        - row "Su Mo Tu We Th Fr Sa" [ref=e784]:
          - columnheader "Su" [ref=e785]
          - columnheader "Mo" [ref=e786]
          - columnheader "Tu" [ref=e787]
          - columnheader "We" [ref=e788]
          - columnheader "Th" [ref=e789]
          - columnheader "Fr" [ref=e790]
          - columnheader "Sa" [ref=e791]
      - rowgroup [ref=e792]:
        - row "1 2 3 4" [ref=e793]:
          - cell [ref=e794]
          - cell [ref=e795]
          - cell [ref=e796]
          - cell "1" [ref=e797]:
            - link "1" [ref=e798] [cursor=pointer]:
              - /url: "#"
          - cell "2" [ref=e799]:
            - link "2" [ref=e800] [cursor=pointer]:
              - /url: "#"
          - cell "3" [ref=e801]:
            - link "3" [ref=e802] [cursor=pointer]:
              - /url: "#"
          - cell "4" [ref=e803]:
            - link "4" [ref=e804] [cursor=pointer]:
              - /url: "#"
        - row "5 6 7 8 9 10 11" [ref=e805]:
          - cell "5" [ref=e806]:
            - link "5" [ref=e807] [cursor=pointer]:
              - /url: "#"
          - cell "6" [ref=e808]:
            - link "6" [ref=e809] [cursor=pointer]:
              - /url: "#"
          - cell "7" [ref=e810]:
            - link "7" [ref=e811] [cursor=pointer]:
              - /url: "#"
          - cell "8" [ref=e812]:
            - link "8" [ref=e813] [cursor=pointer]:
              - /url: "#"
          - cell "9" [ref=e814]:
            - link "9" [ref=e815] [cursor=pointer]:
              - /url: "#"
          - cell "10" [ref=e816]:
            - link "10" [ref=e817] [cursor=pointer]:
              - /url: "#"
          - cell "11" [ref=e818]:
            - link "11" [ref=e819] [cursor=pointer]:
              - /url: "#"
        - row "12 13 14 15 16 17 18" [ref=e820]:
          - cell "12" [ref=e821]:
            - link "12" [ref=e822] [cursor=pointer]:
              - /url: "#"
          - cell "13" [ref=e823]:
            - link "13" [ref=e824] [cursor=pointer]:
              - /url: "#"
          - cell "14" [ref=e825]:
            - link "14" [ref=e826] [cursor=pointer]:
              - /url: "#"
          - cell "15" [ref=e827]:
            - link "15" [ref=e828] [cursor=pointer]:
              - /url: "#"
          - cell "16" [ref=e829]:
            - link "16" [ref=e830] [cursor=pointer]:
              - /url: "#"
          - cell "17" [ref=e831]:
            - link "17" [ref=e832] [cursor=pointer]:
              - /url: "#"
          - cell "18" [ref=e833]:
            - link "18" [ref=e834] [cursor=pointer]:
              - /url: "#"
        - row "19 20 21 22 23 24 25" [ref=e835]:
          - cell "19" [ref=e836]:
            - link "19" [ref=e837] [cursor=pointer]:
              - /url: "#"
          - cell "20" [ref=e838]:
            - link "20" [ref=e839] [cursor=pointer]:
              - /url: "#"
          - cell "21" [ref=e840]:
            - link "21" [ref=e841] [cursor=pointer]:
              - /url: "#"
          - cell "22" [ref=e842]:
            - link "22" [ref=e843] [cursor=pointer]:
              - /url: "#"
          - cell "23" [ref=e844]:
            - link "23" [ref=e845] [cursor=pointer]:
              - /url: "#"
          - cell "24" [ref=e846]:
            - link "24" [ref=e847] [cursor=pointer]:
              - /url: "#"
          - cell "25" [ref=e848]:
            - link "25" [ref=e849] [cursor=pointer]:
              - /url: "#"
        - row "26 27 28 29 30 31" [ref=e850]:
          - cell "26" [ref=e851]:
            - link "26" [ref=e852] [cursor=pointer]:
              - /url: "#"
          - cell "27" [ref=e853]:
            - link "27" [ref=e854] [cursor=pointer]:
              - /url: "#"
          - cell "28" [ref=e855]:
            - link "28" [ref=e856] [cursor=pointer]:
              - /url: "#"
          - cell "29" [ref=e857]:
            - link "29" [ref=e858] [cursor=pointer]:
              - /url: "#"
          - cell "30" [ref=e859]:
            - link "30" [ref=e860] [cursor=pointer]:
              - /url: "#"
          - cell "31" [ref=e861]:
            - link "31" [ref=e862] [cursor=pointer]:
              - /url: "#"
          - cell [ref=e863]
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