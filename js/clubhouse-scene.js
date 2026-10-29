import * as THREE from "three";
import { HDRLoader } from "three/addons/loaders/HDRLoader.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { SSAOPass } from "three/addons/postprocessing/SSAOPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RectAreaLightUniformsLib } from "three/addons/lights/RectAreaLightUniformsLib.js";
import { buildBuilding } from "./clubhouse-objects.js?v=20261029-study1";
import { WAYPOINTS, planRoute } from "./study-navigation.mjs";

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
  RectAreaLightUniformsLib.init();
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(51, 1, 0.04, 85);
  const aim = new THREE.Vector3(...WAYPOINTS.study.target);
  camera.position.fromArray(WAYPOINTS.study.position);
  camera.lookAt(aim);
  const sun = new THREE.DirectionalLight("#ffe3b4", 3.0);
  sun.position.set(-8, 3.8, 2);
  sun.target.position.set(0.1, 0.4, -1.7);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = -12;
  sun.shadow.camera.right = 12;
  sun.shadow.camera.bottom = -12;
  sun.shadow.camera.top = 12;
  sun.shadow.camera.near = 0.1;
  sun.shadow.camera.far = 40;
  sun.shadow.normalBias = 0.008;
  sun.shadow.bias = -0.0001;
  scene.add(sun, sun.target);
  const ambient = new THREE.HemisphereLight("#dde5e2", "#b8ab90", 0.38);
  scene.add(ambient);
  let active = true,
    disposed = false,
    ready = false,
    frame = null,
    weatherTimer = null,
    transition = null,
    path = [],
    currentNode = "study",
    destination = "study";
  let parkedEdge = null,
    resolveTrip = null,
    qualityLow = false,
    still = matchMedia("(prefers-reduced-motion: reduce)").matches,
    elapsed = 0,
    lastWeather = performance.now(),
    renderCount = 0;
  let hovered = null,
    interactionObjects = [];
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const occlusion = new SSAOPass(scene, camera, 1, 1, 16);
  occlusion.kernelRadius = 0.25;
  occlusion.minDistance = 0.002;
  occlusion.maxDistance = 0.16;
  composer.addPass(occlusion);
  composer.addPass(new OutputPass());
  const manager = new THREE.LoadingManager(
    () => invalidate(),
    (url, loaded, total) => onProgress?.(loaded, total),
  );
  manager.onError = (url) => console.info("A room asset could not load:", url);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");
  function invalidate() {
    if (
      !disposed &&
      active &&
      isVisible() &&
      !document.hidden &&
      frame === null
    )
      frame = requestAnimationFrame(draw);
  }
  function updateDataset() {
    canvas.dataset.node = currentNode;
    canvas.dataset.location = WAYPOINTS[currentNode].room;
    canvas.dataset.destination = destination;
    canvas.dataset.position = camera.position
      .toArray()
      .map((n) => n.toFixed(3))
      .join(",");
    canvas.dataset.traveling = String(!!transition);
  }
  function completeTrip() {
    transition = null;
    updateDataset();
    onLocation?.(WAYPOINTS[currentNode].room, currentNode);
    const done = resolveTrip;
    resolveTrip = null;
    done?.(true);
  }
  function nextLeg(now = performance.now()) {
    if (!path.length) {
      completeTrip();
      return;
    }
    const next = path.shift(),
      to = WAYPOINTS[next],
      distance = camera.position.distanceTo(new THREE.Vector3(...to.position));
    transition = {
      from: camera.position.clone(),
      fromAim: aim.clone(),
      to: new THREE.Vector3(...to.position),
      toAim: new THREE.Vector3(...to.target),
      edge: [currentNode, next],
      next,
      start: now,
      duration: Math.max(350, Math.min(1400, distance * 330)),
    };
    canvas.dataset.path = JSON.stringify([currentNode, next, ...path]);
    updateDataset();
    invalidate();
  }
  function go(name) {
    if (disposed || !WAYPOINTS[name]) return Promise.resolve(false);
    resolveTrip?.(false);
    resolveTrip = null;
    path = planRoute(
      {
        node: currentNode,
        edge: transition?.edge || parkedEdge,
        position: camera.position.toArray(),
      },
      name,
    );
    parkedEdge = null;
    destination = name;
    return new Promise((resolve) => {
      resolveTrip = resolve;
      if (reduced.matches) {
        currentNode = name;
        camera.position.fromArray(WAYPOINTS[name].position);
        aim.fromArray(WAYPOINTS[name].target);
        camera.lookAt(aim);
        path = [];
        completeTrip();
        invalidate();
        return;
      }
      nextLeg();
    });
  }
  function weatherTick() {
    weatherTimer = null;
    if (disposed || !active || !isVisible() || document.hidden) return;
    const now = performance.now();
    elapsed += Math.min(now - lastWeather, 1000);
    lastWeather = now;
    const cloud = still
      ? 0
      : (1 - Math.cos((elapsed / 1080000) * Math.PI * 2)) * 0.5;
    sun.intensity = 3 - cloud * 1.95;
    sun.color.set("#ffe3b4").lerp(new THREE.Color("#e0e8e9"), cloud);
    sun.position.z = 2 + Math.sin((elapsed / 1080000) * Math.PI) * 0.8;
    ambient.intensity = 0.38 + cloud * 0.13;
    scene.backgroundIntensity = 0.68 - cloud * 0.14;
    canvas.dataset.atmosphere = still
      ? "still"
      : cloud > 0.55
        ? "overcast"
        : "morning";
    if (!still) invalidate();
    if (!still) weatherTimer = setTimeout(weatherTick, 500);
  }
  function scheduleWeather() {
    clearTimeout(weatherTimer);
    lastWeather = performance.now();
    weatherTick();
  }
  function draw(now) {
    frame = null;
    if (disposed || !active || !isVisible() || document.hidden) return;
    if (transition) {
      const t = Math.min((now - transition.start) / transition.duration, 1),
        ease = t * t * (3 - 2 * t);
      camera.position.lerpVectors(transition.from, transition.to, ease);
      aim.lerpVectors(transition.fromAim, transition.toAim, ease);
      camera.lookAt(aim);
      updateDataset();
      if (t === 1) {
        currentNode = transition.next;
        transition = null;
        nextLeg(now);
      }
    }
    if (qualityLow) renderer.render(scene, camera);
    else composer.render();
    canvas.dataset.renders = String(++renderCount);
    if (transition) invalidate();
  }
  function resize() {
    const rect = canvas.getBoundingClientRect(),
      width = Math.max(1, rect.width),
      height = Math.max(1, rect.height);
    renderer.setPixelRatio(qualityLow ? 1 : Math.min(devicePixelRatio, 1.5));
    renderer.setSize(width, height, false);
    composer.setPixelRatio(qualityLow ? 1 : Math.min(devicePixelRatio, 1.5));
    composer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    invalidate();
  }
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();
  const pointer = new THREE.Vector2(),
    raycaster = new THREE.Raycaster();
  function pick(event) {
    if (!ready || transition) return null;
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      (-(event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    // Pick the nearest visible surface, so an object in another room cannot be
    // activated through an enclosing wall.
    const hit = raycaster
      .intersectObjects(scene.children, true)
      .find((hit) => hit.object.isMesh);
    if (!hit) return null;
    let object = hit.object;
    while (object) {
      if (object.userData.interaction) return object.userData.interaction;
      object = object.parent;
    }
    return null;
  }
  function pointermove(event) {
    hovered = pick(event);
    canvas.style.cursor = hovered ? "pointer" : "default";
    canvas.dataset.hover = hovered?.label || "";
  }
  function click(event) {
    const interaction = pick(event);
    if (!interaction) return;
    activate(interaction);
  }
  function activate(interaction) {
    if (interaction.type === "go")
      go(
        WAYPOINTS[currentNode].room === interaction.destination
          ? "corridor"
          : interaction.destination,
      );
    else if (interaction.type === "computer") api.useComputer();
    else onInteract?.(interaction.destination);
  }
  function keydown(event) {
    if ((event.key === "Enter" || event.key.toLowerCase() === "e") && hovered) {
      event.preventDefault();
      activate(hovered);
    }
  }
  function visibility() {
    clearTimeout(weatherTimer);
    weatherTimer = null;
    if (document.hidden) {
      cancelAnimationFrame(frame);
      frame = null;
      if (transition) {
        transition.from.copy(camera.position);
        transition.fromAim.copy(aim);
      }
    } else if (active) {
      if (transition) transition.start = performance.now();
      scheduleWeather();
      invalidate();
    }
  }
  canvas.addEventListener("pointermove", pointermove);
  canvas.addEventListener("click", click);
  canvas.addEventListener("keydown", keydown);
  document.addEventListener("visibilitychange", visibility);
  function reducedChange() {
    if (reduced.matches) {
      api.setStill(true);
      if (transition) go(destination);
    }
  }
  reduced.addEventListener("change", reducedChange);
  canvas.addEventListener(
    "webglcontextlost",
    (event) => {
      event.preventDefault();
      onReady?.(false);
    },
    { once: true },
  );
  const api = {
    go,
    async useComputer() {
      if (await go("screen")) onInteract?.("projects");
    },
    setActive(value) {
      active = value;
      clearTimeout(weatherTimer);
      weatherTimer = null;
      if (!value) {
        cancelAnimationFrame(frame);
        frame = null;
        // Freeze a transition exactly where it is; its current safe edge is
        // retained so the next destination can reverse/finish it correctly.
        if (transition) {
          parkedEdge = transition.edge;
          transition = null;
          path = [];
          resolveTrip?.(false);
          resolveTrip = null;
          updateDataset();
        }
      } else {
        if (transition) transition.start = performance.now();
        scheduleWeather();
        resize();
        invalidate();
      }
    },
    setQuality(low) {
      qualityLow = low;
      renderer.shadowMap.enabled = !low;
      resize();
      invalidate();
    },
    setStill(value) {
      still = value;
      if (still) elapsed = 0;
      scheduleWeather();
      invalidate();
    },
    getState() {
      return {
        node: currentNode,
        destination,
        active,
        still,
        qualityLow,
        traveling: !!transition,
      };
    },
    dispose() {
      disposed = true;
      resolveTrip?.(false);
      cancelAnimationFrame(frame);
      clearTimeout(weatherTimer);
      observer.disconnect();
      canvas.removeEventListener("pointermove", pointermove);
      canvas.removeEventListener("click", click);
      canvas.removeEventListener("keydown", keydown);
      document.removeEventListener("visibilitychange", visibility);
      reduced.removeEventListener("change", reducedChange);
      composer.dispose();
      scene.traverse((object) => {
        if (object.isMesh) {
          object.geometry.dispose();
          for (const m of Array.isArray(object.material)
            ? object.material
            : [object.material])
            m.dispose();
        }
      });
      renderer.dispose();
    },
  };
  try {
    const hdrLoader = new HDRLoader(manager);
    const environments = await Promise.allSettled(
      ["studio", "garden"].map((name) =>
        hdrLoader.loadAsync(`assets/study/${name}.hdr`),
      ),
    );
    for (const result of environments)
      if (result.status === "fulfilled")
        result.value.mapping = THREE.EquirectangularReflectionMapping;
    if (environments[0].status === "fulfilled") {
      scene.environment = environments[0].value;
      scene.environmentIntensity = 0.6;
    }
    if (environments[1].status === "fulfilled") {
      scene.background = environments[1].value;
      scene.backgroundBlurriness = 0.025;
      scene.backgroundRotation.y = 2.5;
      scene.backgroundIntensity = 0.68;
    } else scene.background = new THREE.Color("#c7d1bf");
    const building = await buildBuilding(scene, manager, invalidate);
    interactionObjects = building.interactables;
    // Texture callbacks can complete after model parsing. The loading manager
    // invalidates again when that happens, avoiding a permanently black prop.
    ready = true;
    canvas.dataset.ready = "true";
    updateDataset();
    scheduleWeather();
    invalidate();
    onReady?.(true, building.errors.length);
    return api;
  } catch (error) {
    api.dispose();
    throw error;
  }
}
