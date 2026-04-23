import React from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Calendar as CalendarIcon, DollarSign, Users, Check, AlertTriangle } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

const hostSchema = z.object({
  venueId: z.string().min(1, "請選擇場地"),
  datetime: z.string().min(1, "請選擇日期時間"),
  fee: z.coerce.number().min(0, "費用不能為負數"),
  skillLevel: z.coerce.number().min(1).max(5),
  maxPlayers: z.coerce.number().min(4).max(30),
  surface: z.enum(['hard', 'turf', 'grass']),
  description: z.string().min(10, "描述太短"),
  rules: z.string().min(5, "請填寫規則"),
  refundPolicy: z.string().min(5, "請填寫退款政策"),
});

export default function HostMatch() {
  const [, setLocation] = useLocation();
  const { venues, createPublicMatch } = useAppStore();

  const form = useForm<z.infer<typeof hostSchema>>({
    resolver: zodResolver(hostSchema),
    defaultValues: {
      venueId: '',
      datetime: '',
      fee: 50,
      skillLevel: 3,
      maxPlayers: 14,
      surface: 'hard',
      description: '休閒踢，不計較輸贏，志在流汗。',
      rules: '自備一淺一深波衫，不准粗口，友誼第一。',
      refundPolicy: '開波前 24 小時可全額退款。',
    }
  });

  const onSubmit = (values: z.infer<typeof hostSchema>) => {
    createPublicMatch(values);
    toast.success("公開場已成功發佈！");
    setLocation('/discover');
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-4xl font-display font-bold uppercase tracking-tight">發佈公開場</h1>
        <p className="text-muted-foreground mt-2">Book 咗場夾唔夠人？發佈到平台，同區波友即時報名加入。</p>
      </div>

      <Card className="p-8 border-border bg-card/50 backdrop-blur">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            
            <div className="space-y-6">
              <h2 className="text-xl font-display font-bold uppercase border-b border-border pb-2 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> 基本資料
              </h2>
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="venueId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>選擇場地</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="選擇香港場地" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {venues.map(v => (
                            <SelectItem key={v.id} value={v.id}>{v.name} ({v.district})</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="datetime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>日期與時間</FormLabel>
                      <FormControl>
                        <Input type="datetime-local" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="surface"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>場地類型</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="選擇場地類型" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="hard">硬地 (Hard)</SelectItem>
                          <SelectItem value="turf">仿真草 (Turf)</SelectItem>
                          <SelectItem value="grass">真草 (Grass)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-display font-bold uppercase border-b border-border pb-2 flex items-center gap-2">
                <Users className="w-5 h-5 text-primary" /> 人數與費用
              </h2>
              <div className="grid md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="maxPlayers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>人數上限</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>報名費 / 人 (HKD)</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="skillLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>水平要求 (1-5★)</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="選擇水平" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1">1★ (新手)</SelectItem>
                          <SelectItem value="2">2★ (業餘)</SelectItem>
                          <SelectItem value="3">3★ (常規)</SelectItem>
                          <SelectItem value="4">4★ (競技)</SelectItem>
                          <SelectItem value="5">5★ (職業)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="space-y-6">
              <h2 className="text-xl font-display font-bold uppercase border-b border-border pb-2 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-primary" /> 詳細資料
              </h2>
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>活動描述</FormLabel>
                    <FormControl>
                      <Textarea className="h-24" placeholder="簡單介紹今次活動..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="rules"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>特別規則</FormLabel>
                      <FormControl>
                        <Textarea placeholder="例如：守門員免費、不准粗口..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="refundPolicy"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>退款政策</FormLabel>
                      <FormControl>
                        <Textarea placeholder="例如：開波前 24 小時可退款..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <div className="bg-primary/10 text-primary-foreground p-4 rounded-xl flex items-start gap-4">
              <div className="bg-primary text-primary-foreground p-2 rounded-full mt-1">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold mb-1 text-primary">Publish 後會即時 Push 俾同區用戶</h4>
                <p className="text-sm text-primary/80">系統會自動發送通知給經常在該區活躍的球員。平台會代收報名費，確保無人「放飛機」。</p>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setLocation('/discover')}>取消</Button>
              <Button type="submit" size="lg" className="font-bold tracking-widest uppercase">發佈公開場</Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}