import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, X } from "lucide-react";
import { Button } from "../ui/button";
import { WhatsNewDialog } from "./WhatsNewDialog";

/**
 * Two related jobs, one mount:
 *  - after an update lands, show what changed once;
 *  - in the background, ask GitHub whether something newer exists.
 *
 * Both stay out of the way. The check is best-effort and silent on failure —
 * this is a local-first app and must not nag when it's offline.
 */
export function UpdateGate() {
  const [dismissedBanner, setDismissedBanner] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);

  const { data: whatsNew } = useQuery({
    queryKey: ["updates", "whatsNew"],
    queryFn: () => window.api.updates.whatsNew(),
    staleTime: Infinity
  });

  const { data: check } = useQuery({
    queryKey: ["updates", "check"],
    queryFn: () => window.api.updates.check(),
    // Once per launch is plenty; a desktop app polling GitHub on a timer is
    // just noise on someone else's rate limit.
    staleTime: Infinity,
    retry: false
  });

  useEffect(() => {
    if (whatsNew?.show) setWhatsNewOpen(true);
  }, [whatsNew?.show]);

  const closeWhatsNew = () => {
    setWhatsNewOpen(false);
    void window.api.updates.acknowledge();
  };

  const showBanner = Boolean(check?.updateAvailable && check.latest) && !dismissedBanner;

  return (
    <>
      {showBanner && check?.latest && (
        <div className="flex items-center gap-3 border-b border-border-soft bg-primary/10 px-5 py-2 text-[13px]">
          <Download className="h-4 w-4 shrink-0 text-primary" />
          <span className="min-w-0 flex-1">
            <strong className="font-semibold">PraxisOS {check.latest.version}</strong> is available — you're on{" "}
            {check.currentVersion}.
          </span>
          <Button size="sm" onClick={() => void window.api.updates.openRelease(check.latest!.url)}>
            View release
          </Button>
          <button
            onClick={() => setDismissedBanner(true)}
            aria-label="Dismiss update notice"
            title="Dismiss"
            className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <WhatsNewDialog data={whatsNew} open={whatsNewOpen} onClose={closeWhatsNew} />
    </>
  );
}
