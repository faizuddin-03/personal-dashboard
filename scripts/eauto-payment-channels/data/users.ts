// ── BO credentials ─────────────────────────────────────────
// Never hardcode credentials in tests. Read from process.env — the
// dashboard will inject these at runtime once a run route exists (mirrors
// scripts/eauto-company-checker/data/users.ts); fallbacks keep a bare local
// run working.
//
// TWO distinct named BO accounts, per the test sheet's Continuation Steps —
// NOT interchangeable:
//   mfared  — sets UCD group to Authorized Dealer, clicks "Submit For
//             Approval", and later clicks "Verified" on Registration
//             Documents.
//   jasons  — clicks "Approve" on the BO Application form.

export interface BoCredentials {
  username: string;
  password: string;
  role: 'mfared' | 'jasons';
}

const boUsers: Record<BoCredentials['role'], BoCredentials> = {
  mfared: {
    username: process.env.EAUTO_BO_MFARED_USERNAME || 'mfared',
    password: process.env.EAUTO_BO_MFARED_PASSWORD || 'password',
    role: 'mfared',
  },
  jasons: {
    username: process.env.EAUTO_BO_JASONS_USERNAME || 'jasons',
    password: process.env.EAUTO_BO_JASONS_PASSWORD || 'password',
    role: 'jasons',
  },
};

export const getBoUser = (role: BoCredentials['role']): BoCredentials => boUsers[role];
