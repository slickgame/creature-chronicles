"use client";

import { useMemo, useState } from "react";
import {
  EGG_ATELIER_EGG_OFFERS,
  EGG_ATELIER_UPGRADES,
  SELENE_VIRELL,
  applyAbilityPolish,
  applyAcceleratedIncubation,
  applyStatConditioning,
  buyEggFromSelene,
  canBuyEggOffer,
  donateEggToResearch,
  getEggAtelierAbilityPolishChance,
  getEggAtelierEggLabel,
  getEggAtelierServiceCost,
  getEggAtelierStatConditioningChance,
  getEggAtelierUpgradeEffects,
  getEggSaleValue,
  getNurserySupplyKitCount,
  hasEggAtelierServiceUsed,
  hasEggAtelierUpgrade,
  purchaseEggAtelierUpgrade,
  sellEggToSelene,
} from "@/data/eggAtelier";
import { NURSERY_ASSETS, getLineageRiskLabel } from "@/data/nursery";
import {
  getNpcNextUnlock,
  getNpcTrustRecord,
  getNpcTrustSummary,
} from "@/data/townNpcs";
import { getSpeciesDefinition, getVariantDefinition } from "@/data/creatures";
import {
  QUICKHATCH_CATALYST,
  getQuickhatchCatalystCount,
} from "@/data/tutorialQuickhatch";
import { formatGold } from "@/lib/formatters";
import { useGameContext } from "@/state/GameProvider";
import type { EggId } from "@/types/ids";
import type { EggRecord, GameSave } from "@/types/save";
import styles from "./EggAtelierScreen.module.css";

const ICONS = {
  clinic: "/images/ui/icons/icon_egg.png",
  egg: NURSERY_ASSETS.egg,
  hatch: NURSERY_ASSETS.hatch,
  price: "/images/ui/icons/icon_price_tag.png",
  kit: "/images/ui/icons/icon_nursery_upgrade.png",
  selene: SELENE_VIRELL.portraitPath,
  furniture: "/images/ui/icons/icon_sleep_recovery.png",
  incubatorTable: "/images/props/town/egg_atelier_incubator_table.png",
  furnitureCatalog: "/images/props/town/egg_atelier_furniture_catalog.png",
  eggRegistry: "/images/props/town/egg_atelier_egg_registry.png",
  ledger: "/images/ui/icons/icon_parent_compare.png",
  timer: "/images/ui/icons/icon_timer_hourglass.png",
  polish: "/images/ui/icons/icon_quality_screening.png",
  stat: "/images/ui/icons/icon_stat_growth.png",
  care: "/images/ui/icons/icon_hatch.png",
} as const;

const SELENE_GREETING =
  "Welcome in. Set the egg gently on the padded table, not the counter. I can appraise, condition, polish, register, or sell you a carefully documented placement egg.";

type AtelierMode =
  | "interior"
  | "services"
  | "eggs"
  | "furniture"
  | "talk"
  | "trust";

function getEggSubtitle(egg: EggRecord): string {
  const variant = getVariantDefinition(egg.variantId);
  const species = getSpeciesDefinition(egg.speciesId);
  return `${variant.name} ${species.name} • ${
    egg.lineageRiskLabel ?? getLineageRiskLabel(egg.lineageRisk)
  }`;
}

function getBestStatLabel(egg: EggRecord): string {
  const entries = Object.entries(egg.projectedStatGrades);
  const order = ["F", "D", "C", "B", "A", "S"];
  const best = entries.sort(
    (a, b) => order.indexOf(b[1]) - order.indexOf(a[1]),
  )[0];
  return best ? `${best[0]} Grade ${best[1]}` : "No projected grade";
}

function getStatLine(egg: EggRecord): string {
  return Object.entries(egg.projectedStatGrades)
    .map(([key, grade]) => `${key} ${grade}`)
    .join(" • ");
}

function getAbilityLine(egg: EggRecord): string {
  return egg.projectedAbilities.length
    ? egg.projectedAbilities
        .map((ability) => `${ability.name} ${ability.grade}`)
        .join(" • ")
    : "No projected inherited ability";
}

