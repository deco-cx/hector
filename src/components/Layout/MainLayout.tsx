import React from 'react';
import { Layout } from 'antd';
import { useLocation } from 'react-router-dom';

const { Content, Footer } = Layout;

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const location = useLocation();
  const isAppEditor = location.pathname.includes('/edit/');
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Content 
        style={{ 
          padding: isAppEditor ? 0 : '16px', 
          maxWidth: '1200px', 
          width: '100%', 
          margin: '0 auto'
        }}
      >
        {children}
      </Content>
      <Footer style={{ 
        textAlign: 'center',
        padding: '12px 24px',
        background: '#f9f9f9',
        fontSize: '14px'
      }}>
        Hector ©{new Date().getFullYear()} - AI App Builder
      </Footer>
    </Layout>
  );
} 