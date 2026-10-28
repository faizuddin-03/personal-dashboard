# EAINT-12019_eMOVE_Logistics_UCD_20261009.html — text copy (28/10/2026, 1:02:06 am)

Converted from a HTML page, rendered offline in headless Chromium so script-built content is included (every screen, hidden ones too; form fields shown as [input ...], dropdowns as (options: ...)); open the .html file itself for layout.
[converter: html-render-v2: rendered]

# eAuto MOVE (eMOVE) — Prototype

e A uto ™ .my

HOME INSURANCE REPORTS SETTINGS USER GUIDE DOWNLOAD CONTACT US

Welcome to eAuto MUHAMMAD AMSHAR AMIN BIN NOOR SHAMSURIJAL (RHB:25707800004598-Active)

Logout

BERJAYA MEGA MOTORS ENTERPRISE SDN. BHD.

From RM30*
BUY
STMS
Sistem Tukar Milik Sementara
(View or Create Transaction)

RM30 only*

UCD TO UCD
Dealer to Dealer

RM115 only*

APT
Automatic Permanent Transfer
(View / Make Payment for vehicles in STMS which are 6 months or more)

RM10 for eVOC request
SELL
eSERAHAN
Online Transfer
(Dealer to Customer)

RM30 only*
BMK
BMK
Butiran Maklumat Kenderaan

Instant Commission

INSURANCE
Motor Insurance

RM18 only*

JOMCHECK REPORT
Vehicle Check Report

SSM
SSM Document
Mandatory seller/buyer representative details listed in SSM Document as Director/Owner

eVOC
eVOC
eVehicle Ownership Certificate

RM
LKM REFUND
Lesen Kenderaan Motor Refund

NEW

LOGISTICS
eAuto MOVE (eMOVE)
Car pickup & delivery

* The price is exclusive of government service tax.
The product price consists of JPJ and eAuto Service Fee.

COMPANY / BUSINESS PROFILE
Main user, update your company/business profile before 31 August 2025

SETTINGS
Manage the branches, registration or users

REPORTS

What's New

e A uto .my
Butiran Maklumat Kenderaan (BMK)

Need Help?

Support Hotline : 03-2779 8899
Mon to Fri : 9am to 6pm
Sat, Sun & P.Holiday : 10am to 4pm

Email : support@eauto.my

WhatsApp : 012-200 1324

Useful Link

JPJ Info
Firefox V36.0.4
TeamViewer

Home / Logistics

eAUTO MOVE (eMOVE) — LOGISTICS

TRANSACTION LISTING
To View or Track Logistics Transactions

CREATE NEW LOGISTICS
Request a new pickup & delivery

Need Help?

Support Hotline : 03-2779 8899
Mon to Fri : 9am to 6pm
Sat, Sun & P.Holiday : 10am to 4pm

Email : support@eauto.my

WhatsApp : 012-200 1324

Home / Logistics / Logistics Transaction Listing

Search & Filter

Vehicle No :
[input id=fltVehicle]

Trx No :
[input id=fltTrx]

Date Created :
[input id=fltCreatedFrom type=date] [input id=fltCreatedTo type=date]

Payment Status :
[select id=fltPay]

(options: All / OK / Pending / Failed)

Delivery Status :
[select id=fltDel]

(options: All / - / Pending Pick Up / In Transit / Delivered / Pickup Failed / Delivery Failed)

Pickup Date :
[input id=fltPickFrom type=date] [input id=fltPickTo type=date]

Tx Status :
[select id=fltTx]

(options: All / Completed / Pending / Failed)

[button] Search Now [button] Reset

Logistics Transaction Listing

# | Vehicle | Trx No | Created At | Pickup | Drop Off |
Payment | Delivery | Tx Status | LHDN Response Status | Amount (RM) | Remarks | Action |

Home / Logistics / Create New Logistics

1
Logistics Details

2
Transaction
Summary

3
Payment &
Confirmation

Logistics Details

### Vehicle Information

Key in the Vehicle No and click Search — the system will auto-fill the vehicle details.

Vehicle No *
[input id=f_plate value=PLL4524]

[button] Search

Demo Data — click a Vehicle No to load it, then click Search

