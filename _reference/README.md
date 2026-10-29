# Reference drop zone

Everything in `_reference/` is **material, not code**. Nothing here is imported,
built, typechecked, or served — it exists so files can be dropped somewhere
predictable and found again later, by you or by the AI assistant.

**Read-only.** Nothing in here gets edited, refactored or run in place — much of
it is other people's work, kept as-is so it stays a faithful reference. To turn a
reference implementation into something we use, write new code in the repo proper
(`scripts/`, `tests/`, `app/`) and leave the original alone.

Sorts to the top of the file tree because of the leading underscore.

## Where to drop what

| Folder | What goes in it | Examples |
| --- | --- | --- |
| `tickets/` | **Everything for one ticket, in one folder per ticket** — SRDs, test scripts, specs, screenshots, exports | `tickets/EAINT-11864/SRD-v1.1.pdf`, `tickets/EAINT-11864/test-script.xlsx` |
| `inbox/` | Anything you haven't sorted yet. Drop first, file later. | a screenshot you just took, a doc someone sent |
| `figma/` | Design frames and flow notes, one folder per ticket | `figma/EAINT-11864/flow.md` |
| `screenshots/` | UI evidence **not** tied to a ticket | `screenshots/bo-listing-baseline.png` |
| `excel/` | Spreadsheets **not** tied to a ticket | `excel/vehicle-master-2026.xlsx` |
| `exports/` | Raw dumps and payloads **not** tied to a ticket | `exports/policy-dump.csv` |
| `codebases/` | Read-only copies of *other* repos, kept for cross-referencing | `codebases/wa-blaster/` |

**If it belongs to a ticket, it goes in `tickets/<KEY>/`** — whatever the file
type. That keeps everything for one piece of work in one place, which is the
whole point. The type-based folders are for material that outlives any single
ticket.

**`<KEY>` is the parent CR/enhancement ticket, never a QA-Issue/bug sub-ticket
raised under it.** A QA-Issue (e.g. EAINT-12251) is a Jira sub-task of its
parent CR (e.g. EAINT-9306) — it shows up nested under the parent in Jira, and
its evidence belongs in the parent's own folder for the same reason: everything
for that piece of work, in one place. So a video/screenshot for a bug raised
under EAINT-9306 goes in `tickets/EAINT-9306/`, not a new `tickets/EAINT-12251/`
— name the file with BOTH keys (parent first) so it's still findable by either
one: `EAINT-9306-EAINT-12251-<what-it-shows>.mp4`. Only create a bug's own
folder if it was raised standalone, with no CR parent to nest under.

## Naming that makes things findable

Both you and the assistant search this tree by filename, so the name is the index:

- **Test scripts have their own fixed rule.** Name them
  **`<TICKET-KEY> - <Jira summary, status emoji stripped>`**:

  ```
  EAINT-12058 - [CIBO-Transaction Listing] Add UCD Full Name & Login ID columns to Transaction Listing.xlsx
  ```

  No version suffix — the folder holds the current script. A superseded copy
  kept for reference gets ` (superseded v0.1)` appended. This one deliberately
  keeps the summary's spaces and brackets so the filename matches the ticket
  title verbatim and is recognisable at a glance; quote the path in shell
  commands. `[from QA team, 2026-08-13]`
- **Everything else: lead with the ticket key** — `EAINT-11862-shopping-cart-srd.pdf`.
  A grep for `11862` then finds the SRD, the screenshots and the export in one pass.
- **Use dashes, never spaces — outside the test-script rule above.** Spaces break
  shell globs and force quoting on every command. (`WA Blaster Code Reference/`
  became `codebases/wa-blaster/` for exactly this reason.)
- **Dates as `YYYY-MM-DD`** so they sort chronologically: `2026-08-13-staging-run.csv`.
- **Say what it is, not that it is a file**: `premium-mismatch-bo.png`, not `screenshot2.png`.

## Pointing the assistant at something

Give the path — `_reference/tickets/EAINT-11862/SRD-v3.pdf` — or just the ticket
key, since everything for it sits in one folder. Dropping a file in `inbox/` and
saying "look at what I just dropped in the inbox" also works.

## What this is *not*

- **Not the knowledge base.** Durable, sourced facts about the systems under
  test live in `knowledge/` and are read on every task. `_reference/` holds the
  raw material those facts get distilled *from*. When something here turns into
  a lasting truth, write it into `knowledge/` with a source tag.
- **Not test output.** Playwright artefacts land in `test-recordings/` and
  `test-results/`, are regenerated every run, and are gitignored.

## Git

Tracked by default, so references travel with the repo. Two exceptions are
gitignored, since both are personal scratch rather than shared reference:

- `inbox/` — unsorted, churns constantly
- `screenshots/` — image files bloat the repo fast

Note that `tickets/` **is** tracked, images included. That's usually what you
want — the evidence for a ticket should travel with its documents. If you're
dropping something big that shouldn't be committed, put it in `screenshots/`
or `inbox/` instead. Going the other way, a file that must be permanent can be
forced in with `git add -f`.
