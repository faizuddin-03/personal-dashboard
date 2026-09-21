# CIBO — a separate system, inter-related with eAuto and Secarang

## What it is, and what it is not

**CIBO is its own portal, not part of eAuto and not part of Secarang.** Treat the
three as separate systems that share data rather than one product with three
skins — a fact established with the QA team on 2026-08-13. It has its own Jira
component (`CIBO`) in EAINT, distinct from the `eAuto` component.

## CIBO carries BOTH eAuto and Secarang insurance transactions

**The CIBO Transaction Management Listing holds insurance transactions from both
systems in one table**, and they are distinguished by what the UCD-attribution
columns contain:

| Transaction source | UCD Name column shows |
|---|---|
| **eAuto** insurance | the full UCD name |
| **Secarang** insurance | a literal **`-`** |

That is a deliberate rule, not missing data — Secarang transactions have no eAuto
UCD to attribute, so the column is dashed rather than blank. Any CR adding a
UCD-derived column to this listing therefore needs a Secarang case, or half the
rows go unchecked. `[from BA testing plan, EAINT-12058, 2026-08-13]`

For **EAINT-12058 specifically**, the BA plan split the test environments by
system: eAuto at `staging/uat4`, Secarang at `staging/cibo`.
`[from BA testing plan, EAINT-12058, 2026-08-13]`

⚠️ **That is one ticket's environment, not a standing fact.** Environments are
chosen per ticket depending on what's free — see
[eauto-portals.md](eauto-portals.md) § Never tie an environment to a general rule.
Read the env from the ticket you're working on; the pairing above tells you nothing
about the next CIBO ticket. `[from QA team, 2026-08-14]`

The relationship that matters for testing: **an eAuto insurance transaction shows
up in CIBO as well.** CIBO is the *third* place a transaction has to be verified,
after the UCD portal and the BO portal. The EAINT-11864 test script makes this
explicit — its cross-check step lists all three:

> Cross check the details in the relevant pages: a. UCD Insurance Transaction and
> Details page · b. BO Insurance Transaction and Details page · **c. CIBO**

`[from ticket EAINT-11864 test script]`

So a change in eAuto can surface as a defect in CIBO, and a CIBO change can be
reading data eAuto owns. When either side moves, check the other.

## Modules seen so far

| Module | Seen in | Notes |
|---|---|---|
| **Transaction Listing** | EAINT-12058 | Lists eAuto **insurance** transactions. Has an **Excel export** |
| **Transaction Management Listing** | EAINT-11934 | May be the same surface under a fuller name — **unverified** |
| **Payment Report** | EAINT-11934 | Changed alongside the listing in that ticket |

The Transaction Listing's **Excel export is a second read path for the same
data**, so any column added to the listing has to be checked there too — the
export can render or omit a new column independently of the screen.
`[from QA team, 2026-08-13]`

Whether "Transaction Listing" and "Transaction Management Listing" are one screen
or two is **not yet established**, and it matters: a CR touching one may or may
not touch the other. `[unconfirmed]`

## What CIBO shows about a UCD

Historically the listing carried **only the date/time** of an insurance
transaction — no indication of *which* dealer user did anything.

Two tickets are changing that:

- **EAINT-11934** — adds the **User ID of the used car dealer representative** to
  the Transaction Management Listing and the Payment Report. Status: Ready for
  Prod Deployment. `[from ticket EAINT-11934]`
- **EAINT-12058** — reworks how the name is retrieved (11934's method is
  described as "not straightforward") and adds four columns: **Full Name** for the
  UCD who *created*, who *paid*, and who *last updated*, plus **Login ID** for the
  UCD who *paid*. Fix version S32.X-20260817. `[from ticket EAINT-12058]`

**They are two phases of one piece of work, not two unrelated tickets.** The
formal Jira link is only the weak `Relates` type, which understates it. What
actually binds them:

- 12058's description: *"Following EAINT-11934 … the current way to display the
  name is not straightforward — hence an enhancement is needed to retrieve the
  name."*
- A comment on 11934 (Chee Mei Jia, 2026-07-26): *"Payment Report changes has
  been deployed to Production on 24.07.2026 … **Next Phase - Transaction Listing
  + EAINT-12058 together**."*

**11934 was descoped mid-flight**, and which half went matters when scoping a test:

| Surface | State | Testing implication |
|---|---|---|
| **Payment Report Listing + CSV export** | **UCD Name column delivered by 11934**, in Production since 2026-07-24 (S31.8) | **Regression** — 12058 reworks the retrieval underneath it |
| **Transaction Management Listing + CSV export** | **Cut from 11934**, moved to 12058 | **First-time testing**, not regression |

