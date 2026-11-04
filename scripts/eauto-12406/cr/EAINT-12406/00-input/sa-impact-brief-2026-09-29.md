# EAINT-12406 — Allianz in Secarang: SA Impact Brief (copy)

Source: SRD v1.1 §1.5 #6, Claude Docs doc https://claude.ai/artifact/FX4YJNpnMjVUakvmAYhwpw, dated 29.09.2026
(written before SRD v0.1). Read 28.10.2026 (doc rev 11). **Where it disagrees with SRD v1.1, the SRD wins**:
the brief's "Decisions needed" were settled by the SRD (REQ-003 unavailable card, REQ-007 About Us wording).
Use it for scope and test ideas; an expected result still needs the SRD or the ticket behind it.

## Summary (brief's words, shortened)
- Allianz quoting switched off for Secarang May 2025 (EAINT-7956/7957); removed from Secarang screens Sept 2025 (EAINT-8799, "To remove RHB and Allianz").
- Full Allianz journey still in production code: quote, add-ons, payment, cover note, Allianz callbacks, receipt.
- Work: two data changes (Allianz on for the Secarang tenant only; insurer order Lonpac 1 > Allianz 2 > Tokio Marine 3 in the Secarang DB) + screen edits (insurer list, Home logo, About Us, Support).
- Finance: no e-Invoice / LHDN impact; Allianz sales under agency "Serba Sentral" in CIBO payment and commission reports → Finance sign-off.
- Allianz only quotes for **individual owners renewing**; company vehicles and non-renewal never get an Allianz price.

## What stays the same (brief)
- Lonpac and Tokio Marine quotes, prices, journeys unchanged.
- eAuto (UCD) insurance unaffected: the Allianz switch is per tenant, only the Secarang row changes; the insurer order table is in the Secarang DB.
- CIBO already shows Allianz in transaction details, payment and commission reports; no code change (note: SRD v1.1 REQ-010/011, added later, does change the receipt / Transaction Details text).
- Existing transactions not changed.

## Risks (brief)
| Risk | Why | Mitigation |
|---|---|---|
| Stale Allianz journey | Final-premium logic, MacroKiosk Pay Now / Pay Later and post-payment WhatsApp changed since May 2025; Allianz never part of those changes | Full E2E in Allianz UAT |
| Allianz callbacks and credentials | Customer WhatsApp and JPJ status depend on Allianz calling back; API keys / Vault credentials may have expired | Confirm with Allianz + DevOps before UAT |
| Only 3 quotations shown | If Chubb or another insurer is on for Secarang, Lonpac + Allianz + Tokio Marine fill all slots and others drop silently | DB check of enabled insurers |
| Old Allianz documents | Policy wording, PDS, privacy notice dated 2022 | Question 5 |

## Test scenarios the brief lists
1. Individual renewal car: Allianz quote between Lonpac and Tokio Marine.
2. Company vehicle and non-renewal: behaviour per decision 1 (SRD REQ-003: unavailable card).
3. Allianz refer-risk, including Allianz as the only insurer available.
4. Allianz add-ons: all-driver, CART, Road Rangers, PAB-ERW, MPA A/B, agreed value.
5. Pay by RMS (Fiuu) and by BoldPay, then cover note submission.
6. Allianz policy and status callbacks; WhatsApp and email after payment; receipt PDF.
7. Quotation-link flow and MacroKiosk renewal Pay Now / Pay Later.
8. CIBO payment and commission reports show Allianz correctly.
9. eAuto quotes unchanged.

## Questions the brief raised (29.09; check which the SRD answered)
1. No Allianz price: unavailable card or no card? → SRD REQ-003 answers (card).
2. Allianz Road Assistance Hotline / Customer Service numbers (old page had only "24-Hours Helpline 1800 22 5542").
3. About Us sentence approval → SRD REQ-007 answers.
4. FAQ "Which insurers can I get instant quotation from?" lists Allianz? → SRD REQ-008.
5. Allianz documents (2022) still current?
6. Allianz company number on receipts in the new 12-digit SSM format? → SRD REQ-010/011.

Open checks the brief listed (read-only, Dev): enabled-insurer rows (Allianz, Chubb, RHB, Tokio Marine) in the Secarang quotation control; insurer priorities; active Allianz commission rate for Secarang at release; Allianz transactions since May 2025 and any stuck in a non-final status; Allianz API credentials / callback URLs.
