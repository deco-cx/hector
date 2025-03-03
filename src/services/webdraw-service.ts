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
            const content = await this.sdk.fs.readFile({ path: file });
            return JSON.parse(content) as AppConfig;
          } catch (error) {
            console.error(`Error reading file ${file}:`, error);
            // Return a minimal placeholder for corrupted files
            return {
              id: file.split('/').pop()?.replace('.json', '') || 'unknown',
              name: `Error loading app (${file})`,
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
      const content = await this.sdk.fs.readFile({ path });
      console.log("File content loaded successfully");
      return JSON.parse(content) as AppConfig;
    } catch (error) {
      console.error("Error reading app file:", error);
      throw error;
    }
  }

  async saveApp(app: AppConfig): Promise<void> {
    const path = `${this.APPS_PATH}${app.id}.json`;
    console.log("Saving app file to path:", path);
    try {
      await this.sdk.fs.writeFile({
        path,
        content: JSON.stringify(app, null, 2)
      });
      console.log("File saved successfully");
    } catch (error) {
      console.error("Error saving app file:", error);
      throw error;
    }
  }

  async deleteApp(id: string): Promise<void> {
    const path = `${this.APPS_PATH}${id}.json`;
    await this.sdk.fs.delete({ path });
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
    await this.sdk.fs.writeFile({ path, content });
  }

  async getExecutionResult(filename: string): Promise<string> {
    const path = `${this.EXECUTIONS_PATH}${filename}`;
    return this.sdk.fs.readFile({ path });
  }
} 