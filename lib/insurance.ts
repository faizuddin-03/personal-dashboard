export interface InsuranceRow {
  vehicleNumber:  string;
  make:           string;
  model:          string;
  mfgYear:        string;
  engineCC:       string;
  transmission:   string;
  variant:        string;
  insurer:        string;
  coverType:      string;
  allowPurchase:  string;
  referRiskCode:  string;
  totalPrice:     string;
}

export interface InsuranceRunParams {
  vehicles:        string[];
  username?:       string;
  password?:       string;
  icNumber?:       string;
  postcode?:       string;
  vehicleCategory: "individual" | "company";
  baseUrl?:        string;
  concurrency:     number;
  // kept for display restore after navigation
  vehicleInput:    string;
  usernameDisplay: string;
  baseUrlDisplay:  string;
}

export interface InsuranceJob {
  loading:      boolean;
  rows:         InsuranceRow[];
  error:        string;
  log:          string;
  savedAt:      string | null;
  vehicleInput: string;
  username:     string;
  baseUrl:      string;
}

const STORAGE_KEY = "insurance_results";

interface SavedResults {
  rows:         InsuranceRow[];
  vehicleInput: string;
  username:     string;
  baseUrl:      string;
  runLog:       string;
  savedAt:      string;
}

export function loadInsuranceSaved(): SavedResults | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveInsuranceResults(data: SavedResults) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearInsuranceSaved() {
  localStorage.removeItem(STORAGE_KEY);
}
