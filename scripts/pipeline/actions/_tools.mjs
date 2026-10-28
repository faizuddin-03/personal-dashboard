// Tool sets per character (scripts/pipeline/README.md §2 item 4), plus
// Edit deny rules for the paths no character may change (hard safety rules,
// Faizuddin 2026-10-27). Edit(...) rules cover every file-writing tool.

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { ROOT } from "../store.mjs";

const FILE_TOOLS = ["Read", "Glob", "Grep", "Write", "Edit"];

/** Paths no character edits: the run hook, knowledge, the medieval styles. */
const ALWAYS_PROTECTED = [
  "Edit(./hooks/useBackgroundRuns.ts)",
  "Edit(./knowledge/**)",
  "Edit(./app/styles/medieval/**)",
  "Edit(./.claude/**)",
  "Edit(./data/agents/**)",
];

/**
 * Deny rules for every existing eAuto suite, run route and runner page,
 * except the ones listed in `own` (repo-relative dirs this ticket's Dwarf built).
 */
export function protectExistingSuites(own = []) {
  const keep = new Set(own.map(p => p.replace(/\\/g, "/").replace(/\/$/, "")));
  const out = [];
  const add = (parent, filter) => {
    let names = [];
    try { names = fs.readdirSync(path.join(ROOT, parent), { withFileTypes: true }).filter(d => d.isDirectory() && filter(d.name)).map(d => d.name); } catch { return; }
    for (const n of names) {
      const rel = `${parent}/${n}`;
      if (!keep.has(rel)) out.push(`Edit(./${rel}/**)`);
    }
  };
  add("scripts", n => /^eauto-/i.test(n) || /^secarang/i.test(n) || /^WA-Blaster/i.test(n));
  add("app/api", n => /^eauto/i.test(n));
  add("app/api/eauto", () => true);
  add("app/eauto", () => true);
  return out;
}

/**
 * Toolbox every character may run (Faizuddin, 2026-10-27: "make sure all those
 * agents can get the files they needed"). Read only on Jira and SharePoint.
 */
export const TOOLBOX = [
  "Bash(node scripts/pipeline/tools/fetch.mjs *)",
  "Bash(node scripts/pipeline/lib/xlsx-text.mjs *)",
];

/**
 * Scribe, Elf and Scout used to deny the whole "Bash" tool. A blanket deny
 * beats every allow, so the toolbox would be blocked too: they now leave Bash
 * open only for allow-listed commands. In -p mode any other command needs a
 * permission prompt nobody answers, so it is refused — EXCEPT commands
 * allowed in Faizuddin's own settings files (.claude/settings.local.json has
 * e.g. Bash(curl *), Bash(git stash *), Bash(node -e ' *)), which would apply
 * to the characters too. Those are denied by name here (deny beats allow).
 */
const SHELL_DENY_BASE = ["curl", "wget", "git", "gh", "python", "python3", "py", "pip", "npm", "npx", "rm", "del", "rmdir", "mv", "cp", "powershell", "pwsh", "cmd", "start", "env", "printenv", "set", "export", "iconv", "sed", "awk", "ssh", "scp"];
const NODE_DENY = ["Bash(node -e *)", "Bash(node -p *)", "Bash(node --eval *)", "Bash(node --print *)", "Bash(node --input-type *)"];

