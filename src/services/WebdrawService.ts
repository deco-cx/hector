import { WebdrawSDK, AppConfig } from '../types/webdraw';

export class WebdrawService {
  private sdk: WebdrawSDK;
  private static instance: WebdrawService;

  private constructor(sdk: WebdrawSDK) {
    this.sdk = sdk;
  }

  static initialize(sdk: WebdrawSDK): WebdrawService {
    if (!WebdrawService.instance) {
      WebdrawService.instance = new WebdrawService(sdk);
    }
    return WebdrawService.instance;
  }

  static getInstance(): WebdrawService {
    if (!WebdrawService.instance) {
      throw new Error('WebdrawService must be initialized with SDK first');
    }
    return WebdrawService.instance;
  }

  async getUser() {
    return this.sdk.getUser();
  }

  async listApps(): Promise<string[]> {
    console.log("Listing apps from path: ~/Hector/apps/");
    try {
      // Ensure the directory exists before trying to list files
      await this.sdk.fs.mkdir('~/Hector/apps', { recursive: true });
      
      return this.sdk.fs.list('~/Hector/apps').then(files => 
        files.filter(file => file.endsWith('.json'))
      );
    } catch (error) {
      console.error("Error listing apps:", error);
      return []; // Return empty array if there's an error
    }
  }

  async saveApp(appId: string, config: AppConfig): Promise<void> {
    const appPath = `~/Hector/apps/${appId}.json`;
    await this.sdk.fs.mkdir('~/Hector/apps', { recursive: true });
    await this.sdk.fs.write(
      appPath, 
      JSON.stringify(config, null, 2)
    );
  }

  async loadApp(appId: string): Promise<AppConfig> {
    const appPath = `~/Hector/apps/${appId}.json`;
    const content = await this.sdk.fs.read(appPath);
    return JSON.parse(content);
  }

  async deleteApp(appId: string): Promise<void> {
    const appPath = `~/Hector/apps/${appId}.json`;
    await this.sdk.fs.remove(appPath);
  }

  async generateText(prompt: string, options: any = {}) {
    return this.sdk.ai.generateText({
      prompt,
      ...options,
    });
  }

  async generateImage(prompt: string, options: any = {}) {
    return this.sdk.ai.generateImage({
      prompt,
      ...options,
    });
  }

  async generateObject<T>(prompt: string, schema: any, options: any = {}) {
    return this.sdk.ai.generateObject<T>({
      prompt,
      schema,
      ...options,
    });
  }
} 