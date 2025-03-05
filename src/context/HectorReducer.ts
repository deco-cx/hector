import { WebdrawSDK, AppConfig, InputField, ActionData, OutputTemplate, DEFAULT_LANGUAGE, AVAILABLE_LANGUAGES, Localizable } from '../types/types';
import { HectorService } from '../services/HectorService';
import { getLocalizedValue } from '../types/types';

// State structure
export interface HectorState {
  // Core SDK and service-related state
  user: { username: string } | null;
  isLoading: boolean;
  error: Error | null;
  isSDKAvailable: boolean;
  reloadCounter: number;

  // App data and loading states
  appConfig: AppConfig | null;
  appLoading: boolean;
  appSaving: boolean;
  lastSaved: Date | null;
  
  // Specific loading states for parts of the app
  inputsLoading: boolean;
  actionsLoading: boolean;
  outputsLoading: boolean;
  
  // Active tab in the editor
  activeTab: string;

  // SDK reference
  sdk: WebdrawSDK | null;
}

// Initial state
export const initialState: HectorState = {
  user: null,
  isLoading: true,
  error: null,
  isSDKAvailable: false,
  reloadCounter: 0,
  
  appConfig: null,
  appLoading: false,
  appSaving: false,
  lastSaved: null,
  
  inputsLoading: false,
  actionsLoading: false,
  outputsLoading: false,
  
  activeTab: 'style',

  // SDK reference
  sdk: null
};

// Action types
export enum ActionType {
  // Core SDK and user actions
  SET_USER = 'SET_USER',
  SET_LOADING = 'SET_LOADING',
  SET_ERROR = 'SET_ERROR',
  SET_SDK_AVAILABLE = 'SET_SDK_AVAILABLE',
  INCREMENT_RELOAD_COUNTER = 'INCREMENT_RELOAD_COUNTER',
  
  // App config actions
  SET_APP_CONFIG = 'SET_APP_CONFIG',
  SET_APP_LOADING = 'SET_APP_LOADING',
  SET_APP_SAVING = 'SET_APP_SAVING',
  SET_LAST_SAVED = 'SET_LAST_SAVED',
  UPDATE_APP_LANGUAGE = 'UPDATE_APP_LANGUAGE',
  
  // Input field actions
  ADD_INPUT = 'ADD_INPUT',
  UPDATE_INPUT = 'UPDATE_INPUT',
  REMOVE_INPUT = 'REMOVE_INPUT',
  SET_INPUTS_LOADING = 'SET_INPUTS_LOADING',
  
  // Action data actions
  ADD_ACTION = 'ADD_ACTION',
  UPDATE_ACTION = 'UPDATE_ACTION',
  REMOVE_ACTION = 'REMOVE_ACTION',
  SET_ACTIONS_LOADING = 'SET_ACTIONS_LOADING',
  
  // Output template actions
  ADD_OUTPUT = 'ADD_OUTPUT',
  UPDATE_OUTPUT = 'UPDATE_OUTPUT',
  REMOVE_OUTPUT = 'REMOVE_OUTPUT',
  SET_OUTPUTS_LOADING = 'SET_OUTPUTS_LOADING',
  
  // UI state actions
  SET_ACTIVE_TAB = 'SET_ACTIVE_TAB',

  // SDK action
  SET_SDK = 'SET_SDK'
}

// Define action interfaces
interface SetUserAction {
  type: ActionType.SET_USER;
  payload: { username: string } | null;
}

interface SetLoadingAction {
  type: ActionType.SET_LOADING;
  payload: boolean;
}

interface SetErrorAction {
  type: ActionType.SET_ERROR;
  payload: Error | null;
}

interface SetSDKAvailableAction {
  type: ActionType.SET_SDK_AVAILABLE;
  payload: boolean;
}

interface IncrementReloadCounterAction {
  type: ActionType.INCREMENT_RELOAD_COUNTER;
}

interface SetAppConfigAction {
  type: ActionType.SET_APP_CONFIG;
  payload: AppConfig | null;
}

interface SetAppLoadingAction {
  type: ActionType.SET_APP_LOADING;
  payload: boolean;
}

interface SetAppSavingAction {
  type: ActionType.SET_APP_SAVING;
  payload: boolean;
}

interface SetLastSavedAction {
  type: ActionType.SET_LAST_SAVED;
  payload: Date | null;
}

interface UpdateAppLanguageAction {
  type: ActionType.UPDATE_APP_LANGUAGE;
  payload: string;
}

interface AddInputAction {
  type: ActionType.ADD_INPUT;
  payload: InputField;
}

