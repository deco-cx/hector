import { ActionData, InputField, WebdrawSDK } from '../../types/types';
import { extractInputReferences, buildDependencyGraph } from './actionExecutor';
import { WebdrawService } from '../../services/WebdrawService';

/**
 * Metadata for an action execution
 */
export interface ExecutionMetadata {
  executedAt?: string;
  status?: 'idle' | 'success' | 'error';
  error?: Error | string;
  duration?: number;
  attempts?: number;
}

/**
 * Status information for an action
 */
export interface ActionStatus {
  playable: boolean;
  executed: boolean;
  executedAt?: string;
  status?: 'idle' | 'success' | 'error';
  error?: Error | string;
  attempts?: number;
  missingDependencies?: string[];
  hasCircularDependency?: { 
    cycle: string[];
    message: string;
  };
}

/**
 * Represents a circular dependency
 */
export interface CircularDependency {
  cycle: string[];
  message: string;
}

/**
 * Serializable execution state
 */
export interface ExecutionState {
  values: Record<string, any>;
  executionMeta: Record<string, ExecutionMetadata>;
  timestamp: string;
}

/**
 * WebDraw SDK interface for file operations
 */
interface WebDrawSDKFS {
  chmod: (filepath: string, mode: number) => Promise<void>;
  exists: (filepath: string) => Promise<boolean>;
  write: (filepath: string, text: string, options?: any) => Promise<void>;
  read: (filepath: string, options?: any) => Promise<string | Uint8Array>;
  readFile: (filepath: string, options?: any) => Promise<string | Uint8Array>;
  mkdir: (filepath: string, options?: { recursive?: boolean; mode?: number }) => Promise<void>;
}

/**
 * Class for managing the execution state, dependencies, and results
 */
export class ExecutionContext {
  // Values stored by filename
  private values: Record<string, any> = {};
  
  // Execution metadata by action id
  private executionMeta: Record<string, ExecutionMetadata> = {};
  
  // Dependencies by action id
  private dependencies: Record<string, string[]> = {};
  
  // Circular dependencies by action id
  private circularDependencies: Record<string, CircularDependency> = {};
  
  // Subscribers for changes
  private subscribers: (() => void)[] = [];
  
  // Add the lastExecutionTime property and getter
  private lastExecutionTime: string | null = null;
  
  /**
   * Constructor
   */
  constructor() {
    this.values = {};
    this.executionMeta = {};
    this.dependencies = {};
    this.circularDependencies = {};
    this.subscribers = [];
  }
  
  /**
   * Sets a value in the execution context
   * @param key The key to set the value for
   * @param value The value to set
   */
  setValue(key: string, value: any): void {
    // Make a deep copy of the value to avoid reference issues
    let valueCopy;
    try {
      // Handle special cases for objects that can't be directly serialized
      if (value instanceof File || value instanceof Blob) {
        valueCopy = value;
      } else {
        valueCopy = JSON.parse(JSON.stringify(value));
      }
    } catch (error) {
      // If serialization fails (e.g., for circular refs), use the original value
      console.warn(`Could not make deep copy of value for ${key}, using original`);
      valueCopy = value;
    }
    
    this.values[key] = valueCopy;
    this.notifySubscribers();
  }
  
  /**
   * Gets a value from the execution context
   * @param key The key to get
   * @returns The value or undefined if not found
   */
  getValue(key: string): any {
    return this.values[key];
  }
  
  /**
   * Checks if a value exists
   * @param key The key to check
   * @returns True if the value exists
   */
  hasValue(key: string): boolean {
    return key in this.values && this.values[key] !== undefined && this.values[key] !== null;
  }
  
  /**
   * Gets all values
   * @returns All values in the context
   */
  getValues(): Record<string, any> {
    return { ...this.values };
  }
  
  /**
   * Gets execution metadata for an action
   * @param actionId The action ID
   * @returns The execution metadata
   */
  getExecutionMeta(actionId: string): ExecutionMetadata {
    return this.executionMeta[actionId] || {};
  }
  
  /**
   * Gets all execution metadata
   * @returns All execution metadata
   */
  getAllExecutionMeta(): Record<string, ExecutionMetadata> {
    return { ...this.executionMeta };
  }
  
