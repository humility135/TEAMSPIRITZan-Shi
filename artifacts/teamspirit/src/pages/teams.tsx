import React, { useState, useRef } from 'react';
import { Link, useLocation } from 'wouter';
import { motion } from 'framer-motion';
import { Plus, UserPlus, Users, ArrowRight, Search, Shield, MapPin, Camera, X } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { hkDistricts, districtTranslations, normalizeDistrict } from '@/lib/districts';

export default function Teams() {
  const [, navigate] = useLocation();
  const { teams, currentUser, addTeam, joinTeam } = useAppStore();
  const { t, lang } = useI18n();
  const { toast } = useToast();
  const searchParams = new URLSearchParams(window.location.search);
  const q = searchParams.get('q') || '';
  const [search, setSearch] = useState(q);
  const [createOpen, setCreateOpen] = useState(false);
  const [joinOpen, setJoinOpen] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [district, setDistrict] = useState<string>('');
  const [level, setLevel] = useState<string>('3');
  const [inviteCode, setInviteCode] = useState('');
  const [logoPreview, setLogoPreview] = useState<string>('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCreate = async () => {
    if (!teamName.trim()) { toast({ title: t('teamsNameRequired'), variant: 'destructive' }); return; }
    if (!district) { toast({ title: t('teamsDistrictRequired'), variant: 'destructive' }); return; }
    try {
      const newTeam = await addTeam({ name: teamName.trim(), district, level: parseInt(level, 10), logoUrl: logoPreview || undefined });
      setCreateOpen(false);
      const districtLabel = lang === 'en' ? (districtTranslations[normalizeDistrict(district)] ?? district) : district;
      toast({ title: t('teamsCreateSuccess'), description: `${teamName}（${t('teamsDistrictLabel')}：${districtLabel}）` });
      setTeamName(''); setDistrict(''); setLevel('3'); setLogoPreview('');

      // Auto redirect to the new team detail page
      if (newTeam && newTeam.id) {
        setTimeout(() => navigate(`/teams/${newTeam.id}`), 100);
      }
    } catch (e: any) {
      toast({ title: t('teamsCreateFailed'), description: e.message || t('processing'), variant: 'destructive' });
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) { toast({ title: t('teamsInviteRequired'), variant: 'destructive' }); return; }
    try {
      const result = await joinTeam(inviteCode.trim());
      setJoinOpen(false);
      toast({ title: t('teamsJoinSuccess'), description: `${t('teamsJoinWelcome')} ${result.teamName}！` });
      setInviteCode('');
      if (result.teamId) {
        setTimeout(() => navigate(`/teams/${result.teamId}`), 100);
      }
    } catch (e: any) {
      toast({ title: t('teamsJoinFailed'), description: e.message || t('teamsJoinInvalid'), variant: 'destructive' });
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const myTeams = teams.filter(t => t.memberIds.includes(currentUser.id));
  const filtered = myTeams.filter(t => t.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header className="space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight">
              {t('teamsHeading')}{lang === 'en' ? ' ' : ''}<span className="text-primary">{t('teamsHeadingHighlight')}</span>
            </h1>
            <p className="text-muted-foreground text-lg mt-2">{t('teamsDesc')}</p>
          </div>
          <div className="flex gap-3 w-full md:w-auto">
            <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="font-bold tracking-wide uppercase flex-1 md:flex-none">
                  <UserPlus className="w-4 h-4 mr-2" />
                  {t('teamsJoinBtn')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display uppercase tracking-wider text-2xl">{t('teamsJoinTitle')}</DialogTitle>
                  <DialogDescription>{t('teamsJoinDesc')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label htmlFor="invite-code">{t('teamsInviteCode')}</Label>
                    <Input id="invite-code" value={inviteCode} onChange={e => setInviteCode(e.target.value)} placeholder={t('teamsInvitePlaceholder')} maxLength={6} className="text-center text-2xl tracking-widest font-display uppercase" />
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleJoin} className="w-full font-bold tracking-wide uppercase">
                    {t('teamsJoinNow')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={createOpen} onOpenChange={setCreateOpen}>
              <DialogTrigger asChild>
                <Button className="font-bold tracking-wide uppercase flex-1 md:flex-none">
                  <Plus className="w-4 h-4 mr-2" />
                  {t('teamsCreateBtn')}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="font-display uppercase tracking-wider text-2xl">{t('teamsCreateTitle')}</DialogTitle>
                  <DialogDescription>{t('teamsCreateDesc')}</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div className="space-y-2">
                    <Label>{t('teamsLogoLabel')}</Label>
                    <div className="flex items-center gap-3">
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-black ring-1 ring-border shrink-0 flex items-center justify-center">
                        {logoPreview ? (
                          <img src={logoPreview} alt="logo preview" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-xs text-muted-foreground">{t('preview')}</span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button type="button" variant="outline" onClick={() => fileRef.current?.click()}>
                          <Camera className="w-4 h-4 mr-2" />
                          {t('teamsLogoUpload')}
                        </Button>
                        {logoPreview && (
                          <Button type="button" variant="ghost" onClick={() => setLogoPreview('')}>
                            <X className="w-4 h-4 mr-2" />
                            {t('teamsLogoRemove')}
                          </Button>
                        )}
                      </div>
                    </div>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-name">{t('teamsNameLabel')}</Label>
                    <Input id="team-name" value={teamName} onChange={e => setTeamName(e.target.value)} placeholder={t('teamsNamePlaceholder')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-district">{t('teamsDistrictLabel')}</Label>
                    <Select value={district} onValueChange={setDistrict}>
                      <SelectTrigger id="team-district">
                        <SelectValue placeholder={t('teamsDistrictPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {hkDistricts.map(d => (
                          <SelectItem key={d} value={d}>{lang === 'en' ? (districtTranslations[d] || d) : d}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="team-level">{t('teamsLevelLabel')}</Label>
                    <Select value={level} onValueChange={setLevel}>
                      <SelectTrigger id="team-level">
                        <SelectValue placeholder={t('teamsLevelPlaceholder')} />
                      </SelectTrigger>
                      <SelectContent>
                        {[1, 2, 3, 4, 5].map(n => (
                          <SelectItem key={n} value={String(n)}>{'★'.repeat(n)} ({n}/5)</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button onClick={handleCreate} className="w-full font-bold tracking-wide uppercase">
                    {t('teamsCreateNow')}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder={t('teamsSearchPlaceholder')} className="pl-11 h-12" />
        </div>
      </header>

      {filtered.length === 0 ? (
        <Card className="p-12 text-center border-dashed">
          <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-xl font-display font-bold uppercase tracking-wide mb-2">{t('teamsEmptyTitle')}</h3>
          <p className="text-muted-foreground mb-6">{t('teamsEmptyDesc')}</p>
          <div className="flex gap-3 justify-center">
            <Button variant="outline" onClick={() => setJoinOpen(true)}><UserPlus className="w-4 h-4 mr-2" />{t('teamsJoinBtn')}</Button>
            <Button onClick={() => setCreateOpen(true)}><Plus className="w-4 h-4 mr-2" />{t('teamsCreateBtn')}</Button>
          </div>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 gap-4">
          {filtered.map((team, i) => {
            const role = currentUser.role[team.id] || 'Member';
            const roleColor = role === 'Owner' ? 'border-primary text-primary' : role === 'Admin' ? 'border-blue-400 text-blue-400' : '';
            const districtLabel = team.district
              ? (lang === 'en' ? (districtTranslations[normalizeDistrict(team.district)] ?? team.district) : team.district)
              : '';
            return (
              <motion.div
                key={team.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link href={`/teams/${team.id}`}>
                  <Card className="p-5 border-border bg-card/50 backdrop-blur hover:border-primary/50 transition-colors cursor-pointer group h-full">
                    <div className="flex items-start gap-4">
                      <div className="w-20 h-20 rounded-xl bg-black overflow-hidden relative shrink-0">
                        <img src={team.logoUrl} alt={team.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className={`text-[10px] tracking-widest uppercase ${roleColor}`}>
                            {role === 'Owner' ? t('roleOwner') : role === 'Admin' ? t('roleAdmin') : t('roleMember')}
                          </Badge>
                          {districtLabel && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{districtLabel}</span>
                          )}
                        </div>
                        <h3 className="font-bold text-lg leading-tight truncate">{team.name}</h3>
                        <div className="flex items-center gap-1 text-sm text-muted-foreground mt-1">
                          <Users className="w-4 h-4" /> {team.memberIds.length} {t('members')}
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors mt-1" />
                    </div>
                  </Card>
                </Link>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
