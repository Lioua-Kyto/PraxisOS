import { useRef, useState } from "react";
import { BookOpen, Dumbbell, FolderGit2, GraduationCap, Pencil, Sparkles } from "lucide-react";
import { PageHeader } from "../layout/PageHeader";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { cn } from "../../lib/utils";
import { useAddCourse, useCourses, useRemoveCourse, useUpdateCourse } from "../../queries/courses";
import type { Course, CourseKind, CourseStatus } from "@shared/types";

const KIND_META: Record<CourseKind, { label: string; icon: typeof GraduationCap }> = {
  course: { label: "Course", icon: GraduationCap },
  book: { label: "Book", icon: BookOpen },
  project: { label: "Project", icon: FolderGit2 },
  practice: { label: "Practice", icon: Dumbbell },
  other: { label: "Other", icon: Sparkles }
};
const KINDS = Object.keys(KIND_META) as CourseKind[];

const STATUSES: CourseStatus[] = ["planned", "in_progress", "completed"];
const STATUS_VARIANT: Record<CourseStatus, "secondary" | "warning" | "success"> = {
  planned: "secondary",
  in_progress: "warning",
  completed: "success"
};

const UNGROUPED = "General";
const emptyForm = { title: "", kind: "course" as CourseKind, provider: "", category: "", url: "", notes: "" };
type ItemDraft = typeof emptyForm;

interface AreaOption {
  name: string;
  count: number;
}

/**
 * Skill-area field with the areas already in use one click away — the same
 * shape as the food picker in Nutrition. Click to see them all, type to filter,
 * and it stays free text, so a brand new area is simply typed in.
 *
 * Built here rather than with a datalist: the native popup is drawn by the
 * platform and ignores the app's theme entirely, which on a dark theme came
 * out as a black box.
 */
