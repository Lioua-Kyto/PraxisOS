import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import type { FontKey, ThemeKey } from "@shared/types";
import { useSettings, useUpdateSettings } from "../queries/settings";

interface ThemeContextValue {
  theme: ThemeKey;
  font: FontKey;
  setTheme: (theme: ThemeKey) => void;
  setFont: (font: FontKey) => void;
  ready: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { data: settings } = useSettings();
  const updateSettings = useUpdateSettings();

  const theme = settings?.theme ?? "dark";
  const font = settings?.font ?? "sans";

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.setAttribute("data-font", font);
  }, [font]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      font,
      setTheme: (next) => updateSettings.mutate({ theme: next }),
      setFont: (next) => updateSettings.mutate({ font: next }),
      ready: Boolean(settings)
    }),
    [theme, font, settings, updateSettings]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}
