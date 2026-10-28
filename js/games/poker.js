import {
  makeDeck,
  shuffle,
  evaluateHand,
  compareHands,
  chooseHolds,
} from "./poker-engine.mjs";
const face = (rank) => ({ 11: "J", 12: "Q", 13: "K", 14: "A" })[rank] || rank;
export function mountPoker(container, audio) {
  let deck,
    player,
    opponent,
    held = new Set(),
    phase,
    wins = 0,
    rounds = 0;
  container.innerHTML = `<div class="game-intro"><p>Five-card draw. Pick the cards to keep, draw once, then see who has the better hand.</p><span id="poker-record">Your wins: 0 / 0</span></div><div class="poker-felt"><div class="hand-caption">The house <span id="house-rank">Cards face down</span></div><div class="card-hand" id="house-hand"></div><div class="table-message" id="poker-message" aria-live="polite"></div><div class="card-hand" id="your-hand"></div><div class="hand-caption">Your hand <span id="player-rank"></span></div></div><div class="game-actions"><button class="button button-primary" id="poker-draw">Draw cards</button><button class="button" id="poker-deal">New hand</button></div><details class="game-rules"><summary>How to play &amp; hand rankings</summary><p>Click a card to hold it. Replace as many as you like, once per hand. The house makes its own draw, then both hands are revealed. No betting; just play for the best hand.</p><p>Strongest to weakest: straight flush, four of a kind, full house, flush, straight, three of a kind, two pair, pair, high card. Suits do not break ties.</p></details>`;
  const $ = (name) => container.querySelector(name);
  function renderHand(target, cards, hidden = false) {
    target.replaceChildren();
    cards.forEach((card, i) => {
      const button = document.createElement(
        target.id === "your-hand" ? "button" : "span",
      );
      button.className =
        "playing-card" +
        (held.has(i) && target.id === "your-hand" ? " is-held" : "");
      const img = document.createElement("img");
      img.src = hidden
        ? "assets/cards/cardBack_green5.png"
        : `assets/cards/card${card.suit}${face(card.rank)}.png`;
      img.alt = hidden
        ? "Face-down card"
        : `${face(card.rank)} of ${card.suit}`;
      img.width = 140;
      img.height = 190;
      button.append(img);
      if (target.id === "your-hand") {
        button.type = "button";
        button.disabled = phase !== "draw";
        button.setAttribute(
          "aria-label",
          `${img.alt}, ${held.has(i) ? "held" : "will be replaced"}`,
        );
        button.setAttribute("aria-pressed", String(held.has(i)));
        const caption = document.createElement("span");
        caption.textContent = held.has(i) ? "Keep" : "Replace";
        button.append(caption);
        button.addEventListener("click", () => {
          held.has(i) ? held.delete(i) : held.add(i);
          audio.play("card");
          render();
          $("#your-hand").children[i].focus({ preventScroll: true });
        });
      }
      target.append(button);
    });
  }
  function render() {
    renderHand($("#house-hand"), opponent, phase === "draw");
    renderHand($("#your-hand"), player);
    $("#player-rank").textContent = evaluateHand(player).name;
    $("#house-rank").textContent =
      phase === "draw" ? "Cards face down" : evaluateHand(opponent).name;
    $("#poker-draw").disabled = phase !== "draw";
    $("#poker-draw").textContent =
      held.size === 5 ? "Stand & reveal" : `Draw ${5 - held.size} & reveal`;
    $("#poker-record").textContent = `Your wins: ${wins} / ${rounds}`;
  }
  function deal() {
    deck = shuffle(makeDeck());
    player = deck.splice(0, 5);
    opponent = deck.splice(0, 5);
    held = new Set();
    phase = "draw";
    $("#poker-message").textContent = "Choose the cards you want to keep.";
    audio.play("card");
    render();
  }
  function draw() {
    if (phase !== "draw") return;
    const houseHolds = new Set(chooseHolds(opponent));
    player = player.map((c, i) => (held.has(i) ? c : deck.pop()));
    opponent = opponent.map((c, i) => (houseHolds.has(i) ? c : deck.pop()));
    phase = "result";
    rounds++;
    const result = compareHands(player, opponent);
    if (result > 0) wins++;
    $("#poker-message").textContent =
      result > 0
        ? "Your hand wins. Nicely played."
        : result < 0
          ? "The house takes this one. Another hand?"
          : "A tie. Same hand, same kickers.";
    audio.play(result > 0 ? "win" : "card");
    render();
  }
  $("#poker-draw").addEventListener("click", draw);
  $("#poker-deal").addEventListener("click", deal);
  deal();
  return () => {
    container.replaceChildren();
  };
}
