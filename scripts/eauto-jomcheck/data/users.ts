// ── Credentials ────────────────────────────────────────────
// Never hardcode credentials in tests. Read from process.env —
// fallbacks keep a bare local run working (matching other eauto-* scripts'
// convention, see scripts/eauto-insurance/data/users.ts).

export interface UserCredentials {
  username: string;
  password: string;
  role: 'bo' | 'ucd' | 'servicePortal';
}

const users: Record<string, UserCredentials> = {
  // Shared UCD/BO login — same host/login form regardless of portal; routing
  // to UCD vs BO pages depends on the account's role, not the URL.
  bo: {
    username: process.env.EAUTO_USERNAME || 'faizuddinBO1',
    password: process.env.EAUTO_PASSWORD || 'password',
    role: 'bo',
  },
  // UCD account — needed for the purchase half of any TS that spans UCD
  // (buy) -> BO (check listing), e.g. TS06/TS18. Given by Faizuddin, 2026-10-01.
  ucd: {
    username: process.env.EAUTO_UCD_USERNAME || 'faizuddin',
    password: process.env.EAUTO_UCD_PASSWORD || 'password',
    role: 'ucd',
  },
  // Service Portal — separate app, separate credentials. Default fallback is
  // the superadmin account ("Jason Seah" display name) used for TS38
  // (superadmin Severity-counter parity check) — Faizuddin, 2026-09-30.
  servicePortal: {
    username: process.env.EAUTO_SP_USERNAME || 'jasons',
    password: process.env.EAUTO_SP_PASSWORD || 'Pw1234@eauto',
    role: 'servicePortal',
  },
};

export const getUser = (role: keyof typeof users): UserCredentials => users[role];
