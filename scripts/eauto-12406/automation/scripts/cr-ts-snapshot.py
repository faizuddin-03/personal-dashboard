#!/usr/bin/env python3
"""
Write cr/<TICKET>/01-intake/ts.json — the TS as the runner proves them.

    python automation/scripts/cr-ts-snapshot.py EAINT-12345                   # from the board export
    python automation/scripts/cr-ts-snapshot.py EAINT-12345 --from-yaml       # from 01-intake/scenarios.yaml
    python automation/scripts/cr-ts-snapshot.py EAINT-12345 --check IC_LST_TS2

The board (the live artifact) is the source. Before a run, the runner session
reads the board's `cases` with ArtifactData and saves them, unchanged, as
cr/<TICKET>/01-intake/board-cases.json (a list of {id, ...fields}); this script
turns that into ts.json. `--from-yaml` is for a ticket that has no board.

EXPECTED POINTS. The `ts` fixture (automation/src/fixtures/ts-run.ts) makes a
spec prove every point, and the per-TS gate files a TS as valid only when each
one is proved with a screenshot. A case's points are:
  - its `points` list when the board has one ([{id, text}] or plain strings), else
  - one point per top-level bullet of `expected` ("•", "-", "*" or "1." at the
    start of a line); indented lines belong to the bullet above, else
  - the whole `expected` as E1.
A case with no expected result gets no points; the gate then refuses it, which
is right: there is nothing to prove.

This is a SCRIPT, not an agent: it splits text, it does not judge it.
"""
import json
import re
import sys
from datetime import datetime
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
BULLET = re.compile(r"^(?:[•\-*]|\d+[.)])\s+(.*)$")

# Board fields copied into ts.json when present (the rest stays on the board).
# needs (21.10.2026): single | ucd2ucd | main+sub, read by cr-run.mjs --lane auto to ask the lane broker
KEEP = ("sheet", "type", "situation", "preconditions", "test_data", "steps", "expected", "priority", "qa", "labels", "updated", "needs")


def points_of(case: dict) -> list[dict]:
    pts = case.get("points")
    if pts:
        out = []
        for i, p in enumerate(pts, 1):
            if isinstance(p, dict):
                out.append({"id": p.get("id") or f"E{i}", "text": str(p.get("text", "")).strip()})
            else:
                out.append({"id": f"E{i}", "text": str(p).strip()})
        return out
    exp = str(case.get("expected") or "").strip()
    if not exp:
        return []
    items: list[str] = []
    for line in exp.splitlines():
        if not line.strip():
            continue
        m = BULLET.match(line)  # a bullet at column 0 starts a point
        if m:
            items.append(m.group(1).strip())
        elif items and line[:1].isspace():
            items[-1] += "\n" + line.strip()  # an indented line belongs to the point above
        elif items:
            items[-1] += "\n" + line.strip()
        # a line before the first bullet ("Ensure:") is a lead-in, not a point
    if not items:
        items = [exp]
    return [{"id": f"E{i}", "text": t} for i, t in enumerate(items, 1)]


def load_cases(ticket: str, from_yaml: bool) -> list[dict]:
    base = REPO / "cr" / ticket / "01-intake"
    if from_yaml:
        import yaml  # PyYAML

        data = yaml.safe_load((base / "scenarios.yaml").read_text(encoding="utf-8"))
        return data.get("cases") or []
    board = base / "board-cases.json"
    if not board.exists():
        sys.exit(f"{board} not found: export the board's cases first (or pass --from-yaml).")
    data = json.loads(board.read_text(encoding="utf-8"))
    return data if isinstance(data, list) else data.get("cases", [])


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    if not args:
        sys.exit(__doc__)
    ticket = args[0]
    from_yaml = "--from-yaml" in sys.argv
    cases = load_cases(ticket, from_yaml)
    out = {}
    for c in cases:
        cid = c.get("id") or c.get("ts") or c.get("ts_no")
        if not cid:
            continue
        entry = {"id": cid, **{k: c[k] for k in KEEP if c.get(k) not in (None, "", [])}}
        entry["points"] = points_of(c)
        out[cid] = entry
    if "--check" in sys.argv:
        ts = sys.argv[sys.argv.index("--check") + 1]
        print(json.dumps(out.get(ts), indent=2, ensure_ascii=False))
        return
    dest = REPO / "cr" / ticket / "01-intake" / "ts.json"
    dest.write_text(json.dumps({
        "ticket": ticket,
        "source": "scenarios.yaml" if from_yaml else "board-cases.json",
        "written": datetime.now().isoformat(timespec="seconds"),
        "cases": out,
    }, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    no_points = [k for k, v in out.items() if not v["points"]]
    print(f"{dest.relative_to(REPO)}: {len(out)} TS, {sum(len(v['points']) for v in out.values())} expected points"
          + (f"; {len(no_points)} TS have NO expected result: {', '.join(no_points[:10])}" if no_points else ""))


if __name__ == "__main__":
    main()
