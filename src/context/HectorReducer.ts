import { WebdrawSDK, AppConfig, InputField, ActionData, OutputTemplate, DEFAULT_LANGUAGE, AVAILABLE_LANGUAGES } from '../types/types';
import { HectorService } from '../services/HectorService';
import { ExecutionContext } from '../components/Runtime';
import type { ExecutionMetadata } from '../components/Runtime';

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

  // Runtime state (migrated from RuntimeContext)
  sdk: WebdrawSDK | null;
  executionContext: ExecutionContext | null;
  executingActions: Record<string, boolean>;
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

  // Runtime state initialization
  sdk: null,
  executionContext: null,
  executingActions: {}
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

  // Runtime actions (migrated from RuntimeContext)
  SET_SDK = 'SET_SDK',
  INITIALIZE_EXECUTION_CONTEXT = 'INITIALIZE_EXECUTION_CONTEXT',
  SET_ACTION_EXECUTING = 'SET_ACTION_EXECUTING',
  RESET_ACTION = 'RESET_ACTION',
  SET_EXECUTION_VALUE = 'SET_EXECUTION_VALUE',
  UPDATE_EXECUTION_META = 'UPDATE_EXECUTION_META',
  MARK_ACTION_FAILED = 'MARK_ACTION_FAILED'
}

// Action interfaces
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

// Runtime action interfaces
interface SetSDKAction {
  type: ActionType.SET_SDK;
  payload: WebdrawSDK | null;
}

interface InitializeExecutionContextAction {
  type: ActionType.INITIALIZE_EXECUTION_CONTEXT;
  payload: {
    appId: string;
    inputs: InputField[];
    actions: ActionData[];
  };
}

interface SetActionExecutingAction {
  type: ActionType.SET_ACTION_EXECUTING;
  payload: { actionId: string; isExecuting: boolean };
}

interface ResetActionAction {
  type: ActionType.RESET_ACTION;
  payload: string; // actionId
}

interface SetExecutionValueAction {
  type: ActionType.SET_EXECUTION_VALUE;
  payload: { key: string; value: any };
}

interface UpdateExecutionMetaAction {
  type: ActionType.UPDATE_EXECUTION_META;
  payload: { actionId: string; metadata: Partial<ExecutionMetadata> };
}

interface MarkActionFailedAction {
  type: ActionType.MARK_ACTION_FAILED;
  payload: { actionId: string; error: Error | string };
}

// Union type for all actions
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
  // Runtime actions
  | SetSDKAction
  | InitializeExecutionContextAction
  | SetActionExecutingAction
  | ResetActionAction
  | SetExecutionValueAction
  | UpdateExecutionMetaAction
  | MarkActionFailedAction;

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
      return {
        ...state,
        appConfig: {
          ...state.appConfig,
          inputs: [...state.appConfig.inputs, action.payload]
        }
      };
    
    case ActionType.UPDATE_INPUT:
      if (!state.appConfig) {
        return state;
      }
      return {
        ...state,
        appConfig: {
          ...state.appConfig,
          inputs: state.appConfig.inputs.map((input, index) =>
            index === action.payload.index ? action.payload.input : input
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
    
    // Runtime action cases
    case ActionType.SET_SDK:
      return { ...state, sdk: action.payload };
    
    case ActionType.INITIALIZE_EXECUTION_CONTEXT:
      return { 
        ...state, 
        executionContext: new ExecutionContext(
          action.payload.appId,
          action.payload.inputs,
          action.payload.actions
        )
      };
    
    case ActionType.SET_ACTION_EXECUTING:
      return {
        ...state,
        executingActions: {
          ...state.executingActions,
          [action.payload.actionId]: action.payload.isExecuting
        }
      };
    
    case ActionType.RESET_ACTION:
      if (!state.executionContext) return state;
      
      // Call the resetActionExecution method on the executionContext
      state.executionContext.resetActionExecution(action.payload);
      
      // Also update our executingActions state
      const updatedExecutingActions = { ...state.executingActions };
      delete updatedExecutingActions[action.payload];
      
      return {
        ...state,
        executingActions: updatedExecutingActions
      };
    
    case ActionType.SET_EXECUTION_VALUE:
      if (!state.executionContext) return state;
      
      // Call the setValue method on the executionContext
      state.executionContext.setValue(action.payload.key, action.payload.value);
      
      return state;
    
    case ActionType.UPDATE_EXECUTION_META:
      if (!state.executionContext) return state;
      
      // Call the updateExecutionMeta method on the executionContext
      state.executionContext.updateExecutionMeta(
        action.payload.actionId,
        action.payload.metadata
      );
      
      return state;
    
    case ActionType.MARK_ACTION_FAILED:
      if (!state.executionContext) return state;
      
      // Call the markActionFailed method on the executionContext
      state.executionContext.markActionFailed(
        action.payload.actionId,
        action.payload.error
      );
      
      return state;
      
    default:
      return state;
  }
} 