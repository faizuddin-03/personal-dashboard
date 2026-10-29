# EAINT-12218_SRD_v1.1_20260903.pdf — text copy (27/10/2026, 5:47:24 pm)

Converted from a PDF (text layer only; open the PDF itself with the Read tool to see pages and images).

SYSTEM REQUIREMENT DOCUMENT (SRD)
Requirement [Secarang-Macrokiosk Template] Split Renewal Reminder into 9 Templates by Source and
Reminder Point
Version Version 1.1
Latest Revision Date 03.09.2026 (Thursday)

-- 1 of 34 --

Page 2 of 34
CONTENTS
1.0 DOCUMENT INFORMATION .................................................................................................................................................... 3
1.1 Purpose ............................................................................................................................................................................. 3
1.2 Intended Audience ............................................................................................................................................................. 3
1.3 Revision History................................................................................................................................................................. 3
1.4 Glossary of Terms ............................................................................................................................................................. 5
1.5 Associated Document(s) .................................................................................................................................................... 6
2.0 REQUIREMENT ........................................................................................................................................................................ 7
2.1 High-Level Requirement Overview ..................................................................................................................................... 7
2.1.1 Assumptions ............................................................................................................................................................. 9
2.1.2 Out-of-Scope ........................................................................................................................................................... 10
2.2 Key Highlights and Baseline Requirements ...................................................................................................................... 11
2.2.1 Background ............................................................................................................................................................. 11
2.2.2 Existing Issue & Expected Behaviour........................................................................................................................ 12
2.2.3 Affected Pages ........................................................................................................................................................ 13
2.2.4 Daily Blast Rule ........................................................................................................................................................ 14
2.2.5 Sample Message Layout .......................................................................................................................................... 20
2.2.6 CIBO Macrokiosk Template Management ................................................................................................................ 22
2.2.7 Notification Email Content ....................................................................................................................................... 27
2.2.8 Template Status Handling........................................................................................................................................ 28
2.2.9 Template Status Actions.......................................................................................................................................... 30
Appendix — Requirement Change Log .......................................................................................................................................... 32

-- 2 of 34 --

Page 3 of 34
1.0 DOCUMENT INFORMATION
1.1 Purpose
The System Requirements Document outlines the agreed system specifications. Once approved, it becomes the baseline to ensure
the system meets business goals. Sign-off is required for development to start, and any changes must follow the System
Enhancement Management process.
1.2 Intended Audience
The intended audience for this document includes project stakeholders and any team members involved in defining, implementing,
or validating the system requirements.
1.3 Revision History
This section records all modifications to the document until it reaches Version 1.0, at which point it is finalized and established as
the baseline for future reference. Once baselined, any new changes will be assessed based on their severity — significant changes
may result in an addendum, while less critical updates may be handled through a formal change request.
Version No Date Revised By Reason for Revision
0.1 20.08.2026 (Thurs) Chee Mei Jia Initial Draft
0.2 24.08.2026 (Mon) Chee Mei Jia Added Section 2.2.7 CIBO Macrokiosk Template
Management
Updated Sections 1.5, 2.2.3, 2.2.6 and 2.2.8
0.3 26.08.2026 (Wed) Chee Mei Jia Updated Cover Page
Updated Sections 1.4 to 2.2.3
Restructured Sections 2.2.4 to 2.2.6

-- 3 of 34 --

