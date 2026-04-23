import React from 'react';
import { Link } from 'wouter';
import { motion } from 'framer-motion';
import { Shield, Zap, Target, ArrowRight, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
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
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button size="lg" className="w-full text-lg h-14 px-8 font-bold tracking-wide uppercase group">
                  立即體驗
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <Link href="/pricing" className="w-full sm:w-auto">
                <Button variant="outline" size="lg" className="w-full text-lg h-14 px-8 font-bold tracking-wide uppercase">
                  了解收費
                </Button>
              </Link>
            </div>
          </motion.div>
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

      {/* Footer CTA */}
      <section className="py-32 px-4 border-t border-border">
        <div className="container mx-auto max-w-4xl text-center space-y-8">
          <h2 className="text-4xl md:text-6xl font-display font-bold uppercase">Ready to dominate?</h2>
          <p className="text-xl text-muted-foreground">免費建立你的第一隊，即享 3 個免費槽位。</p>
          <Link href="/dashboard">
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
