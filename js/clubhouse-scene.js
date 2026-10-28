import * as THREE from "three";
import { OrbitControls } from "./vendor/OrbitControls.js";
import { buildClubhouse } from "./clubhouse-objects.js";

export async function createScene({ canvas, labels, onOpen, audio, onReady }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "low-power",
  });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.65));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.06;
  const scene = new THREE.Scene(),
    camera = new THREE.PerspectiveCamera(38, 1, 0.1, 150);
  scene.add(new THREE.HemisphereLight("#fff9ed", "#819180", 1.9));
  const sun = new THREE.DirectionalLight("#fff5e2", 3);
  sun.position.set(-9, 18, 8);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  sun.shadow.camera.left = sun.shadow.camera.bottom = -19;
  sun.shadow.camera.right = sun.shadow.camera.top = 19;
  sun.shadow.normalBias = 0.035;
  sun.shadow.bias = -0.0001;
  scene.add(sun);
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(200, 200),
    new THREE.ShadowMaterial({ opacity: 0.13 }),
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -0.74;
  floor.receiveShadow = true;
  scene.add(floor);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.07;
  controls.enablePan = false;
  controls.minDistance = 15;
  controls.maxDistance = 48;
  controls.minPolarAngle = 0.28;
  controls.maxPolarAngle = Math.PI / 2.2;
  controls.maxAzimuthAngle = Math.PI * 0.8;
  controls.minAzimuthAngle = -Math.PI * 0.8;
  controls.target.set(0, 0.5, 0);
  controls.mouseButtons = {
    LEFT: THREE.MOUSE.ROTATE,
    MIDDLE: THREE.MOUSE.DOLLY,
    RIGHT: THREE.MOUSE.ROTATE,
  };
  const world = await buildClubhouse(scene),
    robot = world.robot;
  let exploring = false,
    active = true,
    alive = true,
    goal = null,
    last = 0,
    lastStep = 0,
    pointerDown = null,
    frame = 0,
    follow = false,
    gamepadDirection = { x: 0, z: 0 },
    dirty = true;
  const keys = new Set(),
    raycaster = new THREE.Raycaster(),
    pointer = new THREE.Vector2(),
    ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0),
    point = new THREE.Vector3();
  function home() {
    const mobile = canvas.clientWidth < 700;
    camera.position.set(mobile ? 26 : 15, mobile ? 27 : 18, mobile ? 32 : 22);
    controls.target.set(0, -0.5, 0);
    controls.update();
    follow = false;
    dirty = true;
  }
  function resize() {
    const width = canvas.clientWidth,
      height = canvas.clientHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    dirty = true;
  }
  home();
  resize();
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  controls.addEventListener("change", () => {
    dirty = true;
  });
  const labelNodes = [...labels.querySelectorAll("[data-landmark]")];
  labelNodes.forEach((node) =>
    node.addEventListener("click", () => {
      audio.play("click");
      onOpen(node.dataset.landmark);
    }),
  );
  const canMove = (x, z) =>
    Math.abs(x) < 11.1 &&
    Math.abs(z) < 6.15 &&
    !world.obstacles.some(
      (o) =>
        Math.abs(x - o.x) < o.w / 2 + 0.38 &&
        Math.abs(z - o.z) < o.d / 2 + 0.38,
    );
  function beginExplore() {
    exploring = true;
    canvas.dataset.exploring = "true";
    canvas.focus({ preventScroll: true });
  }
  const moveKey = (key) =>
    [
      "w",
      "a",
      "s",
      "d",
      "arrowup",
      "arrowdown",
      "arrowleft",
      "arrowright",
    ].includes(key);
  function keydown(event) {
    if (!active || document.activeElement !== canvas || !exploring) return;
    const key = event.key.toLowerCase();
    if (moveKey(key) || key === " ") event.preventDefault();
    keys.add(key);
    goal = null;
    if (key === "e" || key === "enter") {
      const closest = Object.entries(world.anchors)
        .map(([id, p]) => ({
          id,
          distance: Math.hypot(p.x - robot.position.x, p.z - robot.position.z),
        }))
        .sort((a, b) => a.distance - b.distance)[0];
      if (closest.distance < 3.5) onOpen(closest.id);
    }
    if (key === "r") {
      robot.position.set(0.2, 0.05, 0.7);
      home();
    }
  }
  canvas.addEventListener("keydown", keydown);
  canvas.addEventListener("keyup", (event) =>
    keys.delete(event.key.toLowerCase()),
  );
  canvas.addEventListener("blur", () => keys.clear());
  canvas.addEventListener("pointerdown", (event) => {
    pointerDown = { x: event.clientX, y: event.clientY };
  });
  canvas.addEventListener("pointerup", (event) => {
    if (
      !pointerDown ||
      Math.hypot(event.clientX - pointerDown.x, event.clientY - pointerDown.y) >
        7 ||
      !active
    )
      return;
    pointerDown = null;
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      (-(event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(pointer, camera);
    for (const hit of raycaster.intersectObjects(scene.children, true)) {
      let node = hit.object;
      while (node && !node.userData.panel) node = node.parent;
      if (node?.userData.panel) {
        audio.play("click");
        onOpen(node.userData.panel);
        return;
      }
    }
    beginExplore();
    if (
      raycaster.ray.intersectPlane(ground, point) &&
      canMove(point.x, point.z)
    )
      goal = point.clone();
  });
  const visibility = () => {
    if (document.hidden) {
      keys.clear();
      gamepadDirection = { x: 0, z: 0 };
    }
  };
  document.addEventListener("visibilitychange", visibility);
  const touchButtons = document.querySelectorAll("[data-move]");
  touchButtons.forEach((button) => {
    const stop = () => {
      gamepadDirection = { x: 0, z: 0 };
    };
    button.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      beginExplore();
      button.setPointerCapture(event.pointerId);
      const axis = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }[
        button.dataset.move
      ];
      gamepadDirection = { x: axis[0], z: axis[1] };
    });
    button.addEventListener("pointerup", stop);
    button.addEventListener("pointercancel", stop);
    button.addEventListener("lostpointercapture", stop);
  });
  function update(now) {
    if (!alive) return;
    frame = requestAnimationFrame(update);
    const dt = Math.min((now - last) / 1000 || 0, 0.04);
    last = now;
    if (!active || document.hidden) return;
    let dx =
      Number(keys.has("d") || keys.has("arrowright")) -
      Number(keys.has("a") || keys.has("arrowleft")) +
      gamepadDirection.x;
    let dz =
      Number(keys.has("s") || keys.has("arrowdown")) -
      Number(keys.has("w") || keys.has("arrowup")) +
      gamepadDirection.z;
    if (goal && !dx && !dz) {
      dx = goal.x - robot.position.x;
      dz = goal.z - robot.position.z;
      if (Math.hypot(dx, dz) < 0.15) {
        goal = null;
        dx = dz = 0;
      }
    }
    const distance = Math.hypot(dx, dz);
    if (exploring && distance > 0.01) {
      dx /= distance;
      dz /= distance;
      const speed = keys.has("shift") ? 5.5 : 3.5;
      const x = robot.position.x + dx * dt * speed,
        z = robot.position.z + dz * dt * speed;
      let moved = false;
      if (canMove(x, robot.position.z)) {
        robot.position.x = x;
        moved = true;
      }
      if (canMove(robot.position.x, z)) {
        robot.position.z = z;
        moved = true;
      }
      if (!moved) goal = null;
      robot.rotation.y = Math.atan2(dx, dz);
      world.animated.forEach((wheel) => (wheel.rotation.x += dt * speed * 3));
      if (moved && now - lastStep > 340) {
        audio.play("step");
        lastStep = now;
      }
      canvas.dataset.position = `${robot.position.x.toFixed(2)},${robot.position.z.toFixed(2)}`;
      dirty = true;
    }
    if (follow) {
      const target = new THREE.Vector3(robot.position.x, 1, robot.position.z);
      controls.target.lerp(target, 0.025);
    }
    controls.update();
    if (world.room.userData.dirty) {
      dirty = true;
      world.room.userData.dirty = false;
    }
    if (!dirty) return;
    dirty = false;
    labelNodes.forEach((node) => {
      const anchor = world.anchors[node.dataset.landmark];
      if (!anchor) return;
      const projected = anchor.clone().project(camera);
      const x = (projected.x * 0.5 + 0.5) * canvas.clientWidth,
        y = (-projected.y * 0.5 + 0.5) * canvas.clientHeight;
      node.style.left = x + "px";
      node.style.top = y + "px";
      node.hidden =
        projected.z > 1 ||
        x < 12 ||
        x > canvas.clientWidth - 12 ||
        y < 10 ||
        y > canvas.clientHeight - 10;
    });
    renderer.render(scene, camera);
    canvas.dataset.camera = camera.position
      .toArray()
      .map((n) => n.toFixed(2))
      .join(",");
  }
  canvas.addEventListener("webglcontextlost", (event) => {
    event.preventDefault();
    active = false;
    onReady(false);
  });
  frame = requestAnimationFrame(update);
  canvas.dataset.ready = "true";
  canvas.dataset.position = ".20,.70";
  onReady(true, world.failedModels);
  return {
    explore: beginExplore,
    home() {
      robot.position.set(0.2, 0.05, 0.7);
      goal = null;
      home();
    },
    setActive(value) {
      active = value;
      dirty = true;
      controls.enabled = value;
      if (!value) {
        keys.clear();
        gamepadDirection = { x: 0, z: 0 };
      }
    },
    setQuality(low) {
      renderer.setPixelRatio(low ? 1 : Math.min(devicePixelRatio, 1.65));
      renderer.shadowMap.enabled = !low;
      resize();
    },
    toggleFollow() {
      follow = !follow;
      dirty = true;
      if (follow) {
        const offset = camera.position
          .clone()
          .sub(controls.target)
          .normalize()
          .multiplyScalar(19);
        controls.target.copy(robot.position);
        camera.position.copy(robot.position).add(offset);
      }
      return follow;
    },
    dispose() {
      alive = false;
      cancelAnimationFrame(frame);
      observer.disconnect();
      controls.dispose();
      renderer.dispose();
      document.removeEventListener("visibilitychange", visibility);
    },
  };
}
