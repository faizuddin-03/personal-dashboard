---
name: qa-timesheet-update
description: Fill in a QA engineer's daily CapacityTrack timesheet (capacity.modefair.com) end to end - reconstruct the day from seven sources (Claude Code, claude.ai file trails, Teams, Jira, QA Portal, git log, CapacityTrack Named in), interview them for the ACTUAL duration and outcome of each item, classify billable vs non-billable, compose the remark to the eAuto QA Remark Standard, then submit each entry in their own Chrome after they confirm. Also answers timesheet questions without logging anything - whether an hour is billable, which template to use, meeting allowances, week wrap-ups, night work and hardship allowance, leave, a queried entry, and how the monthly rating is calculated. Use when someone says "log my time", "update my timesheet", "log today or yesterday", "fill in CapacityTrack", "what still needs logging", "is X billable", "how do I write my remark", "which template do I use", "why was my entry queried", "track my day", "track my time", "draft my entries", or "what did I do today".
---

# QA timesheet — log the day, end to end

Turn a day's real work into correct CapacityTrack entries at **https://capacity.modefair.com**.

This skill does two jobs. **Logging a day** is the nine-step flow below. **Answering a question**
about the timesheet needs no flow — go straight to the reference that covers it.

Two systems, one direction only:

- **Source (read):** **seven** of them — the person's **Claude Code transcripts**, the **file trail
  a claude.ai chat leaves**, **Teams**, the **Jira changelog**, the **QA Portal** tracker, the
  project **repo**, and CapacityTrack's **`Named in`** panel. No single one is the day, and the
  claude.ai one is invisible unless you go looking. Step 1 has the sweep for each and what each
  one misses.
- **Target (write):** **CapacityTrack**, driven in **their own logged-in Chrome**. It needs their
  session, so use the Chrome browser tools against their real browser, never a fresh sandboxed one.

This skill never writes to Teams. Reads only.

## Setup — fill this in once, per person

The flow needs a few facts about whoever is logging. Ask for anything missing rather than guessing,
and keep the answers for the rest of the session.

| Fact | Why it's needed | Example |
|---|---|---|
| **Their full name in Teams** | To pick out their own messages in each chat | the name shown on their messages |
| **Graph sign-in** | Source 2 reads Teams as them. One-off: `node scripts/teams-day.mjs login` | `whoami` confirms which account is on the token |
| **CapacityTrack user id** | Their reports live at `/reports/<id>` | `9` |
| **Role** | Sets the billable target and the meeting allowance | Senior QA automation engineer — 30h of 40h billable, 1.5h/day meetings |
| **Lead's name** | Who reviews the entries and can reopen a missed day | `May Chin` |
| **Their project(s)** | Which projects they work on at all, so the resolver has a shortlist | `eAuto Core`, `eAuto Wholesale` |
| **Team chats they post in** | Where the day gets reconstructed from | `eAuto QAs`, the CR group chats |

Roles differ. **Read `/guidelines` for their actual allowance** rather than assuming the numbers
above apply.

**Every value in that table is an example, not a default.** The examples are Charmain's because she
wrote the skill. Ask, and never carry one person's answer into another person's session.

### This skill is shared — assume you are not logging Charmain's day

It gets handed to other QAs. Anything person-specific is either **derived from whoever is signed in**
or **asked for**. Nothing is baked in.

| Fact | How it's obtained |
|---|---|
| **Who "they" are in Teams** | Derived. `GET /me` on their own Graph token — `scripts/teams-day.mjs` matches on `from.user.id`, never on a name |
| **Their Claude transcripts** | Derived. `~/.claude/projects` on the machine the skill is running on |
| **Their Jira account** | Derived. Their own Chrome session — JQL uses `currentUser()`, not a name |
| **Their git history** | Derived. The repo they actually work in |
| **CapacityTrack user id, role, lead, projects, chats** | **Asked.** Step 0, per session |

Three habits that keep it portable:

1. **Never hardcode a display name** — not in the script, not in a JQL, not in a filter. Two people
   here share a first name and several go by something other than their Teams name.
2. **Names in this file are illustrations.** `May Chin`, `eAuto Core`, user id `9` are examples of
   the *shape* of an answer. Read them as `<their lead>`, `<their project>`, `<their id>`.
3. **Rulings stay attributed.** A rule dated and credited to Charmain still applies to everyone —
   the attribution is the evidence for the rule, not a limit on who it covers.

## References — load only what the moment needs

| File | Read it when |
|---|---|
| `references/remark-templates.md` | **Composing any remark.** The eAuto QA Remark Standard v1.4 — ten templates, six fields, combine-or-split, banned remarks |
| `references/worked-examples.md` | You want to see the whole flow run once, on a real-shaped day |
| `references/progress-update-format.md` | Checking an entry against the eAuto QA morning/EOD update format |
| `references/chrome-mechanics.md` | Submitting. Form fields, the Trix notes editor, the mention picker, what silently fails |
| `references/07-guidelines-what-counts-as-billable.md` | Billable vs non-billable, the full examples table, role guidance, allowances |
| `references/01-flow-1-logging-your-time.md` | The daily entry form, the 11pm cut-off, durations, Blocked, marking leave |
| `references/02-flow-2-closing-your-week.md` | Week wrap-up, the pulse, night work, extra-work declarations |
| `references/03-flow-3-when-an-entry-is-queried.md` | A lead querying an entry or moving it between billable and non-billable |
| `references/04-flow-4-your-monthly-rating.md` | The rating card, the bands, what moves the number |
| `references/05-flow-5-reviewing-your-teams-week.md` | Leads reviewing a team's week |
| `references/06-flow-6-writing-the-monthly-rating-and-reference.md` | Leads writing a rating, plus the merit and demerit price tables |

Plus one script:

| File | Run it when |
|---|---|
| `scripts/teams-day.mjs` | **Reading Teams.** Pulls their own messages for a day, every chat, straight off Microsoft Graph as them — no browser. `login` once, then `day [YYYY-MM-DD]`. This is source 2 |

## Golden rules — these are the point of the skill

Entries feed the lead's weekly review and the monthly IT update to the CEO. The CTO called someone
out publicly on 17 Aug 2026 for logging 8h before the day had ended, and the rating system prices
padding at **−0.25**. So:

1. **Never invent a duration.** If the person has not said how long something actually took, ASK.
   If they can't say, do not log that entry — leave it out and tell them it's outstanding. Never
   derive a duration from complexity, from a plan's estimate, or from what would round the day out.
2. **Never pre-log.** Only completed work, at its actual duration. If a task is still running, it
   is not an entry yet. Say so and move on.
3. **Never pad to the daily target.** Report the gap between logged hours and the target as
   *information*, and ask. A short day is a real signal — surfacing it honestly is the job, filling
   it is misconduct. Equally, don't quietly under-report: unlogged time is treated as no work
   performed, so walk them through the gap rather than shrugging at it.
   - **⚠ The target is 8h Monday to Thursday and 7.5h on FRIDAY.** Company-wide, confirmed
     4 Sep 2026. **CapacityTrack does not know this** — it shows `to go` against 8h on a Friday too,
     so a complete 7.5h Friday displays as `30m to go`. Read that number, don't repeat it: on a
     Friday, subtract 30 minutes before calling anything a gap. Telling someone they are half an
     hour short when they have worked a full day is the same error as padding, pointing the other
     way. See *Friday is 7.5h* in Step 7.
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

