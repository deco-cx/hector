# Hector Runtime Environment

## 1. Overview

The Hector Runtime Environment is a system for executing and testing AI apps directly within the Hector app builder interface. It will allow users to:

1. Enter test inputs via form fields
2. Execute individual actions based on dependencies
3. See real-time results of each action execution
4. Track execution state and history
5. Test the complete app flow without leaving the builder

This document outlines the architecture, components, data structures, and implementation details for the runtime environment.

## 2. Architecture

The runtime environment consists of several key components:

1. **ExecutionContext**: A class responsible for managing execution state, resolving dependencies, and storing results. The current execution is stores in the app current state.

2. **Input Component System**: Enhanced input components that toggle between config and test modes, as already implemented for editing/view mode in actions.

3. **Action Execution System**: Components and logic for executing actions and displaying results

4. **Dependency Resolver**: Logic to build and validate dependency graphs for proper execution order. The steps refer to each other with @filename.txt, pointing to name of other blocks.

5. **UI Components**: Specialized components for the runtime environment

## 3. ExecutionContext Class

The ExecutionContext class will be the core of the runtime environment, responsible for maintaining state across action executions.

```typescript
class ExecutionContext {
  // Values from inputs and action results, indexed by filename
  private values: Record<string, any> = {};
  
  // Metadata about each execution, indexed by actionId
  private executionMeta: Record<string, {
    executedAt: Date | null;
    status: 'pending' | 'executing' | 'completed' | 'error';
    error?: string;
    duration?: number;
  }> = {};
  
  // Dependency graph
  private dependencies: Record<string, string[]> = {};
  
  // Add or update a value in the context
  setValue(filename: string, value: any): void {
    this.values[filename] = value;
  }
  
  // Get a value from the context
  getValue(filename: string): any {
    return this.values[filename];
  }
  
  // Check if a value exists in the context
  hasValue(filename: string): boolean {
    return filename in this.values && this.values[filename] !== undefined;
  }
  
  // Resolve references in a text (replace @file.ext with actual values)
  resolveReferences(text: string): string {
    return text.replace(/@([a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)/g, (match, filename) => {
      return this.hasValue(filename) ? this.getValue(filename) : match;
    });
  }
  
  // Build dependency graph from actions configuration
  buildDependencyGraph(actions: ActionData[]): void {
    actions.forEach(action => {
      const prompt = typeof action.prompt === 'object' 
        ? action.prompt.EN || Object.values(action.prompt)[0] 
        : action.prompt;
      
      const dependencies = this.extractReferences(prompt);
      this.dependencies[action.output_filename] = dependencies;
    });
  }
  
  // Extract @references from a text
  private extractReferences(text: string): string[] {
    const references: string[] = [];
    const regex = /@([a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      references.push(match[1]);
    }
    
    return references;
  }
  
  // Check if an action can be executed (all dependencies resolved)
  canExecuteAction(action: ActionData): boolean {
    const prompt = typeof action.prompt === 'object' 
      ? action.prompt.EN || Object.values(action.prompt)[0] 
      : action.prompt;
    
    const dependencies = this.extractReferences(prompt);
    return dependencies.every(dep => this.hasValue(dep));
  }
  
  // Get execution metadata for an action
  getExecutionMeta(actionId: string): any {
    return this.executionMeta[actionId] || {
      executedAt: null,
      status: 'pending'
    };
  }
  
  // Update execution metadata for an action
  updateExecutionMeta(actionId: string, meta: Partial<{
    executedAt: Date | null;
    status: 'pending' | 'executing' | 'completed' | 'error';
    error?: string;
    duration?: number;
  }>): void {
    this.executionMeta[actionId] = {
      ...this.getExecutionMeta(actionId),
      ...meta
    };
  }
  
  // Get all values in the context
  getAllValues(): Record<string, any> {
    return { ...this.values };
  }
  
  // Reset the context
  reset(): void {
    this.values = {};
    this.executionMeta = {};
  }
}
```

## 4. Input Component System

The Input Component System will enhance the existing input configuration to toggle between edit mode and test mode (view mode).

### 4.1 InputCard Component

The InputCard component will be enhanced to support three modes:

1. **Config Edit Mode**: Configure the input properties
2. **Config View Mode**: View the input configuration summary
3. **Test Mode**: Actual input component for entering test data

```typescript
interface InputCardProps {
  input: InputData;
  onEdit: (input: InputData) => void;
  onDelete: (id: string) => void;
  executionContext: ExecutionContext;
  mode: 'config-edit' | 'config-view' | 'test';
}
```

### 4.2 Test Mode Rendering