function AtelierHeader({
  save,
  kitCount,
  message,
  onTown,
  onRanch,
  onMenu,
}: {
  save: GameSave;
  kitCount: number;
  message: string;
  onTown: () => void;
  onRanch: () => void;
  onMenu: () => void;
}) {
  return (
    <header className={styles.header}>
      <div className={styles.headerTitleRow}>
        <div className={styles.locationCrest} aria-hidden="true">
          <img src={ICONS.egg} alt="" />
        </div>
        <div>
          <p className={styles.kicker}>M44 Egg Atelier Interior</p>
          <h1>The Egg Atelier</h1>
          <p className={styles.headerDescription}>
            {SELENE_VIRELL.name}, {SELENE_VIRELL.title}, offers specialist egg
            care without replacing the ranch nursery.
          </p>
          <p className={styles.message}>{message}</p>
        </div>
      </div>

      <div className={styles.headerActions}>
        <div className={styles.statBox}>
          <span>Gold</span>
          <strong>{save.currencies.gold.toLocaleString()}</strong>
        </div>
        <div className={styles.statBox}>
          <span>Nursery Kits</span>
          <strong>{kitCount}</strong>
        </div>
        <button type="button" className={styles.menuButton} onClick={onMenu}>
          <span className={styles.menuGlyph}>☰</span>
          Menu
        </button>
        <button type="button" className={styles.headerButton} onClick={onTown}>
          Back to Town
        </button>
        <button type="button" className={styles.headerButton} onClick={onRanch}>
          Ranch Nursery
        </button>
      </div>
    </header>
  );
}

function SelenePortrait({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <div className={styles.sidePortrait}>
        <img
          src={ICONS.selene}
          alt="Dr. Selene Virell"
          onError={(event) => {
            event.currentTarget.src = ICONS.clinic;
          }}
        />
      </div>
    );
  }

  return (
    <div className={styles.portraitMedallion}>
      <img
        src={ICONS.selene}
        alt="Dr. Selene Virell"
        onError={(event) => {
          event.currentTarget.src = ICONS.clinic;
        }}
      />
    </div>
  );
}

function QuickhatchChip({ save }: { save: GameSave }) {
  const count = getQuickhatchCatalystCount(save);
  if (count <= 0) return null;

  return (
    <div className={styles.inventoryChip}>
      <img src={QUICKHATCH_CATALYST.iconPath} alt="" />
      <span>
        {QUICKHATCH_CATALYST.name} ×{count}
      </span>
    </div>
  );
}

