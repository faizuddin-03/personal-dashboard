<!-- extracted from EAINT-12121_SRD_[eAuto-UCD] SSM - Remove 7 Days Validation After First Purchase to Allow SSM Repurchase_v1.0_20260818 (c04431e7-a827-485f-b742-d5931bd1fff3).pdf by doc-to-text.py; images and diagrams are not included -->

## Page 1

SYSTEM REQUIREMENT DOCUMENT (SRD) 
Requirement 
 
[eAuto-UCD] SSM: Remove 7 Days Validation After First Purchase to Allow SSM Repurchase 
 
Version 
 
Version 1.0 
 
Latest Revision Date 
 
18.08.2026 (Tuesday)

## Page 2

CONTENTS 
1.0  DOCUMENT INFORMATION .................................................................................................................................................... 3 
1.1  Purpose ............................................................................................................................................................................. 3 
1.2  Intended Audience ............................................................................................................................................................. 3 
1.3  Revision History ................................................................................................................................................................. 3 
1.4  Glossary of Terms ............................................................................................................................................................. 4 
1.5  Associated Document(s) .................................................................................................................................................... 5 
2.0  REQUIREMENT ........................................................................................................................................................................ 6 
2.1  High-Level Requirement Overview ..................................................................................................................................... 6 
2.1.1  Assumptions ............................................................................................................................................................. 7 
2.1.2  Out-of-Scope ............................................................................................................................................................. 7 
2.2  Key Highlights and Baseline Requirements ........................................................................................................................ 8 
2.2.1  Background ............................................................................................................................................................... 8 
2.2.2  Existing Issue & Expected Behaviour.......................................................................................................................... 9 
2.2.3  Affected Pages ........................................................................................................................................................ 10 
2.2.4  UCD Portal - SSM Purchase (STMS Step 4 & eSTM Step 4) ...................................................................................... 11 
2.2.5  UCD Portal & BackOffice - STMS and eSTM Details Page ........................................................................................ 14 
2.2.6  BackOffice - SSM Transaction Listing & eAuto Reconciliation Summary Listing ...................................................... 16 
2.2.7  Invoice and e-Invoice Generation ............................................................................................................................. 17 
Appendix - Requirement Change Log ........................................................................................................................................... 18

## Page 3

1.0  DOCUMENT INFORMATION 
1.1  Purpose 
The System Requirements Document outlines the agreed system specifications. Once approved, it becomes the baseline to ensure 
the system meets business goals. Sign-off is required for development to start, and any changes must follow the System 
Enhancement Management process. 
 
1.2  Intended Audience 
The intended audience for this document includes project stakeholders and any team members involved in defining, implementing, 
or validating the system requirements. 
 
1.3  Revision History 
This section records all modifications to the document until it reaches Version 1.0, at which point it is finalized and established as 
the baseline for future reference. Once baselined, any new changes will be assessed based on their severity - significant changes 
may result in an addendum, while less critical updates may be handled through a formal change request. 
Version No Date Revised By Reason for Revision 
0.1 14.08.2026 (Fri) Lim Yi Link Initial Draft 
0.2 18.08.2026 (Tues) Lim Yi Link Added Resubmit page as affected page, cross-
flow repurchase (STMS to eSTM), latest SSM 
document only, and repurchase by any UCD user. 
Updated BO download to zip file. 
1.0 18.08.2026 (Tues) Lim Yi Link Send out for external review

## Page 4

1.4  Glossary of Terms 
# Abbreviation / Term Interpretation / Description 
1 
 
UCD 
 
Used Car Dealer 
 
2 
 
SSM 
 
Suruhanjaya Syarikat Malaysia - company or business profile document 
purchased through eAuto 
 
3 
 
BO 
 
BackOffice 
 
4 
 
TIN 
 
Tax Identification Number 
 
5 
 
LHDN 
 
Lembaga Hasil Dalam Negeri - Inland Revenue Board of Malaysia

## Page 5

1.5  Associated Document(s) 
# Item Location / URL Rationale for Relevance 
1 
 
EAINT-12121 - [eAuto-UCD] SSM: Remove 7 
Days Validation After First Purchase to Allow 
SSM Repurchase 
 
https://mfservices.atlassian.net/br
owse/EAINT-12121 
 
Source enhancement request 
 
2 
 
EAUTO-1006 - ENHANCEMENT REQUEST - 
SSM REPURCHASED 
 
https://mfservices.atlassian.net/br
owse/EAUTO-1006 
 
Original change request raised by 
the requestor 
 
3 
 
