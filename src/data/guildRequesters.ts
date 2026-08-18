import { addCreatureMemory } from "@/data/creatureMemories";
import {
  TOWN_NPCS,
  getNpcTrustRecord,
  getNpcTrustSummary,
  getTrustTierLabel,
  grantNpcTrust,
} from "@/data/townNpcs";
import type { GameSave } from "@/types/save";
import type { GuildContract, GuildContractCategory, GuildContractTier } from "@/types/guild";
import type { CreatureId } from "@/types/ids";
import type { TownNpcDefinition, TownNpcId } from "@/types/townNpc";

export type GuildRequesterDefinition = TownNpcDefinition & {
  specialties: GuildContractCategory[];
};

const SPECIALTIES: Record<TownNpcId, GuildContractCategory[]> = {
  tamsin_vale: ["general"],
  pella_mosswick: ["service"],
  petra_hale: ["service", "restoration"],
  mara_vell: ["general", "service"],
  veyra: ["restoration"],
  selene_virell: ["lineage"],
  rhea_flint: ["service", "security"],
  daria_voss: ["security"],
  maribel_quince: ["registry"],
  kaida_thorn: ["security"],
};

export const GUILD_REQUESTERS = Object.fromEntries(
  (Object.keys(TOWN_NPCS) as TownNpcId[]).map((npcId) => [
    npcId,
    { ...TOWN_NPCS[npcId], specialties: SPECIALTIES[npcId] },
  ]),
) as Record<TownNpcId, GuildRequesterDefinition>;

const LEGACY_REQUESTER_IDS: Record<string, TownNpcId> = {
  nursery_matron: "selene_virell",
  nursery_registrar: "selene_virell",
  town_clerk: "maribel_quince",
  ranger_captain: "kaida_thorn",
  hearth_household: "tamsin_vale",
  guild_board: "mara_vell",
  request_board: "mara_vell",
  mara_vell: "mara_vell",
  veyra: "veyra",
  selene_virell: "selene_virell",
  maribel_quince: "maribel_quince",
  kaida_thorn: "kaida_thorn",
  tamsin_vale: "tamsin_vale",
  pella_mosswick: "pella_mosswick",
  petra_hale: "petra_hale",
  rhea_flint: "rhea_flint",
  daria_voss: "daria_voss",
};

const TRUST_REWARD_BY_TIER: Record<GuildContractTier, number> = {
  bronze: 2,
  silver: 4,
  gold: 7,
};

function isTownNpcId(value: string): value is TownNpcId {
  return Object.prototype.hasOwnProperty.call(TOWN_NPCS, value);
}

function inferRequesterIdFromContract(contract: GuildContract): TownNpcId {
  const legacyMapped = LEGACY_REQUESTER_IDS[contract.requesterId];
  if (legacyMapped) return legacyMapped;
  if (isTownNpcId(contract.requesterId)) return contract.requesterId;

  const text = `${contract.requesterName} ${contract.title} ${contract.description}`.toLowerCase();
  if (text.includes("selene") || text.includes("nursery") || text.includes("fertility") || text.includes("lineage") || text.includes("bloodline")) return "selene_virell";
  if (text.includes("maribel") || text.includes("town clerk") || text.includes("registr") || text.includes("permit") || text.includes("courier")) return "maribel_quince";
  if (text.includes("kaida") || text.includes("ranger") || text.includes("patrol") || text.includes("night watch") || text.includes("guard")) return "kaida_thorn";
  if (text.includes("veyra") || text.includes("bramble") || text.includes("garden") || text.includes("restoration")) return "veyra";
  if (text.includes("tamsin") || text.includes("adoption") || text.includes("household") || text.includes("hearth") || text.includes("placement")) return "tamsin_vale";
  if (text.includes("pella") || text.includes("supply depot") || text.includes("provision") || text.includes("delivery")) return "pella_mosswick";
  if (text.includes("petra") || text.includes("builder") || text.includes("construction") || text.includes("repair")) return "petra_hale";
  if (text.includes("rhea") || text.includes("training") || text.includes("coach") || text.includes("drill")) return "rhea_flint";
  if (text.includes("daria") || text.includes("outfitter") || text.includes("equipment") || text.includes("combat test")) return "daria_voss";
  if (text.includes("mara") || text.includes("quartermaster")) return "mara_vell";

  if (contract.category === "lineage") return "selene_virell";
  if (contract.category === "registry") return "maribel_quince";
  if (contract.category === "security") return "kaida_thorn";
  if (contract.category === "restoration") return "veyra";
  return "mara_vell";
}

function replaceRequesterLanguage(text: string, requesterId: TownNpcId): string {
  let next = text
    .replace(/Nursery Matron/g, "Dr. Selene Virell")
    .replace(/nursery matron/g, "Dr. Selene Virell")
    .replace(/Town Clerk/g, "Maribel Quince")
    .replace(/town clerk/g, "Maribel Quince")
    .replace(/Ranger Captain/g, "Kaida Thorn")
    .replace(/ranger captain/g, "Kaida Thorn");

  if (requesterId === "selene_virell") {
    next = next
      .replace(/^Nursery Fertility Registry$/, "Selene's Fertility Registry")
      .replace(/^Nursery Comfort Assistant$/, "Selene's Nursery Comfort Assistant")
      .replace(/^The nursery registrar/i, "Dr. Selene Virell")
      .replace(/^The nursery needs/i, "Dr. Selene Virell needs");
  }
  if (requesterId === "maribel_quince") {
    next = next.replace(/^Maribel Quince Rare Bloodline Request$/, "Maribel's Rare Bloodline Registry");
  }
  return next;
}

