import * as THREE from "three";

const COPY = {
  coffee: {
    title: "The coffee cup",
    description: "Hmmm, just a regular coffee cup.",
    action: "Put back",
  },
  book: {
    title: "Field notes",
    description:
      "Just a regular textbook. The margin notes are probably doing most of the work.",
    action: "Put back",
  },
  drawer: {
    title: "The desk drawer",
    description: "A notebook, a pencil, and a little room for the next idea.",
    action: "Close drawer",
  },
  plant: {
    title: "A little greenery",
    description: "A small plant. It seems to appreciate the attention.",
    action: "Nice.",
  },
};
export function createDeskInteractions({
  desk,
  camera,
  reduced,
  invalidate,
  onInspect,
  onDismiss,
}) {
  const props = desk.userData.props,
    base = new Map(),
    tweens = new Map();
  let inspection = null,
    drawerOpen = false,
    wave = null;
  for (const name of ["coffee", "book", "drawer"])
    if (props[name])
      base.set(name, {
        position: props[name].position.clone(),
        quaternion: props[name].quaternion.clone(),
      });
  function tween(name, position, quaternion, duration = 650) {
    const object = props[name];
    if (!object) return;
    if (reduced.matches) {
      object.position.copy(position);
      object.quaternion.copy(quaternion);
      tweens.delete(name);
      invalidate();
      return;
    }
    tweens.set(name, {
      object,
      from: object.position.clone(),
      fromQ: object.quaternion.clone(),
      to: position.clone(),
      toQ: quaternion.clone(),
      start: performance.now(),
      duration,
    });
    invalidate();
  }
  function returnObject(name, immediate = false) {
    const original = base.get(name);
    if (!original) return;
    if (immediate) {
      props[name].position.copy(original.position);
      props[name].quaternion.copy(original.quaternion);
      tweens.delete(name);
    } else tween(name, original.position, original.quaternion);
  }
  function dismiss({ immediate = false } = {}) {
    const previous = inspection;
    inspection = null;
    if (previous === "coffee" || previous === "book")
      returnObject(previous, immediate);
    if (previous === "drawer") {
      drawerOpen = false;
      const original = base.get("drawer");
      if (immediate) returnObject("drawer", true);
      else tween("drawer", original.position, original.quaternion, 450);
    }
    if (previous === "plant") {
      wave = null;
      props.sway.value = 0;
    }
    onDismiss?.();
    invalidate();
  }
  function activate(name) {
    if (!COPY[name] || (!props[name] && name !== "plant")) return;
    if (name === inspection) {
      dismiss();
      return;
    }
    if (name === "drawer" && drawerOpen) {
      dismiss();
      drawerOpen = false;
      const original = base.get("drawer");
      tween("drawer", original.position, original.quaternion, 450);
      return;
    }
    dismiss();
    inspection = name;
    const frame = onInspect?.({ id: name, ...COPY[name] });
    if (name === "drawer") {
      drawerOpen = true;
      const original = base.get("drawer");
      tween(
        "drawer",
        original.position.clone().add(new THREE.Vector3(0, 0, 1.0)),
        original.quaternion,
        450,
      );
    } else if (name === "plant") {
      if (!reduced.matches) wave = { start: performance.now() };
    } else {
      camera.updateMatrixWorld(true);
      const offset = new THREE.Vector3(
        -0.12,
        0.18,
        name === "book" ? -3.6 : -3.1,
      );
      if (frame && frame.width < 768) {
        // Fit the object into the space between the phone header and its
        // description instead of letting a close-up extend behind either.
        const halfFov = Math.tan(
          THREE.MathUtils.degToRad(camera.getEffectiveFOV() / 2),
        );
        const space = Math.max(80, frame.bottom - frame.top);
        const height = name === "book" ? 1.02 : 1.2;
        const distance = (height * frame.height) / (2 * halfFov * space * 0.85);
        const center = (frame.top + frame.bottom) / 2;
        offset.set(
          0,
          (0.5 - center / frame.height) * 2 * distance * halfFov,
          -distance,
        );
      }
      const world = camera.localToWorld(offset);
      const target = props[name].parent.worldToLocal(world);
      let orientation = base.get(name).quaternion.clone();
      if (name === "book")
        orientation = camera.quaternion
          .clone()
          .multiply(
            new THREE.Quaternion().setFromAxisAngle(
              new THREE.Vector3(1, 0, 0),
              Math.PI / 2,
            ),
          );
      else
        orientation.multiply(
          new THREE.Quaternion().setFromAxisAngle(
            new THREE.Vector3(0, 1, 0),
            0.35,
          ),
        );
      tween(name, target, orientation);
    }
    invalidate();
  }
  function update(now) {
    for (const [name, t] of tweens) {
      const x = Math.min(1, (now - t.start) / t.duration),
        ease = x * x * (3 - 2 * x);
      t.object.position.lerpVectors(t.from, t.to, ease);
      t.object.quaternion.slerpQuaternions(t.fromQ, t.toQ, ease);
      if (x === 1) tweens.delete(name);
    }
    if (wave) {
      const t = Math.min(1, (now - wave.start) / 1500);
      props.sway.value = Math.sin(t * 14) * Math.exp(-3 * t) * 0.22;
      if (t === 1) {
        wave = null;
        props.sway.value = 0;
      }
    }
    return !!(tweens.size || wave);
  }
  function reset() {
    inspection = null;
    wave = null;
    props.sway.value = 0;
    for (const name of ["coffee", "book"]) returnObject(name, true);
    const d = base.get("drawer");
    if (d)
      props.drawer.position
        .copy(d.position)
        .add(new THREE.Vector3(0, 0, drawerOpen ? 1 : 0));
    tweens.clear();
    onDismiss?.();
  }
  function finishMotion() {
    for (const t of tweens.values()) {
      t.object.position.copy(t.to);
      t.object.quaternion.copy(t.toQ);
    }
    tweens.clear();
    wave = null;
    props.sway.value = 0;
    invalidate();
  }
  function rotate(dx, dy) {
    if (!["coffee", "book"].includes(inspection)) return;
    finishMotion();
    const object = props[inspection];
    const parent = object.parent.getWorldQuaternion(new THREE.Quaternion());
    const world = object.getWorldQuaternion(new THREE.Quaternion());
    const right = new THREE.Vector3(1, 0, 0).applyQuaternion(camera.quaternion);
    const up = new THREE.Vector3(0, 1, 0).applyQuaternion(camera.quaternion);
    world.premultiply(new THREE.Quaternion().setFromAxisAngle(up, dx * 0.009));
    world.premultiply(
      new THREE.Quaternion().setFromAxisAngle(right, dy * 0.009),
    );
    object.quaternion.copy(parent.invert().multiply(world));
    invalidate();
  }
  return {
    activate,
    dismiss,
    update,
    reset,
    finishMotion,
    rotate,
    getState: () => ({
      inspection,
      drawerOpen,
      moving: !!(tweens.size || wave),
      plantMoving: !!wave,
      rotation: ["coffee", "book"].includes(inspection)
        ? props[inspection].quaternion
            .toArray()
            .map((v) => v.toFixed(4))
            .join(",")
        : "",
    }),
  };
}
