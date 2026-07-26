"use client";

import { useMemo, useState } from "react";
import {
  DEFAULT_CREATURE_MANAGEMENT_FILTERS,
  filterAndSortManagedCreatures,
  getCreatureManagementStatus,
  getCreatureManagementSummary,
  getPairManagementSummary,
  type CreatureManagementFilters,
  type CreatureSortMode,
  type SortDirection,
} from "@/data/creatureManagement";
import {
  COLLECTION_ASSETS,
  getBestStatLabels,
} from "@/data/collection";
import {
  CREATURE_PLACEHOLDER_IMAGE,
  STAT_KEYS,
  getSpeciesDefinition,
  getVariantDefinition,
} from "@/data/creatures";
import { SharedCreatureDetail, SHARED_STAT_LABELS } from "@/features/creatures/CreatureDetailPanels";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureRecord } from "@/types/creature";
import styles from "./CollectionScreen.module.css";

const FAMILY_OPTIONS = [
  ["all", "All Families"],
  ["feline", "Feline"],
  ["canine", "Canine"],
  ["bovine", "Bovine"],
  ["lapine", "Lapine"],
  ["equine", "Equine"],
] as const;

const STATUS_OPTIONS = [
  ["all", "All Statuses"],
  ["ready", "Breeding Ready"],
  ["pregnant", "Pregnant"],
  ["recovering", "Recovering"],
  ["recently-bred", "Recently Bred"],
  ["injured", "Injured"],
  ["training", "Training"],
  ["low-energy", "Low Energy"],
  ["attention", "Needs Attention"],
] as const;

const SORT_OPTIONS: Array<{ value: CreatureSortMode; label: string }> = [
  { value: "name", label: "Name" },
  { value: "newest", label: "Newest" },
  { value: "level", label: "Level" },
  { value: "energy", label: "Energy %" },
  { value: "affection", label: "Affection" },
  { value: "fertility", label: "Fertility" },
  { value: "rarity", label: "Rarity" },
  { value: "variant", label: "Variant" },
  { value: "best-grade", label: "Best Grade" },
  { value: "generation", label: "Generation" },
];

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

