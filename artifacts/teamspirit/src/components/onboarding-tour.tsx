import React, { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Users, Trophy, PartyPopper, Navigation, ArrowRight, ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

interface SpotRect { top: number; left: number; width: number; height: number }

interface TourStep {
  id: string;
  targetAttr?: string;
  placement: 'top' | 'bottom' | 'left' | 'right' | 'center';
  titleKey: string;
  descKey: string;
  icon: React.ReactNode;
  color: string;
}

function getSteps(t: (key: string) => string): TourStep[] {
  return [
    {
      id: 'welcome',
      placement: 'center',
      titleKey: 'tourWelcomeTitle',
      descKey: 'tourWelcomeDesc',
      icon: <Trophy className="w-10 h-10" />,
      color: "from-lime-500 to-green-600",
    },
    {
      id: 'navigation',
      targetAttr: 'tour-nav-dashboard',
      placement: 'right',
      titleKey: 'tourNavTitle',
      descKey: 'tourNavDesc',
      icon: <Navigation className="w-10 h-10" />,
      color: "from-blue-500 to-indigo-600",
    },
    {
      id: 'my-teams',
      targetAttr: 'tour-my-teams',
      placement: 'bottom',
      titleKey: 'tourMyTeamsTitle',
      descKey: 'tourMyTeamsDesc',
      icon: <Users className="w-10 h-10" />,
      color: "from-purple-500 to-pink-600",
    },
    {
      id: 'nearby-matches',
      targetAttr: 'tour-nearby-matches',
      placement: 'top',
      titleKey: 'tourNearbyMatchesTitle',
      descKey: 'tourNearbyMatchesDesc',
      icon: <Compass className="w-10 h-10" />,
      color: "from-orange-500 to-red-600",
    },
    {
      id: 'complete',
      placement: 'center',
      titleKey: 'tourCompleteTitle',
      descKey: 'tourCompleteDesc',
      icon: <PartyPopper className="w-10 h-10" />,
      color: "from-lime-500 to-green-600",
    },
  ];
}

function getTargetRect(attr: string): SpotRect | null {
  const el = document.querySelector(`[data-tour="${attr}"]`);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  if (r.width === 0 || r.height === 0) return null;
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

interface TooltipCoords {
  top: number;
  left: number;
  origin: string;
}

function calcTooltip(
  spot: SpotRect,
  placement: 'top' | 'bottom' | 'left' | 'right',
  vw: number,
  vh: number,
): TooltipCoords {
  const gap = 16;
  const cardW = 360;
  const cardH = 200;

  let top = 0;
  let left = 0;
  let origin = 'center center';

  const clampX = (x: number) => Math.max(16, Math.min(x, vw - cardW - 16));
  const clampY = (y: number) => Math.max(16, Math.min(y, vh - cardH - 16));

  switch (placement) {
    case 'bottom':
      top = clampY(spot.top + spot.height + gap);
      left = clampX(spot.left + spot.width / 2 - cardW / 2);
      origin = 'top center';
      break;
    case 'top':
      top = clampY(spot.top - cardH - gap);
      left = clampX(spot.left + spot.width / 2 - cardW / 2);
      origin = 'bottom center';
      break;
    case 'right':
      top = clampY(spot.top + spot.height / 2 - cardH / 2);
      left = clampX(spot.left + spot.width + gap);
      origin = 'left center';
      break;
    case 'left':
      top = clampY(spot.top + spot.height / 2 - cardH / 2);
      left = clampX(spot.left - cardW - gap);
      origin = 'right center';
      break;
  }

  return { top, left, origin };
}

export function OnboardingTour() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [stepIdx, setStepIdx] = useState(0);
  const [spotlight, setSpotlight] = useState<SpotRect | null>(null);
  const [tooltip, setTooltip] = useState<TooltipCoords | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const measureRef = useRef<number>(0);

  const STEPS = getSteps(t);
  const step = STEPS[stepIdx];
  const isCenter = step.placement === 'center';

  useEffect(() => {
    const hasSeen = localStorage.getItem('teamspirit_onboarding_seen');
    if (!hasSeen) {
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)');
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const measure = useCallback(() => {
    if (!step.targetAttr) {
      setSpotlight(null);
      setTooltip(null);
      return;
    }
    // Retry measurement a few times if element not found
    let attempts = 0;
    const tryMeasure = () => {
      const rect = getTargetRect(step.targetAttr!);
      if (rect) {
        setSpotlight(rect);
        if (!isMobile) {
          setTooltip(calcTooltip(rect, step.placement as 'top' | 'bottom' | 'left' | 'right', window.innerWidth, window.innerHeight));
        }
        // Scroll target into view
        const el = document.querySelector(`[data-tour="${step.targetAttr}"]`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else if (attempts < 8) {
        attempts++;
        setTimeout(tryMeasure, 120);
      }
    };
    tryMeasure();
  }, [step.targetAttr, step.placement, isMobile]);

  useEffect(() => {
    measure();
    const onResize = () => measure();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [measure]);

  const dismiss = () => {
    localStorage.setItem('teamspirit_onboarding_seen', 'true');
    setOpen(false);
  };

  const goNext = () => {
    if (stepIdx < STEPS.length - 1) {
      setStepIdx(stepIdx + 1);
    } else {
      dismiss();
    }
  };

  const goPrev = () => {
    if (stepIdx > 0) setStepIdx(stepIdx - 1);
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
      if (e.key === 'ArrowRight') goNext();
      if (e.key === 'ArrowLeft') goPrev();
    };
    if (open) window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, stepIdx]);

  if (!open) return null;

  const overlayVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  };

  const cardVariants = {
    initial: { opacity: 0, scale: 0.92, y: 16 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: 0.92, y: -12 },
  };

  const SpotlightRing = spotlight ? (
    <motion.div
      key={`ring-${step.id}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed pointer-events-none z-[101]"
      style={{
        top: spotlight.top - 4,
        left: spotlight.left - 4,
        width: spotlight.width + 8,
        height: spotlight.height + 8,
      }}
    >
      <div className="w-full h-full rounded-xl ring-2 ring-primary shadow-[0_0_24px_rgba(132,204,22,0.35)]" />
    </motion.div>
  ) : null;

  const renderQuadrants = () => {
    if (!spotlight) return null;
    const { top, left, width, height } = spotlight;
    const pad = 4;

    // Four quadrants covering all screen area except the spotlight hole
    const quadrants = [
      { key: 'top', style: { top: 0, left: 0, width: '100%', height: Math.max(0, top - pad) } },
      { key: 'bottom', style: { top: top + height + pad, left: 0, width: '100%', height: Math.max(0, window.innerHeight - (top + height + pad)) } },
      { key: 'left', style: { top: top - pad, left: 0, width: Math.max(0, left - pad), height: height + pad * 2 } },
      { key: 'right', style: { top: top - pad, left: left + width + pad, width: Math.max(0, window.innerWidth - (left + width + pad)), height: height + pad * 2 } },
    ];

    return quadrants.map(q => (
      <motion.div
        key={`${q.key}-${step.id}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed pointer-events-auto bg-zinc-950/70 backdrop-blur-[2px] z-[100]"
        style={q.style}
      />
    ));
  };

  const renderTooltip = () => {
    // Center card for welcome/complete steps
    if (isCenter) {
      return (
        <motion.div
          key={`center-${step.id}`}
          variants={cardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="fixed inset-0 z-[102] flex items-center justify-center p-4"
        >
          <div className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl overflow-hidden">
            <div className={`absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br ${step.color} opacity-20 blur-3xl rounded-full`} />
            <button
              onClick={dismiss}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors z-10"
              aria-label={t('close')}
            >
              <X className="w-5 h-5" />
            </button>
            <div className="relative space-y-6">
              <div className={`w-20 h-20 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
                {step.icon}
              </div>
              <div>
                <h2 className="text-2xl font-display font-bold text-white mb-2">{t(step.titleKey)}</h2>
                <p className="text-zinc-400 text-base leading-relaxed">{t(step.descKey)}</p>
              </div>
              <div className="flex items-center justify-between pt-2">
                <div className="flex gap-1.5">
                  {STEPS.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 rounded-full transition-all duration-300 ${i === stepIdx ? 'w-8 bg-primary' : 'w-2 bg-zinc-700'}`}
                    />
                  ))}
                </div>
                <Button onClick={goNext} size="lg" className="font-bold tracking-widest uppercase h-11 px-6">
                  {stepIdx === STEPS.length - 1 ? t('tourFinish') : t('tourNext')}
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    // Mobile: bottom sheet
    if (isMobile) {
      return (
        <motion.div
          key={`mobile-${step.id}`}
          variants={cardVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[102] p-4 pb-[calc(env(safe-area-inset-bottom)+5rem)]"
        >
          <div className="relative bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl">
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center`}>
                {step.icon}
              </div>
              <h3 className="font-display font-bold text-white text-lg">{t(step.titleKey)}</h3>
            </div>
            <p className="text-zinc-400 text-sm mb-4">{t(step.descKey)}</p>
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1 rounded-full transition-all duration-300 ${i === stepIdx ? 'w-6 bg-primary' : 'w-1.5 bg-zinc-700'}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={dismiss} className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1">{t('tourSkip')}</button>
                {stepIdx > 0 && (
                  <Button variant="outline" size="sm" onClick={goPrev} className="h-9">
                    <ArrowLeft className="w-4 h-4 mr-1" /> {t('tourBack')}
                  </Button>
                )}
                <Button onClick={goNext} size="sm" className="h-9 font-bold tracking-widest uppercase">
                  {stepIdx === STEPS.length - 1 ? t('tourFinish') : t('tourNext')}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      );
    }

    // Desktop: floating tooltip
    if (!tooltip) return null;
    return (
      <motion.div
        key={`tooltip-${step.id}`}
        variants={cardVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
        className="fixed z-[102]"
        style={{ top: tooltip.top, left: tooltip.left }}
      >
        <div className="relative w-[340px] bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl">
          <button
            onClick={dismiss}
            className="absolute top-3 right-3 text-zinc-500 hover:text-white transition-colors"
            aria-label={t('close')}
          >
            <X className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${step.color} flex items-center justify-center`}>
              {step.icon}
            </div>
            <div>
              <h3 className="font-display font-bold text-white">{t(step.titleKey)}</h3>
              <div className="text-[10px] text-zinc-500">{t('tourStepCount', { current: String(stepIdx + 1), total: String(STEPS.length) })}</div>
            </div>
          </div>
          <p className="text-zinc-400 text-sm mb-4 leading-relaxed">{t(step.descKey)}</p>
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {STEPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1 rounded-full transition-all duration-300 ${i === stepIdx ? 'w-6 bg-primary' : 'w-1.5 bg-zinc-700'}`}
                />
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={dismiss} className="text-xs text-zinc-500 hover:text-zinc-300 px-2 py-1">{t('tourSkip')}</button>
              {stepIdx > 0 && (
                <Button variant="outline" size="sm" onClick={goPrev} className="h-8">
                  <ArrowLeft className="w-3.5 h-3.5 mr-1" /> {t('tourBack')}
                </Button>
              )}
              <Button onClick={goNext} size="sm" className="h-8 font-bold tracking-widest uppercase">
                {stepIdx === STEPS.length - 1 ? t('tourFinish') : t('tourNext')}
              </Button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return createPortal(
    <AnimatePresence mode="wait">
      <motion.div
        key={`tour-${stepIdx}`}
        variants={overlayVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={{ duration: 0.3 }}
        className="fixed inset-0 z-[100]"
        role="dialog"
        aria-label={t('tourStepCount', { current: String(stepIdx + 1), total: String(STEPS.length) })}
        aria-modal="true"
      >
        {/* Full-screen dim overlay for center steps, or quadrant overlay for spotlight steps */}
        {isCenter ? (
          <div className="fixed inset-0 bg-zinc-950/80 backdrop-blur-sm z-[100]" onClick={dismiss} />
        ) : (
          <>
            {renderQuadrants()}
            {SpotlightRing}
          </>
        )}
        {renderTooltip()}
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}
