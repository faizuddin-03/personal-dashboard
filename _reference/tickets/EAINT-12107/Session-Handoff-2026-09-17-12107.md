# Session handoff — 2026-09-17 (EAINT-12107)

Scratch note for resuming later. Not part of the knowledge base — safe
to delete once picked back up. Supersedes
`Session-Handoff-2026-09-15-12107.md` (which itself superseded the
2026-09-10 version) — deleted alongside this file.

## 2026-09-17 — no direct session work; ownership/status clarified via
automated Teams sync (ticket reassigned to Amirul Azfar on 2026-09-15;
he has not started test execution as of today)

No direct user-driven session touched this ticket today. All of today's
findings came from the hourly `teams-knowledge-sync` background agent
(Windows Scheduled Task `ClaudeHourlyTeamsSync`), which checks Teams for
whichever ticket(s) it judges currently active and writes findings
straight into `knowledge/eauto-payments.md`. Recording the key facts here
too since they materially change who owns this ticket's next steps.

**Finding 1 — reassignment**: this ticket was reassigned from Faizuddin
to **Amirul Azfar** on 2026-09-15. Faizuddin had already drafted the
E2E/negative-flow test script before the handoff (the actual xlsx,
`EAINT-12107 - [Secarang-Fiuu] Enhance Payment Gateway...xlsx`, shared
with Amirul and the team on 2026-09-15) — regression TS was still
pending at that point.

**Finding 2 — no execution yet**: Amirul's own status posts through
2026-09-17 (today) still read "To study and draft test scenario" — no
test execution has started despite having the drafted TS in hand since
the 2026-09-15 handoff. Treat this ticket as **not actively being worked
by Faizuddin right now** — anyone picking it up should coordinate with
Amirul first rather than assuming Faizuddin's 09-15 study is the current
state of play.

A stale memory note ("EAINT-12107 reassigned to Azfar") was reconciled
against this finding and updated to also credit Faizuddin with having
drafted and shared the TS despite the reassignment, so future sessions
don't lose that context. No test scripts were touched, no automation was
run, no new SRD version appeared today.

Everything else below (from the 2026-09-15 handoff) is unchanged and
still the actual state of the ticket's study/scope work — this was
purely a status/ownership update, not a new working session.

---
## 2026-09-15 — full re-study with SRD v1.1 now in hand, plus the actual
agreed test scope pulled from a Teams DM. No automation built, nothing run
in staging. This was a knowledge-gathering session end to end.

### 1. Where this picks up from 2026-09-10

The 09-10 handoff had: ticket + 3 comments studied, SRD v1.0 read (18
pages, saved manually by Faizuddin because the browser attachment download
hung), a rough 7.5–8.5 day automation/estimate given, and an open scope
question about whether the CIBO Transaction Management listing fix was
covered by this SRD or tracked elsewhere.

Today resolved or superseded most of that:
- **SRD is now v1.1** (`SRD_EAINT-12107_..._v1.1_20260911.pdf`, 22 pages,
  saved into this folder by Faizuddin again mid-session) — one version
  newer than the 09-10 v1.0 read, with 2 new sections (2.2.7 filter, 2.2.9
  Payment Reference ID) that hadn't existed the first time.
- **The Teams channel dedicated to this ticket** (`EAINT-12107 [...]`) was
  read start to finish, 03/09 through today — this fills in nearly
  everything the SRD leaves as "confirmed elsewhere," and is the source for
  most of what's below.
- **A separate 1:1 DM in the "eAuto QAs" channel**, between Faizuddin and
  May Chin Mei Theng (Fri 11/09, 16:31–18:21), turned out to hold the
  actual settled test scope — Faizuddin remembered it existed but not
  where; found by searching "12107" inside that specific chat.
- The old CIBO-listing scope question is effectively answered by the SRD:
  the SRD's Affected Pages (§2.2.3) only names the Transaction **Details**
  drill-in view, not the listing row itself. The "no longer shows '-'"
  fix Shane mentioned is a dev-side bug fix, not a formal requirement —
  still no exact spec for what text each channel shows in the listing
  column. Confirm in staging once testable.

### 2. Status/assignment as of today

Jira status field still reads **Code Review** — but Kasheng Liew told Yi
Link in Teams **today, 15/09 10:21am**, that code review is done and it's
ready for QA. Treat Teams as current; Jira hasn't caught up. Assignee is
still Lim Yi Link per Jira (no reassignment observed today, unlike
EAINT-12028's flip — don't conflate the two tickets).

