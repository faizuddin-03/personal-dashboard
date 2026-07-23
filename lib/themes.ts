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
      // Neutral grey base — no clash to fix, keep the familiar blue accent.
      "--accent":        "#3b82f6",
      "--accent-hover":  "#2563eb",
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
      // Navy base (hue ~225) — warm gold/amber is its near-complement,
      // a classic navy-and-gold pairing instead of blue-on-blue mush.
      "--accent":        "#f59e0b",
      "--accent-hover":  "#d97706",
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
      // Green base (hue ~130) — a split-complementary warm amber/orange
      // reads as an autumn palette instead of clashing hard on red.
      "--accent":        "#f97316",
      "--accent-hover":  "#ea580c",
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
      // True neutral grey, no hue to complement — a cyan/teal accent
      // differentiates it from Slate's blue while staying unclashing.
      "--accent":        "#06b6d4",
      "--accent-hover":  "#0891b2",
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
      // Purple base (hue ~280) — complementary cyan gives a synthwave
      // purple/cyan pairing that fits the "Void" space feel.
      "--accent":        "#22d3ee",
      "--accent-hover":  "#06b6d4",
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
      // Red base (hue ~350) — teal is red's classic complement (the exact
      // "blue button on a red page" clash the theme was picked to avoid).
      "--accent":        "#14b8a6",
      "--accent-hover":  "#0d9488",
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
      // Cyan/blue base (hue ~195) — warm coral/orange is its near-
      // complement, an "ocean sunset" pairing.
      "--accent":        "#fb923c",
      "--accent-hover":  "#f97316",
    },
  },
  {
    // User-supplied palette "逆光の発明" (Backlit Invention) — dark maroon
    // base with a teal accent already built into the source palette.
    id: "ember", name: "Ember", type: "dark",
    preview: { page: "#2a1417", panel: "#50282c", text: "#e1d1ca" },
    vars: {
      "--bg-page":       "#2a1417",
      "--bg-panel":      "#50282c",
      "--bg-elevated":   "#6b3a3f",
      "--bg-hover":       "#86494f",
      "--border-subtle": "#6b3a3f",
      "--border-main":   "#86494f",
      "--text-brightest":"#fdf0ee",
      "--text-primary":  "#f5dcd8",
      "--text-secondary":"#e1d1ca",
      "--text-label":    "#d9a8a0",
      "--text-muted":    "#fb958c",
      "--text-faint":    "#c77a72",
      "--accent":        "#16939e",
      "--accent-hover":  "#0f7680",
    },
  },
  {
    // User-supplied palette "群青に眠る" (Sleeping in Ultramarine) — classic
    // navy-and-gold, using the palette's own Sandy Amber as the accent.
    id: "navy-amber", name: "Navy & Amber", type: "dark",
    preview: { page: "#060f2e", panel: "#102a6b", text: "#cea273" },
    vars: {
      "--bg-page":       "#060f2e",
      "--bg-panel":      "#102a6b",
      "--bg-elevated":   "#163a8a",
      "--bg-hover":      "#1d4aa8",
      "--border-subtle": "#163a8a",
      "--border-main":   "#015185",
      "--text-brightest":"#fcedd3",
      "--text-primary":  "#f5e2c2",
      "--text-secondary":"#e8cfa8",
      "--text-label":    "#cea273",
      "--text-muted":    "#b3865c",
      "--text-faint":    "#8a6845",
      "--accent":        "#cea273",
      "--accent-hover":  "#b3865c",
    },
  },
  {
    // User-supplied palette (palm leaves) — dark olive with the palette's
    // own Fallen Blossoms pink as the complementary accent.
    id: "palm", name: "Palm", type: "dark",
    preview: { page: "#1c2212", panel: "#364023", text: "#c7a39b" },
    vars: {
      "--bg-page":       "#1c2212",
      "--bg-panel":      "#364023",
      "--bg-elevated":   "#47542e",
      "--bg-hover":      "#5c6b3c",
      "--border-subtle": "#47542e",
      "--border-main":   "#6a823e",
      "--text-brightest":"#efd4dd",
      "--text-primary":  "#e6c3cf",
      "--text-secondary":"#e6b1c4",
      "--text-label":    "#c7a39b",
      "--text-muted":    "#9c9f69",
      "--text-faint":    "#838660",
      "--accent":        "#e6b1c4",
      "--accent-hover":  "#d494ab",
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
      // Neutral base — no clash to fix, keep the familiar blue accent.
      "--accent":        "#2563eb",
      "--accent-hover":  "#1d4ed8",
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
      // Purple base (hue ~270) — complementary gold/amber for an
      // elegant purple-and-gold pairing.
      "--accent":        "#d97706",
      "--accent-hover":  "#b45309",
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
      // Green base (hue ~150) — complementary coral/rose, a fresh
      // spring green-and-coral pairing.
      "--accent":        "#e11d48",
      "--accent-hover":  "#be123c",
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
      // Orange base (hue ~30) — complementary teal/cyan, the popular
      // "peach and teal" retro pairing.
      "--accent":        "#0891b2",
      "--accent-hover":  "#0e7490",
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
      // Pink/magenta base (hue ~330) — complementary emerald/teal for
      // contrast without fighting the pink.
      "--accent":        "#059669",
      "--accent-hover":  "#047857",
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
      // Warm tan base (hue ~35) — complementary desert-sky blue.
      "--accent":        "#0369a1",
      "--accent-hover":  "#075985",
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
      // Sky blue base (hue ~200) — complementary sunset coral/orange.
      "--accent":        "#ea580c",
      "--accent-hover":  "#c2410c",
    },
  },
  // ── Light (user-supplied palettes) ────────────────────────────
  {
    // "@umig.rl" citrus palette — warm orange family with Mistral (blue)
    // as the outlier, used here as the accent for contrast.
    id: "citrus", name: "Citrus", type: "light",
    preview: { page: "#fff8ec", panel: "#fee4b8", text: "#c17a2e" },
    vars: {
      "--bg-page":       "#fff8ec",
      "--bg-panel":      "#fef3dc",
      "--bg-elevated":   "#fee4b8",
      "--bg-hover":      "#ffc065",
      "--border-subtle": "#fee4b8",
      "--border-main":   "#ffc065",
      "--text-brightest":"#431a00",
      "--text-primary":  "#5c2a00",
      "--text-secondary":"#7a3d0a",
      "--text-label":    "#9a5716",
      "--text-muted":    "#c17a2e",
      "--text-faint":    "#ffa43a",
      "--accent":        "#29abd4",
      "--accent-hover":  "#1c8cb0",
    },
  },
  {
    // "@designbyanno" lollipop palette — pinks with Boy Blue as the
    // built-in accent (the source palette itself pairs pink cards with
    // blue label text).
    id: "lollipop", name: "Lollipop", type: "light",
    preview: { page: "#fbf5f7", panel: "#f2eef2", text: "#a13a56" },
    vars: {
      "--bg-page":       "#fbf5f7",
      "--bg-panel":      "#f2eef2",
      "--bg-elevated":   "#e9bac6",
      "--bg-hover":      "#c66f89",
      "--border-subtle": "#e9bac6",
      "--border-main":   "#c7dc8b",
      "--text-brightest":"#3d0018",
      "--text-primary":  "#5c1122",
      "--text-secondary":"#7d1f34",
      "--text-label":    "#a13a56",
      "--text-muted":    "#c66f89",
      "--text-faint":    "#dba1b3",
      "--accent":        "#6994dc",
      "--accent-hover":  "#4e76be",
    },
  },
  {
    // "@tammythree" citrus-flower palette — lemon/lime/coral/salmon with
    // Soft Baby Blue as the accent.
    id: "coral-garden", name: "Coral Garden", type: "light",
    preview: { page: "#fffbf0", panel: "#f7efc9", text: "#b3452f" },
    vars: {
      "--bg-page":       "#fffbf0",
      "--bg-panel":      "#f7efc9",
      "--bg-elevated":   "#f3e9a8",
      "--bg-hover":      "#c8ce72",
      "--border-subtle": "#efd780",
      "--border-main":   "#c8ce72",
      "--text-brightest":"#4a1010",
      "--text-primary":  "#6b1616",
      "--text-secondary":"#8f2323",
      "--text-label":    "#b3452f",
      "--text-muted":    "#f38081",
      "--text-faint":    "#f79977",
      "--accent":        "#4a90c2",
      "--accent-hover":  "#3a749e",
    },
  },
  {
    // Forbidden City palette — sunset orange/yellow with Azure Sky/
    // Apocyan as the accent.
    id: "temple-sunset", name: "Temple Sunset", type: "light",
    preview: { page: "#fff6e8", panel: "#fceabc", text: "#c05a1a" },
    vars: {
      "--bg-page":       "#fff6e8",
      "--bg-panel":      "#fff6e8",
      "--bg-elevated":   "#fceabc",
      "--bg-hover":      "#fecc64",
      "--border-subtle": "#fceabc",
      "--border-main":   "#fecc64",
      "--text-brightest":"#5a2600",
      "--text-primary":  "#7a3200",
      "--text-secondary":"#9a4310",
      "--text-label":    "#c05a1a",
      "--text-muted":    "#fa9058",
      "--text-faint":    "#d9b98a",
      "--accent":        "#4a8fe0",
      "--accent-hover":  "#3672bd",
    },
  },
  {
    // Hydrangea/bubbles palette — greens and duck-egg blue with
    // Strawberry Shake as the accent.
    id: "duck-egg-garden", name: "Duck Egg Garden", type: "light",
    preview: { page: "#f3f6ec", panel: "#e5eedc", text: "#538376" },
    vars: {
      "--bg-page":       "#f3f6ec",
      "--bg-panel":      "#e5eedc",
      "--bg-elevated":   "#c1d591",
      "--bg-hover":      "#b8d5da",
      "--border-subtle": "#c1d591",
      "--border-main":   "#8fae86",
      "--text-brightest":"#1a2e14",
      "--text-primary":  "#253d1c",
      "--text-secondary":"#3a5a2c",
      "--text-label":    "#538376",
      "--text-muted":    "#6f9d86",
      "--text-faint":    "#9ec0eb",
      "--accent":        "#d4638a",
      "--accent-hover":  "#b84a70",
    },
  },
  {
    // "春風のクロス" plaid palette — teal/mint with Coral Peach as the
    // accent.
    id: "tropical-plaid", name: "Tropical Plaid", type: "light",
    preview: { page: "#fbf6ea", panel: "#f8e8cb", text: "#2a7e82" },
    vars: {
      "--bg-page":       "#fbf6ea",
      "--bg-panel":      "#f8e8cb",
      "--bg-elevated":   "#cdeee8",
      "--bg-hover":      "#a3dbcf",
      "--border-subtle": "#a3dbcf",
      "--border-main":   "#36c9d1",
      "--text-brightest":"#0d3b3d",
      "--text-primary":  "#144a4d",
      "--text-secondary":"#1f6265",
      "--text-label":    "#2a7e82",
      "--text-muted":    "#36c9d1",
      "--text-faint":    "#7fd6da",
      "--accent":        "#f0917e",
      "--accent-hover":  "#d97862",
    },
  },
  {
    // Matcha-latte palette — green/brown with Strawberry as the accent.
    id: "matcha", name: "Matcha", type: "light",
    preview: { page: "#f8faf0", panel: "#eef2dd", text: "#7a5a30" },
    vars: {
      "--bg-page":       "#f8faf0",
      "--bg-panel":      "#eef2dd",
      "--bg-elevated":   "#d8e5b8",
      "--bg-hover":      "#9fc76b",
      "--border-subtle": "#d8e5b8",
      "--border-main":   "#a07d58",
      "--text-brightest":"#2a1f10",
      "--text-primary":  "#3d2c16",
      "--text-secondary":"#5c4322",
      "--text-label":    "#7a5a30",
      "--text-muted":    "#a07d58",
      "--text-faint":    "#c7a97a",
      "--accent":        "#dd716b",
      "--accent-hover":  "#c25852",
    },
  },
  {
    // "@olyacooper" palette — vanilla/blush/rosewood with the palette's
    // own dark Midnight Lagoon reused as an "ink" accent.
    id: "rosewood", name: "Rosewood", type: "light",
    preview: { page: "#fffbf3", panel: "#fff7e6", text: "#8a5a62" },
    vars: {
      "--bg-page":       "#fffbf3",
      "--bg-panel":      "#fff7e6",
      "--bg-elevated":   "#f7c8d3",
      "--bg-hover":      "#e8afc0",
      "--border-subtle": "#f7c8d3",
      "--border-main":   "#b46a72",
      "--text-brightest":"#2d3a47",
      "--text-primary":  "#3a4552",
      "--text-secondary":"#5c4046",
      "--text-label":    "#8a5a62",
      "--text-muted":    "#a8b58a",
      "--text-faint":    "#a9b7c6",
      "--accent":        "#2d3a47",
      "--accent-hover":  "#1c2530",
    },
  },
  {
    // Sunset-stairs palette — mauve/purple with the palette's own
    // Dark Vanilla (deepened) as a warm accent.
    id: "dusk", name: "Dusk", type: "light",
    preview: { page: "#f5f1fa", panel: "#ece6f5", text: "#5c63a4" },
    vars: {
      "--bg-page":       "#f5f1fa",
      "--bg-panel":      "#ece6f5",
      "--bg-elevated":   "#c9c9e8",
      "--bg-hover":      "#acb0cc",
      "--border-subtle": "#acb0cc",
      "--border-main":   "#8b7fac",
      "--text-brightest":"#2a2d52",
      "--text-primary":  "#3d3f66",
      "--text-secondary":"#5c63a4",
      "--text-label":    "#7d6f96",
      "--text-muted":    "#8b7fac",
      "--text-faint":    "#acb0cc",
      "--accent":        "#c9825a",
      "--accent-hover":  "#a8683f",
    },
  },
  {
    // Gemini Creative Studio tulip palette — pastel blue/yellow with
    // Light Indigo reused as the accent.
    id: "tulip", name: "Tulip", type: "light",
    preview: { page: "#fbf9f0", panel: "#fff3d2", text: "#543787" },
    vars: {
      "--bg-page":       "#fbf9f0",
      "--bg-panel":      "#fff3d2",
      "--bg-elevated":   "#ffebae",
      "--bg-hover":      "#a7b5fe",
      "--border-subtle": "#d4e0f0",
      "--border-main":   "#a7b5fe",
      "--text-brightest":"#2b1a52",
      "--text-primary":  "#3d2766",
      "--text-secondary":"#543787",
      "--text-label":    "#4f9aa3",
      "--text-muted":    "#4f9aa3",
      "--text-faint":    "#feb737",
      "--accent":        "#543787",
      "--accent-hover":  "#3d2766",
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
