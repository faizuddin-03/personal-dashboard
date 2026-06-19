import { Injectable } from '@nestjs/common';

export interface GuardResult {
  ok: boolean;
  reason: string;
}

/**
 * Length guard. An empty draft is a non-reply. 800 chars is our soft cap for a polite WhatsApp
 * reply; 4096 is Meta's hard message limit — anything past it would be rejected by the API.
 */
@Injectable()
export class LengthGuard {
  private readonly softCap = 800;
  private readonly metaHardLimit = 4096;

  check(body: string): GuardResult {
    const trimmed = (body ?? '').trim();
    if (!trimmed) return { ok: false, reason: 'length:empty' };
    if (body.length > this.metaHardLimit) {
      return { ok: false, reason: 'length:exceeds_whatsapp_limit' };
    }
    if (body.length > this.softCap) return { ok: false, reason: 'length:too_long' };
    return { ok: true, reason: '' };
  }
}