In test mode, the InputCard will render appropriate input fields based on the input type:

- Text inputs for text fields
- Textareas for long-form content
- Select fields for dropdown options
- File uploads for image/file inputs
- Etc.

Values entered in test mode will be stored in the ExecutionContext using `executionContext.setValue(input.filename, value)`.

## 5. Action Execution System

### 5.1 PlayActionButton Component

```typescript
interface PlayActionButtonProps {
  action: ActionData;
  executionContext: ExecutionContext;
  sdk: any; // Webdraw SDK instance
  onActionComplete?: (result: any) => void;
}
```

The PlayActionButton will:

1. Check if the action is playable by calling `executionContext.canExecuteAction(action)`
2. Display appropriate visual state:
   - Ready to play (green play button)
   - Not available (disabled button with lock icon)
   - Loading (spinning indicator)
3. Handle the execution flow when clicked
4. Display execution timestamp after completion

### 5.2 Action Execution Flow

When the PlayActionButton is clicked:

1. Set button state to loading
2. Resolve references in the action prompt
3. Call the appropriate SDK method based on action type
4. Store the result in the ExecutionContext
5. Update execution metadata (timestamp, status)
6. Reset button state to playable
7. Display execution timestamp

### 5.3 ActionCard Enhancements

The ActionCard component will be enhanced to include:

1. PlayActionButton in the header
2. Execution timestamp display
3. Result preview section showing the value of the execution

```typescript
interface ActionCardProps {
  action: ActionData;
  onEdit: (action: ActionData) => void;
  onDelete: (id: string) => void;
  executionContext: ExecutionContext;
  sdk: any; // Webdraw SDK instance
  mode: 'config-edit' | 'config-view' | 'test';
}
```

## 6. Dependency Resolution

### 6.1 Dependency Graph Construction

The system will build a dependency graph by parsing action prompts and extracting @references:

1. For each action, extract all @references from its prompt
2. Create a mapping of `{ [outputFilename]: [dependencyFilenames] }`
3. Use this to determine execution order and playability

### 6.2 Reference Resolution

When executing an action:

1. Identify all @references in the prompt
2. Replace each reference with its current value from the ExecutionContext
3. Use the resolved prompt for the SDK call

### 6.3 Circular Dependency Detection

The system will detect and prevent circular dependencies:

1. During dependency graph construction, check for cycles
2. Display warnings for detected circular dependencies
3. Prevent execution of actions involved in circular dependencies

## 7. UI Components

### 7.1 Runtime Control Panel

A control panel will be added to the app configuration interface with:

1. "Test Mode" toggle to switch between config and test modes
2. "Reset" button to clear all test data
3. "Run All" button to execute all executable actions in sequence
4. Status indicators for the overall execution

### 7.2 Result Visualization

Each action will have a result visualization section that:

1. Shows the raw output for text/JSON
2. Displays image previews for generated images
3. Provides audio playback for audio generations
4. Formats content appropriately based on content type

### 7.3 PlayActionButton States

The PlayActionButton will have three visual states:

1. **Ready to Play**: Green play button with tooltip showing dependencies are met
2. **Not Available**: Disabled play button with lock icon and tooltip showing missing dependencies
3. **Loading**: Spinning indicator during execution

After execution, a timestamp will appear next to the button: "Executed at HH:MM:SS"

## 8. Integration with Webdraw SDK

### 8.1 SDK Action Execution

The system leverages the executeAction functionality from `components/Runtime/actionExecutors.ts`:

```typescript
// Implementation of executeAction in actionExecutors.ts
export async function executeAction(
  action: ActionData,
  context: ExecutionContext,
  sdk: WebdrawSDK,
  language: string = 'EN'
): Promise<{ success: boolean; data: any; error?: Error | string }> {
  try {
    // Get the prompt in the current language or fallback
    const prompt = typeof action.prompt === 'object' 
      ? action.prompt[language] || Object.values(action.prompt)[0] 
      : action.prompt;
    
    // Resolve references in the prompt
    const resolvedPrompt = context.resolveReferences(prompt);
    
    // Execute based on action type with appropriate SDK method
    // ...
  } catch (error) {
    // Error handling
    // ...
  }
}
```

This implementation handles:
- Resolving references in prompts using the execution context
- Properly formatting parameters for different SDK methods
- Error handling and reporting
- Returning a standardized result format with success/error information

## 9. Runtime Mode Implementation

### 9.1 RuntimeProvider Component

A RuntimeProvider component will wrap the app configuration components and provide the ExecutionContext to all child components:

