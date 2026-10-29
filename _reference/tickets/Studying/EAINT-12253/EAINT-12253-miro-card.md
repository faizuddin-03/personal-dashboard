<!-- Copied verbatim from _reference/tickets/Studying/_miro-board-capture-2026-10-26.md (lines 110-155), Miro board "eAuto - QA Resource Planning", column "28TH OCT DEPLOYMENT". Captured 2026-10-26. -->

# EAINT-12253 Miro card

```
EAINT-12253 - 🔴[eAuto-UCD] To Display Browser Reminder in Last Step of Transaction for Mozilla Firefox to Google Chrome Migration Effective 1 January 2027
- To deploy on:
- Test Env: staging/uat1
- BA: Yi Link
- QA: May
- Test Env Point to:
- Testing Plan
- QA Testing
- ETA for TP TS readiness:
- ETA for Testing:
- Est. Testing Mandays: 5 days (1 QA)
- Base Testing Time: 3 days
- Buffer (Req Change + Bug Fix + Retest Bug): 2 days
- ETA to complete testing latest by:
- Regression Testing:
- Testing Scope: (Manual / Automation Testing)
- Changes: Show Browser Reminder popup at the Last Step of each Transaction
- User Type: Main & Sub UCD
- Browser:
- Firefox: should show the popup
- Chrome / any other Browser (eg: Edge): should NOT show the popup (Regression)
- Modules Affected:
- STMS - step 6 show popup
- STMS Wholesale - step 6 show popup
- UCD to UCD - Standard - step 6 show popup
- UCD to UCD - Interstate - step 6 show popup
- eSTM
- After eSTM Approval Flow - eSTM Step 6 should NOT show popup > redirect to Insurance Step 1 > Insurance Step 4 show popup
- 69E Flow - Insurance Step 4 show popup > eSTM Step 6 show popup
- BMK - step 6 show popup
- APT - step 6 show popup
- Insurance - step 4 show popup
- Service Hub - step 4 show popup
- Jomcheck - show after Payment success
- Dereg - step 6 show popup
- e-Dereg Pre-checking - step 3 show popup
- Functional:
- [View PDF Guide  查看操作指南] button --> open User Guide in a new tab, Transaction page remain showing behind the popup
- [Continue 继续] button --> close the popup & return to the last step of Transaction
- Scenario:
- Manually refresh the page w/o closing popup - should show popup
- Close the banner & refresh the page - should NOT show popup
```

