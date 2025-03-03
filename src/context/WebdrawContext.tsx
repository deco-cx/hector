import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { WebdrawSDK } from '../types/webdraw';
import { WebdrawService } from '../services/webdraw-service';
import { Modal } from 'antd';

// Define the context type
interface WebdrawContextType {
  service: WebdrawService;
  isSDKAvailable: boolean;
}

// Create the context with a default undefined value
const WebdrawContext = createContext<WebdrawContextType | undefined>(undefined);

// Props for our provider component
interface WebdrawProviderProps {
  sdk?: WebdrawSDK;
  children: ReactNode;
}

// Provider component that will wrap our app
export function WebdrawProvider({ sdk, children }: WebdrawProviderProps) {
  const [isSDKAvailable, setIsSDKAvailable] = useState<boolean>(false);

  // Simplified SDK availability check
  const checkSdkAvailability = (sdk: any): boolean => {
    if (!sdk || typeof sdk !== 'object') {
      console.error("Webdraw SDK is not available");
      return false;
    }
    
    return true;
  };

  useEffect(() => {
    // Check SDK availability
    const sdkAvailable = sdk ? checkSdkAvailability(sdk) : false;
    console.log("SDK availability check result:", sdkAvailable);
    setIsSDKAvailable(sdkAvailable);
    
    // If SDK is not available, show alert
    if (!sdkAvailable) {
      Modal.info({
        title: 'SDK Not Available',
        content: (
          <div>
            <p>The WebdrawSDK is not available in this environment.</p>
            <p>Please test this application at <a href="https://webdraw.com/apps/browser" target="_blank" rel="noopener noreferrer">https://webdraw.com/apps/browser</a></p>
          </div>
        ),
        okText: 'Understand',
      });
      return;
    }
  }, [sdk]);

  // Create a WebdrawService with the SDK (whether it's available or not)
  const service = new WebdrawService(sdk || createMockSdk());
  
  // Provide the context
  return (
    <WebdrawContext.Provider value={{ service, isSDKAvailable }}>
      {children}
    </WebdrawContext.Provider>
  );
}

// Create a mock SDK for when the real one isn't available
function createMockSdk(): WebdrawSDK {
  return {
    fs: {
      list: async () => [],
      readFile: async () => { throw new Error('SDK not available'); },
      writeFile: async () => { throw new Error('SDK not available'); },
      delete: async () => { throw new Error('SDK not available'); },
      mkdir: async () => { throw new Error('SDK not available'); },
    },
    ai: {
      generateText: async () => { throw new Error('SDK not available'); },
      generateImage: async () => { throw new Error('SDK not available'); },
      generateObject: async () => { throw new Error('SDK not available'); },
    },
    getUser: async () => null,
    redirectToLogin: () => {
      window.open('https://webdraw.com/apps/browser', '_blank');
    }
  };
}

// Hook to use the webdraw context
export function useWebdraw() {
  const context = useContext(WebdrawContext);
  if (!context) {
    throw new Error('useWebdraw must be used within a WebdrawProvider');
  }
  return context;
} 