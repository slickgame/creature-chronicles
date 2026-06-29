import { getVariantDefinition } from "@/data/creatures";
import { getTownUpgradeEffects } from "@/data/upgrades";
import type { CreatureRecord } from "@/types/creature";
import type { ContractId } from "@/types/ids";
import type { GameSave } from "@/types/save";
import type { GuildActionResult, GuildContract, GuildContractRequirement, GuildContractTier, GuildState } from "@/types/guild";

const FIRST_COMPLETED_CONTRACT_GP_BONUS = 10;
const MAX_QUALITY_GOLD_BONUS = 90;
const MAX_QUALITY_GP_BONUS = 6;

function seededNumber(seed: number): number {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

function makeContractId(weekNumber: number, slot: number): ContractId {
  return `guild_contract_${weekNumber}_${slot}` as ContractId;
}

function getTierReward(save: GameSave, tier: GuildContractTier, slot: number) {
  const roll = seededNumber(save.dayState.weekNumber * 71 + slot * 13);
  const effects = getTownUpgradeEffects(save);
  let goldReward = 0;
  let guildPointReward = 0;
  if (tier === "bronze") {
    goldReward = 85 + Math.round(roll * 50);
    guildPointReward = 8 + Math.floor(roll * 5);
  } else if (tier === "silver") {
    goldReward = 155 + Math.round(roll * 70);
    guildPointReward = 12 + Math.floor(roll * 7);
  } else {
    goldReward = 285 + Math.round(roll * 115);
    guildPointReward = 25 + Math.floor(roll * 16);
  }
  return {
    goldReward: Math.round((goldReward * effects.guildGoldRewardMultiplier) / 5) * 5,
    guildPointReward: guildPointReward + effects.guildBonusGp + (tier === "gold" && effects.guildBonusGp > 0 ? 1 : 0),
  };
}

function createContract(save: GameSave, slot: number, tier: GuildContractTier, title: string, description: string, requirement: GuildContractRequirement): GuildContract {
  const rewards = getTierReward(save, tier, slot);
  return {
    contractId: makeContractId(save.dayState.weekNumber, slot),
    weekNumber: save.dayState.weekNumber,
    tier,
    type: "donate_creature",
    status: "available",
    title,
    description,
    requirement,
    goldReward: rewards.goldReward,
    guildPointReward: rewards.guildPointReward,
    createdAtDayNumber: save.dayState.dayNumber,
    expiresAtWeekNumber: save.dayState.weekNumber + 1,
  };
}

type ContractTemplate = Omit<GuildContract, "contractId" | "weekNumber" | "type" | "status" | "goldReward" | "guildPointReward" | "createdAtDayNumber" | "expiresAtWeekNumber">;

function getBaseTemplates(): ContractTemplate[] {
  return [
    { tier: "bronze", title: "Veyra's Stable Starter Request", description: "Veyra wants a dependable common ranch creature placed with a careful first-time keeper near Bramblefen.", requirement: { kind: "any_creature", label: "Donate any creature." } },
    { tier: "bronze", title: "Mira's Feline Hearth Helper", description: "A quiet household wants a reliable feline companion for daily ranch support and pest watching.", requirement: { kind: "family", family: "feline", label: "Donate any feline creature." } },
    { tier: "bronze", title: "Ranger Canine Patrol Request", description: "A nearby farm wants a loyal canine for fence walks, trail scenting, and basic patrol work.", requirement: { kind: "family", family: "canine", label: "Donate any canine creature." } },
    { tier: "bronze", title: "Town Clerk Bovine Stock Registry", description: "The town registry is cataloging sturdy bovine lines for future production and labor stock.", requirement: { kind: "family", family: "bovine", label: "Donate any bovine creature." } },
    { tier: "bronze", title: "Veyra's Lapine Garden Helper", description: "Veyra knows a local gardener who needs a quick lapine with strong garden-ranch instincts.", requirement: { kind: "family", family: "lapine", label: "Donate any lapine creature." } },
    { tier: "bronze", title: "Mara's Equine Field Hand", description: "Mara Vell is matching a field crew with a reliable equine for hauling and travel work.", requirement: { kind: "family", family: "equine", label: "Donate any equine creature." } },
    { tier: "silver", title: "Mara's Healthy Worker Request", description: "Mara needs a sturdy creature with strong stamina for approved town service work.", requirement: { kind: "stat_minimum", stat: "STA", minimum: 7, label: "Donate any creature with STA 7+." } },
    { tier: "silver", title: "Noble Charming Companion Request", description: "A noble client wants a socially gifted creature with enough charm to handle guests and ceremonies.", requirement: { kind: "stat_minimum", stat: "CHA", minimum: 7, label: "Donate any creature with CHA 7+." } },
    { tier: "silver", title: "Veyra's Focused Willpower Request", description: "Veyra wants a disciplined companion for a skittish client rebuilding trust after a hard season.", requirement: { kind: "stat_minimum", stat: "WIL", minimum: 7, label: "Donate any creature with WIL 7+." } },
    { tier: "bronze", title: "Nursery Fertility Registry", description: "The nursery registrar is collecting fertile ranch stock for approved, carefully tracked clients.", requirement: { kind: "stat_minimum", stat: "FER", minimum: 6, label: "Donate any creature with FER 6+." } },
    { tier: "silver", title: "Mara's Hauling Strength Order", description: "The quartermaster desk needs a creature with enough strength for construction errands and supply runs.", requirement: { kind: "stat_minimum", stat: "STR", minimum: 7, label: "Donate any creature with STR 7+." } },
    { tier: "silver", title: "Quick Courier Dexterity Request", description: "A courier office needs a nimble creature that can handle crowded lanes and delicate parcels.", requirement: { kind: "stat_minimum", stat: "DEX", minimum: 7, label: "Donate any creature with DEX 7+." } },
    { tier: "gold", title: "Town Clerk Rare Bloodline Request", description: "A prestigious guild patron seeks a rare or better bloodline specimen for the official registry.", requirement: { kind: "rarity", rarity: "Rare", label: "Donate any Rare or Epic creature." } },
    { tier: "gold", title: "Exceptional Dexterity Request", description: "A specialist needs a highly agile creature for delicate service work and instrument handling.", requirement: { kind: "stat_minimum", stat: "DEX", minimum: 8, label: "Donate any creature with DEX 8+." } },
    { tier: "gold", title: "Ranger Minotaur Security Trial", description: "A frontier estate wants a rare Minotaur for security and heavy-labor evaluation.", requirement: { kind: "variant", variantId: "variant_minotaur" as import("@/types/ids").VariantId, label: "Donate a Minotaur." } },
    { tier: "gold", title: "Moon Yak Recovery Program", description: "A clinic is searching for a Moon Yak to study calm recovery and rare production lines.", requirement: { kind: "variant", variantId: "variant_moon_yak" as import("@/types/ids").VariantId, label: "Donate a Moon Yak." } },
    { tier: "gold", title: "Veyra's Antlerhare Garden Patron", description: "A greenhouse patron wants an Antlerhare for future garden restoration work.", requirement: { kind: "variant", variantId: "variant_antlerhare" as import("@/types/ids").VariantId, label: "Donate an Antlerhare." } },
    { tier: "gold", title: "Dream Lop Nursery Study", description: "The nursery guild is looking for a Dream Lop with comfort and recovery traits.", requirement: { kind: "variant", variantId: "variant_dream_lop" as import("@/types/ids").VariantId, label: "Donate a Dream Lop." } },
    { tier: "gold", title: "Unicorn Lineage Request", description: "A prestigious patron seeks a Unicorn for healing and lineage research.", requirement: { kind: "variant", variantId: "variant_unicorn" as import("@/types/ids").VariantId, label: "Donate a Unicorn." } },
    { tier: "gold", title: "Ranger Nightmare Guard Contract", description: "A fortified ranch wants a Nightmare for future security and intimidation work.", requirement: { kind: "variant", variantId: "variant_nightmare" as import("@/types/ids").VariantId, label: "Donate a Nightmare." } },
  ];
}

function applyContractQuality(save: GameSave, templates: ContractTemplate[]) {
  const qualityTier = getTownUpgradeEffects(save).guildContractQualityTier;
  if (qualityTier <= 0) return templates;
  return templates.map((template, index) => {
    const roll = seededNumber(save.dayState.weekNumber * 157 + index * 29);
    const silverChance = [0, 0.18, 0.26, 0.34, 0.42][qualityTier] ?? 0;
    const goldChance = [0, 0.03, 0.07, 0.12, 0.18][qualityTier] ?? 0;
    if (template.tier === "bronze" && roll < silverChance) return { ...template, tier: "silver" as const };
    if (template.tier === "silver" && roll < goldChance) return { ...template, tier: "gold" as const };
    return template;
  });
}

function getWeeklyTemplates(save: GameSave): ContractTemplate[] {
  const effects = getTownUpgradeEffects(save);
  const templates = applyContractQuality(save, getBaseTemplates());
  const rotatedTemplates = [...templates].sort((a, b) => seededNumber(save.dayState.weekNumber * 97 + a.title.length * 11) - seededNumber(save.dayState.weekNumber * 97 + b.title.length * 11));
  return rotatedTemplates.slice(0, effects.guildContractCount);
}

function createWeeklyContracts(save: GameSave): GuildContract[] {
  return getWeeklyTemplates(save).map((template, index) => createContract(save, index, template.tier, template.title, template.description, template.requirement));
}

export function createDefaultGuildState(save: GameSave): GuildState {
  return { weekNumber: save.dayState.weekNumber, lastGeneratedDayNumber: save.dayState.dayNumber, contracts: createWeeklyContracts(save), completedCount: 0, donatedCreatureCount: 0, guildRank: 1 };
}

export function ensureCurrentGuildState(save: GameSave): GameSave {
  const expectedContractCount = getTownUpgradeEffects(save).guildContractCount;
  if (!save.guild) return { ...save, guild: createDefaultGuildState(save), flags: { ...save.flags, m15GuildWeeklyRefresh: true } };

  const weekChanged = save.guild.weekNumber !== save.dayState.weekNumber;
  const currentWeekContracts = save.guild.contracts.filter((contract) => contract.weekNumber === save.dayState.weekNumber && contract.status !== "expired");
  if (!weekChanged && currentWeekContracts.length >= expectedContractCount) return save;

  const retainedContracts = weekChanged
    ? save.guild.contracts.filter((contract) => contract.status === "accepted" && contract.expiresAtWeekNumber > save.dayState.weekNumber)
    : save.guild.contracts.filter((contract) => contract.weekNumber === save.dayState.weekNumber && contract.status !== "expired");
  const existingIds = new Set(retainedContracts.map((contract) => contract.contractId));
  const newContracts = createWeeklyContracts(save).filter((contract) => !existingIds.has(contract.contractId));
  if (!weekChanged && newContracts.length === 0) return save;

  return {
    ...save,
    guild: { ...save.guild, weekNumber: save.dayState.weekNumber, lastGeneratedDayNumber: save.dayState.dayNumber, contracts: [...retainedContracts, ...newContracts] },
    flags: { ...save.flags, m15GuildWeeklyRefresh: true, guildBoardLastRefreshWeek: save.dayState.weekNumber },
  };
}

export function getContractTierIcon(tier: GuildContractTier): string {
  if (tier === "bronze") return "/images/ui/icons/icon_bronze_contract.png";
  if (tier === "silver") return "/images/ui/icons/icon_silver_contract.png";
  return "/images/ui/icons/icon_gold_contract.png";
}

export function getCreatureRarityRank(rarity: string): number {
  if (rarity === "Epic") return 4;
  if (rarity === "Rare") return 3;
  if (rarity === "Uncommon") return 2;
  return 1;
}

export function doesCreatureMatchContract(creature: CreatureRecord, contract: GuildContract): boolean {
  const variant = getVariantDefinition(creature.variantId);
  const requirement = contract.requirement;
  if (contract.type !== "donate_creature" || contract.status === "completed" || contract.status === "expired") return false;
  if (requirement.kind === "any_creature") return true;
  if (requirement.kind === "family") return variant.family === requirement.family;
  if (requirement.kind === "variant") return creature.variantId === requirement.variantId;
  if (requirement.kind === "rarity") return getCreatureRarityRank(variant.rarity) >= getCreatureRarityRank(requirement.rarity ?? "Rare");
  if (requirement.kind === "stat_minimum" && requirement.stat && requirement.minimum) return creature.stats[requirement.stat] >= requirement.minimum;
  return false;
}

export function getEligibleCreaturesForContract(save: GameSave, contractId: string): CreatureRecord[] {
  const syncedSave = ensureCurrentGuildState(save);
  const contract = syncedSave.guild?.contracts.find((item) => item.contractId === contractId);
  if (!contract) return [];
  return (syncedSave.creatures ?? []).filter((creature) => doesCreatureMatchContract(creature, contract));
}

function calculateContractQualityBonus(creature: CreatureRecord, contract: GuildContract): { gold: number; gp: number; reasons: string[] } {
  const reasons: string[] = [];
  let points = 0;
  const requirement = contract.requirement;
  const variant = getVariantDefinition(creature.variantId);
  if (requirement.kind === "stat_minimum" && requirement.stat && requirement.minimum) {
    const excess = Math.max(0, creature.stats[requirement.stat] - requirement.minimum);
    if (excess > 0) {
      points += Math.min(6, excess) * 2;
      reasons.push(`+${excess} ${requirement.stat} above request`);
    }
  }
  if (creature.level > 1) {
    points += Math.min(8, creature.level - 1);
    reasons.push(`Lv ${creature.level}`);
  }
  const abilityCount = creature.abilities?.length ?? 0;
  if (abilityCount > 0) {
    points += abilityCount * 4;
    reasons.push(`${abilityCount} inherited ${abilityCount === 1 ? "ability" : "abilities"}`);
  }
  const rarityRank = getCreatureRarityRank(variant.rarity);
  if (rarityRank > 1) {
    points += (rarityRank - 1) * 5;
    reasons.push(`${variant.rarity} rarity`);
  }
  if (creature.affection >= 75) {
    points += 3;
    reasons.push("high affection");
  }
  const gold = Math.min(MAX_QUALITY_GOLD_BONUS, Math.floor(points / 3) * 10);
  const gp = Math.min(MAX_QUALITY_GP_BONUS, Math.floor(points / 8));
  return { gold, gp, reasons };
}

export function acceptGuildContract(save: GameSave, contractId: string): GuildActionResult {
  const syncedSave = ensureCurrentGuildState(save);
  const guild = syncedSave.guild ?? createDefaultGuildState(syncedSave);
  const contract = guild.contracts.find((item) => item.contractId === contractId);
  if (!contract) return { save: syncedSave, ok: false, message: "That contract no longer exists." };
  if (contract.status !== "available") return { save: syncedSave, ok: false, message: "That contract is not available to accept." };
  return { save: { ...syncedSave, guild: { ...guild, contracts: guild.contracts.map((item) => item.contractId === contractId ? { ...item, status: "accepted", acceptedAtDayNumber: syncedSave.dayState.dayNumber } : item) }, flags: { ...syncedSave.flags, m7GuildContractAccepted: true } }, ok: true, message: `${contract.title} accepted.` };
}

export function donateCreatureToGuildContract(save: GameSave, contractId: string, creatureId: string): GuildActionResult {
  const syncedSave = ensureCurrentGuildState(save);
  const guild = syncedSave.guild ?? createDefaultGuildState(syncedSave);
  const contract = guild.contracts.find((item) => item.contractId === contractId);
  const creature = (syncedSave.creatures ?? []).find((item) => item.creatureId === creatureId);
  if (!contract) return { save: syncedSave, ok: false, message: "That contract no longer exists." };
  if (!creature) return { save: syncedSave, ok: false, message: "That creature is no longer available." };
  if (creature.isLocked) return { save: syncedSave, ok: false, message: `${creature.nickname} is locked. Unlock them before donating.` };
  if (contract.status !== "accepted" && contract.status !== "available") return { save: syncedSave, ok: false, message: "That contract cannot receive donations." };
  if (!doesCreatureMatchContract(creature, contract)) return { save: syncedSave, ok: false, message: `${creature.nickname} does not match that contract.` };

  const qualityBonus = calculateContractQualityBonus(creature, contract);
  const firstBonus = guild.completedCount === 0 ? FIRST_COMPLETED_CONTRACT_GP_BONUS : 0;
  const goldReward = contract.goldReward + qualityBonus.gold;
  const guildPointReward = contract.guildPointReward + qualityBonus.gp + firstBonus;
  const nextContracts = guild.contracts.map((item) => item.contractId === contractId ? { ...item, status: "completed" as const, completedAtDayNumber: syncedSave.dayState.dayNumber, donatedCreatureId: creature.creatureId, donatedCreatureName: creature.nickname } : item);
  const nextCreatures = (syncedSave.creatures ?? []).filter((item) => item.creatureId !== creature.creatureId);
  const bonusText = qualityBonus.gold || qualityBonus.gp ? ` Quality bonus: +${qualityBonus.gold} Gold, +${qualityBonus.gp} GP (${qualityBonus.reasons.slice(0, 3).join(", ")}).` : "";
  const firstBonusText = firstBonus ? ` First contract bonus: +${firstBonus} GP.` : "";
  return {
    save: {
      ...syncedSave,
      creatures: nextCreatures,
      creatureIds: syncedSave.creatureIds.filter((id) => id !== creature.creatureId),
      habitats: (syncedSave.habitats ?? []).map((habitat) => ({ ...habitat, creatureIds: habitat.creatureIds.filter((id) => id !== creature.creatureId) })),
      guild: { ...guild, contracts: nextContracts, completedCount: guild.completedCount + 1, donatedCreatureCount: guild.donatedCreatureCount + 1, guildRank: Math.max(guild.guildRank, Math.floor((guild.completedCount + 1) / 5) + 1) },
      currencies: { ...syncedSave.currencies, gold: syncedSave.currencies.gold + goldReward, guildPoints: syncedSave.currencies.guildPoints + guildPointReward },
      flags: { ...syncedSave.flags, m7GuildContractCompleted: true, m33ContractQualityBonus: true },
    },
    ok: true,
    message: `${creature.nickname} completed ${contract.title}. Earned ${goldReward} Gold and ${guildPointReward} GP.${bonusText}${firstBonusText}`,
  };
}
