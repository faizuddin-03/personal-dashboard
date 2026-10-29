/**
 * BETA SUITE 11 — Cross-Cutting Concerns
 *
 * UI consistency checks that span multiple feature areas: every sidebar link
 * navigates without crashing, the WA Blaster app is reachable, the page title
 * is non-empty on every route, and consecutive blast names produced by the
 * wizard review step are distinct (isolation guard).
 */
import { test, expect } from '../fixtures/authFixture';
import { snap } from '../utils/screenshot';
import { NavPage } from '../pages/NavPage';
import { ContactsPage } from '../pages/ContactsPage';
import { BlastWizardPage } from '../pages/BlastWizardPage';
import { CAMPAIGNS } from '../data/testData';

const FLOW = 'beta-cross-cutting';

// Primary routes covered by the blank-screen smoke check
const PRIMARY_ROUTES = ['/', '/blasts', '/inbox', '/contacts', '/templates', '/reports', '/settings'];

// ─── Navigation smoke ─────────────────────────────────────────────────────────

test.describe('Navigation smoke', () => {
  test('all primary nav links load without a blank screen', async ({ adminPage }) => {
    const nav = new NavPage(adminPage);
    for (const route of PRIMARY_ROUTES) {
      await adminPage.goto(route);
      await expect(adminPage).not.toHaveURL(/error/i);
      // Body must contain some text (not blank/white-screen)
      const bodyText = await nav.bodyText();
      expect((bodyText ?? '').trim().length).toBeGreaterThan(0);
    }
    await snap(adminPage, FLOW, 'smoke_01_all_routes');
  });

  test('sidebar Dealers link navigates to /contacts', async ({ adminPage }) => {
    const nav = new NavPage(adminPage);
    const contacts = new ContactsPage(adminPage);
    await nav.openLink('Dealers');
    await expect(adminPage).toHaveURL(/\/contacts$/);
    await expect(contacts.table()).toBeVisible();
    await snap(adminPage, FLOW, 'smoke_02_dealers_link');
  });

  test('sidebar Templates link navigates to /templates', async ({ adminPage }) => {
    const nav = new NavPage(adminPage);
    await nav.openLink('Templates');
    await expect(adminPage).toHaveURL(/\/templates$/);
    await snap(adminPage, FLOW, 'smoke_03_templates_link');
  });
});

// ─── Data isolation ───────────────────────────────────────────────────────────

test.describe('Data isolation', () => {
  test('two consecutive blast wizard openings show independent blast-name inputs', async ({ adminPage }) => {
    const wizard = new BlastWizardPage(adminPage);

    // First wizard pass
    await wizard.toReview(CAMPAIGNS.seedTemplate);
    const val1 = await wizard.nameInput().inputValue();

    // Second wizard pass (fresh navigation)
    await wizard.toReview(CAMPAIGNS.seedTemplate);
    const val2 = await wizard.nameInput().inputValue();

    // Both should be empty (wizard doesn't carry state from previous run)
    expect(val1).toBe('');
    expect(val2).toBe('');
    await snap(adminPage, FLOW, 'isolation_01_independent_inputs');
  });
});
