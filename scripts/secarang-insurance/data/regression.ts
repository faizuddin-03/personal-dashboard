// ── Regression scenario data ────────────────────────────────
// Every credential and test value for the Zurich E2E regression, in one
// place. The dashboard injects REGRESSION_* env vars per run; fallbacks
// keep a bare local run working.

export const REGRESSION = {
  vehicleNumber:  process.env.REGRESSION_VN          || 'WYN3837',
  icNumber:       process.env.REGRESSION_IC          || '730620065847',
  postcode:       process.env.REGRESSION_POSTCODE    || '55000',
  targetInsurer:  process.env.REGRESSION_INSURER     || 'Zurich',
  coverageType:      (process.env.REGRESSION_COVERAGE_TYPE || 'comprehensive') as 'comprehensive' | 'tpft',
  quotationPostcode: process.env.REGRESSION_QUOTATION_POSTCODE || '',
  sumInsuredMode:    (process.env.REGRESSION_SUM_INSURED || 'default') as 'default' | 'min' | 'medium' | 'max',
  vehicleType:    process.env.REGRESSION_VEHICLE_TYPE || 'car',
  ownerType:      process.env.REGRESSION_OWNER_TYPE   || 'private',
  // Comma-separated add-on names to select (e.g. "Windshield,CART")
  // Empty = select first 2 simple add-ons as before
  targetAddons:   (process.env.REGRESSION_ADDONS || '').split(',').map(s => s.trim()).filter(Boolean),
  // Owner / contact details for payment confirmation page
  ownerName:      process.env.REGRESSION_NAME  || 'MUHAMMAD FAIZUDDIN BIN BIDI',
  ownerEmail:     process.env.REGRESSION_EMAIL || 'faizuddin@modefair.com',
  ownerPhone:     process.env.REGRESSION_PHONE || '189812839',
  addressLine1:   process.env.REGRESSION_ADDR1 || '2505, Arctic Monkeys Road',
  addressLine2:   process.env.REGRESSION_ADDR2 || 'Taman Monyet Kutub',
  addressLine3:   process.env.REGRESSION_ADDR3 || 'Shah Alam, Selangor',
  discountCode:   process.env.REGRESSION_DISCOUNT || '',
  // Payment gateway
  targetBank:     process.env.REGRESSION_BANK           || 'fpx_mb2u', // Maybank
  bankUsername:   process.env.REGRESSION_BANK_USER      || 'Gaara',
  bankPassword:   process.env.REGRESSION_BANK_PASS      || 'letmepaywithsand',
  paymentStatus:  process.env.REGRESSION_PAYMENT_STATUS || '00',

  // File contract with the dashboard API route — do not move
  outputFile:     './regression-result.json',

  navTimeout:     90_000,
  stepTimeout:    30_000,
  pollInterval:   200,
  waitAfterClick: 500,
};

// Add-ons that the site ticks by default per insurer — must be explicitly
// unchecked when the user has not selected them in the dashboard.
export const SITE_DEFAULT_ON_ADDONS: Record<string, string[]> = {
  'Zurich': ['All Drivers'],
};