  /**
   * Updates execution metadata for an action
   * @param actionId The action ID
   * @param metadata The metadata to update
   */
  updateExecutionMeta(actionId: string, metadata: Partial<ExecutionMetadata>): void {
    this.executionMeta[actionId] = {
      ...this.executionMeta[actionId],
      ...metadata
    };
    this.notifySubscribers();
  }
  
  /**
   * Marks an action as failed
   * @param actionId The action ID
   * @param error The error that occurred
   */
  markActionFailed(actionId: string, error: Error | string): void {
    this.updateExecutionMeta(actionId, {
      status: 'error',
      error: error instanceof Error ? error : String(error)
    });
    this.notifySubscribers();
  }
  
  /**
   * Resets an action's execution state
   * @param actionId The action ID
   */
  resetActionExecution(actionId: string): void {
    this.executionMeta[actionId] = {
      status: 'idle'
    };
    
    // Also remove the value if it exists
    delete this.values[actionId];
    
    this.notifySubscribers();
  }
  
  /**
   * Gets the status of an action
   * @param actionId The action ID
   * @returns The action status
   */
  getActionStatus(actionId: string): ActionStatus {
    const meta = this.executionMeta[actionId] || {};
    const circularDep = this.circularDependencies[actionId];
    
    return {
      playable: this.canExecuteAction(actionId),
      executed: !!meta.executedAt,
      executedAt: meta.executedAt,
      status: meta.status || 'idle',
      error: meta.error,
      attempts: meta.attempts || 0,
      missingDependencies: this.getMissingDependencies(actionId),
      hasCircularDependency: circularDep
    };
  }
  
  /**
   * Gets all action statuses
   * @returns All action statuses
   */
  getActionStatuses(actions: ActionData[]): Record<string, ActionStatus> {
    const statuses: Record<string, ActionStatus> = {};
    
    for (const action of actions) {
      statuses[action.id] = this.getActionStatus(action.id);
    }
    
    return statuses;
  }
  
  /**
   * Checks if an action can be executed
   * @param actionId The action ID to check
   * @returns True if the action can be executed
   */
  canExecuteAction(actionId: string | ActionData): boolean {
    const id = typeof actionId === 'string' ? actionId : actionId.id;
    
    // Check for circular dependencies
    if (this.circularDependencies[id]) {
      return false;
    }
    
    // Check for missing dependencies
    const missingDeps = this.getMissingDependencies(id);
    return missingDeps.length === 0;
  }
  
  /**
   * Gets missing dependencies for an action
   * @param actionId The action ID
   * @returns Array of missing dependency keys
   */
  getMissingDependencies(actionId: string): string[] {
    const deps = this.dependencies[actionId] || [];
    return deps.filter(dep => !this.hasValue(dep));
  }
  
  /**
   * Resolves references in a text
   * @param text The text with references to resolve
   * @returns The resolved text
   */
  resolveReferences(text: string): string {
    if (!text) return '';
    
    // Replace ${input.key} or {{input.key}} with values
    return text.replace(/\$\{input\.([\w.-]+)\}|\{\{input\.([\w.-]+)\}\}/g, (match, key1, key2) => {
      const key = key1 || key2;
      const value = this.getValue(key);
      
      if (value === undefined) {
        return `[Missing: ${key}]`;
      }
      
      if (typeof value === 'object') {
        // For file inputs, use the most appropriate property
        if (value.content) return value.content;
        if (value.base64) return value.base64;
        if (value.filepath) return value.filepath;
        return JSON.stringify(value);
      }
      
      return String(value);
    });
  }
  
  /**
   * Builds the dependency graph for a set of actions
   * @param actions The actions to build dependencies for
   */
  buildDependencyGraph(actions: ActionData[]): void {
    this.dependencies = {};
    this.circularDependencies = {};
    
    // Use buildDependencyGraph from actionExecutor.ts for each action
    for (const action of actions) {
      if (!this.dependencies[action.id]) {
        const { graph, circularDeps } = buildDependencyGraph(action.id, actions);
        
        // Merge the results into our dependency maps
        Object.assign(this.dependencies, graph);
        
        // Convert circular dependencies to our format
        for (const cycle of circularDeps) {
          if (cycle.length > 0) {
            const actionId = cycle[0];
            this.circularDependencies[actionId] = {
              cycle,
              message: `Circular dependency detected: ${cycle.join(' -> ')} -> ${actionId}`
            };
          }
        }
      }
    }
  }
  
