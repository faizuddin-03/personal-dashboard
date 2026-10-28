# Mailtrap — the staging mail sink, and how we read it

Every email eAuto staging sends lands in one Mailtrap sandbox inbox. Two readers
exist in the repo: the team's reference CLI (REST API, `_reference/automation
code/Mailtrap-Email-Checker/`) and the quotation-reminder suite's browser reader
(`scripts/eauto-quotation-reminder/utils/mailtrap.ts`). Only the second mirrors
how the team actually checks mail. The verification pattern both share is the
house standard in [data-verification-standard.md](data-verification-standard.md).

## 1. The inbox

| Fact | Value | Provenance |
|---|---|---|
| Sandbox inbox id | `2581833` ("the modefair sandbox") | `[verified: _reference/automation code/Mailtrap-Email-Checker/README.md:57-58, 120]` |
| Web UI | `https://mailtrap.io/sandboxes/2581833/messages` | `[verified: lib/mailtrap.js:31 · SANDBOX_WEB; scripts/eauto-quotation-reminder/data/config.ts:83]` |
| REST messages endpoint | `https://mailtrap.io/api/accounts/{accountId}/inboxes/2581833/messages` — `{accountId}` varies and is not recorded anywhere in the repo; the `sandbox.api.mailtrap.io` host is an alternative | `[verified: config.example.json:6; README.md:56-58]` |
| Senders seen | `support@eauto.my` (SI/BDP appointment emails); `imonitor@eauto.my` (quotation reminder) | `[verified: lib/email-contracts.js:26]`; `[from QA team, 2026-08-13]` |
| Shared | one inbox for every tester and every environment segment, so a search must be scoped by recipient, subject and time window | `[verified: lib/mailtrap.js:86-94 · findMessages]` |

### 1a. Which emails reach Mailtrap, and which test addresses to use

From the QA Notion page "Email for Testing" `[from Notion export, QA Home/Email for Testing.pdf]`:

1. Received in Mailtrap: BMK email, eVOC email, JomCheck OTP / WhatsApp.
2. Received at the address entered, not Mailtrap: Dereg (final submission success →
   JPJ sends the email and COD) and eAuto Insurance emails (Takaful, TPFT, Chubb, Tokio
   Marine).
3. "DO NOT use @yopmail.com or any other disposable email".
4. When staging is connected to the e-simulator, @modefair.com is fine "EXCEPT for
   Deregistration because email will be sent from JPJ upon payment successful, so Dereg
   CANNOT use modefair email".
5. When staging is connected to JPJ Staging (e.g. SIT) or RHB Staging, "DO NOT use
   @modefair.com".
6. Secarang and CIBO: use @modefair.com.

This narrows the opening line of this file ("Every email eAuto staging sends lands in
one Mailtrap sandbox inbox"). The quotation reminder (an eAuto insurance email from
`imonitor@eauto.my`) is read from Mailtrap `[from QA team, 2026-08-13]`, so item 2 most
likely means the insurer's policy/confirmation emails, not every insurance email.
Which insurance emails bypass Mailtrap is `[unconfirmed]`.

## 2. Two transports — and which one the team uses

### 2a. Browser, signed-in Chrome profile (the working method)