/** First words of every Bash(...) allow rule in the settings files Claude Code loads for the characters. */
function settingsShellCommands() {
  const files = [
    path.join(ROOT, ".claude", "settings.json"),
    path.join(ROOT, ".claude", "settings.local.json"),
    path.join(os.homedir(), ".claude", "settings.json"),
    path.join(os.homedir(), ".claude", "settings.local.json"),
  ];
  const cmds = new Set();
  for (const f of files) {
    let allow = [];
    try { allow = JSON.parse(fs.readFileSync(f, "utf8"))?.permissions?.allow ?? []; } catch { continue; }
    for (const rule of allow) {
      const m = String(rule).match(/^Bash\(\s*([A-Za-z0-9_.-]+)/);
      if (m) cmds.add(m[1].toLowerCase());
    }
  }
  return cmds;
}

/** Deny rules that keep Bash limited to the toolbox (plus a character's own extra allows). */
export function shellDenies() {
  const cmds = new Set([...SHELL_DENY_BASE, ...settingsShellCommands()]);
  cmds.delete("node");
  return ["PowerShell", ...NODE_DENY, ...[...cmds].sort().flatMap(c => [`Bash(${c})`, `Bash(${c} *)`])];
}

/** Scribe (and Scout): file tools + the toolbox. The old { convert } option is kept for callers; the converter is in TOOLBOX now. */
export const scribeTools = () => ({
  allowed: [...FILE_TOOLS, ...TOOLBOX],
  disallowed: [...shellDenies(), ...ALWAYS_PROTECTED, "Edit(./app/**)", "Edit(./lib/**)", "Edit(./components/**)", "Edit(./scripts/**)"],
});

/** Scout: same file tools and toolbox as Scribe. */
export const scoutTools = () => scribeTools();

export const elfTools = ({ bash = false } = {}) => ({
  allowed: [...FILE_TOOLS, "Skill", ...TOOLBOX, ...(bash ? ["Bash(node .claude/skills/draft-TS-excel/scripts/*)"] : [])],
  disallowed: [...shellDenies(), ...ALWAYS_PROTECTED, "Edit(./app/**)", "Edit(./lib/**)", "Edit(./components/**)", "Edit(./scripts/**)", "Edit(./hooks/**)"],
});

export const dwarfTools = ({ own = [], deny = [] } = {}) => ({
  allowed: [...FILE_TOOLS, "Skill", ...TOOLBOX, "Bash(node *)", "Bash(npm *)", "Bash(npx tsc *)", "Bash(npx eslint *)", "Bash(npx playwright *)"],
  disallowed: ["Bash(git *)", "Bash(rm -rf *)", "Bash(npm run dev*)", ...ALWAYS_PROTECTED, "Edit(./_reference/**)", "Edit(./hooks/**)", ...protectExistingSuites(own), ...deny],
});

/**
 * Sage (knowledge keeper, 2026-10-27): the only character that may write
 * knowledge/**, so knowledge/ is NOT in its deny list. Everything else is
 * denied by name: every top-level entry except knowledge/ and data/, every
 * data/ entry except data/pipeline/, and every data/pipeline/ entry except
 * the Sage's hand-off folder data/pipeline/sage-out/ (its review /
 * improvement / answer proposals; finish() merges them into
 * knowledge-review.json, improvements.json, answers.json and learnings.jsonl
 * under a file lock, so the model never edits those shared files directly).
 * Files directly in the root, data/ and data/pipeline/ are denied one by one
 * (a `*` rule would also match the kept folders and block knowledge/).
 */
export const SAGE_OUT_DIR = "data/pipeline/sage-out";

function denyAllBut(parent, keep, always = []) {
  let entries = [];
  try { entries = fs.readdirSync(path.join(ROOT, parent || "."), { withFileTypes: true }); } catch { /* none yet */ }
  const base = parent ? `./${parent}/` : "./";
  const dirs = new Set([...always, ...entries.filter(d => d.isDirectory()).map(d => d.name)]);
  return [
    ...entries.filter(d => !d.isDirectory()).map(d => `Edit(${base}${d.name})`),
    ...[...dirs].filter(n => !keep.includes(n)).map(n => `Edit(${base}${n}/**)`),
  ];
}

export function sageEditDenies() {
  // A file rule like Edit(./README.md) is matched like a .gitignore line
  // without a slash: it also hit knowledge/README.md (seen 2026-10-27, the
  // Sage's index edit was refused). So root files whose name also exists in
  // knowledge/ are left out; the prompt keeps the Sage to knowledge/.
  let kn = [];
  try { kn = fs.readdirSync(path.join(ROOT, "knowledge")); } catch { /* none */ }
  return [
    ...denyAllBut("", ["knowledge", "data"]).filter(r => !kn.some(n => r === `Edit(./${n})`)),
    ...denyAllBut("data", ["pipeline"]),
    ...denyAllBut("data/pipeline", ["sage-out"], ["sage-inbox", "runs", "work", "chats", "tickets", "jobs", "findings", "locks", "backups"]),
    // Shared Sage files: written only by code (finish() merges sage-out/ under a lock).
    ...["knowledge-review.json", "improvements.json", "learnings.jsonl", "answers.json"].map(f => `Edit(./data/pipeline/${f})`),
    ...ALWAYS_PROTECTED.filter(r => r !== "Edit(./knowledge/**)"),
  ];
}

/** Sage learn / apply / chat: file tools + the read-only toolbox; writes only knowledge/** and data/pipeline/sage-out/**. */
export const sageTools = () => ({
  allowed: [...FILE_TOOLS, ...TOOLBOX],
  disallowed: [...shellDenies(), ...new Set(sageEditDenies())],
});

/** Sage answering another character (sage:help): read only. */
export const sageReadTools = () => ({
  allowed: ["Read", "Glob", "Grep", ...TOOLBOX],
  disallowed: [...shellDenies(), "Write", "Edit", "NotebookEdit"],
});
