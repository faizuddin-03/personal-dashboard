# eAuto QA Remark Standard — the ten templates

**Encoded from `eAuto QA Remark Standard v1.4`, read 28 Aug 2026.** Owner **May Chin**, who
publishes it to the eAuto QA team. **May's document is the authority — this is a working copy.**
It is published as a read-only artifact, so a v1.5 can appear without anything here changing.
If May mentions a newer version, read that before trusting this file.

Four things below are **local conventions the eAuto QA team layers on top of v1.4**, not part of
the published standard. They are marked **[LOCAL]** where they appear. If you are on a different
team, or unsure, check with your lead before following them.

- Percentages carry **one decimal place**, rounded to nearest. v1.4's own examples have none.
- The `- PASS only` / `- DONE` suffix on `Progress:`.
- Four extra bullets: `Scenarios:` `Coverage:` `CR status:` `Tickets:`.
- **v1.4's `Category:` line is dropped** from non-billable remarks — the form's dropdown already
  carries it. In its place the `Task:` line must **name the actual item worked on**, and an
  `Others` category must be spelled out in the remark. See Template 10.

---

## The six fields

Every template is built from these, always in this order. Each template says which it needs.
Leave out any that doesn't apply — **do not write "N/A" on every line**, it is noise for the reader.

| Field | What goes in it |
|---|---|
| `Task:` | What you did, and on which ticket or module. Never just the ticket title. |
| `Method:` / `Automation:` | How you did it. Manual or automation, and where. |
| `Progress:` | How far the **whole task** has got, with the count in brackets. |
| `Result:` | What came out of it. Pass/fail counts, tickets raised, or what was agreed. |
| `Blocker:` | What is holding the work up. If you write this, **also tick "Blocked on this task"**. |
| `Note:` | Anything else the reviewer needs, including parallel time attribution. |

**Use the word `Result`, never `Outcome`.** One word for one thing keeps entries scannable. This
replaced the old `Outcome:` bullet across this skill on 28 Aug 2026.

### Progress rules

- **Measured against the whole task, not your day.** Three hours worked but the ticket half
  tested is `50.0%`, not 100%.
- **Always put the count in brackets:** `77.8% (14 of 18 test cases executed)`, not `77.8%`.
- **[LOCAL] One decimal place, rounded to nearest.** `77.8%`, `31.9%`, `60.0%`. The eAuto QA team
  writes one decimal. v1.4's own examples have none and some people use two — match your team.
- **Exact 100 is written `100% (completed)`**, not `100.0%`. Do not write 100% and then keep
  logging the same task tomorrow, because your lead will query it.
- **[LOCAL] The `- PASS only` / `- DONE` suffix.** It claims every executed case passed, so only
  add it when the tester has actually said so. Ask when you are given a bare fraction.
- Count scenarios or cases, never effort. "24 of 40 scenarios", not "about half done".

### [LOCAL] Four extra bullets the eAuto QA team adds

v1.4's six fields are a minimum, not a cap. Folding these into `Note:` would turn it into a
paragraph and break v1.4's own "important facts first" rule, so they stay as their own bullets.

| Bullet | Carries | Use when |
|---|---|---|
| `Scenarios:` | How many ran, and the TS range — `29 run (TS1–TS38)` | You executed test scenarios |
| `Coverage:` | The TS ranges grouped by area | The run spanned named groups |
| `CR status:` | `Ready for testing on uat4` · `Not ready for testing` · `In testing` · `On hold` · `Deployed to production` | Every ticket entry |
| `Tickets:` | The other ticket keys in the same CR group | The work spans several tickets |

---

## Combine or split?

Real work does not arrive in neat blocks. You draft scenarios, message Dev to confirm something,
then carry on drafting. **That is one entry, not two** — as long as the whole block belongs to the
same ticket and is billable to the same project.

When you combine, pick the **main activity** for the `Task:` line and use that template. Fold the
second activity into `Method:`, and put what it produced into `Result:`.

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
   • Progress: 100% (all 22 scenarios executed) - PASS only
   • Result: All scenarios passed. No defects. Testing complete.
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
   • Note: Attendees: All eAuto QA. My action item is to finish retesting
     EAINT-12140 before Thursday 5pm.
```

- **For a meeting, "Method" is replaced by "Discussed"**, because what matters is the content of the
  discussion rather than how it was held.
- **Do not list ModeFair attendees in the remarks.** Use the `@` mention field instead — that is what
  lets your lead match your entry against the other people's timesheets. External people may be named
  in the `Note:`.
  - **[LOCAL] Exception for a standing huddle.** The eAuto QA team leaves the picker empty on
    the daily QA huddle and puts one line in the note instead: `Attendees: All eAuto QA.`
    Check your own team's convention before copying this.
- **One meeting is one entry.** A deployment huddle covering ten tickets is a single entry against
  the project, not one per ticket.
- **If the meeting gave an action item, put it in the `Note:`.**
- Past 30 minutes a billable meeting also needs a line on **why you stayed for all of it**.
- **Preparing an agenda is not a meeting.** Log it separately: *"Drafted the agenda for the eAuto
  project huddle. Method: Manual, agenda preparation, nothing to automate."*

## TEMPLATE 10 — Non-billable work

Any hour no single client can be invoiced for: internal tools, the automation framework, CI work,
company training, internal documentation, knowledge sharing, general team meetings.

Fields: `Task` `Method` `Progress` `Blocker` `Why non-billable` `Note`

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
- **Do not copy the ticket title.** Your lead can already see the ticket — and since 24 Aug 2026 the
  card also renders the resolved Jira summary, board prefix and live status under the task
  reference. The remark has to say what **you** did to it.
- **If there is no ticket, the remark must carry everything.**
- **`Task:` and `Method:` must describe the same work.** A `Task:` saying you updated an estimate
  with a `Method:` saying "automation" forces a query.
- **Use the word `Result`, never `Outcome`.**
- **Declare parallel time.** An automation script runs unattended, so one clock window can cover two
  tickets. Say so on **both** entries and state the split: *"Ran in parallel with EAINT-12094. 3h of
  the shared 7h window is attributed here."* Without this the two entries look like double claiming.
- **Put the important facts first.** CapacityTrack hides long remarks behind "Show more", so
  anything past roughly two lines is not visible until the reviewer clicks. `Task:` and `Result:`
  must sit above that cut.
- **For manual work, say there is nothing to automate:** *"Method: Manual. One-off check, nothing to
  automate."* This is an automation team, so it closes the obvious follow-up before it is asked.
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