The senior who built the working email check does not use the API: *"nope i
dont think im using mailtrap api to test with automation script ya, it actually
using chrome mcp to access the mailtrap and test manually"*. `[from QA team,
2026-08-17]` The quotation-reminder suite mirrors that:

1. The run route resolves the Chrome profile **by Google account**: it reads
   `%LOCALAPPDATA%\Google\Chrome\User Data\Local State` → `profile.info_cache`
   and picks the single entry with `hosted_domain === "modefair.com"` or
   `user_name` ending `@modefair.com`. Zero or several matches → the run still
   creates the quotation and the email check reports `blocked`.
   `[verified: app/api/eauto-quotation-reminder/run/route.ts:58-98 · resolveWorkProfile]`
   Testing always runs in the work profile; the dashboard shows it as "Fixed"
   and offers no control (`app/eauto/quotation-reminder/page.tsx:193-200, 386-396`).
2. Chrome locks an open profile, so the spec **copies** only `Local State`,
   `<profile>/Preferences`, `<profile>/Network/Cookies` and `<profile>/Cookies`
   into a temp `qr-chrome-*` directory whose profile folder is always named
   `Default`, then deletes it afterwards.
   `[verified: scripts/eauto-quotation-reminder/utils/mailtrap.ts:32-53 · stageProfile]`
3. It launches `chromium.launchPersistentContext(staged, { headless: false,
   channel: 'chrome', viewport 1440×900 })` — **headed on purpose**: "Mailtrap's
   app shell is unreliable headless" (`utils/mailtrap.ts:71-75`).
4. It opens the inbox URL, waits 3 s, and treats a URL matching
   `/sign_?in|login|users\/sign/i` as signed-out → `blocked` with the message
   "Mailtrap is signed out in the <profile> Chrome profile. Open <inbox> in
   Chrome, sign in, then re-run." (`utils/mailtrap.ts:77-86`).
5. It scrapes the first 40 rows of the list (selectors in § 4) and returns
   `{ subject, from, to, receivedLabel }` per row. Any exception → `blocked`.

No token and no Mailtrap password exist anywhere in the repo
(`utils/mailtrap.ts:8-11`).

**Constraints that follow — the GitHub Actions problem.** A cloud runner has no
signed-in Chrome profile and no display, and the read is headed, so **the
Mailtrap check cannot run on GitHub Actions**. The laptop is off from 18:00 and
auto-login was declined, so the overnight EAINT-11864 case was split: Actions
creates the quotation at 23:30, Faizuddin reads the inbox by hand in the morning
(`scripts/eauto-quotation-reminder/tests-nightly/nightly-quotation.spec.ts:8-14,
40-41`; `.github/workflows/nightly-quotation.yml` header; `[from Faizuddin,
2026-08-17]`). Stored-credential login on CI and a fully manual case were both
rejected. This is still open; Faizuddin asked to be reminded once the
automation scripts have progressed.

An expired sign-in is `blocked`, never a failure, and the fix is to sign in
again in Chrome — nothing in the automation changes
(`[from QA team, 2026-08-17]`, [data-verification-standard.md](data-verification-standard.md)).

### 2b. REST API (the reference CLI — documented, not used)

`_reference/automation code/Mailtrap-Email-Checker/lib/mailtrap.js`:

| Item | Detail | Line |
|---|---|---|
| Auth | header `Api-Token: <token>`, `Accept: application/json` | 54-59 |
| Config precedence | env → `config.json` → default: `MAILTRAP_TOKEN`/`mailtrapToken`, `MAILTRAP_URL`/`mailtrapUrl` (no default), `MAILTRAP_WEB_URL`/`mailtrapWebUrl` (defaults to the web UI) | 44-51 |
| Enabled gate | `!!(token && url && typeof fetch === 'function')` — **both** token and URL are required or every assertion degrades to `blocked` | 52 |
| List | `GET <url>`; accepts an array or `{data}`/`{messages}`; sorted newest first by `sent_at` then `created_at`; **any error returns `[]`** | 61-70 |
| Bodies | `<url with /messages… replaced by /messages/<id>>/body.raw`, `/body.html`, `/body.txt`, each best-effort | 72-81 |
| Message fields used | `id`, `subject`, `from_email`/`from`, `to_email`/`to`, `sent_at`/`created_at` | 83-92, 126-133 |
| Window | messages older than `sinceMs - 60000` are dropped (60 s clock-skew slack) | 89 |
| Manual mode | with no token the CLI prints the exact hand-check steps and exits 0 | 96-99, 113-118 |

CLI (`check-email.js`): `list [--to x] [--n 20]`, `show <id>`,
`confirmation|confirm`, `reschedule|resched`, `none|absent [--reason "…"]`,
`--since 30m|2h|90s|1d` (default 1h). Exit 0 when all passed or blocked, 1 on
any fail. Node 18+, no dependencies. `[verified: check-email.js:14-38, 156-165]`

## 3. How emails are matched

| Reader | Match rule | Uniqueness | Absence |
|---|---|---|---|
| Reference CLI `assertEmail` | `contract.subjectRe.test(subject)` AND recipient substring (case-insensitive) AND `sent_at ≥ since − 60 s`; then takes `matches[0]` | **not checked** — a duplicate passes | `assertNoEmail` passes on zero matches; default `subjectRe` is the SI appointment subject, so any other module must pass `type` or it checks the wrong mail (`lib/mailtrap.js:168-171`) |
| Quotation-reminder `matching()` | `vehicleNo` (whitespace stripped, uppercased) is a substring of `subject + to + from` (whitespace stripped, uppercased), over the first 40 rows of the list | `expected: 'one'` → `toHaveLength(1)`; `'none'` → `toHaveLength(0)` | same helper, inverted |

`[verified: lib/mailtrap.js:107-131, 168-187; scripts/eauto-quotation-reminder/utils/mailtrap.ts:113-117; tests/quotation-reminder.spec.ts:150-169]`

Weaknesses to know before trusting either:

1. `matching()` assumes the vehicle number is visible in the list row (subject
   or addresses). Whether the reminder's subject carries the vehicle number is
   `[unconfirmed]` — the subject has never been read off a real message.
2. The quotation-reminder reader never opens a message, so sender, recipient,
   Discount amount and the "Complete Purchase Now" link are not asserted.
3. Neither reader scopes by **time** in the browser path — a leftover reminder
   for the same vehicle from a previous run would count. The REST reader has
   `sinceMs`; the browser reader has only `receivedLabel` text it does not use.
4. The REST `listMessages` swallows errors into `[]`, so an unreachable API
   reads as an empty inbox and `assertNoEmail` goes falsely green
   ([data-verification-standard.md](data-verification-standard.md) § Where the reference falls short).
5. Bodies are matched by substring over `html + txt + raw` concatenated; a
   quoted-printable or base64 part can miss or match headers (`lib/mailtrap.js:128`).

## 4. The browser reader's DOM handles — unverified

```
rows:     [data-testid="message-list-item"], li[class*="message"], tr[class*="message"]
subject:  [data-testid="message-subject"]  → [class*="subject"]  → row text (first 200 chars)
from:     [data-testid="message-from"]     → [class*="from"]
to:       [data-testid="message-to"]       → [class*="to"]
date:     [data-testid="message-date"]     → time → [class*="date"]
```
`[verified as written: scripts/eauto-quotation-reminder/utils/mailtrap.ts:88-100]`

⚠️ No capture of the Mailtrap web UI exists under `_reference/html/`, and no run
log in the repo shows this reader returning rows. Treat the selectors as
`[unconfirmed]`. First step when the suite resumes: open the inbox in the work
profile, save `<body>` to `_reference/html/mailtrap/inbox-messages.html` (the
standing capture rule), then fix the selectors against it. If
`[class*="to"]` matches a wider class name than intended (`to` is a common
substring), the `to` field will be noise — check this first.

## 5. Email contracts

### 5a. SI / BDP appointment emails (reference tool, `lib/email-contracts.js`)

Both SI and BDP send the same "Software Installation Appointment" emails.
Sender `support@eauto.my`; baseline Customer Service number `03-27798899`;
footer regex `/automatically generated email/i`. `[verified: lib/email-contracts.js:26-28]`

| Contract key | `appointment-confirmation` | `appointment-reschedule` |
|---|---|---|
| Subject (human) | `eAuto: Your Software Installation Appointment is Confirmed - [UCD Company Name]` | `eAuto: Your Software Installation Appointment has been Rescheduled — [New Date] ([Day]), [Time Slot]` |
| `subjectRe` | `/eAuto:\s*Your Software Installation Appointment is Confirmed\s*[-–—?]\s*.+/i` | `/eAuto:\s*Your Software Installation Appointment has been Rescheduled\s*[-–—?]\s*\d{1,2}[.\-/]\d{1,2}[.\-/]\d{2,4}.*\d{1,2}:\d{2}\s*[ap]m/i` |
| `bodyMustContain` (hard) | `/Software Installation Appointment/i` | `/rescheduled/i` |
| `bodyShouldContain` (soft) | details table `/(date)/i`; CS line `03\-27798899`; auto footer; reminders `/(identification|passport|vehicle|before your appointment)/i` | details table; auto footer; reminders; contact line `(03\-27798899|contact us at support@eauto.my)` flagged `deviation: true` |
| `dynamicFields` | `companyName`, `appointmentDate`, `timeSlot`, `units` | `appointmentDate`, `timeSlot`, `units` |
| `baselineRef` | `SRD V1.0 §2.3.2.1 #7 · requirements.json Email · C1` | `SRD V1.0 §2.3.2.1 #8 · requirements.json Email · BDP-E2E-61 · partial-display 22.07 (decision T)` |
| `trigger` | *"Fires ONCE when an installation appointment is CONFIRMED (Confirm Appointment → Request Submitted), for both SI bookings and the BDP bundled install."* | *"Fires when an appointment is rescheduled: UCD self-service reschedule, CSE/BO reappoint (incl. after Mark-Failed), and the same-day reschedule special case."* |
| Corrections recorded | — | subject corrected 15.07 from `…Rescheduled - [UCD Company Name]` to date+time (live, message 5594318644); partial reschedule lists only the rescheduled appointments (decision T, 22.07) |

