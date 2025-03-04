import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Button, List, Spin, Empty, message, Alert, Steps, Space } from 'antd';
import { PlusOutlined, AppstoreOutlined, BookOutlined, EditOutlined, DeleteOutlined, GlobalOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { CreateAppModal } from '../AppCreation/CreateAppModal';
import { useWebdraw } from '../../context/WebdrawContext';
import { AppConfig } from '../../types/webdraw';
import { useLanguage } from '../../contexts/LanguageContext';
import { getLocalizedValue } from '../../types/i18n';

const { Title, Paragraph } = Typography;

export function HomePage() {
  const navigate = useNavigate();
  const { service, isSDKAvailable, reloadSDK } = useWebdraw();
  const { currentLanguage } = useLanguage();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [apps, setApps] = useState<AppConfig[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch all apps
  const fetchApps = async () => {
    if (!isSDKAvailable) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const appList = await service.listApps();
      console.log('Fetched apps:', appList);
      setApps(appList);
    } catch (error) {
      console.error('Failed to fetch apps:', error);
      message.error('Failed to load your apps');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApps();
  }, [service, isSDKAvailable]);

  const showCreateModal = () => {
    if (!isSDKAvailable) {
      message.warning('SDK is not available in this environment. Please test on webdraw.com');
      return;
    }
    setCreateModalVisible(true);
  };
  
  const hideCreateModal = () => {
    setCreateModalVisible(false);
  };
  
  const handleCreateApp = async (appData: Partial<AppConfig>) => {
    try {
      await service.saveApp(appData as AppConfig);
      message.success('App created successfully!');
      hideCreateModal();
      fetchApps();
    } catch (error) {
      console.error('Failed to create app:', error);
      message.error('Failed to create app');
    }
  };
  
  const handleEditApp = (appId: string) => {
    if (!isSDKAvailable) {
      message.warning('SDK is not available in this environment. Please test on webdraw.com');
      return;
    }
    navigate(`/app/${appId}`);
  };
  
  const handleLanguageSettings = (appId: string) => {
    if (!isSDKAvailable) {
      message.warning('SDK is not available in this environment. Please test on webdraw.com');
      return;
    }
    navigate(`/settings/languages/${appId}`);
  };
  
  const handleDeleteApp = async (appId: string) => {
    if (!isSDKAvailable) {
      message.warning('SDK is not available in this environment. Please test on webdraw.com');
      return;
    }
    
    try {
      await service.deleteApp(appId);
      message.success('App deleted successfully!');
      fetchApps();
    } catch (error) {
      console.error('Failed to delete app:', error);
      message.error('Failed to delete app');
    }
  };

  // Render app list
  const renderAppList = () => {
    if (loading) {
      return (
        <div style={{ 
          display: 'flex',
          justifyContent: 'center',
          padding: '40px 0'
        }}>
          <Spin size="large" />
        </div>
      );
    }
    
    if (apps.length === 0) {
      return (
        <Empty 
          description="You don't have any apps yet" 
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: '40px 0' }}
        />
      );
    }
    
    return (
      <List
        grid={{ 
          gutter: 24, 
          xs: 1, 
          sm: 2, 
          md: 2, 
          lg: 3, 
          xl: 3, 
          xxl: 4 
        }}
        dataSource={apps}
        style={{ margin: '8px 0' }}
        renderItem={(app) => (
          <List.Item style={{ marginBottom: '20px' }}>
            <Card 
              title={getLocalizedValue(app.name, currentLanguage) || app.id}
              hoverable
              style={{
                borderRadius: '10px',
                overflow: 'hidden',
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                boxShadow: '0 3px 6px rgba(0, 0, 0, 0.1)',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              styles={{
                header: {
                  backgroundColor: '#f5f7fa',
                  borderBottom: '1px solid #e8e8e8',
                  padding: '16px 20px',
                },
                body: {
                  padding: '20px',
                  flex: '1 1 auto'
                }
              }}
              actions={[
                <Button 
                  key="edit" 
                  type="text" 
                  icon={<EditOutlined />}
                  onClick={() => handleEditApp(app.id)}
                  style={{ padding: '4px 8px' }}
                >
                  Edit
                </Button>,
                <Button 
                  key="language" 
                  type="text" 
                  icon={<GlobalOutlined />}
                  onClick={() => handleLanguageSettings(app.id)}
                  style={{ padding: '4px 8px' }}
                >
                  Languages
                </Button>,
                <Button 
                  key="delete" 
                  type="text" 
                  danger
                  icon={<DeleteOutlined />}
                  onClick={() => handleDeleteApp(app.id)}
                  style={{ padding: '4px 8px' }}
                >
                  Delete
                </Button>
              ]}
            >
              <div style={{ 
                padding: '4px 0 16px',
                minHeight: '60px'
              }}>
                <Paragraph ellipsis={{ rows: 2 }} style={{ margin: 0 }}>
                  <div style={{ marginBottom: '8px' }}>
                    <span style={{ fontWeight: 'bold' }}>Template:</span> {app.template}
                  </div>
                  <div>
                    <span style={{ fontWeight: 'bold' }}>Style:</span> {app.style}
                  </div>
                </Paragraph>
              </div>
            </Card>
          </List.Item>
        )}
      />
    );
  };

  return (
    <div style={{ 
      padding: '32px 24px', 
      maxWidth: '1400px', 
      margin: '0 auto',
      display: 'flex',
      flexDirection: 'column',
      gap: '32px'
    }}>
      <div style={{ 
        textAlign: 'center', 
        marginBottom: '40px',
        marginTop: '20px'
      }}>
        <Title style={{ 
          fontSize: '3rem', 
          fontWeight: '700',
          marginBottom: '40px'
        }}>Hector</Title>
        <div style={{ 
          maxWidth: '900px', 
          margin: '0 auto',
          background: '#f9f9fa',
          padding: '32px',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
        }}>
          <Steps
            direction="vertical"
            current={3}
            status="finish"
            className="text-left"
            style={{ padding: '0 16px' }}
            items={[
              {
                title: <Title level={4} style={{ margin: 0, fontSize: '1.5rem' }}>Create No-Code AI Applications</Title>,
                description: <Paragraph style={{ fontSize: '1rem', marginTop: '8px' }}>Build sophisticated AI-powered applications without writing a single line of code.</Paragraph>,
              },
              {
                title: <Title level={4} style={{ margin: 0, fontSize: '1.5rem' }}>Design Interactive Experiences</Title>,
                description: <Paragraph style={{ fontSize: '1rem', marginTop: '8px' }}>Create forms, workflows, and interactive experiences with drag-and-drop simplicity.</Paragraph>,
              },
              {
                title: <Title level={4} style={{ margin: 0, fontSize: '1.5rem' }}>Leverage Powerful AI Models</Title>,
                description: <Paragraph style={{ fontSize: '1rem', marginTop: '8px' }}>Connect to state-of-the-art AI models for text generation, image creation, and data analysis.</Paragraph>,
              },
            ]}
          />
        </div>
      </div>

      {!isSDKAvailable && (
        <Alert
          message="SDK Not Available"
          description={
            <div>
              <p>The WebdrawSDK is not available in this environment.</p>
              <p>Some features will be limited or use mock data.</p>
              <div style={{ marginTop: '16px' }}>
                <Button 
                  type="primary" 
                  icon={<ReloadOutlined />} 
                  onClick={reloadSDK}
                  style={{ marginRight: '12px' }}
                >
                  Retry SDK Connection
                </Button>
                <Button href="https://webdraw.com/apps/browser" target="_blank">
                  Open in Webdraw
                </Button>
              </div>
            </div>
          }
          type="warning"
          showIcon
          style={{ 
            marginBottom: '32px',
            marginTop: '16px',
            padding: '16px'
          }}
        />
      )}

      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        margin: '32px 0'
      }}>
        <Button
          type="primary"
          onClick={showCreateModal}
          disabled={!isSDKAvailable}
          icon={<PlusOutlined />}
          style={{
            padding: '0.75rem 2rem',
            height: 'auto',
            fontSize: '1.1rem',
            backgroundColor: '#7B2CBF',
            borderColor: '#7B2CBF',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(123, 44, 191, 0.2)'
          }}
          size="large"
        >
          New App
        </Button>
      </div>

      <div style={{ 
        display: 'flex', 
        justifyContent: 'center',
        width: '100%'
      }}>
        <Card 
          title={
            <div style={{ padding: '8px 0', fontSize: '1.5rem' }}>
              My Apps
            </div>
          }
          style={{ 
            width: '100%',
            maxWidth: '1200px',
            borderRadius: '12px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)'
          }}
          styles={{ 
            header: { 
              backgroundColor: '#f5f5f5', 
              borderBottom: '1px solid #e8e8e8',
              padding: '16px 24px'
            },
            body: { 
              padding: '24px' 
            }
          }}
          extra={
            <Button 
              type="primary"
              onClick={showCreateModal} 
              disabled={!isSDKAvailable}
              icon={<PlusOutlined />}
              style={{
                backgroundColor: '#7B2CBF',
                borderColor: '#7B2CBF',
              }}
            >
              New App
            </Button>
          }
        >
          {renderAppList()}
        </Card>
      </div>
      
      <CreateAppModal 
        visible={createModalVisible} 
        onCancel={hideCreateModal} 
        onCreate={handleCreateApp}
      />
    </div>
  );
} 