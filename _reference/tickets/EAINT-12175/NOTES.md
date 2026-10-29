# EAINT-12175 — notes

`[Secarang & eAuto-Insurance] To Correct Insurer Name to Lonpac Insurance Bhd & Update SDPA Policy Wording Link`

Type: Task · Status: In Development · Priority: Medium · Fix Version: S34.X-20261002
Assignee: Shane · Reporter: Batrisyia Hasanah Binti Nursyamsi
Components: eAuto, Secarang · Labels: 260810-260814, August2026, ProductBacklog, Secarang
Environment: **not specified anywhere** (ticket field, comments, SRD) — confirmed with Faizuddin 2026-09-25, none assigned yet. Do not schedule execution until set.

## Attachments (fetched via Atlassian MCP, cloudId 8fc3c96f-5850-4bd1-bb80-f57582b68e93)

| File | Version | Added |
| --- | --- | --- |
| SRD_EAINT-12175_Lonpac_Changes_V0.1_20260902.docx | 0.1 | 02 Sep 2026 |
| SRD_EAINT-12175_Lonpac_Changes_V0.2_20260904.docx | 0.2 | 04 Sep 2026 |
| SRD_EAINT-12175_Lonpac_Changes_V1.0_20260907.docx | 1.0 | 07 Sep 2026 |
| SRD_EAINT-12175_Lonpac_Changes_V1.0_20260907.pdf | 1.0 | 07 Sep 2026 |
| SRD_EAINT-12175_v1.1_20260923.docx | **1.1 (latest)** | 23 Sep 2026 |
| SRD_EAINT-12175_v1.1_20260923.pdf | **1.1 (latest)** | 23 Sep 2026 |

Only the latest PDF (v1.1) was downloaded and read in full (27 pages) — saved in this folder as
`EAINT-12175_SRD_v1.1_20260923.pdf`. Downloaded via the browser's authenticated session at
`https://mfservices.atlassian.net/secure/attachment/157839/SRD_EAINT-12175_v1.1_20260923.pdf`
(landed in `Downloads\Chrome\` automatically, then copied here) — the Atlassian REST attachment
content endpoint (`api.atlassian.com/.../attachment/content/<id>`) needs an OAuth bearer token the
browser session doesn't carry, so `fetch()` from a page context 403s; navigating the browser
straight to the `/secure/attachment/<id>/<filename>` URL is what actually works. The four earlier
versions and the .docx were not downloaded — not needed, v1.1 is the baseline.

## Teams search

Not run this session. Graph sign-in checked (`node .claude/skills/qa-timesheet-update/scripts/teams-day.mjs whoami`) — not signed in. Browser-driven Teams search was skipped to keep the run lean; not attempted.

## Coverage check against this repo's `knowledge/` and `scripts/` — 2026-09-25

Full findings already in the published study artifact and in chat; summarised here for the next
session so it doesn't get re-derived.

1. **Insurer identity runs on `planCode`, not the display string.** `knowledge/flow-insurance-purchase.md:268` — "Insurer identity comes from `planCode`, not from [display name]." Confirms the SRD's own framing: the REQ-012–015 fix is cosmetic label-only, not a matching-logic change.
2. **The filter's value set and a known selector trap are already documented**, for the UCD side. `knowledge/flow-insurance-purchase.md:469-470` — `select[name=insuranceCompany]` values are `RHB`, `Takaful`, `Chubb`, `Lonpac`, `TokioMarine`; both selects carry `id="to-filter"`, so any script must filter by `name`, not `id`. Repeated in `knowledge/flow-ucd-shell.md:203-204` for the insurance listing screen specifically.
3. **Existing automation touches the UCD Insurance Enquiry screen already**, but not the filter or the name string. `scripts/eauto-e2e/pages/TransactionEnquiryPage.ts:19` navigates to `/view/ucd/insurance/enquiry/main.jsp`; line 72 reads an `'Insurance Company'` column label, line 96 stores it as `company`. Line 51 already excludes `Takaful|Insurance|Berhad` when parsing the insured person's name out of the same row — pre-existing awareness of the old "Berhad" string, not a test of it.
4. **No coverage at all for the BackOffice side.** No `flow-*.md` file and no `scripts/` page object reference a BackOffice Insurance Enquiry filter or result table. REQ-012 and REQ-013 have nothing written down anywhere in this repo — first-time testing, not regression.
5. **No coverage for the Insurance Dashboard chart** — the item the original ticket description names as also using the shared plan-code label, but which v1.1's REQ-012–015 do not mention. Not in `knowledge/`, not in `scripts/`. Open question, unresolved — see study section 7.
6. `knowledge/eauto-insurance.md` (full file, 310 lines) and `knowledge/cibo.md` were checked — neither covers insurer name display or the filter/result-table naming. CIBO is out of scope on this ticket per SRD Section 2.1.2, item 3, so `cibo.md`'s coverage gaps don't apply here.

**Net:** REQ-014 (UCD filter) has partial prior coverage — the selector trap and filter values are
known. REQ-012, REQ-013 (BackOffice filter + result table) and REQ-015 (UCD result table) have zero
prior coverage. Writing `knowledge/flow-eauto-insurance-enquiry.md` once test scenarios are drafted
would capture the BackOffice screen's DOM for the first time — currently undocumented.

## Files in this folder

- `EAINT-12175_SRD_v1.1_20260923.pdf` — the SRD, latest version, full 27 pages.
- `EAINT-12175-study.html` — the ticket study (local copy; also published as a Claude Artifact).
- `EAINT-12175-code-audit-prompt.html` — copy-button prompt for a code-reading chatbot, to identify every page/file touching the shared plan-code label (the REQ-012–015 blast radius) and confirm out-of-scope items are untouched.
