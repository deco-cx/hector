import { Action } from '../types/webdraw';
import { AppConfig, OutputTemplate, WebdrawSDK } from '../types/types';

export class WebdrawService {
  private sdk: WebdrawSDK;
  private readonly APPS_PATH = '~/Hector/apps/';
  private readonly EXECUTIONS_PATH = '~/Hector/executions/';

  constructor(sdk: WebdrawSDK) {
    this.sdk = sdk;
  }

  // Add getter for accessing the SDK instance
  getSDK(): WebdrawSDK {
    return this.sdk;
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
            if (!appData.name || typeof appData.name === 'string' || (typeof appData.name === 'object' && 'includes' in appData.name)) {
              // Create a Localizable name
              appData.name = { 'en-US': filenameWithoutExt };
              
              // Ensure supportedLanguages is initialized
              if (!appData.supportedLanguages) {
                appData.supportedLanguages = ['en-US'];
              }
            }
            
            return appData;
          } catch (error) {
            console.error(`Error reading file ${file}:`, error);
            // Return a minimal placeholder for corrupted files
            const filename = file.split('/').pop() || 'unknown';
            const filenameWithoutExt = filename.replace('.json', '');
            
            return {
              id: filenameWithoutExt,
              name: { 'en-US': filenameWithoutExt }, // Localizable name
              template: 'unknown',
              style: 'unknown',
              inputs: [],
              actions: [],
              output: [], // Using empty array for the new OutputTemplate[] format
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
      // Make sure directory exists
      await this.sdk.fs.mkdir(this.APPS_PATH, { recursive: true });
      
      // We want to save the app data using the newer OutputTemplate[] format
      const serializedApp = JSON.stringify(app, null, 2);
      await this.sdk.fs.write(path, serializedApp);
      
      console.log(`App saved successfully to ${path}`);
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

  async executeAIGeneration(prompt: string): Promise<string> {
    try {
      console.log("Executing AI generation with prompt:", prompt);
      // Call the AI SDK to generate text
      const { text } = await this.sdk.ai.generateText({
        prompt,
        model: 'anthropic:claude-3-5-sonnet-latest'
      });
      return text;
    } catch (error) {
      console.error("Error executing AI generation:", error);
      throw error;
    }
  }

  async executeAIGenerateObject<T = any>(payload: { 
    prompt: string, 
    schema: { 
      type: "object", 
      properties: Record<string, any> 
    } 
  }): Promise<T> {
    try {
      console.log("======= EXECUTING AI GENERATE OBJECT =======");
      console.log("AI Generate Object request:");
      console.log("- Prompt:", payload.prompt);
      console.log("- Schema:", JSON.stringify(payload.schema, null, 2));
      
      // Make sure we use the correct method on the SDK
      if (!this.sdk.ai.generateObject) {
        console.error("SDK ERROR: generateObject method is not available on the AI SDK");
        throw new Error("SDK does not support generateObject - check SDK version");
      }
      
      // Call the AI SDK to generate an object according to the schema
      console.log("Calling SDK generateObject method...");
      const response = await this.sdk.ai.generateObject<T>({
        prompt: payload.prompt,
        schema: payload.schema
      });
      
      console.log("SDK generateObject response received:");
      console.log(JSON.stringify(response, null, 2));
      
      if (!response || !response.object) {
        console.error("SDK ERROR: generateObject response is missing the object property");
        throw new Error("Invalid response from AI generateObject");
      }
      
      const { object } = response;
      console.log("Result object:", JSON.stringify(object, null, 2));
      console.log("======= AI GENERATE OBJECT COMPLETED =======");
      
      return object;
    } catch (error) {
      console.error("======= AI GENERATE OBJECT ERROR =======");
      console.error("Error executing AI object generation:", error);
      
      // Log more details about the error
      if (error instanceof Error) {
        console.error("Error name:", error.name);
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      }
      
      // Rethrow the error for handling by the caller
      throw error;
    }
  }
} 