import assert from "node:assert/strict";
import { WAYPOINTS, planView } from "../js/study-navigation.mjs";
for (const from of Object.keys(WAYPOINTS))
  for (const target of Object.keys(WAYPOINTS)) {
    const view = planView(from, target);
    assert.equal(view.name, target);
    assert.equal(
      view.switchScene,
      WAYPOINTS[from].room !== WAYPOINTS[target].room,
    );
    assert(
      view.position.every(Number.isFinite) &&
        view.target.every(Number.isFinite),
    );
    assert.notDeepEqual(view.position, view.target);
  }
assert.equal(planView("gym", "corridor").room, "study");
assert.equal(planView("study", "badminton-hall").room, "badminton");
assert.equal(planView("study", "card-lounge").room, "lounge");
assert(!planView("desk", "screen").switchScene);
assert.throws(() => planView("study", "outside"), /Unknown destination/);
console.log(
  "Destination compositions verified: isolated scenes, same-desk approaches and legacy aliases.",
);