function AreaInput({
  value,
  onChange,
  options
}: {
  value: string;
  onChange: (value: string) => void;
  options: AreaOption[];
}) {
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const blurTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const query = value.trim().toLowerCase();
  const matches = (query ? options.filter((o) => o.name.toLowerCase().includes(query)) : options).slice(0, 8);

  const choose = (name: string) => {
    onChange(name);
    setOpen(false);
  };

  return (
    <div className="relative">
      <Input
        value={value}
        placeholder="e.g. Backend, Design, Spanish"
        autoComplete="off"
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setHighlight(0);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => {
          // Delay so a click on a suggestion lands before the list unmounts.
          blurTimer.current = setTimeout(() => setOpen(false), 120);
        }}
        onKeyDown={(e) => {
          if (!open || matches.length === 0) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setHighlight((h) => (h + 1) % matches.length);
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setHighlight((h) => (h - 1 + matches.length) % matches.length);
          } else if (e.key === "Enter" && matches[highlight]) {
            e.preventDefault();
            choose(matches[highlight].name);
          } else if (e.key === "Escape") {
            setOpen(false);
          }
        }}
      />

      {open && matches.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-64 w-full overflow-y-auto rounded-md border border-border-soft bg-popover p-1 shadow-lg">
          {matches.map((option, i) => (
            <button
              key={option.name}
              type="button"
              onMouseEnter={() => setHighlight(i)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                if (blurTimer.current) clearTimeout(blurTimer.current);
                choose(option.name);
              }}
              className={cn(
                "flex w-full items-center justify-between gap-3 rounded-sm px-2 py-1.5 text-left text-[13px]",
                i === highlight && "bg-accent text-accent-foreground"
              )}
            >
              <span className="min-w-0 truncate">{option.name}</span>
              <span className="tabular shrink-0 text-[11px] text-muted-foreground">
                {option.count} {option.count === 1 ? "item" : "items"}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

/** Shared by the add form at the top and the inline edit form on a row. */
function ItemForm({
  form,
  setForm,
  areaOptions,
  onSubmit,
  onCancel,
  submitLabel
}: {
  form: ItemDraft;
  setForm: (next: ItemDraft) => void;
  areaOptions: AreaOption[];
  onSubmit: (e: React.FormEvent) => void;
  onCancel?: () => void;
  submitLabel: string;
}) {
  return (
    <form className="mt-4 grid grid-cols-2 gap-3" onSubmit={onSubmit}>
      <div className="flex flex-col gap-1.5">
        <Label>Title</Label>
        <Input
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          placeholder="What you're learning or building"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Type</Label>
        <Select value={form.kind} onValueChange={(v) => setForm({ ...form, kind: v as CourseKind })}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {KINDS.map((k) => (
              <SelectItem key={k} value={k}>
                {KIND_META[k].label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Skill area</Label>
        <AreaInput value={form.category} onChange={(v) => setForm({ ...form, category: v })} options={areaOptions} />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Source</Label>
        <Input
          value={form.provider}
          onChange={(e) => setForm({ ...form, provider: e.target.value })}
          placeholder="Platform, author, repo…"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Link</Label>
        <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} placeholder="Optional" />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label>Notes</Label>
        <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Optional" />
      </div>
      <div className="col-span-2 flex gap-2">
        <Button type="submit" className="flex-1">
          {submitLabel}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  );
}

export function CoursesPanel() {
  const { data: courses = [] } = useCourses();
  const addCourse = useAddCourse();
  const updateCourse = useUpdateCourse();
  const removeCourse = useRemoveCourse();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<ItemDraft>(emptyForm);

  // Suggestions come from the areas the user has actually typed, so "General"
  // — the bucket for items with no area — is not offered as one to pick.
  const areaOptions: AreaOption[] = [...new Set(courses.map((c) => c.category?.trim()).filter((a): a is string => Boolean(a)))]
    .sort((a, b) => a.localeCompare(b))
    .map((name) => ({ name, count: courses.filter((c) => c.category?.trim() === name).length }));

  const startAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm((s) => !s);
  };

  const startEdit = (c: Course) => {
    setShowForm(false);
    setEditingId(c.id);
    setForm({
      title: c.title,
      kind: c.kind,
      provider: c.provider ?? "",
      category: c.category ?? "",
      url: c.url ?? "",
      notes: c.notes ?? ""
    });
  };

  const close = () => {
    setForm(emptyForm);
    setEditingId(null);
    setShowForm(false);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    const fields = { ...form, title: form.title.trim(), category: form.category.trim() };
    // Status stays out of the form — it's edited in place on the row, and
    // sending it here would knock an in-progress item back to planned.
    if (editingId === null) addCourse.mutate({ ...fields, status: "planned" });
    else updateCourse.mutate({ id: editingId, fields });
    close();
  };

  // Group by the user's own skill area rather than a fixed roadmap. Anything
  // without an area falls under "General", which sorts last.
  const areas = [...new Set(courses.map((c) => c.category?.trim() || UNGROUPED))].sort((a, b) =>
    a === UNGROUPED ? 1 : b === UNGROUPED ? -1 : a.localeCompare(b)
  );

  const active = courses.filter((c) => c.status !== "planned").length;
  const completed = courses.filter((c) => c.status === "completed").length;

  return (
    <div>
      <PageHeader
        title="Mastery"
        description="Everything you're doing to build skills — courses, books, projects and deliberate practice — grouped by area. It's about the skill, not just finishing the material."
      />

      <Card className="mb-5">
        <CardContent className="pt-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Progress</h3>
            <span className="text-xs text-muted-foreground">
              {active} in progress or done · {completed} completed of {courses.length}
            </span>
          </div>
          <Progress value={courses.length ? (completed / courses.length) * 100 : 0} />
          <Button variant="outline" size="sm" className="mt-3.5" onClick={startAdd}>
            {showForm ? "Cancel" : "+ Add a learning item"}
          </Button>

          {showForm && (
            <ItemForm form={form} setForm={setForm} areaOptions={areaOptions} onSubmit={submit} submitLabel="Save" />
          )}
        </CardContent>
      </Card>

      {courses.length === 0 && (
        <Card>
          <CardContent className="py-8 text-center text-sm text-muted-foreground">
            Nothing here yet. Add a course, book, project or a practice habit to start tracking a skill.
          </CardContent>
        </Card>
      )}

      {areas.map((area) => {
        const items = courses.filter((c) => (c.category?.trim() || UNGROUPED) === area);
        return (
          <Card key={area} className="mb-4">
            <CardContent className="pt-5">
              <h3 className="mb-1 font-display text-base">{area}</h3>
              {items.map((c) => {
                const Icon = KIND_META[c.kind]?.icon ?? Sparkles;
                return (
                  <div key={c.id} className="border-b border-border-soft py-2.5 last:border-none">
                    <div className="flex items-center justify-between">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                          <strong className="truncate text-[13px] font-medium">{c.title}</strong>
                          <Badge variant={STATUS_VARIANT[c.status]}>{c.status.replace("_", " ")}</Badge>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {KIND_META[c.kind]?.label ?? "Item"}
                          {c.provider ? ` · ${c.provider}` : ""}
                        </div>
                        {c.notes && <div className="mt-1 text-xs">{c.notes}</div>}
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <Select
                          value={c.status}
                          onValueChange={(v) => updateCourse.mutate({ id: c.id, fields: { status: v as CourseStatus } })}
                        >
                          <SelectTrigger className="w-[130px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUSES.map((s) => (
                              <SelectItem key={s} value={s}>
                                {s.replace("_", " ")}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button
                          size="sm"
                          variant="ghost"
                          aria-label={editingId === c.id ? "Close editor" : "Edit item"}
                          onClick={() => (editingId === c.id ? close() : startEdit(c))}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeCourse.mutate(c.id)}>
                          ✕
                        </Button>
                      </div>
                    </div>

                    {editingId === c.id && (
                      <ItemForm
                        form={form}
                        setForm={setForm}
                        areaOptions={areaOptions}
                        onSubmit={submit}
                        onCancel={close}
                        submitLabel="Save changes"
                      />
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
