import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { PageHeader } from "../layout/PageHeader";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Badge } from "../ui/badge";
import { NoteEditor } from "./NoteEditor";
import { useAddNote, useNoteSearch, useNotes } from "../../queries/notes";

export function NotesPanel() {
  const { data: notes = [] } = useNotes();
  const addNote = useAddNote();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);

  // Tag chips come from the full set so they don't vanish while searching.
  const allTags = useMemo(() => [...new Set(notes.flatMap((n) => n.tags))].sort(), [notes]);

  // Search runs in SQLite (FTS5, relevance-ranked); tag filtering stays local
  // since it's a cheap set membership test on the already-fetched rows.
  const { data: searchResults } = useNoteSearch(search.trim());
  const base = search.trim() ? (searchResults ?? []) : notes;
  const filtered = activeTag ? base.filter((n) => n.tags.includes(activeTag)) : base;

  const selected = notes.find((n) => n.id === selectedId) ?? null;

  const createNote = async () => {
    const note = await addNote.mutateAsync({ title: "Untitled note", content: "", tags: [] });
    setSelectedId(note.id);
  };

  if (selected) {
    return (
      <div>
        <PageHeader kicker="Quick capture" title="Knowledge Base" />
        <NoteEditor key={selected.id} note={selected} onBack={() => setSelectedId(null)} />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        kicker="Quick capture"
        title="Knowledge Base"
        action={
          <Button onClick={createNote} disabled={addNote.isPending}>
            <Plus className="h-3.5 w-3.5" /> New note
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title, content, tags…" className="pl-8" />
        </div>
      </div>

      {allTags.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-1.5">
          <Badge variant={activeTag === null ? "default" : "outline"} className="cursor-pointer" onClick={() => setActiveTag(null)}>
            All
          </Badge>
          {allTags.map((t) => (
            <Badge key={t} variant={activeTag === t ? "default" : "outline"} className="cursor-pointer" onClick={() => setActiveTag(t === activeTag ? null : t)}>
              {t}
            </Badge>
          ))}
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        {filtered.map((n) => (
          <Card key={n.id} className="cursor-pointer transition-colors hover:border-primary/50" onClick={() => setSelectedId(n.id)}>
            <CardContent className="pt-5">
              <div className="mb-1.5 truncate font-display text-base">{n.title || "Untitled note"}</div>
              <div className="mb-2 line-clamp-3 text-xs text-muted-foreground">{n.content || "No content yet."}</div>
              <div className="flex flex-wrap gap-1">
                {n.tags.map((t) => (
                  <Badge key={t} variant="secondary">
                    {t}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 py-10 text-center text-sm text-muted-foreground">
            {notes.length === 0 ? "No notes yet — capture your first thought." : "No notes match your search."}
          </div>
        )}
      </div>
    </div>
  );
}
