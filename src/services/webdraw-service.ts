import { WebdrawSDK, AppConfig, Action } from '../types/webdraw';

export class WebdrawService {
  private sdk: WebdrawSDK;
  private readonly APPS_PATH = '~/Hector/apps/';
  private readonly EXECUTIONS_PATH = '~/Hector/executions/';

  constructor(sdk: WebdrawSDK) {
    this.sdk = sdk;
  }

  async getCurrentUser() {
    return this.sdk.getUser();
  }

  async listApps(): Promise<AppConfig[]> {
    console.log("Listing apps from path:", this.APPS_PATH);
    try {
      const files = await this.sdk.fs.list(this.APPS_PATH);
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
            console.log("Reading file:", file);
            const content = await this.sdk.fs.read(file);
            const appData = JSON.parse(content) as AppConfig;
            
            // Extract just the filename from the path for display
            const filename = file.split('/').pop() || '';
            const filenameWithoutExt = filename.replace('.json', '');
            
            // If the app name is a path or missing, replace it with the simplified filename
            if (!appData.name || appData.name.includes('/')) {
              appData.name = filenameWithoutExt;
            }
            
            return appData;
          } catch (error) {
            console.error(`Error reading file ${file}:`, error);
            // Return a minimal placeholder for corrupted files
            const filename = file.split('/').pop() || 'unknown';
            const filenameWithoutExt = filename.replace('.json', '');
            
            return {
              id: filenameWithoutExt,
              name: filenameWithoutExt, // Simplified name
              template: 'unknown',
              style: 'unknown',
              inputs: [],
              actions: [],
              output: {
                type: 'html',
                format: 'standard',
                files: []
              }
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

  async getApp(id: string): Promise<AppConfig> {
    const path = `${this.APPS_PATH}${id}.json`;
    console.log("Reading app file from path:", path);
    try {
      const content = await this.sdk.fs.read(path);
      console.log("File content loaded successfully");
      
      // Parse the content
      const appData = JSON.parse(content) as AppConfig;
      
      // Log the loaded app data to check if style is defined
      console.log("Loaded app data:", {
        id: appData.id,
        name: appData.name,
        style: appData.style,
        template: appData.template,
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

  async saveApp(app: AppConfig): Promise<void> {
    if (!app) {
      throw new Error("Cannot save null or undefined app");
    }
    
    if (!app.id) {
      throw new Error("App ID is required for saving");
    }
    
    const path = `${this.APPS_PATH}${app.id}.json`;
    console.log("Saving app file to path:", path);
    
    try {
      // Make sure the directory exists
      await this.sdk.fs.mkdir(this.APPS_PATH, { recursive: true });
      
      // Convert app to string first to make sure we're not passing an object
      const appData = JSON.stringify(app, null, 2);
      console.log("Stringified app data for saving");
      
      // Try the new write method first
      try {
        await this.sdk.fs.write(path, appData);
        console.log("File saved successfully using write method");
      } catch (writeError) {
        console.warn("Write method failed, falling back to writeFile:", writeError);
        // Fall back to the old writeFile method if needed
        await this.sdk.fs.writeFile({
          path,
          content: appData
        });
        console.log("File saved successfully using writeFile method");
      }
    } catch (error) {
      console.error("Error saving app file:", error);
      throw error;
    }
  }

  async deleteApp(id: string): Promise<void> {
    const path = `${this.APPS_PATH}${id}.json`;
    await this.sdk.fs.remove(path);
  }

  async executeAction(action: Action, variables: Record<string, string>): Promise<string> {
    // Replace variables in the prompt
    const prompt = this.replaceVariables(action.prompt.EN, variables);
    
    switch (action.type) {
      case 'Gerar Texto': {
        const result = await this.sdk.ai.generateText({ prompt, ...action.parameters });
        await this.saveExecutionResult(action.output_filename, result.text);
        return result.text;
      }
      case 'Gerar Imagem': {
        const result = await this.sdk.ai.generateImage({ prompt, ...action.parameters });
        const imageUrl = result.images[0];
        await this.saveExecutionResult(action.output_filename, imageUrl);
        return imageUrl;
      }
      case 'Gerar JSON': {
        // For JSON generation, we need a schema
        const schema = {
          type: "object",
          properties: action.parameters?.schema || {}
        };
        
        const result = await this.sdk.ai.generateObject({ 
          prompt, 
          schema: schema as any
        });
        
        const content = JSON.stringify(result.object, null, 2);
        await this.saveExecutionResult(action.output_filename, content);
        return content;
      }
      case 'Gerar Aúdio': {
        // Mock audio generation since it's not in the SDK interface
        const audioUrl = `https://mock-audio-url.com/${Date.now()}`;
        await this.saveExecutionResult(action.output_filename, audioUrl);
        return audioUrl;
      }
      default:
        throw new Error(`Unsupported action type: ${action.type}`);
    }
  }

  private replaceVariables(text: string, variables: Record<string, string>): string {
    return Object.entries(variables).reduce((result, [key, value]) => {
      return result.replace(new RegExp(`{{${key}}}`, 'g'), value);
    }, text);
  }

  private async saveExecutionResult(filename: string, content: string): Promise<void> {
    const path = `${this.EXECUTIONS_PATH}${filename}`;
    try {
      // Try the new write method first
      try {
        await this.sdk.fs.write(path, content);
        console.log(`Execution result saved to ${filename} using write method`);
      } catch (writeError) {
        console.warn("Write method failed, falling back to writeFile:", writeError);
        // Fall back to the old writeFile method if needed
        await this.sdk.fs.writeFile({
          path,
          content
        });
        console.log(`Execution result saved to ${filename} using writeFile method`);
      }
    } catch (error) {
      console.error(`Error saving execution result to ${filename}:`, error);
      throw error;
    }
  }

  async getExecutionResult(filename: string): Promise<string> {
    const path = `${this.EXECUTIONS_PATH}${filename}`;
    try {
      // Try the new read method first
      try {
        return await this.sdk.fs.read(path);
      } catch (readError) {
        console.warn("Read method failed, falling back to readFile:", readError);
        // Fall back to the old readFile method if needed
        return await this.sdk.fs.readFile({ path });
      }
    } catch (error) {
      console.error(`Error reading execution result from ${filename}:`, error);
      throw error;
    }
  }
} 