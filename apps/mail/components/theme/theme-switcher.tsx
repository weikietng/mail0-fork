'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useState } from 'react';

import { type MessageKey } from '@/config/navigation';
import { Laptop, Moon, Sun } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
interface ModeToggleProps {
  className?: string;
}

export function ModeToggle({ className }: ModeToggleProps) {
  const [mounted, setMounted] = useState(false);

  const t = useTranslations();

  // Fixes SSR hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  const { theme, systemTheme, resolvedTheme, setTheme } = useTheme();

  async function handleThemeChange(newTheme: string) {
    let nextResolvedTheme = newTheme;

    if (newTheme === 'system' && systemTheme) {
      nextResolvedTheme = systemTheme;
    }

    function update() {
      setTheme(newTheme);
    }

    if (document.startViewTransition && nextResolvedTheme !== resolvedTheme) {
      document.documentElement.style.viewTransitionName = 'theme-transition';
      await document.startViewTransition(update).finished;
      document.documentElement.style.viewTransitionName = '';
    } else {
      update();
    }
  }

  if (!mounted) {
    return <div className="h-9" />;
  }

  return (
    <Select value={theme} onValueChange={handleThemeChange}>
      <SelectTrigger className={cn(className)}>
        <SelectValue placeholder="Select theme">
          <div className="flex items-center gap-2 capitalize">
            {theme === 'dark' && <Moon className="h-4 w-4" />}
            {theme === 'light' && <Sun className="h-4 w-4" />}
            {theme === 'system' && <Laptop className="h-4 w-4" />}
            {t(`common.themes.${theme}` as MessageKey)}
          </div>
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="dark">
          <div className="flex items-center gap-2">
            <Moon className="h-4 w-4" />
            {t('common.themes.dark')}
          </div>
        </SelectItem>
        <SelectItem value="system">
          <div className="flex items-center gap-2">
            <Laptop className="h-4 w-4" />
            {t('common.themes.system')}
          </div>
        </SelectItem>
        <SelectItem value="light">
          <div className="flex items-center gap-2">
            <Sun className="h-4 w-4" />
            {t('common.themes.light')}
          </div>
        </SelectItem>
      </SelectContent>
    </Select>
  );
}
