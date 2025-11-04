import { useTranslation } from 'react-i18next';
import { Globe } from 'lucide-react';
import { languageAPI, isAuthenticated } from '@/services/api';
import { logger } from '@/lib/logger';

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'vi', name: 'Tiếng Việt', flag: '🇻🇳' }
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  const changeLanguage = async (lng: string) => {
    try {
      // Update i18n locally first (immediate UI update)
      await i18n.changeLanguage(lng);
      localStorage.setItem('i18nextLng', lng);
      
      // Sync with backend if user is authenticated
      if (isAuthenticated()) {
        try {
          await languageAPI.updatePreference(lng as 'en' | 'vi');
          logger.info('Language preference synced with backend', { language: lng });
        } catch (error) {
          logger.error('Failed to sync language preference with backend', error);
          // Continue even if backend sync fails - user still has local language change
        }
      }
    } catch (error) {
      logger.error('Failed to change language', error);
    }
  };

  const currentLanguage = languages.find(l => l.code === i18n.language) || languages[0];

  return (
    <div className="relative group">
      <button 
        className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-yellow-400 border-4 border-border
                   hover:bg-cyan-300 hover:translate-x-1 hover:translate-y-1 
                   transition-transform font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                   text-sm md:text-base"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4 md:w-5 md:h-5" />
        <span className="hidden sm:inline text-xl">{currentLanguage.flag}</span>
      </button>

      <div className="absolute right-0 mt-2 w-48 bg-card border-4 border-border 
                      shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] opacity-0 invisible
                      group-hover:opacity-100 group-hover:visible transition-all z-50">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => changeLanguage(lang.code)}
            className={`w-full px-4 py-3 text-left font-bold border-b-4 border-border last:border-b-0
                       hover:bg-yellow-400 transition-colors flex items-center gap-3
                       ${i18n.language === lang.code ? 'bg-cyan-300' : 'bg-card'}`}
          >
            <span className="text-2xl">{lang.flag}</span>
            <span className="text-sm md:text-base">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
