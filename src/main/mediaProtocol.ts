import { net, protocol } from "electron";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { getMediaDir } from "./db/client";

export const MEDIA_SCHEME = "praxis-media";

/**
 * Media (exercise videos, note images) is served over a custom scheme rather
 * than raw file:// URLs.
 *
 * Two reasons file:// didn't work:
 *   - In dev the renderer is served from http://localhost, and Chromium
 *     blocks http:// pages from loading file:// subresources outright — which
 *     is why an attached video rendered as a black player that never started.
 *   - Even when it loads, file:// handling of HTTP range requests is
 *     inconsistent, and <video> needs ranges to seek.
 *
 * Declaring the scheme as streaming + standard gets proper range support, and
 * routing through net.fetch keeps Chromium's normal media pipeline.
 */
export function registerMediaScheme(): void {
  protocol.registerSchemesAsPrivileged([
    {
      scheme: MEDIA_SCHEME,
      privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, bypassCSP: false }
    }
  ]);
}

export function registerMediaProtocolHandler(): void {
  protocol.handle(MEDIA_SCHEME, async (request) => {
    const url = new URL(request.url);
    // Only the basename is ever addressable, so a crafted URL can't walk out
    // of the media directory.
    const name = path.basename(decodeURIComponent(url.pathname));
    if (!name || name === "." || name === "..") return new Response("Not found", { status: 404 });

    const filePath = path.join(getMediaDir(), name);
    return net.fetch(pathToFileURL(filePath).toString());
  });
}
