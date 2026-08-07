import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import type { FontKey, ThemeKey } from "@shared/types";
import { useSettings, useUpdateSettings } from "../queries/settings";
import { useThemePresets } from "../queries/themePresets";
import { derivePaletteOverrides } from "../lib/color";

/** "rgb(23, 19, 15)" / "rgba(…)" → "#17130f". Empty string if it can't parse. */
function rgbToHex(rgb: string): string {
  const m = rgb.match(/\d+/g);
  if (!m || m.length < 3) return "";
  return "#" + m.slice(0, 3).map((n) => Number(n).toString(16).padStart(2, "0")).join("");
}

const OVERRIDE_PROPERTIES = [
  "--background",
  "--foreground",
  "--card",
  "--card-foreground",
  "--popover",
  "--popover-foreground",
  "--sunken",
  "--border",
  "--border-soft",
  "--input",
  "--secondary",
  "--secondary-foreground",
  "--muted",
  "--muted-foreground",
  "--accent",
  "--accent-foreground",
  "--primary",
  "--primary-foreground",
  "--ring"
];

interface ThemeContextValue {
  theme: ThemeKey;
  font: FontKey;
  activePresetId: number | null;
  setTheme: (theme: ThemeKey) => void;
  setFont: (font: FontKey) => void;
  applyPreset: (id: number) => void;
  clearPreset: () => void;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { data: settings } = useSettings();
  const { data: presets = [] } = useThemePresets();
  const updateSettings = useUpdateSettings();

  const theme = settings?.theme ?? "dark";
  const font = settings?.font ?? "sans";
  const activePresetId = settings?.activePresetId ?? null;
  const activePreset = activePresetId ? presets.find((p) => p.id === activePresetId) ?? null : null;

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", activePreset?.baseTheme ?? theme);
  }, [theme, activePreset]);

  useEffect(() => {
    document.documentElement.setAttribute("data-font", font);
  }, [font]);

  useEffect(() => {
    const root = document.documentElement.style;
    // Always clear first. A preset that inherits its background emits no
    // surface overrides at all, so without this a previously-applied preset's
    // background would linger on the root element and bleed into it.
    for (const prop of OVERRIDE_PROPERTIES) root.removeProperty(prop);
    if (!activePreset) return;

    const overrides = derivePaletteOverrides(activePreset.background, activePreset.accent, activePreset.foreground);
    for (const [prop, value] of Object.entries(overrides)) root.setProperty(prop, value);
  }, [activePreset]);

  // Keep the Windows window-control overlay (min/max/close) on the same colour
  // as the custom title bar. Read the resolved colours after the theme's CSS
  // variables have painted, convert to hex (the overlay API wants hex, not the
  // rgb() getComputedStyle returns), then hand them to main. The widget window
  // has no overlay, so it skips this.
  useEffect(() => {
    if (window.location.hash === "#widget") return;
    const id = requestAnimationFrame(() => {
      const styles = getComputedStyle(document.body);
      const color = rgbToHex(styles.backgroundColor);
      const symbolColor = rgbToHex(styles.color);
      if (color && symbolColor) void window.api.window.setTitleBarOverlay({ color, symbolColor });
    });
    return () => cancelAnimationFrame(id);
  }, [theme, font, activePreset]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      font,
      activePresetId,
      setTheme: (next) => updateSettings.mutate({ theme: next, activePresetId: null }),
      setFont: (next) => updateSettings.mutate({ font: next }),
      applyPreset: (id) => {
        const preset = presets.find((p) => p.id === id);
        updateSettings.mutate({ activePresetId: id, theme: preset?.baseTheme ?? theme });
      },
      clearPreset: () => updateSettings.mutate({ activePresetId: null }),
      ready: Boolean(settings)
    }),
    [theme, font, activePresetId, settings, updateSettings, presets]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
