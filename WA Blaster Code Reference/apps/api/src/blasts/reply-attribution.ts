const ATTRIBUTABLE_STATUSES = new Set(['SENT', 'DELIVERED', 'READ']);

export interface AttributableMessage {
  id: string;
  blastId: string;
  status: string;
  sentAt: Date | null;
}

export interface Attribution {
  messageId: string;
  blastId: string;
}

/**
 * Pure function. Given a list of candidate messages for one contact, return the
 * blast attribution for an inbound reply received at `now`. Picks the most recent
 * SENT/DELIVERED/READ message whose `sentAt` is within `windowDays` of `now`.
 */
export function attributeReply(
  candidates: AttributableMessage[],
  now: Date,
  windowDays: number,
): Attribution | null {
  const cutoff = now.getTime() - windowDays * 24 * 60 * 60 * 1000;
  let best: AttributableMessage | null = null;
  for (const c of candidates) {
    if (!ATTRIBUTABLE_STATUSES.has(c.status)) continue;
    if (!c.sentAt) continue;
    if (c.sentAt.getTime() < cutoff) continue;
    if (!best || c.sentAt.getTime() > best.sentAt!.getTime()) best = c;
  }
  return best ? { messageId: best.id, blastId: best.blastId } : null;
}