export function EggAtelierScreen() {
  const {
    currentSave,
    goToTown,
    goToRanch,
    goToMainMenu,
    saveCurrentGame,
  } = useGameContext();
  const [selectedEggId, setSelectedEggId] = useState<EggId | null>(null);
  const [message, setMessage] = useState(SELENE_GREETING);
  const [atelierMode, setAtelierMode] = useState<AtelierMode>("interior");

  const activeEggs = useMemo(
    () => (currentSave?.eggs ?? []).filter((egg) => egg.status !== "hatched"),
    [currentSave],
  );
  const selectedEgg = useMemo(
    () =>
      activeEggs.find((egg) => egg.eggId === selectedEggId) ??
      activeEggs[0] ??
      null,
    [activeEggs, selectedEggId],
  );

  if (!currentSave) {
    return (
      <main className={styles.emptyScreen}>
        <section className={styles.emptyPanel}>
          <h1>No active save</h1>
          <p>Load or create a save before visiting the Egg Atelier.</p>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={goToMainMenu}
          >
            Return to Main Menu
          </button>
        </section>
      </main>
    );
  }

  const activeSave = currentSave;

  function runService(service: "accelerated" | "polish" | "stat") {
    if (!selectedEgg) return;
    const result =
      service === "accelerated"
        ? applyAcceleratedIncubation(activeSave, selectedEgg.eggId)
        : service === "stat"
          ? applyStatConditioning(activeSave, selectedEgg.eggId)
          : applyAbilityPolish(activeSave, selectedEgg.eggId);
    if (result.ok) saveCurrentGame(result.save);
    setMessage(result.message);
    setAtelierMode("services");
  }

  function buyUpgrade(upgradeId: string) {
    const result = purchaseEggAtelierUpgrade(activeSave, upgradeId as never);
    if (result.ok) saveCurrentGame(result.save);
    setMessage(result.message);
    setAtelierMode("furniture");
  }

  function buyEggOffer(offerId: string) {
    const result = buyEggFromSelene(activeSave, offerId as never);
    if (result.ok) saveCurrentGame(result.save);
    setMessage(result.message);
    setAtelierMode("eggs");
  }

  function sellSelectedEgg(mode: "sell" | "donate") {
    if (!selectedEgg) return;
    const result =
      mode === "sell"
        ? sellEggToSelene(activeSave, selectedEgg.eggId)
        : donateEggToResearch(activeSave, selectedEgg.eggId);
    if (result.ok) {
      saveCurrentGame(result.save);
      setSelectedEggId(null);
    }
    setMessage(result.message);
    setAtelierMode("eggs");
  }

  function openTalk() {
    const trust = getNpcTrustRecord(activeSave, "selene_virell");
    setMessage(
      trust.level >= 3
        ? "Selene adjusts her spectacles. 'Your records are becoming consistent enough that I can attempt more delicate conditioning without guessing.'"
        : "Selene taps her ledger. 'Egg care is not luck. It is observation, restraint, and clean notes.'",
    );
    setAtelierMode("talk");
  }

  function openTrust() {
    setMessage(
      "Selene opens the atelier records and reviews your care history, furniture, and trust progress.",
    );
    setAtelierMode("trust");
  }

  const accelerateCost = getEggAtelierServiceCost(
    "accelerated_incubation",
    activeSave,
  );
  const polishCost = getEggAtelierServiceCost("ability_polish", activeSave);
  const statCost = getEggAtelierServiceCost("stat_conditioning", activeSave);
  const kitCount = getNurserySupplyKitCount(activeSave);
  const polishChance = getEggAtelierAbilityPolishChance(activeSave);
  const statChance = getEggAtelierStatConditioningChance(activeSave);
  const upgradeEffects = getEggAtelierUpgradeEffects(activeSave);

  return (
    <main className={styles.screen}>
      <section className={styles.frame}>
        <AtelierHeader
          save={activeSave}
          kitCount={kitCount}
          message={message}
          onTown={goToTown}
          onRanch={goToRanch}
          onMenu={goToMainMenu}
        />

        <div className={styles.body}>
          {atelierMode === "interior" ? (
            <AtelierInterior
              save={activeSave}
              activeEggCount={activeEggs.length}
              onTalk={openTalk}
              onTrust={openTrust}
              onServices={() => setAtelierMode("services")}
              onEggs={() => setAtelierMode("eggs")}
              onFurniture={() => setAtelierMode("furniture")}
            />
          ) : null}

          {atelierMode === "talk" ? (
            <SeleneTalkPanel
              save={activeSave}
              onBack={() => setAtelierMode("interior")}
              onTrust={openTrust}
              onServices={() => setAtelierMode("services")}
            />
          ) : null}

          {atelierMode === "trust" ? (
            <SeleneTrustPanel
              save={activeSave}
              activeEggs={activeEggs}
              upgradeEffects={upgradeEffects}
              polishChance={polishChance}
              statChance={statChance}
              onBack={() => setAtelierMode("interior")}
              onServices={() => setAtelierMode("services")}
              onFurniture={() => setAtelierMode("furniture")}
            />
          ) : null}

          {atelierMode === "services" ? (
            <EggServicesPanel
              save={activeSave}
              activeEggs={activeEggs}
              selectedEgg={selectedEgg}
              setSelectedEggId={setSelectedEggId}
              accelerateCost={accelerateCost.label}
              polishCost={polishCost.label}
              statCost={statCost.label}
              polishChance={polishChance}
              statChance={statChance}
              onAccelerate={() => runService("accelerated")}
              onPolish={() => runService("polish")}
              onStat={() => runService("stat")}
              onSell={() => sellSelectedEgg("sell")}
              onDonate={() => sellSelectedEgg("donate")}
              onBack={() => setAtelierMode("interior")}
            />
          ) : null}

          {atelierMode === "eggs" ? (
            <EggRegistryPanel
              save={activeSave}
              activeEggs={activeEggs}
              selectedEgg={selectedEgg}
              setSelectedEggId={setSelectedEggId}
              onBuyEgg={buyEggOffer}
              onSell={() => sellSelectedEgg("sell")}
              onDonate={() => sellSelectedEgg("donate")}
              onServices={() => setAtelierMode("services")}
              onBack={() => setAtelierMode("interior")}
            />
          ) : null}

          {atelierMode === "furniture" ? (
            <FurniturePanel
              save={activeSave}
              kitCount={kitCount}
              onBuyUpgrade={buyUpgrade}
              onBack={() => setAtelierMode("interior")}
            />
          ) : null}
        </div>
      </section>
    </main>
  );
}

