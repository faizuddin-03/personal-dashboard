# EAINT-12745 C2C — Test Scope (compiled 2026-11-06)

**What:** new UCD-portal module, **individual seller (customer) → individual buyer (customer)**, motorcycle only, one transaction. Mirrors the **P1 modules STMS + eSTM**, with a **new JPJ enquiry / submission** (new IDD).
**Deadline:** MOT / JPJ staging demo **17.11.2026**.
**Rule (Faizuddin, 2026-11-06):** mockup = **flow only**; **every UI expected result follows existing STMS / eSTM / add-on behaviour**.
**Rule:** **no dealer / UCD thumbprint anywhere.** Two thumbprints, both customers: **seller at Step 1, buyer at Step 2.**

## 0. Decisions (Faizuddin, 2026-11-06)

1. **Seller add-ons IN.** LKM Refund + Insurance Cancellation confirmed in the meeting → group L is in scope.
2. **C2C = the two customer halves.** STMS = seller (customer) sells **to** dealer; eSTM = dealer sells **to** buyer (customer). C2C takes the **customer side of STMS** (seller thumbprint, selling the vehicle) + the **customer side of eSTM** (buyer thumbprint, paying, ownership transfer). The dealer is only an intermediate; no dealer side is reused. Step numbers in the notes ("eSTM Step 3") may be wrong — **customer side wins**: buyer screen = eSTM **Buyer (Customer)** authentication.
3. **Triggers move.** Shortening 6 → 4 steps changes when and where JPJ enquiry, insurance redirect, etc. fire. **Expected values: SRD / Teams / any black-and-white source first; if none, the logical flow.** Updates to come from Faizuddin.
4. **IDD not confirmed.** Write expected values from what is confirmed now, even if vague; refine when new information arrives.

Sources (raw): `README.md`, `EAINT-12745-meeting-notes-2026-11-05.md` [notes], `EAINT-12745-transcript-findings-2026-11-05.md` [rec], mockup html [mockup], Jira description [jira].
Sources (knowledge): `flow-stms.md`, `flow-stms-addons.md`, `flow-estm.md`, `flow-insurance-purchase.md`, `eauto-insurance.md`, `flow-quotation-reminder.md`, `jpj-xml-log.md`, `esim.md`, `flow-payments-fees.md`, `eauto-payments.md`, `flow-bo-shell.md`, `flow-ucd-shell.md`, `flow-platform.md`, `mykad-emulator.md`, `production-regression-scope.md`, `data-verification-standard.md`, `mailtrap.md`, `business-rules-from-test-scenarios.md` [BR].
Planned flow: `knowledge/flow-c2c.md`.

---

## 1. Affected areas

1. **UCD Portal — new C2C module** (tile, landing, create, listing, details).
2. **UCD Portal — home page** (new tile right after UCD TO UCD).
3. **Reused STMS Step 1** — seller Perakuan, MyKad + thumbprint, vehicle no. [notes "C2C step 1 - STMS Step 1"]
4. **Reused STMS Step 2 fields** — seller contact + vehicle details (merged into C2C Step 1).
5. **Reused eSTM customer side** — Buyer (Customer) authentication: buyer Perakuan, MyKad + thumbprint, eVOC email, buyer contact; plus payment and ownership transfer.
6. **Add-ons:** Insurance, e-LKM, e-VOC (buyer side, ticked before JPJ). **LKM Refund + Insurance Cancellation (seller side) — confirmed in.**
7. **Insurance module** — 69E redirect, quotation, purchase, skip; post-approval purchase within 30 days.
8. **New JPJ integration** — C2C enquiry, re-enquiry, final submission; new IDD; eSIM simulation.
9. **Payment** — RHB debit, fee rows, tax, duplicate-click guard, failure / reset.
10. **Documents** — Invoice, e-Invoice, JPJ Official Receipt, Slip Pengesahan (both Perakuan = customers), eVOC email.
11. **Back Office** — transaction listing / details / CSV, Support Tools (edit, cancel, reset, resubmit JPJ), JPJ XML Log, reports, reconciliation, JPJ Hasil, roles, audit logs.
12. **Notifications** — customer "transaction completed", eVOC email, JPJ receipt email.
13. **Platform** — Dermalog / MyKad WebSocket, browsers (Chrome 139, Edge 139, Firefox 36.0.4 applet).
14. **Regression** — STMS, eSTM, UCD TO UCD, Insurance, LKM Refund, Insurance Cancellation must stay unchanged.
15. **Mobile app** — Jira "to be confirmed, not assumed". Out until confirmed.

---

## 2. Flow under test (4 steps) [notes]

