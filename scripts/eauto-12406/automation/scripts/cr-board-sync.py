#!/usr/bin/env python3
"""
Turn a run's per-TS gate results (and uploads) into writes for the TS board.

    python automation/scripts/cr-board-sync.py EAINT-12345 --run <RUN_ID> --versions <dir>            # gate only
    python automation/scripts/cr-board-sync.py EAINT-12345 --run <RUN_ID> --versions <dir> --results  # + result + history
    python automation/scripts/cr-board-sync.py EAINT-12345 --uploads --versions <dir>                 # "On SharePoint"

The board (templates/ts-board/ts-board.html, one live artifact per CR) is written
only through ArtifactData, by the session. This script prepares those writes so
nothing is retyped by hand:
  1. the session reads the board's cases: ArtifactData list `cases` with out_dir=<dir>
     (each case lands in <dir>/cases/<TS>.json; the file holds the document only), and
     saves the versions that listing printed as <dir>/versions.json ({"<TS>": <version>});
  2. this script writes 04-runs/<RUN_ID>/board-writes-NN.json (at most 50 entries each,
     every update pinned to the version read, so a QA's edit since is never overwritten);
  3. the session sends each file's entries as one ArtifactData batch.

What it writes per TS:
  - cases/<TS>.gate     {verdict, reasons, warnings, folder, run, at, proved[], mismatch[]}
  - cases/<TS>.points   the expected points the run proved against (from 01-intake/ts.json)
  - with --results (ONLY after cr-evidence has looked at the screenshots and agrees):
      cases/<TS>.result  VALID -> PASS, DEFECT -> FAIL, EVIDENCE/SCRIPT/ENV/CHANGED -> RE-RUN
      cases/<TS>/runs/<id>  the history entry the page shows, with the reason and evidence folder
  - with --uploads: cases/<TS>.uploaded {dest, at} from 05-evidence/UPLOADED.jsonl
Never `reviewed`: that tickbox is Azfar's own.

With --results it also writes 04-runs/<RUN_ID>/hub-write.json for the TS Hub
(cr-hub-refresh.py: the ticket's counts + per-sheet breakdown with these results applied;
--hub-version N pins it). Send it to https://claude.ai/artifact/AthB2fsq3WtLVHvncuhWAj
right after the board batches, so the hub card never lags the board.
"""
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
RESULT = {"VALID": "PASS", "DEFECT": "FAIL", "EVIDENCE": "RE-RUN", "SCRIPT": "RE-RUN", "ENV": "RE-RUN", "CHANGED": "RE-RUN"}


