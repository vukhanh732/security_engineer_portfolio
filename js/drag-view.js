// One gesture owner for camera orbit and held-object inspection. A small
// threshold keeps normal object clicks distinct from a drag.
export function createDragView({ canvas, canStart, onStart, onMove, onEnd }) {
  let gesture = null,
    suppressClick = false;
  function down(event) {
    if (!gesture && event.button === 0) suppressClick = false;
    if (gesture || event.button !== 0 || !canStart()) return;
    gesture = {
      id: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
      moved: false,
    };
    canvas.setPointerCapture(event.pointerId);
  }
  function move(event) {
    if (!gesture || event.pointerId !== gesture.id) return;
    const dx = event.clientX - gesture.x,
      dy = event.clientY - gesture.y;
    if (!gesture.moved && Math.hypot(dx, dy) < 5) return;
    event.preventDefault();
    if (!gesture.moved) {
      gesture.moved = true;
      onStart();
    }
    onMove(event.clientX - gesture.lastX, event.clientY - gesture.lastY);
    gesture.lastX = event.clientX;
    gesture.lastY = event.clientY;
  }
  function finish(event) {
    if (!gesture || (event && event.pointerId !== gesture.id)) return;
    const previous = gesture;
    gesture = null;
    if (previous.moved) {
      suppressClick = true;
      onEnd();
    }
    if (!event || event.type !== "pointerup") suppressClick = true;
    if (canvas.hasPointerCapture(previous.id))
      canvas.releasePointerCapture(previous.id);
  }
  function click(event) {
    if (suppressClick) {
      event.preventDefault();
      event.stopImmediatePropagation();
      suppressClick = false;
    }
  }
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move, { passive: false });
  for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
    canvas.addEventListener(type, finish);
  canvas.addEventListener("click", click, true);
  return {
    active: () => !!gesture,
    cancel: () => finish(),
    dispose() {
      finish();
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      for (const type of ["pointerup", "pointercancel", "lostpointercapture"])
        canvas.removeEventListener(type, finish);
      canvas.removeEventListener("click", click, true);
    },
  };
}
