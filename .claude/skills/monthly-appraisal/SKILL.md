---
name: monthly-appraisal
description: Fill Faizuddin's monthly appraisal on appraisal.modefair.com — ratings, short point-form justifications, and one work-product screenshot per point, following his lead's MANDATORY rule (max 2 strongest evidence per criterion, bold key points, no evidence reused across criteria, combine similar work). Use WHENEVER he says "do my appraisal", "fill my monthly appraisal", "appraisal for <month>", pastes an appraisal.modefair.com/appraisals/<id> link, or asks to add/fix appraisal evidence. Never submits.
---

# Monthly appraisal

## 1. Lead's rule — MUST FOLLOW (overrides everything below)

From his lead's message, pasted by Faizuddin 2026-11-03, verbatim:

> Hihi Faiz, regarding your monthly appraisal, please avoid attaching too many pieces of evidence or writing overly detailed justifications.
>
> Since we'll be doing the appraisal every month moving forward, you don't need to include every task you completed. For each criterion, please:
> Include only your top 2 strongest and most relevant pieces of evidence
> Write the justification in point form
> Go straight to the point by briefly stating what you did and the outcome or impact
> Highlight the key points in bold
> Try to avoid using the same evidence under multiple criteria
> Combine similar contributions instead of attaching them separately
> Keep everything short, concise, and easy for your Leads to review
> If more information is needed, I will check with you separately ya.

Per criterion:
1. **Max 2 points, max 2 evidence.** Top 2 strongest only. Not every task.
2. **Point form.** One short line per point: **what he did → outcome/impact**.
3. **Bold** the key words in each point.
4. **No evidence reused** across criteria. Track used files in a list as you go.
5. **Combine similar work** into one point (e.g. several QA-Issues → one point, one Jira list screenshot).

## 2. Faizuddin's own rules

1. **One evidence per point** (2 points = 2 evidence entries).
2. Evidence = **original work-product screenshot**: Jira, SharePoint (folder or workbook showing "Modified by" him), dashboard page (http://localhost:3000), GitHub. Never images Claude composed.
3. **No chat screenshots**, except where he allows: huddle agenda posts, a requirement-confirmation chat (e.g. 12412 invoice lines).
4. **Only claim his own work.** He did regression *testing*, not the regression scope/checklist. Never claim "team standard" or that others use his tools.
5. **Never click Submit.** He submits himself.
6. **Respect his edits.** Re-read the live page first; never re-add items he removed.
7. Ask him the ratings before writing (October 2026: all 3). A rating of 3 on a criterion that needs no evidence → leave it empty.
8. Points carried from earlier months: check memory for `appraisal-<month>-*` files (e.g. Titan Firewall Exercise → November 2026).

## 3. Steps

1. Read memory: `feedback_monthly-appraisal-evidence.md` and any `appraisal-*` file for this month.
2. Open the appraisal link in Chrome (claude-in-chrome skill). Read every criterion's wording and what is already filled.
3. Gather the month's work:
   1. Jira (Atlassian MCP, mfservices.atlassian.net): tickets with QA = him (`cf[10041]`) resolved in the month; QA-Issues he reported (`reporter = currentUser() AND created >= <start> AND created <= <end>`).
   2. SharePoint QA Team site: test evidence / TS folders he modified that month (search API from a SharePoint tab).
   3. Dashboard pages and repo commits made in the month (`git log --since --until`).
   4. Teams only for the allowed chat exceptions.
4. Draft 1–2 points per criterion → show him the draft (table: criterion | point | evidence file) and wait for approval.
5. Screenshot each evidence into `%USERPROFILE%\Documents\appraisal-<mon>-<yyyy>\`, named `C<n>-<point>-<source>-<what>.png`.
6. Ask him to run `/add-dir <that folder>` — `file_upload` rejects any folder not shared with the session.
7. Fill on the page:
   1. Rating: click the rating control; check it saved.
   2. Justification: Trix editor, set via `editor.loadHTML(html)` with `<ul><li><strong>…</strong> …</li></ul>`; autosave. A "Leave site?" dialog after this is harmless — the content is saved; confirm by re-fetching the page.
   3. Evidence: `/appraisals/<id>/ratings/<c>/evidence/new`, kind `screenshot`, reference, date (`occurred_on`), description 40–500 chars, file via `file_upload`. Each form has its own `authenticity_token` — reusing another form's token returns 422.
   4. Remove evidence: buttons trigger a native confirm dialog. Avoid it — fetch-POST the delete form's own FormData (`_method=delete`).
8. Re-read the page. Check against section 1: ≤2 evidence per criterion, bold present, no reused file, nothing he deleted re-added.
9. Report what was filled. Do not submit.

## 4. Output style

Numbered lists, short, no filler. Cite sources verbatim with location.
