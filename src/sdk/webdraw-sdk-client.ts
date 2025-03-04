/* eslint-disable @typescript-eslint/ban-ts-comment */
// @ts-ignore
import { SDK } from "https://webdraw.com/webdraw-sdk@v1";
import { WebdrawSDK } from '../types/webdraw';

// Log SDK initialization to debug loading issues
console.log("Initializing Webdraw SDK client");

// A promise that resolves when the SDK is fully initialized
export const sdkInitialized = new Promise<boolean>((resolve) => {
  // Small delay to ensure SDK is fully loaded
  setTimeout(() => {
    const isAvailable = validateSDK();
    
    // Create necessary directories if SDK is available
    if (isAvailable) {
      SDK.fs.mkdir('~/Hector/apps', { recursive: true })
        .then(() => SDK.fs.mkdir('~/Hector/executions', { recursive: true }))
        .then(() => {
          console.log("Ensured Hector directories exist");
        })
        .catch((err: Error) => {
          console.warn("Could not create Hector directories:", err);
        });
    }
    
    resolve(isAvailable);
  }, 500);
});

// Validate that the SDK has all required methods
function validateSDK(): boolean {
  try {
    // Basic existence check
    if (!SDK || typeof SDK !== 'object') {
      console.error("SDK validation failed: SDK is not an object");
      return false;
    }
    
    // Check fs property and methods
    if (!SDK.fs || typeof SDK.fs !== 'object') {
      console.error("SDK validation failed: Missing fs property");
      return false;
    }
    
    const fsMethods = ['list', 'read', 'write', 'mkdir', 'readFile', 'writeFile'];
    for (const method of fsMethods) {
      if (typeof SDK.fs[method] !== 'function') {
        console.error(`SDK validation failed: Missing fs.${method} method`);
        return false;
      }
    }
    
    // Check ai property and methods
    if (!SDK.ai || typeof SDK.ai !== 'object') {
      console.error("SDK validation failed: Missing ai property");
      return false;
    }
    
    const aiMethods = ['generateText', 'generateObject', 'generateImage'];
    for (const method of aiMethods) {
      if (typeof SDK.ai[method] !== 'function') {
        console.error(`SDK validation failed: Missing ai.${method} method`);
        return false;
      }
    }
    
    // Check top-level SDK methods
    const sdkMethods = ['getUser', 'generateText', 'generateObject'];
    for (const method of sdkMethods) {
      if (typeof SDK[method] !== 'function') {
        console.error(`SDK validation failed: Missing SDK.${method} method`);
        return false;
      }
    }
    
    console.log("SDK validation passed: All required methods are available");
    return true;
  } catch (error) {
    console.error("SDK validation failed with error:", error);
    return false;
  }
}

// Create a mock SDK for when the real one isn't available
function createMockSDK(): WebdrawSDK {
  console.log("Creating mock SDK");
  
  return {
    fs: {
      list: async (path: string) => {
        console.log(`Mock SDK: Listing files in ${path}`);
        return [];
      },
      read: async (path: string) => {
        console.log(`Mock SDK: Reading file ${path}`);
        return '{}';
      },
      write: async (path: string, content: string) => {
        console.log(`Mock SDK: Writing to ${path}`, content);
      },
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
      },
      mkdir: async (path: string) => {
        console.log(`Mock SDK: Creating directory ${path}`);
      },
    },
    ai: {
      generateText: async function(options: any) {
        console.log(`Mock SDK: Generating text`, options);
        return { text: 'Mock generated text', filepath: 'mock/file.txt' };
      },
      generateImage: async function(options: any) {
        console.log(`Mock SDK: Generating image`, options);
        return { images: ['mock-image-url'], filepath: 'mock/image.png' };
      },
      generateObject: async function<T>(options: any) {
        console.log(`Mock SDK: Generating object`, options);
        return { object: {} as T, filepath: 'mock/object.json' };
      },
    },
    getUser: async () => {
      console.log("Mock SDK: Getting user");
      return { username: 'mock-user' };
    },
    redirectToLogin: (options?: any) => {
      console.log("Mock SDK: Redirecting to login", options);
    },
    hello: () => "Hello from mock SDK",
    generateText: async function(params: any) {
      console.log("Mock SDK: Generating text", params);
      return "Mock generated text";
    },
    generateImage: async function(params: any) {
      console.log("Mock SDK: Generating image", params);
      return "mock-image-url";
    },
    generateAudio: async function(params: any) {
      console.log("Mock SDK: Generating audio", params);
      return "mock-audio-url";
    },
    generateVideo: async function(params: any) {
      console.log("Mock SDK: Generating video", params);
      return "mock-video-url";
    },
    generateObject: async function<T>(params: any) {
      console.log("Mock SDK: Generating object", params);
      return {} as T;
    },
  };
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

// Default to real SDK, will be replaced with mock if validation fails
export default SDK as WebdrawSDK; 