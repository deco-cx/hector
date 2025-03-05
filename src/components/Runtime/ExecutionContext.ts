import { ActionData, InputField, WebdrawSDK } from '../../types/types';
import { extractInputReferences, buildDependencyGraph } from './actionExecutor';
import { HectorService } from '../../services/HectorService';

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
 * ExecutionContext class
 * Manages the execution state of an app
 */
export class ExecutionContext {
  private values: Record<string, any> = {};
  private metadata: Record<string, ExecutionMetadata> = {};
  private dependencyGraph: Map<string, Set<string>> = new Map();
  private appId: string;
  private inputs: InputField[];
  private actions: ActionData[];
  private subscribers: (() => void)[] = [];
  private lastExecutionTime: string | null = null;
  
  /**
   * Create a new ExecutionContext
   */
  constructor(appId?: string, inputs?: InputField[], actions?: ActionData[]) {
    this.appId = appId || '';
    this.inputs = inputs || [];
    this.actions = actions || [];
    this.subscribers = [];
    
    if (actions?.length) {
      this.buildDependencyGraph(actions);
    }
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
    return this.metadata[actionId] || {};
  }
  
  /**
   * Gets all execution metadata
   * @returns All execution metadata
   */
  getAllExecutionMeta(): Record<string, ExecutionMetadata> {
    return { ...this.metadata };
  }
  
