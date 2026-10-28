import assert from "node:assert/strict";
import {
  makeDeck,
  shuffle,
  evaluateHand,
  compareHands,
  chooseHolds,
} from "../js/games/poker-engine.mjs";
const hand = (
  ranks,
  suits = ["Spades", "Hearts", "Clubs", "Diamonds", "Spades"],
) => ranks.map((rank, i) => ({ rank, suit: suits[i] }));
const same = Array(5).fill("Hearts");
const samples = [
  [hand([14, 13, 11, 8, 2]), 0],
  [hand([14, 14, 11, 8, 2]), 1],
  [hand([14, 14, 11, 11, 2]), 2],
  [hand([8, 8, 8, 5, 2]), 3],
  [hand([14, 2, 3, 4, 5]), 4],
  [hand([14, 11, 8, 5, 2], same), 5],
  [hand([9, 9, 9, 4, 4]), 6],
  [hand([9, 9, 9, 9, 4]), 7],
  [hand([9, 10, 11, 12, 13], same), 8],
];
for (const [cards, category] of samples)
  assert.equal(evaluateHand(cards).category, category);
assert.equal(evaluateHand(hand([14, 2, 3, 4, 5])).ranks[0], 5);
assert.equal(compareHands(hand([14, 2, 3, 4, 5]), hand([2, 3, 4, 5, 6])), -1);
assert.equal(
  compareHands(hand([10, 10, 14, 8, 2]), hand([10, 10, 13, 12, 3])),
  1,
);
assert.equal(
  compareHands(hand([10, 10, 14, 8, 2]), hand([10, 10, 14, 8, 2]).reverse()),
  0,
);
assert.equal(compareHands(hand([4, 4, 4, 14, 14]), hand([3, 3, 3, 13, 13])), 1);
const deck = makeDeck();
assert.equal(deck.length, 52);
assert.equal(new Set(deck.map((c) => c.rank + c.suit)).size, 52);
const mixed = shuffle(deck, () => 0.37);
assert.equal(deck.length, 52);
assert.notDeepEqual(deck, mixed);
assert.equal(new Set(mixed.map((c) => c.rank + c.suit)).size, 52);
assert.deepEqual(chooseHolds(hand([9, 9, 2, 4, 7])), [0, 1]);
assert.deepEqual(
  chooseHolds(hand([10, 11, 12, 13, 14], same)),
  [0, 1, 2, 3, 4],
);
console.log(
  "Poker verified: all nine hand categories, wheel straights, ties, kickers, unique deck, shuffle and opponent holds.",
);
