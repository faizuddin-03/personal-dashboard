// A TOOL for the EAINT-12022 SIT on the real Runnerku API (Azfar 12.10.2026: any eSim prefix row may be changed
// for this work, as long as it is changed BACK afterwards). Every change first writes the row as it was to a backup
// file; `restore` puts it back exactly.
//
//   npx tsx scripts/esim-row-swap.ts get     <entity> <prefix>
//   npx tsx scripts/esim-row-swap.ts set     <entity> <prefix> <field>=<value> [...]   (backup -> ESIM_BACKUP_DIR)
//   npx tsx scripts/esim-row-swap.ts restore <backup.json>
// entity = the eSim UI name, e.g. rhb-transfer-resp, stms-submission-resp, stms-enquiry-resp
import * as fs from "node:fs";
import * as path from "node:path";
import { request } from "@playwright/test";
import { loadEnv } from "../config/load-env";
loadEnv();

const api = (entity: string) => `api/${entity}s`;
const DIR = process.env.ESIM_BACKUP_DIR ?? path.join(process.cwd(), ".artifacts", "esim-backups");

(async () => {
  const [cmd, a, b, ...rest] = process.argv.slice(2);
  const ctx = await request.newContext({ baseURL: process.env.ESIM_BASE_URL!.replace(/\/?$/, "/"), ignoreHTTPSErrors: true });
  const auth = await ctx.post("api/authenticate", { data: { username: process.env.ESIM_USERNAME, password: process.env.ESIM_PASSWORD, rememberMe: true } });
  if (!auth.ok()) throw new Error(`eSim login failed ${auth.status()}`);
  const headers = { Authorization: `Bearer ${(await auth.json()).id_token}`, "Content-Type": "application/json" };
  const find = async (entity: string, prefix: string) => {
    const rows = (await (await ctx.get(api(entity), { headers })).json()) as Record<string, unknown>[];
    const hit = rows.filter((r) => String(r.vnStartWith ?? "").toUpperCase() === prefix.toUpperCase());
    if (hit.length !== 1) throw new Error(`${entity} ${prefix}: ${hit.length} rows match exactly - refusing`);
    return hit[0];
  };
  if (cmd === "get") {
    console.log(JSON.stringify(await find(a, b)));
  } else if (cmd === "set") {
    const row = await find(a, b);
    fs.mkdirSync(DIR, { recursive: true });
    const file = path.join(DIR, `${a}_${b}_${new Date().toISOString().replace(/[:.]/g, "-")}.json`);
    fs.writeFileSync(file, JSON.stringify({ entity: a, row }, null, 1));
    const next: Record<string, unknown> = { ...row };
    for (const kv of rest) { const i = kv.indexOf("="); next[kv.slice(0, i)] = kv.slice(i + 1); }
    const r = await ctx.put(`${api(a)}/${row.id}`, { headers, data: next });
    if (!r.ok()) throw new Error(`update failed ${r.status()}: ${(await r.text()).slice(0, 200)}`);
    const after = await find(a, b);
    console.log(`${a} ${b} #${row.id}: ${rest.map((kv) => { const k = kv.split("=")[0]; return `${k} ${JSON.stringify(row[k])} -> ${JSON.stringify(after[k])}`; }).join(", ")} | backup ${file}`);
  } else if (cmd === "restore") {
    const { entity, row } = JSON.parse(fs.readFileSync(a, "utf8"));
    const r = await ctx.put(`${api(entity)}/${row.id}`, { headers, data: row });
    if (!r.ok()) throw new Error(`restore failed ${r.status()}: ${(await r.text()).slice(0, 200)}`);
    const after = await find(entity, row.vnStartWith);
    const same = Object.keys(row).every((k) => JSON.stringify(row[k]) === JSON.stringify(after[k]));
    console.log(`${entity} ${row.vnStartWith} #${row.id} restored: ${same ? "identical to the backup" : "DIFFERS: " + JSON.stringify(after)}`);
  } else throw new Error("usage: get|set|restore");
  await ctx.dispose();
})().catch((e) => { console.error(String(e)); process.exit(1); });
