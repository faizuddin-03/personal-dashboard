import { Page } from '@playwright/test';
import { BasePage } from './BasePage';

// ── Segments page (/segments) ───────────────────────────────
export class SegmentsPage extends BasePage {
  // locator getters for spec assertions
  tierChip    = (tier: string) => this.page.getByTestId(`filter-tier-${tier}`);
  segmentRows = () => this.page.locator('[data-testid^="segment-row-"]');
  rowByName   = (name: string) => this.segmentRows().filter({ hasText: name });

  constructor(page: Page) { super(page); }

  async goto(): Promise<void> {
    await this.page.goto('/segments');
  }
}
