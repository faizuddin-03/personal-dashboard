import { klWeekdayHour, rate } from './analytics.util';
import { SendTimeConfidence, SendTimeRecommendation } from './send-time-advisor.types';

/** Replies are rarer and a stronger signal than reads, so they count for more. */
export const REPLY_WEIGHT = 3;
/** Attach a "weekdays" qualifier only when this share of engagement is Mon–Fri. */
export const WEEKDAY_CONCENTRATION = 0.7;

export interface EngagementEvent {
  readAt: Date | null;
  repliedAt: Date | null;
}

export interface ComputeSendTimeInput {
  events: EngagementEvent[];
  minEvents: number;
}

export interface SendTimeStats {
  totalEvents: number;
  confidence: SendTimeConfidence;
  recommendation: SendTimeRecommendation | null;
  hourHistogram: number[]; // length 24, weighted
}

function confidenceFor(events: number, min: number): SendTimeConfidence {
  if (events < min) return 'INSUFFICIENT';
  if (events < 100) return 'LOW';
  if (events < 400) return 'MEDIUM';
  return 'HIGH';
}

export function computeSendTimeStats(input: ComputeSendTimeInput): SendTimeStats {
  const hourHistogram = new Array<number>(24).fill(0);
  const dayHistogram = new Array<number>(7).fill(0);
  let totalEvents = 0;

  for (const e of input.events) {
    if (e.readAt) {
      const { weekday, hour } = klWeekdayHour(e.readAt);
      hourHistogram[hour] += 1;
      dayHistogram[weekday] += 1;
      totalEvents += 1;
    }
    if (e.repliedAt) {
      const { weekday, hour } = klWeekdayHour(e.repliedAt);
      hourHistogram[hour] += REPLY_WEIGHT;
      dayHistogram[weekday] += REPLY_WEIGHT;
      totalEvents += 1;
    }
  }

  const confidence = confidenceFor(totalEvents, input.minEvents);
  if (confidence === 'INSUFFICIENT') {
    return { totalEvents, confidence, recommendation: null, hourHistogram };
  }

  let peakHour = 0;
  for (let h = 1; h < 24; h++) {
    if (hourHistogram[h] > hourHistogram[peakHour]) peakHour = h;
  }
  const hourStart = Math.max(0, peakHour - 1);
  const hourEnd = Math.min(23, peakHour + 1);

  const totalWeight = hourHistogram.reduce((s, x) => s + x, 0);
  let bandWeight = 0;
  for (let h = hourStart; h <= hourEnd; h++) bandWeight += hourHistogram[h];
  const share = rate(bandWeight, totalWeight);

  const weekdayWeight = dayHistogram[1] + dayHistogram[2] + dayHistogram[3] + dayHistogram[4] + dayHistogram[5];
  const totalDayWeight = dayHistogram.reduce((s, x) => s + x, 0);
  const days =
    totalDayWeight > 0 && weekdayWeight / totalDayWeight >= WEEKDAY_CONCENTRATION
      ? [1, 2, 3, 4, 5]
      : null;

  return { totalEvents, confidence, recommendation: { hourStart, hourEnd, days, share }, hourHistogram };
}
