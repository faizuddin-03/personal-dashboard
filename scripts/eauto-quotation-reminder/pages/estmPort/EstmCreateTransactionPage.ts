import { Page } from '@playwright/test';
import { EstmSession } from './EstmSession';
import { CONFIG } from '../../../eauto-estm/data/config';

/**
 * VERBATIM PORT of `scripts/eauto-estm/pages/CreateTransactionPage.ts` — see
 * `EstmSession.ts` in this directory for why.
 */
export class EstmCreateTransactionPage {
  constructor(private readonly page: Page, private readonly session: EstmSession) {}

  private eSerahanBtn = () => this.page.getByRole('button', { name: 'eSERAHAN' });
  private createBtn   = () => this.page.getByRole('button', { name: 'CREATE eSERAHAN TRANSACTION' });
  private closeBtn    = () => this.page.getByRole('button', { name: 'Close', exact: true });
  private malaysianLink = () => this.page.getByRole('link', { name: 'MALAYSIAN ( 马来西亚公民) ' });
  private myPrLink      = () => this.page.getByRole('link', { name: 'MyPR - PEMASTAUTIN TETAP' });
  private initialYes    = () => this.page.locator('button.confirm-dialog-btn', { hasText: 'Yes' }).first();

  async openAndCreate(): Promise<void> {
    await this.session.closePopupIfPresent();
    this.session.progress('popup', 'Close Popup');

    for (let attempt = 0; attempt < 4; attempt++) {
      await this.session.closePopupIfPresent();
      try { await this.eSerahanBtn().click({ timeout: 4000 }); break; }
      catch (err) { if (attempt === 3) throw err; await this.page.waitForTimeout(250); }
    }
    this.session.progress('eserahan', 'Click eSERAHAN');

    await this.createBtn().click();
    this.session.progress('create_btn', 'Create Transaction');
    await this.closeBtn().click();
  }

  async selectIdType(): Promise<void> {
    if (CONFIG.idType === '1') await this.malaysianLink().click();
    else await this.myPrLink().click();
    this.session.progress('id_type', 'Select ID Type');

    await this.initialYes().waitFor({ state: 'visible', timeout: 10000 }).catch(() => {});
    await this.initialYes().click({ timeout: 5000 }).catch(async () => {
      await this.initialYes().click({ force: true, timeout: 5000 }).catch(async () => {
        await this.initialYes().evaluate((el) => (el as HTMLElement).click()).catch(() => {});
      });
    });
    await this.session.waitForDomReady();
  }
}
