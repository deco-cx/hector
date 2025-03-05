import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { HectorService } from '../services/HectorService';
import { WebdrawSDK, DEFAULT_LANGUAGE, AVAILABLE_LANGUAGES } from '../types/types';

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
  // Language related properties
  selectedLanguage: string;
  setSelectedLanguage: (lang: string) => void;
  editorLanguage: string;
  setEditorLanguage: (lang: string) => void;
  availableLanguages: string[];
  setAvailableLanguages: (languages: string[]) => void;
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
  
  // Language related state
  const [selectedLanguage, setSelectedLanguage] = useState<string>(DEFAULT_LANGUAGE);
  const [editorLanguage, setEditorLanguage] = useState<string>(DEFAULT_LANGUAGE);
  const [availableLanguages, setAvailableLanguages] = useState<string[]>(AVAILABLE_LANGUAGES);
  
  // Get service instance
  const hectorService = HectorService.getInstance();
  const sdk = hectorService.getSDK();
  
  // Check if SDK is available
  const isSDKAvailable = Boolean(sdk && sdk.fs && sdk.ai);
  
  // Force reload of SDK
  const reloadSDK = () => {
    setReloadCounter(prev => prev + 1);
  };
  
  // Initialize language from browser or localStorage on first load
  useEffect(() => {
    // Try to get from local storage first
    const storedLanguage = localStorage.getItem('preferredLanguage');
    
    if (storedLanguage && AVAILABLE_LANGUAGES.includes(storedLanguage)) {
      setSelectedLanguage(storedLanguage);
      setEditorLanguage(storedLanguage);
      return;
    }
    
    // Check URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    
    if (langParam && AVAILABLE_LANGUAGES.includes(langParam)) {
      setSelectedLanguage(langParam);
      setEditorLanguage(langParam);
      return;
    }
    
    // Fall back to browser language if available and supported
    const browserLang = navigator.language;
    
    // Check if the browser language exactly matches one of our available languages
    if (AVAILABLE_LANGUAGES.includes(browserLang)) {
      setSelectedLanguage(browserLang);
      setEditorLanguage(browserLang);
      return;
    }
    
    // Check if just the language part (without region) matches
    const browserLangPrefix = browserLang.split('-')[0].toLowerCase();
    const matchingLang = AVAILABLE_LANGUAGES.find(
      lang => lang.split('-')[0].toLowerCase() === browserLangPrefix
    );
    
    if (matchingLang) {
      setSelectedLanguage(matchingLang);
      setEditorLanguage(matchingLang);
      return;
    }
    
    // Default fallback
    setSelectedLanguage(DEFAULT_LANGUAGE);
    setEditorLanguage(DEFAULT_LANGUAGE);
  }, []);
  
  // Save language preference when it changes
  useEffect(() => {
    localStorage.setItem('preferredLanguage', selectedLanguage);
    
    // Update URL parameter without reloading the page
    const url = new URL(window.location.href);
    url.searchParams.set('lang', selectedLanguage);
    window.history.replaceState({}, '', url.toString());
  }, [selectedLanguage]);
  
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
        reloadSDK,
        // Language related properties
        selectedLanguage,
        setSelectedLanguage,
        editorLanguage,
        setEditorLanguage,
        availableLanguages,
        setAvailableLanguages
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