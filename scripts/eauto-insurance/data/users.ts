// ── Credentials ────────────────────────────────────────────
// Never hardcode credentials in tests. Read from process.env —
// the dashboard injects EAUTO_USERNAME / EAUTO_PASSWORD at runtime;
// fallbacks keep a bare local run working.

export interface UserCredentials {
  username: string;
  password: string;
  role: 'bo';
}

const users: Record<string, UserCredentials> = {
  bo: {
    username: process.env.EAUTO_USERNAME || 'faizuddinBO1',
    password: process.env.EAUTO_PASSWORD || 'password',
    role: 'bo',
  },
};

export const getUser = (role: keyof typeof users): UserCredentials => users[role];
