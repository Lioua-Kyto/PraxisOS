import { AlertTriangle, Check, Download, Loader2, RefreshCw, RotateCw } from "lucide-react";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { useUpdater } from "./useUpdater";

function formatMB(bytes: number): string {
  return `${(bytes / 1_000_000).toFixed(1)} MB`;
}

/**
 * The auto-updater's UI, driven entirely by the main-process state machine:
 *
 *   Check → Update available (Download) → Downloading XX% → Restart to install
 *
 * Every action is a command to main; the button that shows next is whatever
 * state main reports back, so the two can never disagree.
 */
export function UpdaterControl() {
  const { status, check, download, install } = useUpdater();

  switch (status.state) {
    case "checking":
      return (
        <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" /> Checking for updates…
        </div>
      );

    case "available":
      return (
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-[12.5px]">
            Version <strong className="font-semibold">{status.version}</strong> is available.
          </span>
          <Button size="sm" onClick={() => void download()}>
            <Download className="h-3.5 w-3.5" /> Download update
          </Button>
        </div>
      );

    case "downloading": {
      const percent = Math.round(status.percent);
      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-[12.5px] text-muted-foreground">
            <span>Downloading update…</span>
            <span className="tabular">
              {percent}% · {formatMB(status.transferred)} / {formatMB(status.total)}
            </span>
          </div>
          <Progress value={percent} />
        </div>
      );
    }

    case "downloaded":
      return (
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="flex items-center gap-1.5 text-[12.5px] text-success">
            <Check className="h-3.5 w-3.5" /> Version {status.version} is ready.
          </span>
          <Button size="sm" onClick={() => void install()}>
            <RotateCw className="h-3.5 w-3.5" /> Restart to install
          </Button>
        </div>
      );

    case "error":
      return (
        <div className="flex flex-col gap-1.5">
          <div className="flex items-start gap-2 text-[12.5px] text-destructive">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            <span className="min-w-0">Couldn't update: {status.message}</span>
          </div>
          <Button variant="outline" size="sm" className="self-start" onClick={() => void check()}>
            <RefreshCw className="h-3.5 w-3.5" /> Try again
          </Button>
        </div>
      );

    case "unsupported":
      return (
        <span className="text-[12.5px] text-muted-foreground">
          Automatic updates run in the installed app only, not in development.
        </span>
      );

    // idle and not-available both offer a manual check.
    default:
      return (
        <div className="flex flex-wrap items-center gap-2.5">
          <Button variant="outline" size="sm" onClick={() => void check()}>
            <RefreshCw className="h-3.5 w-3.5" /> Check for updates
          </Button>
          {status.state === "not-available" && (
            <span className="text-[12.5px] text-muted-foreground">You're on the latest version.</span>
          )}
        </div>
      );
  }
}
