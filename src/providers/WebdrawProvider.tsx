import React, { createContext, useContext, useEffect, useState } from 'react';
import { WebdrawSDK } from '../types/webdraw';
import { WebdrawService } from '../services/WebdrawService';

interface WebdrawContextType {
  service: WebdrawService | null;
  user: { username: string } | null;
  isLoading: boolean;
  error: Error | null;
}

const WebdrawContext = createContext<WebdrawContextType>({
  service: null,
  user: null,
  isLoading: true,
  error: null,
});

interface WebdrawProviderProps {
  sdk: WebdrawSDK;
  children: React.ReactNode;
}

export function WebdrawProvider({ sdk, children }: WebdrawProviderProps) {
  const [service, setService] = useState<WebdrawService | null>(null);
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const initializeService = async () => {
      try {
        const webdrawService = WebdrawService.initialize(sdk);
        setService(webdrawService);

        const currentUser = await webdrawService.getUser();
        if (!currentUser) {
          sdk.redirectToLogin();
          return;
        }

        setUser(currentUser);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to initialize WebdrawService'));
      } finally {
        setIsLoading(false);
      }
    };

    initializeService();
  }, [sdk]);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!service || !user) {
    return <div>Redirecting to login...</div>;
  }

  return (
    <WebdrawContext.Provider value={{ service, user, isLoading, error }}>
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