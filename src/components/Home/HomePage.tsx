import React, { useState, useEffect } from 'react';
import { Typography, Row, Col, Card, Button, List, Spin, Empty, message, Alert, Steps } from 'antd';
import { PlusOutlined, AppstoreOutlined, BookOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { CreateAppModal } from '../AppCreation/CreateAppModal';
import { useWebdraw } from '../../context/WebdrawContext';
import { AppConfig } from '../../types/webdraw';

const { Title, Paragraph } = Typography;

export function HomePage() {
  const navigate = useNavigate();
  const { service, isSDKAvailable } = useWebdraw();
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
    // Refresh the apps list after creating a new app
    fetchApps();
  };

  const handleEditApp = (appId: string) => {
    if (!isSDKAvailable) {
      message.warning('SDK is not available in this environment. Please test on webdraw.com');
      return;
    }
    navigate(`/edit/${appId}`);
  };

  const handleDeleteApp = async (appId: string) => {
    if (!isSDKAvailable) {
      message.warning('SDK is not available in this environment. Please test on webdraw.com');
      return;
    }
    
    try {
      await service.deleteApp(appId);
      message.success('App deleted successfully');
      // Refresh the list
      setApps(apps.filter(app => app.id !== appId));
    } catch (error) {
      console.error('Failed to delete app:', error);
      message.error('Failed to delete app');
    }
  };

  return (
    <div className="home-container p-4">
      <div className="text-center mb-12">
        <Title>Hector</Title>
        <div className="max-w-3xl mx-auto mt-8">
          <Steps
            direction="vertical"
            current={3}
            status="finish"
            className="text-left"
            items={[
              {
                title: <Title level={4} style={{ margin: 0 }}>Create No-Code AI Applications</Title>,
                description: <Paragraph className="mt-2">Build sophisticated AI-powered applications without writing a single line of code.</Paragraph>,
              },
              {
                title: <Title level={4} style={{ margin: 0 }}>Design Interactive Experiences</Title>,
                description: <Paragraph className="mt-2">Create forms, workflows, and interactive experiences with drag-and-drop simplicity.</Paragraph>,
              },
              {
                title: <Title level={4} style={{ margin: 0 }}>Leverage Powerful AI Models</Title>,
                description: <Paragraph className="mt-2">Connect to state-of-the-art AI models for text generation, image creation, and data analysis.</Paragraph>,
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
              <p>Please test this application at <a href="https://webdraw.com/apps/browser" target="_blank" rel="noopener noreferrer">https://webdraw.com/apps/browser</a></p>
            </div>
          }
          type="warning"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Row justify="center" className="my-12">
        <Col>
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
              borderColor: '#7B2CBF'
            }}
            size="large"
          >
            New App
          </Button>
        </Col>
      </Row>

      <Row justify="center">
        <Col xs={24} md={20} lg={18} xl={16}>
          <Card 
            title="My Apps" 
            className="h-full"
            extra={<Button type="link" onClick={showCreateModal} disabled={!isSDKAvailable}>New App</Button>}
          >
            {loading ? (
              <div className="flex justify-center items-center py-8">
                <Spin size="large" />
              </div>
            ) : !isSDKAvailable ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Empty 
                  description="SDK not available - cannot load apps" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                />
              </div>
            ) : apps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8">
                <Empty 
                  description="You don't have any apps yet" 
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                >
                  <Button type="primary" onClick={showCreateModal}>Create Your First App</Button>
                </Empty>
              </div>
            ) : (
              <List
                dataSource={apps}
                renderItem={(app) => (
                  <List.Item
                    key={app.id}
                    actions={[
                      <Button 
                        icon={<EditOutlined />} 
                        onClick={() => handleEditApp(app.id)}
                      >
                        Edit
                      </Button>,
                      <Button 
                        danger 
                        icon={<DeleteOutlined />}
                        onClick={() => handleDeleteApp(app.id)}
                      >
                        Delete
                      </Button>
                    ]}
                  >
                    <List.Item.Meta
                      title={app.name.includes('/') ? app.name.split('/').pop()?.replace('.json', '') : app.name}
                      description={`Template: ${app.template}, Style: ${app.style}`}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
      
      <CreateAppModal 
        visible={createModalVisible} 
        onClose={hideCreateModal} 
      />
    </div>
  );
} 