// Builds scripts/claude-run/results/EAINT-12406.json for the TS Tracker (/api/ts-tracker/official).
// Two result columns per TS: Azfar's result at hand-over (30.10, simulator) and the Claude-driven run of
// 04.11 (real Allianz UAT API). Both come from lib/eauto12406.ts (TS_12406 .azfar and CLAUDE_12406):
// edit them there, then re-run:  node scripts/claude-run/build-results-12406.mjs
// Mapping: pass→Pass, fail→Fail, kiv / blocked→Blocked, rerun→In Progress, deprio→N/A, not run→no cell.
// An Azfar RE-RUN that the Claude run settled is left out, so the tracker shows the newer result.
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1")), "../..");
const src = fs.readFileSync(path.join(root, "lib/eauto12406.ts"), "utf8");
const sheets = JSON.parse("{" + src.match(/SHEETS_12406[^=]*= \{([^}]*)\}/)[1].replace(/(\w+):/g, '"$1":') + "}");
const ts = JSON.parse(src.match(/export const TS_12406: Ts12406\[\] = (\[[\s\S]*?\n\]);/)[1]);
const claude = Object.fromEntries([...src.matchAll(/^\s*"(12406_\w+)": \{ r: "(\w+)", note: ".*" \},$/gm)].map(m => [m[1], m[2]]));

const AZ = "Azfar sim 30-10", CL = "Claude real-API 04-11";
const MAP = { pass: "Pass", fail: "Fail", kiv: "Blocked", blocked: "Blocked", rerun: "In Progress", deprio: "N/A" };
const sheetNo = Object.keys(sheets);
const cases = ts.map(t => {
  const cells = [];
  if (MAP[t.azfar] && !(t.azfar === "rerun" && claude[t.id])) cells.push({ column: AZ, status: MAP[t.azfar] });
  if (MAP[claude[t.id]]) cells.push({ column: CL, status: MAP[claude[t.id]] });
  return { sheet: "EAINT-12406 TS board", section: `${String.fromCharCode(65 + sheetNo.indexOf(t.sheet))}. ${sheets[t.sheet].replace(/^[0-9]+ /, "")}`, ts: t.id, objective: t.title, cells };
});
const out = {
  key: "EAINT-12406",
  title: "[Secarang-Allianz] To Allow and Display Allianz in Secarang Including Logo and Wording",
  column: CL,
  environment: "Secarang staging /ia/ + CIBO",
  ranAt: "2026-11-04",
  details: "_reference/tickets/EAINT-12406/claude-run-2026-11-04/RESULTS.md; Azfar's 30.10 results: _reference/tickets/EAINT-12406/EAINT-12406-azfar-STATUS-20261103.md",
  cases,
};
const file = path.join(root, "scripts/claude-run/results/EAINT-12406.json");
fs.writeFileSync(file, JSON.stringify(out, null, 2) + "\n");
const latest = ts.reduce((t, x) => { const k = claude[x.id] ?? x.azfar; t[k] = (t[k] ?? 0) + 1; return t; }, {});
console.log(file, cases.length, "TS; claude entries", Object.keys(claude).length, "; latest", JSON.stringify(latest));
