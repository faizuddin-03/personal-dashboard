/**
 * BackOffice > Manage Company Accounts (`view/account/company/`) — one company's Edit page, section "Purchase SSM
 * Document": `ssmPermission` (STMS - Company Category), `estmSsmPermission` (ESTM - Company Category),
 * `bypassPurchaseSsmPermission` (Bypass Purchase SSM - User Category).
 *
 * Selectors and the save path are the ones automation/tests/_explore/bo-ssm-settings.spec.ts used on staging /preprod1
 * 29.09.2026, which set and re-read `ssmPermission` on / off for AZFARAZO (screenshots
 * automation/explore-output/ssm-settings/4-set-…, 5-saved-…, 6-reopened-…; fields in company-edit-fields.json;
 * knowledge/_core/stms.md). Added 21.10.2026 for EAINT-12253 BEH_TS7 (Azfar's go-ahead: own company, staging, put back
 * afterwards). `set` changes ONE checkbox; `setMany` (21.10.2026) changes several in ONE save; both re-read from a fresh
 * Edit page.
 *
 * Staging /uat1/ (21.10.2026): the company row opens straight onto the editable "Update Company Account" page and
 * saves with `#to-update-company` + the native confirm "Sure to update?" (see openEdit / saveButton).
 *
 * Azfar, 21.10.2026 (knowledge/_core/stms.md): STMS Step 4 offers [Purchase SSM] only when BOTH `ssmPermission` AND
 * `estmSsmPermission` are ticked on the dealer company BEFORE the transaction starts (`SSM_PURCHASE_ON`). While they are
 * ticked, every company-seller STMS of that company asks only for the Board Resolution at Step 2, so a caller puts them
 * back (`setMany(roc, result.before)`) in a `finally`.
 */
import type { Page } from "@playwright/test";
import { claimCompany } from "@fixtures/lane-guard";

export type SsmBox = "ssmPermission" | "estmSsmPermission" | "bypassPurchaseSsmPermission";
export type SsmBoxes = Partial<Record<SsmBox, boolean>>;

/** AZFARAZO, the dealer company of lanes 1, 3 and 4 (Azfar1, AzfarL3, AzfarL4; env/lanes.md). Lane 2 is another company. */
export const AZFARAZO_ROC = "JM0570913-X";

/** The two boxes that together make STMS Step 4 offer the SSM Document purchase (Azfar, 21.10.2026). */
export const SSM_PURCHASE_ON: SsmBoxes = { ssmPermission: true, estmSsmPermission: true };

/** Box name → the label BO shows next to it (for logs and cards). */
export const SSM_BOX_LABEL: Record<SsmBox, string> = {
  ssmPermission: "STMS - Company Category",
  estmSsmPermission: "ESTM - Company Category",
  bypassPurchaseSsmPermission: "Bypass Purchase SSM - User Category",
};

/** "STMS - Company Category ticked, ESTM - Company Category unticked" */
export function describeSsmBoxes(b: SsmBoxes): string {
  return (Object.keys(b) as SsmBox[]).map((k) => `${SSM_BOX_LABEL[k]} ${b[k] ? "ticked" : "unticked"}`).join(", ");
}

/** True when every box named in `want` reads the same in `have`. */
export function ssmBoxesEqual(have: SsmBoxes, want: SsmBoxes): boolean {
  return (Object.keys(want) as SsmBox[]).every((k) => have[k] === want[k]);
}

export class BoCompanyAccountsPage {
  constructor(private readonly page: Page) {}

  /**
   * List → the company's row → its edit page. Two shapes (both handled):
   *  - staging /preprod1/ (29.09.2026): the row opens a view page with an Edit button, which opens the edit page;
   *  - staging /uat1/ (21.10.2026, run EAINT-12253-verify-stms-company-ssm-r1-20261021-1649-L1, its trace DOM): the row
   *    opens straight onto the editable "Update Company Account #<id>" page (form `#update-company`, buttons
   *    `#to-update-company` "Update »", `#to-inactivate-company`, Print DO, Confirmation Of Registration, MVD Agreement;
   *    NO Edit button), the Purchase SSM Document boxes already on it.
   * So: when the boxes show after the row click, that page is used; only otherwise is Edit clicked.
   */
  async openEdit(roc: string): Promise<void> {
    await this.page.goto("view/account/company/");
    await this.page.locator("#registrationCompany").fill(roc);
    await this.page.locator("#to-search, input[value*=Search i]").first().click();
    const row = this.page.locator("table tr", { hasText: roc }).first();
    await row.waitFor({ timeout: 20_000 });
    await row.locator("a").first().click();
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
    if (await this.box("ssmPermission").waitFor({ state: "visible", timeout: 8_000 }).then(() => true, () => false)) return;
    const edit = this.page.locator("a, button").filter({ hasText: /^\s*Edit\s*$/i }).first();
    const editVal = this.page.locator("input[value='Edit']").first();
    if (await edit.isVisible().catch(() => false)) await edit.click();
    else if (await editVal.isVisible().catch(() => false)) await editVal.click();
    else throw new Error(`BO ${roc}: the company page (${this.page.url()}) shows neither the Purchase SSM Document boxes nor an Edit button`);
    await this.page.waitForLoadState("networkidle").catch(() => undefined);
    await this.box("ssmPermission").waitFor({ state: "visible", timeout: 20_000 });
  }

