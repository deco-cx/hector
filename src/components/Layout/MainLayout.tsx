import React from 'react';
import { Layout } from 'antd';
import { useLocation } from 'react-router-dom';

const { Content, Footer } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content style={{ padding: '24px', maxWidth: '1200px', width: '100%', margin: '0 auto' }}>
        {children}
      </Content>
      <Footer style={{ textAlign: 'center' }}>
        Hector ©{new Date().getFullYear()} - AI App Builder
      </Footer>
    </Layout>
  );
} 