export interface PrecheckRequestFields {
  vehicleNo: string;
  eftDateTime: string;
  receiptNo: string;
  eftReferenceNo: string;
  agCode: string;
  jpjRevenueCode: string;
  paymentMode: string;
  eftAmount: string;
  ssmOrCompanyNo: string;
  companyEmail: string;
  emailCc: string;
}

export interface PrecheckResponseFields {
  responseCode: string;
  vehicleRecord: string;
  vehicleStatus: string;
  verifiedStatus: string;
  usageCode: string;
  blacklistJpj: string;
  blacklistJsj: string;
  blacklistAgency: string;
  claimOwnership: string;
  vehicleInInvestigation: string;
  vehicleCondition: string;
  /** A 12th `~`-delimited segment appears on every live sample seen so far
   *  (e.g. `2026082483685479`) but isn't documented in the 11-field group
   *  below — kept raw rather than guessed at. */
  trailingUnknown: string;
}

// ── eDereg Pre-Checking JPJ XML Log — `~`-delimited field decode ────
// Field order confirmed from `_reference/JPJ XML Log - Code Splitter/✂️[QA]
// JPJ XML LOG - TEXT SPLITTER.xlsx` (Faizuddin, 2026-08-24, sheets " 🟧eDEREG
// PRE-CHECKING - JPJ EN..." / "🟧eDEREG PRE-CHECKING - JPJ ENQ..."),
// cross-checked against a live captured row
// (`_reference/codebases/AATF/EAINT-9306-bo-jpj-xml-log-precheck.html`).
//
// Request Data's Receipt No. / EFT Reference No. order is the SWAPPED
// (newer IDD) order — the splitter sheet's own header note reads "Added on
// latest IDD and swapped sequence with EFT Reference Number". The live
// sample confirms the swap already applies (a `DPC...`-prefixed value in
// the 3rd position, a `{yymmdd}{0807}{seq}`-shaped numeric in the 4th) — do
// NOT revert to the sheet's literal original column order without
// re-checking a live sample first.
//
// Same 11 response fields, in the same order, as the AATF-side
// `#result-container` block (PrecheckEnquiryPage.readResult/verifyDetailsPage)
// — `vehicleRecord`..`vehicleCondition` here correspond 1:1 to
// `#vehicleRecord`..`#vehicleCondition` there.
export function decodePrecheckRequestData(raw: string): PrecheckRequestFields {
  const [
    vehicleNo = '', eftDateTime = '', receiptNo = '', eftReferenceNo = '',
    agCode = '', jpjRevenueCode = '', paymentMode = '', eftAmount = '',
    ssmOrCompanyNo = '', companyEmail = '', emailCc = '',
  ] = raw.split('~');
  return { vehicleNo, eftDateTime, receiptNo, eftReferenceNo, agCode, jpjRevenueCode, paymentMode, eftAmount, ssmOrCompanyNo, companyEmail, emailCc };
}

export function decodePrecheckResponseData(raw: string): PrecheckResponseFields {
  const [
    responseCode = '', vehicleRecord = '', vehicleStatus = '', verifiedStatus = '',
    usageCode = '', blacklistJpj = '', blacklistJsj = '', blacklistAgency = '',
    claimOwnership = '', vehicleInInvestigation = '', vehicleCondition = '', trailingUnknown = '',
  ] = raw.split('~');
  return {
    responseCode, vehicleRecord, vehicleStatus, verifiedStatus, usageCode,
    blacklistJpj, blacklistJsj, blacklistAgency, claimOwnership,
    vehicleInInvestigation, vehicleCondition, trailingUnknown,
  };
}
