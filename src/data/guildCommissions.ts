import { guildRandom, guildRoll } from "./guildRandom";
import { getTownUpgradeEffects } from "./upgrades";
import type { GameSave } from "@/types/save";
import type { GuildContract, GuildObjective, GuildActionResult } from "@/types/guild";
import type { ContractId } from "@/types/ids";
import type { RanchJobResult } from "@/types/ranchJobs";

export const GUILD_REQUEST_LABELS = { delivery: "Delivery", chore_commission: "Chore Commission", battle_bounty: "Battle Bounty", service_creature: "Creature Service", donate_creature: "Permanent Placement" } as const;
const JOB_NAMES = { security_patrol: "Security Patrol", comfort_care: "Comfort Care", stable_production: "Stable Production", garden_tending: "Garden Tending", field_hauling: "Field Hauling" };
export function safeMissionCount(value: unknown): number { const n = Number(value); return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0; }
export function recordGuildChoreWork(save: GameSave, results: RanchJobResult[]): GameSave["flags"] {
  const flags = { ...save.flags };
  for (const result of results) {
    if (result.energyCost <= 0) continue; // Skipped, injured, tired and away helpers are not completed work.
    const key = `guildChoreCompletions_${result.jobId}`;
    flags[key] = safeMissionCount(flags[key]) + 1;
  }
  return flags;
}
export function getGuildObjectiveCount(save: GameSave, objective: GuildObjective): number {
  if (objective.kind === "delivery") return safeMissionCount(save.flags[objective.resource === "feed" ? "ranchFeedStock" : "ranchMaterialsStock"]);
  return safeMissionCount(save.flags[objective.kind === "battle" ? "guildBattleWins" : `guildChoreCompletions_${objective.jobId}`]);
}
export function getGuildCommissionProgress(save: GameSave, contract: GuildContract) {
  const objective = contract.objective;
  if (!objective) return null;
  const target = objective.amount;
  const expired = save.dayState.weekNumber >= contract.expiresAtWeekNumber || contract.status === "expired";
  const completed = contract.status === "completed";
  const accepted = contract.status === "accepted";
  const current = completed ? target : objective.kind === "delivery" ? getGuildObjectiveCount(save, objective) : accepted ? Math.max(0, getGuildObjectiveCount(save, objective) - (contract.objectiveBaseline ?? getGuildObjectiveCount(save, objective))) : 0;
  const ready = accepted && !expired && current >= target;
  const unit = objective.kind === "delivery" ? objective.resource === "feed" ? "Feed" : "Materials" : objective.kind === "battle" ? "recorded victories" : "completed helper shifts";
  const instruction = objective.kind === "delivery" ? `Hand over ${target} ${unit}. Stock is deducted only when you confirm delivery.` : objective.kind === "battle" ? `Record ${target} Coliseum ${target === 1 ? "victory" : "victories"} after accepting. Circuit and challenge wins count; losses and draws do not.` : `Complete ${target} helper ${target === 1 ? "shift" : "shifts"} on ${JOB_NAMES[objective.jobId]} after accepting. Each rested helper who finishes the chore during overnight processing counts once.`;
  return { current, target, unit, ready, instruction, status: completed ? "Completed" : expired ? "Expired" : !accepted ? "Accept to begin" : ready ? "Ready to claim" : "In progress", remaining: Math.max(0, target - current) };
}

