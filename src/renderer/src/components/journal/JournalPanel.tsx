import { useEffect, useRef, useState } from "react";
import { PageHeader } from "../layout/PageHeader";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { MarkdownEditor } from "../ui/markdown-editor";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Trash2 } from "lucide-react";
import { useAddBrainDump, useBrainDumps, useJournalEntry, useRemoveBrainDump, useSaveJournalEntry } from "../../queries/journal";

const today = () => new Date().toISOString().slice(0, 10);

function JournalForDate({ date }: { date: string }) {
  const { data: entry } = useJournalEntry(date);
  const save = useSaveJournalEntry(date);
  const { data: dumps = [] } = useBrainDumps(date);
  const addDump = useAddBrainDump(date);
  const removeDump = useRemoveBrainDump(date);

  const [morning, setMorning] = useState("");
  const [evening, setEvening] = useState("");
  const [dumpDraft, setDumpDraft] = useState("");
  const hydrated = useRef(false);

  // Seed local edit buffers the first time the query for this date resolves
  // (the component remounts per-date via `key` in the parent, so this fires
  // once per date — not on every background refetch, which would otherwise
  // clobber in-progress typing with the last-saved value).
  useEffect(() => {
    if (entry !== undefined && !hydrated.current) {
      hydrated.current = true;
      setMorning(entry?.morningIntentions ?? "");
      setEvening(entry?.eveningReflection ?? "");
    }
  }, [entry]);

  const submitDump = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dumpDraft.trim()) return;
    addDump.mutate(dumpDraft.trim());
    setDumpDraft("");
  };

  return (
    <div>
      <div className="mb-5 grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-5">
            <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Morning intentions</h3>
            <MarkdownEditor
              value={morning}
              onChange={setMorning}
              onBlur={() => save.mutate({ morningIntentions: morning })}
              placeholder="What matters today? What does a good version of today look like?"
            />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Evening reflection</h3>
            <MarkdownEditor
              value={evening}
              onChange={setEvening}
              onBlur={() => save.mutate({ eveningReflection: evening })}
              placeholder="What actually happened? What would you change?"
            />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-5">
          <h3 className="mb-3 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">Brain dumps</h3>
          <form className="mb-4 flex items-start gap-2" onSubmit={submitDump}>
            <Textarea
              value={dumpDraft}
              onChange={(e) => setDumpDraft(e.target.value)}
              placeholder="Quick thought, worry, or idea — get it out of your head."
              className="min-h-16"
            />
            <Button type="submit" disabled={addDump.isPending}>
              Add
            </Button>
          </form>
          <div className="flex flex-col gap-2">
            {dumps.map((d) => (
              <div key={d.id} className="flex items-start justify-between gap-3 rounded-md bg-sunken p-3">
                <div className="prose prose-sm max-w-none text-[13px]">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{d.content}</ReactMarkdown>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-[10px] text-muted-foreground">{d.createdAt.slice(11, 16)}</span>
                  <button onClick={() => removeDump.mutate(d.id)} className="text-muted-foreground hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
            {dumps.length === 0 && <div className="text-xs text-muted-foreground">No brain dumps logged for this day.</div>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function JournalPanel() {
  const [date, setDate] = useState(today());

  return (
    <div>
      <PageHeader
        kicker="Reflect & reset"
        title="Daily Log"
        action={
          <div className="flex items-center gap-2">
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-40" />
            {date !== today() && (
              <Button variant="outline" size="sm" onClick={() => setDate(today())}>
                Today
              </Button>
            )}
          </div>
        }
      />
      <JournalForDate key={date} date={date} />
    </div>
  );
}
