# Addenda from the eDereg BO-side pass (2026-10-15/16)

## Target: knowledge/esim.md — § RHB Transfer

Add: code `ER` ("RHB API Down", `RHB_TRANSFER_RESPONSE_CODE_API_DOWN`) enforces
its own ~12-minute cooldown between genuine payment attempts. The native
dialog reads "ER - Sila TUNGGU 12 minit kemudian klik 'Resubmit'...". This is
separate from `RE`'s 6-minute reset timer.
`[from Session-Handoff-2026-09-17-9306.md, 2026-09-14 §1 — CPC_E2E_TS12 Part 2 live run 2]`

## Target: knowledge/flows.md — Index of flow documents, row flow-edereg.md

Replace the "Covers" cell's last sentence "**Still missing**: Back-Office side
URL map/DOM handles" with: "plus the Back-Office side (§45 URL map, both BO
listings' filters/columns/Cancel DOM, §46 both JPJ XML Log pages with decode
tables), SRD V1.0→V1.2 delta (§47), automation config/env-var reference
(§48). Still missing: BO details pages, Slip Pengesahan (§50)". Source cell:
"Live HTML (AATF + BO side) + dev guide + QA test plan + SRD V1.0–V1.2, EAINT-9306".

## Target: knowledge/README.md — Index table

Add row:
`| [jpj-xml-log.md](jpj-xml-log.md) | **JPJ XML Log** — the BO log pages (APT/STMS/ESTM/Deregistration/eDereg Pre-Checking/BMK), their shared search form and duplicate-id trap, and the QA "Code Splitter" workbook's per-module field order for decoding the \`~\`-delimited Request/Response Data |`

Update the flow-edereg.md row: append "Back-Office side (listings, JPJ XML
Log pages) added 2026-10-15".

## Target: memory note eaint-9306-ts11-ts12-need-retest (not a knowledge file)

Stale: index line says "TS12 P2 still never run" and the body describes the
5-round resubmit loop as current. Per the 2026-09-14 handoff, TS12 Part 2 ran
twice (both failed), then was rebuilt to assert `trxStatus === 'Cancelled'`
directly after one ER decline; that form has never run. See flow-edereg.md §49.

## Target: scripts/eauto-edereg-precheck/.env.example (code, not knowledge)

Lists 6 variables; the suite reads ~35 (flow-edereg.md §48.2). Out of scope
for this pass; flagged only.

## Target: _reference/html/README.md (owner-only edit)

The `EAINT-9306-precheck-details-and-listing.html` header calls the listing
`listing.do (inferred route)`; the real route is `main.do`
(flow-edereg.md §45.5). `_reference/` is read-only, so this is a note only.
