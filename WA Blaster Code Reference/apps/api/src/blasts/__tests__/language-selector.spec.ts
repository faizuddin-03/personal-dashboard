import { selectTemplateRow } from '../language-selector';

const enRow = { id: 'r1', language: 'EN', status: 'APPROVED' } as any;
const msRow = { id: 'r2', language: 'MS', status: 'APPROVED' } as any;
const zhPendingRow = { id: 'r3', language: 'ZH', status: 'PENDING' } as any;

describe('selectTemplateRow', () => {
  it('returns the matching language when contact prefers MS', () => {
    expect(selectTemplateRow([enRow, msRow], 'MS', 'EN')).toEqual(msRow);
  });

  it('falls back to default language when contact lang not in group', () => {
    expect(selectTemplateRow([enRow, msRow], 'ZH', 'EN')).toEqual(enRow);
  });

  it('returns null when neither contact lang nor default lang is APPROVED', () => {
    expect(selectTemplateRow([zhPendingRow], 'ZH', 'EN')).toBeNull();
  });

  it('skips non-APPROVED rows even if language matches', () => {
    expect(selectTemplateRow([zhPendingRow, enRow], 'ZH', 'EN')).toEqual(enRow);
  });

  it('returns null on empty group', () => {
    expect(selectTemplateRow([], 'EN', 'EN')).toBeNull();
  });
});
