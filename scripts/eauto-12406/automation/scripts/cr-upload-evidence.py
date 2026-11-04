#!/usr/bin/env python3
"""
Upload a CR's reviewed, valid evidence to the team SharePoint (eAuto - Test Evidence / 1. Enhancement CR).

    python automation/scripts/cr-upload-evidence.py EAINT-12345                 # dry run: what would go where
    python automation/scripts/cr-upload-evidence.py EAINT-12345 --go            # copy
    python automation/scripts/cr-upload-evidence.py EAINT-12345 --ts IC_LST_TS2,IC_LST_TS3 --go
    options: --title "STMS - Insurance Cancellation"   name for a NEW ticket folder (else from 00-input/ticket*.md)
             --legacy "cr/EAINT-12022/05-evidence/FINAL Evidence"   a ticket tested BEFORE the gate existed:
                 its hand-built <sheet>/<TS>/ folders count as the valid ones (only with --ts, the TS the QA reviewed)
             --into "PASS evidence by TS"               sub-folder for a new layout (default: none)

The library is synced by OneDrive (Azfar added the shortcut 16.10.2026), so copying into
the local folder IS the upload. WHAT GOES UP (Azfar, 16.10.2026): only TS that are
  1. VALID — the folder cr/<TICKET>/05-evidence/[phase/]<TS>/ exists (the per-TS gate put it
     there; FAILED/ never goes up), and
  2. REVIEWED by Azfar — `reviewed: true` on the board (cr/<TICKET>/01-intake/board-cases.json,
     exported by the session before uploading). --ts names TS explicitly instead; only use it
     when Azfar has said those TS are reviewed.
Already-uploaded TS (05-evidence/UPLOADED.jsonl) are skipped unless their evidence changed.

WHERE. The ticket's folder is found by its EAINT number; a new one is created as
`EAINT-NNNNN - <title>` like the others. Inside, the layout is FLEXIBLE (Azfar: "depends
on how and what you test"): if a folder named <TS> already exists anywhere in the
ticket folder (e.g. 12022's `PASS evidence by TS/<NN sheet>/<TS>/`, built from a
colleague's PC), it is filled in place; otherwise the TS goes to
`[<into>/][<phase>/]<sheet folder>/<TS>/`, the sheet folder taken from the board
(`sheet_folder`, else `sheet`).

NAMES. Files are renamed for a tester who never saw this repo: `<TS> - 01 total.png`,
`<TS> - video.webm`, `<TS> - checks.txt`, downloads under `<TS> - downloadable/`. The
machine files (gate.json, proofs.json) stay local. A placeholder `_to-upload.txt` in the
target folder is removed once real files are in. An existing file of the same name is
NEVER overwritten (someone else's work): it is reported and skipped. Windows paths over
250 characters are refused with the file named, rather than silently failing in OneDrive.
"""
import json
import os
import re
import shutil
import sys
from datetime import datetime
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
# QA_EVIDENCE_LIBRARY overrides the library (a test copies into a scratch folder, never into SharePoint).
LIBRARY = Path(os.environ.get("QA_EVIDENCE_LIBRARY") or Path.home() / "OneDrive - MODE FAIR SDN BHD" / "Shortcuts" / "QA Team - 1. Enhancement CR")
MACHINE_FILES = {"gate.json", "proofs.json", "reason.txt"}
MAX_PATH = 250


def opt(name: str, default=None):
    if f"--{name}" in sys.argv:
        return sys.argv[sys.argv.index(f"--{name}") + 1]
    return default


def board_cases(cr: Path) -> dict:
    f = cr / "01-intake" / "board-cases.json"
    if not f.exists():
        return {}
    data = json.loads(f.read_text(encoding="utf-8"))
    rows = data if isinstance(data, list) else data.get("cases", [])
    return {r.get("id"): r for r in rows if r.get("id")}


