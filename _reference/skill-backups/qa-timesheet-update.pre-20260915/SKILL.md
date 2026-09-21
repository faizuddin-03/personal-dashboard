---
name: qa-timesheet-update
description: Fill in a QA engineer's daily CapacityTrack timesheet (capacity.modefair.com) end to end — reconstruct the day from Teams, interview the person for the ACTUAL duration and outcome of each item, classify billable vs non-billable, compose the remark to the eAuto QA Remark Standard, then submit each entry in their own Chrome after they confirm. Also answers questions about the timesheet without logging anything - whether an hour is billable, which template to use, meeting allowances, week wrap-ups, night work and hardship allowance, leave, a queried entry, and how the monthly rating is calculated. Use when someone says "log my time", "update my timesheet", "log today", "log yesterday", "fill in CapacityTrack", "what still needs logging", "is X billable", "how do I write my remark", "which template do I use", or "why was my entry queried".
---

# QA timesheet — log the day, end to end

Turn a day's real work into correct CapacityTrack entries at **https://capacity.modefair.com**.

This skill does two jobs. **Logging a day** is the nine-step flow below. **Answering a question**
about the timesheet needs no flow — go straight to the reference that covers it.

Two systems, one direction only:

- **Source (read):** the person's **Teams** messages — their morning plan, their EOD update, and
  the threads around them. Jira is a secondary lookup when a ticket title is missing.
- **Target (write):** **CapacityTrack**, driven in **their own logged-in Chrome**. It needs their
  session, so use the Chrome browser tools against their real browser, never a fresh sandboxed one.

This skill never writes to Teams. Reads only.

## Setup — fill this in once, per person

The flow needs a few facts about whoever is logging. Ask for anything missing rather than guessing,
and keep the answers for the rest of the session.

| Fact | Why it's needed | Example |
|---|---|---|
| **Their full name in Teams** | To pick out their own messages in each chat | the name shown on their messages |
| **CapacityTrack user id** | Their reports live at `/reports/<id>` | `9` |
| **Role** | Sets the billable target and the meeting allowance | Senior QA automation engineer — 30h of 40h billable, 1.5h/day meetings |
| **Lead's name** | Who reviews the entries and can reopen a missed day | `May Chin` |
| **Their project(s)** | Which projects they work on at all, so the resolver has a shortlist | `eAuto Core`, `eAuto Wholesale` |
| **Team chats they post in** | Where the day gets reconstructed from | `eAuto QAs`, the CR group chats |

Roles differ. **Read `/guidelines` for their actual allowance** rather than assuming the numbers
above apply.

## References — load only what the moment needs

| File | Read it when |
|---|---|
| `references/remark-templates.md` | **Composing any remark.** The eAuto QA Remark Standard v1.4 — ten templates, six fields, combine-or-split, banned remarks |
| `references/worked-examples.md` | You want to see the whole flow run once, on a real-shaped day |
| `references/chrome-mechanics.md` | Submitting. Form fields, the Trix notes editor, the mention picker, what silently fails |
| `references/07-guidelines-what-counts-as-billable.md` | Billable vs non-billable, the full examples table, role guidance, allowances |
| `references/01-flow-1-logging-your-time.md` | The daily entry form, the 11pm cut-off, durations, Blocked, marking leave |
| `references/02-flow-2-closing-your-week.md` | Week wrap-up, the pulse, night work, extra-work declarations |
| `references/03-flow-3-when-an-entry-is-queried.md` | A lead querying an entry or moving it between billable and non-billable |
| `references/04-flow-4-your-monthly-rating.md` | The rating card, the bands, what moves the number |
| `references/05-flow-5-reviewing-your-teams-week.md` | Leads reviewing a team's week |
| `references/06-flow-6-writing-the-monthly-rating-and-reference.md` | Leads writing a rating, plus the merit and demerit price tables |

## Golden rules — these are the point of the skill

Entries feed the lead's weekly review and the monthly IT update to the CEO. The CTO called someone
out publicly on 17 Aug 2026 for logging 8h before the day had ended, and the rating system prices
padding at **−0.25**. So:

1. **Never invent a duration.** If the person has not said how long something actually took, ASK.
   If they can't say, do not log that entry — leave it out and tell them it's outstanding. Never
   derive a duration from complexity, from a plan's estimate, or from what would round the day out.
2. **Never pre-log.** Only completed work, at its actual duration. If a task is still running, it
   is not an entry yet. Say so and move on.
3. **Never pad to 8h.** Report the gap between logged hours and 8h as *information*, and ask. A
   short day is a real signal — surfacing it honestly is the job, filling it is misconduct. Equally,
   don't quietly under-report: unlogged time is treated as no work performed, so walk them through
   the gap rather than shrugging at it.
