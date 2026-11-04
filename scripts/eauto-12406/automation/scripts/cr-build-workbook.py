#!/usr/bin/env python3
"""
Render a CR's scenarios.yaml as a test-scenario workbook, in the team's style.

    python automation/scripts/cr-build-workbook.py EAINT-12345
        → cr/EAINT-12345/01-intake/EAINT-12345_Test_Scenarios_draft.xlsx
    python automation/scripts/cr-build-workbook.py EAINT-12345 --results
        → cr/EAINT-12345/05-evidence/EAINT-12345_Test_Scenarios_results.xlsx
          (Test Result + Remarks from 05-evidence/review.json, written by cr-evidence)

The team has no fixed layout, so the COLUMNS come from the ticket's
scenarios.yaml (`meta.workbook.columns`, chosen by cr-draft for that ticket).
What is fixed is how the team reads a sheet at a glance (QA rules, 2026-09-28):

  TS No cell yellow  (FFFF00)  test data must be created BEFORE the deploy (case phase: pre-deploy)
  whole row grey     (D9D9D9)  deprioritised, with the reason in Remarks (case deprioritised: {by, reason})
  section header     grey in column A only, as in the 12289 / 12403 workbooks
  whole row orange   (FCE4D6, optional) case `highlight:` set: for the QA to decide at gate 0
                     (open scope / no SRD expected result); the ticket's legend says so

and a "Color Legend:" row above the table that says so, plus any legend
entries the ticket adds (`meta.workbook.legend`, e.g. "Fee affected" green).

What the team sheet looks like (the final EAINT-12403 workbook, QA 30.09.2026):

  header block       ticket link, test environment, test objective, SRD + source,
                     testing target (deploy / prod dates), optional reference box
                     on the right (e.g. the fee before/after per region)
  column groups      columns with the same `group` sit under one merged header
                     (e.g. "Test Scenarios" over Usage Code / Vehicle Type / Region)
  before / after     a case with `after: {steps, expected}` takes two rows: TS No
                     and the scenario columns merged, the after-deploy half below
  Review             Excel tickboxes the QA ticks after reviewing the evidence
  extra sheets       optional meta.workbook.extra_sheets [{name, columns, rows}], e.g.
                     "Proposed for QA decision" (EAINT-12019, 29.10.2026)
  Traceability sheet requirement, type, priority, source, expected source, why —
                     for the reviewer; kept off the team sheet unless a column asks

Generated from the yaml every time, so the workbook and the yaml never disagree.
Never touches a team workbook in 00-input/.
"""
import argparse
import json
import sys
from pathlib import Path

try:
    import yaml
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
    from openpyxl.utils import get_column_letter
except ImportError as e:
    sys.exit(f"{e.name} is not installed. Run: pip install pyyaml openpyxl")

REPO = Path(__file__).resolve().parents[2]

YELLOW = "FFFF00"
DEPRIO_GREY = "D9D9D9"
HEADER_BLUE = "C9DAF8"
HIGHLIGHT_ORANGE = "FCE4D6"   # case highlight: for the QA to decide (ticket explains it in meta.workbook.legend)
RESULT_FILL = {"PASS": "70AD47", "FAIL": "FF0000", "BLOCKED": "FFC000", "DEPRIORITISED": DEPRIO_GREY, "NOT RUN": "F2F2F2"}

# The team sheet: what a tester reads. Traceability goes on its own sheet.
DEFAULT_COLUMNS = [
    {"header": "TS No", "field": "id", "width": 20},
    {"header": "Test Scenario", "field": "situation", "width": 40},
    {"header": "Pre-condition / Test data", "field": "preconditions", "width": 36},
    {"header": "Test Steps", "field": "steps", "width": 55},
    {"header": "Expected Result", "field": "expected", "width": 58},
    {"header": "QA", "field": "qa", "width": 9},
    {"header": "Test Result", "field": "_result", "width": 12},
    {"header": "Remarks", "field": "_remarks", "width": 34},
    {"header": "Review", "field": "_review", "width": 9},
]
TRACE_FIELDS = [("TS No", "id", 20), ("Requirement", "requirement", 14), ("Type", "type", 12), ("Priority", "priority", 9),
                ("Source", "source", 30), ("Expected source", "expected_source", 34), ("Why this case", "why_this_case", 44)]