```typescript
interface RuntimeProviderProps {
  children: React.ReactNode;
  sdk: any; // Webdraw SDK instance
}

const RuntimeProvider: React.FC<RuntimeProviderProps> = ({ children, sdk }) => {
  const [executionContext] = useState(() => new ExecutionContext());
  const [mode, setMode] = useState<'config' | 'test'>('config');
  
  return (
    <RuntimeContext.Provider value={{ executionContext, mode, setMode, sdk }}>
      {children}
    </RuntimeContext.Provider>
  );
};
```

### 9.2 useRuntime Hook

A custom hook to access the runtime context from any component:

```typescript
function useRuntime() {
  const context = useContext(RuntimeContext);
  if (!context) {
    throw new Error('useRuntime must be used within a RuntimeProvider');
  }
  return context;
}
```

### 9.3 Mode Toggle

A toggle control to switch between config and test modes:

```typescript
const RuntimeModeToggle: React.FC = () => {
  const { mode, setMode } = useRuntime();
  
  return (
    <div className="mode-toggle">
      <Radio.Group 
        value={mode} 
        onChange={e => setMode(e.target.value)}
        buttonStyle="solid"
      >
        <Radio.Button value="config">Configure</Radio.Button>
        <Radio.Button value="test">Test</Radio.Button>
      </Radio.Group>
    </div>
  );
};
```

## 10. Implementation Plan

### Phase 1: Core State Management
1. Implement ExecutionContext class
2. Set up RuntimeProvider and context
3. Implement dependency resolution logic
4. Create basic state management for execution metadata

### Phase 2: Enhanced UI Components
1. Modify InputCard to support test mode
2. Create PlayActionButton component
3. Enhance ActionCard with execution controls and results display
4. Implement RuntimeModeToggle

### Phase 3: Execution Flow
1. Implement action execution with SDK integration
2. Build result visualization components
3. Add execution metadata displays (timestamps, status)
4. Implement "Run All" functionality

### Phase 4: Testing and Refinement
1. Test with various action types and dependencies
2. Optimize performance for large dependency graphs
3. Enhance error handling and user feedback
4. Add animations and transitions for state changes

## 11. Open Questions and Answers

1. **Error Handling**: How should action execution errors be displayed and managed? Should failed actions be retriable?
   - **Answer**: Yes, actions should be retriable. Create a structure to store/handle errors with `{ status: "error", message: string }`.
   - **Implementation**: The UI will display error messages inline with options to retry. Errors will be stored in the execution metadata with error details.

2. **Result Persistence**: Should results be persisted between sessions, or reset when the user navigates away?
   - **Answer**: The persistence of executions will happen in `~/Hector/executions/:appname/:timestamp.json` for each execution. The "current execution" will be persisted in the current app config as a new variable. Every state can be seen there.
   - **Implementation**: Implement automatic saving of execution state to both locations, with the ability to load previous executions.

3. **Circular Dependencies**: How should we handle circular dependencies if detected in the action configuration?
   - **Answer**: Give an error when circular dependencies are detected.
   - **Implementation**: Add detection logic to the dependency graph builder and display clear error messages to users with the specific actions involved in the cycle.

4. **Authentication**: How should the runtime environment handle SDK authentication requirements during testing?
   - **Answer**: Not an issue to handle. The SDK will call AI services and it will work. Note that AI calls return a filepath of the generated element and also the base64 representation, which should be preserved for potential use.
   - **Implementation**: No special authentication handling needed. Store both filepath and base64 data when available.

5. **Long-running Operations**: Should we implement timeouts or cancellation for long-running actions?
   - **Answer**: Not implementing these features at this time.
   - **Implementation**: No timeout or cancellation mechanisms will be added in the initial version.

6. **Visualization Preferences**: For actions that produce large outputs (like long text or complex JSON), should we show the full output or a truncated preview?
   - **Answer**: Always show results in a textarea which will truncate automatically.
   - **Implementation**: Use scrollable textareas with appropriate height limits for all text-based outputs.

## 12. Enhanced ExecutionContext Class

Based on the answers to the open questions, here is the enhanced ExecutionContext class with additional features:

