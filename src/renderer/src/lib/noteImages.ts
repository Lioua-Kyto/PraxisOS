// Note images are stored on disk and referenced from the markdown body, so
// note content stays small, plain text. Sizing/rotation ride along inside the
// alt text as `name|w=420|r=90` — that keeps the document valid markdown
// (any other viewer just sees an image) while giving the in-app renderer the
// transform metadata it needs.

export interface ImageMeta {
  label: string;
  width: number | null;
  rotation: number;
}

export function parseImageAlt(alt: string): ImageMeta {
  const [label = "", ...parts] = alt.split("|");
  let width: number | null = null;
  let rotation = 0;
  for (const part of parts) {
    const widthMatch = /^w=(\d+)$/.exec(part.trim());
    if (widthMatch) width = Number(widthMatch[1]);
    const rotationMatch = /^r=(-?\d+)$/.exec(part.trim());
    if (rotationMatch) rotation = ((Number(rotationMatch[1]) % 360) + 360) % 360;
  }
  return { label: label.trim(), width, rotation };
}

export function buildImageAlt({ label, width, rotation }: ImageMeta): string {
  const parts = [label || "image"];
  if (width) parts.push(`w=${Math.round(width)}`);
  if (rotation) parts.push(`r=${rotation}`);
  return parts.join("|");
}

export function buildImageMarkdown(src: string, meta: ImageMeta): string {
  return `![${buildImageAlt(meta)}](${src})`;
}

/**
 * Rewrites the markdown image whose source matches `src`, keeping its
 * existing label and leaving the rest of the document untouched. Used by the
 * inline resize/rotate controls.
 */
export function replaceImageMeta(
  content: string,
  src: string,
  update: { width: number | null; rotation: number }
): string {
  const escapedSrc = src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(`!\\[([^\\]]*)\\]\\(${escapedSrc}\\)`, "g");
  return content.replace(pattern, (_full, alt: string) =>
    buildImageMarkdown(src, { ...parseImageAlt(alt), ...update })
  );
}

export function removeImage(content: string, src: string): string {
  const escapedSrc = src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return content.replace(new RegExp(`!\\[[^\\]]*\\]\\(${escapedSrc}\\)\\n?`, "g"), "");
}

/** Pulls image files out of a paste/drop event. */
export function imageFilesFromDataTransfer(data: DataTransfer | null): File[] {
  if (!data) return [];
  return Array.from(data.files).filter((f) => f.type.startsWith("image/"));
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