Page 4 of 34
Version No Date Revised By Reason for Revision
0.4 27.08.2026 (Thurs) Chee Mei Jia Added Section 2.2.6 Proposed Template Structure
and Send Schedule
Updated Sections 2.1.3 and 2.2.7
0.5 28.08.2026 (Fri) Chee Mei Jia Updated Cover Page
Restructured Sections 2.2.4 to 2.2.6
Updated Sections 1.4 to 2.2.3
0.6 01.09.2026 (Tues) Chee Mei Jia Added Section 2.2.5 Sample Message Layout
Added Section 2.2.7 Notification Email Content
Updated Sections 2.2.4 to 2.2.8
0.7 01.09.2026 (Tues) Chee Mei Jia Updated Sections 2.2.6 and 2.2.8
0.8 02.09.2026 (Wed) Chee Mei Jia Updated Sections 2.2.6 and 2.2.7
1.0 02.09.2026 (Wed) Chee Mei Jia This is the baseline of the Change Request.
1.1 03.09.2026 (Thurs) Chee Mei Jia Added Section 2.2.8 Template Status Handling
Added Section 2.2.9 Template Status Actions
Updated Section 2.2.6
Note: Update made to the document is highlighted in blue

-- 4 of 34 --

Page 5 of 34
1.4 Glossary of Terms
# Abbreviation / Term Interpretation / Description
1 Macrokiosk Third party messaging service provider used to deliver WhatsApp messages to
customers.
2 Customer Record A customer eligible to receive a WhatsApp blast message.
3 Policy Expiry Date The date the customer existing policy expires. Used to decide which Macrokiosk
template the customer receives and on which date.
4 Template Set The 3 templates used at 1 reminder point, 1 for each source.
5 Blast A scheduled outbound WhatsApp message send to a set of customers.

-- 5 of 34 --

Page 6 of 34
1.5 Associated Document(s)
# Item Location / URL Rationale for Relevance
1 EAINT-12218 — Split Renewal Reminder into 9
Templates by Source and Reminder Point
https://mfservices.atlassian.net/br
owse/EAINT-12218
Main enhancement ticket for this
document.
2 ESI-347 — To enhance Secarang Macrokiosk
WhatsApp blast based on ratio
https://mfservices.atlassian.net/br
owse/ESI-347
Source request raised by the
requestor.
3 CCB-922 — ESI | Split Renewal Reminder into 9
Templates by Source and Reminder Point
https://mfservices.atlassian.net/br
owse/CCB-922
Change Control Board ticket.
4 EAINT-12218_cibo-macrokiosk-template-
management_20260901.html
Attached to EAINT-12218 Mockup of the CIBO Macrokiosk
Template Management screen,
showing the 9 template toggles.

-- 6 of 34 --

Page 7 of 34
2.0 REQUIREMENT
2.1 High-Level Requirement Overview
# Item Description
2.1.1 Enhancement Overview Enhance the Secarang Macrokiosk WhatsApp blast so that the renewal
reminder is split into 9 templates, 1 for each source at each reminder
point.
Which template a customer receives is decided by how many days
remain before the policy expires and by which source the customer
came from.
2.1.2 Key Value(s) Expected 1. Customers are reminded at 3 fixed points before the policy expires,
improving response and conversion rates.
2. A paused template can be traced to a single source and reminder
point, and only stops 1 template out of 9.
3. Every customer who reaches a reminder point is sent in that run.

-- 7 of 34 --

Page 8 of 34
# Item Description
2.1.3 Additional Note(s) 1. Customer records are drawn from eSTM with insurance, eSTM
without insurance, and Secarang.
2. There is no daily limit on the number of messages sent. Every
customer reaching a reminder point is sent in that run.
3. The 9 template structure and the send schedule were confirmed by
the requestor on 28.08.2026. Set out in full in Section 2.2.4.

-- 8 of 34 --

Page 9 of 34
2.1.1 Assumptions
# Assumption
1 Macrokiosk can deliver every message generated by a run without throttling.
2 The template a customer receives is decided from the policy expiry date and not from the customer registration date.
3 The number of customers reaching a reminder point on any date is within what Macrokiosk can deliver in a single run.
4 A customer is held under 1 source only, so no customer is sent more than 1 message on the same date.
5 The existing Macrokiosk WhatsApp template approval and quality rating remain valid.
6 Customer records from all 3 sources carry a reliable policy expiry date.

-- 9 of 34 --

