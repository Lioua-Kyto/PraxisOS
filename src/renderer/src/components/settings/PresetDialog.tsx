import { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { ColorField } from "../ui/color-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { THEMES } from "../../theme/themes";
import { derivePaletteOverrides } from "../../lib/color";
import type { NewThemePreset, ThemeKey, ThemePreset } from "@shared/types";

const themeDefaults = (key: ThemeKey) => {
  const theme = THEMES.find((t) => t.key === key) ?? THEMES[1];
  return { background: theme.dots[0], accent: theme.dots[1] };
};

/** Small live sample so the derived surface/text colors are visible before saving. */
function PresetPreview({ background, accent }: { background: string; accent: string }) {
  const vars = derivePaletteOverrides(background, accent) as Record<string, string>;
  const style = (name: string) => `hsl(${vars[name]})`;
  return (
    <div className="rounded-md border p-3" style={{ background: style("--background"), borderColor: style("--border") }}>
      <div className="mb-2 text-xs" style={{ color: style("--foreground") }}>
        Preview — card, text and accent
      </div>
      <div className="rounded-md p-2.5" style={{ background: style("--card"), border: `1px solid ${style("--border-soft")}` }}>
        <div className="text-[13px]" style={{ color: style("--card-foreground") }}>
          Sample surface
        </div>
        <div className="mt-1 text-[11px]" style={{ color: style("--muted-foreground") }}>
          Secondary text
        </div>
        <div
          className="mt-2 inline-block rounded px-2.5 py-1 text-[11px] font-semibold"
          style={{ background: style("--primary"), color: style("--primary-foreground") }}
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
  /** Existing preset to edit; omit to create a new one. */
  preset?: ThemePreset;
  onSubmit: (values: NewThemePreset) => void;
  isSubmitting?: boolean;
}) {
  const [name, setName] = useState("");
  const [baseTheme, setBaseTheme] = useState<ThemeKey>("dark");
  const [background, setBackground] = useState(themeDefaults("dark").background);
  const [accent, setAccent] = useState(themeDefaults("dark").accent);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    if (preset) {
      setName(preset.name);
      setBaseTheme(preset.baseTheme);
      setBackground(preset.background);
      setAccent(preset.accent);
    } else {
      setName("");
      setBaseTheme("dark");
      setBackground(themeDefaults("dark").background);
      setAccent(themeDefaults("dark").accent);
    }
    setError("");
  }, [open, preset]);

  // Picking a base theme seeds the pickers with that theme's own colors —
  // without this the base theme only contributed semantic colors, which is
  // why choosing one appeared to do nothing.
  const changeBaseTheme = (key: ThemeKey) => {
    setBaseTheme(key);
    const defaults = themeDefaults(key);
    setBackground(defaults.background);
    setAccent(defaults.accent);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Give the preset a name so you can find it later.");
      return;
    }
    setError("");
    onSubmit({ name: name.trim(), baseTheme, background, accent });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{preset ? "Edit preset" : "New theme preset"}</DialogTitle>
          <DialogDescription>
            The base theme supplies status colors (success, warning, error) and corner radius, and seeds the two colors below.
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
              placeholder="e.g. Late Night Amber"
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

          <div className="flex flex-wrap gap-4">
            <ColorField label="Background" value={background} onChange={setBackground} />
            <ColorField label="Accent" value={accent} onChange={setAccent} />
          </div>

          <PresetPreview background={background} accent={accent} />

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
