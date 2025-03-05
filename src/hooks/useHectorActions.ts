import { useCallback } from 'react';
import { useHectorDispatch } from '../context/HectorDispatchContext';
import { useHectorState } from '../context/HectorStateContext';
import * as actions from '../context/HectorActions';
import { AppConfig, InputField, ActionData, OutputTemplate } from '../types/types';

/**
 * Custom hook that provides access to all Hector actions
 * Binds the dispatch function to each action creator
 */
export function useHectorActions() {
  const dispatch = useHectorDispatch();
  const { service } = useHectorState();

  // Core SDK and user actions
  const setUser = useCallback(
    (user: { username: string } | null) => actions.setUser(dispatch, user),
    [dispatch]
  );

  const setLoading = useCallback(
    (isLoading: boolean) => actions.setLoading(dispatch, isLoading),
    [dispatch]
  );

  const setError = useCallback(
    (error: Error | null) => actions.setError(dispatch, error),
    [dispatch]
  );

  const setSDKAvailable = useCallback(
    (isAvailable: boolean) => actions.setSDKAvailable(dispatch, isAvailable),
    [dispatch]
  );

  const reloadSDK = useCallback(
    () => actions.reloadSDK(dispatch),
    [dispatch]
  );

  // Language actions
  const updateAppLanguage = useCallback(
    (language: string) => actions.updateAppLanguage(dispatch, language),
    [dispatch]
  );

  const navigateToLanguageSettings = actions.navigateToLanguageSettings;

  // App config actions
  const setAppConfig = useCallback(
    (config: AppConfig | null) => actions.setAppConfig(dispatch, config),
    [dispatch]
  );

  const loadAppConfig = useCallback(
    (appId: string) => actions.loadAppConfig(dispatch, service, appId),
    [dispatch, service]
  );

  const saveAppConfig = useCallback(
    (appConfig: AppConfig) => actions.saveAppConfig(dispatch, service, appConfig),
    [dispatch, service]
  );
  
  const setAppSaving = useCallback(
    (isSaving: boolean) => actions.setAppSaving(dispatch, isSaving),
    [dispatch]
  );

  // Input field actions
  const addInput = useCallback(
    (input: InputField) => actions.addInput(dispatch, input),
    [dispatch]
  );

  const updateInput = useCallback(
    (index: number, input: InputField) => actions.updateInput(dispatch, index, input),
    [dispatch]
  );

  const removeInput = useCallback(
    (index: number) => actions.removeInput(dispatch, index),
    [dispatch]
  );

  // Action data actions
  const addAction = useCallback(
    (action: ActionData) => actions.addAction(dispatch, action),
    [dispatch]
  );

  const updateAction = useCallback(
    (index: number, action: ActionData) => actions.updateAction(dispatch, index, action),
    [dispatch]
  );

  const removeAction = useCallback(
    (index: number) => actions.removeAction(dispatch, index),
    [dispatch]
  );

  // Output template actions
  const addOutput = useCallback(
    (output: OutputTemplate) => actions.addOutput(dispatch, output),
    [dispatch]
  );

  const updateOutput = useCallback(
    (index: number, output: OutputTemplate) => 
      actions.updateOutput(dispatch, index, output),
    [dispatch]
  );

  const removeOutput = useCallback(
    (index: number) => actions.removeOutput(dispatch, index),
    [dispatch]
  );

  // UI state actions
  const setActiveTab = useCallback(
    (tab: string) => actions.setActiveTab(dispatch, tab),
    [dispatch]
  );

  return {
    // Core SDK and user actions
    setUser,
    setLoading,
    setError,
    setSDKAvailable,
    reloadSDK,
    
    // Language actions
    updateAppLanguage,
    navigateToLanguageSettings,
    
    // App config actions
    setAppConfig,
    loadAppConfig,
    saveAppConfig,
    setAppSaving,
    
    // Input field actions
    addInput,
    updateInput,
    removeInput,
    
    // Action data actions
    addAction,
    updateAction,
    removeAction,
    
    // Output template actions
    addOutput,
    updateOutput,
    removeOutput,
    
    // UI state actions
    setActiveTab
  };
} 