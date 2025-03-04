import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { ActionData, InputField } from '../../types/types';
import { ExecutionContext } from './ExecutionContext';

/**
 * Interface for the RuntimeContext value
 */
export interface RuntimeContextValue {
  executionContext: ExecutionContext;
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
  
  // Load current execution state from config if available
  useEffect(() => {
    const loadInitialState = async () => {
      try {
        if (sdk) {
          await executionContext.loadCurrentExecution(sdk, appName);
        } else {
          console.warn('SDK not available for loading execution state');
        }
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
  
  // Save execution state when needed
  const saveExecutionState = useCallback(async () => {
    try {
      if (sdk) {
        await executionContext.saveExecutionState(sdk);
      }
    } catch (error) {
      console.error('Failed to save execution state:', error);
    }
  }, [executionContext, sdk]);
  
  // Create the context value
  const contextValue: RuntimeContextValue = {
    executionContext,
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