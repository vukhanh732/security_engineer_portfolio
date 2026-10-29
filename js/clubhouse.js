import { createAudio } from "./clubhouse-audio.js";
import { createDesktop } from "./desktop.js?v=20261029-study1";
const $ = (selector) => document.querySelector(selector),
  body = document.body;
const audio = createAudio(),
  reduced = matchMedia("(prefers-reduced-motion: reduce)");
const aliases = {
  skills: "about",
  education: "experience",
  "blog-preview": "writing",
  extracurricular: "about",
  notebook: "writing",
  games: "play",
};
const fallbacks = new Map(
  ["badminton", "poker"].map((name) => [name, $(`#${name}-mount`).innerHTML]),
);
const games = new Map();
let scene = null,
  scenePromise = null,
  lowQuality = false,
  still = reduced.matches,
  routeVersion = 0,
  restoring = false;
const isSimple = () => body.classList.contains("simple-view");
function currentHash() {
  const fragment = location.hash.slice(1);
  try {
    return decodeURIComponent(fragment);
  } catch {
    return fragment;
  }
}
function stopGame(name) {
  const entry = games.get(name);
  if (!entry) return;
  entry.cleanup?.();
  games.delete(name);
  $(`#${name}-mount`).innerHTML = fallbacks.get(name);
}
function stopGames() {
  for (const name of [...games.keys()]) stopGame(name);
}
async function mountGame(name, section) {
  if (!fallbacks.has(name) || games.has(name)) return;
  const mount = section.querySelector(`#${name}-mount`),
    entry = { active: true, cleanup: null };
  games.set(name, entry);
  mount.innerHTML =
    '<p class="game-tip" role="status">Getting the game ready...</p>';
  try {
    const module = await import(`./games/${name}.js?v=20261029-study1`);
    if (games.get(name) !== entry) return;
    entry.cleanup = (
      name === "badminton" ? module.mountBadminton : module.mountPoker
    )(mount, audio);
    entry.cleanup.setActive?.(entry.active);
  } catch (error) {
    if (games.get(name) === entry) {
      games.delete(name);
      mount.innerHTML =
        "<p>The game could not load. Reload to try again. All projects and your résumé are still available.</p>";
    }
  }
}
const desktop = createDesktop({
  onOpen: mountGame,
  onClose: stopGame,
  onVisibility(name, active) {
    const entry = games.get(name);
    if (entry) {
      entry.active = active;
      entry.cleanup?.setActive?.(active);
    }
  },
  onChange(state) {
    scene?.setActive(!state.visible && !isSimple());
    if (state.visible && !restoring) {
      const current = currentHash();
      if ((aliases[current] || current) !== state.activeApp)
        updateHash(state.activeApp || "computer", true);
    }
  },
  onExit() {
    exitDesktop();
  },
});
function updateAudio() {
  const state = audio.getState();
  for (const id of ["#enable-audio", "#audio-master"]) {
    $(id).textContent = state.enabled ? "Mute sound" : "Enable sound";
    $(id).setAttribute("aria-pressed", String(state.enabled));
  }
  for (const kind of ["music", "effects"]) {
    $(`#${kind}-volume`).value = Math.round(state[kind] * 100);
    $(`#${kind}-output`).textContent = Math.round(state[kind] * 100) + "%";
  }
}
async function toggleAudio() {
  if (audio.getState().enabled) audio.mute();
  else if (!(await audio.enable()))
    $("#audio-status").textContent =
      "The soundtrack could not start. Try Enable sound again.";
  updateAudio();
}
document.addEventListener("clubhouse-audio", updateAudio);
$("#enable-audio").addEventListener("click", toggleAudio);
$("#audio-master").addEventListener("click", toggleAudio);
for (const kind of ["music", "effects"])
  $(`#${kind}-volume`).addEventListener("input", (event) =>
    audio.setVolume(kind, Number(event.target.value) / 100),
  );
