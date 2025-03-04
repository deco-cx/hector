import React, { createContext, useContext, ReactNode } from 'react';
import { WebdrawSDK } from '../types/types';
import { WebdrawService } from '../services/webdraw-service';

interface WebdrawContextType {
  sdk: WebdrawSDK;
  service: WebdrawService;
}

const WebdrawContext = createContext<WebdrawContextType | null>(null);

interface WebdrawProviderProps {
  sdk: WebdrawSDK;
  children: ReactNode;
}

export function WebdrawProvider({ sdk, children }: WebdrawProviderProps) {
  const service = new WebdrawService(sdk);

  return (
    <WebdrawContext.Provider value={{ sdk, service }}>
      {children}
    </WebdrawContext.Provider>
  );
}

export function useWebdraw() {
  const context = useContext(WebdrawContext);
  if (!context) {
    throw new Error('useWebdraw must be used within a WebdrawProvider');
  }
  return context;
} 