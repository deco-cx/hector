import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ActionData, InputField } from '../../types/types';
import { ExecutionContext } from './ExecutionContext';

/**
 * Runtime mode types
 */
export type RuntimeMode = 'config' | 'runtime';

/**
 * Interface for the RuntimeContext value
 */
export interface RuntimeContextValue {
  executionContext: ExecutionContext;
  isRuntimeMode: boolean;
  setRuntimeMode: (isRuntime: boolean) => void;
  sdk: any; // Replace with actual SDK type when available
  appName: string;
  inputs: InputField[];
  actions: ActionData[];
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
export const RuntimeProvider: React.FC<RuntimeProviderProps> = ({ 
  children, 
  sdk, 
  appName, 
  inputs, 
  actions 
}) => {
  const [executionContext] = useState(() => new ExecutionContext());
  const [isRuntimeMode, setIsRuntimeMode] = useState(false);
  
  // Load current execution state from config if available
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        await executionContext.loadCurrentExecution(sdk, appName);
      } catch (error) {
        console.error('Failed to load execution state:', error);
      }
    };
    
    loadInitialState();
  }, [executionContext, sdk, appName]);
  
  // Initialize dependencies when actions change
  useEffect(() => {
    if (actions && actions.length > 0) {
      executionContext.buildDependencyGraph(actions);
    }
  }, [executionContext, actions]);
  
  // Save execution state to config when it changes
  const setRuntimeMode = useCallback((isRuntime: boolean) => {
    setIsRuntimeMode(isRuntime);
    
    // If switching to configuration mode, save the current state
    if (!isRuntime) {
      executionContext.saveExecutionState(sdk);
    }
  }, [executionContext, sdk]);
  
  // Subscribe to execution context changes
  useEffect(() => {
    const saveExecutionState = async () => {
      await executionContext.saveExecutionState(sdk);
    };
    
    // Subscribe to changes
    executionContext.subscribe(saveExecutionState);
    
    // Clean up subscription
    return () => {
      executionContext.unsubscribe(saveExecutionState);
    };
  }, [executionContext, sdk]);
  
  const contextValue: RuntimeContextValue = {
    executionContext,
    isRuntimeMode,
    setRuntimeMode,
    sdk,
    appName,
    inputs,
    actions
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
export const useRuntime = (): RuntimeContextValue => {
  const context = useContext(RuntimeContext);
  
  if (!context) {
    throw new Error('useRuntime must be used within a RuntimeProvider');
  }
  
  return context;
}; 