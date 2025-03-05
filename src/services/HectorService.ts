import webdrawSDK from '../sdk/WebdrawSDK';
import { AppConfig, WebdrawSDK } from '../types/types';
import { ExecutionState, ExecutionMetadata } from '../components/Runtime/ExecutionContext';

/**
 * Service for Hector-specific operations.
 * This includes app and execution management, and provides access to the SDK.
 */
export class HectorService {
  private static instance: HectorService | null = null;
  private readonly APPS_PATH = '~/Hector/apps/';
  private readonly EXECUTIONS_PATH = '~/Hector/executions/';
  
  private constructor() {
    // No need to initialize anything - SDK is already initialized
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): HectorService {
    if (!HectorService.instance) {
      HectorService.instance = new HectorService();
    }
    return HectorService.instance;
  }
  
  /**
   * Reset the service (for testing)
   */
  public static reset(): void {
    HectorService.instance = null;
  }
  
  /**
   * Get the underlying SDK
   */
  public getSDK(): WebdrawSDK {
    return webdrawSDK;
  }
  
  /**
   * Execute AI object generation - compatibility method for existing components
   * @param options Options for generation including prompt and schema
   */
  public async executeAIGenerateObject(options: {
    prompt: string;
    schema: {
      type: "object";
      properties: Record<string, any>;
      required?: string[];
    };
    temperature?: number;
  }): Promise<any> {
    // Type the schema properly to match the ObjectPayload interface
    const schema = {
      type: "object" as const,
      properties: options.schema.properties
    };
    
    // Use the SDK's AI interface to generate the object
    return this.getSDK().ai.generateObject({
      prompt: options.prompt,
      schema,
      temperature: options.temperature || 0.7
    });
  }
  
  /**
   * List all available apps
   */
  public async listApps(): Promise<AppConfig[]> {
    try {
      console.log("Listing apps from path:", this.APPS_PATH);
      
      // Ensure the directory exists
      await this.ensureDirectory(this.APPS_PATH);
      
      const files = await this.getSDK().fs.list(this.APPS_PATH);
      console.log("Found files:", files);
      
      const jsonFiles = files.filter(file => file.endsWith('.json'));
      console.log("JSON files:", jsonFiles);
      
      if (jsonFiles.length === 0) {
        console.log("No app files found");
        return [];
      }
      
      const apps = await Promise.all(
        jsonFiles.map(async (file) => {
          try {
            const content = await this.getSDK().fs.read(file);
            const appData = JSON.parse(content) as AppConfig;
            
            // Extract just the filename from the path for display
            const filename = file.split('/').pop() || '';
            const filenameWithoutExt = filename.replace('.json', '');
            
            // If the app doesn't have a valid ID, use the filename
            if (!appData.id) {
              appData.id = filenameWithoutExt;
            }
            
            return appData;
          } catch (error) {
            console.error(`Error reading file ${file}:`, error);
            
            // Return a minimal placeholder for corrupted files
            const filename = file.split('/').pop() || 'unknown';
            const filenameWithoutExt = filename.replace('.json', '');
            
            return {
              id: filenameWithoutExt,
              name: { 'en-US': filenameWithoutExt },
              template: 'unknown',
              style: 'unknown',
              inputs: [],
              actions: [],
              output: [],
              supportedLanguages: ['en-US']
            } as AppConfig;
          }
        })
      );
      
      return apps;
    } catch (error) {
      console.error("Error listing apps:", error);
      return [];
    }
  }
  
  /**
   * Get a specific app by ID
   */
  public async getApp(id: string): Promise<AppConfig> {
    const path = `${this.APPS_PATH}${id}.json`;
    console.log("Reading app file from path:", path);
    
    try {
      // Check if the file exists
      const exists = await this.getSDK().fs.exists(path);
      if (!exists) {
        throw new Error(`App not found: ${id}`);
      }
      
      const content = await this.getSDK().fs.read(path);
      console.log("File content loaded successfully");
      
      // Parse the content
      const appData = JSON.parse(content) as AppConfig;
      
      // Log the loaded app data (for debugging)
      console.log("Loaded app data:", {
        id: appData.id,
        name: appData.name,
        hasOutputProp: Boolean(appData.output),
        hasInputsProp: Boolean(appData.inputs),
        hasActionsProp: Boolean(appData.actions)
      });
      
      return appData;
    } catch (error) {
      console.error("Error reading app file:", error);
      throw error;
    }
  }
  