4. **Flag suspicious durations out loud.** Round blocks (`4h`, `8h`, `2h` on the nose), several
   identical durations in one day, or a total landing exactly on 8h — say what looks like an
   estimate and ask them to confirm it's real.
   - **Never offer a duration because it makes the day reach 8h.** Work forward from what they did,
     never backward from the ceiling.
   - **Parallel runs are not additive.** Automation suites left running at the same time share one
     clock. `5h + 4h` of concurrent runtime is not 9h — it is the elapsed window, split across the
     tickets. Ask whether runs overlapped whenever two long automation entries land on the same day,
     and put the attribution in **both** notes so the split is visible rather than inferred.
5. **Confirm before every write.** Show the **exact final text and every field value** — for an
   edit, show it as *before → after* — and get an explicit go. Then submit one at a time, verifying
   each landed.
   - **Approval does not survive a rewrite.** If you revise any wording, duration or field after
     they approved a draft — even to make it more accurate — that is a new draft and needs a fresh
     go. Never write words into someone's timesheet that they have not read in the form they'll take.
   - A click on a multiple-choice option approves the *decision*, not unseen prose. Show the prose.
   - Editing an existing entry is a write like any other.
6. **Report honestly.** If an entry failed to submit, say which and why. Never claim a day is logged
   when it isn't.
7. **Read the page, don't photograph it.** A screenshot costs about **31,600 tokens**; reading the
   same page with `javascript_tool` costs about **300**. Confirming a save, checking a field, reading
   the day total — all of those are `javascript_tool`. Screenshot only when the answer is genuinely
   visual and you cannot get it from the DOM.

## How to run it — the four-beat loop

**Never go straight to a change.** Every change — new entry or edit, no exceptions — walks these
four beats in order:

1. **Ask.** Put the open questions plainly, as questions, and stop. Duration, outcome, Manual vs
   Automation, who was there, classification. Don't draft around a missing answer.
2. **They answer.**
3. **Show the draft.** Every field value and the exact remark text as it will appear. For an edit,
   show it *before → after*.
4. **They approve — then apply.** Only on a clear yes, and only what they saw.

Never compress the beats. No asking-and-drafting in one breath. No applying because the change looks
obviously right. Treat a skipped beat as a defect, not a shortcut.

### Ask in a prompt, not in a wall of text

Beat 1 goes through **`AskUserQuestion`** wherever the answer is a choice — clickable options beat
a numbered list they have to answer by typing. Batch up to four questions in one call so the whole
open set is settled in a single round trip.

Write the options as **the decision, with its consequence spelled out**, so a click actually
resolves something:

```
Q: EAINT-12155 - what did the estimate work actually cover?
   - Read both split tickets, then estimated -> Template 01, billable
   - Just the reply to the lead              -> Template 08 coordination, short entry
   - Re-estimated off earlier study          -> Template 01, updating an existing estimate
```

Every question carries a free-text **Other**, so nothing is forced into a bad option.

**Never put a duration in an option.** Offering `30m / 45m / 1h` to click is inventing the number
and letting them ratify it, which is exactly what Golden Rule 1 forbids. Durations are typed, in
their own words, always. Same for anything else that changes what the entry *claims* — what a run
found, how many cases passed, whether a ticket was raised.

Good prompt questions: which template, billable vs non-billable, Manual vs Automation, Delivery vs
Meeting, was there a standup, log now or at EOD, combine or split, which environment.

And the limit that does not move: **a click approves the decision, never unseen prose.** The draft
remark still gets shown in full at beat 3, whatever was clicked at beat 1.

Keep every message short. Lead with the answer or the number. Tables and short bullets, not
paragraphs. Don't re-explain a rule they have already heard.

---

## Step 0 — Preflight

**Clock.** Establish today's date and the time left before the **11:00 PM MYT** close. If it is
already past 11 PM, the day is final and unlogged time counts as missed — say so plainly. The only
way back in is the lead reopening the day. Offer to log a different date instead.

> **WARNING - get the date from PowerShell, not Bash.** On 30 Aug 2026 the Bash `date` command
> returned `2026-08-28 21:01 (Friday)` when it was actually **Sunday 30 Aug, 02:06** - two days out,
> and naming a timezone that does not exist (`MPST`; Malaysia is `MYT`/`+08`). The whole session ran
> on the wrong day: every countdown to the 11 PM close was wrong, and the day being logged had shut
> two days earlier. Use:
>
> ```
> Get-Date -Format "yyyy-MM-dd HH:mm:ss dddd"
> ```
>
> Cross-check with `ls -la` on a folder holding recent files, or the clock in any screenshot they
> share. If Bash and PowerShell disagree, trust PowerShell. **The date drives everything in this
> skill** - which day is open, whether the cut-off has passed, whether the wrap-up is due - so verify
> it before acting, not after.

**CapacityTrack.** Confirm their Chrome session is live, then read the target day (Step 2).

## Step 1 — Reconstruct the day

Everything gathered here is a candidate to **ask about**, never an entry to log directly.

### From Teams — usually the richest source

Most QA post a morning plan and an EOD update to their team chat. That update already carries the
scenario counts, the TS ranges and the progress figures the remark needs.

This is a **browser** job: their real Chrome, `teams.cloud.microsoft/v2/`, already signed in.