| Vehicle No | Vehicle Make / Model | Insurance Vehicle Type | Behaviour |

PLL4524 |
Bentley / Azure (2022) |
Sedan |
Vehicle Type prefilled |

JHK4520 |
Proton / X70 Premium (2023) |
SUV |
Vehicle Type prefilled |

WXP1123 |
Toyota / Vios 1.5 G (2020) |
Sedan |
Vehicle Type prefilled |

VAN1237 |
Perodua / Myvi 1.5 AV (2021) |
No record |
Blank — UCD to fill in |

ABC1234 |
Any other plate |
No record |
Blank — UCD to fill in |

Exception paths to demo

| To trigger | Do this | Expected |

Address cannot be matched |
Type UNMATCHED anywhere in a Door-to-Door address, then click Next |
Stays on Step 1 with the support message |

Delivery cannot be priced |
Switch a leg to Hub, pick Johor, then select the Segamat hub marked not verified |
Stays on Step 1, charge cannot be worked out |

Tier price changed before payment |
On Step 2, tick Simulate a tier price change, then Make Payment |
Charges refresh with a notice, payment not taken |

Engine No
[input id=f_engine placeholder=Auto-filled after Search]

Chassis No
[input id=f_chassis placeholder=Auto-filled after Search]

Vehicle Make & Model
[input id=f_model placeholder=Auto-filled after Search]

Manufacturing Year
[input id=f_year placeholder=Auto-filled after Search]

Colour (optional)
[input id=f_colour placeholder=Optional — UCD to fill in]

Vehicle Type (optional)

[select id=f_type]

(options: — Select (optional) — / Sedan / Hatchback / SUV / MPV / Pickup / 4x4 / Motorcycle (Coming Soon) / Commercial / Lorry (Coming Soon))

### Pickup Location

Choose how the vehicle is collected. Door-to-Door Pickup adds RM200.

Door-to-Door Pickup (+RM200)
We collect the vehicle from your pickup address.

Drop at Hub
You drop the vehicle at the nearest eMOVE hub.

State *
[select id=f_pickstate]

(options: Selangor / Kuala Lumpur / Penang / Perak / Johor / Melaka / Negeri Sembilan / Pahang / Kedah / Kelantan / Terengganu / Perlis / Putrajaya)

Pickup Hub (by state) *
[select id=f_pickhub]

City / Town *
[select id=f_pickcity]

Postcode *
[input id=f_pickpost value=47800]

Address *
[input id=f_pickaddr value=No. 12, Jalan PJS 8/4, Mentari Court]

Contact Person *
[input value=Amshar Amin]

Contact No *
[input value=012-3456789]

Preferred Pickup Date *
[input id=f_pickdate type=date]

Remarks (optional)
[input id=f_pickremark placeholder=e.g. Gate access code, contact before arrival]

### Drop Off Location

Choose how the vehicle is delivered. Door-to-Door Drop-Off adds RM200.

Door-to-Door Drop-Off (+RM200)
We deliver the vehicle to your drop-off address.

Collect at Hub
You collect the vehicle at the destination eMOVE hub.

State *
[select id=f_dropstate]

(options: Johor / Selangor / Kuala Lumpur / Penang / Perak / Melaka / Negeri Sembilan / Pahang / Kedah / Kelantan / Terengganu / Perlis / Putrajaya)

Drop-off Hub (by state) *
[select id=f_drophub]

City / Town *
[select id=f_dropcity]

Postcode *
[input id=f_droppost value=80100]

Address *
[input id=f_dropaddr value=No. 5, Jalan Molek 1/10, Taman Molek]

Contact Person *
[input value=Farid Zainal]

Contact No *
[input value=019-8876543]

Remarks (optional)
[input id=f_dropremark placeholder=e.g. Vehicle not driveable, please arrange towing]

[button] Cancel
[button] Next

Logistics Transaction Summary

Vehicle No :
—

Service Type :
—

Engine No :
—

Vehicle Make / Model :
—

Chassis No :
—

Manufacturing Year :
—

Pickup :
—

Drop Off :
—

Preferred Pickup Date :
—

Estimated Distance :
—

Click Make Payment to pay.
CUSTOMER SUPPORT : 03-2779 8899

### Payment Summary

