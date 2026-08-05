import { useState } from "react";
import { ArrowLeft, Trash2, X } from "lucide-react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Badge } from "../ui/badge";
import { MarkdownEditor } from "../ui/markdown-editor";
import { useRemoveNote, useUpdateNote } from "../../queries/notes";
import type { Note } from "@shared/types";

export function NoteEditor({ note, onBack }: { note: Note; onBack: () => void }) {
  const updateNote = useUpdateNote();
  const removeNote = useRemoveNote();
  const [title, setTitle] = useState(note.title);
  const [content, setContent] = useState(note.content);
  const [tags, setTags] = useState<string[]>(note.tags);
  const [tagDraft, setTagDraft] = useState("");

  const save = (fields: Partial<{ title: string; content: string; tags: string[] }>) => {
    updateNote.mutate({ id: note.id, fields });
  };

  const addTag = () => {
    const t = tagDraft.trim().toLowerCase();
    if (!t || tags.includes(t)) {
      setTagDraft("");
      return;
    }
    const next = [...tags, t];
    setTags(next);
    setTagDraft("");
    save({ tags: next });
  };

  const removeTag = (t: string) => {
    const next = tags.filter((x) => x !== t);
    setTags(next);
    save({ tags: next });
  };

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onBack}>
          <ArrowLeft className="h-3.5 w-3.5" /> Back
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="text-destructive"
          onClick={() => {
            removeNote.mutate(note.id);
            onBack();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
      </div>

      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onBlur={() => save({ title })}
        placeholder="Untitled note"
        className="mb-3 h-auto border-none bg-transparent px-0 font-display text-2xl shadow-none focus-visible:ring-0"
      />

      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {tags.map((t) => (
          <Badge key={t} variant="secondary" className="gap-1">
            {t}
            <button onClick={() => removeTag(t)} aria-label={`Remove tag ${t}`}>
              <X className="h-2.5 w-2.5" />
            </button>
          </Badge>
        ))}
        <div className="flex items-center gap-1">
          <Label className="sr-only">Add tag</Label>
          <Input
            value={tagDraft}
            onChange={(e) => setTagDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addTag();
              }
            }}
            onBlur={addTag}
            placeholder="+ tag"
            className="h-6 w-20 px-1.5 text-[11px]"
          />
        </div>
      </div>

      <MarkdownEditor
        value={content}
        onChange={setContent}
        onBlur={() => save({ content })}
        onCommit={(next) => {
          setContent(next);
          save({ content: next });
        }}
        placeholder="Write in markdown — links, snippets, code blocks… paste or drop images straight in."
        minHeight={360}
        enableImages
        enableFormatting
      />
    </div>
  );
}
