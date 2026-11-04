#!/usr/bin/env python3
"""
Dump a CR's input workbook so an agent can read it, whatever shape it is.

    python automation/scripts/cr-dump-inputs.py EAINT-12341

Reads every .xlsx in cr/<TICKET>/00-input/ and writes cr/<TICKET>/01-intake/raw/
one .md per sheet, plus an index.

WHY A DUMPER AND NOT A PARSER
-----------------------------
Every ticket's workbook is laid out differently — different columns, different
header rows, sometimes the scenarios start halfway down a sheet. A parser built
for one ticket breaks on the next, and a parser built to guess silently maps
the wrong column to "expected result", which is the worst possible failure
because the test still runs and still passes.

So this extracts EVERYTHING and interprets NOTHING. The agent reads the dump,
proposes a mapping, and shows it for confirmation. Judgement stays with a
reader; this just makes the material readable.

It records merged cells and the sheet's own dimensions too, because a merged
header spanning four columns is exactly the thing that makes a naive read
assign values to the wrong field.
"""
import sys
from pathlib import Path

try:
    from openpyxl import load_workbook
except ImportError:
    sys.exit("openpyxl is not installed. Run: pip install openpyxl")

REPO = Path(__file__).resolve().parents[2]


def cell_text(value) -> str:
    """A cell as text, with newlines kept visible so steps stay readable."""
    if value is None:
        return ""
    return str(value).replace("\r\n", "\n").strip()


def fill_of(cell) -> str:
    """The cell's background colour, when it has one.

    Workbooks use colour as data. EAINT-12341's row 11 is a legend: yellow on a
    TS number means test data must be prepared; red means the expected result is
    not confirmed yet. A dump that drops formatting drops those facts SILENTLY —
    the reader cannot tell anything is missing.
    """
    try:
        f = cell.fill
        if not f or f.patternType in (None, "none"):
            return ""
        rgb = getattr(f.fgColor, "rgb", None)
        if not isinstance(rgb, str):
            theme = getattr(f.fgColor, "theme", None)
            return f"theme{theme}" if theme is not None else ""
        return "" if rgb in ("00000000", "FFFFFFFF") else rgb
    except Exception:
        return ""


def emphasis_of(cell) -> str:
    """Bold / strikethrough, which also carry meaning in a hand-made sheet."""
    marks = []
    try:
        fo = cell.font
        if fo:
            if fo.bold:
                marks.append("bold")
            if fo.strike:
                marks.append("struck")
    except Exception:
        pass
    return ",".join(marks)


def dump_sheet(ws) -> str:
    """One sheet as markdown: dimensions, merges, then every non-empty row."""
    out = [f"# Sheet: {ws.title}", ""]
    out.append(f"- dimensions: `{ws.dimensions}` ({ws.max_row} rows x {ws.max_column} cols)")
    merged = [str(r) for r in ws.merged_cells.ranges]
    if merged:
        out.append(f"- merged ranges ({len(merged)}): `{'`, `'.join(merged[:24])}`"
                   + (" …" if len(merged) > 24 else ""))
        out.append("  (a merged header spans several columns — do not assume one header = one column)")
    out.append("")

    palette: dict[str, int] = {}
    for row in ws.iter_rows():
        cells = [(c, cell_text(c.value)) for c in row]
        if not any(t for _, t in cells):
            continue
        out.append(f"## row {row[0].row}")
        for cell, text in cells:
            if not text:
                continue
            marks = []
            fill = fill_of(cell)
            if fill:
                marks.append(f"fill={fill}")
                palette[fill] = palette.get(fill, 0) + 1
            emph = emphasis_of(cell)
            if emph:
                marks.append(emph)
            suffix = f"  `[{chr(32).join(marks)}]`" if marks else ""
            # Long step lists stay whole — truncating them loses the test.
            out.append(f"- **{cell.coordinate}**: {text}{suffix}")
        out.append("")

    if palette:
        out.insert(3, "- fills in use: " + ", ".join(
            f"`{k}` x{v}" for k, v in sorted(palette.items(), key=lambda kv: -kv[1])))
        out.insert(4, "  (colour is often DATA — look for a legend row before ignoring it)")
    return "\n".join(out)


def main() -> int:
    if len(sys.argv) < 2:
        return print(__doc__) or 2

    ticket = sys.argv[1].strip().upper()
    ticket_dir = REPO / "cr" / ticket
    src = ticket_dir / "00-input"
    dst = ticket_dir / "01-intake" / "raw"

    if not src.is_dir():
        return print(f"No input folder: {src}\nCreate it and drop the .xlsx and .pdf in.") or 1

    # "~$…" is Excel's lock file for a workbook someone has open, not a workbook.
    books = sorted(b for b in list(src.glob("*.xlsx")) + list(src.glob("*.xlsm")) if not b.name.startswith("~$"))
    pdfs = sorted(src.glob("*.pdf"))
    if not books:
        print(f"No .xlsx in {src}")

    dst.mkdir(parents=True, exist_ok=True)
    index = [f"# {ticket} — raw input dump", "",
             "Extracted verbatim. Nothing here is interpreted; the mapping to",
             "`01-intake/scenarios.yaml` is proposed by the agent and confirmed by a human.", ""]

    for book in books:
        wb = load_workbook(book, data_only=True)
        index.append(f"## {book.name}")
        index.append(f"- sheets: {', '.join(wb.sheetnames)}")
        for name in wb.sheetnames:
            ws = wb[name]
            safe = "".join(ch if ch.isalnum() or ch in "-_" else "-" for ch in name)[:40]
            out_file = dst / f"{book.stem}--{safe}.md"
            out_file.write_text(dump_sheet(ws), encoding="utf-8")
            index.append(f"  - `{name}` -> `{out_file.name}` ({ws.max_row} rows)")
        index.append("")

    if pdfs:
        index.append("## PDFs (read these directly — they are not dumped)")
        for p in pdfs:
            index.append(f"- `00-input/{p.name}` ({p.stat().st_size // 1024} KB)")
        index.append("")

    (dst / "INDEX.md").write_text("\n".join(index), encoding="utf-8")
    print(f"{ticket}: dumped {len(books)} workbook(s) to {dst.relative_to(REPO)}")
    for line in index:
        if line.startswith("  - "):
            print(" ", line.strip())
    if pdfs:
        print(f"  {len(pdfs)} PDF(s) left in 00-input for direct reading")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
