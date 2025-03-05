import { WebdrawSDK, AIInterface, FileSystemInterface } from '../types/types';

/**
 * Main implementation of the WebdrawSDK interface.
 * This class follows a singleton pattern for global access.
 */
export class WebdrawSDKImpl implements WebdrawSDK {
  private static instance: WebdrawSDKImpl | null = null;
  
  // Core SDK properties
  public readonly fs: FileSystemInterface;
  public readonly ai: AIInterface;
  
  // Private constructor - use initialize() instead
  private constructor(externalSDK: any) {
    if (!externalSDK) {
      throw new Error('External SDK instance required');
    }
    
    // Initialize with the external SDK
    this.fs = externalSDK.fs;
    this.ai = externalSDK.ai;
    
    // Copy other methods directly
    this.getUser = externalSDK.getUser?.bind(externalSDK);
    this.redirectToLogin = externalSDK.redirectToLogin?.bind(externalSDK);
    this.hello = externalSDK.hello?.bind(externalSDK) || (() => 'WebdrawSDK ready');
    
    // Legacy methods (deprecated)
    this.imageVariation = externalSDK.imageVariation?.bind(externalSDK);
    this.upscaleImage = externalSDK.upscaleImage?.bind(externalSDK);
    this.removeBackground = externalSDK.removeBackground?.bind(externalSDK);
  }
  
  /**
   * Get the singleton instance
   * @throws Error if SDK not initialized
   */
  public static getInstance(): WebdrawSDKImpl {
    if (!WebdrawSDKImpl.instance) {
      throw new Error('SDK not initialized. Call initialize() first.');
    }
    return WebdrawSDKImpl.instance;
  }
  
  /**
   * Initialize the SDK with an external SDK instance
   * @param externalSDK The external SDK to wrap
   * @returns The WebdrawSDKImpl instance
   */
  public static initialize(externalSDK: any): WebdrawSDKImpl {
    if (!WebdrawSDKImpl.instance) {
      WebdrawSDKImpl.instance = new WebdrawSDKImpl(externalSDK);
      console.log('WebdrawSDK initialized successfully');
    } else {
      console.log('WebdrawSDK already initialized');
    }
    return WebdrawSDKImpl.instance;
  }
  
  /**
   * Resets the SDK instance (mainly for testing)
   */
  public static reset(): void {
    WebdrawSDKImpl.instance = null;
    console.log('WebdrawSDK reset');
  }
  
  /**
   * Validate that the SDK has all required methods
   * @returns True if valid, throws otherwise
   */
  public static validate(sdk: any): boolean {
    if (!sdk) {
      throw new Error('SDK instance is null or undefined');
    }
    
    // Check required properties
    if (!sdk.fs || typeof sdk.fs !== 'object') {
      throw new Error('SDK missing fs implementation');
    }
    
    if (!sdk.ai || typeof sdk.ai !== 'object') {
      throw new Error('SDK missing ai implementation');
    }
    
    // Check required methods
    const requiredFsMethods = ['read', 'write', 'exists', 'mkdir'];
    for (const method of requiredFsMethods) {
      if (typeof sdk.fs[method] !== 'function') {
        throw new Error(`SDK fs missing ${method} method`);
      }
    }
    
    return true;
  }
  
  // Required WebdrawSDK interface methods
  getUser: () => Promise<{ username: string } | null>;
  redirectToLogin: (options?: { appReturnUrl?: string }) => void;
  hello: () => string;
  
  // Legacy methods (deprecated)
  imageVariation?: (config: any) => Promise<any>;
  upscaleImage?: (config: any) => Promise<any>;
  removeBackground?: (config: any) => Promise<any>;
} 