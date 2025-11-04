import { Code } from 'lucide-react';

const languages = [
  { code: 'cpp', name: 'C++', emoji: '⚡' },
  { code: 'python', name: 'Python', emoji: '🐍' },
  { code: 'java', name: 'Java', emoji: '☕' }
];

interface LanguageDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

export function LanguageDropdown({ value, onChange }: LanguageDropdownProps) {
  const currentLanguage = languages.find(l => l.code === value) || languages[0];

  return (
    <div className="relative group">
      <button 
        className="flex items-center gap-2 px-3 py-2 md:px-4 md:py-2 bg-yellow-400 border-4 border-border
                   hover:bg-cyan-300 hover:translate-x-1 hover:translate-y-1 
                   transition-all font-bold shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]
                   text-sm md:text-base uppercase"
        aria-label="Select language"
      >
        <Code className="w-4 h-4 md:w-5 md:h-5" />
        <span className="hidden sm:inline">{currentLanguage.name}</span>
        <span className="text-xl">{currentLanguage.emoji}</span>
      </button>

      <div className="absolute right-0 mt-2 w-48 bg-card border-4 border-border 
                      shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] opacity-0 invisible
                      group-hover:opacity-100 group-hover:visible transition-all z-50">
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => onChange(lang.code)}
            className={`w-full px-4 py-3 text-left font-bold border-b-4 border-border last:border-b-0
                       hover:bg-yellow-400 transition-colors flex items-center gap-3
                       ${value === lang.code ? 'bg-cyan-300' : 'bg-card'}`}
          >
            <span className="text-2xl">{lang.emoji}</span>
            <span className="text-sm md:text-base uppercase">{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