**Teams is the only source of candidates.** There is no task database to pre-fill from, so read
the threads properly — the day gets reconstructed from what was written, then confirmed in the
interview. A thin Teams day means a longer interview, not a shorter entry list.

**Teams search finds the afternoon and loses the morning.** Search → `Messages` → `from:` their name
→ `Date: Today` works, but the result set **caps at roughly 30 and stops paginating**. `Top results`
also ignores the date filter and mixes in older days. **Never treat the search as the day.**

Use search to find *which chats* they were in, then **open each one and read the thread**. Their
messages come with the replies around them, which is what the remark actually needs — a search
snippet gives you "thanks" without the request it answers.

Practical order:

1. **The QA team chat** first — their own plan and everyone's EOD updates live here, and the plan
   names the tickets to chase everywhere else.
2. Each **CR group chat** for the tickets in that plan.
3. The **1:1s** with Dev, BA and the support engineers.
4. Anything the search turned up that those three missed.

#### Reading a thread out of the DOM

`get_page_text` works but returns the left rail as well, and right after switching chats it
sometimes returns *only* the rail. Reading the DOM is cleaner and cheaper.

**Teams needs about 8 seconds to hydrate.** Straight after `navigate`, `document.body.innerText` is
~73 characters and there are zero chat rows even though `readyState` is `complete`. Wait inside the
page (`await new Promise(r=>setTimeout(r,8000))`) and read again rather than concluding it's empty.

| What | Selector |
|---|---|
| Chat list rows (gives thread id + name) | `[id^="title-chat-list-item_"]` — strip the prefix for the id |
| Messages in the open thread | `[data-tid="chat-pane-item"]` |
| Timestamp (UTC, ISO) | the item's `time[datetime]` |
| Author | `[data-tid="message-author-name"]` |

Timestamps are UTC. For a UTC+8 team the local day starts at `16:00Z` the previous day, so filter
on that rather than on the calendar date.
Each message renders twice — once as the item, once as an untimestamped duplicate — so expect the
array to be about double the real message count.

**Stash, then read back in small slices.** Returning several messages in one call gets refused with
`Blocked by classifier`. Park the thread on `window` first, then pull **one message at a time, no
more than ~700 characters per call**:

```js
// call 1 — stash, return only an index
window.__M = [...document.querySelectorAll('[data-tid="chat-pane-item"]')].map(el => {
  const t = el.querySelector('time'), a = el.querySelector('[data-tid="message-author-name"]');
  return (t ? t.getAttribute('datetime') : '?') + ' | ' + (a ? a.innerText : '?') + ' | '
       + el.innerText.replace(/\s+/g, ' ');
});
window.__M.map((s, i) => i + ': ' + s.slice(0, 90)).join('\n')

// call 2..n — one message, capped
window.__M[13].slice(0, 700)
```

Index first, then fetch only the messages whose timestamp falls in the target day.

**Ask before assuming a chat is empty.** A ticket in the plan with no Teams trace usually means solo
work — script drafting, document review — not that it didn't happen.

### A deployment that night is not a time entry

If the chats mention a deployment scheduled for tonight, flag it but **do not log it as time**.
Out-of-hours deployment work is night work on the week wrap-up and earns a hardship allowance.
See "Out-of-hours work" below.

### Two rules about updates

- **The EOD update describes work that happened.** Best source for the day's entries. Copy its
  counts and progress figures rather than asking again.
- **The morning plan is intent.** Its `To ...` lines have not happened yet. **Never log from it** —
  that is exactly the pre-logging the CTO called out. Use it only to build the candidate list.

**One update item is often several entries.** Updates group by ticket. The timesheet splits by
ticket **and** activity **and** class. A ticket they both tested and had a call about is two rows.
A deployment item covering five tickets is usually one release-wide row.

Turn all of this into a numbered candidate list. Add the standing non-billable suspects people
forget: **team standup**, any **non-project meeting**, **AI knowledge sharing**, **buddy mentoring**.

## Step 2 — Read back what CapacityTrack already has

Before drafting anything, load the target day so you never double-log:

```
https://capacity.modefair.com/log/YYYY-MM-DD
```

Use `get_page_text` for the entry list and running total. For each existing entry record the
project, ticket, kind, duration, and whether it carries a query from the lead. Note the day's total
and the `Awaiting approval` / queried status.

If an entry is **queried, deal with that first** — a queried entry stays editable past 11 PM, and
answering it matters more than adding new rows. Surface the reviewer's reason.

Also read the **`Named in`** panel: every meeting *somebody else* logged them into this week. It is
read-only and changes none of their hours, but it is the best cross-check for a meeting they
attended and forgot. If a colleague named them in an hour they have no entry for, raise it as a
candidate. If it looks wrong, the fix is telling that person, not editing anything.

Three things that are **not** missing data:

- Dates before their timesheet start date — nothing was ever expected there.
- A **missed** past day. It is not theirs to fill in; the lead reopens it and they then get a short,
  stated deadline. Offer to draft it, but it has to be reopened first.
