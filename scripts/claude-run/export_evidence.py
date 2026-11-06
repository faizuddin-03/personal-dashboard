# Packs Claude-run evidence into Faizuddin's evidence folder format (2026-11-05):
#   <dest>\<KEYNUM>_TSnn.zip  holding  <KEYNUM>_TSnn.webm  and  <KEYNUM>_TSnn-<step>.png / .pdf
# Example dest: C:\Users\Faizuddin\Documents\eAuto Test Evidences\12028  (existing 12028_TS01.zip etc.)
# Source: a run folder with one sub-folder per TS, as written by scripts/claude-run/recorder.js
#   (<TS>/<TS>.webm, <TS>/NN-<step>.png). The "NN-" number prefix is dropped; extra videos keep
#   their suffix (<TS>-pdf-view.webm). Sub-folders named "<TS>-<variant>" go into the same zip,
#   with the variant in each file name (e.g. 12028_TS06-fresh-browser.webm).
# Never overwrites: an existing zip is skipped and reported unless --suffix is given
# (e.g. --suffix rerun-2026-11-05 -> 12028_TS06_rerun-2026-11-05.zip).
# --prefix P puts P in front of the zip name. Failed TS use --prefix "[FAILED] - "
#   (Faizuddin, 2026-11-05: "for failed scenarios, i want you to put in the front of the naming, this: "[FAILED] - ....").
# Usage: python -I scripts/claude-run/export_evidence.py <run_dir> <dest_dir> <TS> [<TS> ...] [--suffix S] [--prefix P] [--dry]
import os, re, sys, zipfile

args = sys.argv[1:]
dry = "--dry" in args
suffix = None
if "--suffix" in args:
    i = args.index("--suffix"); suffix = args[i + 1]; del args[i:i + 2]
prefix = ""
if "--prefix" in args:
    i = args.index("--prefix"); prefix = args[i + 1]; del args[i:i + 2]
args = [a for a in args if a != "--dry"]
run_dir, dest, tss = args[0], args[1], args[2:]

for ts in tss:
    folders = sorted(d for d in os.listdir(run_dir) if d == ts or d.startswith(ts + "-"))
    if not folders:
        print(f"{ts}: no folder in {run_dir}"); continue
    zname = f"{prefix}{ts}{'_' + suffix if suffix else ''}.zip"
    zpath = os.path.join(dest, zname)
    if os.path.exists(zpath):
        print(f"{ts}: SKIPPED, {zname} already exists (use --suffix)"); continue
    entries = []
    for d in folders:
        variant = d[len(ts):]  # "" or "-fresh-browser"
        for f in sorted(os.listdir(os.path.join(run_dir, d))):
            src = os.path.join(run_dir, d, f)
            if not os.path.isfile(src): continue
            base, ext = os.path.splitext(f)
            if ext.lower() not in (".png", ".webm", ".pdf", ".mp4"): continue
            if base.startswith(ts):  # video: <TS>.webm or <TS>-pdf-view.webm
                rest = base[len(ts):]
                name = (base if rest.startswith(variant) else ts + variant + rest) + ext
            else:  # NN-step.png -> <TS><variant>-step.png
                name = f"{ts}{variant}-{re.sub(r'^\d+-', '', base)}{ext}"
            entries.append((src, name))
    names = [n for _, n in entries]
    dupes = {n for n in names if names.count(n) > 1}
    if dupes:
        print(f"{ts}: STOPPED, duplicate names {sorted(dupes)}"); continue
    print(f"{ts} -> {zname}: " + ", ".join(names))
    if dry: continue
    with zipfile.ZipFile(zpath, "w", zipfile.ZIP_DEFLATED) as z:
        for src, name in entries:
            z.write(src, name)
