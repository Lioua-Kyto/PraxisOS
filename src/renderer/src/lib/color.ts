// Hex <-> HSL helpers for the custom theme-preset system. CSS custom
// properties in index.css are stored as bare "H S% L%" triplets (consumed as
// hsl(var(--x))), so every value here follows that same bare-triplet format.

export interface Hsl {
  h: number;
  s: number;
  l: number;
}

export function hexToHsl(hex: string): Hsl {
  const clean = hex.replace("#", "");
  const full = clean.length === 3 ? clean.split("").map((c) => c + c).join("") : clean;
  const r = parseInt(full.slice(0, 2), 16) / 255;
  const g = parseInt(full.slice(2, 4), 16) / 255;
  const b = parseInt(full.slice(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return { h: 0, s: 0, l: Math.round(l * 100) };

  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h: number;
  switch (max) {
    case r:
      h = ((g - b) / d + (g < b ? 6 : 0)) * 60;
      break;
    case g:
      h = ((b - r) / d + 2) * 60;
      break;
    default:
      h = ((r - g) / d + 4) * 60;
  }
  return { h: Math.round(h), s: Math.round(s * 100), l: Math.round(l * 100) };
}

export function hslToHex({ h, s, l }: Hsl): string {
  const sat = s / 100;
  const light = l / 100;
  const c = (1 - Math.abs(2 * light - 1)) * sat;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = light - c / 2;
  let [r, g, b] = [0, 0, 0];
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];

  const toHex = (v: number) =>
    Math.round((v + m) * 255)
      .toString(16)
      .padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

export function hslString({ h, s, l }: Hsl): string {
  return `${h} ${s}% ${l}%`;
}

const clampL = (l: number) => Math.min(100, Math.max(0, l));

/**
 * Builds the CSS variable overrides a preset applies on top of its base
 * theme.
 *
 * Crucially, surfaces are only overridden when the preset actually specifies
 * a background. The common case — "I want the Light theme but with an amber
 * accent" — passes `backgroundHex: null`, so every background/card/border
 * token stays exactly as the base theme defines it and only the accent
 * changes. Previously a preset always re-derived surfaces from an
 * approximation of the theme's background, which is why picking Light + amber
 * produced amber buttons on a background that no longer matched Light.
 */
export function derivePaletteOverrides(
  backgroundHex: string | null,
  accentHex: string,
  foregroundHex?: string | null
): Record<string, string> {
  const accent = hexToHsl(accentHex);
  const accentOverrides: Record<string, string> = {
    "--primary": hslString(accent),
    "--primary-foreground": hslString({
      h: accent.h,
      s: Math.min(accent.s, 15),
      l: accent.l < 50 ? 96 : 8
    }),
    "--ring": hslString(accent)
  };

  if (foregroundHex) {
    accentOverrides["--foreground"] = hslString(hexToHsl(foregroundHex));
    accentOverrides["--card-foreground"] = accentOverrides["--foreground"];
    accentOverrides["--popover-foreground"] = accentOverrides["--foreground"];
    accentOverrides["--secondary-foreground"] = accentOverrides["--foreground"];
    accentOverrides["--accent-foreground"] = accentOverrides["--foreground"];
  }

  if (!backgroundHex) return accentOverrides;

  return { ...deriveSurfaceOverrides(backgroundHex, foregroundHex), ...accentOverrides };
}

// Derives a coherent set of surface/text tokens from a background color. Only
// used when a preset explicitly overrides the background.
function deriveSurfaceOverrides(backgroundHex: string, foregroundHex?: string | null) {
  const bg = hexToHsl(backgroundHex);
  const isDark = bg.l < 50;
  const dir = isDark ? 1 : -1;

  const foreground: Hsl = { h: bg.h, s: Math.min(bg.s, 20), l: clampL(isDark ? 92 : 15) };
  const card: Hsl = { ...bg, l: clampL(bg.l + dir * 3) };
  const sunken: Hsl = { ...bg, l: clampL(bg.l - dir * 4) };
  const border: Hsl = { ...bg, l: clampL(bg.l + dir * 13) };
  const borderSoft: Hsl = { ...bg, l: clampL(bg.l + dir * 8) };
  const secondary: Hsl = { ...bg, l: clampL(bg.l + dir * 9) };
  const muted: Hsl = { ...bg, l: clampL(bg.l + dir * 7) };
  const mutedForeground: Hsl = { h: bg.h, s: Math.min(bg.s, 12), l: clampL(isDark ? 62 : 40) };
  const text = foregroundHex ? hexToHsl(foregroundHex) : foreground;

  return {
    "--background": hslString(bg),
    "--foreground": hslString(text),
    "--card": hslString(card),
    "--card-foreground": hslString(text),
    "--popover": hslString(card),
    "--popover-foreground": hslString(text),
    "--sunken": hslString(sunken),
    "--border": hslString(border),
    "--border-soft": hslString(borderSoft),
    "--input": hslString(border),
    "--secondary": hslString(secondary),
    "--secondary-foreground": hslString(text),
    "--muted": hslString(muted),
    "--muted-foreground": hslString(mutedForeground),
    "--accent": hslString(secondary),
    "--accent-foreground": hslString(text)
  } as Record<string, string>;
}
