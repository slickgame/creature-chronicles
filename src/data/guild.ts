import { getVariantDefinition } from "@/data/creatures";
import { getTownUpgradeEffects } from "@/data/upgrades";
import type { CreatureRecord } from "@/types/creature";
import type { ContractId } from "@/types/ids";
import type { GameSave } from "@/types/save";
import type { GuildActionResult, GuildContract, GuildContractRequirement, GuildContractTier, GuildState } from "@/types/guild";

const FIRST_COMPLETED_CONTRACT_GP_BONUS = 10;
function seededNumber(seed: number): number { const value = Math.sin(seed) * 10000; return value - Math.floor(value); }
function makeContractId(weekNumber: number, slot: number): ContractId { return `guild_contract_${weekNumber}_${slot}` as ContractId; }

function getTierReward(save: GameSave, tier: GuildContractTier, slot: number) {
  const roll = seededNumber(save.dayState.weekNumber * 71 + slot * 13);
  const effects = getTownUpgradeEffects(save);
  let goldReward = 0;
  let guildPointReward = 0;
  if (tier === "bronze") { goldReward = 85 + Math.round(roll * 50); guildPointReward = 8 + Math.floor(roll * 5); }
  else if (tier === "silver") { goldReward = 155 + Math.round(roll * 70); guildPointReward = 12 + Math.floor(roll * 7); }
  else { goldReward = 285 + Math.round(roll * 115); guildPointReward = 25 + Math.floor(roll * 16); }
  return { goldReward: Math.round((goldReward * effects.guildGoldRewardMultiplier) / 5) * 5, guildPointReward: guildPointReward + effects.guildBonusGp + (tier === "gold" && effects.guildBonusGp > 0 ? 1 : 0) };
}

function createContract(save: GameSave, slot: number, tier: GuildContractTier, title: string, description: string, requirement: GuildContractRequirement): GuildContract {
  const rewards = getTierReward(save, tier, slot);
  return { contractId: makeContractId(save.dayState.weekNumber, slot), weekNumber: save.dayState.weekNumber, tier, type: "donate_creature", status: "available", title, description, requirement, goldReward: rewards.goldReward, guildPointReward: rewards.guildPointReward, createdAtDayNumber: save.dayState.dayNumber, expiresAtWeekNumber: save.dayState.weekNumber + 1 };
}

type ContractTemplate = Omit<GuildContract, "contractId" | "weekNumber" | "type" | "status" | "goldReward" | "guildPointReward" | "createdAtDayNumber" | "expiresAtWeekNumber">;
function getBaseTemplates(): ContractTemplate[] {
  return [
    { tier: "bronze", title: "Stable Starter Request", description: "The guild needs a dependable common ranch creature for a new rural client.", requirement: { kind: "any_creature", label: "Donate any creature." } },
    { tier: "bronze", title: "Feline Helper Needed", description: "A quiet household wants a reliable feline companion for daily ranch support.", requirement: { kind: "family", family: "feline", label: "Donate any feline creature." } },
    { tier: "bronze", title: "Canine Patrol Request", description: "A nearby farm wants a loyal canine for basic patrol work.", requirement: { kind: "family", family: "canine", label: "Donate any canine creature." } },
    { tier: "bronze", title: "Bovine Stock Registry", description: "A rancher wants a sturdy bovine for future production and labor stock.", requirement: { kind: "family", family: "bovine", label: "Donate any bovine creature." } },
    { tier: "bronze", title: "Lapine Garden Helper", description: "A local gardener needs a quick lapine with strong fertility and garden instincts.", requirement: { kind: "family", family: "lapine", label: "Donate any lapine creature." } },
    { tier: "bronze", title: "Equine Field Hand", description: "A field crew wants a reliable equine for hauling and travel work.", requirement: { kind: "family", family: "equine", label: "Donate any equine creature." } },
    { tier: "silver", title: "Healthy Worker Request", description: "The guild is looking for a sturdy creature with strong stamina.", requirement: { kind: "stat_minimum", stat: "STA", minimum: 7, label: "Donate any creature with STA 7+." } },
    { tier: "silver", title: "Charming Companion Request", description: "A noble client wants a socially gifted creature with strong charm.", requirement: { kind: "stat_minimum", stat: "CHA", minimum: 7, label: "Donate any creature with CHA 7+." } },
    { tier: "silver", title: "Focused Willpower Request", description: "A guild partner wants a disciplined companion with strong willpower.", requirement: { kind: "stat_minimum", stat: "WIL", minimum: 7, label: "Donate any creature with WIL 7+." } },
    { tier: "bronze", title: "Reliable Fertility Registry", description: "The registrar is collecting fertile ranch stock for approved clients.", requirement: { kind: "stat_minimum", stat: "FER", minimum: 6, label: "Donate any creature with FER 6+." } },
    { tier: "gold", title: "Rare Bloodline Request", description: "A prestigious guild patron seeks a rare or better bloodline specimen.", requirement: { kind: "rarity", rarity: "Rare", label: "Donate any Rare or Epic creature." } },
    { tier: "gold", title: "Exceptional Dexterity Request", description: "A specialist needs a highly agile creature for delicate service work.", requirement: { kind: "stat_minimum", stat: "DEX", minimum: 8, label: "Donate any creature with DEX 8+." } },
    { tier: "gold", title: "Minotaur Security Trial", description: "A frontier estate wants a rare Minotaur for security and heavy-labor evaluation.", requirement: { kind: "variant", variantId: "variant_minotaur" as import("@/types/ids").VariantId, label: "Donate a Minotaur." } },
    { tier: "gold", title: "Moon Yak Recovery Program", description: "A clinic is searching for a Moon Yak to study calm recovery and rare production lines.", requirement: { kind: "variant", variantId: "variant_moon_yak" as import("@/types/ids").VariantId, label: "Donate a Moon Yak." } },
    { tier: "gold", title: "Antlerhare Garden Patron", description: "A greenhouse patron wants an Antlerhare for future garden work.", requirement: { kind: "variant", variantId: "variant_antlerhare" as import("@/types/ids").VariantId, label: "Donate an Antlerhare." } },
    { tier: "gold", title: "Dream Lop Nursery Study", description: "The nursery guild is looking for a Dream Lop with comfort and recovery traits.", requirement: { kind: "variant", variantId: "variant_dream_lop" as import("@/types/ids").VariantId, label: "Donate a Dream Lop." } },
    { tier: "gold", title: "Unicorn Lineage Request", description: "A prestigious patron seeks a Unicorn for healing and lineage research.", requirement: { kind: "variant", variantId: "variant_unicorn" as import("@/types/ids").VariantId, label: "Donate a Unicorn." } },
    { tier: "gold", title: "Nightmare Guard Contract", description: "A fortified ranch wants a Nightmare for future security and intimidation work.", requirement: { kind: "variant", variantId: "variant_nightmare" as import("@/types/ids").VariantId, label: "Donate a Nightmare." } },
  ];
}

