# Pipeline working rules (Faizuddin's answers to the dashboard characters)

How Faizuddin wants the dashboard pipeline characters (Scout, Scribe, Elf, Dwarf,
Sage) to work. One rule per item, each with his exact words.

## 1. Fetch source material yourself

1. **Do not ask Faizuddin to convert or drop a file the pipeline can get itself**
   (SharePoint workbook text copy, SRD .docx text, Jira attachments, mockups).
   Try the toolbox first; ask only after it has truly failed.
   1. Scribe asked for a text copy of the Wholesale v3 workbook. Answer: "can you try get it yourself" `[Faizuddin, dashboard chat to Scribe, 2026-10-27]`
   2. Elf asked for an SRD v0.8 export and five open points. Answer: "can you fetch those details yourself?" `[Faizuddin, dashboard chat to Elf, 2026-10-27]`
   3. Both items were then fetched by the pipeline in the same session: the workbook via `xlsx-text.mjs`, the SRD and mockups after access was widened. `[source: pipeline EAINT-12019, Scribe related history + Elf scenarios, 2026-10-27]`
   4. Scribe asked whether the EAINT-10089 workbook should be checked by hand. Answer: "i want you to check it yourself" `[Faizuddin, dashboard chat to Scribe, 2026-10-27]`
   5. **Converter trap — OneDrive cloud-only + long path.** The workbook converter failed twice with: "OneDrive has not downloaded this workbook to the PC (cloud-only). Its path is 295 characters (over 260), so OneDrive cannot download it when a program opens it." EAINT-11175 failed the same way at "263 characters (over 260)". It converted on the third try after a fix on the PC side. `[source: pipeline EAINT-12386, Scribe chat, 2026-10-27 06:53 and 07:04 UTC]` Fix suggested by the converter: **"Always keep on this device"** on the folder, or a copy at a path under 260 characters. Which of these was done is not recorded [unconfirmed].
2. **Open points answered by a source go to the source, not to him.** Elf's fee, Resubmit and who-requests questions were all answered by SRD v0.8 once it was read. `[source: pipeline EAINT-12019, Elf scenarios, 2026-10-27]`

## 2. Access and outside writes

1. **Characters have full access, with core guards.** "can you make the characters to be able to do anything that you can. basically full permission and access as you" `[Faizuddin, Claude Code session, 2026-10-29]`. He chose "Full, keep core guards": still blocked are git commit / push, rm -r, PowerShell, existing eAuto suites a job does not own, and _reference/ outside html, tickets, miro, inbox, miro-links.txt. `[source: scripts/pipeline/actions/_tools.mjs, 2026-10-29]`
   1. Before this, an Elf chat job could not edit `.claude/skills/draft-TS-excel/scripts/build-workbook.mjs` ("File is in a directory that is denied by your permission settings"). That block is gone. `[source: pipeline EAINT-12028, Elf chat, 2026-10-29 3:39 pm]`
2. **Outside writes need his typed line.** "Allow outside writes, but only if i confirm. and by confirming, the characters need to give me a line to type in letter by letter, something like "i give permission to do this"" `[Faizuddin, Claude Code session, 2026-10-29]`. The character runs `node scripts/pipeline/tools/ask-permission.mjs "<what>"`, gives him the printed line ("i give permission to <character> for <KEY> <code>"), and only the next job whose chat message contains that line exactly may write to Jira, Confluence, Claude Docs or a published page. One line, one job, 24 hours. The runner cannot tell typing from pasting. `[source: scripts/pipeline/run-character.mjs + store.mjs claimPermission, 2026-10-29]`
3. **Where the workbooks live (EAINT-9805, 2026-11-02).** The official workbook sits at the top of the synced QA Team folder `Shortcuts\QA Team - eAuto - CR Test Scenarios\` (not in a ticket subfolder); a write to it syncs to the QA Team site. The **Open my folder** button opens the OneDrive `eAuto Documents/EAINT-9805` folder, which holds the newest "(Suggestion by Claude) (vNN)" file (highest number = latest), not the repo folder `_reference/tickets/<KEY>/`. `[source: pipeline EAINT-9805, Elf chat, 2026-11-02]`
4. **First use of the typed permission line on an official workbook:** after Faizuddin typed "i give permission to elf for EAINT-9805 BCA4", Elf wrote OS columns into the synced official copy, saved a backup first (`_reference/tickets/EAINT-9805/BACKUP-official-before-OS-columns-2026-11-02.xlsx`), and checked the other tabs were unchanged. `[source: pipeline EAINT-9805, Elf chat, 2026-11-02]`
