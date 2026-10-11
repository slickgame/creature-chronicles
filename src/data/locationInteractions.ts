import { FACILITIES, getFarmState } from "./farmResources";
import type { GameSave } from "@/types/save";
import { BUILDER_PROJECTS, getBuilderProjectProgress, getBuilderWorkOrder, getBuilderProject } from "./builderProjects";
import { grantNpcTrust, getNpcTrustRecord } from "./townNpcs";

export type LocationHost = "petra" | "mara";
const count = (value: unknown) => typeof value === "number" && Number.isFinite(value) ? Math.max(0, Math.floor(value)) : 0;
export function getLocationTrust(save: GameSave, host: LocationHost) {
  return host === "mara" ? getNpcTrustRecord(save, "mara_vell").points : count(save.flags.petraTrust);
}
export function hasChattedToday(save: GameSave, host: LocationHost) {
  return save.flags[`${host}ConversationDay`] === save.dayState.dayNumber;
}
export function chatWithLocationHost(save: GameSave, host: LocationHost) {
  if (hasChattedToday(save, host)) return { save, ok: false, message: "We’ve caught up today. Advice is always available; come back tomorrow for another conversation." };
  const updated = { ...save, flags: { ...save.flags, [`${host}ConversationDay`]: save.dayState.dayNumber } };
  const next = host === "mara" ? grantNpcTrust(updated, "mara_vell", 2) : { ...updated, flags: { ...updated.flags, petraTrust: getLocationTrust(save, host) + 2 } };
  const lines = host === "petra" ? ["My first shed leaned so far the hens used the wall as a ramp. Measure twice. And listen when someone tells you it looks crooked.", "I like seeing a building after people settle into it. Mud on the doorstep, a repaired latch—that’s when it starts being a home.", "My crew knows I’ll stop a job before I rush a foundation. Your ranch deserves the same patience."] : ["The best entry in my ledger is a promise kept. Small jobs count just as much when someone is waiting on them.", "I used to organize these notices by how dramatic they sounded. The miller’s missing feed taught me to sort by what people actually need.", "A good quartermaster leaves room in the budget for a bad week. Keep something for your own ranch before you help the whole town."];
  return { save: next, ok: true, message: `“${lines[(Math.max(1, save.dayState.dayNumber) - 1) % lines.length]}” +2 Trust.` };
}
export function getPetraAdvice(save: GameSave) {
  const production = getFarmState(save).project;
  if (production) return `${FACILITIES[production.id].name} is under construction. The crew finishes on Ranch Day ${production.readyDay}.`;
  const order = getBuilderWorkOrder(save);
  if (order) return `The crew is building ${getBuilderProject(order.projectId).title}. It will finish on Ranch Day ${order.readyDay}. You’ve already paid; the benefits begin when construction completes.`;
  if (count(save.flags.ranchMaterialsStock) < 12) return "Keep a repair reserve before expanding. Field Hauling produces Materials overnight, and Pella sells them at the Supply Depot. Browsing my plans costs nothing.";
  if (!getBuilderProjectProgress(save, "north_pasture_land").built) return "The North Pasture survey opens the way to Habitat Annexes and a Nursery Extension. New land also brings predator pressure; compare patrol strength before committing.";
  return "Choose capacity for the creatures you actually keep. Habitat Annexes add one place to each existing family habitat; the Nursery Extension adds two egg spaces. These stack with Ranch Office upgrades.";
}
const PETRA_REQUESTS = [
  { title: "A Repair Reserve", dialogue: "Show me eight Materials in your stores. A ranch needs enough on hand to fix a gate before it falls.", requirement: "Hold 8 Materials. Nothing is consumed.", gold: 50, gp: 4, trust: 8 },
  { title: "Built to Last", dialogue: "Bring one project all the way from a drawing to finished work. I want you to see what planning buys.", requirement: "Complete any available Builder’s Yard project. Existing completed work counts; commissioning alone does not.", gold: 100, gp: 6, trust: 12 },
  { title: "Room to Grow", dialogue: "Two finished projects make a good foundation. I’ll set aside a small repair cache for your next step.", requirement: "Complete 2 available Builder’s Yard projects in total. Existing work counts. Final reward includes 5 Materials.", gold: 150, gp: 10, trust: 20 },
];
export function getPetraRequests(save: GameSave) {
  const built = BUILDER_PROJECTS.filter(p => !p.planned && getBuilderProjectProgress(save, p.id).built).length + Object.values(getFarmState(save).facilities).filter(Boolean).length;
  return PETRA_REQUESTS.map((q, index) => {
    const claimed = save.flags[`petraRequest${index}Claimed`] === true;
    const accepted = save.flags[`petraRequest${index}Accepted`] === true;
    const locked = index > 0 && save.flags[`petraRequest${index - 1}Claimed`] !== true;
    const current = index === 0 ? count(save.flags.ranchMaterialsStock) : built;
    const target = index === 0 ? 8 : index;
    return { ...q, index, claimed, accepted, locked, current: Math.min(current, target), target, ready: accepted && !claimed && !locked && current >= target };
  });
}
export function actOnPetraRequest(save: GameSave, index: number, claim: boolean) {
  const q = getPetraRequests(save)[index];
  if (!q || q.locked || q.claimed || (claim ? !q.ready : q.accepted)) return { save, ok: false, message: "That request is not ready for this action." };
  if (!claim) return { ok: true, message: `“${q.dialogue}” Request accepted; no deadline.`, save: { ...save, flags: { ...save.flags, [`petraRequest${index}Accepted`]: true } } };
  return { ok: true, message: `“Work you can be proud of.” Received ${q.gold} Gold, ${q.gp} GP, and ${q.trust} Trust.${index === 2 ? " Also received 5 Materials." : ""}`, save: { ...save, currencies: { ...save.currencies, gold: save.currencies.gold + q.gold, guildPoints: save.currencies.guildPoints + q.gp }, flags: { ...save.flags, [`petraRequest${index}Claimed`]: true, petraTrust: getLocationTrust(save, "petra") + q.trust, ...(index === 2 ? { ranchMaterialsStock: count(save.flags.ranchMaterialsStock) + 5 } : {}) } } };
}
