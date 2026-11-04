"""Build board.json / board.md / INDEX.md / tNN_<id>.tsv for the Zurich (EAINT-8608) team board.

Input: the raw browser dumps _items.json, _tables.json, _mindmaps.md (each a JSON-encoded string),
made 28.10.2026 read-only in the Playwright browser with the Miro Web SDK (tables via Ctrl+C text/html).
Masks IC-shaped numbers (none found 28.10; see README "Masking"). Re-runnable.
"""
import json, re, html
from pathlib import Path

D = Path(__file__).parent

def load(name):
    p = D / name
    if not p.exists():
        return None
    v = json.loads(p.read_text(encoding="utf-8"))
    return json.loads(v) if isinstance(v, str) and v[:1] in "[{" else v

# Not after "+": that is a phone number (e.g. the PIAM "Get in touch" line in t19), not an IC.
IC_RE = re.compile(r"(?<![+\d])(\d{6})-?(\d{2})-?(\d{4})(?!\d)")

def mask(s):
    if not s:
        return s
    s = IC_RE.sub(lambda m: m.group(1)[:2] + "XXXX-XX-" + m.group(3)[-2:].rjust(4, "X") if "-" in m.group(0) else m.group(1)[:2] + "XXXXXXXX" + m.group(3)[-2:], s)
    # e-mail addresses: keep only the domain (the board holds one bank UAT login mailbox)
    s = re.sub(r"\b[\w.+-]+@([\w-]+(?:\.[\w-]+)+)", r"xxxx@\1", s)
    # Phones are NOT masked: the only two on the board (28.10) are company support lines quoted in
    # expected texts (insurer "Get in touch" number, X Star Technology helpline), not personal numbers.
    return s

raw_items = load("_items.json")
raw_tables = load("_tables.json")
mind = load("_mindmaps.md") or ""
mind = mask(html.unescape(mind))

if raw_items is not None:
    b = raw_items
    for i in b["items"]:
        i["title"] = mask(html.unescape(i.get("title") or ""))
        i["content"] = mask(html.unescape(i.get("content") or ""))
    b["tables"] = [dict(t, tsv=mask(html.unescape(t["tsv"]))) for t in raw_tables]
    b["mindmaps"] = mind
    (D / "board.json").write_text(json.dumps(b, ensure_ascii=False, indent=1), encoding="utf-8")
else:
    b = json.loads((D / "board.json").read_text(encoding="utf-8"))
    for i in b["items"]:
        i["title"], i["content"] = mask(i.get("title") or ""), mask(i.get("content") or "")
    for t in b["tables"]:
        t["tsv"] = mask(t["tsv"])
    b["mindmaps"] = mask(b.get("mindmaps") or "")
    (D / "board.json").write_text(json.dumps(b, ensure_ascii=False, indent=1), encoding="utf-8")

items = {i["id"]: i for i in b["items"]}
tabmeta = {t["id"]: t for t in b["tables"]}

def absxy(i):
    """Absolute centre. Child x/y are relative to the parent frame's top-left."""
    x, y, p = i.get("x") or 0, i.get("y") or 0, i.get("parentId")
    while p and p in items:
        f = items[p]
        x += (f.get("x") or 0) - (f.get("w") or 0) / 2
        y += (f.get("y") or 0) - (f.get("h") or 0) / 2
        p = f.get("parentId")
    return x, y

frames = [i for i in b["items"] if i["type"] == "frame"]
def ftext(f):
    kids = [i for i in b["items"] if i.get("parentId") == f["id"] and i["type"] in ("text", "shape", "sticky_note")]
    return " / ".join(re.sub(r"\s+", " ", k.get("content") or "").strip() for k in kids if (k.get("content") or "").strip())

# header strip: a thin frame (h < 1500) directly above a body frame, sharing its left edge
def label(f):
    if f.get("title"):
        return f["title"]
    fl, ft = f["x"] - f["w"] / 2, f["y"] - f["h"] / 2
    best = None
    for s in frames:
        if s is f or s["h"] >= 1500:
            continue
        sl, sb = s["x"] - s["w"] / 2, s["y"] + s["h"] / 2
        if abs(sl - fl) < 3000 and 0 <= ft - sb < 6000:
            if best is None or (ft - sb) < best[0]:
                best = (ft - sb, s)
    return ("[" + ftext(best[1])[:140] + "]") if best else "(untitled)"

