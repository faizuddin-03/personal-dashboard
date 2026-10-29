// ── Test data & sandbox credentials ────────────────────────
// Read from process.env — every value is TYPED on the /eauto/12107 dashboard
// page; no fallback values (Faizuddin, 2026-10-16: "everything that requires
// input will be need to be inputted in the dashboard"). Only the insurer and
// the FPX bank keep a default, because the TS row itself names them.
//
// The combined test script (_reference/tickets/EAINT-12107/EAINT-12107 +
// EAINT-12327 - Combined TS - ...xlsx) fixes per TS:
//   12107_TS01  private car, Lonpac,       GrabPay Full Amount, Status = Success
//   12107_TS02  private car, Lonpac,       ShopeePay, Success (was Failed GrabPay, company car, Tokio Marine until 2026-10-20)
//   12107_TS03  private car, Lonpac,       GrabPay Full Amount, Failed
//   12107_TS04  private car, Lonpac,       ShopeePay, Failed
//   12107_TS07  private car, Lonpac,       Credit or Debit Card, Success
//   12107_TS08  private car, Lonpac,       FPX (RHB), Success

const env = (k: string, fallback = '') => process.env[k] || fallback;

export interface ScenarioData {
  vehicleNumber: string;
  /** Owner IC (private car) or company SSM number (company car). */
  idNumber: string;
  postcode: string;
  vehicleType: 'car';
  ownerType: 'private' | 'company';
  insurer: string;
  coverageType: 'comprehensive' | 'tpft';
}

const privateCar = (vnEnv: string, insurerEnv: string, insurerDefault: string): ScenarioData => ({
  vehicleNumber: env(vnEnv) || env('SECARANG_VEHICLE_NO'),
  idNumber: env('SECARANG_IC'),
  postcode: env('SECARANG_POSTCODE'),
  vehicleType: 'car',
  ownerType: 'private',
  insurer: env(insurerEnv) || insurerDefault,
  coverageType: 'comprehensive',
});

export const SCENARIO_DATA = {
  ts01: privateCar('SECARANG_TS01_VEHICLE_NO', 'SECARANG_TS01_INSURER', 'Lonpac'),
  // ShopeePay success, private car since 2026-10-20 — Faizuddin: "there are no insurance in
  // secarang that supports company".
  ts02: privateCar('SECARANG_TS02_VEHICLE_NO', 'SECARANG_TS02_INSURER', 'Lonpac'),
  // TS v3 (20_10_26): failed GrabPay / failed ShopeePay.
  ts03: privateCar('SECARANG_TS03_VEHICLE_NO', 'SECARANG_TS03_INSURER', 'Lonpac'),
  ts04: privateCar('SECARANG_TS04_VEHICLE_NO', 'SECARANG_TS04_INSURER', 'Lonpac'),
  ts07: privateCar('SECARANG_TS07_VEHICLE_NO', 'SECARANG_TS07_INSURER', 'Lonpac'),
  ts08: privateCar('SECARANG_TS08_VEHICLE_NO', 'SECARANG_TS08_INSURER', 'Lonpac'),
  ts09: privateCar('SECARANG_TS09_VEHICLE_NO', 'SECARANG_TS09_INSURER', 'Lonpac'), // TS v2: GrabPay cancelled
  // Faizuddin, 2026-10-20: 2 cancel payments — the second is ShopeePay.
  ts10: privateCar('SECARANG_TS10_VEHICLE_NO', 'SECARANG_TS10_INSURER', 'Lonpac'),
};

// Owner / contact details typed on the confirmation page.
export const OWNER = {
  name: env('SECARANG_OWNER_NAME'),
  email: env('SECARANG_OWNER_EMAIL'),
  phone: env('SECARANG_OWNER_PHONE'),
  addressLine1: env('SECARANG_ADDR1'),
  addressLine2: env('SECARANG_ADDR2'),
  addressLine3: env('SECARANG_ADDR3'),
};

// Fiuu sandbox — FPX bank simulator login (TS08) and the bank to pick.
// The TS names RHB; `bankValue` is the <input formcontrolname="bank"> value
// and `bankName` the logo's alt text — selectBank() tries the value first,
// then the name (PaymentTypePage.logAvailableBanks() prints both).
export const FIUU = {
  bankValue: env('SECARANG_BANK_VALUE', ''),
  bankName: env('SECARANG_BANK_NAME', 'RHB'),
  bankUsername: env('SECARANG_BANK_USER'),
  bankPassword: env('SECARANG_BANK_PASS'),
  // Fiuu sandbox test card for 12107_TS07, typed on the dashboard.
  cardNumber: env('SECARANG_CARD_NUMBER'),
  cardExpiry: env('SECARANG_CARD_EXPIRY'),
  cardCvv: env('SECARANG_CARD_CVV'),
  // FPX simulator status code: "00" = approved, anything else = declined.
  fpxStatusOk: '00',
};
