import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { buildDestination } from "./clubhouse-objects.js?v=20261031-door1";

// Original room architecture. Everything here is geometry or a small canvas
// texture, so the licensed desk's six artwork downloads remain the full budget.
const COLORS = {
  wall: "#d9ddd5",
  side: "#bfccc9",
  trim: "#ece7d8",
  floor: "#ad9a81",
  wood: "#826e54",
  dark: "#304b50",
  teal: "#416c70",
  copper: "#b67450",
  paper: "#ded5bc",
  sky: "#c5dce0",
  distant: "#8fadb1",
  green: "#6b866c",
};
function builder(root) {
  const materials = new Map();
  function mat(color) {
    if (!materials.has(color))
      materials.set(color, new THREE.MeshBasicMaterial({ color }));
    return materials.get(color);
  }
  function box(w, h, d, x, y, z, color, parent = root) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat(color));
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
  function sign(
    text,
    w,
    h,
    x,
    y,
    z,
    rotation = 0,
    parent = root,
    fontSize = 62,
  ) {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = COLORS.trim;
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = COLORS.dark;
    ctx.font = `600 ${fontSize}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(text, 512, 132, 950);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map }),
    );
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotation;
    parent.add(mesh);
    return mesh;
  }
  return { box, sign, mat, add: (object) => root.add(object) };
}
function travel(mesh, destination, label) {
  mesh.userData.interaction = { type: "travel", destination, label };
  return mesh;
}
// Batch only static meshes that share materials and attributes. Interactive
// surfaces and moving doors retain their own geometry for accurate picking.
function batchStatic(root) {
  root.updateMatrixWorld(true);
  const inverse = root.matrixWorld.clone().invert(),
    batches = new Map();
  root.traverse((mesh) => {
    if (
      !mesh.isMesh ||
      Array.isArray(mesh.material) ||
      mesh.userData.interaction
    )
      return;
    for (let parent = mesh; parent && parent !== root; parent = parent.parent)
      if (parent.userData.dynamic) return;
    const key =
      mesh.material.uuid + Object.keys(mesh.geometry.attributes).sort().join();
    if (!batches.has(key)) batches.set(key, []);
    batches.get(key).push(mesh);
  });
  for (const meshes of batches.values()) {
    if (meshes.length < 2) continue;
    const geometries = meshes.map((mesh) => {
      let geometry = mesh.geometry.clone();
      if (geometry.index) {
        const flat = geometry.toNonIndexed();
        geometry.dispose();
        geometry = flat;
      }
      geometry.applyMatrix4(inverse.clone().multiply(mesh.matrixWorld));
      return geometry;
    });
    const geometry = mergeGeometries(geometries);
    geometries.forEach((g) => g.dispose());
    if (!geometry) continue;
    const batch = new THREE.Mesh(geometry, meshes[0].material);
    batch.name = "room-static-batch";
    root.add(batch);
    meshes.forEach((mesh) => {
      mesh.removeFromParent();
      mesh.geometry.dispose();
    });
  }
}
function floor(root, b, { x, z, w, d, y = 0 }) {
  b.box(w, 0.18, d, x, y - 0.1, z, COLORS.wood);
  const count = Math.ceil(w / 0.7),
    width = w / count;
  for (let i = 0; i < count; i++) {
    const color = ["#b3a18a", "#ac9981", "#b8a58e", "#b09e86"][i % 4];
    b.box(
      width - 0.015,
      0.022,
      d - 0.04,
      x - w / 2 + (i + 0.5) * width,
      y,
      z,
      color,
    );
  }
}
let shadowMap;
function shadow(root, x, z, w, d, y) {
  if (!shadowMap) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const ctx = c.getContext("2d"),
      gradient = ctx.createRadialGradient(64, 64, 8, 64, 64, 63);
    gradient.addColorStop(0, "#162e3260");
    gradient.addColorStop(1, "#162e3200");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 128, 128);
    shadowMap = new THREE.CanvasTexture(c);
  }
  const mesh = new THREE.Mesh(
    new THREE.PlaneGeometry(w, d),
    new THREE.MeshBasicMaterial({
      map: shadowMap,
      transparent: true,
      depthWrite: false,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.set(x, y, z);
  root.add(mesh);
}
function daylight(root, points, y, opacity = 0.24) {
  const shape = new THREE.Shape();
  points.forEach(([x, z], i) =>
    i ? shape.lineTo(x, -z) : shape.moveTo(x, -z),
  );
  shape.closePath();
  const mesh = new THREE.Mesh(
    new THREE.ShapeGeometry(shape),
    new THREE.MeshBasicMaterial({
      color: "#fff3d0",
      transparent: true,
      opacity,
      depthWrite: false,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  root.add(mesh);
}
function windowPane(b, x, bottom, w, h, z) {
  b.box(w + 0.08, h + 0.08, 0.035, x, bottom + h / 2, z - 0.62, COLORS.sky);
  for (let i = 0; i < 5; i++) {
    const height = 0.35 + (i % 3) * 0.21;
    b.box(
      w / 6,
      height,
      0.025,
      x - w * 0.4 + i * w * 0.2,
      bottom + height / 2,
      z - 0.57,
      i % 2 ? "#a6bcb7" : COLORS.distant,
    );
  }
  // Recessed reveals, shaded jambs and a projecting sill give the glazing depth.
  for (const side of [-1, 1]) {
    b.box(
      0.16,
      h + 0.18,
      0.64,
      x + side * (w / 2 + 0.025),
      bottom + h / 2,
      z - 0.23,
      side < 0 ? "#e4dcc5" : "#9daea7",
    );
    b.box(
      0.04,
      h,
      0.035,
      x + side * (w / 2 - 0.06),
      bottom + h / 2,
      z - 0.48,
      "#d9e4dd",
    );
  }
  b.box(w, 0.13, 0.64, x, bottom + h + 0.02, z - 0.23, "#a5b5ad");
  b.box(w + 0.36, 0.1, 0.72, x, bottom - 0.08, z - 0.12, "#e4dcc5");
  for (const side of [-1, 1])
    b.box(
      0.14,
      h + 0.25,
      0.23,
      x + side * (w / 2 + 0.04),
      bottom + h / 2,
      z,
      COLORS.trim,
    );
  for (const height of [bottom - 0.04, bottom + h + 0.04])
    b.box(w + 0.3, 0.14, 0.23, x, height, z, COLORS.trim);
  b.box(0.075, h, 0.15, x, bottom + h / 2, z + 0.04, COLORS.trim);
  b.box(w, 0.065, 0.15, x, bottom + h * 0.58, z + 0.04, COLORS.trim);
  b.box(w + 0.45, 0.18, 0.85, x, bottom - 0.15, z + 0.2, COLORS.trim);
  b.box(w + 0.4, 0.045, 0.07, x, bottom - 0.28, z + 0.52, "#9ba79c");
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(w - 0.06, h - 0.05),
    new THREE.MeshBasicMaterial({
      color: "#eef7ed",
      transparent: true,
      opacity: 0.14,
      depthWrite: false,
    }),
  );
  glass.position.set(x, bottom + h / 2, z - 0.46);
  b.box(0.04, h, 0.1, x, bottom + h / 2, z - 0.38, "#f8f2db");
  // A broad reflection is clipped to the pane and stays behind the mullions.
  const reflection = new THREE.Mesh(
    new THREE.PlaneGeometry(w * 0.22, h - 0.08),
    new THREE.MeshBasicMaterial({
      color: "#fff9df",
      transparent: true,
      opacity: 0.18,
      depthWrite: false,
    }),
  );
  glass.add(reflection);
  reflection.position.set(-w * 0.22, 0, 0.02);
  // builder owns the same parent as its boxes.
  b.add(glass);
}
function windowLight(root, x, width, wallZ, floorY, length, skew) {
  for (let col = 0; col < 2; col++)
    for (let row = 0; row < 2; row++) {
      const near = (row * 0.5 + 0.025) * length,
        far = ((row + 1) * 0.5 - 0.025) * length;
      const left = x - width / 2 + col * width * 0.5 + 0.07,
        right = left + width * 0.5 - 0.14;
      daylight(
        root,
        [
          [left + skew * near, wallZ + near],
          [right + skew * near, wallZ + near],
          [right + skew * far, wallZ + far],
          [left + skew * far, wallZ + far],
        ],
        floorY,
        0.26 - row * 0.065,
      );
    }
}
function doorway(
  root,
  b,
  { x, z, floorY, destination, label, side, insetLabel = false },
) {
  const leaf = new THREE.Group();
  leaf.name = destination + "-door";
  leaf.userData.dynamic = true;
  leaf.position.set(x, floorY, z);
  root.add(leaf);
  const panel = b.box(0.16, 4.5, 2.25, 0, 2.25, 1.125, COLORS.teal, leaf);
  for (const y of [1.05, 3.0])
    b.box(0.035, 1.45, 1.68, side * 0.096, y, 1.125, COLORS.dark, leaf);
  b.box(0.22, 0.11, 0.35, side * 0.17, 2.12, 1.92, COLORS.copper, leaf);
  leaf.traverse((mesh) => {
    if (mesh.isMesh) travel(mesh, destination, label);
  });
  for (const dz of [-0.1, 2.4])
    travel(
      b.box(0.32, 4.75, 0.16, x, floorY + 2.375, z + dz, COLORS.trim),
      destination,
      label,
    );
  travel(
    b.box(0.32, 0.18, 2.65, x, floorY + 4.76, z + 1.15, COLORS.trim),
    destination,
    label,
  );
  if (insetLabel) {
    travel(
      b.sign(
        "Hobbies",
        1.65,
        0.38,
        side * 0.1,
        4.0,
        1.125,
        (side * Math.PI) / 2,
        leaf,
        160,
      ),
      destination,
      label,
    );
  } else
    travel(
      b.sign(
        label,
        3.25,
        0.64,
        x + side * 0.18,
        floorY + 5.45,
        z + 1.15,
        (side * Math.PI) / 2,
      ),
      destination,
      label,
    );
  let motion = null,
    angle = 0;
  function setOpen(open, immediate = false) {
    const target = open ? (-side * Math.PI) / 2 : 0;
    if (immediate) {
      angle = target;
      leaf.rotation.y = angle;
      motion = null;
    } else if (target !== angle)
      motion = { from: angle, to: target, start: performance.now() };
  }
  return {
    setOpen,
    update(now) {
      if (!motion) return false;
      const t = Math.min(1, (now - motion.start) / 400),
        ease = t * t * (3 - 2 * t);
      angle = motion.from + (motion.to - motion.from) * ease;
      leaf.rotation.y = angle;
      if (t === 1) motion = null;
      return !!motion;
    },
    finishMotion() {
      if (motion) {
        angle = motion.to;
        leaf.rotation.y = angle;
        motion = null;
      }
    },
  };
}

export function buildStudyRoom(desk) {
  // The licensed cyclorama already carries the office's baked contact and
  // directional shadows. Keep it intact: a floor/light field suggests the room.
  const root = new THREE.Group();
  root.name = "office-hobbies-door";
  const b = builder(root);
  const frame = new THREE.Group();
  frame.rotation.y = Math.PI / 2;
  frame.position.set(5.4, 0, -2.3);
  root.add(frame);
  const fb = builder(frame);
  root.userData.portal = doorway(frame, fb, {
    x: 0,
    z: 0,
    floorY: -2.98,
    destination: "hobbies",
    label: "Explore my hobbies",
    side: -1,
    insetLabel: true,
  });
  for (const z of [-0.1, 2.4]) fb.box(0.65, 0.1, 0.4, 0, -2.93, z, COLORS.dark);
  shadow(root, 6.5, -1.4, 3.6, 3.4, -2.978);
  desk.add(root);
  desk.userData.portal = root.userData.portal;
  return desk;
}

export function buildHobbiesRoom() {
  const root = new THREE.Group();
  root.name = "hobbies";
  const b = builder(root);
  floor(root, b, { x: 1.85, z: -0.5, w: 18.9, d: 19 });
  // The west/near sides are cut away for a clear, dollhouse-like overview.
  b.box(18.9, 3.8, 0.18, 1.85, 1.9, -10, COLORS.wall);
  b.box(18.9, 1.1, 0.18, 1.85, 5.85, -10, COLORS.wall);
  for (const [left, right] of [
    [-7.6, -4.75],
    [-2.25, -1.25],
    [1.25, 3.95],
    [6.45, 7.15],
    [9.65, 11.3],
  ])
    b.box(right - left, 1.5, 0.18, (left + right) / 2, 4.55, -10, COLORS.wall);
  const east = new THREE.Group();
  east.userData.dynamic = true;
  root.add(east);
  b.box(0.18, 6.4, 19, 11.3, 3.2, -0.5, COLORS.side, east);
  const west = new THREE.Group();
  west.userData.dynamic = true;
  root.add(west);
  const wb = builder(west);
  wb.box(0.18, 5.8, 12, -7.6, 2.9, -4, COLORS.side);
  wb.box(0.18, 5.8, 4.6, -7.6, 2.9, 6.7, COLORS.side);
  wb.box(0.18, 1.2, 2.4, -7.6, 5.2, 3.2, COLORS.side);
  b.box(18.9, 0.16, 0.2, 1.85, 0.12, -9.85, COLORS.trim);
  b.box(18.9, 0.16, 0.24, 1.85, 6.34, -9.85, COLORS.trim);
  for (const x of [-7.2, 2.6, 10.9]) {
    b.box(0.25, 6.3, 0.23, x, 3.15, -9.78, "#b3c1b7");
    b.box(0.38, 0.2, 0.32, x, 0.14, -9.73, COLORS.trim);
  }
  b.box(0.22, 0.16, 19, 11.15, 0.12, -0.5, COLORS.trim, east);
  // A dedicated rubber floor and wood threshold give the lifting area its own finish.
  b.box(7.1, 0.025, 7.6, 6.5, 0.025, -4.8, "#73837b");
  for (const x of [3, 10]) b.box(0.06, 0.03, 7.6, x, 0.045, -4.8, COLORS.trim);
  for (const z of [-8.57, -1.03])
    b.box(7.1, 0.03, 0.06, 6.5, 0.045, z, COLORS.trim);
  // High clerestory glazing and a wall clock keep the hall airy.
  for (const x of [-3.5, 0, 5.2, 8.4]) windowPane(b, x, 3.8, 2.5, 1.5, -9.88);
  const court = buildDestination("badminton");
  court.position.set(-2.0, 0.035, -0.6);
  root.add(court);
  const gym = buildDestination("gym");
  gym.position.set(6, 0.035, -4.5);
  root.add(gym);
  // A low cutaway partition defines an actual side room without hiding the table.
  const cardWall = new THREE.Group();
  cardWall.userData.dynamic = true;
  root.add(cardWall);
  b.box(0.16, 2.7, 7.7, 2.65, 1.35, 5.15, COLORS.side, cardWall);
  b.box(0.22, 0.12, 7.78, 2.65, 2.76, 5.15, COLORS.wood, cardWall);
  b.box(0.2, 0.16, 7.7, 2.65, 0.12, 5.15, COLORS.trim, cardWall);
  root.userData.cutaways = [
    { group: west, x: -7.6 },
    { group: east, x: 11.3, side: -1 },
    { group: cardWall, x: 2.65 },
  ];
  for (const [left, right] of [
    [2.65, 4.8],
    [7.1, 11.3],
  ]) {
    b.box(right - left, 2.7, 0.16, (left + right) / 2, 1.35, 1.3, COLORS.side);
    b.box(right - left, 0.12, 0.22, (left + right) / 2, 2.76, 1.3, COLORS.wood);
    b.box(right - left, 0.16, 0.2, (left + right) / 2, 0.12, 1.4, COLORS.trim);
  }
  b.box(2.3, 0.16, 0.24, 5.95, 2.78, 1.3, COLORS.trim);
  b.box(6.2, 0.02, 6.3, 6.6, 0.025, 5.25, "#87928a");
  const lounge = buildDestination("lounge");
  lounge.scale.setScalar(1.25);
  lounge.position.set(6.4, 0.05, 5.1);
  root.add(lounge);
  b.box(2.3, 0.9, 0.6, 9.8, 0.45, 5.8, COLORS.wood);
  b.box(0.75, 0.16, 0.45, 9.8, 1.0, 5.8, COLORS.paper);
  for (const y of [0.25, 0.58]) {
    b.box(2.1, 0.28, 0.025, 9.8, y, 6.12, "#9d8869");
    for (const x of [9.3, 10.3])
      b.box(0.23, 0.035, 0.055, x, y + 0.04, 6.16, COLORS.copper);
  }
  shadow(root, 6.4, 5.1, 5.4, 4.8, 0.052);
  // Court equipment stays with the bench; a pair of rackets signals the activity.
  for (const offset of [0, 0.24]) {
    const racket = new THREE.Mesh(
      new THREE.TorusGeometry(0.2, 0.016, 6, 24),
      new THREE.MeshStandardMaterial({
        color: "#e7e0cb",
        metalness: 0.35,
        roughness: 0.35,
      }),
    );
    racket.rotation.x = -Math.PI / 2;
    racket.position.set(1.64 + offset, 0.6, 3.25 + offset);
    root.add(racket);
    b.box(0.035, 0.035, 0.38, 1.64 + offset, 0.6, 3.65 + offset, COLORS.copper);
  }
  b.box(0.48, 0.34, 0.62, 1.7, 0.7, 4.35, COLORS.teal);
  b.box(0.24, 0.07, 0.42, 1.7, 0.91, 4.35, COLORS.trim);
  // Warm wall lamps and a simple morning clock finish the far wall.
  for (const x of [-2, 6]) {
    b.box(1.3, 0.12, 0.4, x, 3.8, -9.63, COLORS.dark);
    b.box(1.05, 0.045, 0.28, x, 3.72, -9.59, "#fff0c9");
  }
  const clock = new THREE.Mesh(
    new THREE.CylinderGeometry(0.43, 0.43, 0.08, 36),
    b.mat(COLORS.trim),
  );
  clock.rotation.x = Math.PI / 2;
  clock.position.set(2.6, 4.9, -9.64);
  root.add(clock);
  for (let i = 0; i < 12; i++) {
    const a = (i * Math.PI) / 6;
    const tick = b.box(
      0.035,
      0.075,
      0.025,
      2.6 + Math.sin(a) * 0.34,
      4.9 + Math.cos(a) * 0.34,
      -9.58,
      COLORS.dark,
    );
    tick.rotation.z = -a;
  }
  b.box(0.26, 0.035, 0.03, 2.49, 4.9, -9.55, COLORS.dark);
  b.box(0.035, 0.28, 0.035, 2.6, 5.02, -9.53, COLORS.copper);
  travel(
    b.sign("Card room", 2.5, 0.55, 5.95, 3.1, 1.42),
    "lounge",
    "Explore the card room",
  );
  travel(b.sign("The gym", 2.7, 0.6, 6, 3.2, -9.82), "gym", "Explore the gym");
  const matchSign = b.sign("Badminton", 3.2, 0.65, -2, 3.2, -9.82);
  matchSign.userData.interaction = {
    type: "app",
    destination: "badminton",
    label: "Play badminton",
  };
  windowLight(root, -3.5, 2.5, -9.7, 0.018, 12, 0.2);
  windowLight(root, 5.2, 2.5, -9.7, 0.017, 8, 0.14);
  root.userData.portal = doorway(west, wb, {
    x: -7.5,
    z: 2.0,
    floorY: 0,
    destination: "study",
    label: "Back to my study",
    side: 1,
  });
  batchStatic(root);
  return root;
}