```typescript
class ExecutionContext {
  // Values from inputs and action results, indexed by filename
  private values: Record<string, any> = {};
  
  // Metadata about each execution, indexed by actionId
  private executionMeta: Record<string, {
    executedAt: Date | null;
    status: 'pending' | 'executing' | 'completed' | 'error';
    error?: {
      message: string;
      details?: any;
    };
    duration?: number;
    attempts: number;
  }> = {};
  
  // Dependency graph
  private dependencies: Record<string, string[]> = {};
  
  // Circular dependency detection
  private circularDependencies: Array<{
    cycle: string[];
    message: string;
  }> = [];
  
  // Add or update a value in the context
  setValue(filename: string, value: any): void {
    // For file results, store both filepath and base64 if available
    if (value && typeof value === 'object' && value.filepath && value.base64) {
      this.values[filename] = {
        filepath: value.filepath,
        base64: value.base64,
        // Store original response for reference
        originalResponse: value
      };
    } else {
      this.values[filename] = value;
    }
    
    // Notify subscribers of change
    this.notifySubscribers();
  }
  
  // Get a value from the context
  getValue(filename: string): any {
    return this.values[filename];
  }
  
  // Check if a value exists in the context
  hasValue(filename: string): boolean {
    return filename in this.values && this.values[filename] !== undefined;
  }
  
  // Resolve references in a text (replace @file.ext with actual values)
  resolveReferences(text: string): string {
    return text.replace(/@([a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)/g, (match, filename) => {
      if (!this.hasValue(filename)) {
        return match;
      }
      
      const value = this.getValue(filename);
      
      // Handle different types of values
      if (typeof value === 'string') {
        return value;
      } else if (value && typeof value === 'object') {
        if (value.filepath) {
          return value.filepath;
        } else {
          // For complex objects, return JSON string
          return JSON.stringify(value);
        }
      } else {
        return String(value);
      }
    });
  }
  
  // Build dependency graph from actions configuration
  buildDependencyGraph(actions: ActionData[]): void {
    // Reset dependency data
    this.dependencies = {};
    this.circularDependencies = [];
    
    // Build initial dependency map
    actions.forEach(action => {
      const prompt = typeof action.prompt === 'object' 
        ? action.prompt.EN || Object.values(action.prompt)[0] 
        : action.prompt;
      
      const dependencies = this.extractReferences(prompt);
      this.dependencies[action.output_filename] = dependencies;
    });
    
    // Check for circular dependencies
    this.detectCircularDependencies();
  }
  
  // Detect circular dependencies in the graph
  private detectCircularDependencies(): void {
    const visited: Record<string, boolean> = {};
    const recStack: Record<string, boolean> = {};
    const pathStack: string[] = [];
    
    const checkCycle = (node: string): boolean => {
      if (!visited[node]) {
        visited[node] = true;
        recStack[node] = true;
        pathStack.push(node);
        
        const dependencies = this.dependencies[node] || [];
        for (const dependency of dependencies) {
          if (!visited[dependency] && checkCycle(dependency)) {
            return true;
          } else if (recStack[dependency]) {
            // Found a cycle
            const cycleStart = pathStack.indexOf(dependency);
            const cycle = pathStack.slice(cycleStart);
            cycle.push(dependency); // Complete the cycle
            
            this.circularDependencies.push({
              cycle,
              message: `Circular dependency detected: ${cycle.join(' -> ')}`
            });
            return true;
          }
        }
      }
      
      if (pathStack[pathStack.length - 1] === node) {
        pathStack.pop();
      }
      recStack[node] = false;
      return false;
    };
    
    // Check for cycles starting from each node
    Object.keys(this.dependencies).forEach(node => {
      if (!visited[node]) {
        checkCycle(node);
      }
    });
  }
  
  // Check if the app has circular dependencies
  hasCircularDependencies(): boolean {
    return this.circularDependencies.length > 0;
  }
  
  // Get circular dependency information
  getCircularDependencies(): Array<{
    cycle: string[];
    message: string;
  }> {
    return [...this.circularDependencies];
  }
  
  // Extract @references from a text
  private extractReferences(text: string): string[] {
    const references: string[] = [];
    const regex = /@([a-zA-Z0-9_-]+\.[a-zA-Z0-9]+)/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      references.push(match[1]);
    }
    
    return references;
  }
  
  // Check if an action can be executed (all dependencies resolved)
  canExecuteAction(action: ActionData): boolean {
    // Check if there are circular dependencies involving this action
    if (this.hasCircularDependencies()) {
      const cycles = this.getCircularDependencies();
      for (const cycle of cycles) {
        if (cycle.cycle.includes(action.output_filename)) {
          return false;
        }
      }
    }
    
    const prompt = typeof action.prompt === 'object' 
      ? action.prompt.EN || Object.values(action.prompt)[0] 
      : action.prompt;
    
    const dependencies = this.extractReferences(prompt);
    return dependencies.every(dep => this.hasValue(dep));
  }
  
  // Get execution metadata for an action
  getExecutionMeta(actionId: string): any {
    return this.executionMeta[actionId] || {
      executedAt: null,
      status: 'pending',
      attempts: 0
    };
  }
  
  // Update execution metadata for an action
  updateExecutionMeta(actionId: string, meta: Partial<{
    executedAt: Date | null;
    status: 'pending' | 'executing' | 'completed' | 'error';
    error?: {
      message: string;
      details?: any;
    };
    duration?: number;
    attempts?: number;
  }>): void {
    const currentMeta = this.getExecutionMeta(actionId);
    
    this.executionMeta[actionId] = {
      ...currentMeta,
      ...meta,
      // Increment attempts if executing
      attempts: meta.status === 'executing' 
        ? (currentMeta.attempts || 0) + 1 
        : (meta.attempts !== undefined ? meta.attempts : currentMeta.attempts || 0)
    };
    
    // Notify subscribers of change
    this.notifySubscribers();
  }
  
  // Mark an action as failed with error information
  markActionFailed(actionId: string, error: Error | string): void {
    this.updateExecutionMeta(actionId, {
      status: 'error',
      error: {
        message: typeof error === 'string' ? error : error.message,
        details: typeof error !== 'string' ? error : undefined
      },
      executedAt: new Date()
    });
  }
  
  // Reset execution metadata for a specific action (for retry)
  resetActionExecution(actionId: string): void {
    const currentMeta = this.getExecutionMeta(actionId);
    
    this.updateExecutionMeta(actionId, {
      status: 'pending',
      error: undefined,
      executedAt: null,
      // Keep the attempts count
      attempts: currentMeta.attempts
    });
  }
  
  // Get all values in the context
  getAllValues(): Record<string, any> {
    return { ...this.values };
  }
  
  // Get all execution metadata
  getAllExecutionMeta(): Record<string, any> {
    return { ...this.executionMeta };
  }
  
  // Reset the context
  reset(): void {
    this.values = {};
    this.executionMeta = {};
    // Notify subscribers of change
    this.notifySubscribers();
  }
  
  // Save the current execution state to the Webdraw filesystem
  async saveExecutionState(sdk: any, appName: string): Promise<void> {
    try {
      // Save current state to app config
      await this.saveCurrentExecutionToAppConfig(sdk, appName);
      
      // Save to execution history
      await this.saveExecutionToHistory(sdk, appName);
    } catch (error) {
      console.error('Failed to save execution state:', error);
    }
  }
  
  // Save current execution to app config
  private async saveCurrentExecutionToAppConfig(sdk: any, appName: string): Promise<void> {
    try {
      // Get the app config file path
      const appConfigPath = `~/Hector/apps/${appName}.json`;
      
      // Read the current app config
      const appConfigContent = await sdk.fs.readFile(appConfigPath);
      const appConfig = JSON.parse(appConfigContent);
      
      // Add/update the current execution state
      appConfig.currentExecution = {
        values: this.values,
        executionMeta: this.executionMeta,
        updatedAt: new Date().toISOString()
      };
      
      // Write the updated app config
      await sdk.fs.writeFile(appConfigPath, JSON.stringify(appConfig, null, 2));
    } catch (error) {
      console.error('Failed to save current execution to app config:', error);
      throw error;
    }
  }
  
  // Save execution to history
  private async saveExecutionToHistory(sdk: any, appName: string): Promise<void> {
    try {
      // Generate timestamp for the execution file
      const timestamp = new Date().toISOString().replace(/:/g, '-');
      
      // Ensure directory exists
      await sdk.fs.mkdir(`~/Hector/executions/${appName}`, { recursive: true });
      
      // Create the execution history file
      const executionPath = `~/Hector/executions/${appName}/${timestamp}.json`;
      
      // Create the execution data
      const executionData = {
        values: this.values,
        executionMeta: this.executionMeta,
        timestamp: new Date().toISOString()
      };
      
      // Write the execution data
      await sdk.fs.writeFile(executionPath, JSON.stringify(executionData, null, 2));
    } catch (error) {
      console.error('Failed to save execution to history:', error);
      throw error;
    }
  }
  
  // Load execution state from app config
  async loadCurrentExecution(sdk: any, appName: string): Promise<boolean> {
    try {
      // Get the app config file path
      const appConfigPath = `~/Hector/apps/${appName}.json`;
      
      // Read the current app config
      const appConfigContent = await sdk.fs.readFile(appConfigPath);
      const appConfig = JSON.parse(appConfigContent);
      
      // Check if there's a current execution state
      if (appConfig.currentExecution) {
        this.values = appConfig.currentExecution.values || {};
        this.executionMeta = appConfig.currentExecution.executionMeta || {};
        
        // Notify subscribers of change
        this.notifySubscribers();
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Failed to load current execution:', error);
      return false;
    }
  }
  
  // Load a specific execution from history
  async loadExecutionFromHistory(sdk: any, appName: string, timestamp: string): Promise<boolean> {
    try {
      // Get the execution file path
      const executionPath = `~/Hector/executions/${appName}/${timestamp}.json`;
      
      // Read the execution data
      const executionContent = await sdk.fs.readFile(executionPath);
      const executionData = JSON.parse(executionContent);
      
      // Load the execution state
      this.values = executionData.values || {};
      this.executionMeta = executionData.executionMeta || {};
      
      // Notify subscribers of change
      this.notifySubscribers();
      return true;
    } catch (error) {
      console.error('Failed to load execution from history:', error);
      return false;
    }
  }
  
  // Subscribers for state changes
  private subscribers: Array<(state: any) => void> = [];
  
  // Subscribe to changes in the execution context
  subscribe(callback: (state: any) => void): () => void {
    this.subscribers.push(callback);
    
    // Return unsubscribe function
    return () => {
      this.subscribers = this.subscribers.filter(cb => cb !== callback);
    };
  }
  
  // Notify subscribers of changes
  private notifySubscribers(): void {
    const state = {
      values: this.getAllValues(),
      executionMeta: this.getAllExecutionMeta()
    };
    
    this.subscribers.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in subscriber callback:', error);
      }
    });
  }
  
  // Serialize the current state (for saving/restoring)
  serialize(): string {
    return JSON.stringify({
      values: this.values,
      executionMeta: this.executionMeta,
      dependencies: this.dependencies,
      circularDependencies: this.circularDependencies
    });
  }
  
  // Restore from serialized state
  static fromSerialized(serialized: string): ExecutionContext {
    const context = new ExecutionContext();
    const { values, executionMeta, dependencies, circularDependencies } = JSON.parse(serialized);
    
    context.values = values || {};
    context.executionMeta = executionMeta || {};
    context.dependencies = dependencies || {};
    context.circularDependencies = circularDependencies || [];
    
    return context;
  }
  
  // Get playable actions from a list of actions
  getPlayableActions(actions: ActionData[]): ActionData[] {
    return actions.filter(action => this.canExecuteAction(action));
  }
  
  // Get status for all actions
  getActionStatuses(actions: ActionData[]): Record<string, {
    playable: boolean;
    executed: boolean;
    executedAt: Date | null;
    status: string;
    missingDependencies: string[];
    hasCircularDependency: boolean;
  }> {
    const result: Record<string, any> = {};
    
    actions.forEach(action => {
      const prompt = typeof action.prompt === 'object' 
        ? action.prompt.EN || Object.values(action.prompt)[0] 
        : action.prompt;
      
      const dependencies = this.extractReferences(prompt);
      const missingDependencies = dependencies.filter(dep => !this.hasValue(dep));
      
      // Check for circular dependencies
      let hasCircularDependency = false;
      if (this.hasCircularDependencies()) {
        const cycles = this.getCircularDependencies();
        hasCircularDependency = cycles.some(cycle => cycle.cycle.includes(action.output_filename));
      }
      
      const meta = this.getExecutionMeta(action.id);
      
      result[action.id] = {
        playable: this.canExecuteAction(action),
        executed: meta.status === 'completed',
        executedAt: meta.executedAt,
        status: meta.status,
        error: meta.error,
        attempts: meta.attempts,
        missingDependencies,
        hasCircularDependency
      };
    });
    
    return result;
  }
}
```