Page 10 of 34
2.1.2 Out-of-Scope
# Item Reason
1 Changes to WhatsApp template content or wording Template content is unchanged. Only the selection and
distribution of recipients is affected.
2 Changes to Macrokiosk application programming
interface integration
The existing integration is reused as is.
3 Monitoring and reporting of messages sent per
template
This request covers the template split and the send schedule
only.
4 New reporting dashboard user interface No reporting output is produced under this request.
5 Changes to customer registration logic in eSTM and
Secarang
Customer registration remains unchanged.
6 Retry handling for failed sends This request is an enhancement on top of the existing blast.
Existing failure handling remains unchanged.

-- 10 of 34 --

Page 11 of 34
2.2 Key Highlights and Baseline Requirements
The following key highlights and requirements were established during the initial sync-up sessions with the requestor. As this
forms the baseline, any changes requested thereafter may result in adjustments to scope, timeline, or deliverables, for which the
requestor will be responsible to review and confirm.
2.2.1 Background
# Affected Item Description
1 Project Secarang
2 Portal Macrokiosk
3 Module Macrokiosk Template
4 Request Split the renewal reminder into 9 templates, 1 for each source at each reminder
point.
5 Additional Note 1. Key reason for raising this request: to enable monitoring of the number of
WhatsApp messages sent under each template.
2. There is no daily limit on the number of messages sent. Every customer reaching
a reminder point is sent in that run.

-- 11 of 34 --

Page 12 of 34
2.2.2 Existing Issue & Expected Behaviour
# Item Description
1 Existing Issue / Behaviour 1. All 3 sources share 1 template at each reminder point, so a paused template
stops every source at once and the cause cannot be traced.
2. A paused template cannot be traced to a source or a reminder point.
3. Customers are not reminded at fixed points before the policy expires.
2 Expected New Handling /
Behaviour
1. 9 templates are used, being 1 for each source at each of the 3 reminder points.
2. Each run sends 1 set, being the 3 templates for that reminder point.
3. There is no daily send limit. Every customer reaching a reminder point is sent in
that run.
4. Each customer receives all 3 reminders over the policy cycle, 1 at each reminder
point.

-- 12 of 34 --

Page 13 of 34
2.2.3 Affected Pages
# Affected Pages Description
1 Macrokiosk WhatsApp Blast Scheduler Customer selection is updated to send 1 template set per run, matching each
customer to the template for their source.
2 Customer Selection Query Customer records are filtered by policy expiry date and matched to a template
before selection.
3 CIBO — Macrokiosk Template
Management
New module added to the left navigation, placed below Discount Code
Management. Holds the cron job setting.

-- 13 of 34 --

Page 14 of 34
2.2.4 Daily Blast Rule
# Requirement ID Item Description Acceptance Criteria
1 EAINT-12218-
REQ-001
Template
Structure
9 Macrokiosk renewal reminder
templates are used in total, grouped
into 3 sets of 3. Each template is used
by 1 source at 1 reminder point.
Splitting the templates allows a
paused template to be traced to a
single source and reminder point, and
limits a pause to 1 template out of 9.
Example 1: Set A, 7 days before policy
expiry
a. eSTM with insurance
b. eSTM without insurance
c. Secarang
Example 2: Set B, 14 days before policy
expiry
a. eSTM with insurance
b. eSTM without insurance
c. Secarang
Example 3: Set C, 30 days before policy
expiry
a. eSTM with insurance
b. eSTM without insurance
c. Secarang

-- 14 of 34 --

Page 15 of 34
# Requirement ID Item Description Acceptance Criteria
2 EAINT-12218-
REQ-002
Send Schedule Each cron job run sends 1 set, being
the 3 templates for that reminder
point.
Example 1: Run at 9:00 AM
a. Sends Set A, being the 3 templates for 7
days before policy expiry
Example 2: Run at 12:00 PM
a. Sends Set B, being the 3 templates for
14 days before policy expiry
Example 3: Run at 9:00 PM
a. Sends Set C, being the 3 templates for
30 days before policy expiry

