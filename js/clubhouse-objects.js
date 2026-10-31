import * as THREE from "three";
import { personalizeDesk } from "./desk-props.js?v=20261031-office1";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// Desk meshes and baked lighting: Henry Heffernan, MIT. Full source/notice are
// retained in assets/desk/. No runtime lights, postprocessing or HDRs are used
// for the desk. Mesh names and UVs are preserved from the licensed artwork.
export async function buildDesk(manager, anisotropy = 8) {
  const group = new THREE.Group();
  group.name = "study";
  const models = new GLTFLoader(manager),
    textures = new THREE.TextureLoader(manager);
  await Promise.all(
    ["computer", "world", "decor"].map(async (name) => {
      const [gltf, texture] = await Promise.all([
        models.loadAsync(`assets/desk/${name}.glb`),
        textures.loadAsync(`assets/desk/${name}.webp`),
      ]);
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.anisotropy = anisotropy;
      const material = new THREE.MeshBasicMaterial({ map: texture });
      gltf.scene.traverse((mesh) => {
        if (!mesh.isMesh) return;
        mesh.scale.setScalar(0.9);
        mesh.material = material;
        if (
          ["computer", "keyboard", "mouse", "monitor_base"].includes(mesh.name)
        )
          mesh.userData.interaction = {
            type: "computer",
            label: "Use the computer",
          };
        if (
          [
            "binder_1",
            "binder_2",
            "paper_holder_top",
            "paper_stack_1",
          ].includes(mesh.name)
        )
          mesh.userData.interaction = {
            type: "app",
            destination: "writing",
            label: "Open the notebook",
          };
        // Remove the source artist's personal paper details; the portfolio uses
        // Vu's actual HTML content rather than somebody else's in-room resume.
        if (mesh.name === "paper")
          mesh.material = new THREE.MeshBasicMaterial({ color: "#eeeade" });
      });
      group.add(gltf.scene);
    }),
  );
  const screen = document.createElement("canvas");
  screen.width = 1024;
  screen.height = 768;
  const ctx = screen.getContext("2d");
  ctx.fillStyle = "#4c7771";
  ctx.fillRect(0, 0, 1024, 768);
  ctx.fillStyle = "#f8f7ea";
  ctx.font = "bold 42px sans-serif";
  ctx.fillText("Vu’s computer", 55, 79);
  for (const [i, text] of [
    "My Projects",
    "Experience",
    "Notebook",
    "Games",
  ].entries()) {
    const y = 155 + i * 120;
    ctx.fillStyle = "#e1cc83";
    ctx.fillRect(55, y, 54, 42);
    ctx.fillRect(55, y - 10, 24, 12);
    ctx.fillStyle = "#fffef4";
    ctx.font = "29px sans-serif";
    ctx.fillText(text, 135, y + 34);
  }
  ctx.fillStyle = "#d4d4c9";
  ctx.fillRect(0, 717, 1024, 51);
  ctx.fillStyle = "#252d29";
  ctx.font = "bold 28px sans-serif";
  ctx.fillText("VL  Start", 22, 751);
  const map = new THREE.CanvasTexture(screen);
  map.colorSpace = THREE.SRGBColorSpace;
  const display = new THREE.Mesh(
    new THREE.PlaneGeometry(1.28, 1.024),
    new THREE.MeshBasicMaterial({ map }),
  );
  display.position.set(0, 0.95, 0.257);
  display.rotation.x = (-3 * Math.PI) / 180;
  display.userData.interaction = {
    type: "computer",
    label: "Use the computer",
  };
  group.add(display);
  personalizeDesk(group);
  return group;
}