## 13. Result Visualization Components

Based on the specified preferences for visualizing results, here are the components that will be used:

### 13.1 TextResult Component

For displaying text generation results:

```typescript
interface TextResultProps {
  value: string;
  maxHeight?: string;
}

const TextResult: React.FC<TextResultProps> = ({ value, maxHeight = '200px' }) => {
  return (
    <div className="text-result">
      <textarea
        readOnly
        value={value || ''}
        style={{ 
          width: '100%', 
          maxHeight, 
          overflowY: 'auto',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #d9d9d9',
          fontSize: '14px',
          lineHeight: '1.5'
        }}
        rows={Math.min(10, (value?.split('\n').length || 0) + 2)}
      />
    </div>
  );
};
```

### 13.2 JSONResult Component

For displaying JSON generation results:

```typescript
interface JSONResultProps {
  value: any;
  maxHeight?: string;
}

const JSONResult: React.FC<JSONResultProps> = ({ value, maxHeight = '200px' }) => {
  // Format JSON with indentation
  const formattedValue = value ? JSON.stringify(value, null, 2) : '';
  
  return (
    <div className="json-result">
      <textarea
        readOnly
        value={formattedValue}
        style={{ 
          width: '100%', 
          maxHeight, 
          overflowY: 'auto',
          padding: '8px',
          borderRadius: '4px',
          border: '1px solid #d9d9d9',
          fontFamily: 'monospace',
          fontSize: '14px',
          lineHeight: '1.5',
          whiteSpace: 'pre'
        }}
        rows={Math.min(15, (formattedValue?.split('\n').length || 0) + 2)}
      />
    </div>
  );
};
```