-- 15 of 34 --

Page 16 of 34
# Requirement ID Item Description Acceptance Criteria
3 EAINT-12218-
REQ-003
Customer
Source and
Eligibility
Customer records are drawn from 3
sources: eSTM with insurance, eSTM
without insurance, and Secarang.
A customer is included in a run only
where the policy expiry date falls
exactly on the reminder point for that
run.
Every customer who reaches the
reminder point is sent in that run.
There is no daily limit on the number of
messages.
Example 1: Secarang customer whose
policy expires in 7 days, run at 9:00 AM
a. Included and sent the Set A template
for Secarang
Example 2: Policy expires in 21 days
a. Not included, as 21 days is not a
reminder point
Example 3: Policy already expired
a. Not included
4 EAINT-12218-
REQ-004
Basis of Day
Count
The number of days is counted from
the current blast date to the policy
expiry date.
The count is recalculated on every run,
so the same customer reaches each
reminder point in turn.
Example 1: Policy expires on 30.09.2026
and the run is on 31.08.2026
a. Counted as 30 days and included in the
9:00 PM run
Example 2: The same customer on
23.09.2026
a. Counted as 7 days and included in the
9:00 AM run

-- 16 of 34 --

Page 17 of 34
5 EAINT-12218-
REQ-005
Template
Content
The content for each reminder point is
standard across all 3 sources.
Every template follows the same
format:
a. Title in bold, with no leading space
and no double space
b. Greeting line, followed by a blank
line
c. Policy line stating the vehicle
number and the expiry date
d. Reminder line specific to the
reminder point
e. Opt-out note in the template footer
f. 2 buttons, being Renew Now and
Review Later
Example 1: Set A, 7 days before policy
expiry
a. Title: Insurance Expiry Final Reminder
b. Body: Hi {{Customer_Name}} ,
c. Body: Your motor insurance policy for
vehicle {{Vehicle_No}} will expire on
{{Expiry_Date}}.
d. Body: Please renew your policy before
the expiry date to avoid any interruption in
coverage.
e. Buttons: Renew Now, Review Later
Example 2: Set B, 14 days before policy
expiry
a. Title: Insurance Renewal Due Soon
b. Body: Hi {{Customer_Name}} ,
c. Body: Your motor insurance policy for
vehicle {{Vehicle_No}} will expire on
{{Expiry_Date}}.
d. Body: To maintain continuous
protection, we encourage you to arrange
your renewal before the expiry date.
e. Buttons: Renew Now, Review Later
Example 3: Set C, 30 days before policy
expiry

-- 17 of 34 --

Page 18 of 34
# Requirement ID Item Description Acceptance Criteria
a. Title: Motor Insurance Renewal
Reminder
b. Body: Hi {{Customer_Name}} ,
c. Body: Your motor insurance policy for
vehicle {{Vehicle_No}} will expire on
{{Expiry_Date}}.
d. Body: Renewing early helps ensure
uninterrupted coverage and peace of
mind.
e. Buttons: Renew Now, Review Later
6 EAINT-12218-
REQ-006
Template
Category
All 9 templates are submitted to
Macrokiosk under the Utility category.
This is a change from the existing
Secarang templates, which are
submitted under the Marketing
category.
The category is set at the point of
submission to Macrokiosk and cannot
be changed once the template is
approved.
Example 1: Any of the 9 renewal reminder
templates is submitted
a. Category is set to Utility
Example 2: Category is set to Marketing
by mistake
a. The template is resubmitted under
Utility before it is used

-- 18 of 34 --

