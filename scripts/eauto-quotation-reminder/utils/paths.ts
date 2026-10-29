import { CONFIG } from '../data/config';

// Every URL the suite touches, in one place. Functions where an id is needed.
// Base is https://staging.eauto.my/<env> — <env> is a PATH segment, not a
// subdomain, so nothing here may start with a leading slash off the host.
export const PATHS = {
  login: () => `${CONFIG.baseUrl}/public/login/`,
  home: () => `${CONFIG.baseUrl}/view/ucd/home.do`,

  insuranceMain: () => `${CONFIG.baseUrl}/view/ucd/insurance`,
  quoteForm: () => `${CONFIG.baseUrl}/view/ucd/insurance/quote/quote.do`,
  insuranceListing: () => `${CONFIG.baseUrl}/view/ucd/insurance/enquiry`,

  estmListing: () => `${CONFIG.baseUrl}/view/ucd/estm/enquiry/main.do`,
  /** eSTM details takes ?id= — NOT ?transactionId=, unlike insurance. */
  estmDetails: (id: string) => `${CONFIG.baseUrl}/view/ucd/estm/enquiry/view.do?id=${id}`,
} as const;

/** Insurance listing status values. `DRAFT` renders as "Quotation" — the state
 *  the reminder cron targets. */
export const INSURANCE_STATUS = {
  all: '',
  quotation: 'DRAFT',
  pendingPayment: 'PENDING',
  created: 'SUCCESS',
  failed: 'FAILED',
  pendingApproval: 'APPROVAL',
  expired: 'EXPIRED',
} as const;

/**
 * The Status CELL text for each code above — knowledge/flow-insurance-purchase.md
 * § Listing filters and the status vocabulary. Used to filter listing rows by
 * READING the rendered label, not by driving the status dropdown: the
 * dropdown was silently hiding a row that existed (2026-08-18) — only the
 * vehicle-number filter is trusted now. See InsuranceListingPage.
 */
export const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Quotation',
  PENDING: 'Pending Payment',
  SUCCESS: 'Insurance Created',
  FAILED: 'Failed',
  APPROVAL: 'Pending Approval',
  EXPIRED: 'Quotation Expired',
};
