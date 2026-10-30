import * as THREE from "three";
import { createDeskInteractions } from "./desk-interactions.js?v=20261030-rooms1";
import { buildDesk } from "./clubhouse-objects.js?v=20261030-rooms1";
import {
  buildStudyRoom,
  buildHobbiesRoom,
} from "./clubhouse-rooms.js?v=20261030-rooms1";
import {
  WAYPOINTS,
  PORTALS,
  planView,
} from "./study-navigation.mjs?v=20261030-rooms1";

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
      const view = buildHobbiesRoom();
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
    views.get(currentRoom)?.userData.portal?.setOpen(false, reduced.matches);
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
    for (const view of views.values()) view.userData.portal?.finishMotion();
    canvas.style.removeProperty("opacity");
    state();
  }
  function go(requested) {
    if (disposed || !ready) return Promise.resolve(false);
    const view = planView(currentNode, requested, currentRoom);
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
      const portal = PORTALS[currentRoom];
      if (view.switchScene)
        views.get(currentRoom)?.userData.portal?.setOpen(true);
      transition = {
        name: view.name,
        room: view.room,
        from: camera.position.clone(),
        fromAim: aim.clone(),
        to: fittedPosition(view.name),
        toAim: new THREE.Vector3(...view.target),
        swap: view.switchScene,
        approach: new THREE.Vector3(...portal.approach.position),
        approachAim: new THREE.Vector3(...portal.approach.target),
        exit: new THREE.Vector3(...portal.exit.position),
        exitAim: new THREE.Vector3(...portal.exit.target),
        entry: new THREE.Vector3(...PORTALS[view.room].entry.position),
        entryAim: new THREE.Vector3(...PORTALS[view.room].entry.target),
        swapped: false,
        start: performance.now(),
        duration: view.switchScene ? 1800 : 750,
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
        if (t < 0.42) {
          const p = t / 0.42,
            e = p * p * (3 - 2 * p);
          camera.position.lerpVectors(transition.from, transition.approach, e);
          aim.lerpVectors(transition.fromAim, transition.approachAim, e);
          canvas.style.opacity = "1";
        } else if (t < 0.66) {
          const p = (t - 0.42) / 0.24;
          camera.position.lerpVectors(transition.approach, transition.exit, p);
          aim.lerpVectors(transition.approachAim, transition.exitAim, p);
          canvas.style.opacity = String(1 - p);
        } else {
          if (!transition.swapped) {
            views.get(currentRoom)?.userData.portal?.setOpen(false, true);
            activateView(transition.room);
            views.get(currentRoom)?.userData.portal?.setOpen(true, true);
            currentNode = transition.name;
            onLocation?.(currentRoom, currentNode);
            transition.swapped = true;
          }
          const p = (t - 0.66) / 0.34,
            e = p * p * (3 - 2 * p);
          camera.position.lerpVectors(transition.entry, transition.to, e);
          aim.lerpVectors(transition.entryAim, transition.toAim, e);
          canvas.style.opacity = String(Math.min(1, p * 3));
        }
        camera.lookAt(aim);
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
    let doorMoving = false;
    for (const view of views.values())
      doorMoving = !!view.userData.portal?.update(now) || doorMoving;
    for (const view of views.values())
      for (const wall of view.userData.cutaways || [])
        wall.group.visible = (camera.position.x - wall.x) * (wall.side || 1) > 0.05;
    state();
    renderer.render(scene, camera);
    canvas.dataset.renders = String(++renders);
    if (transition || mouseMoving || propMoving || doorMoving) invalidate();
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
      .find((h) => {
        if (!h.object.isMesh) return false;
        for (let object = h.object; object; object = object.parent)
          if (!object.visible) return false;
        return true;
      });
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
    else if (item.type === "travel") api.go(item.destination);
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
      for (const view of views.values()) view.userData.portal?.finishMotion();
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
    buildStudyRoom(desk);
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
