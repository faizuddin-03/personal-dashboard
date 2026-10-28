---
name: run-findings-page
description: When Faizuddin pastes an automation run log (Playwright output from an eauto-* / secarang dashboard run, "===== <TS> =====" blocks, ✘ / failed lines) and asks what the issue is, why something failed, or what is wrong, answer in chat AND publish an Artifact page that shows each failure next to its sources — the TS wording, a screenshot of the SRD section, and the red-box CIBO / portal screenshot from the run — so he can see exactly what failed and where the rule comes from. Use it for every "what is the issue here" / "why did this fail" on a run log, even when he does not ask for a page.
---

# Run findings page

Faizuddin, 2026-10-20: "i like this way of explanation using the artifact with
screenshots. easy for me to see exactly what it the issue and where is the source.
so i want you to make this a skill ... every time i give log of my automation run
to ask you what the issue is, you will generate me this artifact/website with all
the relevant screenshots".

Worked example (layout, tone, structure): `references/example-12107-TS06.html`,
published at https://claude.ai/artifact/H7nfYVykQgnDj1KE4GvxmX.

## 1. Read the log — one finding per failed check

1. Split the log on `===== <TS> =====`. List passed TS in one line; work only on `✘` TS.
2. For each failed TS, take every `Error:` block (soft failures list several). One
   finding = one check that failed (expected vs received + the step name).
3. Classify each finding before writing anything:
   a. **System** — the page / file really shows the wrong thing.
   b. **Automation** — the script read the wrong thing (stale list, wrong ref, wrong
      timing). Check the evidence screenshot before blaming the system: 12107_TS06 on
      2026-10-20 looked like a filter defect but was a stale unfiltered list.
   c. **Data / expected** — old data, a dev patch, or an expectation the SRD does not
      back. Say which.
   Automation findings get fixed in code and reported in chat; the page lists them
   under a short "Automation, fixed" note only if he needs to know.

## 2. Collect the screenshots (never compose a picture)

1. **Run evidence:** dashboard runs publish to `public/qa-artifacts/<suite>/<runId>/`
   (`meta.json` holds `runLabel` + `scenarios`; newest folder = newest run). Take the
   `*-ISSUE.png` red-box shots (`BasePage.captureIssue`) and the exported CSV rows.
   CLI runs write to `scripts/<suite>/test-results/_cli/evidence/`.
   If a failure has no ISSUE shot (older run, file-only check), re-run that TS once
   to produce one, or box the matching cell on screen — never draw on an image.
2. **SRD:** the latest SRD PDF is a Jira attachment on the ticket (`getJiraIssue`
   `fields:["attachment"]`, highest `vX.Y`). Render a page in Chrome:
   open the ticket page, then `javascript_tool`:
   `fetch('/rest/api/3/attachment/content/<id>?redirect=false')` → blob →
   `<embed id="pdf" src="<blobUrl>#page=<n>&zoom=100">`; change page by replacing the
   embed with a new `#page=`. Move the mouse off the page, then `computer zoom` on the
   section with `save_to_disk: true`. The table of contents gives page numbers.
   Also capture the Revision History row when a date matters (e.g. when a rule started).
3. **TS:** quote the TS cell verbatim from the current workbook (or his last paste),
   with TS number, step range and column.

## 3. Check the source really governs the finding

A section can sit near the topic and still not cover it. 2026-10-20 correction:
SRD 12107 §2.2.7 (REQ-011–013) is about how the filter **ticks** behave — tick
"Fiuu - eWallet" ticks all 3 nested options; untick one and only that one clears,
the parent unticks, the other 2 stay ticked. It says nothing about what the
**results** display. Faizuddin: "it is telling about the behaviour of the filter,
not the result of the filter".

So for each finding:
1. Quote only a rule whose words describe the failing behaviour.
2. If no SRD rule covers it, write "Nothing on this" under "What the SRD says" and
   say the expectation comes from the TS (or a Teams/SA note — quote it with date).
3. A section that explains something that passed goes under "Passed", not under a
   failure.

## 4. Build the page

1. Folder: `_reference/tickets/<KEY>/<KEY>-<TS>-findings-<yyyy-mm-dd>/` with
   `<name>.html` and `img/`. The Artifact publish cannot read the scratchpad
   (blocked by a Read rule, 2026-10-20) — keep page and images in the repo.
2. Structure per finding (copy the example's CSS tokens and markup):
   a. Eyebrow: `Issue N · <system defect | confirm with dev | answered: expected>`.
   b. h2: the symptom in plain words. One short paragraph: where (page, filter, ref).
   c. **What the TS says** — verbatim quote + cite (TS no., steps, column).
   d. **What the SRD says** — screenshot + cite (file, page, §, REQ), or "Nothing on this".
   e. **What CIBO / the portal shows** — red-box screenshot + caption naming the file;
      exported-file rows as a small table, wrong cells in red.
   f. **Question for dev** or **Dev answer** box.
3. End with **Passed in the same run** (short list), plus SRD shots that back passes.
4. Header: TS id + name, run time and run id, environment, status pills.
5. Publish with Artifact: `file_path` = the html, `root` = the folder (absolute path),
   `files` = each `img/*.png`, `icon` = one word. Republish the same path to update.
6. When dev answers a question, update the box to "Dev answer (date)" with the quote
   and republish the same URL.

## 5. Reply in chat

Droid style, numbered lists (CLAUDE.md). Q-mapped if he asked several things. Give
the link, one line per finding (system / automation / data), and what he must ask
dev. Record new facts in `knowledge/<area>.md` with a source tag.
