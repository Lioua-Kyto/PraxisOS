import { useState } from "react";
import { Check, Palette, Pencil, Plus, Trash2, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { useTheme } from "../../theme/ThemeProvider";
import { FONTS, THEMES } from "../../theme/themes";
import { useAddThemePreset, useRemoveThemePreset, useRenameThemePreset, useThemePresets } from "../../queries/themePresets";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { ColorField } from "../ui/color-input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";

export function ThemePicker() {
  const { theme, font, activePresetId, setTheme, setFont, applyPreset, clearPreset } = useTheme();
  const { data: presets = [] } = useThemePresets();
  const addPreset = useAddThemePreset();
  const renamePreset = useRenameThemePreset();
  const removePreset = useRemoveThemePreset();

  const [showCreate, setShowCreate] = useState(false);
  const [draft, setDraft] = useState({ name: "", baseTheme: theme, background: "#17140f", accent: "#cf7a3d" });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  const createPreset = async () => {
    if (!draft.name.trim()) return;
    const preset = await addPreset.mutateAsync(draft);
    applyPreset(preset.id);
    setShowCreate(false);
    setDraft({ name: "", baseTheme: theme, background: "#17140f", accent: "#cf7a3d" });
  };

  const saveRename = (id: number) => {
    if (editName.trim()) renamePreset.mutate({ id, name: editName.trim() });
    setEditingId(null);
  };

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
              !activePresetId && theme === t.key && "border-primary"
            )}
          >
            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {t.dots.map((d, i) => (
                  <span key={i} className="h-3 w-3 rounded-full border border-black/10" style={{ background: d }} />
                ))}
              </div>
              {!activePresetId && theme === t.key && <Check className="h-3 w-3 text-primary" />}
            </div>
            <div className="text-[11px]">{t.label}</div>
          </button>
        ))}
      </div>

      <div className="mt-6 mb-3 flex items-center justify-between">
        <div className="font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">Custom presets</div>
        <Button variant="ghost" size="sm" onClick={() => setShowCreate((s) => !s)}>
          {showCreate ? (
            "Cancel"
          ) : (
            <>
              <Plus className="h-3.5 w-3.5" /> New preset
            </>
          )}
        </Button>
      </div>

      {presets.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2.5">
          {presets.map((p) => (
            <div
              key={p.id}
              className={cn(
                "flex w-32 flex-col gap-2 rounded-md border border-border p-2.5 transition-colors",
                activePresetId === p.id && "border-primary"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: p.background }} />
                  <span className="h-3 w-3 rounded-full border border-black/10" style={{ background: p.accent }} />
                </div>
                {activePresetId === p.id && <Check className="h-3 w-3 text-primary" />}
              </div>
              {editingId === p.id ? (
                <div className="flex items-center gap-1">
                  <Input
                    autoFocus
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && saveRename(p.id)}
                    className="h-6 px-1.5 text-[11px]"
                  />
                  <button onClick={() => saveRename(p.id)} className="text-muted-foreground hover:text-foreground">
                    <Check className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button onClick={() => applyPreset(p.id)} className="text-left text-[11px] hover:text-primary">
                  {p.name}
                </button>
              )}
              <div className="flex items-center gap-2 text-muted-foreground">
                <button
                  onClick={() => {
                    setEditingId(p.id);
                    setEditName(p.name);
                  }}
                  className="hover:text-foreground"
                  title="Rename"
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  onClick={() => {
                    if (activePresetId === p.id) clearPreset();
                    removePreset.mutate(p.id);
                  }}
                  className="hover:text-destructive"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showCreate && (
        <div className="mb-4 flex flex-wrap items-end gap-4 rounded-md border border-border-soft bg-sunken p-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">Base theme</label>
            <Select value={draft.baseTheme} onValueChange={(v) => setDraft({ ...draft, baseTheme: v as typeof draft.baseTheme })}>
              <SelectTrigger className="w-36">
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
          <ColorField label="Background" value={draft.background} onChange={(v) => setDraft({ ...draft, background: v })} />
          <ColorField label="Accent" value={draft.accent} onChange={(v) => setDraft({ ...draft, accent: v })} />
          <div className="flex flex-col gap-1.5">
            <label className="text-[10.5px] font-medium uppercase tracking-wide text-muted-foreground">Name</label>
            <Input
              placeholder="e.g. Late Night Amber"
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="w-44"
            />
          </div>
          <Button onClick={createPreset} disabled={addPreset.isPending}>
            <Palette className="h-3.5 w-3.5" /> Save preset
          </Button>
        </div>
      )}

      {activePresetId && (
        <button
          onClick={clearPreset}
          className="mb-2 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" /> Clear custom preset, use built-in theme colors
        </button>
      )}

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
