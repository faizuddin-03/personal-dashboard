#!/usr/bin/env python3
"""
Seed a new CR's TS board (templates/ts-board/ts-board.html) from its approved draft.

    python automation/scripts/cr-board-seed.py EAINT-12345 --instance preprod1 --qa Azfar[,Colleague]
    options: --labels SIT,UAT   --hint "SIT=tested on the real third-party API"

Writes cr/<TICKET>/01-intake/board-seed-NN.json (at most 50 writes each). The session then:
  1. copies templates/ts-board/ts-board.html to cr/<TICKET>/01-intake/board/ts-board.html with its
     <title> set to "<TICKET> Test Scenarios", publishes it with capabilities {db:{}, user:{scopes:["profile"]}},
     and notes the URL in STATUS.md;
  2. sends each board-seed-NN.json as one ArtifactData `batch` (new documents: no pins needed).
From then on the BOARD is the source: the TS are edited there, results are written there
(scripts/cr-board-sync.py), Excel is a copy made from it (cr-build-workbook.py --from-board).
Miro is not used (Azfar, 16.10.2026).

What goes in (the 12022 console's own shape, so the page needs nothing new):
  settings/board  {ticket, title, instance, qa[], labels[], labelHints{}, build}
  sheets/<KEY>    {key, name, order, prefix, title, type, columns[{field,label,group,list,kind,width}]}
  cases/<TS>      {id, sheet, order, section, priority, situation, setup, steps, expected, points[],
                   qa, result:"", remarks:"", reviewed:false, source, labels[]}
  testdata/<TS>   the sheet's own fields (test data, field, value, portal …), kept out of `cases`
  questions/<OQ>  open questions {id, question, who, sources, decision}

COLUMNS PER SHEET follow what that sheet verifies (QA rule 01.10.2026): a sheet's own
`columns` in scenarios.yaml (meta.workbook.sheets[].columns, {header, field, width}) win;
otherwise the preset for the sheet's `type` below. A field that is not a case field
(situation, setup, steps, expected) is a test-data field and lives in testdata/<TS>.
"""
import importlib.util
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

import yaml

REPO = Path(__file__).resolve().parents[2]
C = lambda field, label, group="", list_=True, kind="long", width=30: {"field": field, "label": label, "group": group, "list": list_, "kind": kind, "width": width}
TAIL = [C("setup", "Set-up / pre-condition", list_=False, width=30), C("steps", "Test Steps", list_=False, width=44), C("expected", "Expected Result", list_=False, width=56)]
PRESETS = {
    # one screen, one rule; test data that differs per row shown in the list
    "functional": [C("situation", "Test Scenario", width=38), C("test_data", "Test Data", "Test Data", width=30), *TAIL],
    # a form or pop-up: which field, what was typed, what message shows
    "validation": [C("area", "Field", kind="short", width=16), C("situation", "Test Scenario", width=36),
                   C("steps", "Input / Action", list_=False, width=44), C("setup", "Other set-up", list_=False, width=26), C("expected", "Expected Result", list_=False, width=52)],
    # rows that differ by one axis (insurer, usage code, region): the value is the first column
    "matrix": [C("value", "Value tested", kind="short", width=22), C("situation", "Test Scenario", width=32), C("test_data", "Test Data", "Test Data", width=26), *TAIL],
    # a status chain: what triggers it, which statuses each screen must show
    "status-chain": [C("trigger", "Trigger", width=30), C("outcome", "Statuses expected", width=32), *TAIL],
    # listing / search & filter: which portal, which filter, what the list returns
    "search-filter": [C("portal", "Portal", kind="short", width=9), C("situation", "Test Scenario", width=38),
                      C("steps", "Test Steps / filter used", list_=False, width=40), C("expected", "Expected Result", list_=False, width=56)],
    # a journey across steps and portals: every checkpoint is an expected point
    "e2e": [C("situation", "Flow (A > B > C)", width=42), C("test_data", "Test Data", "Test Data", width=28),
            C("setup", "Other set-up", list_=False, width=26), C("steps", "Test Steps", list_=False, width=56), C("expected", "Expected Result (each checkpoint)", list_=False, width=58)],
    # what must not have changed: the page / module, before and after
    "regression": [C("area", "Module / page", kind="short", width=20), C("situation", "Test Scenario", width=36), *TAIL],
    # look against the mockup: colours, required *, alignment
    "ui": [C("area", "Page / element", kind="short", width=20), C("situation", "Test Scenario", width=34), C("mockup", "Mockup reference", width=24), *TAIL],
    # documents / downloads: which document, what must be on it
    "document": [C("doc", "Document", kind="short", width=22), C("situation", "Test Scenario", width=34), *TAIL],
}
CASE_FIELDS = {"situation", "setup", "steps", "expected"}
# The board shows these itself (TS No, QA, priority, result, remarks): never as a sheet column.
BOARD_OWN = {"id", "qa", "priority", "result", "remarks", "review"}


def text(v) -> str:
    if v is None:
        return ""
    if isinstance(v, list):
        return "\n".join(f"• {text(x)}" if not str(x).startswith(("•", "-")) else text(x) for x in v)
    if isinstance(v, dict):
        return "\n".join(f"{k}: {text(x)}" for k, x in v.items())
    return str(v).strip()


def opt(name, default=None):
    return sys.argv[sys.argv.index(f"--{name}") + 1] if f"--{name}" in sys.argv else default


