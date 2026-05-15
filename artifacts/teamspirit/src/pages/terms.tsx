import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { ChevronLeft, Shield, Lock, Scale, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useI18n } from '@/lib/i18n';

export default function Terms() {
  const { t, lang } = useI18n();

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-300 pb-20 selection:bg-primary selection:text-primary-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="hover:bg-zinc-800">
              <ChevronLeft className="w-4 h-4 mr-1" /> {t('termsBack')}
            </Button>
          </Link>
          <span className="font-display font-bold tracking-widest uppercase text-white">{t('termsHeader')}</span>
          <div className="w-20" /> {/* Spacer */}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-12 space-y-16">
        <section className="text-center space-y-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex p-3 rounded-2xl bg-primary/10 text-primary mb-2"
          >
            <Shield className="w-8 h-8" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-display font-bold text-white uppercase tracking-tight"
          >
            {t('termsTitle')}<span className="text-primary">{t('termsTitleHighlight')}</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-zinc-500 max-w-2xl mx-auto"
          >
            {t('termsUpdated')}
          </motion.p>
        </section>

        {/* Terms of Service */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <Scale className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-white uppercase tracking-wide">{t('termsSection1Title')}</h2>
          </div>

          <div className="grid gap-6">
            <Card className="p-6 bg-zinc-900/50 border-zinc-800">
              <h3 className="text-lg font-bold text-white mb-3">{t('termsSection1_1Title')}</h3>
              <p className="leading-relaxed">
                {t('termsSection1_1Body')}
              </p>
            </Card>

            <Card className="p-6 bg-zinc-900/50 border-zinc-800">
              <h3 className="text-lg font-bold text-white mb-3">{t('termsSection1_2Title')}</h3>
              <p className="leading-relaxed text-sm space-y-2">
                {t('termsSection1_2Body')}
              </p>
            </Card>

            <Card className="p-6 bg-zinc-900/50 border-zinc-800">
              <h3 className="text-lg font-bold text-white mb-3">{t('termsSection1_3Title')}</h3>
              <p className="leading-relaxed text-sm">
                {t('termsSection1_3Body')}
              </p>
            </Card>
          </div>
        </section>

        {/* Privacy Policy */}
        <section className="space-y-8">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-white uppercase tracking-wide">{t('termsSection2Title')}</h2>
          </div>

          <div className="grid gap-6">
            <Card className="p-6 bg-zinc-900/50 border-zinc-800">
              <h3 className="text-lg font-bold text-white mb-3">{t('termsSection2_1Title')}</h3>
              <ul className="list-disc list-inside space-y-2 text-sm">
                <li><span className="text-white font-bold">{t('termsSection2_1Bullet1Label')}</span>{t('termsSection2_1Bullet1')}</li>
                <li><span className="text-white font-bold">{t('termsSection2_1Bullet2Label')}</span>{t('termsSection2_1Bullet2')}</li>
                <li><span className="text-white font-bold">{t('termsSection2_1Bullet3Label')}</span>{t('termsSection2_1Bullet3')}</li>
              </ul>
            </Card>

            <Card className="p-6 bg-zinc-900/50 border-zinc-800">
              <h3 className="text-lg font-bold text-white mb-3">{t('termsSection2_2Title')}</h3>
              <p className="leading-relaxed text-sm">
                {t('termsSection2_2Body')}
              </p>
            </Card>
          </div>
        </section>

        {/* Footer info */}
        <section className="pt-10 border-t border-zinc-800 text-center">
          <p className="text-zinc-500 text-sm mb-6">
            {t('termsContactPrefix')}<br />
            <span className="text-primary">support@teamspirit.hk</span>
          </p>
        </section>
      </main>
    </div>
  );
}
