export function mountBadminton(container, audio) {
  container.innerHTML = `<div class="game-intro"><p>First to 7. Move into position, then time your swing as the shuttle comes down.</p><span>Move: WASD / arrows · Swing: Space</span></div><div class="badminton-score" aria-live="polite"><span>You <strong id="your-score">0</strong></span><span id="rally-status">Ready for a rally?</span><span><strong id="bot-score">0</strong> Clubhouse bot</span></div><canvas class="badminton-canvas" width="900" height="600" tabindex="0" aria-label="Playable badminton court. Move with arrow keys or pointer. Space or the Swing button serves and returns the shuttle."></canvas><div class="game-actions"><button class="button button-primary" id="swing">Serve / swing</button><button class="button" id="pause-match">Pause</button><button class="button" id="reset-match">New match</button></div><p class="game-tip">On touch: drag on your half to move, then tap Swing. Aim your return by moving left or right as you hit.</p>`;
  const canvas = container.querySelector("canvas"),
    ctx = canvas.getContext("2d");
  const status = container.querySelector("#rally-status"),
    scoreNodes = [
      container.querySelector("#your-score"),
      container.querySelector("#bot-score"),
    ];
  const keys = new Set(),
    player = { x: 0.5, y: 0.87 },
    bot = { x: 0.5, y: 0.13 };
  let scores = [0, 0],
    phase = "ready",
    flight = null,
    time = 0,
    swingUntil = 0,
    lastSwing = -1,
    frame,
    previous = 0,
    paused = false,
    alive = true,
    pointer = false,
    moveX = 0,
    rally = 0;
  const W = 900,
    H = 600,
    court = { x: 150, y: 30, w: 600, h: 530 };
  const pos = (p) => [court.x + p.x * court.w, court.y + p.y * court.h];
  const clamp = (n, low, high) => Math.max(low, Math.min(high, n));
  function reset() {
    scores = [0, 0];
    scoreNodes.forEach((n) => (n.textContent = "0"));
    phase = "ready";
    flight = null;
    rally = 0;
    paused = false;
    player.x = bot.x = 0.5;
    player.y = 0.87;
    status.textContent = "Your serve. Space or Swing to start.";
    container.querySelector("#pause-match").textContent = "Pause";
    canvas.dataset.phase = phase;
  }
  function launch(from, to, receiver) {
    flight = {
      from: { ...from },
      to,
      receiver,
      progress: 0,
      duration: receiver === "player" ? 1.18 : 1.05,
    };
    phase = "rally";
    rally++;
    canvas.dataset.phase = phase;
    canvas.dataset.rally = String(rally);
    canvas.dataset.receiver = receiver;
    canvas.dataset.targetX = to.x.toFixed(3);
    canvas.dataset.targetY = to.y.toFixed(3);
  }
  function serve() {
    rally = 0;
    launch(player, { x: 0.25 + Math.random() * 0.5, y: 0.13 }, "bot");
    status.textContent = "Rally on. Watch the shuttle.";
    audio.play("hit");
  }
  function swing() {
    if (paused || phase === "over") return;
    if (phase === "ready") {
      serve();
      return;
    }
    if (time - lastSwing > 0.22) {
      swingUntil = time + 0.34;
      lastSwing = time;
      audio.play("hit");
    }
  }
  function point(winner) {
    scores[winner]++;
    scoreNodes[winner].textContent = scores[winner];
    flight = null;
    canvas.dataset.score = scores.join(":");
    if (scores[winner] >= 7) {
      phase = "over";
      status.textContent =
        winner === 0
          ? "You win the match. Good game!"
          : "The bot wins. Rematch?";
      audio.play("win");
    } else {
      phase = "ready";
      status.textContent =
        winner === 0
          ? "Your point! Serve when ready."
          : "Point to the bot. Your serve.";
    }
    canvas.dataset.phase = phase;
  }
  function keydown(event) {
    if (document.activeElement !== canvas) return;
    if (
      [
        "ArrowLeft",
        "ArrowRight",
        "ArrowUp",
        "ArrowDown",
        " ",
        "w",
        "a",
        "s",
        "d",
        "W",
        "A",
        "S",
        "D",
      ].includes(event.key)
    )
      event.preventDefault();
    keys.add(event.key.toLowerCase());
    if (event.key === " " && !event.repeat) swing();
  }
  function movePointer(event) {
    if (!pointer) return;
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * W,
      y = ((event.clientY - rect.top) / rect.height) * H;
    const oldX = player.x;
    player.x = clamp((x - court.x) / court.w, 0.04, 0.96);
    player.y = clamp((y - court.y) / court.h, 0.64, 0.94);
    moveX = clamp((player.x - oldX) * 12, -0.24, 0.24);
  }
  const down = (event) => {
    pointer = true;
    canvas.setPointerCapture(event.pointerId);
    canvas.focus({ preventScroll: true });
    movePointer(event);
  };
  const up = () => {
    pointer = false;
  };
  const blur = () => keys.clear();
  const visibility = () => {
    if (document.hidden && phase === "rally") {
      paused = true;
      keys.clear();
      container.querySelector("#pause-match").textContent = "Resume";
      status.textContent = "Paused. Resume when you are ready.";
    }
  };
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", movePointer);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("keydown", keydown);
  canvas.addEventListener("keyup", (event) =>
    keys.delete(event.key.toLowerCase()),
  );
  canvas.addEventListener("blur", blur);
  document.addEventListener("visibilitychange", visibility);
  container.querySelector("#swing").onclick = () => {
    swing();
    canvas.focus({ preventScroll: true });
  };
  container.querySelector("#pause-match").onclick = (event) => {
    paused = !paused;
    event.target.textContent = paused ? "Resume" : "Pause";
    status.textContent = paused
      ? "Paused. Take your time."
      : phase === "ready"
        ? "Your serve."
        : "Rally on.";
    if (!paused) canvas.focus({ preventScroll: true });
  };
  container.querySelector("#reset-match").onclick = () => {
    reset();
    canvas.focus({ preventScroll: true });
  };
  function update(dt) {
    time += dt;
    const dx =
      Number(keys.has("d") || keys.has("arrowright")) -
      Number(keys.has("a") || keys.has("arrowleft"));
    const dy =
      Number(keys.has("s") || keys.has("arrowdown")) -
      Number(keys.has("w") || keys.has("arrowup"));
    player.x = clamp(player.x + dx * dt * 0.68, 0.04, 0.96);
    player.y = clamp(player.y + dy * dt * 0.52, 0.64, 0.94);
    if (dx) moveX = dx * 0.22;
    else moveX *= 0.97;
    if (!flight) return;
    flight.progress += dt / flight.duration;
    const f = flight,
      t = Math.min(f.progress, 1),
      x = f.from.x + (f.to.x - f.from.x) * t,
      y = f.from.y + (f.to.y - f.from.y) * t;
    const targetX = f.receiver === "bot" ? f.to.x : 0.5;
    bot.x += clamp(targetX - bot.x, -dt * 0.4, dt * 0.4);
    if (
      f.receiver === "player" &&
      t > 0.72 &&
      time < swingUntil &&
      Math.abs(x - player.x) < 0.115 &&
      Math.abs(y - player.y) < 0.15
    ) {
      launch(
        { x, y },
        {
          x: clamp(
            0.5 + (player.x - 0.5) * 0.5 + moveX + (Math.random() - 0.5) * 0.18,
            0.05,
            0.95,
          ),
          y: 0.13,
        },
        "bot",
      );
      swingUntil = 0;
      status.textContent = `Nice return. ${rally} shots.`;
      audio.play("hit");
    } else if (
      f.receiver === "bot" &&
      t > 0.94 &&
      Math.abs(x - bot.x) < 0.1 &&
      Math.random() > 0.025
    ) {
      launch(
        { x, y },
        {
          x: clamp(player.x + (Math.random() - 0.5) * 0.62, 0.09, 0.91),
          y: 0.87,
        },
        "player",
      );
      audio.play("hit");
    } else if (f.progress >= 1.12) point(f.receiver === "player" ? 1 : 0);
  }
  function line(x1, y1, x2, y2, width = 2, color = "#e4ede0") {
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
  }
  function avatar(p, isPlayer) {
    const [x, y] = pos(p);
    ctx.fillStyle = "#102e2950";
    ctx.beginPath();
    ctx.ellipse(x, y + 12, 20, 8, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isPlayer ? "#efc09e" : "#e8d9bb";
    ctx.beginPath();
    ctx.arc(x, y - 5, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = isPlayer ? "#e2e9d9" : "#df7f5d";
    ctx.fillRect(x - 13, y + 5, 26, 15);
    ctx.strokeStyle = "#e0d7bb";
    ctx.lineWidth = 3;
    const swinging = isPlayer && time < swingUntil;
    ctx.beginPath();
    ctx.ellipse(
      x + (swinging ? 32 : 23),
      y - (swinging ? 17 : 2),
      8,
      12,
      -0.4,
      0,
      Math.PI * 2,
    );
    ctx.stroke();
    line(x + 12, y + 8, x + 24, y - 1, 3, "#c9a97e");
  }
  function draw() {
    ctx.fillStyle = "#e3e5db";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#244e43";
    ctx.fillRect(court.x - 25, court.y - 15, court.w + 50, court.h + 30);
    ctx.strokeStyle = "#dce6d6";
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
    for (let x = court.x - 10; x <= court.x + court.w + 10; x += 14)
      line(x, 281, x, 302, 1, "#a6baa680");
    for (let y = 281; y <= 302; y += 7)
      line(court.x - 10, y, court.x + court.w + 10, y, 1, "#a6baa680");
    line(court.x - 13, 280, court.x + court.w + 13, 280, 4, "#f0f0dc");
    avatar(bot, false);
    avatar(player, true);
    if (flight) {
      const t = Math.min(flight.progress, 1),
        p = {
          x: flight.from.x + (flight.to.x - flight.from.x) * t,
          y: flight.from.y + (flight.to.y - flight.from.y) * t,
        };
      const [x, y] = pos(p);
      const h = Math.sin(t * Math.PI) * 66;
      const [lx, ly] = pos(flight.to);
      ctx.strokeStyle = "#f0e6bc";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(lx, ly, 15, 7, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = "#092e2b65";
      ctx.beginPath();
      ctx.ellipse(x, y + 5, 6, 3, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#faf7e8";
      ctx.beginPath();
      ctx.moveTo(x, y - h + 5);
      ctx.lineTo(x - 5, y - h - 9);
      ctx.lineTo(x + 5, y - h - 9);
      ctx.closePath();
      ctx.fill();
      ctx.beginPath();
      ctx.arc(x, y - h + 4, 3, 0, Math.PI * 2);
      ctx.fill();
    }
    if (paused) {
      ctx.fillStyle = "#18382bcc";
      ctx.fillRect(0, 0, W, H);
      ctx.fillStyle = "#fff";
      ctx.font = "32px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("Paused", W / 2, H / 2);
    }
  }
  function tick(now) {
    if (!alive) return;
    const dt = Math.min((now - previous) / 1000 || 0, 0.035);
    previous = now;
    if (!paused && !document.hidden) update(dt);
    draw();
    frame = requestAnimationFrame(tick);
  }
  reset();
  frame = requestAnimationFrame(tick);
  return () => {
    alive = false;
    cancelAnimationFrame(frame);
    keys.clear();
    document.removeEventListener("visibilitychange", visibility);
    container.replaceChildren();
  };
}