### 13.3 ImageResult Component

For displaying image generation results:

```typescript
interface ImageResultProps {
  value: { filepath?: string; base64?: string; } | string;
  maxHeight?: string;
}

const ImageResult: React.FC<ImageResultProps> = ({ value, maxHeight = '300px' }) => {
  // Handle different formats of image data
  let imageSrc = '';
  
  if (typeof value === 'string') {
    imageSrc = value;
  } else if (value && typeof value === 'object') {
    // Prefer base64 for immediate display
    imageSrc = value.base64 || value.filepath || '';
  }
  
  if (!imageSrc) {
    return <div className="image-result-empty">No image available</div>;
  }
  
  return (
    <div className="image-result">
      <img 
        src={imageSrc} 
        alt="Generated content" 
        style={{ 
          maxWidth: '100%', 
          maxHeight,
          display: 'block',
          margin: '0 auto',
          borderRadius: '4px'
        }} 
      />
    </div>
  );
};
```

### 13.4 AudioResult Component

For displaying audio generation results:

```typescript
interface AudioResultProps {
  value: { filepath?: string; base64?: string; } | string;
}

const AudioResult: React.FC<AudioResultProps> = ({ value }) => {
  // Handle different formats of audio data
  let audioSrc = '';
  
  if (typeof value === 'string') {
    audioSrc = value;
  } else if (value && typeof value === 'object') {
    audioSrc = value.filepath || '';
  }
  
  if (!audioSrc) {
    return <div className="audio-result-empty">No audio available</div>;
  }
  
  return (
    <div className="audio-result">
      <audio 
        controls 
        src={audioSrc} 
        style={{ 
          width: '100%',
          margin: '10px 0'
        }} 
      />
    </div>
  );
};
```

