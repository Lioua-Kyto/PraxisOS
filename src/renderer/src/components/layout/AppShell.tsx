import { useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar, type PageKey } from "./Sidebar";

const COLLAPSE_STORAGE_KEY = "praxisos:sidebar-collapsed";

export function AppShell({
  page,
  onNavigate,
  children
}: {
  page: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
}) {
  // Purely a UI preference, so localStorage keeps it out of the SQLite
  // settings round-trip and avoids a flash of the wrong width on load.
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_STORAGE_KEY) === "true");

  useEffect(() => {
    localStorage.setItem(COLLAPSE_STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar page={page} onNavigate={onNavigate} collapsed={collapsed} onToggleCollapsed={() => setCollapsed((c) => !c)} />
      <div className="scrollbar-thin min-w-0 flex-1 overflow-y-auto px-10 py-8 pb-16">
        <AnimatePresence mode="wait">
          <motion.div
            key={page}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16, ease: "easeOut" }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
