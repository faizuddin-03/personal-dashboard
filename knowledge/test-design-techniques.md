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

## Ten coverage dimensions — a completeness check per rule (from Charmain's repo, 2026-10-27)

**Use when:** checking a draft scope for gaps, after the scenarios are listed. Walk each SRD rule through all ten; each gives a case or a one-line reason it does not apply. Not a quota — most rules need three or four. `[charmain-repo: .claude/skills/scenario-ledger/SKILL.md:46-63]`

| # | Dimension | eAuto example (verbatim from the source) |
|---|---|---|
| 1 | **Positive** | the rule fires as stated |
| 2 | **Negative** | conditions unmet → must NOT fire |
| 3 | **Exemptions / carve-outs** | each one separately |
| 4 | **Boundaries** | at / just inside / just outside a threshold; reset |
| 5 | **Enumerated variants** | every module (STMS, eSTM, APT, …), transaction type, vehicle class named — no stand-ins |
| 6 | **Independence** | dealer A's state never shows on dealer B's screen; branch vs company |
| 7 | **Exactly-once** | double-click on Submit creates one record; retry does not duplicate |
| 8 | **Ordering / races** | whichever-first pinned |
| 9 | **Aftermath** | after the rule fires, the next transaction is normal |
| 10 | **Roles & parties** | UCD admin vs sub-user; BO CSE vs Finance vs Supervisor; JPJ officer; AATF; seller vs buyer dealer — each from its own screen |

1. Dimension 4 is EP/BVA above; dimension 9 is the "aftermath" cell of a state table.
2. **No stand-ins** (dimension 5): "STMS covers eSTM too" is a hole. `[charmain-repo: .claude/agents/scenario-reviewer.md:54]`

## Name the wrong outcome each check must reject (from Charmain's repo)

For every expected result, name one **plausibly broken build** it must fail on: the pre-change behaviour, the neighbouring control, or the other role's view. If the check would also pass on that broken build, it is too loose. `[charmain-repo: .claude/skills/assertion-plan/SKILL.md:108]` "An assertion loose enough for a broken build to pass is not an assertion." `[charmain-repo: docs/lessons.md:53-56]`

1. **Negative checks need a denominator.** "No field is editable" passes on a page where no field was found. Count what was examined; zero examined = inconclusive, not pass. `[charmain-repo: .claude/skills/test-evidence-recording/references/rig-lessons.md:513-517]`
2. **A check that changes nothing still needs before and after.** For "this must not change anything" cases, read the downstream surface before and after the action. `[charmain-repo: .claude/skills/test-evidence-recording/SKILL.md:178-193]`

## Provenance decides whether a case may gate sign-off (from Charmain's repo)

| Tag | Expected result came from | May gate? |
|---|---|---|
| `REQ` | ticket / SRD | yes |
| `doc` | team documentation | yes |
| `dim` | a coverage dimension above | yes |
| `code` | eAuto source code | **no** — raise as a question |
| `obs` | seen on screen, undocumented | **no** — raise as a question |

"A test pinning unintended behaviour passes, so it reads as coverage while defending a defect." `[charmain-repo: docs/writing-tests.md:107-121]` Consistent with "report it, don't silently pick an assumption" above.
