import React from 'react';
import { Link, useLocation } from 'wouter';
import { useAppStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { Home, Compass, Shield, Calendar, User as UserIcon, Bell, Languages, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [location, setLoc] = useLocation();
  const { isProMode, toggleProMode, notifications, markNotificationRead } = useAppStore();
  const { lang, setLang, t } = useI18n();
  const unreadCount = notifications.filter(n => !n.read).length;
  const [searchQuery, setSearchQuery] = React.useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    // Redirect to discover page with search query
    setLoc(`/discover?q=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery('');
  };

  // Don't show layout on landing page
  if (location === '/') return <>{children}</>;

  const navItems = [
    { href: '/dashboard', label: t('dashboard'), icon: Home },
    { href: '/discover', label: t('discover'), icon: Compass },
    { href: '/teams', label: t('teams'), icon: Shield },
    { href: '/events', label: t('events'), icon: Calendar },
    { href: '/profile', label: t('profile'), icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20 md:pb-0 md:pl-64">
      {/* Top Bar for Mobile */}
      <div className="md:hidden sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border p-4 flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-display font-bold tracking-wider text-primary">TEAMSPIRIT</Link>
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger className="relative" aria-label={t('notifications')}>
              <Bell className="w-6 h-6" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-[10px] flex items-center justify-center rounded-full font-bold">
                  {unreadCount}
                </span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              {notifications.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground text-sm">{t('noNotifications')}</div>
              ) : (
                notifications.map(n => (
                  <DropdownMenuItem key={n.id} className="flex flex-col items-start gap-1 p-3 cursor-pointer" onClick={() => markNotificationRead(n.id)}>
                    <div className={`text-sm ${!n.read ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                      {lang === 'en' ? (n.messageEn || n.message) : n.message}
                    </div>
                    <div className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-HK')}</div>
                  </DropdownMenuItem>
                ))
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="icon" aria-label={t('switchLang')} onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>
            <Languages className="w-6 h-6" />
          </Button>
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-col fixed inset-y-0 left-0 w-64 border-r border-border bg-card/50 backdrop-blur-xl z-50 sidebar-glow">
        <div className="p-6">
          <Link href="/dashboard" className="text-3xl font-display font-bold tracking-wider text-primary block hover:opacity-80 transition-opacity">TEAMSPIRIT</Link>
        </div>
        
        <div className="px-6 pb-2 flex items-center gap-2">
          <Switch id="pro-mode" checked={isProMode} onCheckedChange={toggleProMode} />
          <Label htmlFor="pro-mode" className="text-sm font-bold tracking-wider uppercase">{t('dashboardProMode')}</Label>
        </div>

        <div className="px-6 pb-4">
          <form onSubmit={handleSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('search') || 'Search...'}
              className="pl-9 bg-black/20 border-border/50 focus:border-primary/50"
            />
          </form>
        </div>

        <div className="px-6 pb-6">
          <Button variant="ghost" size="sm" className="w-full justify-start font-bold tracking-wider uppercase text-xs" onClick={() => setLang(lang === 'zh' ? 'en' : 'zh')}>
            <Languages className="w-4 h-4 mr-2" />
            {lang === 'zh' ? t('langEn') : t('langZh')}
          </Button>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== '/dashboard' && location.startsWith(item.href.split('/')[1] ? `/${item.href.split('/')[1]}` : item.href));
            return (
              <Link key={item.href} href={item.href} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-border space-y-3">
          <Link href="/pricing" className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/20 hover:border-primary/50 transition-colors">
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground font-bold tracking-wider uppercase">{t('freeForever')}</span>
              <span className="text-base font-display text-primary">{t('upgradePro')} <span className="text-sm text-muted-foreground">$48/{t('perMonth')}</span></span>
            </div>
            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">{t('viewDetails')}</Badge>
          </Link>
          <Link href="/terms" className="block text-xs text-muted-foreground hover:text-primary transition-colors text-center tracking-wider uppercase">
            {t('termsOfService')}
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <main className="p-4 md:p-8">
        {children}
      </main>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 inset-x-0 bg-background/90 backdrop-blur-xl border-t border-border pb-safe z-50 overflow-x-auto no-scrollbar">
        <nav className="flex items-center justify-around p-2 min-w-max sm:min-w-full">
          {navItems.map(item => {
            const Icon = item.icon;
            const isActive = location === item.href || (item.href !== '/dashboard' && location.startsWith(item.href.split('/')[1] ? `/${item.href.split('/')[1]}` : item.href));
            return (
              <Link key={item.href} href={item.href} className={`flex flex-col items-center justify-center w-16 h-14 rounded-xl transition-all duration-200 ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                <Icon className={`w-6 h-6 mb-1 ${isActive ? 'scale-110' : ''}`} />
                <span className="text-[10px] font-medium whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};
