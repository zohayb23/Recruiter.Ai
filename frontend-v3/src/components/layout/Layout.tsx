import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

interface LayoutProps {
  children: React.ReactNode;
  activePage: string;
  onPageChange: (page: string) => void;
  title: string;
  subtitle?: string;
}

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  activePage, 
  onPageChange, 
  title, 
  subtitle 
}) => {
  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 overflow-hidden">
      {/* Sidebar */}
      <Sidebar activePage={activePage} onPageChange={onPageChange} />
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header title={title} subtitle={subtitle} />
        
        {/* Page Content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar bg-gradient-to-br from-white/80 via-blue-50/50 to-indigo-100/30 backdrop-blur-sm">
          <div className="p-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
