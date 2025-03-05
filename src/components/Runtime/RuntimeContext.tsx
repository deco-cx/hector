import React, { createContext, useContext, ReactNode, useState, useCallback } from 'react';
import { ActionData, InputField, WebdrawSDK } from '../../types/types';
import { ExecutionContext } from './ExecutionContext';

/**
 * Runtime context type
 */
interface RuntimeContextType {
  appId: string;
  inputs: InputField[];
  actions: ActionData[];
  executionContext: ExecutionContext;
  sdk: WebdrawSDK;
  executeAction: (action: ActionData) => Promise<any>;
  isActionExecuting: (actionId: string) => boolean;
  resetAction: (actionId: string) => void;
}

// Create the context
const RuntimeContext = createContext<RuntimeContextType | null>(null);

/**
 * Provider props
 */
interface RuntimeProviderProps {
  appId: string;
  inputs: InputField[];
  actions: ActionData[];
  sdk: WebdrawSDK;
  children: ReactNode;
}

/**
 * Provider component for the Runtime context
 */
export function RuntimeProvider({ appId, inputs, actions, sdk, children }: RuntimeProviderProps) {
  // Create the execution context
  const executionContext = new ExecutionContext(appId, inputs, actions);
  // Track executing actions
  const [executingActions, setExecutingActions] = useState<Record<string, boolean>>({});
  
  /**
   * Execute an action using the ExecutionContext
   */
  const executeAction = useCallback(async (action: ActionData) => {
    // Mark action as executing
    setExecutingActions(prev => ({ ...prev, [action.id]: true }));
    
    try {
      // Use the ExecutionContext's built-in executeAction method
      const result = await executionContext.executeAction(action, sdk);
      return result;
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
    // Use the ExecutionContext's built-in resetActionExecution method
    executionContext.resetActionExecution(actionId);
  }, [executionContext]);
  
  return (
    <RuntimeContext.Provider 
      value={{ 
        appId, 
        inputs, 
        actions, 
        executionContext, 
        sdk, 
        executeAction,
        isActionExecuting,
        resetAction
      }}
    >
      {children}
    </RuntimeContext.Provider>
  );
}

/**
 * Hook to use the runtime context
 */
export function useRuntime() {
  const context = useContext(RuntimeContext);
  
  if (!context) {
    throw new Error('useRuntime must be used within a RuntimeProvider');
  }
  
  return context;
} 