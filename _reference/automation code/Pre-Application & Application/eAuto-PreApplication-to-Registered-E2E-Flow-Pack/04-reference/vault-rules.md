# The 23 measured rules (vault export)

These are the rules the EAINT-11982 register was built on. Most concern the
expiry-extension feature and are here only for completeness. **The five marked
FLOW below are about the Pre-Application / Application flow itself** and are the
ones worth reading for another PA+A ticket.

| Ref | Title | Flow-relevant? |
| --- | --- | --- |
| **R1** | Once only, ever |  |
| **R2** | Remark is mandatory |  |
| **R3** | Extending before expiry |  |
| **R4** | Extending after expiry |  |
| **R5** | The window — 30 days before expiry, 3 calendar months after it |  |
| **R6** | Already extended → greyed, until Registered |  |
| **R7** | Never extended, past the window → no button |  |
| **R8** | No emails |  |
| **R9** | Status must be Approved or Expired, and Hardcopy Doc not Registered | **FLOW** |
| **R10** | Concurrent Extend — one wins, one is refused |  |
| **R11** | Three states, and absence is the default |  |
| **R12** | Registered ends the expiry lifecycle — nothing changes afterwards | **FLOW** |
| **R13** | Assignment does not gate the button |  |
| **R14** | The extension remark stays off the listing and out of the export |  |
| **R15** | Eighteen named BackOffice accounts cannot extend |  |
| **R16** | Extending an expired application puts it back to Approved — on both surfaces |  |
| **R17** | Three BackOffice roles — Admin and HubAdmin reach the module, Probation does not | **FLOW** |
| **R18** | Every change to an application is written to the UCD Application Audit Log |  |
| **R19** | BackOffice-generated stubs are out of scope — and must be left untouched | **FLOW** |
| **R20** | The evidence standard — what a still must show, for every scenario |  |
| **R21** | A take must assert the control state its scenario CLAIMS, not merely film whichever state it finds |  |
| **R22** | Every transaction is created from the Pre-Application Form | **FLOW** |
| **R25** | The extension remark shows on the details page sidebar — and nowhere else a user reads applications |  |

---

## R1 — Once only, ever

*Source: SRD 11982 v1.0 REQ-005 + DEV GUIDE*

Each application can be extended one time in its entire lifetime.

**REQ-005 (26-08-2026)** puts this in the requirement register at last: *"The system shall allow each application to be extended once only, for a fixed period of 30 days."* Its Example 2 adds the server-side half — *"a second extension is blocked"* — so the once-only rule is not merely a rendering rule, and TS26.2 is testing something the document actually asks for. The same requirement adds the reactivation gate: once an application has been reactivated it is never eligible again (see TS46).

**Note:** SRD item 3 + loop scenario: one 30-day extension ever; after it expires again the only path is RM108 reactivation (other ticket), and a reactivated application is never extendable again.

## R2 — Remark is mandatory

*Source: DEV GUIDE + BUILD (client-side JS, read 25-08)*

Extending without a remark is refused.

HOW, as built (25-08-2026): the textarea carries NO required attribute — the rule is client-side JavaScript only. On Confirm the page trims the value, and an empty result renders #extend-remarks-error and marks the field .invalid-marker without sending anything. Nothing is known about server-side enforcement, because the client never lets an empty remark reach it. TS26.2 (replay the request with an empty remark) is therefore the only way to learn whether the server enforces the rule at all.

**THE SERVER-SIDE PROBE NOW HAS A REF — TS52 (26-08-2026).** The sentence above points at "TS26.2 (replay the request with an empty remark)", but TS26's four calls are a re-sent request, an already-extended application, one past the window and one the caller is not assigned to — the empty remark is in none of them. TS52 carries it, in four variants (absent field, empty string, whitespace, single character), and reads the audit log on the way out so that an accepted blank can be reported together with what `[Remarks] old: - new: ?` ends up holding.

**Note:** The SRD does not state the remark is mandatory; this rule came from the dev guide and is now confirmed in the build, but only as a client-side check.

**STILL NOT IN THE SRD, 26-08-2026.** REQ-008 says only that the BackOffice user "shall be able to enter remarks" and that the existing Remarks field behaviour is unchanged; Assumption 3 says the same. Neither document — 11982 v1.0 nor 11868 v1.4 — uses the word mandatory or required. So R2 rests exactly where it did: the dev guide, Figma, and the client-side `.trim()` check read out of the build on 25-08. If the server accepts an empty remark that is defensible against the SRD, which is why TS26.2 records rather than grades it.

## R3 — Extending before expiry

*Source: SRD 11982 v1.0 REQ-003 + REQ-006 + QA RULING 26-08-2026* · verified

New expiry = original expiry + 30 days. Clicking early gains nothing extra. Status stays Approved.

**REQ-006 (26-08-2026)**, verbatim on the arithmetic: clicked before expiry, the new date counts from the ORIGINAL expiry date. Unchanged from v1.3. What REQ-006 also does is frame the before-expiry case as "within 30 days before" — and REQ-003 turns that framing into a display window. The arithmetic is not in doubt; whether the button should be THERE more than 30 days out is C8.

**THE BUTTON IS NOT OFFERED THIS EARLY (ruling 26-08-2026).** The arithmetic below is unchanged, but the availability is: a pre-expiry extension is only reachable **within 30 days of the expiry date** (REQ-003). Outside that, there should be no button to click. The build offers one from approval onwards, which is the C8 defect — so every "extend before expiry" case must be run on a record inside the last 30 days, not on any Approved row that happens to be handy.

**Note:** SRD item 6.1 verbatim: extend on 20 Jul 2026 against expiry 1 Aug 2026 → counts from 1 Aug. Original + 30 days. CONFIRMED 25-08-2026 (Q24): the button is available any time before expiry — no 30-day pre-expiry window — and an early click still yields original + 30, so early extending gains nothing.

## R4 — Extending after expiry

*Source: SRD 11982 v1.0 REQ-006 + REQ-007 + DEV GUIDE* · verified

New expiry = the day you click + 30 days, and the application becomes Approved again.

**REQ-007 (26-08-2026)**: *"The system shall set the application status to Approved once the application is extended"*, acceptance criterion *"Application status = Approved after the extension is completed"*. This is the third independent source for the Expired → Approved flip (dev guide, the 26-08 restatement, now a numbered requirement).

**Note:** SRD item 6.2 verbatim: extend 15 Sep 2026 → new expiry 15 Oct 2026. Click date + 30 days.

RESTATED 26-08-2026 (item 1): "the application status returns to Approved when the application is extended." Same rule, third independent source. Already asserted in code — `extend-arithmetic.spec.js` TS05 expects Expired -> Approved, and TS04 expects a pre-expiry extension to leave the status untouched at Approved. Nothing to change.

## R5 — The window — 30 days before expiry, 3 calendar months after it

*Source: SRD 11982 v1.0 REQ-003 + BA-CONFIRMED 26-08-2026 + QA RULING 26-08-2026*

