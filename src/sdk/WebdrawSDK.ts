// @ts-ignore
import { SDK } from "https://webdraw.com/webdraw-sdk@v1";
import { WebdrawSDK, AIInterface, FileSystemInterface } from '../types/types';

/**
 * WebdrawSDK implementation that directly wraps the SDK from webdraw.com
 */
class WebdrawSDKWrapper implements WebdrawSDK {
  public readonly fs: FileSystemInterface;
  public readonly ai: AIInterface;
  
  constructor() {
    if (!SDK) {
      throw new Error('WebdrawSDK not available');
    }
    
    this.fs = SDK.fs;
    this.ai = SDK.ai;
  }
  
  /**
   * Get current user information
   */
  public getUser(): Promise<{ username: string } | null> {
    return SDK.getUser();
  }
  
  /**
   * Redirect to login page
   */
  public redirectToLogin(options?: { appReturnUrl?: string }): void {
    SDK.redirectToLogin(options);
  }
  
  /**
   * Simple hello function for testing connection
   */
  public hello(): string {
    return SDK.hello ? SDK.hello() : 'WebdrawSDK ready';
  }
  
  // Legacy methods (deprecated)
  public imageVariation = SDK.imageVariation?.bind(SDK);
  public upscaleImage = SDK.upscaleImage?.bind(SDK);
  public removeBackground = SDK.removeBackground?.bind(SDK);
}

// Export a single instance of the SDK
const webdrawSDK = new WebdrawSDKWrapper();
export default webdrawSDK; 