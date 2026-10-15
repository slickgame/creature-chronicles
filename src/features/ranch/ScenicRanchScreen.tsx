"use client";

import { getHabitatSite } from "@/data/ranchHabitatSites";
import { resourceList } from "@/data/farmResources";

import { useEffect, useState, type CSSProperties } from "react";
import {
  BUILDING_SHORTCUTS,
  RANCH_PLOTS,
  type BuildingShortcut,
} from "@/data/ranchMap";
import { getBuilderProjectProgress } from "@/data/builderProjects";
import {
  getNextRanchUpgradeTier,
  getRanchUpgradeDefinition,
  getRanchUpgrades,
} from "@/data/ranchUpgrades";
import { useNavigation } from "@/features/navigation/NavigationContext";
import { RanchLedger } from "@/features/navigation/RanchLedger";
import { RanchIcon, type RanchIconName } from "@/features/ui/RanchIcon";
import { RanchReview } from "./RanchReview";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureFamily } from "@/types/creature";
import styles from "./ScenicRanchScreen.module.css";

import {RanchHouse} from "./RanchHouse";
import {HABITAT_PURCHASES,isHabitatUnlocked} from "@/data/ranchHabitats";

const LOCATIONS: Record<string, Record<string, [number, number]>> = {
  homestead: { house: [25, 54], breeding: [50, 68], nursery: [75, 54] },
  habitats: { feline: [20, 40], canine: [53, 37], bovine: [84, 49], lapine: [20, 69], equine: [61, 73] },
  expansion: { "north-pasture": [25, 43], "woodline-acre": [74, 43], chicken: [17, 62], sheep: [40, 62], goat: [64, 62], aviary: [86, 62], fence: [26, 80], watchtower: [79, 80] },
};
const ICONS: Record<string, RanchIconName> = { house: "house", nursery: "egg", breeding: "nest", office: "chores", town: "town", jobs: "tools", guild: "tax" };

