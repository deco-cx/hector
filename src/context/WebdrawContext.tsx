import React, { createContext, useContext, ReactNode, useEffect, useState } from 'react';
import { WebdrawSDK } from '../types/webdraw';
import { WebdrawService } from '../services/webdraw-service';
import { Modal, Button } from 'antd';
import { sdkInitialized } from '../sdk/webdraw-sdk-client';
import SDK from '../sdk/webdraw-sdk-client';

// Define the context type
interface WebdrawContextType {
  service: WebdrawService;
  isSDKAvailable: boolean;
  reloadSDK: () => void;
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
  const [initializationRetry, setInitializationRetry] = useState<number>(0);

  // Function to reload the SDK (can be called if needed)
  const reloadSDK = () => {
    console.log("Attempting to reload SDK");
    setIsInitializing(true);
    setInitializationRetry(prev => prev + 1);
  };

  useEffect(() => {
    let mounted = true;
    
    console.log("WebdrawProvider: Initializing, waiting for SDK");
    
    // Use the SDK provided as prop, or fall back to imported one
    const sdkToUse = sdk || SDK;
    
    // Wait for the SDK to be initialized before checking availability
    sdkInitialized.then(isAvailable => {
      if (!mounted) return;
      
      console.log("SDK initialization result from WebdrawContext:", isAvailable);
      setIsSDKAvailable(isAvailable);
      
      // Create a WebdrawService with the real or mock SDK
      try {
        const newService = new WebdrawService(sdkToUse);
        console.log("WebdrawService created successfully");
        setService(newService);
      } catch (error) {
        console.error("Error creating WebdrawService:", error);
        const mockService = new WebdrawService(createMockSdk());
        setService(mockService);
      }
      
      // Only show the warning modal if SDK is not available and the user hasn't dismissed it
      if (!isAvailable) {
        setShowSDKWarning(true);
      }
      
      setIsInitializing(false);
    }).catch(error => {
      console.error("Error waiting for SDK initialization:", error);
      if (mounted) {
        setIsSDKAvailable(false);
        const mockService = new WebdrawService(createMockSdk());
        setService(mockService);
        setShowSDKWarning(true);
        setIsInitializing(false);
      }
    });
    
    return () => {
      mounted = false;
    };
  }, [sdk, initializationRetry]);
  
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
            <div style={{ marginTop: '16px' }}>
              <Button onClick={reloadSDK}>Retry SDK Initialization</Button>
            </div>
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
    <WebdrawContext.Provider value={{ service, isSDKAvailable, reloadSDK }}>
      {children}
    </WebdrawContext.Provider>
  );
}

// Create a mock SDK for when the real one isn't available
function createMockSdk(): WebdrawSDK {
  console.log("Creating mock SDK for WebdrawContext");
  
  // Create a mock fs object with the methods we need
  const mockFs = {
    list: async () => [],
    read: async () => '{}',
    write: async () => {},
    mkdir: async () => {},
    // Additional methods that might be needed
    readFile: async () => '{}',
    writeFile: async () => {},
    delete: async () => {},
    remove: async () => {}
  };
  
  // Create a mock os object as observed in the real SDK
  const mockOs = {
    platform: () => 'mock-platform',
    arch: () => 'mock-arch',
    version: () => 'mock-version'
  };
  
  // Return the mock SDK with the structure we've observed
  return {
    fs: mockFs,
    os: mockOs,
    // Additional properties needed for the interface
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
      generateImage: async () => ({ images: ['mock-image'], filepath: 'mock/image.png' }),
      generateObject: async function<T>() { return { object: {} as T, filepath: 'mock/data.json' }; }
    }
  } as unknown as WebdrawSDK;
}

// Hook to use the webdraw context
export function useWebdraw() {
  const context = useContext(WebdrawContext);
  if (!context) {
    throw new Error('useWebdraw must be used within a WebdrawProvider');
  }
  return context;
} 