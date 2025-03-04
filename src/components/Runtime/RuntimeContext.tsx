import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
// Explicitly import from types.ts to ensure correct interface
import { ActionData, InputField, WebdrawSDK } from '../../types/types';
import { ExecutionContext } from './ExecutionContext';
import { executeAction } from './actionExecutors';

/**
 * Interface for the RuntimeContext value
 */
export interface RuntimeContextValue {
  executionContext: ExecutionContext;
  sdk: WebdrawSDK;
  appName: string;
  inputs: InputField[];
  actions: ActionData[];
  executeAction: (action: ActionData) => Promise<any>;
  isActionExecuting: (actionId: string) => boolean;
  resetAction: (actionId: string) => void;
}

// Create the context
const RuntimeContext = createContext<RuntimeContextValue | null>(null);

/**
 * Props for the RuntimeProvider component
 */
interface RuntimeProviderProps {
  children: React.ReactNode;
  sdk: WebdrawSDK;
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
  // Create the execution context
  const [executionContext] = useState(() => new ExecutionContext());
  // Track executing actions
  const [executingActions, setExecutingActions] = useState<Record<string, boolean>>({});

  // Initialize context with inputs and dependencies
  const loadInitialState = useCallback(async () => {
    try {
      // Load any existing execution state from storage
      await executionContext.loadCurrentExecution(sdk, appName);
    } catch (error) {
      console.error('Error loading execution state:', error);
    }

    // Set initial values from inputs if they don't exist already
    inputs.forEach(input => {
      if (input.defaultValue && !executionContext.hasValue(input.filename)) {
        executionContext.setValue(input.filename, input.defaultValue);
      }
    });
    
    // Build dependency graph
    executionContext.buildDependencyGraph(actions);
  }, [executionContext, inputs, actions, sdk, appName]);
  
  // Execute on mount
  useEffect(() => {
    loadInitialState();
  }, [loadInitialState]);
  
  /**
   * Execute an action
   */
  const handleExecuteAction = useCallback(async (action: ActionData) => {
    if (!executionContext.canExecuteAction(action.id)) {
      throw new Error('Cannot execute action: dependencies not satisfied');
    }
    
    // Mark action as executing
    setExecutingActions(prev => ({ ...prev, [action.id]: true }));

    try {
      // Execute the action
      const result = await executeAction(action, executionContext, sdk);
      
      if (result.success) {
        // Store the result in the execution context
        executionContext.setValue(action.id, result.data);
        return result.data;
      } else {
        throw result.error || new Error('Action execution failed');
      }
    } finally {
      // Clear executing state
      setExecutingActions(prev => ({ ...prev, [action.id]: false }));
    }
  }, [executionContext, sdk]);
  
  /**
   * Check if an action is currently executing
   */
  const isActionExecuting = useCallback((actionId: string) => {
    return !!executingActions[actionId];
  }, [executingActions]);
  
  /**
   * Reset an action's execution state
   */
  const resetAction = useCallback((actionId: string) => {
    executionContext.resetActionExecution(actionId);
  }, [executionContext]);

  // Context value
  const contextValue: RuntimeContextValue = {
    executionContext,
    sdk,
    appName,
    inputs,
    actions,
    executeAction: handleExecuteAction,
    isActionExecuting,
    resetAction
  };
  
  return (
    <RuntimeContext.Provider value={contextValue}>
      {children}
    </RuntimeContext.Provider>
  );
};

/**
 * Hook to use the runtime context
 */
export const useRuntime = (): RuntimeContextValue => {
  const context = useContext(RuntimeContext);
  if (!context) {
    throw new Error('useRuntime must be used within a RuntimeProvider');
  }
  return context;
}; 