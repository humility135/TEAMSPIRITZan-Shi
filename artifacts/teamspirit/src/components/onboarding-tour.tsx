import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Compass, Users, Trophy, ShieldCheck, ArrowRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/lib/i18n';

interface Step {
  title: string;
  desc: string;
  icon: React.ReactNode;
  color: string;
}

function getSteps(t: (key: string) => string): Step[] {
  return [
    {
      title: t('tourStep1Title'),
      desc: t('tourStep1Desc'),
      icon: <Trophy className="w-12 h-12" />,
      color: "from-lime-500 to-green-600"
    },
    {
      title: t('tourStep2Title'),
      desc: t('tourStep2Desc'),
      icon: <Compass className="w-12 h-12" />,
      color: "from-blue-500 to-indigo-600"
    },
    {
      title: t('tourStep3Title'),
      desc: t('tourStep3Desc'),
      icon: <Users className="w-12 h-12" />,
      color: "from-purple-500 to-pink-600"
    },
    {
      title: t('tourStep4Title'),
      desc: t('tourStep4Desc'),
      icon: <ShieldCheck className="w-12 h-12" />,
      color: "from-orange-500 to-red-600"
    }
  ];
}

export function OnboardingTour() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const STEPS = getSteps(t);

  useEffect(() => {
    const hasSeen = localStorage.getItem('teamspirit_onboarding_seen');
    if (!hasSeen) {
      setOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem('teamspirit_onboarding_seen', 'true');
    setOpen(false);
  };

  const nextStep = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  if (!open) return null;

  const step = STEPS[currentStep];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/90 backdrop-blur-md"
      >
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl overflow-hidden"
        >
          <div className={`absolute -top-24 -right-24 w-64 h-64 bg-gradient-to-br ${step.color} opacity-20 blur-3xl rounded-full`} />

          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative space-y-8">
            <div className={`w-24 h-24 rounded-3xl bg-gradient-to-br ${step.color} flex items-center justify-center shadow-lg`}>
              {step.icon}
            </div>

            <div className="space-y-3">
              <h2 className="text-3xl font-display font-bold uppercase tracking-tight text-white">
                {step.title}
              </h2>
              <p className="text-zinc-400 text-lg leading-relaxed">
                {step.desc}
              </p>
            </div>

            <div className="flex items-center justify-between pt-4">
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className={`h-1.5 rounded-full transition-all duration-300 ${i === currentStep ? 'w-8 bg-primary' : 'w-2 bg-zinc-800'}`}
                  />
                ))}
              </div>

              <Button
                onClick={nextStep}
                size="lg"
                className="font-bold tracking-widest uppercase h-12 px-8"
              >
                {currentStep === STEPS.length - 1 ? t('tourStart') : t('tourNext')}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
