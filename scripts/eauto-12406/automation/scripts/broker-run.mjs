// Run any spec on lanes the BROKER picks (lib/lane-broker.mjs), the way cr-run.mjs --lane auto does for a
// ticket's TS, for specs outside cr/ (tests/flows verify specs, probes). VPN watchdog only while running. 21.10.2026.
//   node scripts/broker-run.mjs <single|ucd2ucd|main+sub> <pool e.g. 5,6,7 | all> <spec rel. to automation/> [playwright args]
//   e.g. node scripts/broker-run.mjs ucd2ucd all tests/flows/ucd2ucd.verify.spec.ts --project=flows --grep Interstate
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { acquireLanes } from "./lib/lane-broker.mjs";
import { sharedArtifacts } from "./lib/main-checkout.mjs";

const [need, poolArg, spec, ...rest] = process.argv.slice(2);
const AUTO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ART = sharedArtifacts(AUTO);
const runId = process.env.RUN_ID || `broker-${need}-${Date.now()}`;
const got = await acquireLanes({ auto: AUTO, need, pool: poolArg === "all" ? undefined : poolArg.split(","), runId });
const lanes = got.lanes.map((l) => l.lane);
console.log(`BROKER ${need} -> ${got.lanes.map((l) => `lane ${l.lane} ${l.persona} (${l.company}, ${l.role})`).join(" + ")}`);
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };
const vpnFile = path.join(ART, "vpn-watch.json");
const ps = (a) => ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(AUTO, "scripts", "vpn-watchdog.ps1"), ...a];
try {
  spawnSync("powershell", ps(["-Once"]), { stdio: "inherit" });
  const st = fs.existsSync(vpnFile) ? JSON.parse(fs.readFileSync(vpnFile, "utf8")) : { pid: 0, holders: [] };
  st.holders = st.holders.filter(alive).concat(process.pid);
  if (!st.pid || !alive(st.pid)) { const w = spawn("powershell", ps([]), { detached: true, stdio: "ignore", windowsHide: true }); w.unref(); st.pid = w.pid; }
  fs.writeFileSync(vpnFile, JSON.stringify(st));
  const r = spawnSync("npx", ["playwright", "test", spec, `--output=.artifacts/test-results-lane${lanes.join("")}`, ...rest], {
    cwd: AUTO, stdio: "inherit", shell: true, env: { ...process.env, RECORD: "1", LANE: lanes[0], LANES: lanes.join(","), RUN_ID: runId },
  });
  process.exitCode = r.status ?? 1;
} finally {
  const st = fs.existsSync(vpnFile) ? JSON.parse(fs.readFileSync(vpnFile, "utf8")) : null;
  if (st) {
    st.holders = st.holders.filter((p) => p !== process.pid && alive(p));
    if (!st.holders.length) { if (st.pid && alive(st.pid)) spawnSync("taskkill", ["/PID", String(st.pid), "/T", "/F"], { stdio: "ignore" }); fs.rmSync(vpnFile, { force: true }); }
    else fs.writeFileSync(vpnFile, JSON.stringify(st));
  }
  got.release();
}
