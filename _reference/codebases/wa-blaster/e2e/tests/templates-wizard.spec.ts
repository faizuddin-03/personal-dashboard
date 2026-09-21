import { test, expect, type Page } from '@playwright/test';

const ADMIN_EMAIL = 'admin@example.com';
const ADMIN_PASSWORD = 'ChangeMe123!';

async function loginAsAdmin(page: Page) {
  await page.goto('/login');
  await page.getByTestId('email').fill(ADMIN_EMAIL);
  await page.getByTestId('password').fill(ADMIN_PASSWORD);
  await page.getByTestId('submit').click();
  await expect(page).toHaveURL(/\/$/);
}

/** Mock the LLM endpoint and drive the wizard to Step 3 (review). */
async function openWizardToReview(page: Page) {
  await page.route('**/templates/generate', (route) =>
    route.fulfill({
      status: 201,
      contentType: 'application/json',
      body: JSON.stringify([
        {
          language: 'EN',
          name: 'service_reminder',
          category: 'UTILITY',
          body: 'Hi {{1}}, your service is due on {{2}}.',
          variables: ['name', 'date'],
          approvalLikelihood: 'HIGH',
          rationale: 'Transactional reminder with clear variables.',
        },
      ]),
    }),
  );

  await page.getByRole('link', { name: 'Templates' }).click();
  await page.getByTestId('add-template').click();
  await page.getByTestId('wizard-brief').fill('Service reminder for customers');
  await page.getByRole('button', { name: 'Generate suggestions' }).click();
  // Step 2: first draft is auto-picked
  await page.getByRole('button', { name: 'Continue' }).click();
  // Step 3: name input visible
  await expect(page.getByTestId('wizard-name')).toBeVisible();
}

test.describe('AI wizard draft persistence', () => {
  test('edit content, save as draft, draft appears in list with edits', async ({ page }) => {
    await loginAsAdmin(page);
    const templateName = `e2e_wizard_${Date.now().toString().slice(-8)}`;
    await openWizardToReview(page);

    await page.getByTestId('wizard-name').fill(templateName);

    // Edit the body, apply locally
    await page.getByTestId('wizard-edit-content').click();
    await page
      .getByTestId('wizard-edit-body-EN')
      .fill('Hi {{1}}, your car service is due on {{2}}. Book via eAuto.');
    await page.getByTestId('wizard-apply-edits').click();

    // Persist as draft (no Meta submission)
    await page.getByTestId('wizard-save-draft').click();

    // Wizard closes, draft family visible in the list
    await expect(page.getByTestId('wizard-backdrop')).toBeHidden();
    await expect(page.getByTestId(`template-group-${templateName}`)).toBeVisible();

    // Open detail: status DRAFT, edited body persisted
    await page.getByTestId(`template-group-${templateName}`).click();
    await expect(page.getByTestId('status-badge-DRAFT').first()).toBeVisible();
    await expect(page.getByText('Book via eAuto').first()).toBeVisible();
    await expect(page.getByTestId('template-submit-meta')).toBeVisible();
  });

  test('closing the wizard at review step warns before discarding', async ({ page }) => {
    await loginAsAdmin(page);
    await openWizardToReview(page);

    // Dismissing the confirm keeps the wizard open
    page.once('dialog', (dialog) => dialog.dismiss());
    await page.getByLabel('close').click();
    await expect(page.getByTestId('wizard-backdrop')).toBeVisible();

    // Accepting the confirm closes it
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByLabel('close').click();
    await expect(page.getByTestId('wizard-backdrop')).toBeHidden();
  });
});
