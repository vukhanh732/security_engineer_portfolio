import * as THREE from "three";
import {
  buildDesk,
  buildDestination,
} from "./clubhouse-objects.js?v=20261029-clean2";
import { WAYPOINTS, planView } from "./study-navigation.mjs?v=20261029-clean2";

export async function createScene({
  canvas,
  onInteract,
  onLocation,
  onReady,
  onProgress,
  isVisible = () => true,
}) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
  });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  const scene = new THREE.Scene();
  scene.background = new THREE.Color("#b8b8ba");
  const camera = new THREE.PerspectiveCamera(35, 1, 0.01, 250),
    aim = new THREE.Vector3(...WAYPOINTS.study.target);
  camera.position.fromArray(WAYPOINTS.study.position);
  camera.lookAt(aim);
  scene.add(new THREE.HemisphereLight("#fffbed", "#8b918a", 2.2));
  const light = new THREE.DirectionalLight("#fff5e2", 2.3);
  light.position.set(-4, 8, 5);
  scene.add(light);
  let active = true,
    disposed = false,
    ready = false,
    frame = null,
    transition = null,
    currentNode = "study",
    destination = "study",
    currentRoom = "study",
    resolveTrip = null,
    qualityLow = false,
    renders = 0;
  const views = new Map(),
    reduced = matchMedia("(prefers-reduced-motion: reduce)");
  const manager = new THREE.LoadingManager(undefined, (_url, loaded, total) =>
    onProgress?.(loaded, total),
  );
  function visible() {
    return !disposed && active && isVisible() && !document.hidden;
  }
  function invalidate() {
    if (ready && visible() && frame === null)
      frame = requestAnimationFrame(draw);
  }
  function state() {
    canvas.dataset.node = currentNode;
    canvas.dataset.destination = destination;
    canvas.dataset.location = currentRoom;
    canvas.dataset.position = camera.position
      .toArray()
      .map((n) => n.toFixed(3))
      .join(",");
    canvas.dataset.traveling = String(!!transition);
    canvas.dataset.quality = qualityLow ? "low" : "full";
  }
  function fittedPosition(name) {
    const view = WAYPOINTS[name];
    const target = new THREE.Vector3(...view.target);
    const distanceScale =
      name === "screen" ? 1 : Math.max(1, 1.55 / camera.aspect);
    return new THREE.Vector3(...view.position)
      .sub(target)
      .multiplyScalar(distanceScale)
      .add(target);
  }
  function resize() {
    const r = canvas.getBoundingClientRect();
    renderer.setPixelRatio(Math.min(devicePixelRatio, qualityLow ? 1 : 2));
    renderer.setSize(Math.max(1, r.width), Math.max(1, r.height), false);
    camera.aspect = Math.max(1, r.width) / Math.max(1, r.height);
    camera.updateProjectionMatrix();
    if (transition) transition.to.copy(fittedPosition(destination));
    else {
      camera.position.copy(fittedPosition(currentNode));
      aim.fromArray(WAYPOINTS[currentNode].target);
      camera.lookAt(aim);
    }
    invalidate();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  function activateView(room) {
    clearHover();
    if (!views.has(room)) {
      const view = buildDestination(room);
      views.set(room, view);
      scene.add(view);
    }
    for (const [name, view] of views) view.visible = name === room;
    currentRoom = room;
  }
  function finish(name) {
    currentNode = name;
    transition = null;
    canvas.style.removeProperty("opacity");
    state();
    onLocation?.(currentRoom, currentNode);
    const done = resolveTrip;
    resolveTrip = null;
    done?.(true);
  }
  function cancel() {
    clearHover();
    resolveTrip?.(false);
    resolveTrip = null;
    transition = null;
    canvas.style.removeProperty("opacity");
    state();
  }
  function go(requested) {
    if (disposed || !ready) return Promise.resolve(false);
    const view = planView(currentNode, requested);
    cancel();
    destination = view.name;
    return new Promise((resolve) => {
      resolveTrip = resolve;
      if (reduced.matches) {
        activateView(view.room);
        camera.position.copy(fittedPosition(view.name));
        aim.fromArray(view.target);
        camera.lookAt(aim);
        finish(view.name);
        invalidate();
        return;
      }
      transition = {
        name: view.name,
        room: view.room,
        from: camera.position.clone(),
        fromAim: aim.clone(),
        to: fittedPosition(view.name),
        toAim: new THREE.Vector3(...view.target),
        swap: currentRoom !== view.room,
        swapped: false,
        start: performance.now(),
        duration: currentRoom !== view.room ? 280 : 650,
      };
      state();
      invalidate();
    });
  }
  function draw(now) {
    frame = null;
    if (!visible()) return;
    if (transition) {
      const t = Math.min(1, (now - transition.start) / transition.duration),
        ease = t * t * (3 - 2 * t);
      if (transition.swap) {
        canvas.style.opacity = String(Math.abs(t * 2 - 1));
        if (t >= 0.5 && !transition.swapped) {
          activateView(transition.room);
          currentNode = transition.name;
          onLocation?.(currentRoom, currentNode);
          camera.position.copy(transition.to);
          aim.copy(transition.toAim);
          camera.lookAt(aim);
          transition.swapped = true;
        }
      } else {
        camera.position.lerpVectors(transition.from, transition.to, ease);
        aim.lerpVectors(transition.fromAim, transition.toAim, ease);
        camera.lookAt(aim);
      }
      if (t === 1) finish(transition.name);
      else state();
    }
    renderer.render(scene, camera);
    canvas.dataset.renders = String(++renders);
    if (transition) invalidate();
  }
  const raycaster = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  let hovered = null;
  function pick(event) {
    if (!ready || transition) return null;
    const r = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - r.left) / r.width) * 2 - 1,
      (-(event.clientY - r.top) / r.height) * 2 + 1,
    );
    camera.updateMatrixWorld(true);
    raycaster.setFromCamera(pointer, camera);
    const view = views.get(currentRoom);
    if (!view) return null;
    view.updateWorldMatrix(true, true);
    const hit = raycaster
      .intersectObjects(view.children, true)
      .find((h) => h.object.isMesh);
    return hit?.object.userData.interaction || null;
  }
  function clearHover() {
    hovered = null;
    canvas.style.cursor = "default";
    canvas.dataset.hover = "";
  }
  function pointermove(event) {
    hovered = pick(event);
    canvas.style.cursor = hovered ? "pointer" : "default";
    canvas.dataset.hover = hovered?.label || "";
  }
  function interact(item) {
    if (!item) return;
    if (item.type === "computer") api.useComputer();
    else onInteract?.(item.destination);
  }
  const click = (event) => interact(pick(event));
  const keydown = (event) => {
    if (
      !transition &&
      (event.key === "Enter" || event.key.toLowerCase() === "e") &&
      hovered
    ) {
      event.preventDefault();
      interact(hovered);
    }
  };
  function visibility() {
    cancelAnimationFrame(frame);
    frame = null;
    if (document.hidden) {
      cancel();
    } else invalidate();
  }
  const reduceChange = () => {
    if (reduced.matches && transition) {
      const next = transition;
      activateView(next.room);
      camera.position.copy(next.to);
      aim.copy(next.toAim);
      camera.lookAt(aim);
      finish(next.name);
      invalidate();
    }
  };
  canvas.addEventListener("pointermove", pointermove);
  canvas.addEventListener("click", click);
  canvas.addEventListener("keydown", keydown);
  document.addEventListener("visibilitychange", visibility);
  reduced.addEventListener("change", reduceChange);
  function contextLost(event) {
    event.preventDefault();
    cancel();
    onReady?.(false);
  }
  canvas.addEventListener("webglcontextlost", contextLost);
  const api = {
    go,
    async useComputer() {
      if (await go("screen")) onInteract?.("projects");
    },
    setActive(value) {
      active = value;
      if (!value) {
        cancelAnimationFrame(frame);
        frame = null;
        cancel();
      } else invalidate();
    },
    setQuality(low) {
      qualityLow = low;
      state();
      resize();
    },
    getState() {
      return {
        node: currentNode,
        destination,
        active,
        qualityLow,
        traveling: !!transition,
      };
    },
    dispose() {
      disposed = true;
      cancel();
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointermove", pointermove);
      canvas.removeEventListener("click", click);
      canvas.removeEventListener("keydown", keydown);
      canvas.removeEventListener("webglcontextlost", contextLost);
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", reduceChange);
      const geometries = new Set(),
        materials = new Set(),
        textures = new Set();
      scene.traverse((object) => {
        if (object.geometry) geometries.add(object.geometry);
        if (object.material)
          for (const material of Array.isArray(object.material)
            ? object.material
            : [object.material]) {
            materials.add(material);
            for (const value of Object.values(material))
              if (value?.isTexture) textures.add(value);
          }
      });
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
      renderer.dispose();
    },
  };
  try {
    const desk = await buildDesk(
      manager,
      Math.min(8, renderer.capabilities.getMaxAnisotropy()),
    );
    views.set("study", desk);
    scene.add(desk);
    ready = true;
    state();
    // Reveal only a complete frame; the loading image stays sharp until then.
    // A reading window still suppresses rendering while loading completes.
    if (visible()) {
      renderer.render(scene, camera);
      canvas.dataset.renders = String(++renders);
    }
    canvas.dataset.ready = "true";
    onReady?.(true);
    invalidate();
    return api;
  } catch (error) {
    api.dispose();
    throw error;
  }
}
