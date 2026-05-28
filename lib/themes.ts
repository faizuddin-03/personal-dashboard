export interface Theme {
  id: string;
  name: string;
  type: "dark" | "light";
  preview: { page: string; panel: string; text: string };
  vars: Record<string, string>;
}

export const THEMES: Theme[] = [
  // ── Dark ─────────────────────────────────────────────────────
  {
    id: "slate", name: "Slate", type: "dark",
    preview: { page: "#020617", panel: "#0f172a", text: "#94a3b8" },
    vars: {
      "--bg-page":       "#020617",
      "--bg-panel":      "#0f172a",
      "--bg-elevated":   "#1e293b",
      "--bg-hover":      "#334155",
      "--border-subtle": "#1e293b",
      "--border-main":   "#334155",
      "--text-brightest":"#f8fafc",
      "--text-primary":  "#f1f5f9",
      "--text-secondary":"#cbd5e1",
      "--text-label":    "#94a3b8",
      "--text-muted":    "#64748b",
      "--text-faint":    "#475569",
    },
  },
  {
    id: "midnight", name: "Midnight", type: "dark",
    preview: { page: "#0a0e1a", panel: "#0f1629", text: "#7a9cc0" },
    vars: {
      "--bg-page":       "#0a0e1a",
      "--bg-panel":      "#0f1629",
      "--bg-elevated":   "#1a2035",
      "--bg-hover":      "#243050",
      "--border-subtle": "#1a2035",
      "--border-main":   "#243050",
      "--text-brightest":"#e8eeff",
      "--text-primary":  "#dce4ff",
      "--text-secondary":"#b0c4e8",
      "--text-label":    "#7a9cc0",
      "--text-muted":    "#506a8e",
      "--text-faint":    "#3d5270",
    },
  },
  {
    id: "forest", name: "Forest", type: "dark",
    preview: { page: "#0a130a", panel: "#0d1f0d", text: "#81c784" },
    vars: {
      "--bg-page":       "#0a130a",
      "--bg-panel":      "#0d1f0d",
      "--bg-elevated":   "#152815",
      "--bg-hover":      "#1d3a1d",
      "--border-subtle": "#152815",
      "--border-main":   "#1d3a1d",
      "--text-brightest":"#f0fff0",
      "--text-primary":  "#e8f5e9",
      "--text-secondary":"#c8e6c9",
      "--text-label":    "#81c784",
      "--text-muted":    "#4caf50",
      "--text-faint":    "#388e3c",
    },
  },
  {
    id: "charcoal", name: "Charcoal", type: "dark",
    preview: { page: "#111111", panel: "#1a1a1a", text: "#a3a3a3" },
    vars: {
      "--bg-page":       "#111111",
      "--bg-panel":      "#1a1a1a",
      "--bg-elevated":   "#242424",
      "--bg-hover":      "#2e2e2e",
      "--border-subtle": "#242424",
      "--border-main":   "#333333",
      "--text-brightest":"#fafafa",
      "--text-primary":  "#f5f5f5",
      "--text-secondary":"#d4d4d4",
      "--text-label":    "#a3a3a3",
      "--text-muted":    "#737373",
      "--text-faint":    "#525252",
    },
  },
  {
    id: "void", name: "Void", type: "dark",
    preview: { page: "#0d0014", panel: "#120020", text: "#c084fc" },
    vars: {
      "--bg-page":       "#0d0014",
      "--bg-panel":      "#120020",
      "--bg-elevated":   "#1a0030",
      "--bg-hover":      "#260045",
      "--border-subtle": "#1a0030",
      "--border-main":   "#3b0066",
      "--text-brightest":"#fdf4ff",
      "--text-primary":  "#f0e6ff",
      "--text-secondary":"#d8b4fe",
      "--text-label":    "#c084fc",
      "--text-muted":    "#a855f7",
      "--text-faint":    "#7c3aed",
    },
  },
  {
    id: "crimson", name: "Crimson", type: "dark",
    preview: { page: "#140608", panel: "#1e0a0e", text: "#fb7185" },
    vars: {
      "--bg-page":       "#140608",
      "--bg-panel":      "#1e0a0e",
      "--bg-elevated":   "#2d1219",
      "--bg-hover":      "#401920",
      "--border-subtle": "#2d1219",
      "--border-main":   "#5c2030",
      "--text-brightest":"#fff0f0",
      "--text-primary":  "#ffe4e6",
      "--text-secondary":"#fecdd3",
      "--text-label":    "#fb7185",
      "--text-muted":    "#e11d48",
      "--text-faint":    "#9f1239",
    },
  },
  {
    id: "ocean", name: "Ocean", type: "dark",
    preview: { page: "#020d14", panel: "#051c2e", text: "#38bdf8" },
    vars: {
      "--bg-page":       "#020d14",
      "--bg-panel":      "#051c2e",
      "--bg-elevated":   "#0a2d47",
      "--bg-hover":      "#0e3d60",
      "--border-subtle": "#0a2d47",
      "--border-main":   "#1a5276",
      "--text-brightest":"#f0fbff",
      "--text-primary":  "#e0f7ff",
      "--text-secondary":"#b0e8ff",
      "--text-label":    "#38bdf8",
      "--text-muted":    "#0ea5e9",
      "--text-faint":    "#0369a1",
    },
  },
  // ── Light (pastel) ───────────────────────────────────────────
  {
    id: "cloud", name: "Cloud", type: "light",
    preview: { page: "#f1f5f9", panel: "#ffffff", text: "#64748b" },
    vars: {
      "--bg-page":       "#f1f5f9",
      "--bg-panel":      "#ffffff",
      "--bg-elevated":   "#f8fafc",
      "--bg-hover":      "#e2e8f0",
      "--border-subtle": "#e2e8f0",
      "--border-main":   "#cbd5e1",
      "--text-brightest":"#020617",
      "--text-primary":  "#0f172a",
      "--text-secondary":"#1e293b",
      "--text-label":    "#334155",
      "--text-muted":    "#64748b",
      "--text-faint":    "#94a3b8",
    },
  },
  {
    id: "lavender", name: "Lavender", type: "light",
    preview: { page: "#faf5ff", panel: "#f3e8ff", text: "#7c3aed" },
    vars: {
      "--bg-page":       "#faf5ff",
      "--bg-panel":      "#f3e8ff",
      "--bg-elevated":   "#ede9fe",
      "--bg-hover":      "#ddd6fe",
      "--border-subtle": "#ede9fe",
      "--border-main":   "#c4b5fd",
      "--text-brightest":"#1e1b4b",
      "--text-primary":  "#1e1b4b",
      "--text-secondary":"#312e81",
      "--text-label":    "#4c1d95",
      "--text-muted":    "#6d28d9",
      "--text-faint":    "#7c3aed",
    },
  },
  {
    id: "mint", name: "Mint", type: "light",
    preview: { page: "#f0fdf4", panel: "#dcfce7", text: "#166534" },
    vars: {
      "--bg-page":       "#f0fdf4",
      "--bg-panel":      "#dcfce7",
      "--bg-elevated":   "#bbf7d0",
      "--bg-hover":      "#86efac",
      "--border-subtle": "#bbf7d0",
      "--border-main":   "#86efac",
      "--text-brightest":"#052e16",
      "--text-primary":  "#052e16",
      "--text-secondary":"#14532d",
      "--text-label":    "#166534",
      "--text-muted":    "#15803d",
      "--text-faint":    "#16a34a",
    },
  },
  {
    id: "peach", name: "Peach", type: "light",
    preview: { page: "#fff7ed", panel: "#ffedd5", text: "#9a3412" },
    vars: {
      "--bg-page":       "#fff7ed",
      "--bg-panel":      "#ffedd5",
      "--bg-elevated":   "#fed7aa",
      "--bg-hover":      "#fdba74",
      "--border-subtle": "#fed7aa",
      "--border-main":   "#fdba74",
      "--text-brightest":"#431407",
      "--text-primary":  "#431407",
      "--text-secondary":"#7c2d12",
      "--text-label":    "#9a3412",
      "--text-muted":    "#c2410c",
      "--text-faint":    "#ea580c",
    },
  },
  {
    id: "blossom", name: "Blossom", type: "light",
    preview: { page: "#fff0f6", panel: "#ffe4f0", text: "#be185d" },
    vars: {
      "--bg-page":       "#fff0f6",
      "--bg-panel":      "#ffe4f0",
      "--bg-elevated":   "#ffc9de",
      "--bg-hover":      "#ffaece",
      "--border-subtle": "#ffc9de",
      "--border-main":   "#f9a8d4",
      "--text-brightest":"#3d0020",
      "--text-primary":  "#500028",
      "--text-secondary":"#7d0040",
      "--text-label":    "#9d174d",
      "--text-muted":    "#be185d",
      "--text-faint":    "#db2777",
    },
  },
  {
    id: "sand", name: "Sand", type: "light",
    preview: { page: "#fdf8f0", panel: "#f5ead8", text: "#6b4c28" },
    vars: {
      "--bg-page":       "#fdf8f0",
      "--bg-panel":      "#f5ead8",
      "--bg-elevated":   "#eddfc0",
      "--bg-hover":      "#e0ceaa",
      "--border-subtle": "#eddfc0",
      "--border-main":   "#d4b896",
      "--text-brightest":"#1c1208",
      "--text-primary":  "#2d1f0a",
      "--text-secondary":"#4a3319",
      "--text-label":    "#6b4c28",
      "--text-muted":    "#8b6435",
      "--text-faint":    "#a07840",
    },
  },
  {
    id: "sky", name: "Sky", type: "light",
    preview: { page: "#f0f9ff", panel: "#e0f2fe", text: "#0369a1" },
    vars: {
      "--bg-page":       "#f0f9ff",
      "--bg-panel":      "#e0f2fe",
      "--bg-elevated":   "#bae6fd",
      "--bg-hover":      "#7dd3fc",
      "--border-subtle": "#bae6fd",
      "--border-main":   "#7dd3fc",
      "--text-brightest":"#0c1a2e",
      "--text-primary":  "#0c1a2e",
      "--text-secondary":"#0f2744",
      "--text-label":    "#164e73",
      "--text-muted":    "#0369a1",
      "--text-faint":    "#0284c7",
    },
  },
];

export const DEFAULT_THEME = "slate";

export function getTheme(id: string): Theme {
  return THEMES.find(t => t.id === id) ?? THEMES[0];
}

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  Object.entries(theme.vars).forEach(([k, v]) => root.style.setProperty(k, v));
  root.setAttribute("data-theme-type", theme.type);
}

export function loadAndApplyTheme() {
  const id = localStorage.getItem("qa-theme") ?? DEFAULT_THEME;
  applyTheme(getTheme(id));
  return id;
}
