/**
 * EAINT-12257 — DuitNow QR payment channel.
 *
 * Two scenarios, one per payment point:
 *
 *   12257_TS01  Pre-application fee (RM 108) paid by DuitNow QR   — phases 1-2
 *   12257_TS02  Registration fee   (RM 990) paid by DuitNow QR    — phases 1-10
 *
 * TS02 pays the PRE-APPLICATION fee by FPX, which drives itself, so the operator
 * is only asked to scan ONCE — at the payment point actually under test.
 *
 * Test ids are `12257_TSnn` — the ticket number, not a module abbreviation.
 * lib/testEvidence.ts parses that prefix to name evidence folders, so the shape
 * has to survive: <ID>_TS<nn> followed by a colon.
 *
 * SCOPE: what is under test is eAuto's side only. Whatever the phone shows
 * belongs to Fiuu; the phone is how we trigger an outcome, not a surface we
 * assert on. The invoice/amount check is NOT a phone step — the invoice comes
 * from the system. `[from Faizuddin, 2026-09-03]`
 *
 * PROVENANCE: every selector except the DuitNow QR tile and its popup is ported
 * from the reference rig and was matched live on 2026-08-31. The QR ones are
 * [UNVERIFIED] — that channel is not built yet and no HTML has ever been
 * captured for it. See src/payment.ts.
 */
import { test, expect, type Browser, type Page } from "@playwright/test";
import { buildIdentity, type BusinessType, type Identity } from "../src/identity";
import { APPROVER, ASSIGNEE, OBS, GATE_BUDGET_MS, FEE_PREAPP, FEE_REGISTRATION } from "../src/env";
import { passRecaptchaGate, banner } from "../src/humanGate";
import { login } from "../src/login";
import * as bo from "../src/onboarding";
import * as dealer from "../src/dealer";
import * as listing from "../src/listing";
import type { PayMethod } from "../src/payment";

const identity = buildIdentity({
  businessType: (process.env.QR_BUSINESS_TYPE as BusinessType) || undefined,
  ownerTag: process.env.QR_OWNER_TAG || undefined,
  emailPrefix: process.env.QR_EMAIL_PREFIX || undefined,
  emailDomain: process.env.QR_EMAIL_DOMAIN || undefined,
  tinPrefix: process.env.QR_TIN_PREFIX || undefined,
  companyName: process.env.QR_COMPANY_NAME || undefined,
  businessLicenseNo: process.env.QR_LICENCE_NO || undefined,
  // SSM types only — a real company cleared by the Checker tab.
  oldBrn: process.env.QR_OLD_BRN || undefined,
  newBrn: process.env.QR_NEW_BRN || undefined,
  tin: process.env.QR_TIN || undefined,
  sst: process.env.QR_SST || undefined,
  adminEmail: process.env.QR_ADMIN_EMAIL || undefined,
});

/**
 * Every BackOffice phase gets its OWN fresh context, logged in and closed again.
 * The dealer context is separate and long-lived because it carries the passed
 * reCAPTCHA gate; BO phases never touch it.
 */
async function asRole<T>(
  browser: Browser,
  actor: { user: string; pass: string },
  who: string,
  fn: (page: Page) => Promise<T>,
): Promise<T> {
  const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 } });
  const page = await ctx.newPage();
  try {
    await login(page, actor, who);
    return await fn(page);
  } finally {
    await ctx.close();
  }
}

function announce(id: Identity): void {
  banner([
    `Run label      : ${id.runLabel}`,
    `Company        : ${id.companyName}`,
    `Trading licence: ${id.businessLicenseNo}`,
    `TIN            : ${id.tin}`,
    `Admin email    : ${id.adminEmail}`,
  ]);
  console.log(`[identity] ${JSON.stringify(id)}`);
}

/** Phases 1-2. Returns the pre-application uuid. */
async function driveToPaidPreApplication(page: Page, id: Identity, method: PayMethod): Promise<void> {
  await test.step("Phase 1 — pass the reCAPTCHA gate", async () => {
    await page.goto(OBS.recaptchaGate, { waitUntil: "domcontentloaded" });
    await passRecaptchaGate(page, GATE_BUDGET_MS);
  });
  await test.step(`Phase 2 — pre-application, paid by ${method.toUpperCase()}`, async () => {
    await dealer.submitPreApplication(page, id, method);
  });
}

