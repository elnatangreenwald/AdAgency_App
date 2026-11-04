export function findTourTarget(id: string): HTMLElement | null {
  const nodes = document.querySelectorAll<HTMLElement>(`[data-tour="${id}"]`);
  for (const el of Array.from(nodes)) {
    if (isRenderable(el)) return el;
  }
  return null;
}

/** has a size and isn't pushed outside the viewport horizontally (e.g. the off-canvas mobile sidebar) */
export function isRenderable(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  if (r.width < 2 || r.height < 2) return false;
  if (r.right <= 0 || r.left >= window.innerWidth) return false;
  const style = window.getComputedStyle(el);
  return style.visibility !== 'hidden' && style.opacity !== '0';
}

export function isInViewport(r: DOMRect, margin = 0): boolean {
  return (
    r.top >= margin &&
    r.bottom <= window.innerHeight - margin &&
    r.left >= 0 &&
    r.right <= window.innerWidth
  );
}

/** true when something else (a dialog, the mobile menu...) sits on top of the element's center */
export function isCovered(el: HTMLElement): boolean {
  const r = el.getBoundingClientRect();
  const x = Math.min(Math.max(r.left + r.width / 2, 1), window.innerWidth - 1);
  const y = Math.min(Math.max(r.top + Math.min(r.height / 2, 20), 1), window.innerHeight - 1);
  const top = document.elementFromPoint(x, y);
  if (!top) return true;
  if (top.closest('[data-lm-ui]')) return false;
  return !(el === top || el.contains(top) || top.contains(el));
}

export function waitForTargets(ids: string[], timeoutMs: number): Promise<void> {
  return new Promise((resolve) => {
    if (ids.length === 0) return resolve();
    const started = Date.now();
    const check = () => {
      const found = ids.filter((id) => findTourTarget(id)).length;
      const elapsed = Date.now() - started;
      // all found, or most found and the page has had a moment to settle
      if (found === ids.length || (found >= Math.ceil(ids.length * 0.6) && elapsed > 900) || elapsed >= timeoutMs) {
        resolve();
      } else {
        window.setTimeout(check, 150);
      }
    };
    check();
  });
}
