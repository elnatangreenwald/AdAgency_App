import { useEffect, useMemo, useRef, useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { useLearningMode } from './LearningModeContext';
import { findTourTarget, isCovered } from './dom';
import type { TourStep } from './types';

const BEACON = 22;
const POP_W = 280;

interface Spot {
  key: string;
  step: TourStep;
  x: number;
  y: number;
}

/**
 * Small pulsing "?" markers on the important elements of the current screen.
 * Hovering or clicking one opens a short explanation bubble.
 */
export function Hotspots() {
  const { enabled, hotspotsVisible, active, pageTour } = useLearningMode();
  const [spots, setSpots] = useState<Spot[]>([]);
  const [openKey, setOpenKey] = useState<string | null>(null);
  const [pinned, setPinned] = useState(false);
  const coveredRef = useRef<Set<string>>(new Set());
  const lastSig = useRef('');
  const closeTimer = useRef<number | undefined>(undefined);

  const show = enabled && hotspotsVisible && !active && !!pageTour;
  const steps = useMemo(() => (pageTour ? pageTour.steps.filter((s) => s.target) : []), [pageTour]);

  useEffect(() => {
    setOpenKey(null);
    setPinned(false);
  }, [pageTour]);

  useEffect(() => {
    if (!show) {
      setSpots([]);
      lastSig.current = '';
      return;
    }
    let frame = 0;

    // elementFromPoint is relatively costly - check occlusion a few times a second, not every frame
    const occlusion = window.setInterval(() => {
      const covered = new Set<string>();
      for (const s of steps) {
        const el = findTourTarget(s.target!);
        if (el && isCovered(el)) covered.add(s.target!);
      }
      coveredRef.current = covered;
    }, 300);

    const tick = () => {
      const next: Spot[] = [];
      for (const s of steps) {
        if (coveredRef.current.has(s.target!)) continue;
        const el = findTourTarget(s.target!);
        if (!el) continue;
        const r = el.getBoundingClientRect();
        // RTL: content starts at the right edge, so full-width rows still get the marker next to their content
        const x = r.right - 2;
        const y = r.top + 2;
        const minY = window.innerWidth < 1024 ? 72 : 8; // below the fixed mobile header
        if (y < minY || y > window.innerHeight - 30 || x < 0 || x > window.innerWidth - BEACON) continue;
        next.push({ key: s.target!, step: s, x, y });
      }
      const sig = next.map((n) => `${n.key}:${Math.round(n.x)}:${Math.round(n.y)}`).join('|');
      if (sig !== lastSig.current) {
        lastSig.current = sig;
        setSpots(next);
      }
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(frame);
      window.clearInterval(occlusion);
    };
  }, [show, steps]);

  useEffect(() => {
    if (!pinned) return;
    const onDown = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-lm-hotspot]')) {
        setOpenKey(null);
        setPinned(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [pinned]);

  const hoverOpen = (key: string) => {
    window.clearTimeout(closeTimer.current);
    if (!pinned) setOpenKey(key);
  };
  const hoverClose = () => {
    if (pinned) return;
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setOpenKey(null), 180);
  };

  if (!show || spots.length === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[900]" dir="rtl" data-lm-ui>
      {spots.map((s) => {
        const open = openKey === s.key;
        const below = s.y + 180 < window.innerHeight;
        const popLeft = Math.max(12, Math.min(s.x - POP_W + 20, window.innerWidth - POP_W - 12));
        return (
          <div key={s.key} data-lm-hotspot>
            <button
              type="button"
              aria-label={`הסבר: ${s.step.title}`}
              className="lm-beacon pointer-events-auto absolute flex items-center justify-center rounded-full border-2 border-white bg-[#e9c46a] text-[12px] font-black text-[#043841] shadow-md transition-transform hover:scale-125"
              style={{ left: s.x - BEACON / 2, top: s.y - BEACON / 2, width: BEACON, height: BEACON, isolation: 'isolate' }}
              onMouseEnter={() => hoverOpen(s.key)}
              onMouseLeave={hoverClose}
              onClick={(e) => {
                e.stopPropagation();
                if (pinned && open) {
                  setPinned(false);
                  setOpenKey(null);
                } else {
                  setPinned(true);
                  setOpenKey(s.key);
                }
              }}
            >
              ?
            </button>
            {open && (
              <div
                className="lm-pop pointer-events-auto absolute rounded-xl bg-white p-3.5 shadow-2xl ring-1 ring-black/5"
                style={{
                  width: POP_W,
                  left: popLeft,
                  ...(below ? { top: s.y + BEACON / 2 + 8 } : { bottom: window.innerHeight - s.y + BEACON / 2 + 8 }),
                }}
                onMouseEnter={() => hoverOpen(s.key)}
                onMouseLeave={hoverClose}
              >
                <div className="mb-1 text-sm font-bold text-[#043841]">{s.step.title}</div>
                <p className="whitespace-pre-line text-[13px] leading-relaxed text-gray-600">{s.step.body}</p>
                {s.step.tip && (
                  <div className="mt-2 flex items-start gap-1.5 text-[12px] leading-relaxed text-amber-800">
                    <Lightbulb className="mt-0.5 h-3.5 w-3.5 flex-shrink-0 text-amber-500" />
                    <span>{s.step.tip}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