Known defect, flagged not accepted: `SUBJECT_ENCODING_DEFECT` —
`/(Rescheduled|Confirmed)\s+\?\s+\S/i` — the subject's em-dash renders as `?`
because the Subject header is not RFC 2047 encoded; observed 15.07.2026 on
message 5594318644. `[verified: lib/email-contracts.js:33-37]`

`appointmentDate` is matched in three spellings (`2026-08-14`, `2026.08.14`,
`14.08.2026`) inline (`lib/mailtrap.js:154`). The `LEGEND` vocabulary a scenario
may use: `confirmation`, `reschedule`, `both`, `contract`, `none`
(`lib/email-contracts.js:103-109`).

### 5b. Quotation reminder (EAINT-11864) — contract draft, not yet in any code

| Field | Value | Provenance |
|---|---|---|
| `from` | `imonitor@eauto.my` | `[from QA team, 2026-08-13]` |
| `subjectRe` | **[unconfirmed]** — read it off a real message first | — |
| `bodyMustContain` | Vehicle No; **Discount** Amount (not "Commission" — SRD v1.1 wording is stale) | `[from QA team, 2026-08-13]` |
| `bodyShouldContain` | a "Complete Purchase Now" button/link | team script TS08–TS12 |
| `dynamicFields` | vehicle no, discount amount, recipient UCD | — |
| `trigger` | hourly cron 07:00–23:00, next run after the quotation; once only; dead window 23:00→07:00 | `[from QA team, 2026-08-13]` |
| Uniqueness | exactly one per quotation — count the matches | team script TS03 |

