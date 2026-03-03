import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Search, Menu, X, Tv, Zap, Calendar, Trophy, Settings } from 'lucide-react';
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
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
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="relative p-2 rounded-xl gradient-pitch transition-all duration-300 group-hover:shadow-lg group-hover:shadow-primary/30 group-hover:scale-110 overflow-hidden">
              {settings.appLogoUrl ? (
                <img src={settings.appLogoUrl} alt="Logo" className="w-5 h-5 object-contain" />
              ) : (
                <Tv className="w-5 h-5 text-primary-foreground" />
              )}
              <div className="absolute inset-0 bg-gradient-to-tr from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
            <span className="font-display text-xl font-bold text-gradient hidden sm:block">
              {settings.appName || t('appName')}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 bg-secondary/50 rounded-2xl p-1 border border-border/50">
            {navLinks.map(({ path, label, icon: Icon }) => (
              <Link
                key={path}
                to={path}
                className={`relative flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-300 ${
                  isActive(path)
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/25'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary/80'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive(path) ? 'scale-110' : ''}`} />
                {label}
              </Link>
            ))}
          </nav>

          {/* Right Section */}
          <div className="hidden sm:flex items-center gap-3">
            <div className={`relative transition-all duration-300 ${searchFocused ? 'w-72' : 'w-48 lg:w-56'}`}>
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors duration-300 ${searchFocused ? 'text-primary' : 'text-muted-foreground'}`} />
              <Input
                type="text"
                placeholder={t('searchTeams')}
                value={searchQuery}
                onChange={(e) => onSearch(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
                className="pl-10 bg-secondary/50 border-border/50 focus:border-primary focus:bg-secondary h-9 rounded-xl transition-all duration-300"
              />
            </div>
            <TelegramLink />
            <LanguageSwitcher />
            <Link to="/admin">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground hover:bg-secondary/80 rounded-xl transition-all duration-300 hover:rotate-90">
                <Settings className="w-5 h-5" />
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-2 md:hidden">
            <LanguageSwitcher />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl"
            >
              <div className="relative w-5 h-5">
                <Menu className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${mobileMenuOpen ? 'opacity-0 rotate-90 scale-50' : 'opacity-100 rotate-0 scale-100'}`} />
                <X className={`w-5 h-5 absolute inset-0 transition-all duration-300 ${mobileMenuOpen ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-50'}`} />
              </div>
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className={`md:hidden overflow-hidden transition-all duration-400 ease-out ${mobileMenuOpen ? 'max-h-80 opacity-100 pb-4' : 'max-h-0 opacity-0'}`}>
          <div className="border-t border-border/50 pt-4">
            <div className="mb-4 flex flex-col gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t('searchTeams')}
                  value={searchQuery}
                  onChange={(e) => onSearch(e.target.value)}
                  className="pl-10 bg-secondary/50 border-border/50 rounded-xl"
                />
              </div>
              <TelegramLink />
            </div>
            <nav className="flex flex-col gap-1">
              {navLinks.map(({ path, label, icon: Icon }) => (
                <Link
                  key={path}
                  to={path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-300 ${
                    isActive(path)
                      ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
