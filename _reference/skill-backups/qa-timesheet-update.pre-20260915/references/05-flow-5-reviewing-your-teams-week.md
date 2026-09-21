# Flow 5 — Reviewing your team's week

**Who:** Leads and the CTO
**When:** Weekly. A lead reviews their own direct reports. The CTO can review anyone.

The short version: the list tells you who needs attention, and you give your verdict on the week page — not on the list.

---

## Step 1 — Read the team list

The list shows one row per person for one week. Each row gives you:

- the shape of their Mon–Fri days, as bars
- their total hours and billable percentage
- chips for anything worth stopping on — a missed day, a missing wrap-up, blockers they raised, night work, or replies waiting on you

The weeks that need something are sorted to the top, so you're not hunting for them.

**Approve** and **Undo** are on this list because they don't need any explanation from you. Anything that needs a sentence — a query, a cut, a reclassification — is done on the week page instead.

**Things worth knowing:**

- **Reviews only ever shows one week.** There's no month or date-range switcher, because everything on this screen apart from the entry list only makes sense for exactly one week.
- **"Approve all remaining" covers the whole week,** not just the rows you can see. It approves every entry still pending across all of it.
- **The badge in the sidebar is your queue.** It counts the people whose week is waiting on you.

---

## Step 2 — Open the week before deciding anything

The week page is split into two halves, and nothing appears in both.

**The top half** is everything the entry list can't tell you: days they missed, whether the projects they worked on are running late, who else is staffed on those projects, their own wrap-up account of the week, and any night work they recorded.

**The bottom half** is the entries themselves, grouped by day. Each day has its own capacity bar and a one-word verdict.

**Things worth knowing:**

- **A day bar always shows the whole day, not just the rows you've filtered to.** If you filter to Queried, the count might say one entry while the bar still says 7.4h. That's intentional — the bar is the context you're judging that entry against.
- **Each day heading carries a word: Light, On track, Overloaded, or On leave.** It weighs everything logged that day, billable or not, against how many hours the day was meant to hold. The same four words are used for a whole month. The key is at the bottom of the guidelines page.
- **Night work is the one thing here that is never an entry.** Those hours sit outside the 40-hour week entirely.
- **Project health is calculated across the whole organisation, not just your team.** A project is usually staffed across several teams, so a count that ignored another lead's three people would tell you a project was understaffed when it isn't.

---

## Step 3 — Approve, query or assess one entry

Clicking **Assess** on an entry opens three controls at once:

- **Assessed duration** *(optional)* — leave it blank and the duration they claimed stands. Put a figure in and it replaces the claimed one in every calculation, while both stay visible on the record.
- **Reclassify** *(optional)* — moves the entry between billable and non-billable. Pick a category to push it down to non-billable, or a project to pull it up to billable.
- **Remarks** — required if you're querying, and also required if you're approving.

There are two ways out: **Approve** or **Query**.

**Things worth knowing:**

- **Querying starts a conversation.** The person sees the entry marked "Queried", they reply, and their answer comes back to you.
- **Their reply is not the end of it.** Answering moves the entry into the Answered filter but leaves it unapproved. Closing it off is still a verdict you have to give.
- **When you re-open Assess, it holds whatever duration currently stands.** So approving a queried entry keeps that figure. If you want to restore the duration they originally logged, clear the field.
- **A reclassification arrives complete.** Moving an entry down to non-billable clears its project and ticket. Moving it up lands it as a meeting, which is the one billable type that doesn't need a ticket.
- **The checkboxes let you approve several entries at once.** Select them and give one verdict for the lot.
- **The "With …" chips tell you how well an hour is backed up.** A tick means the other person logged non-billable work that day and named this person back. Plain means they logged something but named nobody. Amber means they logged nothing at all.
- **Amber is a prompt to ask, not a verdict.** They may have folded the standup into another entry, or simply not logged yet. It's deliberately not called "disputed".

### More on the amber chip

The chip reports whether the other person's timesheet agrees with this one. If Amira logs an hour of non-billable time and names Rizal in it, CapacityTrack looks at Rizal's timesheet for that same day to see whether his side matches:

- **Tick** — Rizal logged non-billable work that day *and* named Amira back. Both timesheets agree.
- **Plain** — Rizal logged something that day, but didn't name anybody. Half-confirmed.
- **Amber** — Rizal logged nothing at all that day.

Amber only means *the two records don't line up*. It does not mean somebody claimed an hour that never happened. The common explanations are innocent: Rizal folded the standup into another entry, hasn't logged that day yet, or logged it without naming anyone. That's why the tool avoids a word like "disputed" — the moment it's called that, a lead starts treating amber as a finding rather than a question, and people get accused over a colleague's admin backlog. When you see amber, go and ask — usually the person who *didn't* log, not the one who did.

---

## Step 4 — Or give a verdict on the whole week

Two buttons cover the whole week at once:

- **Query week** sends back every entry still awaiting approval, with one single reason. The person reads that reason once at the top of their week, rather than seeing it copied onto twenty separate entries.
- **Approve the week** approves the lot.

Both buttons sit on the week page, underneath the work they're a verdict on. That's on purpose — you should read the week before writing your verdict on it, not judge it from a strip of chips on the list.

**Things worth knowing:**

- **Bulk approving keeps any duration you assessed.** Both the week button and the checkboxes carry whatever figure currently stands on each entry.
- **Undo only takes back your own approval.** Reopening somebody else's approved week is the CTO's job alone, and it needs a reason.
- **A reopen goes to one person with a deadline attached** — either one day or one week — and they get a working-day grace period to hand it back.
