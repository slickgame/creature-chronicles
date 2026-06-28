import type { BreedingOutcomeType, BreedingSceneFamily } from "@/types/breeding";

export type BreedingScenePhase = "pairing" | "outcome";
export type BreedingSceneImageBucket = {
  id: string;
  giverFamily: BreedingSceneFamily;
  receiverFamily: BreedingSceneFamily;
  phase: BreedingScenePhase;
  outcome?: BreedingOutcomeType | "blocked";
  imagePaths: string[];
  placeholderPath: string;
  promptNotes: string;
};

export const BREEDING_SCENE_FALLBACK_PATH = "/images/ui/icons/icon_breeding_pen_upgrade.png";
export const BREEDING_OUTCOME_SUCCESS_FALLBACK_PATH = "/images/ui/icons/icon_pregnancy.png";
export const BREEDING_OUTCOME_FAILURE_FALLBACK_PATH = "/images/ui/icons/icon_ability_trigger.png";
const BREEDING_SCENE_BASE = "/images/breeding-scenes";

function filenameFor(giverFamily: BreedingSceneFamily, receiverFamily: BreedingSceneFamily, phase: BreedingScenePhase, outcome?: BreedingOutcomeType | "blocked"): string {
  return `${BREEDING_SCENE_BASE}/${giverFamily}_to_${receiverFamily}_${phase}${outcome ? `_${outcome}` : ""}_01.png`;
}

function makeBucket(giverFamily: BreedingSceneFamily, receiverFamily: BreedingSceneFamily, phase: BreedingScenePhase, outcome?: BreedingOutcomeType | "blocked"): BreedingSceneImageBucket {
  const isSuccess = outcome === "pregnancy";
  const isFailure = outcome === "failed" || outcome === "blocked";
  return {
    id: `${giverFamily}_to_${receiverFamily}_${phase}${outcome ? `_${outcome}` : ""}`,
    giverFamily,
    receiverFamily,
    phase,
    outcome,
    imagePaths: [filenameFor(giverFamily, receiverFamily, phase, outcome)],
    placeholderPath: isSuccess ? BREEDING_OUTCOME_SUCCESS_FALLBACK_PATH : isFailure ? BREEDING_OUTCOME_FAILURE_FALLBACK_PATH : BREEDING_SCENE_FALLBACK_PATH,
    promptNotes: phase === "pairing" ? `Placeholder bucket for ${giverFamily} giver with ${receiverFamily} receiver during the breeding pen scene. Keep it non-explicit in UI-safe builds unless an adult-art pack is enabled later.` : `Placeholder bucket for ${giverFamily} giver with ${receiverFamily} receiver outcome: ${outcome ?? "generic"}.`,
  };
}

const FAMILIES: BreedingSceneFamily[] = ["player", "feline", "canine", "bovine", "lapine", "equine"];
export const BREEDING_SCENE_IMAGE_BUCKETS: BreedingSceneImageBucket[] = FAMILIES.flatMap((giverFamily) => FAMILIES.flatMap((receiverFamily) => [makeBucket(giverFamily, receiverFamily, "pairing"), makeBucket(giverFamily, receiverFamily, "outcome", "pregnancy"), makeBucket(giverFamily, receiverFamily, "outcome", "failed"), makeBucket(giverFamily, receiverFamily, "outcome", "blocked")]));

function pickFromBucket(bucket: BreedingSceneImageBucket, seed: string): string {
  if (!bucket.imagePaths.length) return bucket.placeholderPath;
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) hash = (hash * 31 + seed.charCodeAt(index)) % 1000003;
  const chosenPath = bucket.imagePaths[Math.abs(hash) % bucket.imagePaths.length];
  return chosenPath || bucket.placeholderPath;
}

export function getBreedingSceneImagePath(giverFamily: BreedingSceneFamily, receiverFamily: BreedingSceneFamily, phase: BreedingScenePhase, outcome: BreedingOutcomeType | "blocked" | undefined, seed: string): string {
  const bucket = BREEDING_SCENE_IMAGE_BUCKETS.find((item) => item.giverFamily === giverFamily && item.receiverFamily === receiverFamily && item.phase === phase && item.outcome === outcome) ?? BREEDING_SCENE_IMAGE_BUCKETS.find((item) => item.giverFamily === giverFamily && item.receiverFamily === receiverFamily && item.phase === phase) ?? makeBucket(giverFamily, receiverFamily, phase, outcome);
  return pickFromBucket(bucket, seed);
}