tabs = sorted(b["tables"], key=lambda t: (round(absxy(items[t["id"]])[1] / 3000) if t["id"] in items else 0, absxy(items[t["id"]])[0] if t["id"] in items else 0))
names = {}
idx = ["# Table index", "", "Tables in board order (top-to-bottom, then left-to-right). Frame = the header strip above the table's frame.", "",
       "| File | Frame | Abs pos (x,y) | Rows x cols | Chars | First line |", "|---|---|---|---|---|---|"]
for n, t in enumerate(tabs, 1):
    fn = f"t{n:02d}_{t['id']}.tsv"
    names[t["id"]] = fn
    (D / fn).write_text(t["tsv"], encoding="utf-8")
    it = items.get(t["id"], {})
    fr = items.get(it.get("parentId") or "")
    frl = label(fr) if fr else "(no frame)"
    ax, ay = absxy(it) if it else (0, 0)
    first = re.sub(r"\s+", " ", t["tsv"][:140]).replace("|", "/")
    idx.append(f"| {fn} | {frl[:80].replace('|','/')} | ({round(ax)},{round(ay)}) | {t['rows']}x{t['cols']} | {len(t['tsv'])} | {first} |")
(D / "INDEX.md").write_text("\n".join(idx) + "\n", encoding="utf-8")

bd = b["board"]
md = [f"# {bd['title']}", "",
      f"Source: {bd['url']} · board created {bd['createdAt'][:10]}, last edited {bd['updatedAt'][:10]} · copied {bd['copiedAt']} (read-only, Playwright + Miro Web SDK; tables via Ctrl+C text/html; IC and phone numbers masked)", ""]
seen = set()
def emit(i, ind=""):
    t = i["type"]
    if t == "table":
        md.append(f"{ind}[table {i['id']} -> {names.get(i['id'])}]")
        return
    if t == "mindmap":
        md.append(f"{ind}[mindmap {i['id']} -> see 'Mind maps' at the end]")
        return
    txt = (i.get("content") or i.get("title") or "").strip()
    if txt or t in ("image", "card", "connector"):
        extra = ""
        if t == "image":
            extra = f" [image {i['id']} {round(i.get('w') or 0)}x{round(i.get('h') or 0)}]"
        if t == "connector":
            extra = f" [{i.get('start')} -> {i.get('end')}]"
        md.append(f"{ind}- ({t}) " + txt.replace("\n", "\n" + ind + "    ") + extra)

order = sorted(frames, key=lambda f: (round((f["y"] - f["h"] / 2) / 3000), f["x"] - f["w"] / 2))
for f in order:
    ax, ay = absxy(f)
    kind = "strip" if f["h"] < 1500 else "body"
    md += ["", f"## FRAME ({kind}) {label(f) if kind == 'body' else ''}  id={f['id']} centre=({round(ax)},{round(ay)}) size={round(f['w'])}x{round(f['h'])}"]
    kids = sorted([i for i in b["items"] if i.get("parentId") == f["id"]], key=lambda i: (round((i.get("y") or 0) / 400), i.get("x") or 0))
    for k in kids:
        seen.add(k["id"])
        emit(k)
loose = sorted([i for i in b["items"] if i["type"] != "frame" and i["id"] not in seen], key=lambda i: (round(absxy(i)[1] / 3000), absxy(i)[0]))
md += ["", "## Not in a frame"]
for i in loose:
    emit(i)
md += ["", "## Mind maps (E2E flows; children ordered top-to-bottom)", "", b.get("mindmaps", "")]
(D / "board.md").write_text("\n".join(md) + "\n", encoding="utf-8")
c = {}
for i in b["items"]:
    c[i["type"]] = c.get(i["type"], 0) + 1
print(len(tabs), "tables;", len(b["items"]), "items;", c, sum(len(t["tsv"]) for t in tabs), "tsv chars")
