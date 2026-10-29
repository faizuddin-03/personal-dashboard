# eSIM response code kit

A Playwright script that opens an eSIM record by vehicle prefix and changes its
Response Code, plus the saved HTML of the eSIM pages and the rules for when to
set each code. Written for QA engineers and their Claude.
Source: Faizuddin's eAuto automation (`scripts/eauto-esim`), 2026-10-19.

## 1. Files

| File | Purpose |
|---|---|
| `esim.ts` | The code: `esimLogin()`, `openRecord()`, `changeResponseCode()`, and `setResponseCode()` (all three in one call) |
| `set-response-code.spec.ts` | Standalone run: set one code from the command line |
| `playwright.config.ts` | Config. `ignoreHTTPSErrors` is required (self-signed certificate) |
| `package.json` | Dependencies |
| `html/` | Saved eSIM pages (see section 6). The selectors in `esim.ts` come from these |

## 2. Setup and run

1. Connect to the VPN.
2. `npm install`, then `npx playwright install chromium`.
3. Set the eSIM login as environment variables `ESIM_USER` and `ESIM_PASS`. Ask the team for it.
4. Run once from the command line (Git Bash):

   ```
   ESIM_USER=... ESIM_PASS=... ESIM_ENTITY=rhb-transfer ESIM_VEHICLE_NO=HX1234 ESIM_CODE=IF npx playwright test
   ```

5. Or call it inside your own test, before the step that calls the simulator:

   ```ts
   import { setResponseCode } from './esim';

   const esimTab = await context.newPage();
   const oldCode = await setResponseCode(esimTab, 'rhb-transfer', 'HX1234', 'IF');
   try {
     // run the eAuto flow in `page`
   } finally {
     await setResponseCode(esimTab, 'rhb-transfer', 'HX1234', oldCode || 'OK'); // restore
     await esimTab.close();
   }
   ```

## 3. What the script does

1. **Log in.** Opens `/esim/login`, fills username and password, and clicks login. It confirms the sidebar (`aside.sidebar`) shows. A wrong login re-renders the login form without an error. A timeout here usually means the VPN is off.
2. **Open the record.**
   1. Opens the entity's list page and types the prefix into `#searchInput`.
   2. Every row is already in the page. The search hides non-matching rows, so only visible rows count.
   3. The search is a substring match (`AB` also shows `ABC`). The script keeps only the row whose `Vn Start With` cell matches exactly.
   4. It stops if there is no match or more than one match, rather than guessing.
   5. It opens that row's edit link.
3. **Change the code.**
   1. Finds the `Response Code` field by its label (`label.form-label` with the text "Response Code", then its `for=` id). It does not use hard-coded input ids.
   2. Saves the old value, types the new code and clicks Save.
   3. Confirms "saved successfully". Saving lands on the record's view page, not the list.
   4. Returns the old code so you can restore it.

## 4. How eSIM works

1. eSIM (eAuto Simulator) decides what JPJ, RHB, JomCheck and others **reply** to eAuto.
2. URL: `https://172.30.202.114:9089/esim`. VPN only.
3. Every entity holds rows keyed by **`Vn Start With`**, a **2-character** prefix. Vehicle `HX1234` uses the row with prefix `HX`.
4. The row must already exist. The script edits rows; it does not create them.
5. eSIM is **shared**.
   1. Read the **Remark** column before editing a prefix that is not yours. Never edit one marked "DO NOT DELETE OR MODIFY".
   2. Set the codes you need **before every run, including the happy path**. Another tester may have left your prefix on a failure code.
   3. Restore the codes after the run.

| Entity | List path under `/esim` |
|---|---|
| eSTM Enquiry | `/estm-enquiry-resp` |
| eSTM Submission | `/estm-submission-resp` |
| Dereg Enquiry | `/dereg-enquiry-resp` |
| Dereg Submission | `/dereg-submission-resp` |
| Dereg Precheck | `/dereg-precheck-enquiry-resp` |
| RHB Transfer | `/rhb-transfer-resp` |
| JomCheck Enquiry | `/jomcheck-enquiry-resp` |
| JomCheck Report | `/jomcheck-report-resp` |

## 5. Codes and when to set them

| Entity | Code | Result |
|---|---|---|
| Dereg Precheck | `GLB000000I` | JPJ success |
| Dereg Precheck | `VEL000100E` | Failed, vehicle not exist |
| Dereg Precheck | `VEL000045E` | Failed, JPJ error code |
| RHB Transfer | `OK` | Payment success |
| RHB Transfer | `IF` | Insufficient funds (payment declined) |
| RHB Transfer | `RE` | Reset timer, about 6 minutes |
| RHB Transfer | `ER` | RHB API down. About 12-minute cooldown before the next try |
| eSTM / Dereg (JPJ) | `GLB000000I` | Success. Codes ending in `E` are errors |

1. **General:** set the code **before the step that calls the simulator**. eAuto reads eSIM at the moment of that call.
2. **eDereg Pre-Check:**
   1. Set both Dereg Precheck and RHB Transfer before paying for the Pre-Check.
   2. Happy path: `GLB000000I` + `OK`.
   3. JPJ fails, payment succeeds: `VEL000100E` or `VEL000045E` + `OK`.
   4. Payment declined: RHB Transfer `IF`, `RE` or `ER`.
   5. A declined payment (`IF`) saves a real record. An inline JPJ failure (`VEL…E`) resets to blank instead.
   6. Cronjob tests use 2 parts. Part 1 sets the codes and creates the transaction. Part 2 runs after the cronjob and only reads.
3. **eSTM 69E (insurance redirect):**
   1. Set the eSTM Enquiry Response Code **before completing the eSTM**, not at the eLKM untick.
   2. The redirect only fires after the eSTM is fully completed.
   3. Restore `GLB000000I` afterwards.
4. **JomCheck:** it is driven by the JomCheck Report **Result** field (`Success` / `Failed`) and its claim records, not by Response Code. This kit does not change those. See `html/jomcheck-report-edit.html` for the form.

## 6. Saved HTML pages (`html/`)

Each file starts with a comment giving its URL, capture date and what was trimmed. Forms are never trimmed.

| File | Page |
|---|---|
| `login.html` | Login form |
| `app-shell.html` | Layout and sidebar after login |
| `estm-enquiry-list.html` / `estm-enquiry-edit.html` | eSTM Enquiry |
| `estm-submission-list.html` | eSTM Submission list |
| `dereg-enquiry-list.html` / `dereg-enquiry-edit.html` | Dereg Enquiry |
| `dereg-submission-list.html` | Dereg Submission list |
| `dereg-precheck-enquiry-list.html` / `-edit.html` / `-view-after-save.html` | Dereg Precheck, including the page after Save |
| `rhb-transfer-list.html` / `-edit.html` / `-view-after-save.html` | RHB Transfer, including the page after Save |
| `jomcheck-enquiry-edit.html` | JomCheck Enquiry form |
| `jomcheck-report-edit.html` / `jomcheck-report-edit-2026-10-05.html` | JomCheck Report form with claim records |

## 7. Notes for Claude

1. Read `esim.ts` and the matching `html/*-edit.html` before changing selectors.
2. Never assume a prefix is on the success code. Set it before the run.
3. A login timeout is usually the VPN, not a selector.
4. Some fields on other forms are `<select>`, not `<input>`. Use `selectOption` for those.
5. Header comments in the HTML may mention files from Faizuddin's repo (`knowledge/...`). Those files are not included here.
