# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: add-appointment-bo.spec.ts >> Add Appointment (BO) >> Add Appointment - Partial Booking Call-in
- Location: tests\service-hub\specs\add-appointment-bo.spec.ts:78:7

# Error details

```
TimeoutError: locator.textContent: Timeout 10000ms exceeded.
Call log:
  - waiting for locator('table').first().locator('tbody tr').first().locator('td').nth(1)

```

# Page snapshot

```yaml
- generic [active] [ref=e1]:
  - table [ref=e3]:
    - rowgroup [ref=e4]:
      - row [ref=e5]:
        - cell [ref=e6]:
          - generic [ref=e7]: Good Morning, Jason Seah
          - table [ref=e9]:
            - rowgroup [ref=e10]:
              - row [ref=e11]:
                - cell "Account Management Manage Company Accounts Manage Backoffice User Accounts View UCD User Accounts Manage Bank/Credit Company Accounts Manage Bank/Credit Company User Accounts Manage Bank/Credit Company IP Whitelist Company Account Listing (Limited Features For UCD To UCD) Manage AATF/PBT Account Manage e-Invoice Setup Company Listing" [ref=e12]:
                  - table [ref=e14]:
                    - rowgroup [ref=e15]:
                      - row "Account Management Manage Company Accounts Manage Backoffice User Accounts View UCD User Accounts Manage Bank/Credit Company Accounts Manage Bank/Credit Company User Accounts Manage Bank/Credit Company IP Whitelist Company Account Listing (Limited Features For UCD To UCD) Manage AATF/PBT Account Manage e-Invoice Setup Company Listing" [ref=e16]:
                        - cell [ref=e17]:
                          - img [ref=e18]
                        - cell "Account Management Manage Company Accounts Manage Backoffice User Accounts View UCD User Accounts Manage Bank/Credit Company Accounts Manage Bank/Credit Company User Accounts Manage Bank/Credit Company IP Whitelist Company Account Listing (Limited Features For UCD To UCD) Manage AATF/PBT Account Manage e-Invoice Setup Company Listing" [ref=e19]:
                          - text: Account Management
                          - list [ref=e20]:
                            - listitem [ref=e21]:
                              - img [ref=e22]
                              - link "Manage Company Accounts" [ref=e23] [cursor=pointer]:
                                - /url: /uat1/view/account/company
                            - listitem [ref=e24]:
                              - img [ref=e25]
                              - link "Manage Backoffice User Accounts" [ref=e26] [cursor=pointer]:
                                - /url: /uat1/view/account/user
                            - listitem [ref=e27]:
                              - img [ref=e28]
                              - link "View UCD User Accounts" [ref=e29] [cursor=pointer]:
                                - /url: /uat1/view/account/user/ucd
                            - listitem [ref=e30]:
                              - img [ref=e31]
                              - link "Manage Bank/Credit Company Accounts" [ref=e32] [cursor=pointer]:
                                - /url: /uat1/view/credit-account/company
                            - listitem [ref=e33]:
                              - img [ref=e34]
                              - link "Manage Bank/Credit Company User Accounts" [ref=e35] [cursor=pointer]:
                                - /url: /uat1/view/credit-account/user
                            - listitem [ref=e36]:
                              - img [ref=e37]
                              - link "Manage Bank/Credit Company IP Whitelist" [ref=e38] [cursor=pointer]:
                                - /url: /uat1/view/credit-account/ipwhitelist
                            - listitem [ref=e39]:
                              - img [ref=e40]
                              - link "Company Account Listing (Limited Features For UCD To UCD)" [ref=e41] [cursor=pointer]:
                                - /url: /uat1/view/account/company/limited-features-ucd-to-ucd
                            - listitem [ref=e42]:
                              - img [ref=e43]
                              - link "Manage AATF/PBT Account" [ref=e44] [cursor=pointer]:
                                - /url: /uat1/view/account/dereg/aatf
                            - listitem [ref=e45]:
                              - img [ref=e46]
                              - link "Manage e-Invoice Setup Company Listing" [ref=e47] [cursor=pointer]:
                                - /url: /uat1/view/einvoice/company
                - cell "Reports JPJ Reports Account Balance Summary Account Balance Summary (Month / Year) Account Deposit / Adjustment Report Company POB Balance Report POB Payment Report Statement of Account (UCD) Transaction Summary Report Transaction Summary Report (State) Vehicle Movement Report (UCD) Interim Payment Report Reset Payment Report Inter-Branch Transfer History Report" [ref=e48]:
                  - table [ref=e50]:
                    - rowgroup [ref=e51]:
                      - row "Reports JPJ Reports Account Balance Summary Account Balance Summary (Month / Year) Account Deposit / Adjustment Report Company POB Balance Report POB Payment Report Statement of Account (UCD) Transaction Summary Report Transaction Summary Report (State) Vehicle Movement Report (UCD) Interim Payment Report Reset Payment Report Inter-Branch Transfer History Report" [ref=e52]:
                        - cell [ref=e53]:
                          - img [ref=e54]
                        - cell "Reports JPJ Reports Account Balance Summary Account Balance Summary (Month / Year) Account Deposit / Adjustment Report Company POB Balance Report POB Payment Report Statement of Account (UCD) Transaction Summary Report Transaction Summary Report (State) Vehicle Movement Report (UCD) Interim Payment Report Reset Payment Report Inter-Branch Transfer History Report" [ref=e55]:
                          - text: Reports
                          - list [ref=e56]:
                            - listitem [ref=e57]:
                              - img [ref=e58]
                              - link "JPJ Reports" [ref=e59] [cursor=pointer]:
                                - /url: /uat1/view/jpj/report/payment/report.do?type=Office
                            - listitem [ref=e60]:
                              - img [ref=e61]
                              - link "Account Balance Summary" [ref=e62] [cursor=pointer]:
                                - /url: /uat1/view/report/account-balance-summary/index.jsp
                            - listitem [ref=e63]:
                              - img [ref=e64]
                              - link "Account Balance Summary (Month / Year)" [ref=e65] [cursor=pointer]:
                                - /url: /uat1/view/report/account-balance-summary-month-year/index.jsp
                            - listitem [ref=e66]:
                              - img [ref=e67]
                              - link "Account Deposit / Adjustment Report" [ref=e68] [cursor=pointer]:
                                - /url: /uat1/view/report/account-deposit-adjustment/index.jsp
                            - listitem [ref=e69]:
                              - img [ref=e70]
                              - link "Company POB Balance Report" [ref=e71] [cursor=pointer]:
                                - /url: /uat1/view/report/company-pob-balance-report/index.jsp
                            - listitem [ref=e72]:
                              - img [ref=e73]
                              - link "POB Payment Report" [ref=e74] [cursor=pointer]:
                                - /url: /uat1/view/report/POB-payment-report/index.jsp
                            - listitem [ref=e75]:
                              - img [ref=e76]
                              - link "Statement of Account (UCD)" [ref=e77] [cursor=pointer]:
                                - /url: /uat1/view/report/statement-of-account/index.jsp
                            - listitem [ref=e78]:
                              - img [ref=e79]
                              - link "Transaction Summary Report" [ref=e80] [cursor=pointer]:
                                - /url: /uat1/view/report/tx-summary-report
                            - listitem [ref=e81]:
                              - img [ref=e82]
                              - link "Transaction Summary Report (State)" [ref=e83] [cursor=pointer]:
                                - /url: /uat1/view/report/tx-summary-report-state
                            - listitem [ref=e84]:
                              - img [ref=e85]
                              - link "Vehicle Movement Report (UCD)" [ref=e86] [cursor=pointer]:
                                - /url: /uat1/view/report/vehicle-movement-report
                            - listitem [ref=e87]:
                              - img [ref=e88]
                              - link "Interim Payment Report" [ref=e89] [cursor=pointer]:
                                - /url: /uat1/view/report/interim-payment-report
                            - listitem [ref=e90]:
                              - img [ref=e91]
                              - link "Reset Payment Report" [ref=e92] [cursor=pointer]:
                                - /url: /uat1/view/report/reset-payment-report
                            - listitem [ref=e93]:
                              - img [ref=e94]
                              - link "Inter-Branch Transfer History Report" [ref=e95] [cursor=pointer]:
                                - /url: /uat1/view/report/inter-branch-transfer/index.jsp
                - cell "Insurance Insurance Permission Listing Insurance User Permission Log Endorsement Insurance Transaction Listing Insurance Payment Transaction Upload Insurance e-Certificate Insurance Quote Enquiry Refer Risk Log Insurance Payment OTP Log" [ref=e96]:
                  - table [ref=e98]:
                    - rowgroup [ref=e99]:
                      - row "Insurance Insurance Permission Listing Insurance User Permission Log Endorsement Insurance Transaction Listing Insurance Payment Transaction Upload Insurance e-Certificate Insurance Quote Enquiry Refer Risk Log Insurance Payment OTP Log" [ref=e100]:
                        - cell [ref=e101]:
                          - img [ref=e102]
                        - cell "Insurance Insurance Permission Listing Insurance User Permission Log Endorsement Insurance Transaction Listing Insurance Payment Transaction Upload Insurance e-Certificate Insurance Quote Enquiry Refer Risk Log Insurance Payment OTP Log" [ref=e103]:
                          - text: Insurance
                          - list [ref=e104]:
                            - listitem [ref=e105]:
                              - img [ref=e106]
                              - link "Insurance Permission Listing" [ref=e107] [cursor=pointer]:
                                - /url: /uat1/view/insurance/insurance-permission-listing
                            - listitem [ref=e108]:
                              - img [ref=e109]
                              - link "Insurance User Permission Log" [ref=e110] [cursor=pointer]:
                                - /url: /uat1/view/insurance/user-permission-log
                            - listitem [ref=e111]:
                              - img [ref=e112]
                              - link "Endorsement" [ref=e113] [cursor=pointer]:
                                - /url: /uat1/view/insurance/endorsement
                            - listitem [ref=e114]:
                              - img [ref=e115]
                              - link "Insurance Transaction Listing" [ref=e116] [cursor=pointer]:
                                - /url: /uat1/view/insurance/enquiry
                            - listitem [ref=e117]:
                              - img [ref=e118]
                              - link "Insurance Payment Transaction" [ref=e119] [cursor=pointer]:
                                - /url: /uat1/view/insurance/insurance-payment-transaction
                            - listitem [ref=e120]:
                              - img [ref=e121]
                              - link "Upload Insurance e-Certificate" [ref=e122] [cursor=pointer]:
                                - /url: /uat1/view/insurance/insurance-upload-ecertificate
                            - listitem [ref=e123]:
                              - img [ref=e124]
                              - link "Insurance Quote Enquiry" [ref=e125] [cursor=pointer]:
                                - /url: /uat1/view/insurance/insurance-quote-enquiry
                            - listitem [ref=e126]:
                              - img [ref=e127]
                              - link "Refer Risk Log" [ref=e128] [cursor=pointer]:
                                - /url: /uat1/view/insurance/refer-risk-log
                            - listitem [ref=e129]:
                              - img [ref=e130]
                              - link "Insurance Payment OTP Log" [ref=e131] [cursor=pointer]:
                                - /url: /uat1/view/insurance/otp-payment-log
                - cell "Onboarding UCD New Application UCD Application Listing UCD Pre-Application Listing UCD Application Audit Log UCD Pre-Application Audit Log" [ref=e132]:
                  - table [ref=e134]:
                    - rowgroup [ref=e135]:
                      - row "Onboarding UCD New Application UCD Application Listing UCD Pre-Application Listing UCD Application Audit Log UCD Pre-Application Audit Log" [ref=e136]:
                        - cell [ref=e137]:
                          - img [ref=e138]
                        - cell "Onboarding UCD New Application UCD Application Listing UCD Pre-Application Listing UCD Application Audit Log UCD Pre-Application Audit Log" [ref=e139]:
                          - text: Onboarding
                          - list [ref=e140]:
                            - listitem [ref=e141]:
                              - img [ref=e142]
                              - link "UCD New Application" [ref=e143] [cursor=pointer]:
                                - /url: /uat1/view/backoffice/support/onboarding/view.do
                            - listitem [ref=e144]:
                              - img [ref=e145]
                              - link "UCD Application Listing" [ref=e146] [cursor=pointer]:
                                - /url: "#"
                            - listitem [ref=e147]:
                              - img [ref=e148]
                              - link "UCD Pre-Application Listing" [ref=e149] [cursor=pointer]:
                                - /url: "#"
                            - listitem [ref=e150]:
                              - img [ref=e151]
                              - link "UCD Application Audit Log" [ref=e152] [cursor=pointer]:
                                - /url: "#"
                            - listitem [ref=e153]:
                              - img [ref=e154]
                              - link "UCD Pre-Application Audit Log" [ref=e155] [cursor=pointer]:
                                - /url: "#"
              - row "DEMO SYSTEM!! DEMO SYSTEM!! DEMO SYSTEM!!" [ref=e156]:
                - cell "DEMO SYSTEM!! DEMO SYSTEM!! DEMO SYSTEM!!" [ref=e157]:
                  - generic [ref=e158]: DEMO SYSTEM!! DEMO SYSTEM!! DEMO SYSTEM!!
              - row [ref=e159]:
                - cell "Transactions Relevant STMS Transaction APT Transaction eSTM Transaction Deregistration Transaction Jomcheck Transaction SSM Transaction eDereg Pre-Checking Transaction Company Business Document Listing" [ref=e160]:
                  - table [ref=e162]:
                    - rowgroup [ref=e163]:
                      - row "Transactions Relevant STMS Transaction APT Transaction eSTM Transaction Deregistration Transaction Jomcheck Transaction SSM Transaction eDereg Pre-Checking Transaction Company Business Document Listing" [ref=e164]:
                        - cell [ref=e165]:
                          - img [ref=e166]
                        - cell "Transactions Relevant STMS Transaction APT Transaction eSTM Transaction Deregistration Transaction Jomcheck Transaction SSM Transaction eDereg Pre-Checking Transaction Company Business Document Listing" [ref=e167]:
                          - text: Transactions Relevant
                          - list [ref=e168]:
                            - listitem [ref=e169]:
                              - img [ref=e170]
                              - link "STMS Transaction" [ref=e171] [cursor=pointer]:
                                - /url: /uat1/view/stms/enquiry
                            - listitem [ref=e172]:
                              - img [ref=e173]
                              - link "APT Transaction" [ref=e174] [cursor=pointer]:
                                - /url: /uat1/view/apt/enquiry
                            - listitem [ref=e175]:
                              - img [ref=e176]
                              - link "eSTM Transaction" [ref=e177] [cursor=pointer]:
                                - /url: /uat1/view/estm/enquiry
                            - listitem [ref=e178]:
                              - img [ref=e179]
                              - link "Deregistration Transaction" [ref=e180] [cursor=pointer]:
                                - /url: /uat1/view/dereg/enquiry/main.do
                            - listitem [ref=e181]:
                              - img [ref=e182]
                              - link "Jomcheck Transaction" [ref=e183] [cursor=pointer]:
                                - /url: /uat1/view/jomcheck/enquiry
                            - listitem [ref=e184]:
                              - img [ref=e185]
                              - link "SSM Transaction" [ref=e186] [cursor=pointer]:
                                - /url: /uat1/view/ssm/enquiry
                            - listitem [ref=e187]:
                              - img [ref=e188]
                              - link "eDereg Pre-Checking Transaction" [ref=e189] [cursor=pointer]:
                                - /url: /uat1/view/dereg/precheck/enquiry/main.do
                            - listitem [ref=e190]:
                              - img [ref=e191]
                              - link "Company Business Document Listing" [ref=e192] [cursor=pointer]:
                                - /url: /uat1/view/system/company-business-document-listing/main.do
                - cell "eAuto Plus Relevant BMK Transaction RHB Payment Transaction (eAuto Plus)" [ref=e193]:
                  - table [ref=e195]:
                    - rowgroup [ref=e196]:
                      - row "eAuto Plus Relevant BMK Transaction RHB Payment Transaction (eAuto Plus)" [ref=e197]:
                        - cell [ref=e198]:
                          - img [ref=e199]
                        - cell "eAuto Plus Relevant BMK Transaction RHB Payment Transaction (eAuto Plus)" [ref=e200]:
                          - text: eAuto Plus Relevant
                          - list [ref=e201]:
                            - listitem [ref=e202]:
                              - img [ref=e203]
                              - link "BMK Transaction" [ref=e204] [cursor=pointer]:
                                - /url: /uat1/view/bmk/enquiry/main.do
                            - listitem [ref=e205]:
                              - img [ref=e206]
                              - link "RHB Payment Transaction (eAuto Plus)" [ref=e207] [cursor=pointer]:
                                - /url: /uat1/view/payment/rhb-payment-transaction/plus
                - cell "Support Tools STMS Transaction Support Audit Log (STMS, APT & eSTM) Audit Trail Log Company Account Audit Log Backoffice User Account Audit Log Blacklist Company ROC, MyKad No. & Vehicle No. Audit Log Pending/Failed APT Transaction Audit Log Pending STMS, APT & eSTM Audit Log RHB Reconciliation Audit Log JPJ Hasil Audit Log Resubmit Pending STMS, APT & eSTM Manual APT Trigger Manage Pending/Failed APT Transaction eSTM Transaction JPJ Enquiry JPJ Enquiry (New) Bulk STMS Cancellation Bulk STMS Cancellation Audit Log Resubmit JPJ Final Submission (STMS) Resubmit JPJ Final Submission (eSTM) Resubmit JPJ Final Submission (eDereg Pre-Checking)" [ref=e208]:
                  - table [ref=e210]:
                    - rowgroup [ref=e211]:
                      - row "Support Tools STMS Transaction Support Audit Log (STMS, APT & eSTM) Audit Trail Log Company Account Audit Log Backoffice User Account Audit Log Blacklist Company ROC, MyKad No. & Vehicle No. Audit Log Pending/Failed APT Transaction Audit Log Pending STMS, APT & eSTM Audit Log RHB Reconciliation Audit Log JPJ Hasil Audit Log Resubmit Pending STMS, APT & eSTM Manual APT Trigger Manage Pending/Failed APT Transaction eSTM Transaction JPJ Enquiry JPJ Enquiry (New) Bulk STMS Cancellation Bulk STMS Cancellation Audit Log Resubmit JPJ Final Submission (STMS) Resubmit JPJ Final Submission (eSTM) Resubmit JPJ Final Submission (eDereg Pre-Checking)" [ref=e212]:
                        - cell [ref=e213]:
                          - img [ref=e214]
                        - cell "Support Tools STMS Transaction Support Audit Log (STMS, APT & eSTM) Audit Trail Log Company Account Audit Log Backoffice User Account Audit Log Blacklist Company ROC, MyKad No. & Vehicle No. Audit Log Pending/Failed APT Transaction Audit Log Pending STMS, APT & eSTM Audit Log RHB Reconciliation Audit Log JPJ Hasil Audit Log Resubmit Pending STMS, APT & eSTM Manual APT Trigger Manage Pending/Failed APT Transaction eSTM Transaction JPJ Enquiry JPJ Enquiry (New) Bulk STMS Cancellation Bulk STMS Cancellation Audit Log Resubmit JPJ Final Submission (STMS) Resubmit JPJ Final Submission (eSTM) Resubmit JPJ Final Submission (eDereg Pre-Checking)" [ref=e215]:
                          - text: Support Tools
                          - list [ref=e216]:
                            - listitem [ref=e217]:
                              - img [ref=e218]
                              - link "STMS Transaction" [ref=e219] [cursor=pointer]:
                                - /url: /uat1/view/support/stms/
                            - listitem [ref=e220]:
                              - img [ref=e221]
                              - link "Support Audit Log (STMS, APT & eSTM)" [ref=e222] [cursor=pointer]:
                                - /url: /uat1/view/support/support-audit-log/
                            - listitem [ref=e223]:
                              - img [ref=e224]
                              - link "Audit Trail Log" [ref=e225] [cursor=pointer]:
                                - /url: /uat1/view/report/audit-log
                            - listitem [ref=e226]:
                              - img [ref=e227]
                              - link "Company Account Audit Log" [ref=e228] [cursor=pointer]:
                                - /url: /uat1/view/report/company-audit-log
                            - listitem [ref=e229]:
                              - img [ref=e230]
                              - link "Backoffice User Account Audit Log" [ref=e231] [cursor=pointer]:
                                - /url: /uat1/view/report/backoffice-user-audit-log
                            - listitem [ref=e232]:
                              - img [ref=e233]
                              - link "Blacklist Company ROC, MyKad No. & Vehicle No. Audit Log" [ref=e234] [cursor=pointer]:
                                - /url: /uat1/view/report/blacklist-audit-log
                            - listitem [ref=e235]:
                              - img [ref=e236]
                              - link "Pending/Failed APT Transaction Audit Log" [ref=e237] [cursor=pointer]:
                                - /url: /uat1/view/apt/resubmission-audit-log/
                            - listitem [ref=e238]:
                              - img [ref=e239]
                              - link "Pending STMS, APT & eSTM Audit Log" [ref=e240] [cursor=pointer]:
                                - /url: /uat1/view/support/incomplete-txn-auditlog/
                            - listitem [ref=e241]:
                              - img [ref=e242]
                              - link "RHB Reconciliation Audit Log" [ref=e243] [cursor=pointer]:
                                - /url: /uat1/view/report/rhb-reconciliation-audit-log/
                            - listitem [ref=e244]:
                              - img [ref=e245]
                              - link "JPJ Hasil Audit Log" [ref=e246] [cursor=pointer]:
                                - /url: /uat1/view/report/jpj-audit-log/
                            - listitem [ref=e247]:
                              - img [ref=e248]
                              - link "Resubmit Pending STMS, APT & eSTM" [ref=e249] [cursor=pointer]:
                                - /url: /uat1/view/support/incomplete-txn/
                            - listitem [ref=e250]:
                              - img [ref=e251]
                              - link "Manual APT Trigger" [ref=e252] [cursor=pointer]:
                                - /url: /uat1/view/stms/manual-trigger-apt
                            - listitem [ref=e253]:
                              - img [ref=e254]
                              - link "Manage Pending/Failed APT Transaction" [ref=e255] [cursor=pointer]:
                                - /url: /uat1/view/apt/enquiry/pending-or-failed
                            - listitem [ref=e256]:
                              - img [ref=e257]
                              - link "eSTM Transaction" [ref=e258] [cursor=pointer]:
                                - /url: /uat1/view/support/estm/
                            - listitem [ref=e259]:
                              - img [ref=e260]
                              - link "JPJ Enquiry" [ref=e261] [cursor=pointer]:
                                - /url: /uat1/view/system/manual-jpj-enquiry/
                            - listitem [ref=e262]:
                              - img [ref=e263]
                              - link "JPJ Enquiry (New)" [ref=e264] [cursor=pointer]:
                                - /url: /uat1/view/system/new-manual-jpj-enquiry/
                            - listitem [ref=e265]:
                              - img [ref=e266]
                              - link "Bulk STMS Cancellation" [ref=e267] [cursor=pointer]:
                                - /url: /uat1/view/support/bulk-stms-cancellation/
                            - listitem [ref=e268]:
                              - img [ref=e269]
                              - link "Bulk STMS Cancellation Audit Log" [ref=e270] [cursor=pointer]:
                                - /url: /uat1/view/support/bulk-stms-cancellation-auditlog/
                            - listitem [ref=e271]:
                              - img [ref=e272]
                              - link "Resubmit JPJ Final Submission (STMS)" [ref=e273] [cursor=pointer]:
                                - /url: /uat1/view/backoffice/jpj/resubmission/stms/view.do
                            - listitem [ref=e274]:
                              - img [ref=e275]
                              - link "Resubmit JPJ Final Submission (eSTM)" [ref=e276] [cursor=pointer]:
                                - /url: /uat1/view/backoffice/jpj/resubmission/estm/view.do
                            - listitem [ref=e277]:
                              - img [ref=e278]
                              - link "Resubmit JPJ Final Submission (eDereg Pre-Checking)" [ref=e279] [cursor=pointer]:
                                - /url: /uat1/view/dereg/precheck/enquiry/resubmission/view.do
                - cell "Proforma Invoice / e-Invoice Generate Proforma Invoice Proforma Invoice / e-Invoice Listing Credit Note Listing Biometric Device Purchase & Software Installation Listing" [ref=e280]:
                  - table [ref=e282]:
                    - rowgroup [ref=e283]:
                      - row "Proforma Invoice / e-Invoice Generate Proforma Invoice Proforma Invoice / e-Invoice Listing Credit Note Listing Biometric Device Purchase & Software Installation Listing" [ref=e284]:
                        - cell [ref=e285]:
                          - img [ref=e286]
                        - cell "Proforma Invoice / e-Invoice Generate Proforma Invoice Proforma Invoice / e-Invoice Listing Credit Note Listing Biometric Device Purchase & Software Installation Listing" [ref=e287]:
                          - text: Proforma Invoice / e-Invoice
                          - list [ref=e288]:
                            - listitem [ref=e289]:
                              - img [ref=e290]
                              - link "Generate Proforma Invoice" [ref=e291] [cursor=pointer]:
                                - /url: /uat1/view/proformainvoice/main/new.do
                            - listitem [ref=e292]:
                              - img [ref=e293]
                              - link "Proforma Invoice / e-Invoice Listing" [ref=e294] [cursor=pointer]:
                                - /url: /uat1/view/proformainvoice/enquiry/
                            - listitem [ref=e295]:
                              - img [ref=e296]
                              - link "Credit Note Listing" [ref=e297] [cursor=pointer]:
                                - /url: /uat1/view/creditnote/enquiry/main.do
                            - listitem [ref=e298]:
                              - img [ref=e299]
                              - link "Biometric Device Purchase & Software Installation Listing" [ref=e300] [cursor=pointer]:
                                - /url: /uat1/view/bo/service-hub/listing/main.do
              - row [ref=e301]:
                - cell "Settings RHB Payment Transaction 1 Layer Permission Listing 2 Layer Permission Setup eLKM Permission Listing eLKM Permission Log Blacklist Company ROC (STMS & eSTM) Blacklist MyKad No. (STMS & eSTM) Blacklist MyKad No. (UCD User) Blacklist Vehicle No." [ref=e302]:
                  - table [ref=e304]:
                    - rowgroup [ref=e305]:
                      - row "Settings RHB Payment Transaction 1 Layer Permission Listing 2 Layer Permission Setup eLKM Permission Listing eLKM Permission Log Blacklist Company ROC (STMS & eSTM) Blacklist MyKad No. (STMS & eSTM) Blacklist MyKad No. (UCD User) Blacklist Vehicle No." [ref=e306]:
                        - cell [ref=e307]:
                          - img [ref=e308]
                        - cell "Settings RHB Payment Transaction 1 Layer Permission Listing 2 Layer Permission Setup eLKM Permission Listing eLKM Permission Log Blacklist Company ROC (STMS & eSTM) Blacklist MyKad No. (STMS & eSTM) Blacklist MyKad No. (UCD User) Blacklist Vehicle No." [ref=e309]:
                          - text: Settings
                          - list [ref=e310]:
                            - listitem [ref=e311]:
                              - img [ref=e312]
                              - link "RHB Payment Transaction" [ref=e313] [cursor=pointer]:
                                - /url: /uat1/view/payment/rhb-payment-transaction
                            - listitem [ref=e314]:
                              - img [ref=e315]
                              - link "1 Layer Permission Listing" [ref=e316] [cursor=pointer]:
                                - /url: /uat1/view/estm/estm-user-permission-layer1
                            - listitem [ref=e317]:
                              - img [ref=e318]
                              - link "2 Layer Permission Setup" [ref=e319] [cursor=pointer]:
                                - /url: /uat1/view/estm/estm-user-permission
                            - listitem [ref=e320]:
                              - img [ref=e321]
                              - link "eLKM Permission Listing" [ref=e322] [cursor=pointer]:
                                - /url: /uat1/view/estm/lkm/lkm-user-permission
                            - listitem [ref=e323]:
                              - img [ref=e324]
                              - link "eLKM Permission Log" [ref=e325] [cursor=pointer]:
                                - /url: /uat1/view/estm/lkm/lkm-user-permission-log
                            - listitem [ref=e326]:
                              - img [ref=e327]
                              - link "Blacklist Company ROC (STMS & eSTM)" [ref=e328] [cursor=pointer]:
                                - /url: /uat1/view/account/blacklisted/companyroc
                            - listitem [ref=e329]:
                              - img [ref=e330]
                              - link "Blacklist MyKad No. (STMS & eSTM)" [ref=e331] [cursor=pointer]:
                                - /url: /uat1/view/account/blacklisted/mykad
                            - listitem [ref=e332]:
                              - img [ref=e333]
                              - link "Blacklist MyKad No. (UCD User)" [ref=e334] [cursor=pointer]:
                                - /url: /uat1/view/account/blacklisted/mykad-add-ucd-user
                            - listitem [ref=e335]:
                              - img [ref=e336]
                              - link "Blacklist Vehicle No." [ref=e337] [cursor=pointer]:
                                - /url: /uat1/view/account/blacklisted/vehicle
                - cell "Settings (Hub Admin) Manual Payment Processing (STMS, APT, eSTM) JPJ XML Log (APT) JPJ XML Log (STMS) JPJ XML Log (ESTM) JPJ XML Log (Deregistration) JPJ XML Log (eDereg Pre-Checking) SSM XML Log Generate Batch Invoice (STMS, APT, eSTM) Estm User Permission Log Change Director Log Customize Display Message Public Holidays Bulk Submission Setup (JPJ Enquiry, Payment) Bulk Submission Setup (JPJ Enquiry, Payment) Audit Log Bulk Submission Control for System Maintenance Bypass Purchase SSM (STMS & eSTM) JomCheck Report Listing Bypass Purchase SSM (STMS & eSTM) Audit Log" [ref=e338]:
                  - table [ref=e340]:
                    - rowgroup [ref=e341]:
                      - row "Settings (Hub Admin) Manual Payment Processing (STMS, APT, eSTM) JPJ XML Log (APT) JPJ XML Log (STMS) JPJ XML Log (ESTM) JPJ XML Log (Deregistration) JPJ XML Log (eDereg Pre-Checking) SSM XML Log Generate Batch Invoice (STMS, APT, eSTM) Estm User Permission Log Change Director Log Customize Display Message Public Holidays Bulk Submission Setup (JPJ Enquiry, Payment) Bulk Submission Setup (JPJ Enquiry, Payment) Audit Log Bulk Submission Control for System Maintenance Bypass Purchase SSM (STMS & eSTM) JomCheck Report Listing Bypass Purchase SSM (STMS & eSTM) Audit Log" [ref=e342]:
                        - cell [ref=e343]:
                          - img [ref=e344]
                        - cell "Settings (Hub Admin) Manual Payment Processing (STMS, APT, eSTM) JPJ XML Log (APT) JPJ XML Log (STMS) JPJ XML Log (ESTM) JPJ XML Log (Deregistration) JPJ XML Log (eDereg Pre-Checking) SSM XML Log Generate Batch Invoice (STMS, APT, eSTM) Estm User Permission Log Change Director Log Customize Display Message Public Holidays Bulk Submission Setup (JPJ Enquiry, Payment) Bulk Submission Setup (JPJ Enquiry, Payment) Audit Log Bulk Submission Control for System Maintenance Bypass Purchase SSM (STMS & eSTM) JomCheck Report Listing Bypass Purchase SSM (STMS & eSTM) Audit Log" [ref=e345]:
                          - text: Settings (Hub Admin)
                          - list [ref=e346]:
                            - listitem [ref=e347]:
                              - img [ref=e348]
                              - link "Manual Payment Processing (STMS, APT, eSTM)" [ref=e349] [cursor=pointer]:
                                - /url: /uat1/view/stms/file/
                            - listitem [ref=e350]:
                              - img [ref=e351]
                              - link "JPJ XML Log (APT)" [ref=e352] [cursor=pointer]:
                                - /url: /uat1/view/apt/jpj/log
                            - listitem [ref=e353]:
                              - img [ref=e354]
                              - link "JPJ XML Log (STMS)" [ref=e355] [cursor=pointer]:
                                - /url: /uat1/view/stms/jpj/log
                            - listitem [ref=e356]:
                              - img [ref=e357]
                              - link "JPJ XML Log (ESTM)" [ref=e358] [cursor=pointer]:
                                - /url: /uat1/view/estm/jpj/log
                            - listitem [ref=e359]:
                              - img [ref=e360]
                              - link "JPJ XML Log (Deregistration)" [ref=e361] [cursor=pointer]:
                                - /url: /uat1/view/dereg/jpj/log
                            - listitem [ref=e362]:
                              - img [ref=e363]
                              - link "JPJ XML Log (eDereg Pre-Checking)" [ref=e364] [cursor=pointer]:
                                - /url: /uat1/view/dereg/precheck/jpj/log/main.do
                            - listitem [ref=e365]:
                              - img [ref=e366]
                              - link "SSM XML Log" [ref=e367] [cursor=pointer]:
                                - /url: /uat1/view/ssm/xml-log
                            - listitem [ref=e368]:
                              - img [ref=e369]
                              - link "Generate Batch Invoice (STMS, APT, eSTM)" [ref=e370] [cursor=pointer]:
                                - /url: /uat1/view/stms/export-tax-invoice
                            - listitem [ref=e371]:
                              - img [ref=e372]
                              - link "Estm User Permission Log" [ref=e373] [cursor=pointer]:
                                - /url: /uat1/view/estm/estm-user-permission-log
                            - listitem [ref=e374]:
                              - img [ref=e375]
                              - link "Change Director Log" [ref=e376] [cursor=pointer]:
                                - /url: /uat1/view/account/change-director-log
                            - listitem [ref=e377]:
                              - img [ref=e378]
                              - link "Customize Display Message" [ref=e379] [cursor=pointer]:
                                - /url: /uat1/view/system/display-messages
                            - listitem [ref=e380]:
                              - img [ref=e381]
                              - link "Public Holidays" [ref=e382] [cursor=pointer]:
                                - /url: /uat1/view/system/public-holiday/index.jsp
                            - listitem [ref=e383]:
                              - img [ref=e384]
                              - link "Bulk Submission Setup (JPJ Enquiry, Payment)" [ref=e385] [cursor=pointer]:
                                - /url: /uat1/view/bulk-submission-setup
                            - listitem [ref=e386]:
                              - img [ref=e387]
                              - link "Bulk Submission Setup (JPJ Enquiry, Payment) Audit Log" [ref=e388] [cursor=pointer]:
                                - /url: /uat1/view/report/bulk-submission-setup-audit-log
                            - listitem [ref=e389]:
                              - img [ref=e390]
                              - link "Bulk Submission Control for System Maintenance" [ref=e391] [cursor=pointer]:
                                - /url: /uat1/view/bulk-submission-control
                            - listitem [ref=e392]:
                              - img [ref=e393]
                              - link "Bypass Purchase SSM (STMS & eSTM)" [ref=e394] [cursor=pointer]:
                                - /url: /uat1/view/bypass-purchase-ssm/view.do
                            - listitem [ref=e395]:
                              - img [ref=e396]
                              - link "JomCheck Report Listing" [ref=e397] [cursor=pointer]:
                                - /url: /uat1/view/jomcheck/report-listing/index.do
                            - listitem [ref=e398]:
                              - img [ref=e399]
                              - link "Bypass Purchase SSM (STMS & eSTM) Audit Log" [ref=e400] [cursor=pointer]:
                                - /url: /uat1/view/bypass-purchase-ssm/audit-log.do
                - cell "JPJ Reports eAuto Reconciliation Summary Report eAuto STMS, APT and eSTM Transaction Listing eAuto Reconciliation Summary Report (eAuto Plus) eAuto BMK, HTM dan eLKM Transaction Listing eAuto eDereg Pre-Checking Transaction Listing eAuto Reconciliation Summary Listing JPJ Reconciliation Report (HASIL) JPJ eSTM Report (HASIL)" [ref=e401]:
                  - table [ref=e403]:
                    - rowgroup [ref=e404]:
                      - row "JPJ Reports eAuto Reconciliation Summary Report eAuto STMS, APT and eSTM Transaction Listing eAuto Reconciliation Summary Report (eAuto Plus) eAuto BMK, HTM dan eLKM Transaction Listing eAuto eDereg Pre-Checking Transaction Listing eAuto Reconciliation Summary Listing JPJ Reconciliation Report (HASIL) JPJ eSTM Report (HASIL)" [ref=e405]:
                        - cell [ref=e406]:
                          - img [ref=e407]
                        - cell "JPJ Reports eAuto Reconciliation Summary Report eAuto STMS, APT and eSTM Transaction Listing eAuto Reconciliation Summary Report (eAuto Plus) eAuto BMK, HTM dan eLKM Transaction Listing eAuto eDereg Pre-Checking Transaction Listing eAuto Reconciliation Summary Listing JPJ Reconciliation Report (HASIL) JPJ eSTM Report (HASIL)" [ref=e408]:
                          - text: JPJ Reports
                          - list [ref=e409]:
                            - listitem [ref=e410]:
                              - img [ref=e411]
                              - link "eAuto Reconciliation Summary Report" [ref=e412] [cursor=pointer]:
                                - /url: /uat1/view/jpj/report/reconcile-v2/eauto-report.jsp
                            - listitem [ref=e413]:
                              - img [ref=e414]
                              - link "eAuto STMS, APT and eSTM Transaction Listing" [ref=e415] [cursor=pointer]:
                                - /url: /uat1/view/jpj/report/stms-apt-estm/list.do
                            - listitem [ref=e416]:
                              - img [ref=e417]
                              - link "eAuto Reconciliation Summary Report (eAuto Plus)" [ref=e418] [cursor=pointer]:
                                - /url: /uat1/view/jpj/report/reconcile-plus/eauto-report.jsp
                            - listitem [ref=e419]:
                              - img [ref=e420]
                              - link "eAuto BMK, HTM dan eLKM Transaction Listing" [ref=e421] [cursor=pointer]:
                                - /url: /uat1/view/jpj/report/plus/list.do
                            - listitem [ref=e422]:
                              - img [ref=e423]
                              - link "eAuto eDereg Pre-Checking Transaction Listing" [ref=e424] [cursor=pointer]:
                                - /url: /uat1/view/jpj/report/dereg/list.do
                            - listitem [ref=e425]:
                              - img [ref=e426]
                              - link "eAuto Reconciliation Summary Listing" [ref=e427] [cursor=pointer]:
                                - /url: /uat1/view/jpj/report/consolidated-reconcile/eauto-report.jsp
                            - listitem [ref=e428]:
                              - img [ref=e429]
                              - link "JPJ Reconciliation Report (HASIL)" [ref=e430] [cursor=pointer]:
                                - /url: /uat1/view/jpj/report/reconcile/
                            - listitem [ref=e431]:
                              - img [ref=e432]
                              - link "JPJ eSTM Report (HASIL)" [ref=e433] [cursor=pointer]:
                                - /url: /uat1/view/jpj/report/reconcile-estm/
                - cell "Wholesale Manage Wholesale Company Account Wholesale Transaction Listing Wholesale Refund Listing Wholesale Vehicle Payment Listing Wholesale Rejection Listing Wholesale Payment Listing" [ref=e434]:
                  - table [ref=e436]:
                    - rowgroup [ref=e437]:
                      - row "Wholesale Manage Wholesale Company Account Wholesale Transaction Listing Wholesale Refund Listing Wholesale Vehicle Payment Listing Wholesale Rejection Listing Wholesale Payment Listing" [ref=e438]:
                        - cell [ref=e439]:
                          - img [ref=e440]
                        - cell "Wholesale Manage Wholesale Company Account Wholesale Transaction Listing Wholesale Refund Listing Wholesale Vehicle Payment Listing Wholesale Rejection Listing Wholesale Payment Listing" [ref=e441]:
                          - text: Wholesale
                          - list [ref=e442]:
                            - listitem [ref=e443]:
                              - img [ref=e444]
                              - link "Manage Wholesale Company Account" [ref=e445] [cursor=pointer]:
                                - /url: /uat1/view/wholesale/company/
                            - listitem [ref=e446]:
                              - img [ref=e447]
                              - link "Wholesale Transaction Listing" [ref=e448] [cursor=pointer]:
                                - /url: /uat1/view/wholesale/listing/
                            - listitem [ref=e449]:
                              - link "Wholesale Refund Listing" [ref=e450] [cursor=pointer]:
                                - /url: /uat1/view/wholesale/refund/
                            - listitem [ref=e451]:
                              - link "Wholesale Vehicle Payment Listing" [ref=e452] [cursor=pointer]:
                                - /url: /uat1/view/wholesale/vehicle-payment/
                            - listitem [ref=e453]:
                              - link "Wholesale Rejection Listing" [ref=e454] [cursor=pointer]:
                                - /url: /uat1/view/wholesale/rejection/
                            - listitem [ref=e455]:
                              - link "Wholesale Payment Listing" [ref=e456] [cursor=pointer]:
                                - /url: /uat1/view/wholesale/payment/
        - cell [ref=e457]
  - table [ref=e459]:
    - rowgroup [ref=e460]:
      - row "Home | Menu 2 Pending Transaction Found! Jason Seah, My Account | Logout" [ref=e461]:
        - cell "Home | Menu 2 Pending Transaction Found!" [ref=e462]:
          - generic [ref=e463]:
            - list [ref=e464]:
              - listitem [ref=e465]:
                - link "Home |" [ref=e466] [cursor=pointer]:
                  - /url: /uat1/home/
              - listitem [ref=e467]:
                - link "Menu" [ref=e468] [cursor=pointer]:
                  - /url: "#"
                  - text: Menu
                  - img [ref=e469]
            - generic [ref=e470] [cursor=pointer]: 2 Pending Transaction Found!
        - cell "Jason Seah, My Account | Logout" [ref=e471]:
          - list [ref=e473]:
            - listitem [ref=e474]: Jason Seah,
            - listitem [ref=e475]:
              - link "My Account |" [ref=e476] [cursor=pointer]:
                - /url: /uat1/view/ucd/my-account/view.do?type=Office
            - listitem [ref=e477]:
              - link "Logout" [ref=e478] [cursor=pointer]:
                - /url: "#"
  - img [ref=e480]
  - table [ref=e482]:
    - rowgroup [ref=e483]:
      - row "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e484]:
        - cell [ref=e485]
        - cell "Best Compatible With Mozilla Firefox V36.0.4 Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved. Contact Us | Terms & Conditions | Privacy" [ref=e486]:
          - text: Best Compatible With Mozilla Firefox V36.0.4
          - text: Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
          - link "Contact Us" [ref=e487] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Terms & Conditions" [ref=e488] [cursor=pointer]:
            - /url: "#"
          - text: "|"
          - link "Privacy" [ref=e489] [cursor=pointer]:
            - /url: "#"
        - cell [ref=e490]:
          - img [ref=e491]
```

