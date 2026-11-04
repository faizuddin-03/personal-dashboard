#!/usr/bin/env python3
"""
Put a ticket's evidence ON its TS board, so anyone who can open the board (the QA, a senior reviewer)
sees each TS's screenshots and videos right there instead of a repo path that opens a blank page.

    python -I automation/scripts/board-evidence-pack.py EAINT-12345 --versions <dir> --out <pack dir>
        [--width 1440] [--crf 30] [--jobs 4] [--only TS1,TS2]

<dir> is the out_dir of an ArtifactData list of the board's `cases`, with the versions that listing printed
saved as <dir>/versions.json ({"<TS>": <version>}, as for cr-board-sync.py): the case ids say which
05-evidence/<TS>/ folders count, and the versions pin the writes.

For every cr/<TICKET>/05-evidence/<TS>/ folder whose name is a case on the board:
  - screenshots (.png/.jpg) are copied to <pack>/ev/<TS>/ unchanged (reviewers zoom into the text);
  - videos (.mp4/.webm) are re-encoded to small H.264 mp4 in <pack>/ev/<TS>/ (no sound, <= --width wide,
    10 fps): a 25 MB recording comes out around 2 MB, so the whole set fits on the board;
  - each screenshot gets its caption from proofs.json (expected point E1 …, what the TS expects, what the
    page showed, match) or, without one, from an "E2" in its file name.

Writes into <pack>:
  publish-NN.json   the published paths for each Artifact publish (<= 250 files and <= 60 MB each; the
                    board allows 255 files / 64 MB per publish, 511 files / 256 MB per version):
                    publish with root=<pack> and files=<that list>, the board page as file_path
  cases-write.json  ONE ArtifactData batch: update cases/<TS> {evidenceSet: {folder, at, shots[], videos[]}}
                    pinned to the versions in <dir>; the page renders the gallery from evidenceSet

FAILED/ folders, investigations and dry runs are not packed: only the folder that verifies the row.
The page reads shot/video `src` as a path next to the page, so the same field can later hold a full URL.
"""
import argparse
import json
import re
import shutil
import subprocess
import sys
from concurrent.futures import ThreadPoolExecutor
from datetime import datetime, timezone
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
IMG = {".png", ".jpg", ".jpeg"}
VID = {".mp4", ".webm"}
MAX_FILES, MAX_BYTES = 250, 60 * 1024 * 1024


def video_label(name):
    n = name.lower()
    part = re.search(r"ff36-(\d+)", n) or re.search(r"_p(\d+)\.", n)
    if "manual" in n:
        return "Manual recording" + (" (Firefox 36)" if "ff36" in n else "")
    if "ff36" in n or "window-recording" in n or re.search(r"_p\d+\.", n):
        return "Firefox 36 window" + (f", part {part.group(1)}" if part else "")
    if "chrome" in n or n.endswith(".webm"):
        return "Chrome (automation browser)"
    return "Video"


