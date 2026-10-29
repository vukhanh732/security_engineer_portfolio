// Composed destinations replace the long, texture-heavy building tour.
export const WAYPOINTS = Object.freeze({
  study: { position: [-9, 6, 11.8], target: [0, -1.1, 0], room: "study" },
  desk: { position: [0, 4.6, 13], target: [0, -0.7, 0], room: "study" },
  screen: { position: [0, 1.04, 1.9], target: [0, 0.95, 0.255], room: "study" },
  gym: { position: [-5.8, 4.1, 6.2], target: [0, 0.8, 0], room: "gym" },
  badminton: {
    position: [10, 10.5, 14],
    target: [0, 0.25, 0],
    room: "badminton",
  },
  lounge: { position: [-4.1, 3.6, 5.5], target: [0, 0.5, 0], room: "lounge" },
});
const aliases = {
  corridor: "study",
  "badminton-hall": "badminton",
  "card-lounge": "lounge",
};
export function planView(from, requested) {
  const name = aliases[requested] || requested;
  if (!WAYPOINTS[name]) throw new Error("Unknown destination: " + requested);
  return {
    name,
    ...WAYPOINTS[name],
    switchScene: WAYPOINTS[from]?.room !== WAYPOINTS[name].room,
  };
}
