import { Dispatch, createContext, useContext } from 'react';
import { HectorAction } from './HectorReducer';

// Create the dispatch context
export const HectorDispatchContext = createContext<Dispatch<HectorAction> | null>(null);

// Custom hook to use the dispatch context
export function useHectorDispatch(): Dispatch<HectorAction> {
  const context = useContext(HectorDispatchContext);
  if (!context) {
    throw new Error('useHectorDispatch must be used within a HectorProvider');
  }
  return context;
} 