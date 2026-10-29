const APPS = {
  projects: { title: "My Projects", icon: "folder" },
  experience: { title: "Experience.txt", icon: "document" },
  about: { title: "About me.txt", icon: "document" },
  writing: { title: "Notebook", icon: "folder" },
  play: { title: "Games", icon: "game" },
  badminton: { title: "Badminton", icon: "game" },
  poker: { title: "Five-card draw", icon: "game" },
  contact: { title: "Contact", icon: "document" },
  sound: { title: "Sound", icon: "document" },
  help: { title: "Make yourself at home", icon: "document" },
  credits: { title: "Credits", icon: "document" },
};

// Windows contain the original portfolio nodes, including the real form. No
// duplicate content, IDs or form controls are created for the enhanced view.
export function createDesktop({
  onOpen,
  onClose,
  onChange,
  onExit,
  onVisibility,
}) {
  const desktop = document.querySelector("#desktop"),
    area = document.querySelector("#desktop-windows"),
    tasks = document.querySelector("#task-list");
  const menu = document.querySelector("#start-menu"),
    start = document.querySelector("#start-button");
  const windows = new Map();
  let z = 10,
    active = null,
    returnFocus = null,
    drag = null;
  function visible() {
    return desktop.open;
  }
  function state() {
    return {
      visible: visible(),
      activeApp: active,
      windows: [...windows].map(([name, item]) => ({
        name,
        minimized: item.minimized,
        maximized: item.element.classList.contains("maximized"),
      })),
    };
  }
  function changed() {
    onChange?.(state());
  }
  function hideMenu() {
    menu.hidden = true;
    start.setAttribute("aria-expanded", "false");
  }
  function focusWindow(name, focus = true) {
    const item = windows.get(name);
    if (!item) return;
    const wasMinimized = item.minimized;
    item.minimized = false;
    item.element.hidden = false;
    active = name;
    item.element.style.zIndex = String(++z);
    for (const [key, value] of windows) {
      const selected = key === name;
      value.element.classList.toggle("is-active", selected);
      value.task.setAttribute("aria-pressed", String(selected));
      onVisibility?.(key, selected && visible() && !value.minimized);
    }
    if (focus)
      item.element
        .querySelector("h2, h3, [tabindex]")
        ?.focus({ preventScroll: true });
    if (wasMinimized)
      item.task.setAttribute("aria-label", `Minimize ${APPS[name].title}`);
    changed();
  }
  function topVisible() {
    return (
      [...windows]
        .filter(([, v]) => !v.minimized)
        .sort(
          (a, b) =>
            Number(b[1].element.style.zIndex) -
            Number(a[1].element.style.zIndex),
        )[0]?.[0] ?? null
    );
  }
  function maximize(name) {
    const item = windows.get(name),
      el = item.element;
    const maximized = el.classList.toggle("maximized");
    el.querySelector("[data-action=maximize]").setAttribute(
      "aria-label",
      `${maximized ? "Restore" : "Maximize"} ${APPS[name].title}`,
    );
    if (maximized) {
      el.style.removeProperty("left");
      el.style.removeProperty("top");
    }
    focusWindow(name, false);
  }
  function minimize(name) {
    const item = windows.get(name);
    item.minimized = true;
    item.element.hidden = true;
    item.task.setAttribute("aria-pressed", "false");
    item.task.setAttribute("aria-label", `Restore ${APPS[name].title}`);
    onVisibility?.(name, false);
    const next = topVisible();
    active = null;
    if (next) focusWindow(next);
    else item.task.focus({ preventScroll: true });
    changed();
  }
  function close(name) {
    const item = windows.get(name);
    if (!item) return;
    onVisibility?.(name, false);
    onClose?.(name);
    if (name === "projects") resetProjects();
    item.placeholder.replaceWith(item.section);
    item.element.remove();
    item.task.remove();
    windows.delete(name);
    if (active === name) {
      active = null;
      const next = topVisible();
      if (next) focusWindow(next);
      else start.focus({ preventScroll: true });
    }
    changed();
  }
  function show() {
    if (!desktop.open) {
      returnFocus = document.activeElement;
      desktop.showModal();
      document.body.classList.add("desktop-open");
      for (const [name, item] of windows)
        onVisibility?.(name, name === active && !item.minimized);
    }
    hideMenu();
  }
  function open(name) {
    if (!APPS[name]) return;
    show();
    if (windows.has(name)) {
      focusWindow(name);
      return;
    }
    const section = document.getElementById(name);
    if (!section) return;
    const placeholder = document.createComment("desktop section: " + name);
    section.before(placeholder);
    const el = document.createElement("article");
    el.className = "os-window maximized";
    el.dataset.window = name;
    el.setAttribute("role", "region");
    el.setAttribute("aria-labelledby", "title-" + name);
    el.innerHTML = `<header class="title-bar"><span class="window-name" id="title-${name}"><img src="assets/icons/${APPS[name].icon}.svg" alt="" width="18" height="18">${APPS[name].title}</span><div class="window-buttons"><button data-action="minimize" aria-label="Minimize ${APPS[name].title}">_</button><button data-action="maximize" aria-label="Restore ${APPS[name].title}">□</button><button data-action="close" aria-label="Close ${APPS[name].title}">×</button></div></header><nav class="window-menu" aria-label="${APPS[name].title} shortcuts"><a href="#projects">Projects</a><a href="#experience">Experience</a><a href="#about">About</a><a href="#contact">Contact</a><a href="resume.pdf" target="_blank" rel="noopener">Résumé ↗</a></nav><div class="window-content"></div><footer class="window-status">${name === "projects" ? "4 project folders" : name === "experience" ? "3 roles · UNSW Computer Science" : "Vu’s computer"}</footer>`;
    el.querySelector(".window-content").append(section);
    area.append(el);
    const task = document.createElement("button");
    task.className = "task";
    task.textContent = APPS[name].title;
    task.setAttribute("aria-label", `Minimize ${APPS[name].title}`);
    task.dataset.task = name;
    tasks.append(task);
    windows.set(name, {
      element: el,
      section,
      placeholder,
      task,
      minimized: false,
    });
    const heading = section.querySelector("h2");
    if (heading) heading.tabIndex = -1;
    el.addEventListener("focusin", () => {
      if (active !== name) focusWindow(name, false);
    });
    el.addEventListener("pointerdown", () => {
      if (active !== name) focusWindow(name, false);
    });
    el.querySelectorAll("[data-action]").forEach((button) =>
      button.addEventListener("click", () => {
        if (button.dataset.action === "close") close(name);
        else if (button.dataset.action === "minimize") minimize(name);
        else maximize(name);
      }),
    );
    const bar = el.querySelector(".title-bar");
    bar.addEventListener("dblclick", (event) => {
      if (!event.target.closest("button")) maximize(name);
    });
    bar.addEventListener("pointerdown", (event) => {
      if (
        event.button !== 0 ||
        event.target.closest("button") ||
        el.classList.contains("maximized")
      )
        return;
      const rect = el.getBoundingClientRect(),
        parent = area.getBoundingClientRect();
      drag = {
        name,
        pointer: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        left: rect.left - parent.left,
        top: rect.top - parent.top,
      };
      bar.setPointerCapture(event.pointerId);
      event.preventDefault();
    });
    bar.addEventListener("pointermove", (event) => {
      if (drag?.name !== name) return;
      const maxX = Math.max(0, area.clientWidth - el.offsetWidth),
        maxY = Math.max(0, area.clientHeight - 44);
      el.style.left =
        Math.max(0, Math.min(maxX, drag.left + event.clientX - drag.x)) + "px";
      el.style.top =
        Math.max(0, Math.min(maxY, drag.top + event.clientY - drag.y)) + "px";
    });
    for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
      bar.addEventListener(type, () => {
        drag = null;
      });
    task.addEventListener("click", () => {
      if (active === name && !windows.get(name).minimized) minimize(name);
      else focusWindow(name);
    });
    if (name === "projects")
      selectProject(
        document.querySelector("[data-project].is-selected")?.dataset.project ||
          "braintrain",
      );
    onOpen?.(name, section);
    focusWindow(name);
  }
  function hide({ restore = false, focus = true } = {}) {
    if (restore) for (const name of [...windows.keys()]) close(name);
    if (desktop.open) desktop.close();
    document.body.classList.remove("desktop-open");
    hideMenu();
    for (const name of windows.keys()) onVisibility?.(name, false);
    if (focus)
      (returnFocus?.isConnected
        ? returnFocus
        : document.querySelector("#explore")
      ).focus({ preventScroll: true });
    changed();
  }
  function selectProject(project) {
    const section = document.querySelector("#projects");
    section.querySelectorAll("[data-project]").forEach((button) => {
      const selected = button.dataset.project === project;
      button.setAttribute("aria-pressed", String(selected));
      button.classList.toggle("is-selected", selected);
    });
    section
      .querySelectorAll("[data-project-file]")
      .forEach(
        (article) => (article.hidden = article.dataset.projectFile !== project),
      );
    section.querySelector(".project-previews")?.scrollTo(0, 0);
  }
  function resetProjects() {
    const section = document.querySelector("#projects");
    section
      .querySelectorAll("[data-project-file]")
      .forEach((article) => (article.hidden = false));
  }
  desktop.addEventListener("click", (event) => {
    const app = event.target.closest("[data-app]");
    if (app)
      document.dispatchEvent(
        new CustomEvent("portfolio:navigate", { detail: app.dataset.app }),
      );
    const file = event.target.closest("[data-project]");
    if (file) selectProject(file.dataset.project);
    if (!event.target.closest("#start-menu,#start-button")) hideMenu();
  });
  start.addEventListener("click", () => {
    menu.hidden = !menu.hidden;
    start.setAttribute("aria-expanded", String(!menu.hidden));
    if (!menu.hidden) menu.querySelector("button,a")?.focus();
  });
  menu.addEventListener("keydown", (event) => {
    const items = [...menu.querySelectorAll("button,a")];
    const index = items.indexOf(document.activeElement);
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      items[
        (index + (event.key === "ArrowDown" ? 1 : -1) + items.length) %
          items.length
      ].focus();
    }
    if (event.key === "Escape") {
      event.preventDefault();
      event.stopPropagation();
      hideMenu();
      start.focus();
    }
  });
  document
    .querySelector("#leave-computer")
    .addEventListener("click", () => onExit?.());
  desktop.addEventListener("cancel", (event) => {
    event.preventDefault();
    if (!menu.hidden) {
      hideMenu();
      start.focus();
    } else onExit?.();
  });
  addEventListener("resize", () => {
    for (const item of windows.values())
      if (!item.element.classList.contains("maximized")) {
        const rect = item.element.getBoundingClientRect(),
          parent = area.getBoundingClientRect();
        item.element.style.left =
          Math.max(
            0,
            Math.min(
              rect.left - parent.left,
              area.clientWidth - item.element.offsetWidth,
            ),
          ) + "px";
        item.element.style.top =
          Math.max(0, Math.min(rect.top - parent.top, area.clientHeight - 44)) +
          "px";
      }
  });
  return {
    open,
    show,
    close,
    hide,
    getState: state,
    focus: focusWindow,
    selectProject,
    dispose() {
      hide({ restore: true, focus: false });
    },
  };
}
