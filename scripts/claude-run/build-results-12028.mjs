// Builds scripts/claude-run/results/EAINT-12028.json: the Claude-driven run results the
// TS Tracker shows as an extra result column (via /api/ts-tracker/official).
// Source of truth for the outcomes: _reference/tickets/EAINT-12028/claude-run-2026-11-04/RESULTS.md
// and FAILS-AND-BLOCKS.md. Re-run after editing the OUTCOME table:  node scripts/claude-run/build-results-12028.mjs
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "../..");
const runner = fs.readFileSync(path.join(root, "app/eauto/12028/Runner.tsx"), "utf8");
const sections = Object.fromEntries([...runner.matchAll(/\{ letter: "([A-M])", title: "([^"]+)" \}/g)].map(m => [m[1], m[2]]));
const scenarios = [...runner.matchAll(/id: "(12028_TS\d+)", section: "([A-M])", priority: "P\d", title: "([^"]+)"/g)]
  .map(m => ({ ts: m[1], section: m[2], title: m[3].replace(/^12028_TS\d+:\s*/, "") }));

const COLUMN = "Claude uat1 04-11";
// Status per TS for the 2026-11-04 run. Missing = not part of this run (ran on the main laptop 2-3 Nov).
const P = "Pass", F = "Fail", B = "Blocked", N = "Not Started";
const OUTCOME = {
  "01": P, "02": P, "03": P, "04": P, "05": P, "07": F, "08": P, "09": B, "10": P,
  "11": B, "12": B, "13": B, "14": P, "15": B, "16": B, "17": B, "18": B, "19": B,
  "22": P, "24": B, "25": F, "26": F, "27": P,
  "28": F, "29": B, "30": P, "31": P, "32": P, "34": P,
  "35": F, "36": N, "37": N, "38": P, "39": N, "40": N, "41": N, "42": N,
  "43": B, "44": P, "45": P, "46": P, "47": B, "48": N,
  "49": F, "50": N, "51": N, "52": N, "53": N, "54": N, "55": N, "56": B, "57": B,
  "58": F, "59": N, "60": F, "61": B, "62": N, "63": N,
  "64": P, "65": P, "66": N, "67": N, "68": N, "69": N,
};

const cases = scenarios.map(s => {
  const st = OUTCOME[s.ts.slice(-2)];
  return { sheet: "Claude run 2026-11-04", section: `${s.section}. ${sections[s.section] ?? ""}`.trim(), ts: s.ts, objective: s.title, cells: st ? [{ column: COLUMN, status: st }] : [] };
});
const out = {
  key: "EAINT-12028",
  title: "[eAuto-BackOffice] New Module – Association Payment Listing",
  column: COLUMN,
  environment: "staging uat1",
  ranAt: "2026-11-04",
  details: "_reference/tickets/EAINT-12028/claude-run-2026-11-04/RESULTS.md and FAILS-AND-BLOCKS.md",
  cases,
};
const file = path.join(root, "scripts/claude-run/results/EAINT-12028.json");
fs.writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
const tally = cases.reduce((t, c) => { const k = c.cells[0]?.status ?? "not in this run"; t[k] = (t[k] ?? 0) + 1; return t; }, {});
console.log(file, cases.length, "cases", JSON.stringify(tally));
