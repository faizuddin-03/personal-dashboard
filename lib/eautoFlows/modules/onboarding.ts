import type { Fact, Source, Module, Step, Cronjob, TicketRef } from "../types";

// Source helpers (kept local so each module file stands alone).
const az = (ref: string, date?: string): Source => ({ kind: "azfar", ref, date });
const mi = (ref: string, date?: string): Source => ({ kind: "mine", ref, date });
const ji = (ref: string, date?: string): Source => ({ kind: "jira", ref, date });
const mr = (ref: string, date?: string): Source => ({ kind: "miro", ref, date });
const ts = (ref: string, date?: string): Source => ({ kind: "ts", ref, date });
const ae = (ref: string): Source => ({ kind: "askeauto", ref, date: "2026-10-23" });

const F = (text: string, sources: Source[], extra: Partial<Fact> = {}): Fact => ({ text, sources, ...extra });
const S = (title: string, sources: Source[], extra: Partial<Step> = {}): Step => ({ title, sources, ...extra });

const OB = "knowledge/cross-portal/onboarding.md";
const BOARD = "cr/_boards/miro-preapp-application/board.md";
const FLOW = "knowledge/flow-ucd-onboarding.md";
const PAY = "knowledge/flow-payment-channels.md";

export const onboarding: Module = {
  id: "onboarding",
  name: "Dealer Onboarding (Pre-Application → Application → UCD account)",
  short: "Onboarding",
  portals: ["Public onboarding form (/obs, no login)", "Back Office (Onboarding menu, /obs/admin)", "UCD portal (after activation)", "Fiuu payment gateway", "eSIM (SSM stand-in on staging)"],
  summary:
    "How a new car dealer becomes a UCD (eAuto user). The dealer fills a Pre-Application and pays RM108. Back Office approves it. The dealer then fills the Application, uploads documents and pays the registration fee. Back Office creates the company account and the dealer activates it. The UI says Pre-Application and Application. Code and SRDs say Pre-Onboarding (preOnb) and Onboarding (OBS). They are the same things.",
  related: ["ucd-portal", "payments-fees", "backoffice", "company-profile-einvoice"],
  glossary: [
    { term: "UCD", meaning: "Used Car Dealer. The dealer company that uses the eAuto UCD portal.", sources: [mi("knowledge/eauto-portals.md")] },
    { term: "OBS / obs", meaning: "The onboarding system. It is a separate app (eauto-onboarding) with its own public forms and back office pages, reached at staging.eauto.my/obs.", sources: [ae("Q1")] },
    { term: "Pre-Application", meaning: "Step one. Short public form plus RM108 payment. Record number looks like P260806/00738. Formerly called Pre-Onboarding.", sources: [az(OB), mr("miro-preapp-application")] },
    { term: "Application", meaning: "Step two. Long form (5 steps) opened from a signed link after the Pre-Application is approved. Record number looks like NA50000802. Formerly called Onboarding.", sources: [az(OB), mr("miro-preapp-application")] },
    { term: "Hardcopy & Acc Created", meaning: "A second status field on the Application. Values: Pending UCD, Pending UCD - Incomplete Docs, Pending Assignee, Registered. It is separate from the Application Status.", sources: [mi(FLOW), az(OB)] },
    { term: "UCD Group", meaning: "A label the BO assignee sets on the company: Corporate, Association, Authorised Dealer, UCD, Motor, Recon. Shown later on Manage Company Accounts.", sources: [mi(FLOW), ji("EAINT-10164")] },
    { term: "Assignee / Approver", meaning: "Two Back Office roles on an Application. The assignee checks stages and presses Submit for Approval. The approver gives final approval. One person cannot do both in a normal run.", sources: [az(OB)] },
    { term: "Extend (not Reactivate)", meaning: "Prod code has no reactivation job. Reactivation is a manual BO Extend action on the Application.", sources: [ae("prod code — Onboarding Application expiry")] },
    { term: "ObsPendingStatus", meaning: "The BO queue for each stage: PENDING_UCD, then PENDING_ASSIGNEE, then CHECKED.", sources: [ae("prod code — eauto-onboarding enums")] },
    { term: "Main User", meaning: "The first user of the new company. Activates the account with MyKad and thumbprint.", sources: [az("knowledge/_core/roles-and-accounts.md")] },
  ],
  flows: [
    // ------------------------------------------------------------------ 1
    {
      id: "pre-application",
      name: "Pre-Application (public form, SSM check, RM108 payment)",
      summary:
        "A potential dealer fills a short public form, the system checks the company with SSM, and the dealer pays RM108. The record is saved with status New and waits for Back Office review.",
      portals: ["Public onboarding form (/obs)", "Fiuu sandbox / gateway", "SSM e-Info (eSIM on staging)"],
      triggers: [
        {
          id: "apply-eauto-button",
          name: "“Apply eAuto” button on the eAuto login page",
          entry: "eAuto login page › Apply eAuto › Google reCAPTCHA › Pre-Application form",
          summary: "The normal way in. No login. One human reCAPTCHA tick is needed.",
          steps: [
            S("Click Apply eAuto", [mi(FLOW)], { where: "eAuto login page › Apply eAuto", detail: "The button calls doPreOnboard() and goes to /obs/preOnb/recaptcha." }),
            S("Tick reCAPTCHA", [az(OB), mi(FLOW)], { where: "/obs/preOnb/recaptcha", detail: "Google reCAPTCHA v2. After the tick the form opens at /obs/preOnb/form. Staging has no known bypass." }),
            S("Fill Step 1 – Pre-Application Form", [az(OB), mi(FLOW), ts("EAINT-5972 STEP1_TS1-TS3")], {
              where: "Pre-Application form › Step 1",
              detail:
                "Business name, Type of Business (5 choices), BRN or Trading Licence No, TIN (optional), showroom address, postcode, state, city, Admin In Charge name, mobile and email. Showroom address is forced to upper case.",
              branches: [
                { when: "Type is Sdn Bhd/Bhd, Sole Proprietorship/Partnership or LLP (SSM types)", then: "Old BRN / New BRN fields show. Either one is enough. SSM check runs when the New BRN field loses focus." },
                { when: "Type is Business Trading (Sabah) or (Sarawak) (non-SSM)", then: "Business Trading Licence No and a Trading Licence upload show. The state list is limited to that state." },
                { when: "SSM does not find the BRN", then: "The form switches to Business Trading (Sabah) by itself and shows a red reminder to confirm the business information." },
              ],
            }),
            S("TIN check", [az(OB), ts("EAINT-5972 TINVAL_TS6-TS10")], {
              detail: "A blank or wrong TIN shows a warning that does not block: “The TIN is invalid. This may affect e-Invoice submission. Click \"Next\" to proceed.” Click Next again to continue.",
            }),
            S("Step 2 – Business Info Review", [az(OB), mi(FLOW)], {
              where: "Pre-Application form › Step 2",
              detail: "Payment Summary: Pre-Application Fee RM100.00 + Service Tax 8% RM8.00 = RM108.00. Tick the non-refundable declaration. Choose a payment method.",
            }),
            S("Click Submit and Pay", [mi(PAY), az(OB)], {
              where: "Step 2 › Submit and Pay",
              detail: "A Fiuu gateway window opens. See flow “Payment channels”. On success the record is created with status New.",
              affects: ["onboarding › payment-channels"],
            }),
            S("Summary page", [az(OB), mi(PAY)], {
              where: "/obs/preOnb/summary/<uuid>",
              detail: "“Pre-Application Submitted for Review”. Shows Status New, Payment Details, Admin in Charge. Invoice and e-Invoice can be downloaded. Record number P + yymmdd + / + 5 digits. The SSM Document is bought automatically for a valid BRN and can be downloaded for 7 days.",
              affects: ["BO Pre-Application Listing", "BO SSM Transaction listing", "Consolidated e-Invoice listing"],
            }),
          ],
          sources: [mi(FLOW), az(OB)],
        },
        {
          id: "bo-generated-link",
          name: "Link generated by Back Office for a dealer",
          entry: "Back Office › Support › Onboarding › generate link (OnboardingController.generateOnboarding)",
          summary: "Production code has a BO screen that generates the first link for a dealer. That link opens the same public Pre-Application form.",
          steps: [
            S("BO generates the link", [ae("Q1")], { where: "Back Office › Support › Onboarding (/view/backoffice/support/onboarding/view.do)", detail: "Calls /api/admin/support/onboarding/generate.do." }),
            S("Applicant opens the link", [ae("Q1")], { where: "/preOnb/recaptcha → /preOnb/form", detail: "Public. No login. Holding the link is the only gate." }),
          ],
          sources: [ae("Q1")],
        },
        {
          id: "bo-new-application-shortcut",
          name: "BO “UCD New Application” shortcut (not a valid route)",
          entry: "Back Office › Onboarding › UCD New Application",
          summary: "QA found this shortcut stalls at approval. The Application Status dropdown only sets a field and makes a stub record with no expiry. Use the public form instead.",
          steps: [
            S("Open UCD New Application and set status by dropdown", [mi(FLOW)], { detail: "The dropdown sets the field. The button runs the workflow. Only the button path is real.", where: "Back Office › Onboarding › UCD New Application" }),
          ],
          sources: [mi(FLOW)],
        },
      ],
      affects: [
        F("BO Pre-Application Listing (/obs/admin/preOnb/enquiry) gets the record with status New.", [az(OB), mi(FLOW)]),
        F("BO SSM Transaction listing gets a row of Type Pre-Application. Columns: SSM Check, Payment N/A, SSM Final, Tx Status Pending/Approved/Failed.", [az("cr/_boards/miro-preapp-application/t38_3458764650939412742.tsv")]),
        F("Pre-Application audit log records every change.", [az(OB), ae("Q1")]),
        F("Invoice and e-Invoice are made and pushed to the e-invoice service (RabbitMQ). The Consolidated e-Invoice listing shows Type Pre-Application.", [ae("Q1"), az("cr/_boards/miro-preapp-application/t36_3458764647399514416.tsv")]),
        F("Emails fire: submission success to the Admin In Charge (CC apply@eauto.my) with Invoice PDF, plus e-Invoice PDF when the TIN is valid.", [az("cr/_boards/miro-preapp-application/t33_3458764647058719873.tsv")]),
      ],
      cronjobs: [
        { name: "PreObsEmailScheduler.sendUnsentSubmissionEmails", schedule: "Cron key scheduler.submissionemail.cronexpression; documented as every 3 minutes, 8am–11pm", does: "Retries Pre-Application submission emails that were not sent.", sources: [ae("Q1")] },
        { name: "PreObsSsmVerificationScheduler.retryFailedSsmVerifications", schedule: "Cron key scheduler.ssmverification.cronexpression; documented as every 2 minutes, 8am–11pm", does: "Retries failed SSM company lookups.", sources: [ae("Q1")] },
        { name: "SSM final-submission resubmit", schedule: "Every 2 minutes (staging, per Miro TS PO_SSM_FS_TS1)", does: "If SSM Final Submission failed at purchase, resubmits once eSIM returns code 005.", sources: [az(BOARD)] },
        { name: "Consolidated e-Invoice resubmission (Pre-Application)", schedule: "Monthly", does: "Resubmits LHDN-failed e-Invoices. Remark is “No TIN info has been provided.” (blank TIN) or “TIN verification failed. Kindly provide correct TIN information to eAuto customer service.” (invalid TIN).", sources: [az("cr/_boards/miro-preapp-application/t36_3458764647399514416.tsv")] },
      ],
      roles: [
        F("Applicant: public, no login. Only the link is needed.", [ae("Q1"), az(OB)]),
        F("The applicant link is locked to one session. Another session gets “not allowed to edit”.", [mi(PAY)], { unconfirmed: true }),
      ],
      afterCompletion: [
        F("A Pre-Application record with status New waits in BO Pre-Application Listing for review. It stays New until a BO approver acts.", [az(OB), mi(PAY)]),
      ],
      rules: [
        F("Statuses: NEW → APPROVED or REJECTED (one-way) or CANCELLED. Cancel is allowed only while status is New.", [ae("Q1"), ts("EAINT-5972 CANCEL_TS1-TS14")]),
        F("There is no HTML “required” on the form. All checks are done with JavaScript.", [az(OB)]),
        F("Postcode is not checked against state or city. 00000 is accepted.", [az(OB)]),
        F("Field limits: business name 100, BRN / licence 35 each, TIN 15 (9–15 chars, no checksum), postcode 5, admin mobile 11, admin email 100. A + in the admin email is stripped (Application form rejects plus-addressed emails).", [az(OB), mi(FLOW)]),
        F("SSM Document: UCD page hides the [SSM Document] button after 7 days. BO keeps it.", [az("cr/_boards/miro-preapp-application/t43_3458764648980755618.tsv")]),
        F("SSM error popups: “SSM e-Info is currently experiencing intermittent connectivity...”, “SSM (eAuto) server down, please try later.”, “Please call eAuto at 03-27798899.”.", [az("cr/_boards/miro-preapp-application/t38_3458764650939412742.tsv")]),
        F("On staging the SSM answer comes from eSIM. Seed the company in eSIM first (SSM Enquiry code 004 plus ROC/ROB/LLP submission code 005). Otherwise the form switches to Business Trading.", [mi(FLOW), mi("knowledge/esim.md")]),
        F("The Pre-Application “Submitted for Review” link never expires while status is New.", [az("cr/_boards/miro-preapp-application/t34_3458764647063659864.tsv")]),
        F("After a reload the saved form must stay on the chosen step and keep Type of Business (EAINT-12414 fix, deployed 2026-10-09, dev-tested only).", [mi(PAY), ji("EAINT-12414")]),
      ],
      scopeToCheck: [
        F("Check all 5 business types. SSM types need the company seeded in eSIM first.", [mi(FLOW), ts("EAINT-5972")]),
        F("Check the TIN warning is non-blocking and the second Next goes ahead.", [ts("EAINT-5972 TINVAL_TS6-TS10")]),
        F("Check Cancel only works for status New, needs a reason, shows Cancellation Reason and emails the applicant.", [ts("EAINT-5972 CANCEL_TS1-TS14")]),
        F("Check the BO Pre-Application Listing shows the new record, Approved Date and TAT columns, and the export columns.", [ts("EAINT-11536"), ji("EAINT-5972")]),
        F("Check the invoice and e-Invoice buttons follow TIN validity (valid TIN: both; blank or invalid TIN: Invoice only).", [mi("knowledge/business-rules-from-test-scenarios.md"), az("cr/_boards/miro-preapp-application/t33_3458764647058719873.tsv")]),
        F("Check the SSM Transaction listing row and the SSM Document 7-day rule on UCD vs BO.", [az("cr/_boards/miro-preapp-application/t43_3458764648980755618.tsv")]),
        F("Check reload and refresh resume on the form (EAINT-12414).", [ji("EAINT-12414")]),
        F("Check the consolidated e-Invoice listing after the monthly cronjob for blank and invalid TIN cases.", [az("cr/_boards/miro-preapp-application/t36_3458764647399514416.tsv")]),
      ],
      tickets: [
        { key: "EAINT-5972", date: "2026-07", what: "Business Type, Business Registration Type dropdown, TIN validation (non-blocking), Cancelled status, 4 new export columns", state: "latest" },
        { key: "EAINT-8864", what: "UCD Pre-Application listing", state: "latest" },
        { key: "EAINT-8863", what: "Prepopulate Pre-Application into the Application", state: "latest" },
        { key: "EAINT-11536", date: "2026-06", what: "Approved Date and Turn Around Time columns on both listings", state: "latest" },
        { key: "EAINT-9371", what: "SSM issue (retested 5/12)", state: "latest" },
        { key: "EAINT-12299", date: "2026-09", what: "Rename uploaded files with Chinese characters on upload (Code Review)", state: "latest" },
        { key: "EAINT-12247", date: "2026-09", what: "Pre-Application Step 1 save: SSM search reference numbers overlap (Code Review)", state: "latest" },
        { key: "EAINT-12414", date: "2026-10", what: "Production bug: reload resets to Step 1; no error on failed card payment", state: "latest" },
      ],
      openQuestions: [
        "There is no Showroom Ownership control on the Pre-Application form, though the handoff says Step 1 has one.",
        "Dates show DD-MM-YYYY while the SRD says YYYY-MM-DD.",
        "Whether Postcode must match State is not decided.",
        "A stored-XSS candidate in Showroom Address was seen but not verified.",
        "On staging the SSM lookup answered registered:false for real-looking BRNs on 2026-10-21. A theory says it rejects companies already onboarded. Not confirmed.",
      ],
    },

    // ------------------------------------------------------------------ 2
    {
      id: "bo-pre-application-review",
      name: "Back Office reviews a Pre-Application (Approve / Reject / Cancel)",
      summary:
        "A BO approver opens the Pre-Application, then approves, rejects or cancels it. Approving makes the Application at once and gives a link for the dealer.",
      portals: ["Back Office (Onboarding menu, /obs/admin)"],
      triggers: [
        {
          id: "bo-menu-listing",
          name: "BO Onboarding menu › UCD Pre-Application Listing",
          entry: "Back Office › Onboarding › UCD Pre-Application Listing › View",
          summary: "Click the menu item first. It creates the /obs session. Direct /obs/admin URLs return 403.",
          steps: [
            S("Open the Onboarding menu item", [az(OB), ae("Q1")], {
              where: "Back Office › Onboarding › UCD Pre-Application Listing (/obs/admin/preOnb/enquiry)",
              detail: "The menu item calls /api/admin/onboarding/auth-redirect.do (OnboardingController.authAndRedirect) to hand the session over to the OBS app.",
            }),
            S("Search and open the record", [az(OB)], {
              where: "Listing › View (opens a new tab)",
              detail: "Listing has 16 columns. Status filter: All / New / Approved / Rejected / Cancelled. SSM and LHDN status filters exist. Date range is limited to 6 months.",
            }),
            S("Approve", [az(OB), mi(FLOW)], {
              where: "Summary page › Approve",
              detail: "Dialog “Are you sure to approve the Pre-Application?” No / Yes. Status becomes Approved. Remark “APPROVED BY <user> on …”. The Application is created at once (same minute) with status Draft, blank Application No and a 90-day expiry clock. Email goes to the Admin In Charge. A Copy Link button appears.",
              affects: ["onboarding › application-form"],
            }),
            S("Reject", [az(OB)], { where: "Summary page › Reject", detail: "Tick one or more reasons, press Yes. Status Rejected." }),
            S("Cancel", [ts("EAINT-5972 CANCEL_TS1-TS14")], {
              where: "Summary page › Cancel",
              detail: "Only when status is New. Reasons: Incomplete Documentation, Invalid or Expired Registration, Data Mismatch, Not Eligible for eAuto, Others. Status Cancelled and an email to the applicant.",
            }),
          ],
          sources: [az(OB), ae("Q1")],
        },
      ],
      affects: [
        F("The applicant’s “Submitted for Review” page flips to Approved or Rejected.", [az(OB)]),
        F("A new Application appears in BO UCD Application Listing (/obs/admin/enquiry).", [az(OB)]),
        F("The Application link in Copy Link may contain &amp; — decode it to & or the link gives 403.", [mi(FLOW)]),
        F("Production sends the Application link by email. On staging QA copies it from BO.", [mi(FLOW)]),
      ],
      cronjobs: [],
      roles: [
        F("Pre-Application Listing is visible to BO users including Ops, HubAdmin, Admin and Finance. It is NOT visible to the Probation role (direct URL redirects too).", [az("cr/_boards/miro-preapp-application/t11_3458764646478824620.tsv"), ae("Q1")]),
        F("In production, any logged-in BO user except role Probation can jump into OBS.", [ae("Q1")]),
        F("Assignee view and approver view are different BO accounts.", [az(OB)]),
      ],
      afterCompletion: [F("Application record (status Draft/New) with a signed link `/obs/form/<uuid>?id=<BRN>&s=<hash>&v=1`.", [az(OB), mi(FLOW)])],
      rules: [
        F("LHDN Response Status “Failed” with remark “No TIN info has been provided” is normal for a blank TIN and does not block approval.", [az(OB)]),
        F("First status after payment is New (not “Submitted”).", [az(OB), mi(PAY)], { alt: [{ text: "One sheet expects Pre-Application listing status Approved after payment.", sources: [mi(PAY)], note: "Not confirmed which sheet intends this; live runs show New." }] }),
        F("The Pre-Application listing has no payment column. Failed, abandoned or pending pre-apps are not listed.", [mi(PAY)], { unconfirmed: true }),
        F("A BO user needs an OBS session. BO logout on /obs pages is a native confirm; use /<instance>/user/logout.do.", [mi(FLOW)]),
      ],
      scopeToCheck: [
        F("Check approve, reject and cancel each with the right dialog, remark and email.", [ts("EAINT-5972"), az(OB)]),
        F("Check the new Application is created at once with status Draft and a 90-day expiry.", [az(OB)]),
        F("Check the listing filters (status, SSM, LHDN) and the 6-month range.", [az(OB)]),
        F("Check a Probation user cannot see the menu or the direct URL.", [az("cr/_boards/miro-preapp-application/t11_3458764646478824620.tsv")]),
        F("Check Approved Date and TAT (DD MMM YYYY HH:MM AM/PM; TAT = approval minus submission; same day = 0).", [ts("115366_TS01-TS10"), mi(FLOW)]),
      ],
      tickets: [
        { key: "EAINT-5972", date: "2026-07", what: "Cancelled status and cancel reasons", state: "latest" },
        { key: "EAINT-11536", date: "2026-06", what: "Approved Date and TAT columns", state: "latest" },
        { key: "EAINT-8864", what: "UCD Pre-Application listing", state: "latest" },
        { key: "EAINT-8860", what: "Email notifications", state: "latest" },
      ],
      openQuestions: ["What triggers a “Cancelled” Pre-Application is not specified in the SRD (BO action per EAINT-5972 TS)."],
    },

    // ------------------------------------------------------------------ 3
    {
      id: "application-form",
      name: "Application form (Steps 1–3) and BO Assignee / Approver review",
      summary:
        "The dealer opens the signed link and fills Business Information, Upload Files and Acknowledgement. BO then reviews it in two stages. Approval sends the document request email.",
      portals: ["Public Application form (/obs/form/…)", "Back Office (UCD Application Listing)"],
      triggers: [
        {
          id: "signed-link",
          name: "Signed Application link (email or BO Copy Link)",
          entry: "/obs/form/<uuid>?id=<BRN>&s=<hash>&v=1",
          summary: "No login and no reCAPTCHA. A fresh browser reopens at Step 1 (the step is kept in browser storage).",
          steps: [
            S("Step 1 – Business Information", [az(OB), mi(FLOW)], {
              where: "Application form › Step 1",
              detail: "Prefilled from the Pre-Application (type, name, BRNs, address). TIN is mandatory here and locked when carried over. SST must be exactly 15 characters. Ticking a choice (e.g. no association) creates upload rows in Step 2. Each Next shows “You have unsaved changes”; press Save & Continue.",
            }),
            S("Step 2 – Upload Files", [az(OB), ji("EAINT-11763")], {
              where: "Application form › Step 2",
              detail: "21 hidden file inputs. Files: pdf, png, jpg, jpeg, max 5MB; video mp4, max 20 seconds. Director identity rows follow the number of directors counted from the SSM document (ROC directors are filled from SSM). Also 4 showroom pictures, a showroom video with signboard, business card, auction-house deposit receipt (Carsome/Carro), association receipt (FMC/MMSDA/PEKEMA) and company stamp.",
              branches: [{ when: "Showroom Ownership is No Showroom", then: "What happens to uploads is not documented (largest gap of EAINT-11978)." }],
            }),
            S("Step 3 – Acknowledgement", [az(OB)], {
              where: "Application form › Step 3",
              detail: "Director / Business Owner in Charge (dropdown of SSM directors fills MyKad; non-SSM types type a 12-digit MyKad), PIC, e-Invoice person in charge (“Same as Director/Business Owner in Charge”). Press Submit → “Success Notification”.",
            }),
            S("Submission result", [az(OB), mi(FLOW), ae("Q1")], {
              detail: "Application No NA + 8 digits is assigned. The next BO user in rotation is auto-assigned. Status Pending; stage 1 shows Pending Assignee. A “Submission Successful” email goes to the dealer.",
              affects: ["BO UCD Application Listing", "Emails"],
            }),
            S("BO assignee reviews", [az(OB), mi(FLOW)], {
              where: "Back Office › UCD Application Listing › View › Application tab",
              detail: "Assignee sees Revert to UCD, Save, Submit for Approval (needs UCD Group set). Revert to UCD opens a popup: tick fields, remarks up to 3000 characters.",
            }),
            S("BO approver decides", [az(OB), mi(FLOW), ae("Q1")], {
              where: "Application tab (approver account)",
              detail: "Approver sees Re-evaluate, Save, Reject, Approve. Approve sets status Approved (stage 2 approved time set). The Registration Documents tab appears and an email asks the dealer for softcopy documents.",
              branches: [
                { when: "Re-evaluate", then: "Pick a reason (Pending latest documents, Pending new showroom, To correct Nature of Business, Pending Carsome/Carro’s confirmation, Pending FMC’s confirmation, Others). Status Re-evaluate." },
                { when: "Reject", then: "Pick a reason (No showroom, Runner, Workshop, Company/User Blacklisted, Used Car business is NOT core business, Others). Status Rejected." },
                { when: "Both users edit at once", then: "“Unable to Proceed — Action could not be completed because some details have changed. Please refresh and try again.”" },
              ],
            }),
          ],
          sources: [az(OB), mi(FLOW)],
        },
      ],
      affects: [
        F("BO UCD Application Listing (24 columns: Assignee, Approver, Softcopy Docs, Registration Fee, Hardcopy & Acc Created, etc.).", [az(OB)]),
        F("Application audit log and Company Account audit log.", [az(OB), ji("EAINT-5833")]),
        F("Application prefills from the Pre-Application. The Pre-Application record is not changed by edits.", [mi(FLOW), ts("EAINT-11978")]),
        F("Sample RHB documents (S1.1, S1.2) are attached in the onboarding email (EAINT-12219).", [ts("12219 TS-01")]),
      ],
      cronjobs: [
        { name: "Auto-assign next BO user", schedule: "At request time (not a scheduled job)", does: "Picks the next assignee in rotation when the Application is submitted.", sources: [az(OB)] },
      ],
      roles: [
        F("Two BO accounts are needed: assignee (checks stages, Submit for Approval, Verified) and approver (final Approve). With only the approver login a run stalls at Pending Assignee.", [az(OB), mi(FLOW)]),
        F("Approving an Application is limited to a hard-coded approver list in production code (AuthorisedUserList.obsApprover). Reassigning a case needs the EDIT_ASSIGNEE permission.", [ae("Q1")]),
      ],
      afterCompletion: [F("An Approved Application goes on to Step 4 Registration Documents.", [az(OB)])],
      rules: [
        F("Application statuses: New, Draft, Pending, KIV, Re-evaluate, Approved, Rejected, Expired. “Reverted to UCD” is an action, not a status.", [az(OB), ae("Q1")]),
        F("Stages: stage 1 Assignee/UCD, stage 2 Approver/Assignee, stage 3 Softcopy Docs, stage 4 Registration Fee, stage 5 Hardcopy & Acc Created (Pending UCD, Pending UCD - Incomplete Docs, Pending Assignee, Registered).", [az(OB), ae("Q1")]),
        F("Pre-submission REJECTED can be recovered to its prior status.", [ae("Q1")]),
        F("Statuses: NEW → DRAFT (Save Draft) → PENDING (Submit) → KIV / REEVALUATE / REJECTED / APPROVED (BO decision, stage2ApprovedAt set) → EXPIRED (expiry job, only if not yet Registered). Per-stage BO queue (ObsPendingStatus): PENDING_UCD → PENDING_ASSIGNEE → CHECKED.", [ae("prod code — ObsApplicationStatus, ObsPendingStatus")]),
        F("UCD Group (Corporate, Association, Authorised Dealer, UCD, Motor, Recon) is required before Submit for Approval, hidden after approval, prefilled and locked on Create New Company, and reset on Revert to UCD.", [mi(FLOW), ts("EAINT-10164 E2E_TS1-TS2")]),
        F("Showroom (EAINT-11978): the dealer cannot choose “No Showroom”, BO can. Editable in Pending, KIV and Revise. Not editable in Pending Approver.", [mi(FLOW), ts("EAINT-11978")]),
        F("Hardcopy: BO “Request Hardcopy Resubmission” needs an option and sends an Incomplete Hardcopy Documents email.", [ts("EAINT-11763 HC_M2_SSM_TS9"), ji("EAINT-11763")]),
        F("Unique per run: company name, BRN, TIN, SST, emails, MyKad numbers, Main User login. Reusing a director MyKad shows “The company and director existed in eAuto system”.", [mi(FLOW)]),
        F("Onboarding pages never finish loading (readyState stays loading) — automation must wait on commit, not load.", [mi(FLOW)]),
      ],
      scopeToCheck: [
        F("Check each business type through all 3 steps, including data carried over from the Pre-Application.", [ts("EAINT-11978"), ts("EAINT-11763")]),
        F("Check file limits (5MB files, 20 s video) and the director rows per SSM director count.", [ji("EAINT-11763"), az(OB)]),
        F("Check assignee vs approver buttons, Revert to UCD popup, Re-evaluate and Reject reasons.", [az(OB)]),
        F("Check the UCD Group rule and that it shows on BO Manage Company Accounts afterwards.", [ts("EAINT-10164")]),
        F("Check showroom editability per status (Pending, KIV, Revise, Pending Approver).", [ts("EAINT-11978")]),
        F("Check the Hardcopy & Acc Created column values and Application Status column after each action.", [az(OB)]),
        F("Check concurrent-edit message and the audit logs.", [az(OB)]),
        F("Check the emails in this flow (see flow “Onboarding emails”).", [az("cr/_boards/miro-preapp-application/t13_3458764654455162276.tsv")]),
      ],
      tickets: [
        { key: "EAINT-6233", what: "Auto-assign to Ops team and BO assignee selection", state: "latest" },
        { key: "EAINT-5833", what: "Application audit log and Company Account audit log description", state: "latest" },
        { key: "EAINT-9118", what: "Route application to the final reviewer", state: "latest" },
        { key: "EAINT-10164", date: "2026-07", what: "UCD Group on the company account", state: "latest" },
        { key: "EAINT-11763", date: "2026-07", what: "Prepopulate directors, file limits 2MB→5MB and video 5MB→20MB, Reverted Reason on BO, incomplete hardcopy handling", state: "latest" },
        { key: "EAINT-11978", date: "2026-08", what: "Showroom fields editable; No Showroom option for BO", state: "latest" },
        { key: "EAINT-12219", what: "RHB Offer Letter sample in onboarding email", state: "latest" },
        { key: "EAINT-12350", date: "2026-09", what: "Registration Payment Date and Registered Date in Application Listing (To Do)", state: "latest" },
      ],
      openQuestions: [
        "Does a dealer edit write back to the Pre-Application? Which statuses allow a dealer edit? (Azfar Q7.)",
        "Which BO user is the approver in production? A hard-coded list decides (Ask eAuto) — names are not in the docs.",
      ],
    },

    // ------------------------------------------------------------------ 4
    {
      id: "registration-and-account",
      name: "Registration Documents, registration fee and company account creation",
      summary:
        "After approval the dealer uploads RHB and company documents (Step 4) and pays the registration fee (Step 5). BO verifies, then creates the UCD company account. Only the Create Account button sets Registered.",
      portals: ["Public Application form (Step 4, Step 5)", "Back Office (Registration Documents tab, Manage Company Accounts)", "Fiuu gateway"],
      triggers: [
        {
          id: "step4-link",
          name: "Dealer link lands on Step 4 after Approval",
          entry: "Signed Application link (same URL) › Step 4 Registration Documents",
          steps: [
            S("Upload Registration Documents", [az(OB), mi(FLOW)], {
              where: "Application form › Step 4",
              detail: "Six required uploads: RHB Offer Letter, RHB Direct Debit Application Form, BoD Reso e-TukarMilik (companies) or LoA e-TukarMilik (Trading), RHB bank statement or welcome letter, eAuto BoD Reso / LoA, LHDN Tax Compliance Certificate. Each section: up to 2 files, pdf/png/jpg/jpeg, max 10MB. Every upload posts at once. Press Submit.",
            }),
          ],
          sources: [az(OB), mi(FLOW)],
        },
        {
          id: "bo-registration-doc-tab",
          name: "BO Registration Documents tab › Verified",
          entry: "Back Office › UCD Application › Registration Documents (/obs/admin/form/edit-registration-doc/<uuid>)",
          steps: [
            S("Assignee presses Verified", [az(OB), mi(FLOW)], {
              where: "Registration Documents tab › Verified (#to-submit-verified)",
              detail: "Dialog “Ready for UCD to post the registration documents?” Yes. The Registration Documents Verification Date is stamped. The dealer can now see Step 5.",
            }),
          ],
          sources: [az(OB), mi(FLOW)],
        },
        {
          id: "step5-payment",
          name: "Dealer pays the registration fee (Step 5)",
          entry: "Application form › Step 5 Payment › Submit & Pay",
          steps: [
            S("Pay the registration fee", [az(OB), mi(PAY)], {
              where: "Step 5 › Submit & Pay",
              detail: "Staging price RM1,500.00 = Dermalog Biometric Device RM850.00 + registration fee RM601.85 + Service Tax 8% RM48.15. Methods and gateway steps are in flow “Payment channels”. Success page “Application Payment Success” (Payment ID starts with A). BO Registration Fee column becomes OK.",
              affects: ["onboarding › payment-channels", "BO Application Listing"],
            }),
          ],
          sources: [az(OB), mi(PAY)],
        },
        {
          id: "bo-create-company",
          name: "BO creates the company account (Create Company from OBS)",
          entry: "Back Office › Manage Company Accounts › Create New (from OBS application) — /<instance>/view/account/company-obs/new.do?id=<uuid>",
          summary: "Works only when the OBS Application is Approved.",
          steps: [
            S("Set Hardcopy status", [az(OB), ae("Q1")], {
              detail: "BO Ops sets Hardcopy Doc status: Pending UCD - Incomplete Docs (with remarks and Request Hardcopy Resubmission) then Pending Assignee.",
            }),
            S("Open Create New Company from the OBS application", [ae("Q1"), mi(FLOW)], {
              where: "Back Office › Manage Company Accounts › Create New",
              detail: "The form is prefilled from Pre-Application and Application: company name, registration numbers, TIN, SST, showroom fields, BoD Reso / LoA attachments, SSM profile, Main User details, up to 10 directors. UCD Group is prefilled and locked.",
            }),
            S("Save, then Activate", [mi(FLOW), ts("EAINT-11979")], {
              detail: "There is no Verify step any more (EAINT-11979). Activate stays disabled until Save is pressed.",
            }),
            S("Company and Main User are created", [ae("Q1")], {
              detail: "A UCD Company Account and primary User Account are made (flag isCreatedFromObs=true). OBS is told at once that the hardcopy stage is REGISTERED (ObsStatusEventHandler.notifyObsCompanyRegistered). Hardcopy & Acc Created becomes Registered. This cannot be undone.",
              affects: ["BO Manage Company Accounts", "BO Application Listing"],
            }),
          ],
          sources: [ae("Q1"), mi(FLOW), az(OB)],
        },
      ],
      affects: [
        F("BO Manage Company Accounts gets a new company with the UCD Group column (between Company Type and Block STMS Transaction).", [mi(FLOW)]),
        F("BO Application Listing: Registration Fee (OK / Failed / Pending UCD), Hardcopy & Acc Created, Registered Date.", [az(OB), mi(PAY)]),
        F("Invoice / e-Invoice for the Application payment (Consolidated e-Invoice listing Type Application).", [az("cr/_boards/miro-preapp-application/t17_3458764662353826470.tsv"), ae("Q1")]),
        F("Emails: Document Submission Successful, Payment for Application, Successful Payment, Incomplete Hardcopy Documents Received.", [az("cr/_boards/miro-preapp-application/t14_3458764654459679341.tsv")]),
      ],
      cronjobs: [
        { name: "ObsEmailScheduler.sendUnsentSubmissionEmails", schedule: "Same cron key as PreObsEmailScheduler (every 3 min, 8am–11pm, documented)", does: "Retries Application payment-success emails that were not sent.", sources: [ae("Q1")] },
        { name: "Application consolidated e-Invoice resubmission", schedule: "Monthly", does: "Sends LHDN-failed Application payment e-Invoices again as consolidated (invalid TIN case).", sources: [az("cr/_boards/miro-preapp-application/t17_3458764662353826470.tsv")] },
      ],
      roles: [
        F("Ops assignee verifies documents. Account creation needs the Company Account screen rights plus a hard-coded createAccountAllowed list (AuthorizedUserList).", [az(OB), ae("Q1")]),
        F("Registered is set only by the Create Account button. It is never automated in tests.", [az(OB), mi(FLOW)]),
      ],
      afterCompletion: [
        F("A UCD company account (not yet active) with a Main User. The Main User then activates it (see flow “UCD account activation”).", [az("knowledge/_core/roles-and-accounts.md"), ae("Q1")]),
      ],
      rules: [
        F("Prod code: the production registration fee for UCD onboarding is RM601.85, held in the host company record that the onboarding payment screens read (set by a one-off database update script, not a settings file). It is paired with the Dermalog device fee RM850.00, and service tax is added before the final amount shows. Both payment controllers (pre-onboarding public application and main onboarding payment step) read the stored value and add tax; nothing is hard-coded in screen logic. This matches the staging breakdown below.", [{ kind: "askeauto", ref: "prod code prod/master (2026-10-22) — UCD registration fee and Fiuu cap answer", date: "2026-10-23" }]),
        F("Prod code: no Fiuu transaction cap exists. No maximum-amount check, cap field or limit logic is in the Fiuu settings or in any onboarding controller that builds the Fiuu checkout request (not found in code). Any cap would be enforced on Fiuu's own gateway, so a fee change above that limit would show only as a rejected payment at Fiuu.", [{ kind: "askeauto", ref: "prod code prod/master (2026-10-22) — UCD registration fee and Fiuu cap answer", date: "2026-10-23" }]),
        F("Registration fee on staging is RM1,500.00 (device RM850 + fee RM601.85 + SST RM48.15). Earlier it was RM990.00 (RM772 + 201.85 + 16.15). The fee is per environment — never assert a fixed price. Production fee is RM601.85 (see prod code rule above). The staging amount comes from Fiuu's simulator and QA cannot control it.", [mi(PAY), az(OB), mi("Faizuddin decision in chat", "2026-10-23")], {
          alt: [{ text: "Registration fee RM990 in Faizuddin’s older rules summary.", sources: [mi("lib/ticketStudies EAINT-12257")], note: "Older value. Staging showed RM1,500 on 2026-10-21." }],
        }),
        F("Hardcopy & Acc Created values: Pending UCD → Pending UCD - Incomplete Docs → Pending Assignee → Registered.", [ae("Q1"), az(OB)]),
        F("Payment-fee listing status: Pending UCD → OK or Failed.", [ae("Q1")]),
        F("Statuses: Hardcopy & Acc Created (ObsHardcopyStatus) PENDING_UCD → PENDING_UCD_INCOMPLETE_DOCS → PENDING_ASSIGNEE → REGISTERED. REGISTERED flips by itself when BO creates the UCD company account in eAuto core. Fee stage (ObsPaymentListingStatus) PENDING_UCD → OK or FAILED.", [ae("prod code — ObsHardcopyStatus, ObsPaymentListingStatus")]),
        F("eAuto core and OBS talk by API-key REST calls (OnboardingAPITransport) and a RabbitMQ exchange named eauto-obs-data-transfer.", [ae("prod code — OnboardingAPITransport, ObsEautoEventConsumer")]),
        F("Retry after a failed payment reuses the same payment record and reference number with a new transaction id. A PAID record cannot be retried.", [mi(PAY)], { unconfirmed: true }),
        F("Application Status and Hardcopy & Acc Created are two independent fields.", [mi(FLOW)]),
        F("Fiuu sandbox: QA said it cannot take more than RM1,000, yet two RM1,500 FPX payments settled PAID on 2026-09-23.", [az(OB)], { unconfirmed: true }),
      ],
      scopeToCheck: [
        F("Check all six Step 4 uploads, the 2-file / 10MB limit and that uploads persist between visits.", [az(OB)]),
        F("Check Verified stamps the date and unlocks Step 5.", [az(OB)]),
        F("Check the registration fee amounts on Step 5, the invoice and the success page.", [mi(PAY)]),
        F("Check Create New Company prefill, UCD Group lock, Save then Activate, and that Registered is set.", [ts("EAINT-11979"), ts("EAINT-10164")]),
        F("Check BO Application Listing columns after each stage and the Registration Fee filter.", [mi(PAY), az(OB)]),
        F("Check Manage Company Accounts shows the UCD Group column.", [mi(FLOW)]),
        F("Check the Incomplete Hardcopy email (sender imonitor@eauto.my, To admin, CC apply@eauto.my, BCC assignee).", [ts("EAINT-11763 HC_M2_SSM_TS9")]),
      ],
      tickets: [
        { key: "EAINT-11763", date: "2026-07", what: "Hardcopy resubmission, Reverted Reason, file limits", state: "latest" },
        { key: "EAINT-11979", date: "2026-07", what: "Remove [Verify] from account creation (Save → Activate)", state: "latest" },
        { key: "EAINT-12221", date: "2026-09", what: "Hardcopy & Acc Created not updated after company account creation (production fix)", state: "latest" },
        { key: "EAINT-6499", what: "MVD content", state: "latest" },
        { key: "EAINT-12179", what: "Online onboarding access for all Ops (To Do)", state: "latest" },
      ],
      openQuestions: [
        "Does Fiuu itself enforce an amount cap (the sandbox cap issue)? Not in eAuto code; only Fiuu can say.",
        "Which instance’s Company Listing is authoritative for /obs onboarding is not confirmed.",
      ],
    },

    // ------------------------------------------------------------------ 5
    {
      id: "ucd-account-activation",
      name: "UCD account activation and Director bypass (BioID)",
      summary:
        "After BO creates the company, the Main User activates it with MVD agreement, MyKad and thumbprint, and a new password. Every director must also be verified or bypassed before BO can send the final activation email.",
      portals: ["UCD portal (/public/activation/)", "Back Office (Company Account details)"],
      triggers: [
        {
          id: "first-login",
          name: "Main User’s first login after BO activates the company",
          entry: "/public/activation/ “ACTIVATE USER ACCOUNT”",
          steps: [
            S("Log in with the new account", [az("cr/_boards/miro-preapp-application/t21_3458764654342573093.tsv"), ae("Q2")], {
              where: "Login page",
              detail: "A company that is not active gets “Sorry, your Company Account is not Active. Please check with eAuto office.” An active one with first-time login goes to the activation page.",
              branches: [{ when: "firstTimeLogin or resetPassword", then: "Forced to the change-password page before the homepage." }],
            }),
            S("MVD Agreement", [az("cr/_boards/miro-preapp-application/t21_3458764654342573093.tsv")], { where: "eAuto Account Activation page", detail: "Name = main user, Date = today, [Insert Company Name] = the UCD company. Ticking the box shows the Thumbprint Verification section." }),
            S("MyKad and thumbprint", [az("cr/_boards/miro-preapp-application/t21_3458764654342573093.tsv"), mi("knowledge/mykad-emulator.md")], { detail: "Must match a director in the SSM record, or “Please use the main user's MyKad”. QA uses the MyKad Reader Emulator.", affects: ["Platform › MyKad / thumbprint"] }),
            S("Change password", [az("cr/_boards/miro-preapp-application/t21_3458764654342573093.tsv")], { detail: "12+ characters. Message: “Password is updated successfully. Please go to Settings to activate the company account.”" }),
            S("Account Activation button (Settings)", [az("cr/_boards/miro-preapp-application/t21_3458764654342573093.tsv")], { where: "UCD › Settings › Account Activation", detail: "Only the main user sees it. Each director row shows green tick (verified), red cross (inactive) or yellow dash (Bypass BioID), with the link “Click to Activate Account”." }),
          ],
          sources: [az("cr/_boards/miro-preapp-application/t21_3458764654342573093.tsv")],
        },
        {
          id: "bo-bypass-bioid",
          name: "BO bypasses or removes a director’s BioID",
          entry: "Back Office › Company Account Details › List of Director › MyBioID Activation",
          steps: [
            S("BO uses BYPASS BIOID / REVERT BYPASS / REMOVE", [az("cr/_boards/miro-preapp-application/t28_3458764654597856600.tsv")], {
              detail: "Column shows Verified at <date time>, Bypass at <date time> or “-”. The BYPASS BIOID link is shown only to named assignees. When every director is done, an email “Bio ID Completed” goes to apply@.",
            }),
          ],
          sources: [az("cr/_boards/miro-preapp-application/t28_3458764654597856600.tsv")],
        },
        {
          id: "bo-send-activation-email",
          name: "BO presses “Send UCD Activation Email”",
          entry: "Back Office › Company Account screen › Send UCD Activation Email (/ajax/account/company/send-ucd-activation-email.do)",
          summary: "From production code. The button lights up only when all directors are verified or bypassed, the bank account is active and the group type is set.",
          steps: [
            S("BO clicks the button", [ae("Q1")], { detail: "Fires an event so OBS sends the account-activated email. Sets sentActivationEmail=true, so it cannot be sent again from this button." }),
          ],
          sources: [ae("Q1")],
        },
      ],
      affects: [
        F("BO Company Account Details › List of Director › MyBioID Activation column.", [az("cr/_boards/miro-preapp-application/t28_3458764654597856600.tsv")]),
        F("Email “RHB Islamic Account Linked with JPJ” goes to the Main User (CC apply@).", [az("cr/_boards/miro-preapp-application/t16_3458764654474369943.tsv")]),
        F("UCD portal becomes usable: the Main User reaches the UCD homepage.", [ae("Q2")]),
      ],
      cronjobs: [],
      roles: [
        F("Main User activates. Sub users do not see the Account Activation button.", [az("cr/_boards/miro-preapp-application/t21_3458764654342573093.tsv")]),
        F("BYPASS BIOID is shown only to named BO assignees.", [az("cr/_boards/miro-preapp-application/t28_3458764654597856600.tsv")]),
        F("Appointing a new Main User: position moves to the first row if the person is a sub user and a director; thumbprint is needed unless the previous main user already did a first login.", [az("cr/_boards/miro-preapp-application/t40_3458764658888973104.tsv")]),
      ],
      afterCompletion: [F("An active UCD company with a Main User.", [az("knowledge/_core/roles-and-accounts.md")])],
      rules: [
        F("If a director is bypassed or removed in BO, “Click to Activate Account” fails with “Director status has been updated. Please try again.”", [az(BOARD)]),
        F("Test data may use the same IC for all directors. The BA agreed to keep this behaviour.", [az(BOARD)]),
        F("A new company ID needs a Dev emulator patch before MyKad works on activation.", [az("knowledge/_core/roles-and-accounts.md")]),
        F("Login is allowed only when CompanyStatus is Activated. Other statuses (New, Inactivated, Rejected, Terminated) block login.", [ae("Q2")]),
      ],
      scopeToCheck: [
        F("Check activation end to end: MVD agreement, MyKad match, password rule, Account Activation button.", [az("cr/_boards/miro-preapp-application/t21_3458764654342573093.tsv")]),
        F("Check bypass, revert bypass and remove, then the activation link message.", [az("cr/_boards/miro-preapp-application/t28_3458764654597856600.tsv")]),
        F("Check the “Bio ID Completed” and “RHB Islamic Account Linked with JPJ” emails.", [az("cr/_boards/miro-preapp-application/t16_3458764654474369943.tsv")]),
        F("Check the Send UCD Activation Email button state and that it cannot be sent twice.", [ae("Q1")]),
        F("Check Main User change rules.", [az("cr/_boards/miro-preapp-application/t40_3458764658888973104.tsv")]),
      ],
      tickets: [
        { key: "EAINT-9847", what: "Director removal", state: "latest" },
        { key: "EAINT-9784", what: "Activation defect", state: "latest" },
        { key: "EAINT-9787", what: "Activation defect", state: "latest" },
        { key: "EAINT-9788", what: "Activation defect", state: "latest" },
        { key: "EAINT-9795", what: "Activation defect", state: "latest" },
      ],
      openQuestions: [],
    },

    // ------------------------------------------------------------------ 6
    {
      id: "expiry-extension-reactivation",
      name: "Application expiry, reminders, extension and reactivation",
      summary:
        "An Application link lives 90 days. A daily job expires overdue Applications. BO can extend once. After the post-expiry window a RM108 reactivation is needed. Reminder emails are being built (EAINT-11868).",
      portals: ["Back Office (Registered Documents tab › Extend)", "Public Application link", "Backend jobs (eauto-onboarding)"],
      triggers: [
        {
          id: "daily-expiry-job",
          name: "Daily expiry job",
          entry: "ObsLinkExpirationScheduler.checkExpiredLinks (scheduled)",
          steps: [
            S("Job finds overdue Applications", [ae("Q1"), ts("11829_TS01")], {
              detail: "Sets status Expired and sends the link-expired email. It skips Applications already Registered, Rejected, or already Expired (no second email).",
              branches: [
                { when: "Status is New, Draft, Pending, Re-evaluate, or Approved with Hardcopy & Acc Created = Pending UCD / Incomplete Docs", then: "Expired + email." },
                { when: "Hardcopy & Acc Created = Registered (EAINT-11829 fix)", then: "Not expired, no email." },
              ],
            }),
            S("Dealer opens the link after expiry", [az(BOARD)], { detail: "“Application Link Expired” popup, then the Expired page. Same on Step 1–5, Back and Save & Continue." }),
          ],
          sources: [ae("Q1"), az(BOARD)],
        },
        {
          id: "bo-extend",
          name: "BO clicks Extend",
          entry: "Back Office › UCD Application Details › Registered Documents tab › Extend",
          steps: [
            S("Extend the link", [az(BOARD), ji("EAINT-11982")], {
              detail: "Visible to the Assignee when the Application is Approved and Hardcopy & Acc Created is not Registered. One time only (also blocked on the server). Before expiry: new expiry = original expiry + 30 days. After expiry (inside the 3-month post-expiry window): click date + 30 days. No email on extension. Remarks show on the right sidebar.",
              branches: [{ when: "Post-expiry window has ended", then: "A Reactivation (RM108) is needed instead." }],
            }),
          ],
          sources: [az(BOARD), ji("EAINT-11982")],
        },
        {
          id: "reminder-emails",
          name: "Reminder emails before expiry (EAINT-11868, Code Review)",
          entry: "System clock on the Application link",
          summary: "Not confirmed live. Ask eAuto found no reminder job in production code.",
          steps: [
            S("Reminder emails", [az(BOARD), ji("EAINT-11868")], {
              detail: "Application Completion Reminder 3 days after the assignee approves. Application Expiry Reminder 2 months before expiry (and 1 month before as Email 3). Reminders recalculate against an extended expiry.",
            }),
          ],
          sources: [az(BOARD), ji("EAINT-11868")],
        },
      ],
      affects: [
        F("BO Application listing shows status Expired and Last Updated Date.", [ji("EAINT-11982")]),
        F("Expired email “Your Application Link Has Expired” goes to the dealer.", [az("cr/_boards/miro-preapp-application/t13_3458764654455162276.tsv")]),
        F("Many production patches extend expired Applications one by one (EAINT-12243, 12360–12382). These are one-off data jobs, not a flow.", [ji("EAINT-12243")]),
      ],
      cronjobs: [
        {
          name: "ObsLinkExpirationScheduler.checkExpiredLinks",
          schedule: "Cron key scheduler.linkexpiration.cronexpression; documented default once daily at midnight",
          does: "Bulk-expires overdue Applications (unless Registered) and sends link-expired emails.",
          sources: [ae("Q1")],
        },
        {
          name: "Application expiry (90 days from creation)",
          schedule: "Evaluated at a 12:00 PM cutoff on the expiry date (job schedule itself not recorded)",
          does: "Sets status Expired.",
          sources: [az(BOARD)],
        },
        {
          name: "Application reminder jobs",
          schedule: "3 days after approval and 2 months before expiry (frequency not recorded)",
          does: "Send completion and expiry reminder emails.",
          sources: [az(BOARD), ji("EAINT-11868")],
          unconfirmed: true,
        },
      ],
      roles: [
        F("Extend: visible to the Assignee. Permission for other BO users is not known.", [az(BOARD)]),
        F("Audit trail for an extension is not known.", [az(BOARD)], { unconfirmed: true }),
        F("Certain BO users are blocked from Extend by name, through a hard-coded exclusion list in prod code.", [ae("prod code — Onboarding Application expiry")]),
      ],
      afterCompletion: [F("Expired Application: link shows the Expired page. Extended Application: new expiry date. Registered Application: unaffected.", [az(BOARD), ts("11829")])],
      rules: [
        F("Link is valid 90 days from creation (to the minute). A 1–2 minute difference from Submission Date is correct.", [az(BOARD), mi(FLOW)], {
          alt: [{ text: "Job expires Applications 90 days after Submission Date.", sources: [ts("11829")], note: "TS wording; dev patches Submission Date to test." }],
        }),
        F("Prod code: the expiry job only runs if its on/off setting is on. It expires Applications that are not Rejected or Expired, past their expiry date, and not yet Registered, in batches (default 1000 per run, configurable). The number of days from creation to expiry is a setting, not a fixed number in code.", [ae("prod code — ObsLinkExpirationScheduler")], {
          alt: [{ text: "Link is valid 90 days from creation.", sources: [az(BOARD), mi(FLOW)], note: "Shown fact kept (90 days). Prod code says the day count is configuration, so 90 is not visible in code." }],
        }),
        F("Prod code Extend rules: allowed only after stage-2 approval, not rejected, not yet Registered, never extended before, and inside a window around the expiry date. Window size and cut-off are settings. Code comments describe 30 days before to 3 months after expiry. Extension adds a configurable number of days and returns the Application to Approved or Pending. No email is sent.", [ae("prod code — Onboarding Application expiry")]),
        F("Approved link start = approval time, valid 90 days.", [az("cr/_boards/miro-preapp-application/t34_3458764647063659864.tsv")]),
        F("BO can set status to Expired from New, Draft, Pending, Re-evaluate, Approved, or Approved + Hardcopy Pending Assignee.", [az(BOARD)]),
        F("Rejected stays Rejected. Approved with Hardcopy = Registered stays Approved and its link opens Application Payment Success.", [ts("11829_TS01-TS15"), mi(FLOW)]),
      ],
      scopeToCheck: [
        F("Check every status × business type × Hardcopy & Acc Created state against the expiry job.", [ts("11829")]),
        F("Check the expired email is sent once and the link popup then page.", [ts("11829_TS01")]),
        F("Check Extend visibility, one-time rule, before-expiry vs after-expiry date maths, and the post-expiry window.", [az(BOARD)]),
        F("Check reminder emails recalculate after an extension.", [az(BOARD)]),
        F("Check the Registered case is never expired (EAINT-11829).", [az(OB)]),
      ],
      tickets: [
        { key: "EAINT-11829", date: "2026-06", what: "Expiry job must not expire Registered Applications", state: "latest" },
        { key: "EAINT-11982", date: "2026-07", what: "Extend button and display conditions", state: "latest" },
        { key: "EAINT-11868", date: "2026-07", what: "Email reminders, expiry extension, link reactivation (Code Review; Miro TS-EXT01–17)", state: "latest" },
        { key: "EAINT-9850", what: "Related expiry work", state: "latest" },
        { key: "EAINT-9897", what: "Related expiry work", state: "latest" },
        { key: "EAINT-12346", date: "2026-09", what: "Patch expired Applications with Hardcopy & Acc Created = Registered", state: "latest" },
      ],
      openQuestions: [
        "Job time conflict: Ask eAuto says once daily at midnight (documented default). Azfar’s Miro notes say a 12:00 PM cutoff.",
        "Reminder jobs: Ask eAuto (prod code, 2026-10-23) confirms there is no reminder email type and no reminder job. Only the after-expiry email exists. Azfar’s Miro TS describes reminders and EAINT-11868 is still in Code Review, so they are not live yet.",
        "Extension size: how many days does Extend add in prod? Prod code reads it from a setting (Azfar says 30 days).",
        "Boundary day inclusive or exclusive (TS-EXT09) is blocked pending BA.",
        "Is the extension remark mandatory? Who else may extend? (TS-EXT15, TS-EXT16)",
      ],
    },

    // ------------------------------------------------------------------ 7
    {
      id: "onboarding-emails",
      name: "Onboarding emails (sender imonitor@eauto.my)",
      summary:
        "Every onboarding step sends an email. On approval of the Application the dealer gets an RHB account-opening guide and RHB Support gets an Appointment Letter (EAINT-12341, live since 2026-10-07).",
      portals: ["Email (Mailtrap inbox on staging)", "Back Office"],
      triggers: [
        {
          id: "pre-app-emails",
          name: "Pre-Application: payment success, approval, rejection",
          entry: "Pre-Application payment success or BO decision",
          steps: [
            S("Submission Successful email", [az("cr/_boards/miro-preapp-application/t33_3458764647058719873.tsv")], { detail: "To the Admin In Charge (CC apply@eauto.my). Subject “Submission Successful - [Pre-Application No] - [Company Name]”. Invoice PDF, plus e-Invoice PDF when the TIN is valid." }),
            S("Approval and rejection emails", [az("cr/_boards/miro-preapp-application/t33_3458764647058719873.tsv")], { detail: "To the same address (EMAIL_APR_PO, EMAIL_REJ_PO)." }),
          ],
          sources: [az("cr/_boards/miro-preapp-application/t33_3458764647058719873.tsv")],
        },
        {
          id: "application-stage-emails",
          name: "Application: submit, revert, approve, reject, documents, payment, hardcopy",
          entry: "Each Application step",
          steps: [
            S("Submission and review emails", [az("cr/_boards/miro-preapp-application/t13_3458764654455162276.tsv")], {
              detail: "Submitted → dealer “Submission Successful - {application_no} - {company_name}” and apply@ “New Application Submission”. Revert to UCD → “Please Update Your Application Information”. Final review pending → “Application Pending Final Review”. Reject → “Application Rejected: {Application No} - {Company Name}” with reasons. Re-evaluate → “Application Re-evaluation Required” to apply@.",
            }),
            S("Document and payment emails", [az("cr/_boards/miro-preapp-application/t14_3458764654459679341.tsv"), ji("EAINT-12461")], {
              detail: "“Request to Submit Required Documents” (Email 6) has a ROC template and a ROB/Enterprise/LLP/Trading Licence template. After EAINT-12461 each has 3 attachments: Sdn Bhd S2.4 sample RHB statement cover, S3.1 eAUTO BoD Reso eTukarMilik, S3.3 LHDN Sijil Pematuhan Cukai; others S2.4 RHB Welcome Letter, S3.1 eAUTO LoA eTukarMilik, S3.3 LHDN Sijil Pematuhan Cukai. Then Document Submission Successful, Payment for Application, Successful Payment, Incomplete Hardcopy Documents Received.",
            }),
            S("Link expired, Bio ID, RHB link emails", [az("cr/_boards/miro-preapp-application/t16_3458764654474369943.tsv")], { detail: "“Your Application Link Has Expired”; “Bio ID Completed” to apply@; “RHB Islamic Account Linked with JPJ” to the Main User." }),
          ],
          sources: [az("cr/_boards/miro-preapp-application/t13_3458764654455162276.tsv")],
        },
        {
          id: "approval-rhb-emails",
          name: "Application approval: RHB guide and Appointment Letter (EAINT-12341)",
          entry: "BO › Application › Approve (Application approval only; Pre-Application approval is NOT a trigger)",
          steps: [
            S("Approver approves the Application", [ts("12341_E2E1"), mi(FLOW), ji("EAINT-12341")], {
              detail: "Two emails go out. (1) RHB Account Registration Guideline to the dealer (CC apply@eauto.my): Template 1 “RHB Online Account Opening - [Application No] - [Company Name]” when 4 or fewer directors/owners and all Malaysian; Template 2 “RHB Branch Account Opening - …” when 5 or more or any foreigner. (2) Template 3 Appointment Letter to RHB Support (BIS.Support@rhbgroup.com), subject “Approved eAuto Registration - [Company Name] - [BRN Number]”, with the dealer and apply@ in CC.",
              branches: [
                { when: "Directors or owners 5 or more, or at least one foreigner", then: "Template 2 (Branch). Documents come from RHB Support." },
                { when: "Directors or owners 4 or fewer and none foreign", then: "Template 1 (Online) plus Template 3." },
              ],
            }),
          ],
          sources: [ji("EAINT-12341"), ts("12341")],
        },
        {
          id: "softcopy-email-disabled",
          name: "Softcopy Document Request email disabled in Production",
          entry: "Application approval (production)",
          steps: [S("Ops send the request manually", [ji("EAINT-12338", "2026-09-14")], { detail: "EAINT-12338 turned the automatic Softcopy Document Request email off in Production. Ops send it by hand. No QA was needed." })],
          sources: [ji("EAINT-12338", "2026-09-14")],
        },
      ],
      affects: [
        F("Mailtrap inbox on staging receives all onboarding emails.", [mi("knowledge/mailtrap.md"), az(OB)]),
        F("The old approved-Application email with 3 RHB documents (Offer Letter, Direct Debit form, Board of Resolution) is no longer sent.", [ts("12341_R4"), mi(FLOW)]),
        F("Email 14 “Submission Re-evaluate Notification” was added in SRD v1.2 of EAINT-9120.", [ji("EAINT-9120", "2026-01-12")]),
      ],
      cronjobs: [
        { name: "Email retry jobs (PreObsEmailScheduler, ObsEmailScheduler)", schedule: "Every 3 minutes, 8am–11pm (documented)", does: "Resend submission and payment-success emails that were not sent.", sources: [ae("Q1")] },
      ],
      roles: [F("Recipients are the dealer Admin In Charge, apply@eauto.my, the BO assignee (BCC/CC), the final reviewer, RHB Support and the Main User.", [az("cr/_boards/miro-preapp-application/t13_3458764654455162276.tsv")])],
      afterCompletion: [F("Emails only. No SMS or WhatsApp is sent by onboarding.", [ae("Q1")])],
      rules: [
        F("Email 6 content was set by EAINT-12341 and overridden by the newer EAINT-12461 (2026-10-09).", [ji("EAINT-12461"), ji("EAINT-12341")]),
        F("Admin email local-part cannot use +.", [az("automation/src/data/email-contracts.ts")]),
        F("BIS.Support@rhbgroup.com is a live external address. Redirect or stub it before testing.", [ts("12341_E2E1-E2E4")]),
        F("Template 3 text says “not eligible for online” even for a Template 1 company (REQ-006 is unconditional).", [ts("12341")], { unconfirmed: true }),
      ],
      scopeToCheck: [
        F("Check each email’s subject, sender, To/CC/BCC and attachments.", [az("cr/_boards/miro-preapp-application/t13_3458764654455162276.tsv")]),
        F("Check Template 1 vs 2 by business type, director count and nationality (OR rule).", [ts("12341 sections A-F")]),
        F("Check the old 3-document approval email is not sent.", [ts("12341_R4")]),
        F("Check Email 6 attachments after EAINT-12461.", [ji("EAINT-12461")]),
        F("Check email links open the right page.", [az("automation/src/data/email-contracts.ts")]),
      ],
      tickets: [
        { key: "EAINT-9120", date: "2025-11", what: "Base onboarding email notifications (Email 1–14)", state: "latest" },
        { key: "EAINT-8860", what: "Email notifications for Pre-Application", state: "latest" },
        { key: "EAINT-9839", what: "Email defects", state: "latest" },
        { key: "EAINT-12338", date: "2026-09", what: "Disable Softcopy Document Request email in Production", state: "latest" },
        { key: "EAINT-12341", date: "2026-10", what: "Replace Approved Application email with RHB guide to dealer and Appointment Letter to RHB Support (deployed 2026-10-07)", state: "latest" },
        { key: "EAINT-12461", date: "2026-10", what: "Update Email 6 content and attachments", state: "latest" },
      ],
      openQuestions: [
        "EAINT-12341 blocked items: Sdn Bhd directors have no nationality in SSM data; SECRETARY sits inside the DIRECTORS block; template for non-SSM; undefined behaviour if the dealer email cannot be found; appointment letter fields pending Operations.",
        "Is email sending synchronous or queued? Not answered (decides how long a test waits).",
      ],
    },

    // ------------------------------------------------------------------ 8
    {
      id: "payment-channels",
      name: "Onboarding payment channels (card, FPX B2C, FPX B2B, DuitNow QR)",
      summary:
        "Both fees (Pre-Application RM108 and the registration fee) are paid through Fiuu. Channels: Credit/Debit Card, Online Banking Personal (FPX B2C), Online Banking Business (FPX B2B, with a pending-approval page) and DuitNow QR.",
      portals: ["Public onboarding form (/obs)", "Fiuu sandbox payment and bank simulator", "Back Office"],
      triggers: [
        {
          id: "pre-app-pay",
          name: "Pre-Application: Submit and Pay (Step 2)",
          entry: "/obs/preOnb/form/<uuid> › Step 2 Business Info Review › Submit and Pay",
          steps: [
            S("Choose a payment tile", [mi(PAY)], {
              where: "Step 2",
              detail: "Tiles: Credit or Debit Card, Online Banking (Business) = FPX B2B, Online Banking (Personal) = FPX B2C, DuitNow QR (EAINT-12257). B2C banks: Maybank, CIMB, AmBank, Public, RHB, HLB, HSBC, Affin, Bank Rakyat, BSN.",
            }),
            S("Tick the declaration", [mi(PAY)], { detail: "Tick #agreeTerms. It is mandatory on the Pre-Application only (none on Step 5)." }),
            S("Pay at Fiuu", [mi(PAY)], { detail: "Popup to sandbox-payment.fiuu.com (“Connecting to FPX...”), then the bank simulator login, then TAC page. Pick the sandbox response there: 00 Approved, 51 Insufficient Funds, 80/BC cancel, 99 Pending for Authorization (B2B), OE not in FPX hours, OF timeout." }),
          ],
          sources: [mi(PAY)],
        },
        {
          id: "app-step5-pay",
          name: "Application: Submit & Pay (Step 5)",
          entry: "/obs/form/<sec>?id=<brn>&s=<token>&v=1 › Step 5 Payment › Submit & Pay",
          steps: [S("Choose a tile and pay", [mi(PAY)], { detail: "Same tiles and gateway steps as the Pre-Application. No declaration tick. Failure returns to Step 5 (box #payment-error-message)." })],
          sources: [mi(PAY)],
        },
        {
          id: "return-after-fail",
          name: "Return after a failed payment, or re-entry while B2B is pending",
          entry: "Gateway returns the dealer to Step 2 (Pre-Application) or Step 5 (Application)",
          steps: [
            S("Failed payment", [mi(PAY)], { detail: "Banner “Unsuccessful Payment - Something went wrong and your payment didn't go through. Please choose a payment method and retry.” The declaration stays ticked." }),
            S("B2B pending", [mi(PAY), ji("EAINT-12153")], { detail: "The dealer is sent to the Payment is Pending Approval page on every revisit until the authorizer acts." }),
          ],
          sources: [mi(PAY)],
        },
        {
          id: "duitnow-qr",
          name: "DuitNow QR channel (EAINT-12257)",
          entry: "Payment tile DuitNow QR › new window /obs/preOnb/landing/<uuid>/RPP_DuitNowQR",
          steps: [
            S("Scan and approve", [mi(PAY)], { detail: "QR page shows “DuitNow (Malaysia National QR)”, “Kindly scan the QR code below to proceed with payment. Do Not Refresh!” and a 3-minute timer. On the sandbox phone page choose Scan an Image File, then Approve or Reject." }),
            S("Result", [mi(PAY)], { detail: "Approve gives “Payment was successful!”. Timer end, Cancel, or closing the QR window = Failed." }),
          ],
          sources: [mi(PAY)],
        },
        {
          id: "b2b-authorizer",
          name: "FPX B2B (Business) maker and authorizer",
          entry: "Payment tile Online Banking (Business) › Fiuu B2B maker page",
          steps: [
            S("Maker authorizes", [mi(PAY), ji("EAINT-12588")], { detail: "Maker clicks Authorize on the Fiuu page. eAuto shows the Payment is Pending Approval page (7 days for the authorizer)." }),
            S("Checker approves", [mi(PAY)], { detail: "On the sandbox checker page the authorizer enters the Order ID and approves or rejects. Refresh the eAuto page to see success." }),
          ],
          sources: [mi(PAY), ji("EAINT-12153")],
        },
      ],
      affects: [
        F("BO Pre-Application summary Payment Details block; Application Listing Registration Fee column (filter select#stage4Status).", [mi(PAY)]),
        F("Invoice and e-Invoice are made. e-Invoice download is not offered on staging because of a TIN issue (Faizuddin marks it PASS).", [mi(PAY)]),
        F("B2B pending email from imonitor@eauto.my (CC apply@eauto.my), subject “[Pre-Application/Application No] [Company Name]: Payment Pending Approval - Awaiting Authorizer Approval”. Deadline is submitted date + 7 days 12:00 PM.", [mi(PAY), ji("EAINT-12153")]),
        F("Reconciling Fiuu onboarding payments is a To Do ticket.", [ji("EAINT-12336")]),
      ],
      cronjobs: [
        { name: "Pending-B2B 7-day expiry", schedule: "Not observed", does: "Pending approval not approved in 7 days returns the dealer to the payment page with unsuccessful-payment behaviour.", sources: [mi(PAY)], unconfirmed: true },
      ],
      roles: [
        F("Dealer applicant pays. BO assignee/approver sees the result. The B2B authorizer acts at the bank (Fiuu checker page in the sandbox). Where the authorizer approves in real life is not in the SRD.", [mi(PAY), ji("EAINT-12153")]),
      ],
      afterCompletion: [
        F("Pre-Application: /obs/preOnb/summary/<uuid> “Pre-Application Submitted for Review.” (Payment ID P + yymmdd + 6 digits, Status Paid) and BO Pre-Application listing (New).", [mi(PAY)]),
        F("Registration fee: same URL body replaced by “Application Payment Success” (Payment ID A…, PAID), then BO Application listing.", [mi(PAY)]),
      ],
      rules: [
        F("Fees: Pre-Application RM108.00 (RM100 + 8% SST RM8, non-refundable). Registration fee on staging RM1,500.00.", [mi(PAY), az(OB)]),
        F("Payment Reference ID prefix: P for Pre-Application, A for registration. Shown only on success pages, BO Payment Details and invoices — never after a failed attempt.", [mi(PAY)], { unconfirmed: true }),
        F("Retry reuses the same payment record and reference number with a new transaction id. A PAID record cannot be retried. Repeat success callbacks are ignored.", [mi(PAY)], { unconfirmed: true }),
        F("B2B (SRD v1.1 REQ-004–007): after Business payment go to Pending Approval; approved → normal success; pending → Pending page on every revisit; not approved in 7 days → back to payment with unsuccessful-payment behaviour. v1.2 adds Payment Submitted Date Time (REQ-008, B2B only), Payment Date Time (REQ-009, shows “-” while pending) and the pending email.", [mi(PAY), ji("EAINT-12153")]),
        F("Card same-tab return (EAINT-12414): lands on Step 2 with the banner, declaration still ticked, methods visible. A refresh after the error must not show the banner again.", [mi(PAY), ji("EAINT-12414")]),
        F("Fiuu sandbox has a response picker, so negative responses are chosen, not provoked. Duplicate and late callbacks are out of scope.", [mi("knowledge/eauto-payments.md")]),
        F("B2B sandbox banks are only ABB (Affin), ABBM (Affin Multi-Bank) and HLB. The eAuto tile shows “Affin Bank B2B” (FPX_B2B_ABBM); AffinMax was requested and a developer fix is pending.", [mi(PAY), { kind: "mine", ref: "memory eaint-12153-affinmax-pending", date: "2026-10-22" }]),
      ],
      scopeToCheck: [
        F("Official TS only (SharePoint): 12153 TS01–TS12 and 12257 TS01–TS13 cover B2B success/failed, pending revisit via email link, failed then success, B2C and card regression, and QR happy / reject-retry / cancel / close-window / timer-expiry.", [mi(PAY), ts("EAINT-12153"), ts("EAINT-12257")]),
        F("Payment-retry rows added 2026-10-22: 12153 TS09–TS12 (B2C Failed > Success, checking BO listing, CIBO and Pre-Application) and 12257 TS11–TS13 (reject and retry on BO Payment Details, cancel then close and reopen the link, timer expiry on the BO listing status).", [ts("EAINT-12153 SharePoint copy modified 2026-10-22", "2026-10-22"), ts("EAINT-12257 SharePoint copy modified 2026-10-22", "2026-10-22")]),
        F("Test both legs: Pre-Application and Application.", [mi(PAY)]),
        F("Check retry: BO Registration Fee Failed then OK.", [mi(PAY)]),
        F("Check card same-tab return and refresh resume.", [ji("EAINT-12414")]),
        F("Check invoice and e-Invoice content and BO listing status after each outcome.", [ts("12153_TS1")]),
        F("Check the pending email text, 7-day deadline and Pending page fields.", [ji("EAINT-12153")]),
      ],
      tickets: [
        { key: "EAINT-12153", date: "2026-08", what: "Add FPX B2B (and B2C, card) options with B2B pending approval pages; SRD v1.2 2026-09-04", state: "latest" },
        { key: "EAINT-12257", date: "2026-09", what: "DuitNow QR channel; SRD v1.0 2026-09-10", state: "latest" },
        { key: "EAINT-12259", date: "2026-09", what: "Credit/Debit Card channel (Done 2026-09-07)", state: "latest" },
        { key: "EAINT-12414", date: "2026-10", what: "Reload resets to Step 1; no banner on failed card payment", state: "latest" },
        { key: "EAINT-12588", date: "2026-10", what: "QA-Issue: Pending Approval page only appeared after refresh", state: "latest" },
        { key: "EAINT-12336", date: "2026-09", what: "Reconcile onboarding payments from Fiuu (To Do)", state: "latest" },
      ],
      openQuestions: [
        "B2B tile status was reported three ways (live 2026-08-23, not deployed 2026-09-30, absent 2026-10-21). Live runs on 2026-10-22 show B2B and DuitNow work. Treat 2026-10-22 as latest.",
        "The SSM document download on the success page returned a JPJ FAQ PDF (placeholder or defect).",
        "Card gateway (3DS/OTP, Fiuu or Razorpay) was never driven.",
        "Card has its own ticket EAINT-12259, but EAINT-12153 row 5 still lists it.",
      ],
    },
  ],
};

// Keep type helpers referenced so unused-import lint stays quiet.
export type _OnboardingTypeCheck = [Cronjob, TicketRef];
