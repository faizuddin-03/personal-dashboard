#!/usr/bin/env python3
"""
Turn an SRD (.pdf or .docx) into plain text an agent can read and quote.

    python automation/scripts/doc-to-text.py cr/EAINT-12403/00-input/SRD_EAINT-12403_v1.1_20260925.pdf
    python automation/scripts/doc-to-text.py <file> --out cr/EAINT-12403/01-intake/raw/srd.md

PDF: one "## Page N" heading per page, so a citation can name the page.
DOCX: paragraphs and table rows in document order, read from word/document.xml
with the standard library (python-docx is not installed here and is not needed).

Extracts, interprets nothing: tables come out as ` | `-joined rows, images and
diagrams do not come out at all. So a requirement that lives only in a
screenshot will be missing, and the reader must say so rather than assume there
is no requirement. Open the PDF directly (Read tool, pages=) for those.
"""
import argparse
import re
import sys
import zipfile
from pathlib import Path
from xml.etree import ElementTree as ET

W = "{http://schemas.openxmlformats.org/wordprocessingml/2006/main}"


def pdf_text(path: Path) -> str:
    try:
        from pypdf import PdfReader
    except ImportError:
        sys.exit("pypdf is not installed. Run: pip install pypdf")
    reader = PdfReader(str(path))
    return "\n\n".join(
        f"## Page {i}\n\n{(page.extract_text() or '').strip()}" for i, page in enumerate(reader.pages, 1)
    )


def docx_text(path: Path) -> str:
    with zipfile.ZipFile(path) as z:
        root = ET.fromstring(z.read("word/document.xml"))
    body = root.find(f"{W}body")
    out: list[str] = []

    def para(p) -> str:
        return "".join(t.text or "" for t in p.iter(f"{W}t")).strip()

    for block in body:
        if block.tag == f"{W}p":
            text = para(block)
            style = block.find(f"{W}pPr/{W}pStyle")
            level = re.search(r"(\d)$", style.get(f"{W}val", "")) if style is not None else None
            if text:
                out.append(("#" * (int(level.group(1)) + 1) + " " if level and "eading" in style.get(f"{W}val", "") else "") + text)
        elif block.tag == f"{W}tbl":
            for row in block.iter(f"{W}tr"):
                cells = [" ".join(para(p) for p in c.iter(f"{W}p")).strip() for c in row.iter(f"{W}tc")]
                out.append("| " + " | ".join(cells) + " |")
            out.append("")
    return "\n".join(out)


def main() -> int:
    p = argparse.ArgumentParser()
    p.add_argument("file")
    p.add_argument("--out")
    a = p.parse_args()
    path = Path(a.file)
    suffix = path.suffix.lower()
    if suffix == ".pdf":
        text = pdf_text(path)
    elif suffix == ".docx":
        text = docx_text(path)
    else:
        sys.exit(f"Not a .pdf or .docx: {path}")
    text = f"<!-- extracted from {path.name} by doc-to-text.py; images and diagrams are not included -->\n\n{text}\n"
    if a.out:
        Path(a.out).parent.mkdir(parents=True, exist_ok=True)
        Path(a.out).write_text(text, encoding="utf-8")
        print(f"wrote {a.out} ({len(text)} chars)")
    else:
        sys.stdout.reconfigure(encoding="utf-8")
        print(text)
    return 0


if __name__ == "__main__":
    sys.exit(main())
