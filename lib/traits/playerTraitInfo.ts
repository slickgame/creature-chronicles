export type PlayerFacingTrait =
  | "none"
  | "domestic"
  | "industrious"
  | "calm"
  | "fertile"
  | "quick"
  | "sturdy"
  | "affectionate"
  | "keen"
  | "barnwise"
  | "surefooted"
  | "night_prawler"
  | "graceful";

export type PlayerFacingTraitGrade = "F" | "D" | "C" | "B" | "A" | "S";

export function getPlayerTraitLabel(trait: PlayerFacingTrait) {
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
  if (trait === "graceful") return "Graceful";
  return "No Trait";
}

export function getPlayerTraitClasses(trait: PlayerFacingTrait) {
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
  if (trait === "graceful") return "bg-fuchsia-100 text-fuchsia-900 border-fuchsia-300";
  return "bg-stone-100 text-stone-700 border-stone-300";
}

export function getPlayerTraitDescription(trait: PlayerFacingTrait) {
  if (trait === "domestic") return "Improves cooking and cleaning tasks around the home.";
  if (trait === "industrious") return "Improves field work, hauling, and labor-heavy tasks.";
  if (trait === "calm") return "Reduces breeding refusal chance and helps settle tense pairings.";
  if (trait === "fertile") return "Improves egg production chance and supports stronger breeding outcomes.";
  if (trait === "quick") return "Reduces time costs for breeding sessions and work actions.";
  if (trait === "sturdy") return "Reduces stamina costs and helps creatures endure repeated work.";
  if (trait === "affectionate") return "Boosts happiness gains and relationship-oriented interactions.";
  if (trait === "keen") return "Improves scouting, task efficiency, and future event or quest performance hooks.";
  if (trait === "barnwise") return "Horse-focused trait that improves ranch routines, hauling, and stable reliability.";
  if (trait === "surefooted") return "Horse-focused trait that improves travel toughness and steady field performance.";
  if (trait === "night_prawler") return "Cat-focused trait that improves stealthy or after-hours task performance.";
  if (trait === "graceful") return "Cat-focused trait that improves elegance, charm, and soft-support style bonuses.";
  return "No special effect.";
}

export function getPlayerTraitSpeciesNote(trait: PlayerFacingTrait) {
  if (trait === "barnwise" || trait === "surefooted") return "Horse-specific trait";
  if (trait === "night_prawler" || trait === "graceful") return "Cat-specific trait";
  if (trait === "none") return "No special trait";
  return "General trait";
}

export function getPlayerGradeClasses(grade: PlayerFacingTraitGrade) {
  if (grade === "F") return "bg-stone-100 text-stone-700 border-stone-300";
  if (grade === "D") return "bg-slate-100 text-slate-800 border-slate-300";
  if (grade === "C") return "bg-blue-100 text-blue-900 border-blue-300";
  if (grade === "B") return "bg-emerald-100 text-emerald-900 border-emerald-300";
  if (grade === "A") return "bg-amber-100 text-amber-900 border-amber-300";
  return "bg-rose-100 text-rose-900 border-rose-300";
}

export function getPlayerGradeMultiplier(grade: PlayerFacingTraitGrade) {
  if (grade === "F") return 0.35;
  if (grade === "D") return 0.5;
  if (grade === "C") return 0.7;
  if (grade === "B") return 0.9;
  if (grade === "A") return 1.15;
  return 1.4;
}

export function getPlayerGradeDescription(grade: PlayerFacingTraitGrade) {
  if (grade === "F") return "Very weak";
  if (grade === "D") return "Weak";
  if (grade === "C") return "Average";
  if (grade === "B") return "Strong";
  if (grade === "A") return "Excellent";
  return "Exceptional";
}

export function getPlayerGradeMultiplierLabel(grade: PlayerFacingTraitGrade) {
  return `${getPlayerGradeMultiplier(grade).toFixed(2)}x base effect`;
}

function scaledPercent(grade: PlayerFacingTraitGrade, basePercent: number) {
  return Math.max(1, Math.round(basePercent * getPlayerGradeMultiplier(grade)));
}

function scaledFlat(grade: PlayerFacingTraitGrade, baseFlat: number) {
  return Math.max(1, Math.round(baseFlat * getPlayerGradeMultiplier(grade)));
}

export function getPlayerTraitGradeEffectText(
  trait: PlayerFacingTrait,
  grade: PlayerFacingTraitGrade
) {
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
  if (trait === "graceful") {
    return `Charm, elegance, and social support utility worth about +${scaledPercent(grade, 11)}%.`;
  }
  return "No special effect.";
}