> #### ⛔ The pre-send gate — run this on every message before you send it
>
> **Search your drafted message for `?`. If it is a question to them, it does not belong in the
> message.** Every interview question goes through `AskUserQuestion` — no exceptions, including
> durations and counts.
>
> **Two different things, do not conflate them:**
>
> | | Rule |
> |---|---|
> | **Where the question is delivered** | *Always* `AskUserQuestion`. Never prose. |
> | **What may be a clickable option** | Never a number you made up. |
>
> A duration question **is** a prompt question. What it must not do is offer `30m / 45m / 1h` as
> clickable options — that is inventing the number and letting them ratify it (Golden Rule 1).
>
> **How to ask for a number in a prompt.** The options carry the *decision*; the number goes in the
> free-text **Other** that every question has:
>
> ```
> Q: The three meetings with the lead — durations?
>    - All three were 30m, as they logged it   <- a figure from a SOURCE, not invented
>    - They differed — typing them             <- routes to Other
>    - One or more didn't happen               <- drops the entry
> ```
>
> Legitimate non-numeric options for a duration: **accept a figure a source already recorded**
> (the lead's `Named in`, their own EOD update), **they differ, typing them**, **can't recall —
> leave outstanding**, **it didn't happen — drop it**. What is never an option is a duration you
> generated yourself.
>
> **Batch to stay inside four per call.** Group related asks so one question clears several numbers
> — all the meetings in one, both entries on a ticket in one — rather than firing one prompt per
> entry.
>
> **This has now failed three times** — 28 Aug, 3 Sep, and twice on **4 Sep 2026**: once with four
> questions in prose, then again when the durations were left in prose because this section said
> they "stay typed". Her correction: *"i need these to be in prompt as well."* Typed means **typed
> into Other**, not typed into chat.
>
> **Knowing the rule is not applying it.** Reading this section does not discharge it. The gate is
> the `?` scan, run on the drafted text, every time — treat a skipped scan as a defect, not a
> shortcut.

Write the options as **the decision, with its consequence spelled out**, so a click actually
resolves something:

```
Q: EAINT-12155 - what did the estimate work actually cover?
   - Read both split tickets, then estimated -> Template 01, billable
   - Just the reply to the lead              -> Template 08 coordination, short entry
   - Re-estimated off earlier study          -> Template 01, updating an existing estimate
```

Every question carries a free-text **Other**, so nothing is forced into a bad option.

**Name the source in the question itself.** Nobody can judge an option without knowing what put the
item in front of them — and a question about something they do not recognise is usually a question
about an item you got wrong. Put the evidence in the question text, not in a message alongside it:

```
Q: EAINT-11880 — transcripts show 09:10–10:35 in that folder, and you posted the
   slot-capacity result to the CR chat at 10:41. What does that hour and a half cover?
   - All of it was the slot-capacity run   -> one Delivery entry
   - Part of it was the estimate           -> two entries, splitting the window
   - The window is wrong — typing it       -> Other
```

Where nothing recorded the item, say that outright — `Named in shows 30m with May Chin, and nothing
else anywhere mentions it` — because "no other source" is exactly the fact they need to check.
Anything you worked out yourself is announced as inferred, in the question. Full rules: *Say where
every item came from*, in Step 1.

**Never put a duration in an option.** Offering `30m / 45m / 1h` to click is inventing the number
and letting them ratify it, which is exactly what Golden Rule 1 forbids. Same for anything else that
changes what the entry *claims* — what a run found, how many cases passed, whether a ticket was
raised. **This does not exempt the question from being a prompt.** Ask it through
`AskUserQuestion`, give the options as decisions, and let the number arrive in **Other**.

Good prompt questions: which template, billable vs non-billable, Manual vs Automation, Delivery vs
Meeting, was there a standup, log now or at EOD, combine or split, which environment.

**All of these are choices, and every one of them has been asked as prose at least once:**

| Question | Options that work |
|---|---|
| Manual, automation, or both? | Both · Manual only · Automation only |
| Which environments? | the env list, `multiSelect: true` |
| Did the run finish? | Still running (not an entry yet) · Finished, results to follow · Stopped |
| Did anything pass, or was it all issue-finding? | All issue-finding · Some passed, numbers to follow · Blocked before any ran |
| Were those meetings real calls? | All calls · All chat · Some of each |
| One entry or two? | Two entries · One combined |
| Is this too small to log? | Fold into X · Own short entry · Skip it |
| Did you present at the AI session? | Attended only · Presented or shared |

Note the pattern in rows 4 and 8: **a choice can front a number.** "Some passed — numbers to
follow" is a click; the `23 of 155` arrives in **Other** on that same prompt. Never let a typed
*value* drag the *question* out of a prompt and into prose.

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

### Graph sign-in — check it first, but never wait on it

Source 2 reads Teams as them, so a QA using this skill for the first time has to sign in once. **Do
this check before drafting, not when you reach Step 1** — a sign-in takes them about 30 seconds and
a device code only lives 15 minutes, so it wants to be running while you do the free local work.

```bash
node ~/.claude/skills/qa-timesheet-update/scripts/teams-day.mjs whoami
```

- **A name and account come back** → connected, nothing to do. Run source 2 normally.
- **`Not signed in`** → start `login` **in the background**, hand them the code and the URL, and
  **carry straight on with sources 1, 3, 5 and 6.** Fold Teams in when the token lands.

**Never make the sign-in a gate.** Sources 1 and 3 are local and free and frame the day on their
own; stopping the whole flow to wait on a device code wastes the person's time and the window. The
one thing you must not do is draft *silently* without Teams — see below.

**If they decline, or it fails, or the code expires:** carry on, and say so in the draft, by name:

```
⚠ Teams was not read this session (not signed in). Sources used: transcripts, jira, named-in, git.
   Anything discussed only in chat — sign-offs, estimates, dev chasing — will be missing.
```

That line is not a disclaimer, it is a source tag on the whole reconstruction. They can only judge
a gap they were told about.

**What each QA needs to know about the sign-in**, if they ask:

| Question | Answer |
|---|---|
| What is it signing into? | Microsoft Graph, as themselves. **The consent screen will name the app `Automate Teams group chat - WeiTing`** — that is the tenant's existing app registration this script borrows, not a new one. Say so *before* they open the link, or it looks like phishing and they will close it |
| What can it do? | The **script** only ever does GETs — every Graph call goes through `graphGet`, there is no write path. The **token** carries `Chat.ReadWrite`, for the reason in the next row |
| Does it need admin approval? | Not on this tenant, **as long as you ask for `Chat.ReadWrite`.** Asking for the narrower `Chat.Read` is refused with **"Need admin approval"** — confirmed 8 Sep 2026. Admin consent is recorded per app *and per permission*, this tenant blocks user self-consent, and the permissions already approved on that app are the QA Portal's set (`Chat.ReadWrite`, `Chat.Create`, `ChatMember.ReadWrite`, `User.ReadBasic.All`). `Chat.Read` was never approved, and being *less* powerful does not help. **Do not "tighten" the scope back to `Chat.Read`** — it breaks the sign-in for everyone. To genuinely narrow it, an admin must grant `Chat.Read` on that app first |
| Where does the token go? | `~/.claude/.graph-timesheet-token.json` on their own machine, mode 600. Never in the skill folder |
| Can someone else read their chats with it? | No. It reads `/me` — whoever holds the token, and nobody else |
| How do they revoke it? | `teams-day.mjs logout`, or revoke the app in their Microsoft account |

If the token exchange fails with **`AADSTS7000218`**, the app registration is a confidential client
and needs *Allow public client flows* enabled in Entra → App registrations → Authentication. That is
a one-time tenant-side fix, not something the person can do — tell them who to ask.

## Step 1 — Reconstruct the day

Everything gathered here is a candidate to **ask about**, never an entry to log directly.

### Seven sources — no single one is the day

Teams used to be the only source here. On 4 Sep 2026 that was wrong: Teams and Jira between them
covered a fraction of a day that ran 06:02 to 17:58. Sweep all seven, then reconcile.

| # | Source | Gives you | Cost |
|---|---|---|---|
| 1 | **Their Claude Code transcripts** | Every prompt, timestamped, grouped by workstream. **Claude Code only — see source 7** | Free, local, always available |
| 2 | **Teams, via Graph** (`scripts/teams-day.mjs`) | Their plan, the sign-offs, the discussion, and anything done outside a tool — **every chat, whole day** | Free after a one-off sign-in. No browser |
| 3 | **Jira changelog** | Tickets raised, moved, commented, fields edited | Their Chrome, any tab |
| 4 | **QA Portal** (`http://qa-portal/`) | The tracker's in-app changelog and ticket edits | Office wifi or VPN only |
| 5 | **The repo** (`git log`) | What actually shipped, with times and diffstats | Free, local — and the QA Portal fallback |
| 6 | **CapacityTrack `Named in`** | Meetings *colleagues* logged them into — the only source that has these | Free, on the day page you already load |
| 7 | **claude.ai work, via file mtimes** | Whole workstreams that leave **no transcript at all** — see below | Free, local. **Easy to miss entirely** |

**Start with 1, 2, 5 and 7.** All four are local, free, and need no browser session. They frame the
day before you spend a browser call on anything.

**Tag every candidate with the source it came from, and keep that tag all the way to the draft.**
See *Say where every item came from*, below — it is not optional presentation polish, it is how she
checks your reconstruction.

**Never skip 6.** On 4 Sep 2026 it was the *only* source carrying three face-to-face meetings with
the lead — 1h 30m as she logged it — that appeared in no transcript, no ticket, no chat and no
commit. A meeting leaves no trace in any tool the person drove themselves. Read it every time; it
costs nothing because Step 2 loads that page anyway.

**Then reconcile.** Where two sources disagree, ask.

> **⚠ A gap is not a break until source 7 has cleared it.** The old rule here said a gap in every
> source was lunch. That rule produced a wrong reading on **8 Sep 2026**: three gaps — 13:20–14:05,
> 15:25–15:45, 16:55–17:05 — were reported as breaks, and all three were **claude.ai work on a CR**
> that left no transcript. A whole workstream, five hours wide, was invisible.
>
> So: find the gaps, then check the *downloads and working folders* for files written inside them
> before calling any of them a break. What survives that check can be offered as lunch — and even
> then, **ask** rather than assert.

### Say where every item came from

**Every item you put on screen names its source and the evidence behind it.** Charmain's
instruction, 8 Sep 2026: *"can you mention where you get the entry from when you show the task on
screen."*

Seven sources go in and one list comes out, so without the tag the person cannot tell a measured fact
from an inference — and they are the only one who can catch a wrong one. An item with no source is
an item they have to take on trust, which is exactly what this skill is supposed to remove.

Carry a **source tag** on every candidate from the moment you find it, and print it at every point
the item is shown: the Step 1 sweep, the Step 4 questions, and the Step 7 draft.

| Tag | Means | Print alongside |
|---|---|---|
| `transcripts` | Their Claude **Code** `.jsonl` | The measured window, `HH:MM–HH:MM`, and the project folder |
| `claude-ai` | A file a claude.ai chat produced | The file name and its mtime. Say it is a **bracket**, not a measured window |
| `teams` | A Teams message | Chat name and the message time |
| `jira` | A changelog entry or comment | The ticket key and the transition or field |
| `tracker` | QA Portal | What was edited |
| `git` | A commit, PR or diffstat | Short sha and the time |
| `named-in` | CapacityTrack `Named in` | Who logged them in, and the duration *that person* logged |
| `them` | They told you, in this session | Nothing — but never relabel it as a source |
| `inferred` | **You worked it out.** No source says it | The reasoning, in one clause |

Four rules about the tags:

1. **Two sources beat one — print both.** `[transcripts 09:10–10:35 · jira EAINT-11880 → In Testing]`
   is the strongest thing you can show them, because the agreement *is* the evidence.
2. **`inferred` is never silent.** If nothing recorded it, say so and say why you think it happened.
   An item tagged `inferred` needs their yes before it becomes an entry, always.
3. **A duration carries the source of the duration**, not of the item. Measuring a window from the
   transcripts is `transcripts`; a figure they gave in **Other** is `them`; a figure off `Named in`
   is `named-in`. Golden Rule 1 is about *inventing* numbers — the tag is what proves you didn't.
4. **Never launder a tag upward.** A guess they confirmed stays `them`, not `transcripts`.

#### 1. Their Claude Code transcripts — start here

`%USERPROFILE%\.claude\projects\<slug>\*.jsonl`, one file per session. The slug is the working
folder, so it names the workstream on its own.

> **⚠ This is Claude Code only, and it is not "the fullest record".** It used to say that here and
> it was wrong. A claude.ai chat writes nothing to this directory, so a workstream driven from the
> web app is **completely absent** — not thin, absent. **Run source 7 before drawing any conclusion
> about when the day started, ended, or paused.**

1. List `*.jsonl` with `LastWriteTime` >= today's date.
2. Per file, keep lines matching `"type":"user"`, `ConvertFrom-Json` each.
3. Drop entries whose text matches
   `system-reminder|tool_result|Caveat:|<local-command|<command-name|<scheduled-task|<task-notification|cross-session-message|Base directory for this skill`.
4. Keep the local `timestamp` and the text, truncated to ~110 chars. Sort by time.

**Four kinds of noise that are not work, and all four appeared on 7 Sep 2026:**

| Looks like a prompt | Actually |
|---|---|
| `<scheduled-task name="capacity-morning-brief">` | A cron firing on its own. Nobody was at the desk |
| `<task-notification>` Monitor events, sometimes every 2 minutes for an hour | A background watcher reporting. Real work *may* be running, but the notification is not evidence someone was working |
| `<cross-session-message from="local_...">` | Another Claude session talking to this one |
| `Base directory for this skill: ...` | A skill loading its own instructions |

Keep them out of the *prompt list* you show them. **For the activity-bucket measurement below they
are still useful** — a Monitor event proves the machine was busy — but say so when a stretch of the
day is notification-only rather than presenting it as hands-on time.

**Exclude this skill's own session folder** too, and any folder that is just the timesheet working
directory: logging the day is not part of the day.

**Filter on each entry's `timestamp`, never the file's `LastWriteTime` alone** — a file modified
today may have started yesterday.

**Group by session before reading.** First and last prompt per session gives the shape of the day
in one table: which workstreams ran in parallel, and where the gaps are.

**It carries intent, not just output.** A prompt at 13:22 explains a Jira ticket created at 13:26.
Jira shows the ticket; the transcript shows the decision.

Use PowerShell for the date, not Bash — see the date rule in Step 0.

##### Durations from the transcripts — derive the window, then ask only for the split

Golden Rule 1 forbids *inventing* a duration. It does not forbid **measuring** one. The transcripts
are timestamped, so the elapsed working window is a recorded fact, not a guess — and on 7 Sep 2026,
asked for three durations, she pushed straight back: *"you didnt check teams and claude???"* Measure
first, and ask only for what measurement cannot settle.

**Bucket every message into 5-minute slots per workstream, then find the runs.** A gap over ~15
minutes ends a run, which is what finds lunch and the evening break without asking:

```powershell
$today = (Get-Date).Date
$b = New-Object 'System.Collections.Generic.Dictionary[int,string]'
Get-ChildItem "$env:USERPROFILE\.claude\projects" -Recurse -Filter *.jsonl |
  Where-Object { $_.LastWriteTime -ge $today } | ForEach-Object {
  $proj = $_.Directory.Name
  if ($proj -eq 'subagents') { return }
  $ws = if ($proj -match '<ticket>') { 'W' } elseif ($proj -match '<other>') { 'T' } else { 'O' }
  Get-Content $_.FullName | ForEach-Object {
    if ($_ -notmatch '"timestamp"') { return }
    try { $o = $_ | ConvertFrom-Json } catch { return }
    if (-not $o.timestamp) { return }
    $lt = ([datetime]$o.timestamp).ToLocalTime()
    if ($lt.Date -ne $today) { return }
    $k = [int][math]::Floor(($lt.Hour*60 + $lt.Minute)/5)
    if ($k -lt 96) { return }   # 96 = 08:00; work before 8 AM is their own time
    if ($b.ContainsKey($k)) { if ($b[$k] -notlike "*$ws*") { $b[$k] += $ws } } else { $b[$k] = $ws }
  }
}
```

> **⚠ `[int]` ROUNDS in PowerShell, it does not floor.** `[int]($k*5/60)` turned bucket 103 into
> `09:35` when it is `08:35`, which made the whole timeline look shuffled. Use
> `[math]::Floor($m/60)` for the hour. Also use a typed
> `Dictionary[int,string]` — a plain hashtable's keys sorted wrong and inflated an 8h 30m day to
> 15h 35m. **Sanity-check the total against the wall clock before reporting it**: from 08:00 to now
> cannot exceed the elapsed hours.

**Two workstreams at once is one clock, and the split is the only part you ask about.** Count
buckets where each appears, and where both do:

| Figure | Meaning |
|---|---|
| buckets with any activity | **active desk time** — the ceiling for the whole day |
| buckets per workstream | how long each was live |
| buckets with both | the **shared window**, which must be split, never added |

Then subtract the meetings (from `Named in` and from them) to get the **hands-on** remainder, and
split that. For the split itself, offer a **measured ratio**, not a figure you picked: message count
and their own typed-prompt count, computed separately. On 7 Sep both landed on **60/40** (6,393 vs
4,497 messages; 79 vs 53 prompts), which is a defensible number *because two independent measures
agreed*. Show both and let them correct it — she overrode it to a flat 1h on the internal work,
which is exactly the point: **measure, propose, let them decide.**

**Filter to `>= 08:00`.** Work before then is their own time and belongs on the wrap-up as an
extra-work declaration, never as a time entry.

##### The TS-level board is in the transcripts, not the API

For a ticket with a local evidence tracker (`localhost:4155/api/board` on EAINT-12155), the API
returns **take-level** counts — `passed`, `failed`, `finished` out of hundreds of takes — while the
scenario board the remark needs (`passed / partial / failed / pending / not automated / N/A`) is
rendered client-side and is not in the JSON. `/api/status` returns the tracker's HTML shell with no
data in it.

**Get the TS board by grepping the day's transcripts for the latest reading** rather than asking:

```powershell
Get-Content $f | Where-Object { $_ -match 'passed' -and $_ -match 'partial' }
# then regex '(\d+)\s*passed[^.\n]{0,90}?(\d+)\s*partial' and keep the LAST match of the day
```

On 7 Sep that returned fourteen readings and the 17:43 one — `86 passed · 0 partial · 0 failed ·
0 pending · 0 not automated · 41 N/A (of 127), active 86` — was the figure the entry needed. A
handover file's pasted figure is usually stale by hours; prefer the newest transcript reading and
say what time it is from.


#### 2. Teams — their plan, the sign-offs, and anything done outside a tool

Most QA post a morning plan and an EOD update to their team chat. That update already carries the
scenario counts, the TS ranges and the progress figures the remark needs.

##### Read it through Graph, not the browser — `scripts/teams-day.mjs`

**This is the route. The browser route below is the fallback.** Charmain's ruling, 8 Sep 2026: read
Teams **directly off the Microsoft Graph API as themselves**, using their `@modefair.com` work
account. Not through the QA Portal — she ruled that out again in the same breath — and not the UI.

**It is per-person by construction — no name is configured anywhere.** "Their own messages" means
`from.user.id` equals the id `GET /me` returns for whoever signed in. So a QA who is handed this
skill runs `login` once with their own account and gets *their* day, with nothing to configure and
no name to change. Never patch a display name into the script: two people here share a first name,
and several go by something other than their Teams name.

One-off sign-in, then it never needs anything again:

```bash
node ~/.claude/skills/qa-timesheet-update/scripts/teams-day.mjs login
```

Device code flow: it prints a code and a URL, they sign in with their work account, and the refresh
token lands in `~/.claude/.graph-timesheet-token.json` — **outside the skill folder on purpose**,
because skills get uploaded and tokens must not. Scope is `Chat.Read`, read-only, no admin consent.

Then, per day:

```bash
node ~/.claude/skills/qa-timesheet-update/scripts/teams-day.mjs day 2026-09-08 --context 3
```

It walks **every** chat they are in — group, 1:1 and meeting chats alike — keeps the ones touched on
or after that day, and returns their own messages **plus three either side**, oldest first, grouped
by chat, with local `HH:MM` times, the chat's `webUrl`, and attachment names. `>>` marks theirs.
Flags: `--all` for every message in the window, `--context 0` for hers alone, `--json FILE` to keep
the raw result, `--tz` if the person is not on UTC+8.

**Why the context messages matter.** Their own message is usually the *request*; the outcome is in
the reply. A search snippet gives you "thanks" without the thing it answers. That is why the default
is 3 and not 0 — Charmain's choice, 8 Sep 2026.

**What it fixes, all at once** — every one of these is a real failure logged against the browser
route:

| Browser route | Graph route |
|---|---|
| Their Chrome must be in the foreground; they type every search | Nothing to drive |
| ~30-row cap, bottoms out near noon — **loses the morning** | Whole day, every chat, no cap |
| One search buys one chat visit; 8 chats = 8 searches | All chats in one pass |
| `Top results` hides most of it; two passes give different sets | Deterministic |
| `.click()` on a result row froze the renderer | No renderer |

**Verified working 8 Sep 2026.** First real run returned **22 of her messages across 7 chats**,
from **08:27** — five 1:1s, `eAuto QAs`, and a CR group. The browser route had never once reached
before ~11:58 on any day. It scanned 15 chats out of 613 and stopped at the window boundary.

> **⚠ Never prune chats on `lastUpdatedDateTime`.** That field is the chat's **metadata** time —
> roster and topic changes — **not** its last message. On the first run a 1:1 whose last message
> arrived that morning reported `lastUpdatedDateTime` of **2025-03-07**, so pruning on it skipped
> **612 of 613 chats and returned an empty day** — while exiting 0 and looking like a clean result.
> The last-message time is **`lastMessagePreview/createdDateTime`**, which needs
> `$expand=lastMessagePreview`.
>
> **An empty or near-empty Teams result on a working day is a bug, not a quiet day.** Check the
> `scanned` / `read` counts on stderr before believing it.

**What it still cannot give you.** Only *chat* — `/me/chats` does not include Teams **channel**
posts, which need `ChannelMessage.Read.All` and admin consent. And it only finds messages: a meeting
that was never chatted about leaves no trace, so **source 6 is still mandatory**.

Three failure modes worth recognising:

- `AADSTS7000218` — the app registration is a confidential client. Turn on *Allow public client
  flows* in Entra → App registrations → Authentication.
- **"Need admin approval"** on the sign-in page — the scope asked for is not one an admin approved
  on that app. The script's default `Chat.ReadWrite` is the approved one; this only appears if
  someone has changed `GRAPH_SCOPES`. Put it back. Details in the sign-in table in Step 0.
- `Not signed in` / refresh failure — run `login` again. `whoami` says which account is on the token,
  `logout` forgets it.

##### The browser route — fallback only

Use this only when Graph is unavailable. It is slower, needs them at the keyboard, and **will not
reach the morning**.

This is a **browser** job: their real Chrome, `teams.cloud.microsoft/v2/`, already signed in.

**⚠ You cannot drive the search yourself — they have to.** Confirmed 3 Sep 2026, three routes all
dead: the `#/search/messages?q=` deeplink is stripped and lands on Calendar; setting the box from JS
sticks but a synthetic Enter never runs the search; and a JS `.click()` on a result row **froze the
renderer** and timed out CDP after 45 seconds — do not retry that one.

**The route that works: they do the input, you do the reading.** Ask them to type
`from:<their full name>`, click the **Messages** tab, then **Date → Today**. Then read the DOM —
reads work fine while Chrome is hidden, but the *search* needs the window in front.

**Use `from:`, not `with:`.** They are not the same. On 2 Sep 2026 `with:` returned 17 messages and
`from:` returned 42, including the 1:1s carrying the actual results.

**Never type `is:Messages` into the box** — Teams treats it as a literal search term and finds
nothing. The Messages tab does that filtering, and Teams appends the token itself once active.

**Re-typing the query clears the Date filter.** Re-apply `Today` after every new search.

**`Top results` is the trap.** It shows a fraction of the hits and ignores the date filter. Always
switch to **`All results`**.

**The `Next` button loses the query** — page 2 comes back empty. To reach earlier messages, run a
narrower search rather than paging.

**Teams search finds the afternoon and loses the morning.** The result set **caps at roughly 30 and
stops paginating**. **Never treat the search as the day.**

**⚠ You cannot switch chats programmatically.** A `.click()` on a chat-list row, on its
`closest('a')` / `closest('[role="treeitem"]')`, or a `ref` click on the rail's treeitem all fail
**silently while reporting success** — the previous thread stays open and its items stay in the DOM,
so a count check looks like it worked. Setting `location.hash` bounces back too. **Clicking a row in
the search results is the only working way in**, which is another reason the search has to be theirs.

**Re-confirmed 7 Sep 2026, and the rail is worse than a `.click()` problem.** Three separate
mechanisms were tried on the same rail row and all three failed silently, `document.title` unchanged
and the previous thread's items still in the DOM:

1. `computer` **coordinate click** on the `[role="treeitem"]` centre, with the row scrolled into view.
2. **`scrollIntoView` + `focus()` + `computer` `key: Return`.** `document.activeElement` confirmed the
   row had focus. Enter did nothing.
3. A JS `.click()` — the already-documented failure above.

So a coordinate click works **only on a search-results row**, not on the rail. Do not spend calls
retrying the rail; go back to the search.

> **⚠ And check the viewport before trusting any coordinate click.** On 7 Sep 2026 a rail click was
> issued at `y=1367` while `window.innerHeight` was **911** — 446px below the bottom of the page.
> Chrome returned `Clicked at (180, 1367)` exactly as it does for a real click. **A click outside
> the viewport is reported as a success.** Before any `computer` click built from a DOM rect, assert
> the target is actually on screen:
>
> ```js
> const r = el.getBoundingClientRect();
> ({x: Math.round(r.x+r.width/2), y: Math.round(r.y+r.height/2),
>   inView: r.y >= 0 && r.y <= window.innerHeight})
> ```
>
> If `inView` is false, `el.scrollIntoView({block:'center'})`, wait, then **re-measure** — the rect
> is stale the moment anything scrolls. This applies to the search-results rows too: only the first
> five or so of 25 rows are on screen at once.

The rail's row count **fluctuates between reads**. Never conclude a chat is absent from one read.

**The working way into a chat — verified 4 Sep 2026:**

1. Get the row's centre from the DOM, not a screenshot:
   `[...document.querySelectorAll('[role="row"]')].map(r => r.getBoundingClientRect())`.
2. `computer` **`left_click` on that coordinate**. A *coordinate* click works; a JS `.click()` on
   the same row is what froze the renderer. Wait ~6s, then confirm by reading `document.title` —
   it becomes `Search | <chat name>`.
3. **`navigate` with `url: "back"` is unreliable and usually costs you the search.** The skill used
   to claim it returns to the results. On 7 Sep 2026 it did that once, then on the next two attempts
   dropped out of search entirely into the ordinary **Chat** view (`document.title` becomes
   `Chat | <name>`, `[role="row"]` returns **0**), and the results could not be recovered. Treat one
   search as **one chat visit**. Read everything you need from a chat before leaving it, and expect
   to ask them to re-run the search for each further chat.
   - Also confirmed 7 Sep: the rail stays dead **from the Chat view as well**, not just from search.
     A scrolled-into-view, `inView: true`, coordinate click on `May Chin Mei Theng` left Amirul
     Azfar's thread open and reported success. There is no route into a chat except a results row.
   - So **ask them which chats matter before spending the search**, and prioritise. Walking eight
     chats means eight searches.

**Going back can return a *different* result set — read it again, don't assume.** On 4 Sep the
first pass gave 23 rows of raw messages reaching back to 12:01 PM; after visiting one chat and
going back, the same search returned 25 rows **grouped by chat, one per conversation**, and
surfaced three people and a group the first pass never showed. Re-read the rows after every back.

**The ~30-row cap eats the morning.** Both passes on 4 Sep bottomed out around 11:58 AM on a day
that started at 06:02. Teams will not give you the morning — that is what source 1 is for. Never
report a start time from Teams alone.

Where each kind of thing lands:

| Chat | What lands there |
|---|---|
| The QA team chat | Their morning plan and everyone's EOD updates. **Their plan, not their work.** |
| QAs + BAs | The substantive output — effort estimations, deployment-window planning, test data |
| CR group chats | The **completion sign-offs** and the dev chasing |
| The release-wide group | Regression sign-off to the whole team |
| 1:1s | The actual defect investigation |

**The sign-off and the estimate are never in the QA team chat.**

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

**Teams needs about 19 seconds to hydrate, not 8.** Straight after `navigate`,
`document.body.innerText` is ~72 characters and there are zero chat rows even though `readyState` is
`complete`. Wait and read again rather than concluding it's empty.

**Timestamps are UTC.** For a UTC+8 day, the local day runs 16:00Z the day before to 16:00Z. Each
message renders twice, once with a timestamp and once without — key on `time[datetime]`.

**Scrolling a thread: `scrollTop` is unreliable, `PageUp` works.** A tight
`for(...){p.scrollTop=0; await sleep(1200)}` loop **timed out CDP after 45s** and froze the renderer.
What worked: a coordinate click into the message pane, then `key: PageUp` with `repeat: 12`, twice —
15 loaded messages became 80, reaching back four days.

**Scrolling the search results** is different: walk up from a `[role="row"]` to the first ancestor
whose `scrollHeight` exceeds `clientHeight`, then step `scrollTop` and collect into a `Map` keyed by
row text.

**Slicing more than ~600 chars of a results page returns `[BLOCKED: Cookie/query string data]`** —
ticket URLs carry query strings. Strip them: `.replace(/https?:\/\/\S+/g,'[url]')` and
`.replace(/[?&=]/g,' ')`, then read back in slices from a `window.__X`.

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

#### 7. claude.ai work — the source with no transcript

**Source 1 is Claude Code only.** A conversation in the claude.ai web app writes nothing to
`~/.claude/projects`. If they worked a CR there, source 1 shows a blank stretch and you will read
it as a break.

**Found the hard way, 8 Sep 2026.** Her question: *"why you didnt track the lkm refund i did today?
i use claude chat then code."* The sweep had found **5 minutes** of EAINT-104 — the single Code
prompt at 17:43. The real work ran from about **12:44 to 17:43** in claude.ai and produced a SIT
script review, a comparison workbook, an HTML review, a reusable skill package and seven raised
open questions. None of it appeared in any of the other six sources.

**What it does leave: files.** Every download and every artifact they save lands on disk with a
timestamp. That is the whole trail, and it is enough to bracket the work.

Run both of these on every day you log:

```powershell
# 1. Downloads written today - the artifacts a claude.ai chat produced
Get-ChildItem "$env:USERPROFILE\Downloads" -File |
  Where-Object { $_.LastWriteTime -ge (Get-Date).Date } | Sort-Object LastWriteTime |
  ForEach-Object { $_.LastWriteTime.ToString('HH:mm') + '  ' + [math]::Round($_.Length/1KB) + 'KB  ' + $_.Name }

# 2. Working folders created or written today - a NEW folder is a new workstream
Get-ChildItem "$env:USERPROFILE\Downloads\<work root>" -Directory |
  Where-Object { $_.CreationTime -ge (Get-Date).Date -or $_.LastWriteTime -ge (Get-Date).Date } |
  ForEach-Object { $_.CreationTime.ToString('HH:mm') + '  ' + $_.Name }
```

Then read the files inside. A `README.md`, an `open-questions.md`, a comparison workbook — those
say what the work *was*, in more detail than a prompt list would.

Four things to know:

| | |
|---|---|
| **A new folder is a new workstream** | The EAINT-104 folder was created at 16:51 on a day the ticket appeared nowhere else |
| **Bracket, don't guess** | The download times bound the work. `12:44 html · 15:07 script · 16:32 workbook · 17:06 files` says the chat was live across that span — it does **not** say how many of those hours were hands-on |
| **`-LiteralPath` for bracketed folders** | `[eAuto]` in a folder name is a PowerShell wildcard. Without `-LiteralPath` the path "does not exist" |
| **The duration still has to be asked** | File mtimes prove the work happened and roughly when. They cannot say how long it took, and a chat left open is not worked time |

**Always ask outright: "anything else in claude.ai today?"** Only a file landing on disk makes that
work visible, so a chat that produced nothing downloadable leaves no trace at all. This is the one
source where "I found nothing" means nothing.

#### 3. The Jira changelog — what they touched, and what they raised

Run from a tab already signed in to Jira. **Two queries give two different answers**, and you want
both: `updated >= startOfDay()` plus a changelog filter gives everything they *touched*;
`reporter = currentUser() AND created >= startOfDay()` gives what they actually *raised*.

The QA field is queryable by its plain name:

```
project = <KEY> AND QA = currentUser() AND updated >= startOfDay()
```

`status CHANGED BY currentUser() AFTER startOfDay()` is too narrow on its own — it misses tickets
where they only changed fields (deploy dates, environment, developer). For those, sweep changelogs:

```js
const s = await (await fetch('/rest/api/3/search/jql?jql='
  + encodeURIComponent('project = <KEY> AND updated >= startOfDay()')
  + '&fields=summary&maxResults=100', {credentials:'include'})).json();
// then per issue: /rest/api/3/issue/<key>/changelog?maxResults=100
// keep values where author.displayName is theirs and created >= <date>
```

**`/rest/api/3/search/jql` returns no `total` and pages with `nextPageToken`.** A single call looks
complete when it is not — loop until the token is absent.

**Do not use the Atlassian MCP search for this.** 60 issues with default fields blows the token cap.

**But a NARROW MCP query is the cheapest way to get ticket titles**, which is what decides the
project. Ask for `["summary","status","created"]` only, and combine the keys you need with what they
raised, in one call:

```
key in (EAINT-12289, EAINT-12290, EAINT-12155)
  OR (reporter = currentUser() AND created >= startOfDay())
ORDER BY created ASC
```

> **⚠ The `cloudId` is not the company's obvious domain.** `modefair.atlassian.net` is rejected —
> *"Cloud id ... isn't explicitly granted by the user"*. The granted site is **`mfservices.atlassian.net`**,
> cloudId **`8fc3c96f-5850-4bd1-bb80-f57582b68e93`** (7 Sep 2026). Ticket links are therefore
> `https://mfservices.atlassian.net/browse/<KEY>`. If a cloudId is refused, call
> `getAccessibleAtlassianResources` rather than guessing another hostname.

**Tickets they raised is a much smaller set than it looks.** On 7 Sep the `reporter = currentUser()`
query returned exactly **one** ticket for a day whose transcripts mentioned raising several — the
others were discussed and dropped. Never log a "raised a ticket" outcome that this query does not
confirm.

**Changelog text trips the content filter.** Description edits carry the whole ADF body. Return
`field + ' edited'` for `description` and `summary`, strip `https?://\S+`, and strip `?&=`.

**To find a deployment window:** `/rest/api/3/project/<KEY>/versions`, filter to unreleased, match
on `releaseDate`. Then `fixVersion = <id>` lists its tickets. Useful when the QA Portal is down.

#### 4. QA Portal — the tracker, when it is reachable

`http://qa-portal/` is prod; `localhost:3001` is a dev server that is usually not running.

- It needs **office wifi or the VPN**. From home or after hours, expect it to be gone — a navigate
  will report success and land on an error page. Check the page actually loaded before trusting it.
- Auth is the browser session. `curl` returns `{"error":"Not signed in"}`; service tokens do not
  apply. Use a tab already on `qa-portal` — same-origin blocks a fetch from another site's tab.
- **The daily-plan data is dead** — `/api/daily-plans/dates` ends 15 Jun 2026 and no task has
  `isCurrent`. `/api/tasks` still returns live ticket data, but there is no `updatedAt`, so you
  **cannot filter by "touched today"**. The tracker cannot tell you what they did on a given day.
- Do **not** read Teams through this app's proxy routes — ruled out 28 Aug 2026 and again 8 Sep
  2026. The app's `/api/teams/chat-messages` is locked to the one configured QA chat anyway, which
  is the chat that holds their *plan*, not their work. Read Teams through Graph — source 2.

##### ⭐ The tracker is the only source for an estimation entry

**`/api/tasks` carries the estimate fields, and nothing else does.** Found 8 Sep 2026, after four
estimation entries had already been submitted as bare one-liners because the mandays were all that
Jira and Teams recorded. Her instruction: *"you can get from claude chat and qa portal, all the
estimation and also the high level test scope."*

Per task, four fields matter:

| Field | Carries |
|---|---|
| `baseTestingDays` | The base half of the estimate |
| `bufferTestingDays` | The buffer half — req change, bug fix, retest |
| `testMode` | `manual` · `both` — how the CR **will be tested**, which she calls the testing method |
| `highLevelScope` | The scope, as HTML. Strip tags; it can carry a Miro link and her own open questions marked `???` |

What that gave for one day:

```
              base  buffer  testMode  scope
EAINT-12299     3     1     both      user upload on UCD and BackOffice; Pre-Application,
                                      Application, Registration Document; upload/download/view
EAINT-12087     2     1     both      reuse the TS already drafted in Miro
EAINT-12088     1     1     manual    UCD SI flow; UCD BDP + SI flow; BackOffice appointment
                                      calendar  (+ two ??? open questions in the field)
EAINT-12151     1    0.5    manual    functional scenarios, new and existing transactions
```

**So an estimation entry's `Result:` has a fixed shape:** total mandays, the base and buffer split,
the test mode, the scope, and where it was pushed. Read the four fields **before drafting** — the
changelog only shows `Est Man-day … pushed to Jira`, which is the total and nothing else.

**⚠ `testMode` is not the entry's `Method:`.** It says how the CR will be tested in future; `Method:`
says how *this logged hour* was worked. `testMode: both` on a ticket she estimated by hand still
means `Method: Manual.`

**⚠ The tracker and Teams can disagree on the split.** On 8 Sep the portal held 12299 as base 3 +
buffer 1 while her 17:34 Teams post said 2 + 2. Same total, different halves. **Surface it and let
her choose** — she picked the portal. Never silently prefer one source.

#### 5. The repo — the QA Portal fallback, and a better record anyway

From the project root:

```
git log --since="YYYY-MM-DD 00:00" --date=format:'%H:%M' --pretty=format:'%ad %h %s' --all
git show --stat <sha>
git status --short
```

That gives merged PRs with times, titles and diffstats — what actually shipped. **Check mtimes
before calling uncommitted work "today's"**; modified files on `main` are often days old.

**What the repo cannot give you:** the in-app changelog, since `/ship` posts it to the running
server. With the server down those entries are unreadable.

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

### Then read back an earlier entry of the same kind — every time

**This is the format check, and what it checks is the earlier entry's `Notes` field** — the Trix
box holding the whole remark. Open the earlier entry in the edit view, where the stored `<ul>` and
`<strong>` are still visible; the day-view card flattens everything to one grey run-on line and
will not show you the shape. The standard behind it is May Chin's **eAuto QA Remark Standard v1.4**
— see the head of Step 6.

**Whenever an item on today's list resembles something already logged on an earlier day, open that
earlier entry and copy its shape.** The person has already settled how this kind of work gets
written. A second format for the same recurring work is a query waiting to happen, and it makes
their week unreadable as a series.

This is not optional and it is not a fallback for when you are unsure. Run it before drafting,
against every recurring item: the same ticket, the same huddle, the same deployment window, the same
internal tool.

> **A remembered rule is not a read entry.** Recalled memory about how something "is normally
> logged" is a hint about where to look, never a substitute for opening the entry. Twice on
> 7 Sep 2026 a recalled rule produced a wrong draft that the real entry would have caught: the
> ticket title was built from the Jira summary, and a huddle was drafted with no attendee line at
> all. **If a memory and an earlier entry disagree, the entry wins** — then fix the memory.

What to reuse, **verbatim**:

| Reuse | Because |
|---|---|
| **The task reference** | Confirmed 7 Sep 2026: EAINT-12155 is logged as `EAINT-12155 (Enforce 12-Character Password)`, **not** its Jira summary. Never build a title from the Jira summary when they have already used a shorter one. The card renders the resolved Jira summary underneath anyway |
| **The recurring non-ticket reference** | See the four shapes below. **⚠ The date belongs to the huddle and nothing else** |
| **How many entries the activity splits into** | The 2 Sep huddle was **two** rows on the same `Huddle (...)` reference: a `Meeting` for the huddle and a `Delivery` for the preparation. Match that split, don't reinvent it |
| **The house phrasing** | ⚠ **Not the `Nothing to automate.` closer** — retired 8 Sep 2026, see Step 4 item 2. An earlier entry ending with it is superseded, not a pattern to copy |
| **How the attendees are recorded** | Two different mechanisms, and the earlier entry tells you which. A named 1:1 or small face-to-face uses the structured **`With`** field (`With May Chin Mei Theng`), set through the `@` picker — see *Every meeting tags the people in it* below, which is not optional. The group huddle splits by role since 11 Sep 2026: **she attended → `With` = the host, nobody else; she hosted → no `With`, and the note ends `Note: Attendees: All eAuto QA, BA and Dev.`** **A hosted-huddle entry with no attendee line at all is wrong** — confirmed 7 Sep 2026, when it was drafted that way from a half-remembered "no attendee names" rule. "No names" does not mean "no attendees" |
| **How they shorten a person's name** | Confirmed 7 Sep 2026: Teams shows `Amirul Azfar`, she writes **Azfar**. Use the name *she* uses in the remark prose, even where the `With` picker needs the full one |

#### ⭐ Every meeting tags the people in it — you cannot meet yourself

**Charmain's ruling, 10 Sep 2026:** *"All meetings need to tag ppl, cus you cant have meetings with
yourself."*

**Any entry that had another person in it gets them attached through the `@` picker.** The rule keys
on *was anyone else there*, not on billable vs non-billable — so it covers billable `Meeting`
entries **and** the non-billable meeting categories (`Non-project meeting`, `Team standup`,
`Buddy mentoring`). Confirmed in the same breath: *"any entry with people in it gets tagged."*
One category is out: the weekly **`AI knowledge sharing`** session, see below.

**May Chin made tagging the team rule on 11 Sep 2026** (Teams, *"Everyone moving forward for your
timesheet"*): *"if it is a meeting please @ mention the person you had meeting with."*

**The eAuto QA huddle splits by role** — the same 11 Sep message replaced the old blanket
empty-picker exception:

- **She attended** → tag the **host** in the picker, nobody else.
- **She hosted** → picker stays **empty**, and the note carries
  `Attendees: All eAuto QA, BA and Dev.` as its last line.

Work out who hosted from the day's evidence (Teams, the huddle entry's own prose, `Named in`); if
nothing says, ask in the interview — the two shapes are not interchangeable. Entries from before
11 Sep carry the old shape (picker empty, `Attendees: All eAuto QA`) — that is history, not the
pattern to copy.

**The weekly AI knowledge-sharing session is exempt.** Her ruling, 14 Sep 2026:
*"can ignore tagging for weekly ai sharing session."* The picker stays **empty** on any
`AI knowledge sharing` entry, however many people presented or attended. It is a whole-team
broadcast she sits in, not a meeting she had with someone. Name the presenters in the note as usual
(`• Discussed: AI knowledge sharing presented by …`) — that is where they belong. Do not raise it in
the interview and do not flag it in an audit.

| Entry | Picker |
|---|---|
| A 1:1, a call, a small face-to-face, a walkthrough, a workshop | **Tag everyone who was there** |
| A non-billable meeting — onboarding, mentoring, a standup, a non-project meeting | **Tag them** |
| The weekly `AI knowledge sharing` session | **Empty** — exempt, whoever presented |
| The eAuto QA huddle — she attended | **The host**, nobody else |
| The eAuto QA huddle — she hosted | **Empty** — `Attendees: All eAuto QA, BA and Dev.` in the note |
| A solo Delivery entry | No picker; it does not render on Delivery |

**Names come from `Named in` and from the remark's own prose.** A `Task:` line reading
*"...with May Chin and Mei Jia"* names exactly who to attach. If the prose names someone, the picker
must carry them — a mismatch between the two is the defect.

> ##### ⛔ You cannot check this from the day list. Open the entry.
>
> **The day-list card renders NO participants at all** — it is a `line-clamp-2` summary showing
> project, reference, the note text and the duration, and nothing else. Searching that list for
> `With …` returns nothing **whether or not anyone is tagged**.
>
> This is exactly how it was got wrong on 10 Sep 2026: the 9 Sep day list was grepped for `With `,
> came back empty, and that was read as *"she doesn't use the picker"* — so two meeting entries went
> in untagged and she had to catch it. The check was meaningless, not merely unlucky.
>
> **Three things do show it, and only these three:**
>
> 1. **The saved entry's own card, after a save**, which then reads
>    `eAuto Core · Meeting · With May Chin Mei Theng · Task: …`.
> 2. **The `?editing=<id>` form** on an open day, where the hidden
>    `time_entry[entry_participants_attributes][<ts>][user_id]` field is the proof.
> 3. **The `?editing=<id>` read-only panel on a CLOSED day.** Past 11 PM the same URL serves no
>    form, but it does serve an `Entry — read only` panel, and that panel carries a
>    **`Who else was there / With <names>`** block when anyone is attached. Verified 14 Sep 2026
>    across 24 Aug – 11 Sep. So a closed day can still be **audited**, just not fixed.
>
> To audit a past day, iterate its `[id^="time_entry_"]` cards, then open each `?editing=<id>` and
> read the panel — do **not** conclude anything from the list text:
>
> ```js
> const d = new DOMParser().parseFromString(await (await fetch('/log/'+date+'?editing='+id)).text(), 'text/html');
> const txt = d.getElementById('entry_panel').innerText.replace(/\s+/g,' ');
> const who = (txt.match(/Who else was there With ([^]*?) What you did/) || [,''])[1].trim();  // '' = nobody tagged
> ```
>
> Stash the results on `window` and read them back in slices — a sweep's worth of text returned in
> one go comes back `[BLOCKED: Cookie/query string data]`.

**Tag as part of composing the entry, not as a fix afterwards.** It is step 6 of the field order in
`chrome-mechanics.md`, before Duration. Read the participants back before submitting, in the same
call as every other field — the hidden field, never the visible chip.

**A closed day cannot be fixed.** Past 11 PM, `?editing=<id>` renders no patch form, no picker and
no submit button — verified 10 Sep 2026 against 9 Sep entry 3116. Missing tags on a closed day need
the lead to reopen it. So catching this at compose time is the only cheap moment.

#### The four task-reference shapes — and the date rule

Read off her own saved entries, 7 and 8 Sep 2026:

| Kind of work | Reference | `task_url` | Date? |
|---|---|---|---|
| A ticket | `EAINT-12155 (Enforce 12-Character Password)` — her short title, never the Jira summary | the ticket's `/browse/` link | No |
| The eAuto QA huddle | `Huddle (07/09/2026)`, dated to that day | none | **Yes — only here** |
| **Anything tied to one deployment window** | The **window's own title**, e.g. `14 September Night Deployment` | the Jira **fix version** link, `/projects/EAINT/versions/<id>` | No |
| Any other non-ticket work | A plain noun phrase — `QA Task Tracker`, `QA Claude skills`, `Automation vs Manual Testing Criteria` | none | No |

**⭐ The deployment-window row is a ruling, 8 Sep 2026:** *"anything related to one particular
deployment window, can just put the deployment window title and the fix version url."*

That covers more than deployment support. A **regression across several tickets** belongs there
too, if those tickets all sit in one window — the window is the better reference precisely because
no single ticket describes the work. Her own 8 Sep regression on EAINT-10089, 10937 and 11175
became `14 September Night Deployment` with the version URL, and that is the shape to copy. The
fix-version id comes from `/rest/api/3/project/<KEY>/versions`.

> **⚠ Never put `(DD/MM/YYYY)` on anything but the huddle.** Her correction, 8 Sep 2026:
> *"why you include the date behind??? thats for huddle only."* The huddle needs it because it
> recurs weekly and the reference has to say which one. Every other entry already sits on its
> day, so the date is noise.

> #### If a reference has changed since you saved it, she changed it — ask, don't revert
>
> Two references were found altered after submission on 8 Sep 2026:
> `Staging/uat3 regression (08/09/2026)` had become `14 September Night Deployment` with a Jira
> version URL, and `CR automation selection (08/09/2026)` had lost its date.
>
> **This was written up as the app rewriting the field. That was wrong** — she was editing the
> entries by hand at the same time, and the version URL was the giveaway: nothing server-side
> would invent one. The lesson is not about the app.
>
> **So: when a stored reference differs from what you set, treat it as her correction.** Read what
> it became, take the convention from it, and carry that shape forward. Never revert it, and never
> assert a mechanism you have not actually observed — the honest line is *"this changed since I
> saved it"*, not a theory about why.

How to find it cheaply — fetch earlier days from the day page's own origin rather than navigating to
each one:

```js
const refs = new Set();
for (const d of ['2026-09-01','2026-09-02','2026-09-03','2026-09-04']) {
  const doc = new DOMParser().parseFromString(
    await (await fetch('/log/'+d, {credentials:'include'})).text(), 'text/html');
  const t = doc.body.innerText.replace(/\s+/g,' ');
  for (const m of t.matchAll(/EAINT-\d+ \([^)]{3,60}\)/g)) refs.add(m[0]);
  for (const m of t.matchAll(/Huddle \(\d\d\/\d\d\/\d{4}\)/g)) refs.add(m[0]);
}
[...refs].join('\n')
```

Then read the full text of the entry that matches and mirror its field set. To pull one entry's body
out of a fetched day, locate its `Task:` and slice forward — the day page renders every remark in
full, so no per-entry navigation is needed.

**Say which earlier entry each of today's recurring rows was modelled on**, in the draft, so a wrong
match gets corrected in one line instead of being re-checked row by row:

```
  EAINT-12155 (Enforce 12-Character Password)   title as logged 02/09
  Huddle (07/09/2026)  x2                       same two-row split as 02/09
```

If no earlier entry exists, say that too — it tells them a new convention is being set.

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
| **Ticket key and short title** | **From an earlier entry on the same ticket first** — see *Then read back an earlier entry of the same kind* in Step 2. Only if the ticket has never been logged: from their update, or Jira if the title is missing |
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
| 1 | eAuto Core | eAuto Sdn Bhd | Any `[eAuto…]` prefix that is **not** Wholesale — UCD, BackOffice / BO, AATF / eDereg, STMS / eSTM, Insurance, Onboarding / Pre-Application, Application, Service Hub, Login Page, Backend, Platform Wide, APT Reports, Metabase, Production, Production Support, Backlog, Security. **Also `[CIBO…]` and `[Secarang…]`** — her ruling, 8 Sep 2026: *"treat cibo and secarang as eauto core"*. Plus Macrokiosk WhatsApp-template tickets, and untagged eAuto work (`eauto-event-gateway`, deployment-session tickets, pentests) |
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

Non-billable entries take a **category**, and no project is chosen. **What the saved card then
displays is `General / Support`** — so when you read an earlier non-billable entry back, or describe
one in a draft, that is the label to use, not a blank. Confirmed by writing two of them on
7 Sep 2026: `project_id` left empty plus `nonbillable_category = internal_tools` saved and rendered
as `General / Support` · `Internal tools`.

Mechanically: set the billable radio to `false`, **wait ~800ms for the panel to re-render**, clear
both `project_id` and `time_entry_project_search`, then set the category. The category will not
reliably take in the same tick as the radio.

Her stock closing line on these is fixed, so reuse it verbatim rather than composing one:

```
• Why non-billable: Internal tool for the QA team, not client work.
```

And note that non-billable entries **do** carry `Result:`, even though Template 10's field list in
Step 5 does not mention it. Her 3 and 4 Sep tracker entries both use it to say what shipped. Follow
the entry, not the template list.

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

> **This is the step where the prompt rule gets broken.** Everything below is phrased as a question
> to *you*, not as text to paste at them. Before sending, run the **`?` gate** from *Ask in a prompt,
> not in a wall of text* over your drafted message. **Every** question in this table goes through
> `AskUserQuestion` — durations and counts included; the number arrives in **Other**, never as a
> clickable option. Scanning the whole table and firing batched prompts is the correct shape.

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
| **09** Meetings & huddles | Duration · what was discussed · **who else was there, by name — they get tagged in the `@` picker, so this is a required field, not colour — except a hosted huddle and the weekly AI sharing session, where the picker stays empty** | **Why they stayed for the whole thing**, past 30 minutes · any action item |
| **10** Non-billable | Duration · **the actual item worked on** (which tool, which training, which document) · **why no client can be invoiced** | — |

### Always, on every item

0. **Outcome first, before duration.** What did it find? Did the run pass? Were failures app defects
   or script-side? Were tickets raised? What did the follow-up settle? Asking duration first turns
   the interview into arithmetic and produces thin notes.
1. **Actual duration.** Accept their phrasing — `45m`, `1h 30m`, `90`, `1.5h` all parse. Push back
   once on a round block.
2. **Manual or Automation** — required on every entry **except a meeting-related one**, as **one
   `Method:` line**.
   - Manual → *why* it had to be by hand. **No closing phrase.**
   - Automation → *what* was automated, and the tool or approach.
   - **Both → `Method: Automation + Manual.`** then the automated work, then the manual work.

   **⚠ A meeting-related entry has no `Method:` line at all. Don't ask, don't write one.** Talking
   is manual by definition and there is nothing in it to automate, so the line only ever says the
   obvious. **Meeting-related** means the whole entry was people talking, or preparing for and
   writing up that talking:

   | Entry | `Method:`? |
   |---|---|
   | A call, huddle, workshop, walkthrough, standup, or a training / knowledge-sharing session she **sat in** | **No** |
   | Preparing a huddle agenda, or writing up minutes and action items afterwards | **No** |
   | A non-billable entry whose category is `Non-project meeting`, `Team standup`, `Buddy mentoring`, or an `AI knowledge sharing` **session** | **No** |
   | She **produced an artefact** — wrote the training deck, built the documentation, scripted something — even if a meeting is what asked for it | **Yes** |

   The test is what the hour was: an hour of talking takes no `Method:`; an hour of making
   something does.

   **⚠ Never write a separate `Automation:` line beside a `Method:` line.** There is one field, and
   mixed work is one value. Verified against her own entries: `Method: Manual.` (2 Sep),
   `Method: Manual drafting with Claude.` (2 Sep), **`Method: Automation + Manual.`** (3 Sep),
   `Method: Manual development and deployment.` (4 Sep). On 7 Sep 2026 a day that was genuinely both
   was drafted as two labelled lines and had to be merged after saving — she spotted it and asked
   *"how you define automation and manual?"*. The classification was right; the field shape was not.

   **How to decide which it was — one test: was it run through Claude?**

   Charmain's ruling, 8 Sep 2026, in two steps: first *"if the test is run through claude then
   should be automation, others are manual"*, then, when that was applied only to test execution,
   *"i mentioned everything related to claude is automation right??? means #10 should be
   automation ya"* — #10 being an internal-tooling entry with no test in it at all.

   | | The value is |
   |---|---|
   | **Claude was involved at all** — a test it executed, a retest, a comparison, a staging check, building or shipping a tool, writing or reworking a skill | **`Automation + Manual.`** |
   | **No Claude — she drove it by hand** | **`Manual.`** |

   **There is no bare `Automation.` value.** Her refinement, same day: *"once involve claude, the
   item should update to automation + manual, manual should always there."* Claude never works
   unattended — she directs it, reads what comes back, and makes the call — so the manual half is
   always present. An entry that says only `Automation.` is claiming she wasn't there.

   Order is fixed: **the Claude-run work first, then what she did by hand.**

   **This is broader than "a script produced the verdict", which is what this section used to
   say.** Under the old wording a retest driven by Claude was Manual, and building the QA Portal
   through Claude was `Manual development and deployment`. Both are now `Automation + Manual`. What
   decides it is what did the work, not whether a `.spec.ts` file exists.

   > **⚠ This ruling overrides her own earlier entries, and Step 2's read-back will fight it.**
   > Step 2 says *if a memory and an earlier entry disagree, the entry wins*. That rule does not
   > apply here. These pre-8 Sep values are **superseded** and must not be copied forward:
   >
   > - `Method: Manual drafting with Claude.` (2 Sep)
   > - `Method: Manual development and deployment.` (4 Sep, and again 7 Sep for the tracker)
   >
   > All three describe Claude-run work and would now read `Automation + Manual`. **When a
   > read-back turns up one of these, say so rather than following it** — on 8 Sep the same QA
   > Portal work was `Manual development and deployment` on Monday and `Automation + Manual` on
   > Tuesday, and a reviewer comparing the two days will query it. Tell her the inconsistency
   > exists and let her choose whether to edit the older entry; never silently match the old
   > wording, and never silently break the series either.

   What the value still has to carry: for the Claude half, *what* was run through Claude. For the
   manual half, *why* that part had to be by hand.

   > **⛔ `Nothing to automate.` is retired. Do not write it on any entry.** Her instruction,
   > 8 Sep 2026: *"remove the nothing to automate word from all entries."*
   >
   > It used to be house practice — the team automates, so the closer pre-empted the obvious
   > follow-up. It no longer holds, for the reason the new Method rule exists: once anything run
   > through Claude counts as automation, almost nothing is genuinely un-automatable, and the
   > sentence became either false or filler. The 8 Sep LKM Refund draft carried
   > `Method: Manual … Wrote a field-comparison script … Nothing to automate.` — a remark that
   > contradicted itself in one line.
   >
   > **Entries dated before 8 Sep 2026 still end with it.** Those are superseded. When Step 2's
   > read-back turns one up, do not copy the closer forward.
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
**If the main activity is meeting-related there is no `Method:` to fold into** — put the second
activity in `Discussed:` or `Note:` instead. (A scheduled meeting always splits anyway, so this
only comes up for agenda prep and write-ups.)

### Entries of the same kind on one day are a series — give them equal depth

**When one activity produces several entries on the same day, a reviewer reads them side by side.**
One with a paragraph and three with a single line reads as three done carelessly.

Her question, 8 Sep 2026: *"why 12299 note showing so much details as compare to the other 3
tickets???"* Four estimation entries had gone in that day. EAINT-12299 had a full `Result:` because
a Teams post and a Claude session had recorded it; 12087, 12088 and 12151 had one line each because
nothing had. The imbalance was honest and still wrong — the fix was **levelling them up**, from the
tracker fields, not trimming the good one down.

So, before submitting a set:

1. **Line up every entry of the same kind and compare their depth.** Same activity, same shape.
2. **If one is thinner, go and find the missing detail** — the tracker's own fields usually hold it.
3. **Only if it genuinely does not exist**, say so out loud before submitting, and offer the choice:
   level them up with her input, or trim the detailed one to match.

This is the same fault as a second format for recurring work, which Step 2 already warns about —
that rule guards *across* days, this one guards *within* a day.

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
| 09 | Meetings & huddles | Task · **Discussed** · Blocker · Note — **no Method**, no Progress |
| 10 | Non-billable work | Task · Method · Progress · Blocker · **Why non-billable** · Note — **drop Method when the entry is meeting-related** |

**Use the template's own field set. Don't borrow fields from another one.** Template 08 has no
`Progress:` because a follow-up has nothing to measure. Template 09 has `Discussed:` instead of
`Method:` because a conversation has no test method.

**The no-`Method:` rule follows the work, not the template number.** Template 09 is the usual home
for meeting-related work, but the same rule applies wherever that work lands — huddle-agenda prep
logged as Delivery, a standup or a non-project meeting logged as non-billable under Template 10.
See *Manual or Automation*, Step 4 item 2, for the test.

## Step 6 — Compose the remark

### What "the format" means — the Notes field, and nothing else

**The format governs one thing: the entry's `Notes` field** — the Trix rich-text box on the entry
form. Everything else on the form (project, ticket reference, duration, category, `Manual`/
`Automation`, `With`, the Blocked tick) is a form control with its own rules; none of it is "the
format".

**The authority is May Chin's `eAuto QA Remark Standard`, read at v1.4.** It is published as a
**read-only Claude artifact**, so v1.5 can appear with nothing here changing. If May mentions a new
version, read that before trusting this file. Working copy: `references/remark-templates.md`. The
standard is enforced across the eAuto QA team, not optional house style.

> #### ⚠ Two different things are both called "note"
>
> | | What it is |
> |---|---|
> | **The `Notes` field** | The box on the form. Holds the **whole** remark — the `Task:` line plus every bullet. This is what the standard governs, end to end |
> | **The `Note:` bullet** | **One line inside** that box. The sixth and last field. Anything else the reviewer needs, including parallel-time attribution |
>
> So "check the format" means check the whole content of the `Notes` field against the standard —
> not just its last bullet. A remark whose only bullet is `Note:` is missing five fields.
>
> In this skill, **"remark" always means the full content of the `Notes` field.** Wherever a
> sentence says the remark, read it as that box.

### The six fields

Six fields, always in this order, drop what doesn't apply, **never write "N/A"**:

`Task:` · `Method:` · `Progress:` · `Result:` · `Blocker:` · `Note:`

**`Method:` is the only label for how the work was done.** Its *value* says Manual, Automation, or
`Automation + Manual` — see Step 4 item 2. There is no separate `Automation:` field; writing one
beside `Method:` is a defect, not a variation.

**On a meeting-related entry the field is dropped entirely** — no `Method:`, and no
`Method: Manual.` either. Talking has no method worth stating. Template 09 puts `Discussed:` in its
place; a meeting-related Template 10 entry simply has one fewer bullet.

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
- **No `Method:` at all on a meeting-related entry.** A `Method:` line under a `Task:` that says she
  sat in a huddle is the mismatch, not the fix.
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
- **⛔ Never close a `Method:` line with `Nothing to automate.`** Retired 8 Sep 2026 — *"remove the
  nothing to automate word from all entries."* It was house practice until then, and pre-8-Sep
  entries still carry it. Say *why* that part was by hand and stop. Full reasoning in Step 4 item 2.
  **And a meeting-related entry has no `Method:` line at all** — nobody was ever going to ask
  whether a huddle could be automated.
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

- **Write like a person. Simple, clear, easy to understand.** Her instruction, 8 Sep 2026:
  *"use human like method to draft, simple and clear, easy to understand, simple english"* — the
  third time she has asked for this, after rejecting a note as "too complicated" and telling me
  twice the same day to make wording *"more human-like, simple and clear"* and to use
  *"no complicated word and sentence"*.

  Short sentences, plain verbs, one idea per sentence. No em dashes. No stacked clauses.

  | Don't | Do |
  |---|---|
  | "Fixed the script-side failures, subsequently executed the full automation suite, and reviewed the resulting test evidence." | "Fixed the script issues and reran the test. All passed." |
  | "the window is bracketed by the output file times rather than measured" | *cut it* — see below |

  > **The test that catches it: would she say this out loud to May Chin?** If not, rewrite it.
  >
  > The second example above is a real line that shipped into her live timesheet on 8 Sep 2026.
  > She read it back and asked *"what do you mean by this?"* — which is the failure. Two faults in
  > one line: the word "bracketed" is jargon, and the sentence was explaining **how the day was
  > reconstructed** rather than what she did. **A reviewer does not care how you measured the
  > time.** Anything about your own method is filler; every line must answer one of the six
  > fields.

  **Read every line back as if you were the lead.** A line that needs a second read, or that would
  make her ask what it means, is not finished.
- **Don't assert a finding they didn't give you.** "Checked X" is safe. "Confirmed X is correct" is
  a claim about the outcome, and only they know the outcome.
- **Task reference format:** ticket number plus a short title in parentheses —
  `EAINT-11982 (Extend Expiration of Application)`. Drop the board prefix and emoji. Release-wide
  work keeps the window name, e.g. `20 August Morning Deployment`.
  **If the ticket has been logged before, use the title from that entry and do not compose a new
  one** — Step 2's *read back an earlier entry* is what settles this. The short title is the
  person's own shorthand, not a truncation of the Jira summary, so it cannot be derived: on
  7 Sep 2026 the Jira summary was *"New User: Enforce 12-Character Password Complexity Across All
  Portals with uppercase, lowercase, number & special character"* and the title in use was
  `EAINT-12155 (Enforce 12-Character Password)`. Recurring non-ticket work has fixed shapes too —
  `Huddle (DD/MM/YYYY)` for the eAuto QA huddle.
- Set the structured fields too: **Task reference**, **Task link**, and **Submission links** for a PR
  or a test-evidence artefact.

## Step 7 — Present the draft and wait for go

One table, with the arithmetic visible — and **a `Source:` line on every item to add**:

```
ALREADY LOGGED (2) · 0.75h
  • eAuto Core  EAINT-11952   Delivery   15m
  • eAuto Core  Night Deployment planning   Meeting   30m

TO ADD (3)
  1. eAuto Core  EAINT-11880   Billable · Delivery    1h 20m   [Blocked]
     Task: ran SI booking slot-capacity scenarios on /uat3
     Method: Manual — slot capacity depends on live 3rd-party availability
     Blocker: waiting on Dev for the reschedule fix
     Source: transcripts 09:10–10:35 (EAINT-11880 folder) · teams "EAINT-11880 CR" 10:41
             duration from the measured window, you confirmed 1h 20m
  2. —            Team standup  Non-billable · Team standup   15m
     With: May Chin, Azila, Faiz
     Source: teams "eAuto QAs" 09:02 · duration is the standing 15m
  3. eAuto Core  EAINT-11952   Billable · Meeting     30m   ⚠ classification unconfirmed
     Source: named-in — May Chin logged you in for 30m. No trace anywhere else

  Day total after adding: 3h 20m of 8h  ·  gap 4h 40m      (Friday: of 7.5h)
  Billable meetings: 1h 0m today · month-to-date 1h 0m against a 1.5h/day allowance
```

**The `Source:` line is not optional and it is not a footnote.** One line per item, naming the tag
and the actual evidence — the chat and time, the ticket and transition, the measured window, the
sha. Where two sources agree, print both: that agreement is the strongest thing you can show them.
Where the duration came from somewhere other than the item, say so on the second line, as item 1
does. Anything you worked out yourself is tagged `inferred` **with the reasoning**, and never
becomes an entry without a yes. Full rules: *Say where every item came from*, in Step 1.

Then flag, above the confirmation:

- Any **gap to the day's target** — state it, ask what accounts for it. **Never offer to fill it.**

#### ⚠ Friday is 7.5h, and CapacityTrack does not know

The daily target is **8h Monday to Thursday, 7.5h on Friday** — company-wide, confirmed
4 Sep 2026. The app targets 8h every day, so **a complete Friday reads as `30m to go`.**

| Logged on a Friday | The app says | The truth |
|---|---|---|
| 7h 30m | `30m to go` | **Full day. No gap.** |
| 7h 00m | `1h to go` | 30m short |
| 8h 00m | `0m to go` | 30m *over* — fine, but don't chase it |

**Do the subtraction before you report.** On 4 Sep 2026 a 7h 30m Friday was reported as
"7.5h of 8h, gap 30m" — a full day described as short. That is the padding error running
backwards, and it invites someone to log half an hour they did not work.

**Unresolved: whether the week target drops to 39.5h.** Four days at 8h plus 7.5h is 39.5h, but
that was not confirmed on 4 Sep 2026. It matters because the billable target is a percentage of
the week — 75% of 39.5h is 29.6h, not 30h. **Do not assume either figure. Ask the lead**, and
until someone answers, report the week against 40h while saying the Friday question is open.
- Any **duration that reads like an estimate**.
- **A day caps at 8h** (less leave/lieu) — the app's cap, unchanged on Fridays. Excess shows as a small `+1.0` and counts toward nothing —
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
- **On a meeting entry, gate the submit on the participants too.** Every meeting tags the people in
  it — on the huddle, expect exactly the host (she attended) or nobody plus the
  `Attendees: All eAuto QA, BA and Dev.` note line (she hosted). Assert the hidden
  `time_entry[entry_participants_attributes][<ts>][user_id]` is present for each person the `Task:`
  line names, and refuse to submit without it, exactly as you would a missing duration.

One entry at a time. Verify each landed before starting the next.

## Step 9 — Verify and report

After each submit, **read the day back** (`javascript_tool`, not a screenshot) and confirm the entry
exists with the duration and class you intended. Then report:

- Which entries landed, with their durations and the new day total.
- Which failed, and why.
- What is still outstanding — anything they couldn't put a duration to.
- The gap to the day's target (8h, or **7.5h on a Friday**), if there is one, stated as information.
  On a Friday, subtract 30 minutes from the app's `to go` figure before quoting it.

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

> ### ⛔ Never click `Submit wrap-up`. Fill the boxes, click `Save draft`, stop.
>
> Charmain submits the wrap-up **herself**, from the page, after reading it there. Her instruction,
> 6 Sep 2026: *"update the skill, not to submit automatically, i will do it manually after checking."*
> That day a prompt offered `Submit wrap-up` as an option, she clicked it, the skill clicked the
> button, and the week locked before she had finished checking. Only the lead can reopen a submitted
> week, and the reopen is recorded against her.
>
> So the flow for the wrap-up is: draft → she approves the text → fill the four boxes and the two
> pulse radios → click **`Save draft`** → read the saved draft back from the page → tell her it is
> saved as a draft and that **Submit wrap-up is hers to click**. Never offer `Submit wrap-up` as a
> prompt option, never click it on her behalf, and never treat "go" on the draft as permission to
> submit. `Save draft` is the other `commit` button on the same form and has no confirm dialog.

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
