export const ENV = {
  baseUrl: process.env.EAUTO_BASE_URL || "https://staging.eauto.my/uat4",
  envPath: process.env.EAUTO_ENV_PATH || "/uat4",

  ucdUsername: process.env.EAUTO_UCD_USER || "",
  ucdPassword: process.env.EAUTO_UCD_PASS || "",

  boUsername: process.env.EAUTO_BO_USER || "",
  boPassword: process.env.EAUTO_BO_PASS || "",

  // Second UCD account for concurrency tests
  ucd2Username: process.env.EAUTO_UCD2_USER || "",
  ucd2Password: process.env.EAUTO_UCD2_PASS || "",

  // Per-run parameters keyed in via the runner UI (see the "Test data" panel).
  //  publicHoliday — a date (YYYY-MM-DD) the Public-Holiday tests try to book;
  //    they assert it is greyed out / unclickable on the calendar.
  //  referenceNo   — an existing Service Request reference the biometric
  //    free-install validity test uses (its remaining free installs are valid
  //    for 1 month, keyed to this reference).
  publicHoliday: process.env.EAUTO_PUBLIC_HOLIDAY || "",
  referenceNo: process.env.EAUTO_REF_NO || "",

  slotCapacity: {
    perSlot: Number(process.env.EAUTO_SLOT_PER_SLOT || 3), // 3 bookings per session
    perDay: Number(process.env.EAUTO_SLOT_PER_DAY || 6), // 6 bookings per day (UCD Portal)
    slotsPerDay: 2, // Morning (10am–12pm) + Afternoon (2pm–4pm)
  },

  reschedule: {
    // SRD 2.3.2.1 #6 Rules (via UCD Portal / self-service):
    //  1. +2 days minimum — today and tomorrow are blocked; earliest
    //     selectable date = today + 2.
    //  2. Availability fallback — if the +2 date is full, the next
    //     available date after it is offered instead (so the earliest
    //     *bookable* date may be later than +2).
    //  3. Bound by the 6 slots/day capacity.
    // Via CSE (call-in): no date limit and no slot cap (CSE capacity only).
    blackoutDays: 2,
  },

  calendar: {
    // SRD 2.3.2.1 #3: the calendar shows only the current month and the
    // following month (a 2-month window), not an open-ended lookahead.
    // Used by the actual boundary-rule assertions (e.g. "Book future dates
    // more than 2 months") — do not change this to work around a full
    // calendar; it must stay a faithful check of the real SRD rule.
    monthsVisible: 2,
    // For test-data ARRANGEMENT only (finding *any* open date to book
    // against), not for asserting the 2-month rule itself. Per user
    // direction (2026-07-30): staging's shared calendar is fully booked
    // through the real 2-month window right now, but real open dates exist
    // further out (verified live through November); the finder helpers page
    // this far forward when hunting for room so arrangement doesn't spuriously
    // fail just because the near-term window happens to be exhausted.
    searchMonthsAhead: 6,
  },

  pricing: {
    softwareInstallation: 50.0,
    sst: 0.08,
    softwareInstallationTotal: 54.0, // 50 + 8% SST
    biometricDevice: 850.0,
  },

  // Exact UI copy from the SRD — used for text assertions so tests fail
  // loudly if wording drifts.
  text: {
    // 2.3.2.1 #2 — payment confirmation popup
    paymentConfirm: "Sure to submit this payment?",
    // 2.3.2.1 #6 (Slot Selected → Not Available) — slot clash popup
    slotUnavailable:
      "Sorry, some selected time slot are booked. Please try again with another time slot or dates.",
    // 2.3.2.1 #6 (Reschedule Flow) — reschedule confirmation popup
    // Verified live (SIT2): "lose", not "lost".
    rescheduleConfirm:
      "Are you sure you want to reschedule? By proceeding you will lose your current appointment.",
    // 2.3.2.1 #5 (Reschedule Flow, note iii) — system remark set when a
    // UCD reschedules to today's date via the portal.
    sameDayRescheduleRemark: "UCD rescheduled on the same day.",
    // 2.3.2.1 #9 — request submitted confirmation
    requestSubmitted:
      "We have received your request and you will receive an email for confirmation.",
  },

  // BO Software Installation Details Page (2.3.2.6 #7) — Mark Failed reasons
  failedReasons: ["Reappointment", "Laptop/PC Issues", "Other"] as const,
};

// `txnId` params below are the FULL "key=value" pair (e.g. "txnId=232" or
// "transactionId=a23be953-..."), as returned by BasePage.getTxnIdFromUrl() /
// ServiceRequestListingPage.getRescheduleTxnId() — NOT a bare id. The app's
// post-payment redirect changed schemes (numeric txnId -> uuid
// transactionId) mid-deployment, so builders splice the pair in as-is
// (`?${txnId}`) instead of hardcoding the old param name, and stay correct
// under either scheme.
export const PATHS = {
  login: "/public/login/",
  ucdHome: "/view/ucd/home.do",
  serviceHub: "/view/ucd/service-hub/view.do",
  softwareInstallation: "/view/ucd/service-hub/installation.do",
  slotPicker: (txnId: string) => `/view/ucd/service-hub/installation/slot.do?${txnId}`,
  submitted: (txnId: string) => `/view/ucd/service-hub/installation/submitted.do?${txnId}`,
  biometricPurchase: "/view/ucd/service-hub/purchase.do",
  listing: "/view/ucd/service-hub/listing.do",
  // Verified live (uat4): the Listing's "View" link goes to receipt.do, not
  // details.do — details.do does not exist as a distinct page.
  requestDetails: (txnId: string) => `/view/ucd/service-hub/receipt.do?${txnId}`,
  receipt: (txnId: string) => `/view/ucd/service-hub/receipt.do?${txnId}`,
  reschedule: (txnId: string) => `/view/ucd/service-hub/installation/reschedule.do?${txnId}`,
  // BO paths — confirmed against the real BO portal HTML.
  // The BO "Biometric Device Purchase & Software Installation Listing" is
  // the single entry point; the Appointment Calendar is reached from it
  // via the "Appointment Calendar" button (no stable direct URL), so the
  // calendar page object navigates through the listing.
  boListing: "/view/bo/service-hub/listing/main.do",
  boSoftwareInstallationListing: "/view/bo/service-hub/listing/main.do",
  // Detail page needs BOTH txnId and apptId (one row per appointment).
  boSoftwareInstallationDetails: (txnId: string, apptId: string) =>
    `/view/bo/service-hub/detail.do?${txnId}&apptId=${apptId}`,
  boAppointmentCalendar: "/view/bo/service-hub/listing/main.do",
};
