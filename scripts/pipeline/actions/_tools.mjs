// Tool sets for the characters.
//
// 2026-10-29, Faizuddin: "make the characters to be able to do anything that
// you can. basically full permission and access as you". He chose full access
// with the core guards kept, and outside writes only after he types a
// confirmation line (scripts/pipeline/tools/ask-permission.mjs). So every
// character gets the same full set below; the old per-character limits from
// 2026-10-27 (knowledge/ Sage only, .claude/, hooks, styles, data/agents,
// shell allow-list, no web, no connectors) are gone.
//
// Deny beats allow, and in -p mode a tool that is not allowed is refused
// (nobody answers the prompt). Edit(...) rules cover every file-writing tool;
// they do not stop a shell command writing the same file, so the guards are
// best-effort against mistakes, not a sandbox.

import fs from "node:fs";
import path from "node:path";
import { ROOT } from "../store.mjs";

/** Everything this Claude Code session can use, minus PowerShell (Bash covers it; see CORE_GUARDS). */
const FULL = [
  "Bash", "Read", "Glob", "Grep", "Write", "Edit", "NotebookEdit", "Skill", "TodoWrite",
  "WebFetch", "WebSearch", "Agent",
  // Claude.ai connectors he uses. Their write tools are in OUTSIDE_WRITE.
  "mcp__claude_ai_Atlassian", "mcp__claude_ai_Claude_Docs",
];

/**
 * Writes outside the repo, under his account. Denied unless he typed the
 * permission line for this job (run-character.mjs opens them for that job).
 */
export const OUTSIDE_WRITE = [
  ...["addCommentToJiraIssue", "addWorklogToJiraIssue", "createJiraIssue", "editJiraIssue", "transitionJiraIssue",
    "createIssueLink", "createConfluencePage", "updateConfluencePage", "createConfluenceFooterComment",
    "createConfluenceInlineComment", "createCompassComponent", "createCompassComponentRelationship",
    "createCompassCustomFieldDefinition", "addTeamworkGraphContext"].map(t => `mcp__claude_ai_Atlassian__${t}`),
  ...["create", "update", "batch", "delete"].map(t => `mcp__claude_ai_Claude_Docs__${t}`),
  "Artifact", "ArtifactData", "ArtifactComments", "RemoteTrigger",
  // Shell routes to the same services (reads go through WebFetch and the toolbox).
  "Bash(curl *)", "Bash(wget *)", "Bash(gh *)", "Bash(git push *)", "Bash(git push)",
];

/** Kept on purpose (his answer: "Full, keep core guards"). */
const CORE_GUARDS = [
  "Bash(git commit *)", "Bash(git commit)",
  "Bash(rm -rf *)", "Bash(rm -fr *)", "Bash(rm -r *)", "Bash(rm -R *)",
  // A second shell would walk around the rm guard.
  "PowerShell", "Bash(powershell *)", "Bash(pwsh *)",
  // The permission file and job files: only code writes them.
  "Edit(./data/pipeline/permissions.json)", "Edit(./data/pipeline/jobs/**)",
  // Shared Sage files: written only by code (finish() merges sage-out/ under a lock).
  ...["knowledge-review.json", "improvements.json", "learnings.jsonl", "answers.json"].map(f => `Edit(./data/pipeline/${f})`),
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
 * _reference/ is read only (CLAUDE.md), except where the standing rules say to
 * save things: html/ and tickets/ (pasted HTML), miro/ (board captures),
 * inbox/, and the append-only miro-links.txt.
 */
function protectReference() {
  const keep = new Set(["html", "tickets", "miro", "inbox", "miro-links.txt"]);
  let entries = [];
  try { entries = fs.readdirSync(path.join(ROOT, "_reference"), { withFileTypes: true }); } catch { return []; }
  return entries.filter(d => !keep.has(d.name)).map(d => (d.isDirectory() ? `Edit(./_reference/${d.name}/**)` : `Edit(./_reference/${d.name})`));
}

/** Toolbox (scripts/pipeline/tools): still the quickest way to Jira, SharePoint and Miro. */
export const TOOLBOX = [
  "Bash(node scripts/pipeline/tools/fetch.mjs *)",
  "Bash(node scripts/pipeline/lib/xlsx-text.mjs *)",
  "Bash(node scripts/pipeline/tools/to-my-folder.mjs *)",
  "Bash(node scripts/pipeline/tools/ask-permission.mjs *)",
];

/** The one set every character gets. `own` = suites this job may change; `deny` = extra per-action rules. */
export const fullTools = ({ own = [], deny = [] } = {}) => ({
  allowed: [...FULL, ...TOOLBOX],
  disallowed: [...OUTSIDE_WRITE, ...CORE_GUARDS, ...protectExistingSuites(own), ...protectReference(), ...deny],
});

// Old names, kept for the action modules.
export const scribeTools = () => fullTools();
export const scoutTools = () => fullTools();
export const elfTools = () => fullTools();
export const dwarfTools = ({ own = [], deny = [] } = {}) => fullTools({ own, deny });
export const sageTools = () => fullTools();
export const sageReadTools = () => fullTools();

export const SAGE_OUT_DIR = "data/pipeline/sage-out";
