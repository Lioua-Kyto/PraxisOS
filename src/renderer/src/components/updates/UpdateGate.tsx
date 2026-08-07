import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Check, Download, X } from "lucide-react";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { WhatsNewDialog } from "./WhatsNewDialog";
import { useUpdater } from "./useUpdater";

/**
 * Two jobs, one mount at app start:
 *  - after an update lands, show what changed once;
 *  - check for a newer version in the background and, when the auto-updater has
 *    something, surface it as a slim banner that downloads and installs in-app.
 *
 * Downloads and installs are always the user's choice — the banner only ever
 * offers the next step. In development the updater reports "unsupported" and no
 * banner shows.
 */
export function UpdateGate() {
  const [dismissed, setDismissed] = useState(false);
  const [whatsNewOpen, setWhatsNewOpen] = useState(false);
  const { status, check, download, install } = useUpdater();

  const { data: whatsNew } = useQuery({
    queryKey: ["updates", "whatsNew"],
    queryFn: () => window.api.updates.whatsNew(),
    staleTime: Infinity
  });

  // One check per launch. A desktop app polling on a timer is just noise.
  const checked = useRef(false);
  useEffect(() => {
    if (checked.current) return;
    checked.current = true;
    void check();
  }, [check]);

  useEffect(() => {
    if (whatsNew?.show) setWhatsNewOpen(true);
  }, [whatsNew?.show]);

  // A fresh available/downloaded state is worth showing again even after an
  // earlier dismiss.
  useEffect(() => {
    if (status.state === "available" || status.state === "downloaded") setDismissed(false);
  }, [status.state]);

  const closeWhatsNew = () => {
    setWhatsNewOpen(false);
    void window.api.updates.acknowledge();
  };

  const banner = renderBanner();

  return (
    <>
      {banner && !dismissed && (
        <div className="flex items-center gap-3 border-b border-border-soft bg-primary/10 px-5 py-2 text-[13px]">
          {banner.content}
          {banner.dismissible && (
            <button
              onClick={() => setDismissed(true)}
              aria-label="Dismiss update notice"
              title="Dismiss"
              className="shrink-0 rounded p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      )}

      <WhatsNewDialog data={whatsNew} open={whatsNewOpen} onClose={closeWhatsNew} />
    </>
  );

  function renderBanner(): { content: React.ReactNode; dismissible: boolean } | null {
    switch (status.state) {
      case "available":
        return {
          dismissible: true,
          content: (
            <>
              <Download className="h-4 w-4 shrink-0 text-primary" />
              <span className="min-w-0 flex-1">
                <strong className="font-semibold">PraxisOS {status.version}</strong> is available.
              </span>
              <Button size="sm" onClick={() => void download()}>
                Download
              </Button>
            </>
          )
        };
      case "downloading": {
        const percent = Math.round(status.percent);
        return {
          dismissible: false,
          content: (
            <>
              <Download className="h-4 w-4 shrink-0 text-primary" />
              <span className="shrink-0">Downloading update…</span>
              <Progress value={percent} className="max-w-xs flex-1" />
              <span className="shrink-0 tabular text-muted-foreground">{percent}%</span>
            </>
          )
        };
      }
      case "downloaded":
        return {
          dismissible: true,
          content: (
            <>
              <Check className="h-4 w-4 shrink-0 text-success" />
              <span className="min-w-0 flex-1">
                <strong className="font-semibold">PraxisOS {status.version}</strong> is ready to install.
              </span>
              <Button size="sm" onClick={() => void install()}>
                Restart &amp; install
              </Button>
            </>
          )
        };
      default:
        return null;
    }
  }
}
