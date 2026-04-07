import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MoreHorizontal, AlertCircle, CheckCircle2, Clock, Zap, Eye, EyeOff } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Account, LiveUsageData } from '@/types';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { formatDistanceToNow, differenceInDays, differenceInHours } from 'date-fns';
import { useI18n } from '@/lib/i18n';
import { PlatformIcon } from './PlatformIcon';

interface AccountCardProps {
  account: Account;
  onSetActive: (id: string) => void;
  onPause: (id: string) => void;
  onReset: (id: string) => void;
  onRemove: (id: string) => void;
  refreshKey?: number;
  viewMode?: 'grid' | 'list';
  externalUsage?: LiveUsageData | null;
  onUsageUpdate?: (id: string, usage: LiveUsageData) => void;
}

type AuthInfo = Awaited<ReturnType<typeof api.getAccountAuthInfo>>;


const statusBorderClass: Record<Account['status'], string> = {
  active: 'status-border-active',
  idle: 'status-border-idle',
  error: 'status-border-error',
  rate_limited: 'status-border-warning',
  cooldown: 'status-border-cooldown',
};

const statusBadge: Record<Account['status'], { label: string; className: string }> = {
  active: { label: 'ACTIVE', className: 'bg-primary/15 text-primary border-primary/30' },
  idle: { label: 'IDLE', className: 'bg-muted/30 text-muted-foreground border-muted/50' },
  error: { label: 'ERROR', className: 'bg-destructive/15 text-destructive border-destructive/30' },
  rate_limited: { label: 'RATE LIMITED', className: 'bg-warning/15 text-warning border-warning/30' },
  cooldown: { label: 'COOLDOWN', className: 'bg-info/15 text-info border-info/30' },
};

const typeBadge: Record<Account['auth_type'], { label: string; className: string }> = {
  team: { label: 'TEAM', className: 'bg-info/15 text-info border-info/30' },
  plus: { label: 'PLUS', className: 'bg-primary/15 text-primary border-primary/30' },
  free: { label: 'FREE', className: 'bg-muted/30 text-muted-foreground border-muted/50' },
};

/** 邮箱脱敏：前两位保留，其余打码；域名同理，兼容 qq.com 等短域名 */
function maskEmail(email: string): string {
  if (!email || !email.includes('@')) return email;
  const [local, rest] = email.split('@');
  if (!rest) return email;
  const dotIdx = rest.indexOf('.');
  const domain = dotIdx >= 0 ? rest.slice(0, dotIdx) : rest;
  const tld    = dotIdx >= 0 ? rest.slice(dotIdx)    : '';
  const maskedLocal  = local.length  > 2 ? local.slice(0, 2)  + '***' : local;
  const maskedDomain = domain.length > 2 ? domain.slice(0, 2) + '***' : domain;
  return `${maskedLocal}@${maskedDomain}${tld}`;
}

/** 进度条颜色 */
function barColor(pct: number) {
  if (pct >= 80) return 'bg-destructive';
  if (pct >= 50) return 'bg-warning';
  return 'bg-primary';
}

