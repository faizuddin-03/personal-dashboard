/**
 * Seed QA-owned Runnerku Eligibility rows (eSim HTML page `runnerku-eligibility-resp`, no REST API) for EAINT-12022.
 * Creates a row only when no row for that VRN exists; updates only rows whose remark starts with "QA automation (Azfar)".
 *   npx tsx scripts/seed-runnerku-eligibility.ts            # create missing
 *   npx tsx scripts/seed-runnerku-eligibility.ts --set OY "Insurer legal" "Display" 0.65 true   # update one of ours
 *   npx tsx scripts/seed-runnerku-eligibility.ts --reset OY   # put one of ours back to its normal row below (a test's eSim step restores with this)
 *
 * eSim matches an eligibility row on the FIRST 2 LETTERS of the vehicle no. only (checked 08.10.2026): the 3-letter
 * rows OXA-OXW below never match anything - switch the insurer on the 2-letter row OX with --set instead.
 */
import { request } from "@playwright/test";
import { loadEnv } from "../config/load-env";
loadEnv();
const TAG = "QA automation (Azfar)";
const NRIC = "020406081081"; // CARDS.malaysianIndividual
type Row = { vrn: string; ok: boolean; insurer: string; display: string; balance: number; reason?: string; note: string };
const allianz = { insurer: "Allianz General Insurance Company (Malaysia) Berhad", display: "Allianz General Insurance" };
const ROWS: Row[] = [
  { vrn: "OY", ok: true, ...allianz, balance: 0.71, note: "IC payment-failure chains (RHB IF switchable)" },
  { vrn: "OD", ok: true, ...allianz, balance: 0.71, note: "Bike (AB+MSL) - IC_PAY_TS4 / TS5" },
  { vrn: "OZ", ok: true, ...allianz, balance: 0.71, note: "LKM Refund RM80 + IC on one Step 5" },
  { vrn: "OS", ok: true, ...allianz, balance: 0.71, note: "LKM Refund RM3 (not offered) + IC" },
  { vrn: "OH", ok: true, ...allianz, balance: 0.71, note: "lane 2 (faizuddin2) car, added 12.10.2026" },
  { vrn: "OI", ok: true, ...allianz, balance: 0.71, note: "lane 2 (faizuddin2) RHB switchable car - IC_REG_TS3, added 12.10.2026" },
  { vrn: "OX", ok: true, insurer: "AIA General Berhad", display: "AIA General Berhad", balance: 0.71, note: "switchable insurer (eSim matches the first 2 letters only) - set per run with --set" },
  { vrn: "OXA", ok: true, insurer: "AIA General Berhad", display: "AIA General Berhad", balance: 0.71, note: "IC_DOC_TS1" },
  { vrn: "OXB", ok: true, insurer: "AIG Malaysia Insurance Berhad", display: "AIG Malaysia Insurance", balance: 0.71, note: "IC_DOC_TS2" },
  { vrn: "OXC", ok: true, ...allianz, balance: 0.71, note: "IC_DOC_TS3" },
  { vrn: "OXD", ok: true, insurer: "Berjaya Sompo Insurance Berhad", display: "Berjaya Sompo Insurance", balance: 0.71, note: "IC_DOC_TS4" },
  { vrn: "OXE", ok: true, insurer: "Chubb Insurance Malaysia Berhad", display: "Chubb Insurance", balance: 0.71, note: "IC_DOC_TS5" },
  { vrn: "OXF", ok: true, insurer: "Etiqa General Insurance Berhad", display: "Etiqa General Insurance", balance: 0.71, note: "IC_DOC_TS6" },
  { vrn: "OXG", ok: true, insurer: "Etiqa General Takaful Berhad", display: "Etiqa General Takaful", balance: 0.71, note: "IC_DOC_TS7" },
  { vrn: "OXH", ok: true, insurer: "Generali Insurance Malaysia Berhad", display: "Generali Insurance", balance: 0.71, note: "IC_DOC_TS8" },
  { vrn: "OXI", ok: true, insurer: "Great Eastern General Insurance (Malaysia) Berhad", display: "Great Eastern General Insurance", balance: 0.71, note: "IC_DOC_TS9 / TS20" },
  { vrn: "OXJ", ok: true, insurer: "Liberty General Insurance Berhad", display: "Liberty / Kurnia Insurance", balance: 0.71, note: "IC_DOC_TS10" },
  { vrn: "OXK", ok: true, insurer: "Lonpac Insurance Bhd", display: "Lonpac Insurance", balance: 0.71, note: "IC_DOC_TS11" },
  { vrn: "OXL", ok: true, insurer: "MSIG Insurance (Malaysia) Bhd", display: "MSIG Insurance", balance: 0.71, note: "IC_DOC_TS12" },
  { vrn: "OXM", ok: true, insurer: "The Pacific Insurance Berhad", display: "Pacific Insurance", balance: 0.71, note: "IC_DOC_TS13" },
  { vrn: "OXN", ok: true, insurer: "Takaful Ikhlas General Berhad", display: "Takaful Ikhlas", balance: 0.71, note: "IC_DOC_TS14" },
  { vrn: "OXO", ok: true, insurer: "Syarikat Takaful Malaysia Am Berhad", display: "Takaful Malaysia", balance: 0.71, note: "IC_DOC_TS15" },
  { vrn: "OXP", ok: true, insurer: "Tokio Marine Insurans (Malaysia) Berhad", display: "Tokio Marine Insurance", balance: 0.71, note: "IC_DOC_TS16" },
  { vrn: "OXQ", ok: true, insurer: "Tune Insurance Malaysia Berhad", display: "Tune Protect Insurance", balance: 0.71, note: "IC_DOC_TS17" },
  { vrn: "OXR", ok: true, insurer: "Zurich General Insurance Malaysia Berhad", display: "Zurich General Insurance", balance: 0.71, note: "IC_DOC_TS18" },
  { vrn: "OXS", ok: true, insurer: "Zurich General Takaful Malaysia Berhad", display: "Zurich General Takaful", balance: 0.71, note: "IC_DOC_TS19" },
  { vrn: "OXT", ok: true, insurer: "Pacific & Orient Insurance Co. Berhad", display: "Pacific & Orient Insurance", balance: 0.71, note: "IC_ADDON_TS7 (add-on must be hidden)" },
  { vrn: "OXU", ok: true, insurer: "RHB Insurance Berhad", display: "RHB Insurance", balance: 0.71, note: "IC_ADDON_TS8 (add-on must be hidden)" },
  { vrn: "OXV", ok: true, insurer: "Progressive Insurance Bhd", display: "Progressive Insurance", balance: 0.71, note: "IC_ADDON_TS9 (add-on must be hidden)" },
  { vrn: "OXW", ok: true, insurer: "", display: "", balance: 0.71, note: "IC_ADDON_TS17 (insurer name missing)" },
];

