import assert from "node:assert/strict";
import { WAYPOINTS, EDGES, planRoute } from "../js/study-navigation.mjs";
const connected = (a, b) => EDGES.some((e) => e.includes(a) && e.includes(b));
for (const start of Object.keys(WAYPOINTS))
  for (const target of Object.keys(WAYPOINTS)) {
    const path = planRoute({ node: start }, target);
    let previous = start;
    for (const node of path) {
      assert(
        connected(previous, node),
        `${previous} -> ${node} crossed a wall`,
      );
      previous = node;
    }
    assert.equal(previous, target);
  }
const gym = planRoute({ node: "study" }, "gym");
assert(
  gym.includes("studyDoor") &&
    gym.includes("studyThreshold") &&
    gym.includes("gymDoor"),
);
const lounge = planRoute({ node: "badminton" }, "lounge");
assert(lounge.includes("courtDoor") && lounge.includes("loungeDoor"));
for (const edge of EDGES)
  for (const target of ["study", "gym", "badminton", "lounge", "screen"]) {
    const position = WAYPOINTS[edge[0]].position.map(
      (n, i) => (n + WAYPOINTS[edge[1]].position[i]) / 2,
    );
    const route = planRoute({ edge, position }, target);
    assert(edge.includes(route[0]), "Interrupted travel left its safe segment");
    for (let i = 1; i < route.length; i++)
      assert(connected(route[i - 1], route[i]));
    assert.equal(route.at(-1), target);
  }
assert.deepEqual(planRoute({ node: "study" }, "study"), []);
assert.throws(
  () => planRoute({ node: "study" }, "outside"),
  /Unknown destination/,
);
console.log(
  "Camera routes verified: every room pair and every interrupted edge use actual door thresholds.",
);
