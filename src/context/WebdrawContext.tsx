import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { WebdrawSDK } from '../types/webdraw';
import { WebdrawService } from '../services/webdraw-service';
import { Modal } from 'antd';
import { sdkInitialized } from '../sdk/webdraw-sdk-client';

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
  const [service, setService] = useState<WebdrawService | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [showSDKWarning, setShowSDKWarning] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    
    // Wait for the SDK to be initialized before checking availability
    sdkInitialized.then(isAvailable => {
      if (!mounted) return;
      
      console.log("SDK initialization result from WebdrawContext:", isAvailable);
      setIsSDKAvailable(isAvailable);
      
      // Create a WebdrawService with the real or mock SDK
      const newService = new WebdrawService(sdk || createMockSdk());
      setService(newService);
      
      // Only show the warning modal if SDK is not available
      if (!isAvailable) {
        setShowSDKWarning(true);
      }
      
      setIsInitializing(false);
    });
    
    return () => {
      mounted = false;
    };
  }, [sdk]);
  
  // Show modal warning if SDK is unavailable (and not in initialization state)
  useEffect(() => {
    if (!isInitializing && showSDKWarning) {
      Modal.info({
        title: 'SDK Not Available - Using Mock Data',
        content: (
          <div>
            <p>The WebdrawSDK is not available in this environment.</p>
            <p>Some features may be limited or use mock data.</p>
            <p>For full functionality, please test this application at <a href="https://webdraw.com/apps/browser" target="_blank" rel="noopener noreferrer">https://webdraw.com/apps/browser</a></p>
          </div>
        ),
        okText: 'Continue with limited functionality',
        onOk: () => setShowSDKWarning(false)
      });
    }
  }, [isInitializing, showSDKWarning]);
  
  // Show loading state while initializing
  if (isInitializing || !service) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        flexDirection: 'column',
        gap: '16px'
      }}>
        <div className="loading-spinner"></div>
        <div>Initializing Hector...</div>
      </div>
    );
  }
  
  // Provide the context once service is initialized
  return (
    <WebdrawContext.Provider value={{ service, isSDKAvailable }}>
      {children}
    </WebdrawContext.Provider>
  );
}

// Create a mock SDK for when the real one isn't available
function createMockSdk(): WebdrawSDK {
  console.log("Creating mock SDK for WebdrawContext");
  return {
    fs: {
      list: async () => [],
      read: async () => '{}',
      readFile: async () => '{}',
      write: async () => {},
      writeFile: async () => {},
      delete: async () => {},
      remove: async () => {},
      mkdir: async () => {},
    },
    ai: {
      generateText: async () => ({ text: 'Mock text', filepath: 'mock/path.txt' }),
      generateImage: async () => ({ images: ['mock-image'], filepath: 'mock/image.png' }),
      generateObject: async function<T>() { return { object: {} as T, filepath: 'mock/data.json' }; },
    },
    getUser: async () => ({ username: 'mock-user' }),
    redirectToLogin: () => {
      window.open('https://webdraw.com/apps/browser', '_blank');
    },
    hello: () => 'Hello from mock SDK',
    generateText: async () => 'Mock text',
    generateImage: async () => 'mock-image-url',
    generateAudio: async () => 'mock-audio-url',
    generateVideo: async () => 'mock-video-url',
    generateObject: async function<T>() { return {} as T; },
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