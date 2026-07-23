import {
  GENERATED_GIVER_TO_RECEIVER_PAIRING_PATHS,
  GENERATED_RECEIVER_OUTCOME_PATHS,
  GENERATED_RECEIVER_PAIRING_PATHS,
} from "@/data/generatedBreedingSceneImages";
import type { BreedingOutcomeType, BreedingSceneFamily } from "@/types/breeding";

export type BreedingScenePhase = "pairing" | "outcome";
export type BreedingSceneImageBucket = {
  id: string;
  giverFamily: BreedingSceneFamily;
  receiverFamily: BreedingSceneFamily;
  phase: BreedingScenePhase;
  outcome?: BreedingOutcomeType | "blocked";
  imagePaths: readonly string[];
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

function getPairKey(giverFamily: BreedingSceneFamily, receiverFamily: BreedingSceneFamily): string {
  return `${giverFamily}_to_${receiverFamily}`;
}

function getOutcomeKey(receiverFamily: BreedingSceneFamily, outcome: BreedingOutcomeType | "blocked"): string {
  return `${receiverFamily}_${outcome}`;
}

function getPairingPaths(giverFamily: BreedingSceneFamily, receiverFamily: BreedingSceneFamily): readonly string[] | undefined {
  const exactPairPaths = GENERATED_GIVER_TO_RECEIVER_PAIRING_PATHS[getPairKey(giverFamily, receiverFamily)];
  if (exactPairPaths?.length) return exactPairPaths;

  const receiverPaths = GENERATED_RECEIVER_PAIRING_PATHS[receiverFamily];
  return receiverPaths?.length ? receiverPaths : undefined;
}

function getOutcomePaths(receiverFamily: BreedingSceneFamily, outcome: BreedingOutcomeType | "blocked"): readonly string[] | undefined {
  const exactPaths = GENERATED_RECEIVER_OUTCOME_PATHS[getOutcomeKey(receiverFamily, outcome)];
  if (exactPaths?.length) return exactPaths;

  if (outcome === "blocked") {
    const failedPaths = GENERATED_RECEIVER_OUTCOME_PATHS[getOutcomeKey(receiverFamily, "failed")];
    if (failedPaths?.length) return failedPaths;
  }

  return undefined;
}

function getImagePaths(giverFamily: BreedingSceneFamily, receiverFamily: BreedingSceneFamily, phase: BreedingScenePhase, outcome?: BreedingOutcomeType | "blocked"): readonly string[] {
  if (phase === "pairing" && !outcome) {
    const pairingPaths = getPairingPaths(giverFamily, receiverFamily);
    if (pairingPaths) return pairingPaths;
  }

  if (phase === "outcome" && outcome) {
    const outcomePaths = getOutcomePaths(receiverFamily, outcome);
    if (outcomePaths) return outcomePaths;
  }

  return [filenameFor(giverFamily, receiverFamily, phase, outcome)];
}

function makeBucket(giverFamily: BreedingSceneFamily, receiverFamily: BreedingSceneFamily, phase: BreedingScenePhase, outcome?: BreedingOutcomeType | "blocked"): BreedingSceneImageBucket {
  const isSuccess = outcome === "pregnancy";
  const isFailure = outcome === "failed" || outcome === "blocked";
  const exactPairPaths = GENERATED_GIVER_TO_RECEIVER_PAIRING_PATHS[getPairKey(giverFamily, receiverFamily)];
  const receiverPaths = GENERATED_RECEIVER_PAIRING_PATHS[receiverFamily];
  const exactOutcomePaths = outcome ? GENERATED_RECEIVER_OUTCOME_PATHS[getOutcomeKey(receiverFamily, outcome)] : undefined;
  const failedOutcomePaths = GENERATED_RECEIVER_OUTCOME_PATHS[getOutcomeKey(receiverFamily, "failed")];
  const usesExactPairFolder = phase === "pairing" && !outcome && Boolean(exactPairPaths?.length);
  const usesReceiverFolder = phase === "pairing" && !outcome && !usesExactPairFolder && Boolean(receiverPaths?.length);
  const usesExactOutcomeFolder = phase === "outcome" && Boolean(outcome && exactOutcomePaths?.length);
  const usesFailedOutcomeFallback = phase === "outcome" && outcome === "blocked" && !usesExactOutcomeFolder && Boolean(failedOutcomePaths?.length);

  return {
    id: `${giverFamily}_to_${receiverFamily}_${phase}${outcome ? `_${outcome}` : ""}`,
    giverFamily,
    receiverFamily,
    phase,
    outcome,
    imagePaths: getImagePaths(giverFamily, receiverFamily, phase, outcome),
    placeholderPath: isSuccess ? BREEDING_OUTCOME_SUCCESS_FALLBACK_PATH : isFailure ? BREEDING_OUTCOME_FAILURE_FALLBACK_PATH : BREEDING_SCENE_FALLBACK_PATH,
    promptNotes: usesExactPairFolder
      ? `A ${giverFamily} giver paired with a ${receiverFamily} receiver selects from every supported image in public/images/breeding/scenes/${receiverFamily} receiver/${giverFamily}/.`
      : usesReceiverFolder
        ? `Any giver paired with a ${receiverFamily} receiver selects from every supported image in public/images/breeding/scenes/${receiverFamily} receiver/.`
        : usesExactOutcomeFolder
          ? `A ${receiverFamily} receiver with outcome ${outcome} selects from every supported image in public/images/breeding/scenes/outcomes/${receiverFamily}/.`
          : usesFailedOutcomeFallback
            ? `Blocked ${receiverFamily} outcomes reuse the receiver's not-pregnant/failed image pool.`
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
