# EAINT-11757 — QA Team test script study (2026-10-27)

Written by the SharePoint Scribe (scheduled, unattended). Read-only study; no knowledge/ or lib/ file was changed.

## Sources read

1. **TS text copy** `_reference/sharepoint/qa-team-ts/EAINT-11757 - [eAuto-JomCheck] JomCheck API Integration with Credit Company.md` (text copy dated "27/10/2026, 7:58:05 pm"). The Read tool could not open this path (square brackets); its rows were read via Grep. Long rows Grep omitted were read from the bracket-free copy `_reference/inbox/eauto-flows-run/ts-text/EAINT-11757_-_eAuto-JomCheck_JomCheck_API_Integration_with_Credit_Company.xlsx.txt` (same cell text). **Row numbers below (R#) are the R-numbers of the qa-team-ts copy.**
2. **SRD text** `_reference/codebases/eauto-qa-azfar/cr/EAINT-11757/01-intake/raw/srd.md` (extracted from SRD v1.0, 20.07.2026). Read in part (sections 1.0–2.2.8 and grep hits).
3. **Another QA's ledger** `_reference/codebases/eauto-qa-azfar/cr/EAINT-11757/LEDGER.md` (written 2026-09-29).
4. **Not read:** the `.xlsx` itself (formatting, colours, comments not seen); the two `.docx` files in `_reference/codebases/eauto-qa-azfar/cr/EAINT-11757/00-input/` (read only through the SRD text extract); `api-spec.md` not opened.
5. **Repo context:** `knowledge/flow-jomcheck.md` §5 item 6 and line 2128; `knowledge/business-rules-from-test-scenarios.md` item 10; `knowledge/cr-test-scenario-catalogue.md` rows #002, #016; `knowledge/production-regression-scope.md`; `knowledge/environments-history.md`.
6. **Nothing found** in `_reference/tickets/EAINT-11757/` (folder did not exist), `_reference/tickets/Studying/EAINT-11757/` (does not exist) or `lib/ticketStudies.ts` (no match for 11757).

## 1. Header

1. **Ticket:** EAINT-11757 — "[eAuto-JomCheck] JomCheck API Integration with Credit Company".
2. **Module / portal:** new inbound **JomCheck Report Retrieval API** for credit companies. SRD §2.2.1 row 2: "Portal | N/A — system-to-system API integration"; row 3: "Module | JomCheck Report Retrieval (new Spring Boot service)". Admin side is a **partner console** ("Capabilities → JomCheck Report → Partners", "Credential audit"). Test data is prepared in the **UCD portal** JomCheck purchase flow.
3. **Workbook:** "EAINT-11757 - [eAuto-JomCheck] JomCheck API Integration with Credit Company.xlsx", library "eAuto - CR Test Scenarios", modified 27/08/2026, 12:33:01 pm.
4. **Sheets:** "Progress Tracker" (formula summary) and "Sheet1" (test cases).
5. **Scenarios on Sheet1: 44 test IDs** (TC-00a–00i, TC-01a, TC-01b, TC-02–TC-33 incl. TC-08b), in 10 sections (0–9), plus 7 free-text note rows (R59–R65).
6. **Result counts as written in Sheet1 Status column:**
   1. **PASS: 38**.
   2. **FAILED: 1** — TC-24 (R46).
   3. **N/A: 5** — TC-00g, TC-00h, TC-00i (R11–R13), TC-01b (R16), TC-28 (R51).
7. **Progress Tracker shows different numbers** (stale / formula gaps):
   1. "Total test cases (all) | 38" (R5), "N/A — no test required | 4" (R6), "In scope (to be tested) | 34" (R7), "Passed | 33" (R8), "Not run | 1" (R11), "Pass rate (of executed) | 1" (R13).
   2. **Failed shows 0** although TC-24 is failed. The formula is `COUNTIF(Sheet1!$H$5:$H$50,"FAIL")` (R9) but the cell says "FAILED", so it is counted as **Not run**. This is why "7 Rate limit" shows "3 | 2 | … | 1" (R23) and pass rate shows 100%.
   3. Section ranges stop at Sheet1 row 50; **section 9 (TC-29–TC-33, R53–R57) is not counted** in the tracker.
8. **Testers named in "QA" column:** two QA engineers — one on sections 0, 1, 2, 3, 5, 9 (provisioning, happy path, validation, auth, response content, document fields); another on sections 4, 6, 7, 8 (report lookup, link security, rate limit, E2E edge cases). TC-00g/h/i have no QA name. TC-28 QA = "Documented / Not Executable".
9. **Dates:** no execution dates in the sheet. Another QA's ledger states "fixVersion S33.5-20260914 (released 2026-09-14), Jira Done" (`LEDGER.md` table, row "Live").
10. **Environment (sheet):** "STAGING · console /v1/test/console · all cases runnable by QA alone (console + browser + core staging UI)" (Sheet1 R2).

## 2. What the ticket changed, as the TS shows it

1. **New API** for credit companies to pull a JomCheck report a UCD shared with them. TS endpoint: "POST /oapi/v1/jomcheck-report" (Sheet1 R16, TC-01b). SRD §2.2.3 writes "POST {BASE_URL}/v1/jomcheck-report".
2. **Request** carries `vehicleNo` and `ucdBrn` (R19–R20). **Response** is JSON with report data plus `documentUrl` and `documentUrlExpiresAt`; "PDF is NOT inside the JSON." (R15).
3. **Signed requests:** four headers "X-Client-Id, X-Key-Id, X-Timestamp, X-Signature" (R29); keys "RS256 · RSA-3072" (R7).
4. **New partner admin console:** "+ Provision a partner", "Generate keypair & provision", "Download .pem", "Confirm delivered & activate key" (R6–R8); Partners list (R9); "Credential audit" (R10); "Rotate" and "Revoke now" on signing keys (R11–R13).
5. **Tester console** at "/v1/test/console" that signs requests for QA, with an "Advanced → raw body override" (R2, R22).
6. **PDF download link** is a presigned URL with "?token=" (R56–R57).
7. **Rate limit** returning HTTP 429 (R46).

## 3. Scenarios

### Section 0 — Provisioning & partner setup (R4: "do this before Section 1; this is how you obtain real client_id / key_id / private key")

1. **TC-00a** (R5) — company not already a partner. Expected: "If the company already appears in the list with an ACTIVE client_id, STOP — do not provision again." PASS.
2. **TC-00b** (R6) — provision form. Expected: "'Display name' auto-resolves after the Core credit company lookup is selected (shows 'Resolves after lookup' until then). 'Generate keypair & provision' button becomes clickable." PASS.
3. **TC-00c** (R7) — save private key before confirming. Expected: "client_id, key_id, algorithm (RS256 · RSA-3072), and fingerprint are all shown on screen." PASS.
4. **TC-00d** (R8) — confirm & activate. Expected: "Key becomes ACTIVE. Navigating away or cancelling BEFORE this step must discard the credential entirely (no partial/orphaned client_id left in the system)". PASS.
5. **TC-00e** (R9) — Partners list row. Expected: "TYPE = CREDIT COMPANY, KEYS = '1 active', STATUS = ACTIVE." PASS.
6. **TC-00f** (R10) — Credential audit. Expected: "COMPANY_CREATED (if this was a brand-new core company link) and/or CREDENTIAL_ISSUED … with a fingerprint shown and keyAlgorithm = RS256." PASS.
7. **TC-00g** (R11) — Rotate asks for confirmation; old key "Expiring", new key "Active". **N/A**.
8. **TC-00h** (R12) — Revoke an Expiring key; other key unaffected. **N/A**.
9. **TC-00i** (R13) — Revoke the only Active key; real request "must FAIL/get rejected". **N/A**.

### Section 1 — Happy flow

1. **TC-01a** (R15) — full E2E: UCD buys report, shares to seeded company, API retrieves it. Expected: "HTTP 200 with report JSON including documentUrl and documentUrlExpiresAt. PDF is NOT inside the JSON." PASS.
2. **TC-01b** (R16) — report bought by **chassis number**, retrieved by **registration number**. Expected: "HTTP 200 with the correct report". **N/A**.
3. **TC-02** (R17) — PDF via link. Expected: "The PDF downloads/opens — no signing headers needed, plain browser GET works." PASS.

### Section 2 — Input validation (R18: "expect 400 for each")

1. **TC-03** (R19) — missing vehicleNo → "HTTP 400." PASS.
2. **TC-04** (R20) — missing ucdBrn → "HTTP 400." PASS.
3. **TC-05** (R21) — field over 20 chars → "HTTP 400. Any field over 20 characters is rejected." PASS.
4. **TC-06** (R22) — malformed JSON → "HTTP 400. Broken JSON is rejected." PASS.
5. **TC-07** (R23) — extra field → "HTTP 200 — extra fields are tolerated, request still processed." PASS.

### Section 3 — Auth failures (R24: "expect the SAME generic 401 every time · change ONE thing per test")

1. **TC-08** (R25) — garbage signature → "Generic HTTP 401. Response must not say why it failed." PASS.
2. **TC-08b** (R26) — real signature with one character flipped → "Generic HTTP 401 — same as TC-08, no hint about why it failed." PASS.
3. **TC-09** (R27) — timestamp 6 min past / 6 min future (automated script, not console) → "BOTH get rejected with the SAME generic 'authentication failed' message". PASS.
4. **TC-10** (R28) — unknown X-Key-Id → "Generic HTTP 401." PASS.
5. **TC-11** (R29) — each of 4 headers blank → "Generic HTTP 401 for every one of the four." PASS.
6. **TC-12** (R30) — body changed after signing → "Generic HTTP 401. The signature covers the raw body — any change breaks the seal." PASS.

### Section 4 — Report lookup (R31: "expect 404 · all data seeded by YOU in core staging UI as a UCD")

1. **TC-13** (R32) — shared to a different company only → "HTTP 404 — a report shared to someone else is invisible to you." PASS.
2. **TC-14** (R33) — report not Approved → "HTTP 404 — only Approved reports are returned." PASS.
3. **TC-15** (R34) — wrong ucdBrn → "HTTP 404." PASS.
4. **TC-16** (R35) — two Approved reports → "HTTP 200 with the most recently created report". PASS.

### Section 5 — Response content (R36)

1. **TC-17** (R37) — every field matches source report → "Every value in the JSON matches the source report exactly (pass-through, no reformatting)." PASS.
2. **TC-18** (R38) — claims match → "Same number of claims, same values per claim, correct accidentCount and maxSeverity — nothing missing, nothing extra." PASS.
3. **TC-19** (R39) — missing optional data → "HTTP 200; missing fields show as null or empty — no error, no crash. Odd date formats are pass-through, NOT bugs." PASS.
4. **TC-20** (R40) — no PDF blob → "Only documentUrl is present — the PDF is never embedded." PASS.

### Section 6 — Document link security (R41: "done in the browser address bar")

1. **TC-21** (R42) — edited id/expiry in link → "Rejected (401/410) — editing anything in the link kills it." PASS.
2. **TC-22** (R43) — link pointed at another doc id → "Rejected — must NOT return someone else's PDF." PASS.
3. **TC-23** (R44) — expired link (dev-minted short TTL) → "Expired link returns 401/410; a fresh report request is needed for a new link." PASS.

### Section 7 — Rate limit (R45)

1. **TC-24** (R46) — burst past limit → "HTTP 429 once the limit is exceeded." **FAILED** (no remark written).
2. **TC-25** (R47) — PDF while rate-limited → "PDF download still works while report calls are 429 — the limit does not apply to downloads." PASS.
3. **TC-26** (R48) — recovery after window → "HTTP 200 — the limit resets." PASS.

### Section 8 — E2E edge cases (R49: "sharing is OPTIONAL in the portal")

1. **TC-27** (R50) — paid, Approved, shared to nobody → "HTTP 404 — an unshared report must be invisible to every credit company". PASS.
2. **TC-28** (R51) — HTTP 500 → "[Documented gap, not an executable test]". N/A.

### Section 9 — Report document field constraints (R52: "Table 9 (documentUrl / documentUrlExpiresAt)")

1. **TC-29** (R53) — documentUrl → "Type = string, length ≤ 2048, and it parses as a well-formed URL." PASS.
2. **TC-30** (R54) — documentUrlExpiresAt → "Type = string, length ≤ 20" in format "YYYY-MM-DDTHH:MM:SSZ (e.g. '2026-07-02T08:15:00Z')". PASS.
3. **TC-31** (R55) — one char flipped inside token → "401 or 410 — NOT 200." PASS.
4. **TC-32** (R56) — token removed → "401 or 410 — confirms there's no fallback/default behavior when no token is presented at all." PASS.
5. **TC-33** (R57) — empty token "?token=" → "401 or 410". PASS (sheet does not record whether it behaved the same as TC-32).

## 4. Business rules and system behaviour the TS reveals

1. **Replication lag:** "Freshly shared reports may 404 briefly (replication lag) — wait & retry before logging a bug." (Sheet1 R2, golden rule 1). TC-01a: "Wait ~2 min (replication)." (R15).
2. **One generic 401 for all auth failures:** "Every auth failure = identical generic 401, and earlier checks mask later ones — change ONE thing per test." (R2, golden rule 2).
3. **Console errors are not API results:** "A console error (e.g. 400 UNKNOWN_SIGNING_CLIENT) is the console failing to sign, NOT an API result." (R2, golden rule 3).
4. **Unknown key fails first:** "unknown key fails BEFORE the signature is checked — it looks identical to TC-08. That's expected." (R28).
5. **Signature length:** "A REAL signature here is always exactly 512 characters (RSA-3072 → 384 bytes → 512 base64 chars)." (R25, remarks).
6. **5-minute window:** "the system only accepts requests sent within the last 5 minutes" (R27). SRD §2.2.7 item 2: "Requests outside a ±5-minute timestamp window are rejected."
7. **Only Approved + shared + matching dealer reports return.** TC-13, TC-14, TC-15, TC-27 all 404 (R32–R34, R50). Newest wins when two qualify (R35).
8. **Sharing is optional** in the UCD purchase flow: "tick NO company at all — sharing is optional" (R50).
9. **Field limit:** "Any field over 20 characters is rejected." (R21). Extra fields allowed (R23).
10. **Pass-through data:** "Odd date formats are pass-through, NOT bugs." (R39). SRD §2.1.1 out-of-scope item 5: "Provider strings are passed through as-is unless separately agreed."
11. **Link expiry baked into token:** "the expiry is baked INSIDE the signed token — patching a date in the DB won't change an already-issued URL, so dev must ISSUE the link, not edit data." (R44). Fallback: "open TC-01's link on day 6 (works) and day 8 (dead)." (R44). SRD §2.2.8: "valid for 7 days after issue; after expiry, a new report request is required".
12. **Link path is ignored, only the token counts:** "TC-21/22 tested the path, which we now know is ignored — so this fills the real gap." (R55). **This contradicts TC-21's expected "editing anything in the link kills it" (R42), which is still marked PASS.** [unconfirmed] whether TC-21 edited the path or the token.
13. **Rate limit does not cover downloads:** "the limit does not apply to downloads." (R47, PASS).
14. **Private key is shown once:** "leaving/cancelling before this step discards the key permanently with no way to recover it, requiring a full re-provision." (R8).
15. **ID prefixes:** "does the CLIENT_ID you pasted actually start with 'cli_' and the KEY_ID with 'key_'?" (R7).
16. **Audit actor:** entries "attributed to the correct actor (admin:<your username>, not 'superadmin' if you used a named operator account)" (R10).
17. **Rotation keeps old key working for a while:** "the old key's status changes to 'Expiring' (it still works for a while, doesn't vanish)" (R11). **Not executed (N/A).**
18. **500 not testable by QA:** "no controlled way to force this from the outside as a black-box API tester" (R51).

## 5. Test data, environments, accounts, setup

1. **Environment:** staging, tester console "/v1/test/console" (R2). `knowledge/environments-history.md` line 58 lists 11757 among JomCheck CRs on **uat3** on 2026-08-05 (Huddle Agenda).
2. **Credit companies named:** "ELK-Desa Capital Sdn Bhd" (R5), "Angkasa Credit Sdn Bhd (a test-only partner, never a real one)" (R11), "Brightway or ELK-Desa" (R16), "YI LINK TEST SDN BHD is the likely candidate" as seeded company (R15), "ABC SAMPLE SDN BHD" as the other company (R32).
3. **Vehicles:** "PLU530" (R22 body); "TAX5311/Brightway" (R53).
4. **Fake values:** "key_unregistered_999" (R28); "this-is-not-a-real-signature==" (R25); 21 × "A" vehicleNo (R21).
5. **Keys:** private keys stored as .pem in "your project's test-keys/ folder" (R7). Sheet suggests saving CLIENT_ID / KEY_ID / FINGERPRINT in "a 'Partners' tab in this same workbook" (R7); **no such tab exists** in this copy. **No credentials present in the sheet.** One real signature is quoted truncated: "tZResTR5wYnnfetYeZ0Twk99tyTQllzmunB5oGMS...JqP1RpI9jD" (R26) — a signature, not a key.
6. **Dev help needed:** lower rate limit "e.g. 5/min" (R46); mint short-TTL link (R44); confirm seeded checkbox (R15).
7. **TC-09 runs as an automated script**, not by hand (R27); depends on the test PC clock (R27 remark).

## 6. Gaps or risks a regression should still cover

1. **TC-24 rate limit FAILED** (R46) with no remark and no linked bug in the sheet. TC-25/TC-26 (R47–R48) are marked PASS though both start "While rate-limited from TC-24" / "After hitting 429 in TC-24" — their result is questionable [unconfirmed]. Note R61: "performance test to verify 429 code , check the limit / load with dev".
2. **Key rotation and revocation never executed** (TC-00g/h/i N/A). SRD §2.2.7 item 3 requires "A revoked key_id is rejected; the partner's other keys continue to work." Sheet R2 also lists "revoked key" as out of scope.
3. **Chassis-purchased report (TC-01b) N/A**, yet another QA's ledger lists bug "EAINT-12154 chassis-purchased report 404 by reg no." (`LEDGER.md`, "What I FOUND"). Fix status unknown here [unconfirmed].
4. **Other bugs from this TS per the ledger:** "EAINT-12127 latestMileageDate longer than documented; EAINT-12128 vehTrim empty". Sheet TC-17–TC-19 show PASS with no remark of these [unconfirmed which run found them].
5. **Out of scope by design** (R2): "logs & PDPA, audit, keystore, TLS, revoked key, true cross-company isolation, timeouts, prod hardening."
6. **TC-21 vs TC-31 contradiction** (see §4 item 12): the path is ignored, so tampering the path proves nothing.
7. **TC-33** did not record whether empty token behaves like missing token (R57 asks for it).
8. **Open note rows never answered** (R59–R65):
   1. "login to service portal > will call the same API exist?if yes, will share the 5mins cooldown?" (R59).
   2. "to double check field under response body is existing or new?" (R60).
   3. "500 how to test" (R62); "expired - to prep more data" (R63).
   4. "compare pdf report in system  (prod & staging) & downloadurl from api" (R64).
   5. "auditlog can view which cc trigger the API?" (R65).
9. **Production:** `knowledge/production-regression-scope.md` line 607: "Not testable: EAINT-11757 credit-company API `[from Deployment Checklist, 20260914 R48]`". No prod check exists.
10. **Future change risk:** ledger quotes EAINT-12339 SRD §2.1.3: "eAuto JomCheck API requires changes as well. This is not covered under this Change Request and will be raised in the next round." Claim fields may change after ezAuto v2.0.

## 7. Where this differs from existing knowledge

1. `knowledge/flow-jomcheck.md` §5 item 6.3 and `knowledge/business-rules-from-test-scenarios.md` item 10.3 state rotation ("old key 'Expiring', new key 'Active'") and revoke ("must actually fail") as rules from rows 11–13. **In the sheet those rows are N/A — expected results only, never executed.** They should be tagged as untested.
2. Both files cite "SharePoint TS #001 EAINT-11757, sheet 11757 JomCheck API, row 6" for the generic 401. `knowledge/cr-test-scenario-catalogue.md` row #002 describes that file as "Header only". This workbook confirms the rule independently at Sheet1 R2 and R24.
3. `knowledge/cr-test-scenario-catalogue.md` row #016 says "38 TC, 34 in scope". The Sheet1 now holds **44 test IDs** (section 9 and TC-08b, TC-28 added); 38 is the tracker's fixed value, not a live count.
4. TS endpoint "/oapi/v1/jomcheck-report" (R16) vs SRD "POST {BASE_URL}/v1/jomcheck-report" (§2.2.3) — likely `/oapi` is the base path [unconfirmed].

## Knowledge candidates

1. **Credit-company API — replication lag.** "Freshly shared reports may 404 briefly (replication lag) — wait & retry before logging a bug." `[from SharePoint TS EAINT-11757, Sheet1 R2]`. Target: `knowledge/flow-jomcheck.md` §5 item 6.
2. **Lookup rules.** 404 when shared to another company only, not Approved, wrong ucdBrn, or not shared at all; newest Approved wins. `[from SharePoint TS EAINT-11757, Sheet1 R32–R35, R50]`; SRD §2.2.5 items 1–2.
3. **Input rules.** "Any field over 20 characters is rejected." (R21); extra fields "tolerated" (R23).
4. **Download link.** Path ignored, only token checked: "TC-21/22 tested the path, which we now know is ignored" (R55). Expiry inside token; SRD §2.2.8 "valid for 7 days after issue". Downloads not rate-limited (R47).
5. **documentUrl contract.** "length ≤ 2048" (R53); documentUrlExpiresAt "YYYY-MM-DDTHH:MM:SSZ", "length ≤ 20" (R54).
6. **Tester console trap.** "A console error (e.g. 400 UNKNOWN_SIGNING_CLIENT) is the console failing to sign, NOT an API result." (R2). Target: a traps section.
7. **Partner provisioning facts.** IDs start "cli_" / "key_" (R7); private key shown once, cancel discards it (R8); audit events COMPANY_CREATED / CREDENTIAL_ISSUED (R10).
8. **Correction for existing knowledge:** tag rotation/revoke behaviour (rows 11–13) as **not executed — N/A in TS** in `flow-jomcheck.md` §5.6.3 and `business-rules-from-test-scenarios.md` 10.3.
9. **Open defect status:** TC-24 rate limit FAILED (R46); bugs EAINT-12127, 12128, 12154 per `_reference/codebases/eauto-qa-azfar/cr/EAINT-11757/LEDGER.md`. Status to confirm before citing.
10. **Tracker formula trap (all team workbooks of this shape):** Status "FAILED" is not counted by `COUNTIF(... "FAIL")` (Progress Tracker R9), so failures show as "Not run". `[from SharePoint TS EAINT-11757, Progress Tracker R9, R23]`.
