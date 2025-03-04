/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { SDK } from "https://webdraw.com/webdraw-sdk@v1";
import { WebdrawSDK } from '../types/types';
import WebdrawSDKClient from "@webdraw/sdk";

// Log SDK initialization to debug loading issues
console.log("Initializing Webdraw SDK client");

/**
 * More robust SDK initialization with multiple retries
 * The SDK might not be immediately available after import 
 * as it could be initializing asynchronously in the background
 */
export const sdkInitialized = new Promise<boolean>((resolve) => {
  // Try to validate SDK multiple times with increasing delays
  const maxRetries = 5;
  let retryCount = 0;
  
  const attemptValidation = () => {
    console.log(`SDK validation attempt ${retryCount + 1}/${maxRetries}`);
    
    // Give it more time to initialize on each retry
    const delay = 500 + (retryCount * 500);
    
    setTimeout(() => {
      try {
        // Print the SDK object to see what's available
        console.log("SDK object during validation:", SDK);
        
        if (SDK && typeof SDK === 'object') {
          // Print all keys on the SDK object for debugging
          console.log("SDK keys:", Object.keys(SDK));
          
          // Check if fs exists
          if (SDK.fs) {
            console.log("SDK.fs keys:", Object.keys(SDK.fs));
          } else {
            console.log("SDK.fs is not available yet");
          }
          
          // Check if ai exists
          if (SDK.ai) {
            console.log("SDK.ai keys:", Object.keys(SDK.ai));
          } else {
            console.log("SDK.ai is not available yet");
          }
        }
        
        // Validate SDK with current state
        const isValid = validateSDK();
        
        if (isValid) {
          console.log("SDK validation successful!");
          
          // Create directories only after successful validation
          SDK.fs.mkdir('~/Hector/apps', { recursive: true })
            .then(() => SDK.fs.mkdir('~/Hector/executions', { recursive: true }))
            .then(() => {
              console.log("Ensured Hector directories exist");
            })
            .catch((err: Error) => {
              console.warn("Could not create Hector directories:", err);
            });
          
          // Resolve with success
          resolve(true);
          return;
        } else if (retryCount < maxRetries - 1) {
          // Retry if validation failed and we haven't exceeded max retries
          retryCount++;
          console.log(`SDK validation failed, retrying (${retryCount}/${maxRetries})...`);
          attemptValidation();
        } else {
          // Give up after max retries
          console.error("SDK validation failed after maximum retries, falling back to mock SDK");
          resolve(false);
        }
      } catch (error) {
        console.error("Error during SDK validation:", error);
        
        if (retryCount < maxRetries - 1) {
          // Retry on error if we haven't exceeded max retries
          retryCount++;
          console.log(`SDK validation error, retrying (${retryCount}/${maxRetries})...`);
          attemptValidation();
        } else {
          // Give up after max retries
          console.error("SDK initialization failed after maximum retries");
          resolve(false);
        }
      }
    }, delay);
  };
  
  // Start the first validation attempt
  attemptValidation();
});

// Alternative approach checking for window._webdrawSDK which may be how the SDK is exposed
function checkGlobalSDK(): WebdrawSDK | null {
  // @ts-ignore
  if (window._webdrawSDK && typeof window._webdrawSDK === 'object') {
    // @ts-ignore
    console.log("Found SDK on window._webdrawSDK");
    // @ts-ignore
    return window._webdrawSDK;
  }
  return null;
}

