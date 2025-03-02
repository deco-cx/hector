import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppConfiguration, RuntimeState, Language, RuntimeStatus } from '../types/app';
import * as WebdrawSDK from '../services/webdraw-sdk';

interface AppContextType {
  apps: string[];
  currentApp: AppConfiguration | null;
  runtimeState: RuntimeState | null;
  currentLanguage: Language;
  loading: boolean;
  error: string | null;
  loadApps: () => Promise<void>;
  loadApp: (appId: string) => Promise<void>;
  createApp: (app: AppConfiguration) => Promise<boolean>;
  updateApp: (app: AppConfiguration) => Promise<boolean>;
  deleteApp: (appId: string) => Promise<boolean>;
  setInputValue: (filename: string, value: any) => void;
  executeActions: () => Promise<void>;
  setLanguage: (language: Language) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

interface AppProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<AppProviderProps> = ({ children }) => {
  const [apps, setApps] = useState<string[]>([]);
  const [currentApp, setCurrentApp] = useState<AppConfiguration | null>(null);
  const [runtimeState, setRuntimeState] = useState<RuntimeState | null>(null);
  const [currentLanguage, setCurrentLanguage] = useState<Language>('EN');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load user's preferred language from localStorage
  useEffect(() => {
    const savedLanguage = localStorage.getItem('hector_language');
    if (savedLanguage && (savedLanguage === 'EN' || savedLanguage === 'PT')) {
      setCurrentLanguage(savedLanguage);
    } else {
      // Default to browser language if available
      const browserLang = navigator.language.startsWith('pt') ? 'PT' : 'EN';
      setCurrentLanguage(browserLang);
      localStorage.setItem('hector_language', browserLang);
    }
  }, []);

  // Load apps list
  const loadApps = async () => {
    setLoading(true);
    setError(null);
    try {
      const appsList = await WebdrawSDK.listApps();
      setApps(appsList);
    } catch (err) {
      setError('Failed to load apps list');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Load a specific app
  const loadApp = async (appId: string) => {
    setLoading(true);
    setError(null);
    try {
      const app = await WebdrawSDK.getApp(appId);
      if (app) {
        setCurrentApp(app);
        
        // Try to load runtime state if it exists
        const state = await WebdrawSDK.getRuntimeState(appId);
        if (state) {
          setRuntimeState(state);
        } else {
          // Initialize a new runtime state
          const newState: RuntimeState = {
            appConfig: app,
            inputValues: {},
            generatedOutputs: {},
            currentLanguage,
            status: 'idle'
          };
          setRuntimeState(newState);
          await WebdrawSDK.saveRuntimeState(appId, newState);
        }
      } else {
        setError(`App with ID ${appId} not found`);
      }
    } catch (err) {
      setError('Failed to load app');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new app
  const createApp = async (app: AppConfiguration) => {
    setLoading(true);
    setError(null);
    try {
      const success = await WebdrawSDK.saveApp(app);
      if (success) {
        await loadApps();
        return true;
      }
      setError('Failed to create app');
      return false;
    } catch (err) {
      setError('Failed to create app');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Update an existing app
  const updateApp = async (app: AppConfiguration) => {
    setLoading(true);
    setError(null);
    try {
      const success = await WebdrawSDK.saveApp(app);
      if (success) {
        setCurrentApp(app);
        return true;
      }
      setError('Failed to update app');
      return false;
    } catch (err) {
      setError('Failed to update app');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Delete an app
  const deleteApp = async (appId: string) => {
    setLoading(true);
    setError(null);
    try {
      const success = await WebdrawSDK.deleteApp(appId);
      if (success) {
        await loadApps();
        if (currentApp?.id === appId) {
          setCurrentApp(null);
          setRuntimeState(null);
        }
        return true;
      }
      setError('Failed to delete app');
      return false;
    } catch (err) {
      setError('Failed to delete app');
      console.error(err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  // Set input value in runtime state
  const setInputValue = (filename: string, value: any) => {
    if (!runtimeState || !currentApp) return;
    
    const updatedState = {
      ...runtimeState,
      inputValues: {
        ...runtimeState.inputValues,
        [filename]: value
      }
    };
    
    setRuntimeState(updatedState);
    WebdrawSDK.saveRuntimeState(currentApp.id, updatedState);
  };

  // Execute actions
  const executeActions = async () => {
    if (!runtimeState || !currentApp) return;
    
    setRuntimeState({
      ...runtimeState,
      status: 'generating',
      error: undefined
    });
    
    try {
      const updatedState = { ...runtimeState };
      updatedState.status = 'generating';
      
      // Execute each action in sequence
      for (const action of currentApp.actions) {
        // Process the prompt by replacing variables
        let prompt = action.prompt[currentLanguage];
        
        // Replace input variables (@filename.md)
        const inputVarRegex = /@([a-zA-Z0-9_]+\.[a-zA-Z0-9]+)/g;
        prompt = prompt.replace(inputVarRegex, (match, filename) => {
          const value = updatedState.inputValues[filename];
          return value !== undefined ? value : match;
        });
        
        // Execute the action based on its type
        try {
          let result;
          switch (action.type) {
            case 'Gerar Texto':
              result = await WebdrawSDK.generateText(prompt, action.model);
              break;
            case 'Gerar Imagem':
              result = await WebdrawSDK.generateImage(prompt, action.model);
              break;
            case 'Gerar Aúdio':
              result = await WebdrawSDK.generateAudio(prompt, action.model);
              break;
            case 'Gerar JSON':
              // For JSON generation, we need a schema
              const schema = {
                type: 'object',
                properties: action.parameters?.schema?.properties || {}
              };
              result = await WebdrawSDK.generateObject(prompt, schema);
              break;
            default:
              throw new Error(`Unsupported action type: ${action.type}`);
          }
          
          // Store the result
          updatedState.generatedOutputs[action.output_filename] = result;
        } catch (error: any) {
          console.error(`Error executing action ${action.type}:`, error);
          updatedState.status = 'error';
          updatedState.error = `Error executing ${action.type}: ${error.message || 'Unknown error'}`;
          setRuntimeState(updatedState);
          await WebdrawSDK.saveRuntimeState(currentApp.id, updatedState);
          return;
        }
      }
      
      // All actions completed successfully
      updatedState.status = 'complete';
      setRuntimeState(updatedState);
      await WebdrawSDK.saveRuntimeState(currentApp.id, updatedState);
    } catch (error: any) {
      const updatedState = {
        ...runtimeState,
        status: 'error' as RuntimeStatus,
        error: `Error executing actions: ${error.message || 'Unknown error'}`
      };
      setRuntimeState(updatedState);
      await WebdrawSDK.saveRuntimeState(currentApp.id, updatedState);
    }
  };

  // Set language preference
  const setLanguage = (language: Language) => {
    setCurrentLanguage(language);
    localStorage.setItem('hector_language', language);
    
    // Update runtime state if it exists
    if (runtimeState) {
      const updatedState = {
        ...runtimeState,
        currentLanguage: language
      };
      setRuntimeState(updatedState);
      if (currentApp) {
        WebdrawSDK.saveRuntimeState(currentApp.id, updatedState);
      }
    }
  };

  const value = {
    apps,
    currentApp,
    runtimeState,
    currentLanguage,
    loading,
    error,
    loadApps,
    loadApp,
    createApp,
    updateApp,
    deleteApp,
    setInputValue,
    executeActions,
    setLanguage
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}; 