function applyContractQuality(save: GameSave, templates: ContractTemplate[]) {
  const qualityTier = getTownUpgradeEffects(save).guildContractQualityTier;
  if (qualityTier <= 0) return templates;
  return templates.map((template, index) => { const roll = seededNumber(save.dayState.weekNumber * 157 + index * 29); const silverChance = [0, 0.18, 0.26, 0.34, 0.42][qualityTier] ?? 0; const goldChance = [0, 0.03, 0.07, 0.12, 0.18][qualityTier] ?? 0; if (template.tier === "bronze" && roll < silverChance) return { ...template, tier: "silver" as const }; if (template.tier === "silver" && roll < goldChance) return { ...template, tier: "gold" as const }; return template; });
}
function getWeeklyTemplates(save: GameSave): ContractTemplate[] { const effects = getTownUpgradeEffects(save); const templates = applyContractQuality(save, getBaseTemplates()); const rotatedTemplates = [...templates].sort((a, b) => seededNumber(save.dayState.weekNumber * 97 + a.title.length * 11) - seededNumber(save.dayState.weekNumber * 97 + b.title.length * 11)); return rotatedTemplates.slice(0, effects.guildContractCount); }
function createWeeklyContracts(save: GameSave): GuildContract[] { return getWeeklyTemplates(save).map((template, index) => createContract(save, index, template.tier, template.title, template.description, template.requirement)); }
export function createDefaultGuildState(save: GameSave): GuildState { return { weekNumber: save.dayState.weekNumber, lastGeneratedDayNumber: save.dayState.dayNumber, contracts: createWeeklyContracts(save), completedCount: 0, donatedCreatureCount: 0, guildRank: 1 }; }
export function ensureCurrentGuildState(save: GameSave): GameSave { const expectedContractCount = getTownUpgradeEffects(save).guildContractCount; if (!save.guild) return { ...save, guild: createDefaultGuildState(save) }; if (save.guild.weekNumber === save.dayState.weekNumber && save.guild.contracts.length >= expectedContractCount) return save; const retainedContracts = save.guild.contracts.filter((contract) => contract.status === "accepted" || contract.status === "completed").map((contract) => contract.status === "accepted" && contract.expiresAtWeekNumber <= save.dayState.weekNumber ? { ...contract, status: "expired" as const } : contract); return { ...save, guild: { ...save.guild, weekNumber: save.dayState.weekNumber, lastGeneratedDayNumber: save.dayState.dayNumber, contracts: [...retainedContracts, ...createWeeklyContracts(save)] } }; }
export function getContractTierIcon(tier: GuildContractTier): string { if (tier === "bronze") return "/images/ui/icons/icon_bronze_contract.png"; if (tier === "silver") return "/images/ui/icons/icon_silver_contract.png"; return "/images/ui/icons/icon_gold_contract.png"; }
export function getCreatureRarityRank(rarity: string): number { if (rarity === "Epic") return 4; if (rarity === "Rare") return 3; if (rarity === "Uncommon") return 2; return 1; }
export function doesCreatureMatchContract(creature: CreatureRecord, contract: GuildContract): boolean { const variant = getVariantDefinition(creature.variantId); const requirement = contract.requirement; if (contract.type !== "donate_creature" || contract.status === "completed" || contract.status === "expired") return false; if (requirement.kind === "any_creature") return true; if (requirement.kind === "family") return variant.family === requirement.family; if (requirement.kind === "variant") return creature.variantId === requirement.variantId; if (requirement.kind === "rarity") return getCreatureRarityRank(variant.rarity) >= getCreatureRarityRank(requirement.rarity ?? "Rare"); if (requirement.kind === "stat_minimum" && requirement.stat && requirement.minimum) return creature.stats[requirement.stat] >= requirement.minimum; return false; }
export function getEligibleCreaturesForContract(save: GameSave, contractId: string): CreatureRecord[] { const syncedSave = ensureCurrentGuildState(save); const contract = syncedSave.guild?.contracts.find((item) => item.contractId === contractId); if (!contract) return []; return (syncedSave.creatures ?? []).filter((creature) => doesCreatureMatchContract(creature, contract)); }
export function acceptGuildContract(save: GameSave, contractId: string): GuildActionResult { const syncedSave = ensureCurrentGuildState(save); const guild = syncedSave.guild ?? createDefaultGuildState(syncedSave); const contract = guild.contracts.find((item) => item.contractId === contractId); if (!contract) return { save: syncedSave, ok: false, message: "That contract no longer exists." }; if (contract.status !== "available") return { save: syncedSave, ok: false, message: "That contract is not available to accept." }; return { save: { ...syncedSave, guild: { ...guild, contracts: guild.contracts.map((item) => item.contractId === contractId ? { ...item, status: "accepted", acceptedAtDayNumber: syncedSave.dayState.dayNumber } : item) }, flags: { ...syncedSave.flags, m7GuildContractAccepted: true } }, ok: true, message: `${contract.title} accepted.` }; }

