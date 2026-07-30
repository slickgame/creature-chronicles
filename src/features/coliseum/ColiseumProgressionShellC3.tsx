"use client";

import { useEffect, useState } from "react";
import { getCreatureBattleMoveLoadout, MAX_LEARNED_BATTLE_MOVES, REQUIRED_BASIC_BATTLE_MOVE_ID } from "@/data/battleLoadouts";
import { getBattleMove } from "@/data/battleMoves";
import { getBattleSpeciesProfile } from "@/data/battleProfiles";
import {
  COLISEUM_C3_SHOP_REWARDS,
  COLISEUM_CREATURE_CONTRACTS,
  getColiseumC3RewardAccess,
  getColiseumC3State,
  getColiseumC3Summary,
  getColiseumContractCapacity,
  getColiseumTechniqueStock,
  purchaseColiseumC3Reward,
  redeemColiseumCreatureContract,
  syncColiseumC3Rewards,
  teachColiseumTechnique,
  type ColiseumC3Result,
  type ColiseumC3RewardKind,
} from "@/data/coliseumC3";
import { getVariantDefinition } from "@/data/creatures";
import { useGameContext } from "@/state/GameProvider";
import type { BattleMoveId } from "@/types/battle";
import type { CreatureRecord } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import type { GameSave } from "@/types/save";
import { ColiseumProgressionScreen as ColiseumProgressionScreenC2 } from "./ColiseumProgressionScreen";
import styles from "./ColiseumC3Shell.module.css";

const FALLBACK_PORTRAIT = "/images/ui/icons/icon_paw_crest.png";

type C3Mode = "arena" | "exchange" | "techniques" | "contracts" | "history";
const SHOP_CATEGORIES: Array<ColiseumC3RewardKind | "all"> = ["all", "equipment", "technique", "consumable", "contract", "prestige"];

function titleCase(value: string): string {
  return value.split(/[_-]/g).map((part) => part ? part[0].toUpperCase() + part.slice(1) : part).join(" ");
}

