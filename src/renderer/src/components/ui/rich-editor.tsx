import { useCallback, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import TextStyle from "@tiptap/extension-text-style";
import Color from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import {
  Bold,
  Code,
  Heading1,
  Heading2,
  Highlighter,
  ImagePlus,
  Italic,
  Link2,
  List,
  ListOrdered,
  Loader2,
  Palette,
  Quote,
  Strikethrough
} from "lucide-react";
import { cn } from "../../lib/utils";
import { ResizableImage } from "./ResizableImage";
import { fileToDataUrl, imageFilesFromDataTransfer } from "../../lib/noteImages";
import { legacyMarkdownToHtml, looksLikeHtml } from "../../lib/legacyMarkdown";

const TEXT_COLORS = ["#e0483d", "#d98324", "#c9a227", "#3d8a52", "#2f7fb8", "#7a5cc4", "#8a8a8a"];
const HIGHLIGHTS = ["#fff3a3", "#c8f2c2", "#c5e4ff", "#f7c9e3", "#ffd8b0"];

function ToolbarButton({
  label,
  active,
  onClick,
  children
}: {
  label: string;
  active?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={active}
      // Keeps focus (and therefore the selection) inside the editor.
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        "rounded p-1 transition-colors hover:bg-accent hover:text-foreground",
        active ? "bg-accent text-foreground" : "text-muted-foreground"
      )}
    >
      {children}
    </button>
  );
}

function SwatchMenu({
  label,
  icon,
  colors,
  onPick,
  onClear
}: {
  label: string;
  icon: React.ReactNode;
  colors: string[];
  onPick: (color: string) => void;
  onClear: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative">
      <ToolbarButton label={label} onClick={() => setOpen((o) => !o)}>
        {icon}
      </ToolbarButton>
      {open && (
        <span className="absolute left-0 top-full z-50 mt-1 flex items-center gap-1 rounded-md border border-border-soft bg-popover p-1.5 shadow-lg">
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
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              onClear();
              setOpen(false);
            }}
            className="ml-0.5 rounded px-1.5 py-0.5 text-[10.5px] text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            None
          </button>
        </span>
      )}
    </span>
  );
}

function Toolbar({
  editor,
  enableImages,
  busy,
  onPickImage
}: {
  editor: Editor;
  enableImages: boolean;
  busy: boolean;
  onPickImage: () => void;
}) {
  const setLink = () => {
    const previous = String(editor.getAttributes("link").href ?? "");
    const url = window.prompt("Link URL", previous);
    if (url === null) return;
    if (!url.trim()) {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url.trim() }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border-soft px-2 py-1.5">
      <ToolbarButton label="Bold" active={editor.isActive("bold")} onClick={() => editor.chain().focus().toggleBold().run()}>
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Italic" active={editor.isActive("italic")} onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Strikethrough"
        active={editor.isActive("strike")}
        onClick={() => editor.chain().focus().toggleStrike().run()}
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Code" active={editor.isActive("code")} onClick={() => editor.chain().focus().toggleCode().run()}>
        <Code className="h-3.5 w-3.5" />
      </ToolbarButton>

      <span className="mx-1 h-4 w-px bg-border-soft" />

      <ToolbarButton
        label="Heading 1"
        active={editor.isActive("heading", { level: 1 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      >
        <Heading1 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Heading 2"
        active={editor.isActive("heading", { level: 2 })}
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      >
        <Heading2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Bullet list"
        active={editor.isActive("bulletList")}
        onClick={() => editor.chain().focus().toggleBulletList().run()}
      >
        <List className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Numbered list"
        active={editor.isActive("orderedList")}
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        label="Quote"
        active={editor.isActive("blockquote")}
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
      >
        <Quote className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton label="Link" active={editor.isActive("link")} onClick={setLink}>
        <Link2 className="h-3.5 w-3.5" />
      </ToolbarButton>

      <span className="mx-1 h-4 w-px bg-border-soft" />

      <SwatchMenu
        label="Text colour"
        icon={<Palette className="h-3.5 w-3.5" />}
        colors={TEXT_COLORS}
        onPick={(c) => editor.chain().focus().setColor(c).run()}
        onClear={() => editor.chain().focus().unsetColor().run()}
      />
      <SwatchMenu
        label="Highlight"
        icon={<Highlighter className="h-3.5 w-3.5" />}
        colors={HIGHLIGHTS}
        onPick={(c) => editor.chain().focus().setHighlight({ color: c }).run()}
        onClear={() => editor.chain().focus().unsetHighlight().run()}
      />

      {enableImages && (
        <>
          <span className="mx-1 h-4 w-px bg-border-soft" />
          <ToolbarButton label="Insert image" onClick={onPickImage}>
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
          </ToolbarButton>
          <span className="ml-0.5 text-[10.5px] text-muted-foreground">or paste / drop</span>
        </>
      )}
    </div>
  );
}

/**
 * Single-mode rich text editor. What you see while writing is what the note
 * looks like — there is no separate preview, so formatting and images are never
 * shown as their own source.
 *
 * Content is stored as HTML. Notes written before this editor existed are
 * markdown; they're converted on load (see legacyMarkdown.ts).
 */
export function RichEditor({
  value,
  onChange,
  onBlur,
  placeholder,
  minHeight = 140,
  enableImages = false,
  className
}: {
  value: string;
  onChange: (html: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  minHeight?: number;
  enableImages?: boolean;
  className?: string;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  // Guards the value → editor sync so our own edits don't round-trip back in
  // and reset the cursor to the start of the document on every keystroke.
  const lastEmitted = useRef<string | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: { levels: [1, 2, 3] } }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder: placeholder ?? "" }),
      ResizableImage.configure({ inline: false, allowBase64: false })
    ],
    content: looksLikeHtml(value) ? value : legacyMarkdownToHtml(value),
    editorProps: {
      attributes: {
        class: "prose prose-sm max-w-none px-3 py-2.5 focus:outline-none",
        style: `min-height:${minHeight}px`
      }
    },
    onUpdate: ({ editor: e }) => {
      const html = e.isEmpty ? "" : e.getHTML();
      lastEmitted.current = html;
      onChange(html);
    },
    onBlur: () => onBlur?.()
  });

  // Reflect external changes (switching notes, switching journal dates) without
  // clobbering what the user is typing.
  useEffect(() => {
    if (!editor) return;
    if (value === lastEmitted.current) return;
    const next = looksLikeHtml(value) ? value : legacyMarkdownToHtml(value);
    if (next === editor.getHTML()) return;
    editor.commands.setContent(next, false);
  }, [value, editor]);

  const insertImages = useCallback(
    async (files: File[]) => {
      if (!editor || !files.length) return;
      setBusy(true);
      try {
        for (const file of files) {
          const dataUrl = await fileToDataUrl(file);
          const savedPath = await window.api.notes.saveImage(dataUrl, file.name.replace(/\.[^.]+$/, ""));
          editor.chain().focus().setImage({ src: savedPath, alt: file.name }).run();
        }
      } finally {
        setBusy(false);
      }
    },
    [editor]
  );

  if (!editor) return null;

  return (
    <div className={cn("overflow-hidden rounded-md border border-input bg-background", className)}>
      <Toolbar
        editor={editor}
        enableImages={enableImages}
        busy={busy}
        onPickImage={() => fileInputRef.current?.click()}
      />

      {enableImages && (
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
      )}

      <div
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
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
