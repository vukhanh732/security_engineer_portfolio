import { createBadminton } from "./badminton-engine.mjs?v=20261030-rooms1";

export function mountBadminton(container, audio) {
  container.innerHTML = `<div class="game-intro"><p>Move the bot. Find the open court.</p><span>First to 7 · Move: WASD / arrows · Clear: Space · Drop: J · Smash: K</span></div>
    <div class="badminton-match-settings"><label>Opponent <select id="badminton-level" aria-label="Opponent"><option value="friendly">Friendly</option><option value="club">Club</option></select></label><button class="button" id="pause-match">Pause</button><button class="button" id="reset-match">New match</button></div>
    <div class="badminton-play-area"><div class="badminton-board"><div class="badminton-score" role="group" aria-label="Match score"><span>You <strong id="your-score" aria-live="polite">0</strong></span><span id="rally-status">Your serve</span><span><strong id="bot-score" aria-live="polite">0</strong> <span id="opponent-name">Friendly bot</span></span></div>
    <canvas class="badminton-canvas" width="1800" height="1200" tabindex="0" aria-label="Badminton court. Move with WASD or arrow keys. Aim with Q left, E right or R centre. Space serves or clears, J drops, K smashes. On touch, drag your half to move and tap the opponent half to aim."></canvas></div><aside class="badminton-control-panel" aria-label="Shot controls">
    <div class="badminton-contact"><strong id="contact-cue">Your serve</strong><p id="shot-feedback" role="status">Pick a side, then serve with any shot button.</p></div>
    <div class="badminton-aim" role="group" aria-label="Shot placement"><span>Aim</span><button data-aim="0.08" aria-pressed="false">Left <kbd>Q</kbd></button><button data-aim="0.5" aria-pressed="true">Centre <kbd>R</kbd></button><button data-aim="0.92" aria-pressed="false">Right <kbd>E</kbd></button></div>
    <div class="badminton-shots" role="group" aria-label="Play a shot"><button class="button" data-shot="clear"><strong>Clear</strong><span>Space</span></button><button class="button" data-shot="drop"><strong>Drop</strong><span>J</span></button><button class="button" data-shot="smash"><strong>Smash</strong><span>K</span></button></div>
    </aside></div><details class="badminton-help"><summary>How to win a point</summary><p>Follow the landing ring on your half. Swing as it closes and turns copper, with your player close to it. Early swings do not wait for the shuttle.</p><p>Aim away from the bot. A clear pushes it back; a drop brings it forward. A well-timed smash is fast, but an off-centre one gives it time to recover. Q / R / E or the aim buttons choose a side.</p><p>Touch / mouse: drag on your half to move. Tap the opponent half to aim, then use a shot button. Movement takes time, so start early. Choose Club when you want a tougher rally.</p></details>`;
  const canvas = container.querySelector("canvas"),
    ctx = canvas.getContext("2d"),
    game = createBadminton();
  const $ = (selector) => container.querySelector(selector),
    keys = new Set();
  const W = 900,
    H = 600,
    court = { x: 150, y: 30, w: 600, h: 530 };
  let frame = null,
    previous = 0,
    paused = false,
    alive = true,
    surfaceActive = true,
    pointerMode = null,
    pointerTarget = null;
  ctx.scale(2, 2);
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
  const pos = (p) => [court.x + p.x * court.w, court.y + p.y * court.h];
  function text(selector, value) {
    const node = $(selector);
    if (node.textContent !== value) node.textContent = value;
  }
  function invalidate() {
    if (alive && surfaceActive && !document.hidden && frame === null)
      frame = requestAnimationFrame(tick);
  }
  function flush() {
    for (const event of game.takeEvents())
      if (event.type === "hit") audio.play("hit");
      else if (event.type === "point") audio.play(event.over ? "win" : "click");
  }
  function setAim(value) {
    game.setAim(value);
    const aim = game.getState().aim;
    container
      .querySelectorAll("[data-aim]")
      .forEach((button) =>
        button.setAttribute(
          "aria-pressed",
          String(Math.abs(Number(button.dataset.aim) - aim) < 0.2),
        ),
      );
    invalidate();
  }
  function swing(kind) {
    if (!paused) {
      game.swing(kind);
      flush();
      invalidate();
    }
  }
  function clearInput() {
    keys.clear();
    pointerMode = null;
    pointerTarget = null;
  }
  function keydown(event) {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    const key = event.key.toLowerCase();
    if (
      ![
        "arrowleft",
        "arrowright",
        "arrowup",
        "arrowdown",
        "w",
        "a",
        "s",
        "d",
        " ",
        "j",
        "k",
        "q",
        "r",
        "e",
      ].includes(key)
    )
      return;
    event.preventDefault();
    keys.add(key);
    if (
      [
        "w",
        "a",
        "s",
        "d",
        "arrowleft",
        "arrowright",
        "arrowup",
        "arrowdown",
      ].includes(key)
    )
      pointerTarget = null;
    if (!event.repeat) {
      if ([" ", "j", "k"].includes(key))
        swing({ " ": "clear", j: "drop", k: "smash" }[key]);
      if (["q", "r", "e"].includes(key))
        setAim({ q: 0.08, r: 0.5, e: 0.92 }[key]);
    }
    invalidate();
  }
  function coordinates(event) {
    const rect = canvas.getBoundingClientRect();
    return {
      x: (((event.clientX - rect.left) / rect.width) * W - court.x) / court.w,
      y: (((event.clientY - rect.top) / rect.height) * H - court.y) / court.h,
    };
  }
  function movePointer(event) {
    if (!pointerMode || paused) return;
    const point = coordinates(event);
    if (pointerMode === "aim") setAim(point.x);
    else
      pointerTarget = {
        x: clamp(point.x, 0.06, 0.94),
        y: clamp(point.y, 0.57, 0.95),
      };
    invalidate();
  }
  function down(event) {
    if (paused || game.getState().phase === "over") return;
    canvas.focus({ preventScroll: true });
    canvas.setPointerCapture(event.pointerId);
    pointerMode = coordinates(event).y < 0.5 ? "aim" : "move";
    movePointer(event);
  }
  const up = () => {
    pointerMode = null;
  };
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", movePointer);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", () => {
    clearInput();
  });
  canvas.addEventListener("keydown", keydown);
  canvas.addEventListener("keyup", (e) => {
    keys.delete(e.key.toLowerCase());
  });
  canvas.addEventListener("blur", clearInput);
  container.querySelectorAll("[data-shot]").forEach(
    (button) =>
      (button.onclick = () => {
        swing(button.dataset.shot);
        canvas.focus({ preventScroll: true });
      }),
  );
  container.querySelectorAll("[data-aim]").forEach(
    (button) =>
      (button.onclick = () => {
        setAim(Number(button.dataset.aim));
        canvas.focus({ preventScroll: true });
      }),
  );
  $("#pause-match").onclick = () => {
    paused = !paused;
    clearInput();
    previous = 0;
    $("#pause-match").textContent = paused ? "Resume" : "Pause";
    if (!paused) canvas.focus({ preventScroll: true });
    invalidate();
  };
  function reset() {
    game.reset();
    paused = false;
    previous = 0;
    clearInput();
    $("#pause-match").textContent = "Pause";
    setAim(0.5);
    canvas.focus({ preventScroll: true });
    invalidate();
  }
  $("#reset-match").onclick = reset;
  $("#badminton-level").onchange = (event) => {
    game.setDifficulty(event.target.value);
    reset();
    text(
      "#opponent-name",
      event.target.value === "club" ? "Club bot" : "Friendly bot",
    );
  };
  function visibility() {
    clearInput();
    if (
      (!surfaceActive || document.hidden) &&
      game.getState().phase === "rally"
    ) {
      paused = true;
      $("#pause-match").textContent = "Resume";
    }
    cancelAnimationFrame(frame);
    frame = null;
    previous = 0;
    invalidate();
  }
  document.addEventListener("visibilitychange", visibility);
  function line(x1, y1, x2, y2, width = 2, color = "#e8ecdf") {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  function ellipse(x, y, rx, ry, color) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  function avatar(p, isPlayer, state) {
    const [x, y] = pos(p),
      swinging = isPlayer && state.swingTime > 0;
    ellipse(x, y + 17, 22, 9, "#102b3060");
    ctx.fillStyle = isPlayer ? "#dfe6db" : "#c2835d";
    ctx.fillRect(x - 13, y - 1, 26, 23);
    line(x - 7, y + 21, x - 11, y + 30, 5, "#223b40");
    line(x + 7, y + 21, x + 11, y + 30, 5, "#223b40");
    ellipse(x, y - 10, 13, 13, isPlayer ? "#e8bd99" : "#b9825e");
    ctx.strokeStyle = "#e8d6ae";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(
      x + (swinging ? 36 : 25),
      y - (swinging ? 26 : 8),
      9,
      13,
      -0.4,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
    line(
      x + 11,
      y + 7,
      x + (swinging ? 31 : 22),
      y - (swinging ? 15 : 0),
      4,
      "#c49b71",
    );
    if (swinging) {
      ctx.strokeStyle = "#e5bd7d90";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x, y, 44, -1.4, -0.3);
      ctx.stroke();
    }
  }
  function draw(state, canHit) {
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#cbd4ce";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#af9b7d";
    ctx.fillRect(80, 0, 740, H);
    for (let x = 90; x < 820; x += 32) line(x, 0, x, H, 1, "#735d421c");
    ctx.fillStyle = "#365e58";
    ctx.fillRect(court.x - 24, court.y - 16, court.w + 48, court.h + 32);
    ctx.fillStyle = "#3c6861";
    ctx.fillRect(court.x, court.y + court.h * 0.5, court.w, court.h * 0.5);
    ctx.strokeStyle = "#f0eedb";
    ctx.lineWidth = 3;
    ctx.strokeRect(court.x, court.y, court.w, court.h);
    for (const factor of [0.09, 0.91])
      line(
        court.x + court.w * factor,
        court.y,
        court.x + court.w * factor,
        court.y + court.h,
      );
    for (const factor of [0.075, 0.34, 0.66, 0.925])
      line(
        court.x,
        court.y + court.h * factor,
        court.x + court.w,
        court.y + court.h * factor,
      );
    line(W / 2, court.y, W / 2, court.y + court.h * 0.34);
    line(W / 2, court.y + court.h * 0.66, W / 2, court.y + court.h);
    // The chosen placement is visible on the opponent half before the shot.
    const [ax, ay] = pos({ x: state.aim, y: 0.22 });
    ctx.strokeStyle = "#e0b781a0";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(ax, ay, 17, 0, Math.PI * 2);
    ctx.stroke();
    line(ax - 24, ay, ax + 24, ay, 1, "#e0b78170");
    line(ax, ay - 24, ax, ay + 24, 1, "#e0b78170");
    avatar(state.bot, false, state);
    for (let x = court.x - 10; x <= court.x + court.w + 10; x += 14)
      line(x, 281, x, 302, 1, "#d4ded290");
    for (let y = 281; y <= 302; y += 7)
      line(court.x - 10, y, court.x + court.w + 10, y, 1, "#d4ded290");
    line(court.x - 13, 280, court.x + court.w + 13, 280, 4, "#f1ecd5");
    const f = state.flight;
    if (f) {
      const t = Math.min(f.progress, 1),
        p = {
          x: f.from.x + (f.to.x - f.from.x) * t,
          y: f.from.y + (f.to.y - f.from.y) * t,
        };
      const [x, y] = pos(p),
        [lx, ly] = pos(f.to),
        height = Math.sin(t * Math.PI) * f.arc;
      ctx.strokeStyle =
        f.receiver === "player"
          ? canHit
            ? "#eac083"
            : "#d5e5d9"
          : "#c2cfc080";
      ctx.lineWidth = canHit ? 4 : 2;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 19, 10, 0, 0, Math.PI * 2);
      ctx.stroke();
      if (f.receiver === "player") {
        const radius = 18 + Math.max(0, 0.95 - f.progress) * 60;
        ctx.strokeStyle = canHit ? "#eac083" : "#e5e9df85";
        ctx.beginPath();
        ctx.ellipse(lx, ly, radius, radius * 0.52, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ellipse(x, y + 5, 7, 3, "#092e2b75");
      ctx.fillStyle = "#fff9dd";
      ctx.beginPath();
      ctx.moveTo(x, y - height + 5);
      ctx.lineTo(x - 6, y - height - 11);
      ctx.lineTo(x + 6, y - height - 11);
      ctx.closePath();
      ctx.fill();
      ellipse(x, y - height + 4, 3, 3, "#fff9dd");
    }
    avatar(state.player, true, state);
    if (paused || state.phase === "over") {
      ctx.fillStyle = "#173a3ac9";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#faf4df";
      ctx.textAlign = "center";
      ctx.font = "600 34px Arial";
      ctx.fillText(
        paused
          ? "Paused"
          : state.scores[0] >= 7
            ? "Good game. Your match!"
            : "Good game. One more?",
        W / 2,
        H / 2 - 8,
      );
      ctx.font = "20px Arial";
      ctx.fillText(
        paused
          ? "Choose Resume when you're ready."
          : "New match gives you a fresh court.",
        W / 2,
        H / 2 + 31,
      );
    }
  }
  function tick(now) {
    frame = null;
    if (!alive || !surfaceActive || document.hidden) return;
    const dt = Math.min((now - previous) / 1000 || 0, 0.05);
    previous = now;
    const dx =
      Number(keys.has("d") || keys.has("arrowright")) -
      Number(keys.has("a") || keys.has("arrowleft"));
    const dy =
      Number(keys.has("s") || keys.has("arrowdown")) -
      Number(keys.has("w") || keys.has("arrowup"));
    if (!paused) game.step(dt, { dx, dy, target: pointerTarget });
    flush();
    const state = game.getState(),
      f = state.flight;
    const p = f
      ? {
          x: f.from.x + (f.to.x - f.from.x) * Math.min(f.progress, 1),
          y: f.from.y + (f.to.y - f.from.y) * Math.min(f.progress, 1),
        }
      : null;
    const canHit = !!(
      f?.receiver === "player" &&
      f.progress >= 0.77 &&
      f.progress <= 1.055 &&
      Math.hypot(
        (p.x - state.player.x) / 0.145,
        (p.y - state.player.y) / 0.16,
      ) <= 1 &&
      state.cooldown === 0
    );
    const sweetSpot = canHit && f.progress >= 0.9 && f.progress <= 1.01;
    const cue = paused
      ? "Paused"
      : state.phase === "over"
        ? "Match finished"
        : !f
          ? "Your serve"
          : f.receiver === "bot"
            ? "Recover for the return"
            : sweetSpot
              ? "Swing now"
              : f.progress > 0.68
                ? canHit
                  ? "Get ready"
                  : "Move to the ring"
                : "Watch the landing ring";
    text("#contact-cue", cue);
    $(".badminton-contact").dataset.ready = String(sweetSpot && !paused);
    text(
      "#shot-feedback",
      paused ? "Take your time. Choose Resume to continue." : state.feedback,
    );
    text("#your-score", String(state.scores[0]));
    text("#bot-score", String(state.scores[1]));
    text(
      "#rally-status",
      state.phase === "rally"
        ? `Rally · ${state.rally} shots`
        : state.phase === "over"
          ? "Match finished"
          : "Your serve",
    );
    Object.assign(canvas.dataset, {
      phase: state.phase,
      score: state.scores.join(":"),
      rally: String(state.rally),
      receiver: f?.receiver || "",
      targetX: f?.to.x.toFixed(3) || "",
      targetY: f?.to.y.toFixed(3) || "",
      flightProgress: f?.progress.toFixed(3) || "",
      playerX: state.player.x.toFixed(3),
      playerY: state.player.y.toFixed(3),
      botX: state.bot.x.toFixed(3),
      quality: state.quality || "",
      difficulty: state.difficulty,
      paused: String(paused),
    });
    draw(state, sweetSpot);
    if (
      !paused &&
      (state.phase === "rally" ||
        dx ||
        dy ||
        state.moving ||
        state.swingTime > 0 ||
        state.cooldown > 0)
    )
      invalidate();
  }
  invalidate();
  const cleanup = () => {
    alive = false;
    cancelAnimationFrame(frame);
    clearInput();
    document.removeEventListener("visibilitychange", visibility);
    container.replaceChildren();
  };
  cleanup.setActive = (value) => {
    surfaceActive = value;
    visibility();
  };
  return cleanup;
}
