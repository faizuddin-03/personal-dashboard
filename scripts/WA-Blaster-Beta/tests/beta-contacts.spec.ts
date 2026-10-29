/**
 * BETA SUITE 5 — Dealers / Contacts
 *
 * CSV bulk import, dealer table UI (search + specialization chip), manual
 * dealer add with duplicate-phone guard, and full manual contact lifecycle
 * (create → edit → delete).
 */
import { test, expect } from '../fixtures/authFixture';
import { snap } from '../utils/screenshot';
import { NavPage } from '../pages/NavPage';
import { ContactsPage } from '../pages/ContactsPage';
import { ContactImportPage } from '../pages/ContactImportPage';
import { ContactFormPage } from '../pages/ContactFormPage';
import { CONTACTS } from '../data/testData';

const FLOW = 'beta-contacts';

// ─── CSV import ───────────────────────────────────────────────────────────────

test.describe('CSV contact import', () => {
  test('Import button disabled until file selected', async ({ adminPage }) => {
    const importPage = new ContactImportPage(adminPage);
    await importPage.goto();
    await expect(importPage.importForm()).toBeVisible();
    await expect(importPage.csvSubmit()).toBeDisabled();
    await snap(adminPage, FLOW, 'import_01_no_file');
  });

  test('valid CSV imports successfully — shows Imported count', async ({ adminPage }) => {
    const importPage = new ContactImportPage(adminPage);
    await importPage.goto();
    await importPage.setCsvFile(CONTACTS.validCsv);
    await expect(importPage.csvSubmit()).toBeEnabled();
    await importPage.submitCsv();
    await expect(importPage.importResult()).toBeVisible({ timeout: 15_000 });
    await expect(importPage.text('Imported')).toBeVisible();
    await expect(importPage.text('Skipped (duplicates)')).toBeVisible();
    await snap(adminPage, FLOW, 'import_02_valid_result');

    await importPage.backToContacts();
    await expect(adminPage).toHaveURL(/\/contacts$/);
    await snap(adminPage, FLOW, 'import_03_back_to_list');
  });

  test('CSV with invalid rows surfaces the error list', async ({ adminPage }) => {
    const importPage = new ContactImportPage(adminPage);
    await importPage.goto();
    await importPage.setCsvFile(CONTACTS.invalidCsv);
    await importPage.submitCsv();
    await expect(importPage.importResult()).toBeVisible({ timeout: 15_000 });
    await expect(importPage.importErrors()).toBeVisible();
    await expect(importPage.importErrorItems()).toHaveCount(2);
    await snap(adminPage, FLOW, 'import_04_errors_listed');
  });

  test('Cancel on import page returns to contacts list', async ({ adminPage }) => {
    const importPage = new ContactImportPage(adminPage);
    await importPage.goto();
    await importPage.cancel();
    await expect(adminPage).toHaveURL(/\/contacts$/);
    await snap(adminPage, FLOW, 'import_05_cancel_returns');
  });
});

// ─── Dealers table ────────────────────────────────────────────────────────────

