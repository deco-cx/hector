import webdrawSDK from '../sdk/WebdrawSDK';
import { AppConfig, WebdrawSDK } from '../types/types';

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
   * Normalize app data with defaults when fields are missing
   */
  private normalizeAppData(appData: Partial<AppConfig>): AppConfig {
    return {
      id: appData.id || crypto.randomUUID(),
      name: appData.name || { en: 'Untitled App' },
      template: appData.template || 'default',
      style: appData.style || '',
      inputs: appData.inputs || [],
      actions: appData.actions || [],
      output: appData.output || [],
      supportedLanguages: appData.supportedLanguages || ['en'],
      selectedLanguage: appData.selectedLanguage || 'en'
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
          const appPath = `${this.APPS_PATH}${file}`;
          const appContent = await sdk.fs.read(appPath);
          
          if (typeof appContent === 'string') {
            const appData = JSON.parse(appContent);
            apps.push(this.normalizeAppData(appData));
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
      const appPath = `${this.APPS_PATH}${id}.json`;
      
      // Check if the file exists
      const exists = await sdk.fs.exists(appPath);
      
      if (!exists) {
        // Create a new app if it doesn't exist
        const newApp = this.normalizeAppData({ id });
        await this.saveApp(newApp);
        return newApp;
      }
      
      // Load existing app
      const appContent = await sdk.fs.read(appPath);
      
      if (typeof appContent === 'string') {
        const appData = JSON.parse(appContent);
        return this.normalizeAppData(appData);
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
      
      // Normalize the app data
      const normalizedApp = this.normalizeAppData(app);
      
      // Save the app
      const appPath = `${this.APPS_PATH}${normalizedApp.id}.json`;
      await sdk.fs.write(appPath, JSON.stringify(normalizedApp, null, 2));
      
      console.log(`App ${normalizedApp.id} saved`);
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