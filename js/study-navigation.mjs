// Composed room views. Court, gym and card room share one furnished hall.
export const WAYPOINTS = Object.freeze({
  study: { position: [-9.4, 5.2, 13.6], target: [0, -0.6, 0.4], room: "study" },
  desk: { position: [-6.4, 3.7, 8.4], target: [0, -0.35, 0.3], room: "study" },
  screen: { position: [0, 1.04, 1.9], target: [0, 0.95, 0.255], room: "study" },
  hobbies: {
    position: [22, 18, 27],
    target: [1.3, 1.5, -0.5],
    room: "hobbies",
  },
  gym: { position: [0.5, 5.1, 3], target: [6, 1, -4.5], room: "hobbies" },
  badminton: {
    position: [-13, 11, 15],
    target: [-2, 0.7, -0.6],
    room: "hobbies",
  },
  lounge: {
    position: [0, 4.6, 11.4],
    target: [6.4, 0.8, 5.1],
    room: "hobbies",
  },
});
export const PORTALS = Object.freeze({
  study: {
    approach: { position: [6.5, 0.7, 1.1], target: [6.5, 0.7, -2.3] },
    exit: { position: [6.5, 0.7, -3.4], target: [6.5, 0.7, -6] },
    entry: { position: [6.5, 0.7, -0.7], target: [1.6, 0.1, 0.4] },
  },
  hobbies: {
    approach: { position: [-4.8, 2.4, 3.15], target: [-8, 2.4, 3.15] },
    exit: { position: [-7.8, 2.4, 3.15], target: [-11, 2.4, 3.15] },
    entry: { position: [-6.0, 2.4, 3.15], target: [0, 1.4, 0] },
  },
});
const aliases = {
  corridor: "study",
  "badminton-hall": "badminton",
  "card-lounge": "lounge",
};
export function planView(from, requested, currentRoom = WAYPOINTS[from]?.room) {
  const name = aliases[requested] || requested;
  if (!WAYPOINTS[name]) throw new Error("Unknown destination: " + requested);
  return {
    name,
    ...WAYPOINTS[name],
    switchScene: currentRoom !== WAYPOINTS[name].room,
  };
}