function AtelierInterior({
  save,
  activeEggCount,
  onTalk,
  onTrust,
  onServices,
  onEggs,
  onFurniture,
}: {
  save: GameSave;
  activeEggCount: number;
  onTalk: () => void;
  onTrust: () => void;
  onServices: () => void;
  onEggs: () => void;
  onFurniture: () => void;
}) {
  return (
    <section className={styles.interior} aria-label="Egg Atelier interior">
      <div className={styles.interiorBackdrop} aria-hidden="true" />
      <div className={styles.interiorGrid}>
        <aside className={`${styles.seleneCard} ${styles.ornatePanel}`}>
          <SelenePortrait />
          <p className={styles.cardEyebrow}>Lineage Specialist</p>
          <h2 className={styles.seleneName}>Dr. Selene Virell</h2>
          <p className={styles.trustLine}>
            {getNpcTrustSummary(save, "selene_virell")}
          </p>
          <div className={styles.goldDivider} />
          <p className={styles.seleneIntro}>{SELENE_GREETING}</p>
          <div className={styles.verticalActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onTalk}
            >
              Talk to Selene
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onServices}
            >
              Egg Services
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onEggs}
            >
              Egg Registry
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onFurniture}
            >
              Furniture Catalog
            </button>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onTrust}
            >
              Trust / Care Records
            </button>
          </div>
        </aside>

        <div className={styles.stage}>
          <button
            type="button"
            className={`${styles.hotspot} ${styles.hotspotIncubator}`}
            onClick={onServices}
          >
            <img src={ICONS.incubatorTable} alt="" />
            <strong>Incubator Table</strong>
            <span>{activeEggCount} active eggs</span>
          </button>

          <button
            type="button"
            className={`${styles.hotspot} ${styles.hotspotRegistry}`}
            onClick={onEggs}
          >
            <img
              src={ICONS.eggRegistry}
              alt=""
              onError={(event) => {
                event.currentTarget.src = ICONS.ledger;
              }}
            />
            <strong>Egg Registry</strong>
            <span>Placement • Purchase • Notes</span>
          </button>

          <button
            type="button"
            className={`${styles.hotspot} ${styles.hotspotFurniture}`}
            onClick={onFurniture}
          >
            <img src={ICONS.furnitureCatalog} alt="" />
            <strong>Furniture Catalog</strong>
            <span>Bedding • Cradles • Ledger</span>
          </button>
        </div>
      </div>
    </section>
  );
}

function SeleneTalkPanel({
  save,
  onBack,
  onTrust,
  onServices,
}: {
  save: GameSave;
  onBack: () => void;
  onTrust: () => void;
  onServices: () => void;
}) {
  const trust = getNpcTrustRecord(save, "selene_virell");
  const line =
    trust.level >= 4
      ? "Your records are precise enough for advanced work. I will not promise miracles, but I can improve the odds when the egg gives us something stable to guide."
      : trust.level >= 2
        ? "We are past guesswork now. With better notes, I can explain what an egg is likely to become before it hatches."
        : "Do not rush the shell. A small improvement made carefully is better than a dramatic promise made blindly.";

  return (
    <section className={styles.talkLayout}>
      <aside className={styles.talkPortrait}>
        <img
          src={ICONS.selene}
          alt="Dr. Selene Virell"
          onError={(event) => {
            event.currentTarget.src = ICONS.clinic;
          }}
        />
        <div className={styles.talkPortraitMeta}>
          <h2>Dr. Selene Virell</h2>
          <p>Lineage Specialist</p>
          <p className={styles.trustLine}>
            {getNpcTrustSummary(save, "selene_virell")}
          </p>
        </div>
      </aside>

      <section className={`${styles.conversationPanel} ${styles.ornatePanel}`}>
        <p className={styles.kicker}>Conversation</p>
        <h2>Careful Odds</h2>
        <p className={styles.conversationQuote}>{line}</p>
        <div className={styles.goldDivider} />
        <p className={styles.conversationBody}>
          Selene explains that the Egg Atelier improves control, records, and
          small outcome chances. It does not replace the ranch nursery; it
          specializes in appraisals, conditioning, registry work, and furniture
          planning.
        </p>
        <div className={styles.inlineActions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onServices}
          >
            Open Services
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onTrust}
          >
            Care Records
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onBack}
          >
            Back to Atelier
          </button>
        </div>
      </section>
    </section>
  );
}

