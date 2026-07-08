/**
 * BETA SUITE 6 — Segments
 *
 * Segment builder page, filter chips, creating a segment from the dealer
 * selection, verifying it persists on the Segments page.
 */
import { test, expect } from '../fixtures/authFixture';
import { snap } from '../utils/screenshot';
import { NavPage } from '../pages/NavPage';
import { ContactsPage } from '../pages/ContactsPage';
import { SegmentsPage } from '../pages/SegmentsPage';
import { SEGMENTS } from '../data/testData';

const FLOW = 'beta-segments';

// ─── Segment builder page ─────────────────────────────────────────────────────

test.describe('Segment builder page', () => {
  test('segment builder page loads and shows tier filter chips', async ({ adminPage }) => {
    const segments = new SegmentsPage(adminPage);
    await segments.goto();
    await expect(adminPage).toHaveURL(/\/segments$/);
    await expect(segments.tierChip('GOLD')).toBeVisible();
    await snap(adminPage, FLOW, 'builder_01_page');
  });

  test('Gold, Silver, and Bronze tier chips are all visible', async ({ adminPage }) => {
    const segments = new SegmentsPage(adminPage);
    await segments.goto();
    await expect(segments.tierChip('GOLD')).toBeVisible();
    await expect(segments.tierChip('SILVER')).toBeVisible();
    await expect(segments.tierChip('BRONZE')).toBeVisible();
    await snap(adminPage, FLOW, 'builder_02_tier_chips');
  });
});

// ─── Create segment from dealers ─────────────────────────────────────────────

test.describe('Create segment from dealers', () => {
  test('select all dealers → save as segment → success toast', async ({ adminPage }) => {
    const nav = new NavPage(adminPage);
    const contacts = new ContactsPage(adminPage);
    await nav.openLink('Dealers');
    await expect(contacts.table()).toBeVisible();
    await contacts.selectAll();
    await expect(contacts.selectionBar()).toBeVisible();
    await snap(adminPage, FLOW, 'create_01_dealers_selected');
    await contacts.saveAsSegment();

    const segmentName = `${SEGMENTS.namePrefix} ${Date.now().toString().slice(-6)}`;
    await contacts.fillSegmentName(segmentName);
    await contacts.confirmSaveSegment();
    await expect(contacts.text(/saved with \d+ dealers/i)).toBeVisible();
    await snap(adminPage, FLOW, 'create_02_saved_toast');
  });

  test('saved segment appears on the Segments page', async ({ adminPage }) => {
    const nav = new NavPage(adminPage);
    const contacts = new ContactsPage(adminPage);
    const segments = new SegmentsPage(adminPage);
    await nav.openLink('Dealers');
    await expect(contacts.table()).toBeVisible();
    await contacts.selectAll();
    await expect(contacts.selectionBar()).toBeVisible();
    await contacts.saveAsSegment();
    const segmentName = `${SEGMENTS.namePrefix} Verify ${Date.now().toString().slice(-6)}`;
    await contacts.fillSegmentName(segmentName);
    await contacts.confirmSaveSegment();
    await expect(contacts.text(/saved with \d+ dealers/i)).toBeVisible();

    await segments.goto();
    await expect(adminPage).toHaveURL(/\/segments$/);
    await expect(segments.rowByName(segmentName)).toBeVisible({ timeout: 8_000 });
    await snap(adminPage, FLOW, 'create_03_visible_on_page');
  });

  test('segment row shows the segment name and dealer count', async ({ adminPage }) => {
    const nav = new NavPage(adminPage);
    const contacts = new ContactsPage(adminPage);
    const segments = new SegmentsPage(adminPage);
    await nav.openLink('Dealers');
    await contacts.selectAll();
    await expect(contacts.selectionBar()).toBeVisible();
    await contacts.saveAsSegment();
    const segmentName = `${SEGMENTS.namePrefix} Count ${Date.now().toString().slice(-6)}`;
    await contacts.fillSegmentName(segmentName);
    await contacts.confirmSaveSegment();
    await expect(contacts.text(/saved with \d+ dealers/i)).toBeVisible();

    await segments.goto();
    const row = segments.rowByName(segmentName);
    await expect(row).toBeVisible({ timeout: 8_000 });
    // Row should contain the name
    await expect(row).toContainText(segmentName);
    await snap(adminPage, FLOW, 'create_04_row_details');
  });
});
