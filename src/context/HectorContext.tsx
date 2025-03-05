import React, { createContext, useContext, useReducer, ReactNode, useEffect, useCallback, useMemo } from 'react';
import { HectorService } from '../services/HectorService';
import { WebdrawSDK, DEFAULT_LANGUAGE, AVAILABLE_LANGUAGES, STORAGE_KEYS, AppConfig, ActionData } from '../types/types';
import { hectorReducer, initialState, ActionType } from './HectorReducer';
import { HectorStateContext, useHectorState, HectorStateWithRefs } from './HectorStateContext';
import { HectorDispatchContext, useHectorDispatch } from './HectorDispatchContext';
import * as actions from './HectorActions';

/**
 * Type definition for the Hector context with additional methods
 */
export interface HectorContextType extends HectorStateWithRefs {
  // Additional methods
  reloadSDK: () => void;
  navigateToLanguageSettings: () => void;
  // Runtime methods (migrated from RuntimeContext)
  executeAction: (action: ActionData) => Promise<any>;
  isActionExecuting: (actionId: string) => boolean;
  resetAction: (actionId: string) => void;
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
  
  // Initialize execution context when appConfig changes
  useEffect(() => {
    if (state.appConfig && state.sdk) {
      dispatch({
        type: ActionType.INITIALIZE_EXECUTION_CONTEXT,
        payload: {
          appId: state.appConfig.id,
          inputs: state.appConfig.inputs || [],
          actions: state.appConfig.actions || []
        }
      });
    }
  }, [state.appConfig?.id, state.sdk]);

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
  useEffect(() => {
    if (!state.appConfig) return;
    
    // Try to get from local storage first
    const storedLanguage = localStorage.getItem(STORAGE_KEYS.PREFERRED_LANGUAGE);
    
    if (storedLanguage && state.appConfig.supportedLanguages?.includes(storedLanguage)) {
      dispatch({ type: ActionType.UPDATE_APP_LANGUAGE, payload: storedLanguage });
      return;
    }
    
    // Check URL query parameter
    const urlParams = new URLSearchParams(window.location.search);
    const langParam = urlParams.get('lang');
    
    if (langParam && state.appConfig.supportedLanguages?.includes(langParam)) {
      dispatch({ type: ActionType.UPDATE_APP_LANGUAGE, payload: langParam });
      return;
    }
    
    // Fall back to browser language if available and supported
    const browserLang = navigator.language;
    
    // Check for exact or partial match with supported languages
    if (state.appConfig.supportedLanguages?.includes(browserLang)) {
      dispatch({ type: ActionType.UPDATE_APP_LANGUAGE, payload: browserLang });
      return;
    }
    
    // Check if language prefix matches any supported language
    const browserLangPrefix = browserLang.split('-')[0];
    const matchingLang = state.appConfig.supportedLanguages?.find(
      (lang: string) => lang.split('-')[0] === browserLangPrefix
    );
    
    if (matchingLang) {
      dispatch({ type: ActionType.UPDATE_APP_LANGUAGE, payload: matchingLang });
      return;
    }
    
    // Default fallback
    if (state.appConfig.supportedLanguages?.length) {
      dispatch({ type: ActionType.UPDATE_APP_LANGUAGE, payload: state.appConfig.supportedLanguages[0] });
    }
  }, [state.appConfig]);
  
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
  
  /**
   * Execute an action (migrated from RuntimeContext)
   */
  const executeAction = useCallback(async (action: ActionData) => {
    if (!state.executionContext || !state.sdk) {
      throw new Error('Execution context or SDK not initialized');
    }
    
    // Mark action as executing
    dispatch({ 
      type: ActionType.SET_ACTION_EXECUTING, 
      payload: { actionId: action.id, isExecuting: true } 
    });
    
    try {
      // Use the ExecutionContext's built-in executeAction method
      const result = await state.executionContext.executeAction(action, state.sdk);
      return result;
    } catch (error) {
      // Mark action as failed
      dispatch({
        type: ActionType.MARK_ACTION_FAILED,
        payload: { 
          actionId: action.id, 
          error: error instanceof Error ? error : String(error)
        }
      });
      throw error;
    } finally {
      // Clear executing state
      dispatch({ 
        type: ActionType.SET_ACTION_EXECUTING, 
        payload: { actionId: action.id, isExecuting: false } 
      });
    }
  }, [state.executionContext, state.sdk]);
  
  /**
   * Check if an action is executing (migrated from RuntimeContext)
   */
  const isActionExecuting = useCallback((actionId: string) => {
    return !!state.executingActions[actionId];
  }, [state.executingActions]);
  
  /**
   * Reset an action's execution state (migrated from RuntimeContext)
   */
  const resetAction = useCallback((actionId: string) => {
    dispatch({ type: ActionType.RESET_ACTION, payload: actionId });
  }, []);
  
  // Create the context value with service, SDK references, and runtime methods
  const contextValue = useMemo(() => ({
    ...state,
    service: hectorService,
    sdk,
    executeAction,
    isActionExecuting,
    resetAction
  }), [
    state, 
    hectorService, 
    sdk, 
    executeAction, 
    isActionExecuting, 
    resetAction
  ]);
  
  return (
    <HectorStateContext.Provider value={contextValue}>
      <HectorDispatchContext.Provider value={dispatch}>
        {children}
      </HectorDispatchContext.Provider>
    </HectorStateContext.Provider>
  );
}

/**
 * Hook to use the Hector context
 * This provides a unified interface for components
 */
export function useHector(): HectorContextType {
  const state = useHectorState();
  const dispatch = useHectorDispatch();
  
  const reloadSDK = useCallback(
    () => actions.reloadSDK(dispatch),
    [dispatch]
  );
  
  // Return the extended state with methods
  return {
    ...state,
    reloadSDK,
    navigateToLanguageSettings: actions.navigateToLanguageSettings,
    // Runtime methods
    executeAction: state.executeAction,
    isActionExecuting: state.isActionExecuting,
    resetAction: state.resetAction
  };
}

/**
 * Alias for useHector to maintain backward compatibility
 */
export function useWebdraw(): HectorContextType {
  return useHector();
} 