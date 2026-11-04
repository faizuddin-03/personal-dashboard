# EAINT-12028 — QA-Issue draft: Audit Log (2026-11-02) — NOT CREATED

1. **Parent:** EAINT-12028. **Type:** QA-Issue. **Env:** staging/uat1. **Duplicate check (JQL, 2026-11-02):** only EAINT-12716 exists under the parent (menu link visible without role). Not a duplicate.
2. **Title:** [eAuto - BackOffice] Audit Log on Details page shows Role/Action in capitals and When in a different date format
3. **ADF description:** EAINT-12028-qa-issue-draft-auditlog-20261102.json (same folder).
4. **Sources:** live "<td>DRAFTER</td> ... <td>APPROVE</td>" and "<td>02 Nov 2026 15:36</td>" (_reference/html/eauto/bo-association-payment-listing-details-sep-2026-approver-audit-log-3-rows.html, Audit Log); mock-up line 519 "addLog(m,'Drafter','Approved (signed)','',signatures['Drafter'])"; mock-up nowStr() builds "dd-mm-yyyy hh:mm"; SRD v1.1 REQ-015 "Log "Drafter — Approved" with date/time and signature."
5. **Left out as told:** Actor column, Pending/Approved status words.
6. **Open before create:** priority, Developer, evidence screenshots (original only), QA field = Faizuddin.
