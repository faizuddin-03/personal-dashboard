import { selectUsableTemplateRows } from '../select-usable-template-rows';

type Row = { version: number; language: string; status: string };
const rows = (rs: Row[]) => rs;

describe('selectUsableTemplateRows', () => {
  it('returns the latest APPROVED version regardless of scheduledAt', () => {
    const r = rows([
      { version: 1, language: 'EN', status: 'APPROVED' },
      { version: 2, language: 'EN', status: 'APPROVED' },
      { version: 2, language: 'MS', status: 'APPROVED' },
    ]);
    const out = selectUsableTemplateRows(r, 'EN', false);
    expect(out.latestVersion).toBe(2);
    expect(out.usableRows).toHaveLength(2);
  });

  it('allows PENDING rows when the send is in the future', () => {
    const r = rows([{ version: 1, language: 'EN', status: 'PENDING' }]);
    const out = selectUsableTemplateRows(r, 'EN', true);
    expect(out.latestVersion).toBe(1);
    expect(out.usableRows[0].status).toBe('PENDING');
  });

  it('rejects PENDING-only templates for immediate sends', () => {
    const r = rows([{ version: 1, language: 'EN', status: 'PENDING' }]);
    expect(() => selectUsableTemplateRows(r, 'EN', false)).toThrow(/immediate sends require approval/i);
  });

  it('prefers APPROVED over PENDING even when future-dated', () => {
    const r = rows([
      { version: 1, language: 'EN', status: 'APPROVED' },
      { version: 2, language: 'EN', status: 'PENDING' },
    ]);
    const out = selectUsableTemplateRows(r, 'EN', true);
    expect(out.latestVersion).toBe(1); // latest APPROVED, not the pending v2
  });

  it('throws when no rows exist', () => {
    expect(() => selectUsableTemplateRows([], 'EN', true)).toThrow(/not found/i);
  });

  it('throws when the default language is missing from the usable version', () => {
    const r = rows([{ version: 1, language: 'MS', status: 'APPROVED' }]);
    expect(() => selectUsableTemplateRows(r, 'EN', true)).toThrow(/EN/);
  });
});
