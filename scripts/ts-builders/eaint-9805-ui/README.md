# EAINT-9805 — UI TS tab

Added to the official QA Team workbook on 2026-11-03 at Faizuddin's request:
"it should have its own tab, the UI TS. and make it directly into the oline sheet".

1. **Content:** `ui-rows.json`, 39 TS (9805_UI_TS01–39) in 4 sections: screen layout per page, rotation (stays portrait), fold phone fold / unfold mid process, tablet and iPad.
2. **Result columns:** Android 15 | Android 17 | Fold (Android 17) | Tablet (Android 15) | iOS 27 | iPadOS. Grey cells = the TS does not run there.
3. **How it was put in (file locked for shared use, so it could not be replaced):**
   1. `make-office-script.mjs` → Office Script that builds the tab in Excel Online from "Device & Performance TS" formats (plain text).
      Do not name a variable `src` in an Office Script: `src.getRange is not a function`.
   2. `make-paste-html.mjs` → HTML blocks for Test Steps and Expected Result. Pasted with `htmlclip.ps1` (in the session scratchpad; CF_HTML clipboard) so the in-cell bold / colour runs stay. Set the clipboard right before Ctrl+V; selecting cells through the Name Box can overwrite it.
   3. The HTML paste drops the trailing blank line: added back with F2, Alt+Enter, Enter per cell, then an Office Script set top alignment and autofit rows.
4. **`add-ui-tab.mjs`:** XML-patch version that adds the tab to a downloaded copy. Use it when the file is NOT open by anyone (REST upload needs the file unlocked).
