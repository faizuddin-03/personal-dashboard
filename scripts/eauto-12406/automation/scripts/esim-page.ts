// A TOOL, read only: list or read one record of an eSim page entity (HTML UI, entities with no REST API, e.g. runnerku-case, runnerku-eligibility-resp, runnerku-error-injection). Usage: npx tsx esim-page.ts <entity> [filterText] [editId]
import { request } from "@playwright/test";
import { loadEnv } from "../config/load-env";
loadEnv();
const [entity, filter, editId] = process.argv.slice(2);
(async () => {
  const ctx = await request.newContext({ baseURL: process.env.ESIM_BASE_URL!.replace(/\/?$/, "/"), ignoreHTTPSErrors: true });
  const lh = await (await ctx.get("login")).text();
  const csrf = (lh.match(/name="_csrf"\s+value="([^"]+)"/) || [])[1];
  await ctx.post("login", { form: { username: process.env.ESIM_USERNAME!, password: process.env.ESIM_PASSWORD!, ...(csrf ? { _csrf: csrf } : {}) } });
  if (editId) {
    const f = await (await ctx.get(`${entity}/${editId}/edit`)).text();
    const form = (f.match(/<form[\s\S]*?<\/form>/) || [""])[0];
    console.log("action", (form.match(/action="([^"]+)"/) || [])[1]);
    for (const m of form.matchAll(/<(input|select|textarea)[^>]*name="([^"]+)"[^>]*>/g)) {
      const val = (m[0].match(/value="([^"]*)"/) || [])[1];
      console.log(m[1], m[2], val ?? "");
    }
    for (const s of form.matchAll(/<select[^>]*name="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g))
      console.log("options", s[1], [...s[2].matchAll(/<option[^>]*value="([^"]*)"([^>]*)>/g)].map((o) => o[1] + (o[2].includes("selected") ? "*" : "")).join(","));
  } else {
    const h = await (await ctx.get(`${entity}?size=500`)).text();
    const head = [...((h.match(/<thead[\s\S]*?<\/thead>/) || [""])[0]).matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((c) => c[1].replace(/<[^>]+>/g, "").trim());
    console.log(head.join(" | "));
    for (const tr of h.matchAll(/<tr[\s\S]*?<\/tr>/g)) {
      const cells = [...tr[0].matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((c) => c[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim());
      const id = (tr[0].match(new RegExp(`${entity}/(\\d+)`)) || [])[1];
      if (cells.length && (!filter || cells.join(" ").includes(filter))) console.log(id, "|", cells.join(" | "));
    }
  }
  await ctx.dispose();
})();
