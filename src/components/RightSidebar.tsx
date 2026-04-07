import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { PoolSettings } from '@/types';
import { RotateCw, Zap, RefreshCcw } from 'lucide-react';
import { useI18n } from '@/lib/i18n';

interface RightSidebarProps {
  settings: PoolSettings;
  onSettingsChange: (settings: PoolSettings) => void;
  onRotateNow: () => void;
  onPauseAll: () => void;
  onHealthCheck: () => void;
  onRestartOpenClaw?: () => void;
  onRefreshAllTokens?: () => void;
  onCheckAllUsage?: () => void;
}

export function RightSidebar({
  settings,
  onSettingsChange,
  onRotateNow,
  onRestartOpenClaw,
  onCheckAllUsage,
}: RightSidebarProps) {
  const { t } = useI18n();

  const update = (partial: Partial<PoolSettings>) => {
    onSettingsChange({ ...settings, ...partial });
  };

  return (
    <aside className="w-80 shrink-0 border-l border-border/40 bg-card/20 backdrop-blur-xl overflow-y-auto">

      {/* 快捷操作 */}
      <div className="p-5 border-b border-border/40 space-y-2.5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">{t('right.quickActions')}</h3>
        <Button onClick={onRotateNow} className="w-full h-10 text-sm bg-primary hover:bg-primary/90 text-primary-foreground transition-fast shadow-sm">
          <RotateCw className="h-4 w-4 mr-2" />
          {t('right.rotateNext')}
        </Button>

        {onCheckAllUsage && (
          <Button onClick={onCheckAllUsage} variant="outline" className="w-full h-10 text-sm border-primary/30 text-primary hover:bg-primary/10 transition-fast">
            <Zap className="h-4 w-4 mr-2" />
            检测所有账号用量
          </Button>
        )}
      </div>

      {/* 轮换策略 */}
      <div className="p-5 border-b border-border/40 space-y-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('right.rotationSettings')}</h3>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground font-medium">{t('right.strategy')}</Label>
          <Select value={settings.strategy} onValueChange={(v) => update({ strategy: v as PoolSettings['strategy'] })}>
            <SelectTrigger className="h-10 text-sm bg-input border-border/40 transition-fast hover:border-primary/30">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="round_robin">{t('right.strategy.round_robin')}</SelectItem>
              <SelectItem value="least_used">{t('right.strategy.least_used')}</SelectItem>
              <SelectItem value="random">{t('right.strategy.random')}</SelectItem>
              <SelectItem value="priority_based">{t('right.strategy.priority_based')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/30 transition-fast">
          <Label className="text-sm text-muted-foreground font-medium cursor-pointer">{t('right.autoRotation')}</Label>
          <Switch checked={settings.auto_rotation} onCheckedChange={(v) => update({ auto_rotation: v })} />
        </div>

        <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/30 transition-fast">
          <Label className="text-sm text-muted-foreground font-medium cursor-pointer">{t('right.autoTokenRefresh')}</Label>
          <Switch checked={settings.auto_token_refresh} onCheckedChange={(v) => update({ auto_token_refresh: v })} />
        </div>

        {settings.auto_token_refresh && (
          <div className="space-y-2 animate-fadeIn">
            <Label className="text-sm text-muted-foreground font-medium">{t('right.refreshInterval')}</Label>
            <Select
              value={String(settings.token_refresh_interval_hours)}
              onValueChange={(v) => update({ token_refresh_interval_hours: Number(v) })}
            >
              <SelectTrigger className="h-10 text-sm bg-input border-border/40 transition-fast hover:border-primary/30">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24">24h (1 天)</SelectItem>
                <SelectItem value="48">48h (2 天)</SelectItem>
                <SelectItem value="72">72h (3 天)</SelectItem>
                <SelectItem value="120">120h (5 天)</SelectItem>
                <SelectItem value="168">168h (7 天)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {/* Codex 路径 */}
      <div className="p-5 border-b border-border/40 space-y-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('right.codexConfig')}</h3>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground font-medium">{t('right.codexPath')}</Label>
          <Input
            value={settings.codex_path}
            onChange={(e) => update({ codex_path: e.target.value })}
            className="h-10 text-sm bg-input border-border/40 font-mono transition-fast hover:border-primary/30 focus:border-primary"
            placeholder="留空自动探测"
          />
        </div>
      </div>

      {/* Openclaw 集成 */}
      <div className="p-5 space-y-4">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('right.openclawIntegration')}</h3>

        <div className="flex items-center gap-2.5 text-sm px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
          <span className="text-muted-foreground font-medium">Connected</span>
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground font-medium">{t('right.endpoint')}</Label>
          <Input
            value={settings.openclaw_endpoint}
            onChange={(e) => update({ openclaw_endpoint: e.target.value })}
            className="h-10 text-sm bg-input border-border/40 font-mono transition-fast hover:border-primary/30 focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground font-medium">{t('right.apiKey')}</Label>
          <Input
            type="password"
            value={settings.openclaw_api_key}
            onChange={(e) => update({ openclaw_api_key: e.target.value })}
            className="h-10 text-sm bg-input border-border/40 transition-fast hover:border-primary/30 focus:border-primary"
            placeholder="••••••••"
          />
        </div>

        <div className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-secondary/30 transition-fast">
          <Label className="text-sm text-muted-foreground font-medium cursor-pointer">{t('right.autoDispatch')}</Label>
          <Switch checked={settings.auto_dispatch} onCheckedChange={(v) => update({ auto_dispatch: v })} />
        </div>
        {onRestartOpenClaw && (
          <Button onClick={onRestartOpenClaw} variant="outline" className="w-full h-10 text-sm border-info/30 text-info hover:bg-info/10 transition-fast">
            <RefreshCcw className="h-4 w-4 mr-2" />
            {t('right.reloadOpenClaw')}
          </Button>
        )}
      </div>
    </aside>
  );
}
