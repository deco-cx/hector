import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, message, Spin, Alert, Button, Input, Card, Space, Typography, Row, Col, Radio } from 'antd';
import { useHector } from '../../context/HectorContext';
import { StyleGuide } from './steps/StyleGuide';
import { InputsConfig } from './steps/InputsConfig';
import { ActionsConfig as ActionsConfigStep } from './steps/ActionsConfig';
import { OutputConfig } from './steps/OutputConfig';
import { AppConfig, getLocalizedValue, DEFAULT_LANGUAGE, OutputTemplate, createDefaultLocalizable, WebdrawSDK } from '../../types/types';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import LanguageSettings from '../LanguageSettings/LanguageSettings';
import JSONViewer from '../JSONViewer/JSONViewer';
import ExportsView from '../Exports/ExportsView';
import { useLanguage } from '../../contexts/LanguageContext';
import { createOutputTemplate } from '../../config/outputsConfig';
import { RuntimeProvider } from '../../components/Runtime';
import { ExecutionPill } from '../../components/Runtime/ExecutionPill';

// Extend Window interface to include our custom property
declare global {
  interface Window {
    __updateRuntimeMode?: (isRuntime: boolean) => void;
  }
}

interface AppEditorProps {
  tab?: string;
}

// Define a type that combines AppConfig with the expected component props
interface ExtendedAppConfig extends Omit<AppConfig, 'output'> {
  output: OutputTemplate[];
}

