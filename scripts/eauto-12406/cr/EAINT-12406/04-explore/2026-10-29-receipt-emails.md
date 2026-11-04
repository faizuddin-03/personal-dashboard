# EAINT-12406 — Secarang receipt emails, checked 29.10.2026 (read only, Azfar's Gmail, his OK)

Staging /ia/ purchases made by the automation on 29.10 send the e-receipt from `noreplyiatest@bintangprospek.com`.
All landed in Gmail **Spam** ("similar to messages identified as spam"); older staging receipts (May 2026) reached
the Inbox. Subject: "Your Secarang receipt for <plate>". Owner name on all: the made-up "QA SECARANG TEST".

Seen: HXA0006A (receipts 26102921300003 11:45, …015 13:05, …017 14:27, …020 15:19), HXA0007A, HXA0008A, HXA0009A,
HXA0010A (subject lines; HXA0006A thread read in full).

## Body of the HXA0006A receipt (all four identical apart from receipt no. / time)

- Insurer: **Allianz General Insurance Company (Malaysia) Berhad 200601015674 (735426-V)** — new company number
  present (REQ-010), on the **same line** as the name (the SRD draws it on its own line; see D1 / RC_TS8).
- Receipt Summary: Basic Premium RM 1,203.08 · NCD 30.0% − RM 360.92 · All Drivers RM 20.00 ·
  **Premium After NCD RM 882.16** · Add-ons: Allianz Road Rangers RM 0.00 · Gross Premium RM 862.16 ·
  Service Tax 8% RM 68.97 · Stamp Duty RM 10.00 · Total Premium RM 941.13.
  → 1,203.08 − 360.92 + 20.00 = **862.16**; "Premium After NCD" shows **882.16** (RM 20.00 = All Drivers counted
  twice). Same as the PDF receipt (verify runs fx4 / fx5). Gross and Total are correct.
- Agent: "Exclusively by agent Serba Sentral Sdn Bhd · PIAM ID: 195379-01".
- Payment Method "Online Banking - RHB Bank"; Coverage 11-Nov-2026 – 10-Nov-2027.

Notes: e-receipts going to Spam is a staging sender issue, not 12406. RC_TS7 (customer messages) is still an
orange row ON HOLD; this note is its raw material if Azfar approves it.
