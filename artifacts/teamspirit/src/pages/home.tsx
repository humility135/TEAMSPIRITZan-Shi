import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Shield, Zap, Target, ArrowRight, Check, Compass } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Home() {
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
            <Link href="/" className="text-sm font-bold tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors">Home</Link>
            <a href="#about" className="text-sm font-bold tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors">About</a>
            <a href="#pricing" className="text-sm font-bold tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
            <a href="#contact" className="text-sm font-bold tracking-wider uppercase text-muted-foreground hover:text-foreground transition-colors">Contact</a>
          </nav>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="font-bold tracking-wide uppercase">登入</Button>
            </Link>
            <Link href="/login">
              <Button size="sm" className="font-bold tracking-wide uppercase">註冊</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 px-4 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img src="/src/assets/images/hero-stadium.png" alt="Stadium" className="w-full h-full object-cover opacity-30" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-transparent" />
        </div>
        
        <div className="container mx-auto relative z-10 max-w-5xl">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-8"
          >
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 px-4 py-1 text-sm tracking-widest uppercase">
              香港業餘足球隊管理系統
            </Badge>
            <h1 className="text-5xl md:text-8xl font-display font-bold uppercase tracking-tight leading-none">
              Flip the switch from<br/>
              <span className="text-primary">chaos</span> to <span className="text-white">control.</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              告別 WhatsApp 群組的混亂。雙階段搶位候補、強制先付後佔位、賽後數據追蹤，為香港業餘球隊打造的專業級管理平台。
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
              <Button asChild size="lg" className="w-full sm:w-auto text-lg h-14 px-8 font-bold tracking-wide uppercase group">
                <Link href="/discover">
                  立即體驗
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-lg h-14 px-8 font-bold tracking-wide uppercase">
                <Link href="#pricing" onClick={(e) => {
                  e.preventDefault();
                  document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' });
                }}>
                  了解收費
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature: Discover Public Matches */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="bg-gradient-to-r from-primary/20 via-background to-background border border-primary/20 rounded-3xl p-8 md:p-16 flex flex-col md:flex-row items-center gap-12">
            <div className="flex-1 space-y-6">
              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/50 tracking-widest uppercase">全新功能</Badge>
              <h2 className="text-4xl md:text-5xl font-display font-bold uppercase">公開約波雷達</h2>
              <p className="text-xl text-muted-foreground leading-relaxed">
                唔使夾隊都踢到波！任何人 book 咗場都可以 publish 去公開市場。散兵游勇即時搜尋、報名、付款，一條龍完成。你嘅最強對手，可能就喺隔離區。
              </p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3"><Check className="text-primary w-5 h-5" /> <span className="font-bold">按地區及水平配對</span></li>
                <li className="flex items-center gap-3"><Check className="text-primary w-5 h-5" /> <span className="font-bold">搞手信譽評分系統</span></li>
                <li className="flex items-center gap-3"><Check className="text-primary w-5 h-5" /> <span className="font-bold">平台代管報名費防走數</span></li>
              </ul>
              <div className="pt-4">
                <Button asChild size="lg" className="font-bold tracking-wide uppercase group">
                  <Link href="/discover">
                    <Compass className="w-5 h-5 mr-2" /> 探索附近場地
                  </Link>
                </Button>
              </div>
            </div>
            <div className="flex-1 w-full max-w-sm">
              <Card className="p-6 bg-card/80 backdrop-blur border-border space-y-4 rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="flex justify-between">
                  <Badge className="bg-primary text-black font-bold">PUBLIC</Badge>
                  <span className="font-bold text-lg text-primary">$60</span>
                </div>
                <h3 className="text-2xl font-bold">摩士公園足球場</h3>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <span>黃大仙</span> • <span>硬地</span> • <span>3★ 水平</span>
                </div>
                <div className="space-y-2 pt-4">
                  <div className="flex justify-between text-xs font-bold">
                    <span>已報 12 / 14</span>
                    <span className="text-primary">尚餘 2 位</span>
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
              title="雙階段搶位機制"
              desc="不再需要人手排 Waiting List。有人退出，系統自動 Push 通知所有候補，10分鐘鎖定期搶位，公平高效。"
            />
            <FeatureCard 
              icon={Shield}
              title="先付款，後佔位"
              desc="整合 Stripe 信用卡及 FPS 手動核對。杜絕「放飛機」與「走數」，隊費管理從此輕鬆。"
            />
            <FeatureCard 
              icon={Target}
              title="職業級數據追蹤"
              desc="出席率、入球、助攻、紅黃牌全紀錄。Pro 用戶更可解鎖 FIFA 式個人能力雷達圖與終身數據。"
            />
          </div>
        </div>
      </section>

      {/* About Us */}
      <section id="about" className="py-24 px-4 border-t border-border">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-display font-bold uppercase">About Us</h2>
          <p className="text-xl text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            TEAMSPIRIT 由一班熱愛足球嘅香港人創立。我哋深知業餘球隊嘅痛點——搵人、收費、記分，樣樣都係 WhatsApp 解決，效率極低。我哋嘅目標係為香港業餘足球界打造一個專業、可靠、易用嘅一站式管理平台。
          </p>
          <p className="text-muted-foreground leading-relaxed max-w-2xl mx-auto">
            無論你係球隊隊長、散兵游勇定係場地搞手，TEAMSPIRIT 都為你而設。
          </p>
        </div>
      </section>

      {/* Pricing Summary */}
      <section id="pricing" className="py-24 px-4 bg-card/30 border-t border-border">
        <div className="container mx-auto max-w-6xl space-y-12">
          <div className="text-center space-y-4">
            <h2 className="text-4xl md:text-5xl font-display font-bold uppercase">Pricing</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              簡單透明嘅收費。永久免費核心功能，或者升級解鎖進階體驗。
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Free Plan */}
            <Card className="relative overflow-hidden border-border bg-card/50 backdrop-blur p-8 flex flex-col">
              <div className="space-y-2 mb-6">
                <Badge variant="outline" className="uppercase tracking-widest text-xs">Free Forever</Badge>
                <h3 className="text-2xl font-display font-bold uppercase tracking-wider">免費版</h3>
                <div className="text-4xl font-display font-bold">$0<span className="text-sm text-muted-foreground font-sans font-normal">/月</span></div>
              </div>
              <div className="space-y-3 flex-1 mb-8">
                <PricingFeature text="無限建立 / 加入球隊" />
                <PricingFeature text="無限發佈活動 (免費或收費)" />
                <PricingFeature text="雙階段搶位候補機制" />
                <PricingFeature text="賽後數據 (進球、助攻、紅黃牌)" />
                <PricingFeature text="4% 平台手續費 (球員側透明顯示)" />
              </div>
              <Link href="/login" className="w-full block">
                <Button variant="outline" className="w-full font-bold tracking-widest uppercase h-12">
                  立即開始
                </Button>
              </Link>
            </Card>

            {/* Pro Plan */}
            <Card className="relative overflow-hidden border-primary bg-gradient-to-br from-primary/10 via-card/50 to-card/50 backdrop-blur p-8 flex flex-col">
              <div className="absolute top-0 inset-x-0 h-1 bg-primary" />
              <div className="space-y-2 mb-6">
                <Badge variant="outline" className="uppercase tracking-widest text-xs border-primary/40 text-primary">Pro</Badge>
                <h3 className="text-2xl font-display font-bold uppercase tracking-wider">Pro 球隊</h3>
                <div className="text-4xl font-display font-bold text-primary">$48<span className="text-sm text-muted-foreground font-sans font-normal">/月</span></div>
              </div>
              <div className="space-y-3 flex-1 mb-8">
                <PricingFeature text="包含所有免費版功能" pro />
                <PricingFeature text="交易手續費半價 (4% → 2%)" pro />
                <PricingFeature text="客製化球隊 Logo + 專屬主題色" pro />
                <PricingFeature text="移除所有分享圖片水印" pro />
                <PricingFeature text="進階雷達圖 + 財務報表 Export" pro />
              </div>
              <Link href="/pricing" className="w-full block">
                <Button className="w-full font-bold tracking-widest uppercase h-12">
                  了解詳情
                </Button>
              </Link>
            </Card>
          </div>
        </div>
      </section>

      {/* Contact Us */}
      <section id="contact" className="py-24 px-4 border-t border-border">
        <div className="container mx-auto max-w-4xl text-center space-y-6">
          <h2 className="text-4xl md:text-5xl font-display font-bold uppercase">Contact Us</h2>
          <p className="text-xl text-muted-foreground max-w-xl mx-auto">
            有任何查詢、合作或反饋，歡迎隨時聯絡我哋。
          </p>
          <div className="grid sm:grid-cols-3 gap-6 pt-4">
            <div className="p-6 rounded-2xl border border-border bg-card/50 space-y-2">
              <div className="text-xs font-bold tracking-widest uppercase text-muted-foreground">電郵</div>
              <div className="font-bold text-foreground">hello@teamspirit.hk</div>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card/50 space-y-2">
              <div className="text-xs font-bold tracking-widest uppercase text-muted-foreground">WhatsApp</div>
              <div className="font-bold text-foreground">+852 9XXX XXXX</div>
            </div>
            <div className="p-6 rounded-2xl border border-border bg-card/50 space-y-2">
              <div className="text-xs font-bold tracking-widest uppercase text-muted-foreground">Instagram</div>
              <div className="font-bold text-foreground">@teamspirit.hk</div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <section className="py-32 px-4 border-t border-border">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-display font-bold uppercase">Ready to dominate?</h2>
          <p className="text-xl text-muted-foreground">永久免費，所有核心功能任你用。</p>
          <Link href="/login">
            <Button size="lg" className="text-lg h-14 px-12 font-bold tracking-wide uppercase">
              Get Started
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc }: any) {
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

function Badge({ children, className, variant }: any) {
  return <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>{children}</span>
}

function PricingFeature({ text, pro }: { text: string, pro?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-0.5 p-0.5 rounded-full ${pro ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white'}`}>
        <Check className="w-3 h-3" />
      </div>
      <span className={pro ? 'text-foreground font-medium' : 'text-muted-foreground'}>{text}</span>
    </div>
  );
}
