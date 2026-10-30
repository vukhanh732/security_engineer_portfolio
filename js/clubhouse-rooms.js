import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { buildDestination } from "./clubhouse-objects.js?v=20261030-rooms1";

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
  function sign(text, w, h, x, y, z, rotation = 0, parent = root) {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 256;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = COLORS.trim;
    ctx.fillRect(0, 0, 1024, 256);
    ctx.fillStyle = COLORS.dark;
    ctx.font = "600 62px Arial";
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
  return { box, sign, mat };
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
function daylight(root, points, y) {
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
      opacity: 0.18,
      depthWrite: false,
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.y = y;
  root.add(mesh);
}
function windowPane(b, x, bottom, w, h, z) {
  b.box(w + 0.08, h + 0.08, 0.035, x, bottom + h / 2, z - 0.28, COLORS.sky);
  for (let i = 0; i < 5; i++) {
    const height = 0.35 + (i % 3) * 0.21;
    b.box(
      w / 6,
      height,
      0.025,
      x - w * 0.4 + i * w * 0.2,
      bottom + height / 2,
      z - 0.23,
      i % 2 ? "#a6bcb7" : COLORS.distant,
    );
  }
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
  b.box(w + 0.45, 0.13, 0.55, x, bottom - 0.15, z + 0.13, COLORS.trim);
}
function bookshelf(b) {
  const x = -4.65,
    z = -4.95,
    floorY = -3,
    w = 3.2;
  b.box(w, 5.7, 0.12, x, floorY + 2.85, z - 0.27, COLORS.wood);
  for (const side of [-1, 1])
    b.box(0.14, 5.8, 0.72, x + (side * w) / 2, floorY + 2.9, z, COLORS.wood);
  for (let row = 0; row <= 4; row++) {
    const y = floorY + 0.12 + row * 1.36;
    b.box(w + 0.16, 0.14, 0.76, x, y, z, COLORS.wood);
    if (row === 4) continue;
    for (let i = 0; i < 8; i++) {
      const width = 0.17 + ((i + row) % 3) * 0.03,
        height = 0.72 + ((i * 3 + row) % 4) * 0.1;
      const bx = x - 1.33 + i * 0.33;
      const book = b.box(
        width,
        height,
        0.48,
        bx,
        y + 0.075 + height / 2,
        z + 0.05,
        [COLORS.teal, COLORS.copper, COLORS.paper, COLORS.dark, "#7e8970"][
          (i + row) % 5
        ],
      );
      if (i === 7) book.rotation.z = -0.12;
      b.box(
        width * 0.7,
        0.035,
        0.014,
        bx,
        y + height * 0.7,
        z + 0.298,
        COLORS.trim,
      );
    }
  }
}
function doorway(root, b, { x, z, floorY, destination, label, side }) {
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
  desk.getObjectByName("Background")?.removeFromParent();
  const root = new THREE.Group();
  root.name = "study-architecture";
  const b = builder(root);
  floor(root, b, { x: 0.5, z: 0.3, w: 14, d: 11.6, y: -3.01 });
  // North wall is built around two actual openings, rather than covered with a picture.
  b.box(14, 2.7, 0.18, 0.5, -1.65, -5.5, COLORS.wall);
  b.box(14, 1.5, 0.18, 0.5, 3.45, -5.5, COLORS.wall);
  for (const [left, right] of [
    [-6.5, -2.4],
    [1.4, 2.85],
    [5.35, 7.5],
  ])
    b.box(right - left, 3, 0.18, (left + right) / 2, 1.2, -5.5, COLORS.wall);
  windowPane(b, -0.5, -0.3, 3.8, 3, -5.38);
  windowPane(b, 4.1, -0.3, 2.5, 3, -5.38);
  b.box(0.18, 7.2, 6.9, 7.5, 0.6, -2.05, COLORS.side);
  b.box(0.18, 7.2, 2.3, 7.5, 0.6, 4.95, COLORS.side);
  b.box(0.18, 2.6, 2.4, 7.5, 2.9, 2.6, COLORS.side);
  b.box(14, 0.16, 0.2, 0.5, -2.87, -5.35, COLORS.trim);
  for (const [depth, z] of [
    [6.9, -2.05],
    [2.3, 4.95],
  ])
    b.box(0.2, 0.16, depth, 7.35, -2.87, z, COLORS.trim);
  bookshelf(b);
  daylight(
    root,
    [
      [-2.0, -5.2],
      [1.4, -5.2],
      [-0.5, 3.8],
      [-4.8, 3.8],
    ],
    -2.982,
  );
  daylight(
    root,
    [
      [3.0, -5.2],
      [5.3, -5.2],
      [3.5, 2.9],
      [0.7, 2.9],
    ],
    -2.981,
  );
  shadow(root, -0.6, 0.7, 9.2, 5.6, -2.975);
  shadow(root, 0.8, 2.7, 3.5, 3.6, -2.974);
  shadow(root, 3.7, 0.1, 2.8, 2.8, -2.973);
  root.userData.portal = doorway(root, b, {
    x: 7.4,
    z: 1.4,
    floorY: -3,
    destination: "hobbies",
    label: "Explore my hobbies",
    side: -1,
  });
  batchStatic(root);
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
  root.userData.cutaways = [
    { group: west, x: -7.6 },
    { group: east, x: 11.3, side: -1 },
    { group: cardWall, x: 2.65 },
  ];
  for (const [left, right] of [
    [2.65, 4.8],
    [7.1, 11.3],
  ])
    b.box(right - left, 2.7, 0.16, (left + right) / 2, 1.35, 1.3, COLORS.side);
  b.box(2.3, 0.16, 0.24, 5.95, 2.78, 1.3, COLORS.trim);
  b.box(6.2, 0.02, 6.3, 6.6, 0.025, 5.25, "#87928a");
  const lounge = buildDestination("lounge");
  lounge.position.set(6.4, 0.05, 5.1);
  root.add(lounge);
  b.box(2.3, 0.9, 0.6, 9.8, 0.45, 5.8, COLORS.wood);
  b.box(0.75, 0.16, 0.45, 9.8, 1.0, 5.8, COLORS.paper);
  travel(
    b.sign("Card room", 2.5, 0.55, 5.95, 3.1, 1.42),
    "lounge",
    "Explore the card room",
  );
  travel(b.sign("The gym", 2.7, 0.6, 6, 3.2, -9.82), "gym", "Explore the gym");
  const matchSign = b.sign("One more rally?", 3.2, 0.65, -2, 3.2, -9.82);
  matchSign.userData.interaction = {
    type: "app",
    destination: "badminton",
    label: "Play badminton",
  };
  daylight(
    root,
    [
      [-5.5, -9.7],
      [-1.8, -9.7],
      [0, 3],
      [-4, 3],
    ],
    0.018,
  );
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
