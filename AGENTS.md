<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# QA knowledge base

`knowledge/` holds durable, sourced facts about the systems we test — eAuto
portals and environments, Service Hub business rules, payment gateways, the
automation playbook, and the traps that have already cost debugging time. Start
there before studying a ticket or writing/changing a test, and read the specific
file for the area you're touching (`knowledge/README.md` is the index).

Every fact is tagged with its provenance. Treat `[unconfirmed]` entries as leads
to verify, never as established behaviour. When a task teaches something durable,
append it — with a source tag — in the same change.

Ticket-level studies (scope, SRD requirements, settled decisions, open questions)
live in `lib/ticketStudies.ts` and render at `/jira/studies`.

**Standing rule — capture the flow.** Any session that works out how a module's
flow behaves (steps, branches, entry points, the DOM that drives it) must write
it to `knowledge/flow-<module>.md`, or update the existing file, before
finishing. Automating the next ticket in a module should start from a written
flow, never from rediscovery. Keep these files flat — `app/api/knowledge/route.ts`
ignores subdirectories. Rules for the Automation Testing section specifically
live in `knowledge/automation-testing.md`.

**Standing rule — SAVE EVERY PAGE OF HTML THE USER GIVES YOU. No exceptions.**

The moment HTML is pasted into a session, write it to a file **before** using it
for anything else. Do not read it, extract the selectors you happen to need, and
move on — that loses the other 90% of the page, which the next ticket in that
module will need.

- **Where:** `_reference/html/<system>/<page>.html` for a module page;
  `_reference/tickets/<KEY>/<KEY>-<module>-<NN>-<url-segment>.html` when it is
  specific to one ticket. Link it from the `knowledge/` file that cites it.
- **How:** header comment giving URL, environment, capture date, and what was
  trimmed. **Forms are never trimmed.** Long tables may be cut to `thead` plus a
  few representative rows *only if the header block says so*.
- **Conventions:** `_reference/html/README.md`. The eSIM captures under
  `_reference/html/esim/` are the worked example.

Why this is a hard rule: audited 2026-08-17, **not one captured page existed in
the repo**, while three flow documents carried `[verified: live HTML from uat4,
2026-08-14]`. Every one of those captures had been read in a session and
discarded, leaving claims nobody can re-check and selectors nobody can re-derive
without asking the user to paste the page again. **A `[verified: live HTML]` tag
with no file behind it is not verified.** Saving it costs one tool call; losing
it costs a recapture and the user's time.

# Reference material

**`_reference/` is read-only. Never edit, refactor or run code inside it.** It
holds other people's code and raw material kept for comparison. When a reference
implementation needs to become something we use, **write new code in the repo
proper** (`scripts/`, `tests/`, `app/`) and leave the original untouched. The one
exception is correcting a source document at the owner's explicit request.

`_reference/` is a drop zone for raw material — SRDs, screenshots, spreadsheets,
data exports, and read-only copies of other repos. None of it is imported, built
or typechecked. When the user mentions a file they "dropped" or "shared", look
there; `_reference/inbox/` is the unsorted landing spot and
`_reference/README.md` maps the rest. Everything for one ticket lives in
`_reference/tickets/<KEY>/`, and files are named ticket-key-first
(`EAINT-11862-...`), so a grep for the key finds every artefact for a ticket.

**Test scripts** are the exception to the no-spaces rule: name them
`<TICKET-KEY> - <Jira summary, emoji stripped>.xlsx`, matching the ticket title
verbatim — e.g. `EAINT-12058 - [CIBO-Transaction Listing] Add UCD Full Name &
Login ID columns to Transaction Listing.xlsx`.

Distinguish it from `knowledge/`: `_reference/` is the raw source, `knowledge/`
is the distilled, sourced fact. Promote from one to the other, don't conflate.
