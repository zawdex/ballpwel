import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Tv, Zap, Calendar, Trophy, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import LanguageSwitcher from '@/components/ui/LanguageSwitcher';
import TelegramLink from '@/components/ui/TelegramLink';

interface HeaderProps {
  onSearch: (query: string) => void;
  searchQuery: string;
}

const Header = ({ onSearch, searchQuery }: HeaderProps) => {
  const [searchFocused, setSearchFocused] = useState(false);
  const location = useLocation();
  const { t } = useLanguage();
  const { settings } = useAppSettings();

  const navLinks = [
    { path: '/', label: t('allMatches'), icon: Trophy },
    { path: '/live', label: t('live'), icon: Zap },
    { path: '/upcoming', label: t('upcoming'), icon: Calendar },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 glass-effect">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-14">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="relative p-1.5 rounded-lg gradient-pitch transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/30 overflow-hidden">
              {settings.appLogoUrl ? (
                <img src={settings.appLogoUrl} alt="Logo" className="w-5 h-5 object-contain" />
              ) : (
                <Tv className="w-5 h-5 text-primary-foreground" />
              )}
            </div>
            <span className="font-display text-lg font-bold text-gradient">
              {settings.appName || t('appName')}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-secondary/50 rounded-xl p-1 border border-border/50">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg font-medium text-sm transition-all duration-200 ${
                  isActive(path)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="flex items-center gap-2">
            <div className={`relative transition-all duration-300 hidden sm:block ${searchFocused ? 'w-64' : 'w-44'}`}>
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${searchFocused ? 'text-primary' : 'text-muted-foreground'}`} />
              <Input
                type="text"
                placeholder={t('searchTeams')}
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="pl-9 bg-secondary/50 border-border/50 focus:border-primary h-8 rounded-lg text-sm"
              />
            </div>
            <TelegramLink />
            <LanguageSwitcher />
            <Link to="/admin" className="hidden sm:block">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground rounded-lg h-8 w-8">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
