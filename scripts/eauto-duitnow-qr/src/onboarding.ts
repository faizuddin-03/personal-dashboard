/**
 * The BackOffice half of the journey — phases 3, 5, 6, 7, 9 and 11.
 *
 * A rule that governs every function here: **`confirm()` is not a wait.** It
 * finishes on a load state that, for an AJAX action, resolves instantly because
 * the page is already loaded. So every state-changing action below reads its
 * result back explicitly. A build once stopped right after Submit for Approval,
 * closed the browser on the in-flight POST, and left the record at Pending — and
 * the next phase blamed the wrong thing entirely.
 */
import type { Page } from "@playwright/test";
import { OBS, ASSIGNEE_NAME, UCD_GROUP } from "./env";
import { gotoObs, confirm, selectedText } from "./obs";
import * as listing from "./listing";

/* ------------------------------------------------ phase 3: approve-preapp */

/**
 * Find the pre-application by company name and open it.
 *
 * Search by NAME, not by reference: the name carries the run stamp and is unique
 * by construction, while the reference is only ever read off a confirmation page
 * that may not show one. **View opens a NEW TAB** — everything downstream in this
 * phase runs on the returned page, not the listing page.
 */
export async function openPreApplication(page: Page, companyName: string): Promise<{ uuid: string; page: Page }> {
  await gotoObs(page, OBS.preApplicationListing, "pre-application");

  const search = page.locator('[name="companyName"]').first();
  if (await search.count()) await search.fill(companyName);
  const searchBtn = page.getByRole("button", { name: /^search$/i }).first();
  if (await searchBtn.count()) await searchBtn.click();
  await page.waitForTimeout(2_000);

  const row = page.locator("tr").filter({ hasText: companyName }).first();
  await row.waitFor({ timeout: 20_000 });

  const [popup] = await Promise.all([
    page.context().waitForEvent("page", { timeout: 8_000 }).catch(() => null),
    row.getByRole("link", { name: /^(view|edit|detail)/i }).or(row.locator("a")).first().click(),
  ]);
  const target = popup || page;
  await target.waitForLoadState("domcontentloaded").catch(() => {});

  const uuid = target.url().split("?")[0].split("/").filter(Boolean).pop() || "";
  return { uuid, page: target };
}

/**
 * Read the dealer's application link out of the summary sidebar.
 *
 * Two strategies, in order: input/textarea values (immune to soft-wrapping),
 * then the raw HTML source (the sidebar's rendered line-wrapping cannot break a
 * regex over the source). The `isDealer` predicate is load-bearing — the dealer
 * link is /obs/form/... and must NOT be /obs/admin/form/edit/<uuid>, which is
 * this very page's own URL. An anchor-first version grabbed the admin URL once
 * and the dealer context died on it.
 */
