// QA Portal API token expiry (Settings → Integrations → API tokens on http://10.30.10.214).
// Only the expiry date is kept here; the token itself lives in Claude Code's user config.
const KEY = "qa_portal_token_expiry";
// Token created 2026-10-29, valid 30 days (Faizuddin). Used until a date is saved in Settings.
const DEFAULT_EXPIRY = "2026-11-28";

export function getQaPortalTokenExpiry(): string {
  try { return localStorage.getItem(KEY) ?? DEFAULT_EXPIRY; } catch { return DEFAULT_EXPIRY; }
}

export function setQaPortalTokenExpiry(date: string) {
  try {
    if (date) localStorage.setItem(KEY, date);
    else localStorage.removeItem(KEY);
  } catch { /* storage blocked */ }
}

// Whole days from today to the expiry date, both read as local dates.
export function qaPortalDaysLeft(expiry: string): number | null {
  if (!expiry) return null;
  const [y, m, d] = expiry.split("-").map(Number);
  if (!y || !m || !d) return null;
  const exp = new Date(y, m - 1, d).getTime();
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  return Math.round((exp - today) / (1000 * 60 * 60 * 24));
}
