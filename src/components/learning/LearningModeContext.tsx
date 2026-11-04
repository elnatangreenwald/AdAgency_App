import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { matchPath, useLocation } from 'react-router-dom';
import type { TourDefinition, TourStep } from './types';
import { GENERAL_TOUR, PAGE_TOURS } from './tours';
import { findTourTarget, waitForTargets } from './dom';

const STORAGE_ENABLED = 'learningMode.enabled';
const STORAGE_SEEN = 'learningMode.seenTours';
const STORAGE_HOTSPOTS = 'learningMode.hotspots';

interface ActiveTour {
  tour: TourDefinition;
  steps: TourStep[];
  index: number;
}

interface LearningModeContextValue {
  enabled: boolean;
  setEnabled: (value: boolean) => void;
  hotspotsVisible: boolean;
  setHotspotsVisible: (value: boolean) => void;
  /** tour that belongs to the current screen, if any */
  pageTour: TourDefinition | null;
  active: ActiveTour | null;
  next: () => void;
  prev: () => void;
  close: () => void;
  replayPageTour: () => void;
  replayGeneralTour: () => void;
  resetAll: () => void;
}

const LearningModeContext = createContext<LearningModeContextValue | null>(null);

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage unavailable (private mode) - learning mode still works for the session
  }
}

export function findPageTour(pathname: string): TourDefinition | null {
  return PAGE_TOURS.find((t) => t.paths.some((p) => matchPath({ path: p, end: true }, pathname))) ?? null;
}

export function LearningModeProvider({ children }: { children: ReactNode }) {
  const location = useLocation();
  const [enabled, setEnabledState] = useState<boolean>(() => readJson(STORAGE_ENABLED, false));
  const [seen, setSeen] = useState<string[]>(() => readJson(STORAGE_SEEN, []));
  const [hotspotsVisible, setHotspotsState] = useState<boolean>(() => readJson(STORAGE_HOTSPOTS, true));
  const [active, setActive] = useState<ActiveTour | null>(null);
  const activeRef = useRef<ActiveTour | null>(null);
  activeRef.current = active;
  const queueRef = useRef<TourDefinition[]>([]);
  const runIdRef = useRef(0);

  const pageTour = useMemo(() => findPageTour(location.pathname), [location.pathname]);

  const markSeen = useCallback((id: string) => {
    setSeen((prev) => {
      if (prev.includes(id)) return prev;
      const nextSeen = [...prev, id];
      writeJson(STORAGE_SEEN, nextSeen);
      return nextSeen;
    });
  }, []);

  const launch = useCallback(async (tours: TourDefinition[]) => {
    const runId = ++runIdRef.current;
    setActive(null);
    queueRef.current = tours.slice(1);
    const tour = tours[0];
    if (!tour) return;

    const targetIds = tour.steps.map((s) => s.target).filter((t): t is string => !!t);
    await waitForTargets(targetIds, 3500);
    if (runId !== runIdRef.current) return;

    const steps = tour.steps.filter((s) => !s.target || findTourTarget(s.target));
    if (steps.length === 0) {
      markSeen(tour.id);
      return;
    }
    setActive({ tour, steps, index: 0 });
  }, [markSeen]);

  const finishCurrent = useCallback(() => {
    const cur = activeRef.current;
    if (cur) markSeen(cur.tour.id);
    setActive(null);
    const [nextTour, ...rest] = queueRef.current;
    queueRef.current = rest;
    if (nextTour) {
      window.setTimeout(() => launch([nextTour, ...rest]), 250);
    }
  }, [launch, markSeen]);

  // auto-start the screen's tour the first time the user lands on it
  useEffect(() => {
    runIdRef.current++;
    setActive(null);
    queueRef.current = [];
    if (!enabled) return;

    const tours: TourDefinition[] = [];
    if (!seen.includes(GENERAL_TOUR.id)) tours.push(GENERAL_TOUR);
    if (pageTour && !seen.includes(pageTour.id)) tours.push(pageTour);
    if (tours.length === 0) return;

    const timer = window.setTimeout(() => launch(tours), 400);
    return () => window.clearTimeout(timer);
    // `seen` is intentionally left out: finishing a tour must not re-trigger this effect
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, enabled, pageTour, launch]);

  const next = useCallback(() => {
    const cur = activeRef.current;
    if (!cur) return;
    let i = cur.index + 1;
    // skip steps whose element disappeared since the tour started
    while (i < cur.steps.length && cur.steps[i].target && !findTourTarget(cur.steps[i].target!)) i++;
    if (i >= cur.steps.length) {
      finishCurrent();
      return;
    }
    setActive({ ...cur, index: i });
  }, [finishCurrent]);

  const prev = useCallback(() => {
    const cur = activeRef.current;
    if (!cur) return;
    let i = cur.index - 1;
    while (i > 0 && cur.steps[i].target && !findTourTarget(cur.steps[i].target!)) i--;
    setActive({ ...cur, index: Math.max(0, i) });
  }, []);

  const close = useCallback(() => {
    queueRef.current.forEach((t) => markSeen(t.id));
    queueRef.current = [];
    finishCurrent();
  }, [finishCurrent, markSeen]);

  const setEnabled = useCallback((value: boolean) => {
    setEnabledState(value);
    writeJson(STORAGE_ENABLED, value);
    if (!value) {
      runIdRef.current++;
      queueRef.current = [];
      setActive(null);
    }
  }, []);

  const setHotspotsVisible = useCallback((value: boolean) => {
    setHotspotsState(value);
    writeJson(STORAGE_HOTSPOTS, value);
  }, []);

  const replayPageTour = useCallback(() => {
    if (pageTour) launch([pageTour]);
  }, [launch, pageTour]);

  const replayGeneralTour = useCallback(() => {
    launch([GENERAL_TOUR]);
  }, [launch]);

  const resetAll = useCallback(() => {
    setSeen([]);
    writeJson(STORAGE_SEEN, []);
    launch(pageTour ? [GENERAL_TOUR, pageTour] : [GENERAL_TOUR]);
  }, [launch, pageTour]);

  const value = useMemo<LearningModeContextValue>(() => ({
    enabled,
    setEnabled,
    hotspotsVisible,
    setHotspotsVisible,
    pageTour,
    active,
    next,
    prev,
    close,
    replayPageTour,
    replayGeneralTour,
    resetAll,
  }), [enabled, setEnabled, hotspotsVisible, setHotspotsVisible, pageTour, active, next, prev, close, replayPageTour, replayGeneralTour, resetAll]);

  return <LearningModeContext.Provider value={value}>{children}</LearningModeContext.Provider>;
}

export function useLearningMode() {
  const ctx = useContext(LearningModeContext);
  if (!ctx) throw new Error('useLearningMode must be used inside LearningModeProvider');
  return ctx;
}
