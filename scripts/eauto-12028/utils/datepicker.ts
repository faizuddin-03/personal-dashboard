import { Page, Locator } from '@playwright/test';
import { CONFIG } from '../data/config';

// Picks a date in a readonly jQuery UI datepicker the way a person does:
// open it, move to the right month, click the day. Used by the 12412 report
// pages (SST Payment Report, e-Invoice / Consolidated e-Invoice Listing,
// UCD Payment Breakdown Report). Readonly fields cannot be .fill()'d.
//
// Two widget shapes exist on eAuto: month/year <select>s in the title
// (BO e-Invoice listing — _reference/html/eauto/bo-einvoice-consolidated-listing-search-results.html,
// BO Transaction Enquiry) or only Prev/Next arrows. The selects are used
// when present; otherwise the arrows, reading the title ("October 2026").

const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/** Parses eAuto listing dates "30-09-2026 14:20" / "30-09-2026". */
export function parseListingDate(text: string): Date {
  const m = /(\d{1,2})-(\d{1,2})-(\d{4})/.exec(text);
  if (!m) throw new Error(`Unrecognised date "${text}" (expected DD-MM-YYYY).`);
  return new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
}

export async function pickDatepickerDate(page: Page, input: Locator, date: Date): Promise<string> {
  const widget = page.locator('#ui-datepicker-div');
  const label = `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  await input.click();
  await widget.waitFor({ state: 'visible', timeout: CONFIG.navigationTimeout });

  const yearSel = widget.locator('select.ui-datepicker-year');
  const monthSel = widget.locator('select.ui-datepicker-month');
  if (await yearSel.count()) await yearSel.selectOption(String(date.getFullYear()));
  if (await monthSel.count()) await monthSel.selectOption(String(date.getMonth()));

  if (!(await monthSel.count())) {
    for (let i = 0; i < 36; i++) {
      const title = ((await widget.locator('.ui-datepicker-title').innerText()) || '').toLowerCase();
      const month = MONTHS.findIndex(m => title.includes(m));
      const year = Number(/(\d{4})/.exec(title)?.[1]);
      if (month < 0 || !year) throw new Error(`Cannot read the datepicker title "${title}".`);
      const diff = (date.getFullYear() - year) * 12 + (date.getMonth() - month);
      if (diff === 0) break;
      await widget.locator(diff < 0 ? 'a.ui-datepicker-prev' : 'a.ui-datepicker-next').click();
    }
  }

  const day = widget
    .locator('td:not(.ui-datepicker-other-month):not(.ui-datepicker-unselectable) a', { hasText: new RegExp(`^${date.getDate()}$`) })
    .first();
  if (!(await day.count())) throw new Error(`${label} is not selectable in the calendar.`);
  await day.click();
  const value = await input.inputValue();
  if (!value) throw new Error(`Could not set the date to ${label} — the field is still empty.`);
  return value;
}
