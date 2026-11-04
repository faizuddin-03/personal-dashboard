#!/usr/bin/env python3
"""
Download a Jira ticket's attachments into a CR folder.

    python automation/scripts/jira-attachments.py EAINT-12403 --list
    python automation/scripts/jira-attachments.py EAINT-12403 --id 158133 --id 158134
    python automation/scripts/jira-attachments.py EAINT-12403 --id 158133 --into cr/EAINT-9204/00-input

WHY THIS EXISTS
---------------
The Atlassian connector the agents use can READ a ticket, including each
attachment's filename, date and id, but it cannot download the file. The
agent picks WHICH files it needs (the latest SRD, not all six revisions);
this script only fetches the ids it is given.

CREDENTIALS
-----------
Needs a Jira API token belonging to the person running it. Set up once, by
that person, never by an agent:

    automation/env/.jira.env-local        (gitignored, like the other env-local files)
        JIRA_EMAIL=you@modefair.com
        JIRA_API_TOKEN=<from id.atlassian.com/manage-profile/security/api-tokens>

or the same two names as environment variables. Without them the script exits
with code 3 and says so, and the agent falls back to asking for the file.

Never prints the token.
"""
import argparse
import base64
import json
import os
import sys
import urllib.request
from pathlib import Path

REPO = Path(__file__).resolve().parents[2]
SITE = "https://mfservices.atlassian.net"
ENV_FILE = REPO / "automation" / "env" / ".jira.env-local"
NO_CREDENTIALS = 3


def credentials() -> tuple[str, str] | None:
    email, token = os.environ.get("JIRA_EMAIL"), os.environ.get("JIRA_API_TOKEN")
    if (not email or not token) and ENV_FILE.exists():
        for line in ENV_FILE.read_text(encoding="utf-8").splitlines():
            key, _, value = line.partition("=")
            if key.strip() == "JIRA_EMAIL" and not email:
                email = value.strip()
            if key.strip() == "JIRA_API_TOKEN" and not token:
                token = value.strip()
    return (email, token) if email and token else None


def get(url: str, auth: tuple[str, str]) -> bytes:
    basic = base64.b64encode(f"{auth[0]}:{auth[1]}".encode()).decode()
    req = urllib.request.Request(url, headers={"Authorization": f"Basic {basic}", "Accept": "*/*"})
    with urllib.request.urlopen(req, timeout=60) as r:
        return r.read()


def attachments(ticket: str, auth: tuple[str, str]) -> list[dict]:
    data = json.loads(get(f"{SITE}/rest/api/3/issue/{ticket}?fields=attachment", auth))
    return data["fields"].get("attachment", [])


def main() -> int:
    p = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    p.add_argument("ticket")
    p.add_argument("--list", action="store_true", help="list attachments, download nothing")
    p.add_argument("--id", action="append", default=[], help="attachment id to download (repeatable)")
    p.add_argument("--into", help="target folder (default cr/<TICKET>/00-input)")
    a = p.parse_args()

    auth = credentials()
    if not auth:
        print(
            f"No Jira credentials. Set JIRA_EMAIL and JIRA_API_TOKEN in {ENV_FILE.relative_to(REPO)} "
            "or the environment. Nothing downloaded.",
            file=sys.stderr,
        )
        return NO_CREDENTIALS

    files = attachments(a.ticket, auth)
    if a.list or not a.id:
        for f in sorted(files, key=lambda f: f["created"]):
            print(f'{f["id"]}\t{f["created"][:16]}\t{f["size"]:>9}\t{f["filename"]}')
        return 0

    target = Path(a.into) if a.into else REPO / "cr" / a.ticket / "00-input"
    target.mkdir(parents=True, exist_ok=True)
    wanted = {f["id"]: f for f in files if f["id"] in a.id}
    missing = set(a.id) - set(wanted)
    if missing:
        print(f"Not attachments of {a.ticket}: {', '.join(sorted(missing))}", file=sys.stderr)
        return 2

    for f in wanted.values():
        out = target / f["filename"]
        if out.exists() and out.stat().st_size == f["size"]:
            print(f"kept    {out.relative_to(REPO)} (already there, same size)")
            continue
        out.write_bytes(get(f"{SITE}/rest/api/3/attachment/content/{f['id']}", auth))
        print(f"fetched {out.relative_to(REPO)} ({f['size']} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
