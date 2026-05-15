import React from 'react';
import { useLocation } from 'wouter';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Users, Check, AlertTriangle, Info, ShieldAlert, Search } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { VenueSelector } from '@/components/venue-selector';
import { detectDistrict } from '@/lib/districts';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { REFUND_POLICY_OPTIONS, RefundPolicyKind, SurfaceType } from '@/lib/types';

type HostFormValues = z.infer<ReturnType<typeof useHostSchema>>;

function useHostSchema(t: (key: string, r?: Record<string, string>) => string) {
  return z.object({
    venueId: z.string().optional(),
    venueName: z.string().min(2, t('hostMatchVenueRequired')),
    venueCourt: z.string().optional(),
    district: z.string().optional(),
    date: z.string().min(1, t('hostMatchDateRequired')).refine(d => {
      const today = new Date();
      // 轉換成香港時區嘅 YYYY-MM-DD
      const hkDateStr = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Hong_Kong' });
      return d >= hkDateStr;
    }, t('hostMatchDatePast')),
    startTime: z.string().min(1, t('hostMatchStartTimeRequired')),
    endTime: z.string().min(1, t('hostMatchEndTimeRequired')),
    surface: z.enum(['hard', 'turf', 'grass']),
    skillLevel: z.coerce.number().min(1).max(5),
    maxPlayers: z.string().refine(v => v === '' || (Number.isInteger(Number(v)) && Number(v) > 0), t('hostMatchMaxPlayersInvalid')),
    fee: z.string().refine(v => v === '' || (Number.isInteger(Number(v)) && Number(v) >= 0), t('hostMatchFeeInvalid')),
    description: z.string(),
    rules: z.string(),
  }); // Removed strict endTime > startTime check to allow overnight matches
}

function buildVenueAddress(venueName: string, venueCourt?: string) {
  const name = venueName.trim();
  const court = (venueCourt || '').trim();
  return court ? `${name} ${court}` : name;
}

