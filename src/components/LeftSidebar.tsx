import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Settings, ScrollText, User } from 'lucide-react';
import { Account, LogEntry } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { useI18n } from '@/lib/i18n';

interface LeftSidebarProps {
  currentAccount: Account | undefined;
  accounts: Account[];
  recentLogs: LogEntry[];
}

export function LeftSidebar({ currentAccount, accounts, recentLogs }: LeftSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, dateLocale } = useI18n();

  const navItems = [
    { label: t('nav.dashboard'), path: '/', icon: LayoutDashboard },
    { label: t('nav.settings'), path: '/settings', icon: Settings },
    { label: t('nav.logs'), path: '/logs', icon: ScrollText },
  ];

  return (
    <aside className="w-72 shrink-0 border-r border-border/40 bg-card/20 backdrop-blur-xl flex flex-col overflow-y-auto">
      {/* 当前活跃账号 */}
      {currentAccount ? (
        <div className="p-5 border-b border-border/40">
          <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
            <div className="h-11 w-11 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="text-base font-semibold text-foreground truncate">{currentAccount.account_id}</span>
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot shrink-0" />
              </div>
              <p className="text-sm text-muted-foreground truncate mt-1">{currentAccount.email}</p>
              <p className="text-xs text-muted-foreground capitalize mt-1">{currentAccount.auth_type}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 border-b border-border/40">
          <div className="p-4 rounded-lg bg-muted/20 border border-border/40">
            <p className="text-sm font-medium text-muted-foreground">{t('sidebar.noActive')}</p>
            <p className="text-sm text-muted-foreground/70 mt-1">{t('sidebar.noActiveHint')}</p>
          </div>
        </div>
      )}

      {/* 导航 */}
      <nav className="p-4 border-b border-border/40">
        {navItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-fast mb-1 ${
                active
                  ? 'bg-primary/10 text-primary border border-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/50'
              }`}
            >
              <item.icon className="h-4.5 w-4.5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* 最近操作日志 */}
      <div className="p-5 flex-1 min-h-0">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">{t('sidebar.recentOps')}</h3>
        <div className="space-y-3">
          {recentLogs.slice(0, 6).map((log) => (
            <div key={log.id} className="flex items-start gap-2.5 text-sm">
              <span className={`mt-1 h-2 w-2 rounded-full shrink-0 ${
                log.level === 'error' ? 'bg-destructive' : log.level === 'warn' ? 'bg-warning' : 'bg-primary'
              }`} />
              <div className="min-w-0 flex-1">
                <p className="text-foreground/90 truncate leading-relaxed">{log.message}</p>
                <p className="text-muted-foreground/70 text-xs mt-1">{formatDistanceToNow(new Date(log.created_at), { addSuffix: true, locale: dateLocale })}</p>
              </div>
            </div>
          ))}
          {recentLogs.length === 0 && (
            <p className="text-sm text-muted-foreground/70">{t('sidebar.noLogs')}</p>
          )}
        </div>
      </div>
    </aside>
  );
}