CCB-886 - EAUTO | To Remove 7 Days 
Validation After First Purchase and Allow SSM 
Repurchase 
 
https://mfservices.atlassian.net/br
owse/CCB-886 
 
Change Control Board ticket

## Page 6

2.0  REQUIREMENT 
2.1  High-Level Requirement Overview 
# Item Description 
2.1.1 
 
Enhancement Overview 
 
Remove the 7-day validation that blocks SSM repurchase after the first 
purchase. Allow UCD to repurchase SSM starting from the same day. 
 
2.1.2 
 
Key Value(s) Expected 
 
Allow UCD to repurchase SSM without waiting 7 days. Remove the need 
for IT to patch the SSM status and for CSE to follow up with the UCD. 
 
2.1.3 
 
Additional Note(s) 
 
Each SSM purchase is charged separately and generates its own invoice 
and e-Invoice.

## Page 7

2.1.1  Assumptions 
# Assumption 
1 
 
The 10-minute cooling period is counted from the previous SSM purchase, not from the first purchase. 
 
2 
 
Each SSM repurchase is charged the standard SSM fee. No free repurchase is granted. 
 
3 
 
The SSM document remains valid to download for 7 days from its purchase date. This validity period is unchanged. 
 
 
2.1.2  Out-of-Scope 
# Item Reason 
1 
 
SSM document download handling in UCD Portal and 
BackOffice 
 
Existing handling remains unchanged. UCD and BO continue to 
download the latest SSM document.

## Page 8

2.2  Key Highlights and Baseline Requirements 
The following key highlights and requirements were established during the initial sync-up sessions with the requestor. As this 
forms the baseline, any changes requested thereafter may result in adjustments to scope, timeline, or deliverables, for which the 
requestor will be responsible to review and confirm. 
 
2.2.1  Background 
# Affected Item Description 
1 
 
Project 
 
eAuto 
 
2 
 
Portal 
 
UCD 
 
3 
 
Module 
 
SSM (STMS & eSTM) 
 
4 
 
Request 
 
Remove the 7-day validation after the first purchase and allow SSM repurchase. 
 
5 
 
Additional Note

## Page 9

2.2.2  Existing Issue & Expected Behaviour 
# Item Description 
1 
 
Existing Issue / Behaviour 
 
a. UCD purchases SSM and the purchase is approved. 
b. UCD updates the new SSM and needs to repurchase. 
c. The system blocks the repurchase within 7 days of the first purchase. 
d. IT has to patch the SSM status and SSM Payment Date. 
e. CSE informs the UCD that the repurchase can proceed. 
 
2 
 
Expected New Handling / 
Behaviour 
 
a. Allow UCD to repurchase SSM starting from the same day, 10 minutes after the 
previous purchase. 
b. Allow UCD to repurchase SSM regardless of the SSM status. 
c. No IT patching is required.

## Page 10

2.2.3  Affected Pages 
# Affected Pages Description 
1 
 
UCD Portal - SSM Purchase (STMS Step 4) 
 
Display of the [Purchase SSM] button after the cooling period. 
 
2 
 
UCD Portal - SSM Purchase (eSTM Step 4) 
 
Display of the [Purchase SSM] button after the cooling period. 
 
3 
 
UCD Portal - STMS and eSTM Details Page 
 
Download of the latest SSM document. 
 
4 
 
BackOffice - STMS and eSTM Details Page 
 
Download of the latest SSM document. 
 
5 
 
BackOffice - SSM Transaction Listing 
 
New record added for every SSM purchase. 
 
6 
 
BackOffice - Consolidated e-Invoice Listing 
 
New record added when the UCD has an invalid TIN. 
 
7 
 
BackOffice - eAuto Reconciliation Summary 
Listing 
 
New record added when the UCD repurchases SSM. 
 
8 
 
UCD Portal - STMS and eSTM Listing Page > 
Resubmit 
 
Entry into the SSM repurchase flow through the Resubmit action.

## Page 11

2.2.4  UCD Portal - SSM Purchase (STMS Step 4 & eSTM Step 4) 
# Requirement ID Item Description Acceptance Criteria 
1 
 
EAINT-12121-
REQ-001 
 
Removal of 7-Day 
Repurchase 
Validation 
 
Remove the 7-day validation checking 
that blocks SSM repurchase after the 
first purchase. 
 
Note: The SSM document is still valid 
to download for 7 days only. 
 
UCD purchases SSM on the same day as 
the first purchase without any 7-day block. 
 
2 
 
EAINT-12121-
REQ-002 
 
10-Minute Cooling 
Period 
 