export function ColiseumProgressionScreen() {
  const { currentSave, goToBattleOutfitter, goToMainMenu, goToTown, saveCurrentGame } = useGameContext();
  const [mode, setMode] = useState<C3Mode>("arena");
  const [category, setCategory] = useState<ColiseumC3RewardKind | "all">("all");
  const [selectedCreatureId, setSelectedCreatureId] = useState<CreatureId | null>(null);
  const [replacementByMove, setReplacementByMove] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("Victories now award Coliseum Marks and deterministic combat loot. Spend Marks on gear, manuals, and one-time contracts.");

  const c2ProgressKey = currentSave?.flags.coliseumProgressV2;
  const c3StateKey = currentSave?.flags.coliseumC3StateV1;

  useEffect(() => {
    if (!currentSave) return;
    const result = syncColiseumC3Rewards(currentSave);
    if (result.changed) {
      saveCurrentGame(result.save);
      setMessage(result.message);
    }
  }, [currentSave?.saveId, c2ProgressKey, c3StateKey, saveCurrentGame]);

  if (!currentSave) {
    return <main className={styles.shell}><section className={styles.exchange}><div className={styles.empty}><h1>No active save</h1><button type="button" className={styles.primaryButton} onClick={goToMainMenu}>Main Menu</button></div></section></main>;
  }

  const save = currentSave;
  const state = getColiseumC3State(save);
  const summary = getColiseumC3Summary(save);
  const creatures = save.creatures ?? [];
  const selectedCreature = creatures.find((entry) => entry.creatureId === selectedCreatureId) ?? creatures[0] ?? null;
  const visibleRewards = COLISEUM_C3_SHOP_REWARDS.filter((reward) => category === "all" || reward.kind === category);

  function applyResult(result: ColiseumC3Result) {
    if (result.changed) saveCurrentGame(result.save);
    setMessage(result.message);
  }

  const toolbar = (
    <nav className={styles.toolbar} aria-label="Coliseum C3 navigation">
      <div className={styles.markPill}><span>Coliseum Marks</span><strong>{state.marks}</strong></div>
      <button type="button" data-active={mode === "arena"} onClick={() => setMode("arena")}>Arena</button>
      <button type="button" data-active={mode === "exchange"} onClick={() => setMode("exchange")}>Marks Exchange</button>
      <button type="button" data-active={mode === "techniques"} onClick={() => setMode("techniques")}>Technique Desk</button>
      <button type="button" data-active={mode === "contracts"} onClick={() => setMode("contracts")}>Recruitment Hold</button>
      <button type="button" data-active={mode === "history"} onClick={() => setMode("history")}>Reward Ledger</button>
      <button type="button" onClick={goToBattleOutfitter}>Outfitter</button>
      <button type="button" onClick={goToTown}>Town</button>
    </nav>
  );

  if (mode === "arena") return <div className={styles.shell}>{toolbar}<ColiseumProgressionScreenC2 /></div>;

  return (
    <main className={styles.shell}>
      {toolbar}
      <section className={styles.exchange}>
        <header className={styles.header}>
          <div><p className={styles.kicker}>Coliseum C3</p><h1>Marks, Loot & Reward Progression</h1><p>{message}</p></div>
          <section className={styles.summaryGrid}>
            <article><span>Marks</span><strong>{summary.marks}</strong></article>
            <article><span>Combat Clears</span><strong>{summary.completedEncounters}/{summary.totalEncounters}</strong></article>
            <article><span>Technique Manuals</span><strong>{summary.techniqueManuals}</strong></article>
            <article><span>Contracts</span><strong>{summary.recruitedContracts} joined · {summary.pendingContracts} held</strong></article>
          </section>
        </header>
        <p className={styles.message}>{message}</p>

        {mode === "exchange" ? (
          <section className={styles.layout}>
            <aside className={styles.sidebar}>
              {SHOP_CATEGORIES.map((entry) => <button key={entry} type="button" data-active={category === entry} onClick={() => setCategory(entry)}>{entry === "all" ? "All Rewards" : titleCase(entry)}</button>)}
            </aside>
            <section className={styles.panel}>
              <header className={styles.panelHeader}><div><p className={styles.kicker}>Marks Exchange</p><h2>{category === "all" ? "All Rewards" : titleCase(category)}</h2></div><div className={styles.infoBox}><span>Available</span><strong>{state.marks} Marks</strong></div></header>
              <div className={styles.grid}>{visibleRewards.map((reward) => {
                const access = getColiseumC3RewardAccess(save, reward);
                const count = state.purchaseCounts[reward.rewardId] ?? 0;
                const affordable = state.marks >= reward.costMarks;
                return <article key={reward.rewardId} className={styles.card} data-locked={!access.unlocked}><div className={styles.cardMeta}><span>{titleCase(reward.kind)}</span>{reward.maxPurchases ? <span>{count}/{reward.maxPurchases} purchased</span> : <span>Repeatable</span>}</div><h3>{reward.name}</h3><p>{reward.description}</p>{reward.requiredEncounterId ? <p><strong>Unlock:</strong> {access.unlocked ? "Cleared" : access.reason}</p> : null}<div className={styles.priceLine}><strong>{reward.costMarks} Marks</strong><button type="button" className={styles.primaryButton} disabled={!access.unlocked || !affordable} onClick={() => applyResult(purchaseColiseumC3Reward(save, reward.rewardId))}>{!access.unlocked ? "Locked" : !affordable ? "Need Marks" : "Purchase"}</button></div></article>;
              })}</div>
            </section>
          </section>
        ) : null}

        {mode === "techniques" ? <TechniqueDesk save={save} selectedCreature={selectedCreature} selectedCreatureId={selectedCreatureId} setSelectedCreatureId={setSelectedCreatureId} replacementByMove={replacementByMove} setReplacementByMove={setReplacementByMove} onResult={applyResult} /> : null}
        {mode === "contracts" ? <ContractHold save={save} onResult={applyResult} onExchange={() => setMode("exchange")} /> : null}
        {mode === "history" ? <RewardHistory save={save} /> : null}
      </section>
    </main>
  );
}

function CreatureSelector({ creatures, selectedCreatureId, onSelect }: { creatures: CreatureRecord[]; selectedCreatureId: CreatureId | null; onSelect: (id: CreatureId) => void }) {
  return <div className={styles.rosterGrid}>{creatures.map((creature) => { const variant = getVariantDefinition(creature.variantId); return <button key={creature.creatureId} type="button" className={styles.rosterButton} data-active={creature.creatureId === selectedCreatureId} onClick={() => onSelect(creature.creatureId)}><img src={variant.portraitPath || FALLBACK_PORTRAIT} alt="" onError={(event) => { event.currentTarget.src = FALLBACK_PORTRAIT; }} /><span><strong>{creature.nickname}</strong><span>Lv. {creature.level} · {variant.name}</span></span></button>; })}</div>;
}

