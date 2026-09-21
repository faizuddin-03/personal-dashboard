# [LOCAL] The eAuto QA progress-update format (given 26 Aug 2026)

Moved here from the retired `capacity-log` skill on 4 Sep 2026. **Corrected 9 Sep 2026 against a
real posted update of hers** — anything marked *(9 Sep 2026)* below overrides the original text.

Kept verbatim so the entry notes can be checked against it. Charmain writes one in the morning and
one at EOD, both in this shape — other people on the team may differ, so check before assuming.
Every field here has a home in the entry note — see the detail set in Step 6.

```
Charmain - EOD Update (18-08-2026 8.30 AM) :

1. <release window, or EAINT-nnn & nnn - Her Short Title>
   * JIRA Ticket : EAINT-nnnnn, EAINT-nnnnn      <- all keys, each linked
   * Status :
      * <what was done / what is still to do>    <- "- Done" appended when finished
      * Test Scenarios Executed: 29 (Automation Script)
         * E2E Test Scenarios: TS1 - TS38
         * <Area name>: TS1 - TS2                <- coverage groups
   * Overall CR Testing Progress : 29/30 (96.7%) - PASS only
```

⚠ **That template is the 26 Aug shape and it is not the whole story.** It shows one ticket per item
with a TS breakdown, which is right for a heavy testing day. On a mixed day her real post groups
several tickets per item, inlines a single status, hangs a percentage off a status line, and gives
`Overall` its own children. See *How items are grouped* and *The item heading shape* below, both
corrected 9 Sep 2026.

The `Overall CR Testing Progress` line takes one of these shapes, and the entry's **`CR status:`**
bullet copies whichever applies:

| Her wording | Entry `CR status:` |
|---|---|
| `Ready for Testing on staging/uat4` | Ready for testing on uat4 |
| `Not Ready for Testing` | Not ready for testing |
| `51/160 (31.8%) - PASS only` | In testing — and the figure goes in `Progress:` |
| `(On Hold)` prefix on the item | On hold |
| `Deployed to Production` | Deployed to production |
| `Ready for Prod Deployment` *(9 Sep 2026)* | Ready for prod deployment |
| `TBC` *(9 Sep 2026)* | Not settled yet — usually carries per-phase children, see below |
| `Not started` *(9 Sep 2026)* | Not started |

**Use these words. Do not paraphrase them.** A draft on 9 Sep 2026 wrote *"Ready for 10th September
Morning Deployment - PASS only"* and *"SIT in progress on preprod1"*; she replaced them with
`Ready for Prod Deployment` and `TBC`.

### `Overall CR Testing Progress` can take children *(9 Sep 2026)*

One child per test phase, each with its own status and a parenthetical for dates or environment:

```
   * Overall CR Testing Progress : TBC
      * JPJ SIT: Not started (tentatively scheduled for 17-21 Sep)
      * Regression: Not started (on staging/preprod1)
```

## ⛔ How to hand it over — corrected 7 Sep 2026: give it as your CHAT REPLY

**Write the update as normal formatted text in your reply, using markdown bold and italic. She
copies it out of the chat and applies the colours in Teams herself.** Her instruction, after three
failed clipboard attempts: *"just give me the normal text you have as reply, with those bold and
italic"*, and before that *"i will copy and do the color format on the font later in teams"*.

**Do not build a rich-clipboard payload for a Teams post.** The advice below this line is kept
because it still works for other targets, but for Teams it wasted a long stretch of a session and
produced three worse-looking pastes than doing nothing. **Teams' paste sanitiser defeats it**, and
here is exactly how, so nobody retries these:

| Attempt | What Teams did |
|---|---|
| Nested `<ul>` with `list-style-type:disc` inline on every list | **Strips `style` attributes**, then applies its own depth cascade: level 1 `disc` **•**, level 2 `circle` **◦**, level 3 `square` **▪**. Her own posts are all **•** because they were composed in Teams, not pasted, so every bullet is level 1 as far as CSS is concerned |
| Literal `&bull;` characters in `<div>`s, indented with `&nbsp;` runs | **Strips the leading `&nbsp;` runs**, so the whole hierarchy collapsed flush left. Worse, it **auto-converted the leading `• ` into a real list bullet**, so every line rendered as `• •` |
| A `<style>` block with the list CSS | Ignored — only the copied fragment travels, and Teams drops embedded CSS |
| **Attempt 4, 9 Sep 2026** — an HTML file in Downloads with a Copy button, colours on `style` | **Colours stripped again.** Bold survived. Two lessons below |

**Attempt 4 also found one bug that was ours, not Teams'.** The item headings were written as
`<p><b>1. ...</b></p>` — a typed "1.", not a list — so they pasted as plain text with no indent.
Her words: *"even the point 1 also not the bullet point 1"*. Her colleagues' posts use a real
numbered list. **If she asks for HTML anyway, use a real `<ol>`**, keep nesting to three levels or
fewer, and tell her before she pastes that the colours will probably not survive.

**A fenced code block is also wrong** — she said so directly: *"no i dont want plain text"*. It
strips the bold and italic she wants to keep.

So: **markdown in the reply**. Bold the labels and the progress figures, italicise `- Done` and
`- PASS only`, and list which lines she should colour. That is the whole deliverable.

### The colour scheme, read off her real 03-09-2026 post

She applies these herself, so just name them:

