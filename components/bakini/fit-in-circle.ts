/*
 * fit-in-circle.ts: keeps the words in a round badge inside its circle (a "Save $500" roundel, a disc
 * with a number), in every currency and language. The owner's rule (Bakini, 11 Nov 2026): "AED 1,837" ran
 * out of the pink circle and other amounts touched its edge; words in a circle stay inside it.
 *
 * Copy this file into a Layout. Give the circle's lines a max-width (about 80% of the circle) and pass the
 * amount through breakable() (a whole amount loses ".00"; a long one may take two lines), and call fitInCircle(circle) after it is drawn, when its words change (a
 * currency or language pick, new data), after the fonts load and on resize (the circle may change size
 * at a breakpoint). Every child of the circle is a line; each line's font shrinks by the same factor until
 * every line of text lies inside the circle with `pad` px to spare (measured with the circle's own
 * transform removed, so a tilted roundel is measured upright), down to `min` of its size.
 *
 * It measures the words actually drawn, so it holds for every currency, also one the merchant adds later
 * with a long sign or code (the owner, 11 Nov 2026: "SAR overflowed a lot; it must hold for any currency").
 * Check a Layout with circle-fit-check.cjs (this folder): CURRENCIES=all and in Arabic, TOTAL 0.
 */

/** An amount for a circle. A whole amount drops its zero cents ("€7,738.00" -> "€7,738", "7.738,00 €" ->
 *  "7.738 €", Arabic "٫٠٠" too; the owner, 23 Nov 2026: ".00" fell to a line of its own). Exactly two zeros
 *  after the separator, never followed by a digit, so a thousands group ("7.000 €") is never touched. The
 *  no-break spaces Intl and Selldone put between sign and number become plain spaces, so a long amount may
 *  still take two lines ("AED" over "1,837"). Use it for the words in the circle only. */
export function breakable(text: string): string {
  return String(text)
    .replace(/([.,])00(?!\d)/g, "")
    .replace(/\u066b\u0660\u0660(?![\u0660-\u0669])/g, "")
    .replace(/[\u00a0\u202f]/g, " ");
}

export function fitInCircle(circle: HTMLElement | null | undefined, pad = 4, min = 0.45, oneLine = 0.6): void {
  if (!circle || !circle.isConnected) return;
  const lines = [...circle.children] as HTMLElement[];
  lines.forEach((l) => {
    l.style.fontSize = "";
    l.style.whiteSpace = "";
  });
  const sizes = lines.map((l) => parseFloat(getComputedStyle(l).fontSize) || 0);
  const keep = circle.style.transform;
  circle.style.transform = "none";
  const shrink = (floor: number): boolean => {
    for (let s = 1; s >= floor - 1e-9; s -= 0.04) {
      lines.forEach((l, i) => (l.style.fontSize = s < 1 ? (sizes[i] * s).toFixed(2) + "px" : ""));
      if (inside(circle, pad)) return true;
    }
    return false;
  };
  /* every line on one line first (an amount never breaks inside "7,738"); two lines only when one line
     would need the words below 60% of their size */
  lines.forEach((l) => (l.style.whiteSpace = "nowrap"));
  if (!shrink(oneLine)) {
    lines.forEach((l) => (l.style.whiteSpace = ""));
    shrink(min);
  }
  circle.style.transform = keep;
}

/** Every text line's corners inside the circle less `pad` (the top and bottom 12% of a line's box, the
 *  room above capitals and below the baseline, left out, as circle-fit-check.cjs does). */
function inside(circle: HTMLElement, pad: number): boolean {
  const r = circle.getBoundingClientRect();
  if (r.width < 1) return true; /* not laid out (display: none): nothing to fit yet */
  const cx = r.left + r.width / 2;
  const cy = r.top + r.height / 2;
  const R = Math.min(r.width, r.height) / 2 - pad;
  const walk = document.createTreeWalker(circle, NodeFilter.SHOW_TEXT);
  const range = document.createRange();
  for (let n = walk.nextNode(); n; n = walk.nextNode()) {
    if (!n.textContent?.trim()) continue;
    range.selectNodeContents(n);
    for (const q of range.getClientRects()) {
      if (q.width < 1 || q.height < 1) continue;
      const cut = q.height * 0.12;
      for (const [x, y] of [
        [q.left, q.top + cut],
        [q.right, q.top + cut],
        [q.left, q.bottom - cut],
        [q.right, q.bottom - cut],
      ])
        if (Math.hypot(x - cx, y - cy) > R) return false;
    }
  }
  return true;
}