def encode(src, dst, width, crf):
    if dst.exists() and dst.stat().st_mtime >= src.stat().st_mtime:
        return dst
    tmp = dst.with_suffix(".part.mp4")
    cmd = ["ffmpeg", "-v", "error", "-y", "-i", str(src), "-an",
           "-vf", f"scale='min({width},iw)':-2,fps=10", "-c:v", "libx264", "-preset", "veryfast",
           "-crf", str(crf), "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(tmp)]
    subprocess.run(cmd, check=True)
    tmp.replace(dst)
    return dst


def captions(folder):
    """screenshot name -> [{point, expected, shows, match}] from proofs.json"""
    out = {}
    p = folder / "proofs.json"
    if p.exists():
        for pr in json.loads(p.read_text(encoding="utf-8")).get("proofs", []):
            if pr.get("shot"):
                out.setdefault(pr["shot"], []).append({k: pr.get(k) for k in ("point", "expected", "shows", "match") if pr.get(k) is not None})
    return out


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ticket")
    ap.add_argument("--versions", required=True)
    ap.add_argument("--out", required=True)
    ap.add_argument("--width", type=int, default=1440)
    ap.add_argument("--crf", type=int, default=30)
    ap.add_argument("--jobs", type=int, default=4)
    ap.add_argument("--only", default="")
    a = ap.parse_args()

    cr = next((d for d in (REPO / "cr").iterdir() if d.name.startswith(a.ticket)), None)
    if not cr:
        sys.exit(f"no cr/{a.ticket} folder")
    ev = cr / "05-evidence"
    vfile = Path(a.versions) / "versions.json"
    if not vfile.exists():
        sys.exit("--versions <dir>: the out_dir of an ArtifactData list of `cases`, with versions.json beside it (needed to pin every write).")
    versions = json.loads(vfile.read_text(encoding="utf-8"))
    only = {s.strip() for s in a.only.split(",") if s.strip()}
    pack = Path(a.out)
    now = datetime.now(timezone.utc).isoformat(timespec="seconds")

    jobs, cases = [], {}
    for folder in sorted(p for p in ev.iterdir() if p.is_dir() and p.name in versions):
        ts = folder.name
        if only and ts not in only:
            continue
        dst = pack / "ev" / ts
        dst.mkdir(parents=True, exist_ok=True)
        cap = captions(folder)
        shots, videos = [], []
        for f in sorted(folder.iterdir()):
            ext = f.suffix.lower()
            if ext in IMG:
                shutil.copy2(f, dst / f.name)
                s = {"src": f"ev/{ts}/{f.name}", "name": f.name}
                pr = cap.get(f.name) or []
                if pr:
                    s["proofs"] = pr
                else:
                    m = re.search(r"(?:^|[-_])(E\d+)(?=[-_.])", f.name)
                    if m:
                        s["proofs"] = [{"point": m.group(1)}]
                shots.append(s)
            elif ext in VID:
                out = dst / (f.stem + ".mp4")
                jobs.append((f, out))
                videos.append({"src": f"ev/{ts}/{out.name}", "name": f.name, "label": video_label(f.name)})
        if shots or videos:
            cases[ts] = {"folder": str(folder.relative_to(REPO)).replace("\\", "/"), "at": now, "shots": shots, "videos": videos}

    print(f"{len(cases)} TS folders, {sum(len(c['shots']) for c in cases.values())} screenshots, {len(jobs)} videos to encode")
    with ThreadPoolExecutor(max_workers=a.jobs) as pool:
        for i, d in enumerate(pool.map(lambda j: encode(j[0], j[1], a.width, a.crf), jobs), 1):
            print(f"  [{i}/{len(jobs)}] {d.relative_to(pack)}  {d.stat().st_size / 1048576:.1f} MB", flush=True)

    files = sorted(p for p in (pack / "ev").rglob("*") if p.is_file() and ".part." not in p.name)
    for old in pack.glob("publish-*.json"):
        old.unlink()
    chunks, cur, size = [], [], 0
    for p in files:
        b = p.stat().st_size
        if cur and (len(cur) >= MAX_FILES or size + b > MAX_BYTES):
            chunks.append(cur); cur, size = [], 0
        cur.append(p.relative_to(pack).as_posix()); size += b
    if cur:
        chunks.append(cur)
    for i, c in enumerate(chunks, 1):
        (pack / f"publish-{i:02d}.json").write_text(json.dumps(c, indent=0), encoding="utf-8")

    writes = [{"op": "update", "collection": "cases", "doc_id": ts, "data": {"evidenceSet": d}, "if_version": versions[ts]}
              for ts, d in cases.items()]
    (pack / "cases-write.json").write_text(json.dumps({"writes": writes}, ensure_ascii=False, indent=1), encoding="utf-8")
    total = sum(p.stat().st_size for p in files)
    print(f"{len(files)} files, {total / 1048576:.0f} MB, {len(chunks)} publishes; {len(writes)} case writes -> {pack}")


if __name__ == "__main__":
    main()