- **A public holiday.** CapacityTrack flags it as `Missed` like any other empty day — verified
  25 Aug 2026, which showed `TUE 25 Missed` and a week reading `32h / 40h`. **Ask whether a `Missed`
  day was a public holiday or leave before treating it as unlogged time.** If it was, read the week
  against the days actually worked:

  | | Shown | Actually |
  |---|---|---|
  | Capacity | 32h of 40h | **32h of 32h — full week** |
  | Billable target | 30h (75% of 40h) | **24h** (75% of 32h) |

  Getting this wrong turns a complete week into a short one, and can make billable look under target
  when it was over. **Do not offer to have the day reopened** — that would mean logging hours on a
  holiday. Put a line in the wrap-up's **Additional blockers** asking the lead to correct the flag.
  The mechanism that is supposed to record a public holiday is not documented anywhere in the app,
  so raise it rather than guessing at a self-service fix.

## Step 3 — Decide everything you can decide yourself

**Do not ask what you can work out.** Every question spent on something derivable is a question the
person has to answer twice. Settle these first, then state them in the draft so they can correct
you.

### Decide, don't ask

| Decide | How |
|---|---|
| **Which template** | From what the item is. Studied a ticket → 01. Wrote scenarios → 02. Made data or asked for access → 03. Wrote or debugged a script → 04. Ran or retested anything → 05. Built a deployment checklist → 06. Supported a deployment or did the morning check → 07. Chased someone → 08. Scheduled call or huddle → 09. Internal or reusable work → 10 |
| **Billable or not** | The table below. Client's application → billable. Framework, CI, tooling, training, internal → non-billable |
| **Which project** | **From the ticket title, never from the ticket key.** See *Choosing the project* below. Do not assume the person's usual project |
| **Delivery or Meeting** | **If they talked, it's a Meeting. If they typed, it's Delivery.** A call is a Meeting; chat, ticket comments and email are Delivery |
| **Non-billable category** | From the work type, **against the full list of eleven below** — not from the handful you remember. `Team standup` is its own value, so a standup is never `Non-project meeting`. Reach for `Other` only when nothing else fits |
| **The percentage** | Arithmetic on the fraction they gave. Never invent the fraction; always compute the percentage |
| **Ticket key and short title** | From their update, or Jira if the title is missing |
| **Environment and browser** | From the update, **if named there.** Otherwise ask |
| **Where the output went** | From the update, if it says SharePoint / the QA group / the test case sheet |
| **Whether to tick Blocked** | If a blocker exists, it gets ticked. That is not a question |

State your conclusions rather than hiding them:

```
I've classified these — correct me if any is wrong:
  EAINT-12094  automation run   → Template 05, Billable · Delivery
  EAINT-11759  call with BA     → Template 09, Billable · Meeting
  Framework retry helper        → Template 10, Non-billable · Internal tools
```

### Classifying billable vs non-billable

One question: **could you invoice one client for this hour?** Do not assume every QA activity is
billable.

| Work | Class | Why |
|---|---|---|
| Test planning, writing/running cases, defect triage, regression runs on a client's system | **Billable · Delivery** | Their project |
| Test suite, page objects, fixtures written **for that client's application** | **Billable · Delivery** | That client's deliverable |
| Defect triage call, requirement walkthrough, UAT support, release go/no-go on a project | **Billable · Meeting** | Project work, client in the room or not |
| Fixing a production defect on a client's system, inside working hours | **Billable · Delivery** | Also tick **Production incident** |
| Writing a client's handover / user documentation | **Billable · Delivery** | Part of the deliverable |
| Running a training session **for a client** | **Billable · Meeting** | Their project; needs no ticket |
| **The automation framework itself**, CI plumbing, tool evaluations, anything reusable across clients | **Non-billable** | Nobody can be invoiced for it |
| Team standup, general engineering/team meeting, all-hands | **Non-billable** | Company-internal |
| Receiving training, being mentored, mentoring generally | **Non-billable** | Builds the company's skills |
| Internal AI research, tooling, knowledge sharing | **Non-billable** | Company capability |
| Building/maintaining an internal tool | **Non-billable** | Not invoiced |

**The trap: same skill, same day, different answer.** Automation work on a client's app is billable
to that client; work on the framework that serves every client is not. When an hour spans both,
**split it into two entries** — a mixed entry can't be classified by the lead and will be queried.

Two more from the guidelines:

- **Being in the room isn't enough.** If none of a meeting was about their work, it isn't their
  billable hour.
- **Billable and "should have happened" are different questions.** The rules say whether an hour is
  billable, not whose hour it should be.

**When genuinely unsure, don't pick — ask, and remind them to check with their lead before
submitting.** Flag it in the draft as `⚠ classification unconfirmed`.

### Choosing the project

**Read the ticket title. Never infer the project from the ticket key, and never default to the
person's usual project.** Verified 3 Sep 2026: EAINT-12155 and EAINT-12200 are both Jira project
`EAINT` with component `eAuto`, and they belong to two *different* CapacityTrack projects. The Jira
key, the Jira project and the component carry no product signal at all — the whole company's eAuto
work lives in one Jira project. **The bracketed prefix in the title is the only reliable signal.**