  /**
   * Execute an action
   * @param action The action to execute
   * @param sdk The SDK to use
   * @returns Promise resolving to the result
   */
  async executeAction(action: ActionData, sdk: WebdrawSDK): Promise<any> {
    try {
      // Update execution metadata
      this.updateExecutionMeta(action.id, {
        status: 'idle',
        executedAt: new Date().toISOString()
      });
      
      // Execute the action using the external executor - imported in RuntimeContext
      // THIS METHOD IS DEPRECATED - USE RuntimeContext.executeAction INSTEAD
      // This stub implementation is kept for backwards compatibility
      console.warn("ExecutionContext.executeAction is deprecated. Use RuntimeContext.executeAction instead.");
      
      const startTime = Date.now();
      const duration = Date.now() - startTime;
      
      // We always return an error so callers migrate to the new approach
      const error = new Error('Action execution method has moved to RuntimeContext to avoid circular dependencies');
      this.markActionFailed(action.id, error);
      throw error;
    } catch (error: unknown) {
      // Convert error to Error or string
      const typedError = error instanceof Error ? error : String(error);
      this.markActionFailed(action.id, typedError);
      throw error;
    }
  }
  
  /**
   * Saves the current execution state to the WebDraw filesystem
   * @param sdk The WebDraw SDK instance
   * @param action Optional action that was executed
   */
  async saveExecutionState(sdk: any, action?: ActionData): Promise<void> {
    try {
      const appName = action?.id?.split('_')[0] || 'app';
      
      // Store current values before saving
      const currentValues = { ...this.values };
      
      // Create directories if they don't exist
      try {
        await sdk.fs.mkdir(`Hector`, { recursive: true });
        await sdk.fs.mkdir(`Hector/executions`, { recursive: true });
        await sdk.fs.mkdir(`Hector/executions/${appName}`, { recursive: true });
      } catch (e) {
        console.log('Directories might already exist:', e);
      }
      
      // Create timestamp for filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = `Hector/executions/${appName}/${timestamp}.json`;
      
      // Make deep copies of state to avoid reference issues
      const valuesCopy = JSON.parse(JSON.stringify(currentValues));
      const executionMetaCopy = JSON.parse(JSON.stringify(this.executionMeta));
      
      // Create the state to save
      const state: ExecutionState = {
        values: valuesCopy,
        executionMeta: executionMetaCopy,
        timestamp: new Date().toISOString()
      };
      
      // Write to file
      await sdk.fs.write(filename, JSON.stringify(state, null, 2));
      
      // Save to app config as well
      await this.saveCurrentExecutionToAppConfig(sdk, appName);
      
      console.log(`Execution state saved to ${filename}`);
      this.lastExecutionTime = new Date().toISOString();
      
      // Ensure values are preserved
      this.values = currentValues;
    } catch (error) {
      console.error('Failed to save execution state:', error);
    }
  }
  
  /**
   * Saves the current execution state to the app configuration
   * @param sdk The WebDraw SDK instance
   * @param appName The name of the app
   */
  private async saveCurrentExecutionToAppConfig(sdk: any, appName: string): Promise<void> {
    try {
      // Initialize WebdrawService if not already done
      WebdrawService.initialize(sdk);
      const webdrawService = WebdrawService.getInstance();
      
      try {
        // Get the existing app configuration
        const appConfig = await webdrawService.loadApp(appName);
        
        // Make a deep copy of values and executionMeta to avoid reference issues
        const valuesCopy = JSON.parse(JSON.stringify(this.values));
        const executionMetaCopy = JSON.parse(JSON.stringify(this.executionMeta));
        
        // Add/update the current execution state
        appConfig.currentExecution = {
          values: valuesCopy,
          executionMeta: executionMetaCopy,
          timestamp: new Date().toISOString()
        };
        
        // Use the service to save the app
        await webdrawService.saveApp(appConfig.id, appConfig);
        console.log(`Current execution state saved to app config for ${appName}`);
      } catch (error) {
        console.error('Error loading or saving app config:', error);
      }
    } catch (error) {
      console.error('Failed to save current execution to app config:', error);
    }
  }
  
