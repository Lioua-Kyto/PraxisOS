const MEDIA_SCHEME = "praxis-media";

/**
 * Builds a URL the renderer can actually load for a file in the app's media
 * directory.
 *
 * Raw `file://` URLs don't work here: in dev the renderer is served over
 * http://localhost and Chromium refuses to load file:// subresources from an
 * http:// page, which is why attached videos rendered as a black player that
 * never started. The custom scheme (see src/main/mediaProtocol.ts) works
 * identically in dev and production and supports the range requests <video>
 * needs to seek.
 *
 * Accepts an absolute path, a legacy `file://…` URL, or a bare filename —
 * only the basename is used, since all media lives in one directory.
 */
export function toMediaUrl(pathOrUrl: string): string {
  if (!pathOrUrl) return "";
  if (pathOrUrl.startsWith(`${MEDIA_SCHEME}://`)) return pathOrUrl;

  let value = pathOrUrl;
  if (value.startsWith("file://")) {
    try {
      value = decodeURIComponent(new URL(value).pathname);
    } catch {
      value = decodeURIComponent(value.replace(/^file:\/+/, "/"));
    }
  }

  const basename = value.replace(/\\/g, "/").split("/").filter(Boolean).pop() ?? "";
  return `${MEDIA_SCHEME}://f/${encodeURIComponent(basename)}`;
}

/** @deprecated kept as an alias so older call sites keep compiling. */
export const toFileUrl = toMediaUrl;
