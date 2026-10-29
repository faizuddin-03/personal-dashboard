# eAuto QA Remark Standard — the ten templates

**Encoded from `eAuto QA Remark Standard v1.4`, read 28 Aug 2026.** Owner **May Chin**, who
publishes it to the eAuto QA team. **May's document is the authority — this is a working copy.**
It is published as a read-only artifact, so a v1.5 can appear without anything here changing.
If May mentions a newer version, read that before trusting this file.

Five things below are **local conventions the eAuto QA team layers on top of v1.4**, not part of
the published standard. They are marked **[LOCAL]** where they appear. If you are on a different
team, or unsure, check with your lead before following them.

- Percentages carry **one decimal place**, rounded to nearest. v1.4's own examples have none.
- The `- PASS only` / `- DONE` suffix on `Progress:`.
- Four extra bullets: `Scenarios:` `Coverage:` `CR status:` `Tickets:`.
- **v1.4's `Category:` line is dropped** from non-billable remarks — the form's dropdown already
  carries it. In its place the `Task:` line must **name the actual item worked on**, and an
  `Others` category must be spelled out in the remark. See Template 10.
- **`Method:` is dropped on any meeting-related entry**, not only on Template 09. Talking is
  manual by definition and nothing in it can be automated.

---

## The six fields

Every template is built from these, always in this order. Each template says which it needs.
Leave out any that doesn't apply — **do not write "N/A" on every line**, it is noise for the reader.

| Field | What goes in it |
|---|---|
| `Task:` | What you did, and on which ticket or module. Never just the ticket title. |
| `Method:` | How you did it. **[LOCAL] Claude involved at any point → `Automation + Manual.`, Claude-run work first; done entirely by your own hand → `Manual.`** There is no bare `Automation.` — Claude never runs unattended. No `Nothing to automate.` closer. **Dropped on a meeting-related entry** — see below. |
| `Progress:` | How far the **whole task** has got, with the count in brackets. |
| `Result:` | What came out of it. Pass/fail counts, tickets raised, or what was agreed. |
| `Blocker:` | What is holding the work up. If you write this, **also tick "Blocked on this task"**. |
| `Note:` | Anything else the reviewer needs, including parallel time attribution. |

**Use the word `Result`, never `Outcome`.** One word for one thing keeps entries scannable. This
replaced the old `Outcome:` bullet across this skill on 28 Aug 2026.

### ⚠ [LOCAL] No `Method:` on a meeting-related entry — 8 Sep 2026

**If the entry is people talking, there is no `Method:` line.** Not `Method: Manual.`, not
`Method: Manual, nothing to automate.` — the field is left out. Talking is manual by definition and
no part of it can be automated, so the line only ever restates the obvious and costs the reviewer a
line of reading.

Meeting-related means:

| Entry | `Method:`? |
|---|---|
| A call, huddle, workshop, walkthrough, standup, or a training / knowledge-sharing session you **sat in** | **No** |
| Preparing a huddle agenda, or writing up the minutes and action items afterwards | **No** |
| A non-billable entry whose category is `Non-project meeting`, `Team standup`, `Buddy mentoring`, or an `AI knowledge sharing` **session** | **No** |
| You **produced an artefact** — wrote the training deck, built the documentation, scripted something — even if a meeting is what asked for it | **Yes** |

The test is what the hour was: an hour of talking takes no `Method:`; an hour of making something
does. The rule follows the work, not the template number — it applies to Template 09, to
huddle-agenda prep logged as Delivery, and to a meeting-category Template 10 entry alike.

### Progress rules

- **⚠ [LOCAL] Count PASSED scenarios only, never executed ones.** Ruling of 3 Sep 2026. The
  numerator is how many passed; the denominator is the task's full scenario count. 50 run of 155
  with 23 passing is `14.8% (23 of 155 scenarios passed) - PASS only`, **not**
  `32.3% (50 of 155 scenarios executed)`. A scenario that ran and failed moved your day forward,
  not the ticket.
