# Addenda for module/flow files — found while building cr-ledger.md (2026-10-15)

Not written into the target files (owned by other agents / outside this task's file set).

## Target: knowledge/flow-device-purchase.md — section "Field caps" (or nearest)
1. Number of Installations (Software Installation, EAINT-10960 SRD p.15 §2.3.2.1) has **no limit**; Purchase Quantity (Biometric Device Purchase) is capped at **40 units per transaction** via EAINT-12166 REQ-007. The "4 characters" in EAINT-11996 is the bug, not a rule. `[from handoff 2026-09-17 EAINT-11880]` `[from handoff 2026-09-17 EAINT-11996]`
2. Module family map: CCB-618 → EAINT-10960 → EAINT-11880 → EAINT-11881 / 11882; bugs 11996/12095/12103/12104 under 11880. `[from handoff 2026-09-17 EAINT-11880]`
3. EAINT-12095 note: "Seems like the initial fix for UCD broke the BO page" — the UCD word-wrap fix had a BO regression, raised with Wong Kar Kin. `[from Teams, 2026-09-17 16:20, Faizuddin]` via appraisal proof pack §G.

## Target: knowledge/cibo.md — section on EAINT-12151 / Transaction Listing dates (new)
1. "Insurance Creation Date" = insurance payment table `last_updated_at`, not JPJ-approved date. `[from Teams, 2026-08-20 12:17, Mong Guo Hao]` via handoff 2026-09-28 EAINT-12151.
2. SRD v0.3 wording: "Clarified Insurance Creation Date refers to Payment Date Time". `[from SRD EAINT-12151 v1.0 §1.3]`
3. Business sign-off to keep date+time under the existing "Payment" column framing (Shamini via Mei Jia Chee, 2026-08-27). `[from handoff 2026-09-28 EAINT-12151]`
4. Testing environment for CIBO tickets: `cibo/staging` (user-supplied, 2026-09-28). `[from handoff 2026-09-28 EAINT-12151]`
5. EAINT-12327 has no format string for Fiuu Credit/Debit Card or Fiuu FPX; affects 12107_TS07/TS08. `[from NOTES.md EAINT-12107, TS v0.2 item 4]`

## Target: knowledge/eauto-payments.md — section "DuitNow QR channel (EAINT-12257)"
1. Dashboard defaults for the duitnow-qr runner: Approver `jasons`, Assignee `mfared`, Fiuu simulator `Gaara`. `[from handoff 2026-09-02 EAINT-12257, 2026-09-04 update]`
2. EAINT-12414 (Pre-Application reload / failed-card) was deployed 2026-10-09 dev-tested only; the expected failed-payment banner text is "Unsuccessful Payment - Something went wrong and your payment didn't go through. Please choose a payment method and retry." `[from EAINT-12414-jira-ticket.md]` `[from Teams via memory digest, 2026-10-14]`

## Target: knowledge/flow-ucd-onboarding.md — section "Environments"
1. Onboarding module's staging is `staging/obs`; FPX B2B not deployed as of 2026-09-30. `[from EAINT-12414-teams-thread-2026-09-30.md, Faizuddin scope decisions]`

## Target: knowledge/flow-edereg.md — §44 (release record)
1. Fix version S33.6-20260915; 8 QA man-days; regression evidence folder `20260915 - 15th September Morning Deployment` on SharePoint. `[from appraisal proof pack 2026-10-15 §A]`
2. RHB "ER" has a ~12-minute cooldown between attempts ("Sila TUNGGU 12 minit kemudian klik 'Resubmit'"), separate from RE's ~6-minute timer. `[from handoff 2026-09-17 EAINT-9306, 2026-09-14 §1]` (check whether already in §36+.)

## Target: knowledge/flow-jomcheck.md — §1 / §9e
1. Fix version S34.4-20261005, 3 QA man-days, KJ hotfix 2026-10-06 for invalid JomCheck API result. `[from appraisal proof pack 2026-10-15 §A]` `[from Teams via memory digest, 2026-10-14]`
2. Stale "Not run live yet" lines in §7u/§7w/§7y/§7z: per Faizuddin 2026-10-05 17:12 "ts34 deprio, all the other passed". `[from handoff 2026-10-05 EAINT-12339]`

## Target: knowledge/flow-eauto-insurance-enquiry.md — header
1. EAINT-12175 fix version S34.X-20261002, assignee Shane, status In Development on 2026-09-25; Secarang REQ-001–005 live since 2026-08-11. `[from NOTES.md EAINT-12175]` `[from SRD EAINT-12175 v1.1 §1.3]`

## Target: knowledge/flow-association-payment-listing.md — header
1. EAINT-12028 ON HOLD: "MJ ytd updated us that 12028 need to on hold first as we got other higher priority tickets" (May Chin DM 2026-10-15 09:56); "not going to deploy on end of this month anymore" (Mei Jia, 2026-10-14 12:03); dev Kasheng Liew. `[from Teams via memory digest]`

## Target: knowledge/eauto-portals.md — environments
1. 2026-10 environment map: staging/uat1 → Wei Ting wholesale (swap with sit2, 14 Oct); uat2 inactive; staging/uat3 → EAINT-8622, JPJ Staging connected 15 Oct 09:42; staging/preprod1 → Insurance Cancellation; /obs released 7 Oct; all staging branches merged to prod code 6–8 Oct. `[from Teams via memory digest, 2026-10-14/15]`
