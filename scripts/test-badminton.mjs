import assert from "node:assert/strict";
import { createBadminton, SHOTS } from "../js/games/badminton-engine.mjs";
const advance = (game, seconds, input = {}) => {
  for (let t = 0; t < seconds - 1e-8; t += 1 / 120) game.step(1 / 120, input);
};
function incoming(game) {
  game.swing();
  for (let i = 0; i < 400 && game.getState().flight?.receiver !== "player"; i++)
    game.step(1 / 120);
  assert.equal(game.getState().flight?.receiver, "player");
}
function contact(game, shot = "clear", aim = 0.9) {
  let s = game.getState();
  const target = { ...s.flight.to };
  game.setAim(aim);
  while (
    (s = game.getState()).flight?.receiver === "player" &&
    s.flight.progress < 0.95
  )
    game.step(1 / 120, { target });
  assert(game.swing(shot));
  return game.getState();
}
// Movement is bounded and speed limited, including pointer destinations.
const movement = createBadminton();
movement.step(1 / 60, { target: { x: 1, y: 0.6 } });
assert(movement.getState().player.x < 0.52);
advance(movement, 3, { dx: 1, dy: -1 });
assert.equal(movement.getState().player.x, 0.94);
assert.equal(movement.getState().player.y, 0.57);
movement.setAim(-100);
assert.equal(movement.getState().aim, 0.08);
movement.setAim(100);
assert.equal(movement.getState().aim, 0.92);
// An early attempt never arms an automatic later return; recovery blocks spam.
const early = createBadminton();
incoming(early);
assert.equal(early.swing(), false);
assert.equal(early.getState().quality, "early");
assert.equal(early.swing(), false);
advance(early, 2);
assert.deepEqual(early.getState().scores, [0, 1]);
// Each deliberate shot has a distinct depth, speed and height profile.
const shots = {};
for (const kind of Object.keys(SHOTS)) {
  const game = createBadminton();
  incoming(game);
  shots[kind] = contact(game, kind).flight;
  assert.equal(shots[kind].receiver, "bot");
  assert.equal(shots[kind].kind, kind);
  assert(shots[kind].quality > 0.75);
}
assert(shots.clear.to.y < shots.drop.to.y);
assert(shots.smash.duration < shots.drop.duration);
assert(shots.drop.duration < shots.clear.duration);
assert(shots.smash.arc < shots.clear.arc);
// A player who follows the visible landing ring, times contact and chooses the
// open side can win a full match. No mutation or forced score is involved.
for (const difficulty of ["friendly", "club"])
  for (const seed of [1, 7, 42]) {
    let value = seed;
    const random = () =>
      (value = (value * 1664525 + 1013904223) >>> 0) / 2 ** 32;
    const game = createBadminton({ random, difficulty });
    let ticks = 0,
      wins = 0;
    while (game.getState().phase !== "over" && ticks++ < 30000) {
      const s = game.getState();
      if (s.phase === "ready") {
        game.swing();
        continue;
      }
      const target =
        s.flight.receiver === "player" ? s.flight.to : { x: 0.5, y: 0.84 };
      game.step(1 / 120, { target });
      const next = game.getState();
      if (
        next.flight?.receiver === "player" &&
        next.flight.progress >= 0.95 &&
        next.cooldown === 0
      ) {
        game.setAim(next.bot.x < 0.5 ? 0.92 : 0.08);
        if (game.swing("smash")) wins++;
      }
    }
    assert.equal(game.getState().phase, "over");
    assert.equal(
      game.getState().scores[0],
      7,
      JSON.stringify(game.getState().scores),
    );
    assert(wins >= 7);
    game.reset();
    assert.deepEqual(game.getState().scores, [0, 0]);
    assert.equal(game.getState().phase, "ready");
    assert.equal(game.getState().rally, 0);
  }
// Club reaches an imperfect corner smash that beats the learning opponent.
for (const difficulty of ["friendly", "club"]) {
  const game = createBadminton({ difficulty, random: () => 0.3 });
  incoming(game);
  while (game.getState().flight.progress < 0.91)
    game.step(1 / 120, { target: game.getState().flight.to });
  game.setAim(0.92);
  assert(game.swing("smash"));
  advance(game, 1);
  if (difficulty === "friendly")
    assert.deepEqual(game.getState().scores, [1, 0]);
  else {
    assert.deepEqual(game.getState().scores, [0, 0]);
    assert.equal(game.getState().flight.receiver, "player");
  }
}
// A well-timed swing still needs the player in reach of the shuttle.
const reach = createBadminton();
incoming(reach);
while (reach.getState().flight.progress < 0.95)
  reach.step(1 / 120, { target: { x: 0.94, y: 0.86 } });
assert.equal(reach.swing("smash"), false);
assert.equal(reach.getState().quality, "reach");
advance(reach, 0.5);
assert.deepEqual(reach.getState().scores, [0, 1]);
// Standing still and mashing cannot replace positioning/placement.
const spam = createBadminton({ random: () => 0.25 });
for (let t = 0; t < 90 && spam.getState().phase !== "over"; t += 1 / 120) {
  spam.step(1 / 120);
  if (Math.round(t * 120) % 12 === 0) spam.swing("smash");
}
assert.equal(spam.getState().scores[1], 7);
assert.equal(spam.getState().scores[0], 0);
// Fixed-step movement/flight are consistent across normal rendering rates.
const a = createBadminton({ random: () => 0.3 }),
  b = createBadminton({ random: () => 0.3 });
a.swing();
b.swing();
for (let i = 0; i < 120; i++) a.step(1 / 120);
for (let i = 0; i < 30; i++) b.step(1 / 30);
assert.deepEqual(a.getState(), b.getState());
a.setDifficulty("club");
assert.equal(a.getState().difficulty, "club");
assert.deepEqual(a.getState().scores, [0, 0]);
console.log(
  "Badminton verified: bounded movement, timed contact/recovery, three shot profiles, full strategy wins, spam losses, reset/difficulty and frame-rate independence.",
);