export default function HostMatch() {
  const [, setLocation] = useLocation();
  const { venues, createPublicMatch } = useAppStore();
  const { t, lang } = useI18n();

  const hostSchema = useHostSchema(t);

  const form = useForm<HostFormValues>({
    resolver: zodResolver(hostSchema),
    defaultValues: {
      venueId: '',
      venueName: '',
      venueCourt: '',
      district: '',
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

  const onSubmit = async (values: HostFormValues) => {
    // Make sure we have valid date and time strings before combining them
    if (!values.date || !values.startTime || !values.endTime) {
      toast.error(t('hostMatchDateTimeError'));
      return;
    }

    try {
      // Create a full ISO string by extracting local parts and appending HK timezone
      // E.g. "2025-04-26T20:00:00+08:00"
      const startDateTimeStr = `${values.date}T${values.startTime}:00+08:00`;
      const endDateTimeStr = `${values.date}T${values.endTime}:00+08:00`;

      const startDateTime = new Date(startDateTimeStr);
      const endDateTime = new Date(endDateTimeStr);

      // Handle overnight matches (e.g. 23:00 to 01:00)
      if (endDateTime <= startDateTime) {
        endDateTime.setDate(endDateTime.getDate() + 1);
      }

      const venueId = values.venueId ? values.venueId : undefined;
      const venueCourt = values.venueCourt?.trim() || '';
      const venueAddress = venueId ? (venueCourt || undefined) : buildVenueAddress(values.venueName, venueCourt);

      await createPublicMatch({
        venueId,
        venueAddress,
        district: values.district || detectDistrict(venueAddress || values.venueName),
        datetime: startDateTime.toISOString(),
        endDatetime: endDateTime.toISOString(),
        fee: values.fee === '' ? 0 : Number(values.fee),
        surface: values.surface as SurfaceType,
        skillLevel: values.skillLevel,
        maxPlayers: values.maxPlayers === '' ? null : Number(values.maxPlayers),
        description: values.description,
        rules: values.rules,
        refundPolicy: 'half', // Default to half if needed by backend, though removed from UI
        waitlistIds: [],
        slotOffers: [],
      });
      toast.success(t('hostMatchSuccess'));
      setLocation('/discover');
    } catch (e) {
      toast.error((e as any)?.message || t('hostMatchFormatError'));
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <div>
        <h1 className="text-4xl font-display font-bold uppercase tracking-tight">{t('hostMatchTitle')}</h1>
        <p className="text-muted-foreground mt-2">{t('hostMatchDesc')}</p>
      </div>

      <Card className="p-8 border-border bg-card/50 backdrop-blur">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            <section className="space-y-6">
              <h2 className="text-xl font-display font-bold uppercase border-b border-border pb-2 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> {t('hostMatchBasicInfo')}
              </h2>

              <FormField
                control={form.control}
                name="venueId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('hostMatchVenueLabel')}</FormLabel>
                    <FormControl>
                      <VenueSelector
                        venues={venues}
                        selectedVenueId={field.value}
                        onSelect={(v) => {
                          field.onChange(v.id);
                          const vName = lang === 'en' ? (v.nameEn || v.name) : v.name;
                          form.setValue('venueName', vName);
                          form.setValue('venueCourt', '');
                          form.setValue('district', v.district);
                          form.setValue('surface', v.surface);
                        }}
                        onClear={() => {
                          field.onChange('');
                          form.setValue('district', '');
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-[11px]">{t('hostMatchVenueHelper')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="venueName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('hostMatchAddressLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('hostMatchAddressPlaceholder')}
                        {...field}
                        onChange={(e) => {
                          const next = e.target.value;
                          field.onChange(next);

                          const venueId = form.getValues('venueId');
                          if (!venueId) return;

                          const v = venues.find((x) => x.id === venueId);
                          const selectedName = v ? (lang === 'en' ? (v.nameEn || v.name) : v.name) : '';
                          if (selectedName && next.trim() !== selectedName.trim()) {
                            form.setValue('venueId', '');
                            form.setValue('district', '');
                          }
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-[11px]">{t('hostMatchAddressHelper')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="venueCourt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('hostMatchVenueCourtLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('hostMatchVenueCourtPlaceholder')} {...field} />
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
                    <FormLabel>{t('hostMatchSurfaceLabel')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="hard">{t('hostMatchSurfaceHard')}</SelectItem>
                        <SelectItem value="turf">{t('hostMatchSurfaceTurf')}</SelectItem>
                        <SelectItem value="grass">{t('hostMatchSurfaceGrass')}</SelectItem>
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
                      <FormLabel>{t('hostMatchDateLabel')}</FormLabel>
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
                      <FormLabel>{t('hostMatchStartTimeLabel')}</FormLabel>
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
                      <FormLabel>{t('hostMatchEndTimeLabel')}</FormLabel>
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
                      <FormLabel>{t('hostMatchMaxPlayersLabel')}</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} step={1} placeholder={t('hostMatchMaxPlayersPlaceholder')} {...field} />
                      </FormControl>
                      <FormDescription className="text-[11px]">{t('hostMatchMaxPlayersHelper')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('hostMatchFeeLabel')}</FormLabel>
                      <FormControl>
                        <Input type="number" min={0} step={1} placeholder={t('hostMatchFeePlaceholder')} {...field} />
                      </FormControl>
                      <FormDescription className="text-[11px]">{t('hostMatchFeeHelper')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="skillLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('hostMatchLevelLabel')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={String(field.value)}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="1">{t('hostMatchLevel1')}</SelectItem>
                          <SelectItem value="2">{t('hostMatchLevel2')}</SelectItem>
                          <SelectItem value="3">{t('hostMatchLevel3')}</SelectItem>
                          <SelectItem value="4">{t('hostMatchLevel4')}</SelectItem>
                          <SelectItem value="5">{t('hostMatchLevel5')}</SelectItem>
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
                <Info className="w-5 h-5 text-primary" /> {t('hostMatchDetailSection')}
              </h2>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('hostMatchDescLabel')}</FormLabel>
                    <FormControl><Textarea className="h-24" placeholder={t('hostMatchDescPlaceholder')} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('hostMatchRulesLabel')}</FormLabel>
                    <FormControl><Textarea placeholder={t('hostMatchRulesPlaceholder')} {...field} /></FormControl>
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
                <h4 className="font-bold mb-1 text-primary">{t('hostMatchPublishNote')}</h4>
                <p className="text-sm text-primary/80">{t('hostMatchPublishDetail')}</p>
              </div>
            </div>

            <div className="flex justify-end gap-4 pt-4">
              <Button type="button" variant="outline" onClick={() => setLocation('/discover')}>{t('hostMatchCancelBtn')}</Button>
              <Button type="submit" size="lg" disabled={form.formState.isSubmitting} className="font-bold tracking-widest uppercase">
                {form.formState.isSubmitting ? t('processing') : t('hostMatchPublishBtn')}
              </Button>
            </div>
          </form>
        </Form>
      </Card>
    </div>
  );
}
