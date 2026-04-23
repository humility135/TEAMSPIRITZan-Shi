import React from 'react';
import { Check, Zap, Wallet, TrendingUp, Sparkles, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAppStore } from '@/lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function Pricing() {
  const { currentUser } = useAppStore();
  const isPro = currentUser.subscription === 'pro';

  return (
    <div className="max-w-6xl mx-auto space-y-16 animate-in fade-in duration-500 pb-20 pt-8">
      <div className="text-center space-y-4">
        <Badge className="bg-primary/10 text-primary border-primary/20 uppercase tracking-widest">v3 · Marketplace-First</Badge>
        <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tight">
          永久免費。<br/><span className="text-primary">用得越多，慳得越多。</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          冇隱藏費用。建隊、開活動、賽後數據 — 全部免費。
          只有用平台代收場費先抽 4% service fee（球員透明顯示）。
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card className="relative overflow-hidden border-border bg-card/50 backdrop-blur p-10 flex flex-col">
          <div className="space-y-2 mb-6">
            <Badge variant="outline" className="uppercase tracking-widest text-xs">Free Forever</Badge>
            <h3 className="text-3xl font-display font-bold uppercase tracking-wider">免費版</h3>
            <div className="text-5xl font-display font-bold">$0<span className="text-lg text-muted-foreground font-sans font-normal">/月</span></div>
            <p className="text-sm text-muted-foreground">所有核心功能，永久免費</p>
          </div>

          <div className="space-y-3 flex-1 mb-8">
            <Feature text="無限建立 / 加入球隊"/>
            <Feature text="無限活動 (免費或收費)"/>
            <Feature text="RSVP / 候補 / 雙階段搶位"/>
            <Feature text="賽後數據 (進球、助攻、紅黃牌)"/>
            <Feature text="場地資料庫 + 一鍵導航"/>
            <Feature text="天文台撞波預警"/>
            <Feature text="終身個人歷史數據"/>
            <Feature text="公開約波 (Discover) 主辦 + 報名"/>
            <Feature text="Share Card 賽後戰報 (帶水印)"/>
          </div>

          <div className="rounded-xl bg-muted/30 border border-border p-4 mb-6 text-sm">
            <div className="font-bold tracking-wider uppercase text-xs text-muted-foreground mb-1">Transaction Fee</div>
            <div className="text-xl font-display font-bold text-white">4% <span className="text-sm text-muted-foreground font-sans font-normal">/ 球員側 (透明顯示)</span></div>
            <div className="text-xs text-muted-foreground mt-1">FPS 手動入數模式：0% 抽成</div>
          </div>

          <Button variant="outline" disabled className="w-full font-bold tracking-widest uppercase">
            你而家用緊
          </Button>
        </Card>

        <Card className="relative overflow-hidden border-primary bg-gradient-to-br from-primary/10 via-card/50 to-card/50 backdrop-blur p-10 flex flex-col">
          <div className="absolute top-0 inset-x-0 h-1 bg-primary" />
          <div className="absolute top-6 right-6">
            <Badge className="bg-primary text-primary-foreground uppercase tracking-widest text-xs">為認真嘅你</Badge>
          </div>
          <div className="space-y-2 mb-6">
            <Badge variant="outline" className="uppercase tracking-widest text-xs border-primary/40 text-primary">Pro</Badge>
            <h3 className="text-3xl font-display font-bold uppercase tracking-wider">Pro 球隊</h3>
            <div className="text-5xl font-display font-bold text-primary">$48<span className="text-lg text-muted-foreground font-sans font-normal">/月</span></div>
            <p className="text-sm text-muted-foreground">解鎖賺更多 / 慳更多嘅工具</p>
          </div>

          <div className="space-y-3 flex-1 mb-8">
            <Feature text="所有免費版功能" pro/>
            <Feature text="客製 Logo + 主題色 + 移除水印" pro highlight/>
            <Feature text="進階雷達圖 + 數據 dashboard" pro/>
            <Feature text="Transaction fee 半價 (4% → 2%)" pro highlight/>
            <Feature text="球隊財務報表 export (PDF / Excel)" pro/>
            <Feature text="每月 1 張 Welcome Match 試踢券" pro highlight/>
            <Feature text="Friendly Match 優先 matching" pro/>
            <Feature text="Season Recap 自動生成 (無水印)" pro/>
            <Feature text="優先客服 (< 4h workday)" pro/>
          </div>

          <div className="rounded-xl bg-primary/10 border border-primary/30 p-4 mb-6 text-sm">
            <div className="font-bold tracking-wider uppercase text-xs text-primary mb-1">Break-even Point</div>
            <div className="text-base font-display font-bold text-white">月成交 ≥ $4,800 即回本</div>
            <div className="text-xs text-muted-foreground mt-1">節省 2% transaction fee 已 cover 月費</div>
          </div>

          <CheckoutButton label={isPro ? '已訂閱 Pro' : '升級 Pro · $48/月'} disabled={isPro} />
        </Card>
      </div>

      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl md:text-4xl font-display font-bold uppercase tracking-tight">
            幾時會收 <span className="text-primary">Transaction Fee</span>？
          </h2>
          <p className="text-muted-foreground mt-2">完全透明 — 球員自己睇到、自己付</p>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <ExampleCard
            icon={<Wallet className="w-6 h-6"/>}
            title="球員報名收費活動"
            example="$50 報名費"
            fee="+ $2 平台手續費"
            total="球員結帳 $52"
            note="平台收 $2，扣 Stripe 後 net ~$1"
          />
          <ExampleCard
            icon={<TrendingUp className="w-6 h-6"/>}
            title="Pro 球隊半價"
            example="$50 報名費"
            fee="+ $1 平台手續費 (2%)"
            total="球員結帳 $51"
            note="月成交 $5,000 已平回 Pro 月費"
            highlight
          />
          <ExampleCard
            icon={<Shield className="w-6 h-6"/>}
            title="FPS 手動入數"
            example="$50 報名費"
            fee="0% 平台抽成"
            total="球員結帳 $50"
            note="Admin 自己對數，永久免費 fallback"
          />
        </div>
      </div>

      <div className="rounded-3xl bg-gradient-to-br from-card via-card/80 to-primary/5 border border-border p-8 md:p-12 space-y-6">
        <div className="flex items-start gap-4">
          <Sparkles className="w-8 h-8 text-primary shrink-0 mt-1"/>
          <div>
            <h3 className="text-2xl font-display font-bold uppercase tracking-wider mb-2">不可抗力 100% 退款</h3>
            <p className="text-muted-foreground">天文台掛 8 號風球 / 黑雨 / 場地 force closure，活動自動取消、全員 100% 退款、平台不抽成。Admin 唔可以 override，保護球員。</p>
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

function ExampleCard({ icon, title, example, fee, total, note, highlight }: any) {
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

function CheckoutButton({ label, disabled }: { label: string; disabled?: boolean }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full h-12 font-bold tracking-widest uppercase" disabled={disabled}>
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display uppercase tracking-wider text-2xl">Stripe 結帳 (Mock)</DialogTitle>
        </DialogHeader>
        <div className="py-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8 text-primary" />
          </div>
          <p className="text-muted-foreground">這是 demo 結帳介面。實際應用會載入 Stripe Subscriptions Elements。</p>
          <Button size="lg" className="w-full h-14 font-bold tracking-wider uppercase mt-8 bg-[#635BFF] hover:bg-[#635BFF]/90 text-white">
            Pay with Stripe · $48/月
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