export function AccountCard({ account, onSetActive, onPause, onReset, onRemove, refreshKey, viewMode = 'grid', externalUsage, onUsageUpdate }: AccountCardProps) {
  const sb = statusBadge[account.status];
  const tb = typeBadge[account.auth_type];
  const { t, dateLocale } = useI18n();

  const [authInfo, setAuthInfo] = useState<AuthInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(false);
  const [usageResult, setUsageResult] = useState<Awaited<ReturnType<typeof api.checkAccountUsage>> | null>(null);
  const [checkingUsage, setCheckingUsage] = useState(false);
  const [liveUsage, setLiveUsage] = useState<LiveUsageData | null>(externalUsage ?? null);
  const [fetchingLive, setFetchingLive] = useState(false);
  const [showEmail, setShowEmail] = useState(false);

  /** 距过期时间的友好描述 + 颜色 */
  function tokenExpiryInfo(expiresAt: string | undefined) {
    if (!expiresAt) return null;
    const exp = new Date(expiresAt);
    const now = new Date();
    if (exp < now) return { label: t('card.tokenExpired'), color: 'text-destructive' };
    const days = differenceInDays(exp, now);
    const hours = differenceInHours(exp, now);
    if (days >= 1) return { label: t('card.tokenDaysLeft', { days }), color: days <= 3 ? 'text-warning' : 'text-primary' };
    return { label: t('card.tokenHoursLeft', { hours }), color: 'text-destructive' };
  }

  const fetchAuthInfo = async () => {
    setLoadingInfo(true);
    try {
      const info = await api.getAccountAuthInfo(account.id);
      setAuthInfo(info);
    } catch {
      setAuthInfo(null);
    } finally {
      setLoadingInfo(false);
    }
  };

  // 合并：检测可用性 + 刷新用量（一次 Codex API 调用搞定）
  const handleRefreshLiveUsage = async () => {
    setFetchingLive(true);
    setCheckingUsage(true);
    setUsageResult(null);
    try {
      const result = await api.checkAccountUsage(account.id);
      setUsageResult(result);

      if (result.ok) {
        const usage: LiveUsageData = {
          ok: true,
          fetched_at: result.fetched_at,
          plan_type: result.plan_type,
          primary: result.primary,
          secondary: result.secondary,
        };
        setLiveUsage(usage);
        onUsageUpdate?.(account.id, usage);
        toast.success(`${account.account_id} ${t('card.codexAvailable')} (5h=${result.primary?.used_percent ?? '?'}%)`);
      } else if (result.rate_limited) {
        if (result.primary || result.secondary) {
          const usage: LiveUsageData = {
            ok: false, error: 'rate_limited',
            fetched_at: result.fetched_at,
            primary: result.primary,
            secondary: result.secondary,
          };
          setLiveUsage(usage);
          onUsageUpdate?.(account.id, usage);
        }
        toast.warning(`${account.account_id} ${t('card.codexRateLimited')}`);
      } else if (result.status === 401) {
        toast.error(`${account.account_id} ${t('card.tokenInvalid')}`);
      } else {
        toast.error(`${account.account_id}: ${result.error ?? t('card.checkFailed')}`);
      }
    } catch {
      toast.error(t('card.checkFailed'));
    } finally {
      setFetchingLive(false);
      setCheckingUsage(false);
    }
  };

  useEffect(() => {
    fetchAuthInfo();
  }, [account.id, account.auth_file_path, refreshKey]);

  // Sync usage data pushed from parent (batch refresh)
  useEffect(() => {
    if (externalUsage != null) {
      setLiveUsage(externalUsage);
    }
  }, [externalUsage]);

  // 账号变为活跃时自动获取实时用量
  useEffect(() => {
    if (account.is_current) {
      handleRefreshLiveUsage();
    }
  }, [account.is_current]);

  const expiry = tokenExpiryInfo(authInfo?.token_expires_at);
  const hasAuthFile = authInfo && !authInfo.error;

  // ── Compact list row ──
  if (viewMode === 'list') {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -10 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className={`relative flex items-center gap-4 rounded-xl bg-card px-4 py-3 card-shadow transition-smooth hover:card-shadow-hover hover:-translate-y-0.5 ${statusBorderClass[account.status]} ${account.is_current ? 'active-glow' : ''}`}
        style={account.is_current ? { order: -1 } : undefined}
      >
        {/* Platform icon */}
        <div className="shrink-0">
          <PlatformIcon platform={account.platform || 'gpt'} size={20} />
        </div>

        {/* Account name + status */}
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          {account.is_current && <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot shrink-0" />}
          <span className="text-base font-bold text-foreground truncate">{account.account_id}</span>
          <Badge variant="outline" className={`text-[10px] h-5 px-2 shrink-0 font-medium ${typeBadge[account.auth_type].className}`}>
            {typeBadge[account.auth_type].label}
          </Badge>
          <Badge variant="outline" className={`text-[10px] h-5 px-2 shrink-0 font-medium ${statusBadge[account.status].className}`}>
            {statusBadge[account.status].label}
          </Badge>
        </div>

        {/* Email (masked) */}
        <div className="hidden sm:flex items-center gap-2 min-w-0 w-44 shrink-0">
          {hasAuthFile ? (
            <>
              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
              <span className="text-xs text-muted-foreground truncate">
                {showEmail
                  ? (authInfo.email ?? account.email)
                  : maskEmail(authInfo.email ?? account.email ?? '')}
              </span>
              <button
                onClick={() => setShowEmail(v => !v)}
                className="shrink-0 h-5 w-5 flex items-center justify-center rounded hover:bg-secondary/50 text-muted-foreground transition-smooth hover:scale-110"
              >
                {showEmail ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            </>
          ) : (
            <span className="text-xs text-destructive truncate">No auth</span>
          )}
        </div>

        {/* Usage bars (if available) */}
        <div className="hidden md:flex items-center gap-3 w-48 shrink-0">
          {liveUsage?.primary && (
            <div className="flex items-center gap-2 flex-1">
              <div className="h-2 flex-1 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${barColor(liveUsage.primary.used_percent)}`}
                  style={{ width: `${Math.min(liveUsage.primary.used_percent, 100)}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground w-10 text-right tabular-nums font-medium">
                {liveUsage.primary.used_percent.toFixed(0)}%
              </span>
            </div>
          )}
          {!liveUsage?.primary && (
            <span className="text-xs text-muted-foreground">—</span>
          )}
        </div>

        {/* Token expiry */}
        {expiry && (
          <span className={`hidden lg:block text-xs shrink-0 font-medium ${expiry.color}`}>{expiry.label}</span>
        )}

        {/* Actions */}
        <div className="flex items-center gap-1.5 shrink-0 ml-auto">
          <button
            onClick={handleRefreshLiveUsage}
            disabled={fetchingLive}
            className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-secondary/50 text-muted-foreground disabled:opacity-40 transition-smooth hover:scale-110"
            title={t('card.checkAvailability')}
          >
            <Zap className={`h-4 w-4 ${fetchingLive ? 'animate-pulse text-primary' : ''}`} />
          </button>
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-secondary/50 text-muted-foreground transition-smooth hover:scale-110">
              <MoreHorizontal className="h-4.5 w-4.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-sm">
              <DropdownMenuItem onClick={() => onSetActive(account.id)}>{t('card.setActive')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPause(account.id)}>{t('card.pause')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onReset(account.id)}>{t('card.reset')}</DropdownMenuItem>
              <DropdownMenuItem onClick={async () => {
                try {
                  toast.info(`正在刷新 ${account.account_id} 的 Token...`);
                  const result = await api.refreshToken(account.id);
                  if (result.ok) { toast.success(`Token 刷新成功`); fetchAuthInfo(); }
                  else toast.error(`刷新失败: ${result.reason}`);
                } catch { toast.error('Token 刷新失败'); }
              }} className="text-green-500">{t('card.refreshToken')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRemove(account.id)} className="text-destructive">{t('card.remove')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </motion.div>
    );
  }

  // ── Full grid card ──
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`relative overflow-hidden rounded-2xl bg-card p-5 card-shadow transition-smooth hover:card-shadow-hover ${statusBorderClass[account.status]} ${account.is_current ? 'active-glow' : ''}`}
      style={account.is_current ? { order: -1 } : undefined}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          {account.is_current && <span className="h-2.5 w-2.5 rounded-full bg-primary animate-pulse-dot" />}
          {/* Platform logo */}
          <Tooltip>
            <TooltipTrigger asChild>
              <span className="inline-flex items-center justify-center transition-smooth hover:scale-110">
                <PlatformIcon platform={account.platform || 'gpt'} size={18} />
              </span>
            </TooltipTrigger>
            <TooltipContent className="text-sm capitalize">{account.platform || 'gpt'}</TooltipContent>
          </Tooltip>
          <span className="text-base font-bold text-foreground">{account.account_id}</span>
          <Badge variant="outline" className={`text-[10px] h-5 px-2 font-medium ${tb.className}`}>{tb.label}</Badge>
          <Badge variant="outline" className={`text-[10px] h-5 px-2 font-medium ${sb.className}`}>{sb.label}</Badge>
        </div>
        <div className="flex items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-secondary/50 text-muted-foreground transition-smooth hover:scale-110">
              <MoreHorizontal className="h-4.5 w-4.5" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="text-sm">
              <DropdownMenuItem onClick={() => onSetActive(account.id)}>{t('card.setActive')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onPause(account.id)}>{t('card.pause')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onReset(account.id)}>{t('card.reset')}</DropdownMenuItem>
              <DropdownMenuItem onClick={async () => {
                try {
                  toast.info(`正在刷新 ${account.account_id} 的 Token...`);
                  const result = await api.refreshToken(account.id);
                  if (result.ok) {
                    toast.success(`${account.account_id} Token 刷新成功`);
                    fetchAuthInfo();
                  } else {
                    toast.error(`刷新失败: ${result.reason}`);
                  }
                } catch { toast.error('Token 刷新失败'); }
              }} className="text-green-500">{t('card.refreshToken')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => onRemove(account.id)} className="text-destructive">{t('card.remove')}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 邮箱 + Auth 状态 */}
      <div className="mb-4">
        {loadingInfo ? (
          <p className="text-sm text-muted-foreground">{t('card.readingInfo')}</p>
        ) : hasAuthFile ? (
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-primary shrink-0" />
              <p className="text-sm text-foreground font-medium truncate max-w-[200px]">
                {showEmail
                  ? (authInfo.email ?? account.email)
                  : maskEmail(authInfo.email ?? account.email ?? '')}
              </p>
              <button
                onClick={() => setShowEmail(v => !v)}
                className="h-5 w-5 flex items-center justify-center rounded hover:bg-secondary/50 text-muted-foreground shrink-0 transition-smooth hover:scale-110"
                title={showEmail ? t('card.hideEmail') : t('card.showEmail')}
              >
                {showEmail ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
              </button>
            </div>
            {expiry && (
              <div className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                <p className={`text-sm ${expiry.color}`}>{expiry.label}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">
              {authInfo?.error === 'auth_file_not_found'
                ? `${t('card.authNotFound')}: ${authInfo.path}`
                : t('card.authReadFail')}
            </p>
          </div>
        )}
      </div>

      {/* OpenAI 用量（5h / 周） */}
      {hasAuthFile && authInfo.usage && (
        <div className="space-y-2 mb-4 text-sm">
          {authInfo.usage.message_cap != null && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('card.5hUsageCap')}</span>
              <span className="text-foreground font-medium">{authInfo.usage.message_cap}</span>
            </div>
          )}
          {authInfo.usage.message_cap_rollover && (
            <div className="text-xs text-muted-foreground">
              {t('card.resetTime')}：{new Date(authInfo.usage.message_cap_rollover).toLocaleString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
            </div>
          )}
        </div>
      )}

      {/* Codex 用量（实时 API 数据） */}
      {(() => {
        const isLive = liveUsage?.ok || (liveUsage && 'primary' in liveUsage);
        const primary = liveUsage?.primary ?? null;
        const secondary = liveUsage?.secondary ?? null;
        const fetchedAt = liveUsage?.fetched_at;

        return (
          <div className="mb-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wide">{t('card.codexUsage')}</span>
              <div className="flex items-center gap-2">
                {fetchedAt && (
                  <span className="text-[10px] text-muted-foreground">
                    {isLive ? `${t('card.live')} · ` : `${t('card.stale')} · `}
                    {formatDistanceToNow(new Date(fetchedAt), { addSuffix: true, locale: dateLocale })}
                  </span>
                )}
              </div>
            </div>

            {fetchingLive ? (
              <p className="text-sm text-muted-foreground">{t('card.refreshing')}</p>
            ) : !primary && !secondary ? (
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{t('card.noData')}</p>
                {account.is_current && (
                  <button
                    onClick={handleRefreshLiveUsage}
                    className="text-xs text-primary hover:underline font-medium"
                  >
                    {t('card.clickToFetch')}
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {primary && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('card.5hWindow')}</span>
                      <span className={primary.used_percent >= 80 ? 'text-destructive font-semibold' : primary.used_percent >= 50 ? 'text-warning font-semibold' : 'text-foreground font-medium'}>
                        {primary.used_percent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${barColor(primary.used_percent)}`} style={{ width: `${Math.min(primary.used_percent, 100)}%` }} />
                    </div>
                    {primary.resets_at && (
                      <p className="text-xs text-muted-foreground">
                        {t('card.resetTime')}：{new Date(primary.resets_at) < new Date() ? t('card.resetDone') : formatDistanceToNow(new Date(primary.resets_at), { addSuffix: true, locale: dateLocale })}
                      </p>
                    )}
                  </div>
                )}
                {secondary && (
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">{t('card.weeklyUsage')}</span>
                      <span className={secondary.used_percent >= 80 ? 'text-destructive font-semibold' : secondary.used_percent >= 50 ? 'text-warning font-semibold' : 'text-foreground font-medium'}>
                        {secondary.used_percent.toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 w-full rounded-full bg-secondary overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${barColor(secondary.used_percent)}`} style={{ width: `${Math.min(secondary.used_percent, 100)}%` }} />
                    </div>
                    {secondary.resets_at && (
                      <p className="text-xs text-muted-foreground">
                        {t('card.resetTime')}：{new Date(secondary.resets_at) < new Date() ? t('card.resetDone') : formatDistanceToNow(new Date(secondary.resets_at), { addSuffix: true, locale: dateLocale })}
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })()}

      {/* 检测按钮（合并：检测可用性 + 刷新用量） */}
      <div className="mb-4">
        <Button
          variant="outline"
          size="sm"
          className="w-full h-9 text-sm gap-2 transition-smooth hover:scale-105"
          onClick={handleRefreshLiveUsage}
          disabled={fetchingLive}
        >
          <Zap className={`h-4 w-4 ${fetchingLive ? 'animate-pulse' : ''}`} />
          {fetchingLive ? t('card.checking') : t('card.checkAvailability')}
        </Button>

        {usageResult && (
          <div className={`mt-3 rounded-lg px-4 py-2.5 text-sm animate-fadeIn ${
            usageResult.ok ? 'bg-primary/5 border border-primary/20' :
            usageResult.rate_limited ? 'bg-destructive/10 border border-destructive/20' :
            'bg-destructive/10 border border-destructive/20'
          }`}>
            <div className="flex items-center gap-2 font-medium">
              {usageResult.ok ? (
                <><CheckCircle2 className="h-3.5 w-3.5 text-primary" /><span className="text-primary">{t('card.codexAvailable')}</span></>
              ) : usageResult.rate_limited ? (
                <><AlertCircle className="h-3.5 w-3.5 text-destructive" /><span className="text-destructive">{t('card.codexRateLimited')}</span></>
              ) : usageResult.status === 401 ? (
                <><AlertCircle className="h-3.5 w-3.5 text-destructive" /><span className="text-destructive">{t('card.tokenInvalid')}</span></>
              ) : (
                <><AlertCircle className="h-3.5 w-3.5 text-destructive" /><span className="text-destructive">{usageResult.error ?? t('card.checkFailed')}</span></>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 上次请求 */}
      <div className="flex gap-4 text-xs text-muted-foreground mb-4">
        <Tooltip>
          <TooltipTrigger>
            {t('card.lastReq')}: {formatDistanceToNow(new Date(account.last_request_at), { addSuffix: true, locale: dateLocale })}
          </TooltipTrigger>
          <TooltipContent className="text-sm">{new Date(account.last_request_at).toLocaleString()}</TooltipContent>
        </Tooltip>
        {authInfo?.last_refresh && (
          <Tooltip>
            <TooltipTrigger>
              {t('card.tokenRefresh')}: {formatDistanceToNow(new Date(authInfo.last_refresh), { addSuffix: true, locale: dateLocale })}
            </TooltipTrigger>
            <TooltipContent className="text-sm">{new Date(authInfo.last_refresh).toLocaleString()}</TooltipContent>
          </Tooltip>
        )}
      </div>


      {/* Warning Banners */}
      {account.status === 'error' && (
        <div className="mt-4 -mx-5 -mb-5 px-5 py-3 bg-destructive/10 border-t border-destructive/20 text-sm text-destructive animate-fadeIn">
          {t('card.errorWarning')}
        </div>
      )}
      {account.status === 'rate_limited' && (
        <div className="mt-4 -mx-5 -mb-5 px-5 py-3 bg-warning/10 border-t border-warning/20 text-sm text-warning animate-fadeIn">
          {t('card.rateLimitWarning')}
        </div>
      )}
      {hasAuthFile && expiry?.color === 'text-destructive' && account.status !== 'error' && (
        <div className="mt-4 -mx-5 -mb-5 px-5 py-3 bg-destructive/10 border-t border-destructive/20 text-sm text-destructive animate-fadeIn">
          {expiry.label}{t('card.tokenExpireWarning')}
        </div>
      )}
    </motion.div>
  );
}
