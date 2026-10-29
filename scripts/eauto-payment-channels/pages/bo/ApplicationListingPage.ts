import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { pending } from '../../utils/pendingHtml';

// ── BO — Application Listing ────────────────────────────────
// Sheet wording (Continuation Steps 1-2, identical across TS3-TS8):
//   1. BO - Open Application Listing and view Pre-Application tab
//   2. BO - Copy the Application Link and open in a new tab
export class ApplicationListingPage extends BasePage {
  constructor(page: Page) { super(page); }

  async goto(): Promise<void> {
    pending('ApplicationListingPage.goto — Application Listing URL unknown');
  }

  async openPreApplicationTab(): Promise<void> {
    pending('ApplicationListingPage.openPreApplicationTab — tab selector unknown');
  }

  /** Returns the copied Application Link so the caller can open it in a new UCD-side tab. */
  async copyApplicationLink(rowMatcher: string): Promise<string> {
    pending(`ApplicationListingPage.copyApplicationLink("${rowMatcher}") — row-matching + copy-link control unknown`);
  }
}
