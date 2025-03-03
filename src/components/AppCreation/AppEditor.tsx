import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, message, Spin, Alert, Button, Input } from 'antd';
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
  const { appName: appId } = useParams<{ appName: string }>();
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
      
      if (!appId) {
        message.error('App ID is required');
        navigate('/');
        return;
      }
      
      setLoading(true);
      
      try {
        console.log(`Attempting to load app with ID: ${appId}`);
        // Get app data from service
        const appData = await service.getApp(appId);
        console.log("App data loaded successfully:", appData);
        setFormData(appData as unknown as FormDataType);
        setLoading(false);
      } catch (error) {
        console.error(`Failed to load app with ID ${appId}:`, error);
        message.error(`Failed to load app "${appId}". The app might not exist or there was an error loading it.`);
        navigate('/');
      }
    }
    
    loadApp();
  }, [appId, service, navigate, isSDKAvailable]);
  
  // Debounced save function
  const debouncedSave = useCallback(
    debounce(async (data: FormDataType) => {
      if (!isSDKAvailable || !data) return;
      
      // Log app data before saving to check if style is defined
      console.log('App data before save:', {
        id: data.id,
        name: data.name,
        style: data.style,
        template: data.template
      });
      
      try {
        // Make sure appId is used as the ID if it's not already set
        const appDataToSave = {
          ...data,
          id: data.id || appId // Use existing ID or fall back to appId from URL
        };
        
        // Log the final app data being saved
        console.log('Final app data being saved:', {
          id: appDataToSave.id,
          name: appDataToSave.name,
          style: appDataToSave.style,
          template: appDataToSave.template,
          hasOutputProp: Boolean(appDataToSave.output),
          hasInputsProp: Boolean(appDataToSave.inputs),
          hasActionsProp: Boolean(appDataToSave.actions)
        });
        
        console.log('Saving app with ID:', appDataToSave.id);
        await service.saveApp(appDataToSave as unknown as AppConfig);
        console.log('App saved successfully');
      } catch (error) {
        console.error('Failed to save app:', error);
        message.error('Failed to save app');
      }
    }, 1000),
    [service, isSDKAvailable, appId]
  );
  
  // Handle form data changes
  const handleFormDataChange = useCallback((newData: FormDataType) => {
    // Log the changed data
    console.log('Form data changed:', {
      id: newData.id,
      name: newData.name, 
      style: newData.style,
      action: 'setting formData and calling debouncedSave'
    });
    
    // Make sure we preserve existing data when partial updates come in
    setFormData(prevData => {
      if (!prevData) return newData;
      
      // Create a merged version that keeps existing fields if not present in newData
      const mergedData = {
        ...prevData,
        ...newData,
        // Ensure these critical properties are preserved
        id: newData.id || prevData.id,
        name: newData.name !== undefined ? newData.name : prevData.name,
        style: newData.style || prevData.style,
        template: newData.template || prevData.template,
        // Make sure complex objects are properly merged
        inputs: newData.inputs || prevData.inputs,
        actions: newData.actions || prevData.actions,
        output: {
          ...(prevData.output || {}),
          ...(newData.output || {})
        }
      };
      
      console.log('Merged form data:', {
        id: mergedData.id,
        name: mergedData.name,
        style: mergedData.style,
        template: mergedData.template
      });
      
      // Save the merged data
      debouncedSave(mergedData);
      
      return mergedData;
    });
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
      <div className="mb-6">
        <div className="flex items-center mb-1">
          <Input 
            className="text-2xl font-bold py-2 mr-4" 
            value={formData.name}
            onChange={(e) => {
              const newName = e.target.value;
              handleFormDataChange({
                ...formData,
                name: newName
              });
            }}
            placeholder="App Name"
            style={{ maxWidth: '500px' }}
          />
        </div>
        <div className="text-gray-500 text-sm">
          App ID: <code>{formData.id}</code> (used for the file name, cannot be changed)
        </div>
      </div>
      
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