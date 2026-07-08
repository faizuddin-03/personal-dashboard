// ── Shared data shapes ──────────────────────────────────────
import type { VerificationData } from '../pages/PaymentSuccessPage';

// Checker
export interface VehicleInput {
  vehicleNumber:  string;
  icNumber?:      string;
  postcode?:      string;
  vehicleType?:   'car' | 'motorcycle';
  ownerType?:     'private' | 'company';
}

export interface InsurerResult {
  name:              string;
  available:         boolean;
  unavailableReason: string;
}

export interface VehicleResult {
  vehicleNumber:   string;
  make:            string;
  model:           string;
  year:            string;
  variant:         string;
  totalDisplayed:  number;
  totalAvailable:  number;
  insurers:        InsurerResult[];
  status:          'SUCCESS' | 'ERROR';
  errorMessage?:   string;
}

export const emptyResult = (vehicleNumber: string, msg: string): VehicleResult => ({
  vehicleNumber, make: '', model: '', year: '', variant: '',
  totalDisplayed: 0, totalAvailable: 0, insurers: [],
  status: 'ERROR', errorMessage: msg,
});

// Regression report (consumed by the dashboard's /api/secarang/regression UI)
export interface StepResult {
  name:      string;
  status:    'PASS' | 'FAIL' | 'SKIP';
  message:   string;
  timestamp: string;
}

export interface Screenshot {
  label:   string;
  dataUrl: string;
}

export interface PostcodeChangeInfo {
  postcode:     string;
  priceBefore:  string;
  priceAfter:   string;
  priceChanged: boolean;
}

export interface RegressionResult {
  vehicleNumber:       string;
  icNumber:            string;
  targetInsurer:       string;
  overallStatus:       'PASS' | 'FAIL';
  steps:               StepResult[];
  errorMessage?:       string;
  startedAt:           string;
  completedAt:         string;
  durationMs:          number;
  verificationReport?: string;
  verificationData?:   VerificationData;
  postcodeChangeInfo?: PostcodeChangeInfo;
  screenshots?:        Screenshot[];
}
