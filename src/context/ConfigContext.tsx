import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppConfig } from '../types/types';

interface ConfigContextType {
  config: AppConfig | null;
  loading: boolean;
  error: Error | null;
  updateConfig: (newConfig: AppConfig) => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | null>(null);

interface ConfigProviderProps {
  children: React.ReactNode;
  initialConfig?: AppConfig;
}

/**
 * Provider component for the configuration context
 */
export const ConfigProvider: React.FC<ConfigProviderProps> = ({ 
  children, 
  initialConfig 
}) => {
  const [config, setConfig] = useState<AppConfig | null>(initialConfig || null);
  const [loading, setLoading] = useState<boolean>(!initialConfig);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!initialConfig) {
      // In a real app, we would load the config from a backend or local storage
      setLoading(false);
    }
  }, [initialConfig]);

  const updateConfig = async (newConfig: AppConfig): Promise<void> => {
    try {
      // In a real app, this would save to a backend
      setConfig(newConfig);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      throw err;
    }
  };

  return (
    <ConfigContext.Provider
      value={{
        config,
        loading,
        error,
        updateConfig,
      }}
    >
      {children}
    </ConfigContext.Provider>
  );
};

/**
 * Hook to access the configuration context
 */
export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
}; 