  /**
   * Save an app
   */
  public async saveApp(app: AppConfig): Promise<void> {
    if (!app) {
      throw new Error("Cannot save null or undefined app");
    }
    
    if (!app.id) {
      throw new Error("App ID is required for saving");
    }
    
    const path = `${this.APPS_PATH}${app.id}.json`;
    console.log("Saving app file to path:", path);
    
    try {
      // Make sure directory exists
      await this.ensureDirectory(this.APPS_PATH);
      
      // Serialize and save
      const serializedApp = JSON.stringify(app, null, 2);
      await this.getSDK().fs.write(path, serializedApp);
      
      console.log(`App saved successfully to ${path}`);
    } catch (error) {
      console.error("Error saving app file:", error);
      throw error;
    }
  }
  
  /**
   * Delete an app
   */
  public async deleteApp(id: string): Promise<void> {
    if (!id) {
      throw new Error("App ID is required for deletion");
    }
    
    const path = `${this.APPS_PATH}${id}.json`;
    console.log("Deleting app file:", path);
    
    try {
      const exists = await this.getSDK().fs.exists(path);
      if (!exists) {
        console.warn(`App file does not exist: ${path}`);
        return;
      }
      
      await this.getSDK().fs.remove(path);
      console.log(`App deleted successfully: ${id}`);
    } catch (error) {
      console.error("Error deleting app:", error);
      throw error;
    }
  }
  
  /**
   * Save the current execution state as part of the app config
   */
  public async saveCurrentExecution(
    appId: string, 
    values: Record<string, any>,
    executionMeta: Record<string, ExecutionMetadata>
  ): Promise<void> {
    try {
      // Get the current app config
      const appConfig = await this.getApp(appId);
      
      // Update with the current execution state
      appConfig.currentExecution = {
        values: JSON.parse(JSON.stringify(values)),
        executionMeta: JSON.parse(JSON.stringify(executionMeta)),
        timestamp: new Date().toISOString()
      };
      
      // Save the updated app config
      await this.saveApp(appConfig);
      console.log(`Current execution state saved for app: ${appId}`);
    } catch (error) {
      console.error("Error saving current execution:", error);
      throw error;
    }
  }
  
  /**
   * Save an execution state to the executions history
   */
  public async saveExecution(
    appId: string, 
    state: ExecutionState
  ): Promise<string> {
    try {
      // Create timestamp for filename
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const executionPath = `${this.EXECUTIONS_PATH}${appId}/`;
      const filename = `${executionPath}${timestamp}.json`;
      
      // Ensure directories exist
      await this.ensureDirectory(this.EXECUTIONS_PATH);
      await this.ensureDirectory(executionPath);
      
      // Serialize and save
      await this.getSDK().fs.write(filename, JSON.stringify(state, null, 2));
      console.log(`Execution state saved to ${filename}`);
      
      return timestamp;
    } catch (error) {
      console.error("Error saving execution state:", error);
      throw error;
    }
  }
  
  /**
   * Load a specific execution state from history
   */
  public async loadExecution(
    appId: string, 
    timestamp: string
  ): Promise<ExecutionState> {
    try {
      const filePath = `${this.EXECUTIONS_PATH}${appId}/${timestamp}.json`;
      
      const exists = await this.getSDK().fs.exists(filePath);
      if (!exists) {
        throw new Error(`Execution state file not found: ${filePath}`);
      }
      
      const stateContent = await this.getSDK().fs.read(filePath);
      return JSON.parse(stateContent) as ExecutionState;
    } catch (error) {
      console.error("Error loading execution state:", error);
      throw error;
    }
  }
  
  /**
   * List all available executions for an app
   */
  public async listExecutions(appId: string): Promise<string[]> {
    try {
      const executionPath = `${this.EXECUTIONS_PATH}${appId}/`;
      
      // Check if directory exists
      const exists = await this.getSDK().fs.exists(executionPath);
      if (!exists) {
        return [];
      }
      
      const files = await this.getSDK().fs.list(executionPath);
      return files
        .filter(file => file.endsWith('.json'))
        .map(file => {
          const filename = file.split('/').pop() || '';
          return filename.replace('.json', '');
        })
        .sort((a, b) => b.localeCompare(a)); // Sort descending (newest first)
    } catch (error) {
      console.error("Error listing executions:", error);
      return [];
    }
  }
  
  /**
   * Ensure a directory exists
   */
  private async ensureDirectory(path: string): Promise<void> {
    try {
      const exists = await this.getSDK().fs.exists(path);
      if (!exists) {
        await this.getSDK().fs.mkdir(path, { recursive: true });
      }
    } catch (error) {
      console.error(`Error ensuring directory ${path}:`, error);
      throw error;
    }
  }
} 