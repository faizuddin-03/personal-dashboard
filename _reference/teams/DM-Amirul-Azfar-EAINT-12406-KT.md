# DM Amirul Azfar — EAINT-12406 knowledge transfer

<!-- Read-only capture via Teams web DOM (teams.cloud.microsoft), 2026-11-03. Times MYT (UTC+8).
     Only the 12406 hand-over messages (2026-11-03 04:20 to 11:15) are kept. Earlier DM messages
     (2026-10-20 to 2026-10-30: recorder/onboarding notes, an ESTM CSV, a blocked file) do not mention
     12406 or Allianz and are not copied here. Line breaks inside a message shown as " / ".
     Artifact share key (?sk=) redacted. Reactions dropped. -->

**Amirul Azfar** — 2026-11-03 04:20: faiz

**Amirul Azfar** — 2026-11-03 04:21: Tapi kena tambah sikit yang guna real api

**Amirul Azfar** — 2026-11-03 04:21: lepastu sekarang ada blocker tu

**Amirul Azfar** — 2026-11-03 04:22: https://github.com/modefair/eauto-qa-azfar

**Amirul Azfar** — 2026-11-03 04:22: incase nak guna script

**Amirul Azfar** — 2026-11-03 04:22: ada semua info sekali pasal 12406

**Amirul Azfar** — 2026-11-03 04:23: https://claude.ai/artifact/7xguCHVWNb2oXDKgpDyZWT?sk=[redacted] (Claude Artifact)

**Amirul Azfar** — 2026-11-03 04:25:
A. Defects, ready to raise

D1 (Low): Allianz company number is on the same line as "Berhad"
- Where: the Secarang receipt PDF, the CIBO receipt PDF and the e-receipt email.
- Actual: "Allianz General Insurance Company (Malaysia)" / "Berhad 200601015674 (735426-V)".
- Expected: the full name, then "200601015674 (735426-V)" on its own line, the same as Tokio Marine. Source: SRD v1.1 §2.2.9 REQ-010.
- Affected: all 4 new purchases (HXA0011A–14A, BR60006349–52), plus the old transaction BR55004010 opened in CIBO.
- TS: RC_TS1, RC_TS2, RC_TS8. Re-confirmed in the 30.10 retest.
- Your call: the Allianz name is longer than Tokio Marine's, so the number may only follow "Berhad" because the name wraps, and the PDF can't tell a wrap from a line break. You can raise it To Do, or On Hold for the BA first (this is Q42).

D2 (Medium): Allianz "Premium after NCD" is RM20.00 too high
- Actual: RM882.16.
- Expected: RM862.16, which is Basic 1,203.08 − NCD 360.92 + All Drivers 20.00. The Confirmation page shows RM862.16.
- The Gross Premium and Total are correct, so only that one line is wrong.
- Affected: every Allianz receipt since the deploy (13 receipts, 6 cars), the CIBO receipt and the e-receipt email. The Print view shows RM882.16 too.
- Not affected: the old Allianz transaction from May 2025 (RM862.16), Tokio Marine and RHB.
- Clue for Dev: this browser console error appears during an Allianz purchase: TypeError … reading 'amount' at autoAddAddonIfAllianz.
- TS: E2E_TS1–5, RC_TS1 E10, RC_TS2.

B. Questions, not defects

| # | For | Question | Blocks |
|---|---|---|---|
| Q44 | Dev | Every paid Allianz purchase shows Cover Note "-", Policy "-" and no e-Certificate. Tokio Marine gets one within 15 s. Is it supposed to come back on /ia/? (Known before as EAINT-6345) | E2E_TS1–3 |
| Q46 | Dev | How do we pay more than RM2,000 on the Fiuu sandbox? FPX and card are refused (P15), and GrabPay came up blank | E2E_TS12 |
| Plates | Dev | Simulator data for Allianz unavailable, Lonpac unavailable, Tokio Marine unavailable, and an individual non-renewal | QT_TS2, QT_TS4, QT_TS5, QT_TS6, then RG_TS2, RC_TS4 E5, RC_TS11 |
| Q42 | BA | D1 above: is a wrapped name acceptable, or must the number start on its own line? This covers CIBO Transaction Details too | D1 |
| Q45 | BA | An unpaid Allianz transaction in CIBO shows no payment badge, while the mockup shows "Unpaid" | RC_TS9 note |
| N1 | You, then BA | The Success page [Print] view has no Insurer block. Does it count as a "receipt" under REQ-010? | RC_TS1 E9 |
| QT_TS7 | BA | The SRD says the Allianz documents are "dated 2022", but the PDS says 03/06/2020, the Privacy Notice says 3 March 2020, and the Claim Guide is a BNM/PIAM leaflet. Is "existing documents displayed" enough to pass? | QT_TS7 |
| Q16 | BA | Allianz commission is RM0.00 (0%) for RJC7, and the Commission Report lists only purchases with a discount code. Is that right? | RC_TS6 note |
| Q40 | BA | The SRD says a company vehicle gets an "Allianz unavailable" card, but the team says no insurer in Secarang supports companies | QT_TS3 (orange) |
| Q43 | BA | CRM record of an Allianz buyer | RC_TS11 |

C. Observations for Dev, not 12406 points
1. When FPX or card is refused (P15, over MYR 2,000), Secarang shows a blank window with no message.
2. One card payment hung on "Just a little moment..." after it had succeeded (BR60006337).
3. CIBO: printing the whole Transaction listing after Clear all gave HTTP 404 after 124 s.
4. The /ia/ simulator ignores gender for every insurer, so the E2E_TS9 gender point needs a pass on the real API.
5. The Serba Sentral staging API seems down (you, 30.10 afternoon).

D. Noted, not raised
- N2: a Tokio Marine receipt has an empty Add-ons section, yet the Gross Premium is RM375.00 above Premium after NCD (HXA0004A and BR69005852). It was the same before the deploy and it's not Allianz, so it falls outside 12406. Raise it as a production question only if you want to.
- S1 (our script): RC_TS8 E5 was never recorded, because the script couldn't get from Transaction Details back to the CIBO listing. It's ours to fix and re-run, not a Jira item.

**Amirul Azfar** — 2026-11-03 04:26: Pape roger

**Muhammad Faizuddin Bin Bidi** — 2026-11-03 11:15: tengs. aku sumbat sume dalam claude aku
