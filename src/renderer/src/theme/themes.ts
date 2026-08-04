import type { FontKey, ThemeKey } from "@shared/types";

export const THEMES: Array<{ key: ThemeKey; label: string; dots: [string, string, string] }> = [
  { key: "light", label: "Light", dots: ["#f1ece0", "#3d6e47", "#262218"] },
  { key: "dark", label: "Dark", dots: ["#17140f", "#cf7a3d", "#ece6d8"] },
  { key: "solarized", label: "Solarized", dots: ["#002b36", "#268bd2", "#eee8d5"] },
  { key: "midnight", label: "Midnight", dots: ["#0a0c14", "#7784e8", "#e6e8f5"] },
  { key: "cyberpunk", label: "Cyberpunk", dots: ["#0c0616", "#ff3ec8", "#26e6d6"] }
];

export const FONTS: Array<{ key: FontKey; label: string; sample: string }> = [
  { key: "sans", label: "Inter (Sans)", sample: "Inter, system-ui, sans-serif" },
  { key: "display", label: "Fraunces (Serif)", sample: "Fraunces, Georgia, serif" },
  { key: "mono", label: "IBM Plex Mono", sample: "'IBM Plex Mono', ui-monospace, monospace" }
];
