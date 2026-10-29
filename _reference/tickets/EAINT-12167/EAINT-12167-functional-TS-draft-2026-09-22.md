<!--
Source: pasted into Claude Code chat by Faizuddin, 2026-09-22.
Origin: the functional TS drafted on Miro, referenced in the 09-21 session
handoff and Faizuddin's 11:26 Teams post ("finished drafting the TS for
12167"). Charmain Ea Chiang reviewed it 11:37-11:42 same day via DM:
confirmed it's the functional TS specifically, said "so far ok."
This is a raw capture of that content as pasted — not yet reformatted into
the standard "EAINT-12167 - [eAuto-BackOffice] Service Hub - Allow Ops to
Input Device SN...xlsx" file. Resolves the open item in both 09-18 and
09-21 handoffs: "16-scenario TS draft not saved anywhere in the repo."
See knowledge/flow-device-purchase.md for two discrepancies this draft
surfaces against the dev QA guide, flagged in a new subsection there.
-->

# EAINT-12167 — Functional test scenarios (drafted, reviewed "so far ok")

## Listing & Details Page

**Precondition:** Complete BDP transaction until Delivery Status = New / Arranged / Delivered

| TS No. | User | Page | Expected Result |
|---|---|---|---|
| 12167_LDP_01 | BO | Biometric Device Purchase & Software Installation Listing | New Transactions - Delivery Status = New. New column and its values (to confirm the position): Number of Device: 1; Device Serial Number: - |
| 12167_LDP_02 | | | Old Transactions - Delivery Status = New. Number of Device: 1; Device Serial Number: - |
| 12167_LDP_03 | | | New Transactions - Delivery Status = Arranged. Number of Device: [1]; Device Serial Number: [unique value] |
| 12167_LDP_04 | | | Old Transactions - Delivery Status = Arranged. Number of Device: [1]; Device Serial Number: [blank] |
| 12167_LDP_05 | | | New Transactions - Delivery Status = Delivered. Number of Device: [1]; Device Serial Number: [unique value] |
| 12167_LDP_06 | | | Old Transactions - Delivery Status = Delivered. Number of Device: [1]; Device Serial Number: [blank] |
| 12167_LDP_07 | | BDP Transaction Details | New & Old Transactions - Delivery Status = New. Add new row (Number of Device) to Shipping Details: Purchase Device: 1 unit(s); Delivery Status: New; Delivery Date: -; Delivery Order Number: -; Consignment Number: -; Number of Device: [Total device purchased]; Device Serial Number: -; Recipient Name: [UCD name]; Shipping Address: [Address]; Contact No: [Phone No.] |
| 12167_LDP_08 | | | New Transactions - Delivery Status = Arranged. Purchase Device: 1 unit(s); Delivery Status: Arranged; Delivery Date: [date]; Delivery Order Number: [Number]; Consignment Number: [hyperlink]; Number of Device: [Total device purchased]; Device Serial Number: [Unique SN]; Recipient Name/Shipping Address/Contact No as above |
| 12167_LDP_09 | | | Old Transactions - Delivery Status = Arranged. Same as LDP_08 except Device Serial Number: [Blank] |
| 12167_LDP_10 | | | New Transactions - Delivery Status = Delivered. Same as LDP_08 (Device Serial Number: [Unique SN]), plus Appointment Details block: User Name, Contact Number, Software Installation: 1 request(s), Appointment Status/Date/Time Slot/Date Completed (depend on the Installation) |
| 12167_LDP_11 | | | Old Transactions - Delivery Status = Delivered. Same as LDP_10 except Device Serial Number: [Blank] |

## Update Shipping Details Popup

**Precondition:** Create BDP transactions with multiple devices (e.g. 5). Login as BO. Go to Biometric Device Purchase & Software Installation Listing. Open BDP transaction with Delivery Status = New. Click [Update Shipping Details].

| TS No. | Scenario | Steps | Expected Result |
|---|---|---|---|
| 12167_USDP_01 | 8-12 Character Limit | Do not fill in any characters > Click [Update] | Error message: This field is required |
| | | Enter 7 characters > Click [Update] | Error message (to confirm exact error message) |
| | | Enter 8 characters > Click [Update] | Able to proceed |
| | | Enter 10 characters > Click [Update] | Able to proceed |
| | | Enter 12 characters > Click [Update] | Able to proceed |
| | | Enter 13 characters > Click [Update] | Error message (to confirm exact error message) |
| 12167_USDP_02 | English letters handling | Enter English letters and numbers (e.g. SN928F940J) | All values accepted and displayed in the field |
| | | Enter SN using Chinese characters with keyboard | The Chinese characters are stripped live as user types it |
| | | Copy & paste Chinese characters | The Chinese characters automatically stripped |
| | | Copy & paste combination of English and Chinese characters (e.g. SN94039煎饺pls) | Only the Chinese characters stripped; English letters and numbers remain |
| 12167_USDP_03 | No Symbols handling | Enter SN with symbols | The symbols are stripped live as user types it |
| | | Copy & paste symbols | The symbols automatically stripped |
| | | Copy & paste combination of letters and symbols (e.g. BDP92!%@4X3) | Only the symbols stripped; English letters and numbers remain |
| 12167_USDP_04 | No. of Device field | Try to edit the value of the field | The field is read-only. Unable to edit |
| 12167_USDP_05 | Duplicated SN within the same transaction | In the same BDP transaction: enter 2 SN fields with the same value > Click [Update] | Error message under the duplicated fields only (to confirm exact error message) |
| 12167_USDP_06 | Duplicated SN from different transactions | First transaction: input SN value > Click [Close]. Second transaction: fill in the same SN value > Click [Update] | Error message under the duplicated fields only (to confirm exact error message) |
| 12167_USDP_07 | Delivery Status field | Click the 'Delivery Status' dropdown | User can only select 'Arranged' |
| 12167_USDP_08 | Number of Device field | Attempt to change the value for Number of Device | Value uneditable (read-only); reflects correctly based on how many devices the user purchased for that transaction |
| 12167_USDP_09 | Display of the Serial Number fields | Precondition: create BDP transaction with 40 devices. Observe the Serial Number fields | System shows 40 fields to input the Serial Numbers |