def opt(name, default=None):
    return sys.argv[sys.argv.index(f"--{name}") + 1] if f"--{name}" in sys.argv else default


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ticket = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else sys.exit(__doc__)
    cr = REPO / "cr" / ticket
    vdir = Path(opt("versions", "")) if opt("versions") else None
    if not vdir or not (vdir / "versions.json").exists():
        sys.exit("--versions <dir>: the out_dir of an ArtifactData list of `cases`, with versions.json beside it (needed to pin every write).")
    pins = json.loads((vdir / "versions.json").read_text(encoding="utf-8"))
    docs = {f.stem: json.loads(f.read_text(encoding="utf-8")) for f in (vdir / "cases").glob("*.json")} if (vdir / "cases").exists() else {}
    ver = lambda ts: pins.get(ts)
    tsdefs = {}
    tsj = cr / "01-intake" / "ts.json"
    if tsj.exists():
        tsdefs = json.loads(tsj.read_text(encoding="utf-8")).get("cases", {})

    updates: dict[str, dict] = {}
    creates: list[dict] = []
    out_dir = cr / "04-runs" / (opt("run") or "_board")
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")

    if opt("run"):
        gl = cr / "04-runs" / opt("run") / "gate.jsonl"
        if not gl.exists():
            sys.exit(f"{gl} not found")
        latest = {}
        for line in gl.read_text(encoding="utf-8").splitlines():
            if line.strip():
                g = json.loads(line)
                latest[g["ts"]] = g
        for ts, g in latest.items():
            folder = REPO / g["folder"]
            proofs = json.loads((folder / "proofs.json").read_text(encoding="utf-8")).get("proofs", []) if (folder / "proofs.json").exists() else []
            gate = {k: g.get(k) for k in ("verdict", "reasons", "warnings", "folder", "run", "at")}
            gate["proved"] = sorted({p["point"] for p in proofs if p.get("match") and p.get("shot")})
            gate["mismatch"] = sorted({p["point"] for p in proofs if not p.get("match")})
            u = updates.setdefault(ts, {})
            u["gate"] = gate
            if tsdefs.get(ts, {}).get("points"):
                u["points"] = tsdefs[ts]["points"]
            if "--results" in sys.argv and g["verdict"] in RESULT:
                result = RESULT[g["verdict"]]
                u["result"] = result
                # QA = the first name on every row (workbook rule): the case's own QA, else --qa.
                qa = (docs.get(ts) or {}).get("qa") or opt("qa", "")
                run = {"result": result, "qa": qa, "at": now, "prev": (docs.get(ts) or {}).get("result", ""),
                       "evidence": g["folder"], "note": f"run {g['run']} on /{g.get('instance','')}, checked by the runner at {g['at']}"}
                if result != "PASS":
                    run["reason"] = "; ".join(g.get("reasons") or [])[:900]
                rid = now.replace("-", "").replace(":", "").replace("+", "")[:15] + "-" + ts[-6:].lower()
                creates.append({"op": "set", "collection": f"cases/{ts}/runs", "doc_id": rid, "data": run})

    if "--uploads" in sys.argv:
        log = cr / "05-evidence" / "UPLOADED.jsonl"
        for line in (log.read_text(encoding="utf-8").splitlines() if log.exists() else []):
            if line.strip():
                r = json.loads(line)
                updates.setdefault(r["ts"], {})["uploaded"] = {"dest": r["dest"], "at": r["uploaded_on"]}

    writes, missing = [], []
    for ts, data in updates.items():
        v = ver(ts)
        if not v:
            missing.append(ts)
            continue
        writes.append({"op": "update", "collection": "cases", "doc_id": ts, "data": data, "if_version": v})
    writes += creates
    out_dir.mkdir(parents=True, exist_ok=True)
    files = []
    for i in range(0, len(writes), 50):
        f = out_dir / f"board-writes-{i // 50 + 1:02d}.json"
        f.write_text(json.dumps(writes[i:i + 50], indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
        files.append(f)
    print(f"{len(updates) - len(missing)} TS to update, {len(creates)} history entries, in {len(files)} batch file(s):")
    for f in files:
        print(f"  {f.relative_to(REPO)}")
    if missing:
        print(f"NOT on the board (no version read): {', '.join(missing)} — add them to the board first")

    # Results that reach the board must reach the TS Hub card in the same step (cr-hub-refresh.py).
    # The counts below are the board BEFORE these writes land: send the board batches first, then
    # the hub write, or re-list `cases` and re-run cr-hub-refresh.py for exact numbers.
    if "--results" in sys.argv:
        try:
            import importlib.util

            spec = importlib.util.spec_from_file_location("cr_hub_refresh", Path(__file__).with_name("cr-hub-refresh.py"))
            hub = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(hub)
            pending = {ts: data.get("result") for ts, data in updates.items() if "result" in data}
            write = hub.refresh(ticket, vdir, opt("hub-version"), overrides=pending)
            hub_out = out_dir / "hub-write.json"
            hub_out.write_text(json.dumps({"url": hub.HUB_URL, "writes": [write]}, indent=1, ensure_ascii=False), encoding="utf-8")
            hub.STAMP.parent.mkdir(parents=True, exist_ok=True)
            hub.STAMP.write_text(str(int(datetime.now().timestamp())), encoding="utf-8")
            c = write["data"]["counts"]
            print(f"TS Hub card (with these results applied): {c['total']} TS · {c['pass']} pass · {c['fail']} fail · {c['deprio']} deprio")
            print(f"  {hub_out.relative_to(REPO)}  -> send as ArtifactData update to the hub" + ("" if write.get("if_version") else " (pass --hub-version N to pin it)"))
        except Exception as e:  # the board writes are the priority; a hub miss is reported, never fatal
            print(f"TS Hub refresh skipped: {e}")


if __name__ == "__main__":
    main()
