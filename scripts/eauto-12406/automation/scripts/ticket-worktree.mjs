// One git worktree per ticket, so two Claude sessions can work on two tickets without editing each
// other's files (Azfar 21.10.2026).
//   node automation/scripts/ticket-worktree.mjs EAINT-12345            new worktree from `modules`
//   node automation/scripts/ticket-worktree.mjs EAINT-12345 --from main
// Makes <repo>/.claude/worktrees/<ticket> on branch ticket/<ticket> and installs automation's packages
// there. Lane locks, VPN state and the staging logins stay in the MAIN checkout (scripts/lib/main-checkout.mjs),
// so nothing has to be copied and two worktrees never take the same lane.
import { spawnSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import { fileURLToPath } from "node:url";
import { mainCheckout } from "./lib/main-checkout.mjs";

const args = process.argv.slice(2);
const ticket = args.find((a) => /^EAINT-\d+$/i.test(a))?.toUpperCase();
const from = args.includes("--from") ? args[args.indexOf("--from") + 1] : "modules";
if (!ticket) { console.error("usage: node automation/scripts/ticket-worktree.mjs EAINT-12345 [--from <branch>]"); process.exit(2); }

const root = mainCheckout(path.dirname(fileURLToPath(import.meta.url)));
const dir = path.join(root, ".claude", "worktrees", ticket);
const branch = `ticket/${ticket}`;
const run = (cmd, a, cwd) => {
  console.log(`> ${cmd} ${a.join(" ")}`);
  const r = spawnSync(cmd, a, { cwd, stdio: "inherit", shell: process.platform === "win32" && cmd === "npm" });
  if (r.status !== 0) process.exit(r.status ?? 1);
};

if (fs.existsSync(dir)) { console.error(`${dir} exists already: open Claude there, or remove it with git worktree remove`); process.exit(3); }
const has = spawnSync("git", ["rev-parse", "--verify", "--quiet", branch], { cwd: root }).status === 0;
run("git", has ? ["worktree", "add", dir, branch] : ["worktree", "add", "-b", branch, dir, from], root);
run("npm", ["ci", "--no-audit", "--no-fund"], path.join(dir, "automation"));

console.log(`
Worktree ready: ${dir}  (branch ${branch}, from ${from})
- Open a Claude session in that folder for ${ticket}; its code goes in cr/${ticket}/ only.
- Give the ticket its lanes in cr/${ticket}/STATUS.md (env/lanes.md); locks are shared with every other checkout.
- A change to shared automation/src: commit it small, merge it into ${from}, and merge ${from} into the other
  ticket branches (git merge ${from}) before they touch the same file.
- Done with the ticket: merge ${branch} into ${from}, then: git worktree remove "${dir}"`);