  /**
   * The edit page's save control. /uat1/ (21.10.2026 DOM): `input#to-update-company` (type=button, value "Update »"); its
   * click handler validates the form, asks `ajax/account/company/validate.do`, then raises the NATIVE confirm
   * "Sure to update?" and on OK submits `form#update-company`. An input's value is not text, so a hasText filter never
   * matched it; the value-based fallback covers the /preprod1/ edit page.
   */
  private async saveButton() {
    const update = this.page.locator("#to-update-company");
    if (await update.count()) return update;
    return this.page.locator("input[type=submit][value*=Update i], input[type=button][value*=Update i], input[type=submit][value*=Save i], input[type=button][value*=Save i]").first();
  }

  box(name: SsmBox) {
    return this.page.locator(`input[type=checkbox][name="${name}"]`).first();
  }

  /** Read one box of the company (opens its Edit page; saves nothing). */
  async read(roc: string, name: SsmBox): Promise<boolean> {
    await this.openEdit(roc);
    return this.box(name).isChecked();
  }

  /** Read several boxes of the company from ONE fresh Edit page (saves nothing). */
  async readMany(roc: string, names: SsmBox[]): Promise<SsmBoxes> {
    await this.openEdit(roc);
    return this.readOpen(names);
  }

  private async readOpen(names: SsmBox[]): Promise<SsmBoxes> {
    const out: SsmBoxes = {};
    for (const n of names) out[n] = await this.box(n).isChecked();
    return out;
  }

  /**
   * Set one box and save (only when it differs). Returns the value before and after (re-read from a fresh Edit page).
   * Throws, after saving, when the re-read shows the box did not take.
   */
  async set(roc: string, name: SsmBox, on: boolean): Promise<{ before: boolean; after: boolean; saved: boolean; dialog: string }> {
    const r = await this.setMany(roc, { [name]: on });
    return { before: !!r.before[name], after: !!r.after[name], saved: r.saved, dialog: r.dialog };
  }

  /**
   * Set several boxes and save ONCE (nothing saved when they all already read as wanted). Returns the values BEFORE (what
   * a caller passes back to `setMany` to restore) and AFTER (re-read from a fresh Edit page).
   *
   * `onBefore` is called with the values read before anything is clicked, so a caller can still restore when this throws
   * part-way (the save went through but the re-read differs, or the save itself failed). Throws, after saving, when the
   * re-read shows any box did not take.
   */
  async setMany(
    roc: string,
    want: SsmBoxes,
    opts: { onBefore?: (before: SsmBoxes) => void } = {},
  ): Promise<{ before: SsmBoxes; after: SsmBoxes; saved: boolean; dialog: string }> {
    const names = Object.keys(want) as SsmBox[];
    if (!names.length) throw new Error("BoCompanyAccountsPage.setMany: no box named");
    await this.openEdit(roc);
    let before = await this.readOpen(names);
    if (!ssmBoxesEqual(before, want)) {
      // A company setting changes it for ALL its users: hold every lane of the company first (lane-guard.ts), so no
      // other run is on AzfarL3 / AzfarL4 while AZFARAZO's boxes are flipped. Re-read the page if that meant waiting.
      const t0 = Date.now();
      await claimCompany(roc);
      if (Date.now() - t0 > 3_000) { await this.openEdit(roc); before = await this.readOpen(names); }
    }
    opts.onBefore?.(before);
    if (ssmBoxesEqual(before, want)) return { before, after: before, saved: false, dialog: "" };
    for (const n of names) if (before[n] !== want[n]) await this.box(n).click();
    // BO confirms with the browser's own confirm() ("Sure to update?") and reports a refusal with alert(). This handler
    // accepts both; inside a CR `ts` spec the fixture also answers every native dialog and CANCELS confirms outside
    // ts.allowConfirm(), so a ts caller must run setMany inside ts.allowConfirm (as _helpers-2-3.ts does).
    const seen: string[] = [];
    const onDialog = (d: import("@playwright/test").Dialog) => {
      seen.push(`${d.type()}: ${d.message()}`);
      d.accept().catch(() => undefined);
    };
    this.page.on("dialog", onDialog);
    let dialog = "";
    try {
      const save = await this.saveButton();
      await save.waitFor({ state: "visible", timeout: 10_000 });
      const submitted = this.page.waitForRequest((q) => q.method() === "POST" && /\/account\/company\//.test(q.url()) && !/\/ajax\//.test(q.url()), { timeout: 45_000 })
        .then(() => true, () => false);
      await save.click();
      // An older edit page may confirm with a jQuery dialog instead of confirm(): its Yes / OK, never the verb.
      const yes = this.page.locator(".ui-dialog-buttonpane button", { hasText: /^(Yes|OK|Confirm)$/i }).first();
      if (await yes.isVisible({ timeout: 3_000 }).catch(() => false)) {
        dialog = (await this.page.locator(".ui-dialog:visible").innerText()).replace(/\s+/g, " ").trim();
        await yes.click();
      }
      const posted = await submitted;
      await this.page.waitForLoadState("networkidle").catch(() => undefined);
      await this.page.waitForTimeout(2_500);
      dialog = [dialog, ...seen].filter(Boolean).join(" || ");
      if (!posted) {
        throw new Error(`BO ${roc}: [Update] did not submit the company form (no POST of the company form within 45 s); dialogs: ${dialog || "(none)"}`);
      }
    } finally {
      this.page.off("dialog", onDialog);
    }
    const after = await this.readMany(roc, names);
    if (!ssmBoxesEqual(after, want)) {
      throw new Error(`BO ${roc}: saved but reads ${describeSsmBoxes(after)}, not ${describeSsmBoxes(want)}`);
    }
    return { before, after, saved: true, dialog };
  }
}