- **Measured against the whole task, not your day.** Three hours worked but the ticket half
  passed is `50.0%`, not 100%.

  > **⚠ "I finished what I did today" is not 100%.** Charmain's correction, 8 Sep 2026:
  > *"the progress field, actually referring to the progress of the whole entry, for example the
  > lkm refund, i actually havent done the review and checking on the sit test script, it is
  > around 70% will continue tomorrow, recheck for other entry as well."*
  >
  > The LKM Refund entry had been drafted `100%` because the day's session had wrapped up and the
  > deliverables were produced. The **task** was 70% done. Two hours of good work on a task that
  > is two-thirds through is still 70%.
  >
  > **Ask for the whole-task figure on every entry that has a `Progress:` line.** Never derive it
  > from whether the day's work reached a stopping point, and re-check the ones you drafted before
  > this occurred to you — she had to say *"recheck for other entry as well"*.

- **A completed-but-unsettled task takes a `to be confirmed`.** Where the work is done at the
  current scope but a pending decision could reopen it, say both. Her 8 Sep EAINT-12155 entry:
  `Progress: 100% at the current state, to be confirmed after tomorrow's discussion with the BA
  and May Chin.` Sign-off had happened and Jira had moved, then a new requirement landed the same
  evening. Bare `100%` would have been wrong by the end of the day.
- **Always put the count in brackets:** `14.8% (23 of 155 scenarios passed)`, not `14.8%`.
  **The exception is when no honest count exists** — then a bare percentage is correct, because
  inventing a denominator to satisfy the format breaks Golden Rule 1. Confirmed 8 Sep 2026: asked
  whether to add a count to the LKM Refund's 70%, she chose **"Leave it as 70%"**. Ask; never
  manufacture the bracket.
- **[LOCAL] One decimal place, rounded to nearest.** `77.8%`, `31.9%`, `60.0%`. The eAuto QA team
  writes one decimal. v1.4's own examples have none and some people use two — match your team.
- **Exact 100 is written `100% (completed)`**, not `100.0%`. Do not write 100% and then keep
  logging the same task tomorrow, because your lead will query it.
- **[LOCAL] The `- PASS only` suffix goes on EVERY `Progress:` line — it is not conditional.**
  Since the percentage counts passes only, the suffix is what says so. This retired the old rule
  (*"add it only when the tester has said so"*) on 3 Sep 2026. Do not ask; add it.
- **The run count belongs in `Result:`, not `Progress:`.** `50 scenarios run, 23 passed and 27
  failed`. Without it a low `Progress:` reads as though you barely started.
- Count scenarios or cases, never effort. "24 of 40 scenarios", not "about half done".

### [LOCAL] Four extra bullets the eAuto QA team adds

v1.4's six fields are a minimum, not a cap. Folding these into `Note:` would turn it into a
paragraph and break v1.4's own "important facts first" rule, so they stay as their own bullets.

| Bullet | Carries | Use when |
|---|---|---|
| `Scenarios:` | How many ran, and the TS range — `29 run (TS1–TS38)` | You executed test scenarios |
| `Coverage:` | The TS ranges grouped by area | The run spanned named groups |
| `CR status:` | `Ready for testing on uat4` · `Not ready for testing` · `In testing` · `On hold` · `Deployed to production` | Every ticket entry |
| `Tickets:` | Related ticket keys that have **no entry of their own** | Never when the sibling got its own row |

### ⚠ [LOCAL] Two tickets means two rows — 3 Sep 2026

Work that covered EAINT-12217 and EAINT-12218 was logged as two 30m rows against 12217. It was
split: *"both 12217 entry actually included 12218, i think you can divide the duration to 2,
the updates are all the same."* Result: **four rows of 15m**, one per ticket per activity.

When you split:

1. **Divide the duration evenly** unless told otherwise.
2. **The `Task:` line takes that row's own ref string**, character for character.
3. **Rewrite every ticket-bearing field to that ticket only** — *"make sure other field showing
   the respective ticket info only."* The 12217 row's `Result:` reads `3 mandays, 2 base and
   1 buffer`, not both tickets' figures. Same for `Progress:`, `Scenarios:`, `CR status:`.
   `Discussed:` and `Attendees:` stay identical — people and topics are not ticket data.
4. **Drop `Tickets:` from all the split rows.** The circularity: *"whats the purpose of showing
   this field... 12218 under 12217 and viseversa."* Keep the bullet only for tickets with no row
   of their own — one the dev split off, or the contents of a deployment window.

Why it matters beyond tidiness: the report breaks billable time down by project **and ticket**,
so a ticket that never reaches a `Task reference` field does not appear in it at all.

---

## Combine or split?

Real work does not arrive in neat blocks. You draft scenarios, message Dev to confirm something,
then carry on drafting. **That is one entry, not two** — as long as the whole block belongs to the
same ticket and is billable to the same project.

When you combine, pick the **main activity** for the `Task:` line and use that template. Fold the
second activity into `Method:`, and put what it produced into `Result:`. If the main activity is
meeting-related there is no `Method:` to fold into — use `Discussed:` or `Note:`.

| Combine into one entry when… | Split into two entries when… |
|---|---|
| Both parts belong to the **same ticket**, and the coordination was part of getting the main work done | The parts belong to **different tickets or projects** |
| Both are **billable** to the same project | One is **billable** and the other **non-billable** — e.g. client scripts and shared framework work the same afternoon |
| You kept **switching between the two** all block, so you cannot honestly split the minutes | One part was a **scheduled meeting** with its own start and end. That gets its own Meeting entry |
| The second activity was **short** and not worth its own line | Each part is a **substantial block of hours** the lead would want to see separately |

Three limits:

- **Do not stretch this into a whole-day entry.** Two related activities on one ticket is fine.
  Eight hours of unrelated work on one line is not.
- **If you cannot tell which activity was the main one, split it.** A `Task:` line describing three
  things equally is harder to read than two clean entries.
- **When in doubt about billable vs non-billable, always split.** Your lead cannot classify a mixed
  entry and will have to query it.

### Never combine on your own — ask first

**A split is the safe default. Combining is the person's call, not yours.** When two items on the
day meet every condition in the left-hand column, do not merge them silently. Show both, say why
they look combinable, and ask.

```
These two look combinable — same ticket, both billable to eAuto Core,
and the follow-up was part of getting the drafting done:

  A. EAINT-11759  drafted test scenarios              2h
  B. EAINT-11759  confirmed scope with Dev and BA     30m

Combine into one 2h 30m entry, or keep them separate?
```

Whichever they pick, redraw the draft table before submitting. The split conditions on the right
are **not** a prompt — if any one of them is true, split it and say so; there is nothing to ask.

Worked example — Template 02 (drafting) combined with Template 08 (liaising):

```
Task: Drafted test scenarios for EAINT-11759 (Securing Insurance - support
number change) and confirmed the scope with Dev and BA.
   • Method: Followed up with Dev on the CTA scope and checked the latest
     requirement with BA, then wrote the scenarios. Manual drafting.
   • Progress: 70.0% (14 of about 20 scenarios drafted)
   • Result: Scope confirmed with Dev and BA. BA to provide MacroKiosk staging
     access before testing can start.
   • Blocker: Waiting on BA for MacroKiosk staging access.
   • Note: With Jin Siang (Dev) and Lim YiLin (BA).