/**
 * Converts legacy role/faction requesters into real town characters. Existing
 * valid named requesters are preserved, while old saves are upgraded in place.
 */
export function normalizeGuildContractRequester(contract: GuildContract): GuildContract {
  const requesterId = inferRequesterIdFromContract(contract);
  const definition = TOWN_NPCS[requesterId];
  const title = replaceRequesterLanguage(contract.title, requesterId);
  const description = replaceRequesterLanguage(contract.description, requesterId);
  const trustTarget = definition.name;

  if (
    contract.requesterId === requesterId &&
    contract.requesterName === definition.name &&
    contract.trustTarget === trustTarget &&
    contract.title === title &&
    contract.description === description
  ) {
    return contract;
  }

  return {
    ...contract,
    requesterId,
    requesterName: definition.name,
    trustTarget,
    title,
    description,
  };
}

export function getGuildRequesterDefinition(contract: GuildContract): GuildRequesterDefinition {
  const normalized = normalizeGuildContractRequester(contract);
  const requesterId = isTownNpcId(normalized.requesterId) ? normalized.requesterId : "mara_vell";
  return GUILD_REQUESTERS[requesterId];
}

export function getGuildRequesterTrustReward(contract: GuildContract): number {
  const base = TRUST_REWARD_BY_TIER[contract.tier] ?? 2;
  const exceptionalQuality = (contract.qualityBonusGp ?? 0) >= 3 || (contract.qualityBonusGold ?? 0) >= 50;
  return base + (exceptionalQuality ? 1 : 0);
}

export function getGuildRequesterTrustSummary(save: GameSave, contract: GuildContract): string {
  const definition = getGuildRequesterDefinition(contract);
  return getNpcTrustSummary(save, definition.npcId);
}

export function getGuildRequesterTrustTier(save: GameSave, contract: GuildContract): string {
  const definition = getGuildRequesterDefinition(contract);
  return getTrustTierLabel(getNpcTrustRecord(save, definition.npcId).level);
}

export type GuildRequesterTrustAward = {
  contractId: string;
  npcId: TownNpcId;
  requesterName: string;
  amount: number;
  points: number;
  previousLevel: number;
  level: number;
  tierLabel: string;
  unlockLabel?: string;
};

function recordTrustLevelUpMemory(
  save: GameSave,
  contract: GuildContract,
  definition: GuildRequesterDefinition,
  previousLevel: number,
  nextLevel: number,
): GameSave {
  if (nextLevel <= previousLevel) return save;
  const creatureId = (contract.submittedCreatureId ?? contract.donatedCreatureId) as CreatureId | undefined;
  if (!creatureId) return save;
  const tierLabel = getTrustTierLabel(nextLevel);
  const unlockLabel = definition.trustUnlocks[nextLevel] ?? "New relationship opportunities unlocked";
  return addCreatureMemory(save, {
    creatureId,
    category: "guild",
    importance: nextLevel >= 4 ? "major" : "notable",
    title: `Relationship Deepened — ${definition.name}`,
    description: `${definition.name} now considers the ranch ${tierLabel}. New relationship benefit: ${unlockLabel}.`,
    dayNumber: contract.completedAtDayNumber ?? save.dayState.dayNumber,
    sourceKey: `guild-requester-trust-tier:${definition.npcId}:${nextLevel}`,
    tags: ["guild", "trust", definition.npcId, tierLabel.toLowerCase().replace(/\s+/g, "-")],
  });
}

/**
 * Awards personal requester Trust for every completed contract exactly once.
 * Because the award marker lives on the contract, this also safely migrates
 * completed contracts from older saves the first time they are normalized.
 */
export function reconcileGuildRequesterTrust(save: GameSave): { save: GameSave; awards: GuildRequesterTrustAward[] } {
  if (!save.guild) return { save, awards: [] };

  let nextSave = save;
  let changedContracts = false;
  const awards: GuildRequesterTrustAward[] = [];
  const contracts = save.guild.contracts.map((rawContract) => {
    let contract = normalizeGuildContractRequester(rawContract);
    if (contract !== rawContract) changedContracts = true;
    if (contract.status !== "completed" || typeof contract.requesterTrustAwarded === "number") return contract;

    const definition = getGuildRequesterDefinition(contract);
    const before = getNpcTrustRecord(nextSave, definition.npcId);
    const amount = getGuildRequesterTrustReward(contract);
    nextSave = grantNpcTrust(nextSave, definition.npcId, amount, true);
    const record = getNpcTrustRecord(nextSave, definition.npcId);
    contract = {
      ...contract,
      requesterTrustAwarded: amount,
      requesterTrustAwardedAtDayNumber: contract.completedAtDayNumber ?? save.dayState.dayNumber,
    };
    nextSave = recordTrustLevelUpMemory(nextSave, contract, definition, before.level, record.level);
    changedContracts = true;
    awards.push({
      contractId: String(contract.contractId),
      npcId: definition.npcId,
      requesterName: definition.name,
      amount,
      points: record.points,
      previousLevel: before.level,
      level: record.level,
      tierLabel: getTrustTierLabel(record.level),
      unlockLabel: record.level > before.level ? definition.trustUnlocks[record.level] : undefined,
    });
    return contract;
  });

  if (!changedContracts && nextSave === save) return { save, awards };
  return {
    save: {
      ...nextSave,
      guild: {
        ...nextSave.guild!,
        contracts,
      },
      flags: {
        ...nextSave.flags,
        guildNamedRequesters: true,
        guildRequesterTrust: true,
      },
    },
    awards,
  };
}
