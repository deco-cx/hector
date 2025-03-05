import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { HectorService } from '../services/HectorService';
import { WebdrawSDK } from '../types/types';

/**
 * Context type for accessing Hector services throughout the application
 */
export interface HectorContextType {
  service: HectorService;
  sdk: WebdrawSDK;
  user: { username: string } | null;
  isLoading: boolean;
  error: Error | null;
  isSDKAvailable: boolean;
  reloadSDK: () => void;
}

// Create the context with a default value
export const HectorContext = createContext<HectorContextType | null>(null);

/**
 * Props for the HectorProvider component
 */
interface HectorProviderProps {
  children: ReactNode;
}

/**
 * Provider component that makes Hector service available to any
 * child component that calls useHector().
 */
export function HectorProvider({ children }: HectorProviderProps) {
  const [user, setUser] = useState<{ username: string } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadCounter, setReloadCounter] = useState(0);
  
  // Get service instance
  const hectorService = HectorService.getInstance();
  const sdk = hectorService.getSDK();
  
  // Check if SDK is available
  const isSDKAvailable = Boolean(sdk && sdk.fs && sdk.ai);
  
  // Force reload of SDK
  const reloadSDK = () => {
    setReloadCounter(prev => prev + 1);
  };
  
  // Load user on mount
  useEffect(() => {
    const loadUser = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // Get user info from SDK
        if (isSDKAvailable) {
          const userInfo = await sdk.getUser();
          setUser(userInfo);
        } else {
          setError(new Error('SDK not available'));
        }
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
        console.error('Error loading user:', err);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, [sdk, isSDKAvailable, reloadCounter]);
  
  // Provide the context value
  return (
    <HectorContext.Provider 
      value={{ 
        service: hectorService, 
        sdk, 
        user, 
        isLoading, 
        error, 
        isSDKAvailable,
        reloadSDK
      }}>
      {children}
    </HectorContext.Provider>
  );
}

/**
 * Hook to use the Hector context
 */
export function useHector(): HectorContextType {
  const context = useContext(HectorContext);
  
  if (!context) {
    throw new Error('useHector must be used within a HectorProvider');
  }
  
  return context;
}

/**
 * @deprecated Use useHector instead
 * Legacy hook to maintain compatibility with existing components
 */
export function useWebdraw(): HectorContextType {
  console.warn('useWebdraw is deprecated. Please use useHector instead.');
  return useHector();
} 