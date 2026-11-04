// Builds the D1 / D2 QA-Issue descriptions (eauto-qa-issue-ticket format) for EAINT-12406. Run: node build-adf.cjs
const fs = require('fs');
const t = (text, ...marks) => ({ type: 'text', text, ...(marks.length ? { marks } : {}) });
const B = { type: 'strong' }, col = (c) => ({ type: 'textColor', attrs: { color: c } });
const ORANGE = col('#ff991f'), HRED = col('#bf2600'), GREEN = col('#006644'), BLUE = col('#0747A6'), RED = col('#DE350B');
const p = (...c) => ({ type: 'paragraph', content: c });
const ol = (...items) => ({ type: 'orderedList', attrs: { order: 1 }, content: items.map((i) => ({ type: 'listItem', content: [p(...(Array.isArray(i) ? i : [t(i)]))] })) });
const ul = (...items) => ({ type: 'bulletList', content: items.map((i) => ({ type: 'listItem', content: [p(...(Array.isArray(i) ? i : [t(i)]))] })) });
const cell = (...c) => ({ type: 'tableCell', attrs: {}, content: c });
const head = (...c) => ({ type: 'tableHeader', attrs: {}, content: c });
const doc = (panel, staging, rows, after) => ({ type: 'doc', version: 1, content: [
  { type: 'panel', attrs: { panelType: 'note' }, content: [
    p(t('Testing Environment: ', B), t(panel.env)), p(t('Browser: ', B), t('Google Chrome')), p(t('Module: ', B), t(panel.module)) ] },
  p(t('Staging Test: ', B), t(staging.ref + ' ', ORANGE), t(staging.text)),
  { type: 'table', attrs: { isNumberColumnEnabled: false, layout: 'default' }, content: [
    { type: 'tableRow', content: [head(p(t('Item / Step to Simulate', B))), head(p(t('Actual Result', B, HRED))), head(p(t('Expected Result', B, GREEN)))] },
    ...rows.map((r) => ({ type: 'tableRow', content: [cell(p(t(r.title, B, BLUE)), ol(...r.steps)), cell(ul(...r.actual)), cell(ul(...r.expected))] })) ] },
  ...after ] });

const env = 'staging/ia (Secarang)';
const d1 = doc(
  { env, module: 'Secarang > Success page > Receipt; Secarang > CIBO > Transaction Management > Transaction Details > Receipt' },
  { ref: '(Receipt No = 26110421300001, Vehicle No = JLX8382, Ref. No = BR6N006388, bought 04-11-2026 on the Allianz real UAT API; first seen 29-10-2026 on Ref. No BR60006349 to BR60006352 / Vehicle No HXA0011A to HXA0014A, and on the older Ref. No BR55004010 / DAX0900 paid 04-05-2025)',
    text: 'Every Allianz receipt checked since this change shows the same layout, on the simulator and on the real Allianz API.' },
  [ { title: '1. New purchase: Secarang receipt > Insurer',
      steps: ['On Secarang Home (staging/ia), get quotations for a car and choose Allianz.', 'Pay (FPX) and reach the Success page.', 'Click [Receipt] and open the PDF.', 'Look at the Insurer block.'],
      actual: [[t('Line 1: "Allianz General Insurance Company (Malaysia)".')],
               [t('Line 2: "Berhad 200601015674 (735426-V)". The number '), t('is on the same line as "Berhad"', B, RED), t('.')],
               [t('Same on the 4 receipts of 29-10-2026 (FPX, card, PayLater by Grab, SPayLater). See screenshot 1 below.')]],
      expected: [[t('"Allianz General Insurance Company (Malaysia) Berhad", then '), t('"200601015674 (735426-V)" on its own line', B, GREEN), t(', same as Tokio Marine.')],
                 [t('Per SRD v1.1, Section 2.2.9, EAINT-12406-REQ-010. See screenshots 2 and 3 below.')]] },
    { title: '2. CIBO receipt > Insurer',
      steps: ['In CIBO, go to Transaction Management.', 'Search Ref. No BR55004010 (paid 04-05-2025) or BR60006349 (bought 29-10-2026) and open Transaction Details.', 'Click [Receipt] and open the PDF.', 'Look at the Insurer block.'],
      actual: [[t('Line 2: "Berhad 200601015674 (735426-V)". The number '), t('is on the same line as "Berhad"', B, RED), t(' on both receipts (found 29-10-2026).')],
               [t('The Transaction Details page itself shows the number on its own line, so only the receipt PDF is affected.')]],
      expected: [[t('"Allianz General Insurance Company (Malaysia) Berhad", then '), t('"200601015674 (735426-V)" on its own line', B, GREEN), t(', as in row 1.')]] } ],
  [ p(t('Note: ', B), t('the e-receipt email shows the name and the number on a single line. A question to the BA is open: is a long name that wraps acceptable, or must the number start on its own line?')),
    p(t('Screenshot 1 - Actual: Secarang receipt 26110421300001 (JLX8382, 04-11-2026), Insurer block', B)),
    p(t('Screenshot 2 - Expected: SRD v1.1, Section 2.2.9, REQ-010, Example 1', B)),
    p(t('Screenshot 3 - Expected: SRD v1.1, Section 2.2.9, REQ-010, Tokio Marine and Allianz (new) samples', B)) ]);

