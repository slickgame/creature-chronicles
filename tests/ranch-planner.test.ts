import test from "node:test";
import assert from "node:assert/strict";
class Storage {
  values = new Map<string, string>();
  get length() {
    return this.values.size;
  }
  getItem(k: string) {
    return this.values.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    this.values.set(k, v);
  }
  removeItem(k: string) {
    this.values.delete(k);
  }
  key(i: number) {
    return [...this.values.keys()][i] ?? null;
  }
}
const storage = new Storage();
(globalThis as any).window = { localStorage: storage };
const { createNewGameSave } =
  await import("../src/lib/save/localSaveLifecycle.ts");
const { getRanchPlanner } = await import("../src/data/ranchPlanner.ts");
const { projectRanchDay, advanceRanchDay } =
  await import("../src/data/ranch-day/ranchDayLifecycle.ts");
const { enterEveningReview } =
  await import("../src/data/ranch-day/ranchDayState.ts");
test("opening a planner leaves the save and browser storage untouched", () => {
  const save = createNewGameSave("Planner Test", 0),
    before = JSON.stringify(save),
    stored = [...storage.values];
  getRanchPlanner(save);
  getRanchPlanner(save);
  assert.equal(JSON.stringify(save), before);
  assert.deepEqual([...storage.values], stored);
});
test("projected feed matches the actual overnight feeding result", () => {
  const save = createNewGameSave("Feed Test", 1);
  save.flags.ranchFeedStock = 1;
  const planner = getRanchPlanner(save),
    evening = enterEveningReview(save);
  const preview = projectRanchDay(evening)!,
    actual = advanceRanchDay(evening)!;
  for (const key of [
    "ranchFeedStock",
    "ranchFeedProducedToday",
    "ranchFeedRequiredToday",
    "ranchFeedConsumedToday",
  ]) {
    assert.equal(preview.save.flags[key], actual.save.flags[key], key);
  }
  assert.equal(planner.feed.required, actual.save.flags.ranchFeedRequiredToday);
  assert.equal(planner.feed.produced, actual.save.flags.ranchFeedProducedToday);
  assert.equal(
    planner.feed.shortage,
    Math.max(
      0,
      planner.feed.required - planner.feed.stock - planner.feed.produced,
    ),
  );
});
test("Day 30 tax warning derives from the calendar, not a stale flag", () => {
  const save = createNewGameSave("Tax Test", 2);
  save.dayState.dayOfMonth = 30;
  save.flags.taxDaysRemaining = 24;
  save.currencies.gold = 0;
  const planner = getRanchPlanner(save);
  assert.equal(planner.taxDays, 0);
  assert.equal(planner.rows.find((r) => r.id === "tax")?.status, "Due tonight");
  assert.equal(planner.taxShortage, planner.tax);
});