```

---

## TEMPLATE 01 — Study ticket and estimate testing effort

Reading a new ticket to work out what testing it needs and how long. Also updating an estimate.

Fields: `Task` `Method` `Progress` `Blocker` `Note`

```
Task: Studied EAINT-12166 (Service Hub - Enable DO Creation for Device
Purchase) and provided the QA testing estimation.
   • Method: Read the ticket and the SRD, checked the test scope and coverage
     with Dev, then listed out the test scenarios.
   • Progress: 100% (completed)
   • Blocker: Requirement for the interim document upload step is unclear,
     waiting for BA's reply.
   • Note: Estimate 4 testing mandays (1 QA). Base 3 days, buffer 1 day. Will be
     tested by automation script plus manual. Estimate shared in the QA group
     and updated on the planning board.
```

- **The `Note:` must carry the estimate itself**, in this shape:
  `Estimate 4 testing mandays (1 QA). Base 3 days, buffer 1 day.` An estimate entry with no number
  does not show that the studying produced anything.
- **Say where you recorded it** — QA group, planning board, or the ticket. That is what lets your
  lead check without asking.
- If you only read the ticket and no estimate was possible, say so plainly: *"Read through the
  ticket to see the current scope. Nothing to test yet, so no estimate provided."*
- If updating an existing estimate, say what changed and why: *"Raised the estimate from 1 to
  1.5 mandays because the SIT script has to be re-run."*
- `Progress:` is only needed if the study ran across more than one day.

## TEMPLATE 02 — Draft test scenarios and test cases

Writing scenarios or cases. Also reviewing someone else's cases or a vendor's SIT script.

Fields: `Task` `Method` `Progress` `Result` `Blocker` `Note`

```
Task: Drafted test scenarios for EAINT-12131 (Service Hub - CSE Special Remark
on Device Purchase transaction details).
   • Method: Wrote positive, negative and boundary scenarios against the SRD.
     Recorded in the eAuto test case sheet.
   • Progress: 60.0% (24 of about 40 planned scenarios drafted)
   • Note: Will send to May for review once the remaining scenarios are done.
```

- **Say where the scenarios are stored** — test case sheet, Jira, wherever the team keeps them.
- **Say which kinds of cases you covered** — positive, negative, boundary, end-to-end. "Wrote test
  cases" alone is too thin.
- Reviewing someone else's document: say whose, and what feedback you gave. *"Reviewed 2PJ's latest
  SIT test script, compared it against the previous version, listed the changes and gave feedback
  to the BA."*
- If you liaised with Dev or BA while drafting, keep it as one entry — see **Combine or split?**

## TEMPLATE 03 — Prepare test data and test environment

Getting things ready before testing starts: creating data, requesting access or roles, setting up
an environment for a run.

Fields: `Task` `Method` `Progress` `Blocker` `Note`

```
Task: Prepared the test data and environment for EAINT-12131 (Service Hub -
CSE Special Remark).
   • Method: Created 12 biometric device purchase records in uat1 and requested
     CSE role access from Dev.
   • Progress: 100% (completed, ready for execution)
   • Note: The data set can be reused for the September regression run.
```

- **Always name the environment** — uat1, Staging, SIT.
- **If the preparation was for the shared test server rather than one client's release, say so.**
  Keeping a shared server alive is non-billable company infrastructure; preparing data for one
  client's release is billable work on that project. Without this the lead has to query it.
- **Do not use this template for writing or fixing automation script logic.** That is Template 04.
- If it took a few minutes inside a larger block, mention it in that entry instead of making one.

## TEMPLATE 04 — Automation scripting

Writing, refining, debugging or stabilising an automation script. The script is the output.

Fields: `Task` `Method` `Progress` `Result` `Blocker` `Note`

```
Task: Wrote and refined the automation script for EAINT-12094 (STMS Bulk
Payment SSM Checking enhancement).
   • Automation: Playwright with TypeScript, scripted with Claude. Runs against
     uat1 on our own staging.
   • Progress: 50.0% (6 of 12 planned scripts written and passing locally)
   • Result: Several re-runs needed to debug and stabilise the script. The
     earlier failures were script issues, not app defects.
   • Note: These scripts are for the eAuto client suite, not the shared
     automation framework.