def main() -> None:
    sys.stdout.reconfigure(encoding="utf-8")
    ticket = sys.argv[1] if len(sys.argv) > 1 and not sys.argv[1].startswith("--") else sys.exit(__doc__)
    tdir = REPO / "cr" / ticket
    sc = yaml.safe_load((tdir / "01-intake" / "scenarios.yaml").read_text(encoding="utf-8"))
    meta, cases = sc.get("meta", {}), sc.get("cases", [])
    if not (meta.get("approved_by") or "--draft" in sys.argv):
        sys.exit("scenarios.yaml has no meta.approved_by: seed the board only after gate 0 (or pass --draft to put the draft up for review).")
    wb = meta.get("workbook") or {}
    sheet_meta = {s["key"]: s for s in (wb.get("sheets") or []) if s.get("key")}

    # the same point splitting the runner uses (cr-ts-snapshot.py), so the board and the gate agree
    spec = importlib.util.spec_from_file_location("snap", Path(__file__).parent / "cr-ts-snapshot.py")
    snap = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(snap)

    now = datetime.now(timezone.utc).isoformat(timespec="seconds")
    writes = []
    labels = [x for x in (opt("labels", "") or "").split(",") if x]
    hints = dict(h.split("=", 1) for h in (opt("hint", "") or "").split(";") if "=" in h)
    writes.append({"op": "set", "collection": "settings", "doc_id": "board", "data": {
        "ticket": ticket, "title": meta.get("title", ""), "instance": opt("instance", ""),
        "qa": [x for x in (opt("qa", "") or "").split(",") if x], "labels": labels, "labelHints": hints, "build": "", "seededAt": now}})

    order = []
    for c in cases:
        if c.get("sheet") and c["sheet"] not in order:
            order.append(c["sheet"])
    for i, key in enumerate(order, 1):
        sm = sheet_meta.get(key, {})
        types = [c.get("type") for c in cases if c.get("sheet") == key and c.get("type")]
        stype = sm.get("type") or (max(set(types), key=types.count) if types else "functional")
        if sm.get("columns"):
            cols = [C(col["field"], col.get("header") or col.get("label") or col["field"], col.get("group", ""), col.get("list", True),
                      "short" if (col.get("width") or 30) <= 16 else "long", col.get("width") or 30) for col in sm["columns"]
                    if not str(col["field"]).startswith("_") and col["field"] not in BOARD_OWN]
            for need in ("setup", "steps", "expected"):
                if not any(c["field"] == need for c in cols):
                    cols.append(next(t for t in TAIL if t["field"] == need))
        else:
            cols = PRESETS.get(stype, PRESETS["functional"])
        writes.append({"op": "set", "collection": "sheets", "doc_id": key, "data": {
            "key": key, "name": sm.get("name") or f"{i} {key}", "order": i, "prefix": sm.get("prefix") or f"{key}_TS",
            "title": sm.get("title", ""), "type": stype, "columns": cols}})
        sheet_meta[key] = {**sm, "_cols": cols}

    for n, c in enumerate(cases, 1):
        cid = c.get("id")
        if not cid or not c.get("sheet"):
            continue
        deprio = c.get("deprioritised")
        doc = {"id": cid, "sheet": c["sheet"], "order": n, "section": text(c.get("section")), "priority": c.get("priority", "P2"),
               "situation": text(c.get("situation")), "setup": text(c.get("preconditions") or c.get("setup")),
               "steps": text(c.get("steps")), "expected": text(c.get("expected")), "points": snap.points_of(c),
               "qa": c.get("qa", ""), "result": "DEPRIORITIZED" if deprio else "", "remarks": "", "reviewed": False,
               "source": text(c.get("expected_source") or c.get("requirement") or c.get("source")), "labels": c.get("labels") or [],
               "updatedAt": now}
        if deprio:
            doc["deprio"] = text(deprio.get("reason") if isinstance(deprio, dict) else deprio)
        writes.append({"op": "set", "collection": "cases", "doc_id": cid, "data": doc})
        td = {}
        for col in sheet_meta[c["sheet"]]["_cols"]:
            f = col["field"]
            if f not in CASE_FIELDS and c.get(f) not in (None, "", []):
                td[f] = text(c[f])
        if c.get("test_data") and "test_data" not in td:
            td["test_data"] = text(c["test_data"])
        if td:
            writes.append({"op": "set", "collection": "testdata", "doc_id": cid, "data": {**td, "updatedAt": now}})

    for q in sc.get("open_questions") or meta.get("open_questions") or []:
        if q.get("id"):
            writes.append({"op": "set", "collection": "questions", "doc_id": q["id"], "data": {
                "id": q["id"], "question": text(q.get("question")), "who": text(q.get("who") or q.get("ask")),
                "sources": text(q.get("sources") or q.get("source")), "decision": text(q.get("decision") or q.get("answer"))}})

    out = tdir / "01-intake"
    for old in out.glob("board-seed-*.json"):
        old.unlink()
    for i in range(0, len(writes), 50):
        (out / f"board-seed-{i // 50 + 1:02d}.json").write_text(json.dumps(writes[i:i + 50], indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    n_cases = sum(1 for w in writes if w["collection"] == "cases")
    n_pts = sum(len(w["data"]["points"]) for w in writes if w["collection"] == "cases")
    print(f"{ticket}: {len(order)} sheets, {n_cases} TS ({n_pts} expected points), "
          f"{sum(1 for w in writes if w['collection'] == 'questions')} questions -> {(len(writes) + 49) // 50} batch file(s) in {out.relative_to(REPO)}")
    for key in order:
        print(f"  {key:8} {sheet_meta[key].get('name', ''):28} columns: {', '.join(c['label'] for c in sheet_meta[key]['_cols'] if c['list'])}")


if __name__ == "__main__":
    main()
