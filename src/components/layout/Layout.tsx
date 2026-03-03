import { Outlet } from 'react-router-dom';
import Header from './Header';
import { useLanguage } from '@/contexts/LanguageContext';
import { Send } from 'lucide-react';

interface LayoutProps {
  onSearch: (query: string) => void;
  searchQuery: string;
}

const Layout = ({ onSearch, searchQuery }: LayoutProps) => {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background flex flex-col relative">
      {/* Ambient background orbs */}
      <div className="orb w-96 h-96 bg-primary/5 top-0 -left-48" />
      <div className="orb w-72 h-72 bg-live/5 top-1/3 -right-36" style={{ animationDelay: '3s' }} />
      <div className="orb w-64 h-64 bg-upcoming/5 bottom-0 left-1/3" style={{ animationDelay: '5s' }} />

      <Header onSearch={onSearch} searchQuery={searchQuery} />
      <main className="container mx-auto px-4 py-8 flex-1 relative z-10">
        <Outlet />
      </main>
      <footer className="border-t border-border/50 py-8 mt-auto bg-card/30 backdrop-blur-sm relative z-10">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">{t('footerRights')}</p>
              <p className="text-xs text-muted-foreground/70 mt-1">{t('footerDesc')}</p>
            </div>
            <a
              href="https://t.me/itachiXCoder"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#0088cc]/10 text-[#0088cc] hover:bg-[#0088cc]/20 transition-all duration-300 text-sm font-medium border border-[#0088cc]/20 hover:scale-105 hover:shadow-lg hover:shadow-[#0088cc]/10"
            >
              <Send className="w-4 h-4" />
              <span>@itachiXCoder</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
