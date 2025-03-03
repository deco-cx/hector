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
    return this.sdk.fs.list('~/Hector/apps').then(files => 
      files.filter(file => file.endsWith('.json'))
    );
  }

  async saveApp(appId: string, config: AppConfig): Promise<void> {
    const appPath = `~/Hector/apps/${appId}.json`;
    await this.sdk.fs.mkdir('~/Hector/apps', { recursive: true });
    await this.sdk.fs.writeFile({
      path: appPath,
      content: JSON.stringify(config, null, 2),
    });
  }

  async loadApp(appId: string): Promise<AppConfig> {
    const appPath = `~/Hector/apps/${appId}.json`;
    const content = await this.sdk.fs.readFile({ path: appPath });
    return JSON.parse(content);
  }

  async deleteApp(appId: string): Promise<void> {
    const appPath = `~/Hector/apps/${appId}.json`;
    await this.sdk.fs.delete({ path: appPath });
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