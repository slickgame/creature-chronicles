import { CreatureTrait, TraitGrade } from "@/lib/breeding/types";
import {
  getPlayerGradeClasses,
  getPlayerGradeDescription,
  getPlayerGradeMultiplier,
  getPlayerGradeMultiplierLabel,
  getPlayerTraitClasses,
  getPlayerTraitDescription,
  getPlayerTraitGradeEffectText,
  getPlayerTraitLabel,
  getPlayerTraitSpeciesNote,
} from "@/lib/traits/playerTraitInfo";

export function getTraitLabel(trait: CreatureTrait) {
  return getPlayerTraitLabel(trait);
}

export function getTraitClasses(trait: CreatureTrait) {
  return getPlayerTraitClasses(trait);
}

export function getTraitDescription(trait: CreatureTrait) {
  return getPlayerTraitDescription(trait);
}

export function getTraitSpeciesNote(trait: CreatureTrait) {
  return getPlayerTraitSpeciesNote(trait);
}

export function getGradeClasses(grade: TraitGrade) {
  return getPlayerGradeClasses(grade);
}

export function getGradeDescription(grade: TraitGrade) {
  return getPlayerGradeDescription(grade);
}

export function getGradeMultiplier(grade: TraitGrade) {
  return getPlayerGradeMultiplier(grade);
}

export function getGradeMultiplierLabel(grade: TraitGrade) {
  return getPlayerGradeMultiplierLabel(grade);
}

export function getTraitGradeEffectText(trait: CreatureTrait, grade: TraitGrade) {
  return getPlayerTraitGradeEffectText(trait, grade);
}

export function getCreatureImage(name: string) {
  if (name === "Horse") return "/images/horse.png";
  if (name === "Cat") return "/images/cat.png";
  if (name === "Dog") return "/images/dog.png";
  if (name === "Cow") return "/images/cow.png";
  if (name === "Chicken") return "/images/chicken.png";
  if (name === "Pig") return "/images/pig.png";
  if (name === "Sheep") return "/images/sheep.png";
  if (name === "Bunny") return "/images/bunny.png";
  return "/images/egg.png";
}

export function getHappinessLabel(happiness: number) {
  if (happiness >= 80) return "Very Happy";
  if (happiness >= 60) return "Content";
  if (happiness >= 40) return "Uneasy";
  if (happiness >= 20) return "Unhappy";
  return "Miserable";
}
