import React, { useContext } from 'react';
import WebdrawContext from '../services/WebdrawService';

export const useWebdraw = () => {
  const context = useContext(WebdrawContext);
  if (!context) {
    throw new Error('useWebdraw must be used within a WebdrawProvider');
  }
  return context;
}; 