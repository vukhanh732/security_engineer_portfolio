const SUITS = ["Spades", "Hearts", "Clubs", "Diamonds"];
const NAMES = [
  "High card",
  "One pair",
  "Two pair",
  "Three of a kind",
  "Straight",
  "Flush",
  "Full house",
  "Four of a kind",
  "Straight flush",
];
export function makeDeck() {
  return SUITS.flatMap((suit) =>
    Array.from({ length: 13 }, (_, i) => ({ suit, rank: i + 2 })),
  );
}
export function shuffle(deck, random = Math.random) {
  const result = [...deck];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function evaluateHand(cards) {
  const sorted = cards.map((c) => c.rank).sort((a, b) => b - a);
  const counts = new Map();
  sorted.forEach((rank) => counts.set(rank, (counts.get(rank) || 0) + 1));
  const groups = [...counts].sort((a, b) => b[1] - a[1] || b[0] - a[0]);
  const flush = cards.every((c) => c.suit === cards[0].suit);
  const straight =
    counts.size === 5 &&
    (sorted[0] - sorted[4] === 4 || sorted.join(",") === "14,5,4,3,2");
  const high = sorted.join(",") === "14,5,4,3,2" ? 5 : sorted[0];
  let category = 0,
    ranks = sorted;
  if (straight && flush) {
    category = 8;
    ranks = [high];
  } else if (groups[0][1] === 4) {
    category = 7;
    ranks = groups.map((g) => g[0]);
  } else if (groups[0][1] === 3 && groups[1][1] === 2) {
    category = 6;
    ranks = groups.map((g) => g[0]);
  } else if (flush) category = 5;
  else if (straight) {
    category = 4;
    ranks = [high];
  } else if (groups[0][1] === 3) {
    category = 3;
    ranks = groups.map((g) => g[0]);
  } else if (groups[0][1] === 2 && groups[1][1] === 2) {
    category = 2;
    ranks = groups.map((g) => g[0]);
  } else if (groups[0][1] === 2) {
    category = 1;
    ranks = groups.map((g) => g[0]);
  }
  return {
    category,
    ranks,
    name: category === 8 && high === 14 ? "Royal flush" : NAMES[category],
  };
}
export function compareHands(a, b) {
  const left = evaluateHand(a),
    right = evaluateHand(b);
  const av = [left.category, ...left.ranks],
    bv = [right.category, ...right.ranks];
  for (let i = 0; i < av.length; i++)
    if (av[i] !== bv[i]) return Math.sign(av[i] - bv[i]);
  return 0;
}
export function chooseHolds(cards) {
  const score = evaluateHand(cards);
  if (score.category >= 4) return [0, 1, 2, 3, 4];
  const counts = new Map();
  cards.forEach((c) => counts.set(c.rank, (counts.get(c.rank) || 0) + 1));
  const matches = cards.flatMap((c, i) => (counts.get(c.rank) > 1 ? [i] : []));
  if (matches.length) return matches;
  for (const suit of SUITS) {
    const suited = cards.flatMap((c, i) => (c.suit === suit ? [i] : []));
    if (suited.length === 4) return suited;
  }
  return cards.flatMap((c, i) => (c.rank >= 12 ? [i] : []));
}
