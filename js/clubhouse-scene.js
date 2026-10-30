import * as THREE from "three";
import { createDeskInteractions } from "./desk-interactions.js?v=20261031-roomview1";
import { buildDesk } from "./clubhouse-objects.js?v=20261031-roomview1";
import {
  buildStudyRoom,
  buildHobbiesRoom,
} from "./clubhouse-rooms.js?v=20261031-roomview1";
import {
  WAYPOINTS,
  PORTALS,
  planView,
} from "./study-navigation.mjs?v=20261031-roomview1";

export async function createScene({
  canvas,
  onInteract,
  onLocation,
  onReady,
  onProgress,
  onInspect,
  onDismiss,
  onCameraChange,
  onHover,
  onMarkers,
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
  let lastFrame = 0;
  const views = new Map(),
    reduced = matchMedia("(prefers-reduced-motion: reduce)");
  let lookEnabled = !reduced.matches,
    zoomTarget = 1;
  const hoverMaterials = new Map();
  const markerPoints = [
    { name: "badminton", point: new THREE.Vector3(-2, 2.1, -3.1) },
    { name: "gym", point: new THREE.Vector3(6, 3.1, -4.5) },
    { name: "poker", point: new THREE.Vector3(6.4, 2.7, 5.1) },
  ];
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
    canvas.dataset.zoom = zoomTarget.toFixed(3);
    canvas.dataset.look = String(lookEnabled);
    const props = deskInteractions?.getState();
    canvas.dataset.inspection = props?.inspection || "";
    canvas.dataset.drawer = String(props?.drawerOpen || false);
    canvas.dataset.plantMotion = String(props?.plantMoving || false);
  }
  function fittedPosition(name) {
    const view = WAYPOINTS[name];
    const target = new THREE.Vector3(...view.target);
    const distanceScale =
      name === "screen" ? 1 : Math.max(1, 1.15 / camera.aspect);
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
    if (view.name === "screen") setZoom(1, true);
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
        if (!lookEnabled || canvas.clientWidth < 768) mouseTarget.set(0, 0);
        mouseCurrent.lerp(mouseTarget, 1 - Math.exp(-dt * 9));
        if (mouseCurrent.distanceToSquared(mouseTarget) < 0.000001)
          mouseCurrent.copy(mouseTarget);
        else mouseMoving = true;
      }
      camera.position.copy(basePosition);
      aim.copy(baseAim);
      camera.lookAt(aim);
      const orbit = new THREE.Spherical().setFromVector3(
        basePosition.clone().sub(baseAim),
      );
      orbit.theta += mouseCurrent.x * 0.12;
      orbit.phi = THREE.MathUtils.clamp(
        orbit.phi - mouseCurrent.y * 0.045,
        0.15,
        Math.PI - 0.15,
      );
      camera.position
        .copy(baseAim)
        .add(new THREE.Vector3().setFromSpherical(orbit));
      camera.lookAt(aim);
    }
    const zoomMoving = Math.abs(camera.zoom - zoomTarget) > 0.0005;
    if (zoomMoving)
      camera.zoom = reduced.matches
        ? zoomTarget
        : THREE.MathUtils.lerp(camera.zoom, zoomTarget, 1 - Math.exp(-dt * 12));
    else camera.zoom = zoomTarget;
    camera.updateProjectionMatrix();
    const propMoving = deskInteractions?.update(now) || false;
    let doorMoving = false;
    for (const view of views.values())
      doorMoving = !!view.userData.portal?.update(now) || doorMoving;
    for (const view of views.values())
      for (const wall of view.userData.cutaways || [])
        wall.group.visible =
          (camera.position.x - wall.x) * (wall.side || 1) > 0.05;
    state();
    renderer.render(scene, camera);
    updateMarkers();
    canvas.dataset.renders = String(++renders);
    if (transition || mouseMoving || zoomMoving || propMoving || doorMoving)
      invalidate();
  }
  function updateMarkers() {
    const width = canvas.clientWidth,
      height = canvas.clientHeight;
    const placed = [];
    onMarkers?.(
      markerPoints.map(({ name, point }) => {
        const projected = point.clone().project(camera);
        const compact = width <= 1100 || height <= 650;
        const show =
          currentRoom === "hobbies" &&
          !transition &&
          !deskInteractions?.getState().inspection &&
          (compact ||
            (projected.z > -1 &&
              projected.z < 1 &&
              Math.abs(projected.x) < 0.95 &&
              Math.abs(projected.y) < 0.9));
        let x = THREE.MathUtils.clamp(
          ((projected.x + 1) * width) / 2,
          80,
          width - 80,
        );
        let y = THREE.MathUtils.clamp(
          ((1 - projected.y) * height) / 2,
          180,
          height - 155,
        );
        if (show) {
          for (const previous of placed)
            if (
              Math.abs(x - previous.x) < (width < 768 ? 115 : 155) &&
              Math.abs(y - previous.y) < 70
            )
              y = previous.y + 75;
          placed.push({ x, y });
        }
        return { name, x, y, visible: show };
      }),
    );
  }
  function cameraChanged() {
    onCameraChange?.({ zoom: zoomTarget, look: lookEnabled });
    state();
  }
  function setZoom(value, immediate = reduced.matches) {
    zoomTarget = THREE.MathUtils.clamp(value, 0.8, 1.65);
    if (immediate) {
      camera.zoom = zoomTarget;
      camera.updateProjectionMatrix();
    }
    cameraChanged();
    invalidate();
  }
  function captureView() {
    return {
      node: currentNode,
      room: currentRoom,
      position: (transition ? camera.position : basePosition).toArray(),
      target: (transition ? aim : baseAim).toArray(),
      zoom: zoomTarget,
      aspect: camera.aspect,
    };
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
    const hit = raycaster.intersectObjects(view.children, true).find((h) => {
      if (!h.object.isMesh) return false;
      for (let object = h.object; object; object = object.parent)
        if (!object.visible) return false;
      return true;
    });
    return hit?.object.userData.interaction
      ? { ...hit.object.userData.interaction, object: hit.object }
      : null;
  }
  function clearHover() {
    if (hovered?.object)
      hovered.object.material =
        hoverMaterials.get(hovered.object)?.original || hovered.object.material;
    hovered = null;
    canvas.style.cursor = "default";
    canvas.dataset.hover = "";
    onHover?.("");
    invalidate();
  }
  function setHover(item) {
    if (item?.object === hovered?.object) return;
    clearHover();
    if (!item) return;
    const mesh = item.object;
    if (!hoverMaterials.has(mesh)) {
      const original = mesh.material;
      const brighten = (source) => {
        const material = source.clone();
        material.onBeforeCompile = source.onBeforeCompile;
        material.customProgramCacheKey = source.customProgramCacheKey;
        material.color?.lerp(new THREE.Color("#fff0c9"), 0.22);
        if (material.emissive) {
          material.emissive.set("#f0cd87");
          material.emissiveIntensity = 0.23;
          material.roughness = 0.28;
        }
        return material;
      };
      hoverMaterials.set(mesh, {
        original,
        bright: Array.isArray(original)
          ? original.map(brighten)
          : brighten(original),
      });
    }
    mesh.material = hoverMaterials.get(mesh).bright;
    hovered = item;
    canvas.style.cursor = "pointer";
    canvas.dataset.hover = item.label;
    onHover?.(item.label);
    invalidate();
  }
  function pointermove(event) {
    if (
      !transition &&
      lookEnabled &&
      event.pointerType !== "touch" &&
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
    setHover(pick(event));
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
  const wheel = (event) => {
    if (
      !visible() ||
      !ready ||
      transition ||
      deskInteractions?.getState().inspection ||
      event.ctrlKey ||
      event.metaKey
    )
      return;
    event.preventDefault();
    setZoom(
      zoomTarget -
        THREE.MathUtils.clamp(
          event.deltaY * (event.deltaMode === 1 ? 0.025 : 0.001),
          -0.15,
          0.15,
        ),
    );
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
    lookEnabled = !reduced.matches;
    if (reduced.matches) {
      lookEnabled = false;
      setZoom(zoomTarget, true);
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
    cameraChanged();
    invalidate();
  };
  canvas.addEventListener("pointermove", pointermove);
  canvas.addEventListener("click", click);
  canvas.addEventListener("pointerleave", pointerleave);
  canvas.addEventListener("keydown", keydown);
  canvas.addEventListener("wheel", wheel, { passive: false });
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
    captureView,
    restoreView(view) {
      cancel();
      deskInteractions?.reset();
      activateView(view.room);
      currentNode = destination = view.node;
      basePosition.fromArray(view.position);
      baseAim.fromArray(view.target);
      if (view.node !== "screen" && view.aspect) {
        const ratio =
          Math.max(1, 1.15 / camera.aspect) / Math.max(1, 1.15 / view.aspect);
        basePosition.sub(baseAim).multiplyScalar(ratio).add(baseAim);
      }
      camera.position.copy(basePosition);
      aim.copy(baseAim);
      camera.lookAt(aim);
      mouseTarget.set(0, 0);
      mouseCurrent.set(0, 0);
      setZoom(view.zoom, true);
      state();
      onLocation?.(currentRoom, currentNode);
      invalidate();
    },
    zoomBy(amount) {
      if (!transition && !deskInteractions?.getState().inspection)
        setZoom(zoomTarget + amount);
    },
    resetZoom() {
      setZoom(1, true);
    },
    toggleLook() {
      lookEnabled = !lookEnabled;
      mouseTarget.set(0, 0);
      if (reduced.matches) mouseCurrent.set(0, 0);
      cameraChanged();
      invalidate();
    },
    highlightActivity(name) {
      if (!name || transition) {
        clearHover();
        return;
      }
      let item = null;
      views.get(currentRoom)?.traverse((mesh) => {
        if (
          !item &&
          mesh.userData.interaction?.destination ===
            (name === "gym" ? "about" : name)
        )
          item = { ...mesh.userData.interaction, object: mesh };
      });
      setHover(item);
    },
    async useComputer() {
      const view = captureView();
      if (await go("screen")) onInteract?.("computer", view);
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
        clearHover();
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
        zoom: zoomTarget,
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
      canvas.removeEventListener("wheel", wheel);
      canvas.removeEventListener("webglcontextlost", contextLost);
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", reduceChange);
      clearHover();
      for (const { bright } of hoverMaterials.values())
        for (const material of Array.isArray(bright) ? bright : [bright])
          material.dispose();
      hoverMaterials.clear();
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
    cameraChanged();
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