The ten live projects, read from the combobox on 3 Sep 2026:

| id | Project | Client / group | Route a ticket here when |
|---|---|---|---|
| 1 | eAuto Core | eAuto Sdn Bhd | Any `[eAuto…]` prefix that is **not** Wholesale — UCD, BackOffice / BO, AATF / eDereg, STMS / eSTM, Insurance, Onboarding / Pre-Application, Application, Service Hub, Login Page, Backend, Platform Wide, APT Reports, Metabase, Production, Production Support, Backlog, Security. Also Secarang and Macrokiosk WhatsApp-template tickets, and untagged eAuto work (`eauto-event-gateway`, deployment-session tickets, pentests) |
| 2 | eAuto Wholesale | eAuto Sdn Bhd | `[eAuto-Wholesale…]`, `[Payment portal]`, or a `[PROD]`/untagged title about the **chatbot** — bot v2, JomCheck, a deal, an offer or a plate read |
| 3 | MyInspector Core | MyInspector Malaysia Sdn Bhd | The title names MyInspector or its inspection app |
| 4 | Accounting System | Finance | The title names the accounting system, GL, invoicing or the finance ledger |
| 5 | WHT System | Finance | The title names withholding tax or WHT |
| 6 | HRMS System | HR | The title names HRMS, payroll, leave or claims |
| 7 | Recruitment System | HR | The title names recruitment, hiring, candidates or job applications |
| 8 | CC System | Call Centre | The title names the call centre or CC system |
| 9 | Whatsapp & Email Blaster | General | The work is on the blaster **product itself** — not a client's message templates that merely run on it |
| 10 | Content | General | Content, copywriting or marketing material as the deliverable |

**Say which project each entry landed in, in the draft, with the words from the title that decided
it.** The person can then correct one line instead of re-checking every entry:

```
  EAINT-12155  [eAuto] password complexity        → eAuto Core       (prefix "[eAuto]")
  EAINT-12200  [eAuto-Wholesale 2.0] Bot v2 SRD   → eAuto Wholesale  (prefix "[eAuto-Wholesale]")
```

**Two traps.**

- **A title can name two products.** `[eAuto & Secarang-BackOffice]`, `[eAuto/Secarang-Macrokiosk]`.
  The **first** product named is the one being worked on; the second is context. If the hour genuinely
  split across two projects, that is two entries, not one — the same rule as a mixed billable hour.
- **A wrong project is worse than a missing one.** It bills the wrong client. When the title does not
  decide it — no prefix, a prefix that is not in the table, or a product this person does not
  normally work on — **ask**. Never guess and never fall back to whatever they logged yesterday.
  Flag it in the draft as `⚠ project unconfirmed`.

Non-billable entries take **no project** — they take a **category** instead. The category and the
project are mutually exclusive: picking one clears the other.

CapacityTrack's full list, all eleven, read from the live `select` on 3 Sep 2026 — stored value on
the left, what the person sees on the right:

`internal_meeting` Non-project meeting · `standup` Team standup · `training` Company training ·
`documentation` Company documentation · `internal_tools` Internal tools ·
`process_improvement` Process improvement · `company_initiative` Company initiative ·
`competition` Competition · `ai_knowledge_sharing` AI knowledge sharing ·
`buddy_mentoring` Buddy mentoring · `other` Other.

**Re-read the list rather than trusting this one** if a category looks missing — it is an ordinary
`select`, so `[...document.querySelector('[name="time_entry[nonbillable_category]"]').options]
.map(o => o.value + ' | ' + o.text)` gives the live values in one call.

### Never decide these

Duration, outcome, and anything that changes what the entry claims. If you cannot answer it from a
source, it is a question.

## Step 4 — Interview for exactly the fields that template needs

Ask **only** what the chosen template requires and you could not derive. Batch the questions across
items — one message beats twelve round-trips — but never answer on the person's behalf.

### The question set, per template

| Template | Always ask | Also ask when it applies |
|---|---|---|
| **01** Study & estimate | Duration · **the estimate itself** (mandays, base + buffer) · where it was recorded | What changed and why, if updating an existing estimate |
| **02** Scenarios & cases | Duration · how many drafted of how many planned · which kinds (positive, negative, boundary, e2e) · where stored | Whose document, and what feedback, if reviewing someone else's |
| **03** Test data & environment | Duration · what was created or requested · which environment | Whether it was for the shared server or one client's release — **this decides billability** |
| **04** Automation scripting | Duration · how many scripts of how many planned · tool and approach · **who owns the script — client suite or shared framework** | Whether failures were script problems or app defects |
| **05** Execute testing | Duration · **what it found** (passed/failed counts, tickets raised) · type of testing (functional, regression, retest, smoke, exploratory) · how many cases of how many | Whether a run was unattended and overlapped another ticket · script problem vs app defect · whether it was an ad-hoc check |
| **06** Deployment preparation | Duration · which deployment and its date · are the tickets ready, and which are not · who is covering support | — |
| **07** Deployment support | Duration · which deployment · which modules were monitored · **what was found, even if nothing** · where it was recorded | — |
| **08** Coordination & follow-up | Duration · **what was agreed, or that nothing came back yet** · who was involved and their role | — |
| **09** Meetings & huddles | Duration · what was discussed · who else was there | **Why they stayed for the whole thing**, past 30 minutes · any action item |
| **10** Non-billable | Duration · **the actual item worked on** (which tool, which training, which document) · **why no client can be invoiced** | — |