Page 19 of 34
# Requirement ID Item Description Acceptance Criteria
7 EAINT-12218-
REQ-007
Opt-Out Note Every template carries the opt-out note
in the template footer, placed below
the body and above the buttons.
The note is displayed in English only
and is the same across all 9
templates.
The reply keyword is OPT-OUT. The
handling of the reply is covered under
EAINT-12217.
The footer reads:
Reply OPT-OUT stop updates.
Example 1: Customer replies OPT-OUT
a. No further renewal reminder is sent to
that customer

-- 19 of 34 --

Page 20 of 34
2.2.5 Sample Message Layout
The samples below show each message as the customer receives it, with sample values in place of the variables. The title is in
bold, the opt-out note sits in the template footer, and the buttons appear below the message.
Set Sample as sent
Set A Insurance Expiry Final Reminder
Hi Ahmad ,
Your motor insurance policy for vehicle WXY 1234 will expire on 08.09.2026.
Please renew your policy before the expiry date to avoid any interruption in coverage.
Reply OPT-OUT stop updates.
[ Renew Now ] [ Review Later ]

-- 20 of 34 --

Page 21 of 34
Set Sample as sent
Set B Insurance Renewal Due Soon
Hi Ahmad ,
Your motor insurance policy for vehicle WXY 1234 will expire on 15.09.2026.
To maintain continuous protection, we encourage you to arrange your renewal before the expiry date.
Reply OPT-OUT stop updates.
[ Renew Now ] [ Review Later ]
Set C Motor Insurance Renewal Reminder
Hi Ahmad ,
Your motor insurance policy for vehicle WXY 1234 will expire on 01.10.2026.
Renewing early helps ensure uninterrupted coverage and peace of mind.
Reply OPT-OUT stop updates.
[ Renew Now ] [ Review Later ]

-- 21 of 34 --

Page 22 of 34
2.2.6 CIBO Macrokiosk Template Management
# Requirement ID Item Description Acceptance Criteria
1 EAINT-12218-
REQ-008
New Module
and Settings
Screen
A new module named Macrokiosk
Template Management is added to the
left navigation menu of the CIBO
portal, placed below Discount Code
Management.
Selecting the module opens a Settings
panel holding the Cron Job control and
a Save button.
The module appears as the last item in
the left navigation menu and opens the
Settings panel when selected.

-- 22 of 34 --

Page 23 of 34
# Requirement ID Item Description Acceptance Criteria
2 EAINT-12218-
REQ-009
Template
Control
9 toggles are displayed, 1 for each
template, grouped by the cron job run
that sends it.
The default state for each is Enable.
The toggle displays Enable when
switched on and Disable when
switched off.
Switching 1 off stops that template
only. The other templates in the same
run continue to send.
The run times are displayed against
each group as read only text.
The toggles are a manual override. The
system sets them on its own under
Section 2.2.6 REQ-013 and REQ-014.
Example 1: Cron Job 1 at 9:00 AM
a. 3 toggles, being Set A for eSTM with
insurance, eSTM without insurance and
Secarang
Example 2: Set B Secarang toggle
switched off
a. The Set B Secarang template does not
send at 12:00 PM
b. The Set B eSTM templates still send at
12:00 PM
Example 3: Toggle switched off
a. Displays Disable

-- 23 of 34 --

Page 24 of 34
# Requirement ID Item Description Acceptance Criteria
3 EAINT-12218-
REQ-010
Save
Confirmation
Selecting Save stores the setting and a
confirmation popup is displayed in the
centre of the screen. The popup
remains until the user closes it using
the close icon at the top right.
The popup displays the message Settings
updated. and closes only when the user
selects the close icon.
4 EAINT-12218-
REQ-011
Effective Time
of Changes
Saved changes take effect from the
next scheduled run. A run already in
progress continues using the setting it
started with.
Example 1: User switches the Set B
Secarang toggle off at 11:30 AM
a. That template does not send at 12:00
PM
5 EAINT-12218-
REQ-012
Audit Log Every save is recorded in a backend
audit log capturing the user, the date
and time, the setting changed, the
value before the change and the value
after the change.
The log records which template was
changed, and whether the change was
made by a user or by the system.
The audit log is not displayed on the
screen.
Example 1: User switches the Set B
Secarang toggle from Enable to Disable
a. Log records the user, the date and time,
the template name, the value Enable and
the value Disable
Example 2: The system disables the Set B
Secarang template after an error
a. Log records the system as the source
of the change, the date and time, the
template name, the value Enable and the
value Disable

