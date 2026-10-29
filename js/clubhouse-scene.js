import * as THREE from "three";
import { createDeskInteractions } from "./desk-interactions.js?v=20261030-personal1";
import {
  buildDesk,
  buildDestination,
} from "./clubhouse-objects.js?v=20261030-personal1";
import {
  WAYPOINTS,
  planView,
} from "./study-navigation.mjs?v=20261030-personal1";

export async function createScene({
  canvas,
  onInteract,
  onLocation,
  onReady,
  onProgress,
  onInspect,
  onDismiss,
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
  scene.background = new THREE.Color("#b6c5ca");
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
    renders = 0,
    deskInteractions = null;
  const basePosition = camera.position.clone(),
    baseAim = aim.clone(),
    mouseTarget = new THREE.Vector2(),
    mouseCurrent = new THREE.Vector2();
  const finePointer = matchMedia("(pointer: fine)");
  let lastFrame = 0;
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
    const props = deskInteractions?.getState();
    canvas.dataset.inspection = props?.inspection || "";
    canvas.dataset.drawer = String(props?.drawerOpen || false);
    canvas.dataset.plantMotion = String(props?.plantMoving || false);
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
    // A viewport/orientation change ends a close-up before reframing the desk.
    if (deskInteractions?.getState().inspection) deskInteractions.reset();
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
      basePosition.copy(camera.position);
      baseAim.copy(aim);
      mouseCurrent.set(0, 0);
      mouseTarget.set(0, 0);
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
    basePosition.copy(camera.position);
    baseAim.copy(aim);
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
    // Preserve the last visible pose, including a destination already revealed
    // halfway through a fade. The idle mouse-follow pass uses this baseline.
    if (transition) {
      basePosition.copy(camera.position);
      baseAim.copy(aim);
    }
    transition = null;
    canvas.style.removeProperty("opacity");
    state();
  }
  function go(requested) {
    if (disposed || !ready) return Promise.resolve(false);
    const view = planView(currentNode, requested);
    deskInteractions?.reset();
    mouseTarget.set(0, 0);
    mouseCurrent.set(0, 0);
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
    const dt = Math.min((now - lastFrame) / 1000 || 1 / 60, 0.05);
    lastFrame = now;
    let mouseMoving = false;
    if (!transition) {
      if (!deskInteractions?.getState().inspection) {
        if (reduced.matches || !finePointer.matches || canvas.clientWidth < 768)
          mouseTarget.set(0, 0);
        mouseCurrent.lerp(mouseTarget, 1 - Math.exp(-dt * 9));
        if (mouseCurrent.distanceToSquared(mouseTarget) < 0.000001)
          mouseCurrent.copy(mouseTarget);
        else mouseMoving = true;
      }
      camera.position.copy(basePosition);
      aim.copy(baseAim);
      camera.lookAt(aim);
      const right = new THREE.Vector3(1, 0, 0).applyQuaternion(
        camera.quaternion,
      );
      camera.position.addScaledVector(right, mouseCurrent.x * 0.65);
      camera.position.y += mouseCurrent.y * 0.28;
      aim.addScaledVector(right, -mouseCurrent.x * 0.06);
      camera.lookAt(aim);
    }
    const propMoving = deskInteractions?.update(now) || false;
    state();
    renderer.render(scene, camera);
    canvas.dataset.renders = String(++renders);
    if (transition || mouseMoving || propMoving) invalidate();
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
    if (
      !transition &&
      !reduced.matches &&
      finePointer.matches &&
      canvas.clientWidth >= 768 &&
      !deskInteractions?.getState().inspection
    ) {
      const rect = canvas.getBoundingClientRect();
      mouseTarget.set(
        THREE.MathUtils.clamp(
          ((event.clientX - rect.left) / rect.width) * 2 - 1,
          -1,
          1,
        ),
        THREE.MathUtils.clamp(
          1 - ((event.clientY - rect.top) / rect.height) * 2,
          -1,
          1,
        ),
      );
      invalidate();
    }
    hovered = pick(event);
    canvas.style.cursor = hovered ? "pointer" : "default";
    canvas.dataset.hover = hovered?.label || "";
  }
  function interact(item) {
    if (!item) return;
    if (item.type === "computer") api.useComputer();
    else if (item.type === "prop") api.activateProp(item.id);
    else onInteract?.(item.destination);
  }
  const click = (event) => interact(pick(event));
  const pointerleave = () => {
    clearHover();
    mouseTarget.set(0, 0);
    invalidate();
  };
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
      deskInteractions?.reset();
      mouseTarget.set(0, 0);
      mouseCurrent.set(0, 0);
      cancel();
    } else invalidate();
  }
  const reduceChange = () => {
    if (reduced.matches) {
      deskInteractions?.finishMotion();
      mouseTarget.set(0, 0);
      mouseCurrent.set(0, 0);
      invalidate();
    }
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
  canvas.addEventListener("pointerleave", pointerleave);
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
      if (await go("screen")) onInteract?.("computer");
    },
    activateProp(name) {
      if (!ready || currentRoom !== "study" || transition) return;
      clearHover();
      deskInteractions?.activate(name);
      invalidate();
    },
    dismissInspection() {
      deskInteractions?.dismiss();
      mouseTarget.set(0, 0);
      invalidate();
    },
    setActive(value) {
      active = value;
      if (!value) {
        deskInteractions?.reset();
        mouseTarget.set(0, 0);
        mouseCurrent.set(0, 0);
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
        inspection: deskInteractions?.getState().inspection || null,
      };
    },
    dispose() {
      disposed = true;
      cancel();
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointermove", pointermove);
      canvas.removeEventListener("click", click);
      canvas.removeEventListener("pointerleave", pointerleave);
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
    deskInteractions = createDeskInteractions({
      desk,
      camera,
      reduced,
      invalidate,
      onInspect,
      onDismiss,
    });
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
