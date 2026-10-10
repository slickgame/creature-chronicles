"use client";

import { getBreedingParticipants } from "@/data/breeding";
import { getTalentInheritanceOdds } from "@/data/genetics";
import { isBreedingSupportItemArmed, TRAIT_STABILIZER_ABILITY_BONUS, MUTATION_CATALYST_ABILITY_MUTATION_BONUS } from "@/data/breedingItems";
import { normalizeTalentInstances } from "@/data/talents/talentDefinitions";
import type { GameSave } from "@/types/save";
import styles from "./TalentInheritancePanel.module.css";

export function TalentInheritancePanel({ save, giverId, receiverId }: { save: GameSave; giverId: string | null; receiverId: string | null }) {
  const participants = getBreedingParticipants(save);
  const parents = [participants.find(p => p.participantId === giverId), participants.find(p => p.participantId === receiverId)];
  const [giver, receiver] = parents;
  const valid = giver && receiver && giver.kind === "creature" && receiver.kind === "creature" && giver.participantId !== receiver.participantId;
  const odds = valid ? getTalentInheritanceOdds(save, giver, receiver) : null;
  return <section className={styles.panel} aria-label="Talent inheritance preview">
    <p>Compare the parents’ talents. Any species can inherit a general talent, at the contributing parent’s grade.</p>
    <div className={styles.parents}>{parents.map((parent, index) => <article key={index}>
      <h3>{parent?.displayName ?? (index === 0 ? "Choose a giver" : "Choose a receiver")}</h3>
      {parent?.kind === "player" ? <p>The player does not contribute inheritable creature talents.</p> : normalizeTalentInstances(parent?.abilities).length ? normalizeTalentInstances(parent?.abilities).map(talent => <div className={styles.talent} key={talent.id}>
        <strong>{talent.name} · Grade {talent.grade}</strong><p>{talent.description}</p>
      </div>) : <p>No parent talent available.</p>}
    </article>)}</div>
    {odds ? <>
      <h3>Possible outcomes after conception</h3>
      <dl className={styles.odds}>
        <div><dt>First parent-talent check</dt><dd>{odds.first}%</dd></div>
        <div><dt>Second talent, after the first succeeds</dt><dd>{odds.second}%</dd></div>
        <div><dt>New talent mutation, if a slot remains</dt><dd>{odds.mutation}%</dd></div>
      </dl>
      <p>The first check chooses one parent talent; grade and affection influence which one. A second must be a different talent. These are separate checks, not a chance for every listed talent. A hatchling can receive up to two talents, or none.</p>
      {isBreedingSupportItemArmed(save, "trait_stabilizer") ? <p><strong>Trait Stabilizer armed:</strong> an extra {TRAIT_STABILIZER_ABILITY_BONUS}% rescue check for a strongest parent talent, only when the earlier rolls leave no talents.</p> : null}
      {isBreedingSupportItemArmed(save, "mutation_catalyst") ? <p><strong>Mutation Catalyst armed:</strong> an extra {MUTATION_CATALYST_ABILITY_MUTATION_BONUS}% new-talent check if a slot remains.</p> : null}
      <p><strong>Not guaranteed:</strong> pregnancy odds and talent inheritance are separate. Even the tutorial’s guaranteed pregnancy can produce an offspring without a parent talent. Final results are stored at conception.</p>
    </> : <p>Choose two different creatures to compare offspring talent odds.</p>}
  </section>;
}
