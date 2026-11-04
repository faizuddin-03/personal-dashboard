/**
 * eSim changes as steps INSIDE a TS (Azfar, 16.10.2026: "can flexible touch the
 * esim value or is it fix to one type of amount").
 *
 * On EAINT-12022 every mid-run eSim change (insurer and %, RHB OK/IF, the LKM
 * refund balance) was done by hand or by a side script, so it never showed in
 * the video and was easy to forget to put back. Here a spec asks for the value
 * it needs, the change is shown as a card in the TS's video and written to its
 * checks.txt, and EVERYTHING is put back when the TS ends — pass or fail.
 *
 *   await ts.esim.lkmBalance("OZ", 88);                       // LKM Refund balance RM88
 *   await ts.esim.eligibility("OZ", { insurer: "Zurich General Insurance Malaysia Berhad",
 *                                     display: "Zurich General Insurance", pct: 0.77 });
 *   await ts.esim.rhb("OY", "OK");                            // RHB transfer answer
 *   await ts.esim.set(ESIM_ENTITY.stmsEnquiry, "OZ", { usageCode: "AD" });   // any field of a REST entity
 *   await ts.esim.jomcheckPaidButFailed("IL");                // JomCheck paid but transaction failed (enquiry Yes, report Failed)
 *
 * SAFE BY DESIGN: only records whose remark starts with QA_TAG (our own
 * prefixes) are written; anything else is refused, never edited. Runnerku
 * eligibility is an HTML page with no REST API, so it goes through
 * scripts/seed-runnerku-eligibility.ts (--set, and --reset to its normal row).
 * Needs the VPN; scripts/cr-run.mjs keeps it up for the run.
 */
import { execFileSync } from "node:child_process";
import * as path from "node:path";
import { EsimClient, ESIM_ENTITY, type EsimEntity } from "./esim";
import { QA_TAG, QA_PREFIXES } from "@data/qa-prefixes";

const AUTO = path.resolve(__dirname, "..", "..");

export interface EligibilityOptions {
  insurer: string;
  display: string;
  /** Insurance balance as a fraction: 0.77 shows 77%. */
  pct: number;
  /** Default true. */
  eligible?: boolean;
  reason?: string;
}

export class EsimStep {
  private readonly undo: { what: string; run: () => Promise<void> }[] = [];

  constructor(
    private readonly note: (s: string) => void,
    private readonly show: (what: string, detail: string) => Promise<void>,
  ) {}

  /** Change fields of one of OUR records (REST entity), remembering the old values. */
  async set(entity: EsimEntity, prefix: string, fields: Record<string, unknown>, why = "") {
    const esim = new EsimClient();
    await esim.connect();
    try {
      const rec: any = await esim.findByPrefix(entity, prefix);
      if (!rec || !String(rec.remark ?? "").startsWith(QA_TAG)) throw new Error(`eSim ${entity} ${prefix}: missing or not ours — refusing to write`);
      // null, not undefined: a field that was absent must be written back as empty, or the restore would keep the new value.
      const before = Object.fromEntries(Object.keys(fields).map((k) => [k, rec[k] ?? null]));
      const change = Object.entries(fields).map(([k, v]) => `${k} ${JSON.stringify(before[k])} → ${JSON.stringify(v)}`).join(", ");
      await this.show(`eSim: ${prefix} ${entity}`, `${change}${why ? ` — ${why}` : ""}`);
      await esim.update(entity, { ...rec, ...fields });
      this.note(`eSim ${entity} ${prefix}: ${change}`);
      this.undo.push({
        what: `${entity} ${prefix} back to ${JSON.stringify(before)}`,
        run: async () => {
          const c = new EsimClient();
          await c.connect();
          try { const now: any = await c.findByPrefix(entity, prefix); await c.update(entity, { ...now, ...before }); } finally { await c.close(); }
        },
      });
    } finally {
      await esim.close();
    }
  }

  /** LKM Refund balance JPJ reports for the prefix (what makes Step 5 offer the add-on) and the refund status amount. */
  async lkmBalance(prefix: string, amount: number) {
    await this.set(ESIM_ENTITY.stmsEnquiry, prefix, { refundAmount: amount }, `LKM refund balance RM${amount}`);
    await this.set(ESIM_ENTITY.lkmRefundInquiry, prefix, { refundAmount: amount }, "refund status amount follows the balance");
  }

