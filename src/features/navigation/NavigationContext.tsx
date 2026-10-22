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
export type NightReturn = {screen:string;tab:string;entry:number;entryKey?:string;timerKey?:string}|null;
export type CreatureRosterSection = 'overview'|'stats'|'work'|'talents'|'lineage'|'care'|'inventory'|'equipment';
export type CreatureRosterSelection = {saveId:string;creatureId:string;section:CreatureRosterSection};
export type NurserySelection = {saveId:string;tab:"eggs"|"pregnancies"|"births";id:string;small:boolean};
export type BreedingLedgerSelection = {saveId:string;tab:'overview'|'attempts'|'pairs'|'creatures'|'tree';entry:string;query:string;outcome:'all'|'pregnancy'|'failed'|'blocked';participant:string;role:'either'|'giver'|'receiver';newest:boolean;small:boolean;treeId:string;detail?:string;detailPage?:string;returning:boolean};
const Context = createContext<{
  creatureRoster:CreatureRosterSelection|null;setCreatureRoster:Dispatch<SetStateAction<CreatureRosterSelection|null>>;
  breedingLedger:BreedingLedgerSelection|null;setBreedingLedger:Dispatch<SetStateAction<BreedingLedgerSelection|null>>;
  nurserySelection:NurserySelection|null;setNurserySelection:Dispatch<SetStateAction<NurserySelection|null>>;
  ledgerReturn:NightReturn;setLedgerReturn:Dispatch<SetStateAction<NightReturn>>;
  nightReturn:NightReturn;setNightReturn:Dispatch<SetStateAction<NightReturn>>;
  growthPage:number|null;setGrowthPage:Dispatch<SetStateAction<number|null>>;
  ranchPlot:number;setRanchPlot:Dispatch<SetStateAction<number>>;
  ranchView:'map'|'house';setRanchView:Dispatch<SetStateAction<'map'|'house'>>;
  ranchHousePage:number;setRanchHousePage:Dispatch<SetStateAction<number>>;
  ranchSaveId:string;setRanchSaveId:Dispatch<SetStateAction<string>>;
  view: NavigationView;
  open: (view: NavigationView) => void;
}>({creatureRoster:null,setCreatureRoster:()=>{},breedingLedger:null,setBreedingLedger:()=>{},nurserySelection:null,setNurserySelection:()=>{},ledgerReturn:null,setLedgerReturn:()=>{},nightReturn:null,setNightReturn:()=>{},growthPage:null,setGrowthPage:()=>{},view:null,open:()=>{},ranchPlot:0,setRanchPlot:()=>{},ranchView:'map',setRanchView:()=>{},ranchHousePage:0,setRanchHousePage:()=>{},ranchSaveId:'',setRanchSaveId:()=>{}});
export function NavigationProvider({ children }: { children: ReactNode }) {
  const [creatureRoster,setCreatureRoster]=useState<CreatureRosterSelection|null>(null);
  const [ranchPlot,setRanchPlot]=useState(0),[ranchView,setRanchView]=useState<'map'|'house'>('map'),[ranchHousePage,setRanchHousePage]=useState(0),[ranchSaveId,setRanchSaveId]=useState('');
  const [breedingLedger,setBreedingLedger]=useState<BreedingLedgerSelection|null>(null);
  const [nurserySelection,setNurserySelection]=useState<NurserySelection|null>(null);
  const [ledgerReturn,setLedgerReturn]=useState<NightReturn>(null);
  const [nightReturn,setNightReturn]=useState<NightReturn>(null);
  const [growthPage,setGrowthPage]=useState<number|null>(null);
  const [view, open] = useState<NavigationView>(null);
  return <Context.Provider value={{ creatureRoster,setCreatureRoster,breedingLedger,setBreedingLedger,nurserySelection,setNurserySelection,ledgerReturn,setLedgerReturn,nightReturn,setNightReturn,growthPage,setGrowthPage,view, open, ranchPlot,setRanchPlot,ranchView,setRanchView,ranchHousePage,setRanchHousePage,ranchSaveId,setRanchSaveId }}>{children}</Context.Provider>;
}
export function useNavigation() {
  return useContext(Context);
}
