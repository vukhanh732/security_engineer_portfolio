import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { ColladaLoader } from "three/addons/loaders/ColladaLoader.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const ROOT = "assets/study/";
export async function buildBuilding(scene, manager, invalidate) {
  const textureLoader = new THREE.TextureLoader(manager),
    gltfLoader = new GLTFLoader(manager);
  const interactables = [],
    errors = [],
    cache = new Map();
  const mat = (color, roughness = 0.8, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const plaster = mat("#e8e7dc"),
    trim = mat("#e3e0ce"),
    wood = mat("#785b3e"),
    dark = mat("#26332e");
  const steel = mat("#737d79", 0.3, 0.8),
    rubber = mat("#222a27", 0.95),
    upholstery = mat("#36554a", 0.88);
  function box(w, h, d, x, y, z, material, parent = scene, radius = 0) {
    const geometry = radius
      ? new RoundedBoxGeometry(
          w,
          h,
          d,
          3,
          Math.min(radius, w / 3, h / 3, d / 3),
        )
      : new THREE.BoxGeometry(w, h, d);
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function cylinder(radius, height, x, y, z, material, parent = scene) {
    const mesh = new THREE.Mesh(
      new THREE.CylinderGeometry(radius, radius, height, 32),
      material,
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  }
  function textureMaterial(name, repeat, normalStrength = 0.3) {
    const maps = ["diff", "nor_gl", "rough"].map((type) =>
      textureLoader.load(`${ROOT}${name}/${type}.jpg`, invalidate),
    );
    maps[0].colorSpace = THREE.SRGBColorSpace;
    maps.forEach((map) => {
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.repeat.set(...repeat);
      map.anisotropy = 4;
    });
    return new THREE.MeshStandardMaterial({
      map: maps[0],
      normalMap: maps[1],
      roughnessMap: maps[2],
      normalScale: new THREE.Vector2(normalStrength, normalStrength),
      roughness: 0.9,
    });
  }
  const parquet = textureMaterial("herringbone_parquet", [3.2, 2.8], 0.22),
    wall = textureMaterial("white_plaster_02", [3, 1.5], 0.13);
  function floor(cx, cz, w, d, h = 3.3, material = parquet) {
    box(w, 0.16, d, cx, -0.08, cz, material);
    box(w, 0.12, d, cx, h + 0.06, cz, plaster);
  }
  function wallX(x, z1, z2, h = 3.3, openings = []) {
    let cursor = z1;
    for (const [center, width] of [...openings].sort((a, b) => a[0] - b[0])) {
      const a = center - width / 2,
        b = center + width / 2;
      if (a > cursor)
        box(0.16, h, a - cursor, x, h / 2, (cursor + a) / 2, wall);
      box(0.16, h - 2.55, width, x, (h + 2.55) / 2, center, wall);
      cursor = b;
      for (const edge of [a, b]) box(0.22, 2.6, 0.1, x, 1.3, edge, trim);
      box(0.22, 0.12, width + 0.16, x, 2.59, center, trim);
    }
    if (cursor < z2)
      box(0.16, h, z2 - cursor, x, h / 2, (cursor + z2) / 2, wall);
  }
  function wallZ(z, x1, x2, h = 3.3) {
    box(x2 - x1, h, 0.16, (x1 + x2) / 2, h / 2, z, wall);
    box(
      x2 - x1,
      0.12,
      0.08,
      (x1 + x2) / 2,
      0.06,
      z + (z < 0 ? 0.1 : -0.1),
      trim,
    );
    box(
      x2 - x1,
      0.12,
      0.13,
      (x1 + x2) / 2,
      h - 0.13,
      z + (z < 0 ? 0.1 : -0.1),
      trim,
    );
  }
  function windowX(x, z1, z2, h = 3.3) {
    const width = z2 - z1,
      zc = (z1 + z2) / 2;
    box(0.16, 0.8, width, x, 0.4, zc, wall);
    box(0.16, h - 2.9, width, x, (h + 2.9) / 2, zc, wall);
    for (const z of [z1, (z1 + z2) / 2, z2])
      box(0.15, 2.15, 0.065, x + 0.07, 1.85, z, trim);
    for (const y of [0.8, 1.85, 2.9])
      box(0.15, 0.07, width + 0.1, x + 0.07, y, zc, trim);
    box(0.42, 0.075, width + 0.2, x + 0.15, 0.79, zc, trim);
    const pane = new THREE.Mesh(
      new THREE.PlaneGeometry(width, 2.05),
      new THREE.MeshPhysicalMaterial({
        color: "#dce5dc",
        transparent: true,
        opacity: 0.07,
        roughness: 0.1,
        metalness: 0.02,
        side: THREE.DoubleSide,
      }),
    );
    pane.rotation.y = Math.PI / 2;
    pane.position.set(x + 0.02, 1.85, zc);
    scene.add(pane);
  }
  function curtain(x, z) {
    const geometry = new THREE.PlaneGeometry(0.72, 2.48, 28, 15),
      pos = geometry.attributes.position;
    for (let i = 0; i < pos.count; i++)
      pos.setZ(i, Math.sin(pos.getX(i) * 42) * 0.038);
    geometry.computeVertexNormals();
    const mesh = new THREE.Mesh(
      geometry,
      new THREE.MeshStandardMaterial({
        color: "#e5dfc9",
        roughness: 1,
        side: THREE.DoubleSide,
      }),
    );
    mesh.rotation.y = Math.PI / 2;
    mesh.position.set(x, 1.72, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);
  }
  function action(object, type, destination, label) {
    object.userData.interaction = { type, destination, label };
    interactables.push(object);
    return object;
  }
  function plaque(text, x, y, z, rotation = -Math.PI / 2) {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 160;
    const ctx = c.getContext("2d");
    ctx.fillStyle = "#dddbc7";
    ctx.fillRect(0, 0, 512, 160);
    ctx.fillStyle = "#304b3c";
    ctx.font = "500 42px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(text, 256, 96);
    const texture = new THREE.CanvasTexture(c);
    texture.colorSpace = THREE.SRGBColorSpace;
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(0.64, 0.2),
      new THREE.MeshStandardMaterial({ map: texture, roughness: 0.8 }),
    );
    mesh.position.set(x, y, z);
    mesh.rotation.y = rotation;
    scene.add(mesh);
    return mesh;
  }
  function door(x, z, direction, name, destination) {
    const group = new THREE.Group();
    group.position.set(x, 0, z - 0.72);
    group.rotation.y = direction * 1.35;
    scene.add(group);
    box(0.065, 2.47, 1.44, 0, 1.235, 0.72, wood, group, 0.015);
    box(0.075, 1.35, 1.1, 0, 1.58, 0.72, mat("#8f7655"), group, 0.018);
    const handle = cylinder(0.02, 0.18, 0.075, 1.05, 1.28, steel, group);
    handle.rotation.z = Math.PI / 2;
    action(group, "go", destination, `Go to ${name}`);
    return group;
  }
  // Study and its large side window.
  floor(0, 0, 8, 7.2);
  wallZ(-3.6, -4, 4);
  wallZ(3.6, -4, 4);
  wallX(4, -3.6, 3.6, 3.3, [[1.5, 1.6]]);
  wallX(-4, -3.6, -2.4);
  windowX(-4, -2.4, 2.4);
  wallX(-4, 2.4, 3.6);
  curtain(-3.73, -2.15);
  curtain(-3.73, 2.15);
  box(0.08, 0.12, 7.2, -3.89, 0.06, 0, trim);
  door(4, 1.5, 1, "the study", "study");
  plaque("Study", 4.11, 1.7, -0.1, Math.PI / 2);
  // A long enclosed corridor with separate door openings on both sides.
  floor(5.5, 3.25, 3, 22.5);
  wallX(4, -8, -3.6);
  wallX(4, 3.6, 14.5, 3.3, [[10.5, 1.6]]);
  wallX(7, -8, 20.4, 3.3, [
    [-3.8, 1.6],
    [6, 1.7],
  ]);
  wallZ(-8, 4, 7);
  wallZ(14.5, 4, 7);
  // Warm sconces form a readable route through the corridor.
  const luminous = new THREE.MeshStandardMaterial({
    color: "#f5edce",
    emissive: "#ffe9b1",
    emissiveIntensity: 0.7,
    roughness: 0.5,
  });
  for (const z of [-5, 0.1, 5, 11.8]) {
    box(0.1, 0.38, 0.2, 4.12, 2.15, z, wood, scene, 0.025);
    box(0.13, 0.29, 0.14, 4.18, 2.15, z, luminous, scene, 0.025);
    const light = new THREE.PointLight("#ffe7bb", 9, 5, 2);
    light.position.set(4.5, 2.1, z);
    scene.add(light);
  }
  // Separate gym, with glazing on the far wall.
  floor(11, -3.75, 8, 8.5);
  wallZ(-8, 7, 15);
  wallZ(0.5, 7, 15);
  wallX(15, -8, -6);
  windowX(15, -6, -1.5);
  wallX(15, -1.5, 0.5);
  door(7, -3.8, -1, "the gym", "gym");
  plaque("Gym", 6.88, 1.7, -5.1);
  // Separate tall sports hall. The marked doubles court is 6.1m by 13.4m.
  const sportsFloor = mat("#b69365", 0.65);
  floor(12.5, 11.2, 11, 18.4, 7, sportsFloor);
  wallZ(2, 7, 18, 7);
  wallZ(20.4, 7, 18, 7);
  wallX(18, 2, 20.4, 7);
  box(0.16, 3.7, 18.4, 7, 5.15, 11.2, wall);
  door(7, 6, -1, "the badminton hall", "badminton");
  plaque("Badminton hall", 6.88, 1.7, 4.6);
  const court = new THREE.Group();
  scene.add(court);
  action(court, "app", "badminton", "Play badminton");
  box(6.5, 0.016, 13.8, 12.5, 0.012, 11.3, mat("#346b5d", 0.9), court);
  const courtLines = mat("#efefda");
  for (const x of [9.45, 9.91, 15.09, 15.55])
    box(0.04, 0.01, 13.4, x, 0.027, 11.3, courtLines, court);
  for (const z of [4.6, 5.36, 9.32, 11.3, 13.28, 17.24, 18])
    box(6.1, 0.01, 0.04, 12.5, 0.029, z, courtLines, court);
  box(0.04, 0.01, 4.72, 12.5, 0.03, 6.96, courtLines, court);
  box(0.04, 0.01, 4.72, 12.5, 0.03, 15.64, courtLines, court);
  for (const x of [9.33, 15.67])
    cylinder(0.035, 1.55, x, 0.775, 11.3, steel, court);
  const net = new THREE.Group();
  court.add(net);
  const netMat = new THREE.LineBasicMaterial({
    color: "#d7d7c1",
    transparent: true,
    opacity: 0.65,
  });
  const netPoints = [];
  for (let x = 9.35; x <= 15.65; x += 0.075)
    netPoints.push(
      new THREE.Vector3(x, 0.8, 11.3),
      new THREE.Vector3(x, 1.52, 11.3),
    );
  for (let y = 0.8; y <= 1.52; y += 0.075)
    netPoints.push(
      new THREE.Vector3(9.35, y, 11.3),
      new THREE.Vector3(15.65, y, 11.3),
    );
  net.add(
    new THREE.LineSegments(
      new THREE.BufferGeometry().setFromPoints(netPoints),
      netMat,
    ),
  );
  box(6.35, 0.035, 0.025, 12.5, 1.54, 11.3, trim, court);
  // High clerestory panes and steel roof trusses make the hall its own volume.
  for (const z of [5, 9, 13, 17]) {
    box(10.7, 0.13, 0.11, 12.5, 6.35, z, steel);
    const light = new THREE.RectAreaLight("#fff4db", 2, 7, 1.3);
    light.position.set(12.5, 5.9, z);
    light.rotation.x = -Math.PI / 2;
    scene.add(light);
    box(4, 0.035, 0.32, 12.5, 6.05, z, luminous);
  }
  for (const z of [6, 11, 16]) {
    const panel = new THREE.Mesh(
      new THREE.PlaneGeometry(3.7, 1.8),
      new THREE.MeshStandardMaterial({
        color: "#b8d0c7",
        emissive: "#cbd7ce",
        emissiveIntensity: 0.25,
        roughness: 0.28,
      }),
    );
    panel.position.set(17.9, 4.9, z);
    panel.rotation.y = -Math.PI / 2;
    scene.add(panel);
    box(0.12, 0.08, 3.85, 17.85, 3.96, z, trim);
  }
  // Card lounge on the other side of the corridor.
  floor(0, 10.5, 8, 7);
  wallZ(7, -4, 4);
  wallZ(14, -4, 4);
  windowX(-4, 8.1, 12.9);
  wallX(-4, 7, 8.1);
  wallX(-4, 12.9, 14);
  curtain(-3.73, 8.3);
  curtain(-3.73, 12.7);
  door(4, 10.5, 1, "the card lounge", "lounge");
  plaque("Card lounge", 4.11, 1.7, 9.1, Math.PI / 2);
  // Detailed original exercise equipment, with rounded padding and metal joints.
  const gymEquipment = new THREE.Group();
  scene.add(gymEquipment);
  action(gymEquipment, "app", "about", "Off the clock");
  box(4.4, 0.025, 4.6, 11.8, 0.015, -4.2, rubber, gymEquipment, 0.02);
  box(0.65, 0.14, 1.5, 11.8, 0.53, -3.9, upholstery, gymEquipment, 0.06);
  for (const z of [-4.45, -3.35]) {
    box(0.08, 0.5, 0.08, 11.8, 0.25, z, steel, gymEquipment, 0.01);
    box(0.85, 0.07, 0.12, 11.8, 0.07, z, steel, gymEquipment, 0.015);
  }
  const back = box(
    0.65,
    0.13,
    0.65,
    11.8,
    0.73,
    -4.94,
    upholstery,
    gymEquipment,
    0.05,
  );
  back.rotation.x = -0.55;
  for (const x of [10.8, 12.8]) {
    box(0.075, 2.2, 0.075, x, 1.1, -5.35, steel, gymEquipment, 0.012);
    box(0.65, 0.07, 1.1, x, 0.06, -5.35, steel, gymEquipment, 0.012);
    box(0.18, 0.06, 0.17, x, 1.37, -5.25, dark, gymEquipment, 0.01);
  }
  box(2.1, 0.07, 0.07, 11.8, 2.18, -5.35, steel, gymEquipment, 0.01);
  const bar = cylinder(0.018, 2.5, 11.8, 1.46, -5.19, steel, gymEquipment);
  bar.rotation.z = Math.PI / 2;
  for (const side of [-1, 1])
    for (let i = 0; i < 3; i++) {
      const plate = cylinder(
        0.2 - i * 0.012,
        0.045,
        11.8 + side * (1.0 + i * 0.05),
        1.46,
        -5.19,
        rubber,
        gymEquipment,
      );
      plate.rotation.z = Math.PI / 2;
      const hub = cylinder(
        0.045,
        0.049,
        11.8 + side * (1.0 + i * 0.05),
        1.46,
        -5.19,
        steel,
        gymEquipment,
      );
      hub.rotation.z = Math.PI / 2;
    }
  // Dumbbell rack, full-height mirror and a folded towel.
  box(0.65, 0.06, 2.0, 14, 0.72, -3, steel, gymEquipment, 0.018);
  for (const z of [-3.8, -2.2])
    box(0.08, 0.72, 0.08, 14, 0.36, z, steel, gymEquipment, 0.01);
  for (let i = 0; i < 4; i++) {
    const z = -3.65 + i * 0.43,
      grip = cylinder(0.018, 0.34, 14, 0.83, z, steel, gymEquipment);
    grip.rotation.z = Math.PI / 2;
    for (const side of [-1, 1]) {
      const weight = cylinder(
        0.09 + i * 0.01,
        0.1,
        14 + side * 0.2,
        0.83,
        z,
        rubber,
        gymEquipment,
      );
      weight.rotation.z = Math.PI / 2;
    }
  }
  box(0.25, 0.065, 0.48, 13.95, 0.8, -1.3, trim, gymEquipment, 0.025);
  box(3, 2.0, 0.05, 11.7, 1.7, -7.88, steel);
  box(
    2.85,
    1.86,
    0.04,
    11.7,
    1.7,
    -7.84,
    new THREE.MeshPhysicalMaterial({
      color: "#a8bdb5",
      metalness: 0.9,
      roughness: 0.18,
    }),
  );
  plaque("A little movement, a clearer head.", 11.7, 2.92, -7.89, 0);

  async function model(name, width, x, y, z, rotation = 0, height = null) {
    if (!cache.has(name))
      cache.set(name, gltfLoader.loadAsync(`${ROOT}${name}/${name}.gltf`));
    const source = await cache.get(name),
      object = source.scene.clone(true);
    object.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(object),
      size = bounds.getSize(new THREE.Vector3()),
      center = bounds.getCenter(new THREE.Vector3());
    const wrapper = new THREE.Group();
    object.position.sub(new THREE.Vector3(center.x, bounds.min.y, center.z));
    wrapper.add(object);
    wrapper.scale.setScalar(width / size.x);
    if (height) wrapper.scale.y = height / size.y;
    wrapper.position.set(x, y, z);
    wrapper.rotation.y = rotation;
    wrapper.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
        const materials = Array.isArray(child.material)
          ? child.material
          : [child.material];
        for (const m of materials) if (m.map) m.map.anisotropy = 4;
      }
    });
    scene.add(wrapper);
    invalidate();
    return wrapper;
  }
  async function safeModel(...args) {
    try {
      return await model(...args);
    } catch (error) {
      errors.push(args[0]);
      console.info("Optional furniture unavailable:", args[0]);
      return null;
    }
  }
  const deskY = 0.777;
  const furniture = await Promise.all([
    safeModel("metal_office_desk", 2.35, -0.65, 0, -1.95, 0, 0.77),
    safeModel(
      "mid_century_lounge_chair",
      0.82,
      -0.45,
      0,
      -0.18,
      Math.PI - 0.12,
    ),
    safeModel("wooden_bookshelf_worn", 1.3, 2.65, 0, -3.2),
    safeModel("potted_plant_02", 0.72, -2.85, 0, -2.35),
    safeModel("desk_lamp_arm_01", 0.18, -1.52, deskY, -2.06, 0.2),
    safeModel("binder_notebook", 0.3, -1.33, deskY, -1.42, -0.15),
    safeModel("book_encyclopedia_set_01", 0.34, 0.24, deskY, -2.17),
    safeModel("portable_cassette_player", 0.2, 0.15, deskY, -1.4, -0.3),
    safeModel("round_wooden_table_02", 1.55, -0.8, 0, 10.5, 0, 0.75),
    safeModel("dining_chair_02", 0.56, -0.8, 0, 9.25, 0),
    safeModel("dining_chair_02", 0.56, -0.8, 0, 11.75, Math.PI),
    safeModel("dining_chair_02", 0.56, -2.05, 0, 10.5, Math.PI / 2),
    safeModel("potted_plant_02", 0.8, -3.0, 0, 12.9),
    safeModel("wooden_bookshelf_worn", 1.3, -2.3, 0, 13.55),
    safeModel("book_encyclopedia_set_01", 0.43, 2.4, 0.374, -3.15),
    safeModel("book_encyclopedia_set_01", 0.48, 2.8, 1.213, -3.15),
    safeModel("binder_notebook", 0.31, 2.45, 0.912, -3.1),
    safeModel("book_encyclopedia_set_01", 0.43, -2.5, 0.374, 13.58),
    safeModel("book_encyclopedia_set_01", 0.48, -2.1, 1.213, 13.58),
  ]);
  if (furniture[0]) action(furniture[0], "computer", null, "Use the computer");
  if (furniture[2]) action(furniture[2], "app", "writing", "Open the notebook");
  if (furniture[5]) action(furniture[5], "app", "writing", "Read the notebook");
  if (furniture[7]) action(furniture[7], "app", "sound", "Sound settings");
  if (furniture[8]) action(furniture[8], "app", "poker", "Play five-card draw");
  // Green baize, cards and chips sit on the imported wooden table.
  const felt = cylinder(0.65, 0.012, -0.8, 0.757, 10.5, mat("#2e5c48"));
  action(felt, "app", "poker", "Play five-card draw");
  const cardMat = new THREE.MeshStandardMaterial({
    map: textureLoader.load("assets/cards/cardBack_green5.png", invalidate),
    roughness: 0.8,
  });
  cardMat.map.colorSpace = THREE.SRGBColorSpace;
  for (let i = 0; i < 5; i++) {
    const card = new THREE.Mesh(new THREE.PlaneGeometry(0.085, 0.12), cardMat);
    card.rotation.x = -Math.PI / 2;
    card.rotation.z = (i - 2) * 0.13;
    card.position.set(-1.0 + i * 0.07, 0.768, 10.55);
    scene.add(card);
    action(card, "app", "poker", "Deal a hand");
  }
  for (const [x, z] of [
    [-0.3, 10.3],
    [-1.2, 10.1],
  ])
    for (let i = 0; i < 5; i++)
      cylinder(0.025, 0.005, x, 0.77 + i * 0.005, z, i % 2 ? trim : upholstery);
  // A quiet rug and a framed original diagram complete the study without clutter.
  box(2.5, 0.009, 2.0, -0.55, 0.009, 0.0, mat("#8a8d77", 1));
  const print = document.createElement("canvas");
  print.width = 700;
  print.height = 500;
  const pc = print.getContext("2d");
  pc.fillStyle = "#ede8d7";
  pc.fillRect(0, 0, 700, 500);
  pc.strokeStyle = "#36594a";
  pc.lineWidth = 3;
  for (let i = 0; i < 5; i++) {
    pc.beginPath();
    pc.arc(350, 260, 55 + i * 30, Math.PI * 0.1, Math.PI * 1.75);
    pc.stroke();
  }
  pc.fillStyle = "#36594a";
  pc.font = "24px sans-serif";
  pc.fillText("Stay curious.", 60, 70);
  const printTexture = new THREE.CanvasTexture(print);
  printTexture.colorSpace = THREE.SRGBColorSpace;
  box(1.36, 1.0, 0.055, 0.6, 2.1, -3.49, wood, scene, 0.015);
  const artwork = new THREE.Mesh(
    new THREE.PlaneGeometry(1.23, 0.87),
    new THREE.MeshStandardMaterial({ map: printTexture, roughness: 0.9 }),
  );
  artwork.position.set(0.6, 2.1, -3.455);
  scene.add(artwork);
  action(artwork, "app", "about", "A little about me");
  // The existing computer asset has its front along +X. Rotate the whole loaded
  // Y-up scene, then normalize its world bounds so the keyboard faces the chair.
  try {
    const loaded = await new ColladaLoader(manager).loadAsync(
      `${ROOT}computer/old_computer.dae`,
    );
    const oriented = new THREE.Group();
    oriented.add(loaded.scene);
    oriented.rotation.y = -Math.PI / 2;
    oriented.updateMatrixWorld(true);
    const bounds = new THREE.Box3().setFromObject(oriented),
      size = bounds.getSize(new THREE.Vector3()),
      center = bounds.getCenter(new THREE.Vector3());
    oriented.position.sub(new THREE.Vector3(center.x, bounds.min.y, center.z));
    const computer = new THREE.Group();
    computer.add(oriented);
    computer.scale.setScalar(0.86 / size.x);
    computer.position.set(-0.65, deskY, -1.83);
    scene.add(computer);
    const image = await new Promise((resolve, reject) => {
      textureLoader.load(
        `${ROOT}computer/computer_desk.png`,
        (texture) => resolve(texture.image),
        undefined,
        reject,
      );
    });
    const atlas = document.createElement("canvas");
    atlas.width = atlas.height = 1024;
    const ac = atlas.getContext("2d");
    ac.drawImage(image, 0, 0, 1024, 1024);
    const screen = document.createElement("canvas");
    screen.width = 800;
    screen.height = 600;
    const sc = screen.getContext("2d");
    sc.fillStyle = "#45695b";
    sc.fillRect(0, 0, 800, 600);
    sc.fillStyle = "#f2edd9";
    sc.font = "bold 31px sans-serif";
    sc.fillText("Vu’s computer", 42, 65);
    for (const [i, text] of ["Projects", "Experience", "Notebook"].entries()) {
      sc.fillStyle = "#d9c57d";
      sc.fillRect(44, 116 + i * 112, 52, 40);
      sc.fillRect(44, 109 + i * 112, 24, 10);
      sc.fillStyle = "#f6f2df";
      sc.font = "25px sans-serif";
      sc.fillText(text, 119, 148 + i * 112);
    }
    sc.fillStyle = "#d5d7c8";
    sc.fillRect(0, 557, 800, 43);
    sc.fillStyle = "#274634";
    sc.font = "bold 25px sans-serif";
    sc.fillText("Start", 20, 586);
    function paintScreen(ctx) {
      ctx.save();
      ctx.translate(436, 1000);
      ctx.rotate(-Math.PI / 2);
      ctx.drawImage(screen, 0, 0, 208, 172);
      ctx.restore();
    }
    paintScreen(ac);
    const atlasTexture = new THREE.CanvasTexture(atlas);
    atlasTexture.colorSpace = THREE.SRGBColorSpace;
    const glow = document.createElement("canvas");
    glow.width = glow.height = 1024;
    const gc = glow.getContext("2d");
    gc.fillStyle = "#000";
    gc.fillRect(0, 0, 1024, 1024);
    paintScreen(gc);
    const glowTexture = new THREE.CanvasTexture(glow);
    glowTexture.colorSpace = THREE.SRGBColorSpace;
    const computerMaterial = new THREE.MeshStandardMaterial({
      map: atlasTexture,
      color: "#fff",
      roughness: 0.55,
      emissive: "#fff",
      emissiveMap: glowTexture,
      emissiveIntensity: 0.3,
    });
    computer.traverse((child) => {
      if (child.isMesh) {
        child.material = computerMaterial;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    action(computer, "computer", null, "Use the computer");
  } catch (error) {
    errors.push("computer");
    console.info(
      "Computer asset unavailable; the desktop shortcut remains available.",
    );
  }
  invalidate();
  return { interactables, errors };
}