1. **Step 1 — Seller Thumbprint & Vehicle & Contact Details** (STMS Step 1 + STMS Step 2 fields).
2. **Step 2 — Buyer Thumbprint & Optional Services** (eSTM buyer auth + add-on ticks, no prices).
3. **Step 3 — JPJ Check & Payment Summary** (enquiry, 69E branch, add-ons still tickable, pay).
4. **Step 4 — Transfer** (final submission, outcome, documents).

---

## 3. Test scope by area (TS groups + estimated count)

Counts are estimates for sizing; one row = one TS unless stated.

### A. Portal entry and access (~12)
1. Home tile **C2C** shown **right after UCD TO UCD**; icon, text and price style follow existing tiles.
2. Tile opens C2C landing: **Transaction Listing** and **Create New Transaction**.
3. User guide link(s) open (existing STMS guide pattern, "cdn" URL) [BR:917].
4. Permission **user level: all users, no permission needed** — main user ✓, sub user ✓ [notes].
5. Permission **state level: all states allowed** [notes].
6. Permission **company level: TBC** — placeholder TS.
7. **Transaction Restriction = Yes** blocks create / resubmit: "You are currently restricted from …" (existing wording) [flow-ucd-shell:257].
8. Existing home blocking dialogs still apply (JPJ blacklisted, owner record missing, under 18).
9. Company with **no RHB Islamic account** — follows existing STMS/eSTM rule.
10. Direct URL to C2C pages without login → login page.
11. Listing scoped to the signed-in company; other UCD cannot see / open the record.
12. Session timeout mid-flow — follows existing.

### B. Category selection (~5)
1. **MyKad** offered (seller and buyer).
2. **MyPR** offered (seller and buyer).
3. **Company / SYARIKAT not offered** [notes].
4. Foreigner and Association **not offered** (existing STMS rule).
5. Confirm dialog Yes / No — follows existing STMS.

### C. Step 1 — Seller Perakuan + thumbprint (customer) (~22)
1. **Perakuan expanded on load; collapses after tick** [notes] — new behaviour.
2. **Thumbprint section hidden until Perakuan ticked** (STMS rule) [flow-stms:32].
3. **Ticked Perakuan cannot be unticked** (STMS rule) — confirm for C2C.
4. Vehicle No. field inside Perakuan; value mirrors into readonly field and Perakuan placeholders.
5. Perakuan text = **legal pending**; placeholder TS. Must not contain UCD-Berdaftar / company / 6-month APT wording.
6. Happy path: MyKad read → "Place Thumb on reader" → **Identical** → Next shown.
7. MyPR card happy path.
8. No device: "Please plug in Dermalog Biometric Device and click [Reconnect]".
9. Device unplugged while reading: "Unable to read photo. Please try again."
10. No card: "No card is detected. Please insert IC and click [Scan IC] to try again."
11. Non-MyKad card with chip / without chip ("No card is detecetd … [Read IC]" typo).
12. Card removed after good read → thumbprint still passes.
13. Thumbprint **Not Identical** → Next stays hidden (wording to capture live).
14. Thumbprint **Image quality too low** (wording to capture live).
15. Replayed / old scan rejected by server.
16. **Seller card ≠ vehicle owner** → blocked (wording: gap; JPJ VEL000008E "owner does not match").
17. **UCD user's own IC as seller** — expected? (gap; ask BA).
18. WebSocket fails → "Update Required - Dermalog Biometric Device".
19. Cancel → back to category page.
20. Chrome 139 WebSocket.
21. Edge 139.
22. Firefox 36.0.4 applet.

### D. Step 1 — Seller contact + vehicle details (~16)
1. Mobile No.: mandatory, format, max length (follow existing STMS/eSTM).
2. Email: mandatory, format.
3. **Address from IC** [rec 14:09] — prefilled / follows existing "Same as MyKad".
4. Mobile / email of **main user or any sub user of same UCD** → blocked (STMS rule).
5. Same mobile / email **> 3 uses in 30 days** → blocked.
6. **Vehicle Type shows "Motorcycle" only, default Motorcycle; no "Car"** [notes].
7. **Vehicle Make & Model typed in by UCD** (no dropdown for now) [notes].
8. Engine / Chassis: **max 60 chars**; valid special chars "/ * - space" [flow-platform:221].
9. Manufacturing Year validation.
10. Paste-block / "~" strip behaviour — follows existing.
11. **Duplicate vehicle + owner**: "Transaksi yang sama untuk kenderaan dan pemilik ini telah direkod sebelum ini…".
12. Empty mandatory fields → existing validation messages (capture live).
13. "Sure to continue?" confirm on Next.
14. **Save & Continue available after Step 1 complete** [notes "after Seller done step 2"].
15. **Save & Continue hidden in the 17.11 demo build** [notes].
16. Motorcycle body type from JPJ (MSL) vs typed "Motorcycle"; **car body (MKR) blocked** — Jira "Validate the vehicle category against the authoritative vehicle response".

