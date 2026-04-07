import { useEffect, useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';
import { useI18n } from '@/lib/i18n';
import { useTheme } from '@/lib/theme';

interface HeaderProps {
  activeAccount: string;
  mode: 'codex' | 'trae';
  onModeChange: (mode: 'codex' | 'trae') => void;
}

const LANG_FLAG: Record<string, { flag: string; label: string }> = {
  zh: { flag: '🇨🇳', label: 'CN' },
  en: { flag: '🇺🇸', label: 'EN' },
};

export function Header({ activeAccount, mode, onModeChange }: HeaderProps) {
  const [time, setTime] = useState(new Date());
  const { lang, setLang, t } = useI18n();
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    const iv = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  const currentLang = LANG_FLAG[lang];
  const nextLang = lang === 'zh' ? 'en' : 'zh';

  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-border/40 bg-card/30 backdrop-blur-xl shrink-0">
      <div className="flex items-center gap-4">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{t('app.title')}</h1>
        <span className="text-sm text-muted-foreground font-medium px-2.5 py-1 rounded-md bg-muted/30">{t('app.version')}</span>
      </div>

      <div className="flex items-center gap-5">
        <div className="flex items-center gap-2.5 px-4 py-2 rounded-lg bg-secondary/50 border border-border/40">
          <span className="h-2 w-2 rounded-full bg-primary animate-pulse-dot" />
          <span className="font-semibold text-foreground text-base">{activeAccount}</span>
        </div>

        <Select value={mode} onValueChange={(v) => onModeChange(v as 'codex' | 'trae')}>
          <SelectTrigger className="h-9 w-28 text-sm bg-secondary/50 border-border/40 transition-fast hover:bg-secondary">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="codex">Codex</SelectItem>
            <SelectItem value="trae">Trae</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex items-center gap-1 border border-border/40 rounded-lg overflow-hidden bg-secondary/30">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 rounded-none hover:bg-secondary transition-fast"
            onClick={toggleTheme}
            title={theme === 'dark' ? '切换到亮色' : '切换到暗色'}
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <div className="w-px h-5 bg-border/40" />

          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-3 rounded-none text-sm gap-2 hover:bg-secondary transition-fast"
            onClick={() => setLang(nextLang)}
            title={lang === 'zh' ? 'Switch to English' : '切换到中文'}
          >
            <span className="text-lg leading-none">{currentLang.flag}</span>
            <span className="font-medium">{currentLang.label}</span>
          </Button>
        </div>

        <span className="text-sm text-muted-foreground font-mono tabular-nums px-2">
          {time.toLocaleTimeString('en-US', { hour12: false })}
        </span>
      </div>
    </header>
  );
}