  /** RHB transfer answer for the prefix: OK pays, IF fails. */
  async rhb(prefix: string, code: "OK" | "IF") {
    await this.set(ESIM_ENTITY.rhbTransfer, prefix, { responseCode: code }, code === "OK" ? "payment will succeed" : "payment will fail");
  }

  /**
   * JomCheck enquiry answer (`jomcheck-enquiry-resp`, "Jomcheck Enquiry Resps") for one of OUR sub-prefixes. Azfar
   * 21.10.2026: result "No" with the RHB payment OK gives "Payment OK, Tx Failed" (paid but JomCheck failed).
   * That entity has NO remark column, so a row cannot carry QA_TAG. Instead the guard is the prefix itself: it must be a
   * sub-prefix (3+ characters) of a QA-owned prefix (@data/qa-prefixes, e.g. OUJ under OU), and no other row of the
   * entity may overlap it (startsWith either way). A missing row is CREATED (vnStartWith = cnStartWith = prefix, no
   * delay, no dates) and left in place as that sub-prefix's dedicated row (nothing else matches it; logged as such); an
   * existing row of ours with another result is switched and put back when the TS ends. Whether eSim matches this
   * entity on 3 characters is NOT known (its other rows are 2 letters; runnerku / eSTM match only 2): the spec must
   * check the outcome it got.
   */
  async jomcheckEnquiry(prefix: string, result: "Yes" | "No") {
    const entity = ESIM_ENTITY.jomcheckEnquiry;
    const p = prefix.toUpperCase();
    const owner = QA_PREFIXES.find((q) => p.startsWith(q.prefix));
    if (p.length < 3 || !owner) throw new Error(`eSim ${entity} ${p}: must be a 3+ character sub-prefix of a QA-owned prefix (@data/qa-prefixes) — refusing to write`);
    const esim = new EsimClient();
    await esim.connect();
    try {
      const rows: any[] = await esim.list(entity);
      const clash = rows.filter((r) => { const v = String(r.vnStartWith ?? "").toUpperCase(); return v && v !== p && (v.startsWith(p) || p.startsWith(v)); });
      if (clash.length) throw new Error(`eSim ${entity} ${p}: other rows overlap it (${clash.map((r) => r.vnStartWith).join(", ")}) — refusing to write`);
      const rec = rows.find((r) => String(r.vnStartWith ?? "").toUpperCase() === p);
      if (!rec) {
        await this.show(`eSim: ${p} ${entity}`, `NEW row result ${result} (our ${owner.prefix} sub-prefix; kept as its dedicated row)`);
        const made: any = await esim.create(entity, { vnStartWith: p, cnStartWith: p, result, delayMiliSeconds: 0, startDate: null, endDate: null });
        this.note(`eSim ${entity} ${p}: created id ${made?.id ?? "?"} result ${result} (our ${owner.prefix} sub-prefix; left in place as its dedicated row)`);
        return;
      }
      if (rec.result === result) {
        this.note(`eSim ${entity} ${p}: already result ${result} (id ${rec.id}), nothing written`);
        return;
      }
      const before = rec.result ?? null;
      await this.show(`eSim: ${p} ${entity}`, `result ${JSON.stringify(before)} → ${JSON.stringify(result)}`);
      await esim.update(entity, { ...rec, result });
      this.note(`eSim ${entity} ${p}: result ${JSON.stringify(before)} → ${JSON.stringify(result)}`);
      this.undo.push({
        what: `${entity} ${p} result back to ${JSON.stringify(before)}`,
        run: async () => {
          const c = new EsimClient();
          await c.connect();
          try { const now: any = await c.findByPrefix(entity, p); if (now) await c.update(entity, { ...now, result: before }); } finally { await c.close(); }
        },
      });
    } finally {
      await esim.close();
    }
  }

