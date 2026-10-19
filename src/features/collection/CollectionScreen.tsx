"use client";

import { getEquineGameplayProfileSprite } from "@/data/equineGameplayArt";
import { getNylaGameplayProfileSprite } from "@/data/nylaGameplayArt";
import { careStatusTone } from "@/data/carePresentation";
import { CreatureRemovalWindow } from '@/features/creatures/CreatureRemovalWindow';
import { useCallback, useMemo, useState, type ReactNode } from "react";
import { useNavigation, type CreatureRosterSection } from '@/features/navigation/NavigationContext';
import {
  DEFAULT_CREATURE_MANAGEMENT_FILTERS,
  filterAndSortManagedCreatures,
  getCreatureManagementStatus,
  getCreatureManagementSummary,
  type CreatureManagementFilters,
  type CreatureSortMode,
  type SortDirection,
} from "@/data/creatureManagement";
import {
  getBestStatLabels,
} from "@/data/collection";
import {
  CREATURE_PLACEHOLDER_IMAGE,
  getVariantDefinition,
} from "@/data/creatures";
import { SharedCreatureDetail } from "@/features/creatures/CreatureDetailPanels";
import { useGameContext } from "@/state/GameProvider";
import { ScreenNavigation } from "@/features/navigation/ScreenNavigation";
import type { CreatureRecord } from "@/types/creature";
import { GameDialog } from "@/features/ui/GameDialog";
import ui from "@/features/ui/InteriorShell.module.css";
import styles from "./CollectionScreen.module.css";
import dossier from "./RanchDossier.module.css";
import overview from "./OverviewA.module.css";
import { RosterFiltersC } from './RosterFiltersC';
import { CreatureComparisonA, CreatureCompareChooserA } from './CreatureComparisonA';
import { CreatureCardsC } from './CreatureCardsC';
import { CreatureProfileCardA } from '@/features/creatures/CreatureProfileCardA';
import { CreaturePickerA } from './CreaturePickerA';

type ViewMode = "compact" | "cards";
type CompareTab = "overview" | "stats" | "breeding";

function displaySex(sex: string): string {
  return sex === "female" ? "Female" : "Male";
}