interface UpdateInputAction {
  type: ActionType.UPDATE_INPUT;
  payload: { index: number; input: InputField };
}

interface RemoveInputAction {
  type: ActionType.REMOVE_INPUT;
  payload: number;
}

interface SetInputsLoadingAction {
  type: ActionType.SET_INPUTS_LOADING;
  payload: boolean;
}

interface AddActionAction {
  type: ActionType.ADD_ACTION;
  payload: ActionData;
}

interface UpdateActionAction {
  type: ActionType.UPDATE_ACTION;
  payload: { index: number; action: ActionData };
}

interface RemoveActionAction {
  type: ActionType.REMOVE_ACTION;
  payload: number;
}

interface SetActionsLoadingAction {
  type: ActionType.SET_ACTIONS_LOADING;
  payload: boolean;
}

interface AddOutputAction {
  type: ActionType.ADD_OUTPUT;
  payload: OutputTemplate;
}

interface UpdateOutputAction {
  type: ActionType.UPDATE_OUTPUT;
  payload: { index: number; output: OutputTemplate };
}

interface RemoveOutputAction {
  type: ActionType.REMOVE_OUTPUT;
  payload: number;
}

interface SetOutputsLoadingAction {
  type: ActionType.SET_OUTPUTS_LOADING;
  payload: boolean;
}

interface SetActiveTabAction {
  type: ActionType.SET_ACTIVE_TAB;
  payload: string;
}

interface SetSDKAction {
  type: ActionType.SET_SDK;
  payload: WebdrawSDK | null;
}

export type HectorAction =
  | SetUserAction
  | SetLoadingAction
  | SetErrorAction
  | SetSDKAvailableAction
  | IncrementReloadCounterAction
  | SetAppConfigAction
  | SetAppLoadingAction
  | SetAppSavingAction
  | SetLastSavedAction
  | UpdateAppLanguageAction
  | AddInputAction
  | UpdateInputAction
  | RemoveInputAction
  | SetInputsLoadingAction
  | AddActionAction
  | UpdateActionAction
  | RemoveActionAction
  | SetActionsLoadingAction
  | AddOutputAction
  | UpdateOutputAction
  | RemoveOutputAction
  | SetOutputsLoadingAction
  | SetActiveTabAction
  | SetSDKAction;

