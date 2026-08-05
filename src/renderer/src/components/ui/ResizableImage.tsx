import { useCallback, useEffect, useRef, useState } from "react";
import Image from "@tiptap/extension-image";
import { NodeViewWrapper, ReactNodeViewRenderer, type NodeViewProps } from "@tiptap/react";
import { toMediaUrl } from "../../lib/fileUrl";

const MIN_WIDTH = 64;
const MAX_WIDTH = 1600;

/** Which handle is being dragged. Edges resize, corners rotate. */
type EdgeHandle = "n" | "s" | "e" | "w";
type CornerHandle = "nw" | "ne" | "se" | "sw";

const EDGES: EdgeHandle[] = ["n", "s", "e", "w"];
const CORNERS: CornerHandle[] = ["nw", "ne", "se", "sw"];

const EDGE_STYLE: Record<EdgeHandle, string> = {
  n: "left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 cursor-ns-resize",
  s: "left-1/2 bottom-0 -translate-x-1/2 translate-y-1/2 cursor-ns-resize",
  e: "right-0 top-1/2 translate-x-1/2 -translate-y-1/2 cursor-ew-resize",
  w: "left-0 top-1/2 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize"
};

const CORNER_STYLE: Record<CornerHandle, string> = {
  nw: "left-0 top-0 -translate-x-1/2 -translate-y-1/2",
  ne: "right-0 top-0 translate-x-1/2 -translate-y-1/2",
  se: "right-0 bottom-0 translate-x-1/2 translate-y-1/2",
  sw: "left-0 bottom-0 -translate-x-1/2 translate-y-1/2"
};

