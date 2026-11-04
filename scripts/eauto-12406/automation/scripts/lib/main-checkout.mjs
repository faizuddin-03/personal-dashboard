// The MAIN checkout of this repo, also when called from a git worktree (.claude/worktrees/<ticket>).
// Things that must be ONE per machine live there, whatever folder a run starts from: the lane locks and the
// VPN watchdog state (automation/.artifacts/) and the staging logins (automation/env/.staging.env-local).
// In the main checkout this returns the repo root itself, so nothing moves there (21.10.2026).
import * as fs from "node:fs";
import * as path from "node:path";

export function mainCheckout(from) {
  for (let dir = path.resolve(from); ; dir = path.dirname(dir)) {
    const dotGit = path.join(dir, ".git");
    if (fs.existsSync(dotGit)) {
      if (fs.statSync(dotGit).isDirectory()) return dir;
      // a worktree's .git is a file: "gitdir: <main>/.git/worktrees/<name>"
      const m = fs.readFileSync(dotGit, "utf8").match(/^gitdir:\s*(.+?)\s*$/m);
      const i = m ? m[1].split("\\").join("/").lastIndexOf("/.git/worktrees/") : -1;
      return i >= 0 ? path.resolve(m[1].slice(0, i)) : dir;
    }
    if (path.dirname(dir) === dir) return path.resolve(from);
  }
}

/** automation/.artifacts of the main checkout: lane locks + vpn-watch.json, shared by every worktree. */
export const sharedArtifacts = (from) => path.join(mainCheckout(from), "automation", ".artifacts");