export function AppEditor({ tab = 'style' }: AppEditorProps) {
  const { service, sdk, isSDKAvailable } = useHector();
  const { appName: appId } = useParams<{ appName: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { currentLanguage } = useLanguage();
  
  // State for the form data
  const [formData, setFormData] = useState<ExtendedAppConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState(tab || 'style');
  const [inputsKey, setInputsKey] = useState(0); // Used to force re-render of inputs tab
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Handle tab change
  const handleTabChange = (key: string) => {
    console.log('Tab changed to:', key, 'from:', activeTab);
    
    // When switching to the inputs tab, force a re-render to ensure we have fresh data
    if (key === 'inputs') {
      setInputsKey(prevKey => prevKey + 1);
    }
    
    // Set the active tab
    setActiveTab(key);
  };
  
  // Update activeTab when tab prop or location state changes
  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    } else if ((location.state as any)?.activeTab) {
      setActiveTab((location.state as any).activeTab);
    }
  }, [tab, location.state]);
  
  // Load app data
  useEffect(() => {
    const loadAppData = async () => {
      if (!isSDKAvailable || !appId) {
        setLoading(false);
        return;
      }
      
      try {
        // Get app data - it's already normalized by the service
        const appData = await service.getApp(appId);
        setFormData(appData as ExtendedAppConfig);
      } catch (error) {
        console.error('Failed to load app:', error);
        message.error('Failed to load app');
      } finally {
        setLoading(false);
      }
    };
    
    loadAppData();
  }, [appId, isSDKAvailable, service]);
  
  // Save the app to the backend
  const saveApp = async () => {
    if (!formData) {
      message.error('No app data to save');
      return;
    }
    
    try {
      setSaving(true);
      
      // Save the app using the service
      await service.saveApp(formData);
      message.success('App saved successfully');
      
      // Update the lastSaved date
      setLastSaved(new Date());
    } catch (error) {
      console.error('Error saving app:', error);
      message.error('Error saving app');
    } finally {
      setSaving(false);
    }
  };
  
  // Handle form data changes - this only updates the React state
  const handleFormDataChange = useCallback((newData: Partial<ExtendedAppConfig> | ((prev: ExtendedAppConfig) => ExtendedAppConfig)) => {
    console.log('handleFormDataChange called with:', newData);
    
    // Handle both direct data updates and function updates
    if (typeof newData === 'function') {
      setFormData(prevData => {
        if (!prevData) {
          console.error('Cannot update with a function when previous data is null');
          return prevData;
        }
        
        const updatedData = newData(prevData);
        console.log('Updated form data (function update):', updatedData);
        return updatedData;
      });
    } else {
      setFormData(prevData => {
        if (!prevData) {
          return newData as ExtendedAppConfig;
        }
        
        // Use a proper deep merge to ensure all properties are correctly updated
        const mergedData = JSON.parse(JSON.stringify({
          ...prevData,
          ...newData
        }));
        
        // Log what's being updated
        console.log('Updated form data (direct update):', mergedData);
        
        return mergedData;
      });
    }
  }, []);
  
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
    return (
      <div style={{ padding: 20 }}>
        <Alert
          message="App Not Found"
          description={
            <div>
              <p>Could not load app data.</p>
              <Button onClick={() => navigate('/')}>Return to Home</Button>
            </div>
          }
          type="error"
          showIcon
        />
      </div>
    );
  }
  
  // Get the app name as string for use in RuntimeProvider
  const appNameString = formData.name 
    ? (typeof formData.name === 'object' 
        ? getLocalizedValue(formData.name, currentLanguage) || String(appId) 
        : String(formData.name))
    : String(appId) || 'app';
    
  // Create a wrapper for the RuntimeProvider that removes the mode-related functionality
  const RuntimeProviderWrapper: React.FC<React.PropsWithChildren> = ({ children }) => {
    // This will be rendered inside the RuntimeContext, allowing us to use the already defined state
    console.log('RuntimeProvider service type:', service);
    
    // Use the getSDK() method to access the WebdrawSDK instance
    // We explicitly cast to WebdrawSDK from types.ts to ensure interface compatibility with RuntimeProvider
    return (
      <RuntimeProvider
        sdk={service.getSDK() as WebdrawSDK}
        appId={appId || ''}
        inputs={formData?.inputs || []}
        actions={formData?.actions || []}
      >
        {children}
      </RuntimeProvider>
    );
  };
  
  // If the SDK service is not available, show a loading message
  if (!service || !formData) {
    return (
      <div style={{ padding: 24 }}>
        <Spin tip="Loading..."/>
      </div>
    );
  }
  
  return (
    <RuntimeProviderWrapper>
      <div className="app-editor">
        <div className="app-editor-header" style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 16,
          padding: '8px 16px',
          backgroundColor: '#f5f5f5',
          borderBottom: '1px solid #e8e8e8'
        }}>
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/')}
            >
              Back
            </Button>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {getLocalizedValue(formData.name, currentLanguage) || appId}
            </Typography.Title>
          </Space>
          
          <Space>
            <ExecutionPill />
            <Button 
              type="primary" 
              icon={<SaveOutlined />} 
              onClick={saveApp} 
              loading={saving}
            >
              Save
            </Button>
          </Space>
        </div>
        
        <div className="app-editor-content" style={{ padding: 16 }}>
          <Tabs 
            activeKey={activeTab} 
            onChange={handleTabChange}
            destroyInactiveTabPane={false}
            items={[
              {
                key: 'style',
                label: 'Style Guide',
                children: (
                  <StyleGuide 
                    formData={formData} 
                    setFormData={handleFormDataChange} 
                  />
                )
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
                )
              },
              {
                key: 'actions',
                label: 'Actions',
                children: (
                  <ActionsConfigStep 
                    formData={formData} 
                    setFormData={handleFormDataChange} 
                  />
                )
              },
              {
                key: 'output',
                label: 'Output',
                children: (
                  <OutputConfig 
                    formData={formData} 
                    setFormData={handleFormDataChange} 
                  />
                )
              },
              {
                key: 'languages',
                label: 'Languages',
                children: (
                  <LanguageSettings 
                    formData={formData} 
                    setFormData={handleFormDataChange}
                  />
                )
              },
              {
                key: 'json',
                label: 'JSON View',
                children: <JSONViewer data={formData} />
              },
              {
                key: 'exports',
                label: 'Export',
                children: <ExportsView data={formData} />
              }
            ]}
          />
        </div>
      </div>
    </RuntimeProviderWrapper>
  );
} 