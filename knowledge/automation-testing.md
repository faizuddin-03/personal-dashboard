# Automation Testing section — rules

## Scope: this file governs the "Automation Testing" area only

These rules apply to the dashboard's **Automation Testing** section and the
ticket-driven Playwright suites behind it. They are about how the section is
*organised* — navigation, runner controls, scheduling — and don't generalise to
the Insurance Checker, Secarang or WA Blaster.

**Code design is a separate question.** Any check that compares observed data
against expected data — email, portal page, PDF, export, or several sources against
each other — follows
[data-verification-standard.md](data-verification-standard.md).

For how a Playwright spec is written and how the dashboard spawns it, see
[automation-playbook.md](automation-playbook.md).
`[from QA team, 2026-08-13 / 2026-08-14]`

## Navigation

- A single side-menu dropdown titled **"Automation Testing"**.
- One page per ticket, and the page is **named with the ticket number only** —
  `11864`, not `EAINT-11864` and not a descriptive title.
- New tickets get new pages under the same dropdown.

`[from QA team, 2026-08-13]`

## Runner controls on each page

- **Environment picker, chosen before the run.** The target environment changes
  often, so it is a run-time choice in the UI, never a hardcoded value. Base URL
  and credentials must reach the spec from the API route, the same way
  `EAUTO_BASE_URL` and friends already do.
- **Time picker beside the Run button.** With no time set the button reads
  **"Run"**. Pick a specific time and it becomes **"Set Schedule"**.

**Timing requirements belong to individual tickets, not to any flow.** The
insurance flow has no timing rule of its own — you can quote and purchase at any
hour. Only a ticket whose *subject* is timing imposes one, and the picker exists to
serve those. Never carry a ticket's clock constraint into a flow document or a
general rule. `[from QA team, 2026-08-14]`

**When a ticket does need a specific moment, scheduling the run start is not
enough.** What has to land at the chosen moment is a *specific click*. EAINT-11864,
for example, needs its decisive click one minute before an hourly cronjob (10:59
for the 11:00 run). A run launched at 10:59:00 still has to log in, load the page
and wait out the AJAX, so the click lands after the hour and the scenario is
silently invalid. Start the run early with a margin and have the spec **block on
wall-clock time immediately before the decisive action**.
`[from QA team, 2026-08-13]`

Which click is decisive is a per-ticket question. For EAINT-11864 it is
`[unconfirmed]` whether the quotation is persisted by **Show My Result** or by
**selecting an insurer** — see
[flow-insurance-purchase.md](flow-insurance-purchase.md). Settle that before
building the schedule around either.

## Unattended runs that straddle a closed cronjob window

Some scenarios can only be observed across hours when nobody is at a machine —
EAINT-11864's dead-window case generates a quotation after 23:00, checks that no
email arrives, then re-checks after the 07:00 cronjob run. The laptop is off
overnight, so these run on a **cloud runner (GitHub Actions)**, not locally.
Rules that follow from that:

- **Pin the timezone explicitly.** Runners are UTC. A ticket whose whole subject
  is timing produces useless evidence if its timestamps are 8 hours off, so set
  `TZ=Asia/Kuala_Lumpur` for the job and log **both** MYT and UTC on every
  recorded step. Cron expressions are UTC too: 23:30 MYT is `15:30` UTC, and
  07:10 MYT is `23:10` UTC on the **previous** day.
- **One job cannot span the gap.** A GitHub Actions job is capped at 6 hours;
  23:30 → 07:00 is 7.5. It has to be separate scheduled runs that hand state
  forward — the quotation's identity (vehicle no, transaction id, recipient,
  exact creation timestamp) written as an artifact by the first run and read by
  the second.
- **Scheduled runs fire late, so place checks where lateness is harmless.**
  Actions cron is routinely 5–30+ minutes late and can be skipped. A "no email
  yet" check scheduled at 06:45 that slips past 07:00 sees the email and reports
  a false failure. Put negative checks deep inside the dead window (00:05, not
  06:45) and positive checks after the boundary with a poll, where being late
  only makes them safer.
- **Never assert an absence alone.** Assert the precondition really happened
  first, and treat the later positive check as the control for the negative one.

`[design decision, 2026-08-14 — cron delay behaviour is documented GitHub
Actions behaviour; the rest is reasoned, not yet verified by a real overnight run]`

## The Excel test script is a guide for humans, not a spec for the automation

**The steps in the Excel test script are written to guide a human tester through
the flow. They are not a one-to-one rule for the automation.** Do not translate
the sheet row-by-row into Playwright steps, and do not treat a mismatch between
the sheet and the script as a defect in the script.

**The automation is built from the reference implementation** — the existing
working script or code reference provided for that ticket — not from the sheet.
The sheet tells you *what outcome is being proven*; the reference tells you *how
the flow is actually driven*. When the two disagree on mechanics, the reference
wins; when they disagree on intent, ask.

Practical consequences:

- A single sheet step often expands into several automated actions, and several
  sheet steps often collapse into one — both are correct and neither needs
  justifying.
- Human-only phrasing ("observe that…", "verify the screen shows…") maps to an
  assertion, not to a UI interaction.
- Steps that exist purely to orient a human (navigate, log in, scroll to) may be
  handled by shared setup in the reference rather than appearing in the spec.
- Don't add steps to the sheet to make it match the automation. The sheet stays
  lean and readable for the human running it manually.

`[from Faizuddin, 2026-09-03]`

## Standing rule: capture the module flow every session

**After every session that touches an automation flow, write down how the flow
works — or update what's already written — before finishing.**

The goal is that automating the *next* ticket in a module is cheaper than the
last, because the flow is already documented instead of being rediscovered by
clicking through staging. The scripts are the by-product; the flow knowledge is
the asset that compounds.

Flow documents live here as **flat files named `flow-<module>.md`** — e.g.
`flow-estm.md`, `flow-insurance-purchase.md`. Flat because
`app/api/knowledge/route.ts` lists bare `.md` filenames only and ignores
subdirectories, so anything nested is invisible on the `/knowledge` page.

Each flow document should record the entry points into the flow, the steps and
what identifies each one, the decision points and what they branch on, the real
DOM handles used to drive it, and the preconditions needed to reach it. Tag
provenance as usual, and add the file to the index in
[README.md](README.md). `[from QA team, 2026-08-13]`
