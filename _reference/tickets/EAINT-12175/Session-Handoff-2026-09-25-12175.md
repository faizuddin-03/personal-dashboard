# Session handoff — 2026-09-25 (EAINT-12175)

Scratch note for resuming later. Not part of the knowledge base — safe to
delete once picked back up. First handoff for this ticket — no prior file
existed.

## What this ticket is (one-liner)
`[Secarang & eAuto-Insurance] To Correct Insurer Name to Lonpac Insurance Bhd
& Update SDPA Policy Wording Link` — standardises the insurer display string
from "Lonpac Insurance Berhad" to "Lonpac Insurance Bhd" and updates the SDPA
policy wording link. Secarang's 5 pages (REQ-001–005) are already deployed to
production. Remaining scope is eAuto-side: REQ-012–015.

## Status as of 2026-09-25
Type: Task · Status: In Development · Priority: Medium · Fix Version:
S34.X-20261002. Assignee: Shane · Reporter: Batrisyia Hasanah Binti Nursyamsi.
**Environment: not specified anywhere** (ticket field, comments, SRD) —
confirmed with Faizuddin today; do not schedule execution until one is set.

First substantive session on this ticket: SRD read in full, ticket study
published as a Claude Artifact, coverage checked against this repo's
`knowledge/` and `scripts/`, a new flow file created for the previously
undocumented BackOffice Insurance Enquiry screen, and a code-audit prompt
drafted for an external code-reading chatbot to map the fix's full blast
radius. No test scenarios drafted yet, no automation started.

## Today's findings

1. **SRD versions**: v0.1 (02-Sep) through v1.1 (23-Sep, latest, revised by
   Chee Mei Jia) — only v1.1's PDF was downloaded and read in full (27
   pages); saved as `EAINT-12175_SRD_v1.1_20260923.pdf`. Earlier versions and
   the .docx were not pulled — not needed, v1.1 is the baseline.
2. **Download method note**: the Atlassian REST attachment content endpoint
   (`api.atlassian.com/.../attachment/content/<id>`) needs an OAuth bearer
   token the browser session doesn't carry — 403s from a page-context
   `fetch()`. What actually works: navigate the browser straight to
   `/secure/attachment/<id>/<filename>`.
3. **Coverage check against `knowledge/` and `scripts/`** (full detail in
   `_reference/tickets/EAINT-12175/NOTES.md`):
   - Insurer identity runs on `planCode`, not the display string
     (`knowledge/flow-insurance-purchase.md:268`) — confirms REQ-012–015 is
     a cosmetic label fix, not a matching-logic change.
   - UCD filter values and a known selector trap are already documented:
     `select[name=insuranceCompany]` values are `RHB`, `Takaful`, `Chubb`,
     `Lonpac`, `TokioMarine`; both selects share `id="to-filter"`, so any
     script must filter by `name`, not `id`
     (`knowledge/flow-insurance-purchase.md:469-470`,
     `knowledge/flow-ucd-shell.md:203-204`).
   - Existing automation (`scripts/eauto-e2e/pages/TransactionEnquiryPage.ts`)
     already touches the UCD Insurance Enquiry screen and reads the
     `'Insurance Company'` column, but doesn't test the filter or the name
     string itself.
   - **No coverage at all for the BackOffice side** — no `flow-*.md` file
     and no `scripts/` page object referenced a BackOffice Insurance Enquiry
     filter or result table before today. REQ-012/REQ-013 are first-time
     testing, not regression.
   - **No coverage for the Insurance Dashboard chart** — the original
     ticket description names it as sharing the plan-code label, but v1.1's
     REQ-012–015 don't mention it. Open question, unresolved.
4. **New knowledge file created**: `knowledge/flow-eauto-insurance-enquiry.md`
   — did not exist before today for this surface. Folded in navigation leads
   from a code-reading chatbot's response (BackOffice Insurance Transaction
   Listing, UCD Transaction Listing, UCD Report, a separate Insurance
   Dashboard portal login at `/motorInsurance/login/` with its Pemaju
   Payment Report and Agency Performance chart, eSTM Transaction Detail,
   Credit Portal Insurance Enquiry) — all tagged `[from a code-reading
   chatbot, 2026-09-25]`, **not yet live-verified**, treat as leads only.
