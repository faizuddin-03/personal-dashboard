export interface SecarangRow {
  vehicleNumber:    string;
  make:             string;
  model:            string;
  year:             string;
  variant:          string;
  insurer:          string;
  available:        string;  // "Yes" | "No"
  unavailableReason:string;
  totalDisplayed:   string;
  totalAvailable:   string;
  status:           string;
  errorMessage:     string;
}

export interface SecarangVehicle {
  vehicleNumber:  string;
  make:           string;
  model:          string;
  year:           string;
  variant:        string;
  totalDisplayed: number;
  totalAvailable: number;
  status:         "SUCCESS" | "ERROR";
  errorMessage:   string;
  insurers: {
    name:              string;
    available:         boolean;
    unavailableReason: string;
  }[];
}

export interface VehicleEntry {
  vehicleNumber: string;
  icNumber?:     string;
}

export interface SecarangRunParams {
  vehicles:            VehicleEntry[];
  icNumber?:           string;
  postcode?:           string;
  vehicleType:         "car" | "motorcycle";
  ownerType:           "private" | "company";
  baseUrl?:            string;
  sitePassword?:       string;
  concurrency:         number;
  checkVehicleDetails: boolean;
  vehicleInput:        string;
}

export interface SecarangJob {
  loading:      boolean;
  stopping?:    boolean;
  rows:         SecarangRow[];
  error:        string;
  log:          string;
  savedAt:      string | null;
  vehicleInput: string;
}

const STORAGE_KEY            = "secarang_results";
const REGRESSION_STORAGE_KEY = "regression_secarang_results";

export interface SavedResults {
  rows:         SecarangRow[];
  vehicleInput: string;
  runLog:       string;
  savedAt:      string;
}

function loadSaved(key: string): SavedResults | null {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function loadSecarangSaved():            SavedResults | null { return loadSaved(STORAGE_KEY); }
export function loadRegressionSecarangSaved():  SavedResults | null { return loadSaved(REGRESSION_STORAGE_KEY); }

export function saveSecarangResults(data: SavedResults) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function saveRegressionSecarangResults(data: SavedResults) {
  localStorage.setItem(REGRESSION_STORAGE_KEY, JSON.stringify(data));
}

export function clearSecarangSaved() {
  localStorage.removeItem(STORAGE_KEY);
}

export function clearRegressionSecarangSaved() {
  localStorage.removeItem(REGRESSION_STORAGE_KEY);
}

// ── Regression test result ────────────────────────────────────
export interface RegressionStepResult {
  name:      string;
  status:    "PASS" | "FAIL" | "SKIP";
  message:   string;
  timestamp: string;
}

export interface VerificationRow {
  label:     string;
  confirmed: string;
  success:   string;
  match:     boolean;
}

export interface PdfVerificationRow {
  label:    string;
  expected: string;
  found:    boolean;
}

export interface VerificationData {
  receiptNo:     string;
  purchaseDate:  string;
  paymentMethod: string;
  vehicleRows:   VerificationRow[];
  ownerRows:     VerificationRow[];
  pricingRows:   VerificationRow[];
  pdfRows?:      PdfVerificationRow[];
}

export interface RegressionScreenshot {
  label:   string;
  dataUrl: string; // data:image/jpeg;base64,...
}

export interface PostcodeChangeInfo {
  postcode:     string;  // postcode that was applied on the quotation page
  priceBefore:  string;  // price(s) extracted before applying postcode
  priceAfter:   string;  // price(s) extracted after applying postcode
  priceChanged: boolean;
}

export interface RegressionResult {
  vehicleNumber:       string;
  icNumber:            string;
  targetInsurer:       string;
  overallStatus:       "PASS" | "FAIL";
  steps:               RegressionStepResult[];
  errorMessage?:       string;
  startedAt:           string;
  completedAt:         string;
  durationMs:          number;
  log?:                string;
  /** Web path to the run recording, e.g. /qa-artifacts/secarang-regression/run.webm */
  video?:              string;
  stopped?:            boolean;
  verificationReport?: string;
  verificationData?:   VerificationData;
  postcodeChangeInfo?: PostcodeChangeInfo;
  screenshots?:        RegressionScreenshot[];
}

const REGRESSION_TEST_KEY = "secarang_regression_test_result";

export function loadRegressionTestResult(): RegressionResult | null {
  try {
    const raw = localStorage.getItem(REGRESSION_TEST_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveRegressionTestResult(data: RegressionResult) {
  // Strip screenshots before writing to localStorage — they can be several MB
  // and would exceed the storage quota. Screenshots stay in React state only.
  const { screenshots: _omit, ...rest } = data;
  localStorage.setItem(REGRESSION_TEST_KEY, JSON.stringify(rest));
}

export function clearRegressionTestResult() {
  localStorage.removeItem(REGRESSION_TEST_KEY);
}

// Derive structured vehicles from flat rows
export function buildVehicles(rows: SecarangRow[]): SecarangVehicle[] {
  const map = new Map<string, SecarangVehicle>();

  for (const r of rows) {
    if (!map.has(r.vehicleNumber)) {
      map.set(r.vehicleNumber, {
        vehicleNumber:  r.vehicleNumber,
        make:           r.make,
        model:          r.model,
        year:           r.year,
        variant:        r.variant,
        totalDisplayed: parseInt(r.totalDisplayed) || 0,
        totalAvailable: parseInt(r.totalAvailable) || 0,
        status:         r.status === "ERROR" ? "ERROR" : "SUCCESS",
        errorMessage:   r.errorMessage || "",
        insurers: [],
      });
    }
    const v = map.get(r.vehicleNumber)!;

    if (!r.insurer) continue;

    // One row per displayed card; keep each as its own entry
    v.insurers.push({
      name:              r.insurer,
      available:         r.available.toLowerCase() === "yes",
      unavailableReason: r.unavailableReason,
    });
  }

  // Fall back to deriving counts from rows if the sheet didn't carry them
  for (const v of map.values()) {
    if (!v.totalDisplayed) v.totalDisplayed = v.insurers.length;
    if (!v.totalAvailable) v.totalAvailable = v.insurers.filter(i => i.available).length;
  }

  return Array.from(map.values());
}