/** A delivery, a chore commission and a bounty are guaranteed each week. */
export function createWeeklyCommissions(save: GameSave): GuildContract[] {
  const week = save.dayState.weekNumber;
  const advanced = week >= 3;
  const deliveryOptions = [
    { title: "Feed for the Waystation", resource: "feed" as const, amount: 5, gold: 60, gp: 10 },
    { title: "Timber for the Footbridge", resource: "materials" as const, amount: 4, gold: 85, gp: 12 },
    { title: "Nursery Pantry Restock", resource: "feed" as const, amount: 8, gold: 90, gp: 14 },
    { title: "Workshop Supply Run", resource: "materials" as const, amount: 6, gold: 120, gp: 16 },
  ];
  const chores = ["garden_tending", "security_patrol", "field_hauling", "comfort_care", "stable_production"] as const;
  const delivery = deliveryOptions[(Math.floor(guildRandom(save, "delivery", false) * deliveryOptions.length) + guildRoll(save)) % deliveryOptions.length];
  const jobId = chores[(Math.floor(guildRandom(save, "chore", false) * chores.length) + guildRoll(save)) % chores.length];
  const effects = getTownUpgradeEffects(save);
  const battleWins = (advanced ? 2 : 1) + ((Math.floor(guildRandom(save, "bounty-target", false) * 2) + guildRoll(save)) % 2);
  const entries: Array<{ title: string; description: string; objective: GuildObjective; type: GuildContract["type"]; gold: number; gp: number; requester: string }> = [
    { title: delivery.title, description: "The town needs a small supply delivery. Check what your own ranch will need overnight before committing its stock.", objective: {kind:"delivery", resource:delivery.resource, amount:delivery.amount}, type:"delivery", gold:delivery.gold, gp:delivery.gp, requester:"Pella Mosswick" },
    { title: `${JOB_NAMES[jobId]} Commission`, description: "Mara is rewarding reliable ranch work. Accept first, assign helpers at the chore board, then return after their shifts are recorded.", objective: {kind:"chore", jobId, amount:advanced ? 4 : 2}, type:"chore_commission", gold:advanced ? 125 : 75, gp:advanced ? 18 : 12, requester:"Mara Vell" },
    { title: battleWins === 1 ? "First Steps in the Arena" : battleWins === 2 ? "Two Victories for the Guild" : "Three Victories for the Guild", description: "The Guild sponsors ranch teams willing to test their training. These victories need not be consecutive, and no creature is handed over.", objective: {kind:"battle", amount:battleWins}, type:"battle_bounty", gold:60 + battleWins * 35, gp:6 + battleWins * 6, requester:"Ranger Captain" },
  ];
  return entries.map((entry, index) => ({
    contractId:`guild_commission_${week}_${index}${guildRoll(save) ? `_r${guildRoll(save)}` : ""}` as ContractId,weekNumber:week,tier:advanced ? "silver" : "bronze",type:entry.type,category:entry.type === "battle_bounty" ? "security" : "restoration",requesterId:entry.type === "delivery" ? "pella_mosswick" : entry.type === "chore_commission" ? "mara_vell" : "ranger_captain",requesterName:entry.requester,trustTarget:"Guild",status:"available",title:entry.title,description:entry.description,
    requirement:{kind:"objective",label:entry.objective.kind === "delivery" ? `${entry.objective.amount} ${entry.objective.resource === "feed" ? "Feed" : "Materials"}` : entry.objective.kind === "chore" ? `${entry.objective.amount} ${JOB_NAMES[entry.objective.jobId]} shifts` : `${entry.objective.amount} Coliseum ${entry.objective.amount === 1 ? "win" : "wins"}`},objective:entry.objective,
    goldReward:Math.round(entry.gold * effects.guildGoldRewardMultiplier / 5) * 5,guildPointReward:entry.gp + effects.guildBonusGp,createdAtDayNumber:save.dayState.dayNumber,expiresAtWeekNumber:week+1,
  }));
}

export function completeGuildCommission(save: GameSave, contractId: string): GuildActionResult {
  const guild = save.guild; const contract = guild?.contracts.find(c => c.contractId === contractId);
  if (!guild || !contract?.objective) return {save,ok:false,message:"That commission is no longer on the board."};
  const progress = getGuildCommissionProgress(save,contract)!;
  if (!progress.ready) return {save,ok:false,message:progress.status === "In progress" ? `Still need ${progress.remaining} ${progress.unit}.` : progress.status === "Completed" ? "This reward has already been claimed." : progress.status === "Expired" ? "This request has expired." : "Accept this request before completing it."};
  const flags: GameSave["flags"] = {...save.flags,m7GuildContractCompleted:true};
  if (contract.objective.kind === "delivery") flags.guildDeliveriesCompleted = safeMissionCount(flags.guildDeliveriesCompleted) + 1;
  if (contract.objective.kind === "delivery") {
    const key = contract.objective.resource === "feed" ? "ranchFeedStock" : "ranchMaterialsStock";
    flags[key] = getGuildObjectiveCount(save,contract.objective) - contract.objective.amount;
  }
  const gp = contract.guildPointReward + (guild.completedCount === 0 ? 10 : 0);
  const completedCount = guild.completedCount + 1;
  return {ok:true,message:`${contract.title} completed. Earned ${contract.goldReward} Gold and ${gp} GP.${guild.completedCount === 0 ? " Includes the first-contract +10 GP bonus." : ""}`,save:{...save,flags,currencies:{...save.currencies,gold:save.currencies.gold+contract.goldReward,guildPoints:save.currencies.guildPoints+gp},guild:{...guild,completedCount,guildRank:Math.max(guild.guildRank,Math.floor(completedCount/5)+1),contracts:guild.contracts.map(c=>c.contractId===contractId?{...c,status:"completed",completedAtDayNumber:save.dayState.dayNumber,objectiveCompletedCount:progress.target}:c)}}};
}
