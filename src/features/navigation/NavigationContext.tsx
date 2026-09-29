"use client";
import { createContext, useContext, useState, type ReactNode } from "react";
export type NavigationView =
  | "morning-report"
  | "menu"
  | "inventory"
  | "ledger"
  | "end-day"
  | "journal"
  | "travel"
  | "advisor"
  | null;
const Context = createContext<{
  view: NavigationView;
  open: (view: NavigationView) => void;
}>({ view: null, open: () => {} });
export function NavigationProvider({ children }: { children: ReactNode }) {
  const [view, open] = useState<NavigationView>(null);
  return <Context.Provider value={{ view, open }}>{children}</Context.Provider>;
}
export function useNavigation() {
  return useContext(Context);
}