const d2 = doc(
  { env, module: 'Secarang > Success page; Secarang > Success page > Receipt; Secarang > CIBO > Transaction Management > Transaction Details' },
  { ref: '(Receipt No = 26110421300001, Vehicle No = JLX8382, Ref. No = BR6N006388, bought 04-11-2026 on the Allianz real UAT API; first seen 29-10-2026 on 13 Allianz receipts, e.g. Ref. No BR60006349 / Vehicle No HXA0011A / Receipt No 26102921300027)',
    text: 'Every Allianz purchase since this change shows the wrong amount after payment, while the Confirmation page is right. Tokio Marine and RHB receipts add up.' },
  [ { title: '1. Secarang: Confirmation vs Success page and receipt',
      steps: ['On Secarang Home (staging/ia), get quotations for a car and choose Allianz.', 'On Add-ons keep the default and click Continue.', 'On Confirmation, note "Premium After NCD" (RM359.88).', 'Pay by FPX. On the Success page look at "Premium After NCD", then click [Receipt] and look at "Premium after NCD".'],
      actual: [[t('Basic Premium RM551.12, NCD 38.33% -RM211.24, All Drivers RM20.00, then '), t('Premium after NCD RM379.88', B, RED), t(' on the Success page and on the receipt PDF.')],
               [t('That is '), t('RM20.00 too high', B, RED), t(': the lines above add up to RM359.88. RM20.00 is the All Drivers amount, counted twice. Gross Premium (RM359.88) and Total Premium (RM398.65) are right.')],
               [t('Same on all 13 Allianz receipts of 29-10-2026 (e.g. RM882.16 instead of RM862.16) and in the e-receipt email. See screenshot 1 below.')]],
      expected: [[t('"Premium after NCD" '), t('RM359.88', B, GREEN), t(' (Basic Premium - NCD + All Drivers), the same as on Confirmation for this purchase. See screenshot 3 below.')],
                 [t('Tokio Marine and RHB receipts already add up this way. Per SRD v1.1, Section 2.1.3a (the full Allianz journey, including the receipt). See screenshot 4 below.')]] },
    { title: '2. CIBO: Transaction Details and receipt',
      steps: ['In CIBO, go to Transaction Management.', 'Search Ref. No BR6N006388 and open Transaction Details.', 'Look at "Premium After NCD".'],
      actual: [[t('Premium After NCD RM379.88', B, RED), t(' on Transaction Details. See screenshot 2 below.')],
               [t('The CIBO receipt PDF of BR60006349 (29-10-2026) shows RM882.16 instead of RM862.16.')]],
      expected: [[t('"Premium After NCD" '), t('RM359.88', B, GREEN), t(', as in row 1.')]] } ],
  [ p(t('Notes for Dev', B)),
    ul([t('Older Allianz transaction is fine: ', B), t('BR55004010 (paid 04-05-2025) shows RM862.16, which adds up, on this build. Only purchases made after this change are wrong.')],
       [t('Browser console: ', B), t('on 29-10-2026, during an Allianz purchase before the Payment page, the console showed the error below. The 04-11-2026 run on the real API showed a 400 response and "ERROR Error: [object Object]" on the Add-ons page instead.')]),
    p(t("TypeError: Cannot read properties of undefined (reading 'amount') at autoAddAddonIfAllianz", { type: 'code' })),
    p(t('Screenshot 1 - Actual: Secarang receipt 26110421300001 (JLX8382, 04-11-2026), Receipt Summary', B)),
    p(t('Screenshot 2 - Actual: CIBO Transaction Details BR6N006388, Premium After NCD', B)),
    p(t('Screenshot 3 - Expected: Confirmation of the same purchase, Premium After NCD RM359.88', B)),
    p(t('Screenshot 4 - Expected: SRD v1.1, Section 2.1.3a', B)) ]);