# Test source

```ts
  1   | import { type Page, type Locator, expect } from "@playwright/test";
  2   | import { BasePage } from "./BasePage";
  3   | import { PATHS } from "../utils/config";
  4   | 
  5   | export type ServiceType = "ALL" | "BIOMETRIC_PURCHASE" | "SOFTWARE_INSTALLATION" | "CHANGE_MAIN_USER";
  6   | export type TxStatus = "ALL" | "NEW" | "PENDING" | "APPROVED" | "COMPLETED" | "FAILED" | "CANCELLED";
  7   | 
  8   | /**
  9   |  * eAuto UCD Portal > Service Hub > Service Request Listing (SRD 2.3.2.2).
  10  |  *
  11  |  * Listing columns (0-indexed):
  12  |  *   0 #  | 1 Reference No | 2 Service Type | 3 Date Requested |
  13  |  *   4 Payment | 5 Tx Status | 6 e-Invoice Status | 7 Remarks | 8 Action
  14  |  */
  15  | export class ServiceRequestListingPage extends BasePage {
  16  |   // Column index map — kept as a single source of truth for the getters.
  17  |   static readonly COL = {
  18  |     num: 0,
  19  |     referenceNo: 1,
  20  |     serviceType: 2,
  21  |     dateRequested: 3,
  22  |     payment: 4,
  23  |     txStatus: 5,
  24  |     eInvoiceStatus: 6,
  25  |     remarks: 7,
  26  |     action: 8,
  27  |   } as const;
  28  | 
  29  |   // Filter panel (SRD 2.3.2.2 #1)
  30  |   readonly referenceNoInput = this.page.locator('input[name="referenceNo"], input[placeholder*="Reference"]').first();
  31  |   readonly serviceTypeSelect = this.page.locator('select[name="serviceType"]').first();
  32  |   readonly statusSelect = this.page.locator('select[name="status"]').first();
  33  |   readonly dateRequestedFromInput = this.page.locator('input[name="dateRequestedFrom"]').first();
  34  |   readonly dateRequestedToInput = this.page.locator('input[name="dateRequestedTo"]').first();
  35  |   readonly paymentDateFromInput = this.page.locator('input[name="paymentDateFrom"]').first();
  36  |   readonly paymentDateToInput = this.page.locator('input[name="paymentDateTo"]').first();
  37  |   readonly searchBtn = this.page.getByText("Search Now", { exact: false });
  38  |   readonly resetBtn = this.page.getByText("Reset", { exact: false });
  39  | 
  40  |   // Results table
  41  |   readonly resultsTable = this.page.locator("table").first();
  42  | 
  43  |   constructor(page: Page) {
  44  |     super(page);
  45  |   }
  46  | 
  47  |   async navigate() {
  48  |     await this.goto(PATHS.listing);
  49  |   }
  50  | 
  51  |   async searchByReferenceNo(refNo: string) {
  52  |     await this.referenceNoInput.fill(refNo);
  53  |     await this.searchBtn.click();
  54  |     await this.waitForNav();
  55  |   }
  56  | 
  57  |   async searchWithFilters(opts: {
  58  |     referenceNo?: string;
  59  |     serviceType?: ServiceType;
  60  |     status?: TxStatus;
  61  |     dateRequestedFrom?: string;
  62  |     dateRequestedTo?: string;
  63  |     paymentDateFrom?: string;
  64  |     paymentDateTo?: string;
  65  |   }) {
  66  |     if (opts.referenceNo) await this.referenceNoInput.fill(opts.referenceNo);
  67  |     if (opts.serviceType) await this.serviceTypeSelect.selectOption(opts.serviceType);
  68  |     if (opts.status) await this.statusSelect.selectOption(opts.status);
  69  |     if (opts.dateRequestedFrom) await this.dateRequestedFromInput.fill(opts.dateRequestedFrom);
  70  |     if (opts.dateRequestedTo) await this.dateRequestedToInput.fill(opts.dateRequestedTo);
  71  |     if (opts.paymentDateFrom) await this.paymentDateFromInput.fill(opts.paymentDateFrom);
  72  |     if (opts.paymentDateTo) await this.paymentDateToInput.fill(opts.paymentDateTo);
  73  |     await this.searchBtn.click();
  74  |     await this.waitForNav();
  75  |   }
  76  | 
  77  |   async resetFilters() {
  78  |     await this.resetBtn.click();
  79  |     await this.waitForNav();
  80  |   }
  81  | 
  82  |   /** Get all result rows */
  83  |   async getResultRows(): Promise<Locator[]> {
  84  |     return await this.resultsTable.locator("tbody tr").all();
  85  |   }
  86  | 
  87  |   private async cellText(row: Locator, colIndex: number): Promise<string> {
> 88  |     return (await row.locator("td").nth(colIndex).textContent())?.trim() ?? "";
      |                                                   ^ TimeoutError: locator.textContent: Timeout 10000ms exceeded.
  89  |   }
  90  | 
  91  |   async getRowReferenceNo(row: Locator): Promise<string> {
  92  |     return this.cellText(row, ServiceRequestListingPage.COL.referenceNo);
  93  |   }
  94  | 
  95  |   async getRowServiceType(row: Locator): Promise<string> {
  96  |     return this.cellText(row, ServiceRequestListingPage.COL.serviceType);
  97  |   }
  98  | 
  99  |   async getRowDateRequested(row: Locator): Promise<string> {
  100 |     return this.cellText(row, ServiceRequestListingPage.COL.dateRequested);
  101 |   }
  102 | 
  103 |   async getRowPayment(row: Locator): Promise<string> {
  104 |     return this.cellText(row, ServiceRequestListingPage.COL.payment);
  105 |   }
  106 | 
  107 |   /** Tx Status — "Pending" (blue) / "Completed" (green) etc. */
  108 |   async getRowStatus(row: Locator): Promise<string> {
  109 |     return this.cellText(row, ServiceRequestListingPage.COL.txStatus);
  110 |   }
  111 | 
  112 |   async getRowEInvoiceStatus(row: Locator): Promise<string> {
  113 |     return this.cellText(row, ServiceRequestListingPage.COL.eInvoiceStatus);
  114 |   }
  115 | 
  116 |   async getRowRemarks(row: Locator): Promise<string> {
  117 |     return this.cellText(row, ServiceRequestListingPage.COL.remarks);
  118 |   }
  119 | 
  120 |   /** Click "View" action on a row → Service Request Details Page */
  121 |   async clickView(row: Locator) {
  122 |     await row.getByText("View", { exact: false }).click();
  123 |     await this.waitForNav();
  124 |   }
  125 | 
  126 |   /** Click "Reschedule" action link on a row (a.sc-resubmit) */
  127 |   async clickReschedule(row: Locator) {
  128 |     await row.locator("a.sc-resubmit").click();
  129 |     await this.waitForNav();
  130 |   }
  131 | 
  132 |   /**
  133 |    * SRD 2.3.2.2 #3: "Reschedule" is shown only for Software Installation
  134 |    * requests whose Tx Status = "PENDING". A row qualifies when the action
  135 |    * link is present.
  136 |    */
  137 |   async hasRescheduleAction(row: Locator): Promise<boolean> {
  138 |     return (await row.locator("a.sc-resubmit").count()) > 0;
  139 |   }
  140 | 
  141 |   /**
  142 |    * Verify the SRD rule that Reschedule is only offered when Tx Status is
  143 |    * Pending — a row with a non-pending status must not expose the action.
  144 |    */
  145 |   async assertRescheduleOnlyWhenPending(row: Locator) {
  146 |     const status = (await this.getRowStatus(row)).toLowerCase();
  147 |     const hasReschedule = await this.hasRescheduleAction(row);
  148 |     if (!status.includes("pending")) {
  149 |       expect(hasReschedule).toBe(false);
  150 |     }
  151 |   }
  152 | 
  153 |   /** Navigate to reschedule page for a specific txnId */
  154 |   async goToReschedule(txnId: string) {
  155 |     await this.goto(PATHS.reschedule(txnId));
  156 |   }
  157 | 
  158 |   /** Find first row matching a reference number */
  159 |   async findRowByRefNo(refNo: string): Promise<Locator | null> {
  160 |     const rows = await this.getResultRows();
  161 |     for (const row of rows) {
  162 |       const text = (await row.textContent()) ?? "";
  163 |       if (text.includes(refNo)) return row;
  164 |     }
  165 |     return null;
  166 |   }
  167 | }
  168 | 
```