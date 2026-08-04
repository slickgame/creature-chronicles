import { getVariantDefinition } from "@/data/creatures";
import { getTownUpgradeEffects } from "@/data/upgrades";
import type { CreatureRecord } from "@/types/creature";
import type { ContractId, VariantId } from "@/types/ids";
import type { GameSave } from "@/types/save";
import type { GuildActionResult, GuildContract, GuildContractCategory, GuildContractRequirement, GuildContractTier, GuildContractType, GuildState } from "@/types/guild";

const FIRST_COMPLETED_CONTRACT_GP_BONUS = 10;
const MAX_QUALITY_GOLD_BONUS = 90;
const MAX_QUALITY_GP_BONUS = 6;
const DEFAULT_SERVICE_ENERGY_COST = 14;
const DEFAULT_SERVICE_XP_REWARD = 12;
const DEFAULT_SERVICE_AFFECTION_REWARD = 3;

type ContractTemplate = {
  tier: GuildContractTier;
  type: GuildContractType;
  category: GuildContractCategory;
  requesterId: string;
  requesterName: string;
  trustTarget: string;
  title: string;
  description: string;
  requirement: GuildContractRequirement;
  serviceEnergyCost?: number;
  serviceXpReward?: number;
  serviceAffectionReward?: number;
};

function seededNumber(seed: number): number {
  const value = Math.sin(seed) * 10000;
  return value - Math.floor(value);
}

function makeContractId(weekNumber: number, slot: number): ContractId {
  return `guild_contract_${weekNumber}_${slot}` as ContractId;
}

function getTierReward(save: GameSave, tier: GuildContractTier, slot: number, type: GuildContractType) {
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
  const typeGoldMultiplier = type === "service_creature" ? 0.72 : 1;
  const typeGpMultiplier = type === "service_creature" ? 0.85 : 1;
  return {
    goldReward: Math.round((goldReward * typeGoldMultiplier * effects.guildGoldRewardMultiplier) / 5) * 5,
    guildPointReward: Math.max(1, Math.round(guildPointReward * typeGpMultiplier)) + effects.guildBonusGp + (tier === "gold" && effects.guildBonusGp > 0 ? 1 : 0),
  };
}

function createContract(save: GameSave, slot: number, template: ContractTemplate): GuildContract {
  const rewards = getTierReward(save, template.tier, slot, template.type);
  return {
    contractId: makeContractId(save.dayState.weekNumber, slot),
    weekNumber: save.dayState.weekNumber,
    tier: template.tier,
    type: template.type,
    category: template.category,
    requesterId: template.requesterId,
    requesterName: template.requesterName,
    trustTarget: template.trustTarget,
    status: "available",
    title: template.title,
    description: template.description,
    requirement: template.requirement,
    goldReward: rewards.goldReward,
    guildPointReward: rewards.guildPointReward,
    serviceEnergyCost: template.type === "service_creature" ? template.serviceEnergyCost ?? DEFAULT_SERVICE_ENERGY_COST : undefined,
    serviceXpReward: template.type === "service_creature" ? template.serviceXpReward ?? DEFAULT_SERVICE_XP_REWARD : undefined,
    serviceAffectionReward: template.type === "service_creature" ? template.serviceAffectionReward ?? DEFAULT_SERVICE_AFFECTION_REWARD : undefined,
    createdAtDayNumber: save.dayState.dayNumber,
    expiresAtWeekNumber: save.dayState.weekNumber + 1,
  };
}

function inferCategoryFromText(contract: Partial<GuildContract>): GuildContractCategory {
  const text = `${contract.title ?? ""} ${contract.description ?? ""} ${contract.requirement?.label ?? ""}`.toLowerCase();
  if (text.includes("veyra") || text.includes("garden") || text.includes("restoration") || text.includes("starter")) return "restoration";
  if (text.includes("nursery") || text.includes("fertility") || text.includes("bloodline") || text.includes("lineage") || text.includes("lop")) return "lineage";
  if (text.includes("security") || text.includes("guard") || text.includes("patrol") || text.includes("nightmare") || text.includes("minotaur")) return "security";
  if (text.includes("registr") || text.includes("rare") || text.includes("dexterity") || text.includes("charm")) return "registry";
  if (text.includes("mara") || text.includes("quartermaster") || text.includes("service") || text.includes("field") || text.includes("worker") || text.includes("hauling")) return "service";
  return "general";
}

