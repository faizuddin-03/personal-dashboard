# Flow 6 — Writing the monthly rating

**Who:** Leads and the CTO
**When:** Monthly, for your direct reports. You score from the record in front of you, then hand it to the CTO.

---

## Step 1 — Start from the ratings list

The list shows one row per person. Next to each person's rating you also get their month's capacity bar, hours, billable percentage and status.

That's deliberate. A 3.5 for a month where someone was only 48% billable and a 3.5 for a month where they were overloaded are two very different 3.5s, so the capacity sits right beside the rating and you never have to go looking for it. These are the same figures the utilisation report uses.

Each row moves through four statuses: **Not started → Draft → Handed to the CTO → Approved.**

**Things worth knowing:**

- **You can open the current month, but you can't rate it.** Three weeks of August isn't August.
- **A role with no published criteria can't be rated at all.** Those people are listed by name at the bottom of the list, so they're visibly excluded rather than quietly missing.

---

## Step 2 — Read the month week by week

The card carries the whole month on it, laid out the same way the weekly review screen is. For each week you get:

- a thick bar for the week and thin bars for each day
- their wrap-up and their weekly pulse answers
- the blockers they raised
- what the week's hours actually went on
- any night work
- your own week remarks, any entries you queried along with the exchange, and any hours you cut

The reason it's all on the card is that scoring from memory is what makes a rubric drift over time. The record goes in front of you rather than sitting one tab away.

**Things worth knowing:**

- **"What the week went on" isn't just tickets.** It groups non-billable work by category too, and shows what they submitted next to what was finally counted, so a cut is visible in the place it happened.
- **Durations are shown the way they were typed** — "1h 40m", not "1.7h".
- **The week bar and the day bars answer different questions.** Four solid days and a blank Friday still averages out to a perfectly healthy-looking week, so check the day bars before you trust the week bar.

---

## Step 3 — Check what the hours actually went on

Every week panel carries the work behind its total: one row per ticket, and one row per non-billable category. Each row shows what they submitted alongside what was actually counted.

Where you cut an entry, their claim is struck through with your assessed figure next to it. So a month's worth of corrections is readable in the week it happened, rather than being collected into a separate list somewhere else.

Non-billable rows are included here too. A table that only showed tickets would miss roughly a third of the cuts.

**Things worth knowing:**

- **Ticket references link straight through to Jira,** and each one shows the status the ticket is in right now.
- **The table pages inside its own frame,** so paging through one week's panel doesn't collapse the other weeks you've already opened.

---

## Step 4 — Score each criterion against its wording

Each criterion has five levels, and each level has a written description of what it looks like in that person's role. **You are picking the description, not the number** — the number follows from whichever description matches.

If a criterion genuinely didn't apply that month, mark it **N/A**. It gets left out of the average rather than counted as a zero.

A score of 1, 2 or 5 asks you for a sentence explaining why.

**Things worth knowing:**

- **The rubric is versioned per job title,** and a card keeps whichever revision was live when it was opened. Changing the rubric later doesn't move an old card.
- **An average built from very few criteria is only indicative,** and the card says so rather than presenting it as a firm verdict.

---

## Step 5 — Write the summary and hand it in

The summary is required.

Below it sit the three logged tables — production crises, systems rebuilt, and conduct and professionalism. You read these; the CTO writes them. They're placed above the buttons on purpose, because a table sitting below the approve button is a table nobody reads before approving.

Then choose **Save draft** or **Hand in to the CTO**.

**Things worth knowing:**

- **Handing in is one-way.** There's no send-back. From that point it's the CTO's to adjust and approve.
- **The person being rated sees nothing until the CTO approves it.**
- **A card you open for somebody else is still theirs.** It stays filed under that person's own manager, so it remains on that lead's list rather than moving onto yours.

---
---

# Reference — What a merit or demerit is worth

**Applies to:** Everyone. The prices are the same for all roles.

The 1–5 criteria measure **how** the work was done. These three tables measure **what it did** — what broke, who somebody was to work with, and what they built that the rest of the organisation picked up.

All three are the CTO's to record and to price. They only apply to the month they happened in, and a row that hasn't been graded is worth nothing either way.

## These are the prices, not examples

