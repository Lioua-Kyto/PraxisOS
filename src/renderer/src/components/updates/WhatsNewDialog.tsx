import { PartyPopper } from "lucide-react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";
import type { WhatsNew } from "@shared/types";

/**
 * Renders the subset of markdown release notes actually use: `###` section
 * headings and `-` bullets. Anything else is shown as a plain line rather than
 * pulling the full markdown pipeline into this dialog.
 */
function Notes({ source }: { source: string }) {
  const lines = source.split("\n").filter((line) => line.trim());

  if (!lines.length) {
    return <p className="text-[13px] text-muted-foreground">No notes were published for this release.</p>;
  }

  return (
    <div className="scrollbar-thin max-h-[22rem] overflow-y-auto pr-1">
      <ul className="flex flex-col gap-1.5">
        {lines.map((line, i) => {
          const heading = /^#{1,6}\s+(.*)$/.exec(line);
          if (heading) {
            return (
              <li key={i} className="mt-2 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">
                {heading[1]}
              </li>
            );
          }
          const bullet = /^[-*]\s+(.*)$/.exec(line);
          return (
            <li key={i} className="flex gap-2 text-[13px]">
              {bullet && <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-primary" />}
              <span className={bullet ? undefined : "text-muted-foreground"}>{bullet ? bullet[1] : line}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function WhatsNewDialog({
  data,
  open,
  onClose
}: {
  data: WhatsNew | undefined;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PartyPopper className="h-4 w-4 text-primary" />
            What's new in {data?.version ?? ""}
          </DialogTitle>
          <DialogDescription>
            {data?.previousVersion
              ? `Updated from ${data.previousVersion}. Here's what changed.`
              : "Here's what changed in this release."}
          </DialogDescription>
        </DialogHeader>

        <Notes source={data?.notes ?? ""} />

        <DialogFooter>
          <Button onClick={onClose}>Got it</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
