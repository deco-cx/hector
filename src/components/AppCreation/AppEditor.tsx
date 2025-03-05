import React, { useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { Tabs, message, Spin, Alert, Button, Typography, Space } from 'antd';
import { useHector } from '../../context/HectorContext';
import { useHectorState } from '../../context/HectorStateContext';
import { useHectorActions } from '../../hooks/useHectorActions';
import { StyleGuide } from './steps/StyleGuide';
import { InputsConfig } from './steps/InputsConfig';
import { ActionsConfig as ActionsConfigStep } from './steps/ActionsConfig';
import { OutputConfig } from './steps/OutputConfig';
import { getLocalizedValue, AppConfig } from '../../types/types';
import { ArrowLeftOutlined, SaveOutlined } from '@ant-design/icons';
import LanguageSettings from '../LanguageSettings/LanguageSettings';
import JSONViewer from '../JSONViewer/JSONViewer';
import ExportsView from '../Exports/ExportsView';

// Extend Window interface to include our custom property
declare global {
  interface Window {
    __updateRuntimeMode?: (isRuntime: boolean) => void;
  }
}

interface AppEditorProps {
  tab?: string;
}

export function AppEditor({ tab = 'style' }: AppEditorProps) {
  console.log('AppEditor component rendering');
  
  // Use the new state and actions hooks for accessing our context
  const { service, sdk, isSDKAvailable } = useHectorState();
  console.log('useHectorState values:', { serviceAvailable: !!service, sdkAvailable: !!sdk });
  
  const { 
    loadAppConfig, 
    saveAppConfig, 
    setActiveTab, 
    setAppSaving,
    setAppConfig
  } = useHectorActions();
  
  // For backward compatibility, also use useHector to ensure all references work
  const hectorContext = useHector();
  
  const { appName: appId } = useParams<{ appName: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get app state from our centralized store
  const { 
    appConfig, 
    appLoading, 
    appSaving, 
    activeTab: currentTab,
    lastSaved 
  } = useHectorState();
  
  // Get the selected language from the app config
  const selectedLanguage = appConfig?.selectedLanguage || 'en-US';
  
  // Handle tab change
  const handleTabChange = (key: string) => {
    console.log('Tab changed to:', key, 'from:', currentTab);
    setActiveTab(key);
  };
  
  // Update activeTab when tab prop or location state changes
  useEffect(() => {
    if (tab) {
      setActiveTab(tab);
    } else if ((location.state as any)?.activeTab) {
      setActiveTab((location.state as any).activeTab);
    }
  }, [tab, location.state, setActiveTab]);
  
  // Load app data
  useEffect(() => {
    console.log('AppEditor useEffect for appId dependency triggered:', appId);
    if (appId) {
      loadAppConfig(appId);
    }
  }, [appId, loadAppConfig]);
  
  // Save the app to the backend
  const handleSaveApp = async () => {
    if (!appConfig) {
      message.error('No app data to save');
      return;
    }
    
    try {
      setAppSaving(true);
      const success = await saveAppConfig(appConfig);
      
      if (success) {
        message.success('App saved successfully');
      } else {
        message.error('Error saving app');
      }
    } catch (error) {
      console.error('Error saving app:', error);
      message.error('Error saving app');
    } finally {
      setAppSaving(false);
    }
  };
  
  // Handler for updating form data in child components
  const handleFormDataChange = (newData: Partial<AppConfig>) => {
    if (!appConfig) return;
    
    // Merge the new data with existing app config
    setAppConfig({
      ...appConfig,
      ...newData
    });
  };
  
  // Memoize the app name to avoid recalculation on every render
  const appNameString = useMemo(() => {
    if (!appConfig) return appId || 'app';
    
    return appConfig.name 
      ? getLocalizedValue(appConfig.name, selectedLanguage) || String(appId) 
      : String(appId) || 'app';
  }, [appConfig, selectedLanguage, appId]);
  
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
  
  if (appLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <Spin size="large" tip="Loading app..." />
      </div>
    );
  }
  
  if (!appConfig) {
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
  
  // If the SDK service is not available, show a loading message
  if (!service) {
    return (
      <div style={{ padding: 24 }}>
        <Spin tip="Loading..."/>
      </div>
    );
  }
  
  return (
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
            {getLocalizedValue(appConfig.name, selectedLanguage) || appId}
          </Typography.Title>
        </Space>
        
        <Space>
          <Button 
            type="primary" 
            icon={<SaveOutlined />} 
            onClick={handleSaveApp} 
            loading={appSaving}
          >
            Save
          </Button>
        </Space>
      </div>
      
      <div className="app-editor-content" style={{ padding: 16 }}>
        <Tabs 
          activeKey={currentTab} 
          onChange={handleTabChange}
          destroyInactiveTabPane={false}
          items={[
            {
              key: 'style',
              label: 'Style Guide',
              children: (
                <StyleGuide 
                  formData={appConfig} 
                  setFormData={handleFormDataChange}
                />
              )
            },
            {
              key: 'inputs',
              label: 'Inputs',
              children: (
                <InputsConfig 
                  formData={appConfig} 
                  setFormData={handleFormDataChange}
                />
              )
            },
            {
              key: 'actions',
              label: 'Actions',
              children: (
                <ActionsConfigStep 
                  formData={appConfig} 
                  setFormData={handleFormDataChange}
                />
              )
            },
            {
              key: 'output',
              label: 'Output',
              children: (
                <OutputConfig 
                  formData={appConfig} 
                  setFormData={handleFormDataChange}
                />
              )
            },
            {
              key: 'languages',
              label: 'Languages',
              children: (
                <LanguageSettings 
                  formData={appConfig} 
                  setFormData={handleFormDataChange}
                />
              )
            },
            {
              key: 'json',
              label: 'JSON View',
              children: <JSONViewer data={appConfig} />
            },
            {
              key: 'exports',
              label: 'Export',
              children: <ExportsView data={appConfig} />
            }
          ]}
        />
      </div>
    </div>
  );
} 