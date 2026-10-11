import type { CreatureAbility } from "@/types/creature";
import { normalizeTalentInstances } from "@/data/talents/talentDefinitions";

export function TalentOutcome({ talents, notes = [] }: { talents: CreatureAbility[]; notes?: string[] }) {
  const normalized = normalizeTalentInstances(talents);
  return <section aria-label="Offspring talent results" style={{ background: "#f7edcf", color: "#49341b", padding: 14, borderRadius: 8 }}><h3>Talent Results</h3>
    {normalized.length ? normalized.map(talent => <p key={talent.id}>
      <strong>{talent.name} · Grade {talent.grade}</strong><br />{talent.description}<br />
      <em>{talent.inheritanceOrigin?.kind === "mutation" ? "New mutation" : talent.inheritanceOrigin?.kind === "parent" ? `Inherited from ${talent.inheritanceOrigin.parentName ?? "a parent"}` : "Origin was not recorded for this talent."}</em>
    </p>) : <p>No talent carried through this time. The hatchling can still grow, work, and battle normally.</p>}
    {notes.length ? <details><summary>Talent roll details</summary><ul>{notes.map((note,index) => <li key={index}>{note}</li>)}</ul></details> : null}
  </section>;
}