def valid_folders(cr: Path) -> dict[str, Path]:
    """TS id -> its valid evidence folder (05-evidence/<TS>/ or 05-evidence/<phase>/<TS>/)."""
    ev = cr / "05-evidence"
    out = {}
    for gate in ev.rglob("gate.json"):
        rel = gate.parent.relative_to(ev).parts
        if rel and rel[0] == "FAILED":
            continue
        g = json.loads(gate.read_text(encoding="utf-8"))
        if g.get("verdict") == "VALID":
            out[g["ts"]] = gate.parent
    return out


def ticket_folder(ticket: str, title: str | None, go: bool) -> Path:
    num = ticket.split("-")[-1]
    hits = [d for d in LIBRARY.iterdir() if d.is_dir() and re.search(rf"(?<!\d){num}(?!\d)", d.name)]
    exact = [d for d in hits if d.name.startswith(f"{ticket} ")]
    if exact or hits:
        best = max(exact or hits, key=lambda d: sum(1 for _ in d.rglob("*")))  # the one actually in use
        return best
    if not title:
        t = next((cr_ticket_title(ticket)), None)
        title = t
    if not title:
        sys.exit(f"No SharePoint folder for {ticket} and no title to create one: pass --title \"[UCD] Module - Short title\".")
    name = f"{ticket} - {title}"[:80].rstrip(" -")
    d = LIBRARY / re.sub(r'[\\/:*?"<>|]+', "-", name)
    print(f"{'creating' if go else 'would create'} ticket folder: {d.name}")
    if go:
        d.mkdir()
    return d


def cr_ticket_title(ticket: str):
    for f in sorted((REPO / "cr" / ticket / "00-input").glob("ticket*.md")):
        m = re.search(r"^\|\s*Title\s*\|\s*(.+?)\s*\|", f.read_text(encoding="utf-8"), re.MULTILINE) or re.search(r"^#\s+.*?[—-]\s*(.+)$", f.read_text(encoding="utf-8"), re.MULTILINE)
        if m:
            yield re.sub(r"[🔴⚪🟢🟡]", "", m.group(1)).strip()


def pretty(ts: str, rel: Path) -> Path:
    """01-total.png -> '<TS> - 01 total.png'; video_<TS>.webm -> '<TS> - video.webm'."""
    if rel.parts[0].startswith("downloadable"):
        return Path(f"{ts} - {rel.parts[0]}", *rel.parts[1:])
    name = rel.name
    if re.match(rf"video_{re.escape(ts)}(_\d+)?\.webm$", name):
        return Path(f"{ts} - {name.replace(f'video_{ts}', 'video').replace('_', ' ')}")
    m = re.match(r"(\d{2})[- ](.+)$", name)
    if m:
        stem, ext = Path(m.group(2)).stem, Path(m.group(2)).suffix
        return Path(f"{ts} - {m.group(1)} {stem.replace('-', ' ') if '-' in m.group(0)[2:3] else stem}{ext}")
    return Path(f"{ts} - {name}")


def fit(target: Path) -> Path:
    """Shorten the label part of the file name so the whole path stays under MAX_PATH (the synced
    library path alone is ~190 characters); keeps '<TS> - NN', the extension and a numbered suffix."""
    over = len(str(target)) - MAX_PATH
    if over <= 0:
        return target
    stem, ext = target.stem, target.suffix
    keep = max(len(stem) - over - 1, min(len(stem), 24))
    return target.with_name(stem[:keep].rstrip(" -,.") + "…" + ext if keep < len(stem) else stem + ext)


