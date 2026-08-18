import assert from "node:assert/strict";
import test from "node:test";
import { getMorningLegacyAnnouncement } from "../src/data/creatureLegacyNotifications.ts";
import { addCreatureMemory } from "../src/data/creatureMemories.ts";
import { createNewGameSave } from "../src/lib/save/localSave.ts";

test("Morning Brief combines previous-day retirement and Hall induction into one lifecycle announcement", () => {
  const base = createNewGameSave("Legacy Morning", 0);
  const creature = base.creatures![0];
  let save = addCreatureMemory(base, {
    creatureId: creature.creatureId,
    category: "achievement",
    importance: "legendary",
    title: `${creature.nickname} retired as Ranch Legend`,
    description: `${creature.nickname} concluded an active ranch career and created a Heirloom.`,
    dayNumber: 1,
    sourceKey: `retirement:${String(creature.creatureId)}`,
    tags: ["retirement", "heirloom"],
  });
  save = addCreatureMemory(save, {
    creatureId: creature.creatureId,
    category: "achievement",
    importance: "legendary",
    title: `${creature.nickname} entered the Hall of Legends`,
    description: `${creature.nickname} received permanent Hall induction.`,
    dayNumber: 1,
    sourceKey: `hall-induction:${String(creature.creatureId)}`,
    tags: ["hall-of-legends", "induction"],
  });
  save = {
    ...save,
    dayState: { ...save.dayState, dayNumber: 2 },
    creatureLegacy: {
      version: 1,
      retiredByCreatureId: {
        [String(creature.creatureId)]: {
          retirementId: "retirement-test",
          version: 1,
          creatureId: creature.creatureId,
          creature,
          retiredAtDayNumber: 1,
          retiredAt: new Date(0).toISOString(),
          legacyTitle: "Ranch Legend",
          legacyScore: 200,
          fulfilledAmbitions: 2,
          strongestContribution: "victories",
          heirloomId: "heirloom-test",
          inductedIntoHall: true,
        },
      },
      heirloomsById: {},
      hallByCreatureId: {},
      processedEventKeys: [],
    },
  };

  const announcement = getMorningLegacyAnnouncement(save);
  assert.ok(announcement);
  assert.equal(announcement.kind, "hall");
  assert.equal(announcement.dayLabel, "Ranch Day 1");
  assert.equal(announcement.creatureNames[0], creature.nickname);
  assert.match(announcement.description, /created a Heirloom/);
  assert.match(announcement.description, /permanent Hall induction/);
});

test("Morning Brief ignores same-day and older Legacy lifecycle entries", () => {
  const base = createNewGameSave("Legacy Morning Filter", 0);
  const creature = base.creatures![0];
  const save = addCreatureMemory(
    { ...base, dayState: { ...base.dayState, dayNumber: 3 } },
    {
      creatureId: creature.creatureId,
      category: "achievement",
      importance: "major",
      title: `${creature.nickname} retired`,
      description: "Retirement happened today.",
      dayNumber: 3,
      sourceKey: `retirement:${String(creature.creatureId)}`,
      tags: ["retirement"],
    },
  );
  assert.equal(getMorningLegacyAnnouncement(save), null);
});