export function donateCreatureToGuildContract(save: GameSave, contractId: string, creatureId: string): GuildActionResult {
  const syncedSave = ensureCurrentGuildState(save);
  const guild = syncedSave.guild ?? createDefaultGuildState(syncedSave);
  const contract = guild.contracts.find((item) => item.contractId === contractId);
  const creature = (syncedSave.creatures ?? []).find((item) => item.creatureId === creatureId);
  if (!contract) return { save: syncedSave, ok: false, message: "That contract no longer exists." };
  if (!creature) return { save: syncedSave, ok: false, message: "That creature is no longer available." };
  if (creature.isLocked) return { save: syncedSave, ok: false, message: `${creature.nickname} is locked. Unlock them before donating.` };
  if (contract.status !== "accepted" && contract.status !== "available") return { save: syncedSave, ok: false, message: "That contract cannot receive donations." };
  if (!doesCreatureMatchContract(creature, contract)) return { save: syncedSave, ok: false, message: `${creature.nickname} does not meet this contract's requirements.` };
  const isWelcomeBonusAvailable = !syncedSave.flags.m105GuildWelcomeBonusClaimed;
  const welcomeBonusGp = isWelcomeBonusAvailable ? FIRST_COMPLETED_CONTRACT_GP_BONUS : 0;
  const nextCompletedCount = guild.completedCount + 1;
  const nextGuildRank = Math.max(guild.guildRank, 1 + Math.floor(nextCompletedCount / 5));
  const nextM9TotalDonated = Number(syncedSave.flags.m9TotalDonated ?? 0) + 1;
  const totalGpReward = contract.guildPointReward + welcomeBonusGp;
  const bonusText = welcomeBonusGp > 0 ? ` Guild Welcome Bonus +${welcomeBonusGp} GP.` : "";
  return { save: { ...syncedSave, updatedAt: new Date().toISOString(), currencies: { ...syncedSave.currencies, gold: syncedSave.currencies.gold + contract.goldReward, guildPoints: syncedSave.currencies.guildPoints + totalGpReward }, creatureIds: syncedSave.creatureIds.filter((id) => id !== creature.creatureId), creatures: (syncedSave.creatures ?? []).filter((item) => item.creatureId !== creature.creatureId), habitats: (syncedSave.habitats ?? []).map((habitat) => ({ ...habitat, creatureIds: habitat.creatureIds.filter((id) => id !== creature.creatureId) })), guild: { ...guild, completedCount: nextCompletedCount, donatedCreatureCount: guild.donatedCreatureCount + 1, guildRank: nextGuildRank, contracts: guild.contracts.map((item) => item.contractId === contractId ? { ...item, status: "completed", completedAtDayNumber: syncedSave.dayState.dayNumber, donatedCreatureId: creature.creatureId, donatedCreatureName: creature.nickname } : item) }, flags: { ...syncedSave.flags, m7GuildContractCompleted: true, m9CreatureManagement: true, m9TotalDonated: nextM9TotalDonated, m105GuildWelcomeBonusClaimed: true, m13GuildContentPack: true } }, ok: true, message: `${creature.nickname} donated. Earned ${contract.goldReward} Gold and ${totalGpReward} GP.${bonusText}` };
}
