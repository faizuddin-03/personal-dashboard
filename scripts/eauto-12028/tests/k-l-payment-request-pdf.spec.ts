import { test, expect } from '@playwright/test';
import { openAs } from '../utils/workflow';
import { tagOf } from '../data/priority';
import { CONFIG, required } from '../data/config';
import { PDF_FIXED, PDF_WRONG } from '../data/expected';
import { AplDetailsPage, Role } from '../pages/AplDetailsPage';
import { amountInWords, escapeRe, monShort, phraseRe, toNumber } from '../utils/format';
import { savePdf, highlightPdf, SavedPdf } from '../utils/pdf';
import { HighlightSpec } from '../utils/pdfHighlight';
import { Checks } from '../utils/combined';

// K. FMC Payment Request PDF (12028_TS55) and L. MMSDA Payment Request PDF
// (12028_TS56). Steps (scenarios.json): Login to BO as Approver; [View] a
// fully approved month; click the button; open the PDF. Every SRD v1.1 field
// is checked in one TS: §2.2.10 (FMC) / §2.2.11 (MMSDA), quoted in
// data/expected.ts. The PDF and a green / red boxed screenshot of every
// checked word are saved (pdfHighlight, copied from scripts/eauto-jomcheck).
// Each field check that fails gets its own red box; one assertion at the end
// lists them all. [unconfirmed] PDF text order: values are looked for right
// after their label.

type Assoc = 'FMC' | 'MMSDA';
type Key = 'file' | 'header' | 'title' | 'to' | 'attn' | 'adds' | 'date' | 'requestor' | 'reason1' | 'reason2'
  | 'Account Holder Name' | 'Bank Name' | 'Bank Account No.' | 'Person in charge' | 'Contact Number' | 'Email Address'
  | 'amount' | 'words' | 'prepared' | 'checked' | 'approved';

const KEYS: Key[] = ['file', 'header', 'title', 'to', 'attn', 'adds', 'date', 'requestor', 'reason1', 'reason2',
  'Account Holder Name', 'Bank Name', 'Bank Account No.', 'Person in charge', 'Contact Number', 'Email Address',
  'amount', 'words', 'prepared', 'checked', 'approved'];

/** Full names typed on the row (the people who approved this month). */
const NAME_KEY: Record<Role, string> = { Drafter: 'E12028_NAME', Reviewer: 'E12028_NAME2', Approver: 'E12028_NAME3' };
const nameOf = (role: Role) => required(NAME_KEY[role], `${role} full name`);

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
  return {
    spec: async () => ({ expected: [block, nameOf(role)] }),
    check: async ({ d, pdf }) => {
      const date = await d.approvedDate(role);
      const part = blockAfter(pdf.text, block);
      expect(part, `${block}: ${nameOf(role)}`).toMatch(phraseRe(nameOf(role), 'i'));
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
      spec: async () => ({ expected: ['Requestor', nameOf('Drafter')] }),
      check: async ({ pdf }) => expect(pdf.text).toMatch(labelled('Requestor', nameOf('Drafter'))),
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

for (const t of [
  { title: "12028_TS55: FMC Payment Request PDF shows the SRD fields and the month's car amount", assoc: 'FMC' as Assoc },
  { title: "12028_TS56: MMSDA Payment Request PDF shows the SRD fields and the month's motorcycle amount", assoc: 'MMSDA' as Assoc },
]) {
  const ts = t.title.split(':')[0];
  test(t.title, tagOf(ts), async ({ page }) => {
    const { d, month } = await openAs(page, ts, 'approver', 'Full', 'E12028_MONTH', 'Fully approved month');
    const btn = t.assoc === 'FMC' ? d.fmcBtn() : d.mmsdaBtn();
    const pdf = await test.step(`Click [${t.assoc} Payment Request] and save the PDF`, async () => savePdf(await d.download(btn, `${t.assoc} Payment Request`), `${ts}-${t.assoc}`));
    const ctx: Ctx = { d, month, pdf, assoc: t.assoc };
    const fields = KEYS.map(k => ({ k, f: field(t.assoc, k) }));
    await test.step('Save a screenshot of the PDF with every checked word boxed', async () => {
      const specs: HighlightSpec[] = [];
      for (const x of fields) specs.push(await x.f.spec(ctx));
      await highlightPdf(page, pdf, `${ts}-checked`, { expected: specs.flatMap(x => x.expected), forbidden: specs.flatMap(x => x.forbidden ?? []) }, t.title);
    });
    const c = new Checks(d, ts);
    for (const { k, f } of fields) {
      await test.step(`Check the PDF: ${k}`, async () => { await c.run(`${t.assoc} ${k}`, btn, () => f.check(ctx)); });
    }
    c.done();
  });
}