### E. Step 2 — Buyer Perakuan + thumbprint + contact (customer) (~28)
1. Buyer Perakuan: expand → collapse on tick; thumbprint hidden until tick; locked once ticked.
2. Order: vehicle no / eVOC email → tick consent → MyKad (eSTM rule) [flow-estm:1145].
3. Buyer MyKad + MyPR happy paths.
4. Dermalog messages C8–C15 repeated for buyer (no device, unplug, no card, non-MyKad, removed, Not Identical, quality, replay).
5. **Buyer IC = seller IC** → blocked? (gap; ask BA).
6. **Buyer = UCD user** → allowed? (gap).
7. **No UCD / dealer thumbprint step exists anywhere** — negative check.
8. **Email (to receive eVOC)** mandatory.
9. **Reconfirm eVOC Email** must match.
10. Buyer Email must differ from eVOC email: "Please enter Buyer's Email Address." (eSTM rule).
11. Buyer email 3 uses / 30 days: "Email address has reached its max number (3) of usages within the last 30 days".
12. Mobile No. maxlength 11, 3-uses rule.
13. Mailing address 1–3 maxlength 30; Postcode maxlength 5; State / District dropdowns.
14. "Same as MyKad" address.
15. **Buyer phone, email, address all required** [notes].
16. Chrome / Edge / Firefox 36 for buyer thumbprint.
17. **Two customer reads, same device, one transaction** — seller then buyer.
18. Card **ejects after seller read**; Step 2 starts with "No card is detected…" / "Please insert MyKad into the reader." — never reuses seller card data [flow-platform:98].
19. **Replay of the seller's signed scan at the buyer step → rejected** (one-use signature, biometriclog) [mykad-emulator:426-431].
20. **Scan older than the time window (30 min) rejected** — matters when Save & Continue separates seller and buyer by days.
21. Interruptions between reads: unplug after Step 1, unplug during buyer read, remove card mid-read, reader service closed, page refresh at Step 2.
22. Resume next day / different PC → **seller verification kept, never re-asked**; Step 2 Next blocked until buyer read passes.
23. Back navigation: **cannot return to Step 1** after seller thumbprint [rec 50:56] — unconfirmed.
24. Wait style: seller screen "Scan IC" waits; buyer screen auto-reads (10 s no-card timeout) — check both behaviours.

### F. Step 2 — Optional services before JPJ (~10)
1. Insurance / e-LKM / e-VOC checkboxes shown **before JPJ enquiry** [notes].
2. **No prices shown**; wording "refer amount after JPJ Enquiry" instead [notes].
3. Default tick state (eSTM pre-ticks eLKM + eVOC; C2C notes "user ticks") — gap.
4. Combinations Insurance × eLKM × eVOC: **8 TS** (each carried to Step 3).

### G. Step 3 — JPJ check (new C2C enquiry) (~18)
1. Result labels: Valid As At, Blacklisted, Hak Milik Dituntut, Condition Code, JPJ Enquiry Status, Response Code (existing).
2. **OK (GLB000000I)** → payment summary shown.
3. **Blacklisted** → blocked.
4. **Hak Milik Dituntut (4K)** → Failed, "JPJ Enquiry Failed : HAK MILIK DITUNTUT".
5. **Condition code** → blocked.
6. **Owner mismatch (VEL000008E)**.
7. **Invalid vehicle no (VEL000001E)**.
8. **Not a motorcycle (body MKR / car)** → blocked [jira].
9. **Usage code AH** shown only when JPJ returns it.
10. **JPJ timeout** (eSIM Delay 10000 / 20000 / "jpjtimeout").
11. Other error codes (VEL/GLB/REF/REV/ENF…E) → "JPJ Enquiry Failed: <desc>".
12. Failed → **[Resubmit]**, no Make Payment.
13. Error → disabled; **refresh lets user try again** [rec 1:14:44].
14. Status **Pending** at enquiry start; **Failed** on error.
15. **No back navigation** after JPJ enquiry [rec 51:58].
16. eLKM / eVOC **unavailable** → system unticks, dropped from summary [notes].
17. Re-tick eLKM → new JPJ enquiry [notes].
18. Sub UCD **eLKM > RM2,000.00** → "Maximum LKM Amount RM2,000.00 per transaction, unable to proceed." (eSTM rule).