function getRequesterForCategory(category: GuildContractCategory) {
  if (category === "service") return { requesterId: "mara_vell", requesterName: "Mara Vell", trustTarget: "Mara" };
  if (category === "restoration") return { requesterId: "veyra", requesterName: "Veyra", trustTarget: "Veyra" };
  if (category === "lineage") return { requesterId: "nursery_matron", requesterName: "Nursery Matron", trustTarget: "Nursery" };
  if (category === "security") return { requesterId: "ranger_captain", requesterName: "Ranger Captain", trustTarget: "Rangers" };
  if (category === "registry") return { requesterId: "town_clerk", requesterName: "Town Clerk", trustTarget: "Town" };
  return { requesterId: "guild_board", requesterName: "Request Board", trustTarget: "Guild" };
}

function normalizeContract(contract: GuildContract): GuildContract {
  const category = contract.category ?? inferCategoryFromText(contract);
  const requester = getRequesterForCategory(category);
  return {
    ...contract,
    type: contract.type ?? "donate_creature",
    category,
    requesterId: contract.requesterId ?? requester.requesterId,
    requesterName: contract.requesterName ?? requester.requesterName,
    trustTarget: contract.trustTarget ?? requester.trustTarget,
  };
}

function getBaseTemplates(): ContractTemplate[] {
  return [
    { tier: "bronze", type: "donate_creature", category: "restoration", requesterId: "veyra", requesterName: "Veyra", trustTarget: "Veyra", title: "Veyra's Stable Starter Request", description: "Veyra wants a dependable common ranch creature placed with a careful first-time keeper near Bramblefen.", requirement: { kind: "any_creature", label: "Donate any creature." } },
    { tier: "bronze", type: "donate_creature", category: "general", requesterId: "hearth_household", requesterName: "Hearth Household", trustTarget: "Guild", title: "Feline Hearth Helper", description: "A quiet household wants a reliable feline companion for daily ranch support and pest watching.", requirement: { kind: "family", family: "feline", label: "Donate any feline creature." } },
    { tier: "bronze", type: "donate_creature", category: "security", requesterId: "ranger_captain", requesterName: "Ranger Captain", trustTarget: "Rangers", title: "Ranger Canine Patrol Request", description: "A nearby farm wants a loyal canine for fence walks, trail scenting, and basic patrol work.", requirement: { kind: "family", family: "canine", label: "Donate any canine creature." } },
    { tier: "bronze", type: "donate_creature", category: "registry", requesterId: "town_clerk", requesterName: "Town Clerk", trustTarget: "Town", title: "Bovine Stock Registry", description: "The town registry is cataloging sturdy bovine lines for future production and labor stock.", requirement: { kind: "family", family: "bovine", label: "Donate any bovine creature." } },
    { tier: "bronze", type: "donate_creature", category: "restoration", requesterId: "veyra", requesterName: "Veyra", trustTarget: "Veyra", title: "Veyra's Lapine Garden Helper", description: "Veyra knows a local gardener who needs a quick lapine with strong garden-ranch instincts.", requirement: { kind: "family", family: "lapine", label: "Donate any lapine creature." } },
    { tier: "bronze", type: "donate_creature", category: "service", requesterId: "mara_vell", requesterName: "Mara Vell", trustTarget: "Mara", title: "Mara's Equine Field Hand", description: "Mara Vell is matching a field crew with a reliable equine for hauling and travel work.", requirement: { kind: "family", family: "equine", label: "Donate any equine creature." } },
    { tier: "bronze", type: "service_creature", category: "service", requesterId: "mara_vell", requesterName: "Mara Vell", trustTarget: "Mara", title: "Field Hauling Day Shift", description: "Mara needs a creature for a one-day hauling shift. The creature returns after the work is logged.", requirement: { kind: "stat_minimum", stat: "STA", minimum: 5, label: "Send any creature with STA 5+ for service." }, serviceEnergyCost: 12, serviceXpReward: 12, serviceAffectionReward: 2 },
    { tier: "bronze", type: "service_creature", category: "restoration", requesterId: "veyra", requesterName: "Veyra", trustTarget: "Veyra", title: "Garden Recovery Visit", description: "Veyra is coordinating a gentle garden recovery visit for a neighbor who lost a planting bed.", requirement: { kind: "family", family: "lapine", label: "Send any lapine creature for service." }, serviceEnergyCost: 10, serviceXpReward: 10, serviceAffectionReward: 4 },
    { tier: "bronze", type: "service_creature", category: "security", requesterId: "ranger_captain", requesterName: "Ranger Captain", trustTarget: "Rangers", title: "Fence Line Patrol Shift", description: "The ranger post needs a creature to walk a safe fence line and report signs of trouble.", requirement: { kind: "family", family: "canine", label: "Send any canine creature for service." }, serviceEnergyCost: 12, serviceXpReward: 12, serviceAffectionReward: 2 },
    { tier: "silver", type: "donate_creature", category: "service", requesterId: "mara_vell", requesterName: "Mara Vell", trustTarget: "Mara", title: "Mara's Healthy Worker Request", description: "Mara needs a sturdy creature with strong stamina for approved town service work.", requirement: { kind: "stat_minimum", stat: "STA", minimum: 7, label: "Donate any creature with STA 7+." } },
    { tier: "silver", type: "donate_creature", category: "registry", requesterId: "town_clerk", requesterName: "Town Clerk", trustTarget: "Town", title: "Noble Charming Companion Request", description: "A noble client wants a socially gifted creature with enough charm to handle guests and ceremonies.", requirement: { kind: "stat_minimum", stat: "CHA", minimum: 7, label: "Donate any creature with CHA 7+." } },
    { tier: "silver", type: "donate_creature", category: "restoration", requesterId: "veyra", requesterName: "Veyra", trustTarget: "Veyra", title: "Veyra's Focused Willpower Request", description: "Veyra wants a disciplined companion for a skittish client rebuilding trust after a hard season.", requirement: { kind: "stat_minimum", stat: "WIL", minimum: 7, label: "Donate any creature with WIL 7+." } },
    { tier: "bronze", type: "donate_creature", category: "lineage", requesterId: "nursery_matron", requesterName: "Nursery Matron", trustTarget: "Nursery", title: "Nursery Fertility Registry", description: "The nursery registrar is collecting fertile ranch stock for approved, carefully tracked clients.", requirement: { kind: "stat_minimum", stat: "FER", minimum: 6, label: "Donate any creature with FER 6+." } },
    { tier: "silver", type: "donate_creature", category: "service", requesterId: "mara_vell", requesterName: "Mara Vell", trustTarget: "Mara", title: "Mara's Hauling Strength Order", description: "The quartermaster desk needs a creature with enough strength for construction errands and supply runs.", requirement: { kind: "stat_minimum", stat: "STR", minimum: 7, label: "Donate any creature with STR 7+." } },
    { tier: "silver", type: "donate_creature", category: "registry", requesterId: "town_clerk", requesterName: "Town Clerk", trustTarget: "Town", title: "Quick Courier Dexterity Request", description: "A courier office needs a nimble creature that can handle crowded lanes and delicate parcels.", requirement: { kind: "stat_minimum", stat: "DEX", minimum: 7, label: "Donate any creature with DEX 7+." } },
    { tier: "silver", type: "service_creature", category: "lineage", requesterId: "nursery_matron", requesterName: "Nursery Matron", trustTarget: "Nursery", title: "Nursery Comfort Assistant", description: "The nursery needs a calm helper for a long care shift. This is a service assignment, not a donation.", requirement: { kind: "stat_minimum", stat: "WIL", minimum: 6, label: "Send any creature with WIL 6+ for nursery service." }, serviceEnergyCost: 14, serviceXpReward: 14, serviceAffectionReward: 5 },
    { tier: "silver", type: "service_creature", category: "registry", requesterId: "town_clerk", requesterName: "Town Clerk", trustTarget: "Town", title: "Registry Inspection Escort", description: "The town clerk needs an even-tempered creature to accompany a registry inspection route.", requirement: { kind: "stat_minimum", stat: "CHA", minimum: 6, label: "Send any creature with CHA 6+ for service." }, serviceEnergyCost: 12, serviceXpReward: 14, serviceAffectionReward: 3 },
    { tier: "silver", type: "service_creature", category: "security", requesterId: "ranger_captain", requesterName: "Ranger Captain", trustTarget: "Rangers", title: "Night Watch Trial Shift", description: "The rangers are testing steady creatures for a supervised night watch route.", requirement: { kind: "stat_minimum", stat: "WIL", minimum: 7, label: "Send any creature with WIL 7+ for service." }, serviceEnergyCost: 16, serviceXpReward: 18, serviceAffectionReward: 2 },
    { tier: "gold", type: "donate_creature", category: "registry", requesterId: "town_clerk", requesterName: "Town Clerk", trustTarget: "Town", title: "Town Clerk Rare Bloodline Request", description: "A prestigious guild patron seeks a rare or better bloodline specimen for the official registry.", requirement: { kind: "rarity", rarity: "Rare", label: "Donate any Rare or Epic creature." } },
    { tier: "gold", type: "donate_creature", category: "registry", requesterId: "town_clerk", requesterName: "Town Clerk", trustTarget: "Town", title: "Exceptional Dexterity Request", description: "A specialist needs a highly agile creature for delicate service work and instrument handling.", requirement: { kind: "stat_minimum", stat: "DEX", minimum: 8, label: "Donate any creature with DEX 8+." } },
    { tier: "gold", type: "donate_creature", category: "security", requesterId: "ranger_captain", requesterName: "Ranger Captain", trustTarget: "Rangers", title: "Ranger Minotaur Security Trial", description: "A frontier estate wants a rare Minotaur for security and heavy-labor evaluation.", requirement: { kind: "variant", variantId: "variant_minotaur" as VariantId, label: "Donate a Minotaur." } },
    { tier: "gold", type: "donate_creature", category: "lineage", requesterId: "nursery_matron", requesterName: "Nursery Matron", trustTarget: "Nursery", title: "Moon Yak Recovery Program", description: "A clinic is searching for a Moon Yak to study calm recovery and rare production lines.", requirement: { kind: "variant", variantId: "variant_moon_yak" as VariantId, label: "Donate a Moon Yak." } },
    { tier: "gold", type: "donate_creature", category: "restoration", requesterId: "veyra", requesterName: "Veyra", trustTarget: "Veyra", title: "Veyra's Antlerhare Garden Patron", description: "A greenhouse patron wants an Antlerhare for future garden restoration work.", requirement: { kind: "variant", variantId: "variant_antlerhare" as VariantId, label: "Donate an Antlerhare." } },
    { tier: "gold", type: "donate_creature", category: "lineage", requesterId: "nursery_matron", requesterName: "Nursery Matron", trustTarget: "Nursery", title: "Dream Lop Nursery Study", description: "The nursery guild is looking for a Dream Lop with comfort and recovery traits.", requirement: { kind: "variant", variantId: "variant_dream_lop" as VariantId, label: "Donate a Dream Lop." } },
    { tier: "gold", type: "donate_creature", category: "lineage", requesterId: "nursery_matron", requesterName: "Nursery Matron", trustTarget: "Nursery", title: "Unicorn Lineage Request", description: "A prestigious patron seeks a Unicorn for healing and lineage research.", requirement: { kind: "variant", variantId: "variant_unicorn" as VariantId, label: "Donate a Unicorn." } },
    { tier: "gold", type: "donate_creature", category: "security", requesterId: "ranger_captain", requesterName: "Ranger Captain", trustTarget: "Rangers", title: "Ranger Nightmare Guard Contract", description: "A fortified ranch wants a Nightmare for future security and intimidation work.", requirement: { kind: "variant", variantId: "variant_nightmare" as VariantId, label: "Donate a Nightmare." } },
    { tier: "gold", type: "service_creature", category: "security", requesterId: "ranger_captain", requesterName: "Ranger Captain", trustTarget: "Rangers", title: "Elite Security Demonstration", description: "The ranger post needs a strong creature for a supervised demonstration. The creature returns tired but more experienced.", requirement: { kind: "stat_minimum", stat: "STR", minimum: 8, label: "Send any creature with STR 8+ for elite service." }, serviceEnergyCost: 22, serviceXpReward: 28, serviceAffectionReward: 3 },
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
  return getWeeklyTemplates(save).map((template, index) => createContract(save, index, template));
}

export function createDefaultGuildState(save: GameSave): GuildState {
  return { weekNumber: save.dayState.weekNumber, lastGeneratedDayNumber: save.dayState.dayNumber, contracts: createWeeklyContracts(save), completedCount: 0, donatedCreatureCount: 0, guildRank: 1 };
}

export function ensureCurrentGuildState(save: GameSave): GameSave {
  const expectedContractCount = getTownUpgradeEffects(save).guildContractCount;
  if (!save.guild) return { ...save, guild: createDefaultGuildState(save), flags: { ...save.flags, m15GuildWeeklyRefresh: true } };

  const normalizedContracts = save.guild.contracts.map(normalizeContract);
  const normalizedGuild = { ...save.guild, contracts: normalizedContracts };
  const normalizedSave = { ...save, guild: normalizedGuild };
  const weekChanged = normalizedGuild.weekNumber !== save.dayState.weekNumber;
  const currentWeekContracts = normalizedContracts.filter((contract) => contract.weekNumber === save.dayState.weekNumber && contract.status !== "expired");
  if (!weekChanged && currentWeekContracts.length >= expectedContractCount) return normalizedSave;

  const retainedContracts = weekChanged
    ? normalizedContracts.filter((contract) => contract.status === "accepted" && contract.expiresAtWeekNumber > save.dayState.weekNumber)
    : normalizedContracts.filter((contract) => contract.weekNumber === save.dayState.weekNumber && contract.status !== "expired");
  const existingIds = new Set(retainedContracts.map((contract) => contract.contractId));
  const newContracts = createWeeklyContracts(normalizedSave).filter((contract) => !existingIds.has(contract.contractId));
  if (!weekChanged && newContracts.length === 0) return normalizedSave;

  return {
    ...normalizedSave,
    guild: { ...normalizedGuild, weekNumber: save.dayState.weekNumber, lastGeneratedDayNumber: save.dayState.dayNumber, contracts: [...retainedContracts, ...newContracts] },
    flags: { ...save.flags, m15GuildWeeklyRefresh: true, guildBoardLastRefreshWeek: save.dayState.weekNumber, m34ContractCategories: true },
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

export function doesCreatureMatchContract(creature: CreatureRecord, rawContract: GuildContract): boolean {
  const contract = normalizeContract(rawContract);
  const variant = getVariantDefinition(creature.variantId);
  const requirement = contract.requirement;
  if (contract.status === "completed" || contract.status === "expired") return false;
  if (contract.type === "donate_creature" && creature.isLocked) return false;
  if (contract.type === "service_creature" && creature.energy < (contract.serviceEnergyCost ?? DEFAULT_SERVICE_ENERGY_COST)) return false;
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

export function calculateContractQualityBonus(creature: CreatureRecord, rawContract: GuildContract): { gold: number; gp: number; reasons: string[] } {
  const contract = normalizeContract(rawContract);
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
  if (contract.type === "service_creature") {
    const spareEnergy = Math.max(0, creature.energy - (contract.serviceEnergyCost ?? DEFAULT_SERVICE_ENERGY_COST));
    if (spareEnergy >= 20) {
      points += 3;
      reasons.push("strong energy reserve");
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
  const rawContract = guild.contracts.find((item) => item.contractId === contractId);
  const contract = rawContract ? normalizeContract(rawContract) : null;
  const creature = (syncedSave.creatures ?? []).find((item) => item.creatureId === creatureId);
  if (!contract) return { save: syncedSave, ok: false, message: "That contract no longer exists." };
  if (!creature) return { save: syncedSave, ok: false, message: "That creature is no longer available." };
  if (creature.isLocked && contract.type === "donate_creature") return { save: syncedSave, ok: false, message: `${creature.nickname} is locked. Unlock them before donating.` };
  if (contract.status !== "accepted" && contract.status !== "available") return { save: syncedSave, ok: false, message: "That contract cannot receive submissions." };
  if (!doesCreatureMatchContract(creature, contract)) return { save: syncedSave, ok: false, message: `${creature.nickname} does not match that contract or lacks the required energy.` };

  const qualityBonus = calculateContractQualityBonus(creature, contract);
  const firstBonus = guild.completedCount === 0 ? FIRST_COMPLETED_CONTRACT_GP_BONUS : 0;
  const goldReward = contract.goldReward + qualityBonus.gold;
  const guildPointReward = contract.guildPointReward + qualityBonus.gp + firstBonus;
  const nextContracts = guild.contracts.map((item) => item.contractId === contractId ? {
    ...normalizeContract(item),
    status: "completed" as const,
    completedAtDayNumber: syncedSave.dayState.dayNumber,
    donatedCreatureId: contract.type === "donate_creature" ? creature.creatureId : item.donatedCreatureId,
    donatedCreatureName: contract.type === "donate_creature" ? creature.nickname : item.donatedCreatureName,
    submittedCreatureId: creature.creatureId,
    submittedCreatureName: creature.nickname,
    qualityBonusGold: qualityBonus.gold,
    qualityBonusGp: qualityBonus.gp,
    qualityBonusReasons: qualityBonus.reasons,
  } : normalizeContract(item));
  const isDonation = contract.type === "donate_creature";
  const serviceEnergyCost = contract.serviceEnergyCost ?? DEFAULT_SERVICE_ENERGY_COST;
  const serviceXpReward = contract.serviceXpReward ?? DEFAULT_SERVICE_XP_REWARD;
  const serviceAffectionReward = contract.serviceAffectionReward ?? DEFAULT_SERVICE_AFFECTION_REWARD;
  const nextCreatures = isDonation
    ? (syncedSave.creatures ?? []).filter((item) => item.creatureId !== creature.creatureId)
    : (syncedSave.creatures ?? []).map((item) => item.creatureId === creature.creatureId ? { ...item, energy: Math.max(0, item.energy - serviceEnergyCost), xp: item.xp + serviceXpReward, affection: Math.min(100, item.affection + serviceAffectionReward) } : item);
  const nextCreatureIds = isDonation ? syncedSave.creatureIds.filter((id) => id !== creature.creatureId) : syncedSave.creatureIds;
  const nextHabitats = isDonation ? (syncedSave.habitats ?? []).map((habitat) => ({ ...habitat, creatureIds: habitat.creatureIds.filter((id) => id !== creature.creatureId) })) : syncedSave.habitats;
  const actionVerb = isDonation ? "donated to" : "sent to";
  const serviceText = isDonation ? "" : ` ${creature.nickname} spent ${serviceEnergyCost} energy and gained ${serviceXpReward} XP.`;
  const bonusText = qualityBonus.gold || qualityBonus.gp ? ` Quality bonus: +${qualityBonus.gold} Gold, +${qualityBonus.gp} GP (${qualityBonus.reasons.slice(0, 3).join(", ")}).` : "";
  const firstBonusText = firstBonus ? ` First contract bonus: +${firstBonus} GP.` : "";
  return {
    save: {
      ...syncedSave,
      creatures: nextCreatures,
      creatureIds: nextCreatureIds,
      habitats: nextHabitats,
      guild: { ...guild, contracts: nextContracts, completedCount: guild.completedCount + 1, donatedCreatureCount: guild.donatedCreatureCount + (isDonation ? 1 : 0), guildRank: Math.max(guild.guildRank, Math.floor((guild.completedCount + 1) / 5) + 1) },
      currencies: { ...syncedSave.currencies, gold: syncedSave.currencies.gold + goldReward, guildPoints: syncedSave.currencies.guildPoints + guildPointReward },
      flags: { ...syncedSave.flags, m7GuildContractCompleted: true, m33ContractQualityBonus: true, m34ContractCategories: true, m34ServiceContracts: true },
    },
    ok: true,
    message: `${creature.nickname} was ${actionVerb} ${contract.title}. Earned ${goldReward} Gold and ${guildPointReward} GP.${serviceText}${bonusText}${firstBonusText}`,
  };
}