-- 24 of 34 --

Page 25 of 34
6 EAINT-12218-
REQ-013
Template
Paused
Handling
Where Macrokiosk returns an error for
a template, that template is disabled
automatically and its toggle is set to
Disable. The remaining messages for
that template in that run are not sent.
The other 8 templates are unaffected,
including the other 2 templates in the
same run.
An email notification is sent at the
same time.
Sender: imonitor@eauto.my
Recipient:
techsupport@macrokiosk.com
Copy:
1. katherine.low@macrokiosk.com
2. insurance@eauto.my
3. ba@eauto.my
4. kj.goh@modefair.com
The subject and body are set out in
Section 2.2.7.
Example 1: Macrokiosk returns an error
for the Set B Secarang template
a. That template is disabled and its toggle
is set to Disable
b. An email is sent to Macrokiosk support
with the requestor copied
c. The Set B eSTM templates still send at
12:00 PM
d. Cron Job 1 and Cron Job 3 are
unaffected

-- 25 of 34 --

Page 26 of 34
# Requirement ID Item Description Acceptance Criteria
7 EAINT-12218-
REQ-014
Template
Reactivation
Macrokiosk sends an update to eAuto
when a template is enabled on their
side.
On receipt of the update, the template
is enabled, its toggle is set back to
Enable, and it resumes on its next
scheduled run.
No manual action is required in the
CIBO Macrokiosk Template
Management screen.
Example 1: Set B Secarang template
disabled on 01.09.2026 after an error
a. Macrokiosk enables the template and
sends an update to eAuto
b. The toggle is set back to Enable on
receipt
c. The template sends on its next
scheduled run
Example 2: No update is received from
Macrokiosk
a. The template stays disabled and does
not send

-- 26 of 34 --

Page 27 of 34
2.2.7 Notification Email Content
The wording below was provided by the requestor. Values in angle brackets are filled in by the system. This email is sent for the
disable action only, as set out in Section 2.2.9.
Field Content
Subject CLARIFICATION ON TEMPLATE STATUS : <template name>
Body Dear Support Team,
Brand Name: Secarang (60182880075)
Date and Time: <date and time>
Error returned remark: <error message>
The template has been disabled on our side currently.
Please advise us reason for error and what is next cause of action.
This is system generated email.

-- 27 of 34 --

Page 28 of 34
2.2.8 Template Status Handling
Macrokiosk returns 1 of the statuses below for a template. Each status maps to an action taken by the system.
Status Description Action
Pending The template review is in progress. No action
Approved The template is active and ready to use. Enable
Rejected The template has been rejected during the review process. Disable
Deleted The template is deleted. Disable
InAppeal An appeal has been requested for disabled templates. No action
PendingDeletion The template is marked to be deleted. Disable
Disabled The template has been disabled due to recurring negative feedback from
recipients or for violating one or more policies.
Disable
Flagged The template is scheduled to be disabled due to low quality or off boarding. Alert only

-- 28 of 34 --

Page 29 of 34
Status Description Action
Reinstated The template is reactivated after appeal process is completed. Enable
Paused The template has been paused due to recurring negative feedback from
customers, or low read-rates. Message templates with this status cannot be
sent to customers.
Disable
LimitExceeded The number of messages businesses can send within a 24-hour period has
exceeded due to low-quality rating.
Disable
Unknown A situation for which details are not currently available. No action

-- 29 of 34 --

