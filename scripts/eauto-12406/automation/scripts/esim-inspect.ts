/**
 * READ ONLY. Prints the shape of eSim records for one entity and the distinct
 * values of the fields a scenario usually needs (usage code, body type,
 * response codes), so new prefixes are created with values that really exist.
 *
 *   npx tsx scripts/esim-inspect.ts stms-enquiry-resp [PREFIX...]
 */
import { loadEnv } from "../config/load-env";
import { EsimClient } from "../src/fixtures/esim";

loadEnv();

async function main() {
  const entity = (process.argv[2] ?? "stms-enquiry-resp") as any;
  const prefixes = process.argv.slice(3).map((p) => p.toUpperCase());
  const esim = new EsimClient();
  await esim.connect();
  const rows = await esim.list(entity);
  console.log(`${entity}: ${rows.length} records`);
  console.log("fields:", Object.keys(rows[0] ?? {}).join(", "));
  const distinct = (k: string) => {
    const m = new Map<string, number>();
    for (const r of rows) { const v = String((r as any)[k] ?? ""); m.set(v, (m.get(v) ?? 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]).map(([v, n]) => `${v || "(blank)"}×${n}`).join("  ");
  };
  for (const k of Object.keys(rows[0] ?? {})) {
    if (/usage|body|type|code|status|resp|result/i.test(k) && !/^id$/i.test(k)) console.log(`  ${k}: ${distinct(k)}`.slice(0, 900));
  }
  const filt = process.argv.slice(3).find((a) => a.includes("="));
  if (filt) {
    const [k, v] = filt.split("=");
    const re = new RegExp(v, "i");
    console.log(`
records where ${k} ~ /${v}/:`);
    for (const r of rows as any[]) if (re.test(String(r[k] ?? ""))) console.log(" ", String(r.vnStartWith).padEnd(5), r.usageCode, r.bodyType, r.responseCode, "|", String(r.remark ?? "").slice(0, 80));
    await esim.close();
    return;
  }
  const show = prefixes.length ? rows.filter((r: any) => prefixes.some((p) => String(r.vnStartWith).toUpperCase().startsWith(p))) : rows.filter((r: any) => /MSL|MTR|MOTO/i.test(JSON.stringify(r))).slice(0, 5);
  console.log(`\nsample records (${prefixes.length ? prefixes.join(",") : "motorcycle-looking"}):`);
  for (const r of show.slice(0, 8)) console.log(JSON.stringify(r));
  console.log("\nall prefixes in use:", rows.map((r: any) => r.vnStartWith).sort().join(" "));
  await esim.close();
}
main().catch((e) => { console.error(e); process.exit(1); });
