import { RANCH_ADVISOR } from "@/data/ranchAdvisor";
import { TAX_COLLECTOR } from "@/data/taxCollector";
import { getStarterGoals, type StarterGoal } from "@/data/starterGoals";
import type { GameSave } from "@/types/save";

export type StorySpeaker = "narrator" | "veyra" | "vesper" | "town";
export type StoryPage = {
  speaker: string;
  portraitPath: string;
  imagePath: string;
  text: string;
  caption?: string;
};
export type StoryScene = {
  id: string;
  title: string;
  speaker: string;
  portraitPath: string;
  imagePath: string;
  lines: string[];
  pages: StoryPage[];
  flag: string;
  kind: "intro" | "goal" | "completion";
  actionLabel: string;
};

export type StoryLogEntry = StoryScene & {
  seen: boolean;
  lockedReason?: string;
};

const STORY_PORTRAITS: Record<StorySpeaker, string> = {
  narrator: "/images/ui/icons/icon_paw_crest.png",
  veyra: RANCH_ADVISOR.portraitPath,
  vesper: TAX_COLLECTOR.portraitPath,
  town: "/images/ui/icons/icon_shop_bag.png",
};

export const STORY_IMAGE_PLACEHOLDERS = {
  farmGate: "/images/ui/logo/creature_chronicles_logo.png",
  veyraPorch: RANCH_ADVISOR.portraitPath,
  taxNotice: TAX_COLLECTOR.portraitPath,
  townRoad: "/images/ui/icons/icon_shop_bag.png",
  choreBoard: "/images/ui/icons/icon_ranch_chores_board.png",
  security: "/images/ui/icons/icon_security_patrol.png",
  comfort: "/images/ui/icons/icon_comfort_care.png",
  feed: "/images/ui/icons/icon_stable_production.png",
  garden: "/images/ui/icons/icon_garden_tending.png",
  hauling: "/images/ui/icons/icon_field_hauling.png",
  sleep: "/images/ui/icons/icon_sleep_recovery.png",
  materials: "/images/ui/icons/icon_ranch_upgrade.png",
  repair: "/images/ui/icons/icon_ranch_ledger.png",
  breeding: "/images/ui/icons/icon_breeding_pen_upgrade.png",
  egg: "/images/ui/icons/icon_nursery_upgrade.png",
  guild: "/images/ui/icons/icon_guild_contract.png",
  completion: "/images/ui/icons/icon_paw_crest.png",
} as const;

const GOAL_DIALOGUE: Record<string, { speaker: StorySpeaker; title: string; imagePath: string; lines: string[] }> = {
  "assign-chores": { speaker: "veyra", title: "The board has your first answers", imagePath: STORY_IMAGE_PLACEHOLDERS.choreBoard, lines: ["Good. The chore board is the ranch's pulse. When the numbers get loud, start there.", "For the first week, do not try to solve everything at once. Post one helper, check the projection, sleep, and read the morning report."] },
  "assign-security": { speaker: "veyra", title: "A guard at the fence", imagePath: STORY_IMAGE_PLACEHOLDERS.security, lines: ["That patrol will not make the ranch invincible, but it tells the wild things this place is watched.", "Keep a canine or sturdy guard rested. Danger is easier to prevent than repair."] },
  "assign-comfort": { speaker: "veyra", title: "The house feels warmer", imagePath: STORY_IMAGE_PLACEHOLDERS.comfort, lines: ["Comfort work looks soft until you see what it changes. Better moods mean better recovery, better pairings, and fewer ugly surprises.", "A calm ranch breeds better habits before it breeds better bloodlines."] },
  "assign-feed": { speaker: "veyra", title: "Feed comes first", imagePath: STORY_IMAGE_PLACEHOLDERS.feed, lines: ["Feed is boring until you run out. Then it becomes the only thing that matters.", "Your cow can keep the stable from collapsing into hunger. Protect that loop."] },
  "assign-garden": { speaker: "veyra", title: "Small hands, steady garden", imagePath: STORY_IMAGE_PLACEHOLDERS.garden, lines: ["Garden work is not just food. It teaches care, timing, and attention to the creatures who will later matter most in the nursery.", "A bunny in the garden is a quiet investment."] },
  "assign-hauling": { speaker: "veyra", title: "Materials on the road", imagePath: STORY_IMAGE_PLACEHOLDERS.hauling, lines: ["Hauling keeps the bones of the ranch from cracking. Materials become repairs, upgrades, and options.", "Send the horse when damage starts creeping up. Waiting costs more than moving early."] },
  "resolve-chores": { speaker: "veyra", title: "First night of real work", imagePath: STORY_IMAGE_PLACEHOLDERS.sleep, lines: ["There. Now you have seen the ranch answer back: feed, damage, security, comfort, materials.", "Every morning report is a lesson. Read the warnings before you chase the exciting work."] },
  "produce-feed": { speaker: "veyra", title: "A stocked bin", imagePath: STORY_IMAGE_PLACEHOLDERS.feed, lines: ["Five feed is not wealth, but it is breathing room.", "Keep that buffer and you can make choices. Lose it and the ranch starts making choices for you."] },
  "gather-materials": { speaker: "veyra", title: "Repair in your hands", imagePath: STORY_IMAGE_PLACEHOLDERS.materials, lines: ["Good. Materials mean the place can fight back against wear.", "The old owner let too many boards rot. You do not have to repeat that mistake."] },
  "repair-ranch": { speaker: "veyra", title: "The ranch holds", imagePath: STORY_IMAGE_PLACEHOLDERS.repair, lines: ["That repair matters. A clean wall, a fixed gate, a sealed roof—small things that tell the creatures this place is safe.", "Condition is not glamour. It is survival."] },
  "ranch-upgrade": { speaker: "veyra", title: "A better foundation", imagePath: STORY_IMAGE_PLACEHOLDERS.repair, lines: ["An upgrade is a promise: you are not just passing through. You are building capacity.", "Pick upgrades that support the loop you actually use, not the fantasy ranch you wish you had already."] },
  breed: { speaker: "veyra", title: "First pairing lesson", imagePath: STORY_IMAGE_PLACEHOLDERS.breeding, lines: ["Now you have touched the heart of the ranch. Pairing is not just chance; it is energy, trust, lineage, and timing.", "Do not chase rare traits too early. Learn what healthy results look like first."] },
  egg: { speaker: "veyra", title: "A new life recorded", imagePath: STORY_IMAGE_PLACEHOLDERS.egg, lines: ["An egg changes the mood of a ranch. Suddenly tomorrow matters more.", "Watch lineage, keep the nursery calm, and do not let danger events reach the places where fragile things sleep."] },
  market: { speaker: "town", title: "The market knows your name", imagePath: STORY_IMAGE_PLACEHOLDERS.townRoad, lines: ["The town notices new ranchers quickly. Coin moves, rumors move faster, and every stall owner has an opinion.", "Use the market to fill chore gaps, but remember: buying a creature is cheaper than caring for one poorly."] },
  tax: { speaker: "vesper", title: "The ledger opens", imagePath: STORY_IMAGE_PLACEHOLDERS.taxNotice, lines: ["I see the deed has not collapsed in your hands yet. Encouraging.", "Taxes are not punishment. They are proof that the Crown recognizes your claim. Pay on time, and the farm remains yours."] },
  guild: { speaker: "veyra", title: "Chapter 1 complete", imagePath: STORY_IMAGE_PLACEHOLDERS.guild, lines: ["A guild request means the town has started treating this place like a working ranch again.", "You have feed, chores, market access, breeding records, and a tax clock. That is not everything—but it is a beginning."] },
};

