import React from 'react';
import { useAppStore } from '@/lib/store';
import { useI18n } from '@/lib/i18n';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCheck, Trash2, Calendar } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Notifications() {
  const { notifications, markNotificationRead, clearNotifications } = useAppStore();
  const { t, lang } = useI18n();
  const [, setLoc] = useLocation();

  const sortedNotifications = [...notifications].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAllRead = () => {
    notifications.forEach(n => {
      if (!n.read) markNotificationRead(n.id);
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-4xl md:text-5xl font-display font-bold uppercase tracking-tight">
            {t('notificationsTitle')}
          </h1>
          <p className="text-muted-foreground text-lg mt-2">
            {unreadCount > 0 
              ? t('notificationsUnread', { unreadCount: String(unreadCount) })
              : t('notificationsAllRead')}
          </p>
        </div>
        <div className="flex gap-2 w-full md:w-auto">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="gap-2 font-bold tracking-wider uppercase text-xs">
              <CheckCheck className="w-4 h-4" />
              {t('notificationsMarkAllRead')}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={clearNotifications} className="gap-2 font-bold tracking-wider uppercase text-xs text-destructive hover:text-destructive hover:bg-destructive/10">
            <Trash2 className="w-4 h-4" />
            {t('notificationsClearAll')}
          </Button>
        </div>
      </header>

      <div className="space-y-4">
        {sortedNotifications.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-4 opacity-20" />
            <h3 className="text-xl font-display font-bold uppercase tracking-wide mb-2">
              {t('notificationsEmpty')}
            </h3>
            <p className="text-muted-foreground">
              {t('notificationsEmptyDesc')}
            </p>
          </Card>
        ) : (
          sortedNotifications.map((n, i) => (
            <Card 
              key={n.id} 
              className={`p-5 border-border transition-all hover:border-primary/30 group ${!n.read ? 'bg-primary/5 border-primary/20' : 'bg-card/50 opacity-80'}`}
              onClick={async () => {
                await markNotificationRead(n.id);
                if (n.href) setLoc(n.href);
              }}
            >
              <div className="flex gap-4">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!n.read ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                  <Bell className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <div className={`text-sm md:text-base ${!n.read ? 'font-bold' : ''}`}>
                      {lang === 'en' ? (n.messageEn || n.message) : n.message}
                    </div>
                    {!n.read && <Badge className="bg-primary text-primary-foreground text-[10px] h-4 px-1.5 uppercase tracking-tighter">{t('new')}</Badge>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {new Date(n.createdAt).toLocaleDateString(lang === 'en' ? 'en-US' : 'zh-HK')}
                    <span>·</span>
                    {new Date(n.createdAt).toLocaleTimeString(lang === 'en' ? 'en-US' : 'zh-HK', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
