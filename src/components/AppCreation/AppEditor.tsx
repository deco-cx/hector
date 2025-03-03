import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, message, Spin, Alert, Button } from 'antd';
import { useWebdraw } from '../../context/WebdrawContext';
import debounce from 'lodash/debounce';
import { StyleGuide } from './steps/StyleGuide';
import { InputsConfig } from './steps/InputsConfig';
import { ActionsConfig } from './steps/ActionsConfig';
import { OutputConfig } from './steps/OutputConfig';
import { AppConfig } from '../../types/webdraw';

// Temporary type for component props until we can align the types
interface FormDataType extends AppConfig {
  // Additional properties that might be expected by components
  [key: string]: any;
  actions: any[]; // Replace with proper type when available
  output: {
    format: string;
    template: string;
    enableMarkdown: boolean;
    enableSyntaxHighlighting: boolean;
    maxLength: number;
    type: 'html' | 'json' | 'files';
    files: string[];
  };
}

export function AppEditor() {
  const { appName } = useParams<{ appName: string }>();
  const navigate = useNavigate();
  const { service, isSDKAvailable } = useWebdraw();
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<FormDataType | null>(null);
  const [activeTab, setActiveTab] = useState('style');
  
  // Load app data
  useEffect(() => {
    async function loadApp() {
      if (!isSDKAvailable) {
        setLoading(false);
        return;
      }
      
      if (!appName) {
        message.error('App name is required');
        navigate('/');
        return;
      }
      
      setLoading(true);
      
      try {
        console.log(`Attempting to load app with ID: ${appName}`);
        // Get app data from service
        const appData = await service.getApp(appName);
        console.log("App data loaded successfully:", appData);
        setFormData(appData as unknown as FormDataType);
        setLoading(false);
      } catch (error) {
        console.error(`Failed to load app with ID ${appName}:`, error);
        message.error(`Failed to load app "${appName}". The app might not exist or there was an error loading it.`);
        navigate('/');
      }
    }
    
    loadApp();
  }, [appName, service, navigate, isSDKAvailable]);
  
  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (data: FormDataType) => {
      if (!isSDKAvailable || !data) return;
      
      try {
        await service.saveApp(data as unknown as AppConfig);
        console.log('App saved successfully');
      } catch (error) {
        console.error('Failed to save app:', error);
        message.error('Failed to save app');
      }
    }, 1000),
    [service, isSDKAvailable]
  );
  
  // Handle form data changes
  const handleFormDataChange = useCallback((newData: FormDataType) => {
    setFormData(newData);
    debouncedSave(newData);
  }, [debouncedSave]);
  
  if (!isSDKAvailable) {
    return (
      <div className="p-4">
        <Alert
          message="SDK Not Available"
          description={
            <div>
              <p>The WebdrawSDK is not available in this environment.</p>
              <p>App editing functionality is disabled.</p>
              <p>Please test this application at <a href="https://webdraw.com/apps/browser" target="_blank" rel="noopener noreferrer">https://webdraw.com/apps/browser</a></p>
              <Button onClick={() => navigate('/')}>Return to Home</Button>
            </div>
          }
          type="warning"
          showIcon
        />
      </div>
    );
  }
  
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading app..." />
      </div>
    );
  }
  
  if (!formData) {
    return null;
  }
  
  return (
    <div className="app-editor">
      <h1>{formData.name}</h1>
      
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          {
            key: 'style',
            label: 'Style',
            children: (
              <StyleGuide
                formData={formData}
                setFormData={handleFormDataChange}
              />
            ),
          },
          {
            key: 'inputs',
            label: 'Inputs',
            children: (
              <InputsConfig
                formData={formData}
                setFormData={handleFormDataChange}
              />
            ),
          },
          {
            key: 'actions',
            label: 'Actions',
            children: (
              <ActionsConfig
                formData={formData}
                setFormData={handleFormDataChange}
              />
            ),
          },
          {
            key: 'output',
            label: 'Output',
            children: (
              <OutputConfig
                formData={formData}
                setFormData={handleFormDataChange}
              />
            ),
          },
        ]}
      />
    </div>
  );
} 