def main() -> None:
    args = [a for a in sys.argv[1:] if not a.startswith("--") and sys.argv[sys.argv.index(a) - 1] not in ("--ts", "--title", "--into")]
    if not args:
        sys.exit(__doc__)
    ticket, go = args[0], "--go" in sys.argv
    sys.stdout.reconfigure(encoding="utf-8")
    cr = REPO / "cr" / ticket
    if not LIBRARY.exists():
        sys.exit(f"SharePoint library not synced: {LIBRARY} (OneDrive > Add shortcut to My files on '1. Enhancement CR').")
    board = board_cases(cr)
    valid = valid_folders(cr)
    legacy = opt("legacy")
    if legacy:
        if not (opt("ts")):
            sys.exit("--legacy needs --ts: name the TS Azfar reviewed; a hand-built folder has no gate to say it is valid.")
        lroot = (REPO / legacy) if not Path(legacy).is_absolute() else Path(legacy)
        for d in lroot.rglob("*"):
            if d.is_dir() and re.fullmatch(r"[A-Z0-9]+(?:_[A-Z0-9]+)*_TS\d+[A-Z]?", d.name) and not any(
                    p.lower().startswith(("not valid", "re-check", "differs")) for p in d.relative_to(lroot).parts):
                valid[d.name] = d
    named = [t for t in (opt("ts", "") or "").split(",") if t]
    if named:
        want = named
    else:
        if not board:
            sys.exit("No board export (01-intake/board-cases.json) to read `reviewed` from, and no --ts given. Nothing is uploaded without Azfar's review.")
        want = [t for t, c in board.items() if c.get("reviewed") is True]
    log = cr / "05-evidence" / "UPLOADED.jsonl"
    done = {}
    if log.exists():
        for line in log.read_text(encoding="utf-8").splitlines():
            if line.strip():
                r = json.loads(line)
                done[r["ts"]] = r
    root = ticket_folder(ticket, opt("title"), go)
    existing = {d.name: d for d in root.rglob("*") if d.is_dir()} if root.exists() else {}
    into = opt("into")
    plan, skipped = [], []
    for ts in want:
        src = valid.get(ts)
        if not src:
            skipped.append(f"{ts}: no VALID evidence folder (not run, or only in FAILED/) — not uploaded")
            continue
        gj = src / "gate.json"
        stamp = json.loads(gj.read_text(encoding="utf-8")) if gj.exists() else {"run": "legacy:" + src.parent.name, "at": datetime.fromtimestamp(src.stat().st_mtime).isoformat(timespec="seconds")}
        if ts in done and done[ts].get("run") == stamp.get("run") and done[ts].get("at") == stamp.get("at"):
            skipped.append(f"{ts}: already uploaded ({done[ts]['dest']})")
            continue
        if ts in existing:
            dest = existing[ts]
        else:
            c = board.get(ts, {})
            sheet = c.get("sheet_folder") or c.get("sheet") or "TS"
            phase = src.parent.name if src.parent.name in ("pre-push", "post-push") else None
            dest = root.joinpath(*[p for p in (into, phase, sheet, ts) if p])
        plan.append((ts, src, dest, stamp))

    uploaded = 0
    for ts, src, dest, stamp in plan:
        files = [f for f in src.rglob("*") if f.is_file() and f.name not in MACHINE_FILES]
        copied, clash = [], []
        for f in files:
            target = fit(dest / pretty(ts, f.relative_to(src)))
            if len(str(target)) > MAX_PATH:
                clash.append(f"path too long even shortened ({len(str(target))}): {target.name}")
                continue
            if target.exists():
                clash.append(f"exists, left as it is: {target.name}")
                continue
            if go:
                target.parent.mkdir(parents=True, exist_ok=True)
                shutil.copy2(f, target)
            copied.append(target.name)
        placeholder = dest / "_to-upload.txt"
        if go and copied and placeholder.exists():
            placeholder.unlink()
        rel = dest.relative_to(LIBRARY)
        print(f"{'UPLOADED' if go else 'would upload'} {ts}: {len(copied)} files -> {rel}" + (f"  ({len(clash)} skipped)" if clash else ""))
        for c in clash:
            print(f"    skipped: {c}")
        if go and copied:
            uploaded += 1
            with log.open("a", encoding="utf-8") as fh:
                fh.write(json.dumps({"ts": ts, "dest": str(rel), "files": copied, "run": stamp.get("run"), "at": stamp.get("at"),
                                     "uploaded_on": datetime.now().isoformat(timespec="seconds")}, ensure_ascii=False) + "\n")
    for s in skipped:
        print(f"skip {s}")
    print(f"\n{ticket}: {len(plan)} TS {'uploaded' if go else 'to upload'}, {len(skipped)} skipped -> {root.name}" + ("" if go else "   (dry run: add --go)"))


if __name__ == "__main__":
    main()