Page 30 of 34
2.2.9 Template Status Actions
# Requirement ID Item Description Acceptance Criteria
1 EAINT-12218-
REQ-015
Disable Action Where Macrokiosk returns a status of
Rejected, Deleted, PendingDeletion,
Disabled, Paused or LimitExceeded,
the template is disabled and handled
under Section 2.2.6 REQ-013.
The notification email in Section 2.2.7
is sent for this action.
Example 1: Toggle is Enable and the
status returns as Paused
a. The toggle is set to Disable
b. The template stops sending
c. The notification email is sent
Example 2: Toggle is already Disable and
the status returns as Paused
a. The toggle stays at Disable
b. No further change is made
2 EAINT-12218-
REQ-016
Enable Action Where Macrokiosk returns a status of
Approved or Reinstated, the template
is enabled and handled under Section
2.2.6 REQ-014.
Example 1: Toggle is Disable and the
status returns as Approved
a. The toggle is set to Enable
b. The template sends on its next
scheduled run
Example 2: Toggle is already Enable and
the status returns as Reinstated
a. The toggle stays at Enable
b. No further change is made

-- 30 of 34 --

Page 31 of 34
# Requirement ID Item Description Acceptance Criteria
3 EAINT-12218-
REQ-017
Alert Only
Action
Where Macrokiosk returns a status of
Flagged, the template continues to
send and the toggle stays at Enable.
Flagged means the template is
scheduled to be disabled rather than
already disabled, so no change is
made.
The notification email in Section 2.2.7
is not sent for this action.
Example 1: Toggle is Enable and the
status returns as Flagged
a. The toggle stays at Enable
b. The template sends on its next
scheduled run
c. No notification email is sent
4 EAINT-12218-
REQ-018
No Action Where Macrokiosk returns a status of
Pending, InAppeal or Unknown, no
change is made to the template or its
toggle.
Example 1: Toggle is Enable and the
status returns as Pending
a. The toggle stays at Enable
Example 2: Toggle is Disable and the
status returns as InAppeal
a. The toggle stays at Disable

-- 31 of 34 --

Page 32 of 34
Appendix — Requirement Change Log
# SRD
Version
Requirement ID Status Reason
1 1.0 EAINT-12218-
REQ-001
Added Baseline requirement for template structure
2 1.0 EAINT-12218-
REQ-002
Added Baseline requirement for send schedule
3 1.0 EAINT-12218-
REQ-003
Added Baseline requirement for customer source and eligibility
4 1.0 EAINT-12218-
REQ-004
Added Baseline requirement for basis of day count
5 1.0 EAINT-12218-
REQ-005
Added Baseline requirement for template content
6 1.0 EAINT-12218-
REQ-006
Added Baseline requirement for template category

-- 32 of 34 --

Page 33 of 34
# SRD
Version
Requirement ID Status Reason
7 1.0 EAINT-12218-
REQ-007
Added Baseline requirement for opt-out note
8 1.0 EAINT-12218-
REQ-008
Added Baseline requirement for new module and settings screen
9 1.0 EAINT-12218-
REQ-009
Added Baseline requirement for template control
10 1.0 EAINT-12218-
REQ-010
Added Baseline requirement for save confirmation
11 1.0 EAINT-12218-
REQ-011
Added Baseline requirement for effective time of changes
12 1.0 EAINT-12218-
REQ-012
Added Baseline requirement for audit log
13 1.0 EAINT-12218-
REQ-013
Added Baseline requirement for template paused handling

-- 33 of 34 --

Page 34 of 34
# SRD
Version
Requirement ID Status Reason
14 1.0 EAINT-12218-
REQ-014
Added Baseline requirement for template reactivation
15 1.1 EAINT-12218-
REQ-015
Added New requirement for disable action
16 1.1 EAINT-12218-
REQ-016
Added New requirement for enable action
17 1.1 EAINT-12218-
REQ-017
Added New requirement for alert only action
18 1.1 EAINT-12218-
REQ-018
Added New requirement for no action

-- 34 of 34 --
