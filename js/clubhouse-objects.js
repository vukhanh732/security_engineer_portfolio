import * as THREE from "three";
import { OBJLoader } from "./vendor/OBJLoader.js";
import { MTLLoader } from "./vendor/MTLLoader.js";

const palette = {
  wood: "#b68a59",
  woodDark: "#795a3d",
  metal: "#d6d9cf",
  metalDark: "#303f38",
  carpet: "#335649",
  plant: "#467451",
  fabric: "#a8b49b",
  glass: "#c5d6ca",
};
const mat = (color, roughness = 0.8) =>
  new THREE.MeshStandardMaterial({ color, roughness });
const materials = {
  floor: mat("#c9c9b9"),
  wall: mat("#d8d6c8"),
  wood: mat("#ad8053"),
  dark: mat("#263c32"),
  green: mat("#31594b"),
  cream: mat("#eeeadd"),
  rust: mat("#b94c30"),
  line: mat("#e0e4ce"),
  black: mat("#30332e"),
  metal: mat("#9baba3", 0.4),
};
function box(parent, width, height, depth, x, y, z, material) {
  const mesh = new THREE.Mesh(
    new THREE.BoxGeometry(width, height, depth),
    material,
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function cylinder(parent, radius, height, x, y, z, material, segments = 24) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radius, radius, height, segments),
    material,
  );
  mesh.position.set(x, y, z);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  parent.add(mesh);
  return mesh;
}
function labelTexture(lines, background = "#243e34", color = "#edf0dc") {
  const canvas = document.createElement("canvas");
  canvas.width = 512;
  canvas.height = 320;
  const c = canvas.getContext("2d");
  c.fillStyle = background;
  c.fillRect(0, 0, 512, 320);
  c.fillStyle = color;
  c.font = "bold 46px sans-serif";
  c.fillText(lines[0], 34, 94);
  c.font = "23px sans-serif";
  lines.slice(1).forEach((line, i) => c.fillText(line, 34, 158 + i * 44));
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
const cache = new Map();
async function furniture(name) {
  if (!cache.has(name))
    cache.set(
      name,
      (async () => {
        const mtl = await new MTLLoader().loadAsync(
          `assets/models/${name}.mtl`,
        );
        mtl.preload();
        const object = await new OBJLoader()
          .setMaterials(mtl)
          .loadAsync(`assets/models/${name}.obj`);
        object.traverse((child) => {
          if (!child.isMesh) return;
          child.castShadow = true;
          child.receiveShadow = true;
          const convert = (source) =>
            new THREE.MeshStandardMaterial({
              color: palette[source.name] || source.color,
              roughness: 0.8,
              metalness: /metal/.test(source.name) ? 0.15 : 0,
            });
          child.material = Array.isArray(child.material)
            ? child.material.map(convert)
            : convert(child.material);
        });
        const bounds = new THREE.Box3().setFromObject(object),
          center = bounds.getCenter(new THREE.Vector3());
        object.position.set(-center.x, -bounds.min.y, -center.z);
        const root = new THREE.Group();
        root.add(object);
        return root;
      })(),
    );
  return (await cache.get(name)).clone(true);
}
export async function buildClubhouse(scene) {
  const room = new THREE.Group();
  scene.add(room);
  const obstacles = [],
    animated = [];
  const block = (x, z, w, d) => obstacles.push({ x, z, w, d });
  async function prop(name, width, x, y, z, rotation = 0) {
    const object = await furniture(name);
    const size = new THREE.Box3()
      .setFromObject(object)
      .getSize(new THREE.Vector3());
    object.scale.setScalar(width / size.x);
    object.position.set(x, y, z);
    object.rotation.y = rotation;
    if (
      ["desk", "computerScreen", "computerKeyboard", "computerMouse"].includes(
        name,
      )
    )
      object.userData.panel = "projects";
    if (name === "bookcaseOpen")
      object.userData.panel = x < 0 ? "writing" : "experience";
    if (["tableRound", "chairCushion"].includes(name))
      object.userData.panel = "poker";
    if (name === "televisionVintage" || name === "cabinetTelevision")
      object.userData.panel = "braintrain";
    room.add(object);
    return object;
  }
  // Architecture is simple geometry; furniture comes from Kenney's CC0 kit.
  box(room, 24, 0.65, 14, 0, -0.4, 0, materials.floor);
  box(room, 24, 0.25, 0.28, 0, 0.05, -6.8, materials.wood);
  box(room, 24, 1.05, 0.32, 0, 0.52, -6.85, materials.wall);
  box(room, 0.35, 1.05, 14, -11.8, 0.52, 0, materials.wall);
  box(room, 24, 0.3, 0.36, 0, 4.4, -6.8, materials.wall);
  const glass = new THREE.MeshStandardMaterial({
    color: "#a9c3aa",
    transparent: true,
    opacity: 0.15,
    roughness: 0.35,
    side: THREE.DoubleSide,
  });
  for (let x = -11.6; x < 12; x += 3.9) {
    box(room, 0.16, 3.6, 0.2, x, 2.65, -6.8, materials.wood);
    if (x < 10) {
      const pane = new THREE.Mesh(new THREE.PlaneGeometry(3.7, 3.2), glass);
      pane.position.set(x + 1.95, 2.7, -6.81);
      room.add(pane);
    }
  }
  // Timber inset at the workbench and linear floor joints keep the room grounded.
  for (let x = -11.5; x <= 12; x += 2)
    box(room, 0.015, 0.01, 13.7, x, -0.065, 0, materials.wall);
  box(
    room,
    7.8,
    0.018,
    10.7,
    -6.1,
    -0.045,
    0.7,
    materials.green,
  ).userData.panel = "badminton";
  const courtX = -9.75,
    courtZ = -4.4,
    cw = 7.3,
    cd = 10.1;
  const segments = [];
  const courtLine = (x1, z1, x2, z2) =>
    segments.push(x1, -0.015, z1, x2, -0.015, z2);
  for (const x of [courtX, courtX + 0.5, courtX + cw - 0.5, courtX + cw])
    courtLine(x, courtZ, x, courtZ + cd);
  for (const z of [
    courtZ,
    courtZ + 0.65,
    courtZ + cd / 2 - 1.45,
    courtZ + cd / 2 + 1.45,
    courtZ + cd - 0.65,
    courtZ + cd,
  ])
    courtLine(courtX, z, courtX + cw, z);
  courtLine(-6.1, courtZ, -6.1, courtZ + cd / 2 - 1.45);
  courtLine(-6.1, courtZ + cd / 2 + 1.45, -6.1, courtZ + cd);
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(segments, 3),
  );
  room.add(
    new THREE.LineSegments(
      geometry,
      new THREE.LineBasicMaterial({ color: "#f2eed9" }),
    ),
  );
  const netZ = courtZ + cd / 2;
  for (const x of [courtX - 0.2, courtX + cw + 0.2]) {
    cylinder(room, 0.055, 1.58, x, 0.79, netZ, materials.cream);
    cylinder(room, 0.15, 0.09, x, 0.045, netZ, materials.dark);
  }
  const netPoints = [];
  for (let x = courtX; x <= courtX + cw; x += 0.17)
    netPoints.push(x, 0.55, netZ, x, 1.52, netZ);
  for (let y = 0.55; y <= 1.52; y += 0.13)
    netPoints.push(courtX, y, netZ, courtX + cw, y, netZ);
  const netGeometry = new THREE.BufferGeometry();
  netGeometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(netPoints, 3),
  );
  room.add(
    new THREE.LineSegments(
      netGeometry,
      new THREE.LineBasicMaterial({
        color: "#e0e3cf",
        transparent: true,
        opacity: 0.7,
      }),
    ),
  );
  box(room, cw + 0.35, 0.065, 0.045, -6.1, 1.55, netZ, materials.cream);
  block(-6.1, netZ, cw + 0.4, 0.18);
  // A recognizable racket and shuttle at the court edge.
  const racket = new THREE.Group();
  racket.position.set(-2.75, 0.07, 4.6);
  racket.rotation.y = -0.6;
  const hoop = new THREE.Mesh(
    new THREE.TorusGeometry(0.36, 0.025, 7, 32),
    materials.rust,
  );
  hoop.rotation.x = -Math.PI / 2;
  hoop.scale.y = 1.2;
  racket.add(hoop);
  box(racket, 0.055, 0.055, 0.65, 0, 0, 0.64, materials.dark);
  room.add(racket);
  const shuttle = new THREE.Mesh(
    new THREE.ConeGeometry(0.12, 0.3, 10, 1, true),
    materials.cream,
  );
  shuttle.position.set(-3.1, 0.17, 4.8);
  shuttle.rotation.z = 0.65;
  room.add(shuttle);
  // Workbench, bookshelf, lounge and plants use existing downloaded models.
  const jobs = [
    prop("desk", 4.7, -0.1, 0, -5.15),
    prop("computerScreen", 1.25, -0.1, 2.47, -5.1),
    prop("computerKeyboard", 1.1, -0.1, 2.47, -4.45),
    prop("computerMouse", 0.25, 0.75, 2.47, -4.4),
    prop("chairDesk", 1.35, 0.1, 0, -3.25, Math.PI),
    prop("bookcaseOpen", 2.25, -4.5, 0, -5.9),
    prop("books", 1.1, -4.5, 1.7, -5.5),
    prop("lampRoundTable", 0.65, -1.6, 2.47, -5.1),
    prop("plantSmall1", 0.55, 1.7, 2.47, -5.3),
    prop("pottedPlant", 1.1, -10.8, 0, -5.1),
    prop("pottedPlant", 1.15, 10.65, 0, -5.8),
    prop("bookcaseOpen", 2.15, 4.1, 0, -5.9),
    prop("books", 0.85, 4.1, 1.7, -5.5),
    prop("loungeChair", 1.7, 1.2, 0, 3.8, -0.6),
    prop("sideTable", 0.9, 2.55, 0, 4.15),
    prop("plantSmall2", 0.6, 2.55, 0.95, 4.15),
    prop("tableRound", 3.65, 6.1, 0, 0.05),
    prop("chairCushion", 1.1, 3.5, 0, 0.05, -Math.PI / 2),
    prop("chairCushion", 1.1, 8.7, 0, 0.05, Math.PI / 2),
    prop("chairCushion", 1.1, 6.1, 0, 2.55, Math.PI),
    prop("cabinetTelevision", 2.4, 8.2, 0, -5.3),
    prop("televisionVintage", 1.65, 8.2, 0.94, -5.3),
    prop("radio", 0.55, 9.2, 0.94, -5.25),
  ];
  const results = await Promise.allSettled(jobs);
  const failedModels = results.filter((r) => r.status === "rejected").length;
  // Desk display and game cabinet screens carry actual portfolio labels.
  const screen = new THREE.Mesh(
    new THREE.PlaneGeometry(0.95, 0.62),
    new THREE.MeshBasicMaterial({
      map: labelTexture([
        "Vu Luu",
        "Projects / Experience",
        "Software + security",
      ]),
    }),
  );
  screen.position.set(-0.1, 3.03, -4.82);
  room.add(screen);
  const gameScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(1.15, 0.78),
    new THREE.MeshBasicMaterial({
      map: labelTexture([
        "BrainTrain",
        "A project in progress",
        "Take a look around.",
      ]),
    }),
  );
  gameScreen.position.set(8.2, 1.57, -4.74);
  room.add(gameScreen);
  block(-0.1, -5.15, 5, 2.6);
  block(-4.5, -5.8, 2.5, 1.2);
  block(4.1, -5.8, 2.5, 1.2);
  block(8.3, -5.4, 3.2, 1.9);
  block(0.1, -3.25, 1.35, 1.2);
  block(1.2, 3.8, 1.7, 1.7);
  block(3.5, 0.05, 1.1, 1.1);
  block(8.7, 0.05, 1.1, 1.1);
  block(6.1, 2.55, 1.1, 1.1);
  // Felt overlay and existing playing-card artwork sit on the imported table.
  cylinder(
    room,
    1.72,
    0.045,
    6.1,
    1.96,
    0.05,
    materials.green,
    48,
  ).userData.panel = "poker";
  block(6.1, 0.05, 3.75, 3.75);
  const textureLoader = new THREE.TextureLoader();
  for (const [i, card] of [
    "cardSpadesA",
    "cardHeartsK",
    "cardClubsQ",
  ].entries()) {
    const texture = textureLoader.load(`assets/cards/${card}.png`, () => {
      room.userData.dirty = true;
    });
    texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.32, 0.44),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.9 }),
    );
    mesh.rotation.set(-Math.PI / 2, 0, (i - 1) * 0.16);
    mesh.position.set(5.8 + i * 0.3, 1.99, 0.25);
    room.add(mesh);
  }
  for (let i = 0; i < 4; i++)
    for (let j = 0; j < 3 + i; j++)
      cylinder(
        room,
        0.12,
        0.055,
        5.5 + i * 0.32,
        2 + j * 0.055,
        -0.7,
        i % 2 ? materials.cream : materials.rust,
        16,
      );
  // Compact fitness corner: a rack, recognizable dumbbells and a padded bench.
  box(room, 2.5, 0.1, 0.65, 9.3, 1.05, 4.9, materials.dark);
  box(room, 0.12, 1.1, 0.65, 8.15, 0.5, 4.9, materials.dark);
  box(room, 0.12, 1.1, 0.65, 10.45, 0.5, 4.9, materials.dark);
  for (let i = 0; i < 5; i++) {
    const x = 8.4 + i * 0.44;
    const bar = cylinder(room, 0.035, 0.55, x, 1.2, 4.9, materials.metal, 10);
    bar.rotation.x = Math.PI / 2;
    for (const z of [4.65, 5.15]) {
      const weight = cylinder(room, 0.16, 0.14, x, 1.2, z, materials.black, 8);
      weight.rotation.x = Math.PI / 2;
    }
  }
  box(room, 1.2, 0.18, 2, 8.9, 0.68, 3.6, materials.green);
  box(room, 0.65, 0.6, 0.2, 8.9, 0.3, 3, materials.dark);
  box(room, 0.65, 0.6, 0.2, 8.9, 0.3, 4.2, materials.dark);
  block(9, 4.2, 3.5, 2.6);
  // Original little explorer, built only from a handful of reusable primitives.
  const robot = new THREE.Group();
  robot.position.set(0.2, 0.05, 0.7);
  room.add(robot);
  box(robot, 0.58, 0.48, 0.42, 0, 0.4, 0, materials.cream);
  box(robot, 0.52, 0.36, 0.42, 0, 0.83, 0.025, materials.cream);
  box(robot, 0.4, 0.22, 0.025, 0, 0.84, 0.25, materials.dark);
  for (const x of [-0.1, 0.1]) {
    const eye = new THREE.Mesh(
      new THREE.SphereGeometry(0.035, 10, 8),
      materials.cream,
    );
    eye.position.set(x, 0.85, 0.275);
    robot.add(eye);
  }
  for (const x of [-0.36, 0.36]) {
    const wheel = cylinder(robot, 0.23, 0.14, x, 0.23, 0, materials.black, 16);
    wheel.rotation.z = Math.PI / 2;
    animated.push(wheel);
  }
  const antenna = cylinder(
    robot,
    0.018,
    0.19,
    0,
    1.08,
    0.02,
    materials.metal,
    8,
  );
  const tip = new THREE.Mesh(
    new THREE.SphereGeometry(0.045, 8, 8),
    materials.rust,
  );
  tip.position.set(0, 1.2, 0.02);
  robot.add(tip);
  const anchors = {
    projects: new THREE.Vector3(-0.2, 3.7, -4.6),
    experience: new THREE.Vector3(4.05, 3.2, -5.5),
    badminton: new THREE.Vector3(-6.1, 0.6, 3.3),
    poker: new THREE.Vector3(6.1, 2.3, 0.2),
    braintrain: new THREE.Vector3(8.2, 3, -4.8),
    about: new THREE.Vector3(9.2, 1.7, 4.3),
  };
  return { room, robot, obstacles, anchors, animated, failedModels };
}
