import { Outlet } from 'react-router-dom';
import Header from './Header';

interface LayoutProps {
  onSearch: (query: string) => void;
  searchQuery: string;
}

const Layout = ({ onSearch, searchQuery }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Header onSearch={onSearch} searchQuery={searchQuery} />
      <main className="container mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="border-t border-border py-6 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>© 2024 FootStream. All rights reserved.</p>
          <p className="mt-1">Live football streaming platform</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
