import React from 'react';
import { Layout, Typography } from 'antd';
import { GithubOutlined } from '@ant-design/icons';

const { Header, Content, Footer } = Layout;
const { Title } = Typography;

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Title level={3} style={{ margin: 0, color: '#fff' }}>
          Hector
        </Title>
        <a
          href="https://github.com/yourusername/hector"
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#fff' }}
        >
          <GithubOutlined style={{ fontSize: '24px' }} />
        </a>
      </Header>
      <Content style={{ padding: '24px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        {children}
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Hector ©{new Date().getFullYear()} - AI App Builder
      </Footer>
    </Layout>
  );
} 