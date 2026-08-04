import React, { createContext, useContext, useEffect, useState } from "react";

export const THEMES = [
  { key: "ink", label: "Ink", dots: ["#17140f", "#cf7a3d", "#ece6d8"] },
  { key: "paper", label: "Paper", dots: ["#f1ece0", "#3d6e47", "#262218"] },
  {
    key: "terminal",
    label: "Terminal",
    dots: ["#050705", "#6fffa0", "#a9ffc4"],
  },
  { key: "slate", label: "Slate", dots: ["#14161b", "#4f9d97", "#e3e5e9"] },
];

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("theme") || "ink",
  );
  const [customAccent, setCustomAccent] = useState(
    () => localStorage.getItem("customAccent") || "",
  );
  const [fontScale, setFontScale] = useState(() =>
    Number(localStorage.getItem("fontScale") || 1),
  );

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  useEffect(() => {
    if (customAccent) {
      document.documentElement.style.setProperty("--accent", customAccent);
      localStorage.setItem("customAccent", customAccent);
    } else {
      document.documentElement.style.removeProperty("--accent");
      localStorage.removeItem("customAccent");
    }
  }, [customAccent]);

  useEffect(() => {
    document.documentElement.style.setProperty("--font-scale", fontScale);
    localStorage.setItem("fontScale", String(fontScale));
  }, [fontScale]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        customAccent,
        setCustomAccent,
        fontScale,
        setFontScale,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
