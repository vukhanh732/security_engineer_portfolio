export function createAudio() {
  let enabled = false,
    settings = { music: 0.2, effects: 0.25 },
    suspended = false;
  try {
    const saved = JSON.parse(localStorage.getItem("clubhouse-audio"));
    for (const key of ["music", "effects"])
      if (Number.isFinite(saved?.[key]))
        settings[key] = Math.max(0, Math.min(1, saved[key]));
  } catch {
    /* Storage is optional. */
  }
  const music = new Audio("assets/audio/sunset-walk.ogg");
  const office = new Audio("assets/audio/office.ogg");
  office.loop = true;
  office.preload = "none";
  office.volume = settings.music * 0.22;
  music.loop = true;
  music.preload = "none";
  music.volume = settings.music;
  const paths = {
    click: "click.ogg",
    close: "close.ogg",
    step: "click.ogg",
    hit: "cardSlide1.ogg",
    card: "cardPlace1.ogg",
    win: "cardPlace3.ogg",
  };
  const voices = new Set();
  let key = 0,
    activation = 0;
  const broadcast = () =>
    document.dispatchEvent(
      new CustomEvent("clubhouse-audio", { detail: api.getState() }),
    );
  function pauseEffects() {
    voices.forEach((a) => a.pause());
    voices.clear();
  }
  const api = {
    async enable() {
      const version = ++activation;
      music.volume = settings.music;
      try {
        await music.play();
        if (version !== activation) return false;
        enabled = true;
        if (document.hidden) {
          suspended = true;
          music.pause();
          broadcast();
          return true;
        }
        office.volume = settings.music * 0.22;
        office.play().catch(() => {});
        broadcast();
        return true;
      } catch {
        if (version !== activation) return false;
        enabled = false;
        broadcast();
        return false;
      }
    },
    mute() {
      activation++;
      enabled = false;
      music.pause();
      office.pause();
      pauseEffects();
      broadcast();
    },
    play(name) {
      if (
        !enabled ||
        document.hidden ||
        settings.effects === 0 ||
        voices.size >= 5
      )
        return;
      const file =
        name === "type"
          ? `typing-${(++key % 3) + 1}.mp3`
          : paths[name] || paths.click;
      const sound = new Audio("assets/audio/" + file);
      sound.volume =
        settings.effects *
        (name === "type" ? 0.32 : name === "step" ? 0.18 : 0.65);
      voices.add(sound);
      sound.onended = sound.onerror = () => voices.delete(sound);
      sound.play().catch(() => voices.delete(sound));
    },
    setVolume(kind, value) {
      if (!(kind in settings)) return;
      settings[kind] = Math.max(0, Math.min(1, value));
      music.volume = settings.music;
      office.volume = settings.music * 0.22;
      if (kind === "effects" && settings.effects === 0) pauseEffects();
      try {
        localStorage.setItem("clubhouse-audio", JSON.stringify(settings));
      } catch {
        /* Storage is optional. */
      }
      broadcast();
    },
    getState() {
      return { enabled, ...settings };
    },
  };
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      suspended = enabled;
      music.pause();
      office.pause();
      pauseEffects();
    } else if (suspended && enabled) {
      suspended = false;
      music.play().catch(() => {
        enabled = false;
        broadcast();
      });
      office.play().catch(() => {});
    }
  });
  return api;
}
