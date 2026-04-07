import { useEffect, useRef, useState } from 'react';
import { Header } from '@/components/Header';
import { LeftSidebar } from '@/components/LeftSidebar';
import { Account, LogEntry, LogLevel, PoolSettings } from '@/types';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Download, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useI18n } from '@/lib/i18n';

const levelColors: Record<LogLevel, string> = {
  info: 'text-muted-foreground',
  warn: 'text-warning',
  error: 'text-destructive',
};

const LogsPage = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [settings, setSettings] = useState<PoolSettings | null>(null);
  const [levelFilter, setLevelFilter] = useState<LogLevel | 'all'>('all');
  const [accountFilter, setAccountFilter] = useState<string>('all');
  const [autoScroll, setAutoScroll] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { t } = useI18n();

  const loadPage = async (level = levelFilter, account = accountFilter) => {
    const [nextLogs, nextAccounts, nextSettings] = await Promise.all([
      api.listLogs({ level, account }),
      api.listAccounts(),
      api.getSettings(),
    ]);
    setLogs(nextLogs);
    setAccounts(nextAccounts);
    setSettings(nextSettings);
  };

  useEffect(() => {
    loadPage().catch((error: Error) => toast.error(error.message));
  }, []);

  useEffect(() => {
    if (autoScroll && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs.length, autoScroll]);

  const currentAccount = accounts.find((account) => account.is_current);

  const handleFilterChange = async (level: LogLevel | 'all', account: string) => {
    setLevelFilter(level);
    setAccountFilter(account);
    try {
      const nextLogs = await api.listLogs({ level, account });
      setLogs(nextLogs);
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(logs, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'logs.json';
    link.click();
    URL.revokeObjectURL(url);
    toast.success('Logs exported');
  };

  const handleClear = async () => {
    try {
      await api.clearLogs();
      setLogs([]);
      toast.success('Logs cleared');
    } catch (error) {
      toast.error((error as Error).message);
    }
  };

  if (!settings) {
    return <div className="h-screen grid place-items-center text-sm text-muted-foreground">{t('loading.logs')}</div>;
  }

  return (
    <div className="h-screen flex flex-col">
      <Header activeAccount={currentAccount?.account_id || 'None'} mode={settings.mode} onModeChange={(mode) => setSettings((prev) => prev ? { ...prev, mode } : prev)} />
      <div className="flex-1 flex min-h-0">
        <LeftSidebar currentAccount={currentAccount} accounts={accounts} recentLogs={logs} />
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border/50 flex-wrap gap-2">
            <h2 className="text-sm font-semibold text-foreground">{t('logs.title')}</h2>
            <div className="flex items-center gap-3">
              <Select value={levelFilter} onValueChange={(value) => handleFilterChange(value as LogLevel | 'all', accountFilter)}>
                <SelectTrigger className="h-7 w-28 text-xs bg-input border-border/50"><SelectValue placeholder="Level" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('logs.allLevels')}</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                  <SelectItem value="warn">Warn</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                </SelectContent>
              </Select>
              <Select value={accountFilter} onValueChange={(value) => handleFilterChange(levelFilter, value)}>
                <SelectTrigger className="h-7 w-28 text-xs bg-input border-border/50"><SelectValue placeholder="Account" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('logs.allAccounts')}</SelectItem>
                  {accounts.map((account) => <SelectItem key={account.id} value={account.account_id}>{account.account_id}</SelectItem>)}
                </SelectContent>
              </Select>
              <div className="flex items-center gap-1.5">
                <Label className="text-[11px] text-muted-foreground">{t('logs.autoScroll')}</Label>
                <Switch checked={autoScroll} onCheckedChange={setAutoScroll} />
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleClear}>
                <Trash2 className="h-3 w-3 mr-1" />{t('logs.clear')}
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={handleExport}>
                <Download className="h-3 w-3 mr-1" />{t('logs.export')}
              </Button>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto bg-background/50">
            {logs.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">{t('logs.empty')}</p>
            ) : (
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card/95 backdrop-blur-sm border-b border-border/50 z-10">
                  <tr>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wider w-32">时间</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wider w-20">级别</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wider w-40">账号</th>
                    <th className="text-left py-3 px-4 font-semibold text-muted-foreground uppercase tracking-wider">消息</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  {logs.map((log, index) => (
                    <tr 
                      key={log.id} 
                      className={`border-b border-border/30 hover:bg-secondary/20 transition-colors ${
                        index % 2 === 0 ? 'bg-background/30' : 'bg-background/50'
                      }`}
                    >
                      <td className="py-2.5 px-4 text-muted-foreground tabular-nums whitespace-nowrap">
                        {new Date(log.created_at).toLocaleString('zh-CN', { 
                          month: '2-digit',
                          day: '2-digit',
                          hour: '2-digit', 
                          minute: '2-digit', 
                          second: '2-digit',
                          hour12: false 
                        })}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className={`inline-flex items-center justify-center px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          log.level === 'error' 
                            ? 'bg-destructive/15 text-destructive border border-destructive/30' 
                            : log.level === 'warn'
                            ? 'bg-warning/15 text-warning border border-warning/30'
                            : 'bg-primary/10 text-primary/80 border border-primary/20'
                        }`}>
                          {log.level}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-info truncate max-w-[200px]" title={log.account_name || '—'}>
                        {log.account_name || '—'}
                      </td>
                      <td className="py-2.5 px-4 text-foreground/90 break-words">
                        {log.message}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default LogsPage;
