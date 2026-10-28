import { test, expect } from '@playwright/test';
import { openAs } from '../utils/workflow';
import { tagOf } from '../data/priority';
import { CONFIG, required } from '../data/config';
import { PDF_FIXED, PDF_WRONG } from '../data/expected';
import { AplDetailsPage, Role } from '../pages/AplDetailsPage';
import { amountInWords, escapeRe, monShort, phraseRe, toNumber } from '../utils/format';
import { savePdf, highlightPdf, SavedPdf } from '../utils/pdf';
import { HighlightSpec } from '../utils/pdfHighlight';

// K. FMC Payment Request PDF (12028_TS120 to TS140) and L. MMSDA Payment
// Request PDF (12028_TS141 to TS161). Common steps (scenarios.md K / L):
// Login to BO as Approver; [View] a fully approved month; click the button;
// open the PDF. Expected values: SRD v1.1 §2.2.10 (FMC) / §2.2.11 (MMSDA),
// quoted in data/expected.ts. Every TS saves the PDF and a green / red boxed
// screenshot of what it checked (pdfHighlight, copied from scripts/eauto-jomcheck).
// [unconfirmed] PDF text order: values are looked for right after their label.

type Assoc = 'FMC' | 'MMSDA';
type Key = 'file' | 'header' | 'title' | 'to' | 'attn' | 'adds' | 'date' | 'requestor' | 'reason1' | 'reason2'
  | 'Account Holder Name' | 'Bank Name' | 'Bank Account No.' | 'Person in charge' | 'Contact Number' | 'Email Address'
  | 'amount' | 'words' | 'prepared' | 'checked' | 'approved';

const TITLES: Record<Assoc, Record<Key, string>> = {
  FMC: {
    file: '12028_TS120: FMC PDF file name',
    header: '12028_TS121: FMC PDF company header',
    title: '12028_TS122: FMC PDF document title',
    to: '12028_TS123: FMC PDF To',
    attn: '12028_TS124: FMC PDF Attn',
    adds: '12028_TS125: FMC PDF Adds',
    date: "12028_TS126: FMC PDF Date is the Approver's approved date",
    requestor: '12028_TS127: FMC PDF Requestor is the Drafter who approved',
    reason1: '12028_TS128: FMC PDF Reason for Payment line 1',
    reason2: '12028_TS129: FMC PDF Reason for Payment line 2 month',
    'Account Holder Name': '12028_TS130: FMC PDF Pay to Account Holder Name',
    'Bank Name': '12028_TS131: FMC PDF Pay to Bank Name',
    'Bank Account No.': '12028_TS132: FMC PDF Pay to Bank Account No.',
    'Person in charge': '12028_TS133: FMC PDF Pay to Person in charge',
    'Contact Number': '12028_TS134: FMC PDF Pay to Contact Number',
    'Email Address': '12028_TS135: FMC PDF Pay to Email Address',
    amount: "12028_TS136: FMC PDF Amount Payable equals the month's Cars (RM)",
    words: '12028_TS137: FMC PDF amount in words matches the figures',
    prepared: '12028_TS138: FMC PDF Prepared by shows the Drafter',
    checked: '12028_TS139: FMC PDF Checked by shows the Reviewer',
    approved: '12028_TS140: FMC PDF Approved by shows the Approver',
  },
  MMSDA: {
    file: '12028_TS141: MMSDA PDF file name',
    header: '12028_TS142: MMSDA PDF company header',
    title: '12028_TS143: MMSDA PDF document title',
    to: '12028_TS144: MMSDA PDF To',
    attn: '12028_TS145: MMSDA PDF Attn',
    adds: '12028_TS146: MMSDA PDF Adds',
    date: "12028_TS147: MMSDA PDF Date is the Approver's approved date",
    requestor: '12028_TS148: MMSDA PDF Requestor is the Drafter who approved',
    reason1: '12028_TS149: MMSDA PDF Reason for Payment line 1',
    reason2: '12028_TS150: MMSDA PDF Reason for Payment line 2 month in English',
    'Account Holder Name': '12028_TS151: MMSDA PDF Pay to Account Holder Name',
    'Bank Name': '12028_TS152: MMSDA PDF Pay to Bank Name',
    'Bank Account No.': '12028_TS153: MMSDA PDF Pay to Bank Account No.',
    'Person in charge': '12028_TS154: MMSDA PDF Pay to Person in charge',
    'Contact Number': '12028_TS155: MMSDA PDF Pay to Contact Number',
    'Email Address': '12028_TS156: MMSDA PDF Pay to Email Address',
    amount: "12028_TS157: MMSDA PDF Amount Payable equals the month's Motorcycles (RM)",
    words: '12028_TS158: MMSDA PDF amount in words matches the figures',
    prepared: '12028_TS159: MMSDA PDF Prepared by shows the Drafter',
    checked: '12028_TS160: MMSDA PDF Checked by shows the Reviewer',
    approved: '12028_TS161: MMSDA PDF Approved by shows the Approver',
  },
};