- **The CTO's judgement is which line applies** — how severe an outage was, which conduct reason fits, whether a rebuild was done solo and how far it reached. There is no field to type in an arbitrary number, and a grade outside these lists is rejected. That way the same event costs the same no matter who it happened to.
- **Recording a row and pricing it are two separate steps.** Until the CTO grades it, a row counts for nothing in either direction.
- **Anything the conduct list hasn't accounted for yet is priced through its "Other" range,** so an unusual case still lands on one of three known costs rather than a made-up one.
- **Moving a criterion score is a separate lever.** That stays on the 1–5 ladder with a written reason beside it, and doesn't belong in these tables.

## Production crises — comes off the rating

What an incident in production costs the month's rating.

The severity is the CTO's call. The lead writes down what happened, because they were there. What it cost is a judgement about impact across the whole organisation, which is why it isn't the lead's to decide.

| Severity | What it means | Effect |
|---|---|---|
| Minor | Caught internally, no user impact | −0.25 |
| Moderate | Users affected briefly, nothing lost | −0.50 |
| Major | Outage, data loss, or customers out of pocket | −1.00 |
| Critical | Prolonged outage or unrecoverable loss | −2.00 |

Each step doubles, and a band is one point wide. So a major incident moves a rating down a full band, and a critical one moves it down two. The effect of that is one contained slip doesn't wipe out an otherwise good month, and two serious outages don't survive one.

## Conduct and professionalism — comes off the rating

These are named reasons with fixed costs, rather than a severity ladder you judge each time.

Each kind of event has a settled price. The reason for fixing them is that asking somebody to invent a number every month is how two people doing exactly the same thing end up rated differently.

| Reason | What it means | Effect |
|---|---|---|
| Passive at capacity | Had room and didn't say so | −0.25 |
| Missed AI session | Didn't **present or share** at the Friday AI session. Attending is not contributing | −0.25 |
| Slow / over-buffered | Slow, or padded the estimate well past the work | −0.25 |
| Negativity on assignment | Negativity when work was assigned | −0.50 |
| Unresponsive | Didn't respond to the CTO | −0.50 |
| Attitude | Complaints from more than one person | −0.50 |
| Not aligned | Working against the company's direction | −0.50 |
| Wrong environment | Deployed to the wrong environment | −1.00 |
| On-call no-show | On call, and didn't handle the crisis | −1.00 |
| Other — minor | A one-off that blocked nobody | −0.25 |
| Other — moderate | A pattern, or somebody held up | −0.50 |
| Other — major | Delivery or trust damaged | −1.00 |

One point is the most any single conduct entry can cost — half of what a crisis can cost. The reasoning is that an outage is a fact, whereas a conduct judgement is one person's reading of another, and that shouldn't move a rating down two bands on its own. Several conduct entries in the same month still stack, though.

## Systems rebuilt and rolled out — adds to the rating

What it's worth when you build something the rest of the organisation adopts.

There are two things that matter, and each one doubles the value:

- **Solo or with a team.** Solo counts double, because on a team of four the same headline can hide a fairly small contribution.
- **Local or org-wide.** Org-wide counts double, because the whole point is what lifts other people.

| How it was built, and how far it reached | What that means | Effect |
|---|---|---|
| Team, local | With a team — used by their own team | +0.25 |
| Solo, local | Solo — used by their own team | +0.50 |
| Team, org-wide | With a team — now standard across IT or the group | +0.50 |
| Solo, org-wide | Solo — now standard across IT or the group | +1.00 |

**It's gated and capped.** Merit only counts if the scored criteria alone came to 3.0 or better. Below that, the day job is slipping, and a rebuild doesn't buy it back. The most merit anyone can earn is 1.0 in a month, however many things they shipped, and a rating still stops at 5.

**The work you were assigned comes first.** Merit is for a rebuild that was yours to build, or one that cost your project nothing. If you drop the task you were given to go and build something else, there's no merit in it — however much the organisation gains from it afterwards. And where building these systems *is* your assignment, it's simply the day job, and it counts as the day job.

## Still not sure?

Whether a particular hour is billable is a different question from how to log it, and it has its own page — see **Guidelines — What counts as billable**.