Allow UCD to repurchase SSM only 
after 10 minutes from the previous 
purchase. 
 
Example 1: Repurchase attempted within 
10 minutes from the previous purchase 
→ [Purchase SSM] button is not displayed 
 
Example 2: Repurchase attempted after 
10 minutes from the previous purchase 
→ [Purchase SSM] button is displayed

## Page 12

# Requirement ID Item Description Acceptance Criteria 
3 
 
EAINT-12121-
REQ-003 
 
Purchase SSM 
Button Display 
 
Display the [Purchase SSM] button 
once the cooling period ends. 
 
The button is not displayed during the 
cooling period. No error message is 
shown to the UCD. 
 
If the UCD remains on the same page, the 
[Purchase SSM] button appears by: 
a. Refreshing the page manually 
b. Selecting “No” in the Payment 
Confirmation popup 
 
For item b, the system shall auto-refresh 
the page after the UCD selects “No”. 
 
4 
 
EAINT-12121-
REQ-004 
 
Repurchase 
Regardless of SSM 
Status 
 
Allow UCD to repurchase SSM 
regardless of the SSM status of the 
previous purchase. 
 
Example 1: Previous SSM status is OK 
→ Repurchase is allowed 
 
Example 2: Previous SSM status is Failed 
→ Repurchase is allowed 
 
5 
 
EAINT-12121-
REQ-005 
 
SSM Purchase 
Charge 
 
Charge the standard SSM fee for every 
purchase, including each repurchase. 
 
Every successful SSM purchase is 
charged separately. No free repurchase is 
granted.

## Page 13

# Requirement ID Item Description Acceptance Criteria 
6 
 
EAINT-12121-
REQ-012 
 
Cross-Flow 
Repurchase 
(STMS to eSTM) 
 
The existing SSM purchase handling in 
each flow shall remain unchanged. 
Upon purchasing SSM in the STMS 
flow, the UCD shall be able to 
repurchase SSM in the eSTM flow. 
 
Example 1: UCD purchased SSM in the 
STMS flow 
→ UCD repurchases SSM in the eSTM 
flow 
→ Repurchase is allowed 
 
7 
 
EAINT-12121-
REQ-014 
 
Repurchase by 
Any UCD User 
 
The existing SSM purchase handling 
shall remain unchanged. Upon SSM 
purchase by one UCD user, another 
UCD user shall be able to repurchase 
SSM, regardless of which user made 
the earlier purchase. 
 
Multiple user scenario 
 
Given: 
UCD A (Main UCD) purchased the SSM 
document 
 
Expected: 
a. UCD B (Sub UCD) is able to repurchase 
SSM. 
b. The repurchase is allowed regardless of 
which UCD user made the earlier 
purchase. 
 
Note: Main UCD and sub UCD are 
examples only. The handling applies to 
any UCD user.

## Page 14

2.2.5  UCD Portal & BackOffice - STMS and eSTM Details Page 
# Requirement ID Item Description Acceptance Criteria 
1 
 
EAINT-12121-
REQ-006 
 
UCD - Download 
Latest SSM 
Document 
 
The existing SSM document download 
handling shall remain unchanged. 
Upon repurchase, the UCD shall be 
able to download the latest SSM 
document. 
 
Example 1: UCD repurchases within 7 
days 
→ UCD downloads the latest SSM 
document 
 
Example 2: UCD repurchases after 7 days 
→ UCD downloads the latest SSM 
document 
 
2 
 
EAINT-12121-
REQ-007 
 
BO - Download 
SSM Documents 
in Zip File 
 
The existing SSM document download 
handling shall remain unchanged. 
Upon repurchase, BO shall be able to 
download the SSM documents in a zip 
file. 
 
Example 1: UCD repurchases within 7 
days 
→ BO downloads the SSM documents in a 
zip file 
 
Example 2: UCD repurchases after 7 days 
→ BO downloads the SSM documents in a 
zip file

## Page 15

# Requirement ID Item Description Acceptance Criteria 
3 
 
EAINT-12121-
REQ-013 
 
UCD - Latest SSM 
Document Only if 
SSM Status = 
Failed 
 
The system shall reference the SSM 
document of the latest purchase only. 
 
Upon repurchase, the UCD shall no 
longer be able to view or download the 
SSM document of any previous 
purchase, even when the previous SSM 
status was OK. 
 
⚠ Special Scenario 
 
Given: 
1st purchase → SSM status = OK 
2nd purchase (repurchase) → SSM status 
= Failed 
 