test.describe('Dealers table', () => {
  test('dealers table renders with rows', async ({ adminPage }) => {
    const nav = new NavPage(adminPage);
    const contacts = new ContactsPage(adminPage);
    await nav.openLink('Dealers');
    await expect(contacts.table()).toBeVisible();
    await expect(contacts.rows().first()).toBeVisible();
    await snap(adminPage, FLOW, 'dealer_01_table');
  });

  test('search filters the dealer list', async ({ adminPage }) => {
    const nav = new NavPage(adminPage);
    const contacts = new ContactsPage(adminPage);
    await nav.openLink('Dealers');
    await expect(contacts.table()).toBeVisible();
    await contacts.search(CONTACTS.searchTerm);
    await expect(contacts.table()).toContainText(CONTACTS.searchTerm);
    await snap(adminPage, FLOW, 'dealer_02_search');
  });

  test('EV/Hybrid specialization chip filters without crashing', async ({ adminPage }) => {
    const nav = new NavPage(adminPage);
    const contacts = new ContactsPage(adminPage);
    await nav.openLink('Dealers');
    const chip = contacts.specializationChip(/EV.Hybrid/i);
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await expect(contacts.table()).toBeVisible();
    await snap(adminPage, FLOW, 'dealer_03_ev_hybrid_filter');
  });

  test('admin adds dealer via modal — appears in table', async ({ adminPage }) => {
    const nav = new NavPage(adminPage);
    const contacts = new ContactsPage(adminPage);
    await nav.openLink('Dealers');
    await expect(contacts.addDealerButton()).toBeVisible();

    const suffix = Date.now().toString().slice(-7);
    const name   = `${CONTACTS.dealerNamePrefix} ${suffix}`;
    const phone  = `${CONTACTS.dealerPhonePrefix}${suffix}`;

    await contacts.addDealer({ name, phone, tier: CONTACTS.dealerTier, spec: CONTACTS.dealerSpec });
    await expect(contacts.addDealerSubmit()).toBeHidden();

    await contacts.search(name);
    await expect(contacts.table()).toContainText(name);
    await snap(adminPage, FLOW, 'dealer_04_added');
  });

  test('duplicate phone number shows error in add-dealer modal', async ({ adminPage }) => {
    const nav = new NavPage(adminPage);
    const contacts = new ContactsPage(adminPage);
    await nav.openLink('Dealers');

    const suffix = Date.now().toString().slice(-7);
    const phone  = `${CONTACTS.dealerPhonePrefix}4${suffix}`;

    // First add
    await contacts.addDealer({
      name: `${CONTACTS.dealerNamePrefix} Dup A ${suffix}`,
      phone,
      tier: CONTACTS.dealerTier,
      spec: CONTACTS.dealerSpec,
    });
    await expect(contacts.addDealerSubmit()).toBeHidden();

    // Duplicate attempt
    await contacts.addDealer({ name: `${CONTACTS.dealerNamePrefix} Dup B ${suffix}`, phone });
    await expect(contacts.addDealerError()).toBeVisible();
    await expect(contacts.addDealerError()).toContainText('already exists');
    await snap(adminPage, FLOW, 'dealer_05_duplicate_error');
  });
});

// ─── Manual contact lifecycle ─────────────────────────────────────────────────

test.describe('Manual contact lifecycle', () => {
  test('create contact → verify in list', async ({ adminPage }) => {
    const form = new ContactFormPage(adminPage);
    const contacts = new ContactsPage(adminPage);
    await form.gotoNew();
    await expect(form.form()).toBeVisible();

    const suffix     = Date.now().toString().slice(-8);
    const localPhone = `01${suffix}`;

    const contactName = `${CONTACTS.contactNamePrefix} ${suffix.slice(-4)}`;
    await form.fillPhone(localPhone);
    await form.fillName(contactName);
    await form.selectEthnicity('MALAY');
    await form.selectLanguage('MS');
    await form.selectState(CONTACTS.contactState);
    await form.selectOptin('OPTED_IN');
    await form.submit();

    await expect(adminPage).toHaveURL(/\/contacts$/);
    await contacts.search(contactName);
    await expect(contacts.text(contactName)).toBeVisible();
    await snap(adminPage, FLOW, 'contact_01_created');
  });

  test('edit contact name then delete', async ({ adminPage }) => {
    const form = new ContactFormPage(adminPage);
    const contacts = new ContactsPage(adminPage);
    await form.gotoNew();
    const suffix     = Date.now().toString().slice(-8);
    const localPhone = `02${suffix}`;

    const editName    = `${CONTACTS.contactNamePrefix} Edit ${suffix.slice(-4)}`;
    const renamedName = `${CONTACTS.contactNamePrefix} Renamed ${suffix.slice(-4)}`;
    await form.fillPhone(localPhone);
    await form.fillName(editName);
    await form.selectEthnicity('MALAY');
    await form.selectLanguage('EN');
    await form.selectState('KL');
    await form.selectOptin('OPTED_IN');
    await form.submit();
    await expect(adminPage).toHaveURL(/\/contacts$/);

    const contactId = await contacts.contactIdOf(editName);
    await form.gotoEdit(contactId);
    await form.fillName(renamedName);
    await form.submit();
    await expect(adminPage).toHaveURL(/\/contacts$/);
    await contacts.search(renamedName);
    await expect(contacts.text(renamedName)).toBeVisible();
    await snap(adminPage, FLOW, 'contact_02_renamed');

    const renamedId = await contacts.contactIdOf(renamedName);
    form.acceptNextDialog();
    await form.gotoEdit(renamedId);
    await form.deleteContact();
    await expect(adminPage).toHaveURL(/\/contacts$/);
    await contacts.search(renamedName);
    await expect(contacts.text(renamedName)).toHaveCount(0);
    await snap(adminPage, FLOW, 'contact_03_deleted');
  });
});
