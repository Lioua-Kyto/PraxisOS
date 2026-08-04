import { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Eye, Pencil } from "lucide-react";
import { cn } from "../../lib/utils";
import { Textarea } from "./textarea";
import { Button } from "./button";

export function MarkdownEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  minHeight = 140
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minHeight?: number;
}) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");

  return (
    <div className="rounded-md border border-border-soft bg-sunken">
      <div className="flex items-center justify-end gap-1 border-b border-border-soft p-1.5">
        <Button
          type="button"
          size="sm"
          variant={mode === "edit" ? "secondary" : "ghost"}
          onClick={() => setMode("edit")}
          className="h-6 px-2"
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant={mode === "preview" ? "secondary" : "ghost"}
          onClick={() => setMode("preview")}
          className="h-6 px-2"
        >
          <Eye className="h-3 w-3" />
        </Button>
      </div>
      {mode === "edit" ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          className={cn("resize-y rounded-none border-none bg-transparent shadow-none focus-visible:ring-0")}
          style={{ minHeight }}
        />
      ) : (
        <div className="prose prose-sm max-w-none p-3" style={{ minHeight }}>
          {value.trim() ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
          ) : (
            <span className="text-sm text-muted-foreground">Nothing written yet.</span>
          )}
        </div>
      )}
    </div>
  );
}
