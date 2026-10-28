# EOD update — the Teams message template

The default format for Faizuddin's end-of-day update posted in Microsoft Teams.
Every EOD update is written in this shape unless he says otherwise
[from QA team, 2026-10-16 — Faizuddin: "take note that the current format is the
default template to create EOD update for teams message"].

## Structure (Teams rich text, not plain lines)

1. Header line, **bold**: `Faizuddin - EOD Update (DD-MM-YYYY 6.30 PM):`
2. A **numbered list**, one item per ticket. Item text, **bold**:
   `EAINT-NNNNN - <Jira summary, verbatim, emoji stripped>`
3. Under each ticket, a **bulleted sub-list**:
   1. `JIRA Ticket : EAINT-NNNNN` — the key is a link to
      `https://mfservices.atlassian.net/browse/EAINT-NNNNN`.
   2. `Status:` — followed by a nested bulleted list, one point per line
      (e.g. "Continue testing", "E2E is combined in EAINT-12166").
   3. Optional, only once testing has started:
      `Overall CR Testing Progress: ` then **`<passed>/<total> (<pct>%)`** bold,
      then ` - ` and *Pass Only* in green italics. Percentage to 2 decimals,
      trailing zeros dropped (25/30 → 83.33%, 29/29 → 100%).
4. A ticket tested together with another carries that as a Status point
   (e.g. "Tested together with EAINT-12107"), the same way "E2E is combined in
   EAINT-12166" is written.

## Rules when drafting one

1. Titles come from Jira, word for word, emoji stripped — fetch them, never
   retype from memory.
2. Leave `Status:` points blank when Faizuddin says he will fill them in.
3. Do not add lines the template does not have (e.g. mandays) unless asked.
4. Teams keeps the bold, lists and links only when pasted as rich text — deliver
   it as a page with a "Copy for Teams" button that copies `text/html` (inline
   styles only; Teams drops classes), with a plain-text fallback.

## Reference example (posted 24-09-2026)

Rendered in Teams (screenshot supplied by Faizuddin, 2026-10-15):

```
Faizuddin - EOD Update (24-09-2026 6.30 PM):            ← bold
1. EAINT-12166 - [eAuto-BackOffice] Service Hub: Enable DO Creation for Device
   Purchase with Interim Document Upload Space          ← bold
   • JIRA Ticket : EAINT-12166                           ← link
   • Status:
       ◦ Continue testing
   • Overall CR Testing Progress: 25/30 (83.33%) - Pass Only
2. EAINT-12167 - [eAuto-BackOffice] Service Hub: Allow Ops to Input Device SN on
   Device Purchase Service Request Info Page When Updating Delivery Status to Arranged
   • JIRA Ticket : EAINT-12167
   • Status:
       ◦ Continue testing
       ◦ E2E is combined in EAINT-12166
   • Overall CR Testing Progress: 29/29 (100%) - Pass Only
3. EAINT-12028 - [eAuto-BackOffice] New Module – Association Payment Listing
   (Automate Association/Vendor Payment Requests)
   • JIRA Ticket : EAINT-12028
   • Status:
       ◦ To continue drafting high level TS when have capacity
```

Generator page built on this template (2026-10-15, tickets 12107/12327/12412):
https://claude.ai/artifact/H4FvDVH5QbUQALNh8zgWaT — status boxes per ticket,
optional passed/total, "Copy for Teams" button. Reuse its markup for the next one.