Details and the automation around it: [flow-quotation-reminder.md](flow-quotation-reminder.md).

## 6. Constraints and traps

1. **Headed browser, real Chrome channel, signed-in profile** — none of which
   exist on a CI runner (§ 2a).
2. **Two values to wire the API**, `MAILTRAP_TOKEN` and `MAILTRAP_URL`; the
   token alone silently disables the checker (`lib/mailtrap.js:52`).
3. **`{accountId}` is unknown** in the repo; anyone wiring the API must look it
   up in Mailtrap.
4. **Profile folder names move**; resolve by account, fail loudly on 0 or >1
   matches (route `resolveWorkProfile`).
5. **Copy, never open in place** — Chrome locks the profile; copying the whole
   tree costs hundreds of MB per run, so only the session files are copied.
6. **Shared inbox** — scope by recipient + subject + window; count matches.
7. **No seconds anywhere on eAuto surfaces**; the inbox's `receivedLabel` is
   the only timestamp with any precision for minute-boundary cases, and it is
   not parsed today.
8. `blocked` is the verdict for "could not read"; never let an unreachable
   inbox read as "no email".

## 7. What is NOT covered

1. A saved capture of the Mailtrap web UI (list and message views).
2. The REST `{accountId}` and whether the token route is permitted by the team.
3. Parsing a message body in the browser reader (open a row, read html/txt).
4. Time-windowing in the browser reader.
5. The quotation-reminder subject and body wording, and the link target.

## 8. From Charmain's repo (read 2026-10-27)

1. Her EAINT-11982 rig films the Mailtrap inbox in the browser, before and after
   the action (TS19), and reads the API beside it into the sidecar as a second,
   independent reading. Needs `MAILTRAP_INBOX_ID` and a person to sign in.
   `[charmain-repo: .claude/skills/test-evidence-recording/references/eaint-11982.md:112, 182-195]`
2. A signed-out inbox hands back to the operator; credentials are never typed by
   the rig or on camera. With nobody there, the leg refuses its points rather than
   filming a login page as an inbox. Same direction as our § 2a (signed-in Chrome
   profile). `[charmain-repo: same, 184-189]`
3. **Positive control `mailbox-live`:** an empty inbox and a broken catcher look
   identical, so a "no email" result first proves the inbox is live and readable.
   Matches our data-verification rule "never assert an absence alone".
   `[charmain-repo: same, 190-195]`