5. **Code-audit prompt drafted and given to Faizuddin** (also saved as
   `EAINT-12175-code-audit-prompt.html`) for an external chatbot with code
   read access, to map every screen touching the shared plan-code label.
   The chatbot's actual response came back broader than the prompt's own
   scenario list — it added a genuinely new item (BackOffice Pemaju Payment
   Report via the separate `/motorInsurance/login/` portal) not in the
   SRD's Affected Items list, found by following the prompt's own "find
   every screen using the shared label" instruction.
6. **Timesheet**: today's AI session + IT Team townhall combined into one
   2h "AI session" (Non-billable, AI knowledge sharing) entry — tagging
   skipped, exempt category.

## What's in the ticket folder now
- `_reference/tickets/EAINT-12175/EAINT-12175_SRD_v1.1_20260923.pdf` — full
  27-page SRD, latest version.
- `EAINT-12175-study.html` — the ticket study (local copy; published as
  Claude Artifact `22ee8d0c-ce28-4ec3-a4d5-906fa4281bf2`).
- `EAINT-12175-code-audit-prompt.html` — the copy-button prompt (local copy;
  published as Claude Artifact `260948bb-8677-46cc-a087-bebe0b86e545`).
- `NOTES.md` — attachment list, download method, Teams-search status
  (not run — not signed in to Graph), and the full coverage findings above.
- **Not captured**: earlier SRD versions (v0.1/v0.2/v1.0) and the .docx
  format — judged not needed, v1.1 is the current baseline.
- **Note**: both published artifacts and their local HTML copies still
  reflect the state *before* the navigation-mapping exchange (item 4/5
  above) — only the local `knowledge/` file and `NOTES.md` were updated with
  those findings, not the artifacts themselves.

## Open items
1. **Environment still unassigned** — confirmed with Faizuddin today, not
   resolved. Do not schedule test execution until this is set.
2. **Insurance Dashboard chart's inclusion is still an open question** —
   named in the ticket description but not in v1.1's REQ-012–015. Needs a
   direct answer from BA/dev on whether it's in scope.
3. **BackOffice Insurance Enquiry (REQ-012/013) has zero prior test
   coverage** — first-time testing, no existing scenarios or page objects
   to build from.
4. **Navigation leads from the code-reading chatbot are unverified** — need
   live-HTML confirmation before being trusted for scenario-writing.
5. **No test scenarios drafted yet** — this session was study/coverage only,
   no TS writing, no automation.
6. **Teams search not run this session** — not signed in to Graph; unknown
   whether any Teams discussion exists for this ticket.
7. **Published artifacts are stale relative to the final findings** — the
   navigation-mapping additions (BackOffice Pemaju Payment Report finding)
   never made it back into either published artifact or its local copy.

## Next steps for whoever picks this up
1. Get the environment assigned before any execution planning.
2. Ask BA/dev directly whether the Insurance Dashboard chart is in scope.
3. Update the study/code-audit artifacts (and their local HTML copies) with
   the navigation-mapping findings (BackOffice Pemaju Payment Report, etc.)
   so they're not left stale.
4. Live-verify the code-reading chatbot's navigation leads before drafting
   scenarios against them.
5. Draft test scenarios for REQ-012 (BackOffice filter), REQ-013 (BackOffice
   result table), REQ-014 (UCD filter, partial prior coverage), and REQ-015
   (UCD result table) — REQ-012/013/015 need building from zero.
6. Run a Teams search once signed in to Graph, to check for any discussion
   not yet captured.

## Durable-knowledge candidates (flagged, not written here)
- `knowledge/flow-eauto-insurance-enquiry.md` was created today — already
  written, no further action needed there, but the leads inside it are
  tagged unverified and should be confirmed against live HTML before being
  relied on for automation.
- No entry for `EAINT-12175` exists in `lib/ticketStudies.ts` — this is a
  new ticket for that file, worth adding once scope/environment settle.
