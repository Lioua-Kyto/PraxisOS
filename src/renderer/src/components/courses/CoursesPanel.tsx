import { useState } from "react";
import { BookOpen, Dumbbell, FolderGit2, GraduationCap, Sparkles } from "lucide-react";
import { PageHeader } from "../layout/PageHeader";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useAddCourse, useCourses, useRemoveCourse, useUpdateCourse } from "../../queries/courses";
import type { CourseKind, CourseStatus } from "@shared/types";

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

export function CoursesPanel() {
  const { data: courses = [] } = useCourses();
  const addCourse = useAddCourse();
  const updateCourse = useUpdateCourse();
  const removeCourse = useRemoveCourse();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    addCourse.mutate({ ...form, category: form.category.trim(), status: "planned" });
    setForm(emptyForm);
    setShowForm(false);
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
          <Button variant="outline" size="sm" className="mt-3.5" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "+ Add a learning item"}
          </Button>

          {showForm && (
            <form className="mt-4 grid grid-cols-2 gap-3" onSubmit={submit}>
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
                <Input
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  placeholder="e.g. Backend, Design, Spanish"
                />
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
              <Button type="submit" className="col-span-2">
                Save
              </Button>
            </form>
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
                  <div key={c.id} className="flex items-center justify-between border-b border-border-soft py-2.5 last:border-none">
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
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => removeCourse.mutate(c.id)}>
                        ✕
                      </Button>
                    </div>
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
