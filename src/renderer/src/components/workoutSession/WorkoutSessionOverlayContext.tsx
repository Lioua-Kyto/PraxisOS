import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface OverlayContextValue {
  open: boolean;
  show: () => void;
  hide: () => void;
}

const OverlayContext = createContext<OverlayContextValue | null>(null);

export function WorkoutSessionOverlayProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const value = useMemo<OverlayContextValue>(() => ({ open, show: () => setOpen(true), hide: () => setOpen(false) }), [open]);
  return <OverlayContext.Provider value={value}>{children}</OverlayContext.Provider>;
}

export function useWorkoutSessionOverlay(): OverlayContextValue {
  const ctx = useContext(OverlayContext);
  if (!ctx) throw new Error("useWorkoutSessionOverlay must be used within a WorkoutSessionOverlayProvider");
  return ctx;
}
