import { useState } from "react";
import { Check, Pencil, Plus, Trash2, X } from "lucide-react";
import { cn } from "../../lib/utils";
import { useTheme } from "../../theme/ThemeProvider";
import { FONTS, THEMES } from "../../theme/themes";
import { useAddThemePreset, useRemoveThemePreset, useThemePresets, useUpdateThemePreset } from "../../queries/themePresets";
import { Button } from "../ui/button";
import { PresetDialog } from "./PresetDialog";
import type { NewThemePreset, ThemePreset } from "@shared/types";

export function ThemePicker() {
  const { theme, font, activePresetId, setTheme, setFont, applyPreset, clearPreset } = useTheme();
  const { data: presets = [] } = useThemePresets();
  const addPreset = useAddThemePreset();
  const updatePreset = useUpdateThemePreset();
  const removePreset = useRemoveThemePreset();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ThemePreset | undefined>(undefined);

  const openCreate = () => {
    setEditing(undefined);
    setDialogOpen(true);
  };

  const openEdit = (preset: ThemePreset) => {
    setEditing(preset);
    setDialogOpen(true);
  };

  const submit = async (values: NewThemePreset) => {
    if (editing) {
      await updatePreset.mutateAsync({ id: editing.id, fields: values });
      if (activePresetId === editing.id) applyPreset(editing.id);
    } else {
      const created = await addPreset.mutateAsync(values);
      applyPreset(created.id);
    }
    setDialogOpen(false);
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

      <div className="mb-3 mt-6 flex items-center justify-between">
        <div className="font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">Custom presets</div>
        <Button variant="ghost" size="sm" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" /> New preset
        </Button>
      </div>

      {presets.length > 0 ? (
        <div className="flex flex-wrap gap-2.5">
          {presets.map((p) => (
            <div
              key={p.id}
              className={cn(
                "flex w-36 flex-col gap-2 rounded-md border border-border p-2.5 transition-colors",
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
              <button onClick={() => applyPreset(p.id)} className="truncate text-left text-[11px] hover:text-primary" title={p.name}>
                {p.name}
              </button>
              <div className="flex items-center justify-between">
                <span className="text-[9.5px] uppercase tracking-wide text-muted-foreground">{p.baseTheme}</span>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <button onClick={() => openEdit(p)} className="hover:text-foreground" title="Edit preset">
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button
                    onClick={() => {
                      if (activePresetId === p.id) clearPreset();
                      removePreset.mutate(p.id);
                    }}
                    className="hover:text-destructive"
                    title="Delete preset"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">
          No custom presets yet — create one to pick your own background and accent colors.
        </div>
      )}

      {activePresetId && (
        <button
          onClick={clearPreset}
          className="mt-3 flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground"
        >
          <X className="h-3 w-3" /> Clear custom preset, use built-in theme colors
        </button>
      )}

      <PresetDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        preset={editing}
        onSubmit={submit}
        isSubmitting={addPreset.isPending || updatePreset.isPending}
      />

      <div className="mb-3 mt-6 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">Typography</div>
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
