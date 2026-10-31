import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// Original working parts and props, fitted to the licensed base desk. The base
// remains attributed; these details, materials and interactions are Vu's revision.
export function personalizeDesk(root) {
  const named = new Map();
  root.traverse((object) => {
    if (object.isMesh) named.set(object.name, object);
  });
  const material = (color) =>
    new THREE.MeshStandardMaterial({ color, roughness: 0.78 });
  const teal = material("#345d64"),
    wood = material("#a68c69"),
    paper = material("#e1d8bd"),
    copper = material("#a55c38"),
    ink = material("#273e48");
  function box(w, h, d, x, y, z, mat, parent = root, radius = 0.02) {
    const mesh = new THREE.Mesh(
      new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 3, h / 3, d / 3)),
      mat,
    );
    mesh.position.set(x, y, z);
    parent.add(mesh);
    return mesh;
  }
  function label(
    text,
    width,
    height,
    background = "#e6ddc8",
    foreground = "#30424a",
  ) {
    const canvas = document.createElement("canvas");
    canvas.width = 768;
    canvas.height = 192;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = background;
    ctx.fillRect(0, 0, 768, 192);
    ctx.fillStyle = foreground;
    ctx.font = "bold 57px Arial";
    ctx.textAlign = "center";
    ctx.fillText(text, 384, 118);
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ map }),
    );
  }
  function duotone(mesh, shadow, highlight) {
    if (!mesh) return;
    const source = mesh.material;
    const a = new THREE.Color(shadow).toArray().join(","),
      b = new THREE.Color(highlight).toArray().join(",");
    const mat = new THREE.MeshBasicMaterial({ map: source.map });
    mat.onBeforeCompile = (shader) => {
      shader.fragmentShader = shader.fragmentShader.replace(
        "#include <map_fragment>",
        `#include <map_fragment>\nfloat shade=clamp(dot(diffuseColor.rgb,vec3(.2126,.7152,.0722))*1.8,0.0,1.0);\ndiffuseColor.rgb=mix(vec3(${a}),vec3(${b}),shade);`,
      );
    };
    mat.customProgramCacheKey = () => `vu-duotone-${shadow}-${highlight}`;
    mesh.material = mat;
  }
  // A cool stage and cream hardware distinguish the treatment from the source.
  for (const name of ["Background", "desk", "chair_base"]) {
    const mesh = named.get(name);
    if (mesh) {
      mesh.material = mesh.material.clone();
      mesh.material.color.set(name === "Background" ? "#f4f1e9" : "#e0e5e3");
    }
  }
  for (const name of ["computer", "monitor_base", "keyboard", "mouse"]) {
    const mesh = named.get(name);
    if (mesh) {
      mesh.material = mesh.material.clone();
      mesh.material.color.set("#fff0d8");
    }
  }
  duotone(named.get("coffee"), "#753e2f", "#e4a27a");
  // Replace the source paper-tray composition with our own original books.
  for (const name of [
    "paper_holder_bottom",
    "paper_holder_top",
    "paper_stack_1",
    "paper_stack_2",
    "paper",
  ])
    named.get(name)?.removeFromParent();
  const desk = named.get("desk");
  if (desk) {
    const geometry = desk.geometry.clone(),
      position = geometry.getAttribute("position"),
      index = geometry.index,
      keep = [];
    // Remove the upper drawer's source front and handle; the new moving tray
    // must reveal an actual opening rather than slide over a static duplicate.
    for (let i = 0; i < index.count; i += 3) {
      const vertices = [
        index.getX(i),
        index.getX(i + 1),
        index.getX(i + 2),
      ].map((j) => new THREE.Vector3().fromBufferAttribute(position, j));
      const front = vertices.every(
        (v) =>
          v.x > -3.5 &&
          v.x < -1.7 &&
          v.y > -1.21 &&
          v.y < -0.67 &&
          v.z > 1.6 &&
          v.z < 1.61,
      );
      const handle = vertices.every(
        (v) =>
          v.x > -2.89 &&
          v.x < -2.38 &&
          v.y > -0.85 &&
          v.y < -0.75 &&
          v.z > 1.61,
      );
      if (!front && !handle)
        keep.push(index.getX(i), index.getX(i + 1), index.getX(i + 2));
    }
    geometry.setIndex(keep);
    desk.geometry = geometry;
  }
  const drawer = new THREE.Group();
  drawer.name = "vu-drawer";
  drawer.position.set(-2.349, -0.846, 1.445);
  root.add(drawer);
  const drawerFront = box(1.526, 0.455, 0.075, 0, 0, 0, teal, drawer, 0.025);
  for (const side of [-1, 1])
    box(0.045, 0.3, 1.3, side * 0.72, -0.025, -0.68, wood, drawer, 0.012);
  box(1.48, 0.04, 1.3, 0, -0.16, -0.68, wood, drawer, 0.012);
  box(1.48, 0.3, 0.04, 0, -0.025, -1.32, wood, drawer, 0.012);
  box(0.43, 0.055, 0.075, 0, 0.06, 0.07, copper, drawer, 0.02);
  const notebook = box(
    0.63,
    0.055,
    0.83,
    -0.21,
    -0.1,
    -0.6,
    paper,
    drawer,
    0.015,
  );
  notebook.rotation.y = 0.06;
  const note = label("NEXT IDEA", 0.45, 0.11);
  note.rotation.x = -Math.PI / 2;
  note.position.set(-0.21, -0.067, -0.6);
  drawer.add(note);
  const pencil = box(
    0.025,
    0.025,
    0.7,
    0.42,
    -0.09,
    -0.7,
    copper,
    drawer,
    0.005,
  );
  pencil.rotation.y = -0.2;
  drawer.traverse((mesh) => {
    if (mesh.isMesh)
      mesh.userData.interaction = {
        type: "prop",
        id: "drawer",
        label: "Open or close the drawer",
      };
  });
  const book = new THREE.Group();
  book.name = "vu-textbook";
  book.position.set(-2.85, -0.26, -0.06);
  book.rotation.y = -0.08;
  root.add(book);
  const lowerBook = box(1.02, 0.09, 1.3, -2.85, -0.4, -0.06, copper);
  lowerBook.rotation.y = 0.06;
  box(0.66, 0.13, 0.89, 0, 0, 0, paper, book, 0.012);
  box(0.72, 0.025, 0.96, 0, 0.08, 0, teal, book, 0.012);
  box(0.72, 0.025, 0.96, 0, -0.08, 0, teal, book, 0.012);
  box(0.045, 0.18, 0.96, -0.34, 0, 0, teal, book, 0.012);
  const coverCanvas = document.createElement("canvas");
  coverCanvas.width = 512;
  coverCanvas.height = 768;
  const ctx = coverCanvas.getContext("2d");
  ctx.fillStyle = "#345d64";
  ctx.fillRect(0, 0, 512, 768);
  ctx.fillStyle = "#f2e9d3";
  ctx.font = "bold 62px Arial";
  ctx.fillText("FIELD", 55, 140);
  ctx.fillText("NOTES", 55, 214);
  ctx.font = "22px Arial";
  ctx.fillText("SOFTWARE / SECURITY", 55, 292);
  ctx.strokeStyle = "#c58e62";
  ctx.lineWidth = 4;
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.moveTo(55, 430 + i * 35);
    ctx.lineTo(220 + i * 38, 430 + i * 35);
    ctx.stroke();
  }
  ctx.font = "bold 40px Arial";
  ctx.fillText("VL", 55, 695);
  const coverMap = new THREE.CanvasTexture(coverCanvas);
  coverMap.colorSpace = THREE.SRGBColorSpace;
  const cover = new THREE.Mesh(
    new THREE.PlaneGeometry(0.69, 0.93),
    new THREE.MeshBasicMaterial({ map: coverMap }),
  );
  cover.rotation.x = -Math.PI / 2;
  cover.position.y = 0.095;
  book.add(cover);
  book.traverse((mesh) => {
    if (mesh.isMesh)
      mesh.userData.interaction = {
        type: "prop",
        id: "book",
        label: "Pick up the textbook",
      };
  });
  box(3.0, 0.012, 1.03, 0.3, -0.456, 0.99, ink, root, 0.004);
  const ideaPad = box(0.94, 0.04, 1.07, -1.64, -0.43, -0.207, paper);
  const padLabel = label("NEXT BUILD", 0.64, 0.13);
  padLabel.rotation.x = -Math.PI / 2;
  padLabel.position.set(-1.64, -0.406, -0.42);
  root.add(padLabel);
  const loosePage = box(1.08, 0.012, 1.14, -2.064, -0.445, 0.986, paper);
  const pageLabel = label("WORK IN PROGRESS", 0.78, 0.13);
  pageLabel.rotation.x = -Math.PI / 2;
  pageLabel.position.set(-2.064, -0.437, 0.73);
  root.add(pageLabel);
  for (const object of [ideaPad, padLabel, loosePage, pageLabel])
    object.userData.interaction = {
      type: "app",
      destination: "writing",
      label: "Open the notebook",
    };
  const badge = label("VU / WORKSTATION", 0.48, 0.1, "#d9d4c6");
  badge.position.set(-0.36, 0.35, 0.4);
  badge.rotation.x = (-3 * Math.PI) / 180;
  root.add(badge);
  function pivotFor(mesh) {
    if (!mesh) return null;
    root.updateWorldMatrix(true, true);
    const center = new THREE.Box3()
      .setFromObject(mesh)
      .getCenter(new THREE.Vector3());
    const pivot = new THREE.Group();
    pivot.position.copy(root.worldToLocal(center));
    root.add(pivot);
    pivot.updateWorldMatrix(true, false);
    pivot.attach(mesh);
    return pivot;
  }
  const coffeeMesh = named.get("coffee"),
    coffee = pivotFor(coffeeMesh);
  if (coffeeMesh)
    coffeeMesh.userData.interaction = {
      type: "prop",
      id: "coffee",
      label: "Pick up the coffee cup",
    };
  const plant = named.get("plant"),
    sway = { value: 0 };
  if (plant) {
    const plantMat = new THREE.MeshBasicMaterial({
      map: plant.material.map,
      color: "#d9e8c7",
    });
    plantMat.onBeforeCompile = (shader) => {
      shader.uniforms.uVuSway = sway;
      shader.vertexShader = "uniform float uVuSway;\n" + shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        "#include <begin_vertex>",
        "#include <begin_vertex>\nfloat leafWeight=pow(clamp((position.y+1.5)/2.2,0.0,1.0),2.0);\ntransformed.x+=uVuSway*leafWeight;transformed.z+=uVuSway*.3*leafWeight;",
      );
    };
    plantMat.customProgramCacheKey = () => "vu-plant-sway-v1";
    plant.material = plantMat;
    plant.userData.interaction = {
      type: "prop",
      id: "plant",
      label: "Give the plant a nudge",
    };
  }
  root.userData.props = { drawer, coffee, book, sway };
  return root.userData.props;
}