```

- **The `Note:` must say who owns the script** — either `for the eAuto client suite` or
  `for the shared automation framework or CI pipeline`. This is the most important line in the
  entry: scripts for one client's application are **billable delivery**; the shared framework and
  the CI pipeline are **non-billable internal tools**.
- **If one block touched both, split it into two entries.** Merged, the lead can classify neither.
- Count scripts, not effort. "6 of 12 scripts", not "half done".
- **When a run fails, say whether it was a script problem or an application defect.** An app defect
  should produce a QA-Issue ticket; a script problem should not.

**Why this is separate from Template 03:** data and environment prep is short one-off setup.
Scripting is usually the largest block of hours in an automation week, runs across days, and is the
one activity where the billable answer depends entirely on who owns the output. Its own template
means those hours never hide under a vague "preparation" label.

## TEMPLATE 05 — Execute testing

Running tests, manual or automation. Also retesting a fix, following up a QA-Issue, checking
evidence from an automation run, and a small ad-hoc check Dev asked for.

Fields: `Task` `Method` `Progress` `Result` `Blocker` `Note`

```
Task: Executed functional testing on EAINT-12131 (Service Hub - CSE Special
Remark).
   • Method: Manual testing on Staging, Chrome. Focused on the submission and
     approval flow.
   • Progress: 77.8% (14 of 18 test cases executed)
   • Result: 11 passed, 3 failed. Raised EAINT-12160, EAINT-12161, EAINT-12162.
   • CR status: In testing.
   • Blocker: Cannot test the payment step because the payment gateway in
     Staging is down.
   • Note: Remaining 4 cases will continue tomorrow.
```

Variant — automation run and evidence check:

```
Task: Ran the automation script for EAINT-12094 (STMS Bulk Payment SSM Checking
enhancement) and checked the evidence.
   • Automation: Run against uat1 on our own staging. Went through each
     scenario's evidence against the expected result.
   • Progress: 100% (22 of 22 scenarios passed) - PASS only
   • Result: 22 scenarios run, all passed. No defects. Testing complete.
   • CR status: Deployed to production.
   • Note: The script runs unattended, so this ran in parallel with EAINT-12131.
     4h of the shared 7h window is attributed here. Evidence uploaded to
     SharePoint.
```

- **Always state the type of testing** — functional, regression, retest, smoke, exploratory.
  "Testing" alone is not enough.
- **Always state the environment and browser** — Staging or uat1, and Chrome. Same information the
  QA-Issue tickets already carry.
- **`Result:` is required, and must name the tickets you raised.** If nothing was raised, say so
  plainly: *"All 18 cases passed, ready for release."*
- **When an automation run fails, say whether it was a script problem or an app defect.** Same rule
  as Template 04.
- For a small ad-hoc check, say it was ad-hoc and that no full testing was done: *"Dev asked for a
  quick check before production. One-off check for 2 users, no full QA testing needed."*

## TEMPLATE 06 — Deployment preparation

Work done **before** a deployment: building the production regression checklist, arranging QA
support cover, following up whether tickets are ready.

Fields: `Task` `Method` `Progress` `Result` `Blocker` `Note`

```
Task: Prepared QA support for the 21 August morning deployment.
   • Method: Built the production regression checklist, confirmed the QA support
     roster, and followed up with Azila on ticket readiness.
   • Progress: 100% (completed)
   • Result: All tickets ready for production except EAINT-12055, which is still
     in testing.
   • Note: I will be the one supporting the morning deployment.
