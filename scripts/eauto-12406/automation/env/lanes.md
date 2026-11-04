# Runner lanes

A lane is one UCD **user**. Only one run may use a lane at a time, because a run creates transactions as that
user. Two runs on one lane corrupt each other's data; two runs on two lanes do not.

The machine-readable roster is **`env/lanes.json`** (company, main / sub, card, prefix, ready). The broker,
`lanePersona()`, `laneCard()` and the login guard all read it; this page is the human notes. Passwords live only
in `.staging.env-local`.

## The lanes (21.10.2026: all 11 ready, each smoked with one STMS to Step 6 "OK - SUCCESSFUL")

| Lane | User (persona) | Company | Role | Baseline prefix | Notes |
|---|---|---|---|---|---|
| 1 | Azfar1 (`ucdE2E`) | AZFARAZO (1080458, JM0570913-X) | main | per ticket | Azfar's own account |
| 2 | faizuddin2 (`ucdE2E2`) | FAIZUDDIN AUTO TEST 2 (ROC 1576795-H on /eauto/ + /uat1/, 030312-A on /preprod1/) | main | per ticket | used with its owner's permission (12.10); never touch S694494084 |
| 3 | AzfarL3 (`ucdE2E3`) | AZFARAZO | sub | IA | |
| 4 | AzfarL4 (`ucdE2E4`) | AZFARAZO | sub | IB | |
| 5 | AzfarCo1 (`ucdCo1`) | QA AUTO MOTOR SATU SDN BHD (1019420, 1576859-H) | main | IC | |
| 6 | AzfarCo2 (`ucdCo2`) | QA AUTO MOTOR DUA SDN BHD (1019421, 1644516-X) | main | ID | |
| 7 | AzfarCo3 (`ucdCo3`) | QA AUTO MOTOR TIGA SDN BHD (1019422, 788079-P) | main | IE | **invalid TIN** on purpose (C99999999990) |
| 8 | AzfarCo4 (`ucdCo4`) | QA AUTO MOTOR EMPAT ENTERPRISE (1019423, 003369080-P) | main | IG | sole proprietor ROC (new ROC type 03) |
| 9 | AzfarCo5 (`ucdCo5`) | QA AUTO MOTOR LIMA SDN BHD (2120546, 1433966-U) | main | IH | **Sabah** mailing address (APT region follows it) |
| 10 | AzfarCo1S (`ucdCo1Sub`) | QA AUTO MOTOR SATU SDN BHD | sub | II | |
| 11 | AzfarCo2S (`ucdCo2Sub`) | QA AUTO MOTOR DUA SDN BHD | sub | IK | |

- **UCD to UCD** needs two lanes of **different** companies (any two of AZFARAZO, FAIZUDDIN, SATU, DUA, TIGA,
  EMPAT, LIMA). Two users of one company are never a pair (e.g. 1 + 3, 5 + 10).
- **Main vs sub** cases need a main and a sub of the **same** company: AZFARAZO 1 + 3 / 1 + 4, SATU 5 + 10, DUA 6 + 11.
- Sub users see their company's listings, so a spec finds its record by vehicle number, never "the first row".
  Their contact details (0100000003/04, 0100000011.., azfar.qa.*@example.com) belong to the company's users, so
  STMS Step 2 rejects them as seller mobile / email (REQ 4332).
- Steps that read the LOGIN user's own MyKad take `laneCard()`; UCD B's card is `partnerCard()`, a sub user's `subCard()`.
- The QA companies (lanes 5-9) were made in BO > Manage Company Accounts > Create New (s09), shaped like
  AZFARAZO, RHB as Azfar set it (active, 1234567890, Split, Pay on behalf, Group C4; Dealer ID = the company's own
  ID), remark "QA automation company (Azfar) ...", then **Activate** (s10). Dev patched the company IDs for the
  emulator (21.10); each main user then did Account Activation with its card (s15) and the first-login password
  change (s05). Sub users: UCD Settings > Add New User Account as the main user (s03, `MAIN=ucdCo1 NEW_LANE=10`).
