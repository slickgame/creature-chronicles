import { RANCH_ADVISOR } from "@/data/ranchAdvisor";
import { getNextChapterOneStoryScene } from "@/data/chapterOneStory";
import { getStarterGoals } from "@/data/starterGoals";
import type { GameSave } from "@/types/save";

export type VeyraTrustTierId = "cautious" | "practical" | "invested" | "loyal" | "confidante";
export type VeyraTrustTier = { id: VeyraTrustTierId; label: string; threshold: number; description: string };
export type VeyraTrustSource = { id: string; label: string; points: number; complete: boolean };
export type VeyraTrustState = { score: number; maxScore: number; tier: VeyraTrustTier; nextTier: VeyraTrustTier | null; progressPercent: number; sources: VeyraTrustSource[]; unlockedDialogueIds: string[] };
export type VeyraTrustDialogue = { id: string; flag: string; threshold: number; title: string; speaker: string; portraitPath: string; lines: string[]; nextPathLabel: string };

export const VEYRA_TRUST_TIERS: VeyraTrustTier[] = [
  { id: "cautious", label: "Cautious Partner", threshold: 0, description: "Veyra is willing to help, but she is still measuring whether the ranch is truly safe in your hands." },
  { id: "practical", label: "Practical Ally", threshold: 20, description: "Veyra trusts you with the daily loop and starts offering sharper advice." },
  { id: "invested", label: "Invested Keeper", threshold: 45, description: "Veyra sees the ranch becoming stable and begins sharing more of its history." },
  { id: "loyal", label: "Loyal Steward", threshold: 70, description: "Veyra believes you are protecting more than property; future story paths can lean on that loyalty." },
  { id: "confidante", label: "Bramble Confidante", threshold: 100, description: "Veyra fully trusts the direction of the ranch and is ready for deeper story threads after Chapter 1." },
];

export const VEYRA_TRUST_DIALOGUES: VeyraTrustDialogue[] = [
  { id: "practical-ally", flag: "m28VeyraTrust_practicalAlly", threshold: 20, title: "Veyra Trust — Practical Ally", speaker: RANCH_ADVISOR.name, portraitPath: RANCH_ADVISOR.portraitPath, nextPathLabel: "Unlocks sharper ranch advice hooks.", lines: ["You are learning the rhythm. Not perfectly, but honestly.", "That matters here. A ranch can survive mistakes. It cannot survive someone who refuses to read the signs.", "Keep showing me you can protect the loop, and I will start telling you where the old owner hid the ugly parts of the ledger."] },
  { id: "invested-keeper", flag: "m28VeyraTrust_investedKeeper", threshold: 45, title: "Veyra Trust — Invested Keeper", speaker: RANCH_ADVISOR.name, portraitPath: RANCH_ADVISOR.portraitPath, nextPathLabel: "Unlocks ranch-history dialogue hooks.", lines: ["The animals are calmer around you now. The house is, too.", "Bramble Farm has had owners before. Some saw it as land. Some saw it as a machine. A few understood it was a living thing.", "If you keep this up, I will show you records that never made it into the town archive."] },
  { id: "loyal-steward", flag: "m28VeyraTrust_loyalSteward", threshold: 70, title: "Veyra Trust — Loyal Steward", speaker: RANCH_ADVISOR.name, portraitPath: RANCH_ADVISOR.portraitPath, nextPathLabel: "Unlocks future loyalty-based story branches.", lines: ["I was ready to leave if you treated this place like a trophy.", "I am still here because you keep choosing the hard, useful work: food before pride, repairs before expansion, safety before showing off.", "When Chapter 2 starts pushing back, remember this: the farm will answer loyalty with loyalty."] },
  { id: "bramble-confidante", flag: "m28VeyraTrust_brambleConfidante", threshold: 100, title: "Veyra Trust — Bramble Confidante", speaker: RANCH_ADVISOR.name, portraitPath: RANCH_ADVISOR.portraitPath, nextPathLabel: "Unlocks deeper post-Chapter 1 story paths.", lines: ["All right. You have earned the truth in pieces, and now you have earned a larger one.", "Bramble Farm was not only inherited. It was watched. Some people in town were waiting to see if it would fail again.", "It has not failed. That means the next visitors will not all come to help."] },
];

export function getVeyraTrustState(save: GameSave): VeyraTrustState {
  const goals = getStarterGoals(save);
  const sources: VeyraTrustSource[] = [
    { id: "intro", label: "Met Veyra at Bramble Farm", points: 5, complete: save.flags.m24IntroSeen === true },
    ...goals.map((goal) => ({ id: goal.id, label: goal.label, points: 5, complete: goal.complete })),
    { id: "chapter-one-complete", label: "Completed Chapter 1 onboarding", points: 15, complete: save.flags.m24ChapterOneStoryComplete === true },
  ];
  const maxScore = sources.reduce((sum, source) => sum + source.points, 0);
  const score = sources.filter((source) => source.complete).reduce((sum, source) => sum + source.points, 0);
  const tier = [...VEYRA_TRUST_TIERS].reverse().find((item) => score >= item.threshold) ?? VEYRA_TRUST_TIERS[0];
  const nextTier = VEYRA_TRUST_TIERS.find((item) => item.threshold > score) ?? null;
  const previousThreshold = tier.threshold;
  const nextThreshold = nextTier?.threshold ?? maxScore;
  const progressPercent = nextThreshold <= previousThreshold ? 100 : Math.round(((score - previousThreshold) / (nextThreshold - previousThreshold)) * 100);
  const unlockedDialogueIds = VEYRA_TRUST_DIALOGUES.filter((dialogue) => score >= dialogue.threshold).map((dialogue) => dialogue.id);
  return { score, maxScore, tier, nextTier, progressPercent: Math.max(0, Math.min(100, progressPercent)), sources, unlockedDialogueIds };
}

export function getNextVeyraTrustDialogue(save: GameSave): VeyraTrustDialogue | null {
  if (getNextChapterOneStoryScene(save)) return null;
  const trust = getVeyraTrustState(save);
  return VEYRA_TRUST_DIALOGUES.find((dialogue) => trust.score >= dialogue.threshold && save.flags[dialogue.flag] !== true) ?? null;
}
