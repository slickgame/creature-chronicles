"use client";

import { getEquineGameplayCardSprite, getEquineGameplayProfileSprite } from "@/data/equineGameplayArt";
import { getNylaGameplayCardSprite, getNylaGameplayProfileSprite } from "@/data/nylaGameplayArt";
import { careStatusTone } from "@/data/carePresentation";
import { CreatureRemovalWindow } from '@/features/creatures/CreatureRemovalWindow';
import { useMemo, useState, type ReactNode } from "react";
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
  getSpeciesDefinition,
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
import { CreaturePickerA } from './CreaturePickerA';

type ViewMode = "compact" | "cards";
type CompareTab = "overview" | "stats" | "breeding";

function displaySex(sex: string): string {
  return sex === "female" ? "Female" : "Male";
}

function formatLastBred(daysSinceBred: number | null): string {
  if (daysSinceBred === null) return "Never bred";
  if (daysSinceBred === 0) return "Bred today";
  if (daysSinceBred === 1) return "Bred yesterday";
  return `Last bred ${daysSinceBred} days ago`;
}

function roleLabel(ready: boolean, reason: string | null): string {
  if (ready) return "Ready";
  return reason?.split(".")[0] ?? "Unavailable";
}

export function CollectionScreen({ headerLinks }: { headerLinks?: ReactNode }) {
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
  const [showArtwork, setShowArtwork] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [showDossier, setShowDossier] = useState(false);
  const [filters, setFilters] = useState<CreatureManagementFilters>(
    DEFAULT_CREATURE_MANAGEMENT_FILTERS,
  );
  const [sortMode, setSortMode] = useState<CreatureSortMode>("newest");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("compact");
  const [selectedCreatureId, setSelectedCreatureId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [confirmMode, setConfirmMode] = useState<"release" | "donate" | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [showCompare, setShowCompare] = useState(false);
  const [compareTab, setCompareTab] = useState<CompareTab>("overview");
  const [message, setMessage] = useState(
    "Search, filter, compare, protect, and route creatures to ranch systems.",
  );

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
    setRosterCollapsed(true);
    setRenameValue(creature.nickname);
    setConfirmMode(null);
    setMessage(`${creature.nickname} selected.`);
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
    setMessage(
      creature.isFavorite
        ? `${creature.nickname} removed from favorites.`
        : `${creature.nickname} added to favorites.`,
    );
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
    setMessage(`Choose one more creature to compare with ${creature.nickname}.`);
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
    setMessage(`${selectedCreature.nickname} was renamed to ${renameValue.trim()}.`);
  }


  function renderCreatureCard(creature: CreatureRecord, detailed = false) {
                  const status = getCreatureManagementStatus(activeSave, creature);
                  const variant = getVariantDefinition(creature.variantId);
                  const species = getSpeciesDefinition(creature.speciesId);
                  const isSelected = selectedCreature?.creatureId === creature.creatureId;
                  const isCompared = compareIds.includes(creature.creatureId);
                  return (
                    <article
                      key={creature.creatureId}
                      className={`${styles.creatureCard} ${
                        detailed ? styles.detailedCard : ""
                      } ${isSelected ? styles.selectedCard : ""} ${
                        status.needsAttention ? styles.attentionCard : ""
                      } ${creature.shiny ? styles.shinyCard : ""}`}
                    >
                      {compareMode && detailed ? (
                        <label className={styles.compareCheck}>
                          <input
                            type="checkbox"
                            checked={isCompared}
                            onChange={() => toggleCompareSelection(creature)}
                          />
                          Compare
                        </label>
                      ) : null}
                      <button
                        type="button"
                        aria-pressed={compareMode && detailed ? isCompared : isSelected}
                        aria-label={`Select ${creature.nickname}`}
                        data-creature-id={creature.creatureId}
                        className={styles.cardMain}
                        onClick={() =>
                          compareMode && detailed
                            ? toggleCompareSelection(creature)
                            : (selectCreature(creature), setShowDossier(true), setViewMode("compact"))
                        }
                      >
                        <img
                          src={getEquineGameplayCardSprite(creature, getNylaGameplayCardSprite(creature, variant.portraitPath || CREATURE_PLACEHOLDER_IMAGE))}
                          alt=""
                          onError={(event) => {
                            event.currentTarget.onerror = null;
                            event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE;
                          }}
                        />
                        <div className={styles.cardText}>
                          <strong>
                            {creature.nickname} {creature.shiny ? "✦" : ""}
                          </strong>
                          <span>
                            {variant.name} {species.name} · Lv {creature.level}
                          </span>
                          <em>{status.primaryStatus}</em>
                          <span className={styles.energyLabel}>Energy {creature.energy}/{creature.maxEnergy}</span><span className={styles.energyTrack}><span style={{width: `${status.energyPercent}%`}} /></span>
                          {detailed ? <><div className={styles.cardMetrics}>
                            <b>Energy {status.energyPercent}%</b>
                            <b>Aff {creature.affection}</b>
                            <b>FER {creature.stats.FER}/{creature.statGrades.FER}</b>
                          </div>
                          <div className={styles.roleBadges}>
                            <i className={status.giverEligible ? styles.readyBadge : styles.blockedBadge}>
                              Giver {roleLabel(status.giverEligible, status.giverBlockedReason)}
                            </i>
                            <i className={status.receiverEligible ? styles.readyBadge : styles.blockedBadge}>
                              Receiver {roleLabel(status.receiverEligible, status.receiverBlockedReason)}
                            </i>
                          </div>
                          </> : null}
                          {detailed ? (
                            <small>{formatLastBred(status.daysSinceBred)} · {status.rarity} · Gen {creature.generation}</small>
                          ) : null}
                        </div>
                      </button>
                      <div className={styles.cardIcons}>
                        <button
                          type="button"
                          aria-label={creature.isFavorite ? "Remove favorite" : "Add favorite"}
                          title={creature.isFavorite ? "Remove favorite" : "Add favorite"}
                          onClick={() => toggleFavorite(creature)}
                        >
                          <span className={styles.actionIcon} aria-hidden="true" style={{ maskImage: "url(/images/ui/ranch-dossier-v1/icons/talents.svg)", opacity: creature.isFavorite ? 1 : .5 }} />
                        </button>
                        <button
                          type="button"
                          aria-label={creature.isLocked ? "Unlock creature" : "Lock creature"}
                          title={creature.isLocked ? "Unlock creature" : "Lock creature"}
                          onClick={() => toggleCreatureLock(creature.creatureId)}
                        >
                          <span className={styles.actionIcon} aria-hidden="true" style={{ maskImage: `url(/images/ui/ranch-dossier-v1/icons/${creature.isLocked ? "lock" : "unlock"}.svg)` }} />
                        </button>
                      </div>
                    </article>
                  );

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
            onCards={()=>{setCompareMode(false);setViewMode('cards');}}
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
      {viewMode === "cards" && !compareMode ? <GameDialog title={compareMode ? "Choose Creatures to Compare" : "Creature Cards"} onClose={() => {setViewMode("compact");setCompareMode(false);}} wide>{compareMode ? <p>{compareIds.length}/2 selected</p> : null}<div className={styles.cardGallery}>{visibleCreatures.map(creature => renderCreatureCard(creature,true))}</div>{compareMode ? <button type="button" disabled={compareIds.length !== 2} onClick={() => {setViewMode("compact");setCompareTab("overview");setShowCompare(true);}}>Compare Creatures</button> : null}</GameDialog> : null}
      {showFilters ? <RosterFiltersC save={activeSave} filters={filters} sort={sortMode} direction={sortDirection} onClose={()=>setShowFilters(false)} onApply={(next,sort,direction)=>{setFilters(next);setSortMode(sort);setSortDirection(direction);setShowFilters(false);}}/> : null}
      {showProfile && selectedCreature ? <GameDialog title={`${selectedCreature.nickname} · Profile & Care`} onClose={() => setShowProfile(false)} wide>
                <SharedCreatureDetail
                  creature={selectedCreature}
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
                  dossier
                  ranchDossier
                  showDossierPortrait
                />
        <p role="status">{message}</p>
      </GameDialog> : null}
      {viewMode==='cards' && compareMode ? <CreatureCompareChooserA save={activeSave} creatures={visibleCreatures} ids={compareIds} onToggle={toggleCompareSelection} onClose={()=>{setViewMode('compact');setCompareMode(false);}} onCompare={()=>{setViewMode('compact');setCompareTab('stats');setShowCompare(true);}}/> : null}
      {showCompare && compareCreatures.length===2 ? <CreatureComparisonA key={compareIds.join(':')} save={activeSave} creatures={compareCreatures as [CreatureRecord,CreatureRecord]} tab={compareTab} onTab={setCompareTab} onClose={()=>{setShowCompare(false);setRosterCollapsed(false);}} onChange={()=>{setShowCompare(false);setCompareMode(true);setViewMode('cards');}} onBreed={openBreedingPair}/> : null}

      {confirmMode && selectedCreature ? (
        <CreatureRemovalWindow key={`${confirmMode}-${selectedCreature.creatureId}`} creatureId={selectedCreature.creatureId} mode={confirmMode} onClose={() => setConfirmMode(null)} onRemoved={result => {setMessage(result); setConfirmMode(null); setSelectedCreatureId(null);}}/>
      ) : null}
    </main>
  );
}