### 3. SRD v1.1 — what's new since the v1.0 read (09-10)

Full REQ-001–015 table is in the PDF; not re-copied here. What's new
relative to the earlier handoff:

- **§2.2.7 Payment Channel Filter (REQ-011–013)** — CIBO → Payment
  Management → Payment Channels filter gets a new **"Fiuu - eWallet"**
  group with 4 checkboxes: GrabPay, GrabPay - PayLater by Grab, ShopeePay,
  ShopeePay - SPayLater. Ticking the parent defaults all 4 to ticked
  (REQ-012); any one can be unticked independently without affecting the
  others (REQ-013). This exactly matches what Kasheng described in Teams
  on 07/09 — SRD formalizes it with requirement numbers.
- **§2.2.8 Eligibility of Testing in Sandbox** — an explicit table,
  matching Teams exactly: only **GrabPay – Full Amount** is testable
  end-to-end in Fiuu's sandbox. ShopeePay (both modes) and GrabPay
  PayLater are all "Not able to test." Same conclusion as the 09-10 read,
  now with a named section number to cite.
- **§2.2.9 Payment Reference ID (REQ-014/015, new in v1.1)** — e-wallet
  transactions get an `EW` identifier baked into the Payment Reference ID,
  e.g. `LON20260908SEW0002`. This surfaces in 5 places, including **CIBO
  Payment Report** — a page not previously called out as affected in the
  09-10 study or in Teams. New surface to include in functional testing.
- **Assumption #3** confirms the tenure-storage open question from the
  first study: SPayLater/PayLater-by-Grab installment terms are managed
  entirely by Shopee/Grab, not verified or stored by Secarang. The "flat
  flag vs tenure split" question from 09-10 is resolved — Secarang only
  needs to know it's a Pay Later transaction, not which tenure.
- Activation dates (26 May / 21 June 2026) in the SRD table are confirmed
  intentional per §2.1.3 — both channels release together regardless, the
  per-channel dates are informational only, not a copy-paste error as
  suspected on 09-10.
- Naming ambiguity from 09-10 (title says "ShopeePay and GrabPay",
  description says "SPAY Later and PayLater by Grab") is resolved via
  Teams (Kasheng, 03/09): SPayLater and PayLater-by-Grab are BNPL
  sub-options inside the existing ShopeePay/GrabPay flow, not separate
  channels.

### 4. The actual agreed test scope (from the eAuto QAs DM, 11/09)

This is new — the 09-10 handoff had no test scope, only an automation
estimate. Full exchange, May Chin Mei Theng ↔ Faizuddin, Fri 11/09
16:31–18:21:

- May Chin's opening ask (16:31): test GrabPay, regress existing payment
  methods, try it across all insurers; floated asking dev to patch
  transactions to `shopeepay` / `spaylater` / `grabpay` /
  `grabpaylater` so CIBO's filter/display can be checked without a
  working sandbox.
- Insurer scope narrowed (16:37, Faizuddin): Charmain checked with KJ —
  all insurers share the same payment gateway, so **any 1 available
  insurer is sufficient**, no need to repeat across insurers.
- Estimate settled at **1+1 days** (down from an initial 2+1 floated by
  Faizuddin at 16:44), once ShopeePay's sandbox limitation was confirmed.

**Final agreed scope (confirmed "yup, but add one more" 17:53 → "yup yup"
18:21):**
1. **E2E Flow**
   - TS1: Create Transaction → GrabPay → Payment = OK
   - TS2: Create Transaction → GrabPay → Payment = Failed
   - TS3: Create Transaction → Regress Existing Payment Method
     (Credit/Debit Card / FPX Online Banking) → Payment = OK