// Reducer function
export function hectorReducer(
  state: HectorState,
  action: HectorAction
): HectorState {
  switch (action.type) {
    // Core SDK and user actions
    case ActionType.SET_USER:
      return { ...state, user: action.payload };
    
    case ActionType.SET_LOADING:
      return { ...state, isLoading: action.payload };
    
    case ActionType.SET_ERROR:
      return { ...state, error: action.payload };
    
    case ActionType.SET_SDK_AVAILABLE:
      return { ...state, isSDKAvailable: action.payload };
    
    case ActionType.INCREMENT_RELOAD_COUNTER:
      return { ...state, reloadCounter: state.reloadCounter + 1 };
    
    // App config actions
    case ActionType.SET_APP_CONFIG:
      return { ...state, appConfig: action.payload };
    
    case ActionType.SET_APP_LOADING:
      return { ...state, appLoading: action.payload };
    
    case ActionType.SET_APP_SAVING:
      return { ...state, appSaving: action.payload };
    
    case ActionType.SET_LAST_SAVED:
      return { ...state, lastSaved: action.payload };
      
    case ActionType.UPDATE_APP_LANGUAGE:
      if (!state.appConfig) {
        return state;
      }
      return {
        ...state,
        appConfig: {
          ...state.appConfig,
          selectedLanguage: action.payload
        }
      };
    
    // Input field actions
    case ActionType.ADD_INPUT:
      if (!state.appConfig) {
        return state;
      }
      
      // Process the input to ensure required field is properly set
      const newInput = { ...action.payload };
      
      // Ensure required is properly set as boolean
      if (newInput.required !== undefined) {
        newInput.required = newInput.required === true || String(newInput.required) === 'true';
      }
      
      // Generate filename from title if it exists
      if (newInput.title) {
        const displayTitle = getLocalizedValue(newInput.title, DEFAULT_LANGUAGE) || '';
        if (displayTitle && (!newInput.filename || newInput.filename === '')) {
          newInput.filename = generateFilenameFromTitle(displayTitle, newInput.type);
        }
      }
      
      return {
        ...state,
        appConfig: {
          ...state.appConfig,
          inputs: [...state.appConfig.inputs, newInput]
        }
      };
    
    case ActionType.UPDATE_INPUT:
      if (!state.appConfig) {
        return state;
      }
      
      // Process the input to ensure filename is generated correctly
      const updatedInput = { ...action.payload.input };
      
      // Generate filename from title on every keystroke if title exists
      if (updatedInput.title) {
        const displayTitle = getLocalizedValue(updatedInput.title, DEFAULT_LANGUAGE) || '';
        
        if (displayTitle) {
          const baseFilename = generateFilenameFromTitle(displayTitle, updatedInput.type);
          
          updatedInput.filename = baseFilename;
        }
      }
      
      // Ensure required is properly set as boolean
      if (updatedInput.required !== undefined) {
        updatedInput.required = updatedInput.required === true || String(updatedInput.required) === 'true';
      }
      
      return {
        ...state,
        appConfig: {
          ...state.appConfig,
          inputs: state.appConfig.inputs.map((input, index) =>
            index === action.payload.index ? updatedInput : input
          )
        }
      };
    
    case ActionType.REMOVE_INPUT:
      if (!state.appConfig) {
        return state;
      }
      return {
        ...state,
        appConfig: {
          ...state.appConfig,
          inputs: state.appConfig.inputs.filter((_, index) => index !== action.payload)
        }
      };
    
    case ActionType.SET_INPUTS_LOADING:
      return { ...state, inputsLoading: action.payload };
    
    // Action data actions
    case ActionType.ADD_ACTION:
      if (!state.appConfig) {
        return state;
      }
      return {
        ...state,
        appConfig: {
          ...state.appConfig,
          actions: [...state.appConfig.actions, action.payload]
        }
      };
    
    case ActionType.UPDATE_ACTION:
      if (!state.appConfig) {
        return state;
      }
      return {
        ...state,
        appConfig: {
          ...state.appConfig,
          actions: state.appConfig.actions.map((actionItem, index) =>
            index === action.payload.index ? action.payload.action : actionItem
          )
        }
      };
    
    case ActionType.REMOVE_ACTION:
      if (!state.appConfig) {
        return state;
      }
      return {
        ...state,
        appConfig: {
          ...state.appConfig,
          actions: state.appConfig.actions.filter((_, index) => index !== action.payload)
        }
      };
    
    case ActionType.SET_ACTIONS_LOADING:
      return { ...state, actionsLoading: action.payload };
    
    // Output template actions
    case ActionType.ADD_OUTPUT:
      if (!state.appConfig) {
        return state;
      }
      return {
        ...state,
        appConfig: {
          ...state.appConfig,
          output: [...state.appConfig.output, action.payload]
        }
      };
    
    case ActionType.UPDATE_OUTPUT:
      if (!state.appConfig) {
        return state;
      }
      return {
        ...state,
        appConfig: {
          ...state.appConfig,
          output: state.appConfig.output.map((output, index) =>
            index === action.payload.index ? action.payload.output : output
          )
        }
      };
    
    case ActionType.REMOVE_OUTPUT:
      if (!state.appConfig) {
        return state;
      }
      return {
        ...state,
        appConfig: {
          ...state.appConfig,
          output: state.appConfig.output.filter((_, index) => index !== action.payload)
        }
      };
    
    case ActionType.SET_OUTPUTS_LOADING:
      return { ...state, outputsLoading: action.payload };
    
    // UI state actions
    case ActionType.SET_ACTIVE_TAB:
      return { ...state, activeTab: action.payload };
    
    // SDK action
    case ActionType.SET_SDK:
      return { ...state, sdk: action.payload };
      
    default:
      return state;
  }
}

/**
 * Generates a filename from a title based on the input type
 * @param title The display title to convert to a filename
 * @param type The input field type
 * @returns A formatted filename with appropriate extension
 */
function generateFilenameFromTitle(title: string, type: string): string {
  if (!title) return '';
  
  const baseFilename = title
    .toLowerCase()
    .replace(/\s+/g, '_')       // Replace spaces with underscores
    .replace(/[^a-z0-9_]/g, '') // Keep only alphanumeric and underscores
    .slice(0, 30);              // Limit length to 30 chars
  
  // Add appropriate file extension based on input type
  let extension = '';
  switch (type) {
    case 'text':
      extension = '.md';
      break;
    case 'image':
      extension = '.png';
      break;
    case 'audio':
      extension = '.mp3';
      break;
    case 'file':
      extension = '.txt';
      break;
    case 'select':
      extension = '.txt';
      break;
    default:
      extension = '.txt';
  }
  
  return baseFilename + extension;
} 