// N: the real Allianz API refuses the Full Name "QA SECARANG TEST" after payment (Dev confirmed a bug, 04-11-2026)
const n = doc(
  { env, module: 'Secarang > Confirmation (Car Owner Details: Full Name) > Payment > Success page; Secarang > CIBO > Transaction Management > Transaction Details' },
  { ref: '(Ref. No = BR6N006388, Vehicle No = JLX8382, Receipt No = 26110421300001, FPX RHB, 04-11-2026 14:21; Ref. No = BR6N006389, Vehicle No = JXP4235, Receipt No = 26110421300002, FPX Maybank, 04-11-2026 15:06; working comparison: Ref. No = BR6N006385, Vehicle No = BPX823, Full Name "MONG TEST ALLIANZ 2", 03-11-2026)',
    text: 'Allianz on the real UAT API: two purchases with the Full Name "QA SECARANG TEST" were paid but the policy was refused. The car, IC, gender and bank were different each time; only the name was the same.' },
  [ { title: '1. Allianz purchase with Full Name "QA SECARANG TEST"',
      steps: ['On Secarang Home (staging/ia), enter a real plate + owner IC + postcode 55000 and get quotations.', 'Choose Allianz, keep the default add-ons, Continue.', 'On Confirmation, type Full Name "QA SECARANG TEST" and the other owner details, then Confirm and Pay.', 'Pay by FPX (status 00 Approved).', 'In CIBO > Transaction Management, search the plate and open Transaction Details.'],
      actual: [[t('Payment is taken and Secarang shows "Payment successful!" with a receipt.')],
               [t('CIBO: Payment Paid, but Transaction Status '), t('Failed', B, RED), t(', Remark '), t('"Invalid fullName"', B, RED), t('.')],
               [t('Cover Note No and Policy No are '), t('"-"', B, RED), t('; no Receipt or e-Certificate button on Transaction Details.')],
               [t('Same on both purchases (BR6N006388 and BR6N006389). See screenshots 1 and 2 below.')]],
      expected: [[t('The name is accepted and the purchase completes: Transaction Status '), t('"Insurance created"', B, GREEN), t(', with Cover Note No and Policy No filled, as for the Dev\'s made-up name "MONG TEST ALLIANZ 2" (BR6N006385, Insurance created).')],
                 [t('Per SRD v1.1, Section 2.1.3a: the full Allianz journey (quote, add-ons, payment, cover note, callbacks, receipt) must work end to end. See screenshot 3 below.')]] } ],
  [ p(t('Note: ', B), t('Dev confirmed on 04-11-2026 that this is a bug. If the name must follow a rule (e.g. the IC owner\'s name, or no short words), Secarang should check it on Confirmation before payment, not after.')),
    p(t('Screenshot 1 - Actual: CIBO Transaction Management, BR6N006388 (JLX8382): Failed, "Invalid fullName" (IC masked)', B)),
    p(t('Screenshot 2 - Actual: CIBO Transaction Management, BR6N006389 (JXP4235): Failed, "Invalid fullName" (IC masked)', B)),
    p(t('Screenshot 3 - Expected: SRD v1.1, Section 2.1.3a', B)) ]);
fs.writeFileSync(__dirname + '/N.adf.json', JSON.stringify(n));

fs.writeFileSync(__dirname + '/D1.adf.json', JSON.stringify(d1));
fs.writeFileSync(__dirname + '/D2.adf.json', JSON.stringify(d2));
console.log('ok', JSON.stringify(d1).length, JSON.stringify(d2).length);
