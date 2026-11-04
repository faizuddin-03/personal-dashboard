#!/usr/bin/env python3
"""
File one CR run's evidence into the ticket's handover folder, and say what the
run did and did not prove.

    python automation/scripts/cr-collect-evidence.py EAINT-12345 <RUN_ID> --env preprod1 --phase none
    python automation/scripts/cr-collect-evidence.py EAINT-12403 <RUN_ID> --env preprod1 --phase pre-push

Reads   cr/<TICKET>/04-runs/<RUN_ID>/results.json + evidence/   (written by the run)
        cr/<TICKET>/01-intake/scenarios.yaml, 02-plan/assertions.yaml
Writes  04-runs/<RUN_ID>/environment.txt, summary.md
        05-evidence/[<phase>/]<case>/        the handover copy, one folder per case
        05-evidence/pre-push/seeds.json + SEEDS.md   (pre-push runs that recorded seeds)
        05-evidence/index.json + INDEX.md    every case, its files, its expected result, review: pending

This is a SCRIPT, not an agent: copying files and counting results needs no
judgement. Whether a screenshot actually proves the expected result is
cr-evidence's job, and INDEX.md leaves every case at `review: pending` for it.

A case folder that already exists in 05-evidence is MOVED to
05-evidence/_previous/<its run id>/ first. Nothing is deleted, and the index
says which run each case's evidence came from.
"""
import argparse
import getpass
import json
import re
import os
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

try:
    import yaml
except ImportError:
    sys.exit("PyYAML is not installed. Run: pip install pyyaml")

REPO = Path(__file__).resolve().parents[2]
PHASES = ("pre-push", "post-push")
ANSI = re.compile(r"\x1b\[[0-9;]*m")  # colour codes in Playwright error messages


def git(*args: str) -> str:
    try:
        return subprocess.run(["git", *args], cwd=REPO, capture_output=True, text=True, check=True).stdout.strip()
    except Exception:
        return "?"


def load_yaml(path: Path) -> dict:
    return yaml.safe_load(path.read_text(encoding="utf-8")) or {} if path.exists() else {}


def case_id(title: str) -> str:
    head = title.split(" ", 1)[0]
    return head if "_" in head else title


def walk_tests(suite: dict, trail=()):
    """Yield (title, spec file, test) for every test in the JSON reporter tree."""
    for spec in suite.get("specs", []):
        for t in spec.get("tests", []):
            yield spec["title"], spec.get("file", ""), t
    for child in suite.get("suites", []):
        yield from walk_tests(child, trail + (suite.get("title", ""),))


def outcome(test: dict) -> str:
    status = test.get("status")  # expected | unexpected | flaky | skipped
    results = test.get("results", [])
    if status == "skipped" or all(r.get("status") == "skipped" for r in results):
        return "skipped"
    return {"expected": "pass", "unexpected": "fail", "flaky": "flake"}.get(status, status or "?")


def rel(p: Path) -> str:
    return p.relative_to(REPO).as_posix()


