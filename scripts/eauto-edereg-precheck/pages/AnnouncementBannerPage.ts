import { Page } from '@playwright/test';
import { PrecheckSession } from '../utils/session';

// ── AM_TS1-4 (EAINT-9306 Announcement Message table) ────────
// All 4 rows check the SAME compulsory-gate compliance banner (message +
// red + bold styling), just on 4 different screens/states:
//   AM_TS1 — AATF home, under the homepage nav buttons
//   AM_TS2 — eDEREG menu, under the eDEREG page options buttons
//   AM_TS3 — Create Deregistration Transaction (Kategori ID), under the
//            MyKad/MyPR option
//   AM_TS4 — same page, WITH the category-confirmation popup open, under
//            the MyKad/MyPR option, below the popup
// The banner div has no id or class on any of the 3 screens it appears on
// (EAINT-9306-aatf-home-and-menu.html STATE 1/3, confirmed live 2026-08-21;
// ...-dereg-create-category-select.html STATE 1, confirmed live 2026-08-21)
// — located by its own text instead. AM_TS4's "still visible under the
// popup" state was never captured as real HTML (only a comment describing
// the popup's shape) — the banner div itself sits outside the jQuery UI
// dialog/overlay, so it should stay in the DOM and visible underneath, but
// that's unconfirmed until run live.
const BANNER_TEXT_SNIPPET = 'AATF is required to complete the eDereg Pre-checking process';
const BANNER_TEXT_FULL = 'Effective immediately, AATF is required to complete the eDereg Pre-checking process '
  + 'prior to proceeding with Deregistration, and Deregistration may only be carried out upon successful '
  + 'completion of the said pre-checking.';

export interface BannerCheckResult {
  tsNo: string;
  page: string;
  visible: boolean;
  textMatches: boolean;
  isRed: boolean;
  isBold: boolean;
  actualText: string;
  actualColor: string;
  actualFontWeight: string;
}

export class AnnouncementBannerPage {
  constructor(private readonly page: Page, private readonly session: PrecheckSession) {}

  /** Checks the compliance banner on whatever screen is currently active —
   *  text presence, red color, bold weight, per the test plan's "Format:
   *  1. Red 2. Bolded" note under the Announcement Message table. */
  async checkBanner(tsNo: string, pageLabel: string): Promise<BannerCheckResult> {
    const p = await this.session.waitForActivePage();
    const banner = p.getByText(BANNER_TEXT_SNIPPET, { exact: false }).first();

    const visible = await banner.isVisible({ timeout: 10_000 }).catch(() => false);
    let actualText = '';
    let actualColor = '';
    let actualFontWeight = '';
    if (visible) {
      actualText = (await banner.textContent().catch(() => ''))?.trim() ?? '';
      const style = await banner.evaluate((el) => {
        const cs = getComputedStyle(el as HTMLElement);
        return { color: cs.color, fontWeight: cs.fontWeight };
      }).catch(() => ({ color: '', fontWeight: '' }));
      actualColor = style.color;
      actualFontWeight = style.fontWeight;
    }

    const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();
    const textMatches = normalize(actualText).includes(normalize(BANNER_TEXT_FULL));
    const isRed = actualColor === 'rgb(255, 0, 0)';
    const isBold = actualFontWeight === 'bold' || Number(actualFontWeight) >= 700;

    this.session.progress(
      `am-banner-${tsNo}`,
      `${tsNo} (${pageLabel}): banner ${visible ? 'visible' : 'MISSING'}`
        + (visible ? `, red=${isRed}, bold=${isBold}, textMatches=${textMatches}` : ''),
    );
    // The banner is on screen right now — hold before moving to the next
    // screen, per Faizuddin 2026-08-24 (knowledge/flow-edereg.md §12).
    await this.session.pauseForDetails();

    return { tsNo, page: pageLabel, visible, textMatches, isRed, isBold, actualText, actualColor, actualFontWeight };
  }
}
