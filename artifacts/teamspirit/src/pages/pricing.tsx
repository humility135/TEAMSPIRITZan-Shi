import React from 'react';
import { motion } from 'framer-motion';
import { Check, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/lib/store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function Pricing() {
  const { currentUser } = useAppStore();

  return (
    <div className="max-w-5xl mx-auto space-y-12 animate-in fade-in duration-500 pb-20 pt-8">
      <div className="text-center space-y-4">
        <h1 className="text-5xl md:text-7xl font-display font-bold uppercase tracking-tight">
          Fuel your <span className="text-primary">squad.</span>
        </h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          購買 Tokens 以支付建立球隊或舉辦收費活動的費用，或升級 Pro 解鎖全部功能。
        </p>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        <TokenPack amount={10} price={20} />
        <TokenPack amount={25} price={40} popular />
        <TokenPack amount={40} price={60} />
        
        <Card className="relative overflow-hidden border-primary bg-primary/5 p-8 flex flex-col items-center text-center">
          <div className="absolute top-0 inset-x-0 h-1 bg-primary" />
          <Zap className="w-10 h-10 text-primary mb-4" />
          <h3 className="text-2xl font-display font-bold uppercase tracking-wider mb-2">Pro 月費</h3>
          <div className="text-4xl font-display font-bold text-primary mb-6">$78<span className="text-lg text-muted-foreground">/mo</span></div>
          
          <div className="space-y-3 w-full text-left mb-8">
            <div className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-primary"/> 無限建立球隊 (上限20)</div>
            <div className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-primary"/> 無限舉辦收費活動</div>
            <div className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-primary"/> 專屬球隊主題顏色與Logo</div>
            <div className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-primary"/> 解鎖終身數據與雷達圖</div>
            <div className="flex items-center gap-2 text-sm"><Check className="w-4 h-4 text-primary"/> 移除所有平台浮水印</div>
          </div>
          
          <div className="mt-auto w-full">
            <CheckoutButton label={currentUser.subscription === 'pro' ? '已訂閱' : '訂閱 Pro'} disabled={currentUser.subscription === 'pro'} variant="default" />
          </div>
        </Card>
      </div>

      <div className="bg-card/50 backdrop-blur border border-border rounded-3xl p-8 md:p-12 text-center">
        <h3 className="text-2xl font-display font-bold uppercase mb-4">Current Balance</h3>
        <div className="text-6xl font-display font-bold text-white mb-2">{currentUser.tokensBalance}</div>
        <div className="text-sm font-bold tracking-widest uppercase text-primary">Tokens</div>
      </div>
    </div>
  );
}

function TokenPack({ amount, price, popular }: { amount: number, price: number, popular?: boolean }) {
  return (
    <Card className={`relative overflow-hidden border-border bg-card/50 backdrop-blur p-8 flex flex-col items-center text-center ${popular ? 'ring-2 ring-white/20' : ''}`}>
      {popular && <div className="absolute top-4 inset-x-0 text-[10px] font-bold tracking-widest uppercase text-white/50">Most Popular</div>}
      <div className={`text-4xl font-display font-bold mb-2 ${popular ? 'mt-4' : ''}`}>{amount}</div>
      <div className="text-sm font-bold tracking-widest uppercase text-muted-foreground mb-6">Tokens</div>
      <div className="text-2xl font-display font-bold mb-8">${price}</div>
      <div className="mt-auto w-full">
        <CheckoutButton label="購買" variant="outline" />
      </div>
    </Card>
  )
}

function CheckoutButton({ label, disabled, variant }: any) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full font-bold tracking-widest uppercase" disabled={disabled} variant={variant}>
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
          <p className="text-muted-foreground">這是一個展示用的結帳彈出視窗。在實際應用中，這裡會載入 Stripe Elements。</p>
          <Button size="lg" className="w-full h-14 font-bold tracking-wider uppercase mt-8 bg-[#635BFF] hover:bg-[#635BFF]/90 text-white">
            Pay with Stripe
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