2. **Request Dev Patching** (sandbox can't produce these outcomes)
   - TS1: Payment = ShopeePay
   - TS2: Payment = SPayLater
   - TS3 (added after May Chin's first draft): Payment = PayLater by Grab
3. **Functional Testing**: CIBO filter function + payment type display
   correctness, including the export file

This scope is now folded into the published artifact (see below) as a
dedicated "Test Scope" section. **This supersedes the 09-10 handoff's
automation-only estimate framing** — the team's actual plan is a mix of
manual E2E (GrabPay), dev-patched functional verification (ShopeePay/
SPayLater/PayLater-by-Grab), and regression, not a from-scratch automation
build. If automation still gets attempted on top of this, scope it against
these 3 groups specifically, not the old 7.5–8.5 day greenfield estimate.

### 5. Artifact built and iterated three times

`_reference/tickets/EAINT-12107/EAINT-12107-study.html` — single-page HTML
study, published as a Claude artifact
(`https://claude.ai/code/artifact/2627aca2-1c4d-4fa3-8e99-219a9f74eb38`).
Contents as of the last edit today: status banner (Jira/Teams mismatch),
testability matrix (GrabPay works in staging, ShopeePay + both BNPL
variants don't), full Teams timeline 03/09 → today, SRD REQ mapping
(REQ-001 through 015), CIBO eWallet filter breakdown, Payment Reference ID
section, open questions, and the Test Scope section from §4 above. Iterated
three times in one session: (1) built from ticket+comments+Teams, (2)
updated once SRD v1.1 was read, (3) updated again once the test-scope DM
was found. Treat this file as the current single source for anyone picking
the ticket up — it's more current than either handoff note's prose.

### 6. What's in the ticket folder now

```
_reference/tickets/EAINT-12107/
  NOTES.md                                                   — stale, see below
  EAINT-12107-study.html                                     — current, see §5
  SRD_EAINT-12107_..._v1.1_20260911.pdf                      — read in full (22p)
  Session-Handoff-2026-09-15-12107.md                        — this file
```

**`NOTES.md` is stale** — it still describes only the v1.0 PDF (18 pages,
saved 09-10) and lists 4 other attachments (v1.0/v0.2/v0.1 docx twins,
`secarang_payment_channels_prototype.html`) as never downloaded. That's
still true — none of those 4 were fetched today either, same browser
download hang as before, not retried this session. Didn't edit NOTES.md
myself (out of scope for this handoff-writer's remit); flagging here so
whoever next touches this folder updates it to mention v1.1 superseding
v1.0, or a future session does it as part of picking the ticket back up.

### 7. Open items carried over + new

Carried over, still unresolved:
- ShopeePay tenure/indicator recordability with Fiuu's API — no resolution
  seen in Teams since 03/09.
- Real-money dev account arrangement for BNPL testing (Fiuu offered one) —
  never resolved as of today.
- CIBO's GrabPay-PayLater / ShopeePay-SPayLater filter dropdown entries
  not yet appearing in the dropdown — blocked on confirming Fiuu passes
  the indicator field correctly in production (08/09 status, unconfirmed
  since).
- Related ticket EAINT-12327 (CIBO payment-mode column format) still "To
  Do" — may interact with the same Transaction Management column this
  ticket touches; not investigated today.

New from today:
- Exact listing-row display text per payment channel (e.g. "GrabPay" vs
  "GrabPay - PayLater by Grab") is not specified anywhere in the SRD or
  Teams — confirm once in staging, not blocking but worth checking during
  TS group 3 functional testing.
- Whether the "any 1 insurer" simplification (§4) needs to be re-verified
  once real testing starts, or whether it's settled enough to just proceed
  on — treated as settled by both parties in the DM, no further pushback
  needed unless something surfaces during execution.

### 8. Next steps for whoever picks this up

1. **No testing has started.** Everything today was study/scope-gathering.
   Next actual work is executing the 3 test groups in §4 against staging —
   start with E2E TS1–TS3 (GrabPay OK/Failed + regression), since that's
   the only fully sandbox-testable path.
2. **Raise the dev-patching request** (group 2 in §4) with the dev team
   before or alongside E2E execution — those 3 transactions need to exist
   in a patched state before CIBO functional testing (group 3) can run
   against them.
3. Confirm code-review-done status gets reflected in Jira (or just proceed
   treating it as ready-for-QA per Kasheng's Teams message — no need to
   wait on the field itself).
4. **Durable-knowledge candidate, not written by me**: the SRD's §2.2.8
   sandbox-testability table (GrabPay Full Amount only) and the "any 1
   insurer, same gateway" fact from §4 both look reusable beyond this one
   ticket if Secarang/Fiuu work recurs — consider a `knowledge/flow-fiuu.md`
   or similar if a next ticket touches this module, rather than
   rediscovering it. Also consider adding a one-liner for EAINT-12107 to
   `lib/ticketStudies.ts` (currently has no entry for this ticket) since a
   settled test scope now exists.

### Timesheet

Not verified in this session — no CapacityTrack check performed for
2026-09-15 on this ticket.