### Always, on every item

0. **Outcome first, before duration.** What did it find? Did the run pass? Were failures app defects
   or script-side? Were tickets raised? What did the follow-up settle? Asking duration first turns
   the interview into arithmetic and produces thin notes.
1. **Actual duration.** Accept their phrasing — `45m`, `1h 30m`, `90`, `1.5h` all parse. Push back
   once on a round block.
2. **Manual or Automation** — required on every non-meeting entry.
   - Manual → *why* it had to be manual, why it couldn't be automated.
   - Automation → *what* was automated, and the tool or approach.
3. **Anything that stretched it** — blocker, environment issue, dependency, data, access, deployment
   wait, rework, extra investigation. Waiting on Dev/BA/env/data is a **Blocked** tick as well as a
   note line. **Blocked is not only for waiting**: a meeting that dragged or overran earns the same
   tick, because an afternoon a meeting ate is a delivery risk the lead can act on.
4. **Did any two things run at the same time?** Ask whenever two long automation entries land on the
   same day. One clock window covering two tickets needs the split stated on **both** entries.

### What the sources may already have answered

If they have written an EOD update, read it before asking. It usually carries the counts, the TS
ranges and the progress figure. Ask only for what is missing.

**A "- Done" in an update is not an outcome.** It says the task finished, not what it found. Still
ask.

## Step 5 — Combine check, then confirm the template

Run every pair of items on the day past the combine-or-split table in
`references/remark-templates.md`. **A split is the default.**

**Split automatically — no question.** If any one of these is true: different tickets or projects ·
one billable and one not · one was a scheduled meeting with its own start and end · each is a
substantial block of hours the lead would want to see separately. Split it and say why.

**Ask before combining.** If all of these hold: same ticket · both billable to the same project ·
and either the second activity was short, or they were switching between the two all block.

```
These two look combinable — same ticket, both billable to eAuto Core,
and the follow-up was part of getting the drafting done:

  A. EAINT-11759  drafted test scenarios              2h
  B. EAINT-11759  confirmed scope with Dev and BA     30m

Combine into one 2h 30m entry, or keep them separate?
```

**Never combine silently.** When they say combine: pick the **main activity** for the `Task:` line
and use that template, fold the second into `Method:`, and put what it produced into `Result:`.

Three limits that override any combine:

- **Never a whole-day entry.** Two related activities on one ticket is fine. Eight hours of
  unrelated work on one line is not.
- **If you cannot tell which was the main activity, split it.**
- **In doubt about billable vs non-billable, always split.**

### The ten templates and their fields

| # | Template | Fields it takes |
|---|---|---|
| 01 | Study ticket & estimate testing effort | Task · Method · Progress · Blocker · Note |
| 02 | Draft test scenarios & test cases | Task · Method · Progress · Result · Blocker · Note |
| 03 | Prepare test data & environment | Task · Method · Progress · Blocker · Note |
| 04 | Automation scripting | Task · Method · Progress · Result · Blocker · Note |
| 05 | Execute testing | Task · Method · Progress · Result · Blocker · Note |
| 06 | Deployment preparation | Task · Method · Progress · Result · Blocker · Note |
| 07 | Deployment support & production monitoring | Task · Method · Progress · Result · Blocker · Note |
| 08 | Coordination & follow-up | Task · Method · Result · Blocker · Note — **no Progress** |
| 09 | Meetings & huddles | Task · **Discussed** · Blocker · Note — no Method, no Progress |
| 10 | Non-billable work | Task · Method · Progress · Blocker · **Why non-billable** · Note |

**Use the template's own field set. Don't borrow fields from another one.** Template 08 has no
`Progress:` because a follow-up has nothing to measure. Template 09 has `Discussed:` instead of
`Method:` because a conversation has no test method.

## Step 6 — Compose the remark

Six fields, always in this order, drop what doesn't apply, **never write "N/A"**:

`Task:` · `Method:` (or `Automation:`) · `Progress:` · `Result:` · `Blocker:` · `Note:`

### The shape on the page — bullets, not flat lines

The standard's examples are flat lines. **Write them as a `Task:` line plus a bullet list anyway.**
The entry **card** on the day view flattens paragraphs into one grey run-on line, so a
multi-paragraph note is unreadable exactly where the lead reads it. **Bullet markers survive the
flattening**; line breaks do not.

