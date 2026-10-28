---
name: qa-issue-retest
description: Post the retest result on an eAuto QA-Issue ticket in Jira (EAINT) as the team's standard comment — a note panel with "Status:" and a green DONE, green CLOSED or blue REDEV lozenge, plus one line of what the retest showed. Use WHENEVER the user says "comment DONE", "comment REDEV", "close this ticket", "retest passed/failed on EAINT-xxxxx", "mark 12588 done", "redev this ticket", or similar. REDEV always needs the failed-retest evidence attached.
---

# QA-Issue retest comment (DONE / CLOSED / REDEV)

The comment the eAuto QA team uses to signal a bug ticket's retest result
(Faizuddin, 2026-10-22; approved reference: EAINT-12588, comment 57967).

## Fixed values

1. **cloudId:** `8fc3c96f-5850-4bd1-bb80-f57582b68e93` (mfservices.atlassian.net)
2. **Project:** `EAINT`. Accept `12588`, `EAINT12588` or a full URL; normalise to `EAINT-12588`.
3. **Tool:** `addCommentToJiraIssue` with `contentFormat: "adf"`. Load it with ToolSearch if deferred.

## What to collect before posting

| Status | Needed | If missing |
|---|---|---|
| DONE | ticket key; one sentence of what the retest showed | draft the sentence from the ticket's Expected Result and show it before posting |
| CLOSED | ticket key; the sentence the user gives (why it is closed, e.g. "Follow existing behaviour ...") | ask for the sentence; never invent the reason |
| REDEV | ticket key; one sentence of what still fails; **evidence of the failed retest** (screenshot or video) | **stop and ask for the evidence. Never post REDEV without it.** |

1. Read the ticket first (`getJiraIssue`): confirm it is a QA-Issue and use its Actual / Expected Result to word the sentence.
2. The sentence is short and plain, one line, no explanations. DONE example: "System now automatically shows the pending payment page after submitting payment". REDEV example: "Pending payment page still shows only after a manual refresh".

## The comment (ADF)

```json
{"type":"doc","version":1,"content":[
  {"type":"panel","attrs":{"panelType":"note"},"content":[
    {"type":"paragraph","content":[
      {"type":"text","text":"Status: ","marks":[{"type":"strong"}]},
      {"type":"status","attrs":{"text":"<DONE|CLOSED|REDEV>","color":"<green|green|blue>","localId":"<new UUID>","style":"bold"}}
    ]}
  ]},
  {"type":"paragraph","content":[{"type":"text","text":"<one short sentence>"}]}
]}
```

1. **DONE** → `"color":"green"`. **CLOSED** → `"color":"green"` (Faizuddin, 2026-10-26). **REDEV** → `"color":"blue"`. Text in capitals.
2. `localId`: a fresh UUID every time (a non-UUID id may not render as intended).
3. Nothing else in the comment: no greeting, no mentions unless asked.

## REDEV evidence (mandatory)

The Jira connector cannot upload files. Attach the evidence through the Jira web page with Claude in
Chrome, the same way as the `eauto-qa-issue-ticket` skill ("Attaching test evidence"):

1. Evidence source, in order: an image the user pasted in chat for this retest; a file they name; the
   newest file in their screenshots folder. **Ask before uploading** and name the exact file.
2. Images: open the posted comment for editing (or write the comment in the page editor), place the
   cursor under the sentence, and upload through the editor's media file input so the image sits
   inside the comment. Save.
3. Videos (automation cannot embed inline): upload to the ticket's Attachments panel, then add a line
   to the comment naming the attached file.
4. 10 MB per upload. A larger file: tell the user to drag it in themselves.
5. Never delete attachments yourself.

If the evidence cannot be attached, do not leave a REDEV comment without it: tell the user what blocked
the upload.

## Optional status change

Only when the user asks: DONE → transition the ticket to **Done** (transition id `221` on EAINT
QA-Issues as of 2026-10-22; check `getTransitionsForJiraIssue` if it fails). CLOSED → transition to
**Closed** (transition id `29`, as of 2026-10-26). REDEV → leave the status alone unless told which
status to use.

**Every status change reassigns the ticket to the user** (Faizuddin, 2026-10-26: "every time change
status, asignee need to reassign to myself"). In the same step as the transition, set `assignee` to
the current user's accountId (`atlassianUserInfo`; Faizuddin = `712020:fdec0ddc-1274-4f68-86e2-b3baffc6e0fa`)
with `editJiraIssue`. No transition → leave the assignee alone.

## Check, then report

1. Read the ticket again (`getJiraIssue`, `fields:["comment"]`, `responseContentFormat:"adf"`) and
   confirm the status node has the right `text` and `color`.
2. If unsure how it renders, open the ticket in Chrome: the lozenge carries `data-color="green"` or
   `"blue"`.
3. Report: ticket key + link, DONE or REDEV, the sentence, and (REDEV) which evidence file was attached
   and where.
