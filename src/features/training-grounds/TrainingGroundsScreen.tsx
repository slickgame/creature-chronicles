"use client";

import { useRef, useState } from "react";
import { RHEA_FLINT, TRAINING_FOCI, TRAINING_UPGRADES, getRanchMaterialStock, getTrainingAssignment, getTrainingFocus, getTrainingHistorySummary, getTrainingStatusLabel, getTrainingUpgrade, getTrainingUpgradeEffects, hasTrainingUpgrade, purchaseTrainingUpgrade, startTrainingGroundsAssignment } from "@/data/trainingGrounds";
import type { TrainingFocusId, TrainingRewardSummary, TrainingUpgradeId } from "@/data/trainingGrounds";
import { getVariantDefinition, STAT_KEYS } from "@/data/creatures";
import { GameDialog } from "@/features/ui/GameDialog";
import { useNavigation } from "@/features/navigation/NavigationContext";
import { useGameContext } from "@/state/GameProvider";
import type { CreatureRecord, CreatureStatKey } from "@/types/creature";
import type { CreatureId } from "@/types/ids";
import styles from "./TrainingGroundsScreen.module.css";

const ART = "/images/ui/training-v1/";
const SHARED = "/images/ui/atelier-v1/";
const FOCUS_ART: Record<TrainingFocusId, string> = { level_drill: "level-drill", stat_coaching: "stat-coaching", focused_stat_coaching: "focused-coaching" };
const UPGRADE_ART: Record<TrainingUpgradeId, string> = { training_yard_upgrade: "yard-upgrade", coaching_bench_upgrade: "bench-upgrade", assistant_trainer: "assistant-upgrade", advanced_training_license: "license-upgrade" };
const STAT_NAMES: Record<CreatureStatKey, string> = { STR: "Strength", DEX: "Dexterity", STA: "Stamina", CHA: "Charm", WIL: "Willpower", FER: "Fertility" };
type Popup = "choose" | "profile" | "talk" | "records" | "upgrades" | "confirm-training" | "confirm-upgrade" | "result" | "plan" | null;
function Icon({ name }: { name: string }) { return <img className={styles.icon} src={name.startsWith("/") ? name : ART + name + ".webp"} alt="" />; }
function Stats({ creature }: { creature?: CreatureRecord | null }) { return <dl className={styles.stats} aria-label="Stats and letter grades">{STAT_KEYS.map(key => <div key={key}><dt title={STAT_NAMES[key]}>{key}</dt><dd>{creature ? <><strong>{creature.stats[key]}</strong><b aria-label={`Grade ${creature.statGrades[key]}`}>{creature.statGrades[key]}</b></> : "—"}</dd></div>)}</dl>; }