### 13.5 ResultVisualization Component

A unified component that renders the appropriate visualization based on content type:

```typescript
interface ResultVisualizationProps {
  value: any;
  type: string; // 'text', 'json', 'image', 'audio'
  filename: string;
}

const ResultVisualization: React.FC<ResultVisualizationProps> = ({ value, type, filename }) => {
  // Determine the content type based on the filename extension if not explicitly provided
  let contentType = type;
  
  if (!contentType) {
    if (filename.endsWith('.json')) {
      contentType = 'json';
    } else if (filename.endsWith('.md') || filename.endsWith('.txt')) {
      contentType = 'text';
    } else if (filename.endsWith('.png') || filename.endsWith('.jpg') || filename.endsWith('.jpeg')) {
      contentType = 'image';
    } else if (filename.endsWith('.mp3') || filename.endsWith('.wav')) {
      contentType = 'audio';
    } else {
      contentType = 'text'; // Default to text
    }
  }
  
  // Render the appropriate visualization component
  switch (contentType) {
    case 'json':
      return <JSONResult value={value} />;
      
    case 'image':
      return <ImageResult value={value} />;
      
    case 'audio':
      return <AudioResult value={value} />;
      
    case 'text':
    default:
      return <TextResult value={typeof value === 'string' ? value : JSON.stringify(value, null, 2)} />;
  }
};
```

## 14. Error Handling and Retry Mechanism

Based on the specified requirements for error handling and retries, here's the implementation:

### 14.1 Error Display Component

```typescript
interface ErrorMessageProps {
  error: {
    message: string;
    details?: any;
  };
  onRetry?: () => void;
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({ error, onRetry }) => {
  return (
    <div 
      className="error-message" 
      style={{ 
        padding: '10px', 
        backgroundColor: '#fff2f0', 
        border: '1px solid #ffccc7',
        borderRadius: '4px',
        marginBottom: '10px'
      }}
    >
      <div style={{ color: '#ff4d4f', marginBottom: '8px', fontWeight: 'bold' }}>
        Error: {error.message}
      </div>
      
      {error.details && (
        <div style={{ fontSize: '12px', marginBottom: '8px' }}>
          <details>
            <summary>Show details</summary>
            <pre style={{ whiteSpace: 'pre-wrap' }}>
              {typeof error.details === 'object' 
                ? JSON.stringify(error.details, null, 2) 
                : String(error.details)}
            </pre>
          </details>
        </div>
      )}
      
      {onRetry && (
        <button 
          onClick={onRetry}
          style={{
            backgroundColor: '#ff4d4f',
            color: 'white',
            border: 'none',
            padding: '4px 12px',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Retry Action
        </button>
      )}
    </div>
  );
};
```

