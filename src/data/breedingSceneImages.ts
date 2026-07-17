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
const EQUINE_RECEIVER_PAIRING_BASE = "/images/breeding/scenes/equine%20receiver";
const EQUINE_RECEIVER_PAIRING_COUNT = 41;
const BOVINE_RECEIVER_PAIRING_BASE = "/images/breeding/scenes/bovine%20receiver";
const BOVINE_RECEIVER_PAIRING_COUNT = 20;

const EQUINE_RECEIVER_PAIRING_PATHS = Array.from(
  { length: EQUINE_RECEIVER_PAIRING_COUNT },
  (_, index) => `${EQUINE_RECEIVER_PAIRING_BASE}/${index + 1}.png`,
);

const BOVINE_RECEIVER_PAIRING_PATHS = Array.from(
  { length: BOVINE_RECEIVER_PAIRING_COUNT },
  (_, index) => `${BOVINE_RECEIVER_PAIRING_BASE}/${index + 1}.png`,
);

function filenameFor(giverFamily: BreedingSceneFamily, receiverFamily: BreedingSceneFamily, phase: BreedingScenePhase, outcome?: BreedingOutcomeType | "blocked"): string {
  return `${BREEDING_SCENE_BASE}/${giverFamily}_to_${receiverFamily}_${phase}${outcome ? `_${outcome}` : ""}_01.png`;
}

function getImagePaths(giverFamily: BreedingSceneFamily, receiverFamily: BreedingSceneFamily, phase: BreedingScenePhase, outcome?: BreedingOutcomeType | "blocked"): string[] {
  if (receiverFamily === "equine" && phase === "pairing" && !outcome) return EQUINE_RECEIVER_PAIRING_PATHS;
  if (receiverFamily === "bovine" && phase === "pairing" && !outcome) return BOVINE_RECEIVER_PAIRING_PATHS;
  return [filenameFor(giverFamily, receiverFamily, phase, outcome)];
}

function makeBucket(giverFamily: BreedingSceneFamily, receiverFamily: BreedingSceneFamily, phase: BreedingScenePhase, outcome?: BreedingOutcomeType | "blocked"): BreedingSceneImageBucket {
  const isSuccess = outcome === "pregnancy";
  const isFailure = outcome === "failed" || outcome === "blocked";
  const usesReceiverTestPool = (receiverFamily === "equine" || receiverFamily === "bovine") && phase === "pairing" && !outcome;
  return {
    id: `${giverFamily}_to_${receiverFamily}_${phase}${outcome ? `_${outcome}` : ""}`,
    giverFamily,
    receiverFamily,
    phase,
    outcome,
    imagePaths: getImagePaths(giverFamily, receiverFamily, phase, outcome),
    placeholderPath: isSuccess ? BREEDING_OUTCOME_SUCCESS_FALLBACK_PATH : isFailure ? BREEDING_OUTCOME_FAILURE_FALLBACK_PATH : BREEDING_SCENE_FALLBACK_PATH,
    promptNotes: usesReceiverTestPool
      ? `Receiver-family test bucket. Any giver paired with a ${receiverFamily} receiver randomly selects one local test image from public/images/breeding/scenes/${receiverFamily} receiver/.`
      : phase === "pairing"
        ? `Placeholder bucket for ${giverFamily} giver with ${receiverFamily} receiver during the breeding pen scene. Keep it non-explicit in UI-safe builds unless an adult-art pack is enabled later.`
        : `Placeholder bucket for ${giverFamily} giver with ${receiverFamily} receiver outcome: ${outcome ?? "generic"}.`,
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
