import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { pending } from '../../utils/pendingHtml';

// ── Application module — UCD side of the Continuation Steps ─
// Sheet wording (identical across TS3-TS8):
//   3. UCD - Fill in the application details until complete
//   6. UCD - Refresh the Application Link and upload the documents in Page 4
//   8. UCD - Refresh the Application Link and Ensure system redirects to
//      Application Page 5
export class ApplicationContinuationPage extends BasePage {
  constructor(page: Page) { super(page); }

  async openViaLink(applicationLink: string): Promise<void> {
    pending('ApplicationContinuationPage.openViaLink — Application Link URL shape unknown');
  }

  /** Step 3 — fill the Application form through to completion (all pages before Page 4's documents). */
  async fillApplicationDetailsUntilComplete(): Promise<void> {
    pending('ApplicationContinuationPage.fillApplicationDetailsUntilComplete — Application form field set unknown');
  }

  /** Step 6 — after BO sets group + submits for approval, refresh and upload documents on Page 4. */
  async refreshAndUploadDocumentsPage4(): Promise<void> {
    pending('ApplicationContinuationPage.refreshAndUploadDocumentsPage4 — Page 4 document upload fields unknown');
  }

  /** Step 8 — after BO verifies documents, refresh and land on Application Page 5 (the payment step). */
  async refreshAndExpectPage5(): Promise<void> {
    pending('ApplicationContinuationPage.refreshAndExpectPage5 — Page 5 arrival signal unknown');
  }
}
