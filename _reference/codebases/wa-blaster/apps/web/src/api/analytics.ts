import { api } from './client';

export type Range = '7d' | '30d' | '90d';

export interface Metric { value: number; deltaPct: number; spark?: number[]; estimated?: boolean }

export interface KpisResponse {
  delivered: Metric; deliveryRate: Metric; readRate: Metric; replyRate: Metric;
  autoHandleRate: Metric; sentToday: Metric; costToday: Metric;
}
export interface DeliveryResponse {
  funnel: { sent: number; delivered: number; read: number; replied: number };
  byState: { state: string; rate: number }[];
  byVehicle: { vehicle: string; rate: number }[];
  topTemplates: { templateId: string; name: string; language: string; sent: number; replied: number; replyRate: number }[];
}
export interface VolumeResponse { byDay: { date: string; sent: number; delivered: number; replied: number }[] }
export interface AutopilotResponse {
  autoHandleRate: number;
  trend: { date: string; rate: number }[];
  handling: { autoReplied: number; escalated: number; resolvedByTeam: number };
  topIntents: { intent: string; count: number }[];
}
export interface EscalationResponse {
  rate: number; deltaPct: number; opened: number; closed: number; openRemaining: number;
  avgCloseMs: number | null;
  trend: { date: string; rate: number }[];
  byReason: { reason: string; count: number }[];
  responseTimeByDay: { date: string; avgMinutes: number | null }[];
}
export interface AudienceResponse {
  byState: { state: string; count: number }[];
  byVehicle: { vehicle: string; count: number }[];
}

export const getKpis = (range: Range) =>
  api.get<KpisResponse>('/analytics/kpis', { params: { range } }).then((r) => r.data);
export const getDelivery = (range: Range) =>
  api.get<DeliveryResponse>('/analytics/delivery', { params: { range } }).then((r) => r.data);
export const getVolume = (range: Range) =>
  api.get<VolumeResponse>('/analytics/volume', { params: { range } }).then((r) => r.data);
export const getAutopilot = (range: Range) =>
  api.get<AutopilotResponse>('/analytics/autopilot', { params: { range } }).then((r) => r.data);
export const getEscalation = (range: Range) =>
  api.get<EscalationResponse>('/analytics/escalation', { params: { range } }).then((r) => r.data);
export const getAudience = () =>
  api.get<AudienceResponse>('/analytics/audience').then((r) => r.data);

export interface SendTimeAdviceResponse {
  blastId: string;
  campaignName: string;
  audienceSize: number;
  totalEvents: number;
  confidence: 'INSUFFICIENT' | 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: { hourStart: number; hourEnd: number; days: number[] | null; share: number } | null;
  hourHistogram: number[];
  thisRun: {
    sentAt: string | null; sentWeekday: number | null; sentHour: number | null;
    sent: number; read: number; replied: number; readRate: number; replyRate: number;
  };
  advice: { headline: string; body: string };
}

export const getSendTimeAdvice = (blastId: string) =>
  api.get<SendTimeAdviceResponse>(`/analytics/send-time-advice/${blastId}`).then((r) => r.data);
