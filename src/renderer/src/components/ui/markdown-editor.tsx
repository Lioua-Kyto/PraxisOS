import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Eye, ImagePlus, Loader2, Pencil, RotateCw, Trash2 } from "lucide-react";
import { cn } from "../../lib/utils";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { toFileUrl } from "../../lib/fileUrl";
import {
  buildImageMarkdown,
  fileToDataUrl,
  imageFilesFromDataTransfer,
  parseImageAlt,
  removeImage,
  replaceImageMeta
} from "../../lib/noteImages";

function EditableImage({
  src,
  alt,
  onChange,
  onRemove
}: {
  src: string;
  alt: string;
  onChange?: (width: number | null, rotation: number) => void;
  onRemove?: () => void;
}) {
  const meta = parseImageAlt(alt ?? "");
  const [selected, setSelected] = useState(false);
  const editable = Boolean(onChange);
  // A rotated image's on-screen footprint swaps width/height at 90°/270°, so
  // reserve vertical room to stop it overlapping the text below it.
  const quarterTurned = meta.rotation === 90 || meta.rotation === 270;

  return (
    <span className="my-2 block">
      <span
        className={cn(
          "inline-block max-w-full overflow-hidden rounded-md border transition-colors",
          selected && editable ? "border-primary" : "border-border-soft"
        )}
        style={quarterTurned && meta.width ? { paddingBlock: meta.width * 0.5 } : undefined}
      >
        <img
          src={src}
          alt={meta.label}
          onClick={() => editable && setSelected((s) => !s)}
          className={cn("block max-w-full", editable && "cursor-pointer")}
          style={{
            width: meta.width ? `${meta.width}px` : undefined,
            transform: meta.rotation ? `rotate(${meta.rotation}deg)` : undefined
          }}
        />
      </span>

      {editable && selected && (
        <span className="mt-1.5 flex flex-wrap items-center gap-2 rounded-md border border-border-soft bg-sunken px-2.5 py-1.5">
          <span className="text-[10.5px] uppercase tracking-wide text-muted-foreground">Width</span>
          <input
            type="range"
            min={120}
            max={1000}
            step={20}
            value={meta.width ?? 480}
            onChange={(e) => onChange?.(Number(e.target.value), meta.rotation)}
            className="h-1 w-40 cursor-pointer"
          />
          <span className="tabular w-12 text-[11px] text-muted-foreground">{meta.width ?? "auto"}</span>
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="h-6 px-2"
            onClick={() => onChange?.(meta.width, (meta.rotation + 90) % 360)}
          >
            <RotateCw className="h-3 w-3" /> {meta.rotation}°
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-6 px-2" onClick={() => onChange?.(null, 0)}>
            Reset
          </Button>
          <Button type="button" size="sm" variant="ghost" className="h-6 px-2 text-destructive" onClick={onRemove}>
            <Trash2 className="h-3 w-3" /> Remove
          </Button>
        </span>
      )}
    </span>
  );
}

export function MarkdownEditor({
  value,
  onChange,
  onBlur,
  onCommit,
  placeholder,
  minHeight = 140,
  enableImages = false
}: {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  /**
   * Called for edits that don't end in a blur — image insert/resize/rotate/
   * remove — so those persist without saving on every keystroke.
   */
  onCommit?: (value: string) => void;
  placeholder?: string;
  minHeight?: number;
  enableImages?: boolean;
}) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const insertImages = async (files: File[]) => {
    if (!files.length) return;
    setBusy(true);
    try {
      const snippets: string[] = [];
      for (const file of files) {
        const dataUrl = await fileToDataUrl(file);
        const savedPath = await window.api.notes.saveImage(dataUrl, file.name.replace(/\.[^.]+$/, ""));
        snippets.push(buildImageMarkdown(toFileUrl(savedPath), { label: file.name, width: 480, rotation: 0 }));
      }
      const separator = value && !value.endsWith("\n") ? "\n\n" : "";
      commit(`${value}${separator}${snippets.join("\n\n")}\n`);
    } finally {
      setBusy(false);
    }
  };

  const commit = (next: string) => {
    onChange(next);
    onCommit?.(next);
  };

  const updateImage = (src: string, width: number | null, rotation: number) => {
    commit(replaceImageMeta(value, src, { width, rotation }));
  };

  return (
    <div className="rounded-md border border-border-soft bg-sunken">
      <div className="flex items-center justify-between gap-1 border-b border-border-soft p-1.5">
        <div className="flex items-center gap-1">
          {enableImages && (
            <>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className="h-6 gap-1 px-2"
                onClick={() => fileInputRef.current?.click()}
                disabled={busy}
              >
                {busy ? <Loader2 className="h-3 w-3 animate-spin" /> : <ImagePlus className="h-3 w-3" />}
                <span className="text-[11px]">Image</span>
              </Button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                hidden
                onChange={(e) => {
                  void insertImages(Array.from(e.target.files ?? []));
                  e.target.value = "";
                }}
              />
              <span className="text-[10.5px] text-muted-foreground">or paste / drop</span>
            </>
          )}
        </div>
        <div className="flex items-center gap-1">
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
      </div>

      {mode === "edit" ? (
        <Textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          onPaste={
            enableImages
              ? (e) => {
                  const files = imageFilesFromDataTransfer(e.clipboardData);
                  if (files.length) {
                    e.preventDefault();
                    void insertImages(files);
                  }
                }
              : undefined
          }
          onDrop={
            enableImages
              ? (e) => {
                  const files = imageFilesFromDataTransfer(e.dataTransfer);
                  if (files.length) {
                    e.preventDefault();
                    void insertImages(files);
                  }
                }
              : undefined
          }
          placeholder={placeholder}
          className={cn("resize-y rounded-none border-none bg-transparent shadow-none focus-visible:ring-0")}
          style={{ minHeight }}
        />
      ) : (
        <div className="prose prose-sm max-w-none p-3" style={{ minHeight }}>
          {value.trim() ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                img: ({ src, alt }) => (
                  <EditableImage
                    src={String(src ?? "")}
                    alt={String(alt ?? "")}
                    onChange={enableImages ? (w, r) => updateImage(String(src ?? ""), w, r) : undefined}
                    onRemove={enableImages ? () => commit(removeImage(value, String(src ?? ""))) : undefined}
                  />
                )
              }}
            >
              {value}
            </ReactMarkdown>
          ) : (
            <span className="text-sm text-muted-foreground">Nothing written yet.</span>
          )}
        </div>
      )}
    </div>
  );
}
