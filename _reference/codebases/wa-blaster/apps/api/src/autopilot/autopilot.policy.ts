import { EscalationReason } from '@prisma/client';

/** The intents the classifier chooses from. `general` is the catch-all. */
export const INTENTS = [
  'transfer_support',
  'credit_topup',
  'vehicle_history',
  'roadtax_insurance',
  'subscription',
  'account_access',
  'feature_howto',
  'complaint',
  'general',
] as const;

/** Intents the bot must NEVER auto-answer — always route to a human. */
export const SENSITIVE_INTENTS = new Set<string>(['complaint', 'account_access']);

const OPT_OUT_KEYWORDS = new Set(['stop', 'berhenti']);

/** True if the whole message is an opt-out keyword (STOP / BERHENTI), case/space-insensitive. */
export function isOptOut(message: string): boolean {
  return OPT_OUT_KEYWORDS.has(message.trim().toLowerCase());
}

/** Escalation reason for a guarded intent, or null if the intent is auto-answerable. */
export function escalationReasonForIntent(intent: string): EscalationReason | null {
  if (intent === 'complaint') return 'COMPLAINT';
  if (SENSITIVE_INTENTS.has(intent)) return 'SENSITIVE';
  return null;
}

/** Confidence (0..1) meets the configured escalation threshold (0..100). */
export function meetsThreshold(confidence: number, thresholdPct: number): boolean {
  return confidence * 100 >= thresholdPct;
}
