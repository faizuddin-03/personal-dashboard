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