| Element | Colour |
|---|---|
| `Test Scenarios Executed: N` | **green bold**, with `(Automation Script)` in grey |
| `Issues Raised: N` | **orange bold**, ticket links nested under it |
| `- Done` | *green italic* |
| `nn/nnn (nn.n%)` | **green bold**, `- PASS only` *green italic* |
| `Deployed to Production` | **green bold** |
| `Not Ready for Testing` · `Not Ready for Regression Testing` · `Redev` · `Not started` · the `(On Hold)` prefix | **dark red bold** |
| `Ready for Prod Deployment` *(9 Sep 2026)* | **green bold** |
| `TBC` *(9 Sep 2026)* | **orange bold** |
| A percentage on a Status line, e.g. `- 70%` *(9 Sep 2026)* | **blue bold** |
| A theme heading such as `AI Automation` *(9 Sep 2026)* | **magenta bold** |

### The item heading shape — corrected *(9 Sep 2026)*

`EAINT-nnnnn - Short Title`. A release window is named instead, e.g.
`2nd September Night Deployment`. An on-hold item takes an `(On Hold)` prefix before the key.

Four things the original text got wrong, all confirmed against her real post:

- **The Short Title is HER name for the ticket, not the Jira summary, and not a trim of it.** Her
  `Opt-Out Button & WhatsApp Blast Distribution` bears no resemblance to that ticket's Jira summary
  (`Split Renewal Reminder into 9 Templates by Source and Reminder Point`). Her `LKM Refund` drops
  the whole `[eAuto-UCD] STMS - ... (MyKad & MyPR & Company)` wrapper. **Ask for the short name.
  Never derive it.** Same rule as the CapacityTrack task reference.
- **One heading can carry several keys, joined with `&`** — `EAINT-10093, 10119 & 104 - LKM Refund`,
  `EAINT-12217 & 12218 - [Secarang - Macrokiosk] Opt-Out Button & WhatsApp Blast Distribution`.
- **No Jira emoji or colour dot** in the heading.
- **The EOD title and the CapacityTrack task reference need not match.** On 9 Sep EAINT-11759 was
  `(MessageBird and Macrokiosk Senders)` in the timesheet and
  `Use Macrokiosk (+60 18-2880075) for Successful Insurance Trx` in the post. Do not "fix" one to
  the other.

### How items are grouped *(9 Sep 2026)*

**Group by deployment window or by theme, not one item per ticket.** On 9 Sep a draft with one item
per ticket came back restructured:

| Draft | Her post |
|---|---|
| EAINT-9306 as its own item | folded into the **10th September Morning Deployment** item |
| EAINT-12218 alone | merged with 12217 into one item |
| EAINT-104 alone | `EAINT-10093, 10119 & 104 - LKM Refund` |
| `QA Portal` as a top-level item | nested under a theme heading, **`AI Automation`** |

**A single status item goes inline after `Status :`; several get a nested list.**

```
   * Status : E2E automation script drafting started - 20%
```

### ⭐ Keep it short — the post is a status document, not a findings document *(9 Sep 2026)*

Her instruction: *"eod update no need to be that detail"*.

From the 9 Sep draft she deleted, in full: a confirmed defect, the retraction of an earlier defect
report, the root cause of an upload failure, a password value, and the list of modules a regression
covered. **All of that detail belongs in the CapacityTrack entry.** The post says only where each
item stands.

Two specifics that are not just brevity:

- **Never put a credential in the post.** The draft carried a temporary password; she cut it.
- **A defect with no ticket raised yet is hers to mention or not.** Do not add it.

### The two figures people get wrong

- **`Test Scenarios Executed: N`** is the count her listed TS ranges add up to, not a running total
  of attempts. On 03-09 the four ranges summed to exactly 50.
- **`Overall CR Testing Progress`** is passed over **in scope**, not over active. On 07-09 the board
  read 127 in scope, 41 ruled N/A, 86 active, 86 passed — so her convention gives `86/127 (67.7%)`
  even though every active scenario passed. **Say both** and let her choose; the denominator moves
  when scenarios are dropped or merged, so never reuse yesterday's.

---

**The older rich-clipboard method (26 Aug 2026) — for non-Teams targets only.**

Write the fragment (`<p><b>title</b></p>` then a nested `<ol>`/`<ul>` tree, Jira keys as `<a href>`),
write a plain-text twin, then set **both** formats from an STA PowerShell script file — inline
`-Command` quoting mangles it:

```powershell
Add-Type -AssemblyName System.Windows.Forms
$do = New-Object System.Windows.Forms.DataObject
$do.SetData([System.Windows.Forms.DataFormats]::Html, $html)
$do.SetData([System.Windows.Forms.DataFormats]::UnicodeText, $text)
[System.Windows.Forms.Clipboard]::SetDataObject($do, $true)   # $true = survives this process exiting
```

Run it with `powershell -STA -NoProfile -ExecutionPolicy Bypass -File <script>` — the clipboard needs
STA. Setting HTML alone leaves no plain-text fallback, so always set both. Then **send her the HTML
file too**: the clipboard dies the moment she copies anything else, and the file is the fallback.

**Never post it for her.** Drafting is the job; sending under her name is hers.

Morning items are written as intentions — `To clarify requirements with BA`, `Target to complete
testing by eod tomorrow`. **None of those are loggable.** They are the candidate list only.
