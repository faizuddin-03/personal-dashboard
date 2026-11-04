// @ticket   EAINT-12406
// @sheet    RC (4 Receipt / CIBO): an Allianz transaction left unpaid
// @cases    12406_RC_TS9
// @env      Secarang staging /ia/ + CIBO staging https://staging.secarang.com/cibo (INSTANCE=ia)
// @status   draft
//
// Written 29.10.2026 by cr-author from the approved TS (scenarios.yaml meta.approved_by: Azfar 29.10.2026; ts.json
// 29.10 09:56). NOT run. Both expected points are proved with ts.prove() in the TS's words.
//
// CHANGES A RECORD (@destructive): Secarang Add-ons / Confirmation create a CIBO transaction (team doc §6); this TS
// stops on the payment page "How would you like to pay?" and leaves without paying. Nothing is paid.
// Step 3 (open the row again once the quotation has expired) is RECORDED only and waits on Q39 (how long): not
// run here; the QA opens the row later (it has no expected point).
// Data: Private Car, individual owner, a made-up team plate (team doc §13) not used by another row: HXA0019A,
// overridable with SECARANG_PLATE_12406_RC_TS9 (same convention as sheet E2E). Quote inputs secarangQuoteForm()
// (IC = SECARANG_QUOTE_IC from env when set), owner secarangOwner() (the QA's own phone / email from env, made-up
// name and address). Whether Allianz quotes this plate on /ia/ is open (Q12): if not, the run stops at Buy.
// Hands on "allianzUnpaid" { ref, plate, since } for 12406_RC_TS10 (E4): run this file before the listing spec.
// Flows: secarang (VERIFIED 29.10.2026; `paymentPage` stop proven by run pp1) and cibo (VERIFIED 29.10.2026, run c2,
// incl. the look-up by plate). No journey code here. TS v5 (ts.json 29.10 13:00): RC_TS9 unchanged.
// Fixed 29.10.2026 after triage of run sRC-1330 (verdict "spec"): E1 no longer requires a Payment badge to exist;
// it asserts the TS's words (Allianz, not "Paid", "Pending payment") and records the badge text or "(none)".
// Personal data: Transaction Details are blurred before the screenshots (the status badge, buttons and insurer box
// stay sharp); the video shows the QA's own phone / email: evidence stays out of git.

import { test } from "@fixtures";
import { runSecarangFlow } from "@flows/secarang.flow";
import { runCiboFlow } from "@flows/cibo.flow";
import { CiboTransactionManagementPage } from "@pages/cibo/transaction-management.page";
import { CiboTransactionDetailsPage } from "@pages/cibo/transaction-details.page";
import { secarangOwner, secarangQuoteForm } from "@data/secarang";
import { handOff } from "@fixtures/ts-handoff";
import { n } from "./_rc";

test.describe("EAINT-12406 RC — Allianz transaction not paid (Secarang /ia/ → CIBO)", () => {
  test("12406_RC_TS9 — Allianz transaction left at the payment page: CIBO shows it Pending payment, no Receipt or e-Certificate, Cover Note / Policy No '-'", { tag: ["@P2", "@e2e", "@sheet-RC", "@destructive"] }, async ({ ts }) => {
    test.setTimeout(30 * 60_000);
    const plate = (process.env.SECARANG_PLATE_12406_RC_TS9 ?? "HXA0019A").trim().toUpperCase();
    const t0 = new Date();

    // ---- step 1: Secarang, Allianz, Add-ons, Confirmation, Confirm and Pay; leave the payment page unpaid
    await ts.site("Secarang", `${plate}: Allianz to the payment page, then leave without paying`);
    const r = await runSecarangFlow(ts.page, { form: secarangQuoteForm(plate), insurer: "Allianz", owner: secarangOwner(), stopAfter: "paymentPage" });
    ts.note(`Secarang: ${r.screens?.join(" > ") ?? ""}; payment tiles ${(r.tiles ?? []).join(", ")}`);
    await ts.shot("secarang-payment-page-left-unpaid", `How would you like to pay? reached for ${plate} (Allianz); left here, nothing paid`);

    // ---- step 2: CIBO, the plate's newest row since this TS started
    await ts.portal("cibo", `Transaction Management: the unpaid Allianz transaction of ${plate}`);
    const c = await runCiboFlow(ts.page, { signedIn: true, plate, since: t0, filter: { insuranceCompany: ["Allianz"] }, stopAfter: "listing" });
    const ref = c.ref ?? "";
    handOff(ts, "allianzUnpaid", { ref, plate, since: t0.toISOString() });
    const tm = new CiboTransactionManagementPage(ts.page);
    const row = c.row ?? {};
    const badges = await tm.rowBadges(ref);
    const payBadge = (badges["Payment"] ?? []).map((b) => b.text).join(", ");
    const insCo = n(row["Ins. Co."]);
    const status = n(row["Transaction Status"]);
    const payCell = n(row["Payment"]);
    // TS E1: "Payment badge not 'Paid'", its text only RECORDED ('Pending' per team doc §8, 'Unpaid' in the mockup).
    // No badge at all is "not Paid" (triage of run sRC-1330, 29.10: rows left before Fiuu show the amount alone).
    // Red when a "Paid" badge is there or the cell reads "Paid" ("Unpaid" does not match: capital P).
    const notPaid = !(badges["Payment"] ?? []).some((b) => b.text === "Paid") && !/Paid/.test(payCell);
    await tm.blurPersonalData();
    await ts.prove("E1", {
      shows: `CIBO row ${ref}: Ins. Co. "${insCo}", Payment cell "${payCell}", Payment badge "${payBadge || "(none)"}" (recorded), Transaction Status "${status}"`,
      match: /^Allianz\b/.test(insCo) && notPaid && status === "Pending payment",
      hl: [await tm.cell(ref, "Ins. Co."), await tm.cell(ref, "Payment"), await tm.cell(ref, "Transaction Status")],
      name: "cibo-row-pending-payment",
    });

    // ---- Transaction Details
    await tm.openDetails(ref);
    const d = new CiboTransactionDetailsPage(ts.page);
    const badge = await d.statusBadgeInfo();
    const buttons = await d.documentButtons();
    const cover = await d.field("Cover Note No");
    const policy = await d.field("Policy No");
    await d.blurPersonalData();
    await ts.prove("E2", {
      shows: `status badge "${badge.text}" (class ${badge.cls}, background ${badge.background}, icon ${badge.hasIcon ? "yes" : "none"}); document buttons: ${buttons.join(", ") || "none"}; Cover Note No "${cover.text}", Policy No "${policy.text}"`,
      match: badge.text === "Pending payment" && /pending-badge/.test(badge.cls) && !badge.hasIcon && !buttons.some((b) => /e-Certificate|Receipt/i.test(b)) && cover.text === "-" && policy.text === "-",
      hl: [badge.locator, cover.locator, policy.locator],
      name: "transaction-details-pending-payment",
    });
    ts.note("step 3 (recorded, Q39): open this row again once the quotation has expired; not run here");
  });
});
