import webdrawSDK from '../sdk/WebdrawSDK';
import { AppConfig, WebdrawSDK, isValidAppConfig } from '../types/types';

/**
 * Service for Hector-specific operations.
 * This includes app management, and provides access to the SDK.
 */
export class HectorService {
  private static instance: HectorService | null = null;
  private readonly APPS_PATH = '~/Hector/apps/';
  
  private constructor() {
    // No need to initialize anything - SDK is already initialized
  }
  
  /**
   * Get the singleton instance of HectorService
   */
  public static getInstance(): HectorService {
    if (!HectorService.instance) {
      HectorService.instance = new HectorService();
    }
    
    return HectorService.instance;
  }
  
  /**
   * Reset the singleton instance (primarily for testing)
   */
  public static reset(): void {
    HectorService.instance = null;
  }
  
  /**
   * Validate app data and return a boolean indicating if it's valid
   * Logs errors to console if validation fails
   */
  private validateAppData(appData: any, source: string = 'unknown'): boolean {
    if (!isValidAppConfig(appData)) {
      console.error(`Invalid app data from ${source}:`, appData);
      return false;
    }
    return true;
  }
  
  /**
   * Create a default app with the given ID
   */
  private createDefaultApp(id: string): AppConfig {
    return {
      id,
      name: { 'en-US': 'Untitled App' },
      template: 'default',
      style: '',
      inputs: [],
      actions: [],
      output: [],
      supportedLanguages: ['en-US'],
      selectedLanguage: 'en-US'
    };
  }
  
  /**
   * Get the WebDraw SDK instance
   */
  public getSDK(): WebdrawSDK {
    return webdrawSDK;
  }
  
  /**
   * Execute AI object generation
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
    const sdk = this.getSDK();
    if (!sdk.ai) {
      throw new Error('AI functionality not available in SDK');
    }
    
    const result = await sdk.ai.generateObject({
      prompt: options.prompt,
      schema: options.schema,
      temperature: options.temperature || 0.7
    });
    
    return result.object;
  }
  
  /**
   * List all available apps
   */
  public async listApps(): Promise<AppConfig[]> {
    const sdk = this.getSDK();
    if (!sdk.fs) {
      throw new Error('File system not available in SDK');
    }
    
    try {
      // Ensure the apps directory exists
      await this.ensureDirectory(this.APPS_PATH);
      
      // List all files in the apps directory
      const files = await sdk.fs.list(this.APPS_PATH);
      
      // Filter for .json files
      const appFiles = files.filter(file => file.endsWith('.json'));
      
      // Load each app
      const apps: AppConfig[] = [];
      
      for (const file of appFiles) {
        try {
          // Use the file path directly as it's already absolute
          const appContent = await sdk.fs.read(file);
          
          if (typeof appContent === 'string') {
            try {
              const appData = JSON.parse(appContent);
              if (this.validateAppData(appData, file)) {
                apps.push(appData as AppConfig);
              }
            } catch (parseError) {
              console.error(`Error parsing JSON from ${file}:`, parseError);
            }
          }
        } catch (err) {
          console.error(`Error loading app from ${file}:`, err);
        }
      }
      
      return apps;
    } catch (error) {
      console.error('Error listing apps:', error);
      throw error;
    }
  }
  
  /**
   * Get an app by ID
   */
  public async getApp(id: string): Promise<AppConfig> {
    const sdk = this.getSDK();
    if (!sdk.fs) {
      throw new Error('File system not available in SDK');
    }
    
    try {
      // The full path is constructed only when checking existence or reading
      const appPath = `${this.APPS_PATH}${id}.json`;
      
      // Check if the file exists
      const exists = await sdk.fs.exists(appPath);
      
      if (!exists) {
        // Create a new app if it doesn't exist
        const newApp = this.createDefaultApp(id);
        await this.saveApp(newApp);
        return newApp;
      }
      
      // Load existing app - since exists() was successful, we know the path works
      const appContent = await sdk.fs.read(appPath);
      
      if (typeof appContent === 'string') {
        try {
          const appData = JSON.parse(appContent);
          if (this.validateAppData(appData, appPath)) {
            return appData as AppConfig;
          } else {
            // If validation fails, create a new default app
            console.warn(`App ${id} failed validation, creating a new default app`);
            const newApp = this.createDefaultApp(id);
            await this.saveApp(newApp);
            return newApp;
          }
        } catch (parseError) {
          console.error(`Error parsing JSON from ${appPath}:`, parseError);
          // If parsing fails, create a new default app
          const newApp = this.createDefaultApp(id);
          await this.saveApp(newApp);
          return newApp;
        }
      }
      
      throw new Error('Invalid app data format');
    } catch (error) {
      console.error(`Error getting app ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Save an app
   */
  public async saveApp(app: AppConfig): Promise<void> {
    const sdk = this.getSDK();
    if (!sdk.fs) {
      throw new Error('File system not available in SDK');
    }
    
    try {
      // Ensure the apps directory exists
      await this.ensureDirectory(this.APPS_PATH);
      
      // Validate the app data
      if (!this.validateAppData(app, 'saveApp')) {
        throw new Error('Invalid app data');
      }
      
      // Save the app - using full path
      const appPath = `${this.APPS_PATH}${app.id}.json`;
      await sdk.fs.write(appPath, JSON.stringify(app, null, 2));
      
      console.log(`App ${app.id} saved`);
    } catch (error) {
      console.error('Error saving app:', error);
      throw error;
    }
  }
  
  /**
   * Delete an app
   */
  public async deleteApp(id: string): Promise<void> {
    const sdk = this.getSDK();
    if (!sdk.fs) {
      throw new Error('File system not available in SDK');
    }
    
    try {
      // Create the full path
      const appPath = `${this.APPS_PATH}${id}.json`;
      
      // Check if the file exists
      const exists = await sdk.fs.exists(appPath);
      
      if (!exists) {
        console.log(`App ${id} does not exist`);
        return;
      }
      
      // Delete the app
      await sdk.fs.remove(appPath);
      console.log(`App ${id} deleted`);
    } catch (error) {
      console.error(`Error deleting app ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Ensure a directory exists
   */
  private async ensureDirectory(path: string): Promise<void> {
    const sdk = this.getSDK();
    if (!sdk.fs) {
      throw new Error('File system not available in SDK');
    }
    
    try {
      const exists = await sdk.fs.exists(path);
      
      if (!exists) {
        await sdk.fs.mkdir(path, { recursive: true });
      }
    } catch (error) {
      console.error(`Error ensuring directory ${path}:`, error);
      throw error;
    }
  }
} 