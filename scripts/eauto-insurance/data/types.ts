// ── Shared data shapes for the insurance checker ──────────

export interface VehicleInput {
  vehicleNumber: string;
  icNumber?: string;
  postcode?: string;
  vehicleCategory?: string;
}

export interface InsurerResult {
  insurerName: string;
  coverType: string;
  allowToPurchase: string;
  referRiskCode: string;
  totalPrice: string;
}

export interface VehicleResult {
  vehicleNumber: string;
  make: string;
  model: string;
  manufacturingYear: string;
  engineCapacity: string;
  transmission: string;
  variant: string;
  insurers: InsurerResult[];
  status: 'SUCCESS' | 'NO_VEHICLE_INFO' | 'ERROR';
  errorMessage?: string;
}

export const emptyResult = (
  vehicleNumber: string,
  status: 'NO_VEHICLE_INFO' | 'ERROR',
  msg: string,
): VehicleResult => ({
  vehicleNumber, make: '', model: '', manufacturingYear: '',
  engineCapacity: '', transmission: '', variant: '', insurers: [],
  status, errorMessage: msg,
});
