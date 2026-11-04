import { useEffect, useRef, useState } from 'react';
import { GraduationCap, PlayCircle, Compass, RotateCcw, Power, HelpCircle } from 'lucide-react';
import { useLearningMode } from './LearningModeContext';

export function LearningModeButton() {
  const {
    enabled,
    setEnabled,
    hotspotsVisible,
    setHotspotsVisible,
    pageTour,
    active,
    replayPageTour,
    replayGeneralTour,
    resetAll,
  } = useLearningMode();
  const [menuOpen, setMenuOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [menuOpen]);

  useEffect(() => {
    if (active) setMenuOpen(false);
  }, [active]);

  const run = (fn: () => void) => () => {
    setMenuOpen(false);
    fn();
  };

  return (
    <div ref={rootRef} className="fixed bottom-5 left-[92px] z-[1002]" dir="rtl" data-lm-ui data-tour="learning-button">
      {menuOpen && enabled && (
        <div className="lm-pop absolute bottom-[calc(100%+12px)] left-0 w-[270px] overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5">
          <div className="bg-gradient-to-l from-[#043841] to-[#3d817a] px-4 py-3 text-white">
            <div className="flex items-center gap-2 text-sm font-bold">
              <GraduationCap className="h-4 w-4" />
              מצב לימודי
            </div>
            <div className="mt-0.5 text-xs text-white/75">
              {pageTour ? `אתה במסך: ${pageTour.name}` : 'אין סיור מוכן למסך הזה'}
            </div>
          </div>
          <div className="p-1.5">
            <MenuItem icon={PlayCircle} label="סיור מודרך במסך הזה" onClick={run(replayPageTour)} disabled={!pageTour} />
            <MenuItem icon={Compass} label="סיור היכרות כללי עם המערכת" onClick={run(replayGeneralTour)} />
            <button
              type="button"
              onClick={() => setHotspotsVisible(!hotspotsVisible)}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right text-sm text-gray-700 transition-colors hover:bg-gray-50"
            >
              <HelpCircle className="h-4 w-4 flex-shrink-0 text-[#3d817a]" />
              <span className="flex-1">סימני ? על המסך</span>
              <span
                className={`relative h-5 w-9 rounded-full transition-colors ${hotspotsVisible ? 'bg-[#3d817a]' : 'bg-gray-300'}`}
                aria-hidden
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${hotspotsVisible ? 'left-0.5' : 'left-[18px]'}`}
                />
              </span>
            </button>
            <MenuItem icon={RotateCcw} label="להתחיל את כל הסיורים מחדש" onClick={run(resetAll)} />
            <div className="my-1 h-px bg-gray-100" />
            <MenuItem
              icon={Power}
              label="כיבוי מצב לימודי"
              onClick={run(() => setEnabled(false))}
              className="text-red-600 hover:bg-red-50"
              iconClassName="text-red-500"
            />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => (enabled ? setMenuOpen((o) => !o) : setEnabled(true))}
        className={`group relative flex h-[52px] items-center gap-2 rounded-full pl-5 pr-4 text-[15px] font-bold transition-all duration-300 hover:-translate-y-0.5 ${
          enabled
            ? 'bg-[#043841] text-white shadow-lg ring-2 ring-[#e9c46a]'
            : 'lm-cta-glow bg-gradient-to-l from-[#e9c46a] to-[#f4a261] text-[#043841]'
        }`}
        aria-expanded={enabled ? menuOpen : undefined}
        title={enabled ? 'אפשרויות מצב לימודי' : 'הפעלת מצב לימודי - סיור מודרך בכל מסך'}
      >
        <GraduationCap className="h-5 w-5 transition-transform group-hover:-rotate-12" />
        <span>{enabled ? 'מצב לימודי פעיל' : 'מצב לימודי'}</span>
        {enabled ? (
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
          </span>
        ) : (
          <span className="rounded-full bg-[#043841] px-1.5 py-0.5 text-[10px] font-bold text-[#e9c46a]">חדש</span>
        )}
      </button>
    </div>
  );
}

interface MenuItemProps {
  icon: typeof PlayCircle;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  className?: string;
  iconClassName?: string;
}

function MenuItem({ icon: Icon, label, onClick, disabled, className = 'text-gray-700 hover:bg-gray-50', iconClassName = 'text-[#3d817a]' }: MenuItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-right text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${className}`}
    >
      <Icon className={`h-4 w-4 flex-shrink-0 ${iconClassName}`} />
      <span>{label}</span>
    </button>
  );
}