  /**
   * Updates execution metadata for an action
   * @param actionId The action ID
   * @param metadata The metadata to update
   */
  updateExecutionMeta(actionId: string, metadata: Partial<ExecutionMetadata>): void {
    this.metadata[actionId] = {
      ...this.metadata[actionId],
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
    this.metadata[actionId] = {
      status: 'idle'
    };
    
    // Also remove the value if it exists
    delete this.values[actionId];
    
    this.notifySubscribers();
  }
  
  /**
   * Get action status including playability, execution state, and dependencies
   */
  getActionStatus(actionId: string): ActionStatus {
    const meta = this.metadata[actionId] || {};
    // Check if there's a circular dependency for this action
    const hasCircularDep = this.checkCircularDependency(actionId);
    
    return {
      playable: this.canExecuteAction(actionId),
      executed: !!meta.executedAt,
      executedAt: meta.executedAt,
      status: meta.status || 'idle',
      error: meta.error,
      attempts: meta.attempts || 0,
      missingDependencies: this.getMissingDependencies(actionId),
      hasCircularDependency: hasCircularDep
    };
  }
  
  /**
   * Check if an action has a circular dependency
   * @param actionId The action ID to check
   * @returns A CircularDependency object if circular dependency exists, undefined otherwise
   */
  private checkCircularDependency(actionId: string): CircularDependency | undefined {
    // Check if the action depends on itself (directly or indirectly)
    const visited = new Set<string>();
    const path: string[] = [];
    
    const dfs = (current: string): boolean => {
      if (visited.has(current)) {
        if (current === actionId) {
          // Found a cycle back to the starting node
          return true;
        }
        return false;
      }
      
      visited.add(current);
      path.push(current);
      
      const dependencies = this.dependencyGraph.get(current);
      if (dependencies) {
        for (const dep of dependencies) {
          if (dfs(dep)) {
            return true;
          }
        }
      }
      
      path.pop();
      return false;
    };
    
    if (dfs(actionId)) {
      return {
        cycle: [...path],
        message: `Circular dependency detected: ${path.join(' -> ')} -> ${actionId}`
      };
    }
    
    return undefined;
  }
  
  /**
   * Get missing dependencies for an action
   */
  getMissingDependencies(actionId: string): string[] {
    const dependencies = this.dependencyGraph.get(actionId);
    if (!dependencies) return [];
    
    // Convert Set to Array and filter
    return Array.from(dependencies).filter(dep => !this.hasValue(dep));
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
    if (this.dependencyGraph.get(id)?.has(id)) {
      return false;
    }
    
    // Check for missing dependencies
    const missingDeps = this.getMissingDependencies(id);
    return missingDeps.length === 0;
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
   * Build dependency graph for all actions
   */
  buildDependencyGraph(actions: ActionData[]): void {
    this.dependencyGraph.clear();
    
    // Initialize empty sets for each action
    for (const action of actions) {
      this.dependencyGraph.set(action.id, new Set<string>());
    }
    
    // Use buildDependencyGraph from actionExecutor.ts for each action
    for (const action of actions) {
      try {
        const deps = this.extractDependencies(action);
        if (deps.length > 0) {
          // Add dependencies to the graph
          for (const dep of deps) {
            this.dependencyGraph.get(action.id)?.add(dep);
          }
        }
      } catch (error) {
        console.error(`Failed to build dependency graph for action ${action.id}:`, error);
      }
    }
    
    // Check for circular dependencies
    this.detectCircularDependencies();
  }
  
  /**
   * Extract dependencies from an action
   */
  private extractDependencies(action: ActionData): string[] {
    // Extract references from prompt and other fields
    const deps: string[] = [];
    
    // Check prompt for references
    if (action.prompt) {
      const promptValue = typeof action.prompt === 'object' 
        ? Object.values(action.prompt).join(' ') 
        : action.prompt;
        
      const references = this.findReferences(promptValue);
      deps.push(...references);
    }
    
    // Check config for references
    if (action.config) {
      const configString = JSON.stringify(action.config);
      const references = this.findReferences(configString);
      deps.push(...references);
    }
    
    return [...new Set(deps)]; // Remove duplicates
  }
  
  /**
   * Find references in a string (e.g., {{input.name}})
   */
  private findReferences(text: string): string[] {
    const regex = /\{\{([^}]+)\}\}/g;
    const matches = text.matchAll(regex);
    const references: string[] = [];
    
    for (const match of matches) {
      const ref = match[1].trim();
      // Split by dot to get the main reference
      const parts = ref.split('.');
      if (parts.length > 0) {
        references.push(parts[0]);
      }
    }
    
    return references;
  }
  
  /**
   * Detect circular dependencies in the graph
   */
  private detectCircularDependencies(): void {
    const visited = new Set<string>();
    const stack = new Set<string>();
    
    const dfs = (node: string): boolean => {
      if (stack.has(node)) {
        return true; // Circular dependency found
      }
      
      if (visited.has(node)) {
        return false; // Already checked, no circular dependency
      }
      
      visited.add(node);
      stack.add(node);
      
      const deps = this.dependencyGraph.get(node);
      if (deps) {
        for (const dep of deps) {
          if (dfs(dep)) {
            // Mark the circular dependency
            this.dependencyGraph.get(node)?.add(node); // Self-dependency indicates circularity
            return true;
          }
        }
      }
      
      stack.delete(node);
      return false;
    };
    
    // Check all nodes
    for (const node of this.dependencyGraph.keys()) {
      if (!visited.has(node)) {
        dfs(node);
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
      
      // Initialize the HectorService
      const hectorService = HectorService.getInstance();
      
      // Create the state to save
      const state: ExecutionState = {
        values: JSON.parse(JSON.stringify(currentValues)),
        executionMeta: JSON.parse(JSON.stringify(this.metadata)),
        timestamp: new Date().toISOString()
      };
      
      // Save to history
      const timestamp = await hectorService.saveExecution(appName, state);
      
      // Save current execution to app config as well
      await hectorService.saveCurrentExecution(
        appName, 
        currentValues, 
        this.metadata
      );
      
      console.log(`Execution state saved for ${appName}`);
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
      // Initialize the HectorService
      const hectorService = HectorService.getInstance();
      
      // Make a deep copy of values and executionMeta to avoid reference issues
      const valuesCopy = JSON.parse(JSON.stringify(this.values));
      const executionMetaCopy = JSON.parse(JSON.stringify(this.metadata));
      
      // Use HectorService to save the current execution
      await hectorService.saveCurrentExecution(
        appName, 
        valuesCopy, 
        executionMetaCopy
      );
      
      console.log(`Current execution state saved for app: ${appName}`);
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
      this.metadata = state.executionMeta ? JSON.parse(JSON.stringify(state.executionMeta)) : {};
      
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
      executionMeta: this.metadata,
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
      // Initialize the HectorService
      const hectorService = HectorService.getInstance();
      
      try {
        // Load the app config using the service
        const appConfig = await hectorService.getApp(appName);
        
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
          this.metadata = executionMetaCopy;
          
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
      // Initialize the HectorService
      const hectorService = HectorService.getInstance();
      
      // Load execution from history
      const state = await hectorService.loadExecution(appName, timestamp);
      
      // Load the state
      this.loadFromState(state);
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