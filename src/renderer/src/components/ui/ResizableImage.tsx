import { useCallback, useRef, useState } from "react";
import Image from "@tiptap/extension-image";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { toMediaUrl } from "../../lib/fileUrl";

const MIN_WIDTH = 96;
const MAX_WIDTH = 1400;

/** Corners and side midpoints. All of them resize; none of them rotate. */
const HANDLES = [
  { key: "nw", axis: "x", sign: -1, className: "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nwse-resize" },
  { key: "ne", axis: "x", sign: 1, className: "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-nesw-resize" },
  { key: "se", axis: "x", sign: 1, className: "right-0 bottom-0 translate-x-1/2 translate-y-1/2 cursor-nwse-resize" },
  { key: "sw", axis: "x", sign: -1, className: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-nesw-resize" },
  { key: "e", axis: "x", sign: 1, className: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize" },
  { key: "w", axis: "x", sign: -1, className: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize" }
] as const;

function ResizableImageView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const src = String(node.attrs.src ?? "");
  const alt = String(node.attrs.alt ?? "");
  const width = node.attrs.width ? Number(node.attrs.width) : null;

  const imgRef = useRef<HTMLImageElement>(null);
  const [resizing, setResizing] = useState(false);
  const [liveWidth, setLiveWidth] = useState<number | null>(null);

  // `selected` is Tiptap's own NodeSelection state, so clicking anywhere else in
  // the document — blank space included — clears it and the handles vanish with
  // it. Nothing here tracks selection independently.
  const showHandles = editor.isEditable && selected;

  const startResize = useCallback(
    (sign: number, event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const img = imgRef.current;
      if (!img) return;

      const startX = event.clientX;
      const startWidth = img.getBoundingClientRect().width;

      setResizing(true);
      const move = (e: PointerEvent) => {
        // Width only: height follows from the intrinsic ratio because the image
        // is `h-auto`, so the aspect ratio is preserved by construction.
        const next = Math.round(
          Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + (e.clientX - startX) * sign))
        );
        setLiveWidth(next);
        img.style.width = `${next}px`;
      };
      const up = () => {
        setResizing(false);
        // Commit once, on release — a transaction per pointermove would flood
        // the editor history and make undo useless.
        const finalWidth = parseInt(img.style.width, 10);
        if (Number.isFinite(finalWidth)) updateAttributes({ width: finalWidth });
        setLiveWidth(null);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [updateAttributes]
  );

  return (
    <NodeViewWrapper
      as="div"
      // A block in the normal document flow: no absolute positioning, no
      // transform. `data-drag-handle` lets ProseMirror's native HTML5 drag pick
      // the whole node up and drop it between paragraphs.
      className="my-3"
      data-drag-handle
      draggable
    >
      <div className="relative inline-block max-w-full align-top">
        <img
          ref={imgRef}
          src={toMediaUrl(src)}
          alt={alt}
          draggable={false}
          style={{ width: width ? `${width}px` : undefined }}
          onLoad={(e) => {
            if (!width) updateAttributes({ width: Math.min(e.currentTarget.naturalWidth, 480) });
          }}
          className={
            "block h-auto max-w-full rounded-md " +
            (showHandles ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "")
          }
        />

        {showHandles &&
          HANDLES.map((handle) => (
            <span
              key={handle.key}
              role="presentation"
              title="Drag to resize"
              onPointerDown={(e) => startResize(handle.sign, e)}
              className={
                "absolute z-10 h-2.5 w-2.5 rounded-sm border border-background bg-primary " + handle.className
              }
            />
          ))}

        {resizing && liveWidth && (
          <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background">
            {liveWidth} px
          </span>
        )}
      </div>
    </NodeViewWrapper>
  );
}

/**
 * Image block.
 *
 * Deliberately plain: it sits in the document flow like a paragraph, is moved
 * by dragging the node between blocks (ProseMirror's native drag-and-drop), and
 * can only be resized. An earlier version supported free positioning and
 * rotation, which detached the image from the text around it and left its
 * handles on screen after the selection had moved elsewhere.
 */
export const ResizableImage = Image.extend({
  draggable: true,

  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: null,
        parseHTML: (el) => {
          const attr = el.getAttribute("width") ?? el.style.width;
          const parsed = parseInt(String(attr), 10);
          return Number.isFinite(parsed) ? parsed : null;
        },
        renderHTML: (attrs) => (attrs.width ? { width: String(attrs.width) } : {})
      }
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  }
});
