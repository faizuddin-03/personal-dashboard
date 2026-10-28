// ── Environment & runtime configuration ───────────────────
// Every value is env-switchable; fallbacks keep local runs working.
// EAINT-12339 testing is scoped to uat1 only — Faizuddin, 2026-09-30.

const baseUrl = process.env.EAUTO_BASE_URL || 'https://staging.eauto.my/uat1';

// Service Portal is a separate app on its own host/path (credit/home), with
// its own login form (field names "name"/"pass", not "username"/"password").
const servicePortalBaseUrl = process.env.EAUTO_SP_BASE_URL || baseUrl;

export const CONFIG = {
  baseUrl,
  stagingLoginUrl: `${baseUrl}/public/login`,
  // Shared by UCD and BO (same host/session) — used to switch accounts
  // within one page/context instead of opening a second browser context, so
  // a multi-user flow stays in one video recording.
  logoutPath: '/user/logout.do',

  // UCD — only `ucdHome` is ever goto()'d directly; every deeper UCD screen
  // is reached by clicking real buttons/links from there (Faizuddin,
  // 2026-09-30: navigate via clicks, not page.goto() to a hardcoded path).
  // Paths below are kept only as documentation of where each click lands.
  ucdHome: '/view/ucd/home.do',
  ucdJomcheckMenuPath: '/view/ucd/jomcheck/view.do',
  ucdJomcheckPurchasePath: '/view/ucd/jomcheck/transaction/',
  ucdJomcheckListingPath: '/view/ucd/jomcheck/enquiry/',

  // BackOffice — only `boHome` is ever goto()'d directly; JomCheck screens
  // are reached by clicking real links from there (Faizuddin, 2026-09-30:
  // navigate via clicks, not page.goto()). Paths below are documentation of
  // where each click lands, confirmed from
  // _reference/html/eauto/bo-home-hub-admin.html.
  boHome: '/home/',
  boJomcheckEnquiryPath: '/view/jomcheck/enquiry', // "Transactions Relevant" -> Jomcheck Transaction
  boJomcheckReportListingPath: '/view/jomcheck/report-listing/index.do', // "Settings (Hub Admin)" -> JomCheck Report Listing

  // Service Portal (separate login). Login URL confirmed by Faizuddin,
  // 2026-10-05: https://staging.eauto.my/uat1/bank/login/ (the earlier
  // "/banker/login" guess returned "URL not found").
  servicePortalBaseUrl,
  servicePortalLoginUrl: `${servicePortalBaseUrl}/bank/login/`,
  servicePortalHomePath: '/credit/home/',
  servicePortalJomcheckListingPath: '/credit/home/jomcheck-report-listing/main.do',

  // File contract with the dashboard API route — do not move these
  inputFile: './input-rows.json',
  outputFile: './output-results.json',

  // Timeouts
  navigationTimeout: 60000,
  waitAfterPageLoad: 2000,
  waitAfterSearch: 1500,
  pollingInterval: 500,
  maxWaitForResult: 20000,
  // How long payNow() polls #result after accepting the payment dialog —
  // separate from maxWaitForResult (general-purpose, used elsewhere) because
  // this one specifically has to cover a REAL JomCheck API payment, which
  // Faizuddin confirmed, 2026-10-03, can take around 2 minutes end to end.
  // 5 minutes gives real headroom above that observed figure rather than
  // cutting it close.
  paymentProcessingTimeout: 5 * 60 * 1000,

  // EAINT-12412 (invoice / e-Invoice split). The e-Invoice button only
  // appears once LHDN has validated the submission — "it will take a couple
  // minutes until it is approved" (Faizuddin, 2026-10-01). The details page
  // is reloaded every `eInvoicePollInterval` until the button shows, up to
  // `eInvoiceApprovalTimeout`. Overrides: JOMCHECK_EINVOICE_TIMEOUT_MIN.
  eInvoiceApprovalTimeout: Math.max(1, Number(process.env.JOMCHECK_EINVOICE_TIMEOUT_MIN || 10)) * 60 * 1000,
  eInvoicePollInterval: 15 * 1000,
  // How long an Invoice / e-Invoice button may take to hand over its PDF
  // (download event or new tab) — utils/invoicePdf.ts.
  invoiceDownloadTimeout: 60 * 1000,
  // A BackOffice "Resubmit" of a failed JomCheck transaction calls the
  // JomCheck API again — same ceiling as a real payment.
  resubmitProcessingTimeout: 5 * 60 * 1000,

  // Bank/credit company a UCD purchase is shared with when a TS needs the
  // report on the Service Portal (TS37-TS39). Faizuddin, 2026-10-05:
  // "Automation will need to select 'X STAR TECHNOLOGY MALAYSIA SDN BHD'.
  // only after that can it make payment". Visible name on the UCD purchase
  // page's "Share Report with Financial Institution" list —
  // _reference/html/eauto/ucd-jomcheck-purchase-share-list-vehicle-found.html.
  shareCompany: process.env.JOMCHECK_SHARE_COMPANY || 'X STAR TECHNOLOGY MALAYSIA SDN BHD',

  // The UCD login's company, as the BackOffice Transaction Enquiry prints it
  // in "Company Name". A transaction found in BO is only usable in UCD when it
  // belongs to this company — the first live TS31 run (2026-10-05) picked
  // NH4566 from another company and UCD showed "No record found. Try again."
  // Confirmed by Faizuddin, 2026-10-05 ("the company name is correct");
  // matches the HXJ0001 row in _reference/html/eauto/bo-jomcheck-transaction-enquiry.html.
  ucdCompanyName: process.env.EAUTO_UCD_COMPANY || 'FAIZUDDIN AUTO TEST',

  // Parallel worker PAGES sharing the one login; override with
  // JOMCHECK_CONCURRENCY
  defaultConcurrency: 4,

  // "Find data" finder (utils/prePushFinder.ts): how many vehicles the TS27
  // finder checks at once, each in its own headless tab of the one BO login.
  // Faizuddin, 2026-10-05: "make it open 10 tabs at once", then "increase to
  // 20 tabs. its taking too long also".
  findConcurrency: Math.max(1, Number(process.env.JOMCHECK_FIND_CONCURRENCY || 20)),

  // eSim login for the eSim-driven TS (pages/EsimJomCheckPage.ts, run in the
  // test's own page). Blank falls back to eSim's admin/admin.
  esimUser: process.env.ESIM_USER || '',
  esimPass: process.env.ESIM_PASS || '',
};