Expected: 
a. The SSM document of the 1st purchase 
is no longer displayed to the UCD. 
b. The UCD cannot view or download the 
SSM document of the 1st purchase. 
c. The system references the 2nd 
purchase only. As its status is Failed, no 
SSM document is available to the UCD 
until the next successful purchase. 
 
Note: BO access is unchanged. BO 
continues to download the SSM 
documents in a zip file. Refer to EAINT-
12121-REQ-007.

## Page 16

2.2.6  BackOffice - SSM Transaction Listing & eAuto Reconciliation Summary Listing 
# Requirement ID Item Description Acceptance Criteria 
1 
 
EAINT-12121-
REQ-008 
 
New Record per 
SSM Purchase 
 
Add one record in the SSM 
Transaction Listing for every SSM 
purchase. 
 
Each repurchase creates a new record in 
the SSM Transaction Listing. The record 
of the previous purchase remains. 
 
2 
 
EAINT-12121-
REQ-011 
 
New Record in 
eAuto 
Reconciliation 
Summary Listing 
 
Add one record in the eAuto 
Reconciliation Summary Listing for 
every SSM repurchase. 
 
Each repurchase creates a new record in 
the eAuto Reconciliation Summary Listing. 
The record of the previous purchase 
remains.

## Page 17

2.2.7  Invoice and e-Invoice Generation 
# Requirement ID Item Description Acceptance Criteria 
1 
 
EAINT-12121-
REQ-009 
 
New Invoice and e-
Invoice per 
Purchase 
 
Generate a new invoice and e-Invoice 
for every SSM purchase. 
 
Each SSM purchase has its own invoice 
and e-Invoice. The latest document is 
displayed as the first document in the list. 
 
2 
 
EAINT-12121-
REQ-010 
 
Invalid TIN - 
Consolidated e-
Invoice 
 
Add a record in the Consolidated e-
Invoice Listing and submit it to LHDN 
when the UCD has an invalid TIN. 
 
Example 1: UCD TIN is valid 
→ e-Invoice is generated and submitted to 
LHDN under the UCD 
 
Example 2: UCD TIN is invalid 
→ Record is added in the Consolidated e-
Invoice Listing and submitted to LHDN

## Page 18

Appendix - Requirement Change Log 
# SRD 
Version 
Requirement ID Status Reason 
1 
 
0.1 
 
EAINT-12121-
REQ-001 
 
Added 
 
Remove 7-day repurchase validation 
 
2 
 
0.1 
 
EAINT-12121-
REQ-002 
 
Added 
 
Introduce 10-minute cooling period 
 
3 
 
0.1 
 
EAINT-12121-
REQ-003 
 
Added 
 
Define Purchase SSM button display 
 
4 
 
0.1 
 
EAINT-12121-
REQ-004 
 
Added 
 
Allow repurchase regardless of SSM status 
 
5 
 
0.1 
 
EAINT-12121-
REQ-005 
 
Added 
 
Confirm charge on every repurchase 
 
6 
 
0.1 
 
EAINT-12121-
REQ-006 
 
Added 
 
Confirm UCD downloads latest SSM document

## Page 19

# SRD 
Version 
Requirement ID Status Reason 
7 
 
0.1 
 
EAINT-12121-
REQ-007 
 
Added 
 
Confirm BO downloads latest SSM document 
 
8 
 
0.1 
 
EAINT-12121-
REQ-008 
 
Added 
 
Add record per purchase in transaction listing 
 
9 
 
0.1 
 
EAINT-12121-
REQ-009 
 
Added 
 
Generate invoice and e-Invoice per purchase 
 
10 
 
0.1 
 
EAINT-12121-
REQ-010 
 
Added 
 
Handle invalid TIN via consolidated e-Invoice 
 
11 
 
0.1 
 
EAINT-12121-
REQ-011 
 
Added 
 
Add record per repurchase in reconciliation summary listing 
 
12 
 
0.2 
 
EAINT-12121-
REQ-007 
 
Updated 
 
Change BO download to SSM documents in a zip file

## Page 20

# SRD 
Version 
Requirement ID Status Reason 
13 
 
0.2 
 
EAINT-12121-
REQ-012 
 
Added 
 
Allow repurchase in eSTM flow after purchase in STMS flow 
 
14 
 
0.2 
 
EAINT-12121-
REQ-013 
 
Added 
 
Allow UCD to view the latest SSM document only, including when the latest 
status is Failed 
 
15 
 
0.2 
 
EAINT-12121-
REQ-014 
 
Added 
 
Allow any UCD user to repurchase SSM regardless of which user purchased 
earlier
