import React from 'react';
import { Layout, Typography, Button, List, Card } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useWebdraw } from '../contexts/WebdrawContext';
import { AppConfig } from '../types/webdraw';

const { Header, Content } = Layout;
const { Title, Text } = Typography;

export default function Dashboard() {
  const { service } = useWebdraw();
  const [apps, setApps] = React.useState<AppConfig[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadApps();
  }, []);

  async function loadApps() {
    try {
      const appList = await service.listApps();
      setApps(appList);
    } catch (error) {
      console.error('Failed to load apps:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#fff', padding: '0 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '100%' }}>
          <Title level={3} style={{ margin: 0 }}>Hector - AI App Builder</Title>
          <Button type="primary" icon={<PlusOutlined />}>
            New App
          </Button>
        </div>
      </Header>

      <Content style={{ padding: '24px' }}>
        <div style={{ marginBottom: '24px' }}>
          <Text>No-code interface for building AI-powered applications</Text>
        </div>

        <List
          grid={{ gutter: 16, xs: 1, sm: 2, md: 3, lg: 3, xl: 4, xxl: 4 }}
          dataSource={apps}
          loading={loading}
          renderItem={(app) => (
            <List.Item>
              <Card
                title={app.name}
                actions={[
                  <Button key="edit" type="link">Edit</Button>,
                  <Button key="run" type="link">Run</Button>,
                ]}
              >
                <Text type="secondary">Template: {app.template}</Text>
              </Card>
            </List.Item>
          )}
        />
      </Content>
    </Layout>
  );
} 