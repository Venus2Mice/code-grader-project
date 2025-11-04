import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';

const themes = [
  { mode: 'light', name: 'Light', icon: Sun, emoji: '☀️' },
  { mode: 'dark', name: 'Dark', icon: Moon, emoji: '🌙' }
] as const;

export function ThemeSwitcher() {
  const { theme, toggleTheme } = useTheme();

  const currentTheme = themes.find(t => t.mode === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;

  return (
    <div className="relative group">
      <button 
        className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-white dark:bg-gray-800 border-4 border-border
                   hover:bg-primary hover:text-white dark:hover:bg-primary hover:translate-x-1 hover:translate-y-1 
                   transition-all font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                   text-sm md:text-base"
        aria-label="Change theme"
      >
        <CurrentIcon className="w-4 h-4 md:w-5 md:h-5" />
        <span className="hidden sm:inline text-xl">{currentTheme.emoji}</span>
      </button>

      <div className="absolute right-0 mt-2 w-48 bg-card border-4 border-border 
                      shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] opacity-0 invisible
                      group-hover:opacity-100 group-hover:visible transition-all z-50">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          return (
            <button
              key={themeOption.mode}
              onClick={toggleTheme}
              className={`w-full px-4 py-3 text-left font-bold border-b-4 border-border last:border-b-0
                         hover:bg-primary hover:text-white transition-colors flex items-center gap-3
                         ${theme === themeOption.mode ? 'bg-primary text-white' : 'bg-card'}`}
            >
              <span className="text-2xl">{themeOption.emoji}</span>
              <div className="flex items-center gap-2">
                <Icon className="w-4 h-4" />
                <span className="text-sm md:text-base">{themeOption.name}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
