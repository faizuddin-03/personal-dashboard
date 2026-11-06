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

const COLUMN = "Claude uat1 04-05.11";
// Status per TS for the 2026-11-04 run, plus TS06 / TS56 / TS57 rerun 2026-11-05 (claude-run-2026-11-05/RESULTS.md). Missing = TS20 (ran 3 Nov).
const P = "Pass", F = "Fail", B = "Blocked", N = "Not Started", D = "N/A"; // D = deprioritised (Faizuddin 2026-11-05: TS09, TS11 "there will always be transaction")
const OUTCOME = {
  "01": P, "02": P, "03": P, "04": P, "05": P, "06": P, "07": F, "08": P, "09": D, "10": P,
  "11": D, "12": B, "13": B, "14": P, "15": B, "16": B, "17": B, "18": B, "19": B,
  "21": B, "22": P, "23": P, "24": B, "25": F, "26": F, "27": P,
  "28": F, "29": B, "30": F, "31": P, "32": F, "34": P,
  "33": F, "35": F, "36": N, "37": F, "38": F, "39": F, "40": P, "41": P, "42": B,
  "43": B, "44": P, "45": P, "46": F, "47": B, "48": F,
  "49": F, "50": P, "51": P, "52": P, "53": P, "54": P, "55": P, "56": F, "57": F,
  "58": F, "59": P, "60": P, "61": F, "62": B, "63": P,
  "64": P, "65": P, "66": P, "67": P, "68": P, "69": P,
};

// Run after the developer's reset of statuses + signatures, 2026-11-05 afternoon
// (_reference/tickets/EAINT-12028/claude-run-2026-11-05-reset/RESULTS.md). Overrides OUTCOME for each TS re-run.
// TS25/28/33/35/49 parts done so far fail on the same wording as 04.11, so they stay Fail.
const RESET = {
  "20": P, "29": P, "47": F, "54": P, "36": B, // 54: download goes by transaction id; month in the address is ignored = expected (Faizuddin 2026-11-05)
  // 36: kmcheah got no signature pad (saved signature not reset)
  // Night block 2026-11-05 (no kmcheah approval): RESULTS.md "Night block"
  "67": P, "68": P, "21": P, "24": B, "44": P, "64": P, "65": P, "27": P, "45": P,
  "26": F, "30": F, "22": P, "34": P, "37": F, "38": F, "31": P, "23": P, "32": F,
  "28": F, "35": F, "49": F, // every part done; buttons hidden in all, notes differ from the TS
};

const cases = scenarios.map(s => {
  const st = RESET[s.ts.slice(-2)] ?? OUTCOME[s.ts.slice(-2)];
  return { sheet: "Claude run 2026-11-04", section: `${s.section}. ${sections[s.section] ?? ""}`.trim(), ts: s.ts, objective: s.title, cells: st ? [{ column: COLUMN, status: st }] : [] };
});
const out = {
  key: "EAINT-12028",
  title: "[eAuto-BackOffice] New Module – Association Payment Listing",
  column: COLUMN,
  environment: "staging uat1",
  ranAt: "2026-11-05",
  details: "_reference/tickets/EAINT-12028/claude-run-2026-11-04/RESULTS.md, FAILS-AND-BLOCKS.md and claude-run-2026-11-05-reset/RESULTS.md",
  cases,
};
const file = path.join(root, "scripts/claude-run/results/EAINT-12028.json");
fs.writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
const tally = cases.reduce((t, c) => { const k = c.cells[0]?.status ?? "not in this run"; t[k] = (t[k] ?? 0) + 1; return t; }, {});
console.log(file, cases.length, "cases", JSON.stringify(tally));