```

- **Name the deployment and its date in the `Task:` line**, exactly as the deployment is named —
  `21 August morning deployment`. This is what lets every entry about one deployment be matched up.
- **`Result:` is required.** Say whether tickets are ready, and name any that are not.
- **Say who is covering the support**, so it is clear the roster was settled.

## TEMPLATE 07 — Deployment support and production monitoring

Morning support only — supporting a morning deployment as it happens, or the morning check on
production after a night deployment.

Fields: `Task` `Method` `Progress` `Result` `Blocker` `Note`

Variant A — supporting a morning deployment:

```
Task: Supported the 20 August morning deployment.
   • Method: Ran the production regression checklist on production and monitored
     transactions during and after the release.
   • Progress: 100% (completed)
   • Result: All checks passed. Nothing found.
   • Note: Test evidence uploaded to SharePoint for EAINT-12054, EAINT-12131 and
     the production regression.
```

Variant B — morning check after a night deployment:

```
Task: Morning check after the 17 August night deployment.
   • Method: Monitored the P1 modules (STMS, eSTM) on production for abnormal
     transactions.
   • Progress: 100% (completed)
   • Result: No abnormal transactions found.
   • Note: Production Monitoring Summary updated in the QA group.
```

- **`Result:` is required, even when the answer is "nothing found".** A monitoring entry with no
  result does not tell your lead whether the release was clean, which is the only thing it exists to
  record.
- **Name the modules you monitored**, not just "production".
- **Say where you recorded the outcome** — SharePoint, the QA group, the ticket.

**The night deployment itself is never a timesheet entry.** Work outside working hours is declared
on the week tab, and never counts towards the 40-hour week. **Night work** is work that had to
happen then, such as a night deployment — it is paid as a hardship allowance. **Extra work** is
extra effort you chose to put in during your own time, and carries no allowance. *A night deployment is always night
work, never extra work.* See the skill's "Out-of-hours routing".

## TEMPLATE 08 — Coordination and follow-up

Use when the **whole entry** went on chasing or aligning with people: following up with Dev,
checking a requirement with BA, syncing a timeline, chasing a vendor, taking over test scope.

Fields: `Task` `Method` `Result` `Blocker` `Note` — no `Progress:`

```
Task: Followed up with Dev and BA on EAINT-11759 (Securing Insurance - support
number change).
   • Method: Confirmed the CTA scope with Dev, checked the latest requirement
     with BA, and agreed the testing window.
   • Result: Test scope confirmed. BA to provide MacroKiosk staging access
     before testing can start.
   • Blocker: Waiting on BA for MacroKiosk staging access. Dev needs it to
     continue development and QA needs it to test.
   • Note: With Jin Siang (Dev) and Lim YiLin (BA).
```

- **`Result:` is required.** A follow-up with no outcome reads as "I chased someone", which the lead
  cannot judge. Say what was agreed, or say plainly that no answer has come back yet.
- **Name the people and their role in the `Note:`**, and also use the `@` mention field for anyone
  at ModeFair. The picker looks simple but the documented click-and-type silently fails — see
  `chrome-mechanics.md` for the method that actually works.
- **Use this for a handover too:** *"Azila walked me through the test scope, coverage and testing
  plan they drafted for this CR. Result: I am clear on the scope and can take over the testing."*
- **Only when coordination was the whole entry.** If you were also drafting or testing in the same
  block, keep it as one entry under that activity's template.

### House rule — Meeting or Delivery?

**If you talked, it is a Meeting. If you typed, it is Delivery.** A live conversation is a Meeting,
face to face or on a call (Teams, Zoom, phone). A written exchange — chat messages, ticket comments,
email — is logged as Delivery.

Both are billable to the same client project, so this never changes your hours. It only changes
whether the hour counts as building or as talking.

**One exception.** A short live check of a few minutes inside work already being logged on the same
ticket stays inside that entry as Delivery. Create a separate Meeting entry only when the
conversation was the whole entry.

## TEMPLATE 09 — Meetings and huddles

Any scheduled call, huddle, workshop or walkthrough. Also preparing a huddle agenda.

Fields: `Task` `Discussed` `Blocker` `Note` — **`Discussed:` replaces `Method:`, and there is no
`Progress:`** (a meeting either happened or it did not).

```
Task: Hosted the eAuto project huddle.
   • Discussed: Ticket status round-up, tonight's deployment readiness, blockers
     and dependencies, and upcoming CRs and testing priorities.
   • Note: Attendees: All eAuto QA, BA and Dev. My action item is to finish
     retesting EAINT-12140 before Thursday 5pm.
