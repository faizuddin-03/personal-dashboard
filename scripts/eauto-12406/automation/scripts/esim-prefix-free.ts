// A TOOL, read only: which candidate prefixes are free in every eSim entity (both directions of startsWith)?
import { loadEnv } from "../config/load-env";
import { EsimClient, ESIM_ENTITY } from "../src/fixtures/esim";
loadEnv();
const cands = process.argv.slice(2);
(async () => {
  const esim = new EsimClient();
  await esim.connect();
  const used: string[] = [];
  for (const e of Object.values(ESIM_ENTITY)) {
    try { for (const r of await esim.list(e)) if (r.vnStartWith) used.push(`${r.vnStartWith}@${e}`); } catch { /* HTML-only entity */ }
  }
  for (const c of cands) {
    const hits = used.filter((u) => { const p = u.split("@")[0]; return p.startsWith(c) || c.startsWith(p); });
    console.log(c, hits.length ? "USED " + hits.join(", ") : "free");
  }
  await esim.close();
})();