export function ScenicRanchScreen() {
  const game = useGameContext();
  const nav=useNavigation();
  const {open,view,ranchPlot:plot,setRanchPlot:setPlot,ranchView,setRanchView,ranchSaveId,setRanchSaveId,setRanchHousePage,setGrowthPage,setNightReturn,setLedgerReturn}=nav;
  const [siteArtMinimized,setSiteArtMinimized]=useState(false);
  const [selected, setSelected] = useState<BuildingShortcut | null>(null);
  const saveId=game.currentSave?.saveId;
  useEffect(()=>{if(saveId&&ranchSaveId!==saveId){setRanchSaveId(saveId);setPlot(0);setRanchView('map');setRanchHousePage(0);setGrowthPage(null);setNightReturn(null);setLedgerReturn(null);}},[saveId,ranchSaveId,setRanchSaveId,setPlot,setRanchView,setRanchHousePage,setGrowthPage,setNightReturn,setLedgerReturn]);
  if (!game.currentSave) return null;
  const save = game.currentSave;
  const currentPlot = RANCH_PLOTS[Math.min(plot,RANCH_PLOTS.length-1)];
  const buildings = Object.keys(LOCATIONS[currentPlot.id]).map((id) => BUILDING_SHORTCUTS.find((item) => item.id === id)!);
  const upgrades = getRanchUpgrades(save);
  const selectedFamily=selected&&["feline","canine","bovine","lapine","equine"].includes(selected.id)?selected.id as CreatureFamily:null;
  const selectedSite=selectedFamily?getHabitatSite(save,selectedFamily):null;
  function travel(building: BuildingShortcut) {
    setSelected(null);
    if (building.projectId) {
      window.localStorage.setItem("creature-chronicles-open-builder-yard", "1");
      game.goToTown();
      return;
    }
    if (building.id === "house") {
      setRanchView("house");
      return;
    }
    if (building.id === "breeding") {
      game.goToBreeding();
      return;
    }
    if (building.id === "nursery") {
      game.goToNursery();
      return;
    }
    if (building.id === "jobs") {
      game.goToRanchJobs();
      return;
    }
    if (building.id === "office") {
      game.goToRanchOffice();
      return;
    }
    if (building.id === "guild" || building.id === "town") {
      game.goToTown();
      return;
    }
    const family=building.id as CreatureFamily;
    if(!isHabitatUnlocked(save,family)){const purchase=HABITAT_PURCHASES[family as keyof typeof HABITAT_PURCHASES];if(purchase){window.localStorage.setItem('creature-chronicles-builder-family-v1',family);window.localStorage.setItem('creature-chronicles-open-builder-yard','1');game.goToTown();}return;}
    game.goToHabitat(family);
  }
  function upgrade(building: BuildingShortcut) {
    const id = building.upgradeIds[0];
    if (!id) return;
    window.localStorage.setItem(
      "creature-chronicles-ranch-office-upgrade-v1",
      id,
    );
    window.localStorage.setItem(
      "creature-chronicles-ranch-office-category-v1",
      getRanchUpgradeDefinition(id).category,
    );
    setSelected(null);
    setRanchView("house");
    game.goToRanchOffice();
  }
  return (
    <main className={`${styles.home} ${siteArtMinimized?styles.minimizedSites:""} ${view === "ledger" ? styles.ledgerOpen : ""}`}>
      <header className={styles.hud}>
        <div className={styles.identity}><h1>{save.player.ranchName}</h1><small>{save.player.name}’s ranch</small></div>
        <div className={styles.resources} aria-label="Player resources">
          <div className={styles.resource}><RanchIcon name="sun" /><span>Day <b>{save.dayState.dayNumber}</b></span></div>
          <div className={`${styles.resource} ${styles.energy}`}><RanchIcon name="energy" /><span>Energy <b>{save.currencies.energy}/{save.currencies.maxEnergy}</b><meter min={0} max={Math.max(1, save.currencies.maxEnergy)} value={save.currencies.energy} aria-label="Energy" /></span></div>
          <div className={styles.resource}><RanchIcon name="gold" /><span><b>{save.currencies.gold.toLocaleString()}</b><small>Gold · {save.currencies.guildPoints} GP</small></span></div>
        </div>
        <button type="button" className={styles.menu} onClick={() => open("menu")} data-navigation-launcher aria-haspopup="dialog"><RanchIcon name="gear" /><span>Menu</span></button>
      </header>
      <div className={styles.worldScroll}>
        <section className={styles.map} data-plot={currentPlot.id} aria-label="Ranch locations" style={{ backgroundImage: currentPlot.id==='habitats'?"url(/images/ui/ranch-stages-v1/fields.webp)":`url(/images/ui/ranch-v3/${currentPlot.id}.webp)` }}>
          {buildings.map((building) => {
            const project = building.projectId ? getBuilderProjectProgress(save, building.projectId) : null;
            const family=['feline','canine','bovine','lapine','equine'].includes(building.id)?building.id as CreatureFamily:null;
            const site=family?getHabitatSite(save,family):null;
            const owned=family?isHabitatUnlocked(save,family):true;
            const ready = building.id === "nursery" ? (save.eggs ?? []).filter(egg => egg.status === "ready").length : 0;
            const [x, y] = LOCATIONS[currentPlot.id][building.id];
            return <button type="button" key={`${currentPlot.id}-${building.id}`} data-owned={owned} data-site-state={site?.state} className={`${styles.building} ${site?styles.habitatSite:""}`} style={{ "--x": `${x}%`, "--y": `${y}%` } as CSSProperties} onClick={() => building.id==='house'?travel(building):setSelected(building)} aria-label={`Open ${building.title}`}>
              {site?<img className={styles.siteArt} src={site.art} alt=""/>:<RanchIcon name={ICONS[building.id] ?? (project ? "tools" : "paw")} />}
              <span>{building.title}{site&&<small>{site.summary}</small>}{(ready > 0 || project) && <small>{ready ? `${ready} ready` : project?.status}</small>}</span>
            </button>;
          })}
        </section>
      </div>
      <nav className={styles.plotNav} aria-label="Ranch plots">
        <button type="button" aria-label="Previous ranch plot" onClick={() => setPlot((plot + RANCH_PLOTS.length - 1) % RANCH_PLOTS.length)}>‹</button>
        <span>{currentPlot.shortLabel}<small>{plot + 1} / {RANCH_PLOTS.length}<span className={styles.swipeHint}> · Use arrows to explore</span></small></span>
        {currentPlot.id==='habitats'&&<button className={styles.siteArtToggle} aria-expanded={!siteArtMinimized} onClick={()=>setSiteArtMinimized(v=>!v)}>{siteArtMinimized?'Expand site art':'Minimize site art'}</button>}
        <button type="button" aria-label="Next ranch plot" onClick={() => setPlot((plot + 1) % RANCH_PLOTS.length)}>›</button>
      </nav>
      {view !== "ledger" && <aside className={styles.today}><RanchLedger compact minimal={plot !== 0} /></aside>}
      <footer className={styles.bottom}>
        <nav className={styles.dock} aria-label="Ranch shortcuts">
          <button type="button" aria-current="page" onClick={() => setPlot(0)}><RanchIcon name="house" /><span>Ranch</span></button>
          <button type="button" onClick={game.goToCollection}><RanchIcon name="paw" /><span>Creatures</span></button>
          <button type="button" onClick={game.goToNursery}><RanchIcon name="egg" /><span>Nursery</span></button>
          <button type="button" onClick={game.goToTown}><RanchIcon name="town" /><span>Town</span></button>
          <button type="button" onClick={() => open("inventory")}><RanchIcon name="bag" /><span>Inventory</span></button>
        </nav>
        <div className={styles.dayAction}><button type="button" data-tutorial-id="ranch-review-day" onClick={() => open("end-day")}><RanchIcon name="moon" />End Day</button><small>Local save · File {save.slotIndex + 1}</small></div>
      </footer>
      {ranchView==='house'&&<RanchHouse/>}
      {selected && <RanchReview key={selected.id} title={selected.title} art={selectedSite?.art} onClose={()=>setSelected(null)} pages={[
        {title:selectedSite?.state==='building'?"Construction underway":selectedSite?.state==='owned'?"Owned habitat":"Location",content:<><p>{selected.hint}</p>{selectedSite?.state==='building'&&<p>Under construction. Already paid; ready on Ranch Day {selectedSite.readyDay}. No further fee is due. Finish the ranch day in the house to advance construction.</p>}{["feline","canine","bovine","lapine"].includes(selected.id)&&selectedSite?.state==='planned'&&<p>Petra builds this habitat for {HABITAT_PURCHASES[selected.id as keyof typeof HABITAT_PURCHASES].gold} Gold + {HABITAT_PURCHASES[selected.id as keyof typeof HABITAT_PURCHASES].wood} Wood. One ranch day · four resident spaces.</p>}{selected.projectId&&<p>{getBuilderProjectProgress(save,selected.projectId).status} · {getBuilderProjectProgress(save,selected.projectId).definition.costGold} Gold + {resourceList(getBuilderProjectProgress(save,selected.projectId).definition.costResources)}</p>}</>},
        ...selected.upgradeIds.filter(()=>!['feline','canine','bovine','lapine'].includes(selected.id)||isHabitatUnlocked(save,selected.id as CreatureFamily)).map(id=>{const definition=getRanchUpgradeDefinition(id),tier=upgrades[id]??0,next=getNextRanchUpgradeTier(definition,tier);return {title:definition.name,content:<><p>Tier {tier}: {tier?definition.tiers.find(t=>t.tier===tier)?.effectLabel:"Base ranch service"}</p><p>{next?`Next: ${next.effectLabel} · ${next.costGold} Gold${next.costGp?` + ${next.costGp} GP`:''}${next.costResources?` + ${resourceList(next.costResources)}`:''}`:'Fully upgraded'}</p></>};})
      ]} actions={<><button onClick={()=>travel(selected)}>{selected.projectId?"Visit Builder’s Yard":['feline','canine','bovine','lapine'].includes(selected.id)&&!isHabitatUnlocked(save,selected.id as CreatureFamily)?(selectedSite?.state==='building'?"View Petra’s work order":"Visit Petra · Unlock habitat"):"Enter Building"}</button>{selected.upgradeIds.length>0&&(!['feline','canine','bovine','lapine'].includes(selected.id)||isHabitatUnlocked(save,selected.id as CreatureFamily))&&<button onClick={()=>upgrade(selected)}>Manage in Ranch House</button>}</>}/>}
    </main>
  );
}
