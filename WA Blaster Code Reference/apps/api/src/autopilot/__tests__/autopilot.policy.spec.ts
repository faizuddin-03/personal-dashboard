import {
  INTENTS,
  SENSITIVE_INTENTS,
  isOptOut,
  escalationReasonForIntent,
  meetsThreshold,
} from '../autopilot.policy';

describe('autopilot.policy', () => {
  it('exposes the 9 known intents including general', () => {
    expect(INTENTS).toContain('general');
    expect(INTENTS).toContain('complaint');
    expect(INTENTS.length).toBe(9);
  });

  it('isOptOut matches STOP / BERHENTI case- and space-insensitively, nothing else', () => {
    expect(isOptOut('STOP')).toBe(true);
    expect(isOptOut('  stop  ')).toBe(true);
    expect(isOptOut('Berhenti')).toBe(true);
    expect(isOptOut('please stop sending')).toBe(false);
    expect(isOptOut('how do I transfer?')).toBe(false);
  });

  it('escalationReasonForIntent maps sensitive intents, null otherwise', () => {
    expect(escalationReasonForIntent('complaint')).toBe('COMPLAINT');
    expect(escalationReasonForIntent('account_access')).toBe('SENSITIVE');
    expect(escalationReasonForIntent('transfer_support')).toBeNull();
    expect(SENSITIVE_INTENTS.has('complaint')).toBe(true);
  });

  it('meetsThreshold compares 0..1 confidence against a 0..100 threshold', () => {
    expect(meetsThreshold(0.9, 70)).toBe(true);
    expect(meetsThreshold(0.7, 70)).toBe(true);
    expect(meetsThreshold(0.69, 70)).toBe(false);
  });
});