def main() -> int:
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("ticket")
    ap.add_argument("run_id")
    ap.add_argument("--env", required=True, help="the environment the run targeted, e.g. preprod1")
    ap.add_argument("--phase", choices=["pre-push", "post-push", "none"], required=True)
    ap.add_argument("--base-url", default="", help="as printed by cr-runner before the run")
    ap.add_argument("--build", default="", help="what is deployed, if known (e.g. 'before the push', a release tag)")
    a = ap.parse_args()

    tdir = REPO / "cr" / a.ticket
    run = tdir / "04-runs" / a.run_id
    results_file = run / "results.json"
    if not results_file.exists():
        sys.exit(f"No results at {rel(results_file)}. Was the run started with CR_TICKET={a.ticket} RUN_ID={a.run_id}?")
    results = json.loads(results_file.read_text(encoding="utf-8"))
    phase = None if a.phase == "none" else a.phase

    scenarios_file = tdir / "01-intake" / "scenarios.yaml"
    scenarios = {c["id"]: c for c in (load_yaml(scenarios_file).get("cases") or []) if "id" in c}
    # Keep the TS exactly as they were when this run was filed. cr-evidence diffs the
    # live TS against this copy: a TS that changed after it ran is RE-RUN, never PASS.
    at_run = run / "scenarios.at-run.yaml"
    if scenarios_file.exists() and not at_run.exists():
        shutil.copyfile(scenarios_file, at_run)
    # 02-plan/assertions.yaml is optional since 09.10.2026 (the approved TS set is the only gate).
    plan = {b.get("case"): b for b in (load_yaml(tdir / "02-plan" / "assertions.yaml").get("cases") or [])}
    phased_ticket = any((c.get("phase") == "pre-deploy") for c in scenarios.values())

    # ------------------------------------------------------------ what ran
    ran: dict[str, list[dict]] = {}
    annotations: set[str] = set()
    for title, file, t in (x for s in results.get("suites", []) for x in walk_tests(s)):
        cid = case_id(title)
        res = t.get("results", [])
        last = res[-1] if res else {}
        for ann in t.get("annotations", []):
            if ann.get("type") == "environment":
                annotations.add(ann.get("description", ""))
        ran.setdefault(cid, []).append({
            "title": title,
            "file": file,
            "outcome": outcome(t),
            "attempts": sum(1 for x in res if x.get("status") != "skipped"),
            "duration_s": round(sum(r.get("duration", 0) for r in res) / 1000),
            "error": ANSI.sub("", (last.get("error") or {}).get("message") or "").strip().splitlines()[:6],
            "artifacts": [att.get("path") for r in res for att in r.get("attachments", []) if att.get("path")],
        })

    # ------------------------------------------------------------ environment.txt
    stats = results.get("stats", {})
    env_lines = [
        f"ticket       {a.ticket}",
        f"run id       {a.run_id}",
        f"env          {a.env}",
        f"reported by  {', '.join(sorted(annotations)) or '-'}   (the suite's own environment annotation)",
        f"base url     {a.base_url or '-'}",
        f"phase        {a.phase}",
        f"build        {a.build or '-'}",
        f"branch       {git('rev-parse', '--abbrev-ref', 'HEAD')} @ {git('rev-parse', '--short', 'HEAD')}"
        + ("  (uncommitted changes present)" if git("status", "--porcelain") not in ("", "?") else ""),
        f"who          {git('config', 'user.name')} ({getpass.getuser()})",
        f"started      {stats.get('startTime', '-')}",
        f"duration     {round(stats.get('duration', 0) / 1000)} s",
        f"collected    {datetime.now().isoformat(timespec='seconds')}",
    ]
    (run / "environment.txt").write_text("\n".join(env_lines) + "\n", encoding="utf-8")

    # ------------------------------------------------------------ copy evidence
    ev_root = run / "evidence" / (phase or "")
    handover = tdir / "05-evidence" / (phase or "")
    previous = tdir / "05-evidence" / "_previous"
    index_file = tdir / "05-evidence" / "index.json"
    index = json.loads(index_file.read_text(encoding="utf-8")) if index_file.exists() else {"cases": {}}

    copied: dict[str, list[str]] = {}
    if ev_root.is_dir():
        for src in sorted(p for p in ev_root.iterdir() if p.is_dir() and p.name not in PHASES):
            dst = handover / src.name
            if dst.exists():
                old = index["cases"].get(f"{a.phase}:{src.name}", {}).get("run_id", "unknown-run")
                park = previous / old / (phase or "") / src.name
                park.parent.mkdir(parents=True, exist_ok=True)
                if park.exists():
                    park = park.with_name(f"{park.name}-{datetime.now():%H%M%S}")
                shutil.move(str(dst), str(park))
            shutil.copytree(src, dst)
            copied[src.name] = sorted(rel(f) for f in dst.rglob("*") if f.is_file())

    # ------------------------------------------------------------ seeds
    seeds_src = run / "evidence" / "pre-push" / "seeds.json"
    if phase == "pre-push" and seeds_src.exists():
        dst = tdir / "05-evidence" / "pre-push" / "seeds.json"
        dst.parent.mkdir(parents=True, exist_ok=True)
        new = json.loads(seeds_src.read_text(encoding="utf-8"))
        rerun = {s["case"] for s in new}
        kept = [s for s in (json.loads(dst.read_text(encoding="utf-8")) if dst.exists() else []) if s.get("case") not in rerun]
        seeds = kept + new
        dst.write_text(json.dumps(seeds, indent=2) + "\n", encoding="utf-8")
        md = [f"# {a.ticket}: pre-push seeds ({a.env})", "",
              "Prepared BEFORE the deploy. The post-push run reads `seeds.json`; this table is for people.", "",
              "| Case | What | Vehicle | Transaction | State now | After the deploy, expect | Run |",
              "|---|---|---|---|---|---|---|"]
        for s in sorted(seeds, key=lambda s: s.get("case", "")):
            md.append(f"| {s.get('case','')} | {s.get('what','')} | {s.get('vehicle','')} | **{s.get('transactionNo','')}** | "
                      f"{s.get('stateNow','')} | {s.get('expectAfter','')} | {s.get('runId','')} |")
        (dst.parent / "SEEDS.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    # ------------------------------------------------------------ index + summary
    all_ids = sorted(set(scenarios) | set(ran), key=lambda s: (s not in scenarios, s))
    rows = []
    for cid in all_ids:
        sc, block = scenarios.get(cid, {}), plan.get(cid, {})
        deprio = sc.get("deprioritised")
        tests = ran.get(cid, [])
        outcomes = sorted({t["outcome"] for t in tests})
        if deprio:
            status = "deprioritised"
        elif not tests:
            status = "not run" if (cid in scenarios or block.get("approved")) else "?"
        elif "fail" in outcomes:
            status = "fail"
        elif "flake" in outcomes:
            status = "flake"
        elif outcomes == ["skipped"]:
            status = "skipped"
        else:
            status = "pass"
        files = copied.get(cid)
        key = f"{a.phase}:{cid}"
        # A case skipped in this half (e.g. a post-push-only case during pre-push) leaves no row.
        if files is not None or (tests and status != "skipped"):
            index["cases"][key] = {
                "case": cid,
                "phase": a.phase,
                "run_id": a.run_id,
                "env": a.env,
                "status": status,
                "expected": (sc.get("expected") or "").strip(),
                "files": files or [],
                "failure_artifacts": [x for t in tests for x in t["artifacts"] if t["outcome"] in ("fail", "flake")],
                "review": "pending",
            }
        rows.append((cid, sc, block, tests, status, files, deprio))

    index["updated"] = datetime.now().isoformat(timespec="seconds")
    index_file.parent.mkdir(parents=True, exist_ok=True)
    index_file.write_text(json.dumps(index, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    idx = [f"# {a.ticket}: evidence index", "",
           "One row per case and phase. `review` stays `pending` until cr-evidence has opened every file.", "",
           "| Case | Phase | Status | Files | Run | Review |", "|---|---|---|---|---|---|"]
    for k, v in sorted(index["cases"].items(), key=lambda kv: (kv[1]["case"], kv[1]["phase"])):
        folder = f"{'' if v['phase'] == 'none' else v['phase'] + '/'}{v['case']}/"
        idx.append(f"| {v['case']} | {v['phase']} | {v['status']} | {len(v['files'])} in `{folder}` | {v['run_id']} | {v['review']} |")
    deps = [(cid, d) for cid, _, _, _, _, _, d in rows if d]
    if deps:
        idx += ["", "## Deprioritised (whole row grey in the workbook)", "", "| Case | By | Reason |", "|---|---|---|"]
        idx += [f"| {cid} | {d.get('by', '') if isinstance(d, dict) else ''} | {d.get('reason', '') if isinstance(d, dict) else d} |" for cid, d in deps]
    (tdir / "05-evidence" / "INDEX.md").write_text("\n".join(idx) + "\n", encoding="utf-8")

    summ = [f"# {a.ticket}: run {a.run_id}", "", "```", *env_lines, "```", "",
            "| Case | Result | Evidence files | Attempts | Note |", "|---|---|---|---|---|"]
    counts: dict[str, int] = {}
    for cid, sc, block, tests, status, files, deprio in rows:
        if phase == "pre-push" and not tests and sc.get("phase") != "pre-deploy" and not deprio:
            continue  # a pre-push run only covers the pre-deploy cases
        counts[status] = counts.get(status, 0) + 1
        note = ""
        if deprio:
            note = f"deprioritised: {deprio.get('reason', '') if isinstance(deprio, dict) else deprio}"
        elif status in ("pass", "fail", "flake") and not files:
            note = "**NO EVIDENCE FILES**, so this cannot be signed off"
        elif status == "fail":
            note = " ".join(tests[0]["error"])[:180].replace("|", "/")
        elif status == "not run":
            note = "signed, but no test ran"
        elif status == "no plan block":
            note = "no signed assertion block"
        summ.append(f"| {cid} | {status} | {len(files or [])} | {sum(t['attempts'] for t in tests) or '-'} | {note} |")
    summ += ["", "Totals: " + ", ".join(f"{k} {v}" for k, v in sorted(counts.items()))]
    if phased_ticket:
        summ += ["", f"Phased ticket. This was the **{a.phase}** half."
                 + (" The post-push half runs after Dev deploys." if phase == "pre-push" else "")]
    summ += ["", "Next: cr-evidence reviews every file in `05-evidence/`; cr-triage takes the failures."]
    (run / "summary.md").write_text("\n".join(summ) + "\n", encoding="utf-8")

    print(f"environment  {rel(run / 'environment.txt')}")
    print(f"summary      {rel(run / 'summary.md')}")
    print(f"evidence     {len(copied)} case folder(s) → {rel(handover) if handover != tdir / '05-evidence' else rel(handover) + '/'}")
    print(f"index        {rel(tdir / '05-evidence' / 'INDEX.md')}")
    print("totals       " + ", ".join(f"{k} {v}" for k, v in sorted(counts.items())))
    missing = [cid for cid, _, _, _, st, f, d in rows if st in ("pass", "fail", "flake") and not f and not d]
    if missing:
        print(f"NO EVIDENCE  {', '.join(missing)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