  /**
   * "JomCheck paid but transaction failed" for one of OUR 2-letter prefixes (default IL). Azfar 22.10.2026 (Q25): it is
   * eSim `jomcheck-report-resp` result "Failed" for the vehicle's prefix, with the `jomcheck-enquiry-resp` row at "Yes".
   * (Enquiry "No" is something else: "Vehicle number not found" at Submit, nothing paid — seen 21.10 on IL0001 / IL0002.)
   * The RHB answer around the payment is the caller's (withRhbLocked on the same prefix, the locked switch).
   *
   * Ownership: neither JomCheck entity has a remark column, so the prefix is taken as ours only when OUR QA-tagged
   * rhb-transfer-resp row for it exists (IL: id 178, made 21.10.2026). Free-check: no row of ANY eSim entity may overlap the
   * prefix (startsWith either way, vnStartWith; cnStartWith too for the two JomCheck entities), except these three rows of
   * the prefix itself. Anything else: refused, nothing written.
   *
   * Writes, each shown as a card and logged with every value:
   *  - jomcheck-enquiry-resp <p>: result → "Yes" (created when missing: vn = cn = p, no delay, no dates);
   *  - jomcheck-report-resp <p>: created when missing as a COPY of an existing Success row (read first; the first one with
   *    no dates, no delay and no DB report is preferred), with vnStartWith = cnStartWith = p, result "Failed", no delay, no
   *    dates; an existing row of the prefix with another result is switched to "Failed".
   * Both are KEPT as the prefix's dedicated rows (its only purpose is this outcome; nothing else matches it), so nothing
   * is put back at the end. Never touches OUJ (id 21) or any other prefix.
   */
  async jomcheckPaidButFailed(prefix = "IL") {
    const p = prefix.toUpperCase();
    if (!/^[A-Z]{2}$/.test(p)) throw new Error(`jomcheckPaidButFailed: "${prefix}" must be 2 letters`);
    const enq = ESIM_ENTITY.jomcheckEnquiry, rep = ESIM_ENTITY.jomcheckReport;
    const overlaps = (x: unknown) => { const v = String(x ?? "").toUpperCase(); return !!v && (v.startsWith(p) || p.startsWith(v)); };
    const esim = new EsimClient();
    await esim.connect();
    try {
      const clashes: string[] = [];
      let rhbRow: any = null;
      let enqRow: any = null;
      let repRow: any = null;
      let repRows: any[] = [];
      for (const e of Object.values(ESIM_ENTITY)) {
        let rows: any[] = [];
        try { rows = await esim.list(e); } catch { continue; } // HTML-only entity
        if (e === rep) repRows = rows;
        for (const r of rows) {
          const v = String(r.vnStartWith ?? "").toUpperCase();
          const jc = e === enq || e === rep;
          if (!overlaps(v) && !(jc && overlaps(r.cnStartWith))) continue;
          if (e === ESIM_ENTITY.rhbTransfer && v === p && String(r.remark ?? "").startsWith(QA_TAG)) rhbRow = r;
          else if (e === enq && v === p && !enqRow) enqRow = r;
          else if (e === rep && v === p && !repRow) repRow = r;
          else clashes.push(`${v || "(vn blank)"}/${String(r.cnStartWith ?? "") || "-"}@${e}#${r.id}`);
        }
      }
      if (!rhbRow) throw new Error(`jomcheckPaidButFailed ${p}: no QA-tagged rhb-transfer-resp row for ${p}, so its JomCheck rows are not provably ours — refusing to write`);
      if (clashes.length) throw new Error(`jomcheckPaidButFailed ${p}: other rows overlap it (${clashes.join(", ")}) — refusing to write`);
      this.note(`eSim rhb-transfer-resp ${p}: our row id ${rhbRow.id}, responseCode ${rhbRow.responseCode} (switched to OK only around the payment, by the caller, under the lock)`);

      // 1. enquiry row → Yes (the vehicle is "found", Pay Now offered)
      if (!enqRow) {
        await this.show(`eSim: ${p} jomcheck-enquiry-resp`, `NEW row result "Yes" (vehicle found; ${p}'s dedicated row)`);
        const made: any = await esim.create(enq, { vnStartWith: p, cnStartWith: p, result: "Yes", delayMiliSeconds: 0, startDate: null, endDate: null });
        this.note(`eSim ${enq} ${p}: created ${JSON.stringify(made)}; kept as ${p}'s row`);
      } else if (enqRow.result !== "Yes") {
        await this.show(`eSim: ${p} jomcheck-enquiry-resp`, `id ${enqRow.id}: result ${JSON.stringify(enqRow.result ?? null)} → "Yes" (vehicle found); kept so`);
        const saved: any = await esim.update(enq, { ...enqRow, result: "Yes" });
        this.note(`eSim ${enq} ${p} id ${enqRow.id}: result ${JSON.stringify(enqRow.result ?? null)} → "Yes"; now ${JSON.stringify(saved)}; kept as ${p}'s row`);
      } else this.note(`eSim ${enq} ${p}: already result "Yes" (${JSON.stringify(enqRow)}), nothing written`);

      // 2. report row → Failed (paid, then the report is not retrieved)
      if (!repRow) {
        const ok = repRows.filter((r) => r.result === "Success");
        const src: any = ok.find((r) => !r.startDate && !r.endDate && !Number(r.delayMiliSeconds ?? 0) && !r.useDbReport) ?? ok[0];
        if (!src) throw new Error(`jomcheckPaidButFailed ${p}: no Success row in ${rep} to copy — refusing to guess its fields`);
        this.note(`eSim ${rep}: source row read (copied, not changed): ${JSON.stringify(src)}`);
        const { id: _id, ...fields } = src;
        const row = { ...fields, vnStartWith: p, cnStartWith: p, result: "Failed", delayMiliSeconds: 0, startDate: null, endDate: null };
        await this.show(`eSim: ${p} jomcheck-report-resp`, `NEW row, a copy of Success row #${src.id} (${src.vnStartWith ?? "-"}), result "Failed" (paid, report not retrieved)`);
        const made: any = await esim.create(rep, row);
        this.note(`eSim ${rep} ${p}: created ${JSON.stringify(made)}; kept as ${p}'s row`);
      } else if (repRow.result !== "Failed") {
        await this.show(`eSim: ${p} jomcheck-report-resp`, `id ${repRow.id}: result ${JSON.stringify(repRow.result ?? null)} → "Failed"; kept so`);
        const saved: any = await esim.update(rep, { ...repRow, result: "Failed" });
        this.note(`eSim ${rep} ${p} id ${repRow.id}: result ${JSON.stringify(repRow.result ?? null)} → "Failed"; now ${JSON.stringify(saved)}; kept as ${p}'s row`);
      } else this.note(`eSim ${rep} ${p}: already result "Failed" (${JSON.stringify(repRow)}), nothing written`);
    } finally {
      await esim.close();
    }
  }

