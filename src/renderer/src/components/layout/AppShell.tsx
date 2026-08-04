import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";
import { Sidebar, type PageKey } from "./Sidebar";

export function AppShell({
  page,
  onNavigate,
  children
}: {
  page: PageKey;
  onNavigate: (page: PageKey) => void;
  children: ReactNode;
}) {
  return (
    <div className="grid h-screen grid-cols-[220px_1fr] overflow-hidden">
      <Sidebar page={page} onNavigate={onNavigate} />
      <div className="scrollbar-thin overflow-y-auto px-10 py-8 pb-16">
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