  /**
   * Loads execution state from a serialized state object
   * @param state The execution state to load
   */
  loadFromState(state: ExecutionState): void {
    try {
      // Make deep copies to avoid reference issues
      this.values = state.values ? JSON.parse(JSON.stringify(state.values)) : {};
      this.executionMeta = state.executionMeta ? JSON.parse(JSON.stringify(state.executionMeta)) : {};
      
      // Set the lastExecutionTime if present in state
      if (state.timestamp) {
        this.lastExecutionTime = state.timestamp;
      }
      this.notifySubscribers();
    } catch (error) {
      console.error('Failed to load execution state:', error);
      throw error;
    }
  }
  
  /**
   * Gets the current execution state as a serializable object
   * @returns The execution state
   */
  getExecutionState(): ExecutionState {
    return {
      values: this.values,
      executionMeta: this.executionMeta,
      timestamp: this.lastExecutionTime || new Date().toISOString()
    };
  }
  
  /**
   * Loads current execution from app config
   * @param sdk The WebDraw SDK instance
   * @param appName The name of the app
   */
  async loadCurrentExecution(sdk: any, appName: string): Promise<void> {
    try {
      // Initialize WebdrawService if not already done
      WebdrawService.initialize(sdk);
      const webdrawService = WebdrawService.getInstance();
      
      try {
        // Load the app config using the service
        const appConfig = await webdrawService.loadApp(appName);
        
        // Check if there's a current execution
        if (appConfig.currentExecution) {
          // Make deep copies to avoid reference issues
          const valuesCopy = appConfig.currentExecution.values 
            ? JSON.parse(JSON.stringify(appConfig.currentExecution.values)) 
            : {};
          
          const executionMetaCopy = appConfig.currentExecution.executionMeta 
            ? JSON.parse(JSON.stringify(appConfig.currentExecution.executionMeta)) 
            : {};
          
          // Preserve any existing values
          const currentValues = { ...this.values };
          
          // Merge with values from app config
          this.values = { ...currentValues, ...valuesCopy };
          this.executionMeta = executionMetaCopy;
          
          if (appConfig.currentExecution.timestamp) {
            this.lastExecutionTime = appConfig.currentExecution.timestamp;
          }
          
          this.notifySubscribers();
        }
      } catch (error) {
        console.log('App config may not exist yet, skipping loading execution state');
      }
    } catch (error) {
      console.error('Failed to load current execution:', error);
    }
  }
  
  /**
   * Loads a previous execution state from WebDraw filesystem
   * @param sdk The WebDraw SDK instance
   * @param appName The name of the app
   * @param timestamp The timestamp of the execution to load
   */
  async loadExecutionFromHistory(sdk: any, appName: string, timestamp: string): Promise<void> {
    try {
      const filePath = `Hector/executions/${appName}/${timestamp}.json`;
      
      const exists = await sdk.fs.exists(filePath);
      if (exists) {
        const stateContent = await sdk.fs.readFile(filePath);
        const state = JSON.parse(stateContent as string);
        
        this.loadFromState(state);
      } else {
        throw new Error(`Execution state file not found: ${filePath}`);
      }
    } catch (error) {
      console.error('Failed to load execution from history:', error);
      throw error;
    }
  }
  
  /**
   * Subscribe to changes in the execution context
   * @param callback Function to call when the context changes
   */
  subscribe(callback: () => void): void {
    if (!this.subscribers.includes(callback)) {
      this.subscribers.push(callback);
    }
  }
  
  /**
   * Unsubscribe from changes in the execution context
   * @param callback The callback to remove
   */
  unsubscribe(callback: () => void): void {
    this.subscribers = this.subscribers.filter(sub => sub !== callback);
  }
  
  /**
   * Notifies all subscribers of changes
   */
  private notifySubscribers(): void {
    for (const subscriber of this.subscribers) {
      try {
        subscriber();
      } catch (error) {
        console.error('Error in execution context subscriber:', error);
      }
    }
  }
  
  /**
   * Get the timestamp of the most recent execution
   * @returns ISO string of the last execution time or null if no executions
   */
  getLastExecutionTime(): string | null {
    return this.lastExecutionTime;
  }
} 