import React from 'react';
import { useAppContext } from '../context/AppContext';

interface LoadingProps {
  size?: 'sm' | 'md' | 'lg';
}

const Loading: React.FC<LoadingProps> = ({ size = 'md' }) => {
  const { currentLanguage } = useAppContext();
  
  const sizeClass = {
    sm: 'loading-sm',
    md: 'loading-md',
    lg: 'loading-lg'
  }[size];
  
  return (
    <div className="flex flex-col items-center justify-center p-4">
      <span className={`loading loading-spinner ${sizeClass} text-primary`}></span>
      <p className="mt-2">
        {currentLanguage === 'EN' ? 'Loading...' : 'Carregando...'}
      </p>
    </div>
  );
};

export default Loading; 