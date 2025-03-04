import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useConfig } from '../../contexts/ConfigContext';
import { ExecutionContext } from './ExecutionContext';
import { ActionData, InputField } from '../../types/types';

/**
 * Runtime context mode
 */
export type RuntimeMode = 'config' | 'test';

/**
 * Interface for the RuntimeContext value
 */
export interface RuntimeContextValue {
  executionContext: ExecutionContext;
  mode: RuntimeMode;
  setMode: (mode: RuntimeMode) => void;
  sdk: any; // Replace with actual SDK type when available
  appName: string;
  inputs: InputField[];
  actions: ActionData[];
  isInitialized: boolean;
  lastSaved: Date | null;
  setLastSaved: (date: Date | null) => void;
  isRuntimeMode: boolean;
  setRuntimeMode: (isRuntime: boolean) => void;
}

// Create the context
const RuntimeContext = createContext<RuntimeContextValue | null>(null);

/**
 * Props for the RuntimeProvider component
 */
interface RuntimeProviderProps {
  children: React.ReactNode;
  sdk: any; // Replace with actual SDK type when available
  appName: string;
  inputs: InputField[];
  actions: ActionData[];
}

/**
 * Provider component for the runtime context
 */
export const RuntimeProvider: React.FC<RuntimeProviderProps> = ({ children, sdk, appName, inputs, actions }) => {
  const { config, updateConfig } = useConfig();
  const [executionContext] = useState(() => new ExecutionContext());
  const [mode, setMode] = useState<RuntimeMode>('config');
  const [isInitialized, setIsInitialized] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isRuntimeMode, setIsRuntimeMode] = useState(false);

  // Load current execution state from config if available
  useEffect(() => {
    if (config?.currentExecution) {
      try {
        executionContext.loadFromState(config.currentExecution);
      } catch (error) {
        console.error('Failed to load execution state:', error);
      }
    }
  }, [config?.currentExecution, executionContext]);

  // Initialize the execution context
  useEffect(() => {
    // Build dependency graph whenever actions change
    executionContext.buildDependencyGraph(actions);
    
    // Initialize execution context with input default values
    inputs.forEach(input => {
      if (input.defaultValue !== undefined && !executionContext.hasValue(input.filename)) {
        executionContext.setValue(input.filename, input.defaultValue);
      }
    });

    // Load current execution state
    const loadExecutionState = async () => {
      try {
        const loaded = await executionContext.loadCurrentExecution(sdk, appName);
        console.log(`Execution state ${loaded ? 'loaded' : 'not found'} for app ${appName}`);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to load execution state:', error);
        setIsInitialized(true);
      }
    };

    loadExecutionState();
  }, [executionContext, sdk, appName, inputs, actions]);

  // Auto-save execution state when values change
  useEffect(() => {
    if (!isInitialized) return;

    const saveState = async () => {
      try {
        await executionContext.saveExecutionState(sdk, appName);
        setLastSaved(new Date());
        console.log('Execution state saved');
      } catch (error) {
        console.error('Failed to auto-save execution state:', error);
      }
    };

    // Debounce save to prevent too many writes
    const saveTimeout = setTimeout(saveState, 1000);
    return () => clearTimeout(saveTimeout);
  }, [executionContext, sdk, appName, isInitialized]);

  // Save execution state to config when it changes
  const setRuntimeMode = useCallback((isRuntime: boolean) => {
    setIsRuntimeMode(isRuntime);
    
    // If switching to configuration mode, save the current state
    if (!isRuntime) {
      const currentState = executionContext.getExecutionState();
      updateConfig({ currentExecution: currentState });
    }
  }, [executionContext, updateConfig]);
  
  // Subscribe to execution context changes
  useEffect(() => {
    const saveExecutionState = () => {
      const currentState = executionContext.getExecutionState();
      updateConfig({ currentExecution: currentState });
    };
    
    // Subscribe to changes
    executionContext.subscribe(saveExecutionState);
    
    // Clean up subscription
    return () => {
      executionContext.unsubscribe(saveExecutionState);
    };
  }, [executionContext, updateConfig]);

  const contextValue: RuntimeContextValue = {
    executionContext,
    mode,
    setMode,
    sdk,
    appName,
    inputs,
    actions,
    isInitialized,
    lastSaved,
    setLastSaved,
    isRuntimeMode,
    setRuntimeMode
  };

  return (
    <RuntimeContext.Provider value={contextValue}>
      {children}
    </RuntimeContext.Provider>
  );
};

/**
 * Hook to access the runtime context
 */
export const useRuntime = () => {
  const context = useContext(RuntimeContext);
  
  if (!context) {
    throw new Error('useRuntime must be used within a RuntimeProvider');
  }
  
  return context;
}; 