- **Company/Business Profile Update not done** on the QA companies: the dashboard shows "UPDATE REQUIRED" and the
  `#dialog-einvoice` popup (closed by `UcdHomePage.closePopups`); STMS works without it. eAuto treats them as
  **"Type of Business: Trading License"** (BO's Business Type is blank), so the update would ask for a Trading
  License PDF, not the Sdn Bhd SSM route. Left undone until the business type is set right (ask Dev); Co1's
  update was opened to Step 2 and left there (Save & Continue Later not pressed).
  **22.10.2026 (read-only probe cr/EAINT-12253/03-spec/probes-2210/p02, /uat1/):** DUA (Co2) now shows "SSM Document: -"
  on its update page (the SSM route, a different Step 2); SATU (Co1), TIGA (Co3), EMPAT (Co4) and LIMA (Co5) show
  "Trading License Document: -". Azfar 22.10 allowed EAINT-12253 BEH_TS6 to take one of them past Step 2 with the test
  `trading-licence.pdf`: planned on LIMA (Co5), which is then left on Step 3 (thumbprint not given).
- **Not a lane: QA AUTO MOTOR ENAM SDN BHD (company ID 1019424, ROC 1576171-W, new ROC 202401030322, TIN C58867273040,
  Johor mailing address), main user `AzfarCo6` = Azfar himself (MUHAMMAD AMIRUL AZFAR, MyKad 020406081081, his real
  card)**. Created and activated 22.10.2026 on staging /uat1/ for EAINT-12253 BEH_TS6 (Azfar: the lane companies are all
  emulator-patched; this one is for a **manual thumbprint** on the real reader). **NOT patched for the emulator: do not
  ask Dev for the patch.** It is **not ready for automation** and **not in `lanes.json`**, so the broker never picks it.
  Same shape as Co1-Co5 (s09 / s10 settings, PASS list row 4, Business Type blank). Credentials are `QA_CO6_*` in
  `.staging.env-local`; persona `ucdCo6` since 22.10 evening (still NOT a lane: no lock, only the manual-reader specs
  `cr/EAINT-12253/03-spec/*-manual.e2e.cr.spec.ts` use it, with CR_MANUAL=1). Account Activation is not done yet: it needs Azfar's card in Chrome with the
  DERMALOG MyBioID Service running instead of the emulator, or in Firefox 36 through the Java applet. Script:
  `cr/EAINT-12253/03-spec/probes-2210/p04-bo-create-manual-company.spec.ts`; notes:
  `cr/EAINT-12253/05-evidence/investigation-beh6-manual/NOTES.md`.
- Passwords on the password-change page: 12+ chars, upper, lower, digit, special. Keep `#` out or quote the value
  in `.staging.env-local` (dotenv reads an unquoted `#` as a comment).

## The lane broker: say what a run needs, not which lane

`scripts/lib/lane-broker.mjs` picks free, ready lanes from `lanes.json` and takes all their locks at once, or none:

| need | what it takes | preference |
|---|---|---|
| `single` | one lane | mains before subs |
| `ucd2ucd` | two lanes of two different companies (UCD A, UCD B) | two mains |
| `main+sub` | a main and a sub of the same company | — |

- **A ticket's TS:** `node scripts/cr-run.mjs --ticket EAINT-x --instance uat1 --lane auto --ts A,B` takes the need
  from each TS' `needs` in `01-intake/ts.json` (cr-draft writes `needs:` in scenarios.yaml; none = single), or from
  `--need`. `--pool 3,4,5` limits the lanes a ticket may use. Named lanes still work: `--lane 3`, `--lane 1,2`.
- **A verify spec or probe:** `node scripts/broker-run.mjs ucd2ucd all tests/flows/ucd2ucd.verify.spec.ts --project=flows`.
- **The workflow:** `cr-execute` with `lanes: "auto"` (+ `parallel: 2`, `pool: [...]`) runs every batch through the broker.
- The run gets `LANE` (its own lane) and `LANES` (all it holds). `partnerPersona()` / `partnerCard()` = the held
  lane of another company (UCD B); `subPersona()` / `subCard()` = the held sub of its own company. A run holding
  only lane 1 still gets faizuddin2 as UCD B, and the login guard borrows lane 2 or stops with "lane 2 busy".
- When nothing fits, the broker waits (polls every 5 s). A need the pool can never meet is refused at once.
- Proved 21.10.2026: `ucd2ucd` from lanes 5-11 picked 5 + 6 and the Interstate UCD to UCD verify passed end to end
  (Co1 sells, Co2 accepts, reads its own card, pays); two `main+sub` requests at once got SATU 5 + 10 and DUA 6 + 11,
  a third waited; no same-company pair among the 100 `ucd2ucd` combinations.

## What stops two runs colliding

| Shared thing | Guard | Proved |
|---|---|---|
| A lane's UCD user | lane lock `lane-N.lock` (main checkout's `automation/.artifacts`), taken by cr-run / the broker / the runners | always |
| **Another lane's user** (UCD B, `as("ucdE2E2")` from lane 1, ...) | `claimPersonaLane` in `LoginPage.as` and the Firefox 36 login (`src/fixtures/lane-guard.ts`): the run must hold that lane; free = borrowed until the run ends, held by another run = the TS stops with "lane N busy" | 21.10 |
| **A company's BO settings** (SSM boxes, ...) | `claimCompany` in `BoCompanyAccountsPage.setMany`: before changing a company it holds **every lane of that company** (e.g. 1, 3, 4 for AZFARAZO) until the run ends; waits up to 20 min for other runs on those users | 21.10: waited while lane 10 was busy, then held 5 + 10 |
| MyKad emulator | every lane has its own channel `/IDCard/lane<N>` (page socket relayed, also for contexts a spec opens itself); no LANE = default channel | 21.10: lanes 1 + 2 + 4 card reads at the same minute |
| Vehicle numbers, mobiles, emails | one locked counter for the machine (`automation/state/usage.json`, main checkout) | 21.10: 4 processes, 200 numbers, no duplicate |
| eSim RHB switch of a prefix | `withRhbOk` holds `esim-<prefix>.lock` | — |
| BO (`jasons`) / AATF (`azfaraatf`) logins | none needed: a second login of the same user keeps the first session | 21.10 |
| Two logins at the same second | `LoginPage.as` signs in again once when staging answers with a **blank** login page (a refused password is not blank and fails at once) | 21.10: lanes 5 / 6 / 10 |
| Lanes not ready | cr-run and the broker use only lanes with `"ready": true` in `lanes.json` | — |

Still a rule, not a guard: a ticket that switches eSim answers gives each lane its own prefix (`setEstmCode` has no
lock); about 3-4 runs at once is what one PC carries; give each run its own Playwright output folder (cr-run and
broker-run do: `.artifacts/test-results-lane<N>`).
