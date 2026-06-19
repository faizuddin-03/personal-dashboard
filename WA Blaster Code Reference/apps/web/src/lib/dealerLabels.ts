import type { DealerTier, VehicleSpecialization } from '../api/contacts';

export const TIER_LABELS: Record<DealerTier, string> = {
  GOLD: 'Gold',
  SILVER: 'Silver',
  BRONZE: 'Bronze',
};

export const VEHICLE_LABELS: Record<VehicleSpecialization, string> = {
  NATIONAL: 'National',
  CONTINENTAL_LUXURY: 'Continental/Luxury',
  SUV_MPV: 'SUV/MPV',
  COMMERCIAL_PICKUP: 'Commercial/Pickup',
  EV_HYBRID: 'EV/Hybrid',
  MOTORCYCLE: 'Motorcycle',
  MULTI_BRAND: 'Multi-brand',
};

export const VEHICLE_ICONS: Record<VehicleSpecialization, string> = {
  NATIONAL: '🇲🇾',
  CONTINENTAL_LUXURY: '🌍',
  SUV_MPV: '🚙',
  COMMERCIAL_PICKUP: '🚛',
  EV_HYBRID: '⚡',
  MOTORCYCLE: '🏍️',
  MULTI_BRAND: '🏪',
};

export const ALL_VEHICLE_SPECS: VehicleSpecialization[] = [
  'NATIONAL',
  'CONTINENTAL_LUXURY',
  'SUV_MPV',
  'COMMERCIAL_PICKUP',
  'EV_HYBRID',
  'MOTORCYCLE',
  'MULTI_BRAND',
];
