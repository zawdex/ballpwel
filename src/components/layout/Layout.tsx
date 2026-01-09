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
    <div className="min-h-screen bg-background flex flex-col">
      <Header onSearch={onSearch} searchQuery={searchQuery} />
      <main className="container mx-auto px-4 py-6 flex-1">
        <Outlet />
      </main>
      <footer className="border-t border-border py-6 mt-auto bg-card/50">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">{t('footerRights')}</p>
              <p className="text-xs text-muted-foreground mt-1">{t('footerDesc')}</p>
            </div>
            <a
              href="https://t.me/itachiXCoder"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0088cc]/20 text-[#0088cc] hover:bg-[#0088cc]/30 transition-all text-sm font-medium border border-[#0088cc]/30 hover:scale-105"
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