AFTER_FIELDS = ("steps", "expected")   # the only columns that differ between the before and after rows

fill = lambda rgb: PatternFill("solid", fgColor=rgb)
thin = Side(style="thin", color="999999")
BOX = Border(left=thin, right=thin, top=thin, bottom=thin)
WRAP = Alignment(wrap_text=True, vertical="top")


def text(v) -> str:
    if v is None:
        return ""
    if isinstance(v, list):
        return "\n".join(f"- {x}" if not isinstance(x, dict) else "- " + ", ".join(f"{k}: {x[k]}" for k in x) for x in v)
    if isinstance(v, dict):
        return "\n".join(f"{k}: {x}" for k, x in v.items())
    return str(v).strip()


def write_summary(ws, sheets, cases, meta, wbmeta, ticket):
    """Summary sheet: header block, legend, and the case count per area sheet."""
    lines = [
        f"Ticket(s): https://mfservices.atlassian.net/browse/{ticket}" + (f"  {meta['title']}" if meta.get("title") else ""),
        f"Test environment: {wbmeta.get('environment', '')}",
        f"Test objective: {wbmeta['objective']}" if wbmeta.get("objective") else None,
        f"SRD: {text((meta.get('drafted_from') or {}).get('srd'))}" + (f"  |  Source: {wbmeta['source']}" if wbmeta.get("source") else ""),
        f"Testing target: {wbmeta['target']}" if wbmeta.get("target") else None,
        wbmeta.get("note"),
    ]
    r = 1
    for line in [x for x in lines if x]:
        ws.cell(r, 1, line).font = Font(bold=r == 1)
        r += 1
    r += 1
    ws.cell(r, 1, "Color Legend:").font = Font(bold=True)
    legend = []
    if any(c.get("phase") == "pre-deploy" for c in cases):
        legend.append(("TS No highlighted", YELLOW, wbmeta.get("pre_deploy_text", "Test data MUST be created BEFORE Dev deploys to staging")))
    for entry in wbmeta.get("legend") or []:
        legend.append((entry["label"], entry["color"].lstrip("#")[-6:], entry.get("meaning", "")))
    legend.append(("Row highlighted", DEPRIO_GREY, "Deprioritised: not tested in this round, reason in Remarks"))
    for label, rgb, meaning in legend:
        ws.cell(r, 2, label).fill = fill(rgb)
        ws.cell(r, 3, meaning)
        r += 1
    r += 1
    heads = ["Sheet", "TS No prefix", "What it covers", "Cases", "P1", "P2", "P3", "Pre-deploy (yellow)", "Deprioritised", "With open question"]
    for j, h in enumerate(heads, 1):
        c = ws.cell(r, j, h)
        c.font, c.fill, c.border = Font(bold=True), fill(HEADER_BLUE), BOX
        c.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")
    tot = [0] * 7
    for sh in sheets:
        cs = [c for c in cases if c.get("sheet") == sh["key"]]
        nums = [len(cs), sum(c.get("priority") == "P1" for c in cs), sum(c.get("priority") == "P2" for c in cs),
                sum(c.get("priority") == "P3" for c in cs), sum(c.get("phase") == "pre-deploy" for c in cs),
                sum(bool(c.get("deprioritised")) for c in cs), sum(bool(c.get("open_questions")) for c in cs)]
        tot = [x + y for x, y in zip(tot, nums)]
        r += 1
        for j, v in enumerate([sh["name"], sh.get("prefix", ""), sh.get("title", "")] + nums, 1):
            c = ws.cell(r, j, v)
            c.alignment, c.border = WRAP, BOX
    r += 1
    for j, v in enumerate(["Total", "", ""] + tot, 1):
        c = ws.cell(r, j, v)
        c.font, c.border = Font(bold=True), BOX
    if meta.get("open_questions"):
        r += 2
        ws.cell(r, 1, f"Open questions: {len(meta['open_questions'])} (see the Open Questions sheet). "
                      "A case whose expected result is blank waits for the answer.")
    for j, w in enumerate([30, 18, 60, 8, 6, 6, 6, 12, 13, 13], 1):
        ws.column_dimensions[get_column_letter(j)].width = w


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("ticket")
    ap.add_argument("--results", action="store_true", help="fill Test Result / Remarks from 05-evidence/review.json")
    ap.add_argument("--from-board", action="store_true",
                    help="fill Test Result / QA / Remarks from the live board's export, 01-intake/board-cases.json (the board is the source; Excel is its copy)")
    ap.add_argument("--out")
    a = ap.parse_args()

    tdir = REPO / "cr" / a.ticket
    sc = yaml.safe_load((tdir / "01-intake" / "scenarios.yaml").read_text(encoding="utf-8"))
    meta, cases = sc.get("meta", {}), sc.get("cases", [])
    wbmeta = meta.get("workbook") or {}
    columns = wbmeta.get("columns") or DEFAULT_COLUMNS
    for need in ("_result", "_remarks", "_review"):
        if not any(c["field"] == need for c in columns):
            columns = columns + [c for c in DEFAULT_COLUMNS if c["field"] == need]
    columns_all = columns

    review = {}
    if a.from_board:
        bfile = tdir / "01-intake" / "board-cases.json"
        if not bfile.exists():
            sys.exit(f"No {bfile.relative_to(REPO)}. Export the board's cases first (ArtifactData list `cases`).")
        rows = json.loads(bfile.read_text(encoding="utf-8"))
        rows = rows if isinstance(rows, list) else rows.get("cases", [])
        board = {r["id"]: r for r in rows if r.get("id")}
        for case in cases:
            b = board.get(case["id"])
            if not b:
                continue
            if b.get("qa"):
                case["qa"] = b["qa"]
            if b.get("result") == "DEPRIORITIZED":
                case["deprioritised"] = {"reason": b.get("deprio", "")}
            elif b.get("result"):
                review[case["id"]] = {"result": b["result"], "remarks": b.get("remarks", "")}
        a.results = True
        a.out = a.out or str(tdir / "05-evidence" / f"{a.ticket}_Test_Scenarios_results.xlsx")
    elif a.results:
        rfile = tdir / "05-evidence" / "review.json"
        if not rfile.exists():
            sys.exit(f"No {rfile.relative_to(REPO)}. cr-evidence writes it after reviewing the evidence.")
        review = json.loads(rfile.read_text(encoding="utf-8")).get("cases", {})

    wb = Workbook()
    sheets = wbmeta.get("sheets")   # [{key, name, prefix, title}]: one sheet per area plus a Summary (large CRs, e.g. EAINT-12022)
    review_cols = []

    def with_tail(cols):
        for need in ("_result", "_remarks", "_review"):
            if not any(c["field"] == need for c in cols):
                cols = cols + [c for c in DEFAULT_COLUMNS if c["field"] == need]
        return cols

    def write_sheet(ws, cases, extra_lines=(), sheet_columns=None):
        # A sheet may bring its own columns: the layout follows what that sheet verifies
        # (QA 01.10.2026: e.g. a per-insurer matrix, field / input / message for a pop-up).
        columns = with_tail(sheet_columns) if sheet_columns else columns_all
        ncol = len(columns)
        review_cells = []
        # ---------------------------------------------------------------- header block
        lines = [
            f"Ticket(s): https://mfservices.atlassian.net/browse/{a.ticket}" + (f"  {meta['title']}" if meta.get("title") else ""),
            f"Test environment: {wbmeta.get('environment') or ', '.join(sorted({str(c.get('environment', '')) for c in cases if c.get('environment')}))}",
            f"Test objective: {wbmeta['objective']}" if wbmeta.get("objective") else None,
            f"SRD: {text((meta.get('drafted_from') or {}).get('srd')) or meta.get('source_workbook', '')}" + (f"  |  Source: {wbmeta['source']}" if wbmeta.get("source") else ""),
            f"Testing target: {wbmeta['target']}" if wbmeta.get("target") else None,
            wbmeta.get("note"),
            *extra_lines,
        ]
        hr = 1
        for line in [x for x in lines if x]:
            ws.cell(hr, 1, line).font = Font(bold=hr == 1)
            hr += 1
        ref = wbmeta.get("reference")   # {title, text}: a box on the right, e.g. fee before/after per region
        if ref:
            rc = next((j for j, col in enumerate(columns, 1) if col["field"] == "steps"), max(2, ncol - 4))
            ws.cell(1, rc, ref.get("title", "Reference")).font = Font(bold=True)
            box = ws.cell(2, rc, text(ref.get("text")))
            box.alignment, box.border = WRAP, BOX
            ws.merge_cells(start_row=2, start_column=rc, end_row=max(hr, 6), end_column=min(ncol, rc + 3))
            hr = max(hr, 7)

        legend = []
        if any(c.get("phase") == "pre-deploy" for c in cases):
            legend.append(("TS No highlighted", YELLOW, wbmeta.get("pre_deploy_text", "Test data MUST be created BEFORE Dev deploys to staging")))
        for entry in wbmeta.get("legend") or []:
            legend.append((entry["label"], entry["color"].lstrip("#")[-6:], entry.get("meaning", "")))
        legend.append(("Row highlighted", DEPRIO_GREY, "Deprioritised: not tested in this round, reason in Remarks"))

        r = hr + 1
        ws.cell(r, 1, "Color Legend:").font = Font(bold=True)
        for label, rgb, meaning in legend:
            ws.cell(r, 2, label).fill = fill(rgb)
            ws.cell(r, 3, meaning)
            r += 1

        # ---------------------------------------------------------------- table
        r += 1
        head_row = r
        grouped = any(col.get("group") for col in columns)

        def hstyle(c):
            c.font, c.fill, c.border = Font(bold=True), fill(HEADER_BLUE), BOX
            c.alignment = Alignment(wrap_text=True, vertical="center", horizontal="center")

        j = 1
        while j <= ncol:
            col = columns[j - 1]
            ws.column_dimensions[get_column_letter(j)].width = col.get("width", 20)
            g = col.get("group")
            if grouped and g:
                k = j
                while k < ncol and columns[k].get("group") == g:
                    k += 1
                hstyle(ws.cell(r, j, g))
                ws.merge_cells(start_row=r, start_column=j, end_row=r, end_column=k)
                for m in range(j, k + 1):
                    ws.column_dimensions[get_column_letter(m)].width = columns[m - 1].get("width", 20)
                    hstyle(ws.cell(r + 1, m, columns[m - 1]["header"]))
                j = k + 1
                continue
            hstyle(ws.cell(r, j, col["header"]))
            if grouped:
                hstyle(ws.cell(r + 1, j))
                ws.merge_cells(start_row=r, start_column=j, end_row=r + 1, end_column=j)
            j += 1
        if grouped:
            r += 1
        ws.freeze_panes = ws.cell(r + 1, 2)

        section = None
        for case in cases:
            if case.get("section") and case["section"] != section:
                section = case["section"]
                r += 1
                c = ws.cell(r, 1, section)
                c.font, c.fill = Font(bold=True), fill(DEPRIO_GREY)
                ws.merge_cells(start_row=r, start_column=1, end_row=r, end_column=ncol)
            r += 1
            deprio = case.get("deprioritised")
            # The final verdict is the post-push one; a pre-push verdict only stands when nothing followed it.
            rev = next((review[k] for k in (f"post-push:{case['id']}", f"none:{case['id']}", case["id"], f"pre-push:{case['id']}")
                        if k in review), {})
            for j, col in enumerate(columns, 1):
                f = col["field"]
                if f == "_result":
                    v = "DEPRIORITISED" if deprio else rev.get("result", "")
                elif f == "_remarks":
                    parts = []
                    if deprio:
                        parts.append(f"Deprioritised{' by ' + deprio['by'] if isinstance(deprio, dict) and deprio.get('by') else ''}: "
                                     f"{deprio.get('reason', '') if isinstance(deprio, dict) else deprio}")
                    if rev.get("remarks"):
                        parts.append(rev["remarks"])
                    if case.get("remarks"):
                        parts.append(text(case["remarks"]))
                    v = "\n".join(parts)
                elif f == "_review":
                    v = False                       # the QA ticks it after reviewing the evidence
                    review_cells.append(get_column_letter(j))
                elif f == "qa":
                    v = text(case.get("qa") or wbmeta.get("qa"))
                else:
                    v = text(case.get(f))
                if f in AFTER_FIELDS and case.get("after") and v:
                    v = f"{wbmeta.get('before_label', 'Before Dev deploys:')}\n{v}"
                c = ws.cell(r, j, v)
                c.alignment, c.border = WRAP, BOX
                if f == "_result" and v in RESULT_FILL:
                    c.fill = fill(RESULT_FILL[v])
            first = r
            if case.get("after"):                   # the after-deploy half, one row down
                r += 1
                for j, col in enumerate(columns, 1):
                    f = col["field"]
                    c = ws.cell(r, j)
                    c.alignment, c.border = WRAP, BOX
                    if f in AFTER_FIELDS:
                        v = text(case["after"].get(f))
                        c.value = f"{wbmeta.get('after_label', 'After Dev deploys:')}\n{v}" if v else None
                    elif f not in ("_result", "_remarks", "_review"):
                        ws.merge_cells(start_row=first, start_column=j, end_row=r, end_column=j)
            for rr in range(first, r + 1):
                if deprio:
                    for j in range(1, ncol + 1):
                        ws.cell(rr, j).fill = fill(DEPRIO_GREY)  # the WHOLE row: that is what "deprioritised" looks like
                elif case.get("highlight"):
                    # Highlighted for the QA (open scope, or no SRD expected result yet): the whole row in the
                    # ticket's highlight colour; say what it means in meta.workbook.legend (EAINT-12406, 28.10.2026)
                    for j, col in enumerate(columns, 1):
                        if col["field"] == "_result" and ws.cell(rr, j).value in RESULT_FILL:
                            continue
                        ws.cell(rr, j).fill = fill(wbmeta.get("highlight_color", HIGHLIGHT_ORANGE))
            if not deprio and case.get("phase") == "pre-deploy":
                ws.cell(first, 1).fill = fill(YELLOW)

        ws.auto_filter.ref = f"A{head_row}:{get_column_letter(ncol)}{r}"

        return review_cells

    if not sheets:
        ws = wb.active
        ws.title = "Test Scenarios"
        review_cols += write_sheet(ws, cases)
    else:
        summ = wb.active
        summ.title = wbmeta.get("summary_sheet", "Summary")
        keys = [sh["key"] for sh in sheets]
        stray = [c["id"] for c in cases if c.get("sheet") not in keys]
        if stray:
            sys.exit(f"cases with no known sheet: {stray[:10]}")
        for sh in sheets:
            ws = wb.create_sheet(sh["name"][:31])
            review_cols += write_sheet(ws, [c for c in cases if c.get("sheet") == sh["key"]],
                                       [f"Sheet: {sh.get('title', sh['name'])}", *(sh.get("setup") or [])],
                                       sh.get("columns"))
        write_summary(summ, sheets, cases, meta, wbmeta, a.ticket)

    # ---------------------------------------------------------------- traceability (for the reviewer)
    on_sheet = {col["field"] for col in columns}
    if sheets and all(sh.get("columns") for sh in sheets):
        on_sheet = set.intersection(*({c["field"] for c in sh["columns"]} for sh in sheets))
    trace = [t for t in TRACE_FIELDS if t[1] == "id" or t[1] not in on_sheet]
    if sheets:
        trace = [trace[0], ("Sheet", "sheet", 10)] + trace[1:]
    if len(trace) > 1:
        tr = wb.create_sheet("Traceability")
        for j, (h, f, w) in enumerate(trace, 1):
            c = tr.cell(1, j, h)
            c.font, c.fill = Font(bold=True), fill(HEADER_BLUE)
            tr.column_dimensions[get_column_letter(j)].width = w
        for i, case in enumerate(cases, 2):
            for j, (h, f, w) in enumerate(trace, 1):
                tr.cell(i, j, text(case.get(f))).alignment = WRAP

    # ---------------------------------------------------------------- open questions
    moq = meta.get("open_questions")   # [{id, question, sources, who, decision}]; Blocks is computed from the cases
    if moq:
        oq = wb.create_sheet(wbmeta.get("open_questions_sheet", "Open Questions")[:31])
        heads = [("OQ No", 9), ("Question / conflict", 70), ("Sources", 34), ("Who to ask", 18), ("Blocks (TS No)", 40), ("Status / decision", 34)]
        for j, (h, w) in enumerate(heads, 1):
            c = oq.cell(1, j, h)
            c.font, c.fill, c.border = Font(bold=True), fill(HEADER_BLUE), BOX
            oq.column_dimensions[get_column_letter(j)].width = w
        for i, q in enumerate(moq, 2):
            blocks = [c["id"] for c in cases if any(str(x).startswith(q["id"] + ":") for x in (c.get("open_questions") or []))]
            vals = [q["id"], text(q.get("question")), text(q.get("sources")), text(q.get("who")),
                    "; ".join(x for x in (text(q.get("blocks")), ", ".join(blocks)) if x) or "-", text(q.get("decision"))]
            for j, v in enumerate(vals, 1):
                c = oq.cell(i, j, v)
                c.alignment, c.border = WRAP, BOX
        oq.freeze_panes = "B2"
        if sheets and "Traceability" in wb.sheetnames:   # keep the numbered area sheets together
            wb.move_sheet(oq, offset=-1)
    else:
        oq = wb.create_sheet("Open questions")
        for j, h in enumerate(["TS No", "Question", "Blocks"], 1):
            c = oq.cell(1, j, h)
            c.font, c.fill = Font(bold=True), fill(HEADER_BLUE)
        i = 1
        for case in cases:
            for q in case.get("open_questions") or []:
                i += 1
                oq.cell(i, 1, case["id"])
                oq.cell(i, 2, text(q)).alignment = WRAP
                oq.cell(i, 3, "expected result" if not case.get("expected") else "")
        oq.column_dimensions["A"].width, oq.column_dimensions["B"].width, oq.column_dimensions["C"].width = 18, 90, 18

    # ---------------------------------------------------------------- extra tables (optional)
    # meta.workbook.extra_sheets: [{name, columns: [{header, width}], rows: [[...]]}], e.g. "Proposed for QA decision"
    # (duplicates / hard-to-run rows a review flagged, which only the QA may drop) or a mock-up difference map.
    for xs in wbmeta.get("extra_sheets") or []:
        es = wb.create_sheet(str(xs["name"])[:31])
        for j, col in enumerate(xs.get("columns") or [], 1):
            c = es.cell(1, j, col["header"])
            c.font, c.fill, c.border = Font(bold=True), fill(HEADER_BLUE), BOX
            es.column_dimensions[get_column_letter(j)].width = col.get("width", 24)
        for i, row in enumerate(xs.get("rows") or [], 2):
            for j, v in enumerate(row, 1):
                c = es.cell(i, j, text(v))
                c.alignment, c.border = WRAP, BOX
        es.freeze_panes = "A2"

    out = Path(a.out) if a.out else (
        tdir / "05-evidence" / f"{a.ticket}_Test_Scenarios_results.xlsx" if a.results
        else tdir / "01-intake" / f"{a.ticket}_Test_Scenarios_draft.xlsx")
    out.parent.mkdir(parents=True, exist_ok=True)
    wb.save(out)
    review_cells = review_cols
    if review_cells:   # openpyxl cannot write Excel tickboxes; put them on afterwards
        import subprocess
        subprocess.run([sys.executable, str(Path(__file__).with_name("xlsx-restore-checkboxes.py")), str(out),
                        ",".join(sorted(set(review_cells)))], check=True)   # sheets with their own layout put Review in different columns
    print(f"wrote {out.relative_to(REPO) if out.is_relative_to(REPO) else out}: {len(cases)} cases, "
          f"{sum(1 for c in cases if c.get('phase') == 'pre-deploy')} pre-deploy, "
          f"{sum(1 for c in cases if c.get('deprioritised'))} deprioritised")
    return 0


if __name__ == "__main__":
    sys.exit(main())
