import { Dispatch } from 'react';
import { ActionType, HectorAction } from './HectorReducer';
import { AppConfig, InputField, ActionData, OutputTemplate, WebdrawSDK } from '../types/types';
import { HectorService } from '../services/HectorService';

// Create action creators that correspond to the actions defined in HectorReducer

// Core SDK and user actions
export const setUser = (dispatch: Dispatch<HectorAction>, user: { username: string } | null) => {
  dispatch({ type: ActionType.SET_USER, payload: user });
};

export const setLoading = (dispatch: Dispatch<HectorAction>, isLoading: boolean) => {
  dispatch({ type: ActionType.SET_LOADING, payload: isLoading });
};

export const setError = (dispatch: Dispatch<HectorAction>, error: Error | null) => {
  dispatch({ type: ActionType.SET_ERROR, payload: error });
};

export const setSDKAvailable = (dispatch: Dispatch<HectorAction>, isAvailable: boolean) => {
  dispatch({ type: ActionType.SET_SDK_AVAILABLE, payload: isAvailable });
};

export const reloadSDK = (dispatch: Dispatch<HectorAction>) => {
  dispatch({ type: ActionType.INCREMENT_RELOAD_COUNTER });
};

// Language actions - updated to work with app config
export const updateAppLanguage = (dispatch: Dispatch<HectorAction>, language: string) => {
  dispatch({ type: ActionType.UPDATE_APP_LANGUAGE, payload: language });
};

// Navigation function (implementation depends on routing setup)
export const navigateToLanguageSettings = () => {
  // Use appropriate navigation method for the app
  // This would typically use react-router's useNavigate or similar
  window.location.href = '/settings/languages';
};

// App config actions
export const setAppConfig = (dispatch: Dispatch<HectorAction>, config: AppConfig | null) => {
  dispatch({ type: ActionType.SET_APP_CONFIG, payload: config });
};

export const setAppLoading = (dispatch: Dispatch<HectorAction>, isLoading: boolean) => {
  dispatch({ type: ActionType.SET_APP_LOADING, payload: isLoading });
};

export const setAppSaving = (dispatch: Dispatch<HectorAction>, isSaving: boolean) => {
  dispatch({ type: ActionType.SET_APP_SAVING, payload: isSaving });
};

export const setLastSaved = (dispatch: Dispatch<HectorAction>, date: Date | null) => {
  dispatch({ type: ActionType.SET_LAST_SAVED, payload: date });
};

// Input field actions
export const addInput = (dispatch: Dispatch<HectorAction>, input: InputField) => {
  dispatch({ type: ActionType.ADD_INPUT, payload: input });
};

export const updateInput = (
  dispatch: Dispatch<HectorAction>, 
  index: number, 
  input: InputField
) => {
  dispatch({ type: ActionType.UPDATE_INPUT, payload: { index, input } });
};

export const removeInput = (dispatch: Dispatch<HectorAction>, index: number) => {
  dispatch({ type: ActionType.REMOVE_INPUT, payload: index });
};

export const setInputsLoading = (dispatch: Dispatch<HectorAction>, isLoading: boolean) => {
  dispatch({ type: ActionType.SET_INPUTS_LOADING, payload: isLoading });
};

// Action data actions
export const addAction = (dispatch: Dispatch<HectorAction>, action: ActionData) => {
  dispatch({ type: ActionType.ADD_ACTION, payload: action });
};

export const updateAction = (
  dispatch: Dispatch<HectorAction>,
  index: number,
  action: ActionData
) => {
  dispatch({ 
    type: ActionType.UPDATE_ACTION, 
    payload: { index, action } 
  });
};

export const removeAction = (dispatch: Dispatch<HectorAction>, index: number) => {
  dispatch({ type: ActionType.REMOVE_ACTION, payload: index });
};

export const setActionsLoading = (dispatch: Dispatch<HectorAction>, isLoading: boolean) => {
  dispatch({ type: ActionType.SET_ACTIONS_LOADING, payload: isLoading });
};

// Output template actions
export const addOutput = (dispatch: Dispatch<HectorAction>, output: OutputTemplate) => {
  dispatch({ type: ActionType.ADD_OUTPUT, payload: output });
};

export const updateOutput = (
  dispatch: Dispatch<HectorAction>,
  index: number,
  output: OutputTemplate
) => {
  dispatch({ 
    type: ActionType.UPDATE_OUTPUT, 
    payload: { index, output } 
  });
};

export const removeOutput = (dispatch: Dispatch<HectorAction>, index: number) => {
  dispatch({ type: ActionType.REMOVE_OUTPUT, payload: index });
};

export const setOutputsLoading = (dispatch: Dispatch<HectorAction>, isLoading: boolean) => {
  dispatch({ type: ActionType.SET_OUTPUTS_LOADING, payload: isLoading });
};

// UI state actions
export const setActiveTab = (dispatch: Dispatch<HectorAction>, tab: string) => {
  dispatch({ type: ActionType.SET_ACTIVE_TAB, payload: tab });
};

// Complex operations that combine multiple actions
export const loadAppConfig = async (
  dispatch: Dispatch<HectorAction>,
  service: HectorService,
  appId: string
) => {
  try {
    dispatch({ type: ActionType.SET_APP_LOADING, payload: true });
    dispatch({ type: ActionType.SET_ERROR, payload: null });
    
    // Use the actual method from HectorService
    const appData = await service.getApp(appId);
    
    dispatch({ type: ActionType.SET_APP_CONFIG, payload: appData });
    
    // If app has supported languages, use UPDATE_APP_LANGUAGE for the first language
    if (appData?.supportedLanguages && Array.isArray(appData.supportedLanguages) && appData.supportedLanguages.length > 0) {
      dispatch({ 
        type: ActionType.UPDATE_APP_LANGUAGE, 
        payload: appData.supportedLanguages[0]
      });
    }
    
    return appData;
  } catch (error) {
    dispatch({ 
      type: ActionType.SET_ERROR, 
      payload: error instanceof Error ? error : new Error(String(error)) 
    });
    return null;
  } finally {
    dispatch({ type: ActionType.SET_APP_LOADING, payload: false });
  }
};

export const saveAppConfig = async (
  dispatch: Dispatch<HectorAction>,
  service: HectorService,
  appConfig: AppConfig
) => {
  try {
    dispatch({ type: ActionType.SET_APP_SAVING, payload: true });
    dispatch({ type: ActionType.SET_ERROR, payload: null });
    
    // Use the actual method from HectorService
    await service.saveApp(appConfig);
    
    const now = new Date();
    dispatch({ type: ActionType.SET_LAST_SAVED, payload: now });
    
    return true;
  } catch (error) {
    dispatch({ 
      type: ActionType.SET_ERROR, 
      payload: error instanceof Error ? error : new Error(String(error)) 
    });
    return false;
  } finally {
    dispatch({ type: ActionType.SET_APP_SAVING, payload: false });
  }
};

// SDK action
export const setSDK = (dispatch: Dispatch<HectorAction>, sdk: WebdrawSDK | null) => {
  dispatch({ type: ActionType.SET_SDK, payload: sdk });
}; 