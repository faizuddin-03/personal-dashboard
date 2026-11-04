#!/usr/bin/env python3
"""
Attach files to a Jira issue's Attachments panel through the REST API.
    python automation/scripts/jira-attach.py EAINT-12647 "<file 1>" "<file 2>" ...
The twin of jira-attachments.py (download). Uses the QA's own token from automation/env/.jira.env-local
(JIRA_EMAIL + JIRA_API_TOKEN); never prints it. Added 26.10.2026 (EAINT-12647) as the fallback when the Chrome
extension is offline: the files land in the Attachments panel, not inline in a comment, so the comment names them.
Only attach evidence the QA has approved for the ticket.
"""
import sys, os, re, json, uuid, base64, urllib.request, mimetypes
REPO = r"C:\Users\Azfar\Documents\Github Pro\eauto-qa-azfar"
env = {}
for line in open(os.path.join(REPO, "automation", "env", ".jira.env-local"), encoding="utf-8"):
    m = re.match(r"^\s*([A-Z_]+)\s*=\s*(.*?)\s*$", line)
    if m: env[m.group(1)] = m.group(2)
email, token = env.get("JIRA_EMAIL"), env.get("JIRA_API_TOKEN")
if not email or not token: sys.exit("no JIRA_EMAIL / JIRA_API_TOKEN in .jira.env-local (exit 3)")
key = sys.argv[1]; files = sys.argv[2:]
auth = base64.b64encode(f"{email}:{token}".encode()).decode()
for f in files:
    b = f"----jira-{uuid.uuid4().hex}"
    name = os.path.basename(f); ctype = mimetypes.guess_type(f)[0] or "application/octet-stream"
    body = (f"--{b}\r\nContent-Disposition: form-data; name=\"file\"; filename=\"{name}\"\r\nContent-Type: {ctype}\r\n\r\n").encode() + open(f, "rb").read() + f"\r\n--{b}--\r\n".encode()
    req = urllib.request.Request(f"https://mfservices.atlassian.net/rest/api/3/issue/{key}/attachments", data=body, method="POST",
        headers={"Authorization": f"Basic {auth}", "X-Atlassian-Token": "no-check", "Content-Type": f"multipart/form-data; boundary={b}"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            j = json.loads(r.read().decode()); print("OK", r.status, name, "->", j[0]["id"], j[0]["size"], "bytes")
    except urllib.error.HTTPError as e:
        print("FAIL", e.code, name, e.read()[:200])
