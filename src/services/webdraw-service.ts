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
    const files = await this.sdk.fs.list(this.APPS_PATH);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    const apps = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await this.sdk.fs.readFile({ path: file });
        return JSON.parse(content) as AppConfig;
      })
    );

    return apps;
  }

  async getApp(id: string): Promise<AppConfig> {
    const path = `${this.APPS_PATH}${id}.json`;
    const content = await this.sdk.fs.readFile({ path });
    return JSON.parse(content) as AppConfig;
  }

  async saveApp(app: AppConfig): Promise<void> {
    const path = `${this.APPS_PATH}${app.id}.json`;
    await this.sdk.fs.writeFile({
      path,
      content: JSON.stringify(app, null, 2),
    });
  }

  async deleteApp(id: string): Promise<void> {
    const path = `${this.APPS_PATH}${id}.json`;
    await this.sdk.fs.delete({ path });
  }

  async executeAction(action: Action, variables: Record<string, string>): Promise<string> {
    // Replace variables in prompt
    const prompt = Object.entries(variables).reduce(
      (acc, [key, value]) => acc.replace(`@${key}`, value),
      action.prompt.EN // Using English prompt for now
    );

    switch (action.type) {
      case 'Gerar Texto': {
        const result = await this.sdk.ai.generateText({ prompt, ...action.parameters });
        await this.saveExecutionResult(action.output_filename, result.text);
        return result.text;
      }
      case 'Gerar Imagem': {
        const result = await this.sdk.ai.generateImage({ prompt, ...action.parameters });
        await this.saveExecutionResult(action.output_filename, result.url);
        return result.url;
      }
      case 'Gerar Aúdio': {
        const result = await this.sdk.ai.generateAudio({ prompt, ...action.parameters });
        await this.saveExecutionResult(action.output_filename, result.url);
        return result.url;
      }
      case 'Gerar JSON': {
        const result = await this.sdk.ai.generateObject({ prompt, ...action.parameters });
        const content = JSON.stringify(result.data, null, 2);
        await this.saveExecutionResult(action.output_filename, content);
        return content;
      }
      default:
        throw new Error(`Unsupported action type: ${action.type}`);
    }
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