export function TrainingGroundsScreen() {
  const { currentSave: save, goToTown, goToMainMenu, trainCreature, collectTrainingCreature, purchaseTrainingGroundsUpgrade, saveCurrentGame } = useGameContext();
  const { open } = useNavigation();
  const [selectedId, setSelectedId] = useState<CreatureId | null>(null);
  const [focusId, setFocusId] = useState<TrainingFocusId>("level_drill");
  const [targetStat, setTargetStat] = useState<CreatureStatKey>("STR");
  const [popup, setPopup] = useState<Popup>(null);
  const [creaturePage, setCreaturePage] = useState(0);
  const [recordFilter, setRecordFilter] = useState<"all" | "ready" | "away">("all");
  const [upgradeId, setUpgradeId] = useState<TrainingUpgradeId>("training_yard_upgrade");
  const [message, setMessage] = useState("");
  const [reward, setReward] = useState<TrainingRewardSummary | null>(null);
  const busy = useRef(false);
  if (!save) return <main><h1>No active save</h1><button onClick={goToMainMenu}>Return to Main Menu</button></main>;
  const creatures = save.creatures ?? [];
  const creature = creatures.find(item => item.creatureId === selectedId) ?? null;
  const assignment = creature ? getTrainingAssignment(save, creature.creatureId) : null;
  const focus = getTrainingFocus(assignment?.focusId ?? focusId)!;
  const effects = getTrainingUpgradeEffects(save);
  const materials = getRanchMaterialStock(save);
  const active = creatures.filter(item => getTrainingAssignment(save, item.creatureId));
  const ready = active.filter(item => getTrainingAssignment(save, item.creatureId)?.isReady);
  const upgrade = getTrainingUpgrade(upgradeId)!;
  const purchase = purchaseTrainingUpgrade(save, upgradeId);
  const variant = creature ? getVariantDefinition(creature.variantId) : null;
  const allS = creature && STAT_KEYS.every(key => creature.statGrades[key] === "S");
  const start = creature ? startTrainingGroundsAssignment(save, creature.creatureId, focus.focusId, focus.focusId === "focused_stat_coaching" ? targetStat : undefined) : null;
  const reason = !creature ? "Choose a creature to begin." : allS && focus.category === "Stats" && !assignment ? "All stats are already Grade S." : !start?.ok ? start?.message : null;
  const locked = Boolean(focus.requiresUpgradeId && !hasTrainingUpgrade(save, focus.requiresUpgradeId));
  const displayedTarget = assignment?.targetStatKey ?? targetStat;
  const outcome = focus.focusId === "level_drill" ? `+${effects.levelDrillXp} XP on collection` : `${effects.statCoachingChance}% chance to improve ${focus.focusId === "focused_stat_coaching" ? displayedTarget : "a lowest eligible grade"}`;
  const ordered = [...creatures].sort((a,b) => Number(Boolean(getTrainingAssignment(save,b.creatureId)?.isReady)) - Number(Boolean(getTrainingAssignment(save,a.creatureId)?.isReady)));
  const creaturePages = Math.max(1, Math.ceil(ordered.length / 6));
  const visibleCreatures = ordered.slice(Math.min(creaturePage, creaturePages - 1) * 6, (Math.min(creaturePage, creaturePages - 1) + 1) * 6);
  const records = ordered.filter(item => recordFilter === "all" || (recordFilter === "ready" ? getTrainingAssignment(save,item.creatureId)?.isReady : Boolean(getTrainingAssignment(save,item.creatureId)) && !getTrainingAssignment(save,item.creatureId)?.isReady));
  function choose(item: CreatureRecord) { setSelectedId(item.creatureId); setPopup(null); }
  function showRecords(filter: typeof recordFilter = "all") { setRecordFilter(filter); setPopup("records"); }
  function commit(action: "train" | "upgrade" | "collect", id?: CreatureId) {
    if (busy.current || !save) return;
    if (action === "train" && (!creature || reason)) return;
    busy.current = true;
    const result = action === "train" ? trainCreature(creature!.creatureId, focus.focusId, focus.focusId === "focused_stat_coaching" ? targetStat : undefined) : action === "upgrade" ? purchaseTrainingGroundsUpgrade(upgradeId) : collectTrainingCreature(id ?? creature!.creatureId);
    let text = result.message;
    if (result.ok) {
      const saved = saveCurrentGame(result.save);
      const extraGold = saved.currencies.gold - result.save.currencies.gold;
      const extraGp = saved.currencies.guildPoints - result.save.currencies.guildPoints;
      if (extraGold || extraGp) text += ` Starter goal rewards: +${extraGold} Gold, +${extraGp} GP.`;
      if (action === "collect" && id) setSelectedId(id);
    }
    setReward(result.reward ?? null); setMessage(text); setPopup("result");
    queueMicrotask(() => { busy.current = false; });
  }
  const plan = <div className={styles.planContent}>
    <h2>{focus.name}</h2><img className={styles.planArt} src={ART + FOCUS_ART[focus.focusId] + ".webp"} alt="" />
    <div className={styles.facts}><span><Icon name="/images/ui/guild-v1/gold.webp" /><strong>{focus.costGold} Gold{assignment ? " paid" : ""}</strong></span><span><Icon name={SHARED + "hourglass.webp"} /><strong>{focus.durationDays} {focus.durationDays === 1 ? "day" : "days"}</strong></span><span><Icon name={focus.focusId === "level_drill" ? "/images/ui/icons/icon_xp_star.png" : "stat-coaching"} /><strong>{outcome}</strong></span></div>
    <Stats creature={creature} />
    {focus.focusId === "focused_stat_coaching" && <label className={styles.target}>Target stat<select aria-label="Target stat" value={displayedTarget} disabled={!!assignment || locked} onChange={event => setTargetStat(event.target.value as CreatureStatKey)}>{STAT_KEYS.map(key => <option key={key} value={key}>{STAT_NAMES[key]}{creature ? ` · ${creature.stats[key]} · Grade ${creature.statGrades[key]}` : ""}</option>)}</select></label>}
    <p className={styles.banner}>{assignment ? assignment.isReady ? "Ready to collect from Rhea" : `${assignment.daysRemaining} ${assignment.daysRemaining === 1 ? "day" : "days"} remaining` : "Creature stays with Rhea until collected"}</p>
    {assignment ? <button className={styles.primary} disabled={!assignment.isReady} onClick={() => commit("collect")}>{assignment.isReady ? "Collect Training Result" : "Training in Progress"}</button> : <><p className={styles.reason}>{reason ?? "Review the plan before leaving your creature."}</p><button className={styles.primary} disabled={!!reason} onClick={() => setPopup("confirm-training")}>Review Training</button></>}
  </div>;
  return <main className={styles.training}>
    <header className={styles.header}><button onClick={goToTown}>← Town</button><h1>Training Grounds</h1><button data-navigation-launcher onClick={() => open("menu")}>☰ Menu</button></header>
    <section className={styles.resources} aria-label="Training resources"><span><Icon name="/images/ui/guild-v1/gold.webp" /><b>{save.currencies.gold.toLocaleString()} Gold</b></span><span><Icon name="/images/items/supply_depot/material_crate.png" /><b>{materials} Materials</b></span><button onClick={() => showRecords("away")}><Icon name="capacity" />Training {active.length}/{effects.maxAssignments}</button><button className={ready.length ? styles.ready : ""} onClick={() => showRecords("ready")}><Icon name="ready" />Ready {ready.length}</button></section>
    <section className={styles.workspace}>
      <aside className={styles.coach}><img className={styles.rhea} src={RHEA_FLINT.portraitPath} alt="Rhea Flint" /><h2>Rhea Flint</h2><p>Training Grounds Coach</p><blockquote>“Give the work time, then come back for the result.”</blockquote><button onClick={() => setPopup("talk")}><Icon name={SHARED + "talk.webp"} />Talk</button><button onClick={() => setPopup("upgrades")}><Icon name="yard-upgrade" />Trainer Upgrades</button></aside>
      <section className={styles.preview} aria-label="Selected trainee"><h2 className={styles.sign}>{creature ? `${creature.nickname} · Lv. ${creature.level}` : "Choose your trainee"}</h2><div className={styles.bodyArt}>{creature && variant ? <img src={variant.profilePath || variant.portraitPath} alt={`${creature.nickname}, full body`} /> : <div className={styles.emptyPreview}><img src="/images/ui/guild-v1/gp.webp" alt="" /><span>No creature selected</span></div>}</div>{creature && <p className={styles.creatureStatus}>{assignment ? getTrainingStatusLabel(save,creature.creatureId) : `${variant?.name} · Energy ${creature.energy}/${creature.maxEnergy}`}</p>}<div className={styles.previewActions}><button className={styles.primary} onClick={() => {setCreaturePage(0);setPopup("choose");}}>{creature ? "Change Creature" : "Choose a Creature"}</button>{creature && <button onClick={() => setPopup("profile")}>Full Profile</button>}</div><div className={styles.compactCoach}><button onClick={() => setPopup("talk")}><Icon name={SHARED + "talk.webp"} />Rhea</button><button onClick={() => setPopup("upgrades")}><Icon name="yard-upgrade" />Upgrades</button></div></section>
      <aside className={styles.plan} aria-label="Selected training plan">{plan}</aside>
    </section>
    <footer className={styles.dock}><span className={styles.dockTitle}>Training<br />Programs</span><div className={styles.programs}>{TRAINING_FOCI.map(item => <button key={item.focusId} aria-label={`Select ${item.name}`} aria-pressed={focus.focusId === item.focusId} disabled={!!assignment} onClick={() => setFocusId(item.focusId)}><img src={ART + FOCUS_ART[item.focusId] + ".webp"} alt="" /><span><strong>{item.name}</strong><small>{item.costGold} Gold · {item.durationDays} {item.durationDays === 1 ? "day" : "days"}</small><small>{item.requiresUpgradeId && !hasTrainingUpgrade(save,item.requiresUpgradeId) ? "Advanced License required" : item.category === "XP" ? `+${effects.levelDrillXp} XP` : `${effects.statCoachingChance}% chance`}</small></span></button>)}</div><div className={styles.mobilePrograms}><button aria-label="Previous program" disabled={!!assignment || TRAINING_FOCI.indexOf(focus) === 0} onClick={() => setFocusId(TRAINING_FOCI[TRAINING_FOCI.indexOf(focus)-1].focusId)}>❮</button><button aria-label="View training plan" onClick={() => setPopup("plan")}><Icon name={FOCUS_ART[focus.focusId]} /><span>{focus.name}<small>{focus.costGold} Gold · {focus.durationDays}d · Details</small></span></button><button aria-label="Next program" disabled={!!assignment || TRAINING_FOCI.indexOf(focus) === 2} onClick={() => setFocusId(TRAINING_FOCI[TRAINING_FOCI.indexOf(focus)+1].focusId)}>❯</button></div><button className={styles.recordsButton} onClick={() => showRecords()}><Icon name={SHARED + "ledger.webp"} /><span>Training Records</span></button></footer>
    {popup === "plan" && <GameDialog title="Training Plan" onClose={() => setPopup(null)}>{plan}</GameDialog>}
    {popup === "choose" && <GameDialog title="Choose a Creature" onClose={() => setPopup(null)} wide><p>Ready trainees appear first. Select one to collect its result.</p><div className={styles.choices}>{visibleCreatures.map(item => <button key={item.creatureId} onClick={() => choose(item)}><img src={getVariantDefinition(item.variantId).portraitPath} alt="" /><span><strong>{item.nickname}</strong><small>{getVariantDefinition(item.variantId).name} · Level {item.level}</small><small>{getTrainingStatusLabel(save,item.creatureId)}</small></span></button>)}</div>{!creatures.length && <p>No owned creatures. Adopt a creature in town first.</p>}<div className={styles.pager}><button disabled={creaturePage === 0} onClick={() => setCreaturePage(creaturePage-1)}>Previous creatures</button><span>{Math.min(creaturePage,creaturePages-1)+1} / {creaturePages}</span><button disabled={creaturePage >= creaturePages-1} onClick={() => setCreaturePage(creaturePage+1)}>Next creatures</button></div></GameDialog>}
    {popup === "profile" && creature && variant && <GameDialog title={`${creature.nickname} · Full Profile`} onClose={() => setPopup(null)} wide><div className={styles.profile}><img src={variant.profilePath || variant.portraitPath} alt={`${creature.nickname}, full body`} /><div><h3>{variant.name} · {variant.rarity}</h3><p>Level {creature.level} · XP {creature.xp}/{creature.xpToNext}</p><Stats creature={creature} /><p>Energy {creature.energy}/{creature.maxEnergy} · Affection {creature.affection}/100</p><p>{getTrainingStatusLabel(save,creature.creatureId)}</p><p>{getTrainingHistorySummary(save,creature.creatureId)}</p>{creature.abilities?.map(ability => <p key={ability.id}>{ability.name} · Grade {ability.grade}</p>)}</div></div></GameDialog>}
    {popup === "talk" && <GameDialog title="Talk to Rhea" onClose={() => setPopup(null)}><div className={styles.conversation}><img src={RHEA_FLINT.portraitPath} alt="Rhea Flint" /><p>“Leave your creature with me and come back when the program is done. Better equipment makes the work more reliable.”</p></div><p>Training takes in-game days. Trainees remain unavailable for other work until you collect them. Level Drill grants XP; coaching has a chance to raise a stat grade by one rank and add +1 to that stat.</p><p>Current facilities: {effects.levelDrillXp} XP per drill · {effects.statCoachingChance}% coaching chance · {effects.maxAssignments} training {effects.maxAssignments === 1 ? "place" : "places"}.</p><button onClick={() => setPopup("upgrades")}>Trainer Upgrades</button></GameDialog>}
    {popup === "confirm-training" && creature && <GameDialog title="Confirm Training" onClose={() => setPopup(null)}><h3>{creature.nickname} · {focus.name}</h3><p>{focus.description}</p><p><strong>{focus.costGold} Gold · {focus.durationDays} {focus.durationDays === 1 ? "day" : "days"}</strong></p><p>{outcome}{focus.category === "Stats" ? ". Success raises the grade one rank and adds +1 to the stat; improvement is not guaranteed." : "."}</p><p>Return on Ranch Day {save.dayState.dayNumber + focus.durationDays}. Your creature stays unavailable until collected. Facility upgrades can improve the result before collection.</p>{focus.focusId === "focused_stat_coaching" && <p>Target: {STAT_NAMES[targetStat]} · {creature.stats[targetStat]} · Grade {creature.statGrades[targetStat]}</p>}{reason && <p role="alert">{reason}</p>}<div className={styles.actions}><button onClick={() => setPopup(null)}>Cancel</button><button className={styles.primary} disabled={!!reason} onClick={() => commit("train")}>Leave with Rhea · {focus.costGold} Gold</button></div></GameDialog>}
    {popup === "records" && <GameDialog title="Training Records" onClose={() => setPopup(null)} wide><div className={styles.actions}>{(["all","ready","away"] as const).map(filter => <button key={filter} aria-pressed={recordFilter===filter} onClick={() => setRecordFilter(filter)}>{filter === "all" ? "All Creatures" : filter === "ready" ? "Ready for Pickup" : "In Training"}</button>)}</div><div className={styles.records}>{records.map(item => { const job = getTrainingAssignment(save,item.creatureId); return <article key={item.creatureId}><img src={getVariantDefinition(item.variantId).portraitPath} alt="" /><div><h3>{item.nickname}</h3><p>{getTrainingStatusLabel(save,item.creatureId)}</p><p>{getTrainingHistorySummary(save,item.creatureId)}</p>{job && <p>Return: Ranch Day {job.returnDayNumber}</p>}</div>{job?.isReady ? <button className={styles.primary} onClick={() => commit("collect",item.creatureId)}>Collect {item.nickname}</button> : <button onClick={() => choose(item)}>View {item.nickname}</button>}</article>;})}</div>{!records.length && <p>No creatures {recordFilter === "ready" ? "are ready for pickup" : recordFilter === "away" ? "are currently training" : "owned yet"}.</p>}</GameDialog>}
    {popup === "upgrades" && <GameDialog title="Trainer Upgrades" onClose={() => setPopup(null)} wide><p>{save.currencies.gold.toLocaleString()} Gold · {materials} Materials</p><div className={styles.upgrades}>{TRAINING_UPGRADES.map(item => { const owned = hasTrainingUpgrade(save,item.upgradeId); const check = purchaseTrainingUpgrade(save,item.upgradeId); return <article key={item.upgradeId}><img src={ART + UPGRADE_ART[item.upgradeId] + ".webp"} alt="" /><h3>{item.name}</h3><p>{item.effectLabel}</p><p>{item.costGold} Gold · {item.materialCost} Materials</p>{item.requiredUpgradeId && <p>Requires: {getTrainingUpgrade(item.requiredUpgradeId)?.name}</p>}{!owned && !check.ok && <p>{check.message}</p>}<button disabled={!check.ok} onClick={() => {setUpgradeId(item.upgradeId);setPopup("confirm-upgrade");}}>{owned ? "Installed" : `Review ${item.name}`}</button></article>;})}</div></GameDialog>}
    {popup === "confirm-upgrade" && <GameDialog title="Confirm Trainer Upgrade" onClose={() => setPopup("upgrades")}><img className={styles.upgradeHero} src={ART + UPGRADE_ART[upgradeId] + ".webp"} alt="" /><h3>{upgrade.name}</h3><p>{upgrade.description}</p><p>{upgrade.effectLabel}</p><p>{upgrade.costGold} Gold · {upgrade.materialCost} Materials</p>{!purchase.ok && <p role="alert">{purchase.message}</p>}<div className={styles.actions}><button onClick={() => setPopup("upgrades")}>Cancel</button><button className={styles.primary} disabled={!purchase.ok} onClick={() => commit("upgrade")}>Confirm Upgrade</button></div></GameDialog>}
    {popup === "result" && <GameDialog title={reward ? "Training Complete" : "Rhea’s Report"} onClose={() => setPopup(null)}><p role="status">{message}</p>{reward && <><h3>{reward.creatureName} · {reward.focusName}</h3><dl className={styles.report}><div><dt>Level</dt><dd>{reward.levelBefore} → {reward.levelAfter}</dd></div><div><dt>XP</dt><dd>{reward.xpBefore}/{reward.xpToNextBefore} → {reward.xpAfter}/{reward.xpToNextAfter}</dd></div>{reward.statKey && <div><dt>{STAT_NAMES[reward.statKey]}</dt><dd>{reward.statSucceeded ? `${reward.statBefore} → ${reward.statAfter} · Grade ${reward.gradeBefore} → ${reward.gradeAfter}` : "No increase this time"}</dd></div>}{typeof reward.statRoll === "number" && <div><dt>Coaching roll</dt><dd>{reward.statRoll}/100 · {reward.statChance}% chance</dd></div>}</dl>{reward.notes.map(note => <p key={note}>{note}</p>)}</>}<button className={styles.primary} onClick={() => setPopup(null)}>Continue</button></GameDialog>}
  </main>;
}