interface Ctx { d: AplDetailsPage; month: string; pdf: SavedPdf; assoc: Assoc }
interface Field { spec: (c: Ctx) => Promise<HighlightSpec>; check: (c: Ctx) => Promise<void> }

/** "<label>:" followed by `value` (whitespace / line breaks allowed). */
const labelled = (label: string, value: string) => new RegExp(`${phraseRe(label).source}\\s*:?\\s*${phraseRe(value).source}`);
const has = (text: string, value: string) => phraseRe(value).test(text);

async function totalAmount(d: AplDetailsPage, assoc: Assoc): Promise<{ text: string; other: string }> {
  const data = await d.readStates();
  const total = d.totalRow(data);
  const mine = assoc === 'FMC' ? 'Cars (RM)' : 'Motorcycles (RM)';
  const other = assoc === 'FMC' ? 'Motorcycles (RM)' : 'Cars (RM)';
  await d.showValue(d.stateCell(data, total, mine));
  return { text: d.cell(data, total, mine), other: d.cell(data, total, other) };
}

/** The text after `label` up to the next sign-off label. */
function blockAfter(text: string, label: string): string {
  const at = text.search(phraseRe(label, 'i'));
  if (at < 0) throw new Error(`"${label}" is not on the PDF.`);
  const rest = text.slice(at + label.length);
  const next = rest.search(/Prepared\s*by|Checked\s*by|Approved\s*by/i);
  return next >= 0 ? rest.slice(0, Math.max(next, 200)) : rest;
}

function fixed(label: string, value: string, wrong?: string): Field {
  return {
    spec: async () => ({ expected: [label, value], forbidden: wrong ? [wrong] : [] }),
    check: async ({ pdf }) => {
      expect(pdf.text, `${label} "${value}"`).toMatch(labelled(label, value));
      if (wrong) expect(has(pdf.text, wrong) && !has(pdf.text, value), `"${wrong}" instead of "${value}"`).toBe(false);
    },
  };
}

function signOff(block: string, role: Role): Field {
  const name = () => required('E12028_NAME', `${role} full name`);
  return {
    spec: async () => ({ expected: [block, name()] }),
    check: async ({ d, pdf }) => {
      const date = await d.approvedDate(role);
      const part = blockAfter(pdf.text, block);
      expect(part, `${block}: ${name()}`).toMatch(phraseRe(name(), 'i'));
      expect(part, `${block}: ${role}'s approved date ${date}`).toContain(date);
      // Signature image: not readable from the PDF text — see the boxed screenshot.
    },
  };
}