function SeleneTrustPanel({
  save,
  activeEggs,
  upgradeEffects,
  polishChance,
  statChance,
  onBack,
  onServices,
  onFurniture,
}: {
  save: GameSave;
  activeEggs: EggRecord[];
  upgradeEffects: ReturnType<typeof getEggAtelierUpgradeEffects>;
  polishChance: number;
  statChance: number;
  onBack: () => void;
  onServices: () => void;
  onFurniture: () => void;
}) {
  return (
    <section className={styles.modeLayout}>
      <aside className={`${styles.sidePanel} ${styles.ornatePanel}`}>
        <SelenePortrait compact />
        <p className={styles.cardEyebrow}>Care Records</p>
        <h2>Dr. Selene Virell</h2>
        <p className={styles.trustLine}>
          {getNpcTrustSummary(save, "selene_virell")}
        </p>
        <div className={styles.goldDivider} />
        <p>
          <strong>Next:</strong> {getNpcNextUnlock(save, "selene_virell")}
        </p>
        <p>{SELENE_VIRELL.intro}</p>
        <QuickhatchChip save={save} />
      </aside>

      <section className={styles.ledgerMain}>
        <p className={styles.kicker}>Atelier Status</p>
        <h2>Current Benefits</h2>

        <div className={styles.benefitGrid}>
          <BenefitRow
            icon={ICONS.egg}
            label="Active eggs"
            value={String(activeEggs.length)}
          />
          <BenefitRow
            icon={ICONS.polish}
            label="Ability Polish chance"
            value={`${polishChance}%`}
          />
          <BenefitRow
            icon={ICONS.care}
            label="Stat Conditioning"
            value={
              upgradeEffects.statConditioningUnlocked
                ? `${statChance}% chance`
                : "Requires Incubator Cradle"
            }
          />
          <BenefitRow
            icon={ICONS.ledger}
            label="Appraisal detail"
            value={upgradeEffects.appraisalLevel >= 2 ? "Expanded" : "Basic"}
          />
          <BenefitRow
            icon={ICONS.stat}
            label="Service success bonus"
            value={`+${upgradeEffects.careSuccessBonus}%`}
          />
        </div>

        <p className={styles.installHeading}>Atelier Installs</p>
        <div className={styles.installRow}>
          {EGG_ATELIER_UPGRADES.map((upgrade) => {
            const owned = hasEggAtelierUpgrade(save, upgrade.upgradeId);
            return (
              <div key={upgrade.upgradeId} className={styles.installBadge}>
                <img src={upgrade.iconPath} alt="" />
                <strong>{upgrade.name}</strong>
                <span
                  className={`${styles.installState} ${
                    owned ? styles.installStateOwned : ""
                  }`}
                >
                  {owned ? "Installed" : "Uninstalled"}
                </span>
              </div>
            );
          })}
        </div>

        <div className={styles.ledgerActions}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onServices}
          >
            Open Services
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onFurniture}
          >
            Furniture Catalog
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onBack}
          >
            Back to Atelier
          </button>
        </div>
      </section>
    </section>
  );
}

function BenefitRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <div className={styles.benefitRow}>
      <div className={styles.benefitIcon}>
        <img src={icon} alt="" />
      </div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function EggServicesPanel({
  save,
  activeEggs,
  selectedEgg,
  setSelectedEggId,
  accelerateCost,
  polishCost,
  statCost,
  polishChance,
  statChance,
  onAccelerate,
  onPolish,
  onStat,
  onSell,
  onDonate,
  onBack,
}: {
  save: GameSave;
  activeEggs: EggRecord[];
  selectedEgg: EggRecord | null;
  setSelectedEggId: (id: EggId) => void;
  accelerateCost: string;
  polishCost: string;
  statCost: string;
  polishChance: number;
  statChance: number;
  onAccelerate: () => void;
  onPolish: () => void;
  onStat: () => void;
  onSell: () => void;
  onDonate: () => void;
  onBack: () => void;
}) {
  const effects = getEggAtelierUpgradeEffects(save);

  return (
    <section className={styles.modeLayout}>
      <aside className={`${styles.sidePanel} ${styles.ornatePanel}`}>
        <SelenePortrait compact />
        <p className={styles.cardEyebrow}>Lineage Specialist</p>
        <h2>Dr. Selene Virell</h2>
        <p className={styles.trustLine}>
          {getNpcTrustSummary(save, "selene_virell")}
        </p>
        <div className={styles.goldDivider} />
        <div className={styles.sideMetric}>
          <span>Next Unlock</span>
          <strong>{getNpcNextUnlock(save, "selene_virell")}</strong>
        </div>
        <div className={styles.sideMetric}>
          <span>Ability Polish Chance</span>
          <strong>{polishChance}%</strong>
        </div>
        <div className={styles.sideMetric}>
          <span>Active Eggs</span>
          <strong>{activeEggs.length}</strong>
        </div>
        <QuickhatchChip save={save} />
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onBack}
        >
          Back to Atelier
        </button>
      </aside>

      <section className={styles.servicesShell}>
        {selectedEgg ? (
          <SelectedEggWorkbench
            save={save}
            egg={selectedEgg}
            accelerateCost={accelerateCost}
            polishCost={polishCost}
            statCost={statCost}
            polishChance={polishChance}
            statChance={statChance}
            onAccelerate={onAccelerate}
            onPolish={onPolish}
            onStat={onStat}
            onSell={onSell}
            onDonate={onDonate}
          />
        ) : (
          <div className={styles.emptyState}>
            <div>
              <h2>Incubator Table / Egg Services</h2>
              <p>No active eggs. Buy an egg or deliver one from the ranch nursery.</p>
            </div>
          </div>
        )}

        <div className={styles.eggDrawer}>
          <h3 className={styles.drawerTitle}>Available Eggs</h3>
          {activeEggs.length ? (
            <div className={styles.eggDrawerList}>
              {activeEggs.map((egg) => (
                <button
                  key={egg.eggId}
                  type="button"
                  className={`${styles.eggDrawerButton} ${
                    selectedEgg?.eggId === egg.eggId
                      ? styles.eggDrawerButtonSelected
                      : ""
                  }`}
                  onClick={() => setSelectedEggId(egg.eggId)}
                >
                  <img
                    src={egg.status === "ready" ? ICONS.hatch : ICONS.egg}
                    alt=""
                  />
                  <div>
                    <strong>{egg.suggestedName || "Unnamed Egg"}</strong>
                    <span>
                      {getBestStatLabel(egg)} • {getEggAtelierEggLabel(egg)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <p>No active eggs are currently registered.</p>
          )}
        </div>
      </section>
    </section>
  );
}

function SelectedEggWorkbench({
  save,
  egg,
  accelerateCost,
  polishCost,
  statCost,
  polishChance,
  statChance,
  onAccelerate,
  onPolish,
  onStat,
  onSell,
  onDonate,
}: {
  save: GameSave;
  egg: EggRecord;
  accelerateCost: string;
  polishCost: string;
  statCost: string;
  polishChance: number;
  statChance: number;
  onAccelerate: () => void;
  onPolish: () => void;
  onStat: () => void;
  onSell: () => void;
  onDonate: () => void;
}) {
  const effects = getEggAtelierUpgradeEffects(save);
  const abilityPolishUsed = hasEggAtelierServiceUsed(
    save,
    egg.eggId,
    "ability_polish",
  );
  const statConditioningUsed = hasEggAtelierServiceUsed(
    save,
    egg.eggId,
    "stat_conditioning",
  );
  const canAccelerate =
    egg.status !== "ready" &&
    getNurserySupplyKitCount(save) > 0 &&
    save.currencies.gold >=
      getEggAtelierServiceCost("accelerated_incubation", save).gold;
  const canPolish =
    !abilityPolishUsed &&
    egg.projectedAbilities.length > 0 &&
    getNurserySupplyKitCount(save) > 0 &&
    save.currencies.gold >= getEggAtelierServiceCost("ability_polish", save).gold;
  const canStat =
    !statConditioningUsed &&
    effects.statConditioningUnlocked &&
    getNurserySupplyKitCount(save) > 0 &&
    save.currencies.gold >=
      getEggAtelierServiceCost("stat_conditioning", save).gold;
  const detailLines = [
    ...(egg.statRollNotes ?? []).slice(-3),
    ...(egg.abilityRollNotes ?? []).slice(-3),
    ...(egg.lineageNotes ?? []).slice(-2),
  ];
  const sellValue = getEggSaleValue(egg);
  const researchValue = Math.max(25, Math.round((sellValue * 0.35) / 5) * 5);

  return (
    <>
      <div className={styles.workbenchArt} aria-hidden="true" />
      <div className={styles.selectedEggInfo}>
        <p className={styles.kicker}>Selected Egg</p>
        <p>
          {egg.rarity} • {egg.status === "ready" ? "Ready" : `${egg.daysRemaining} day(s) left`}
        </p>
        <h3>{egg.suggestedName || "Selected Egg"}</h3>
        <p>{getEggSubtitle(egg)}</p>
        <p className={styles.accentText}>
          Best grade: {getBestStatLabel(egg)} • Ability polish chance: {polishChance}% •
          Sell value: {formatGold(sellValue)}
        </p>
      </div>

      <img
        className={styles.heroEgg}
        src={egg.status === "ready" ? ICONS.hatch : ICONS.egg}
        alt={egg.suggestedName || "Selected egg"}
      />

      <div className={styles.serviceGrid}>
        <ServiceCard
          icon={ICONS.timer}
          title="Accelerated Incubation"
          cost={accelerateCost}
          description="Reduces this egg timer by 1 day. Warming Lamp lowers this service cost."
        >
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onAccelerate}
            disabled={!canAccelerate}
          >
            Accelerate
          </button>
        </ServiceCard>

        <ServiceCard
          icon={ICONS.polish}
          title="Ability Polish"
          cost={abilityPolishUsed ? "Already used on this egg" : polishCost}
          description="Attempts to improve one projected inherited ability by one grade. Limit: once per egg."
        >
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onPolish}
            disabled={!canPolish}
          >
            {abilityPolishUsed ? "Polished" : "Ability Polish"}
          </button>
        </ServiceCard>

        <ServiceCard
          icon={ICONS.care}
          title="Stat Conditioning"
          cost={
            statConditioningUsed
              ? "Already used on this egg"
              : effects.statConditioningUnlocked
                ? `${statCost} • ${statChance}%`
                : "Requires Incubator Cradle"
          }
          description="Attempts to improve the lowest projected stat grade by one rank. Limit: once per egg."
        >
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onStat}
            disabled={!canStat}
          >
            {statConditioningUsed ? "Conditioned" : "Stat Condition"}
          </button>
        </ServiceCard>

        <ServiceCard
          icon={ICONS.price}
          title="Egg Economy"
          cost={`Sell ${formatGold(sellValue)} • Research ${formatGold(
            researchValue,
          )}`}
          description="Selling gives more Gold. Research gives less Gold but stronger Selene Trust."
        >
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onSell}
          >
            Sell Egg
          </button>
          <button
            type="button"
            className={styles.dangerButton}
            onClick={onDonate}
          >
            Research Donate
          </button>
        </ServiceCard>

        <div className={styles.appraisalNotice}>
          {effects.appraisalLevel >= 2 ? (
            <>
              <strong>Expanded Appraisal:</strong> {getStatLine(egg)} • {getAbilityLine(egg)}
              {detailLines.length ? ` • ${detailLines.join(" | ")}` : ""}
            </>
          ) : (
            <>
              <strong>Install the Lineage Ledger Desk</strong> for expanded projected stat,
              ability, and lineage notes.
            </>
          )}
        </div>
      </div>
    </>
  );
}