updateAudio();
function updateHash(name, replace = false) {
  const hash = name ? "#" + name : "";
  if (location.hash === hash) return;
  history[replace ? "replaceState" : "pushState"](
    null,
    "",
    location.pathname + location.search + hash,
  );
}
function setSimple(value, { load = true } = {}) {
  routeVersion++;
  restoring = true;
  desktop.hide({ restore: true, focus: false });
  restoring = false;
  stopGames();
  body.classList.toggle("simple-view", value);
  $("#simple-view").setAttribute("aria-pressed", String(value));
  $("#simple-view").textContent = value ? "Explore 3D study" : "Simple view";
  scene?.setActive(!value);
  if (!value) {
    window.scrollTo(0, 0);
    if (load) loadScene();
  }
}
function exitDesktop() {
  ++routeVersion;
  audio.play("close");
  restoring = true;
  desktop.hide({ restore: isSimple() });
  restoring = false;
  updateHash("");
  if (!isSimple() && scene?.getState().node === "screen") scene.go("desk");
}
function showSection(requested, { push = true } = {}) {
  const name = aliases[requested] || requested;
  if (name === "main-content") {
    setSimple(true);
    $("#main-content").focus();
    return;
  }
  if (name === "braintrain") {
    location.href = "braintrain.html";
    return;
  }
  if (name === "computer") {
    ++routeVersion;
    if (push) updateHash(name);
    desktop.show();
    scene?.setActive(false);
    return;
  }
  if (
    ["study", "gym", "corridor", "badminton-hall", "card-lounge"].includes(name)
  ) {
    if (push) updateHash(name);
    setSimple(false);
    const version = routeVersion;
    loadScene().then((world) => {
      if (world && version === routeVersion)
        world.go(
          { "badminton-hall": "badminton", "card-lounge": "lounge" }[name] ||
            name,
        );
    });
    return;
  }
  const section = document.getElementById(name);
  if (!section?.classList.contains("portfolio-section")) return;
  ++routeVersion;
  if (push) updateHash(requested);
  if (isSimple() && !desktop.getState().visible) {
    desktop.hide({ restore: true, focus: false });
    for (const key of games.keys()) if (key !== name) stopGame(key);
    (requested !== name
      ? document.getElementById(requested) || section
      : section
    ).scrollIntoView({ behavior: "instant", block: "start" });
    mountGame(name, section);
    return;
  }
  desktop.open(name);
  scene?.setActive(false);
  if (requested !== name) {
    const target = document.getElementById(requested);
    if (target && target !== section)
      target.scrollIntoView({ behavior: "instant", block: "start" });
  }
}
function navigate(name) {
  audio.play("click");
  showSection(name);
}
document.addEventListener("portfolio:navigate", (event) =>
  navigate(event.detail),
);
document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (
    !link ||
    event.defaultPrevented ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey
  )
    return;
  const hash = link.getAttribute("href").slice(1);
  if (hash) {
    event.preventDefault();
    navigate(hash);
  }
});
function route() {
  if (location.hash) showSection(currentHash(), { push: false });
  else desktop.hide({ restore: isSimple(), focus: false });
}
addEventListener("popstate", route);
addEventListener("hashchange", route);
$("#simple-view").addEventListener("click", () => {
  updateHash("");
  setSimple(!isSimple());
});
$("#open-desktop").addEventListener("click", () => {
  ++routeVersion;
  if (isSimple()) stopGames();
  updateHash("computer");
  desktop.show();
  if (!desktop.getState().windows.length) desktop.open("projects");
  scene?.setActive(false);
});
$("#quality-toggle").addEventListener("click", () => {
  lowQuality = !lowQuality;
  scene?.setQuality(lowQuality);
  $("#quality-toggle").setAttribute("aria-pressed", String(lowQuality));
  $("#quality-toggle").textContent = lowQuality
    ? "Use full graphics"
    : "Use lower graphics";
});
$("#still-morning").setAttribute("aria-pressed", String(still));
$("#still-morning").addEventListener("click", () => {
  still = !still;
  scene?.setStill(still);
  $("#still-morning").setAttribute("aria-pressed", String(still));
});
reduced.addEventListener("change", () => {
  if (reduced.matches) {
    still = true;
    $("#still-morning").setAttribute("aria-pressed", "true");
    scene?.setStill(true);
  }
});
async function loadScene() {
  if (scenePromise) return scenePromise;
  $("#world-status").textContent = "Opening the study…";
  body.classList.add("scene-loading");
  scenePromise = (async () => {
    try {
      const { createScene } = await import(
        "./clubhouse-scene.js?v=20261029-study1"
      );
      scene = await createScene({
        canvas: $("#world-canvas"),
        isVisible: () => !isSimple() && !desktop.getState().visible,
        onInteract(name) {
          if (isSimple()) setSimple(false, { load: false });
          navigate(name);
        },
        onLocation(room) {
          const labels = {
            study: "The study",
            corridor: "The corridor",
            gym: "The gym",
            badminton: "The badminton hall",
            lounge: "The card lounge",
          };
          $("#place-name").textContent = labels[room];
          $("#room-description").textContent = {
            study: "A quiet place to build things.",
            corridor: "A change of pace, just through the next door.",
            gym: "A little movement. A clearer head.",
            badminton: "A full court. Fancy a rally?",
            lounge: "Take a seat. Stay for a hand.",
          }[room];
          document
            .querySelectorAll("[data-room]")
            .forEach((button) =>
              button.setAttribute(
                "aria-pressed",
                String(button.dataset.room === room),
              ),
            );
          $("#room-action").hidden = !["badminton", "lounge", "gym"].includes(
            room,
          );
          $("#room-action").dataset.app =
            { badminton: "badminton", lounge: "poker", gym: "about" }[room] ||
            "about";
          $("#room-action").textContent =
            {
              badminton: "Play a match ↗",
              lounge: "Deal a hand ↗",
              gym: "Off the clock ↗",
            }[room] || "";
        },
        onProgress(loaded, total) {
          $("#world-status").textContent =
            `Opening the study · ${Math.round((loaded / Math.max(1, total)) * 100)}%`;
        },
        onReady(ready) {
          body.classList.remove("scene-loading");
          $(".world").classList.toggle("is-ready", ready);
          if (!ready) {
            setSimple(true);
            $("#scene-message").hidden = false;
          }
        },
      });
      scene.setQuality(lowQuality);
      scene.setStill(still);
      scene.setActive(!isSimple() && !desktop.getState().visible);
      $("#explore").textContent = "Use computer ↗";
      return scene;
    } catch (error) {
      console.info(
        "3D unavailable. The ordinary portfolio remains available.",
        error.message,
      );
      body.classList.remove("scene-loading");
      $("#scene-message").hidden = false;
      setSimple(true);
      return null;
    }
  })();
  return scenePromise;
}
$("#explore").addEventListener("click", async () => {
  if (isSimple()) setSimple(false, { load: false });
  const version = routeVersion;
  const world = await loadScene();
  if (!world || version !== routeVersion) return;
  audio.play("click");
  world.useComputer();
});
document.querySelectorAll("[data-room]").forEach((button) =>
  button.addEventListener("click", async () => {
    ++routeVersion;
    const version = routeVersion;
    const world = await loadScene();
    if (!world || version !== routeVersion) return;
    audio.play("click");
    world.go(button.dataset.room);
  }),
);
$("#home-camera").addEventListener("click", async () => {
  ++routeVersion;
  const version = routeVersion;
  const world = await loadScene();
  if (version === routeVersion) world?.go("study");
});
$("#room-action").addEventListener("click", (event) =>
  navigate(event.currentTarget.dataset.app),
);
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    !desktop.getState().visible &&
    !isSimple() &&
    !event.target.closest("input,textarea,select")
  ) {
    ++routeVersion;
    scene?.go("study");
  }
});
// Phones start with the ordinary portfolio. CSS reserves this layout before
// modules arrive; reading a project does not load the graphics engine.
body.classList.add("enhanced");
if (matchMedia("(max-width: 767px)").matches) setSimple(true, { load: false });
const world = $(".world");
world.addEventListener(
  "pointerdown",
  () => {
    if (!isSimple()) loadScene();
  },
  { once: true, passive: true },
);
world.addEventListener(
  "pointermove",
  () => {
    if (!isSimple()) loadScene();
  },
  { once: true, passive: true },
);
$("#world-canvas").addEventListener(
  "focus",
  () => {
    if (!isSimple()) loadScene();
  },
  { once: true },
);
if (location.hash) route();
