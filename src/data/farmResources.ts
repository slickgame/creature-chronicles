import { getRanchUpgradeEffects } from "./ranchUpgrades";
import { getChoreTalentSummary } from "./talents/talentEngine";
import { gainCreatureChoreSkillXp, getChoreSkillXpGain, getCreatureChoreSkillLevelForJob } from "./choreSkills";
import type { RanchJobId } from "@/types/ranchJobs";
import type { GameSave } from "@/types/save";
import type { CreatureRecord } from "@/types/creature";
import { getVariantDefinition } from "@/data/creatures";
import { getTrainingUnavailableReason } from "@/data/trainingGrounds";

export const RESOURCES = {
  rations: { name: "Balanced rations", category: "Food", price: 8 },
  wheat: { name: "Wheat", category: "Food", price: 8 }, vegetables: { name: "Vegetables", category: "Food", price: 8 },
  milk: { name: "Milk", category: "Food", price: 12 }, eggs: { name: "Food eggs", category: "Food", price: 12 }, meat: { name: "Meat", category: "Food", price: 14 },
  wood: { name: "Wood", category: "Materials", price: 8 }, stone: { name: "Stone", category: "Materials", price: 8 }, iron_ore: { name: "Iron ore", category: "Materials", price: 12 },
  planks: { name: "Planks", category: "Components", price: 22 }, charcoal: { name: "Charcoal", category: "Components", price: 12 }, iron: { name: "Iron ingots", category: "Components", price: 40 }, nails: { name: "Nails", category: "Components", price: 12 },
  porridge: { name: "Garden porridge", category: "Meals", price: 0 }, breakfast: { name: "Hearty breakfast", category: "Meals", price: 0 }, breeders_bowl: { name: "Breeder’s bowl", category: "Meals", price: 0 }, stew: { name: "Worker’s stew", category: "Meals", price: 0 },
} as const;
export type ResourceId = keyof typeof RESOURCES;
export type Stock = Partial<Record<ResourceId, number>>;
export const RESOURCE_IDS = Object.keys(RESOURCES) as ResourceId[];
export const FACILITIES = {
  quarry: { name: "Quarry", gold: 180, inputs: { wood: 6 }, prerequisite: "", description: "Unlock stone gathering; instant work." },
  sawmill: { name: "Sawmill", gold: 240, inputs: { wood: 8, stone: 4 }, prerequisite: "", description: "Double plank output from each recipe." },
  kiln: { name: "Charcoal kiln", gold: 160, inputs: { wood: 4, stone: 6 }, prerequisite: "quarry", description: "Unlock charcoal production." },
  furnace: { name: "Iron furnace", gold: 280, inputs: { stone: 10, planks: 4 }, prerequisite: "kiln", description: "Smelt iron ore using charcoal." },
  forge: { name: "Small forge", gold: 320, inputs: { stone: 8, iron: 2 }, prerequisite: "furnace", description: "Make nails from iron ingots." },
  woodlot_upgrade: { name: "Managed woodlot", gold: 220, inputs: { planks: 4, stone: 4 }, prerequisite: "", description: "+2 Wood per work action." },
  mine_upgrade: { name: "Supported iron mine", gold: 300, inputs: { planks: 6, nails: 4 }, prerequisite: "forge", description: "+1 Iron ore per work action." },
} satisfies Record<string, { name: string; gold: number; inputs: Stock; prerequisite: string; description: string }>;
export type FacilityId = keyof typeof FACILITIES;
export const SITES = {
  garden: { name: "Kitchen garden", resource: "vegetables", amount: 4, description: "Vegetables for recipes." },
  wheat_field: { name: "Wheat patch", resource: "wheat", amount: 4, description: "Wheat for cooking." },
  dairy: { name: "Milk production", resource: "milk", amount: 3, description: "Female bovines only." },
  hunting: { name: "Hunting trail", resource: "meat", amount: 2, description: "Gather game meat; ranch creatures remain safe." },
  woodlot: { name: "Inherited woodlot", resource: "wood", amount: 4, description: "Gather wood from the farm’s wooded edge." },
  iron_deposit: { name: "Shallow iron deposit", resource: "iron_ore", amount: 2, description: "Gather ore; requires smelting before crafting." },
  quarry: { name: "Quarry", resource: "stone", amount: 4, description: "Build with Petra to unlock." },
} satisfies Record<string, { name: string; resource: ResourceId; amount: number; description: string }>;
export type SiteId = keyof typeof SITES;
export const RECIPES: { id: ResourceId; inputs: Stock; output: number; facility?: FacilityId; effect: string }[] = [
  { id: "rations", inputs: { wheat: 2, vegetables: 1 }, output: 4, effect: "Four food units for any creature; consumed nightly unless reserved." },
  { id: "porridge", inputs: { wheat: 1, vegetables: 1 }, output: 1, effect: "Restore 8 creature Energy; once per day." },
  { id: "breakfast", inputs: { wheat: 1, eggs: 1, milk: 1 }, output: 1, effect: "Restore 15 creature Energy; once per day." },
  { id: "breeders_bowl", inputs: { eggs: 1, milk: 1, vegetables: 1 }, output: 1, effect: "+10 percentage points to pregnancy chance today; existing 90% cap applies." },
  { id: "stew", inputs: { meat: 1, vegetables: 2 }, output: 1, effect: "15% lower work Energy cost for the rest of today." },
  { id: "planks", inputs: { wood: 2 }, output: 1, effect: "Workbench recipe; Sawmill doubles output." },
  { id: "charcoal", inputs: { wood: 2 }, output: 2, facility: "kiln", effect: "Fuel for smelting." },
  { id: "iron", inputs: { iron_ore: 2, charcoal: 1 }, output: 1, facility: "furnace", effect: "Refined metal for construction and crafting." },
  { id: "nails", inputs: { iron: 1 }, output: 4, facility: "forge", effect: "Fasteners for advanced farm projects." },
];
export const SUPPLY_ORDERS: { id: string; name: string; inputs: Stock; gold: number; gp: number; prerequisite?: FacilityId }[] = [
  { id: "timber", name: "Petra’s first timber delivery", inputs: { wood: 8 }, gold: 100, gp: 3 },
  { id: "breakfasts", name: "Breakfast for the Guild crew", inputs: { breakfast: 2 }, gold: 100, gp: 4 },
  { id: "planks", name: "Mara’s shelf repairs", inputs: { planks: 6 }, gold: 150, gp: 5, prerequisite: "sawmill" },
  { id: "nails", name: "Fasteners for the town", inputs: { nails: 8 }, gold: 160, gp: 6, prerequisite: "forge" },
];
export type FarmState = {
  workDay?: number; workOutput?: Stock; workCount?: number; workLog?: string[]; version: 1; ingredientFeeding?: boolean; stock: Stock; reserves: Stock; assignments: Partial<Record<SiteId, string[]>>;
  facilities: Partial<Record<FacilityId, boolean>>; lastDay: number;
  project?: { id: FacilityId; readyDay: number };
  meals: Record<string, { id: ResourceId; day: number }>;
  orders: Record<string, "accepted" | "completed">; report: string[];
};
const FLAG = "farmResourcesV1";
export function getFarmState(save: GameSave): FarmState {
  const fallback: FarmState = { version: 1, stock: {}, reserves: {}, assignments: {}, facilities: {}, lastDay: 0, meals: {}, orders: {}, report: [] };
  try {
    const raw = JSON.parse(String(save.flags[FLAG] ?? "null"));
    if (!raw || raw.version !== 1) return fallback;
    const sanitize = (values: Stock): Stock => Object.fromEntries(RESOURCE_IDS.map(id => [id, Math.max(0, Math.floor(Number(values?.[id]) || 0))]));
    return { ...fallback, ...raw, stock: sanitize(raw.stock), reserves: sanitize(raw.reserves) };
  } catch { return fallback; }
}
function write(save: GameSave, state: FarmState): GameSave { return { ...save, flags: { ...save.flags, [FLAG]: JSON.stringify(state) } }; }
export type FarmResult = { save: GameSave; ok: boolean; message: string };
function fail(save: GameSave, message: string): FarmResult { return { save, ok: false, message }; }
function done(save: GameSave, state: FarmState, message: string): FarmResult { return { save: write(save, state), ok: true, message }; }
export function resourceList(stock: Stock): string { return (Object.entries(stock) as [ResourceId, number][]).map(([id, n]) => `${n} ${RESOURCES[id].name}`).join(" + "); }
export function canSpend(state: FarmState, cost: Stock): boolean { return (Object.entries(cost) as [ResourceId, number][]).every(([id, n]) => (state.stock[id] ?? 0) - (state.reserves[id] ?? 0) >= n); }
function spend(state: FarmState, cost: Stock) { for (const [id, n] of Object.entries(cost) as [ResourceId, number][]) state.stock[id] = (state.stock[id] ?? 0) - n; }
export function resourceAssignment(_save: GameSave, _id: string): SiteId | undefined { return undefined; }
export function workerBlocker(save: GameSave, c: CreatureRecord, site: SiteId, _overnight = false): string | null {
  const state = getFarmState(save);
  if (site === "quarry" && !state.facilities.quarry) return "Build the Quarry first.";
  if (site === "dairy" && (getVariantDefinition(c.variantId).family !== "bovine" || c.sex !== "female")) return "Milk production requires a female bovine.";
  if (getTrainingUnavailableReason(save, c.creatureId)) return "Away at training.";
  if ((c.injuredUntilDayNumber ?? -1) >= save.dayState.dayNumber) return "Recovering from injury.";

  if (c.energy < workPreview(save, site, c).energy) return "Not enough Energy for gathering.";
  return null;
}
/** Compatibility entrypoint: an explicit click now performs one instant work action. */
export const assignResourceWorker = workResourceSite;
export function siteJob(site: SiteId): RanchJobId { return ["woodlot", "iron_deposit", "quarry"].includes(site) ? "field_hauling" : site === "dairy" || site === "hunting" ? "stable_production" : "garden_tending"; }
export function workPreview(save: GameSave, site: SiteId, creature: CreatureRecord) {
  const talent = getChoreTalentSummary(creature.abilities, siteJob(site));
  const upgrades = getRanchUpgradeEffects(save);
  const skillBonus = Math.floor((getCreatureChoreSkillLevelForJob(creature, siteJob(site)) - 1) / 5);
  const amount = skillBonus + siteYield(getFarmState(save), site) + Math.floor(Math.max(0, talent.scoreBonus)) + upgrades.ranchChoreScoreBonus;
  return { amount, energy: Math.max(8, gatheringCost(save, creature.creatureId) - talent.energyDiscount - upgrades.ranchChoreEnergyDiscount), xp: getChoreSkillXpGain(amount, talent.xpPercent) };
}
export function workResourceSite(save: GameSave, site: SiteId, id: string): FarmResult {
  if (!SITES[site]) return fail(save, "Unknown work location.");
  const c = save.creatures?.find(c => c.creatureId === id);
  if (!c) return fail(save, "Creature not found.");
  const reason = workerBlocker(save, c, site);
  if (reason) return fail(save, reason);
  const state = getFarmState(save), preview = workPreview(save, site, c), resource = SITES[site].resource;
  if (c.energy < preview.energy) return fail(save, "Not enough Energy for work.");
  const job = siteJob(site);
  const progressed = gainCreatureChoreSkillXp({ ...c, energy: c.energy - preview.energy }, job, preview.xp).creature;
  if (state.workDay !== save.dayState.dayNumber) { state.workDay = save.dayState.dayNumber; state.workOutput = {}; state.workCount = 0; state.workLog = []; }
  state.assignments = {};
  state.stock[resource] = (state.stock[resource] ?? 0) + preview.amount;
  state.workOutput = { ...state.workOutput, [resource]: (state.workOutput?.[resource] ?? 0) + preview.amount };
  state.workCount = (state.workCount ?? 0) + 1;
  const message = `${c.nickname}: +${preview.amount} ${RESOURCES[resource].name}, −${preview.energy} Energy. No Gold charged.`;
  state.workLog = [...(state.workLog ?? []), message].slice(-30);
  const food = RESOURCES[resource].category === "Food";
  const flags = { ...save.flags,
    farmWorkActions: Number(save.flags.farmWorkActions ?? 0) + 1,
    [`farmWork_${site}`]: Number(save.flags[`farmWork_${site}`] ?? 0) + 1,
    [`guildChoreCompletions_${job}`]: Number(save.flags[`guildChoreCompletions_${job}`] ?? 0) + 1,
    productionWoodGathered: Number(save.flags.productionWoodGathered ?? 0) + (resource === "wood" ? preview.amount : 0),
    farmFoodProduced: Number(save.flags.farmFoodProduced ?? 0) + (food ? preview.amount : 0),
    chapterOneGuidedChoresAssigned: true,
    chapterOneGuidedSecondChoreAssigned: Number(save.flags.farmWorkActions ?? 0) >= 1,
    m14RanchJobAssigned: true,
  };
  return done({ ...save, flags, creatures: save.creatures?.map(x => x.creatureId === id ? progressed : x) }, state, message);
}
export function siteSlots(state: FarmState, site: SiteId) { return (site === "woodlot" && state.facilities.woodlot_upgrade) || (site === "iron_deposit" && state.facilities.mine_upgrade) ? 2 : 1; }
export function siteYield(state: FarmState, site: SiteId) { return SITES[site].amount + (site === "woodlot" && state.facilities.woodlot_upgrade ? 2 : site === "iron_deposit" && state.facilities.mine_upgrade ? 1 : 0); }
export function mealBonus(save: GameSave, id: string, meal: ResourceId): boolean { const m = getFarmState(save).meals[id]; return m?.day === save.dayState.dayNumber && m.id === meal; }
export function gatheringCost(save: GameSave, id: string) { return mealBonus(save, id, "stew") ? 17 : 20; }
export function processResourceDay(save: GameSave): GameSave {
  const state = getFarmState(save);
  if (state.lastDay >= save.dayState.dayNumber) return save;
  state.report = [];
  // Work has already resolved. Never replay legacy assignments at night.
  state.assignments = {};
  if (state.workDay === save.dayState.dayNumber - 1) state.report = [...(state.workLog ?? [])];
  if (state.project && state.project.readyDay <= save.dayState.dayNumber) {
    state.facilities[state.project.id] = true;
    state.report.push(`${FACILITIES[state.project.id].name} completed and ready to use.`);
    delete state.project;
  }
  state.lastDay = save.dayState.dayNumber;
  return write(save, state);
}
export function craftResource(save: GameSave, id: ResourceId, quantity = 1): FarmResult {
  const recipe = RECIPES.find(r => r.id === id), state = getFarmState(save);
  if (!recipe || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return fail(save, "Choose 1–20 recipe batches.");
  if (recipe.facility && !state.facilities[recipe.facility]) return fail(save, `Build ${FACILITIES[recipe.facility].name} first.`);
  const cost = Object.fromEntries(Object.entries(recipe.inputs).map(([key, n]) => [key, n * quantity])) as Stock;
  if (!canSpend(state, cost)) return fail(save, "Not enough unreserved ingredients.");
  spend(state, cost);
  const output = quantity * recipe.output * (id === "planks" && state.facilities.sawmill ? 2 : 1);
  state.stock[id] = (state.stock[id] ?? 0) + output;
  if (id === "planks") save = { ...save, flags: { ...save.flags, productionPlanksCrafted: Number(save.flags.productionPlanksCrafted ?? 0) + output } };
  return done(save, state, `Made ${output} ${RESOURCES[id].name}. Used ${resourceList(cost)}.`);
}
export function mealEnergyRestoration(id: ResourceId): number { return id === "breakfast" ? 15 : id === "porridge" ? 8 : 0; }
export function serveMeal(save: GameSave, id: ResourceId, creatureId: string): FarmResult {
  const state = getFarmState(save), c = save.creatures?.find(c => c.creatureId === creatureId);
  if (!c || RESOURCES[id]?.category !== "Meals") return fail(save, "Choose a creature and a prepared meal.");
  if (getTrainingUnavailableReason(save, c.creatureId)) return fail(save, "This creature is away at training.");
  if (state.meals[creatureId]?.day === save.dayState.dayNumber) return fail(save, "This creature has already eaten a bonus meal today.");
  if (!canSpend(state, { [id]: 1 })) return fail(save, "No unreserved meal available.");
  const energy = mealEnergyRestoration(id);
  if (energy && c.energy >= c.maxEnergy) return fail(save, "Energy is already full.");
  spend(state, { [id]: 1 }); state.meals[creatureId] = { id, day: save.dayState.dayNumber };
  return done({ ...save, creatures: save.creatures?.map(x => x.creatureId === creatureId ? { ...x, energy: Math.min(x.maxEnergy, x.energy + energy) } : x) }, state, `${c.nickname} ate ${RESOURCES[id].name}. ${energy ? `Recovered up to ${energy} Energy.` : "Bonus lasts through tonight."}`);
}
export function commissionFacility(save: GameSave, id: FacilityId): FarmResult {
  const state = getFarmState(save), facility = FACILITIES[id];
  if (!facility) return fail(save, "Unknown facility.");
  if (state.project || save.flags.builderWorkOrderV1) return fail(save, "Petra’s crew already has a project underway.");
  if (state.facilities[id]) return fail(save, "Already built.");
  if (facility.prerequisite && !state.facilities[facility.prerequisite as FacilityId]) return fail(save, "Complete the prerequisite facility first.");
  if (save.currencies.gold < facility.gold || !canSpend(state, facility.inputs)) return fail(save, "Not enough Gold or unreserved materials.");
  spend(state, facility.inputs); state.project = { id, readyDay: save.dayState.dayNumber + 1 };
  return done({ ...save, currencies: { ...save.currencies, gold: save.currencies.gold - facility.gold } }, state, `${facility.name} commissioned. Finishes after tonight. Paid ${facility.gold} Gold + ${resourceList(facility.inputs)}.`);
}
export function tradeResource(save: GameSave, id: ResourceId, quantity: number, sell = false): FarmResult {
  const state = getFarmState(save), resource = RESOURCES[id];
  if (!resource?.price || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) return fail(save, "Choose 1–20 units of a traded resource.");
  const gold = quantity * (sell ? Math.floor(resource.price * 0.4) : resource.price);
  if (sell ? !canSpend(state, { [id]: quantity }) : save.currencies.gold < gold) return fail(save, "Not enough unreserved stock or Gold.");
  state.stock[id] = (state.stock[id] ?? 0) + (sell ? -quantity : quantity);
  return done({ ...save, currencies: { ...save.currencies, gold: save.currencies.gold + (sell ? gold : -gold) } }, state, `${sell ? "Sold" : "Bought"} ${quantity} ${resource.name} for ${gold} Gold.`);
}
export function reserveResource(save: GameSave, id: ResourceId, quantity: number): FarmResult {
  const state = getFarmState(save);
  if (!RESOURCES[id] || !Number.isInteger(quantity) || quantity < 0 || quantity > 9999) return fail(save, "Choose a reserve from 0 to 9999.");
  state.reserves[id] = quantity;
  if (id === "wood" && quantity >= 2) save = { ...save, flags: { ...save.flags, productionReserveSet: true } };
  return done(save, state, `${RESOURCES[id].name}: protecting ${quantity} units from recipes, feeding, sales, construction and deliveries.`);
}
export function actSupplyOrder(save: GameSave, id: string): FarmResult {
  const state = getFarmState(save), order = SUPPLY_ORDERS.find(o => o.id === id);
  if (!order || state.orders[id] === "completed") return fail(save, "Order unavailable or already completed.");
  if (order.prerequisite && !state.facilities[order.prerequisite]) return fail(save, `Build ${FACILITIES[order.prerequisite].name} first.`);
  if (!state.orders[id]) { state.orders[id] = "accepted"; return done(save, state, "Order accepted. Supplies stay in storage until delivery. No deadline."); }
  if (!canSpend(state, order.inputs)) return fail(save, "Not enough unreserved supplies to deliver.");
  spend(state, order.inputs); state.orders[id] = "completed";
  return done({ ...save, currencies: { ...save.currencies, gold: save.currencies.gold + order.gold, guildPoints: save.currencies.guildPoints + order.gp } }, state, `Delivered ${resourceList(order.inputs)}. Earned ${order.gold} Gold and ${order.gp} GP.`);
}

export function overnightChoreCost(save: GameSave, id: string, base: number): number { const meal = getFarmState(save).meals[id]; return meal?.id === "stew" && meal.day === save.dayState.dayNumber - 1 ? Math.ceil(base * 0.85) : base; }

/** Only free stock is eligible; prepared meals are always served deliberately. */
export function foodChoices(creature: CreatureRecord): ResourceId[] {
  const family = getVariantDefinition(creature.variantId).family;
  if (family === "feline") return ["meat", "eggs", "milk"];
  if (family === "canine") return ["meat", "eggs", "vegetables", "wheat", "milk"];
  return ["vegetables", "wheat"];
}
export function setIngredientFeeding(save: GameSave, enabled: boolean): FarmResult {
  const state = getFarmState(save); state.ingredientFeeding = enabled;
  return done(save, state, enabled ? "Balanced rations come first; unreserved raw ingredients cover remaining needs before legacy Feed." : "Raw ingredients saved for recipes. Tonight uses Balanced rations and existing Feed.");
}
export function consumeFarmResources(save: GameSave, cost: Stock): FarmResult {
  const state = getFarmState(save);
  if (!canSpend(state, cost)) return fail(save, "Not enough unreserved supplies.");
  spend(state, cost); return done(save, state, `Used ${resourceList(cost)}.`);
}
export function planIngredientFeeding(save: GameSave, needs: { creature: CreatureRecord; amount: number }[]) {
  const state = getFarmState(save), used: Stock = {};
  let covered = 0;
  for (const { creature, amount } of needs) {
    let remaining = amount;
    const choices: ResourceId[] = ["rations", ...(state.ingredientFeeding ? foodChoices(creature) : [])];
    for (const id of choices) {
      const count = Math.min(remaining, Math.max(0, (state.stock[id] ?? 0) - (state.reserves[id] ?? 0)));
      if (!count) continue;
      state.stock[id] = (state.stock[id] ?? 0) - count;
      used[id] = (used[id] ?? 0) + count;
      covered += count; remaining -= count;
      if (!remaining) break;
    }
  }
  return { save: write(save, state), covered, used };
}

export function resourceShortages(state: FarmState, cost: Stock): string[] {
  return (Object.entries(cost) as [ResourceId, number][]).flatMap(([id, n]) => {
    const missing = Math.max(0, n - Math.max(0, (state.stock[id] ?? 0) - (state.reserves[id] ?? 0)));
    return missing ? [`${missing} ${RESOURCES[id].name}`] : [];
  });
}

export function grantFarmResources(save: GameSave, rewards: Stock): GameSave {
  const state = getFarmState(save);
  for (const [id, n] of Object.entries(rewards) as [ResourceId, number][]) state.stock[id] = (state.stock[id] ?? 0) + n;
  return write(save, state);
}

export function getProductionGuide(save: GameSave) {
  const state = getFarmState(save);
  return [
    { title: "Gather your first timber", tab: "Gathering" as const, done: Number(save.flags.productionWoodGathered ?? 0) >= 4, text: "Choose a creature at the inherited Woodlot and press Work. Collect at least 4 Wood instantly; only creature Energy is spent." },
    { title: "Keep a repair reserve", tab: "Storage" as const, done: save.flags.productionReserveSet === true, text: "Set the Wood reserve to 2. Reserved supplies are protected from crafting, feeding, selling and construction." },
    { title: "Craft your first planks", tab: "Workbench" as const, done: Number(save.flags.productionPlanksCrafted ?? 0) >= 1, text: "Make Planks at the basic workbench: 2 unreserved Wood makes 1 Plank. A Sawmill later doubles that output." },
    { title: "Finish a production site", tab: "Construction" as const, done: Object.values(state.facilities).some(Boolean), text: "Visit Petra’s Builder’s Yard → Production sites & upgrades. A Quarry costs 180 Gold + 6 Wood and finishes after one night. For this whole lesson, gather 10 Wood: 2 reserved, 2 for planks and 6 for the Quarry." },
  ];
}
export function claimProductionGuide(save: GameSave): FarmResult {
  if (save.flags.productionGuideClaimed || !getProductionGuide(save).every(step => step.done)) return fail(save, "Complete all four steps before claiming this one-time reward.");
  return {ok:true,message:"Farm foundations complete! Earned 75 Gold and 5 GP.",save:{...save,flags:{...save.flags,productionGuideClaimed:true},currencies:{...save.currencies,gold:save.currencies.gold+75,guildPoints:save.currencies.guildPoints+5}}};
}
