import React from 'react';
import { ShieldAlert, AlertTriangle, CreditCard, Cloud, Users, FileText } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { REFUND_POLICY_OPTIONS } from '@/lib/types';

export default function Terms() {
  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="space-y-3">
        <div className="flex items-center gap-3">
          <ShieldAlert className="w-8 h-8 text-primary" />
          <h1 className="text-4xl font-display font-bold uppercase tracking-tight">免責聲明</h1>
        </div>
        <p className="text-muted-foreground">最後更新：2026 年 4 月。使用 TEAMSPIRIT 即代表你同意以下條款。</p>
      </header>

      <Card className="p-6 border-border bg-card/50 backdrop-blur space-y-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-primary shrink-0 mt-1" />
          <div className="space-y-2">
            <h2 className="text-xl font-display font-bold uppercase tracking-wide">1. 平台角色</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              TEAMSPIRIT 係一個<span className="text-foreground font-bold">撮合及代收款平台</span>，俾用戶發佈或加入足球活動／賽事。
              我哋唔會主辦、安排或執行任何活動，亦唔負責場地、裁判、教練、保險、急救或交通安排。
              所有發佈嘅活動內容（地址、規則、收費、時間）由發起人自行提供，我哋唔會逐項審核。
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-border bg-card/50 backdrop-blur space-y-4">
        <div className="flex items-start gap-3">
          <Users className="w-5 h-5 text-primary shrink-0 mt-1" />
          <div className="space-y-2">
            <h2 className="text-xl font-display font-bold uppercase tracking-wide">2. 安全與意外</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              足球活動本質上有受傷風險。<span className="text-foreground font-bold">所有參加者自願承擔相關風險</span>，
              包括但不限於拗柴、骨折、撞傷、中暑、心血管事件等。建議：賽前做暖身、自備保險、有不適應該退出。
              場地安全（例如塌石屎、爛草皮、燈光）亦由搞手同場地擁有人負責。
              如果發生意外，TEAMSPIRIT 唔承擔任何法律或財務責任。
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-amber-500/40 bg-amber-500/5 backdrop-blur space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-1" />
          <div className="space-y-2">
            <h2 className="text-xl font-display font-bold uppercase tracking-wide text-amber-200">3. 平台付款 vs 私下夾錢</h2>
            <p className="text-sm leading-relaxed text-amber-100/90">
              當你經 TEAMSPIRIT 報名公開場時，平台會代收報名費，活動完結後再發放畀搞手。
              呢個流程提供「無放飛機」保障同退款保障。
            </p>
            <div className="bg-black/30 border border-amber-500/30 rounded-lg p-3 mt-2">
              <p className="text-sm font-bold text-amber-200 mb-1">重要：</p>
              <p className="text-sm text-amber-100/90 leading-relaxed">
                如果搞手或參加者揀<span className="font-bold">私下交易</span>（例如收現金、FPS、轉數快、Payme 直接過數）而冇用平台代收功能，
                <span className="font-bold underline">任何金錢糾紛、騙案、或退款爭議，TEAMSPIRIT 概不負責，亦無法協助追討</span>。
                建議所有金錢往來都經平台處理。
              </p>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-border bg-card/50 backdrop-blur space-y-4">
        <div className="flex items-start gap-3">
          <CreditCard className="w-5 h-5 text-primary shrink-0 mt-1" />
          <div className="space-y-2 w-full">
            <h2 className="text-xl font-display font-bold uppercase tracking-wide">4. 退款政策</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              所有經平台代收嘅報名費，按搞手揀嘅政策處理退款。退款由平台代收金額直接退返，搞手唔會倒貼。
            </p>
            <div className="space-y-2 pt-2">
              {REFUND_POLICY_OPTIONS.map(opt => (
                <div key={opt.value} className="bg-black/20 rounded-lg p-3 border border-border">
                  <div className="font-bold text-foreground flex items-center gap-2">
                    {opt.value === 'auto' && <Cloud className="w-4 h-4 text-blue-400" />}
                    {opt.label}
                    <span className="text-xs text-muted-foreground font-normal">— {opt.short}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{opt.description}</p>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              注意：搞手已支付嘅場租或其他成本（例如康文署訂場費）唔屬於退款範圍，由搞手自行承擔。
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-border bg-card/50 backdrop-blur space-y-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-primary shrink-0 mt-1" />
          <div className="space-y-2">
            <h2 className="text-xl font-display font-bold uppercase tracking-wide">5. 平台手續費</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              公開場每筆成功報名收取 4% 平台手續費，由參加者支付（顯示於付款頁面）。
              球隊內部活動（球隊頁面內發起）唔涉及平台代收，唔會收任何費用。Pro 會員 ($48/月) 解鎖球隊進階功能，與手續費無關。
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-6 border-border bg-card/50 backdrop-blur space-y-4">
        <div className="flex items-start gap-3">
          <FileText className="w-5 h-5 text-primary shrink-0 mt-1" />
          <div className="space-y-2">
            <h2 className="text-xl font-display font-bold uppercase tracking-wide">6. 內容審核</h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              平台保留刪除涉嫌詐騙、攻擊性、違法內容嘅權利，亦可暫停或終止違反條款嘅帳戶。
              如果你發現有問題嘅活動或用戶，請使用「舉報」功能通知我哋。
            </p>
          </div>
        </div>
      </Card>

      <p className="text-xs text-muted-foreground text-center pt-4">
        如有疑問請電郵 support@teamspirit.hk
      </p>
    </div>
  );
}
