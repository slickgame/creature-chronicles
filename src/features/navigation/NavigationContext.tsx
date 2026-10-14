"use client";
import { createContext, useContext, useState, type ReactNode, type Dispatch, type SetStateAction } from "react";
export type NavigationView =
  | "morning-report"
  | "menu"
  | "inventory"
  | "ledger"
  | "end-day"
  | "journal"
  | "travel"
  | "advisor"
  | "guide"
  | null;
const Context = createContext<{
  ranchPlot:number;setRanchPlot:Dispatch<SetStateAction<number>>;
  ranchView:'map'|'house';setRanchView:Dispatch<SetStateAction<'map'|'house'>>;
  ranchHousePage:number;setRanchHousePage:Dispatch<SetStateAction<number>>;
  ranchSaveId:string;setRanchSaveId:Dispatch<SetStateAction<string>>;
  view: NavigationView;
  open: (view: NavigationView) => void;
}>({view:null,open:()=>{},ranchPlot:0,setRanchPlot:()=>{},ranchView:'map',setRanchView:()=>{},ranchHousePage:0,setRanchHousePage:()=>{},ranchSaveId:'',setRanchSaveId:()=>{}});
export function NavigationProvider({ children }: { children: ReactNode }) {
  const [ranchPlot,setRanchPlot]=useState(0),[ranchView,setRanchView]=useState<'map'|'house'>('map'),[ranchHousePage,setRanchHousePage]=useState(0),[ranchSaveId,setRanchSaveId]=useState('');
  const [view, open] = useState<NavigationView>(null);
  return <Context.Provider value={{ view, open, ranchPlot,setRanchPlot,ranchView,setRanchView,ranchHousePage,setRanchHousePage,ranchSaveId,setRanchSaveId }}>{children}</Context.Provider>;
}
export function useNavigation() {
  return useContext(Context);
}
