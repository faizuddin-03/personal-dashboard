#!/usr/bin/env node
// Asks Faizuddin before any write outside the repo (2026-10-29): "Allow
// outside writes, but only if i confirm. and by confirming, the characters
// need to give me a line to type in letter by letter".
//
//   node scripts/pipeline/tools/ask-permission.mjs "<what you want to do, one line>"
//
// Runs only inside a pipeline job (CLAUDE_PIPELINE_JOB). Prints the line he
// must type in this character's chat. When he types it, the runner opens the
// outside-write tools (Jira, Confluence, Claude Docs, published pages) for
// that next job only.

import * as store from "../store.mjs";

const what = process.argv.slice(2).join(" ").trim();
const jobId = process.env.CLAUDE_PIPELINE_JOB;
if (!what) {
  console.error('Usage: node scripts/pipeline/tools/ask-permission.mjs "<what you want to do, one line>"');
  process.exit(2);
}
const job = jobId ? store.readJob(jobId) : null;
if (!job) {
  console.error("Only a pipeline character can ask for permission (no CLAUDE_PIPELINE_JOB).");
  process.exit(2);
}
const req = store.addPermissionRequest({ key: job.key, character: job.character, jobId: job.id, what });
console.log(`Permission requested: ${req.what}`);
console.log(`Faizuddin must type this line exactly in your chat (valid 24 hours, one job):`);
console.log(req.phrase);
