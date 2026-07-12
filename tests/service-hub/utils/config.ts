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
    perSlot: Number(process.env.EAUTO_SLOT_PER_SLOT || 3),
    perDay: Number(process.env.EAUTO_SLOT_PER_DAY || 6),
    slotsPerDay: 2,
  },

  reschedule: {
    blackoutDays: 2, // +2 days: today & tomorrow blocked
  },

  pricing: {
    softwareInstallation: 50.0,
    sst: 0.08,
    softwareInstallationTotal: 54.0, // 50 + 8% SST
    biometricDevice: 850.0,
  },
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
  receipt: (txnId: string) => `/view/ucd/service-hub/receipt.do?txnId=${txnId}`,
  reschedule: (txnId: string) => `/view/ucd/service-hub/installation/reschedule.do?txnId=${txnId}`,
  // BO paths — verify against actual BO portal
  boAppointmentCalendar: "/view/bo/service-hub/appointment-calendar.do",
  boListing: "/view/bo/service-hub/listing.do",
};
