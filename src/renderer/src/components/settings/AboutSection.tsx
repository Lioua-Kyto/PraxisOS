import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, ExternalLink, FileText, RefreshCw, Scale, ScrollText, Shield } from "lucide-react";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { WhatsNewDialog } from "../updates/WhatsNewDialog";
import { useState } from "react";
import type { WhatsNew } from "@shared/types";

const REPO = "https://github.com/Lioua-Kyto/PraxisOS";

const DOCUMENTS = [
  { label: "Privacy policy", href: `${REPO}/blob/main/PRIVACY.md`, icon: Shield },
  { label: "Terms of use", href: `${REPO}/blob/main/TERMS.md`, icon: FileText },
  { label: "Licence agreement", href: `${REPO}/blob/main/build/license.txt`, icon: Scale },
];

export function AboutSection() {
  const [notes, setNotes] = useState<WhatsNew | undefined>();
  const { data: version } = useQuery({
    queryKey: ["updates", "version"],
    queryFn: () => window.api.updates.version(),
    staleTime: Infinity
  });

  const { data: check, refetch, isFetching } = useQuery({
    queryKey: ["updates", "check"],
    queryFn: () => window.api.updates.check(),
    staleTime: Infinity,
    retry: false
  });

  return (
    <>
      <div className="mb-3 font-mono text-[10.5px] uppercase tracking-wide text-muted-foreground">About</div>

      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span className="font-display text-lg">PraxisOS</span>
        <span className="rounded bg-secondary px-1.5 py-0.5 text-[11px] tabular">v{version ?? "—"}</span>
        {check?.updateAvailable && check.latest ? (
          <Button size="sm" onClick={() => void window.api.updates.openRelease(check.latest!.url)}>
            Update to {check.latest.version}
          </Button>
        ) : (
          <Button size="sm" variant="outline" onClick={() => void refetch()} disabled={isFetching}>
            <RefreshCw className={isFetching ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5"} />
            {isFetching ? "Checking…" : check ? "Up to date" : "Check for updates"}
          </Button>
        )}
      </div>

      <div className="mt-3 flex items-start gap-2.5 rounded-md border border-warning/40 bg-warning/10 p-3">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
        <div className="text-[12.5px]">
          <div className="font-semibold">Early access</div>
          <p className="mt-0.5 text-muted-foreground">
            PraxisOS is pre-1.0 software. Expect edge-case bugs, and features that change between releases. Your data
            lives only on this machine — export a backup regularly and keep it somewhere safe.
          </p>
        </div>
      </div>

      <Separator className="my-4" />

      <div className="flex flex-wrap gap-2.5">
        {DOCUMENTS.map(({ label, href, icon: Icon }) => (
          <Button key={label} variant="outline" size="sm" onClick={() => void window.api.updates.openRelease(href)}>
            <Icon className="h-3.5 w-3.5" /> {label}
            <ExternalLink className="h-3 w-3 opacity-60" />
          </Button>
        ))}
        <Button
          variant="outline"
          size="sm"
          onClick={async () => setNotes(await window.api.updates.releaseNotes())}
        >
          <ScrollText className="h-3.5 w-3.5" /> What's new in this version
        </Button>
      </div>

      <WhatsNewDialog data={notes} open={Boolean(notes)} onClose={() => setNotes(undefined)} />

      <p className="mt-3 text-[11px] text-muted-foreground">
        Built by Lioua-Kyto. No account, no telemetry, no data leaves your device.
      </p>
    </>
  );
}