function getSpeakerName(speaker: StorySpeaker): string {
  return speaker === "veyra" ? RANCH_ADVISOR.name : speaker === "vesper" ? TAX_COLLECTOR.name : speaker === "town" ? "Town Road" : "Narrator";
}

function buildPages(input: Array<{ speaker: StorySpeaker; imagePath: string; text: string; caption?: string }>): StoryPage[] {
  return input.map((page) => ({ speaker: getSpeakerName(page.speaker), portraitPath: STORY_PORTRAITS[page.speaker], imagePath: page.imagePath, text: page.text, caption: page.caption }));
}

function buildScene(args: Omit<StoryScene, "speaker" | "portraitPath" | "imagePath" | "lines"> & { pages: StoryPage[] }): StoryScene {
  const firstPage = args.pages[0];
  return { ...args, speaker: firstPage?.speaker ?? "Narrator", portraitPath: firstPage?.portraitPath ?? STORY_PORTRAITS.narrator, imagePath: firstPage?.imagePath ?? STORY_IMAGE_PLACEHOLDERS.completion, lines: args.pages.map((page) => page.text) };
}

export function getChapterOneIntroScene(save: GameSave): StoryScene | null {
  if (save.flags.m24IntroSeen === true) return null;
  return buildChapterOneIntroScene();
}

export function buildChapterOneIntroScene(): StoryScene {
  return buildScene({
    id: "chapter-one-intro",
    title: "The Deed at Bramble Farm",
    flag: "m24IntroSeen",
    kind: "intro",
    actionLabel: "Begin Chapter 1",
    pages: buildPages([
      { speaker: "narrator", imagePath: STORY_IMAGE_PLACEHOLDERS.farmGate, caption: "Placeholder: Bramble Farm gate / inherited deed", text: "The letter arrived folded inside the old deed: Bramble Farm was yours now, whether you felt ready for it or not." },
      { speaker: "narrator", imagePath: STORY_IMAGE_PLACEHOLDERS.farmGate, caption: "Placeholder: overgrown fields and watching creatures", text: "By the time you reached the gate, the fields were overgrown, the fences leaned, and the creatures were watching from the edges of the property." },
      { speaker: "veyra", imagePath: STORY_IMAGE_PLACEHOLDERS.veyraPorch, caption: "Placeholder: Veyra waiting on the porch", text: "Veyra Bramble was waiting on the porch. She works here, lives here, and knows exactly which parts of the farm are still alive enough to save." },
      { speaker: "veyra", imagePath: STORY_IMAGE_PLACEHOLDERS.choreBoard, caption: "Placeholder: ranch priority board", text: "Every day begins with priorities. Security, feed, materials, comfort, eggs, taxes. Ignore one long enough and it becomes the whole story." },
      { speaker: "vesper", imagePath: STORY_IMAGE_PLACEHOLDERS.taxNotice, caption: "Placeholder: Lady Vesper's posted notice", text: `${TAX_COLLECTOR.name}, the Royal Tax Collector, has already posted the first warning in the town ledger. The Crown will recognize your claim only if the monthly bill is paid.` },
      { speaker: "town", imagePath: STORY_IMAGE_PLACEHOLDERS.townRoad, caption: "Placeholder: town road, market, guild hall, and office", text: "The nearby town can help: the Market sells creatures, the Guild posts contracts, and the Ranch Office tracks repairs and upgrades. But the farm has to stand on its own first." },
    ]),
  });
}