export function CollectionScreen({ headerLinks }: { headerLinks?: ReactNode }) {
  const {creatureRoster,setCreatureRoster}=useNavigation();
  const {
    currentSave,
    goToBreeding,
    goToHabitat,
    goToRanch,
    renameCreature,
    saveCurrentGame,
    toggleCreatureLock,
  } = useGameContext();
  const [showFilters, setShowFilters] = useState(false);
  const [rosterCollapsed, setRosterCollapsed] = useState(true);
  const [artCollapsed, setArtCollapsed] = useState(false);
  const [inventoryRequest, setInventoryRequest] = useState(0);
  const [profileSectionRequest,setProfileSectionRequest]=useState<{tab:'overview'|'care';request:number}>();
  const [showArtwork, setShowArtwork] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showDossier, setShowDossier] = useState(false);
  const [filters, setFilters] = useState<CreatureManagementFilters>(
    DEFAULT_CREATURE_MANAGEMENT_FILTERS,
  );
  const [sortMode, setSortMode] = useState<CreatureSortMode>("newest");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [cardsPreviewId,setCardsPreviewId]=useState<string|null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("compact");
  const [selectedCreatureId, setSelectedCreatureId] = useState<string | null>(()=>creatureRoster?.saveId===currentSave?.saveId?creatureRoster?.creatureId??null:null);
  const [initialSection]=useState<CreatureRosterSection>(()=>creatureRoster?.saveId===currentSave?.saveId?creatureRoster?.section??'overview':'overview');
  const [renameValue, setRenameValue] = useState("");
  const [confirmMode, setConfirmMode] = useState<"release" | "donate" | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [compareTab, setCompareTab] = useState<CompareTab>("overview");

  const visibleCreatures = useMemo(
    () =>
      currentSave
        ? filterAndSortManagedCreatures(
            currentSave,
            filters,
            sortMode,
            sortDirection,
          )
        : [],
    [currentSave, filters, sortDirection, sortMode],
  );
  const summary = useMemo(
    () => (currentSave ? getCreatureManagementSummary(currentSave) : null),
    [currentSave],
  );
  const selectedCreature = useMemo(() => {
    if (!currentSave?.creatures?.length) return null;
    return (
      currentSave.creatures.find(
        (creature) => creature.creatureId === selectedCreatureId,
      ) ?? currentSave.creatures[0]
    );
  }, [selectedCreatureId, currentSave]);
  const rosterSaveId=currentSave?.saveId,rosterCreatureId=selectedCreature?.creatureId;
  const rememberSection=useCallback((section:CreatureRosterSection)=>{
    if(!rosterSaveId||!rosterCreatureId)return;
    setCreatureRoster(previous=>previous?.saveId===rosterSaveId&&previous.creatureId===rosterCreatureId&&previous.section===section?previous:{saveId:rosterSaveId,creatureId:rosterCreatureId,section});
  },[rosterSaveId,rosterCreatureId,setCreatureRoster]);
  const compareCreatures = useMemo(
    () =>
      compareIds
        .map((id) =>
          (currentSave?.creatures ?? []).find(
            (creature) => creature.creatureId === id,
          ),
        )
        .filter((creature): creature is CreatureRecord => Boolean(creature)),
    [compareIds, currentSave?.creatures],
  );

  if (!currentSave || !summary) {
    return (
      <main className={styles.emptyScreen}>
        <section className={styles.emptyPanel}>
          <h1>No active save</h1>
          <p>Load or create a save before managing creatures.</p>
          <button type="button" onClick={goToRanch}>Back to Ranch</button>
        </section>
      </main>
    );
  }

  const activeSave = currentSave;
  const activeFilterCount = [
    filters.search,
    filters.family !== "all",
    filters.status !== "all",
    filters.sex !== "all",
    filters.pregnancy !== "all",
    filters.energy !== "all",
    filters.rarity !== "all",
    filters.variantId !== "all",
    filters.origin !== "all",
    filters.favoritesOnly,
    filters.lockedOnly,
    filters.shinyOnly,
  ].filter(Boolean).length;

  function patchFilters(patch: Partial<CreatureManagementFilters>) {
    setFilters((current) => ({ ...current, ...patch }));
  }

  function clearFilters() {
    setFilters(DEFAULT_CREATURE_MANAGEMENT_FILTERS);
  }

  function selectCreature(creature: CreatureRecord) {
    setSelectedCreatureId(creature.creatureId);
    setCreatureRoster(previous=>({saveId:activeSave.saveId,creatureId:creature.creatureId,section:previous?.saveId===activeSave.saveId?previous.section:'overview'}));
    setRosterCollapsed(true);
    setRenameValue(creature.nickname);
    setConfirmMode(null);
  }

  function toggleFavorite(creature: CreatureRecord) {
    saveCurrentGame({
      ...activeSave,
      creatures: (activeSave.creatures ?? []).map((item) =>
        item.creatureId === creature.creatureId
          ? { ...item, isFavorite: !item.isFavorite }
          : item,
      ),
      flags: {
        ...activeSave.flags,
        creatureFavoriteUsed: true,
      },
    });
  }

  function toggleCompareSelection(creature: CreatureRecord) {
    setCompareIds((current) => {
      if (current.includes(creature.creatureId)) {
        return current.filter((id) => id !== creature.creatureId);
      }
      if (current.length >= 2) return [current[1], creature.creatureId];
      return [...current, creature.creatureId];
    });
  }

  function beginCompareWith(creature: CreatureRecord) {
    setCompareMode(true);
    setCompareIds([creature.creatureId]);
  }

  function openBreedingForCreature(creature: CreatureRecord) {
    const status = getCreatureManagementStatus(activeSave, creature);
    const preferredRole = status.receiverEligible ? "receiver" : "giver";
    window.sessionStorage.setItem(
      "creature_chronicles_breeding_focus",
      JSON.stringify({ creatureId: creature.creatureId, preferredRole }),
    );
    goToBreeding();
  }

  function openBreedingPair(a: CreatureRecord, b: CreatureRecord, swap = false) {
    const giverId = swap ? b.creatureId : a.creatureId;
    const receiverId = swap ? a.creatureId : b.creatureId;
    window.sessionStorage.setItem(
      "creature_chronicles_breeding_focus",
      JSON.stringify({ giverId, receiverId }),
    );
    setShowCompare(false);
    goToBreeding();
  }

  function openHabitat(creature: CreatureRecord) {
    const family = getVariantDefinition(creature.variantId).family;
    window.sessionStorage.setItem(
      "creature_chronicles_habitat_focus",
      String(creature.creatureId),
    );
    goToHabitat(family);
  }

  function openInventory() {
    setInventoryRequest(value => value + 1);
  }

  function handleRename() {
    if (!selectedCreature || !renameValue.trim()) return;
    renameCreature(selectedCreature.creatureId, renameValue.trim());
  }



  return (
    <main className={`${ui.interior} ${styles.interior} ${dossier.screen} ${overview.screen}`} data-profile-open={showDossier} data-roster-collapsed={rosterCollapsed} data-art-collapsed={artCollapsed}>
      <section className={`${ui.page} ${styles.rosterPage} ${dossier.page}`}>
        <header className={`${ui.heading} ${dossier.heading}`}>
          <div>
            <p className={styles.kicker}>Creature Management</p>
            <h1>Ranch Roster</h1>

          </div>
          <div className={styles.headerActions}><button type="button" data-oa="choose" className={dossier.layoutToggle} aria-expanded={!rosterCollapsed} onClick={()=>setRosterCollapsed(v=>!v)}><img className={overview.paintedIcon} src="/images/ui/creature-overview-a-v2/painted-r4/creatures.webp" alt=""/>{rosterCollapsed ? "Choose creature" : "Back to profile"}</button><button type="button" className={overview.artToggle} aria-expanded={!artCollapsed} onClick={()=>setArtCollapsed(v=>!v)}>{artCollapsed ? "Show artwork" : "Hide artwork"}</button>
            <ScreenNavigation backIcon={<img className={overview.navigationIcon} src="/images/ui/creature-overview-a-v2/icons/back.svg" alt=""/>}>{headerLinks}</ScreenNavigation>
          </div>
        </header>


        <section className={`${styles.contentGrid} ${dossier.layout}`} data-detail={showDossier}>
          {!rosterCollapsed ? <CreaturePickerA
            save={activeSave} creatures={visibleCreatures} selectedId={selectedCreature?.creatureId}
            search={filters.search} filterCount={activeFilterCount}
            pageKey={JSON.stringify([filters,sortMode,sortDirection])}
            onSearch={search=>patchFilters({search})} onFilters={()=>setShowFilters(true)} onClear={clearFilters}
            onOpen={creature=>{selectCreature(creature);setShowDossier(true);}}
            onCompare={()=>{setCompareMode(true);setCompareIds([]);setViewMode('cards');}}
            onCards={c=>{setCardsPreviewId(c?.creatureId??null);setCompareMode(false);setViewMode('cards');}}
            onFavorite={toggleFavorite} onLock={creature=>toggleCreatureLock(creature.creatureId)}
            onBack={()=>setRosterCollapsed(true)}
          /> : null}

          <section className={`${ui.paper} ${styles.detailPanel} ${dossier.detail}`}>
            {selectedCreature ? (
              <>
                <button type="button" className={styles.mobileBack} onClick={() => setShowDossier(false)}>← All Creatures</button>
                <div data-oa="workspace" className={dossier.workspace}>
                  <article data-oa="portrait" className={dossier.heroCard} data-ui-fixed-size="true" aria-label={`${selectedCreature.nickname} selected creature`}>
                    <button className={overview.expandArt} aria-label="Expand creature artwork" onClick={()=>setShowArtwork(true)}><img className={overview.navigationIcon} src="/images/ui/creature-overview-a-v2/icons/expand.svg" alt=""/></button>
                    <div data-oa="identity" className={dossier.heroIdentity}>
                      <h2>{selectedCreature.nickname}{selectedCreature.shiny ? " ✦" : ""}</h2>
                      <p>{getVariantDefinition(selectedCreature.variantId).name} · {displaySex(getCreatureManagementStatus(activeSave, selectedCreature).sex)}</p>
                      <div className={dossier.badges}><span>{getVariantDefinition(selectedCreature.variantId).rarity}</span><span>Level {selectedCreature.level}</span></div>
                      <strong className={dossier.ready} data-status-tone={careStatusTone(getCreatureManagementStatus(activeSave, selectedCreature).primaryStatus)}>{getCreatureManagementStatus(activeSave, selectedCreature).primaryStatus}</strong>
                    </div>
                    <img data-oa="art" className={dossier.heroArt} src={getEquineGameplayProfileSprite(selectedCreature, getNylaGameplayProfileSprite(selectedCreature, getVariantDefinition(selectedCreature.variantId).profilePath || CREATURE_PLACEHOLDER_IMAGE))} alt={`${selectedCreature.nickname} full body`} onError={(event) => {event.currentTarget.onerror = null; event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE;}} />
                    <div className={dossier.heroMeters}>
                      <div><span>Energy</span><strong>{selectedCreature.energy}/{selectedCreature.maxEnergy}</strong><progress max={selectedCreature.maxEnergy} value={selectedCreature.energy} aria-label="Selected creature energy" /></div>
                      <div><span>Affection</span><strong>{selectedCreature.affection}/100</strong><progress max={100} value={selectedCreature.affection} aria-label="Selected creature affection" /></div>
                    </div>
                  </article>
                  <div data-oa="column" className={dossier.profileColumn}>
                    <div data-oa="tabs-workspace" className={dossier.tabsWorkspace}>
                      <SharedCreatureDetail
                      inventoryRequest={inventoryRequest}
                      sectionRequest={profileSectionRequest}
                      initialSection={initialSection}
                      onSectionChange={rememberSection}
                      onEquipmentFocus={()=>setRosterCollapsed(true)}
                        creature={selectedCreature}
                        dossier
                        ranchDossier
                        useGameplayArt
                        dayNumber={activeSave.dayState.dayNumber}
                        renameValue={renameValue || selectedCreature.nickname}
                        onRenameValueChange={setRenameValue}
                        onRename={handleRename}
                        onToggleLock={() => toggleCreatureLock(selectedCreature.creatureId)}
                        onRelease={() => setConfirmMode("release")}
                        onDonate={() => setConfirmMode("donate")}
                        bestStatLabels={getBestStatLabels(selectedCreature)}
                        statusNote={getCreatureManagementStatus(activeSave, selectedCreature).primaryStatus}
                      />
                    </div>
                <div data-oa="footer" className={`${styles.quickActions} ${dossier.actions}`}>
                  <button type="button" className={ui.primary} onClick={() => setShowProfile(true)}><img className={overview.paintedIcon} src="/images/ui/creature-overview-a-v2/painted-r4/profile.webp" alt=""/>Profile & Care</button>
                  <button type="button" onClick={() => openHabitat(selectedCreature)}>
                    <img className={overview.paintedIcon} src="/images/ui/creature-overview-a-v2/painted-r4/habitat.webp" alt=""/>Habitat
                  </button>
                  <button type="button" onClick={openInventory}>
                    <img className={overview.paintedIcon} src="/images/ui/creature-overview-a-v2/painted-r4/inventory.webp" alt=""/>Inventory
                  </button>
                  <details className={dossier.moreActions}>
                    <summary>More actions</summary>
                    <div>
                      <button type="button" onClick={() => openBreedingForCreature(selectedCreature)}>Breeding</button>
                      <button type="button" onClick={() => {beginCompareWith(selectedCreature);setViewMode("cards");}}>Compare</button>
                    </div>
                  </details>
                </div>
                  </div>
                </div>

              </>
            ) : (
              <div className={styles.noSelection}>No creature selected.</div>
            )}
          </section>
        </section>
      </section>

      {showArtwork && selectedCreature ? <GameDialog title={`${selectedCreature.nickname} artwork`} onClose={()=>setShowArtwork(false)}><img style={{width:"100%",height:"min(65vh,650px)",objectFit:"contain"}} src={getEquineGameplayProfileSprite(selectedCreature,getNylaGameplayProfileSprite(selectedCreature,getVariantDefinition(selectedCreature.variantId).profilePath || CREATURE_PLACEHOLDER_IMAGE))} alt={`${selectedCreature.nickname} full body`}/></GameDialog> : null}
      {viewMode==='cards' && !compareMode ? <CreatureCardsC save={activeSave} creatures={visibleCreatures} selectedId={cardsPreviewId??selectedCreature?.creatureId} search={filters.search} filterCount={activeFilterCount} pageKey={JSON.stringify([filters,sortMode,sortDirection])} onSearch={search=>patchFilters({search})} onFilters={()=>setShowFilters(true)} onClear={clearFilters} onClose={()=>setViewMode('compact')} onOpen={c=>{selectCreature(c);setShowDossier(true);setViewMode('compact');}} onCompare={c=>{setCompareIds([c.creatureId]);setCompareMode(true);}} onFavorite={toggleFavorite} onLock={c=>toggleCreatureLock(c.creatureId)}/> : null}
      {showFilters ? <RosterFiltersC save={activeSave} filters={filters} sort={sortMode} direction={sortDirection} onClose={()=>setShowFilters(false)} onApply={(next,sort,direction)=>{setFilters(next);setSortMode(sort);setSortDirection(direction);setShowFilters(false);}}/> : null}
      {showProfile && selectedCreature ? <CreatureProfileCardA save={activeSave} creature={selectedCreature} onClose={()=>setShowProfile(false)} onToggleLock={()=>toggleCreatureLock(selectedCreature.creatureId)} onSupplies={()=>{setShowProfile(false);openInventory();}} onCare={()=>{setShowProfile(false);setProfileSectionRequest(current=>({tab:'care',request:(current?.request??0)+1}));}} onProfile={()=>{setShowProfile(false);setProfileSectionRequest(current=>({tab:'overview',request:(current?.request??0)+1}));}}/> : null}
      {viewMode==='cards' && compareMode ? <CreatureCompareChooserA save={activeSave} creatures={visibleCreatures} ids={compareIds} onToggle={toggleCompareSelection} onClose={()=>{setViewMode('compact');setCompareMode(false);}} onCompare={()=>{setViewMode('compact');setCompareTab('stats');setShowCompare(true);}}/> : null}
      {showCompare && compareCreatures.length===2 ? <CreatureComparisonA key={compareIds.join(':')} save={activeSave} creatures={compareCreatures as [CreatureRecord,CreatureRecord]} tab={compareTab} onTab={setCompareTab} onClose={()=>{setShowCompare(false);setRosterCollapsed(false);}} onChange={()=>{setShowCompare(false);setCompareMode(true);setViewMode('cards');}} onBreed={openBreedingPair}/> : null}

      {confirmMode && selectedCreature ? (
        <CreatureRemovalWindow key={`${confirmMode}-${selectedCreature.creatureId}`} creatureId={selectedCreature.creatureId} mode={confirmMode} onClose={() => setConfirmMode(null)} onRemoved={() => {setConfirmMode(null); setSelectedCreatureId(null);}}/>
      ) : null}
    </main>
  );
}