```

- **For a meeting, "Method" is replaced by "Discussed"**, because what matters is the content of the
  discussion rather than how it was held. **Never write both, and never write `Method: Manual.`
  as well** — a meeting has no method to state.
- **Do not list ModeFair attendees in the remarks.** Use the `@` mention field instead — that is what
  lets your lead match your entry against the other people's timesheets. External people may be named
  in the `Note:`.
  - **[LOCAL] The standing huddle splits by role** (May Chin, 11 Sep 2026). Attendee: tag the
    **host** in the picker, nobody else. Host: picker empty, one line in the note instead:
    `Attendees: All eAuto QA, BA and Dev.` Check your own team's convention before copying this.
- **One meeting is one entry.** A deployment huddle covering ten tickets is a single entry against
  the project, not one per ticket.
- **If the meeting gave an action item, put it in the `Note:`.**
- Past 30 minutes a billable meeting also needs a line on **why you stayed for all of it**.
- **Preparing an agenda is not a meeting, but it is still meeting-related.** Log it as its own
  Delivery entry, and **still no `Method:` line** — the same reason applies. Say what went into the
  agenda instead: *"Task: Drafted the agenda for the eAuto project huddle. • Note: Covered the
  ticket status round-up, tonight's deployment readiness and the open blockers."*
  The same holds for writing up minutes and action items afterwards.

## TEMPLATE 10 — Non-billable work

Any hour no single client can be invoiced for: internal tools, the automation framework, CI work,
company training, internal documentation, knowledge sharing, general team meetings.

Fields: `Task` `Method` `Progress` `Blocker` `Why non-billable` `Note`

**Drop `Method:` when the entry is meeting-related** — a team standup, a non-project meeting, buddy
mentoring, or a knowledge-sharing session you sat in. Those hours were talking, so there is no
method to state. Keep `Method:` when you built something: the internal tool, the CI pipeline, the
documentation, the training deck.

```
Task: Set up and migrated the QA Portal server to go live.
   • Method: Deployed to the new server, configured the API permissions, and
     added user accounts for the QA team.
   • Progress: 100% (portal is live)
   • Why non-billable: The QA Portal is a ModeFair internal tool. No single
     client can be invoiced for it.
   • Note: Ran in parallel with EAINT-184 and EAINT-11992 today. 2h 30m of the
     shared window is attributed here.
