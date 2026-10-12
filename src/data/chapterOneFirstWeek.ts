import { getChapterOneTutorialProgress, type ChapterOneTutorialAction } from "./chapterOneGuidedTutorial";
import type { GameSave } from "@/types/save";

export type FirstWeekLesson = {
  id: string; title: string; days: string; summary: string;
  checks: { label: string; complete: boolean }[];
  tips: string[];
  destinations: { label: string; action: ChapterOneTutorialAction }[];
};

/** Suggested order only: never locks a destination or grants completion for reading. */
export function getChapterOneFirstWeekLessons(save: GameSave): FirstWeekLesson[] {
  const p = getChapterOneTutorialProgress(save);
  return [
    {
      id: "chores", title: "Care for the ranch", days: "Day 1",
      summary: "Learn the daily loop: read the brief, work at your farm locations, then review feeding and recovery overnight.",
      checks: [{ label: "Complete a work action", complete: p.choresAssigned }, { label: "Complete another work action", complete: p.secondChoreAssigned }, { label: "Resolve the first night", complete: p.firstNightResolved }, { label: "Gather supplies or repair damage", complete: p.resourceProblemSolved }],
      tips: ["Keep a food reserve before expanding. Farm work provides specific supplies; Guild requests and battles provide repeatable Gold.", "Work resolves instantly and costs creature Energy only. Preview output before confirming.", "Read each worker’s availability and Energy. Cook Balanced rations or enable unreserved ingredients for nightly feeding.", "Open Today to review the Morning Brief and overnight results. Daily goals are extra opportunities, not mandatory lessons."],
      destinations: [{ label: "Open Farm Management", action: "chores" }, { label: "Review Today", action: "ranch" }],
    },
    {
      id: "town", title: "Find your way around town", days: "Days 2–3",
      summary: "Browse services, complete an affordable Guild request, and learn where your records live.",
      checks: [{ label: "Browse Town, Adoption Hearth, and Ranch Office", complete: p.townNavigationComplete }, { label: "Complete a Guild request", complete: p.guildRequestCompleted }],
      tips: ["Use Menu → Travel for ranch and town destinations. Town’s arrows reveal more services; browsing costs nothing.", "Accept a request before working toward it. Check requirements and the exact payout; permanent creature placements remove that creature from your roster.", "Unaccepted board requests rotate Monday. Rerolls cost progressively more during the week, then reset Monday. Accepted and completed requests stay.", "Adoption, construction, and Rose Lantern activities are optional. You do not need to buy a creature or a building for this lesson."],
      destinations: [{ label: "Visit Town", action: "town" }, { label: "Open Guild Hall", action: "guild" }, { label: "Browse Adoption Hearth", action: "market" }, { label: "Open Ranch Office", action: "office" }],
    },
    {
      id: "breeding", title: "Raise the next generation", days: "Days 3–4",
      summary: "Compare a compatible pair, try breeding, and follow the pregnancy and egg through the Nursery.",
      checks: [{ label: "Record a breeding attempt", complete: p.breedingAttempted }, { label: "Create a pregnancy", complete: p.pregnancyCreated }, { label: "Receive an egg", complete: p.eggAvailable }, { label: "Confirm a hatchling", complete: p.quickhatchUsed }],
      tips: ["Choose two available creatures and review costs, compatibility, and inheritance before confirming. Innate talent grades determine their bonus strength.", "The first eligible guided creature pairing has a safe one-day pregnancy. Talent inheritance remains a separate roll; a specific talent is not guaranteed.", "Eggs can hatch naturally. Veyra’s one-time Quickhatch Catalyst is available through Inventory if you want to finish the lesson sooner.", "Reserve habitat capacity for the hatchling. Nursery → Births explains which talents came from a parent and which were new."],
      destinations: [{ label: "Open Breeding Pen", action: "breeding" }, { label: "Open Nursery", action: "nursery" }, { label: "Open Inventory", action: "inventory" }],
    },
    {
      id: "battle", title: "Prepare your first battle team", days: "Days 5–7",
      summary: "Check your loadouts, enter the Opening Scrimmage, and record your first victory.",
      checks: [{ label: "Visit Battle Outfitter", complete: p.battleOutfitterOpened }, { label: "Record a Coliseum victory", complete: p.firstBattleWon }],
      tips: ["Each creature equips up to four moves. Gear is optional; inspect its numeric bonuses before spending Gold.", "In battle, choose a creature and move, select a legal target, then queue the action. Confirm Round after your living teammates have plans.", "Spread roles across the team: reliable damage, protection, and recovery. Focus an enemy instead of scattering damage; save Energy for useful moves.", "Confirm the result ledger to save rewards and lesson progress. A loss keeps the lesson open for another attempt; scouting is under Rules & Rewards."],
      destinations: [{ label: "Open Battle Outfitter", action: "battle-outfitter" }, { label: "Enter the Coliseum", action: "coliseum" }],
    },
  ];
}
