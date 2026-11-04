import * as fs from "node:fs";
import * as path from "node:path";

/**
 * The repo root of the MAIN checkout, also when this code runs from a git worktree
 * (.claude/worktrees/<ticket>). What must be one per machine lives there: the staging
 * logins (automation/env/.staging.env-local) and the vehicle / mobile / email counters
 * (automation/state/usage.json). In the main checkout this is the repo root itself, so
 * nothing moves there. Same logic as scripts/lib/main-checkout.mjs (21.10.2026).
 */
export function mainCheckoutRoot(): string {
  const root = path.resolve(__dirname, "..", "..");
  const dotGit = path.join(root, ".git");
  if (fs.existsSync(dotGit) && fs.statSync(dotGit).isFile()) {
    const m = fs.readFileSync(dotGit, "utf8").match(/^gitdir:\s*(.+?)\s*$/m);
    const i = m ? m[1].split("\\").join("/").lastIndexOf("/.git/worktrees/") : -1;
    if (m && i >= 0) return path.resolve(m[1].slice(0, i));
  }
  return root;
}
