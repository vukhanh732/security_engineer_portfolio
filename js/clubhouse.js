import { createAudio } from "./clubhouse-audio.js";

const $ = (selector) => document.querySelector(selector);
const body = document.body,
  panel = $("#content-panel"),
  panelContent = $("#panel-content");
const audio = createAudio();
let activeSection = null,
  placeholder = null,
  trigger = null,
  cleanupGame = null,
  scene = null,
  scenePromise = null,
  routeVersion = 0,
  lowQuality = false;
const aliases = {
  skills: "about",
  education: "experience",
  "blog-preview": "writing",
  extracurricular: "about",
};
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
body.classList.add("enhanced");
if (reduceMotion) body.classList.add("reduced-motion");
const isSimple = () => body.classList.contains("simple-view");

function updateAudio() {
  const state = audio.getState();
  $("#enable-audio").textContent = state.enabled
    ? "Mute sound"
    : "Enable sound";
  $("#enable-audio").setAttribute("aria-pressed", String(state.enabled));
  $("#audio-master").textContent = state.enabled
    ? "Mute sound"
    : "Enable sound";
  for (const kind of ["music", "effects"]) {
    $(`#${kind}-volume`).value = Math.round(state[kind] * 100);
    $(`#${kind}-output`).textContent = Math.round(state[kind] * 100) + "%";
  }
}
async function toggleAudio() {
  if (audio.getState().enabled) audio.mute();
  else if (!(await audio.enable()))
    $("#audio-status").textContent =
      "The soundtrack could not start. You can try Enable sound again.";
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

function restoreSection() {
  routeVersion++;
  if (cleanupGame) {
    cleanupGame();
    cleanupGame = null;
  }
  if (activeSection && placeholder) {
    placeholder.replaceWith(activeSection);
    activeSection = placeholder = null;
  }
  panel.classList.remove("game-panel");
}
function closePanel({ clearHash = true, focus = true } = {}) {
  if (!panel.open) return;
  panel.close();
  restoreSection();
  scene?.setActive(!isSimple());
  if (clearHash && location.hash)
    history.pushState(null, "", location.pathname + location.search);
  if (focus)
    (trigger?.isConnected ? trigger : $("#explore")).focus({
      preventScroll: true,
    });
}
async function mountGame(name, section) {
  if (cleanupGame) {
    cleanupGame();
    cleanupGame = null;
  }
  const version = ++routeVersion;
  if (name === "badminton" || name === "poker") {
    const mount = section.querySelector(`#${name}-mount`);
    mount.innerHTML =
      '<p class="game-tip" role="status">Getting the game ready...</p>';
    try {
      const module = await import(`./games/${name}.js`);
      if (version !== routeVersion) return;
      cleanupGame = (
        name === "badminton" ? module.mountBadminton : module.mountPoker
      )(mount, audio);
    } catch {
      if (version === routeVersion)
        mount.innerHTML =
          "<p>The game could not load. Please reload to try again. Your projects and résumé are still available.</p>";
    }
  }
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
  const section = document.getElementById(name);
  if (!section?.classList.contains("portfolio-section")) return;
  if (push && location.hash !== "#" + requested)
    history.pushState(null, "", "#" + requested);
  if (isSimple()) {
    if (panel.open) closePanel({ clearHash: false, focus: false });
    if (cleanupGame) {
      cleanupGame();
      cleanupGame = null;
    }
    (requested !== name
      ? document.getElementById(requested) || section
      : section
    ).scrollIntoView({ behavior: "instant", block: "start" });
    mountGame(name, section);
    return;
  }
  const previousTrigger = panel.open ? trigger : document.activeElement;
  restoreSection();
  trigger = previousTrigger;
  placeholder = document.createComment("portfolio section: " + name);
  section.before(placeholder);
  activeSection = section;
  panelContent.replaceChildren(section);
  panel.classList.toggle(
    "game-panel",
    name === "badminton" || name === "poker",
  );
  if (!panel.open) panel.showModal();
  const heading = section.querySelector("h2");
  if (heading) {
    heading.tabIndex = -1;
    heading.focus({ preventScroll: true });
  }
  panelContent.scrollTop = 0;
  scene?.setActive(false);
  mountGame(name, section);
  if (requested !== name)
    section
      .querySelector("#" + requested)
      ?.scrollIntoView({ behavior: "instant", block: "start" });
}
function navigate(name) {
  audio.play("click");
  showSection(name);
}
document.addEventListener("click", (event) => {
  const link = event.target.closest('a[href^="#"]');
  if (!link || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
    return;
  const hash = link.getAttribute("href").slice(1);
  if (hash) {
    event.preventDefault();
    navigate(hash);
  }
});
$("#close-panel").addEventListener("click", () => {
  audio.play("close");
  closePanel();
});
panel.addEventListener("cancel", (event) => {
  event.preventDefault();
  closePanel();
});
panel.addEventListener("click", (event) => {
  const r = panel.getBoundingClientRect();
  if (
    event.target === panel &&
    (event.clientX < r.left ||
      event.clientX > r.right ||
      event.clientY < r.top ||
      event.clientY > r.bottom)
  )
    closePanel();
});
window.addEventListener("popstate", () => {
  const name = location.hash.slice(1);
  if (name) showSection(name, { push: false });
  else closePanel({ clearHash: false });
});
window.addEventListener("hashchange", () => {
  if (location.hash) showSection(location.hash.slice(1), { push: false });
  else closePanel({ clearHash: false });
});

function setSimple(value) {
  closePanel({ clearHash: false, focus: false });
  if (cleanupGame) {
    cleanupGame();
    cleanupGame = null;
  }
  body.classList.toggle("simple-view", value);
  scene?.setActive(!value);
  $("#simple-view").setAttribute("aria-pressed", String(value));
  $("#simple-view").textContent = value
    ? "Explore 3D clubhouse"
    : "Simple view";
  if (!value) {
    window.scrollTo(0, 0);
    loadScene();
  }
}
$("#simple-view").addEventListener("click", () => {
  if (location.hash)
    history.replaceState(null, "", location.pathname + location.search);
  setSimple(!isSimple());
});
$("#quality-toggle").addEventListener("click", (event) => {
  lowQuality = !lowQuality;
  scene?.setQuality(lowQuality);
  event.target.setAttribute("aria-pressed", String(lowQuality));
  event.target.textContent = lowQuality
    ? "Use full graphics"
    : "Use lower graphics";
});
async function loadScene() {
  if (scenePromise) return scenePromise;
  scenePromise = (async () => {
    try {
      const { createScene } = await import("./clubhouse-scene.js");
      scene = await createScene({
        canvas: $("#world-canvas"),
        labels: $("#landmarks"),
        onOpen: navigate,
        audio,
        onReady: (ready, failedModels = 0) => {
          $(".world").classList.toggle("is-ready", ready);
          if (!ready) {
            setSimple(true);
            $("#world-status").textContent =
              "The room is resting. All the work is available in Simple view.";
          }
          if (failedModels)
            console.info(
              "Some room props were unavailable; all portfolio content remains accessible.",
            );
        },
      });
      scene.setActive(!isSimple() && !panel.open);
      scene.setQuality(lowQuality);
      return scene;
    } catch (error) {
      console.info(
        "Clubhouse 3D unavailable; using the HTML portfolio.",
        error.message,
      );
      setSimple(true);
      $("#world-status").textContent =
        "All the work is available in Simple view.";
      return null;
    }
  })();
  return scenePromise;
}
$("#explore").addEventListener("click", async () => {
  const world = await loadScene();
  if (!world) return;
  world.explore();
  $("#explore").textContent = "Exploring";
  $("#movement-hint").textContent =
    "WASD / arrows to move · E to interact · drag to orbit";
});
$("#home-camera").addEventListener("click", () => {
  scene?.home();
  $("#explore").textContent = "Explore the room";
});
$("#follow-camera").addEventListener("click", () => {
  if (!scene) return;
  const following = scene.toggleFollow();
  $("#follow-camera").setAttribute("aria-pressed", String(following));
});
// Mobile opens on the actual projects; exploring remains one explicit tap away.
if (matchMedia("(max-width: 767px)").matches) setSimple(true);
else if ("requestIdleCallback" in window)
  requestIdleCallback(loadScene, { timeout: 1800 });
else setTimeout(loadScene, 1100);
if (location.hash) showSection(location.hash.slice(1), { push: false });
