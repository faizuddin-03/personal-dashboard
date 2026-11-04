#!/usr/bin/env python3
"""
Refresh one ticket's card on the TS Hub (https://claude.ai/artifact/AthB2fsq3WtLVHvncuhWAj)
from its TS board, so the hub's counts, progress bar and per-sheet breakdown match the board.

    python automation/scripts/cr-hub-refresh.py EAINT-12345 --versions <dir> [--hub-version N] [--out <file>]

<dir> is the out_dir of an ArtifactData list of the board's `cases` (each case at <dir>/cases/<TS>.json);
a list of `sheets` into the same dir (<dir>/sheets/<KEY>.json) gives the sheet names and order. Without
it the names come from 01-intake/scenarios.yaml (meta.workbook.sheets) or stay as the sheet key.

Writes <out> (default cr/<TICKET>/04-runs/_hub/hub-write.json): ONE ArtifactData write for the hub,
  update tickets/<TICKET> {ts, counts{total,pass,fail,deprio}, sheets[...], synced}
pinned to --hub-version when given (read it first: ArtifactData get tickets/<TICKET> on the hub).
The session then sends it as an ArtifactData `update` (or `batch`) to the hub URL.

Also stamps ~/.claude/ts-hub-last-sync (epoch seconds): the SessionStart hook in
.claude/settings.local.json asks for a refresh when that stamp is older than 4 hours.

Called at the end of cr-board-sync.py --results as well, so results written to a board reach the hub
in the same step. Pipeline note: `knowledge/playbooks/` has nothing on this yet; the hub is Azfar's
own page (memory ts-hub.md), the count rule is: PASS / FAIL / DEPRIO* on `result`, anything else = to run.
"""
import json
import os
import sys
import time
from collections import OrderedDict
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
# The hub is one QA's own claude.ai page (Azfar's by default). Another QA points this at their own hub with
# TS_HUB_URL, or skips the hub step: nothing else in the pipeline depends on it.
HUB_URL = os.environ.get("TS_HUB_URL") or "https://claude.ai/artifact/AthB2fsq3WtLVHvncuhWAj"
STAMP = Path.home() / ".claude" / "ts-hub-last-sync"


def opt(name, default=None):
    return sys.argv[sys.argv.index(f"--{name}") + 1] if f"--{name}" in sys.argv else default


def load(f: Path) -> dict:
    d = json.loads(f.read_text(encoding="utf-8"))
    return d.get("data", d) if isinstance(d, dict) else {}


def bucket(result) -> str:
    r = str(result or "").strip().upper()
    if r == "PASS":
        return "pass"
    if r == "FAIL":
        return "fail"
    if r.startswith("DEPRIO"):
        return "deprio"
    return "notrun"


def sheet_names(ticket: str, vdir: Path) -> "OrderedDict[str, str]":
    names: "OrderedDict[str, str]" = OrderedDict()
    sdir = vdir / "sheets"
    if sdir.exists():
        rows = []
        for f in sdir.glob("*.json"):
            d = load(f)
            rows.append((d.get("order", 99), f.stem, d.get("name") or d.get("title") or f.stem))
        for _, key, name in sorted(rows):
            names[key] = name
        return names
    yml = REPO / "cr" / ticket / "01-intake" / "scenarios.yaml"
    if yml.exists():
        try:
            import yaml  # optional

            meta = (yaml.safe_load(yml.read_text(encoding="utf-8")) or {}).get("meta", {})
            for s in (meta.get("workbook", {}) or {}).get("sheets", []) or []:
                if s.get("key"):
                    names[s["key"]] = s.get("name") or s.get("title") or s["key"]
        except Exception:
            pass
    return names


def refresh(ticket: str, vdir: Path, hub_version=None, overrides: dict | None = None) -> dict:
    """overrides = {TS: result} not yet on the board (cr-board-sync's pending writes), counted as if landed."""
    cases = vdir / "cases"
    if not cases.exists():
        sys.exit(f"{cases} not found: list the board's `cases` with out_dir={vdir} first.")
    names = sheet_names(ticket, vdir)
    per: "OrderedDict[str, dict]" = OrderedDict((k, {"total": 0, "pass": 0, "fail": 0, "deprio": 0}) for k in names)
    counts = {"total": 0, "pass": 0, "fail": 0, "deprio": 0}
    overrides = overrides or {}
    for f in cases.glob("*.json"):
        d = load(f)
        b = bucket(overrides.get(f.stem, d.get("result")))
        sheet = str(d.get("sheet") or "?")
        row = per.setdefault(sheet, {"total": 0, "pass": 0, "fail": 0, "deprio": 0})
        row["total"] += 1
        counts["total"] += 1
        if b != "notrun":
            row[b] += 1
            counts[b] += 1
    sheets = [{"key": k, "name": names.get(k, k), **v} for k, v in per.items() if v["total"]]
    data = {
        "ts": counts["total"],
        "counts": counts,
        "sheets": sheets,
        "synced": datetime.now(timezone.utc).astimezone().isoformat(timespec="minutes"),
    }
    write = {"op": "update", "collection": "tickets", "doc_id": ticket, "data": data}
    if hub_version:
        write["if_version"] = int(hub_version)
    return write


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ticket = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else sys.exit(__doc__)
    vdir = Path(opt("versions", "")) if opt("versions") else sys.exit("--versions <dir> is required (ArtifactData out_dir of the board's cases).")
    write = refresh(ticket, vdir, opt("hub-version"))
    out = Path(opt("out") or (REPO / "cr" / ticket / "04-runs" / "_hub" / "hub-write.json"))
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({"url": HUB_URL, "writes": [write]}, indent=1, ensure_ascii=False), encoding="utf-8")
    STAMP.parent.mkdir(parents=True, exist_ok=True)
    STAMP.write_text(str(int(time.time())), encoding="utf-8")
    c = write["data"]["counts"]
    notrun = c["total"] - c["pass"] - c["fail"] - c["deprio"]
    print(f"{ticket}: {c['total']} TS · {c['pass']} pass · {c['fail']} fail · {c['deprio']} deprio · {notrun} to run · {len(write['data']['sheets'])} sheets")
    print(f"hub write -> {out}" + ("" if write.get("if_version") else "  (no --hub-version: read tickets/" + ticket + " on the hub and pin before sending)"))


if __name__ == "__main__":
    main()
