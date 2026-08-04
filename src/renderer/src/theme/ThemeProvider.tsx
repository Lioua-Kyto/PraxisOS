import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import type { FontKey, ThemeKey } from "@shared/types";
import { useSettings, useUpdateSettings } from "../queries/settings";
import { useThemePresets } from "../queries/themePresets";
import { derivePaletteOverrides } from "../lib/color";

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
    if (activePreset) {
      const overrides = derivePaletteOverrides(activePreset.background, activePreset.accent);
      for (const [prop, value] of Object.entries(overrides)) root.setProperty(prop, value);
    } else {
      for (const prop of OVERRIDE_PROPERTIES) root.removeProperty(prop);
    }
  }, [activePreset]);

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