// Original furniture modules, placed together inside the hobbies hall.
export function buildDestination(name) {
  const root = new THREE.Group();
  root.name = name;
  const material = (color, roughness = 0.75, metalness = 0) =>
    new THREE.MeshStandardMaterial({ color, roughness, metalness });
  const grey = material("#aaa9a5"),
    light = material("#e7e4dc"),
    steel = material("#6b6d6b", 0.4, 0.6),
    dark = material("#292d2b"),
    wood = material("#705744"),
    green = material("#375c50"),
    leather = material("#806044");
  function box(w, h, d, x, y, z, m, r = 0.02) {
    const mesh = new THREE.Mesh(
      r
        ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 3, h / 3, d / 3))
        : new THREE.BoxGeometry(w, h, d),
      m,
    );
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  }
  function cylinder(r, h, x, y, z, m) {
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 40), m);
    mesh.position.set(x, y, z);
    root.add(mesh);
    return mesh;
  }
  function interact(mesh, app, label) {
    mesh.userData.interaction = { type: "app", destination: app, label };
    return mesh;
  }
  function shadow(x, z, w, d) {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d"),
      fade = g.createRadialGradient(64, 64, 5, 64, 64, 62);
    fade.addColorStop(0, "#0006");
    fade.addColorStop(1, "#0000");
    g.fillStyle = fade;
    g.fillRect(0, 0, 128, 128);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshBasicMaterial({
        map: new THREE.CanvasTexture(c),
        transparent: true,
        depthWrite: false,
      }),
    );
    mesh.rotation.x = -Math.PI / 2;
    mesh.position.set(x, 0.005, z);
    root.add(mesh);
  }
  if (name === "gym") {
    shadow(0, 0, 6, 5);
    box(4.6, 0.03, 3.8, 0, 0, 0, dark, 0.03);
    for (const x of [-1.1, 1.1]) {
      box(0.07, 2.0, 0.07, x, 1, -0.9, steel);
      box(0.65, 0.07, 1.2, x, 0.06, -0.9, steel);
      box(0.17, 0.06, 0.18, x, 1.3, -0.85, steel);
    }
    box(2.2, 0.07, 0.07, 0, 2, -0.9, steel);
    const bar = cylinder(0.022, 2.7, 0, 1.38, -0.85, steel);
    bar.rotation.z = Math.PI / 2;
    for (const side of [-1, 1])
      for (let i = 0; i < 3; i++) {
        const plate = cylinder(
          0.23 - i * 0.015,
          0.05,
          side * (1.06 + i * 0.055),
          1.38,
          -0.85,
          dark,
        );
        plate.rotation.z = Math.PI / 2;
      }
    const seat = box(0.65, 0.13, 1.4, 0, 0.53, 0.1, leather, 0.065);
    interact(seat, "about", "Off the clock");
    const back = box(0.65, 0.13, 0.65, 0, 0.72, -0.92, leather, 0.06);
    back.rotation.x = -0.5;
    box(0.08, 0.28, 0.52, 0, 0.48, -0.9, steel, 0.015);
    for (const z of [-0.38, 0.65]) {
      box(0.09, 0.5, 0.09, 0, 0.25, z, steel);
      box(0.8, 0.07, 0.15, 0, 0.065, z, steel);
    }
    box(0.65, 0.07, 2, 1.65, 0.68, 0, steel);
    for (const z of [-0.8, 0.8]) box(0.07, 0.68, 0.07, 1.65, 0.34, z, steel);
    for (let i = 0; i < 4; i++) {
      const z = -0.64 + i * 0.42,
        grip = cylinder(0.018, 0.35, 1.65, 0.8, z, steel);
      grip.rotation.z = Math.PI / 2;
      for (const s of [-1, 1]) {
        const weight = cylinder(0.095, 0.09, 1.65 + s * 0.2, 0.8, z, dark);
        weight.rotation.z = Math.PI / 2;
      }
    }
    box(0.25, 0.07, 0.42, 1.65, 0.77, 1.22, light, 0.03);
  } else if (name === "badminton") {
    shadow(0, 0, 12, 20);
    box(8, 0.07, 15.5, 0, 0.0, 0, material("#a89a83"), 0.04);
    const court = box(6.4, 0.018, 13.7, 0, 0.048, 0, green, 0.01);
    interact(court, "badminton", "Play badminton");
    for (const x of [-3.05, -2.59, 2.59, 3.05])
      box(0.035, 0.006, 13.4, x, 0.061, 0, light, 0);
    for (const z of [-6.7, -5.94, -1.98, 0, 1.98, 5.94, 6.7])
      box(6.1, 0.006, 0.035, 0, 0.062, z, light, 0);
    for (const z of [-4.34, 4.34])
      box(0.035, 0.006, 4.72, 0, 0.063, z, light, 0);
    for (const x of [-3.2, 3.2]) cylinder(0.035, 1.55, x, 0.81, 0, steel);
    const vertices = [];
    for (let x = -3.2; x <= 3.2; x += 0.1)
      vertices.push(x, 0.85, 0, x, 1.55, 0);
    for (let y = 0.85; y <= 1.55; y += 0.1)
      vertices.push(-3.2, y, 0, 3.2, y, 0);
    const geom = new THREE.BufferGeometry();
    geom.setAttribute(
      "position",
      new THREE.Float32BufferAttribute(vertices, 3),
    );
    root.add(
      new THREE.LineSegments(
        geom,
        new THREE.LineBasicMaterial({
          color: "#e5e5dc",
          transparent: true,
          opacity: 0.85,
        }),
      ),
    );
    box(6.45, 0.035, 0.025, 0, 1.57, 0, light, 0);
    for (const z of [-3.8, 3.8]) {
      box(0.42, 0.1, 2.1, 3.7, 0.48, z, wood, 0.025);
      for (const dz of [-0.8, 0.8])
        box(0.08, 0.45, 0.08, 3.7, 0.23, z + dz, steel);
    }
  } else if (name === "lounge") {
    shadow(0, 0, 5.5, 5);
    cylinder(0.52, 0.06, 0, 0.015, 0, wood);
    cylinder(0.29, 0.72, 0, 0.38, 0, wood);
    cylinder(1.0, 0.13, 0, 0.78, 0, wood);
    const felt = cylinder(0.88, 0.016, 0, 0.854, 0, green);
    interact(felt, "poker", "Deal a hand");
    for (const angle of [-Math.PI / 2, Math.PI / 2, Math.PI]) {
      const x = Math.sin(angle) * 1.45,
        z = Math.cos(angle) * 1.45;
      const seat = box(0.58, 0.13, 0.6, x, 0.47, z, leather, 0.07);
      interact(seat, "poker", "Take a seat");
      const back = box(
        0.58,
        0.65,
        0.1,
        x + Math.sin(angle) * 0.26,
        0.84,
        z + Math.cos(angle) * 0.26,
        leather,
        0.05,
      );
      back.rotation.y = angle;
      for (const a of [-0.2, 0.2])
        for (const b of [-0.2, 0.2])
          box(0.045, 0.46, 0.045, x + a, 0.215, z + b, wood, 0.01);
    }
    for (let i = 0; i < 5; i++) {
      const cardCanvas = document.createElement("canvas");
      cardCanvas.width = 64;
      cardCanvas.height = 96;
      const ctx = cardCanvas.getContext("2d"),
        rank = ["A", "K", "Q", "J", "10"][i],
        suit = ["♠", "♥", "♠", "♦", "♣"][i];
      ctx.fillStyle = "#fffdf2";
      ctx.fillRect(0, 0, 64, 96);
      ctx.fillStyle = i === 1 || i === 3 ? "#a7332d" : "#252b27";
      ctx.font = "bold 19px Arial";
      ctx.fillText(rank, 5, 23);
      ctx.font = "35px Arial";
      ctx.fillText(suit, 15, 65);
      const map = new THREE.CanvasTexture(cardCanvas);
      map.colorSpace = THREE.SRGBColorSpace;
      const card = new THREE.Mesh(
        new THREE.PlaneGeometry(0.11, 0.16),
        new THREE.MeshBasicMaterial({ map }),
      );
      card.position.set(
        -0.24 + i * 0.12,
        0.867,
        0.16 + Math.abs(i - 2) * 0.012,
      );
      card.rotation.x = -Math.PI / 2;
      card.rotation.z = (i - 2) * 0.08;
      root.add(card);
      interact(card, "poker", "Deal a hand");
    }
    for (const [x, z] of [
      [0.35, -0.3],
      [-0.35, -0.2],
    ])
      for (let i = 0; i < 5; i++)
        cylinder(0.035, 0.008, x, 0.868 + i * 0.008, z, i % 2 ? light : dark);
  }
  return root;
}