export function CollectionScreen() {
  const {
    currentSave,
    donateCreature,
    goToBreeding,
    goToHabitat,
    goToRanch,
    releaseCreature,
    renameCreature,
    saveCurrentGame,
    toggleCreatureLock,
  } = useGameContext();
  const [filters, setFilters] = useState<CreatureManagementFilters>(
    DEFAULT_CREATURE_MANAGEMENT_FILTERS,
  );
  const [sortMode, setSortMode] = useState<CreatureSortMode>("newest");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("compact");
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
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
    if (!visibleCreatures.length) return null;
    return (
      visibleCreatures.find(
        (creature) => creature.creatureId === selectedCreatureId,
      ) ?? visibleCreatures[0]
    );
  }, [selectedCreatureId, visibleCreatures]);
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
  const variantOptions = useMemo(() => {
    if (!currentSave) return [];
    const variants = (currentSave.creatures ?? [])
      .map((creature) => getVariantDefinition(creature.variantId))
      .filter(
        (variant) => filters.family === "all" || variant.family === filters.family,
      );
    return Array.from(
      new Map(variants.map((variant) => [variant.variantId, variant])).values(),
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [currentSave, filters.family]);

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
    setSelectedCreatureId(null);
  }

  function clearFilters() {
    setFilters(DEFAULT_CREATURE_MANAGEMENT_FILTERS);
    setSelectedCreatureId(null);
  }

  function selectCreature(creature: CreatureRecord) {
    setSelectedCreatureId(creature.creatureId);
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

  function openInventory(creature: CreatureRecord) {
    window.dispatchEvent(
      new CustomEvent("creature-chronicles:open-inventory-creature", {
        detail: { creatureId: creature.creatureId },
      }),
    );
  }

  function handleRename() {
    if (!selectedCreature || !renameValue.trim()) return;
    renameCreature(selectedCreature.creatureId, renameValue.trim());
    setMessage(`${selectedCreature.nickname} was renamed to ${renameValue.trim()}.`);
  }

  function handleConfirmedAction() {
    if (!selectedCreature || !confirmMode) return;
    const result =
      confirmMode === "donate"
        ? donateCreature(selectedCreature.creatureId)
        : releaseCreature(selectedCreature.creatureId);
    setMessage(result);
    setConfirmMode(null);
    setSelectedCreatureId(null);
  }

  return (
    <main className={styles.screen}>
      <section className={styles.frame}>
        <header className={styles.header}>
          <div>
            <p className={styles.kicker}>Creature Management</p>
            <h1>Ranch Roster</h1>
            <p>{message}</p>
          </div>
          <div className={styles.headerActions}>
            <div className={styles.viewButtons}>
              <button
                type="button"
                className={viewMode === "compact" ? styles.activeButton : ""}
                onClick={() => setViewMode("compact")}
              >
                Compact
              </button>
              <button
                type="button"
                className={viewMode === "cards" ? styles.activeButton : ""}
                onClick={() => setViewMode("cards")}
              >
                Cards
              </button>
              <button
                type="button"
                className={compareMode ? styles.activeButton : ""}
                onClick={() => {
                  setCompareMode((current) => !current);
                  setCompareIds([]);
                }}
              >
                Compare
              </button>
            </div>
            <button type="button" onClick={goToRanch}>Back to Ranch</button>
          </div>
        </header>

        <section className={styles.summaryStrip}>
          <SummaryPill label="Total" value={summary.total} />
          <SummaryPill label="Breeding Ready" value={summary.ready} />
          <SummaryPill label="Pregnant" value={summary.pregnant} />
          <SummaryPill label="Need Attention" value={summary.attention} />
          <SummaryPill label="Favorites" value={summary.favorites} />
          <span className={styles.resultCount}>
            Showing {visibleCreatures.length} of {summary.total}
          </span>
        </section>

        <section className={styles.toolbar}>
          <input
            type="search"
            value={filters.search}
            placeholder="Search name, species, or variant..."
            onChange={(event) => patchFilters({ search: event.target.value })}
          />
          <select
            value={filters.family}
            onChange={(event) =>
              patchFilters({
                family: event.target.value as CreatureManagementFilters["family"],
                variantId: "all",
              })
            }
          >
            {FAMILY_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={filters.status}
            onChange={(event) =>
              patchFilters({
                status: event.target.value as CreatureManagementFilters["status"],
              })
            }
          >
            {STATUS_OPTIONS.map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <select
            value={sortMode}
            onChange={(event) => setSortMode(event.target.value as CreatureSortMode)}
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <button
            type="button"
            aria-label="Reverse sort direction"
            onClick={() =>
              setSortDirection((current) => (current === "asc" ? "desc" : "asc"))
            }
          >
            {sortDirection === "asc" ? "↑" : "↓"}
          </button>
          <button
            type="button"
            className={showAdvancedFilters ? styles.activeButton : ""}
            onClick={() => setShowAdvancedFilters((current) => !current)}
          >
            More Filters {activeFilterCount ? `(${activeFilterCount})` : ""}
          </button>
          <button type="button" disabled={!activeFilterCount} onClick={clearFilters}>
            Clear
          </button>
        </section>

        {showAdvancedFilters ? (
          <section className={styles.advancedFilters}>
            <FilterSelect
              label="Sex"
              value={filters.sex}
              onChange={(value) =>
                patchFilters({ sex: value as CreatureManagementFilters["sex"] })
              }
              options={[
                ["all", "All"],
                ["female", "Female"],
                ["male", "Male"],
              ]}
            />
            <FilterSelect
              label="Pregnancy"
              value={filters.pregnancy}
              onChange={(value) =>
                patchFilters({
                  pregnancy: value as CreatureManagementFilters["pregnancy"],
                })
              }
              options={[
                ["all", "All"],
                ["not-pregnant", "Not Pregnant"],
                ["pregnant", "Pregnant"],
                ["due-soon", "Due Soon"],
                ["recovering", "Recovering"],
              ]}
            />
            <FilterSelect
              label="Energy"
              value={filters.energy}
              onChange={(value) =>
                patchFilters({ energy: value as CreatureManagementFilters["energy"] })
              }
              options={[
                ["all", "All"],
                ["full", "Full"],
                ["ready", "Ready"],
                ["tired", "Tired"],
                ["exhausted", "Exhausted"],
              ]}
            />
            <FilterSelect
              label="Rarity"
              value={filters.rarity}
              onChange={(value) =>
                patchFilters({ rarity: value as CreatureManagementFilters["rarity"] })
              }
              options={[
                ["all", "All"],
                ["Common", "Common"],
                ["Uncommon", "Uncommon"],
                ["Rare", "Rare"],
                ["Epic", "Epic"],
              ]}
            />
            <FilterSelect
              label="Variant"
              value={filters.variantId}
              onChange={(value) => patchFilters({ variantId: value })}
              options={[
                ["all", "All Variants"],
                ...variantOptions.map((variant) => [variant.variantId, variant.name] as const),
              ]}
            />
            <FilterSelect
              label="Origin"
              value={filters.origin}
              onChange={(value) =>
                patchFilters({ origin: value as CreatureManagementFilters["origin"] })
              }
              options={[
                ["all", "All"],
                ["starter", "Starter"],
                ["hatched", "Hatched"],
                ["market", "Market"],
                ["guild", "Guild"],
              ]}
            />
            <FilterToggle
              label="Favorites"
              checked={filters.favoritesOnly}
              onChange={(checked) => patchFilters({ favoritesOnly: checked })}
            />
            <FilterToggle
              label="Locked"
              checked={filters.lockedOnly}
              onChange={(checked) => patchFilters({ lockedOnly: checked })}
            />
            <FilterToggle
              label="Shiny"
              checked={filters.shinyOnly}
              onChange={(checked) => patchFilters({ shinyOnly: checked })}
            />
          </section>
        ) : null}

        {compareMode && compareIds.length ? (
          <section className={styles.compareBar}>
            <strong>
              {compareCreatures.map((creature) => creature.nickname).join(" · ")}
            </strong>
            <span>{compareIds.length}/2 selected</span>
            <button type="button" onClick={() => setCompareIds([])}>Clear</button>
            <button
              type="button"
              disabled={compareIds.length !== 2}
              onClick={() => {
                setCompareTab("overview");
                setShowCompare(true);
              }}
            >
              Compare Creatures
            </button>
          </section>
        ) : null}

        <section className={styles.contentGrid}>
          <aside className={styles.listPanel}>
            <div className={styles.listHeader}>
              <h2>Creatures</h2>
              <img src={COLLECTION_ASSETS.sortFilter} alt="" />
            </div>
            <div className={`${styles.creatureList} ${viewMode === "cards" ? styles.cardView : ""}`}>
              {visibleCreatures.length ? (
                visibleCreatures.map((creature) => {
                  const status = getCreatureManagementStatus(activeSave, creature);
                  const variant = getVariantDefinition(creature.variantId);
                  const species = getSpeciesDefinition(creature.speciesId);
                  const isSelected = selectedCreature?.creatureId === creature.creatureId;
                  const isCompared = compareIds.includes(creature.creatureId);
                  return (
                    <article
                      key={creature.creatureId}
                      className={`${styles.creatureCard} ${
                        viewMode === "cards" ? styles.detailedCard : ""
                      } ${isSelected ? styles.selectedCard : ""} ${
                        status.needsAttention ? styles.attentionCard : ""
                      } ${creature.shiny ? styles.shinyCard : ""}`}
                    >
                      {compareMode ? (
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
                        className={styles.cardMain}
                        onClick={() =>
                          compareMode
                            ? toggleCompareSelection(creature)
                            : selectCreature(creature)
                        }
                      >
                        <img
                          src={variant.portraitPath || CREATURE_PLACEHOLDER_IMAGE}
                          alt=""
                          onError={(event) => {
                            event.currentTarget.src = CREATURE_PLACEHOLDER_IMAGE;
                          }}
                        />
                        <div className={styles.cardText}>
                          <strong>
                            {creature.nickname} {creature.shiny ? "✦" : ""}
                          </strong>
                          <span>
                            {variant.name} {species.name} · Lv {creature.level} · {displaySex(status.sex)}
                          </span>
                          <em>{status.primaryStatus}</em>
                          <div className={styles.cardMetrics}>
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
                          {viewMode === "cards" ? (
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
                          {creature.isFavorite ? "★" : "☆"}
                        </button>
                        <button
                          type="button"
                          aria-label={creature.isLocked ? "Unlock creature" : "Lock creature"}
                          title={creature.isLocked ? "Unlock creature" : "Lock creature"}
                          onClick={() => toggleCreatureLock(creature.creatureId)}
                        >
                          {creature.isLocked ? "🔒" : "🔓"}
                        </button>
                      </div>
                    </article>
                  );
                })
              ) : (
                <div className={styles.noResults}>
                  <strong>No creatures match these filters.</strong>
                  <button type="button" onClick={clearFilters}>Clear Filters</button>
                </div>
              )}
            </div>
          </aside>

          <section className={styles.detailPanel}>
            {selectedCreature ? (
              <>
                <div className={styles.quickActions}>
                  <button type="button" onClick={() => openBreedingForCreature(selectedCreature)}>
                    Breeding
                  </button>
                  <button type="button" onClick={() => openHabitat(selectedCreature)}>
                    Habitat
                  </button>
                  <button type="button" onClick={() => openInventory(selectedCreature)}>
                    Inventory
                  </button>
                  <button type="button" onClick={() => beginCompareWith(selectedCreature)}>
                    Compare
                  </button>
                </div>
                <SharedCreatureDetail
                  creature={selectedCreature}
                  dayNumber={activeSave.dayState.dayNumber}
                  renameValue={renameValue || selectedCreature.nickname}
                  onRenameValueChange={setRenameValue}
                  onRename={handleRename}
                  onToggleLock={() => toggleCreatureLock(selectedCreature.creatureId)}
                  onRelease={() => setConfirmMode("release")}
                  onDonate={() => setConfirmMode("donate")}
                  bestStatLabels={getBestStatLabels(selectedCreature)}
                  statusNote={getCreatureManagementStatus(activeSave, selectedCreature).primaryStatus}
                  fitViewport
                />
              </>
            ) : (
              <div className={styles.noSelection}>No creature selected.</div>
            )}
          </section>
        </section>
      </section>

      {showCompare && compareCreatures.length === 2 ? (
        <CompareOverlay
          save={activeSave}
          creatures={compareCreatures as [CreatureRecord, CreatureRecord]}
          activeTab={compareTab}
          onTabChange={setCompareTab}
          onClose={() => setShowCompare(false)}
          onBreed={openBreedingPair}
        />
      ) : null}

      {confirmMode && selectedCreature ? (
        <div className={styles.modalBackdrop} role="presentation" onClick={() => setConfirmMode(null)}>
          <section className={styles.confirmModal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
            <button type="button" className={styles.closeButton} onClick={() => setConfirmMode(null)}>×</button>
            <img src={confirmMode === "donate" ? COLLECTION_ASSETS.donate : COLLECTION_ASSETS.release} alt="" />
            <h2>{confirmMode === "donate" ? "Donate Creature?" : "Release Creature?"}</h2>
            <p>
              {selectedCreature.isLocked
                ? `${selectedCreature.nickname} is locked. Unlock them first.`
                : `This will remove ${selectedCreature.nickname} from your ranch.`}
            </p>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => setConfirmMode(null)}>Cancel</button>
              <button type="button" disabled={selectedCreature.isLocked} onClick={handleConfirmedAction}>
                {confirmMode === "donate" ? "Donate" : "Release"}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </main>
  );
}

function SummaryPill({ label, value }: { label: string; value: number }) {
  return (
    <article className={styles.summaryPill}>
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: ReadonlyArray<readonly [string, string]>;
  onChange: (value: string) => void;
}) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>{optionLabel}</option>
        ))}
      </select>
    </label>
  );
}

function FilterToggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className={styles.filterToggle}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>{label} Only</span>
    </label>
  );
}

function CompareOverlay({
  save,
  creatures,
  activeTab,
  onTabChange,
  onClose,
  onBreed,
}: {
  save: Parameters<typeof getCreatureManagementStatus>[0];
  creatures: [CreatureRecord, CreatureRecord];
  activeTab: CompareTab;
  onTabChange: (tab: CompareTab) => void;
  onClose: () => void;
  onBreed: (a: CreatureRecord, b: CreatureRecord, swap?: boolean) => void;
}) {
  const [a, b] = creatures;
  const statusA = getCreatureManagementStatus(save, a);
  const statusB = getCreatureManagementStatus(save, b);
  const pair = getPairManagementSummary(save, a, b);

  return (
    <div className={styles.modalBackdrop} role="presentation" onClick={onClose}>
      <section className={styles.compareModal} role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        <button type="button" className={styles.closeButton} onClick={onClose}>×</button>
        <header>
          <p className={styles.kicker}>Creature Comparison</p>
          <h2>{a.nickname} × {b.nickname}</h2>
        </header>
        <nav className={styles.compareTabs}>
          {(["overview", "stats", "breeding"] as CompareTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              className={activeTab === tab ? styles.activeButton : ""}
              onClick={() => onTabChange(tab)}
            >
              {tab === "stats" ? "Stats & Talents" : tab[0].toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </nav>

        {activeTab === "overview" ? (
          <div className={styles.compareColumns}>
            <CompareIdentity creature={a} status={statusA} />
            <CompareIdentity creature={b} status={statusB} />
          </div>
        ) : null}

        {activeTab === "stats" ? (
          <div className={styles.compareStats}>
            <div className={styles.compareStatHeader}><span>Attribute</span><strong>{a.nickname}</strong><strong>{b.nickname}</strong></div>
            {STAT_KEYS.map((key) => {
              const valueA = a.stats[key];
              const valueB = b.stats[key];
              return (
                <div key={key}>
                  <span>{SHARED_STAT_LABELS[key]}</span>
                  <strong className={valueA > valueB ? styles.higherValue : ""}>{valueA} / {a.statGrades[key]}</strong>
                  <strong className={valueB > valueA ? styles.higherValue : ""}>{valueB} / {b.statGrades[key]}</strong>
                </div>
              );
            })}
            <section className={styles.talentCompare}>
              <TalentList title={a.nickname} creature={a} />
              <TalentList title={b.nickname} creature={b} />
            </section>
          </div>
        ) : null}

        {activeTab === "breeding" ? (
          <div className={styles.breedingCompare}>
            <div className={styles.compareColumns}>
              <RoleSummary creature={a} status={statusA} />
              <RoleSummary creature={b} status={statusB} />
            </div>
            <div className={styles.pairSummary}>
              <strong>Pair Familiarity: {pair.streak}</strong>
              <span>Lineage: {pair.lineageLabel}</span>
              <span>{formatLastBred(Math.min(statusA.daysSinceBred ?? 999, statusB.daysSinceBred ?? 999) === 999 ? null : Math.min(statusA.daysSinceBred ?? 999, statusB.daysSinceBred ?? 999))}</span>
            </div>
            <div className={styles.modalActions}>
              <button type="button" onClick={() => onBreed(a, b)}>{a.nickname} Giver / {b.nickname} Receiver</button>
              <button type="button" onClick={() => onBreed(a, b, true)}>{b.nickname} Giver / {a.nickname} Receiver</button>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function CompareIdentity({
  creature,
  status,
}: {
  creature: CreatureRecord;
  status: ReturnType<typeof getCreatureManagementStatus>;
}) {
  const variant = getVariantDefinition(creature.variantId);
  const species = getSpeciesDefinition(creature.speciesId);
  return (
    <article className={styles.compareIdentity}>
      <img src={variant.profilePath || variant.portraitPath || CREATURE_PLACEHOLDER_IMAGE} alt="" />
      <h3>{creature.nickname} {creature.shiny ? "✦" : ""}</h3>
      <p>{variant.name} {species.name}</p>
      <dl>
        <div><dt>Level</dt><dd>{creature.level}</dd></div>
        <div><dt>Generation</dt><dd>{creature.generation}</dd></div>
        <div><dt>Sex</dt><dd>{displaySex(status.sex)}</dd></div>
        <div><dt>Rarity</dt><dd>{status.rarity}</dd></div>
        <div><dt>Energy</dt><dd>{status.energyPercent}%</dd></div>
        <div><dt>Affection</dt><dd>{creature.affection}</dd></div>
        <div><dt>Status</dt><dd>{status.primaryStatus}</dd></div>
        <div><dt>Protection</dt><dd>{creature.isLocked ? "Locked" : "Unlocked"}</dd></div>
      </dl>
    </article>
  );
}

function TalentList({ title, creature }: { title: string; creature: CreatureRecord }) {
  return (
    <article>
      <h3>{title}</h3>
      {creature.abilities.length ? (
        creature.abilities.map((ability) => (
          <p key={ability.id}><strong>{ability.name}</strong> · Grade {ability.grade}</p>
        ))
      ) : (
        <p>No talents.</p>
      )}
    </article>
  );
}

function RoleSummary({
  creature,
  status,
}: {
  creature: CreatureRecord;
  status: ReturnType<typeof getCreatureManagementStatus>;
}) {
  return (
    <article className={styles.roleSummary}>
      <h3>{creature.nickname}</h3>
      <p><strong>Giver:</strong> {roleLabel(status.giverEligible, status.giverBlockedReason)}</p>
      <p><strong>Receiver:</strong> {roleLabel(status.receiverEligible, status.receiverBlockedReason)}</p>
      <p><strong>Fertility:</strong> {creature.stats.FER} / Grade {creature.statGrades.FER}</p>
      <p><strong>Affection:</strong> {creature.affection}</p>
      <p><strong>History:</strong> {formatLastBred(status.daysSinceBred)}</p>
    </article>
  );
}
