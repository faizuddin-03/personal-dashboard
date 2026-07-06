# QA Workflow Automation — Roadmap

Goal: move the team from a fully manual QA flow (get assigned → study SRD → draft test plan/scenario/script → test → raise bugs → retest → done) to an AI-assisted flow with a human approval gate at every step that writes data or declares something finished.

Running on the QA's local machine for now; no assumptions — the AI must ask when the requirement is ambiguous, incomplete, or contradictory, rather than guess.

## Phase 0 — Foundation ✅ DONE
- Auto-detect tickets where the user is in the QA field or assignee (Jira custom field `customfield_10041`)
- Auto-populate the CR kanban board; columns mapped to Jira status; keeps syncing every 5 minutes
- Finished column holds full history of past CRs
- Child bug (QA-Issue) sync: open/fixed progress bar per CR, "recently fixed — retest?" flag
- Dashboard "My CR Tickets" widget (To-Do / On-Going)

## Phase 1 — Auto-Study ✅ DONE
- QA Flow page: study any CR (from the board's To-Do/On-Going list, or any ticket key manually)
- Reads ticket description, comments, and attachments (PDF, docx, screenshots)
- Structured output: overview, list of changes, affected pages per portal, test focus (priority order), risks, out-of-scope
- Open questions ("no assumptions") — blocking questions must be answered before approval
- User can answer questions, add free-text notes, or upload extra documents, then re-study
- Approval gate + per-ticket audit trail
- Multi-provider AI settings (Gemini / Anthropic / OpenRouter), each with its own saved key and a model picker — switch anytime without re-entering keys

## Phase 2 — Test Plan / Scenario / Script Drafting 🔧 IN PROGRESS
- Users upload their own past test plan / scenario / script documents as style templates (per-user, since different QAs format differently); templates are stored and can be replaced over time
- "Draft test plan" on an approved study — AI drafts a full test plan (scenarios + step-by-step scripts) in the uploaded style, grounded in the approved study and the user's answers
- Editable draft: reorder, add, edit, delete test cases before approving
- Approval gate — approved draft is locked and recorded in the audit trail
- Output lands in the dashboard's existing TS Tracker so execution tracking works exactly as it does today

## Phase 3 — Bug Ticket Drafting
- Draft a QA-Issue bug from a failed test case (or free text + screenshots), in the team's exact format (Description/Steps | Actual | Expected table), correctly parented under the CR
- Preview → explicit user approval → only then created in Jira
- Newly created bugs immediately show up in the CR card's bug bar (already wired from Phase 0)

## Phase 4 — Retest Loop & Completion
- Retest queue: bugs that moved to Done, one click to mark "verified fixed" or "reopen" (reopen drafts a Jira comment/transition, still gated on approval)
- Completion sign-off: when all cases are run and bugs closed, the system asks the user to confirm testing is complete
- On approval, post a test summary comment to the CR in Jira (cases run, pass/fail, bugs raised/closed) — approval required before posting
- Desktop notifications for: new CR tagged to the user, a bug moving to fixed (retest ready), CR status changes

## Phase 5 — Auto-Execution ⏸ DEFERRED (by design — build trust first)
- Confidence report before running: which approved test cases the AI can safely auto-execute vs. which need a human
- Browser agent opens the affected pages on staging and runs the approved scripts, capturing screenshots per step
- Results report with evidence; the user confirms each failure before it becomes a Phase 3 bug draft
- Needs settling first: staging URLs + test accounts, login/OTP handling, test data supply
- Start as "assisted execution" (AI runs + reports, human confirms), widen scope only after it's proven reliable

## Infrastructure track (parallel, before team rollout)
- Move off localStorage to a real database behind the existing API routes (SQLite is enough to start)
- Move Jira token + AI provider keys server-side
- Multi-user support so each QA gets their own board/flow state
- Automated backups until the above lands (today's manual export/import is the interim safety net)