export function buildGoalStoryScene(goal: StarterGoal): StoryScene | null {
  const dialogue = GOAL_DIALOGUE[goal.id];
  if (!dialogue) return null;
  return buildScene({
    id: `goal-${goal.id}`,
    title: dialogue.title,
    flag: getGoalStoryFlag(goal),
    kind: "goal",
    actionLabel: "Continue",
    pages: buildPages([
      { speaker: dialogue.speaker, imagePath: dialogue.imagePath, caption: `Placeholder: ${dialogue.title}`, text: dialogue.lines[0] },
      { speaker: dialogue.speaker, imagePath: dialogue.imagePath, caption: `Placeholder: ${dialogue.title}`, text: dialogue.lines[1] },
      { speaker: "narrator", imagePath: dialogue.imagePath, caption: "Placeholder: tutorial reward card", text: `Goal complete: ${goal.label}. Reward: ${goal.rewardLabel}.` },
    ]),
  });
}

export function getChapterOneGoalScene(save: GameSave): StoryScene | null {
  const goals = getStarterGoals(save);
  const completedGoal = goals.find((goal) => goal.complete && save.flags[getGoalStoryFlag(goal)] !== true);
  return completedGoal ? buildGoalStoryScene(completedGoal) : null;
}

export function getChapterOneCompletionScene(save: GameSave): StoryScene | null {
  const goals = getStarterGoals(save);
  const complete = goals.every((goal) => goal.complete);
  if (!complete || save.flags.m24ChapterOneStoryComplete === true) return null;
  return buildChapterOneCompletionScene();
}

export function buildChapterOneCompletionScene(): StoryScene {
  return buildScene({
    id: "chapter-one-complete",
    title: "Bramble Farm Breathes Again",
    flag: "m24ChapterOneStoryComplete",
    kind: "completion",
    actionLabel: "Open the next chapter",
    pages: buildPages([
      { speaker: "narrator", imagePath: STORY_IMAGE_PLACEHOLDERS.completion, caption: "Placeholder: restored ranch at morning", text: "By the end of the first chapter, the farm no longer feels abandoned. It feels watched, worked, and claimed." },
      { speaker: "veyra", imagePath: STORY_IMAGE_PLACEHOLDERS.veyraPorch, caption: "Placeholder: Veyra reviewing records", text: "Veyra studies the chore board, the nursery records, and the town notices with a small, satisfied smile." },
      { speaker: "narrator", imagePath: STORY_IMAGE_PLACEHOLDERS.guild, caption: "Placeholder: town ledger and guild seal", text: "You have met the town, felt the tax collector's pressure, learned the starter crew's roles, and proven the ranch can produce, protect, repair, breed, and answer a guild request." },
      { speaker: "veyra", imagePath: STORY_IMAGE_PLACEHOLDERS.completion, caption: "Placeholder: distant road beyond the ranch", text: "This is enough for the town to start talking. It is also enough for older problems to notice the farm is waking up." },
    ]),
  });
}

export function getNextChapterOneStoryScene(save: GameSave): StoryScene | null {
  return getChapterOneIntroScene(save) ?? getChapterOneCompletionScene(save) ?? getChapterOneGoalScene(save);
}

export function getChapterOneStoryLog(save: GameSave): StoryLogEntry[] {
  const goals = getStarterGoals(save);
  const goalEntries = goals.map((goal) => {
    const scene = buildGoalStoryScene(goal);
    if (!scene) return null;
    return { ...scene, seen: save.flags[scene.flag] === true, lockedReason: goal.complete ? undefined : goal.hint };
  }).filter(Boolean) as StoryLogEntry[];
  const intro = buildChapterOneIntroScene();
  const completion = buildChapterOneCompletionScene();
  return [
    { ...intro, seen: save.flags[intro.flag] === true, lockedReason: "Start a new save and enter the ranch." },
    ...goalEntries,
    { ...completion, seen: save.flags[completion.flag] === true, lockedReason: "Complete every Chapter 1 tutorial goal." },
  ];
}

export function getGoalStoryFlag(goal: StarterGoal): string {
  return `m24StoryGoal_${goal.id}`;
}
