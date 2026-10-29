// Every edge stays in a room or passes through the centre of an actual doorway.
export const WAYPOINTS = Object.freeze({
  study: {
    position: [2.65, 1.62, 2.7],
    target: [-0.7, 1.1, -1.7],
    room: "study",
  },
  approach: {
    position: [1.45, 1.62, 0.7],
    target: [-0.55, 1.05, -1.7],
    room: "study",
  },
  desk: {
    position: [0.55, 1.52, 0.05],
    target: [-0.7, 1.03, -1.65],
    room: "study",
  },
  screen: {
    position: [-0.65, 1.26, -0.75],
    target: [-0.65, 1.05, -1.7],
    room: "study",
  },
  studyDoor: {
    position: [3.3, 1.62, 1.5],
    target: [5.5, 1.5, 1.5],
    room: "study",
  },
  studyThreshold: {
    position: [4.4, 1.62, 1.5],
    target: [5.5, 1.5, -0.5],
    room: "corridor",
  },
  hall: {
    position: [5.5, 1.62, 1.5],
    target: [5.5, 1.5, -4],
    room: "corridor",
  },
  corridor: {
    position: [5.5, 1.62, -0.2],
    target: [5.5, 1.4, -6.8],
    room: "corridor",
  },
  gymTurn: {
    position: [5.5, 1.62, -3.8],
    target: [9, 1.4, -3.8],
    room: "corridor",
  },
  gymDoor: { position: [7.5, 1.62, -3.8], target: [12, 1.2, -4], room: "gym" },
  gym: { position: [8.6, 1.65, -2.2], target: [12, 1.15, -4.2], room: "gym" },
  hallSouth: {
    position: [5.5, 1.62, 6],
    target: [8.4, 1.6, 6],
    room: "corridor",
  },
  courtDoor: {
    position: [7.6, 1.7, 6],
    target: [10, 1.5, 9],
    room: "badminton",
  },
  courtSide: {
    position: [8.15, 1.7, 3.2],
    target: [12.5, 1.3, 11],
    room: "badminton",
  },
  badminton: {
    position: [12.5, 1.7, 3.2],
    target: [12.5, 1.3, 12],
    room: "badminton",
  },
  loungeTurn: {
    position: [5.5, 1.62, 10.5],
    target: [1, 1.3, 10.5],
    room: "corridor",
  },
  loungeDoor: {
    position: [3.4, 1.62, 10.5],
    target: [-0.7, 1.1, 10.5],
    room: "lounge",
  },
  lounge: {
    position: [2.4, 1.62, 10.5],
    target: [-0.7, 0.9, 10.7],
    room: "lounge",
  },
});
export const EDGES = Object.freeze([
  ["study", "approach"],
  ["approach", "desk"],
  ["desk", "screen"],
  ["study", "studyDoor"],
  ["studyDoor", "studyThreshold"],
  ["studyThreshold", "hall"],
  ["hall", "corridor"],
  ["corridor", "gymTurn"],
  ["gymTurn", "gymDoor"],
  ["gymDoor", "gym"],
  ["hall", "hallSouth"],
  ["hallSouth", "courtDoor"],
  ["courtDoor", "courtSide"],
  ["courtSide", "badminton"],
  ["hallSouth", "loungeTurn"],
  ["loungeTurn", "loungeDoor"],
  ["loungeDoor", "lounge"],
]);
const distance = (a, b) => Math.hypot(...a.map((n, i) => n - b[i]));
const adjacent = new Map(Object.keys(WAYPOINTS).map((key) => [key, []]));
for (const [a, b] of EDGES) {
  const weight = distance(WAYPOINTS[a].position, WAYPOINTS[b].position);
  adjacent.get(a).push([b, weight]);
  adjacent.get(b).push([a, weight]);
}
function shortest(start, target) {
  const costs = new Map([[start, 0]]),
    paths = new Map([[start, []]]),
    pending = new Set(adjacent.keys());
  while (pending.size) {
    const next = [...pending].sort(
      (a, b) => (costs.get(a) ?? Infinity) - (costs.get(b) ?? Infinity),
    )[0];
    pending.delete(next);
    if (next === target)
      return { cost: costs.get(next), path: paths.get(next) };
    for (const [neighbor, weight] of adjacent.get(next)) {
      const cost = costs.get(next) + weight;
      if (cost < (costs.get(neighbor) ?? Infinity)) {
        costs.set(neighbor, cost);
        paths.set(neighbor, [...paths.get(next), neighbor]);
      }
    }
  }
  throw new Error("No camera route to " + target);
}
export function planRoute(
  { node = "study", edge = null, position = WAYPOINTS[node].position },
  target,
) {
  if (!WAYPOINTS[target]) throw new Error("Unknown destination: " + target);
  if (!edge) return shortest(node, target).path;
  // An interrupted camera is still on its current safe edge. It may finish or
  // reverse that edge, never take a diagonal shortcut through a wall.
  const choices = edge.map((endpoint) => {
    const route = shortest(endpoint, target);
    return {
      cost: distance(position, WAYPOINTS[endpoint].position) + route.cost,
      path: [endpoint, ...route.path],
    };
  });
  return choices.sort((a, b) => a.cost - b.cost)[0].path;
}