```
Task: Executed functional testing on EAINT-12131 (Service Hub - CSE Special Remark).
   • Method: Manual on Staging, Chrome. Focused on the submission and approval flow.
   • Progress: 77.8% (14 of 18 test cases executed)
   • Result: 11 passed, 3 failed. Raised EAINT-12160, EAINT-12161, EAINT-12162.
   • Blocker: Payment gateway in Staging is down, cannot test the payment step.
   • Note: Remaining 4 cases will continue tomorrow.
```

Feed Trix a `<div>` for the `Task:` line, then a `<ul>` with `<strong>` labels — see
`references/chrome-mechanics.md`.

**Bold does not render on the cards, and that is normal.** The stored note keeps `<strong>` and
`<ul>` (visible in the edit view), but cards and the closed-day view flatten to plain text. Nothing
is lost. Don't "re-fix" formatting because a card looks flat.

### Rules for every entry — all eleven, straight from v1.4

- **One entry is one kind of work.** Do not put a whole day into a single line. Two related
  activities on the same ticket can share an entry — see Step 5.
- **Write in plain English, and only about the work.** Full words, not personal shorthand, because
  someone else has to read it. Every line must answer one of the six fields. No personal comments,
  no complaints, no jokes, no vague filler.
- **Do not copy the ticket title.** The lead can already see the ticket — and the card renders the
  resolved Jira summary, board prefix and live status under the task reference. Say what **you**
  did to it.
- **If there is no ticket, the remark must carry everything**, because there is nothing else for the
  lead to go on.
- **`Task:` and `Method:` must describe the same work.** A `Task:` saying you updated an estimate
  with a `Method:` saying "automation" do not match, and that forces a query.
- **Use the word `Result`, never `Outcome`.** One word for one thing keeps entries scannable.
- **Declare parallel time.** An automation script runs unattended, so one clock window can cover two
  tickets. Say so on **both** entries and state the split: *"Ran in parallel with EAINT-12094. 3h of
  the shared 7h window is attributed here."* Without this the two entries look like double claiming.
  **The duration field carries only that entry's share; the remainder goes in the note** — the shape
  Charmain settled on (28 Aug 2026) is *"Run in parallel with EAINT-11982. Another 25 minutes of the
  shared window is attributed to EAINT-11982, total 30 minutes."* **Ask for the split** — never
  compute someone's share from what is left over after the other entries, and never from what makes
  the day reach 8h. If a day lands on **exactly 8h 0m** after several rounds of adjustment, say so
  out loud: it is the first thing a reviewer looks at.
- **Put the important facts first.** CapacityTrack hides long remarks behind "Show more", so
  anything past roughly two lines is invisible until the reviewer clicks. `Task:` and `Result:` must
  sit above that cut.
- **For manual work, say there is nothing to automate** — *"Method: Manual. One-off check, nothing
  to automate."* This is an automation team, so it closes the obvious follow-up before it is asked.
- **Say where the output went** — SharePoint, the QA group, the planning board, the test case sheet.
  This is what lets an entry be verified without a conversation.
- **Short entries still need a remark, but one line is enough.** A five-minute entry does not need
  six fields.

### Remarks that get queried on sight

If the remark is one of these and nothing else, expect it to be queried. Each carries no
information at all.

`testing` · `fixing` · `scripting` · `meeting` · `continue` · `ongoing` · `as per ticket` ·
`same as yesterday` · `done` · `in progress` · `discussion` · `support`

**Not acceptable:** `testing eauto` — the lead cannot tell which ticket, which environment, what
kind of testing, or whether anything passed, so it has to be queried.

### House practice on top of v1.4

- **Don't sound like AI.** Short sentences, plain verbs. No em dashes. "Fixed the script issues and
  reran the test. All passed." beats "Fixed the script-side failures, subsequently executed the full
  automation suite, and reviewed the resulting test evidence."
- **Don't assert a finding they didn't give you.** "Checked X" is safe. "Confirmed X is correct" is
  a claim about the outcome, and only they know the outcome.
- **Task reference format:** ticket number plus a short title in parentheses —
  `EAINT-11982 (Extend Expiration of Application)`. Drop the board prefix and emoji. Release-wide
  work keeps the window name, e.g. `20 August Morning Deployment`.
- Set the structured fields too: **Task reference**, **Task link**, and **Submission links** for a PR
  or a test-evidence artefact.

## Step 7 — Present the draft and wait for go

One table, with the arithmetic visible:

```
ALREADY LOGGED (2) · 0.75h
  • eAuto Core  EAINT-11952   Delivery   15m
  • eAuto Core  Night Deployment planning   Meeting   30m

TO ADD (3)
  1. eAuto Core  EAINT-11880   Billable · Delivery    1h 20m   [Blocked]
     Task: ran SI booking slot-capacity scenarios on /uat3
     Method: Manual — slot capacity depends on live 3rd-party availability
     Blocker: waiting on Dev for the reschedule fix
  2. —            Team standup  Non-billable · Team standup   15m
     With: May Chin, Azila, Faiz
  3. eAuto Core  EAINT-11952   Billable · Meeting     30m   ⚠ classification unconfirmed

  Day total after adding: 3h 20m of 8h  ·  gap 4h 40m
  Billable meetings: 1h 0m today · month-to-date 1h 0m against a 1.5h/day allowance
```