async function session() {
  const ctx = await request.newContext({ baseURL: process.env.ESIM_BASE_URL!.replace(/\/?$/, "/"), ignoreHTTPSErrors: true });
  const lh = await (await ctx.get("login")).text();
  const csrf = (lh.match(/name="_csrf"\s+value="([^"]+)"/) || [])[1];
  await ctx.post("login", { form: { username: process.env.ESIM_USERNAME!, password: process.env.ESIM_PASSWORD!, ...(csrf ? { _csrf: csrf } : {}) } });
  return ctx;
}
async function formOf(ctx: any, path: string) {
  const f = await (await ctx.get(path)).text();
  const form = (f.match(/<form[\s\S]*?<\/form>/) || [""])[0];
  const action = ((form.match(/action="([^"]+)"/) || [])[1] ?? "").replace(/^\/esim\//, "");
  const data: Record<string, string> = {};
  for (const m of form.matchAll(/<input[^>]*>/g)) { const n = (m[0].match(/name="([^"]+)"/) || [])[1]; if (n) data[n] = (m[0].match(/value="([^"]*)"/) || [])[1] ?? ""; }
  for (const s of form.matchAll(/<select[^>]*name="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g)) data[s[1]] = (s[2].match(/<option[^>]*value="([^"]*)"[^>]*selected/) || [])[1] ?? "";
  for (const t of form.matchAll(/<textarea[^>]*name="([^"]+)"[^>]*>([\s\S]*?)<\/textarea>/g)) data[t[1]] = t[2];
  return { action, data };
}
async function rows(ctx: any) {
  const h = await (await ctx.get("runnerku-eligibility-resp?size=500")).text();
  const out: { id: string; vrn: string; remark: string }[] = [];
  for (const tr of h.matchAll(/<tr[\s\S]*?<\/tr>/g)) {
    const cells = [...tr[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
    const id = (tr[0].match(/runnerku-eligibility-resp\/(\d+)/) || [])[1];
    if (id && cells.length > 9) out.push({ id, vrn: cells[1], remark: cells[9] });
  }
  return out;
}
const fill = (data: Record<string, string>, r: Row) => {
  data.vrn = r.vrn; data.identityNo = NRIC; data.ok = String(r.ok); data.insurer = r.insurer; data.insurerDisplay = r.display;
  data.insuranceBalance = String(r.balance); data.reason = r.reason ?? ""; data.delayMiliSeconds = "0";
  data.remark = `${TAG} - ${r.vrn} = ${r.ok ? (r.display || "(no insurer)") + " " + r.balance : "not eligible"} - EAINT-12022 ${r.note} - reusable`;
};

(async () => {
  const ctx = await session();
  const args = process.argv.slice(2);
  const have = await rows(ctx);
  if (args[0] === "--set") {
    const [vrn, insurer, display, bal, ok, reason] = args.slice(1);
    const row = have.find((x) => x.vrn === vrn);
    if (!row || !row.remark.startsWith(TAG)) throw new Error(`${vrn}: missing or not ours - refusing`);
    const { action, data } = await formOf(ctx, `runnerku-eligibility-resp/${row.id}/edit`);
    fill(data, { vrn, ok: ok !== "false", insurer, display, balance: Number(bal), reason, note: "updated" });
    const r = await ctx.post(action, { form: data, maxRedirects: 0 });
    console.log(`${vrn} #${row.id} updated: HTTP ${r.status()}`);
  } else if (args[0] === "--reset") {
    const vrn = args[1];
    const def = ROWS.find((x) => x.vrn === vrn);
    const row = have.find((x) => x.vrn === vrn);
    if (!def) throw new Error(`${vrn}: no normal row defined in ROWS - nothing to reset to`);
    if (!row || !row.remark.startsWith(TAG)) throw new Error(`${vrn}: missing or not ours - refusing`);
    const { action, data } = await formOf(ctx, `runnerku-eligibility-resp/${row.id}/edit`);
    fill(data, def);
    const r = await ctx.post(action, { form: data, maxRedirects: 0 });
    console.log(`${vrn} #${row.id} reset to ${def.ok ? `${def.display} ${def.balance}` : "not eligible"}: HTTP ${r.status()}`);
  } else {
    for (const r of ROWS) {
      const ex = have.find((x) => x.vrn === r.vrn);
      if (ex) { console.log(`${r.vrn} exists #${ex.id} (${ex.remark.startsWith(TAG) ? "ours" : "NOT ours"}) - left`); continue; }
      const { action, data } = await formOf(ctx, "runnerku-eligibility-resp/new");
      fill(data, r);
      const res = await ctx.post(action, { form: data, maxRedirects: 0 });
      console.log(`${r.vrn} created (${r.display || "no insurer"}): HTTP ${res.status()}`);
    }
  }
  await ctx.dispose();
})();