### H. Insurance — checkbox, 69E and trigger points (~24)
Existing eSTM trigger points (flow-quotation-reminder §3): **(1)** Get Free Quote, **(2)** eSTM eLKM unticked → redirect after completion, **(3)** "GET FREE QUOTE FOR <plate>" banner on details, **(4)** 69E (VEL000069E) redirect with "Skip, Return to eSerahan", **(5)** reminder email "Complete Purchase Now".
**Key difference:** eSTM redirects **after payment (Approved)**; C2C redirects **at JPJ check, before payment**, re-enquires on Proceed [notes, rec 1:10:48]. Ask BA to confirm (ordering conflict).

1. **Happy 1:** Insurance ✓ + eLKM ✓, no 69E → insurance quotation → Step 3 summary shows eLKM.
2. **Happy 2:** Insurance ✗ + eLKM ✓, no 69E → summary shows LKM amount.
3. Insurance ✓ + eLKM ✗, no 69E → quotation only.
4. Insurance ✗ + eLKM ✗, no 69E → no insurance, no eLKM.
5. **Insurance ✗ + eLKM ✓ + 69E** → redirect to insurance step 1; existing banner "The vehicle is eligible for road tax renewal, but no valid motor insurance found…" + Skip button.
6. — **Proceed** + purchase completed → JPJ re-enquiry → eLKM amount → summary.
7. — **Skip** → summary **without eLKM** [notes].
8. — Proceed, abandon at insurance step 1 / 2 / 3 (step 3 leaves PENDING "Pending Payment" row).
9. Insurance ✓ + eLKM ✓ + 69E (gap: separate redirect or not).
10. Insurance ✗ + eLKM ✗ + 69E (gap: redirect without eLKM?).
11. Insurance ✓ + eLKM ✗ + 69E (gap).
12. **Quotation not available** → "Drop it"; existing #insError "We're unable to retrieve an insurance quotation…".
13. Some insurers quote, others not → only quoted cards.
14. Summary row when no quotation: **drop vs disable** — open.
15. Insurance amount as a C2C summary row vs paid on insurance step 3 — gap.
16. After Skip, re-tick Insurance / eLKM at Step 3 → triggers 69E again? (gap).
17. 69E path shows **all insurers** (FI flow); motorcycle = **Comprehensive only**, All Riders pre-ticked.
18. Quote and C2C share the **buyer IC**.
19. Chubb TIN on the 69E path (hidden) vs after approval (mandatory).
20. Insurance director gate (#allow-insurance-dialog) / non-director "You are not allowed to use the module." — applies in C2C?
21. Reminder email for a C2C-sourced quotation — sent or not (69E quotes get none today).
22. Insurance listing statuses for C2C quotes: Quotation / Pending Payment / Insurance Created / Failed / Quotation Expired.
23. Quotation expiry 24 h.
24. Insurance record also visible in **CIBO** (third check after UCD and BO).

### I. Step 3 — Payment summary and payment (~18)
1. Rows: C2C fee (**TBC**), JPJ fee, add-on rows, service tax 8%, total — follow existing eSTM layout.
2. **Seller refund entitlement shown separately, not deducted** [jira, mockup].
3. Only ticked + available add-ons appear [notes].
4. Untick / re-tick add-on at Step 3 → fee re-enquiry; amount change → "Sure to make this payment now?".
5. Confirm chain: "Sure to continue?" → "Sure to proceed with payment?" → "Sure to make this payment now?".
6. "Payment is in process. Please do not refresh or close the browser."
7. **Double-click Pay** → one debit only (button disabled) [jira].
8. Two tabs / two dialogs → one debit (SSM double-charge precedent).
9. RHB **OK**.
10. RHB **IF** "Wang di dalam akaun RHB anda TIDAK MENCUKUPI."
11. RHB **RE** 6-minute wait; **ER** 12-minute cooldown.
12. RHB **NP** maintenance 10.30pm–8.30am.
13. Payment failed → listing **Retry**; same-day retry = same reference.
14. Next-day retry → "RHB ERROR-RE" until **BO Reset Payment**.
15. BO Reset: "Sure to reset payment for <vehicle>?" → Payment "-", Tx Pending.
16. Payment references per product (C2C / eLKM / eVOC) on details; Ref 2 suffix (gap).
17. Interrupted payment (close browser) → reference + outcome preserved [jira].
18. Sub-user without payment rights (Valuation Advisor) — follows existing.

### J. Step 4 — Transfer and outcomes (~16)
1. Final submission only after all checks + payment pass [jira].
2. **Success → shown only after confirmed transfer**; JPJ reference recorded.
3. Pending / Failed / Approved distinguished on screen and listing.
4. Final submission failed per product: C2C / eLKM / eVOC.
5. eLKM failed after payment: "Harap maaf, permohonan LKM anda gagal…".
6. Cron resend for Pending (patched) transactions.
7. **Ownership goes seller → buyer directly, no UCD in between** — check JPJ submission fields + documents.
8. **Invoice** (service-charge line text — gap) and **e-Invoice** (valid TIN, current month).
9. **JPJ Official Receipt** (file name pattern, email to UCD + receipt@eauto.my).
10. **Slip Pengesahan** — Perakuan Penjual + Perakuan Pembeli, **both customers**, no UCD Perakuan.
11. Slip with eLKM → TEMPOH SAH LESEN KENDERAAN MOTOR table.
12. Perakuan version lock on resumed transaction.
13. **eVOC email** sent to eVOC email (Mailtrap).
14. eLKM details: amount, effective / expiry date, eLKM Tx No.
15. Browser Reminder at final step (Firefox < 37) — follows STMS/eSTM.
16. Done → details page.

### K. Save & Continue, statuses, listing, details (~14)
1. Statuses: **Pending, Cancelled, Expired, Failed, Approved** [notes].
2. Save & Continue → listing row, resume continues from **Step 2**, not Step 1.
3. **7-day expiry from created date** (pending management) — day 7 / day 8 boundary.
4. Expired → "expired" message, no continue [jira].
5. Saved status + expiry date/time shown in listing and application [jira].
6. Listing: "Please apply search to show the record."; filters (vehicle, transaction no, one-month date range, status, add-on statuses).
7. Listing columns — follow eSTM pattern (JPJ Check, Payment, JPJ Transfer, Tx Status, e-Invoice, eLKM / eVOC columns, Remarks, Action).
8. Actions: View / Resubmit / Retry by status.
9. Details page: seller block (customer), buyer block (customer), vehicle, JPJ Enquiry attempts, payments, add-ons, documents.
10. Unique C2C reference links seller, buyer, vehicle, payment, JPJ response, add-on refs [jira].
11. Cancel transaction (UCD side) — allowed? (gap).
12. Duplicate active application for same vehicle — rule (Jira 6g open).
13. Resubmit after JPJ failure / payment failure routes to the right step.
14. Hidden Save & Continue in demo build does not break resume of older drafts.

### L. Seller add-ons — LKM Refund + Insurance Cancellation (~16, **confirmed in, 2026-11-06**)
Placement in the 4-step flow (STMS has them at Step 5 payment): **logical flow** = offered with the seller at Step 1, finalised in the Step 3 payment summary; refine when SRD / Teams says otherwise.
1. LKM Refund shown only when refund ≥ **RM5.00** (boundary RM4.99 / RM5.00).
2. Fee bands RM0 / 5 / 10 / 35 / 50; tax 8%.
3. Permission / state / band re-check at payment.
4. Pop-up: State, PTJ, Seller Name (readonly), Bank, Account No (4–30 digits).
5. Documents: Copy of IC + Bank Statement, 5MB, AI check; e-signature on 3 documents.
6. LKM submission success / fail messages; statuses In Progress / Refund Done / Rejected.
7. Insurance Cancellation: Runnerku eligibility, RM38 + 8% = RM41.04, documents, statuses.
8. Order: C2C payment → JPJ → LKM payment → LKM submission → IC payment → IC submission.
9. Refund shown separately from payable.

### M. Post-approval insurance within 30 days (~7)
1. Approved C2C, no insurance → "GET FREE QUOTE FOR <plate>" on details (existing banner + YES/NO dialog).
2. Day 30 allowed; **day 31 blocked** (wording gap).
3. Insurance already bought in C2C → no banner / "UCD cannot get Insurance Quotation".
4. 69E-skipped C2C → banner shown after approval.
5. Get Free Quote for the C2C vehicle — approved C2C counts as approved eSTM? (gap).
6. Chubb TIN mandatory after approval.
7. Lands on insurance step 1, skipping the quote form.

### N. Notifications (~6)
1. Customer notified on completion "your transaction has been completed" [rec]. eSTM already sends buyer completion **email + WhatsApp** via eauto-notification (Ask eAuto) — C2C follows; seller notification and wording: gap.
2. eVOC email to buyer.
3. JPJ receipt email (UCD main email + receipt@eauto.my; systemtest@eauto.my on JPJ staging).
4. **Buyer details to seller** — PDPA open; TS once decided.
5. Test emails use **@testingz.com**; never @modefair.com with JPJ / RHB staging.
6. Mailtrap: exactly-one count per email.

### O. JPJ IDD / XML log (new integration) (~18)
Method: get the C2C IDD → add request + response sheets per message to the "JPJ XML LOG - TEXT SPLITTER.xlsx" → split live rows from BO JPJ XML Log → field-by-field check (bold = mandatory).
1. C2C **Enquiry request**: every field, order, mandatory, values (seller ID / category, buyer ID / category, vehicle, engine, chassis, UCD code, region code, LKM indicator + duration, eVOC indicator).
2. C2C **Enquiry response**: every field decoded vs screen + eSIM.
3. **Second enquiry** (re-enquiry after 69E Proceed / add-on re-tick / before payment).
4. C2C **Submission request**: transaction code, seller → buyer IDs, buyer address, EFT no / date, AG code 72404, revenue codes, amounts, LKM / eVOC fields, emails.
5. C2C **Submission response**: response code, receipt / security no.
6. Each IDD field: mandatory empty, max length, special characters (engine / chassis 60 + "/ * - space").
7. **No UCD as new owner** in any request.
8. MyPR category code in requests.
9. Rows per transaction by Type (Enquiry / SecondEnquiry / Submission) — count matches the flow.
10. Response codes: GLB000000I, VEL000069E, VEL000008E, VEL000001E, 4K, timeouts — screen behaviour matches.
11. Retry / resubmit writes a new log row.
12. BO JPJ XML Log page for C2C (own page or Type on STMS / ESTM) — search by vehicle and by ref.
13. eSIM entities for C2C enquiry / submission exist and steer outcomes (or reuse STMS / eSTM) — confirm with dev.
14. eLKM + eVOC indicators "~Y~6~Y" pattern if reused.
15. Kod Hasil / JPJ revenue code for C2C.
16. Direct JPJ staging run (precedent EAINT-8622: most TS on eSIM, subset on JPJ staging).
17. Unchanged STMS / eSTM requests (field order, VEL04007 / VEL04510 / VEL04514) — regression.
18. Data-verification approach: contract per message, provenance per value, "blocked" ≠ pass.

### P. Back Office (~16)
1. C2C BO transaction listing (own page or type) — filters, one-month range, record count.
2. C2C BO details — seller (customer), buyer (customer), vehicle, JPJ, payments, add-ons.
3. Export CSV — "Sure to export?", columns.
4. Support Tools edit (New: engine / chassis / make / model / year; Approved: MyKad).
5. Cancel — remark "CANCELLED BY <BO account> on dd-mm-yyyy hh:mm".
6. Reset Payment (Failed only; not Approved; not JPJ-failed 4K).
7. Resubmit JPJ Final Submission for C2C.
8. Pending counter "<n> Pending Transaction Found!" counts C2C?
9. JPJ XML Log (see O).
10. RHB Payment Transaction — C2C payments listed.
11. Reconciliation (eAuto Reconciliation Summary, JPJ Reconciliation Report HASIL).
12. JPJ Hasil portal placement.
13. Reports: Transaction Summary, SST Payment Report, Payment Breakdown.
14. Add-on BO pages (LKM Refund Status, IC Status) — if seller add-ons in scope.
15. Roles: SuperAdmin / Hub Admin / Admin / Normal; hard-coded whitelists; absence = two proofs.
16. Audit logs — Support Audit Log, Audit Trail Log entries for C2C actions.

### Q. Security and audit (~7)
1. No UCD thumbprint; password is the only control [rec 1:31–1:40] — **open risk owned by management**, not a pass/fail item for 17.11.
2. Unauthorised URL access to C2C pages / another company's record.
3. Sub user vs main user actions in audit trail.
4. Thumbprint data not reusable (replay).
5. Password policy 12–30 chars (existing).
6. Valid login, no device → C2C cannot complete without both customer reads.
7. Details shows "MyKad/Thumbprint verified on" per customer + creating user.

### R. Regression — must stay unchanged (~14)
1. STMS MyKad / MyPR / Company happy path to Step 6.
2. STMS Step 1 Perakuan (hide thumbprint, lock tick) unchanged.
3. STMS Step 3 UCD thumbprint unchanged.
4. STMS + LKM Refund + Insurance Cancellation.
5. eSTM happy path + eLKM + eVOC.
6. eSTM 69E redirect after completion + "Skip, Return to eSerahan".
7. eSTM eLKM-unticked redirect; details banner; Get Free Quote.
8. UCD TO UCD Standard / Interstate tile + flow.
9. Home tile order / prices for other tiles.
10. STMS / eSTM listings, details, BO listing, CSV.
11. STMS / eSTM JPJ XML Log rows unchanged.
12. Insurance listing + quotation reminder email.
13. Browsers: Firefox 36.0.4 applet + Chrome WebSocket on STMS / eSTM thumbprint.
14. Production P1 check after deploy: "Monitor P1 modules … STMS - eSTM"; stop at Step 4 JPJ with a TEST plate.

### S. Mobile app — TBC (0 until confirmed)
Ask eAuto: STMS has live mobile endpoints `/mb/ucd/stms/*`; eSTM mobile code is dead. If mobile is confirmed, the C2C seller side has a mobile precedent, the buyer side does not.

### T. Other modules affected — from Ask eAuto (prod code, 2026-10-23 export) (~24)
Source: `_reference/inbox/eauto-flows-run/07-ask-eauto-all.md` — answers 5 "After completion" and 6 "Other modules affected" for eSTM (l.1723), STMS (l.1898), Insurance (l.1294), Insurance Cancellation (l.1478), LKM Refund (l.1560), RHB payment (l.561), Transfer History / Hak Milik (l.122), UCD home (l.1988).
1. **Buyer completion email + WhatsApp** — eSTM sends both via `eauto-notification` on successful submission. C2C buyer (and seller?) notification follows this. (Corrects N1 "gap".)
2. **Internal support alert on cancellation** (eSTM) — fires for C2C cancel?
3. **Hak Milik** — eSTM inserts ownership-title records (`EstmHakmilikSubmissionJob` hourly 8am–11pm, `EstmHakMilikTriggerJob` ~3-hourly); eHakMilik fee (FIS) in eSTM payment. C2C: FIS row + Hak Milik record for the buyer.
4. **Hire-purchase / loan on the vehicle** — Hak Milik read by Insurance (quote limits) and by the **Credit / HP portal** (read-only, IP-whitelisted). C2C vehicle with a loan: visible on Credit portal? blocked?
5. `HirePurchaseExpiredJob` (every ~1 min) expires HP links on eSTM — applies to C2C?
6. **2-phase JPJ submit + commit** — eSTM status Pending → **Committed** → Approved (`EstmCommitTransactionHandlerBean`); stuck-commit tools `EstmPatchCommitJob` / `EstmCancelCommitJob`. C2C status list has no "Committed" — confirm.
7. **eSTM 2-layer permission + PendingApproval** (approver user, `approve-tx.do`). C2C "all users, no permission" → confirm no PendingApproval step.
8. **Elastic indexing** (`eauto-elasticgateway`) — C2C rows searchable in UCD + BO listings; add-on columns (LKM Refund, IC) indexed on the parent row.
9. **e-Invoice per product** via `eauto-einvoice` (RabbitMQ): C2C fee, eLKM, eVOC, LKM Refund fee, IC fee (`INSURANCE_CANCELLATION`). Failed payments also produce events.
10. `eauto-cron` copies e-Invoice result back onto rows and reindexes; includes IC rows in RHB reconciliation.
11. **Reports**: UCD Payment Report, Payment Breakdown Report, GST/SST payment report, Insurance reports (CP58, monthly).
12. **Audit Trail events**: Create Transaction, JPJ Check, Make payment, JPJ Transfer, JPJ Commit — logged for C2C.
13. **Payment reset coupling** — eSTM reset also resets eVOC; LKM Refund reads `EstmPaymentResetLog`. C2C reset must carry its add-ons the same way.
14. **RHB Payment Transaction (eAuto Plus)** listing — separate view for Plus legs (LKM, eVOC); C2C legs land in the right one.
15. **STMS → APT after 6 months** (`JpjExpiryNotificationJob`, `AptJpjSubmissionJob`) — **C2C must never spawn an APT** (permanent transfer already).
16. **STMS cancellation reminder popup** counts Pending / Failed STMS — must not count C2C.
17. **STMS Bulk JPJ Enquiry / Bulk Payment Submission** — must not list C2C rows; Bulk Submission Control blackout windows — apply to C2C?
18. **UCD home poster** reads Insurance Cancellation / LKM Refund data — C2C add-on records included or not.
19. **Insurance Commercial Agreement** gate (director / main user, first use) — applies when a C2C 69E / checkbox enters insurance.
20. **Insurance permission** (company flag + user flag) vs C2C "all users" — conflict on insurance entry.
21. **Quotation reminder email** (`eauto-cron` `InsuranceQuotationReminderJob`) reads eSTM data — does it read C2C-sourced quotes?
22. **Insurance Cancellation via `eauto-asset-manager`** (Runnerku, OCR, retry poller) — handed off after **JPJ approves the parent** STMS; C2C parent approval must trigger it.
23. **LKM Refund via `eauto-cron`** SOAP to JPJ, PTJ document summary job — C2C refund claims included.
24. **Transfer History (TH) purchase** offered at STMS Step 4 (RM20.80) — offered in C2C or not.

### U. Live Ask eAuto checks, 2026-11-06 (~14)
Source: `EAINT-12745-ask-eauto-2026-11-06.md`. **No C2C code exists yet** (no commits for EAINT-12745 in any of 24 repos; feature branches not visible).
**C2C has its own tables** (Faizuddin, 2026-11-06) → the shared-table pickup risks below drop to **one regression sanity pass**; they stay listed because the same jobs now need a C2C equivalent.
1. Regression: StmsJpjSubmissionJob / EstmJpjSubmissionJob (select by status only) — STMS / eSTM still auto-submit; **C2C has its own submission job** — test its pickup criteria (Pending + Paid + Passed + Pending submission equivalent).
2. C2C final submission uses its own JPJ path (no eSTM "commit" default).
3. Regression: APT creation / Wholesale APT still attach to the right STMS row; **an Approved C2C never gets an APT** (sanity check, same plate).
4. (merged into 3)
5. Regression: Bulk JPJ Enquiry and Bulk Payment lists show STMS only — no C2C rows.
6. C2C BO resubmission (own page) respects cancel flag — cancelled C2C not resubmittable.
7. STMS cancellation reminder popup is dead (never opens) — no TS needed.
8. **IDD — dealer-sourced fields in eSTM that must become customer-sourced in C2C:** Seller company ID (ucdCompanyId) → seller IC; UCD category "4" → seller category MyKad/MyPR; UCD company BRN; Region code from **UCD company state/city** → from what in C2C?; EVOC Representative ID (UCD user IC); Email1 = UCD primary user email; eVOC owner email fallback = UCD director email.
9. TS: C2C enquiry and submission carry **seller customer** ID + category (1 MyKad / 0 MyPR), **buyer customer** ID + category + address; **no UCD as owner**.
10. TS: region code source for C2C (seller address? UCD branch?) — **to confirm** (2026-11-06).
11. TS: JPJ receipt email (Email1) recipient for C2C — UCD, seller or buyer? — **to confirm** (2026-11-06).
12. TS: eVOC email = buyer's eVOC email; never falls back to UCD director.
13. TS: dealer data re-read at submission — editing the UCD profile after creation must not change C2C seller/buyer data.
14. TS: buyer company / statutory body categories not offered (individual only) — no ROC in buyer ID.

**Estimated total: ~296 TS** (A 12, B 5, C 22, D 16, E 28, F 10, G 18, H 24, I 18, J 16, K 14, L 16, M 7, N 6, O 18, P 16, Q 7, R 14, T 24, U 14).

---

## 4. Test data and environment

1. **eSIM** (VPN, shared): set every code before every run; 2-char prefix per vehicle; restore after. Needed: C2C enquiry / submission entities, VEL000069E, 4K, VEL000008E, timeouts, RHB codes, insurance quotation on/off.
2. **Two customer cards** on the MyKad emulator (seller IC ≠ buyer IC ≠ UCD IC). Existing eSTM slot bypass maps buyer = login UCD — **not usable for C2C**.
3. **Fresh plate per run** (vehicle + owner transfer once); motorcycle body MSL.
4. Mobile / email capped 3 uses / 30 days — rotate.
5. Fake emails **@testingz.com**.
6. Demo build hides Save & Continue — need a non-demo build to test K.
7. JPJ staging switch for real-IDD runs (precedent: uat3 / preprod1).

---

## 5. Open questions (block expected results)

1. ~~Seller add-ons in or out~~ — **IN** (decision 0.1).
2. **Steps**: 4-step (notes) used.
3. ~~Buyer step source~~ — **customer side of eSTM** (decision 0.2).
4. **69E ordering**: before payment (C2C notes) vs after payment (eSTM today) — **use logical flow for now** (decision 0.3). Payment state at redirect and Skip destination still to confirm.
5. 69E with Insurance ticked / eLKM unticked combos (H9–H11).
6. Insurance amount: C2C summary row or paid on insurance step.
7. Drop vs disable summary row when no quotation.
8. C2C fee, Ref 2 suffix, Kod Hasil, invoice line text.
9. 7-day expiry rule (pending management); company-level permission.
10. Perakuan text (legal) for seller and buyer; keep UCD-witness clause? Expand/collapse + lock-on-tick.
11. Who ticks the JPJ T&C at Step 3 (eSTM: UCD seller).
12. Seller IC = buyer IC; UCD user as seller or buyer.
13. C2C IDD (message types, codes, fields); eSIM entities; BO JPJ XML Log page — **not confirmed; write with what is known now** (decision 0.4).
14. BO listing / reports / roles / JPJ Hasil placement for C2C.
15. Customer notification channel + wording; buyer details to seller (PDPA).
16. Post-approval insurance: day-31 wording; does approved C2C count as approved eSTM.
17. UCD cancel action; duplicate active application rule.
18. Mobile scope.

---

## 6. Known gaps in the knowledge base (capture live)

1. Exact wording for thumbprint "Not Identical", "Image quality too low", server-rejected scan.
2. STMS Step 2 field validation messages and max lengths.
3. eSTM buyer Perakuan text.
4. STMS Submission Response sheet; STMS / ESTM JPJ XML Log pages never captured.
5. Per-code JPJ error descriptions.
6. After "Skip, Return to eSerahan" — landing page and record state.
