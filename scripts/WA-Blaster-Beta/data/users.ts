// ── Credentials ────────────────────────────────────────────
// Never hardcode credentials in tests. Read from process.env —
// switching environments is a .env change, not a find-and-replace.

export interface UserCredentials {
  email: string;
  password: string;
  role: 'admin' | 'operator';
}

const users: Record<string, UserCredentials> = {
  admin: {
    email:    process.env.E2E_ADMIN_EMAIL    ?? 'admin@example.com',
    password: process.env.E2E_ADMIN_PASSWORD ?? 'ChangeMe123!',
    role: 'admin',
  },
  operator: {
    email:    process.env.E2E_OPERATOR_EMAIL    ?? 'support@example.com',
    password: process.env.E2E_OPERATOR_PASSWORD ?? 'ChangeMe123!',
    role: 'operator',
  },
};

export const getUser = (role: keyof typeof users): UserCredentials => users[role];

export const WRONG_PASSWORD  = process.env.E2E_WRONG_PASSWORD  ?? 'wrong-password';
export const INVITE_PASSWORD = process.env.E2E_INVITE_PASSWORD ?? 'Password123!';
export const RESET_PASSWORD  = process.env.E2E_RESET_PASSWORD  ?? 'BetaNew456!';
