import fs from 'node:fs';
const f = 'pages/PaymentTypePage.ts';
let s = fs.readFileSync(f, 'utf8');
const rep = (a, b) => { if (!s.includes(a)) throw new Error(a.slice(0, 70)); s = s.replace(a, b); };
rep(`// ⚠ GrabPay / ShopeePay / Credit-Debit Card selectors are NOT yet confirmed
// from captured HTML — no _reference/html/secarang/ capture exists for this
// page after EAINT-12107 was pushed to staging. They are best-effort guesses
// built on the same shape as the FPX tile (a <label> wrapping an
// <input formcontrolname="paymentType">). The first run logs every option
// label it can see (\`logPaymentOptions()\`); capture the page HTML and tighten
// these before trusting a green result. Flagged in the dashboard and NOTES.`,
`// Tile shape CONFIRMED from _reference/html/secarang/payment-methods.html
// (staging /ia, 2026-10-16, before EAINT-12107 was pushed): each tile is a
// <label> wrapping a hidden input[formcontrolname="paymentType"] and a
// .payment-type-card whose <h6> holds the name — "Credit or Debit Card",
// "FPX Online banking", "SPayLater", "PayLater by Grab". No Pay button on the
// page. Tiles are matched on the START of the <h6> text so "PayLater by Grab"
// (BNPL) can never be taken for the new "GrabPay" tile.
// ⚠ Still unconfirmed: the wording of the new GrabPay / ShopeePay tiles and
// the "Full Amount" sub-option — that page has not been captured since the
// push. The first run logs every option label (\`logPaymentOptions()\`).`);
rep(`    const label = this.page.locator('label').filter({ hasText: pattern }).first();`,
    `    const label = this.optionLabels().filter({ has: this.page.locator('.payment-type-card h6', { hasText: pattern }) }).first();`);
rep(`await this.clickOption(/FPX/i, 'FPX Online banking');`, `await this.clickOption(/^\s*FPX/i, 'FPX Online banking');`);
rep(`  /** [unconfirmed selector] */
  async selectCreditDebitCard(): Promise<void> {
    await this.clickOption(/credit|debit/i, 'Credit or Debit Card');`,
`  /** Confirmed tile text "Credit or Debit Card". */
  async selectCreditDebitCard(): Promise<void> {
    await this.clickOption(/^\s*Credit or Debit Card/i, 'Credit or Debit Card');`);
rep(`  /** [unconfirmed selector] Clicks the GrabPay tile. */
  async selectGrabPay(): Promise<void> {
    await this.clickOption(/grab\s*pay/i, 'GrabPay');`,
`  /** [unconfirmed tile text] Clicks the new GrabPay tile — never "PayLater by Grab". */
  async selectGrabPay(): Promise<void> {
    await this.clickOption(/^\s*Grab\s*Pay/i, 'GrabPay');`);
fs.writeFileSync(f, s);
console.log('ok');
