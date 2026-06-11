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

export interface SecarangJob {
  loading:      boolean;
  stopping?:    boolean;
  rows:         SecarangRow[];
  error:        string;
  log:          string;
  savedAt:      string | null;
  vehicleInput: string;
}

const STORAGE_KEY = "secarang_results";

interface SavedResults {
  rows:         SecarangRow[];
  vehicleInput: string;
  runLog:       string;
  savedAt:      string;
}

export function loadSecarangSaved(): SavedResults | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveSecarangResults(data: SavedResults) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function clearSecarangSaved() {
  localStorage.removeItem(STORAGE_KEY);
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