function TechniqueDesk({ save, selectedCreature, selectedCreatureId, setSelectedCreatureId, replacementByMove, setReplacementByMove, onResult }: { save: GameSave; selectedCreature: CreatureRecord | null; selectedCreatureId: CreatureId | null; setSelectedCreatureId: (id: CreatureId) => void; replacementByMove: Record<string, string>; setReplacementByMove: (value: Record<string, string>) => void; onResult: (result: ColiseumC3Result) => void }) {
  const manualRewards = COLISEUM_C3_SHOP_REWARDS.filter((reward) => reward.kind === "technique" && reward.moveId);
  return <section className={styles.panel} style={{ marginTop: 18 }}><header className={styles.panelHeader}><div><p className={styles.kicker}>Dedicated Source Training</p><h2>Coliseum Technique Desk</h2></div></header><p>Coliseum manuals are separate from Focus Manuals. Each purchased copy teaches one compatible creature and is consumed only after a successful learning operation.</p><CreatureSelector creatures={save.creatures ?? []} selectedCreatureId={selectedCreature?.creatureId ?? selectedCreatureId} onSelect={setSelectedCreatureId} />{selectedCreature ? <div className={styles.grid}>{manualRewards.map((reward) => { const moveId = reward.moveId as BattleMoveId; const move = getBattleMove(moveId); const stock = getColiseumTechniqueStock(save, moveId); const loadout = getCreatureBattleMoveLoadout(selectedCreature); const learned = loadout.learnedMoveIds.includes(moveId); const full = loadout.learnedMoveIds.length >= MAX_LEARNED_BATTLE_MOVES; const profile = getBattleSpeciesProfile(selectedCreature.speciesId); const replacementOptions = loadout.learnedMoveIds.filter((id) => id !== REQUIRED_BASIC_BATTLE_MOVE_ID && id !== profile.signatureMoveId && id !== moveId); const replacement = replacementByMove[moveId] ?? ""; return <article key={moveId} className={styles.card}><div className={styles.cardMeta}><span>{titleCase(move.category)}</span><span>Manuals: {stock}</span><span>{loadout.learnedMoveIds.length}/{MAX_LEARNED_BATTLE_MOVES} learned</span></div><h3>{move.name}</h3><p>{move.description}</p><p>PWR {move.power} · ACC {move.accuracy}% · BE {move.battleEnergyCost} · CD {move.cooldown}</p>{full && !learned ? <select className={styles.select} value={replacement} onChange={(event) => setReplacementByMove({ ...replacementByMove, [moveId]: event.target.value })}><option value="">Choose a move to forget</option>{replacementOptions.map((id) => <option key={id} value={id}>{getBattleMove(id).name}</option>)}</select> : null}<button type="button" className={styles.primaryButton} disabled={learned || stock <= 0 || (full && !replacement)} onClick={() => onResult(teachColiseumTechnique(save, selectedCreature.creatureId, moveId, replacement ? replacement as BattleMoveId : undefined))}>{learned ? "Already Learned" : stock <= 0 ? "Purchase Manual First" : "Teach Technique"}</button></article>; })}</div> : <p className={styles.empty}>No creature is available for technique training.</p>}</section>;
}

function ContractHold({ save, onResult, onExchange }: { save: GameSave; onResult: (result: ColiseumC3Result) => void; onExchange: () => void }) {
  const state = getColiseumC3State(save);
  return <section className={styles.panel} style={{ marginTop: 18 }}><header className={styles.panelHeader}><div><p className={styles.kicker}>Capacity-Safe Recruitment</p><h2>Recruitment Hold</h2></div><button type="button" className={styles.secondaryButton} onClick={onExchange}>Open Marks Exchange</button></header><p>Purchasing a contract never overfills a habitat. The contract remains owned in Recruitment Hold until the matching habitat has open capacity.</p><div className={styles.grid}>{COLISEUM_CREATURE_CONTRACTS.map((contract) => { const pending = state.pendingContractIds.includes(contract.contractId); const recruited = state.recruitedContractIds.includes(contract.contractId); const capacity = getColiseumContractCapacity(save, contract.contractId); const variant = getVariantDefinition(contract.variantId); return <article key={contract.contractId} className={styles.card}><div className={styles.cardMeta}><span>{variant.name}</span><span>Lv. {contract.level}</span><span>{recruited ? "Recruited" : pending ? "Contract Held" : "Not Owned"}</span></div><h3>{contract.nickname} · {contract.name}</h3><p>{contract.description}</p><p>{capacity.habitatName}: {capacity.occupied}/{capacity.capacity}</p><p>{recruited ? `${contract.nickname} already joined the ranch.` : pending ? capacity.reason : "Purchase this one-time contract from the Marks Exchange."}</p><button type="button" className={styles.primaryButton} disabled={!pending || recruited || !capacity.canRedeem} onClick={() => onResult(redeemColiseumCreatureContract(save, contract.contractId))}>{recruited ? "Already Recruited" : !pending ? "Purchase Contract First" : !capacity.canRedeem ? "Habitat Full" : "Recruit to Ranch"}</button></article>; })}</div></section>;
}

function RewardHistory({ save }: { save: GameSave }) {
  const state = getColiseumC3State(save);
  return <section className={styles.panel} style={{ marginTop: 18 }}><header className={styles.panelHeader}><div><p className={styles.kicker}>Persistent Economy</p><h2>Marks & Loot Ledger</h2></div><div className={styles.infoBox}><span>Current Balance</span><strong>{state.marks} Marks</strong></div></header>{state.awardHistory.length ? <div className={styles.history}>{state.awardHistory.map((entry) => <article key={entry.awardId}><div><strong>{entry.encounterName}</strong><span>Day {entry.dayNumber} · {titleCase(entry.reason)}</span><small>{entry.lootLabel}</small></div><strong className={entry.marks >= 0 ? styles.positive : styles.negative}>{entry.marks >= 0 ? "+" : ""}{entry.marks} Marks</strong></article>)}</div> : <p className={styles.empty}>No C3 rewards have been synchronized yet. Record a Coliseum result or migrate existing clears.</p>}</section>;
}
