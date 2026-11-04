// A TOOL: switch OFF one of OUR eSim Runnerku error-injection rules by id (refuses a rule whose message is not ours).
import { request } from "@playwright/test";
import { loadEnv } from "../config/load-env";
loadEnv();
(async () => {
  const id = process.argv[2];
  const ctx = await request.newContext({ baseURL: process.env.ESIM_BASE_URL!.replace(/\/?$/, "/"), ignoreHTTPSErrors: true });
  const lh = await (await ctx.get("login")).text();
  const csrf = (lh.match(/name="_csrf"\s+value="([^"]+)"/) || [])[1];
  await ctx.post("login", { form: { username: process.env.ESIM_USERNAME!, password: process.env.ESIM_PASSWORD!, ...(csrf ? { _csrf: csrf } : {}) } });
  const f = await (await ctx.get(`runnerku-error-injection/${id}/edit`)).text();
  const form = (f.match(/<form[\s\S]*?<\/form>/) || [""])[0];
  const action = ((form.match(/action="([^"]+)"/) || [])[1] ?? "").replace(/^\/esim\//, "");
  const data: Record<string, string> = {};
  for (const m of form.matchAll(/<input[^>]*>/g)) { const n = (m[0].match(/name="([^"]+)"/) || [])[1]; if (n) data[n] = (m[0].match(/value="([^"]*)"/) || [])[1] ?? ""; }
  if (!/^QA Azfar/.test(data.message ?? "")) throw new Error(`rule #${id} is not ours ("${data.message}") - refusing`);
  data.active = "false"; data.message = data.message.replace(/ - .*$/, " - switched off");
  const r = await ctx.post(action, { form: data, maxRedirects: 0 });
  console.log(`rule #${id} (${data.endpoint} ${data.matchKey}) -> inactive: HTTP ${r.status()}`);
  await ctx.dispose();
})();
