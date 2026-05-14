import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Shield, Zap, Target, ArrowRight, Check, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';

export default function Home() {
  const { t, lang, setLang } = useI18n();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top Navigation */}
      <header className="fixed top-0 inset-x-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl font-display font-bold tracking-widest text-primary uppercase">
            TEAMSPIRIT
          </Link>

          {/* Centre Nav */}
          <nav className="hidden md:flex items-center gap-8">
            <a href="#about" className="text-sm font-bold tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors">{t('homeAbout')}</a>
            <a href="#pricing" className="text-sm font-bold tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors">{t('pricingTitle')}</a>
            <a href="#contact" className="text-sm font-bold tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors">{t('homeContactTitle')}</a>
          </nav>

          {/* Auth & Lang */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" className="font-bold tracking-wide uppercase px-2" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>
              {lang === 'zh' ? 'EN' : '中'}
            </Button>
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-bold tracking-wide uppercase">{t('login')}</Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="font-bold tracking-wide uppercase">{t('register')}</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/src/assets/images/hero-stadium.png" alt={t('heroImageAlt')} className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>

        <div className="container mx-auto relative z-10 max-w-5xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
          >
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-4 py-1 text-sm tracking-widest uppercase">
              {t('homeTagline')}
            </Badge>
            <h1 className="text-5xl md:text-8xl font-display font-bold uppercase tracking-tight leading-none">
              {t('homeHeroTitleLine1')}<br/>
              <span className="text-primary">{t('homeHeroTitleChaos')}</span> {t('homeHeroTitleTo')} <span className="text-white">{t('homeHeroTitleControl')}</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              {t('homeHeroDesc')}
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" className="w-full text-lg h-14 px-8 font-bold tracking-wide uppercase group">
                  {t('homeCTA')}
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#pricing" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full text-lg h-14 px-8 font-bold tracking-wide uppercase">
                  {t('homePricingCTA')}
                </Button>
              </a>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature: Discover Public Matches */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-gradient-to-r from-primary/20 via-background to-background border border-primary/20 rounded-3xl p-8 md:p-16 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/50 tracking-widest uppercase">{t('homeFeatureTitle')}</Badge>
              <h2 className="text-4xl md:text-5xl font-display font-bold uppercase">{t('homeRadarTitle')}</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                {t('homeRadarDesc')}
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3"><Check className="text-primary w-5 h-5" /> <span className="font-bold">{t('homeRadarBullet1')}</span></li>
                <li className="flex items-center gap-3"><Check className="text-primary w-5 h-5" /> <span className="font-bold">{t('homeRadarBullet2')}</span></li>
                <li className="flex items-center gap-3"><Check className="text-primary w-5 h-5" /> <span className="font-bold">{t('homeRadarBullet3')}</span></li>
              </ul>
              <div className="pt-4">
                <Link href="/discover">
                  <Button size="lg" className="font-bold tracking-wide uppercase group">
                    <Compass className="w-5 h-5 mr-2" /> {t('homeRadarCTA')}
                  </Button>
                </Link>
              </div>
            </div>
            <div className="flex-1 w-full max-w-sm">
              <Card className="p-6 bg-card/80 backdrop-blur border-border space-y-4 rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="flex justify-between">
                  <Badge className="bg-primary text-black font-bold">{t('publicLabel')}</Badge>
                  <span className="font-bold text-lg text-primary">$60</span>
                </div>
                <h3 className="text-2xl font-bold">{t('homeDemoVenueName')}</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>{t('homeDemoVenueDistrict')}</span> • <span>{t('hostMatchSurfaceHard')}</span> • <span>3★ {t('teamDetailLevel')}</span>
                </div>
                <div className="space-y-2 pt-4">
                  <div className="flex justify-between text-xs font-bold">
                    <span>{t('dashboardSpotsRegistered')} 12 / 14</span>
                    <span className="text-primary">{t('spotsLeft').replace('{count}', '2')}</span>
                  </div>
                  <div className="h-2 bg-primary/20 rounded-full overflow-hidden">
                    <div className="h-full bg-primary w-[85%]" />
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 bg-card/30">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard
              icon={Zap}
              title={t('homeFeature1Title')}
              desc={t('homeFeature1Desc')}
            />
            <FeatureCard
              icon={Shield}
              title={t('homeFeature2Title')}
              desc={t('homeFeature2Desc')}
            />
            <FeatureCard
              icon={Target}
              title={t('homeFeature3Title')}
              desc={t('homeFeature3Desc')}
            />
          </div>
        </div>
      </section>

      {/* About Me */}
      <section id="about" className="py-24 px-4 border-t border-border">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-display font-bold uppercase">{t('homeAbout')}</h2>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {t('homeAboutDesc')}
          </p>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            {t('homeAboutDesc2')}
          </p>
        </div>
      </section>

      {/* Pricing Section (Preview) */}
      <section id="pricing" className="py-24 px-4 bg-card/30 border-t border-border">
        <div className="container mx-auto max-w-6xl space-y-16">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight">
              {t('homePricingTitle')}<br/><span className="text-primary">{t('homePricingTitleHighlight')}</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              {t('homePricingDesc')}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            <Card className="relative overflow-hidden border-border bg-card/50 backdrop-blur p-10 flex flex-col">
              <div className="space-y-2 mb-6">
                <Badge variant="outline" className="uppercase tracking-widest text-xs">{t('freeForever')}</Badge>
                <h3 className="text-3xl font-display font-bold uppercase tracking-wider">{t('homePricingFreeTitle')}</h3>
                <div className="text-5xl font-display font-bold">$0<span className="text-lg text-muted-foreground font-sans font-normal">{t('homePricingFreePrice')}</span></div>
                <p className="text-sm text-muted-foreground">{t('homePricingFreeDesc')}</p>
              </div>

              <div className="space-y-3 flex-1 mb-8">
                <Feature text={t('homePricingFreeFeature1')}/>
                <Feature text={t('homePricingFreeFeature2')}/>
                <Feature text={t('homePricingFreeFeature3')}/>
                <Feature text={t('homePricingFreeFeature4')}/>
                <Feature text={t('homePricingFreeFeature5')}/>
              </div>

              <Link href="/login" className="w-full mt-auto">
                <Button variant="outline" className="w-full font-bold tracking-widest uppercase">
                  {t('homePricingFreeCTA')}
                </Button>
              </Link>
            </Card>

            <Card className="relative overflow-hidden border-primary bg-gradient-to-br from-primary/10 via-card/50 to-card/50 backdrop-blur p-10 flex flex-col">
              <div className="absolute top-0 inset-x-0 h-1 bg-primary" />
              <div className="absolute top-6 right-6">
                <Badge className="bg-primary text-primary-foreground uppercase tracking-widest text-xs">{t('homePricingProBadge')}</Badge>
              </div>
              <div className="space-y-2 mb-6">
                <Badge variant="outline" className="uppercase tracking-widest text-xs border-primary/40 text-primary">{t('pro')}</Badge>
                <h3 className="text-3xl font-display font-bold uppercase tracking-wider">{t('homePricingProTitle')}</h3>
                <div className="text-5xl font-display font-bold text-primary">$48<span className="text-lg text-muted-foreground font-sans font-normal">{t('homePricingProPrice')}</span></div>
                <p className="text-sm text-muted-foreground">{t('homePricingProDesc')}</p>
              </div>

              <div className="space-y-3 flex-1 mb-8">
                <Feature text={t('homePricingProFeature1')} pro/>
                <Feature text={t('homePricingProFeature2')} pro highlight/>
                <Feature text={t('homePricingProFeature3')} pro/>
                <Feature text={t('homePricingProFeature4')} pro highlight/>
                <Feature text={t('homePricingProFeature5')} pro/>
              </div>

              <Link href="/pricing" className="w-full mt-auto">
                <Button className="w-full font-bold tracking-widest uppercase">
                  {t('homePricingProCTA')}
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Us */}
      <section id="contact" className="py-24 px-4 bg-card/30">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-display font-bold uppercase">{t('homeContactTitle')}</h2>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            {t('homeContactDesc')}
          </p>
          <div className="grid sm:grid-cols-3 gap-6 pt-4">
            <div className="p-6 rounded-2xl border border-border bg-card/50 space-y-2">
              <div className="text-xs font-bold tracking-widest uppercase text-muted-foreground">{t('homeContactEmail')}</div>
              <div className="font-bold text-foreground">hello@teamspirit.hk</div>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card/50 space-y-2">
              <div className="text-xs font-bold tracking-widest uppercase text-muted-foreground">{t('homeContactWhatsApp')}</div>
              <div className="font-bold text-foreground">+852 9XXX XXXX</div>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card/50 space-y-2">
              <div className="text-xs font-bold tracking-widest uppercase text-muted-foreground">{t('homeContactInstagram')}</div>
              <div className="font-bold text-foreground">@teamspirit.hk</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-32 px-4 border-t border-border">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-display font-bold uppercase">{t('homeFooterCTA')}</h2>
          <p className="text-xl text-muted-foreground">{t('homeFooterDesc')}</p>
          <Link href="/login">
            <Button size="lg" className="text-lg h-14 px-12 font-bold tracking-wide uppercase">
              {t('homeFooterBtn')}
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: { icon: React.ComponentType<{ className?: string }>; title: string; desc: string }) {
  return (
    <Card className="bg-card/50 backdrop-blur border-border p-8 hover:border-primary/50 transition-colors">
      <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
        <Icon className="w-7 h-7 text-primary" />
      </div>
      <h3 className="text-2xl font-display font-bold mb-4 uppercase tracking-wide">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{desc}</p>
    </Card>
  );
}

function Feature({ text, pro, highlight }: { text: string; pro?: boolean; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <Check className={`w-5 h-5 shrink-0 mt-0.5 ${pro ? 'text-primary' : 'text-foreground/70'}`} />
      <span className={highlight ? 'text-white font-bold' : 'text-foreground/80'}>{text}</span>
    </div>
  );
}
