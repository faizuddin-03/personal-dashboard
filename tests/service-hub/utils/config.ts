export const ENV = {
  baseUrl: process.env.EAUTO_BASE_URL || "https://staging.eauto.my/uat1",
  envPath: process.env.EAUTO_ENV_PATH || "/uat1",

  ucdUsername: process.env.EAUTO_UCD_USER || "",
  ucdPassword: process.env.EAUTO_UCD_PASS || "",

  boUsername: process.env.EAUTO_BO_USER || "",
  boPassword: process.env.EAUTO_BO_PASS || "",

  // Second UCD account for concurrency tests
  ucd2Username: process.env.EAUTO_UCD2_USER || "",
  ucd2Password: process.env.EAUTO_UCD2_PASS || "",

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
    monthsVisible: 2,
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
    rescheduleConfirm:
      "Are you sure you want to reschedule? By proceeding you will lost your current appointment.",
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

export const PATHS = {
  login: "/public/login/",
  ucdHome: "/view/ucd/home.do",
  serviceHub: "/view/ucd/service-hub/view.do",
  softwareInstallation: "/view/ucd/service-hub/installation.do",
  slotPicker: (txnId: string) => `/view/ucd/service-hub/installation/slot.do?txnId=${txnId}`,
  submitted: (txnId: string) => `/view/ucd/service-hub/installation/submitted.do?txnId=${txnId}`,
  biometricPurchase: "/view/ucd/service-hub/purchase.do",
  listing: "/view/ucd/service-hub/listing.do",
  requestDetails: (txnId: string) => `/view/ucd/service-hub/details.do?txnId=${txnId}`,
  receipt: (txnId: string) => `/view/ucd/service-hub/receipt.do?txnId=${txnId}`,
  reschedule: (txnId: string) => `/view/ucd/service-hub/installation/reschedule.do?txnId=${txnId}`,
  // BO paths — verify against actual BO portal
  boSoftwareInstallationListing: "/view/bo/service-hub/software-installation/listing.do",
  boSoftwareInstallationDetails: (txnId: string) =>
    `/view/bo/service-hub/software-installation/details.do?txnId=${txnId}`,
  boAppointmentCalendar: "/view/bo/service-hub/appointment-calendar.do",
  boListing: "/view/bo/service-hub/listing.do",
};
