import { Page } from '@playwright/test';
import { BasePage } from '../BasePage';
import { pending } from '../../utils/pendingHtml';

// ── BO — Application approval flow ──────────────────────────
// Sheet wording (Continuation Steps 4-5, 7 — identical across TS3-TS8):
//   4. BO (mfared) - Set UCD group to Authorized Dealer and click "Submit
//      For Approval"
//   5. BO (jasons) - Click the Approve button in the BO Application form
//   7. BO (mfared) - Open the Application Details > Registration Documents
//      tab > Click Verified
// Steps 4 and 7 are the SAME BO user (mfared) but happen on a fresh page
// load each time (the UCD side interleaves between them) — call
// `openApplicationDetails()` again before step 7 rather than assuming the
// page is still on the same view.
export class ApplicationApprovalPage extends BasePage {
  constructor(page: Page) { super(page); }

  async openApplicationDetails(applicationRef: string): Promise<void> {
    pending(`ApplicationApprovalPage.openApplicationDetails("${applicationRef}") — Application Details page URL/selector unknown`);
  }

  /** mfared — step 4a. */
  async setUcdGroupAuthorizedDealer(): Promise<void> {
    pending('ApplicationApprovalPage.setUcdGroupAuthorizedDealer — UCD group field/value selector unknown');
  }

  /** mfared — step 4b. */
  async clickSubmitForApproval(): Promise<void> {
    pending('ApplicationApprovalPage.clickSubmitForApproval — button selector unknown');
  }

  /** jasons — step 5. */
  async clickApprove(): Promise<void> {
    pending('ApplicationApprovalPage.clickApprove — button selector unknown');
  }

  /** mfared — step 7a. */
  async openRegistrationDocumentsTab(): Promise<void> {
    pending('ApplicationApprovalPage.openRegistrationDocumentsTab — tab selector unknown');
  }

  /** mfared — step 7b. */
  async clickVerified(): Promise<void> {
    pending('ApplicationApprovalPage.clickVerified — button selector unknown');
  }
}
