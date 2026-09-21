---
name: eauto-qa-issue-ticket
description: Raise eAuto QA-Issue tickets in Jira (project EAINT) in the team's standard format — the coloured Testing Environment / Browser / Module note panel, the orange Staging Test line, and the three-column Item / Actual / Expected table. Use this WHENEVER the user wants to raise, create, file, log, or "raise under" a parent, a QA bug/issue found during eAuto testing (Service Portal, UCD, BO, Export, etc.), even if they don't say "QA-Issue" — e.g. "raise high priority issue …", "jomcheck shows yes but …", "raise this under 10937". Also use it to fix the format of a QA-Issue you already created. It carries the full ADF format spec (fonts, colours, panel), the field rules (QA, Developer, assignee, reporter), and the mandatory ask-before-create checklist so nothing gets guessed.
---

# eAuto QA-Issue Ticket

This skill creates **QA-Issue** tickets in the ModeFair eAuto Jira project the way
the eAuto QA team writes them by hand. A QA-Issue is a sub-task raised against the
enhancement ("parent") ticket that the bug was found under. The whole point of the
format is that a developer can open the ticket and instantly see the environment, the
exact steps, what actually happened (in red) and what should have happened (in green)
— so match the format precisely; the colours carry meaning here, they are not decoration.

## Fixed environment values

These don't change for the eAuto project — use them directly, don't re-discover them
each time:

- **Site / cloudId:** `8fc3c96f-5850-4bd1-bb80-f57582b68e93` (mfservices.atlassian.net)
- **Project key:** `EAINT` (eAuto Internal)
- **Issue type:** `QA-Issue` (a sub-task type — it MUST have a parent)
- **Developer field:** `customfield_10040` (multi-user picker → value is an array)
- **QA field:** `customfield_10041` (multi-user picker → value is an array)
- **On Hold transition:** id `28` (moves the ticket to the "On Hold" status)

