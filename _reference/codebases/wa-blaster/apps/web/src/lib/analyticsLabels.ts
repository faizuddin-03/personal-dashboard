export const STATE_LABEL: Record<string, string> = {
  JOHOR: 'Johor', KEDAH: 'Kedah', KELANTAN: 'Kelantan', MELAKA: 'Melaka',
  NEGERI_SEMBILAN: 'Negeri Sembilan', PAHANG: 'Pahang', PENANG: 'Penang',
  PERAK: 'Perak', PERLIS: 'Perlis', SABAH: 'Sabah', SARAWAK: 'Sarawak',
  SELANGOR: 'Selangor', TERENGGANU: 'Terengganu', KUALA_LUMPUR: 'Kuala Lumpur',
  LABUAN: 'Labuan', PUTRAJAYA: 'Putrajaya',
};
export const VEHICLE_LABEL: Record<string, string> = {
  NATIONAL: 'National', CONTINENTAL_LUXURY: 'Continental/Luxury', SUV_MPV: 'SUV/MPV',
  COMMERCIAL_PICKUP: 'Commercial/Pickup', EV_HYBRID: 'EV/Hybrid',
  MOTORCYCLE: 'Motorcycle', MULTI_BRAND: 'Multi-brand',
};
export const REASON_LABEL: Record<string, string> = {
  KNOWLEDGE_GAP: 'Knowledge gap', COMPLAINT: 'Complaint',
  LOW_CONFIDENCE: 'Low confidence', SENSITIVE: 'Sensitive',
};
export const stateLabel = (s: string) => STATE_LABEL[s] ?? s;
export const vehicleLabel = (v: string) => VEHICLE_LABEL[v] ?? v;
export const reasonLabel = (r: string) => REASON_LABEL[r] ?? r;
export const intentLabel = (i: string) => i.replace(/_/g, ' ');
export const fmtDuration = (ms: number | null): string => {
  if (ms == null) return '—';
  const mins = Math.round(ms / 60000);
  const h = Math.floor(mins / 60), m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
};
