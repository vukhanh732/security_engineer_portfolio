// A small, deterministic arcade simulation. No DOM, rendering or audio here.
export const DIFFICULTIES = Object.freeze({
  friendly: {
    name: "Friendly",
    speedX: 0.48,
    speedY: 0.34,
    reaction: 0.24,
    reachX: 0.12,
    reachY: 0.13,
  },
  club: {
    name: "Club",
    speedX: 0.68,
    speedY: 0.42,
    reaction: 0.2,
    reachX: 0.1,
    reachY: 0.11,
  },
});
export const SHOTS = Object.freeze({
  clear: { name: "Clear", depth: 0.09, duration: 1.28, arc: 94 },
  drop: { name: "Drop", depth: 0.37, duration: 0.94, arc: 62 },
  smash: { name: "Smash", depth: 0.2, duration: 0.59, arc: 26 },
});
const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
const STEP = 1 / 120;
export function createBadminton({
  random = Math.random,
  difficulty = "friendly",
} = {}) {
  let level = DIFFICULTIES[difficulty] ? difficulty : "friendly";
  let state,
    accumulator = 0,
    events = [];
  function reset() {
    accumulator = 0;
    events = [];
    state = {
      phase: "ready",
      time: 0,
      scores: [0, 0],
      player: { x: 0.5, y: 0.86 },
      bot: { x: 0.5, y: 0.14 },
      aim: 0.5,
      rally: 0,
      flight: null,
      cooldown: 0,
      swingTime: 0,
      moving: false,
      feedback: "Your serve. Pick your aim, then serve.",
      quality: null,
    };
  }
  function feedback(text, quality = null) {
    state.feedback = text;
    state.quality = quality;
    events.push({ type: "feedback", text, quality });
  }
  function launch(
    from,
    to,
    receiver,
    { kind = "clear", duration = 1.28, arc = 94, quality = 1 } = {},
  ) {
    state.flight = {
      from: { ...from },
      to: { ...to },
      receiver,
      kind,
      duration,
      arc,
      progress: 0,
      elapsed: 0,
      tried: false,
      quality,
    };
    state.phase = "rally";
    state.rally++;
    events.push({ type: "hit", receiver, kind, quality });
  }
  function point(winner) {
    state.scores[winner]++;
    state.flight = null;
    state.cooldown = 0;
    state.swingTime = 0;
    state.phase = state.scores[winner] >= 7 ? "over" : "ready";
    const text =
      state.phase === "over"
        ? winner === 0
          ? "You win! Good placement, good game."
          : "Match to the bot. Try moving it from side to side."
        : winner === 0
          ? "Your point! The open court paid off. Serve when ready."
          : "Point to the bot. Find the landing ring, then time your shot.";
    feedback(text);
    events.push({ type: "point", winner, over: state.phase === "over" });
  }
  function setAim(value) {
    if (Number.isFinite(value)) state.aim = clamp(value, 0.08, 0.92);
  }
  function shuttle() {
    const f = state.flight;
    if (!f) return null;
    const t = Math.min(f.progress, 1);
    return {
      x: f.from.x + (f.to.x - f.from.x) * t,
      y: f.from.y + (f.to.y - f.from.y) * t,
    };
  }
  function swing(kind = "clear") {
    if (!SHOTS[kind] || state.phase === "over") return false;
    if (state.phase === "ready") {
      state.rally = 0;
      state.cooldown = 0.38;
      state.swingTime = 0.2;
      launch(state.player, { x: 0.5, y: 0.12 }, "bot", {
        kind: "serve",
        duration: 1.3,
        arc: 75,
      });
      feedback("Serve in. Get ready for the return.");
      return true;
    }
    if (state.cooldown > 0) return false;
    state.cooldown = 0.38;
    state.swingTime = 0.2;
    const f = state.flight;
    if (f.receiver !== "player") {
      feedback("Wait for the return.");
      return false;
    }
    if (f.progress < 0.77) {
      feedback("Too early. Hit as the ring closes.", "early");
      return false;
    }
    if (f.progress > 1.055) {
      feedback("Too late. Get your racket ready sooner.", "late");
      return false;
    }
    const p = shuttle(),
      distance = Math.hypot(
        (p.x - state.player.x) / 0.145,
        (p.y - state.player.y) / 0.16,
      );
    if (distance > 1) {
      feedback("Out of reach. Move towards the landing ring.", "reach");
      return false;
    }
    const timing = clamp(1 - Math.abs(f.progress - 0.95) / 0.18, 0.1, 1),
      quality = timing * (1 - distance * 0.18);
    const shot = SHOTS[kind],
      target = {
        x: 0.5 + (state.aim - 0.5) * (0.65 + quality * 0.35),
        y: shot.depth,
      };
    const duration =
      shot.duration + (1 - quality) * (kind === "smash" ? 0.5 : 0.18);
    launch(p, target, "bot", { kind, duration, arc: shot.arc, quality });
    feedback(
      quality > 0.78
        ? "Perfect contact. " + shot.name + "!"
        : quality > 0.48
          ? "Good return. " + shot.name + "."
          : "Off-centre contact. Keep watching the ring.",
      quality > 0.78 ? "perfect" : quality > 0.48 ? "good" : "off-centre",
    );
    return true;
  }
  function moveTowards(actor, goal, speedX, speedY, dt) {
    const dx = goal.x - actor.x,
      dy = goal.y - actor.y,
      distance = Math.hypot(dx / speedX, dy / speedY);
    if (distance <= dt) {
      actor.x = goal.x;
      actor.y = goal.y;
      return false;
    }
    actor.x += (dx * dt) / distance;
    actor.y += (dy * dt) / distance;
    return true;
  }
  function botReturn(f, p, stretch) {
    let kind = "clear",
      to = { x: 0.5, y: 0.86 },
      duration = 1.34,
      arc = 94;
    if (f.kind !== "serve") {
      const roll = random(),
        away =
          state.player.x < 0.42
            ? 0.82
            : state.player.x > 0.58
              ? 0.18
              : random() < 0.5
                ? 0.2
                : 0.8;
      kind =
        stretch > 0.8 || state.bot.y > 0.29
          ? "clear"
          : roll < 0.38
            ? "drop"
            : roll > 0.78 && state.rally > 3
              ? "smash"
              : "clear";
      to = {
        x: 0.5 + (away - 0.5) * (1 - stretch * 0.12),
        y: kind === "drop" ? 0.63 : kind === "smash" ? 0.82 : 0.92,
      };
      duration =
        kind === "drop"
          ? 1.06
          : kind === "smash"
            ? level === "friendly"
              ? 1.0
              : 0.83
            : 1.3;
      duration += stretch * 0.16;
      arc = kind === "smash" ? 30 : kind === "drop" ? 66 : 94;
    }
    launch(p, to, "player", { kind, duration, arc });
    feedback(
      kind === "drop"
        ? "Short return. Move forward to the ring."
        : kind === "smash"
          ? "Fast return. Get behind it."
          : "Your return. Watch the ring close.",
    );
  }
  function update(dt, input) {
    state.time += dt;
    state.cooldown = Math.max(0, state.cooldown - dt);
    state.swingTime = Math.max(0, state.swingTime - dt);
    if (state.phase === "over") {
      state.moving = false;
      return;
    }
    const dx = clamp(Number(input.dx) || 0, -1, 1),
      dy = clamp(Number(input.dy) || 0, -1, 1);
    if (dx || dy) {
      const length = Math.max(1, Math.hypot(dx, dy));
      state.player.x = clamp(
        state.player.x + (dx / length) * dt * 0.95,
        0.06,
        0.94,
      );
      state.player.y = clamp(
        state.player.y + (dy / length) * dt * 0.8,
        0.57,
        0.95,
      );
      state.moving = true;
    } else if (
      input.target &&
      Number.isFinite(input.target.x) &&
      Number.isFinite(input.target.y)
    )
      state.moving = moveTowards(
        state.player,
        {
          x: clamp(input.target.x, 0.06, 0.94),
          y: clamp(input.target.y, 0.57, 0.95),
        },
        0.95,
        0.8,
        dt,
      );
    else state.moving = false;
    const f = state.flight;
    if (!f) return;
    f.elapsed += dt;
    f.progress = f.elapsed / f.duration;
    const bot = DIFFICULTIES[level];
    if (f.receiver === "bot") {
      if (f.elapsed >= bot.reaction)
        moveTowards(state.bot, f.to, bot.speedX, bot.speedY, dt);
      // One attempt per incoming shuttle. No per-frame random retry loop.
      if (!f.tried && f.progress >= 0.98) {
        f.tried = true;
        const p = shuttle(),
          stretch = Math.hypot(
            (p.x - state.bot.x) / bot.reachX,
            (p.y - state.bot.y) / bot.reachY,
          );
        if (stretch <= 1) {
          botReturn(f, p, stretch);
          return;
        }
      }
    } else
      moveTowards(
        state.bot,
        { x: 0.5, y: 0.16 },
        bot.speedX * 0.62,
        bot.speedY * 0.62,
        dt,
      );
    if (state.flight === f && f.progress >= 1.065)
      point(f.receiver === "player" ? 1 : 0);
  }
  function step(dt, input = {}) {
    if (!Number.isFinite(dt) || dt <= 0) return;
    accumulator += Math.min(dt, 0.25);
    while (accumulator + 1e-10 >= STEP) {
      update(STEP, input);
      accumulator -= STEP;
    }
  }
  function getState() {
    return {
      ...state,
      difficulty: level,
      scores: [...state.scores],
      player: { ...state.player },
      bot: { ...state.bot },
      flight: state.flight
        ? {
            ...state.flight,
            from: { ...state.flight.from },
            to: { ...state.flight.to },
          }
        : null,
    };
  }
  function takeEvents() {
    const result = events;
    events = [];
    return result;
  }
  function setDifficulty(value) {
    if (DIFFICULTIES[value]) {
      level = value;
      reset();
    }
  }
  reset();
  return { step, swing, setAim, setDifficulty, reset, getState, takeEvents };
}
