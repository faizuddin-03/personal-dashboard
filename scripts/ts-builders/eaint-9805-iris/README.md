# EAINT-9805 Iris TS builder (2026-10-29)

Builds "Suggestion by Claude - EAINT-9805 - Iris TS.xlsx" in the EAINT-7229
"Dermalog TS" layout (loads the 7229 workbook as the style template).

    node build-9805-iris.mjs "<7229 workbook>" "<out.xlsx>"

1. Rows: `iris-rows.json` (sections → rows; `**bold**`, `++green++`, `!!red!!`).
2. Template: `_reference/sharepoint/eauto-cr-test-scenarios/EAINT-7229 - [eAuto] To update frontend to Chrome (including replacing applet with web socket).xlsx`.
3. Output last written to OneDrive `eAuto Documents/EAINT-9805/`.
4. Pending: f2f notes (2026-10-29) require 3 tabs (Biometric / Interruption / Short check) — see
   `data/pipeline/work/EAINT-9805/history.md` standing decision 10. The script builds one tab today.
5. `inspect.mjs <xlsx> <sheet...>` dumps cell styles, used to copy the 7229 format.
