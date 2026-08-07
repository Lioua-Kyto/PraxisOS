import { useCallback, useEffect, useState } from "react";
import type { UpdaterStatus } from "@shared/types";

/**
 * Binds to the main-process auto-updater. `status` is the single source of
 * truth, pushed from main on every state change; the actions are fire-and-
 * forget commands whose results come back as new statuses.
 */
export function useUpdater() {
  const [status, setStatus] = useState<UpdaterStatus>({ state: "idle" });

  useEffect(() => {
    let alive = true;
    void window.api.updater.getStatus().then((s) => {
      if (alive) setStatus(s);
    });
    const unsubscribe = window.api.updater.onStatus(setStatus);
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  const check = useCallback(() => window.api.updater.check(), []);
  const download = useCallback(() => window.api.updater.download(), []);
  const install = useCallback(() => window.api.updater.install(), []);

  return { status, check, download, install };
}
