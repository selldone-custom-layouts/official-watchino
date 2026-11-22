/*
 * Fits the words of the round badges again when the window changes
 * size (a breakpoint can change a circle's size): one resize listener for
 * the whole page, each badge registers its own fit (fit-in-circle.ts).
 */
const live = new Set<() => void>();
let bound = false;
let frame = 0;

function onResize(): void {
  cancelAnimationFrame(frame);
  frame = requestAnimationFrame(() => live.forEach((fit) => fit()));
}

/** Run `fit` on every resize; returns the function that stops it. */
export function fitOnResize(fit: () => void): () => void {
  if (!bound && typeof window !== "undefined") {
    window.addEventListener("resize", onResize, { passive: true });
    bound = true;
  }
  live.add(fit);
  return () => live.delete(fit);
}