function field(assoc: Assoc, key: Key): Field {
  const F = PDF_FIXED;
  const A = PDF_FIXED[assoc];
  switch (key) {
    case 'file': return {
      spec: async () => ({ expected: [] }),
      check: async ({ pdf, month }) => expect(pdf.suggested).toBe(`Payment Requisition_${assoc}_${month} ${CONFIG.year}.pdf`),
    };
    case 'header': return {
      spec: async () => ({ expected: F.header, forbidden: [PDF_WRONG.headerTypo] }),
      check: async ({ pdf }) => {
        for (const line of F.header) expect(has(pdf.text, line), `header "${line}"`).toBe(true);
        expect(pdf.text.includes(PDF_WRONG.headerTypo), `mock-up typo "${PDF_WRONG.headerTypo}"`).toBe(false);
      },
    };
    case 'title': return { spec: async () => ({ expected: [F.title] }), check: async ({ pdf }) => expect(pdf.text).toContain(F.title) };
    case 'to': return fixed('To', F.to);
    case 'attn': return fixed('Attn', F.attn, PDF_WRONG.attnSample);
    case 'adds': return {
      spec: async () => ({ expected: ['Adds', ...F.adds] }),
      check: async ({ pdf }) => expect(pdf.text).toMatch(new RegExp(`Adds\\s*:?\\s*${F.adds.map(a => phraseRe(a).source).join('\\s*,?\\s*')}`)),
    };
    case 'date': return {
      spec: async ({ d }) => ({ expected: ['Date', await d.approvedDate('Approver')] }),
      check: async ({ d, pdf, month }) => {
        const approved = await d.approvedDate('Approver');
        console.log(`DETAIL:${JSON.stringify({ label: `${month} Approver approved`, value: approved })}`);
        expect(/(?:^|\s)Date\s*:?\s*(\d{2}-\d{2}-\d{4})/.exec(pdf.text)?.[1], 'Date on the PDF').toBe(approved);
      },
    };
    case 'requestor': return {
      spec: async () => ({ expected: ['Requestor', required('E12028_NAME', 'Drafter full name')] }),
      check: async ({ pdf }) => expect(pdf.text).toMatch(labelled('Requestor', required('E12028_NAME', 'Drafter full name'))),
    };
    case 'reason1': return fixed('Reason for Payment', A.reason, assoc === 'FMC' ? PDF_FIXED.MMSDA.reason : PDF_FIXED.FMC.reason);
    case 'reason2': return {
      spec: async ({ month }) => ({ expected: [`${monShort(month)} ${CONFIG.year}`], forbidden: assoc === 'MMSDA' ? PDF_WRONG.malayMonths.map(m => `${m} ${CONFIG.year}`) : [] }),
      check: async ({ pdf, month }) => {
        expect(pdf.text, `"${monShort(month)} ${CONFIG.year}" after the reason`).toMatch(new RegExp(`${phraseRe(A.reason).source}\\s*${monShort(month)}\\s*${CONFIG.year}`));
        if (assoc === 'MMSDA') expect(PDF_WRONG.malayMonths.filter(m => new RegExp(`\\b${m}\\s*${CONFIG.year}`).test(pdf.text)), 'Malay month name').toEqual([]);
      },
    };
    case 'amount': return {
      spec: async ({ d }) => { const a = await totalAmount(d, assoc); return { expected: ['Amount Payable', a.text], forbidden: a.other !== a.text ? [a.other] : [] }; },
      check: async ({ d, pdf }) => {
        const a = await totalAmount(d, assoc);
        const after = pdf.text.slice(Math.max(0, pdf.text.search(/Amount\s*Payable/i)));
        expect(after, `Amount Payable ${a.text}`).toMatch(new RegExp(`(?<![\\d.,])${escapeRe(a.text)}(?!\\d)`));
        if (a.other !== a.text) expect(after.includes(a.other), `the other association's amount ${a.other}`).toBe(false);
      },
    };
    case 'words': return {
      spec: async ({ d }) => ({ expected: [amountInWords(toNumber((await totalAmount(d, assoc)).text, 'TOTAL'))] }),
      check: async ({ d, pdf }) => {
        const words = amountInWords(toNumber((await totalAmount(d, assoc)).text, 'TOTAL'));
        // [unconfirmed] wording style from the sample xlsx R30 ("… THOUSAND THIRTY FIVE ONLY").
        expect(pdf.text.toUpperCase(), `words "${words}"`).toMatch(phraseRe(words));
      },
    };
    case 'prepared': return signOff('Prepared by', 'Drafter');
    case 'checked': return signOff('Checked by', 'Reviewer');
    case 'approved': return signOff('Approved by', 'Approver');
    default: {
      const value = A.payTo[key];
      return fixed(key, value, assoc === 'FMC' && key === 'Account Holder Name' ? PDF_WRONG.fmcHolderSample : undefined);
    }
  }
}

for (const assoc of ['FMC', 'MMSDA'] as const) {
  for (const [key, title] of Object.entries(TITLES[assoc]) as [Key, string][]) {
    const ts = title.split(':')[0];
    test(title, tagOf(ts), async ({ page }) => {
      const { d, month } = await openAs(page, ts, 'approver', 'Full');
      const btn = assoc === 'FMC' ? d.fmcBtn() : d.mmsdaBtn();
      const pdf = await test.step(`Click [${assoc} Payment Request] and save the PDF`, async () => savePdf(await d.download(btn, `${assoc} Payment Request`), `${ts}-${assoc}`));
      const ctx: Ctx = { d, month, pdf, assoc };
      const f = field(assoc, key);
      await test.step('Save a screenshot of the PDF with the checked words boxed', async () => {
        await highlightPdf(page, pdf, `${ts}-checked`, await f.spec(ctx), title);
      });
      await test.step(`Check: ${title.slice(title.indexOf(':') + 2)}`, async () => {
        await d.verify(`${ts}-pdf`, btn, `${assoc} PDF check failed — see ${ts}-checked.png`, async () => f.check(ctx));
      });
    });
  }
}