function ServiceCard({
  icon,
  title,
  cost,
  description,
  children,
}: {
  icon: string;
  title: string;
  cost: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <article className={styles.serviceCard}>
      <div className={styles.serviceIcon}>
        <img src={icon} alt="" />
      </div>
      <div>
        <h3>{title}</h3>
        <strong>{cost}</strong>
        <p>{description}</p>
        <div className={styles.serviceCardActions}>{children}</div>
      </div>
    </article>
  );
}

function EggRegistryPanel({
  save,
  activeEggs,
  selectedEgg,
  setSelectedEggId,
  onBuyEgg,
  onSell,
  onDonate,
  onServices,
  onBack,
}: {
  save: GameSave;
  activeEggs: EggRecord[];
  selectedEgg: EggRecord | null;
  setSelectedEggId: (id: EggId) => void;
  onBuyEgg: (offerId: string) => void;
  onSell: () => void;
  onDonate: () => void;
  onServices: () => void;
  onBack: () => void;
}) {
  return (
    <section className={styles.modeLayout}>
      <aside className={`${styles.sidePanel} ${styles.ornatePanel}`}>
        <p className={styles.cardEyebrow}>Placement Ledger</p>
        <h2>Egg Registry</h2>
        <p>
          Buy documented eggs, sell active eggs, or donate an egg to Selene&apos;s
          research files.
        </p>
        <p className={styles.accentText}>
          Every egg is a placement. Every note is a legacy.
        </p>
        <div className={styles.goldDivider} />

        {selectedEgg ? (
          <div className={styles.sideMetric}>
            <span>Selected Egg</span>
            <strong>{selectedEgg.suggestedName || selectedEgg.eggId}</strong>
            <p>Sell {formatGold(getEggSaleValue(selectedEgg))}</p>
          </div>
        ) : null}

        {selectedEgg ? (
          <div className={styles.verticalActions}>
            <button
              type="button"
              className={styles.secondaryButton}
              onClick={onSell}
            >
              Sell Egg
            </button>
            <button
              type="button"
              className={styles.dangerButton}
              onClick={onDonate}
            >
              Research Donate
            </button>
          </div>
        ) : null}

        <div className={styles.verticalActions} style={{ marginTop: 12 }}>
          <button
            type="button"
            className={styles.primaryButton}
            onClick={onServices}
          >
            Egg Services
          </button>
          <button
            type="button"
            className={styles.secondaryButton}
            onClick={onBack}
          >
            Back to Atelier
          </button>
        </div>
      </aside>

      <section className={styles.registryMain}>
        <h2 className={styles.mainTitle}>Egg Offers</h2>
        <div className={styles.registryOffers}>
          {EGG_ATELIER_EGG_OFFERS.map((offer) => {
            const block = canBuyEggOffer(save, offer);
            return (
              <article key={offer.offerId} className={styles.dossier}>
                <span className={styles.dossierLabel}>{offer.label}</span>
                <h3>{offer.name}</h3>
                <div className={styles.dossierBody}>
                  <div className={styles.dossierArt}>
                    <img
                      src={offer.iconPath}
                      alt=""
                      onError={(event) => {
                        event.currentTarget.src = ICONS.egg;
                      }}
                    />
                  </div>
                  <p>{offer.description}</p>
                </div>
                <div className={styles.dossierPrice}>
                  <span>Price</span>
                  <strong>{formatGold(offer.price)}</strong>
                  <p>
                    {block
                      ? block
                      : "Placed directly into your ranch nursery."}
                  </p>
                </div>
                {offer.trustRequired > 1 ? (
                  <div className={styles.trustStamp}>
                    Selene Trust
                    <br />
                    Lv. {offer.trustRequired}
                  </div>
                ) : null}
                <div className={styles.dossierAction}>
                  <button
                    type="button"
                    className={block ? styles.secondaryButton : styles.primaryButton}
                    onClick={() => onBuyEgg(offer.offerId)}
                    disabled={Boolean(block)}
                    style={{ width: "100%" }}
                  >
                    {block ? "Locked" : "Buy Egg"}
                  </button>
                </div>
              </article>
            );
          })}
        </div>

        <div className={styles.activeEggSection}>
          <h2 className={styles.mainTitle}>Your Active Eggs</h2>
          {activeEggs.length ? (
            <div className={styles.activeEggGrid}>
              {activeEggs.map((egg) => (
                <button
                  key={egg.eggId}
                  type="button"
                  className={`${styles.eggDrawerButton} ${
                    selectedEgg?.eggId === egg.eggId
                      ? styles.eggDrawerButtonSelected
                      : ""
                  }`}
                  onClick={() => setSelectedEggId(egg.eggId)}
                >
                  <img
                    src={egg.status === "ready" ? ICONS.hatch : ICONS.egg}
                    alt=""
                  />
                  <div>
                    <strong>{egg.suggestedName || "Unnamed Egg"}</strong>
                    <span>
                      {getEggAtelierEggLabel(egg)} • Sell {formatGold(getEggSaleValue(egg))}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <div className={styles.emptyState}>
              <div>
                <strong>You have no active eggs.</strong>
                <p>Purchase or place an egg to see it here.</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </section>
  );
}

function FurniturePanel({
  save,
  kitCount,
  onBuyUpgrade,
  onBack,
}: {
  save: GameSave;
  kitCount: number;
  onBuyUpgrade: (upgradeId: string) => void;
  onBack: () => void;
}) {
  return (
    <section className={styles.modeLayout}>
      <aside className={`${styles.sidePanel} ${styles.ornatePanel}`}>
        <p className={styles.cardEyebrow}>Nursery Furnishings</p>
        <h2>Furniture Catalog</h2>
        <p>
          Install upgrades in your ranch egg nursery. Selene&apos;s furniture
          improves service odds, appraisals, hatch affection, and stat support.
        </p>
        <div className={styles.sideMetric}>
          <span>Nursery Kits</span>
          <strong>{kitCount}</strong>
        </div>
        <button
          type="button"
          className={styles.secondaryButton}
          onClick={onBack}
        >
          Back to Atelier
        </button>
      </aside>

      <section className={styles.catalogMain}>
        <div className={styles.catalogHeading}>
          <p className={styles.kicker}>Essential Upgrades</p>
          <h2>Curated comforts and tools for better care</h2>
          <p>Stronger records, steadier outcomes, and brighter hatches.</p>
        </div>

        <div className={styles.catalogGrid}>
          {EGG_ATELIER_UPGRADES.map((upgrade, index) => {
            const owned = hasEggAtelierUpgrade(save, upgrade.upgradeId);
            const canAfford =
              save.currencies.gold >= upgrade.costGold &&
              kitCount >= upgrade.costNurseryKits &&
              !owned;

            return (
              <article key={upgrade.upgradeId} className={styles.catalogEntry}>
                <div className={styles.catalogArt}>
                  <img
                    src={upgrade.iconPath}
                    alt=""
                    onError={(event) => {
                      event.currentTarget.src = ICONS.clinic;
                    }}
                  />
                </div>
                <div>
                  <p className={styles.kicker}>Entry {index + 1}</p>
                  <h3>{upgrade.name}</h3>
                  <p>{upgrade.description}</p>
                  <p className={styles.catalogEffect}>{upgrade.effectLabel}</p>
                  <div className={styles.catalogCost}>
                    <span>
                      <strong>Install Cost:</strong> {formatGold(upgrade.costGold)}
                    </span>
                    <span>
                      <strong>Requires:</strong> {upgrade.costNurseryKits} Kit(s)
                    </span>
                  </div>
                  {owned ? (
                    <span className={styles.installedSeal}>Installed</span>
                  ) : (
                    <button
                      type="button"
                      className={styles.primaryButton}
                      onClick={() => onBuyUpgrade(upgrade.upgradeId)}
                      disabled={!canAfford}
                      style={{ marginTop: 8 }}
                    >
                      Install
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>

        <div className={styles.catalogTabs}>
          {EGG_ATELIER_UPGRADES.map((upgrade, index) => {
            const owned = hasEggAtelierUpgrade(save, upgrade.upgradeId);
            return (
              <div
                key={upgrade.upgradeId}
                className={`${styles.catalogTab} ${
                  owned ? styles.catalogTabInstalled : ""
                }`}
              >
                <img src={upgrade.iconPath} alt="" />
                <span>
                  {index + 1}. {upgrade.name}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </section>
  );
}