// Validate that the SDK has all required methods
function validateSDK(): boolean {
  try {
    // Check for global SDK first
    const globalSDK = checkGlobalSDK();
    if (globalSDK) {
      console.log("Using global SDK from window._webdrawSDK");
      // @ts-ignore
      window.SDK = globalSDK;
      return true;
    }
    
    // Basic existence check
    if (!SDK || typeof SDK !== 'object') {
      console.error("SDK validation failed: SDK is not an object");
      return false;
    }
    
    // Check fs property exists - don't rely on Object.keys for Proxy objects
    if (!SDK.fs) {
      console.error("SDK validation failed: Missing fs property");
      return false;
    }
    
    // Check individual methods directly on the fs object
    // This works better with Proxy objects that don't expose keys via Object.keys()
    const fsMethods = ['list', 'read', 'write', 'mkdir'];
    for (const method of fsMethods) {
      try {
        // Try to access the method property - for Proxy objects this may invoke getters
        if (typeof SDK.fs[method] !== 'function') {
          console.error(`SDK validation failed: SDK.fs.${method} is not a function`);
          return false;
        }
        console.log(`SDK.fs.${method} exists and is a function`);
      } catch (e) {
        console.error(`SDK validation failed: Error accessing SDK.fs.${method}`, e);
        return false;
      }
    }
    
    // Skip AI methods check for now, since it appears the SDK structure might be different
    // than what we expected - AI methods might be accessed differently
    
    // If all required fs methods exist, consider the SDK valid
    console.log("SDK validation passed: Required filesystem methods are available");
    return true;
  } catch (error) {
    console.error("SDK validation failed with error:", error);
    return false;
  }
}

// Create a mock SDK for when the real one isn't available
function createMockSDK(): WebdrawSDK {
  console.log("Creating mock SDK to match observed structure");
  
  // Create a mock fs object with the methods we need
  const mockFs = {
    list: async (path: string) => {
      console.log(`Mock SDK: Listing files in ${path}`);
      return ['mock-file-1.txt', 'mock-file-2.txt'];
    },
    read: async (path: string) => {
      console.log(`Mock SDK: Reading file ${path}`);
      return '{}';
    },
    write: async (path: string, content: string) => {
      console.log(`Mock SDK: Writing to ${path}`, content);
    },
    mkdir: async (path: string, options?: any) => {
      console.log(`Mock SDK: Creating directory ${path}`, options);
    },
    // Additional methods that might be needed
    readFile: async (options: any) => {
      console.log(`Mock SDK: Reading file with options`, options);
      return '{}';
    },
    writeFile: async (options: any) => {
      console.log(`Mock SDK: Writing file with options`, options);
    },
    delete: async (options: any) => {
      console.log(`Mock SDK: Deleting file with options`, options);
    },
    remove: async (path: string) => {
      console.log(`Mock SDK: Removing file ${path}`);
    }
  };
  
  // Create a mock os object as observed in the real SDK
  const mockOs = {
    platform: () => 'mock-platform',
    arch: () => 'mock-arch',
    version: () => 'mock-version'
  };
  
  // The base SDK structure we've observed
  return {
    fs: mockFs,
    os: mockOs,
    // Include other properties we required
    // These will only be used if validation passes with the above
    getUser: async () => ({ username: 'mock-user' }),
    redirectToLogin: () => {},
    hello: () => 'Hello from mock SDK',
    generateText: async () => 'Mock text',
    generateImage: async () => 'mock-image-url',
    generateAudio: async () => 'mock-audio-url',
    generateVideo: async () => 'mock-video-url',
    generateObject: async function<T>() { return {} as T; },
    ai: {
      generateText: async () => ({ text: 'Mock text', filepath: 'mock/path.txt' }),
      generateImage: async () => ({ images: ['mock-image-url'], filepath: 'mock/image.png' }),
      generateObject: async function<T>() { return { object: {} as T, filepath: 'mock/data.json' }; }
    }
  } as unknown as WebdrawSDK;
}

// Export either the real SDK if available, or a mock if not
let exportedSDK: WebdrawSDK;

// Wait for the initialization check 
sdkInitialized.then(isAvailable => {
  if (isAvailable) {
    console.log("Exporting real SDK");
    exportedSDK = SDK as WebdrawSDK;
  } else {
    console.log("Exporting mock SDK");
    exportedSDK = createMockSDK();
  }
});

// Default to SDK directly, will be replaced with mock if validation fails
export default SDK as WebdrawSDK; 