import assert from "node:assert/strict";
import { WAYPOINTS, PORTALS, planView } from "../js/study-navigation.mjs";
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
assert.equal(planView("study", "badminton-hall").room, "hobbies");
assert.equal(planView("study", "card-lounge").room, "hobbies");
assert(!planView("desk", "screen").switchScene);
assert(!planView("gym", "badminton").switchScene);
assert(!planView("badminton", "lounge").switchScene);
assert(planView("study", "hobbies").switchScene);
assert(planView("hobbies", "study").switchScene);
// Interrupted portal travel can report the entered room before a view settles.
assert(planView("study", "study", "hobbies").switchScene);
for (const room of ["study", "hobbies"])
  for (const pose of Object.values(PORTALS[room])) {
    assert(pose.position.every(Number.isFinite));
    assert(pose.target.every(Number.isFinite));
    assert.notDeepEqual(pose.position, pose.target);
  }
assert.throws(() => planView("study", "outside"), /Unknown destination/);
console.log(
  "Room navigation verified: study portal, shared hobbies viewpoints, interrupted travel and legacy aliases.",
);
