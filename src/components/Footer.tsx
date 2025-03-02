import React from 'react';
import { useAppContext } from '../context/AppContext';

const Footer: React.FC = () => {
  const { currentLanguage } = useAppContext();

  return (
    <footer className="footer footer-center p-4 bg-base-300 text-base-content">
      <div>
        <p>
          {currentLanguage === 'EN' 
            ? 'Hector - AI App Builder © 2023' 
            : 'Hector - Construtor de Apps com IA © 2023'}
        </p>
        <p className="text-xs">
          {currentLanguage === 'EN'
            ? 'Powered by Webdraw SDK'
            : 'Desenvolvido com Webdraw SDK'}
        </p>
      </div>
    </footer>
  );
};

export default Footer; 