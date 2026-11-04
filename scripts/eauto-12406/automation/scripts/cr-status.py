#!/usr/bin/env python3
"""
Where is every CR up to?

    python automation/scripts/cr-status.py
    python automation/scripts/cr-status.py EAINT-12345

Reads each cr/<TICKET>/ folder and reports the stage it has actually reached —
from the files present, not from what STATUS.md claims. A STATUS.md that has
drifted is exactly the thing this is meant to catch.

This is a SCRIPT, not an agent, because it needs no judgement. It counts files
and yaml keys. Anything that needs judgement about a result belongs to a human
or to cr-triage.
"""
import re
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
CR = REPO / "cr"


def yaml_value(text: str, key: str) -> str:
    """The value of a top-level-ish `key:` — enough for the few we check."""
    m = re.search(rf"^\s*{re.escape(key)}:\s*(.*)$", text, re.MULTILINE)
    return (m.group(1).strip().strip('"').strip("'") if m else "")


def approved_counts(plan: Path) -> tuple[int, int]:
    """(signed, total) assertion blocks."""
    if not plan.is_file():
        return (0, 0)
    text = plan.read_text(encoding="utf-8", errors="replace")
    total = len(re.findall(r"^\s*-\s+case:", text, re.MULTILINE))
    signed = len([m for m in re.findall(r"^\s*approved:\s*(.*)$", text, re.MULTILINE)
                  if m.strip().strip('"').strip("'")])
    return (signed, total)


def stage(t: Path) -> str:
    """The furthest stage this ticket has real evidence of reaching."""
    runs = [d for d in (t / "04-runs").glob("*") if d.is_dir()] if (t / "04-runs").is_dir() else []
    specs = list((t / "03-spec").rglob("*.spec.ts")) if (t / "03-spec").is_dir() else []
    signed, total = approved_counts(t / "02-plan" / "assertions.yaml")
    scenarios = t / "01-intake" / "scenarios.yaml"
    inputs = list((t / "00-input").glob("*")) if (t / "00-input").is_dir() else []
    inputs = [f for f in inputs if f.name != ".gitkeep"]

    evidence = t / "05-evidence"
    if (evidence / "review.json").is_file():
        index = (evidence / "index.json").read_text(encoding="utf-8", errors="replace") if (evidence / "index.json").is_file() else ""
        pending = index.count('"review": "pending"')
        return f"evidence reviewed ({pending} pending)" if pending else "evidence reviewed"
    if (evidence / "index.json").is_file():
        return "evidence collected, NOT reviewed"
    if runs:
        return "run"
    if specs:
        return "authored"
    if total and signed == total:
        return "plan signed"          # pre-09.10.2026 tickets that still carry assertions.yaml
    if total:
        return f"plan drafted ({signed}/{total} signed)"
    if (t / "01-intake" / "review").is_dir() and any((t / "01-intake" / "review").glob("*coverage.md")):
        text = scenarios.read_text(encoding="utf-8", errors="replace") if scenarios.is_file() else ""
        if not yaml_value(text, "approved_by"):
            return "coverage reviewed — awaiting gate 0"
    if scenarios.is_file():
        text = scenarios.read_text(encoding="utf-8", errors="replace")
        if yaml_value(text, "origin") in ("drafted", "mixed"):
            return "draft approved (gate 0)" if yaml_value(text, "approved_by") else "drafted — awaiting gate 0"
        confirmed = yaml_value(text, "confirmed_by")
        return "intake read" if confirmed else "intake — mapping NOT confirmed"
    if (t / "01-research" / "study.md").is_file():
        return "researched"
    if (t / "00-input" / "ticket.md").is_file():
        return "fetched"
    if inputs:
        return "input dropped"
    return "empty"


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    if not CR.is_dir():
        return print("No cr/ folder.") or 1

    only = sys.argv[1].upper() if len(sys.argv) > 1 else None
    tickets = sorted(
        d for d in CR.iterdir()
        if d.is_dir() and not d.name.startswith("_") and (not only or d.name.upper() == only)
    )
    if not tickets:
        return print(f"No ticket folders in cr/{' matching ' + only if only else ''}.") or 0

    print(f"{'TICKET':<16} {'STAGE':<34} {'SIGNED':>7}  {'SPECS':>5}  {'RUNS':>4}  LAST RUN")
    print("-" * 96)
    for t in tickets:
        signed, total = approved_counts(t / "02-plan" / "assertions.yaml")
        specs = len(list((t / "03-spec").rglob("*.spec.ts"))) if (t / "03-spec").is_dir() else 0
        runs = sorted(d.name for d in (t / "04-runs").glob("*") if d.is_dir()) if (t / "04-runs").is_dir() else []
        print(f"{t.name:<16} {stage(t):<34} {f'{signed}/{total}':>7}  {specs:>5}  {len(runs):>4}  "
              f"{runs[-1] if runs else '-'}")

    print()
    print("A ticket stuck at 'mapping NOT confirmed' is waiting on you to check the")
    print("column mapping. One at 'plan drafted' is waiting on your signature.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