Then flag, above the confirmation:

- Any **gap to 8h** — state it, ask what accounts for it. **Never offer to fill it.**
- Any **duration that reads like an estimate**.
- **A day caps at 8h** (less leave/lieu). Excess shows as a small `+1.0` and counts toward nothing —
  not the billable percentage, not the 40h week. Say so rather than trimming an entry yourself.
- **Billable-meeting load** against their allowance. It is counted **across the month and scaled to
  the days actually worked**, so one workshop day never breaches it — don't raise an alarm on a
  single heavy day. Past it the lead sees a **`Meeting-heavy`** flag. It is a **ceiling, not a
  quota**: using less costs nothing, and 15 minutes that settles a question beats an hour that fills
  the slot.
- Anything still `⚠ classification unconfirmed`.

Ask: **"Submit these N entries?"** Only proceed on a clear yes. If they amend one, redraw the whole
table — don't submit a half-corrected list.

## Step 8 — Submit in Chrome, one entry at a time

**Read `references/chrome-mechanics.md`.** The panel fights naive automation and several obvious
approaches fail silently. The short version:

```
https://capacity.modefair.com/log/YYYY-MM-DD                 # add an entry
https://capacity.modefair.com/log/YYYY-MM-DD?editing=<id>    # edit an existing one
https://capacity.modefair.com/log/YYYY-MM-DD?panel=none      # close the panel
```

- Set the notes with the Trix editor's `loadHTML`, not by typing.
- **Do not scroll the panel** — `scroll` zooms the viewport instead.
- **Do not use `form.requestSubmit()`** — it freezes the renderer.
- Submit with `f.querySelector('[name="commit"]').click()`.
- **Read every `time_entry[...]` field back immediately before submitting.** This is the step that
  catches the silent-empty failure.

One entry at a time. Verify each landed before starting the next.

## Step 9 — Verify and report

After each submit, **read the day back** (`javascript_tool`, not a screenshot) and confirm the entry
exists with the duration and class you intended. Then report:

- Which entries landed, with their durations and the new day total.
- Which failed, and why.
- What is still outstanding — anything they couldn't put a duration to.
- The gap to 8h, if there is one, stated as information.

Never claim a day is logged when part of it isn't.

---

## Out-of-hours work — never a time entry

Work outside working hours is **never** a time entry and **never** counts toward the 40-hour week.
It is declared on the week tab instead. CapacityTrack has two separate declarations, and they are
not the same thing:

- **Night work** — work that had to happen then, such as a night deployment or a call-out. Paid as a
  **hardship allowance**. A production deployment running an hour or more earns it; the bands are in
  the employee handbook.
- **Extra work** — extra effort someone chose to put in during their own time to go the extra mile.
  **No allowance.**

**A night deployment is always night work, never extra work.** Getting this wrong either costs
someone an allowance or claims one they aren't owed.

On-call and production support are the CTO's call, case by case.

## Leave

Leave is recorded in CapacityTrack with **Mark leave** — *not* a zero-hour entry, and **not**
integrated with FlexHR. If the day is leave, there is nothing to log; say so and stop.

## Week wrap-up

Mention it, don't silently skip it. The week tab holds key achievements, blockers (auto-collected
from every entry ticked **Blocked**), the weekly pulse, the Friday AI contribution, and the night
work / extra work declarations.

**Ticking Blocked during the week is what populates the blocker roll-up** — that is the mechanism
that turns a slow week into something the lead can see a reason for. Every blocked entry is
reproduced in full on the reports, note text and all.

**The Friday AI contribution asks whether you *presented or shared* something at the Friday AI
session** — not whether you attended, and not what AI work you did during the week. Charmain's
reading, 30 Aug 2026: she attended the session and had shipped a skill for the team that week, and
the field still correctly read `Missing`, because she did not present. **Worth confirming with May
Chin before relying on it.** Either way, do not offer to fill it from attendance or from tooling
shipped during the week, and do not push for a week to be reopened over it.

Missing the Friday AI session is priced at **−0.25** on the monthly rating.

## If a lead queries an entry

A queried entry stays editable past 11 PM — only that one. Deal with it before adding new rows.
Surface the reviewer's exact reason, ask what actually happened, then redraft and show it before
saving. A lead reclassifying an entry is a correction, not an accusation.

## Site map

```
/                      dashboard — week utilization gauge, billable %
/log, /log/YYYY-MM-DD   daily log; right-hand "Log time" panel
                        ?editing=<id> edits an entry, ?panel=none closes
/week/YYYY-MM-DD        week wrap-up — 4 questions, pulse, night work, extra work
/reports, /reports/<id> week / month / year breakdowns, plus Blockers raised
/tour                   full 4-flow walkthrough incl. the merit/demerit price tables
/guidelines             billable-vs-non-billable policy, worked examples, per-role rules
/job_description        the role document — billable target and cadence
```

The day closes **11:00 PM MYT** and is final.
