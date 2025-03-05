import { createContext, useContext } from 'react';
import { HectorState } from './HectorReducer';
import { HectorService } from '../services/HectorService';
import { WebdrawSDK, ActionData } from '../types/types';

// Extended state that includes service, SDK references and runtime methods
export interface HectorStateWithRefs extends HectorState {
  service: HectorService;
  sdk: WebdrawSDK;
  
  // Runtime methods
  executeAction: (action: ActionData) => Promise<any>;
  isActionExecuting: (actionId: string) => boolean;
  resetAction: (actionId: string) => void;
}

// Create the context with a default value of null
export const HectorStateContext = createContext<HectorStateWithRefs | null>(null);

// Custom hook to use the state context
export function useHectorState(): HectorStateWithRefs {
  const context = useContext(HectorStateContext);
  if (!context) {
    throw new Error('useHectorState must be used within a HectorProvider');
  }
  return context;
} 