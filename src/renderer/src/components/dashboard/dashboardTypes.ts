import type { PageKey } from "../layout/Sidebar";
export type { HabitWithLogs } from "@shared/types";

/** Alias so dashboard widgets don't each import the sidebar's page union. */
export type PageKeyLike = PageKey;
