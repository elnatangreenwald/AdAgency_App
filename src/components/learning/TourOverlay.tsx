import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Lightbulb, X, GraduationCap } from 'lucide-react';
import { useLearningMode } from './LearningModeContext';
import { findTourTarget, isInViewport } from './dom';
import type { TourPlacement } from './types';

const SPOT_PAD = 8;
const GAP = 16;
const EDGE = 12;

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

interface BubblePos {
  top: number;
  left: number;
  side: Exclude<TourPlacement, 'auto'> | 'float';
  arrow: number;
}

function sameBox(a: Box | null, b: Box | null) {
  if (!a || !b) return a === b;
  return (
    Math.abs(a.top - b.top) < 0.5 &&
    Math.abs(a.left - b.left) < 0.5 &&
    Math.abs(a.width - b.width) < 0.5 &&
    Math.abs(a.height - b.height) < 0.5
  );
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

/** spotlight rect, clipped to the viewport so huge elements (tables, boards) still get a visible frame */
function toSpot(r: DOMRect): Box {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const top = clamp(r.top - SPOT_PAD, 4, vh - 4);
  const left = clamp(r.left - SPOT_PAD, 4, vw - 4);
  const bottom = clamp(r.bottom + SPOT_PAD, 4, vh - 4);
  const right = clamp(r.right + SPOT_PAD, 4, vw - 4);
  return { top, left, width: Math.max(0, right - left), height: Math.max(0, bottom - top) };
}

function placeBubble(spot: Box, w: number, h: number, preferred: TourPlacement): BubblePos {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const space = {
    bottom: vh - (spot.top + spot.height),
    top: spot.top,
    left: spot.left,
    right: vw - (spot.left + spot.width),
  };
  const fits = {
    bottom: space.bottom >= h + GAP + EDGE,
    top: space.top >= h + GAP + EDGE,
    left: space.left >= w + GAP + EDGE,
    right: space.right >= w + GAP + EDGE,
  };
  const order: Array<keyof typeof fits> =
    preferred !== 'auto' ? [preferred, 'bottom', 'top', 'left', 'right'] : ['bottom', 'top', 'left', 'right'];
  const side = order.find((s) => fits[s]);
  const cx = spot.left + spot.width / 2;
  const cy = spot.top + spot.height / 2;

  if (side === 'bottom' || side === 'top') {
    const left = clamp(cx - w / 2, EDGE, vw - w - EDGE);
    const top = side === 'bottom' ? spot.top + spot.height + GAP : spot.top - GAP - h;
    return { top, left, side, arrow: clamp(cx - left, 22, w - 22) };
  }
  if (side === 'left' || side === 'right') {
    const top = clamp(cy - h / 2, EDGE, vh - h - EDGE);
    const left = side === 'left' ? spot.left - GAP - w : spot.left + spot.width + GAP;
    return { top, left, side, arrow: clamp(cy - top, 22, h - 22) };
  }
  // the element fills the screen - float the bubble inside its lower part
  return {
    top: clamp(spot.top + spot.height - h - 24, EDGE, vh - h - EDGE),
    left: clamp(cx - w / 2, EDGE, vw - w - EDGE),
    side: 'float',
    arrow: 0,
  };
}

export function TourOverlay() {
  const { active, next, prev, close } = useLearningMode();
  const [spot, setSpot] = useState<Box | null>(null);
  const [bubble, setBubble] = useState<BubblePos | null>(null);
  const [lost, setLost] = useState(false);
  const [gliding, setGliding] = useState(false);
  const bubbleRef = useRef<HTMLDivElement>(null);
  const spotRef = useRef<Box | null>(null);

  const step = active ? active.steps[active.index] : null;
  const total = active?.steps.length ?? 0;
  const index = active?.index ?? 0;
  const isLast = index === total - 1;

  // bring the target into view, then follow it (scroll, resize, lazy data) every frame
  useEffect(() => {
    if (!step) return;
    // keep the previous spot so the frame glides to the new target
    setLost(false);
    setGliding(true);
    const glideTimer = window.setTimeout(() => setGliding(false), 450);

    let frame = 0;
    let cancelled = false;
    const el = step.target ? findTourTarget(step.target) : null;
    if (el) {
      const r = el.getBoundingClientRect();
      if (!isInViewport(r, 70)) {
        const tall = r.height > window.innerHeight * 0.6;
        el.scrollIntoView({ behavior: 'smooth', block: tall ? 'start' : 'center', inline: 'nearest' });
      }
    }

    const startedAt = performance.now();
    const tick = () => {
      if (cancelled) return;
      const target = step.target ? findTourTarget(step.target) : null;
      const box = target ? toSpot(target.getBoundingClientRect()) : null;
      if (!box && step.target && performance.now() - startedAt > 600) setLost(true);
      if (!sameBox(box, spotRef.current)) {
        spotRef.current = box;
        setSpot(box);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(glideTimer);
    };
  }, [step]);

  useEffect(() => {
    if (active) return;
    spotRef.current = null;
    setSpot(null);
    setBubble(null);
  }, [active]);

  useLayoutEffect(() => {
    if (!step || !bubbleRef.current) return;
    const { offsetWidth: w, offsetHeight: h } = bubbleRef.current;
    if (!spot) {
      if (step.target && !lost) return;
      setBubble({
        top: Math.max(EDGE, (window.innerHeight - h) / 2),
        left: Math.max(EDGE, (window.innerWidth - w) / 2),
        side: 'float',
        arrow: 0,
      });
      return;
    }
    setBubble(placeBubble(spot, w, h, step.placement ?? 'auto'));
  }, [spot, step, lost]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
      // RTL: left arrow moves forward
      else if (e.key === 'ArrowLeft' || e.key === 'Enter') next();
      else if (e.key === 'ArrowRight') prev();
      else return;
      e.preventDefault();
      e.stopPropagation();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [active, next, prev, close]);

  if (!active || !step) return null;

  const arrowStyle: React.CSSProperties | undefined = bubble && bubble.side !== 'float'
    ? bubble.side === 'bottom'
      ? { top: -7, left: bubble.arrow - 7 }
      : bubble.side === 'top'
        ? { bottom: -7, left: bubble.arrow - 7 }
        : bubble.side === 'left'
          ? { right: -7, top: bubble.arrow - 7 }
          : { left: -7, top: bubble.arrow - 7 }
    : undefined;

  return (
    <div className="fixed inset-0 z-[5000]" dir="rtl" aria-live="polite">
      {/* swallow clicks so the page underneath can't be changed mid-tour */}
      <div className="absolute inset-0" onClick={(e) => e.stopPropagation()} />

      {spot ? (
        <div
          className={`lm-spotlight pointer-events-none absolute rounded-xl ${gliding ? 'lm-gliding' : ''}`}
          style={{ top: spot.top, left: spot.left, width: spot.width, height: spot.height }}
        />
      ) : (
        <div className="lm-backdrop pointer-events-none absolute inset-0" />
      )}

      <div
        ref={bubbleRef}
        role="dialog"
        aria-label={step.title}
        className="lm-bubble absolute w-[min(360px,calc(100vw-24px))] rounded-2xl bg-white shadow-2xl"
        style={{
          top: bubble?.top ?? -9999,
          left: bubble?.left ?? -9999,
          visibility: bubble ? 'visible' : 'hidden',
        }}
      >
        {arrowStyle && <span className="absolute h-3.5 w-3.5 rotate-45 bg-white" style={arrowStyle} />}

        <div key={`${active.tour.id}-${index}`} className="lm-pop relative overflow-hidden rounded-2xl">
          <div className="h-1.5 bg-gradient-to-l from-[#043841] via-[#3d817a] to-[#e9c46a]" />
          <div className="p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#043841]/10 px-2.5 py-1 text-xs font-semibold text-[#043841]">
                <GraduationCap className="h-3.5 w-3.5" />
                {active.tour.name}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-medium text-gray-400">
                  {index + 1} / {total}
                </span>
                <button
                  type="button"
                  onClick={close}
                  className="rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
                  aria-label="סגור סיור"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <h3 className="mb-1.5 text-lg font-bold leading-snug text-[#043841]">{step.title}</h3>
            <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-gray-600">{step.body}</p>

            {step.tip && (
              <div className="mt-3 flex items-start gap-2 rounded-xl bg-amber-50 px-3 py-2 text-[13px] leading-relaxed text-amber-900">
                <Lightbulb className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                <span>{step.tip}</span>
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-1" aria-hidden>
                {active.steps.map((_, i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === index ? 'w-5 bg-[#3d817a]' : i < index ? 'w-1.5 bg-[#3d817a]/50' : 'w-1.5 bg-gray-200'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                {index > 0 && (
                  <button
                    type="button"
                    onClick={prev}
                    className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100"
                  >
                    <ChevronRight className="h-4 w-4" />
                    הקודם
                  </button>
                )}
                <button
                  type="button"
                  onClick={next}
                  autoFocus
                  className="inline-flex items-center gap-1 rounded-lg bg-[#043841] px-4 py-2 text-sm font-semibold text-white shadow-md transition-all hover:bg-[#3d817a] hover:shadow-lg"
                >
                  {isLast ? 'הבנתי, תודה!' : 'הבא'}
                  {!isLast && <ChevronLeft className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {index === 0 && (
              <p className="mt-3 hidden text-center text-[11px] text-gray-400 sm:block">
                אפשר לנווט עם החיצים במקלדת · Esc לסגירה
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
