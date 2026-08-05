import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, PartyPopper, X } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import { toPlainPreview } from "../../lib/legacyMarkdown";

/** Release notes are markdown; render the handful of shapes releases use. */
function Notes({ source }: { source: string }) {
  const lines = source.split("\n").filter((l) => l.trim());
  if (!lines.length) return <p className="text-[13px] text-muted-foreground">No notes were published for this release.</p>;

  return (
    <div className="scrollbar-thin max-h-64 overflow-y-auto pr-1">
      <ul className="flex flex-col gap-1.5">
        {lines.map((line, i) => {
          const item = line.replace(/^[-*]\s+/, "").replace(/^#+\s*/, "");
          const isHeading = /^#+\s/.test(line);
          return isHeading ? (
            <li key={i} className="mt-1.5 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
              {item}
            </li>
          ) : (
            <li key={i} className="flex gap-2 text-[13px]">
              <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary" />
              <span>{toPlainPreview(item, 400)}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

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
    // Once per launch is plenty; a desktop app that polls GitHub on a timer is
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

      <Dialog open={whatsNewOpen} onOpenChange={(open) => (open ? setWhatsNewOpen(true) : closeWhatsNew())}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <PartyPopper className="h-4 w-4 text-primary" />
              What's new in {whatsNew?.version}
            </DialogTitle>
            <DialogDescription>
              {whatsNew?.previousVersion
                ? `Updated from ${whatsNew.previousVersion}. Here's what changed.`
                : "Here's what changed."}
            </DialogDescription>
          </DialogHeader>

          <Notes source={whatsNew?.notes ?? ""} />

          <DialogFooter>
            <Button onClick={closeWhatsNew}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
