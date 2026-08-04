import { useState } from "react";
import { PageHeader } from "../layout/PageHeader";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../ui/select";
import { useAddCourse, useCourses, useRemoveCourse, useUpdateCourse } from "../../queries/courses";
import type { CourseStatus } from "@shared/types";

const PHASES: Record<number, string> = {
  1: "1 · Cloud & DevOps",
  2: "2 · System Design & DSA",
  3: "3 · Frontend Depth (TS/Next.js)",
  4: "4 · Full Software Engineering",
  5: "5 · AI Engineering (future)"
};

const STATUSES: CourseStatus[] = ["planned", "in_progress", "completed"];
const STATUS_VARIANT: Record<CourseStatus, "secondary" | "warning" | "success"> = {
  planned: "secondary",
  in_progress: "warning",
  completed: "success"
};

export function CoursesPanel() {
  const { data: courses = [] } = useCourses();
  const addCourse = useAddCourse();
  const updateCourse = useUpdateCourse();
  const removeCourse = useRemoveCourse();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", provider: "", category: "", phase: 1, url: "", notes: "" });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    addCourse.mutate({ ...form, status: "planned" });
    setForm({ title: "", provider: "", category: "", phase: 1, url: "", notes: "" });
    setShowForm(false);
  };

  const grouped = Object.keys(PHASES).map((p) => ({ phase: Number(p), items: courses.filter((c) => c.phase === Number(p)) }));
  const completed = courses.filter((c) => c.status === "completed").length;

  return (
    <div>
      <PageHeader kicker="Coursera roadmap" title="Courses" />

      <Card className="mb-5">
        <CardContent className="pt-5">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Overall progress</h3>
            <span className="text-xs text-muted-foreground">
              {completed}/{courses.length} completed
            </span>
          </div>
          <Progress value={courses.length ? (completed / courses.length) * 100 : 0} />
          <Button variant="outline" size="sm" className="mt-3.5" onClick={() => setShowForm((s) => !s)}>
            {showForm ? "Cancel" : "+ Add a course"}
          </Button>

          {showForm && (
            <form className="mt-4 grid grid-cols-2 gap-3" onSubmit={submit}>
              <div className="flex flex-col gap-1.5">
                <Label>Title</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Provider</Label>
                <Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Category</Label>
                <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Phase</Label>
                <Select value={String(form.phase)} onValueChange={(v) => setForm({ ...form, phase: Number(v) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PHASES).map(([k, v]) => (
                      <SelectItem key={k} value={k}>
                        {v}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>URL</Label>
                <Input value={form.url} onChange={(e) => setForm({ ...form, url: e.target.value })} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Notes</Label>
                <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
              <Button type="submit" className="col-span-2">
                Save course
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {grouped.map((g) => (
        <Card key={g.phase} className="mb-4">
          <CardContent className="pt-5">
            <h3 className="mb-1 font-display text-base">{PHASES[g.phase]}</h3>
            {g.items.length === 0 && <div className="py-2 text-sm text-muted-foreground">No courses in this phase yet.</div>}
            {g.items.map((c) => (
              <div key={c.id} className="flex items-center justify-between border-b border-border-soft py-2.5 last:border-none">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <strong className="text-[13px] font-medium">{c.title}</strong>
                    <Badge variant={STATUS_VARIANT[c.status]}>{c.status.replace("_", " ")}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {c.provider}
                    {c.category ? ` · ${c.category}` : ""}
                  </div>
                  {c.notes && <div className="mt-1 text-xs">{c.notes}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <Select value={c.status} onValueChange={(v) => updateCourse.mutate({ id: c.id, fields: { status: v as CourseStatus } })}>
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
            ))}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
