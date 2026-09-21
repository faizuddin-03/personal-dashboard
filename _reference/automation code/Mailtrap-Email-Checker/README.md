# eAuto Mailtrap Email Checker

A small, self-contained tool to verify the **eAuto Software Installation / Biometric
Device Purchase appointment emails** in the Mailtrap sandbox — the **Confirmation** and
**Reschedule** emails — against the team's baseline contracts, field by field.

It's the same check the QA automation runs, pulled out into a standalone CLI so you can
test **the email part on its own** (e.g. when a ticket changes the email copy/subject/body)
without needing the rest of the QA project.

---

## What it checks

Both SI and BDP send the **same** "Software Installation Appointment" emails, so the
contracts are module-agnostic. Two email types:

| Type | Subject (baseline) | When it fires |
|------|--------------------|---------------|
| **Confirmation** | `eAuto: Your Software Installation Appointment is Confirmed - [Company]` | when an appointment is confirmed (Confirm Appointment → Submitted) |
| **Reschedule** | `eAuto: Your Software Installation Appointment has been Rescheduled - [New Date] ([Day]), [Time]` | any reschedule (UCD self-service, CSE/BO reappoint, same-day) |

For each email it asserts: **sender** (`support@eauto.my`), **recipient**, **subject** (incl.
the known `?`/mojibake encoding defect), and the **body** (details table, Customer Service
line, reminders, auto-generated footer, and any booking values you pass in). It can also
assert the **negative** — that *no* email arrived (for failed/pending payment, validation
blocks, etc.).

The exact contracts live in **`lib/email-contracts.js`** — that file is the single source of
truth for "what the email should say". **When a ticket changes the email, update the contract
there and re-run.**

---

## Setup

Requires **Node.js 18+** (uses the built-in `fetch` — no `npm install` needed).

1. Get a **Mailtrap API token** (Mailtrap → Settings → API Tokens; it needs read access to
   the sandbox inbox).
2. Configure it one of two ways:

   **Option A — config file (recommended):**
   ```bash
   cp config.example.json config.json
   ```
   Then edit `config.json` and paste your token + inbox URL. `config.json` is git-ignored, so
   your token is never shared.

   **Option B — environment variables** (override the config file):
   ```bash
   export MAILTRAP_TOKEN="your-token"
   export MAILTRAP_URL="https://mailtrap.io/api/accounts/{accountId}/inboxes/2581833/messages"
   ```

The **inbox URL** is the Mailtrap *messages* API endpoint. For the modefair sandbox the inbox
id is `2581833`; put your account id in `{accountId}` (or use the `sandbox.api.mailtrap.io`
host — whichever your account exposes).

> **No token?** The tool still runs — in **manual mode** it prints the exact steps to check by
> hand in the sandbox web UI, and never reports a false "pass".

---

## Usage

```bash
# List recent messages in the sandbox (newest first)
node check-email.js list
node check-email.js list --to someone@company.com --n 10

# Verify a Confirmation email exists and every field matches the contract
node check-email.js confirmation --to someone@company.com --since 30m

# Verify a Reschedule email
node check-email.js reschedule --since 1h

# Assert NO eAuto appointment email arrived (negative / absence check)
node check-email.js none --to someone@company.com --reason "payment failed"

# Dump one message's subject + body (handy for eyeballing new copy)
node check-email.js show <messageId>
```

**Options**

| Flag | Meaning |
|------|---------|
| `--to` | filter/assert on recipient (substring, case-insensitive) |
| `--since` | only consider mail newer than this — `30m`, `2h`, `90s`, `1d` (default `1h`) |
| `--n` | `list`: how many to show (default 20) |
| `--reason` | `none`: note why no email is expected (printed in the result) |

**Exit code:** `0` if all assertions passed (or were manual/blocked), `1` if any assertion
**failed** — so you can gate a CI step on it.

Typical flow when testing an email change: trigger the email on staging → `node check-email.js list`
to find it → `node check-email.js confirmation --to <recipient> --since 15m` to validate every
field → if a field is wrong, that's your finding.

---

## Files

```
Mailtrap-Email-Checker/
├── check-email.js          ← the CLI you run
├── lib/
│   ├── mailtrap.js         ← reads the sandbox + runs the assertions
│   └── email-contracts.js  ← the baseline contracts (edit when the email changes)
├── config.example.json     ← copy to config.json, paste your token
├── package.json
└── README.md
```

---

## Notes

- **Sandbox:** modefair inbox `2581833` — https://mailtrap.io/sandboxes/2581833/messages
- **Sender** is always `support@eauto.my`.
- The **reschedule subject** currently uses a plain hyphen `-` (an earlier build emitted the
  em-dash unencoded → a literal `?`; that mojibake defect is detected and flagged, not accepted).
- If a ticket changes the subject/body, edit the matching contract in
  `lib/email-contracts.js` (the `subjectRe`, `bodyMustContain`, `bodyShouldContain`, and
  `dynamicFields`) and re-run — the CLI will hold the build to the new contract.