| Logistics Fee : | RM | 0.00 |

| Door-to-Door Pickup Charge : | RM | 200.00 |

| Door-to-Door Drop-Off Charge : | RM | 200.00 |

| eAuto Fee : | RM | 0.00 |

| Service Tax 8% : | RM | 0.00 |

| Total Amount Payable (inclusive of Service Tax 8%) : | RM | 0.00 |

Demo — modelled on STMS payment summary

[input id=sim_pricechg type=checkbox] Simulate a tier price change before payment (REQ-029)

[button] Save & Continue Later
[button] Make Payment

## Processing Payment…

Please wait while we securely process your transaction. Do not close this window.

Submission (Payment)

Trx No :
—

Service Type :
—

Vehicle No :
—

Vehicle Make / Model :
—

Pickup :
—

Drop Off :
—

Payment Status :
OK - SUCCESSFUL

Submission Date/Time :
—

Preferred Pickup Date :
—

Total Amount Paid :
—

Payment ID :
—

RHB Reference 1 :
—

[button] Done

Home / Logistics / Logistics Transaction Listing / —

[button] « Back
—
—
—

### Transaction Details

[button] Invoice
[button] e-Invoice

Engine No :
—

Chassis No :
—

Vehicle Make / Model :
—

Colour :
—

Date Created :
—

Manufacturing Year :
—

Vehicle Type :
—

Service Type :
—

Estimated Distance :
—

Delivery Status :
—

Total Amount Paid :
—

e-Invoice

e-Invoice Submission Date :
—

LHDN Response Status :
OK

e-Invoice Validation Date :
—

Payment Details

—

Pickup

Location :
—

Address :
—

Contact :
—

Preferred Date :
—

Remarks :
-

Drop Off

Location :
—

Address :
—

Contact :
—

Remarks :
-

Delivery Status

Contact Us | Terms & Conditions | Privacy

Best Compatible With Mozilla Firefox V36.0.4

Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.

e A uto ™ .my

---

## Visible on open (innerText of the first screen)

eAuto™.my
HOME
INSURANCE
REPORTS
SETTINGS
USER GUIDE
DOWNLOAD
CONTACT US
Welcome to eAuto   MUHAMMAD AMSHAR AMIN BIN NOOR SHAMSURIJAL (RHB:25707800004598-Active)
Logout
BERJAYA MEGA MOTORS ENTERPRISE SDN. BHD.
From RM30*
BUY
STMS
Sistem Tukar Milik Sementara
(View or Create Transaction)
RM30 only*
UCD TO UCD
Dealer to Dealer
RM115 only*
APT
Automatic Permanent Transfer
(View / Make Payment for vehicles in STMS which are 6 months or more)
RM10 for eVOC request
SELL
eSERAHAN
Online Transfer
(Dealer to Customer)
RM30 only*
BMK
BMK
Butiran Maklumat Kenderaan
Instant Commission
INSURANCE
Motor Insurance
RM18 only*
JOMCHECK REPORT
Vehicle Check Report
 
SSM
SSM Document
Mandatory seller/buyer representative details listed in SSM Document as Director/Owner
 
eVOC
eVOC
eVehicle Ownership Certificate
 
RM
LKM REFUND
Lesen Kenderaan Motor Refund
 
NEW
LOGISTICS
eAuto MOVE (eMOVE)
Car pickup & delivery
* The price is exclusive of government service tax.
The product price consists of JPJ and eAuto Service Fee.
COMPANY / BUSINESS PROFILE
Main user, update your company/business profile before 31 August 2025
SETTINGS
Manage the branches, registration or users
REPORTS
 
What's New
eAuto.my
Butiran Maklumat Kenderaan (BMK)
Need Help?
Support Hotline : 03-2779 8899
Mon to Fri : 9am to 6pm
Sat, Sun & P.Holiday : 10am to 4pm
Email : support@eauto.my
WhatsApp : 012-200 1324
Useful Link
JPJ Info
Firefox V36.0.4
TeamViewer
Contact Us  |  Terms & Conditions  |  Privacy
Best Compatible With Mozilla Firefox V36.0.4
Copyright © 2026 eAuto Sdn Bhd (676967-T) All Rights Reserved.
eAuto™.my
