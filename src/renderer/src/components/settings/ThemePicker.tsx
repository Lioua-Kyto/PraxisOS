import { Check } from "lucide-react";
import { cn } from "../../lib/utils";
import { useTheme } from "../../theme/ThemeProvider";
import { FONTS, THEMES } from "../../theme/themes";

export function ThemePicker() {
  const { theme, font, setTheme, setFont } = useTheme();

  return (
    <div>
      <div className="mb-3 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">Color theme</div>
      <div className="flex flex-wrap gap-2.5">
        {THEMES.map((t) => (
          <button
            key={t.key}
            onClick={() => setTheme(t.key)}
            className={cn(
              "flex w-24 flex-col gap-2 rounded-md border border-border p-2.5 text-left transition-colors hover:border-primary/50",
              theme === t.key && "border-primary"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {t.dots.map((d, i) => (
                  <span key={i} className="h-3 w-3 rounded-full border border-black/10" style={{ background: d }} />
                ))}
              </div>
              {theme === t.key && <Check className="h-3 w-3 text-primary" />}
            </div>
            <div className="text-[11px]">{t.label}</div>
          </button>
        ))}
      </div>

      <div className="mt-6 mb-3 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">Typography</div>
      <div className="flex flex-wrap gap-2.5">
        {FONTS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFont(f.key)}
            style={{ fontFamily: f.sample }}
            className={cn(
              "rounded-md border border-border px-3.5 py-2.5 text-[13px] transition-colors hover:border-primary/50",
              font === f.key && "border-primary"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>
    </div>
  );
}