Extending is possible until 90 days after the expiry date (BA-confirmed 24-08-2026; the SRD's "3 months" wording and 1 Aug – 1 Nov example are loose phrasing).

OBSERVED AT THE BOUNDARY, 26-08-2026 (no dev date-patch needed — staging aged into it): NA62000987, expired 2026-05-28, exactly 90 days past, Hardcopy "Pending Assignee" — Extend PRESENT and enabled. NA62000984, expired 2026-05-26, 92 days past, Hardcopy "Pending UCD" — Extend ABSENT. NA63001000/NA63001001 at 80 days past — present. So the window holds at day 90 and is gone by day 92. NOTHING SITS AT DAY 91 today, so the exact flip is BRACKETED, NOT PINNED — and the bracket closes itself: NA62000987 is 91 days past tomorrow, so re-running TS08.1–.3 on consecutive days settles it for free. Day counting is date-based per Q4.

**REQ-003 (26-08-2026) says "3 months", twice, and never says 90 days.** The BA said 90 days out loud on 24-08 (Q3) and QA has tested against 90 ever since. The boundary data CANNOT separate the two readings: NA62000987 was day 90 and showed the button, NA62000984 was day 92 and did not, and for those particular expiry dates three calendar months lands between them too. So the tested number stays 90, the document still says 3 months, and Q33(b) asks the BA to pin it. If it turns out to be calendar months, TS08/TS09 need month-end fixtures rather than day counting.

**BOTH ENDS, SETTLED 26-08-2026 (Charmain).** The window is **expiry − 30 days to expiry + 90 days**. The 90 is confirmed twice over now (BA verbally on 24-08, this ruling today) and the SRD's "3 months" is a wording defect the BA is asked to fix — three calendar months is 90, 91 or 92 days depending on the month, so it is not a synonym. The **lower** end is the new half, and the build breaks it (C8).

**THE WINDOW, CONFIRMED BY THE BA 26-08-2026** (via Charmain), in the requirement's own three lines:

1. application **created date + 90 days** = the initial expiry date
2. **initial expiry − 30 days** → the Extend button appears
3. **initial expiry + 3 CALENDAR MONTHS** → the button is offered until then, and hidden after

So the SRD's "3 months" is correct and QA's 90-day figure was wrong — it came from a verbal answer on 24-08 (Q3) and was tested against for two days. **The wording change QA was about to request has been withdrawn**; we nearly asked the BA to amend a correct document to match our own mistake.

**The two ends count in different units**, and the upper one moves with the calendar:

| Initial expiry | + 3 months | In days |
| --- | --- | --- |
| 31 May 2026 | 31 Aug 2026 | 92 |
| 30 Nov 2026 | 28 Feb 2027 | 90 |
| 28 Feb 2027 | 28 May 2027 | 89 |
| 31 Jan 2026 | **30 Apr 2026** | 89 |

That last row is the month-end rule: the day is clamped to the last day of the target month, because 31 April does not exist. It follows timeanddate.com's calculator, the reference Charmain supplied. **A day count cannot stand in for this** — the same "day 91" is inside the window for one record and outside it for another.

Anchored to the **initial** expiry date, not to the new date an extension produces.

**THIS SUPERSEDES THE "90 DAYS" WORDING EVERYWHERE IN THIS VAULT.** Where an older note, scenario or rule says "the 90-day window", read "expiry + 3 calendar months". The 90 days that IS correct is the base validity: created + 90 days = the initial expiry date.

**THE CLOSING DAY — MEASURED 26-08-2026, AND UNRESOLVED ON PURPOSE.** With the upper bound corrected to three calendar months, TS08 failed on one row: **NA62000984**, expiry **26-05-2026 14:37**, closing day **26-08-2026** — today — showing **no Extend button**.

`scripts/probe-boundary-day.js` (read-only, dump `discovery/81-boundary-day.json`) ruled out the innocent explanation: the sidebar carries **no "Application Extended Remarks" row and no green banner**, and its expiry has not moved, so the record was **never extended**. Its neighbours behave exactly as the rule says — NA62000987 (closes 28-08) shows the button, NA62000961 (closed 24-08) does not — so status and eligibility are not the explanation either.

Two readings fit, and they point opposite ways:

**(a) The window closes one day early.** The last eligible day would be expiry + 3 months minus one. Against the requirement as written ("shows until 3 months after the expiry date") that is a defect, though a one-day one.

**(b) The boundary is the timestamp, not the date.** Expiry 26-05 **14:37** closes at 26-08 **14:37**, and the probe ran at **15:07** — thirty minutes late. Under this reading the build is correct and QA simply looked after closing time. It would, however, contradict **Q4** ("day only, ignore time"), which QA has applied to every date assertion in the set.

**Decisive test, free and read-only:** probe a record on its closing day BEFORE and AFTER its time of day. Button present then absent → the boundary is the timestamp. Absent both times → the window closes a day early. **NA62000987 closes 28-08-2026 at 09:19**; `scripts/probe-closing-soon.js` keeps that candidate list current (it walks all 289 Expired records and prints who reaches their closing day within N days, with the time of day to watch).

**EACH HALF OF THE WINDOW NOW CARRIES AN EXPECTED STATUS (26-08-2026, Charmain).** The window says whether the button is offered; the status says which side of expiry the record is on. Before expiry it must read Approved, after expiry it should read Expired, and the button shows across both. Full table in R9. Applies identically to applications created before the deploy, keyed on their existing expiry date — see TS17.

**"CANNOT SEPARATE THE TWO READINGS" NOW HAS A CASE — TS54 (26-08-2026).** The reason the data could not separate 90 days from 3 calendar months is that every fixture measured so far had the two answers landing on the same day or inside the same bracket. Nobody had built one where they DIVERGE, because until Q12 was answered QA could not choose an expiry date. TS54 builds two — one where 90 days falls EARLIER than 3 calendar months and one where it falls LATER — so the pair cannot both be satisfied by a coincidence. Until it runs, this rule and TS49 hold different answers to the same question, and that is a known state rather than an oversight.

**Note:** Boundary settled: 90 days, not calendar months. TS08 boundary cases assert day 90 accepted / day 91 refused; a build behaving as calendar months (92 days on the SRD example) is a defect.

PARTLY OBSERVED 25-08-2026: extension is genuinely still offered after expiry — three applications 56 days past their expiry show Extend enabled. The BOUNDARY remains unproven; nothing on staging sits beyond the window (0 of 15 Expired rows), so day 90 vs day 91 still needs the dev date-patch.

NOTE 26-08-2026: the requirement restatement says "3-month" again. That does **not** reopen Q3 — 90 days is BA-confirmed (24-08) and TS08 asserts day 90 accepted / day 91 refused. A build behaving as calendar months is still a defect. "3 months" is the shorthand everyone writes; 90 days is the number that gets tested.

The harness no longer counts days for the upper bound: `src/dates.js` owns `addCalendarMonths` (with month-end clamping) and `windowState`, and `extend-boundaries.spec.js` / `extend-visibility.spec.js` both import it. Anything that re-derives the boundary with a day count is a bug in the harness.

## R6 — Already extended → greyed, until Registered

*Source: FIGMA 9058-30492 + DEV GUIDE + QA RULING 26-08-2026 (C7 RESOLVED, Expired row corrected) + TOOLTIP MEASURED ON SCREEN 26-08-2026 night* · verified

A successful extension is the ONLY thing that produces a disabled Extend button. The control stays exactly where it was, greyed out, carrying the message "This application has already been extended. Each application can only be extended once." — so there is a visible record that the one extension was used.

**IT SURVIVES THE EXPIRY DATE PASSING, AND IT SURVIVES THE STATUS GOING EXPIRED.** Charmain, 26-08-2026, correcting QA on exactly this row: *"this should be greyed + once only msg"*. So an application that was extended once and has since expired again still shows the greyed button and its message — the once-only record does not decay.

**The one confirmed remover is Hardcopy & Acc Created = Registered.** R9 beats R6 there: the whole control goes, greyed record included, whether or not the application was ever extended. Registered is the end of the button's life.

**AND THE WINDOW IS NOT A REMOVER EITHER.** Past expiry + 3 calendar months, an already-extended application keeps its greyed button (Q27, confirmed by this correction). The window governs whether an extension is OFFERED; this application has already spent its one, so the window has nothing left to govern.

**WHICH STATUSES DO REMOVE IT — RULED 26-08-2026 (Charmain), closing the last open line:** *"should hide the button when application status is not approved or expired, or hardcopy doc is registered"*. So the status test is a **two-value whitelist**: Approved or Expired keeps the button, anything else (Pending, KIV, Rejected, Draft, Submitted) hides it. Her earlier "if updated to other status then only hide it" meant exactly this — Expired was never one of the removing statuses, it is one of the two keeping ones.

THE COMPLETE GATE, assembled (this is the canonical form):
- **greyed** (already extended) requires: status ∈ {Approved, Expired} AND Hardcopy & Acc Created ≠ Registered. The window is irrelevant — a spent extension has nothing left for the window to govern.
- **enabled** (never extended) requires all of that PLUS inside the window (expiry − 30 days … expiry + 3 calendar months), the registration-documents stage reached (REQ-001a), and a user who is not one of REQ-004's eighteen.
- **absent** otherwise.

As built (from the sidebar CSS shipped on every Registration Documents page): `.extend-btn:disabled` renders #9CB8BF text and border with `cursor: not-allowed; pointer-events: none`, and the message is a hover tooltip `.extend-tip` inside `span.extend-wrap` — a 286px white card below the button, `display: none` until `.extend-wrap:hover`. Figma 9058-30492 draws two more things with it: a green banner under the tabs, "The application expiration date has been extended by 30 days.", and a new sidebar row "Application Extended Remarks:" holding timestamp + remark.

NONE of that copy has been seen on the build yet — nothing on staging has been extended.

**THE POST-EXTENSION STATE, OBSERVED ON THE BUILD 26-08-2026** — read-only, `scripts/probe-extended-state.js`, dump `discovery/97-extended-state.json`. NA68001099, extended at 16:02 the same day.

| What | Observed |
| --- | --- |
| Listing status | **Approved** (unchanged by the extension — it was a pre-expiry extend) |
| Listing expiry | **2026-12-22 21:10** — moved from 22-11, so **+30 days with the time of day preserved** |
| Hardcopy & Acc Created | Pending UCD |
| Extend button | `present: true`, `inDom: true`, **`enabled: false`** → **GREYED** |
| Tooltip | **"This application has already been extended. Each application can only be extended once."** — word for word |
| Application Extended Remarks row | **present in the sidebar** |
| Green banner | **NOT present** |

**So C7 is now confirmed against the build, not just against Figma.** Every assertion about this page — TS03, TS07, E2E_TS4/TS6, Q13 — had until now been read off Figma 9058-30492 alone. The greyed rendering and the exact tooltip string are real. **R3 also gets a second piece of evidence**: +30 days from the original expiry, time of day preserved.

**The one delta, and it is NOT being called a defect.** Figma draws a green banner, *"The application expiration date has been extended by 30 days."*, and the page does not show one. But this page was opened **about three and a half hours after the extension**, and a confirmation banner is normally a one-shot flash rendered immediately after the action. Absence on a later page load is the expected behaviour of a flash message, not evidence it never appears. **Recorded as unresolved and assigned to the grand tour**, which reads the page in the seconds after its own extension and is the only run that can tell the two apart. Raising it now would be a defect against a page nobody watched at the right moment.

---

**THE TOOLTIP MEASURED ON THE SCREEN, NOT IN THE MARKUP — 26-08-2026, night.**

The row above ("Tooltip … word for word") came from the 12:08 probe, and that
probe read `textContent`. `.extend-tip` is `display:none` until
`.extend-wrap:hover`, so textContent returns the message whether or not anything
is on screen: the reading proved the build CARRIES Figma's words and said nothing
about whether a user ever sees them. Re-run with a real hover:

| What | Observed |
| --- | --- |
| Hover host | `span.extend-wrap` — the greyed `.extend-btn` is `pointer-events:none`, so it never enters the hover chain and `elementFromPoint` over it returns the wrap |
| Tooltip paints on hover | **YES** |
| Wording on screen | **"This application has already been extended. Each application can only be extended once."** — matches Figma 9058-30492 exactly |
| Where it draws | a 286px white card BELOW the button, right-aligned, overlaying the sidebar rows under it |
| Evidence | `discovery/97-extended-state-tooltip.png` + `discovery/97-extended-state.json` (`tooltip.rendered: true`, `matchesFigma: true`) |

**So R6 is verified on the screen and not only in the HTML — and there is no
defect here.** Recorded because the distinction is the whole point of the review
that produced it.

**THE EVIDENCE RULE THIS SETS (Charmain, 26-08-2026 night).** Any still whose
expected result is a **disabled / greyed Extend button** must show **the tooltip
painted**, in the same frame as the button. A greyed control photographed without
its reason is not evidence for R6 — it is indistinguishable from a build that
greys the button and explains nothing, which is precisely the defect this rule
exists to catch. Three things follow, all now enforced by the rig rather than
remembered:

1. the pointer goes on `span.extend-wrap` via `mouse.move` (`locator.hover()`
   cannot pass its hit-target check on a `pointer-events:none` child, and burns
   the whole actionTimeout finding that out);
2. the spotlight ring covers **button AND tooltip**, because the caption placer
   avoids the ring and nothing else — ring only the button and the bubble is free
   to land on the tooltip;
3. the `extend-state` trigger point **does not tick** when the tip did not paint
   through the hold, and the take goes red. At that line one of two things is
   true and both need a human: the build stopped painting it, or the rig missed
   the host.

An extend take now also films the greyed state its own extension PRODUCES
(`greyed-after`), which nothing filmed before this review — the key shot on those
takes is the OFFERED button, so "button then greys" was an unphotographed claim in
every one of them.

**27-08-2026 pm — THE BUILD CURRENTLY VIOLATES THIS RULE.** From the afternoon deploy an extended application renders no Extend control at all (present=false, inDom=false) inside the window as well as outside. The rule is NOT stale — Charmain re-affirmed it the same day ("no should turn grey the srd is wrong") — so this is a defect to raise, and the once-only tooltip witness has nothing to read until it is fixed. Use the sidebar's Application Extended Remarks row (hasExtendedRemarksRow) as the interim witness that a record is spent.

**AND ON TODAY'S BUILD THE MESSAGE HAS NOWHERE TO LIVE (27-08-2026 pm).** This rule is
stated in two halves — the control stays, greyed, *and* it carries
"This application has already been extended. Each application can only be extended
once." Both halves are currently unobservable: the control is absent, so the string
cannot be read off any screen. It follows that the once-only message matcher in
`src/expectedState.js` is **unverifiable against this build**, not merely unexercised,
and that the retest of the C7/R6 defect has to check both halves — the button returning
is necessary and not sufficient. Measured on NA68001086 (already extended, patched to
expires-today, in window): `present=false inDom=false message=""`.

**Note:** THE 26-08 RULING SETTLED HALF OF Q27. "Greyed forever" was always too strong: Registered removes it. What the ruling does not mention is the 3-month window, so Q27 survives, narrowed to exactly that — an application extended once and then left until the window passes. TS07 and E2E_TS6 still assert the greyed button outlives the window and still ride on that one line from the BA.

## R7 — Never extended, past the window → no button

*Source: SRD 11982 v1.0 REQ-003 + DEV GUIDE*

Beyond 3 months after expiry, an application that was never extended shows no Extend button at all.

**REQ-003 (26-08-2026)** is now the formal source for the upper bound: *"The system shall stop displaying the Extend button once the 3-month window after the expiry date has passed"*, with Example 3 — more than 3 months after expiry, button not displayed. 11868 v1.4 item 8 says the same. This is the half of the window nobody disputes.

**Note:** RESTATED 26-08-2026 (item 2): "the Extend button is no longer displayed once the 3-month extension window has passed." Same rule as written, now requirement-backed rather than dev-guide-only. TS06 and E2E_TS3 already assert it and both stay blocked on the dev date-patch — the 25-08 census found 0 of 15 Expired rows beyond the window, so there is still no natural fixture. **But the restatement is unqualified where this rule is not — see Q27.**

## R8 — No emails

*Source: SRD 11982 v1.0 REQ-009 + DEV GUIDE* · verified

Extend triggers no email, before or after expiry. Nothing in it changes when a reminder is sent.

**REQ-009 (26-08-2026)**: *"The system shall not send any automated email when an extension is performed"*, acceptance criterion — no email to the potential UCD OR the BackOffice user. Note the second half: TS19 should watch both mailboxes, not just the dealer's.

**A NARROWER CLAIM THAN IT LOOKS, 26-08-2026.** REQ-009 and this rule are about the MOMENT of the click: no email is sent when an extension is performed, to the dealer or to the BackOffice user. The parent's v1.4 §2.2.4 item 8 adds what happens afterwards — *"the reminder cycle resets whenever the application is extended or reactivated"* — so the 2-month and 1-month reminders are supposed to re-arm against the NEW expiry date. Both can be true at once, and QA should not read "no emails" as "the extension changes nothing about email". See Q34.

**Note:** SRD item 4: no automated email is triggered by the extension action.

## R9 — Status must be Approved or Expired, and Hardcopy Doc not Registered

> **Flow-relevant.**

*Source: SRD 11982 v1.0 REQ-001 + REQ-002 + REQ-003 + REQ-007 + QA RULING 26-08-2026 + TESTED* · verified

ACCEPTED RULE (Charmain, 24-08-2026): the Extend button is visible when Application Status = Approved AND Hardcopy & Acc Created ≠ Registered; once Hardcopy & Acc Created = Registered it is hidden entirely. The listing column "Hardcopy & Acc Created" (UCD Application Listing) is the reference for the Registered check. Observed on staging 23-08-2026: present at Hardcopy Doc = Pending Assignee, absent at Registered, same application and user.

HIDDEN MEANS HIDDEN (Charmain, 26-08-2026). Where the button is not offered it is not rendered at all — never a greyed button standing in for "you may not". The greyed rendering means one thing only: this application has already been extended (R6). See R11.

The build agrees, and does it server-side: the Registration Documents page of a Registered application carries no `#extend-application-btn` and no `span.extend-wrap` in its HTML at all (discovery/35-registration-fee-paid.html), rather than hiding a rendered node with CSS.

WHAT IS *NOT* PART OF THE GATE (26-08-2026): the assignee (R13/TS41) and the listing's other four status columns — Assignee / UCD, Approver / Assignee, Softcopy Docs, Registration Fee — plus LHDN Response Status (TS42). Softcopy was already known irrelevant; the rest are now swept rather than assumed.

**THE RECORDED RULE GAP IS CLOSED, 26-08-2026 — by the document, not by a test.** The 25-08 post-expiry census found the accepted wording too narrow: staging offers the button on applications that are EXPIRED (inside the window) and refuses it on Approved-looking rows that never submitted registration documents. Both extra terms are now written down:

• **REQ-001(a)** — the condition is not "status is Approved", it is *"the potential UCD is allowed to submit registration documents (Softcopy and Hardcopy) after Application Status = Approved"*. An application with no Registration Documents page has never reached that state, which is exactly what NA64001043 showed.
• **REQ-003** — the window runs from 30 days before expiry until 3 months after, so an Expired record inside the window is squarely inside the requirement, not an anomaly.
• **REQ-002** — Registered removes it. Unchanged.

So the full test is: *(reached the registration-documents stage) AND (Hardcopy & Acc Created ≠ Registered) AND (inside the display window) AND (not already extended) AND (the user is not one of REQ-004's eighteen)*. QA inferred four of those five from the build before reading them.

**THE WINDOW IS PART OF THE GATE (26-08-2026).** R9 has been read as a status rule — Approved and not Registered — and that is now incomplete. The full display test is *(reached the registration-documents stage) AND (Hardcopy & Acc Created ≠ Registered) AND (**inside expiry − 30 days … expiry + 90 days**) AND (not already extended) AND (the user is not one of REQ-004's eighteen)*. An Approved application 60 days from expiry satisfies every clause QA used to check and still must show **no button**.



**PRECEDENCE, WIDENED 26-08-2026 (C7 ruling).** R9 beating R6 was recorded for Registered only. It now covers the status too: any move off Application Status = Approved hides the control, including on an application that has already been extended and is showing the greyed once-only rendering. Charmain: *"if updated to other status then only hide it, like application status expired or Hardcopy Doc = registered"* — the two are one rule, not two.

**THE STATUS PAIRED TO EACH HALF OF THE WINDOW — RULED 26-08-2026 (Charmain).** *"for existing trx should check according to the existing expiry date, if it is 30days before expiry, should check the applicatin status, need to be approved, then should show the extend button. if is within [3] months after the expiry date, the application status will be expired, then should show the extend button. same apply to new transaction as well"*

| Where the record sits | Application Status should read | Extend button |
| --- | --- | --- |
| More than 30 days before expiry | Approved | **none** (C8: the build shows one) |
| expiry − 30 days … expiry | **Approved** | shown, enabled |
| expiry … expiry + 3 calendar months | **Expired** | shown, enabled |
| More than 3 months after expiry | Expired | none |
| Hardcopy & Acc Created = Registered | unchanged (R12) | none, at any point |
| Already extended, still Approved | Approved | greyed + once-only message (R6) |
| Already extended, then Expired | Expired | **greyed + once-only message** (R6) |

**Why this changed the rule's title.** R9 was recorded as "Approved + not Registered → visible", and that is only the first half of the window. Inside the second half the status reads **Expired** and the button must still show — that is the post-expiry extension path (REQ-007/R16), not an anomaly. Reading R9 as a status gate is what made the 25-08 census look like it had found a contradiction.

**It applies to pre-deploy records unchanged, keyed off their EXISTING expiry date.** No special case, no separate rule, no grandfathering — "same apply to new transaction as well". That is what TS17 asserts, and it is the half of Q7 that had never been written down as a rule.

**A new and cheap assertion falls out of it.** A **non-Registered** record past its expiry that still reads Approved means the auto-expire job has not run on it — worth flagging when seen, because the button shows either way and the status is the only thing that reveals it. Registered records past expiry correctly stay Approved (R12), so the Registered check comes first or this produces false findings on all 65 of them.

**Note:** CONFIRMED BY SRD v1.3 §2.2.5 items 1–2, near-verbatim: the button is displayed regardless of Softcopy Docs / Hardcopy & Acc Created status EXCEPT when Hardcopy & Acc Created = Registered. Charmain's 24-08 simplified rule, the staging observation and the SRD all agree. Sits alongside R6 and R7 as a third reason the button can be missing — the only one that is not time-based.

REFINED BY OBSERVATION 25-08-2026: the accepted wording ("visible when Application Status = Approved AND Hardcopy ≠ Registered") is too NARROW. Extend also renders, enabled, on applications whose status is EXPIRED, provided they are inside the 90-day window and have a registration-documents page — seen on NA66001063/64/65 at 56 days past expiry. That is consistent with R4/R5 (post-expiry extension is the point of the window), so it is a gap in how the rule was written down, not a defect.

The gate as actually observed: (Application Status = Approved OR Expired-inside-the-window) AND Hardcopy & Acc Created ≠ Registered AND the application has a registration-documents page. That last clause is observational — every row without one (Hardcopy = "-") showed no button, but the button also lives ON that page, so the two cannot be separated from the outside.

RE-SOURCED 26-08-2026 to 11982 v1.0 REQ-001/002 (11868 v1.4 items 1–2 say the same). The old note pointed at "SRD v1.3 §2.2.5 items 1–2" — same words, now with a requirement ID.

## R10 — Concurrent Extend — one wins, one is refused

*Source: SRD 11982 v1.0 REQ-011 + DEV GUIDE + CHARMAIN 26-08-2026 (Q28 — the check keys on eligibility)*

If two users (or two tabs) click Extend on the same application at the same time, one click succeeds and the other fails. The failed click shows exactly:

"Action could not be completed because some details have changed. Please refresh and try again."

The application is extended **once, not twice**. The losing user's remark is discarded outright, not queued (Q17).

**REQ-011 (26-08-2026)** is the formal home of this rule — the 26-08 restatement QA worked from this morning was a preview of it. The message string is quoted in the requirement itself and in 11868 v1.4 item 11, identically: *"Action could not be completed because some details have changed. Please refresh and try again."* A mismatch is a straight defect. What REQ-011 still does NOT say is what the version check keys on — which is the whole of TS38.2 and Q28.

**WHAT THE VERSION CHECK KEYS ON — ANSWERED 26-08-2026 (Charmain, Q28).** This was the one thing REQ-011 did not say, and it is the whole of TS38.2.

The refusal is **not** "the row changed". It is **"the change made the application ineligible"**. A mid-flight change that leaves the Extend button still showing must let the extension through, **with no error message**.

**THE TEST IS ONE QUESTION: after the change, would the Extend button still show?**

| Changed while the popup was open | Button still show? | On Confirm |
| --- | --- | --- |
| Hardcopy & Acc Created → **Registered** | no | **BLOCK** + the refresh message |
| Application Status → outside {Approved, Expired} | no | **BLOCK** + the refresh message |
| Someone else **extended it first** | no (greyed) | **BLOCK** + the refresh message |
| The **window closed** (date rolled over) | no | **BLOCK** + the refresh message |
| **Assignee** changed | yes | **ALLOW** — extend succeeds, **no error message** |
| Approver / Softcopy Docs / Registration Fee changed | yes | **ALLOW**, no error |
| LHDN Response Status changed | yes | **ALLOW**, no error |
| Special Remarks edited | yes | **ALLOW**, no error |

The blocking message is R10's, verbatim: *"Action could not be completed because some details have changed. Please refresh and try again."*

**So R10 and R13 never disagreed.** R13 (assignment does not gate the button) governs the harmless row; R10 governs the eligibility-breaking row. The apparent contradiction came from R10 being recorded as a blanket "details have changed" rule, which is how its own message reads. **The message wording is broader than the behaviour** — worth remembering when reading it back.

**And it settles the Extend-vs-Extend clash as a special case rather than the only case:** the loser is refused because the winner spent the one extension, which breaks eligibility. Same rule, not a separate one.

**Note:** WRITTEN DOWN 26-08-2026, and it is a genuine gap being filled — R1-R9 had no concurrency rule at all. The behaviour was never missing from the test set (TS14, TS25, TS28, TS29, TS30.1-.2, E2E_TS5 all cover it, and the exact string is already asserted in `automation/tests/extend-concurrency.spec.js`), but it lived only in scenarios and in Q17 rather than in the rules.

PROVENANCE CHANGE that matters: the message string used to be **dev-guide-only**, which is why Q17 said "if the build's string differs, judge intent before raising". It is now a stated requirement, so **a string mismatch is a straight defect** — no judgement call.

PRIORITY: the requirement marks concurrency **lower priority**. If the 5 man-days get tight, TS25 / TS29 / TS30 go behind the arithmetic and gating cases. TS14 stays — it is the once-only rule under load, and R1 is the heart of the feature.

## R11 — Three states, and absence is the default

*Source: QA RULING 26-08-2026 (Charmain) — C7 RESOLVED; rendering 2 corrected the same evening*

The Extend control has exactly three renderings, and nothing else is legal:

1. **Enabled** — the application is eligible (reached the registration-documents stage, not Registered, inside the window) **and has never been extended**. The status may be Approved (before expiry) or Expired (inside the after-window) — both are legal here (R9).
2. **Greyed, with the once-only message** — the extension has already been spent (R6). This rendering **persists through the expiry date passing, through the status going Expired, and through the end of the 3-month window.** The only confirmed thing that removes it is Hardcopy & Acc Created = Registered.
3. **Not there at all** — **Application Status is neither Approved nor Expired** (Pending, KIV, Rejected, Draft, Submitted); OR Hardcopy & Acc Created = Registered; OR never extended and outside the window; OR never reached the registration-documents stage; OR the dealer-side view.

**THE STATUS TEST IS A TWO-VALUE WHITELIST (Charmain, 26-08-2026):** *"should hide the button when application status is not approved or expired, or hardcopy doc is registered"*. Approved or Expired keeps it; everything else hides it. Note this is the rule TS02 already passed against — it swept all eight statuses the listing filter offers and excluded Expired by design.

So a greyed button is never a way of saying "not allowed". **If QA sees a disabled Extend on an application that was never extended, that is a defect however sensible it looks — and if QA sees no button on an application that WAS extended and is not Registered, that is a defect too.**

**BOTH HALVES OF THAT ASSERTION ARE LIVE AGAIN (corrected 26-08-2026, evening).** Earlier the same evening the second half was deleted, on a reading in which Expired removed the greyed button. Charmain corrected it — Expired keeps the greyed button — so absence on an extended, non-Registered record is a finding again, whatever the status or the date.

**RENDERING 2 IS CONFIRMED, NOT CONTESTED (C7 resolved).** The greyed rendering is correct; Figma and the build win and REQ-005's "stop displaying" is incomplete wording.

**A useful consequence on Expired records.** The rendering reports the extension history: an Expired application inside the window that was never extended shows an **enabled** button (the post-expiry extension path, REQ-007/R16), and one that was already extended shows a **greyed** one. Same status, and the difference is the spent extension — so on an Expired record the button distinguishes the two without opening anything else.

**Note:** Written because the disabled/hidden distinction was scattered across R6, R7 and R9 and had never been stated as one rule. It is also what the harness now asserts: `extendState()` reports `visible` and `enabled` separately, and the visibility suites check the pair, not just presence.

## R12 — Registered ends the expiry lifecycle — nothing changes afterwards

> **Flow-relevant.**

*Source: QA RULING 26-08-2026 (Charmain) + STAGING EVIDENCE 26-08-2026 (65-record census) + BA-CONFIRMED 26-08-2026 (Q29)* · verified

Once Hardcopy & Acc Created = Registered, the application is out of the expiry lifecycle. The expiry date passing changes nothing:

- Application Status does **not** become Expired — it stays as it was.
- The stored Application Expiry Date is left exactly as it is, still displayed, not blanked.
- There is no Extend control, greyed or otherwise (R9 / R11).
- No expiry reminder is sent for it.

This holds **whether or not the application was extended first**. An application that was extended once and then Registered still shows the extended date and the same status 30 days later and beyond — everything remains the same.

QA RULING (Charmain, 26-08-2026), and it is worth being honest about the standing: nothing says this on paper. SRD §2.2.5 covers the BUTTON at Registered and is silent on whether a Registered application can expire at all. So R12 is the expectation QA tests against, not a quoted requirement — **Q29** asks Yi Link to confirm it. If the build expires a Registered application, the first move is to raise it as a defect against R12, not to rewrite R12.

**EVIDENCED ON STAGING, 26-08-2026** (read-only, no fixture spent — `automation/scripts/probe-registered-expiry.js`, output in `automation/discovery/73-registered-expiry.json`):

- 65 Registered applications; 51 are past their Application Expiry Date.
- **4 survived it and still read Approved** — NA66001067, NA66001051, NA66001049, NA62000988 — between 57 and 59 days past, which is comfortably beyond the 30 days in the ruling.
- 47 are Expired. Every one of them has an expiry on or before **15-06-2026**; every survivor has an expiry on or after **28-06-2026**. The two sets do not interleave.
- Non-Registered applications have gone Expired as recently as 28-07-2026, so the job is running — the Registered ones are being passed over, not merely un-processed.

Read together that is a behaviour change bracketed between 15 and 28 June 2026, with the 47 left over from before it. R12 describes the build as it stands today.

THE SHAPE OF THE ASSERTION MATTERS. "No Registered application is Expired" is false on this data and always will be, because of the legacy rows. What TS21 asserts instead is that the two populations never interleave: the day a Registered application expires MORE RECENTLY than one that survived, legacy data has stopped explaining it and R12 is being broken by the build.

**BA-CONFIRMED 26-08-2026 (Q29).** Charmain checked with Yi Link: *"registered trx wont update to expired status."* So this rule is no longer QA ruling + build evidence — it is intended behaviour, confirmed by the BA and matching what staging does on a 65-record census. TS21 asserts it and passes.

**THE AUTO-EXPIRE JOB IS A DAILY MIDNIGHT CRON — Charmain, 26-08-2026:** *"the cronjob actually run daily at 12am, for example the transaction expiry date is 26 august 2026 5.00pm, then the next cronjob will be 27 august 2026 12am, should pickup the transaction and update the status to expired."*

So the status flip is **not** continuous and **not** at the expiry instant. It happens at the **first midnight AFTER the expiry date**. A record expiring 26-08 at 5:00pm stays **Approved** for the rest of 26-08 and becomes **Expired** at 27-08 00:00.

**A PREDICTABLE RULE FALLS OUT OF IT, which is what makes it testable:**
> Application Status = Expired **iff** now is at or past the midnight following the expiry date, AND Hardcopy & Acc Created is not Registered (R12).

**AND IT CLOSES A GAP NOBODY HAD NOTICED.** Between the expiry instant and the next midnight the record is past its expiry and still reads Approved. Under R9 that is fine — Approved and Expired BOTH keep the button — so there is no window in which an eligible application loses its button through a timing accident. Had the whitelist been Approved-only, this would have been a live defect for up to 24 hours per record.

**Consequence for TS08.4 / TS08.5** (expiry within the last hour / a few minutes ahead): the status will still read **Approved** on both, because no midnight has passed. Asserting Expired there would fail a correct build.

---

**THE CRON IS QA’S STATUS-SETTER — status = Expired IS MANUFACTURABLE (Charmain, 26-08-2026 night).**

> *"E2E_TS3 you can actually simulate with the support tool, make the expiry date today and wait until the next day cronjob run will pickup the trx and update to expired. same applies to all related ts."*

Q12’s answer split the date blockers three ways and left one standing: *"It cannot manufacture a status=Expired record; those still have to be found."* **That is now wrong, and it was wrong for a reason worth naming: the tool was measured on its own, and the tool is only half the machine.** The support tool owns the DATE. The cron owns the STATUS. QA controls the date, so QA controls the input the cron reads — the price is one night, not a dev sitting.

```
npm run set-expiry -- --app-no <no> --state expires-today   # the tool: DATE
   ... first midnight ...                                   # the cron: STATUS -> Expired
```

**TWO ROUTES, AND THE SECOND ONE ALWAYS WORKS.**

| Want | Route | Nights |
| --- | --- | --- |
| Expired, inside the window (TS05, TS47, E2E_TS2, TS16, E2E_TS7) | `--state expires-today`, wait one midnight | 1 |
| Expired, beyond the window (TS06, TS07, E2E_TS3, E2E_TS6) | **one-hop:** `--state after-window`, wait one midnight — works only if the job sweeps *every* past-expiry row, not just yesterday’s | 1 |
| Expired, beyond the window | **two-hop (guaranteed):** `--state expires-today`, wait one midnight for the flip, **then** patch the date back with `--state after-window` | 1 |
| Expired on an already-extended record (E2E_TS4, E2E_TS6) | extend first, then patch the *extended* expiry to today, wait one midnight | 1 |

**THE TWO-HOP WORKS BECAUSE OF THE VERY LIMIT THAT LOOKED LIKE THE BLOCKER.** The tool "does NOT reactivate an EXPIRED/REJECTED application; it only changes the date" — so once the cron has written Expired, moving the date underneath it **leaves the status alone**. Order matters and only one order works: **cron first, tool second.** Patching the date first and hoping the cron catches up depends on a scan predicate nobody has measured.

**DO NOT expect the reverse.** Patching an Expired record’s date into the FUTURE does not make it Approved again — nothing in the build reactivates on a date change, and per REQ-007 only an **extension** flips Expired → Approved. That flip is the thing under test (R16/TS47); it is not a fixture tool.

**THE ONE-HOP IS WORTH TRYING FIRST ANYWAY, because either outcome is a measurement** of the job’s scan predicate — does it sweep all past-expiry rows every night, or only the ones that crossed over yesterday? Nothing in the vault answers that, and one fixture answers it for free.

**CAUTION, one night wide.** While the fixture sits at `expires-today` it is in-window, Approved and never extended — so it renders an **enabled** Extend button to every unblocked account. Anything that sweeps the listing and clicks (the roles sweep) can spend it. Tag it and leave it out of any run that extends.

**Note:** Tested by TS21 (never extended) and E2E_TS10 (extended, then Registered, then the extended expiry passes). TS21 carries a CONTROL application deliberately: a non-Registered application with the same expiry must go Expired on the same job run, otherwise a green TS21 only proves the job did not run.

Still unproven by the census alone: that the auto-expire job RAN on a night when a surviving Registered application was past its expiry. Four survivors 57-59 days past is strong circumstantial evidence — the job would have had to miss them dozens of times — but the control application in TS21 is the half that proves it outright, and that half is manual.

## R13 — Assignment does not gate the button

*Source: QA expectation (Charmain 26-08) + SRD §2.2.5 silence + TESTED (TS41.1 and TS41.2, 26-08) + CHARMAIN 26-08-2026 (Q28 — holds mid-modal too)* · verified

Who an application is assigned to has no bearing on the Extend button. Reassigning it does not add, remove, grey or un-grey the control, and does not move the Application Status; the former assignee, the new assignee and a non-assignee BackOffice user all see the same thing. The button is a function of Application Status and Hardcopy & Acc Created only (R9).

SOURCE: QA expectation, stated by Charmain 26-08-2026 — "if any user change the assignee the extend button should remain as per the status". SRD §2.2.5 does not mention the assignee at all, which is the point: silence means the button must not care. Note this is about the BUTTON, not about who is PERMITTED to click it — that is Q6, still open.

**STRENGTHENED 26-08-2026, still by silence but a much narrower silence.** REQ-001 lists exactly two display conditions and neither is the assignee; REQ-004 defines the only user-level gate there is, and it is a list of account names, not a relationship to the record. Two documents now enumerate what gates the button and the assignee is in neither. TS41.2 still has to be run — a rule this well-founded is exactly the kind that quietly fails in the build.

**IT HOLDS MID-MODAL TOO — 26-08-2026 (Charmain, Q28).** R13 was recorded and tested for the button (TS41.1/.2, passing). The open question was whether it survived a reassignment that lands **while the Extend popup is open**: R10 could have been read as refusing any changed record.

It does survive. A mid-popup assignee change must let the extension **complete normally, with no error message** — because the button would still show after it. **TS38.2 asserts exactly that**, and a refresh message there is a defect rather than a curiosity.

**Note:** TESTED BOTH WAYS 26-08-2026. TS41.1 (cross-section, 8 assignees probed) shows the button tracks Hardcopy & Acc Created and not the person; TS41.2 performs the reassignment on NA68001101 and shows presence, enabled-state, the once-only message and the Application Status all unchanged — for the new assignee, the former assignee and a non-assignee approver — then restores the fixture. TS42 does the same for the other five status columns.

## R14 — The extension remark stays off the listing and out of the export

*Source: QA RULING 26-08-2026 (Charmain) + SRD 11982 v1.0 REQ-008/REQ-010 + BUILD MEASURED*

The remark typed into the Extend pop-up is an internal note about one extension. It must not surface on either of the two places the whole team reads applications from:

1. **The UCD Application Listing** — specifically its **Remarks** column.
2. **The file the listing's Export produces** — specifically its **Remarks** column.

Charmain, 26-08-2026: *"extension remark should not show in the listing, also the exported csv file — all the ts should check these 2 places."*

What DOES belong on both surfaces is the extension's EFFECT: the new **Application Expiry Date**, and the Expired → Approved flip after a post-expiry extension (R4). So the sweep is two-sided every time — the date must change, the remark must not appear.

**MEASURED ON STAGING, 26-08-2026** (read-only, `scripts/probe-listing-export.js`, output in `automation/discovery/74-listing-export.json`) — the facts every scenario and every trigger point depends on:

- The listing **does** render a Remarks column and it is **already populated** — NA68001099 shows *"TIN verification failed. Kindly provide correct TIN information to eAuto customer service."* This is a live surface, not a theoretical one.
- Export is `#to-export`, an anchor behind a native `confirm("Sure to export?")`, which then GETs `{contextPath}admin/form/enquiry/export?<#search-form serialized>`.
- **It is an XLSX, not a CSV** — `OBS-<yyyyMMddHHmm>.xlsx`, `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`. Any step that says "open the csv" is wrong and will send a tester looking for a file that never arrives.
- **55 columns. Column 13 = Application Expiry Date. Column 23 = Remarks** — and column 23 held exactly the string the listing showed, character for character.
- The export carries **the same filters as the search**, so it exports precisely the rows the current filter returns — an export is only as narrow as the search that preceded it.
- **The Export link is HIDDEN when a search returns 0 records.** A sweep that filters down to a row that is not there finds no Export control and can easily be misread as "the feature is missing".

**ONE CHANNEL, TWO SURFACES.** The listing and the export read the same Remarks field, so this is not two independent risks — if the extension remark is written into that field it appears in both at once. That makes R14 and **TS24** (extension remark vs the page's own Remarks field) the same underlying question asked from two ends: TS24 asks whether they share a store, R14 asks what happens downstream if they do. Answer either and you have most of the other.

**THE SRD BACKS THIS UP, 26-08-2026.** REQ-008 places the saved remark in exactly one surface — "the right sidebar of the Application" — and REQ-010 says what the LISTING gets, which is the Application Expiry Date and nothing else. Two requirements, two surfaces, no overlap. So the listing/export sweep is no longer only a QA ruling: a remark appearing in the listing's Remarks column would contradict REQ-008 and REQ-010 read together.

---

**HOW R14 HAS TO BE FILMED — 27-08-2026.** The rule was being asserted correctly and
photographed badly, which for a sign-off is the same as not photographed.

| Surface | What the still must show |
| --- | --- |
| Listing | the **Application Expiry Date CELL and its column header**, ringed. Not the row: this listing has 22 columns in a `table-scroll-container`, and expiry is the 12th — a ring on the row leaves the value the caption quotes off the right edge of the frame. Ringing the cell is also what makes the container scroll to it |
| Listing | the **Remarks cell**, same way, for the half of R14 that is an absence |
| Export | the workbook **open in Excel, on the recorded display**, with **col 13 Application Expiry Date** selected so its value is in Excel's own formula bar |
| Export | a **second still** with **col 23 Remarks** selected. One point could only ever film one column, and the one it filmed was Remarks — so the expiry half of R14 had never been in a frame |

The export leg had two faults stacked, and both are the kind that look like success:
its still was cut at the TICK, which runs after the Excel window is closed and the
browser is back in front, so a caption about a workbook sat over a picture of the
listing; and `$xl.WindowState = xlMaximized` fills whichever monitor Excel already
occupied, on a machine that records DISPLAY1 while DISPLAY2 is larger. The window is
now MOVED to the recorded display and the point does not tick unless its measured
rect is on that display.

---

**THE BOUNDARY LIST IS EMPTY AS OF 27-08-2026 (evening).** Everything above about
which scenarios are exempt from this sweep is now history, kept because the reasoning
is worth reading and because the exemptions were correct under the premise they were
written to. Charmain reversed the premise: *"do the before after check for all ts even
without any action"*.

The old reasoning was that a take which changes nothing has nothing to sweep. That is
backwards. **A take that changes nothing is the only kind that can show the two
surfaces are STABLE** — and while the exemption stood, the rig was asserting that
looking at the Extend pop-up costs nothing without ever once reading the listing or the
workbook afterwards to check.

So R14 now has two halves, and which one applies is decided by whether the take
confirmed anything:

| | expiry | remark |
|---|---|---|
| **confirmed** | MOVED on both surfaces | absent from both |
| **not confirmed** | UNCHANGED on both surfaces | unchanged on both |

Both directions are asserted and both can fail. The recorder used to caption the
expiry and assert only the remark, so a take could film an expiry that had not moved
under a caption saying it had, and still tick every point.

**And the export gained a BEFORE.** It had an AFTER leg and no BEFORE one, so its
baseline was the LISTING's before-values — a different surface. A surface read once can
say what it currently holds; it cannot say it did not move. `export-before`.

---

**ONE EXPORT, ONE WINDOW, BOTH COLUMNS (27-08-2026, evening).** This rule's two
halves are read off the workbook in a **single** Excel window now, not two.

Both rulings on this were right; the premise moved between them. One frame could not
hold column 13 and column 23 **of the sheet as exported** — they are ten apart in 55
columns. It holds them easily **of the sheet as shown**, once every column nobody is
testing is hidden and the application number sits between them.

What the merge is NOT allowed to become:

- The two trigger points stay two, ticked off the **same** still. Merged into one, a
  take that framed only one column would score full marks.
- Framing is **measured**: the workbook driver reports each column's presence from
  the window's own visible range, and a column out of shot fails **its own** point.
  Without that this is one caption asserting two values with one off-camera — the
  exact fault the split was made to fix.
- Hiding columns is a view change on a read-only workbook, never saved, with the
  SHA-256 printed either side. **The caption says so**, because a reviewer looking at
  a five-column sheet has to know why it is five columns.

The BEFORE workbook reads both columns too, so the remark half is now
workbook-to-workbook. It used to be listing-to-workbook — two different surfaces
compared and reported as one being unchanged.

**Note:** Not yet testable end to end: nothing has been extended, so no extension remark exists to look for. What exists is a BASELINE of both surfaces taken before the first extension (discovery/74-listing-export.json) — re-run the probe straight after the first extension and diff. Any new text matching the remark, in either surface, is the defect.

A green sweep is only meaningful against that baseline: "the remark is not in the Remarks column" proves nothing if nobody recorded that the column already had other text in it.

## R15 — Eighteen named BackOffice accounts cannot extend

*Source: SRD 11982 v1.0 REQ-004 + SRD 11868 v1.4 §2.2.5 item 9* · verified

Every BackOffice user may view and click Extend **except eighteen named accounts**, which are listed identically in both documents that landed today:

`eautohamal` · `eautojenilyn` · `eautojrjaya` · `eautonashwa` · `eautoshamini` · `eautovegas` · `eautoxiayuan` · `kokping` · `tempstaff` · `wahidahzaki` · `mfnabila` · `mfnadhirah` · `mfzuhaira` · `eautochinwei` · `mfaliah` · `mfmaisarah` · `mfnicholas` · `mfteckyung`

The acceptance criterion is two-sided: *"The listed BackOffice user accounts cannot view or click the Extend button. All other BackOffice users can view and click it."* So this is not a permission that merely refuses the action — for those accounts the button must be **absent**, which is consistent with R11 (ineligibility is expressed by absence, never by a disabled button).

**It is a list of usernames, not a role.** Nothing in either document ties the exclusion to CSE / Ops / Hub Admin / Finance, and Assumption 2 says the list is *maintained by the Ops team* — so it is data someone edits, not behaviour derived from the record. That has two consequences QA must not smooth over: the list can change without a code change, and a role that "should" be able to extend proves nothing about a colleague in the same role.

**Five of the eighteen are accounts this harness already logs in as** — `eautochinwei`, `eautohamal`, `eautojrjaya`, `eautoxiayuan`, `kokping`, all CSE. Thirteen stored accounts are not on the list, including every Ops account and the sixth CSE account `eautomie`. That makes TS15 runnable read-only today, with both halves of the criterion evidenced from the credential store as it stands.

Untested and unstated: whether the exclusion is enforced anywhere but the rendering. An excluded user who POSTs `admin/form/extend` directly is Q32, and it rides TS26.

**VERIFIED AGAINST THE BUILD 26-08-2026**, hours after the requirement was written. Five blocked accounts get no button in the markup; twelve unlisted accounts get one, enabled. `eautomie` settles the mechanism: CSE and unlisted, it sees the button, so the check is on the username rather than on the role group. See TS15 for the table and the uncovered names.

**REQ-004 COVERAGE POSITION, FIXED 26-08-2026 (Charmain: "can deprio those acc that not showing in staging").**

| | Count | Status |
| --- | --- | --- |
| Blocked accounts on uat4, logins held | **12** | to be evidenced — every one that exists here |
| Blocked accounts not on this instance | **6** | **DEPRIORITISED — out of scope for staging** |
| Unlisted accounts proved to SEE the button | **12** | the positive control |

The six: `tempstaff`, `mfnabila`, `mfnadhirah`, `mfaliah`, `mfmaisarah`, `mfteckyung`. They are production-only (BA-confirmed), so there is no account to log in as on uat4 at any price.

**WHY THE DEPRIORITISATION MATTERS TO THE SIGN-OFF, not just to the backlog.** Until now every run printed those names as NOT COVERED, which is honest but reads to anyone else as testing still owed. Recording them as a **stated scope boundary with a reason** turns the same fact from a gap into a decision. **12 of 18 with six explained is complete for this environment; 12 of 18 with six unexplained is not.**

**What it does NOT claim.** The gate is by username (proved — `eautomie` is Admin, unlisted, and sees the button), so the twelve prove the MECHANISM works and the six will behave the same way when the same build reaches production. That inference is only safe if the list ships with the build rather than being per-environment config — which is exactly the question sent to Xiwei. If it turns out to be config, the six are not merely untested here, they are unverifiable anywhere from staging, and reading the list becomes the only real coverage.

**Note:** ANSWERS Q6, which had been open with the BA since 24-08 asking for a ROLE matrix. The answer came back as an account list, so the question QA asked was the wrong shape — worth remembering the next time a permission question is drafted. Role-level access is still unstated, but the ROLEPERM groups that cannot reach the module at all (Hub Admin, Admin, Probation, Finance) make it mostly moot.

## R16 — Extending an expired application puts it back to Approved — on both surfaces

*Source: SRD*

SRD 11982 v1.0 **REQ-007**: *"The system shall set the application status to Approved once the application is extended"*, acceptance criterion *"Application status = Approved after the extension is completed."*

Charmain, 26-08-2026: *"after the trx expired the application status will update to expired; if extend after that, should change the status back to approved — include this checking in both listing and details page."*

So the rule has three parts, and the third is the one that was not being checked:
1. An application whose expiry passes goes to **Expired** (the auto-expire job — except Registered, R12).
2. Extending it inside the 90-day window puts it back to **Approved** (R4).
3. **Both surfaces must say so**: the Application Status column on the UCD Application Listing, AND the Application Status in the right sidebar of the application detail page. Plus the listing FILTER — filtering to Approved must find it and filtering to Expired must not, because a filter reads from the query and not from the column, so a correct-looking column can still sit behind a stale index.

A pre-expiry extension is the control: the status was Approved and must stay Approved, untouched, on both surfaces.

**Note:** Why this is its own rule and not a line inside R4: REQ-007 had **no scenario of its own** before 26-08 — the flip rode along inside TS05, TS16, TS34, E2E_TS2 and E2E_TS7, all of which assert the listing and none of which asserted the detail sidebar. TS47 now owns it, the sweep below states it on every case that extends after expiry, and `extend-arithmetic.spec.js` asserts both surfaces in TS04 (untouched) and TS05 (flipped).

Not yet verified against the build: every after-expiry write case is still Not run. Staging holds 65 Expired applications inside the window, 40 of them able to host the button, so the fixture is there — this waits on a run, not on an answer.

## R17 — Three BackOffice roles — Admin and HubAdmin reach the module, Probation does not

> **Flow-relevant.**

*Source: TESTED* · verified

**THE ROLE MODEL, MEASURED 26-08-2026** (read-only, `automation/scripts/probe-bo-role-map.js`, dump `automation/discovery/78-q6-role-map.json`):

This build has **three** BackOffice roles and no more. The user-account listing's `userRole` filter and the edit screen's `role` radios both offer **Admin · HubAdmin · Probation**. There is no SuperAdmin / "supermin" control on either screen. Staging population: HubAdmin **126**, Admin **69**, Probation **47**.

"CSE", "Ops" and "Finance" are QA's own labels for whose login it is — the system does not know them. That retires the ROLEPERM no-access matrix as an explanation for anything here: `eautoaccount` ("Finance") and `bochar` ("Hub Admin") seeing an enabled button is simply **two HubAdmins seeing it**.

| System role | REQ-004 blocked → | Unlisted → |
| --- | --- | --- |
| **Admin** | eautochinwei, eautohamal, eautoxiayuan — **no button** | eautomie — **enabled** |
| **HubAdmin** | eautojrjaya, kokping — **no button** | jasons, kmcheah, mfared, nikmuhamad, eautosoyeng, eautokelvin, eautonurul, eautozara, mfizni, eautoaccount, bochar — **enabled** |
| **Probation** | no stored login | no stored login |

**Both roles land on both sides of REQ-004.** That is a stronger proof than `eautomie` alone that the build keys on the USERNAME: same role, opposite outcomes.

**PROBATION — MEASURED 26-08-2026** (`automation/scripts/probe-bo-roles.js --write --roles Probation`, dump `automation/discovery/79-q6-probation.json`). Charmain's gate was "check whether probation can see the module in BO; if yes then they can access also". **It cannot.**

BOChar was switched HubAdmin → Probation, probed, and restored (restore verified on both the edit screen and the listing row; `isOnboardingAssignee` read before and after and unchanged at `true`).

| Check | Probation |
| --- | --- |
| Onboarding group in the menu | **absent** |
| UCD Application Listing item | **absent** |
| Application opened | no — the listing is unreachable |
| Extend | never renders |

So Probation is the one genuine **role** gate in this feature, and the answer to her conditional is NO.

**One line in that dump is NOT evidence and is labelled as such:** the direct hit on `/obs/admin/enquiry` returned HTTP 403 — but so did the HubAdmin control run immediately after the restore. `/obs` is a separate application that needs the menu-click session handoff (`src/obs.js`), so it refuses direct entry for every role. The menu absence is the finding; the 403 is not.

**"SUPERADMIN" IS `jasons` — answered 26-08-2026 (Charmain), and it needs no test of its own.** It is not a fourth role. The BackOffice user screens offer three (Admin, HubAdmin, Probation) and `jasons` holds **HubAdmin**; "superadmin"/"supermin" is the team's name for that account, not a role the system can be set to.

So it was already covered before the question was asked: `jasons` is in the TS15 sweep and came back **present and enabled** on 26-08. Every group in her original ruling is now accounted for — Hub Admin ✔, Admin ✔, superadmin = jasons ✔, "some Ops" ✔ (the Ops-looking names on REQ-004's list are blocked by username), Probation ✘ (cannot reach the module at all).

**THE ROLE GATE IS TESTED AT THE BUTTON, NOT AT THE ENDPOINT — TS53 (26-08-2026).** TS48 proves Probation cannot reach the module in the UI, and explicitly refuses to read a direct-URL refusal as evidence. That leaves the role gate untested past the button, while the USERNAME gate (R15) has TS45. TS53 asks TS45's question of a role instead of a name, with a HubAdmin control on the same request shape, and completes the 2x2 of button/endpoint against username/role. Run it inside TS48's role-switch window — same `EV_ALLOW_ROLE_SWITCH=1`, same shared account, one restore to verify instead of two.

**Note:** Recorded 26-08-2026 from the Q6 run. Sits ALONGSIDE R15, which is the account-level gate — this one is the role-level gate, and they are independent: a blocked username gets no button even as an Admin, and a Probation user never gets as far as the page no matter whose name it is.

Two things to re-read before trusting it: role membership is data (any Ops edit moves an account between rows of that table), and the Probation take needed a switch-and-restore on a shared account, so it is one measurement rather than a standing fixture. Re-run `scripts/probe-bo-role-map.js` (read-only) whenever the account set changes.

The role gate is now asserted by a test rather than by a script: TS48 in `tests/extend-roles.spec.js`, sharing `src/boRoles.js` with `scripts/probe-bo-roles.js`. Passing as of 26-08-2026. The rule is still DATA in one respect — role membership changes whenever Ops edits an account — so re-run `npm run probe:rolemap` (read-only) when the account set moves, and re-run TS48 when the build changes.

## R18 — Every change to an application is written to the UCD Application Audit Log

*Source: CHARMAIN 26-08-2026 + MEASURED on staging (scripts/probe-audit-log.js)* · verified

Charmain, 26-08-2026: *"any changes should show in this audit log, https://staging.eauto.my/obs/admin/audit-log/enquiry."* Measured the same evening, read-only, as ops_jasons.

**The surface.** Menu > Onboarding > **UCD Application Audit Log** (title *"UCD Application Audit Log - Onboarding"*). Columns: **# | Date | Company Name | Action | By | Description**. A sibling screen, **UCD Pre-Application Audit Log**, is the same shape one step earlier in the lifecycle (`PRE_OBS_AUDIT_LOG_LISTING`).

**Getting in — the 403 that is not a permission problem.** A direct GET of `/obs/admin/audit-log/enquiry` returns **403 with an empty body** for every account tested, ops_jasons included. /obs pages need the session handoff. The menu item is `<li class="obs-auth-required" data-type="OBS_AUDIT_LOG_LISTING">` and its click goes to `/uat4/api/admin/onboarding/auth-redirect.do?type=OBS_AUDIT_LOG_LISTING`, which lands on the page with **200**. Do not raise "no permission" without going through that door.

**Searching it.** `#logDateFrom` and `#logDateTo` (readonly jQuery datepickers, `dd/mm/yy`) are **both mandatory** — `#to-search` alerts *"Please input Log Date (From) and Log Date (To)"* and returns false. The other filters are `#companyRoc`, `#businessTrading`, `#companyName`. **There is no application-number filter**, so company name is the practical key — and every fixture this rig builds now carries **CHARMAIN**, so one search returns all of them.

**The endpoint, for anyone asserting rather than looking:** `GET /obs/admin/audit-log/enquiry/search?pageNo=1&logDateFrom=&logDateTo=&companyRoc=&businessTrading=&companyName=` returns JSON — `records[]` of `id, applicationUuid, logDate, companyName, companyRoc, businessTrading, activity, activityDisplayName, createdBy, description`, plus a total.

**The activity vocabulary, as measured (9 values in one week):** `EXTEND`, `EXPORT`, `CHANGE_ASSIGNEE`, `VERIFY_REGISTRATION_DOC`, `APPROVE`, `SUBMIT_FOR_APPROVAL`, `UPDATE`, `VERIFY_HARDCOPY_DOC`, `CREATE_ACCOUNT_IN_EAUTO`. So "any changes" is literal — the log is not extension-specific, and **an extension is one activity among many**.

**THE EXTENSION, AS THE LOG WROTE IT.** Action **Extend**, 26-08-2026 04:02 PM, by **99000/jasons**: `[Extend] old: - new: Yes [Application Expiry Date] old: 22-11-2026 9:10pm new: 22-12-2026 9:10pm [Application Extension Date] old: - new: 26-08-2026 4:02pm [Extended By] old: - new: 99000/jasons [Remarks] old: - new: zzz`

Who, when, **old → new expiry**, extension date, extended-by, **and the remark** — one row carries every field TS13 was ever written to look for.

**THE REQUIREMENT, stated by the team on 26-08-2026 (the "latest req", with a screenshot of this very row):**

> *"Kindly take note on UCD Application Audit Log for [Extend] feature: if Assignee / any BO user clicked [Extend], System should display:*
> `[Extend]`
> `old: -`
> `new: Yes`*"*

So the block is no longer only an observation — it is a **named acceptance criterion, and the assertion is verbatim**: Description must open with `[Extend] old: - new: Yes`. The build already does exactly that (measured the same evening, independently, before the notice arrived — the probe and the requirement agree character for character). Two things follow:
- **"Assignee / ANY BO user"** matches REQ-004's model — the gate is the eighteen blocked names, not a role. It also means the **By** column must name *whoever clicked*, which is the attribution TS29 and TS39 already care about.
- A missing or differently-worded `[Extend]` block is now a **defect**, not a note. `old: -` matters as much as `new: Yes`: it says the application had never been extended before, which is R1 (once only) written into the audit trail.

The screen also carries a **"N record(s) in total"** counter above the table (17 in the team's filtered view, 53 in the probe's 20–26 Aug range) — the number to quote in evidence.

**Two consequences worth writing down.** (1) **The remark has a THIRD surface.** R14 keeps it off the listing and the export; the audit log carries it in plain text in Description. That is presumably by design — an audit trail that hid the remark would be useless — but "the remark is internal" is now a claim with a documented exception. (2) **QA's own reads are audited.** Four `Export` rows by 99000/BOChar at 14:21–14:38 are the R14 export probe. Read-only automation still leaves footprints in a log the team reads.

**The trap that nearly put a false finding in this vault:** the rows are painted after networkidle. Read the table too early and the page says *"No records found matching your search criteria"* while the network has already returned **53 records**. Wait for rows, or read the endpoint.

**THE ROW, READ FROM THE RAW JSON (correcting a truncated first reading).** The Description is **newline-separated blocks**, not one line, and there are **six** of them:

```
[Extend]
old: -
new: Yes

[Application Expiry Date]
old: 22-11-2026 9:10pm
new: 22-12-2026 9:10pm

[Application Extension Date]
old: -
new: 26-08-2026 4:02pm

[Extended By]
old: -
new: 99000/jasons

[Remarks]
old: -
new: zzzzzzzzz

[Application Status]
old: Approved
new: Approved
```

Two corrections and one new fact:
- The remark is **zzzzzzzzz**, not "zzz" — the console line was cut at 220 characters. Recorded because a remark assertion that compares against a truncation passes for the wrong reason.
- **[Application Status] old → new is in the row.** On this PRE-expiry extension it reads Approved → Approved (correctly unchanged). On a POST-expiry extension it must read **Expired → Approved** — so the audit log is a **fourth surface for REQ-007 / R16**, after the listing column, the detail sidebar and the status filter. **TS47 owns that check; TS13 asserts the block exists.**
- The JSON envelope is `records[]` plus `totalRecords`, `totalPages`, `maxRecordsPerPage`, `currentPageNo`, `errorMsg` — `totalRecords` is the "N record(s) in total" the screen prints.

**JOINING A LOG ROW TO ONE APPLICATION — `applicationUuid`, not the name.** There is no application-number filter, and company-name search is the wrong key for a proof: it returns every row for a company, and fixture names repeat their stamp. Every record in the JSON carries **`applicationUuid`, which is exactly the uuid in the application page's own URL** (`/obs/admin/form/edit-registration-doc/<uuid>`). That turns "the log holds an Extend row" into "**this** transaction was extended" — an identity match. Measured 26-08-2026 (night): 70 records in the 14-day window, **1** with `activity=EXTEND`, `applicationUuid=559565f5-bf36-447b-b9f8-f6a1c8142bdd` = NA68001099. Wired as `automation/scripts/prove-extended-audit.js`, read-only, and it is how TS03's "already extended once" precondition stopped being an inference.

**A RENDERED-ROW COUNT OF 0 IS NOT AN EMPTY LOG — measured twice now.** `probe-audit-log.js --companyName 260824-2036-021` printed *"search -> 0 row(s)"* and *"(no rows painted within 15s)"*, while the **endpoint returned 6 records for that same string**. The probe counts `tbody tr`; trap 3 above is exactly this, and it caught QA a second time on the same screen. Anything asserting ABSENCE here — no Extend row, no status flip, nothing logged — must read the JSON, and must show in the same run that the check could have found a presence (`prove-extended-audit.js` prints the total and the EXTEND count beside the match for that reason). A search that reports 0 because the table never painted is the audit-log twin of a 403 with an empty body.

---

**AND IT PROVES A PRECONDITION, NOT ONLY AN ACTION — 27-08-2026.** Until now the log
was TS13's subject: the row an extension leaves behind, read after the fact. Charmain
on the TS03 take: *"didnt check the audit log to prove that it extended before also"*.

Every case whose fixture **arrives already extended** was proving that from the greyed
button **on the page under test** — the very thing under test. The log is the
independent record, and it is a screen, so it can be filmed. Measured on NA68001099:

| Column | Value |
| --- | --- |
| Date | 26-08-2026 04:02 PM |
| Action | Extend |
| By | 99000/jasons |
| Description | `[Extend] old: - new: Yes` · `[Application Expiry Date] old: 22-11-2026 9:10pm new: 22-12-2026 9:10pm` · `[Application Extension Date]` · `[Extended By]` · `[Remarks] new: zzzzzzzzz` · `[Application Status] Approved -> Approved` |

Two practical notes for anyone filming it. **Both date fields are `readonly`** —
datepicker-only — so `fill()` refuses them and the value has to be set
programmatically; the sidecar says so, because how a precondition was set is part of
the evidence. And **do not ring the row**: a six-block Description makes it ~600px
tall, taller than the useful viewport, and a ring bigger than the screen frames
nothing. Ring Date + Action, and scroll the row's top clear of the app header first —
otherwise the two blocks that matter sit behind the recorder's own banner.

---

**WHAT THE STILL MUST SHOW ON THIS SCREEN — 27-08-2026, 06:45.** Charmain: *"the audit
log page should show the log with extend description and the extend remarks"*.

**Ring the DESCRIPTION cell, not just Date and Action.** The 06:30 take ringed the two
small cells and left the Description outside — and the caption placer avoids the RING
and nothing else, so it took the first free slot, which was directly on top of it.
`[Application Extension Date]` and `[Extended By]` went under the bubble. The same
mistake as the tooltip, one screen over: the evidence has to be INSIDE the ring or the
caption is entitled to sit on it.

Two consequences, both accepted deliberately:

- the ring becomes the full width of the table and the height of the row, so the only
  free strip is beneath it — **the caption has to be short**. The detail belongs in the
  narration footer and the sidecar, both of which already carry it;
- the row has to **fit on screen**, or the last blocks fall below the fold. Measured on
  the passing take: **row 486px, usable 653px below 127px of chrome** — and the take
  now asserts that, so a longer Description in future fails rather than quietly
  cropping `[Remarks]`.

**All six blocks in one frame**, verified on the 06:45 still: `[Extend] old: - new:
Yes` · `[Application Expiry Date] old: 22-11-2026 9:10pm new: 22-12-2026 9:10pm` ·
`[Application Extension Date] new: 26-08-2026 4:02pm` · `[Extended By] new:
99000/jasons` · **`[Remarks] old: - new: zzzzzzzzz`** · `[Application Status]
Approved -> Approved`.

**And the remark is asserted, not merely filmed.** The take reads the `[Remarks]`
block out of the row and fails without it — a log row that records the extension
without the reason given for it would be a defect in its own right, and the only
reason this was ever "fine" is that nobody had looked for it.

---

**THE HANDOFF IS A URL, AND IT IS NOT ONLY THE AUDIT LOG'S — 27-08-2026.**

R18 has said since it was written that the audit log is reached through
`auth-redirect.do?type=OBS_AUDIT_LOG_LISTING` because a pasted URL 403s. What was
never written down is that **this is how the whole of /obs works**, and that the
menu item IS that URL:

```html
<li class="obs-auth-required" data-type="OBS_APPLICATION_LISTING"><a href="#">
```

All four types, read off the live home page:

| Screen | type |
| --- | --- |
| UCD Application Listing | `OBS_APPLICATION_LISTING` |
| UCD Pre-Application Listing | `PRE_OBS_APPLICATION_LISTING` |
| UCD Application Audit Log | `OBS_AUDIT_LOG_LISTING` |
| UCD Pre-Application Audit Log | `PRE_OBS_AUDIT_LOG_LISTING` |

**Measured on a cold session, 27-08:** a direct GET of `/obs/admin/enquiry` returns
**39 bytes**; `auth-redirect.do?type=OBS_APPLICATION_LISTING` lands on that same URL
with **84,673 bytes in 1.1 s**, and direct navigation works for the rest of the
session. So the handoff is mandatory and the **menu walk never was** — the rig had
been opening a dropdown to make the browser follow a URL it already had.

Note for R17: `boRoles.moduleVisible()` still reads the rendered MENU, deliberately.
R17 is a claim about what a role can see, so the menu is the measurement there
rather than a means of getting somewhere.

---

## NARROWER THAN IT READS — measured 27-08-2026 pm

"Any change shows in this audit log" is true of changes made **through the BackOffice**. It is NOT true of changes made through the **support tool**: five expiry patches were applied on 27-08 and none of them produced a row. That day's 29 rows are Export and Verify Hardcopy Document only. The support portal appears to keep its own Audit Logs page, which is a different screen from the one this rule owns.

**Two consequences.**

1. **It protects the `audit-none` leg rather than threatening it.** A take that confirms nothing asserts that no new `[Extend]` row was written while it ran. A fixture whose expiry was patched into place minutes earlier cannot pollute that reading, because the patch is not in this log at all.
2. **A QA-manufactured precondition is invisible here.** So the log can prove an extension happened and cannot prove a fixture was untouched — do not read an absence of rows as "this record is pristine". For that, read the expiry off the LISTING and compare it against the record's natural value.

**Note:** Probed 26-08-2026 evening: discovery/90-audit-log.json (page, controls, columns), discovery/92-audit-log-search.json (the 53-record JSON), scripts/probe-audit-log.js. TS13 owns this surface; TS23/TS26/TS29/TS37/TS38/TS39/TS40 assert against it in passing.

## R19 — BackOffice-generated stubs are out of scope — and must be left untouched

> **Flow-relevant.**

*Source: QA RULING 26-08-2026 (Charmain, with screenshot) + discovery/miss-app.assignee.html*

An application generated from BackOffice's **UCD New Application** panel (`/uat4/view/backoffice/support/onboarding/view.do`) and then never progressed through the dealer's Application Form is a **stub**, not an application. Charmain, 26-08-2026: *"can ignore all these kind of transaction ya"*.

It has no assignee, no approval, no expiry date, and no registration-documents page. NA68001100 is the known example (uuid `d915f80e-ef1b-4557-aed9-64d182225da3`).

**HOW TO RECOGNISE ONE, IN ONE GLANCE.** Open the record from the UCD Application Listing. A BO-generated stub renders the plain **"eAuto Application Form"** — UCD Group dropdown top left, an Application Status dropdown top right, Business Information fields, Back + Save — and it has **no "Application No:" sidebar panel at all**. A real application has that sidebar, and the sidebar is where Extend lives (C4/R11). No sidebar, no possible Extend button, not a fixture.

Confirmed against `discovery/miss-app.assignee.html`, the dump the harness took at the moment it could not proceed: no Approve button, no `Application No:`, no `#extend-application-btn`.

**TWO CONSEQUENCES, AND THEY PULL IN OPPOSITE DIRECTIONS.**
1. **No scenario may use a stub as its fixture.** Every case that reads or clicks Extend needs a record that reached the registration-documents stage; a stub cannot host the button, so a stub in a fixture slot produces "no button" and reads as a defect. This is what produced the Q30 confusion.
2. **But the feature must be proved to LEAVE THEM ALONE.** Charmain: *"we need to add ts to cover those, make sure they dont update and make any changes on those trx"*. So they are out of scope as fixtures and IN scope as a no-side-effect assertion. **TS51** owns it.

**THE ORIGIN IS NOT THE MARKER — and that is still true after the route was closed.** What distinguishes a stub is that it **never progressed**, and the observable form of that is the **missing "Application No:" sidebar**. A real application has that sidebar and the sidebar is where Extend lives (C4/R11); no sidebar, no possible Extend button, not a fixture.

*Why this paragraph used to argue the opposite, and why the conclusion did not change.* Until 27-08-2026 `scripts/build-fixture.js`'s **default** route was named `backoffice` and started from this exact panel, so "created through that module" could not be the exclusion rule — banning the module would have banned the fixture pipeline. **R22 has since banned the module anyway**, and the pipeline now runs entirely from the Pre-Application Form, so that argument is void. The marker is still the sidebar, for a different and more durable reason: stubs that already exist in this environment — and stubs other people create — have to be recognisable on sight, whatever created them.

**Q30 is a special case of this rule, not a separate finding.** Setting the `#status` dropdown to Approved on a stub is what produced an Approved record with no expiry date — the state reads Approved everywhere a person looks and is still a stub underneath. Q30's manual simulation now answers a narrower question: whether a real approver can reach that state through the UI at all.

**Note:** Read with R22: creating a NEW stub needs EV_ALLOW_BO_NEW_APPLICATION=1 and is the only sanctioned use of the closed route.

## R20 — The evidence standard — what a still must show, for every scenario

*Source: CHARMAIN, four review rounds on TS03, 26-08 night to 27-08-2026 morning ("apply this to all ts")* · verified

**The rule: a caption may not assert anything the frame cannot show.**

Everything below came out of four review rounds on ONE scenario, TS03, between the
night of 26-08 and the morning of 27-08-2026. Not one of them was a defect in the
build. Every one was a take that knew the right answer and photographed something
else — and in each case the sidecar, the checklist and the exit code all said the
leg had passed.

**A signal about the ARTEFACT is not a signal about the CAMERA.** Text read from the
DOM, a value read out of a table row, a file verified by SHA-256, a window confirmed
open by an exit code: all four are facts about the data. None is a fact about the
frame. Ask the screen separately, and make the tick depend on THAT answer.

---

### 1. A hover state must be PAINTED, not read

The once-only tooltip is `.extend-tip`, `display:none` until `.extend-wrap:hover`.
`textContent` returns it either way, so a sidecar can quote the message in full over
a still showing a greyed button and no reason at all.

- hover with `mouse.move`, never `locator.hover()` — the greyed button is
  `pointer-events:none`, so the hit-target check can never pass and the call burns
  the whole actionTimeout scrolling the page on camera before its `.catch` eats the
  failure;
- aim at the CSS host (`span.extend-wrap`), not the greyed control inside it;
- re-read visibility AFTER the hold — the still is cut from the held frame;
- assert the WORDING only once it is known to be on screen, or a copy defect gets
  reported when the real fault is that nothing was shown.

### 2. The evidence goes INSIDE the ring

The caption placer avoids the ring and nothing else. Whatever is outside it is a
legal place to put the bubble — so anything the caption describes must be ringed
with the subject, or the caption will eventually be placed on top of it. This has
cost two takes: the tooltip beside the button, and the Description column beside the
audit row.

Consequence to accept, not work around: a bigger ring leaves less room, so **the
caption gets shorter**. The detail belongs in the narration footer and the sidecar,
which already carry it.

### 3. A value in a wide table is a CELL, not a row

The UCD listing has 22 columns in a `table-scroll-container`. Application Expiry
Date is the 12th and Remarks the 22nd, both off-frame at rest. A ring on the row
frames neither and captions both — and only a cell locator makes the container
scroll horizontally at all. Ring the **cell and its column header**; where the
column cannot be located, **refuse the point** rather than fall back to the row.

### 4. A precondition may not be read off the page under test

A take whose fixture arrives already extended proved that from the greyed button —
the very thing under test. The audit log is the independent record and it IS a
screen, so it can be filmed (R18). Same surface, second role: every take that
PERFORMS an extension films the row it wrote, and checks the logged remark against
the string it actually typed.

### 5. An artefact is shown in its own application, on the recorded display

- the workbook opens read-only in Excel and the file stays byte-identical (hash
  before and after, in the sidecar);
- **one still per column that matters** — a workbook shows one column at a time, so
  a single point can only ever film half of a two-sided rule;
- the window is MOVED onto the recorded display and **the tick is conditional on its
  measured rect**. `xlMaximized` fills whichever monitor Excel already occupied, so
  a leg can verify everything and appear in no frame at all;
- the frame is marked mid-leg, while the window is up — not at the tick, which runs
  after the window has been closed.

### 6. The still is cut where the evidence is, not where the bookkeeping is

Stills are cut `STILL_LEAD` (0.9s) BEFORE each tick, because the tick expands the
trigger-point checklist over the page — the panel was landing on the evidence in the
frame that point exists to prove. A leg whose decisive moment is elsewhere passes its
own timestamp instead.

### 7. A re-record must not destroy what it corrects

The take being corrected is the evidence that the correction was needed. Same-label
files are archived to `evidence/EAINT-11982/video/superseded/<label>__<n>/` before a
byte is written, and the vault's scanner skips that folder so an archived take cannot
come back as a live one. (The stamp is the LOCAL date: `toISOString()` is UTC, and in
UTC+8 a take before 8am is stamped yesterday — which is how one counter-example was
lost.)

### 8. A rule in the register that nothing asserts is a rule the next take can break

The requirement *"pointer parked so the once-only tooltip is visible"* was written
here BEFORE the take that broke it, and that take still reported full coverage
because the checklist counted the point. **When a rule is added to this register, the
thing that catches its breach is added in the same pass** — an assertion, a refusal
to tick, or a line in the sidecar. A rule that genuinely cannot be checked says so
here; an unenforceable rule that admits it is honest, one that reads like policy is a
trap.

---

**What enforces each of these**, so this rule is not itself an example of §8:

| # | Enforced by |
| --- | --- |
| 1 | `app.readExtendTip` + `bankGreyed()` — no tick, red run, and `extend-gating.spec.js`'s R6 test asserts it outside the recorder too |
| 2 | `spot.check([...])` takes an array; `audit.evidenceCells` and the tooltip pair use it |
| 3 | `listing.cellWithHeader()` + `showCell()`, which refuses the point |
| 4 | trigger points `audit-precondition` (arrives extended) and `audit-after` (every extend take) |
| 5 | `placeWindowOnRecordedDisplay()`, two `excelRuns`, `tick(..., atSeconds)` |
| 6 | `STILL_LEAD` in `tick()` |
| 7 | `archiveExistingTake()` + `superseded` skipped in `vault/evidence.mjs` |
| 8 | this table, and `npm run check:points` |

---

**A COROLLARY OF §3, found while applying this standard to every scenario
(27-08-2026).** When a rule has **two halves** and the surface can only show one at a
time, it needs **two trigger points, not one caption**. Twice, within an hour:

- the **export** — a workbook shows one column at a time, so *"col 13 moved, col 23
  unchanged"* was a single point that could only ever film half of itself. Split into
  `export-expiry` + `sweep-export`.
- the **listing sweep** — Application Expiry Date is column 12 and Remarks column 22,
  ten apart inside a horizontal scroller. Ringing both put the expiry in shot with the
  Remarks column off the right edge, under a caption asserting both. Split into
  `sweep-listing` (the expiry that moved) + `sweep-remarks` (the remark that did not
  arrive).

**The tell is a caption with an "and" in it** — *expiry moved AND remarks unchanged*.
Two claims in one still is one claim filmed and the other one asserted, and the
asserted half is exactly the half a reviewer cannot check.

---

### 9. Do only what the evidence needs — navigation is not evidence

Charmain, 27-08-2026: *"every time when you land in backoffice you will open the menu
dropdown then only proceed to the expected page, why? ... dont open the menu dropdown
and i believe it is a mistake."*

Half right, and the half that is right is the half that matters. The session
**handoff** into /obs is real and mandatory (39 bytes without it). The **menu walk**
was never necessary: the item is `<li data-type="OBS_APPLICATION_LISTING">` and
clicking it navigates to the auth-redirect URL, which the rig can request directly —
1.1 s, no dropdown, no animation waits, and no click to be intercepted by a
neighbouring item (which is exactly what bit the 25-08 run).

The general form: **anything on camera that is not the evidence, and not needed to
reach it, is noise a reviewer has to read past.** When a step looks ceremonial, ask
what it is actually FOR — and if the answer is "a session", get the session the
cheapest way and keep the ceremony out of the frame. The menu walk survives as a
fallback, because it is what a human does and it will still work the day the endpoint
is renamed; the sidecar records which door was used.

---

**THE NO-OP PROBE (27-08-2026).** Charmain, on the TS01 take: *"click inside the
extend button and check the popup then quit, then check everything again after, the
listing the excel file the button (still enable)"*.

A gating take used to look at the button and stop. It never opened the pop-up that
every reviewer opens first — and opening it **spends nothing**, because R1 is spent at
Confirm, not at click. That left the cheapest evidence in this CR on the floor.

So wherever the control is **enabled** and the take will not spend it, three points are
now mandatory:

- `modal-open` — the pop-up on screen with its copy readable: title, instruction, the
  Remarks field, and the Cancel/Confirm pair. Asserted against the Figma baseline, not
  merely photographed.
- `modal-cancelled` — **Cancel**, and only Cancel. Esc (`closeOnEscape: false`) and the
  × (`display:none`) are dead by design on this dialog, so a take that "quit with Esc"
  would be filming a dismissal that FAILED and scoring it as one that worked. TS12 owns
  those other exits as its subject.
- `button-after` — the control **through a full page reload**, still present and still
  enabled. Re-reading the same DOM proves only that the rig did not change it; the claim
  worth filming is that the SERVER still regards the application as extendable.

**Confirm is never touched.** Cancel is located by an exact name and the leg refuses the
point outright if it cannot find one, rather than reaching for whatever else sits in the
buttonpane — because the control next to Cancel spends the fixture.

**Where the button is greyed or absent** the three points are dropped at runtime and
reported under **NOT APPLICABLE** with the measured state that caused it. That is the
only runtime drop this recorder may make, and it is fenced: only those three keys, only
off a state the sidecar prints verbatim, and never folded into the captured count. A
checklist that shrinks to fit what a take managed to film would let every take score
full marks.

---

**A SECOND COROLLARY OF §3 — WHAT THE MARKUP HOLDS IS NOT WHAT THE FRAME SHOWS
(27-08-2026).** Caught by the very first no-op-probe take, on the very leg the probe
was added for.

The new `modal-open` point read the pop-up's buttons with `allInnerTexts()` and put
the result in the on-screen caption: **["Close","Cancel","Confirm"]**, over a frame
showing **Cancel and Confirm**. jQuery UI emits a `.ui-dialog-titlebar-close` button
and this dialog ships it `style="display:none"`, exactly as Figma specifies.

That is **C6 re-manufactured** — the finding raised on 25-08 from precisely this DOM
read and withdrawn on 26-08 once somebody looked at the screen. Two months of a rig
built to stop captions outrunning frames, and the newest caption in it did so within
one take.

The fix is the same shape as `extendState()`'s `present` vs `inDom`, and it is now the
rule for every list a caption quotes:

- `buttons` — what the markup holds. A real question, and it belongs in the sidecar.
- `buttonsVisible` — what a reviewer can see. **Only this may reach a caption.**
- Where the two differ, the sidecar says so *and says it is not a finding*, because
  the difference is the design.

And the assertion moved with it: from *"the list contains Cancel"* — which passes on
the three-button reading that caused this — to *"the visible set is exactly
`Cancel | Confirm`"*.

**The general form: any check that enumerates the DOM is a claim about the markup, and
a caption is a claim about the picture. Whenever a point quotes a count, a list or a
label, ask which of the two it just measured.**

---

**A THIRD COROLLARY OF §3 — THE FRAME CAN BE CHANGED (27-08-2026, evening).**

§3's corollary says a rule with two halves needs two trigger points, because the
surface can only show one at a time. Correct, and it silently assumed the surface is
fixed. Often it is not.

Told *"you can just export once to check both expiry date and remarks"*, the answer
was not to weaken the standard but to **change what the frame contains**: hide the
50 columns nobody is testing and both halves are in shot together. The rule is
**satisfied**, not repealed — both halves are in the frame that claims them.

So the question to ask before splitting a point is: *can this surface be made to
show both?* Two points and two windows is the fallback, not the default. And when
one frame does carry two claims, three things are mandatory: keep the two points and
tick them off the same still (or a half-framed take scores full), **measure** that
each subject is really in the visible range and fail its point if not, and say in
the caption what was changed to fit them in.

**The same standard also applies to what the RIG paints.** The trigger-point
checklist is not exempt from "never over the evidence": at six points it was a
harmless corner box, at fourteen it reached half way up the screen and landed
straight across the dialog in that dialog's own still. Timing the frame to miss it is
a bet — frame extraction seeks, holds get interrupted — so the panel measures itself
against the ring, moves to the far side, and stays a collapsed pill if neither side
is clear. **The ring is the subject; the checklist is bookkeeping; when they cannot
both fit, the bookkeeping gives way.**

---

### 10. The bookkeeping must be ON THE FRAME

Charmain, 28-08-2026: *"make the trigger points list showing on the recording short
simple and clear, like a summary, now they are too long that make the section very big
when expand"*.

The paragraph above holds the panel to "never over the evidence". It did not say the
panel must show its own rows, and it did not. Measured at 1920x1080: the expanded
checklist was **304x580px** — **wider** than the 300px the caption placer reserves for
it, and **taller** than its own `max-height:52vh`, so `overflow:hidden` cut **up to
294px of rows off the bottom of every tick**. The entire Sweep group — both R14 halves,
the audit row, the sidebar remark — was not on the frame. The log said pass, the sidecar
said pass, the exit code said pass. Only the pixels had it.

**A trigger point therefore carries TWO texts, and they answer different questions.**

| | who reads it | what it says | length |
| --- | --- | --- | --- |
| `short` | the RECORDING | a summary a person can take in during the ~1.9s the panel is open at 15fps — plain words, no rule or column numbers | one line, **≤44 chars** |
| `label` | the sidecar and the summary `.txt` | the audit sentence: which column, which requirement, what would make the tick a lie | free |

Nothing is deleted by this — the audit sentence moves to where it is actually read.

Three consequences, each of which had to be built:

1. **It fits, or it goes wide. Never clipped.** The panel measures itself and reflows
   into two or three columns — on content past the cap, and on a column past 40% of
   viewport height, which is the half Charmain actually saw. Takes run `viewport: null`,
   maximized to whatever display the operator has, so `52vh` is a different number of
   pixels on every machine and *"it fits on mine"* is not a property of the rig.
2. **The caption reserves the MEASURED footprint.** A hardcoded 300 x 55%-of-viewport
   band was honest at 304x580 and over-reserved ~190px of height once the rows shrank.
   The panel publishes its open **size**; the placer reserves that at the panel's home
   corner. Size only, never the dodged position — reserve where the panel fled to and
   the two chase each other frame by frame.
3. **A shared label cannot state a shape-dependent claim.** The four R14 sweep labels
   read a flat *"the expiry cell, moved"*, written when only extend takes swept. Since
   27-08 **every** scenario sweeps, and on the 23 gating rows the point is that it did
   **not** move — so the label asserted the opposite of what those takes exist to prove,
   on the text the sidecar prints. Both branches are named now, and `short` names the
   cell with no verdict at all, because one line cannot hold two branches. On camera the
   verdict is the caption's job.

**What enforces it** (§8 applies to this clause too): `npm run check:points` fails on a
point with no `short` and on a `short` too long to stay on one line — the renderer's
`p.short || p.label` fallback exists so a point added without one is still VISIBLE, not
so it can be left out. `npm run probe:still` asserts the geometry at **1366x768 and
1280x720** as well as 1600x1000, with 21 stand-in rows at the full 44-char ceiling: no
row clipped, every row one line, the reflow firing rather than the cap cutting, and a
dodge not rewriting the published home footprint. `npm run check:docs` fails if the
README or the skill reference stops explaining the two texts.

**Note:** Not a rule about the product — a rule about the evidence. Every scenario in the register points at it. If a take cannot meet a clause, the point does not tick and the run goes red; it is never noted and passed over.

## R21 — A take must assert the control state its scenario CLAIMS, not merely film whichever state it finds

Measured 27-08-2026 at the cost of five takes.

The recorder's key shot films whichever of the R11 states a record is in — offered, greyed, absent — and captions it accurately. It then ticks `extend-state` in all of them, because *the control state was filmed* is true in all of them. That is the right rule for that point and it is not an assertion about anything.

When staging's window rule changed mid-batch, TS01 — *"Approved application: Extend across every Hardcopy & Acc Created value"* — filmed a page with no Extend control on it and scored **12/12**.

> The checklist counts what was FILMED. Nothing counted what was filmed AGAINST.

**The check, added in the same pass as the rule** (`automation/src/expectedState.js`): every recordable scenario declares its expected state — `offered`, `greyed`, `present` (either), `absent`, or an explicit `null` meaning fixture-dependent and deliberately unasserted. An extend-shaped scenario with no explicit entry defaults to `offered`, because a take that must click Confirm cannot run on a record without an enabled button. The recorder asserts the measured state against it, keeps the point ticked (the shot IS evidence of what was on screen) and fails the CLAIM, writing `EXPECTED STATE — … MISMATCH` into the sidecar along with the reminder to check the fixture is still in window before reading it as a product defect.

`null` is a real answer; the forbidden third option is no expectation, no assertion, and no line in the sidecar saying the take never checked. `npm run check:points` fails if any recordable scenario has no declared expectation.

Generalises past this rig: **an evidence checklist measures coverage, never correctness.** Any point that ticks on "we looked" needs a sibling assertion on "and it was what we claimed", or a green take will eventually certify the opposite of its own scenario.

## R22 — Every transaction is created from the Pre-Application Form

> **Flow-relevant.**

*Source: QA RULING 27-08-2026 (Charmain)* · verified

Charmain, 27-08-2026: *"make sure all transaction created from preapplication, i dont want the manual application way to create the trx, we didnt cover that part in this ticket."*

**The rule.** Every application this ticket tests — fixture, pool record, date-patched subject, evidence subject — is created by walking the dealer's real journey from `/obs/preOnb/recaptcha`: Pre-Application Form → RM 108.00 → BackOffice approval → Application Form → assign → Submit for Approval → Approve → registration documents → Verified → RM 990.00. BackOffice's **UCD New Application** panel is not a way of creating a transaction for this CR.

**Enforced in the rig, not just written down** (27-08-2026):

- `scripts/build-fixture.js` — the default route is `public` and it is the only one. `--route backoffice` exits 1 naming the ruling; resuming a checkpoint whose `route` is not `public` exits 1 as well, so a half-built manual-route fixture cannot be finished by accident.
- `src/onboarding.js generateApplicationLink()` — the single point in the rig that could create an application any other way. Throws unless `EV_ALLOW_BO_NEW_APPLICATION=1`.
- `scripts/generate-link.js` (`npm run genlink`) — refuses on the same flag, and its success message now says the links it produces are **not** fixtures.
- `scripts/build-pool.js` — the `--route` flag is gone entirely.

**The one sanctioned exception is not a fixture.** `EV_ALLOW_BO_NEW_APPLICATION=1` exists to re-create an **R19 stub** (the subject of **TS51**) if NA68001100 is ever lost. A stub is a record deliberately left un-progressed; it can never host an Extend button, so it is not a transaction under test.

**WHAT THIS GIVES UP, STATED PLAINLY — and it costs this ticket nothing.** The manual route was the only one that could produce an **SSM** business type (Sdn Bhd / Sole Prop / LLP), because the public form sends the BRN to `/obs/preOnb/checkSSM.do`, which rejects every generated number and silently falls back to Business Trading. Every fixture from here on is therefore **Non-SSM (Business Trading Sarawak/Sabah)**. Business type has no bearing on the expiry date or on the Extend control (`src/fixture.js` newProfile, `src/preapp.js` header), so **no scenario in the register loses coverage** — and if an SSM-specific question ever arises it needs a real company's BRN in `fixtures/profile.json`, not this panel.

**And it costs nothing in effort either, because the route it closes never worked.** The manual route was faster on paper — no reCAPTCHA, one payment instead of two — but it stalls at `approve-app` for good: the assignee's edit page carries no "Submit for Approval" button, so the record never leaves Pending and the approver has no Approve button. Reproduced 26-08 20:59 on **NA68001102**. Forcing it with the Application Status dropdown produced **NA68001100**: Approved on the listing, every workflow column `-`, no expiry date at all — the R19 stub. So the ruling closes a path that had already failed on the measurements, which is the reason it changes no build plan and no scenario count.

**What this supersedes.** **Q20** (SSM coverage without a real BRN) was answered by finding this panel; that answer is now historical. **R19**'s "banning the module would ban the fixture pipeline" argument is void — the pipeline does not run through it any more. The stub-recognition half of R19 stands unchanged: the marker is the **missing "Application No:" sidebar**, not the origin, because stubs already in the environment have to be recognisable on sight.

**Note:** The cost of this ruling is exactly one reCAPTCHA tick per fixture, which was already the cost (check:gate — NOT REUSABLE). Nothing else in the plan moves.

## R25 — The extension remark shows on the details page sidebar — and nowhere else a user reads applications

*Source: Charmain, 28-08-2026, applied to every scenario in the register*

The extension remark is written to the **"Application Extended Remarks:"** row in the **right sidebar of the application details page**, and that row is the ONLY user-facing surface it appears on.

**Present where it belongs.** An application that has been extended shows the row, holding the remark that was typed, verbatim — same characters, not truncated, not escaped. Read after a page load, so it is the stored value and not the pop-up's echo.

**Absent where it does not.** An application that has never been extended has no such row. Neither does one whose extension attempt was refused: a refusal that still writes the row is a half-applied extension.

**This is the third leg of R14, not a new idea.** R14 already says the remark stays OFF the listing's Remarks column and OUT of column 23 of the export. Both are ABSENCES. Until 28-08-2026 nothing in the register asserted the matching PRESENCE, so a build that stored the remark and never displayed it anywhere passed every check we had. R18 proves the remark reached the audit log — an internal record, not the screen an officer opens.

**How the two claims are told apart, and why it is not a list.** Five rows arrive on a fixture that was already extended, and on those the row is correctly present with somebody else's remark in it. The claim is therefore *the row is where the record's own history says it is, and this test did not change it*: read it before, read it after. On an ordinary never-extended record "unchanged" and "absent" are the same reading, which is the plain "field is not showing" check.

**An absence needs its positive control.** Read the row on the same panel that carries **Application No:**. A dealer view, a BackOffice stub (R19) and an expired support session all render no sidebar at all, and all three produce a confident "not showing" from a reader that was never looking at the right screen. The recorder refuses the point without the control; `npm run probe:remarks` is the standing proof that the reader can see a row when one exists.

**Note:** Driven by src/triggerPoints.js `extended-remarks` (the 37 rows that Confirm) and `extended-remarks-none` (the 23 that do not); check:points fails if a row carries both, neither, or the wrong one for its shape.
