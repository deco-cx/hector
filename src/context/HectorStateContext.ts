import { createContext, useContext } from 'react';
import { HectorState } from './HectorReducer';
import { HectorService } from '../services/HectorService';
import { WebdrawSDK } from '../types/types';

// Extended state that includes service and SDK references
export interface HectorStateWithRefs extends HectorState {
  service: HectorService;
  sdk: WebdrawSDK;
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