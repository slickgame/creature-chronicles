import { CreatureTrait, TraitGrade } from "@/lib/breeding/types";

export function getTraitLabel(trait: CreatureTrait) {
  if (trait === "domestic") return "Domestic";
  if (trait === "industrious") return "Industrious";
  if (trait === "calm") return "Calm";
  if (trait === "fertile") return "Fertile";
  if (trait === "quick") return "Quick";
  if (trait === "sturdy") return "Sturdy";
  if (trait === "affectionate") return "Affectionate";
  if (trait === "keen") return "Keen";
  if (trait === "barnwise") return "Barnwise";
  if (trait === "surefooted") return "Surefooted";
  if (trait === "night_prawler") return "Night Prawler";
  return "Graceful";
}

export function getTraitClasses(trait: CreatureTrait) {
  if (trait === "domestic") return "bg-pink-100 text-pink-900 border-pink-300";
  if (trait === "industrious") return "bg-amber-100 text-amber-900 border-amber-300";
  if (trait === "calm") return "bg-sky-100 text-sky-900 border-sky-300";
  if (trait === "fertile") return "bg-emerald-100 text-emerald-900 border-emerald-300";
  if (trait === "quick") return "bg-violet-100 text-violet-900 border-violet-300";
  if (trait === "sturdy") return "bg-stone-200 text-stone-900 border-stone-400";
  if (trait === "affectionate") return "bg-rose-100 text-rose-900 border-rose-300";
  if (trait === "keen") return "bg-cyan-100 text-cyan-900 border-cyan-300";
  if (trait === "barnwise") return "bg-orange-100 text-orange-900 border-orange-300";
  if (trait === "surefooted") return "bg-yellow-100 text-yellow-900 border-yellow-300";
  if (trait === "night_prawler") return "bg-indigo-100 text-indigo-900 border-indigo-300";
  return "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300";
}

export function getTraitDescription(trait: CreatureTrait) {
  if (trait === "domestic") return "Improves cooking and cleaning tasks around the home.";
  if (trait === "industrious") return "Improves field work, hauling, and labor-heavy tasks.";
  if (trait === "calm") return "Reduces breeding refusal chance and helps settle tense pairings.";
  if (trait === "fertile") return "Improves egg production chance and supports stronger breeding outcomes.";
  if (trait === "quick") return "Reduces time costs for breeding sessions and work actions.";
  if (trait === "sturdy") return "Reduces stamina costs and helps creatures endure repeated work.";
  if (trait === "affectionate") return "Boosts happiness gains and relationship-oriented interactions.";
  if (trait === "keen") return "Improves scouting, task efficiency, and future event/quest performance hooks.";
  if (trait === "barnwise") return "Horse-focused trait that improves ranch routines, hauling, and stable reliability.";
  if (trait === "surefooted") return "Horse-focused trait that improves travel toughness and steady field performance.";
  if (trait === "night_prawler") return "Cat-focused trait that improves stealthy or after-hours task performance.";
  return "Cat-focused trait that improves elegance, charm, and soft-support style bonuses.";
}

export function getTraitSpeciesNote(trait: CreatureTrait) {
  if (trait === "barnwise" || trait === "surefooted") {
    return "Horse-specific trait";
  }
  if (trait === "night_prawler" || trait === "graceful") {
    return "Cat-specific trait";
  }
  return "General trait";
}

export function getGradeClasses(grade: TraitGrade) {
  if (grade === "F") return "bg-stone-100 text-stone-700 border-stone-300";
  if (grade === "D") return "bg-slate-100 text-slate-800 border-slate-300";
  if (grade === "C") return "bg-blue-100 text-blue-900 border-blue-300";
  if (grade === "B") return "bg-emerald-100 text-emerald-900 border-emerald-300";
  if (grade === "A") return "bg-amber-100 text-amber-900 border-amber-300";
  return "bg-rose-100 text-rose-900 border-rose-300";
}

export function getGradeMultiplier(grade: TraitGrade) {
  if (grade === "F") return 0.35;
  if (grade === "D") return 0.5;
  if (grade === "C") return 0.7;
  if (grade === "B") return 0.9;
  if (grade === "A") return 1.15;
  return 1.4;
}

export function getGradeDescription(grade: TraitGrade) {
  if (grade === "F") return "Very weak";
  if (grade === "D") return "Weak";
  if (grade === "C") return "Average";
  if (grade === "B") return "Strong";
  if (grade === "A") return "Excellent";
  return "Exceptional";
}

function scaledPercent(grade: TraitGrade, basePercent: number) {
  return Math.max(1, Math.round(basePercent * getGradeMultiplier(grade)));
}

function scaledFlat(grade: TraitGrade, baseFlat: number) {
  return Math.max(1, Math.round(baseFlat * getGradeMultiplier(grade)));
}

export function getTraitGradeEffectText(trait: CreatureTrait, grade: TraitGrade) {
  if (trait === "domestic") {
    return `Cooking and cleaning efficiency about +${scaledPercent(grade, 12)}%.`;
  }
  if (trait === "industrious") {
    return `Field work and labor efficiency about +${scaledPercent(grade, 12)}%.`;
  }
  if (trait === "calm") {
    return `Breeding refusal chance reduced by about ${scaledPercent(grade, 8)}%.`;
  }
  if (trait === "fertile") {
    return `Egg chance support worth about +${scaledPercent(grade, 7)}%.`;
  }
  if (trait === "quick") {
    return `Action time reduced by about ${scaledFlat(grade, 10)} minutes at full effect.`;
  }
  if (trait === "sturdy") {
    return `Stamina costs reduced by about ${scaledFlat(grade, 3)} points at full effect.`;
  }
  if (trait === "affectionate") {
    return `Extra happiness and relationship gains worth about +${scaledPercent(grade, 10)}%.`;
  }
  if (trait === "keen") {
    return `Task precision and quest/event utility worth about +${scaledPercent(grade, 10)}%.`;
  }
  if (trait === "barnwise") {
    return `Stable chores, hauling, and ranch routines worth about +${scaledPercent(grade, 11)}%.`;
  }
  if (trait === "surefooted") {
    return `Travel toughness and steady field output worth about +${scaledPercent(grade, 11)}%.`;
  }
  if (trait === "night_prawler") {
    return `Stealthy, after-hours, and scouting style actions worth about +${scaledPercent(grade, 11)}%.`;
  }
  return `Charm, elegance, and social support utility worth about +${scaledPercent(grade, 11)}%.`;
}

export function getCreatureImage(name: string) {
  if (name === "Horse") return "/images/horse.png";
  if (name === "Cat") return "/images/cat.png";
  return "/images/egg.png";
}

export function getHappinessLabel(happiness: number) {
  if (happiness >= 80) return "Very Happy";
  if (happiness >= 60) return "Content";
  if (happiness >= 40) return "Uneasy";
  if (happiness >= 20) return "Unhappy";
  return "Miserable";
}
