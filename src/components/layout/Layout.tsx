import { Outlet, Link, useLocation } from 'react-router-dom';
import Header from './Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Send, Zap, Calendar, Trophy } from 'lucide-react';

interface LayoutProps {
  onSearch: (query: string) => void;
  searchQuery: string;
}

const Layout = ({ onSearch, searchQuery }: LayoutProps) => {
  const { t } = useLanguage();
  const location = useLocation();

  const bottomNavItems = [
    { path: '/', label: t('allMatches'), icon: Trophy },
    { path: '/live', label: t('live'), icon: Zap },
    { path: '/upcoming', label: t('upcoming'), icon: Calendar },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden">
      <Header onSearch={onSearch} searchQuery={searchQuery} />
      <main className="container mx-auto px-4 py-4 md:py-8 flex-1 relative z-10 pb-24 md:pb-8">
        <Outlet />
      </main>

      {/* Footer - desktop only */}
      <footer className="hidden md:block border-t border-border/50 py-6 mt-auto bg-card/30 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{t('footerRights')}</p>
            <a
              href="https://t.me/itachiXCoder"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc]/20 transition-all text-xs font-medium border border-[#0088cc]/20"
            >
              <Send className="w-3.5 h-3.5" />
              @itachiXCoder
            </a>
          </div>
        </div>
      </footer>

      {/* Bottom Navigation - mobile only */}
      <nav className="bottom-nav">
        <div className="flex items-center justify-around py-2 px-4">
          {bottomNavItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all duration-200 min-w-[72px] ${
                isActive(path)
                  ? 'bg-primary/15 text-primary'
                  : 'text-muted-foreground'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive(path) ? 'text-primary' : ''}`} />
              <span className="text-[10px] font-semibold">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Layout;