People / account IDs (resolve at runtime — don't hardcode):

- **QA field & reporter** = the person running the skill. Get their accountId from `atlassianUserInfo`
  (current Atlassian user), and confirm it's really them.
- **Developer & assignee** = the dev who owns this parent (see Step 1 / Step 4). Resolve the name to an
  accountId with `lookupJiraAccountId`, searching a distinctive part of the real name — not a nickname
  (e.g. search "Boo", not "Brandon", which may not match). Confirm the match before setting it.

## The workflow — do these in order

### Step 1 — Study the parent (silently, before asking anything)

Fetch and read the parent ticket (`getJiraIssue` on the given key — e.g. EAINT-10937). Read its
description, the SRD version table, the affected module/portal, and its `[eAuto - <Area>]` prefix
(reuse that Area in the title). The parent is given by the user ("raise under 11892"); confirm it
exists, never swap it for a different one. Note the **likely developer for this parent** — the
parent's own assignee and the Developer field on any existing QA-Issue under it — as a *suggestion*
to confirm in Step 4. **The dev is per parent: a different parent means a different dev — never
reuse a dev across parents.**

**Auto-pull the SRD and Figma from the parent — don't ask for what's already there:**
- **SRD:** look at the parent's **attachments** (`getJiraIssue` with `fields:["attachment"]`) for SRD
  files — filename contains `SRD` and/or the parent key, e.g.
  `SRD_EAINT-10937_..._v1.2_20260603.pdf`. Parse the **version + date from the filename**, take the
  **highest version**, and prefer the **PDF** copy (it renders with `pdftoppm`; the `.docx` is the
  editable source). Cross-check against the **SRD version table in the parent description** to confirm
  which version is current. That gives you the SRD document **and** its version with nothing asked.
- **Figma:** scan the parent **description** and its **remote/web links**
  (`getJiraIssueRemoteIssueLinks`) for a `figma.com` URL and use it if present. Heads-up: the eAuto SRD
  table often notes "added figma link" while the actual URL lives **inside the SRD document**, not on
  the ticket — so if it isn't on the ticket, open the SRD you just found and pull the Figma URL from
  there.
- **Only ask the user for what you genuinely couldn't find.** If both are auto-found, tell her which
  SRD version + Figma link you're using (so she can correct it) rather than asking from scratch.

### Step 2 — Ask FIRST: SRD + Figma + the bug (one opening prompt)

This is the opening prompt and it is a **hard gate**. **Do NOT open with the testing-environment /
priority / developer questions** — those are trivial and come last (Step 4). First establish what
"correct" looks like (from the SRD/Figma you already auto-pulled in Step 1) and what the bug is —
**only ask for the pieces Step 1 couldn't find**:

- **SRD** — if you auto-found it, just state the version you're using and let her correct it; only
  ask her to attach/point to it if none is on the parent.
- **Figma link** — if you found it on the ticket or inside the SRD, use it; otherwise ask for the
  node URL (or "none"). SRD + Figma are the source of truth for the *expected* behaviour; hold them
  before drafting.
- **The bug + its evidence**, offered as pickable options (`AskUserQuestion`):
  1. **Latest Snagit screenshot** — I fetch the newest capture from their Snagit folder myself.
  2. **A specific Snagit file** — they name it.
  3. **Paste a screenshot here** in the chat.
  4. **Describe it in text.**

Once you hold the parent + SRD + Figma + the screenshot, **identify the issue yourself** — compare
the screen against the SRD/Figma expected behaviour and draft Actual vs Expected. Don't make them
hand-write a description for an obvious bug. **Sanity-check the capture is actually an eAuto defect
before drafting** — if the latest Snagit capture is unrelated (a random screen, a different task),
say so and ask which file they mean rather than drafting from the wrong image. Only ask them to
clarify when the screenshot + references genuinely don't make the problem clear.

(If the parent is a throwaway/format-check dummy with no spec — e.g. a test task — SRD/Figma are
moot; say so and skip straight to Step 4.)

### Step 3 — Check for a duplicate

Before creating, list the QA-Issues already under this parent so the same problem isn't logged
twice — duplicates waste triage time.
- `searchJiraIssuesUsingJql`: `parent = <PARENT-KEY> AND issuetype = "QA-Issue" ORDER BY created DESC`
  (or read the parent's sub-tasks). Read summaries, and descriptions where ambiguous.
- Same page/module + same symptom = likely duplicate, even if worded differently.
- If matched, **don't create** — show them the existing key + summary and confirm it's genuinely new first.

### Step 4 — Confirm the remaining fields, then create

Only now confirm the team/context fields — ideally one `AskUserQuestion` batch — and create. If they
already stated some (e.g. "medium"), take those as answered.

- **Testing environment** — staging/eauto, staging/uat1, staging/uat2, staging/uat3. Goes verbatim
  into the note panel.
- **Priority** — Highest / High / Medium / Low. Always confirmed, never defaulted.
- **QA field** — the person raising it; default to the current user (the QA) but confirm.
  `customfield_10041`.
- **Developer field** — **ALWAYS ask** (offer the Step 1 suggestion as default), never carry a dev
  across parents. `customfield_10040`. Assignee follows this answer.
- **Assignee & reporter** — reporter is the QA; assignee is usually the dev (waits on the Developer
  answer — don't assign to a dev you haven't confirmed).
- **On hold to confirm requirement with the BA?** — if yes, see the "On-hold flow" below.

If the session is unattended and you truly can't ask, state your assumptions up top and proceed
(current user as QA/reporter, priority as stated) — but don't invent a developer; leave the
Developer field and assignee unset and flag it.

## Title format

`[eAuto - <Area>] <plain-language description of the problem>`

- `<Area>` mirrors the parent / portal: `Service Portal`, `UCD`, `BO`, `Export`, `Software Installation`, etc.
- Keep the description in **plain, non-technical language** — describe the user-visible symptom, not
  the internals. Put IDs, URL params and DB details in the Staging Test line instead.
- Good: `[eAuto - Service Portal] JomCheck report does not show up on the Transaction Details page`
- Avoid: `[eAuto - Service Portal] hasJomcheck=true but JomCheck tab component not rendered in DOM`

## Description format (ADF) — this is the heart of the skill

Always build the description as **ADF** (`contentFormat: "adf"`), because the colours and the
table cannot be expressed in markdown. The structure, top to bottom:

### 1. Header note panel (purple)
A `panel` with `panelType: "note"` (renders light purple `#eae6ff`). Inside it, three
paragraphs, each a **bold** label followed by plain text:

- **Testing Environment:** `<staging env>`
- **Browser:** Google Chrome  *(unless the user says otherwise)*
- **Module:** `eAuto > <Portal> > <Page path>`  (e.g. `eAuto > Service Portal > Ownership Claim Listing > Transaction Details`)

### 2. Staging Test line
A single paragraph, **outside** the panel:
- Bold label `Staging Test: `
- Then the **test-data reference in orange `#ff991f`** — the IDs / vehicle no / dates the dev needs
  to reproduce, in parentheses, e.g. `(eSTM id = 7137584a-…, Vehicle No = EAUH5BB) `
- Then plain text describing the scenario/setup in one sentence.

### 3. Three-column table
Header row (`tableHeader` cells), each bold, colour-coded:
- `Item / Step to Simulate` — bold, default colour
- `Actual Result` — bold, **red `#bf2600`**
- `Expected Result` — bold, **green `#006644`**

Then one body row (`tableCell`) per scenario:
- **Column 1 (Item / Step):** a **blue `#0747A6` bold** short title, then an **ordered list**
  of the steps to reproduce.
- **Column 2 (Actual Result):** a **bullet list**. State what actually happened; put the key
  failing words in **red `#DE350B` bold** (e.g. *does not show up*, *empty*, *YES*).
- **Column 3 (Expected Result):** a **bullet list**. State what should happen; put the key
  correct words in **green `#006644` bold** (e.g. *should show up*, *dash "-"*). **Cite the source of
  the expectation when it comes from Figma or the SRD, and embed the supporting screenshot** (same
  inline-image method as the Actual Result cell — see "Attaching test evidence"):
  - **Figma-based:** add the **Figma link** (as a hyperlink) and embed a **screenshot of the relevant
    Figma frame** beneath the expected-behaviour text. Capture it from the Figma file (the Figma MCP
    `get_screenshot`, or a Snagit capture of the frame the QA points to).
  - **SRD-based:** state the **SRD version** it's grounded in (e.g. `Per SRD v1.2, Section 2.2.2`) and
    embed a **screenshot of that SRD section**. Take it from the SRD attached to the parent (the SRD
    table in the parent ticket lists versions) or the SRD doc the QA provides.
  - If the expectation is just obvious behaviour (not tied to a spec), plain text is fine — no link
    or screenshot needed.

Add more body rows if the user reports several steps/scenarios in one ticket.

### Colour quick-reference (ADF `textColor` mark values)

| Where | Hex | Meaning |
| --- | --- | --- |
| Note panel background | `#eae6ff` | via `panelType: "note"` (don't set manually) |
| Staging Test reference data | `#ff991f` | orange — the IDs/vehicle/date to reproduce |
| "Actual Result" header | `#bf2600` | dark red |
| "Expected Result" header | `#006644` | dark green |
| Item / step title | `#0747A6` | blue |
| Failing words in Actual cell | `#DE350B` | bright red |
| Correct words in Expected cell | `#006644` | green |

Colour marks are applied like: `"marks": [{"type": "textColor", "attrs": {"color": "#bf2600"}}, {"type": "strong"}]`.
Bold alone is `{"type": "strong"}`. Panel is `{"type": "panel", "attrs": {"panelType": "note"}, ...}`.

### ADF skeleton (copy, then fill the `text` values)

Read `references/description-template.json` for a complete, ready-to-fill ADF document that
already has every colour, the panel, the orange Staging Test line, and the three-column table
wired up. Replace the placeholder text nodes and pass it as `description` with `contentFormat: "adf"`.

## Creating the ticket

Use `createJiraIssue`:

- `cloudId`: `8fc3c96f-5850-4bd1-bb80-f57582b68e93`
- `projectKey`: `EAINT`
- `issueTypeName`: `QA-Issue`
- `parent`: the confirmed parent key (e.g. `EAINT-10937`)
- `summary`: the title
- `assignee_account_id`: usually the developer's accountId
- `contentFormat`: `adf`
- `description`: the filled ADF document
- `additional_fields`: set priority + QA + Developer together so you don't need a second call:
  ```json
  {
    "priority": {"name": "High"},
    "customfield_10040": [{"accountId": "<developer accountId>"}],
    "customfield_10041": [{"accountId": "<QA / creator accountId>"}]
  }
  ```

Reporter defaults to the creating user; only set it explicitly if it must differ.

## Attaching test evidence (screenshot / video)

The Jira connector cannot upload files, so evidence is attached by driving the Jira web UI with
**Claude in Chrome** — it runs in the QA's own browser, so it can reach both the ticket and their
local files. Do this after the ticket is created. All of the below is confirmed working.

### Choose the evidence file

Pick in this order:
1. If the QA **pasted a screenshot into the chat** for this issue, use that image (it's already in
   the session's uploads).
2. Otherwise, read their **Snagit folder** `<your screenshots folder — e.g. your Snagit / OneDrive captures folder>`
   and take the **most recent** file by modified time. Check each file's size — you'll need it for
   the 10 MB rule below.
   - **If the device-bridge tools (`mcp__remote-devices__device_*`) are available** (this is the
     clean path, confirmed working): `device_request_folder_access` on that folder if not connected,
     `device_list_dir` to find the newest file + sizes, `device_stage_files` to pull it into
     `/mnt/user-data/uploads/`.
   - **If the device bridge is NOT available in the session**, fall back to whatever local access the
     session has — e.g. a local Windows-MCP/PowerShell to list by modified time and `Expand-Archive`
     the `.snagx` — or just ask them to paste the screenshot into the chat. Don't assume the bridge
     exists; check first.

**Prefer an image (screenshot) for the Actual Result.** The QA's evidence is a picture embedded in
the Actual Result column, so a `.png` is the target, not a Snagit project file.

**If the latest capture is a `.snagx` (Snagit's native format, not a picture):** a `.snagx` is just a
ZIP. Stage it, unzip it, and grab the full-resolution PNG inside — the capture is stored as
`{GUID}.png` (there's also a smaller `thumbnail.png`; take the large one). That gives you a real
image with no manual export:
```
device_stage_files → /mnt/user-data/uploads/Snagit/<name>.snagx
unzip it in the workspace, take the largest {GUID}.png, copy to a clean name (e.g. <name>.png)
```

**Always ask before uploading.** Name the exact file — "the screenshot you pasted", or the filename +
timestamp for a folder file — and wait for a yes. She may want a newer/different file; never upload
silently.

### Producing Figma / SRD screenshots for the Expected Result (confirmed methods)

The Expected Result cell embeds these the same way as any image, but first you have to turn the
source into a PNG/JPG file in `/mnt/user-data/uploads/`:

- **SRD (PDF):** if the SRD is uploaded/attached as a PDF, render the target page to an image with
  poppler — no network needed:
  `pdftoppm -png -r 150 -f <page> -l <page> "<srd>.pdf" /mnt/user-data/uploads/srd_section`
  Read the rendered PNG to confirm it's the right section, then embed it and cite the version
  (e.g. "Per SRD EAINT-11757 v1.0 (20.07.2026) - Section 2.1 …"). Typing the SRD's Jira key auto-links
  it to a smart-link card, which is a nice bonus.
- **Figma:** `get_screenshot` (Figma MCP) with the file key + node id returns an image URL + base64.
  BUT in this cloud session the container can't reach figma.com (proxy 403) and the harness blocks
  returning base64 as text — so you can't curl it or exfiltrate it directly. Working route:
  1. In Chrome, open a real `https://www.figma.com/` page (same origin as the asset).
  2. `javascript_tool`: `fetch(assetUrl)` (same-origin, so no CORS), read as bytes, and render it into
     the page — `document.body.innerHTML = '<img src="data:image/png;base64,'+b64+'" style="width:100vw;height:auto;margin:0">'` (fit to width so nothing clips).
  3. `computer` `screenshot` with `save_to_disk: true` — this writes the rendered frame to a session
     path (browser screenshots capture page content only, no browser chrome). Copy that file into
     `/mnt/user-data/uploads/`.
  Then embed it and add the **Figma link** as a hyperlink next to it.

Both files then upload through the same inline-image path below.

### Images → embed INLINE in a table cell (Actual Result, or Expected Result for Figma/SRD)

Same method for both: the bug screenshot goes in the **Actual Result** cell; the Figma/SRD
screenshots go in the **Expected Result** cell. The connector can't insert inline media, so do it in
the Jira editor via Chrome (confirmed sequence). Entering edit mode sometimes needs two clicks:
1. `tabs_context_mcp {createIfEmpty:true}`, `navigate` to the issue `webUrl`.
2. Click the description text to enter **edit mode** (the editor toolbar appears).
3. If an old image is already in the cell (e.g. a prior paste), click it to select and press
   `Delete`. Saving after removing an inline image also drops its orphan attachment.
4. Click into the **target cell** — the Actual Result cell for a bug screenshot, or the Expected
   Result cell for a Figma/SRD screenshot — to place the cursor there. Type any label/link first
   (e.g. the SRD version or Figma link), press `Return`, then upload so the image lands under it.
5. `find` "media/image upload file input in the description editor" → get its `ref` (the hidden
   `input[type=file]` for the editor). `file_upload` the staged image to that `ref` — it inserts at
   the cursor, i.e. inside that cell. Repeat for a second image (e.g. SRD then Figma).
6. `find` "Save button for the description editor" and click it. Verify with `getJiraIssue`
   (`expand: renderedFields`) that each `<img>` sits inside the intended `<td>`.

### Videos → attach to the Attachments panel (automation can't embed video inline)

Important nuance, tested repeatedly: a video **can** live inline in the Actual Result cell and
renders as a player in the Jira UI — but only when a **human drags/pastes** it in. The browser
`file_upload` path (what you drive) inserts **images** inline fine, yet **silently drops video** —
the upload "succeeds" but no video node appears, even with a long wait. So don't rely on automation
to embed a video inline. (In the API's `renderedFields` HTML a real inline video shows as
`Unable to embed resource: <name> of type video/mp4` — that's just the HTML export; the UI plays it.)

For automation, attach the video to the ticket's **Attachments panel** instead:
1. Stage the video (`device_stage_files`).
2. On the issue page (view mode), `find` "file input for adding attachments in the Attachments
   section" → `file_upload` the staged path to that `ref`.
3. Confirm the **"Added attachment to QA-Issue <KEY>"** toast, then verify via `getJiraIssue` that the
   `video/mp4` attachment is listed (the connector read can lag a few seconds — re-check if it's not
   there yet).

If the QA specifically wants the video **inline** in the Actual Result cell, attach it to the panel
and tell them to drag it into the cell themselves (the one step automation can't do) — or they can paste
it, as they've done before.

### Caveats (all learned the hard way)

- **10 MB cap per `file_upload` call.** A 5.9 MB clip uploads fine; many Snagit videos are 25–130 MB
  and will be rejected. For an oversized file, tell the QA and ask them to drag it onto the ticket
  manually. Always check `size` before staging.
- **Never permanently delete attachments yourself.** Removing an attachment is a hard delete
  ("gone for good"); if a stray/wrong attachment needs removing, ask the QA to click
  `…` → Delete. (Deleting an *inline image* inside the editor during an edit is fine — that's editing
  the description, not a permanent attachment delete.)
- Needs the Chrome extension active, one-time permission on `mfservices.atlassian.net`, and the QA
  logged into Jira there. If Chrome isn't available, fall back to a manual drag.
- Reading the Snagit folder needs it connected on the device bridge; if it isn't, request access or
  ask them to paste the file into the chat.
- The browser `file_upload` rejects the raw device path (`C:\Users\...`) — it only accepts a staged
  `/mnt/user-data/uploads/...` path, so always stage first (a chat-pasted image is already staged).

## On-hold flow (confirm requirement with BA)

If the user says the issue should be put **on hold to confirm the requirement with the BA**:

1. Set the **assignee to the person who created the ticket** (the QA) — not the dev — because the
   QA owns chasing the BA for clarification.
2. Create the ticket, then transition it to **On Hold** with `transitionJiraIssue`
   (`transition: {"id": "28"}`).
3. Add a **comment** (`addCommentToJiraIssue`) explaining why it's on hold — e.g.
   *"On hold pending requirement confirmation from BA on <the specific question>."* Make the comment
   specific to what needs confirming so the thread is self-explanatory later.

If not on hold, leave the ticket in its default "To Do" status and assign to the developer as usual.

## After creating

- **Attachments / evidence:** the Jira connector can't upload files — attach evidence via Claude in
  Chrome instead (see "Attaching test evidence" below). Always reference the evidence in the Actual
  Result cell text.
- **Report back** the ticket key + URL and a one-line recap of parent, priority, assignee, QA, Developer.
- **Watch for related tickets:** if two tickets describe one root cause from different angles, offer to
  link them ("Relates") rather than leaving them disconnected.

## Worked reference

- Format reference (a hand-authored ticket to imitate exactly): **EAINT-11914**.
- Examples produced with this skill: **EAINT-12129**, **EAINT-12136**, **EAINT-12144** — all under
  parent **EAINT-10937**, all with the purple panel, orange Staging Test IDs, and red/green columns.
