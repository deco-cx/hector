import React, { createContext, useContext, useReducer, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { HectorService } from '../services/HectorService';
import { WebdrawSDK, DEFAULT_LANGUAGE, AVAILABLE_LANGUAGES, STORAGE_KEYS, AppConfig } from '../types/types';
import { hectorReducer, initialState, ActionType } from './HectorReducer';
import { HectorStateContext } from './HectorStateContext';
import { HectorDispatchContext } from './HectorDispatchContext';

/**
 * Type definition for the Hector context with additional methods
 */
export interface HectorContextType {
  // Core state
  user: { username: string } | null;
  isLoading: boolean;
  error: Error | null;
  isSDKAvailable: boolean;
  appConfig: AppConfig | null;
  service: HectorService;
  sdk: WebdrawSDK | null;
  // Additional methods
  reloadSDK: () => void;
  navigateToLanguageSettings: () => void;
}

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
  const [state, dispatch] = useReducer(hectorReducer, initialState);
  
  // Get service instance
  const hectorService = HectorService.getInstance();
  const sdk = hectorService.getSDK();
  
  // Initialize the SDK in state
  useEffect(() => {
    if (sdk) {
      dispatch({ type: ActionType.SET_SDK, payload: sdk });
    }
  }, [sdk]);

  /**
   * Reload SDK function
   */
  const reloadSDK = useCallback(() => {
    dispatch({ type: ActionType.INCREMENT_RELOAD_COUNTER });
  }, []);
  
  // Check SDK availability when reload counter changes
  useEffect(() => {
    const checkSDKAvailability = async () => {
      try {
        dispatch({ type: ActionType.SET_LOADING, payload: true });
        dispatch({ type: ActionType.SET_SDK_AVAILABLE, payload: Boolean(sdk) });
        
        // Only try to load user if SDK is available
        if (sdk) {
          await loadUser();
        }
      } catch (error) {
        dispatch({ 
          type: ActionType.SET_ERROR, 
          payload: error instanceof Error ? error : new Error(String(error)) 
        });
        dispatch({ type: ActionType.SET_SDK_AVAILABLE, payload: false });
      } finally {
        dispatch({ type: ActionType.SET_LOADING, payload: false });
      }
    };
    
    checkSDKAvailability();
  }, [sdk, state.reloadCounter]);
  
  /**
   * Initialize language settings from browser or localStorage
   */
  // Removed problematic useEffect that was causing infinite loops
  
  // Save language preference when it changes
  useEffect(() => {
    if (!state.appConfig?.selectedLanguage) return;
    
    localStorage.setItem(STORAGE_KEYS.PREFERRED_LANGUAGE, state.appConfig.selectedLanguage);
    
    // Update URL parameter without reloading the page
    const url = new URL(window.location.href);
    url.searchParams.set('lang', state.appConfig.selectedLanguage);
    window.history.replaceState({}, '', url.toString());
  }, [state.appConfig?.selectedLanguage]);
  
  /**
   * Load user information
   */
  const loadUser = async () => {
    try {
      if (!sdk) {
        dispatch({ type: ActionType.SET_USER, payload: null });
        return;
      }
      
      const user = await sdk.getUser();
      dispatch({ type: ActionType.SET_USER, payload: user });
    } catch (error) {
      dispatch({ 
        type: ActionType.SET_ERROR, 
        payload: error instanceof Error ? error : new Error(String(error)) 
      });
      dispatch({ type: ActionType.SET_USER, payload: null });
    }
  };

  /**
   * Navigation function for language settings
   */
  const navigateToLanguageSettings = () => {
    window.location.href = '/settings/languages';
  };
  
  // Create the context value with service and SDK references
  const contextValue = useMemo(() => ({
    ...state,
    service: hectorService,
    sdk,
    reloadSDK,
    navigateToLanguageSettings
  }), [
    state, 
    hectorService, 
    sdk, 
    reloadSDK, 
    navigateToLanguageSettings
  ]);
  
  // Create state value for HectorStateContext
  const stateValue = useMemo(() => ({
    ...state,
    service: hectorService,
    sdk
  }), [state, hectorService, sdk]);
  
  return (
    <HectorStateContext.Provider value={stateValue}>
      <HectorDispatchContext.Provider value={dispatch}>
        <context.Provider value={contextValue}>
          {children}
        </context.Provider>
      </HectorDispatchContext.Provider>
    </HectorStateContext.Provider>
  );
}

// Context instance
const context = createContext<HectorContextType | null>(null);

/**
 * Hook to use the Hector context
 */
export function useHector(): HectorContextType {
  const ctx = useContext(context);
  if (!ctx) {
    throw new Error('useHector must be used within a HectorProvider');
  }
  return ctx;
}

/**
 * Alias for useHector for better semantics in some contexts
 */
export function useWebdraw(): HectorContextType {
  return useHector();
} 