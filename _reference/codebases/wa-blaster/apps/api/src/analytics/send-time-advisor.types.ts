export type SendTimeConfidence = 'INSUFFICIENT' | 'LOW' | 'MEDIUM' | 'HIGH';

export interface SendTimeRecommendation {
  hourStart: number; // 0..23 KL, inclusive
  hourEnd: number; // 0..23 KL, inclusive
  days: number[] | null; // 0..6 KL; null = any day
  share: number; // % of weighted engagement inside the band (1-decimal)
}

export interface SendTimeThisRun {
  sentAt: string | null; // ISO
  sentWeekday: number | null; // 0..6 KL
  sentHour: number | null; // 0..23 KL
  sent: number;
  read: number;
  replied: number;
  readRate: number; // 1-decimal %
  replyRate: number; // 1-decimal %
}

export interface SendTimeAdvice {
  headline: string;
  body: string;
}

export interface SendTimeAdviceResponse {
  blastId: string;
  campaignName: string;
  audienceSize: number;
  totalEvents: number;
  confidence: SendTimeConfidence;
  recommendation: SendTimeRecommendation | null;
  hourHistogram: number[]; // length 24, weighted
  thisRun: SendTimeThisRun;
  advice: SendTimeAdvice;
}
