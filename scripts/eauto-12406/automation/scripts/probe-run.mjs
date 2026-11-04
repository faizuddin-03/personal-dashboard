// Run ONE probe (a ticket's one-off look, not a TS) on a lane: video on, the lane lock held for the probe's duration,
// and the VPN watchdog held only while it runs (the same lock + vpn-watch.json as scripts/cr-run.mjs, so a probe and a
// TS run never share a lane). TS runs still go through cr-run.mjs; this is for cr/<TICKET>/03-spec/probes*/ files.
//
//   node scripts/probe-run.mjs <lane> <spec path relative to automation/> [playwright args]
//     PROBE_PROJECT=cr-tools-firefox   for a *.firefox.spec.ts (default cr-tools = Chrome)
//     PROBE_VPN=0                      no VPN watchdog (a read-only probe of UCD / BO pages; eSim needs the VPN)
//     a *.py probe (Firefox 36 via Selenium) runs with FF36_PY (the FF36 venv's python), same lock + watchdog
//
// Merged 27.10.2026 from three copies (cr/EAINT-12253/03-spec/probes-2110/run.mjs, .../scripts/run-probe.mjs,
// cr/EAINT-12626/03-spec/probes/run.mjs); a ticket folder no longer carries its own runner.
import { spawn, spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";

const [lane, spec, ...rest] = process.argv.slice(2);
if (!lane || !spec) { console.error("usage: node scripts/probe-run.mjs <lane> <spec> [args]"); process.exit(2); }
const AUTO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const ART = path.join(AUTO, ".artifacts");
fs.mkdirSync(ART, { recursive: true });
const alive = (pid) => { try { process.kill(pid, 0); return true; } catch { return false; } };
const ticket = (/EAINT-\d+/.exec(spec) ?? ["probe"])[0];
const useVpn = process.env.PROBE_VPN !== "0";

const lock = path.join(ART, `lane-${lane}.lock`);
if (fs.existsSync(lock)) {
  const held = JSON.parse(fs.readFileSync(lock, "utf8"));
  if (alive(held.pid)) { console.error(`lane ${lane} is busy: ${held.run} (pid ${held.pid}) since ${held.since}`); process.exit(3); }
}
fs.writeFileSync(lock, JSON.stringify({ pid: process.pid, run: `${ticket} probe ${path.basename(spec)}`, since: new Date().toISOString() }));

const vpnFile = path.join(ART, "vpn-watch.json");
const ps = (args) => ["-NoProfile", "-ExecutionPolicy", "Bypass", "-File", path.join(AUTO, "scripts", "vpn-watchdog.ps1"), ...args];
function vpnJoin() {
  spawnSync("powershell", ps(["-Once"]), { stdio: "inherit" });
  const st = fs.existsSync(vpnFile) ? JSON.parse(fs.readFileSync(vpnFile, "utf8")) : { pid: 0, holders: [] };
  st.holders = st.holders.filter(alive).concat(process.pid);
  if (!st.pid || !alive(st.pid)) {
    const w = spawn("powershell", ps([]), { detached: true, stdio: "ignore", windowsHide: true });
    w.unref();
    st.pid = w.pid;
    console.log(`VPN watchdog started (pid ${w.pid}) for this probe`);
  }
  fs.writeFileSync(vpnFile, JSON.stringify(st));
}
function vpnLeave() {
  if (!fs.existsSync(vpnFile)) return;
  const st = JSON.parse(fs.readFileSync(vpnFile, "utf8"));
  st.holders = st.holders.filter((p) => p !== process.pid && alive(p));
  if (!st.holders.length) {
    if (st.pid && alive(st.pid)) spawnSync("taskkill", ["/PID", String(st.pid), "/T", "/F"], { stdio: "ignore" });
    fs.rmSync(vpnFile, { force: true });
    console.log("VPN watchdog stopped (no run in progress)");
  } else fs.writeFileSync(vpnFile, JSON.stringify(st));
}

// `shell: true` (needed for npx on Windows) joins the args with spaces and does NOT quote them, so a
// `--grep "1 stops at searched"` used to arrive as `--grep 1` plus three loose words that Playwright read as file
// filters: on 30.10.2026 that ran 14 tests of 11 other flow verify specs on lane 1 (EAINT-12019). Quote every arg.
function shellQuote(a) {
  return /^[\w@%+=:,./\-]+$/.test(a) ? a : `"${String(a).replace(/"/g, '\\"')}"`;
}

try {
  if (useVpn) vpnJoin();
  const r = spec.endsWith(".py")
    ? spawnSync(process.env.FF36_PY ?? "python", ["-I", spec, ...rest], { cwd: AUTO, stdio: "inherit", env: { ...process.env, LANE: lane, PYTHONIOENCODING: "utf-8" } })
    : spawnSync("npx", ["playwright", "test", spec, `--project=${process.env.PROBE_PROJECT ?? "cr-tools"}`, `--output=.artifacts/test-results-${ticket}-probe-L${lane}`, ...rest].map(shellQuote), {
      cwd: AUTO, stdio: "inherit", shell: true, env: { ...process.env, RECORD: "1", LANE: lane },
    });
  process.exitCode = r.status ?? 1;
} finally {
  if (useVpn) vpnLeave();
  fs.rmSync(lock, { force: true });
}