### 14.2 Enhanced PlayActionButton with Retry

The PlayActionButton will be enhanced to handle errors and provide retry functionality:

```typescript
interface PlayActionButtonProps {
  action: ActionData;
  executionContext: ExecutionContext;
  sdk: any; // Webdraw SDK instance
  onActionComplete?: (result: any) => void;
}

const PlayActionButton: React.FC<PlayActionButtonProps> = ({ 
  action, 
  executionContext, 
  sdk, 
  onActionComplete 
}) => {
  const [loading, setLoading] = useState(false);
  
  const actionMeta = executionContext.getExecutionMeta(action.id);
  const isPlayable = executionContext.canExecuteAction(action);
  const hasError = actionMeta.status === 'error';
  
  const handleExecute = async () => {
    setLoading(true);
    
    try {
      // Update execution metadata
      executionContext.updateExecutionMeta(action.id, {
        status: 'executing',
        executedAt: new Date()
      });
      
      // Execute the action
      const result = await executeAction(action, executionContext, sdk);
      
      // Store the result
      executionContext.setValue(action.output_filename, result);
      
      // Update execution metadata
      executionContext.updateExecutionMeta(action.id, {
        status: 'completed',
        error: undefined
      });
      
      // Call the completion callback
      if (onActionComplete) {
        onActionComplete(result);
      }
    } catch (error) {
      console.error(`Error executing action ${action.id}:`, error);
      
      // Mark the action as failed
      executionContext.markActionFailed(action.id, error);
    } finally {
      setLoading(false);
    }
  };
  
  const handleRetry = () => {
    // Reset the action status
    executionContext.resetActionExecution(action.id);
    
    // Execute the action again
    handleExecute();
  };
  
  // Determine button appearance based on state
  let buttonType = 'primary';
  let buttonIcon = <PlayCircleOutlined />;
  let buttonText = 'Play';
  let disabled = false;
  
  if (loading) {
    buttonIcon = <LoadingOutlined />;
    buttonText = 'Running...';
    disabled = true;
  } else if (!isPlayable) {
    buttonType = 'default';
    buttonIcon = <LockOutlined />;
    buttonText = 'Locked';
    disabled = true;
  } else if (hasError) {
    buttonType = 'danger';
    buttonIcon = <WarningOutlined />;
    buttonText = 'Retry';
  } else if (actionMeta.status === 'completed') {
    buttonType = 'dashed';
    buttonIcon = <RedoOutlined />;
    buttonText = 'Run Again';
  }
  
  return (
    <div className="play-action-button">
      <Button
        type={buttonType}
        icon={buttonIcon}
        loading={loading}
        disabled={disabled}
        onClick={hasError ? handleRetry : handleExecute}
      >
        {buttonText}
      </Button>
      
      {actionMeta.executedAt && (
        <span className="execution-time" style={{ marginLeft: '8px', fontSize: '12px', color: '#888' }}>
          {hasError ? 'Failed at ' : 'Executed at '}
          {new Date(actionMeta.executedAt).toLocaleTimeString()}
          {actionMeta.attempts > 1 ? ` (${actionMeta.attempts} attempts)` : ''}
        </span>
      )}
      
      {hasError && actionMeta.error && (
        <ErrorMessage error={actionMeta.error} onRetry={handleRetry} />
      )}
    </div>
  );
};
```

## 15. Implementation Timeline

The implementation of the Hector Runtime Environment will follow this timeline:

### Phase 1: Core Infrastructure (Week 1)
- Implementation of the ExecutionContext class with error handling and persistence
- Set up RuntimeProvider and context
- Implement dependency resolution with circular dependency detection

### Phase 2: UI Components (Week 2)
- Create InputCard test mode
- Build PlayActionButton with retry functionality
- Develop result visualization components for different content types
- Implement RuntimeModeToggle and control panel

### Phase 3: Integration and Testing (Week 3)
- Connect UI components with ExecutionContext
- Implement persistence logic with SDK
- Add error handling and displays
- Comprehensive testing with various app configurations

### Phase 4: Refinement and Documentation (Week 4)
- Performance optimization
- Usability improvements
- Complete documentation
- Final testing and bug fixes 