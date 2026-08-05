import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Switch } from "../ui/switch";
import { ColorField } from "../ui/color-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { THEMES } from "../../theme/themes";
import { derivePaletteOverrides } from "../../lib/color";
import type { NewThemePreset, ThemeKey, ThemePreset } from "@shared/types";

const themeSwatches = (key: ThemeKey) => {
  const theme = THEMES.find((t) => t.key === key) ?? THEMES[1];
  return { background: theme.dots[0], accent: theme.dots[1], foreground: theme.dots[2] };
};

/**
 * Live sample. When a colour is inherited we can't resolve the base theme's
 * exact token here, so the swatch falls back to the theme's representative
 * colour — close enough to judge contrast before saving.
 */
function PresetPreview({
  baseTheme,
  background,
  accent,
  foreground
}: {
  baseTheme: ThemeKey;
  background: string | null;
  accent: string;
  foreground: string | null;
}) {
  const swatches = themeSwatches(baseTheme);
  const bg = background ?? swatches.background;
  const fg = foreground ?? swatches.foreground;
  const vars = derivePaletteOverrides(bg, accent, fg);
  const style = (name: string, fallback: string) => (vars[name] ? `hsl(${vars[name]})` : fallback);

  return (
    <div
      className="rounded-md border p-3"
      style={{ background: style("--background", bg), borderColor: style("--border", "transparent") }}
    >
      <div className="mb-2 text-xs" style={{ color: style("--foreground", fg) }}>
        Preview
      </div>
      <div
        className="rounded-md p-2.5"
        style={{ background: style("--card", bg), border: `1px solid ${style("--border-soft", "transparent")}` }}
      >
        <div className="text-[13px]" style={{ color: style("--card-foreground", fg) }}>
          Sample surface
        </div>
        <div
          className="mt-2 inline-block rounded px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: style("--primary", accent), color: style("--primary-foreground", "#fff") }}
        >
          Accent button
        </div>
      </div>
    </div>
  );
}

export function PresetDialog({
  open,
  onOpenChange,
  preset,
  onSubmit,
  isSubmitting
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  preset?: ThemePreset;
  onSubmit: (values: NewThemePreset) => void;
  isSubmitting?: boolean;
}) {
  const [name, setName] = useState("");
  const [baseTheme, setBaseTheme] = useState<ThemeKey>("dark");
  const [accent, setAccent] = useState(themeSwatches("dark").accent);
  const [overrideBackground, setOverrideBackground] = useState(false);
  const [background, setBackground] = useState(themeSwatches("dark").background);
  const [overrideForeground, setOverrideForeground] = useState(false);
  const [foreground, setForeground] = useState(themeSwatches("dark").foreground);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    const base = preset?.baseTheme ?? "dark";
    const swatches = themeSwatches(base);
    setName(preset?.name ?? "");
    setBaseTheme(base);
    setAccent(preset?.accent ?? swatches.accent);
    setOverrideBackground(Boolean(preset?.background));
    setBackground(preset?.background ?? swatches.background);
    setOverrideForeground(Boolean(preset?.foreground));
    setForeground(preset?.foreground ?? swatches.foreground);
    setError("");
  }, [open, preset]);

  const changeBaseTheme = (key: ThemeKey) => {
    setBaseTheme(key);
    const swatches = themeSwatches(key);
    setAccent(swatches.accent);
    setBackground(swatches.background);
    setForeground(swatches.foreground);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give the preset a name so you can find it later.");
      return;
    }
    setError("");
    onSubmit({
      name: name.trim(),
      baseTheme,
      accent,
      background: overrideBackground ? background : null,
      foreground: overrideForeground ? foreground : null
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{preset ? "Edit preset" : "New theme preset"}</DialogTitle>
          <DialogDescription>
            A preset starts as its base theme and changes only what you override. Leave background and text inherited to
            keep the theme exactly as-is and just swap the accent.
          </DialogDescription>
        </DialogHeader>

        <form className="flex flex-col gap-4" onSubmit={submit}>
          <div className="flex flex-col gap-1.5">
            <Label>Name</Label>
            <Input
              autoFocus
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (error) setError("");
              }}
              placeholder="e.g. Light Amber"
              aria-invalid={Boolean(error)}
              className={error ? "border-destructive focus-visible:ring-destructive" : undefined}
            />
            {error && <span className="text-[11px] text-destructive">{error}</span>}
          </div>

          <div className="flex flex-col gap-1.5">
            <Label>Base theme</Label>
            <Select value={baseTheme} onValueChange={(v) => changeBaseTheme(v as ThemeKey)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {THEMES.map((t) => (
                  <SelectItem key={t.key} value={t.key}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <ColorField label="Accent" value={accent} onChange={setAccent} />

          <div className="flex flex-col gap-2 rounded-md border border-border-soft bg-sunken p-3">
            <label className="flex items-center gap-2.5 text-[12.5px]">
              <Switch checked={overrideBackground} onCheckedChange={setOverrideBackground} />
              Override background &amp; surfaces
            </label>
            {overrideBackground ? (
              <ColorField label="Background" value={background} onChange={setBackground} />
            ) : (
              <span className="text-[11px] text-muted-foreground">
                Inheriting {THEMES.find((t) => t.key === baseTheme)?.label} backgrounds, cards and borders.
              </span>
            )}
          </div>

          <div className="flex flex-col gap-2 rounded-md border border-border-soft bg-sunken p-3">
            <label className="flex items-center gap-2.5 text-[12.5px]">
              <Switch checked={overrideForeground} onCheckedChange={setOverrideForeground} />
              Override text colour
            </label>
            {overrideForeground ? (
              <ColorField label="Text" value={foreground} onChange={setForeground} />
            ) : (
              <span className="text-[11px] text-muted-foreground">Inheriting the base theme's text colour.</span>
            )}
          </div>

          <PresetPreview
            baseTheme={baseTheme}
            background={overrideBackground ? background : null}
            accent={accent}
            foreground={overrideForeground ? foreground : null}
          />

          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {preset ? "Save changes" : "Create preset"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