  /** Runnerku eligibility row for the prefix (first 2 letters of the vehicle no. — eSim matches on those only). */
  async eligibility(prefix: string, o: EligibilityOptions) {
    if (prefix.length !== 2) throw new Error(`eligibility prefix must be the 2-letter row (eSim matches the first 2 letters only), not "${prefix}"`);
    const eligible = o.eligible ?? true;
    await this.show(`eSim: ${prefix} Runnerku eligibility`, eligible ? `${o.display} ${Math.round(o.pct * 100)}%` : `not eligible${o.reason ? ` (${o.reason})` : ""}`);
    seeder(["--set", prefix, o.insurer, o.display, String(o.pct), String(eligible), o.reason ?? ""]);
    this.note(`eSim runnerku-eligibility-resp ${prefix}: ${eligible ? `${o.display} ${o.pct}` : "not eligible"}`);
    this.undo.push({ what: `runnerku eligibility ${prefix} back to its normal row`, run: async () => { seeder(["--reset", prefix]); } });
  }

  /** Put everything back, newest first. Returns what could not be restored (the gate reports it). */
  async restoreAll(): Promise<string[]> {
    const failed: string[] = [];
    while (this.undo.length) {
      const u = this.undo.pop()!;
      let ok = false;
      for (let i = 0; i < 3 && !ok; i++) {
        try { await u.run(); ok = true; } catch (e) { if (i === 2) failed.push(`${u.what}: ${String(e).split("\n")[0]}`); else await new Promise((r) => setTimeout(r, 3000)); }
      }
      this.note(ok ? `eSim restored: ${u.what}` : `eSim NOT restored: ${u.what}`);
    }
    return failed;
  }

  get pending() { return this.undo.length; }
}

function seeder(args: string[]) {
  // node + tsx's own CLI, no shell: insurer names carry spaces and must reach the script as one argument each.
  const tsx = path.join(AUTO, "node_modules", "tsx", "dist", "cli.mjs");
  const out = execFileSync(process.execPath, [tsx, "scripts/seed-runnerku-eligibility.ts", ...args], { cwd: AUTO, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
  if (!/HTTP 30[23]/.test(out)) throw new Error(`eSim eligibility ${args.join(" ")} did not save: ${out.trim().slice(0, 200)}`);
}
