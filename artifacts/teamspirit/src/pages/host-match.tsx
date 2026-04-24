import React from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Users, Check, AlertTriangle, Info } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { extractDistrict } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { RefundPolicyKind, SurfaceType } from '@/lib/types';

const hostSchema = z.object({
  venueAddress: z.string().min(3, '請輸入場地地址'),
  date: z.string().min(1, '請揀日期'),
  startTime: z.string().min(1, '請揀開始時間'),
  endTime: z.string().min(1, '請揀完結時間'),
  surface: z.enum(['hard', 'turf', 'grass']),
  skillLevel: z.coerce.number().min(1).max(5),
  maxPlayers: z.string().refine(v => v === '' || (Number.isInteger(Number(v)) && Number(v) > 0), '請輸入大過 0 嘅整數'),
  fee: z.string().refine(v => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0), '費用要係 0 或正數'),
  description: z.string(),
  rules: z.string(),
}).refine(d => d.endTime > d.startTime, { message: '完結時間要喺開始之後', path: ['endTime'] });

type HostFormValues = z.infer<typeof hostSchema>;

export default function HostMatch() {
  const [, setLocation] = useLocation();
  const { createPublicMatch } = useAppStore();

  const form = useForm<HostFormValues>({
    resolver: zodResolver(hostSchema),
    defaultValues: {
      venueAddress: '',
      date: '',
      startTime: '',
      endTime: '',
      surface: 'hard',
      skillLevel: 3,
      maxPlayers: '',
      fee: '',
      description: '',
      rules: '',
    }
  });

  const onSubmit = (values: HostFormValues) => {
    const datetime = new Date(`${values.date}T${values.startTime}`).toISOString();
    const endDatetime = new Date(`${values.date}T${values.endTime}`).toISOString();
    createPublicMatch({
      venueAddress: values.venueAddress.trim(),
      datetime,
      endDatetime,
      fee: values.fee === '' ? 0 : Number(values.fee),
      surface: values.surface as SurfaceType,
      skillLevel: values.skillLevel,
      maxPlayers: values.maxPlayers === '' ? null : Number(values.maxPlayers),
      description: values.description,
      rules: values.rules,
      refundPolicy: 'half',
      waitlistIds: [],
      slotOffers: [],
    });
    toast.success('公開場已成功發佈！');
    setLocation('/discover');
  };

  const detectedDistrict = extractDistrict(form.watch('venueAddress') || '');

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-4xl font-display font-bold uppercase tracking-tight">發佈公開場</h1>
        <p className="text-muted-foreground mt-2">Book 咗場夾唔夠人？發佈到平台，同區波友即時報名加入。</p>
      </div>

      <Card className="p-8 border-border bg-card/50 backdrop-blur">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            <section className="space-y-6">
              <h2 className="text-xl font-display font-bold uppercase border-b border-border pb-2 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> 基本資料
              </h2>

              <FormField
                control={form.control}
                name="venueAddress"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormLabel>場地地址</FormLabel>
                      {detectedDistrict && (
                        <Badge variant="secondary" className="text-[10px] h-5 tracking-widest">{detectedDistrict}</Badge>
                      )}
                    </div>
                    <FormControl>
                      <Input placeholder="例如 黃大仙鳳舞街40號 摩士公園足球場 3號場" {...field} />
                    </FormControl>
                    <FormDescription className="text-[11px]">會用作 Google Maps 定位，寫得清楚啲方便波友搵路。</FormDescription>
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
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
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

              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>日期</FormLabel>
                    <FormControl><Input type="date" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="startTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>開始時間</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>完結時間</FormLabel>
                      <FormControl><Input type="time" {...field} /></FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="maxPlayers"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>人數上限</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} step={1} placeholder="留空 = 不設上限" {...field} />
                      </FormControl>
                      <FormDescription className="text-[11px]">留空就係不設上限。</FormDescription>
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
                        <Input type="number" min={0} placeholder="留空 = 免費" {...field} />
                      </FormControl>
                      <FormDescription className="text-[11px]">留空或 0 = 免費場。</FormDescription>
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
                      <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
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
            </section>

            <section className="space-y-6">
              <h2 className="text-xl font-display font-bold uppercase border-b border-border pb-2 flex items-center gap-2">
                <Info className="w-5 h-5 text-primary" /> 詳細資料
              </h2>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>活動描述</FormLabel>
                    <FormControl><Textarea className="h-24" placeholder="例如：休閒踢，志在流汗。" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>特別規則</FormLabel>
                    <FormControl><Textarea placeholder="例如：守門員免費、不准粗口、自備一淺一深波衫。" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <div className="bg-primary/10 p-4 rounded-xl flex items-start gap-4">
              <div className="bg-primary text-primary-foreground p-2 rounded-full mt-1">
                <Check className="w-4 h-4" />
              </div>
              <div>
                <h4 className="font-bold mb-1 text-primary">Publish 後會即時 Push 俾同區用戶</h4>
                <p className="text-sm text-primary/80">系統會自動通知附近活躍球員。平台代收報名費，避免「放飛機」。</p>
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