function ResizableImageView({ node, updateAttributes, selected, editor }: NodeViewProps) {
  const src = String(node.attrs.src ?? "");
  const alt = String(node.attrs.alt ?? "");
  const width = node.attrs.width ? Number(node.attrs.width) : null;
  const rotation = Number(node.attrs.rotation ?? 0);

  const frameRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [dragging, setDragging] = useState<"resize" | "rotate" | null>(null);

  const editable = editor.isEditable;

  const startResize = useCallback(
    (edge: EdgeHandle, event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const img = imgRef.current;
      if (!img) return;

      const startX = event.clientX;
      const startY = event.clientY;
      const startWidth = img.getBoundingClientRect().width;
      // A rotated image's on-screen box no longer lines up with its own axes,
      // so project the pointer movement onto the image's rotated axis instead
      // of using raw dx/dy.
      const rad = (rotation * Math.PI) / 180;
      const axis =
        edge === "e" || edge === "w"
          ? { x: Math.cos(rad), y: Math.sin(rad) }
          : { x: -Math.sin(rad), y: Math.cos(rad) };
      const sign = edge === "e" || edge === "s" ? 1 : -1;
      const aspect = startWidth / Math.max(1, img.getBoundingClientRect().height);

      setDragging("resize");
      const move = (e: PointerEvent) => {
        const projected = (e.clientX - startX) * axis.x + (e.clientY - startY) * axis.y;
        const delta = projected * sign * (edge === "n" || edge === "s" ? aspect : 1);
        const next = Math.round(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, startWidth + delta)));
        updateAttributes({ width: next });
      };
      const up = () => {
        setDragging(null);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [rotation, updateAttributes]
  );

  const startRotate = useCallback(
    (event: React.PointerEvent) => {
      event.preventDefault();
      event.stopPropagation();
      const frame = frameRef.current;
      if (!frame) return;

      const box = frame.getBoundingClientRect();
      const cx = box.left + box.width / 2;
      const cy = box.top + box.height / 2;
      const pointerAngle = (e: { clientX: number; clientY: number }) =>
        (Math.atan2(e.clientY - cy, e.clientX - cx) * 180) / Math.PI;
      const offset = rotation - pointerAngle(event);

      setDragging("rotate");
      const move = (e: PointerEvent) => {
        let next = pointerAngle(e) + offset;
        // Shift snaps to 15° increments for anything that should look level.
        if (e.shiftKey) next = Math.round(next / 15) * 15;
        updateAttributes({ rotation: Math.round(((next % 360) + 360) % 360) });
      };
      const up = () => {
        setDragging(null);
        window.removeEventListener("pointermove", move);
        window.removeEventListener("pointerup", up);
      };
      window.addEventListener("pointermove", move);
      window.addEventListener("pointerup", up);
    },
    [rotation, updateAttributes]
  );

  // A rotated image's on-screen footprint swaps width and height at 90°/270°,
  // so reserve the space the rotated box actually occupies or it overlaps the
  // surrounding text.
  const [natural, setNatural] = useState({ w: 0, h: 0 });
  useEffect(() => {
    const img = imgRef.current;
    if (img?.complete && img.naturalWidth) setNatural({ w: img.naturalWidth, h: img.naturalHeight });
  }, [src]);

  const displayWidth = width ?? natural.w ?? 0;
  const displayHeight = natural.w ? (displayWidth * natural.h) / natural.w : 0;
  const rad = (rotation * Math.PI) / 180;
  const boxWidth = Math.abs(displayWidth * Math.cos(rad)) + Math.abs(displayHeight * Math.sin(rad));
  const boxHeight = Math.abs(displayWidth * Math.sin(rad)) + Math.abs(displayHeight * Math.cos(rad));

  const showHandles = editable && selected;

  return (
    <NodeViewWrapper
      as="div"
      className="relative my-2 flex justify-center"
      data-drag-handle
      style={{ height: rotation && boxHeight ? boxHeight : undefined }}
    >
      <div
        ref={frameRef}
        className="relative"
        style={{
          width: displayWidth || undefined,
          height: displayHeight || undefined,
          transform: rotation ? `rotate(${rotation}deg)` : undefined,
          top: rotation && boxHeight ? (boxHeight - displayHeight) / 2 : undefined,
          left: rotation && boxWidth ? 0 : undefined
        }}
      >
        <img
          ref={imgRef}
          src={toMediaUrl(src)}
          alt={alt}
          draggable={false}
          onLoad={(e) => {
            const el = e.currentTarget;
            setNatural({ w: el.naturalWidth, h: el.naturalHeight });
            if (!width) updateAttributes({ width: Math.min(el.naturalWidth, 480) });
          }}
          className={
            "block h-auto w-full select-none rounded-md " +
            (showHandles ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : "")
          }
        />

        {showHandles && (
          <>
            {EDGES.map((edge) => (
              <span
                key={edge}
                role="presentation"
                onPointerDown={(e) => startResize(edge, e)}
                className={
                  "absolute z-10 h-2.5 w-2.5 rounded-full border border-background bg-primary " +
                  EDGE_STYLE[edge]
                }
                title="Drag to resize"
              />
            ))}
            {CORNERS.map((corner) => (
              <span
                key={corner}
                role="presentation"
                onPointerDown={startRotate}
                className={
                  "absolute z-10 h-2.5 w-2.5 cursor-grab rounded-sm border border-background bg-foreground active:cursor-grabbing " +
                  CORNER_STYLE[corner]
                }
                title="Drag to rotate (hold Shift to snap)"
              />
            ))}
          </>
        )}
      </div>

      {showHandles && dragging && (
        <span className="pointer-events-none absolute -top-6 left-1/2 -translate-x-1/2 rounded bg-foreground px-1.5 py-0.5 text-[10px] font-medium text-background">
          {dragging === "resize" ? `${Math.round(displayWidth)} px` : `${rotation}°`}
        </span>
      )}
    </NodeViewWrapper>
  );
}

/**
 * Image node with direct manipulation: drag the node itself to move it in the
 * document, drag an edge to resize, drag a corner to rotate.
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
      },
      rotation: {
        default: 0,
        parseHTML: (el) => Number(el.getAttribute("data-rotation") ?? 0),
        renderHTML: (attrs) => (attrs.rotation ? { "data-rotation": String(attrs.rotation) } : {})
      }
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageView);
  }
});
