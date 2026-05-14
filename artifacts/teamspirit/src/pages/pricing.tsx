import React from 'react';
import { Check, Zap, Wallet, TrendingUp, Sparkles, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/lib/i18n';

export default function Pricing() {
  const { t } = useI18n();

  return (
    <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in duration-500 pb-20 pt-8">
      <div className="text-center space-y-4">
        <Badge className="bg-primary/10 text-primary border-primary/20 uppercase tracking-widest">{t('pricingBadge')}</Badge>
        <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tight">
          {t('pricingTitle')}<br/><span className="text-primary">{t('pricingTitleHighlight')}</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          {t('pricingDesc')}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="relative overflow-hidden border-border bg-card/50 backdrop-blur p-10 flex flex-col">
          <div className="space-y-2 mb-6">
            <Badge variant="outline" className="uppercase tracking-widest text-xs">{t('freeForever')}</Badge>
            <h3 className="text-3xl font-display font-bold uppercase tracking-wider">{t('pricingFreeTitle')}</h3>
            <div className="text-5xl font-display font-bold">$0<span className="text-lg text-muted-foreground font-sans font-normal">{t('pricingFreePrice')}</span></div>
            <p className="text-sm text-muted-foreground">{t('pricingFreeDesc')}</p>
          </div>

          <div className="space-y-3 flex-1 mb-8">
            <Feature text={t('homePricingFreeFeature1')}/>
            <Feature text={t('homePricingFreeFeature2')}/>
            <Feature text={t('homePricingFreeFeature3')}/>
            <Feature text={t('homePricingFreeFeature4')}/>
            <Feature text={t('homePricingFreeFeature5')}/>
            <Feature text={t('pricingFeatureWeather')}/>
            <Feature text={t('pricingFeatureHistory')}/>
            <Feature text={t('pricingFeatureDiscover')}/>
            <Feature text={t('pricingFeatureShare')}/>
          </div>

          <div className="rounded-xl bg-muted/30 border border-border p-4 mb-6 text-sm">
            <div className="font-bold tracking-wider uppercase text-xs text-muted-foreground mb-1">{t('pricingFreeFeeLabel')}</div>
            <div className="text-xl font-display font-bold text-white">{t('pricingFreeFee')} <span className="text-sm text-muted-foreground font-sans font-normal">{t('pricingFreeFeeDesc')}</span></div>
            <div className="text-xs text-muted-foreground mt-1">{t('pricingFreeFpsNote')}</div>
          </div>

          <Button variant="outline" disabled className="w-full font-bold tracking-widest uppercase">
            {t('pricingFreeCurrent')}
          </Button>
        </Card>

        <Card className="relative overflow-hidden border-primary bg-gradient-to-br from-primary/10 via-card/50 to-card/50 backdrop-blur p-10 flex flex-col">
          <div className="absolute top-0 inset-x-0 h-1 bg-primary" />
          <div className="absolute top-6 right-6">
            <Badge className="bg-primary text-primary-foreground uppercase tracking-widest text-xs">{t('pricingProBadge')}</Badge>
          </div>
          <div className="space-y-2 mb-6">
            <Badge variant="outline" className="uppercase tracking-widest text-xs border-primary/40 text-primary">{t('pro')}</Badge>
            <h3 className="text-3xl font-display font-bold uppercase tracking-wider">{t('pricingProTitle')}</h3>
            <div className="text-5xl font-display font-bold text-primary">$48<span className="text-lg text-muted-foreground font-sans font-normal">{t('pricingProPrice')}</span></div>
            <p className="text-sm text-muted-foreground">{t('pricingProDesc')}</p>
          </div>

          <div className="space-y-3 flex-1 mb-8">
            <Feature text={t('homePricingProFeature1')} pro/>
            <Feature text={t('homePricingProFeature2')} pro highlight/>
            <Feature text={t('homePricingProFeature3')} pro/>
            <Feature text={t('homePricingProFeature4')} pro highlight/>
            <Feature text={t('homePricingProFeature5')} pro/>
            <Feature text={t('pricingFeatureCoupon')} pro highlight/>
            <Feature text={t('pricingFeaturePriority')} pro/>
            <Feature text={t('pricingFeatureRecap')} pro/>
            <Feature text={t('pricingFeatureSupport')} pro/>
          </div>

          <div className="rounded-xl bg-primary/10 border border-primary/30 p-4 mb-6 text-sm">
            <div className="font-bold tracking-wider uppercase text-xs text-primary mb-1">{t('pricingProBreakEvenTitle')}</div>
            <div className="text-base font-display font-bold text-white">{t('pricingProBreakEven')}</div>
            <div className="text-xs text-muted-foreground mt-1">{t('pricingProBreakEvenDesc')}</div>
          </div>

          <Button asChild className="w-full h-12 font-bold tracking-widest uppercase">
            <a href="/login">{t('pricingProCTA')}</a>
          </Button>
        </Card>
      </div>

      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-tight">
            {t('pricingFeeTitle')} <span className="text-primary">{t('pricingFeeTitleHighlight')}</span>{t('pricingFeeTitleSuffix')}
          </h2>
          <p className="text-muted-foreground mt-2">{t('pricingFeeDesc')}</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <ExampleCard
            icon={<Wallet className="w-6 h-6"/>}
            title={t('pricingExample1Title')}
            example="$50"
            fee={t('pricingExample1Fee')}
            total="$52"
            note={t('pricingExample1Note')}
          />
          <ExampleCard
            icon={<TrendingUp className="w-6 h-6"/>}
            title={t('pricingExample2Title')}
            example="$50"
            fee={t('pricingExample2Fee')}
            total={t('pricingExample2Total')}
            note={t('pricingExample2Note')}
            highlight
          />
          <ExampleCard
            icon={<Shield className="w-6 h-6"/>}
            title={t('pricingExample3Title')}
            example="$50"
            fee={t('pricingExample3Fee')}
            total={t('pricingExample3Total')}
            note={t('pricingExample3Note')}
          />
        </div>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-card via-card/80 to-primary/5 border border-border p-8 md:p-12 space-y-6">
        <div className="flex items-start gap-4">
          <Sparkles className="w-8 h-8 text-primary shrink-0 mt-1"/>
          <div>
            <h3 className="text-2xl font-display font-bold uppercase tracking-wider mb-2">{t('pricingRefundTitle')}</h3>
            <p className="text-muted-foreground">{t('pricingRefundDesc')}</p>
          </div>
        </div>
      </div>

    </div>
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

function ExampleCard({ icon, title, example, fee, total, note, highlight }: { icon: React.ReactNode; title: string; example: string; fee: string; total: string; note: string; highlight?: boolean }) {
  return (
    <Card className={`p-6 space-y-3 ${highlight ? 'border-primary/40 bg-primary/5' : 'bg-card/50'}`}>
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${highlight ? 'bg-primary/20 text-primary' : 'bg-muted text-foreground'}`}>
        {icon}
      </div>
      <div className="font-display font-bold uppercase tracking-wider text-sm">{title}</div>
      <div className="space-y-1 text-sm">
        <div className="text-muted-foreground">{example}</div>
        <div className={highlight ? 'text-primary font-bold' : 'text-foreground/80'}>{fee}</div>
        <div className="text-xl font-display font-bold text-white">{total}</div>
      </div>
      <div className="text-xs text-muted-foreground border-t border-border pt-3">{note}</div>
    </Card>
  );
}
