# eAuto — Pre-Application → Application → Registered
### Everything we know about the end-to-end dealer onboarding flow

Compiled 03-09-2026 by Charmain (QA), from the EAINT-11982 "Application Expiry
Extension" automation project. Handed over for another Pre-Application /
Application ticket.

---

## What this is

EAINT-11982 needed a supply of **real applications on staging** — created the way a
dealer creates them, driven to *Approved with registration documents verified*, so
that an Extend button could be tested on them. Building that supply meant automating
the whole onboarding journey end to end, and measuring every screen, label, URL,
validation quirk and cost along the way.

So this pack is a by-product, but it is the most thoroughly measured description of
the Pre-Application → Application → Registered flow that exists in the team. Every
screen in it was **observed**, not read off an SRD. Where something is inferred
rather than measured, it says so.

The Extend feature itself is **not** the subject here. Ignore the expiry-extension
parts and the flow underneath is yours.

---

## Where to start, in order

| Read | Why |
| --- | --- |
| **`01-flow/FLOW-video-verified.md`** | **Start here.** The whole journey, screen by screen, with every field, label, amount and URL, keyed to timestamps in the 23-08-2026 walkthrough recording. This is the single most useful file in the pack. |
| `01-flow/01-phase-quickref.md` | The 11 phases on one page: name, actor, URL, what it produces. |
| `01-flow/02-flow-diagram.md` | The same thing as a diagram, plus the state machine for Application Status and Hardcopy & Acc Created. |
| `01-flow/03-actors-urls-accounts.md` | Who logs in as what, which surface lives at which URL, and the role model. |
| `01-flow/04-costs-and-human-gates.md` | What one fixture actually costs in time, money and human attention. Read this before you estimate anything. |
| `01-flow/05-known-traps.md` | 20+ traps that each cost us a run. This is the file that saves you days. |
| `01-flow/06-hardcopy-and-registered.md` | The last mile — Create Account, the company-account form, and how a record becomes Registered. |
| `02-screens/INDEX.md` | Captured screenshots + accessibility trees + text for every screen in the flow. |
| `03-automation/` | The working Playwright code. `scripts/build-fixture.js` is the orchestrator. |
| `04-reference/` | The full 130KB project README, the fixture register, the SRD text extracts, the vault rules and the E2E scenario definitions. |

---

## The five things to know before you read anything else

1. **There is exactly one route to an application, and it starts at the public
   reCAPTCHA gate.** BackOffice has a "UCD New Application" panel that looks like a
   shortcut. It does not work end to end — it stalls at approval because the
   assignee's edit page carries no *Submit for Approval* button — and forcing it with
   the Application Status dropdown produces a **stub with no expiry date at all**
   (that record is `NA68001100`, if you ever see it and wonder). The dropdown sets
   the FIELD; the button runs the WORKFLOW. Do not reach for the dropdown.

2. **Only 2 of the 5 business types are automatable.** The three SSM types
   (Sdn Bhd/Bhd, Sole Prop/Partnership, LLP) send the BRN to
   `/obs/preOnb/checkSSM.do`, which is a **live lookup against real SSM data**. No
   generated BRN can ever pass it — staging answers `{"registered":false}` and the
   form silently switches you to *Business Trading (Sabah)*. Use
   **Business Trading (Sabah)** or **(Sarawak)** unless the SSM path itself is what
   you are testing, in which case you need real company data from dev/BA.

3. **The reCAPTCHA is the only genuinely manual step, and it costs one tick per
   build** — but a second build started while the saved session is still alive skips
   it entirely. Queue builds back to back and ask for one tick, not one per fixture.
   Both FPX payments (RM 108 pre-app fee, RM 990 registration fee) **drive
   themselves** through the Fiuu bank simulator.

4. **A full build is ~4 minutes of machine time and ~12 minutes of hands-on clicking
   if you do it by hand.** The automation reduces that to the one tick. See
   `04-costs-and-human-gates.md`.

5. **Two independent status fields control what renders on the BackOffice page**, and
   confusing them has cost us more time than anything else: **Application Status**
   (New → Pending → Approved → Expired) and **Hardcopy & Acc Created**
   (`-` → Pending UCD / Incomplete Docs / Pending Assignee → **Registered**).
   `Registered` is reached *only* by the Create Account button, never by setting the
   dropdown. See `06-hardcopy-and-registered.md`.

---

## What is measured vs. what is inferred

Everything in `01-flow/FLOW-video-verified.md` was read off frames of the
23-08-2026 Snagit recording (`2026-08-23_21-11-11.mp4`, 12m 45s, staging) or off a
live run, and the field-by-field selector map in
`03-automation/reference-data/locators-learned.json` is a record of which locator
**actually matched** on a real page, with a timestamp.

Two things in the pack are explicitly *declared, not measured*, and are flagged where
they appear:

- The **Revert to UCD** precondition (said to need a record still at Pending).
- The **Verified** state's effect on Create Account.

Both come from trigger-point labels and refusal reasons in our own code, not from a
reading. Confirm before relying on them.

---

## What is deliberately NOT in here

- **Credentials.** No passwords, no API tokens. Accounts are referred to by their
  registry key (`ops_jasons`, `hubadmin_bochar`). The passwords live in a shared
  store outside the project (`~/.claude/secrets/eauto.env`) and are managed by the
  `eauto-credentials` skill. Ask Charmain.
- **The 4.8MB HAR capture** (`preapp-flow.har`). It is 60 entries of reCAPTCHA
  challenge traffic and **not one** `/obs/preOnb/` form request — the recording never
  got through the gate. It is worthless for the flow and is left out for that reason.
  Mentioned only so nobody goes looking for it.
- The EAINT-11982 expiry-extension test register, evidence videos and Jira tickets.
  Different subject.

---

## If something does not work

The code in `03-automation/` runs against **staging** (`https://staging.eauto.my`,
instance `uat4`) and needs the shared credential store plus, for the expiry-patch
step only, the **VPN** (the support tool sits on an internal address). It is not a
clean-room package — it is the working rig, copied as-is, so you can read how each
screen was actually driven rather than reconstruct it.

The most reusable pieces, in order: `src/preapp.js` (the whole dealer journey),
`src/onboarding.js` (the BackOffice approvals), `src/listing.js` (the application
listing, including the AJAX trap that produced a false defect report), and
`reference-data/locators-learned.json`.
