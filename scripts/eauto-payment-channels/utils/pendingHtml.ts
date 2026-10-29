// ── Skeleton marker ────────────────────────────────────────
// Every page-object method in this script throws this until real HTML is
// captured and the selectors are filled in. Deliberately distinct from a
// generic Error so a skeleton run's failure log reads as "nothing built
// yet here" rather than "something broke" — see AGENTS.md's HTML-capture
// rule: once the user drops the step-by-step page HTML, replace the throw
// in that one method with the real Playwright interaction, one method at a
// time, and remove the corresponding `pending()` call.

export class PendingHtmlCapture extends Error {
  constructor(step: string) {
    super(`⏳ Not implemented yet — pending HTML capture. Step: ${step}`);
    this.name = 'PendingHtmlCapture';
  }
}

export function pending(step: string): never {
  throw new PendingHtmlCapture(step);
}