/** Phases 3-9. Returns the application number. */
async function driveToVerifiedDocuments(
  browser: Browser,
  dealerPage: Page,
  id: Identity,
): Promise<{ applicationNo: string; uuid: string; dealerLink: string }> {
  const dealerLink = await test.step("Phase 3 — approver approves the pre-application", async () =>
    asRole(browser, APPROVER, "approver", async (page) => {
      const found = await bo.openPreApplication(page, id.companyName);
      return bo.approvePreApplication(found.page);
    }));

  await test.step("Phase 4 — dealer fills the application form", async () => {
    await dealer.fillApplicationForm(dealerPage, id, dealerLink);
  });

  // The identity is the expensive half of the run, so it is learned and logged
  // BEFORE the risky act. A failed assignment used to throw the number away.
  const { applicationNo, uuid, assigned } = await test.step("Phase 5 — approver assigns it", async () =>
    asRole(browser, APPROVER, "approver", async (page) => {
      const row = await listing.findByCompanyName(page, id.companyName);
      const u = await listing.openRow(page, row);
      console.log(`[result] applicationNo=${row.applicationNo}`);
      const ok = await bo.assignApplication(page, u);
      return { applicationNo: row.applicationNo, uuid: u, assigned: ok };
    }));

  await test.step("Phase 6 — assignee submits it for approval", async () =>
    asRole(browser, ASSIGNEE, "assignee", page => bo.setUcdGroupAndSubmit(page, uuid)));

  await test.step("Phase 7 — approver approves the application", async () =>
    asRole(browser, APPROVER, "approver", async (page) => {
      await bo.approveApplication(page, uuid);
      // The Assignee dropdown that was absent at phase 5 exists by Approved.
      if (!assigned) await bo.assignApplication(page, uuid);
    }));

  await test.step("Phase 8 — dealer submits the registration documents", async () => {
    await dealer.submitRegistrationDocs(dealerPage, id, dealerLink);
  });

  await test.step("Phase 9 — assignee verifies the documents", async () =>
    asRole(browser, ASSIGNEE, "assignee", page => bo.verifyRegistrationDocs(page, uuid)));

  return { applicationNo, uuid, dealerLink };
}

async function assertAmountCharged(page: Page, amount: string): Promise<void> {
  // Not a phone step — this reads from the system.
  const body = await page.locator("body").innerText();
  expect(body.replace(/,/g, ""), `the amount charged reads RM ${amount}`).toContain(amount);
}

/* ------------------------------------------------------------------ TS01 */

test("12257_TS01: Pre-application fee paid with DuitNow QR", async ({ page }) => {
  test.slow();
  announce(identity);

  await driveToPaidPreApplication(page, identity, "qr");

  await test.step("Assert eAuto recorded the payment", async () => {
    await expect(
      page.getByText(/payment\s*success|successfully\s*paid/i).first(),
      "eAuto shows the pre-application payment as successful",
    ).toBeVisible({ timeout: 60_000 });

    const body = await page.locator("body").innerText();
    const ref = body.match(/\bP\d{6}\/\d{4,6}\b/)?.[0];
    expect(ref, "a pre-application reference was minted").toBeTruthy();
    console.log(`[result] preApplicationRef=${ref}`);
  });

  await test.step(`Assert the charged amount is RM ${FEE_PREAPP}`, () =>
    assertAmountCharged(page, FEE_PREAPP));
});

/* ------------------------------------------------------------------ TS02 */

test("12257_TS02: Registration fee paid with DuitNow QR", async ({ page, browser }) => {
  test.slow();
  announce(identity);

  // FPX here on purpose — the operator should only be asked to scan once, at the
  // payment point this scenario is actually testing.
  await driveToPaidPreApplication(page, identity, "fpx");

  const { applicationNo, dealerLink } = await driveToVerifiedDocuments(browser, page, identity);

  await test.step("Phase 10 — registration fee, paid by QR", async () => {
    await dealer.payRegistrationFee(page, dealerLink, "qr");
  });

  await test.step("Assert eAuto recorded the payment", async () => {
    await expect(
      page.getByText(/application payment success|payment status:?\s*paid/i).first(),
      "eAuto shows the registration fee as PAID",
    ).toBeVisible({ timeout: 60_000 });
  });

  await test.step(`Assert the charged amount is RM ${FEE_REGISTRATION}`, () =>
    assertAmountCharged(page, FEE_REGISTRATION));

  await test.step("Phase 11 — read the finished record back", async () => {
    const record = await asRole(browser, ASSIGNEE, "assignee", p =>
      bo.readFixtureState(p, applicationNo));
    console.log(`[record] ${JSON.stringify(record)}`);
    expect(record.applicationStatus, "the application ends Approved").toMatch(/approved/i);
  });
});
