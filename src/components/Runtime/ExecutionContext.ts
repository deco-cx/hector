import { ActionData, InputField } from '../../types/types';
import { extractInputReferences, executeAction, buildDependencyGraph } from './actionExecutor';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

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
   * @param key The key to set
   * @param value The value to set
   */
  setValue(key: string, value: any): void {
    this.values[key] = value;
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
    const currentMeta = this.executionMeta[actionId] || {};
    const attempts = (currentMeta.attempts || 0) + 1;
    
    this.executionMeta[actionId] = {
      ...currentMeta,
      status: 'error',
      error,
      attempts,
      executedAt: new Date().toISOString()
    };
    
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
    
    // Process each action
    for (const action of actions) {
      // Skip if already processed
      if (this.dependencies[action.id]) continue;
      
      // Initialize empty dependencies for this action
      this.dependencies[action.id] = [];
      
      // Process prompts if any
      if (action.prompts) {
        for (const [field, prompt] of Object.entries(action.prompts)) {
          if (typeof prompt === 'string') {
            const references = extractInputReferences(prompt);
            
            // Add all referenced inputs as dependencies
            for (const ref of references) {
              if (!this.dependencies[action.id].includes(ref)) {
                this.dependencies[action.id].push(ref);
              }
            }
          }
        }
      }
    }
    
    // Detect circular dependencies
    const { circularDeps } = this.detectCircularDependencies(actions);
    
    // Store circular dependencies
    for (const cycle of circularDeps) {
      const actionId = cycle[0];
      this.circularDependencies[actionId] = {
        cycle,
        message: `Circular dependency detected: ${cycle.join(' -> ')} -> ${actionId}`
      };
    }
  }
  
  /**
   * Detects circular dependencies in the actions
   * @param actions The actions to check
   * @returns Object with circular dependencies
   */
  detectCircularDependencies(actions: ActionData[]): { circularDeps: string[][] } {
    const circularDeps: string[][] = [];
    const visited = new Set<string>();
    const path: string[] = [];
    
    // DFS to detect cycles
    const dfs = (actionId: string) => {
      // If we've seen this action in the current path, we have a cycle
      if (path.includes(actionId)) {
        const cycle = path.slice(path.indexOf(actionId)).concat(actionId);
        circularDeps.push(cycle);
        return;
      }
      
      // If we've already fully explored this node, skip it
      if (visited.has(actionId)) return;
      
      // Add to current path
      path.push(actionId);
      visited.add(actionId);
      
      // Explore all dependencies
      const deps = this.dependencies[actionId] || [];
      for (const dep of deps) {
        // Find actions that produce this dependency
        const producers = actions.filter(a => 
          a.outputs?.some(output => output === dep) ||
          a.inputs?.some(input => input.filename === dep)
        );
        
        // Explore each producer
        for (const producer of producers) {
          dfs(producer.id);
        }
      }
      
      // Remove from current path
      path.pop();
    };
    
    // Start DFS from each action
    for (const action of actions) {
      if (!visited.has(action.id)) {
        dfs(action.id);
      }
    }
    
    return { circularDeps };
  }
  
  /**
   * Execute an action
   * @param action The action to execute
   * @param sdk The SDK to use
   * @returns Promise resolving to the result
   */
  async executeAction(action: ActionData, sdk: any): Promise<any> {
    try {
      // Update execution metadata
      this.updateExecutionMeta(action.id, {
        status: 'idle',
        executedAt: new Date().toISOString()
      });
      
      // Execute the action
      const startTime = Date.now();
      const result = await executeAction(action, this, sdk);
      const duration = Date.now() - startTime;
      
      if (result.success) {
        // Store the result
        this.setValue(action.id, result.data);
        
        // Update execution metadata
        this.updateExecutionMeta(action.id, {
          status: 'success',
          error: undefined,
          duration
        });
        
        // Save execution state
        this.saveExecutionState(action);
        
        return result.data;
      } else {
        // Mark as failed
        this.markActionFailed(action.id, result.error || 'Unknown error');
        throw result.error || new Error('Unknown error');
      }
    } catch (error) {
      this.markActionFailed(action.id, error instanceof Error ? error : new Error(String(error)));
      throw error;
    }
  }
  
  /**
   * Saves the current execution state to a file
   * @param action Optional action to associate with the save
   */
  saveExecutionState(action?: ActionData): void {
    try {
      const appName = action?.appName || 'app';
      const homeDir = os.homedir();
      const hectorDir = path.join(homeDir, 'Hector');
      const executionsDir = path.join(hectorDir, 'executions', appName);
      
      // Create directories if they don't exist
      if (!fs.existsSync(hectorDir)) {
        fs.mkdirSync(hectorDir, { recursive: true });
      }
      
      if (!fs.existsSync(executionsDir)) {
        fs.mkdirSync(executionsDir, { recursive: true });
      }
      
      // Create timestamp for filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const filename = path.join(executionsDir, `${timestamp}.json`);
      
      // Create the state to save
      const state: ExecutionState = {
        values: this.values,
        executionMeta: this.executionMeta,
        timestamp: new Date().toISOString()
      };
      
      // Write to file
      fs.writeFileSync(filename, JSON.stringify(state, null, 2));
      
      console.log(`Execution state saved to ${filename}`);
    } catch (error) {
      console.error('Failed to save execution state:', error);
    }
  }
  
  /**
   * Loads execution state from a serialized state object
   * @param state The execution state to load
   */
  loadFromState(state: ExecutionState): void {
    try {
      this.values = state.values || {};
      this.executionMeta = state.executionMeta || {};
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
      timestamp: new Date().toISOString()
    };
  }
  
  /**
   * Loads the current execution state from persistent storage
   * @param appName The name of the app
   */
  loadCurrentExecution(appName: string): void {
    try {
      const homeDir = os.homedir();
      const configFile = path.join(homeDir, 'Hector', 'config.json');
      
      if (fs.existsSync(configFile)) {
        const config = JSON.parse(fs.readFileSync(configFile, 'utf8'));
        
        if (config.currentExecution) {
          this.loadFromState(config.currentExecution);
        }
      }
    } catch (error) {
      console.error('Failed to load current execution:', error);
    }
  }
  
  /**
   * Loads a previous execution state from history
   * @param appName The name of the app
   * @param timestamp The timestamp of the execution to load
   */
  loadExecutionFromHistory(appName: string, timestamp: string): void {
    try {
      const homeDir = os.homedir();
      const filePath = path.join(homeDir, 'Hector', 'executions', appName, `${timestamp}.json`);
      
      if (fs.existsSync(filePath)) {
        const state = JSON.parse(fs.readFileSync(filePath, 'utf8'));
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
} 