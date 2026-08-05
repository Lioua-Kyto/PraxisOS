import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";
import {
  Bold,
  Code,
  Eye,
  Heading2,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Palette,
  Pencil,
  Quote,
  RotateCw,
  Strikethrough,
  Trash2
} from "lucide-react";
import { cn } from "../../lib/utils";
import { Textarea } from "./textarea";
import { Button } from "./button";
import { toMediaUrl } from "../../lib/fileUrl";
import {
  applyColor,
  applyHighlight,
  insertLink,
  togglePrefix,
  toggleWrap,
  type FormatResult,
  type Selection
} from "../../lib/markdownFormat";
import {
  buildImageMarkdown,
  fileToDataUrl,
  imageFilesFromDataTransfer,
  parseImageAlt,
  removeImage,
  replaceImageMeta
} from "../../lib/noteImages";

const TEXT_COLORS = ["#e5484d", "#f5a524", "#30a46c", "#0091ff", "#8e4ec6", "#687076"];
const HIGHLIGHTS = ["#fef08a", "#bbf7d0", "#bfdbfe", "#fbcfe8", "#e9d5ff"];

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
          // Legacy notes stored raw file:// URLs; normalise everything through
          // the media scheme so old and new content both load.
          src={toMediaUrl(src)}
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
            aria-label="Image width"
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

function ToolbarButton({
  label,
  onClick,
  children
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      // Keeps focus (and therefore the selection) in the textarea.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="rounded p-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
    >
      {children}
    </button>
  );
}

function SwatchMenu({
  label,
  icon,
  colors,
  onPick
}: {
  label: string;
  icon: React.ReactNode;
  colors: string[];
  onPick: (color: string) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative">
      <ToolbarButton label={label} onClick={() => setOpen((o) => !o)}>
        {icon}
      </ToolbarButton>
      {open && (
        <span className="absolute left-0 top-full z-50 mt-1 flex gap-1 rounded-md border border-border-soft bg-popover p-1.5 shadow-lg">
          {colors.map((c) => (
            <button
              key={c}
              type="button"
              aria-label={`${label} ${c}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => {
                onPick(c);
                setOpen(false);
              }}
              className="h-5 w-5 rounded border border-black/10 transition-transform hover:scale-110"
              style={{ background: c }}
            />
          ))}
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
  enableImages = false,
  enableFormatting = false
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
  enableFormatting?: boolean;
}) {
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [busy, setBusy] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const pendingSelection = useRef<Selection | null>(null);

  // Restore the selection after a formatting action so the user can keep
  // typing over what they just wrapped.
  useEffect(() => {
    const sel = pendingSelection.current;
    if (!sel || !textareaRef.current) return;
    pendingSelection.current = null;
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(sel.start, sel.end);
  }, [value]);

  const commit = (next: string) => {
    onChange(next);
    onCommit?.(next);
  };

  const runFormat = (fn: (value: string, sel: Selection) => FormatResult) => {
    const el = textareaRef.current;
    if (!el) return;
    const sel = { start: el.selectionStart, end: el.selectionEnd };
    const result = fn(value, sel);
    pendingSelection.current = result.selection;
    commit(result.value);
  };

  const insertImages = async (files: File[]) => {
    if (!files.length) return;
    setBusy(true);
    try {
      const snippets: string[] = [];
      for (const file of files) {
        const dataUrl = await fileToDataUrl(file);
        const savedPath = await window.api.notes.saveImage(dataUrl, file.name.replace(/\.[^.]+$/, ""));
        snippets.push(buildImageMarkdown(toMediaUrl(savedPath), { label: file.name, width: 480, rotation: 0 }));
      }
      const separator = value && !value.endsWith("\n") ? "\n\n" : "";
      commit(`${value}${separator}${snippets.join("\n\n")}\n`);
      // Drop straight into the rendered view — otherwise the only feedback is
      // a line of raw markdown, which reads like the paste failed.
      setMode("preview");
    } finally {
      setBusy(false);
    }
  };

  const updateImage = (src: string, width: number | null, rotation: number) => {
    commit(replaceImageMeta(value, src, { width, rotation }));
  };

  return (
    <div className="rounded-md border border-border-soft bg-sunken">
      <div className="flex flex-wrap items-center justify-between gap-1 border-b border-border-soft p-1.5">
        <div className="flex flex-wrap items-center gap-0.5">
          {enableFormatting && mode === "edit" && (
            <>
              <ToolbarButton label="Bold" onClick={() => runFormat((v, s) => toggleWrap(v, s, "**"))}>
                <Bold className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton label="Italic" onClick={() => runFormat((v, s) => toggleWrap(v, s, "*"))}>
                <Italic className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton label="Strikethrough" onClick={() => runFormat((v, s) => toggleWrap(v, s, "~~"))}>
                <Strikethrough className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton label="Inline code" onClick={() => runFormat((v, s) => toggleWrap(v, s, "`"))}>
                <Code className="h-3.5 w-3.5" />
              </ToolbarButton>

              <span className="mx-1 h-4 w-px bg-border-soft" />

              <ToolbarButton label="Heading" onClick={() => runFormat((v, s) => togglePrefix(v, s, "## "))}>
                <Heading2 className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton label="Bulleted list" onClick={() => runFormat((v, s) => togglePrefix(v, s, "- "))}>
                <List className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton label="Numbered list" onClick={() => runFormat((v, s) => togglePrefix(v, s, "1. "))}>
                <ListOrdered className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton label="Quote" onClick={() => runFormat((v, s) => togglePrefix(v, s, "> "))}>
                <Quote className="h-3.5 w-3.5" />
              </ToolbarButton>
              <ToolbarButton label="Link" onClick={() => runFormat(insertLink)}>
                <Link2 className="h-3.5 w-3.5" />
              </ToolbarButton>

              <span className="mx-1 h-4 w-px bg-border-soft" />

              <SwatchMenu
                label="Text colour"
                icon={<Palette className="h-3.5 w-3.5" />}
                colors={TEXT_COLORS}
                onPick={(c) => runFormat((v, s) => applyColor(v, s, c))}
              />
              <SwatchMenu
                label="Highlight"
                icon={<Highlighter className="h-3.5 w-3.5" />}
                colors={HIGHLIGHTS}
                onPick={(c) => runFormat((v, s) => applyHighlight(v, s, c))}
              />
            </>
          )}

          {enableImages && (
            <>
              {enableFormatting && mode === "edit" && <span className="mx-1 h-4 w-px bg-border-soft" />}
              <ToolbarButton label="Insert image" onClick={() => fileInputRef.current?.click()}>
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
              </ToolbarButton>
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
              <span className="ml-0.5 text-[10.5px] text-muted-foreground">or paste / drop</span>
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
            aria-label="Edit markdown"
            title="Edit"
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            type="button"
            size="sm"
            variant={mode === "preview" ? "secondary" : "ghost"}
            onClick={() => setMode("preview")}
            className="h-6 px-2"
            aria-label="Preview"
            title="Preview"
          >
            <Eye className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {mode === "edit" ? (
        <Textarea
          ref={textareaRef}
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
        <div
          className="prose prose-sm max-w-none p-3"
          style={{ minHeight }}
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
        >
          {value.trim() ? (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              // Colour/highlight are emitted as inline HTML, which react-markdown
              // strips without this. Content is local and user-authored.
              rehypePlugins={[rehypeRaw]}
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
