import React from 'react';
import { useLocation, useRoute } from 'wouter';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { MapPin, Check, AlertTriangle, Info, ShieldAlert, Search } from 'lucide-react';
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
import { SurfaceType } from '@/lib/types';
import { Time24hSelect } from '@/components/time-24h-select';

type HostFormValues = z.infer<ReturnType<typeof useHostSchema>>;

function useHostSchema(t: (key: string, r?: Record<string, string>) => string) {
  return z.object({
    title: z.string().min(1, t('teamHostEventNameRequired')),
    venueId: z.string().optional(),
    venueName: z.string().min(2, t('teamHostEventVenueRequired')),
    venueCourt: z.string().optional(),
    district: z.string().optional(),
    date: z.string().min(1, t('teamHostEventDateRequired')).refine(d => {
      const today = new Date();
      const hkDateStr = today.toLocaleDateString('en-CA', { timeZone: 'Asia/Hong_Kong' });
      return d >= hkDateStr;
    }, t('teamHostEventDatePast')),
    startTime: z.string().min(1, t('teamHostEventStartTimeRequired')),
    endTime: z.string().min(1, t('teamHostEventEndTimeRequired')),
    surface: z.enum(['hard', 'turf', 'grass']),
    skillLevel: z.coerce.number().min(1).max(5),
    maxPlayers: z.string().refine(v => v === '' || (Number.isInteger(Number(v)) && Number(v) > 0), t('teamHostEventCapacityInvalid')),
    fee: z.string().refine(v => v === '' || (!Number.isNaN(Number(v)) && Number(v) >= 0), t('teamHostEventFeeInvalid')),
    description: z.string(),
    rules: z.string(),
  });
}

function buildVenueAddress(venueName: string, venueCourt?: string) {
  const name = venueName.trim();
  const court = (venueCourt || '').trim();
  return court ? `${name} ${court}` : name;
}

export default function TeamHostEvent() {
  const [, params] = useRoute('/teams/:teamId/host');
  const [, setLocation] = useLocation();
  const { teams, venues, createEvent } = useAppStore();
  const { t, lang } = useI18n();

  const team = teams.find(t => t.id === params?.teamId);

  const hostSchema = useHostSchema(t);

  const form = useForm<HostFormValues>({
    resolver: zodResolver(hostSchema),
    defaultValues: {
      title: '',
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

  if (!team) return <div className="p-8 text-center">{t('teamNotFound')}</div>;

  const onSubmit = async (values: HostFormValues) => {
    if (!values.date || !values.startTime || !values.endTime) {
      toast.error(t('teamHostEventDateTimeError'));
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

      const venueId = values.venueId ? values.venueId : undefined;
      const venueCourt = values.venueCourt?.trim() || '';
      const venueAddress = venueId ? venueCourt : buildVenueAddress(values.venueName, venueCourt);

      await createEvent({
        teamId: team.id,
        title: values.title.trim(),
        venueId,
        venueAddress,
        district: values.district || detectDistrict(venueAddress || values.venueName),
        datetime: startDateTime.toISOString(),
        endDatetime: endDateTime.toISOString(),
        fee: values.fee === '' ? 0 : Number(values.fee),
        surface: values.surface as SurfaceType,
        skillLevel: values.skillLevel,
        capacity: values.maxPlayers === '' ? null : Number(values.maxPlayers),
        description: values.description,
        rules: values.rules,
      });
      toast.success(t('teamHostEventSuccess'));
      setLocation(`/teams/${team.id}`);
    } catch (e) {
      console.error("Event creation error:", e);
      toast.error(t('teamHostEventError'));
    }
  };

    return (
      <div className="max-w-3xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
        <div>
          <h1 className="text-4xl font-display font-bold uppercase tracking-tight">{t('teamHostEventTitle')}</h1>
          <p className="text-muted-foreground mt-2">{t('teamHostEventDesc', { teamName: team.name })}</p>
        </div>

      <Card className="p-8 border-border bg-card/50 backdrop-blur">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

            <section className="space-y-6">
              <h2 className="text-xl font-display font-bold uppercase border-b border-border pb-2 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" /> {t('teamHostEventBasicInfo')}
              </h2>

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('teamHostEventNameLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('teamHostEventNamePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="venueId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('teamHostEventVenueLabel')}</FormLabel>
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
                          // Auto-map surface from venue
                          if (v.surface === 'turf' || v.surface === 'grass') form.setValue('surface', v.surface);
                          else if (v.surface === 'hard') form.setValue('surface', 'hard');
                        }}
                        onClear={() => {
                          field.onChange('');
                          form.setValue('district', '');
                        }}
                      />
                    </FormControl>
                    <FormDescription className="text-[11px]">{t('teamHostEventVenueHelper')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="venueName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('teamHostEventAddressLabel')}</FormLabel>
                    <FormControl>
                      <Input
                        placeholder={t('teamHostEventAddressPlaceholder')}
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
                    <FormDescription className="text-[11px]">{t('teamHostEventAddressHelper')}</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="venueCourt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('teamHostEventVenueCourtLabel')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('teamHostEventVenueCourtPlaceholder')} {...field} />
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
                    <FormLabel>{t('teamHostEventSurfaceLabel')}</FormLabel>
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
                      <FormLabel>{t('teamHostEventDateLabel')}</FormLabel>
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
                      <FormLabel>{t('teamHostEventStartTimeLabel')}</FormLabel>
                      <FormControl>
                        <Time24hSelect value={field.value} onChange={field.onChange} testId="team-startTime" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="endTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('teamHostEventEndTimeLabel')}</FormLabel>
                      <FormControl>
                        <Time24hSelect value={field.value} onChange={field.onChange} testId="team-endTime" />
                      </FormControl>
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
                      <FormLabel>{t('teamHostEventCapacityLabel')}</FormLabel>
                      <FormControl>
                        <Input type="number" min={1} step={1} placeholder={t('teamHostEventMaxPlayersPlaceholder')} {...field} />
                      </FormControl>
                      <FormDescription className="text-[11px]">{t('teamHostEventMaxPlayersHelper')}</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fee"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('teamHostEventFeeLabel')}</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                          <Input type="number" min={0} className="pl-7" placeholder={t('teamHostEventFeePlaceholder')} {...field} />
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
                      <FormLabel>{t('teamHostEventLevelLabel')}</FormLabel>
                      <Select onValueChange={(v) => field.onChange(Number(v))} value={String(field.value)}>
                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                        <SelectContent>
                          <SelectItem value="1">{t('teamHostEventLevel1')}</SelectItem>
                          <SelectItem value="2">{t('teamHostEventLevel2')}</SelectItem>
                          <SelectItem value="3">{t('teamHostEventLevel3')}</SelectItem>
                          <SelectItem value="4">{t('teamHostEventLevel4')}</SelectItem>
                          <SelectItem value="5">{t('teamHostEventLevel5')}</SelectItem>
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
                <Info className="w-5 h-5 text-primary" /> {t('teamHostEventDetailSection')}
              </h2>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('teamHostEventDescLabel')}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t('teamHostEventDescPlaceholder')} rows={3} {...field} />
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
                    <FormLabel>{t('teamHostEventRulesLabel')}</FormLabel>
                    <FormControl>
                      <Textarea placeholder={t('teamHostEventRulesPlaceholder')} rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </section>

            <Button type="submit" className="w-full font-bold tracking-wide uppercase" size="lg">
              {t('teamHostEventCreateBtn')}
            </Button>

          </form>
        </Form>
      </Card>
    </div>
  );
}
