/**
 * Run settings and the URL map.
 *
 * `/obs` (the onboarding app) sits OUTSIDE the instance path; login/home take
 * the instance. Getting this wrong is the difference between a working session
 * and 39 bytes of empty HTML — see obs.ts.
 */
export const BASE = (process.env.EAUTO_BASE || "https://staging.eauto.my").replace(/\/+$/, "");
export const INSTANCE = process.env.EAUTO_INSTANCE || "uat4";

export const OBS = {
  applicationListing: `${BASE}/obs/admin/enquiry`,
  preApplicationListing: `${BASE}/obs/admin/preOnb/enquiry`,
  applicationEdit: (uuid: string) => `${BASE}/obs/admin/form/edit/${uuid}`,
  registrationDocs: (uuid: string) => `${BASE}/obs/admin/form/edit-registration-doc/${uuid}`,
  preApplicationSummary: (uuid: string) => `${BASE}/obs/admin/preOnb/summary/${uuid}`,
  recaptchaGate: `${BASE}/obs/preOnb/recaptcha`,
  preApplicationForm: `${BASE}/obs/preOnb/form`,
};

export const loginUrl = () => `${BASE}/${INSTANCE}/public/login/`;

/** Who plays which part. Credentials come from the dashboard, never from here. */
export interface Actor { user: string; pass: string }

export const APPROVER: Actor = {
  user: process.env.QR_APPROVER_USER || "",
  pass: process.env.QR_APPROVER_PASS || "",
};
export const ASSIGNEE: Actor = {
  user: process.env.QR_ASSIGNEE_USER || "",
  pass: process.env.QR_ASSIGNEE_PASS || "",
};

/** Display name to pick in the Assignee dropdown (not the login id). */
export const ASSIGNEE_NAME = process.env.QR_ASSIGNEE_NAME || "";
export const UCD_GROUP = process.env.QR_UCD_GROUP || "";

export const GATE_BUDGET_MS = Number(process.env.QR_GATE_BUDGET_MS || 300_000);
export const SCAN_BUDGET_MS = Number(process.env.QR_SCAN_BUDGET_MS || 600_000);
export const PAY_WAIT_MS = Number(process.env.QR_PAY_WAIT_MS || 1_800_000);

export const FEE_PREAPP = process.env.QR_FEE_PREAPP || "108.00";
export const FEE_REGISTRATION = process.env.QR_FEE_REGISTRATION || "990.00";
