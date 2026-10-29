/** Run settings. Credentials never live here — see src/accounts.js. */
require('./accounts'); // hydrates process.env from the shared store + project .env

const BASE = (process.env.EAUTO_BASE || 'https://staging.eauto.my').replace(/\/+$/, '');
const INSTANCE = process.env.EAUTO_INSTANCE || 'uat4';

/** Onboarding screens live under /obs, outside the instance path. */
const OBS = {
  applicationListing: `${BASE}/obs/admin/enquiry`,
  preApplicationListing: `${BASE}/obs/admin/preOnb/enquiry`,
  applicationEdit: (uuid) => `${BASE}/obs/admin/form/edit/${uuid}`,
  registrationDocs: (uuid) => `${BASE}/obs/admin/form/edit-registration-doc/${uuid}`,
  preApplicationSummary: (uuid) => `${BASE}/obs/admin/preOnb/summary/${uuid}`,
  preApplicationForm: `${BASE}/obs/preOnb/recaptcha`,
  /** The form itself. Reachable directly when a passed-gate session still counts. */
  preApplicationFormPage: `${BASE}/obs/preOnb/form`,
};

/** Which BackOffice logins play which part, per the 23-08-2026 walkthrough. */
const ROLES = {
  approver: process.env.EV_APPROVER || 'ops_jasons',
  assignee: process.env.EV_ASSIGNEE || 'hubadmin_bochar',
};

/** Application under test — set APP_NO in .env, or pass --app-no to the scripts. */
const APP_NO = process.env.APP_NO || '';

module.exports = { BASE, INSTANCE, OBS, ROLES, APP_NO };