The 11934 testing plan records the cut verbatim: *"Will NOT show UCD Name column
for now due to **difficulty on Dev side to display the value in this page**. To
work on this in separate ticket."* That difficulty is the same thing 12058's
description calls the retrieval being "not straightforward" — so **12058 exists
to unblock the half of 11934 that could not be delivered**.

Note the column is called **UCD Name** in both plans, even though 11934's ticket
title says "User ID". `[from BA testing plans, EAINT-11934 / EAINT-12058, 2026-08-13]`

### What the executed 11934 script established

From Maisarah's completed run (all cases Pass):

- **The UCD Name column sits between `UCD` and `Vehicle No`** — in the listing
  *and* in the Excel export.
- **Records before 2025 do not show a UCD Name**, because of a data migration
  done previously. This is **known and accepted**, not a defect. It is the real
  answer to "are historical rows backfilled?" — they are, but only back to the
  migration boundary.

⚠️ **That script is a snapshot, and it is now out of date.** It covers
*Transaction Management Listing **and** Payment Report* and marks both Pass —
which was true when Maisarah ran it. **Changes were made afterwards**: the
Transaction Management Listing column was pulled from the deployment and moved to
EAINT-12058. The script was never updated, so it still shows a surface passing
that did not ship.

Two consequences:

- **The Pass on Transaction Management Listing is not evidence about production.**
  Only the Payment Report half went live (2026-07-24).
- **EAINT-12058 is re-delivering that surface**, not delivering it for the first
  time — it worked once, then changed. Treat the old expected results as a useful
  starting point for what "correct" looks like, not as a baseline you can assume
  still holds.

`[from QA team, executed EAINT-11934 script + follow-up, 2026-08-13]`

Note also that 11934's summary says *User ID* while its SRD v0.2 "Added UCD Name
display scenarios", which is why 12058 refers to it as a name-display request.
And 11934's **User ID** vs 12058's **Login ID** are plausibly the same field
under two names — unconfirmed. `[from tickets EAINT-11934 / EAINT-12058, 2026-08-13]`

### Most of EAINT-12058 is not visible in the UI

Confirmed with the developer (Goh Kai Jiaeh) on 2026-08-13: of the four new
columns, **only Full Name is visible on the CIBO side** — the rest can only be
checked from the database. The developer offered to supply **DB screenshots** as
the evidence for those.

That shapes how a CR like this gets tested here: treat a dev-supplied DB
screenshot as a legitimate evidence type rather than something QA has to reach
itself. `[from dev Goh Kai Jiaeh, 2026-08-13]`

### Only two of the three name columns can ever differ

An insurance transaction has just two actor-recording events — **create** and
**make payment** — with no separate update step (see
[eauto-insurance.md](eauto-insurance.md)). So on an insurance row:

- **Full Name (created)** — can be a different user (e.g. a Sub UCD)
- **Full Name (paid)** — the payer
- **Full Name (last update)** — **always equals the payer**, since payment is
  the last action

Expect two distinct names at most, never three. `[from QA team, 2026-08-13]`

## Open questions — fill these in as they are answered

Nothing below is established. Do not assume an answer.

- **Base URL scheme.** Does CIBO use the same `staging.eauto.my/<env>` path-segment
  scheme as eAuto, or its own host? (Which *specific* env a ticket runs on is
  always per-ticket — that's not the open question here.)
- **Login and accounts.** Separate credentials, or shared with BO/UCD? Which role
  reads the Transaction Listing?
- **How transactions arrive.** Live join against eAuto's data, a scheduled sync,
  or its own tables written at transaction time? This decides whether a value
  corrected in eAuto self-heals in CIBO. Partial clue: the UCD Name populates for
  *existing* transactions, so it is either a live lookup or a backfilled value —
  not a write-time snapshot only.
- **Which surfaces exist beyond listing, Payment Report and the Excel export** —
  other downloads, detail pages.

`[from QA team, 2026-08-13]` for the separateness and the inter-relation; every
specific above is `[unconfirmed]` until checked against the running system.

## Testing notes

- **Verify in all three places.** For anything touching an insurance transaction,
  UCD and BO agreeing is not sufficient — CIBO is a distinct read path and can
  disagree.
- **New columns on an existing listing raise the backfill question every time.**
  Historical rows predate the data being captured, so decide up front whether
  they should populate or stay blank, and get it stated rather than inferred.
- **Denormalised vs live-joined names behave differently over time.** If a name
  is captured at transaction time, renaming the user later won't change history;
  if it's joined live, it will. Prove which by renaming a user after a
  transaction and re-reading the listing.
- **No automation exists against CIBO** in this repo — no page objects, no
  selectors, no credentials wired through any runner. Anything here starts from
  scratch. `[verified: no CIBO references anywhere under scripts/, tests/, lib/, 2026-08-13]`