```

- **[LOCAL] No `Category:` line in the remark.** v1.4 asks for one, but the form
  already has a Category dropdown and repeating it is noise.
- **Instead, the `Task:` line must name the actual thing worked on.** The dropdown says the kind of
  work; the remark says *which one*. Category `Internal tools` is not enough on its own — name the
  tool. `Set up and migrated the QA Portal server` names it; `Worked on an internal tool` does not.
  The same holds for every category: which training, which document, which process, whose mentoring.
- **If the category is `Others`, the remark must say what it actually is.** That dropdown value
  carries no information at all, so the remark is the only place the lead can find out.
- **The `Why non-billable:` line is required.** One short sentence naming who the work benefits.
  This is the field that prevents an argument later, because the lead can see the reasoning instead
  of guessing.
- **A non-billable entry takes a category, not a project, and usually has no ticket**, so the remark
  has to carry the whole story on its own.
- Categories the team normally uses: Internal tools, Company training, Company documentation,
  Process improvement, Non-project meeting, Buddy mentoring, AI knowledge sharing.
- **Watch the framework trap.** Automation framework work, CI and pipeline work, and evaluating a
  testing tool are all non-billable even though they look exactly like delivery. Scripts written
  against one client's application are billable. Learning a tool is non-billable company training,
  even when learning it in order to use it on a client project.

---

## Rules for every entry

- **One entry is one kind of work.** Do not put a whole day into a single line. Two related
  activities on the same ticket can share an entry — see **Combine or split?**
- **Write in plain English, and only about the work.** Full words, not personal shorthand. Every
  line must answer one of the six fields. No personal comments, complaints, jokes or vague filler.

  **[LOCAL] Write like a person — simple, clear, easy to understand.** Charmain's instruction,
  8 Sep 2026: *"use human like method to draft, simple and clear, easy to understand, simple
  english"*. Short sentences, plain verbs, one idea per sentence. No em dashes, no stacked clauses,
  no jargon. **The test: would she say this out loud to her lead?**

  **And nothing about how the entry was reconstructed.** A line explaining where the figures came
  from is filler — the reviewer only wants to know what was done. A real 8 Sep entry shipped with
  *"the window is bracketed by the output file times rather than measured"*; she read it back and
  asked what it meant. Both faults at once: jargon, and describing method instead of work.
- **Do not copy the ticket title.** Your lead can already see the ticket — and since 24 Aug 2026 the
  card also renders the resolved Jira summary, board prefix and live status under the task
  reference. The remark has to say what **you** did to it.
- **If there is no ticket, the remark must carry everything.**
- **`Task:` and `Method:` must describe the same work.** A `Task:` saying you updated an estimate
  with a `Method:` saying "automation" forces a query.
- **No `Method:` at all on a meeting-related entry.** A `Method:` line under a `Task:` that says
  you sat in a huddle is the mismatch, not the fix.
- **Use the word `Result`, never `Outcome`.**
- **Declare parallel time.** An automation script runs unattended, so one clock window can cover two
  tickets. Say so on **both** entries and state the split: *"Ran in parallel with EAINT-12094. 3h of
  the shared 7h window is attributed here."* Without this the two entries look like double claiming.
- **Put the important facts first.** CapacityTrack hides long remarks behind "Show more", so
  anything past roughly two lines is not visible until the reviewer clicks. `Task:` and `Result:`
  must sit above that cut.
- **⛔ [LOCAL] `Nothing to automate.` is retired — 8 Sep 2026.** *"remove the nothing to automate
  word from all entries."* It used to close every manual `Method:` line here. It no longer appears
  on any entry: once anything run through Claude counts as automation, almost nothing is genuinely
  un-automatable, so the sentence was either false or filler. Say *why* that part was done by hand
  and stop. Entries dated before 8 Sep still end with it and are superseded, not a pattern to copy.
  **A meeting-related entry has no `Method:` line at all** — see the section above.
- **Say where the output went** — SharePoint, the QA group, the planning board, the test case sheet.
  This is what lets an entry be verified without a conversation.
- **Short entries still need a remark, but one line is enough.** A five-minute entry does not need
  six fields.

## Remarks that are not accepted on their own

Each carries no information. If a remark is one of these and nothing else, expect it to be queried.

`testing` · `fixing` · `scripting` · `meeting` · `continue` · `ongoing` · `as per ticket` ·
`same as yesterday` · `done` · `in progress` · `discussion` · `support`

## Bad versus good

**Not acceptable:**

```
testing eauto
```

Your lead cannot tell which ticket, which environment, what kind of testing, or whether anything
passed. So the entry has to be queried, which costs both of them time.

**Acceptable:**

```
Task: Executed retesting on EAINT-12140 (UCD - Vehicle Registration).
   • Method: Manual on Staging, Chrome. Retested the 3 fixes from the 25 August
     deployment.
   • Progress: 100% (completed)
   • Result: All 3 fixes verified and closed.
```

Five lines, and there is nothing left to ask. The ticket, the environment, the type of testing, the
scope and the result are all there.
