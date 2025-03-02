import React, { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import { useAppContext } from '../context/AppContext';
import { ThemeType } from '../types/app';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { currentApp } = useAppContext();
  
  // Map app style to DaisyUI theme
  const getTheme = (): ThemeType => {
    if (!currentApp) return 'light';
    
    switch (currentApp.style.toLowerCase()) {
      case 'minimalistic':
        return 'light';
      case 'cyberpunk':
        return 'cyberpunk';
      case 'classic':
        return 'retro';
      case 'dark':
        return 'night';
      default:
        return 'light';
    }
  };
  
  return (
    <div data-theme={getTheme()} className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto px-4 py-8">
        {children}
      </main>
      <Footer />
    </div>
  );
};

export default Layout; 