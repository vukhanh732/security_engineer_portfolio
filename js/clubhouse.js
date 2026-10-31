import { createAudio } from "./clubhouse-audio.js?v=20261031-office1";
import { createOfficeIntro } from "./office-intro.js?v=20261031-entry2";
import { createDesktop } from "./desktop.js?v=20261031-office1";
const $ = (selector) => document.querySelector(selector),
  body = document.body;
const audio = createAudio();
const introduction = createOfficeIntro({
  heading: $("#place-name"),
  controls: $("#office-entry"),
  audio,
  onEnter: () => {
    body.classList.add("office-entered");
    loadScene();
  },
});
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
  routeVersion = 0,
  restoring = false;
let desktopReturnView = null,
  pendingReturnView = null,
  returnOnClose = false,
  routedURL = null;
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
    const module = await import(`./games/${name}.js?v=20261031-office1`);
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
  onWindowClosed(_name, state) {
    if (
      !restoring &&
      returnOnClose &&
      state.visible &&
      !state.windows.some((item) => !item.minimized)
    )
      exitDesktop();
  },
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
  routedURL = null;
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
  $("#simple-view").textContent = value ? "Explore 3D desk" : "Simple view";
  scene?.setActive(!value);
  if (!value) {
    window.scrollTo(0, 0);
    if (load) loadScene();
  }
}
function exitDesktop({ updateRoute = true } = {}) {
  ++routeVersion;
  audio.play("close");
  restoring = true;
  desktop.hide({ restore: isSimple() });
  restoring = false;
  const view = desktopReturnView;
  desktopReturnView = null;
  returnOnClose = false;
  if (updateRoute)
    updateHash(
      view
        ? {
            badminton: "badminton-hall",
            lounge: "card-lounge",
            desk: "study",
            screen: "study",
          }[view.node] || (view.node === "study" ? "" : view.node)
        : "",
    );
  if (!isSimple() && view) scene?.restoreView(view);
}
function rememberRoom(directApp = false) {
  if (desktop.getState().visible) return;
  desktopReturnView = pendingReturnView || scene?.captureView?.() || null;
  pendingReturnView = null;
  returnOnClose = directApp && !isSimple();
}
function showSection(requested, { push = true } = {}) {
  introduction.complete();
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
    rememberRoom();
    ++routeVersion;
    if (push) updateHash(name);
    desktop.land();
    scene?.setActive(false);
    return;
  }
  if (
    [
      "study",
      "hobbies",
      "gym",
      "lounge",
      "corridor",
      "badminton-hall",
      "card-lounge",
    ].includes(name)
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
  rememberRoom(true);
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
  if (!desktop.getState().visible) desktop.land();
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
  if (routedURL === location.href) return;
  routedURL = location.href;
  const name = currentHash();
  if (
    desktop.getState().visible &&
    (!name ||
      [
        "study",
        "desk",
        "hobbies",
        "gym",
        "lounge",
        "corridor",
        "badminton-hall",
        "card-lounge",
      ].includes(name))
  ) {
    exitDesktop({ updateRoute: false });
    return;
  }
  if (location.hash) showSection(currentHash(), { push: false });
  else desktop.hide({ restore: isSimple(), focus: false });
}
addEventListener("popstate", route);
addEventListener("hashchange", route);
$("#simple-view").addEventListener("click", () => {
  const entering = isSimple();
  updateHash("");
  setSimple(!entering);
  if (entering) introduction.enter();
});
function openDesktop() {
  rememberRoom();
  ++routeVersion;
  if (isSimple()) stopGames();
  updateHash("computer");
  desktop.land();
  scene?.setActive(false);
}
$("#open-desktop").addEventListener("click", openDesktop);
$("#quality-toggle").addEventListener("click", () => {
  lowQuality = !lowQuality;
  scene?.setQuality(lowQuality);
  $("#quality-toggle").setAttribute("aria-pressed", String(lowQuality));
  $("#quality-toggle").textContent = lowQuality
    ? "Use full graphics"
    : "Use lower graphics";
});
async function loadScene() {
  if (scenePromise) return scenePromise;
  $("#world-status").textContent = "Loading the desk…";
  body.classList.add("scene-loading");
  scenePromise = (async () => {
    try {
      const { createScene } = await import(
        "./clubhouse-scene.js?v=20261031-office1"
      );
      scene = await createScene({
        canvas: $("#world-canvas"),
        isVisible: () => !isSimple() && !desktop.getState().visible,
        onInspect(item) {
          const panel = $("#object-inspector");
          panel.hidden = false;
          body.classList.add("inspecting-object");
          $("#object-title").textContent = item.title;
          $("#object-description").textContent = item.description;
          $("#object-turn").hidden = !["coffee", "book"].includes(item.id);
          $("#put-back").textContent = item.action;
          $("#put-back").focus({ preventScroll: true });
          const rect = $("#world-canvas").getBoundingClientRect();
          return {
            width: rect.width,
            height: rect.height,
            top:
              $(".site-header").getBoundingClientRect().bottom - rect.top + 16,
            bottom: panel.getBoundingClientRect().top - rect.top - 16,
          };
        },
        onDismiss() {
          $("#object-inspector").hidden = true;
          body.classList.remove("inspecting-object");
        },
        onInteract(name, returnView) {
          pendingReturnView = returnView || null;
          if (isSimple()) setSimple(false, { load: false });
          navigate(name);
        },
        onCameraChange(state) {
          $("#zoom-level").textContent = Math.round(state.zoom * 100) + "%";
          $("#zoom-out").disabled = state.zoom <= 0.801;
          $("#zoom-in").disabled = state.zoom >= 1.649;
          $("#mouse-look").setAttribute("aria-pressed", String(state.look));
        },
        onHover(label) {
          $("#world-hint").textContent = label || "";
          $("#world-hint").hidden = !label;
        },
        onMarkers(markers) {
          for (const marker of markers) {
            const button = $(`[data-room-activity="${marker.name}"]`);
            button.hidden = !marker.visible;
            if (marker.visible) {
              button.style.left = marker.x + "px";
              button.style.top = marker.y + "px";
            }
          }
        },
        onLocation(room, node = room) {
          introduction.complete();
          const place = ["study", "desk", "screen", "corridor"].includes(node)
            ? "study"
            : node;
          $(".world").dataset.currentRoom = place;
          $("#place-name").textContent = {
            study: "Hi, I'm Vu Luu.",
            hobbies: "Explore my hobbies",
            gym: "The gym",
            badminton: "The badminton court",
            lounge: "The card room",
          }[place];
          $("#room-description").textContent = {
            study: "Software developer in Sydney. Make yourself at home.",
            hobbies: "A court, a little lifting, and one more hand.",
            gym: "A little movement. A clearer head.",
            badminton: "Move your opponent. Find the open court.",
            lounge: "Take a seat. Stay for a hand.",
          }[place];
          document
            .querySelectorAll("[data-room]")
            .forEach((button) =>
              button.setAttribute(
                "aria-pressed",
                String(button.dataset.room === place),
              ),
            );
          const action = $("#room-action");
          action.hidden = false;
          action.dataset.destination = place === "study" ? "hobbies" : "";
          action.dataset.app =
            {
              hobbies: "badminton",
              badminton: "badminton",
              lounge: "poker",
              gym: "about",
            }[place] || "";
          action.textContent = {
            study: "Explore my hobbies →",
            hobbies: "Play badminton ↗",
            badminton: "Play a match ↗",
            lounge: "Deal a hand ↗",
            gym: "Off the clock ↗",
          }[place];
        },
        onProgress(loaded, total) {
          $("#world-status").textContent =
            `Loading the desk · ${Math.round((loaded / Math.max(1, total)) * 100)}%`;
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
  // Reading the computer never waits for artwork or a graphics context.
  if (!scene) {
    openDesktop();
    return;
  }
  if (isSimple()) setSimple(false, { load: false });
  const version = ++routeVersion;
  const world = await loadScene();
  if (!world || version !== routeVersion) return;
  audio.play("click");
  world.useComputer();
});
document.querySelectorAll("[data-room]").forEach((button) =>
  button.addEventListener("click", async () => {
    introduction.complete();
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
  if (version === routeVersion) {
    world?.resetZoom();
    world?.go("study");
  }
});
for (const [id, amount] of [
  ["#zoom-in", 0.15],
  ["#zoom-out", -0.15],
])
  $(id).addEventListener("click", () => scene?.zoomBy(amount));
$("#mouse-look").addEventListener("click", () => scene?.toggleLook());
document.querySelectorAll("[data-room-activity]").forEach((button) => {
  const name = button.dataset.roomActivity;
  button.addEventListener("click", () =>
    navigate(name === "gym" ? "about" : name),
  );
  for (const type of ["mouseenter", "focus"])
    button.addEventListener(type, () => scene?.highlightActivity(name));
  for (const type of ["mouseleave", "blur"])
    button.addEventListener(type, () => scene?.highlightActivity(null));
});
$("#put-back").addEventListener("click", () => {
  scene?.dismissInspection();
  $("#world-canvas").focus({ preventScroll: true });
});
document.querySelectorAll("[data-turn]").forEach((button) =>
  button.addEventListener("click", () => {
    const [x, y] = button.dataset.turn.split(",").map(Number);
    scene?.rotateInspection(x, y);
  }),
);
document.querySelectorAll("[data-prop]").forEach((button) =>
  button.addEventListener("click", async () => {
    ++routeVersion;
    button.closest("details").open = false;
    const version = routeVersion;
    const world = await loadScene();
    if (world && version === routeVersion) {
      const state = world.getState();
      if (state.traveling || !["study", "desk"].includes(state.node))
        await world.go("study");
      if (version === routeVersion) world.activateProp(button.dataset.prop);
    }
  }),
);
$("#room-action").addEventListener("click", async (event) => {
  const destination = event.currentTarget.dataset.destination;
  if (!destination) {
    navigate(event.currentTarget.dataset.app);
    return;
  }
  const version = ++routeVersion;
  const world = await loadScene();
  if (world && version === routeVersion) world.go(destination);
});
document.addEventListener("keydown", (event) => {
  if (
    event.key === "Escape" &&
    !desktop.getState().visible &&
    !isSimple() &&
    !event.target.closest("input,textarea,select")
  ) {
    ++routeVersion;
    if (scene?.getState().inspection) {
      scene.dismissInspection();
      $("#world-canvas").focus({ preventScroll: true });
    } else scene?.go("study");
  }
});
// Phones start with the ordinary portfolio. CSS reserves this layout before
// modules arrive; reading a project does not load the graphics engine.
body.classList.add("enhanced");
if (matchMedia("(max-width: 767px)").matches) setSimple(true, { load: false });
const world = $(".world");
const headerSize = new ResizeObserver(() => {
  world.style.setProperty(
    "--room-header-bottom",
    $(".site-header").getBoundingClientRect().bottom + "px",
  );
});
headerSize.observe($(".site-header"));
world.addEventListener(
  "pointerdown",
  () => {
    if (!isSimple()) loadScene();
  },
  { once: true, passive: true },
);
function prepareOnMovement(event) {
  // Browsers also emit a stationary pointer event as the page appears.
  // Wait for actual movement so opening a reading shortcut stays lightweight.
  if (event.isTrusted && !event.movementX && !event.movementY) return;
  if (!isSimple()) {
    world.removeEventListener("pointermove", prepareOnMovement);
    loadScene();
  }
}
world.addEventListener("pointermove", prepareOnMovement, { passive: true });
$("#world-canvas").addEventListener(
  "focus",
  () => {
    if (!isSimple()) loadScene();
  },
  { once: true },
);
if (location.hash) route();
