import React from 'react';
import { useLocation, useRoute } from 'wouter';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Check, AlertTriangle, Info, ShieldAlert } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { SurfaceType } from '@/lib/types';

const hostSchema = z.object({
  title: z.string().min(1, '請輸入活動名稱'),
  venueAddress: z.string().min(3, '請輸入場地地址'),
  date: z.string().min(1, '請揀日期').refine(d => {
    const today = new Date();
    const hkDateStr = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Hong_Kong' });
    return d >= hkDateStr;
  }, '唔可以揀過去嘅日期'),
  startTime: z.string().min(1, '請揀開始時間'),
  endTime: z.string().min(1, '請揀完結時間'),
  surface: z.enum(['hard', 'turf', 'grass']),
  skillLevel: z.coerce.number().min(1).max(5),
  maxPlayers: z.string().refine(v => v === '' || (Number.isInteger(Number(v)) && Number(v) > 0), '請輸入大過 0 嘅整數'),
  fee: z.string().refine(v => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0), '費用要係 0 或正數'),
  description: z.string(),
  rules: z.string(),
});

type HostFormValues = z.infer<typeof hostSchema>;

export default function TeamHostEvent() {
  const [, params] = useRoute('/teams/:teamId/host');
  const [, setLocation] = useLocation();
  const { teams, createEvent } = useAppStore();
  
  const team = teams.find(t => t.id === params?.teamId);

  const form = useForm<HostFormValues>({
    resolver: zodResolver(hostSchema),
    defaultValues: {
      title: '',
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

  if (!team) return <div className="p-8 text-center">Team not found</div>;

  const onSubmit = async (values: HostFormValues) => {
    if (!values.date || !values.startTime || !values.endTime) {
      toast.error('請確保日期同時間都填好晒');
      return;
    }
    
    try {
      const startDateTimeStr = `${values.date}T${values.startTime}:00+08:00`;
      const endDateTimeStr = `${values.date}T${values.endTime}:00+08:00`;
      
      const startDateTime = new Date(startDateTimeStr);
      const endDateTime = new Date(endDateTimeStr);
      
      if (endDateTime <= startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }
      
      await createEvent({
        teamId: team.id,
        title: values.title.trim(),
        venueAddress: values.venueAddress.trim(),
        datetime: startDateTime.toISOString(),
        endDatetime: endDateTime.toISOString(),
        fee: values.fee === '' ? 0 : Number(values.fee),
        surface: values.surface as SurfaceType,
        skillLevel: values.skillLevel,
        capacity: values.maxPlayers === '' ? null : Number(values.maxPlayers),
        description: values.description,
        rules: values.rules,
      });
      toast.success('活動已發起！');
      setLocation(`/teams/${team.id}`);
    } catch (e) {
      console.error("Event creation error:", e);
      toast.error('發生錯誤，請檢查資料格式');
    }
  };

    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        <div>
          <h1 className="text-4xl font-display font-bold uppercase tracking-tight">發起球隊活動</h1>
          <p className="text-muted-foreground mt-2">為 {team.name} 建立比賽、訓練或練波局，隊友可即時 RSVP。</p>
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
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>活動名稱</FormLabel>
                    <FormControl>
                      <Input placeholder="例如 友誼賽 vs 紅磡聯" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="venueAddress"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>場地地址</FormLabel>
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

              <div className="grid md:grid-cols-3 gap-6">
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
                      <FormLabel>報名費 / 人</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input type="number" min={0} className="pl-7" placeholder="留空 = 免費" {...field} />
                        </div>
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
                      <FormLabel>水平 (1-5★)</FormLabel>
                      <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="1">1★ 新手</SelectItem>
                          <SelectItem value="2">2★ 業餘</SelectItem>
                          <SelectItem value="3">3★ 常規</SelectItem>
                          <SelectItem value="4">4★ 競技</SelectItem>
                          <SelectItem value="5">5★ 職業</SelectItem>
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
                    <FormControl>
                      <Textarea placeholder="例如：聯賽第 3 輪，務求穩陣攞 3 分。" rows={3} {...field} />
                    </FormControl>
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
                    <FormControl>
                      <Textarea placeholder="例如：自備一淺一深波衫、守門員免費。" rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <Button type="submit" className="w-full font-bold tracking-wide uppercase" size="lg">
              立即發佈
            </Button>

          </form>
        </Form>
      </Card>
    </div>
  );
}
