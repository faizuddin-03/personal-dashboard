# Test design techniques — when they earn their place

These are ISTQB CTFL black-box techniques, kept here because they change how
test cases get *generated*, not because the certification matters. Reach for
one only when the scenario actually has the shape it's built for — forcing a
technique onto a scenario that doesn't fit produces a bloated script, which
[test-scripts.md](test-scripts.md) already says to avoid. `[from CTFL v4.0 study, 2026-09-11]`

**Default is still: read the SRD/BA plan, write scenarios directly.** Only
stop and apply one of these when the scope has the specific shape below.

## Equivalence partitioning + boundary value analysis

**Use when:** a field or rule has a numeric/date range, a set of valid
categories, or a length limit — vehicle age bands, premium tiers, the 6-month
SRD expiry window.

**What it gives you:** instead of guessing a handful of values, split the
input into partitions (valid / invalid), then generate test values at each
partition's boundary — the boundary value itself and the one unit either side
(3-value BVA) or just the boundary and its neighbour across the line (2-value).
This is how a script goes from many redundant mid-range cases to a handful of
cases that actually target where defects live — off-by-one errors sit at
boundaries, not in the middle of a partition.

**Don't force it:** a plain toggle, a single yes/no flag, or a field with no
real range (a free-text name field) doesn't have partitions worth drawing —
just write the case.

## Decision tables

**Use when:** an outcome depends on **more than one condition combining** —
discount stacking, eligibility rules, an approval path with several
independent yes/no inputs. If there's only one condition, this is EP, not a
decision table.

**What it gives you:** list every condition as a row, enumerate every
combination as a column (2ⁿ columns for n boolean conditions, collapsed where
a condition doesn't matter to that rule), then fill in the outcome for each
column. **The real value is the columns with no defined outcome** — those are
requirement gaps to flag back to the BA, not gaps to guess a test case for.

**Don't force it:** a single linear condition chain (do A, then B, then C)
is a flow, not a decision table — use a scenario list instead.

## State transition testing

**Use when:** the SUT models a **status field with transitions** — this is
most of eAuto (pre-check Pending/Approved/Failed/Expired/Cancelled, insurance
step 3 PENDING vs DRAFT per
[insurance-step3-row-is-pending-not-draft.md](insurance-step3-row-is-pending-not-draft.md),
eDereg per [flow-edereg.md](flow-edereg.md)).

**What it gives you:** build a **table**, not just a diagram — states down
the rows, events across the columns, each cell either a resulting state or a
dash. The **dash cells are the negative tests a diagram alone would never
surface** — what happens if you resubmit an Approved record, or retry a
Failed one past its expiry. A diagram only draws the valid paths a designer
already thought of; the table forces every combination into view, including
the ones nobody drew an arrow for.

**Don't force it:** a status field with no branching (created → done, nothing
else can happen to it) doesn't need a table — there's nothing for it to find.

## Where this fits the existing flow

- Apply during **scope-building**, before the script is drafted — same stage
  [test-scripts.md](test-scripts.md) describes for reading the BA testing
  plan. The technique feeds candidate scenarios into that same house style;
  it doesn't change how a case gets written once decided.
- A module's `flow-<module>.md` file is the right place to *record* a state
  table once built, per the standing rule in [flows.md](flows.md) — it's part
  of the module's DOM/behaviour knowledge, not a one-off scratch artifact.
- If a decision table or state table turns up a gap (an undefined outcome, an
  un-transitioned state), that's scope information for the BA/requestor, same
  as any other scope delta — report it, don't silently pick an assumption.

## The honest limit

These techniques organise domain knowledge; they don't supply it. Filling in
partitions, table columns or state cells correctly still needs the real
business rule (the actual premium bands, the actual status semantics) —
getting the *category* of test right doesn't protect against getting a
*specific rule* wrong. Verify filled-in values against the SRD or the running
system the same as any other fact in this knowledge base.