async function applicationLink(page: Page): Promise<string> {
  const isDealer = (u: string) => /\/obs\/form\//i.test(u) && !/\/obs\/admin\//i.test(u);

  const boxes = page.locator("textarea, input");
  const n = await boxes.count().catch(() => 0);
  for (let i = 0; i < n; i++) {
    const v = (await boxes.nth(i).inputValue().catch(() => "")) || "";
    if (isDealer(v)) return v.trim();
  }

  const html = (await page.content().catch(() => "")) || "";
  const urls = html.match(/https?:\/\/[^"'\s<>]+\/obs\/form\/[^"'\s<>]*/gi) || [];
  const hit = urls.find(isDealer);
  return hit ? hit.replace(/&amp;/g, "&").trim() : "";
}

/**
 * Approve the pre-application and capture the dealer link.
 *
 * The link's `s=` query parameter is a SERVER-MINTED SIGNATURE and cannot be
 * reconstructed from the page — which is why it is persisted the moment it is
 * read. A build that approves and fails to read the link is a dead fixture:
 * three later phases navigate to this exact URL.
 *
 * Approve is an AJAX round-trip behind a "Working..." overlay, so the link is
 * polled rather than read once, with a reload halfway in case this render only
 * grows the sidebar box after a fresh GET.
 */
export async function approvePreApplication(page: Page): Promise<string> {
  const approve = page.getByRole("button", { name: /^approve$/i }).first();
  if (await approve.count()) {
    await approve.click();
    await confirm(page);
  } else {
    console.log("[bo] no Approve button — the record is already approved, reading the link");
  }

  const summaryUrl = page.url();
  let link = "";
  for (let t = 0; t < 20 && !link; t++) {
    await page.waitForTimeout(1_500);
    const working = await page.getByText(/^\s*working\.\.\.\s*$/i).first().isVisible().catch(() => false);
    if (working) continue;
    link = await applicationLink(page);
    if (!link && t === 9) {
      await page.goto(summaryUrl, { waitUntil: "domcontentloaded" }).catch(() => {});
    }
  }
  if (!link) {
    throw new Error("approved, but no dealer Application Link appeared on the summary — the fixture is dead without it.");
  }
  console.log(`[bo] dealer link captured`);
  return link;
}

/* --------------------------------------------------------- phase 5: assign */

/**
 * Set the Assignee.
 *
 * Returns `{assigned:false}` rather than throwing when the dropdown is absent.
 * On a freshly submitted application the approver's edit page renders only UCD
 * Group and Application Status — `#assigneeUserId` does not exist yet, only the
 * hidden field carrying its value. **A field that is not there yet is not a
 * locator miss**; treating it as one stopped a build dead on a page that was
 * behaving correctly. approve-app takes a second bite once the record is Approved.
 */
export async function assignApplication(page: Page, uuid: string): Promise<boolean> {
  await gotoObs(page, OBS.applicationEdit(uuid));

  // `:not([id$="Hidden"])` matters — a loose "assignee" hint also matches the
  // hidden input that carries the value.
  const select = page.locator(
    'select:not([id$="Hidden"])[name*="assignee" i], select:not([id$="Hidden"])[id*="assignee" i]',
  ).first();

  if (!(await select.count())) {
    const stage = await selectedText(page, "#status");
    console.log(`[bo] Assignee dropdown not rendered at this stage${stage ? ` (status: ${stage})` : ""} — deferring to approve-app`);
    return false;
  }

  const options = (await select.locator("option").allInnerTexts()).map(s => s.trim());
  const want = ASSIGNEE_NAME;
  let label = options.find(o => o && !/^select/i.test(o));
  if (want) {
    // The dropdown holds DISPLAY NAMES, not login ids.
    label = options.find(o => o.toUpperCase() === want.toUpperCase())
      || options.find(o => o.toUpperCase().includes(want.toUpperCase()));
    if (!label) {
      throw new Error(`assignee "${want}" is not an option — the dropdown offers: ${options.filter(Boolean).slice(0, 20).join(", ")}`);
    }
  }
  await select.selectOption({ label: label! });

  await page.getByRole("button", { name: /^save$/i }).first().click();
  await page.getByText(/updated successfully/i).first().waitFor({ timeout: 15_000 })
    .catch(() => console.log('[bo] no "updated successfully" banner after Save — continuing'));
  console.log(`[bo] assignee set to ${label}`);
  return true;
}

/* ------------------------------------------------ phase 6: submit-approval */

/**
 * Assignee sets the UCD Group and pushes the record up for approval.
 *
 * The read-back is the important part. This used to click, confirm, and return
 * asserting nothing — and a run that stopped here left an in-flight POST that
 * never landed, so the record stayed Pending and the NEXT phase reported a
 * completely misleading cause. Earlier builds only survived because the next
 * phase's login gave the POST time to finish. That is luck, not sequencing.
 */
export async function setUcdGroupAndSubmit(page: Page, uuid: string): Promise<void> {
  await gotoObs(page, OBS.applicationEdit(uuid));

  const group = page.locator('select[name*="ucdGroup" i], select[id*="ucdGroup" i]').first();
  if (await group.count()) {
    if (UCD_GROUP) {
      await group.selectOption({ label: UCD_GROUP }).catch(() => group.selectOption({ index: 1 }));
    } else {
      // First real option — fine for a fixture, wrong for a test.
      await group.selectOption({ index: 1 }).catch(() => {});
    }
  }

  const submit = page.getByRole("button", { name: /submit for approval/i }).first();
  if (!(await submit.count())) {
    throw new Error(`no "Submit for Approval" button on ${page.url()} — the record is not at a stage the assignee can advance.`);
  }
  await submit.click();
  await confirm(page);

  await page.reload({ waitUntil: "domcontentloaded" }).catch(() => {});
  await page.waitForTimeout(1_500);
  const still = await page.getByRole("button", { name: /submit for approval/i }).first().count();
  if (still) {
    const status = await selectedText(page, "#status");
    throw new Error(
      `Submit for Approval did not land${status ? ` (Application Status still reads "${status}")` : ""}. ` +
      `The button is still present after a reload, so the record did NOT advance.`,
    );
  }
  console.log("[bo] submitted for approval");
}

/* --------------------------------------------------- phase 7: approve-app */

/**
 * Approver approves the application.
 *
 * **Never approve by setting `#status`.** The dropdown sets the FIELD; the
 * button runs the WORKFLOW. Forcing the dropdown produces a record with no
 * expiry date at all and a server-side read-only documents step — approved on
 * the listing, useless to every later phase.
 */
export async function approveApplication(page: Page, uuid: string): Promise<string> {
  await gotoObs(page, OBS.applicationEdit(uuid));

  const approve = page.getByRole("button", { name: /^approve$/i }).first();
  if (!(await approve.count())) {
    const status = await selectedText(page, "#status");
    throw new Error(
      `no Approve button on ${page.url()}${status ? ` (Application Status reads "${status}")` : ""}.\n` +
      `  LIKELIEST: the record was never actually submitted for approval.`,
    );
  }
  await approve.click();
  await confirm(page);

  const now = await selectedText(page, "#status");
  if (now && !/approved/i.test(now)) {
    throw new Error(`after approving, Application Status still reads "${now}"`);
  }
  console.log("[bo] application approved");
  return now || "Approved";
}

/* ----------------------------------------------- phase 9: verify-regdocs */

export async function verifyRegistrationDocs(page: Page, uuid: string): Promise<void> {
  // A 404 here means the registration documents were never submitted — that is
  // scope, not a broken page. gotoObs raises ObsNotFoundError for it.
  await gotoObs(page, OBS.registrationDocs(uuid));
  await page.getByText(/Application No:/).first().waitFor({ timeout: 30_000 });

  const verified = page.getByRole("button", { name: /^verified$/i }).first();
  if (!(await verified.count())) {
    throw new Error(`no Verified button on the registration-documents page for ${uuid}`);
  }
  await verified.click();
  await confirm(page);
  await page.getByText(/verification date/i).first().waitFor({ timeout: 15_000 }).catch(() => {});
  console.log("[bo] registration documents verified");
}

/* --------------------------------------------------------- phase 11: record */

export interface FixtureRecord {
  applicationNo: string;
  companyName: string;
  applicationStatus: string;
  hardcopyAccCreated: string;
  createdAt: string;
  expiry: string;
  daysFromCreated: number | null;
}

function parseListingDate(s: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(String(s || ""));
  return m ? new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0)) : null;
}

/**
 * Read the finished record back.
 *
 * `daysFromCreated` anchors on the Application CREATED date, not the submission
 * date — the expiry is minted from the creation minute, so a 1–2 minute skew
 * between the two columns is correct and not a bug.
 */
export async function readFixtureState(page: Page, applicationNo: string): Promise<FixtureRecord> {
  const row = await listing.findByApplicationNo(page, applicationNo);
  const created = parseListingDate(row.createdAt);
  const expiry = parseListingDate(row.expiry);
  return {
    applicationNo: row.applicationNo,
    companyName: row.companyName,
    applicationStatus: row.applicationStatus,
    hardcopyAccCreated: row.hardcopyAccCreated,
    createdAt: row.createdAt,
    expiry: row.expiry,
    daysFromCreated: created && expiry ? Math.round((+expiry - +created) / 86_400_000) : null,
  };
}
