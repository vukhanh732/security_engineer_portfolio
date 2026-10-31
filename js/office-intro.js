// Short and optional: every portfolio shortcut works before this is started.
export function createOfficeIntro({ heading, controls, audio, onEnter }) {
  const text = "Hi, I'm Vu Luu.";
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let timer = null,
    started = false,
    running = false,
    index = 0,
    generation = 0;
  function complete() {
    generation++;
    clearTimeout(timer);
    timer = null;
    running = false;
    if (heading.dataset.introducing === "true") {
      heading.textContent = text;
      heading.removeAttribute("aria-label");
      delete heading.dataset.introducing;
    }
  }
  function tick() {
    if (!running || document.hidden) return;
    index++;
    heading.querySelector("span").textContent = text.slice(0, index);
    if (text[index - 1] !== " ") audio.play("type");
    if (index >= text.length) {
      complete();
      return;
    }
    timer = setTimeout(
      tick,
      text[index - 1] === "," ? 190 : 65 + (index % 3) * 18,
    );
  }
  async function enter(sound) {
    if (started) return;
    const version = ++generation;
    started = true;
    controls.hidden = true;
    // Call play synchronously from the click to retain browser audio activation.
    const activation = sound
      ? audio.enable()
      : (audio.mute(), Promise.resolve(false));
    onEnter();
    if (sound) await activation;
    if (version !== generation || document.hidden || reduced.matches) return;
    running = true;
    heading.dataset.introducing = "true";
    heading.setAttribute("aria-label", text);
    heading.innerHTML = '<span aria-hidden="true"></span>';
    tick();
  }
  controls
    .querySelector("[data-enter=sound]")
    .addEventListener("click", () => enter(true));
  controls
    .querySelector("[data-enter=quiet]")
    .addEventListener("click", () => enter(false));
  const hidden = () => {
    if (document.hidden) complete();
  };
  const motion = () => {
    if (reduced.matches) complete();
  };
  document.addEventListener("visibilitychange", hidden);
  reduced.addEventListener("change", motion);
  return {
    complete,
    get started() {
      return started;
    },
    dispose() {
      complete();
      document.removeEventListener("visibilitychange", hidden);
      reduced.removeEventListener("change", motion);
    },
  };
}
