import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, message, Spin, Alert, Button, Input, Card, Space, Typography, Row, Col } from 'antd';
import { useWebdraw } from '../../context/WebdrawContext';
import { StyleGuide } from './steps/StyleGuide';
import { InputsConfig } from './steps/InputsConfig';
import { ActionsConfig } from './steps/ActionsConfig';
import { OutputConfig } from './steps/OutputConfig';
import { AppConfig } from '../../types/webdraw';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';

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
  const [inputsKey, setInputsKey] = useState(0); // Add a key to force refresh
  const [saving, setSaving] = useState(false); // Track save operation status
  
  // Handle tab selection
  const handleTabChange = (key: string) => {
    console.log('Tab changed to:', key);
    setActiveTab(key);
    
    // Force refresh of the Inputs tab when selecting it
    if (key === 'inputs') {
      setInputsKey(prev => prev + 1);
    }
  };
  
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
        
        // Ensure critical arrays are initialized
        const normalizedAppData = {
          ...appData,
          inputs: Array.isArray(appData.inputs) ? appData.inputs : [],
          actions: Array.isArray(appData.actions) ? appData.actions : []
        };
        
        setFormData(normalizedAppData as unknown as FormDataType);
        setLoading(false);
      } catch (error) {
        console.error(`Failed to load app with ID ${appId}:`, error);
        message.error(`Failed to load app "${appId}". The app might not exist or there was an error loading it.`);
        navigate('/');
      }
    }
    
    loadApp();
  }, [appId, service, navigate, isSDKAvailable]);
  
  // Function to perform the actual save - call this explicitly when needed
  const saveApp = useCallback(async () => {
    if (!isSDKAvailable || !formData) return;
    
    setSaving(true);
    
    // Ensure the ID is set
    const appDataToSave = {
      ...formData,
      id: formData.id || appId
    };
    
    console.log('Saving app data:', appDataToSave);
    
    try {
      await service.saveApp(appDataToSave as unknown as AppConfig);
      console.log('App saved successfully');
      message.success('App saved successfully');
    } catch (error) {
      console.error('Failed to save app:', error);
      message.error('Failed to save app');
    } finally {
      setSaving(false);
    }
  }, [formData, service, isSDKAvailable, appId]);
  
  // Handle form data changes - this only updates the React state
  const handleFormDataChange = useCallback((newData: FormDataType) => {
    setFormData(prevData => {
      if (!prevData) return newData;
      
      // Create a merged version with the new data
      return {
        ...prevData,
        ...newData
      };
    });
  }, []);
  
  // Monitor formData changes for debugging
  useEffect(() => {
    if (formData) {
      console.log('AppEditor formData updated:', {
        id: formData.id,
        hasInputs: Boolean(formData.inputs),
        inputsLength: Array.isArray(formData.inputs) ? formData.inputs.length : 'not an array',
        inputs: formData.inputs
      });
    }
  }, [formData]);
  
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
    <div className="app-editor min-h-screen">
      {/* Header Section */}
      <Card 
        className="mb-6 border-b shadow-sm rounded-lg" 
        bodyStyle={{ padding: '24px 20px' }}
      >
        {/* Back to Home Link */}
        <div className="flex justify-between items-center">
          <Button 
            type="link" 
            icon={<ArrowLeftOutlined />} 
            onClick={() => navigate('/')}
            className="text-purple-700 hover:text-purple-500 p-0 flex items-center text-base mb-6"
          >
            Back to Home
          </Button>
          
          <Button
            type="primary"
            onClick={saveApp}
            loading={saving}
            icon={<SaveOutlined />}
          >
            Save Changes
          </Button>
        </div>
        
        {/* App Information */}
        <div className="mt-2">
          <Typography.Title 
            level={2}
            className="mb-3 py-3 px-4"
            style={{ 
              background: '#f5f3ff', 
              borderBottom: '2px solid #7c3aed',
              borderRadius: '4px 4px 0 0'
            }}
          >
            {formData.name}
          </Typography.Title>
          
          <div className="text-gray-500 text-sm px-1 mt-3">
            App ID: <code className="bg-gray-100 px-2 py-1 rounded">{formData.id}</code> 
            <span className="ml-3">(used for the file name, cannot be changed)</span>
          </div>
        </div>
      </Card>
      
      {/* Tabs Section */}
      <div>
        <Tabs
          activeKey={activeTab}
          onChange={handleTabChange}
          type="card"
          size="large"
          tabBarGutter={16}
          className="app-tabs"
          items={[
            {
              key: 'style',
              label: 'Style',
              children: (
                <StyleGuide
                  key="style-guide"
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
                  key={inputsKey}
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
                  key="actions-config"
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
                  key="output-config"
                  formData={formData}
                  setFormData={handleFormDataChange}
                />
              ),
            },
          ]}
        />
      </div>
    </div>
  );
} 