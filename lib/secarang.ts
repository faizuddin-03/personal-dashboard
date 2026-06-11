export interface SumInsuredOption {
  sumInsured: string;
  price:      string;
}

export interface SecarangRow {
  vehicleNumber:    string;
  make:             string;
  model:            string;
  year:             string;
  variant:          string;
  insurer:          string;
  available:        string;  // "Yes" | "No"
  unavailableReason:string;
  sumInsured:       string;
  price:            string;
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
    sumInsuredOptions: SumInsuredOption[];
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

    let ins = v.insurers.find(i => i.name === r.insurer);
    if (!ins) {
      ins = {
        name:              r.insurer,
        available:         r.available.toLowerCase() === "yes",
        unavailableReason: r.unavailableReason,
        sumInsuredOptions: [],
      };
      v.insurers.push(ins);
    }

    if (r.sumInsured && r.price) {
      ins.sumInsuredOptions.push({ sumInsured: r.sumInsured, price: r.price });
    }
  }

  return Array.from(map.values());
}
